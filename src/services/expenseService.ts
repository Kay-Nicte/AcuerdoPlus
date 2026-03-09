import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Expense } from '../types';
import { historyService } from './historyService';
import { storageService } from './storageService';

export const expenseService = {
  async addExpense(data: {
    agreementId: string;
    minorId: string;
    type: 'ordinary' | 'extraordinary';
    description: string;
    amount: number;
    paidBy: string;
    paidByName: string;
    splitPercentage: { [uid: string]: number };
    date: Date;
    correctedBy?: string;
    correctionNote?: string;
  }): Promise<Expense> {
    const expenseRef = doc(collection(db, 'expenses'));
    const expense: Expense = {
      id: expenseRef.id,
      agreementId: data.agreementId,
      minorId: data.minorId,
      type: data.type,
      description: data.description,
      amount: data.amount,
      paidBy: data.paidBy,
      splitPercentage: data.splitPercentage,
      date: data.date,
      createdAt: new Date(),
      correctedBy: data.correctedBy,
    };

    const docData: any = Object.fromEntries(
      Object.entries(expense).filter(([_, v]) => v !== undefined)
    );
    docData.date = Timestamp.fromDate(data.date);
    docData.createdAt = Timestamp.fromDate(expense.createdAt);

    await setDoc(expenseRef, docData);

    const action = data.correctedBy
      ? `Gasto corregido: "${data.description}" (${data.amount}\u20AC)`
      : `Gasto anadido: "${data.description}" (${data.amount}\u20AC)`;

    await historyService.log(
      data.agreementId,
      action,
      data.paidBy,
      data.paidByName,
      'expense',
      expenseRef.id
    );

    return expense;
  },

  async getExpenses(
    agreementId: string,
    filters?: { minorId?: string; type?: 'ordinary' | 'extraordinary' }
  ): Promise<Expense[]> {
    const constraints: any[] = [
      where('agreementId', '==', agreementId),
    ];

    if (filters?.minorId) {
      constraints.push(where('minorId', '==', filters.minorId));
    }
    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }

    const q = query(collection(db, 'expenses'), ...constraints);
    const snapshot = await getDocs(q);

    const results = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        date: data.date?.toDate?.() ?? new Date(),
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      } as Expense;
    });

    return results.sort((a, b) => b.date.getTime() - a.date.getTime());
  },

  async getExpense(id: string): Promise<Expense | null> {
    const expenseDoc = await getDoc(doc(db, 'expenses', id));
    if (!expenseDoc.exists()) return null;
    const data = expenseDoc.data();
    return {
      ...data,
      date: data.date?.toDate?.() ?? new Date(),
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    } as Expense;
  },

  async correctExpense(
    originalId: string,
    correctionData: {
      agreementId: string;
      minorId: string;
      type: 'ordinary' | 'extraordinary';
      description: string;
      amount: number;
      paidBy: string;
      paidByName: string;
      splitPercentage: { [uid: string]: number };
      date: Date;
      correctionNote?: string;
    }
  ): Promise<Expense> {
    // Marcar el original como obsoleto
    await updateDoc(doc(db, 'expenses', originalId), { isObsolete: true });

    return this.addExpense({
      ...correctionData,
      correctedBy: originalId,
    });
  },

  async fixObsoleteExpenses(agreementId: string): Promise<void> {
    const expenses = await this.getExpenses(agreementId);
    for (const expense of expenses) {
      if (expense.correctedBy) {
        const originalRef = doc(db, 'expenses', expense.correctedBy);
        const originalDoc = await getDoc(originalRef);
        if (originalDoc.exists() && !originalDoc.data().isObsolete) {
          await updateDoc(originalRef, { isObsolete: true });
        }
      }
    }
  },

  async uploadReceipt(
    id: string,
    imageUri: string,
    agreementId: string
  ): Promise<string> {
    const path = `agreements/${agreementId}/expenses/${id}/receipt_${Date.now()}.jpg`;
    const url = await storageService.uploadFile(path, imageUri);
    await updateDoc(doc(db, 'expenses', id), { receiptUrl: url });
    return url;
  },

  async calculateBalance(agreementId: string): Promise<{ [uid: string]: number }> {
    const expenses = await this.getExpenses(agreementId);
    const balance: { [uid: string]: number } = {};

    // For each expense:
    // - The payer paid the full amount (credit)
    // - Each member owes their split percentage (debit)
    // Net balance = total paid - total owed
    // Positive = others owe you. Negative = you owe others.

    for (const expense of expenses) {
      // Credit the payer for the full amount
      if (!balance[expense.paidBy]) balance[expense.paidBy] = 0;
      balance[expense.paidBy] += expense.amount;

      // Debit each member their percentage
      for (const [uid, percentage] of Object.entries(expense.splitPercentage)) {
        if (!balance[uid]) balance[uid] = 0;
        balance[uid] -= (expense.amount * percentage) / 100;
      }
    }

    return balance;
  },

  /**
   * Returns a clear "who owes whom" summary.
   * Example: { fromUid: "maria", toUid: "antonio", amount: 30 }
   * means Maria owes Antonio 30 EUR.
   */
  async calculateDebt(agreementId: string): Promise<{
    balances: { [uid: string]: number };
    debt: { fromUid: string; toUid: string; amount: number } | null;
    settled: boolean;
  }> {
    const balances = await this.calculateBalance(agreementId);
    const entries = Object.entries(balances);

    if (entries.length < 2) {
      return { balances, debt: null, settled: true };
    }

    // With 2 members, one will be positive (owed money) and one negative (owes money)
    // Sort: negative first (debtor), positive second (creditor)
    entries.sort((a, b) => a[1] - b[1]);

    const [debtorUid, debtorBalance] = entries[0];
    const [creditorUid] = entries[entries.length - 1];

    // Round to 2 decimals
    const amount = Math.round(Math.abs(debtorBalance) * 100) / 100;

    if (amount < 0.01) {
      return { balances, debt: null, settled: true };
    }

    return {
      balances,
      debt: { fromUid: debtorUid, toUid: creditorUid, amount },
      settled: false,
    };
  },
};

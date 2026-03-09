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
import { Minor } from '../types';
import { historyService } from './historyService';

export const minorService = {
  async addMinor(
    agreementId: string,
    name: string,
    birthDate: Date | undefined,
    addedBy: string,
    addedByName: string
  ): Promise<Minor> {
    const minorRef = doc(collection(db, 'minors'));
    const minor: Minor = {
      id: minorRef.id,
      agreementId,
      name,
      birthDate,
      isActive: true,
      addedBy,
      createdAt: new Date(),
    };

    const firestoreData: any = {
      ...minor,
      createdAt: Timestamp.fromDate(minor.createdAt),
    };
    if (birthDate) {
      firestoreData.birthDate = Timestamp.fromDate(birthDate);
    } else {
      firestoreData.birthDate = null;
    }

    await setDoc(minorRef, firestoreData);

    await historyService.log(
      agreementId,
      `Menor "${name}" anadido al acuerdo`,
      addedBy,
      addedByName,
      'minor',
      minorRef.id
    );

    return minor;
  },

  async getMinors(agreementId: string): Promise<Minor[]> {
    const q = query(
      collection(db, 'minors'),
      where('agreementId', '==', agreementId),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        birthDate: data.birthDate?.toDate?.() ?? undefined,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      } as Minor;
    });
  },

  async getMinor(minorId: string): Promise<Minor | null> {
    const minorDoc = await getDoc(doc(db, 'minors', minorId));
    if (!minorDoc.exists()) return null;
    const data = minorDoc.data();
    return {
      ...data,
      birthDate: data.birthDate?.toDate?.() ?? undefined,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    } as Minor;
  },

  async updateMinor(
    minorId: string,
    data: {
      name: string;
      birthDate: Date | undefined;
      economicModel?: 'fixed' | 'shared' | 'mixed';
      fixedAmount?: number;
      fixedPayerUid?: string;
      sharedSplit?: { [uid: string]: number };
    },
    performedBy: string,
    performedByName: string
  ): Promise<void> {
    const minor = await this.getMinor(minorId);
    if (!minor) throw new Error('Menor no encontrado');

    const updateData: any = { name: data.name };
    if (data.birthDate) {
      updateData.birthDate = Timestamp.fromDate(data.birthDate);
    } else {
      updateData.birthDate = null;
    }
    if (data.economicModel) {
      updateData.economicModel = data.economicModel;
      if (data.fixedAmount !== undefined) updateData.fixedAmount = data.fixedAmount;
      if (data.fixedPayerUid) updateData.fixedPayerUid = data.fixedPayerUid;
      if (data.sharedSplit) updateData.sharedSplit = data.sharedSplit;
    } else {
      // Si se quita el modelo, limpiar los campos
      updateData.economicModel = null;
      updateData.fixedAmount = null;
      updateData.fixedPayerUid = null;
      updateData.sharedSplit = null;
    }

    await updateDoc(doc(db, 'minors', minorId), updateData);

    await historyService.log(
      minor.agreementId,
      `Menor "${minor.name}" editado`,
      performedBy,
      performedByName,
      'minor',
      minorId
    );
  },

  async deactivateMinor(
    minorId: string,
    performedBy: string,
    performedByName: string
  ): Promise<void> {
    const minor = await this.getMinor(minorId);
    if (!minor) throw new Error('Menor no encontrado');

    await updateDoc(doc(db, 'minors', minorId), { isActive: false });

    await historyService.log(
      minor.agreementId,
      `Menor "${minor.name}" desactivado`,
      performedBy,
      performedByName,
      'minor',
      minorId
    );
  },
};

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Subscription } from '../types';

export const subscriptionService = {
  async getSubscription(agreementId: string): Promise<Subscription> {
    const subDoc = await getDoc(doc(db, 'subscriptions', agreementId));
    if (subDoc.exists()) {
      const data = subDoc.data();
      return {
        ...data,
        startDate: data.startDate?.toDate?.() ?? undefined,
        endDate: data.endDate?.toDate?.() ?? undefined,
      } as Subscription;
    }
    return { agreementId, paidByUid: '', plan: 'free', autoRenew: false };
  },

  async activateSubscription(
    agreementId: string,
    paidByUid: string,
    plan: 'monthly' | 'quarterly' | 'annual'
  ): Promise<void> {
    const startDate = new Date();
    const endDate = new Date();
    if (plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    await setDoc(doc(db, 'subscriptions', agreementId), {
      agreementId,
      paidByUid,
      plan: 'premium',
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      autoRenew: true,
    });
  },

  async cancelSubscription(agreementId: string): Promise<void> {
    await setDoc(doc(db, 'subscriptions', agreementId), {
      agreementId,
      paidByUid: '',
      plan: 'free',
      autoRenew: false,
    });
  },
};

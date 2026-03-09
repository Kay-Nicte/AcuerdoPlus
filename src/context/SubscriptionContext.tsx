import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { useAgreement } from './AgreementContext';
import { Subscription } from '../types';

interface SubscriptionContextData {
  subscription: Subscription | null;
  isPremium: boolean;
  loading: boolean;
  activateSubscription: (plan: 'monthly' | 'quarterly' | 'annual') => Promise<void>;
  cancelSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextData>(
  {} as SubscriptionContextData
);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentAgreement } = useAgreement();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentAgreement) {
      loadSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [currentAgreement]);

  const loadSubscription = async () => {
    if (!currentAgreement) return;
    try {
      setLoading(true);
      const subDoc = await getDoc(doc(db, 'subscriptions', currentAgreement.id));
      if (subDoc.exists()) {
        const data = subDoc.data();
        setSubscription({
          ...data,
          startDate: data.startDate?.toDate?.() ?? undefined,
          endDate: data.endDate?.toDate?.() ?? undefined,
        } as Subscription);
      } else {
        setSubscription({
          agreementId: currentAgreement.id,
          paidByUid: '',
          plan: 'free',
          autoRenew: false,
        });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription({
        agreementId: currentAgreement?.id || '',
        paidByUid: '',
        plan: 'free',
        autoRenew: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const isPremium = subscription?.plan === 'premium' &&
    (!subscription.endDate || subscription.endDate > new Date());

  const activateSubscription = async (plan: 'monthly' | 'quarterly' | 'annual') => {
    if (!user) throw new Error('Usuario no autenticado');
    if (!currentAgreement) throw new Error('No hay acuerdo activo');

    const startDate = new Date();
    const endDate = new Date();
    if (plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    await setDoc(doc(db, 'subscriptions', currentAgreement.id), {
      agreementId: currentAgreement.id,
      paidByUid: user.uid,
      plan: 'premium',
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      autoRenew: true,
    });
    await loadSubscription();
  };

  const cancelSubscription = async () => {
    if (!currentAgreement) throw new Error('No hay acuerdo activo');

    await setDoc(doc(db, 'subscriptions', currentAgreement.id), {
      agreementId: currentAgreement.id,
      paidByUid: '',
      plan: 'free',
      autoRenew: false,
    });
    await loadSubscription();
  };

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isPremium,
        loading,
        activateSubscription,
        cancelSubscription,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);

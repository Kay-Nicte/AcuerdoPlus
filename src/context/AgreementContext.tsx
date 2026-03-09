import React, { createContext, useState, useEffect, useContext } from 'react';
import { Agreement } from '../types';
import { agreementService } from '../services/agreementService';
import { useAuth } from './AuthContext';

interface AgreementContextData {
  currentAgreement: Agreement | null;
  agreements: Agreement[];
  loading: boolean;
  createAgreement: (economicModel: 'fixed' | 'shared' | 'mixed') => Promise<{ agreementId: string; inviteCode: string }>;
  joinAgreement: (inviteCode: string) => Promise<string>;
  selectAgreement: (agreementId: string) => Promise<void>;
  refreshAgreement: () => Promise<void>;
  completeOnboarding: (agreementId: string) => Promise<void>;
}

const AgreementContext = createContext<AgreementContextData>({} as AgreementContextData);

export const AgreementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentAgreement, setCurrentAgreement] = useState<Agreement | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserAgreements();
    } else {
      setCurrentAgreement(null);
      setAgreements([]);
      setLoading(false);
    }
  }, [user]);

  const loadUserAgreements = async () => {
    if (!user) {
      setAgreements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userAgreements = await agreementService.getUserAgreements(user.uid);
      setAgreements(userAgreements || []); // Asegurar que siempre sea un array

      // Si solo tiene un acuerdo, seleccionarlo automáticamente
      if (userAgreements && userAgreements.length === 1) {
        setCurrentAgreement(userAgreements[0]);
      }
    } catch (error) {
      console.error('Error cargando acuerdos:', error);
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  };

  const createAgreement = async (economicModel: 'fixed' | 'shared' | 'mixed') => {
    if (!user) throw new Error('Usuario no autenticado');

    const result = await agreementService.createAgreement(user.uid, economicModel);
    // Don't auto-load here — let the onboarding flow complete first
    return result;
  };

  const joinAgreement = async (inviteCode: string): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');

    const agreementId = await agreementService.joinAgreementByCode(user.uid, inviteCode);
    // Don't auto-load here — let WelcomePremium flow complete first
    return agreementId;
  };

  const selectAgreement = async (agreementId: string) => {
    const agreement = await agreementService.getAgreement(agreementId);
    setCurrentAgreement(agreement);
  };

  const refreshAgreement = async () => {
    if (currentAgreement) {
      const updated = await agreementService.getAgreement(currentAgreement.id);
      setCurrentAgreement(updated);
    }
  };

  const completeOnboarding = async (agreementId: string) => {
    const agreement = await agreementService.getAgreement(agreementId);
    setCurrentAgreement(agreement);
    if (user) {
      const userAgreements = await agreementService.getUserAgreements(user.uid);
      setAgreements(userAgreements || []);
    }
  };

  return (
    <AgreementContext.Provider
      value={{
        currentAgreement,
        agreements,
        loading,
        createAgreement,
        joinAgreement,
        selectAgreement,
        refreshAgreement,
        completeOnboarding,
      }}
    >
      {children}
    </AgreementContext.Provider>
  );
};

export const useAgreement = () => useContext(AgreementContext);
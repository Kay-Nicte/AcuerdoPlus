import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  arrayUnion,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Agreement } from '../types';

// Generar código único de 6 caracteres
const generateAgreementCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const agreementService = {
  // Crear nuevo acuerdo
  async createAgreement(
    creatorUid: string,
    economicModel: 'fixed' | 'shared' | 'mixed'
  ): Promise<{ agreementId: string; inviteCode: string }> {
    try {
      const agreementRef = doc(collection(db, 'agreements'));
      const inviteCode = generateAgreementCode();

      const agreementData: Agreement = {
        id: agreementRef.id,
        createdBy: creatorUid,
        members: [creatorUid],
        createdAt: new Date(),
        economicModel,
        approvalMode: false,
      };

      await setDoc(agreementRef, {
        ...agreementData,
        inviteCode,
        createdAt: Timestamp.fromDate(agreementData.createdAt),
      });

      return {
        agreementId: agreementRef.id,
        inviteCode,
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Unirse a un acuerdo con código
  async joinAgreementByCode(uid: string, inviteCode: string): Promise<string> {
    try {
      // Buscar acuerdo por código
      const q = query(
        collection(db, 'agreements'),
        where('inviteCode', '==', inviteCode.toUpperCase())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Código inválido');
      }

      const agreementDoc = querySnapshot.docs[0];
      const agreement = agreementDoc.data();

      // Verificar que no tenga ya 2 miembros
      if (agreement.members.length >= 2) {
        throw new Error('Este acuerdo ya tiene 2 miembros');
      }

      // Verificar que el usuario no esté ya en el acuerdo
      if (agreement.members.includes(uid)) {
        throw new Error('Ya eres miembro de este acuerdo');
      }

      // Añadir al usuario al acuerdo
      await updateDoc(doc(db, 'agreements', agreementDoc.id), {
        members: arrayUnion(uid),
      });

      return agreementDoc.id;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Obtener acuerdo por ID
  async getAgreement(agreementId: string): Promise<Agreement | null> {
    try {
      const agreementDoc = await getDoc(doc(db, 'agreements', agreementId));
      if (agreementDoc.exists()) {
        const data = agreementDoc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Agreement;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Obtener acuerdos del usuario
  async getUserAgreements(uid: string): Promise<Agreement[]> {
    try {
      const q = query(
        collection(db, 'agreements'),
        where('members', 'array-contains', uid)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Agreement;
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Actualizar modelo económico
  async updateEconomicModel(
    agreementId: string,
    economicModel: 'fixed' | 'shared' | 'mixed'
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'agreements', agreementId), {
        economicModel,
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Obtener código de invitación
  async getInviteCode(agreementId: string): Promise<string | null> {
    try {
      const agreementDoc = await getDoc(doc(db, 'agreements', agreementId));
      if (agreementDoc.exists()) {
        return agreementDoc.data().inviteCode || null;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Activar/desactivar modo aprobación
  async toggleApprovalMode(agreementId: string, enabled: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'agreements', agreementId), {
        approvalMode: enabled,
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  async setMemberColor(agreementId: string, uid: string, color: string): Promise<void> {
    const agreementDoc = await getDoc(doc(db, 'agreements', agreementId));
    if (!agreementDoc.exists()) throw new Error('Acuerdo no encontrado');
    const data = agreementDoc.data();
    const memberColors = data.memberColors || {};
    memberColors[uid] = color;
    await updateDoc(doc(db, 'agreements', agreementId), { memberColors });
  },
};
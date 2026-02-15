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
import { Maintenance } from '../types';
import { historyService } from './historyService';
import { notificationService } from './notificationService';
import { storageService } from './storageService';

export const maintenanceService = {
  async createMaintenance(data: {
    agreementId: string;
    minorId: string;
    month: string;
    amount: number;
    payerUid: string;
    createdByName: string;
    memberUids?: string[];
  }): Promise<Maintenance> {
    const maintenanceRef = doc(collection(db, 'maintenance'));
    const maintenance: Maintenance = {
      id: maintenanceRef.id,
      agreementId: data.agreementId,
      minorId: data.minorId,
      month: data.month,
      amount: data.amount,
      payerUid: data.payerUid,
      status: 'pending',
      createdAt: new Date(),
    };

    await setDoc(maintenanceRef, {
      ...maintenance,
      createdAt: Timestamp.fromDate(maintenance.createdAt),
    });

    await historyService.log(
      data.agreementId,
      `Manutencion de ${data.month} creada por ${data.amount}\u20AC`,
      data.payerUid,
      data.createdByName,
      'maintenance',
      maintenanceRef.id
    );

    if (data.memberUids) {
      const recipientUid = data.memberUids.find((uid) => uid !== data.payerUid);
      if (recipientUid) {
        await notificationService.send({
          agreementId: data.agreementId,
          recipientUid,
          type: 'maintenance_reminder',
          title: 'Nueva manutención',
          body: `Se ha registrado una manutención de ${data.amount}\u20AC para ${data.month}`,
          entityType: 'maintenance',
          entityId: maintenanceRef.id,
        });
      }
    }

    return maintenance;
  },

  async getMaintenanceRecords(
    agreementId: string,
    minorId?: string
  ): Promise<Maintenance[]> {
    const constraints: any[] = [
      where('agreementId', '==', agreementId),
    ];

    if (minorId) {
      constraints.push(where('minorId', '==', minorId));
    }

    const q = query(collection(db, 'maintenance'), ...constraints);
    const snapshot = await getDocs(q);

    const results = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        paidAt: data.paidAt?.toDate?.() ?? undefined,
      } as Maintenance;
    });

    return results.sort((a, b) => b.month.localeCompare(a.month));
  },

  async getMaintenance(id: string): Promise<Maintenance | null> {
    const maintenanceDoc = await getDoc(doc(db, 'maintenance', id));
    if (!maintenanceDoc.exists()) return null;
    const data = maintenanceDoc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      paidAt: data.paidAt?.toDate?.() ?? undefined,
    } as Maintenance;
  },

  async markAsPaid(
    id: string,
    payerUid: string,
    payerName: string,
    proofUrl?: string
  ): Promise<void> {
    const record = await this.getMaintenance(id);
    if (!record) throw new Error('Registro no encontrado');
    if (record.status === 'paid') {
      throw new Error('Esta manutención ya está marcada como pagada');
    }
    if (record.payerUid !== payerUid) {
      throw new Error('Solo el pagador puede marcar como pagada');
    }

    const updateData: any = {
      status: 'paid',
      paidAt: Timestamp.fromDate(new Date()),
    };
    if (proofUrl) updateData.proofUrl = proofUrl;

    await updateDoc(doc(db, 'maintenance', id), updateData);

    await historyService.log(
      record.agreementId,
      `Manutencion de ${record.month} marcada como pagada`,
      payerUid,
      payerName,
      'maintenance',
      id
    );
  },

  async uploadProof(
    id: string,
    imageUri: string,
    agreementId: string
  ): Promise<string> {
    const path = `agreements/${agreementId}/maintenance/${id}/proof_${Date.now()}.jpg`;
    const url = await storageService.uploadFile(path, imageUri);
    await updateDoc(doc(db, 'maintenance', id), { proofUrl: url });
    return url;
  },
};

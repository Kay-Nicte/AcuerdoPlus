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
import { Authorization } from '../types';
import { historyService } from './historyService';
import { notificationService } from './notificationService';
import { storageService } from './storageService';

export const authorizationService = {
  async createAuthorization(data: {
    agreementId: string;
    minorId: string;
    activity: string;
    description: string;
    memberUids: string[];
    createdBy: string;
    createdByName: string;
  }): Promise<Authorization> {
    const authRef = doc(collection(db, 'authorizations'));

    const authorizations: { [uid: string]: boolean | null } = {};
    data.memberUids.forEach((uid) => {
      authorizations[uid] = null;
    });

    const authorization: Authorization = {
      id: authRef.id,
      agreementId: data.agreementId,
      minorId: data.minorId,
      activity: data.activity,
      description: data.description,
      documentUrls: [],
      authorizations,
      status: 'pending',
      addedToCalendar: false,
      createdBy: data.createdBy,
      createdAt: new Date(),
    };

    await setDoc(authRef, {
      ...authorization,
      createdAt: Timestamp.fromDate(authorization.createdAt),
    });

    await historyService.log(
      data.agreementId,
      `Autorizacion "${data.activity}" creada`,
      data.createdBy,
      data.createdByName,
      'authorization',
      authRef.id
    );

    const recipientUid = data.memberUids.find((uid) => uid !== data.createdBy);
    if (recipientUid) {
      await notificationService.send({
        agreementId: data.agreementId,
        recipientUid,
        type: 'authorization_request',
        title: 'Nueva autorización',
        body: `${data.createdByName} ha solicitado autorización para "${data.activity}"`,
        entityType: 'authorization',
        entityId: authRef.id,
      });
    }

    return authorization;
  },

  async getAuthorizations(
    agreementId: string,
    status?: 'pending' | 'approved' | 'rejected'
  ): Promise<Authorization[]> {
    const constraints: any[] = [
      where('agreementId', '==', agreementId),
    ];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    const q = query(collection(db, 'authorizations'), ...constraints);
    const snapshot = await getDocs(q);

    const results = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        revokedAt: data.revokedAt?.toDate?.() ?? undefined,
      } as Authorization;
    });

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getAuthorization(id: string): Promise<Authorization | null> {
    const authDoc = await getDoc(doc(db, 'authorizations', id));
    if (!authDoc.exists()) return null;
    const data = authDoc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      revokedAt: data.revokedAt?.toDate?.() ?? undefined,
    } as Authorization;
  },

  async respond(
    id: string,
    uid: string,
    userName: string,
    approved: boolean
  ): Promise<void> {
    const auth = await this.getAuthorization(id);
    if (!auth) throw new Error('Autorizacion no encontrada');

    const updatedAuthorizations = { ...auth.authorizations };
    updatedAuthorizations[uid] = approved;

    // Determine overall status
    const values = Object.values(updatedAuthorizations);
    let newStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    if (values.every((v) => v === true)) {
      newStatus = 'approved';
    } else if (values.some((v) => v === false)) {
      newStatus = 'rejected';
    }

    await updateDoc(doc(db, 'authorizations', id), {
      authorizations: updatedAuthorizations,
      status: newStatus,
    });

    await historyService.log(
      auth.agreementId,
      `Autorizacion "${auth.activity}" ${approved ? 'autorizada' : 'denegada'} por ${userName}`,
      uid,
      userName,
      'authorization',
      id
    );
  },

  async requestRevoke(id: string, uid: string, userName: string): Promise<void> {
    const auth = await this.getAuthorization(id);
    if (!auth) throw new Error('Autorización no encontrada');
    if (auth.status !== 'approved') throw new Error('Solo se pueden revocar autorizaciones aprobadas');

    if (auth.revocationRequestedBy && auth.revocationRequestedBy !== uid) {
      // El otro miembro ya solicitó revocar → ambos de acuerdo → revocar
      await updateDoc(doc(db, 'authorizations', id), {
        revokedAt: Timestamp.fromDate(new Date()),
        status: 'rejected',
        revocationRequestedBy: null,
      });

      await historyService.log(
        auth.agreementId,
        `Autorización "${auth.activity}" revocada (ambos de acuerdo)`,
        uid,
        userName,
        'authorization',
        id
      );
    } else if (!auth.revocationRequestedBy) {
      // Primer miembro solicita revocar → pendiente del otro
      await updateDoc(doc(db, 'authorizations', id), {
        revocationRequestedBy: uid,
      });

      await historyService.log(
        auth.agreementId,
        `${userName} solicitó revocar autorización "${auth.activity}"`,
        uid,
        userName,
        'authorization',
        id
      );
    }
  },

  async cancelRevoke(id: string, uid: string, userName: string): Promise<void> {
    const auth = await this.getAuthorization(id);
    if (!auth) throw new Error('Autorización no encontrada');

    if (auth.revocationRequestedBy === uid) {
      await updateDoc(doc(db, 'authorizations', id), {
        revocationRequestedBy: null,
      });

      await historyService.log(
        auth.agreementId,
        `${userName} canceló solicitud de revocación de "${auth.activity}"`,
        uid,
        userName,
        'authorization',
        id
      );
    }
  },

  async uploadDocument(
    id: string,
    fileUri: string,
    agreementId: string
  ): Promise<string> {
    const path = `agreements/${agreementId}/authorizations/${id}/doc_${Date.now()}`;
    const url = await storageService.uploadFile(path, fileUri);

    const auth = await this.getAuthorization(id);
    if (auth) {
      await updateDoc(doc(db, 'authorizations', id), {
        documentUrls: [...auth.documentUrls, url],
      });
    }

    return url;
  },

  async linkToCalendar(id: string, calendarEventId: string): Promise<void> {
    await updateDoc(doc(db, 'authorizations', id), {
      addedToCalendar: true,
      calendarEventId,
    });
  },
};

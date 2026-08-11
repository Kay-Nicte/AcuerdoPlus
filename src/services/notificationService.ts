import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  updateDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppNotification } from '../types';
import { pushService } from './pushService';

export const notificationService = {
  async send(data: {
    agreementId: string;
    recipientUid: string;
    type: AppNotification['type'];
    title: string;
    body: string;
    entityType: AppNotification['entityType'];
    entityId: string;
  }): Promise<void> {
    try {
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        id: notifRef.id,
        agreementId: data.agreementId,
        recipientUid: data.recipientUid,
        type: data.type,
        title: data.title,
        body: data.body,
        read: false,
        entityType: data.entityType,
        entityId: data.entityId,
        createdAt: Timestamp.fromDate(new Date()),
      });

      await pushService.sendPushToUser(data.recipientUid, data.title, data.body);
    } catch (error: any) {
      console.error('Error sending notification:', error.message);
    }
  },

  async getNotifications(
    agreementId: string,
    uid: string,
    maxResults: number = 50
  ): Promise<AppNotification[]> {
    const q = query(
      collection(db, 'notifications'),
      where('agreementId', '==', agreementId),
      where('recipientUid', '==', uid)
    );
    const snapshot = await getDocs(q);

    const results = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      } as AppNotification;
    });

    return results
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, maxResults);
  },

  async getUnreadCount(agreementId: string, uid: string): Promise<number> {
    const q = query(
      collection(db, 'notifications'),
      where('agreementId', '==', agreementId),
      where('recipientUid', '==', uid),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  async markAsRead(id: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  },

  async markAllAsRead(agreementId: string, uid: string): Promise<void> {
    const q = query(
      collection(db, 'notifications'),
      where('agreementId', '==', agreementId),
      where('recipientUid', '==', uid),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  },
};

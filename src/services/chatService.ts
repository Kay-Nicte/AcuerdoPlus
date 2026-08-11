import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChatMessage } from '../types';
import { notificationService } from './notificationService';

export const chatService = {
  async sendMessage(
    agreementId: string,
    senderUid: string,
    senderName: string,
    message: string,
    memberUids?: string[]
  ): Promise<ChatMessage> {
    // Check if chat is locked
    const lockDoc = await getDoc(doc(db, 'chatLocks', agreementId));
    if (lockDoc.exists() && lockDoc.data()?.lockedBy) {
      throw new Error('El chat esta bloqueado');
    }

    const msgRef = doc(collection(db, 'chatMessages'));
    const chatMessage: ChatMessage = {
      id: msgRef.id,
      agreementId,
      senderUid,
      senderName,
      message,
      timestamp: new Date(),
      hiddenFor: [],
    };

    await setDoc(msgRef, {
      ...chatMessage,
      timestamp: Timestamp.fromDate(chatMessage.timestamp),
    });

    if (memberUids) {
      const recipientUid = memberUids.find((uid) => uid !== senderUid);
      if (recipientUid) {
        const muteStatus = await this.getMuteStatus(agreementId, recipientUid);
        if (muteStatus.muted) {
          return chatMessage;
        }

        await notificationService.send({
          agreementId,
          recipientUid,
          type: 'new_message',
          title: 'Nuevo mensaje',
          body: `${senderName}: ${message.length > 80 ? message.substring(0, 80) + '...' : message}`,
          entityType: 'chat',
          entityId: msgRef.id,
        });
      }
    }

    return chatMessage;
  },

  async getMessages(
    agreementId: string,
    maxResults: number = 50
  ): Promise<ChatMessage[]> {
    const q = query(
      collection(db, 'chatMessages'),
      where('agreementId', '==', agreementId),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate?.() ?? new Date(),
      } as ChatMessage;
    });
  },

  async hideMessage(messageId: string, uid: string): Promise<void> {
    await updateDoc(doc(db, 'chatMessages', messageId), {
      hiddenFor: arrayUnion(uid),
    });
  },

  // --- Chat lock/unlock ---
  async lockChat(agreementId: string, uid: string): Promise<void> {
    await setDoc(doc(db, 'chatLocks', agreementId), {
      lockedBy: uid,
      lockedAt: Timestamp.fromDate(new Date()),
    });
  },

  async unlockChat(agreementId: string): Promise<void> {
    await setDoc(doc(db, 'chatLocks', agreementId), {
      lockedBy: null,
      lockedAt: null,
    });
  },

  async getChatLock(agreementId: string): Promise<{ lockedBy: string | null }> {
    const lockDoc = await getDoc(doc(db, 'chatLocks', agreementId));
    if (!lockDoc.exists()) return { lockedBy: null };
    return { lockedBy: lockDoc.data()?.lockedBy || null };
  },

  subscribeToChatLock(
    agreementId: string,
    callback: (lockedBy: string | null) => void
  ): () => void {
    return onSnapshot(doc(db, 'chatLocks', agreementId), (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
      } else {
        callback(snapshot.data()?.lockedBy || null);
      }
    });
  },

  // --- Mute chat notifications ---
  async muteChat(agreementId: string, uid: string, duration: '8h' | '7d' | 'forever'): Promise<void> {
    let mutedUntil: Date | null = null;
    if (duration === '8h') {
      mutedUntil = new Date(Date.now() + 8 * 60 * 60 * 1000);
    } else if (duration === '7d') {
      mutedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    await setDoc(doc(db, 'chatMutes', `${agreementId}_${uid}`), {
      agreementId,
      uid,
      mutedForever: duration === 'forever',
      mutedUntil: mutedUntil ? Timestamp.fromDate(mutedUntil) : null,
    });
  },

  async unmuteChat(agreementId: string, uid: string): Promise<void> {
    await setDoc(doc(db, 'chatMutes', `${agreementId}_${uid}`), {
      agreementId,
      uid,
      mutedForever: false,
      mutedUntil: null,
    });
  },

  async getMuteStatus(agreementId: string, uid: string): Promise<{ muted: boolean; mutedUntil: Date | null; mutedForever: boolean }> {
    const muteDoc = await getDoc(doc(db, 'chatMutes', `${agreementId}_${uid}`));
    if (!muteDoc.exists()) return { muted: false, mutedUntil: null, mutedForever: false };

    const data = muteDoc.data();
    const mutedForever = !!data.mutedForever;
    const mutedUntil = data.mutedUntil?.toDate?.() ?? null;
    const muted = mutedForever || (mutedUntil ? mutedUntil > new Date() : false);

    return { muted, mutedUntil, mutedForever };
  },

  subscribeToMuteStatus(
    agreementId: string,
    uid: string,
    callback: (status: { muted: boolean; mutedUntil: Date | null; mutedForever: boolean }) => void
  ): () => void {
    return onSnapshot(doc(db, 'chatMutes', `${agreementId}_${uid}`), (snapshot) => {
      if (!snapshot.exists()) {
        callback({ muted: false, mutedUntil: null, mutedForever: false });
        return;
      }
      const data = snapshot.data();
      const mutedForever = !!data.mutedForever;
      const mutedUntil = data.mutedUntil?.toDate?.() ?? null;
      const muted = mutedForever || (mutedUntil ? mutedUntil > new Date() : false);
      callback({ muted, mutedUntil, mutedForever });
    });
  },

  subscribeToMessages(
    agreementId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const q = query(
      collection(db, 'chatMessages'),
      where('agreementId', '==', agreementId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          timestamp: data.timestamp?.toDate?.() ?? new Date(),
        } as ChatMessage;
      });
      callback(messages);
    });
  },
};

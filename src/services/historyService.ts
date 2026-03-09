import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { HistoryEntry } from '../types';

export const historyService = {
  async log(
    agreementId: string,
    action: string,
    performedBy: string,
    performedByName: string,
    entityType: HistoryEntry['entityType'],
    entityId: string,
    details?: any
  ): Promise<void> {
    try {
      const entryRef = doc(collection(db, 'history'));
      await setDoc(entryRef, {
        id: entryRef.id,
        agreementId,
        action,
        performedBy,
        performedByName,
        entityType,
        entityId,
        timestamp: Timestamp.fromDate(new Date()),
        details: details || null,
      });
    } catch (error: any) {
      console.error('Error logging history:', error.message);
    }
  },

  async getHistory(
    agreementId: string,
    entityTypeFilter?: HistoryEntry['entityType'],
    maxResults: number = 50
  ): Promise<HistoryEntry[]> {
    try {
      const constraints: any[] = [
        where('agreementId', '==', agreementId),
      ];

      if (entityTypeFilter) {
        constraints.push(where('entityType', '==', entityTypeFilter));
      }

      const q = query(collection(db, 'history'), ...constraints);
      const snapshot = await getDocs(q);

      const results = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          timestamp: data.timestamp?.toDate?.() ?? new Date(),
        } as HistoryEntry;
      });

      return results
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, maxResults);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
};

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
import { CalendarEvent } from '../types';
import { historyService } from './historyService';
import { notificationService } from './notificationService';
import { expandPattern } from '../utils/patternExpander';

export const calendarService = {
  async addEvent(data: {
    agreementId: string;
    minorId: string;
    title: string;
    startDate: Date;
    endDate: Date;
    assignedTo: string;
    createdBy: string;
    createdByName: string;
    requiresApproval: boolean;
    isPattern?: boolean;
    patternRule?: string;
    memberUids?: string[];
  }): Promise<CalendarEvent> {
    const eventRef = doc(collection(db, 'calendarEvents'));
    const expiresAt = data.requiresApproval ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined;

    const event: CalendarEvent = {
      id: eventRef.id,
      agreementId: data.agreementId,
      minorId: data.minorId,
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      assignedTo: data.assignedTo,
      isPattern: data.isPattern || false,
      patternRule: data.patternRule,
      requiresApproval: data.requiresApproval,
      approvalStatus: data.requiresApproval ? 'pending' : undefined,
      approvalExpiresAt: expiresAt,
      createdBy: data.createdBy,
      createdAt: new Date(),
    };

    const docData: any = Object.fromEntries(
      Object.entries(event).filter(([_, v]) => v !== undefined)
    );
    docData.startDate = Timestamp.fromDate(data.startDate);
    docData.endDate = Timestamp.fromDate(data.endDate);
    docData.createdAt = Timestamp.fromDate(event.createdAt);
    if (expiresAt) {
      docData.approvalExpiresAt = Timestamp.fromDate(expiresAt);
    }

    await setDoc(eventRef, docData);

    await historyService.log(
      data.agreementId,
      `Evento "${data.title}" creado`,
      data.createdBy,
      data.createdByName,
      'calendar',
      eventRef.id
    );

    if (data.requiresApproval && data.memberUids) {
      const recipientUid = data.memberUids.find((uid) => uid !== data.createdBy);
      if (recipientUid) {
        await notificationService.send({
          agreementId: data.agreementId,
          recipientUid,
          type: 'approval_request',
          title: 'Solicitud de aprobación',
          body: `${data.createdByName} ha creado el evento "${data.title}" y necesita tu aprobación`,
          entityType: 'calendar',
          entityId: eventRef.id,
        });
      }
    }

    return event;
  },

  async getEvents(
    agreementId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    const constraints: any[] = [
      where('agreementId', '==', agreementId),
    ];

    const q = query(collection(db, 'calendarEvents'), ...constraints);
    const snapshot = await getDocs(q);

    const now = new Date();
    let results = snapshot.docs.map((d) => {
      const data = d.data();
      const evt = {
        ...data,
        startDate: data.startDate?.toDate?.() ?? new Date(),
        endDate: data.endDate?.toDate?.() ?? new Date(),
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        approvalExpiresAt: data.approvalExpiresAt?.toDate?.() ?? undefined,
      } as CalendarEvent;
      // Marcar como expirada si corresponde
      if (evt.approvalStatus === 'pending' && evt.approvalExpiresAt && evt.approvalExpiresAt < now) {
        evt.approvalStatus = 'rejected';
      }
      return evt;
    });

    // Separate pattern templates from regular events
    const patterns = results.filter((e) => e.isPattern === true);
    const regular = results.filter((e) => e.isPattern !== true);

    // Expand patterns into instances (current month ± 1 month)
    const rangeStart = startDate || new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const rangeEnd = endDate || new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const expanded: CalendarEvent[] = [];
    for (const pattern of patterns) {
      expanded.push(...expandPattern(pattern, rangeStart, rangeEnd));
    }

    // Merge regular events with expanded pattern instances
    let merged = [...regular, ...expanded];

    if (startDate) {
      merged = merged.filter((e) => e.startDate >= startDate);
    }
    if (endDate) {
      merged = merged.filter((e) => e.startDate <= endDate);
    }

    return merged.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  },

  async getEvent(id: string): Promise<CalendarEvent | null> {
    const eventDoc = await getDoc(doc(db, 'calendarEvents', id));
    if (!eventDoc.exists()) return null;
    const data = eventDoc.data();
    const evt = {
      ...data,
      startDate: data.startDate?.toDate?.() ?? new Date(),
      endDate: data.endDate?.toDate?.() ?? new Date(),
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      approvalExpiresAt: data.approvalExpiresAt?.toDate?.() ?? undefined,
    } as CalendarEvent;
    if (evt.approvalStatus === 'pending' && evt.approvalExpiresAt && evt.approvalExpiresAt < new Date()) {
      evt.approvalStatus = 'rejected';
    }
    return evt;
  },

  async respondToEvent(
    id: string,
    uid: string,
    userName: string,
    approved: boolean,
    reason?: string
  ): Promise<void> {
    const event = await this.getEvent(id);
    if (!event) throw new Error('Evento no encontrado');

    const updateData: any = {
      approvalStatus: approved ? 'approved' : 'rejected',
      approvedBy: uid,
    };
    if (!approved && reason) {
      updateData.rejectionReason = reason;
    }
    await updateDoc(doc(db, 'calendarEvents', id), updateData);

    await historyService.log(
      event.agreementId,
      `Evento "${event.title}" ${approved ? 'aprobado' : 'rechazado'}${reason ? `: ${reason}` : ''}`,
      uid,
      userName,
      'calendar',
      id
    );

    await notificationService.send({
      agreementId: event.agreementId,
      recipientUid: event.createdBy,
      type: 'approval_response',
      title: approved ? 'Evento aprobado' : 'Evento rechazado',
      body: `${userName} ha ${approved ? 'aprobado' : 'rechazado'} el evento "${event.title}"${reason ? `: ${reason}` : ''}`,
      entityType: 'calendar',
      entityId: id,
    });
  },

  async getPendingApprovals(
    agreementId: string,
    uid: string
  ): Promise<CalendarEvent[]> {
    const q = query(
      collection(db, 'calendarEvents'),
      where('agreementId', '==', agreementId),
      where('approvalStatus', '==', 'pending'),
      where('createdBy', '!=', uid)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        startDate: data.startDate?.toDate?.() ?? new Date(),
        endDate: data.endDate?.toDate?.() ?? new Date(),
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      } as CalendarEvent;
    });
  },
};

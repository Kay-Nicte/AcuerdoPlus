jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('../notificationService', () => ({ notificationService: { send: jest.fn() } }));

const mockDocStore = new Map<string, any>();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn((_db: any, _collection: string, id?: string) => ({
    id: id ?? `generated_${mockDocStore.size}`,
  })),
  setDoc: jest.fn(async (ref: { id: string }, data: any) => {
    mockDocStore.set(ref.id, { ...data });
  }),
  getDoc: jest.fn(async (ref: { id: string }) => {
    const data = mockDocStore.get(ref.id);
    return {
      exists: () => data !== undefined,
      data: () => data,
    };
  }),
  updateDoc: jest.fn(async (ref: { id: string }, data: any) => {
    const existing = mockDocStore.get(ref.id) ?? {};
    mockDocStore.set(ref.id, { ...existing, ...data });
  }),
  arrayUnion: jest.fn((v: any) => ({ __arrayUnion: v })),
  arrayRemove: jest.fn((v: any) => ({ __arrayRemove: v })),
  onSnapshot: jest.fn(() => () => {}),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(async () => ({ docs: [] })),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
  },
}));

import { chatService } from '../chatService';
import { notificationService } from '../notificationService';

describe('chatService mute status', () => {
  beforeEach(() => {
    mockDocStore.clear();
    jest.clearAllMocks();
  });

  it('reports not muted when no mute document exists', async () => {
    const status = await chatService.getMuteStatus('agr1', 'uidB');
    expect(status).toEqual({ muted: false, mutedUntil: null, mutedForever: false });
  });

  it('reports muted while an 8h/7d mute has not expired yet', async () => {
    await chatService.muteChat('agr1', 'uidB', '7d');
    const status = await chatService.getMuteStatus('agr1', 'uidB');

    expect(status.muted).toBe(true);
    expect(status.mutedForever).toBe(false);
    expect(status.mutedUntil).toBeInstanceOf(Date);
    expect(status.mutedUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it('reports not muted once a timed mute has expired', async () => {
    await chatService.muteChat('agr1', 'uidB', '8h');
    // Manually rewrite the stored mute to be in the past, simulating time passing
    const stored = mockDocStore.get('agr1_uidB');
    mockDocStore.set('agr1_uidB', {
      ...stored,
      mutedUntil: { toDate: () => new Date(Date.now() - 1000) },
    });

    const status = await chatService.getMuteStatus('agr1', 'uidB');
    expect(status.muted).toBe(false);
  });

  it('reports muted forever regardless of mutedUntil', async () => {
    await chatService.muteChat('agr1', 'uidB', 'forever');
    const status = await chatService.getMuteStatus('agr1', 'uidB');

    expect(status.muted).toBe(true);
    expect(status.mutedForever).toBe(true);
    expect(status.mutedUntil).toBeNull();
  });

  it('unmuteChat clears both the forever flag and the expiry', async () => {
    await chatService.muteChat('agr1', 'uidB', 'forever');
    await chatService.unmuteChat('agr1', 'uidB');

    const status = await chatService.getMuteStatus('agr1', 'uidB');
    expect(status).toEqual({ muted: false, mutedUntil: null, mutedForever: false });
  });

  it('scopes mute status per agreement, not just per user', async () => {
    await chatService.muteChat('agr1', 'uidB', 'forever');
    const statusOtherAgreement = await chatService.getMuteStatus('agr2', 'uidB');

    expect(statusOtherAgreement.muted).toBe(false);
  });
});

describe('chatService.sendMessage notification suppression', () => {
  beforeEach(() => {
    mockDocStore.clear();
    jest.clearAllMocks();
  });

  it('sends a notification to the recipient when they have not muted the chat', async () => {
    await chatService.sendMessage('agr1', 'uidA', 'Carmen', 'Hola', ['uidA', 'uidB']);

    expect(notificationService.send).toHaveBeenCalledTimes(1);
    expect(notificationService.send).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUid: 'uidB', type: 'new_message' })
    );
  });

  it('does not notify a recipient who has muted the chat', async () => {
    await chatService.muteChat('agr1', 'uidB', 'forever');
    await chatService.sendMessage('agr1', 'uidA', 'Carmen', 'Hola', ['uidA', 'uidB']);

    expect(notificationService.send).not.toHaveBeenCalled();
  });

  it('still stores the message in Firestore even when the recipient is muted', async () => {
    await chatService.muteChat('agr1', 'uidB', 'forever');
    const message = await chatService.sendMessage('agr1', 'uidA', 'Carmen', 'Hola', ['uidA', 'uidB']);

    expect(message.message).toBe('Hola');
    expect(mockDocStore.get(message.id)).toBeDefined();
  });
});

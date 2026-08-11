jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('../historyService', () => ({ historyService: { log: jest.fn() } }));
jest.mock('../notificationService', () => ({ notificationService: { send: jest.fn() } }));
jest.mock('../storageService', () => ({ storageService: { uploadFile: jest.fn() } }));

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
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(async () => ({ docs: [] })),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
  },
}));

import { authorizationService } from '../authorizationService';

describe('authorizationService.respond', () => {
  beforeEach(() => {
    mockDocStore.clear();
  });

  const setupPendingAuthorization = async (memberUids: string[]) => {
    return authorizationService.createAuthorization({
      agreementId: 'agr1',
      minorId: 'min1',
      activity: 'Viaje escolar',
      description: 'Excursión de 3 días',
      memberUids,
      createdBy: 'uidA',
      createdByName: 'Carmen',
    });
  };

  it('stays pending while only one parent has responded', async () => {
    const auth = await setupPendingAuthorization(['uidA', 'uidB']);
    await authorizationService.respond(auth.id, 'uidA', 'Carmen', true);

    const updated = await authorizationService.getAuthorization(auth.id);
    expect(updated?.status).toBe('pending');
    expect(updated?.authorizations.uidA).toBe(true);
    expect(updated?.authorizations.uidB).toBeNull();
  });

  it('becomes approved only when every parent says yes', async () => {
    const auth = await setupPendingAuthorization(['uidA', 'uidB']);
    await authorizationService.respond(auth.id, 'uidA', 'Carmen', true);
    await authorizationService.respond(auth.id, 'uidB', 'Álex', true);

    const updated = await authorizationService.getAuthorization(auth.id);
    expect(updated?.status).toBe('approved');
  });

  it('becomes rejected as soon as any parent says no, regardless of order', async () => {
    const auth = await setupPendingAuthorization(['uidA', 'uidB']);
    await authorizationService.respond(auth.id, 'uidA', 'Carmen', true);
    await authorizationService.respond(auth.id, 'uidB', 'Álex', false);

    const updated = await authorizationService.getAuthorization(auth.id);
    expect(updated?.status).toBe('rejected');
  });
});

describe('authorizationService revocation (mutual agreement)', () => {
  beforeEach(() => {
    mockDocStore.clear();
  });

  const setupApprovedAuthorization = async () => {
    const auth = await authorizationService.createAuthorization({
      agreementId: 'agr1',
      minorId: 'min1',
      activity: 'Viaje escolar',
      description: 'Excursión de 3 días',
      memberUids: ['uidA', 'uidB'],
      createdBy: 'uidA',
      createdByName: 'Carmen',
    });
    await authorizationService.respond(auth.id, 'uidA', 'Carmen', true);
    await authorizationService.respond(auth.id, 'uidB', 'Álex', true);
    return auth.id;
  };

  it('throws when trying to revoke an authorization that is not approved', async () => {
    const auth = await setupPendingAuthorization(['uidA', 'uidB']);
    await expect(
      authorizationService.requestRevoke(auth.id, 'uidA', 'Carmen')
    ).rejects.toThrow();
  });

  it('does not revoke immediately when only one parent requests it', async () => {
    const id = await setupApprovedAuthorization();
    await authorizationService.requestRevoke(id, 'uidA', 'Carmen');

    const updated = await authorizationService.getAuthorization(id);
    expect(updated?.status).toBe('approved');
    expect(updated?.revocationRequestedBy).toBe('uidA');
    expect(updated?.revokedAt).toBeUndefined();
  });

  it('revokes once both parents have requested it', async () => {
    const id = await setupApprovedAuthorization();
    await authorizationService.requestRevoke(id, 'uidA', 'Carmen');
    await authorizationService.requestRevoke(id, 'uidB', 'Álex');

    const updated = await authorizationService.getAuthorization(id);
    expect(updated?.status).toBe('rejected');
    expect(updated?.revokedAt).toBeDefined();
  });

  it('does not double-count the same parent requesting revoke twice', async () => {
    const id = await setupApprovedAuthorization();
    await authorizationService.requestRevoke(id, 'uidA', 'Carmen');
    await authorizationService.requestRevoke(id, 'uidA', 'Carmen');

    const updated = await authorizationService.getAuthorization(id);
    expect(updated?.status).toBe('approved');
    expect(updated?.revocationRequestedBy).toBe('uidA');
  });

  it('cancelRevoke clears the pending revocation request', async () => {
    const id = await setupApprovedAuthorization();
    await authorizationService.requestRevoke(id, 'uidA', 'Carmen');
    await authorizationService.cancelRevoke(id, 'uidA', 'Carmen');

    const updated = await authorizationService.getAuthorization(id);
    expect(updated?.revocationRequestedBy).toBeNull();
  });

  async function setupPendingAuthorization(memberUids: string[]) {
    return authorizationService.createAuthorization({
      agreementId: 'agr1',
      minorId: 'min1',
      activity: 'Viaje escolar',
      description: 'Excursión de 3 días',
      memberUids,
      createdBy: 'uidA',
      createdByName: 'Carmen',
    });
  }
});

/**
 * createPendingConnectorAction tests · PRE-W4-PR-2
 *
 * Covers:
 *   • Unauthenticated callers get a structured error (no throw).
 *   • Authority gate — non-admins get 'permission required'.
 *   • Happy path delegates to broker, returns { ok, connectorId }.
 *   • Broker errors propagate as structured action errors.
 */

import { createPendingConnectorAction } from '../create-pending-connector';
import * as broker from '@/lib/admin/broker/connector-health-broker';
import * as tenancy from '@/lib/auth/tenancy';
import * as policy from '@/lib/auth/program-access-policy';
import * as tenant from '@/lib/admin/admin-tenant';
import * as currentUser from '@/lib/auth/current-user';

jest.mock('@/lib/admin/broker/connector-health-broker', () => ({
  createPendingConnector: jest.fn(),
}));
jest.mock('@/lib/auth/tenancy', () => {
  const actual = jest.requireActual('@/lib/auth/tenancy');
  return {
    ...actual,
    requireTenancy: jest.fn(),
  };
});
jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy: jest.fn(),
}));
jest.mock('@/lib/admin/admin-tenant', () => ({
  resolveAdminTenant: jest.fn(),
}));
jest.mock('@/lib/auth/current-user', () => ({
  getCurrentUser: jest.fn(),
}));

const createBrokerMock = broker.createPendingConnector as jest.MockedFunction<
  typeof broker.createPendingConnector
>;
const requireTenancyMock = tenancy.requireTenancy as jest.MockedFunction<
  typeof tenancy.requireTenancy
>;
const loadPolicyMock = policy.loadUserProgramAccessPolicy as jest.MockedFunction<
  typeof policy.loadUserProgramAccessPolicy
>;
const resolveTenantMock = tenant.resolveAdminTenant as jest.MockedFunction<
  typeof tenant.resolveAdminTenant
>;
const getCurrentUserMock = currentUser.getCurrentUser as jest.MockedFunction<
  typeof currentUser.getCurrentUser
>;

function tenancyOk() {
  requireTenancyMock.mockResolvedValue({
    clientId: 'client-1',
    clientKey: 'apexretail',
    userId: 'user-1',
    role: 'client_viewer',
    email: 'a@b.com',
  });
}

function policyAdmin(canAdminUsers: boolean) {
  loadPolicyMock.mockResolvedValue({
    accessLevel: canAdminUsers ? 'client_admin' : 'program_viewer',
    canAdminUsers,
    canCreatePrograms: canAdminUsers,
    canApproveGates: canAdminUsers,
    canViewFinancialData: false,
    canUploadArtifacts: true,
    canGenerateDeliverables: true,
    canPublishDeliverables: canAdminUsers,
    programIdsAllowed: null,
  } as unknown as Awaited<ReturnType<typeof policy.loadUserProgramAccessPolicy>>);
}

beforeEach(() => {
  jest.resetAllMocks();
  resolveTenantMock.mockResolvedValue({
    clientId: 'client-apex',
    clientKey: 'apexretail',
    tenantSlug: 'apex-retail',
    tenantName: 'Apex Retail Group',
  });
  getCurrentUserMock.mockResolvedValue({
    personId: 'person-1',
    clerkUserId: 'user_x',
    metadataClientKey: 'apexretail',
    tenantRoles: {},
    name: 'A',
    email: 'a@b.com',
    primaryRole: 'client_viewer',
    accessibleClients: [],
    defaultClientId: null,
  });
});

describe('createPendingConnectorAction', () => {
  it('rejects unauthenticated callers with a structured error', async () => {
    requireTenancyMock.mockRejectedValue(
      new tenancy.TenancyError('unauthenticated'),
    );
    const result = await createPendingConnectorAction({
      templateId: 'postgres',
      name: 'P',
    });
    expect(result).toEqual({ ok: false, error: 'You must be signed in.' });
    expect(createBrokerMock).not.toHaveBeenCalled();
  });

  it('rejects callers without admin authority', async () => {
    tenancyOk();
    policyAdmin(false);
    const result = await createPendingConnectorAction({
      templateId: 'postgres',
      name: 'P',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/admin/i);
    }
    expect(createBrokerMock).not.toHaveBeenCalled();
  });

  it('delegates to the broker on the happy path', async () => {
    tenancyOk();
    policyAdmin(true);
    createBrokerMock.mockResolvedValue({
      ok: true,
      id: 'conn-new-2',
      status: 'pending',
    });

    const result = await createPendingConnectorAction({
      templateId: 'postgres',
      name: 'Postgres · prod',
      scope: 'orders',
      authMethod: 'api_key',
    });

    expect(result).toEqual({ ok: true, connectorId: 'conn-new-2' });
    expect(createBrokerMock).toHaveBeenCalledWith(
      'apex-retail',
      expect.objectContaining({
        templateId: 'postgres',
        name: 'Postgres · prod',
        scope: 'orders',
        authMethod: 'api_key',
        actorPersonId: 'person-1',
      }),
    );
  });

  it('surfaces broker errors verbatim', async () => {
    tenancyOk();
    policyAdmin(true);
    createBrokerMock.mockResolvedValue({
      ok: false,
      error: 'Connector name is too long.',
    });

    const result = await createPendingConnectorAction({
      templateId: 'postgres',
      name: 'X'.repeat(300),
    });
    expect(result).toEqual({ ok: false, error: 'Connector name is too long.' });
  });
});

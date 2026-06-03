jest.mock('server-only', () => ({}));

jest.mock('../admin-tenant', () => ({
  resolveAdminTenant: jest.fn(),
}));

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(),
}));

jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy: jest.fn(),
}));

jest.mock('../data/admin-audit-log-adapter', () => ({
  getAdminAuditEvents: jest.fn(),
}));

jest.mock('../data/admin-users-adapter', () => ({
  getAdminUsers: jest.fn(),
}));

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    select: jest.fn(),
  },
}));

jest.mock('../setup-data-broker', () => ({
  getSetupInventorySnapshot: jest.fn(),
}));

jest.mock('../setup-acts-registry', () => ({
  buildAuthoredInventoryFallback: jest.fn(() => ({ segments: [] })),
  getSetupActsContent: jest.fn(() => ({ segments: [] })),
  mergeInventorySnapshot: jest.fn((_base, snapshot) => snapshot ?? { segments: [] }),
}));

import {
  buildCustomerAdminPageView,
  summarizeDocumentEconomicsFromAiEgressRows,
  summarizeUsageFromAiEgressRows,
} from '../customer-admin-read-model';
import { resolveAdminTenant } from '../admin-tenant';
import { requireTenancy } from '@/lib/auth/tenancy';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { getAdminAuditEvents } from '../data/admin-audit-log-adapter';
import { getAdminUsers } from '../data/admin-users-adapter';
import { azureRead } from '@/lib/data-plane/azureRead';

const tenant = {
  clientId: 'client-apex',
  clientKey: 'apexretail',
  tenantSlug: 'apex-retail',
  tenantName: 'Apex Retail Group',
} as const;

describe('Customer Admin page view safety', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (resolveAdminTenant as jest.Mock).mockResolvedValue(tenant);
  });

  it('does not load tenant admin panels before customer-admin access is granted', async () => {
    (requireTenancy as jest.Mock).mockResolvedValue({ clientId: 'client-apex', userId: 'user-1' });
    (loadUserProgramAccessPolicy as jest.Mock).mockResolvedValue({
      accessLevel: 'program_member',
      canAdminUsers: false,
    });

    const view = await buildCustomerAdminPageView();

    expect(view.access.allowed).toBe(false);
    expect(view.audit.events).toEqual([]);
    expect(view.users.users).toEqual([]);
    expect(view.aiEgress.rows).toEqual([]);
    expect(view.substrate.segments).toEqual([]);
    expect(view.banners.join(' ')).toContain('No tenant admin panels were loaded');
    expect(getAdminAuditEvents).not.toHaveBeenCalled();
    expect(getAdminUsers).not.toHaveBeenCalled();
    expect(azureRead.select).not.toHaveBeenCalled();
  });

  it('returns an empty view on active-tenant and tenancy mismatch', async () => {
    (requireTenancy as jest.Mock).mockResolvedValue({ clientId: 'client-meridian', userId: 'user-1' });

    const view = await buildCustomerAdminPageView();

    expect(view.access.allowed).toBe(false);
    expect(view.clientId).toBeNull();
    expect(view.banners.join(' ')).toContain('does not match the active tenant');
    expect(loadUserProgramAccessPolicy).not.toHaveBeenCalled();
    expect(getAdminAuditEvents).not.toHaveBeenCalled();
    expect(getAdminUsers).not.toHaveBeenCalled();
    expect(azureRead.select).not.toHaveBeenCalled();
  });

  it('summarizes nested provider usage metadata for the customer usage panel', () => {
    const usage = summarizeUsageFromAiEgressRows(
      [
        {
          id: 'audit-1',
          tenant_id: 'client-apex',
          workflow: 'source-artifact-generate',
          provider: 'anthropic',
          model: 'claude-sonnet-4-6',
          route: 'anthropic-direct',
          data_class: 'confidential',
          policy_decision: 'allow',
          decision_reason: 'tenant policy allows this AI egress route',
          request_metadata: {
            usage: {
              input_tokens: 100.4,
              output_tokens: '25',
              cost_usd: 0.000675,
            },
          },
          error_message: null,
          created_at: '2026-06-03T12:00:00Z',
        },
      ],
      'client-apex',
    );

    expect(usage).toEqual({
      calls: 1,
      inputTokens: 100,
      outputTokens: 25,
      estimatedCostUsd: 0.000675,
      costBasis: 'provider_metadata',
    });
  });

  it('summarizes document-level parse, chat, and cache economics from egress metadata', () => {
    const economics = summarizeDocumentEconomicsFromAiEgressRows(
      [
        {
          id: 'audit-1',
          tenant_id: 'client-apex',
          workflow: 'document-parse',
          provider: 'azure-document-intelligence',
          model: null,
          route: 'azure-parser',
          data_class: 'confidential',
          policy_decision: 'allow',
          decision_reason: 'parser allowed for approved document',
          request_metadata: {
            document_key: 'doc-001',
            original_filename: 'annual-results.pdf',
            usage: {
              input_tokens: 300,
              output_tokens: 50,
              cost_usd: 0.012,
              parse_cost_usd: 0.007,
              cache_hit: false,
            },
          },
          error_message: null,
          created_at: '2026-06-03T12:00:00Z',
        },
        {
          id: 'audit-2',
          tenant_id: 'client-apex',
          workflow: 'agent-answer',
          provider: 'anthropic',
          model: 'claude-sonnet-4-6',
          route: 'anthropic-direct',
          data_class: 'confidential',
          policy_decision: 'allow',
          decision_reason: 'document-bound chat allowed',
          request_metadata: {
            documentKey: 'doc-001',
            documentLabel: 'Annual results PDF',
            usage: {
              input_tokens: 100,
              output_tokens: 25,
              cost_usd: 0.003,
              cache_read_input_tokens: 80,
            },
          },
          error_message: null,
          created_at: '2026-06-03T12:05:00Z',
        },
        {
          id: 'audit-other-tenant',
          tenant_id: 'client-meridian',
          workflow: 'agent-answer',
          provider: 'anthropic',
          model: 'claude-sonnet-4-6',
          route: 'anthropic-direct',
          data_class: 'confidential',
          policy_decision: 'allow',
          decision_reason: 'other tenant',
          request_metadata: {
            document_key: 'doc-001',
            usage: { cost_usd: 99, cache_hit: true },
          },
          error_message: null,
          created_at: '2026-06-03T12:10:00Z',
        },
      ],
      'client-apex',
    );

    expect(economics).toEqual({
      documents: [
        {
          documentKey: 'doc-001',
          label: 'annual-results.pdf',
          calls: 2,
          inputTokens: 400,
          outputTokens: 75,
          parseCostUsd: 0.007,
          chatCostUsd: 0.008,
          totalCostUsd: 0.015,
          cacheEvents: 2,
          cacheHits: 1,
          cacheHitRate: 50,
          lastSeenAt: '2026-06-03T12:05:00Z',
          basis: 'provider_metadata',
        },
      ],
      totalDocuments: 1,
      meteredDocuments: 1,
      parseCostUsd: 0.007,
      chatCostUsd: 0.008,
      totalCostUsd: 0.015,
      cacheHitRate: 50,
    });
  });
});

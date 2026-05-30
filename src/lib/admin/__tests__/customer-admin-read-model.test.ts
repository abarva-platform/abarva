jest.mock('server-only', () => ({}));

import {
  CUSTOMER_ADMIN_SECTIONS,
  assertCustomerAdminSectionsReadOnly,
  canReadCustomerAdmin,
  scopeAiEgressRowsToClient,
  summarizeAiEgressRows,
  summarizeUsageFromAiEgressRows,
  type AiEgressAuditRow,
} from '../customer-admin-read-model';

const rows: AiEgressAuditRow[] = [
  {
    id: 'a1',
    tenant_id: 'client-apex',
    workflow: 'chat.agent',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    route: '/api/chat/agent',
    data_class: 'confidential',
    policy_decision: 'allow',
    decision_reason: 'tenant policy permits kernel workflow',
    request_metadata: {
      inputTokens: 1200,
      outputTokens: 300,
      costUsd: 0.0081,
    },
    error_message: null,
    created_at: '2026-05-30T12:00:00.000Z',
  },
  {
    id: 'a2',
    tenant_id: 'client-apex',
    workflow: 'embedding.context',
    provider: 'openai',
    model: 'text-embedding-3-large',
    route: '/api/context/embed',
    data_class: 'internal',
    policy_decision: 'deny',
    decision_reason: 'policy denies external embedding',
    request_metadata: {
      input_tokens: '800',
      estimated_cost_usd: '0.0002',
    },
    error_message: 'denied',
    created_at: '2026-05-30T11:00:00.000Z',
  },
  {
    id: 'm1',
    tenant_id: 'client-meridian',
    workflow: 'chat.agent',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    route: '/api/chat/agent',
    data_class: 'confidential',
    policy_decision: 'allow',
    decision_reason: 'tenant policy permits kernel workflow',
    request_metadata: {
      inputTokens: 999999,
      costUsd: 99,
    },
    error_message: null,
    created_at: '2026-05-30T10:00:00.000Z',
  },
];

describe('C4 customer-admin read model', () => {
  it('allows only client-admin policies with user-admin permission', () => {
    expect(canReadCustomerAdmin({ accessLevel: 'client_admin', canAdminUsers: true })).toEqual({
      allowed: true,
      reason: 'customer_admin',
    });

    expect(canReadCustomerAdmin({ accessLevel: 'program_member', canAdminUsers: true })).toEqual({
      allowed: false,
      reason: 'no_customer_admin_policy',
    });

    expect(canReadCustomerAdmin({ accessLevel: 'client_admin', canAdminUsers: false })).toEqual({
      allowed: false,
      reason: 'no_customer_admin_policy',
    });
  });

  it('keeps every shipped customer-admin section read-only', () => {
    expect(assertCustomerAdminSectionsReadOnly()).toBe(true);
    expect(CUSTOMER_ADMIN_SECTIONS.map((section) => section.id)).toEqual([
      'audit-log',
      'users',
      'ai-egress',
      'cost-usage',
      'substrate-inventory',
    ]);
    expect(CUSTOMER_ADMIN_SECTIONS.flatMap((section) => section.mutationTargets)).toEqual([]);
  });

  it('filters AI egress rows to the resolved tenant client id', () => {
    const scoped = scopeAiEgressRowsToClient(rows, 'client-apex');
    expect(scoped).toHaveLength(2);
    expect(scoped.every((row) => row.tenant_id === 'client-apex')).toBe(true);
    expect(scoped.map((row) => row.id)).not.toContain('m1');
  });

  it('summarizes AI egress decisions without cross-tenant leakage', () => {
    const summary = summarizeAiEgressRows(rows, 'client-apex');
    expect(summary.totalRows).toBe(2);
    expect(summary.allowed).toBe(1);
    expect(summary.deniedOrBlocked).toBe(1);
    expect(summary.providers).toEqual([
      { provider: 'anthropic', count: 1 },
      { provider: 'openai', count: 1 },
    ]);
    expect(summary.lastSeenAt).toBe('2026-05-30T12:00:00.000Z');
  });

  it('rolls up usage only from tenant-scoped egress metadata', () => {
    const usage = summarizeUsageFromAiEgressRows(rows, 'client-apex');
    expect(usage.calls).toBe(2);
    expect(usage.inputTokens).toBe(2000);
    expect(usage.outputTokens).toBe(300);
    expect(usage.estimatedCostUsd).toBe(0.0083);
    expect(usage.costBasis).toBe('provider_metadata');
  });

  it('returns empty usage when there is no tenant client id', () => {
    expect(summarizeUsageFromAiEgressRows(rows, null)).toEqual({
      calls: 0,
      inputTokens: null,
      outputTokens: null,
      estimatedCostUsd: null,
      costBasis: 'not_metered',
    });
  });
});

jest.mock('server-only', () => ({}));

import {
  CUSTOMER_ADMIN_SECTIONS,
  assertCustomerAdminSectionsReadOnly,
  canReadCustomerAdmin,
  scopeAiEgressRowsToClient,
  summarizeAiEgressRows,
  summarizeUsageFromAiEgressRows,
  summarizeWeeklyUsageReportFromAiEgressRows,
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
      usageCap: {
        usage_cap_decision: 'alert',
        usage_cap_reason: 'token_alert_threshold_reached',
        usage_cap_period: 'monthly',
        usage_cap_token_cap: 2000,
        usage_cap_tokens_after: 1500,
        usage_cap_token_percent_after: 75,
        usage_cap_alert_at_percent: 70,
        usage_cap_block_at_percent: 100,
        usage_cap_blocks_model_call: false,
      },
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

  it('builds a tenant-scoped weekly usage report with cap alert posture', () => {
    const report = summarizeWeeklyUsageReportFromAiEgressRows(rows, 'client-apex');

    expect(report.calls).toBe(2);
    expect(report.totalTokens).toBe(2300);
    expect(report.estimatedCostUsd).toBe(0.0083);
    expect(report.tokenCap).toBe(2000);
    expect(report.tokenPercentOfCap).toBe(75);
    expect(report.capDecision).toBe('alert');
    expect(report.status).toBe('cap_alert');
    expect(report.reportReady).toBe(true);
    expect(report.includedMonthlyTokenAllowance).toBe(50_000_000);
    expect(report.overageRateUsdPerMillionTokens).toBe(18);
    expect(report.evidenceBasis).toBe('usage_cap_audit_metadata');
  });

  it('does not make a client report ready without usage-cap evidence', () => {
    const report = summarizeWeeklyUsageReportFromAiEgressRows(
      rows.map((row) => ({ ...row, request_metadata: { inputTokens: 100, outputTokens: 50, costUsd: 0.01 } })),
      'client-apex',
    );

    expect(report.totalTokens).toBe(300);
    expect(report.status).toBe('needs_cap_configuration');
    expect(report.reportReady).toBe(false);
    expect(report.customerNotice).toContain('no tenant usage-cap audit metadata');
    expect(report.evidenceBasis).toBe('provider_metadata_only');
  });
});

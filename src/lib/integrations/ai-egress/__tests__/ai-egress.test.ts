import {
  CONSERVATIVE_TENANT_AI_POLICY,
  callModel,
  classifyAiPayload,
  createMemoryAiEgressAuditSink,
  evaluateAiEgressPolicy,
  getAnthropicDirectClient,
  preflightModelEgress,
  type TenantAiPolicy,
} from '@/lib/integrations/ai-egress';

const permissiveClaudePolicy: TenantAiPolicy = {
  allowExternalAI: true,
  kernelOnlyMode: false,
  allowClaude: true,
  allowGamma: false,
  maxDataClass: 'confidential',
  requireRedaction: false,
  requireHumanApprovalForExports: true,
  promptResponseRetentionDays: 30,
};

describe('AI egress control plane Layer 1', () => {
  it('defaults untagged payloads to confidential until Layer 2 classification exists', () => {
    expect(classifyAiPayload()).toBe('confidential');
  });

  it('denies external Claude by default and writes an audit record without calling the adapter', async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const adapter = jest.fn(async () => ({ response: 'should not run' }));

    const result = await callModel({
      tenantId: '00000000-0000-0000-0000-000000000001',
      workflow: 'unit-test',
      provider: 'anthropic',
      route: 'anthropic-direct',
      model: 'claude-sonnet-4-6',
      prompt: 'confidential prompt',
      policy: CONSERVATIVE_TENANT_AI_POLICY,
      adapter,
      auditSink,
    });

    expect(result.ok).toBe(false);
    expect(adapter).not.toHaveBeenCalled();
    expect(auditSink.records).toHaveLength(1);
    expect(auditSink.records[0]).toMatchObject({
      policyDecision: 'deny',
      dataClass: 'confidential',
      provider: 'anthropic',
      route: 'anthropic-direct',
    });
    expect(auditSink.records[0].promptHash).toHaveLength(64);
  });

  it('allows an approved Claude route and synchronously audits before returning success', async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const adapter = jest.fn(async () => ({ response: 'board-grade answer', model: 'claude-sonnet-4-6' }));

    const result = await callModel({
      tenantId: '00000000-0000-0000-0000-000000000002',
      workflow: 'moves-business-case',
      provider: 'anthropic',
      route: 'anthropic-direct',
      model: 'claude-sonnet-4-6',
      prompt: 'internal prompt',
      dataClass: 'internal',
      policy: permissiveClaudePolicy,
      adapter,
      auditSink,
    });

    expect(result).toMatchObject({ ok: true, response: 'board-grade answer' });
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(auditSink.records).toHaveLength(2);
    expect(auditSink.records[0]).toMatchObject({
      policyDecision: 'allow',
      decisionReason: 'tenant policy allows this AI egress route',
    });
    expect(auditSink.records[1].responseHash).toHaveLength(64);
    expect(auditSink.records[1].requestMetadata).toMatchObject({ preCallAuditId: auditSink.records[0].id });
  });

  it('allows approved OpenAI embedding egress through the same policy gate', async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const client = { embeddings: { create: jest.fn() } };
    const result = await preflightModelEgress({
      tenantId: '00000000-0000-0000-0000-000000000007',
      workflow: 'embedding-test',
      provider: 'openai',
      route: 'openai-direct',
      model: 'text-embedding-3-large',
      prompt: 'embed this tenant query',
      dataClass: 'internal',
      policy: permissiveClaudePolicy,
      auditSink,
      clientFactory: () => client,
    });

    expect(result).toMatchObject({ ok: true, client });
    expect(auditSink.records[0]).toMatchObject({
      provider: 'openai',
      route: 'openai-direct',
      policyDecision: 'allow',
      workflow: 'embedding-test',
    });
  });

  it('blocks Gamma for confidential data until the Layer 2 redaction path exists', async () => {
    const decision = evaluateAiEgressPolicy({
      tenantId: '00000000-0000-0000-0000-000000000003',
      workflow: 'gamma-deck',
      provider: 'gamma',
      route: 'gamma-api',
      prompt: 'financial business case',
      dataClass: 'confidential',
      policy: {
        ...permissiveClaudePolicy,
        allowGamma: true,
      },
    });

    expect(decision).toMatchObject({
      decision: 'redact_required',
      dataClass: 'confidential',
    });
    expect(decision.reason).toContain('Layer 2 redaction');
  });

  it('allows kernel-only execution even when external egress is disabled', async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const result = await callModel({
      tenantId: '00000000-0000-0000-0000-000000000004',
      workflow: 'expert-kernel',
      provider: 'kernel-only',
      route: 'kernel-only',
      prompt: 'deterministic kernel input',
      policy: CONSERVATIVE_TENANT_AI_POLICY,
      adapter: async () => ({ response: 'computed locally' }),
      auditSink,
    });

    expect(result.ok).toBe(true);
    expect(auditSink.records[0]).toMatchObject({
      provider: 'kernel-only',
      policyDecision: 'allow',
    });
  });

  it('preflights streaming calls with a synchronous allow audit before returning a client', async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const client = { messages: { stream: jest.fn() } };
    const result = await preflightModelEgress({
      tenantId: '00000000-0000-0000-0000-000000000005',
      workflow: 'streaming-synthesis',
      provider: 'anthropic',
      route: 'anthropic-direct',
      model: 'claude-sonnet-4-6',
      prompt: 'stream me a careful answer',
      dataClass: 'internal',
      policy: permissiveClaudePolicy,
      auditSink,
      clientFactory: () => client,
    });

    expect(result).toMatchObject({ ok: true, client });
    expect(auditSink.records).toHaveLength(1);
    expect(auditSink.records[0]).toMatchObject({
      policyDecision: 'allow',
      workflow: 'streaming-synthesis',
    });
  });

  it('preflight denial returns a structured refusal and never creates a client', async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const clientFactory = jest.fn(getAnthropicDirectClient);
    const result = await preflightModelEgress({
      tenantId: '00000000-0000-0000-0000-000000000006',
      workflow: 'streaming-synthesis',
      provider: 'anthropic',
      route: 'anthropic-direct',
      model: 'claude-sonnet-4-6',
      prompt: 'confidential prompt',
      policy: CONSERVATIVE_TENANT_AI_POLICY,
      auditSink,
      clientFactory,
    });

    expect(result.ok).toBe(false);
    expect(clientFactory).not.toHaveBeenCalled();
    expect(auditSink.records[0]).toMatchObject({
      policyDecision: 'deny',
      dataClass: 'confidential',
    });
  });
});

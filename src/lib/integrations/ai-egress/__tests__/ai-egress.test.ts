import {
  CONSERVATIVE_TENANT_AI_POLICY,
  callModel,
  classifyAiPayload,
  createMemoryAiEgressAuditSink,
  evaluateAiEgressPolicy,
  getAnthropicDirectClient,
  preflightModelEgress,
  type TenantAiPolicy,
} from "@/lib/integrations/ai-egress";

const permissiveClaudePolicy: TenantAiPolicy = {
  allowExternalAI: true,
  kernelOnlyMode: false,
  allowClaude: true,
  allowGamma: false,
  maxDataClass: "confidential",
  requireRedaction: false,
  requireHumanApprovalForExports: true,
  promptResponseRetentionDays: 30,
};

const weeklyUsageCap = {
  config: {
    tenantId: "00000000-0000-0000-0000-000000000002",
    period: "weekly" as const,
    alertAtPercent: 80,
    blockAtPercent: 100,
    tokenCap: 10_000,
    costCapUsd: 25,
  },
  current: {
    inputTokens: 1_000,
    outputTokens: 500,
    costUsd: 1,
  },
};

describe("AI egress control plane Layer 1", () => {
  it("defaults untagged payloads to confidential until Layer 2 classification exists", () => {
    expect(classifyAiPayload()).toBe("confidential");
  });

  it("allows OpenAI under the default audited reasoning policy", async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const adapter = jest.fn(async () => ({ response: "audited answer" }));

    const result = await callModel({
      tenantId: "00000000-0000-0000-0000-000000000001",
      workflow: "unit-test",
      provider: "openai",
      route: "openai-direct",
      model: "gpt-5.5",
      prompt: "confidential prompt",
      policy: CONSERVATIVE_TENANT_AI_POLICY,
      adapter,
      auditSink,
    });

    expect(result.ok).toBe(true);
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(auditSink.records[0]).toMatchObject({
      policyDecision: "allow",
      provider: "openai",
      route: "openai-direct",
    });
  });

  it("denies Claude only when a tenant explicitly disables it (allowClaude:false)", async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const adapter = jest.fn(async () => ({ response: "should not run" }));

    const result = await callModel({
      tenantId: "00000000-0000-0000-0000-000000000001",
      workflow: "unit-test",
      provider: "anthropic",
      route: "anthropic-direct",
      model: "claude-sonnet-4-6",
      prompt: "confidential prompt",
      policy: { ...CONSERVATIVE_TENANT_AI_POLICY, allowClaude: false },
      adapter,
      auditSink,
    });

    expect(result.ok).toBe(false);
    expect(adapter).not.toHaveBeenCalled();
    expect(auditSink.records).toHaveLength(1);
    expect(auditSink.records[0]).toMatchObject({
      policyDecision: "deny",
      dataClass: "confidential",
      provider: "anthropic",
      route: "anthropic-direct",
    });
    expect(auditSink.records[0].promptHash).toHaveLength(64);
  });

  it("allows an approved Claude route and synchronously audits before returning success", async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const adapter = jest.fn(async () => ({
      response: "board-grade answer",
      model: "claude-sonnet-4-6",
      metadata: {
        usage: {
          input_tokens: 111,
          output_tokens: 22,
          cost_usd: 0.000663,
          cache_creation_input_tokens: 1000,
          cache_read_input_tokens: 2000,
        },
        anthropicPromptCache: {
          enabled: true,
          ttl: "ephemeral_5m",
        },
      },
    }));

    const result = await callModel({
      tenantId: "00000000-0000-0000-0000-000000000002",
      workflow: "moves-business-case",
      provider: "anthropic",
      route: "anthropic-direct",
      model: "claude-sonnet-4-6",
      prompt: "internal prompt",
      dataClass: "internal",
      policy: permissiveClaudePolicy,
      adapter,
      auditSink,
    });

    expect(result).toMatchObject({ ok: true, response: "board-grade answer" });
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(auditSink.records).toHaveLength(2);
    expect(auditSink.records[0]).toMatchObject({
      policyDecision: "allow",
      decisionReason: "Anthropic is enabled by tenant policy",
    });
    expect(auditSink.records[1].responseHash).toHaveLength(64);
    expect(auditSink.records[1].requestMetadata).toMatchObject({
      preCallAuditId: auditSink.records[0].id,
      usage: {
        input_tokens: 111,
        output_tokens: 22,
        cost_usd: 0.000663,
        cache_creation_input_tokens: 1000,
        cache_read_input_tokens: 2000,
      },
      anthropicPromptCache: {
        enabled: true,
        ttl: "ephemeral_5m",
      },
    });
  });

  it("blocks synchronous provider calls when the tenant usage cap is exhausted", async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const adapter = jest.fn(async () => ({ response: "should not run" }));

    const result = await callModel({
      tenantId: "00000000-0000-0000-0000-000000000002",
      workflow: "moves-business-case",
      provider: "anthropic",
      route: "anthropic-direct",
      model: "claude-sonnet-4-6",
      prompt: "internal prompt",
      dataClass: "internal",
      policy: permissiveClaudePolicy,
      usageCap: {
        ...weeklyUsageCap,
        current: { inputTokens: 9_000, outputTokens: 500, costUsd: 2 },
        pending: { inputTokens: 400, outputTokens: 100, costUsd: 1 },
      },
      adapter,
      auditSink,
    });

    expect(result).toMatchObject({
      ok: false,
      policyDecision: "deny",
      reason: expect.stringContaining("tenant usage cap"),
    });
    expect(adapter).not.toHaveBeenCalled();
    expect(auditSink.records).toHaveLength(1);
    expect(auditSink.records[0]).toMatchObject({
      policyDecision: "deny",
      decisionReason:
        "tenant usage cap blocks model call: token_block_threshold_reached",
      requestMetadata: {
        usageCap: {
          usage_cap_decision: "block",
          usage_cap_reason: "token_block_threshold_reached",
          usage_cap_blocks_model_call: true,
        },
      },
    });
  });

  it("allows synchronous provider calls at alert threshold and stamps cap audit metadata", async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const adapter = jest.fn(async () => ({ response: "careful answer" }));

    const result = await callModel({
      tenantId: "00000000-0000-0000-0000-000000000002",
      workflow: "moves-business-case",
      provider: "anthropic",
      route: "anthropic-direct",
      model: "claude-sonnet-4-6",
      prompt: "internal prompt",
      dataClass: "internal",
      policy: permissiveClaudePolicy,
      usageCap: {
        ...weeklyUsageCap,
        current: { inputTokens: 7_000, outputTokens: 500, costUsd: 2 },
        pending: { inputTokens: 400, outputTokens: 100, costUsd: 1 },
      },
      adapter,
      auditSink,
    });

    expect(result).toMatchObject({ ok: true });
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(auditSink.records[0]).toMatchObject({
      policyDecision: "allow",
      decisionReason: expect.stringContaining(
        "tenant usage cap alert: token_alert_threshold_reached",
      ),
      requestMetadata: {
        usageCap: {
          usage_cap_decision: "alert",
          usage_cap_reason: "token_alert_threshold_reached",
          usage_cap_blocks_model_call: false,
        },
      },
    });
    expect(auditSink.records[1].requestMetadata).toMatchObject({
      usageCap: {
        usage_cap_decision: "alert",
      },
      preCallAuditId: auditSink.records[0].id,
    });
  });

  it("allows approved OpenAI embedding egress through the same policy gate", async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const client = { embeddings: { create: jest.fn() } };
    const result = await preflightModelEgress({
      tenantId: "00000000-0000-0000-0000-000000000007",
      workflow: "embedding-test",
      provider: "openai",
      route: "openai-direct",
      model: "text-embedding-3-large",
      prompt: "embed this tenant query",
      dataClass: "internal",
      policy: permissiveClaudePolicy,
      auditSink,
      clientFactory: () => client,
    });

    expect(result).toMatchObject({ ok: true, client });
    expect(auditSink.records[0]).toMatchObject({
      provider: "openai",
      route: "openai-direct",
      policyDecision: "allow",
      workflow: "embedding-test",
    });
  });

  it("blocks Gamma for confidential data until the Layer 2 redaction path exists", async () => {
    const decision = evaluateAiEgressPolicy({
      tenantId: "00000000-0000-0000-0000-000000000003",
      workflow: "gamma-deck",
      provider: "gamma",
      route: "gamma-api",
      prompt: "financial business case",
      dataClass: "confidential",
      policy: {
        ...permissiveClaudePolicy,
        allowGamma: true,
      },
    });

    expect(decision).toMatchObject({
      decision: "redact_required",
      dataClass: "confidential",
    });
    expect(decision.reason).toContain("Layer 2 redaction");
  });

  it("allows kernel-only execution even when external egress is disabled", async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const result = await callModel({
      tenantId: "00000000-0000-0000-0000-000000000004",
      workflow: "expert-kernel",
      provider: "kernel-only",
      route: "kernel-only",
      prompt: "deterministic kernel input",
      policy: CONSERVATIVE_TENANT_AI_POLICY,
      adapter: async () => ({ response: "computed locally" }),
      auditSink,
    });

    expect(result.ok).toBe(true);
    expect(auditSink.records[0]).toMatchObject({
      provider: "kernel-only",
      policyDecision: "allow",
    });
  });

  it("preflights streaming calls with a synchronous allow audit before returning a client", async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const client = { messages: { stream: jest.fn() } };
    const result = await preflightModelEgress({
      tenantId: "00000000-0000-0000-0000-000000000005",
      workflow: "streaming-synthesis",
      provider: "anthropic",
      route: "anthropic-direct",
      model: "claude-sonnet-4-6",
      prompt: "stream me a careful answer",
      dataClass: "internal",
      policy: permissiveClaudePolicy,
      auditSink,
      clientFactory: () => client,
    });

    expect(result).toMatchObject({ ok: true, client });
    expect(auditSink.records).toHaveLength(1);
    expect(auditSink.records[0]).toMatchObject({
      policyDecision: "allow",
      workflow: "streaming-synthesis",
    });
  });

  it("blocks streaming client creation when the tenant usage cap is exhausted", async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const clientFactory = jest.fn(() => ({ messages: { stream: jest.fn() } }));
    const result = await preflightModelEgress({
      tenantId: "00000000-0000-0000-0000-000000000005",
      workflow: "streaming-synthesis",
      provider: "anthropic",
      route: "anthropic-direct",
      model: "claude-sonnet-4-6",
      prompt: "stream me a careful answer",
      dataClass: "internal",
      policy: permissiveClaudePolicy,
      usageCap: {
        ...weeklyUsageCap,
        current: { inputTokens: 9_900, outputTokens: 100, costUsd: 2 },
      },
      auditSink,
      clientFactory,
    });

    expect(result).toMatchObject({
      ok: false,
      policyDecision: "deny",
      reason: expect.stringContaining("tenant usage cap"),
    });
    expect(clientFactory).not.toHaveBeenCalled();
    expect(auditSink.records[0]).toMatchObject({
      policyDecision: "deny",
      requestMetadata: {
        usageCap: {
          usage_cap_decision: "block",
          usage_cap_blocks_model_call: true,
        },
      },
    });
  });

  it("preflight denial returns a structured refusal and never creates a client", async () => {
    const auditSink = createMemoryAiEgressAuditSink();
    const clientFactory = jest.fn(getAnthropicDirectClient);
    const result = await preflightModelEgress({
      tenantId: "00000000-0000-0000-0000-000000000006",
      workflow: "streaming-synthesis",
      provider: "anthropic",
      route: "anthropic-direct",
      model: "claude-sonnet-4-6",
      prompt: "confidential prompt",
      policy: { ...CONSERVATIVE_TENANT_AI_POLICY, allowClaude: false },
      auditSink,
      clientFactory,
    });

    expect(result.ok).toBe(false);
    expect(clientFactory).not.toHaveBeenCalled();
    expect(auditSink.records[0]).toMatchObject({
      policyDecision: "deny",
      dataClass: "confidential",
    });
  });
});

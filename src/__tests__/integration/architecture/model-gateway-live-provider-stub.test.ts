// MG3 - Model Gateway Live Provider Stub - integration tests.
//
// Pure deterministic coverage. No network. No live model. No DOM.
// Tests assert that:
// - Request → response is byte-equal across calls for identical input.
// - Well-formed requests return decision: 'stubbed_live' with a fully
//   populated audit record, honestNote, deterministic completion, and
//   token counts.
// - Block guards fire for empty tenantKey, empty intent, and empty
//   contextPackRef.
// - estimateTokenCounts and generateStubCompletion are deterministic
//   and follow the documented heuristics.
// - deriveProviderName maps canonical model names to expected fake
//   provider names, and falls back to 'unknown' for unrecognised names.
// - summarizeLiveProviderStubResponse produces a single-line deterministic
//   summary.
// - Module hygiene: no SDK imports, no Date.now / Math.random /
//   new Date( / fetch(, no useState / useEffect, no Coming soon /
//   TBD / Lorem ipsum.

import {
  buildLiveProviderStubRequest,
  deriveProviderName,
  estimateTokenCounts,
  generateStubCompletion,
  invokeLiveProviderStub,
  summarizeLiveProviderStubResponse,
  type LiveProviderStubRequest,
  type LiveProviderStubResponse,
} from '@/lib/architecture/model-gateway-live-provider-stub';
import {
  createModelGatewayRequest,
  routeModelGatewayRequest,
  type ModelGatewayRequest,
  type ModelGatewayRoute,
} from '@/lib/architecture/model-gateway-stub';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function wellFormedGatewayRequest(
  overrides: Partial<ModelGatewayRequest> = {},
): ModelGatewayRequest {
  return createModelGatewayRequest({
    tenantKey: 'apexretail',
    agentKey: 'nexus',
    intent: 'compose program brief for CDP initiative',
    contextPackRef: 'ctx2-pack-apexretail-001',
    modelTier: 'tier_b_balanced',
    policies: ['audit_required', 'tenant_isolation'],
    ...overrides,
  });
}

function wellFormedRoute(overrides: Partial<ModelGatewayRoute> = {}): ModelGatewayRoute {
  return {
    modelName: 'canonical_balanced_compose_v1',
    tier: 'tier_b_balanced',
    fallbackChain: ['canonical_economy_compose_v1'],
    ...overrides,
  };
}

function wellFormedStubRequest(
  requestOverrides: Partial<ModelGatewayRequest> = {},
  routeOverrides: Partial<ModelGatewayRoute> = {},
): LiveProviderStubRequest {
  return buildLiveProviderStubRequest(
    wellFormedGatewayRequest(requestOverrides),
    wellFormedRoute(routeOverrides),
  );
}

// ─── Determinism ──────────────────────────────────────────────────────────────

describe('invokeLiveProviderStub - determinism', () => {
  it('produces byte-equal output for identical input', () => {
    const req = wellFormedStubRequest();
    const a = invokeLiveProviderStub(req);
    const b = invokeLiveProviderStub(req);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('produces byte-equal output for blocked input', () => {
    const req = wellFormedStubRequest({ tenantKey: '' });
    const a = invokeLiveProviderStub(req);
    const b = invokeLiveProviderStub(req);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('different intents produce different completionTexts', () => {
    const r1 = invokeLiveProviderStub(
      wellFormedStubRequest({ intent: 'intent alpha' }),
    );
    const r2 = invokeLiveProviderStub(
      wellFormedStubRequest({ intent: 'intent beta - completely different' }),
    );
    expect(r1.completionText).not.toBe(r2.completionText);
  });
});

// ─── Well-formed → stubbed_live ───────────────────────────────────────────────

describe('invokeLiveProviderStub - well-formed request', () => {
  let response: LiveProviderStubResponse;

  beforeEach(() => {
    response = invokeLiveProviderStub(wellFormedStubRequest());
  });

  it('returns decision: stubbed_live', () => {
    expect(response.decision).toBe('stubbed_live');
    expect(response.reason).toBeUndefined();
  });

  it('includes deterministic completionText that references [MG3 stub]', () => {
    expect(typeof response.completionText).toBe('string');
    expect(response.completionText).toMatch(/\[MG3 stub\]/);
  });

  it('completionText references the route model name', () => {
    expect(response.completionText).toMatch(/canonical_balanced_compose_v1/);
  });

  it('includes token counts with non-zero promptTokens', () => {
    expect(response.tokenCounts).toBeDefined();
    expect(typeof response.tokenCounts?.promptTokens).toBe('number');
    expect((response.tokenCounts?.promptTokens ?? 0)).toBeGreaterThan(0);
    expect(typeof response.tokenCounts?.completionTokens).toBe('number');
    expect((response.tokenCounts?.completionTokens ?? 0)).toBeGreaterThan(0);
    expect(response.tokenCounts?.totalTokens).toBe(
      (response.tokenCounts?.promptTokens ?? 0) +
        (response.tokenCounts?.completionTokens ?? 0),
    );
  });

  it('resolves providerName to the canonical fake name for tier_b_balanced', () => {
    expect(response.providerName).toBe('provider-beta');
  });

  it('honestNote mentions Live provider not implemented', () => {
    expect(response.honestNote).toMatch(/Live provider not implemented/);
  });

  it('audit record is fully populated', () => {
    expect(response.audit.invocationId).toMatch(/^mg3-live-/);
    expect(response.audit.tenantKey).toBe('apexretail');
    expect(response.audit.agentKey).toBe('nexus');
    expect(response.audit.decision).toBe('stubbed_live');
    expect(response.audit.modelNameResolved).toBe('canonical_balanced_compose_v1');
    expect(response.audit.providerName).toBe('provider-beta');
    expect(response.audit.trace.gatewayVersion).toBe('mg3.live-provider-stub.v1');
    expect(typeof response.audit.trace.routeHashSeed).toBe('string');
    expect(response.audit.trace.routeHashSeed.length).toBeGreaterThan(0);
    expect(typeof response.audit.stubLatencyMs).toBe('number');
    expect(response.audit.stubLatencyMs).toBeGreaterThanOrEqual(0);
  });

  it('policiesEnforced in audit are sorted and deduped', () => {
    const req = wellFormedStubRequest({
      policies: ['tenant_isolation', 'audit_required', 'tenant_isolation'],
    });
    const res = invokeLiveProviderStub(req);
    const policies = res.audit.policiesEnforced;
    expect(policies).toEqual(['audit_required', 'tenant_isolation']);
  });
});

// ─── Provider tiers ───────────────────────────────────────────────────────────

describe('invokeLiveProviderStub - tier-specific provider names', () => {
  const tierCases: Array<{
    modelName: string;
    tier: ModelGatewayRoute['tier'];
    expectedProvider: string;
  }> = [
    {
      modelName: 'canonical_premium_compose_v1',
      tier: 'tier_a_premium',
      expectedProvider: 'provider-alpha',
    },
    {
      modelName: 'canonical_balanced_compose_v1',
      tier: 'tier_b_balanced',
      expectedProvider: 'provider-beta',
    },
    {
      modelName: 'canonical_economy_compose_v1',
      tier: 'tier_c_economy',
      expectedProvider: 'provider-gamma',
    },
    {
      modelName: 'canonical_local_rerank_v1',
      tier: 'tier_d_local_only',
      expectedProvider: 'provider-local',
    },
  ];

  tierCases.forEach(({ modelName, tier, expectedProvider }) => {
    it(`resolves ${tier} → ${expectedProvider}`, () => {
      const req = wellFormedStubRequest(
        { modelTier: tier },
        { modelName, tier, fallbackChain: [] },
      );
      const response = invokeLiveProviderStub(req);
      expect(response.decision).toBe('stubbed_live');
      expect(response.providerName).toBe(expectedProvider);
      expect(response.audit.providerName).toBe(expectedProvider);
    });
  });

  it('routes premium tier with higher stub latency than economy', () => {
    const premiumReq = wellFormedStubRequest(
      { modelTier: 'tier_a_premium', intent: 'test intent x' },
      { modelName: 'canonical_premium_compose_v1', tier: 'tier_a_premium', fallbackChain: [] },
    );
    const economyReq = wellFormedStubRequest(
      { modelTier: 'tier_c_economy', intent: 'test intent x' },
      { modelName: 'canonical_economy_compose_v1', tier: 'tier_c_economy', fallbackChain: [] },
    );
    const premiumResp = invokeLiveProviderStub(premiumReq);
    const economyResp = invokeLiveProviderStub(economyReq);
    // premium base latency (2400) > economy base latency (380)
    expect(premiumResp.audit.stubLatencyMs).toBeGreaterThan(
      economyResp.audit.stubLatencyMs,
    );
  });
});

// ─── Block guards ─────────────────────────────────────────────────────────────

describe('invokeLiveProviderStub - block guards', () => {
  it('blocks empty tenantKey with tenant_scope_invalid', () => {
    const req = wellFormedStubRequest({ tenantKey: '' });
    const response = invokeLiveProviderStub(req);
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('tenant_scope_invalid');
  });

  it('blocks empty intent with context_pack_missing', () => {
    const req = wellFormedStubRequest({ intent: '' });
    const response = invokeLiveProviderStub(req);
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('context_pack_missing');
  });

  it('blocks empty contextPackRef with context_pack_missing', () => {
    const req = wellFormedStubRequest({ contextPackRef: '' });
    const response = invokeLiveProviderStub(req);
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('context_pack_missing');
  });

  it('block responses still emit a fully populated audit record', () => {
    const req = wellFormedStubRequest({ tenantKey: '' });
    const response = invokeLiveProviderStub(req);
    expect(response.audit.invocationId).toMatch(/^mg3-live-/);
    expect(response.audit.trace.gatewayVersion).toBe('mg3.live-provider-stub.v1');
    expect(response.audit.decision).toBe('block');
    expect(response.audit.reason).toBe('tenant_scope_invalid');
    expect(response.audit.tokenCounts.totalTokens).toBe(0);
    expect(response.audit.stubLatencyMs).toBe(0);
    expect(response.honestNote).toMatch(/Live provider not implemented/);
  });

  it('completionText is absent on block', () => {
    const req = wellFormedStubRequest({ tenantKey: '' });
    const response = invokeLiveProviderStub(req);
    expect(response.completionText).toBeUndefined();
  });
});

// ─── Unknown model name ───────────────────────────────────────────────────────

describe('invokeLiveProviderStub - unrecognised canonical model', () => {
  it('still returns stubbed_live (not block) for unknown model name', () => {
    const req = wellFormedStubRequest(
      {},
      { modelName: 'canonical_unknown_future_v1', tier: 'tier_b_balanced', fallbackChain: [] },
    );
    const response = invokeLiveProviderStub(req);
    expect(response.decision).toBe('stubbed_live');
  });

  it('sets providerName to undefined on response (audit records unknown)', () => {
    const req = wellFormedStubRequest(
      {},
      { modelName: 'canonical_unknown_future_v1', tier: 'tier_b_balanced', fallbackChain: [] },
    );
    const response = invokeLiveProviderStub(req);
    // Response field is undefined for unknown provider; audit records 'unknown'
    expect(response.providerName).toBeUndefined();
    expect(response.audit.providerName).toBe('unknown');
  });
});

// ─── estimateTokenCounts ──────────────────────────────────────────────────────

describe('estimateTokenCounts', () => {
  it('returns promptTokens ≥ 1 for any non-empty intent', () => {
    const counts = estimateTokenCounts('hi', 'canonical_balanced_compose_v1');
    expect(counts.promptTokens).toBeGreaterThanOrEqual(1);
  });

  it('totalTokens = promptTokens + completionTokens', () => {
    const counts = estimateTokenCounts(
      'compose a detailed program brief with full context',
      'canonical_premium_compose_v1',
    );
    expect(counts.totalTokens).toBe(counts.promptTokens + counts.completionTokens);
  });

  it('completionTokens are bounded at 512', () => {
    // A very long intent that would produce a large prompt estimate.
    const longIntent = 'a'.repeat(10000);
    const counts = estimateTokenCounts(longIntent, 'canonical_balanced_compose_v1');
    expect(counts.completionTokens).toBeLessThanOrEqual(512);
  });

  it('is deterministic for the same inputs', () => {
    const a = estimateTokenCounts('build context pack', 'canonical_economy_compose_v1');
    const b = estimateTokenCounts('build context pack', 'canonical_economy_compose_v1');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ─── generateStubCompletion ───────────────────────────────────────────────────

describe('generateStubCompletion', () => {
  it('always includes [MG3 stub] prefix', () => {
    const text = generateStubCompletion('any intent', 'any_model');
    expect(text).toMatch(/\[MG3 stub\]/);
  });

  it('includes the intent prefix', () => {
    const text = generateStubCompletion('write executive summary', 'canonical_premium_compose_v1');
    expect(text).toMatch(/write executive summary/);
  });

  it('truncates long intents to 40 chars with ellipsis', () => {
    const longIntent = 'a'.repeat(80);
    const text = generateStubCompletion(longIntent, 'canonical_balanced_compose_v1');
    expect(text).toMatch(/\.\.\./);
  });

  it('is deterministic for the same inputs', () => {
    const a = generateStubCompletion('detect pattern drift', 'canonical_economy_compose_v1');
    const b = generateStubCompletion('detect pattern drift', 'canonical_economy_compose_v1');
    expect(a).toBe(b);
  });
});

// ─── deriveProviderName ───────────────────────────────────────────────────────

describe('deriveProviderName', () => {
  it('maps canonical_premium_compose_v1 → provider-alpha', () => {
    expect(deriveProviderName('canonical_premium_compose_v1')).toBe('provider-alpha');
  });

  it('maps canonical_balanced_compose_v1 → provider-beta', () => {
    expect(deriveProviderName('canonical_balanced_compose_v1')).toBe('provider-beta');
  });

  it('maps canonical_economy_compose_v1 → provider-gamma', () => {
    expect(deriveProviderName('canonical_economy_compose_v1')).toBe('provider-gamma');
  });

  it('maps canonical_local_rerank_v1 → provider-local', () => {
    expect(deriveProviderName('canonical_local_rerank_v1')).toBe('provider-local');
  });

  it('returns unknown for unrecognised model names', () => {
    expect(deriveProviderName('gpt-4-turbo')).toBe('unknown');
    expect(deriveProviderName('claude-3-opus')).toBe('unknown');
    expect(deriveProviderName('')).toBe('unknown');
  });

  it('does not resolve real provider model ids to a valid provider', () => {
    // Provider SDK model ids must never resolve to a canonical provider name.
    const realIds = [
      'gpt-4',
      'gpt-4o',
      'claude-3-5-sonnet',
      'mistral-large',
      'llama-3.1-70b',
    ];
    for (const id of realIds) {
      expect(deriveProviderName(id)).toBe('unknown');
    }
  });
});

// ─── buildLiveProviderStubRequest ─────────────────────────────────────────────

describe('buildLiveProviderStubRequest', () => {
  it('bundles the gateway request and route into a stub request', () => {
    const gatewayReq = wellFormedGatewayRequest();
    const route = wellFormedRoute();
    const stubReq = buildLiveProviderStubRequest(gatewayReq, route);
    expect(stubReq.gatewayRequest).toBe(gatewayReq);
    expect(stubReq.route).toBe(route);
  });

  it('produces a stub request that successfully invokes', () => {
    const stubReq = buildLiveProviderStubRequest(
      wellFormedGatewayRequest(),
      wellFormedRoute(),
    );
    const response = invokeLiveProviderStub(stubReq);
    expect(response.decision).toBe('stubbed_live');
  });

  it('can be composed with MG2 routeModelGatewayRequest output', () => {
    const gatewayReq = wellFormedGatewayRequest();
    const mg2Response = routeModelGatewayRequest(gatewayReq);
    expect(mg2Response.decision).toBe('dry_run');
    expect(mg2Response.route).toBeDefined();

    const stubReq = buildLiveProviderStubRequest(
      gatewayReq,
      mg2Response.route!,
    );
    const mg3Response = invokeLiveProviderStub(stubReq);
    expect(mg3Response.decision).toBe('stubbed_live');
    // MG3 invocationId is distinct from MG2 requestId
    expect(mg3Response.audit.invocationId).not.toBe(
      mg2Response.audit.requestId,
    );
    expect(mg3Response.audit.invocationId).toMatch(/^mg3-live-/);
  });
});

// ─── summarizeLiveProviderStubResponse ───────────────────────────────────────

describe('summarizeLiveProviderStubResponse', () => {
  it('produces a deterministic single-line summary for stubbed_live', () => {
    const response = invokeLiveProviderStub(wellFormedStubRequest());
    const summary = summarizeLiveProviderStubResponse(response);
    expect(summary).toMatch(/^mg3:apexretail:nexus -> stubbed_live/);
    expect(summary).toMatch(/via provider-beta/);
    expect(summary).toMatch(/\[invoc mg3-live-/);
  });

  it('includes the typed reason on block responses', () => {
    const response = invokeLiveProviderStub(
      wellFormedStubRequest({ tenantKey: '' }),
    );
    const summary = summarizeLiveProviderStubResponse(response);
    expect(summary).toMatch(/-> block \(tenant_scope_invalid\)/);
  });

  it('is deterministic across calls', () => {
    const response = invokeLiveProviderStub(wellFormedStubRequest());
    const a = summarizeLiveProviderStubResponse(response);
    const b = summarizeLiveProviderStubResponse(response);
    expect(a).toBe(b);
  });
});

// ─── Module hygiene ───────────────────────────────────────────────────────────

describe('module hygiene - model-gateway-live-provider-stub.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/model-gateway-live-provider-stub.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  function stripStringLiterals(src: string): string {
    return src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n')
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      .replace(/`(?:\\.|[^`\\])*`/g, '``');
  }

  const codeOnly = stripStringLiterals(source);

  it('does not import any provider SDK', () => {
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'openai'/);
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'anthropic'/);
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'@anthropic-ai\/[^']+'/);
    expect(source).not.toMatch(/import\s+[^;]*\s+from\s+'@openai\/[^']+'/);
  });

  it('does not import from forbidden runtimes', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/supabase/);
  });

  it('does not call Date.now / Math.random / new Date(', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
  });

  it('does not call fetch( or reference live SDK names in code', () => {
    expect(codeOnly).not.toMatch(/\bfetch\(/);
    // Real provider names must not appear in code (string literals stripped)
    expect(codeOnly).not.toMatch(/\banthropic\b/i);
    expect(codeOnly).not.toMatch(/\bopenai\b/i);
  });

  it('does not use React state hooks', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not contain placeholder copy', () => {
    expect(codeOnly).not.toMatch(/Coming soon/);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/);
  });

  it('only imports from model-gateway-stub (no other architecture or runtime deps)', () => {
    // The file should import from model-gateway-stub (relative or alias form)
    // and from no other internal modules.
    expect(source).toMatch(/from ['"](?:\.\/|@\/lib\/architecture\/)model-gateway-stub['"]/);
    // No imports from other lib areas.
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/intelligence\//);
  });
});

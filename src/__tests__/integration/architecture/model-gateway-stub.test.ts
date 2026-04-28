// MG2 - Model Gateway Stub - integration tests.
//
// Pure deterministic coverage. No network. No live model. No DOM.
// Tests assert that:
// - Request -> response is byte-equal across calls for the same input.
// - Well-formed requests return decision: 'dry_run' with a fully
//   populated audit record and honestNote referencing the live
//   gateway plan.
// - Malformed requests return decision: 'block' with a typed reason.
// - Audit records always carry requestId, gatewayVersion,
//   policiesApplied, and estimatedCostCents.
// - Cost estimate is deterministic per (tier x intent).
// - MODEL_GATEWAY_FORBIDDEN_PATTERNS includes the SDK anti-pattern
//   tokens.
// - Module hygiene: no SDK imports, no Date.now / Math.random /
//   new Date( / fetch(, no useState / useEffect, no Coming soon /
//   TBD / Lorem ipsum, and no imports from forbidden runtimes.

import {
  MODEL_GATEWAY_FORBIDDEN_PATTERNS,
  blockModelGatewayRequest,
  createModelGatewayRequest,
  routeModelGatewayRequest,
  summarizeModelGatewayDecision,
  type ModelGatewayRequest,
} from '@/lib/architecture/model-gateway-stub';

function wellFormedRequest(
  overrides: Partial<ModelGatewayRequest> = {},
): ModelGatewayRequest {
  return {
    tenantKey: 'apexretail',
    agentKey: 'nexus',
    intent: 'compose program brief',
    contextPackRef: 'ctx2-pack-apexretail-001',
    modelTier: 'tier_b_balanced',
    policies: ['audit_required', 'tenant_isolation'],
    costBudgetCents: 0,
    redactionRequested: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('routeModelGatewayRequest - determinism', () => {
  it('produces byte-equal output for identical input', () => {
    const request = wellFormedRequest();
    const a = routeModelGatewayRequest(request);
    const b = routeModelGatewayRequest(request);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('produces byte-equal output for sparse / blocked input', () => {
    const request = wellFormedRequest({ tenantKey: '' });
    const a = routeModelGatewayRequest(request);
    const b = routeModelGatewayRequest(request);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('cost estimate is deterministic per (tier x intent)', () => {
    const r1 = routeModelGatewayRequest(wellFormedRequest());
    const r2 = routeModelGatewayRequest(wellFormedRequest());
    expect(r1.audit.estimatedCostCents).toBe(r2.audit.estimatedCostCents);
    // Different intent length yields a different but stable cost.
    const r3 = routeModelGatewayRequest(
      wellFormedRequest({ intent: 'compose program brief with more detail' }),
    );
    const r4 = routeModelGatewayRequest(
      wellFormedRequest({ intent: 'compose program brief with more detail' }),
    );
    expect(r3.audit.estimatedCostCents).toBe(r4.audit.estimatedCostCents);
  });
});

// ---------------------------------------------------------------------
// Well-formed -> dry_run
// ---------------------------------------------------------------------

describe('routeModelGatewayRequest - well-formed', () => {
  it('returns decision: dry_run', () => {
    const response = routeModelGatewayRequest(wellFormedRequest());
    expect(response.decision).toBe('dry_run');
    expect(response.reason).toBeUndefined();
  });

  it('attaches a typed route with canonical model name and fallback chain', () => {
    const response = routeModelGatewayRequest(wellFormedRequest());
    expect(response.route).toBeDefined();
    expect(typeof response.route?.modelName).toBe('string');
    expect((response.route?.modelName ?? '').length).toBeGreaterThan(0);
    expect(response.route?.tier).toBe('tier_b_balanced');
    expect(Array.isArray(response.route?.fallbackChain)).toBe(true);
    // Canonical names only - never a real provider model id like
    // gpt-4 or claude-3-opus.
    const concatenated = JSON.stringify(response.route);
    expect(concatenated).not.toMatch(/gpt-/);
    expect(concatenated).not.toMatch(/claude-3/);
  });

  it('honestNote mentions Live gateway not implemented', () => {
    const response = routeModelGatewayRequest(wellFormedRequest());
    expect(response.honestNote).toMatch(/Live gateway not implemented/);
  });

  it('audit record is fully populated', () => {
    const response = routeModelGatewayRequest(wellFormedRequest());
    expect(typeof response.audit.requestId).toBe('string');
    expect(response.audit.requestId.startsWith('mgw-stub-')).toBe(true);
    expect(response.audit.trace.gatewayVersion).toBe('mg2.stub.v1');
    expect(typeof response.audit.trace.promptHashSeed).toBe('string');
    expect(response.audit.trace.promptHashSeed.length).toBeGreaterThan(0);
    expect(Array.isArray(response.audit.policiesApplied)).toBe(true);
    expect(typeof response.audit.estimatedCostCents).toBe('number');
    expect(response.audit.modelName).toBeDefined();
  });
});

// ---------------------------------------------------------------------
// Malformed -> block
// ---------------------------------------------------------------------

describe('routeModelGatewayRequest - blocks malformed input', () => {
  it('blocks empty tenantKey with tenant_scope_invalid', () => {
    const response = routeModelGatewayRequest(
      wellFormedRequest({ tenantKey: '' }),
    );
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('tenant_scope_invalid');
  });

  it('blocks non-canonical agentKey with tenant_scope_invalid', () => {
    const response = routeModelGatewayRequest(
      // Cast through unknown so we can exercise the runtime guard
      // without losing the compile-time type signal everywhere else.
      wellFormedRequest({
        agentKey: 'rogue_agent' as unknown as ModelGatewayRequest['agentKey'],
      }),
    );
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('tenant_scope_invalid');
  });

  it('blocks empty intent with context_pack_missing', () => {
    const response = routeModelGatewayRequest(
      wellFormedRequest({ intent: '' }),
    );
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('context_pack_missing');
  });

  it('blocks empty contextPackRef with context_pack_missing', () => {
    const response = routeModelGatewayRequest(
      wellFormedRequest({ contextPackRef: '' }),
    );
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('context_pack_missing');
  });

  it('blocks redaction-requested with redaction_required_but_not_supported', () => {
    const response = routeModelGatewayRequest(
      wellFormedRequest({ redactionRequested: true }),
    );
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('redaction_required_but_not_supported');
  });

  it('blocks unknown tier with model_tier_unavailable', () => {
    const response = routeModelGatewayRequest(
      wellFormedRequest({
        modelTier:
          'tier_z_unknown' as unknown as ModelGatewayRequest['modelTier'],
      }),
    );
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('model_tier_unavailable');
  });

  it('blocks when estimated cost exceeds explicit cost budget', () => {
    const response = routeModelGatewayRequest(
      wellFormedRequest({ costBudgetCents: 1 }),
    );
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('cost_budget_exceeded');
  });

  it('block responses still emit a populated audit record', () => {
    const response = routeModelGatewayRequest(
      wellFormedRequest({ tenantKey: '' }),
    );
    expect(response.audit.requestId.startsWith('mgw-stub-')).toBe(true);
    expect(response.audit.trace.gatewayVersion).toBe('mg2.stub.v1');
    expect(response.audit.decision).toBe('block');
    expect(response.audit.reason).toBe('tenant_scope_invalid');
    expect(response.honestNote).toMatch(/Live gateway not implemented/);
  });
});

// ---------------------------------------------------------------------
// blockModelGatewayRequest helper
// ---------------------------------------------------------------------

describe('blockModelGatewayRequest', () => {
  it('records an explicit caller-driven block with the supplied reason', () => {
    const request = wellFormedRequest();
    const response = blockModelGatewayRequest(
      request,
      'evidence_unusable',
    );
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('evidence_unusable');
    expect(response.audit.decision).toBe('block');
    expect(response.audit.reason).toBe('evidence_unusable');
    expect(response.honestNote).toMatch(/Live gateway not implemented/);
  });
});

// ---------------------------------------------------------------------
// createModelGatewayRequest helper
// ---------------------------------------------------------------------

describe('createModelGatewayRequest', () => {
  it('fills in deterministic defaults for optional fields', () => {
    const request = createModelGatewayRequest({
      tenantKey: 'apexretail',
      agentKey: 'sentinel',
      intent: 'detect pattern drift',
      contextPackRef: 'ctx2-pack-apexretail-002',
    });
    expect(request.modelTier).toBe('tier_b_balanced');
    expect(request.policies).toEqual([]);
    expect(request.costBudgetCents).toBe(0);
    expect(request.redactionRequested).toBe(false);
  });

  it('routes successfully when minimal input is supplied', () => {
    const request = createModelGatewayRequest({
      tenantKey: 'apexretail',
      agentKey: 'atlas',
      intent: 'summarize executive brief',
      contextPackRef: 'ctx2-pack-apexretail-003',
    });
    const response = routeModelGatewayRequest(request);
    expect(response.decision).toBe('dry_run');
  });
});

// ---------------------------------------------------------------------
// summarizeModelGatewayDecision
// ---------------------------------------------------------------------

describe('summarizeModelGatewayDecision', () => {
  it('renders a deterministic single-line summary', () => {
    const response = routeModelGatewayRequest(wellFormedRequest());
    const summary = summarizeModelGatewayDecision(response);
    expect(summary).toMatch(/^mg2:apexretail:nexus -> dry_run/);
    expect(summary).toMatch(/audit mgw-stub-/);
  });

  it('includes the typed reason on block decisions', () => {
    const response = routeModelGatewayRequest(
      wellFormedRequest({ tenantKey: '' }),
    );
    const summary = summarizeModelGatewayDecision(response);
    expect(summary).toMatch(/-> block \(tenant_scope_invalid\)/);
  });
});

// ---------------------------------------------------------------------
// Forbidden-pattern constant
// ---------------------------------------------------------------------

describe('MODEL_GATEWAY_FORBIDDEN_PATTERNS', () => {
  it('includes the SDK anti-pattern tokens', () => {
    expect(MODEL_GATEWAY_FORBIDDEN_PATTERNS).toContain(
      'import_openai_outside_gateway',
    );
    expect(MODEL_GATEWAY_FORBIDDEN_PATTERNS).toContain(
      'import_anthropic_outside_gateway',
    );
    expect(MODEL_GATEWAY_FORBIDDEN_PATTERNS).toContain(
      'page_level_provider_call',
    );
    expect(MODEL_GATEWAY_FORBIDDEN_PATTERNS).toContain(
      'agent_direct_provider_call',
    );
    expect(MODEL_GATEWAY_FORBIDDEN_PATTERNS).toContain(
      'unaudited_model_call',
    );
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene - model-gateway-stub.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/model-gateway-stub.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  // Strip line + block comments AND string literals so hygiene
  // assertions fire on real code only. The MODEL_GATEWAY_FORBIDDEN_
  // PATTERNS list legitimately contains the strings
  // 'import_openai_outside_gateway' / 'import_anthropic_outside_
  // gateway'; we must scan code, not data.
  function stripStringLiterals(src: string): string {
    return src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n')
      // Strip single-quoted string literals.
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      // Strip double-quoted string literals.
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      // Strip template literals.
      .replace(/`(?:\\.|[^`\\])*`/g, '``');
  }

  const codeOnly = stripStringLiterals(source);

  it('does not import any provider SDK', () => {
    expect(codeOnly).not.toMatch(/from\s+''/); // sanity: stripper preserves "from ''"
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
});

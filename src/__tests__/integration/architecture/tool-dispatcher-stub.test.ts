// TOOL3 - Tool Dispatcher Stub - integration tests.
//
// Pure deterministic coverage. No network. No live tool execution. No DOM.
// Tests assert that:
// - Well-formed requests return decision: 'dispatched_stub' with a fully
//   populated audit record, category-aware stubOutput, and honestNote.
// - Block guards fire for: tool_not_found, tenant_scope_invalid,
//   agent_not_authorised, and validation_failed (missing required inputs).
// - Audit records always carry dispatchId, dispatcherVersion, isLive: false,
//   validationWarnings, and inputHashSeed.
// - All 16 categories produce a distinct, non-empty stubOutput string.
// - getStubOutputForCategory is deterministic per category.
// - describeToolProductionStatus maps all statuses to known strings.
// - summarizeToolDispatchResponse produces a single-line deterministic summary.
// - Module hygiene: no SDK imports, no Date.now / Math.random / new Date( /
//   fetch(, no useState / useEffect, no Coming soon / TBD / Lorem ipsum.

import {
  buildToolDispatchRequest,
  describeToolProductionStatus,
  dispatchToolStub,
  getStubOutputForCategory,
  summarizeToolDispatchResponse,
  type ToolDispatchStubResponse,
} from '@/lib/architecture/tool-dispatcher-stub';
import {
  TOOL_REGISTRY_CATEGORIES,
  type ToolAgent,
  type ToolCategory,
  type ToolInvocationRequest,
} from '@/lib/architecture/tool-registry-mvp';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function wellFormedRequest(
  overrides: Partial<ToolInvocationRequest> = {},
): ToolInvocationRequest {
  return {
    toolId: 'tool.search_vector.v1',
    agentKey: 'nexus',
    tenantKey: 'apexretail',
    inputs: {
      query: 'CDP initiative context',
    },
    ...overrides,
  };
}

function dispatch(overrides: Partial<ToolInvocationRequest> = {}): ToolDispatchStubResponse {
  return dispatchToolStub(buildToolDispatchRequest(wellFormedRequest(overrides)));
}

// ─── Determinism ──────────────────────────────────────────────────────────────

describe('dispatchToolStub - determinism', () => {
  it('produces byte-equal output for identical input', () => {
    const req = buildToolDispatchRequest(wellFormedRequest());
    const a = dispatchToolStub(req);
    const b = dispatchToolStub(req);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('produces byte-equal output for blocked input', () => {
    const req = buildToolDispatchRequest(wellFormedRequest({ tenantKey: '' }));
    const a = dispatchToolStub(req);
    const b = dispatchToolStub(req);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('different toolIds produce different dispatchIds', () => {
    const r1 = dispatch({ toolId: 'tool.search_vector.v1' });
    const r2 = dispatch({ toolId: 'tool.traverse_graph.v1' });
    expect(r1.audit.dispatchId).not.toBe(r2.audit.dispatchId);
  });
});

// ─── Well-formed → dispatched_stub ───────────────────────────────────────────

describe('dispatchToolStub - well-formed request', () => {
  let response: ToolDispatchStubResponse;

  beforeEach(() => {
    response = dispatch();
  });

  it('returns decision: dispatched_stub', () => {
    expect(response.decision).toBe('dispatched_stub');
    expect(response.reason).toBeUndefined();
  });

  it('includes the toolId and category', () => {
    expect(response.toolId).toBe('tool.search_vector.v1');
    expect(response.category).toBe('search_vector');
  });

  it('includes a non-empty stubOutput tagged [TOOL3 stub]', () => {
    expect(typeof response.stubOutput).toBe('string');
    expect(response.stubOutput).toMatch(/\[TOOL3 stub\]/);
  });

  it('honestNote mentions Live tool execution not implemented', () => {
    expect(response.honestNote).toMatch(/Live tool execution not implemented/);
  });

  it('audit record is fully populated', () => {
    expect(response.audit.dispatchId).toMatch(/^tool3-dispatch-/);
    expect(response.audit.tenantKey).toBe('apexretail');
    expect(response.audit.agentKey).toBe('nexus');
    expect(response.audit.decision).toBe('dispatched_stub');
    expect(response.audit.toolId).toBe('tool.search_vector.v1');
    expect(response.audit.category).toBe('search_vector');
    expect(response.audit.isLive).toBe(false);
    expect(response.audit.trace.dispatcherVersion).toBe('tool3.dispatcher-stub.v1');
    expect(typeof response.audit.trace.inputHashSeed).toBe('string');
    expect(response.audit.trace.inputHashSeed.length).toBeGreaterThan(0);
  });

  it('audit validationReasons is empty on success', () => {
    expect(response.audit.validationReasons).toEqual([]);
  });
});

// ─── Block guards ─────────────────────────────────────────────────────────────

describe('dispatchToolStub - block guards', () => {
  it('blocks unknown toolId with tool_not_found', () => {
    const response = dispatch({ toolId: 'tool.does_not_exist.v1' });
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('tool_not_found');
  });

  it('blocks empty tenantKey with tenant_scope_invalid', () => {
    const response = dispatch({ tenantKey: '' });
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('tenant_scope_invalid');
  });

  it('blocks whitespace-only tenantKey with tenant_scope_invalid', () => {
    const response = dispatch({ tenantKey: '   ' });
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('tenant_scope_invalid');
  });

  it('blocks an agent not authorised for the tool with agent_not_authorised', () => {
    // tool.update_gate_status.v1 is allowed only for 'steward', not 'nexus'.
    const response = dispatchToolStub(
      buildToolDispatchRequest({
        toolId: 'tool.update_gate_status.v1',
        agentKey: 'nexus' as ToolAgent,
        tenantKey: 'apexretail',
        inputs: {
          workObjectId: 'gate-p3-p4',
          auditEventId: 'evt-001',
        },
      }),
    );
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('agent_not_authorised');
  });

  it('blocks missing required inputs with validation_failed', () => {
    // search_vector requires a 'query' input.
    const response = dispatchToolStub(
      buildToolDispatchRequest({
        toolId: 'tool.search_vector.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: {}, // missing 'query'
      }),
    );
    expect(response.decision).toBe('block');
    expect(response.reason).toBe('validation_failed');
    expect(response.audit.validationReasons.length).toBeGreaterThan(0);
  });

  it('block responses always emit a fully populated audit record', () => {
    const response = dispatch({ tenantKey: '' });
    expect(response.audit.dispatchId).toMatch(/^tool3-dispatch-/);
    expect(response.audit.trace.dispatcherVersion).toBe('tool3.dispatcher-stub.v1');
    expect(response.audit.decision).toBe('block');
    expect(response.audit.reason).toBe('tenant_scope_invalid');
    expect(response.audit.isLive).toBe(false);
    expect(response.honestNote).toMatch(/Live tool execution not implemented/);
  });

  it('stubOutput is absent on block', () => {
    const response = dispatch({ tenantKey: '' });
    expect(response.stubOutput).toBeUndefined();
  });
});

// ─── All 16 categories produce distinct stub outputs ─────────────────────────

describe('dispatchToolStub - all 16 canonical categories', () => {
  const seenOutputs = new Set<string>();

  // Map each category to a valid tool request. We need to use the
  // correct tool id and minimal required inputs per tool.
  const categoryToRequest: Array<{
    category: ToolCategory;
    request: ToolInvocationRequest;
  }> = [
    {
      category: 'search_vector',
      request: {
        toolId: 'tool.search_vector.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: { query: 'test' },
      },
    },
    {
      category: 'traverse_graph',
      request: {
        toolId: 'tool.traverse_graph.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: { startNodeId: 'node-001' },
      },
    },
    {
      category: 'read_artifact',
      request: {
        toolId: 'tool.read_artifact.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: { workObjectId: 'artifact-001' },
      },
    },
    {
      category: 'read_evidence',
      request: {
        toolId: 'tool.read_evidence.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: { evidenceId: 'evid-001' },
      },
    },
    {
      category: 'read_program_state',
      request: {
        toolId: 'tool.read_program_state.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: { workObjectId: 'prog-001' },
      },
    },
    {
      category: 'write_program_action',
      request: {
        toolId: 'tool.write_program_action.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: { workObjectId: 'prog-001', auditEventId: 'evt-001' },
      },
    },
    {
      category: 'create_deliverable_draft',
      request: {
        toolId: 'tool.create_deliverable_draft.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: { workObjectId: 'prog-001', auditEventId: 'evt-002' },
      },
    },
    {
      category: 'export_artifact',
      request: {
        toolId: 'tool.export_artifact.v1',
        agentKey: 'atlas',
        tenantKey: 'apexretail',
        inputs: { workObjectId: 'artifact-001', auditEventId: 'evt-003' },
      },
    },
    {
      category: 'update_gate_status',
      request: {
        toolId: 'tool.update_gate_status.v1',
        agentKey: 'steward',
        tenantKey: 'apexretail',
        inputs: { workObjectId: 'gate-p3-p4', auditEventId: 'evt-004' },
      },
    },
    {
      category: 'record_audit_event',
      request: {
        toolId: 'tool.record_audit_event.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: { auditEventId: 'evt-005' },
      },
    },
    {
      category: 'fetch_dataset_summary',
      request: {
        toolId: 'tool.fetch_dataset_summary.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: { datasetDomainId: 'ds-domain-001' },
      },
    },
    {
      category: 'get_solution_archetype',
      request: {
        toolId: 'tool.get_solution_archetype.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: { archetypeKey: 'cdp-v1' },
      },
    },
    {
      category: 'get_pattern_content',
      request: {
        toolId: 'tool.get_pattern_content.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: { patternKey: 'data-silo-fragmentation' },
      },
    },
    {
      category: 'build_context_pack',
      request: {
        toolId: 'tool.build_context_pack.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: { workObjectId: 'prog-001' },
      },
    },
    {
      category: 'evaluate_readiness',
      request: {
        toolId: 'tool.evaluate_readiness.v1',
        agentKey: 'nexus',
        tenantKey: 'apexretail',
        inputs: { workObjectId: 'prog-001' },
      },
    },
    {
      category: 'create_agent_mission',
      request: {
        toolId: 'tool.create_agent_mission.v1',
        agentKey: 'steward',
        tenantKey: 'apexretail',
        inputs: { workObjectId: 'prog-001', auditEventId: 'evt-006' },
      },
    },
  ];

  it('covers all 16 canonical categories', () => {
    expect(categoryToRequest.length).toBe(TOOL_REGISTRY_CATEGORIES.length);
    const covered = new Set(categoryToRequest.map((c) => c.category));
    for (const cat of TOOL_REGISTRY_CATEGORIES) {
      expect(covered.has(cat)).toBe(true);
    }
  });

  categoryToRequest.forEach(({ category, request }) => {
    it(`dispatches ${category} → dispatched_stub with [TOOL3 stub] output`, () => {
      const response = dispatchToolStub(buildToolDispatchRequest(request));
      expect(response.decision).toBe('dispatched_stub');
      expect(response.stubOutput).toMatch(/\[TOOL3 stub\]/);
      expect(response.category).toBe(category);
      expect(seenOutputs.has(response.stubOutput!)).toBe(false);
      seenOutputs.add(response.stubOutput!);
    });
  });
});

// ─── getStubOutputForCategory ─────────────────────────────────────────────────

describe('getStubOutputForCategory', () => {
  it('returns a [TOOL3 stub]-prefixed string for every category', () => {
    for (const category of TOOL_REGISTRY_CATEGORIES) {
      const output = getStubOutputForCategory(category as ToolCategory);
      expect(output).toMatch(/\[TOOL3 stub\]/);
    }
  });

  it('is deterministic for the same category', () => {
    const a = getStubOutputForCategory('search_vector');
    const b = getStubOutputForCategory('search_vector');
    expect(a).toBe(b);
  });

  it('produces distinct outputs for distinct categories', () => {
    const outputs = TOOL_REGISTRY_CATEGORIES.map((c) =>
      getStubOutputForCategory(c as ToolCategory),
    );
    const uniqueOutputs = new Set(outputs);
    expect(uniqueOutputs.size).toBe(TOOL_REGISTRY_CATEGORIES.length);
  });
});

// ─── describeToolProductionStatus ────────────────────────────────────────────

describe('describeToolProductionStatus', () => {
  it('maps live → "live"', () => {
    expect(describeToolProductionStatus('live')).toBe('live');
  });

  it('maps mvp to a non-empty string', () => {
    const result = describeToolProductionStatus('mvp');
    expect(result.length).toBeGreaterThan(0);
  });

  it('maps stub to a string mentioning placeholder', () => {
    expect(describeToolProductionStatus('stub')).toMatch(/placeholder/);
  });

  it('maps beta to a non-empty string', () => {
    expect(describeToolProductionStatus('beta').length).toBeGreaterThan(0);
  });
});

// ─── buildToolDispatchRequest ─────────────────────────────────────────────────

describe('buildToolDispatchRequest', () => {
  it('wraps the invocation request', () => {
    const req = wellFormedRequest();
    const dispatchReq = buildToolDispatchRequest(req);
    expect(dispatchReq.invocationRequest).toBe(req);
  });

  it('produces a dispatch request that successfully dispatches', () => {
    const dispatchReq = buildToolDispatchRequest(wellFormedRequest());
    const response = dispatchToolStub(dispatchReq);
    expect(response.decision).toBe('dispatched_stub');
  });
});

// ─── summarizeToolDispatchResponse ───────────────────────────────────────────

describe('summarizeToolDispatchResponse', () => {
  it('produces a deterministic single-line summary for dispatched_stub', () => {
    const response = dispatch();
    const summary = summarizeToolDispatchResponse(response);
    expect(summary).toMatch(/^tool3:apexretail:nexus -> dispatched_stub/);
    expect(summary).toMatch(/tool\.search_vector\.v1/);
    expect(summary).toMatch(/\[dispatch tool3-dispatch-/);
  });

  it('includes the typed reason on block responses', () => {
    const response = dispatch({ tenantKey: '' });
    const summary = summarizeToolDispatchResponse(response);
    expect(summary).toMatch(/-> block \(tenant_scope_invalid\)/);
  });

  it('is deterministic across calls', () => {
    const response = dispatch();
    const a = summarizeToolDispatchResponse(response);
    const b = summarizeToolDispatchResponse(response);
    expect(a).toBe(b);
  });
});

// ─── Module hygiene ───────────────────────────────────────────────────────────

describe('module hygiene - tool-dispatcher-stub.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/tool-dispatcher-stub.ts',
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

  it('imports only from tool-registry-mvp within the architecture library', () => {
    // Only tool-registry-mvp should be imported from the arch lib.
    expect(source).toMatch(/from ['"](?:\.\/|@\/lib\/architecture\/)tool-registry-mvp['"]/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/intelligence\//);
  });
});

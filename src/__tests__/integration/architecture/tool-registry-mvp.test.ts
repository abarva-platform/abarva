// TOOL2 - Tool Registry MVP tests.
//
// Deterministic, file-pure suite for the TOOL2 read-only registry. No
// model providers, no network, no live tool execution, no migrations.

import {
  TOOL_REGISTRY_CATEGORIES,
  getAgentTool,
  listAgentTools,
  listToolsForAgent,
  summarizeToolRegistry,
  validateToolInvocationRequest,
  type ToolAgent,
  type ToolCategory,
  type ToolInvocationRequest,
  type ToolMetadata,
} from '@/lib/architecture/tool-registry-mvp';

const ALL_AGENTS: readonly ToolAgent[] = ['nexus', 'sentinel', 'atlas', 'steward'];

// ---------------------------------------------------------------------
// Determinism + canonical category coverage.
// ---------------------------------------------------------------------

describe('listAgentTools · determinism', () => {
  it('returns byte-equal JSON across repeated calls', () => {
    const first = JSON.stringify(listAgentTools());
    const second = JSON.stringify(listAgentTools());
    const third = JSON.stringify(listAgentTools());
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('every tool is tagged createdFrom: deterministic_tool_registry', () => {
    for (const tool of listAgentTools()) {
      expect(tool.createdFrom).toBe('deterministic_tool_registry');
    }
  });
});

describe('TOOL_REGISTRY_CATEGORIES · canonical order', () => {
  it('has exactly 16 entries in canonical order', () => {
    expect(TOOL_REGISTRY_CATEGORIES).toEqual([
      'search_vector',
      'traverse_graph',
      'read_artifact',
      'read_evidence',
      'read_program_state',
      'write_program_action',
      'create_deliverable_draft',
      'export_artifact',
      'update_gate_status',
      'record_audit_event',
      'fetch_dataset_summary',
      'get_solution_archetype',
      'get_pattern_content',
      'build_context_pack',
      'evaluate_readiness',
      'create_agent_mission',
    ]);
  });
});

describe('listAgentTools · category coverage', () => {
  it('contains exactly 16 seed tools', () => {
    expect(listAgentTools().length).toBe(16);
  });

  it('contains exactly one canonical tool per category', () => {
    const tools = listAgentTools();
    for (const category of TOOL_REGISTRY_CATEGORIES) {
      const matching = tools.filter((tool) => tool.category === category);
      expect(matching.length).toBe(1);
    }
  });

  it('every tool has a unique stable id', () => {
    const ids = listAgentTools().map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every tool id matches the canonical shape tool.<category>.v<n>', () => {
    for (const tool of listAgentTools()) {
      expect(tool.id).toMatch(/^tool\.[a-z_]+\.v\d+$/);
      expect(tool.id).toContain(`.${tool.category}.`);
    }
  });
});

// ---------------------------------------------------------------------
// Tenant scope, audit, and production status invariants.
// ---------------------------------------------------------------------

describe('tool metadata invariants', () => {
  it('every tool has tenantScopeRequired: true except get_pattern_content and get_solution_archetype', () => {
    const exempt = new Set<ToolCategory>(['get_pattern_content', 'get_solution_archetype']);
    for (const tool of listAgentTools()) {
      if (exempt.has(tool.category)) {
        expect(tool.tenantScopeRequired).toBe(false);
      } else {
        expect(tool.tenantScopeRequired).toBe(true);
      }
    }
  });

  it('every write or export tool has auditRequired: true', () => {
    for (const tool of listAgentTools()) {
      if (tool.readWriteMode === 'write' || tool.readWriteMode === 'export') {
        expect(tool.auditRequired).toBe(true);
      }
    }
  });

  it('record_audit_event is audit_only and auditRequired', () => {
    const tool = listAgentTools().find((t) => t.category === 'record_audit_event');
    expect(tool).toBeDefined();
    expect(tool!.readWriteMode).toBe('audit_only');
    expect(tool!.auditRequired).toBe(true);
  });

  it('every tool except record_audit_event has productionStatus mvp; record_audit_event is stub', () => {
    for (const tool of listAgentTools()) {
      if (tool.category === 'record_audit_event') {
        expect(tool.productionStatus).toBe('stub');
      } else {
        expect(tool.productionStatus).toBe('mvp');
      }
    }
  });

  it('no tool is in productionStatus live', () => {
    for (const tool of listAgentTools()) {
      expect(tool.productionStatus).not.toBe('live');
    }
  });

  it('update_gate_status is steward-only', () => {
    const tool = listAgentTools().find((t) => t.category === 'update_gate_status');
    expect(tool).toBeDefined();
    expect(tool!.allowedAgents).toEqual(['steward']);
  });

  it('read_evidence is allowed for all four agents', () => {
    const tool = listAgentTools().find((t) => t.category === 'read_evidence');
    expect(tool).toBeDefined();
    for (const agent of ALL_AGENTS) {
      expect(tool!.allowedAgents.includes(agent)).toBe(true);
    }
  });

  it('record_audit_event is allowed for all four agents', () => {
    const tool = listAgentTools().find((t) => t.category === 'record_audit_event');
    expect(tool).toBeDefined();
    for (const agent of ALL_AGENTS) {
      expect(tool!.allowedAgents.includes(agent)).toBe(true);
    }
  });

  it('every tool has at least one required input', () => {
    for (const tool of listAgentTools()) {
      expect(tool.requiredInputs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every tenant-scoped tool declares a tenantKey-typed required input', () => {
    for (const tool of listAgentTools()) {
      if (!tool.tenantScopeRequired) continue;
      const hasTenantKey = tool.requiredInputs.some((input) => input.type === 'tenantKey');
      expect(hasTenantKey).toBe(true);
    }
  });

  it('every tool has at least one forbiddenWhen with non-empty condition and remedy', () => {
    for (const tool of listAgentTools()) {
      expect(tool.forbiddenWhen.length).toBeGreaterThanOrEqual(1);
      for (const forbidden of tool.forbiddenWhen) {
        expect(forbidden.condition.trim().length).toBeGreaterThan(0);
        expect(forbidden.remedy.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('outputContract is non-empty on every tool', () => {
    for (const tool of listAgentTools()) {
      expect(tool.outputContract.trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Per-agent visibility.
// ---------------------------------------------------------------------

describe('listToolsForAgent', () => {
  it('returns at least 3 tools for every agent', () => {
    for (const agent of ALL_AGENTS) {
      const tools = listToolsForAgent(agent);
      expect(tools.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('every returned tool actually allows the requested agent', () => {
    for (const agent of ALL_AGENTS) {
      for (const tool of listToolsForAgent(agent)) {
        expect(tool.allowedAgents.includes(agent)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------
// getAgentTool.
// ---------------------------------------------------------------------

describe('getAgentTool', () => {
  it('returns the canonical tool for every registered id', () => {
    for (const tool of listAgentTools()) {
      const found = getAgentTool(tool.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(tool.id);
      expect(found!.category).toBe(tool.category);
    }
  });

  it('returns null for unknown ids', () => {
    expect(getAgentTool('tool.does_not_exist.v1')).toBeNull();
    expect(getAgentTool('')).toBeNull();
  });
});

// ---------------------------------------------------------------------
// summarizeToolRegistry.
// ---------------------------------------------------------------------

describe('summarizeToolRegistry', () => {
  it('reports totalTools = 16, liveCount = 0, auditRequiredCount > 0', () => {
    const summary = summarizeToolRegistry();
    expect(summary.totalTools).toBe(16);
    expect(summary.liveCount).toBe(0);
    expect(summary.auditRequiredCount).toBeGreaterThan(0);
  });

  it('byCategory totals exactly 1 for every canonical category', () => {
    const summary = summarizeToolRegistry();
    for (const category of TOOL_REGISTRY_CATEGORIES) {
      expect(summary.byCategory[category]).toBe(1);
    }
  });

  it('byMode totals reconcile to totalTools', () => {
    const summary = summarizeToolRegistry();
    const total =
      summary.byMode.read + summary.byMode.write + summary.byMode.export + summary.byMode.audit_only;
    expect(total).toBe(summary.totalTools);
  });

  it('byAgent counts match listToolsForAgent', () => {
    const summary = summarizeToolRegistry();
    for (const agent of ALL_AGENTS) {
      expect(summary.byAgent[agent]).toBe(listToolsForAgent(agent).length);
    }
  });
});

// ---------------------------------------------------------------------
// validateToolInvocationRequest.
// ---------------------------------------------------------------------

describe('validateToolInvocationRequest', () => {
  it('blocks unknown tool ids', () => {
    const result = validateToolInvocationRequest({
      toolId: 'tool.does_not_exist.v1',
      agentKey: 'nexus',
      tenantKey: 'acme',
      inputs: {},
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('not registered'))).toBe(true);
  });

  it('blocks empty tenantKey when the tool requires tenant scope', () => {
    const result = validateToolInvocationRequest({
      toolId: 'tool.read_evidence.v1',
      agentKey: 'nexus',
      tenantKey: '',
      inputs: { evidenceId: 'evid-seed-acme-charter-1' },
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.toLowerCase().includes('tenantkey'))).toBe(true);
  });

  it('allows empty tenantKey for tenant-agnostic tools (get_pattern_content)', () => {
    const result = validateToolInvocationRequest({
      toolId: 'tool.get_pattern_content.v1',
      agentKey: 'sentinel',
      tenantKey: '',
      inputs: { patternKey: 'pilot-purgatory' },
    });
    expect(result.isValid).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('blocks an unknown agentKey', () => {
    const result = validateToolInvocationRequest({
      toolId: 'tool.read_evidence.v1',
      // Force an unknown agent through the typed cast so the runtime
      // validator must catch it rather than the type checker.
      agentKey: 'rogue_agent' as unknown as ToolAgent,
      tenantKey: 'acme',
      inputs: { evidenceId: 'evid-seed-acme-charter-1' },
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.toLowerCase().includes('agent'))).toBe(true);
  });

  it('blocks a known agent that is not in allowedAgents (e.g. nexus on update_gate_status)', () => {
    const result = validateToolInvocationRequest({
      toolId: 'tool.update_gate_status.v1',
      agentKey: 'nexus',
      tenantKey: 'acme',
      inputs: {
        workObjectId: 'gate-acme-charter',
        auditEventId: 'audit-seed-1',
      },
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('not allowed'))).toBe(true);
  });

  it('blocks missing required inputs', () => {
    const result = validateToolInvocationRequest({
      toolId: 'tool.write_program_action.v1',
      agentKey: 'steward',
      tenantKey: 'acme',
      inputs: {
        // workObjectId and auditEventId are both missing.
      },
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('workObjectId'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('auditEventId'))).toBe(true);
  });

  it('blocks empty-string required inputs', () => {
    const result = validateToolInvocationRequest({
      toolId: 'tool.read_evidence.v1',
      agentKey: 'nexus',
      tenantKey: 'acme',
      inputs: { evidenceId: '   ' },
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('evidenceId'))).toBe(true);
  });

  it('blocks requests that include a forbiddenWhen trigger key in inputs', () => {
    const result = validateToolInvocationRequest({
      toolId: 'tool.read_evidence.v1',
      agentKey: 'nexus',
      tenantKey: 'acme',
      inputs: {
        evidenceId: 'evid-seed-acme-charter-1',
        evidence_quality_unusable: true,
      },
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('forbiddenWhen'))).toBe(true);
  });

  it('passes a well-formed read_evidence call by an allowed agent', () => {
    const result = validateToolInvocationRequest({
      toolId: 'tool.read_evidence.v1',
      agentKey: 'nexus',
      tenantKey: 'acme',
      inputs: { evidenceId: 'evid-seed-acme-charter-1' },
    });
    expect(result.isValid).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('passes a well-formed write_program_action call by steward with auditEventId', () => {
    const result = validateToolInvocationRequest({
      toolId: 'tool.write_program_action.v1',
      agentKey: 'steward',
      tenantKey: 'acme',
      inputs: {
        workObjectId: 'program-acme-contact-center',
        auditEventId: 'audit-seed-write-1',
      },
    });
    expect(result.isValid).toBe(true);
    expect(result.reasons).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Module hygiene + no-execution evidence.
// ---------------------------------------------------------------------

describe('module hygiene · tool-registry-mvp.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/tool-registry-mvp.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Sentinel / Atlas / Nexus / Agent / Source / Auth runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Anthropic / OpenAI runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
  });

  it('does not use React state hooks (useState / useEffect)', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not include placeholder language (Coming soon / TBD / Lorem ipsum)', () => {
    expect(codeOnly).not.toMatch(/Coming soon/i);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/i);
  });

  it('does not actually execute any tool: no await outside pure helpers, no shell, no fs writes', () => {
    // No `await` keyword is used anywhere in the source - the registry
    // is purely synchronous metadata.
    expect(codeOnly).not.toMatch(/\bawait\b/);
    // No fs writes (writeFile / appendFile / writeFileSync / etc.).
    expect(codeOnly).not.toMatch(/writeFile/);
    expect(codeOnly).not.toMatch(/appendFile/);
    expect(codeOnly).not.toMatch(/createWriteStream/);
    // No child process / shell exec.
    expect(codeOnly).not.toMatch(/child_process/);
    expect(codeOnly).not.toMatch(/\bspawn\(/);
    expect(codeOnly).not.toMatch(/\bexec\(/);
    expect(codeOnly).not.toMatch(/execSync/);
  });
});

// ---------------------------------------------------------------------
// Type-shape sanity (no test runner type imports leak).
// ---------------------------------------------------------------------

describe('type-shape sanity', () => {
  it('a ToolMetadata record can be constructed from a seed entry', () => {
    const tools: readonly ToolMetadata[] = listAgentTools();
    const first = tools[0];
    expect(typeof first.id).toBe('string');
    expect(typeof first.name).toBe('string');
  });

  it('ToolInvocationRequest narrows agent and tenant correctly', () => {
    const request: ToolInvocationRequest = {
      toolId: 'tool.search_vector.v1',
      agentKey: 'nexus',
      tenantKey: 'acme',
      inputs: { query: 'baseline AHT' },
    };
    const result = validateToolInvocationRequest(request);
    expect(result.isValid).toBe(true);
  });
});

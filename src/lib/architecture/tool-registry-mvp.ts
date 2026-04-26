// TOOL2 - Tool Registry MVP
//
// Deterministic, file-pure registry of the canonical agent tool surface.
// No model calls, no live tool execution, no persistence, no network.
// Every tool entry is a typed metadata record: which agents may call
// it, whether it reads or writes, whether tenant scope is required,
// whether audit is required, what inputs are mandatory, and which
// runtime preconditions explicitly forbid invocation.
//
// TOOL2 is the read-only companion to the (yet-unwritten) TOOL1 Tool
// Registry contract. The TOOL1 contract concepts are summarized inline
// in `docs/build/slices/TOOL2_TOOL_REGISTRY_MVP.md`. Concretely:
//
//   - A canonical tuple of 16 tool categories every agent runtime
//     must respect.
//   - Per-tool metadata: id, name, description, allowed agents,
//     read/write mode, tenant scope, audit requirement, production
//     status, required inputs, and forbiddenWhen preconditions.
//   - A request validator that refuses tenant-leaking, agent-mismatched,
//     or input-incomplete invocations without ever calling the tool.
//
// This module never runs a tool. It only describes them. The shape
// is intentionally aligned with EVID2 / CTX2: deterministic seed data,
// no Date.now / Math.random / new Date / fetch / model providers, and
// no imports from agent / sentinel / atlas / nexus / source / auth.

// ---------------------------------------------------------------------
// Canonical category tuple (order is contract).
// ---------------------------------------------------------------------

export const TOOL_REGISTRY_CATEGORIES = [
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
] as const;

export type ToolCategory = typeof TOOL_REGISTRY_CATEGORIES[number];

// ---------------------------------------------------------------------
// Public types.
// ---------------------------------------------------------------------

export type ToolReadWriteMode = 'read' | 'write' | 'export' | 'audit_only';
export type ToolProductionStatus = 'stub' | 'mvp' | 'beta' | 'live';
export type ToolAgent = 'nexus' | 'sentinel' | 'atlas' | 'steward';

export interface ToolRequiredInput {
  name: string;
  type:
    | 'tenantKey'
    | 'workObjectId'
    | 'contextPackRef'
    | 'auditEventId'
    | 'evidenceId'
    | 'datasetDomainId'
    | 'patternKey'
    | 'archetypeKey'
    | 'string'
    | 'number';
  description: string;
}

export interface ToolForbiddenWhen {
  condition: string;
  remedy: string;
}

export interface ToolMetadata {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  allowedAgents: readonly ToolAgent[];
  readWriteMode: ToolReadWriteMode;
  tenantScopeRequired: boolean;
  auditRequired: boolean;
  productionStatus: ToolProductionStatus;
  requiredInputs: readonly ToolRequiredInput[];
  forbiddenWhen: readonly ToolForbiddenWhen[];
  outputContract: string;
  createdFrom: 'deterministic_tool_registry';
}

export interface ToolInvocationRequest {
  toolId: string;
  agentKey: ToolAgent;
  tenantKey: string;
  inputs: Record<string, unknown>;
}

export interface ToolInvocationValidationResult {
  isValid: boolean;
  reasons: readonly string[];
  warnings: readonly string[];
}

export interface ToolRegistrySummary {
  totalTools: number;
  byCategory: Record<ToolCategory, number>;
  byMode: Record<ToolReadWriteMode, number>;
  byAgent: Record<ToolAgent, number>;
  auditRequiredCount: number;
  liveCount: number;
}

// ---------------------------------------------------------------------
// Canonical agent tuple (mirrors ToolAgent for summary scaffolding).
// ---------------------------------------------------------------------

const ALL_AGENTS: readonly ToolAgent[] = ['nexus', 'sentinel', 'atlas', 'steward'] as const;

// ---------------------------------------------------------------------
// Seed registry - one canonical tool per category, sixteen total.
// ---------------------------------------------------------------------

const SEED_TOOLS: readonly ToolMetadata[] = [
  // -------------------------------------------------------------------
  // Read tools.
  // -------------------------------------------------------------------
  {
    id: 'tool.search_vector.v1',
    name: 'Search Vector Index',
    category: 'search_vector',
    description:
      'Tenant-scoped semantic search over the indexed knowledge fabric. Returns ranked chunks with citations only; never returns raw secrets or unscoped content.',
    allowedAgents: ['nexus', 'sentinel', 'atlas', 'steward'],
    readWriteMode: 'read',
    tenantScopeRequired: true,
    auditRequired: false,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the query.' },
      { name: 'query', type: 'string', description: 'Natural-language query string.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Reject the call and surface a tenant_scope_invalid refusal to the agent.',
      },
      {
        condition: 'evidence_quality_unusable',
        remedy: 'Drop chunks whose evidence is not usable; never return blocked rows.',
      },
    ],
    outputContract:
      'Array of cited chunks with locator + raw source ref. No fabricated citations. No cross-tenant leakage.',
    createdFrom: 'deterministic_tool_registry',
  },
  {
    id: 'tool.traverse_graph.v1',
    name: 'Traverse Knowledge Graph',
    category: 'traverse_graph',
    description:
      'Tenant-scoped traversal across program / pattern / archetype / dataset edges. Returns typed neighbor IDs only.',
    allowedAgents: ['nexus', 'sentinel', 'atlas', 'steward'],
    readWriteMode: 'read',
    tenantScopeRequired: true,
    auditRequired: false,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the traversal.' },
      { name: 'startNodeId', type: 'string', description: 'Canonical node id to start from.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Reject before traversal; never cross tenant boundaries.',
      },
    ],
    outputContract:
      'List of typed neighbor ids with edge labels. No payloads, no PII, no unscoped nodes.',
    createdFrom: 'deterministic_tool_registry',
  },
  {
    id: 'tool.read_artifact.v1',
    name: 'Read Artifact',
    category: 'read_artifact',
    description:
      'Read a single tenant artifact by id. Sensitive content is gated by audit and tenant scope.',
    allowedAgents: ['nexus', 'sentinel', 'atlas', 'steward'],
    readWriteMode: 'read',
    tenantScopeRequired: true,
    auditRequired: true,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the artifact.' },
      { name: 'workObjectId', type: 'workObjectId', description: 'Canonical artifact id.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Refuse the read; never resolve cross-tenant artifact ids.',
      },
      {
        condition: 'governance_constraint_hard_violated',
        remedy: 'Refuse the read and emit a governance refusal event.',
      },
    ],
    outputContract:
      'Structured artifact metadata + body chunks with citations. Audit event recorded for every read.',
    createdFrom: 'deterministic_tool_registry',
  },
  {
    id: 'tool.read_evidence.v1',
    name: 'Read Evidence Ledger Entry',
    category: 'read_evidence',
    description:
      'Read a single evidence ledger entry by id. Returns only entries that are usable or explicitly blocked; never returns intermediate-state entries to live agents.',
    allowedAgents: ['nexus', 'sentinel', 'atlas', 'steward'],
    readWriteMode: 'read',
    tenantScopeRequired: true,
    auditRequired: true,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the evidence.' },
      { name: 'evidenceId', type: 'evidenceId', description: 'Canonical evidence ledger id.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Refuse the read; evidence is strictly tenant-scoped.',
      },
      {
        condition: 'evidence_quality_unusable',
        remedy: 'Refuse the read; surface the block reason instead of the evidence body.',
      },
    ],
    outputContract:
      'EvidenceLedgerEntry-shaped record with citation locator + raw source ref. Audit event always recorded.',
    createdFrom: 'deterministic_tool_registry',
  },
  {
    id: 'tool.read_program_state.v1',
    name: 'Read Program State',
    category: 'read_program_state',
    description:
      'Read the canonical view of a program: phases, gates, owner, and readiness summary.',
    allowedAgents: ['nexus', 'atlas', 'steward'],
    readWriteMode: 'read',
    tenantScopeRequired: true,
    auditRequired: true,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the program.' },
      { name: 'workObjectId', type: 'workObjectId', description: 'Canonical program id.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Refuse cross-tenant program reads.',
      },
    ],
    outputContract:
      'Canonical program view: phases, gates, owner, readiness percent. Audited on every read.',
    createdFrom: 'deterministic_tool_registry',
  },
  {
    id: 'tool.fetch_dataset_summary.v1',
    name: 'Fetch Dataset Domain Summary',
    category: 'fetch_dataset_summary',
    description:
      'Fetch the canonical summary of a tenant dataset domain (steward, refresh cadence, sensitivity tier).',
    allowedAgents: ['nexus', 'sentinel', 'steward'],
    readWriteMode: 'read',
    tenantScopeRequired: true,
    auditRequired: true,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the dataset domain.' },
      { name: 'datasetDomainId', type: 'datasetDomainId', description: 'Canonical dataset domain id.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Refuse cross-tenant dataset summaries.',
      },
    ],
    outputContract:
      'Domain summary: steward, sensitivity tier, refresh cadence, lineage status. No raw rows.',
    createdFrom: 'deterministic_tool_registry',
  },
  {
    id: 'tool.get_solution_archetype.v1',
    name: 'Get Solution Archetype',
    category: 'get_solution_archetype',
    description:
      'Read canonical (tenant-agnostic) solution archetype content from the SOL3/SOL5 registry.',
    allowedAgents: ['nexus', 'sentinel', 'atlas', 'steward'],
    readWriteMode: 'read',
    tenantScopeRequired: false,
    auditRequired: false,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'archetypeKey', type: 'archetypeKey', description: 'Canonical archetype key.' },
    ],
    forbiddenWhen: [
      {
        condition: 'archetype_key_unknown',
        remedy: 'Return an unknown_key refusal; never fabricate an archetype.',
      },
    ],
    outputContract:
      'Canonical archetype shape: archetypeKey, name, eligibility criteria, deliverable hooks, evidence hooks.',
    createdFrom: 'deterministic_tool_registry',
  },
  {
    id: 'tool.get_pattern_content.v1',
    name: 'Get Pattern Content',
    category: 'get_pattern_content',
    description:
      'Read canonical (tenant-agnostic) intelligence pattern content from the I1/I4 registry.',
    allowedAgents: ['nexus', 'sentinel', 'atlas', 'steward'],
    readWriteMode: 'read',
    tenantScopeRequired: false,
    auditRequired: false,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'patternKey', type: 'patternKey', description: 'Canonical pattern key.' },
    ],
    forbiddenWhen: [
      {
        condition: 'pattern_key_unknown',
        remedy: 'Return an unknown_key refusal; never fabricate a pattern.',
      },
    ],
    outputContract:
      'Canonical pattern shape: patternKey, name, signals, anti-signals, remediation hooks.',
    createdFrom: 'deterministic_tool_registry',
  },
  {
    id: 'tool.build_context_pack.v1',
    name: 'Build Unified Context Pack',
    category: 'build_context_pack',
    description:
      'Build the twelve-section Unified Context Pack for a given tenant + work object. Pure projection over canonical read models.',
    allowedAgents: ['nexus', 'sentinel', 'atlas', 'steward'],
    readWriteMode: 'read',
    tenantScopeRequired: true,
    auditRequired: false,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the pack.' },
      { name: 'workObjectId', type: 'workObjectId', description: 'Canonical work object id.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Refuse to build cross-tenant packs.',
      },
    ],
    outputContract:
      'CTX2 twelve-section pack with honest-empty sections where live wiring is deferred.',
    createdFrom: 'deterministic_tool_registry',
  },
  {
    id: 'tool.evaluate_readiness.v1',
    name: 'Evaluate Readiness',
    category: 'evaluate_readiness',
    description:
      'Evaluate the MW2 / PF2 readiness gates for a program or workshop and return a structured pass/fail.',
    allowedAgents: ['nexus', 'sentinel', 'atlas', 'steward'],
    readWriteMode: 'read',
    tenantScopeRequired: true,
    auditRequired: false,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the readiness call.' },
      { name: 'workObjectId', type: 'workObjectId', description: 'Program or workshop id.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Refuse the readiness evaluation.',
      },
    ],
    outputContract:
      'Readiness object: { gateKey, status, blockers[] }. Honest empty when readiness data is not yet wired.',
    createdFrom: 'deterministic_tool_registry',
  },
  // -------------------------------------------------------------------
  // Write tools.
  // -------------------------------------------------------------------
  {
    id: 'tool.write_program_action.v1',
    name: 'Write Program Action',
    category: 'write_program_action',
    description:
      'Append a structured program action (note, decision, or status update) to a program work object.',
    allowedAgents: ['nexus', 'steward'],
    readWriteMode: 'write',
    tenantScopeRequired: true,
    auditRequired: true,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the action.' },
      { name: 'workObjectId', type: 'workObjectId', description: 'Program id.' },
      { name: 'auditEventId', type: 'auditEventId', description: 'Audit event id correlating the action.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Refuse the write; do not persist cross-tenant actions.',
      },
      {
        condition: 'governance_constraint_hard_violated',
        remedy: 'Refuse the write and surface the governance reason in the audit event.',
      },
    ],
    outputContract:
      'New program-action record with stable id and audit event correlation. Idempotent on auditEventId.',
    createdFrom: 'deterministic_tool_registry',
  },
  {
    id: 'tool.create_deliverable_draft.v1',
    name: 'Create Deliverable Draft',
    category: 'create_deliverable_draft',
    description:
      'Create a draft deliverable artifact (charter, value ledger, adoption plan, etc.) with citation hooks but no live persistence.',
    allowedAgents: ['nexus', 'atlas', 'steward'],
    readWriteMode: 'write',
    tenantScopeRequired: true,
    auditRequired: true,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the deliverable.' },
      { name: 'workObjectId', type: 'workObjectId', description: 'Program or workshop id.' },
      { name: 'auditEventId', type: 'auditEventId', description: 'Audit event id correlating the draft.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Refuse the draft; cross-tenant deliverables are forbidden.',
      },
      {
        condition: 'evidence_quality_unusable',
        remedy: 'Refuse the draft; deliverables must cite usable evidence only.',
      },
    ],
    outputContract:
      'Deliverable draft id + structured sections + cited evidence ids. Always paired with audit event.',
    createdFrom: 'deterministic_tool_registry',
  },
  {
    id: 'tool.update_gate_status.v1',
    name: 'Update Gate Status',
    category: 'update_gate_status',
    description:
      'Steward-only write to advance, hold, or reset a program gate. Requires audit event and explicit reason.',
    allowedAgents: ['steward'],
    readWriteMode: 'write',
    tenantScopeRequired: true,
    auditRequired: true,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the gate.' },
      { name: 'workObjectId', type: 'workObjectId', description: 'Gate id (canonical).' },
      { name: 'auditEventId', type: 'auditEventId', description: 'Audit event id correlating the change.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Refuse the gate change.',
      },
      {
        condition: 'governance_constraint_hard_violated',
        remedy: 'Refuse the gate change; surface the governance reason in audit.',
      },
    ],
    outputContract:
      'Updated gate status with prior state + new state + steward identity + audit event id.',
    createdFrom: 'deterministic_tool_registry',
  },
  {
    id: 'tool.create_agent_mission.v1',
    name: 'Create Agent Mission',
    category: 'create_agent_mission',
    description:
      'Create a typed agent mission (Nexus, Sentinel, Atlas, or Steward) with explicit goal, scope, and stop conditions.',
    allowedAgents: ['atlas', 'steward'],
    readWriteMode: 'write',
    tenantScopeRequired: true,
    auditRequired: true,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the mission.' },
      { name: 'workObjectId', type: 'workObjectId', description: 'Program / workshop / pattern id.' },
      { name: 'auditEventId', type: 'auditEventId', description: 'Audit event id correlating the mission.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Refuse the mission; cross-tenant missions are forbidden.',
      },
      {
        condition: 'governance_constraint_hard_violated',
        remedy: 'Refuse the mission; surface the governance reason in audit.',
      },
    ],
    outputContract:
      'Mission record with goal, scope, stop conditions, and audit event id. Idempotent on auditEventId.',
    createdFrom: 'deterministic_tool_registry',
  },
  // -------------------------------------------------------------------
  // Export tool.
  // -------------------------------------------------------------------
  {
    id: 'tool.export_artifact.v1',
    name: 'Export Artifact',
    category: 'export_artifact',
    description:
      'Export a deliverable artifact (e.g. executive brief PDF) for a named consumer. Always audited.',
    allowedAgents: ['atlas', 'steward'],
    readWriteMode: 'export',
    tenantScopeRequired: true,
    auditRequired: true,
    productionStatus: 'mvp',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the export.' },
      { name: 'workObjectId', type: 'workObjectId', description: 'Artifact id to export.' },
      { name: 'auditEventId', type: 'auditEventId', description: 'Audit event id correlating the export.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Refuse the export.',
      },
      {
        condition: 'governance_constraint_hard_violated',
        remedy: 'Refuse the export; surface the governance reason in audit.',
      },
    ],
    outputContract:
      'Export bundle reference + audit event id. Bundle bytes never returned inline.',
    createdFrom: 'deterministic_tool_registry',
  },
  // -------------------------------------------------------------------
  // Audit-only tool.
  // -------------------------------------------------------------------
  {
    id: 'tool.record_audit_event.v1',
    name: 'Record Audit Event',
    category: 'record_audit_event',
    description:
      'Append a structured audit event to the (not-yet-live) audit ledger. Stub today; honest about no live persistence.',
    allowedAgents: ['nexus', 'sentinel', 'atlas', 'steward'],
    readWriteMode: 'audit_only',
    tenantScopeRequired: true,
    auditRequired: true,
    productionStatus: 'stub',
    requiredInputs: [
      { name: 'tenantKey', type: 'tenantKey', description: 'Tenant scope of the audit event.' },
      { name: 'auditEventId', type: 'auditEventId', description: 'Idempotency key for the event.' },
    ],
    forbiddenWhen: [
      {
        condition: 'tenant_scope_invalid',
        remedy: 'Refuse to record; audit events are strictly tenant-scoped.',
      },
    ],
    outputContract:
      'Acknowledgement record only. No live persistence until the audit ledger lands.',
    createdFrom: 'deterministic_tool_registry',
  },
];

// ---------------------------------------------------------------------
// Index by id (built once at module load, deterministic).
// ---------------------------------------------------------------------

const TOOLS_BY_ID: ReadonlyMap<string, ToolMetadata> = (() => {
  const map = new Map<string, ToolMetadata>();
  for (const tool of SEED_TOOLS) {
    map.set(tool.id, tool);
  }
  return map;
})();

// ---------------------------------------------------------------------
// Public helpers.
// ---------------------------------------------------------------------

export function listAgentTools(): readonly ToolMetadata[] {
  return SEED_TOOLS;
}

export function getAgentTool(id: string): ToolMetadata | null {
  return TOOLS_BY_ID.get(id) ?? null;
}

export function listToolsForAgent(agent: ToolAgent): readonly ToolMetadata[] {
  return SEED_TOOLS.filter((tool) => tool.allowedAgents.includes(agent));
}

export function summarizeToolRegistry(
  tools: readonly ToolMetadata[] = SEED_TOOLS,
): ToolRegistrySummary {
  const byCategory: Record<ToolCategory, number> = {
    search_vector: 0,
    traverse_graph: 0,
    read_artifact: 0,
    read_evidence: 0,
    read_program_state: 0,
    write_program_action: 0,
    create_deliverable_draft: 0,
    export_artifact: 0,
    update_gate_status: 0,
    record_audit_event: 0,
    fetch_dataset_summary: 0,
    get_solution_archetype: 0,
    get_pattern_content: 0,
    build_context_pack: 0,
    evaluate_readiness: 0,
    create_agent_mission: 0,
  };
  const byMode: Record<ToolReadWriteMode, number> = {
    read: 0,
    write: 0,
    export: 0,
    audit_only: 0,
  };
  const byAgent: Record<ToolAgent, number> = {
    nexus: 0,
    sentinel: 0,
    atlas: 0,
    steward: 0,
  };

  let auditRequiredCount = 0;
  let liveCount = 0;

  for (const tool of tools) {
    byCategory[tool.category] += 1;
    byMode[tool.readWriteMode] += 1;
    for (const agent of tool.allowedAgents) {
      byAgent[agent] += 1;
    }
    if (tool.auditRequired) auditRequiredCount += 1;
    if (tool.productionStatus === 'live') liveCount += 1;
  }

  return {
    totalTools: tools.length,
    byCategory,
    byMode,
    byAgent,
    auditRequiredCount,
    liveCount,
  };
}

export function validateToolInvocationRequest(
  request: ToolInvocationRequest,
): ToolInvocationValidationResult {
  const reasons: string[] = [];
  const warnings: string[] = [];

  const tool = TOOLS_BY_ID.get(request.toolId);
  if (!tool) {
    reasons.push(`tool id is not registered: ${request.toolId}`);
    return { isValid: false, reasons, warnings };
  }

  // Agent membership check.
  if (!ALL_AGENTS.includes(request.agentKey)) {
    reasons.push(`agentKey is not a known agent: ${String(request.agentKey)}`);
  }
  if (!tool.allowedAgents.includes(request.agentKey)) {
    reasons.push(
      `agent ${String(request.agentKey)} is not allowed to invoke tool ${tool.id}`,
    );
  }

  // Tenant scope check.
  const tenantKeyEmpty = !request.tenantKey || request.tenantKey.trim().length === 0;
  if (tool.tenantScopeRequired && tenantKeyEmpty) {
    reasons.push(`tenantKey is required for tool ${tool.id} but was empty`);
  }

  // Required inputs check. The tenantKey input is satisfied by the
  // request.tenantKey field; everything else must appear in `inputs`.
  const inputs = request.inputs ?? {};
  for (const required of tool.requiredInputs) {
    if (required.type === 'tenantKey') {
      if (tenantKeyEmpty) {
        // Already counted above when tenantScopeRequired; do not double count
        // unless the tool somehow lists tenantKey but does not require scope.
        if (!tool.tenantScopeRequired) {
          reasons.push(`required input ${required.name} (tenantKey) was empty`);
        }
      }
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(inputs, required.name)) {
      reasons.push(`required input ${required.name} (${required.type}) is missing`);
      continue;
    }
    const value = inputs[required.name];
    if (value === undefined || value === null) {
      reasons.push(`required input ${required.name} is null or undefined`);
      continue;
    }
    if (typeof value === 'string' && value.trim().length === 0) {
      reasons.push(`required input ${required.name} is an empty string`);
    }
  }

  // forbiddenWhen sanity check: refuse calls that try to embed a
  // forbidden runtime condition as an input key.
  for (const forbidden of tool.forbiddenWhen) {
    if (Object.prototype.hasOwnProperty.call(inputs, forbidden.condition)) {
      reasons.push(
        `inputs contain a forbiddenWhen trigger key (${forbidden.condition}); remedy: ${forbidden.remedy}`,
      );
    }
  }

  // Audit-required write/export tools should carry an auditEventId. If
  // they do not, that is a warning rather than a hard block, because
  // the audit ledger is a stub today.
  const isWriteShape = tool.readWriteMode === 'write' || tool.readWriteMode === 'export';
  if (isWriteShape && tool.auditRequired) {
    const hasAuditEventId =
      Object.prototype.hasOwnProperty.call(inputs, 'auditEventId') &&
      typeof inputs.auditEventId === 'string' &&
      (inputs.auditEventId as string).trim().length > 0;
    if (!hasAuditEventId) {
      warnings.push(
        `tool ${tool.id} is auditRequired but no auditEventId was supplied; the call will be refused once the audit ledger is live`,
      );
    }
  }

  return {
    isValid: reasons.length === 0,
    reasons,
    warnings,
  };
}

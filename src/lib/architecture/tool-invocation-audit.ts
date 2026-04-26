// TOOL3 - Tool Invocation Audit Read Model
//
// Deterministic, file-pure read model that records what would be
// captured for every agent tool invocation if the runtime tool
// dispatcher and audit ledger were live. No model calls, no live tool
// execution, no persistence, no network.
//
// TOOL3 is a companion to TOOL2 (the deterministic Tool Registry MVP).
// Where TOOL2 names the canonical tools and validates a call shape,
// TOOL3 names the canonical audit shape that every dispatcher must
// produce: who decided what, against which tool, with what evidence
// basis, at what risk, and which policy was matched.
//
// This module never dispatches a tool. It only describes the audit
// shape that a future TOOL4-shaped dispatcher will emit. The seed
// covers all sixteen canonical TOOL2 tool ids, all seven decision
// outcomes, and all six actor roles, including blocks and deferrals
// with explicit reasons.
//
// Hygiene mirrors TOOL2 / EVID2 / CTX2:
// - No imports from `@/lib/source`, `@/lib/sentinel`, `@/lib/atlas`,
//   `@/lib/nexus`, `@/lib/agent`, `@/lib/auth`, or supabase.
// - No `Date.now`, `Math.random`, `new Date(`, `fetch(`.
// - No anthropic / openai / model SDK imports.
// - No `useState` / `useEffect` (this is not a React module).
// - No placeholder language (Coming soon / TBD / Lorem ipsum).
// - No `await` / shell exec / fs writes.

import {
  getAgentTool,
  type ToolMetadata,
} from './tool-registry-mvp';

// ---------------------------------------------------------------------
// Canonical decision tuple.
// ---------------------------------------------------------------------

export const TOOL_INVOCATION_DECISIONS = [
  'proposed',
  'allowed',
  'blocked',
  'deferred',
  'completed',
  'failed',
  'dismissed',
] as const;

export type ToolInvocationDecision = typeof TOOL_INVOCATION_DECISIONS[number];

// ---------------------------------------------------------------------
// Canonical actor tuple.
// ---------------------------------------------------------------------

export const TOOL_INVOCATION_ACTORS = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
  'system',
  'admin',
] as const;

export type ToolInvocationActor = typeof TOOL_INVOCATION_ACTORS[number];

// ---------------------------------------------------------------------
// Other typed enums.
// ---------------------------------------------------------------------

export type ToolInvocationScope = 'platform' | 'tenant' | 'workspace';
export type ToolInvocationRisk = 'low' | 'medium' | 'high' | 'critical';

// ---------------------------------------------------------------------
// Public record + summary types.
// ---------------------------------------------------------------------

export interface ToolInvocationEvidenceBasis {
  evidenceIds: readonly string[];
  rationale: string;
  policyReferenceKey: string;
}

export interface ToolInvocationAuditRecord {
  id: string;
  toolId: string;
  actor: ToolInvocationActor;
  tenantKey: string;
  scope: ToolInvocationScope;
  decision: ToolInvocationDecision;
  riskLevel: ToolInvocationRisk;
  blockedReason?: string;
  deferredReason?: string;
  failureReason?: string;
  evidenceBasis: ToolInvocationEvidenceBasis | null;
  auditEventId: string;
  policyMatched: string;
  createdFrom: 'deterministic_tool_invocation_audit_seed';
}

export interface ToolInvocationAuditSummary {
  totalRecords: number;
  byDecision: Record<ToolInvocationDecision, number>;
  byActor: Record<ToolInvocationActor, number>;
  byRisk: Record<ToolInvocationRisk, number>;
  blockedCount: number;
  failedCount: number;
  uniqueTools: readonly string[];
  uniqueTenants: readonly string[];
}

// ---------------------------------------------------------------------
// Canonical tool-id tuple (mirrors TOOL2 seed in canonical order).
// Lifted as constants so this module never inspects the dynamic
// registry except via the read-only getAgentTool helper.
// ---------------------------------------------------------------------

const TOOL_ID_SEARCH_VECTOR = 'tool.search_vector.v1';
const TOOL_ID_TRAVERSE_GRAPH = 'tool.traverse_graph.v1';
const TOOL_ID_READ_ARTIFACT = 'tool.read_artifact.v1';
const TOOL_ID_READ_EVIDENCE = 'tool.read_evidence.v1';
const TOOL_ID_READ_PROGRAM_STATE = 'tool.read_program_state.v1';
const TOOL_ID_WRITE_PROGRAM_ACTION = 'tool.write_program_action.v1';
const TOOL_ID_CREATE_DELIVERABLE_DRAFT = 'tool.create_deliverable_draft.v1';
const TOOL_ID_EXPORT_ARTIFACT = 'tool.export_artifact.v1';
const TOOL_ID_UPDATE_GATE_STATUS = 'tool.update_gate_status.v1';
const TOOL_ID_RECORD_AUDIT_EVENT = 'tool.record_audit_event.v1';
const TOOL_ID_FETCH_DATASET_SUMMARY = 'tool.fetch_dataset_summary.v1';
const TOOL_ID_GET_SOLUTION_ARCHETYPE = 'tool.get_solution_archetype.v1';
const TOOL_ID_GET_PATTERN_CONTENT = 'tool.get_pattern_content.v1';
const TOOL_ID_BUILD_CONTEXT_PACK = 'tool.build_context_pack.v1';
const TOOL_ID_EVALUATE_READINESS = 'tool.evaluate_readiness.v1';
const TOOL_ID_CREATE_AGENT_MISSION = 'tool.create_agent_mission.v1';

const ALL_CANONICAL_TOOL_IDS: readonly string[] = [
  TOOL_ID_SEARCH_VECTOR,
  TOOL_ID_TRAVERSE_GRAPH,
  TOOL_ID_READ_ARTIFACT,
  TOOL_ID_READ_EVIDENCE,
  TOOL_ID_READ_PROGRAM_STATE,
  TOOL_ID_WRITE_PROGRAM_ACTION,
  TOOL_ID_CREATE_DELIVERABLE_DRAFT,
  TOOL_ID_EXPORT_ARTIFACT,
  TOOL_ID_UPDATE_GATE_STATUS,
  TOOL_ID_RECORD_AUDIT_EVENT,
  TOOL_ID_FETCH_DATASET_SUMMARY,
  TOOL_ID_GET_SOLUTION_ARCHETYPE,
  TOOL_ID_GET_PATTERN_CONTENT,
  TOOL_ID_BUILD_CONTEXT_PACK,
  TOOL_ID_EVALUATE_READINESS,
  TOOL_ID_CREATE_AGENT_MISSION,
];

// ---------------------------------------------------------------------
// Helpers used by the seed.
// ---------------------------------------------------------------------

function policyKeyFor(toolId: string): string {
  // Canonical policy key shape: tool_registry.v1.<category>.audit_required.
  // The category is derived from the canonical tool id shape
  // 'tool.<category>.v<n>'. If we can't derive it (unknown id) we fall
  // back to a literal that is still unambiguous.
  const match = toolId.match(/^tool\.([a-z_]+)\.v\d+$/);
  const category = match?.[1] ?? 'unknown';
  return `tool_registry.v1.${category}.audit_required`;
}

function isWriteShapeFor(toolId: string): boolean {
  // Use TOOL2's read-only metadata to decide write/export shape; if the
  // tool id isn't registered we conservatively treat it as non-write
  // (the validator will independently reject unknown ids).
  const meta: ToolMetadata | null = getAgentTool(toolId);
  if (!meta) return false;
  return meta.readWriteMode === 'write' || meta.readWriteMode === 'export';
}

function frozenEvidenceBasis(
  evidenceIds: readonly string[],
  rationale: string,
  policyReferenceKey: string,
): ToolInvocationEvidenceBasis {
  return {
    evidenceIds,
    rationale,
    policyReferenceKey,
  };
}

// ---------------------------------------------------------------------
// Deterministic seed.
//
// The seed is an ordered, immutable list of audit records. Index drives
// the id ('tool-audit-seed-{n}', 1-based) so id ordering is stable.
// Coverage requirements (enforced by tests):
//   - 24+ records.
//   - All 7 decisions present (>= 2 each).
//   - All 6 actors present.
//   - All 16 canonical tool ids covered.
//   - >= 4 records at high or critical risk.
//   - Mix of platform / tenant / workspace scopes.
//   - Every blocked record carries a blockedReason.
//   - Every deferred record carries a deferredReason.
//   - Every failed record carries a failureReason.
//   - Every write-shaped tool invocation carries a non-null evidenceBasis.
// ---------------------------------------------------------------------

interface SeedDraft {
  toolId: string;
  actor: ToolInvocationActor;
  tenantKey: string;
  scope: ToolInvocationScope;
  decision: ToolInvocationDecision;
  riskLevel: ToolInvocationRisk;
  blockedReason?: string;
  deferredReason?: string;
  failureReason?: string;
  evidenceBasis: ToolInvocationEvidenceBasis | null;
}

const SEED_DRAFTS: readonly SeedDraft[] = [
  // 1 - Nexus search_vector, allowed read on tenant scope.
  {
    toolId: TOOL_ID_SEARCH_VECTOR,
    actor: 'nexus',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'allowed',
    riskLevel: 'low',
    evidenceBasis: null,
  },
  // 2 - Sentinel traverse_graph, completed read.
  {
    toolId: TOOL_ID_TRAVERSE_GRAPH,
    actor: 'sentinel',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'completed',
    riskLevel: 'low',
    evidenceBasis: null,
  },
  // 3 - Atlas read_artifact, allowed read with audit.
  {
    toolId: TOOL_ID_READ_ARTIFACT,
    actor: 'atlas',
    tenantKey: 'meridian',
    scope: 'tenant',
    decision: 'allowed',
    riskLevel: 'medium',
    evidenceBasis: null,
  },
  // 4 - Nexus read_evidence, blocked due to evidence quality.
  {
    toolId: TOOL_ID_READ_EVIDENCE,
    actor: 'nexus',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'blocked',
    riskLevel: 'medium',
    blockedReason:
      'Evidence ledger entry status is unusable; refusing the read per evidence_quality_unusable forbiddenWhen.',
    evidenceBasis: null,
  },
  // 5 - Steward read_program_state, completed read.
  {
    toolId: TOOL_ID_READ_PROGRAM_STATE,
    actor: 'steward',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'completed',
    riskLevel: 'low',
    evidenceBasis: null,
  },
  // 6 - Steward write_program_action, completed write WITH evidence basis.
  {
    toolId: TOOL_ID_WRITE_PROGRAM_ACTION,
    actor: 'steward',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'completed',
    riskLevel: 'high',
    evidenceBasis: frozenEvidenceBasis(
      ['evidence-seed-1', 'evidence-seed-2'],
      'Steward appended a structured program action; tied to two usable evidence rows.',
      policyKeyFor(TOOL_ID_WRITE_PROGRAM_ACTION),
    ),
  },
  // 7 - Atlas create_deliverable_draft, allowed write with evidence.
  {
    toolId: TOOL_ID_CREATE_DELIVERABLE_DRAFT,
    actor: 'atlas',
    tenantKey: 'meridian',
    scope: 'tenant',
    decision: 'allowed',
    riskLevel: 'high',
    evidenceBasis: frozenEvidenceBasis(
      ['evidence-seed-3', 'evidence-seed-4', 'evidence-seed-5'],
      'Atlas requested an executive brief draft; cited three usable evidence rows.',
      policyKeyFor(TOOL_ID_CREATE_DELIVERABLE_DRAFT),
    ),
  },
  // 8 - Atlas export_artifact, deferred (gateway not live).
  {
    toolId: TOOL_ID_EXPORT_ARTIFACT,
    actor: 'atlas',
    tenantKey: 'meridian',
    scope: 'tenant',
    decision: 'deferred',
    riskLevel: 'high',
    deferredReason:
      'Export bundle pipeline is not yet wired; deferring until exporter slice and audit ledger land.',
    evidenceBasis: frozenEvidenceBasis(
      ['evidence-seed-6'],
      'Atlas proposed an export of the executive brief; basis recorded for downstream live pipeline.',
      policyKeyFor(TOOL_ID_EXPORT_ARTIFACT),
    ),
  },
  // 9 - Steward update_gate_status, completed gate advance with evidence.
  {
    toolId: TOOL_ID_UPDATE_GATE_STATUS,
    actor: 'steward',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'completed',
    riskLevel: 'critical',
    evidenceBasis: frozenEvidenceBasis(
      ['evidence-seed-7', 'evidence-seed-8'],
      'Steward advanced the charter gate after readiness gates and evidence rows were certified.',
      policyKeyFor(TOOL_ID_UPDATE_GATE_STATUS),
    ),
  },
  // 10 - Sentinel record_audit_event, allowed audit-only.
  {
    toolId: TOOL_ID_RECORD_AUDIT_EVENT,
    actor: 'sentinel',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'allowed',
    riskLevel: 'low',
    evidenceBasis: null,
  },
  // 11 - Sentinel fetch_dataset_summary, completed read.
  {
    toolId: TOOL_ID_FETCH_DATASET_SUMMARY,
    actor: 'sentinel',
    tenantKey: 'meridian',
    scope: 'tenant',
    decision: 'completed',
    riskLevel: 'medium',
    evidenceBasis: null,
  },
  // 12 - Nexus get_solution_archetype, allowed (tenant-agnostic platform scope).
  {
    toolId: TOOL_ID_GET_SOLUTION_ARCHETYPE,
    actor: 'nexus',
    tenantKey: 'platform',
    scope: 'platform',
    decision: 'allowed',
    riskLevel: 'low',
    evidenceBasis: null,
  },
  // 13 - Sentinel get_pattern_content, completed (tenant-agnostic platform scope).
  {
    toolId: TOOL_ID_GET_PATTERN_CONTENT,
    actor: 'sentinel',
    tenantKey: 'platform',
    scope: 'platform',
    decision: 'completed',
    riskLevel: 'low',
    evidenceBasis: null,
  },
  // 14 - Nexus build_context_pack, completed read on workspace scope.
  {
    toolId: TOOL_ID_BUILD_CONTEXT_PACK,
    actor: 'nexus',
    tenantKey: 'acme',
    scope: 'workspace',
    decision: 'completed',
    riskLevel: 'low',
    evidenceBasis: null,
  },
  // 15 - Atlas evaluate_readiness, allowed read.
  {
    toolId: TOOL_ID_EVALUATE_READINESS,
    actor: 'atlas',
    tenantKey: 'acme',
    scope: 'workspace',
    decision: 'allowed',
    riskLevel: 'medium',
    evidenceBasis: null,
  },
  // 16 - Steward create_agent_mission, completed write with evidence.
  {
    toolId: TOOL_ID_CREATE_AGENT_MISSION,
    actor: 'steward',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'completed',
    riskLevel: 'medium',
    evidenceBasis: frozenEvidenceBasis(
      ['evidence-seed-9'],
      'Steward created a Sentinel mission to cover newly-detected pattern; basis includes one usable evidence row.',
      policyKeyFor(TOOL_ID_CREATE_AGENT_MISSION),
    ),
  },
  // 17 - System read_program_state, blocked (governance hard-violated).
  {
    toolId: TOOL_ID_READ_PROGRAM_STATE,
    actor: 'system',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'blocked',
    riskLevel: 'high',
    blockedReason:
      'System health probe attempted a cross-tenant read; refused per tenant_scope_invalid forbiddenWhen.',
    evidenceBasis: null,
  },
  // 18 - Admin update_gate_status, deferred (steward presence required).
  {
    toolId: TOOL_ID_UPDATE_GATE_STATUS,
    actor: 'admin',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'deferred',
    riskLevel: 'critical',
    deferredReason:
      'Admin attempted a gate change but update_gate_status is steward-only; deferred to steward review.',
    evidenceBasis: frozenEvidenceBasis(
      ['evidence-seed-10'],
      'Admin packaged the deferral rationale and one supporting evidence row for the steward.',
      policyKeyFor(TOOL_ID_UPDATE_GATE_STATUS),
    ),
  },
  // 19 - Atlas write_program_action, failed (transient adapter error).
  {
    toolId: TOOL_ID_WRITE_PROGRAM_ACTION,
    actor: 'atlas',
    tenantKey: 'meridian',
    scope: 'tenant',
    decision: 'failed',
    riskLevel: 'medium',
    failureReason:
      'Tool dispatcher adapter returned a transient adapter_error; retry policy will re-attempt on the next mission tick.',
    evidenceBasis: frozenEvidenceBasis(
      ['evidence-seed-11'],
      'Atlas drafted a status update; failure recorded with the supporting evidence row for replay.',
      policyKeyFor(TOOL_ID_WRITE_PROGRAM_ACTION),
    ),
  },
  // 20 - Nexus search_vector, dismissed by founder review.
  {
    toolId: TOOL_ID_SEARCH_VECTOR,
    actor: 'nexus',
    tenantKey: 'meridian',
    scope: 'tenant',
    decision: 'dismissed',
    riskLevel: 'low',
    evidenceBasis: null,
  },
  // 21 - Atlas export_artifact, blocked due to governance constraint.
  {
    toolId: TOOL_ID_EXPORT_ARTIFACT,
    actor: 'atlas',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'blocked',
    riskLevel: 'critical',
    blockedReason:
      'Governance constraint hard-violated: export contains restricted dataset slices; refusing per governance_constraint_hard_violated forbiddenWhen.',
    evidenceBasis: frozenEvidenceBasis(
      ['evidence-seed-12'],
      'Atlas requested a board-pack export; basis row preserved so the governance reviewer has full context.',
      policyKeyFor(TOOL_ID_EXPORT_ARTIFACT),
    ),
  },
  // 22 - Sentinel build_context_pack, proposed (no decision yet).
  {
    toolId: TOOL_ID_BUILD_CONTEXT_PACK,
    actor: 'sentinel',
    tenantKey: 'meridian',
    scope: 'workspace',
    decision: 'proposed',
    riskLevel: 'low',
    evidenceBasis: null,
  },
  // 23 - System record_audit_event, failed (audit ledger stub).
  {
    toolId: TOOL_ID_RECORD_AUDIT_EVENT,
    actor: 'system',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'failed',
    riskLevel: 'high',
    failureReason:
      'Audit ledger is a stub today; record_audit_event accepted the call shape but no live persistence happened.',
    evidenceBasis: null,
  },
  // 24 - Admin read_artifact, dismissed (founder cancelled before issue).
  {
    toolId: TOOL_ID_READ_ARTIFACT,
    actor: 'admin',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'dismissed',
    riskLevel: 'low',
    evidenceBasis: null,
  },
  // 25 - Nexus create_deliverable_draft, proposed (queued for review).
  {
    toolId: TOOL_ID_CREATE_DELIVERABLE_DRAFT,
    actor: 'nexus',
    tenantKey: 'acme',
    scope: 'tenant',
    decision: 'proposed',
    riskLevel: 'medium',
    evidenceBasis: frozenEvidenceBasis(
      ['evidence-seed-13', 'evidence-seed-14'],
      'Nexus proposed a value-ledger draft; basis carries the two usable evidence rows backing the recommendation.',
      policyKeyFor(TOOL_ID_CREATE_DELIVERABLE_DRAFT),
    ),
  },
  // 26 - Steward fetch_dataset_summary, deferred (steward absent).
  {
    toolId: TOOL_ID_FETCH_DATASET_SUMMARY,
    actor: 'steward',
    tenantKey: 'meridian',
    scope: 'tenant',
    decision: 'deferred',
    riskLevel: 'medium',
    deferredReason:
      'Dataset domain steward has not yet certified the refresh cadence; deferring summary surface until ADM3 lands.',
    evidenceBasis: null,
  },
];

// ---------------------------------------------------------------------
// Frozen seed records.
// ---------------------------------------------------------------------

const SEED_RECORDS: readonly ToolInvocationAuditRecord[] = (() => {
  const records: ToolInvocationAuditRecord[] = SEED_DRAFTS.map((draft, idx) => {
    const sequence = idx + 1;
    const id = `tool-audit-seed-${sequence}`;
    const auditEventId = `audit-event-seed-${sequence}`;
    return {
      id,
      toolId: draft.toolId,
      actor: draft.actor,
      tenantKey: draft.tenantKey,
      scope: draft.scope,
      decision: draft.decision,
      riskLevel: draft.riskLevel,
      blockedReason: draft.blockedReason,
      deferredReason: draft.deferredReason,
      failureReason: draft.failureReason,
      evidenceBasis: draft.evidenceBasis,
      auditEventId,
      policyMatched: policyKeyFor(draft.toolId),
      createdFrom: 'deterministic_tool_invocation_audit_seed',
    };
  });
  return Object.freeze(records);
})();

// ---------------------------------------------------------------------
// Public helpers.
// ---------------------------------------------------------------------

export function buildToolInvocationAuditSeed(): readonly ToolInvocationAuditRecord[] {
  return SEED_RECORDS;
}

export function validateToolInvocationAudit(
  record: ToolInvocationAuditRecord,
): { isValid: boolean; reasons: readonly string[] } {
  const reasons: string[] = [];

  // tenantKey must be non-empty (TOOL3 audit always pins to a tenant
  // or platform identifier, even for tenant-agnostic tools).
  if (!record.tenantKey || record.tenantKey.trim().length === 0) {
    reasons.push('tenantKey is empty');
  }

  // id must match the canonical shape.
  if (!/^tool-audit-seed-\d+$/.test(record.id)) {
    reasons.push(`id does not match canonical shape tool-audit-seed-{n}: ${record.id}`);
  }

  // toolId must match the canonical TOOL2 shape.
  if (!/^tool\.[a-z_]+\.v\d+$/.test(record.toolId)) {
    reasons.push(`toolId does not match canonical shape tool.<category>.v<n>: ${record.toolId}`);
  }

  // auditEventId must be non-empty.
  if (!record.auditEventId || record.auditEventId.trim().length === 0) {
    reasons.push('auditEventId is empty');
  }

  // policyMatched must be non-empty.
  if (!record.policyMatched || record.policyMatched.trim().length === 0) {
    reasons.push('policyMatched is empty');
  }

  // createdFrom must be the canonical sentinel.
  if (record.createdFrom !== 'deterministic_tool_invocation_audit_seed') {
    reasons.push(
      `createdFrom must be deterministic_tool_invocation_audit_seed; got ${String(record.createdFrom)}`,
    );
  }

  // Decision-shape invariants.
  if (record.decision === 'blocked') {
    if (!record.blockedReason || record.blockedReason.trim().length === 0) {
      reasons.push('decision === blocked requires a non-empty blockedReason');
    }
  }
  if (record.decision === 'deferred') {
    if (!record.deferredReason || record.deferredReason.trim().length === 0) {
      reasons.push('decision === deferred requires a non-empty deferredReason');
    }
  }
  if (record.decision === 'failed') {
    if (!record.failureReason || record.failureReason.trim().length === 0) {
      reasons.push('decision === failed requires a non-empty failureReason');
    }
  }

  // Write-shaped tools must carry a non-null evidenceBasis on every
  // recorded invocation - even when blocked, deferred, or failed - so
  // the audit ledger always has the basis the dispatcher would have
  // used. Read-shaped and audit-only tools may carry null.
  if (isWriteShapeFor(record.toolId)) {
    if (record.evidenceBasis === null) {
      reasons.push(
        `tool ${record.toolId} is write-shaped; evidenceBasis must not be null`,
      );
    } else {
      const basis = record.evidenceBasis;
      if (basis.evidenceIds.length === 0) {
        reasons.push(
          `tool ${record.toolId} is write-shaped; evidenceBasis.evidenceIds must not be empty`,
        );
      }
      if (!basis.rationale || basis.rationale.trim().length === 0) {
        reasons.push(
          `tool ${record.toolId} is write-shaped; evidenceBasis.rationale must not be empty`,
        );
      }
      if (!basis.policyReferenceKey || basis.policyReferenceKey.trim().length === 0) {
        reasons.push(
          `tool ${record.toolId} is write-shaped; evidenceBasis.policyReferenceKey must not be empty`,
        );
      }
    }
  }

  // Actor membership.
  if (!TOOL_INVOCATION_ACTORS.includes(record.actor)) {
    reasons.push(`actor is not a known actor: ${String(record.actor)}`);
  }

  // Decision membership.
  if (!TOOL_INVOCATION_DECISIONS.includes(record.decision)) {
    reasons.push(`decision is not a known decision: ${String(record.decision)}`);
  }

  return {
    isValid: reasons.length === 0,
    reasons,
  };
}

function emptyDecisionCounter(): Record<ToolInvocationDecision, number> {
  return {
    proposed: 0,
    allowed: 0,
    blocked: 0,
    deferred: 0,
    completed: 0,
    failed: 0,
    dismissed: 0,
  };
}

function emptyActorCounter(): Record<ToolInvocationActor, number> {
  return {
    nexus: 0,
    sentinel: 0,
    atlas: 0,
    steward: 0,
    system: 0,
    admin: 0,
  };
}

function emptyRiskCounter(): Record<ToolInvocationRisk, number> {
  return {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
}

export function summarizeToolInvocationAudits(
  records: readonly ToolInvocationAuditRecord[] = SEED_RECORDS,
): ToolInvocationAuditSummary {
  const byDecision = emptyDecisionCounter();
  const byActor = emptyActorCounter();
  const byRisk = emptyRiskCounter();

  let blockedCount = 0;
  let failedCount = 0;
  const toolSet = new Set<string>();
  const tenantSet = new Set<string>();

  for (const record of records) {
    byDecision[record.decision] += 1;
    byActor[record.actor] += 1;
    byRisk[record.riskLevel] += 1;
    if (record.decision === 'blocked') blockedCount += 1;
    if (record.decision === 'failed') failedCount += 1;
    toolSet.add(record.toolId);
    tenantSet.add(record.tenantKey);
  }

  const uniqueTools = Array.from(toolSet).sort();
  const uniqueTenants = Array.from(tenantSet).sort();

  return {
    totalRecords: records.length,
    byDecision,
    byActor,
    byRisk,
    blockedCount,
    failedCount,
    uniqueTools,
    uniqueTenants,
  };
}

export function getBlockedToolInvocations(
  records: readonly ToolInvocationAuditRecord[] = SEED_RECORDS,
): readonly ToolInvocationAuditRecord[] {
  return records.filter((record) => record.decision === 'blocked');
}

export function getToolInvocationsByAgent(
  actor: ToolInvocationActor,
  records: readonly ToolInvocationAuditRecord[] = SEED_RECORDS,
): readonly ToolInvocationAuditRecord[] {
  return records.filter((record) => record.actor === actor);
}

// ---------------------------------------------------------------------
// Internal exports for tests (kept narrow).
// ---------------------------------------------------------------------

export const __TOOL3_INTERNALS__ = {
  ALL_CANONICAL_TOOL_IDS,
  policyKeyFor,
  isWriteShapeFor,
};

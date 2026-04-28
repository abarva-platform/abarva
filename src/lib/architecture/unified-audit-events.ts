// AUD2 - Unified Audit Event Read Model
//
// Deterministic, file-pure read model that demonstrates the canonical
// shape of a Unified Audit Event across all four agents (Nexus,
// Sentinel, Atlas, Steward) and across the system surfaces they
// touch (Programs, Intelligence patterns, Tower dimensions, Admin
// dataset/governance, Workshops, Deliverables, Gates, Tools, the
// Model Gateway, and route-smoke / readiness signals).
//
// Every event is a snapshot, not a live capture. Every id is prefixed
// `audit-seed-`, every traceId is prefixed `trace-seed-`, no
// `Date.now`, no `Math.random`, no `new Date(`, no `fetch(`, and no
// model SDK is invoked. The seed is the single source of truth for
// shape; consumers (Steward audit surfaces, governance review tooling,
// future replay/integrity checkers) bind to the typed contract here,
// not to any production audit ledger.
//
// AUD2 is the read-only companion to the AUD1 contract. It explicitly
// does not persist, replay, sign, or chain events; immutability is a
// shape-level invariant on the seed, not a runtime guarantee.

// ---------------------------------------------------------------------
// Canonical event-type tuple (order is contract).
// ---------------------------------------------------------------------

export const UNIFIED_AUDIT_EVENT_TYPES = [
  'agent_recommendation',
  'agent_handoff',
  'evidence_used',
  'evidence_blocked',
  'tool_invocation',
  'model_gateway_decision',
  'gate_check',
  'gate_transition',
  'deliverable_generated',
  'deliverable_approved',
  'deliverable_superseded',
  'user_action',
  'readiness_update',
  'route_smoke_result',
  'governance_decision',
] as const;

export type UnifiedAuditEventType = typeof UNIFIED_AUDIT_EVENT_TYPES[number];

// ---------------------------------------------------------------------
// Subtype groupings - used by validation and by typed helpers.
// ---------------------------------------------------------------------

export const EVIDENCE_USING_EVENT_TYPES: readonly UnifiedAuditEventType[] = [
  'agent_recommendation',
  'evidence_used',
  'evidence_blocked',
  'deliverable_generated',
  'gate_check',
  'governance_decision',
];

export const DECISION_BEARING_EVENT_TYPES: readonly UnifiedAuditEventType[] = [
  'agent_recommendation',
  'agent_handoff',
  'gate_check',
  'gate_transition',
  'governance_decision',
  'model_gateway_decision',
];

export const STATE_CHANGE_EVENT_TYPES: readonly UnifiedAuditEventType[] = [
  'gate_transition',
  'deliverable_approved',
  'deliverable_superseded',
  'readiness_update',
  'user_action',
];

// ---------------------------------------------------------------------
// Public types.
// ---------------------------------------------------------------------

export type UnifiedAuditActor = {
  kind: 'user' | 'agent' | 'system';
  id: string;
};

export type UnifiedAuditAgent = 'nexus' | 'sentinel' | 'atlas' | 'steward';

export const UNIFIED_AUDIT_AGENTS: readonly UnifiedAuditAgent[] = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
];

export const UNIFIED_AUDIT_ACTOR_KINDS: readonly UnifiedAuditActor['kind'][] = [
  'user',
  'agent',
  'system',
];

export interface UnifiedAuditEventWorkObject {
  kind: string;
  id: string;
  label: string;
}

export interface UnifiedAuditEventEvidenceBasis {
  evidenceIds: readonly string[];
  rationale: string;
}

export interface UnifiedAuditEventBeforeAfter {
  before: unknown;
  after: unknown;
  fieldsChanged: readonly string[];
}

export interface UnifiedAuditEvent {
  id: string;
  tenantKey: string;
  actor: UnifiedAuditActor;
  agent?: UnifiedAuditAgent;
  workObject: UnifiedAuditEventWorkObject;
  eventType: UnifiedAuditEventType;
  beforeAfter: UnifiedAuditEventBeforeAfter | null;
  evidenceBasis: UnifiedAuditEventEvidenceBasis | null;
  missingInputs: readonly string[];
  decisionRationale: string | null;
  traceId: string;
  timestampSource: 'monotonic_clock' | 'persisted_event_time';
  immutable: true;
  createdFrom: 'deterministic_unified_audit_seed';
}

export interface UnifiedAuditSummary {
  totalEvents: number;
  byEventType: Record<UnifiedAuditEventType, number>;
  byActorKind: Record<UnifiedAuditActor['kind'], number>;
  byAgent: Record<UnifiedAuditAgent, number>;
  uniqueTenants: readonly string[];
  uniqueTraceIds: readonly string[];
  eventsWithEvidenceBasis: number;
  eventsWithBeforeAfter: number;
}

// ---------------------------------------------------------------------
// Seed entries.
//
// Coverage matrix:
//   - 30 events total.
//   - All 15 event types covered (>= 1 each, multiple for the
//     high-frequency ones: agent_recommendation, evidence_used,
//     gate_check, gate_transition, user_action).
//   - All 3 actor kinds (user / agent / system) appear.
//   - All 4 agents (nexus / sentinel / atlas / steward) appear in
//     events that carry an agent.
//   - Tenants: acme, meridian, helios.
//   - Trace ids deterministic, prefixed `trace-seed-`.
// ---------------------------------------------------------------------

const SEED_EVENTS: readonly UnifiedAuditEvent[] = [
  // -------------------------------------------------------------------
  // 1. Nexus agent recommendation (evidence + decision rationale).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-1',
    tenantKey: 'acme',
    actor: { kind: 'agent', id: 'nexus' },
    agent: 'nexus',
    workObject: {
      kind: 'program',
      id: 'acme/contact-center',
      label: 'Acme contact center program',
    },
    eventType: 'agent_recommendation',
    beforeAfter: null,
    evidenceBasis: {
      evidenceIds: ['evid-seed-acme-charter-1', 'evid-seed-acme-baseline-2'],
      rationale:
        'Charter and baseline deck both confirm a single named owner with a measurable AHT baseline, so Nexus can proceed to readiness gate.',
    },
    missingInputs: [],
    decisionRationale:
      'Recommend advancing to readiness gate review because both charter and baseline evidence are in usable_as_evidence state.',
    traceId: 'trace-seed-acme-cc-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 2. Nexus agent handoff (decision rationale, no evidence basis).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-2',
    tenantKey: 'acme',
    actor: { kind: 'agent', id: 'nexus' },
    agent: 'nexus',
    workObject: {
      kind: 'workshop',
      id: 'acme/contact-center/discovery-workshop',
      label: 'Acme discovery workshop',
    },
    eventType: 'agent_handoff',
    beforeAfter: null,
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale:
      'Workshop readiness reached threshold. Hand off facilitation surface to Sentinel for pattern detection on captured notes.',
    traceId: 'trace-seed-acme-cc-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 3. Sentinel evidence_used (evidence basis + non-decision).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-3',
    tenantKey: 'acme',
    actor: { kind: 'agent', id: 'sentinel' },
    agent: 'sentinel',
    workObject: {
      kind: 'pattern',
      id: 'pilot-purgatory',
      label: 'Pilot purgatory pattern detection',
    },
    eventType: 'evidence_used',
    beforeAfter: null,
    evidenceBasis: {
      evidenceIds: ['evid-seed-acme-pattern-pilot-purgatory-5'],
      rationale:
        'Quarterly review evidence cited as basis for surfacing pilot-purgatory pattern at tenant scope.',
    },
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-acme-pat-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 4. Sentinel evidence_blocked (evidence basis with block rationale,
  //    plus missing inputs).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-4',
    tenantKey: 'meridian',
    actor: { kind: 'agent', id: 'sentinel' },
    agent: 'sentinel',
    workObject: {
      kind: 'pattern',
      id: 'weak-data-foundation',
      label: 'Weak data foundation pattern review',
    },
    eventType: 'evidence_blocked',
    beforeAfter: null,
    evidenceBasis: {
      evidenceIds: ['evid-seed-meridian-blocked-1'],
      rationale:
        'Source artifact lineage cannot be confirmed; entry remains in blocked state until lineage is captured.',
    },
    missingInputs: ['lineage_metadata', 'source_owner'],
    decisionRationale: null,
    traceId: 'trace-seed-meridian-pat-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 5. Sentinel tool invocation (no decision rationale required).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-5',
    tenantKey: 'meridian',
    actor: { kind: 'agent', id: 'sentinel' },
    agent: 'sentinel',
    workObject: {
      kind: 'tool_run',
      id: 'pattern-classifier-run-1',
      label: 'Pattern classifier deterministic run',
    },
    eventType: 'tool_invocation',
    beforeAfter: null,
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-meridian-pat-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 6. Model gateway decision (decision-bearing).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-6',
    tenantKey: 'meridian',
    actor: { kind: 'system', id: 'model-gateway' },
    workObject: {
      kind: 'gateway_decision',
      id: 'gateway-route-1',
      label: 'Model gateway routing decision',
    },
    eventType: 'model_gateway_decision',
    beforeAfter: null,
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale:
      'Routed Sentinel pattern-classifier request to deterministic seed lane because live model lane is disabled in this slice.',
    traceId: 'trace-seed-meridian-pat-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 7. Steward gate_check (evidence basis + decision rationale).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-7',
    tenantKey: 'acme',
    actor: { kind: 'agent', id: 'steward' },
    agent: 'steward',
    workObject: {
      kind: 'gate',
      id: 'acme/contact-center/discovery-readiness',
      label: 'Acme discovery readiness gate',
    },
    eventType: 'gate_check',
    beforeAfter: null,
    evidenceBasis: {
      evidenceIds: [
        'evid-seed-acme-charter-1',
        'evid-seed-acme-baseline-2',
      ],
      rationale:
        'Charter and baseline both attached and in usable_as_evidence state. Readiness gate check passes deterministic thresholds.',
    },
    missingInputs: [],
    decisionRationale:
      'Gate check passes because both required evidence rows resolve to usable_as_evidence and no gating field is missing.',
    traceId: 'trace-seed-acme-cc-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 8. Steward gate_transition (state change + decision rationale).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-8',
    tenantKey: 'acme',
    actor: { kind: 'agent', id: 'steward' },
    agent: 'steward',
    workObject: {
      kind: 'gate',
      id: 'acme/contact-center/discovery-readiness',
      label: 'Acme discovery readiness gate',
    },
    eventType: 'gate_transition',
    beforeAfter: {
      before: { gateStatus: 'pending', readinessPercent: 70 },
      after: { gateStatus: 'passed', readinessPercent: 92 },
      fieldsChanged: ['gateStatus', 'readinessPercent'],
    },
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale:
      'Transition pending -> passed because the immediately preceding gate_check resolved with no missing inputs and evidence rows are usable.',
    traceId: 'trace-seed-acme-cc-1',
    timestampSource: 'persisted_event_time',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 9. Atlas deliverable_generated (evidence + tower scope).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-9',
    tenantKey: 'acme',
    actor: { kind: 'agent', id: 'atlas' },
    agent: 'atlas',
    workObject: {
      kind: 'deliverable',
      id: 'acme/contact-center/charter',
      label: 'Acme contact center charter (generated)',
    },
    eventType: 'deliverable_generated',
    beforeAfter: null,
    evidenceBasis: {
      evidenceIds: ['evid-seed-acme-charter-1'],
      rationale:
        'Charter deliverable composed from charter evidence row plus solution-archetype seed; no live retrieval performed.',
    },
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-acme-cc-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 10. Atlas deliverable_approved (state change).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-10',
    tenantKey: 'acme',
    actor: { kind: 'user', id: 'user-acme-program-lead' },
    workObject: {
      kind: 'deliverable',
      id: 'acme/contact-center/charter',
      label: 'Acme contact center charter (approved)',
    },
    eventType: 'deliverable_approved',
    beforeAfter: {
      before: { approvalStatus: 'in_review', version: 1 },
      after: { approvalStatus: 'approved', version: 1 },
      fieldsChanged: ['approvalStatus'],
    },
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-acme-cc-1',
    timestampSource: 'persisted_event_time',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 11. Atlas deliverable_superseded (state change).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-11',
    tenantKey: 'acme',
    actor: { kind: 'agent', id: 'atlas' },
    agent: 'atlas',
    workObject: {
      kind: 'deliverable',
      id: 'acme/contact-center/value-ledger',
      label: 'Acme contact center value ledger',
    },
    eventType: 'deliverable_superseded',
    beforeAfter: {
      before: { version: 1, status: 'current' },
      after: { version: 2, status: 'superseded' },
      fieldsChanged: ['version', 'status'],
    },
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-acme-cc-2',
    timestampSource: 'persisted_event_time',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 12. User action - workshop note captured (state change).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-12',
    tenantKey: 'acme',
    actor: { kind: 'user', id: 'user-acme-facilitator' },
    workObject: {
      kind: 'workshop_note',
      id: 'acme/contact-center/discovery-workshop/note-1',
      label: 'Acme discovery workshop note',
    },
    eventType: 'user_action',
    beforeAfter: {
      before: { noteStatus: 'draft' },
      after: { noteStatus: 'captured' },
      fieldsChanged: ['noteStatus'],
    },
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-acme-ws-1',
    timestampSource: 'persisted_event_time',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 13. Readiness update (state change, system actor).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-13',
    tenantKey: 'acme',
    actor: { kind: 'system', id: 'readiness-recomputer' },
    workObject: {
      kind: 'phase',
      id: 'acme/contact-center/discovery',
      label: 'Acme discovery phase readiness',
    },
    eventType: 'readiness_update',
    beforeAfter: {
      before: { readinessPercent: 70 },
      after: { readinessPercent: 92 },
      fieldsChanged: ['readinessPercent'],
    },
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-acme-cc-1',
    timestampSource: 'persisted_event_time',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 14. Route smoke result (system actor, no decision).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-14',
    tenantKey: 'acme',
    actor: { kind: 'system', id: 'route-smoke-runner' },
    workObject: {
      kind: 'route',
      id: '/programs/acme/contact-center',
      label: 'Acme contact center program route smoke',
    },
    eventType: 'route_smoke_result',
    beforeAfter: null,
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-acme-routes-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 15. Governance decision (Steward, evidence + decision).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-15',
    tenantKey: 'meridian',
    actor: { kind: 'agent', id: 'steward' },
    agent: 'steward',
    workObject: {
      kind: 'governance_finding',
      id: 'meridian/governance/finding-1',
      label: 'Meridian governance finding review',
    },
    eventType: 'governance_decision',
    beforeAfter: null,
    evidenceBasis: {
      evidenceIds: ['evid-seed-meridian-pattern-data-foundation-6'],
      rationale:
        'Governance review cites the data-foundation pattern evidence to set HITL flag on the finding.',
    },
    missingInputs: [],
    decisionRationale:
      'Mark finding HITL=required because lineage evidence is partial and tenant has no recorded data steward owner.',
    traceId: 'trace-seed-meridian-gov-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 16. Atlas agent recommendation (Tower pressure card surface).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-16',
    tenantKey: 'meridian',
    actor: { kind: 'agent', id: 'atlas' },
    agent: 'atlas',
    workObject: {
      kind: 'tower_dimension',
      id: 'meridian/tower/portfolio',
      label: 'Meridian Tower portfolio dimension',
    },
    eventType: 'agent_recommendation',
    beforeAfter: null,
    evidenceBasis: {
      evidenceIds: ['evid-seed-meridian-charter-4'],
      rationale:
        'Charter evidence supports surfacing portfolio-level pressure card for the intelligence program.',
    },
    missingInputs: [],
    decisionRationale:
      'Surface pressure card on Tower portfolio dimension because charter evidence resolves to usable_as_evidence and program is in-flight.',
    traceId: 'trace-seed-meridian-tower-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 17. Sentinel agent_handoff to Atlas (decision-bearing).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-17',
    tenantKey: 'meridian',
    actor: { kind: 'agent', id: 'sentinel' },
    agent: 'sentinel',
    workObject: {
      kind: 'pattern',
      id: 'weak-data-foundation',
      label: 'Weak data foundation handoff',
    },
    eventType: 'agent_handoff',
    beforeAfter: null,
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale:
      'Hand off pattern to Atlas for executive brief composition once usable evidence quorum reached.',
    traceId: 'trace-seed-meridian-pat-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 18. Steward tool invocation (governance evaluator run).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-18',
    tenantKey: 'meridian',
    actor: { kind: 'agent', id: 'steward' },
    agent: 'steward',
    workObject: {
      kind: 'tool_run',
      id: 'governance-evaluator-run-1',
      label: 'Steward governance evaluator deterministic run',
    },
    eventType: 'tool_invocation',
    beforeAfter: null,
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-meridian-gov-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 19. Evidence used by Atlas (Tower readiness).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-19',
    tenantKey: 'helios',
    actor: { kind: 'agent', id: 'atlas' },
    agent: 'atlas',
    workObject: {
      kind: 'tower_dimension',
      id: 'helios/tower/adoption',
      label: 'Helios Tower adoption dimension',
    },
    eventType: 'evidence_used',
    beforeAfter: null,
    evidenceBasis: {
      evidenceIds: ['evid-seed-helios-adoption-1'],
      rationale:
        'Adoption-domain evidence cited when computing helios adoption pressure card snapshot.',
    },
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-helios-tower-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 20. Evidence blocked at Steward governance review.
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-20',
    tenantKey: 'helios',
    actor: { kind: 'agent', id: 'steward' },
    agent: 'steward',
    workObject: {
      kind: 'governance_finding',
      id: 'helios/governance/finding-2',
      label: 'Helios governance finding evidence review',
    },
    eventType: 'evidence_blocked',
    beforeAfter: null,
    evidenceBasis: {
      evidenceIds: ['evid-seed-helios-blocked-2'],
      rationale:
        'Source artifact owner not recorded; evidence cannot be promoted out of blocked state for governance use.',
    },
    missingInputs: ['source_owner'],
    decisionRationale: null,
    traceId: 'trace-seed-helios-gov-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 21. Model gateway decision (block live lane).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-21',
    tenantKey: 'helios',
    actor: { kind: 'system', id: 'model-gateway' },
    workObject: {
      kind: 'gateway_decision',
      id: 'gateway-route-2',
      label: 'Model gateway block decision',
    },
    eventType: 'model_gateway_decision',
    beforeAfter: null,
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale:
      'Blocked the request from a non-deterministic lane because slice MG2 keeps the live lane disabled in this read model.',
    traceId: 'trace-seed-helios-gw-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 22. Gate check on a deliverable approval gate.
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-22',
    tenantKey: 'meridian',
    actor: { kind: 'agent', id: 'steward' },
    agent: 'steward',
    workObject: {
      kind: 'gate',
      id: 'meridian/intelligence/charter-approval',
      label: 'Meridian charter approval gate',
    },
    eventType: 'gate_check',
    beforeAfter: null,
    evidenceBasis: {
      evidenceIds: ['evid-seed-meridian-charter-4'],
      rationale:
        'Charter evidence resolves to usable_as_evidence; gate check evaluates approval readiness deterministically.',
    },
    missingInputs: [],
    decisionRationale:
      'Gate check passes because charter evidence is in usable_as_evidence and no required field is missing.',
    traceId: 'trace-seed-meridian-cc-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 23. Gate transition on the same gate.
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-23',
    tenantKey: 'meridian',
    actor: { kind: 'agent', id: 'steward' },
    agent: 'steward',
    workObject: {
      kind: 'gate',
      id: 'meridian/intelligence/charter-approval',
      label: 'Meridian charter approval gate transition',
    },
    eventType: 'gate_transition',
    beforeAfter: {
      before: { gateStatus: 'pending' },
      after: { gateStatus: 'passed' },
      fieldsChanged: ['gateStatus'],
    },
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale:
      'Transition pending -> passed because the gate check returned no missing inputs and the charter evidence is usable.',
    traceId: 'trace-seed-meridian-cc-1',
    timestampSource: 'persisted_event_time',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 24. Deliverable generated (Steward, audit ledger artifact).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-24',
    tenantKey: 'meridian',
    actor: { kind: 'agent', id: 'steward' },
    agent: 'steward',
    workObject: {
      kind: 'deliverable',
      id: 'meridian/governance/audit-bundle-1',
      label: 'Meridian governance audit bundle',
    },
    eventType: 'deliverable_generated',
    beforeAfter: null,
    evidenceBasis: {
      evidenceIds: ['evid-seed-meridian-pattern-data-foundation-6'],
      rationale:
        'Audit bundle composed from governance finding evidence; no live retrieval and no model invocation.',
    },
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-meridian-gov-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 25. User action - approver opens deliverable.
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-25',
    tenantKey: 'meridian',
    actor: { kind: 'user', id: 'user-meridian-governance-lead' },
    workObject: {
      kind: 'deliverable',
      id: 'meridian/governance/audit-bundle-1',
      label: 'Meridian governance audit bundle (review opened)',
    },
    eventType: 'user_action',
    beforeAfter: {
      before: { reviewState: 'unopened' },
      after: { reviewState: 'opened' },
      fieldsChanged: ['reviewState'],
    },
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-meridian-gov-1',
    timestampSource: 'persisted_event_time',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 26. Readiness update on Tower dimension (system).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-26',
    tenantKey: 'helios',
    actor: { kind: 'system', id: 'readiness-recomputer' },
    workObject: {
      kind: 'tower_dimension',
      id: 'helios/tower/adoption',
      label: 'Helios Tower adoption readiness',
    },
    eventType: 'readiness_update',
    beforeAfter: {
      before: { readinessPercent: 35 },
      after: { readinessPercent: 48 },
      fieldsChanged: ['readinessPercent'],
    },
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-helios-tower-1',
    timestampSource: 'persisted_event_time',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 27. Route smoke result on intelligence pattern detail.
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-27',
    tenantKey: 'meridian',
    actor: { kind: 'system', id: 'route-smoke-runner' },
    workObject: {
      kind: 'route',
      id: '/intelligence/patterns/weak-data-foundation',
      label: 'Meridian pattern detail route smoke',
    },
    eventType: 'route_smoke_result',
    beforeAfter: null,
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-meridian-routes-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 28. Governance decision (Steward, no evidence available -
  //     missing inputs surfaced).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-28',
    tenantKey: 'helios',
    actor: { kind: 'agent', id: 'steward' },
    agent: 'steward',
    workObject: {
      kind: 'governance_finding',
      id: 'helios/governance/finding-3',
      label: 'Helios governance finding decision (HITL)',
    },
    eventType: 'governance_decision',
    beforeAfter: null,
    evidenceBasis: {
      evidenceIds: [],
      rationale:
        'No usable evidence yet; recording the decision basis as missing-evidence to keep the audit trail complete.',
    },
    missingInputs: ['source_owner', 'lineage_metadata'],
    decisionRationale:
      'Hold finding for HITL review; do not auto-promote because evidence is missing both source owner and lineage metadata.',
    traceId: 'trace-seed-helios-gov-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 29. Nexus agent_recommendation on a workshop readiness review.
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-29',
    tenantKey: 'helios',
    actor: { kind: 'agent', id: 'nexus' },
    agent: 'nexus',
    workObject: {
      kind: 'workshop',
      id: 'helios/adoption/refresh-workshop',
      label: 'Helios adoption refresh workshop',
    },
    eventType: 'agent_recommendation',
    beforeAfter: null,
    evidenceBasis: {
      evidenceIds: ['evid-seed-helios-adoption-1'],
      rationale:
        'Adoption evidence supports recommending a focused workshop on training and change champions.',
    },
    missingInputs: [],
    decisionRationale:
      'Recommend workshop focus on adoption: champions named, training cadence weekly, recap captured back to Atlas brief.',
    traceId: 'trace-seed-helios-ws-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
  // -------------------------------------------------------------------
  // 30. User action on a tenant pattern page (state change).
  // -------------------------------------------------------------------
  {
    id: 'audit-seed-30',
    tenantKey: 'acme',
    actor: { kind: 'user', id: 'user-acme-pattern-reviewer' },
    workObject: {
      kind: 'pattern',
      id: 'pilot-purgatory',
      label: 'Pilot purgatory pattern review state',
    },
    eventType: 'user_action',
    beforeAfter: {
      before: { patternReviewState: 'unreviewed' },
      after: { patternReviewState: 'acknowledged' },
      fieldsChanged: ['patternReviewState'],
    },
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-acme-pat-1',
    timestampSource: 'persisted_event_time',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  },
];

// ---------------------------------------------------------------------
// Helpers - all return readonly views.
// ---------------------------------------------------------------------

export function buildUnifiedAuditEventSeed(): readonly UnifiedAuditEvent[] {
  return SEED_EVENTS;
}

function isEvidenceUsingType(eventType: UnifiedAuditEventType): boolean {
  return EVIDENCE_USING_EVENT_TYPES.includes(eventType);
}

function isDecisionBearingType(eventType: UnifiedAuditEventType): boolean {
  return DECISION_BEARING_EVENT_TYPES.includes(eventType);
}

function isStateChangeType(eventType: UnifiedAuditEventType): boolean {
  return STATE_CHANGE_EVENT_TYPES.includes(eventType);
}

function emptyByEventType(): Record<UnifiedAuditEventType, number> {
  const out = {} as Record<UnifiedAuditEventType, number>;
  for (const eventType of UNIFIED_AUDIT_EVENT_TYPES) {
    out[eventType] = 0;
  }
  return out;
}

function emptyByActorKind(): Record<UnifiedAuditActor['kind'], number> {
  return { user: 0, agent: 0, system: 0 };
}

function emptyByAgent(): Record<UnifiedAuditAgent, number> {
  return { nexus: 0, sentinel: 0, atlas: 0, steward: 0 };
}

export function summarizeUnifiedAuditEvents(
  events: readonly UnifiedAuditEvent[] = SEED_EVENTS,
): UnifiedAuditSummary {
  const byEventType = emptyByEventType();
  const byActorKind = emptyByActorKind();
  const byAgent = emptyByAgent();
  const tenantSet = new Set<string>();
  const traceSet = new Set<string>();
  let eventsWithEvidenceBasis = 0;
  let eventsWithBeforeAfter = 0;

  for (const event of events) {
    byEventType[event.eventType] += 1;
    byActorKind[event.actor.kind] += 1;
    if (event.agent) {
      byAgent[event.agent] += 1;
    }
    tenantSet.add(event.tenantKey);
    traceSet.add(event.traceId);
    if (event.evidenceBasis !== null) {
      eventsWithEvidenceBasis += 1;
    }
    if (event.beforeAfter !== null) {
      eventsWithBeforeAfter += 1;
    }
  }

  const uniqueTenants = Array.from(tenantSet).sort();
  const uniqueTraceIds = Array.from(traceSet).sort();

  return {
    totalEvents: events.length,
    byEventType,
    byActorKind,
    byAgent,
    uniqueTenants,
    uniqueTraceIds,
    eventsWithEvidenceBasis,
    eventsWithBeforeAfter,
  };
}

export function getAuditEventsByWorkObject(
  workObjectId: string,
  events: readonly UnifiedAuditEvent[] = SEED_EVENTS,
): readonly UnifiedAuditEvent[] {
  return events.filter((event) => event.workObject.id === workObjectId);
}

export function getAuditEventsByType(
  eventType: UnifiedAuditEventType,
  events: readonly UnifiedAuditEvent[] = SEED_EVENTS,
): readonly UnifiedAuditEvent[] {
  return events.filter((event) => event.eventType === eventType);
}

export function getAuditEventsByTrace(
  traceId: string,
  events: readonly UnifiedAuditEvent[] = SEED_EVENTS,
): readonly UnifiedAuditEvent[] {
  return events.filter((event) => event.traceId === traceId);
}

export function validateAuditEvent(
  event: UnifiedAuditEvent,
): { isValid: boolean; reasons: readonly string[] } {
  const reasons: string[] = [];

  if (!event.tenantKey || event.tenantKey.trim().length === 0) {
    reasons.push('missing tenantKey');
  }
  if (!event.traceId || event.traceId.trim().length === 0) {
    reasons.push('missing traceId');
  }
  if (!event.workObject || !event.workObject.id || event.workObject.id.trim().length === 0) {
    reasons.push('missing workObject.id');
  }
  if (event.immutable !== true) {
    reasons.push('immutable flag must be true');
  }

  if (isEvidenceUsingType(event.eventType)) {
    if (event.evidenceBasis === null) {
      reasons.push(`event type ${event.eventType} requires evidenceBasis`);
    } else if (
      typeof event.evidenceBasis.rationale !== 'string' ||
      event.evidenceBasis.rationale.trim().length === 0
    ) {
      reasons.push(`event type ${event.eventType} requires evidenceBasis.rationale`);
    }
  }

  if (isDecisionBearingType(event.eventType)) {
    if (
      event.decisionRationale === null ||
      event.decisionRationale.trim().length === 0
    ) {
      reasons.push(`event type ${event.eventType} requires decisionRationale`);
    }
  }

  if (isStateChangeType(event.eventType)) {
    if (event.beforeAfter === null) {
      reasons.push(`event type ${event.eventType} requires beforeAfter`);
    } else if (event.beforeAfter.fieldsChanged.length === 0) {
      reasons.push(`event type ${event.eventType} requires fieldsChanged`);
    }
  }

  return { isValid: reasons.length === 0, reasons };
}

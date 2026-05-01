// PROG15 · Complete Future Phase Deliverables.
//
// Named, described seed entries for the Design / Execution Roadmap /
// Approval & Mobilization / Tower Handoff
// phases of the Apex Retail · CDP Activation program.
//
// Pure deterministic read model: determinism-safe (no time, random, fetch,
// model calls, auth, supabase, source/sentinel/atlas/nexus/agent imports,
// no mock.ts import).
//
// All entries carry deterministicSeed: true and status: "draft" so that
// the UI can distinguish these seeded future slots from real approved
// deliverables.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type FuturePhaseDeliverablePhase =
  | 'design'
  | 'build'
  | 'activate'
  | 'operate';

export type FuturePhaseDeliverableStatus = 'draft' | 'not_started';

export type FuturePhaseDeliverableEvidenceState = 'missing';

export interface FuturePhaseDeliverable {
  id: string;
  title: string;
  description: string;
  phase: FuturePhaseDeliverablePhase;
  status: FuturePhaseDeliverableStatus;
  evidenceState: FuturePhaseDeliverableEvidenceState;
  missingInput: string;
  deterministicSeed: true;
}

export interface FuturePhaseDeliverablesViewModel {
  programLabel: string;
  deliverables: ReadonlyArray<FuturePhaseDeliverable>;
  totalCount: number;
  byPhase: Record<FuturePhaseDeliverablePhase, ReadonlyArray<FuturePhaseDeliverable>>;
  caveat: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const DEFAULT_PROGRAM_LABEL = 'Apex Retail · CDP Activation';

const CAVEAT =
  'Future phase deliverables are deterministic seed entries. No approval state is set or implied. All entries carry status "draft" and evidenceState "missing" until the relevant phase gate is approved and real deliverable content is generated.';

const GENERATED_AT = '2026-04-26';

// ---------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------

const FUTURE_PHASE_DELIVERABLES: ReadonlyArray<FuturePhaseDeliverable> = [
  // Design phase
  {
    id: 'design-target-state-data-evidence-architecture',
    title: 'Target-State Data and Evidence Architecture',
    description:
      'Blueprint for the data model, evidence layer, and integration architecture required to support CDP platform activation.',
    phase: 'design',
    status: 'draft',
    evidenceState: 'missing',
    missingInput:
      'Value hypothesis evidence and platform owner confirmation required before design can be approved.',
    deterministicSeed: true,
  },
  {
    id: 'design-operating-model-governance-blueprint',
    title: 'Operating Model and Governance Blueprint',
    description:
      'Governance structure, roles, decision rights, and escalation paths for the CDP program in its operational state.',
    phase: 'design',
    status: 'draft',
    evidenceState: 'missing',
    missingInput:
      'Stakeholder alignment on governance model pending Synthesis gate approval.',
    deterministicSeed: true,
  },
  // Execution Roadmap phase
  {
    id: 'roadmap-workstreams-estimates-milestones',
    title: 'Execution Workstreams, Estimates, and Milestones',
    description:
      'Workstream structure, timeline, estimates, critical milestones, dependencies, RACI, risks, and execution success criteria for the external delivery phase.',
    phase: 'build',
    status: 'draft',
    evidenceState: 'missing',
    missingInput:
      'Design gate approval required before the roadmap can be baselined.',
    deterministicSeed: true,
  },
  {
    id: 'roadmap-dependency-and-readiness-checklist',
    title: 'Roadmap Dependency and Readiness Checklist',
    description:
      'Control-plane checklist for integration dependencies, data readiness, security/privacy requirements, vendor handoffs, and pre-execution validation criteria.',
    phase: 'build',
    status: 'draft',
    evidenceState: 'missing',
    missingInput:
      'AMS vendor consolidation commercial decision needed to confirm integration scope.',
    deterministicSeed: true,
  },
  // Approval & Mobilization phase
  {
    id: 'approval-business-readiness-change-plan',
    title: 'Business Readiness and Change Plan',
    description:
      'Change management, training, stakeholder alignment, business readiness, and communication plan required to secure mobilization approval.',
    phase: 'activate',
    status: 'draft',
    evidenceState: 'missing',
    missingInput:
      'Execution roadmap approval required before readiness and change plan are finalized.',
    deterministicSeed: true,
  },
  {
    id: 'approval-business-case-funding-packet',
    title: 'Business Case and Funding Packet',
    description:
      'Funding request, expected benefits, cost envelope, decision rights, approvals, and value tracking methodology for the approved execution program.',
    phase: 'activate',
    status: 'draft',
    evidenceState: 'missing',
    missingInput:
      'Value hypothesis evidence baseline required from Synthesis phase.',
    deterministicSeed: true,
  },
  // Tower Handoff phase
  {
    id: 'tower-monitoring-contract',
    title: 'Tower Monitoring Contract',
    description:
      'Monitoring metrics, data-feed owners, cadence, escalation thresholds, and value-tracking responsibilities for execution oversight in Tower.',
    phase: 'operate',
    status: 'draft',
    evidenceState: 'missing',
    missingInput: 'Mobilization approval and Tower metric plan required.',
    deterministicSeed: true,
  },
  {
    id: 'tower-execution-decision-log',
    title: 'Execution Decision and Escalation Log',
    description:
      'Decision and escalation log for weekly/monthly execution updates, milestone changes, risk movements, and benefits tracking.',
    phase: 'operate',
    status: 'draft',
    evidenceState: 'missing',
    missingInput:
      'Tower handoff acceptance and reporting cadence required.',
    deterministicSeed: true,
  },
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic future phase deliverables view model.
 * Pure: same input → identical output.
 */
export function buildFuturePhaseDeliverablesViewModel(input?: {
  programLabel?: string;
}): FuturePhaseDeliverablesViewModel {
  const programLabel =
    input?.programLabel && input.programLabel.trim().length > 0
      ? input.programLabel
      : DEFAULT_PROGRAM_LABEL;

  const byPhase = groupByPhase(FUTURE_PHASE_DELIVERABLES);

  return {
    programLabel,
    deliverables: FUTURE_PHASE_DELIVERABLES,
    totalCount: FUTURE_PHASE_DELIVERABLES.length,
    byPhase,
    caveat: CAVEAT,
    generatedAt: GENERATED_AT,
  };
}

/**
 * Return all future phase deliverables for a given phase. Pure.
 */
export function getFutureDeliverablesByPhase(
  phase: FuturePhaseDeliverablePhase,
): ReadonlyArray<FuturePhaseDeliverable> {
  return FUTURE_PHASE_DELIVERABLES.filter((d) => d.phase === phase);
}

/**
 * Return the raw seed array for introspection / testing.
 */
export function getAllFuturePhaseDeliverables(): ReadonlyArray<FuturePhaseDeliverable> {
  return FUTURE_PHASE_DELIVERABLES;
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function groupByPhase(
  deliverables: ReadonlyArray<FuturePhaseDeliverable>,
): Record<FuturePhaseDeliverablePhase, ReadonlyArray<FuturePhaseDeliverable>> {
  const design: FuturePhaseDeliverable[] = [];
  const build: FuturePhaseDeliverable[] = [];
  const activate: FuturePhaseDeliverable[] = [];
  const operate: FuturePhaseDeliverable[] = [];

  for (const d of deliverables) {
    switch (d.phase) {
      case 'design':
        design.push(d);
        break;
      case 'build':
        build.push(d);
        break;
      case 'activate':
        activate.push(d);
        break;
      case 'operate':
        operate.push(d);
        break;
    }
  }

  return { design, build, activate, operate };
}

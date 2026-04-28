// PROG15 · Complete Future Phase Deliverables.
//
// Named, described seed entries for the Design / Build / Activate / Operate
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
  // Build phase
  {
    id: 'build-implementation-backlog-sprint-plan',
    title: 'Implementation Backlog and Sprint Plan',
    description:
      'Prioritised delivery backlog with sprint structure, team capacity plan, and dependency map for CDP build phase.',
    phase: 'build',
    status: 'draft',
    evidenceState: 'missing',
    missingInput:
      'Design gate approval required before backlog can be baselined.',
    deterministicSeed: true,
  },
  {
    id: 'build-integration-migration-readiness-checklist',
    title: 'Integration and Migration Readiness Checklist',
    description:
      'Technical readiness assessment for all integration points, data migration plan, and pre-launch validation criteria.',
    phase: 'build',
    status: 'draft',
    evidenceState: 'missing',
    missingInput:
      'AMS vendor consolidation commercial decision needed to confirm integration scope.',
    deterministicSeed: true,
  },
  // Activate phase
  {
    id: 'activate-adoption-enablement-plan',
    title: 'Adoption and Enablement Plan',
    description:
      'Change management, training, and user enablement programme for CDP platform rollout across Apex Retail business units.',
    phase: 'activate',
    status: 'draft',
    evidenceState: 'missing',
    missingInput:
      'Build completion and pilot results required before enablement plan is finalised.',
    deterministicSeed: true,
  },
  {
    id: 'activate-pilot-measurement-value-tracking-plan',
    title: 'Pilot Measurement and Value Tracking Plan',
    description:
      'KPIs, measurement framework, and value tracking methodology for the pilot cohort. Feeds Value Ledger evidence.',
    phase: 'activate',
    status: 'draft',
    evidenceState: 'missing',
    missingInput:
      'Value hypothesis evidence baseline required from Synthesis phase.',
    deterministicSeed: true,
  },
  // Operate phase
  {
    id: 'operate-run-state-governance-continuous-improvement',
    title: 'Run-State Governance and Continuous Improvement Plan',
    description:
      'Operational governance cadence, SLA ownership, and continuous improvement framework for CDP in steady-state operation.',
    phase: 'operate',
    status: 'draft',
    evidenceState: 'missing',
    missingInput: 'Activate phase completion and pilot learnings required.',
    deterministicSeed: true,
  },
  {
    id: 'operate-scale-roadmap-decision-log',
    title: 'Scale Roadmap and Decision Log',
    description:
      'Forward-looking roadmap for CDP capability expansion, with decision log capturing key architectural and commercial choices made throughout the programme.',
    phase: 'operate',
    status: 'draft',
    evidenceState: 'missing',
    missingInput:
      'Operate phase outcomes and value realization evidence required.',
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

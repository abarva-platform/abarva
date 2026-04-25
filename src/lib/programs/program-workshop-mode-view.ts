// PW1 · Program Workshop Mode view-model.
//
// Pure deterministic helper that takes a programId (canonical program
// slug) and projects the seed state plus MW2 workshop readiness into a
// shape the PW1 ProgramWorkshopMode shell renders. No model calls, no
// Date.now / Math.random / new Date, no fetch, no live runtime.
//
// This module does NOT import:
//   - src/lib/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**
//   - src/lib/auth/**
//   - supabase/**
//   - src/lib/programs/mock.ts
//
// The view-model is consumed exclusively by ProgramWorkshopMode.tsx.
// Any drift between the read model (MW2) and this projection is
// surfaced by the integration tests in
// src/__tests__/integration/programs/program-workshop-mode.test.ts.

import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import type {
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';
import {
  CANONICAL_SIX_PHASES,
  mapSpecPhaseToCanonicalIndex,
  statusForCanonicalPhase,
  type CanonicalPhase,
} from '@/lib/programs/programs-canonical-view';
import {
  buildNextRecommendedWorkshop,
  buildWorkshopReadinessForProgram,
  type WorkshopReadiness,
} from '@/lib/programs/workshop-readiness';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type ProgramWorkshopModePhaseStatus =
  | 'completed'
  | 'current'
  | 'pending';

export interface ProgramWorkshopModeLeftRailPhase {
  name: string;
  status: ProgramWorkshopModePhaseStatus;
  ordinal: number;
}

export interface ProgramWorkshopModeRightContext {
  evidenceUsable: number;
  gateImplication: string;
  gatekeeperAgent: 'steward';
}

export interface ProgramWorkshopModeView {
  programId: string;
  phase: { name: string; ordinal: number };
  nextWorkshop: WorkshopReadiness | null;
  agenda: string[];
  rightContext: ProgramWorkshopModeRightContext;
  leftRail: { phases: ReadonlyArray<ProgramWorkshopModeLeftRailPhase> };
  honestDisclaimer: string;
  createdFrom: 'deterministic_seed';
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

const HONEST_DISCLAIMER =
  'No live workshop ingestion is wired. This view is a deterministic ' +
  'pre-session brief built from the canonical workshop readiness read ' +
  'model.';

/**
 * Build the deterministic Program Workshop Mode view-model for a single
 * program. `programId` is the program slug as it appears in the canonical
 * seed plan (matching ProgramSeedPlan.programSlug). When the program is
 * not found, the view returns a defensive shell with the canonical phase
 * list set to "pending" and a null nextWorkshop. Pure: same input ->
 * identical output.
 */
export function buildProgramWorkshopModeView(
  programId: string,
): ProgramWorkshopModeView {
  const plan = buildAllProgramsSeedPlan();
  const located = locateProgram(plan.tenants, programId);

  if (located === null) {
    return {
      programId,
      phase: { name: 'Origination', ordinal: 1 },
      nextWorkshop: null,
      agenda: [],
      rightContext: {
        evidenceUsable: 0,
        gateImplication:
          'No canonical program is bound to this workshop view; ' +
          'no gate implication can be projected.',
        gatekeeperAgent: 'steward',
      },
      leftRail: {
        phases: CANONICAL_SIX_PHASES.map((p) => ({
          name: p.label,
          status: 'pending' as const,
          ordinal: p.index,
        })),
      },
      honestDisclaimer: HONEST_DISCLAIMER,
      createdFrom: 'deterministic_seed',
    };
  }

  const { tenant, program } = located;
  const canonicalIndex = mapSpecPhaseToCanonicalIndex(program.currentPhaseSpec);
  const canonicalPhase = CANONICAL_SIX_PHASES[canonicalIndex - 1];
  const nextWorkshop = buildNextRecommendedWorkshop(tenant, program);
  const agenda = composeAgenda(nextWorkshop);
  const evidenceUsable = countUsableEvidence(nextWorkshop);
  const gateImplication = composeGateImplication(nextWorkshop);
  const leftRailPhases = CANONICAL_SIX_PHASES.map(
    (p): ProgramWorkshopModeLeftRailPhase => ({
      name: p.label,
      status: leftRailStatusFor(program, p),
      ordinal: p.index,
    }),
  );

  return {
    programId,
    phase: { name: canonicalPhase.label, ordinal: canonicalPhase.index },
    nextWorkshop,
    agenda,
    rightContext: {
      evidenceUsable,
      gateImplication,
      gatekeeperAgent: 'steward',
    },
    leftRail: { phases: leftRailPhases },
    honestDisclaimer: HONEST_DISCLAIMER,
    createdFrom: 'deterministic_seed',
  };
}

// ---------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------

function locateProgram(
  tenants: ReadonlyArray<TenantSeedPlan>,
  programId: string,
): { tenant: TenantSeedPlan; program: ProgramSeedPlan } | null {
  for (const tenant of tenants) {
    for (const program of tenant.programs) {
      if (program.programSlug === programId) {
        return { tenant, program };
      }
    }
  }
  return null;
}

function leftRailStatusFor(
  program: ProgramSeedPlan,
  canonicalPhase: CanonicalPhase,
): ProgramWorkshopModePhaseStatus {
  const status = statusForCanonicalPhase(program, canonicalPhase.index);
  switch (status) {
    case 'complete':
      return 'completed';
    case 'active':
      return 'current';
    case 'pending':
      return 'pending';
    case 'origination_pre_seed':
      // Canonical Origination is always pre-seed; render as pending so
      // the rail reads honestly without claiming completion.
      return 'pending';
  }
}

function composeAgenda(workshop: WorkshopReadiness | null): string[] {
  if (workshop === null) return [];
  const agenda: string[] = [];
  // Pre-read headings.
  if (workshop.preReadList.length > 0) {
    agenda.push('Pre-read');
    for (const item of workshop.preReadList) {
      agenda.push(item);
    }
  }
  // Questions to ask.
  if (workshop.questionsToAsk.length > 0) {
    agenda.push('Questions to ask');
    for (const q of workshop.questionsToAsk) {
      agenda.push(q);
    }
  }
  // Decisions needed.
  if (workshop.decisionsNeeded.length > 0) {
    agenda.push('Decisions needed');
    for (const d of workshop.decisionsNeeded) {
      agenda.push(d);
    }
  }
  return agenda;
}

function countUsableEvidence(workshop: WorkshopReadiness | null): number {
  if (workshop === null) return 0;
  // Evidence is "usable" in the workshop sense when the readiness
  // record marks it as something to capture in-room; the deterministic
  // count is the full evidenceToCapture length. Live ingestion is not
  // wired, so this is the deterministic ceiling, not an observed count.
  return workshop.evidenceToCapture.length;
}

function composeGateImplication(workshop: WorkshopReadiness | null): string {
  if (workshop === null) {
    return 'No workshop is recommended for this program right now.';
  }
  return workshop.stewardGateImplication;
}

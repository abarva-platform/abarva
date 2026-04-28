// Programs → Control Tower signal read model. S9e slice.
//
// Pure deterministic conversion of seeded Programs state into portfolio
// pressure signals that Control Tower / Atlas can later consume. No UI,
// no Date.now(), no random IDs, no model calls. Same tenant + program
// input → identical signal list every time.
//
// Layered on top of S9 / S9b / S9c / S9d helpers:
//   - buildCanonicalHardGateStrip       (S9c)
//   - buildStewardReadinessNote         (S9c)
//   - buildProgramReadinessSummary      (S9d)
//   - buildProgramNexusContextBundle    (S9b)
//
// This module does NOT import:
//   - Tower UI, Atlas runtime, Nexus runtime, agent runtime
//   - Source files, auth, mock.ts
//   - Supabase / migrations
//
// It is a read-model. Future slices can wire it to a real Tower
// pressure-card UI, Atlas signal subscriber, or persisted alert store
// without touching this module.

import {
  buildCanonicalHardGateStrip,
  buildProgramReadinessSummary,
  buildStewardReadinessNote,
  CANONICAL_FOUR_GATES,
  type CanonicalHardGateEntry,
  type ProgramReadinessSummary,
} from '@/lib/programs/programs-canonical-view';
import { buildProgramNexusContextBundle } from '@/lib/programs/programs-nexus-rail-view';
import type {
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type ProgramPressureSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ProgramPressureType =
  | 'gate_missing_inputs'
  | 'evidence_not_ready'
  | 'value_not_ready'
  | 'deliverable_coverage_gap'
  | 'context_insufficient'
  | 'executive_decision_needed';

export type ProgramSignalSource =
  | 'phase_gate_strip'
  | 'evidence_readiness'
  | 'value_readiness'
  | 'deliverable_readiness'
  | 'context_bundle'
  | 'steward_readiness';

export interface ProgramControlTowerSignal {
  id: string;
  tenantKey: string;
  tenantName: string;
  programCode: string;
  programName: string;
  type: ProgramPressureType;
  severity: ProgramPressureSeverity;
  title: string;
  summary: string;
  source: ProgramSignalSource;
  routeHref: string;
  missingInputs: ReadonlyArray<string>;
  recommendedAction: string;
  evidenceStatus: ProgramReadinessSummary['evidence']['signal'];
  valueStatus: ProgramReadinessSummary['value']['signal'];
  gateStatus: 'all_clear' | 'missing_inputs' | 'not_wired';
  createdFrom: 'deterministic_seed';
}

export interface ProgramControlTowerSignalSummary {
  totalCount: number;
  byType: Record<ProgramPressureType, number>;
  bySeverity: Record<ProgramPressureSeverity, number>;
  /** Highest severity present in the signal set, or null when empty. */
  topSeverity: ProgramPressureSeverity | null;
  /** Stable, sorted list of unique program codes that emitted signals. */
  affectedProgramCodes: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------
// Severity ordering (used for stable sorting and topSeverity)
// ---------------------------------------------------------------------

const SEVERITY_RANK: Record<ProgramPressureSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const TYPE_RANK: Record<ProgramPressureType, number> = {
  executive_decision_needed: 1,
  value_not_ready: 2,
  gate_missing_inputs: 3,
  evidence_not_ready: 4,
  context_insufficient: 5,
  deliverable_coverage_gap: 6,
};

function emptyTypeCounts(): Record<ProgramPressureType, number> {
  return {
    gate_missing_inputs: 0,
    evidence_not_ready: 0,
    value_not_ready: 0,
    deliverable_coverage_gap: 0,
    context_insufficient: 0,
    executive_decision_needed: 0,
  };
}

function emptySeverityCounts(): Record<ProgramPressureSeverity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0 };
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the signal list for a single tenant + program. Deterministic.
 */
export function buildProgramControlTowerSignals(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
): ReadonlyArray<ProgramControlTowerSignal> {
  const out: ProgramControlTowerSignal[] = [];

  const gates = buildCanonicalHardGateStrip(program);
  const readiness = buildProgramReadinessSummary(program);
  const steward = buildStewardReadinessNote(program);
  const bundle = buildProgramNexusContextBundle(tenant, program);

  const routeHref = `/tenant/${tenant.routeSlug}/programs/${program.programSlug}`;

  // Gate signals — one per gate with status missing_inputs.
  for (const gate of gates) {
    if (gate.status !== 'missing_inputs') continue;
    out.push(buildGateSignal(tenant, program, gate, routeHref));
  }

  // Evidence readiness signal.
  if (readiness.evidence.signal !== 'ready') {
    out.push(buildEvidenceSignal(tenant, program, readiness, routeHref));
  }

  // Value readiness signal.
  if (readiness.value.signal !== 'ready') {
    out.push(buildValueSignal(tenant, program, readiness, routeHref));
  }

  // Deliverable coverage gap signal — only when there's at least one
  // required-but-stub deliverable.
  if (readiness.requiredStubGaps.length > 0) {
    out.push(buildDeliverableGapSignal(tenant, program, readiness, routeHref));
  }

  // Context bundle insufficient/blocked/pattern_only signal.
  if (
    bundle.state === 'insufficient'
    || bundle.state === 'blocked'
    || bundle.state === 'pattern_only'
  ) {
    out.push(buildContextSignal(tenant, program, bundle.state, routeHref));
  }

  // Executive decision needed — derived from Steward blocking items.
  if (steward.blocking.length > 0) {
    out.push(buildExecutiveDecisionSignal(tenant, program, steward, readiness, routeHref));
  }

  // Stable ordering: severity desc, then type rank asc, then id asc.
  return out.sort(compareSignals);
}

/**
 * Build the signal list for every program in a tenant. Deterministic
 * across repeated calls.
 */
export function buildTenantProgramControlTowerSignals(
  tenant: TenantSeedPlan,
): ReadonlyArray<ProgramControlTowerSignal> {
  const out: ProgramControlTowerSignal[] = [];
  // Iterate in the seed's natural order (which is itself deterministic
  // because it is loaded from a static JSON file).
  for (const program of tenant.programs) {
    out.push(...buildProgramControlTowerSignals(tenant, program));
  }
  return out.sort(compareSignals);
}

/**
 * Aggregate counts by type and severity. Pure.
 */
export function summarizeProgramControlTowerSignals(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
): ProgramControlTowerSignalSummary {
  const byType = emptyTypeCounts();
  const bySeverity = emptySeverityCounts();
  const programs = new Set<string>();
  for (const sig of signals) {
    byType[sig.type] += 1;
    bySeverity[sig.severity] += 1;
    programs.add(sig.programCode);
  }

  const topSeverity: ProgramPressureSeverity | null = (
    ['critical', 'high', 'medium', 'low'] as ProgramPressureSeverity[]
  ).find((s) => bySeverity[s] > 0) ?? null;

  return {
    totalCount: signals.length,
    byType,
    bySeverity,
    topSeverity,
    affectedProgramCodes: Array.from(programs).sort(),
  };
}

// ---------------------------------------------------------------------
// Internal builders — one per signal type
// ---------------------------------------------------------------------

function buildGateSignal(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  entry: CanonicalHardGateEntry,
  routeHref: string,
): ProgramControlTowerSignal {
  const severity: ProgramPressureSeverity = severityForGate(entry.gate.index);
  const reason = entry.blockedTransitionReason ?? 'Gate inputs are missing in the seed.';
  return {
    id: signalId(tenant.tenantKey, program.programSlug, 'gate_missing_inputs', `g${entry.gate.index}`),
    tenantKey: tenant.tenantKey,
    tenantName: tenant.displayName,
    programCode: program.code,
    programName: program.name,
    type: 'gate_missing_inputs',
    severity,
    title: `G${entry.gate.index} · ${entry.gate.label}`,
    summary: reason,
    source: 'phase_gate_strip',
    routeHref,
    missingInputs: [reason],
    recommendedAction: 'Capture the named seed input or wire the production gate state machine.',
    evidenceStatus: 'not_seeded',
    valueStatus: 'not_seeded',
    gateStatus: 'missing_inputs',
    createdFrom: 'deterministic_seed',
  };
}

function severityForGate(gateIndex: 1 | 2 | 3 | 4): ProgramPressureSeverity {
  // G3 (Design approved with projected value) is highest because dollar
  // exposure governs executive decisions; G4 (CXO verification of
  // realized outcomes) follows; G2 (CXO interview before findings) is
  // high because clinical/financial credibility hinges on it; G1
  // (charter signature) is medium since downstream phases re-test it.
  switch (gateIndex) {
    case 3:
      return 'critical';
    case 4:
      return 'high';
    case 2:
      return 'high';
    case 1:
      return 'medium';
  }
}

function buildEvidenceSignal(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  readiness: ProgramReadinessSummary,
  routeHref: string,
): ProgramControlTowerSignal {
  return {
    id: signalId(tenant.tenantKey, program.programSlug, 'evidence_not_ready', 'evidence'),
    tenantKey: tenant.tenantKey,
    tenantName: tenant.displayName,
    programCode: program.code,
    programName: program.name,
    type: 'evidence_not_ready',
    severity: 'high',
    title: 'Evidence registry not ready',
    summary: readiness.evidence.reason,
    source: 'evidence_readiness',
    routeHref,
    missingInputs: readiness.evidence.expectedSignals,
    recommendedAction:
      'Populate the evidence registry with per-deliverable E-id citations and CXO interview capture before promoting evidence-dependent gates.',
    evidenceStatus: readiness.evidence.signal,
    valueStatus: readiness.value.signal,
    gateStatus: 'missing_inputs',
    createdFrom: 'deterministic_seed',
  };
}

function buildValueSignal(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  readiness: ProgramReadinessSummary,
  routeHref: string,
): ProgramControlTowerSignal {
  // Value readiness drives executive trust; until it is seeded, no
  // dollar claims are defensible. Severity is critical for portfolio
  // attention.
  return {
    id: signalId(tenant.tenantKey, program.programSlug, 'value_not_ready', 'value'),
    tenantKey: tenant.tenantKey,
    tenantName: tenant.displayName,
    programCode: program.code,
    programName: program.name,
    type: 'value_not_ready',
    severity: 'critical',
    title: 'Value ledger not ready',
    summary: readiness.value.reason,
    source: 'value_readiness',
    routeHref,
    missingInputs: readiness.value.expectedSignals,
    recommendedAction:
      'Capture projected value with confidence band and the canonical G3/G4 documentation before publishing dollar claims to the Tower.',
    evidenceStatus: readiness.evidence.signal,
    valueStatus: readiness.value.signal,
    gateStatus: 'missing_inputs',
    createdFrom: 'deterministic_seed',
  };
}

function buildDeliverableGapSignal(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  readiness: ProgramReadinessSummary,
  routeHref: string,
): ProgramControlTowerSignal {
  const count = readiness.requiredStubGaps.length;
  const severity: ProgramPressureSeverity = count >= 3 ? 'high' : 'medium';
  const named = readiness.requiredStubGaps.slice(0, 3).map((g) => g.deliverableCode);
  const tail = count > 3 ? `, plus ${count - 3} more` : '';
  return {
    id: signalId(tenant.tenantKey, program.programSlug, 'deliverable_coverage_gap', 'stubs'),
    tenantKey: tenant.tenantKey,
    tenantName: tenant.displayName,
    programCode: program.code,
    programName: program.name,
    type: 'deliverable_coverage_gap',
    severity,
    title: `${count} required deliverable${count === 1 ? '' : 's'} at Stub tier`,
    summary: `Required-but-stub gap on ${named.join(', ')}${tail}.`,
    source: 'deliverable_readiness',
    routeHref,
    missingInputs: readiness.requiredStubGaps.map(
      (g) => `${g.deliverableCode} (P${g.phaseSpec}) · ${g.title}`,
    ),
    recommendedAction:
      'Promote required-but-stub deliverables to Outline or Rich tier before claiming phase advancement readiness.',
    evidenceStatus: readiness.evidence.signal,
    valueStatus: readiness.value.signal,
    gateStatus: 'missing_inputs',
    createdFrom: 'deterministic_seed',
  };
}

function buildContextSignal(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  state: 'insufficient' | 'blocked' | 'pattern_only',
  routeHref: string,
): ProgramControlTowerSignal {
  const severity: ProgramPressureSeverity = state === 'pattern_only' ? 'medium' : 'high';
  const reason = state === 'pattern_only'
    ? 'Context bundle is pattern-only; client-specific evidence is missing.'
    : state === 'insufficient'
      ? 'Context bundle is insufficient; substantive answers are gated.'
      : 'Context bundle is blocked; substantive answers are refused.';
  return {
    id: signalId(tenant.tenantKey, program.programSlug, 'context_insufficient', state),
    tenantKey: tenant.tenantKey,
    tenantName: tenant.displayName,
    programCode: program.code,
    programName: program.name,
    type: 'context_insufficient',
    severity,
    title: `Context bundle: ${state.replace('_', ' ')}`,
    summary: reason,
    source: 'context_bundle',
    routeHref,
    missingInputs: [
      'Business Context (projected value, risks, decisions pending) is not seeded.',
      'Evidence registry is not seeded.',
    ],
    recommendedAction:
      'Land the seed-population slice that captures evidence and value before relying on this program for executive decisions.',
    evidenceStatus: 'not_seeded',
    valueStatus: 'not_seeded',
    gateStatus: 'missing_inputs',
    createdFrom: 'deterministic_seed',
  };
}

function buildExecutiveDecisionSignal(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  steward: ReturnType<typeof buildStewardReadinessNote>,
  readiness: ProgramReadinessSummary,
  routeHref: string,
): ProgramControlTowerSignal {
  // Steward blocking items reflect canonical hard-gate states; an
  // executive cannot defend a Phase advance from a blocked surface.
  const severity: ProgramPressureSeverity =
    readiness.value.signal === 'not_seeded' ? 'critical' : 'high';
  return {
    id: signalId(tenant.tenantKey, program.programSlug, 'executive_decision_needed', 'steward'),
    tenantKey: tenant.tenantKey,
    tenantName: tenant.displayName,
    programCode: program.code,
    programName: program.name,
    type: 'executive_decision_needed',
    severity,
    title: 'Executive decision pending',
    summary:
      `${steward.blocking.length} blocking item(s) Steward cannot clear from seed alone.`,
    source: 'steward_readiness',
    routeHref,
    missingInputs: steward.blocking,
    recommendedAction:
      'Surface the blocking items in the next steering touchpoint; do not advance the phase from seed alone.',
    evidenceStatus: readiness.evidence.signal,
    valueStatus: readiness.value.signal,
    gateStatus: 'missing_inputs',
    createdFrom: 'deterministic_seed',
  };
}

function signalId(
  tenantKey: string,
  programSlug: string,
  type: ProgramPressureType,
  suffix: string,
): string {
  return `sig:${tenantKey}:${programSlug}:${type}:${suffix}`;
}

function compareSignals(
  a: ProgramControlTowerSignal,
  b: ProgramControlTowerSignal,
): number {
  // Primary: severity desc.
  const sev = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
  if (sev !== 0) return sev;
  // Secondary: type rank asc (executive first).
  const ty = TYPE_RANK[a.type] - TYPE_RANK[b.type];
  if (ty !== 0) return ty;
  // Tertiary: id asc.
  return a.id.localeCompare(b.id);
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

/**
 * Test-only convenience: the canonical four hard-gate identifiers in
 * canonical order. Mirrors S9c's CANONICAL_FOUR_GATES so a regression
 * in either contract is caught.
 */
export function listKnownGateIndices(): ReadonlyArray<1 | 2 | 3 | 4> {
  return CANONICAL_FOUR_GATES.map((g) => g.index);
}

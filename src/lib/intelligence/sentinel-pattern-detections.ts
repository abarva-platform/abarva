// I1 · Sentinel Pattern Detection Read Model.
//
// Pure deterministic conversion of the S9e Programs → Control Tower
// signal list into named pattern detections that a future Intelligence
// page (and the eventual live Sentinel runtime) can subscribe to.
//
// No Intelligence UI, no Sentinel runtime, no Atlas runtime, no Nexus
// runtime, no agent runtime, no Source files, no mock.ts, no auth, no
// migrations, no model calls, no Date.now() reads. Same tenant +
// signal list → identical detection list every time.
//
// Layered exclusively on top of S9e:
//   - buildTenantProgramControlTowerSignals(tenant)   (S9e)
//   - ProgramControlTowerSignal                       (S9e)
//
// This module does NOT import:
//   - src/components/intelligence/**
//   - src/app/(maestro)/intelligence/**
//   - src/lib/sentinel/**
//   - src/lib/atlas/**
//   - src/lib/nexus/**
//   - src/lib/agent/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**
//
// I1 is a read model only. A future I2 slice can render the detection
// list onto a tenant Intelligence page. A future Sentinel runtime
// slice can subscribe to it for portfolio editorial composition. A
// future persistence slice can dedup detections by id and track
// recurrence over time.

import {
  buildTenantProgramControlTowerSignals,
  type ProgramControlTowerSignal,
  type ProgramPressureSeverity,
  type ProgramPressureType,
  type ProgramSignalSource,
} from '@/lib/programs/programs-control-tower-signals';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type SentinelPatternKey =
  | 'value_ledger_incompleteness'
  | 'evidence_chain_gap'
  | 'gate_governance_gap'
  | 'program_context_sparsity'
  | 'ai_governance_operating_model_gap';

export type SentinelDetectionConfidence = 'low' | 'medium' | 'high';

export type SentinelPatternSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SentinelPatternHandoffTarget =
  | 'nexus'
  | 'atlas'
  | 'steward'
  | 'sentinel';

export interface SentinelPatternEvidenceSignal {
  signalId: string;
  signalType: ProgramPressureType;
  signalSeverity: ProgramPressureSeverity;
  programCode: string;
  programName: string;
  source: ProgramSignalSource;
  routeHref: string;
}

export interface SentinelAffectedProgram {
  programCode: string;
  programName: string;
  routeHref: string;
}

export interface SentinelPatternDetection {
  id: string;
  tenantKey: string;
  tenantName: string;
  patternKey: SentinelPatternKey;
  patternName: string;
  confidence: SentinelDetectionConfidence;
  severity: SentinelPatternSeverity;
  title: string;
  summary: string;
  whyItMatters: string;
  affectedPrograms: ReadonlyArray<SentinelAffectedProgram>;
  sourceSignalIds: ReadonlyArray<string>;
  evidenceSignals: ReadonlyArray<SentinelPatternEvidenceSignal>;
  missingInputs: ReadonlyArray<string>;
  recommendedAction: string;
  handoffTargets: ReadonlyArray<SentinelPatternHandoffTarget>;
  routeHref: string;
  createdFrom: 'deterministic_seed';
}

export interface SentinelPatternDetectionSummary {
  totalCount: number;
  byPattern: Record<SentinelPatternKey, number>;
  byConfidence: Record<SentinelDetectionConfidence, number>;
  bySeverity: Record<SentinelPatternSeverity, number>;
  topConfidence: SentinelDetectionConfidence | null;
  topSeverity: SentinelPatternSeverity | null;
  affectedProgramCodes: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------
// Pattern metadata (deterministic, hand-authored)
// ---------------------------------------------------------------------

interface PatternMeta {
  key: SentinelPatternKey;
  name: string;
  whyItMatters: string;
  handoffTargets: ReadonlyArray<SentinelPatternHandoffTarget>;
}

const PATTERN_META: Record<SentinelPatternKey, PatternMeta> = {
  value_ledger_incompleteness: {
    key: 'value_ledger_incompleteness',
    name: 'Value ledger incompleteness',
    whyItMatters:
      'Without a complete value ledger, dollar claims cannot be defended at canonical G3/G4 and steering committees cannot prioritize portfolio investment.',
    handoffTargets: ['atlas', 'steward'],
  },
  evidence_chain_gap: {
    key: 'evidence_chain_gap',
    name: 'Evidence chain gap',
    whyItMatters:
      'Without a complete evidence chain, deliverable conclusions cannot be traced to interview or telemetry sources and findings cannot survive CXO review.',
    handoffTargets: ['steward', 'nexus'],
  },
  gate_governance_gap: {
    key: 'gate_governance_gap',
    name: 'Gate governance gap',
    whyItMatters:
      'Phase advancement cannot be justified when canonical hard gates are missing inputs or when an executive decision is overdue; the cycle stalls or proceeds on undocumented authority.',
    handoffTargets: ['atlas', 'steward'],
  },
  program_context_sparsity: {
    key: 'program_context_sparsity',
    name: 'Program context sparsity',
    whyItMatters:
      'When the Context Bundle is thin or required deliverables remain at Stub tier, downstream agents must refuse substantive answers and Nexus cannot reach a usable_with_gaps state.',
    handoffTargets: ['nexus', 'sentinel'],
  },
  ai_governance_operating_model_gap: {
    key: 'ai_governance_operating_model_gap',
    name: 'AI governance operating model gap',
    whyItMatters:
      'When multiple programs share governance, gate, evidence, and value gaps, the issue is no longer per-program — the operating model itself is not yet fit to govern AI delivery at portfolio scale.',
    handoffTargets: ['atlas', 'steward', 'sentinel'],
  },
};

const PATTERN_KEY_RANK: Record<SentinelPatternKey, number> = {
  ai_governance_operating_model_gap: 1,
  value_ledger_incompleteness: 2,
  gate_governance_gap: 3,
  evidence_chain_gap: 4,
  program_context_sparsity: 5,
};

const SEVERITY_RANK: Record<SentinelPatternSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const CONFIDENCE_RANK: Record<SentinelDetectionConfidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function emptyByPattern(): Record<SentinelPatternKey, number> {
  return {
    value_ledger_incompleteness: 0,
    evidence_chain_gap: 0,
    gate_governance_gap: 0,
    program_context_sparsity: 0,
    ai_governance_operating_model_gap: 0,
  };
}

function emptyByConfidence(): Record<SentinelDetectionConfidence, number> {
  return { low: 0, medium: 0, high: 0 };
}

function emptyBySeverity(): Record<SentinelPatternSeverity, number> {
  return { low: 0, medium: 0, high: 0, critical: 0 };
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Convenience wrapper — builds the S9e tenant signal list and runs
 * the detection pass. Pure: same tenant input → identical output.
 */
export function buildSentinelPatternDetectionsForTenant(
  tenant: TenantSeedPlan,
): ReadonlyArray<SentinelPatternDetection> {
  const signals = buildTenantProgramControlTowerSignals(tenant);
  return buildSentinelPatternDetectionsFromProgramSignals(tenant, signals);
}

/**
 * Detect patterns from a pre-computed S9e signal list. Pure.
 *
 * Detection rules (conservative, deterministic):
 *
 * - value_ledger_incompleteness   ← any value_not_ready signal
 * - evidence_chain_gap            ← any evidence_not_ready signal
 * - gate_governance_gap           ← any gate_missing_inputs or
 *                                    executive_decision_needed signal
 * - program_context_sparsity      ← any context_insufficient or
 *                                    deliverable_coverage_gap signal
 * - ai_governance_operating_model_gap
 *                                 ← at least 2 distinct programs each
 *                                    emit at least one signal in
 *                                    {value_not_ready, evidence_not_ready,
 *                                     gate_missing_inputs,
 *                                     executive_decision_needed}
 */
export function buildSentinelPatternDetectionsFromProgramSignals(
  tenant: TenantSeedPlan,
  signals: ReadonlyArray<ProgramControlTowerSignal>,
): ReadonlyArray<SentinelPatternDetection> {
  if (signals.length === 0) return [];

  const detections: SentinelPatternDetection[] = [];

  const valueSignals = signals.filter((s) => s.type === 'value_not_ready');
  if (valueSignals.length > 0) {
    detections.push(
      composeDetection(tenant, 'value_ledger_incompleteness', valueSignals, {
        title: composeTitle(
          tenant,
          'Value ledger incompleteness',
          uniqueProgramCount(valueSignals),
        ),
        summary: composeValueSummary(valueSignals),
        recommendedAction:
          'Capture projected value with a confidence band and the canonical G3/G4 documentation before publishing dollar claims to the Tower.',
      }),
    );
  }

  const evidenceSignals = signals.filter((s) => s.type === 'evidence_not_ready');
  if (evidenceSignals.length > 0) {
    detections.push(
      composeDetection(tenant, 'evidence_chain_gap', evidenceSignals, {
        title: composeTitle(
          tenant,
          'Evidence chain gap',
          uniqueProgramCount(evidenceSignals),
        ),
        summary: composeEvidenceSummary(evidenceSignals),
        recommendedAction:
          'Populate the evidence registry with per-deliverable E-id citations and CXO interview capture before promoting evidence-dependent gates.',
      }),
    );
  }

  const governanceSignals = signals.filter(
    (s) => s.type === 'gate_missing_inputs' || s.type === 'executive_decision_needed',
  );
  if (governanceSignals.length > 0) {
    detections.push(
      composeDetection(tenant, 'gate_governance_gap', governanceSignals, {
        title: composeTitle(
          tenant,
          'Gate governance gap',
          uniqueProgramCount(governanceSignals),
        ),
        summary: composeGovernanceSummary(governanceSignals),
        recommendedAction:
          'Resolve the missing canonical hard-gate inputs and surface pending executive decisions in the next steering touchpoint.',
      }),
    );
  }

  const contextSparsitySignals = signals.filter(
    (s) => s.type === 'context_insufficient' || s.type === 'deliverable_coverage_gap',
  );
  if (contextSparsitySignals.length > 0) {
    detections.push(
      composeDetection(tenant, 'program_context_sparsity', contextSparsitySignals, {
        title: composeTitle(
          tenant,
          'Program context sparsity',
          uniqueProgramCount(contextSparsitySignals),
        ),
        summary: composeContextSparsitySummary(contextSparsitySignals),
        recommendedAction:
          'Land the seed-population slice that captures evidence and value, and promote required-but-stub deliverables to Outline tier before relying on these programs for executive decisions.',
      }),
    );
  }

  // Meta pattern — at least two distinct programs each with at least
  // one governance / value / evidence gap signal.
  const operatingModelSignals = signals.filter(
    (s) =>
      s.type === 'value_not_ready'
      || s.type === 'evidence_not_ready'
      || s.type === 'gate_missing_inputs'
      || s.type === 'executive_decision_needed',
  );
  const distinctOperatingModelPrograms = uniqueProgramCount(operatingModelSignals);
  if (distinctOperatingModelPrograms >= 2) {
    detections.push(
      composeDetection(
        tenant,
        'ai_governance_operating_model_gap',
        operatingModelSignals,
        {
          title: composeTitle(
            tenant,
            'AI governance operating model gap',
            distinctOperatingModelPrograms,
          ),
          summary: composeOperatingModelSummary(operatingModelSignals),
          recommendedAction:
            'Convene a portfolio governance review; the gap is across programs, not local to any single initiative. Atlas can compose the editorial and Steward can clear blocking items program by program.',
        },
      ),
    );
  }

  return detections.sort(compareDetections);
}

/**
 * Aggregate counts by pattern, confidence, and severity. Pure.
 */
export function summarizeSentinelPatternDetections(
  detections: ReadonlyArray<SentinelPatternDetection>,
): SentinelPatternDetectionSummary {
  const byPattern = emptyByPattern();
  const byConfidence = emptyByConfidence();
  const bySeverity = emptyBySeverity();
  const programs = new Set<string>();

  for (const det of detections) {
    byPattern[det.patternKey] += 1;
    byConfidence[det.confidence] += 1;
    bySeverity[det.severity] += 1;
    for (const ap of det.affectedPrograms) programs.add(ap.programCode);
  }

  const topConfidence: SentinelDetectionConfidence | null =
    (['high', 'medium', 'low'] as SentinelDetectionConfidence[]).find(
      (c) => byConfidence[c] > 0,
    ) ?? null;

  const topSeverity: SentinelPatternSeverity | null =
    (['critical', 'high', 'medium', 'low'] as SentinelPatternSeverity[]).find(
      (s) => bySeverity[s] > 0,
    ) ?? null;

  return {
    totalCount: detections.length,
    byPattern,
    byConfidence,
    bySeverity,
    topConfidence,
    topSeverity,
    affectedProgramCodes: Array.from(programs).sort(),
  };
}

// ---------------------------------------------------------------------
// Internal composition helpers
// ---------------------------------------------------------------------

interface ComposeDetectionInputs {
  title: string;
  summary: string;
  recommendedAction: string;
}

function composeDetection(
  tenant: TenantSeedPlan,
  patternKey: SentinelPatternKey,
  contributing: ReadonlyArray<ProgramControlTowerSignal>,
  inputs: ComposeDetectionInputs,
): SentinelPatternDetection {
  const meta = PATTERN_META[patternKey];
  const programCount = uniqueProgramCount(contributing);

  const severity = pickSeverity(contributing, programCount, patternKey);
  const confidence = pickConfidence(contributing, programCount, patternKey);

  const affectedPrograms = collectAffectedPrograms(contributing);
  const sourceSignalIds = contributing.map((s) => s.id).sort();
  const evidenceSignals = collectEvidenceSignals(contributing);
  const missingInputs = collectMissingInputs(contributing);

  return {
    id: detectionId(tenant.tenantKey, patternKey),
    tenantKey: tenant.tenantKey,
    tenantName: tenant.displayName,
    patternKey,
    patternName: meta.name,
    confidence,
    severity,
    title: inputs.title,
    summary: inputs.summary,
    whyItMatters: meta.whyItMatters,
    affectedPrograms,
    sourceSignalIds,
    evidenceSignals,
    missingInputs,
    recommendedAction: inputs.recommendedAction,
    handoffTargets: meta.handoffTargets,
    routeHref: `/tenant/${tenant.routeSlug}/intelligence/patterns/${patternKey}`,
    createdFrom: 'deterministic_seed',
  };
}

function composeTitle(
  tenant: TenantSeedPlan,
  patternName: string,
  programCount: number,
): string {
  if (programCount <= 1) {
    return `${patternName} · ${tenant.displayName}`;
  }
  return `${patternName} across ${programCount} programs · ${tenant.displayName}`;
}

function composeValueSummary(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
): string {
  const programs = uniqueProgramCodes(signals);
  if (programs.length === 1) {
    return `${programs[0]} cannot defend a dollar claim today; the value ledger is seed-only.`;
  }
  const head = programs.slice(0, 3).join(', ');
  const tail = programs.length > 3 ? `, plus ${programs.length - 3} more` : '';
  return `${programs.length} programs (${head}${tail}) cannot defend a dollar claim today; the value ledger is seed-only across the portfolio.`;
}

function composeEvidenceSummary(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
): string {
  const programs = uniqueProgramCodes(signals);
  if (programs.length === 1) {
    return `${programs[0]} has no per-deliverable evidence chain; conclusions cannot be traced to interview or telemetry sources.`;
  }
  const head = programs.slice(0, 3).join(', ');
  const tail = programs.length > 3 ? `, plus ${programs.length - 3} more` : '';
  return `${programs.length} programs (${head}${tail}) lack a per-deliverable evidence chain; conclusions cannot survive CXO review until citations are populated.`;
}

function composeGovernanceSummary(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
): string {
  const programs = uniqueProgramCodes(signals);
  const gateCount = signals.filter((s) => s.type === 'gate_missing_inputs').length;
  const execCount = signals.filter(
    (s) => s.type === 'executive_decision_needed',
  ).length;
  const head = programs.slice(0, 3).join(', ');
  const tail = programs.length > 3 ? `, plus ${programs.length - 3} more` : '';
  return `${gateCount} gate-input gap(s) and ${execCount} pending executive decision(s) span ${programs.length} program(s) (${head}${tail}); phase advancement cannot be justified from seed alone.`;
}

function composeContextSparsitySummary(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
): string {
  const programs = uniqueProgramCodes(signals);
  const ctx = signals.filter((s) => s.type === 'context_insufficient').length;
  const cov = signals.filter((s) => s.type === 'deliverable_coverage_gap').length;
  const head = programs.slice(0, 3).join(', ');
  const tail = programs.length > 3 ? `, plus ${programs.length - 3} more` : '';
  return `${ctx} thin Context Bundle(s) and ${cov} required-but-stub deliverable cluster(s) across ${programs.length} program(s) (${head}${tail}); Nexus cannot reach a usable_with_gaps state on these programs without seeding.`;
}

function composeOperatingModelSummary(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
): string {
  const programs = uniqueProgramCodes(signals);
  const head = programs.slice(0, 3).join(', ');
  const tail = programs.length > 3 ? `, plus ${programs.length - 3} more` : '';
  return `Governance, gate, evidence, and value gaps are co-occurring across ${programs.length} programs (${head}${tail}); the operating model itself — not any single initiative — is the locus of the gap.`;
}

function pickSeverity(
  contributing: ReadonlyArray<ProgramControlTowerSignal>,
  programCount: number,
  patternKey: SentinelPatternKey,
): SentinelPatternSeverity {
  const maxRank = contributing.reduce(
    (acc, s) => Math.max(acc, SEVERITY_RANK[s.severity]),
    0,
  );
  let base: SentinelPatternSeverity =
    (Object.entries(SEVERITY_RANK) as [SentinelPatternSeverity, number][]).find(
      ([, r]) => r === maxRank,
    )?.[0] ?? 'low';
  // Meta pattern: bump to critical when ≥3 programs and at least one
  // critical-severity signal in the mix.
  if (
    patternKey === 'ai_governance_operating_model_gap'
    && programCount >= 3
    && maxRank >= SEVERITY_RANK.critical
  ) {
    base = 'critical';
  }
  // Single-program detections cap at the max contributing severity.
  return base;
}

function pickConfidence(
  contributing: ReadonlyArray<ProgramControlTowerSignal>,
  programCount: number,
  patternKey: SentinelPatternKey,
): SentinelDetectionConfidence {
  // Meta pattern requires ≥2 programs by construction; calibrate
  // strictly on cross-program scope.
  if (patternKey === 'ai_governance_operating_model_gap') {
    if (programCount >= 3) return 'high';
    return 'medium';
  }
  // Per-pattern calibration:
  //   - 3+ affected programs → high
  //   - 2 affected programs → medium
  //   - 1 affected program: medium when contributing severity is
  //     critical or there are multiple signals from that program;
  //     low otherwise.
  if (programCount >= 3) return 'high';
  if (programCount === 2) return 'medium';
  if (programCount === 1) {
    const hasCritical = contributing.some((s) => s.severity === 'critical');
    if (hasCritical) return 'medium';
    if (contributing.length >= 2) return 'medium';
    return 'low';
  }
  return 'low';
}

function collectAffectedPrograms(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
): ReadonlyArray<SentinelAffectedProgram> {
  const seen = new Map<string, SentinelAffectedProgram>();
  for (const s of signals) {
    if (!seen.has(s.programCode)) {
      seen.set(s.programCode, {
        programCode: s.programCode,
        programName: s.programName,
        routeHref: s.routeHref,
      });
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.programCode.localeCompare(b.programCode),
  );
}

function collectEvidenceSignals(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
): ReadonlyArray<SentinelPatternEvidenceSignal> {
  return signals
    .map<SentinelPatternEvidenceSignal>((s) => ({
      signalId: s.id,
      signalType: s.type,
      signalSeverity: s.severity,
      programCode: s.programCode,
      programName: s.programName,
      source: s.source,
      routeHref: s.routeHref,
    }))
    .sort((a, b) => a.signalId.localeCompare(b.signalId));
}

function collectMissingInputs(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
): ReadonlyArray<string> {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of signals) {
    for (const m of s.missingInputs) {
      const key = `${s.programCode} · ${m}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(key);
      }
    }
  }
  return out;
}

function uniqueProgramCount(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
): number {
  const set = new Set<string>();
  for (const s of signals) set.add(s.programCode);
  return set.size;
}

function uniqueProgramCodes(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
): ReadonlyArray<string> {
  const set = new Set<string>();
  for (const s of signals) set.add(s.programCode);
  return Array.from(set).sort();
}

function detectionId(tenantKey: string, patternKey: SentinelPatternKey): string {
  return `sentinel:${tenantKey}:${patternKey}`;
}

function compareDetections(
  a: SentinelPatternDetection,
  b: SentinelPatternDetection,
): number {
  // Primary: severity desc.
  const sev = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
  if (sev !== 0) return sev;
  // Secondary: confidence desc.
  const conf = CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
  if (conf !== 0) return conf;
  // Tertiary: pattern key rank asc (operating-model first).
  const pat = PATTERN_KEY_RANK[a.patternKey] - PATTERN_KEY_RANK[b.patternKey];
  if (pat !== 0) return pat;
  // Quaternary: id asc.
  return a.id.localeCompare(b.id);
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

/**
 * Test-only convenience: the canonical pattern key list in canonical
 * rank order. Mirrors PATTERN_KEY_RANK so a regression in either
 * contract is caught.
 */
export const SENTINEL_PATTERN_KEYS_IN_RANK_ORDER: ReadonlyArray<SentinelPatternKey> = [
  'ai_governance_operating_model_gap',
  'value_ledger_incompleteness',
  'gate_governance_gap',
  'evidence_chain_gap',
  'program_context_sparsity',
];

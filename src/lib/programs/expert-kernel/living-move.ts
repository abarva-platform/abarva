// Expert Kernel — the living Move: a tenant-agnostic, parametrised costed
// business case.
//
// The kernel is anchored on three real tenant cases — Apex Retail, Meridian
// Health System, First Capital Financial (see `apex-contact-center-case.ts`,
// `meridian-ambient-clinical-case.ts`, `firstcapital-fraud-detection-case.ts`).
// Each `build*Case()` runs the kernel on a FIXED set of grounded inputs and
// returns a static board-grade Costed Business-Case Pack. The *living* Move is
// the SAME case made interactive: a CXO touches the highest-leverage
// assumptions and the kernel recompiles.
//
// This module exposes that recompute, generalised. `buildLivingMoveCase(
// caseEntry, controls)` takes a registry entry (which carries the tenant's own
// six control definitions and a grounded kernel compile path) plus a small set
// of control values, threads them through the REAL kernel compile path —
// `buildBaselineModel → buildEffortEstimate → buildValueForecast →
// compileBusinessCase` — and returns the recompiled case plus the three
// board-grade exhibit datasets (waterfall / value bridge / sensitivity
// tornado), shaped exactly as the board-grade pack-model shapes them.
//
// It is NOT a reimplementation. Every number traces to a kernel field. The
// kernel's honesty discipline holds under every control setting and for every
// case:
//   • Each anchor's gross value rests on a declared seed gap (a missing unit-
//     economics coefficient). By default the value forecast carries
//     `grossValueIsProxy: true`, which forces `monetisationBlocked` and leaves
//     payback `null` — exactly as the static case. When (and only when) the
//     CXO supplies the optional seed-gap input, the proxy flag drops,
//     monetisation un-blocks, and payback computes live. Clearing it reverts
//     to blocked.
//   • The critic still runs; its blockers still downgrade fund → shape, and a
//     negative net return still downgrades the verdict to `kill` honestly.
//
// Pure module: deterministic, no I/O. Importable client-side — every module
// on the compile path is pure TypeScript with no `server-only` import, so the
// recompute can run in a client component for instant feedback.

import { round2 } from './types';
import type { HaircutScores, ValueForecast } from './value-forecast';
import type {
  BusinessCaseSkeleton,
  Recommendation,
} from './business-case-compiler';

// ───────────────────────────────────────────────────────────────────────────
// Controls — the parametrised inputs that drive the living Move
// ───────────────────────────────────────────────────────────────────────────

/**
 * The control values a living Move is compiled from. Keyed by control id; each
 * value is a real kernel input. A `number` is a slider value; `null` is the
 * un-supplied state of a seed-gap control. Adjusting any value recompiles the
 * case honestly — the kernel never fabricates.
 */
export type LivingMoveControls = Readonly<Record<string, number | null>>;

/** The kind of a control — a haircut score, a value lever, or the seed gap. */
export type LivingControlKind = 'score' | 'lever' | 'seed-gap';

/**
 * One control definition. The registry entry carries six of these per case —
 * the genuinely highest-leverage inputs of THAT tenant's case. The view
 * renders sliders for `score`/`lever` controls and the seed-gap card for the
 * single `seed-gap` control.
 */
export interface LivingControlDef {
  /** Stable control id — the key into `LivingMoveControls`. */
  id: string;
  /** Control kind — drives which UI affordance the view renders. */
  kind: LivingControlKind;
  /** Short label for the control card. */
  label: string;
  /** One-line explanation of what the control is and why it matters. */
  hint: string;
  /** The grounded default — the audited value the living Move opens on. */
  defaultValue: number | null;
  /** Slider minimum (score / lever controls). */
  min: number;
  /** Slider maximum (score / lever controls). */
  max: number;
  /** Slider step. */
  step: number;
  /** How a value renders: a percentage, a points delta, a $ figure, etc. */
  format: 'percent' | 'points' | 'usd' | 'plain';
  /** Optional unit suffix for `plain`/`points` formats (e.g. ' /wk'). */
  unitSuffix?: string;
  /** For the `seed-gap` control: the benchmark value the "use benchmark"
   *  button supplies. Ignored for other kinds. */
  seedGapBenchmark?: number;
  /** For the `seed-gap` control: the metric label shown on the card. */
  seedGapMetricLabel?: string;
  /** For the `seed-gap` control: the honest "not recorded" explanation. */
  seedGapNote?: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Exhibit datasets — board-grade, shaped identically for every case
// ───────────────────────────────────────────────────────────────────────────

/** A board-grade investment-waterfall step (matches `WaterfallStep`). */
export interface LivingWaterfallStep {
  label: string;
  amount: number;
}

/** A board-grade value-bridge step (matches `BridgeStep`). */
export interface LivingBridgeStep {
  label: string;
  amount: number;
}

/** A board-grade sensitivity-tornado bar (matches `TornadoBar`). */
export interface LivingTornadoBar {
  label: string;
  swing: number;
  isProxy: boolean;
}

/** The recompiled living Move — the kernel case plus the exhibit datasets. */
export interface LivingMoveCase {
  /** The recompiled kernel skeleton — the source of every figure below. */
  skeleton: BusinessCaseSkeleton;
  /** The controls this case was compiled from (echoed for the view). */
  controls: LivingMoveControls;
  /** Gross 3-yr value (point) — the optimistic ceiling before the haircut. */
  grossValue: number;
  /** Net 3-yr value (point) — post-haircut. */
  netValue: number;
  /** Compounded haircut fraction (0..1). */
  haircut: number;
  /** Investment-waterfall dataset (board-grade exhibit input). */
  waterfall: LivingWaterfallStep[];
  /** Gross-to-net value-bridge dataset (board-grade exhibit input). */
  bridgeSteps: LivingBridgeStep[];
  /** Sensitivity-tornado dataset (board-grade exhibit input). */
  tornado: LivingTornadoBar[];
  /**
   * True when this case's seed-gap input has been supplied — monetisation is
   * un-blocked and payback is a live number. False = honestly blocked.
   */
  seedGapFilled: boolean;
  /** The verdict the kernel recompiled to — echoed for convenience. */
  recommendation: Recommendation;
}

// ───────────────────────────────────────────────────────────────────────────
// The registry-entry contract
// ───────────────────────────────────────────────────────────────────────────

/**
 * The output of a tenant case's kernel compile path: the recompiled skeleton
 * plus the value forecast it folds in. The composer reads the value forecast
 * to shape the gross-to-net bridge and the headline economics — the skeleton
 * exposes only the net value range, not the gross figure or the haircut.
 */
export interface LivingMoveCompile {
  /** The recompiled kernel skeleton. */
  skeleton: BusinessCaseSkeleton;
  /** The value forecast the skeleton folded into its net value range. */
  value: ValueForecast;
}

/**
 * What the recompute needs from a tenant case to render the living Move. A
 * `living-move-cases.ts` registry entry carries one of these per anchor — the
 * grounded kernel compile path for that tenant plus its six control
 * definitions. The composer is generic over it.
 */
export interface LivingMoveCaseEntry {
  /** Stable case id — the `?case=` selector value. */
  id: string;
  /** Short tenant label for the switcher UI. */
  tenantLabel: string;
  /** The Move the case belongs to. */
  moveLabel: string;
  /** A one-line provenance string for the surface. */
  provenance: string;
  /** The six control definitions — this tenant's real highest-leverage inputs. */
  controls: readonly LivingControlDef[];
  /** The id of the single seed-gap control among `controls`. */
  seedGapControlId: string;
  /**
   * Recompile the tenant's costed business case for a control setting. Runs
   * the REAL kernel compile path. The registry entry owns this — it is the
   * only tenant-specific code; the exhibit shaping below is shared.
   */
  compile: (controls: LivingMoveControls) => LivingMoveCompile;
}

// ───────────────────────────────────────────────────────────────────────────
// Shared helpers — used by both the composer and the per-case compile paths
// ───────────────────────────────────────────────────────────────────────────

/** Clamp a number into 0..1. */
export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Human labels for the six haircut dimensions (value-bridge step labels). */
export const HAIRCUT_FACTOR_LABEL: Record<keyof HaircutScores, string> = {
  adoptionRisk: 'Adoption risk',
  dataReadiness: 'Data readiness',
  processDependency: 'Process dependency',
  integrationComplexity: 'Integration complexity',
  controlBurden: 'Control burden',
  sponsorStrength: 'Sponsor strength',
};

/**
 * Resolve the grounded default control set for a case entry — the audited
 * values the living Move opens on.
 */
export function defaultsFor(entry: LivingMoveCaseEntry): LivingMoveControls {
  const out: Record<string, number | null> = {};
  for (const c of entry.controls) out[c.id] = c.defaultValue;
  return out;
}

/**
 * Read a numeric control value, falling back to a default. The composer and
 * the per-case compile paths use this so a partial control object never
 * crashes the recompute.
 */
export function num(
  controls: LivingMoveControls,
  id: string,
  fallback: number,
): number {
  const v = controls[id];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

// ───────────────────────────────────────────────────────────────────────────
// The composer
// ───────────────────────────────────────────────────────────────────────────

/**
 * Recompile a tenant's living Move for a given control setting. Generic over
 * the registry entry — the entry owns the (tenant-specific) kernel compile
 * path; this function shapes the three board-grade exhibit datasets off the
 * SAME recompiled skeleton, exactly as the board-grade pack-model shapes them,
 * so the static board pack and the living Move never diverge. Deterministic.
 */
export function buildLivingMoveCase(
  entry: LivingMoveCaseEntry,
  controls: LivingMoveControls,
): LivingMoveCase {
  const { skeleton, value } = entry.compile(controls);
  const seedGapFilled = controls[entry.seedGapControlId] !== null;

  // ── Board-grade exhibit datasets ────────────────────────────────────────

  // Investment waterfall — the delivery lanes that sum to the base total.
  // Workstreams are grouped into board-grade lanes by their canonical
  // workstream id, exactly as the pack-model does; empty lanes drop out.
  const ws = skeleton.effort.workstreams;
  const laneCost = (ids: string[]): number =>
    round2(
      ws.filter((w) => ids.includes(w.id)).reduce((s, w) => s + w.baseCost, 0),
    );
  const waterfall: LivingWaterfallStep[] = [
    { label: 'AI build + foundational', amount: laneCost(['ai_build', 'foundational']) },
    { label: 'Integration + data', amount: laneCost(['integration', 'data']) },
    { label: 'Data governance', amount: laneCost(['data_governance']) },
    { label: 'Change + adoption', amount: laneCost(['change_adoption']) },
    { label: 'Run (year 1)', amount: laneCost(['run']) },
  ].filter((lane) => lane.amount > 0);

  // Gross-to-net value bridge — each haircut factor as a downward step,
  // distributed by its discount contribution (faithful kernel decomposition).
  const grossValue = value.totalGrossValue.point;
  const netValue = value.totalNetValue.point;
  const totalDiscount = value.factors.reduce(
    (s, f) => s + f.discountContribution,
    0,
  );
  const lostValue = grossValue - netValue;
  const bridgeSteps: LivingBridgeStep[] = value.factors
    .slice()
    .sort((a, b) => b.discountContribution - a.discountContribution)
    .map((f) => ({
      label: HAIRCUT_FACTOR_LABEL[f.dimension],
      amount:
        totalDiscount > 0
          ? round2((f.discountContribution / totalDiscount) * lostValue)
          : 0,
    }));

  // Sensitivity tornado — the assumptions that move the case, proxy-tagged.
  const tornado: LivingTornadoBar[] = skeleton.assumptions.byImpact
    .filter((a) => a.sensitivityImpact !== 'low')
    .map((a) => ({
      label: a.statement.split(/[.—]/)[0].slice(0, 42).trim(),
      swing:
        a.sensitivityImpact === 'high'
          ? a.isSeedGapProxy
            ? 100
            : 78
          : 46,
      isProxy: a.isSeedGapProxy,
    }));

  return {
    skeleton,
    controls,
    grossValue,
    netValue,
    haircut: value.totalHaircut,
    waterfall,
    bridgeSteps,
    tornado,
    seedGapFilled,
    recommendation: skeleton.recommendation,
  };
}

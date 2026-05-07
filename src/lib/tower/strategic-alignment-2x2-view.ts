// TOWER · T-4 — Strategic alignment 2×2 view-model.
//
// Per the AI Initiatives Substrate Package v1.1.0 Wireframe Addendum
// (locked 2026-05-07): the Strategic Alignment 2×2 replaces invented names
// (JOULE, M365-CORE, AZURE-PROD, COPILOT-E5, NOW-ASSIST, etc.) with real
// initiative names from the ai_initiatives substrate.
//
// Quadrants (axis intent unchanged from existing wireframe):
//   - x axis: Realized portfolio value (left = low, right = high)
//   - y axis: Strategic alignment (bottom = low, top = high)
//
//   TL · High value · Low alignment · "rationalize"
//   TR · High value · High alignment · "the prize"
//   BL · Low value · Low alignment · "sunset candidates"
//   BR · Low value · High alignment · "watch closely"
//
// Strategic Bets row (separate, below 2×2):
//   stage = 'multi_year_strategic_bet' AND status_flag = 'foundation_phase'
//   AND measured_value_usd is null/0 → not yet earning, attribution loose.
//
// Until alignment_score and value_score land in the schema (per Load Path
// Manifest follow-up), quadrant placement is derived deterministically from
// existing fields:
//   - x (value): measured_value_usd > $1M → high; else low
//   - y (alignment): aligned_callout
//                  || (status_flag='healthy' AND stage='scaled')
//                  || status_flag='foundation_phase'
//                  → high; else low
//   - sunset override: status_flag in (duplication_risk, cost_overrun) → low alignment
//
// Pure deterministic helper. Same input → identical output. No DB, no model
// calls.

import type { AIInitiative } from '@/lib/admin/ai-initiatives/queries';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type AlignmentQuadrant = 'tl' | 'tr' | 'bl' | 'br';

export interface AlignmentDot {
  /** Display ID like "MH-04". */
  displayId: string;
  /** Initiative name. */
  name: string;
  /** Display dollar amount, formatted (e.g. "$2.6M"). */
  amount: string;
  /** True if this initiative is one of the tenant's two highest-strategic-value callouts. */
  alignedCallout: boolean;
  /** Confidence level for outline weight (solid HIGH · dashed MED · dotted LOW). */
  confidenceLevel: 'HIGH' | 'MED' | 'LOW';
  /** Quadrant placement. */
  quadrant: AlignmentQuadrant;
  /** Deterministic position within quadrant (0-100% of inner box). */
  positionLeft: string;
  positionTop: string;
}

export interface StrategicBet {
  displayId: string;
  name: string;
  stageDetail: string;
  amount: string;
  confidenceLevel: 'HIGH' | 'MED' | 'LOW';
}

export interface StrategicAlignment2x2View {
  /** Initiatives placed in 2×2 quadrants. */
  dots: ReadonlyArray<AlignmentDot>;
  /** Initiatives in the separate Strategic Bets row. */
  strategicBets: ReadonlyArray<StrategicBet>;
  /** Total count of initiatives plotted in 2×2 (for the "N programs plotted" header). */
  totalPlotted: number;
  /** Hint shown when the dataset is empty. */
  emptyHint: string | null;
  /** Always true; this is a pure deterministic view. */
  deterministicSeed: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const HIGH_VALUE_THRESHOLD_USD = 1_000_000;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatUsdShort(usd: number | null): string {
  if (usd === null || usd === undefined) return '—';
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

function isStrategicBet(initiative: AIInitiative): boolean {
  return (
    initiative.stage === 'multi_year_strategic_bet' &&
    initiative.statusFlag === 'foundation_phase' &&
    (initiative.measuredValueUsd === null || initiative.measuredValueUsd <= 0)
  );
}

function deriveQuadrant(initiative: AIInitiative): AlignmentQuadrant {
  const measured = initiative.measuredValueUsd ?? 0;
  const highValue = measured >= HIGH_VALUE_THRESHOLD_USD;

  // Sunset override: duplication_risk and cost_overrun force low alignment
  // even when the initiative is otherwise "aligned" by other heuristics.
  const forceLowAlignment =
    initiative.statusFlag === 'duplication_risk' || initiative.statusFlag === 'cost_overrun';

  let highAlignment = false;
  if (!forceLowAlignment) {
    if (initiative.alignedCallout) {
      highAlignment = true;
    } else if (initiative.statusFlag === 'healthy' && initiative.stage === 'scaled') {
      highAlignment = true;
    } else if (initiative.statusFlag === 'foundation_phase') {
      highAlignment = true;
    }
  }

  if (highValue && highAlignment) return 'tr';
  if (highValue && !highAlignment) return 'tl';
  if (!highValue && !highAlignment) return 'bl';
  return 'br';
}

/**
 * Deterministic position within a quadrant (0-100%) based on a string hash
 * of the displayId. Keeps dots from stacking on top of one another while
 * remaining stable across renders.
 */
function derivePositionWithinQuadrant(displayId: string): { left: string; top: string } {
  let hash = 0;
  for (let i = 0; i < displayId.length; i += 1) {
    hash = (hash * 31 + displayId.charCodeAt(i)) | 0;
  }
  // Spread across 18-62% to avoid quadrant edges, deterministic per displayId.
  const left = 18 + Math.abs(hash % 45);
  const top = 14 + Math.abs((hash >> 5) % 50);
  return { left: `${left}%`, top: `${top}%` };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the Strategic Alignment 2×2 view from a tenant's initiatives.
 * Returns an empty view (with hint) if no initiatives are provided.
 */
export function buildStrategicAlignment2x2View(
  initiatives: ReadonlyArray<AIInitiative>,
): StrategicAlignment2x2View {
  if (initiatives.length === 0) {
    return {
      dots: [],
      strategicBets: [],
      totalPlotted: 0,
      emptyHint:
        'Strategic alignment scoring pending — load initiatives via Setup → AI Initiatives.',
      deterministicSeed: true,
    };
  }

  const bets: StrategicBet[] = [];
  const dots: AlignmentDot[] = [];

  for (const initiative of initiatives) {
    if (isStrategicBet(initiative)) {
      bets.push({
        displayId: initiative.displayId,
        name: initiative.name,
        stageDetail: initiative.stageDetail ?? 'Multi-year strategic bet',
        amount: formatUsdShort(initiative.committedTotalUsd ?? initiative.committedAnnualUsd),
        confidenceLevel: initiative.confidenceLevel,
      });
      continue;
    }

    const quadrant = deriveQuadrant(initiative);
    const position = derivePositionWithinQuadrant(initiative.displayId);
    const displayDollars = formatUsdShort(
      initiative.committedTotalUsd ?? initiative.committedAnnualUsd,
    );

    dots.push({
      displayId: initiative.displayId,
      name: initiative.name,
      amount: displayDollars,
      alignedCallout: initiative.alignedCallout,
      confidenceLevel: initiative.confidenceLevel,
      quadrant,
      positionLeft: position.left,
      positionTop: position.top,
    });
  }

  return {
    dots,
    strategicBets: bets,
    totalPlotted: dots.length,
    emptyHint: null,
    deterministicSeed: true,
  };
}

/** Group dots by quadrant for rendering. */
export function dotsByQuadrant(
  view: StrategicAlignment2x2View,
): Record<AlignmentQuadrant, ReadonlyArray<AlignmentDot>> {
  const out: Record<AlignmentQuadrant, AlignmentDot[]> = { tl: [], tr: [], bl: [], br: [] };
  for (const dot of view.dots) {
    out[dot.quadrant].push(dot);
  }
  return out;
}

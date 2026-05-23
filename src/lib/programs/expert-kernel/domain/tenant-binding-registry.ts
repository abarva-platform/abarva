// Tenant-binding registry — the map of `(industryKey, functionKey)` to the
// audited tenant substrate + tenant-named copy the function-aware surfaces use.
//
// The function-aware Intelligence surfaces (`buildVbcDecisionHome`,
// `buildVbcBetSelection`) are GENERIC over the Domain Function Pack: the pack
// is the frame, an audited tenant substrate fills it. Some `(industry,
// function)` bindings carry curated tenant-named, audit-grounded content
// today — Meridian × VBC, Apex × customer care, First Capital × fraud — and
// the rest render as honest unseeded analyses.
//
// This registry is the single source of truth for those bindings. A new tenant
// binding is added in one place; the generic builders consult it without any
// further wiring. The registry is PURE — no I/O, no side effects, just data —
// so the generic builders stay deterministic and easy to test.
//
// HONESTY DISCIPLINE — registering a binding is registering that an audited
// substrate exists for it. The pack content is then bound to that tenant's
// real, named context. A binding NEVER fabricates a substrate; an `(industry,
// function)` that has no audited tenant data simply has no entry here, and the
// generic builders render its surface as the honest unseeded form.

import type { FunctionPack, FunctionPackIndustryKey } from './function-pack-types';
import type { TenantSubstrate } from './tenant-substrate';

// ─────────────────────────────────────────────────────────────────────────────
// Decision-home binding shape
// ─────────────────────────────────────────────────────────────────────────────

// Forward declarations so the registry module is import-cycle-safe.
// The concrete types live in `meridian-vbc-decision-home.ts` and are imported
// from there by every consumer of the registry — we only need the structural
// shapes here.
export interface DecisionHomeHeadlineShape {
  eyebrow: string;
  statement: string;
  honestyClause: string;
  cadenceAnchor: string;
}

export interface DecisionCardShape {
  key: string;
  urgency: 'decide_now' | 'this_cycle' | 'before_settlement';
  recommendedAction: string;
  stake: string;
  evidence: string;
  evidenceRestsOnSeedGap: boolean;
  gestureLabel: string;
  gestureHref: string;
}

export interface CadenceStageShape {
  key: string;
  label: string;
  demands: string;
  isCurrent: boolean;
}

export interface CadenceBlockShape {
  frameName: string;
  framing: string;
  stages: CadenceStageShape[];
  currentDemand: string;
}

/**
 * The grounded copy a decision-home binding ships — the headline, the
 * decision cards, and the cadence block, all in tenant-named operator
 * language. The vitals are derived from the substrate + pack and so are not
 * carried here; only the prose blocks that need tenant-named context are.
 */
export interface DecisionHomeGroundedBlocks {
  headline: DecisionHomeHeadlineShape;
  decisions: DecisionCardShape[];
  cadence: CadenceBlockShape;
}

/**
 * A tenant binding for the decision-home surface. The substrate grounds the
 * vitals; `buildBlocks` builds the headline / decisions / cadence in the
 * tenant's own operator language, grounded against the same substrate.
 */
export interface DecisionHomeBinding {
  readonly industryKey: FunctionPackIndustryKey;
  readonly functionKey: string;
  /** A short, stable name for tooling / logs — e.g. `'meridian-vbc'`. */
  readonly tenantBindingKey: string;
  /**
   * The canonical `ClientKey` (e.g. `'apexretail'`, `'meridian'`, `'arcturus'`)
   * the binding's audited substrate and grounded blocks belong to. The route
   * MUST only render this binding for the matching tenant; rendering it for a
   * different tenant in the same industry (e.g. Northwind in retail) would
   * leak Apex-named content into Northwind's analysis. The route compares
   * the active tenant's ClientKey against this and falls back to an honest
   * empty state when they don't match. Optional only for back-compat with
   * existing bindings; new bindings MUST set this.
   */
  readonly expectedClientKey?: string;
  readonly substrate: TenantSubstrate;
  /**
   * Build the grounded prose blocks. Called only when the binding's substrate
   * is non-empty (the binding is registered as grounded). The implementation
   * may reference the substrate, the pack, and the resolved tenant display
   * name to produce tenant-named operator copy.
   */
  buildBlocks(args: {
    pack: FunctionPack;
    tenantName: string;
    substrate: TenantSubstrate;
  }): DecisionHomeGroundedBlocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bet-selection binding shape
// ─────────────────────────────────────────────────────────────────────────────

export interface BetSelectionHeadlineShape {
  eyebrow: string;
  question: string;
  answer: string;
  rationale: string;
  honestyClause: string;
}

export interface RankingGateShape {
  key: string;
  title: string;
  description: string;
  whatItWouldMove: string;
}

/**
 * The grounded copy a bet-selection binding ships — the headline (which uses
 * the top-ranked bet as the answer) and the gates (the named, real seed gaps
 * that bound the ranking). The candidate bets themselves are derived from the
 * pack archetypes + substrate by the generic scorer, so are not carried here.
 */
export interface BetSelectionGroundedBlocks {
  headline: BetSelectionHeadlineShape;
  gates: RankingGateShape[];
}

/**
 * Context the binding can read when building its grounded blocks. The
 * `topBetName` and `bets`/`heldBets` counts let the headline name the
 * top-ranked bet directly without re-scoring inside the binding.
 */
export interface BetSelectionBindingContext {
  pack: FunctionPack;
  tenantName: string;
  substrate: TenantSubstrate;
  topBetName: string;
  topBetRead: 'fund_first' | 'shape' | 'hold_for_evidence';
  totalBets: number;
  heldBetCount: number;
}

/**
 * A tenant binding for the bet-selection surface. The substrate grounds the
 * scoring; `buildBlocks` builds the headline + gates in the tenant's own
 * operator language.
 */
export interface BetSelectionBinding {
  readonly industryKey: FunctionPackIndustryKey;
  readonly functionKey: string;
  /** A short, stable name for tooling / logs — e.g. `'apex-customer-care'`. */
  readonly tenantBindingKey: string;
  /**
   * The canonical `ClientKey` the binding's audited substrate belongs to.
   * See `DecisionHomeBinding.expectedClientKey` for the full rationale —
   * the route MUST only render this binding for the matching tenant.
   */
  readonly expectedClientKey?: string;
  readonly substrate: TenantSubstrate;
  buildBlocks(ctx: BetSelectionBindingContext): BetSelectionGroundedBlocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// The registries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decision-home tenant bindings, keyed by `${industryKey}::${functionKey}`.
 * Populated by `registerDecisionHomeBinding` — the tenant modules each call
 * this once at module load. Generic builders consult this map; an unknown
 * `(industry, function)` resolves to `null` and the generic builder takes the
 * honest unseeded path.
 */
const DECISION_HOME_BINDINGS = new Map<string, DecisionHomeBinding>();

/** Bet-selection tenant bindings, keyed by `${industryKey}::${functionKey}`. */
const BET_SELECTION_BINDINGS = new Map<string, BetSelectionBinding>();

function bindingKey(
  industryKey: FunctionPackIndustryKey,
  functionKey: string,
): string {
  return `${industryKey}::${functionKey}`;
}

/**
 * Register a decision-home tenant binding. Called once at module load by each
 * tenant module that ships audited substrate. Re-registering the same
 * `(industry, function)` REPLACES the prior binding — useful in tests, never
 * needed at runtime where each binding lives in exactly one module.
 */
export function registerDecisionHomeBinding(binding: DecisionHomeBinding): void {
  DECISION_HOME_BINDINGS.set(
    bindingKey(binding.industryKey, binding.functionKey),
    binding,
  );
}

/** Resolve the registered decision-home binding for an `(industry, function)`. */
export function resolveDecisionHomeBinding(
  industryKey: FunctionPackIndustryKey,
  functionKey: string,
): DecisionHomeBinding | null {
  return DECISION_HOME_BINDINGS.get(bindingKey(industryKey, functionKey)) ?? null;
}

/** Register a bet-selection tenant binding. */
export function registerBetSelectionBinding(binding: BetSelectionBinding): void {
  BET_SELECTION_BINDINGS.set(
    bindingKey(binding.industryKey, binding.functionKey),
    binding,
  );
}

/** Resolve the registered bet-selection binding for an `(industry, function)`. */
export function resolveBetSelectionBinding(
  industryKey: FunctionPackIndustryKey,
  functionKey: string,
): BetSelectionBinding | null {
  return BET_SELECTION_BINDINGS.get(bindingKey(industryKey, functionKey)) ?? null;
}

/**
 * List every catalogued decision-home binding — useful for coverage tests
 * that assert "every grounded binding has a real, named substrate".
 */
export function listDecisionHomeBindings(): DecisionHomeBinding[] {
  return [...DECISION_HOME_BINDINGS.values()];
}

/** List every catalogued bet-selection binding. */
export function listBetSelectionBindings(): BetSelectionBinding[] {
  return [...BET_SELECTION_BINDINGS.values()];
}

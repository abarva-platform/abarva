// Move-to-Source trigger · Wave 2, Slice 2.6.
//
// The connector that makes Source a natural execution lane downstream of a
// shaped Move. By the time a Move reaches this slice it carries:
//
//   - a mobilization plan (Slice 2.4) — the 30/60/90 plan, the squad, the
//     backlog, and the build/buy/orchestrate `deliveryLean` of the chosen
//     architecture option; and, optionally,
//   - a delivery-model signal from the Slice 1.2 delivery-model gate — the
//     build / buy / partner / SI verdict, with its confidence band.
//
// A principal sourcing advisor looks at a shaped Move and asks one question:
// does delivering this need an external partner or vendor, or can the squad
// build and run it in-house? When the answer is "yes, external", the Move
// should not improvise an RFP — it should hand Source a structured brief.
//
// This module is that decision. Given the shaped Move it decides whether the
// delivery model requires external partner / vendor selection, and if so
// produces a `SourceRecommendation`: what to source, the category hint, the
// scope carved out for the external lane, and the assumptions to carry.
//
// Why this exists: a shaped Move whose delivery model is "buy a product" or
// "hire a partner to run it" is, today, a dead end — the team re-derives the
// sourcing need from scratch in a disconnected Source module. This trigger
// makes the sourcing brief a *generated artifact* of the Move, not an
// improvised restart. Source becomes a natural execution lane.
//
// Pure module — no I/O, no database, no service calls, client- and
// server-safe. Deterministic: the same shaped Move always yields the same
// recommendation. The Moves origination / charter path and the Source intake
// path compose this; cross-module persistence (writing the recommendation as
// a Source event) is a deliberate separate follow-up and NOT in this file.
// This module ships no I/O, no React, no migration, and touches no shared
// file — it reads only its typed inputs.
//
// Methodology: docs/strategy/ABARVA_PRODUCT_ENHANCEMENT_EXECUTION_PLAN.md
// §1 (North-Star loop), Wave 2 Slice 2.6.

import type { DeliveryLean } from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import type { MobilizationPlan } from '@/lib/programs/mobilization/mobilization-plan';
import type {
  DeliveryModel,
  DeliveryModelConfidence,
} from '@/lib/source/delivery-model/delivery-model-gate';

// ─── Trigger vocabulary ────────────────────────────────────────────────────

/**
 * Whether a shaped Move needs an external Source lane at all.
 *
 *   - `sourcing_required` — the delivery model needs an external partner or
 *     vendor; a `SourceRecommendation` is produced.
 *   - `build_in_house`    — the squad builds and runs it; no Source lane.
 *   - `needs_decision`    — the delivery model is genuinely ambiguous (e.g. a
 *     `mixed` lean with no corroborating gate signal); the Move owner must
 *     resolve build-vs-source before a brief can be shaped.
 */
export type SourceTriggerDisposition =
  | 'sourcing_required'
  | 'build_in_house'
  | 'needs_decision';

/**
 * The kind of external engagement the Source lane should pursue. This is the
 * Move-side framing of the Slice 1.2 delivery model — it deliberately omits
 * `build` (a built Move never enters Source) and keeps the three external
 * shapes a sourcing advisor distinguishes between.
 */
export type SourcingEngagementKind =
  /** License a packaged commercial product / SaaS capability. */
  | 'product'
  /** Engage a vendor to operate the capability as a managed service. */
  | 'managed_service'
  /** Commission a systems integrator for a bespoke delivery. */
  | 'systems_integrator';

/** Human-readable label for each engagement kind. */
export const SOURCING_ENGAGEMENT_LABEL: Readonly<
  Record<SourcingEngagementKind, string>
> = {
  product: 'Commercial product / SaaS',
  managed_service: 'Vendor-operated managed service',
  systems_integrator: 'Systems-integrator engagement',
};

/**
 * How confident the trigger is that external sourcing is the right call.
 * Mirrors the delivery-model gate's band so confidence carries cleanly when a
 * gate signal is supplied, and degrades sensibly when it is not.
 */
export type SourceTriggerConfidence = DeliveryModelConfidence;

// ─── The Source recommendation ─────────────────────────────────────────────

/** One assumption the Source lane must carry forward from the Move. */
export interface SourcingAssumption {
  /** Stable id, unique within the recommendation, e.g. 'm2s-a1'. */
  id: string;
  /** The assumption, stated plainly. */
  assumption: string;
  /** Why it matters to the sourcing decision if it turns out false. */
  whyItMatters: string;
}

/**
 * The structured sourcing brief a shaped Move hands to Source. This is the
 * artifact that makes Source a natural downstream of Moves — it is generated,
 * not improvised, and it carries the Move's framing into the Source intake.
 */
export interface SourceRecommendation {
  /** The kind of external engagement Source should pursue. */
  engagementKind: SourcingEngagementKind;
  /** Human label for the engagement kind. */
  engagementKindLabel: string;
  /**
   * What to source — a one-line, sourcing-advisor-voice statement of the
   * capability the external lane must procure.
   */
  whatToSource: string;
  /**
   * The Source category hint — the lane Source's Slice 1.1 classifier should
   * start from. Best-effort; Source re-classifies, this only seeds intake.
   */
  categoryHint: string;
  /**
   * The scope carved out for the external lane — the slice of the Move's
   * backlog the partner / vendor delivers, stated as scope boundaries.
   */
  externalScope: readonly string[];
  /**
   * The scope the Move's own squad retains — accountability that never
   * leaves the tenant even when delivery is external.
   */
  retainedScope: readonly string[];
  /** The assumptions the Source lane carries forward from the Move. */
  assumptions: readonly SourcingAssumption[];
}

// ─── The trigger result ────────────────────────────────────────────────────

/** The full result of running the Move-to-Source trigger. */
export interface MoveToSourceTriggerResult {
  /** Whether the Move needs an external Source lane. */
  disposition: SourceTriggerDisposition;
  /** Confidence in the disposition. */
  confidence: SourceTriggerConfidence;
  /** The Move text the trigger reasoned over (echoed for traceability). */
  proposedMove: string;
  /** The mobilization plan's build/buy/orchestrate delivery lean. */
  deliveryLean: DeliveryLean;
  /**
   * The Slice 1.2 delivery model, when a gate signal was supplied — `null`
   * when the trigger decided on the mobilization lean alone.
   */
  deliveryModel: DeliveryModel | null;
  /** The reasoning behind the disposition — auditable, not a black box. */
  reasoning: readonly string[];
  /**
   * The Source recommendation — present only when `disposition` is
   * `sourcing_required`; `null` otherwise.
   */
  recommendation: SourceRecommendation | null;
  triggerVersion: 'move-to-source-trigger/v1';
}

/**
 * Optional delivery-model signal from the Slice 1.2 gate. The trigger works
 * without it (deciding on the mobilization plan's `deliveryLean` alone), but
 * a gate signal sharpens the engagement kind and carries confidence cleanly.
 */
export interface DeliveryModelSignal {
  /** The delivery model the Slice 1.2 gate recommended. */
  recommendedModel: DeliveryModel;
  /** The gate's confidence in that model. */
  confidence: DeliveryModelConfidence;
}

/** Input to the trigger — a shaped Move and an optional gate signal. */
export interface MoveToSourceTriggerInput {
  /** The Slice 2.4 mobilization plan for the shaped Move. */
  mobilizationPlan: MobilizationPlan;
  /**
   * The Slice 1.2 delivery-model gate signal, when one was run for this Move.
   * Optional — the trigger degrades gracefully without it.
   */
  deliveryModelSignal?: DeliveryModelSignal;
}

// ─── Internal helpers ──────────────────────────────────────────────────────

/** Stable per-recommendation assumption id. */
function assumptionId(index: number): string {
  return `m2s-a${index + 1}`;
}

/**
 * Map a Slice 1.2 delivery model to the Move-side engagement kind. `build`
 * has no external engagement — callers must not reach this with `build`.
 */
const MODEL_TO_ENGAGEMENT: Readonly<
  Record<Exclude<DeliveryModel, 'build'>, SourcingEngagementKind>
> = {
  buy: 'product',
  partner: 'managed_service',
  si: 'systems_integrator',
};

/**
 * Map the mobilization plan's `deliveryLean` to an engagement kind when no
 * gate signal is available. `orchestrate` — wiring existing tools together —
 * leans to a product buy; `mixed` is resolved upstream as `needs_decision`
 * and never reaches here. `build` has no external engagement.
 */
const LEAN_TO_ENGAGEMENT: Readonly<
  Record<Exclude<DeliveryLean, 'build' | 'mixed'>, SourcingEngagementKind>
> = {
  buy: 'product',
  orchestrate: 'product',
};

/** Whether a delivery lean, on its own, calls for an external Source lane. */
function leanNeedsSourcing(lean: DeliveryLean): boolean {
  return lean === 'buy' || lean === 'orchestrate';
}

/** Whether a delivery model, on its own, calls for an external Source lane. */
function modelNeedsSourcing(model: DeliveryModel): boolean {
  return model !== 'build';
}

/**
 * Carve the external scope out of the Move's mobilization backlog. The squad
 * always retains accountability, controls, evals, and the change story; the
 * external lane takes the build backlog and the integration work.
 */
function carveScope(plan: MobilizationPlan): {
  externalScope: string[];
  retainedScope: string[];
} {
  const externalScope: string[] = [];
  const retainedScope: string[] = [];

  // The build backlog is what an external partner / vendor delivers.
  if (plan.backlog.length > 0) {
    externalScope.push(
      `Deliver the ${plan.backlog.length} backlog epic(s) shaped for this Move: ${plan.backlog
        .map((e) => e.title)
        .join('; ')}.`,
    );
  } else {
    externalScope.push(
      'Deliver the capability the Move shapes — the build backlog is still being decomposed and must be attached to the sourcing brief before an award.',
    );
  }

  // Integration work the architecture requires is in the external lane.
  const integrationItems = plan.items.filter(
    (i) => i.workstream === 'integration',
  );
  if (integrationItems.length > 0) {
    externalScope.push(
      'Complete the integration work to the tenant systems of record named in the mobilization plan.',
    );
  }

  // Data / grounding remediation is delivery work the lane can carry.
  const dataItems = plan.items.filter((i) => i.workstream === 'data');
  if (dataItems.length > 0) {
    externalScope.push(
      'Stand up the data / grounding connections the Move depends on, to the broker boundary.',
    );
  }

  // The squad never gives up accountability, controls, evals, or change.
  const accountableOwner = plan.squad.find((r) => r.accountable);
  retainedScope.push(
    accountableOwner
      ? `Accountability for the Move stays with the named ${accountableOwner.title} — it is never sourced out.`
      : 'Accountability for the Move stays inside the tenant — it is never sourced out.',
  );
  retainedScope.push(
    'Controls, the §5 readiness gates, and the eval corpus stay tenant-owned — an external lane delivers against them, it does not own them.',
  );
  retainedScope.push(
    'The change / adoption story and the human fallback path stay with the tenant squad.',
  );

  return { externalScope, retainedScope };
}

/** Build the assumptions the Source lane carries forward from the Move. */
function buildAssumptions(
  plan: MobilizationPlan,
  signal: DeliveryModelSignal | undefined,
): SourcingAssumption[] {
  const assumptions: SourcingAssumption[] = [];

  assumptions.push({
    id: assumptionId(assumptions.length),
    assumption: `The Move is shaped around the ${plan.archetypeName} archetype — the sourcing brief assumes that solution shape.`,
    whyItMatters:
      'If the archetype is wrong the wrong category of vendor is sourced; Source must re-validate the shape before issuing an RFP.',
  });

  assumptions.push({
    id: assumptionId(assumptions.length),
    assumption: `The mobilization plan schedules the pilot at ${plan.pilotHorizon.replace('day_', 'day ')} — the external lane must deliver to that timeline.`,
    whyItMatters:
      'A vendor that cannot meet the pilot horizon breaks the Move plan; the timeline is a hard constraint in the sourcing brief, not a preference.',
  });

  if (plan.pilotGatingItems.length > 0) {
    assumptions.push({
      id: assumptionId(assumptions.length),
      assumption: `${plan.pilotGatingItems.length} pilot-gating item(s) must be green before the Move's pilot — the external lane inherits any of these inside its scope.`,
      whyItMatters:
        'A vendor unaware of the gating controls will descope them; the brief must make the gating set explicit and contractually binding.',
    });
  }

  if (!plan.readyForTightPath) {
    assumptions.push({
      id: assumptionId(assumptions.length),
      assumption:
        'The Move is not on the tight path — open readiness gaps or uncovered §5 gates remain, so the sourcing brief carries unresolved delivery risk.',
      whyItMatters:
        'Sourcing against an un-hardened Move transfers that risk to the vendor relationship; Source should price and contract for it explicitly.',
    });
  }

  if (signal && signal.confidence === 'low') {
    assumptions.push({
      id: assumptionId(assumptions.length),
      assumption:
        'The Slice 1.2 delivery-model gate decided on thin signals — the build-vs-source call itself is low-confidence.',
      whyItMatters:
        'Source should confirm the delivery model holds before committing spend; a low-confidence gate is a re-check, not a verdict.',
    });
  }

  return assumptions;
}

/** Compose the `whatToSource` line for the recommendation. */
function whatToSourceLine(
  plan: MobilizationPlan,
  kind: SourcingEngagementKind,
): string {
  const verb =
    kind === 'product'
      ? 'a commercial product that delivers'
      : kind === 'managed_service'
        ? 'a vendor to operate'
        : 'a systems integrator to build';
  return `Source ${verb} the ${plan.archetypeName.toLowerCase()} capability the Move "${plan.proposedMove}" requires.`;
}

/** Compose a Source category hint from the engagement kind and the Move. */
function categoryHintFor(kind: SourcingEngagementKind): string {
  switch (kind) {
    case 'product':
      return 'Data & AI platform / packaged product — confirm against the Source Slice 1.1 classifier.';
    case 'managed_service':
      return 'Managed service / BPO — a vendor-operated run; confirm against the Source Slice 1.1 classifier.';
    case 'systems_integrator':
      return 'AI engineering partner / SI delivery — confirm against the Source Slice 1.1 classifier.';
  }
}

// ─── Entry point ───────────────────────────────────────────────────────────

/**
 * Run the Move-to-Source trigger for a shaped Move.
 *
 * The single entry point the Moves and Source paths compose. Pure and
 * deterministic: the same shaped Move (and optional gate signal) always
 * yields the same result.
 *
 * Decision order:
 *   1. A `build` delivery model or `build` lean ⇒ `build_in_house`, no brief.
 *   2. A `mixed` lean with no corroborating gate signal ⇒ `needs_decision`.
 *   3. An external delivery model, or a buy / orchestrate lean ⇒
 *      `sourcing_required`, with a generated `SourceRecommendation`.
 *
 * The gate signal, when present, takes precedence over the mobilization lean
 * — it is the more deliberate build/buy/partner/SI verdict.
 */
export function runMoveToSourceTrigger(
  input: MoveToSourceTriggerInput,
): MoveToSourceTriggerResult {
  const { mobilizationPlan: plan, deliveryModelSignal: signal } = input;
  const reasoning: string[] = [];
  const lean = plan.deliveryLean;

  reasoning.push(
    `The Move "${plan.proposedMove}" is shaped with a ${lean} delivery lean from its mobilization plan's recommended architecture option.`,
  );

  // ── 1. The gate signal, when supplied, is the authoritative verdict. ─────
  if (signal) {
    reasoning.push(
      `The Slice 1.2 delivery-model gate recommends "${signal.recommendedModel}" at ${signal.confidence} confidence — taken as the authoritative build-vs-source verdict.`,
    );

    if (!modelNeedsSourcing(signal.recommendedModel)) {
      reasoning.push(
        'The gate verdict is build — the squad delivers this in-house; no Source lane is opened.',
      );
      return {
        disposition: 'build_in_house',
        confidence: signal.confidence,
        proposedMove: plan.proposedMove,
        deliveryLean: lean,
        deliveryModel: signal.recommendedModel,
        reasoning,
        recommendation: null,
        triggerVersion: 'move-to-source-trigger/v1',
      };
    }

    const kind =
      MODEL_TO_ENGAGEMENT[
        signal.recommendedModel as Exclude<DeliveryModel, 'build'>
      ];
    reasoning.push(
      `The gate verdict is external — Source should pursue a ${SOURCING_ENGAGEMENT_LABEL[kind].toLowerCase()}.`,
    );
    return {
      disposition: 'sourcing_required',
      confidence: signal.confidence,
      proposedMove: plan.proposedMove,
      deliveryLean: lean,
      deliveryModel: signal.recommendedModel,
      reasoning,
      recommendation: buildRecommendation(plan, kind, signal),
      triggerVersion: 'move-to-source-trigger/v1',
    };
  }

  // ── 2. No gate signal — decide on the mobilization lean alone. ───────────
  reasoning.push(
    'No Slice 1.2 delivery-model gate signal was supplied — the trigger decides on the mobilization plan delivery lean alone.',
  );

  if (lean === 'build') {
    reasoning.push(
      'The delivery lean is build — the squad delivers this in-house; no Source lane is opened.',
    );
    return {
      disposition: 'build_in_house',
      confidence: 'medium',
      proposedMove: plan.proposedMove,
      deliveryLean: lean,
      deliveryModel: null,
      reasoning,
      recommendation: null,
      triggerVersion: 'move-to-source-trigger/v1',
    };
  }

  if (lean === 'mixed') {
    reasoning.push(
      'The delivery lean is mixed and no gate signal corroborates a build-vs-source split — the Move owner must resolve the delivery model before a sourcing brief can be shaped.',
    );
    return {
      disposition: 'needs_decision',
      confidence: 'low',
      proposedMove: plan.proposedMove,
      deliveryLean: lean,
      deliveryModel: null,
      reasoning,
      recommendation: null,
      triggerVersion: 'move-to-source-trigger/v1',
    };
  }

  // lean is 'buy' or 'orchestrate' here.
  if (leanNeedsSourcing(lean)) {
    const kind = LEAN_TO_ENGAGEMENT[lean as Exclude<DeliveryLean, 'build' | 'mixed'>];
    reasoning.push(
      `The delivery lean is ${lean} — delivery needs an external lane; Source should pursue a ${SOURCING_ENGAGEMENT_LABEL[kind].toLowerCase()}. Confidence is medium absent a gate signal.`,
    );
    return {
      disposition: 'sourcing_required',
      confidence: 'medium',
      proposedMove: plan.proposedMove,
      deliveryLean: lean,
      deliveryModel: null,
      reasoning,
      recommendation: buildRecommendation(plan, kind, undefined),
      triggerVersion: 'move-to-source-trigger/v1',
    };
  }

  // Unreachable — every DeliveryLean is handled above. Fail closed to a
  // decision rather than silently emitting an unfounded brief.
  reasoning.push(
    'The delivery lean did not resolve to a known disposition — failing closed to needs_decision.',
  );
  return {
    disposition: 'needs_decision',
    confidence: 'low',
    proposedMove: plan.proposedMove,
    deliveryLean: lean,
    deliveryModel: null,
    reasoning,
    recommendation: null,
    triggerVersion: 'move-to-source-trigger/v1',
  };
}

/** Compose the full Source recommendation for a sourcing-required Move. */
function buildRecommendation(
  plan: MobilizationPlan,
  kind: SourcingEngagementKind,
  signal: DeliveryModelSignal | undefined,
): SourceRecommendation {
  const { externalScope, retainedScope } = carveScope(plan);
  return {
    engagementKind: kind,
    engagementKindLabel: SOURCING_ENGAGEMENT_LABEL[kind],
    whatToSource: whatToSourceLine(plan, kind),
    categoryHint: categoryHintFor(kind),
    externalScope,
    retainedScope,
    assumptions: buildAssumptions(plan, signal),
  };
}

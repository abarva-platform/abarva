// Source — Build / Buy / Partner / SI Delivery-Model Gate (Slice 1.2)
//
// A structured decision gate that forces an explicit delivery-model choice
// BEFORE an RFP package is generated. It sits one step after the Slice 1.1
// category classifier: the classifier answers "what category and motion is
// this"; the gate answers "should we build it, buy a product, hire a partner
// to run it, or commission an SI to deliver it" — and refuses to let an RFP
// be shaped until that question has an evidence-grounded answer.
//
// Given a `CategoryClassification` plus tenant-context delivery signals
// (existing `it_landscape`, internal capability, `vendor_contracts`), it
// produces:
//
//   - the recommended delivery model + a confidence band;
//   - the reasoning, stated as a senior sourcing advisor would;
//   - the disqualified options + why each was ruled out;
//   - the open questions to answer before the RFP package proceeds;
//   - a `gateStatus` — whether the gate is cleared, or blocked pending
//     answers / evidence.
//
// Expert value: stops premature vendor selection (jumping to an RFP before
// the build/buy/partner call is made) and over-scoped SI packages (a
// monolithic SI RFP when the real need is a product buy or a thin partner).
//
// This module is a PURE function: no I/O, no database, no service calls. It
// reads only its inputs and the static taxonomy via the classification it is
// handed. Safe for both the Vercel/Supabase and Azure Postgres data paths.
//
// Deferred (per the execution plan): the should-cost / role-mix model is
// Slice 1.3. This gate intentionally stops at the delivery-model decision.

import type {
  BuyingMotion,
  CategoryClassification,
} from '../classifier/category-classifier';
import type {
  SourceCategoryId,
  TenantContextSegment,
} from '../taxonomy/category-taxonomy';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * The four delivery models the gate decides between. This is the *how do we
 * deliver the capability* decision — distinct from the category (the *what*)
 * and the buying motion (the *how we go to market*).
 */
export type DeliveryModel =
  | 'build' // Insource — internal engineering owns and delivers it.
  | 'buy' // Commercial product / SaaS — license a packaged capability.
  | 'partner' // A vendor runs / operates the capability as a service.
  | 'si'; // A systems integrator delivers a bespoke engagement.

/** Whether the gate permits an RFP package to proceed. */
export type DeliveryModelGateStatus =
  | 'cleared' // The model is decided and evidence-backed — RFP may proceed.
  | 'blocked_open_questions' // A recommendation exists but questions remain.
  | 'blocked_insufficient_evidence'; // Delivery signals too thin to decide.

/** Confidence band for the recommended model. */
export type DeliveryModelConfidence = 'low' | 'medium' | 'high';

/**
 * Tenant-context delivery signals the gate reasons over. Every field is
 * optional — the gate degrades gracefully, lowers confidence, and raises
 * open questions when given less. Callers derive these from the live tenant
 * context snapshot before invoking.
 */
export interface DeliveryModelSignals {
  /**
   * Does the tenant already own a platform / product that materially covers
   * this category? Drawn from `it_landscape`. `undefined` = unknown.
   */
  ownsCoveringCapability?: boolean;
  /**
   * Internal engineering capability to build & run this category, as a
   * coarse band. `undefined` = unknown. 'none' favours buy/partner/SI;
   * 'strong' keeps build viable.
   */
  internalCapability?: 'none' | 'partial' | 'strong';
  /**
   * Is the capability a core differentiator the tenant should own, or
   * undifferentiated commodity? Core favours build; commodity favours buy.
   */
  isCoreDifferentiator?: boolean;
  /**
   * Does an incumbent vendor contract already cover this scope? Drawn from
   * `vendor_contracts`. When true the gate flags renegotiate-before-source.
   */
  hasIncumbentContract?: boolean;
  /**
   * Is the work a one-off bespoke delivery (favours SI) or a durable
   * steady-state run (favours partner / buy)?
   */
  workShape?: 'one_off_delivery' | 'steady_state_run';
  /**
   * Tenant context segments actually loaded — used to detect whether the
   * gate has the evidence it needs to decide at all.
   */
  loadedSegments?: readonly TenantContextSegment[];
}

/** A delivery model the gate ruled out, with the reason. */
export interface DisqualifiedDeliveryModel {
  model: DeliveryModel;
  /** Why this model was ruled out, stated plainly. */
  reason: string;
}

/** An open question that must be answered before the RFP package proceeds. */
export interface DeliveryModelOpenQuestion {
  /** Stable id, unique within the result, e.g. 'dmg-q1'. */
  id: string;
  /** The question, phrased as a senior sourcing advisor would ask it. */
  question: string;
  /**
   * Why it blocks: the risk of generating an RFP package without the answer.
   */
  whyItBlocks: string;
}

/** The full result of running the delivery-model gate. */
export interface DeliveryModelGateResult {
  /** The recommended delivery model. */
  recommendedModel: DeliveryModel;
  /** Human label for the recommended model. */
  recommendedModelLabel: string;
  /** Whether the gate clears the RFP package to proceed. */
  gateStatus: DeliveryModelGateStatus;
  /** Confidence in the recommendation. */
  confidence: DeliveryModelConfidence;
  /** The reasoning behind the recommendation — auditable, not a black box. */
  reasoning: readonly string[];
  /** The models ruled out, each with its disqualifying reason. */
  disqualifiedModels: readonly DisqualifiedDeliveryModel[];
  /** Questions to answer before the RFP package proceeds. */
  openQuestions: readonly DeliveryModelOpenQuestion[];
  /** The category id the decision was made for (echoed for traceability). */
  categoryId: SourceCategoryId;
  /** The buying motion the decision was made under. */
  buyingMotion: BuyingMotion;
  gateVersion: 'source-delivery-model-gate/v1';
}

// ---------------------------------------------------------------------------
// Category → delivery-model priors
// ---------------------------------------------------------------------------

const DELIVERY_MODEL_LABEL: Readonly<Record<DeliveryModel, string>> = {
  build: 'Build (insource)',
  buy: 'Buy (commercial product / SaaS)',
  partner: 'Partner (vendor-operated service)',
  si: 'SI (systems-integrator engagement)',
};

/**
 * The delivery model each category leans toward absent contradicting signals.
 * This is a prior, not a verdict — tenant signals routinely override it.
 */
const CATEGORY_DEFAULT_MODEL: Readonly<Record<SourceCategoryId, DeliveryModel>> = {
  ams: 'partner', // Run/maintain is a vendor-operated service.
  data_ai_platform: 'buy', // Platforms are licensed products, not built.
  ai_engineering_partner: 'si', // Bespoke AI build is an SI engagement.
  saas_renewal: 'buy', // Already a bought product — renewal stays buy.
  cloud_finops: 'buy', // Cloud capacity is a bought commitment.
  bpo_contact_centre: 'partner', // Process operation is a vendor-run service.
  bpo_shared_services: 'partner', // Transaction-processing operation is a vendor-run service.
  cyber_grc: 'buy', // Security tooling is predominantly a product buy.
  staff_aug_vs_managed_service: 'partner', // Managed-service outcome ownership.
};

/**
 * Models that are structurally not credible for a category — they are always
 * disqualified regardless of tenant signals, with a category-specific reason.
 */
const STRUCTURALLY_EXCLUDED: Readonly<
  Partial<Record<SourceCategoryId, Partial<Record<DeliveryModel, string>>>>
> = {
  saas_renewal: {
    build: 'This is a renewal of an already-bought product — building a replacement is a separate strategic decision, not a renewal motion.',
    si: 'A renewal does not need a bespoke SI delivery; it needs a renegotiation posture.',
  },
  cloud_finops: {
    build: 'Cloud capacity cannot be insourced as a build; the decision is the commitment structure, not a build.',
    si: 'An SI engagement does not address a cloud commercial-terms decision.',
  },
};

// ---------------------------------------------------------------------------
// The gate
// ---------------------------------------------------------------------------

/**
 * Run the build / buy / partner / SI delivery-model gate.
 *
 * Pure function — identical inputs always yield identical output. The result
 * is fully auditable: `reasoning` records every signal that contributed and
 * `disqualifiedModels` records why each alternative was ruled out.
 *
 * @param classification The Slice 1.1 category classification of the event.
 * @param signals        Tenant-context delivery signals (capability, landscape,
 *                       incumbent contracts). All fields optional.
 */
export function runDeliveryModelGate(
  classification: CategoryClassification,
  signals: DeliveryModelSignals = {},
): DeliveryModelGateResult {
  const categoryId = classification.categoryId;
  const buyingMotion = classification.buyingMotion;
  const reasoning: string[] = [];
  const openQuestions: DeliveryModelOpenQuestion[] = [];

  // 1. Start from the category prior.
  let recommendedModel: DeliveryModel = CATEGORY_DEFAULT_MODEL[categoryId];
  reasoning.push(
    `Category '${classification.category.label}' leans toward ${DELIVERY_MODEL_LABEL[recommendedModel]} as its default delivery model.`,
  );

  // 2. Core-differentiator + internal capability can push toward build.
  if (signals.isCoreDifferentiator === true) {
    if (signals.internalCapability === 'strong') {
      recommendedModel = 'build';
      reasoning.push(
        'The capability is a core differentiator and internal engineering capability is strong — owning the build keeps the differentiating IP in-house.',
      );
    } else {
      reasoning.push(
        'The capability is flagged a core differentiator, but internal capability is not strong enough to own the build outright — keeping a delivery partner in the loop.',
      );
    }
  } else if (signals.isCoreDifferentiator === false) {
    reasoning.push(
      'The capability is undifferentiated commodity — building it would burn scarce engineering on a non-differentiator.',
    );
    if (recommendedModel === 'build') recommendedModel = 'buy';
  }

  // 3. Owning a covering capability collapses the decision toward
  //    rationalize-first — surfaced as a hard open question.
  if (signals.ownsCoveringCapability === true) {
    reasoning.push(
      'The tenant already owns a capability that materially covers this scope — sourcing anything new must clear an overlap / rationalization check first.',
    );
    openQuestions.push({
      id: nextQuestionId(openQuestions),
      question:
        'An owned capability already covers part of this scope — does rationalizing or extending it remove the need to source at all?',
      whyItBlocks:
        'Generating an RFP package over scope an owned tool already covers locks in 20–40% redundant spend the overlap assessment would have caught.',
    });
  }

  // 4. An incumbent contract means renegotiate-before-source.
  if (signals.hasIncumbentContract === true) {
    reasoning.push(
      'An incumbent vendor contract already covers this scope — the gate keeps that contract in play as the renegotiation baseline.',
    );
    openQuestions.push({
      id: nextQuestionId(openQuestions),
      question:
        'An incumbent contract covers this scope — is the goal a competitive replacement, or a renegotiation of the incumbent before going to market?',
      whyItBlocks:
        'An RFP package issued without resolving incumbent intent signals a switch the tenant may not want, and burns the renegotiation leverage of an unannounced market test.',
    });
  }

  // 5. Work shape arbitrates partner vs SI.
  if (signals.workShape === 'one_off_delivery' && recommendedModel === 'partner') {
    recommendedModel = 'si';
    reasoning.push(
      'The work is a one-off bespoke delivery, not a steady-state run — an SI engagement fits better than an ongoing operated-service partner.',
    );
  } else if (signals.workShape === 'steady_state_run' && recommendedModel === 'si') {
    recommendedModel = 'partner';
    reasoning.push(
      'The work is a durable steady-state run, not a one-off delivery — a vendor-operated partner with outcome accountability fits better than a bespoke SI engagement.',
    );
  }

  // 6. No internal capability rules out build entirely.
  if (signals.internalCapability === 'none' && recommendedModel === 'build') {
    recommendedModel = categoryId === 'ai_engineering_partner' ? 'si' : 'buy';
    reasoning.push(
      'Internal capability to build and run this is absent — build is not a credible model; falling back to an externally delivered model.',
    );
  }

  // 7. Build the disqualified-options list with reasons.
  const disqualifiedModels = deriveDisqualified(
    recommendedModel,
    categoryId,
    buyingMotion,
    signals,
  );

  // 8. Carry the classifier's evidence gaps through as open questions — the
  //    gate cannot clear an RFP package while required evidence is unmet.
  for (const gap of classification.evidenceGaps) {
    openQuestions.push({
      id: nextQuestionId(openQuestions),
      question: `Required evidence from '${gap.segment}' is not loaded — ${gap.whatItProves}`,
      whyItBlocks:
        'The delivery-model decision rests on this evidence; an RFP package shaped without it commits the tenant on an unverified basis.',
    });
  }

  // 9. Default-driven decisions on thin signals get a confirmation question.
  if (!hasAnyDecisionSignal(signals)) {
    openQuestions.push({
      id: nextQuestionId(openQuestions),
      question: `Confirm the delivery model: should '${classification.category.label}' be delivered as ${DELIVERY_MODEL_LABEL[recommendedModel]}, or do build / buy / partner / SI need an explicit comparison first?`,
      whyItBlocks:
        'No build/buy/partner signals were supplied, so the recommendation is the category default — proceeding to an RFP package without confirming it risks the wrong delivery model.',
    });
  }

  // 10. Gate status + confidence.
  const evidenceThin =
    Array.isArray(signals.loadedSegments) && signals.loadedSegments.length === 0;
  const gateStatus = deriveGateStatus(openQuestions.length, evidenceThin, signals);
  const confidence = deriveConfidence(signals, openQuestions.length);

  return {
    recommendedModel,
    recommendedModelLabel: DELIVERY_MODEL_LABEL[recommendedModel],
    gateStatus,
    confidence,
    reasoning,
    disqualifiedModels,
    openQuestions,
    categoryId,
    buyingMotion,
    gateVersion: 'source-delivery-model-gate/v1',
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const ALL_MODELS: readonly DeliveryModel[] = ['build', 'buy', 'partner', 'si'];

function nextQuestionId(existing: readonly DeliveryModelOpenQuestion[]): string {
  return `dmg-q${existing.length + 1}`;
}

function hasAnyDecisionSignal(signals: DeliveryModelSignals): boolean {
  return (
    signals.ownsCoveringCapability !== undefined ||
    signals.internalCapability !== undefined ||
    signals.isCoreDifferentiator !== undefined ||
    signals.hasIncumbentContract !== undefined ||
    signals.workShape !== undefined
  );
}

function deriveDisqualified(
  recommended: DeliveryModel,
  categoryId: SourceCategoryId,
  buyingMotion: BuyingMotion,
  signals: DeliveryModelSignals,
): DisqualifiedDeliveryModel[] {
  const out: DisqualifiedDeliveryModel[] = [];
  const structural = STRUCTURALLY_EXCLUDED[categoryId] ?? {};

  for (const model of ALL_MODELS) {
    if (model === recommended) continue;

    // Structural exclusions take precedence — they hold regardless of signal.
    const structuralReason = structural[model];
    if (structuralReason) {
      out.push({ model, reason: structuralReason });
      continue;
    }

    // Signal-driven exclusions.
    if (model === 'build') {
      if (signals.internalCapability === 'none') {
        out.push({
          model,
          reason:
            'Internal engineering capability is absent — building and running this in-house is not credible.',
        });
        continue;
      }
      if (signals.isCoreDifferentiator === false) {
        out.push({
          model,
          reason:
            'The capability is undifferentiated commodity — building it spends scarce engineering on a non-differentiator.',
        });
        continue;
      }
    }

    if (
      model === 'si' &&
      signals.workShape === 'steady_state_run' &&
      recommended !== 'si'
    ) {
      out.push({
        model,
        reason:
          'The work is a durable steady-state run — a bespoke SI engagement leaves no accountable operator once delivery ends.',
      });
      continue;
    }

    if (
      model === 'partner' &&
      signals.workShape === 'one_off_delivery' &&
      recommended !== 'partner'
    ) {
      out.push({
        model,
        reason:
          'The work is a one-off bespoke delivery — an ongoing operated-service partner over-scopes a finite engagement.',
      });
      continue;
    }

    // A renewal motion disqualifies everything except a buy.
    if (buyingMotion === 'renewal_renegotiation' && model !== 'buy' && recommended === 'buy') {
      out.push({
        model,
        reason:
          'The buying motion is a renewal/renegotiation of an existing product — only a buy model is consistent with it.',
      });
      continue;
    }

    // Generic non-recommended note so every alternative is accounted for.
    out.push({
      model,
      reason: `Not the strongest fit for this category and signal set; ${DELIVERY_MODEL_LABEL[recommended]} carries the decision unless a new signal changes the picture.`,
    });
  }

  return out;
}

function deriveGateStatus(
  openQuestionCount: number,
  evidenceThin: boolean,
  signals: DeliveryModelSignals,
): DeliveryModelGateStatus {
  if (evidenceThin && !hasAnyDecisionSignal(signals)) {
    return 'blocked_insufficient_evidence';
  }
  if (openQuestionCount > 0) return 'blocked_open_questions';
  return 'cleared';
}

function deriveConfidence(
  signals: DeliveryModelSignals,
  openQuestionCount: number,
): DeliveryModelConfidence {
  const signalCount = [
    signals.ownsCoveringCapability,
    signals.internalCapability,
    signals.isCoreDifferentiator,
    signals.hasIncumbentContract,
    signals.workShape,
  ].filter((s) => s !== undefined).length;

  if (signalCount === 0) return 'low';
  if (signalCount >= 3 && openQuestionCount === 0) return 'high';
  if (signalCount >= 2) return 'medium';
  return 'low';
}

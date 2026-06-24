// ExpertPack v2 — the unit of a Virtual Industry Expert.
//
// W0 keystone (docs/build/SHARED_CONTEXT_BRAIN_BUILD_PLAN.md). One ExpertPack
// = one virtual expert the dimensional router can summon. To stand up hundreds
// of experts we promote the existing scattered domain depth into a single
// first-class, addressable, retrievable unit.
//
// DESIGN PRINCIPLE — compose, don't rebuild. The existing `FunctionPack`
// (expert-kernel/domain/function-pack-types.ts) already encodes 8 deep layers
// with a depth bar (operating metrics + benchmarks, pain/failure modes, AI
// use-case archetypes, reference solutions, value model, vocabulary/ontology,
// deliverable outlines, evidence anchors). ExpertPack v2 REUSES those layer
// types and adds the five layers the audit found missing everywhere:
// diagnostics, sourcing, evidence rules, hedge rules (confident-synthesis),
// and output recipes — plus identity (so cross-cutting experts that have no
// industry×function key are still addressable) and provenance.

import type { CanonicalIndustry } from "@/lib/intelligence/canonical/industry-ai-pattern";
import type {
  OperatingMetric,
  PainTheme,
  AiUseCaseArchetype,
  ReferenceSolutionPattern,
  ValueModel,
  VocabularyAndEntities,
  EvidenceAnchor,
  RegulatoryFrame,
} from "@/lib/programs/expert-kernel/domain/function-pack-types";
import type { AnswerChartKind, AvaConfidence } from "@/lib/ava-answer/contract";

/**
 * Two kinds of expert. Industry×function experts (e.g. "Healthcare Revenue
 * Cycle") carry an industry + function key. Cross-cutting experts (e.g. "AI
 * Governance", "IT Sourcing — ERP") span industries and carry a domain key.
 */
export type ExpertKind = "industry-function" | "cross-cutting-domain";

export interface ExpertPackIdentity {
  /** Stable id, e.g. "xp.healthcare.revenue-cycle" or "xp.x.ai-governance". */
  id: string;
  /** Human label, e.g. "Healthcare Revenue Cycle Expert". */
  expertName: string;
  kind: ExpertKind;
  /** Present for industry-function experts. */
  industry?: CanonicalIndustry;
  /** Present for industry-function experts (function pack key). */
  functionKey?: string;
  /** Present for cross-cutting experts, e.g. "ai-governance" | "it-sourcing". */
  crossCuttingDomain?: string;
  /** One-paragraph operator's framing of what this expert covers. */
  scopeNote: string;
}

/**
 * The deep domain layers — the same shapes a reference `FunctionPack` carries,
 * reused directly so authoring and the depth bar stay in one schema. Held as a
 * named layer set (rather than `extends FunctionPack`) so cross-cutting experts
 * with no industry×function key can supply the same layers.
 */
export interface ExpertDomainLayers {
  operatingMetrics: OperatingMetric[];
  painThemes: PainTheme[];
  aiUseCaseArchetypes: AiUseCaseArchetype[];
  referenceSolutionPatterns: ReferenceSolutionPattern[];
  valueModel: ValueModel;
  vocabulary: VocabularyAndEntities;
  evidenceAnchors: EvidenceAnchor[];
}

/** Diagnostic posture — the questions and signals a real expert opens with. */
export interface ExpertDiagnostics {
  /** What the expert asks first to scope the problem. */
  discoveryQuestions: string[];
  /** Observable signals that indicate maturity level. */
  maturitySignals: string[];
  /** Red flags that change the recommendation. */
  redFlags: string[];
}

export interface ExpertVendorLandscapeEntry {
  vendorName: string;
  category: string;
  /** Why an enterprise stays — what makes switching hard. */
  switchingCost: string;
  /** Renewal/commercial dynamics worth knowing. */
  renewalDynamics?: string;
}

/** Sourcing layer — vendor landscape + the levers a sourcing expert pulls. */
export interface ExpertSourcingLayer {
  vendorLandscape: ExpertVendorLandscapeEntry[];
  /** General switching-cost posture for this domain. */
  switchingCosts: string;
  /** Negotiation levers that apply in this domain. */
  negotiationLevers: string[];
}

/**
 * Evidence rules — what proof each kind of claim requires, and the citation
 * standard. Drives the (observe-only, under confident synthesis) citation gate
 * and tells the renderer which figures must carry `citationIds`.
 */
export interface ExpertEvidenceRules {
  /** claim-type -> the evidence kinds that should back it. */
  requiredEvidenceByClaimType: Record<string, string[]>;
  /** Prose describing the citation standard for this expert. */
  citationStandard: string;
}

/**
 * Hedge rules — under CONFIDENT SYNTHESIS this is NOT a refusal contract.
 * It tells the expert how to mark inference vs proof and where to soften.
 * The only hard block (cross-tenant) lives in the engine, not here.
 */
export interface ExpertHedgeRules {
  /** Situations where the expert should hedge rather than assert. */
  whenToHedge: string[];
  /** Phrasings that signal "industry pattern, not your data". */
  inferenceLanguage: string[];
  /** Claims that must never be asserted without tenant evidence (still answered, but flagged). */
  flagWithoutEvidence: string[];
}

/** Output recipe — maps a question pattern to the exhibit the expert produces. */
export interface ExpertOutputRecipe {
  /** A question pattern this recipe applies to, e.g. "spend by vendor". */
  questionPattern: string;
  exhibitKind: "prose" | "table" | "chart" | "graph";
  /** When exhibitKind === "chart", which svg-charts builder + chart kind. */
  chartKind?: AnswerChartKind;
  chartBuilder?: string;
  note?: string;
}

/**
 * A confidence band. Deliberately a coarse 3-step — boardroom-legible, and
 * honest about the fact these are judgements, not point estimates.
 */
// Values align with AnswerConfidence (low | medium | high) so a pack never
// carries two different 3-step vocabularies ("moderate" vs "medium").
export type SuccessBand = "low" | "medium" | "high";

/**
 * The CXO stuck-point, made first-class. Boardrooms say "we know it matters, we
 * don't know HOW, and we can't size the odds." Every expert must answer the
 * odds explicitly: probability of success, adoption reality, and how firm the
 * ROI case is — separate from the value MODEL (which sizes the prize) because a
 * large prize with low odds and weak adoption is a different decision than a
 * modest prize that almost always lands.
 */
export interface ExpertSuccessModel {
  /** Likelihood a well-run program in this domain hits its target outcome. */
  probabilityOfSuccess: SuccessBand;
  /** Conditions that raise the odds — what "well-run" actually means here. */
  successDrivers: string[];
  /** Conditions that sink programs in this domain — the honest failure list. */
  failureDrivers: string[];
  /** How ready a typical enterprise is to adopt today. */
  adoptionReadiness: SuccessBand;
  /** The adoption shape: who adopts, in what order, what unlocks scale. */
  adoptionCurve: string;
  /** How firm the ROI case is — calibrates trust in the value model. */
  roiClarity: SuccessBand;
  /** Why ROI clarity sits where it does (attribution, data, payer/market response). */
  roiClarityBasis: string;
}

/** Provenance — under AI-gate-only there is no human SME review tier. */
export interface ExpertProvenance {
  authoredBy: string;
  /** Founder decision 2026-06-20: AI gate only, no SME tier. */
  reviewTier: "ai-gate";
  confidence: AvaConfidence;
  /** ISO date the pack content was last authored/reviewed. */
  asOf: string;
}

/** A single virtual industry expert. */
export interface ExpertPack {
  packVersion: "expert-pack/v2";
  identity: ExpertPackIdentity;

  /** The deep domain layers (reused FunctionPack shapes). */
  domain: ExpertDomainLayers;
  diagnostics: ExpertDiagnostics;
  /** null for experts where sourcing is not in scope. */
  sourcing: ExpertSourcingLayer | null;
  evidenceRules: ExpertEvidenceRules;
  hedgeRules: ExpertHedgeRules;
  outputRecipes: ExpertOutputRecipe[];
  /** The CXO stuck-point: probability of success, adoption, ROI clarity. */
  successModel: ExpertSuccessModel;
  regulatoryFrame: RegulatoryFrame | null;
  provenance: ExpertProvenance;
}

/**
 * Depth-bar minimums every authored ExpertPack must meet (W3 quality gate
 * reads these). Inherits the FunctionPack bar and adds the new layers so the
 * adversarial critic + qa-rubric can assert against one source of truth.
 */
export const EXPERT_PACK_DEPTH_MINIMUMS = {
  operatingMetrics: 10,
  painThemes: 6,
  aiUseCaseArchetypes: 5,
  referenceSolutionPatterns: 4,
  evidenceAnchors: 4,
  discoveryQuestions: 6,
  redFlags: 4,
  outputRecipes: 4,
} as const;

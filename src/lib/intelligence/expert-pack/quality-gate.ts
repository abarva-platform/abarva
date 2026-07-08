// ExpertPack quality gate — W0.3.
//
// This is the CONTENT / honesty gate every ExpertPack must pass before it is
// admitted to Consilium. It is distinct from Codex's W2.3 structural validator:
// W2.3 confirms the pack loads and meets raw counts; this gate enforces the
// JUDGEMENT rules that keep ~210 AI-authored packs honest — the same rules the
// adversarial critic applies (CFO / evidence / domain lenses), encoded so the
// W3.2 authoring run can self-gate at volume.
//
// Decision context (2026-06-20): grounding doctrine is CONFIDENT SYNTHESIS, so
// the gate does NOT require refusal machinery — it requires HEDGE language and
// honest benchmarks. Pass = zero blockers. Concerns are advisory.

import type { ExpertPack } from "./expert-pack";
import { EXPERT_PACK_DEPTH_MINIMUMS } from "./expert-pack";
import type { AnswerChartKind } from "@/lib/ava-answer/contract";

export type GateSeverity = "blocker" | "concern" | "note";

export interface GateFinding {
  severity: GateSeverity;
  /** Short rule id, e.g. "depth.operatingMetrics" or "honesty.value-mechanism". */
  rule: string;
  /** Human-readable explanation of what failed and where. */
  detail: string;
}

export interface GateResult {
  pass: boolean;
  blockerCount: number;
  concernCount: number;
  findings: GateFinding[];
}

// Exhaustive map keyed by AnswerChartKind. Because the key type IS the union,
// adding (or removing) a member in answer/agent-answer.ts forces a compile error
// here — the runtime check can never silently diverge from the type contract.
const CHART_KIND_SET: Record<AnswerChartKind, true> = {
  bar: true,
  "stacked-bar": true,
  line: true,
  waterfall: true,
  "value-bridge": true,
  tornado: true,
  "range-bar": true,
  heatmap: true,
  swimlane: true,
  "cost-stack": true,
  "quadrant-matrix": true,
};
const isValidChartKind = (k: string): k is AnswerChartKind =>
  Object.prototype.hasOwnProperty.call(CHART_KIND_SET, k);

/**
 * Run the full quality gate against one ExpertPack. Pure + deterministic so it
 * can run in CI, in the authoring loop, and in tests.
 */
export function gateExpertPack(pack: ExpertPack): GateResult {
  // The gate runs on AI-authored runtime data; a null/non-object input (e.g. a
  // failed parse) is a hard fail, not a thrown exception that aborts the run.
  if (pack === null || typeof pack !== "object") {
    return {
      pass: false,
      blockerCount: 1,
      concernCount: 0,
      findings: [
        {
          severity: "blocker",
          rule: "structure.pack",
          detail: "pack is not an object.",
        },
      ],
    };
  }

  const findings: GateFinding[] = [];
  const blocker = (rule: string, detail: string) =>
    findings.push({ severity: "blocker", rule, detail });
  const concern = (rule: string, detail: string) =>
    findings.push({ severity: "concern", rule, detail });

  // ── Structural guards (blocker) ────────────────────────────────────────────
  // This gate runs on AI-AUTHORED packs at volume (runtime data), not only on
  // tsc-checked literals — so it must be defensive against missing containers
  // rather than trusting the TypeScript type. A missing array counts as 0 (→ a
  // depth blocker) instead of throwing and aborting the run.
  const domain = pack.domain ?? ({} as ExpertPack["domain"]);
  const diagnostics = pack.diagnostics ?? ({} as ExpertPack["diagnostics"]);
  if (!pack.domain) blocker("structure.domain", "pack.domain is missing.");
  if (!pack.diagnostics)
    blocker("structure.diagnostics", "pack.diagnostics is missing.");
  const len = (a: unknown): number => (Array.isArray(a) ? a.length : 0);

  // ── Depth bar (blocker) ────────────────────────────────────────────────────
  const counts: Record<keyof typeof EXPERT_PACK_DEPTH_MINIMUMS, number> = {
    operatingMetrics: len(domain.operatingMetrics),
    painThemes: len(domain.painThemes),
    aiUseCaseArchetypes: len(domain.aiUseCaseArchetypes),
    referenceSolutionPatterns: len(domain.referenceSolutionPatterns),
    evidenceAnchors: len(domain.evidenceAnchors),
    discoveryQuestions: len(diagnostics.discoveryQuestions),
    redFlags: len(diagnostics.redFlags),
    outputRecipes: len(pack.outputRecipes),
  };
  for (const key of Object.keys(EXPERT_PACK_DEPTH_MINIMUMS) as Array<
    keyof typeof EXPERT_PACK_DEPTH_MINIMUMS
  >) {
    const min = EXPERT_PACK_DEPTH_MINIMUMS[key];
    if (counts[key] < min) {
      blocker(`depth.${key}`, `${key} has ${counts[key]} (minimum ${min}).`);
    }
  }

  // ── Identity coherence (blocker) ───────────────────────────────────────────
  if (!pack.identity)
    blocker("structure.identity", "pack.identity is missing.");
  const id = pack.identity ?? ({} as ExpertPack["identity"]);
  if (id.kind === "industry-function") {
    if (!id.industry)
      blocker(
        "identity.industry",
        "industry-function expert is missing `industry`.",
      );
    if (!id.functionKey)
      blocker(
        "identity.functionKey",
        "industry-function expert is missing `functionKey`.",
      );
  } else if (id.kind === "cross-cutting-domain") {
    if (!id.crossCuttingDomain)
      blocker(
        "identity.crossCuttingDomain",
        "cross-cutting expert is missing `crossCuttingDomain`.",
      );
  }
  if (!id.scopeNote?.trim())
    blocker(
      "identity.scopeNote",
      "scopeNote is empty — an expert must declare its boundary.",
    );

  // ── Honesty: every AI archetype has a value mechanism (blocker) ────────────
  const operatingMetrics = Array.isArray(domain.operatingMetrics)
    ? domain.operatingMetrics
    : [];
  const metricKeys = new Set(operatingMetrics.map((m) => m.key));
  const archetypes = Array.isArray(domain.aiUseCaseArchetypes)
    ? domain.aiUseCaseArchetypes
    : [];
  for (const a of archetypes) {
    if (!a.valueMechanism?.trim()) {
      blocker(
        "honesty.value-mechanism",
        `AI archetype "${a.name}" has no valueMechanism — auto-reject rule.`,
      );
    }
    if (!a.dataDependencies?.length) {
      concern(
        "honesty.data-dependencies",
        `AI archetype "${a.name}" lists no dataDependencies.`,
      );
    }
    // metricsMoved is required — a missing/non-array value is itself a failure,
    // not a reason to skip the integrity check (that would pass a malformed pack).
    if (!Array.isArray(a.metricsMoved)) {
      blocker(
        "integrity.metrics-moved",
        `AI archetype "${a.name}" is missing metricsMoved.`,
      );
    } else {
      for (const mk of a.metricsMoved) {
        if (!metricKeys.has(mk)) {
          blocker(
            "integrity.metric-ref",
            `AI archetype "${a.name}" references unknown metric key "${mk}".`,
          );
        }
      }
    }
  }

  // ── Honesty: benchmarks are labelled planning ranges, low<=high (blocker) ──
  const checkRange = (
    where: string,
    r: { low: number; high: number; label: string },
  ) => {
    if (r.label !== "planning-range") {
      blocker(
        "honesty.benchmark-label",
        `${where}: benchmark must be labelled "planning-range" (got "${r.label}").`,
      );
    }
    if (r.low > r.high) {
      blocker(
        "integrity.benchmark-range",
        `${where}: benchmark low (${r.low}) > high (${r.high}).`,
      );
    }
  };
  for (const m of operatingMetrics) {
    if (m.benchmarkRange) checkRange(`metric "${m.key}"`, m.benchmarkRange);
  }
  const valueModel = domain.valueModel;
  for (const h of valueModel?.dominantHaircutFactors ?? []) {
    if (h.typicalHaircut) checkRange(`haircut "${h.factor}"`, h.typicalHaircut);
  }
  for (const v of valueModel?.valueBenchmarks ?? []) {
    if (v.range) checkRange(`value lever "${v.lever}"`, v.range);
  }

  // ── Reference solutions name a human accountability point (blocker) ─────────
  for (const rs of Array.isArray(domain.referenceSolutionPatterns)
    ? domain.referenceSolutionPatterns
    : []) {
    if (!rs.humanAccountabilityPoint?.trim()) {
      blocker(
        "governance.accountability",
        `Reference solution "${rs.name}" has no humanAccountabilityPoint.`,
      );
    }
  }

  // ── Evidence rules present and non-trivial (blocker) ───────────────────────
  if (
    Object.keys(pack.evidenceRules?.requiredEvidenceByClaimType ?? {})
      .length === 0
  ) {
    blocker(
      "evidence.rules",
      "evidenceRules.requiredEvidenceByClaimType is empty.",
    );
  }
  if (!pack.evidenceRules?.citationStandard?.trim()) {
    blocker(
      "evidence.citation-standard",
      "evidenceRules.citationStandard is empty.",
    );
  }

  // ── Confident-synthesis requires hedge language (blocker) ──────────────────
  if (!pack.hedgeRules?.whenToHedge?.length) {
    blocker(
      "doctrine.hedge",
      "hedgeRules.whenToHedge is empty — confident synthesis still requires hedges.",
    );
  }
  if (!pack.hedgeRules?.inferenceLanguage?.length) {
    concern(
      "doctrine.inference-language",
      "hedgeRules.inferenceLanguage is empty — no 'industry pattern, not your data' phrasing.",
    );
  }

  // ── Output recipes reference valid chart kinds (blocker) ───────────────────
  for (const r of Array.isArray(pack.outputRecipes) ? pack.outputRecipes : []) {
    if (r.exhibitKind === "chart") {
      if (!r.chartKind) {
        blocker(
          "recipe.chart-kind",
          `Output recipe "${r.questionPattern}" is a chart but has no chartKind.`,
        );
      } else if (!isValidChartKind(r.chartKind)) {
        blocker(
          "recipe.chart-kind",
          `Output recipe "${r.questionPattern}" has unknown chartKind "${r.chartKind}".`,
        );
      }
    }
  }

  // ── Success model: the CXO stuck-point must be answered (blocker) ──────────
  const BANDS = new Set(["low", "medium", "high"]);
  const sm = pack.successModel;
  if (!sm) {
    blocker(
      "success.model",
      "successModel is missing — the CXO stuck-point (odds/adoption/ROI) is unanswered.",
    );
  } else {
    if (!BANDS.has(sm.probabilityOfSuccess))
      blocker(
        "success.probability",
        `probabilityOfSuccess must be low|medium|high (got "${sm.probabilityOfSuccess}").`,
      );
    if (!BANDS.has(sm.adoptionReadiness))
      blocker(
        "success.adoption",
        `adoptionReadiness must be low|medium|high (got "${sm.adoptionReadiness}").`,
      );
    if (!BANDS.has(sm.roiClarity))
      blocker(
        "success.roi-clarity",
        `roiClarity must be low|medium|high (got "${sm.roiClarity}").`,
      );
    if (!sm.successDrivers?.length)
      blocker(
        "success.drivers",
        "successModel.successDrivers is empty — 'what makes it work' is unanswered.",
      );
    if (!sm.failureDrivers?.length)
      blocker(
        "success.failure-drivers",
        "successModel.failureDrivers is empty — the honest failure list is missing.",
      );
    if (!sm.adoptionCurve?.trim())
      concern(
        "success.adoption-curve",
        "successModel.adoptionCurve is empty — adoption shape is unstated.",
      );
    if (!sm.roiClarityBasis?.trim())
      concern(
        "success.roi-basis",
        "successModel.roiClarityBasis is empty — why ROI clarity sits where it does is unstated.",
      );
  }

  // ── Provenance per AI-gate decision (concern/blocker) ──────────────────────
  if (pack.provenance?.reviewTier !== "ai-gate") {
    blocker(
      "provenance.review-tier",
      `reviewTier must be "ai-gate" (got "${pack.provenance?.reviewTier}").`,
    );
  }
  if (!pack.provenance?.asOf?.trim()) {
    concern(
      "provenance.as-of",
      "provenance.asOf is empty — freshness is unknown.",
    );
  }

  const blockerCount = findings.filter((f) => f.severity === "blocker").length;
  const concernCount = findings.filter((f) => f.severity === "concern").length;
  return { pass: blockerCount === 0, blockerCount, concernCount, findings };
}

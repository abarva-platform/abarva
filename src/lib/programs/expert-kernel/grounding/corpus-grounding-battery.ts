// Corpus grounding battery — the question set + runner.
//
// 100+ questions exercising the REAL production binding path
// (`bindMoveFunctionPack` + `resolveFunctionPack`) to prove the Domain Function
// Pack corpus grounds an agent's answer before it reaches for general
// intelligence (spec ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md §1, §5).
//
// This is the deterministic, reproducible form of "run 100+ questions": each
// question carries the grounding it REQUIRES, and `runGroundingBattery` asserts
// the bound pack supplies it. A live LLM is not needed — the pack IS the curated
// depth the agent inherits, so if the depth is present and bindable the surface
// is grounded; if it is missing, the agent would fall back to general reasoning,
// which is the precise gap this battery surfaces.
//
// Pure module — no I/O, no console, no process.exit. The CLI
// (scripts/grounding/run-corpus-grounding-battery.ts) prints; the test
// (__tests__/corpus-grounding-battery.test.ts) asserts.

import {
  resolveFunctionPack,
  listFunctionPackCoverage,
} from "../domain/function-pack-registry";
import { bindMoveFunctionPack } from "../../move-function-binding";
import type {
  FunctionPack,
  FunctionPackIndustryKey,
  MovesPhaseArtifact,
} from "../domain/function-pack-types";
import type { FunctionPackBinding } from "../domain/function-pack-context-binding";

export type GroundingSurface =
  | "Nexus/Moves"
  | "Sentinel/Source"
  | "Sentinel/Intelligence"
  | "Atlas/Tower"
  | "Steward/Setup";

export interface GroundingQuestion {
  id: string;
  surface: GroundingSurface;
  industryCode: string;
  functionKey: string;
  artifact: MovesPhaseArtifact;
  question: string;
  requires: string;
  probe: (pack: FunctionPack | null, binding: FunctionPackBinding) => boolean;
}

export interface GroundingResult extends GroundingQuestion {
  pass: boolean;
}

// ── Probe helpers — case-insensitive over key + name + descriptive text ───────
const rx = (s: string) => new RegExp(s, "i");
const metric = (p: FunctionPack | null, re: RegExp) =>
  !!p && p.operatingMetrics.some((m) => re.test(m.key) || re.test(m.name));
const pain = (p: FunctionPack | null, re: RegExp) =>
  !!p &&
  p.painThemes.some(
    (t) => re.test(t.key) || re.test(t.name) || re.test(t.description),
  );
const archetype = (p: FunctionPack | null, re: RegExp) =>
  !!p &&
  p.aiUseCaseArchetypes.some(
    (a) => re.test(a.key) || re.test(a.name) || re.test(a.valueMechanism),
  );
const pattern = (p: FunctionPack | null, re: RegExp) =>
  !!p &&
  p.referenceSolutionPatterns.some(
    (r) => re.test(r.key) || re.test(r.name) || re.test(r.description),
  );
const vocab = (p: FunctionPack | null, re: RegExp) =>
  !!p &&
  (p.vocabulary.canonicalTerms.some(
    (t) => re.test(t.term) || re.test(t.definition),
  ) ||
    p.vocabulary.regulatoryFrames.some(
      (f) => re.test(f.name) || re.test(f.relevance),
    ) ||
    p.vocabulary.systemsOfRecord.some(
      (s) => re.test(s.name) || re.test(s.role),
    ));
const anchor = (p: FunctionPack | null, re: RegExp) =>
  !!p &&
  p.evidenceAnchors.some(
    (e) => re.test(e.claim) || re.test(e.whatGoodEvidenceLooksLike),
  );
const outline = (b: FunctionPackBinding, re: RegExp) =>
  b.bound &&
  b.deliverableOutline.some((s) => re.test(s.heading) || re.test(s.guidance));
const ownIt = (p: FunctionPack | null, b: FunctionPackBinding) =>
  pain(p, rx("rent")) ||
  anchor(p, rx("own|rent")) ||
  pattern(p, rx("own-it|landing zone|metadata-driven|unity catalog")) ||
  outline(b, rx("own-it|landing zone|ingestion"));

const HEALTHCARE = "healthcare_idn";
const RETAIL = "retail";
const FINSERV = "finserv";

// ── Curated deep questions — the 3 healthcare hero packs ──────────────────────
const HERO: GroundingQuestion[] = [
  {
    id: "POPH-Q1",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "discover_brief",
    question: "What is the population MLR baseline and is it sustainable?",
    requires: "MLR operating metric",
    probe: (p) => metric(p, rx("medical loss ratio|mlr")),
  },
  {
    id: "POPH-Q2",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "discover_brief",
    question: "How accurately does coded RAF reflect the population burden?",
    requires: "RAF accuracy metric + HCC vocab",
    probe: (p) => metric(p, rx("raf")) && vocab(p, rx("hcc|raf")),
  },
  {
    id: "POPH-Q3",
    surface: "Sentinel/Intelligence",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "business_case",
    question:
      "Should we buy Innovaccer/Health Catalyst or build our own population layer?",
    requires: "own-it vs rent grounding",
    probe: (p, b) => ownIt(p, b),
  },
  {
    id: "POPH-Q4",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "solution_architecture",
    question: "What cloud landing zone does the platform sit on?",
    requires: "landing-zone architecture outline",
    probe: (_p, b) => outline(b, rx("landing zone")),
  },
  {
    id: "POPH-Q5",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "solution_architecture",
    question:
      "How do we ingest Epic Clarity/Caboodle without reinventing pipelines?",
    requires: "own-it metadata ingestion outline",
    probe: (_p, b) =>
      outline(b, rx("ingestion")) && outline(b, rx("own-it|metadata")),
  },
  {
    id: "POPH-Q6",
    surface: "Steward/Setup",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "solution_architecture",
    question: "What governance + HIPAA control spine governs PHI?",
    requires: "HITRUST/HIPAA/Unity Catalog grounding",
    probe: (p, b) =>
      outline(b, rx("hitrust|hipaa|unity catalog")) ||
      vocab(p, rx("radv|hipaa")),
  },
  {
    id: "POPH-Q7",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "business_case",
    question: "Which risk-stratification AI bet moves cost?",
    requires: "risk stratification archetype",
    probe: (p) => archetype(p, rx("risk stratif")),
  },
  {
    id: "POPH-Q8",
    surface: "Sentinel/Intelligence",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "discover_brief",
    question: "Is RAF capture tipping into compliance overreach?",
    requires: "coding-overreach pain theme + RADV",
    probe: (p) => pain(p, rx("overreach|coding")) && vocab(p, rx("radv")),
  },
  {
    id: "POPH-Q9",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "business_case",
    question: "How does the Health Equity Index affect Star revenue?",
    requires: "HEI regulatory frame",
    probe: (p) => vocab(p, rx("health equity index|hei")),
  },
  {
    id: "POPH-Q10",
    surface: "Sentinel/Intelligence",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "solution_architecture",
    question: "How do we avoid cost-as-proxy bias in the risk model?",
    requires: "equity/bias grounding",
    probe: (p) =>
      archetype(p, rx("equity|bias|obermeyer|under-rank")) ||
      pattern(p, rx("validation")),
  },
  {
    id: "POPH-Q11",
    surface: "Atlas/Tower",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "business_case",
    question: "What preventable-utilization trend should Tower track?",
    requires: "preventable hospitalization metric",
    probe: (p) =>
      metric(p, rx("preventable hospitalis|preventable hospitaliz")),
  },
  {
    id: "POPH-Q12",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "mobilization_plan",
    question: "What foundation must ship before AI use cases?",
    requires: "bound 4-section mobilization outline",
    probe: (_p, b) => b.bound && b.deliverableOutline.length >= 4,
  },
  {
    id: "POPH-Q13",
    surface: "Sentinel/Intelligence",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "business_case",
    question: "Is the population intelligence layer owned or rented?",
    requires: "ownership evidence anchor",
    probe: (p) => anchor(p, rx("own|rent")),
  },
  {
    id: "POPH-Q14",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "discover_brief",
    question: "What is the shared-savings result against benchmark?",
    requires: "shared-savings metric + benchmark vocab",
    probe: (p) => metric(p, rx("shared.?saving")) && vocab(p, rx("benchmark")),
  },
  {
    id: "POPH-Q15",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "population_health_value_based_care",
    artifact: "solution_architecture",
    question: "What is the reconciled population data layer pattern?",
    requires: "reconciled-data reference pattern",
    probe: (p) => pattern(p, rx("reconciled population")),
  },

  {
    id: "CLIN-Q1",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "clinical_operations_documentation",
    artifact: "discover_brief",
    question: "What clinical-documentation baseline are we improving?",
    requires: "bound pack with >= 10 metrics",
    probe: (p, b) => b.bound && (p?.operatingMetrics.length ?? 0) >= 10,
  },
  {
    id: "CLIN-Q2",
    surface: "Sentinel/Intelligence",
    industryCode: HEALTHCARE,
    functionKey: "clinical_operations_documentation",
    artifact: "solution_architecture",
    question: "Why not just deploy a vendor sepsis model?",
    requires: "Epic Sepsis Model / rented-black-box pain theme",
    probe: (p) => pain(p, rx("sepsis|black.?box|rented|external")),
  },
  {
    id: "CLIN-Q3",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "clinical_operations_documentation",
    artifact: "solution_architecture",
    question: "What landing zone + ingestion does the clinical platform use?",
    requires: "landing-zone + ingestion outline",
    probe: (_p, b) =>
      outline(b, rx("landing zone")) && outline(b, rx("ingestion")),
  },
  {
    id: "CLIN-Q4",
    surface: "Steward/Setup",
    industryCode: HEALTHCARE,
    functionKey: "clinical_operations_documentation",
    artifact: "solution_architecture",
    question: "What HITRUST/HIPAA governance applies to clinical data?",
    requires: "HITRUST/HIPAA outline or vocab",
    probe: (p, b) =>
      outline(b, rx("hitrust|hipaa|unity catalog")) ||
      vocab(p, rx("hipaa|hitrust")),
  },
  {
    id: "CLIN-Q5",
    surface: "Sentinel/Intelligence",
    industryCode: HEALTHCARE,
    functionKey: "clinical_operations_documentation",
    artifact: "business_case",
    question: "Do we own the clinical model or rent it?",
    requires: "own-it grounding",
    probe: (p, b) => ownIt(p, b),
  },
  {
    id: "CLIN-Q6",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "clinical_operations_documentation",
    artifact: "business_case",
    question: "What AI documentation archetypes create value?",
    requires: ">= 5 archetypes",
    probe: (p) => (p?.aiUseCaseArchetypes.length ?? 0) >= 5,
  },
  {
    id: "CLIN-Q7",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "clinical_operations_documentation",
    artifact: "discover_brief",
    question: "What are the failure modes in clinical documentation?",
    requires: ">= 6 pain themes",
    probe: (p) => (p?.painThemes.length ?? 0) >= 6,
  },
  {
    id: "CLIN-Q8",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "clinical_operations_documentation",
    artifact: "mobilization_plan",
    question: "How do we mobilize clinical adoption safely?",
    requires: "bound mobilization outline",
    probe: (_p, b) => b.bound && b.phase !== undefined,
  },
  {
    id: "CLIN-Q9",
    surface: "Sentinel/Intelligence",
    industryCode: HEALTHCARE,
    functionKey: "clinical_operations_documentation",
    artifact: "business_case",
    question: "Is there an ownership evidence anchor for the model?",
    requires: "ownership anchor",
    probe: (p) => anchor(p, rx("own|rent")),
  },

  {
    id: "PAYER-Q1",
    surface: "Sentinel/Intelligence",
    industryCode: HEALTHCARE,
    functionKey: "payer_claims_operations",
    artifact: "discover_brief",
    question: "What Stars and MLR baselines frame the plan?",
    requires: "bound pack with >= 10 metrics",
    probe: (p, b) => b.bound && (p?.operatingMetrics.length ?? 0) >= 10,
  },
  {
    id: "PAYER-Q2",
    surface: "Sentinel/Intelligence",
    industryCode: HEALTHCARE,
    functionKey: "payer_claims_operations",
    artifact: "business_case",
    question:
      "Buy fragmented point-solution SaaS or build a unified lakehouse?",
    requires: "rented-fragmented / own-it grounding",
    probe: (p, b) =>
      pain(p, rx("rent|fragment|point.?solution")) || ownIt(p, b),
  },
  {
    id: "PAYER-Q3",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "payer_claims_operations",
    artifact: "solution_architecture",
    question: "What landing zone + ingestion for claims/enrollment?",
    requires: "landing-zone + ingestion outline",
    probe: (_p, b) =>
      outline(b, rx("landing zone")) && outline(b, rx("ingestion")),
  },
  {
    id: "PAYER-Q4",
    surface: "Sentinel/Intelligence",
    industryCode: HEALTHCARE,
    functionKey: "payer_claims_operations",
    artifact: "discover_brief",
    question: "Are we at RADV/upcoding risk on risk adjustment?",
    requires: "RAF/RADV grounding",
    probe: (p) =>
      pain(p, rx("upcod|raf|risk adjust")) || vocab(p, rx("radv|raf|hcc")),
  },
  {
    id: "PAYER-Q5",
    surface: "Steward/Setup",
    industryCode: HEALTHCARE,
    functionKey: "payer_claims_operations",
    artifact: "solution_architecture",
    question: "What governance spine for payer PHI?",
    requires: "HITRUST/HIPAA outline or vocab",
    probe: (p, b) =>
      outline(b, rx("hitrust|hipaa|unity catalog")) ||
      vocab(p, rx("hipaa|cms")),
  },
  {
    id: "PAYER-Q6",
    surface: "Sentinel/Intelligence",
    industryCode: HEALTHCARE,
    functionKey: "payer_claims_operations",
    artifact: "business_case",
    question: "Is the payer intelligence owned or rented?",
    requires: "ownership anchor",
    probe: (p) => anchor(p, rx("own|rent")),
  },
  {
    id: "PAYER-Q7",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "payer_claims_operations",
    artifact: "business_case",
    question: "What claims/Stars AI archetypes create value?",
    requires: ">= 5 archetypes",
    probe: (p) => (p?.aiUseCaseArchetypes.length ?? 0) >= 5,
  },
  {
    id: "PAYER-Q8",
    surface: "Nexus/Moves",
    industryCode: HEALTHCARE,
    functionKey: "payer_claims_operations",
    artifact: "mobilization_plan",
    question: "How do we mobilize the payer program?",
    requires: "bound 4-section mobilization outline",
    probe: (_p, b) => b.bound && b.deliverableOutline.length >= 4,
  },
];

// ── Auto-generated coverage questions across every catalogued pack ────────────
// Partial: industries with an audited corpus + tenant-metric binding harness
// the battery probes against. A catalogued pack whose industry is not yet in
// the grounding harness (e.g. airline) is skipped here and covered by its own
// dedicated pack test instead.
const CODE_FOR_INDUSTRY: Partial<Record<FunctionPackIndustryKey, string>> = {
  "healthcare-provider": HEALTHCARE,
  retail: RETAIL,
  "financial-services": FINSERV,
};

function buildAutoQuestions(): GroundingQuestion[] {
  const out: GroundingQuestion[] = [];
  for (const c of listFunctionPackCoverage()) {
    const code = CODE_FOR_INDUSTRY[c.industryKey];
    if (!code) continue; // industry not in the grounding harness yet

    out.push({
      id: `COV-${c.functionKey}-bind`,
      surface: "Nexus/Moves",
      industryCode: code,
      functionKey: c.functionKey,
      artifact: "discover_brief",
      question: `Does a ${c.functionLabel} Move bind curated depth (metrics)?`,
      requires: "bound pack with >= 10 operating metrics",
      probe: (p, b) => b.bound && (p?.operatingMetrics.length ?? 0) >= 10,
    });
    out.push({
      id: `COV-${c.functionKey}-archetypes`,
      surface: "Nexus/Moves",
      industryCode: code,
      functionKey: c.functionKey,
      artifact: "business_case",
      question: `Does ${c.functionLabel} recognise its AI use-case archetypes?`,
      requires: ">= 5 archetypes",
      probe: (p) => (p?.aiUseCaseArchetypes.length ?? 0) >= 5,
    });
    out.push({
      id: `COV-${c.functionKey}-outline`,
      surface: "Nexus/Moves",
      industryCode: code,
      functionKey: c.functionKey,
      artifact: "solution_architecture",
      question: `Does ${c.functionLabel} inherit a solution-architecture TOC?`,
      requires: "bound solution_architecture outline with >= 4 sections",
      probe: (_p, b) => b.bound && b.deliverableOutline.length >= 4,
    });
  }
  return out;
}

export const GROUNDING_QUESTIONS: GroundingQuestion[] = [
  ...HERO,
  ...buildAutoQuestions(),
];

/** Run the battery against the live registry. Pure — no I/O. */
export function runGroundingBattery(
  questions: GroundingQuestion[] = GROUNDING_QUESTIONS,
): GroundingResult[] {
  return questions.map((q) => {
    const industryKey: FunctionPackIndustryKey =
      q.industryCode === HEALTHCARE
        ? "healthcare-provider"
        : q.industryCode === RETAIL
          ? "retail"
          : "financial-services";
    const pack = resolveFunctionPack(industryKey, q.functionKey);
    const binding = bindMoveFunctionPack(
      { industry_code: q.industryCode, function_pack_key: q.functionKey },
      q.artifact,
    );
    let pass = false;
    try {
      pass = q.probe(pack, binding);
    } catch {
      pass = false;
    }
    return { ...q, pass };
  });
}

import type { PatternSeed, SourcingCategory } from "../intelligence/seed-types";
import { SOURCING_PATTERNS } from "../intelligence/seed-patterns-sourcing";
import { SOURCING_BAFO_CONTRACT_PATTERNS } from "../intelligence/seed-patterns-sourcing-bafo-contracts";
import { SOURCE_GOLDEN_EVENT_IDS } from "./constants";
import type { SourcePatternSectionContext } from "./agent-context";
import type {
  SourceCommercialTrap,
  SourcePricingVendorInput,
} from "./pricing-normalization-types";
import type { SourceVendorResponseSeedInput } from "./vendor-response-types";

type SourceCorpusEventRef = {
  id?: string;
  name?: string;
};

type SourceCorpusVendorTrapInput = SourceCorpusEventRef & {
  vendor: SourcePricingVendorInput;
};

type SourceCorpusBafoInput = SourceCorpusEventRef & {
  vendor?: SourceVendorResponseSeedInput;
  snapshotCategories?: string[];
};

type SourceCorpusAnswerMode =
  | "current_state"
  | "event_shaping"
  | "cxo_guidance"
  | "risk_traps"
  | "missing_data"
  | "expert_sourcing";

type SourceCorpusAnswerPatternInput = {
  event: SourceCorpusEventRef;
  prompt: string;
  mode: SourceCorpusAnswerMode;
  maxSections?: number;
};

const EXPANDED_SOURCE_CORPUS_PREFIXES = [
  "PAT-SRC-PNG-",
  "PAT-SRC-BAFO-",
  "PAT-SRC-LEV-",
  "PAT-SRC-RIT-",
  "PAT-SRC-AFM-",
  "PAT-SRC-VPR-",
  "PAT-SRC-BEN-",
  "PAT-SRC-CGV-",
  "PAT-SRC-VPF-",
  "PAT-SRC-RFP-EVAL-",
  "PAT-SRC-ART-",
] as const;

const APEX_AMS_REQUIRED_EXPANDED_PATTERN_IDS = [
  "PAT-SRC-VPF-NO-EVIDENCE-NO-NUMBER",
  "PAT-SRC-RFP-EVAL-018",
  "PAT-SRC-ART-PRICING-WORKBOOK",
  "PAT-SRC-CGV-SAVINGS-CLAIM-GATE",
] as const;

function isApexAmsEvent(event: SourceCorpusEventRef): boolean {
  const eventName = event.name?.toLowerCase() ?? "";
  return (
    event.id === SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026 ||
    (eventName.includes("ams") && eventName.includes("outsourcing")) ||
    (eventName.includes("ams") && eventName.includes("retail"))
  );
}

function addCorpusTrap(
  traps: SourceCommercialTrap[],
  vendor: SourcePricingVendorInput,
  trap: Omit<SourceCommercialTrap, "vendorId" | "vendorName">,
): void {
  traps.push({
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    ...trap,
  });
}

export function getSourceCorpusUpliftPatterns() {
  return getExpandedSourceCorpusPatterns();
}

export function getExpandedSourceCorpusPatterns(): PatternSeed[] {
  return SOURCING_PATTERNS.filter((pattern) =>
    EXPANDED_SOURCE_CORPUS_PREFIXES.some((prefix) =>
      pattern.id.startsWith(prefix),
    ),
  );
}

export function getSourceCorpusUpliftPatternSections(
  event: SourceCorpusEventRef,
): SourcePatternSectionContext[] {
  if (!isApexAmsEvent(event)) return [];

  return uniquePatternSections([
    ...getLegacyApexAmsPatternSections(),
    ...getPatternsById(APEX_AMS_REQUIRED_EXPANDED_PATTERN_IDS).map(
      patternToSection,
    ),
    ...rankSourceCorpusPatterns({
      event,
      prompt: `${event.name ?? ""} AMS retail pricing BAFO savings proof RFP evaluation artifact governance`,
      mode: "expert_sourcing",
      maxSections: 18,
    }).map(patternToSection),
  ]);
}

export function getSourceCorpusAnswerPatternSections(
  input: SourceCorpusAnswerPatternInput,
): SourcePatternSectionContext[] {
  if (!isApexAmsEvent(input.event)) return [];

  return uniquePatternSections(
    rankSourceCorpusPatterns(input).map(patternToSection),
  );
}

function getLegacyApexAmsPatternSections(): SourcePatternSectionContext[] {
  return [
    {
      id: "PAT-SRC-PNG-001",
      title: "AMS transition cost burial",
      kind: "failureModes",
      summary:
        "Normalize year-one TCO with transition, reverse-shadowing, tooling handback, and retained-client effort before ranking vendors on run price.",
      confidence: "high",
    },
    {
      id: "PAT-SRC-PNG-007",
      title: "Retail Q4 support peak normalization",
      kind: "requiredInputs",
      summary:
        "Retail AMS pricing must include holiday peak ticket volume, code-freeze support, POS/OMS/WMS severity mapping, and peak staffing coverage.",
      confidence: "high",
    },
    {
      id: "PAT-SRC-PNG-008",
      title: "Omnichannel scope leakage",
      kind: "risks",
      summary:
        "BOPIS, ship-from-store, returns, POS, OMS, and WMS incidents need end-to-end ownership; application-only scope lets vendors push incidents across tower boundaries.",
      confidence: "medium",
    },
    {
      id: "PAT-SRC-PNG-009",
      title: "BAFO trade envelope",
      kind: "interventions",
      summary:
        "Each BAFO lever should state buyer ask, target range, walk-away range, evidence required, and the contract clause affected.",
      confidence: "high",
    },
    {
      id: "PAT-SRC-PNG-011",
      title: "Benchmarking and exit value protection",
      kind: "artifactRules",
      summary:
        "Require benchmark rights, market-adjustment remedy, exit-assistance rates, tooling handback, and knowledge artifact transfer before treating savings as durable.",
      confidence: "high",
    },
    {
      id: "PAT-SRC-BAFO-003",
      title: "Transition holdback and warranty",
      kind: "artifactRules",
      summary:
        "Transition-heavy AMS BAFOs should tie fee release to knowledge transfer, service readiness, cutover, and stabilization criteria.",
      confidence: "high",
    },
    {
      id: "PAT-SRC-BAFO-008",
      title: "Benchmark remedy, not just benchmark right",
      kind: "artifactRules",
      summary:
        "Benchmark clauses need a market-adjustment remedy, reopener, or termination right; a study without remedy is not leverage.",
      confidence: "high",
    },
  ];
}

function rankSourceCorpusPatterns(
  input: SourceCorpusAnswerPatternInput,
): PatternSeed[] {
  const text = `${input.event.name ?? ""} ${input.prompt} ${input.mode}`
    .toLowerCase()
    .replace(/[_-]/g, " ");
  const maxSections = input.maxSections ?? 8;

  return getExpandedSourceCorpusPatterns()
    .map((pattern) => ({
      pattern,
      score: scoreSourcePattern(pattern, text, input.mode),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id),
    )
    .slice(0, maxSections)
    .map((entry) => entry.pattern);
}

function scoreSourcePattern(
  pattern: PatternSeed,
  text: string,
  mode: SourceCorpusAnswerMode,
): number {
  let score = 0;
  const haystack =
    `${pattern.id} ${pattern.title} ${pattern.slug} ${pattern.category ?? ""} ${pattern.thesis} ${pattern.applicability} ${pattern.body}`
      .toLowerCase()
      .replace(/[_-]/g, " ");

  for (const token of extractRankingTokens(text)) {
    if (haystack.includes(token)) score += token.length > 4 ? 3 : 1;
  }

  if (pattern.id.startsWith("PAT-SRC-RIT-")) score += 6;
  if (pattern.id.startsWith("PAT-SRC-PNG-")) score += 5;
  if (pattern.id.startsWith("PAT-SRC-VPF-")) score += 5;
  if (pattern.id.startsWith("PAT-SRC-CGV-")) score += 3;

  if (/\b(pricing|tco|normalization|commercial|cost)\b/.test(text)) {
    if (
      pattern.id.startsWith("PAT-SRC-PNG-") ||
      pattern.id.startsWith("PAT-SRC-BEN-") ||
      pattern.id.startsWith("PAT-SRC-ART-PRICING")
    ) {
      score += 8;
    }
  }

  if (/\b(bafo|negotia|lever|walk away|walkaway)\b/.test(text)) {
    if (
      pattern.id.startsWith("PAT-SRC-BAFO-") ||
      pattern.id.startsWith("PAT-SRC-LEV-") ||
      pattern.id.startsWith("PAT-SRC-PNG-009")
    ) {
      score += 8;
    }
  }

  if (/\b(savings|value|cfo|proof|roi|claim|ledger)\b/.test(text)) {
    if (
      pattern.id.startsWith("PAT-SRC-VPF-") ||
      pattern.id === "PAT-SRC-CGV-SAVINGS-CLAIM-GATE" ||
      pattern.id.startsWith("PAT-SRC-ART-VALUE")
    ) {
      score += 10;
    }
  }
  if (
    pattern.id === "PAT-SRC-VPF-NO-EVIDENCE-NO-NUMBER" &&
    /\b(overstat|without overstating|no number|prove|proof|savings)\b/.test(
      text,
    )
  ) {
    score += 18;
  }

  if (/\b(rfp|criteria|scorecard|weight|evaluation|scoring)\b/.test(text)) {
    if (
      pattern.id.startsWith("PAT-SRC-RFP-EVAL-") ||
      pattern.id === "PAT-SRC-ART-EVALUATION-SCORECARD" ||
      pattern.id === "PAT-SRC-ART-WEIGHT-SET-GOVERNANCE-LOG"
    ) {
      score += 10;
    }
  }

  if (/\b(vendor|wipro|infosys|tcs|profile|benchmark|rate card)\b/.test(text)) {
    if (
      pattern.id.startsWith("PAT-SRC-VPR-") ||
      pattern.id.startsWith("PAT-SRC-BEN-")
    ) {
      score += 7;
    }
  }

  if (/\b(retail|q4|holiday|pos|oms|wms|bopis|returns|store)\b/.test(text)) {
    if (pattern.id.startsWith("PAT-SRC-RIT-")) score += 10;
    if (pattern.id === "PAT-SRC-PNG-007") score += 8;
  }

  if (mode === "risk_traps" && pattern.riskFactors?.length) score += 8;
  if (mode === "missing_data" && isEvidenceRequiredPattern(pattern)) score += 8;
  if (mode === "event_shaping" && pattern.id.startsWith("PAT-SRC-RFP-EVAL-")) {
    score += 5;
  }

  return score;
}

function extractRankingTokens(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 4)
        .filter(
          (token) =>
            ![
              "what",
              "should",
              "this",
              "that",
              "with",
              "from",
              "event",
              "source",
            ].includes(token),
        ),
    ),
  ).slice(0, 30);
}

function patternToSection(pattern: PatternSeed): SourcePatternSectionContext {
  return {
    id: pattern.id,
    title: pattern.title,
    kind: patternToSectionKind(pattern),
    summary: summarizePattern(pattern),
    confidence: confidenceToSection(pattern.confidence),
  };
}

function getPatternsById(ids: readonly string[]): PatternSeed[] {
  const patternsById = new Map(
    getExpandedSourceCorpusPatterns().map((pattern) => [pattern.id, pattern]),
  );
  return ids
    .map((id) => patternsById.get(id))
    .filter((pattern): pattern is PatternSeed => Boolean(pattern));
}

function patternToSectionKind(
  pattern: PatternSeed,
): SourcePatternSectionContext["kind"] {
  if (pattern.id.startsWith("PAT-SRC-RFP-EVAL-")) return "scorecardDefaults";
  if (pattern.id.startsWith("PAT-SRC-RIT-")) return "requiredInputs";
  if (pattern.id.startsWith("PAT-SRC-VPR-")) return "evidence";
  if (pattern.id.startsWith("PAT-SRC-BEN-")) return "evidence";
  if (pattern.id.startsWith("PAT-SRC-CGV-")) return "evidence";
  if (pattern.id.startsWith("PAT-SRC-VPF-")) return "evidence";
  if (pattern.id.startsWith("PAT-SRC-ART-")) return "artifactRules";
  if (pattern.id.startsWith("PAT-SRC-LEV-")) return "interventions";
  if (pattern.id.startsWith("PAT-SRC-AFM-")) return "failureModes";
  if (pattern.riskFactors?.length) return "risks";
  if (isArtifactCategory(pattern.category)) return "artifactRules";
  return "stageGuidance";
}

function summarizePattern(pattern: PatternSeed): string {
  const caveat = isEvidenceRequiredPattern(pattern)
    ? " Evidence-required; do not claim numeric, vendor, benchmark, or savings facts without citations."
    : "";
  return `${trimSentence(pattern.thesis || pattern.applicability)}${caveat}`;
}

function isEvidenceRequiredPattern(pattern: PatternSeed): boolean {
  return (
    pattern.id.startsWith("PAT-SRC-VPR-") ||
    pattern.id.startsWith("PAT-SRC-BEN-") ||
    pattern.id.startsWith("PAT-SRC-CGV-") ||
    pattern.id.startsWith("PAT-SRC-VPF-") ||
    pattern.id.startsWith("PAT-SRC-ART-")
  );
}

function isArtifactCategory(category?: SourcingCategory): boolean {
  return (
    category === "pricing_intelligence" ||
    category === "contract_intelligence" ||
    category === "process_methodology"
  );
}

function confidenceToSection(
  confidence: number,
): SourcePatternSectionContext["confidence"] {
  if (confidence >= 0.82) return "high";
  if (confidence >= 0.7) return "medium";
  return "low";
}

function trimSentence(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.replace(/[.。]?$/, ".");
}

function uniquePatternSections(
  sections: SourcePatternSectionContext[],
): SourcePatternSectionContext[] {
  const seen = new Set<string>();
  const uniqueSections: SourcePatternSectionContext[] = [];
  for (const section of sections) {
    if (seen.has(section.id)) continue;
    seen.add(section.id);
    uniqueSections.push(section);
  }
  return uniqueSections;
}

export function getSourceCorpusCommercialTraps(
  input: SourceCorpusVendorTrapInput,
): SourceCommercialTrap[] {
  if (!isApexAmsEvent(input)) return [];

  const traps: SourceCommercialTrap[] = [];
  const vendor = input.vendor;
  const exclusions = vendor.exclusions.join(" ").toLowerCase();
  const optionals = vendor.optionals.join(" ").toLowerCase();
  const hasTransitionAdder =
    vendor.transitionCostUsd > 0 || vendor.oneTimeSetupCostUsd > 0;

  if (hasTransitionAdder) {
    addCorpusTrap(traps, vendor, {
      category: "Corpus: AMS transition cost burial",
      signal:
        "Year-one comparison needs transition, reverse-shadowing, tooling handback, and retained-client effort pulled into TCO.",
      impact:
        "Run-rate-only savings can overstate economic value and mis-rank vendors.",
      recommendation:
        "Use transition-inclusive year-one TCO before shortlist lock.",
      severity: "high",
    });
  }

  if (vendor.automationProductivityAssumptionPercent > 0) {
    addCorpusTrap(traps, vendor, {
      category: "Corpus: automation commitment",
      signal:
        "Automation savings require milestones, baselines, remedies, and commercial holdback.",
      impact:
        "Productivity upside remains promotional unless it is contract-backed.",
      recommendation:
        "Convert automation claims into dated milestones, ticket-deflection baseline, and failure remedy.",
      severity:
        vendor.automationProductivityAssumptionPercent >= 20
          ? "high"
          : "medium",
    });
  }

  if (
    vendor.excludedServicesUsd > 0 ||
    /release|minor|tooling|api|change/.test(exclusions)
  ) {
    addCorpusTrap(traps, vendor, {
      category: "Corpus: scope exclusion recapture",
      signal:
        "Proposal can recover margin through excluded releases, minor enhancements, tooling, API support, or change control.",
      impact: "Apparent savings may move into post-award change orders.",
      recommendation:
        "Price excluded work or require an explicit CIO waiver before BAFO close.",
      severity: "high",
    });
  }

  if (vendor.offshorePercent !== undefined && vendor.offshorePercent > 60) {
    addCorpusTrap(traps, vendor, {
      category: "Corpus: offshore transition quality",
      signal:
        "Offshore-heavy delivery mix needs transition-quality safeguards for critical retail applications.",
      impact:
        "Labor arbitrage can increase stabilization and peak-support risk if transition assurance is weak.",
      recommendation:
        "Require named transition owners, key-staff continuity, and staged stabilization checkpoints.",
      severity: "medium",
    });
  }

  addCorpusTrap(traps, vendor, {
    category: "Corpus: retail peak support",
    signal:
      "Retail AMS pricing should be normalized against Q4 holiday peak, code-freeze, and store-system severity.",
    impact:
      "Average-month pricing can understate holiday operating risk for POS, OMS, WMS, and eCommerce flows.",
    recommendation:
      "Add Q4 peak support scenario and emergency-change coverage to the pricing template.",
    severity: "high",
  });

  if (
    !/benchmark|exit|handback/.test(optionals) &&
    !/benchmark|exit|handback/.test(exclusions)
  ) {
    addCorpusTrap(traps, vendor, {
      category: "Corpus: benchmarking and exit value protection",
      signal:
        "Benchmarking, exit assistance, and tooling/knowledge handback are not visible in the commercial row.",
      impact:
        "Multi-year savings may decay if Apex loses repricing or exit leverage.",
      recommendation:
        "Require annual benchmark rights, market-adjustment remedy, and exit-assistance rate card.",
      severity: "medium",
    });
  }

  return traps;
}

export function getSourceCorpusBafoAsks(
  input: SourceCorpusBafoInput,
): string[] {
  if (!isApexAmsEvent(input)) return [];

  const asks = new Set<string>([
    "Define a BAFO trade envelope with target and walk-away ranges across price, term, SLA, governance, benchmarking, exit, and change-control levers.",
    "Submit Q4 retail peak support pricing for POS, OMS, WMS, eCommerce, BOPIS, returns, code-freeze support, and emergency-change coverage.",
    "Convert automation savings into dated milestones, ticket-deflection baselines, commercial holdback, and failure remedies.",
    "Add annual benchmark rights, market-adjustment remedy, exit-assistance rate card, tooling handback, and knowledge-artifact transfer.",
    "Add transition holdback and stabilization warranty language tied to knowledge transfer, cutover, service readiness, and early-life SLA performance.",
    "Quantify any payment-term concession as a named discount or waived fee, with acceptance milestones and refund rights if stabilization fails.",
    "Add SLA credit step-ups for repeat misses, peak-window incidents, and critical-system failures rather than a flat credit table.",
    "Disclose subcontractors, delivery locations, data access, and buyer approval rights for material offshore or subcontractor changes.",
  ]);

  if (input.vendor?.pricingTemplateStatus !== "complete") {
    asks.add(
      "Resubmit a line-item pricing template that separates run rate, transition, retained-client work, one-time setup, and excluded scope.",
    );
  }
  if (
    input.snapshotCategories?.some((category) =>
      /scope exclusion|change-control/i.test(category),
    )
  ) {
    asks.add(
      "Price excluded releases, minor enhancements, tooling, API support, and change-control rates before BAFO scoring.",
    );
  }
  if (
    input.snapshotCategories?.some((category) =>
      /offshore|transition/i.test(category),
    )
  ) {
    asks.add(
      "Provide named transition leads, key-staff retention commitments, and stabilization checkpoints for offshore-heavy delivery.",
    );
  }

  return Array.from(asks);
}

export function getSourceCorpusAssumptionLocks(
  event: SourceCorpusEventRef,
): string[] {
  if (!isApexAmsEvent(event)) return [];

  return [
    "Retail Q4 peak, code-freeze, and store-hour support assumptions are locked before BAFO comparison.",
    "Run-rate savings remain provisional until transition-inclusive TCO and excluded-scope pricing are visible.",
    "Benchmarking, exit assistance, tooling handback, and knowledge-transfer rights are value-protection gates.",
    "Transition holdback, stabilization warranty, SLA credit step-ups, and payment-term trades are locked before final award recommendation.",
  ];
}

export function getSourceBafoContractUpliftPatterns() {
  return SOURCING_BAFO_CONTRACT_PATTERNS;
}

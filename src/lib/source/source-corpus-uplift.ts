import { SOURCING_PRICING_GAMING_PATTERNS } from "../intelligence/seed-patterns-sourcing-pricing-gaming";
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

const SOURCE1_PATTERN_IDS = [
  "PAT-SRC-PNG-001",
  "PAT-SRC-PNG-002",
  "PAT-SRC-PNG-003",
  "PAT-SRC-PNG-004",
  "PAT-SRC-PNG-005",
  "PAT-SRC-PNG-006",
  "PAT-SRC-PNG-007",
  "PAT-SRC-PNG-008",
  "PAT-SRC-PNG-009",
  "PAT-SRC-PNG-010",
  "PAT-SRC-PNG-011",
  "PAT-SRC-PNG-012",
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
  return SOURCING_PRICING_GAMING_PATTERNS.filter((pattern) =>
    (SOURCE1_PATTERN_IDS as readonly string[]).includes(pattern.id),
  );
}

export function getSourceCorpusUpliftPatternSections(
  event: SourceCorpusEventRef,
): SourcePatternSectionContext[] {
  if (!isApexAmsEvent(event)) return [];

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
  ];
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
  ];
}

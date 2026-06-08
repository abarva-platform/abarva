import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";
import { selectRelevantPatternRows } from "@/lib/intelligence-v3/pattern-relevance";
import {
  requiredGroundingForText,
  selectGroundedPattern,
  warnDroppedPatterns,
} from "@/lib/intelligence-v3/pattern-grounding";
import type {
  AntiPattern,
  BriefData,
  MapData,
  Pattern,
  Provenance,
  Regulatory,
  UseCase,
  Vendor,
} from "@/lib/knowledge-corpus/types";

interface ClientRow {
  id: string;
  key?: string | null;
  name: string;
}

interface CorpusPatternRow {
  slug: string;
  title: string;
  category: string | null;
  confidence: string | number | null;
  depth_score: string | number | null;
  vertical_overlays: string[] | null;
  region_overlays: string[] | null;
  published_at: string | null;
}

/** Treasury registry row from genome_patterns (LSH-TMS-* namespace). */
interface GenomeTreasuryRow {
  code: string;
  name: string;
  summary: string | null;
  confidence: string | number | null;
}

/** Map a treasury genome row into the CorpusPatternRow shape so the shared
 *  builders/relevance scoring work uniformly. slug = lowercased code, so
 *  buildPattern() emits the registry id (e.g. `LSH-TMS-002`). */
function treasuryRowToPatternRow(row: GenomeTreasuryRow): CorpusPatternRow {
  return {
    slug: row.code.toLowerCase(),
    title: row.name,
    category: "treasury",
    confidence: row.confidence ?? null,
    depth_score: row.confidence ?? null,
    vertical_overlays: ["treasury", "kyriba"],
    region_overlays: null,
    published_at: null,
  };
}

interface InitiativeRow {
  initiative_id: string;
  display_id: string | null;
  name: string;
  description: string | null;
  stage: string | null;
  owner_title: string | null;
  committed_annual_usd: string | number | null;
  measured_value_usd: string | number | null;
  status_flag: string | null;
  status_summary: string | null;
  confidence_level: string | null;
}

const BRAND = "#2563EB";
const REFRESHED = "2026-Q2";

function provenance(source: string): Provenance {
  return {
    primarySources: [
      {
        source,
        currencyDate: REFRESHED,
        reliability: "HIGH",
      },
    ],
    curationPass: "lakeshore-live-corpus-v1",
    notes:
      "Derived at runtime from live Lakeshore corpus_patterns rows and loaded Lakeshore initiative substrate.",
  };
}

function money(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyLabel(value: number): string {
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function domainFromCategory(category: string | null, slug: string): string {
  const fromCategory = category?.match(/D\d{2}/i)?.[0];
  if (fromCategory) return fromCategory.toUpperCase();
  const fromSlug = slug.match(/d\d{2}/i)?.[0];
  return fromSlug ? fromSlug.toUpperCase() : "D01";
}

function officeForDomain(domain: string): "front" | "middle" | "back" {
  if (["D02", "D03", "D04", "D05", "D13", "D17", "D18"].includes(domain))
    return "front";
  if (["D06", "D07", "D15", "D16"].includes(domain)) return "middle";
  return "back";
}

function lifecycleForStage(
  stage: string | null,
): "emerging" | "scaling" | "mature" | "declining" {
  const normalized = stage?.toLowerCase() ?? "";
  if (normalized.includes("scale") || normalized.includes("pilot"))
    return "scaling";
  if (normalized.includes("mature")) return "mature";
  if (normalized.includes("retire")) return "declining";
  return "emerging";
}

function engagementForStatus(
  status: string | null,
): "not_started" | "in_flight" | "scaled" | "failed" | "at_risk" {
  const normalized = status?.toLowerCase() ?? "";
  if (
    normalized.includes("risk") ||
    normalized.includes("blocked") ||
    normalized.includes("watch")
  )
    return "at_risk";
  if (normalized.includes("scale")) return "scaled";
  if (normalized.includes("fail")) return "failed";
  return "in_flight";
}

function buildPattern(row: CorpusPatternRow, useCaseIds: string[]): Pattern {
  const isTreasury = row.slug.toLowerCase().startsWith("lsh-tms-");
  const domain = domainFromCategory(row.category, row.slug);
  const sourceTable = isTreasury ? "genome_patterns" : "corpus_patterns";
  const sourceRef = isTreasury ? row.slug.toUpperCase() : row.slug;
  return {
    id: row.slug.toUpperCase(),
    name: row.title,
    scope: "industry_specific",
    applicableIndustries: ["finserv"],
    patternType: "success",
    description: `${row.title}. This is a Lakeshore ${isTreasury ? "treasury/Kyriba" : "private-holdings"} decision pattern loaded from the governed ${sourceTable} namespace, with category ${row.category ?? domain}.`,
    evidenceBasis: {
      observedInUseCases: useCaseIds,
      observationCount: `Live Lakeshore ${sourceTable} row`,
      confidence: Number(row.confidence ?? 0) >= 0.9 ? "HIGH" : "MED",
    },
    recommendedResponse:
      "Use this pattern as a decision check before advancing the related portfolio initiative or Source event.",
    relatedPatterns: [],
    provenance: provenance(`${sourceTable}:${sourceRef}`),
    lastRefreshed: "2026-06-04",
    refreshCadence: "quarterly",
  };
}

function buildUseCase(
  row: InitiativeRow,
  index: number,
  patterns: Pattern[],
): UseCase {
  const committed = money(row.committed_annual_usd);
  const measured = money(row.measured_value_usd);
  const id = `UC-LSH-${String(index + 1).padStart(3, "0")}`;
  const primaryPattern = patterns[index % Math.max(patterns.length, 1)]?.id;
  return {
    id,
    name: row.name,
    displayNameShort: row.display_id ?? row.initiative_id,
    industry: "finserv",
    office: officeForDomain(primaryPattern?.match(/D\d{2}/)?.[0] ?? "D14"),
    domainTags: [
      "private_holdings",
      "lakeshore",
      row.owner_title ?? "portfolio",
    ],
    problemStatement:
      row.description ??
      `${row.name} needs decision-grade evidence across Lakeshore's multi-entity portfolio.`,
    artOfPossibleFraming:
      row.status_summary ??
      `${row.name} is a governed Lakeshore initiative tied to loaded portfolio substrate.`,
    businessValueRanges: {
      perCompanySize: {
        mid: `${moneyLabel(committed)} committed annual value`,
        large: `${moneyLabel(measured || committed)} projected or measured value`,
      },
      timeToValueMonths: "6-18",
      confidenceBand:
        row.confidence_level?.toUpperCase() === "HIGH" ? "HIGH" : "MED",
    },
    lifecycleStage: lifecycleForStage(row.stage),
    successPatterns: patterns.slice(0, 3).map((pattern) => ({
      patternId: pattern.id,
      relevance: "HIGH",
    })),
    vendorLandscape: {
      incumbent: ["Current Lakeshore platform estate"],
      challenger: [],
      emerging: [],
    },
    siLandscape: {
      crediblePractice: [
        "portfolio transformation office",
        "treasury and data-platform delivery",
      ],
      emergingPractice: ["agentic decision-support with governed evidence"],
    },
    regulatoryContext: {
      applicable: [
        "Multi-entity governance",
        "Treasury controls",
        "AI decision-support review",
      ],
    },
    benchmarkMetrics: {
      primary: [
        {
          kpi: "Committed annual value",
          industryMedian: moneyLabel(committed),
          leadingIndicator: false,
        },
        {
          kpi: "Projected or measured value",
          industryMedian: moneyLabel(measured || committed),
          leadingIndicator: true,
        },
      ],
    },
    provenance: provenance(`ai_initiatives:${row.initiative_id}`),
    lastRefreshed: "2026-06-04",
    refreshCadence: "quarterly",
  };
}

function buildAntiPattern(pattern: Pattern, index: number): AntiPattern {
  return {
    id: `AP-LSH-${String(index + 1).padStart(3, "0")}`,
    name: `${pattern.name} ignored`,
    scope: "industry_specific",
    applicableIndustries: ["finserv"],
    relatedToPattern: pattern.id,
    description: `Lakeshore advances a decision without applying the pattern "${pattern.name}", leaving the operating or governance exception unresolved.`,
    observedInUseCases: pattern.evidenceBasis.observedInUseCases,
    observationCount:
      "Derived from live Lakeshore pattern and initiative linkage",
    quantifiedSignal: {
      withAntiPattern: {
        metric: "Decision quality",
        valueRange: "Exception unresolved",
      },
      withoutAntiPattern: {
        metric: "Decision quality",
        valueRange: "Evidence and owner named",
      },
      source:
        pattern.provenance.primarySources[0]?.source ?? "lakeshore corpus",
      confidence: "MED",
    },
    earlySignals: [
      {
        signal:
          "Pattern is cited after the gate instead of before the decision",
        severity: "HIGH",
      },
    ],
    typicalRecovery:
      "Reopen the gate, assign the decision owner, and attach the missing evidence before executive approval.",
    preventionPatterns: [pattern.id],
    provenance: pattern.provenance,
    lastRefreshed: "2026-06-04",
  };
}

function buildCorpusBackedCandidateRows(
  rows: ReadonlyArray<CorpusPatternRow>,
): InitiativeRow[] {
  return rows.slice(0, 6).map((row, index) => ({
    initiative_id: `corpus-backed-${row.slug}`,
    display_id: `LSH-CORPUS-${String(index + 1).padStart(2, "0")}`,
    name: row.title,
    description:
      `Corpus-backed candidate generated from ${row.slug.toUpperCase()}; ` +
      "live ai_initiatives substrate is not loaded for this client row yet.",
    stage: "candidate",
    owner_title: row.category?.toLowerCase().includes("treasury")
      ? "CFO / Treasury sponsor"
      : "Portfolio operating owner",
    committed_annual_usd: null,
    measured_value_usd: null,
    status_flag: "candidate",
    status_summary:
      "Candidate surfaced from Lakeshore corpus; convert to a Strategic Move before treating as a funded initiative.",
    confidence_level: Number(row.confidence ?? 0) >= 0.9 ? "HIGH" : "MED",
  }));
}

const CONTROL_VENDOR: Vendor = {
  id: "V-LSH-CONTROL-PLANE",
  name: "Lakeshore governed platform estate",
  productLines: [
    {
      productName: "Treasury, portfolio reporting, and evidence spine",
      servesUseCases: [],
    },
  ],
  vendorType: "incumbent",
  financialHealth: "moderate",
  shareTrajectory: "holding",
  trajectorySignalBasis:
    "Loaded Lakeshore substrate names portfolio systems and Source/Tower evidence paths.",
  contractPatterns: {
    pricingModels: ["portfolio platform run-rate", "implementation services"],
    negotiationLevers:
      "Tie renewal and implementation spend to evidence readiness and decision adoption.",
  },
  provenance: provenance("lakeshore product substrate"),
  lastRefreshed: "2026-06-04",
  refreshCadence: "quarterly",
};

const GOVERNANCE_REGULATORY: Regulatory = {
  id: "REG-LSH-GOV-001",
  name: "HoldCo treasury and AI decision-support governance",
  jurisdiction:
    "United States, Illinois, and portfolio-company operating jurisdictions",
  issuingBody:
    "Internal governance, accounting, tax, and AI decision-support controls",
  applicableIndustries: ["finserv"],
  summary:
    "Lakeshore decisions must preserve multi-entity governance, treasury controls, audit evidence, and human approval for AI-assisted recommendations.",
  keyRequirements: [
    "Named decision owner before material action",
    "Evidence trace for value and risk claims",
    "Human approval before external action or spend commitment",
  ],
  provenance: provenance("lakeshore governance substrate"),
  lastRefreshed: "2026-06-04",
  refreshCadence: "quarterly",
};

export async function loadLakeshoreIntelligenceData(
  client: ClientRow,
): Promise<{ mapData: MapData; briefData: BriefData } | null> {
  const [patternRows, treasuryPatternRows, initiativeRows] = await Promise.all([
    azureRead.query<CorpusPatternRow>(
      `SELECT slug, title, category, confidence, depth_score, vertical_overlays, region_overlays, published_at
       FROM corpus_patterns
       WHERE slug LIKE 'pat-lsh-%'
         AND status = 'published'
         AND retired_at IS NULL
       ORDER BY depth_score DESC NULLS LAST, published_at DESC NULLS LAST, slug ASC
       LIMIT 24`,
    ),
    // Treasury grounding namespace: the LSH-TMS-* registry lives in genome_patterns
    // (and Azure Search lakeshore-patterns-v1), NOT in the corpus 'pat-lsh-%' set.
    // Treasury/Kyriba decision cards must bind from THIS namespace.
    azureRead
      .query<GenomeTreasuryRow>(
        `SELECT code, name, summary, confidence
         FROM genome_patterns
         WHERE code LIKE 'LSH-TMS-%'
         ORDER BY confidence DESC NULLS LAST, code ASC
         LIMIT 24`,
      )
      .catch(() => [] as GenomeTreasuryRow[]),
    azureRead.query<InitiativeRow>(
      `SELECT initiative_id, display_id, name, description, stage, owner_title,
              committed_annual_usd, measured_value_usd, status_flag, status_summary, confidence_level
       FROM ai_initiatives
       WHERE client_id = $1
       ORDER BY measured_value_usd DESC NULLS LAST, committed_annual_usd DESC NULLS LAST, display_id ASC
       LIMIT 8`,
      [client.id],
    ),
  ]);

  if (patternRows.length === 0) return null;

  // Candidate rows mapped into the treasury grounding namespace.
  const treasuryRows = treasuryPatternRows.map(treasuryRowToPatternRow);
  const hasInitiativeSubstrate = initiativeRows.length > 0;
  const effectiveInitiativeRows = hasInitiativeSubstrate
    ? initiativeRows
    : buildCorpusBackedCandidateRows([...treasuryRows, ...patternRows]);

  const seedUseCaseIds = effectiveInitiativeRows
    .slice(0, 6)
    .map((_, index) => `UC-LSH-${String(index + 1).padStart(3, "0")}`);
  const patterns = patternRows
    .slice(0, 6)
    .map((row) => buildPattern(row, seedUseCaseIds));
  const antiPatterns = patterns.slice(0, 3).map(buildAntiPattern);
  const useCases = effectiveInitiativeRows
    .slice(0, 6)
    .map((row, index) => buildUseCase(row, index, patterns));
  CONTROL_VENDOR.productLines[0]!.servesUseCases = useCases.map(
    (useCase) => useCase.id,
  );

  const nodes = useCases.map((useCase, index) => ({
    useCase,
    x: 20 + index * 11,
    y: 82 - index * 7,
    r: 18 - Math.min(index, 5),
    engagementState: engagementForStatus(
      effectiveInitiativeRows[index]?.status_flag ?? null,
    ),
    initiativeDisplayId: effectiveInitiativeRows[index]?.display_id ?? undefined,
    score: 90 - index * 4,
  }));

  const totalProjected = effectiveInitiativeRows.reduce(
    (sum, row) =>
      sum + money(row.measured_value_usd || row.committed_annual_usd),
    0,
  );
  const totalCommitted = effectiveInitiativeRows.reduce(
    (sum, row) => sum + money(row.committed_annual_usd),
    0,
  );

  const mapData: MapData = {
    tenantName: client.name,
    tenantBrandColor: BRAND,
    industry: "finserv",
    totalUseCases: useCases.length,
    inFlightCount: hasInitiativeSubstrate ? useCases.length : 0,
    atRiskCount: nodes.filter((node) => node.engagementState === "at_risk")
      .length,
    candidateCount: hasInitiativeSubstrate ? 0 : useCases.length,
    refreshedLabel: "2026-Q2",
    whatChanged: patterns.slice(0, 4).map((pattern) => ({
      entityId: pattern.id,
      entityType: "pattern",
      summary: pattern.name,
      source:
        pattern.provenance.primarySources[0]?.source ?? "lakeshore corpus",
    })),
    nodes,
    edges: nodes.slice(1).map((node, index) => ({
      fromUseCaseId: nodes[index]!.useCase.id,
      toUseCaseId: node.useCase.id,
      basis: "pattern_cooccurrence",
      patternId: patterns[index % patterns.length]!.id,
    })),
    defaultSelectedId: nodes[0]!.useCase.id,
  };

  const briefData: BriefData = {
    tenantName: client.name,
    tenantBrandColor: BRAND,
    industry: "finserv",
    composedAt: "2026-06-04T00:00:00.000Z",
    synthesis: hasInitiativeSubstrate
      ? `Lakeshore's Intelligence brief is now bound to live Lakeshore substrate: ${patternRows.length} high-depth decision patterns in the current view, ${initiativeRows.length} loaded initiatives, and no Apex/Meridian fixture content. The strongest proof points are Treasury/Kyriba, the shared data evidence spine, and portfolio modernization bets that require named owners and evidence before decisions move.`
      : `Lakeshore's Intelligence brief is now bound to live Lakeshore corpus patterns, but live ai_initiatives substrate is not loaded for this client row yet. This is a corpus-backed candidate view: it may surface Treasury/Kyriba and HoldCo governance patterns, but funded initiative value and gate status must be created through Strategic Moves before executive action.`,
    valueAtStake: [
      {
        label: "Projected portfolio value",
        value: moneyLabel(totalProjected),
        captured: 35,
        blocked: 20,
        candidate: 25,
        tone: "teal",
      },
      {
        label: "Committed annual value",
        value: moneyLabel(totalCommitted),
        captured: 30,
        blocked: 15,
        candidate: 20,
        tone: "navy",
      },
      {
        label: "Evidence-gated decisions",
        value: `${patterns.length} patterns active`,
        captured: 25,
        blocked: 25,
        candidate: 30,
        tone: "amber",
      },
    ],
    openTensions: [
      {
        title: "Permanent-capital patience vs. operating proof",
        body: "Lakeshore can hold through cycles, but the AI portfolio still needs owner-named evidence before executive decisions move.",
        severity: "amber",
      },
      {
        title: "Treasury modernization vs. multi-entity controls",
        body: "Kyriba and data-spine benefits are most credible when intercompany, bank-connectivity, and governance evidence stay attached.",
        severity: "red",
      },
    ],
    bets: useCases.slice(0, 3).map((useCase, index) => ({
      rank: index + 1,
      useCase,
      score: 90 - index * 4,
      scoreFactors: [
        {
          name: hasInitiativeSubstrate
            ? "Loaded Lakeshore initiative substrate"
            : "Corpus-backed candidate; initiative substrate pending",
          delta: hasInitiativeSubstrate ? 24 : 8,
          isWarning: !hasInitiativeSubstrate,
        },
        { name: "Bound to live Lakeshore corpus pattern", delta: 22 },
        {
          name: "Requires named evidence owner before gate movement",
          delta: -6,
          isWarning: true,
        },
        { name: "Portfolio value path is visible", delta: 20 },
      ],
      engagementState: nodes[index]?.engagementState ?? "in_flight",
      initiativeDisplayId: nodes[index]?.initiativeDisplayId,
      measuredVsCommitted: {
        measured: money(effectiveInitiativeRows[index]?.measured_value_usd),
        committed: money(effectiveInitiativeRows[index]?.committed_annual_usd),
      },
      decision: {
        kind: index === 0 ? "approve_scale" : "evaluate",
        label:
          index === 0 ? "Gate on treasury proof" : "Evaluate with evidence",
        reason:
          "Advance only where Source/Tower evidence and accountable owner are visible.",
      },
      // Relevance-bound + grounding-namespace validated + fail-closed: pick the
      // pattern actually about this bet's use case AND in the namespace the card
      // requires. A treasury/Kyriba bet binds only the treasury (LSH-TMS-*)
      // namespace; a corpus pattern like PAT-LSH-D18-00479 can never land on it.
      // Empty when nothing clears relevance + grounding — no off-namespace cite.
      bindingPatterns: (() => {
        const useCaseText = `${effectiveInitiativeRows[index]?.name ?? useCase.name} ${effectiveInitiativeRows[index]?.description ?? ""}`;
        const required = requiredGroundingForText(useCaseText);
        const pool = required === "treasury" ? treasuryRows : patternRows;
        const relevant = selectRelevantPatternRows(useCaseText, pool, 3);
        const decision = selectGroundedPattern({
          required,
          candidates: relevant,
          idOf: (row) => row.slug,
        });
        warnDroppedPatterns(`brief bet "${useCase.name}"`, decision.dropped);
        const boundRows = decision.bound ? [decision.bound] : [];
        return boundRows.map((row) => {
          const pattern = buildPattern(row, seedUseCaseIds);
          return {
            pattern,
            quantifiedRow: {
              withLabel: "+ Pattern applied",
              withoutLabel: "- Decision theater",
              description: pattern.description,
              source:
                pattern.provenance.primarySources[0]?.source ??
                "lakeshore corpus",
            },
          };
        });
      })(),
      antiPatterns: antiPatterns.slice(index, index + 1).map((antiPattern) => ({
        antiPattern,
        description: antiPattern.description,
        source:
          antiPattern.provenance.primarySources[0]?.source ??
          "lakeshore corpus",
      })),
      vendors: [
        {
          vendor: CONTROL_VENDOR,
          tier: "incumbent",
          healthLabel: "Governed estate",
          isCurrent: true,
        },
      ],
      regulatory: [
        { regulatory: GOVERNANCE_REGULATORY, currencyDate: REFRESHED },
      ],
    })),
    belowTheLine: useCases.slice(3).map((useCase, index) => ({
      rank: index + 4,
      useCaseId: useCase.id,
      useCaseName: useCase.name,
      score: 76 - index * 3,
      state: "in_portfolio",
      initiativeDisplayId: nodes[index + 3]?.initiativeDisplayId,
      valueLabel: moneyLabel(
        money(
          effectiveInitiativeRows[index + 3]?.measured_value_usd ||
            effectiveInitiativeRows[index + 3]?.committed_annual_usd,
        ),
      ),
      ttvLabel: "6-18 mo",
      hint: "Track as a portfolio bet; use the cited Lakeshore pattern before gate movement.",
    })),
    patternsTriggered: patterns.slice(0, 3).map((pattern) => ({
      pattern,
      issue: `${pattern.name} is active in the Lakeshore corpus and should govern the related initiative gate.`,
      recommendedAction:
        "Open the related Move or Source event and attach the decision artifact before executive review.",
      cta: {
        primary: { label: "Open Moves", href: "/strategic-moves" },
        secondary: { label: "Open Tower", href: "/tower" },
      },
    })),
    proofPoints: [],
    totals: {
      totalUseCases: useCases.length,
      totalPatterns: patternRows.length,
      totalVendors: 1,
      totalRegulatory: 1,
      refreshCadence: "quarterly",
      lastRefreshQuarter: REFRESHED,
    },
  };

  return { mapData, briefData };
}

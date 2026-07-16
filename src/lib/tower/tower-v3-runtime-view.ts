import type {
  TowerContextPack,
  TowerMetricRecord,
  TowerValueClaim,
  TowerValueRecord,
} from "@/lib/enterprise-knowledge/contracts";

export interface TowerV3GapTheme {
  themeId: string;
  title: string;
  whyItMatters: string;
  affectedRecordCount: number;
  representativeEvidenceRefs: string[];
  requiredEvidence: string[];
  ownerOrSteward: string | null;
  moduleHandoff: "Tower" | "Moves" | "Source" | "Admin";
}

export interface TowerV3RuntimeMetricFamily {
  label: string;
  baselineStatus: string;
  targetStatus: string;
  evidenceStatus: string;
  sourceDimension: string;
  evidenceIds: string[];
}

export type TowerV3DefaultTabKey =
  | "overview"
  | "value"
  | "budget"
  | "portfolio"
  | "benchmark"
  | "evidence"
  | "insights";

export type TowerV3TabSourceClassification =
  | "tower_context_pack_v3_derived"
  | "tower_projection_v3_derived";

export interface TowerV3RuntimeTab {
  key: TowerV3DefaultTabKey;
  label: string;
  sourceClassification: TowerV3TabSourceClassification;
  sourcePosture: string;
  businessPosture: string;
  rows: number;
  evidenceRefs: string[];
  caveat: string;
}

export type TowerCxoVisualType =
  | "executive_brief"
  | "value_waterfall"
  | "budget_mix"
  | "portfolio_lanes"
  | "benchmark_blockers"
  | "evidence_checklist"
  | "role_decision_cards";

export interface TowerCxoStoryTab {
  key: TowerV3DefaultTabKey;
  headline: string;
  summary: string;
  decisionImplication: string;
  nextAction: string;
  visualType: TowerCxoVisualType;
}

export interface TowerCxoStoryCard {
  label: string;
  value: string;
  caption: string;
}

export interface TowerCxoStory {
  tenantDisplayName: string;
  eyebrow: string;
  headline: string;
  executiveBrief: string;
  cards: TowerCxoStoryCard[];
  tabs: Record<TowerV3DefaultTabKey, TowerCxoStoryTab>;
}

export type TowerExecutiveRole = "CIO" | "CFO";
export type TowerExecutiveClaimStrength =
  | "measured"
  | "baseline_ready"
  | "hypothesis"
  | "evidence_gap";

export interface TowerExecutiveInsight {
  role: TowerExecutiveRole;
  insightTitle: string;
  insightSummary: string;
  whyItMatters: string;
  evidenceBasis: string;
  decisionImplication: string;
  nextAction: string;
  moduleHandoff: "Tower" | "Moves" | "Source" | "Admin";
  claimStrength: TowerExecutiveClaimStrength;
  evidenceRefsUsed: string[];
  contextGapsUsed: string[];
  valueClaimGateStatus: TowerValueClaim["gateStatus"];
  watchOut?: string;
}

export interface TowerV3RuntimeViewModel {
  enabled: true;
  tenantKey: string;
  tenantName: string;
  contextPackId: string;
  headline: string;
  mode: TowerContextPack["mode"];
  truthStatus: TowerContextPack["truthStatus"];
  cxoStory: TowerCxoStory;
  metricCount: number;
  valueRecordCount: number;
  valueClaimCount: number;
  gateCounts: Record<TowerValueClaim["gateStatus"], number>;
  measurementLanguageAllowed: boolean;
  blockedOutcomeProof: boolean;
  metricFamilies: TowerV3RuntimeMetricFamily[];
  valueHypotheses: Array<{
    label: string;
    value: string;
    claimBasis: TowerValueRecord["claimBasis"];
    gateStatus: TowerValueClaim["gateStatus"];
    evidenceIds: string[];
  }>;
  defaultTabs: TowerV3RuntimeTab[];
  executiveInsights: TowerExecutiveInsight[];
  gapThemes: TowerV3GapTheme[];
  caveats: string[];
  nextMeasurementActions: string[];
  bridgeDiagnostics: {
    source: "cio_tower";
    projectionRole: "derived_read_model";
    sourceOfTruthStatus: "bridge_only";
    v3ReconciliationStatus: "not_v3_reconciled";
    message: string;
  };
}

const DEFAULT_REQUIRED_EVIDENCE = [
  "source-owner attestation",
  "measurement period and formula lineage",
  "finance-attested actuals where value is claimed",
];

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function evidenceIdsForRecords(
  records: readonly (TowerMetricRecord | TowerValueRecord)[],
): string[] {
  return unique(records.flatMap((record) => record.evidenceIds)).slice(0, 5);
}

function evidenceIdsForRecordsOrPack(
  records: readonly (TowerMetricRecord | TowerValueRecord)[],
  pack: TowerContextPack,
): string[] {
  const recordEvidence = evidenceIdsForRecords(records);
  if (recordEvidence.length > 0) return recordEvidence;
  return unique(pack.evidence.map((item) => item.evidenceId)).slice(0, 5);
}

function gapIdsForPack(pack: TowerContextPack, pattern: RegExp, limit = 4): string[] {
  const matches = pack.gaps
    .filter((gap) => pattern.test(`${gap.title} ${gap.description}`))
    .map((gap) => gap.gapId);
  if (matches.length > 0) return unique(matches).slice(0, limit);
  return pack.gaps.map((gap) => gap.gapId).slice(0, limit);
}

function evidenceForPackPattern(
  pack: TowerContextPack,
  pattern: RegExp,
  limit = 5,
): string[] {
  const records = [...pack.towerMetricRecords, ...pack.towerValueRecords].filter(
    (record) => pattern.test(`${record.label} ${compactValue(record.value)} ${record.sourceDimension}`),
  );
  const evidence = evidenceIdsForRecords(records);
  if (evidence.length > 0) return evidence.slice(0, limit);
  return pack.evidence.map((item) => item.evidenceId).slice(0, limit);
}

function compactValue(value: unknown): string {
  if (typeof value === "number") {
    if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return String(Math.round(value));
  }
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return "structured value";
  return String(value ?? "not loaded");
}

function executiveTenantDisplayName(tenantKey: string, tenantName: string): string {
  if (tenantKey === "meridian-health" || /meridian|healthcare demo/i.test(tenantName)) {
    return "Meridian";
  }
  return tenantName.replace(/\s+Demo$/i, "").trim() || tenantName;
}

function sumNumericValues(records: readonly TowerValueRecord[]): number {
  return records.reduce((total, record) => {
    if (typeof record.value !== "number" || !Number.isFinite(record.value)) return total;
    return total + record.value;
  }, 0);
}

function firstValueClaimForRecord(
  record: TowerValueRecord,
  claims: readonly TowerValueClaim[],
): TowerValueClaim | null {
  return claims.find((claim) => claim.sourceFactIds.includes(record.valueRecordId)) ?? null;
}

function buildMetricFamilies(pack: TowerContextPack): TowerV3RuntimeMetricFamily[] {
  const preferred = [
    /aht|average handle/i,
    /fcr|first contact/i,
    /transfer/i,
    /repeat contact/i,
    /csat|satisfaction/i,
    /cost per contact/i,
    /agent assist/i,
    /freshness/i,
    /quality/i,
    /incident/i,
    /audit/i,
    /medallion/i,
    /semantic/i,
    /lineage/i,
    /maintenance/i,
    /net-new/i,
  ];
  const selected: TowerMetricRecord[] = [];
  for (const pattern of preferred) {
    const match = pack.towerMetricRecords.find(
      (record) => pattern.test(record.label) && !selected.some((item) => item.metricId === record.metricId),
    );
    if (match) selected.push(match);
  }
  for (const record of pack.towerMetricRecords) {
    if (selected.length >= 12) break;
    if (!selected.some((item) => item.metricId === record.metricId)) selected.push(record);
  }
  return selected.slice(0, 12).map((record) => ({
    label: record.label,
    baselineStatus: "baseline needed",
    targetStatus: record.valueType === "string" ? compactValue(record.value) : "target proposed",
    evidenceStatus: record.evidenceIds.length > 0 ? "evidence required before outcome proof" : "evidence missing",
    sourceDimension: record.sourceDimension,
    evidenceIds: record.evidenceIds.slice(0, 3),
  }));
}

export function aggregateTowerV3GapThemes(pack: TowerContextPack): TowerV3GapTheme[] {
  const records = [...pack.towerMetricRecords, ...pack.towerValueRecords];
  const allEvidence = pack.evidence;
  const firstOwner = allEvidence.find((item) => item.sourceOwner)?.sourceOwner ?? null;
  const byDimension = (dimension: string) =>
    records.filter((record) => record.sourceDimension === dimension);
  const byText = (pattern: RegExp) =>
    records.filter((record) => pattern.test(record.label));
  const allRecordCount = records.length;
  const themes: TowerV3GapTheme[] = [
    {
      themeId: "baseline-metrics-need-validation",
      title: "Baseline metrics need validation",
      whyItMatters:
        "Tower can name the metrics to track, but a CXO should not treat targets as current performance until baselines are validated.",
      affectedRecordCount: Math.max(byDimension("14_metrics_outcomes").length, 1),
      representativeEvidenceRefs: evidenceIdsForRecords(byDimension("14_metrics_outcomes")),
      requiredEvidence: ["baseline extract", "metric definition owner", "measurement cadence"],
      ownerOrSteward: firstOwner,
      moduleHandoff: "Tower",
    },
    {
      themeId: "value-claims-planning-grade-only",
      title: "Value claims are planning-grade only",
      whyItMatters:
        "The pack can support value-hypothesis planning, but finance-attested measurement evidence is not yet available.",
      affectedRecordCount: Math.max(pack.towerValueRecords.length, 1),
      representativeEvidenceRefs: evidenceIdsForRecords(pack.towerValueRecords),
      requiredEvidence: ["finance-attested actuals", "baseline assumption", "benefit calculation owner"],
      ownerOrSteward: firstOwner,
      moduleHandoff: "Tower",
    },
    {
      themeId: "data-foundation-target-state-not-certified",
      title: "AWS/Databricks foundation is target-state, not production-certified",
      whyItMatters:
        "Agent Assist and data-foundation decisions depend on certified platform, medallion, security, and lineage evidence.",
      affectedRecordCount: Math.max(
        byText(/aws|databricks|medallion|semantic|lineage|freshness|quality/i).length,
        1,
      ),
      representativeEvidenceRefs: evidenceIdsForRecordsOrPack(
        byText(/aws|databricks|medallion|semantic|lineage|freshness|quality/i),
        pack,
      ),
      requiredEvidence: ["platform certification", "medallion layer proof", "security control evidence"],
      ownerOrSteward: firstOwner,
      moduleHandoff: "Moves",
    },
    {
      themeId: "operational-evidence-needs-owner-confirmation",
      title: "Operational evidence needs owner confirmation",
      whyItMatters:
        "Process evidence is useful for readiness, but Tower needs accountable business owners before it becomes board-grade measurement context.",
      affectedRecordCount: Math.max(byDimension("18_operational_process_evidence").length, 1),
      representativeEvidenceRefs: evidenceIdsForRecordsOrPack(
        byDimension("18_operational_process_evidence"),
        pack,
      ),
      requiredEvidence: ["process owner confirmation", "workflow volume extract", "control-point signoff"],
      ownerOrSteward: firstOwner,
      moduleHandoff: "Admin",
    },
    {
      themeId: "managed-services-contract-sla-incomplete",
      title: "Managed services / contract / SLA evidence is incomplete",
      whyItMatters:
        "Tower can show service-scope readiness, but managed-service value should not move without contract, SLA, and scope evidence.",
      affectedRecordCount: Math.max(byDimension("17_service_scope_managed_services").length, 1),
      representativeEvidenceRefs: evidenceIdsForRecordsOrPack(
        byDimension("17_service_scope_managed_services"),
        pack,
      ),
      requiredEvidence: ["service scope", "SLA or KPI schedule", "contract or managed-service baseline"],
      ownerOrSteward: firstOwner,
      moduleHandoff: "Source",
    },
    {
      themeId: "source-system-lineage-incomplete",
      title: "Source-system lineage incomplete",
      whyItMatters:
        "Tower should keep lineage visible because the pack is not yet a fully reconciled outcome ledger.",
      affectedRecordCount: allRecordCount,
      representativeEvidenceRefs: unique(allEvidence.map((item) => item.evidenceId)).slice(0, 5),
      requiredEvidence: DEFAULT_REQUIRED_EVIDENCE,
      ownerOrSteward: firstOwner,
      moduleHandoff: "Admin",
    },
  ];
  return themes.filter((theme) => theme.affectedRecordCount > 0);
}

function buildTowerV3DefaultTabs(args: {
  pack: TowerContextPack;
  valueHypotheses: TowerV3RuntimeViewModel["valueHypotheses"];
  gapThemes: TowerV3GapTheme[];
  executiveInsights: TowerExecutiveInsight[];
}): TowerV3RuntimeTab[] {
  const { pack, valueHypotheses, gapThemes, executiveInsights } = args;
  const packEvidence = pack.evidence.map((item) => item.evidenceId);
  return [
    {
      key: "overview",
      label: "Overview",
      sourceClassification: "tower_context_pack_v3_derived",
      sourcePosture: "v3 context-derived measurement and readiness view",
      businessPosture: "CIO/CFO value cockpit",
      rows: pack.towerMetricRecords.length + pack.towerValueRecords.length,
      evidenceRefs: packEvidence.slice(0, 5),
      caveat: "Outcome proof is blocked until value claims pass the TowerValueClaim gate.",
    },
    {
      key: "value",
      label: "Value",
      sourceClassification: "tower_projection_v3_derived",
      sourcePosture: "value hypotheses from active v3 program context",
      businessPosture: "Planned value and proof gaps",
      rows: valueHypotheses.length,
      evidenceRefs: unique(valueHypotheses.flatMap((item) => item.evidenceIds)).slice(0, 5),
      caveat: "Values are forecast or planning-grade until finance evidence is reconciled.",
    },
    {
      key: "budget",
      label: "Budget",
      sourceClassification: "tower_projection_v3_derived",
      sourcePosture: "spend and value signals from v3 spend/value context",
      businessPosture: "Budget pressure and validation needs",
      rows: pack.towerMetricRecords.filter((record) => record.sourceDimension === "08_spend_value").length,
      evidenceRefs: evidenceForPackPattern(pack, /spend|budget|maintenance|net-new|value/i),
      caveat: "Budget actuals stay planning-grade unless a finance-controlled extract is loaded.",
    },
    {
      key: "portfolio",
      label: "Portfolio",
      sourceClassification: "tower_projection_v3_derived",
      sourcePosture: "program and initiative records from active v3 context",
      businessPosture: "Programs to govern, fund, or hold",
      rows: pack.towerValueRecords.filter((record) => record.sourceDimension === "09_programs_initiatives").length,
      evidenceRefs: evidenceForPackPattern(pack, /program|initiative|agent|analytics|automation|platform/i),
      caveat: "Programs are not approved investments unless promotion and governance evidence support them.",
    },
    {
      key: "benchmark",
      label: "Benchmark",
      sourceClassification: "tower_context_pack_v3_derived",
      sourcePosture: "benchmark context and blocker themes only",
      businessPosture: "Comparator lens and realization blockers",
      rows: gapThemes.length,
      evidenceRefs: unique(gapThemes.flatMap((theme) => theme.representativeEvidenceRefs)).slice(0, 5),
      caveat: "This tab does not imply tenant performance against benchmark without tenant baselines and actuals.",
    },
    {
      key: "evidence",
      label: "Evidence",
      sourceClassification: "tower_context_pack_v3_derived",
      sourcePosture: "evidence refs, context gaps, and claim gates from TowerContextPack",
      businessPosture: "Proof, lineage, and diagnostics",
      rows: pack.evidence.length + pack.gaps.length,
      evidenceRefs: packEvidence.slice(0, 5),
      caveat: "Bridge rows remain diagnostic only until reconciled to governed facts and evidence.",
    },
    {
      key: "insights",
      label: "Insights",
      sourceClassification: "tower_projection_v3_derived",
      sourcePosture: "role-specific executive insights derived from the same v3 pack",
      businessPosture: "CIO and CFO decision moves",
      rows: executiveInsights.length,
      evidenceRefs: unique(executiveInsights.flatMap((item) => item.evidenceRefsUsed)).slice(0, 5),
      caveat: "Insights are decision guidance, not financial outcome proof.",
    },
  ];
}

function buildTowerExecutiveInsights(args: {
  pack: TowerContextPack;
  gateCounts: Record<TowerValueClaim["gateStatus"], number>;
}): TowerExecutiveInsight[] {
  const { pack, gateCounts } = args;
  const defaultGate: TowerValueClaim["gateStatus"] =
    gateCounts.allowed > 0 ? "allowed" : gateCounts.caveated > 0 ? "caveated" : "blocked";
  const foundationEvidence = evidenceForPackPattern(
    pack,
    /aws|databricks|medallion|semantic|lineage|freshness|quality|identity/i,
  );
  const agentAssistEvidence = evidenceForPackPattern(
    pack,
    /agent assist|contact|aht|first contact|repeat contact|transfer|csat|member/i,
  );
  const programEvidence = evidenceForPackPattern(
    pack,
    /program|initiative|expected|planned|forecast|automation|analytics/i,
  );
  const serviceEvidence = evidenceForPackPattern(pack, /service|contract|sla|vendor|managed/i);
  const baselineGaps = gapIdsForPack(pack, /baseline|metric|actual|cadence|formula/i);
  const foundationGaps = gapIdsForPack(pack, /aws|databricks|platform|lineage|identity|certif/i);
  const valueGaps = gapIdsForPack(pack, /value|finance|actual|baseline|benefit/i);
  const serviceGaps = gapIdsForPack(pack, /contract|sla|vendor|service|scope/i);

  return [
    {
      role: "CIO",
      insightTitle: "The data foundation is the critical path.",
      insightSummary:
        "The same readiness blockers show up across platform, analytics, and AI use cases: certified lineage, semantic ownership, identity, and operating controls.",
      whyItMatters:
        "If the CIO funds use cases before the shared foundation is certified, Tower will keep showing attractive hypotheses without production-safe execution gates.",
      evidenceBasis:
        "TowerMetricRecords from spend/value and metrics/outcomes context, plus foundation-related context gaps.",
      decisionImplication:
        "Treat AWS/Databricks and identity readiness as shared transformation infrastructure, not as a downstream enhancement.",
      nextAction:
        "Move the lakehouse foundation, identity spine, and data-product certification gates into a phase-gated Moves plan.",
      moduleHandoff: "Moves",
      claimStrength: "evidence_gap",
      evidenceRefsUsed: foundationEvidence,
      contextGapsUsed: foundationGaps,
      valueClaimGateStatus: defaultGate,
      watchOut:
        "Do not move healthcare AI into production scale until PHI controls, lineage, and integration paths are evidenced.",
    },
    {
      role: "CIO",
      insightTitle: "Agent Assist is a transformation bet, not just a contact-center tool.",
      insightSummary:
        "Agent Assist depends on transcript, CRM, claims, intent, QA-label, and operating process evidence; those dependencies make it a platform and workflow readiness decision.",
      whyItMatters:
        "The value case can be framed, but the CIO needs baseline and workflow evidence before promising operational impact.",
      evidenceBasis:
        "TowerMetricRecords tied to contact-center and operational process context with evidence refs and gaps.",
      decisionImplication:
        "Keep Agent Assist in measurement design until AHT, containment, quality, PHI, and owner signoff are loaded.",
      nextAction:
        "Create a 30-day measurement sprint for contact-center baseline, QA-label evidence, and control ownership.",
      moduleHandoff: "Tower",
      claimStrength: "hypothesis",
      evidenceRefsUsed: agentAssistEvidence,
      contextGapsUsed: baselineGaps,
      valueClaimGateStatus: defaultGate,
      watchOut:
        "A compelling use case can still fail the gate if the source system lineage and workflow owners are unclear.",
    },
    {
      role: "CFO",
      insightTitle: "Value is visible, but not claimable yet.",
      insightSummary:
        "Tower can show value hypotheses from active program context, but the claim gate blocks outcome-proof language because finance-attested actuals and baselines are not reconciled.",
      whyItMatters:
        "This protects board communications: the CFO can discuss expected value and measurement readiness without overstating results.",
      evidenceBasis:
        "TowerValueRecords and TowerValueClaims from program context, with caveated claim-gate status.",
      decisionImplication:
        "Approve measurement design and baseline ownership before approving value commitments.",
      nextAction:
        "Assign finance owners for baselines, actuals, benefit formulas, and reporting cadence before board use.",
      moduleHandoff: "Tower",
      claimStrength: "hypothesis",
      evidenceRefsUsed: programEvidence,
      contextGapsUsed: valueGaps,
      valueClaimGateStatus: defaultGate,
      watchOut:
        "Do not present forecast value as certified performance until the TowerValueClaim gate allows it.",
    },
    {
      role: "CFO",
      insightTitle: "Source needs contract economics before commercial benefit claims.",
      insightSummary:
        "Managed-service, vendor, SLA, and scope evidence is still incomplete, so Tower should not convert sourcing or operational ideas into commercial benefit claims.",
      whyItMatters:
        "Without contract economics and service baselines, the CFO cannot separate cost avoidance, budget movement, and measurable benefit.",
      evidenceBasis:
        "Service-scope records, contract/SLA blocker themes, and supporting evidence refs from the v3 pack.",
      decisionImplication:
        "Use Source to gather contract, SLA, renewal, and vendor-performance evidence before commercial claims are made.",
      nextAction:
        "Create a Source evidence request for service scope, run baseline, SLA/KPI schedules, renewal windows, and vendor performance.",
      moduleHandoff: "Source",
      claimStrength: "evidence_gap",
      evidenceRefsUsed: serviceEvidence,
      contextGapsUsed: serviceGaps,
      valueClaimGateStatus: defaultGate,
      watchOut:
        "Commercial opportunities should stay as negotiation hypotheses until contract evidence is loaded.",
    },
  ];
}

function buildTowerCxoStory(args: {
  tenantName: string;
  pack: TowerContextPack;
  gapThemes: TowerV3GapTheme[];
  valueHypotheses: TowerV3RuntimeViewModel["valueHypotheses"];
  gateCounts: Record<TowerValueClaim["gateStatus"], number>;
}): TowerCxoStory {
  const { tenantName, pack, gapThemes, valueHypotheses, gateCounts } = args;
  const tenantDisplayName = executiveTenantDisplayName(pack.tenantKey, tenantName);
  const plannedValueTotal = sumNumericValues(pack.towerValueRecords);
  const plannedValueLabel =
    plannedValueTotal > 0 ? compactValue(plannedValueTotal) : `${valueHypotheses.length} value areas`;
  const gatedClaims = gateCounts.caveated + gateCounts.blocked;

  return {
    tenantDisplayName,
    eyebrow: "Tower · CIO/CFO value cockpit",
    headline: `${tenantDisplayName}'s technology value cockpit: budget, portfolio, evidence, and decisions.`,
    executiveBrief:
      `${tenantDisplayName}'s Tower view is ready for a leadership value conversation: where the technology portfolio is pointing, which value hypotheses need proof, and what the CIO/CFO must validate before any board-level claim. The safe story today is measurement readiness and decision control, not certified financial outcome.`,
    cards: [
      {
        label: "Budget lens",
        value: "In view",
        caption:
          "Spend and run/change signals are available for management review, with finance validation still required before board use.",
      },
      {
        label: "Planned value",
        value: plannedValueLabel,
        caption:
          "Portfolio value is visible as a planning hypothesis; it is not yet certified performance.",
      },
      {
        label: "Proof posture",
        value: `${gatedClaims} gated`,
        caption:
          "Value claims stay caveated until baseline, owner, and finance evidence are reconciled.",
      },
      {
        label: "Leadership blockers",
        value: `${gapThemes.length} themes`,
        caption:
          "Repeated evidence gaps are grouped into executive blockers instead of raw row-level exceptions.",
      },
    ],
    tabs: {
      overview: {
        key: "overview",
        headline: "What leadership should inspect this week.",
        summary:
          "Use this view to align the CIO and CFO on budget posture, planned value, blockers, and the next evidence pull required before value commitments move forward.",
        decisionImplication:
          "Treat Tower as the value-governance cockpit: fund measurement, assign owners, and hold outcome claims until proof is complete.",
        nextAction:
          "Confirm the top value areas, the accountable finance owner, and the baseline evidence required for the next steering meeting.",
        visualType: "executive_brief",
      },
      value: {
        key: "value",
        headline: "Where planned value exists but proof is still missing.",
        summary:
          "The value view ranks planning hypotheses and shows which ones are blocked or caveated by missing baseline and finance evidence.",
        decisionImplication:
          "The CFO can discuss value at stake, but should not approve value claims until measurement evidence is complete.",
        nextAction:
          "Prioritize the highest-value hypotheses for baseline validation and benefit-formula ownership.",
        visualType: "value_waterfall",
      },
      budget: {
        key: "budget",
        headline: "Where budget pressure needs finance validation.",
        summary:
          "The budget view separates usable spend signals from numbers that still need a finance-controlled extract and owner signoff.",
        decisionImplication:
          "Use the budget posture to decide where run spend, change spend, and measurement work need sharper ownership.",
        nextAction:
          "Load or attest the finance budget extract, run/change allocation, and reporting cadence for the next review.",
        visualType: "budget_mix",
      },
      portfolio: {
        key: "portfolio",
        headline: "Which programs need governance before funding confidence improves.",
        summary:
          "The portfolio view keeps each initiative tied to value basis, proof posture, and the gate that prevents overclaiming.",
        decisionImplication:
          "Programs can be governed and sequenced now, but funding confidence should follow evidence readiness.",
        nextAction:
          "Assign owners to the top programs and decide which move into measurement design, sourcing evidence, or hold status.",
        visualType: "portfolio_lanes",
      },
      benchmark: {
        key: "benchmark",
        headline: "Which external patterns are useful, and what Meridian must still prove.",
        summary:
          "Benchmark context frames the decision without pretending tenant performance has already been measured against peers.",
        decisionImplication:
          "Use comparators to choose the right questions, not to claim performance.",
        nextAction:
          "Pick the benchmark lens that matters most and validate the tenant baseline before using it in executive materials.",
        visualType: "benchmark_blockers",
      },
      evidence: {
        key: "evidence",
        headline: "What proof is missing before the view becomes board-ready.",
        summary:
          "The evidence view is the right place for lineage, blockers, and diagnostic details that should not dominate the executive narrative.",
        decisionImplication:
          "Evidence gaps are not UI noise; they are the control list for making Tower credible with Finance and Audit.",
        nextAction:
          "Close blocker themes by assigning source owners, baseline extracts, formulas, and finance attestation.",
        visualType: "evidence_checklist",
      },
      insights: {
        key: "insights",
        headline: "What the CIO and CFO should do next.",
        summary:
          "The insights view converts portfolio and proof posture into executive decisions: what to fund, what to measure, and what to hold.",
        decisionImplication:
          "The CIO owns readiness and execution gates; the CFO owns measurement confidence and claim discipline.",
        nextAction:
          "Create a joint CIO/CFO measurement sprint before value claims enter board or budget materials.",
        visualType: "role_decision_cards",
      },
    },
  };
}

export function buildTowerV3RuntimeViewModel(args: {
  tenantName: string;
  contextPack: TowerContextPack;
}): TowerV3RuntimeViewModel {
  const { contextPack } = args;
  const gateCounts = contextPack.towerValueClaims.reduce(
    (acc, claim) => {
      acc[claim.gateStatus] += 1;
      return acc;
    },
    { allowed: 0, blocked: 0, caveated: 0 } satisfies Record<TowerValueClaim["gateStatus"], number>,
  );
  const valueHypotheses = contextPack.towerValueRecords.slice(0, 8).map((record) => {
    const claim = firstValueClaimForRecord(record, contextPack.towerValueClaims);
    return {
      label: record.label,
      value: compactValue(record.value),
      claimBasis: record.claimBasis,
      gateStatus: claim?.gateStatus ?? "blocked",
      evidenceIds: record.evidenceIds.slice(0, 3),
    };
  });
  const gapThemes = aggregateTowerV3GapThemes(contextPack);
  const executiveInsights = buildTowerExecutiveInsights({
    pack: contextPack,
    gateCounts,
  });
  const metricFamilies = buildMetricFamilies(contextPack);
  const cxoStory = buildTowerCxoStory({
    tenantName: args.tenantName,
    pack: contextPack,
    gapThemes,
    valueHypotheses,
    gateCounts,
  });

  return {
    enabled: true,
    tenantKey: contextPack.tenantKey,
    tenantName: args.tenantName,
    contextPackId: contextPack.contextPackId,
    headline:
      "Tower is using the governed context pack for measurement planning, readiness, and value-hypothesis control.",
    mode: contextPack.mode,
    truthStatus: contextPack.truthStatus,
    cxoStory,
    metricCount: contextPack.towerMetricRecords.length,
    valueRecordCount: contextPack.towerValueRecords.length,
    valueClaimCount: contextPack.towerValueClaims.length,
    gateCounts,
    measurementLanguageAllowed: !contextPack.towerValueClaims.some(
      (claim) => claim.realizedValueLanguageAllowed,
    ),
    blockedOutcomeProof: !contextPack.towerValueClaims.some(
      (claim) => claim.realizedValueLanguageAllowed,
    ),
    metricFamilies,
    valueHypotheses,
    defaultTabs: buildTowerV3DefaultTabs({
      pack: contextPack,
      valueHypotheses,
      gapThemes,
      executiveInsights,
    }),
    executiveInsights,
    gapThemes,
    caveats: [
      "Measurement plan only: finance-attested measurement evidence is not yet available.",
      "Targets and value hypotheses require owner signoff before board use.",
      "The legacy Tower read model remains a bridge diagnostic, not the source of truth for this view.",
    ],
    nextMeasurementActions: [
      "Confirm metric owners for AHT, FCR, transfer rate, repeat contact, CSAT, cost per contact, adoption, freshness, quality, PHI incidents, audit exceptions, medallion readiness, semantic certification, and lineage coverage.",
      "Load baseline extracts and measurement cadence for each metric family.",
      "Attach finance-attested actuals before any outcome proof language is allowed.",
      "Reconcile any legacy Tower rows to governed facts, evidence, entity profiles, and relationships before broad runtime migration.",
    ],
    bridgeDiagnostics: {
      source: "cio_tower",
      projectionRole: "derived_read_model",
      sourceOfTruthStatus: "bridge_only",
      v3ReconciliationStatus: "not_v3_reconciled",
      message:
        "The existing Tower read model is retained as fallback diagnostics only; this selected view is rendered from TowerContextPack when the runtime flag is enabled.",
    },
  };
}

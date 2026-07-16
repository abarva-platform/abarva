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
  rows: number;
  evidenceRefs: string[];
  caveat: string;
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

function countRecords(
  records: readonly (TowerMetricRecord | TowerValueRecord)[],
  predicate: (record: TowerMetricRecord | TowerValueRecord) => boolean,
): number {
  return records.filter(predicate).length;
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
  metricFamilies: TowerV3RuntimeMetricFamily[];
  valueHypotheses: TowerV3RuntimeViewModel["valueHypotheses"];
  gapThemes: TowerV3GapTheme[];
  executiveInsights: TowerExecutiveInsight[];
}): TowerV3RuntimeTab[] {
  const { pack, metricFamilies, valueHypotheses, gapThemes, executiveInsights } = args;
  const packEvidence = pack.evidence.map((item) => item.evidenceId);
  return [
    {
      key: "overview",
      label: "Overview",
      sourceClassification: "tower_context_pack_v3_derived",
      sourcePosture: "v3 context-derived measurement and readiness view",
      rows: pack.towerMetricRecords.length + pack.towerValueRecords.length,
      evidenceRefs: packEvidence.slice(0, 5),
      caveat: "Outcome proof is blocked until value claims pass the TowerValueClaim gate.",
    },
    {
      key: "value",
      label: "Value",
      sourceClassification: "tower_projection_v3_derived",
      sourcePosture: "value hypotheses from active v3 program context",
      rows: valueHypotheses.length,
      evidenceRefs: unique(valueHypotheses.flatMap((item) => item.evidenceIds)).slice(0, 5),
      caveat: "Values are forecast or planning-grade until finance evidence is reconciled.",
    },
    {
      key: "budget",
      label: "Budget",
      sourceClassification: "tower_projection_v3_derived",
      sourcePosture: "spend and value signals from v3 spend/value context",
      rows: pack.towerMetricRecords.filter((record) => record.sourceDimension === "08_spend_value").length,
      evidenceRefs: evidenceForPackPattern(pack, /spend|budget|maintenance|net-new|value/i),
      caveat: "Budget actuals stay planning-grade unless a finance-controlled extract is loaded.",
    },
    {
      key: "portfolio",
      label: "Portfolio",
      sourceClassification: "tower_projection_v3_derived",
      sourcePosture: "program and initiative records from active v3 context",
      rows: pack.towerValueRecords.filter((record) => record.sourceDimension === "09_programs_initiatives").length,
      evidenceRefs: evidenceForPackPattern(pack, /program|initiative|agent|analytics|automation|platform/i),
      caveat: "Programs are not approved investments unless promotion and governance evidence support them.",
    },
    {
      key: "benchmark",
      label: "Benchmark",
      sourceClassification: "tower_context_pack_v3_derived",
      sourcePosture: "benchmark context and blocker themes only",
      rows: gapThemes.length,
      evidenceRefs: unique(gapThemes.flatMap((theme) => theme.representativeEvidenceRefs)).slice(0, 5),
      caveat: "This tab does not imply tenant performance against benchmark without tenant baselines and actuals.",
    },
    {
      key: "evidence",
      label: "Evidence",
      sourceClassification: "tower_context_pack_v3_derived",
      sourcePosture: "evidence refs, context gaps, and claim gates from TowerContextPack",
      rows: pack.evidence.length + pack.gaps.length,
      evidenceRefs: packEvidence.slice(0, 5),
      caveat: "Bridge rows remain diagnostic only until reconciled to governed facts and evidence.",
    },
    {
      key: "insights",
      label: "Insights",
      sourceClassification: "tower_projection_v3_derived",
      sourcePosture: "role-specific executive insights derived from the same v3 pack",
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

  return {
    enabled: true,
    tenantKey: contextPack.tenantKey,
    tenantName: args.tenantName,
    contextPackId: contextPack.contextPackId,
    headline:
      "Tower is using the governed context pack for measurement planning, readiness, and value-hypothesis control.",
    mode: contextPack.mode,
    truthStatus: contextPack.truthStatus,
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
      metricFamilies,
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

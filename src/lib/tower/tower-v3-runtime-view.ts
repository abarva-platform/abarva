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
    metricFamilies: buildMetricFamilies(contextPack),
    valueHypotheses,
    gapThemes: aggregateTowerV3GapThemes(contextPack),
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

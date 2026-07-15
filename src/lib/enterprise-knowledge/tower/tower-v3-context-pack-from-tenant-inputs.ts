import fs from "node:fs";
import path from "node:path";

import Papa from "papaparse";

import type {
  CanonicalFact,
  ContextGap,
  ContextPack,
  EvidenceAuthority,
  EvidenceRef,
  TowerContextPack,
  TowerV3SourceDimensionKey,
} from "../contracts";
import { buildClaudeReadyPayload } from "../assembler/claude-ready-payload-builder";
import { buildTowerContextPackFields } from "../assembler/tower-context-pack-builder";

export interface TowerV3TenantInputDimension {
  dimensionKey: TowerV3SourceDimensionKey;
  fileName: string;
  label: string;
  domain: CanonicalFact["domain"];
  primaryLabelFields: string[];
  valueFields: string[];
  gapFields: string[];
}

export interface TowerV3MeridianProofSummary {
  tenantKey: string;
  tenantName: string;
  activeInputRoot: string;
  contextPackId: string;
  mode: TowerContextPack["mode"];
  truthStatus: TowerContextPack["truthStatus"];
  sourceDimensions: Array<{
    dimensionKey: TowerV3SourceDimensionKey;
    fileName: string;
    rowCount: number;
    factCount: number;
    evidenceCount: number;
    projectionStatus: string;
  }>;
  towerMetricRecordCount: number;
  towerValueRecordCount: number;
  towerValueClaimCount: number;
  blockedValueClaimCount: number;
  realizedValueLanguageAllowed: boolean;
  cioTowerProjectionStatus: {
    projectionRole: "derived_read_model";
    sourceOfTruthStatus: "bridge_only";
    v3ReconciliationStatus: "not_v3_reconciled";
  };
  acceptance: {
    allSixDimensionsPresent: boolean;
    everyTowerRecordHasEvidence: boolean;
    everyValueClaimHasGate: boolean;
    realizedValueLanguageBlocked: boolean;
    cioTowerRemainsBridgeOnly: boolean;
  };
}

export interface TowerV3MeridianProof {
  contextPack: TowerContextPack;
  sourceRowsByDimension: Record<TowerV3SourceDimensionKey, number>;
  summary: TowerV3MeridianProofSummary;
}

const TOWER_V3_DIMENSIONS: TowerV3TenantInputDimension[] = [
  {
    dimensionKey: "08_spend_value",
    fileName: "08_spend_value.csv",
    label: "Spend and value",
    domain: "metrics_outcomes",
    primaryLabelFields: ["spend_category", "value_driver", "cost_center_or_owner"],
    valueFields: ["annual_spend_usd", "savings_opportunity_usd", "spend_category", "value_driver"],
    gapFields: ["known_gaps", "calculation_basis"],
  },
  {
    dimensionKey: "09_programs_initiatives",
    fileName: "09_programs_initiatives.csv",
    label: "Programs and initiatives",
    domain: "programs",
    primaryLabelFields: ["program_name", "objective"],
    valueFields: ["budget_usd", "expected_value_usd", "target_outcomes", "objective"],
    gapFields: ["known_gaps", "risks", "dependencies"],
  },
  {
    dimensionKey: "11_risks_controls",
    fileName: "11_risks_controls.csv",
    label: "Risks and controls",
    domain: "risks_controls",
    primaryLabelFields: ["risk_or_control_name", "risk_domain"],
    valueFields: ["control_status", "severity", "evidence_required", "mitigation_plan"],
    gapFields: ["known_gaps", "evidence_required"],
  },
  {
    dimensionKey: "14_metrics_outcomes",
    fileName: "14_metrics_outcomes.csv",
    label: "Metrics and outcomes",
    domain: "metrics_outcomes",
    primaryLabelFields: ["metric_name", "definition"],
    valueFields: ["baseline_value", "target_value", "definition", "calculation_basis"],
    gapFields: ["known_gaps", "target_value", "baseline_value"],
  },
  {
    dimensionKey: "17_service_scope_managed_services",
    fileName: "17_service_scope_managed_services.csv",
    label: "Service scope and managed services",
    domain: "vendors_contracts",
    primaryLabelFields: ["service_tower", "service_name", "scope_description"],
    valueFields: ["run_cost_usd", "service_volume", "sla_or_kpi", "target_state_option"],
    gapFields: ["known_gaps", "scope_description"],
  },
  {
    dimensionKey: "18_operational_process_evidence",
    fileName: "18_operational_process_evidence.csv",
    label: "Operational process evidence",
    domain: "processes",
    primaryLabelFields: ["process_name", "pain_points", "automation_candidate", "cycle_time"],
    valueFields: ["volume_metric", "cycle_time", "pain_points", "control_points", "automation_candidate"],
    gapFields: ["known_gaps", "pain_points", "control_points"],
  },
];

function parseCsv(filePath: string): Array<Record<string, string>> {
  const parsed = Papa.parse<Record<string, string>>(fs.readFileSync(filePath, "utf8"), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(`csv_parse_failed:${filePath}:${parsed.errors[0]?.message}`);
  }
  return parsed.data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, value === undefined || value === null ? "" : String(value)]),
    ),
  );
}

function firstValue(row: Record<string, string>, fields: readonly string[]): string {
  for (const field of fields) {
    const value = row[field]?.trim();
    if (value && value !== "not_provided") return value;
  }
  return "";
}

function rowId(row: Record<string, string>, dimension: TowerV3TenantInputDimension, index: number): string {
  const sourceId = row.original_row_id?.trim();
  const sourceRow = row.original_row_number?.trim();
  if (sourceId && sourceRow) return `${sourceId}-r${sourceRow}`;
  return sourceId || `${dimension.dimensionKey}-row-${index + 1}`;
}

function rowEvidenceAuthority(row: Record<string, string>): EvidenceAuthority {
  const classification = row.source_classification?.toLowerCase() ?? "";
  if (classification.includes("synthetic")) return "synthetic";
  if (row.approved_for_loading?.toLowerCase() === "true") return "supporting";
  if (row.source_type?.toLowerCase().includes("extract")) return "supporting";
  return "self_reported";
}

function evidenceForRow(
  tenantKey: string,
  dimension: TowerV3TenantInputDimension,
  row: Record<string, string>,
  index: number,
): EvidenceRef {
  const id = rowId(row, dimension, index);
  return {
    evidenceId: `${tenantKey}-${dimension.dimensionKey}-${id}-evidence`,
    tenantKey,
    sourceLabel: `${dimension.label} row ${row.original_row_number || index + 2}`,
    sourceType: "tenant_input",
    authority: rowEvidenceAuthority(row),
    truthStatus: "active",
    sourcePath: row.original_source_file || row.source_file || dimension.fileName,
    sourceObjectId: id,
    sourceField: firstValue(row, dimension.primaryLabelFields) || dimension.label,
    excerpt: firstValue(row, [...dimension.primaryLabelFields, ...dimension.valueFields]),
    asOfDate: row.as_of_date || row.source_date || undefined,
    sourceOwner: row.source_owner || undefined,
    sensitivity: "internal",
    confidence: row.confidence === "high" ? 0.85 : row.confidence === "low" ? 0.4 : 0.65,
    citationStatus: row.known_gaps?.trim() ? "needs_review" : "citable",
  };
}

function valueForRow(row: Record<string, string>, dimension: TowerV3TenantInputDimension): {
  value: CanonicalFact["value"];
  valueType: CanonicalFact["valueType"];
} {
  for (const field of dimension.valueFields) {
    const raw = row[field]?.trim();
    if (!raw || raw === "not_provided" || raw === "not_loaded") continue;
    if (/_usd$/i.test(field) || field.includes("spend") || field.includes("budget") || field.includes("value")) {
      const numeric = Number(raw.replace(/[$,]/g, ""));
      if (Number.isFinite(numeric)) return { value: numeric, valueType: "currency" };
    }
    return { value: raw, valueType: "string" };
  }
  return {
    value: firstValue(row, dimension.primaryLabelFields) || `${dimension.label} row`,
    valueType: "string",
  };
}

function predicateForRow(row: Record<string, string>, dimension: TowerV3TenantInputDimension): string {
  if (dimension.dimensionKey === "08_spend_value") {
    if (row.savings_opportunity_usd?.trim()) return "planned_value";
    if (row.annual_spend_usd?.trim()) return "budget_spend";
    return "measurement_readiness";
  }
  if (dimension.dimensionKey === "09_programs_initiatives") {
    if (row.expected_value_usd?.trim() && row.expected_value_usd !== "not_provided") return "planned_value";
    if (row.budget_usd?.trim() && row.budget_usd !== "not_provided") return "budget";
    return "portfolio_readiness";
  }
  if (dimension.dimensionKey === "11_risks_controls") return "risk_control";
  if (dimension.dimensionKey === "14_metrics_outcomes") return "metric";
  if (dimension.dimensionKey === "17_service_scope_managed_services") return "service_scope";
  return "operational_process_evidence";
}

function factForRow(
  tenantKey: string,
  dimension: TowerV3TenantInputDimension,
  row: Record<string, string>,
  index: number,
  evidence: EvidenceRef,
): CanonicalFact {
  const id = rowId(row, dimension, index);
  const value = valueForRow(row, dimension);
  return {
    factId: `${tenantKey}-${dimension.dimensionKey}-${id}`,
    tenantKey,
    domain: dimension.domain,
    subjectEntityId: `${tenantKey}-${dimension.dimensionKey}-${id}-subject`,
    predicate: predicateForRow(row, dimension),
    value: value.value,
    valueType: value.valueType,
    evidenceRefs: [evidence],
    truthStatus: "active",
    confidence: row.confidence === "high" ? "high" : row.confidence === "low" ? "low" : "medium",
    caveats: [
      ...dimension.gapFields.map((field) => row[field]?.trim()).filter((value): value is string => Boolean(value)),
      row.source_classification?.includes("synthetic") ? "Planning-grade synthetic demo row; not client-attested production truth." : "",
    ].filter(Boolean),
    inferred: false,
  };
}

function gapForRow(
  tenantKey: string,
  dimension: TowerV3TenantInputDimension,
  row: Record<string, string>,
  index: number,
): ContextGap | null {
  const description = firstValue(row, dimension.gapFields);
  if (!description) return null;
  const id = rowId(row, dimension, index);
  return {
    gapId: `${tenantKey}-${dimension.dimensionKey}-${id}-gap`,
    tenantKey,
    category: "missing_evidence",
    severity: description.toLowerCase().includes("do not convert") ? "blocker" : "warning",
    title: `${dimension.label}: evidence still needed`,
    description,
    affectedEntityIds: [`${tenantKey}-${dimension.dimensionKey}-${id}-subject`],
    requiredEvidence: ["client owner attestation", "source extract date", "v3 reconciliation review"],
    truthStatus: "active",
    evidenceRefs: [],
    blocksActivePromotion: true,
    blocksModuleAnswer: description.toLowerCase().includes("do not convert"),
  };
}

function buildBaseContextPack(args: {
  tenantKey: string;
  tenantName: string;
  activeInputRoot: string;
  facts: CanonicalFact[];
  evidence: EvidenceRef[];
  gaps: ContextGap[];
}): ContextPack {
  const base: Omit<ContextPack, "claudeReadyContextPayload"> = {
    contextPackId: `${args.tenantKey}-tower-v3-live-context-pack`,
    tenantKey: args.tenantKey,
    moduleKey: "tower",
    purpose: "measurement_context",
    mode: "active",
    truthStatus: "active",
    executiveSummary: `${args.tenantName} Tower context is assembled from active v3 tenant input dimensions 08, 09, 11, 14, 17, and 18. The pack supports measurement/readiness views and blocks realized-value claims until finance-attested measured evidence is reconciled.`,
    relevantEntityProfiles: [],
    facts: args.facts,
    relationships: [],
    relationshipCandidates: [],
    metrics: args.facts.filter((fact) => fact.predicate === "metric"),
    risks: [],
    evidence: args.evidence,
    gaps: args.gaps,
    confidenceSummary: {
      breadth: 70,
      depth: 62,
      relationshipCoverage: 0,
      evidenceCoverage: args.evidence.length > 0 ? 76 : 0,
      answerability: 58,
      overall: "limited",
      rationale:
        "Active v3 rows exist across the Tower-relevant dimensions, but Meridian value claims remain measurement/readiness safe because the rows are planning-grade and not finance-attested realized value evidence.",
    },
    caveats: [
      "Active v3 tenant inputs are source-backed context, not a Tower value ledger.",
      "Planning-grade synthetic demo rows cannot support realized ROI or proven savings language.",
      "cio_tower remains a bridge/read model until reconciled row by row.",
    ],
    excludedCandidateOnlyContext: [],
    unsupportedClaims: [
      {
        claimId: `${args.tenantKey}-tower-realized-value`,
        description: "Tower can claim realized value or proven savings from this pack.",
        reason: "requires_measured_value",
      },
    ],
    recommendedNextEvidence: [
      "finance-attested actual value extract",
      "source-owner attestation for metric definitions",
      "relationship validation from v3 dimension 12",
      "Tower row reconciliation from cio_tower to v3 facts",
    ],
    assemblyTrace: {
      assemblerVersion: "tower-v3-live-meridian-contextpack-pr2",
      generatedAt: new Date().toISOString(),
      inputSources: TOWER_V3_DIMENSIONS.map((dimension) => path.join(args.activeInputRoot, dimension.fileName)),
      includedEntityIds: [],
      excludedEntityIds: [],
      includedEvidenceIds: args.evidence.map((item) => item.evidenceId),
      excludedEvidenceIds: [],
      ruleHits: [
        "active-v3-tenant-inputs-only",
        "tower-dimensions-08-09-11-14-17-18",
        "measurement-readiness-not-realized-value",
        "cio-tower-bridge-only-unless-reconciled",
      ],
    },
    truthBoundary: {
      activeTenantContextDefault: true,
      candidatePreviewExplicitlyRequested: false,
      candidateContextIncluded: false,
      sourceAdapterRowsActive: false,
      activeTenantAccessUpdated: false,
      productionTenantDataWritten: false,
      candidatePromoted: false,
      moduleRuntimeBehaviorChanged: false,
    },
  };
  return {
    ...base,
    claudeReadyContextPayload: buildClaudeReadyPayload(
      {
        tenantKey: args.tenantKey,
        moduleKey: "tower",
        purpose: "measurement_context",
        mode: "active",
        requestedDomains: [
          "programs",
          "risks_controls",
          "metrics_outcomes",
          "vendors_contracts",
          "processes",
        ],
        scope: {
          question: "What can Tower safely say about Meridian value measurement readiness?",
        },
        evidencePolicy: "lineage_required",
        relationshipPolicy: "validated_only",
      },
      base,
    ),
  };
}

export function buildTowerV3ContextPackFromTenantInputs(args: {
  tenantKey: string;
  tenantName: string;
  activeInputRoot: string;
}): TowerV3MeridianProof {
  const facts: CanonicalFact[] = [];
  const evidence: EvidenceRef[] = [];
  const gaps: ContextGap[] = [];
  const sourceRowsByDimension = Object.fromEntries(
    TOWER_V3_DIMENSIONS.map((dimension) => [dimension.dimensionKey, 0]),
  ) as Record<TowerV3SourceDimensionKey, number>;

  for (const dimension of TOWER_V3_DIMENSIONS) {
    const filePath = path.join(args.activeInputRoot, dimension.fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`missing_tower_v3_dimension:${dimension.dimensionKey}:${filePath}`);
    }
    const rows = parseCsv(filePath).filter((row) => (row.tenant_key || args.tenantKey) === args.tenantKey);
    sourceRowsByDimension[dimension.dimensionKey] = rows.length;
    rows.forEach((row, index) => {
      const ref = evidenceForRow(args.tenantKey, dimension, row, index);
      evidence.push(ref);
      facts.push(factForRow(args.tenantKey, dimension, row, index, ref));
      const gap = gapForRow(args.tenantKey, dimension, row, index);
      if (gap) gaps.push(gap);
    });
  }

  const base = buildBaseContextPack({
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    activeInputRoot: args.activeInputRoot,
    facts,
    evidence,
    gaps,
  });

  const contextPack: TowerContextPack = {
    ...base,
    moduleKey: "tower",
    ...buildTowerContextPackFields(base),
  };

  const sourceDimensions = TOWER_V3_DIMENSIONS.map((dimension) => {
    const mapped = contextPack.v3SourceDimensions.find((item) => item.dimensionKey === dimension.dimensionKey);
    return {
      dimensionKey: dimension.dimensionKey,
      fileName: dimension.fileName,
      rowCount: sourceRowsByDimension[dimension.dimensionKey],
      factCount: mapped?.recordCount ?? 0,
      evidenceCount: mapped?.evidenceCount ?? 0,
      projectionStatus:
        contextPack.derivedProjectionLineage.find((item) => item.sourceDimension === dimension.dimensionKey)
          ?.projectionStatus ?? "not_v3_reconciled",
    };
  });

  const everyTowerRecordHasEvidence = [
    ...contextPack.towerMetricRecords,
    ...contextPack.towerValueRecords,
  ].every((record) => record.evidenceIds.length > 0);
  const realizedValueLanguageAllowed = contextPack.towerValueClaims.some((claim) => claim.realizedValueLanguageAllowed);

  return {
    contextPack,
    sourceRowsByDimension,
    summary: {
      tenantKey: args.tenantKey,
      tenantName: args.tenantName,
      activeInputRoot: args.activeInputRoot,
      contextPackId: contextPack.contextPackId,
      mode: contextPack.mode,
      truthStatus: contextPack.truthStatus,
      sourceDimensions,
      towerMetricRecordCount: contextPack.towerMetricRecords.length,
      towerValueRecordCount: contextPack.towerValueRecords.length,
      towerValueClaimCount: contextPack.towerValueClaims.length,
      blockedValueClaimCount: contextPack.blockedValueClaims.length,
      realizedValueLanguageAllowed,
      cioTowerProjectionStatus: {
        projectionRole: "derived_read_model",
        sourceOfTruthStatus: "bridge_only",
        v3ReconciliationStatus: "not_v3_reconciled",
      },
      acceptance: {
        allSixDimensionsPresent: sourceDimensions.every((dimension) => dimension.rowCount > 0),
        everyTowerRecordHasEvidence,
        everyValueClaimHasGate: contextPack.towerValueClaims.every((claim) => Boolean(claim.gateStatus)),
        realizedValueLanguageBlocked: !realizedValueLanguageAllowed,
        cioTowerRemainsBridgeOnly: true,
      },
    },
  };
}

// Moves Expert Kernel — data-platform modernization coefficients.
//
// This is a sourced planning-range library, not a bid generator. AbarVa consumes
// Lakebridge/Analyzer-style inventory and uses these coefficients only as
// fallback calibration when client evidence is not yet loaded.

import type { Confidence, Range } from "../types";
import { rangeOf, round2 } from "../types";

export const MODERNIZATION_SOURCE_IDS = [
  "databricks_lakebridge_overview_2026_06_03",
  "databricks_lakebridge_analyzer_2026_06_03",
  "databricks_bladebridge_announcement_2026_06_03",
  "databricks_well_architected_lakehouse_2026_06_03",
  "databricks_medallion_architecture_2026_06_03",
  "databricks_cicd_bundles_2026_06_03",
  "databricks_warehouse_to_lakehouse_2026_06_03",
  "databricks_sas_migration_case_2026_06_03",
  "aws_7rs_migration_strategies_2026_06_03",
] as const;

export type ModernizationSourceId = (typeof MODERNIZATION_SOURCE_IDS)[number];

export const MODERNIZATION_ARCHETYPE_IDS = [
  "source_to_landing",
  "datastage_etl_family",
  "sql_stored_procedure_family",
  "sql_mart_repoint_rebuild",
  "sas_program_family",
  "bi_report_family",
] as const;

export type ModernizationArchetypeId =
  (typeof MODERNIZATION_ARCHETYPE_IDS)[number];

export const MODERNIZATION_COMPLEXITY_BANDS = [
  "small",
  "medium",
  "large",
] as const;

export type ModernizationComplexityBand =
  (typeof MODERNIZATION_COMPLEXITY_BANDS)[number];

export const MODERNIZATION_DISPOSITIONS = [
  "retire",
  "retain",
  "rehost",
  "relocate",
  "repurchase",
  "replatform",
  "refactor_rearchitect",
] as const;

export type ModernizationDisposition =
  (typeof MODERNIZATION_DISPOSITIONS)[number];

export interface ModernizationSourceLedgerEntry {
  id: ModernizationSourceId;
  title: string;
  url: string;
  asOf: string;
  confidence: Confidence;
  use: string;
  evidenceSummary: string;
}

export interface SourcedCoefficientRange {
  low: number;
  point: number;
  high: number;
  sourceId: ModernizationSourceId;
  asOf: string;
  confidence: Confidence;
  rationale: string;
}

export interface ModernizationArchetypeCoefficient {
  id: ModernizationArchetypeId;
  label: string;
  defaultDisposition: ModernizationDisposition;
  targetMedallion: "bronze" | "bronze_to_silver" | "silver" | "gold";
  conversionApproach: string;
  complexityDrivers: string[];
  automationLeveragePct: SourcedCoefficientRange;
  grossPersonWeeksByComplexity: Record<
    ModernizationComplexityBand,
    SourcedCoefficientRange
  >;
  residualRationale: string;
}

export interface ModernizationDispositionCoefficient {
  disposition: ModernizationDisposition;
  label: string;
  effortMultiplier: SourcedCoefficientRange;
  treatment: string;
}

export interface ModernizationCoefficientValidationIssue {
  severity: "error" | "warning";
  objectId: string;
  field: string;
  message: string;
}

export interface ModernizationCoefficientValidationResult {
  valid: boolean;
  errors: ModernizationCoefficientValidationIssue[];
  warnings: ModernizationCoefficientValidationIssue[];
}

export const MODERNIZATION_SOURCE_LEDGER: ModernizationSourceLedgerEntry[] = [
  {
    id: "databricks_lakebridge_overview_2026_06_03",
    title: "Databricks Lakebridge overview",
    url: "https://databrickslabs.github.io/lakebridge/docs/overview/",
    asOf: "2026-06-03",
    confidence: "high",
    use: "Migration phase taxonomy and the rule that AbarVa consumes assessment and conversion outputs rather than rebuilding migration tooling.",
    evidenceSummary:
      "Lakebridge covers pre-migration assessment, SQL workload conversion, and post-migration reconciliation.",
  },
  {
    id: "databricks_lakebridge_analyzer_2026_06_03",
    title: "Databricks Lakebridge Analyzer guide",
    url: "https://databrickslabs.github.io/lakebridge/docs/assessment/analyzer/",
    asOf: "2026-06-03",
    confidence: "high",
    use: "Analyzer-style intake and complexity signal for SQL and ETL assets.",
    evidenceSummary:
      "Analyzer scans metadata from ETL pipelines and SQL assets and feeds metrics into migration engineering-hour estimates.",
  },
  {
    id: "databricks_bladebridge_announcement_2026_06_03",
    title: "Databricks BladeBridge announcement",
    url: "https://community.databricks.com/t5/announcements/welcoming-bladebridge-to-databricks-accelerating-data-warehouse/td-p/109062",
    asOf: "2026-06-03",
    confidence: "medium",
    use: "Automation leverage direction for legacy warehouse conversion, treated conservatively because public copy is product-positioning.",
    evidenceSummary:
      "Databricks describes scope insight, configurable code transpiling, LLM-powered conversion, and validation for migrated systems.",
  },
  {
    id: "databricks_well_architected_lakehouse_2026_06_03",
    title: "Databricks well-architected lakehouse framework",
    url: "https://docs.databricks.com/en/lakehouse-architecture/well-architected.html",
    asOf: "2026-06-03",
    confidence: "high",
    use: "Standards backdrop for foundation and governance lines.",
    evidenceSummary:
      "The lakehouse framework has seven pillars: operational excellence, security/privacy/compliance, reliability, performance efficiency, cost optimization, data and AI governance, and interoperability/usability.",
  },
  {
    id: "databricks_medallion_architecture_2026_06_03",
    title: "Databricks medallion lakehouse architecture",
    url: "https://docs.databricks.com/aws/en/lakehouse/medallion",
    asOf: "2026-06-03",
    confidence: "high",
    use: "Bronze/Silver/Gold target mapping for archetypes.",
    evidenceSummary:
      "Databricks defines bronze as raw, silver as validated, and gold as enriched/business-ready layers.",
  },
  {
    id: "databricks_cicd_bundles_2026_06_03",
    title: "Databricks CI/CD and Asset Bundles",
    url: "https://docs.databricks.com/en/dev-tools/bundles/ci-cd-bundles.html",
    asOf: "2026-06-03",
    confidence: "high",
    use: "Foundation effort rationale for CI/CD, promotion, and operational excellence.",
    evidenceSummary:
      "Databricks describes CI/CD flows and Asset Bundles for deploying jobs, pipelines, and MLOps assets.",
  },
  {
    id: "databricks_warehouse_to_lakehouse_2026_06_03",
    title: "Databricks warehouse-to-lakehouse migration guidance",
    url: "https://docs.databricks.com/aws/en/migration/warehouse-to-lakehouse",
    asOf: "2026-06-03",
    confidence: "medium",
    use: "Repoint/rebuild posture for marts, queries, and BI workloads after governance and data migration foundation is complete.",
    evidenceSummary:
      "Databricks notes many workloads, queries, and dashboards can run with minimal refactoring after initial data migration and governance setup.",
  },
  {
    id: "databricks_sas_migration_case_2026_06_03",
    title: "Databricks SAS migration case session",
    url: "https://www.databricks.com/dataaisummit/session/migrating-legacy-sas-code-databricks-lakehouse-what-we-learned-along",
    asOf: "2026-06-03",
    confidence: "low",
    use: "Conservative SAS coefficient calibration; source is qualitative and public, so exact automation claims stay low-confidence.",
    evidenceSummary:
      "Public session abstract describes a multi-year SAS-to-Databricks program using automation to reverse engineer, translate, migrate, validate, and reconcile jobs.",
  },
  {
    id: "aws_7rs_migration_strategies_2026_06_03",
    title: "AWS Prescriptive Guidance 7 Rs",
    url: "https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html",
    asOf: "2026-06-03",
    confidence: "high",
    use: "Disposition vocabulary and relative transformation complexity.",
    evidenceSummary:
      "AWS defines retire, retain, rehost, relocate, repurchase, replatform, and refactor/re-architect and warns that refactor is the most complex large-migration strategy.",
  },
];

function sourcedRange(
  low: number,
  point: number,
  high: number,
  sourceId: ModernizationSourceId,
  confidence: Confidence,
  rationale: string,
): SourcedCoefficientRange {
  return {
    low,
    point,
    high,
    sourceId,
    asOf: "2026-06-03",
    confidence,
    rationale,
  };
}

export const MODERNIZATION_ARCHETYPE_COEFFICIENTS: ModernizationArchetypeCoefficient[] =
  [
    {
      id: "source_to_landing",
      label: "Source to landing onboarding",
      defaultDisposition: "refactor_rearchitect",
      targetMedallion: "bronze",
      conversionApproach:
        "Build a metadata-driven landing pattern, then onboard each source with reconciliation and governance gates.",
      complexityDrivers: [
        "source count",
        "change-data semantics",
        "PHI/PII or payment scope",
        "source authentication and connectivity",
        "reconciliation strictness",
      ],
      automationLeveragePct: sourcedRange(
        0.35,
        0.525,
        0.7,
        "databricks_lakebridge_overview_2026_06_03",
        "medium",
        "Lakebridge supports assessment and reconciliation phases, but source-specific onboarding still depends on connectivity, CDC, and governance design.",
      ),
      grossPersonWeeksByComplexity: {
        small: sourcedRange(
          2,
          3,
          4,
          "databricks_medallion_architecture_2026_06_03",
          "medium",
          "Small source onboarding assumes the bronze landing pattern already exists and the source has standard batch semantics.",
        ),
        medium: sourcedRange(
          4,
          6,
          8,
          "databricks_lakebridge_overview_2026_06_03",
          "medium",
          "Medium onboarding includes incremental ingestion, reconciliation, and schema-drift controls.",
        ),
        large: sourcedRange(
          8,
          11,
          14,
          "databricks_well_architected_lakehouse_2026_06_03",
          "medium",
          "Large onboarding carries additional security, reliability, and data-quality gates aligned to the lakehouse standards framework.",
        ),
      },
      residualRationale:
        "Automation helps with assessment and reconciliation, but human work remains for source access, governance, and cutover controls.",
    },
    {
      id: "datastage_etl_family",
      label: "DataStage ETL job family",
      defaultDisposition: "replatform",
      targetMedallion: "bronze_to_silver",
      conversionApproach:
        "Use Analyzer-style inventory to group related jobs, convert repeatable patterns, then manually remediate custom routines and orchestration side effects.",
      complexityDrivers: [
        "job count",
        "transform density",
        "custom routines",
        "orchestration side effects",
        "data-quality parity",
      ],
      automationLeveragePct: sourcedRange(
        0.4,
        0.575,
        0.75,
        "databricks_lakebridge_analyzer_2026_06_03",
        "medium",
        "Analyzer can scan ETL metadata and support engineering-hour estimates; conversion leverage is high for repeatable patterns and lower for custom routines.",
      ),
      grossPersonWeeksByComplexity: {
        small: sourcedRange(
          3,
          4.5,
          6,
          "databricks_lakebridge_analyzer_2026_06_03",
          "medium",
          "Small ETL families are bounded collections with limited custom transformations.",
        ),
        medium: sourcedRange(
          6,
          9,
          12,
          "databricks_bladebridge_announcement_2026_06_03",
          "medium",
          "Medium ETL families assume automated conversion assistance plus manual remediation and test parity.",
        ),
        large: sourcedRange(
          12,
          18,
          24,
          "databricks_bladebridge_announcement_2026_06_03",
          "medium",
          "Large ETL families include broad orchestration, custom routines, and reconciliation that cannot be reduced to a single converter percentage.",
        ),
      },
      residualRationale:
        "Residual effort is driven by custom transforms, job orchestration, and validation against existing warehouse outputs.",
    },
    {
      id: "sql_stored_procedure_family",
      label: "SQL stored procedure family",
      defaultDisposition: "refactor_rearchitect",
      targetMedallion: "silver",
      conversionApproach:
        "Rationalize procedural logic into Spark SQL or PySpark patterns and test semantic parity instead of lifting procedural code unchanged.",
      complexityDrivers: [
        "SQL lines of code",
        "cursor and temp-table use",
        "procedural branching",
        "performance rewrite",
        "semantic testing burden",
      ],
      automationLeveragePct: sourcedRange(
        0.25,
        0.425,
        0.6,
        "databricks_bladebridge_announcement_2026_06_03",
        "medium",
        "SQL conversion tooling can accelerate translation, but stored procedures often require rationalization and semantic rewrite.",
      ),
      grossPersonWeeksByComplexity: {
        small: sourcedRange(
          2,
          3.5,
          5,
          "databricks_lakebridge_overview_2026_06_03",
          "medium",
          "Small SQL families have simple transformations and limited procedural state.",
        ),
        medium: sourcedRange(
          5,
          8.5,
          12,
          "databricks_bladebridge_announcement_2026_06_03",
          "medium",
          "Medium SQL families include translation plus manual testing of procedural behavior.",
        ),
        large: sourcedRange(
          12,
          20,
          28,
          "databricks_bladebridge_announcement_2026_06_03",
          "medium",
          "Large SQL families carry procedural branching, performance tuning, and hard semantic parity obligations.",
        ),
      },
      residualRationale:
        "The converter can reduce syntax work; architecture, semantics, and performance decisions remain human-led.",
    },
    {
      id: "sql_mart_repoint_rebuild",
      label: "SQL mart repoint or rebuild",
      defaultDisposition: "replatform",
      targetMedallion: "gold",
      conversionApproach:
        "Move curated marts onto gold tables, rationalize conformed dimensions, and repoint downstream analytics when the business view is stable.",
      complexityDrivers: [
        "mart count",
        "conformed-dimension complexity",
        "downstream dependencies",
        "cutover sequencing",
        "usage rationalization",
      ],
      automationLeveragePct: sourcedRange(
        0.4,
        0.55,
        0.7,
        "databricks_warehouse_to_lakehouse_2026_06_03",
        "medium",
        "Databricks guidance supports minimal refactoring for many queries and dashboards after foundation setup, but marts still need dependency and cutover work.",
      ),
      grossPersonWeeksByComplexity: {
        small: sourcedRange(
          2,
          3,
          4,
          "databricks_warehouse_to_lakehouse_2026_06_03",
          "medium",
          "Small marts assume stable schemas and limited downstream consumers.",
        ),
        medium: sourcedRange(
          4,
          6.5,
          9,
          "databricks_medallion_architecture_2026_06_03",
          "medium",
          "Medium marts require gold-model alignment and validation against existing business outputs.",
        ),
        large: sourcedRange(
          9,
          13.5,
          18,
          "databricks_well_architected_lakehouse_2026_06_03",
          "medium",
          "Large mart families add governance, quality, reliability, and cutover controls for many consumers.",
        ),
      },
      residualRationale:
        "Query portability helps, but conformed dimensions, dependency mapping, and business validation dominate residual work.",
    },
    {
      id: "sas_program_family",
      label: "SAS program family",
      defaultDisposition: "refactor_rearchitect",
      targetMedallion: "silver",
      conversionApproach:
        "Reverse engineer SAS data and statistical semantics, translate where safe, and validate outputs with owners before retiring legacy jobs.",
      complexityDrivers: [
        "program count",
        "macro density",
        "PROC/statistical semantics",
        "regulated validation burden",
        "user acceptance",
      ],
      automationLeveragePct: sourcedRange(
        0.15,
        0.3,
        0.45,
        "databricks_sas_migration_case_2026_06_03",
        "low",
        "Public SAS migration evidence is qualitative; automation exists but macro/statistical semantics and validation keep this low-confidence and conservative.",
      ),
      grossPersonWeeksByComplexity: {
        small: sourcedRange(
          4,
          6,
          8,
          "databricks_sas_migration_case_2026_06_03",
          "low",
          "Small SAS families assume limited macros and owner-validated output comparisons.",
        ),
        medium: sourcedRange(
          8,
          13,
          18,
          "databricks_sas_migration_case_2026_06_03",
          "low",
          "Medium SAS families include reverse engineering, translation, migration, validation, and reconciliation.",
        ),
        large: sourcedRange(
          18,
          29,
          40,
          "databricks_sas_migration_case_2026_06_03",
          "low",
          "Large SAS families remain the hardest archetype until client inventory and SME validation prove otherwise.",
        ),
      },
      residualRationale:
        "Residual effort stays high because regulated analytics, macros, and statistical semantics are hard to prove with converter output alone.",
    },
    {
      id: "bi_report_family",
      label: "Tableau or BusinessObjects report family",
      defaultDisposition: "replatform",
      targetMedallion: "gold",
      conversionApproach:
        "Rationalize usage, retire dead reports, repoint viable dashboards to gold tables, and remediate embedded SQL and semantic-layer drift.",
      complexityDrivers: [
        "workbook/report count",
        "embedded SQL",
        "calculation complexity",
        "semantic layer drift",
        "consumer criticality",
      ],
      automationLeveragePct: sourcedRange(
        0.3,
        0.475,
        0.65,
        "databricks_warehouse_to_lakehouse_2026_06_03",
        "medium",
        "Many BI queries and dashboards can run with minimal refactoring after migration, but usage rationalization and embedded logic remain manual.",
      ),
      grossPersonWeeksByComplexity: {
        small: sourcedRange(
          1,
          2,
          3,
          "databricks_warehouse_to_lakehouse_2026_06_03",
          "medium",
          "Small report families are repoints with limited embedded logic and known owners.",
        ),
        medium: sourcedRange(
          3,
          5,
          7,
          "databricks_warehouse_to_lakehouse_2026_06_03",
          "medium",
          "Medium report families require rationalization, repointing, and owner signoff.",
        ),
        large: sourcedRange(
          7,
          10.5,
          14,
          "databricks_well_architected_lakehouse_2026_06_03",
          "medium",
          "Large report families add governance, semantic consistency, and consumer cutover controls.",
        ),
      },
      residualRationale:
        "Residual work is mostly usage rationalization, embedded SQL remediation, and stakeholder acceptance.",
    },
  ];

export const MODERNIZATION_DISPOSITION_COEFFICIENTS: ModernizationDispositionCoefficient[] =
  [
    {
      disposition: "retire",
      label: "Retire",
      effortMultiplier: sourcedRange(
        0.05,
        0.1,
        0.2,
        "aws_7rs_migration_strategies_2026_06_03",
        "medium",
        "Retirement avoids migration build effort but still requires discovery, owner confirmation, and decommission audit.",
      ),
      treatment:
        "Do not migrate. Confirm no active owner dependency and record decommission evidence.",
    },
    {
      disposition: "retain",
      label: "Retain",
      effortMultiplier: sourcedRange(
        0.2,
        0.35,
        0.55,
        "aws_7rs_migration_strategies_2026_06_03",
        "medium",
        "Retained systems remain systems of record; estimate integration, governance, and reconciliation rather than platform rebuild.",
      ),
      treatment:
        "Keep as source of record and build governed lakehouse extracts or federation.",
    },
    {
      disposition: "rehost",
      label: "Rehost",
      effortMultiplier: sourcedRange(
        0.65,
        0.8,
        0.95,
        "aws_7rs_migration_strategies_2026_06_03",
        "medium",
        "Rehost is lower transformation effort, but testing, cutover, access, and operations still remain.",
      ),
      treatment:
        "Move with minimal transformation and explicit cutover testing.",
    },
    {
      disposition: "relocate",
      label: "Relocate",
      effortMultiplier: sourcedRange(
        0.6,
        0.75,
        0.9,
        "aws_7rs_migration_strategies_2026_06_03",
        "medium",
        "Relocation is a lower-transformation move, treated similarly to rehost for planning until platform-specific evidence exists.",
      ),
      treatment:
        "Move platform/runtime location with limited application-level rewrite.",
    },
    {
      disposition: "repurchase",
      label: "Repurchase",
      effortMultiplier: sourcedRange(
        0.5,
        0.8,
        1.1,
        "aws_7rs_migration_strategies_2026_06_03",
        "low",
        "Repurchase is vendor/product transition; Databricks migration effort depends on data-exit, integration, and reporting scope.",
      ),
      treatment:
        "Treat as product/vendor transition; include data migration only when explicitly in scope.",
    },
    {
      disposition: "replatform",
      label: "Replatform",
      effortMultiplier: sourcedRange(
        0.9,
        1,
        1.2,
        "aws_7rs_migration_strategies_2026_06_03",
        "medium",
        "Replatform preserves much of the business logic while moving runtime or data platform, so it is the normalized baseline.",
      ),
      treatment:
        "Move to target platform while preserving intent and remediating platform differences.",
    },
    {
      disposition: "refactor_rearchitect",
      label: "Refactor / re-architect",
      effortMultiplier: sourcedRange(
        1.2,
        1.35,
        1.5,
        "aws_7rs_migration_strategies_2026_06_03",
        "medium",
        "AWS flags refactor/re-architect as the most complex large-migration strategy; AbarVa models it as a 20-50% planning premium over replatform.",
      ),
      treatment:
        "Redesign to target-state patterns and score SI divergence if a bid assumes cheaper lift-shift treatment.",
    },
  ];

export interface HumanResidualEffortEstimate {
  archetypeId: ModernizationArchetypeId;
  complexity: ModernizationComplexityBand;
  grossPersonWeeks: Range;
  automationLeveragePct: Range;
  humanResidualPersonWeeks: Range;
  provenance: {
    sourceIds: ModernizationSourceId[];
    asOf: string;
    confidence: Confidence;
    rationale: string;
  };
}

function toRange(range: SourcedCoefficientRange): Range {
  return { low: range.low, point: range.point, high: range.high };
}

function confidenceRank(confidence: Confidence): number {
  return confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;
}

function lowestConfidence(ranges: SourcedCoefficientRange[]): Confidence {
  return ranges.reduce<Confidence>((lowest, range) => {
    return confidenceRank(range.confidence) < confidenceRank(lowest)
      ? range.confidence
      : lowest;
  }, "high");
}

export function getModernizationSourceById(
  id: ModernizationSourceId,
): ModernizationSourceLedgerEntry | null {
  return MODERNIZATION_SOURCE_LEDGER.find((source) => source.id === id) ?? null;
}

export function getModernizationArchetypeCoefficient(
  id: ModernizationArchetypeId,
): ModernizationArchetypeCoefficient | null {
  return (
    MODERNIZATION_ARCHETYPE_COEFFICIENTS.find(
      (archetype) => archetype.id === id,
    ) ?? null
  );
}

export function computeHumanResidualPersonWeeks(
  archetypeId: ModernizationArchetypeId,
  complexity: ModernizationComplexityBand,
): HumanResidualEffortEstimate {
  const archetype = getModernizationArchetypeCoefficient(archetypeId);
  if (!archetype) {
    throw new Error(`unknown_modernization_archetype:${archetypeId}`);
  }

  const gross = archetype.grossPersonWeeksByComplexity[complexity];
  const automation = archetype.automationLeveragePct;
  const humanResidualPersonWeeks = {
    low: round2(gross.low * (1 - automation.high)),
    point: round2(gross.point * (1 - automation.point)),
    high: round2(gross.high * (1 - automation.low)),
  };

  return {
    archetypeId,
    complexity,
    grossPersonWeeks: toRange(gross),
    automationLeveragePct: toRange(automation),
    humanResidualPersonWeeks,
    provenance: {
      sourceIds: Array.from(new Set([gross.sourceId, automation.sourceId])),
      asOf: "2026-06-03",
      confidence: lowestConfidence([gross, automation]),
      rationale: `${gross.rationale} ${automation.rationale}`,
    },
  };
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateSourcedRange(
  range: SourcedCoefficientRange,
  objectId: string,
  field: string,
  issues: ModernizationCoefficientValidationIssue[],
  options: { pct?: boolean } = {},
): void {
  if (
    !Number.isFinite(range.low) ||
    !Number.isFinite(range.point) ||
    !Number.isFinite(range.high) ||
    range.low > range.point ||
    range.point > range.high
  ) {
    issues.push({
      severity: "error",
      objectId,
      field,
      message:
        "Coefficient range must be finite and ordered low <= point <= high.",
    });
  }
  if (options.pct && (range.low < 0 || range.high > 1)) {
    issues.push({
      severity: "error",
      objectId,
      field,
      message:
        "Percentage coefficients must be decimal values between 0 and 1.",
    });
  }
  if (!getModernizationSourceById(range.sourceId)) {
    issues.push({
      severity: "error",
      objectId,
      field,
      message:
        "Coefficient source_id must resolve to the modernization source ledger.",
    });
  }
  if (!isIsoDate(range.asOf)) {
    issues.push({
      severity: "error",
      objectId,
      field,
      message: "Coefficient as_of must be an ISO date.",
    });
  }
  if (!range.rationale.trim()) {
    issues.push({
      severity: "error",
      objectId,
      field,
      message: "Coefficient rationale is required.",
    });
  }
}

export function validateModernizationCoefficientLibrary(): ModernizationCoefficientValidationResult {
  const errors: ModernizationCoefficientValidationIssue[] = [];
  const warnings: ModernizationCoefficientValidationIssue[] = [];

  MODERNIZATION_SOURCE_LEDGER.forEach((source) => {
    if (!source.url.startsWith("https://")) {
      errors.push({
        severity: "error",
        objectId: source.id,
        field: "url",
        message: "Source URL must be HTTPS.",
      });
    }
    if (!isIsoDate(source.asOf)) {
      errors.push({
        severity: "error",
        objectId: source.id,
        field: "asOf",
        message: "Source as_of must be an ISO date.",
      });
    }
    if (!source.evidenceSummary.trim()) {
      errors.push({
        severity: "error",
        objectId: source.id,
        field: "evidenceSummary",
        message: "Source evidence summary is required.",
      });
    }
  });

  MODERNIZATION_ARCHETYPE_COEFFICIENTS.forEach((archetype) => {
    validateSourcedRange(
      archetype.automationLeveragePct,
      archetype.id,
      "automationLeveragePct",
      errors,
      { pct: true },
    );
    MODERNIZATION_COMPLEXITY_BANDS.forEach((complexity) => {
      validateSourcedRange(
        archetype.grossPersonWeeksByComplexity[complexity],
        archetype.id,
        `grossPersonWeeksByComplexity.${complexity}`,
        errors,
      );
    });
    if (archetype.complexityDrivers.length < 3) {
      warnings.push({
        severity: "warning",
        objectId: archetype.id,
        field: "complexityDrivers",
        message: "At least three complexity drivers are recommended.",
      });
    }
  });

  MODERNIZATION_DISPOSITION_COEFFICIENTS.forEach((disposition) => {
    validateSourcedRange(
      disposition.effortMultiplier,
      disposition.disposition,
      "effortMultiplier",
      errors,
    );
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export const FOUNDATION_EFFORT_PERSON_WEEKS = {
  platformFoundation: sourcedRange(
    12,
    18,
    28,
    "databricks_well_architected_lakehouse_2026_06_03",
    "medium",
    "Foundation includes environments, networking, Unity Catalog governance, security, observability, and data-quality controls before workload migration scales.",
  ),
  metadataDrivenIngestionFramework: sourcedRange(
    8,
    14,
    22,
    "databricks_cicd_bundles_2026_06_03",
    "medium",
    "The ingestion framework includes source pattern templates, CI/CD-promoted jobs or pipelines, reconciliation hooks, and operational runbooks.",
  ),
};

export function buildDefaultModernizationPlanningEnvelope(): Range {
  return rangeOf(
    FOUNDATION_EFFORT_PERSON_WEEKS.platformFoundation.low +
      FOUNDATION_EFFORT_PERSON_WEEKS.metadataDrivenIngestionFramework.low,
    FOUNDATION_EFFORT_PERSON_WEEKS.platformFoundation.high +
      FOUNDATION_EFFORT_PERSON_WEEKS.metadataDrivenIngestionFramework.high,
  );
}

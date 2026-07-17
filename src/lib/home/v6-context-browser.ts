import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { getClientOption, type ClientKey } from "@/lib/client-config";
import { appClientKeyForTenant } from "@/lib/tenant/aliases";

export interface HomeV6BrowserColumn {
  key: string;
  label: string;
}

export interface HomeV6BrowserSourceRow {
  v6File: string;
  rowNumber: number;
  rowId: string;
  label: string;
  values: Record<string, string>;
  knownGaps: string[];
}

export interface HomeV6BrowserPreview {
  dimension: string;
  title: string;
  fileNames: string[];
  rowCount: number;
  dataThinCells: number;
  sourceCount: number;
  columns: HomeV6BrowserColumn[];
  rows: string[][];
  sourceRows: HomeV6BrowserSourceRow[];
  knownGaps: Array<{
    label: string;
    count: number;
    instruction?: string | null;
    moduleUse?: string | null;
    whyItMatters?: string | null;
    howItHelps?: string | null;
  }>;
}

export interface HomeCxoStoryBlock {
  block_id: string;
  surface: "home" | "knowledge" | string;
  dimension: string;
  title: string;
  executive_summary: string;
  what_context_reveals: string;
  why_it_matters: string;
  decision_implication: string;
  evidence_still_needed: string;
  module_usage: string;
  next_validation_action: string;
  approved_for_render: boolean;
}

export interface HomeCxoVisualSpec {
  visual_id: string;
  type: string;
  surface: "home" | "knowledge" | string;
  title: string;
  purpose: string;
  data_requirements: string[];
  chart_allowed: boolean;
  why_chart_allowed_or_not: string;
  placement: string;
  evidence_boundary: string;
}

export interface HomeV6ContextBrowser {
  tenantKey: string;
  displayName: string;
  datasetDir: string;
  generatedAt: string;
  contractLabel?: string;
  runtimeSource?: "azure-v7" | "local-v3-standard" | "local-v3-v7" | "local-v6";
  contextMode?: "active" | "candidate-preview";
  contextWarnings?: string[];
  cxoStoryBlocks?: HomeCxoStoryBlock[];
  cxoVisualSpecs?: HomeCxoVisualSpec[];
  bindingContext?: Array<{
    dimension: string;
    status: string;
    description: string;
    evidence: number;
    sources: number;
    trust: number;
    flag?: string;
  }>;
  dimensions: Record<string, HomeV6BrowserPreview>;
}

interface V6GeneratedManifest {
  clientDisplayName: string;
  generatedAt: string;
  files: Array<{
    file: string;
    rows: number;
    dataThinCells: number;
  }>;
}

interface DimensionPreviewConfig {
  dimension: string;
  title: string;
  files: string[];
  columns: HomeV6BrowserColumn[];
}

const LINEAGE_COLUMNS: HomeV6BrowserColumn[] = [
  col("__loaded_record", "Loaded record"),
  col("__source_family", "Source family"),
  col("__source_basis", "Basis"),
];

const V6_DATASET_BY_CLIENT: Record<ClientKey, string> = {
  apexretail: "apex-retail-synthetic-v6",
  arcturus: "first-capital-financial-synthetic-v6",
  firstcapital: "first-capital-financial-synthetic-v6",
  meridian: "meridian-health-synthetic-v6",
  northstar: "northstar-clinical-tech-synthetic-v1",
  skyharbor: "skyharbor-air-synthetic-v6",
  lakeshore: "lakeshore-holdings-synthetic-v6",
};

const DIMENSION_PREVIEWS: DimensionPreviewConfig[] = [
  preview(
    "Enterprise Profile",
    "Enterprise profile rows",
    ["V6_01_enterprise_profile.csv"],
    [
      col("company_name", "Company"),
      col("industry", "Industry"),
      col("business_model", "Business model"),
      col("strategic_priorities", "Priorities"),
    ],
  ),
  preview(
    "Business & Operating Model",
    "Business functions",
    ["V6_02_business_functions.csv"],
    [
      col("function_name", "Function"),
      col("executive_owner", "Owner"),
      col("operating_model", "Operating model"),
      col("critical_processes", "Critical processes"),
    ],
  ),
  preview(
    "Workforce & Personas",
    "Workforce personas",
    ["V6_04_workforce_personas.csv"],
    [
      col("persona_name", "Persona"),
      col("business_area", "Area"),
      col("population_count", "Population"),
      col("ai_relevance", "AI relevance"),
    ],
  ),
  preview(
    "Business Metrics",
    "Metric definitions",
    ["V6_14_metric_definitions.csv"],
    [
      col("metric_name", "Metric"),
      col("metric_owner", "Owner"),
      col("unit_of_measure", "Unit"),
      col("metric_claim_level", "Claim level"),
    ],
  ),
  preview(
    "Capabilities & Value Streams",
    "Capabilities by business function",
    ["V6_02_business_functions.csv"],
    [
      col("function_name", "Capability area"),
      col("primary_kpis", "Primary KPIs"),
      col("critical_processes", "Critical processes"),
      col("executive_owner", "Owner"),
    ],
  ),
  preview(
    "Applications & Core Systems",
    "Application and system inventory",
    ["V6_05_applications_systems.csv"],
    [
      col("system_name", "System"),
      col("business_capability", "Capability"),
      col("system_owner", "Owner"),
      col("criticality", "Criticality"),
    ],
  ),
  preview(
    "Infrastructure & Cloud",
    "Infrastructure-related system coverage",
    ["V6_05_applications_systems.csv"],
    [
      col("system_name", "Platform/system"),
      col("lifecycle_status", "Lifecycle"),
      col("annual_cost_usd", "Annual cost"),
      col("data_dependencies", "Dependencies"),
    ],
  ),
  preview(
    "Data & Analytics Estate",
    "Data assets and analytics coverage",
    ["V6_06_data_assets_integrations.csv"],
    [
      col("data_asset_name", "Data asset"),
      col("data_owner", "Owner"),
      col("system_of_record", "System of record"),
      col("governance_status", "Governance"),
    ],
  ),
  preview(
    "Integrations & Interfaces",
    "Data and integration dependencies",
    ["V6_06_data_assets_integrations.csv"],
    [
      col("data_asset_name", "Object"),
      col("system_of_record", "System"),
      col("lineage", "Lineage"),
      col("consumers", "Consumers"),
    ],
  ),
  preview(
    "Security & Compliance",
    "Risk, control, and compliance coverage",
    ["V6_11_operations_risk_controls.csv"],
    [
      col("process", "Process/control area"),
      col("process_owner", "Owner"),
      col("severity", "Severity"),
      col("control", "Control"),
    ],
  ),
  preview(
    "Vendors & Contracts",
    "Vendors and contracts",
    ["V6_07_vendors_contracts.csv"],
    [
      col("vendor_name", "Vendor"),
      col("service", "Service"),
      col("renewal_date", "Renewal"),
      col("contract_risk", "Risk/gap"),
    ],
  ),
  preview(
    "IT Budget & Financials",
    "Spend and value records",
    ["V6_08_spend_value.csv"],
    [
      col("amount_usd", "Amount"),
      col("amount_type", "Type"),
      col("owner", "Owner"),
      col("value_linkage", "Value linkage"),
    ],
  ),
  preview(
    "AI & Automation Footprint",
    "AI initiatives and automation footprint",
    ["V6_10_ai_initiatives.csv"],
    [
      col("use_case", "Use case"),
      col("tool_or_model", "Tool/model"),
      col("active_users", "Active users"),
      col("data_readiness", "Data readiness"),
    ],
  ),
  preview(
    "Initiatives & Roadmap",
    "Programs and initiatives",
    ["V6_09_programs_initiatives.csv"],
    [
      col("record_name", "Program"),
      col("phase", "Phase"),
      col("status", "Status"),
      col("decision_needed", "Decision needed"),
    ],
  ),
  preview(
    "Benefits Realization",
    "Value and benefit evidence",
    ["V6_08_spend_value.csv"],
    [
      col("record_name", "Value record"),
      col("amount_usd", "Amount"),
      col("amount_type", "Amount type"),
      col("unit_economics", "Unit economics"),
    ],
  ),
  preview(
    "Risk & RAID Log",
    "Risks and constraints",
    ["V6_11_operations_risk_controls.csv"],
    [
      col("process", "Risk/control area"),
      col("severity", "Severity"),
      col("status", "Status"),
      col("business_impact", "Business impact"),
    ],
  ),
  preview(
    "Operations & Service",
    "Operations and service evidence",
    ["V6_11_operations_risk_controls.csv"],
    [
      col("process", "Process"),
      col("process_owner", "Owner"),
      col("affected_systems", "Affected systems"),
      col("business_impact", "Impact"),
    ],
  ),
  preview(
    "AI Governance & Policy",
    "AI governance and metric boundaries",
    ["V6_10_ai_initiatives.csv"],
    [
      col("use_case", "AI use case"),
      col("risk_status", "Risk status"),
      col("model_risk_tier", "Model risk"),
      col("scale_hold_stop", "Scale/hold/stop"),
    ],
  ),
  preview(
    "Industry Benchmarks",
    "Industry corpus patterns",
    ["V6_15_industry_corpus_patterns.csv"],
    [
      col("pattern_name", "Pattern"),
      col("industry_domain", "Domain"),
      col("when_to_apply", "Use when"),
      col("corpus_context_label", "Context label"),
    ],
  ),
];

export function getHomeV6ContextBrowser(
  tenantKey: string | null | undefined,
): HomeV6ContextBrowser | null {
  const appClientKey = appClientKeyForTenant(tenantKey ?? "") ?? null;
  if (!appClientKey) return null;
  const datasetDir = V6_DATASET_BY_CLIENT[appClientKey];
  const datasetRoot = path.join(process.cwd(), "datasets", datasetDir);
  const manifestPath = path.join(datasetRoot, "V6_GENERATED_MANIFEST.json");
  if (!existsSync(manifestPath)) return null;

  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf8"),
  ) as V6GeneratedManifest;
  const filesByName = new Map(
    manifest.files.map((file) => [path.basename(file.file), file]),
  );
  const dimensions: HomeV6ContextBrowser["dimensions"] = {};
  for (const config of DIMENSION_PREVIEWS) {
    const sourceRows: Array<Record<string, string>> = config.files.flatMap(
      (fileName) => {
        const sourcePath = path.join(datasetRoot, "templates", fileName);
        if (!existsSync(sourcePath)) return [];
        return parseCsv(readFileSync(sourcePath, "utf8")).map(
          (row, index) =>
            ({
              ...row,
              __file: fileName,
              __rowNumber: String(index + 2),
            }) as Record<string, string>,
        );
      },
    );
    const displayColumns = previewColumns(config);
    const displayRows = sourceRows
      .filter((row) =>
        displayColumns.some((column) =>
          hasPreviewValue(rawPreviewValue(row, column)),
        ),
      )
      .sort(
        (left, right) =>
          previewScore(right, displayColumns) -
          previewScore(left, displayColumns),
      )
      .slice(0, 12);
    const manifestFiles = config.files
      .map((fileName) => filesByName.get(fileName))
      .filter((file): file is NonNullable<typeof file> => Boolean(file));
    dimensions[config.dimension] = {
      dimension: config.dimension,
      title: config.title,
      fileNames: config.files,
      rowCount:
        manifestFiles.reduce((sum, file) => sum + file.rows, 0) ||
        sourceRows.length,
      dataThinCells:
        manifestFiles.reduce((sum, file) => sum + file.dataThinCells, 0) ||
        countDataThinCells(sourceRows),
      sourceCount: config.files.length,
      columns: displayColumns,
      rows: displayRows
        .slice(0, 8)
        .map((row) =>
          displayColumns.map((column) => display(rawPreviewValue(row, column))),
        ),
      sourceRows: displayRows.map((row) => toSourceRow(row, displayColumns)),
      knownGaps: topKnownGaps(sourceRows),
    };
  }

  return {
    tenantKey: appClientKey,
    displayName:
      manifest.clientDisplayName || getClientOption(appClientKey).name,
    datasetDir,
    generatedAt: manifest.generatedAt,
    runtimeSource: "local-v6",
    dimensions,
  };
}

function preview(
  dimension: string,
  title: string,
  files: string[],
  columns: HomeV6BrowserColumn[],
): DimensionPreviewConfig {
  return { dimension, title, files, columns };
}

function col(key: string, label: string): HomeV6BrowserColumn {
  return { key, label };
}

function previewColumns(config: DimensionPreviewConfig): HomeV6BrowserColumn[] {
  const lineageKeys = new Set(LINEAGE_COLUMNS.map((column) => column.key));
  return [
    ...LINEAGE_COLUMNS,
    ...config.columns.filter((column) => !lineageKeys.has(column.key)),
  ];
}

function rawPreviewValue(
  row: Record<string, string>,
  column: HomeV6BrowserColumn,
): string | undefined {
  switch (column.key) {
    case "__loaded_record":
      return loadedRecordLabel(row);
    case "__source_family":
      return firstDisplayValue(row.source_file, row.__file) ?? "";
    case "__source_basis":
      return (
        firstDisplayValue(
          row.source_basis,
          row.source_system,
          row.source_owner,
        ) ?? ""
      );
    default:
      return row[column.key];
  }
}

function previewScore(
  row: Record<string, string>,
  columns: HomeV6BrowserColumn[],
): number {
  return columns.reduce(
    (score, column) =>
      score + (hasPreviewValue(rawPreviewValue(row, column)) ? 1 : 0),
    0,
  );
}

function toSourceRow(
  row: Record<string, string>,
  columns: HomeV6BrowserColumn[],
): HomeV6BrowserSourceRow {
  const rowId =
    firstDisplayValue(row.record_id, row.id, row.source_id, row.entity_id) ||
    `${row.__file ?? "V6 row"}:${row.__rowNumber ?? "unknown"}`;
  const label = loadedRecordLabel(row) || rowId;
  return {
    v6File: row.__file ?? "unknown",
    rowNumber: Number(row.__rowNumber ?? 0),
    rowId,
    label: display(label),
    values: Object.fromEntries(
      columns.map((column) => [
        column.label,
        display(rawPreviewValue(row, column)),
      ]),
    ),
    knownGaps: collectKnownGaps(row),
  };
}

function loadedRecordLabel(row: Record<string, string>): string {
  const rowId =
    firstDisplayValue(row.record_id, row.id, row.source_id, row.entity_id) ??
    "";
  const label =
    firstDisplayValue(
      row.record_name,
      row.company_name,
      row.system_name,
      row.data_asset_name,
      row.vendor_name,
      row.use_case,
      row.metric_name,
      row.pattern_name,
      row.process,
      row.function_name,
      row.org_unit_name,
    ) ?? "";
  if (rowId && label && rowId !== label) return `${rowId} - ${label}`;
  return rowId || label;
}

function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows.map((values) =>
    Object.fromEntries(
      header.map((column, index) => [column, values[index] ?? ""]),
    ),
  );
}

function countDataThinCells(rows: Array<Record<string, string>>): number {
  return rows.reduce(
    (count, row) =>
      count +
      Object.values(row).filter((value) =>
        String(value).startsWith("data_thin:"),
      ).length,
    0,
  );
}

function topKnownGaps(
  rows: Array<Record<string, string>>,
): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const label of collectKnownGaps(row)) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));
}

function collectKnownGaps(row: Record<string, string>): string[] {
  const gaps = new Set<string>();
  for (const value of Object.values(row)) {
    const raw = String(value ?? "").trim();
    if (!raw.startsWith("data_thin:")) continue;
    gaps.add(humanize(raw.replace("data_thin:", "")));
  }
  for (const gap of String(row.known_gaps ?? "").split("|")) {
    const clean = gap.trim();
    if (!clean.startsWith("data_thin:")) continue;
    gaps.add(humanize(clean.replace("data_thin:", "")));
  }
  return [...gaps].slice(0, 6);
}

function firstDisplayValue(
  ...values: Array<string | undefined>
): string | null {
  for (const value of values) {
    const raw = String(value ?? "").trim();
    if (!raw || raw.startsWith("data_thin:")) continue;
    return raw;
  }
  return null;
}

function hasPreviewValue(value: string | undefined): boolean {
  const raw = String(value ?? "").trim();
  return Boolean(raw && !raw.startsWith("data_thin:"));
}

function display(value: string | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "Not loaded";
  if (raw.startsWith("data_thin:")) {
    return "Needs evidence";
  }
  if (/^-?\d+(\.\d+)?$/.test(raw) && raw.length > 4) {
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) return numeric.toLocaleString();
  }
  return raw.replace(/_/g, " ");
}

function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

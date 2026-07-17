import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  appClientKeyForTenant,
  canonicalTenantKey,
  tenantProfileForClientKey,
} from "@/lib/tenant/aliases";
import type {
  HomeCxoStoryBlock,
  HomeCxoVisualSpec,
  HomeV6BrowserColumn,
  HomeV6BrowserSourceRow,
  HomeV6ContextBrowser,
} from "@/lib/home/v6-context-browser";

interface LocalContextConfig {
  tenantKey: string;
  displayName: string;
  artifactStoreDir: string;
  requiresApprovedStoryBlocks: boolean;
}

interface StandardDimensionConfig {
  file: string;
  label: string;
  columns: string[];
}

interface ApprovedStoryPayload {
  tenant_key: string;
  validation?: { status?: string };
  story_blocks?: HomeCxoStoryBlock[];
}

interface ApprovedVisualPayload {
  tenant_key: string;
  validation?: { status?: string };
  visual_specs?: HomeCxoVisualSpec[];
}

const LOCAL_CONTEXTS: Record<string, LocalContextConfig> = {
  "skyharbor-air": {
    tenantKey: "skyharbor-air",
    displayName: "SkyHarbor Air",
    artifactStoreDir:
      "datasets/context-artifacts/approved/skyharbor-air/home-knowledge",
    requiresApprovedStoryBlocks: true,
  },
  "first-capital": {
    tenantKey: "first-capital",
    displayName: "First Capital Financial",
    artifactStoreDir:
      "datasets/context-artifacts/approved/first-capital/home-knowledge",
    requiresApprovedStoryBlocks: true,
  },
  "meridian-health": {
    tenantKey: "meridian-health",
    displayName: "Healthcare Demo",
    artifactStoreDir:
      "datasets/context-artifacts/approved/meridian-health/home-knowledge",
    requiresApprovedStoryBlocks: false,
  },
};

const STANDARD_DIMENSIONS: StandardDimensionConfig[] = [
  {
    file: "00_enterprise_profile.csv",
    label: "Enterprise Profile",
    columns: [
      "business_name",
      "industry",
      "tenant_archetype",
      "summary",
      "confidence",
    ],
  },
  {
    file: "01_business_functions.csv",
    label: "Business Functions",
    columns: [
      "business_name",
      "owner_role",
      "operating_model",
      "metrics_or_kpis",
      "processes",
    ],
  },
  {
    file: "02_org_ownership.csv",
    label: "Org Ownership",
    columns: [
      "business_name",
      "owner_role",
      "operating_model",
      "metrics_or_kpis",
      "processes",
    ],
  },
  {
    file: "03_workforce_roles.csv",
    label: "Workforce Roles",
    columns: [
      "interview_group",
      "priority_theme",
      "decision_supported",
      "evidence_needed",
      "known_challenge",
    ],
  },
  {
    file: "04_applications_systems.csv",
    label: "Applications & Systems",
    columns: [
      "business_name",
      "capability",
      "owner",
      "criticality",
      "lifecycle_status",
      "integrations",
    ],
  },
  {
    file: "05_data_assets_integrations.csv",
    label: "Data Assets & Integrations",
    columns: [
      "business_name",
      "use_case",
      "data_domain",
      "systems",
      "evidence_needed",
    ],
  },
  {
    file: "06_infrastructure_platforms.csv",
    label: "Infrastructure & Platforms",
    columns: [
      "business_name",
      "capability",
      "owner",
      "criticality",
      "lifecycle_status",
      "data_dependencies",
    ],
  },
  {
    file: "07_vendors_contracts.csv",
    label: "Vendors & Contracts",
    columns: [
      "business_name",
      "service",
      "owning_function",
      "linked_systems",
      "contract_risk",
      "pricing_basis",
    ],
  },
  {
    file: "08_it_budget_spend_value.csv",
    label: "IT Budget, Spend & Value",
    columns: [
      "business_name",
      "value_hypothesis",
      "amount_usd",
      "realized_value_usd",
      "value_boundary",
    ],
  },
  {
    file: "09_programs_initiatives.csv",
    label: "Programs & Initiatives",
    columns: [
      "business_name",
      "use_case",
      "data_domain",
      "systems",
      "evidence_needed",
    ],
  },
  {
    file: "10_ai_automation_use_cases.csv",
    label: "AI & Automation Use Cases",
    columns: [
      "business_name",
      "use_case",
      "data_domain",
      "systems",
      "evidence_needed",
    ],
  },
  {
    file: "11_risks_controls.csv",
    label: "Risks & Controls",
    columns: [
      "business_name",
      "use_case",
      "risk_or_gap",
      "affected_systems",
      "metric_boundary",
    ],
  },
  {
    file: "12_relationships.csv",
    label: "Relationships",
    columns: [
      "business_name",
      "use_case",
      "risk_or_gap",
      "affected_systems",
      "metric_boundary",
    ],
  },
  {
    file: "13_evidence_sources.csv",
    label: "Evidence Sources",
    columns: [
      "business_name",
      "evidence_type",
      "evidence_location",
      "evidence_owner",
      "evidence_boundary",
    ],
  },
  {
    file: "14_metrics_outcomes.csv",
    label: "Metrics & Outcomes",
    columns: [
      "business_name",
      "use_case",
      "risk_or_gap",
      "affected_systems",
      "metric_boundary",
    ],
  },
  {
    file: "15_industry_context_patterns.csv",
    label: "Industry Context Patterns",
    columns: [
      "business_name",
      "industry_context",
      "signals",
      "module_next_actions",
      "confidence",
    ],
  },
  {
    file: "16_expert_lenses.csv",
    label: "Expert Lenses",
    columns: [
      "business_name",
      "industry_context",
      "signals",
      "module_next_actions",
      "confidence",
    ],
  },
  {
    file: "17_managed_services_scope.csv",
    label: "Managed Services Scope",
    columns: [
      "business_name",
      "service",
      "owning_function",
      "linked_systems",
      "contract_risk",
      "pricing_basis",
    ],
  },
  {
    file: "18_operational_process_evidence.csv",
    label: "Operational Process Evidence",
    columns: [
      "business_name",
      "industry_context",
      "signals",
      "module_next_actions",
      "confidence",
    ],
  },
];

const NON_PREVIEW_COLUMNS = new Set([
  "tenant_key",
  "record_key",
  "source_file_key",
  "created_at",
  "updated_at",
  "data_provider_name",
  "data_provider_role",
  "source_artifact_type",
  "source_artifact_name",
  "capture_method",
  "extraction_method",
  "generated_by",
  "validated_by",
  "source_validation_status",
  "source_as_of_date",
  "known_gaps",
  "forbidden_claims",
]);

export function getLocalCxoRuntimeBrowser(
  tenantKey: string | null | undefined,
): HomeV6ContextBrowser | null {
  const config = resolveLocalContextConfig(tenantKey);
  if (!config) return null;

  const standardRoot = path.join(
    process.cwd(),
    "datasets/tenant-inputs",
    config.tenantKey,
    "standard-2026-07-v3",
  );
  if (!existsSync(standardRoot)) return null;

  const storyBlocks = readApprovedStoryBlocks(config);
  if (config.requiresApprovedStoryBlocks && !storyBlocks) return null;
  const visualSpecs = readApprovedVisualSpecs(config) ?? [];

  const dimensions: HomeV6ContextBrowser["dimensions"] = {};
  const bindingContext: NonNullable<HomeV6ContextBrowser["bindingContext"]> =
    [];

  for (const dimensionConfig of STANDARD_DIMENSIONS) {
    const sourceFile = dimensionConfig.file;
    const sourcePath = path.join(standardRoot, sourceFile);
    if (!existsSync(sourcePath)) continue;
    const rows = readCsv(readFileSync(sourcePath, "utf8")).filter(
      isDefaultRuntimeRow,
    );
    const label = dimensionConfig.label;
    const columns = previewColumns(dimensionConfig, rows);
    const previewRows = rows
      .filter((row) =>
        columns.some((column) => hasPreviewValue(row[column.key])),
      )
      .slice(0, 12);
    const gapRows = countEvidenceGaps(rows);
    const knownGaps = topKnownGaps(previewRows, gapRows);
    dimensions[label] = {
      dimension: label,
      title: `${label} evidence preview`,
      fileNames: [sourceFile],
      rowCount: rows.length,
      dataThinCells: gapRows || countDataThinCells(rows),
      sourceCount: 1,
      columns,
      rows: previewRows
        .slice(0, 8)
        .map((row) => columns.map((column) => display(row[column.key]))),
      sourceRows: previewRows.map((row, index) =>
        toSourceRow(sourceFile, index + 2, row, columns),
      ),
      knownGaps,
    };
    bindingContext.push({
      dimension: label,
      status: rows.length > 0 ? "loaded" : "not loaded",
      description: storyDescription(storyBlocks ?? [], label),
      evidence: rows.length,
      sources: 1,
      trust: rows.length > 0 ? 84 : 0,
      flag: knownGaps.length
        ? `${knownGaps.length} evidence gap groups`
        : undefined,
    });
  }

  return {
    tenantKey: config.tenantKey,
    displayName: displayNameFromProfile(standardRoot) || config.displayName,
    datasetDir: `datasets/tenant-inputs/${config.tenantKey}/standard-2026-07-v3`,
    generatedAt: generatedAtForStandardInputs(standardRoot),
    contractLabel: "Local standard v3",
    runtimeSource: "local-v3-standard",
    cxoStoryBlocks: storyBlocks ?? undefined,
    cxoVisualSpecs: visualSpecs,
    bindingContext,
    dimensions,
  };
}

export function getStoredKnowledgeHomeInsightSummary(
  tenantKey: string | null | undefined,
): HomeCxoStoryBlock | null {
  const browser = getLocalCxoRuntimeBrowser(tenantKey);
  return (
    browser?.cxoStoryBlocks?.find(
      (block) => block.approved_for_render && block.surface === "home",
    ) ?? null
  );
}

export function getStoredKnowledgeDimensionNarratives(
  tenantKey: string | null | undefined,
): HomeCxoStoryBlock[] {
  return (
    getLocalCxoRuntimeBrowser(tenantKey)?.cxoStoryBlocks?.filter(
      (block) => block.approved_for_render && block.surface !== "home",
    ) ?? []
  );
}

export function getStoredKnowledgeVisualSpecs(
  tenantKey: string | null | undefined,
): HomeCxoVisualSpec[] {
  return getLocalCxoRuntimeBrowser(tenantKey)?.cxoVisualSpecs ?? [];
}

function resolveLocalContextConfig(
  tenantKey: string | null | undefined,
): LocalContextConfig | null {
  const appKey = appClientKeyForTenant(tenantKey) ?? null;
  const canonical = appKey
    ? tenantProfileForClientKey(appKey).canonicalKey
    : canonicalTenantKey(tenantKey ?? "");
  return LOCAL_CONTEXTS[canonical] ?? null;
}

function readApprovedStoryBlocks(
  config: LocalContextConfig,
): HomeCxoStoryBlock[] | null {
  const storyPath = path.join(
    process.cwd(),
    config.artifactStoreDir,
    "approved-cxo-story-blocks.json",
  );
  if (!existsSync(storyPath)) return null;
  const payload = readJson<ApprovedStoryPayload>(storyPath);
  if (payload.tenant_key !== config.tenantKey) return null;
  if (payload.validation?.status !== "pass") return null;
  const blocks = payload.story_blocks ?? [];
  if (!blocks.every((block) => block.approved_for_render)) return null;
  return blocks;
}

function readApprovedVisualSpecs(
  config: LocalContextConfig,
): HomeCxoVisualSpec[] | null {
  const visualPath = path.join(
    process.cwd(),
    config.artifactStoreDir,
    "approved-cxo-visual-specs.json",
  );
  if (!existsSync(visualPath)) return null;
  const payload = readJson<ApprovedVisualPayload>(visualPath);
  if (payload.tenant_key !== config.tenantKey) return null;
  if (payload.validation?.status !== "pass") return null;
  return payload.visual_specs ?? [];
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function readCsv(text: string): Array<Record<string, string>> {
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

function previewColumns(
  dimensionConfig: StandardDimensionConfig,
  rows: Array<Record<string, string>>,
): HomeV6BrowserColumn[] {
  const preferred = dimensionConfig.columns;
  const available = new Set(rows.flatMap((row) => Object.keys(row)));
  const selected = preferred.filter((column) => available.has(column));
  const selectedSet = new Set(selected);
  const fallback = [...available].filter(
    (column) =>
      !selectedSet.has(column) &&
      !NON_PREVIEW_COLUMNS.has(column) &&
      !/_id$|_ids$|_ref$|_refs$/i.test(column) &&
      rows.some((row) => hasPreviewValue(row[column])),
  );
  return [...selected, ...fallback].slice(0, 6).map((column) => ({
    key: column,
    label: humanize(column),
  }));
}

function isDefaultRuntimeRow(row: Record<string, string>): boolean {
  const status = String(row.active_candidate_status ?? "active")
    .trim()
    .toLowerCase();
  return status !== "candidate";
}

function displayNameFromProfile(standardRoot: string): string | null {
  const profilePath = path.join(standardRoot, "00_enterprise_profile.csv");
  if (!existsSync(profilePath)) return null;
  const profile = readCsv(readFileSync(profilePath, "utf8")).find(
    isDefaultRuntimeRow,
  );
  const name = display(profile?.business_name);
  return name === "Needs evidence" ? null : name;
}

function generatedAtForStandardInputs(standardRoot: string): string {
  const profilePath = path.join(standardRoot, "00_enterprise_profile.csv");
  try {
    return new Date(
      readFileSync(profilePath).byteLength ? statMtimeMs(profilePath) : 0,
    ).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

function statMtimeMs(file: string): number {
  return existsSync(file) ? statSync(file).mtimeMs : 0;
}

function countEvidenceGaps(rows: Array<Record<string, string>>): number {
  return rows.reduce((sum, row) => sum + collectKnownGaps(row).length, 0);
}

function toSourceRow(
  fileName: string,
  rowNumber: number,
  row: Record<string, string>,
  columns: HomeV6BrowserColumn[],
): HomeV6BrowserSourceRow {
  const label = firstDisplayValue(
    row.business_name,
    row.context_item,
    row.record_name,
    row.entity_name,
    row.system_name,
    row.data_asset_name,
    row.vendor_name,
    row.ai_use_case,
    row.priority_name,
    row.metric_name,
    row.process_control_name,
  );
  return {
    v6File: fileName,
    rowNumber,
    rowId: `Source row ${rowNumber}`,
    label: label || `${fileName} row ${rowNumber}`,
    values: Object.fromEntries(
      columns.map((column) => [column.label, display(row[column.key])]),
    ),
    knownGaps: collectKnownGaps(row),
  };
}

function storyDescription(
  blocks: HomeCxoStoryBlock[],
  dimension: string,
): string {
  const block = storyBlockForDimension(blocks, dimension);
  return (
    block?.executive_summary ??
    `${dimension} context is available locally with deterministic source rows and evidence caveats.`
  );
}

function storyBlockForDimension(
  blocks: HomeCxoStoryBlock[],
  dimension: string,
): HomeCxoStoryBlock | null {
  const wanted = normalizeDimension(dimension);
  return (
    blocks.find((block) => normalizeDimension(block.dimension) === wanted) ??
    blocks.find((block) => normalizeDimension(block.title).includes(wanted)) ??
    null
  );
}

function normalizeDimension(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/^\d+\s+/, "")
    .replace(/\band\b/g, "&")
    .replace(/[^a-z0-9&]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countDataThinCells(rows: Array<Record<string, string>>): number {
  return rows.reduce((sum, row) => sum + collectKnownGaps(row).length, 0);
}

function topKnownGaps(
  rows: Array<Record<string, string>>,
  fallbackCount: number,
): HomeV6ContextBrowser["dimensions"][string]["knownGaps"] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const gap of collectKnownGaps(row)) {
      counts.set(gap, (counts.get(gap) ?? 0) + 1);
    }
  }
  const mapped = [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([label, count]) => ({
      label,
      count,
      whyItMatters: `${label} should be validated before this area supports executive decisions.`,
      howItHelps: `Closing ${label.toLowerCase()} improves context reliability for scoped questions and downstream module handoff.`,
    }));
  if (mapped.length) return mapped;
  if (fallbackCount <= 0) return [];
  return [
    {
      label: "Evidence validation",
      count: fallbackCount,
      whyItMatters:
        "The local pack marks this area as planning-grade until client evidence is validated.",
      howItHelps:
        "Validation separates safe orientation from decision-grade recommendations.",
    },
  ];
}

function collectKnownGaps(row: Record<string, string>): string[] {
  const gaps = new Set<string>();
  for (const value of Object.values(row)) {
    const raw = String(value ?? "").trim();
    if (
      /^(not_loaded|not_provided|needs evidence)$/i.test(raw) ||
      /^data_thin:/i.test(raw)
    ) {
      gaps.add("Evidence needed");
    }
  }
  const gapText = [
    row.known_gaps,
    row.evidence_needed,
    row.risk_or_gap,
    row.known_challenge,
    row.contract_risk,
    row.value_boundary,
    row.metric_boundary,
  ]
    .filter(Boolean)
    .join("|");
  for (const gap of gapText.split(/[|;]/)) {
    const clean = gap.trim();
    if (!clean) continue;
    if (
      /synthetic|not real|no realized|target-state|contracts|rfp|bafo/i.test(
        clean,
      )
    ) {
      continue;
    }
    gaps.add(humanize(clean.replace(/^data_thin:/i, "")));
  }
  return [...gaps].slice(0, 8);
}

function firstDisplayValue(
  ...values: Array<string | undefined>
): string | null {
  for (const value of values) {
    const raw = display(value);
    if (raw !== "Needs evidence") return raw;
  }
  return null;
}

function hasPreviewValue(value: unknown): boolean {
  return display(value) !== "Needs evidence";
}

function display(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw || /^not_loaded$/i.test(raw) || /^data_thin:/i.test(raw)) {
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

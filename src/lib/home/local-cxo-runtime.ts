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
  canonicalApprovedDir?: string;
  legacyArtifactStoreDir: string;
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

interface V3ApprovedStoryBlock {
  story_block_id: string;
  tenant_key: string;
  module: string;
  section: string;
  title: string;
  executive_summary: string;
  business_meaning?: string;
  what_context_reveals?: string;
  why_it_matters?: string;
  evidence_boundary?: string;
  recommended_next_action?: string;
  approved_status?: string;
}

interface V3ApprovedVisualSpec {
  visual_spec_id: string;
  tenant_key: string;
  module: string;
  visual_type: string;
  title: string;
  business_question: string;
  data_requirements?: string | string[];
  safety_notes?: string;
  approved_status?: string;
}

interface ApprovedHomeContent {
  storyBlocks: HomeCxoStoryBlock[] | null;
  visualSpecs: HomeCxoVisualSpec[];
  source:
    | "canonical-v3-approved-content"
    | "legacy-approved-home-knowledge"
    | "none";
}

const LOCAL_CONTEXTS: Record<string, LocalContextConfig> = {
  "skyharbor-air": {
    tenantKey: "skyharbor-air",
    displayName: "SkyHarbor Air",
    legacyArtifactStoreDir:
      "datasets/context-artifacts/approved/skyharbor-air/home-knowledge",
    requiresApprovedStoryBlocks: true,
  },
  "first-capital": {
    tenantKey: "first-capital",
    displayName: "First Capital Financial",
    legacyArtifactStoreDir:
      "datasets/context-artifacts/approved/first-capital/home-knowledge",
    requiresApprovedStoryBlocks: true,
  },
  "meridian-health": {
    tenantKey: "meridian-health",
    displayName: "Healthcare Demo",
    canonicalApprovedDir:
      "datasets/tenant-inputs/meridian-health/approved-content/home",
    legacyArtifactStoreDir:
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
      "financial_fact_name",
      "financial_fact_type",
      "fiscal_year",
      "budget_amount_usd",
      "run_budget_usd",
      "change_budget_usd",
      "budget_row_level",
      "additive_status",
      "ai_spend_flag",
      "ai_spend_category",
      "finance_attestation_status",
      "caveat",
    ],
  },
  {
    file: "09_programs_initiatives.csv",
    label: "Programs & Initiatives",
    columns: [
      "business_name",
      "initiative_name",
      "program_code",
      "initiative_status",
      "funding_status",
      "approved_funding_usd",
      "requested_funding_usd",
      "linked_budget_record_ids",
      "linked_sa02_records",
      "value_claim_status",
      "tower_tracking_status",
      "caveat",
    ],
  },
  {
    file: "10_ai_automation_use_cases.csv",
    label: "AI & Automation Use Cases",
    columns: [
      "business_name",
      "use_case_name",
      "data_domain",
      "affected_process",
      "use_case_status",
      "value_outcome",
      "funding_status",
      "readiness_status",
      "measurement_status",
      "risk_control_status",
      "tower_tracking_status",
      "evidence_needed",
      "caveat",
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

  const approvedContent = readApprovedHomeContent(config);
  const storyBlocks = approvedContent.storyBlocks;
  if (config.requiresApprovedStoryBlocks && !storyBlocks) return null;
  const visualSpecs = approvedContent.visualSpecs;

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
      );
    const gapRows = countEvidenceGaps(rows);
    const knownGaps = topKnownGaps(previewRows, gapRows);
    const displayRows = previewRows.slice(0, 12);
    dimensions[label] = {
      dimension: label,
      title: `${label} evidence preview`,
      fileNames: [sourceFile],
      rowCount: rows.length,
      dataThinCells: gapRows || countDataThinCells(rows),
      sourceCount: 1,
      columns,
      rows: displayRows
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
    cxoContentSource: approvedContent.source,
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

function readApprovedHomeContent(config: LocalContextConfig): ApprovedHomeContent {
  const canonical = readCanonicalApprovedHomeContent(config);
  if (canonical.storyBlocks?.length || canonical.visualSpecs.length) {
    return canonical;
  }
  const legacy = readLegacyApprovedHomeContent(config);
  if (legacy.storyBlocks?.length || legacy.visualSpecs.length) return legacy;
  return { storyBlocks: null, visualSpecs: [], source: "none" };
}

function readCanonicalApprovedHomeContent(
  config: LocalContextConfig,
): ApprovedHomeContent {
  if (!config.canonicalApprovedDir) {
    return { storyBlocks: null, visualSpecs: [], source: "none" };
  }
  const root = path.join(process.cwd(), config.canonicalApprovedDir);
  const storyPath = path.join(root, "story-blocks.json");
  const visualPath = path.join(root, "visual-specs.json");
  if (!existsSync(storyPath)) {
    return { storyBlocks: null, visualSpecs: [], source: "none" };
  }
  const rawStories = readJson<V3ApprovedStoryBlock[]>(storyPath);
  if (!Array.isArray(rawStories)) {
    return { storyBlocks: null, visualSpecs: [], source: "none" };
  }
  const storyBlocks = rawStories
    .filter(
      (block) =>
        block.tenant_key === config.tenantKey &&
        block.module === "home" &&
        canonicalApprovedStatus(block.approved_status),
    )
    .map(toHomeCxoStoryBlock);
  const visualSpecs = existsSync(visualPath)
    ? readJson<V3ApprovedVisualSpec[]>(visualPath)
        .filter(
          (spec) =>
            spec.tenant_key === config.tenantKey &&
            spec.module === "home" &&
            canonicalApprovedStatus(spec.approved_status),
        )
        .map(toHomeCxoVisualSpec)
    : [];
  return {
    storyBlocks: storyBlocks.length ? storyBlocks : null,
    visualSpecs,
    source: "canonical-v3-approved-content",
  };
}

function readLegacyApprovedHomeContent(
  config: LocalContextConfig,
): ApprovedHomeContent {
  const storyPath = path.join(
    process.cwd(),
    config.legacyArtifactStoreDir,
    "approved-cxo-story-blocks.json",
  );
  const visualPath = path.join(
    process.cwd(),
    config.legacyArtifactStoreDir,
    "approved-cxo-visual-specs.json",
  );
  let storyBlocks: HomeCxoStoryBlock[] | null = null;
  if (existsSync(storyPath)) {
    const payload = readJson<ApprovedStoryPayload>(storyPath);
    if (
      payload.tenant_key === config.tenantKey &&
      payload.validation?.status === "pass" &&
      (payload.story_blocks ?? []).every((block) => block.approved_for_render)
    ) {
      storyBlocks = payload.story_blocks ?? [];
    }
  }
  let visualSpecs: HomeCxoVisualSpec[] = [];
  if (existsSync(visualPath)) {
    const payload = readJson<ApprovedVisualPayload>(visualPath);
    if (payload.tenant_key === config.tenantKey && payload.validation?.status === "pass") {
      visualSpecs = payload.visual_specs ?? [];
    }
  }
  return {
    storyBlocks,
    visualSpecs,
    source:
      storyBlocks?.length || visualSpecs.length
        ? "legacy-approved-home-knowledge"
        : "none",
  };
}

function canonicalApprovedStatus(status: string | undefined): boolean {
  return /approved|source_grounded|claude_ready/i.test(status ?? "");
}

function toHomeCxoStoryBlock(block: V3ApprovedStoryBlock): HomeCxoStoryBlock {
  return {
    block_id: block.story_block_id,
    surface: "home",
    dimension: block.section,
    title: block.title,
    executive_summary: block.executive_summary,
    what_context_reveals: block.what_context_reveals ?? "",
    why_it_matters: block.why_it_matters ?? "",
    decision_implication: block.business_meaning ?? block.evidence_boundary ?? "",
    evidence_still_needed: block.evidence_boundary ?? "",
    module_usage: "Home context browser; downstream synthesis belongs in Intelligence, Moves, Source, or Tower.",
    next_validation_action: block.recommended_next_action ?? "",
    approved_for_render: true,
  };
}

function toHomeCxoVisualSpec(spec: V3ApprovedVisualSpec): HomeCxoVisualSpec {
  const requirements = Array.isArray(spec.data_requirements)
    ? spec.data_requirements
    : [spec.data_requirements ?? "Source fact IDs and evidence IDs must resolve before rendering."];
  return {
    visual_id: spec.visual_spec_id,
    type: spec.visual_type,
    surface: "home",
    title: spec.title,
    purpose: spec.business_question,
    data_requirements: requirements,
    chart_allowed: true,
    why_chart_allowed_or_not: spec.safety_notes ?? "Render only from source-grounded visual payloads.",
    placement: "Home companion context",
    evidence_boundary: spec.safety_notes ?? "Do not render as production truth without validation.",
  };
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
  return !/^(blocked|rejected|retired|inactive|deleted)$/.test(status);
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

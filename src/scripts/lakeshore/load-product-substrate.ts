import crypto from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import Papa from "papaparse";
import { Client } from "pg";
import { buildEventScaffold } from "@/lib/source/canvas-substrate";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

type CsvRow = Record<string, string>;

type ManifestFile = {
  templateId: string;
  dimension: string;
  label: string;
  rows: number;
  path: string;
  ownerRole: string;
};

type Manifest = {
  tenantKey: "lakeshore";
  brokerKey: "lakeshore-holdings";
  displayName: string;
  syntheticNotice: string;
  dataFiles: ManifestFile[];
};

type Summary = {
  status: "dry_run" | "committed";
  clientId: string;
  inventorySegments: number;
  inventoryRecords: number;
  sourceEvents: number;
  sourceArtifactStates: number;
  sourceGateCriterionStates: number;
  sourceEvidenceStates: number;
  engagements: number;
  aiInitiatives: number;
  towerVendorSpend: number;
  towerProgramFinancials: number;
  towerCloudCost: number;
  vendorContracts: number;
  aiInitiativeKpis: number;
  aiInitiativeDecisions: number;
  warnings: string[];
};

const ROOT = path.resolve(process.cwd(), "docs/build/lakeshore/loaded");
const MANIFEST_PATH = path.join(ROOT, "manifest.json");
const CANONICAL_TENANT_KEY = "lakeshore-holdings";
const APP_CLIENT_KEY = "lakeshore";
const LOADER_ID = "lakeshore-product-substrate-v1";
const NOW = new Date().toISOString();
const REVIEW_DATE = NOW.slice(0, 10);

const SEGMENT_MAP: Record<
  string,
  { segmentId: string; segmentName: string; familyNumber: number }
> = {
  enterprise_profile: {
    segmentId: "enterprise_profile",
    segmentName: "Enterprise profile",
    familyNumber: 1,
  },
  org_roles: {
    segmentId: "org_structure",
    segmentName: "Org structure",
    familyNumber: 2,
  },
  org_roles_teams: {
    segmentId: "org_structure",
    segmentName: "Org structure",
    familyNumber: 2,
  },
  application_portfolio: {
    segmentId: "it_landscape",
    segmentName: "IT system landscape",
    familyNumber: 3,
  },
  erp_landscape: {
    segmentId: "it_landscape",
    segmentName: "IT system landscape",
    familyNumber: 3,
  },
  integration_topology: {
    segmentId: "it_landscape",
    segmentName: "IT system landscape",
    familyNumber: 3,
  },
  site_plant_inventory: {
    segmentId: "it_landscape",
    segmentName: "IT system landscape",
    familyNumber: 3,
  },
  manufacturing_sites: {
    segmentId: "it_landscape",
    segmentName: "IT system landscape",
    familyNumber: 3,
  },
  financial_kpis: {
    segmentId: "it_financials",
    segmentName: "IT financials",
    familyNumber: 4,
  },
  segment_pnl: {
    segmentId: "it_financials",
    segmentName: "IT financials",
    familyNumber: 4,
  },
  business_units_segment_pnl: {
    segmentId: "it_financials",
    segmentName: "IT financials",
    familyNumber: 4,
  },
  annual_quarterly_reports: {
    segmentId: "it_financials",
    segmentName: "IT financials",
    familyNumber: 4,
  },
  initiative_portfolio: {
    segmentId: "program_inventory",
    segmentName: "Program inventory",
    familyNumber: 6,
  },
  transformation_initiatives: {
    segmentId: "program_inventory",
    segmentName: "Program inventory",
    familyNumber: 6,
  },
  strategy_memo: {
    segmentId: "program_inventory",
    segmentName: "Program inventory",
    familyNumber: 6,
  },
  c_suite_strategy: {
    segmentId: "program_inventory",
    segmentName: "Program inventory",
    familyNumber: 6,
  },
  incidents_change: {
    segmentId: "operating_telemetry",
    segmentName: "Operating telemetry",
    familyNumber: 10,
  },
  incidents_ops_telemetry: {
    segmentId: "operating_telemetry",
    segmentName: "Operating telemetry",
    familyNumber: 10,
  },
  dora_baseline: {
    segmentId: "operating_telemetry",
    segmentName: "Operating telemetry",
    familyNumber: 10,
  },
  delivery_dora_devex: {
    segmentId: "operating_telemetry",
    segmentName: "Operating telemetry",
    familyNumber: 10,
  },
  vendor_contracts: {
    segmentId: "vendor_contracts",
    segmentName: "Vendor and contract",
    familyNumber: 11,
  },
  qms_events: {
    segmentId: "compliance",
    segmentName: "Compliance and regulatory",
    familyNumber: 12,
  },
  regulatory_qms_risk: {
    segmentId: "compliance",
    segmentName: "Compliance and regulatory",
    familyNumber: 12,
  },
  ai_tool_footprint: {
    segmentId: "compliance",
    segmentName: "Compliance and regulatory",
    familyNumber: 12,
  },
  ai_tooling_model_inventory: {
    segmentId: "compliance",
    segmentName: "Compliance and regulatory",
    familyNumber: 12,
  },
  product_portfolio: {
    segmentId: "industry_context",
    segmentName: "Industry context",
    familyNumber: 13,
  },
  market_signals: {
    segmentId: "industry_context",
    segmentName: "Industry context",
    familyNumber: 13,
  },
  market_competitor_intel: {
    segmentId: "industry_context",
    segmentName: "Industry context",
    familyNumber: 13,
  },
};

function argValue(name: string): string | null {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function readManifest(): Manifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
}

function readCsv(relativePath: string): CsvRow[] {
  const csv = readFileSync(path.join(ROOT, relativePath), "utf8");
  const parsed = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  if (parsed.errors.length > 0) {
    throw new Error(
      `csv_parse_failed:${relativePath}:${parsed.errors[0]?.message ?? "unknown"}`,
    );
  }
  return parsed.data;
}

function stableUuid(seed: string): string {
  const hex = crypto.createHash("sha256").update(seed).digest("hex");
  const variant = ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(
    16,
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

function numberFrom(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function dollars(value: unknown): number {
  return numberFrom(value) ?? 0;
}

function isoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const direct = /^\d{4}-\d{2}-\d{2}/.exec(value.trim());
  if (direct) return direct[0];
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toISOString().slice(0, 10);
}

function quarterDates(period: string | undefined): {
  start: string;
  end: string;
} {
  const match = /^(\d{4})-Q([1-4])$/.exec(period ?? "");
  if (!match) return { start: "2026-01-01", end: "2026-03-31" };
  const year = Number(match[1]);
  const quarter = Number(match[2]);
  const startMonth = (quarter - 1) * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function segmentFor(file: ManifestFile): {
  segmentId: string;
  segmentName: string;
  familyNumber: number;
} {
  return (
    SEGMENT_MAP[file.dimension] ?? {
      segmentId: "cross_program_signals",
      segmentName: "Cross-program signals",
      familyNumber: 14,
    }
  );
}

async function query<T extends Record<string, unknown>>(
  client: Client,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await client.query<T>(sql, params);
  return result.rows;
}

async function upsertRows(
  client: Client,
  table: string,
  rows: Record<string, unknown>[],
  conflictColumns: string[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const columns = Object.keys(rows[0] ?? {});
  const updateColumns = columns.filter(
    (column) => !conflictColumns.includes(column),
  );
  let written = 0;
  for (let offset = 0; offset < rows.length; offset += 200) {
    const batch = rows.slice(offset, offset + 200);
    const values: unknown[] = [];
    const tuples = batch.map((row) => {
      const placeholders = columns.map((column) => {
        values.push(row[column] ?? null);
        return `$${values.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });
    const quotedColumns = columns.map((column) => `"${column}"`).join(", ");
    const quotedConflict = conflictColumns
      .map((column) => `"${column}"`)
      .join(", ");
    const updateSql = updateColumns.length
      ? `do update set ${updateColumns.map((column) => `"${column}" = excluded."${column}"`).join(", ")}`
      : "do nothing";
    await client.query(
      `insert into ${table} (${quotedColumns}) values ${tuples.join(", ")} on conflict (${quotedConflict}) ${updateSql}`,
      values,
    );
    written += batch.length;
  }
  return written;
}

async function deleteLoadedRows(
  client: Client,
  clientId: string,
): Promise<void> {
  await client.query(
    "delete from ai_initiative_decisions where loaded_via_template = $1",
    [LOADER_ID],
  );
  await client.query(
    "delete from ai_initiative_kpis where loaded_via_template = $1",
    [LOADER_ID],
  );
  await client.query(
    "delete from ai_initiative_vendors where loaded_via_template = $1",
    [LOADER_ID],
  );
  await client.query(
    "delete from source_value_chain where source_event_id in (select id from source_events where client_key = $1 and created_by_user_id = $2)",
    [APP_CLIENT_KEY, LOADER_ID],
  );
  await client.query("delete from source_value_states where created_by = $1", [
    LOADER_ID,
  ]);
  await client.query(
    "delete from source_event_artifact_states where source_event_id in (select id from source_events where client_key = $1 and created_by_user_id = $2)",
    [APP_CLIENT_KEY, LOADER_ID],
  );
  await client.query(
    "delete from source_event_gate_criterion_states where source_event_id in (select id from source_events where client_key = $1 and created_by_user_id = $2)",
    [APP_CLIENT_KEY, LOADER_ID],
  );
  await client.query(
    "delete from source_event_evidence_states where source_event_id in (select id from source_events where client_key = $1 and created_by_user_id = $2)",
    [APP_CLIENT_KEY, LOADER_ID],
  );
  await client.query(
    "delete from source_events where client_key = $1 and created_by_user_id = $2",
    [APP_CLIENT_KEY, LOADER_ID],
  );
  await client.query(
    `delete from program_risks where engagement_id in (select id from engagements where client_id = $1 and graph_node_id like 'move:lakeshore:%')`,
    [clientId],
  );
  await client.query(
    `delete from program_work_items where engagement_id in (select id from engagements where client_id = $1 and graph_node_id like 'move:lakeshore:%')`,
    [clientId],
  );
  await client.query(
    `delete from program_milestones where engagement_id in (select id from engagements where client_id = $1 and graph_node_id like 'move:lakeshore:%')`,
    [clientId],
  );
  await client.query(
    `delete from engagements where client_id = $1 and graph_node_id like 'move:lakeshore:%'`,
    [clientId],
  );
  await client.query(
    "delete from ai_initiatives where client_id = $1 and loaded_via_template = $2",
    [clientId, LOADER_ID],
  );
}

function inventoryRows(
  manifest: Manifest,
  csvByPath: Map<string, CsvRow[]>,
  clientId: string,
) {
  const segmentRollups = new Map<
    string,
    {
      segmentId: string;
      segmentName: string;
      familyNumber: number;
      recordCount: number;
      sourcePaths: string[];
      ownerRoles: string[];
    }
  >();
  for (const file of manifest.dataFiles) {
    const mapped = segmentFor(file);
    const current = segmentRollups.get(mapped.segmentId) ?? {
      ...mapped,
      recordCount: 0,
      sourcePaths: [],
      ownerRoles: [],
    };
    current.recordCount += csvByPath.get(file.path)?.length ?? file.rows;
    current.sourcePaths.push(file.path);
    current.ownerRoles.push(file.ownerRole);
    segmentRollups.set(mapped.segmentId, current);
  }

  const segments = [...segmentRollups.values()].map((segment) => ({
    client_id: clientId,
    tenant_key: CANONICAL_TENANT_KEY,
    segment_id: segment.segmentId,
    segment_name: segment.segmentName,
    family_number: segment.familyNumber,
    expected_baseline: JSON.stringify({
      sourcePaths: segment.sourcePaths,
      expectedRows: segment.recordCount,
      syntheticNotice: manifest.syntheticNotice,
    }),
    coverage_score: 100,
    health_state: "complete",
    record_count: segment.recordCount,
    stale_count: 0,
    missing_count: 0,
    last_reviewed_at: NOW,
    last_ingested_at: NOW,
    provenance_summary: JSON.stringify({
      loader: LOADER_ID,
      sourcePaths: segment.sourcePaths,
      ownerRoles: [...new Set(segment.ownerRoles)],
      syntheticNotice: manifest.syntheticNotice,
    }),
  }));

  const records = manifest.dataFiles.flatMap((file) => {
    const { segmentId } = segmentFor(file);
    return (csvByPath.get(file.path) ?? []).map((row, index) => {
      const baseRecordId = String(
        row.source_record_id ||
          row.contract_id ||
          row.initiative_id ||
          row.app_id ||
          row.period ||
          `${file.templateId}-${index + 1}`,
      );
      const recordId = `${file.templateId}:${baseRecordId}:${index + 1}`;
      const title = String(
        row.title ||
          row.vendor_name ||
          row.name ||
          row.metric ||
          row.priority ||
          row.product_name ||
          recordId,
      );
      return {
        client_id: clientId,
        tenant_key: CANONICAL_TENANT_KEY,
        segment_id: segmentId,
        record_id: `${segmentId}:${recordId}`,
        title,
        record_kind:
          segmentId === "vendor_contracts"
            ? "vendor_contract"
            : segmentId === "it_financials"
              ? "it_financial_line"
              : file.templateId,
        source_doc: file.path,
        source_path: path.join("docs/build/lakeshore/loaded", file.path),
        source_basis: "tenant_admin_upload",
        uploaded_by: "Lakeshore governed loader projection",
        uploaded_at: NOW,
        data_classification: "Internal",
        confidence: numberFrom(row.confidence) ?? 0.86,
        last_reviewed: isoDate(row.last_validated_date) ?? REVIEW_DATE,
        freshness_state: "fresh",
        ingestion_status: "indexed",
        indexed_at: NOW,
        record_text: JSON.stringify(row),
        record_payload: JSON.stringify({
          ...row,
          synthetic_label: row.synthetic_label ?? manifest.syntheticNotice,
        }),
        created_at: NOW,
        updated_at: NOW,
      };
    });
  });

  return { segments, records };
}

function buildSourceEvents(
  clientId: string,
  initiatives: CsvRow[],
  contracts: CsvRow[],
) {
  const kyriba =
    initiatives.find((row) => row.initiative_id === "PGM-KYRIBA") ??
    initiatives[0];
  const kyribaContract = contracts.find((row) =>
    /kyriba/i.test(row.vendor_name ?? ""),
  );
  const treasuryValue =
    dollars(kyriba?.projected_value_usd) ||
    dollars(kyribaContract?.annual_value_usd) * 10;
  return [
    {
      id: stableUuid("lakeshore-source-kyriba-treasury-sourcing"),
      client_key: APP_CLIENT_KEY,
      event_code: "LSH-KYRIBA-TREASURY-2026",
      event_name: "Kyriba Treasury Rollout Commercial Readiness",
      event_type: "software",
      current_stage_key: "executive_decision",
      lifecycle_state: "active",
      linked_program_id: stableUuid(
        `lakeshore-engagement:${kyriba?.initiative_id ?? "PGM-KYRIBA"}`,
      ),
      estimated_value_usd: Math.round(treasuryValue),
      value_at_stake_low_usd: Math.round(treasuryValue * 0.75),
      value_at_stake_high_usd: Math.round(treasuryValue * 1.15),
      trigger_description:
        "CFO and Global CIO need holdco-level treasury controls, cash visibility, and transition readiness evidence from the Lakeshore bundle.",
      scope_description:
        "Kyriba treasury rollout, bank connectivity, ERP integration, opco adoption, vendor terms, and value proof for FY2026-FY2028.",
      decision_owner: "Daniel Whitaker / Meera Rao",
      created_by_user_id: LOADER_ID,
      lead_agent: "sentinel",
      current_stage_entered_at: NOW,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: stableUuid("lakeshore-source-ams-modernization-sourcing"),
      client_key: APP_CLIENT_KEY,
      event_code: "LSH-AMS-MODERNIZATION-2026",
      event_name: "Holdco AMS and Integration Modernization",
      event_type: "managed_service",
      current_stage_key: "evaluation",
      lifecycle_state: "active",
      linked_program_id: stableUuid("lakeshore-engagement:PGM-DATA-FABRIC"),
      estimated_value_usd: 18000000,
      value_at_stake_low_usd: 12000000,
      value_at_stake_high_usd: 26000000,
      trigger_description:
        "Application portfolio and integration-topology evidence shows TSA dependencies, critical integrations, and AMS run-cost concentration.",
      scope_description:
        "Finance core, ERP integrations, application operations, data platform dependencies, and vendor transition controls across holdco and opcos.",
      decision_owner: "Meera Rao",
      created_by_user_id: LOADER_ID,
      lead_agent: "sentinel",
      current_stage_entered_at: NOW,
      created_at: NOW,
      updated_at: NOW,
    },
  ];
}

function buildEngagements(clientId: string, initiatives: CsvRow[]) {
  return initiatives.slice(0, 6).map((row, index) => {
    const projected = dollars(row.projected_value_usd);
    const committed = dollars(row.committed_usd);
    const phase = row.gate === "design" ? 2 : row.gate === "scale" ? 4 : 1;
    return {
      id: stableUuid(`lakeshore-engagement:${row.initiative_id}`),
      graph_node_id: `move:lakeshore:${row.initiative_id}`,
      name: row.title,
      industry_code: "DIVERSIFIED",
      function_code: "TECHNOLOGY",
      objective_code: "VALUE_CREATION",
      topic_code: row.initiative_id,
      current_phase: phase,
      status: row.status === "active" ? "active" : "draft",
      charter: JSON.stringify({
        headline: row.title,
        sponsorDecision: row.sponsor_role,
        baselineNeed:
          "Grounded in Lakeshore synthetic bundle loaded through governed ingestion.",
        sourceSystem: row.source_system,
        sourceRecordId: row.source_record_id,
      }),
      gates_passed: JSON.stringify(
        index === 0 ? ["p0_intake", "p1_charter"] : ["p0_intake"],
      ),
      decisions: JSON.stringify([]),
      deliverables: JSON.stringify([]),
      sponsor_approvals: JSON.stringify([]),
      baseline_metrics: JSON.stringify([
        { label: "Committed funding", value: committed, unit: "USD" },
        { label: "Projected value", value: projected, unit: "USD" },
      ]),
      client_id: clientId,
      program_archetype: "strategic_transformation",
      origin_source: "intelligence_promoted",
      origin_source_ref: null,
      maestro_oversight_level: "full",
      founder_approval_required: false,
      current_module_key: "charter",
      data_residency_region: "us",
      retention_policy_years: 7,
      solution: row.title,
      is_demo_data: true,
      lifecycle_state: "approved",
      problem_statement: `Lakeshore needs governed execution for ${row.title} across holdco and opco dependencies.`,
      target_outcome: `Realize ${projected ? `$${Math.round(projected / 1000000)}M` : "documented"} projected value with auditable evidence.`,
      timeline_horizon: "FY2026-FY2028",
      value_projected_low_usd: Math.round(projected * 0.75),
      value_projected_high_usd: Math.round(projected || committed),
      value_verified_usd: 0,
      value_verified_status: "pending",
      value_currency: "USD",
      value_assumptions_jsonb: JSON.stringify({
        source: "initiative-portfolio.csv",
        committedUsd: committed,
        projectedUsd: projected,
      }),
      function_pack_key: "technology_transformation",
      function_pack_confidence: 0.72,
      created_at: NOW,
      updated_at: NOW,
    };
  });
}

function buildAiInitiatives(clientId: string, initiatives: CsvRow[]) {
  return initiatives.map((row) => {
    const projected = dollars(row.projected_value_usd);
    const committed = dollars(row.committed_usd);
    return {
      initiative_id: `LSH-${row.initiative_id}`,
      client_id: clientId,
      display_id: row.initiative_id,
      name: row.title,
      description: `${row.title} from Lakeshore initiative portfolio (${row.source_system}).`,
      primary_category_id: /governance|policy|risk/i.test(row.title)
        ? "CAT-08"
        : /data|integration|architecture/i.test(row.title)
          ? "CAT-06"
          : "CAT-03",
      secondary_category_id: /treasury|erp/i.test(row.title) ? "CAT-04" : null,
      primary_goal_id: "LSH-GOAL-01",
      stage: row.status === "active" ? "pilot" : "multi_year_strategic_bet",
      stage_detail: row.gate || row.status || null,
      owner_name: row.sponsor_role || "Global CIO / CFO",
      owner_title: row.sponsor_role || "Global CIO / CFO",
      owner_function: "Technology / Finance",
      committed_annual_usd: committed,
      committed_total_usd: committed,
      measured_value_usd: projected,
      status_flag: projected > committed ? "healthy" : "value_lag",
      status_summary: `${row.title}: committed $${Math.round(committed / 1000000)}M, projected $${Math.round(projected / 1000000)}M from governed Lakeshore bundle.`,
      confidence_level: "MED",
      aligned_callout: projected >= committed,
      aligned_rationale: `Evidence: ${row.source_system} / ${row.source_record_id}`,
      loaded_via_template: LOADER_ID,
      created_at: NOW,
      updated_at: NOW,
      metadata: JSON.stringify({
        ...row,
        syntheticLabel: "SYNTHETIC / ILLUSTRATIVE",
      }),
    };
  });
}

function buildTowerRows(
  clientId: string,
  initiatives: CsvRow[],
  contracts: CsvRow[],
  financials: CsvRow[],
) {
  const vendors = contracts.map((row) => ({
    client_id: clientId,
    vendor_id: row.vendor_id,
    vendor_name: row.vendor_name,
    cost_center: row.opco_id || row.opco || "LSH-HOLDCO",
    gl_account: row.category || "IT vendor spend",
    ttm_spend_usd: dollars(row.annual_value_usd),
    source: "manual_upload",
    source_file_id: null,
    source_system: "manual_upload",
    created_at: NOW,
    updated_at: NOW,
  }));
  const programFinancials = initiatives.map((row) => {
    const period = quarterDates("2026-Q1");
    return {
      client_id: clientId,
      program_id: row.initiative_id,
      period_start: period.start,
      period_end: period.end,
      budget_usd: dollars(row.committed_usd),
      actual_usd: Math.round(dollars(row.committed_usd)),
      capex_usd: Math.round(dollars(row.committed_usd) * 0.55),
      opex_usd: Math.round(dollars(row.committed_usd) * 0.45),
      vendor_id: String(row.linked_app_ids || "").includes("KYRIBA")
        ? "VEN-KYRIBA"
        : null,
      cost_center: row.opco_id || "LSH-HOLDCO",
      gl_account: "Transformation portfolio",
      source: "manual_upload",
      source_file_id: null,
      source_system: "manual_upload",
      created_at: NOW,
      updated_at: NOW,
    };
  });
  const cloudCost = financials.slice(0, 24).map((row, index) => {
    const period = quarterDates(row.period);
    return {
      client_id: clientId,
      subscription_id: `lsh-sub-${String(row.segment || "holdco")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`,
      resource_group: `rg-lakeshore-${String(row.segment || "holdco")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`,
      resource_name: `fin-${String(row.metric || "metric")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
      service: "Azure",
      meter_category: row.metric || "financial-kpi",
      location: "eastus",
      tag_program: row.segment || "Holdco",
      tag_environment: "pilot",
      period_start: period.start,
      period_end: period.end,
      monthly_cost_usd: Math.max(1000, Math.round(dollars(row.value) / 1000)),
      currency: row.currency_or_unit === "USD" ? "USD" : "USD",
      source: "azure-cost",
      source_file_id: null,
      ingested_at: NOW,
    };
  });
  return { vendors, programFinancials, cloudCost };
}

function buildAiChildren(initiatives: CsvRow[], contracts: CsvRow[]) {
  const kpis = initiatives.flatMap((row) => [
    {
      initiative_id: `LSH-${row.initiative_id}`,
      kpi_name: "Committed funding",
      kpi_unit: "USD",
      quarter: "2026-Q1",
      kpi_value: dollars(row.committed_usd),
      target_value: dollars(row.projected_value_usd),
      peer_median: null,
      confidence_level: "MED",
      loaded_via_template: LOADER_ID,
      created_at: NOW,
    },
    {
      initiative_id: `LSH-${row.initiative_id}`,
      kpi_name: "Projected value",
      kpi_unit: "USD",
      quarter: "2026-Q1",
      kpi_value: dollars(row.projected_value_usd),
      target_value: dollars(row.projected_value_usd),
      peer_median: null,
      confidence_level: "MED",
      loaded_via_template: LOADER_ID,
      created_at: NOW,
    },
  ]);
  const decisions = initiatives.map((row) => ({
    initiative_id: `LSH-${row.initiative_id}`,
    decision_name: `${row.gate || "Gate"} readiness review`,
    decision_date: REVIEW_DATE,
    sponsor_name: row.sponsor_role || "Global CIO / CFO",
    decision_status: row.status === "active" ? "decided" : "pending",
    dissent_recorded: false,
    dissent_summary: null,
    outcome_status: "tracked",
    loaded_via_template: LOADER_ID,
    created_at: NOW,
  }));
  const vendors = contracts.slice(0, 10).map((row) => ({
    initiative_id: "LSH-PGM-KYRIBA",
    vendor_name: row.vendor_name,
    contract_value_usd: dollars(row.annual_value_usd),
    renewal_date: isoDate(row.renewal_date),
    financial_health: "moderate",
    notes: `${row.category}; ${row.exit_terms}`,
    loaded_via_template: LOADER_ID,
    created_at: NOW,
  }));
  return { kpis, decisions, vendors };
}

async function ensureGoals(client: Client, clientId: string): Promise<void> {
  const rows = [
    [
      "LSH-GOAL-01",
      "Holdco value creation and treasury control",
      "Kyriba, ERP, and integration modernization need auditable value realization across Lakeshore opcos.",
      1,
    ],
    [
      "LSH-GOAL-02",
      "Governed AI and data foundation",
      "Use AI only where Lakeshore policy, data classification, and review evidence permit it.",
      2,
    ],
    [
      "LSH-GOAL-03",
      "Opco integration and execution resilience",
      "Reduce TSA, integration, vendor, and operational fragility across the portfolio.",
      3,
    ],
  ].map(([goal_id, name, strategic_context, display_order]) => ({
    goal_id,
    client_id: clientId,
    name,
    strategic_context,
    display_order,
    loaded_via_template: LOADER_ID,
    created_at: NOW,
    updated_at: NOW,
  }));
  await upsertRows(client, "ai_business_goals", rows, ["goal_id"]);
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const outPath = argValue("--out");
  const manifest = readManifest();
  const csvByPath = new Map(
    manifest.dataFiles.map((file) => [file.path, readCsv(file.path)]),
  );
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const clientRows = await query<{ id: string }>(
      client,
      `select id::text from clients where tenant_key = $1 or name ilike 'Lakeshore%' order by created_at limit 1`,
      [CANONICAL_TENANT_KEY],
    );
    const clientId = clientRows[0]?.id;
    if (!clientId) throw new Error("lakeshore_client_not_found");

    const initiatives = csvByPath.get("data/initiative-portfolio.csv") ?? [];
    const contracts = csvByPath.get("data/vendor-contracts.csv") ?? [];
    const financials = csvByPath.get("data/financial-kpi-workbook.csv") ?? [];
    const { segments, records } = inventoryRows(manifest, csvByPath, clientId);
    const sourceEvents = buildSourceEvents(clientId, initiatives, contracts);
    const engagements = buildEngagements(clientId, initiatives);
    const aiInitiatives = buildAiInitiatives(clientId, initiatives);
    const tower = buildTowerRows(clientId, initiatives, contracts, financials);
    const children = buildAiChildren(initiatives, contracts);
    const sourceScaffold = sourceEvents.map((event) =>
      buildEventScaffold({
        sourceEventId: event.id,
        tenantKey: event.client_key,
      }),
    );
    const summary: Summary = {
      status: dryRun ? "dry_run" : "committed",
      clientId,
      inventorySegments: segments.length,
      inventoryRecords: records.length,
      sourceEvents: sourceEvents.length,
      sourceArtifactStates: sourceScaffold.flatMap((row) => row.artifactStates)
        .length,
      sourceGateCriterionStates: sourceScaffold.flatMap(
        (row) => row.gateCriterionStates,
      ).length,
      sourceEvidenceStates: sourceScaffold.flatMap((row) => row.evidenceStates)
        .length,
      engagements: engagements.length,
      aiInitiatives: aiInitiatives.length,
      towerVendorSpend: tower.vendors.length,
      towerProgramFinancials: tower.programFinancials.length,
      towerCloudCost: tower.cloudCost.length,
      vendorContracts: contracts.length,
      aiInitiativeKpis: children.kpis.length,
      aiInitiativeDecisions: children.decisions.length,
      warnings: [],
    };

    if (!dryRun) {
      await client.query("begin");
      try {
        await deleteLoadedRows(client, clientId);
        await ensureGoals(client, clientId);
        await upsertRows(client, "data_inventory_segments", segments, [
          "tenant_key",
          "segment_id",
        ]);
        await upsertRows(client, "data_inventory_records", records, [
          "tenant_key",
          "segment_id",
          "record_id",
        ]);
        await upsertRows(client, "source_events", sourceEvents, [
          "client_key",
          "event_code",
        ]);
        await upsertRows(
          client,
          "source_event_artifact_states",
          sourceScaffold.flatMap(
            (row) => row.artifactStates,
          ) as unknown as Record<string, unknown>[],
          ["source_event_id", "artifact_code"],
        );
        await upsertRows(
          client,
          "source_event_gate_criterion_states",
          sourceScaffold.flatMap(
            (row) => row.gateCriterionStates,
          ) as unknown as Record<string, unknown>[],
          ["source_event_id", "criterion_id"],
        );
        await upsertRows(
          client,
          "source_event_evidence_states",
          sourceScaffold.flatMap(
            (row) => row.evidenceStates,
          ) as unknown as Record<string, unknown>[],
          ["source_event_id", "requirement_id"],
        );
        await upsertRows(client, "engagements", engagements, ["id"]);
        await upsertRows(client, "ai_initiatives", aiInitiatives, [
          "initiative_id",
        ]);
        await upsertRows(client, "tower_vendor_spend", tower.vendors, [
          "client_id",
          "vendor_id",
        ]);
        await upsertRows(
          client,
          "tower_program_financials",
          tower.programFinancials,
          ["client_id", "program_id", "period_start"],
        );
        await upsertRows(client, "tower_cloud_cost", tower.cloudCost, [
          "client_id",
          "subscription_id",
          "resource_group",
          "resource_name",
          "service",
          "meter_category",
          "period_start",
        ]);
        await upsertRows(client, "ai_initiative_kpis", children.kpis, [
          "initiative_id",
          "kpi_name",
          "quarter",
        ]);
        await upsertRows(
          client,
          "ai_initiative_decisions",
          children.decisions,
          ["initiative_id", "decision_name"],
        );
        await upsertRows(client, "ai_initiative_vendors", children.vendors, [
          "initiative_id",
          "vendor_name",
        ]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }

    if (outPath) {
      mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
      writeFileSync(
        path.resolve(outPath),
        `${JSON.stringify({ ...summary, generatedAt: NOW }, null, 2)}\n`,
      );
    }
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

import { Pool } from "pg";

import { runtimePostgresPoolConfig } from "@/lib/data-plane/postgresCompat";

import type { AskSource, AskSurfaceContext } from "../types";

type JsonRecord = Record<string, unknown>;

interface ServingContractRow {
  surface_key: string;
  product: string;
  serving_view: string;
  ecl_backing: string;
}

interface ServingRow {
  surface_key: string;
  product: string;
  page_key: string | null;
  row_key: string | null;
  row_type: string | null;
  title: string | null;
  summary: string | null;
  basis: string | null;
  value_state: string | null;
  review_state: string | null;
  origin: string | null;
  admission_status: string | null;
  admission_gate_key: string | null;
  admission_result_json: unknown;
  gap_flags_json: unknown;
  source_refs_json: unknown;
  payload_json: unknown;
}

interface SurfacePlan {
  key: string;
  terms: readonly string[];
}

const ECL_PROVIDER = "ecl_projection_db";
const DEFAULT_TENANT = "meridian-health";

const FINDING_SURFACE_PLANS: readonly SurfacePlan[] = [
  {
    key: "F1",
    terms: [
      "multiple suppliers",
      "same capability",
      "same service tower",
      "business function",
      "supplier consolidation",
      "overlap",
    ],
  },
  {
    key: "F2",
    terms: [
      "renewing",
      "intervene",
      "unstoppable",
      "auto-renew",
      "notice window",
      "minimum commitment",
      "benchmarking right",
    ],
  },
  {
    key: "F3",
    terms: [
      "vendor-protective",
      "cohort",
      "benchmarking right",
      "minimum commitment",
      "termination for convenience",
    ],
  },
  {
    key: "F4",
    terms: [
      "duplicate applications",
      "same subdomain",
      "vendor spread",
      "not deployments",
      "rationalization",
    ],
  },
  {
    key: "F5",
    terms: [
      "BI",
      "analytics",
      "tool sprawl",
      "four technologies",
      "ungoverned",
      "active users",
    ],
  },
  {
    key: "F6",
    terms: [
      "Netezza",
      "clinical dependency",
      "vendor support",
      "support end date",
      "DR tier",
      "related applications",
    ],
  },
  {
    key: "F7",
    terms: [
      "GL spend",
      "unattributed",
      "12%",
      "allocation basis",
      "unknown",
      "named gap",
    ],
  },
  {
    key: "F8",
    terms: [
      "value claims",
      "gated",
      "gate reason",
      "evidence needed",
      "next gate",
    ],
  },
  {
    key: "F9",
    terms: [
      "control exceptions",
      "vendor estate",
      "open exceptions",
      "high severity",
      "evidence path",
    ],
  },
  {
    key: "F10",
    terms: [
      "refuse",
      "refused",
      "data-flow",
      "data flow",
      "failed rule",
      "measurement",
      "evidence needed",
    ],
  },
];

const FINDING_SURFACES: Record<string, readonly string[]> = {
  F1: ["source_vendor_portfolio", "source_sourcing_opportunities", "tower_cost_lens"],
  F2: ["source_renewal", "source_contract_360"],
  F3: ["source_contract_360", "source_value", "tower_cost_lens"],
  F4: ["home_applications_systems", "home_technology_data", "tower_cost_lens"],
  F5: ["home_data_assets_integrations", "intelligence_enterprise_landscape"],
  F6: ["home_infrastructure_platforms", "home_current_state_architecture", "tower_risk_lens"],
  F7: ["tower_cost_lens", "home_performance_value"],
  F8: ["tower_value_proof", "tower_evidence", "tower_recommended_actions"],
  F9: ["tower_risk_lens", "source_vendor_360"],
  F10: ["home_current_state_data_flow"],
};

const BASE_INTELLIGENCE_SURFACES = [
  "intelligence_advisory",
  "intelligence_ask_query",
  "intelligence_context_summary",
  "intelligence_enterprise_landscape",
  "intelligence_insights_evaluate",
  "intelligence_pattern_detail",
] as const;

let pool: Pool | null = null;

function connectionString(): string | null {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.ABARVA_AZURE_DATABASE_URL?.trim() ||
    process.env.AZURE_DATABASE_URL?.trim() ||
    null
  );
}

function getPool(): Pool | null {
  if (pool) return pool;
  const url = connectionString();
  if (!url) return null;
  pool = new Pool(runtimePostgresPoolConfig(url, "nexus-ecl-serving-context"));
  return pool;
}

export function isEclProjectionProvider(
  context: AskSurfaceContext | null | undefined,
): boolean {
  if (!context || typeof context !== "object") return false;
  return (
    cleanString(context.substrate) === ECL_PROVIDER ||
    cleanString((context as { provider?: unknown }).provider) === ECL_PROVIDER ||
    cleanString((context as { sourceProvider?: unknown }).sourceProvider) ===
      ECL_PROVIDER
  );
}

export async function retrieveEclServingContextSources(
  context: AskSurfaceContext | null | undefined,
  query: string,
): Promise<AskSource[]> {
  if (!isEclProjectionProvider(context)) return [];
  const client = getPool();
  if (!client) return [];

  const tenantKey =
    cleanString(context?.clientKey) ??
    cleanString(context?.activeClient) ??
    DEFAULT_TENANT;
  const selected = selectedSurfaceKeys(query);
  if (selected.length === 0) return [];

  try {
    const contractResult = await client.query<ServingContractRow>(
      `
        select surface_key, product, serving_view, ecl_backing
        from serving.serving_contract
        where surface_key = any($1::text[])
          and build_state = 'serving_built'
        order by array_position($1::text[], surface_key)
      `,
      [selected],
    );
    const sources: AskSource[] = [];
    for (const contract of contractResult.rows) {
      if (!isSafeServingView(contract.serving_view)) continue;
      const rows = await readServingRows(client, contract, tenantKey, query);
      if (rows.length === 0) continue;
      sources.push(sourceFromRows(contract, rows, tenantKey));
    }
    if (sources.length === 0) return [];
    return sources.slice(0, 10);
  } catch (error) {
    console.warn("[ecl-serving-context.retrieve]", {
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function readServingRows(
  client: Pool,
  contract: ServingContractRow,
  tenantKey: string,
  query: string,
): Promise<ServingRow[]> {
  const terms = searchTermsForQuery(query);
  const baseParams: unknown[] = [tenantKey];
  const textExpr = `
    concat_ws(' ',
      surface_key,
      product,
      page_key,
      row_key,
      row_type,
      title,
      summary,
      basis,
      value_state,
      admission_status,
      admission_gate_key,
      payload_json::text,
      source_refs_json::text,
      gap_flags_json::text,
      admission_result_json::text
    )
  `;
  const termPredicates = terms
    .slice(0, 8)
    .map((_, index) => `${textExpr} ilike $${index + 2}`);
  const params = [...baseParams, ...terms.slice(0, 8).map((term) => `%${term}%`)];
  const matched =
    termPredicates.length > 0
      ? await client.query<ServingRow>(
          `
            select *
            from ${contract.serving_view}
            where tenant_key = $1
              and (${termPredicates.join(" or ")})
            order by
              case when admission_status = 'refused' then 0 else 1 end,
              row_key
            limit 8
          `,
          params,
        )
      : { rows: [] };
  if (matched.rows.length > 0) return matched.rows;

  const fallback = await client.query<ServingRow>(
    `
      select *
      from ${contract.serving_view}
      where tenant_key = $1
      order by
        case when admission_status = 'refused' then 0 else 1 end,
        row_key
      limit 6
    `,
    baseParams,
  );
  return fallback.rows;
}

function selectedSurfaceKeys(query: string): string[] {
  const normalized = query.toLowerCase();
  const selected = new Set<string>(BASE_INTELLIGENCE_SURFACES);
  for (const plan of FINDING_SURFACE_PLANS) {
    if (plan.terms.some((term) => normalized.includes(term.toLowerCase()))) {
      for (const surface of FINDING_SURFACES[plan.key] ?? []) selected.add(surface);
    }
  }
  if (selected.size === BASE_INTELLIGENCE_SURFACES.length) {
    for (const surface of [
      "source_contract_360",
      "source_vendor_360",
      "source_value",
      "tower_cost_lens",
      "tower_value_proof",
      "home_current_state_data_flow",
    ]) {
      selected.add(surface);
    }
  }
  return Array.from(selected);
}

function searchTermsForQuery(query: string): string[] {
  const normalized = query.toLowerCase();
  const terms = new Set<string>();
  for (const plan of FINDING_SURFACE_PLANS) {
    if (plan.terms.some((term) => normalized.includes(term.toLowerCase()))) {
      for (const term of plan.terms) terms.add(term);
    }
  }
  for (const token of normalized.match(/[a-z0-9][a-z0-9-]{2,}/g) ?? []) {
    if (
      ![
        "the",
        "and",
        "for",
        "with",
        "what",
        "which",
        "where",
        "does",
        "should",
        "meridian",
        "health",
      ].includes(token)
    ) {
      terms.add(token);
    }
  }
  return Array.from(terms).slice(0, 16);
}

function sourceFromRows(
  contract: ServingContractRow,
  rows: ServingRow[],
  tenantKey: string,
): AskSource {
  const detail = [
    `ECL serving view: ${contract.serving_view}.`,
    `ECL backing: ${contract.ecl_backing}.`,
    `Tenant: ${tenantKey}.`,
    ...rows.flatMap((row) => rowLines(row)),
  ].join("\n");
  return {
    type: "TENANT",
    name: `ECL ${contract.product} surface ${contract.surface_key}`,
    id: contract.surface_key,
    detail,
    confidence: 0.98,
  };
}

function rowLines(row: ServingRow): string[] {
  const payload = asRecord(row.payload_json);
  const lineParts = [
    row.title ? `title=${row.title}` : null,
    row.summary ? `summary=${row.summary}` : null,
    row.row_type ? `row_type=${row.row_type}` : null,
    row.basis ? `basis=${row.basis}` : null,
    row.value_state ? `value_state=${row.value_state}` : null,
    row.admission_status ? `admission_status=${row.admission_status}` : null,
    row.admission_gate_key ? `admission_gate_key=${row.admission_gate_key}` : null,
  ].filter(Boolean);
  const lines = [`- ${row.row_key ?? "row"}: ${lineParts.join("; ")}`];
  const facts = compactFacts(payload);
  if (facts.length > 0) lines.push(`  facts: ${facts.join("; ")}`);
  const refusal = asRecord(row.admission_result_json);
  if (Object.keys(refusal).length > 0) {
    lines.push(`  admission result: ${humanJson(refusal)}`);
  }
  const gaps = arrayPreview(row.gap_flags_json);
  if (gaps) lines.push(`  gaps: ${gaps}`);
  const refs = arrayPreview(row.source_refs_json);
  if (refs) lines.push(`  source refs: ${refs}`);
  return lines;
}

function compactFacts(payload: JsonRecord): string[] {
  const priorityKeys = [
    "contract_name",
    "vendor_name",
    "service_tower",
    "business_function",
    "opportunity_title",
    "value_gate_status",
    "value_gate_reason_code",
    "value_gate_reason_detail",
    "claim_gate_status",
    "claim_gate_reason_code",
    "claim_gate_reason_detail",
    "next_gate",
    "evidence_needed_json",
    "annualized_value_usd",
    "claimable_value_usd",
    "blocked_value_usd",
    "renewal_notice_date",
    "end_date",
    "auto_renew",
    "notice_window_days",
    "minimum_commitment_usd",
    "benchmarking_right",
    "termination_for_convenience",
    "support_end_date",
    "technology_name",
    "technology_type",
    "governance_state",
    "active_user_count",
    "admission_status",
    "admission_gate_key",
  ];
  const out: string[] = [];
  for (const key of priorityKeys) {
    if (!(key in payload)) continue;
    const value = payload[key];
    if (value === null || value === undefined || value === "") continue;
    out.push(`${humanLabel(key)}=${humanJson(value)}`);
  }
  if (out.length >= 10) return out.slice(0, 10);
  for (const [key, value] of Object.entries(payload)) {
    if (out.length >= 10) break;
    if (priorityKeys.includes(key)) continue;
    if (value === null || value === undefined || value === "") continue;
    if (/(id|hash|uuid|json)$/i.test(key)) continue;
    out.push(`${humanLabel(key)}=${humanJson(value)}`);
  }
  return out;
}

function humanLabel(key: string): string {
  return key.replace(/_/g, " ");
}

function humanJson(value: unknown): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value)
    .replace(/\s+/g, " ")
    .slice(0, 360);
}

function arrayPreview(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value.map(humanJson).join("; ").slice(0, 520);
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function isSafeServingView(value: string): boolean {
  return /^serving\.[a-z0-9_]+$/.test(value);
}

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

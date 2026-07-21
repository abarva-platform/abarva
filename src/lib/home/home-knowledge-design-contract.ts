import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client, type ClientConfig } from "pg";

export type HomeKnowledgePrimitive = string | number | boolean | null;

export type HomeKnowledgeRecord = Record<
  string,
  HomeKnowledgePrimitive | HomeKnowledgePrimitive[] | Record<string, unknown>
>;

export interface HomeKnowledgeDimension {
  key: string;
  name: string;
  count?: number;
  status?: string;
  pct?: string;
  evCount?: number;
  summary?: string;
  covers?: string[];
  sources?: string[];
}

export interface HomeKnowledgeDataColumn {
  k: string;
  label: string;
  pill?: string;
  align?: string;
}

export interface HomeKnowledgeDataSet {
  columns: HomeKnowledgeDataColumn[];
  rows: HomeKnowledgeRecord[];
  facet?: string | { k?: string; label?: string };
  source_file?: string;
  source_layer?: string;
  refreshed_at?: string;
  row_count?: number;
}

export interface HomeKnowledgeStory {
  meaning?: string;
  observed?: string;
  matters?: string;
  supports?: string;
}

export interface HomeKnowledgeInsight {
  findings?: string[];
  breakdown?: {
    title?: string;
    rows?: Array<{ label?: string; value?: string; note?: string }>;
  };
}

export interface HomeKnowledgeRelationship {
  chain?: string[];
  note?: string;
}

export interface HomeKnowledgeGap {
  missing?: string;
  blocks?: string;
  needed?: string;
  handoff?: string;
}

export interface HomeKnowledgeEvidence {
  name?: string;
  type?: string;
  date?: string;
  rows?: string;
  facts?: string;
  st?: string;
  status?: string;
  fields?: string;
  supports?: string;
  missing?: string;
  evidence_refs?: string[];
}

export interface HomeKnowledgeVisualBlock {
  type?:
    | "metric_strip"
    | "decision_matrix"
    | "dependency_flow"
    | "evidence_bar"
    | string;
  title?: string;
  subtitle?: string;
  data?: Record<string, unknown>;
}

export interface HomeKnowledgeDesignSlots {
  DIMS: HomeKnowledgeDimension[];
  FACTS: HomeKnowledgeRecord[];
  KPIS: HomeKnowledgeRecord[];
  BRIEF_COLS: HomeKnowledgeRecord[];
  PRIORITIES: HomeKnowledgeRecord[];
  SIGNALS: HomeKnowledgeRecord[];
  DEC_CAN: string[];
  DEC_CANNOT: string[];
  CONF_TABLE: HomeKnowledgeRecord[];
  GAPS: HomeKnowledgeRecord[];
  USE_CASES: HomeKnowledgeRecord[];
  EVIDENCE: HomeKnowledgeEvidence[];
  NEXT_EVIDENCE: HomeKnowledgeRecord[];
  DATA: Record<string, HomeKnowledgeDataSet>;
  INSIGHTS: Record<string, HomeKnowledgeInsight>;
  STORY: Record<string, HomeKnowledgeStory>;
  REL: Record<string, HomeKnowledgeRelationship>;
  DGAPS: Record<string, HomeKnowledgeGap[]>;
  EVID: Record<string, HomeKnowledgeEvidence[]>;
  VISUAL_BLOCKS?: Record<string, HomeKnowledgeVisualBlock[]>;
}

export interface HomeKnowledgeDesignContractPack {
  tenant_key: string;
  tenant_name: string;
  artifact_type: string;
  prompt_version?: string;
  generated_model?: string;
  generated_at?: string;
  design_contract_source?: string;
  source_context?: Record<string, unknown>;
  design_slots: HomeKnowledgeDesignSlots;
  narrative_sections?: Record<string, unknown>;
  quality_assessment?: Record<string, unknown>;
  validation?: {
    status?: string;
    issues?: string[];
  };
}

export interface HomeKnowledgeDesignContractDiagnostics {
  selectedSource: string | null;
  rejectedSources: Array<{ path: string; reason: string }>;
}

export interface HomeKnowledgeDesignContractResult {
  pack: HomeKnowledgeDesignContractPack | null;
  diagnostics: HomeKnowledgeDesignContractDiagnostics;
}

function disablePostgresSsl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get("sslmode")?.toLowerCase() === "disable") {
      return true;
    }
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function homeKnowledgeDatabaseUrl(): string | null {
  return (
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL ??
    process.env.DATABASE_URL ??
    null
  );
}

function homeKnowledgeClientConfig(connectionString: string): ClientConfig {
  return {
    connectionString,
    application_name: "home-knowledge-pack-v2-read",
    ssl: disablePostgresSsl(connectionString)
      ? false
      : { rejectUnauthorized: false },
  };
}

export async function readHomeKnowledgeDesignContractForTenantFromPostgres(
  tenantKey: string | null | undefined,
): Promise<HomeKnowledgeDesignContractResult | null> {
  const diagnostics: HomeKnowledgeDesignContractDiagnostics = {
    selectedSource: null,
    rejectedSources: [],
  };
  const normalizedTenant = tenantKey?.trim().toLowerCase();
  if (!normalizedTenant) return null;
  const connectionString = homeKnowledgeDatabaseUrl();
  if (!connectionString) return null;

  const client = new Client(homeKnowledgeClientConfig(connectionString));
  try {
    await client.connect();
    const result = await client.query<{
      pack_version: string;
      render_pack: HomeKnowledgeDesignContractPack;
    }>(
      `SELECT pack_version, render_pack
         FROM public.home_knowledge_packs
        WHERE tenant_key = $1
          AND status = 'approved'
          AND effective_to IS NULL
        ORDER BY effective_from DESC NULLS LAST, created_at DESC
        LIMIT 1`,
      [normalizedTenant],
    );
    const row = result.rows[0];
    if (!row?.render_pack) return null;
    const rejection = validateDesignContractPack(row.render_pack, normalizedTenant);
    if (rejection) {
      diagnostics.rejectedSources.push({
        path: `postgres:home_knowledge_packs:${row.pack_version}`,
        reason: rejection,
      });
      return { pack: null, diagnostics };
    }
    diagnostics.selectedSource = `postgres:home_knowledge_packs:${row.pack_version}`;
    return { pack: row.render_pack, diagnostics };
  } catch (error) {
    diagnostics.rejectedSources.push({
      path: "postgres:home_knowledge_packs",
      reason: error instanceof Error ? error.message : "unreadable Postgres pack",
    });
    return { pack: null, diagnostics };
  } finally {
    await client.end().catch(() => undefined);
  }
}

export function readHomeKnowledgeDesignContractForTenant(
  tenantKey: string | null | undefined,
  opts: { rootDir?: string } = {},
): HomeKnowledgeDesignContractResult {
  const diagnostics: HomeKnowledgeDesignContractDiagnostics = {
    selectedSource: null,
    rejectedSources: [],
  };
  const normalizedTenant = tenantKey?.trim().toLowerCase();
  if (!normalizedTenant) return { pack: null, diagnostics };

  const rootDir = opts.rootDir ?? process.cwd();
  const sources = [
    path.join(
      rootDir,
      "datasets/tenant-inputs",
      normalizedTenant,
      "approved-content/home/design-contract-pack.json",
    ),
    path.join(
      rootDir,
      "datasets/context-artifacts/approved",
      normalizedTenant,
      "home-knowledge/approved-home-knowledge-design-contract-pack.json",
    ),
  ];

  for (const source of sources) {
    if (!existsSync(source)) continue;
    try {
      const pack = JSON.parse(
        readFileSync(source, "utf8"),
      ) as HomeKnowledgeDesignContractPack;
      const rejection = validateDesignContractPack(pack, normalizedTenant);
      if (rejection) {
        diagnostics.rejectedSources.push({ path: source, reason: rejection });
        continue;
      }
      diagnostics.selectedSource = source;
      return { pack, diagnostics };
    } catch (error) {
      diagnostics.rejectedSources.push({
        path: source,
        reason: error instanceof Error ? error.message : "unreadable JSON",
      });
    }
  }

  return { pack: null, diagnostics };
}

function validateDesignContractPack(
  pack: HomeKnowledgeDesignContractPack,
  tenantKey: string,
): string | null {
  if (pack.tenant_key !== tenantKey) return "tenant mismatch";
  if (pack.artifact_type !== "NexusHomeKnowledgeDesignContractPack") {
    return "unexpected artifact type";
  }
  if (pack.validation?.status !== "pass") return "validation not pass";
  if (!pack.design_slots?.DIMS?.length) return "missing dimensions";
  if (!pack.design_slots?.DATA) return "missing data slots";
  if (!pack.design_slots?.STORY) return "missing story slots";
  return null;
}

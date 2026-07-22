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
  enterprise_brief?: HomeEnterpriseBriefReadModel;
  validation?: {
    status?: string;
    issues?: string[];
  };
}

export interface HomeEnterpriseBriefReadModel {
  packId: string;
  packVersion: string;
  executiveRead?: HomeEnterpriseBriefExecutiveRead;
  packTier?: HomeEnterpriseBriefPackTier;
  aiReadiness: HomeEnterpriseBriefAiReadiness[];
  strategicNarratives: HomeEnterpriseBriefStrategicNarrative[];
  dimensionModuleImplications: HomeEnterpriseBriefDimensionImplication[];
  source: "postgres";
}

export interface HomeEnterpriseBriefExecutiveRead {
  archetype?: string | null;
  oneSentence?: string | null;
  tensionHeadline?: string | null;
  contextConfidencePct?: number | null;
  contextConfidenceNote?: string | null;
  dataFoundationSummary?: string | null;
  strengths: Array<{ text?: string; evidence_refs?: string[] }>;
  constraints: Array<{ text?: string; evidence_refs?: string[] }>;
  industryForces: string[];
  tenantReality: string[];
  horizons: Array<{ horizon?: string; tone?: string; items?: string[] }>;
}

export interface HomeEnterpriseBriefPackTier {
  tier?: "thin" | "partial" | "rich" | string | null;
  tierLabel?: string | null;
  tierTitle?: string | null;
  tierBody?: string | null;
  tierConditions: Array<{ text?: string }>;
  tierBasis?: string | null;
}

export interface HomeEnterpriseBriefAiReadiness {
  readinessDimension: string;
  scorePct: number;
  tone?: "red" | "amber" | "green" | string | null;
  label?: string | null;
  basis?: string | null;
  evidenceRefs: string[];
}

export interface HomeEnterpriseBriefStrategicNarrative {
  narrativeType:
    | "industry_movement"
    | "new_way_of_operating"
    | "change_thesis"
    | string;
  title: string;
  classification?: string | null;
  executiveNarrative: string;
  currentState?: string | null;
  targetStateOrRelevance?: string | null;
  affectedEntities: string[];
  valueHypothesis?: string | null;
  dependencies: string[];
  evidenceGate?: string | null;
  evidenceRefs: string[];
  confidence?: number | null;
  recommendedNextAction?: string | null;
}

export interface HomeEnterpriseBriefDimensionImplication {
  dimensionKey: string;
  module: "intelligence" | "moves" | "source" | "tower" | string;
  implication: string;
  evidenceRefs: string[];
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
      id: string;
      pack_version: string;
      render_pack: HomeKnowledgeDesignContractPack;
    }>(
      `SELECT id, pack_version, render_pack
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
    const rejection = validateDesignContractPack(
      row.render_pack,
      normalizedTenant,
    );
    if (rejection) {
      diagnostics.rejectedSources.push({
        path: `postgres:home_knowledge_packs:${row.pack_version}`,
        reason: rejection,
      });
      return { pack: null, diagnostics };
    }
    const enrichedPack = await enrichHomeEnterpriseBriefPack(
      client,
      row.id,
      row.pack_version,
      row.render_pack,
    );
    diagnostics.selectedSource = `postgres:home_knowledge_packs:${row.pack_version}`;
    return { pack: enrichedPack, diagnostics };
  } catch (error) {
    diagnostics.rejectedSources.push({
      path: "postgres:home_knowledge_packs",
      reason:
        error instanceof Error ? error.message : "unreadable Postgres pack",
    });
    return { pack: null, diagnostics };
  } finally {
    await client.end().catch(() => undefined);
  }
}

function jsonArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function stringArray(value: unknown): string[] {
  return jsonArray(value)
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function textFromUnknown(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (typeof value === "object" && "text" in value) {
    return textFromUnknown((value as { text?: unknown }).text);
  }
  return "";
}

function readEvidenceRefs(value: unknown): string[] {
  return jsonArray(value)
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function snakeToCamelExecutiveRead(
  row: Record<string, unknown> | undefined,
): HomeEnterpriseBriefExecutiveRead | undefined {
  if (!row) return undefined;
  return {
    archetype: row.archetype as string | null | undefined,
    oneSentence: row.one_sentence as string | null | undefined,
    tensionHeadline: row.tension_headline as string | null | undefined,
    contextConfidencePct:
      row.context_confidence_pct == null
        ? null
        : Number(row.context_confidence_pct),
    contextConfidenceNote: row.context_confidence_note as
      | string
      | null
      | undefined,
    dataFoundationSummary: row.data_foundation_summary as
      | string
      | null
      | undefined,
    strengths: jsonArray(row.strengths),
    constraints: jsonArray(row.constraints),
    industryForces: stringArray(row.industry_forces),
    tenantReality: stringArray(row.tenant_reality),
    horizons: jsonArray(row.horizons),
  };
}

function snakeToCamelPackTier(
  row: Record<string, unknown> | undefined,
): HomeEnterpriseBriefPackTier | undefined {
  if (!row) return undefined;
  return {
    tier: row.tier as string | null | undefined,
    tierLabel: row.tier_label as string | null | undefined,
    tierTitle: row.tier_title as string | null | undefined,
    tierBody: row.tier_body as string | null | undefined,
    tierConditions: jsonArray(row.tier_conditions),
    tierBasis: row.tier_basis as string | null | undefined,
  };
}

async function enrichHomeEnterpriseBriefPack(
  client: Client,
  packId: string,
  packVersion: string,
  pack: HomeKnowledgeDesignContractPack,
): Promise<HomeKnowledgeDesignContractPack> {
  const [
    dimensionRows,
    useCases,
    evidenceSources,
    executiveRead,
    packTier,
    aiReadiness,
    dimensionImplications,
    nextEvidence,
    strategicNarratives,
  ] = await Promise.all([
    client.query(
      `SELECT * FROM public.home_knowledge_dimension_rows WHERE pack_id = $1 ORDER BY dimension_key, sort_order, display_name`,
      [packId],
    ),
    client.query(
      `SELECT * FROM public.home_knowledge_use_cases WHERE pack_id = $1 ORDER BY priority_rank, name`,
      [packId],
    ),
    client.query(
      `SELECT * FROM public.home_knowledge_evidence_sources WHERE pack_id = $1 ORDER BY source_name`,
      [packId],
    ),
    client.query(
      `SELECT * FROM public.home_knowledge_executive_read WHERE pack_id = $1 LIMIT 1`,
      [packId],
    ),
    client.query(
      `SELECT * FROM public.home_knowledge_pack_tier WHERE pack_id = $1 LIMIT 1`,
      [packId],
    ),
    client.query(
      `SELECT * FROM public.home_knowledge_ai_readiness WHERE pack_id = $1 ORDER BY sort_order, readiness_dimension`,
      [packId],
    ),
    client.query(
      `SELECT * FROM public.home_knowledge_dimension_module_implications WHERE pack_id = $1 ORDER BY dimension_key, sort_order`,
      [packId],
    ),
    client.query(
      `SELECT * FROM public.home_knowledge_next_evidence_requests WHERE pack_id = $1 ORDER BY sort_order, title`,
      [packId],
    ),
    client.query(
      `SELECT * FROM public.home_knowledge_strategic_narratives WHERE pack_id = $1 ORDER BY narrative_type, sort_order, title`,
      [packId],
    ),
  ]);

  const slots = { ...pack.design_slots };
  const dataByDimension: Record<string, HomeKnowledgeDataSet> = {
    ...(slots.DATA ?? {}),
  };
  for (const row of dimensionRows.rows as Array<Record<string, unknown>>) {
    const dimensionKey = String(row.dimension_key ?? "");
    if (!dimensionKey) continue;
    const payload =
      row.display_payload && typeof row.display_payload === "object"
        ? (row.display_payload as Record<string, unknown>)
        : {};
    const merged: HomeKnowledgeRecord = {
      ...payload,
      source_record_id: row.source_record_id as string | null,
      name: row.display_name as string,
      title: row.display_name as string,
      summary: row.display_summary as string | null,
      facet_1: row.facet_1 as string | null,
      facet_2: row.facet_2 as string | null,
      status: row.status as string | null,
      confidence: row.confidence as number | null,
      source_file: row.source_file as string | null,
      evidence_refs: readEvidenceRefs(row.evidence_refs),
    };
    const existing = dataByDimension[dimensionKey];
    dataByDimension[dimensionKey] = {
      columns: existing?.columns?.length
        ? existing.columns
        : [
            { k: "name", label: "Name" },
            { k: "summary", label: "Summary" },
            { k: "facet_1", label: "Function / category" },
            { k: "facet_2", label: "Owner / scope" },
            { k: "status", label: "Status", pill: "status" },
          ],
      facet: existing?.facet ?? { k: "facet_1", label: "Function / category" },
      source_file: existing?.source_file,
      source_layer: existing?.source_layer ?? "home_knowledge_dimension_rows",
      refreshed_at: existing?.refreshed_at,
      row_count: (existing?.row_count ?? 0) + 1,
      rows: [...(existing?.rows ?? []), merged],
    };
  }

  const typedUseCases: HomeKnowledgeRecord[] = useCases.rows.map(
    (row: Record<string, unknown>) => ({
      key: row.use_case_key as string,
      name: row.name as string,
      title: row.name as string,
      fn: row.business_function as string | null,
      business_function: row.business_function as string | null,
      owner_hint: row.owner_hint as string | null,
      stage: row.stage as string | null,
      industry_pattern: row.industry_pattern as string | null,
      client_context_signal: row.client_context_signal as string | null,
      why_now: row.why_now as string | null,
      operating_model_change: row.operating_model_change as string | null,
      change_strategy: row.change_strategy as string | null,
      value_thesis: row.value_thesis as string | null,
      readiness_barrier: row.readiness_barrier as string | null,
      evidence_gate: row.evidence_gate as string | null,
      priority_rank: row.priority_rank as number,
      value_score: row.value_score as number,
      readiness_score: row.readiness_score as number,
      evidence_score: row.evidence_score as number,
      dependency_risk_score: row.dependency_risk_score as number,
      total_priority_score: row.total_priority_score as number,
      priority_rationale: row.priority_rationale as string | null,
      module_next_step: row.module_next_step as string | null,
      supporting_dimensions: stringArray(row.supporting_dimensions),
      required_context: row.required_context as Record<string, unknown>,
      evidence_refs: readEvidenceRefs(row.evidence_refs),
    }),
  );

  const typedEvidence: HomeKnowledgeEvidence[] = evidenceSources.rows.map(
    (row: Record<string, unknown>) => ({
      name: String(row.source_name ?? row.file_name ?? row.source_id ?? ""),
      type: String(row.file_type ?? "source"),
      date: row.loaded_at
        ? new Date(String(row.loaded_at)).toISOString().slice(0, 10)
        : String(row.source_date ?? ""),
      rows: row.row_count == null ? "" : String(row.row_count),
      facts: stringArray(row.parsed_into_dimensions).join(", "),
      st: String(row.source_status ?? ""),
      status: String(row.source_status ?? ""),
      fields: String(row.file_name ?? ""),
      supports: stringArray(row.parsed_into_dimensions).join(", "),
      missing: String(row.known_gaps ?? ""),
    }),
  );

  const typedNextEvidence: HomeKnowledgeRecord[] = nextEvidence.rows.map(
    (row: Record<string, unknown>) => ({
      item: row.title as string,
      title: row.title as string,
      narrative: row.narrative as string | null,
      dimension_key: row.requesting_dimension_key as string | null,
      unlocks: row.unlocks_narrative as string | null,
      owner_hint: row.requesting_role_hint as string | null,
      collection_route: row.collection_route as string | null,
    }),
  );

  const executive = snakeToCamelExecutiveRead(
    executiveRead.rows[0] as Record<string, unknown> | undefined,
  );
  const tier = snakeToCamelPackTier(
    packTier.rows[0] as Record<string, unknown> | undefined,
  );
  const strategic = strategicNarratives.rows.map(
    (row: Record<string, unknown>): HomeEnterpriseBriefStrategicNarrative => ({
      narrativeType: String(row.narrative_type ?? ""),
      title: String(row.title ?? ""),
      classification: row.classification as string | null | undefined,
      executiveNarrative: String(row.executive_narrative ?? ""),
      currentState: row.current_state as string | null | undefined,
      targetStateOrRelevance: row.target_state_or_relevance as
        | string
        | null
        | undefined,
      affectedEntities: stringArray(row.affected_entities),
      valueHypothesis: row.value_hypothesis as string | null | undefined,
      dependencies: stringArray(row.dependencies),
      evidenceGate: row.evidence_gate as string | null | undefined,
      evidenceRefs: readEvidenceRefs(row.evidence_refs),
      confidence: row.confidence == null ? null : Number(row.confidence),
      recommendedNextAction: row.recommended_next_action as
        | string
        | null
        | undefined,
    }),
  );

  const narrativeSections = {
    ...(pack.narrative_sections ?? {}),
    enterprise_brief_title:
      executive?.tensionHeadline ??
      pack.narrative_sections?.enterprise_brief_title,
    enterprise_brief_summary:
      executive?.oneSentence ??
      pack.narrative_sections?.enterprise_brief_summary,
    enterprise_hero_summary:
      executive?.oneSentence ??
      pack.narrative_sections?.enterprise_hero_summary,
    context_confidence_summary:
      executive?.contextConfidenceNote ??
      pack.narrative_sections?.context_confidence_summary,
    evidence_gaps_summary:
      executive?.constraints
        ?.map((item) => textFromUnknown(item))
        .filter(Boolean)
        .slice(0, 3)
        .join(" ") ?? pack.narrative_sections?.evidence_gaps_summary,
    use_cases_summary: typedUseCases.length
      ? `The top opportunities are ranked by value, readiness, evidence strength, and dependency risk. Treat them as planning-grade candidates until the evidence gate clears.`
      : pack.narrative_sections?.use_cases_summary,
    proof_summary:
      executive?.dataFoundationSummary ??
      pack.narrative_sections?.proof_summary,
  };

  return {
    ...pack,
    narrative_sections: narrativeSections,
    design_slots: {
      ...slots,
      DATA: dataByDimension,
      USE_CASES: typedUseCases.length ? typedUseCases : slots.USE_CASES,
      PRIORITIES: typedUseCases.length
        ? typedUseCases.map((useCase, index) => ({
            n: String(index + 1).padStart(2, "0"),
            title: useCase.name as string,
            detail:
              (useCase.client_context_signal as string) ||
              (useCase.priority_rationale as string) ||
              (useCase.change_strategy as string),
            evidence_refs: useCase.evidence_refs as string[],
          }))
        : slots.PRIORITIES,
      EVIDENCE: typedEvidence.length ? typedEvidence : slots.EVIDENCE,
      NEXT_EVIDENCE: typedNextEvidence.length
        ? typedNextEvidence
        : slots.NEXT_EVIDENCE,
    },
    enterprise_brief: {
      packId,
      packVersion,
      executiveRead: executive,
      packTier: tier,
      aiReadiness: aiReadiness.rows.map((row: Record<string, unknown>) => ({
        readinessDimension: String(row.readiness_dimension ?? ""),
        scorePct: Number(row.score_pct ?? 0),
        tone: row.tone as string | null | undefined,
        label: row.label as string | null | undefined,
        basis: row.basis as string | null | undefined,
        evidenceRefs: readEvidenceRefs(row.evidence_refs),
      })),
      strategicNarratives: strategic,
      dimensionModuleImplications: dimensionImplications.rows.map(
        (row: Record<string, unknown>) => ({
          dimensionKey: String(row.dimension_key ?? ""),
          module: String(row.module ?? ""),
          implication: String(row.implication ?? ""),
          evidenceRefs: readEvidenceRefs(row.evidence_refs),
        }),
      ),
      source: "postgres",
    },
  };
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

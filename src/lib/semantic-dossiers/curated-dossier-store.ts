import { Pool, type PoolClient } from "pg";

import { evaluateDossierSurfaceEligibility } from "../semantic2/dossiers";
import {
  normalizeSemantic2RuntimeTenantKey,
  SEMANTIC2_CROWN_JEWEL_PROMPT_VERSION,
  Semantic2RuntimeContractError,
} from "../semantic2/runtime-contract";
import { routeDimensionQuestion } from "./dimension-router";
import type {
  DossierArtifactType,
  DossierComposerPacket,
  DossierDimensionFamily,
  DossierFact,
  DossierGap,
  DossierMetric,
  DossierRelationshipPath,
  DossierSection,
  DossierSourceCoverage,
  UniversalDimensionDossier,
} from "./types";

export const CURATED_DOSSIER_PROMPT_VERSION =
  SEMANTIC2_CROWN_JEWEL_PROMPT_VERSION;

type JsonRecord = Record<string, unknown>;

interface CuratedDossierRow {
  tenant_key: string;
  dimension_key: string;
  family_key: string;
  evidence_packet: JsonRecord;
  artifacts: JsonRecord;
  gaps: unknown[];
  citations: unknown[];
  supported_questions: unknown[];
  source_tables: string[];
  coverage_score: string | number;
  confidence: string | number;
  prompt_version: string;
  dossier_version: string;
  built_at: string;
}

interface CuratedDossierStatusRow {
  tenant_key: string;
  dimension_key: string;
  prompt_version: string;
  dossier_version: string;
  built_at: string;
  invalidated_at: string | null;
}

export interface CuratedDossierLoadResult {
  dossier: UniversalDimensionDossier;
  promptVersion: string;
  dossierVersion: string;
  canonicalTenantKey: string;
  builtAt: string;
  branchOptions: CuratedDossierBranchOption[];
}

export class CuratedDossierNotSurfaceEligibleError extends Error {
  constructor(
    message: string,
    public readonly eligibility: ReturnType<
      typeof evaluateDossierSurfaceEligibility
    >,
  ) {
    super(message);
    this.name = "CuratedDossierNotSurfaceEligibleError";
  }
}

export class CuratedDossierUnavailableError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "stale_dossier"
      | "missing_active_dossier"
      | "noncanonical_tenant",
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "CuratedDossierUnavailableError";
  }
}

export function isCuratedDossierNonFallbackError(
  error: unknown,
): error is CuratedDossierUnavailableError | Semantic2RuntimeContractError {
  return (
    error instanceof CuratedDossierUnavailableError ||
    error instanceof Semantic2RuntimeContractError
  );
}

let pool: Pool | null = null;

export interface CuratedDossierBranchOption {
  id: string;
  label: string;
  dimensionKey: string;
  summary: string;
  coverageScore: number;
  confidence: number;
  entityCount: number;
  factCount: number;
  relationshipCount: number;
  citationCount: number;
}

function connectionString(): string {
  const value =
    process.env.DATABASE_URL ??
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL;
  if (!value) {
    throw new Error(
      "DATABASE_URL is required for curated Semantic2 dossier reads.",
    );
  }
  return value;
}

function shouldDisableSsl(value: string): boolean {
  try {
    const url = new URL(value);
    const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
    if (sslMode === "disable") return true;
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function getPool(): Pool {
  if (pool) return pool;
  const url = connectionString();
  pool = new Pool({
    connectionString: url,
    application_name: "home-know-curated-dossier",
    ssl: shouldDisableSsl(url) ? false : { rejectUnauthorized: false },
    max: 4,
    idleTimeoutMillis: 15_000,
  });
  return pool;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback: unknown = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  const fallbackParsed =
    typeof fallback === "number" ? fallback : Number(fallback);
  return Number.isFinite(parsed)
    ? parsed
    : Number.isFinite(fallbackParsed)
      ? fallbackParsed
      : 0;
}

function confidence(value: unknown): "high" | "medium" | "low" {
  const score = asNumber(value, 0.8);
  if (score >= 0.82) return "high";
  if (score >= 0.62) return "medium";
  return "low";
}

function artifactPlan(artifacts: JsonRecord): DossierArtifactType[] {
  const plan: DossierArtifactType[] = ["prose"];
  if (asArray(artifacts.tables).length > 0) plan.push("table");
  if (asArray(artifacts.charts).length > 0) plan.push("chart");
  if (asArray(artifacts.graphs).length > 0) plan.push("graph");
  return plan;
}

function makeSections(row: CuratedDossierRow): DossierSection[] {
  const packet = asRecord(row.evidence_packet);
  const dimension = asRecord(packet.dimension);
  const entities = asArray(packet.entities).map(asRecord);
  const facts = asArray(packet.facts).map(asRecord);
  const relationships = asArray(packet.relationships).map(asRecord);
  const dimensionFamily = row.dimension_key as DossierDimensionFamily;
  const title = asString(
    dimension.label,
    row.dimension_key.replaceAll("_", " "),
  );

  return [
    {
      sectionKey: `${row.dimension_key}_entities`,
      title: `${title} business objects`,
      dimensionFamily,
      sourceKeys: row.source_tables,
      summary: `Business objects are available for this topic.`,
      recordCount: entities.length,
      sample: entities.slice(0, 20).map((item) => ({
        name: asString(
          item.business_name,
          asString(item.semantic_key, "Unnamed entity"),
        ),
        type: asString(item.entity_type, "business object"),
        confidence: asNumber(item.confidence, row.confidence),
        source: asString(item.source_table, ""),
      })),
    },
    {
      sectionKey: `${row.dimension_key}_facts`,
      title: `${title} source support`,
      dimensionFamily,
      sourceKeys: row.source_tables,
      summary: `Source support is available for this topic.`,
      recordCount: facts.length,
      sample: facts.slice(0, 40).map((item) => ({
        subject: asString(item.subject_semantic_key, ""),
        fact: asString(
          item.fact_key,
          asString(item.fact_type, "source support"),
        ),
        value: String(
          item.fact_value_text ??
            item.fact_value_number ??
            item.fact_value_bool ??
            "",
        ),
        confidence: asNumber(item.confidence, row.confidence),
        source: asString(item.source_table, ""),
      })),
    },
    {
      sectionKey: `${row.dimension_key}_relationships`,
      title: `${title} operating connections`,
      dimensionFamily,
      sourceKeys: row.source_tables,
      summary: `Source-supported operating connections are available for this topic.`,
      recordCount: relationships.length,
      sample: relationships.slice(0, 30).map((item) => ({
        from: asString(item.from_semantic_key, ""),
        relationship: asString(
          item.relationship_label,
          asString(item.relationship_type, "relates to"),
        ),
        to: asString(item.to_semantic_key, ""),
        confidence: asNumber(item.confidence, row.confidence),
        source: asString(item.source_table, ""),
      })),
    },
  ];
}

function makeFacts(row: CuratedDossierRow): DossierFact[] {
  return asArray(asRecord(row.evidence_packet).facts)
    .map(asRecord)
    .slice(0, 80)
    .map((item) => ({
      label: asString(item.fact_key, asString(item.fact_type, "fact")),
      value: String(
        item.fact_value_text ??
          item.fact_value_number ??
          item.fact_value_bool ??
          "",
      ),
      sourceKey: asString(item.source_table, "semantic2"),
      confidence: confidence(item.confidence),
    }));
}

function makeRelationships(row: CuratedDossierRow): DossierRelationshipPath[] {
  return asArray(asRecord(row.evidence_packet).relationships)
    .map(asRecord)
    .slice(0, 60)
    .map((item, index) => ({
      pathKey: `${row.dimension_key}_relationship_${index + 1}`,
      label: asString(
        item.relationship_label,
        asString(item.relationship_type, "related"),
      ),
      from: asString(item.from_semantic_key, ""),
      relationship: asString(item.relationship_type, "relates_to"),
      to: asString(item.to_semantic_key, ""),
      sourceKeys: [asString(item.source_table, "semantic2")],
      confidence: confidence(item.confidence),
    }));
}

function makeMetrics(row: CuratedDossierRow): DossierMetric[] {
  const counts = asRecord(asRecord(row.evidence_packet).counts);
  return [
    {
      metricKey: "business_objects",
      label: "Business objects in context",
      value: asNumber(counts.entities),
      unit: "count",
      sourceKeys: row.source_tables,
    },
    {
      metricKey: "source_support",
      label: "Source support items",
      value: asNumber(counts.facts),
      unit: "count",
      sourceKeys: row.source_tables,
    },
    {
      metricKey: "operating_connections",
      label: "Operating connections",
      value: asNumber(counts.relationships),
      unit: "count",
      sourceKeys: row.source_tables,
    },
    {
      metricKey: "evidence_refs",
      label: "Source references",
      value: asNumber(counts.evidenceRefs),
      unit: "count",
      sourceKeys: row.source_tables,
    },
  ];
}

function makeGaps(row: CuratedDossierRow): DossierGap[] {
  return row.gaps.map(asRecord).map((item, index) => ({
    gapKey: asString(item.gapKey, `${row.dimension_key}_gap_${index + 1}`),
    label: asString(item.label, "Additional source confirmation is needed."),
    impact: asString(
      item.impact,
      "The answer should disclose this limitation.",
    ),
    neededEvidence: asArray(item.neededEvidence).map(String),
  }));
}

function makeCitations(
  row: CuratedDossierRow,
): UniversalDimensionDossier["citations"] {
  const grouped = new Map<
    string,
    { label: string; sourceKey: string; count: number }
  >();
  for (const raw of row.citations.map(asRecord)) {
    const label = asString(
      raw.citation_label,
      asString(
        raw.citation_detail,
        asString(raw.source_table, "Supporting source"),
      ),
    );
    const sourceKey = asString(raw.source_table, "semantic2");
    const key = `${label}::${sourceKey}`;
    const existing = grouped.get(key);
    if (existing) existing.count += 1;
    else grouped.set(key, { label, sourceKey, count: 1 });
  }
  return [...grouped.values()].slice(0, 12);
}

function sourceCoverage(row: CuratedDossierRow): DossierSourceCoverage[] {
  return row.source_tables.map((sourceKey) => ({
    sourceKey,
    loaded: true,
    count: 1,
    purpose: "Loaded tenant context for this topic",
    required: false,
    dimensionFamily: row.dimension_key as DossierDimensionFamily,
    binderRole: "primary",
  }));
}

function dimensionSummary(row: CuratedDossierRow): string {
  const dimension = asRecord(asRecord(row.evidence_packet).dimension);
  const counts = asRecord(asRecord(row.evidence_packet).counts);
  const label = asString(
    dimension.label,
    row.dimension_key.replaceAll("_", " "),
  );
  const relationshipCount = asNumber(counts.relationships);
  return `${label}: loaded current-state context is available for this topic with source support${
    relationshipCount > 0 ? " and source-supported operating connections" : ""
  }.`;
}

function buildUniversalDossier(
  row: CuratedDossierRow,
  question: string,
): UniversalDimensionDossier {
  const route = routeDimensionQuestion(question, "home");
  route.primaryDimension = row.dimension_key as DossierDimensionFamily;
  const sections = makeSections(row);
  const facts = makeFacts(row);
  const relationships = makeRelationships(row);
  const metrics = makeMetrics(row);
  const gaps = makeGaps(row);
  const citations = makeCitations(row);
  const artifacts = artifactPlan(row.artifacts);
  const summary = dimensionSummary(row);
  const answerBoundary = {
    canAnswer: [
      `Explain the loaded ${row.dimension_key.replaceAll("_", " ")} facts.`,
      "Separate supported findings from missing evidence.",
      "Show deterministic tables, charts, or relationship views when requested.",
    ],
    cannotAnswer: gaps.map((gap) => gap.label),
    handoffTarget: route.targetSurface === "home" ? null : route.targetSurface,
    handoffReason: route.handoffReason,
  };
  const composerPacket: DossierComposerPacket = {
    question,
    tenantKey: row.tenant_key,
    primaryDimension: row.dimension_key as DossierDimensionFamily,
    relatedDimensions: route.relatedDimensions,
    dimensionSummary: summary,
    sections,
    rollups: {
      coverageScore: asNumber(row.coverage_score),
      confidence: asNumber(row.confidence),
      factCount: facts.length,
      citationCount: citations.reduce(
        (sum, citation) => sum + citation.count,
        0,
      ),
      sourceTables: row.source_tables,
    },
    relationshipPaths: relationships,
    metrics,
    gaps,
    citations,
    artifactPlan: artifacts,
    answerBoundary,
  };

  return {
    tenantKey: row.tenant_key,
    route,
    sourceCoverage: sourceCoverage(row),
    dimensionSummary: summary,
    sections,
    facts,
    rollups: composerPacket.rollups,
    relationshipPaths: relationships,
    metrics,
    gaps,
    citations,
    artifactPlan: artifacts,
    answerBoundary,
    composerPacket,
    qualityFlags: [],
  };
}

async function canonicalTenantKey(
  client: PoolClient,
  tenantKey: string,
): Promise<string> {
  const result = await client.query<{ canonical_tenant_key: string }>(
    "SELECT semantic2_canonical_tenant_key($1) AS canonical_tenant_key",
    [tenantKey],
  );
  return result.rows[0]?.canonical_tenant_key ?? tenantKey;
}

function branchOptionFromRow(
  row: Pick<
    CuratedDossierRow,
    | "dimension_key"
    | "evidence_packet"
    | "coverage_score"
    | "confidence"
    | "citations"
  >,
): CuratedDossierBranchOption {
  const packet = asRecord(row.evidence_packet);
  const dimension = asRecord(packet.dimension);
  const counts = asRecord(packet.counts);
  const label = asString(
    dimension.label,
    row.dimension_key.replaceAll("_", " "),
  );
  const entityCount = asNumber(counts.entities);
  const factCount = asNumber(counts.facts);
  const relationshipCount = asNumber(counts.relationships);
  const citationCount = asNumber(
    counts.evidenceRefs,
    asArray(row.citations).length,
  );
  return {
    id: row.dimension_key,
    label,
    dimensionKey: row.dimension_key,
    summary: branchSummaryForDimension(
      row.dimension_key as DossierDimensionFamily,
      asNumber(row.coverage_score),
      relationshipCount,
    ),
    coverageScore: asNumber(row.coverage_score),
    confidence: asNumber(row.confidence),
    entityCount,
    factCount,
    relationshipCount,
    citationCount,
  };
}

function branchSummaryForDimension(
  dimension: string,
  coverageScore: number,
  relationshipCount: number,
): string {
  const coverage =
    coverageScore >= 0.75
      ? "strong loaded context"
      : coverageScore >= 0.45
        ? "usable loaded context"
        : "early loaded context";
  const relationshipPhrase =
    relationshipCount > 0 ? " with source-supported operating connections" : "";
  const base: Record<string, string> = {
    organization_leadership:
      "explore leadership, business functions, IT teams, ownership, and accountability",
    application_systems:
      "explore applications, systems, domains, lifecycle, ownership, and dependencies",
    data_analytics:
      "explore data platforms, analytics estate, ownership, trust, and AI data dependencies",
    vendor_contracts:
      "explore vendor footprint, contracts, commercial dependency, renewals, and supported systems",
    budget_financials:
      "explore portfolio spend, funding shape, run/change context, and finance ownership",
    operations_process:
      "explore service signals, work patterns, process friction, ownership, and automation candidates",
    ai_value_governance:
      "explore AI initiatives, governance posture, value signals, adoption, and controls",
    risk_compliance:
      "explore risks, controls, compliance coverage, ownership, and affected systems",
    source_moves_tower:
      "explore connected Source, Moves, and Tower context with handoff-ready proof",
    enterprise_profile:
      "explore enterprise scale, operating model, business context, and strategic footprint",
    industry_market:
      "explore industry benchmarks, market context, and relevant external comparison points",
  };
  return `${base[dimension] ?? "explore the loaded context for this topic"}; ${coverage}${relationshipPhrase}`;
}

export async function loadCuratedSemanticDossier(args: {
  tenantKey: string;
  question: string;
  dimensionKey?: DossierDimensionFamily;
  promptVersion?: string;
}): Promise<CuratedDossierLoadResult> {
  const client = await getPool().connect();
  try {
    const databaseCanonical = await canonicalTenantKey(client, args.tenantKey);
    const canonical = normalizeSemantic2RuntimeTenantKey(
      databaseCanonical,
      "curated-semantic-dossier-load",
    );
    const route = routeDimensionQuestion(args.question, "home");
    const dimensionKey = args.dimensionKey ?? route.primaryDimension;
    const promptVersion = args.promptVersion ?? CURATED_DOSSIER_PROMPT_VERSION;
    await client.query("BEGIN");
    await client.query("SELECT set_config($1, $2, true)", [
      "app.tenant_key",
      canonical,
    ]);
    await client.query("SELECT set_config($1, $2, true)", [
      "app.client_key",
      canonical,
    ]);
    const result = await client.query<CuratedDossierRow>(
      `
        SELECT tenant_key, dimension_key, family_key, evidence_packet, artifacts, gaps, citations,
               supported_questions, source_tables, coverage_score, confidence, prompt_version,
               dossier_version, built_at
        FROM semantic2_dossiers
        WHERE tenant_key = $1
          AND dimension_key = $2
          AND prompt_version = $3
          AND invalidated_at IS NULL
        ORDER BY built_at DESC
        LIMIT 1
      `,
      [canonical, dimensionKey, promptVersion],
    );
    const branchResult = await client.query<
      Pick<
        CuratedDossierRow,
        | "dimension_key"
        | "evidence_packet"
        | "coverage_score"
        | "confidence"
        | "citations"
      >
    >(
      `
        SELECT dimension_key, evidence_packet, coverage_score, confidence, citations
        FROM semantic2_dossiers
        WHERE tenant_key = $1
          AND prompt_version = $2
          AND invalidated_at IS NULL
        ORDER BY coverage_score DESC, built_at DESC
      `,
      [canonical, promptVersion],
    );
    const statusResult = result.rows[0]
      ? null
      : await client.query<CuratedDossierStatusRow>(
          `
            SELECT tenant_key, dimension_key, prompt_version, dossier_version, built_at, invalidated_at
            FROM semantic2_dossiers
            WHERE tenant_key = $1
              AND dimension_key = $2
              AND prompt_version = $3
            ORDER BY built_at DESC
            LIMIT 1
          `,
          [canonical, dimensionKey, promptVersion],
        );
    await client.query("COMMIT");
    const row = result.rows[0];
    if (!row) {
      const latest = statusResult?.rows[0];
      if (latest?.invalidated_at) {
        throw new CuratedDossierUnavailableError(
          `Curated Semantic2 dossier for ${canonical}/${dimensionKey} is invalidated; refresh the active dossier before answering from fallback layers.`,
          "stale_dossier",
          {
            tenantKey: canonical,
            dimensionKey,
            promptVersion,
            dossierVersion: latest.dossier_version,
            builtAt: latest.built_at,
            invalidatedAt: latest.invalidated_at,
          },
        );
      }
      throw new CuratedDossierUnavailableError(
        `No active curated Semantic2 dossier found for ${canonical}/${dimensionKey}.`,
        "missing_active_dossier",
        { tenantKey: canonical, dimensionKey, promptVersion },
      );
    }
    const eligibility = evaluateDossierSurfaceEligibility({
      dossier: row.evidence_packet,
      dossierId: `${canonical}:${dimensionKey}:${row.prompt_version}`,
      tenantKey: row.tenant_key,
      dimensionKey: row.dimension_key,
    });
    if (!eligibility.surfaceEligible) {
      throw new CuratedDossierNotSurfaceEligibleError(
        `Curated Semantic2 dossier for ${canonical}/${dimensionKey} is ${eligibility.eligibilityLevel}: ${eligibility.reasons.join("; ")}`,
        eligibility,
      );
    }
    const dossier = buildUniversalDossier(row, args.question);
    const branchOptions = branchResult.rows
      .map(branchOptionFromRow)
      .filter((option) => option.factCount > 0 || option.entityCount > 0)
      .slice(0, 6);
    dossier.branchOptions = branchOptions;
    return {
      dossier,
      promptVersion: row.prompt_version,
      dossierVersion: row.dossier_version,
      canonicalTenantKey: canonical,
      builtAt: row.built_at,
      branchOptions,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

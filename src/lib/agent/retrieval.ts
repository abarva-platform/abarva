import { azureRead } from "@/lib/data-plane/azureRead";
import { DEMO_SAFE_CLIENT_NAMES } from "@/lib/client-config";
import type { PostgresCompatClient } from "@/lib/data-plane/postgresCompat";
import {
  composeAtlasIacAnswer,
  type AtlasIacComposition,
} from "@/lib/atlas/composition/compose";
import type { AtlasTenancyCtx } from "@/lib/atlas/initiative-deep/types";

type IndustryCode = "HEALTHCARE_IDN" | "FINSERV" | "RETAIL" | "GENERAL";

export interface RetrievedChunk {
  text: string;
  sourceKey: string;
  publisher?: string;
  attribution?: string;
  section?: string;
  pageNumber?: number;
  licenseClass?: string;
  score: number;
  decayedScore: number;
  publishedAt?: string;
  halfLifeDays?: number;
}

export interface RetrievalContext {
  industry: IndustryCode | null;
  clientId: string | null;
  userQuery: string;
  clientChunks: RetrievedChunk[];
  industryChunks: RetrievedChunk[];
  topicChunks: RetrievedChunk[];
  atlasIacComposition?: AtlasIacComposition | null;
}

export interface AssembleRetrievalArgs {
  engagementId?: string | null;
  clientId?: string | null;
  industry?: IndustryCode | null;
  currentPhase?: number | null;
  userQuery: string;
  turnHistory?: Array<{ role: string; content: string }>;
  topKClient?: number;
  topKIndustry?: number;
  topKTopic?: number;
  atlasTenancy?: AtlasTenancyCtx | null;
  initiativeDeepClient?: PostgresCompatClient;
}

const DAY_MS = 86_400_000;

export function __testOnly_topicNamespace(
  industry: IndustryCode | null | undefined,
): string {
  return topicNamespace(industry);
}

function topicNamespace(industry: IndustryCode | null | undefined): string {
  if (industry === "HEALTHCARE_IDN")
    return "industry:healthcare_idn:ai_governance";
  if (industry === "FINSERV") return "industry:finserv:ai_governance";
  if (industry === "RETAIL") return "industry:retail:ai_governance";
  return "industry:general_macro:ai_governance";
}

export function __testOnly_normalizeLegacyClientAliases(text: string): string {
  return normalizeLegacyClientAliases(text);
}

function normalizeLegacyClientAliases(text: string): string {
  const retailDemoName = ["Apex", "Retail Group"].join(" ");
  const retailShortName = ["Apex", "Retail"].join(" ");
  const healthcareDemoName = ["Meridian", "Health"].join(" ");
  const healthcareShortName = "Meridian";
  const financialDemoName = DEMO_SAFE_CLIENT_NAMES.arcturus;

  return text
    .replace(/\bAsterline Retail Group\b/g, retailDemoName)
    .replace(/\bAsterline Retail\b/g, retailShortName)
    .replace(/\bAsterline\b/g, retailShortName)
    .replace(/\bHeliara Health Alliance\b/g, healthcareDemoName)
    .replace(/\bHeliara Health\b/g, healthcareDemoName)
    .replace(/\bHeliara\b/g, healthcareShortName)
    .replace(/\bBrindlemark Financial Group\b/g, financialDemoName)
    .replace(/\bBrindlemark Financial\b/g, financialDemoName)
    .replace(/\bBrindlemark\b/g, financialDemoName);
}

function scrubChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  for (const c of chunks) {
    c.text = normalizeLegacyClientAliases(c.text);
    if (c.section) c.section = normalizeLegacyClientAliases(c.section);
    if (c.attribution)
      c.attribution = normalizeLegacyClientAliases(c.attribution);
    if (c.publisher) c.publisher = normalizeLegacyClientAliases(c.publisher);
  }
  return chunks;
}

function applyFreshnessDecay(
  score: number,
  publishedAt?: string,
  halfLifeDays?: number,
): number {
  if (!publishedAt) return score;
  const ts = Date.parse(publishedAt);
  if (!Number.isFinite(ts)) return score;
  const ageDays = Math.max(0, (Date.now() - ts) / DAY_MS);
  const hl = halfLifeDays ?? 365;
  return score * Math.exp(-Math.LN2 * (ageDays / hl));
}

function composeRetrievalQuery(
  userQuery: string,
  history?: Array<{ role: string; content: string }>,
): string {
  const recent = (history ?? [])
    .slice(-4)
    .map((m) => m.content)
    .join("\n");
  return recent
    ? `${recent}\n${userQuery}`.slice(-4000)
    : userQuery.slice(-4000);
}

function queryTerms(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((term) => term.length >= 4)
        .slice(0, 18),
    ),
  ];
}

function lexicalScore(text: string, terms: ReadonlyArray<string>): number {
  const lower = text.toLowerCase();
  const matches = terms.filter((term) => lower.includes(term)).length;
  return matches / Math.max(terms.length, 1);
}

async function resolveTenantKey(
  clientId: string | null,
): Promise<string | null> {
  if (!clientId) return null;
  const row = await azureRead
    .maybeSingle<{ tenant_key: string | null; slug: string | null }>({
      table: "clients",
      columns: ["tenant_key", "slug"],
      where: { id: clientId },
      missingTable: "empty",
    })
    .catch(() => null);
  return row?.tenant_key ?? row?.slug ?? null;
}

async function queryAzureContextChunks(args: {
  clientId: string | null;
  userQuery: string;
  topKClient: number;
  topKIndustry: number;
  topKTopic: number;
}): Promise<
  Pick<RetrievalContext, "clientChunks" | "industryChunks" | "topicChunks">
> {
  const tenantKey = await resolveTenantKey(args.clientId);
  if (!tenantKey)
    return { clientChunks: [], industryChunks: [], topicChunks: [] };

  const segmentIds = [
    "enterprise_profile",
    "org_structure",
    "it_landscape",
    "it_financials",
    "kpi_dictionary",
    "industry_context",
    "program_inventory",
    "evidence_ledger",
    "operating_telemetry",
    "vendor_contracts",
    "compliance",
    "cross_program_signals",
  ];

  const data = await azureRead
    .select<Record<string, unknown>>({
      table: "enterprise_context_chunks",
      columns: [
        "chunk_text",
        "source_doc",
        "source_segment_id",
        "chunk_index",
        "chunk_metadata",
        "provenance",
        "embedded_at",
      ],
      where: {
        tenant_key: tenantKey,
        source_segment_id: { op: "in", value: segmentIds },
      },
      limit: 160,
      missingTable: "empty",
    })
    .catch(() => []);

  const terms = queryTerms(args.userQuery);
  const rows = data
    .map((row) => {
      const text = String(row.chunk_text ?? "");
      const segment = String(row.source_segment_id ?? "");
      const score =
        lexicalScore(text, terms) + (segment === "industry_context" ? 0.08 : 0);
      const metadata = (row.chunk_metadata ?? {}) as Record<string, unknown>;
      const provenance = (row.provenance ?? {}) as Record<string, unknown>;
      return {
        text,
        sourceKey: String(
          row.source_doc ?? metadata.source_key ?? `${tenantKey}:${segment}`,
        ),
        publisher:
          typeof provenance.publisher === "string"
            ? provenance.publisher
            : undefined,
        attribution:
          typeof provenance.attribution === "string"
            ? provenance.attribution
            : undefined,
        section: segment || undefined,
        pageNumber:
          typeof row.chunk_index === "number" ? row.chunk_index + 1 : undefined,
        licenseClass:
          typeof metadata.license_class === "string"
            ? metadata.license_class
            : undefined,
        score,
        decayedScore: applyFreshnessDecay(
          score,
          typeof row.embedded_at === "string" ? row.embedded_at : undefined,
          365,
        ),
        publishedAt:
          typeof row.embedded_at === "string" ? row.embedded_at : undefined,
        segment,
      };
    })
    .filter((row) => row.text.length > 0)
    .sort((a, b) => b.decayedScore - a.decayedScore);

  const withoutSegment = (row: (typeof rows)[number]) => ({
    text: row.text,
    sourceKey: row.sourceKey,
    publisher: row.publisher,
    attribution: row.attribution,
    section: row.section,
    pageNumber: row.pageNumber,
    licenseClass: row.licenseClass,
    score: row.score,
    decayedScore: row.decayedScore,
    publishedAt: row.publishedAt,
  });

  const industryChunks = rows
    .filter((row) => row.segment === "industry_context")
    .slice(0, args.topKIndustry)
    .map(withoutSegment);
  const topicChunks = rows
    .filter(
      (row) =>
        row.segment === "compliance" || row.segment === "cross_program_signals",
    )
    .slice(0, args.topKTopic)
    .map(withoutSegment);
  const clientChunks = rows
    .filter(
      (row) =>
        row.segment !== "industry_context" &&
        row.segment !== "compliance" &&
        row.segment !== "cross_program_signals",
    )
    .slice(0, args.topKClient)
    .map(withoutSegment);

  return { clientChunks, industryChunks, topicChunks };
}

export async function assembleRetrievalContext(
  args: AssembleRetrievalArgs,
): Promise<RetrievalContext> {
  const industry = args.industry ?? null;
  const clientId = args.clientId ?? null;
  const fallback = await queryAzureContextChunks({
    clientId,
    userQuery: composeRetrievalQuery(args.userQuery, args.turnHistory),
    topKClient: args.topKClient ?? 5,
    topKIndustry: args.topKIndustry ?? 3,
    topKTopic: args.topKTopic ?? 2,
  });
  const atlasIacComposition = args.atlasTenancy
    ? await composeAtlasIacAnswer({
        prompt: args.userQuery,
        tenancy: args.atlasTenancy,
        client: args.initiativeDeepClient,
      })
    : null;

  return {
    industry,
    clientId,
    userQuery: args.userQuery,
    clientChunks: scrubChunks(fallback.clientChunks),
    industryChunks: scrubChunks(fallback.industryChunks),
    topicChunks: scrubChunks(fallback.topicChunks),
    atlasIacComposition,
  };
}

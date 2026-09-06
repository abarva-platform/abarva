import fs from "node:fs/promises";
import path from "node:path";
import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
} from "@/lib/governance/agent-context-bundle";
import type {
  AgentReadiness,
  Classification,
  ConfidenceLevel,
  Retrievability,
} from "@/lib/governance/context-corpus-policy";
import type { AskSource, RetrievalResult } from "../types";

export const NEXUS_PRODUCT_MANUAL_CORPUS_PATH = path.join(
  process.cwd(),
  "docs/product/generated/nexus-product-manual-corpus.jsonl",
);

export interface NexusProductManualCorpusRecord {
  id: string;
  title: string;
  body: string;
  client_key: string;
  tenant_id: string | null;
  source_layer: "product_docs";
  source_basis: string | null;
  source_references: string[];
  classification: Classification;
  retrievability: Retrievability;
  agent_readiness_status: AgentReadiness;
  confidence_level: ConfidenceLevel | null;
  cited_render_verified_at: string | null;
}

export interface NexusProductManualRetrievalOptions {
  corpusPath?: string;
  limit?: number;
}

export async function retrieveNexusProductManualSources(
  query: string,
  options: NexusProductManualRetrievalOptions = {},
): Promise<RetrievalResult> {
  const records = await loadNexusProductManualCorpus(
    options.corpusPath ?? NEXUS_PRODUCT_MANUAL_CORPUS_PATH,
  );
  return buildNexusProductManualSourcesFromRecords(query, records, {
    limit: options.limit,
  });
}

export async function loadNexusProductManualCorpus(
  corpusPath: string,
): Promise<NexusProductManualCorpusRecord[]> {
  let raw = "";
  try {
    raw = await fs.readFile(corpusPath, "utf8");
  } catch {
    return [];
  }

  const records: NexusProductManualCorpusRecord[] = [];
  for (const line of raw.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as Partial<NexusProductManualCorpusRecord>;
      if (
        typeof parsed.id === "string" &&
        typeof parsed.title === "string" &&
        typeof parsed.body === "string" &&
        parsed.source_layer === "product_docs"
      ) {
        records.push(parsed as NexusProductManualCorpusRecord);
      }
    } catch {
      continue;
    }
  }
  return records;
}

export function buildNexusProductManualSourcesFromRecords(
  query: string,
  records: NexusProductManualCorpusRecord[],
  options: { limit?: number } = {},
): RetrievalResult {
  const ranked = records
    .map((record) => ({
      record,
      score: relevanceScore(query, `${record.title}\n${record.body}`),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit ?? 4);

  const bundle = buildValidatedAgentContextBundle(
    ranked.map(({ record }) => toCandidate(record)),
    { requireAgentReady: true },
  );
  const usableIds = new Set(bundle.usable.map((candidate) => candidate.id));
  const sources = ranked
    .filter(({ record }) => usableIds.has(record.id))
    .map(({ record, score }): AskSource => ({
      type: "PRODUCT_DOC",
      name: record.title,
      id: record.id,
      detail: excerpt(record.body),
      url: record.source_references[0],
      confidence: Math.min(0.95, 0.7 + score / 20),
    }));

  const averageConfidence =
    sources.length > 0
      ? sources.reduce((sum, source) => sum + (source.confidence ?? 0), 0) /
        sources.length
      : 0;
  return { sources, averageConfidence };
}

function toCandidate(record: NexusProductManualCorpusRecord): GovernedCandidate {
  return {
    id: record.id,
    client_key: record.client_key,
    tenant_id: record.tenant_id,
    source_layer: record.source_layer,
    source_basis: record.source_basis,
    classification: record.classification,
    retrievability: record.retrievability,
    agent_readiness_status: record.agent_readiness_status,
    confidence_level: record.confidence_level,
    cited_render_verified_at: record.cited_render_verified_at,
    title: record.title,
    citations: record.source_references,
  };
}

function relevanceScore(query: string, body: string): number {
  const haystack = body.toLowerCase();
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
  const uniqueTokens = [...new Set(tokens)];
  return uniqueTokens.reduce(
    (score, token) => score + (haystack.includes(token) ? 1 : 0),
    0,
  );
}

function excerpt(body: string): string {
  const compact = body.replace(/\s+/g, " ").trim();
  return compact.length <= 900 ? compact : `${compact.slice(0, 897)}...`;
}

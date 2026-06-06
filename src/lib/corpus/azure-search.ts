import type { CorpusPatternRecord } from './types';

export const CORPUS_GLOBAL_INDEX = 'corpus-global';
export const LAKESHORE_CORPUS_INDEX = 'lakeshore-patterns-v1';

export function corpusClientIndex(clientId: string): string {
  return `corpus-client-${clientId}`;
}

function lakeshoreCorpusIndex(): string {
  return process.env.LAKESHORE_CORPUS_SEARCH_INDEX?.trim() || LAKESHORE_CORPUS_INDEX;
}

function isLakeshoreClient(value: string | null | undefined): boolean {
  return /^(lakeshore|lakeshore-holdings)$/i.test(value?.trim() ?? '');
}

function appendFilter(base: string | undefined, extra: string): string {
  return base ? `(${base}) and (${extra})` : extra;
}

function endpointBase(): string {
  const explicit = process.env.AZURE_SEARCH_ENDPOINT?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const serviceName = process.env.AZURE_SEARCH_SERVICE_NAME?.trim();
  if (!serviceName) {
    throw new Error('AZURE_SEARCH_ENDPOINT or AZURE_SEARCH_SERVICE_NAME is required for corpus Azure AI Search.');
  }
  return `https://${serviceName}.search.windows.net`;
}

function apiVersion(): string {
  return process.env.AZURE_SEARCH_API_VERSION?.trim() || '2024-07-01';
}

function adminHeaders(): Record<string, string> {
  const apiKey = process.env.AZURE_SEARCH_ADMIN_KEY?.trim();
  if (!apiKey) {
    throw new Error('AZURE_SEARCH_ADMIN_KEY is required for corpus Azure AI Search writes.');
  }
  return {
    'Content-Type': 'application/json',
    'api-key': apiKey,
  };
}

function queryHeaders(): Record<string, string> {
  const apiKey = process.env.AZURE_SEARCH_QUERY_KEY?.trim() || process.env.AZURE_SEARCH_ADMIN_KEY?.trim();
  if (!apiKey) {
    throw new Error('AZURE_SEARCH_QUERY_KEY or AZURE_SEARCH_ADMIN_KEY is required for corpus Azure AI Search reads.');
  }
  return {
    'Content-Type': 'application/json',
    'api-key': apiKey,
  };
}

function searchDocId(pattern: CorpusPatternRecord, clientId?: string | null): string {
  return Buffer.from(`${clientId || 'global'}:${pattern.id}:${pattern.version}`, 'utf-8').toString('base64url');
}

export function toCorpusSearchDocument(args: {
  pattern: CorpusPatternRecord;
  embedding?: number[];
  clientId?: string | null;
  clientKey?: string | null;
}): Record<string, unknown> {
  const docId = args.pattern.searchDocId || searchDocId(args.pattern, args.clientId);
  const doc: Record<string, unknown> = {
    '@search.action': 'mergeOrUpload',
    id: docId,
    slug: args.pattern.slug,
    title: args.pattern.title,
    category: args.pattern.category,
    body: args.pattern.markdownBody,
    embedding: args.embedding,
    confidence: args.pattern.confidence,
    depth_score: args.pattern.depthScore,
    vertical_overlays: args.pattern.verticalOverlays,
    region_overlays: args.pattern.regionOverlays,
    version: args.pattern.version,
    client_id: args.clientId ?? null,
  };
  if (isLakeshoreClient(args.clientKey) || isLakeshoreClient(args.clientId)) {
    doc.tenant_scope = 'lakeshore';
  }
  return doc;
}

export async function uploadCorpusSearchDocument(args: {
  pattern: CorpusPatternRecord;
  embedding: number[];
  clientId?: string | null;
  clientKey?: string | null;
}): Promise<string> {
  const indexName = isLakeshoreClient(args.clientKey) || isLakeshoreClient(args.clientId)
    ? lakeshoreCorpusIndex()
    : args.clientId ? corpusClientIndex(args.clientId) : CORPUS_GLOBAL_INDEX;
  const doc = toCorpusSearchDocument(args);
  const response = await fetch(
    `${endpointBase()}/indexes/${encodeURIComponent(indexName)}/docs/index?api-version=${encodeURIComponent(apiVersion())}`,
    {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ value: [doc] }),
    },
  );
  if (!response.ok) {
    throw new Error(`Azure AI Search corpus upload failed: ${response.status} ${await response.text()}`);
  }
  return String(doc.id);
}

export interface AzureCorpusSearchHit {
  id: string;
  score: number;
  slug?: string;
  version?: number;
}

export async function queryCorpusSearch(args: {
  query: string;
  clientId: string;
  clientKey?: string | null;
  includePrivate?: boolean;
  vector?: number[];
  filter?: string;
  top?: number;
}): Promise<AzureCorpusSearchHit[]> {
  const indexes = new Set(args.includePrivate
    ? [CORPUS_GLOBAL_INDEX, corpusClientIndex(args.clientId)]
    : [CORPUS_GLOBAL_INDEX]);
  const lakeshoreIndex = lakeshoreCorpusIndex();
  if (isLakeshoreClient(args.clientKey) || isLakeshoreClient(args.clientId)) {
    indexes.add(lakeshoreIndex);
  }
  const top = args.top ?? 10;
  const hits: AzureCorpusSearchHit[] = [];

  for (const indexName of indexes) {
    const filter = indexName === lakeshoreIndex
      ? appendFilter(args.filter, "tenant_scope eq 'lakeshore'")
      : args.filter;
    const body: Record<string, unknown> = {
      search: args.query || '*',
      queryType: 'semantic',
      top,
      select: 'id,slug,version',
      ...(indexName === lakeshoreIndex ? { semanticConfiguration: 'lakeshore-pattern-semantic' } : {}),
      ...(filter ? { filter } : {}),
    };
    if (args.vector && args.vector.length > 0) {
      body.vectorQueries = [{
        kind: 'vector',
        vector: args.vector,
        fields: 'embedding',
        k: top,
      }];
    }

    const response = await fetch(
      `${endpointBase()}/indexes/${encodeURIComponent(indexName)}/docs/search?api-version=${encodeURIComponent(apiVersion())}`,
      {
        method: 'POST',
        headers: queryHeaders(),
        body: JSON.stringify(body),
      },
    ).catch(() => null);
    if (!response?.ok) continue;

    const json = await response.json() as { value?: Array<Record<string, unknown>> };
    for (const row of json.value ?? []) {
      if (typeof row.id !== 'string') continue;
      hits.push({
        id: row.id,
        score: typeof row['@search.score'] === 'number' ? row['@search.score'] : 0,
        slug: typeof row.slug === 'string' ? row.slug : undefined,
        version: typeof row.version === 'number' ? row.version : undefined,
      });
    }
  }

  return hits;
}

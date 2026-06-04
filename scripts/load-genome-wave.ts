#!/usr/bin/env -S npx tsx
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local', quiet: true });
loadEnv({ quiet: true });

type ConfidenceLabel = 'high' | 'medium' | 'low';

type PatternEvidence = {
  source_type: string;
  label: string;
  detail: string;
};

type PatternRelationship = {
  relation: string;
  target: string;
};

type LakeshorePattern = {
  id: string;
  version: string;
  tenant_scope: string;
  title: string;
  summary: string;
  doctrine: string;
  domain: string;
  category: string;
  subcategory: string;
  triggers: string[];
  applies_when: string;
  does_not_apply_when: string;
  decision_owner: string;
  supporting_evidence: PatternEvidence[];
  anti_patterns: string[];
  failure_modes: string[];
  decision_artifacts: string[];
  vocabulary: string[];
  tags: string[];
  related_patterns: string[];
  graph_relationships: PatternRelationship[];
  embedding_text: string;
  confidence: ConfidenceLabel;
  vintage: string;
  lakeshore_specificity: string;
};

type Args = {
  input: string;
  tenant: string;
  domain?: string;
  wave?: string;
  commit: boolean;
  skipAzure: boolean;
  ensureIndex: boolean;
  ensureIndexOnly: boolean;
  indexName: string;
  limit?: number;
};

type LoadResult = {
  patternsRead: number;
  patternsSelected: number;
  postgresUpserts: number;
  azureUploads: number;
  relationshipsInserted: number;
  relationshipsUnresolved: number;
  dryRun: boolean;
};

const RELATIONSHIP_TYPES = new Set(['supports', 'contradicts', 'extends', 'depends_on', 'replaces', 'related']);
const EMBEDDING_DIMENSIONS = 1536;

function parseArgs(argv: string[]): Args {
  const args: Args = {
    input: '',
    tenant: 'lakeshore',
    commit: false,
    skipAzure: false,
    ensureIndex: false,
    ensureIndexOnly: false,
    indexName: process.env.LAKESHORE_CORPUS_SEARCH_INDEX?.trim() || 'lakeshore-patterns-v1',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${token}`);
      index += 1;
      return value;
    };
    if (token === '--input') args.input = next();
    else if (token === '--tenant') args.tenant = next();
    else if (token === '--domain') args.domain = next();
    else if (token === '--wave') args.wave = next();
    else if (token === '--index-name') args.indexName = next();
    else if (token === '--limit') args.limit = Number.parseInt(next(), 10);
    else if (token === '--commit') args.commit = true;
    else if (token === '--skip-azure') args.skipAzure = true;
    else if (token === '--ensure-index') args.ensureIndex = true;
    else if (token === '--ensure-index-only') {
      args.ensureIndex = true;
      args.ensureIndexOnly = true;
      args.commit = true;
    }
    else if (token === '--help') {
      console.log(`Usage: npx tsx scripts/load-genome-wave.ts --input <jsonl> [--tenant lakeshore] [--domain D01] [--wave 1] [--commit] [--ensure-index] [--skip-azure]
       npx tsx scripts/load-genome-wave.ts --ensure-index-only [--index-name lakeshore-patterns-v1]`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  if (!args.input && !args.ensureIndexOnly) throw new Error('--input is required');
  if (args.limit !== undefined && (!Number.isFinite(args.limit) || args.limit < 1)) {
    throw new Error('--limit must be a positive integer');
  }
  return args;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function confidenceValue(label: ConfidenceLabel): number {
  if (label === 'high') return 0.92;
  if (label === 'medium') return 0.78;
  return 0.62;
}

function mapRelationshipType(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (RELATIONSHIP_TYPES.has(normalized)) return normalized;
  if (normalized === 'supersedes') return 'replaces';
  if (normalized === 'conflicts_with') return 'contradicts';
  if (normalized === 'implements' || normalized === 'refines') return 'extends';
  return 'related';
}

function readPatterns(filePath: string): LakeshorePattern[] {
  const absolute = path.resolve(process.cwd(), filePath);
  const patterns: LakeshorePattern[] = [];
  const lines = readFileSync(absolute, 'utf-8').split(/\r?\n/);
  for (const [lineIndex, raw] of lines.entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('WAVE_') || line.startsWith('SELF_REVIEW') || line.startsWith('CRITIQUE_')) continue;
    if (!line.startsWith('{')) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid JSONL at ${filePath}:${lineIndex + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (parsed && typeof parsed === 'object' && '__meta' in parsed) continue;
    patterns.push(validatePattern(parsed, filePath, lineIndex + 1));
  }
  return patterns;
}

function assertString(value: unknown, field: string, location: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${location}: ${field} must be a non-empty string`);
  return value.trim();
}

function assertStringArray(value: unknown, field: string, location: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`${location}: ${field} must be a string array`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function validatePattern(value: unknown, filePath: string, line: number): LakeshorePattern {
  const location = `${filePath}:${line}`;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${location}: pattern must be an object`);
  }
  const row = value as Record<string, unknown>;
  const confidence = assertString(row.confidence, 'confidence', location) as ConfidenceLabel;
  if (confidence !== 'high' && confidence !== 'medium' && confidence !== 'low') {
    throw new Error(`${location}: confidence must be high, medium, or low`);
  }
  const supportingEvidence = row.supporting_evidence;
  if (!Array.isArray(supportingEvidence)) throw new Error(`${location}: supporting_evidence must be an array`);
  const graphRelationships = row.graph_relationships;
  if (!Array.isArray(graphRelationships)) throw new Error(`${location}: graph_relationships must be an array`);
  return {
    id: assertString(row.id, 'id', location),
    version: assertString(row.version, 'version', location),
    tenant_scope: assertString(row.tenant_scope, 'tenant_scope', location),
    title: assertString(row.title, 'title', location),
    summary: assertString(row.summary, 'summary', location),
    doctrine: assertString(row.doctrine, 'doctrine', location),
    domain: assertString(row.domain, 'domain', location),
    category: assertString(row.category, 'category', location),
    subcategory: assertString(row.subcategory, 'subcategory', location),
    triggers: assertStringArray(row.triggers, 'triggers', location),
    applies_when: assertString(row.applies_when, 'applies_when', location),
    does_not_apply_when: assertString(row.does_not_apply_when, 'does_not_apply_when', location),
    decision_owner: assertString(row.decision_owner, 'decision_owner', location),
    supporting_evidence: supportingEvidence.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`${location}: supporting_evidence[${index}] must be an object`);
      const evidence = item as Record<string, unknown>;
      return {
        source_type: assertString(evidence.source_type, `supporting_evidence[${index}].source_type`, location),
        label: assertString(evidence.label, `supporting_evidence[${index}].label`, location),
        detail: assertString(evidence.detail, `supporting_evidence[${index}].detail`, location),
      };
    }),
    anti_patterns: assertStringArray(row.anti_patterns, 'anti_patterns', location),
    failure_modes: assertStringArray(row.failure_modes, 'failure_modes', location),
    decision_artifacts: assertStringArray(row.decision_artifacts, 'decision_artifacts', location),
    vocabulary: assertStringArray(row.vocabulary, 'vocabulary', location),
    tags: assertStringArray(row.tags, 'tags', location),
    related_patterns: assertStringArray(row.related_patterns, 'related_patterns', location),
    graph_relationships: graphRelationships.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`${location}: graph_relationships[${index}] must be an object`);
      const relationship = item as Record<string, unknown>;
      return {
        relation: assertString(relationship.relation, `graph_relationships[${index}].relation`, location),
        target: assertString(relationship.target, `graph_relationships[${index}].target`, location),
      };
    }),
    embedding_text: assertString(row.embedding_text, 'embedding_text', location),
    confidence,
    vintage: assertString(row.vintage, 'vintage', location),
    lakeshore_specificity: assertString(row.lakeshore_specificity, 'lakeshore_specificity', location),
  };
}

function markdownBody(pattern: LakeshorePattern): string {
  return [
    `# ${pattern.title}`,
    '',
    pattern.summary,
    '',
    `Doctrine: ${pattern.doctrine}`,
    '',
    `Applies when: ${pattern.applies_when}`,
    `Does not apply when: ${pattern.does_not_apply_when}`,
    `Decision owner: ${pattern.decision_owner}`,
    '',
    `Triggers: ${pattern.triggers.join('; ')}`,
    `Anti-patterns: ${pattern.anti_patterns.join('; ')}`,
    `Failure modes: ${pattern.failure_modes.join('; ')}`,
    `Decision artifacts: ${pattern.decision_artifacts.join('; ')}`,
    `Vocabulary: ${pattern.vocabulary.join('; ')}`,
    '',
    pattern.embedding_text,
  ].join('\n');
}

function overlayValues(pattern: LakeshorePattern, tenant: string): { vertical: string[]; region: string[]; horizons: string[] } {
  const tags = new Set(pattern.tags.map(slugify).filter(Boolean));
  const vertical = new Set(['lakeshore-capital', 'private-holdings', pattern.domain.toLowerCase(), ...tags]);
  const region = new Set<string>();
  for (const tag of tags) {
    if (tag === 'chicago' || tag === 'midwest' || tag === 'illinois') region.add(tag);
  }
  if (pattern.lakeshore_specificity === 'chicago_local') region.add('chicago');
  if (pattern.lakeshore_specificity === 'midwest_regional') region.add('midwest');
  return {
    vertical: Array.from(vertical).slice(0, 20),
    region: Array.from(region).slice(0, 10),
    horizons: ['lakeshore-capital', 'decision-pattern', tenant, pattern.vintage],
  };
}

function synthesis(pattern: LakeshorePattern, args: Args): Record<string, unknown> {
  return {
    source: 'lakeshore-corpus-autonomous-execution',
    tenant_scope: pattern.tenant_scope,
    wave: args.wave ?? null,
    domain: pattern.domain,
    category: pattern.category,
    subcategory: pattern.subcategory,
    triggers: pattern.triggers,
    applies_when: pattern.applies_when,
    does_not_apply_when: pattern.does_not_apply_when,
    decision_owner: pattern.decision_owner,
    anti_patterns: pattern.anti_patterns,
    failure_modes: pattern.failure_modes,
    decision_artifacts: pattern.decision_artifacts,
    vocabulary: pattern.vocabulary,
    tags: pattern.tags,
    related_patterns: pattern.related_patterns,
    graph_relationships: pattern.graph_relationships,
    embedding_text_sha256: createHash('sha256').update(pattern.embedding_text).digest('hex'),
    vintage: pattern.vintage,
    lakeshore_specificity: pattern.lakeshore_specificity,
  };
}

function searchEndpoint(): string {
  const explicit = process.env.AZURE_SEARCH_ENDPOINT?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const serviceName = process.env.AZURE_SEARCH_SERVICE_NAME?.trim();
  if (!serviceName) throw new Error('AZURE_SEARCH_ENDPOINT or AZURE_SEARCH_SERVICE_NAME is required for Azure AI Search writes');
  return `https://${serviceName}.search.windows.net`;
}

function searchAdminKey(): string {
  const key = process.env.AZURE_SEARCH_ADMIN_KEY?.trim();
  if (!key) throw new Error('AZURE_SEARCH_ADMIN_KEY is required for Azure AI Search writes');
  return key;
}

function searchApiVersion(): string {
  return process.env.AZURE_SEARCH_API_VERSION?.trim() || '2024-07-01';
}

function searchIndexContract(indexName: string): Record<string, unknown> {
  return {
    name: indexName,
    fields: [
      { name: 'id', type: 'Edm.String', key: true, filterable: true, retrievable: true },
      { name: 'slug', type: 'Edm.String', filterable: true, sortable: true, searchable: true, retrievable: true, analyzer: 'en.lucene' },
      { name: 'tenant_scope', type: 'Edm.String', filterable: true, facetable: true, retrievable: true },
      { name: 'client_id', type: 'Edm.String', filterable: true, sortable: true, facetable: true, retrievable: true },
      { name: 'pattern_id', type: 'Edm.String', filterable: true, retrievable: true },
      { name: 'domain', type: 'Edm.String', filterable: true, facetable: true, searchable: true, retrievable: true },
      { name: 'category', type: 'Edm.String', filterable: true, sortable: true, facetable: true, searchable: true, retrievable: true, analyzer: 'en.lucene' },
      { name: 'title', type: 'Edm.String', sortable: true, searchable: true, retrievable: true, analyzer: 'en.lucene' },
      { name: 'body', type: 'Edm.String', searchable: true, retrievable: true, analyzer: 'en.lucene' },
      { name: 'embedding', type: 'Collection(Edm.Single)', searchable: true, retrievable: false, dimensions: EMBEDDING_DIMENSIONS, vectorSearchProfile: 'lakeshore-pattern-vector-profile' },
      { name: 'confidence', type: 'Edm.Double', filterable: true, sortable: true, retrievable: true },
      { name: 'depth_score', type: 'Edm.Double', filterable: true, sortable: true, retrievable: true },
      { name: 'vertical_overlays', type: 'Collection(Edm.String)', filterable: true, facetable: true, searchable: true, retrievable: true },
      { name: 'region_overlays', type: 'Collection(Edm.String)', filterable: true, facetable: true, searchable: true, retrievable: true },
      { name: 'tags', type: 'Collection(Edm.String)', filterable: true, facetable: true, searchable: true, retrievable: true },
      { name: 'version', type: 'Edm.Int32', filterable: true, sortable: true, retrievable: true },
      { name: 'vintage', type: 'Edm.String', filterable: true, facetable: true, retrievable: true },
    ],
    semantic: {
      configurations: [{
        name: 'lakeshore-pattern-semantic',
        prioritizedFields: {
          titleField: { fieldName: 'title' },
          prioritizedContentFields: [{ fieldName: 'body' }],
          prioritizedKeywordsFields: [{ fieldName: 'domain' }, { fieldName: 'category' }, { fieldName: 'tags' }],
        },
      }],
    },
    vectorSearch: {
      algorithms: [{
        name: 'lakeshore-pattern-hnsw',
        kind: 'hnsw',
        hnswParameters: { metric: 'cosine', m: 4, efConstruction: 400, efSearch: 500 },
      }],
      profiles: [{ name: 'lakeshore-pattern-vector-profile', algorithm: 'lakeshore-pattern-hnsw' }],
    },
  };
}

async function ensureSearchIndex(indexName: string): Promise<void> {
  const response = await fetch(`${searchEndpoint()}/indexes/${encodeURIComponent(indexName)}?api-version=${encodeURIComponent(searchApiVersion())}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', 'api-key': searchAdminKey() },
    body: JSON.stringify(searchIndexContract(indexName)),
  });
  if (!response.ok) throw new Error(`Azure AI Search index ensure failed: ${response.status} ${await response.text()}`);
}

async function embed(text: string): Promise<{ embedding: number[]; model: string }> {
  const azureEndpoint = process.env.AZURE_OPENAI_EMBEDDING_ENDPOINT?.replace(/\/$/, '');
  const azureKey = process.env.AZURE_OPENAI_EMBEDDING_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small';
  const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';
  if (azureEndpoint && azureKey) {
    const response = await fetch(`${azureEndpoint}/openai/deployments/${encodeURIComponent(azureDeployment)}/embeddings?api-version=${encodeURIComponent(azureApiVersion)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'api-key': azureKey },
      body: JSON.stringify({ input: text, dimensions: EMBEDDING_DIMENSIONS }),
    });
    if (!response.ok) throw new Error(`Azure OpenAI embedding failed: ${response.status} ${await response.text()}`);
    const json = await response.json() as { data?: Array<{ embedding?: number[] }>; model?: string };
    const embedding = json.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) throw new Error('Azure OpenAI embedding response did not include an embedding vector');
    return { embedding, model: json.model ?? azureDeployment };
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openAiKey) throw new Error('OPENAI_API_KEY or Azure OpenAI embedding env is required for embeddings');
  const model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${openAiKey}` },
    body: JSON.stringify({ model, input: text, dimensions: EMBEDDING_DIMENSIONS }),
  });
  if (!response.ok) throw new Error(`OpenAI embedding failed: ${response.status} ${await response.text()}`);
  const json = await response.json() as { data?: Array<{ embedding?: number[] }>; model?: string };
  const embedding = json.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) throw new Error('OpenAI embedding response did not include an embedding vector');
  return { embedding, model: json.model ?? model };
}

function searchDocId(clientId: string, patternId: string, version = 1): string {
  return Buffer.from(`${clientId}:${patternId}:${version}`, 'utf-8').toString('base64url');
}

async function uploadSearchDocument(args: {
  indexName: string;
  clientId: string;
  pattern: LakeshorePattern;
  body: string;
  embedding: number[];
  overlays: ReturnType<typeof overlayValues>;
  searchDocumentId: string;
}): Promise<void> {
  const response = await fetch(`${searchEndpoint()}/indexes/${encodeURIComponent(args.indexName)}/docs/index?api-version=${encodeURIComponent(searchApiVersion())}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'api-key': searchAdminKey() },
    body: JSON.stringify({
      value: [{
        '@search.action': 'mergeOrUpload',
        id: args.searchDocumentId,
        slug: slugify(args.pattern.id),
        tenant_scope: args.pattern.tenant_scope,
        client_id: args.clientId,
        pattern_id: args.pattern.id,
        domain: args.pattern.domain,
        category: `${args.pattern.domain}:${args.pattern.category}`,
        title: args.pattern.title,
        body: args.body,
        embedding: args.embedding,
        confidence: confidenceValue(args.pattern.confidence),
        depth_score: 9,
        vertical_overlays: args.overlays.vertical,
        region_overlays: args.overlays.region,
        tags: args.pattern.tags.map(slugify).filter(Boolean),
        version: 1,
        vintage: args.pattern.vintage,
      }],
    }),
  });
  if (!response.ok) throw new Error(`Azure AI Search upload failed: ${response.status} ${await response.text()}`);
}

async function resolveClientId(client: Client, tenant: string): Promise<string> {
  const aliases = tenant === 'lakeshore' ? ['lakeshore', 'lakeshore-holdings'] : [tenant];
  const { rows } = await client.query<{ id: string }>(
    `
      SELECT id::text
      FROM public.clients
      WHERE tenant_key = ANY($1::text[])
         OR slug = ANY($1::text[])
         OR lower(name) = ANY($2::text[])
      ORDER BY created_at NULLS LAST
      LIMIT 1
    `,
    [aliases, aliases.map((alias) => alias.replace(/-/g, ' '))],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error(`No client row found for tenant=${tenant}`);
  return id;
}

async function upsertPattern(client: Client, pattern: LakeshorePattern, args: Args, clientId: string, searchDocumentId: string | null): Promise<string> {
  const body = markdownBody(pattern);
  const overlays = overlayValues(pattern, args.tenant);
  const slug = slugify(pattern.id);
  const category = `${pattern.domain}:${slugify(pattern.category)}`;
  const { rows } = await client.query<{ id: string }>(
    `
      INSERT INTO public.corpus_patterns(
        slug, title, category, status, confidence, version,
        primary_author_id, approved_by_id, published_at, search_doc_id,
        depth_score, vertical_overlays, region_overlays, applicable_horizons
      )
      VALUES ($1, $2, $3, 'published', $4, 1, 'lakeshore-corpus-loader', 'lakeshore-corpus-loader', now(), $5, 9, $6, $7, $8)
      ON CONFLICT (slug)
      DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        status = 'published',
        confidence = EXCLUDED.confidence,
        version = 1,
        approved_by_id = EXCLUDED.approved_by_id,
        published_at = coalesce(public.corpus_patterns.published_at, now()),
        search_doc_id = coalesce(EXCLUDED.search_doc_id, public.corpus_patterns.search_doc_id),
        depth_score = EXCLUDED.depth_score,
        vertical_overlays = EXCLUDED.vertical_overlays,
        region_overlays = EXCLUDED.region_overlays,
        applicable_horizons = EXCLUDED.applicable_horizons
      RETURNING id::text
    `,
    [slug, pattern.title, category, confidenceValue(pattern.confidence), searchDocumentId, overlays.vertical, overlays.region, overlays.horizons],
  );
  const patternUuid = rows[0].id;
  await client.query(
    `
      INSERT INTO public.corpus_pattern_content(
        pattern_id, version, markdown_body, claims_jsonb, evidence_jsonb, counterarguments_jsonb, synthesis_jsonb
      )
      VALUES ($1, 1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb)
      ON CONFLICT (pattern_id)
      DO UPDATE SET
        version = 1,
        markdown_body = EXCLUDED.markdown_body,
        claims_jsonb = EXCLUDED.claims_jsonb,
        evidence_jsonb = EXCLUDED.evidence_jsonb,
        counterarguments_jsonb = EXCLUDED.counterarguments_jsonb,
        synthesis_jsonb = EXCLUDED.synthesis_jsonb
    `,
    [
      patternUuid,
      body,
      JSON.stringify([{ summary: pattern.summary }, { doctrine: pattern.doctrine }]),
      JSON.stringify(pattern.supporting_evidence),
      JSON.stringify(pattern.anti_patterns.map((antiPattern) => ({ anti_pattern: antiPattern }))),
      JSON.stringify(synthesis(pattern, args)),
    ],
  );
  await client.query(
    `
      INSERT INTO public.corpus_pattern_versions(pattern_id, version, status, snapshot_jsonb, created_by_id)
      VALUES ($1, 1, 'published', $2::jsonb, 'lakeshore-corpus-loader')
      ON CONFLICT (pattern_id, version)
      DO UPDATE SET status = 'published', snapshot_jsonb = EXCLUDED.snapshot_jsonb
    `,
    [patternUuid, JSON.stringify({ pattern, loader: 'scripts/load-genome-wave.ts', wave: args.wave ?? null })],
  );
  await client.query(
    `
      INSERT INTO public.corpus_telemetry(event_type, context_jsonb, client_id, actor_id, pattern_id)
      VALUES ('lakeshore_corpus_pattern_upserted', $1::jsonb, $2::uuid, 'lakeshore-corpus-loader', $3::uuid)
    `,
    [JSON.stringify({ id: pattern.id, domain: pattern.domain, wave: args.wave ?? null, searchDocumentId }), clientId, patternUuid],
  ).catch(() => undefined);
  return patternUuid;
}

async function insertRelationships(client: Client, idsByPatternId: Map<string, string>, patterns: LakeshorePattern[]): Promise<{ inserted: number; unresolved: number }> {
  let inserted = 0;
  let unresolved = 0;
  for (const pattern of patterns) {
    const fromId = idsByPatternId.get(pattern.id);
    if (!fromId) continue;
    const relationships = [
      ...pattern.related_patterns.map((target) => ({ relation: 'related', target })),
      ...pattern.graph_relationships,
    ];
    for (const relationship of relationships) {
      const toId = idsByPatternId.get(relationship.target);
      if (!toId || toId === fromId) {
        unresolved += 1;
        continue;
      }
      await client.query(
        `
          INSERT INTO public.corpus_pattern_relationships(from_id, to_id, type, confidence, created_by_id)
          VALUES ($1::uuid, $2::uuid, $3::corpus_relationship_type, 0.85, 'lakeshore-corpus-loader')
          ON CONFLICT (from_id, to_id, type) DO NOTHING
        `,
        [fromId, toId, mapRelationshipType(relationship.relation)],
      );
      inserted += 1;
    }
  }
  return { inserted, unresolved };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.ensureIndexOnly) {
    await ensureSearchIndex(args.indexName);
    console.log(JSON.stringify({ ok: true, mode: 'ensure-index-only', indexName: args.indexName }, null, 2));
    return;
  }
  const allPatterns = readPatterns(args.input);
  const selected = allPatterns
    .filter((pattern) => pattern.tenant_scope === args.tenant || (args.tenant === 'lakeshore' && pattern.tenant_scope === 'lakeshore'))
    .filter((pattern) => !args.domain || pattern.domain === args.domain)
    .slice(0, args.limit ?? allPatterns.length);

  if (selected.length === 0) throw new Error('No patterns selected for load');

  const result: LoadResult = {
    patternsRead: allPatterns.length,
    patternsSelected: selected.length,
    postgresUpserts: 0,
    azureUploads: 0,
    relationshipsInserted: 0,
    relationshipsUnresolved: 0,
    dryRun: !args.commit,
  };

  if (!args.commit) {
    console.log(JSON.stringify({ ok: true, mode: 'dry-run', result, sampleIds: selected.slice(0, 5).map((pattern) => pattern.id) }, null, 2));
    return;
  }

  if (!args.skipAzure && args.ensureIndex) await ensureSearchIndex(args.indexName);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const clientId = await resolveClientId(client, args.tenant);
    const idsByPatternId = new Map<string, string>();
    await client.query('BEGIN');
    for (const pattern of selected) {
      const body = markdownBody(pattern);
      const overlays = overlayValues(pattern, args.tenant);
      let docId: string | null = null;
      if (!args.skipAzure) {
        const embedding = await embed(pattern.embedding_text || body);
        docId = searchDocId(clientId, pattern.id);
        await uploadSearchDocument({
          indexName: args.indexName,
          clientId,
          pattern,
          body,
          embedding: embedding.embedding,
          overlays,
          searchDocumentId: docId,
        });
        result.azureUploads += 1;
      }
      const patternUuid = await upsertPattern(client, pattern, args, clientId, docId);
      idsByPatternId.set(pattern.id, patternUuid);
      result.postgresUpserts += 1;
    }
    const relationshipResult = await insertRelationships(client, idsByPatternId, selected);
    result.relationshipsInserted = relationshipResult.inserted;
    result.relationshipsUnresolved = relationshipResult.unresolved;
    await client.query('COMMIT');
    console.log(JSON.stringify({ ok: true, mode: 'commit', clientId, indexName: args.skipAzure ? null : args.indexName, result }, null, 2));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

// Pattern classifier · 3-stage pipeline per Packet 2 §2.3.
//
// Stage 1 · Intent extraction (≤1000ms) — entity + archetype extraction
// Stage 2 · Corpus match (≤2000ms) — Azure Postgres lexical match on published patterns
// Stage 3 · Scoring + ranking (≤1500ms) — weighted composite
//
// Output: up to 3 matches with confidence bands. Threshold 0.4 min.
// Spec calls for Voyage-3 embeddings; repo uses OpenAI
// text-embedding-3-large. Flagged as follow-up.

import { getAuditedAnthropicClient } from '@/lib/agent/stream';
import { azureRead } from '@/lib/data-plane/azureRead';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import type {
  ClassifierInput,
  ClassifierOutput,
  PatternClassifierMatch,
} from './types.db';
import type { ArchetypeKey } from './types.ui';

const CLASSIFIER_MODEL = process.env.CLASSIFIER_MODEL ?? 'claude-haiku-4-5-20251001';

// Scoring weights per §2.3
const W_VECTOR = 0.4;
const W_ARCHETYPE = 0.2;
const W_INDUSTRY = 0.15;
const W_ENTITY = 0.15;
const W_SUCCESS = 0.1;

const THRESHOLD = 0.4;
const BAND_HIGH = 0.75;
const BAND_MEDIUM = 0.5;

function bandOf(confidence: number): PatternClassifierMatch['band'] {
  if (confidence >= BAND_HIGH) return 'high';
  if (confidence >= BAND_MEDIUM) return 'medium';
  if (confidence >= THRESHOLD) return 'low';
  return 'no_match';
}

function actionOf(band: PatternClassifierMatch['band']): PatternClassifierMatch['suggestedAction'] {
  if (band === 'high' || band === 'medium') return 'pattern';
  if (band === 'low') return 'template';
  return 'template';
}

// ─── Stage 1 · Intent extraction (Haiku) ───────────────────────────────
interface Stage1Result {
  archetype: ArchetypeKey | null;
  industry: string | null;
  entities: string[];
  objectives: string[];
}

function normalizeIndustry(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper === 'FINSERV' || upper.includes('FINANCIAL')) return 'FINSERV';
  if (upper === 'HEALTHCARE_IDN' || upper.includes('HEALTHCARE') || upper.includes('IDN')) return 'HEALTHCARE_IDN';
  if (upper === 'RETAIL') return 'RETAIL';
  if (upper === 'GENERAL' || upper === 'ENTERPRISE' || upper === 'CROSS_INDUSTRY') return 'GENERAL';
  return raw;
}

async function extractIntent(input: ClassifierInput): Promise<Stage1Result> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { archetype: input.archetypeHint ?? null, industry: input.industry ?? null, entities: input.entities ?? [], objectives: [] };
  }
  try {
    const system =
      'Extract program classification signals from a transformation use case. Return strict JSON only. Schema: {archetype: "strategic_transformation"|"workflow_automation"|"platform_modernization"|"ai_product_enablement"|"operational_optimization"|null, industry: string|null, entities: string[], objectives: string[]}.';
    const userContent = `Use case: ${input.useCase}${input.industry ? `\nIndustry hint: ${input.industry}` : ''}${input.sponsor ? `\nSponsor: ${input.sponsor}` : ''}${input.scale ? `\nScale: ${input.scale}` : ''}`;
    const { client: anthropic } = await getAuditedAnthropicClient({
      tenantId: input.tenancy.clientId,
      userId: input.tenancy.userId,
      workflow: 'programs-origination-classifier',
      model: CLASSIFIER_MODEL,
      prompt: [system, userContent].join('\n\n'),
      dataClass: 'confidential',
      metadata: { clientKey: input.tenancy.clientKey },
    });
    const result = await anthropic.messages.create({
      model: CLASSIFIER_MODEL,
      max_tokens: 512,
      temperature: 0,
      system,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    });
    const text = result.content.find((b) => b.type === 'text')?.text ?? '{}';
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '')) as Partial<Stage1Result>;
    return {
      archetype: (parsed.archetype as ArchetypeKey) ?? input.archetypeHint ?? null,
      industry: normalizeIndustry(input.industry) ?? normalizeIndustry(parsed.industry) ?? null,
      entities: Array.isArray(parsed.entities) ? parsed.entities : input.entities ?? [],
      objectives: Array.isArray(parsed.objectives) ? parsed.objectives : [],
    };
  } catch {
    return {
      archetype: input.archetypeHint ?? null,
      industry: normalizeIndustry(input.industry) ?? null,
      entities: input.entities ?? [],
      objectives: [],
    };
  }
}

// ─── Stage 2 · Corpus match ────────────────────────────────────────────
interface VectorMatchRaw {
  patternKey: string;
  score: number;
  metadata: Record<string, unknown>;
}

type CorpusMatchRow = {
  pattern_key: string;
  title: string | null;
  industries: string[] | null;
  key_patterns: string[] | null;
  canonical_shape_json: Record<string, unknown> | null;
  deployment_count: number | null;
  successful_deployment_count: number | null;
  score: string | number | null;
};

function metadataString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function metadataStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
}

function searchText(input: ClassifierInput, stage1: Stage1Result): string {
  return `${input.useCase} ${stage1.entities.join(' ')} ${stage1.objectives.join(' ')}`.trim();
}

function numeric(value: string | number | null | undefined, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

async function vectorMatch(input: ClassifierInput, stage1: Stage1Result, topK = 10): Promise<VectorMatchRaw[]> {
  try {
    const text = searchText(input, stage1);
    const rows = await azureRead.query<CorpusMatchRow>(
      `
        SELECT
          topic_key AS pattern_key,
          title,
          industries,
          key_patterns,
          canonical_shape_json,
          deployment_count,
          successful_deployment_count,
          ts_rank_cd(
            to_tsvector('english', concat_ws(' ', title, array_to_string(key_patterns, ' '), canonical_shape_json::text)),
            plainto_tsquery('english', $1)
          ) AS score
        FROM engagement_topics
        WHERE promotion_state IN ('published', 'validated', 'active')
          AND (
            $2::text IS NULL
            OR industries @> ARRAY[$2::text]
            OR industries @> ARRAY['GENERAL']
          )
          AND (
            $1 = ''
            OR to_tsvector('english', concat_ws(' ', title, array_to_string(key_patterns, ' '), canonical_shape_json::text))
               @@ plainto_tsquery('english', $1)
            OR title ILIKE '%' || $1 || '%'
            OR array_to_string(key_patterns, ' ') ILIKE '%' || $1 || '%'
          )
        ORDER BY score DESC, deployment_count DESC NULLS LAST, title ASC
        LIMIT $3
      `,
      [text, stage1.industry, Math.min(Math.max(topK, 1), 20)],
      { missingTable: 'empty' },
    );

    return rows.map((row) => ({
      patternKey: row.pattern_key,
      score: numeric(row.score, 0.45),
      metadata: {
        title: row.title,
        industries: row.industries ?? [],
        key_patterns: row.key_patterns ?? [],
        canonical_shape_json: row.canonical_shape_json ?? null,
        deployment_count: row.deployment_count ?? 0,
        successful_deployment_count: row.successful_deployment_count ?? 0,
      },
    }));
  } catch {
    return [];
  }
}

// ─── Stage 3 · Weighted scoring ────────────────────────────────────────
async function scoreAndRank(
  vectorMatches: VectorMatchRaw[],
  stage1: Stage1Result,
): Promise<PatternClassifierMatch[]> {
  if (vectorMatches.length === 0) return [];
  const patternKeys = vectorMatches.map((m) => m.patternKey);

  // Pull catalog rows for success-rate + canonical shape
  const sb = getAzureWriteFluentClient();
  const { data: catalog } = await sb
    .from('engagement_topics')
    .select('topic_key, title, industries, key_patterns, canonical_shape_json, deployment_count, successful_deployment_count, promotion_state')
    .in('topic_key', patternKeys);
  const byKey = new Map<string, Record<string, unknown>>();
  for (const row of (catalog as Array<Record<string, unknown>> | null) ?? []) {
    byKey.set(row.topic_key as string, row);
  }

  const scored: PatternClassifierMatch[] = [];
  for (const vm of vectorMatches) {
    const cat = byKey.get(vm.patternKey);
    const vectorSim = vm.score;
    const metadataArchetype = metadataString(vm.metadata.archetype);
    const catalogArchetype =
      ((cat?.canonical_shape_json as Record<string, unknown> | undefined)?.archetype as string | undefined) ?? null;
    const resolvedArchetype = catalogArchetype ?? metadataArchetype;
    const archMatch = stage1.archetype && resolvedArchetype === stage1.archetype ? 1 : 0;

    const metadataIndustries = metadataStringArray(vm.metadata.industries);
    const industryList = ((cat?.industries as string[] | undefined) ?? metadataIndustries);
    const industryMatch = stage1.industry && industryList.includes(stage1.industry) ? 1 : 0;

    const deployments = Number(cat?.deployment_count ?? vm.metadata.deployment_count ?? 0);
    const successes = Number(cat?.successful_deployment_count ?? vm.metadata.successful_deployment_count ?? 0);
    const successRate = deployments > 0 ? successes / deployments : 0;
    const keyPatterns = (cat?.key_patterns as string[] | undefined) ?? [];
    const entityCorpus = [
      ...keyPatterns,
      metadataString(vm.metadata.title) ?? '',
      metadataString(vm.metadata.tagline) ?? '',
      metadataString(vm.metadata.text) ?? '',
      ...metadataStringArray(vm.metadata.vendor_examples),
      ...metadataStringArray(vm.metadata.failure_modes),
    ]
      .join(' ')
      .toLowerCase();
    const entityOverlap = stage1.entities.length
      ? stage1.entities.filter((e) => entityCorpus.includes(e.toLowerCase())).length /
        stage1.entities.length
      : 0;

    const composite =
      W_VECTOR * vectorSim +
      W_ARCHETYPE * archMatch +
      W_INDUSTRY * industryMatch +
      W_ENTITY * entityOverlap +
      W_SUCCESS * successRate;

    const band = bandOf(composite);
    if (band === 'no_match') continue;

    const rationale = [
      `vector ${(vectorSim * 100).toFixed(0)}%`,
      archMatch ? 'archetype ✓' : '',
      industryMatch ? 'industry ✓' : '',
      entityOverlap > 0 ? `entities ${Math.round(entityOverlap * 100)}%` : '',
      deployments > 0 ? `${successes}/${deployments} successful` : '',
    ]
      .filter(Boolean)
      .join(' · ');

    scored.push({
      patternKey: vm.patternKey,
      confidence: Math.min(1, composite),
      archetype: (resolvedArchetype as ArchetypeKey | null) ?? stage1.archetype ?? null,
      industry: industryList[0] ?? stage1.industry,
      canonicalShape: (cat?.canonical_shape_json as Record<string, unknown> | null) ?? null,
      band,
      suggestedAction: actionOf(band),
      rationale,
    });
  }

  return scored.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

// ─── Public entry ──────────────────────────────────────────────────────
export async function classifyOrigination(input: ClassifierInput): Promise<ClassifierOutput> {
  const t0 = Date.now();
  const stage1 = await extractIntent(input);
  const t1 = Date.now();
  const vectors = await vectorMatch(input, stage1);
  const t2 = Date.now();
  const matches = await scoreAndRank(vectors, stage1);
  const t3 = Date.now();

  return {
    matches,
    extracted: stage1,
    latencyMs: {
      stage1: t1 - t0,
      stage2: t2 - t1,
      stage3: t3 - t2,
      total: t3 - t0,
    },
  };
}

/**
 * Record a classifier call against a program so we can tune weights.
 * Writes to pattern_match_logs.
 */
export async function logClassifierDecision(input: {
  programId: string;
  userId: string;
  match: PatternClassifierMatch;
  accepted: boolean;
}): Promise<void> {
  const sb = getAzureWriteFluentClient();
  await sb.from('pattern_match_logs').insert({
    engagement_id: input.programId,
    pattern_key: input.match.patternKey,
    match_confidence: input.match.confidence,
    match_context_jsonb: {
      band: input.match.band,
      suggested_action: input.match.suggestedAction,
      rationale: input.match.rationale,
    },
    suggested_action: input.match.suggestedAction,
    acted_upon: input.accepted,
    acted_upon_at: input.accepted ? new Date().toISOString() : null,
    acted_upon_by_user_id: input.accepted ? input.userId : null,
    matched_by_agent: 'classifier_v1',
  });
}

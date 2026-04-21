// Pattern classifier · 3-stage pipeline per Packet 2 §2.3.
//
// Stage 1 · Intent extraction (≤1000ms) — entity + archetype extraction
// Stage 2 · Vector match (≤2000ms) — Pinecone top-k on public-patterns
// Stage 3 · Scoring + ranking (≤1500ms) — weighted composite
//
// Output: up to 3 matches with confidence bands. Threshold 0.4 min.
// Spec calls for Voyage-3 embeddings; repo uses OpenAI
// text-embedding-3-large. Flagged as follow-up.

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import { getServerSupabase } from '@/lib/supabase-server';
import type {
  ArchetypeKey,
  ClassifierInput,
  ClassifierOutput,
  PatternClassifierMatch,
} from './types';

const EMBED_MODEL = 'text-embedding-3-large';
const EMBED_DIMS = 3072;
const INDEX_NAME = process.env.PINECONE_INDEX ?? 'nexus-knowledge';
const PATTERN_NAMESPACE = 'public-patterns';
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

let _openai: OpenAI | null = null;
let _pinecone: Pinecone | null = null;
let _anthropic: Anthropic | null = null;

function getOpenAI(): OpenAI | null {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}
function getPinecone(): Pinecone | null {
  if (_pinecone) return _pinecone;
  const key = process.env.PINECONE_API_KEY;
  if (!key) return null;
  _pinecone = new Pinecone({ apiKey: key });
  return _pinecone;
}
function getAnthropic(): Anthropic | null {
  if (_anthropic) return _anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  _anthropic = new Anthropic({ apiKey: key });
  return _anthropic;
}

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

async function extractIntent(input: ClassifierInput): Promise<Stage1Result> {
  const anthropic = getAnthropic();
  if (!anthropic) {
    return { archetype: input.archetypeHint ?? null, industry: input.industry ?? null, entities: input.entities ?? [], objectives: [] };
  }
  try {
    const result = await anthropic.messages.create({
      model: CLASSIFIER_MODEL,
      max_tokens: 512,
      temperature: 0,
      system:
        'Extract program classification signals from a transformation use case. Return strict JSON only. Schema: {archetype: "strategic_transformation"|"workflow_automation"|"platform_modernization"|"ai_product_enablement"|"operational_optimization"|null, industry: string|null, entities: string[], objectives: string[]}.',
      messages: [
        {
          role: 'user',
          content: `Use case: ${input.useCase}${input.industry ? `\nIndustry hint: ${input.industry}` : ''}${input.sponsor ? `\nSponsor: ${input.sponsor}` : ''}${input.scale ? `\nScale: ${input.scale}` : ''}`,
        },
      ],
    });
    const text = result.content.find((b) => b.type === 'text')?.text ?? '{}';
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '')) as Partial<Stage1Result>;
    return {
      archetype: (parsed.archetype as ArchetypeKey) ?? input.archetypeHint ?? null,
      industry: parsed.industry ?? input.industry ?? null,
      entities: Array.isArray(parsed.entities) ? parsed.entities : input.entities ?? [],
      objectives: Array.isArray(parsed.objectives) ? parsed.objectives : [],
    };
  } catch {
    return { archetype: input.archetypeHint ?? null, industry: input.industry ?? null, entities: input.entities ?? [], objectives: [] };
  }
}

// ─── Stage 2 · Vector match ────────────────────────────────────────────
interface VectorMatchRaw {
  patternKey: string;
  score: number;
  metadata: Record<string, unknown>;
}

async function embed(text: string): Promise<number[] | null> {
  const oai = getOpenAI();
  if (!oai) return null;
  try {
    const res = await oai.embeddings.create({ model: EMBED_MODEL, input: text, dimensions: EMBED_DIMS });
    return res.data[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

async function vectorMatch(input: ClassifierInput, stage1: Stage1Result, topK = 10): Promise<VectorMatchRaw[]> {
  const pc = getPinecone();
  if (!pc) return [];
  const queryEmbed = await embed(`${input.useCase} ${stage1.entities.join(' ')} ${stage1.objectives.join(' ')}`.trim());
  if (!queryEmbed) return [];
  try {
    const index = pc.index(INDEX_NAME);
    const filter: Record<string, unknown> = {};
    if (stage1.archetype) filter.archetype = { $eq: stage1.archetype };
    if (stage1.industry) filter.industry = { $eq: stage1.industry };
    const result = await index.namespace(PATTERN_NAMESPACE).query({
      vector: queryEmbed,
      topK,
      includeMetadata: true,
      filter: Object.keys(filter).length ? filter : undefined,
    });
    return (result.matches ?? []).map((m) => ({
      patternKey: (m.metadata?.pattern_key as string) ?? m.id,
      score: m.score ?? 0,
      metadata: (m.metadata ?? {}) as Record<string, unknown>,
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
  const sb = getServerSupabase();
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
    const archMatch = cat && stage1.archetype && ((cat.archetype as string) ?? '') === stage1.archetype ? 1 : 0;
    const industryList = (cat?.industries as string[] | undefined) ?? [];
    const industryMatch = stage1.industry && industryList.includes(stage1.industry) ? 1 : 0;
    const deployments = Number(cat?.deployment_count ?? 0);
    const successes = Number(cat?.successful_deployment_count ?? 0);
    const successRate = deployments > 0 ? successes / deployments : 0;
    const keyPatterns = (cat?.key_patterns as string[] | undefined) ?? [];
    const entityOverlap = stage1.entities.length
      ? stage1.entities.filter((e) => keyPatterns.some((kp) => kp.toLowerCase().includes(e.toLowerCase()))).length /
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
      archetype: (cat?.archetype as ArchetypeKey | undefined) ?? stage1.archetype ?? null,
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
  const sb = getServerSupabase();
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

import { corpus as defaultCorpus } from './loader';
import { corpusToPrimitives, type KnowledgePrimitive } from './indexer';
import { renderInlineCitation, type AtlasCitation } from './citation-renderer';
import { ATLAS_SYNTHESIS_VERSION, ATLAS_SYNTHESIS_WORD_CAP, buildAtlasSynthesisPrompt } from './synthesis-prompts';
import type { LoadedCorpus } from './types';

export interface AtlasSynthesisInput {
  query: string;
  corpus?: LoadedCorpus;
  primitives?: readonly KnowledgePrimitive[];
  maxEvidence?: number;
}

export interface AtlasEvidencePrimitive {
  primitive: KnowledgePrimitive;
  score: number;
}

export interface AtlasSynthesisResult {
  version: string;
  query: string;
  answer: string;
  wordCount: number;
  citations: AtlasCitation[];
  evidence: AtlasEvidencePrimitive[];
  prompt: string;
  deterministic: true;
}

const DEFAULT_MAX_EVIDENCE = 4;
const TOKEN_MIN_LENGTH = 2;
const QUERY_STOP_WORDS = new Set([
  'about',
  'an',
  'atlas',
  'do',
  'does',
  'for',
  'how',
  'should',
  'the',
  'this',
  'what',
  'when',
  'where',
  'with',
]);

function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length >= TOKEN_MIN_LENGTH && !QUERY_STOP_WORDS.has(token)),
    ),
  );
}

function stringifyMetadata(metadata: Record<string, unknown> | undefined): string {
  if (!metadata) {
    return '';
  }

  return Object.values(metadata)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value): value is string | number | boolean => ['string', 'number', 'boolean'].includes(typeof value))
    .join(' ');
}

function primitiveSearchText(primitive: KnowledgePrimitive): string {
  return [primitive.id, primitive.kind, primitive.title, primitive.content, primitive.sourceId, stringifyMetadata(primitive.metadata)]
    .filter(Boolean)
    .join(' ');
}

function scorePrimitive(primitive: KnowledgePrimitive, queryTokens: readonly string[]): number {
  const searchText = primitiveSearchText(primitive).toLowerCase();
  const searchTokens = new Set(tokenize(searchText));
  const titleTokens = new Set(tokenize(primitive.title ?? ''));
  const id = primitive.id.toLowerCase();

  return queryTokens.reduce((score, token) => {
    if (token.length >= 3 && id.includes(token)) {
      return score + 8;
    }

    if (titleTokens.has(token)) {
      return score + 5;
    }

    if (searchTokens.has(token)) {
      return score + 2;
    }

    return score;
  }, 0);
}

function rankEvidence(primitives: readonly KnowledgePrimitive[], query: string, maxEvidence: number): AtlasEvidencePrimitive[] {
  const queryTokens = tokenize(query);
  const ranked = primitives
    .map((primitive) => ({ primitive, score: scorePrimitive(primitive, queryTokens) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.primitive.id.localeCompare(right.primitive.id);
    });

  const fallback = primitives
    .slice(0, maxEvidence)
    .map((primitive) => ({ primitive, score: 0 }));

  return (ranked.length > 0 ? ranked : fallback).slice(0, maxEvidence);
}

function firstSentence(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^(.{1,220}?[.!?])\s/);
  return (match?.[1] ?? normalized).replace(/[.!?]+$/, '');
}

function countWords(value: string): number {
  return value.trim().length === 0 ? 0 : value.trim().split(/\s+/).length;
}

function trimToWords(value: string, wordCap: number): string {
  const words = value.trim().split(/\s+/);

  if (words.length <= wordCap) {
    return value.trim();
  }

  return `${words.slice(0, wordCap).join(' ').replace(/[,.]+$/, '')}...`;
}

function citationFromPrimitive(primitive: KnowledgePrimitive): AtlasCitation {
  return {
    primitiveId: primitive.id,
    kind: primitive.kind,
    title: primitive.title,
    sourceId: primitive.sourceId,
  };
}

function buildAnswer(query: string, evidence: readonly AtlasEvidencePrimitive[]): string {
  const [primary, secondary, tertiary] = evidence;
  const primaryCitation = primary ? renderInlineCitation([primary.primitive.id]) : '';
  const secondaryCitation = secondary ? renderInlineCitation([secondary.primitive.id]) : primaryCitation;
  const combinedCitation = renderInlineCitation(evidence.slice(0, 3).map((item) => item.primitive.id));
  const queryFrame = query.trim() ? `For "${query.trim()}", ` : 'Atlas synthesis: ';

  if (!primary) {
    return 'Atlas does not have a corpus primitive to ground this answer, so it cannot synthesize a substantive response.';
  }

  const primaryClaim = firstSentence(primary.primitive.content);
  const secondaryClaim = secondary ? firstSentence(secondary.primitive.content) : '';
  const tertiaryTitle = tertiary?.primitive.title ?? tertiary?.primitive.id;
  const secondarySentence = secondaryClaim
    ? `The next calibration point is ${secondaryClaim.toLowerCase()} ${secondaryCitation}.`
    : `No second primitive outranks the primary evidence, so treat this as a narrow corpus-backed read ${primaryCitation}.`;
  const actionSentence = tertiaryTitle
    ? `Use ${tertiaryTitle} as the orchestration check before turning this into a plan ${combinedCitation}.`
    : `Use the cited primitive as the orchestration check before turning this into a plan ${primaryCitation}.`;

  return trimToWords(
    `${queryFrame}the strongest corpus-backed read is ${primaryClaim.toLowerCase()} ${primaryCitation}. ${secondarySentence} ${actionSentence}`,
    ATLAS_SYNTHESIS_WORD_CAP,
  );
}

export function synthesizeAtlasAnswer(input: AtlasSynthesisInput): AtlasSynthesisResult {
  const maxEvidence = input.maxEvidence ?? DEFAULT_MAX_EVIDENCE;
  const primitives = input.primitives ?? corpusToPrimitives(input.corpus ?? defaultCorpus);
  const evidence = rankEvidence(primitives, input.query, maxEvidence);
  const citations = evidence.map((item) => citationFromPrimitive(item.primitive));
  const answer = buildAnswer(input.query, evidence);

  return {
    version: ATLAS_SYNTHESIS_VERSION,
    query: input.query,
    answer,
    wordCount: countWords(answer),
    citations,
    evidence,
    prompt: buildAtlasSynthesisPrompt({
      query: input.query,
      primitives: evidence.map((item) => item.primitive),
    }),
    deterministic: true,
  };
}

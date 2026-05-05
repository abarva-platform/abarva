import fs from 'node:fs';
import path from 'node:path';
import { getPhasePack, listAuthoredPhases } from '../index';
import type { PhasePack } from '../types';

const ROOT = process.cwd();

const SQL_KEYWORDS = new Set([
  'add',
  'all',
  'alter',
  'and',
  'begin',
  'boolean',
  'by',
  'cascade',
  'case',
  'check',
  'column',
  'commit',
  'constraint',
  'create',
  'default',
  'delete',
  'drop',
  'else',
  'end',
  'exists',
  'false',
  'foreign',
  'from',
  'function',
  'grant',
  'group',
  'if',
  'index',
  'insert',
  'into',
  'jsonb',
  'key',
  'not',
  'null',
  'numeric',
  'on',
  'or',
  'policy',
  'primary',
  'references',
  'select',
  'set',
  'table',
  'text',
  'then',
  'timestamp',
  'timestamptz',
  'true',
  'type',
  'unique',
  'update',
  'using',
  'uuid',
  'values',
  'when',
  'where',
  'with',
]);

const TOKEN_STOPWORDS = new Set([
  'able',
  'about',
  'after',
  'again',
  'against',
  'also',
  'and',
  'any',
  'are',
  'because',
  'before',
  'being',
  'can',
  'cannot',
  'does',
  'each',
  'from',
  'has',
  'have',
  'including',
  'into',
  'its',
  'must',
  'not',
  'off',
  'only',
  'or',
  'rather',
  'same',
  'than',
  'that',
  'the',
  'their',
  'them',
  'this',
  'through',
  'to',
  'using',
  'what',
  'when',
  'where',
  'which',
  'who',
  'with',
  'without',
]);

const DATA_ROOM_ARTIFACT_CONCEPTS = [
  'artifact',
  'artifact type',
  'baseline capture',
  'baseline kpi',
  'business case',
  'charter',
  'classification',
  'cohort',
  'commercial constraint',
  'contradiction log',
  'cxo interview',
  'cxo verification',
  'dashboard',
  'decision log',
  'definition of done',
  'deliverable',
  'deliverables v2',
  'design spec',
  'discovery report',
  'evidence',
  'evidence row',
  'exception path',
  'execution plan',
  'financial metric',
  'founder approval request',
  'engagement participant',
  'graph node',
  'knowledge base',
  'metric pack',
  'operating model',
  'outcome evidence',
  'outcome report',
  'phase 3 findings',
  'pilot cohort',
  'pilot incident',
  'pilot plan',
  'pilot report',
  'program',
  'program module',
  'program record',
  'program seed',
  'review pack',
  'risk control',
  'rollout deliverable',
  'rollout plan',
  'rollout telemetry',
  'source artifact',
  'source basis',
  'source system',
  'sponsor',
  'stakeholder map',
  'support plan',
  'system',
  'tenant context',
  'vendor contract',
  'vendor evidence',
  'vendor selection',
];

function walkFiles(dir: string, predicate: (file: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath, predicate);
    return predicate(fullPath) ? [fullPath] : [];
  });
}

function normalizeConcept(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`"']/g, '')
    .replace(/[_./:-]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemToken(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

function tokenize(value: string): string[] {
  return normalizeConcept(value)
    .split(' ')
    .map(stemToken)
    .filter((token) => token.length > 2 && !TOKEN_STOPWORDS.has(token));
}


const DEPENDENCY_TOKEN_ALIASES: Record<string, string[]> = {
  contradiction: ['problem', 'pattern', 'stakeholder'],
  falsifier: ['problem', 'pattern'],
  option: ['problem', 'pattern'],
  rationalization: ['problem', 'pattern'],
};

function expandDependencyTokens(tokens: string[]): Set<string> {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    for (const alias of DEPENDENCY_TOKEN_ALIASES[token] ?? []) {
      expanded.add(alias);
    }
  }
  return expanded;
}

function addIdentifierConcepts(concepts: Set<string>, text: string): void {
  const identifiers = text.match(/\b[a-z][a-z0-9_]{2,}\b/gi) ?? [];
  for (const identifier of identifiers) {
    const normalized = normalizeConcept(identifier);
    if (!normalized || SQL_KEYWORDS.has(normalized)) continue;
    concepts.add(normalized);
    if (identifier.includes('_')) concepts.add(normalizeConcept(identifier.replace(/_/g, ' ')));
  }
}

function addSqlTableColumnConcepts(concepts: Set<string>, sql: string): void {
  const tableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z_][a-z0-9_]*)\s*\(([\s\S]*?)\);/gi;
  for (const match of sql.matchAll(tableRegex)) {
    const table = normalizeConcept(match[1]);
    concepts.add(table);
    const columnLines = match[2].split('\n');
    for (const line of columnLines) {
      const column = line.trim().match(/^([a-z_][a-z0-9_]*)\b/i)?.[1];
      if (!column || SQL_KEYWORDS.has(column.toLowerCase())) continue;
      concepts.add(`${table} ${normalizeConcept(column)}`);
      concepts.add(normalizeConcept(column));
    }
  }
}

function buildKnownVocabulary(): Set<string> {
  const concepts = new Set(DATA_ROOM_ARTIFACT_CONCEPTS.map(normalizeConcept));

  for (const file of walkFiles(path.join(ROOT, 'supabase/migrations'), (candidate) => candidate.endsWith('.sql'))) {
    const sql = fs.readFileSync(file, 'utf8').toLowerCase();
    addIdentifierConcepts(concepts, sql);
    addSqlTableColumnConcepts(concepts, sql);
  }

  for (const file of walkFiles(path.join(ROOT, 'src/lib/knowledge'), (candidate) => candidate.endsWith('.ts'))) {
    addIdentifierConcepts(concepts, fs.readFileSync(file, 'utf8'));
  }

  return concepts;
}

function conceptMatchesHint(concept: string, hint: string): boolean {
  const conceptTokens = tokenize(concept);
  if (conceptTokens.length === 0) return false;

  const hintText = normalizeConcept(hint);
  const hintTokens = new Set(tokenize(hint));
  if (conceptTokens.length === 1) {
    return conceptTokens[0].length > 3 && hintTokens.has(conceptTokens[0]);
  }

  return hintText.includes(concept) || conceptTokens.every((token) => hintTokens.has(token));
}

function matchingConcepts(hint: string, vocabulary: Set<string>): string[] {
  return Array.from(vocabulary)
    .filter((concept) => conceptMatchesHint(concept, hint))
    .sort((a, b) => a.localeCompare(b));
}

function suggestConcepts(hint: string, vocabulary: Set<string>): string[] {
  const hintTokens = new Set(tokenize(hint));
  return Array.from(vocabulary)
    .map((concept) => ({
      concept,
      score: tokenize(concept).filter((token) => hintTokens.has(token)).length,
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.concept.localeCompare(b.concept))
    .slice(0, 8)
    .map((candidate) => candidate.concept);
}

const ALL_PACKS: PhasePack[] = listAuthoredPhases().map((phase) => {
  const pack = getPhasePack(phase);
  if (!pack) throw new Error(`listAuthoredPhases returned ${phase} but getPhasePack returned null`);
  return pack;
});

const VOCABULARY = buildKnownVocabulary();

describe('phase-pack evidence binding', () => {
  it('builds a non-trivial DB plus Enterprise Data Room vocabulary', () => {
    expect(VOCABULARY.size).toBeGreaterThan(200);
    expect(Array.from(VOCABULARY)).toEqual(expect.arrayContaining(['deliverables v2', 'engagement participant', 'program module', 'evidence', 'artifact', 'vendor contract']));
  });

  it.each(ALL_PACKS)('$label · every definitionOfDone evaluationHint maps to a known concept', (pack) => {
    for (const item of pack.definitionOfDone) {
      const matches = matchingConcepts(item.evaluationHint, VOCABULARY);
      if (matches.length === 0) {
        throw new Error([
          `${pack.label} · ${item.id} has no evidence-binding vocabulary match.`,
          `Hint: ${item.evaluationHint}`,
          `Suggested known concepts: ${suggestConcepts(item.evaluationHint, VOCABULARY).join(', ') || 'none'}`,
        ].join('\n'));
      }
    }
  });

  it('keeps producesForNext vocabulary connected to the next phase requiresFromPrior', () => {
    for (let phase = 0; phase < 5; phase += 1) {
      const current = getPhasePack(phase);
      const next = getPhasePack(phase + 1);
      if (!current || !next) throw new Error(`Missing phase pack transition ${phase} -> ${phase + 1}`);

      const nextRequiredTokens = expandDependencyTokens(next.dependencies.requiresFromPrior.flatMap(tokenize));
      for (const produced of current.dependencies.producesForNext) {
        const producedTokens = expandDependencyTokens(tokenize(produced));
        const overlap = Array.from(producedTokens).filter((token) => nextRequiredTokens.has(token));
        if (overlap.length === 0) {
          throw new Error([
            `${current.label} producesForNext line is not reflected in ${next.label} requiresFromPrior.`,
            `Produced: ${produced}`,
            `Next requires: ${next.dependencies.requiresFromPrior.join(' | ')}`,
          ].join('\n'));
        }
      }
    }
  });
});

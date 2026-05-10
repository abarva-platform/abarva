import {
  AGENT_OUTPUT_GOLDEN_FIXTURES,
  type AgentOutputGoldenFixture,
  type OutputDisciplineAgent,
  type OutputShapePattern,
} from '@/lib/agent/output-discipline/golden-fixtures';

const MIN_FIXTURE_COUNT = 60;

const AGENTS: OutputDisciplineAgent[] = ['nexus', 'sentinel', 'atlas', 'source', 'steward'];
const PATTERNS: OutputShapePattern[] = [
  'lead-bullets',
  'lead-table',
  'stat-stack',
  'sequential-steps',
  'brief-narrative',
];

function stripOpeningAbvTags(text: string): string {
  return text.replace(/<abv-[a-z-]+[^>]*>/g, '').replace(/<\/abv-[a-z-]+>/g, '');
}

function visibleText(html: string): string {
  return stripOpeningAbvTags(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean);
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function countMatches(text: string, pattern: RegExp): number {
  return Array.from(text.matchAll(pattern)).length;
}

function hasRawMarkdown(html: string): boolean {
  return /(^|\s)\*{1,2}\S|\S\*{1,2}($|\s)|```/.test(html);
}

function visibleRawIdViolations(html: string): string[] {
  const text = visibleText(html);
  return Array.from(text.matchAll(/\b(?:P|UC|VEN|REG|SRC)-[A-Z0-9-]{2,}\b/g)).map((match) => match[0]);
}

function paragraphViolations(html: string): string[] {
  return Array.from(html.matchAll(/<p>([\s\S]*?)<\/p>/g))
    .map((match) => visibleText(match[1] ?? ''))
    .filter((paragraph) => sentences(paragraph).length > 3);
}

function tableColumnCounts(html: string): number[] {
  return Array.from(html.matchAll(/<thead><tr>([\s\S]*?)<\/tr><\/thead>/g)).map((match) =>
    countMatches(match[1] ?? '', /<th>/g),
  );
}

function validatePatternShape(fixture: AgentOutputGoldenFixture): string[] {
  const html = fixture.output;
  const failures: string[] = [];

  if (fixture.pattern === 'lead-bullets') {
    const bulletCount = countMatches(html, /<li>/g);
    if (!/<p>[\s\S]+<\/p>/.test(html)) failures.push('lead-bullets missing lead paragraph');
    if (!/<ul>/.test(html)) failures.push('lead-bullets missing ul');
    if (bulletCount < 3 || bulletCount > 5) failures.push(`lead-bullets has ${bulletCount} bullets`);
  }

  if (fixture.pattern === 'lead-table') {
    if (!/<table>/.test(html)) failures.push('lead-table missing table');
    for (const columns of tableColumnCounts(html)) {
      if (columns < 2 || columns > 5) failures.push(`lead-table has ${columns} columns`);
    }
    if (!/<tbody>/.test(html)) failures.push('lead-table missing tbody');
  }

  if (fixture.pattern === 'stat-stack') {
    const statCount = countMatches(html, /<li>/g);
    if (!/data-variant="stat-stack"/.test(html)) failures.push('stat-stack missing data variant');
    if (statCount < 3 || statCount > 5) failures.push(`stat-stack has ${statCount} stats`);
  }

  if (fixture.pattern === 'sequential-steps') {
    const stepCount = countMatches(html, /<li>/g);
    if (!/<ol>/.test(html)) failures.push('sequential-steps missing ol');
    if (stepCount < 3 || stepCount > 5) failures.push(`sequential-steps has ${stepCount} steps`);
  }

  if (fixture.pattern === 'brief-narrative') {
    const paragraphCount = countMatches(html, /<p>/g);
    if (/<ul>|<ol>|<table>/.test(html)) failures.push('brief-narrative mixed with list or table');
    if (paragraphCount < 2 || paragraphCount > 4) failures.push(`brief-narrative has ${paragraphCount} paragraphs`);
  }

  return failures;
}

function validateFixture(fixture: AgentOutputGoldenFixture): string[] {
  const failures: string[] = [];
  const text = visibleText(fixture.output);
  const words = wordCount(text);

  if (hasRawMarkdown(fixture.output)) failures.push('raw markdown leaked');
  const rawIds = visibleRawIdViolations(fixture.output);
  if (rawIds.length > 0) failures.push(`visible raw ids: ${rawIds.join(', ')}`);
  if (paragraphViolations(fixture.output).length > 0) failures.push('paragraph longer than 3 sentences');
  if (!/<abv-sources>/.test(fixture.output)) failures.push('missing abv-sources footer');
  if (words > 500) failures.push(`over hard global cap: ${words} words`);

  for (const phrase of fixture.requiredPhrases) {
    if (!text.includes(phrase)) failures.push(`missing required phrase: ${phrase}`);
  }

  failures.push(...validatePatternShape(fixture));
  return failures;
}

function groupedCounts<T extends string>(values: T[]): Record<T, number> {
  return values.reduce(
    (counts, value) => {
      counts[value] = (counts[value] ?? 0) + 1;
      return counts;
    },
    {} as Record<T, number>,
  );
}

const results = AGENT_OUTPUT_GOLDEN_FIXTURES.map((fixture) => ({
  fixture,
  failures: validateFixture(fixture),
}));

const failed = results.filter((result) => result.failures.length > 0);
const byAgent = groupedCounts(AGENT_OUTPUT_GOLDEN_FIXTURES.map((fixture) => fixture.agent));
const byPattern = groupedCounts(AGENT_OUTPUT_GOLDEN_FIXTURES.map((fixture) => fixture.pattern));

const coverageFailures: string[] = [];
if (AGENT_OUTPUT_GOLDEN_FIXTURES.length < MIN_FIXTURE_COUNT) {
  coverageFailures.push(`expected at least ${MIN_FIXTURE_COUNT} fixtures, found ${AGENT_OUTPUT_GOLDEN_FIXTURES.length}`);
}
for (const agent of AGENTS) {
  if ((byAgent[agent] ?? 0) < 10) coverageFailures.push(`${agent} has fewer than 10 fixtures`);
}
for (const pattern of PATTERNS) {
  if ((byPattern[pattern] ?? 0) < 5) coverageFailures.push(`${pattern} has fewer than 5 fixtures`);
}

console.log(`Agent output golden eval: ${AGENT_OUTPUT_GOLDEN_FIXTURES.length} fixtures`);
console.log(`By agent: ${JSON.stringify(byAgent)}`);
console.log(`By pattern: ${JSON.stringify(byPattern)}`);

for (const result of results) {
  const status = result.failures.length === 0 ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${result.fixture.id} · ${result.fixture.agent} · ${result.fixture.pattern}`);
  if (result.failures.length > 0) console.log(`  ${result.failures.join('; ')}`);
}

if (coverageFailures.length > 0 || failed.length > 0) {
  if (coverageFailures.length > 0) {
    console.error(`Coverage failures:\n- ${coverageFailures.join('\n- ')}`);
  }
  if (failed.length > 0) {
    console.error(`${failed.length} fixture(s) failed validation.`);
  }
  process.exit(1);
}

console.log('All agent output golden fixtures passed.');


import fs from 'node:fs';
import path from 'node:path';

import { scoreAnswer } from '../../src/lib/eval/answer-quality/scorer';
import { ANSWER_QUALITY_PASS_THRESHOLD } from '../../src/lib/eval/answer-quality/rubric';

interface AnswerFixture {
  id: string;
  tenantKey: string;
  surface: string;
  answer: string;
}

interface FixtureResult {
  id: string;
  tenantKey: string;
  surface: string;
  overall: number;
  gatePassed: boolean;
  violations: string[];
}

const REQUIRED_KNOWN_GOOD = 50;
const REQUIRED_KNOWN_BAD = 30;
const fixturesDir = path.join(process.cwd(), 'src/lib/eval/answer-quality/fixtures');

const knownGood = readJsonl(path.join(fixturesDir, 'wave0-known-good.jsonl'));
const knownBad = readJsonl(path.join(fixturesDir, 'wave0-known-bad.jsonl'));

const countFailures = [
  knownGood.length < REQUIRED_KNOWN_GOOD
    ? `known-good fixture count ${knownGood.length} is below required ${REQUIRED_KNOWN_GOOD}`
    : null,
  knownBad.length < REQUIRED_KNOWN_BAD
    ? `known-bad fixture count ${knownBad.length} is below required ${REQUIRED_KNOWN_BAD}`
    : null,
].filter(Boolean);

const goodResults = knownGood.map(scoreFixture);
const badResults = knownBad.map(scoreFixture);
const goodFailures = goodResults.filter((result) => !result.gatePassed);
const badFailures = badResults.filter((result) => result.gatePassed);
const classified = knownGood.length + knownBad.length - goodFailures.length - badFailures.length;
const total = knownGood.length + knownBad.length;
const classificationRate = total === 0 ? 0 : Number((classified / total).toFixed(4));

const summary = {
  gate: 'answer-quality',
  threshold: ANSWER_QUALITY_PASS_THRESHOLD,
  requiredKnownGood: REQUIRED_KNOWN_GOOD,
  requiredKnownBad: REQUIRED_KNOWN_BAD,
  knownGood: knownGood.length,
  knownBad: knownBad.length,
  classificationRate,
  status: countFailures.length || goodFailures.length || badFailures.length ? 'failed' : 'passed',
  countFailures,
  goodFailures,
  badFailures,
};

if (summary.status !== 'passed') {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(summary, null, 2));

function readJsonl(file: string): AnswerFixture[] {
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AnswerFixture);
}

function scoreFixture(fixture: AnswerFixture): FixtureResult {
  const score = scoreAnswer(fixture.answer, {
    questionId: fixture.id,
    tenantKey: fixture.tenantKey,
    surface: fixture.surface,
  });

  return {
    id: fixture.id,
    tenantKey: fixture.tenantKey,
    surface: fixture.surface,
    overall: score.overall,
    gatePassed: score.gatePassed,
    violations: score.violations.map((violation) => violation.dimension),
  };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { CookieJar, splitSetCookieHeader } from '../lib/cookieJar.mjs';
import { classifyHarnessResponse, scoreProductAnswer } from '../lib/scorer.mjs';
import { parseStream, summarizeResults } from '../ground_truth_runner.mjs';

test('cookie jar applies combined Set-Cookie headers', () => {
  const entries = splitSetCookieHeader('a=1; Path=/, b=2; Path=/; HttpOnly');
  assert.deepEqual(entries, ['a=1; Path=/', 'b=2; Path=/; HttpOnly']);

  const jar = new CookieJar([{ name: 'session', value: 'old' }]);
  jar.applySetCookie({
    get: () => 'session=new; Path=/, theme=dark; Path=/',
  });
  assert.equal(jar.header(), 'session=new; theme=dark');
});

test('harness classifier separates product quality from transport failures', () => {
  assert.deepEqual(
    classifyHarnessResponse({
      status: 200,
      contentType: 'application/x-ndjson',
      text: '{"type":"delta","text":"ok"}\n',
      elapsedMs: 1000,
      latencyBudgetMs: 60000,
    }),
    null,
  );

  assert.equal(classifyHarnessResponse({
    status: 200,
    contentType: 'text/html',
    text: '<html></html>',
    elapsedMs: 1000,
    latencyBudgetMs: 60000,
  }).status, 'fail-harness');

  assert.equal(classifyHarnessResponse({
    status: 200,
    contentType: 'application/x-ndjson',
    text: '{"type":"delta","text":"slow"}\n',
    elapsedMs: 61000,
    latencyBudgetMs: 60000,
  }).status, 'timeout');
});

test('scorer caps unavailable and pattern-only answers', () => {
  const strongAnswer = [
    'SkyHarbor should prioritize IBM mainframe modernization because the S02_MODERNIZATION_LEDGER and S03_MAINFRAME_INVENTORY show 47 workloads, 19 remaining on Z, and a 90 days board window.',
    'The recommendation is to rank the next move by value, risk, and AWS dependency, then validate against S06_IBM_ENGAGEMENT before contract negotiation.',
  ].join(' ');

  const strong = scoreProductAnswer({
    answer: strongAnswer,
    sources: [
      { id: 'skyharbor:S02_MODERNIZATION_LEDGER', type: 'TENANT' },
      { id: 'skyharbor:S03_MAINFRAME_INVENTORY', type: 'TENANT' },
      { id: 'skyharbor:S06_IBM_ENGAGEMENT', type: 'TENANT' },
    ],
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY'],
  });
  assert.equal(strong.status, 'pass');
  assert.equal(strong.pass, true);

  const unavailable = scoreProductAnswer({
    answer: `${strongAnswer} I don't have the modernization ledger, so this is not available.`,
    sources: [{ id: 'skyharbor:S02_MODERNIZATION_LEDGER', type: 'TENANT' }],
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY'],
  });
  assert.equal(unavailable.score <= 3, true);
  assert.equal(unavailable.status, 'fail-product');

  const patternOnly = scoreProductAnswer({
    answer: strongAnswer,
    sources: [{ id: 'airline-pattern-overlay:P-001', type: 'PATTERN' }],
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY'],
  });
  assert.equal(patternOnly.score <= 3, true);
  assert.equal(patternOnly.flags.includes('pattern_overlay_only'), true);
});

test('wrong tenant leakage is automatic product failure', () => {
  const result = scoreProductAnswer({
    answer: 'SkyHarbor should use Apex Retail and Commerce Cloud facts here.',
    sources: [],
    required: ['S02_MODERNIZATION_LEDGER'],
  });
  assert.equal(result.status, 'fail-product');
  assert.equal(result.score, 0);
});

test('stream parser extracts answers, sources, and coverage reports', () => {
  const parsed = parseStream([
    JSON.stringify({
      type: 'sources',
      sources: [{ id: 'skyharbor:S02_MODERNIZATION_LEDGER' }],
      coverageReport: { status: 'partial' },
    }),
    JSON.stringify({ type: 'delta', text: 'SkyHarbor answer.' }),
    '',
  ].join('\n'));

  assert.equal(parsed.answer, 'SkyHarbor answer.');
  assert.equal(parsed.sources.length, 1);
  assert.equal(parsed.coverageReport.status, 'partial');
});

test('summary reports phase gate and harness counts', () => {
  const summary = summarizeResults([
    { pass: true, score: 5, status: 'pass' },
    { pass: false, score: 0, status: 'fail-harness' },
  ]);
  assert.equal(summary.passed, 1);
  assert.equal(summary.failHarness, 1);
  assert.equal(summary.phase4Gate, false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { CookieJar } from '../lib/cookieJar.mjs';
import { runQuestion } from '../ground_truth_runner.mjs';

function makeAuthSession() {
  return {
    async createCookieJar() {
      return new CookieJar([{ name: '__session', value: 'test' }]);
    },
  };
}

function ndjson(events) {
  return `${events.map((event) => JSON.stringify(event)).join('\n')}\n`;
}

test('runQuestion scores canned successful product response', async () => {
  const text = ndjson([
    {
      type: 'sources',
      sources: [
        { id: 'skyharbor:S02_MODERNIZATION_LEDGER', type: 'TENANT' },
        { id: 'skyharbor:S03_MAINFRAME_INVENTORY', type: 'TENANT' },
        { id: 'skyharbor:S06_IBM_ENGAGEMENT', type: 'TENANT' },
      ],
      coverageReport: { status: 'full' },
    },
    {
      type: 'delta',
      text: [
        'SkyHarbor should prioritize the IBM mainframe modernization move because S02_MODERNIZATION_LEDGER and S03_MAINFRAME_INVENTORY show 47 Day-0 workloads, 19 remaining on Z, and board pressure in the next 90 days.',
        'The recommendation is to rank the next extraction by value, risk, AWS dependency, crew disruption, and airport operational resilience, then validate the sourcing posture against S06_IBM_ENGAGEMENT.',
      ].join(' '),
    },
  ]);

  const result = await runQuestion({
    id: 'CTO-Q99',
    question: 'What is the single best move?',
    required: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY'],
  }, {
    baseUrl: 'https://example.test',
    authSession: makeAuthSession(),
    runId: 'test-run',
    fetchImpl: async () => new Response(text, {
      status: 200,
      headers: { 'content-type': 'application/x-ndjson' },
    }),
  });

  assert.equal(result.status, 'pass');
  assert.equal(result.pass, true);
  assert.equal(result.coverageReport.status, 'full');
  assert.match(result.tabId, /^test-run-cto-q99-/);
});

test('runQuestion marks HTML auth fallback as fail-harness', async () => {
  const result = await runQuestion({
    id: 'CTO-Q98',
    question: 'Will auth redirect break the harness?',
    required: ['S02_MODERNIZATION_LEDGER'],
  }, {
    baseUrl: 'https://example.test',
    authSession: makeAuthSession(),
    runId: 'test-run',
    retries: 1,
    fetchImpl: async () => new Response('<html>sign in</html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }),
  });

  assert.equal(result.status, 'fail-harness');
  assert.equal(result.pass, false);
  assert.equal(result.score, 0);
  assert.match(result.harnessReason, /non-ndjson/);
});

test('runQuestion marks short product response as refused, not harness failure', async () => {
  const result = await runQuestion({
    id: 'CTO-Q97',
    question: 'Do we have enough data?',
    required: ['S02_MODERNIZATION_LEDGER'],
  }, {
    baseUrl: 'https://example.test',
    authSession: makeAuthSession(),
    runId: 'test-run',
    fetchImpl: async () => new Response(ndjson([
      { type: 'sources', sources: [], coverageReport: { status: 'missing' } },
      { type: 'delta', text: 'No.' },
    ]), {
      status: 200,
      headers: { 'content-type': 'application/x-ndjson' },
    }),
  });

  assert.equal(result.status, 'refused');
  assert.equal(result.pass, false);
  assert.equal(result.flags.includes('answer_below_50_chars'), true);
});

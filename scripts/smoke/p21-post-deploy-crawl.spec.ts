import assert from 'node:assert/strict';
import {
  compareCrawlToBaseline,
  summarizeComparison,
  type CrawlRun,
} from '../../src/lib/crawl/baseline-compare';
import {
  CRAWL_PERSONAS,
  PRIMARY_CRAWL_SURFACES,
  POST_DEPLOY_HARD_QUESTIONS,
  resolveCrawlPersonas,
} from '../../src/lib/crawl/persona-switcher';

assert.equal(CRAWL_PERSONAS.length, 6);
assert.ok(PRIMARY_CRAWL_SURFACES.length >= 24);
assert.equal(POST_DEPLOY_HARD_QUESTIONS.length, 10);
assert.deepEqual(resolveCrawlPersonas('apex-cio').map((persona) => persona.key), ['apex-cio']);
assert.deepEqual(resolveCrawlPersonas('lakeshore-cio').map((persona) => persona.key), ['lakeshore-cio']);

const run: CrawlRun = {
  runId: 'smoke',
  baseUrl: 'https://app.abarva.ai',
  createdAt: '2026-05-24T00:00:00Z',
  observations: [{
    tenantKey: 'apexretail',
    expectedTenantName: 'Apex Retail Group',
    personaKey: 'apex-cfo',
    surfaceId: 'home',
    path: '/home',
    url: 'https://app.abarva.ai/home',
    visibleText: 'Apex Retail Group Heliara',
    consoleErrors: [],
    networkErrors: [],
    evidenceChipCount: 4,
    proofPointCount: 4,
    citationDensity: 0.1,
    hardQuestionExactFieldCitations: 2,
    watchlistTopEntries: [],
    visualCanon: { backgroundOk: true, headersOk: true, bodyOk: true, buttonsOk: true },
  }],
};

const comparison = compareCrawlToBaseline(run, null);
assert.equal(comparison.p0, 1);
assert.match(summarizeComparison(comparison), /1 P0/);
assert.equal(comparison.findings[0]?.dimension, 'tenant-leakage');

console.log('P21 smoke passed: personas, surface count, hard questions, and P0 tenant-leakage comparator are deterministic.');

#!/usr/bin/env node
/*
 * Verifies the generated Enterprise Read artifact for client-facing answer
 * quality. This is intentionally not a DB test: it checks the derived layer
 * contract before we publish/load it.
 */

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = process.cwd();
const DATASET_ROOTS = {
  'skyharbor-air': (version) => `datasets/skyharbor-air-synthetic-${version}`,
  'first-capital': (version) => `datasets/first-capital-financial-synthetic-${version}`,
  'meridian-health': (version) => `datasets/meridian-health-synthetic-${version}`,
  lakeshore: (version) => `datasets/lakeshore-industries-synthetic-${version}`,
  'apex-retail': (version) => `datasets/apex-retail-synthetic-${version}`,
};

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function fail(message, details = {}) {
  console.error(`RESULT_JSON ${JSON.stringify({ ok: false, error: message, ...details }, null, 2)}`);
  process.exit(1);
}

function requireIncludes(text, terms, label) {
  const lower = text.toLowerCase();
  const missing = terms.filter((term) => !lower.includes(term.toLowerCase()));
  if (missing.length) fail(`missing_${label}`, { missing });
}

function requireNotIncludes(text, terms, label) {
  const lower = text.toLowerCase();
  const found = terms.filter((term) => lower.includes(term.toLowerCase()));
  if (found.length) fail(`forbidden_${label}`, { found });
}

function verifyOne(client, version, explicitFile = null) {
  const root = DATASET_ROOTS[client]?.(version);
  if (!root) fail('unsupported_client', { client });
  const file = explicitFile || `${root}/derived-intelligence/enterprise-reads.json`;
  const abs = path.join(REPO_ROOT, file);
  if (!fs.existsSync(abs)) fail('enterprise_read_file_missing', { file });
  const payload = JSON.parse(fs.readFileSync(abs, 'utf8'));
  const read = payload.reads?.[0];
  if (!read) fail('no_reads_found', { file });

  const visibleAnswer = [
    read.headline,
    read.executiveSummary,
    read.currentStateRead?.architecturePattern,
    read.currentStateRead?.maturityRead,
    read.currentStateRead?.whatThisMeans,
    read.derivedInsights?.map((insight) => `${insight.headline} ${insight.soWhat}`).join('\n'),
    read.benchmarkRead?.northStar,
    read.benchmarkRead?.peerImplication,
    read.recommendedMoves?.map((move) => `${move.title} ${move.decision}`).join('\n'),
  ].filter(Boolean).join('\n\n');

  requireIncludes(visibleAnswer, [
    'data products',
    'peer',
    'governed',
    'evidence',
  ], 'shared_landscape_terms');

  requireIncludes(JSON.stringify(read.volumetrics), [
    'applicationsTotal',
    'dataProductsTotal',
    'integrationsTotal',
    'platformHighlights',
    'namedPlatformVolumetrics',
  ], 'volumetric_fields');

  requireNotIncludes(visibleAnswer, [
    'chunks',
    'graph edges',
    'raw facts',
    '6094',
    '5200',
    '55956',
  ], 'substrate_metrics_in_visible_answer');

  if (!read.sentinelAnswerContract?.mustNotLeadWith?.includes('chunk count')) {
    fail('missing_sentinel_contract_no_chunk_count');
  }

  if ((read.derivedInsights ?? []).length < 3) fail('too_few_derived_insights', { client, count: read.derivedInsights?.length ?? 0 });
  if ((read.matchedPatterns ?? []).length < 2) fail('too_few_matched_patterns', { client, count: read.matchedPatterns?.length ?? 0 });
  if ((read.recommendedMoves ?? []).length < 2) fail('too_few_recommended_moves', { client, count: read.recommendedMoves?.length ?? 0 });
  if ((read.volumetrics?.platformHighlights ?? []).length < 3) fail('too_few_platform_highlights', { client, count: read.volumetrics?.platformHighlights?.length ?? 0 });
  if (visibleAnswer.length < 1200) fail('visible_answer_too_thin', { client, visible_answer_chars: visibleAnswer.length });

  return {
    ok: true,
    client,
    version,
    file,
    read_id: read.readId,
    visible_answer_chars: visibleAnswer.length,
    insights: read.derivedInsights.length,
    matched_patterns: read.matchedPatterns.length,
    recommended_moves: read.recommendedMoves.length,
  };
}

function run() {
  const client = arg('--client', 'skyharbor-air');
  const version = arg('--version', 'v4');
  const explicitFile = arg('--file', null);
  const clients = client === 'all' ? Object.keys(DATASET_ROOTS) : [client];
  const results = clients.map((clientKey) => verifyOne(clientKey, version, clients.length === 1 ? explicitFile : null));
  console.log(`RESULT_JSON ${JSON.stringify({
    ok: true,
    version,
    clients: results,
  }, null, 2)}`);
}

try {
  run();
} catch (error) {
  fail('unexpected_error', { detail: error instanceof Error ? error.message : String(error) });
}

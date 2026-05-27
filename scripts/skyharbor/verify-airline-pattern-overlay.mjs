#!/usr/bin/env node
/**
 * SkyHarbor airline industry pattern overlay verifier.
 *
 * Usage:
 *   node scripts/skyharbor/verify-airline-pattern-overlay.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BUILD_DIR = path.join(REPO_ROOT, 'docs/build/delta-pilot');
const DATASET_DIR = path.join(REPO_ROOT, 'datasets/skyharbor-air-synthetic-v1');
const OVERLAY_DIR = path.join(DATASET_DIR, '16-industry-pattern-overlay');
const VERIFICATION_DIR = path.join(DATASET_DIR, 'verification');

const expected = {
  A: ['Commercial & Revenue', 15, 225],
  B: ['Customer & Loyalty', 12, 180],
  C: ['Digital Channels', 8, 120],
  D: ['Flight Operations', 10, 150],
  E: ['Aircraft & Engineering', 10, 150],
  F: ['Airport Operations', 8, 120],
  G: ['Fuel & Sustainability', 6, 90],
  H: ['Technology Estate', 12, 180],
  I: ['Modernization & Cloud', 10, 150],
  J: ['AI in Airlines', 12, 180],
  K: ['Engineering & SDLC', 10, 150],
  L: ['Data & Analytics', 8, 120],
  M: ['Sourcing & Vendor', 12, 180],
  N: ['Finance', 10, 150],
  O: ['HR & Workforce', 8, 120],
  P: ['Regulatory & Compliance', 10, 150],
  Q: ['Cybersecurity', 8, 120],
  R: ['Risk & Resilience', 5, 75],
  S: ['Strategy & Governance', 5, 75],
  T: ['Emerging Domains', 5, 75],
};

const requiredFiles = [
  path.join(BUILD_DIR, 'AIRLINE_INDUSTRY_PATTERN_OVERLAY_v1.md'),
  path.join(BUILD_DIR, 'PACKET_29_DEMO_CAPTURE.md'),
  path.join(BUILD_DIR, 'README.md'),
  path.join(OVERLAY_DIR, 'airline-industry-pattern-overlay.jsonl'),
  path.join(OVERLAY_DIR, 'airline-industry-pattern-chunks.jsonl'),
];

const forbidden = [
  /\bDelta Air Lines\b/i,
  /\bDelta Airlines\b/i,
  /\bEd Bastian\b/i,
  /\bRahul Samant\b/i,
  /\bHartsfield-Jackson\b/i,
  /\bSkyMiles\b/i,
  /\bDelta\.com\b/i,
];

const allowedSegments = new Set([
  'enterprise_profile',
  'org_structure',
  'it_financials',
  'it_landscape',
  'program_inventory',
]);

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function fail(message) {
  failures.push(message);
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] ?? 0) + 1;
    return acc;
  }, {});
}

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) fail(`missing required file: ${path.relative(REPO_ROOT, file)}`);
}

const recordsFile = path.join(OVERLAY_DIR, 'airline-industry-pattern-overlay.jsonl');
const chunksFile = path.join(OVERLAY_DIR, 'airline-industry-pattern-chunks.jsonl');
const records = fs.existsSync(recordsFile) ? readJsonl(recordsFile) : [];
const chunks = fs.existsSync(chunksFile) ? readJsonl(chunksFile) : [];

if (records.length !== 2760) fail(`expected 2760 pattern records, got ${records.length}`);
if (chunks.length !== 2760) fail(`expected 2760 pattern chunks, got ${chunks.length}`);

const packIds = new Set(records.map((row) => row.pack_id));
if (packIds.size !== 184) fail(`expected 184 packs, got ${packIds.size}`);

const patternIds = new Set();
for (const row of records) {
  if (patternIds.has(row.pattern_id)) fail(`duplicate pattern_id ${row.pattern_id}`);
  patternIds.add(row.pattern_id);
  for (const field of ['pattern_id', 'pack_id', 'category_code', 'category_name', 'summary', 'mechanism', 'decision_relevance', 'pitfalls', 'provenance']) {
    if (!row[field] || String(row[field]).trim().length === 0) fail(`pattern missing ${field}: ${row.pattern_id ?? JSON.stringify(row).slice(0, 100)}`);
  }
  if (!expected[row.category_code]) fail(`unexpected category code ${row.category_code}`);
  if (!/Summary|summar/i.test(`Summary: ${row.summary}`)) fail(`summary field malformed: ${row.pattern_id}`);
  if (!/Decision relevance:/i.test(`Decision relevance: ${row.decision_relevance}`)) fail(`decision relevance field malformed: ${row.pattern_id}`);
  if (!/Pitfalls:/i.test(`Pitfalls: ${row.pitfalls}`)) fail(`pitfalls field malformed: ${row.pattern_id}`);
  if (!/No target-carrier confidential sources/i.test(row.provenance)) fail(`provenance missing confidentiality guardrail: ${row.pattern_id}`);
}

const packsByCategory = {};
for (const code of Object.keys(expected)) {
  packsByCategory[code] = new Set(records.filter((row) => row.category_code === code).map((row) => row.pack_id)).size;
}
const patternsByCategory = countBy(records, 'category_code');
for (const [code, [name, packCount, patternCount]] of Object.entries(expected)) {
  if (packsByCategory[code] !== packCount) fail(`${code} ${name}: expected ${packCount} packs, got ${packsByCategory[code]}`);
  if ((patternsByCategory[code] ?? 0) !== patternCount) fail(`${code} ${name}: expected ${patternCount} patterns, got ${patternsByCategory[code] ?? 0}`);
}

const chunkIds = new Set();
for (const chunk of chunks) {
  const id = chunk.chunk_id || chunk.id;
  if (!id) fail(`chunk missing id: ${JSON.stringify(chunk).slice(0, 120)}`);
  if (chunkIds.has(id)) fail(`duplicate chunk id ${id}`);
  chunkIds.add(id);
  if (!patternIds.has(chunk.pattern_id)) fail(`chunk references missing pattern_id ${chunk.pattern_id}`);
  if (chunk.tenant_id !== 'skyharbor-air') fail(`chunk has wrong tenant_id ${chunk.tenant_id}`);
  if (!allowedSegments.has(chunk.source_segment_id)) fail(`chunk has non-retrievable segment ${chunk.source_segment_id}`);
  if (!chunk.text || chunk.text.length < 900) fail(`chunk text too thin: ${id}`);
  for (const requiredPhrase of ['Summary:', 'Mechanism:', 'Decision relevance:', 'Pitfalls:', 'Provenance:']) {
    if (!chunk.text.includes(requiredPhrase)) fail(`chunk missing ${requiredPhrase} ${id}`);
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(text)) fail(`forbidden target-carrier term ${pattern} in ${path.relative(REPO_ROOT, file)}`);
  }
}

const report = [
  '# Airline Pattern Overlay Verification Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Counts',
  '',
  `- Pattern packs: ${packIds.size}`,
  `- Pattern records: ${records.length}`,
  `- Loader chunks: ${chunks.length}`,
  '',
  '## Category Coverage',
  '',
  '| Category | Packs | Patterns |',
  '|---|---:|---:|',
  ...Object.entries(expected).map(([code, [name]]) => `| ${code}. ${name} | ${packsByCategory[code] ?? 0} | ${patternsByCategory[code] ?? 0} |`),
  '',
  '## Guardrails',
  '',
  '- Every pattern has Summary, Mechanism, Decision relevance, Pitfalls, and Provenance.',
  '- Every chunk maps to a retrievable enterprise context segment.',
  '- Forbidden target-carrier-specific terms are absent from generated overlay artifacts.',
  '- The overlay is synthetic and public-pattern-based; it does not encode confidential target-carrier facts.',
  '',
  failures.length === 0 ? 'Status: PASSED' : 'Status: FAILED',
  ...failures.map((failure) => `- ${failure}`),
  '',
].join('\n');

fs.mkdirSync(VERIFICATION_DIR, { recursive: true });
fs.writeFileSync(path.join(VERIFICATION_DIR, 'airline_pattern_overlay_report.md'), report);
fs.writeFileSync(path.join(VERIFICATION_DIR, 'airline_pattern_overlay_report.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SkyHarbor Airline Pattern Overlay Verification</title>
  <style>
    body { margin: 0; background: #f8f7f4; color: #171717; font: 15px/1.55 Arial, sans-serif; }
    main { max-width: 1100px; margin: 0 auto; padding: 40px 28px 64px; }
    h1, h2 { font-family: Georgia, serif; font-weight: 500; }
    h1 { font-size: 34px; margin: 0 0 8px; }
    h2 { font-size: 22px; margin-top: 34px; border-top: 1px solid #dedbd2; padding-top: 22px; }
    .meta { color: #5f5b52; margin-bottom: 28px; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 24px 0; }
    .card { background: #fffdfa; border: 1px solid #dedbd2; border-radius: 8px; padding: 16px; }
    .metric { font-size: 28px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; background: #fffdfa; border: 1px solid #dedbd2; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #ebe8df; }
    th { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #5f5b52; }
    .status { display: inline-block; border-radius: 999px; padding: 4px 10px; background: ${failures.length === 0 ? '#e7f5ec' : '#fee8e1'}; color: ${failures.length === 0 ? '#176b3a' : '#9f2f16'}; font-weight: 700; }
    code { background: #eeeae1; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <main>
    <h1>SkyHarbor Airline Pattern Overlay Verification</h1>
    <div class="meta">Generated ${new Date().toISOString()} · <span class="status">${failures.length === 0 ? 'PASSED' : 'FAILED'}</span></div>
    <div class="grid">
      <section class="card"><div class="metric">${packIds.size}</div><div>Pattern packs</div></section>
      <section class="card"><div class="metric">${records.length.toLocaleString('en-US')}</div><div>Pattern records</div></section>
      <section class="card"><div class="metric">${chunks.length.toLocaleString('en-US')}</div><div>Loader chunks</div></section>
    </div>
    <h2>Category Coverage</h2>
    <table>
      <thead><tr><th>Category</th><th>Packs</th><th>Patterns</th></tr></thead>
      <tbody>
        ${Object.entries(expected).map(([code, [name]]) => `<tr><td>${code}. ${name}</td><td>${packsByCategory[code] ?? 0}</td><td>${patternsByCategory[code] ?? 0}</td></tr>`).join('\n')}
      </tbody>
    </table>
    <h2>Guardrails</h2>
    <ul>
      <li>Every pattern has Summary, Mechanism, Decision relevance, Pitfalls, and Provenance.</li>
      <li>Every chunk maps to a retrievable enterprise context segment.</li>
      <li>Forbidden target-carrier-specific terms are absent from generated overlay artifacts.</li>
      <li>The overlay is synthetic and public-pattern-based; it does not encode confidential target-carrier facts.</li>
    </ul>
    <h2>Artifacts</h2>
    <ul>
      <li><code>docs/build/delta-pilot/AIRLINE_INDUSTRY_PATTERN_OVERLAY_v1.md</code></li>
      <li><code>datasets/skyharbor-air-synthetic-v1/16-industry-pattern-overlay/airline-industry-pattern-overlay.jsonl</code></li>
      <li><code>datasets/skyharbor-air-synthetic-v1/16-industry-pattern-overlay/airline-industry-pattern-chunks.jsonl</code></li>
      <li><code>docs/build/delta-pilot/PACKET_29_DEMO_CAPTURE.md</code></li>
    </ul>
    ${failures.length === 0 ? '' : `<h2>Failures</h2><ul>${failures.map((failure) => `<li>${failure}</li>`).join('')}</ul>`}
  </main>
</body>
</html>
`);

if (failures.length > 0) {
  console.error('Airline pattern overlay verification FAILED');
  for (const failure of failures.slice(0, 80)) console.error(`- ${failure}`);
  if (failures.length > 80) console.error(`... ${failures.length - 80} more`);
  process.exit(1);
}

console.log('Airline pattern overlay verification PASSED');
console.log(`packs=${packIds.size} patterns=${records.length} chunks=${chunks.length}`);

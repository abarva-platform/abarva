#!/usr/bin/env node
// Anthropic-only reasoning guard (Azure-native platform standard).
//
// HARD RULE: production reasoning/synthesis runs on Anthropic/Claude ONLY.
// OpenAI is permitted EXCLUSIVELY for non-reasoning utilities (embeddings,
// demo audio, ingestion/seed scripts) and the audited egress wrapper. Any other
// use of OpenAI — especially in a reasoning/answer path — fails this guard.
//
// Default-deny: every OpenAI marker found under src/ must fall into one of two
// allowlists, or the build fails:
//   1. ALLOWED_OPENAI_PATHS  — embedding/audio/ingestion/egress-wrapper zones.
//   2. KNOWN_LEGACY_REASONING — reasoning paths NOT YET converted; tracked debt
//      that must shrink to zero. A file here that no longer uses OpenAI also
//      fails (ratchet: remove it from the list).
//
// The deleted `openai-runtime` module may never be referenced again (no allowlist).
//
// Run: node scripts/guardrails/anthropic-only-reasoning.mjs
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

// OpenAI usage markers (import/SDK/key). Comments are excluded heuristically.
const OPENAI_MARKERS = [
  /from\s+['"]openai['"]/,
  /from\s+['"]@ai-sdk\/openai['"]/,
  /require\(\s*['"]openai['"]\s*\)/,
  /\bnew\s+OpenAI\s*\(/,
  /\bOPENAI_API_KEY\b/,
];
// `openai-runtime` is deleted — referencing it anywhere is always a failure.
const FORBIDDEN_ALWAYS = /openai-runtime/;

// OpenAI is allowed in these path prefixes (embeddings / audio / ingestion / egress wrapper).
const ALLOWED_OPENAI_PATHS = [
  'src/lib/integrations/ai-egress/',      // audited egress wrappers (incl. openai-direct)
  'src/lib/knowledge/',                   // vector embeddings for retrieval
  'src/scripts/',                         // embed/ingest/seed/QA scripts
  'src/lib/intelligence/persistence',     // embedding persistence helpers
];

// Reasoning paths NOT YET converted to Anthropic. MUST shrink to zero. Each entry
// is tracked debt; a new reasoning file using OpenAI is NOT allowed here.
const KNOWN_LEGACY_REASONING = [
  // Empty — every reasoning path is Anthropic-only. Do NOT add entries here;
  // convert the reasoning to the audited Anthropic client instead.
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      walk(p, out);
    } else if (/\.(ts|tsx|mjs|js)$/.test(entry.name) && !/\.(test|spec)\.[tj]sx?$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function strip(line) {
  // drop // line comments to avoid flagging prose; keep code before them
  const i = line.indexOf('//');
  return i >= 0 ? line.slice(0, i) : line;
}

function fileUsesOpenAI(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n').map(strip);
  const hits = [];
  lines.forEach((line, n) => {
    for (const m of OPENAI_MARKERS) if (m.test(line)) hits.push({ line: n + 1, marker: m.source });
  });
  return hits;
}

function isAllowedPath(r) {
  return ALLOWED_OPENAI_PATHS.some((prefix) => r.startsWith(prefix));
}

function main() {
  const files = walk(SRC);
  const violations = [];
  const legacyHit = new Set();
  const forbiddenRefs = [];

  for (const file of files) {
    const r = rel(file);
    const text = fs.readFileSync(file, 'utf8');
    if (FORBIDDEN_ALWAYS.test(text)) {
      // allow only this guard file itself (it names the string in comments)
      if (!r.endsWith('anthropic-only-reasoning.mjs')) forbiddenRefs.push(r);
    }
    const hits = fileUsesOpenAI(file);
    if (hits.length === 0) continue;
    if (isAllowedPath(r)) continue; // embedding/audio/ingestion/egress zone
    if (KNOWN_LEGACY_REASONING.includes(r)) { legacyHit.add(r); continue; }
    violations.push({ file: r, hits });
  }

  // Ratchet: a tracked-legacy file that no longer uses OpenAI must be removed from the list.
  const staleLegacy = KNOWN_LEGACY_REASONING.filter((f) => !legacyHit.has(f));

  let failed = false;
  if (forbiddenRefs.length) {
    failed = true;
    console.error('\n✗ Forbidden reference to deleted `openai-runtime`:');
    for (const r of forbiddenRefs) console.error(`   - ${r}`);
  }
  if (violations.length) {
    failed = true;
    console.error('\n✗ OpenAI used outside the allowed (embedding/audio) zones — reasoning must be Anthropic/Claude:');
    for (const v of violations) console.error(`   - ${v.file}  [lines ${v.hits.map((h) => h.line).join(', ')}]`);
    console.error('   Fix: move reasoning to the audited Anthropic client (getAuditedAnthropicClient), or');
    console.error('   if this is a genuine embedding/audio/ingestion use, add its path to ALLOWED_OPENAI_PATHS.');
  }
  if (staleLegacy.length) {
    failed = true;
    console.error('\n✗ Tracked-legacy file no longer uses OpenAI — remove it from KNOWN_LEGACY_REASONING (ratchet):');
    for (const r of staleLegacy) console.error(`   - ${r}`);
  }

  if (legacyHit.size) {
    console.warn(`\n⚠ Tracked OpenAI-reasoning debt (MUST convert to Anthropic), ${legacyHit.size} file(s):`);
    for (const r of legacyHit) console.warn(`   - ${r}`);
  }

  if (failed) {
    console.error('\nAnthropic-only reasoning guard FAILED.\n');
    process.exit(1);
  }
  console.log(`✓ Anthropic-only reasoning guard passed. Scanned ${files.length} files; ${legacyHit.size} tracked-legacy reasoning file(s) remain.`);
}

main();

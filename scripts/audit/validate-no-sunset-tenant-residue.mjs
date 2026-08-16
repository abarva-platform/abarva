#!/usr/bin/env node

/**
 * Fails when a sunset tenant is still referenced anywhere in the repository.
 *
 * A grep-based sweep cannot answer "is it all gone?", and this is why: 437 .xlsx, 50 .docx,
 * 7 .pptx and 9 .zip files live in this repo, and every one of them is a ZIP archive. Tenant
 * names sit inside `xl/worksheets/sheet1.xml`, `ppt/slides/slide1.xml` and `docProps/core.xml`
 * where no text search will ever find them. On the first run of this checker, 204 packed files
 * held sunset-tenant strings that every previous sweep had reported clean.
 *
 * So this scans four surfaces, not one:
 *
 *   1. paths        — file and directory names
 *   2. text         — contents of readable files
 *   3. archives     — the XML/CSV entries inside xlsx/xlsm/docx/pptx/zip
 *   4. pdf          — extracted text, when pdftotext is available
 *
 * Findings are grouped by category, because "delete everything" is the wrong answer for one of
 * them: release records and incident history are audit evidence. Deleting a record that
 * describes work done on a tenant destroys the trail that the governance model depends on, and
 * would break `release:check`. Those are reported separately as `history` and do not fail the
 * run — the rule is that no LIVE artifact may reference a sunset tenant, not that the past be
 * rewritten.
 *
 * Usage:
 *   node scripts/audit/validate-no-sunset-tenant-residue.mjs [--json] [--include-history]
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const AS_JSON = process.argv.includes('--json');
const INCLUDE_HISTORY = process.argv.includes('--include-history');

/** Tenants removed from service. Extend when another tenant is sunset. */
const SUNSET = [
  'apex-retail', 'apexretail', 'apex_retail',
  'first-capital', 'firstcapital', 'first_capital',
  'lakeshore-holdings', 'lakeshore-industries', 'lakeshore_holdings', 'lakeshore_industries',
  'northstar-clinical', 'northstar_clinical',
  'morgan-street', 'roosevelt-holdings', 'lakefront-capital',
];
const RE = new RegExp(SUNSET.map((s) => s.replace(/[-_]/g, '[-_ ]?')).join('|'), 'i');

/**
 * Paths whose purpose is to record what happened. These are audit evidence, not live
 * artifacts — a release record describing a tenant's retirement SHOULD name that tenant.
 */
const HISTORY = [
  /^docs\/releases\/records\//,
  /^docs\/codex-handoff\//,
  /^supabase\/migrations\//,
  /^migrations\//,
  /^scripts\/audit\/validate-no-sunset-tenant-residue\.mjs$/, // this file names them by design
];

/**
 * Configuration and infrastructure. Called out separately because this is the surface that
 * forklifts silently during an environment migration: a bicepparam naming a dead tenant will
 * happily provision a Postgres server and Container App for it in the new environment, and a
 * dispatchable workflow will happily load it. Code that references a dead tenant fails loudly;
 * config that does simply costs money and creates a tenant nobody meant to create.
 */
const CONFIG = [
  /^\.github\/workflows\//,
  /^infra\//,
  /^Dockerfile/,
  /^docker-compose/,
  /\.(bicep|bicepparam|tf|tfvars)$/,
  /^\.env/,
  /^supabase\/config/,
  /^(package\.json|vercel\.(json|ts)|next\.config\.[jt]s)$/,
];

const ARCHIVE_EXT = new Set(['.xlsx', '.xlsm', '.docx', '.pptx', '.zip']);
const SKIP_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.mp4']);

const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, maxBuffer: 1 << 28 })
  .toString().split('\n').filter(Boolean);

const isHistory = (rel) => HISTORY.some((re) => re.test(rel));

const findings = { config: [], paths: [], text: [], archives: [], pdf: [], history: [] };
const isConfig = (rel) => CONFIG.some((re) => re.test(rel));
const push = (cat, rel, detail) => {
  const bucket = isHistory(rel) ? 'history' : isConfig(rel) ? 'config' : cat;
  if (findings[bucket].some((f) => f.rel === rel)) return;
  findings[bucket].push({ rel, detail });
};

/** Read the entries of a ZIP-based container without a dependency, via the central directory. */
function archiveEntries(buf) {
  const out = [];
  // End of central directory record
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return out;
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n += 1) {
    if (off + 46 > buf.length || buf.readUInt32LE(off) !== 0x02014b50) break;
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    if (localOff + 30 <= buf.length && buf.readUInt32LE(localOff) === 0x04034b50) {
      const lnLen = buf.readUInt16LE(localOff + 26);
      const leLen = buf.readUInt16LE(localOff + 28);
      const start = localOff + 30 + lnLen + leLen;
      const raw = buf.subarray(start, start + compSize);
      let data = null;
      try {
        data = method === 0 ? raw : method === 8 ? zlib.inflateRawSync(raw) : null;
      } catch { data = null; }
      if (data) out.push([name, data]);
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

let scanned = { text: 0, archives: 0, pdf: 0 };
let pdftotext = true;

for (const rel of tracked) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  const ext = path.extname(rel).toLowerCase();

  // 1. path names — catches folders and filenames
  if (RE.test(rel)) push('paths', rel, rel);

  if (SKIP_EXT.has(ext)) continue;

  // 3. archives — the surface a text search cannot reach
  if (ARCHIVE_EXT.has(ext)) {
    scanned.archives += 1;
    try {
      const buf = fs.readFileSync(abs);
      for (const [name, data] of archiveEntries(buf)) {
        if (RE.test(data.toString('latin1'))) { push('archives', rel, name); break; }
      }
    } catch { /* unreadable container is reported by the path check if named */ }
    continue;
  }

  // 4. pdf — extracted text
  if (ext === '.pdf') {
    if (!pdftotext) continue;
    scanned.pdf += 1;
    try {
      const txt = execFileSync('pdftotext', [abs, '-'], { maxBuffer: 1 << 26 }).toString();
      if (RE.test(txt)) push('pdf', rel, 'pdf text');
    } catch (e) {
      if (/ENOENT/.test(String(e))) { pdftotext = false; }
    }
    continue;
  }

  // 2. text contents
  try {
    const st = fs.statSync(abs);
    if (st.size > 40 * 1024 * 1024) continue;
    scanned.text += 1;
    const body = fs.readFileSync(abs, 'latin1');
    const m = body.match(RE);
    if (m) push('text', rel, m[0]);
  } catch { /* unreadable */ }
}

const live = ['config', 'paths', 'text', 'archives', 'pdf'];
const liveCount = live.reduce((n, k) => n + findings[k].length, 0);

if (AS_JSON) {
  console.log(JSON.stringify({ scanned, findings }, null, 2));
} else {
  console.log(`scanned ${tracked.length} tracked files ` +
    `(${scanned.text} text, ${scanned.archives} archives, ${scanned.pdf} pdf)`);
  if (!pdftotext) console.log('  note: pdftotext unavailable — PDF text was NOT scanned');
  console.log('');
  for (const k of live) {
    const note = k === 'config' ? '   <- forklifts silently into a new environment' : '';
    console.log(`  ${k.padEnd(10)} ${String(findings[k].length).padStart(5)}${note}`);
  }
  console.log(`  ${'history'.padEnd(10)} ${String(findings.history.length).padStart(5)}   (audit evidence — not failed)`);

  for (const k of live) {
    if (!findings[k].length) continue;
    console.log(`\n${k.toUpperCase()} (${findings[k].length}):`);
    for (const f of findings[k].slice(0, 25)) {
      console.log(`  - ${f.rel}${f.detail && f.detail !== f.rel ? `  [${f.detail}]` : ''}`);
    }
    if (findings[k].length > 25) console.log(`  ... and ${findings[k].length - 25} more`);
  }
}

const failed = liveCount > 0 || (INCLUDE_HISTORY && findings.history.length > 0);
if (!AS_JSON) {
  console.log(failed
    ? `\nFAIL — ${liveCount} live artifact(s) still reference a sunset tenant.`
    : '\npass — no live artifact references a sunset tenant.');
}
process.exit(failed ? 1 : 0);

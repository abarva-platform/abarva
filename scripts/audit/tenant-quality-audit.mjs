#!/usr/bin/env node
/**
 * Tenant quality audit — Gate 3 (structural) + Gate 4 (semantic/quality
 * profiling) from the Client Data Operations Factory model, consolidated
 * into one reusable, tenant-generic script.
 *
 * Replaces doing this by hand per tenant (this session did it five separate
 * times: a 100%-SLA-breach-rate bug, a file-inventory undercount, a naming-
 * reconciliation gap, an org-structure depth check, an interview duplicate
 * scan) with one repeatable tool producing the same judgment every time.
 *
 * Reports three INDEPENDENT status dimensions per file — never collapsed
 * into one badge:
 *   - technical:        did it parse at all?
 *   - dataQuality:       is the content complete, non-placeholder, non-duplicated?
 *   - productUsability:  a synthesis, gated by both of the above plus depth
 *
 * Usage:
 *   node scripts/audit/tenant-quality-audit.mjs --tenant skyharbor-air
 *   node scripts/audit/tenant-quality-audit.mjs --tenant skyharbor-air --json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTRY_PATH = path.join(REPO_ROOT, 'datasets/tenant-inputs/tenant-input-registry.json');

const PLACEHOLDER_PATTERNS = [
  /^tbd$/i, /^unknown$/i, /^sample$/i, /^lorem ipsum/i, /^not_loaded$/i,
  /^owner to confirm$/i, /^tbc$/i, /^n\/a$/i, /^placeholder$/i, /^xxx+$/i,
];

// Standard provenance columns present across the Universal Template
// Standard v3 pack — excluded from completeness/placeholder scoring since
// they're metadata about the row, not business content.
const PROVENANCE_COLUMNS = new Set([
  'source_file', 'source_date', 'confidence', 'known_gaps', 'original_source_file',
  'original_packet', 'original_row_number', 'original_row_id', 'source_classification',
  'source_fingerprint', 'consolidation_rule_used', 'conflict_status', 'tenant_key',
  'generated_at', 'load_run_id', 'candidate_contract_version', 'source_row_id',
  'active_candidate_status', 'evidence_id', 'answer_basis', 'source_basis',
  'generation_method', 'truth_statement',
]);

// A file's base name (numeric/SA prefix stripped) maps to a
// quality-depth-rules.json minRows key. Files outside this pack (e.g.
// tenant-specific extensions like 20_itsm_ticket_sla_performance or
// 12b_interview_initiative_metric_crosswalk) simply skip the depth check —
// not every dataset needs a company-size-band expectation.
function depthRuleKey(fileBaseName) {
  const stripped = fileBaseName.replace(/^\d+[a-z]?_/, '').replace(/^SA\d+_.*$/, '');
  return stripped || null;
}

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
}

function readCsv(absPath) {
  const raw = fs.readFileSync(absPath, 'utf8');
  const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
  return { rows: parsed.data, errors: parsed.errors ?? [], columns: parsed.meta?.fields ?? [] };
}

// Deterministic n-gram duplicate check on narrative-heavy columns (avg
// length > 40 chars) — same approach used to verify the interview/ITSM
// datasets this session, generalized. Reports distinct recurring phrases
// and the share of rows affected, not a raw sliding-window instance count
// (which explodes for any phrase reused across many rows and isn't
// actionable — 129 rows sharing one phrase should read as "129 rows", not
// as a four-digit window-hit count).
function findDuplicatePhrases(values, n = 8) {
  const phraseToRows = new Map();
  values.forEach((text, rowIndex) => {
    const words = String(text).toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length < n) return;
    const phrasesInThisValue = new Set();
    for (let i = 0; i <= words.length - n; i++) {
      phrasesInThisValue.add(words.slice(i, i + n).join(' '));
    }
    for (const phrase of phrasesInThisValue) {
      if (!phraseToRows.has(phrase)) phraseToRows.set(phrase, new Set());
      phraseToRows.get(phrase).add(rowIndex);
    }
  });
  const recurringPhrases = [...phraseToRows.entries()].filter(([, rows]) => rows.size > 1);
  const affectedRows = new Set();
  for (const [, rows] of recurringPhrases) for (const r of rows) affectedRows.add(r);
  return {
    distinctRecurringPhrases: recurringPhrases.length,
    rowsAffected: affectedRows.size,
    totalRows: values.length,
    topPhrase: recurringPhrases.sort((a, b) => b[1].size - a[1].size)[0],
  };
}

function auditFile(absPath, fileBaseName, sizeBand, depthRules) {
  const result = {
    file: fileBaseName,
    technical: 'PASS',
    technicalNotes: [],
    dataQuality: 'PRODUCT_USABLE',
    dataQualityNotes: [],
    productUsability: 'PRODUCT_USABLE',
    rowCount: 0,
  };

  if (!fs.existsSync(absPath)) {
    result.technical = 'FAIL';
    result.technicalNotes.push('file not found');
    result.dataQuality = 'NOT_PROVIDED';
    result.productUsability = 'NOT_PROVIDED';
    return result;
  }

  let parsed;
  try {
    parsed = readCsv(absPath);
  } catch (error) {
    result.technical = 'FAIL';
    result.technicalNotes.push(`parse error: ${error.message}`);
    result.dataQuality = 'NOT_USABLE';
    result.productUsability = 'NOT_USABLE';
    return result;
  }

  const { rows, errors, columns } = parsed;
  result.rowCount = rows.length;

  if (errors.length > 0) {
    result.technicalNotes.push(`${errors.length} parse warnings`);
  }
  if (columns.length === 0) {
    result.technical = 'FAIL';
    result.technicalNotes.push('no header row');
    result.dataQuality = 'NOT_USABLE';
    result.productUsability = 'NOT_USABLE';
    return result;
  }
  if (rows.length === 0) {
    result.technical = 'FAIL';
    result.technicalNotes.push('zero data rows');
    result.dataQuality = 'NOT_USABLE';
    result.productUsability = 'NOT_USABLE';
    return result;
  }

  // --- Depth check against quality-depth-rules.json ---
  const ruleKey = depthRuleKey(fileBaseName);
  const minRows = ruleKey ? depthRules?.companySizeBands?.[sizeBand]?.minRows?.[ruleKey] : null;
  const qualityFlags = [];
  if (minRows != null) {
    if (rows.length < minRows) {
      qualityFlags.push(`below depth floor: ${rows.length} rows vs ${minRows} minimum for ${sizeBand}`);
    }
  }

  // --- Completeness: fill rate on non-provenance columns ---
  const businessColumns = columns.filter((c) => !PROVENANCE_COLUMNS.has(c));
  const columnFillRates = {};
  for (const col of businessColumns) {
    const filled = rows.filter((r) => (r[col] ?? '').toString().trim().length > 0).length;
    columnFillRates[col] = filled / rows.length;
  }
  const deadColumns = businessColumns.filter((c) => columnFillRates[c] === 0);
  const thinColumns = businessColumns.filter((c) => columnFillRates[c] > 0 && columnFillRates[c] < 0.5);
  if (deadColumns.length > 0) {
    qualityFlags.push(`${deadColumns.length} column(s) always empty: ${deadColumns.slice(0, 5).join(', ')}${deadColumns.length > 5 ? '…' : ''}`);
  }
  if (thinColumns.length > businessColumns.length * 0.3) {
    qualityFlags.push(`${thinColumns.length}/${businessColumns.length} columns under 50% filled`);
  }

  // --- Placeholder rejection ---
  let placeholderCells = 0;
  let totalCells = 0;
  for (const col of businessColumns) {
    for (const row of rows) {
      const value = (row[col] ?? '').toString().trim();
      if (!value) continue;
      totalCells++;
      if (PLACEHOLDER_PATTERNS.some((p) => p.test(value))) placeholderCells++;
    }
  }
  const placeholderRate = totalCells > 0 ? placeholderCells / totalCells : 0;
  if (placeholderRate > 0.02) {
    qualityFlags.push(`${(placeholderRate * 100).toFixed(1)}% of filled cells are placeholder values (TBD/unknown/etc.)`);
  }

  // --- Duplicate/narrative check on long-text columns ---
  const narrativeColumns = businessColumns.filter((c) => {
    const lengths = rows.map((r) => (r[c] ?? '').toString().length).filter((l) => l > 0);
    if (lengths.length === 0) return false;
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    return avg > 40;
  });
  let maxRowsAffectedShare = 0;
  let worstColumnNote = null;
  for (const col of narrativeColumns) {
    const dup = findDuplicatePhrases(rows.map((r) => r[col] ?? ''));
    if (dup.distinctRecurringPhrases === 0) continue;
    const share = dup.rowsAffected / dup.totalRows;
    if (share > maxRowsAffectedShare) {
      maxRowsAffectedShare = share;
      worstColumnNote = `${col}: ${dup.rowsAffected}/${dup.totalRows} rows (${(share * 100).toFixed(0)}%) share a recurring 8+-word phrase — e.g. "${dup.topPhrase?.[0] ?? ''}" appears in ${dup.topPhrase?.[1]?.size ?? 0} rows`;
    }
  }
  // Templated long-tail content is a known, accepted characteristic of this
  // pack (documented in prior release records) up to a point — flag only
  // when it affects a large enough share of rows to be a real product-
  // usability concern, not any recurrence at all.
  if (maxRowsAffectedShare > 0.15) {
    qualityFlags.push(worstColumnNote);
  }

  // --- Self-referential integrity: only for known column pairs ---
  if (columns.includes('org_unit') && columns.includes('parent_org_unit')) {
    const orgUnits = new Set(rows.map((r) => r.org_unit).filter(Boolean));
    const orphans = rows.filter((r) => r.parent_org_unit && !orgUnits.has(r.parent_org_unit));
    if (orphans.length > 0) {
      qualityFlags.push(`${orphans.length} row(s) with parent_org_unit not resolving to any org_unit in this file`);
    }
  }

  result.dataQualityNotes = qualityFlags;

  // --- Synthesize status ---
  const severity = qualityFlags.length;
  if (severity === 0) {
    result.dataQuality = 'PRODUCT_USABLE';
  } else if (severity <= 2 && placeholderRate < 0.1) {
    result.dataQuality = 'USABLE_WITH_LIMITATIONS';
  } else {
    result.dataQuality = 'NEEDS_REPAIR';
  }

  result.productUsability = result.technical === 'PASS' ? result.dataQuality : 'NOT_USABLE';
  return result;
}

function main() {
  const argv = process.argv.slice(2);
  const tenantIdx = argv.indexOf('--tenant');
  if (tenantIdx === -1 || !argv[tenantIdx + 1]) {
    console.error('usage: node scripts/audit/tenant-quality-audit.mjs --tenant <key> [--json]');
    process.exit(1);
  }
  const tenantKey = argv[tenantIdx + 1];
  const jsonOutput = argv.includes('--json');

  const registry = readJson(REGISTRY_PATH);
  const tenant = registry.activeTenants?.find((t) => t.tenantKey === tenantKey);
  if (!tenant) {
    console.error(`Tenant "${tenantKey}" not found in ${REGISTRY_PATH}. Known: ${registry.activeTenants?.map((t) => t.tenantKey).join(', ')}`);
    process.exit(1);
  }

  const canonicalRoot = path.join(REPO_ROOT, tenant.canonicalInputRoot);
  const sizeBand = tenant.companySizeBand;
  const depthRulesPath = path.join(REPO_ROOT, registry.universalTemplateSet.qualityDepthRules);
  const depthRules = fs.existsSync(depthRulesPath) ? readJson(depthRulesPath) : null;

  const files = fs.readdirSync(canonicalRoot).filter((f) => f.endsWith('.csv')).sort();
  const results = files.map((f) => {
    const baseName = f.replace(/\.csv$/, '');
    return auditFile(path.join(canonicalRoot, f), baseName, sizeBand, depthRules);
  });

  if (jsonOutput) {
    console.log(JSON.stringify({ tenantKey, canonicalInputRoot: tenant.canonicalInputRoot, sizeBand, files: results }, null, 2));
    return;
  }

  console.log(`Tenant quality audit — ${tenantKey} (${sizeBand})`);
  console.log(`  source: ${tenant.canonicalInputRoot}`);
  console.log('');
  const statusOrder = { NOT_USABLE: 0, NEEDS_REPAIR: 1, USABLE_WITH_LIMITATIONS: 2, PRODUCT_USABLE: 3, NOT_PROVIDED: -1 };
  for (const r of results.sort((a, b) => statusOrder[a.productUsability] - statusOrder[b.productUsability])) {
    console.log(`  ${r.file} (${r.rowCount} rows)`);
    console.log(`    technical=${r.technical}  dataQuality=${r.dataQuality}  productUsability=${r.productUsability}`);
    for (const note of r.technicalNotes) console.log(`    ⚠ ${note}`);
    for (const note of r.dataQualityNotes) console.log(`    ⚠ ${note}`);
  }
  console.log('');
  const summary = results.reduce((acc, r) => {
    acc[r.productUsability] = (acc[r.productUsability] ?? 0) + 1;
    return acc;
  }, {});
  console.log('Summary:', JSON.stringify(summary));
  const blockers = results.filter((r) => r.productUsability === 'NOT_USABLE' || r.productUsability === 'NEEDS_REPAIR');
  if (blockers.length > 0) {
    console.log('');
    console.log(`${blockers.length} file(s) need attention before this tenant's data is called product-ready:`);
    for (const b of blockers) console.log(`  - ${b.file}: ${b.productUsability}`);
    process.exitCode = 1;
  }
}

main();

// Migration idempotency audit. Flags risky patterns per file.
// Patterns checked:
//   CP   · CREATE POLICY without preceding DROP POLICY IF EXISTS (anywhere in file)
//   CT   · CREATE TRIGGER without preceding DROP TRIGGER IF EXISTS (anywhere in file)
//   CTAB · CREATE TABLE without IF NOT EXISTS
//   CI   · CREATE [UNIQUE] INDEX without IF NOT EXISTS
//   AC   · ALTER TABLE ... ADD CONSTRAINT outside a DO/EXCEPTION block
//   ACOL · ALTER TABLE ... ADD COLUMN without IF NOT EXISTS
//   INS  · INSERT INTO without ON CONFLICT or NOT EXISTS guard
//   CTYPE· CREATE TYPE without DO/EXCEPTION wrapper

import fs from 'node:fs';
import path from 'node:path';

const dir = 'supabase/migrations';
const SKIP = new Set([
  // Already audited tonight
  '013_engagement_state.sql',
  '019_per_user_rls.sql',
  '020_clients_and_invoices.sql',
  '041_programs_foundation.sql',
  '042_engagements_six_phases.sql',
]);

const files = fs.readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .filter((f) => !SKIP.has(f) && !f.startsWith('20260420'));

function auditOne(content) {
  const issues = [];

  // 1 · CREATE POLICY count vs DROP POLICY IF EXISTS count
  const createPolicies = (content.match(/^\s*CREATE POLICY\s+/gim) ?? []).length;
  const dropPolicies = (content.match(/^\s*DROP POLICY IF EXISTS\s+/gim) ?? []).length;
  if (createPolicies > dropPolicies) {
    issues.push({ key: 'CP', count: createPolicies, dropped: dropPolicies, severity: 'high' });
  }

  // 2 · CREATE TRIGGER vs DROP TRIGGER IF EXISTS
  const createTriggers = (content.match(/^\s*CREATE TRIGGER\s+/gim) ?? []).length;
  const dropTriggers = (content.match(/^\s*DROP TRIGGER IF EXISTS\s+/gim) ?? []).length;
  if (createTriggers > dropTriggers) {
    issues.push({ key: 'CT', count: createTriggers, dropped: dropTriggers, severity: 'high' });
  }

  // 3 · CREATE TABLE without IF NOT EXISTS
  const ctabBad = (content.match(/^\s*CREATE TABLE\s+(?!IF NOT EXISTS)/gim) ?? []).length;
  if (ctabBad > 0) issues.push({ key: 'CTAB', count: ctabBad, severity: 'high' });

  // 4 · CREATE INDEX without IF NOT EXISTS
  const ciBad = (content.match(/^\s*CREATE\s+(UNIQUE\s+)?INDEX\s+(?!IF NOT EXISTS)/gim) ?? []).length;
  if (ciBad > 0) issues.push({ key: 'CI', count: ciBad, severity: 'medium' });

  // 5 · ADD CONSTRAINT outside DO/EXCEPTION block
  // Heuristic: count ADD CONSTRAINT not on a line starting with whitespace+ALTER inside a DO $$
  const addConstraintLines = content.split('\n').reduce((acc, line, i, arr) => {
    if (!/ADD CONSTRAINT\s+/i.test(line)) return acc;
    // Look back up to 5 lines for DO $$ opener
    const window = arr.slice(Math.max(0, i - 5), i + 1).join('\n');
    if (/DO\s*\$\$/.test(window)) return acc;
    acc.push(line.trim());
    return acc;
  }, []);
  if (addConstraintLines.length > 0) issues.push({ key: 'AC', count: addConstraintLines.length, severity: 'medium' });

  // 6 · ADD COLUMN without IF NOT EXISTS
  const acolBad = (content.match(/ADD COLUMN\s+(?!IF NOT EXISTS)[a-z_"]/gim) ?? []).length;
  if (acolBad > 0) issues.push({ key: 'ACOL', count: acolBad, severity: 'high' });

  // 7 · INSERT INTO without ON CONFLICT / WHERE NOT EXISTS / SELECT 1 FROM
  // Approximate: inserts that don't have ON CONFLICT or NOT EXISTS within 30 lines after
  const insertMatches = [...content.matchAll(/^\s*INSERT INTO\s+(\w+)/gim)];
  let insBad = 0;
  for (const m of insertMatches) {
    const tail = content.slice(m.index, m.index + 2000);
    const stmtEnd = tail.indexOf(';');
    const stmt = stmtEnd > -1 ? tail.slice(0, stmtEnd) : tail;
    if (!/ON CONFLICT|WHERE NOT EXISTS|SELECT 1 FROM/i.test(stmt)) insBad += 1;
  }
  if (insBad > 0) issues.push({ key: 'INS', count: insBad, severity: 'high' });

  // 8 · CREATE TYPE not wrapped in DO/EXCEPTION
  const typeMatches = [...content.matchAll(/^\s*CREATE TYPE\s+/gim)];
  let typeBad = 0;
  for (const m of typeMatches) {
    const window = content.slice(Math.max(0, m.index - 200), m.index);
    if (!/DO\s*\$\$/.test(window)) typeBad += 1;
  }
  if (typeBad > 0) issues.push({ key: 'CTYPE', count: typeBad, severity: 'high' });

  return issues;
}

let totalHigh = 0;
let totalMedium = 0;
const report = [];
for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), 'utf-8');
  const issues = auditOne(content);
  if (issues.length === 0) continue;
  report.push({ file: f, issues });
  for (const i of issues) {
    if (i.severity === 'high') totalHigh += i.count;
    else totalMedium += i.count;
  }
}

console.log(`Audited ${files.length} files · ${report.length} have issues`);
console.log(`Total: ${totalHigh} high-severity · ${totalMedium} medium-severity\n`);
for (const r of report) {
  console.log(`${r.file}`);
  for (const i of r.issues) {
    const counts = i.dropped !== undefined ? `${i.count} create / ${i.dropped} drop` : `${i.count}`;
    console.log(`  · ${i.key}(${counts}) [${i.severity}]`);
  }
  console.log('');
}

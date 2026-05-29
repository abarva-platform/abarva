#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const RUNTIME_DIRS = ['src/app', 'src/lib'];
const EXCLUDE_PARTS = new Set(['__tests__', '__mocks__']);
const IMPORT_RE = /@supabase|supabase-server|createServerSupabase|createServiceRoleClient|createRouteHandlerClient|getServerSupabase/g;
const BROAD_RE = /@supabase|supabase-js|supabase-server|createServerSupabase|createServiceRoleClient|createRouteHandlerClient|getServerSupabase|\.from\s*\(/g;
const fail = process.argv.includes('--fail');

function argValue(name) {
  const prefix = `${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix));
  return raw ? raw.slice(prefix.length) : null;
}

function numericArg(name) {
  const raw = argValue(name);
  if (raw === null) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid ${name}: ${raw}`);
  }
  return value;
}

const maxFiles = numericArg('--max-files');
const maxImportMatches = numericArg('--max-import-matches');
const allowlistPath = argValue('--allowlist');

function loadAllowlist(filePath) {
  if (!filePath) return null;
  const fullPath = path.resolve(ROOT, filePath);
  const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const files = Array.isArray(parsed.files) ? parsed.files : [];
  return new Set(files);
}

const allowlist = loadAllowlist(allowlistPath);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (entry.isDirectory()) {
      if (EXCLUDE_PARTS.has(entry.name)) continue;
      out.push(...walk(full));
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) continue;
    if (/\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) continue;
    out.push(rel);
  }
  return out;
}

function countMatches(text, pattern) {
  pattern.lastIndex = 0;
  return Array.from(text.matchAll(pattern)).length;
}

const files = RUNTIME_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
const rows = files
  .map((file) => {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    return {
      file,
      importMatches: countMatches(text, IMPORT_RE),
      broadMatches: countMatches(text, BROAD_RE),
    };
  })
  .filter((row) => row.importMatches > 0 || row.broadMatches > 0)
  .sort((a, b) => b.importMatches - a.importMatches || b.broadMatches - a.broadMatches || a.file.localeCompare(b.file));

const summary = {
  generatedAt: new Date().toISOString(),
  mode: fail ? 'fail' : 'warn',
  scannedDirs: RUNTIME_DIRS,
  thresholds: {
    maxFiles,
    maxImportMatches,
    allowlist: allowlistPath,
  },
  filesWithImportMatches: rows.filter((row) => row.importMatches > 0).length,
  importMatches: rows.reduce((sum, row) => sum + row.importMatches, 0),
  filesWithBroadMatches: rows.length,
  broadMatches: rows.reduce((sum, row) => sum + row.broadMatches, 0),
  topFiles: rows.slice(0, 25),
};

const importRows = rows.filter((row) => row.importMatches > 0);
const allowlistViolations = allowlist
  ? importRows.filter((row) => !allowlist.has(row.file))
  : [];

console.log(JSON.stringify(summary, null, 2));

const warning = `Runtime Supabase import census: ${summary.filesWithImportMatches} files / ${summary.importMatches} import-helper matches; ${summary.filesWithBroadMatches} files / ${summary.broadMatches} broad matches.`;
if (process.env.GITHUB_ACTIONS) {
  console.log(`::warning title=Packet 30 Phase 2 Supabase runtime census::${warning}`);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    fs.appendFileSync(summaryPath, [
      '## Packet 30 Phase 2 Supabase Runtime Census',
      '',
      `- Mode: \`${summary.mode}\``,
      `- Files with import-helper matches: **${summary.filesWithImportMatches}**`,
      `- Import-helper matches: **${summary.importMatches}**`,
      `- Max files: **${maxFiles ?? 'not set'}**`,
      `- Max import-helper matches: **${maxImportMatches ?? 'not set'}**`,
      `- Allowlist: \`${allowlistPath ?? 'not set'}\``,
      `- Files with broad matches: **${summary.filesWithBroadMatches}**`,
      `- Broad matches: **${summary.broadMatches}**`,
      '',
    ].join('\n'));
  }
} else {
  console.warn(`[warn] ${warning}`);
}

if (fail) {
  const failures = [];
  if (maxFiles === null && maxImportMatches === null && !allowlist) {
    if (summary.filesWithImportMatches > 0) {
      failures.push('runtime Supabase helper matches remain');
    }
  }
  if (maxFiles !== null && summary.filesWithImportMatches > maxFiles) {
    failures.push(`filesWithImportMatches ${summary.filesWithImportMatches} exceeds ${maxFiles}`);
  }
  if (maxImportMatches !== null && summary.importMatches > maxImportMatches) {
    failures.push(`importMatches ${summary.importMatches} exceeds ${maxImportMatches}`);
  }
  if (allowlistViolations.length > 0) {
    failures.push(`matches outside allowlist: ${allowlistViolations.map((row) => row.file).join(', ')}`);
  }
  if (failures.length > 0) {
    for (const failure of failures) console.error(`[fail] ${failure}`);
    process.exit(1);
  }
}

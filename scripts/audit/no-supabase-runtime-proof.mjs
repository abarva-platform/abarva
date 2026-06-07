#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const RUNTIME_DIRS = ['src/app', 'src/lib'];
const EXCLUDE_PARTS = new Set(['__tests__', '__mocks__']);
const RUNTIME_EXT_RE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/;

const COMPAT_FILE = 'src/lib/supabase-server.ts';
const BOOT_GUARD_FILE = 'src/lib/runtime/supabaseBootGuard.ts';
const INSTRUMENTATION_FILE = 'src/instrumentation.ts';

const SUPABASE_ENV_NAMES = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const SUPABASE_HOST_MARKERS = ['supabase.co', 'pooler.supabase.com'];

const ENV_AND_HOST_ALLOWLIST = new Set([BOOT_GUARD_FILE]);

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(ROOT, fullPath);
    if (entry.isDirectory()) {
      if (EXCLUDE_PARTS.has(entry.name)) continue;
      out.push(...walk(fullPath));
      continue;
    }
    if (!RUNTIME_EXT_RE.test(entry.name)) continue;
    if (TEST_FILE_RE.test(entry.name)) continue;
    out.push(relativePath);
  }
  return out.sort();
}

function collectMatches(text, pattern) {
  pattern.lastIndex = 0;
  return Array.from(text.matchAll(pattern)).map((match) => match[0]);
}

function runImportAllowlistGuard() {
  const result = spawnSync(
    process.execPath,
    [
      'scripts/audit/runtime-supabase-import-census.mjs',
      '--fail',
      '--max-files=1',
      '--max-import-matches=1',
      '--allowlist=scripts/audit/runtime-supabase-import-allowlist.json',
    ],
    {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  return {
    ok: result.status === 0,
    exitCode: result.status,
    signal: result.signal,
  };
}

function checkRuntimeDependencies() {
  const packageJson = JSON.parse(readText('package.json'));
  const sections = ['dependencies', 'optionalDependencies', 'peerDependencies'];
  const violations = [];

  for (const section of sections) {
    const deps = packageJson[section] ?? {};
    for (const name of Object.keys(deps)) {
      if (name === 'supabase' || name.startsWith('@supabase/')) {
        violations.push(`${section}.${name}`);
      }
    }
  }

  return violations;
}

function checkRuntimeSource() {
  const files = RUNTIME_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
  const violations = [];

  const supabasePackageImportRe =
    /\b(?:import|export)\b[^'"]*from\s*['"]@supabase\/[^'"]+['"]|import\s*\(\s*['"]@supabase\/[^'"]+['"]\s*\)|require\s*\(\s*['"]@supabase\/[^'"]+['"]\s*\)/g;
  const supabaseEnvAccessRe =
    /process\.env(?:\.(?:NEXT_PUBLIC_SUPABASE_[A-Z0-9_]+|SUPABASE_[A-Z0-9_]+)|\[\s*['"](?:NEXT_PUBLIC_SUPABASE_[A-Z0-9_]+|SUPABASE_[A-Z0-9_]+)['"]\s*\])/g;
  const supabaseEnvLiteralRe = new RegExp(
    String.raw`['"](?:${SUPABASE_ENV_NAMES.join('|')})['"]`,
    'g',
  );
  const supabaseHostLiteralRe = new RegExp(
    SUPABASE_HOST_MARKERS.map((marker) => marker.replaceAll('.', String.raw`\\.`)).join('|'),
    'gi',
  );

  for (const file of files) {
    const text = readText(file);
    const packageImports = collectMatches(text, supabasePackageImportRe);
    if (packageImports.length > 0) {
      violations.push({
        file,
        rule: 'no-runtime-supabase-sdk-import',
        matches: packageImports,
      });
    }

    if (!ENV_AND_HOST_ALLOWLIST.has(file)) {
      const envAccesses = collectMatches(text, supabaseEnvAccessRe);
      if (envAccesses.length > 0) {
        violations.push({
          file,
          rule: 'no-runtime-supabase-env-access',
          matches: envAccesses,
        });
      }

      const envLiterals = collectMatches(text, supabaseEnvLiteralRe);
      if (envLiterals.length > 0) {
        violations.push({
          file,
          rule: 'no-runtime-supabase-env-literals',
          matches: envLiterals,
        });
      }

      const hostLiterals = collectMatches(text, supabaseHostLiteralRe);
      if (hostLiterals.length > 0) {
        violations.push({
          file,
          rule: 'no-runtime-supabase-host-literals',
          matches: hostLiterals,
        });
      }
    }
  }

  return {
    filesScanned: files.length,
    violations,
  };
}

function checkCompatibilityShim() {
  const text = readText(COMPAT_FILE);
  const violations = [];

  if (/@supabase\//.test(text)) {
    violations.push(`${COMPAT_FILE} imports a Supabase package`);
  }
  if (/process\.env/.test(text)) {
    violations.push(`${COMPAT_FILE} reads process.env directly`);
  }
  if (!/getAzureReadFluentClient/.test(text)) {
    violations.push(`${COMPAT_FILE} does not reference getAzureReadFluentClient`);
  }
  if (!/from\s+['"]\.\/data-plane\/postgresCompat['"]/.test(text)) {
    violations.push(`${COMPAT_FILE} does not import the Postgres compat layer`);
  }
  if (!/export\s+function\s+getServerSupabase\(\)\s*:\s*PostgresCompatClient\s*\{\s*return\s+getAzureReadFluentClient\(\);\s*\}/m.test(text)) {
    violations.push(`${COMPAT_FILE} no longer proves getServerSupabase delegates directly to Postgres`);
  }

  return violations;
}

function checkBootGuardWiring() {
  const bootGuard = readText(BOOT_GUARD_FILE);
  const instrumentation = readText(INSTRUMENTATION_FILE);
  const violations = [];

  for (const name of SUPABASE_ENV_NAMES) {
    if (!bootGuard.includes(name)) {
      violations.push(`${BOOT_GUARD_FILE} does not check ${name}`);
    }
  }

  for (const marker of SUPABASE_HOST_MARKERS) {
    if (!bootGuard.includes(marker)) {
      violations.push(`${BOOT_GUARD_FILE} does not check ${marker}`);
    }
  }

  if (!bootGuard.includes('process.env.NODE_ENV !== "production"')) {
    violations.push(`${BOOT_GUARD_FILE} no longer scopes enforcement to production`);
  }
  if (!bootGuard.includes('process.env.ABARVA_DATA_PLANE !== "azure-postgres"')) {
    violations.push(`${BOOT_GUARD_FILE} no longer scopes enforcement to the Azure Postgres runtime`);
  }
  if (!instrumentation.includes('assertNoSupabaseRuntime')) {
    violations.push(`${INSTRUMENTATION_FILE} does not call assertNoSupabaseRuntime`);
  }

  return violations;
}

function appendGithubSummary(report) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  const status = report.ok ? 'PASS' : 'FAIL';
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
    '## No-Supabase Runtime Proof',
    '',
    `- Status: **${status}**`,
    `- Runtime files scanned: **${report.runtimeSource.filesScanned}**`,
    `- Production dependency violations: **${report.runtimeDependencyViolations.length}**`,
    `- Runtime source violations: **${report.runtimeSource.violations.length}**`,
    `- Compatibility shim violations: **${report.compatibilityShimViolations.length}**`,
    `- Boot guard wiring violations: **${report.bootGuardWiringViolations.length}**`,
    '',
  ].join('\n'));
}

const importAllowlistGuard = runImportAllowlistGuard();
const runtimeDependencyViolations = checkRuntimeDependencies();
const runtimeSource = checkRuntimeSource();
const compatibilityShimViolations = checkCompatibilityShim();
const bootGuardWiringViolations = checkBootGuardWiring();

const report = {
  ok:
    importAllowlistGuard.ok &&
    runtimeDependencyViolations.length === 0 &&
    runtimeSource.violations.length === 0 &&
    compatibilityShimViolations.length === 0 &&
    bootGuardWiringViolations.length === 0,
  kind: 'no-supabase-runtime-proof',
  generatedAt: new Date().toISOString(),
  importAllowlistGuard,
  runtimeDependencyViolations,
  runtimeSource,
  compatibilityShimViolations,
  bootGuardWiringViolations,
};

console.log(JSON.stringify(report, null, 2));
appendGithubSummary(report);

if (!report.ok) {
  console.error('\nFAIL: runtime Supabase proof failed. See report above.');
  process.exit(1);
}

console.log('\nPASS: runtime code is proven free of direct Supabase SDK/env usage.');

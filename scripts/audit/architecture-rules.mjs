#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();

const CODE_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs|json|yml|yaml|sh|sql)$/;
const DOC_OR_EVIDENCE_RE = /^(docs|reports|audit-artifacts|test-results)\//;
const GENERATED_OR_VENDOR_RE = /^(node_modules|\.next|coverage|dist|build|out)\//;
const ALWAYS_ALLOW_RE = /^(scripts\/audit\/architecture-rules\.mjs|scripts\/audit\/runtime-supabase-import-|docs\/releases\/records\/|AGENTS\.md|\.github\/pull_request_template\.md|\.github\/copilot-instructions\.md)/;
const LEGACY_ONLY_RE = /^(supabase\/migrations\/|scripts\/codemods\/|scripts\/migration\/|src\/lib\/supabase-server\.ts$)/;
const TEST_RE = /(^|\/)(__tests__|__mocks__|fixtures)(\/|$)|\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/;

const RUNTIME_RE = /^(src\/app|src\/components|src\/lib|src\/middleware|middleware\.ts|package\.json|\.github\/workflows|Dockerfile|next\.config|instrumentation\.ts)/;
const ANSWER_GENERATION_RE =
  /^(src\/app\/api\/chat|src\/app\/api\/reasoning|src\/app\/api\/programs|src\/app\/api\/tower|src\/app\/api\/v1\/source|src\/lib\/intelligence|src\/lib\/sentinel|src\/lib\/nexus|src\/lib\/agents|src\/lib\/programs|src\/components\/intelligence|src\/components\/strategic-moves)/;
const MODEL_GATEWAY_ALLOW_RE = /^src\/lib\/integrations\/ai-egress\/(anthropic-direct|anthropic-prompt-cache|types|policy|tenant-policy|audit|index)\.ts$/;
const SUPABASE_DENYLIST_ALLOW_RE = /^scripts\/verify-canonical-tenants\.ts$/;

const RULES = [
  {
    id: 'NO_SUPABASE_RUNTIME',
    description: 'Runtime code must use Azure/Postgres adapters; no new Supabase runtime dependency, env, fallback, or host.',
    appliesTo(file) {
      return RUNTIME_RE.test(file) || file.startsWith('scripts/');
    },
    matches(line) {
      return /@supabase\/supabase-js|supabase-js|supabase-server|getServerSupabase|createServerSupabase|createServiceRoleClient|createRouteHandlerClient|NEXT_PUBLIC_SUPABASE_|SUPABASE_SERVICE_ROLE_KEY|ALLOW_LEGACY_SUPABASE_CORPUS|pooler\.supabase\.com|supabase\.co|xtbymdryojmvoulaotce/i.test(line);
    },
  },
  {
    id: 'NO_OPENAI_PRODUCTION_REASONING',
    description: 'Production Sentinel/Nexus/Source/Tower answer generation must use audited Anthropic/Claude, not OpenAI.',
    appliesTo(file) {
      return ANSWER_GENERATION_RE.test(file);
    },
    matches(line) {
      return /OPENAI_API_KEY|from\s+['"]openai['"]|require\(['"]openai['"]\)|new\s+OpenAI\b|provider:\s*['"]openai['"]|openai-direct|x-abarva-model-provider["']?\s*:\s*["']openai|generate-from-openai/i.test(line);
    },
  },
  {
    id: 'NO_DIRECT_MODEL_SDK_OUTSIDE_EGRESS',
    description: 'New model SDK imports belong behind the audited ai-egress/provider layer.',
    appliesTo(file) {
      return RUNTIME_RE.test(file) && !MODEL_GATEWAY_ALLOW_RE.test(file);
    },
    matches(line) {
      return /from\s+['"]@anthropic-ai\/sdk['"]|require\(['"]@anthropic-ai\/sdk['"]\)|from\s+['"]openai['"]|require\(['"]openai['"]\)/i.test(line);
    },
  },
  {
    id: 'NO_PINECONE_NEO4J_RUNTIME',
    description: 'Runtime retrieval/data plane must not add Pinecone or Neo4j dependencies; use Azure/Postgres/Search.',
    appliesTo(file) {
      return RUNTIME_RE.test(file) || file === 'package.json';
    },
    matches(line) {
      return /@pinecone-database\/pinecone|PINECONE_API_KEY|PINECONE_INDEX|neo4j-driver|NEO4J_|bolt\+s?:\/\//i.test(line);
    },
  },
  {
    id: 'NO_VERCEL_PRODUCTION_ASSUMPTION',
    description: 'Production runtime is Azure Container Apps; do not add Vercel production routing/env assumptions.',
    appliesTo(file) {
      return RUNTIME_RE.test(file) || file === 'package.json';
    },
    matches(line) {
      return /vercel-dns|x-vercel-id|server:\s*vercel|nexus-vert-kappa\.vercel\.app|VERCEL_PROJECT_ID|VERCEL_ORG_ID/i.test(line);
    },
  },
];

function argValue(name, fallback = null) {
  const eq = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(eq));
  if (inline) return inline.slice(eq.length);
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function git(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function normalizeFile(file) {
  return file.replace(/\\/g, '/').replace(/^\.\//, '');
}

function shouldSkipFile(file) {
  if (!file || GENERATED_OR_VENDOR_RE.test(file)) return true;
  if (ALWAYS_ALLOW_RE.test(file)) return true;
  if (DOC_OR_EVIDENCE_RE.test(file)) return true;
  if (LEGACY_ONLY_RE.test(file)) return true;
  if (TEST_RE.test(file)) return true;
  return !CODE_EXTENSIONS.test(file);
}

function changedFiles(base, head) {
  const committed = git(['diff', '--name-only', `${base}...${head}`]);
  const workingTree = git(['diff', '--name-only']);
  return Array.from(
    new Set(
      `${committed}\n${workingTree}`
        .split('\n')
        .map(normalizeFile)
        .filter(Boolean),
    ),
  );
}

function fullFiles(dir = ROOT) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = normalizeFile(path.relative(ROOT, full));
    if (entry.isDirectory()) {
      if (GENERATED_OR_VENDOR_RE.test(`${rel}/`) || rel === '.git') continue;
      out.push(...fullFiles(full));
      continue;
    }
    out.push(rel);
  }
  return out;
}

function changedAddedLines(base, head, files) {
  const patches = [];
  for (const file of files) {
    patches.push(git(['diff', '--unified=0', '--no-ext-diff', `${base}...${head}`, '--', file]));
    patches.push(git(['diff', '--unified=0', '--no-ext-diff', '--', file]));
  }
  const patch = patches.join('\n');
  return parseAddedLines(patch);
}

function parseAddedLines(patch) {
  const rows = [];
  let file = null;
  let newLine = 0;
  for (const line of patch.split('\n')) {
    const fileMatch = line.match(/^\+\+\+ b\/(.+)$/);
    if (fileMatch) {
      file = normalizeFile(fileMatch[1]);
      newLine = 0;
      continue;
    }
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      newLine = Number(hunkMatch[1]);
      continue;
    }
    if (!file || line.startsWith('+++')) continue;
    if (line.startsWith('+')) {
      rows.push({ file, lineNumber: newLine || 1, text: line.slice(1) });
      newLine += 1;
      continue;
    }
    if (!line.startsWith('-')) newLine += 1;
  }
  return rows;
}

function fullLines(files) {
  const rows = [];
  for (const file of files) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) continue;
    const text = fs.readFileSync(full, 'utf8');
    text.split(/\r?\n/).forEach((line, index) => {
      rows.push({ file, lineNumber: index + 1, text: line });
    });
  }
  return rows;
}

function evaluate(rows) {
  const violations = [];
  for (const row of rows) {
    const file = normalizeFile(row.file);
    if (shouldSkipFile(file)) continue;
    for (const rule of RULES) {
      if (!rule.appliesTo(file)) continue;
      if (!rule.matches(row.text)) continue;
      if (rule.id === 'NO_SUPABASE_RUNTIME' && SUPABASE_DENYLIST_ALLOW_RE.test(file)) continue;
      violations.push({
        rule: rule.id,
        description: rule.description,
        file,
        line: row.lineNumber,
        text: row.text.trim().slice(0, 240),
      });
    }
  }
  return violations;
}

function printResult({ mode, base, head, scannedFiles, violations }) {
  const summary = {
    mode,
    base,
    head,
    scannedFiles: scannedFiles.length,
    violations: violations.length,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (violations.length === 0) {
    console.log('Architecture rules passed.');
    return;
  }
  for (const v of violations) {
    const message = `${v.rule}: ${v.file}:${v.line} ${v.text}`;
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::error file=${v.file},line=${v.line},title=${v.rule}::${v.description} | ${v.text}`);
    } else {
      console.error(`[fail] ${message}`);
      console.error(`       ${v.description}`);
    }
  }
}

function runSelfTest() {
  const rows = [
    { file: 'src/lib/sentinel/new-answer.ts', lineNumber: 1, text: "import OpenAI from 'openai';" },
    { file: 'src/lib/sentinel/new-answer.ts', lineNumber: 2, text: 'const key = process.env.OPENAI_API_KEY;' },
    { file: 'src/app/api/foo/route.ts', lineNumber: 1, text: "import { createClient } from '@supabase/supabase-js';" },
    { file: 'src/lib/foo.ts', lineNumber: 1, text: 'const x = process.env.PINECONE_API_KEY;' },
    { file: 'src/lib/integrations/ai-egress/anthropic-direct.ts', lineNumber: 1, text: "import Anthropic from '@anthropic-ai/sdk';" },
    { file: 'docs/build/example.md', lineNumber: 1, text: 'NEXT_PUBLIC_SUPABASE_URL is mentioned in a report.' },
    { file: 'src/lib/corpus/embedding.ts', lineNumber: 1, text: "provider: 'openai-embeddings'" },
  ];
  const violations = evaluate(rows);
  const ids = violations.map((v) => v.rule).sort();
  const expected = [
    'NO_DIRECT_MODEL_SDK_OUTSIDE_EGRESS',
    'NO_OPENAI_PRODUCTION_REASONING',
    'NO_OPENAI_PRODUCTION_REASONING',
    'NO_PINECONE_NEO4J_RUNTIME',
    'NO_SUPABASE_RUNTIME',
  ].sort();
  if (JSON.stringify(ids) !== JSON.stringify(expected)) {
    console.error('Self-test failed.');
    console.error(JSON.stringify({ expected, actual: ids, violations }, null, 2));
    process.exit(1);
  }
  console.log('Architecture rules self-test passed.');
}

if (hasFlag('--self-test')) {
  runSelfTest();
  process.exit(0);
}

const mode = argValue('--mode', 'changed');
const base = argValue('--base', process.env.BASE_REF ? `origin/${process.env.BASE_REF}` : 'origin/main');
const head = argValue('--head', 'HEAD');

let files;
let rows;
if (mode === 'full') {
  files = fullFiles().map(normalizeFile).filter((file) => !shouldSkipFile(file));
  rows = fullLines(files);
} else if (mode === 'changed') {
  files = changedFiles(base, head).filter((file) => !shouldSkipFile(file));
  rows = changedAddedLines(base, head, files);
} else {
  console.error(`Unknown --mode=${mode}. Use changed or full.`);
  process.exit(2);
}

const violations = evaluate(rows);
printResult({ mode, base, head, scannedFiles: files, violations });
if (violations.length > 0) process.exit(1);

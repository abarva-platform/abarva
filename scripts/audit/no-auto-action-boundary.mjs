#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const TOOL_ROOT = path.join(process.cwd(), 'src/lib/agent/tools');
const SCANNED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SKIPPED_SEGMENTS = new Set(['__tests__', '__fixtures__']);

const FORBIDDEN_DIRECT_IMPORTS = [
  {
    label: 'Azure SDK',
    test: (source) => source.startsWith('@azure/'),
    reason: 'agent tools must go through approved app/data-plane adapters before reaching Azure services',
  },
  {
    label: 'Postgres client',
    test: (source) => source === 'pg' || source.startsWith('pg/'),
    reason: 'agent tools must not open direct database clients',
  },
  {
    label: 'Stripe SDK',
    test: (source) => source === 'stripe' || source.startsWith('stripe/'),
    reason: 'agent tools must not trigger payment-side effects directly',
  },
  {
    label: 'Resend SDK',
    test: (source) => source === 'resend' || source.startsWith('resend/'),
    reason: 'agent tools must not send external email directly',
  },
];

const MUTATION_TOOL_PATTERN =
  /^(advance|approve|assign|commit|complete|create|delete|dispatch|draft|email|export|persist|publish|register|send|sign|submit|update|upload)_/;

const HUMAN_CONFIRMATION_PATTERNS = [
  /\buser\s+(?:has\s+)?(?:explicitly\s+)?(?:asks?|asked|confirms?|confirmed|approves?|approved|accepts?|accepted|says?|said|supplied|provided)\b/i,
  /\bauthorized user explicitly\b/i,
  /\buser-approved\b/i,
  /\bhuman(?:-|\s)+(?:approval|approved|confirmation|confirmed|rationale|decision)\b/i,
  /\badmin approval\b/i,
  /\bexplicit (?:user )?(?:acceptance|approval|confirmation)\b/i,
  /\bexplicitly accepts?\b/i,
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED_SEGMENTS.has(entry.name)) files.push(...walk(fullPath));
      continue;
    }
    if (entry.isFile() && SCANNED_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function relative(file) {
  return path.relative(process.cwd(), file);
}

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function collectImportSources(content) {
  const sources = [];
  const withoutComments = stripComments(content);
  const fromImport = /^\s*import(?:\s+type)?[\s\S]*?\s+from\s+['"]([^'"]+)['"];?/gm;
  const sideEffectImport = /^\s*import\s+['"]([^'"]+)['"];?/gm;

  for (const match of withoutComments.matchAll(fromImport)) {
    sources.push(match[1]);
  }
  for (const match of withoutComments.matchAll(sideEffectImport)) {
    sources.push(match[1]);
  }
  return sources;
}

function collectQuotedText(expression) {
  const parts = [];
  const quoted = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  for (const match of expression.matchAll(quoted)) {
    parts.push(match[2].replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\\'/g, "'"));
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function descriptionExpressionAfter(content, startIndex) {
  const descriptionIndex = content.indexOf('description:', startIndex);
  if (descriptionIndex === -1) return '';
  const tail = content.slice(descriptionIndex);
  const boundaryCandidates = [
    tail.indexOf('\n  surfaces:'),
    tail.indexOf('\n  input_schema:'),
    tail.indexOf('\n  handler:'),
  ].filter((index) => index > 0);
  const boundary = boundaryCandidates.length > 0 ? Math.min(...boundaryCandidates) : tail.indexOf('\n};');
  return boundary > 0 ? tail.slice(0, boundary) : tail;
}

function collectTools(content) {
  if (!content.includes('registerTool(')) return [];

  const tools = [];
  const namePattern = /\bname:\s*['"`]([^'"`]+)['"`]/g;
  for (const match of content.matchAll(namePattern)) {
    const name = match[1];
    const description = collectQuotedText(descriptionExpressionAfter(content, match.index ?? 0));
    tools.push({ name, description });
  }
  return tools;
}

function hasHumanConfirmationLanguage(description) {
  return HUMAN_CONFIRMATION_PATTERNS.some((pattern) => pattern.test(description));
}

function scanFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const violations = [];

  for (const source of collectImportSources(content)) {
    const forbidden = FORBIDDEN_DIRECT_IMPORTS.find((entry) => entry.test(source));
    if (forbidden) {
      violations.push({
        file: relative(file),
        kind: 'forbidden-import',
        detail: `${forbidden.label}: ${source}`,
        reason: forbidden.reason,
      });
    }
  }

  for (const tool of collectTools(content)) {
    if (MUTATION_TOOL_PATTERN.test(tool.name) && !hasHumanConfirmationLanguage(tool.description)) {
      violations.push({
        file: relative(file),
        kind: 'missing-human-confirmation-language',
        detail: tool.name,
        reason:
          'write-capable agent tools must tell the model to wait for explicit user/human confirmation before side effects',
      });
    }
  }

  return violations;
}

function main() {
  if (!fs.existsSync(TOOL_ROOT)) {
    throw new Error(`Agent tool root not found: ${TOOL_ROOT}`);
  }

  const files = walk(TOOL_ROOT).sort();
  const violations = files.flatMap(scanFile);

  if (violations.length > 0) {
    console.error('No-auto-action boundary failed.');
    for (const violation of violations) {
      console.error(`- ${violation.file}: ${violation.kind}: ${violation.detail}`);
      console.error(`  ${violation.reason}`);
    }
    process.exit(1);
  }

  console.log(`No-auto-action boundary passed (${files.length} agent tool files scanned).`);
}

main();

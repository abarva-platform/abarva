import { readFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_REGISTRY_PATH = 'datasets/tenant-inputs/tenant-input-registry.json';
const GENERIC_TENANT_WORDS = new Set([
  'air',
  'airline',
  'capital',
  'clinical',
  'demo',
  'financial',
  'health',
  'holdings',
  'industries',
  'new',
  'retail',
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeTerm(value) {
  return String(value ?? '').trim();
}

function addTerm(terms, value) {
  const normalized = normalizeTerm(value);
  if (normalized.length < 4) return;
  terms.add(normalized.toLowerCase());
}

function addTenantKeyTerms(terms, tenantKey) {
  const normalized = normalizeTerm(tenantKey);
  if (!normalized) return;
  addTerm(terms, normalized);
  addTerm(terms, normalized.replace(/[-_]+/g, ' '));

  const parts = normalized.split(/[-_\s]+/).filter(Boolean);
  for (const part of parts) {
    if (GENERIC_TENANT_WORDS.has(part.toLowerCase())) continue;
    addTerm(terms, part);
  }
}

function addDisplayNameTerms(terms, displayName) {
  const normalized = normalizeTerm(displayName);
  if (!normalized) return;
  addTerm(terms, normalized);

  const firstWord = normalized.split(/\s+/)[0];
  if (!GENERIC_TENANT_WORDS.has(firstWord.toLowerCase())) {
    addTerm(terms, firstWord);
  }
}

export function collectTenantNarrativeTermsFromRegistry(registry) {
  const terms = new Set();
  for (const collection of ['activeTenants', 'retiredTenants']) {
    for (const tenant of registry?.[collection] ?? []) {
      addTenantKeyTerms(terms, tenant.tenantKey);
      addDisplayNameTerms(terms, tenant.displayName);
    }
  }
  return Array.from(terms).sort((a, b) => b.length - a.length || a.localeCompare(b));
}

export function loadTenantNarrativeTerms(registryPath = DEFAULT_REGISTRY_PATH) {
  const absolute = path.resolve(process.cwd(), registryPath);
  const registry = JSON.parse(readFileSync(absolute, 'utf8'));
  return collectTenantNarrativeTermsFromRegistry(registry);
}

function stripMarkdownLinks(line) {
  return line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
}

function isProtectedCodeSpan(value) {
  const trimmed = value.trim();
  return (
    /^https?:\/\//.test(trimmed) ||
    /^(@?sha256:|[a-f0-9]{8,40}$)/i.test(trimmed) ||
    /^([A-Z][A-Z0-9_]+|--[a-z0-9-]+)=?/.test(trimmed) ||
    /(^|\s)(az|env|git|node|npm|npx|pnpm|python|python3)\s/.test(trimmed) ||
    /(^|\s)--[a-z0-9-]+/.test(trimmed) ||
    /(^|[./])[\w.-]+\.(csv|json|md|mjs|py|sql|ts|tsx|txt|yaml|yml)\b/.test(trimmed) ||
    /(^|\/)(datasets|docs|scripts|src|tests|public|db|supabase)\//.test(trimmed)
  );
}

function stripProtectedSpans(line) {
  return stripMarkdownLinks(line)
    .replace(/`([^`]*)`/g, (_match, value) => (isProtectedCodeSpan(value) ? '' : value))
    .replace(/https?:\/\/\S+/g, '')
    .replace(/<https?:\/\/[^>]+>/g, '');
}

function termPattern(term) {
  const escaped = escapeRegExp(term).replace(/\\[-_\s]+/g, '[-_\\s]+');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
}

export function findTenantNarrativeViolations(markdown, terms) {
  const patterns = terms.map((term) => termPattern(term));
  const violations = [];
  let inFence = false;

  markdown.split('\n').forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    const prose = stripProtectedSpans(line);
    if (!prose.trim()) return;
    if (patterns.some((pattern) => pattern.test(prose))) {
      violations.push({ lineNumber: index + 1 });
    }
  });

  return violations;
}

export function validateTenantNarrativeGuard(file, markdown, terms) {
  if (terms.length === 0) return [];

  return findTenantNarrativeViolations(markdown, terms).map(
    (violation) =>
      `${file}: line ${violation.lineNumber} names a registry tenant in release-record prose. Use mechanism-level wording, or wrap only real repo paths, commands, and identifiers in code spans.`,
  );
}

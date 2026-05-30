/**
 * Egress Writer Monopoly hygiene gate · PRE-W4-PR-6
 *
 * Codifies the contract that the broker writer
 * (`src/lib/admin/broker/egress-audit-writer.ts`) is the SOLE module
 * that writes to `public.ai_egress_audit`. Tenant stamping is
 * default-on; the wrapper guarantees every row carries
 * `request_metadata.intendedTenantKey` and `.resolvedTenantKey`.
 *
 * This test fails closed. If a future PR introduces a direct
 * `from('ai_egress_audit').insert(...)` or a raw SQL `INSERT INTO
 * ai_egress_audit ...` outside the writer module, the test fails and
 * the PR cannot merge.
 *
 * Exemptions:
 *   - The broker writer itself.
 *   - Test files (free to mock or simulate at will).
 *   - The supabase-audit factory shim (`src/lib/integrations/ai-egress/
 *     supabase-audit.ts`) — re-exports the writer but does not insert
 *     directly. We scan its source to confirm no direct insert remains.
 *   - SQL migrations and seed scripts under `supabase/migrations/**`
 *     and `scripts/**` are out of scope (they intentionally write
 *     historical / fixture rows and never run from the app tier).
 *
 * The scan is line-based and looks for two attack surfaces:
 *   1. Supabase fluent: `from('ai_egress_audit')` followed by an insert
 *      verb (`.insert`, `.upsert`).
 *   2. Raw SQL: a line containing `INSERT INTO` and `ai_egress_audit`.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

const ROOT = process.cwd();
const SCAN_ROOT = join(ROOT, 'src');

const WRITER_PATH = 'src/lib/admin/broker/egress-audit-writer.ts';

// Forward-slash-form path prefixes that are exempt from the monopoly scan.
const EXEMPT_PATHS = new Set<string>([
  WRITER_PATH,
]);

function isTestFile(relPath: string): boolean {
  const normalized = relPath.split(sep).join('/');
  return (
    normalized.includes('/__tests__/') ||
    normalized.endsWith('.test.ts') ||
    normalized.endsWith('.test.tsx') ||
    normalized.endsWith('.spec.ts') ||
    normalized.endsWith('.spec.tsx')
  );
}

function toForwardSlash(p: string): string {
  return p.split(sep).join('/');
}

function collect(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collect(full, out);
      continue;
    }
    if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      out.push(full);
    }
  }
}

interface Violation {
  file: string;
  line: number;
  excerpt: string;
}

function scanFile(file: string): Violation[] {
  const rel = toForwardSlash(relative(ROOT, file));
  if (EXEMPT_PATHS.has(rel)) return [];
  if (isTestFile(rel)) return [];

  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const violations: Violation[] = [];

  // We use a two-line window because the supabase fluent chain often
  // splits `.from('ai_egress_audit')` and `.insert(...)` across lines.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    // Skip pure comment lines.
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('/*')
    ) {
      continue;
    }

    const next = lines[i + 1] ?? '';
    const window = `${line}\n${next}`;

    const fluentFrom = /from\s*\(\s*['"]ai_egress_audit['"]\s*\)/.test(line);
    const fluentInsert = /\.\s*(insert|upsert)\s*\(/.test(window);
    if (fluentFrom && fluentInsert) {
      violations.push({
        file: rel,
        line: i + 1,
        excerpt: line.trim(),
      });
      continue;
    }

    const rawSqlInsert =
      /INSERT\s+INTO\s+([A-Za-z_]+\.)?ai_egress_audit\b/i.test(line);
    if (rawSqlInsert) {
      violations.push({
        file: rel,
        line: i + 1,
        excerpt: line.trim(),
      });
    }
  }

  return violations;
}

describe('ai_egress_audit writer monopoly', () => {
  const files: string[] = [];
  collect(SCAN_ROOT, files);

  it('finds source files to scan (sanity)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('confirms the broker writer holds the only insert path', () => {
    const writerAbs = join(ROOT, WRITER_PATH);
    const writerContent = readFileSync(writerAbs, 'utf-8');
    // The writer MUST contain an insert against ai_egress_audit —
    // otherwise the monopoly hasn't actually been claimed.
    expect(writerContent).toMatch(/from\s*\(\s*['"]ai_egress_audit['"]\s*\)/);
    expect(writerContent).toMatch(/\.insert\(/);
  });

  it('detects no ai_egress_audit insert outside the broker writer', () => {
    const violations: Violation[] = [];
    for (const file of files) {
      violations.push(...scanFile(file));
    }
    if (violations.length > 0) {
      const lines = violations.map(
        (v) => `  ${v.file}:${v.line} — ${v.excerpt}`,
      );
      throw new Error(
        [
          'ai_egress_audit monopoly violated.',
          '',
          'Every write to ai_egress_audit MUST flow through',
          `  ${WRITER_PATH}`,
          '',
          'Found direct inserts in:',
          ...lines,
        ].join('\n'),
      );
    }
  });
});

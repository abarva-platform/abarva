/**
 * Broker-boundary hygiene gate · Wave 1 PR-4
 *
 * Codifies the broker-boundary doctrine
 * (memory · feedback_broker_boundary.md, 2026-04-28) for the
 * Setup / Admin surface. The contract: admin page components and
 * the `src/lib/admin/**` modules they import MUST NOT reach for
 * the Supabase server client (or a `@supabase/*` client) directly.
 * Every server read MUST route through a broker in
 * `src/lib/admin/broker/**`.
 *
 * Why this matters: Wave 1's TrustSpine read model
 * (`trust-spine-broker.ts`) only holds water if no sibling file
 * can silently bypass it. If a new page wires `getServerSupabase`
 * inline, the contract erodes, and every subsequent surface copies
 * the shortcut.
 *
 * This test fails closed. If you need to read from Supabase from
 * the admin surface:
 *
 *   1. Add a broker function under `src/lib/admin/broker/**`.
 *   2. Have your page / lib file import that broker.
 *   3. Update the corresponding broker unit test.
 *
 * Test files (`__tests__/`, `*.test.ts`, `*.spec.ts`) and the
 * compatibility shim at `src/lib/admin/overview-data.ts` are
 * exempt — the shim only re-exports, and tests are allowed to
 * mock supabase clients freely.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

const ROOT = process.cwd();

const SCAN_ROOTS = [
  join(ROOT, 'src', 'app', '(maestro)', 'admin'),
  join(ROOT, 'src', 'lib', 'admin'),
];

// Paths excluded from the broker-boundary scan. Use forward-slash form;
// matching is done against forward-slash relative paths.
const EXCLUDE_PREFIXES = [
  // The broker dir IS the broker layer.
  'src/lib/admin/broker/',
  // Compatibility shim — re-exports only.
  'src/lib/admin/overview-data.ts',
];

// Banned import patterns. Each pattern, if matched in an import or
// require line, is a boundary violation.
const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /from\s+['"]@\/lib\/supabase-server['"]/,
    reason:
      "Direct import of '@/lib/supabase-server' — route through a broker in src/lib/admin/broker/**.",
  },
  {
    pattern: /from\s+['"]@\/lib\/supabase\/server['"]/,
    reason:
      "Direct import of '@/lib/supabase/server' — route through a broker in src/lib/admin/broker/**.",
  },
  {
    pattern: /from\s+['"]@supabase\/[^'"]+['"]/,
    reason:
      'Direct import from a @supabase/* package — route through a broker in src/lib/admin/broker/**.',
  },
  {
    pattern: /\bgetServerSupabase\b/,
    reason:
      'Reference to getServerSupabase — route through a broker in src/lib/admin/broker/**.',
  },
  {
    pattern: /\bcreateServerClient\b/,
    reason:
      'Reference to createServerClient — route through a broker in src/lib/admin/broker/**.',
  },
];

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

function isExcluded(relPath: string): boolean {
  const normalized = relPath.split(sep).join('/');
  return EXCLUDE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function collect(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return; // dir may not exist in some checkouts
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

describe('admin surface broker-boundary hygiene', () => {
  const files: string[] = [];
  for (const root of SCAN_ROOTS) collect(root, files);

  const inScope = files.filter((f) => {
    const rel = relative(ROOT, f);
    return !isTestFile(rel) && !isExcluded(rel);
  });

  it('scans at least one file (sanity)', () => {
    expect(inScope.length).toBeGreaterThan(0);
  });

  it('contains no direct Supabase / data-plane imports outside src/lib/admin/broker/**', () => {
    const violations: string[] = [];
    for (const file of inScope) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip pure comment lines so doctrine docs don't trip the guard.
        const trimmed = line.trim();
        if (
          trimmed.startsWith('//') ||
          trimmed.startsWith('*') ||
          trimmed.startsWith('/*')
        ) {
          continue;
        }
        for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
          if (pattern.test(line)) {
            const rel = relative(ROOT, file);
            violations.push(`${rel}:${i + 1} — ${reason}`);
          }
        }
      }
    }
    if (violations.length > 0) {
      const msg = [
        'Broker-boundary violations detected.',
        '',
        'The admin surface MUST NOT reach for Supabase clients directly.',
        'Route every server read through a broker in src/lib/admin/broker/**.',
        '',
        ...violations,
      ].join('\n');
      throw new Error(msg);
    }
  });
});

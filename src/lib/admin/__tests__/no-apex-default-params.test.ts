/**
 * PR-D (P0 Apex-leak) — hygiene guard.
 *
 * Forbids any default parameter that falls back to `'apex-retail'` or
 * `'Apex Retail'` inside function signatures under `src/lib/admin/`.
 *
 * Why: default tenant params were the silent trapdoor that produced the
 * cross-tenant Apex leak — any new caller that forgot the tenant arg
 * would silently get Apex data. After PR-D, tenantSlug is required at
 * every page-view + adapter entry point. This test prevents regressions
 * by failing CI if a default like `tenantSlug: string = 'apex-retail'`
 * is reintroduced.
 *
 * Scope:
 *   - Walks every `.ts` file under `src/lib/admin/` recursively.
 *   - Skips fixture files under `src/lib/admin/data/fixtures/` — those
 *     legitimately use `=== 'apex-retail'` comparisons to drive Apex-only
 *     fixture data.
 *   - Skips this test file and the small allowlist below.
 *
 * Detection: lightweight regex on each line. Matches patterns like
 *   `: string = 'apex-retail'`
 *   `: string = "Apex Retail Group"`
 *   `tenantSlug = 'apex-retail'`
 * inside what looks like a function signature (rough — falls through
 * on comments containing the literal, which is acceptable since the
 * intent is to catch the obvious shape).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ADMIN_LIB_ROOT = resolve(process.cwd(), 'src/lib/admin');

// Allowlist: full paths (relative to ADMIN_LIB_ROOT) where an Apex
// default literal is intentional. Empty after PR-D.
const ALLOWLIST: ReadonlyArray<string> = [
  // Hygiene test itself contains the forbidden strings as documentation.
  '__tests__/no-apex-default-params.test.ts',
];

// Skip patterns by relative path prefix — fixture files legitimately
// gate on `tenantSlug === 'apex-retail'` to return Apex-only data; that
// is not a default parameter and is out of scope.
const SKIP_DIR_PREFIXES: ReadonlyArray<string> = [
  'data/fixtures/',
];

// Matches a parameter default: requires a type annotation like
// `: string` (or `: SomeType`) directly before the `=`. This catches
// patterns like `tenantSlug: string = 'apex-retail'` while skipping
// module-level constants (`const FOO = 'apex-retail'`) and equality
// checks (`tenant === 'apex-retail'`). Top-level `const` assignments
// have no type-colon directly before the `=`, so they don't match.
const APEX_DEFAULT_PARAM_PATTERN =
  /:\s*[A-Za-z_][\w<>,\s|&[\]]*\s*=\s*['"](apex-retail|Apex Retail[^'"]*)['"]/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
    } else if (name.endsWith('.ts') || name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

function isAllowlisted(rel: string): boolean {
  if (ALLOWLIST.includes(rel)) return true;
  return SKIP_DIR_PREFIXES.some((p) => rel.startsWith(p));
}

describe("PR-D hygiene: no '= apex-retail' default params under src/lib/admin", () => {
  it('finds no Apex default-param regressions in admin lib', () => {
    const offenders: string[] = [];

    for (const file of walk(ADMIN_LIB_ROOT)) {
      const rel = relative(ADMIN_LIB_ROOT, file);
      if (isAllowlisted(rel)) continue;

      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, idx) => {
        // Skip pure comment lines.
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

        if (!APEX_DEFAULT_PARAM_PATTERN.test(line)) return;

        offenders.push(`${rel}:${idx + 1}  ${line.trim()}`);
      });
    }

    expect(offenders).toEqual([]);
  });
});

/**
 * PR-C · Apex-leak elimination · LEAK-B hygiene gate
 *
 * `AdminCanonShellV2.tenantName` is a REQUIRED prop. A previous default
 * of 'Apex Retail Group' was the root cause of LEAK-B in
 * `docs/build/ADMIN_HOME_FULL_TEST_2026-05-30.md` §2 Layer 2 + §6 F3 +
 * §7.3 + §7.5: any page rendering `<AdminCanonShellV2 ...>` without a
 * tenantName prop would silently render "Apex Retail Group" in the
 * masthead regardless of who was logged in.
 *
 * This test scans every `<AdminCanonShellV2 ...>` JSX usage under
 * `src/app/**` and asserts the opening tag block contains a `tenantName=`
 * attribute. TypeScript's required-prop enforcement is the primary gate;
 * this test catches the case where a future refactor reintroduces a
 * default value or someone adds `// @ts-ignore` to bypass the type.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const APP_ROOT = path.join(REPO_ROOT, 'src/app');

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      walk(full, acc);
    } else if (entry.isFile() && /\.tsx$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Find every `<AdminCanonShellV2 ...>` opening tag in the source and
 * return its file path + line number + the full opening-tag text (from
 * `<AdminCanonShellV2` up to and including the closing `>` of the
 * opening tag). Self-closing forms (`/>`) are not used today but handled
 * defensively.
 */
function findShellOpenings(
  source: string,
  file: string,
): Array<{ file: string; line: number; tag: string }> {
  const matches: Array<{ file: string; line: number; tag: string }> = [];
  const needle = '<AdminCanonShellV2';
  let idx = 0;
  while ((idx = source.indexOf(needle, idx)) !== -1) {
    // Skip <AdminCanonShellV2Props or similar identifier prefixes.
    const after = source[idx + needle.length] ?? '';
    if (/[A-Za-z0-9_]/.test(after)) {
      idx += needle.length;
      continue;
    }
    // Find the matching '>' that closes the opening tag, respecting
    // nested braces from JSX expression containers.
    let depth = 0;
    let end = -1;
    for (let i = idx + needle.length; i < source.length; i++) {
      const ch = source[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      else if (ch === '>' && depth === 0) {
        end = i;
        break;
      }
    }
    if (end === -1) break;
    const tag = source.slice(idx, end + 1);
    const line = source.slice(0, idx).split('\n').length;
    matches.push({ file, line, tag });
    idx = end + 1;
  }
  return matches;
}

describe('AdminCanonShellV2 tenantName is required at every call site (LEAK-B)', () => {
  const tsxFiles = walk(APP_ROOT);
  const offenders: Array<{ file: string; line: number; tag: string }> = [];

  for (const file of tsxFiles) {
    const source = fs.readFileSync(file, 'utf8');
    if (!source.includes('<AdminCanonShellV2')) continue;
    for (const opening of findShellOpenings(source, file)) {
      // tenantName must appear as a prop attribute in the opening tag.
      // Accept both `tenantName=` and the rare shorthand `{...someProps}`
      // forms only when accompanied by an explicit tenantName= too —
      // i.e. spread alone is not enough. The current codebase never uses
      // spread props on this component; this guard keeps it that way.
      if (!/\btenantName\s*=/.test(opening.tag)) {
        offenders.push(opening);
      }
    }
  }

  it('no <AdminCanonShellV2> call site omits tenantName', () => {
    if (offenders.length > 0) {
      const lines = offenders.map(
        ({ file, line }) => `  - ${path.relative(REPO_ROOT, file)}:${line}`,
      );
      throw new Error(
        [
          `Found ${offenders.length} <AdminCanonShellV2> usage(s) without tenantName=:`,
          ...lines,
          '',
          'Every AdminCanonShellV2 caller must thread the active tenant',
          'display name. For tenant-scoped admin pages, call',
          'resolveAdminTenant() and pass tenant.tenantName. For non-tenant',
          'surfaces (unauthorized shell, public docs, engineering views)',
          'pass an explicit neutral literal like "AbarVa Admin".',
        ].join('\n'),
      );
    }
    expect(offenders).toHaveLength(0);
  });
});

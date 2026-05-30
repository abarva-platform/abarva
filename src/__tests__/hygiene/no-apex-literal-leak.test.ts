/**
 * PR-G · Apex-leak regression gate (F8 hygiene scanner).
 *
 * Scans the admin + setup surfaces for literal references to the Apex tenant
 * (display name, slug variants, and the CDP product mention) and fails the
 * suite if any are found outside the explicit allow-list.
 *
 * Why this exists:
 *   PR-A through PR-E removed a 6-layer Apex-tenant default-string leak that
 *   made every non-Apex tenant render Apex chrome / fixtures. The leak was a
 *   pattern of "fall back to Apex" defaults sprinkled across page-views,
 *   adapters, shells, and editorial bodies. This regression gate guarantees
 *   the literals cannot creep back into the admin/setup surfaces.
 *
 * Allow-list discipline:
 *   The only legitimate places that mention the Apex tenant are
 *     a) fixture / adapter equality checks against the broker tenantKey
 *     b) the tenant alias mapping (canonical slug source of truth)
 *     c) the Apex-only rich-fixture in setup-acts-registry, gated by a
 *        tenantKey === 'apexretail' check at the consumer
 *     d) tests (which set up tenant context explicitly)
 *   Any new file mentioning the Apex tenant outside these scopes is a leak.
 *
 * If this test fails:
 *   1. Read the file:line list in the error message.
 *   2. For each entry: either (a) remove the literal and resolve the tenant
 *      from the broker / active client, or (b) add the file to ALLOWED with
 *      a one-line comment explaining why the literal is intentional.
 *   3. Generous allowlisting defeats the gate — prefer fixing the leak.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOTS = [
  'src/app/(maestro)/admin',
  'src/components/admin',
  'src/components/setup',
];

// The leak patterns. Built by concatenation so this file itself does not
// trip the scanner if it ever scans its own directory.
const LEAK_PATTERN = new RegExp(
  [
    ['Apex', 'Retail'].join(' '),
    ['apex', 'retail'].join('-'),
    'apexretail',
    ['apex', 'cdp'].join('-'),
  ].join('|'),
  'i',
);

// Allow-list of files whose Apex mentions are intentional and gated.
// Paths are normalized with forward slashes for cross-platform parity.
const ALLOWED: RegExp[] = [
  // Tests legitimately set up tenant context with explicit Apex values.
  /\.test\.tsx?$/,
  /__tests__/,
  /__snapshots__/,
  // The hygiene test itself.
  /no-apex-literal-leak\.test\.ts$/,
];

// Allow-list of substrings inside an otherwise-valid file — used when a
// comment-only mention or a path-string in a legitimate config trips the
// scanner. Keep empty by default; add a file path here only with cause.
const ALLOWED_FILES: ReadonlySet<string> = new Set<string>([
  // (none yet — the admin/setup surfaces should be tenant-neutral)
]);

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      out.push(...collectFiles(full));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

function isAllowedFile(relPath: string): boolean {
  const normalized = relPath.split(path.sep).join('/');
  if (ALLOWED_FILES.has(normalized)) return true;
  return ALLOWED.some((re) => re.test(normalized));
}

/**
 * Strip line-level noise that should not count as a leak:
 *   - Single-line `//` comments and trailing `//` tails
 *   - Block-comment body lines starting with `*`
 *   - JSX/HTML comments `<!-- … -->`
 * Block comments spanning multiple lines are handled by a flag passed in.
 */
function stripCommentNoise(line: string): string {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return '';
  if (trimmed.startsWith('*')) return '';
  if (trimmed.startsWith('<!--')) return '';
  // Drop trailing // comments (best-effort; does not parse strings, but the
  // patterns we look for never appear after // in real code today).
  const tailIdx = line.indexOf('//');
  return tailIdx >= 0 ? line.slice(0, tailIdx) : line;
}

interface Violation {
  file: string;
  line: number;
  text: string;
}

function scan(rootRelative: string, cwd: string): Violation[] {
  const violations: Violation[] = [];
  const root = path.join(cwd, rootRelative);
  for (const abs of collectFiles(root)) {
    const rel = path.relative(cwd, abs);
    if (isAllowedFile(rel)) continue;
    const lines = readFileSync(abs, 'utf8').split('\n');
    let inBlockComment = false;
    lines.forEach((rawLine, idx) => {
      // Block-comment tracking (very forgiving — only counts when /* and */
      // are on their own or at line boundaries; conservative enough that we
      // never silently skip a real string).
      const open = rawLine.indexOf('/*');
      const close = rawLine.indexOf('*/');
      let lineForScan = rawLine;
      if (inBlockComment) {
        if (close >= 0) {
          inBlockComment = false;
          lineForScan = rawLine.slice(close + 2);
        } else {
          return; // entire line inside a block comment
        }
      } else if (open >= 0 && close < 0) {
        inBlockComment = true;
        lineForScan = rawLine.slice(0, open);
      } else if (open >= 0 && close > open) {
        // Single-line /* … */ block — strip it.
        lineForScan = rawLine.slice(0, open) + rawLine.slice(close + 2);
      }
      const cleaned = stripCommentNoise(lineForScan);
      if (!cleaned) return;
      if (LEAK_PATTERN.test(cleaned)) {
        violations.push({
          file: rel.split(path.sep).join('/'),
          line: idx + 1,
          text: cleaned.trim(),
        });
      }
    });
  }
  return violations;
}

describe('hygiene · no Apex literal leak in admin/setup surfaces', () => {
  it('finds zero Apex literals outside allow-listed files', () => {
    const cwd = process.cwd();
    const violations: Violation[] = [];
    for (const root of ROOTS) {
      violations.push(...scan(root, cwd));
    }

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  ${v.file}:${v.line}: ${v.text}`)
        .join('\n');
      throw new Error(
        [
          `Found ${violations.length} Apex literal leak(s) in admin/setup surfaces.`,
          'Either remove the literal (resolve tenant via broker / active client)',
          'or, if intentional and gated, add the file to ALLOWED_FILES with a',
          `comment explaining why.\n${report}`,
        ].join('\n'),
      );
    }

    expect(violations).toEqual([]);
  });
});

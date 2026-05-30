/**
 * Wave 1 PR-3 hygiene gate (2026-05-30).
 *
 * Per SETUP_AUDIT_2026-05-30_VERDICT §2 + §5.3, the legacy `SubNavStrip`
 * + `SUB_NAV_ITEMS` pattern (Connectors · Users · Audit · Policies · Tenant)
 * has been killed from the Setup/Admin surface. The canonical sub-nav for
 * Setup is the horizontal tab strip directly below the page header
 * (`/admin/connectors` tabs, `/admin/production-readiness` tabs, and
 * `AdminOverviewTabs` on `/admin`).
 *
 * SubNavStrip is still a legitimate primitive for OTHER surfaces (Programs,
 * Source). This test fails if anything under `src/components/setup/**` or
 * `src/app/(maestro)/admin/**` re-introduces the import.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(process.cwd(), 'src');

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      // Skip __tests__ and __archive__ folders — tests can reference the
      // banned symbols by name (in expectations), and archive is excluded
      // by design.
      if (entry === '__tests__' || entry === '__archive__') continue;
      walk(full, files);
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

const SETUP_DIRS = [
  join(ROOT, 'components', 'setup'),
  join(ROOT, 'app', '(maestro)', 'admin'),
];

describe('Wave 1 PR-3 · no SubNavStrip in Setup/Admin surface', () => {
  const offenders: Array<{ file: string; reason: string }> = [];

  for (const dir of SETUP_DIRS) {
    try {
      statSync(dir);
    } catch {
      continue;
    }
    for (const file of walk(dir)) {
      const content = readFileSync(file, 'utf-8');
      if (/from\s+['"][^'"]*shell\/SubNavStrip['"]/.test(content)) {
        offenders.push({ file, reason: 'imports SubNavStrip' });
      }
      // The literal `SUB_NAV_ITEMS` declaration is the legacy 5-tab strip.
      // We only catch real declarations / usages, not prose comments that
      // explain the historical pattern. Tab arrays for the canonical
      // sub-nav use different names (e.g. `AdminOverviewTabs` ⇒ `TABS`,
      // connectors uses `view.tabs`).
      const stripComments = content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
      if (/\bSUB_NAV_ITEMS\b/.test(stripComments)) {
        offenders.push({ file, reason: 'defines or references SUB_NAV_ITEMS' });
      }
    }
  }

  test('no SubNavStrip / SUB_NAV_ITEMS in Setup/Admin', () => {
    if (offenders.length > 0) {
      const lines = offenders.map((o) => `  - ${o.file}: ${o.reason}`).join('\n');
      throw new Error(
        `Wave 1 PR-3 forbids SubNavStrip in the Setup/Admin surface.\n` +
          `Canonical Setup sub-nav is the horizontal tab strip directly\n` +
          `below the page header (AdminOverviewTabs on /admin, server-\n` +
          `component tab strips on /admin/connectors and\n` +
          `/admin/production-readiness).\n\n` +
          `Offenders:\n${lines}`,
      );
    }
    expect(offenders).toEqual([]);
  });
});

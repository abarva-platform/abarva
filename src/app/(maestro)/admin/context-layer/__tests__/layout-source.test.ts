import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Re-baselined 2026-09-24 under the P3 stale-suite triage, against the six
 * directories the coverage census cannot rank. This suite was red, and the
 * product was right in every case.
 *
 * The scroll-frame case asserted the single-quoted literal `minHeight: '100%'`
 * against a hand-written list of six pages. All six pages set that property;
 * four of them write it with double quotes, which is a formatter's choice and
 * not a contract. Two consequences, and the second is the one that matters:
 *
 *   1. The case failed at the first page in the list, so the five after it were
 *      never evaluated — the suite reported one defect where there were none.
 *   2. The paired negative assertion, `not.toContain("minHeight: '100vh'")`,
 *      could not fail for those same four pages. A page that broke the Admin
 *      scroll frame by writing `minHeight: "100vh"` would have passed the guard
 *      that exists to catch exactly that.
 *
 * So the positive half was a false alarm and the negative half was unfailable.
 * Both are now matched on the property rather than on one spelling of it.
 *
 * The page list is also no longer written by hand. A seventh page
 * (`triage/page.tsx`, added by `0490e3afd`) had appeared since the list was
 * written and was covered by nothing; enumerating the subtree means a page
 * added tomorrow is inside the contract on the day it lands. Every page is
 * evaluated and every violation is reported together, so a second offender is
 * never hidden behind the first.
 */

const CONTEXT_LAYER_ROOT = path.join(
  process.cwd(),
  'src/app/(maestro)/admin/context-layer',
);

/** `minHeight: '100%'` / `minHeight: "100%"` — quote style is not the contract. */
const SCROLL_FRAME_HEIGHT = /minHeight:\s*["']100%["']/;
/** The property this guard exists to catch, in either spelling. */
const VIEWPORT_HEIGHT = /minHeight:\s*["']100vh["']/;

/** Every `page.tsx` under the context-layer subtree, repo-relative, sorted. */
function contextLayerPages(dir: string = CONTEXT_LAYER_ROOT): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...contextLayerPages(full));
    else if (entry.name === 'page.tsx') found.push(path.relative(process.cwd(), full));
  }
  return found.sort();
}

const layoutSource = readFileSync(path.join(CONTEXT_LAYER_ROOT, 'layout.tsx'), 'utf8');

describe('admin context-layer shell contract', () => {
  it('wraps every context-layer page in the canonical Admin shell', () => {
    expect(layoutSource).toContain('AdminContextLayerLayout');
    expect(layoutSource).toContain('resolveAdminTenant');
    expect(layoutSource).toContain('<AdminCanonShellV2 tenantName={tenant.tenantName}>');
  });

  it('finds the context-layer pages to check rather than trusting a written list', () => {
    // Guards the enumeration itself: an empty or collapsed sweep would make
    // every case below vacuously true.
    const pages = contextLayerPages();
    expect(pages.length).toBeGreaterThanOrEqual(7);
    expect(pages).toContain('src/app/(maestro)/admin/context-layer/page.tsx');
    expect(pages).toContain('src/app/(maestro)/admin/context-layer/triage/page.tsx');
  });

  it('keeps every context-layer page sized for the Admin scroll frame', () => {
    const missing = contextLayerPages().filter(
      (file) => !SCROLL_FRAME_HEIGHT.test(readFileSync(path.join(process.cwd(), file), 'utf8')),
    );
    expect(missing).toEqual([]);
  });

  it('lets no context-layer page size itself to the viewport instead', () => {
    const offenders = contextLayerPages().filter((file) =>
      VIEWPORT_HEIGHT.test(readFileSync(path.join(process.cwd(), file), 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});

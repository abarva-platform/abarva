/**
 * @jest-environment jsdom
 *
 * Hygiene test · Wave 1 PR-1 (Setup/Admin Trust Plane consolidation, 2026-05-30).
 *
 * Intent: prevent regression of the parallel /home/* re-export tree that
 * shadowed /admin/* during the 2026-05-07 ROUTE_MIGRATION. Per the
 * SETUP_AUDIT_2026-05-30_VERDICT, /admin/* is the single canonical route
 * tree for the Setup/Admin surface. The /home/* panel re-exports were
 * deleted and replaced with 301 redirects in src/proxy.ts.
 *
 * If a re-export page is reintroduced under any of the deleted segment
 * names, this test fails to surface it before it ships.
 *
 * KEEP-list (intentional real /home/* pages — NOT re-exports of /admin):
 *   - /home                  (Insight-first operating room)
 *   - /home/queue            (Action queue)
 *   - /home/learn            (Training / user guide)
 *   - /home/ai-initiatives   (redirect stub — /admin counterpart retired)
 *   - /home/training         (alias → /home/learn)
 */

import fs from 'node:fs';
import path from 'node:path';

import { render } from '@testing-library/react';
import { createElement } from 'react';

import { HomeV4App } from '@/components/home/v4/HomeV4App';
import type { HomeReviewBundle } from '@/lib/home/preview/types';

jest.mock('@/components/home/preview/HomeAvaChat', () => ({
  HomeAvaChat: ({ children }: { children: unknown }) => children,
}));

const HOME_ROOT = path.resolve(__dirname, '..');
const GOLDEN_SNAPSHOTS = path.resolve(
  __dirname,
  '../../../../lib/home/preview/golden-snapshots',
);

const DELETED_REEXPORT_SEGMENTS: ReadonlyArray<string> = [
  'data-trust',
  'connectors',
  'agent-readiness',
  'configuration',
  'tenant-profile',
];

describe('no /home/* re-exports of /admin/* pages', () => {
  for (const segment of DELETED_REEXPORT_SEGMENTS) {
    it(`/home/${segment} must not exist as a route`, () => {
      const segmentDir = path.join(HOME_ROOT, segment);
      const exists = fs.existsSync(path.join(segmentDir, 'page.tsx')) ||
        fs.existsSync(path.join(segmentDir, 'page.ts')) ||
        fs.existsSync(path.join(segmentDir, 'route.tsx')) ||
        fs.existsSync(path.join(segmentDir, 'route.ts'));
      if (exists) {
        throw new Error(
          `Home/Admin separation hygiene violation: src/app/(maestro)/home/${segment}/ has a route file. ` +
            `/admin/${segment} (or /admin/tenant for tenant-profile) is the canonical route. ` +
            `Update callers to point at /admin/* instead of re-creating the /home/* shim.`,
        );
      }
      expect(exists).toBe(false);
    });
  }

  /*
   * Item T-484 — and the item's premise turned out to understate the problem,
   * so read this before writing a third copy case.
   *
   * These two cases used to read the SOURCE of four components --
   * `ImpactInsightsHome`, `AgenticHomeEntry`, `HomeIndexPage` and
   * `HomeOverviewV2` -- and assert that certain strings were present in, or
   * absent from, their bytes. T-479 handed them here because mutation `M2b`
   * showed they fail on a phrase inserted as a COMMENT: they read bytes, not
   * rendered copy, so a string computed any other way would pass them.
   *
   * Re-verifying on `main` first found the larger fact. NONE of those four
   * components is reachable from any route. Measured two independent ways:
   * every reference to all four outside their own files and outside test files
   * is a comment, a type name, or a QA inventory string -- zero import
   * statements -- and the sibling suite `home-admin-boundary-contract.test.ts`
   * asserts that `/home/page.tsx` must NOT mention them, because `/home` serves
   * the v4 canvas (`HomePreviewAppRoot` -> `HomeV4App`).
   *
   * So the cases were not merely reading bytes. They were reading the bytes of
   * copy no reader can see, and a render-based replacement pointed at the same
   * four components would have been a behavioural test of dead code -- green,
   * honest-looking, and proving nothing about Home. Retargeting is the fix, not
   * a bigger version of the same instrument.
   *
   * What these cases assert now: the property, over the visible text of the
   * surface `/home` actually renders, for every tenant the repository governs a
   * bundle for and every view a reader can reach. A phrase in a comment cannot
   * appear in rendered text, and a phrase assembled at runtime cannot hide from
   * it.
   *
   * The positive halves of the old cases are NOT carried over, and that is
   * deliberate rather than an omission. `toContain('Client locked')`,
   * `toContain("title: 'Admin'")` and `toContain('access from Admin')` name
   * copy that exists on no live surface -- measured: none of those strings
   * appears anywhere in the rendered Home. Re-pinning them to an unmounted
   * file's bytes is the defect this item exists to remove, so the surviving
   * assertion is the banned-phrase sweep, which is the half the old case's own
   * comment already called "the real contract". The four unreachable components
   * are filed as `U-530` -- mount or delete is a product call, not this item's.
   */

  /** Every tenant the repository governs a Home bundle for. Read from disk so a
   * new tenant is swept the day its snapshot lands, rather than the day someone
   * remembers to add it here. */
  const TENANT_KEYS: string[] = fs
    .readdirSync(GOLDEN_SNAPSHOTS)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.replace(/\.json$/, ''));

  function bundleFor(tenantKey: string): HomeReviewBundle {
    return JSON.parse(
      fs.readFileSync(path.join(GOLDEN_SNAPSHOTS, `${tenantKey}.json`), 'utf8'),
    ) as HomeReviewBundle;
  }

  /** The views a reader can reach: every chapter in the record, plus the four
   * standing views and the four technology-estate lenses. */
  function surfacesFor(bundle: HomeReviewBundle): string[] {
    return [
      ...bundle.chapters.map((chapter) => chapter.chapterId),
      'architecture',
      'data-flow',
      'browse-the-data',
      'tech:application_system',
      'tech:vendor_contract',
      'tech:infrastructure_platform',
      'tech:data_asset_or_integration',
    ];
  }

  /** Visible text only. A value inside a `title` attribute or a `<style>` block
   * is not what a reader reads, and neither is a source comment. */
  function renderedText(tenantKey: string, surface: string): string {
    document.body.innerHTML = '';
    window.location.hash = surface;
    render(
      createElement(HomeV4App, {
        bundle: bundleFor(tenantKey),
        tenantKey: tenantKey as never,
      }),
    );
    document.querySelectorAll('style').forEach((node) => node.remove());
    return document.body.textContent ?? '';
  }

  interface Sweep {
    readonly hits: string[];
    readonly shortestView: number;
    readonly views: number;
  }

  function sweep(banned: readonly string[]): Sweep {
    const hits: string[] = [];
    let shortestView = Number.POSITIVE_INFINITY;
    let views = 0;
    for (const tenantKey of TENANT_KEYS) {
      for (const surface of surfacesFor(bundleFor(tenantKey))) {
        const text = renderedText(tenantKey, surface);
        views += 1;
        shortestView = Math.min(shortestView, text.length);
        for (const phrase of banned) {
          if (text.includes(phrase)) hits.push(`${tenantKey}#${surface}: ${phrase}`);
        }
      }
    }
    return { hits, shortestView, views };
  }

  /** A clean sweep over a surface that failed to render is indistinguishable
   * from a clean sweep over a surface that is clean. Both cases below take this
   * before believing an empty result. */
  function assertTheSweepCouldHaveSeenSomething(result: Sweep, banned: readonly string[]) {
    expect(result.views).toBeGreaterThanOrEqual(2 * 11);
    expect(result.shortestView).toBeGreaterThan(1_000);
    // And the scanner itself is not blind: the same membership test, run over
    // text that does carry a banned phrase, finds it.
    const planted = `prefix ${banned[0]} suffix`;
    expect(banned.filter((phrase) => planted.includes(phrase))).toContain(banned[0]);
  }

  it('keeps visible Home copy tenant-scoped and free of setup/admin framing', () => {
    // The banned list is the old case's, unchanged: cross-tenant framing and
    // build-surface vocabulary are the two things Home must not say.
    const BANNED = [
      'Cross-workspace',
      'cross-workspace',
      'Cross-tenant',
      'cross-tenant',
      'Cross tenant',
      'cross tenant',
      'Data loads',
      'Connectors',
      'Templates',
      'Setup workflows',
    ] as const;

    const result = sweep(BANNED);
    assertTheSweepCouldHaveSeenSomething(result, BANNED);
    expect(result.hits).toEqual([]);
  });

  it('keeps visible Home copy free of the setup-era labels the entry surface retired', () => {
    // The strings the old case pinned to three component files, asserted here
    // against what a reader is shown. "Admin" and "Administration" on their own
    // are NOT banned: both appear in tenant content as the names of real
    // systems, and a sweep that flagged them would be a test of the fixture.
    const BANNED = [
      'Admin Setup',
      'Setup · dataset domains',
      'access from Setup',
      'Setup, access, readiness, and audit controls',
    ] as const;

    const result = sweep(BANNED);
    assertTheSweepCouldHaveSeenSomething(result, BANNED);
    expect(result.hits).toEqual([]);
  });
});

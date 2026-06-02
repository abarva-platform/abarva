/**
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

const HOME_ROOT = path.resolve(__dirname, '..');
const COMPONENT_ROOT = path.resolve(__dirname, '../../../../components/home');

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

  it('keeps Home copy tenant-scoped and free of setup/admin framing', () => {
    const homeComponent = fs.readFileSync(
      path.join(COMPONENT_ROOT, 'ImpactInsightsHome.tsx'),
      'utf8',
    );

    // Home stays an executive read surface, client-scoped. (The exact
    // pill caption was retired in the 2026-06-02 "Executive brief"
    // redesign; the real contract is the banned-phrase list below —
    // no setup/admin/cross-tenant framing leaks into Home.)
    expect(homeComponent).toContain('Client locked');
    for (const phrase of [
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
    ]) {
      expect(homeComponent).not.toContain(phrase);
    }
  });

  it('keeps visible Home entry copy aligned to Admin instead of setup-era labels', () => {
    const homeEntry = fs.readFileSync(
      path.join(COMPONENT_ROOT, 'AgenticHomeEntry.tsx'),
      'utf8',
    );
    const homeIndex = fs.readFileSync(
      path.join(COMPONENT_ROOT, 'HomeIndexPage.tsx'),
      'utf8',
    );
    const overview = fs.readFileSync(
      path.join(COMPONENT_ROOT, 'HomeOverviewV2.tsx'),
      'utf8',
    );

    expect(homeEntry).toContain("title: 'Admin'");
    expect(homeEntry).toContain("eyebrow: 'Admin · dataset domains'");
    expect(homeEntry).not.toContain("title: 'Admin Setup'");
    expect(homeEntry).not.toContain("eyebrow: 'Setup · dataset domains'");

    expect(homeIndex).toContain('access from Admin');
    expect(homeIndex).not.toContain('access from Setup');

    expect(overview).toContain('lead="Access, readiness, and audit controls for the active client."');
    expect(overview).not.toContain('lead="Setup, access, readiness, and audit controls for the active client."');
  });
});

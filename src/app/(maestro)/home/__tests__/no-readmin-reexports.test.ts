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
 *   - /home                  (Overview)
 *   - /home/queue            (Action queue)
 *   - /home/learn            (Training / user guide)
 *   - /home/ai-initiatives   (redirect stub — /admin counterpart retired)
 *   - /home/configuration    (placeholder index UI · own component)
 *   - /home/training         (alias → /home/learn)
 */

import fs from 'node:fs';
import path from 'node:path';

const HOME_ROOT = path.resolve(__dirname, '..');

const DELETED_REEXPORT_SEGMENTS: ReadonlyArray<string> = [
  'data-trust',
  'connectors',
  'agent-readiness',
  'tenant-profile',
];

describe('no /home/* re-exports of /admin/* pages', () => {
  for (const segment of DELETED_REEXPORT_SEGMENTS) {
    it(`/home/${segment} must not exist as a route`, () => {
      const segmentDir = path.join(HOME_ROOT, segment);
      const exists = fs.existsSync(segmentDir);
      if (exists) {
        throw new Error(
          `Wave 1 PR-1 hygiene violation: src/app/(maestro)/home/${segment}/ has been reintroduced. ` +
            `/admin/${segment} (or /admin/tenant for tenant-profile) is the canonical route. ` +
            `Update callers to point at /admin/* instead of re-creating the /home/* shim.`,
        );
      }
      expect(exists).toBe(false);
    });
  }
});

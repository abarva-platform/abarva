/**
 * T-528 — a correct verdict has to carry its evidence.
 *
 * `logo-usage-enforcement` reported ten declared-retired brand paths as
 * "correctly absent" or "still exists", which is the right verdict in both
 * directions and no evidence at all. A reader could not tell a deliberate
 * retirement from a list somebody guessed at, and could not tell an asset that
 * survived a retirement from one that came back afterwards.
 *
 * Measured on `origin/main` before any of this was written, with `git log` and
 * `merge-base --is-ancestor` (never `--all`, which is not evidence about a
 * branch):
 *
 *   - all ten paths were added by 5d795a397 and deleted by f1d8bc95c
 *   - seven stayed absent
 *   - three returned later: abarva-logo-inverse.svg at 8b556c126, and
 *     abarva-logo.svg and abarva-logo-lockup-v2.svg at 6ebe6d4a9
 *
 * T-504 resolves those three enforcement failures by removing the aliases
 * again after their runtime consumers move to the canonical Option 2 assets.
 * The register still preserves the original restoration commits as history;
 * an absent path must resolve as removed rather than repeat a stale return.
 */
import {
  runLogoUsageEnforcement,
  BRAND_PATH_REGISTER,
  RETIRED_BRAND_PATHS,
} from '@/lib/qa/logo-usage-enforcement';
import { resolvePathStatus } from '@/lib/qa/path-disposition';

/** The commit that retired every one of these paths. */
const RETIRING_COMMIT = 'f1d8bc95c';

/** Paths measured as restored after the retirement, with the commit. */
const RESTORED: Record<string, string> = {
  'public/brand/abarva-logo-inverse.svg': '8b556c126',
  'public/brand/abarva-logo.svg': '6ebe6d4a9',
  'public/brand/abarva-logo-lockup-v2.svg': '6ebe6d4a9',
};

function retiredChecks() {
  return runLogoUsageEnforcement().checks.filter(
    (check) =>
      check.checkId.startsWith('BRAND2-C9-') ||
      check.checkId.startsWith('BRAND2-C10-'),
  );
}

describe('T-528 — retired brand paths resolve through the shared register', () => {
  it('every declared-retired path has a register entry naming the retiring commit', () => {
    expect(RETIRED_BRAND_PATHS.length).toBe(10);
    for (const rel of RETIRED_BRAND_PATHS) {
      const disposition = BRAND_PATH_REGISTER[rel];
      expect(disposition?.retired).toBeDefined();
      expect(disposition!.retired!.commit).toBe(RETIRING_COMMIT);
    }
  });

  it('all retired paths report removed, not a bare pass, and name the retiring commit', () => {
    const checks = retiredChecks();
    for (const rel of RETIRED_BRAND_PATHS) {
      const check = checks.find((c) => c.targetFile === rel);
      expect(check).toBeDefined();
      expect(check!.status).toBe('removed');
      expect(check!.detail).toContain(RETIRING_COMMIT);
    }
  });

  it('historically restored paths no longer report a current restoration', () => {
    const checks = retiredChecks();
    for (const [rel, restoringCommit] of Object.entries(RESTORED)) {
      const check = checks.find((c) => c.targetFile === rel);
      expect(check).toBeDefined();
      expect(check!.status).toBe('removed');
      expect(check!.detail).toContain(RETIRING_COMMIT);
      expect(check!.detail).not.toContain(restoringCommit);
    }
  });

  it('the report clears the three asset failures only after every alias is absent', () => {
    const report = runLogoUsageEnforcement();
    expect(report.failCount).toBe(0);
    expect(report.removedCount).toBe(10);
  });

  it('a restoration with no commit named is reported as unexplained rather than passing over it', () => {
    // The guard that can fail: a register entry that omits `restoredAt` while
    // the file is present must say the restoration is unaccounted for. Without
    // this branch a future entry could reintroduce the evidence-free verdict
    // this item exists to remove, and every other case here would still pass.
    const { status, detail } = resolvePathStatus(
      'public/brand/undeclared-return.svg',
      true,
      {
        'public/brand/undeclared-return.svg': {
          retired: {
            scope: 'path',
            commit: RETIRING_COMMIT,
            slice: 'fixture',
            replacement: null,
            note: 'fixture',
          },
        },
      },
      'FIXTURE_REGISTER',
    );
    expect(status).toBe('fail');
    expect(detail).toContain('no commit is named');
  });

  it('a restoration commit is only reported when the file is actually present', () => {
    // `restoredAt` is a claim about history, and the only observation available
    // is presence. An absent path with a restoredAt entry must resolve as
    // removed and must NOT repeat the restoration claim — otherwise the
    // register could assert a return that the tree contradicts.
    const { status, detail } = resolvePathStatus(
      'public/brand/never-came-back.svg',
      false,
      {
        'public/brand/never-came-back.svg': {
          retired: {
            scope: 'path',
            commit: RETIRING_COMMIT,
            slice: 'fixture',
            replacement: null,
            note: 'fixture',
            restoredAt: { commit: 'deadbeef1', note: 'fixture restoration' },
          },
        },
      },
      'FIXTURE_REGISTER',
    );
    expect(status).toBe('removed');
    expect(detail).not.toContain('deadbeef1');
  });
});

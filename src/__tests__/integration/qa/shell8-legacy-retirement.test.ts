/**
 * Wave 29 SHELL8 — Legacy Shell Code Retirement
 *
 * Verifies that TopBar.tsx and PrimaryNav.tsx have been correctly retired
 * (deleted from the repository) and that the QA check modules correctly
 * reflect the inverted logic (absence = pass, presence = fail).
 */

import * as fs from 'fs';
import * as path from 'path';

import { BRAND_PATH_REGISTER } from '@/lib/qa/logo-usage-enforcement';
import { resolvePathStatus } from '@/lib/qa/path-disposition';
import {
  runActiveRouteShellVerification,
} from '@/lib/qa/active-route-shell-verification';

import {
  runLogoUsageEnforcement,
  listLogoEnforcementTargetFiles,
} from '@/lib/qa/logo-usage-enforcement';

const REPO_ROOT = path.resolve(__dirname, '../../../../../');

describe('SHELL8 — Legacy Shell Code Retirement', () => {
  describe('Filesystem state', () => {
    it('TopBar.tsx has been deleted from src/components/chrome/', () => {
      const topBarPath = path.join(REPO_ROOT, 'src/components/chrome/TopBar.tsx');
      expect(fs.existsSync(topBarPath)).toBe(false);
    });

    it('PrimaryNav.tsx has been deleted from src/components/chrome/', () => {
      const primaryNavPath = path.join(REPO_ROOT, 'src/components/chrome/PrimaryNav.tsx');
      expect(fs.existsSync(primaryNavPath)).toBe(false);
    });
  });

  describe('Active Route Shell Verification — QA28-C15', () => {
    it('QA28-C15 check is present in the report', () => {
      const report = runActiveRouteShellVerification();
      const c15 = report.checks.find((c) => c.checkId === 'QA28-C15');
      expect(c15).toBeDefined();
    });

    it('QA28-C15 status is pass (TopBar is absent — correctly retired)', () => {
      const report = runActiveRouteShellVerification();
      const c15 = report.checks.find((c) => c.checkId === 'QA28-C15');
      expect(c15!.status).toBe('pass');
    });

    it('QA28-C15 description references SHELL8 retirement', () => {
      const report = runActiveRouteShellVerification();
      const c15 = report.checks.find((c) => c.checkId === 'QA28-C15');
      expect(c15!.description).toContain('SHELL8');
    });

    it('QA28-C15 detail confirms TopBar has been retired', () => {
      const report = runActiveRouteShellVerification();
      const c15 = report.checks.find((c) => c.checkId === 'QA28-C15');
      // When TopBar is absent the detail says it has been correctly retired
      expect(c15!.detail.toLowerCase()).toContain('retired');
    });
  });

  describe('Logo Usage Enforcement — BRAND2-C4', () => {
    it('BRAND2-C4 check is present in the report', () => {
      const report = runLogoUsageEnforcement();
      const c4 = report.checks.find((c) => c.checkId === 'BRAND2-C4');
      expect(c4).toBeDefined();
    });

    it('BRAND2-C4 does not claim a retirement no commit performed', () => {
      // These two cases asserted `status === 'pass'` and that the description
      // contained 'SHELL8', which is what kept the invented attribution in
      // place: the check printed "correctly absent — retired in Wave 29
      // SHELL8", and the suite checked that it kept saying so.
      //
      // Re-measured with `git log origin/main --diff-filter=AD`, no commit on
      // this history has ever added or removed src/components/chrome/TopBar.tsx.
      // No wave retired it. The path is absent and undeclared, which is an
      // open question, not a completed retirement — so the honest status is
      // `deferred` with the owning item named, and the description must stop
      // crediting a wave that cannot be shown to have done it.
      const report = runLogoUsageEnforcement();
      const c4 = report.checks.find((c) => c.checkId === 'BRAND2-C4');

      expect(c4!.status).toBe('deferred');
      expect(c4!.description).not.toContain('SHELL8');
      expect(c4!.detail).not.toMatch(/Wave 29/);
    });

    it('BRAND2-C4 says what was measured and who owns the call', () => {
      // The other half: dropping the false claim is only an improvement if
      // something true replaces it. A check that says nothing is not better
      // than one that says the wrong thing.
      const report = runLogoUsageEnforcement();
      const c4 = report.checks.find((c) => c.checkId === 'BRAND2-C4');

      expect(c4!.detail).toMatch(/no commit on this history/i);
      expect(c4!.detail).toContain('T-532');
    });

    it('undecided claims nothing about absence, where retired does', () => {
      // Written first as "it would fail if the file came back", which is what
      // a `retired` entry does. It is not what `undecided` does, and the case
      // failed until the expectation was corrected rather than the code.
      //
      // The distinction is the whole reason this path is undecided: `retired`
      // asserts the file should be gone, so its return is a contradiction and
      // a failure. `undecided` asserts only that nobody has ruled, so the
      // file appearing is simply a file appearing. Claiming otherwise would
      // reintroduce, in the other direction, the invented certainty this
      // change removed.
      const topBarPresent = resolvePathStatus(
        'src/components/chrome/TopBar.tsx',
        true,
        BRAND_PATH_REGISTER,
        'BRAND_PATH_REGISTER',
      );
      expect(topBarPresent.status).toBe('pass');

      // The contrast, against a genuinely retired path in the same register,
      // so this is not a claim about one entry but about the two dispositions.
      const retiredPath = 'public/brand/abarva-logo.svg';
      const retiredPresent = resolvePathStatus(
        retiredPath,
        true,
        BRAND_PATH_REGISTER,
        'BRAND_PATH_REGISTER',
      );
      expect(retiredPresent.status).toBe('fail');
      expect(retiredPresent.detail).toMatch(/declared retired/i);
    });

    it('listLogoEnforcementTargetFiles() does NOT include TopBar.tsx', () => {
      const files = listLogoEnforcementTargetFiles();
      const hasTopBar = files.some((f) => f.includes('TopBar'));
      expect(hasTopBar).toBe(false);
    });

    it('listLogoEnforcementTargetFiles() returns at least 4 files', () => {
      const files = listLogoEnforcementTargetFiles();
      expect(files.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Overall QA report integrity after SHELL8', () => {
    it('active-route-shell-verification report has no failures', () => {
      const report = runActiveRouteShellVerification();
      expect(report.failCount).toBe(0);
    });

    it('logo-usage-enforcement report has no failures', () => {
      const report = runLogoUsageEnforcement();
      expect(report.failCount).toBe(0);
    });
  });
});

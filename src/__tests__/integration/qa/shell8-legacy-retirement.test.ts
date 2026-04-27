/**
 * Wave 29 SHELL8 — Legacy Shell Code Retirement
 *
 * Verifies that TopBar.tsx and PrimaryNav.tsx have been correctly retired
 * (deleted from the repository) and that the QA check modules correctly
 * reflect the inverted logic (absence = pass, presence = fail).
 */

import * as fs from 'fs';
import * as path from 'path';

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

    it('BRAND2-C4 status is pass (TopBar.tsx correctly absent)', () => {
      const report = runLogoUsageEnforcement();
      const c4 = report.checks.find((c) => c.checkId === 'BRAND2-C4');
      expect(c4!.status).toBe('pass');
    });

    it('BRAND2-C4 description references SHELL8', () => {
      const report = runLogoUsageEnforcement();
      const c4 = report.checks.find((c) => c.checkId === 'BRAND2-C4');
      expect(c4!.description).toContain('SHELL8');
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

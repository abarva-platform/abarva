/**
 * PX2 — Page Blueprint Compliance Validator Tests
 * Verifies that all 10 target blueprints are compliant with the 10 mandatory sections
 * defined in PAGE_EXPERIENCE_BLUEPRINT_STANDARD.md.
 * All checks are deterministic filesystem scans. No model calls. No network calls.
 */

import {
  runPageBlueprintComplianceCheck,
  getUIWorkOrderRequirements,
  getNonCompliantBlueprints,
  UI_WORK_ORDER_REQUIREMENTS,
  PageBlueprintComplianceReport,
  BlueprintComplianceRecord,
} from '../../../lib/qa/page-blueprint-compliance';

describe('PX2 — Page Blueprint Compliance Validator', () => {
  let report: PageBlueprintComplianceReport;

  beforeAll(() => {
    report = runPageBlueprintComplianceCheck();
  });

  describe('runPageBlueprintComplianceCheck()', () => {
    it('returns without throwing', () => {
      expect(() => runPageBlueprintComplianceCheck()).not.toThrow();
    });

    it('totalBlueprints === 10', () => {
      expect(report.totalBlueprints).toBe(10);
    });

    it('every record has required fields: blueprintFile, pageName, exists, overallStatus, sectionChecks', () => {
      report.records.forEach((record: BlueprintComplianceRecord) => {
        expect(record).toHaveProperty('blueprintFile');
        expect(record).toHaveProperty('pageName');
        expect(record).toHaveProperty('exists');
        expect(record).toHaveProperty('overallStatus');
        expect(record).toHaveProperty('sectionChecks');
        expect(typeof record.blueprintFile).toBe('string');
        expect(typeof record.pageName).toBe('string');
        expect(typeof record.exists).toBe('boolean');
        expect(['compliant', 'non_compliant', 'deferred', 'missing']).toContain(
          record.overallStatus,
        );
        expect(Array.isArray(record.sectionChecks)).toBe(true);
      });
    });

    it('compliantCount + nonCompliantCount + missingCount + deferredCount === totalBlueprints', () => {
      const sum =
        report.compliantCount +
        report.nonCompliantCount +
        report.missingCount +
        report.deferredCount;
      expect(sum).toBe(report.totalBlueprints);
    });

    it('overallStatus is "pass" — all 10 blueprints should be compliant after PX1', () => {
      expect(report.overallStatus).toBe('pass');
    });

    it('nonCompliantCount === 0', () => {
      expect(report.nonCompliantCount).toBe(0);
    });

    it('missingCount === 0', () => {
      expect(report.missingCount).toBe(0);
    });

    it('every compliant record has all 10 sectionChecks', () => {
      report.records
        .filter((r: BlueprintComplianceRecord) => r.overallStatus === 'compliant')
        .forEach((record: BlueprintComplianceRecord) => {
          expect(record.sectionChecks).toHaveLength(10);
          record.sectionChecks.forEach(check => {
            expect(check).toHaveProperty('section');
            expect(check).toHaveProperty('required');
            expect(check).toHaveProperty('status');
            expect(check).toHaveProperty('detail');
            expect(check.required).toBe(true);
            expect(check.status).toBe('compliant');
          });
        });
    });

    it('report has a reportId', () => {
      expect(typeof report.reportId).toBe('string');
      expect(report.reportId.length).toBeGreaterThan(0);
    });

    it('report has caveat text', () => {
      expect(typeof report.caveat).toBe('string');
      expect(report.caveat.length).toBeGreaterThan(0);
    });

    it('report has deterministicSeed: true', () => {
      expect(report.deterministicSeed).toBe(true);
    });

    it('uiWorkOrderRequirements array is present on report', () => {
      expect(Array.isArray(report.uiWorkOrderRequirements)).toBe(true);
      expect(report.uiWorkOrderRequirements).toHaveLength(6);
    });
  });

  describe('getUIWorkOrderRequirements()', () => {
    it('returns array of length 6', () => {
      const reqs = getUIWorkOrderRequirements();
      expect(Array.isArray(reqs)).toBe(true);
      expect(reqs).toHaveLength(6);
    });

    it('each requirement is a non-empty string', () => {
      const reqs = getUIWorkOrderRequirements();
      reqs.forEach(req => {
        expect(typeof req).toBe('string');
        expect(req.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getNonCompliantBlueprints()', () => {
    it('returns empty array when all blueprints are compliant', () => {
      const nonCompliant = getNonCompliantBlueprints(report);
      expect(Array.isArray(nonCompliant)).toBe(true);
      expect(nonCompliant).toHaveLength(0);
    });
  });

  describe('UI_WORK_ORDER_REQUIREMENTS constant', () => {
    it('has 6 entries', () => {
      expect(UI_WORK_ORDER_REQUIREMENTS).toHaveLength(6);
    });

    it('includes blueprint-followed requirement', () => {
      expect(
        UI_WORK_ORDER_REQUIREMENTS.some(r => r.toLowerCase().includes('blueprint followed')),
      ).toBe(true);
    });

    it('includes agent-centric enforcement requirement', () => {
      expect(
        UI_WORK_ORDER_REQUIREMENTS.some(r => r.toLowerCase().includes('agent-centric')),
      ).toBe(true);
    });

    it('includes deterministic/live caveat requirement', () => {
      expect(
        UI_WORK_ORDER_REQUIREMENTS.some(r => r.toLowerCase().includes('deterministic')),
      ).toBe(true);
    });
  });
});

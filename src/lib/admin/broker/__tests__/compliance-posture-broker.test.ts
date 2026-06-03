/**
 * Compliance posture broker tests · Wave 3 PR-4
 *
 * The broker is a pure read of the static `COMPLIANCE_CONFIG`. The
 * tests guard the contract: shape returned, every card carries a
 * `dataSource` flag, SOC 2 NEVER reports as certified from the config
 * we ship (honesty doctrine), the breach SLA is the expected
 * 72-hour window aligned with GDPR Art. 33, and OFAC screening is
 * committed before customer onboarding.
 */

import { getCompliancePosture } from '../compliance-posture-broker';
import { COMPLIANCE_CONFIG } from '@/lib/admin/compliance-config';

describe('compliance-posture-broker', () => {
  it('returns the four-card posture shape', async () => {
    const posture = await getCompliancePosture();
    expect(posture).toEqual(
      expect.objectContaining({
        soc2: expect.any(Object),
        gdpr: expect.any(Object),
        dpa: expect.any(Object),
        breachSla: expect.any(Object),
        ofacScreening: expect.any(Object),
        lastReviewedAt: expect.any(String),
      }),
    );
  });

  it('stamps every card with dataSource = "config" today', async () => {
    const posture = await getCompliancePosture();
    expect(posture.soc2.dataSource).toBe('config');
    expect(posture.gdpr.dataSource).toBe('config');
    expect(posture.dpa.dataSource).toBe('config');
    expect(posture.breachSla.dataSource).toBe('config');
    expect(posture.ofacScreening.dataSource).toBe('config');
  });

  it('does NOT claim SOC 2 certification (honesty doctrine)', async () => {
    const posture = await getCompliancePosture();
    expect(posture.soc2.status).not.toBe('certified');
    expect(posture.soc2.statusLabel.toLowerCase()).not.toContain('certified');
  });

  it('commits to a 72-hour breach notification window', async () => {
    const posture = await getCompliancePosture();
    expect(posture.breachSla.notificationHours).toBe(72);
    expect(posture.breachSla.playbookHref).toMatch(/runbook|playbook/i);
  });

  it('declares at least one data-residency region for GDPR', async () => {
    const posture = await getCompliancePosture();
    expect(posture.gdpr.dataResidencyRegions.length).toBeGreaterThan(0);
  });

  it('commits to sanctions screening before customer onboarding', async () => {
    const posture = await getCompliancePosture();
    expect(posture.ofacScreening.status).toBe('committed');
    expect(posture.ofacScreening.statusLabel).toMatch(/screen before customer onboarding/i);
    expect(posture.ofacScreening.evidenceRequired).toContain('manual_review_disposition');
  });

  it('passes through the lastReviewedAt stamp from the config', async () => {
    const posture = await getCompliancePosture();
    expect(posture.lastReviewedAt).toBe(COMPLIANCE_CONFIG.lastReviewedAt);
  });
});

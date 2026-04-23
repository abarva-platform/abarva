import { validateEvidenceCitations } from '@/lib/integrity/evidence-citations';

describe('evidence citation resolution', () => {
  it('resolves every authored and rendered Morrison citation against the evidence base', () => {
    const report = validateEvidenceCitations(new Date('2026-04-23T00:00:00.000Z'));

    expect(report.summary.evidenceBaseCount).toBeGreaterThanOrEqual(1);
    expect(report.evidenceBases.some((base) => base.programCode === 'APX-01')).toBe(true);
    expect(report.summary.renderModelReferenceCount).toBeGreaterThan(0);
    expect(report.summary.unresolvedCount).toBe(0);
    expect(report.summary.resolutionRate).toBe(1);
  });
});

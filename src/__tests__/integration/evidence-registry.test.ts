import {
  getEvidenceDetail,
  getEvidenceEntriesForDeliverable,
  getPatternEvidenceMetrics,
  getProgramEvidenceRegistry,
} from '@/lib/deliverables/evidence-registry';

describe('evidence registry', () => {
  it('loads program evidence by tenant/program route', () => {
    const registry = getProgramEvidenceRegistry(
      'apex-retail',
      'morrison-owned-brand-margin-recovery',
    );

    expect(registry).not.toBeNull();
    expect(registry?.programCode).toBe('APX-01');
    expect(registry?.evidenceCount).toBeGreaterThan(10);
  });

  it('maps deliverable citations to real authored evidence entries', () => {
    const entries = getEvidenceEntriesForDeliverable(
      'meridian',
      'ambient-clinical-value-chain-activation',
      'D16',
    );

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((entry) => entry.id === 'E50')).toBe(true);
    expect(entries.every((entry) => entry.href.includes('/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/evidence/'))).toBe(true);
  });

  it('computes pattern evidence metrics from browsable registries instead of literals', () => {
    const metrics = getPatternEvidenceMetrics('ambient-clinical-value-chain', 'meridian');

    expect(metrics.evidenceCount).toBeGreaterThan(0);
    expect(metrics.entries.length).toBe(metrics.evidenceCount);
    expect(metrics.lastUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('resolves canonical evidence detail routes', () => {
    const detail = getEvidenceDetail(
      'apex-retail',
      'morrison-owned-brand-margin-recovery',
      'E10',
    );

    expect(detail).not.toBeNull();
    expect(detail?.programCode).toBe('APX-01');
    expect(detail?.href).toBe('/tenant/apex-retail/programs/morrison-owned-brand-margin-recovery/evidence/E10');
  });
});

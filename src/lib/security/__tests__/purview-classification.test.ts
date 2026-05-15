import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  evaluateSensitiveUploadWithPurview,
  setPurviewClient,
  resetPurviewClient,
  type PurviewClient,
} from '../purview-classification';

describe('B5b · evaluateSensitiveUploadWithPurview', () => {
  beforeEach(() => {
    resetPurviewClient();
  });

  it('degraded mode: returns sync result with purviewReached=false when no client configured', async () => {
    const result = await evaluateSensitiveUploadWithPurview({
      filename: 'kpi.csv',
      mimeType: 'text/csv',
      bytes: new TextEncoder().encode('quarterly KPI snapshot, all aggregates'),
      tenantClientKey: 'apexretail',
    });
    expect(result.purviewReached).toBe(false);
    expect(result.purviewLabels).toEqual([]);
    expect(result.decision).toBe('allow');
  });

  it('fast-deny: skips Purview when sync guard already quarantines', async () => {
    let purviewCalled = false;
    const stub: PurviewClient = {
      async classify() {
        purviewCalled = true;
        return { reached: true, labels: [] };
      },
    };
    setPurviewClient(stub);

    const result = await evaluateSensitiveUploadWithPurview({
      filename: 'leak.txt',
      mimeType: 'text/plain',
      bytes: new TextEncoder().encode('Member SSN: 123-45-6789. Care plan attached.'),
      declaredClassification: 'regulated_phi_pii_suspected',
      tenantClientKey: 'meridian',
    });
    expect(result.decision).toBe('quarantine');
    expect(purviewCalled).toBe(false);
    expect(result.purviewReached).toBe(false);
  });

  it('Purview upgrade: pattern guard says allow but Purview flags HIPAA → quarantine', async () => {
    const stub: PurviewClient = {
      async classify() {
        return {
          reached: true,
          labels: [
            {
              label: 'Healthcare PHI',
              sensitivity: 'highly_confidential',
              matchedRules: ['HIPAA-PHI-1', 'US-PHI-General'],
            },
          ],
        };
      },
    };
    setPurviewClient(stub);

    const result = await evaluateSensitiveUploadWithPurview({
      filename: 'patient-notes.txt',
      mimeType: 'text/plain',
      bytes: new TextEncoder().encode(
        'Notes from the care meeting include items that Purview will catch but our regex would not.',
      ),
      tenantClientKey: 'meridian',
    });
    expect(result.purviewReached).toBe(true);
    expect(result.decision).toBe('quarantine');
    expect(result.declaredClassification).toBe('regulated_phi_pii_suspected');
    expect(result.purviewLabels).toHaveLength(1);
  });

  it('Purview reached but clean: keeps sync decision, enriches labels for audit', async () => {
    const stub: PurviewClient = {
      async classify() {
        return {
          reached: true,
          labels: [
            {
              label: 'Internal Business',
              sensitivity: 'general',
              matchedRules: ['internal-only-marker'],
            },
          ],
        };
      },
    };
    setPurviewClient(stub);

    const result = await evaluateSensitiveUploadWithPurview({
      filename: 'roadmap.md',
      mimeType: 'text/markdown',
      bytes: new TextEncoder().encode('Q3 product roadmap, ungraded business content.'),
      tenantClientKey: 'apexretail',
    });
    expect(result.purviewReached).toBe(true);
    expect(result.decision).toBe('allow');
    expect(result.purviewLabels).toHaveLength(1);
  });
});

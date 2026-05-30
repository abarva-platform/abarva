jest.mock('server-only', () => ({}));

import { retrieveRetailOverlaySources } from './retail-overlay';
import { azureRead } from '@/lib/data-plane/azureRead';
import type { CanonicalTenant } from '@/lib/tenant/CanonicalTenant';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

const mockQuery = jest.mocked(azureRead.query);

const apexTenant: CanonicalTenant = {
  appClientKey: 'apexretail',
  canonicalKey: 'apex-retail',
  brokerKey: 'apex-retail',
  clientId: 'apex-client',
  displayName: 'Apex Retail Group',
  industryCode: 'RETAIL',
  aliases: ['apex-retail'],
  source: 'body',
};

describe('retrieveRetailOverlaySources', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('returns tenant-scoped retail-v1 overlay sources with pattern provenance', async () => {
    mockQuery.mockResolvedValue([
      {
        chunk_id: 'retail-v1:t.5.03',
        chunk_text: '**T.5.03 — Computer Vision in Stores Data Foundation**',
        source_doc: 'Retail Overlay v1 Wave 3: CX to AI',
        source_pack: 'T.5',
        source_super_category: 'T',
        pattern_id: 'T.5.03',
        chunk_role: 'pattern',
        rank_score: 0.42,
      },
    ]);

    const sources = await retrieveRetailOverlaySources(
      apexTenant,
      'How should we handle shrink and self-checkout risk?',
      'AI_TOOLING',
    );

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("chunk_metadata->>'overlay_namespace' = $2"),
      expect.arrayContaining(['apex-retail', 'retail-v1', 'handle OR shrink OR self-checkout OR risk']),
      { missingTable: 'empty' },
    );
    expect(sources).toEqual([
      expect.objectContaining({
        type: 'PATTERN',
        id: 'retail-v1:t.5.03',
        name: expect.stringContaining('T.5.03'),
        detail: expect.stringContaining('overlay=retail-v1'),
      }),
    ]);
    expect(sources[0]?.detail).toContain('source_pack=T.5');
  });

  it('does not retrieve retail overlay rows for non-retail tenants', async () => {
    const sources = await retrieveRetailOverlaySources(
      { ...apexTenant, canonicalKey: 'meridian-health', industryCode: 'HEALTHCARE_IDN' },
      'How should we handle patient access?',
      'AI_TOOLING',
    );

    expect(sources).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

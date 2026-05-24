import type { PoolClient } from 'pg';
import { withCorpusClient } from '@/lib/corpus/db';
import {
  bindFrameworkOverlayFunctionPackForArtifact,
  resolveFrameworkOverlayFunctionPack,
} from '../framework-overlay-function-pack';
import { careDeliveryCareManagementPack } from '../healthcare/care-delivery-care-management';

jest.mock('@/lib/corpus/db', () => ({
  withCorpusClient: jest.fn(),
}));

const withCorpusClientMock = withCorpusClient as jest.MockedFunction<
  typeof withCorpusClient
>;

function mockRows(rows: unknown[]) {
  const query = jest.fn().mockResolvedValue({ rows });
  withCorpusClientMock.mockImplementation(async (fn) =>
    fn({ query } as unknown as PoolClient),
  );
  return query;
}

describe('framework overlay Function Pack resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the published DB-backed Function Pack overlay without using the code registry', async () => {
    const query = mockRows([
      {
        id: 'overlay-1',
        client_id: null,
        vertical_key: careDeliveryCareManagementPack.industryKey,
        function_key: careDeliveryCareManagementPack.functionKey,
        overlay_kind: 'function-pack',
        status: 'published',
        version: 3,
        framework_jsonb: careDeliveryCareManagementPack,
        source_corpus_pattern_ids: ['11111111-1111-4111-8111-111111111111'],
        depth_score: '10',
      },
    ]);

    const overlay = await resolveFrameworkOverlayFunctionPack(
      'healthcare-provider',
      'care_delivery_care_management',
      { clientId: '22222222-2222-4222-8222-222222222222' },
    );

    expect(overlay?.pack.functionLabel).toBe(
      careDeliveryCareManagementPack.functionLabel,
    );
    expect(overlay?.version).toBe(3);
    expect(overlay?.sourceCorpusPatternIds).toEqual([
      '11111111-1111-4111-8111-111111111111',
    ]);
    expect(query.mock.calls[0][0]).toContain('FROM public.framework_overlays');
    expect(query.mock.calls[0][0]).toContain('client_id = $4::uuid');
  });

  it('does not fall back to in-code Function Pack content when the DB overlay is missing', async () => {
    mockRows([]);

    const binding = await bindFrameworkOverlayFunctionPackForArtifact(
      'healthcare-provider',
      'care_delivery_care_management',
      'business_case',
      [],
    );

    expect(binding.bound).toBe(false);
    expect(binding.expectedMetrics).toEqual([]);
    expect(binding.fallbackNote).toContain(
      'does not fall back to in-code Function Pack content',
    );
  });

  it('binds an already-loaded DB pack to the inherited artifact outline', async () => {
    mockRows([
      {
        id: 'overlay-1',
        client_id: null,
        vertical_key: careDeliveryCareManagementPack.industryKey,
        function_key: careDeliveryCareManagementPack.functionKey,
        overlay_kind: 'function-pack',
        status: 'published',
        version: 1,
        framework_jsonb: careDeliveryCareManagementPack,
        source_corpus_pattern_ids: [],
        depth_score: 10,
      },
    ]);

    const binding = await bindFrameworkOverlayFunctionPackForArtifact(
      'healthcare-provider',
      'care_delivery_care_management',
      'business_case',
      ['care_gap_closure_rate'],
    );

    const expectedOutline =
      careDeliveryCareManagementPack.deliverableOutlines.find(
        (outline) => outline.artifact === 'business_case',
      );

    expect(binding.bound).toBe(true);
    expect(binding.deliverableOutline.map((section) => section.heading)).toEqual(
      expectedOutline?.sections.map((section) => section.heading),
    );
    expect(binding.seedGaps.map((gap) => gap.metricKey)).not.toContain(
      'care_gap_closure_rate',
    );
  });
});

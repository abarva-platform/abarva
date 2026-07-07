import { getPortfolioValueRollup } from '../repository';
import { azureRead } from '@/lib/data-plane/azureRead';
import type { TenancyCtx } from '@/lib/programs/types.db';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

const queryMock = azureRead.query as jest.MockedFunction<typeof azureRead.query>;

const ctx: TenancyCtx = {
  clientId: 'apexretail',
  clientKey: 'apex-retail',
  userId: 'user-1',
  email: 'cio@apex-retail.example.com',
  role: 'cio',
};

describe('Tower portfolio value rollup through azureRead', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('reads moves, Source projected value, and dependency arrows through azureRead', async () => {
    queryMock
      .mockResolvedValueOnce([
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'AI SDLC Acceleration',
          status: 'active',
          lifecycle_state: 'active',
          current_phase: 5,
          current_gate: 'gate-5',
          template_kind: 'Move',
          template_slug: 'it-productivity',
          template_name: 'IT Productivity',
          projected_usd: '1000000',
          tracked_usd: '250000',
          verified_usd: '100000',
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'AMS Source Event',
          status: 'active',
          lifecycle_state: 'active',
          current_phase: 6,
          current_gate: 'source-value',
          template_kind: 'SourceWorkflow',
          template_slug: 'source-workflow',
          template_name: 'Source Workflow',
          projected_usd: '200000',
          tracked_usd: '50000',
          verified_usd: '25000',
        },
      ])
      .mockResolvedValueOnce([{ projected_usd: '300000' }])
      .mockResolvedValueOnce([
        {
          id: 'dep-1',
          from_move_id: '11111111-1111-1111-1111-111111111111',
          from_move_name: 'AI SDLC Acceleration',
          to_move_id: '22222222-2222-2222-2222-222222222222',
          to_move_name: 'AMS Source Event',
          relation_type: 'informs',
          note: 'Source savings fund the delivery wave.',
        },
      ]);

    await expect(getPortfolioValueRollup(ctx)).resolves.toMatchObject({
      clientId: 'apexretail',
      totals: {
        projectedUsd: 1500000,
        trackedUsd: 300000,
        verifiedUsd: 125000,
        activeMoveCount: 1,
        activeSourceWorkflowCount: 1,
      },
      p10Source: 'move_dependencies',
      arrows: [
        {
          id: 'dep-1',
          fromMoveName: 'AI SDLC Acceleration',
          toMoveName: 'AMS Source Event',
        },
      ],
    });

    expect(queryMock).toHaveBeenCalledTimes(3);
    expect(queryMock.mock.calls[0]?.[0]).toContain('FROM public.engagements e');
    expect(queryMock.mock.calls[0]?.[0]).not.toContain('mi.deleted_at');
    expect(queryMock.mock.calls[0]?.[1]).toEqual(['apexretail']);
    expect(queryMock.mock.calls[1]?.[0]).toContain('FROM public.source_value_lines svl');
    expect(queryMock.mock.calls[1]?.[1]).toEqual(['apexretail']);
    expect(queryMock.mock.calls[2]?.[0]).toContain('FROM public.move_dependencies md');
    expect(queryMock.mock.calls[2]?.[1]).toEqual([
      'apexretail',
      [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
      ],
    ]);
  });

  it('keeps Source projected value fail-soft and emits fallback arrows when DAG is empty', async () => {
    queryMock
      .mockResolvedValueOnce([
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'AI SDLC Acceleration',
          status: 'active',
          lifecycle_state: 'active',
          current_phase: 5,
          current_gate: 'gate-5',
          template_kind: 'Move',
          template_slug: 'it-productivity',
          template_name: 'IT Productivity',
          projected_usd: '1000000',
          tracked_usd: '250000',
          verified_usd: '100000',
        },
      ])
      .mockRejectedValueOnce(new Error('source value table unavailable'))
      .mockResolvedValueOnce([]);

    const rollup = await getPortfolioValueRollup(ctx);

    expect(rollup.totals.projectedUsd).toBe(1000000);
    expect(rollup.p10Source).toBe('fallback');
    expect(rollup.arrows[0]?.id).toBe('fallback-11111111-1111-1111-1111-111111111111-source');
  });
});

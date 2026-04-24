jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: jest.fn(),
}));

import { getServerSupabase } from '@/lib/supabase-server';
import { getEngagementByAnyId } from '@/lib/db/engagement';

type MaybeSingleResult = {
  field: string;
  data: Record<string, unknown> | null;
  error?: unknown;
};

function createSupabaseMock(results: MaybeSingleResult[]) {
  let lastField = '';
  const queue = [...results];
  type QueryStub = {
    select: jest.Mock<QueryStub, []>;
    eq: jest.Mock<QueryStub, [string]>;
    maybeSingle: jest.Mock<Promise<{ data: Record<string, unknown> | null; error: unknown | null }>, []>;
  };
  const query = {} as QueryStub;
  query.select = jest.fn<QueryStub, []>(() => query);
  query.eq = jest.fn<QueryStub, [string]>((field: string) => {
    lastField = field;
    return query;
  });
  query.maybeSingle = jest.fn<Promise<{ data: Record<string, unknown> | null; error: unknown | null }>, []>(async () => {
    const next = queue.shift();
    if (!next) {
      throw new Error(`Unexpected maybeSingle() call for ${lastField}`);
    }
    expect(lastField).toBe(next.field);
    return {
      data: next.data,
      error: next.error ?? null,
    };
  });

  return {
    client: {
      from: jest.fn(() => query),
    },
    query,
  };
}

const mockedGetServerSupabase = getServerSupabase as jest.MockedFunction<typeof getServerSupabase>;

describe('getEngagementByAnyId', () => {
  afterEach(() => {
    mockedGetServerSupabase.mockReset();
  });

  test('returns the graph-node match without falling back to UUID lookup', async () => {
    const row = { id: '892a57af-6704-400b-9149-0107fa4008aa', graph_node_id: 'eng_meridian_ai_readiness' };
    const stub = createSupabaseMock([{ field: 'graph_node_id', data: row }]);
    mockedGetServerSupabase.mockReturnValue(stub.client as unknown as ReturnType<typeof getServerSupabase>);

    await expect(getEngagementByAnyId('eng_meridian_ai_readiness')).resolves.toEqual(row);
    expect(stub.query.maybeSingle).toHaveBeenCalledTimes(1);
  });

  test('falls back to primary-key UUID lookup when graph node lookup misses', async () => {
    const row = { id: '892a57af-6704-400b-9149-0107fa4008aa', graph_node_id: 'eng_meridian_ai_readiness' };
    const stub = createSupabaseMock([
      { field: 'graph_node_id', data: null },
      { field: 'id', data: row },
    ]);
    mockedGetServerSupabase.mockReturnValue(stub.client as unknown as ReturnType<typeof getServerSupabase>);

    await expect(getEngagementByAnyId('892a57af-6704-400b-9149-0107fa4008aa')).resolves.toEqual(row);
    expect(stub.query.maybeSingle).toHaveBeenCalledTimes(2);
  });

  test('does not issue a UUID lookup for non-UUID misses', async () => {
    const stub = createSupabaseMock([{ field: 'graph_node_id', data: null }]);
    mockedGetServerSupabase.mockReturnValue(stub.client as unknown as ReturnType<typeof getServerSupabase>);

    await expect(getEngagementByAnyId('eng_unknown_program')).resolves.toBeNull();
    expect(stub.query.maybeSingle).toHaveBeenCalledTimes(1);
  });
});

import { runBrokeredGenomeQuery } from '@/lib/intelligence/genome-query-broker';
import { setNeo4jEnabledOverride } from '@/lib/graph/neo4j-gate';

const createMessageMock = jest.fn();
const sessionRunMock = jest.fn();
const sessionCloseMock = jest.fn();

jest.mock('@/lib/agent/stream', () => ({
  getAnthropicClient: () => ({
    messages: {
      create: createMessageMock,
    },
  }),
}));

jest.mock('@/lib/graph/driver', () => ({
  getGraphDriverIfEnabled: async () => ({
    session: () => ({
      run: sessionRunMock,
      close: sessionCloseMock,
    }),
  }),
}));

beforeAll(() => {
  // The broker now gates on `graph_neo4j_enabled`. These tests exercise
  // the "flag on" code path; the gate-off path is covered by
  // `src/__tests__/features/neo4j-gate.test.ts`.
  setNeo4jEnabledOverride(true);
});

afterAll(() => {
  setNeo4jEnabledOverride(null);
});

describe('runBrokeredGenomeQuery', () => {
  beforeEach(() => {
    createMessageMock.mockReset();
    sessionRunMock.mockReset();
    sessionCloseMock.mockReset();
    sessionCloseMock.mockResolvedValue(undefined);
  });

  it('assembles Sentinel broker context before translating and executing the tenant-scoped query', async () => {
    createMessageMock.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            cypher:
              'MATCH (e:Engagement {client_id: $callerClientId})-[:TRIGGERED]->(p:GenomePattern) RETURN p.code AS code LIMIT 50',
            result_shape: 'patterns',
            explanation: 'Find tenant-scoped triggered patterns.',
          }),
        },
      ],
    });
    sessionRunMock.mockResolvedValue({
      records: [
        {
          keys: ['code'],
          get: (key: string) => (key === 'code' ? 'F008' : null),
        },
      ],
    });

    const result = await runBrokeredGenomeQuery({
      query: 'Which Genome patterns are active?',
      clientId: 'client-apex-uuid',
      clientKey: 'apexretail',
    });

    expect(result.status).toBe(200);
    expect(result.body.rows).toEqual([{ code: 'F008' }]);
    expect(result.body.broker).toMatchObject({
      tenantKey: 'apex-retail',
      itemCount: expect.any(Number),
      graphNodeCount: expect.any(Number),
      graphEdgeCount: expect.any(Number),
    });
    expect(createMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          expect.objectContaining({
            content: expect.stringContaining(
              'The request has already been resolved through AgentContextBroker for tenant "apex-retail".',
            ),
          }),
        ],
      }),
    );
    expect(sessionRunMock).toHaveBeenCalledWith(
      expect.stringContaining('$callerClientId'),
      { callerClientId: 'client-apex-uuid' },
    );
    expect(sessionCloseMock).toHaveBeenCalledTimes(1);
  });

  it('maps First Capital legacy client keys before assembling broker context', async () => {
    createMessageMock.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            cypher: null,
            explanation: 'No matching query.',
          }),
        },
      ],
    });

    const result = await runBrokeredGenomeQuery({
      query: 'What patterns are active?',
      clientId: 'client-first-capital-uuid',
      clientKey: 'arcturus',
    });

    expect(result.status).toBe(200);
    expect(result.body.broker?.tenantKey).toBe('first-capital');
    expect(result.body.error).toBeUndefined();
  });

  it('refuses generated writes before reaching Neo4j', async () => {
    createMessageMock.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            cypher: 'MATCH (e:Engagement {client_id: $callerClientId}) DELETE e',
            explanation: 'Bad write.',
          }),
        },
      ],
    });

    const result = await runBrokeredGenomeQuery({
      query: 'Delete my engagements',
      clientId: 'client-apex-uuid',
      clientKey: 'apexretail',
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toBe('write operations not permitted');
    expect(sessionRunMock).not.toHaveBeenCalled();
    expect(sessionCloseMock).not.toHaveBeenCalled();
  });

  it('refuses generated queries that omit callerClientId tenant scope', async () => {
    createMessageMock.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            cypher: 'MATCH (e:Engagement)-[:TRIGGERED]->(p:GenomePattern) RETURN p LIMIT 50',
            explanation: 'Unscoped query.',
          }),
        },
      ],
    });

    const result = await runBrokeredGenomeQuery({
      query: 'Show patterns',
      clientId: 'client-apex-uuid',
      clientKey: 'apexretail',
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toBe('query missing tenant scope ($callerClientId)');
    expect(sessionRunMock).not.toHaveBeenCalled();
  });
});

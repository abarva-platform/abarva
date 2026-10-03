// Regression test for the `graph_neo4j_enabled` feature flag gate.
// Verifies that with the flag OFF (the default) graph entry points
// return their fallback shape without ever loading `neo4j-driver` or
// invoking the driver. With the flag ON (forced via the test-only
// override) they still return the fallback: the graph data plane is Azure
// Postgres and `src/lib/graph/driver.ts` loads no external driver by design,
// so turning the flag on must not reopen one (T-795).

import { setNeo4jEnabledOverride, isNeo4jEnabled } from '@/lib/graph/neo4j-gate';
import {
  getGraphDriverIfEnabled,
  withGraphSession,
} from '@/lib/graph/driver';

describe('graph_neo4j_enabled gate', () => {
  afterEach(() => {
    setNeo4jEnabledOverride(null);
  });

  it('is OFF by default — registry policy fails closed', () => {
    setNeo4jEnabledOverride(null);
    expect(isNeo4jEnabled()).toBe(false);
    expect(isNeo4jEnabled({ clientKey: 'apexretail' })).toBe(false);
    expect(isNeo4jEnabled({ clientKey: 'meridian' })).toBe(false);
    expect(isNeo4jEnabled({ clientKey: 'arcturus' })).toBe(false);
  });

  it('getGraphDriverIfEnabled returns null when the flag is off', async () => {
    setNeo4jEnabledOverride(false);
    const driver = await getGraphDriverIfEnabled();
    expect(driver).toBeNull();
  });

  it('withGraphSession returns the fallback and never calls the work fn when the flag is off', async () => {
    setNeo4jEnabledOverride(false);
    const work = jest.fn(async () => 'should-not-run' as const);
    const result = await withGraphSession('graph-gate-test', work, 'fallback-shape');
    expect(result).toBe('fallback-shape');
    expect(work).not.toHaveBeenCalled();
  });

  it('flag ON still yields no external driver and never calls the work fn', async () => {
    // This case used to assert that the flag-on path opened a Neo4j driver and
    // threw on a missing NEO4J_URI. The driver module was replaced by an Azure
    // Postgres compatibility boundary that always returns the fallback, so the
    // old assertion was red for a reason the product intends. What the gate must
    // still guarantee is that the flag cannot resurrect an external driver.
    setNeo4jEnabledOverride(true);
    expect(isNeo4jEnabled()).toBe(true);
    process.env.NEO4J_URI = 'neo4j://gate-test.invalid:7687';
    try {
      await expect(getGraphDriverIfEnabled()).resolves.toBeNull();
      const work = jest.fn(async () => 'should-not-run' as const);
      const result = await withGraphSession('graph-gate-test', work, 'fallback-shape');
      expect(result).toBe('fallback-shape');
      expect(work).not.toHaveBeenCalled();
    } finally {
      delete process.env.NEO4J_URI;
    }
  });
});

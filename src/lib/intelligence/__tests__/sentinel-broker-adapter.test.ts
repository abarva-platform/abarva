import { buildSentinelContextBundle } from '@/lib/intelligence/sentinel-broker-adapter';

describe('buildSentinelContextBundle', () => {
  it('routes through the broker with Sentinel + intelligence defaults', () => {
    const bundle = buildSentinelContextBundle({
      tenantKey: 'apex-retail',
    });

    expect(bundle.tenantKey).toBe('apex-retail');
    expect(bundle.agentName).toBe('Sentinel');
    expect(bundle.surface).toBe('intelligence');
    expect(bundle.runtimeSafe).toBe(true);
    expect(bundle.directStoreAccess).toBe(false);
  });

  it('forwards explicit agentName and surface overrides', () => {
    const bundle = buildSentinelContextBundle({
      tenantKey: 'apex-retail',
      agentName: 'Atlas',
      surface: 'tower',
    });

    expect(bundle.agentName).toBe('Atlas');
    expect(bundle.surface).toBe('tower');
  });

  it('defaults raw L4 context to blocked unless explicitly allowed', () => {
    const bundle = buildSentinelContextBundle({
      tenantKey: 'apex-retail',
    });

    expect(bundle.blockedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tenantKey: 'apex-retail',
          reason: 'l4_raw_not_allowed',
        }),
      ]),
    );
  });

  it('forwards includeGraphNeighborhood to the broker', () => {
    const bundle = buildSentinelContextBundle({
      tenantKey: 'apex-retail',
      includeGraphNeighborhood: true,
    });

    expect(bundle.graphNeighborhood.included).toBe(true);
  });

  it('returns the broker unknown-tenant blocked bundle without throwing', () => {
    expect(() =>
      buildSentinelContextBundle({ tenantKey: 'unknown-tenant' }),
    ).not.toThrow();

    const bundle = buildSentinelContextBundle({ tenantKey: 'unknown-tenant' });

    expect(bundle.items).toHaveLength(0);
    expect(bundle.blockedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tenantKey: 'unknown-tenant',
          reason: 'unknown_tenant',
        }),
      ]),
    );
  });

  it('reasons corpus-wide without a programId', () => {
    const bundle = buildSentinelContextBundle({ tenantKey: 'apex-retail' });

    expect(bundle.items.length).toBeGreaterThan(0);
    expect(bundle.items.some((item) => item.kind === 'tenant_summary')).toBe(true);
  });
});

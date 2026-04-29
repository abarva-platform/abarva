import { buildProgramsContextBundle } from '@/lib/programs/programs-broker-adapter';

describe('buildProgramsContextBundle', () => {
  it('round-trips a valid Programs broker request', () => {
    const bundle = buildProgramsContextBundle({
      tenantKey: 'apex-retail',
      programId: 'program:apex:morrison-owned-brand-margin-recovery',
      agentName: 'Nexus',
      surface: 'programs',
      allowL4RawContext: true,
      includeGraphNeighborhood: true,
    });

    expect(bundle.tenantKey).toBe('apex-retail');
    expect(bundle.agentName).toBe('Nexus');
    expect(bundle.surface).toBe('programs');
    expect(bundle.runtimeSafe).toBe(true);
    expect(bundle.directStoreAccess).toBe(false);
    expect(bundle.items.length).toBeGreaterThan(0);
    expect(bundle.graphNeighborhood.included).toBe(true);
  });

  it('defaults to the semantic Programs surface when omitted', () => {
    const bundle = buildProgramsContextBundle({
      tenantKey: 'apex-retail',
      programId: 'program:apex:morrison-owned-brand-margin-recovery',
      agentName: 'Nexus',
    });

    expect(bundle.surface).toBe('programs');
  });

  it('defaults raw L4 context to blocked unless explicitly allowed', () => {
    const bundle = buildProgramsContextBundle({
      tenantKey: 'apex-retail',
      programId: 'program:apex:morrison-owned-brand-margin-recovery',
      agentName: 'Nexus',
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

  it('returns the broker unknown-tenant blocked bundle without throwing', () => {
    expect(() => buildProgramsContextBundle({
      tenantKey: 'unknown-tenant',
      programId: 'program:unknown:test',
      agentName: 'Nexus',
    })).not.toThrow();

    const bundle = buildProgramsContextBundle({
      tenantKey: 'unknown-tenant',
      programId: 'program:unknown:test',
      agentName: 'Nexus',
    });

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
});

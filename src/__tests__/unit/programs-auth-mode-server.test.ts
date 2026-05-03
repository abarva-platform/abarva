import { resolveProgramsAuthMode } from '@/lib/programs/programs-auth-mode-server';

describe('resolveProgramsAuthMode', () => {
  const origMode = process.env.PROGRAMS_AUTH_MODE;
  const origOverrides = process.env.PROGRAMS_AUTH_MODE_ROUTE_OVERRIDES;

  afterEach(() => {
    if (origMode === undefined) delete process.env.PROGRAMS_AUTH_MODE;
    else process.env.PROGRAMS_AUTH_MODE = origMode;
    if (origOverrides === undefined) delete process.env.PROGRAMS_AUTH_MODE_ROUTE_OVERRIDES;
    else process.env.PROGRAMS_AUTH_MODE_ROUTE_OVERRIDES = origOverrides;
  });

  it('defaults to service_role when unset', () => {
    delete process.env.PROGRAMS_AUTH_MODE;
    delete process.env.PROGRAMS_AUTH_MODE_ROUTE_OVERRIDES;
    expect(resolveProgramsAuthMode('portfolio')).toBe('service_role');
    expect(resolveProgramsAuthMode('detail')).toBe('service_role');
    expect(resolveProgramsAuthMode('origination')).toBe('service_role');
  });

  it('uses global PROGRAMS_AUTH_MODE when valid', () => {
    process.env.PROGRAMS_AUTH_MODE = 'authenticated';
    delete process.env.PROGRAMS_AUTH_MODE_ROUTE_OVERRIDES;
    expect(resolveProgramsAuthMode('portfolio')).toBe('authenticated');
    expect(resolveProgramsAuthMode('detail')).toBe('authenticated');
    expect(resolveProgramsAuthMode('origination')).toBe('authenticated');
  });

  it('uses per-route override when provided', () => {
    process.env.PROGRAMS_AUTH_MODE = 'authenticated';
    process.env.PROGRAMS_AUTH_MODE_ROUTE_OVERRIDES = 'portfolio=service_role,detail=authenticated,origination=service_role';
    expect(resolveProgramsAuthMode('portfolio')).toBe('service_role');
    expect(resolveProgramsAuthMode('detail')).toBe('authenticated');
    expect(resolveProgramsAuthMode('origination')).toBe('service_role');
  });

  it('ignores invalid tokens and falls back to default mode', () => {
    process.env.PROGRAMS_AUTH_MODE = 'service_role';
    process.env.PROGRAMS_AUTH_MODE_ROUTE_OVERRIDES = 'x=y,portfolio=bad_mode';
    expect(resolveProgramsAuthMode('portfolio')).toBe('service_role');
  });
});

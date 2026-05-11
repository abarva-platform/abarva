import { resolveTenantHome } from '@/components/home/tenant-home-fixtures';
import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';
import { getFirstCapitalBriefData, getFirstCapitalMapData } from '@/lib/knowledge-corpus/fixtures/first-capital-finserv';

describe('First Capital tenant resolution', () => {
  it('resolves canonical arcturus client key to the First Capital home fixture', () => {
    const home = resolveTenantHome('arcturus');

    expect(home.key).toBe('firstcap');
    expect(home.title).toBe('First Capital Financial');
    expect(home.tagline).toContain('regional bank');
    expect(getClientOption('arcturus').name).toBe('First Capital Financial');
    expect(canonicalClientDisplayName({ key: 'arcturus', name: 'Brindlemark Financial' })).toBe('First Capital Financial');
  });

  it('keeps First Capital Intelligence corpus fixtures out of Meridian healthcare content', () => {
    const brief = getFirstCapitalBriefData();
    const map = getFirstCapitalMapData();
    const serialized = JSON.stringify({ brief, map }).toLowerCase();

    expect(brief.industry).toBe('finserv');
    expect(map.industry).toBe('finserv');
    expect(brief.tenantName).toBe('First Capital Financial');
    expect(serialized).toContain('fednow');
    expect(serialized).toContain('sr 11-7');
    expect(serialized).not.toContain('meridian');
    expect(serialized).not.toContain('heliara');
    expect(serialized).not.toContain('clinical documentation');
    expect(serialized).not.toContain('population health');
  });
});

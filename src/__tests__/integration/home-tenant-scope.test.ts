import { readFileSync } from 'node:fs';

describe('Home tenant scope', () => {
  it('keeps Apex fixture content behind an Apex-only guard', () => {
    const source = readFileSync('src/components/home/HomeIndexPage.tsx', 'utf8');

    expect(source).toContain('isApexRetailTenant');
    expect(source).toContain('...(isApexRetailTenant ? v.topPrograms : [])');
    expect(source).toContain("canUse('tower') && isApexRetailTenant");
    expect(source).toContain("canUse('source') && isApexRetailTenant");
    expect(source).toContain('Static Apex demo pressures are hidden for this client');
    expect(source).toContain('Financials restricted');
  });
});

// LINK1 — Source Program Link Model Integration Tests
// Pure TypeScript + Jest. No jsdom, no React.

import {
  buildSourceProgramLinks,
  getLinksForProgram,
  getLinksForSourceEvent,
  summarizeSourceProgramLinks,
} from '@/lib/source/source-program-link';

describe('buildSourceProgramLinks', () => {
  it('returns at least 1 link', () => {
    const links = buildSourceProgramLinks();
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('the Apex Retail link has tenantSlug "apex-retail"', () => {
    const links = buildSourceProgramLinks();
    const apexLink = links.find((l) => l.id === 'link-apex-retail-ams-cdp-2026');
    expect(apexLink).toBeDefined();
    expect(apexLink!.tenantSlug).toBe('apex-retail');
  });

  it('the Apex Retail link has linkedProgramCode "APX-CDP-2026"', () => {
    const links = buildSourceProgramLinks();
    const apexLink = links.find((l) => l.id === 'link-apex-retail-ams-cdp-2026');
    expect(apexLink).toBeDefined();
    expect(apexLink!.linkedProgramCode).toBe('APX-CDP-2026');
  });

  it('the Apex Retail link has sourceEventId "apex-retail-ams-outsourcing-2026"', () => {
    const links = buildSourceProgramLinks();
    const apexLink = links.find((l) => l.id === 'link-apex-retail-ams-cdp-2026');
    expect(apexLink).toBeDefined();
    expect(apexLink!.sourceEventId).toBe('apex-retail-ams-outsourcing-2026');
  });

  it('the Apex Retail link has deterministicSeed: true', () => {
    const links = buildSourceProgramLinks();
    const apexLink = links.find((l) => l.id === 'link-apex-retail-ams-cdp-2026');
    expect(apexLink).toBeDefined();
    expect(apexLink!.deterministicSeed).toBe(true);
  });
});

describe('getLinksForProgram', () => {
  it('returns the Apex Retail link for "APX-CDP-2026"', () => {
    const links = getLinksForProgram('APX-CDP-2026');
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0].linkedProgramCode).toBe('APX-CDP-2026');
    expect(links[0].tenantSlug).toBe('apex-retail');
  });

  it('returns empty array for a non-existent program code', () => {
    const links = getLinksForProgram('NONEXISTENT');
    expect(links).toEqual([]);
  });
});

describe('getLinksForSourceEvent', () => {
  it('returns the Apex Retail link for "apex-retail-ams-outsourcing-2026"', () => {
    const links = getLinksForSourceEvent('apex-retail-ams-outsourcing-2026');
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0].sourceEventId).toBe('apex-retail-ams-outsourcing-2026');
    expect(links[0].tenantSlug).toBe('apex-retail');
  });
});

describe('summarizeSourceProgramLinks', () => {
  it('returns correct counts', () => {
    const links = buildSourceProgramLinks();
    const summary = summarizeSourceProgramLinks(links);
    expect(summary.totalLinks).toBe(links.length);
    expect(summary.confirmedLinks).toBeGreaterThanOrEqual(0);
    expect(summary.deferredLinks).toBeGreaterThanOrEqual(0);
    expect(summary.links).toEqual(links);
  });

  it('evidenceCaveat contains "deterministic seed"', () => {
    const links = buildSourceProgramLinks();
    const summary = summarizeSourceProgramLinks(links);
    expect(summary.evidenceCaveat).toContain('deterministic seed');
  });

  it('tenantSlug matches the first link tenantSlug', () => {
    const links = buildSourceProgramLinks();
    const summary = summarizeSourceProgramLinks(links);
    expect(summary.tenantSlug).toBe(links[0].tenantSlug);
  });
});

// SRC33 — Linked Program Badge View Model Tests
// Pure TypeScript + Jest. No jsdom, no React.

import { buildLinkedProgramBadgeView } from '@/lib/source/linked-program-badge-view';

describe('buildLinkedProgramBadgeView', () => {
  it('returns non-null for apex-retail-ams-outsourcing-2026', () => {
    const view = buildLinkedProgramBadgeView('apex-retail-ams-outsourcing-2026');
    expect(view).not.toBeNull();
  });

  it('returns programCode APX-CDP-2026', () => {
    const view = buildLinkedProgramBadgeView('apex-retail-ams-outsourcing-2026');
    expect(view?.programCode).toBe('APX-CDP-2026');
  });

  it('returns tenantSlug apex-retail', () => {
    const view = buildLinkedProgramBadgeView('apex-retail-ams-outsourcing-2026');
    expect(view?.tenantSlug).toBe('apex-retail');
  });

  it('returns deterministicSeed: true', () => {
    const view = buildLinkedProgramBadgeView('apex-retail-ams-outsourcing-2026');
    expect(view?.deterministicSeed).toBe(true);
  });

  it('returns null for unknown event id', () => {
    const view = buildLinkedProgramBadgeView('unknown-event');
    expect(view).toBeNull();
  });

  it('evidenceCaveat is non-empty', () => {
    const view = buildLinkedProgramBadgeView('apex-retail-ams-outsourcing-2026');
    expect(view?.evidenceCaveat).toBeTruthy();
    expect(view?.evidenceCaveat.length).toBeGreaterThan(0);
  });
});

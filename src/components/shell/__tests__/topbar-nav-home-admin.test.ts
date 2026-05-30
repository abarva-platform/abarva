/**
 * CL-1 (2026-05-30) · Top-nav "Home" must point at the Trust Plane.
 *
 * Hygiene test that codifies the IA decision from
 * docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md §2 — the top-nav "Home"
 * tab lands users on the consolidated /admin Trust Plane (Setup/Admin
 * Waves 1–3), not the retired parallel /home landing.
 *
 * If a future PR points "Home" back at /home, this test fails so the
 * reviewer has to reconsider the IA decision.
 */

import { NAV_ITEMS } from '@/components/shell/topbar-nav-items';
import { TOP_NAV_ITEMS } from '@/lib/home/top-nav-items';

describe('Top-nav · Home → /admin Trust Plane', () => {
  it('topbar-nav-items NAV_ITEMS "home" entry points at /admin', () => {
    const home = NAV_ITEMS.find((item) => item.key === 'home');
    expect(home).toBeDefined();
    expect(home?.href).toBe('/admin');
  });

  it('topbar-nav-items "home" match still treats /admin* and /home* as home-active', () => {
    const home = NAV_ITEMS.find((item) => item.key === 'home');
    expect(home).toBeDefined();
    expect(home?.match('/admin')).toBe(true);
    expect(home?.match('/admin/data-trust')).toBe(true);
    expect(home?.match('/home/queue')).toBe(true);
    expect(home?.match('/intelligence')).toBe(false);
    expect(home?.match('/tower')).toBe(false);
  });

  it('lib/home top-nav inventory "home" entry stays aligned with the canonical NAV_ITEMS', () => {
    const home = TOP_NAV_ITEMS.find((item) => item.id === 'home');
    expect(home).toBeDefined();
    expect(home?.href).toBe('/admin');
  });

  it('other top-nav entries stay on their canonical hrefs', () => {
    const byKey = Object.fromEntries(NAV_ITEMS.map((i) => [i.key, i.href]));
    expect(byKey.intelligence).toBe('/intelligence');
    expect(byKey.programs).toBe('/strategic-moves');
    expect(byKey.source).toBe('/source');
    expect(byKey.tower).toBe('/tower');
  });
});

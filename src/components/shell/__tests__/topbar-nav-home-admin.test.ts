/**
 * Demo IA reset (2026-06-18) · Top-nav "Home" must point at the
 * signed-in executive hub. Setup/Admin remains available under /admin,
 * but buyer demos should not land in Steward setup plumbing.
 */

import { NAV_ITEMS } from '@/components/shell/topbar-nav-items';
import { TOP_NAV_ITEMS } from '@/lib/home/top-nav-items';

describe('Top-nav · Home → executive hub', () => {
  it('topbar-nav-items NAV_ITEMS "home" entry points at /home', () => {
    const home = NAV_ITEMS.find((item) => item.key === 'home');
    expect(home).toBeDefined();
    expect(home?.href).toBe('/home');
  });

  it('topbar-nav-items "home" match treats /home* as active without swallowing /admin', () => {
    const home = NAV_ITEMS.find((item) => item.key === 'home');
    expect(home).toBeDefined();
    expect(home?.match('/home')).toBe(true);
    expect(home?.match('/home/queue')).toBe(true);
    expect(home?.match('/admin')).toBe(false);
    expect(home?.match('/intelligence')).toBe(false);
    expect(home?.match('/tower')).toBe(false);
  });

  it('lib/home top-nav inventory "home" entry stays aligned with the canonical NAV_ITEMS', () => {
    const home = TOP_NAV_ITEMS.find((item) => item.id === 'home');
    expect(home).toBeDefined();
    expect(home?.href).toBe('/home');
  });

  it('other top-nav entries stay on their canonical hrefs', () => {
    const byKey = Object.fromEntries(NAV_ITEMS.map((i) => [i.key, i.href]));
    expect(byKey.intelligence).toBe('/intelligence');
    expect(byKey.programs).toBe('/strategic-moves');
    expect(byKey.source).toBe('/source');
    expect(byKey.tower).toBe('/tower');
  });
});

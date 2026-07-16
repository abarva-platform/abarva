/**
 * Home and Admin route separation.
 *
 * Home is the client-facing Enterprise Landscape. /admin remains the
 * setup/admin control plane. Do not collapse these routes again.
 */

import { NAV_ITEMS } from '@/components/shell/topbar-nav-items';
import { TOP_NAV_ITEMS } from '@/lib/home/top-nav-items';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Top-nav · Home and Admin remain separate', () => {
  it('topbar-nav-items NAV_ITEMS "home" entry is labeled Knowledge and points at /home', () => {
    const home = NAV_ITEMS.find((item) => item.key === 'home');
    expect(home).toBeDefined();
    expect(home?.label).toBe('Knowledge');
    expect(home?.href).toBe('/home');
  });

  it('topbar-nav-items "home" match treats /home as home-active but not /admin', () => {
    const home = NAV_ITEMS.find((item) => item.key === 'home');
    expect(home).toBeDefined();
    expect(home?.match('/admin')).toBe(false);
    expect(home?.match('/admin/data-trust')).toBe(false);
    expect(home?.match('/home')).toBe(true);
    expect(home?.match('/home/queue')).toBe(true);
    expect(home?.match('/admin')).toBe(false);
    expect(home?.match('/admin/data-trust')).toBe(false);
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
    expect(byKey.learn).toBe('/home/learn');
  });

  it('Learn is its own top-level product nav item and does not activate Knowledge', () => {
    const home = NAV_ITEMS.find((item) => item.key === 'home');
    const learn = NAV_ITEMS.find((item) => item.key === 'learn');
    expect(learn).toBeDefined();
    expect(learn?.label).toBe('Learn');
    expect(learn?.match('/home/learn')).toBe(true);
    expect(learn?.match('/home/learn/source')).toBe(true);
    expect(learn?.match('/learn')).toBe(true);
    expect(home?.match('/home/learn')).toBe(false);
    expect(home?.match('/home/learn/source')).toBe(false);
  });

  it('NEXUS top nav keeps product navigation on App Router links instead of full document reloads', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/navigation/NexusTopNav.tsx'),
      'utf8',
    );

    expect(source).toContain('href={item.href}');
    expect(source).toContain('prefetch');
    expect(source).not.toContain('window.location.assign');
  });
});

/**
 * Setup nav · 6 panels (PR 1 of Setup Fix Package).
 *
 * Per docs/setup-fix-package/PR_01_REMOVE_4_PANELS.md, AI Initiatives,
 * Build Progress, Architecture, and Reasoning were removed from the
 * Setup left-nav. This test locks in the post-removal nav shape and
 * verifies the removed page routes no longer exist.
 */

import fs from 'node:fs';
import path from 'node:path';

import { ADMIN_SUB_SECTIONS } from '@/lib/admin/admin-shell-config';

const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..');
const ROUTE_BASE = path.join(REPO_ROOT, 'src', 'app', '(maestro)', 'admin');

describe('Setup left-nav after PR 1 (4 panels removed)', () => {
  it('contains exactly 6 panels in the documented order', () => {
    expect(ADMIN_SUB_SECTIONS.map((s) => s.id)).toEqual([
      'overview',
      'data-trust',
      'connectors',
      'users-access',
      'agent-readiness',
      'production-readiness',
    ]);
  });

  it('does not contain entries for the four removed panels', () => {
    const ids = new Set(ADMIN_SUB_SECTIONS.map((s) => s.id));
    expect(ids.has('ai-initiatives' as never)).toBe(false);
    expect(ids.has('build-progress' as never)).toBe(false);
    expect(ids.has('architecture' as never)).toBe(false);
    expect(ids.has('reasoning' as never)).toBe(false);
  });

  it.each([
    'ai-initiatives',
    'build-progress',
    'architecture',
    'reasoning',
  ])('removed panel route /%s no longer exists on disk', (slug) => {
    expect(fs.existsSync(path.join(ROUTE_BASE, slug))).toBe(false);
  });

  it('the six remaining panel routes still exist on disk', () => {
    expect(fs.existsSync(path.join(ROUTE_BASE, 'page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE_BASE, 'data-trust'))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE_BASE, 'connectors'))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE_BASE, 'users-access'))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE_BASE, 'agent-readiness'))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE_BASE, 'production-readiness'))).toBe(true);
  });
});

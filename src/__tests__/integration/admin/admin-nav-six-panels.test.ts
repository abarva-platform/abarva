/**
 * Setup nav · core panels (PR 1 of Setup Fix Package + pilot data-load center).
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
  it('contains the documented core panels in order', () => {
    // 2026-09-19 (T-032) - see the identical list in admin-shell-v2.test.ts.
    // Four ids were missing here too: templates and outputs (a9233b0d2),
    // data-layer-explorer (6a4915cdc) and ops (90c70448f, #2889). Each has a
    // real route under src/app/(maestro)/admin/. Two suites holding the same
    // exact-list lock is itself worth an item - both had to be corrected by
    // hand, and nothing holds them to each other.
    expect(ADMIN_SUB_SECTIONS.map((s) => s.id)).toEqual([
      'overview',
      'data-loads',
      'templates',
      'data-layer-explorer',
      'data-trust',
      'connectors',
      'outputs',
      'users-access',
      'inbox',
      'customer-admin',
      'ops',
      'agent-readiness',
      'patternops',
      'production-readiness',
      'compliance',
      'engineering-traces',
      'releases',
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

  it('the core panel routes still exist on disk', () => {
    expect(fs.existsSync(path.join(ROUTE_BASE, 'page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE_BASE, 'setup'))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE_BASE, 'data-trust'))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE_BASE, 'connectors'))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE_BASE, 'users-access'))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE_BASE, 'agent-readiness'))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE_BASE, 'production-readiness'))).toBe(true);
  });
});

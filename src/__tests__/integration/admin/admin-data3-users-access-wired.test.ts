/**
 * ADMIN-DATA3 — `/admin/users-access` wired to admin-users-adapter.
 *
 * Wiring tests verify that:
 *   - `buildUsersAccessPageView` is async (returns a Promise).
 *   - The page-view module imports from `@/lib/admin/data/admin-users-adapter`.
 *   - The output shape (UsersAccessPageView) is unchanged — consumers don't
 *     have to rewrite anything.
 *   - In fixture mode (default), the produced data still mirrors the prior
 *     hardcoded constants (parity guard).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildUsersAccessPageView,
  resolveUsersAccessTab,
  findUsersAccessUser,
  type UsersAccessPageView,
} from '@/lib/admin/users-access-page-view';
import {
  getAdminInvites,
  getAdminRoleMatrix,
  getAdminUserDetail,
  getAdminUsers,
} from '@/lib/admin/data/admin-users-adapter';

const root = process.cwd();
const PAGE_VIEW_PATH = resolve(root, 'src/lib/admin/users-access-page-view.ts');
const PAGE_ROUTE_PATH = resolve(
  root,
  'src/app/(maestro)/admin/users-access/page.tsx',
);

describe('ADMIN-DATA3 — buildUsersAccessPageView is async', () => {
  it('returns a Promise (function is async)', () => {
    const result = buildUsersAccessPageView();
    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves to a UsersAccessPageView object', async () => {
    const view = await buildUsersAccessPageView();
    expect(view).toBeDefined();
    expect(typeof view).toBe('object');
  });

  it('accepts an optional tenantSlug argument', async () => {
    // Default and explicit invocations both succeed (signature is stable).
    const a = await buildUsersAccessPageView();
    const b = await buildUsersAccessPageView('apex-retail');
    expect(a.title).toBe(b.title);
  });
});

describe('ADMIN-DATA3 — page-view consumes admin-users-adapter', () => {
  const src = readFileSync(PAGE_VIEW_PATH, 'utf8');

  it('imports the admin-users-adapter module', () => {
    expect(src).toMatch(/@\/lib\/admin\/data\/admin-users-adapter/);
  });

  it('imports getAdminUsers', () => {
    expect(src).toContain('getAdminUsers');
  });

  it('imports getAdminInvites', () => {
    expect(src).toContain('getAdminInvites');
  });

  it('imports getAdminRoleMatrix', () => {
    expect(src).toContain('getAdminRoleMatrix');
  });

  it('imports getAdminUserDetail', () => {
    expect(src).toContain('getAdminUserDetail');
  });

  it('no longer hardcodes SEED_USER_DETAILS', () => {
    expect(src).not.toContain('SEED_USER_DETAILS');
  });

  it('no longer hardcodes SEED_INVITES', () => {
    expect(src).not.toContain('SEED_INVITES');
  });

  it('no longer hardcodes SEED_ROLE_SUMMARY', () => {
    expect(src).not.toContain('SEED_ROLE_SUMMARY');
  });

  it('declares buildUsersAccessPageView as async', () => {
    expect(src).toMatch(/export\s+async\s+function\s+buildUsersAccessPageView/);
  });
});

describe('ADMIN-DATA3 — page route awaits the async builder', () => {
  const src = readFileSync(PAGE_ROUTE_PATH, 'utf8');

  it('awaits buildUsersAccessPageView', () => {
    expect(src).toMatch(/await\s+buildUsersAccessPageView/);
  });

  it('page component is async (Server Component)', () => {
    expect(src).toMatch(/export\s+default\s+async\s+function/);
  });
});

describe('ADMIN-DATA3 — output shape unchanged (regression guard)', () => {
  let view: UsersAccessPageView;

  beforeAll(async () => {
    view = await buildUsersAccessPageView();
  });

  it('preserves top-level surface fields (eyebrow/title/subtitle)', () => {
    expect(view.eyebrow).toBe('Roles, scope, and access posture');
    expect(view.title).toBe('Users & Access');
    expect(view.subtitle).toBeTruthy();
  });

  it('preserves deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('preserves the 4-tab structure (all/roles/permissions/invites)', () => {
    expect(view.tabs.length).toBe(4);
    const keys = view.tabs.map((t) => t.key).sort();
    expect(keys).toEqual(['all', 'invites', 'permissions', 'roles']);
  });

  it('preserves all canonical depth fields on the view', () => {
    expect(Array.isArray(view.userList)).toBe(true);
    expect(Array.isArray(view.userDetails)).toBe(true);
    expect(Array.isArray(view.inviteList)).toBe(true);
    expect(Array.isArray(view.roleSummary)).toBe(true);
    expect(Array.isArray(view.permissionMatrix)).toBe(true);
    expect(Array.isArray(view.actionStrip)).toBe(true);
  });

  it('userDetails entries have the same fields as before', () => {
    for (const d of view.userDetails) {
      expect(d.id).toBeTruthy();
      expect(d.name).toBeTruthy();
      expect(d.email).toContain('@');
      expect(d.roleId).toBeTruthy();
      expect(d.roleLabel).toBeTruthy();
      expect(d.tenant).toBeTruthy();
      expect(Array.isArray(d.permissions)).toBe(true);
      expect(Array.isArray(d.recentActivity)).toBe(true);
    }
  });

  it('roleSummary covers the canonical 6 roles', () => {
    const ids = view.roleSummary.map((r) => r.id).sort();
    expect(ids).toEqual([
      'investor',
      'maestro',
      'observer',
      'platform_admin',
      'sponsor',
      'tenant_admin',
    ]);
  });

  it('permissionMatrix is preserved (deterministic concept-level data)', () => {
    const ids = view.permissionMatrix.map((p) => p.id);
    expect(ids).toContain('platform.read');
    expect(ids).toContain('tenant.write');
    expect(ids).toContain('programs.write');
  });

  it('actionStrip preserves invite_user / configure_sso / export_users', () => {
    const ids = view.actionStrip.map((a) => a.id).sort();
    expect(ids).toEqual(['configure_sso', 'export_users', 'invite_user']);
  });

  it('helper resolveUsersAccessTab still exported and functional', () => {
    expect(resolveUsersAccessTab('roles')).toBe('roles');
    expect(resolveUsersAccessTab(undefined)).toBe('all');
  });

  it('helper findUsersAccessUser still exported and functional', () => {
    const sample = view.userDetails[0];
    const found = findUsersAccessUser(view, sample.id);
    expect(found?.id).toBe(sample.id);
    expect(findUsersAccessUser(view, undefined)).toBeNull();
  });
});

describe('ADMIN-DATA3 — fixture-mode parity with adapter', () => {
  const TENANT = 'apex-retail';

  it('view.userList length matches adapter getAdminUsers length', async () => {
    const view = await buildUsersAccessPageView(TENANT);
    const adapterRows = await getAdminUsers(TENANT);
    expect(view.userList.length).toBe(adapterRows.length);
  });

  it('every userList id is also returned by getAdminUsers', async () => {
    const view = await buildUsersAccessPageView(TENANT);
    const adapterRows = await getAdminUsers(TENANT);
    const adapterIds = new Set(adapterRows.map((r) => r.id));
    for (const u of view.userList) {
      expect(adapterIds.has(u.id)).toBe(true);
    }
  });

  it('every inviteList row aligns with getAdminInvites', async () => {
    const view = await buildUsersAccessPageView(TENANT);
    const adapterInvites = await getAdminInvites(TENANT);
    expect(view.inviteList.length).toBe(adapterInvites.length);
    const adapterIds = new Set(adapterInvites.map((r) => r.id));
    for (const i of view.inviteList) {
      expect(adapterIds.has(i.id)).toBe(true);
    }
  });

  it('roleSummary aligns with getAdminRoleMatrix', async () => {
    const view = await buildUsersAccessPageView(TENANT);
    const adapterRoles = await getAdminRoleMatrix(TENANT);
    expect(view.roleSummary.length).toBe(adapterRoles.length);
    const adapterIds = new Set(adapterRoles.map((r) => r.roleId));
    for (const r of view.roleSummary) {
      expect(adapterIds.has(r.id)).toBe(true);
    }
  });

  it('userDetails permissions come from getAdminUserDetail (sample check)', async () => {
    const view = await buildUsersAccessPageView(TENANT);
    const sample = view.userDetails[0];
    const adapterDetail = await getAdminUserDetail(TENANT, sample.id);
    expect(adapterDetail).not.toBeNull();
    expect(sample.permissions).toEqual(adapterDetail?.permissions);
  });

  it('preserves prior pendingInvitesCount semantics (count of pending invites)', async () => {
    const view = await buildUsersAccessPageView(TENANT);
    const expected = view.inviteList.filter((i) => i.status === 'pending').length;
    expect(view.pendingInvitesCount).toBe(expected);
  });

  it('contains no banned hex tokens after adapter wiring', async () => {
    const view = await buildUsersAccessPageView(TENANT);
    const s = JSON.stringify(view).toLowerCase();
    expect(s).not.toContain('#14b8a6');
    expect(s).not.toContain('#7c3aed');
    expect(s).not.toContain('#d946ef');
    expect(s).not.toContain('sparkle');
  });
});

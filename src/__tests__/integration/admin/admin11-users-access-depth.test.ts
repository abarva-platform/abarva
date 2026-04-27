/**
 * ADMIN11 — Users & Access depth tests
 *
 * Pure TypeScript Jest tests for:
 *   - UsersAccessPageView depth fields (tabs, userList, userDetails, inviteList,
 *     roleSummary, permissionMatrix, actionStrip)
 *   - resolveUsersAccessTab + findUsersAccessUser helpers
 *   - Component module presence + key affordances
 *   - Hard-gated action visibility (disabled buttons w/ reason)
 *
 * No React rendering, no jsdom — fs scans + view-model invocation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildUsersAccessPageView,
  resolveUsersAccessTab,
  findUsersAccessUser,
  type UsersAccessPageView,
  type UsersAccessTabKey,
} from '@/lib/admin/users-access-page-view';

const root = process.cwd();

describe('ADMIN11 — Users & Access page-view depth', () => {
  let view: UsersAccessPageView;

  beforeEach(async () => {
    view = await buildUsersAccessPageView();
  });

  it('still returns deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('preserves the existing roles array (legacy contract)', () => {
    expect(Array.isArray(view.roles)).toBe(true);
    expect(view.roles.length).toBeGreaterThan(0);
  });

  it('exposes a tabs array', () => {
    expect(Array.isArray(view.tabs)).toBe(true);
    expect(view.tabs.length).toBe(4);
  });

  it('tab keys match the canonical 4 (all/roles/permissions/invites)', () => {
    const keys = view.tabs.map((t) => t.key).sort();
    expect(keys).toEqual(['all', 'invites', 'permissions', 'roles']);
  });

  it('default tab is "all"', () => {
    expect(view.defaultTab).toBe('all');
  });

  it('every tab has a non-empty label', () => {
    for (const tab of view.tabs) {
      expect(tab.label.length).toBeGreaterThan(0);
    }
  });

  it('every tab has a non-empty description', () => {
    for (const tab of view.tabs) {
      expect(tab.description.length).toBeGreaterThan(0);
    }
  });

  it('userList is non-empty', () => {
    expect(view.userList.length).toBeGreaterThan(0);
  });

  it('userList rows have required shape', () => {
    for (const u of view.userList) {
      expect(u.id).toBeTruthy();
      expect(u.name).toBeTruthy();
      expect(u.email).toContain('@');
      expect(u.roleLabel).toBeTruthy();
      expect(u.tenant).toBeTruthy();
      expect(u.lastSignIn).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(['active', 'invited', 'suspended']).toContain(u.status);
    }
  });

  it('userDetails extends userList with permissions + activity', () => {
    expect(view.userDetails.length).toBe(view.userList.length);
    for (const d of view.userDetails) {
      expect(Array.isArray(d.permissions)).toBe(true);
      expect(d.permissions.length).toBeGreaterThan(0);
      expect(Array.isArray(d.recentActivity)).toBe(true);
      expect(d.recentActivity.length).toBeGreaterThan(0);
      expect(['accepted', 'pending', 'expired', 'never']).toContain(d.inviteStatus);
    }
  });

  it('userDetail ids align with userList ids', () => {
    const listIds = view.userList.map((u) => u.id).sort();
    const detailIds = view.userDetails.map((d) => d.id).sort();
    expect(detailIds).toEqual(listIds);
  });

  it('inviteList has at least one pending invite', () => {
    const pending = view.inviteList.filter((i) => i.status === 'pending');
    expect(pending.length).toBeGreaterThan(0);
  });

  it('inviteList rows have required shape', () => {
    for (const inv of view.inviteList) {
      expect(inv.id).toBeTruthy();
      expect(inv.email).toContain('@');
      expect(inv.invitedRoleLabel).toBeTruthy();
      expect(inv.invitedBy).toBeTruthy();
      expect(inv.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(['pending', 'expired']).toContain(inv.status);
    }
  });

  it('pendingInvitesCount matches inviteList pending count', () => {
    const expected = view.inviteList.filter((i) => i.status === 'pending').length;
    expect(view.pendingInvitesCount).toBe(expected);
  });

  it('roleSummary covers the canonical roles', () => {
    const ids = view.roleSummary.map((r) => r.id);
    expect(ids).toContain('platform_admin');
    expect(ids).toContain('tenant_admin');
    expect(ids).toContain('maestro');
    expect(ids).toContain('sponsor');
    expect(ids).toContain('investor');
    expect(ids).toContain('observer');
  });

  it('permissionMatrix is non-empty and uses dotted permission ids', () => {
    expect(view.permissionMatrix.length).toBeGreaterThan(0);
    for (const p of view.permissionMatrix) {
      expect(p.id).toMatch(/^[a-z_]+\.[a-z_]+$/);
      expect(p.rolesAllowed.length).toBeGreaterThan(0);
    }
  });

  it('actionStrip contains invite_user / configure_sso / export_users', () => {
    const ids = view.actionStrip.map((a) => a.id);
    expect(ids).toContain('invite_user');
    expect(ids).toContain('configure_sso');
    expect(ids).toContain('export_users');
  });

  it('invite_user action is hard_gated with a reason', () => {
    const a = view.actionStrip.find((x) => x.id === 'invite_user');
    expect(a?.status).toBe('hard_gated');
    expect(a?.reason).toBeTruthy();
    expect(a?.reason).toMatch(/Wave 27/);
  });

  it('configure_sso action is hard_gated with a reason', () => {
    const a = view.actionStrip.find((x) => x.id === 'configure_sso');
    expect(a?.status).toBe('hard_gated');
    expect(a?.reason).toMatch(/Wave 27/);
  });

  it('export_users action is safe and has an href', () => {
    const a = view.actionStrip.find((x) => x.id === 'export_users');
    expect(a?.status).toBe('safe');
    expect(a?.href).toBeTruthy();
  });

  it('does not include production_ready: true anywhere', () => {
    const s = JSON.stringify(view).toLowerCase();
    expect(s).not.toContain('"production_ready":true');
  });

  it('does not contain banned hex tokens', () => {
    const s = JSON.stringify(view).toLowerCase();
    expect(s).not.toContain('#14b8a6');
    expect(s).not.toContain('#7c3aed');
    expect(s).not.toContain('#d946ef');
    expect(s).not.toContain('sparkle');
  });

  it('agentChoices is populated (AGENT1 wiring intact)', () => {
    expect(Array.isArray(view.agentChoices)).toBe(true);
    expect((view.agentChoices ?? []).length).toBeGreaterThan(0);
  });

  it('editorial body is non-empty (Steward wiring preserved)', () => {
    expect(view.editorial.body.length).toBeGreaterThan(0);
  });
});

describe('ADMIN11 — resolveUsersAccessTab', () => {
  it('returns "all" for undefined input', () => {
    expect(resolveUsersAccessTab(undefined)).toBe('all');
  });

  it('returns "all" for empty string', () => {
    expect(resolveUsersAccessTab('')).toBe('all');
  });

  it('returns the canonical tab when given a valid key', () => {
    const keys: UsersAccessTabKey[] = ['all', 'roles', 'permissions', 'invites'];
    for (const k of keys) {
      expect(resolveUsersAccessTab(k)).toBe(k);
    }
  });

  it('falls back to "all" for an unknown key', () => {
    expect(resolveUsersAccessTab('audit')).toBe('all');
    expect(resolveUsersAccessTab('garbage')).toBe('all');
  });
});

describe('ADMIN11 — findUsersAccessUser', () => {
  let view: UsersAccessPageView;

  beforeAll(async () => {
    view = await buildUsersAccessPageView();
  });

  it('returns null for undefined id', () => {
    expect(findUsersAccessUser(view, undefined)).toBeNull();
  });

  it('returns null for an unknown id', () => {
    expect(findUsersAccessUser(view, 'nope_999')).toBeNull();
  });

  it('returns the matching user detail for a valid id', () => {
    const first = view.userDetails[0];
    const found = findUsersAccessUser(view, first.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(first.id);
  });
});

describe('ADMIN11 — Component modules exist', () => {
  const components = [
    'src/components/admin/UsersAccessTabs.tsx',
    'src/components/admin/UserListTable.tsx',
    'src/components/admin/UserDetailDrawer.tsx',
    'src/components/admin/InviteList.tsx',
    'src/components/admin/UsersAccessActionStrip.tsx',
  ];

  components.forEach((rel) => {
    it(`${rel} exists on disk`, () => {
      expect(existsSync(resolve(root, rel))).toBe(true);
    });

    it(`${rel} contains no banned hex tokens`, () => {
      const s = readFileSync(resolve(root, rel), 'utf8').toLowerCase();
      expect(s).not.toContain('#14b8a6');
      expect(s).not.toContain('#7c3aed');
      expect(s).not.toContain('#d946ef');
      expect(s).not.toContain('sparkle');
    });

    it(`${rel} imports design tokens from the canonical module`, () => {
      const s = readFileSync(resolve(root, rel), 'utf8');
      expect(s).toMatch(/@\/lib\/design\/design-tokens/);
    });
  });
});

describe('ADMIN11 — Action strip + invite list hard-gated affordances', () => {
  it('UsersAccessActionStrip renders a disabled invite button with reason', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/UsersAccessActionStrip.tsx'),
      'utf8',
    );
    expect(src).toContain('disabled');
    expect(src).toContain('aria-disabled="true"');
    expect(src).toContain('hard_gated');
    expect(src).toMatch(/Wave 27/);
  });

  it('InviteList renders disabled Resend / Revoke buttons', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/InviteList.tsx'),
      'utf8',
    );
    expect(src).toContain('disabled');
    expect(src).toContain('aria-disabled="true"');
    expect(src).toContain('Resend');
    expect(src).toContain('Revoke');
    expect(src).toMatch(/Wave 27/);
  });

  it('UsersAccessActionStrip never renders an enabled invite or sso button', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/UsersAccessActionStrip.tsx'),
      'utf8',
    );
    // Defensive: hard-gated branch must use disabled.
    expect(src).not.toMatch(/onClick=\{\(/);
  });
});

describe('ADMIN11 — Page route uses the new depth components', () => {
  const pagePath = 'src/app/(maestro)/admin/users-access/page.tsx';

  it('exists at canonical path', () => {
    expect(existsSync(resolve(root, pagePath))).toBe(true);
  });

  const src = readFileSync(resolve(root, pagePath), 'utf8');

  it('imports UsersAccessTabs', () => {
    expect(src).toContain('UsersAccessTabs');
  });

  it('imports UserListTable', () => {
    expect(src).toContain('UserListTable');
  });

  it('imports UserDetailDrawer', () => {
    expect(src).toContain('UserDetailDrawer');
  });

  it('imports InviteList', () => {
    expect(src).toContain('InviteList');
  });

  it('imports UsersAccessActionStrip', () => {
    expect(src).toContain('UsersAccessActionStrip');
  });

  it('reads searchParams (Next 15+ async signature)', () => {
    expect(src).toContain('searchParams');
    expect(src).toContain('await searchParams');
  });

  it('still imports the canonical AdminCanonShellV2', () => {
    expect(src).toContain('AdminCanonShellV2');
  });

  it('still imports the StewardEditorial', () => {
    expect(src).toContain('StewardEditorial');
  });

  it('still imports the RoleAccessMatrix (existing canvas preserved)', () => {
    expect(src).toContain('RoleAccessMatrix');
  });

  it('contains no banned tokens', () => {
    const s = src.toLowerCase();
    expect(s).not.toContain('#14b8a6');
    expect(s).not.toContain('#7c3aed');
    expect(s).not.toContain('#d946ef');
    expect(s).not.toContain('sparkle');
  });

  it('does not contain <input> or <textarea>', () => {
    expect(src).not.toMatch(/<input\b/);
    expect(src).not.toMatch(/<textarea\b/);
  });
});

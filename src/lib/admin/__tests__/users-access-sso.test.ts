/**
 * Users & Access SSO + consequence copy (Setup Fix Package PR 5).
 *
 * Locks in the post-PR5 contract:
 *   - SSO primary action / configure_sso action both land on the
 *     /admin/users-access/sso-configuration docs route.
 *   - The Configure SSO action becomes a `safe` link (no longer
 *     hard-gated).
 *   - The Invite user action stays hard-gated but its reason is
 *     the explicit dependency message (not the generic "pilot
 *     environment" boilerplate).
 *   - The SSO docs page exists on disk.
 */

import fs from 'node:fs';
import path from 'node:path';

import { buildUsersAccessPageView } from '../users-access-page-view';

const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..');
const SSO_DOCS_ROUTE = path.join(
  REPO_ROOT,
  'src',
  'app',
  '(maestro)',
  'admin',
  'users-access',
  'sso-configuration',
  'page.tsx',
);

describe('Users & Access SSO (PR 5)', () => {
  it('SSO docs route page exists', () => {
    expect(fs.existsSync(SSO_DOCS_ROUTE)).toBe(true);
  });

  it('primaryActionHref points to the SSO configuration docs route (not #sso anchor)', async () => {
    const view = await buildUsersAccessPageView('apex-retail');
    expect(view.primaryActionHref).toBe('/admin/users-access/sso-configuration');
    expect(view.primaryActionHref).not.toContain('#');
  });

  it('Configure SSO action is now safe and links to docs', async () => {
    const view = await buildUsersAccessPageView('apex-retail');
    const configureSso = view.actionStrip.find((a) => a.id === 'configure_sso');
    expect(configureSso).toBeDefined();
    expect(configureSso?.status).toBe('safe');
    expect(configureSso?.href).toBe('/admin/users-access/sso-configuration');
  });

  it('Invite user action stays hard-gated with a dependency-explicit reason', async () => {
    const view = await buildUsersAccessPageView('apex-retail');
    const invite = view.actionStrip.find((a) => a.id === 'invite_user');
    expect(invite).toBeDefined();
    expect(invite?.status).toBe('hard_gated');
    expect(invite?.reason).toContain('SSO');
    expect(invite?.reason).toContain('Wave 27');
  });
});

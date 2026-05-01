import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { ContextBar } from '@/components/admin/ContextBar';
import { StewardEditorial } from '@/components/admin/StewardEditorial';
import { RoleAccessMatrix } from '@/components/admin/RoleAccessMatrix';
import { UsersAccessTabs } from '@/components/admin/UsersAccessTabs';
import { UsersAccessActionStrip } from '@/components/admin/UsersAccessActionStrip';
import { UserListTable } from '@/components/admin/UserListTable';
import { UserDetailDrawer } from '@/components/admin/UserDetailDrawer';
import { InviteList } from '@/components/admin/InviteList';
import { ProgramUserProvisionForm, type ProgramProvisionOption } from '@/components/admin/ProgramUserProvisionForm';
import {
  buildUsersAccessPageView,
  findUsersAccessUser,
  resolveUsersAccessTab,
} from '@/lib/admin/users-access-page-view';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getProgramPortfolio } from '@/lib/programs/queries';
import type { ClientKey } from '@/lib/client-config';

export const metadata = {
  title: 'Users & Access | Nexus Admin',
};

const BASE_URL = '/admin/users-access';

const ADMIN_TENANT_SLUG_BY_CLIENT_KEY: Partial<Record<ClientKey, string>> = {
  apexretail: 'apex-retail',
  meridian: 'meridian',
  arcturus: 'first-capital',
  keystone: 'keystone',
};

const PHASE_LABELS: Record<number, string> = {
  0: 'P0 Origination',
  1: 'P1 Discovery',
  2: 'P2 Synthesis',
  3: 'P3 Solution Design',
  4: 'P4 Execution Roadmap',
  5: 'P5 Approval & Mobilization',
  6: 'P6 Tower Handoff',
};

async function loadProvisionProgramOptions(): Promise<{
  tenantName: string;
  tenantSlug: string;
  programs: ProgramProvisionOption[];
}> {
  const activeClient = await getActiveClientRow();
  const tenantSlug = activeClient ? ADMIN_TENANT_SLUG_BY_CLIENT_KEY[activeClient.key] ?? 'apex-retail' : 'apex-retail';
  const tenantName = activeClient?.name ?? 'Active client';
  if (!activeClient) {
    return { tenantName, tenantSlug, programs: [] };
  }

  try {
    const user = await getCurrentUser();
    const programs = await getProgramPortfolio({
      clientId: activeClient.id,
      userId: user?.personId ?? (user?.clerkUserId ? `clerk:${user.clerkUserId}` : 'admin-users-access'),
      role: user?.primaryRole,
    });
    return {
      tenantName,
      tenantSlug,
      programs: programs.map((program) => ({
        id: program.id,
        name: program.name,
        phaseLabel: PHASE_LABELS[program.currentPhase ?? 0] ?? `P${program.currentPhase ?? 0}`,
      })),
    };
  } catch {
    return { tenantName, tenantSlug, programs: [] };
  }
}

export default async function UsersAccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; user?: string }>;
}) {
  const provision = await loadProvisionProgramOptions();
  const view = await buildUsersAccessPageView(provision.tenantSlug);
  const resolved = searchParams ? await searchParams : undefined;
  const activeTab = resolveUsersAccessTab(resolved?.tab);
  const activeUser = findUsersAccessUser(view, resolved?.user);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel={view.primaryAgentLabel}
          primaryActionLabel={view.primaryActionLabel}
          primaryActionHref={view.primaryActionHref}
        />
      }
    >
      <EditorialCanvas eyebrow={view.eyebrow} title={view.title} subtitle={view.subtitle}>
        <ContextBar
          tenant={view.context.tenant}
          mode={view.context.mode}
          agent={view.context.agent}
          data={view.context.data}
          liveStatus={view.context.liveStatus}
          liveStatusKind={view.context.liveStatusKind}
        />
        <StewardEditorial
          title={view.editorial.title}
          body={view.editorial.body}
          contextUsed={view.editorial.contextUsed}
          evidenceStrength={view.editorial.evidenceStrength}
          blocker={view.editorial.blocker}
          primaryAction={view.editorial.primaryAction}
        />
        <RoleAccessMatrix
          roles={view.roles}
          pendingInvitesCount={view.pendingInvitesCount}
          ssoConfigured={view.ssoConfigured}
        />

        <div data-users-access-depth="true" style={{ marginTop: SPACING.xl }}>
          <UsersAccessActionStrip actions={view.actionStrip} />
          <UsersAccessTabs tabs={view.tabs} activeTab={activeTab} baseUrl={BASE_URL} />

          {activeTab === 'all' && (
            <>
              <UserListTable
                users={view.userList}
                baseUrl={BASE_URL}
                activeUserId={activeUser?.id}
              />
              {activeUser && (
                <UserDetailDrawer user={activeUser} baseUrl={BASE_URL} returnTab="all" />
              )}
            </>
          )}

          {activeTab === 'roles' && (
            <section
              data-users-access-roles-tab="true"
              style={{
                background: COLORS.white,
                borderRadius: RADIUS.lg,
                border: `1px solid ${COLORS.ink}10`,
                padding: SPACING.lg,
              }}
            >
              <h2
                style={{
                  fontFamily: TYPOGRAPHY.serif,
                  fontSize: 22,
                  fontWeight: 700,
                  color: COLORS.ink,
                  margin: 0,
                  marginBottom: SPACING.md,
                  letterSpacing: '-0.01em',
                }}
              >
                Role inventory
              </h2>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
                data-role-summary-list="true"
              >
                {view.roleSummary.map((role, idx) => (
                  <li
                    key={role.id}
                    data-role-summary-id={role.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '180px 80px 1fr 100px',
                      gap: SPACING.md,
                      padding: `${SPACING.md} 0`,
                      borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}10`,
                      fontFamily: TYPOGRAPHY.sans,
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>
                      {role.label}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.serif,
                        fontSize: 22,
                        fontWeight: 700,
                        color: COLORS.ink,
                      }}
                    >
                      {role.members}
                    </div>
                    <div style={{ fontSize: 13, color: `${COLORS.ink}cc`, lineHeight: 1.5 }}>
                      {role.scope}
                    </div>
                    <div
                      style={{
                        justifySelf: 'end',
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 12,
                        color: `${COLORS.ink}99`,
                      }}
                    >
                      {role.permissionCount} perms
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activeTab === 'permissions' && (
            <section
              data-users-access-permissions-tab="true"
              style={{
                background: COLORS.white,
                borderRadius: RADIUS.lg,
                border: `1px solid ${COLORS.ink}10`,
                padding: SPACING.lg,
              }}
            >
              <h2
                style={{
                  fontFamily: TYPOGRAPHY.serif,
                  fontSize: 22,
                  fontWeight: 700,
                  color: COLORS.ink,
                  margin: 0,
                  marginBottom: SPACING.md,
                  letterSpacing: '-0.01em',
                }}
              >
                Permission map
              </h2>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
                data-permission-matrix-list="true"
              >
                {view.permissionMatrix.map((row, idx) => (
                  <li
                    key={row.id}
                    data-permission-id={row.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '200px 1fr 1fr',
                      gap: SPACING.md,
                      padding: `${SPACING.md} 0`,
                      borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}10`,
                      fontFamily: TYPOGRAPHY.sans,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 12,
                        fontWeight: 700,
                        color: COLORS.navy,
                      }}
                    >
                      {row.label}
                    </div>
                    <div style={{ fontSize: 13, color: `${COLORS.ink}cc`, lineHeight: 1.5 }}>
                      {row.description}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.xs }}>
                      {row.rolesAllowed.map((roleId) => (
                        <span
                          key={roleId}
                          style={{
                            padding: '2px 10px',
                            borderRadius: RADIUS.pill,
                            background: COLORS.skyPale,
                            color: COLORS.navy,
                            fontFamily: TYPOGRAPHY.mono,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {roleId}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activeTab === 'invites' && (
            <>
              <ProgramUserProvisionForm
                tenantName={provision.tenantName}
                programs={provision.programs}
              />
              <InviteList invites={view.inviteList} />
            </>
          )}
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

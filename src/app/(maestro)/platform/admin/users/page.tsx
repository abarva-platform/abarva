import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { InviteUserForm } from './InviteUserForm';

export const dynamic = 'force-dynamic';

// Priority 1 · user provisioning page. Admin-only. Lists active users +
// pending invitations + invite form. All actions hit /api/admin/invite.

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session.userId) redirect('/sign-in');

  const clerk = await clerkClient();
  const callingUser = await clerk.users.getUser(session.userId);
  const callingRole = (callingUser.publicMetadata?.role as string | undefined) ?? '';
  if (callingRole !== 'admin') {
    return (
      <main style={{ padding: 40, fontFamily: 'DM Sans, sans-serif' }}>
        <h1 style={{ fontFamily: 'Georgia, serif' }}>Admin access only</h1>
        <p>User provisioning is restricted to admin-role users.</p>
      </main>
    );
  }

  const [activeUsers, invitationsRaw] = await Promise.all([
    clerk.users.getUserList({ limit: 50 }),
    clerk.invitations.getInvitationList({ limit: 50, status: 'pending' }),
  ]);
  const activeData = Array.isArray(activeUsers) ? activeUsers : activeUsers.data;
  const pendingData = Array.isArray(invitationsRaw) ? invitationsRaw : invitationsRaw.data;

  return (
    <main style={{ minHeight: '100vh', background: '#F5F1EB', color: '#1a1612', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{pageCss}</style>
      <div className="au-shell">
        <header className="au-header">
          <div className="au-eyebrow">Admin · users</div>
          <h1 className="au-title">Users + invitations</h1>
          <p className="au-lede">
            Invite a teammate to a tenant, pick their role, and Clerk emails the sign-up link.
            Their public metadata is pre-seeded so the first sign-in lands them on the right tenant.
          </p>
        </header>

        <section className="au-panel">
          <div className="au-eyebrow">Invite a user</div>
          <InviteUserForm />
        </section>

        <section className="au-panel">
          <div className="au-section-head">
            <div className="au-eyebrow">Pending invitations</div>
            <span className="au-count">{pendingData.length}</span>
          </div>
          {pendingData.length === 0 ? (
            <p className="au-empty">No pending invitations.</p>
          ) : (
            <table className="au-table">
              <thead>
                <tr><th>Email</th><th>Role</th><th>Tenant</th><th>Sent</th></tr>
              </thead>
              <tbody>
                {pendingData.map((inv) => {
                  const md = (inv.publicMetadata ?? {}) as Record<string, unknown>;
                  return (
                    <tr key={inv.id}>
                      <td>{inv.emailAddress}</td>
                      <td><span className="au-pill">{String(md.role ?? '—')}</span></td>
                      <td>{String(md.clientName ?? md.clientId ?? '—')}</td>
                      <td>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="au-panel">
          <div className="au-section-head">
            <div className="au-eyebrow">Active users</div>
            <span className="au-count">{activeData.length}</span>
          </div>
          <table className="au-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Tenant</th></tr>
            </thead>
            <tbody>
              {activeData.map((u) => {
                const md = (u.publicMetadata ?? {}) as Record<string, unknown>;
                const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.emailAddresses[0]?.emailAddress || '—';
                const email = u.emailAddresses[0]?.emailAddress ?? '—';
                return (
                  <tr key={u.id}>
                    <td>{name}</td>
                    <td>{email}</td>
                    <td><span className="au-pill">{String(md.role ?? '—')}</span></td>
                    <td>{String(md.clientName ?? md.clientId ?? '—')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <footer className="au-footer">
          <p>Composite organization built from real-world data.</p>
          <p>Invitations use Clerk · notify=true · magic-link flow · expires per Clerk default (30 days).</p>
        </footer>
      </div>
    </main>
  );
}

const pageCss = `
.au-shell { max-width: 1100px; margin: 0 auto; padding: 40px 32px 80px; }
.au-header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid rgba(26,22,18,0.10); }
.au-eyebrow {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.14em; text-transform: uppercase; color: #3B82F6; font-weight: 700;
  margin-bottom: 8px;
}
.au-title { font-family: Georgia, serif; font-size: 40px; letter-spacing: -0.025em; margin: 0 0 12px; font-weight: 700; line-height: 1.1; }
.au-lede { font-size: 15px; line-height: 1.65; color: #3d342d; margin: 0; max-width: 680px; }
.au-panel {
  background: #FFFFFF; border: 1px solid rgba(26,22,18,0.10);
  border-radius: 16px; padding: 24px; margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(26,22,18,0.04);
}
.au-section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 16px; }
.au-count {
  font-family: 'JetBrains Mono', monospace; font-size: 12px;
  color: #6d625a; font-weight: 700;
}
.au-empty { margin: 0; color: #6d625a; font-size: 14px; font-style: italic; }
.au-table { width: 100%; border-collapse: collapse; }
.au-table th {
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.14em; text-transform: uppercase; color: #8a7e72; font-weight: 700;
  text-align: left; padding: 10px 12px; border-bottom: 1px solid rgba(26,22,18,0.1);
}
.au-table td {
  padding: 12px; border-bottom: 1px solid rgba(26,22,18,0.06);
  font-size: 13.5px; color: #1a1612;
}
.au-pill {
  display: inline-block; padding: 3px 9px; border-radius: 999px;
  background: rgba(59,130,246,0.1); color: #3B82F6;
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;
}
.au-footer {
  margin-top: 40px; padding-top: 18px; border-top: 1px solid rgba(26,22,18,0.10);
  font-size: 12px; color: #8a7e72; line-height: 1.7;
}
.au-footer p { margin: 0 0 3px; }
`;

import { MaestroChrome } from './MaestroChrome';
import { ClientChrome } from './ClientChrome';
import { getCurrentUser } from '@/lib/auth/current-user';

export async function AppChrome({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.primaryRole === 'maestro') {
    return <MaestroChrome>{children}</MaestroChrome>;
  }

  // Client viewer + observer — single-tenant chrome keyed on their only
  // accessible client. If they have zero memberships, fall through to
  // MaestroChrome so they see the standard "no data" empty state rather
  // than a broken client shell.
  const client = user.accessibleClients[0];
  if (!client) {
    return <MaestroChrome>{children}</MaestroChrome>;
  }

  return (
    <ClientChrome
      client={{ clientId: client.clientId, name: client.name }}
      role={user.primaryRole === 'observer' ? 'observer' : 'client_viewer'}
    >
      {children}
    </ClientChrome>
  );
}

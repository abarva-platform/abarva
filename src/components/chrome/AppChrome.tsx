import { MaestroChrome } from './MaestroChrome';
import { ClientChrome } from './ClientChrome';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getClientOption, isClientKey } from '@/lib/client-config';

export async function AppChrome({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.primaryRole === 'maestro') {
    return <MaestroChrome>{children}</MaestroChrome>;
  }

  // Client viewer + observer — single-tenant chrome keyed on their only
  // accessible client. If they have zero memberships, fall through to
  // a metadata-pinned tenant for demo users; otherwise fall through to
  // MaestroChrome so they see the standard "no data" empty state rather
  // than a broken client shell.
  const membershipClient = user.accessibleClients[0];
  const metadataClient = isClientKey(user.metadataClientKey)
    ? {
        clientId: user.metadataClientKey,
        name: getClientOption(user.metadataClientKey).name,
      }
    : null;
  const client = membershipClient
    ? { clientId: membershipClient.clientId, name: membershipClient.name }
    : metadataClient;
  if (!client) {
    return <MaestroChrome>{children}</MaestroChrome>;
  }

  return (
    <ClientChrome
      client={client}
      role={user.primaryRole === 'observer' ? 'observer' : 'client_viewer'}
    >
      {children}
    </ClientChrome>
  );
}

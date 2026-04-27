import { MaestroChrome } from './MaestroChrome';
import { getCurrentUser } from '@/lib/auth/current-user';

export async function AppChrome({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.primaryRole === 'maestro') {
    return <MaestroChrome>{children}</MaestroChrome>;
  }

  // Use the unified maestro nav shell for all authenticated sessions.
  return <MaestroChrome>{children}</MaestroChrome>;
}

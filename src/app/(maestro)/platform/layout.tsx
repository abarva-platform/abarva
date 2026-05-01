import type { ReactNode } from 'react';
import { requireProductModule } from '@/lib/auth/server-module-access';

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  await requireProductModule('setup');
  return <>{children}</>;
}

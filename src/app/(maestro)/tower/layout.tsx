import type { ReactNode } from 'react';
import { requireProductModule } from '@/lib/auth/server-module-access';

export default async function TowerLayout({ children }: { children: ReactNode }) {
  await requireProductModule('tower');
  return <>{children}</>;
}

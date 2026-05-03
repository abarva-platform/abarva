import type { ReactNode } from 'react';
import { requireProductModule } from '@/lib/auth/server-module-access';

export default async function StrategicMovesLayout({ children }: { children: ReactNode }) {
  await requireProductModule('programs');
  return <>{children}</>;
}

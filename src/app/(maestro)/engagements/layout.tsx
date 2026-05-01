import type { ReactNode } from 'react';
import { requireProductModule } from '@/lib/auth/server-module-access';

export default async function EngagementsLayout({ children }: { children: ReactNode }) {
  await requireProductModule('programs');
  return <>{children}</>;
}

import type { ReactNode } from 'react';
import { requireProductModule } from '@/lib/auth/server-module-access';

export default async function IntelligenceLayout({ children }: { children: ReactNode }) {
  await requireProductModule('intelligence');
  return <>{children}</>;
}

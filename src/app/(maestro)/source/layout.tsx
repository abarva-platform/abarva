import type { ReactNode } from 'react';
import { requireProductModule } from '@/lib/auth/server-module-access';

export default async function SourceLayout({ children }: { children: ReactNode }) {
  await requireProductModule('source');
  return <>{children}</>;
}

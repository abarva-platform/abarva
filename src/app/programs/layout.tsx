import type { Metadata } from 'next';
import { requireProductModule } from '@/lib/auth/server-module-access';

export const metadata: Metadata = {
  title: 'Programs · AbarVa',
  description: 'Portfolio, charter, and execution surfaces for AbarVa programs.',
};

export default async function ProgramsLayout({ children }: { children: React.ReactNode }) {
  await requireProductModule('programs');
  return <>{children}</>;
}

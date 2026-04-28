import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Programs · AbarVa',
  description: 'Portfolio, charter, and execution surfaces for AbarVa programs.',
};

export default function ProgramsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

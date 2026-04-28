import type { Metadata } from 'next';
import { SourceOriginatePage } from '@/components/source/SourceOriginatePage';

export const metadata: Metadata = { title: 'New Source Event · AbarVa' };

export default function Page() {
  return <SourceOriginatePage />;
}

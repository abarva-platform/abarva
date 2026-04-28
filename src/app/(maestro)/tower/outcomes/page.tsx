import type { Metadata } from 'next';
import { AiOutcomePage } from '@/components/tower/AiOutcomePage';

export const metadata: Metadata = { title: 'Outcome Realization · AI Control Tower' };

export default function Page() {
  return <AiOutcomePage />;
}

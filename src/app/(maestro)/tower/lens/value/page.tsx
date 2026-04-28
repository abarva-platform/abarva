import { Metadata } from 'next';
import { OutcomePage } from '@/components/tower/OutcomePage';

export const metadata: Metadata = { title: 'Value Lens · Control Tower' };

export default function Page() {
  return <OutcomePage />;
}

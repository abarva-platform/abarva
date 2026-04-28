import { ActivityPage } from '@/components/tower/ActivityPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cross-program activity · Tower',
};

export default function Page() {
  return <ActivityPage />;
}

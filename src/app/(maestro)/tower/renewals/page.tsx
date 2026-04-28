import type { Metadata } from 'next';
import { RenewalWorkspacePage } from '@/components/tower/RenewalWorkspacePage';

export const metadata: Metadata = { title: 'Renewal Workspace · Control Tower' };

export default function Page() {
  return <RenewalWorkspacePage />;
}

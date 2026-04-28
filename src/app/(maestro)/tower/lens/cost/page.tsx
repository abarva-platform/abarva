import { Metadata } from 'next';
import { CostLensPage } from '@/components/tower/CostLensPage';

export const metadata: Metadata = { title: 'Cost Lens · Control Tower' };

export default function Page() {
  return <CostLensPage />;
}

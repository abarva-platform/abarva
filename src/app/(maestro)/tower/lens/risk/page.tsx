import { Metadata } from 'next';
import { RiskLensPage } from '@/components/tower/RiskLensPage';

export const metadata: Metadata = { title: 'Risk Lens · Control Tower' };

export default function Page() {
  return <RiskLensPage />;
}

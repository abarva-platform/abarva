import { Metadata } from 'next';
import { AdoptionLensPage } from '@/components/tower/AdoptionLensPage';

export const metadata: Metadata = { title: 'Adoption Lens · Control Tower' };

export default function Page() {
  return <AdoptionLensPage />;
}

import { Metadata } from 'next';
import { InventoryLensPage } from '@/components/tower/InventoryLensPage';

export const metadata: Metadata = { title: 'Inventory Lens · Control Tower' };

export default function Page() {
  return <InventoryLensPage />;
}

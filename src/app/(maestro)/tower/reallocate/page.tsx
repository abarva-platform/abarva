import type { Metadata } from 'next';
import { BudgetReallocatePage } from '@/components/tower/BudgetReallocatePage';

export const metadata: Metadata = { title: 'Budget Reallocation · Control Tower' };

export default function Page() {
  return <BudgetReallocatePage />;
}

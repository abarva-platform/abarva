// INT-IDX-SOLUTIONS — Solution Archetypes index page.
// Server wrapper for SolutionsIndexPage client component.

import { SolutionsIndexPage } from '@/components/intelligence/SolutionsIndexPage';

export const metadata = {
  title: 'Solution Archetypes · Intelligence',
};

export default function SolutionsRoute() {
  return <SolutionsIndexPage />;
}

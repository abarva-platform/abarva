// INT-IDX-SOLUTIONS — Solution Archetypes index page.
// I5: SolutionsIndexPage (client component) replaced by IntelligenceSolutionsIndexPage
// (server component) with ProvenanceRibbon. View model built server-side via
// buildIntelligenceSolutionsIndexView(). Cards now link to solution detail pages.

import { IntelligenceSolutionsIndexPage } from '@/components/intelligence/IntelligenceSolutionsIndexPage';
import { buildIntelligenceSolutionsIndexView } from '@/lib/intelligence/intelligence-solutions-index-view';

export const metadata = {
  title: 'Solution Archetypes · Intelligence',
};

export default function SolutionsRoute() {
  const view = buildIntelligenceSolutionsIndexView();
  return <IntelligenceSolutionsIndexPage view={view} />;
}

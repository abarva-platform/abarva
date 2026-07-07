// INT-IDX-SOLUTIONS — Solution Archetypes index page.
// I5: SolutionsIndexPage (client component) replaced by IntelligenceSolutionsIndexPage
// (server component) with ProvenanceRibbon. View model built server-side via
// buildIntelligenceSolutionsIndexView(). Cards now link to solution detail pages.

import { IntelligenceSolutionsIndexPage } from '@/components/intelligence/IntelligenceSolutionsIndexPage';
import { getActiveClientRow } from '@/lib/active-client';
import { buildIntelligenceSolutionsIndexView } from '@/lib/intelligence/intelligence-solutions-index-view';

export const metadata = {
  title: 'Solution Archetypes · Intelligence',
};

export default async function SolutionsRoute() {
  const view = buildIntelligenceSolutionsIndexView();
  const activeClient = await getActiveClientRow().catch(() => null);
  return (
    <IntelligenceSolutionsIndexPage
      view={view}
      tenantName={activeClient?.name ?? 'Client workspace'}
    />
  );
}

// Per-request render (tenant-scoped reads / useSearchParams CSR bailout) — no static prerender.
export const dynamic = 'force-dynamic';

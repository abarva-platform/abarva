// INT-IDX-SIGNALS — Signal stream index page.
// I3: IntelligenceSignalsIndexPage (server component) with ProvenanceRibbon.
// View model built server-side via buildIntelligenceSignalsIndexView().
// Signal rows link to individual signal detail pages.

import { IntelligenceSignalsIndexPage } from '@/components/intelligence/IntelligenceSignalsIndexPage';
import { buildIntelligenceSignalsIndexView } from '@/lib/intelligence/intelligence-signals-index-view';

export const metadata = {
  title: 'Signal Stream · Intelligence',
};

export default function SignalsRoute() {
  const view = buildIntelligenceSignalsIndexView();
  return <IntelligenceSignalsIndexPage view={view} />;
}

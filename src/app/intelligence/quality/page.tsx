// INT-LNS-QUALITY — Intelligence knowledge quality lens page.
// I7: New server-component route providing a meta-view of the knowledge
// layer's own health. Deterministic view model via
// buildIntelligenceQualityLensView(); aggregates all pattern seed counts,
// contradiction status, solution count, and identified gaps.

import { IntelligenceQualityLensPage } from '@/components/intelligence/IntelligenceQualityLensPage';
import { buildIntelligenceQualityLensView } from '@/lib/intelligence/intelligence-quality-lens-view';

export const metadata = {
  title: 'Knowledge Quality · Intelligence',
};

export default function QualityLensRoute() {
  const view = buildIntelligenceQualityLensView();
  return <IntelligenceQualityLensPage view={view} />;
}

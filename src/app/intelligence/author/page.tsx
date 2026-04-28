import { IntelligenceAuthorPage } from '@/components/intelligence/IntelligenceAuthorPage';
import { buildIntelligenceAuthorPageView } from '@/lib/intelligence/intelligence-i6-view';

export const metadata = {
  title: 'Pattern authoring · Intelligence | Apex Retail Group',
};

export default function IntelligenceAuthorRoute() {
  return <IntelligenceAuthorPage view={buildIntelligenceAuthorPageView()} />;
}

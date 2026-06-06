import { IntelligenceAuthorPage } from '@/components/intelligence/IntelligenceAuthorPage';
import { getActiveClientRow } from '@/lib/active-client';
import { buildIntelligenceAuthorPageView } from '@/lib/intelligence/intelligence-i6-view';

export const metadata = {
  title: 'Pattern authoring · Intelligence',
};

export default async function IntelligenceAuthorRoute() {
  const activeClient = await getActiveClientRow().catch(() => null);
  return (
    <IntelligenceAuthorPage
      view={buildIntelligenceAuthorPageView()}
      tenantName={activeClient?.name ?? 'Client workspace'}
    />
  );
}

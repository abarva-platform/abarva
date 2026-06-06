import { IntelligenceSynthesisPage } from '@/components/intelligence/IntelligenceSynthesisPage';
import { getActiveClientRow } from '@/lib/active-client';
import { buildIntelligenceSynthesisPageView } from '@/lib/intelligence/intelligence-i6-view';

export const metadata = {
  title: 'Atlas synthesis · Intelligence',
};

export default async function IntelligenceSynthesizeRoute({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const activeClient = await getActiveClientRow().catch(() => null);
  return (
    <IntelligenceSynthesisPage
      view={buildIntelligenceSynthesisPageView(query)}
      tenantName={activeClient?.name ?? 'Client workspace'}
    />
  );
}

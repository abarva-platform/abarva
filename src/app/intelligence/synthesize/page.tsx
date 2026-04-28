import { IntelligenceSynthesisPage } from '@/components/intelligence/IntelligenceSynthesisPage';
import { buildIntelligenceSynthesisPageView } from '@/lib/intelligence/intelligence-i6-view';

export const metadata = {
  title: 'Atlas synthesis · Intelligence | Apex Retail Group',
};

export default async function IntelligenceSynthesizeRoute({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  return <IntelligenceSynthesisPage view={buildIntelligenceSynthesisPageView(query)} />;
}

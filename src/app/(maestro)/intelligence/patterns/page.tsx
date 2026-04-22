import { IntelligenceConsole } from '@/components/intelligence/IntelligenceConsole';
import { getAllGenomePatterns } from '@/lib/graph/retrieval';

export const dynamic = 'force-dynamic';

export default async function PatternsPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const patterns = await getAllGenomePatterns();
  const initialCode = params.code && patterns.some((p) => p.code === params.code)
    ? params.code
    : patterns[0]?.code ?? null;
  return <IntelligenceConsole patterns={patterns} initialCode={initialCode} />;
}

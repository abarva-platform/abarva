import { IntelligenceConsole } from '@/components/intelligence/IntelligenceConsole';
import { getAllGenomePatterns } from '@/lib/graph/retrieval';

export default async function IntelligencePage() {
  const patterns = await getAllGenomePatterns();
  const initialCode = patterns[0]?.code ?? null;
  return <IntelligenceConsole patterns={patterns} initialCode={initialCode} />;
}

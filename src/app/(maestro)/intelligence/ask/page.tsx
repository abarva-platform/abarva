import { AskIntelligenceConsole } from '@/components/intelligence/AskIntelligenceConsole';

export const dynamic = 'force-dynamic';

export default async function AskIntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <AskIntelligenceConsole initialQuery={q ?? ''} />;
}

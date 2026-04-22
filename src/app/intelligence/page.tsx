import { IntelligenceWorkspace } from '@/components/intelligence/IntelligenceWorkspace';

export const dynamic = 'force-dynamic';

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; thread?: string }>;
}) {
  const params = await searchParams;

  return (
    <IntelligenceWorkspace
      initialQuery={params.q ?? ''}
      initialThreadId={params.thread ?? null}
      routeMode="landing"
    />
  );
}

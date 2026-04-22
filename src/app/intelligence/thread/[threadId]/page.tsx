import { IntelligenceWorkspace } from '@/components/intelligence/IntelligenceWorkspace';

export const dynamic = 'force-dynamic';

export default async function IntelligenceThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;

  return (
    <IntelligenceWorkspace
      initialQuery=""
      initialThreadId={threadId}
      routeMode="thread"
    />
  );
}

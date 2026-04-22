import '../../intelligence/intelligence.css'
import { IntelligenceWorkspace } from '@/components/intelligence/IntelligenceWorkspace'

export const dynamic = 'force-dynamic'

export default async function DemoIntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; thread?: string }>
}) {
  const params = await searchParams

  return (
    <IntelligenceWorkspace
      initialQuery={params.q ?? ''}
      initialThreadId={params.thread ?? null}
      routeMode={params.thread ? 'thread' : 'landing'}
      basePath="/demo/intelligence"
      programTargetPath="/demo/programs/new"
    />
  )
}

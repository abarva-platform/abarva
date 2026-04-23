import { getActiveClientRow } from '@/lib/active-client';
import { getPatternManifestEntries } from '@/lib/intelligence/pattern-manifest';
import { SentinelIntelligenceShell } from '@/components/intelligence/SentinelIntelligenceShell';

export const dynamic = 'force-dynamic';

// /preview/intelligence · Sentinel anchors the surface. Patterns, benchmarks,
// vendors, contradictions all read from the authored pattern manifest and
// render in-page. No dark-mode orphans, no jump-out routes.

export default async function IntelligencePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; view?: string }>;
}) {
  const params = await searchParams;
  const activeClient = await getActiveClientRow();
  const patterns = getPatternManifestEntries();
  const initialSlug = params.slug ?? patterns.find((p) => p.demoCritical)?.slug ?? patterns[0]?.slug ?? null;
  const initialView = params.view ?? 'patterns';
  return (
    <SentinelIntelligenceShell
      patterns={patterns}
      initialSlug={initialSlug}
      initialView={initialView}
      activeClientName={activeClient?.name ?? null}
    />
  );
}

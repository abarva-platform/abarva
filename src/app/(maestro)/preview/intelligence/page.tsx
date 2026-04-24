import { getActiveClientKey, getActiveClientRow } from '@/lib/active-client';
import { getClientOption } from '@/lib/client-config';
import { getPatternManifestEntries, patternMatchesIndustry } from '@/lib/intelligence/pattern-manifest';
import { SentinelIntelligenceShell } from '@/components/intelligence/SentinelIntelligenceShell';

export const dynamic = 'force-dynamic';

// /preview/intelligence · Sentinel anchors the surface. Patterns, benchmarks,
// vendors, contradictions all read from the authored pattern manifest and
// render in-page. No dark-mode orphans, no jump-out routes.

export default async function IntelligencePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; view?: string; client?: string }>;
}) {
  const params = await searchParams;
  const activeClientKey = await getActiveClientKey(params.client);
  const activeClient = await getActiveClientRow(params.client);
  const clientOption = getClientOption(activeClientKey);
  const industryCode = activeClient?.industry_code ?? null;
  const patterns = getPatternManifestEntries().filter((pattern) => patternMatchesIndustry(pattern, industryCode));
  const initialSlug = params.slug ?? patterns.find((p) => p.demoCritical)?.slug ?? patterns[0]?.slug ?? null;
  const initialView = params.view ?? 'patterns';
  return (
    <SentinelIntelligenceShell
      patterns={patterns}
      initialSlug={initialSlug}
      initialView={initialView}
      activeClientName={activeClient?.name ?? clientOption.name}
    />
  );
}

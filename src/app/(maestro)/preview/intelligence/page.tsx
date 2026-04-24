import { getActiveClientKey, getActiveClientRow } from '@/lib/active-client';
import { getClientOption } from '@/lib/client-config';
import {
  getPatternApplicableProgramsForTenant,
  getPatternManifestEntriesWithMetrics,
  patternMatchesIndustry,
} from '@/lib/intelligence/pattern-manifest';
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
  const patterns = getPatternManifestEntriesWithMetrics(activeClientKey)
    .filter((pattern) => patternMatchesIndustry(pattern, industryCode));
  const applicableProgramsByPattern = Object.fromEntries(
    patterns.map((pattern) => [pattern.slug, getPatternApplicableProgramsForTenant(pattern.slug, activeClientKey)]),
  );
  const initialSlug = params.slug ?? patterns.find((p) => p.demoCritical)?.slug ?? patterns[0]?.slug ?? null;
  const initialView = params.view ?? 'patterns';
  return (
    <SentinelIntelligenceShell
      patterns={patterns}
      initialSlug={initialSlug}
      initialView={initialView}
      activeClientKey={activeClientKey}
      activeClientName={activeClient?.name ?? clientOption.name}
      applicableProgramsByPattern={applicableProgramsByPattern}
    />
  );
}

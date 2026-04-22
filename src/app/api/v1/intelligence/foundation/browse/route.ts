// GET /api/v1/intelligence/foundation/browse
// Foundation workspace browse model for the Intelligence landing page.
//
// This route intentionally returns only content types we can honestly
// support in the hosted app: pattern/topic/program detail pages, tower-wide
// contradiction and use-case views, viewer context, and external/library
// sources that either open on the source URL or land in Ask Intelligence.

import { NextRequest } from 'next/server';
import { loadLibraryCatalog, type LibraryEntry } from '@/lib/intelligence/library';
import { getServerSupabase } from '@/lib/supabase-server';
import { requireTenancy, tenancyErrorResponse } from '../../../_intel-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BrowseLayer = 'L1' | 'L2' | 'L3' | 'L4';

type BrowseFacet =
  | 'pattern'
  | 'benchmark'
  | 'vendor'
  | 'regulation'
  | 'framework'
  | 'research'
  | 'use_case'
  | 'contradiction'
  | 'topic'
  | 'program'
  | 'viewer';

interface BrowseTile {
  id: BrowseFacet;
  label: string;
  count: number;
  active: boolean;
  support: 'published' | 'generated' | 'empty';
}

interface BrowseItem {
  id: string;
  title: string;
  subtitle: string | null;
  detail: string | null;
  href: string | null;
  sourceUrl: string | null;
  actionLabel: string | null;
  support: 'published' | 'generated' | 'reference';
}

const FACETS_BY_LAYER: Record<BrowseLayer, Array<{ id: BrowseFacet; label: string }>> = {
  L1: [
    { id: 'pattern', label: 'Patterns' },
    { id: 'benchmark', label: 'Benchmarks' },
    { id: 'vendor', label: 'Vendors' },
    { id: 'regulation', label: 'Regulation' },
    { id: 'framework', label: 'Frameworks' },
    { id: 'research', label: 'Research' },
  ],
  L2: [
    { id: 'use_case', label: 'Use cases' },
    { id: 'contradiction', label: 'Contradictions' },
    { id: 'topic', label: 'Topics' },
  ],
  L3: [{ id: 'program', label: 'Programs' }],
  L4: [{ id: 'viewer', label: 'Viewer' }],
};

const LAYER_COPY: Record<BrowseLayer, { title: string; description: string; empty: string }> = {
  L1: {
    title: 'Public foundation',
    description:
      'Reusable pattern capital, benchmarks, vendors, regulations, and research. This is where the market-facing intelligence should feel browseable, not mysterious.',
    empty: 'No public foundation content is indexed for this slice yet.',
  },
  L2: {
    title: 'Enterprise context',
    description:
      'What is grounded inside the tenant: use cases, contradictions, and reusable engagement topics. This layer should help a buyer see whether the system understands their estate.',
    empty: 'No enterprise context is indexed for this slice yet.',
  },
  L3: {
    title: 'Programs in motion',
    description:
      'Active programs that already carry sponsor, phase, and contradiction context. This is the fastest path from intelligence to operating work.',
    empty: 'No active programs are pinned for this client yet.',
  },
  L4: {
    title: 'Viewer context',
    description:
      'The current viewer and their tenancy lock. This layer exists to make the surface feel trustworthy and scoped, not generic.',
    empty: 'Viewer context is not available right now.',
  },
};

function sanitizeLibraryEntry(entry: LibraryEntry): BrowseItem {
  const opensSource = entry.sourceUrl && !entry.href;
  const generatedHref =
    !entry.href && !entry.sourceUrl
      ? `/intelligence/ask?q=${encodeURIComponent(entry.title)}`
      : null;
  return {
    id: entry.id,
    title: entry.title,
    subtitle: entry.subtitle,
    detail: entry.detail,
    href: entry.href ?? generatedHref,
    sourceUrl: entry.sourceUrl,
    actionLabel: entry.href ? 'Open detail' : opensSource ? 'Open source' : 'Ask Intelligence',
    support: entry.href ? 'published' : opensSource ? 'reference' : 'generated',
  };
}

function libraryItems(catalog: Awaited<ReturnType<typeof loadLibraryCatalog>>, facet: BrowseFacet | null): BrowseItem[] {
  const allowed = new Set<BrowseFacet>(['pattern', 'benchmark', 'vendor', 'regulation', 'framework', 'research']);
  const rows = catalog.entries.filter((entry) => allowed.has(entry.category as BrowseFacet));
  const filtered = facet
    ? rows.filter((entry) => (facet === 'research' ? entry.category === 'research' || entry.category === 'news' : entry.category === facet))
    : rows;
  return filtered.slice(0, 80).map(sanitizeLibraryEntry);
}

function libraryTileCount(catalog: Awaited<ReturnType<typeof loadLibraryCatalog>>, facet: BrowseFacet): number {
  if (facet === 'research') {
    return catalog.counts.research + catalog.counts.news;
  }
  return catalog.counts[facet as keyof typeof catalog.counts] ?? 0;
}

async function loadEnterpriseItems(clientId: string, facet: BrowseFacet | null): Promise<BrowseItem[]> {
  const sb = getServerSupabase();

  if (!facet || facet === 'use_case') {
    const { data } = await sb
      .from('use_cases')
      .select('id, name, stage, business_unit, updated_at')
      .eq('client_id', clientId)
      .order('updated_at', { ascending: false })
      .limit(80);

    if (facet === 'use_case') {
      return ((data as Array<{
        id: string;
        name: string | null;
        stage: string | null;
        business_unit: string | null;
        updated_at: string | null;
      }> | null) ?? []).map((row) => ({
        id: `use-case:${row.id}`,
        title: row.name ?? 'Untitled use case',
        subtitle: row.business_unit ?? 'Business unit pending',
        detail: row.stage ? `Stage · ${row.stage}` : 'Stage pending',
        href: '/tower',
        sourceUrl: null,
        actionLabel: 'Open tower',
        support: 'published',
      }));
    }
  }

  if (facet === 'contradiction') {
    const { data } = await sb
      .from('contradictions')
      .select('id, contradiction_type, severity, description, triggered_engagement_id')
      .eq('client_id', clientId)
      .is('resolved_at', null)
      .order('detected_at', { ascending: false })
      .limit(80);

    return ((data as Array<{
      id: string;
      contradiction_type: string | null;
      severity: string | null;
      description: string | null;
      triggered_engagement_id: string | null;
    }> | null) ?? []).map((row) => ({
      id: `contradiction:${row.id}`,
      title: row.contradiction_type?.replaceAll('_', ' ') ?? 'Open contradiction',
      subtitle: row.severity ? `${row.severity} severity` : 'Severity pending',
      detail: row.description,
      href: row.triggered_engagement_id ? `/engagements/${encodeURIComponent(row.triggered_engagement_id)}` : '/tower',
      sourceUrl: null,
      actionLabel: row.triggered_engagement_id ? 'Open engagement' : 'Open tower',
      support: 'published',
    }));
  }

  if (facet === 'topic') {
    const catalog = await loadLibraryCatalog({ clientId });
    return catalog.entries
      .filter((entry) => entry.category === 'topic')
      .slice(0, 80)
      .map(sanitizeLibraryEntry);
  }

  return [];
}

async function loadProgramItems(clientId: string): Promise<BrowseItem[]> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('engagements')
    .select('id, graph_node_id, name, current_phase, updated_at, industry_code')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(80);

  return ((data as Array<{
    id: string;
    graph_node_id: string;
    name: string;
    current_phase: number | null;
    updated_at: string | null;
    industry_code: string | null;
  }> | null) ?? []).map((row) => ({
    id: `program:${row.id}`,
    title: row.name,
    subtitle: row.industry_code ?? 'Industry pending',
    detail: row.current_phase != null ? `Phase ${row.current_phase}` : 'Phase pending',
    href: `/engagements/${encodeURIComponent(row.graph_node_id)}`,
    sourceUrl: null,
    actionLabel: 'Open program',
    support: 'published',
  }));
}

async function loadViewerItems(clientId: string, userId: string): Promise<BrowseItem[]> {
  const sb = getServerSupabase();
  const [{ data: client }, { data: person }] = await Promise.all([
    sb.from('clients').select('name, industry_code').eq('id', clientId).maybeSingle(),
    sb.from('persons').select('name, role').eq('id', userId).maybeSingle(),
  ]);

  return [
    {
      id: `viewer:${userId}`,
      title: (person as { name?: string | null } | null)?.name ?? 'Current viewer',
      subtitle: (person as { role?: string | null } | null)?.role ?? 'Role pending',
      detail: `${(client as { name?: string | null } | null)?.name ?? 'Client'} · ${(client as { industry_code?: string | null } | null)?.industry_code ?? 'industry pending'}`,
      href: '/home',
      sourceUrl: null,
      actionLabel: 'Open home',
      support: 'published',
    },
  ];
}

async function facetCounts(clientId: string, catalog: Awaited<ReturnType<typeof loadLibraryCatalog>>) {
  const sb = getServerSupabase();
  const [useCaseCount, contradictionCount, programCount] = await Promise.all([
    sb.from('use_cases').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
    sb.from('contradictions').select('*', { count: 'exact', head: true }).eq('client_id', clientId).is('resolved_at', null),
    sb.from('engagements').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'active'),
  ]);

  return {
    use_case: useCaseCount.count ?? 0,
    contradiction: contradictionCount.count ?? 0,
    topic: catalog.counts.topic ?? 0,
    program: programCount.count ?? 0,
    viewer: 1,
  };
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenancy();
    const url = new URL(req.url);
    const layer = (url.searchParams.get('layer') ?? 'L1') as BrowseLayer;
    const facet = (url.searchParams.get('facet') ?? null) as BrowseFacet | null;

    const catalog = await loadLibraryCatalog({ clientId: ctx.clientId });
    const counts = await facetCounts(ctx.clientId, catalog);
    const facets = FACETS_BY_LAYER[layer] ?? FACETS_BY_LAYER.L1;
    const activeFacet = facet && facets.some((entry) => entry.id === facet) ? facet : facets[0]?.id ?? null;

    let items: BrowseItem[] = [];
    if (layer === 'L1') items = libraryItems(catalog, activeFacet);
    if (layer === 'L2') items = await loadEnterpriseItems(ctx.clientId, activeFacet);
    if (layer === 'L3') items = await loadProgramItems(ctx.clientId);
    if (layer === 'L4') items = await loadViewerItems(ctx.clientId, ctx.userId);

    const tiles: BrowseTile[] = facets.map((entry) => {
      const count =
        layer === 'L1'
          ? libraryTileCount(catalog, entry.id)
          : counts[entry.id as keyof typeof counts] ?? 0;
      return {
        id: entry.id,
        label: entry.label,
        count,
        active: entry.id === activeFacet,
        support: count > 0 ? 'published' : layer === 'L1' && ['regulation', 'framework'].includes(entry.id) ? 'empty' : 'generated',
      };
    });

    return Response.json({
      layer,
      activeLayer: layer,
      title: LAYER_COPY[layer].title,
      description: LAYER_COPY[layer].description,
      emptyState: LAYER_COPY[layer].empty,
      tiles,
      items,
      totalCount: items.length,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    console.error('[GET /intelligence/foundation/browse]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

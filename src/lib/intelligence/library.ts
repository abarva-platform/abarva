import { getServerSupabase } from '@/lib/supabase-server';
import { getAllGenomePatterns } from '@/lib/graph/retrieval';
import { VENDOR_CATALOG } from '@/lib/config/vendor-catalog';

// Library catalog loader — classifies knowledge_sources + Genome patterns +
// vendors into the buckets the Library page renders. Empty-safe — every
// loader returns [] on error and the page shows honest empty states.

export type LibraryCategory =
  | 'topic'
  | 'pattern'
  | 'vendor'
  | 'regulation'
  | 'framework'
  | 'benchmark'
  | 'research'
  | 'news';

export interface LibraryEntry {
  id: string;
  category: LibraryCategory;
  title: string;
  subtitle: string | null;
  detail: string | null;
  industryTags: string[];
  topicTags: string[];
  publishedAt: string | null;
  href: string | null;
  sourceUrl: string | null;
}

export interface LibraryCatalog {
  entries: LibraryEntry[];
  counts: Record<LibraryCategory, number>;
  industries: string[];
  topics: string[];
  totalSources: number;
  pendingSources: number;
}

const CONTENT_TYPE_TO_CATEGORY: Record<string, LibraryCategory> = {
  regulation: 'regulation',
  framework: 'framework',
  benchmark: 'benchmark',
  research_report: 'research',
  vendor_doc: 'vendor',
  vendor_posture: 'vendor',
  news_article: 'news',
  case_study: 'research',
  enforcement_action: 'regulation',
};

function emptyCounts(): Record<LibraryCategory, number> {
  return {
    topic: 0,
    pattern: 0,
    vendor: 0,
    regulation: 0,
    framework: 0,
    benchmark: 0,
    research: 0,
    news: 0,
  };
}

export async function loadLibraryCatalog(): Promise<LibraryCatalog> {
  const sb = getServerSupabase();
  const entries: LibraryEntry[] = [];
  const counts = emptyCounts();
  const industrySet = new Set<string>();
  const topicSet = new Set<string>();
  let totalSources = 0;
  let pendingSources = 0;

  // ── knowledge_sources → regulation / framework / benchmark / research / news / vendor
  try {
    const { data } = await sb
      .from('knowledge_sources')
      .select('id, source_key, title, publisher, content_type, industry_tags, topic_tags, published_at, source_url, status')
      .order('published_at', { ascending: false })
      .limit(500);

    const rows = (data as Array<{
      id: string;
      source_key: string;
      title: string;
      publisher: string;
      content_type: string;
      industry_tags: string[] | null;
      topic_tags: string[] | null;
      published_at: string | null;
      source_url: string | null;
      status: string;
    }> | null) ?? [];

    totalSources = rows.length;
    for (const r of rows) {
      if (r.status === 'pending' || r.status === 'ingesting' || r.status === 'failed') {
        pendingSources += 1;
        continue;
      }
      const category = CONTENT_TYPE_TO_CATEGORY[r.content_type] ?? 'research';
      entries.push({
        id: r.id,
        category,
        title: r.title,
        subtitle: r.publisher,
        detail: (r.topic_tags && r.topic_tags.length > 0)
          ? r.topic_tags.slice(0, 4).join(' · ')
          : null,
        industryTags: r.industry_tags ?? [],
        topicTags: r.topic_tags ?? [],
        publishedAt: r.published_at,
        href: null,
        sourceUrl: r.source_url,
      });
      counts[category] += 1;
      for (const i of r.industry_tags ?? []) industrySet.add(i);
      for (const t of r.topic_tags ?? []) topicSet.add(t);
    }
  } catch (err) {
    console.warn('[library.knowledge_sources]', err);
  }

  // ── Genome patterns
  try {
    const patterns = await getAllGenomePatterns();
    for (const p of patterns) {
      entries.push({
        id: p.code,
        category: 'pattern',
        title: `${p.code} · ${p.name}`,
        subtitle: p.category ?? null,
        detail: typeof p.failure_rate === 'number'
          ? `${Math.round(p.failure_rate * 100)}% historical failure rate`
          : null,
        industryTags: [],
        topicTags: p.category ? [p.category] : [],
        publishedAt: null,
        href: `/intelligence/patterns?code=${encodeURIComponent(p.code)}`,
        sourceUrl: null,
      });
      counts.pattern += 1;
    }
  } catch (err) {
    console.warn('[library.patterns]', err);
  }

  // ── Topic aggregation — synthetic entries from topic_tags so topics render
  // as browsable items even without a dedicated topics table.
  const topicCounts = new Map<string, number>();
  for (const e of entries) {
    for (const t of e.topicTags) {
      topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
    }
  }
  for (const [topic, count] of topicCounts.entries()) {
    if (count < 2) continue; // only surface topics that span at least 2 sources
    entries.push({
      id: `topic:${topic}`,
      category: 'topic',
      title: topic,
      subtitle: `${count} indexed sources`,
      detail: null,
      industryTags: [],
      topicTags: [topic],
      publishedAt: null,
      href: `/intelligence/ask?q=${encodeURIComponent(topic)}`,
      sourceUrl: null,
    });
    counts.topic += 1;
  }

  // ── Vendors from the structured catalog. subtitle carries category so
  // the Library page can group vendors under collapsible sub-sections;
  // industryTags feeds the industry facet; detail shows a pricing or
  // contract hint when available.
  try {
    for (const v of VENDOR_CATALOG) {
      entries.push({
        id: `vendor:${v.name}`,
        category: 'vendor',
        title: v.name,
        subtitle: v.category,
        detail: v.detail ?? v.pricing ?? null,
        industryTags: v.industries,
        topicTags: [],
        publishedAt: null,
        href: `/intelligence/ask?q=${encodeURIComponent(v.name)}`,
        sourceUrl: null,
      });
      counts.vendor += 1;
      for (const i of v.industries) industrySet.add(i);
    }
  } catch (err) {
    console.warn('[library.vendors]', err);
  }

  return {
    entries,
    counts,
    industries: Array.from(industrySet).sort(),
    topics: Array.from(topicSet).sort(),
    totalSources,
    pendingSources,
  };
}

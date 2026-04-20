import Link from 'next/link';
import { loadLibraryCatalog, type LibraryCategory, type LibraryEntry } from '@/lib/intelligence/library';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const TEAL = '#2DD4C8';
const PURPLE = '#9B6DFF';
const AMBER = '#F5C54A';
const GREEN = '#3FB27F';
const CORAL = '#FF6B4A';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const MONO = 'JetBrains Mono, monospace';

const CATEGORY_ORDER: LibraryCategory[] = [
  'topic',
  'pattern',
  'vendor',
  'regulation',
  'framework',
  'benchmark',
  'research',
  'news',
];

const CATEGORY_LABEL: Record<LibraryCategory, string> = {
  topic: 'Topics',
  pattern: 'Patterns',
  vendor: 'Vendors',
  regulation: 'Regulations',
  framework: 'Frameworks',
  benchmark: 'Benchmarks',
  research: 'Research',
  news: 'News',
};

const CATEGORY_COLOR: Record<LibraryCategory, string> = {
  topic: TEAL,
  pattern: PURPLE,
  vendor: AMBER,
  regulation: CORAL,
  framework: GREEN,
  benchmark: TEAL,
  research: INK,
  news: MUTE,
};

function AskBar({ initialQuery }: { initialQuery: string }) {
  return (
    <form
      action="/intelligence/ask"
      method="get"
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 28,
        padding: '14px 18px',
        background: PANEL_BG,
        border: BORDER,
        borderRadius: 12,
      }}
    >
      <input
        name="q"
        defaultValue={initialQuery}
        placeholder="Ask Intelligence — e.g., what do we know about Snowflake in healthcare?"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          color: INK,
          fontSize: 14,
          outline: 'none',
          fontFamily: 'DM Sans, -apple-system, sans-serif',
        }}
      />
      <button
        type="submit"
        style={{
          padding: '8px 16px',
          background: TEAL,
          color: '#0A0A0A',
          border: 'none',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: MONO,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Ask →
      </button>
    </form>
  );
}

function Facet({
  label,
  count,
  active,
  color,
  href,
}: {
  label: string;
  count: number;
  active: boolean;
  color: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: 8,
        background: active ? 'rgba(45,212,200,0.08)' : 'transparent',
        border: active ? `0.5px solid ${TEAL}` : '0.5px solid transparent',
        textDecoration: 'none',
        color: active ? INK : MUTE,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, opacity: count > 0 ? 1 : 0.3 }} />
        <span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{label}</span>
      </span>
      <span style={{ fontFamily: MONO, fontSize: 10, color: MUTE }}>{count}</span>
    </Link>
  );
}

function EntryCard({ e }: { e: LibraryEntry }) {
  const href = e.href ?? e.sourceUrl ?? `/intelligence/ask?q=${encodeURIComponent(e.title)}`;
  const external = !!e.sourceUrl && !e.href;
  const color = CATEGORY_COLOR[e.category];

  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 14,
        background: PANEL_BG,
        border: BORDER,
        borderRadius: 10,
        textDecoration: 'none',
        color: INK,
        minHeight: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9,
            color,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {CATEGORY_LABEL[e.category]}
        </span>
        {e.publishedAt && (
          <span style={{ fontFamily: MONO, fontSize: 9, color: MUTE, marginLeft: 'auto' }}>
            {e.publishedAt.slice(0, 10)}
          </span>
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3, marginBottom: 4 }}>{e.title}</div>
      {e.subtitle && (
        <div style={{ fontSize: 12, color: MUTE, marginBottom: 6 }}>{e.subtitle}</div>
      )}
      {e.detail && (
        <div style={{ fontSize: 11.5, color: MUTE, marginTop: 'auto', fontFamily: MONO }}>{e.detail}</div>
      )}
      {e.industryTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {e.industryTags.slice(0, 3).map((t) => (
            <span
              key={t}
              style={{
                fontFamily: MONO,
                fontSize: 9,
                padding: '2px 6px',
                background: 'rgba(255,255,255,0.04)',
                border: BORDER,
                borderRadius: 4,
                color: MUTE,
                letterSpacing: '0.08em',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; industry?: string; q?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category && (CATEGORY_ORDER as string[]).includes(params.category)
    ? (params.category as LibraryCategory)
    : null;
  const activeIndustry = params.industry ?? null;
  const initialQuery = params.q ?? '';

  const catalog = await loadLibraryCatalog();

  const filtered = catalog.entries.filter((e) => {
    if (activeCategory && e.category !== activeCategory) return false;
    if (activeIndustry && !e.industryTags.includes(activeIndustry)) return false;
    return true;
  });

  const qsForCat = (c: LibraryCategory | null) => {
    const parts: string[] = [];
    if (c) parts.push(`category=${c}`);
    if (activeIndustry) parts.push(`industry=${encodeURIComponent(activeIndustry)}`);
    return parts.length > 0 ? `?${parts.join('&')}` : '';
  };

  const qsForIndustry = (i: string | null) => {
    const parts: string[] = [];
    if (activeCategory) parts.push(`category=${activeCategory}`);
    if (i) parts.push(`industry=${encodeURIComponent(i)}`);
    return parts.length > 0 ? `?${parts.join('&')}` : '';
  };

  const total = Object.values(catalog.counts).reduce((s, n) => s + n, 0);
  const noIndexed = catalog.totalSources === 0 && catalog.counts.pattern === 0 && catalog.counts.vendor === 0;

  return (
    <div
      style={{
        padding: '28px 32px 60px',
        maxWidth: 1600,
        margin: '0 auto',
        color: INK,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', marginBottom: 6 }}>
          INTELLIGENCE · LIBRARY
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
          What AbarVa knows
        </h1>
        <div style={{ fontSize: 13.5, color: MUTE, marginTop: 6, maxWidth: 720 }}>
          Browsable catalog across topics, patterns, vendors, regulations, frameworks, benchmarks, research, and news.
          Cross-engagement knowledge, cited. {total} entries indexed
          {catalog.pendingSources > 0 ? ` · ${catalog.pendingSources} sources pending ingestion` : ''}.
        </div>
      </div>

      <AskBar initialQuery={initialQuery} />

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: facets */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', marginBottom: 4, padding: '0 12px' }}>
            CATEGORY
          </div>
          <Facet
            label="All"
            count={total}
            active={activeCategory === null}
            color={INK}
            href={`/intelligence/library${qsForCat(null)}`}
          />
          {CATEGORY_ORDER.map((c) => (
            <Facet
              key={c}
              label={CATEGORY_LABEL[c]}
              count={catalog.counts[c]}
              active={activeCategory === c}
              color={CATEGORY_COLOR[c]}
              href={`/intelligence/library${qsForCat(c)}`}
            />
          ))}

          {catalog.industries.length > 0 && (
            <>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  color: MUTE,
                  letterSpacing: '0.14em',
                  margin: '14px 0 4px',
                  padding: '0 12px',
                }}
              >
                INDUSTRY
              </div>
              <Facet
                label="All industries"
                count={total}
                active={activeIndustry === null}
                color={INK}
                href={`/intelligence/library${qsForIndustry(null)}`}
              />
              {catalog.industries.slice(0, 12).map((i) => {
                const n = catalog.entries.filter((e) => e.industryTags.includes(i)).length;
                return (
                  <Facet
                    key={i}
                    label={i}
                    count={n}
                    active={activeIndustry === i}
                    color={INK}
                    href={`/intelligence/library${qsForIndustry(i)}`}
                  />
                );
              })}
            </>
          )}
        </aside>

        {/* Right: catalog grid */}
        <div>
          {noIndexed ? (
            <div
              style={{
                padding: 40,
                border: BORDER,
                borderRadius: 12,
                background: PANEL_BG,
                color: MUTE,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              The library is empty. Pack B Tier 1–4 ingestion populates knowledge_sources;
              Genome patterns land as the graph is seeded. Until then, Ask Intelligence
              returns empty-state messages per intent class.
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: 40,
                border: BORDER,
                borderRadius: 12,
                background: PANEL_BG,
                color: MUTE,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              No matches for the current filter. Clear a facet or try Ask Intelligence directly.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {filtered.slice(0, 200).map((e) => (
                <EntryCard key={`${e.category}:${e.id}`} e={e} />
              ))}
            </div>
          )}
          {filtered.length > 200 && (
            <div style={{ marginTop: 16, fontSize: 12, color: MUTE, fontFamily: MONO }}>
              Showing 200 of {filtered.length}. Refine by category or industry to see the rest.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

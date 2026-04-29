// /admin/reasoning/corpus-stats — Pattern corpus statistics.
//
// Server component. Analyses the full pattern corpus across all four families
// (SOURCING_PATTERNS, SOURCE_LIFECYCLE_PATTERNS, PROGRAM_LIFECYCLE_PATTERNS,
// CAT_LIFECYCLE_PATTERNS) and renders:
//   1. Overview stats row (4 cards)
//   2. Family breakdown table
//   3. Body-length distribution chart (pure SVG)
//   4. Top 20 keywords table
//   5. Shortest / longest pattern extremes (bottom 3 + top 3)

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCING_PATTERNS } from '@/lib/intelligence/seed-patterns-sourcing';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { CAT_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns-cat';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Corpus stats · AbarVa Admin',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface PatternEntry {
  id: string;
  body: string;
  family: FamilyKey;
}

type FamilyKey = 'sourcing' | 'source-event' | 'program' | 'cat';

interface KeywordRow {
  word: string;
  totalCount: number;
  patternCount: number;
}

interface DistributionBucket {
  label: string;
  count: number;
  rangeStart: number;
  rangeEnd: number;
}

// ── Corpus assembly ───────────────────────────────────────────────────────────

function assembleCorpus(): PatternEntry[] {
  const entries: PatternEntry[] = [];

  for (const p of SOURCING_PATTERNS) {
    entries.push({ id: p.id, body: p.body, family: 'sourcing' });
  }
  // SOURCE_LIFECYCLE_PATTERNS already includes CAT_LIFECYCLE_PATTERNS via spread.
  // We treat the "pure" source lifecycle and CAT entries separately for the
  // family breakdown, so we split them out here.
  const catIds = new Set(CAT_LIFECYCLE_PATTERNS.map((p) => p.patternId));
  for (const p of SOURCE_LIFECYCLE_PATTERNS) {
    if (catIds.has(p.patternId)) {
      entries.push({ id: p.patternId, body: p.body, family: 'cat' });
    } else {
      entries.push({ id: p.patternId, body: p.body, family: 'source-event' });
    }
  }
  for (const p of PROGRAM_LIFECYCLE_PATTERNS) {
    entries.push({ id: p.patternId, body: p.body, family: 'program' });
  }

  return entries;
}

// ── Stats computation ─────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'this', 'that', 'with', 'from', 'have', 'will',
  'when', 'which', 'into', 'must', 'then', 'been', 'they', 'than',
  'also', 'each', 'more', 'such', 'their', 'where', 'these', 'after',
  'before', 'other', 'within',
]);

function tokenise(body: string): string[] {
  return body
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
}

function computeKeywords(entries: PatternEntry[]): KeywordRow[] {
  const totalCount = new Map<string, number>();
  const patternCount = new Map<string, number>();

  for (const entry of entries) {
    const tokens = tokenise(entry.body);
    const seenInPattern = new Set<string>();
    for (const token of tokens) {
      totalCount.set(token, (totalCount.get(token) ?? 0) + 1);
      if (!seenInPattern.has(token)) {
        patternCount.set(token, (patternCount.get(token) ?? 0) + 1);
        seenInPattern.add(token);
      }
    }
  }

  const rows: KeywordRow[] = [];
  for (const [word, count] of totalCount.entries()) {
    rows.push({ word, totalCount: count, patternCount: patternCount.get(word) ?? 0 });
  }
  rows.sort((a, b) => b.totalCount - a.totalCount);
  return rows.slice(0, 20);
}

function buildDistribution(entries: PatternEntry[]): DistributionBucket[] {
  const BUCKET_SIZE = 500;
  const NUM_BUCKETS = 10;
  const buckets: DistributionBucket[] = Array.from({ length: NUM_BUCKETS }, (_, i) => ({
    label: i === NUM_BUCKETS - 1
      ? `${i * BUCKET_SIZE}+`
      : `${i * BUCKET_SIZE}–${(i + 1) * BUCKET_SIZE}`,
    count: 0,
    rangeStart: i * BUCKET_SIZE,
    rangeEnd: (i + 1) * BUCKET_SIZE,
  }));

  for (const entry of entries) {
    const len = entry.body.length;
    const idx = Math.min(Math.floor(len / BUCKET_SIZE), NUM_BUCKETS - 1);
    buckets[idx].count++;
  }

  return buckets;
}

function countUniqueTokens(entries: PatternEntry[]): number {
  const seen = new Set<string>();
  for (const entry of entries) {
    for (const token of tokenise(entry.body)) {
      seen.add(token);
    }
  }
  return seen.size;
}

function formatChars(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}K chars`;
  return `${n} chars`;
}

// ── Shared style constants ────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ── Section: Overview stats ───────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
        minHeight: 120,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 36,
          color: COLORS.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function OverviewRow({
  totalPatterns,
  totalChars,
  avgLen,
  uniqueTokens,
}: {
  totalPatterns: number;
  totalChars: number;
  avgLen: number;
  uniqueTokens: number;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: SPACING.md,
      }}
    >
      <StatCard label="Total patterns" value={String(totalPatterns)} />
      <StatCard label="Total body chars" value={formatChars(totalChars)} />
      <StatCard label="Avg body length" value={`${Math.round(avgLen)} chars`} />
      <StatCard label="Unique keyword tokens" value={String(uniqueTokens)} sub="words ≥4 chars" />
    </div>
  );
}

// ── Section: Family breakdown ─────────────────────────────────────────────────

const FAMILY_LABELS: Record<FamilyKey, string> = {
  'source-event': 'Source Event',
  'program': 'Program',
  'sourcing': 'Sourcing Category',
  'cat': 'Legacy SRC (CAT)',
};

function FamilyBreakdownTable({
  entries,
  total,
}: {
  entries: PatternEntry[];
  total: number;
}) {
  const counts: Record<FamilyKey, number> = {
    'source-event': 0,
    program: 0,
    sourcing: 0,
    cat: 0,
  };
  for (const e of entries) {
    counts[e.family]++;
  }

  const rows: Array<{ key: FamilyKey; count: number; pct: string }> = (
    ['source-event', 'program', 'sourcing', 'cat'] as FamilyKey[]
  ).map((key) => ({
    key,
    count: counts[key],
    pct: total === 0 ? '0%' : `${((counts[key] / total) * 100).toFixed(1)}%`,
  }));

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Family breakdown
        </h2>
      </header>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={HEADER_CELL}>Family</th>
            <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Count</th>
            <th style={{ ...HEADER_CELL, textAlign: 'right' }}>% of total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td style={BODY_CELL}>{FAMILY_LABELS[row.key]}</td>
              <td style={{ ...MONO_CELL, textAlign: 'right' }}>{row.count}</td>
              <td style={{ ...MONO_CELL, textAlign: 'right' }}>{row.pct}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── Section: Body-length distribution chart ───────────────────────────────────

function DistributionChart({ buckets }: { buckets: DistributionBucket[] }) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  const SVG_WIDTH = 640;
  const SVG_HEIGHT = 220;
  const PADDING = { top: 16, right: 16, bottom: 56, left: 40 };
  const chartW = SVG_WIDTH - PADDING.left - PADDING.right;
  const chartH = SVG_HEIGHT - PADDING.top - PADDING.bottom;
  const barW = Math.floor(chartW / buckets.length) - 4;

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Body-length distribution
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          10 buckets of 500 chars each (0–5 000 chars)
        </div>
      </header>
      <div style={{ padding: `${SPACING.md} ${SPACING.lg}` }}>
        <svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ maxWidth: '100%', height: 'auto' }}
          aria-label="Body-length distribution bar chart"
          role="img"
        >
          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = PADDING.top + chartH - frac * chartH;
            const label = Math.round(frac * maxCount);
            return (
              <g key={frac}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + chartW}
                  y2={y}
                  stroke={`${COLORS.ink}14`}
                  strokeWidth={1}
                />
                <text
                  x={PADDING.left - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={9}
                  fontFamily="monospace"
                  fill={`${COLORS.ink}88`}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {buckets.map((bucket, i) => {
            const barH = maxCount === 0 ? 0 : (bucket.count / maxCount) * chartH;
            const x = PADDING.left + i * (chartW / buckets.length) + 2;
            const y = PADDING.top + chartH - barH;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  fill={SHELL.MINT_TEXT}
                  rx={2}
                />
                {/* Count label above bar */}
                {bucket.count > 0 && (
                  <text
                    x={x + barW / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize={9}
                    fontFamily="monospace"
                    fill={`${COLORS.ink}cc`}
                  >
                    {bucket.count}
                  </text>
                )}
                {/* X-axis label */}
                <text
                  x={x + barW / 2}
                  y={PADDING.top + chartH + 14}
                  textAnchor="middle"
                  fontSize={8}
                  fontFamily="monospace"
                  fill={`${COLORS.ink}88`}
                  transform={`rotate(-35, ${x + barW / 2}, ${PADDING.top + chartH + 14})`}
                >
                  {bucket.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

// ── Section: Top 20 keywords ──────────────────────────────────────────────────

function KeywordsTable({ keywords }: { keywords: KeywordRow[] }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Top 20 keywords
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          words ≥4 chars, common stop words excluded
        </span>
      </header>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...HEADER_CELL, width: 32, textAlign: 'right' }}>#</th>
            <th style={HEADER_CELL}>Keyword</th>
            <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Total occurrences</th>
            <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Patterns containing</th>
          </tr>
        </thead>
        <tbody>
          {keywords.map((row, i) => (
            <tr key={row.word}>
              <td style={{ ...MONO_CELL, textAlign: 'right', color: `${COLORS.ink}66` }}>
                {i + 1}
              </td>
              <td
                style={{
                  ...BODY_CELL,
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {row.word}
              </td>
              <td style={{ ...MONO_CELL, textAlign: 'right' }}>{row.totalCount}</td>
              <td style={{ ...MONO_CELL, textAlign: 'right' }}>{row.patternCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── Section: Shortest / longest patterns ─────────────────────────────────────

function PatternExtremeRow({ rank, entry }: { rank: number; entry: PatternEntry }) {
  const preview = entry.body.slice(0, 120).replace(/\s+/g, ' ').trim();
  return (
    <tr>
      <td style={{ ...MONO_CELL, textAlign: 'right', color: `${COLORS.ink}66` }}>{rank}</td>
      <td style={{ ...MONO_CELL, maxWidth: 160 }}>{entry.id}</td>
      <td style={{ ...MONO_CELL, textAlign: 'right' }}>{entry.body.length}</td>
      <td
        style={{
          ...BODY_CELL,
          fontSize: 11,
          color: `${COLORS.ink}99`,
          maxWidth: 400,
          overflow: 'hidden',
        }}
      >
        {preview}
        {entry.body.length > 120 ? '…' : ''}
      </td>
    </tr>
  );
}

function ExtremesSection({ entries }: { entries: PatternEntry[] }) {
  const sorted = [...entries].sort((a, b) => a.body.length - b.body.length);
  const shortest = sorted.slice(0, 3);
  const longest = sorted.slice(-3).reverse();

  const sharedTableHeader = (
    <thead>
      <tr>
        <th style={{ ...HEADER_CELL, width: 32, textAlign: 'right' }}>#</th>
        <th style={HEADER_CELL}>Pattern ID</th>
        <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Chars</th>
        <th style={HEADER_CELL}>Body preview</th>
      </tr>
    </thead>
  );

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Shortest and longest patterns
        </h2>
      </header>

      {/* Shortest 3 */}
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg} ${SPACING.xs}`,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 600,
          color: `${COLORS.ink}99`,
        }}
      >
        Shortest 3
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {sharedTableHeader}
        <tbody>
          {shortest.map((e, i) => (
            <PatternExtremeRow key={e.id} rank={i + 1} entry={e} />
          ))}
        </tbody>
      </table>

      {/* Longest 3 */}
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg} ${SPACING.xs}`,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 600,
          color: `${COLORS.ink}99`,
          borderTop: `1px solid ${COLORS.ink}10`,
        }}
      >
        Longest 3
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {sharedTableHeader}
        <tbody>
          {longest.map((e, i) => (
            <PatternExtremeRow key={e.id} rank={i + 1} entry={e} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CorpusStatsPage() {
  const corpus = assembleCorpus();
  const total = corpus.length;
  const totalChars = corpus.reduce((acc, e) => acc + e.body.length, 0);
  const avgLen = total === 0 ? 0 : totalChars / total;
  const uniqueTokens = countUniqueTokens(corpus);
  const keywords = computeKeywords(corpus);
  const buckets = buildDistribution(corpus);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to Reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Corpus"
        title="Pattern corpus statistics"
        subtitle={`Full analysis of the ${total}-pattern reasoning corpus — body lengths, keyword distribution, and family composition.`}
      >
        <OverviewRow
          totalPatterns={total}
          totalChars={totalChars}
          avgLen={avgLen}
          uniqueTokens={uniqueTokens}
        />
        <FamilyBreakdownTable entries={corpus} total={total} />
        <DistributionChart buckets={buckets} />
        <KeywordsTable keywords={keywords} />
        <ExtremesSection entries={corpus} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

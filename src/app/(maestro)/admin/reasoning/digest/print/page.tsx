// /admin/reasoning/digest/print — Print-friendly weekly digest.
//
// Standalone server component. Deliberately does NOT wrap content in
// `AdminCanonShellV2` or `EditorialCanvas` so the print output is just
// the digest body — title bar, date range, per-instance breakdown,
// top patterns, and a "Generated …" footer signature line.
//
// A small client wrapper (`PrintAutoTrigger`) calls `window.print()`
// once after mount so opening the page in a new tab raises the print
// dialog automatically. AbarVa palette only.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import {
  buildWeeklyDigest,
  type WeeklyDigest,
  type WeeklyDigestPerInstance,
} from '@/lib/reasoning/weekly-digest';
import { PrintAutoTrigger } from '@/components/reasoning/PrintAutoTrigger';

export const metadata = {
  title: 'Reasoning weekly digest · Print · AbarVa Admin',
};

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatWindowDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

const PRINT_PAGE_STYLE = `
  @page { size: letter; margin: 0.5in; }
  @media print {
    html, body { background: #FFFFFF !important; }
    .abarva-print-noprint { display: none !important; }
  }
`;

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 12,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}`,
  letterSpacing: '0.01em',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: COLORS.ink,
};

function TitleBar({ digest }: { digest: WeeklyDigest }) {
  return (
    <header
      style={{
        borderBottom: `2px solid ${COLORS.ink}`,
        paddingBottom: SPACING.md,
        marginBottom: SPACING.lg,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
          }}
        >
          AbarVa · Reasoning Layer
        </div>
        <h1
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 26,
            color: COLORS.ink,
            margin: 0,
            marginTop: 4,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
            fontWeight: 600,
          }}
        >
          Weekly Digest
        </h1>
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: COLORS.ink,
          textAlign: 'right',
        }}
      >
        <div>{formatWindowDate(digest.windowStart)}</div>
        <div style={{ opacity: 0.6 }}>↓</div>
        <div>{formatWindowDate(digest.windowEnd)}</div>
      </div>
    </header>
  );
}

function SummaryStats({ digest }: { digest: WeeklyDigest }) {
  const feedbackTotal = digest.feedbackUpCount + digest.feedbackDownCount;
  const stats: ReadonlyArray<{ label: string; value: string; sub: string }> = [
    {
      label: 'Synthesis events',
      value: String(digest.synthesisEventCount),
      sub: 'across all surfaces',
    },
    {
      label: 'Cache hit rate',
      value:
        digest.synthesisEventCount === 0 ? '—' : formatPct(digest.cacheHitRate),
      sub: `${digest.synthesisEventCount} synthesis calls`,
    },
    {
      label: 'Feedback (up / down)',
      value:
        feedbackTotal === 0
          ? '—'
          : `${digest.feedbackUpCount} / ${digest.feedbackDownCount}`,
      sub: 'thumbs up · thumbs down',
    },
  ];
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            border: `1px solid ${COLORS.ink}33`,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: COLORS.ink,
              fontWeight: 600,
              opacity: 0.7,
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 26,
              color: COLORS.ink,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              fontWeight: 600,
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: COLORS.ink,
              opacity: 0.7,
            }}
          >
            {s.sub}
          </div>
        </div>
      ))}
    </section>
  );
}

function PerInstanceTable({ rows }: { rows: WeeklyDigestPerInstance[] }) {
  return (
    <section style={{ marginBottom: SPACING.lg }}>
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 18,
          color: COLORS.ink,
          margin: 0,
          marginBottom: SPACING.sm,
          letterSpacing: '-0.01em',
          fontWeight: 600,
        }}
      >
        Per-instance breakdown
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={HEADER_CELL}>Instance</th>
            <th style={HEADER_CELL}>Synthesis</th>
            <th style={HEADER_CELL}>Missions pending</th>
            <th style={HEADER_CELL}>Contradictions</th>
            <th style={HEADER_CELL}>Failure modes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.instanceId}>
              <td style={{ ...BODY_CELL, fontWeight: 600 }}>
                <div>{row.instanceLabel}</div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: COLORS.ink,
                    opacity: 0.7,
                    fontWeight: 400,
                    marginTop: 2,
                  }}
                >
                  {row.instanceId}
                </div>
              </td>
              <td style={MONO_CELL}>{row.synthesisCount}</td>
              <td style={MONO_CELL}>{row.missionsPending}</td>
              <td style={MONO_CELL}>{row.contradictionCount}</td>
              <td style={MONO_CELL}>{row.failureModeCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TopPatterns({ digest }: { digest: WeeklyDigest }) {
  return (
    <section style={{ marginBottom: SPACING.lg }}>
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 18,
          color: COLORS.ink,
          margin: 0,
          marginBottom: SPACING.sm,
          letterSpacing: '-0.01em',
          fontWeight: 600,
        }}
      >
        Top patterns
      </h2>
      {digest.topPatterns.length === 0 ? (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: COLORS.ink,
            opacity: 0.6,
          }}
        >
          No pattern activity in window.
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexWrap: 'wrap',
            gap: SPACING.sm,
          }}
        >
          {digest.topPatterns.map((p) => (
            <li
              key={p.patternId}
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: COLORS.ink,
                border: `1px solid ${COLORS.ink}44`,
                borderRadius: RADIUS.pill,
                padding: '3px 10px',
              }}
            >
              {p.patternId} · {p.count}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Footer({ digest }: { digest: WeeklyDigest }) {
  const generated = formatWindowDate(digest.windowEnd);
  return (
    <footer
      style={{
        borderTop: `1px solid ${COLORS.ink}`,
        paddingTop: SPACING.sm,
        marginTop: SPACING.lg,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: SPACING.md,
        flexWrap: 'wrap',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        color: COLORS.ink,
        opacity: 0.7,
      }}
    >
      <div>
        Generated {generated} · for internal use
      </div>
      <div style={{ fontFamily: TYPOGRAPHY.mono }}>
        AbarVa · Reasoning Layer Weekly Digest
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontStyle: 'italic',
        }}
      >
        Signature: ____________________
      </div>
    </footer>
  );
}

export default async function ReasoningWeeklyDigestPrintPage() {
  const digest = buildWeeklyDigest();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_PAGE_STYLE }} />
      <PrintAutoTrigger />
      <main
        style={{
          background: COLORS.white,
          color: COLORS.ink,
          maxWidth: '7.5in',
          margin: '0 auto',
          padding: `${SPACING.xl} ${SPACING.lg}`,
          fontFamily: TYPOGRAPHY.sans,
        }}
      >
        <div
          className="abarva-print-noprint"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.md,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: COLORS.ink,
            opacity: 0.7,
          }}
        >
          <a
            href="/admin/reasoning/digest"
            style={{ color: COLORS.navy, textDecoration: 'none', fontWeight: 600 }}
          >
            ← Back to digest
          </a>
          <span>Print dialog opens automatically · use ⌘P / Ctrl+P to retry</span>
        </div>
        <TitleBar digest={digest} />
        <SummaryStats digest={digest} />
        <PerInstanceTable rows={digest.perInstance} />
        <TopPatterns digest={digest} />
        <Footer digest={digest} />
      </main>
    </>
  );
}

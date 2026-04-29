// /admin/reasoning/digest — Weekly reasoning digest.
//
// Server component. Reads the in-process telemetry buffer + canonical
// instance / pattern catalogues, builds a 7-day digest, and renders it
// as a clean executive sweep page. AbarVa palette only. No client JS.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import {
  buildWeeklyDigest,
  type WeeklyDigest,
  type WeeklyDigestPerInstance,
} from '@/lib/reasoning/weekly-digest';
import { DigestRegenerateButton } from '@/components/admin/reasoning/DigestRegenerateButton';

export const metadata = {
  title: 'Reasoning weekly digest · AbarVa Admin',
};

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatWindowDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // YYYY-MM-DD HH:MM UTC — readable without dragging in date-fns.
  return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

function HeaderCard({ digest }: { digest: WeeklyDigest }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: SPACING.md,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          Reasoning · Weekly digest
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            color: COLORS.ink,
            marginTop: 4,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          Last 7 days
        </div>
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          color: `${COLORS.ink}99`,
          textAlign: 'right',
        }}
      >
        <div>{formatWindowDate(digest.windowStart)}</div>
        <div>↓</div>
        <div>{formatWindowDate(digest.windowEnd)}</div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
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

function StatGrid({ digest }: { digest: WeeklyDigest }) {
  const feedbackTotal = digest.feedbackUpCount + digest.feedbackDownCount;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: SPACING.md,
      }}
    >
      <StatTile
        label="Synthesis events"
        value={String(digest.synthesisEventCount)}
        sub="across all surfaces"
      />
      <StatTile
        label="Cache hit rate"
        value={
          digest.synthesisEventCount === 0 ? '—' : formatPct(digest.cacheHitRate)
        }
        sub={`${digest.synthesisEventCount} synthesis calls`}
      />
      <StatTile
        label="Feedback"
        value={feedbackTotal === 0 ? '—' : `${digest.feedbackUpCount} / ${digest.feedbackDownCount}`}
        sub="thumbs up · thumbs down"
      />
    </div>
  );
}

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

function PerInstanceTable({
  rows,
}: {
  rows: WeeklyDigestPerInstance[];
}) {
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
          Per-instance breakdown
        </h2>
        <span
          style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}
        >
          {rows.length} instance{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
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
                      fontSize: 11,
                      color: `${COLORS.ink}88`,
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
      </div>
    </section>
  );
}

function TopPatterns({ digest }: { digest: WeeklyDigest }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: SPACING.md,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        Top patterns
      </span>
      {digest.topPatterns.length === 0 ? (
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}66`,
          }}
        >
          No pattern activity in window.
        </span>
      ) : (
        digest.topPatterns.map((p) => (
          <span
            key={p.patternId}
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 12,
              color: COLORS.ink,
              background: COLORS.skyPale,
              borderRadius: RADIUS.pill,
              padding: '4px 10px',
            }}
          >
            {p.patternId} · {p.count}
          </span>
        ))
      )}
    </section>
  );
}

function BackLink() {
  return (
    <a
      href="/admin/reasoning"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACING.xs,
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}22`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.sm} ${SPACING.md}`,
        textDecoration: 'none',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: COLORS.ink,
        alignSelf: 'flex-start',
      }}
    >
      <span aria-hidden="true">←</span>
      <span style={{ fontWeight: 600 }}>Back to telemetry dashboard</span>
    </a>
  );
}

function ActionRow() {
  // Three actions above the digest body: navigate back (left), and on
  // the right: the on-demand regenerate button + open print view.
  // The print page auto-triggers `window.print()` on mount — see
  // `src/components/reasoning/PrintAutoTrigger.tsx`.
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <BackLink />
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <DigestRegenerateButton />
        <a
          href="/admin/reasoning/digest/print"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.xs,
            background: COLORS.navy,
            border: `1px solid ${COLORS.navy}`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.sm} ${SPACING.md}`,
            textDecoration: 'none',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.white,
            fontWeight: 600,
          }}
        >
          <span aria-hidden="true">⎙</span>
          <span>Open print view</span>
        </a>
      </div>
    </div>
  );
}

export default async function ReasoningWeeklyDigestPage() {
  const digest = buildWeeklyDigest();
  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Source detail"
          primaryActionHref="/source"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Weekly digest"
        title="Executive sweep"
        subtitle="Rolling 7-day snapshot of the reasoning layer — synthesis volume, cache health, user feedback, derived missions, and active contradictions / failure modes per instance."
      >
        <ActionRow />
        <HeaderCard digest={digest} />
        <StatGrid digest={digest} />
        <TopPatterns digest={digest} />
        <PerInstanceTable rows={digest.perInstance} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

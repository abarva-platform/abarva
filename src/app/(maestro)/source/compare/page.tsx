// src/app/(maestro)/source/compare/page.tsx
//
// Source event side-by-side comparison page.
// Route: /source/compare?a=<eventId>&b=<eventId>
//
// Server component — deterministic, tenant-scoped event resolution.
// URL params drive which two source events to compare. When either param is
// missing or unresolvable, a picker UI is rendered so the user can choose.
//
// Metrics compared (mirroring /programs/compare pattern):
//   - Current stage (neutral)
//   - Health score (tinted)
//   - Gate pass rate (tinted)
//   - Contradiction count (tinted — fewer = better)
//   - Evidence count (tinted — more = better)
//   - Cascade impacts (tinted — fewer = better)
//   - Synthesis excerpt (neutral, first 150 chars)
//
// Design: AbarVa palette (SHELL tokens), Georgia/DM Sans typography.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { SourceSubNav } from '@/components/source/SourceSubNav';
import { getSourcingEvent, listSourcingEvents } from '@/lib/source/queries';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourcingEventDetail, SourcingEventSummary } from '@/lib/source/types';

export const metadata = {
  title: 'Compare Source Events · AbarVa',
};

export const dynamic = 'force-dynamic';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CompareSide {
  event: SourcingEventDetail | SourcingEventSummary;
  healthScore: number;
  healthGrade: 'green' | 'amber' | 'red';
  /** X/Y met out of total gate criteria */
  gateMet: number;
  gateTotal: number;
  contradictionCount: number;
  evidenceCount: number;
  cascadeCount: number;
  synthesisExcerpt: string;
  displayName: string;
  displayId: string;
  currentStage: string;
  hrefId: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function resolveEventSummary(
  events: SourcingEventSummary[],
  id: string,
): SourcingEventSummary | null {
  if (!id) return null;
  const lower = id.toLowerCase();
  return (
    events.find(
      (event) =>
        event.id.toLowerCase() === lower ||
        event.code.toLowerCase() === lower,
    ) ?? null
  );
}

async function resolveComparableEvent(
  events: SourcingEventSummary[],
  id: string | undefined,
): Promise<SourcingEventDetail | SourcingEventSummary | null> {
  if (!id) return null;
  const summary = resolveEventSummary(events, id);
  if (!summary) return null;
  return (await getSourcingEvent(summary.id).catch(() => null)) ?? summary;
}

function buildSide(event: SourcingEventDetail | SourcingEventSummary): CompareSide {
  const stages = 'stages' in event ? event.stages : [];
  const gateTotal = stages.length;
  const gateMet = stages.filter((stage) => stage.gate.status === 'approved').length;
  const evidenceCount =
    'artifacts' in event
      ? event.artifacts.reduce((sum, artifact) => sum + artifact.sourceCount, 0)
      : 0;
  const contradictionCount = event.openAlerts;
  const cascadeCount = 'alerts' in event ? event.alerts.length : event.openAlerts;
  const healthScore = event.isAtRisk
    ? 42
    : event.openAlerts > 0
      ? 68
      : event.status === 'active'
        ? 84
        : 74;
  const healthGrade =
    healthScore >= 80 ? 'green' : healthScore >= 60 ? 'amber' : 'red';

  const raw =
    'stages' in event
      ? (event.stages.find((stage) => stage.key === event.currentStageKey)?.summary ??
        event.nextAction)
      : event.nextAction;
  const synthesisExcerpt = raw.length > 150 ? raw.slice(0, 150).trimEnd() + '…' : raw || '—';

  return {
    event,
    healthScore,
    healthGrade,
    gateMet,
    gateTotal,
    contradictionCount,
    evidenceCount,
    cascadeCount,
    synthesisExcerpt,
    displayName: event.name,
    displayId: event.code,
    currentStage: event.currentStageLabel,
    hrefId: event.id,
  };
}

// ── Tint logic ─────────────────────────────────────────────────────────────────

type Tint = 'better' | 'worse' | 'neutral';

/**
 * Given two numeric values, decide which is "better" for a metric.
 * `higherIsBetter` = true: higher value is mint. false: lower is mint.
 */
function tintPair(
  aVal: number,
  bVal: number,
  higherIsBetter: boolean,
): [Tint, Tint] {
  if (aVal === bVal) return ['neutral', 'neutral'];
  if (higherIsBetter) {
    return aVal > bVal ? ['better', 'worse'] : ['worse', 'better'];
  } else {
    return aVal < bVal ? ['better', 'worse'] : ['worse', 'better'];
  }
}

function cellBg(tint: Tint): string {
  if (tint === 'better') return SHELL.MINT_BG;
  if (tint === 'worse') return SHELL.RUST_BG;
  return 'transparent';
}

// ── Page ───────────────────────────────────────────────────────────────────────

interface SearchParams {
  a?: string | string[];
  b?: string | string[];
}

export default async function SourceCompareEventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const aId = firstParam(params.a);
  const bId = firstParam(params.b);
  const events = await listSourcingEvents();

  const aEvent = await resolveComparableEvent(events, aId);
  const bEvent = await resolveComparableEvent(events, bId);

  const showPicker = aEvent === null || bEvent === null;

  const aErr = aId !== undefined && aEvent === null;
  const bErr = bId !== undefined && bEvent === null;

  return (
    <AppShell
      surface="source"
      topBarProps={{ showLocked: true, context: 'Source · Compare events' }}
      subNav={<SourceSubNav />}
    >
      <main
        style={{
          background: SHELL.PAPER,
          flex: 1,
          overflowY: 'auto',
          padding: '32px clamp(20px, 4vw, 48px)',
          fontFamily: SHELL.SANS,
          color: SHELL.INK,
        }}
      >
      {/* ── Page header ── */}
      <header style={{ marginBottom: 28, maxWidth: 1280 }}>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Link
            href="/source/preview/workspace"
            style={{ color: SHELL.INK_MUTED, textDecoration: 'none' }}
          >
            Source portfolio
          </Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <span>Compare</span>
        </div>
        <h1
          style={{
            fontFamily: SHELL.SERIF_DISPLAY,
            fontSize: 28,
            margin: 0,
            letterSpacing: '-0.015em',
            color: SHELL.INK,
          }}
        >
          Source event comparison
        </h1>
        <p
          style={{
            margin: '10px 0 0',
            color: SHELL.INK_SOFT,
            fontSize: 14,
            maxWidth: 680,
            lineHeight: 1.55,
          }}
        >
          Select two source events to view their health scores, gate progress,
          evidence counts, contradiction counts, and synthesis guidance side by side.
        </p>
      </header>

      {showPicker ? (
        <ComparePicker
          aId={aId}
          bId={bId}
          aErr={aErr}
          bErr={bErr}
          events={events}
        />
      ) : (
        <ComparisonView
          left={buildSide(aEvent)}
          right={buildSide(bEvent)}
        />
      )}
      </main>
    </AppShell>
  );
}

// ── Picker ─────────────────────────────────────────────────────────────────────

function ComparePicker({
  aId,
  bId,
  aErr,
  bErr,
  events,
}: {
  aId: string | undefined;
  bId: string | undefined;
  aErr: boolean;
  bErr: boolean;
  events: SourcingEventSummary[];
}) {
  return (
    <form
      method="GET"
      action="/source/compare"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '28px 32px',
        maxWidth: 640,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: SHELL.SERIF_DISPLAY,
            fontSize: 20,
            margin: '0 0 6px',
            color: SHELL.INK,
            letterSpacing: '-0.01em',
          }}
        >
          Choose two source events
        </h2>
        <p
          style={{
            margin: 0,
            color: SHELL.INK_SOFT,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Select a sourcing event for each side. Health scores, gate pass rates,
          contradictions, and synthesis excerpts will appear side by side.
        </p>
      </div>

      <EventPickerSelect
        name="a"
        label="Event A"
        defaultValue={aId ?? ''}
        events={events}
        invalid={aErr}
        invalidValue={aId}
      />

      <EventPickerSelect
        name="b"
        label="Event B"
        defaultValue={bId ?? ''}
        events={events}
        invalid={bErr}
        invalidValue={bId}
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 4 }}>
        <button
          type="submit"
          style={{
            background: SHELL.INK,
            color: SHELL.PAPER,
            border: 'none',
            padding: '10px 22px',
            borderRadius: 6,
            fontFamily: SHELL.SANS,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
        >
          Compare →
        </button>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.08em',
          }}
        >
          {events.length} events available for this client
        </span>
      </div>
    </form>
  );
}

function EventPickerSelect({
  name,
  label,
  defaultValue,
  events,
  invalid,
  invalidValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
  events: SourcingEventSummary[];
  invalid: boolean;
  invalidValue: string | undefined;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        style={{
          padding: '10px 12px',
          background: SHELL.PAPER,
          border: `1px solid ${invalid ? SHELL.RUST_TEXT : SHELL.CARD_LINE}`,
          borderRadius: 6,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
          appearance: 'auto',
        }}
      >
        <option value="">— select a source event —</option>
        {events.map((e) => (
          <option key={e.id} value={e.id}>
            {e.code} · {e.name} · {e.currentStageLabel}
          </option>
        ))}
      </select>
      {invalid && invalidValue !== undefined && (
        <span style={{ fontSize: 12, color: SHELL.RUST_TEXT }}>
          Unknown event id:{' '}
          <code
            style={{
              fontFamily: SHELL.MONO,
              background: SHELL.RUST_BG,
              padding: '1px 4px',
              borderRadius: 3,
            }}
          >
            {invalidValue}
          </code>
        </span>
      )}
    </label>
  );
}

// ── Comparison view ────────────────────────────────────────────────────────────

function ComparisonView({
  left,
  right,
}: {
  left: CompareSide;
  right: CompareSide;
}) {
  const [healthTintA, healthTintB] = tintPair(left.healthScore, right.healthScore, true);
  const [gateRatioA, gateRatioB] = [
    left.gateTotal > 0 ? left.gateMet / left.gateTotal : 0,
    right.gateTotal > 0 ? right.gateMet / right.gateTotal : 0,
  ];
  const [gateTintA, gateTintB] = tintPair(gateRatioA, gateRatioB, true);
  const [contradTintA, contradTintB] = tintPair(
    left.contradictionCount,
    right.contradictionCount,
    false, // fewer contradictions = better
  );
  const [evidTintA, evidTintB] = tintPair(left.evidenceCount, right.evidenceCount, true);
  const [cascadeTintA, cascadeTintB] = tintPair(
    left.cascadeCount,
    right.cascadeCount,
    false, // fewer cascades = better
  );

  const headerCellStyle: React.CSSProperties = {
    padding: '0 16px 14px',
    textAlign: 'left',
    verticalAlign: 'bottom',
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Change selection link */}
      <div style={{ marginBottom: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
        <Link
          href="/source/compare"
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_SOFT,
            letterSpacing: '0.08em',
            textDecoration: 'underline',
            textUnderlineOffset: 2,
          }}
        >
          ← Change selection
        </Link>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.06em',
          }}
        >
          {left.displayId} vs {right.displayId}
        </span>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          marginBottom: 18,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          Key:
        </span>
        <LegendChip bg={SHELL.MINT_BG} color={SHELL.MINT_TEXT} label="Better" />
        <LegendChip bg={SHELL.RUST_BG} color={SHELL.RUST_TEXT} label="Worse" />
      </div>

      {/* Comparison table */}
      <div
        style={{
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
          }}
        >
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '39%' }} />
            <col style={{ width: '39%' }} />
          </colgroup>

          {/* Column headers — event name + displayId */}
          <thead>
            <tr
              style={{
                borderBottom: `2px solid ${SHELL.CARD_LINE}`,
                background: SHELL.PAPER,
              }}
            >
              <th style={{ ...headerCellStyle, paddingTop: 18 }} />
              <EventHeader side={left} href={`/source/events/${left.hrefId}`} />
              <EventHeader side={right} href={`/source/events/${right.hrefId}`} />
            </tr>
          </thead>

          <tbody>
            {/* Row: Current stage */}
            <ComparisonRow
              label="Current stage"
              aContent={<StageCell stage={left.currentStage} />}
              bContent={<StageCell stage={right.currentStage} />}
              aTint="neutral"
              bTint="neutral"
            />

            {/* Row: Health score */}
            <ComparisonRow
              label="Health score"
              aContent={<HealthCell score={left.healthScore} grade={left.healthGrade} />}
              bContent={<HealthCell score={right.healthScore} grade={right.healthGrade} />}
              aTint={healthTintA}
              bTint={healthTintB}
            />

            {/* Row: Gate pass rate */}
            <ComparisonRow
              label="Gate pass rate"
              aContent={<GateRateCell met={left.gateMet} total={left.gateTotal} />}
              bContent={<GateRateCell met={right.gateMet} total={right.gateTotal} />}
              aTint={gateTintA}
              bTint={gateTintB}
            />

            {/* Row: Contradictions */}
            <ComparisonRow
              label="Contradictions"
              aContent={<CountCell count={left.contradictionCount} warnIfPositive />}
              bContent={<CountCell count={right.contradictionCount} warnIfPositive />}
              aTint={contradTintA}
              bTint={contradTintB}
            />

            {/* Row: Evidence count */}
            <ComparisonRow
              label="Evidence items"
              aContent={<CountCell count={left.evidenceCount} />}
              bContent={<CountCell count={right.evidenceCount} />}
              aTint={evidTintA}
              bTint={evidTintB}
            />

            {/* Row: Cascade impacts */}
            <ComparisonRow
              label="Cascade impacts"
              aContent={<CountCell count={left.cascadeCount} warnIfPositive />}
              bContent={<CountCell count={right.cascadeCount} warnIfPositive />}
              aTint={cascadeTintA}
              bTint={cascadeTintB}
            />

            {/* Row: Synthesis excerpt */}
            <ComparisonRow
              label="Stage guidance"
              aContent={<ExcerptCell text={left.synthesisExcerpt} />}
              bContent={<ExcerptCell text={right.synthesisExcerpt} />}
              aTint="neutral"
              bTint="neutral"
              isLast
            />
          </tbody>
        </table>
      </div>

      {/* Footer links to individual events */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          marginTop: 20,
          paddingTop: 16,
          borderTop: `1px solid ${SHELL.CARD_LINE}`,
        }}
      >
        <EventFooterLink
          displayId={left.displayId}
          name={left.displayName}
          href={`/source/events/${left.hrefId}`}
        />
        <EventFooterLink
          displayId={right.displayId}
          name={right.displayName}
          href={`/source/events/${right.hrefId}`}
        />
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LegendChip({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: SHELL.MONO,
        fontSize: 9,
        color,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: 2,
          background: bg,
          border: `1px solid ${color}`,
          opacity: 0.85,
        }}
      />
      {label}
    </span>
  );
}

function EventHeader({ side, href }: { side: CompareSide; href: string }) {
  return (
    <th
      style={{
        padding: '18px 16px 14px',
        textAlign: 'left',
        verticalAlign: 'bottom',
        borderLeft: `1px solid ${SHELL.CARD_LINE}`,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: 4,
        }}
      >
        {side.displayId}
      </div>
      <Link
        href={href}
        style={{
          fontFamily: SHELL.SERIF_DISPLAY,
          fontSize: 17,
          fontWeight: 400,
          color: SHELL.INK,
          textDecoration: 'none',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          display: 'block',
        }}
      >
        {side.displayName}
      </Link>
    </th>
  );
}

function ComparisonRow({
  label,
  aContent,
  bContent,
  aTint,
  bTint,
  isLast = false,
}: {
  label: string;
  aContent: React.ReactNode;
  bContent: React.ReactNode;
  aTint: Tint;
  bTint: Tint;
  isLast?: boolean;
}) {
  const borderStyle = isLast ? 'none' : `1px solid ${SHELL.CARD_LINE}`;

  return (
    <tr>
      <td
        style={{
          padding: '11px 16px',
          fontFamily: SHELL.MONO,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: SHELL.INK_MUTED,
          background: SHELL.PAPER,
          whiteSpace: 'nowrap',
          borderBottom: borderStyle,
          verticalAlign: 'middle',
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: '11px 16px',
          borderLeft: `1px solid ${SHELL.CARD_LINE}`,
          borderBottom: borderStyle,
          background: cellBg(aTint),
          verticalAlign: 'middle',
          transition: 'background 0.15s',
        }}
      >
        {aContent}
      </td>
      <td
        style={{
          padding: '11px 16px',
          borderLeft: `1px solid ${SHELL.CARD_LINE}`,
          borderBottom: borderStyle,
          background: cellBg(bTint),
          verticalAlign: 'middle',
          transition: 'background 0.15s',
        }}
      >
        {bContent}
      </td>
    </tr>
  );
}

// Row-level inline components

function StageCell({ stage }: { stage: string }) {
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 13,
        color: SHELL.INK,
        letterSpacing: '0.02em',
      }}
    >
      {stage}
    </span>
  );
}

function HealthCell({
  score,
  grade,
}: {
  score: number;
  grade: 'green' | 'amber' | 'red';
}) {
  const colors: Record<string, { bg: string; text: string }> = {
    green: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT },
    amber: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT },
    red: { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT },
  };
  const { bg, text } = colors[grade] ?? colors.amber;
  const gradeLabel = grade === 'green' ? 'On track' : grade === 'amber' ? 'At risk' : 'In trouble';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 15,
          fontWeight: 600,
          color: SHELL.INK,
          letterSpacing: '-0.01em',
        }}
      >
        {score}
      </span>
      <span
        style={{
          background: bg,
          color: text,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          padding: '2px 7px',
          borderRadius: 10,
          fontWeight: 600,
        }}
      >
        {gradeLabel}
      </span>
    </span>
  );
}

function GateRateCell({ met, total }: { met: number; total: number }) {
  if (total === 0) {
    return (
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 12,
          color: SHELL.INK_MUTED,
        }}
      >
        —
      </span>
    );
  }

  const pct = Math.round((met / total) * 100);
  const isGood = pct >= 70;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 13,
          fontWeight: 600,
          color: SHELL.INK,
        }}
      >
        {met}/{total}
      </span>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: isGood ? SHELL.MINT_TEXT : SHELL.PEACH_TEXT,
          letterSpacing: '0.06em',
        }}
      >
        {pct}% met
      </span>
    </span>
  );
}

function CountCell({
  count,
  warnIfPositive = false,
}: {
  count: number;
  warnIfPositive?: boolean;
}) {
  const isWarning = warnIfPositive && count > 0;

  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 13,
        fontWeight: count > 0 ? 600 : 400,
        color: isWarning ? SHELL.PEACH_TEXT : SHELL.INK,
      }}
    >
      {count}
    </span>
  );
}

function ExcerptCell({ text }: { text: string }) {
  return (
    <span
      style={{
        fontFamily: SHELL.SANS,
        fontSize: 12,
        color: SHELL.INK_SOFT,
        lineHeight: 1.55,
        display: 'block',
      }}
    >
      {text}
    </span>
  );
}

function EventFooterLink({
  displayId,
  name,
  href,
}: {
  displayId: string;
  name: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        textDecoration: 'none',
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
        }}
      >
        {displayId}
      </span>
      <span
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK_SOFT,
          textDecoration: 'underline',
          textUnderlineOffset: 2,
        }}
      >
        View event →
      </span>
      <span
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_MUTED,
        }}
      >
        {name}
      </span>
    </Link>
  );
}

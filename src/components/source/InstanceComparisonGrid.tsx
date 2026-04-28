// src/components/source/InstanceComparisonGrid.tsx
//
// Renders two SynthesisContext objects side-by-side as a comparison grid.
// Used by /source/compare to benchmark two instances (source events or
// programs) on their Layer 3 reasoning outputs: gates, contradictions,
// failure modes, cascade impacts, citations.
//
// Server-renderable: pure presentation, no client state. Highlights the
// "more issues" column on each metric using SHELL.PEACH_BG so readers
// can scan asymmetries at a glance. AbarVa palette only.

import { SHELL } from '@/lib/shell/shell-tokens';
import type { SynthesisContext } from '@/lib/reasoning/types';
import { findLifecyclePattern } from '@/lib/reasoning/lifecycle-pattern-lookup';

export interface InstanceComparisonSide {
  /** Stable id of the instance (e.g. "APX-CDP-2026"). */
  instanceId: string;
  /** Whether the instance is a source event or a program. */
  kind: 'source' | 'program';
  /** Human-readable stage/phase label (e.g. "BAFO", "P3 Design"). */
  stageLabel: string;
  /** The Layer 3 synthesis context built for the instance. */
  context: SynthesisContext;
}

export interface InstanceComparisonGridProps {
  left: InstanceComparisonSide;
  right: InstanceComparisonSide;
}

// ── First-sentence quote excerpt ────────────────────────────────────────────
function firstSentence(text: string | undefined | null): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  // Match up to the first sentence-ending punctuation; otherwise return the
  // whole string (capped at 240 chars to keep the grid balanced).
  const match = trimmed.match(/^[^.!?]*[.!?]/);
  const sentence = match ? match[0] : trimmed;
  return sentence.length > 240 ? `${sentence.slice(0, 237)}…` : sentence;
}

function synthesisExcerpt(context: SynthesisContext): string {
  const candidate = firstSentence(context.stageGuidance);
  if (candidate) return candidate;
  const firstCitation = context.citations[0]?.excerpt;
  const cited = firstSentence(firstCitation);
  if (cited) return cited;
  return 'Synthesis available — open detail page';
}

// ── Pattern title (for column header sub-line) ──────────────────────────────
function patternTitleFor(context: SynthesisContext): string {
  const pattern = findLifecyclePattern(context.patternId);
  return pattern?.title ?? context.patternId;
}

// ── Severity scoring for cascade impacts ────────────────────────────────────
const SEVERITY_RANK: Record<string, number> = {
  blocking: 3,
  high: 3,
  medium: 2,
  accelerating: 2,
  informational: 1,
  low: 1,
};

function topCascadeSeverity(context: SynthesisContext): {
  count: number;
  topLabel: string;
} {
  const impacts = context.cascadeContext;
  if (impacts.length === 0) return { count: 0, topLabel: '—' };
  let topRank = -1;
  let topLabel: string = impacts[0].severity;
  for (const impact of impacts) {
    const directional = impact.severity;
    const tier = impact.impactSeverity;
    const rank = Math.max(
      SEVERITY_RANK[directional] ?? 0,
      SEVERITY_RANK[tier ?? ''] ?? 0,
    );
    if (rank > topRank) {
      topRank = rank;
      topLabel = tier ?? directional;
    }
  }
  return { count: impacts.length, topLabel };
}

// ── Metrics ─────────────────────────────────────────────────────────────────
interface ComparisonMetrics {
  passed: number;
  pending: number;
  blocked: number;
  contradictionCount: number;
  contradictionTopLabel: string;
  failureModeCount: number;
  failureModeTopLabel: string;
  cascadeCount: number;
  cascadeTopSeverity: string;
  activeBlockerCount: number;
  excerpt: string;
  citations: string[];
}

function deriveMetrics(context: SynthesisContext): ComparisonMetrics {
  const { gatesSummary } = context;
  const passed = gatesSummary.met;
  const blocked = gatesSummary.blocked.length;
  const pending = Math.max(0, gatesSummary.unmet - blocked);

  const contradictions = context.activeContradictions;
  const failureModes = context.failureModes;
  const cascade = topCascadeSeverity(context);

  // "Active blockers" = unmet hard gates + open contradictions, mirroring
  // the way the detail pages count visible blocker chips.
  const activeBlockerCount = blocked + contradictions.length;

  return {
    passed,
    pending,
    blocked,
    contradictionCount: contradictions.length,
    contradictionTopLabel: contradictions[0]?.label ?? '—',
    failureModeCount: failureModes.length,
    failureModeTopLabel: failureModes[0]?.label ?? '—',
    cascadeCount: cascade.count,
    cascadeTopSeverity: cascade.topLabel,
    activeBlockerCount,
    excerpt: synthesisExcerpt(context),
    citations: context.citations
      .map((c) => c.ref.section)
      .filter((s): s is string => Boolean(s)),
  };
}

// ── Cell highlight logic ────────────────────────────────────────────────────
// `higher` indicates which side has the larger numeric value for an "issues"
// metric. The higher side is tinted with PEACH_BG to draw the eye to it.
type Higher = 'left' | 'right' | 'tie';

function compareHigher(a: number, b: number): Higher {
  if (a > b) return 'left';
  if (b > a) return 'right';
  return 'tie';
}

function highlightStyle(
  side: 'left' | 'right',
  higher: Higher,
): React.CSSProperties {
  if (higher !== 'tie' && higher === side) {
    return {
      background: SHELL.PEACH_BG,
      borderLeft: `2px solid ${SHELL.PEACH_LINE}`,
    };
  }
  return {};
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        color: SHELL.INK_MUTED,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        fontWeight: 500,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function CitationChips({ refs }: { refs: string[] }) {
  if (refs.length === 0) {
    return (
      <div style={{ fontSize: 12, color: SHELL.INK_MUTED, fontStyle: 'italic' }}>
        No citations
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {refs.map((ref, idx) => (
        <span
          key={`${ref}-${idx}`}
          style={{
            background: SHELL.CARD_WHITE,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 4,
            padding: '4px 8px',
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.04em',
            color: SHELL.INK_SOFT,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 280,
          }}
        >
          {ref}
        </span>
      ))}
    </div>
  );
}

function ColumnHeader({
  side,
  patternTitle,
}: {
  side: InstanceComparisonSide;
  patternTitle: string;
}) {
  return (
    <div
      style={{
        background: SHELL.PAPER_SOFT,
        borderBottom: `1px solid ${SHELL.CARD_LINE}`,
        padding: '14px 18px',
      }}
    >
      <MonoLabel>
        {side.kind === 'source' ? 'Source event' : 'Program'} · {side.stageLabel}
      </MonoLabel>
      <div
        style={{
          fontFamily: SHELL.SERIF_DISPLAY,
          fontSize: 18,
          color: SHELL.INK,
          marginBottom: 4,
          letterSpacing: '-0.01em',
        }}
      >
        {side.instanceId}
      </div>
      <div style={{ fontSize: 12, color: SHELL.INK_SOFT }}>{patternTitle}</div>
    </div>
  );
}

function MetricRow({
  label,
  leftContent,
  rightContent,
  leftStyle,
  rightStyle,
}: {
  label: string;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftStyle?: React.CSSProperties;
  rightStyle?: React.CSSProperties;
}) {
  const cellBase: React.CSSProperties = {
    padding: '14px 18px',
    borderTop: `1px solid ${SHELL.CARD_LINE}`,
    borderRight: `1px solid ${SHELL.CARD_LINE}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };
  const labelCell: React.CSSProperties = {
    ...cellBase,
    background: SHELL.PAPER,
    fontFamily: SHELL.MONO,
    fontSize: 10,
    color: SHELL.INK_MUTED,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontWeight: 500,
    justifyContent: 'center',
  };
  return (
    <>
      <div style={labelCell}>{label}</div>
      <div style={{ ...cellBase, ...leftStyle }}>{leftContent}</div>
      <div
        style={{
          ...cellBase,
          borderRight: 'none',
          ...rightStyle,
        }}
      >
        {rightContent}
      </div>
    </>
  );
}

function GateBreakdown({
  passed,
  pending,
  blocked,
}: {
  passed: number;
  pending: number;
  blocked: number;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, color: SHELL.MINT_TEXT, fontWeight: 600 }}>
        {passed} passed
      </span>
      <span style={{ fontSize: 13, color: SHELL.PEACH_TEXT, fontWeight: 600 }}>
        {pending} pending
      </span>
      <span style={{ fontSize: 13, color: SHELL.RUST_TEXT, fontWeight: 600 }}>
        {blocked} blocked
      </span>
    </div>
  );
}

function CountWithLabel({
  count,
  label,
}: {
  count: number;
  label: string;
}) {
  return (
    <>
      <div
        style={{
          fontFamily: SHELL.SERIF_DISPLAY,
          fontSize: 22,
          color: SHELL.INK,
          lineHeight: 1.1,
        }}
      >
        {count}
      </div>
      <div
        style={{
          fontSize: 12,
          color: SHELL.INK_SOFT,
          marginTop: 2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </div>
    </>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

export function InstanceComparisonGrid({
  left,
  right,
}: InstanceComparisonGridProps) {
  const leftMetrics = deriveMetrics(left.context);
  const rightMetrics = deriveMetrics(right.context);

  const blockedHigher = compareHigher(
    leftMetrics.blocked,
    rightMetrics.blocked,
  );
  const contradictionHigher = compareHigher(
    leftMetrics.contradictionCount,
    rightMetrics.contradictionCount,
  );
  const failureHigher = compareHigher(
    leftMetrics.failureModeCount,
    rightMetrics.failureModeCount,
  );
  const cascadeHigher = compareHigher(
    leftMetrics.cascadeCount,
    rightMetrics.cascadeCount,
  );
  const blockerHigher = compareHigher(
    leftMetrics.activeBlockerCount,
    rightMetrics.activeBlockerCount,
  );

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 8,
        overflow: 'hidden',
        fontFamily: SHELL.SANS,
        color: SHELL.INK,
      }}
    >
      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr 1fr',
        }}
      >
        <div
          style={{
            background: SHELL.PAPER_DEEP,
            borderBottom: `1px solid ${SHELL.CARD_LINE}`,
            borderRight: `1px solid ${SHELL.CARD_LINE}`,
            padding: '14px 18px',
          }}
        >
          <MonoLabel>Comparison</MonoLabel>
          <div
            style={{
              fontFamily: SHELL.SERIF_DISPLAY,
              fontSize: 16,
              color: SHELL.INK,
            }}
          >
            Reasoning side-by-side
          </div>
        </div>
        <div style={{ borderRight: `1px solid ${SHELL.CARD_LINE}` }}>
          <ColumnHeader side={left} patternTitle={patternTitleFor(left.context)} />
        </div>
        <div>
          <ColumnHeader side={right} patternTitle={patternTitleFor(right.context)} />
        </div>
      </div>

      {/* Metric rows */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr 1fr',
        }}
      >
        <MetricRow
          label="Synthesis quote"
          leftContent={
            <p
              style={{
                margin: 0,
                fontFamily: SHELL.SERIF,
                fontSize: 14,
                lineHeight: 1.5,
                color: SHELL.INK,
                fontStyle: 'italic',
              }}
            >
              “{leftMetrics.excerpt}”
            </p>
          }
          rightContent={
            <p
              style={{
                margin: 0,
                fontFamily: SHELL.SERIF,
                fontSize: 14,
                lineHeight: 1.5,
                color: SHELL.INK,
                fontStyle: 'italic',
              }}
            >
              “{rightMetrics.excerpt}”
            </p>
          }
        />
        <MetricRow
          label="Citations"
          leftContent={<CitationChips refs={leftMetrics.citations} />}
          rightContent={<CitationChips refs={rightMetrics.citations} />}
        />
        <MetricRow
          label="Gate counts"
          leftContent={
            <GateBreakdown
              passed={leftMetrics.passed}
              pending={leftMetrics.pending}
              blocked={leftMetrics.blocked}
            />
          }
          rightContent={
            <GateBreakdown
              passed={rightMetrics.passed}
              pending={rightMetrics.pending}
              blocked={rightMetrics.blocked}
            />
          }
          leftStyle={highlightStyle('left', blockedHigher)}
          rightStyle={highlightStyle('right', blockedHigher)}
        />
        <MetricRow
          label="Contradictions"
          leftContent={
            <CountWithLabel
              count={leftMetrics.contradictionCount}
              label={leftMetrics.contradictionTopLabel}
            />
          }
          rightContent={
            <CountWithLabel
              count={rightMetrics.contradictionCount}
              label={rightMetrics.contradictionTopLabel}
            />
          }
          leftStyle={highlightStyle('left', contradictionHigher)}
          rightStyle={highlightStyle('right', contradictionHigher)}
        />
        <MetricRow
          label="Failure modes"
          leftContent={
            <CountWithLabel
              count={leftMetrics.failureModeCount}
              label={leftMetrics.failureModeTopLabel}
            />
          }
          rightContent={
            <CountWithLabel
              count={rightMetrics.failureModeCount}
              label={rightMetrics.failureModeTopLabel}
            />
          }
          leftStyle={highlightStyle('left', failureHigher)}
          rightStyle={highlightStyle('right', failureHigher)}
        />
        <MetricRow
          label="Cascade impacts"
          leftContent={
            <CountWithLabel
              count={leftMetrics.cascadeCount}
              label={`top severity · ${leftMetrics.cascadeTopSeverity}`}
            />
          }
          rightContent={
            <CountWithLabel
              count={rightMetrics.cascadeCount}
              label={`top severity · ${rightMetrics.cascadeTopSeverity}`}
            />
          }
          leftStyle={highlightStyle('left', cascadeHigher)}
          rightStyle={highlightStyle('right', cascadeHigher)}
        />
        <MetricRow
          label="Active blockers"
          leftContent={
            <CountWithLabel
              count={leftMetrics.activeBlockerCount}
              label="unmet hard gates + open contradictions"
            />
          }
          rightContent={
            <CountWithLabel
              count={rightMetrics.activeBlockerCount}
              label="unmet hard gates + open contradictions"
            />
          }
          leftStyle={highlightStyle('left', blockerHigher)}
          rightStyle={highlightStyle('right', blockerHigher)}
        />
      </div>
    </div>
  );
}

'use client';

import { type CSSProperties } from 'react';
import { criterionById } from '@/lib/source/canonical-specs';
import type {
  SourceEventGateCriterion,
  SourceEventGateCriterionState,
} from '@/lib/source/canvas-substrate';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';
import { CANVAS } from './canvas-tokens';

interface CanvasGateSidebarProps {
  fromStage: SourceStageKey;
  states: SourceEventGateCriterion[];
  onChangeCriterionState?: (
    criterionId: string,
    next: SourceEventGateCriterionState,
  ) => Promise<void>;
  pendingByCriterionId?: Record<string, boolean>;
  onPromoteStage?: (toStage: SourceStageKey) => Promise<void>;
  promotePending?: boolean;
}

type OwnerRole =
  | 'sourcing-lead'
  | 'sponsor'
  | 'ea-council'
  | 'steward'
  | 'sentinel'
  | 'atlas'
  | 'finance'
  | 'legal';

const ROLE_LABELS: Record<OwnerRole, string> = {
  'sourcing-lead': 'Sourcing Lead',
  sponsor: 'Sponsor',
  'ea-council': 'EA Council',
  steward: 'Steward',
  sentinel: 'Sentinel',
  atlas: 'Atlas',
  finance: 'Finance',
  legal: 'Legal',
};

// Stable display order for owner groups.
const ROLE_ORDER: OwnerRole[] = [
  'sourcing-lead',
  'sponsor',
  'steward',
  'ea-council',
  'legal',
  'finance',
  'atlas',
  'sentinel',
];

/**
 * Always-visible left sidebar for the canvas. Shows gate criteria grouped by
 * owner role (category) — each group has a live "X/N" tally and a compact
 * checklist below it. Gate tab in EventWorkspace is removed when this sidebar
 * is present.
 */
export function CanvasGateSidebar({
  fromStage,
  states,
  onChangeCriterionState,
  pendingByCriterionId,
  onPromoteStage,
  promotePending,
}: CanvasGateSidebarProps) {
  const ordered = [...states].sort((a, b) => a.criterionId.localeCompare(b.criterionId));
  const total = ordered.length;
  const met = ordered.filter((s) => s.state === 'met' || s.state === 'waived').length;
  const allMet = total > 0 && met === total;
  const targetStage = ordered[0]?.toStage ?? null;
  const targetLabel =
    targetStage && targetStage !== 'closed'
      ? SOURCE_STAGE_LABELS[targetStage as SourceStageKey]
      : 'Closed';

  // Group by ownerRole from the canonical spec, preserving ROLE_ORDER.
  const grouped = ROLE_ORDER.reduce<
    { role: OwnerRole; label: string; items: SourceEventGateCriterion[] }[]
  >((acc, role) => {
    const items = ordered.filter((s) => {
      const def = criterionById(s.criterionId);
      return def?.ownerRole === role;
    });
    if (items.length > 0) acc.push({ role, label: ROLE_LABELS[role], items });
    return acc;
  }, []);

  // Anything with an unrecognised / missing ownerRole falls into an Other bucket.
  const assignedIds = new Set(grouped.flatMap((g) => g.items.map((s) => s.criterionId)));
  const unassigned = ordered.filter((s) => !assignedIds.has(s.criterionId));
  if (unassigned.length > 0) {
    grouped.push({ role: 'steward', label: 'Other', items: unassigned });
  }

  return (
    <aside
      data-testid="source-canvas-gate-sidebar"
      aria-label={`Gate checklist: advance from ${SOURCE_STAGE_LABELS[fromStage]} to ${targetLabel}`}
      style={SIDEBAR_STYLE}
    >
      {/* ── Overall progress header ── */}
      <div style={HEAD_STYLE}>
        <div style={HEAD_EYEBROW_STYLE}>To advance to {targetLabel}</div>
        <div style={HEAD_PROGRESS_STYLE}>
          <span style={HEAD_COUNT_STYLE}>{met} of {total}</span>
          <span style={HEAD_UNIT_STYLE}> complete</span>
        </div>
        {/* Thin overall progress bar */}
        {total > 0 ? (
          <div style={PROGRESS_TRACK_STYLE} aria-hidden>
            <div
              style={{
                ...PROGRESS_FILL_STYLE,
                width: `${Math.round((met / total) * 100)}%`,
                background: allMet ? CANVAS.ACTIVE : CANVAS.INK,
              }}
            />
          </div>
        ) : null}
      </div>

      {/* ── Grouped criteria ── */}
      {total === 0 ? (
        <p style={EMPTY_STYLE}>No gate criteria for this stage.</p>
      ) : (
        grouped.map(({ role, label, items }) => {
          const groupMet = items.filter(
            (s) => s.state === 'met' || s.state === 'waived',
          ).length;
          const groupAllMet = groupMet === items.length;
          return (
            <div key={role}>
              <div style={GROUP_HEAD_STYLE} aria-label={`${label}: ${groupMet} of ${items.length}`}>
                <span style={GROUP_LABEL_STYLE}>{label}</span>
                <span
                  style={{
                    ...GROUP_TALLY_STYLE,
                    color: groupAllMet ? CANVAS.ACTIVE : CANVAS.INK_MUTED,
                  }}
                >
                  {groupMet}/{items.length}
                </span>
              </div>
              <ul style={LIST_STYLE} role="list">
                {items.map((s) => (
                  <CriterionRow
                    key={s.criterionId}
                    state={s}
                    pending={pendingByCriterionId?.[s.criterionId] ?? false}
                    onChangeCriterionState={onChangeCriterionState}
                  />
                ))}
              </ul>
            </div>
          );
        })
      )}

      {/* ── Advance footer ── */}
      <div style={FOOT_STYLE}>
        <button
          type="button"
          disabled={!allMet || promotePending || !onPromoteStage}
          onClick={() => {
            if (allMet && onPromoteStage && targetStage && targetStage !== 'closed') {
              void onPromoteStage(targetStage as SourceStageKey);
            }
          }}
          style={{
            ...ADVANCE_BTN_STYLE,
            ...(allMet && onPromoteStage && !promotePending
              ? ADVANCE_BTN_ACTIVE_STYLE
              : ADVANCE_BTN_DISABLED_STYLE),
            opacity: promotePending ? 0.7 : 1,
          }}
          data-testid="source-canvas-gate-sidebar-advance"
        >
          {promotePending ? 'Advancing…' : `Advance to ${targetLabel}`}
        </button>
      </div>
    </aside>
  );
}

// ── CriterionRow ─────────────────────────────────────────────────────────────

interface CriterionRowProps {
  state: SourceEventGateCriterion;
  pending: boolean;
  onChangeCriterionState?: (
    criterionId: string,
    next: SourceEventGateCriterionState,
  ) => Promise<void>;
}

function CriterionRow({ state: s, pending, onChangeCriterionState }: CriterionRowProps) {
  const def = criterionById(s.criterionId);
  const isMet = s.state === 'met' || s.state === 'waived';
  const dotColor = isMet
    ? CANVAS.ACTIVE
    : s.state === 'not_met'
      ? CANVAS.BLOCKED
      : CANVAS.GRAY;

  return (
    <li
      style={ROW_STYLE}
      data-testid={`source-canvas-gate-sidebar-${s.criterionId}`}
    >
      <span
        aria-hidden
        style={{
          ...DOT_STYLE,
          background: isMet ? dotColor : 'transparent',
          border: isMet ? 'none' : `1.5px solid ${dotColor}`,
        }}
      />
      <div style={ROW_BODY_STYLE}>
        <div
          style={{
            ...ROW_TITLE_STYLE,
            color: isMet ? CANVAS.INK_MUTED : CANVAS.INK,
          }}
        >
          {def?.title ?? s.criterionId}
          {def?.severity === 'hard' ? (
            <span style={HARD_TAG_STYLE}> hard</span>
          ) : null}
        </div>
        {onChangeCriterionState && s.state !== 'waived' ? (
          isMet ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void onChangeCriterionState(s.criterionId, 'pending')}
              style={{ ...BTN_GHOST_STYLE, opacity: pending ? 0.55 : 1 }}
              data-testid={`source-canvas-gate-sidebar-reopen-${s.criterionId}`}
            >
              {pending ? 'Reopening…' : 'Reopen'}
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => void onChangeCriterionState(s.criterionId, 'met')}
              style={{ ...BTN_PRIMARY_STYLE, opacity: pending ? 0.55 : 1 }}
              data-testid={`source-canvas-gate-sidebar-mark-met-${s.criterionId}`}
            >
              {pending ? 'Saving…' : 'Mark met →'}
            </button>
          )
        ) : (
          s.state === 'waived' ? (
            <span style={WAIVED_LABEL_STYLE}>Waived</span>
          ) : null
        )}
      </div>
    </li>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const SIDEBAR_STYLE: CSSProperties = {
  width: 276,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${CANVAS.HAIRLINE}`,
  background: CANVAS.PAGE_BG,
  height: '100%',
  overflowY: 'auto',
};

const HEAD_STYLE: CSSProperties = {
  padding: '14px 16px 12px',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  flexShrink: 0,
};

const HEAD_EYEBROW_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: CANVAS.INK_MUTED,
  fontWeight: 600,
  marginBottom: 4,
};

const HEAD_PROGRESS_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
};

const HEAD_COUNT_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 19,
  fontWeight: 400,
  color: CANVAS.INK,
  lineHeight: 1.2,
};

const HEAD_UNIT_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK_SOFT,
};

const PROGRESS_TRACK_STYLE: CSSProperties = {
  marginTop: 8,
  height: 2,
  background: 'rgba(12,26,58,0.08)',
  borderRadius: 1,
  overflow: 'hidden',
};

const PROGRESS_FILL_STYLE: CSSProperties = {
  height: '100%',
  borderRadius: 1,
  transition: 'width 250ms ease',
};

const GROUP_HEAD_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 16px 5px',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  background: 'rgba(12,26,58,0.02)',
};

const GROUP_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.11em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: CANVAS.INK_SOFT,
};

const GROUP_TALLY_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.04em',
  transition: 'color 200ms',
};

const LIST_STYLE: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const EMPTY_STYLE: CSSProperties = {
  padding: '16px',
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK_MUTED,
};

const ROW_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: 10,
  alignItems: 'start',
  padding: '10px 16px',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const DOT_STYLE: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 999,
  marginTop: 5,
  flexShrink: 0,
};

const ROW_BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  minWidth: 0,
};

const ROW_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  fontWeight: 500,
  lineHeight: 1.4,
};

const HARD_TAG_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: CANVAS.BLOCKED,
};

const BTN_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  padding: '3px 8px',
  borderRadius: 4,
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background 100ms, color 100ms',
};

const BTN_PRIMARY_STYLE: CSSProperties = {
  ...BTN_BASE,
  background: CANVAS.INK,
  color: '#fff',
  border: `1px solid ${CANVAS.INK}`,
};

const BTN_GHOST_STYLE: CSSProperties = {
  ...BTN_BASE,
  background: 'transparent',
  color: CANVAS.INK,
  border: `1px solid ${CANVAS.RULE}`,
};

const WAIVED_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: CANVAS.INK_MUTED,
};

const FOOT_STYLE: CSSProperties = {
  padding: '13px 16px',
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  marginTop: 'auto',
  flexShrink: 0,
};

const ADVANCE_BTN_STYLE: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 5,
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  fontWeight: 500,
  textAlign: 'center' as const,
  transition: 'background 120ms, color 120ms, border-color 120ms',
};

const ADVANCE_BTN_ACTIVE_STYLE: CSSProperties = {
  background: CANVAS.INK,
  color: '#fff',
  border: `1.5px solid ${CANVAS.INK}`,
  cursor: 'pointer',
};

const ADVANCE_BTN_DISABLED_STYLE: CSSProperties = {
  background: 'transparent',
  color: CANVAS.INK_MUTED,
  border: `1.5px solid ${CANVAS.RULE}`,
  cursor: 'not-allowed',
};

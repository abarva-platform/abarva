import type { CSSProperties } from 'react';
import {
  criterionById,
  type SourceGateCriterion,
} from '@/lib/source/canonical-specs';
import type {
  SourceEventGateCriterion,
  SourceEventGateCriterionState,
} from '@/lib/source/canvas-substrate';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';
import { CANVAS } from '../canvas-tokens';

const STATE_LABEL: Record<SourceEventGateCriterionState, string> = {
  pending: 'Pending',
  met: 'Met',
  not_met: 'Not met',
  waived: 'Waived',
  deferred: 'Deferred',
};

interface GateTabProps {
  fromStage: SourceStageKey;
  /** Per-event criterion states for this from-stage. */
  states: SourceEventGateCriterion[];
  /** Mutator — when omitted (SSR / read-only previews) the per-row
   * Mark met / Reopen buttons hide. */
  onChangeCriterionState?: (
    criterionId: string,
    next: SourceEventGateCriterionState,
  ) => Promise<void>;
  /** Per-criterion pending flag — disables the button while in flight. */
  pendingByCriterionId?: Record<string, boolean>;
}

/**
 * Gate tab — criteria checklist for advancing from this stage to the next.
 * Reads from the canonical SourceGateCriterion catalog (titles, severity,
 * owner, linked artifacts) and overlays per-event state from
 * source_event_gate_criterion_states.
 */
export function GateTab({
  fromStage,
  states,
  onChangeCriterionState,
  pendingByCriterionId,
}: GateTabProps) {
  const ordered = [...states].sort((a, b) => a.criterionId.localeCompare(b.criterionId));
  const total = ordered.length;
  const met = ordered.filter((s) => s.state === 'met' || s.state === 'waived').length;
  const allMet = total > 0 && met === total;
  const targetStage = ordered[0]?.toStage ?? null;
  const targetLabel =
    targetStage && targetStage !== 'closed'
      ? SOURCE_STAGE_LABELS[targetStage as SourceStageKey]
      : 'Closed';

  // B3 — explicit blocker summary. List the criteria that are
  // actually preventing promotion (pending / not_met) with their
  // titles, so the user has a diagnosis instead of a disabled button.
  const blockers = ordered
    .filter((s) => s.state !== 'met' && s.state !== 'waived')
    .map((s) => ({ state: s, def: criterionById(s.criterionId) }));
  const hardBlockers = blockers.filter((b) => b.def?.severity === 'hard');
  const promoteHelpId = 'source-canvas-gate-promote-help';

  return (
    <div data-testid="source-canvas-gate-tab" style={CONTAINER_STYLE}>
      <header style={HEADER_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>
            Gate · {SOURCE_STAGE_LABELS[fromStage]} → {targetLabel}
          </div>
          <h2 style={TITLE_STYLE}>
            {met} / {total} criteria met
          </h2>
          {!allMet && total > 0 ? (
            <p style={SUBLINE_STYLE}>
              {total - met} outstanding · review each criterion below or open the
              detail drawer for the waiver path.
            </p>
          ) : null}
          {allMet ? (
            <p style={SUBLINE_STYLE}>All criteria met. Promote when ready.</p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!allMet}
          aria-describedby={!allMet && total > 0 ? promoteHelpId : undefined}
          style={{
            ...PROMOTE_BUTTON_STYLE,
            background: allMet ? CANVAS.INK : 'rgba(10,10,11,0.08)',
            color: allMet ? '#fff' : CANVAS.INK_MUTED,
            cursor: allMet ? 'pointer' : 'not-allowed',
          }}
          data-testid="source-canvas-gate-promote"
        >
          Promote to {targetLabel}
        </button>
      </header>

      {/* B3 — blocker summary surfaces the specific reasons promotion
          is disabled. Hard blockers come first, then the rest. */}
      {!allMet && blockers.length > 0 ? (
        <div
          id={promoteHelpId}
          data-testid="source-canvas-gate-blockers"
          style={BLOCKERS_STYLE}
          role="status"
        >
          <div style={BLOCKERS_TITLE_STYLE}>
            {hardBlockers.length > 0
              ? `${hardBlockers.length} hard ${hardBlockers.length === 1 ? 'blocker' : 'blockers'}`
              : `${blockers.length} ${blockers.length === 1 ? 'criterion pending' : 'criteria pending'}`}
            {' '}before you can promote
          </div>
          <ul style={BLOCKERS_LIST_STYLE}>
            {[...hardBlockers, ...blockers.filter((b) => b.def?.severity !== 'hard')].map(
              ({ state, def }) => (
                <li
                  key={state.criterionId}
                  style={BLOCKERS_LIST_ITEM_STYLE}
                  data-testid={`source-canvas-gate-blocker-${state.criterionId}`}
                >
                  <span style={BLOCKERS_BULLET_STYLE}>·</span>
                  <span>
                    <span style={BLOCKERS_ITEM_TITLE_STYLE}>
                      {def?.title ?? state.criterionId}
                    </span>
                    {def?.severity === 'hard' ? (
                      <span style={INLINE_HARD_TAG_STYLE}>hard</span>
                    ) : null}
                    <span style={BLOCKERS_STATE_STYLE}>
                      {' — '}
                      {STATE_LABEL[state.state]}
                      {def?.linkedArtifactCodes && def.linkedArtifactCodes.length > 0
                        ? ` · evidence ${def.linkedArtifactCodes.join(', ')}`
                        : ''}
                    </span>
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>
      ) : null}

      {total === 0 ? (
        <p style={EMPTY_BODY_STYLE}>No gate criteria defined for this stage transition.</p>
      ) : (
        <ul style={LIST_STYLE}>
          {ordered.map((s) => {
            const def = criterionById(s.criterionId);
            return (
              <CriterionRow
                key={s.criterionId}
                state={s}
                def={def}
                onChangeState={onChangeCriterionState}
                pending={pendingByCriterionId?.[s.criterionId] ?? false}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface CriterionRowProps {
  state: SourceEventGateCriterion;
  def: SourceGateCriterion | undefined;
  onChangeState?: (
    criterionId: string,
    next: SourceEventGateCriterionState,
  ) => Promise<void>;
  pending: boolean;
}

function CriterionRow({ state, def, onChangeState, pending }: CriterionRowProps) {
  const isMet = state.state === 'met' || state.state === 'waived';
  const indicatorColor = isMet
    ? CANVAS.ACTIVE
    : state.state === 'not_met'
      ? CANVAS.BLOCKED
      : state.state === 'deferred'
        ? CANVAS.WAITING
        : CANVAS.GRAY;

  const isMetOrWaived = state.state === 'met' || state.state === 'waived';
  return (
    <li style={ROW_STYLE} data-testid={`source-canvas-gate-criterion-${state.criterionId}`}>
      <span aria-hidden style={{ ...DOT_STYLE, background: indicatorColor }} />
      <div style={ROW_BODY_STYLE}>
        <div style={ROW_TITLE_STYLE}>
          <span style={ROW_TITLE_TEXT}>{def?.title ?? state.criterionId}</span>
          <StatePill state={state.state} />
          {def?.severity === 'hard' ? <span style={HARD_TAG_STYLE}>hard</span> : null}
          {onChangeState && state.state !== 'waived' ? (
            isMetOrWaived ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => onChangeState(state.criterionId, 'pending')}
                data-testid={`source-canvas-gate-criterion-reopen-${state.criterionId}`}
                style={{ ...ROW_GHOST_BUTTON_STYLE, opacity: pending ? 0.55 : 1 }}
              >
                {pending ? 'Reopening…' : 'Reopen'}
              </button>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => onChangeState(state.criterionId, 'met')}
                data-testid={`source-canvas-gate-criterion-mark-met-${state.criterionId}`}
                style={{ ...ROW_PRIMARY_BUTTON_STYLE, opacity: pending ? 0.55 : 1 }}
              >
                {pending ? 'Saving…' : 'Mark met'}
              </button>
            )
          ) : null}
        </div>
        {def?.description ? <div style={ROW_DESC_STYLE}>{def.description}</div> : null}
        <div style={ROW_META_STYLE}>
          <span style={CRITERION_CODE}>{state.criterionId}</span>
          {def?.ownerRole ? (
            <>
              <span style={DOT_INLINE_STYLE}>·</span>
              <span>Owner: {def.ownerRole.replace(/-/g, ' ')}</span>
            </>
          ) : null}
          {def?.linkedArtifactCodes && def.linkedArtifactCodes.length > 0 ? (
            <>
              <span style={DOT_INLINE_STYLE}>·</span>
              <span>Evidence: {def.linkedArtifactCodes.join(', ')}</span>
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function StatePill({ state }: { state: SourceEventGateCriterionState }) {
  const tone = stateTone(state);
  return (
    <span
      data-testid={`source-canvas-gate-criterion-state-${state}`}
      style={{ ...STATE_PILL_STYLE, background: tone.bg, color: tone.fg, borderColor: tone.border }}
    >
      {STATE_LABEL[state]}
    </span>
  );
}

function stateTone(state: SourceEventGateCriterionState): {
  bg: string;
  fg: string;
  border: string;
} {
  switch (state) {
    case 'met':
      return { bg: 'rgba(46,125,50,0.10)', fg: '#2E7D32', border: 'rgba(46,125,50,0.32)' };
    case 'not_met':
      return { bg: 'rgba(211,84,0,0.10)', fg: '#B85B00', border: 'rgba(211,84,0,0.30)' };
    case 'deferred':
      return { bg: 'rgba(186,117,23,0.10)', fg: '#A66400', border: 'rgba(186,117,23,0.30)' };
    case 'waived':
      return { bg: 'rgba(10,10,11,0.06)', fg: CANVAS.INK, border: 'rgba(10,10,11,0.22)' };
    case 'pending':
    default:
      return { bg: 'rgba(10,10,11,0.04)', fg: CANVAS.INK_SOFT, border: 'rgba(10,10,11,0.14)' };
  }
}

const CONTAINER_STYLE: CSSProperties = {
  display: 'grid',
  gap: 24,
  maxWidth: 880,
};

const HEADER_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'end',
  gap: 16,
  paddingBottom: 16,
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: CANVAS.GRAY_DK,
  marginBottom: 6,
};

const TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 24,
  fontWeight: 400,
  letterSpacing: '-0.015em',
  color: CANVAS.INK,
  margin: 0,
  lineHeight: 1.2,
};

const SUBLINE_STYLE: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.5,
};

const PROMOTE_BUTTON_STYLE: CSSProperties = {
  padding: '10px 16px',
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: 'none',
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  alignSelf: 'center',
};

const LIST_STYLE: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'grid',
  gap: 0,
};

const ROW_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  gap: 14,
  padding: '14px 0',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const DOT_STYLE: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  marginTop: 5,
  flexShrink: 0,
};

const ROW_BODY_STYLE: CSSProperties = {
  display: 'grid',
  gap: 4,
  minWidth: 0,
};

const ROW_TITLE_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
};

const ROW_TITLE_TEXT: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  fontWeight: 600,
  color: CANVAS.INK,
};

const HARD_TAG_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: CANVAS.BLOCKED,
  fontWeight: 600,
};

const WAIVED_TAG_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: CANVAS.WAITING,
  fontWeight: 600,
};

const ROW_DESC_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.5,
  color: CANVAS.INK_SOFT,
};

const ROW_META_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: '0.04em',
  color: CANVAS.GRAY_DK,
  flexWrap: 'wrap',
};

const CRITERION_CODE: CSSProperties = {
  fontWeight: 600,
  color: CANVAS.INK_SOFT,
};

const DOT_INLINE_STYLE: CSSProperties = {
  color: CANVAS.GRAY,
};

const EMPTY_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
};

const BLOCKERS_STYLE: CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: '12px 14px',
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: `1px solid rgba(211,84,0,0.20)`,
  background: 'rgba(211,84,0,0.04)',
};

const BLOCKERS_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: '#B85B00',
  fontWeight: 700,
};

const BLOCKERS_LIST_STYLE: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'grid',
  gap: 4,
};

const BLOCKERS_LIST_ITEM_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: 8,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK,
};

const BLOCKERS_BULLET_STYLE: CSSProperties = {
  color: CANVAS.GRAY,
};

const BLOCKERS_ITEM_TITLE_STYLE: CSSProperties = {
  fontWeight: 600,
};

const BLOCKERS_STATE_STYLE: CSSProperties = {
  color: CANVAS.INK_SOFT,
  fontSize: 12.5,
};

const INLINE_HARD_TAG_STYLE: CSSProperties = {
  marginLeft: 6,
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: CANVAS.BLOCKED,
};

const ROW_PRIMARY_BUTTON_STYLE: CSSProperties = {
  marginLeft: 6,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 10px',
  borderRadius: 5,
  border: 'none',
  background: CANVAS.INK,
  color: '#ffffff',
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const ROW_GHOST_BUTTON_STYLE: CSSProperties = {
  marginLeft: 6,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3px 9px',
  borderRadius: 5,
  border: `1px solid ${CANVAS.RULE}`,
  background: 'transparent',
  color: CANVAS.INK,
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const STATE_PILL_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  padding: '2px 7px',
  borderRadius: 999,
  border: '1px solid transparent',
  whiteSpace: 'nowrap',
};

import type { CSSProperties } from 'react';
import {
  criterionById,
  type SourceGateCriterion,
} from '@/lib/source/canonical-specs';
import type { SourceEventGateCriterion } from '@/lib/source/canvas-substrate';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';
import { CANVAS } from '../canvas-tokens';

interface GateTabProps {
  fromStage: SourceStageKey;
  /** Per-event criterion states for this from-stage. */
  states: SourceEventGateCriterion[];
}

/**
 * Gate tab — criteria checklist for advancing from this stage to the next.
 * Reads from the canonical SourceGateCriterion catalog (titles, severity,
 * owner, linked artifacts) and overlays per-event state from
 * source_event_gate_criterion_states.
 */
export function GateTab({ fromStage, states }: GateTabProps) {
  const ordered = [...states].sort((a, b) => a.criterionId.localeCompare(b.criterionId));
  const total = ordered.length;
  const met = ordered.filter((s) => s.state === 'met' || s.state === 'waived').length;
  const allMet = total > 0 && met === total;
  const targetStage = ordered[0]?.toStage ?? null;
  const targetLabel =
    targetStage && targetStage !== 'closed'
      ? SOURCE_STAGE_LABELS[targetStage as SourceStageKey]
      : 'Closed';

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

      {total === 0 ? (
        <p style={EMPTY_BODY_STYLE}>No gate criteria defined for this stage transition.</p>
      ) : (
        <ul style={LIST_STYLE}>
          {ordered.map((s) => {
            const def = criterionById(s.criterionId);
            return <CriterionRow key={s.criterionId} state={s} def={def} />;
          })}
        </ul>
      )}
    </div>
  );
}

interface CriterionRowProps {
  state: SourceEventGateCriterion;
  def: SourceGateCriterion | undefined;
}

function CriterionRow({ state, def }: CriterionRowProps) {
  const isMet = state.state === 'met' || state.state === 'waived';
  const indicatorColor = isMet
    ? CANVAS.ACTIVE
    : state.state === 'not_met'
      ? CANVAS.BLOCKED
      : state.state === 'deferred'
        ? CANVAS.WAITING
        : CANVAS.GRAY;

  return (
    <li style={ROW_STYLE} data-testid={`source-canvas-gate-criterion-${state.criterionId}`}>
      <span aria-hidden style={{ ...DOT_STYLE, background: indicatorColor }} />
      <div style={ROW_BODY_STYLE}>
        <div style={ROW_TITLE_STYLE}>
          <span style={ROW_TITLE_TEXT}>{def?.title ?? state.criterionId}</span>
          {def?.severity === 'hard' ? <span style={HARD_TAG_STYLE}>hard</span> : null}
          {state.state === 'waived' ? <span style={WAIVED_TAG_STYLE}>waived</span> : null}
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

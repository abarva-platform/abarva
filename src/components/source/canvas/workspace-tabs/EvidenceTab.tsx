import type { CSSProperties } from 'react';
import {
  evidenceById,
  type SourceEvidenceRequirement,
} from '@/lib/source/canonical-specs';
import type {
  SourceEventEvidence,
  SourceEventEvidenceCurrentState,
} from '@/lib/source/canvas-substrate';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';
import { CANVAS } from '../canvas-tokens';

interface EvidenceTabProps {
  stage: SourceStageKey;
  states: SourceEventEvidence[];
}

/**
 * Evidence tab — readiness ramp for the data this stage needs.
 * Per-requirement state from source_event_evidence_states overlays the
 * canonical SourceEvidenceRequirement catalog (label, source, minimum state).
 */
export function EvidenceTab({ stage, states }: EvidenceTabProps) {
  const totals = countByState(states);

  return (
    <div data-testid="source-canvas-evidence-tab" style={CONTAINER_STYLE}>
      <header style={HEADER_STYLE}>
        <div style={EYEBROW_STYLE}>Evidence readiness · {SOURCE_STAGE_LABELS[stage]}</div>
        <h2 style={TITLE_STYLE}>
          {totals.usable} of {states.length} sources at usable evidence
        </h2>
        <p style={SUBLINE_STYLE}>
          The seven-state ramp drives gate-criterion auto-promotion. Sources
          must reach their minimum state for downstream artifacts to lock at
          full fidelity.
        </p>
      </header>

      <div style={LEGEND_STYLE} aria-label="Seven-state ramp legend">
        {(
          [
            ['Usable Evidence', CANVAS.ACTIVE, 'Validated, citable in artifacts and gates'],
            ['Available', CANVAS.ACTIVE, 'Parsed and sample-checked'],
            ['Parsed', CANVAS.WAITING, 'Fields extracted, not yet validated'],
            ['Loaded', CANVAS.WAITING, 'File ingested, not yet parsed'],
            ['Not Requested', CANVAS.GRAY, 'Known source, not yet pulled'],
            ['Stale', CANVAS.BLOCKED, 'Older than freshness window'],
            ['Low Confidence', CANVAS.BLOCKED, 'Sentinel-flagged'],
          ] as const
        ).map(([label, color, desc]) => (
          <div key={label} style={LEGEND_ITEM_STYLE}>
            <span aria-hidden style={{ ...LEGEND_DOT_STYLE, background: color }} />
            <span style={LEGEND_LABEL_STYLE}>{label}</span>
            <span style={LEGEND_DESC_STYLE}>{desc}</span>
          </div>
        ))}
      </div>

      <ul style={LIST_STYLE}>
        {states.length === 0 ? (
          <li style={EMPTY_BODY_STYLE}>No evidence requirements for this stage.</li>
        ) : (
          states.map((s) => {
            const def = evidenceById(s.requirementId);
            return <EvidenceRow key={s.requirementId} state={s} def={def} />;
          })
        )}
      </ul>
    </div>
  );
}

function countByState(states: SourceEventEvidence[]): { usable: number; total: number } {
  return {
    usable: states.filter(
      (s) => s.currentState === 'Usable Evidence' || s.currentState === 'Available',
    ).length,
    total: states.length,
  };
}

function EvidenceRow({
  state,
  def,
}: {
  state: SourceEventEvidence;
  def: SourceEvidenceRequirement | undefined;
}) {
  const color = colorForState(state.currentState);
  return (
    <li style={ROW_STYLE} data-testid={`source-canvas-evidence-${state.requirementId}`}>
      <span aria-hidden style={{ ...DOT_STYLE, background: color }} />
      <div style={ROW_BODY_STYLE}>
        <div style={ROW_TITLE_STYLE}>
          {def?.label ?? state.requirementId}
          {def?.level === 'required' ? <span style={REQUIRED_TAG_STYLE}>required</span> : null}
        </div>
        {def?.description ? <div style={ROW_DESC_STYLE}>{def.description}</div> : null}
        <div style={ROW_META_STYLE}>
          {def?.sourceLabel ? <span>{def.sourceLabel}</span> : null}
          {def?.sourceLabel ? <span style={DOT_INLINE_STYLE}>·</span> : null}
          <span style={STATE_LABEL_STYLE}>{state.currentState}</span>
          {def?.minimumState ? (
            <>
              <span style={DOT_INLINE_STYLE}>·</span>
              <span>min: {def.minimumState}</span>
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function colorForState(s: SourceEventEvidenceCurrentState): string {
  if (s === 'Usable Evidence' || s === 'Available') return CANVAS.ACTIVE;
  if (s === 'Parsed' || s === 'Loaded') return CANVAS.WAITING;
  if (s === 'Stale' || s === 'Low Confidence') return CANVAS.BLOCKED;
  return CANVAS.GRAY;
}

const CONTAINER_STYLE: CSSProperties = {
  display: 'grid',
  gap: 24,
  maxWidth: 880,
};

const HEADER_STYLE: CSSProperties = {
  display: 'grid',
  gap: 6,
  paddingBottom: 16,
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: CANVAS.GRAY_DK,
};

const TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 24,
  fontWeight: 400,
  letterSpacing: '-0.015em',
  color: CANVAS.INK,
  margin: 0,
};

const SUBLINE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.5,
  margin: 0,
};

const LEGEND_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 8,
  padding: '12px 14px',
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
};

const LEGEND_ITEM_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 8,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
};

const LEGEND_DOT_STYLE: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  display: 'inline-block',
  flexShrink: 0,
  alignSelf: 'center',
};

const LEGEND_LABEL_STYLE: CSSProperties = {
  fontWeight: 600,
  color: CANVAS.INK,
};

const LEGEND_DESC_STYLE: CSSProperties = {
  color: CANVAS.INK_SOFT,
};

const LIST_STYLE: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
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
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  fontWeight: 600,
  color: CANVAS.INK,
};

const REQUIRED_TAG_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: CANVAS.GRAY_DK,
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

const STATE_LABEL_STYLE: CSSProperties = {
  fontWeight: 600,
  color: CANVAS.INK,
};

const DOT_INLINE_STYLE: CSSProperties = {
  color: CANVAS.GRAY,
};

const EMPTY_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
  padding: '12px 0',
};

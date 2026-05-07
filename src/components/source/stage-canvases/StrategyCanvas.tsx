'use client';

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey, SourcingEventDetail } from '@/lib/source/types';
import type { GateEvaluation } from '@/lib/reasoning/types';
import { StageGateBlock } from './StageGateBlock';

interface StrategyCanvasProps {
  stageKey: SourceStageKey;
  event: SourcingEventDetail;
  nextGateEvaluations?: GateEvaluation[];
}

export function StrategyCanvas({ stageKey, event, nextGateEvaluations = [] }: StrategyCanvasProps) {
  const stageLabel = SOURCE_STAGE_LABELS[stageKey] ?? stageKey;
  const isCurrentStage = event.currentStageKey === stageKey;

  const valueDisplay =
    event.valueAtStakeUsd > 0
      ? `$${(event.valueAtStakeUsd / 1_000_000).toFixed(1)}M`
      : 'Not set';

  return (
    <section aria-label="Strategy stage canvas" style={STAGE_PANEL}>
      {/* Context strip */}
      <div style={CONTEXT_STRIP}>
        <span style={STRIP_TOKEN}>{event.name.length > 26 ? event.name.slice(0, 24) + '…' : event.name}</span>
        <span style={STRIP_DOT}>·</span>
        <span style={STRIP_TOKEN}>Step 1 of 11</span>
        {isCurrentStage && <span style={STRIP_DOT}>·</span>}
        {isCurrentStage && <span style={{ ...STRIP_TOKEN, color: SHELL.MINT_TEXT }}>Active</span>}
      </div>

      {/* Stage frame */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={EYEBROW}>Step 1 · Nexus</div>
          <h2 style={HEADING}>{stageLabel}</h2>
        </div>
        {isCurrentStage && <span style={ACTIVE_BADGE}>Active</span>}
      </div>

      {/* Strategy mandate card */}
      <div style={MANDATE_CARD}>
        <div style={MANDATE_LABEL}>Event mandate</div>
        <div style={MANDATE_TITLE}>{event.name}</div>
        <p style={MANDATE_COPY}>{event.synopsis || event.problemStatement}</p>
      </div>

      {/* KV grid: decision owner, IT category, value */}
      <div style={KV_GRID}>
        <div style={KV_CELL}>
          <div style={KV_LABEL}>Decision owner</div>
          <div style={KV_VALUE}>{event.scorecard.decisionOwner || event.owner || '—'}</div>
        </div>
        <div style={KV_CELL}>
          <div style={KV_LABEL}>IT category</div>
          <div style={KV_VALUE}>{event.archetype || '—'}</div>
        </div>
        <div style={KV_CELL}>
          <div style={KV_LABEL}>Value at stake</div>
          <div style={{ ...KV_VALUE, color: SHELL.MINT_TEXT }}>{valueDisplay}</div>
        </div>
        <div style={KV_CELL}>
          <div style={KV_LABEL}>Priority</div>
          <div style={KV_VALUE}>{event.priority}</div>
        </div>
      </div>

      {/* Trigger description */}
      {event.problemStatement && (
        <div style={TRIGGER_BLOCK}>
          <div style={KV_LABEL}>Business trigger</div>
          <p style={TRIGGER_TEXT}>{event.problemStatement}</p>
        </div>
      )}

      {/* Next decision */}
      {event.nextDecision && (
        <div style={TRIGGER_BLOCK}>
          <div style={KV_LABEL}>Next decision</div>
          <p style={TRIGGER_TEXT}>{event.nextDecision}</p>
        </div>
      )}

      {/* Divider */}
      <div style={DIVIDER} />

      {/* Gate block */}
      <StageGateBlock stageKey={stageKey} event={event} nextGateEvaluations={nextGateEvaluations} />
    </section>
  );
}

const STAGE_PANEL: CSSProperties = {
  border: `1px solid ${SHELL.BLUE_LINE}`,
  borderRadius: 16,
  background: `linear-gradient(145deg, ${SHELL.CARD_WHITE} 0%, ${SHELL.BLUE_BG} 100%)`,
  padding: '13px 14px',
  display: 'grid',
  gap: 12,
  boxShadow: '0 14px 32px rgba(12, 26, 58, 0.06)',
};

const CONTEXT_STRIP: CSSProperties = {
  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5,
  paddingBottom: 10, borderBottom: `1px solid ${SHELL.CARD_LINE}`,
};

const STRIP_TOKEN: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.INK_SOFT, fontWeight: 600,
};

const STRIP_DOT: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, lineHeight: 1,
};

const EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
};

const HEADING: CSSProperties = {
  margin: '2px 0 0', fontFamily: SHELL.SERIF, fontSize: 22,
  lineHeight: 1.1, color: SHELL.INK, letterSpacing: '-0.02em',
};

const ACTIVE_BADGE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  border: `1px solid ${SHELL.MINT_LINE}`, borderRadius: 999,
  background: SHELL.MINT_BG, padding: '3px 9px',
  fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.MINT_TEXT, fontWeight: 700, whiteSpace: 'nowrap',
};

const MANDATE_CARD: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 12,
  background: SHELL.CARD_WHITE, padding: '11px 12px', display: 'grid', gap: 5,
};

const MANDATE_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
};

const MANDATE_TITLE: CSSProperties = {
  fontFamily: SHELL.SERIF, fontSize: 16, lineHeight: 1.2,
  color: SHELL.INK, letterSpacing: '-0.01em',
};

const MANDATE_COPY: CSSProperties = {
  margin: 0, fontFamily: SHELL.SANS, fontSize: 12,
  lineHeight: 1.48, color: SHELL.INK_SOFT,
};

const KV_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
  gap: 8,
};

const KV_CELL: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10,
  background: 'rgba(253,251,246,0.82)', padding: '7px 9px',
};

const KV_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
};

const KV_VALUE: CSSProperties = {
  marginTop: 3, fontFamily: SHELL.SANS, fontSize: 12.5,
  lineHeight: 1.25, color: SHELL.INK, fontWeight: 700,
};

const TRIGGER_BLOCK: CSSProperties = {
  display: 'grid', gap: 4,
};

const TRIGGER_TEXT: CSSProperties = {
  margin: 0, fontFamily: SHELL.SANS, fontSize: 12,
  lineHeight: 1.48, color: SHELL.INK_SOFT,
};

const DIVIDER: CSSProperties = {
  height: 1, background: SHELL.CARD_LINE,
};

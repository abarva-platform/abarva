'use client';

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey, SourcingEventDetail } from '@/lib/source/types';
import type { GateEvaluation } from '@/lib/reasoning/types';
import { StageGateBlock } from './StageGateBlock';

interface EvaluationCanvasProps {
  stageKey: SourceStageKey;
  event: SourcingEventDetail;
  nextGateEvaluations?: GateEvaluation[];
}

// Default evaluation-readiness scores for the synthetic AMS vendor set.
const AMS_SCORECARD: {
  criterionId: string;
  label: string;
  weight: number;
  scores: Record<string, number>;
  notes: Record<string, string>;
}[] = [
  {
    criterionId: 'technical-capability',
    label: 'Scope and service capability',
    weight: 30,
    scores: { vendorA: 8.2, vendorB: 6.6, vendorC: 6.4 },
    notes: { vendorA: 'Strongest match to AMS scope and retained-team boundary', vendorB: 'Broad story, but retained obligations need closure', vendorC: 'Good service fit with narrower corporate tower scope' },
  },
  {
    criterionId: 'pricing',
    label: 'Commercial value',
    weight: 25,
    scores: { vendorA: 6.9, vendorB: 8.4, vendorC: 7.2 },
    notes: { vendorA: 'Higher TCO offset by continuity', vendorB: 'Lowest TCO with retained-effort caveats', vendorC: 'Middle TCO; optional scope must be normalized' },
  },
  {
    criterionId: 'transition',
    label: 'Transition readiness',
    weight: 20,
    scores: { vendorA: 8.0, vendorB: 5.9, vendorC: 6.5 },
    notes: { vendorA: 'Lower operational risk; fee holdbacks need sharpening', vendorB: 'Client dependency and staffing proof still open', vendorC: 'Lower transition cost with slower stabilization' },
  },
  {
    criterionId: 'governance',
    label: 'SLA accountability',
    weight: 15,
    scores: { vendorA: 7.1, vendorB: 7.4, vendorC: 8.8 },
    notes: { vendorA: 'Clear targets; credit cap too light', vendorB: 'Complete framework; staffing must prove coverage', vendorC: 'Strongest remedies and chronic-miss posture' },
  },
  {
    criterionId: 'references',
    label: 'Evidence completeness',
    weight: 10,
    scores: { vendorA: 8.0, vendorB: 6.2, vendorC: 8.2 },
    notes: { vendorA: 'Complete enough for conditional scoring', vendorB: 'Critical claims only partially in exhibits', vendorC: 'Clean evidence discipline with scope caveats' },
  },
];

const VENDORS = [
  { id: 'vendorA', label: 'Vendor A', band: 'bafo' },
  { id: 'vendorB', label: 'Vendor B', band: 'bafo' },
  { id: 'vendorC', label: 'Vendor C', band: 'bafo' },
];

function weightedScore(vendorId: string): string {
  const total = AMS_SCORECARD.reduce((acc, row) => {
    return acc + (row.scores[vendorId] ?? 0) * (row.weight / 100);
  }, 0);
  return total.toFixed(1);
}

function scoreColor(score: number): string {
  if (score >= 8) return SHELL.MINT_TEXT;
  if (score >= 6) return SHELL.INK_SOFT;
  if (score >= 4) return SHELL.AMBER_DOT;
  return SHELL.PEACH_TEXT;
}

export function EvaluationCanvas({ stageKey, event, nextGateEvaluations = [] }: EvaluationCanvasProps) {
  const stageLabel = SOURCE_STAGE_LABELS[stageKey] ?? stageKey;
  const isCurrentStage = event.currentStageKey === stageKey;
  const criteriaCount = event.scorecard.criteria.length || AMS_SCORECARD.length;
  const approvedCount = event.scorecard.criteria.filter((c) => c.status === 'approved').length;

  return (
    <section aria-label="Evaluation stage canvas" style={STAGE_PANEL}>
      {/* Context strip */}
      <div style={CONTEXT_STRIP}>
        <span style={STRIP_TOKEN}>{event.name.length > 26 ? event.name.slice(0, 24) + '…' : event.name}</span>
        <span style={STRIP_DOT}>·</span>
        <span style={STRIP_TOKEN}>Step 5 of 11</span>
        <span style={STRIP_DOT}>·</span>
        <span style={STRIP_TOKEN}>{VENDORS.filter((v) => v.band === 'bafo').length} vendors scored</span>
        {isCurrentStage && <><span style={STRIP_DOT}>·</span><span style={{ ...STRIP_TOKEN, color: SHELL.MINT_TEXT }}>Active</span></>}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={EYEBROW}>Step 5 · Steward</div>
          <h2 style={HEADING}>{stageLabel}</h2>
        </div>
        {isCurrentStage && <span style={ACTIVE_BADGE}>Active</span>}
      </div>

      {/* Governance strip */}
      <div style={GOVERNANCE_STRIP}>
        <div style={GOV_CELL}>
          <div style={KV_LABEL}>Decision owner</div>
          <div style={GOV_VALUE}>{event.scorecard.decisionOwner || '—'}</div>
        </div>
        <div style={GOV_CELL}>
          <div style={KV_LABEL}>Criteria</div>
          <div style={GOV_VALUE}>{criteriaCount} defined · {approvedCount} approved</div>
        </div>
        <div style={GOV_CELL}>
          <div style={KV_LABEL}>Scorecard state</div>
          <div style={{ ...GOV_VALUE, color: event.scorecard.approvalState === 'approved' ? SHELL.MINT_TEXT : SHELL.AMBER_DOT }}>
            {String(event.scorecard.approvalState).replaceAll('_', ' ')}
          </div>
        </div>
      </div>

      {/* Scorecard matrix table */}
      <div style={TABLE_WRAPPER} role="region" aria-label="Vendor evaluation scorecard">
        <div style={{ marginBottom: 6, fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700 }}>
          Scorecard matrix — criteria × vendors (weighted 0–10)
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={TABLE} aria-label="Evaluation scorecard matrix">
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left', width: 160 }}>Criterion</th>
                <th style={{ ...TH, width: 40, textAlign: 'center' }}>Wt%</th>
                {VENDORS.map((v) => (
                  <th key={v.id} style={{ ...TH, textAlign: 'center', width: 76, opacity: v.band === 'declined' ? 0.5 : 1 }}>
                    {v.label}
                    {v.band === 'declined' && <span style={DECLINED_CHIP}>out</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AMS_SCORECARD.map((row, rowIndex) => (
                <tr key={row.criterionId} style={{ background: rowIndex % 2 === 0 ? 'transparent' : 'rgba(12,26,58,0.018)' }}>
                  <td style={TD_LABEL}>{row.label}</td>
                  <td style={{ ...TD_CENTER, color: SHELL.INK_MUTED }}>{row.weight}%</td>
                  {VENDORS.map((v) => {
                    const score = row.scores[v.id] ?? 0;
                    return (
                      <td key={v.id} style={{ ...TD_CENTER, opacity: v.band === 'declined' ? 0.45 : 1 }} title={row.notes[v.id]}>
                        <span style={{ color: scoreColor(score), fontWeight: 700, fontFamily: SHELL.SANS, fontSize: 12 }}>
                          {score}
                        </span>
                        <span style={{ fontFamily: SHELL.MONO, fontSize: 8, color: SHELL.INK_MUTED }}>/10</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Weighted total row */}
              <tr style={{ borderTop: `2px solid ${SHELL.CARD_LINE}`, background: SHELL.PAPER_SOFT }}>
                <td style={{ ...TD_LABEL, fontWeight: 700, color: SHELL.INK }}>Weighted total</td>
                <td style={TD_CENTER}>—</td>
                {VENDORS.map((v) => (
                  <td key={v.id} style={{ ...TD_CENTER, opacity: v.band === 'declined' ? 0.45 : 1 }}>
                    <span style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 900, color: v.band === 'bafo' ? SHELL.INK : SHELL.INK_MUTED }}>
                      {weightedScore(v.id)}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 6, fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.06em', color: SHELL.INK_MUTED }}>
          Hover cells for rationale. Scores are default evaluation readiness guidance — final scores require human reviewer lock.
        </div>
      </div>

      <div style={DIVIDER} />
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

const GOVERNANCE_STRIP: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
};

const GOV_CELL: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10,
  background: 'rgba(253,251,246,0.82)', padding: '7px 9px',
};

const KV_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
};

const GOV_VALUE: CSSProperties = {
  marginTop: 3, fontFamily: SHELL.SANS, fontSize: 11.5,
  lineHeight: 1.3, color: SHELL.INK, fontWeight: 700,
};

const TABLE_WRAPPER: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 12,
  background: SHELL.CARD_WHITE, padding: '10px 12px',
};

const TABLE: CSSProperties = {
  width: '100%', borderCollapse: 'collapse',
};

const TH: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
  padding: '5px 8px', borderBottom: `1px solid ${SHELL.CARD_LINE}`,
};

const TD_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS, fontSize: 11.5, color: SHELL.INK_SOFT,
  padding: '6px 8px', lineHeight: 1.3,
};

const TD_CENTER: CSSProperties = {
  textAlign: 'center', padding: '6px 8px',
};

const DECLINED_CHIP: CSSProperties = {
  display: 'inline-flex', marginLeft: 4, alignItems: 'center',
  border: `1px solid ${SHELL.GRAY_LINE}`, borderRadius: 4,
  background: SHELL.GRAY_BG, padding: '1px 4px',
  fontFamily: SHELL.MONO, fontSize: 6.5, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: SHELL.GRAY_TEXT, fontWeight: 700,
};

const DIVIDER: CSSProperties = {
  height: 1, background: SHELL.CARD_LINE,
};

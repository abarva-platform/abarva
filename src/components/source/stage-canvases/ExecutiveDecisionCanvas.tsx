'use client';

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey, SourcingEventDetail } from '@/lib/source/types';
import type { GateEvaluation } from '@/lib/reasoning/types';
import { StageGateBlock } from './StageGateBlock';

interface ExecutiveDecisionCanvasProps {
  stageKey: SourceStageKey;
  event: SourcingEventDetail;
  nextGateEvaluations?: GateEvaluation[];
}

const EXEC_BRIEF = {
  recommendedVendor: 'ArcVault Managed',
  rationale:
    'ArcVault has the strongest CDP/SAP integration credentials of the shortlist, includes an application rationalization advisory in base scope, and aligns to the CDP Q3 nearshore capacity requirement. After BAFO, governance and escalation path gaps must be resolved as a condition of award.',
  valueCaseItems: [
    { label: '3-year TCO (post-BAFO)', value: '~$11.8M', note: 'vs $12.8M Northstar' },
    { label: 'Annual run savings vs baseline', value: '$1.4M', note: 'Based on current AMS spend' },
    { label: 'Transition risk', value: 'Medium', note: 'Governance remediation required' },
    { label: 'CDP Q3 alignment', value: 'Confirmed', note: 'Nearshore team available' },
  ],
  approvalPath: [
    { step: 1, role: 'CIO', owner: 'CIO Sponsor', action: 'Signs executive decision brief', status: 'pending' },
    { step: 2, role: 'CFO', owner: 'Finance Lead', action: 'Confirms value case and TCO model', status: 'pending' },
    { step: 3, role: 'Legal', owner: 'Legal Counsel', action: 'Reviews contract terms and SLA definitions', status: 'pending' },
    { step: 4, role: 'Sourcing Lead', owner: 'Priya Mehta', action: 'Issues award notice and opens contract mobilization', status: 'pending' },
  ],
  keyRisks: [
    { label: 'Governance gap', detail: 'Steering committee and escalation paths undefined — must be resolved before contract execution.', mitigation: 'Require governance addendum as BAFO condition.' },
    { label: 'Northstar pricing opacity', detail: 'Tier-2 support is bundled — Northstar is the fallback if ArcVault governance is unresolvable.', mitigation: 'Parallel negotiation — if ArcVault governance addendum fails, pivot to Northstar within 5 days.' },
    { label: 'CDP Q3 dependency', detail: 'AMS award must complete before CDP P3 Design can progress.', mitigation: 'Award target: May 28, 2026. Any delay surfaces to APX-CDP-2026 program lead.' },
  ],
  objections: [] as { owner: string; objection: string; resolution: string }[],
};

export function ExecutiveDecisionCanvas({ stageKey, event, nextGateEvaluations = [] }: ExecutiveDecisionCanvasProps) {
  const stageLabel = SOURCE_STAGE_LABELS[stageKey] ?? stageKey;
  const isCurrentStage = event.currentStageKey === stageKey;

  return (
    <section aria-label="Executive decision stage canvas" style={STAGE_PANEL}>
      {/* Context strip */}
      <div style={CONTEXT_STRIP}>
        <span style={STRIP_TOKEN}>{event.name.length > 26 ? event.name.slice(0, 24) + '…' : event.name}</span>
        <span style={STRIP_DOT}>·</span>
        <span style={STRIP_TOKEN}>Step 8 of 11</span>
        <span style={STRIP_DOT}>·</span>
        <span style={STRIP_TOKEN}>{EXEC_BRIEF.approvalPath.length}-step approval path</span>
        {isCurrentStage && <><span style={STRIP_DOT}>·</span><span style={{ ...STRIP_TOKEN, color: SHELL.MINT_TEXT }}>Active</span></>}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={EYEBROW}>Step 8 · Atlas</div>
          <h2 style={HEADING}>{stageLabel}</h2>
        </div>
        {isCurrentStage && <span style={ACTIVE_BADGE}>Active</span>}
      </div>

      {/* Recommendation card */}
      <div style={RECOMMENDATION_CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          <div>
            <div style={REC_LABEL}>Atlas recommendation</div>
            <div style={REC_VENDOR}>{EXEC_BRIEF.recommendedVendor}</div>
          </div>
          <span style={PENDING_BADGE}>Pending approval</span>
        </div>
        <p style={REC_RATIONALE}>{EXEC_BRIEF.rationale}</p>
      </div>

      {/* Value case grid */}
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700 }}>
          Value case
        </div>
        <div style={VALUE_GRID}>
          {EXEC_BRIEF.valueCaseItems.map((item) => (
            <div key={item.label} style={VALUE_CELL}>
              <div style={VALUE_LABEL}>{item.label}</div>
              <div style={VALUE_NUMBER}>{item.value}</div>
              <div style={VALUE_NOTE}>{item.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Approval path */}
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700 }}>
          Approval path — {EXEC_BRIEF.approvalPath.filter((s) => s.status === 'approved').length} of {EXEC_BRIEF.approvalPath.length} complete
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {EXEC_BRIEF.approvalPath.map((step) => (
            <div key={step.step} style={APPROVAL_ROW}>
              <div style={{ ...STEP_NUMBER, background: step.status === 'approved' ? SHELL.MINT_BG : SHELL.PAPER_SOFT, color: step.status === 'approved' ? SHELL.MINT_TEXT : SHELL.INK_MUTED }}>
                {step.step}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontFamily: SHELL.SANS, fontSize: 12, fontWeight: 700, color: SHELL.INK }}>{step.role}</span>
                  <span style={{ fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', color: SHELL.INK_MUTED }}>{step.owner}</span>
                </div>
                <div style={{ fontFamily: SHELL.SANS, fontSize: 11, lineHeight: 1.35, color: SHELL.INK_SOFT }}>{step.action}</div>
              </div>
              <span style={{
                flexShrink: 0,
                fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
                color: step.status === 'approved' ? SHELL.MINT_TEXT : SHELL.AMBER_DOT,
              }}>
                {step.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Key risks */}
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700 }}>
          Key risks and mitigations
        </div>
        <div style={{ display: 'grid', gap: 7 }}>
          {EXEC_BRIEF.keyRisks.map((risk, i) => (
            <div key={i} style={RISK_ROW}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: SHELL.AMBER_DOT, flexShrink: 0, marginTop: 3, display: 'inline-block' }} />
                <div>
                  <div style={{ fontFamily: SHELL.SANS, fontSize: 12, fontWeight: 700, color: SHELL.INK }}>{risk.label}</div>
                  <div style={{ fontFamily: SHELL.SANS, fontSize: 11.2, lineHeight: 1.38, color: SHELL.INK_SOFT, marginTop: 2 }}>{risk.detail}</div>
                </div>
              </div>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 11, lineHeight: 1.35, color: SHELL.MINT_TEXT, paddingLeft: 13 }}>
                Mitigation: {risk.mitigation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Objections log */}
      {EXEC_BRIEF.objections.length === 0 ? (
        <div style={OBJECTION_EMPTY}>
          <span style={{ fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700 }}>
            Stakeholder objections · None recorded
          </span>
        </div>
      ) : null}

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

const RECOMMENDATION_CARD: CSSProperties = {
  border: `1px solid ${SHELL.BLUE_LINE}`, borderRadius: 12,
  background: SHELL.BLUE_BG, padding: '11px 13px', display: 'grid', gap: 8,
};

const REC_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
};

const REC_VENDOR: CSSProperties = {
  fontFamily: SHELL.SERIF, fontSize: 20, lineHeight: 1.1,
  color: SHELL.INK, letterSpacing: '-0.01em',
};

const REC_RATIONALE: CSSProperties = {
  margin: 0, fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.48, color: SHELL.INK_SOFT,
};

const PENDING_BADGE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  border: `1px solid ${SHELL.PEACH_LINE}`, borderRadius: 999,
  background: SHELL.PEACH_BG, padding: '3px 9px',
  fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.PEACH_TEXT, fontWeight: 700, whiteSpace: 'nowrap',
};

const VALUE_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 110px), 1fr))',
  gap: 8,
};

const VALUE_CELL: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10,
  background: SHELL.CARD_WHITE, padding: '7px 9px',
};

const VALUE_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 7.5, letterSpacing: '0.09em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700,
};

const VALUE_NUMBER: CSSProperties = {
  marginTop: 3, fontFamily: SHELL.SANS, fontSize: 14,
  lineHeight: 1.1, color: SHELL.INK, fontWeight: 900,
};

const VALUE_NOTE: CSSProperties = {
  marginTop: 2, fontFamily: SHELL.MONO, fontSize: 8,
  letterSpacing: '0.04em', color: SHELL.INK_MUTED,
};

const APPROVAL_ROW: CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 9,
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 9,
  background: SHELL.CARD_WHITE, padding: '7px 9px',
};

const STEP_NUMBER: CSSProperties = {
  width: 22, height: 22, borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: SHELL.MONO, fontSize: 9, fontWeight: 900, flexShrink: 0,
  border: `1px solid ${SHELL.CARD_LINE}`,
};

const RISK_ROW: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 9,
  background: SHELL.CARD_WHITE, padding: '8px 10px', display: 'grid', gap: 5,
};

const OBJECTION_EMPTY: CSSProperties = {
  border: `1px dashed ${SHELL.CARD_LINE}`, borderRadius: 8,
  background: SHELL.PAPER_SOFT, padding: '7px 11px', textAlign: 'center',
};

const DIVIDER: CSSProperties = {
  height: 1, background: SHELL.CARD_LINE,
};

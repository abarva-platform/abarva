'use client';

// PROD8 (wave-17): Production Readiness Decision Flow.
//
// Refresh of /platform/admin/production-readiness as a decision control
// plane (not a tracker dashboard). Renders 8 ordered sections that answer
// the calm operator questions: are we demo-ready? pilot-ready? what blocks
// production? what is the evidence basis? and what are the next five
// concrete actions?
//
// Manifest-backed (docs/build/production-readiness.json). Not a live
// monitoring feed. The existing ProductionReadinessTracker and
// ProductionReadinessLivePanel render below this surface (page-level) —
// section 5 is a calm pointer, not a re-mount.

import type { CSSProperties } from 'react';
import { BORDER, COLORS, FONT, RADIUS, SPACING, TYPE } from '@/lib/design/abarva-theme';

// ---------------------------------------------------------------------
// Public props
// ---------------------------------------------------------------------

export interface ProductionReadinessDecisionFlowProps {
  /** If false, hides the live-status sub-line. Default: true */
  showLiveCaveat?: boolean;
}

// ---------------------------------------------------------------------
// View-model
// ---------------------------------------------------------------------

type DecisionAnswer = 'yes' | 'partial' | 'no';

interface DecisionFlowView {
  overallBrief: {
    headline: string;
    asOf: string;
    sourceClaim: string;
  };
  canWeDemo: {
    answer: DecisionAnswer;
    rationale: string;
    blockers: string[];
  };
  canWePilot: {
    answer: DecisionAnswer;
    rationale: string;
    blockers: string[];
  };
  whatBlocksProduction: {
    items: string[];
  };
  evidenceBasis: {
    manifestSource: string;
    testsRun: string;
    lastValidated: string;
  };
  liveStatusCaveat: string;
  nextFiveActions: ReadonlyArray<{
    actionId: string;
    label: string;
    owner: string;
  }>;
}

export function buildDecisionFlowView(): DecisionFlowView {
  return {
    overallBrief: {
      headline:
        'AbarVa is demo-ready. Pilot is partial. Production has explicit blockers.',
      asOf: '2026-04-26',
      sourceClaim:
        'Manifest-backed (docs/build/production-readiness.json). Not live monitoring.',
    },
    canWeDemo: {
      answer: 'yes',
      rationale:
        'Core demo routes (Source, Intelligence, Tower, Admin) render deterministic seed data and pass route smoke tests.',
      blockers: [],
    },
    canWePilot: {
      answer: 'partial',
      rationale:
        'Live vendor ingestion not wired. Pilots can run on seed data with explicit caveats.',
      blockers: [
        'Live vendor data ingestion (deferred)',
        'Customer-tenant Azure deployment (in progress)',
      ],
    },
    whatBlocksProduction: {
      items: [
        'Centralised model gateway (deferred)',
        'Tool registry boundary (deferred)',
        'Live audit trail across cross-plane calls',
        'Customer-tenant private data plane production rollout',
        'Multi-tenant security review',
      ],
    },
    evidenceBasis: {
      manifestSource: 'docs/build/production-readiness.json',
      testsRun:
        'TypeScript + Jest + hygiene gate on every PR (CI green required to merge)',
      lastValidated: '2026-04-26 (last main build)',
    },
    liveStatusCaveat:
      'This page is manifest-backed. It reflects what the production-readiness manifest claims. It is not connected to a live monitoring feed; do not interpret status here as real-time production health.',
    nextFiveActions: [
      {
        actionId: 'next-001',
        label: 'Stand up Azure private data plane reference deployment',
        owner: 'Steward + Atlas',
      },
      {
        actionId: 'next-002',
        label: 'Wire live vendor response ingestion (Source)',
        owner: 'Nexus + Steward',
      },
      {
        actionId: 'next-003',
        label: 'Define and migrate to centralised model gateway',
        owner: 'Atlas',
      },
      {
        actionId: 'next-004',
        label: 'Stand up tool registry boundary',
        owner: 'Atlas',
      },
      {
        actionId: 'next-005',
        label: 'Run multi-tenant security review and document mitigations',
        owner: 'Steward',
      },
    ],
  };
}

// ---------------------------------------------------------------------
// Visual tokens (canon-aligned)
// ---------------------------------------------------------------------

const ANSWER_CHIP_STYLES: Record<
  DecisionAnswer,
  { bg: string; fg: string; label: string }
> = {
  yes: { bg: '#E6ECF8', fg: '#1B2B5C', label: 'YES' },
  partial: { bg: '#F5F3EE', fg: '#525866', label: 'PARTIAL' },
  no: { bg: '#F8E6E6', fg: '#7A2E2E', label: 'NO' },
};

const pageStyle: CSSProperties = {
  background: COLORS.surface,
  color: COLORS.ink,
  fontFamily: FONT.body,
  padding: `${SPACING.xxxl}px ${SPACING.xxl}px`,
};

const shellStyle: CSSProperties = {
  maxWidth: 1080,
  margin: '0 auto',
  display: 'grid',
  gap: 32,
};

const sectionStyle: CSSProperties = {
  background: COLORS.card,
  border: BORDER.hairline,
  borderRadius: RADIUS.md,
  padding: `${SPACING.xxl}px ${SPACING.xxl}px`,
  display: 'grid',
  gap: SPACING.lg,
};

const sectionEyebrowStyle: CSSProperties = {
  ...TYPE.eyebrow,
  color: COLORS.muted,
};

const sectionHeadlineStyle: CSSProperties = {
  ...TYPE.h2,
  margin: 0,
};

const bodyStyle: CSSProperties = {
  ...TYPE.body,
  margin: 0,
};

const captionStyle: CSSProperties = {
  ...TYPE.caption,
  margin: 0,
};

const bulletListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: SPACING.xl,
  display: 'grid',
  gap: SPACING.xs,
  ...TYPE.body,
};

// ---------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------

function SectionEyebrow({ index, label }: { index: number; label: string }) {
  return (
    <div style={sectionEyebrowStyle}>
      {String(index).padStart(2, '0')} · {label}
    </div>
  );
}

function AnswerChip({ answer }: { answer: DecisionAnswer }) {
  const tokens = ANSWER_CHIP_STYLES[answer];
  const chipStyle: CSSProperties = {
    display: 'inline-block',
    padding: `${SPACING.xs}px ${SPACING.md}px`,
    background: tokens.bg,
    color: tokens.fg,
    fontFamily: FONT.mono,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.12em',
    borderRadius: RADIUS.pill,
  };
  return <span style={chipStyle}>{tokens.label}</span>;
}

function DecisionQuestionSection({
  index,
  eyebrow,
  question,
  answer,
  rationale,
  blockers,
}: {
  index: number;
  eyebrow: string;
  question: string;
  answer: DecisionAnswer;
  rationale: string;
  blockers: string[];
}) {
  return (
    <section style={sectionStyle}>
      <SectionEyebrow index={index} label={eyebrow} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <h2 style={sectionHeadlineStyle}>{question}</h2>
        <AnswerChip answer={answer} />
      </div>
      <p style={bodyStyle}>{rationale}</p>
      {blockers.length > 0 ? (
        <div style={{ display: 'grid', gap: SPACING.sm }}>
          <div style={sectionEyebrowStyle}>Blockers</div>
          <ul style={bulletListStyle}>
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------

export function ProductionReadinessDecisionFlow({
  showLiveCaveat = true,
}: ProductionReadinessDecisionFlowProps = {}) {
  const view = buildDecisionFlowView();

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        {/* 1. Overall readiness brief */}
        <section style={sectionStyle}>
          <SectionEyebrow index={1} label="Overall readiness brief" />
          <h1 style={{ ...TYPE.h1, margin: 0 }}>{view.overallBrief.headline}</h1>
          <p style={captionStyle}>
            As of {view.overallBrief.asOf} · {view.overallBrief.sourceClaim}
          </p>
        </section>

        {/* 2. Can we demo? */}
        <DecisionQuestionSection
          index={2}
          eyebrow="Demo readiness"
          question="Can we demo?"
          answer={view.canWeDemo.answer}
          rationale={view.canWeDemo.rationale}
          blockers={view.canWeDemo.blockers}
        />

        {/* 3. Can we pilot? */}
        <DecisionQuestionSection
          index={3}
          eyebrow="Pilot readiness"
          question="Can we pilot?"
          answer={view.canWePilot.answer}
          rationale={view.canWePilot.rationale}
          blockers={view.canWePilot.blockers}
        />

        {/* 4. What blocks production? */}
        <section style={sectionStyle}>
          <SectionEyebrow index={4} label="Production blockers" />
          <h2 style={sectionHeadlineStyle}>What blocks production?</h2>
          <ul style={bulletListStyle}>
            {view.whatBlocksProduction.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {/* 5. Component readiness pointer (real tracker renders below this surface) */}
        <section style={sectionStyle}>
          <SectionEyebrow index={5} label="Component readiness" />
          <h2 style={sectionHeadlineStyle}>Component readiness</h2>
          <p style={bodyStyle}>
            Component readiness panel below — see the existing tracker and live
            panel for per-component dimensions, gates, and segment summaries.
          </p>
        </section>

        {/* 6. Evidence / testing basis */}
        <section style={sectionStyle}>
          <SectionEyebrow index={6} label="Evidence basis" />
          <h2 style={sectionHeadlineStyle}>Evidence and testing basis</h2>
          <div style={{ display: 'grid', gap: SPACING.md }}>
            <div>
              <div style={sectionEyebrowStyle}>Manifest source</div>
              <p style={bodyStyle}>{view.evidenceBasis.manifestSource}</p>
            </div>
            <div>
              <div style={sectionEyebrowStyle}>Tests run</div>
              <p style={bodyStyle}>{view.evidenceBasis.testsRun}</p>
            </div>
            <div>
              <div style={sectionEyebrowStyle}>Last validated</div>
              <p style={bodyStyle}>{view.evidenceBasis.lastValidated}</p>
            </div>
          </div>
        </section>

        {/* 7. Live status caveat */}
        {showLiveCaveat ? (
          <section
            style={{
              ...sectionStyle,
              background: COLORS.surface2,
              borderColor: COLORS.borderSoft,
            }}
          >
            <SectionEyebrow index={7} label="Live status caveat" />
            <p style={{ ...TYPE.body, color: COLORS.muted, margin: 0 }}>
              {view.liveStatusCaveat}
            </p>
          </section>
        ) : null}

        {/* 8. Next five actions */}
        <section style={sectionStyle}>
          <SectionEyebrow index={8} label="Next five actions" />
          <h2 style={sectionHeadlineStyle}>Next five actions</h2>
          <ol
            style={{
              margin: 0,
              paddingLeft: SPACING.xl,
              display: 'grid',
              gap: SPACING.md,
              ...TYPE.body,
            }}
          >
            {view.nextFiveActions.map((action) => (
              <li key={action.actionId}>
                <div style={{ fontWeight: 500, color: COLORS.ink }}>
                  {action.label}
                </div>
                <div style={{ ...TYPE.caption, marginTop: 2 }}>
                  Owner: {action.owner} · {action.actionId}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

export default ProductionReadinessDecisionFlow;

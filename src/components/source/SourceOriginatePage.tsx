'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';

type IntakeFieldId = 'trigger' | 'decisionOwner' | 'scopeBoundary' | 'valueTarget' | 'baselineOwner';

interface IntakeFieldDefinition {
  id: IntakeFieldId;
  label: string;
  prompt: string;
  placeholder: string;
  agent: 'Nexus' | 'Steward' | 'Sentinel' | 'Atlas';
}

type IntakeState = Record<IntakeFieldId, string>;

const INTAKE_FIELDS: IntakeFieldDefinition[] = [
  {
    id: 'trigger',
    label: 'Why now / trigger',
    prompt: 'What event makes this sourcing work necessary now?',
    placeholder: 'Renewal date, spend pressure, service issue, merger, cloud-cost spike...',
    agent: 'Nexus',
  },
  {
    id: 'decisionOwner',
    label: 'Decision owner',
    prompt: 'Who can make or sponsor the technology sourcing decision?',
    placeholder: 'CIO, CTO, VP Infrastructure, app owner, procurement sponsor...',
    agent: 'Steward',
  },
  {
    id: 'scopeBoundary',
    label: 'Scope boundary',
    prompt: 'Which IT services, platforms, software, cloud, data, or delivery towers are in and out?',
    placeholder: 'In: AMS for SAP and eCommerce. Out: security operations and deskside support.',
    agent: 'Nexus',
  },
  {
    id: 'valueTarget',
    label: 'Value or savings target',
    prompt: 'What commercial outcome justifies standing up the event?',
    placeholder: '$4M run-rate savings, 15% unit-cost reduction, risk reduction, SLA uplift...',
    agent: 'Atlas',
  },
  {
    id: 'baselineOwner',
    label: 'Minimum data / baseline owner',
    prompt: 'Who owns the minimum baseline Source can use without pretending evidence is ready?',
    placeholder: 'Finance owns spend baseline; ServiceNow owner owns ticket volume extract by May 8.',
    agent: 'Sentinel',
  },
];

const IN_SCOPE_EXAMPLES = [
  'Application managed services',
  'Infrastructure or cloud operations',
  'Data, analytics, AI, or platform services',
  'Systems integration or implementation partners',
  'Cybersecurity and enterprise software selection',
];

const OUT_OF_SCOPE_EXAMPLES = [
  'Facilities, travel, office supplies, logistics',
  'Marketing agencies, benefits, legal services',
  'Non-technology contingent labor',
  'Manufacturing inputs or commodity procurement',
];

const APEX_CONTEXT_FACTS = [
  ['Segment rollups', '14'],
  ['Data records', '403'],
  ['Graph nodes / edges', '257 / 275'],
  ['Context chunks', '415, embedding_status=pending'],
  ['Known context', 'Org structure, IT landscape, KPI dictionary, programs, evidence ledger, vendor contracts, cross-program signals'],
];

const AGENT_GUIDANCE = [
  {
    agent: 'Nexus',
    label: 'Sourcing lead',
    body: 'Use Apex tenant context to frame the event, then ask only for the trigger, owner, boundary, value basis, and baseline owner.',
  },
  {
    agent: 'Steward',
    label: 'Intake floor',
    body: 'Do not stand up the event until trigger, owner, scope, value basis, and baseline owner are named.',
  },
  {
    agent: 'Sentinel',
    label: 'Evidence caution',
    body: 'Loaded or promised data is not usable evidence yet; name the baseline owner and confidence limits.',
  },
  {
    agent: 'Atlas',
    label: 'Value implication',
    body: 'A thin value baseline weakens savings confidence and lowers executive readiness until owned.',
  },
];

const initialIntakeState: IntakeState = {
  trigger: '',
  decisionOwner: '',
  scopeBoundary: '',
  valueTarget: '',
  baselineOwner: '',
};

const pageWrap: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  background: SHELL.PAPER,
  padding: '34px 44px 48px',
};

const sectionCard: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 14,
  boxShadow: '0 20px 60px rgba(12, 26, 58, 0.06)',
};

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: SHELL.INK_MUTED,
      }}
    >
      {children}
    </div>
  );
}

function IntakeTextarea({
  field,
  value,
  onChange,
}: {
  field: IntakeFieldDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  const complete = value.trim().length > 0;

  return (
    <label
      style={{
        display: 'grid',
        gap: 8,
        borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        padding: '18px 0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: SHELL.SERIF, fontSize: 20, color: SHELL.INK, marginBottom: 4 }}>
            {field.label}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, lineHeight: 1.45 }}>
            {field.prompt}
          </div>
        </div>
        <span
          style={{
            flex: '0 0 auto',
            fontFamily: SHELL.MONO,
            fontSize: 10,
            borderRadius: 999,
            padding: '5px 9px',
            background: complete ? SHELL.MINT_BG : SHELL.PEACH_BG,
            color: complete ? SHELL.MINT_TEXT : SHELL.PEACH_TEXT,
          }}
        >
          {complete ? 'Captured' : `${field.agent} needs this`}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        rows={3}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          border: `1px solid ${complete ? SHELL.CARD_LINE : SHELL.PEACH_LINE}`,
          borderRadius: 10,
          background: SHELL.PAPER,
          color: SHELL.INK,
          fontFamily: SHELL.SANS,
          fontSize: 14,
          lineHeight: 1.45,
          padding: '12px 14px',
          resize: 'vertical',
          outline: 'none',
        }}
      />
    </label>
  );
}

function GuidanceCard({ agent, label, body }: { agent: string; label: string; body: string }) {
  return (
    <div
      style={{
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 12,
        background: SHELL.PAPER,
        padding: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK, letterSpacing: '0.08em' }}>
          {agent}
        </span>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>{label}</span>
      </div>
      <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.5, color: SHELL.INK_SOFT }}>{body}</div>
    </div>
  );
}

function ScopeBoundaryList({ title, rows, tone }: { title: string; rows: string[]; tone: 'in' | 'out' }) {
  return (
    <div style={{ flex: 1, minWidth: 220 }}>
      <Eyebrow>{title}</Eyebrow>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {rows.map((row) => (
          <div
            key={row}
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_SOFT,
              border: `1px solid ${tone === 'in' ? SHELL.MINT_LINE : SHELL.CARD_LINE}`,
              background: tone === 'in' ? SHELL.MINT_BG : SHELL.PAPER_SOFT,
              borderRadius: 999,
              padding: '7px 10px',
            }}
          >
            {row}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SourceOriginatePage() {
  const [intake, setIntake] = useState<IntakeState>(initialIntakeState);
  const [reviewed, setReviewed] = useState(false);

  const completedCount = useMemo(
    () => INTAKE_FIELDS.filter((field) => intake[field.id].trim().length > 0).length,
    [intake]
  );
  const intakeReady = completedCount === INTAKE_FIELDS.length;

  function patchIntake(fieldId: IntakeFieldId, value: string) {
    setReviewed(false);
    setIntake((current) => ({ ...current, [fieldId]: value }));
  }

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Source · New IT sourcing intake',
      }}
    >
      <style>{`
        .source-new-intake-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 24px;
          max-width: 1240px;
          margin: 0 auto;
        }

        .source-new-intake-rail {
          display: grid;
          gap: 16px;
          align-self: start;
          position: sticky;
          top: 24px;
        }

        @media (max-width: 920px) {
          .source-new-intake-grid {
            grid-template-columns: 1fr;
          }

          .source-new-intake-rail {
            position: static;
          }
        }

        @media (max-width: 640px) {
          .source-new-intake-page {
            padding: 24px 18px 36px !important;
          }
        }
      `}</style>
      <div className="source-new-intake-page" style={pageWrap}>
        <div className="source-new-intake-grid">
          <main style={{ display: 'grid', gap: 18 }}>
            <section style={{ ...sectionCard, padding: 26 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start' }}>
                <div>
                  <Eyebrow>Source intake · Technology and IT sourcing only</Eyebrow>
                  <h1
                    style={{
                      fontFamily: SHELL.SERIF_DISPLAY,
                      fontSize: 36,
                      fontWeight: 400,
                      color: SHELL.INK,
                      margin: '10px 0 10px',
                      lineHeight: 1.04,
                      maxWidth: 760,
                    }}
                  >
                    Stand up a decision-grade technology sourcing event.
                  </h1>
                  <p style={{ fontFamily: SHELL.SANS, fontSize: 14, color: SHELL.INK_SOFT, lineHeight: 1.55, maxWidth: 760, margin: 0 }}>
                    Source already has rich Apex tenant context. This intake asks only for the event-specific facts needed to stand up an IT sourcing event; it does not create a persisted event yet.
                  </p>
                </div>
                <div
                  style={{
                    flex: '0 0 auto',
                    borderRadius: 12,
                    border: `1px solid ${intakeReady ? SHELL.MINT_LINE : SHELL.PEACH_LINE}`,
                    background: intakeReady ? SHELL.MINT_BG : SHELL.PEACH_BG,
                    padding: '12px 14px',
                    minWidth: 146,
                  }}
                >
                  <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: intakeReady ? SHELL.MINT_TEXT : SHELL.PEACH_TEXT, letterSpacing: '0.1em' }}>
                    INTAKE FLOOR
                  </div>
                  <div style={{ fontFamily: SHELL.SERIF, fontSize: 28, color: SHELL.INK, marginTop: 4 }}>
                    {completedCount}/{INTAKE_FIELDS.length}
                  </div>
                  <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT }}>
                    {intakeReady ? 'Ready for workflow handoff' : 'Draft facts missing'}
                  </div>
                </div>
              </div>
            </section>

            <section style={{ ...sectionCard, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 14 }}>
                <div>
                  <Eyebrow>What Source already knows for Apex</Eyebrow>
                  <div style={{ fontFamily: SHELL.SERIF, fontSize: 24, color: SHELL.INK, marginTop: 8 }}>
                    Do not start from a blank form.
                  </div>
                </div>
                <div
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${SHELL.PEACH_LINE}`,
                    background: SHELL.PEACH_BG,
                    color: SHELL.PEACH_TEXT,
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    padding: '8px 11px',
                    alignSelf: 'flex-start',
                  }}
                >
                  Embeddings pending; no vector retrieval assumed
                </div>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {APEX_CONTEXT_FACTS.map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '160px minmax(0, 1fr)',
                      gap: 12,
                      borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                      paddingTop: 9,
                      fontFamily: SHELL.SANS,
                      fontSize: 13,
                      color: SHELL.INK_SOFT,
                      lineHeight: 1.45,
                    }}
                  >
                    <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>
                      {label}
                    </span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...sectionCard, padding: '8px 26px 4px' }} aria-label="Required intake facts">
              {INTAKE_FIELDS.map((field) => (
                <IntakeTextarea
                  key={field.id}
                  field={field}
                  value={intake[field.id]}
                  onChange={(value) => patchIntake(field.id, value)}
                />
              ))}
            </section>

            <section style={{ ...sectionCard, padding: 22 }}>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <ScopeBoundaryList title="Technology sourcing in scope" rows={IN_SCOPE_EXAMPLES} tone="in" />
                <ScopeBoundaryList title="Route elsewhere" rows={OUT_OF_SCOPE_EXAMPLES} tone="out" />
              </div>
            </section>
          </main>

          <aside className="source-new-intake-rail">
            <section style={{ ...sectionCard, padding: 18 }}>
              <Eyebrow>Nexus guidance</Eyebrow>
              <div style={{ fontFamily: SHELL.SERIF, fontSize: 22, color: SHELL.INK, margin: '10px 0 8px' }}>
                Start from Apex context, then fill the floor.
              </div>
              <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, lineHeight: 1.5, margin: 0 }}>
                Source can see Apex org structure, IT landscape, programs, evidence, contracts, and cross-program signals. Nexus still needs these five event-specific facts before moving to Strategy or Scope.
              </p>
              <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
                {['Check IT category fit', 'Name missing intake fact', 'Prepare minimum data request'].map((choice) => (
                  <div
                    key={choice}
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      color: SHELL.INK_SOFT,
                      background: SHELL.PAPER_SOFT,
                      borderRadius: 999,
                      padding: '8px 10px',
                    }}
                  >
                    {choice}
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...sectionCard, padding: 18 }}>
              <Eyebrow>Gate, evidence, value</Eyebrow>
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                {AGENT_GUIDANCE.map((item) => (
                  <GuidanceCard key={item.agent} {...item} />
                ))}
              </div>
            </section>

            <section style={{ ...sectionCard, padding: 18 }}>
              <Eyebrow>Draft behavior</Eyebrow>
              <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, lineHeight: 1.5, margin: '10px 0 14px' }}>
                No create mutation is wired on this route. The button below only reviews the draft in this browser session; it does not write to Source, generate an event ID, upload files, or notify a workflow engine.
              </p>
              <button
                type="button"
                onClick={() => setReviewed(true)}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: 10,
                  background: intakeReady ? SHELL.INK : SHELL.GRAY_BG,
                  color: intakeReady ? SHELL.PAPER : SHELL.GRAY_TEXT,
                  cursor: 'pointer',
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  padding: '12px 14px',
                }}
              >
                Review intake draft
              </button>
              {reviewed && (
                <div
                  style={{
                    marginTop: 12,
                    borderRadius: 10,
                    border: `1px solid ${intakeReady ? SHELL.MINT_LINE : SHELL.PEACH_LINE}`,
                    background: intakeReady ? SHELL.MINT_BG : SHELL.PEACH_BG,
                    padding: 12,
                    fontFamily: SHELL.SANS,
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: intakeReady ? SHELL.MINT_TEXT : SHELL.PEACH_TEXT,
                  }}
                >
                  {intakeReady
                    ? 'Draft floor is complete. A future create flow can safely hand this to Strategy or Scope.'
                    : 'Draft only: Steward would block event creation until all five intake facts are named.'}
                </div>
              )}
              <a
                href="/source"
                style={{
                  display: 'inline-block',
                  marginTop: 14,
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  color: SHELL.INK_SOFT,
                  textDecoration: 'none',
                }}
              >
                Return to Source portfolio
              </a>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

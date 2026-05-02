'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';

type IntakeFieldId = 'trigger' | 'decisionOwner' | 'scopeBoundary' | 'valueTarget' | 'baselineOwner';
type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; eventId: string; eventUrl: string; approvalAuthority: string }
  | { status: 'error'; message: string };

interface IntakeFieldDefinition {
  id: IntakeFieldId;
  label: string;
  prompt: string;
  placeholder: string;
  agent: 'Nexus' | 'Steward' | 'Sentinel' | 'Atlas';
}

type IntakeState = Record<IntakeFieldId, string>;

interface SourceOriginatePageProps {
  clientName?: string;
  clientShortName?: string;
  clientKey?: string;
}

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

const CLIENT_CONTEXT_FACTS: Record<string, string[][]> = {
  apexretail: APEX_CONTEXT_FACTS,
  meridian: [
    ['Segment rollups', '14'],
    ['Data records', '698'],
    ['Graph nodes / edges', '423 / 584'],
    ['Context chunks', '715, private index loaded'],
    ['Known context', 'Clinical operations, IT estate, vendor contracts, programs, evidence ledger, risk and value signals'],
  ],
  arcturus: [
    ['Segment rollups', '14'],
    ['Data records', 'First Capital seed pack pending app proof'],
    ['Graph nodes / edges', 'Private-plane validation pending'],
    ['Context chunks', 'Use available client context; do not assume full retrieval'],
    ['Known context', 'Financial-services operating model, programs, vendor/risk context when available'],
  ],
};

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

function inferEventType(scopeBoundary: string): 'managed_service' | 'software' | 'staffing' | 'infrastructure' | 'consulting' | 'other' {
  const normalized = scopeBoundary.toLowerCase();
  if (/\bams\b|managed service|managed services|outsourcing|run operation|application support/.test(normalized)) {
    return 'managed_service';
  }
  if (/cloud|infrastructure|hosting|network|platform operations/.test(normalized)) return 'infrastructure';
  if (/software|saas|license|enterprise application/.test(normalized)) return 'software';
  if (/systems integrator|implementation|consulting|si partner/.test(normalized)) return 'consulting';
  if (/staff augmentation|staffing|contractor|contingent/.test(normalized)) return 'staffing';
  return 'other';
}

function extractEstimatedValue(valueTarget: string): number | undefined {
  const normalized = valueTarget.toLowerCase().replace(/,/g, '');
  const match = normalized.match(/\$?\s*(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?/);
  if (!match) return undefined;
  const raw = Number(match[1]);
  if (!Number.isFinite(raw)) return undefined;
  const suffix = match[2];
  if (suffix === 'm' || suffix === 'million') return Math.round(raw * 1_000_000);
  if (suffix === 'k' || suffix === 'thousand') return Math.round(raw * 1_000);
  return Math.round(raw);
}

function buildEventName(clientShortName: string, intake: IntakeState): string {
  const scope = intake.scopeBoundary.trim();
  if (/\bams\b|managed service|outsourcing/i.test(scope)) {
    return `${clientShortName} AMS Sourcing Event`;
  }
  if (/prior.?authorization|prior auth/i.test(scope)) {
    return `${clientShortName} Prior Authorization Automation Sourcing`;
  }
  if (/fraud/i.test(scope)) {
    return `${clientShortName} Fraud Detection AI Sourcing`;
  }
  const firstClause = scope.split(/[.;\n]/)[0]?.trim();
  return `${clientShortName} ${firstClause || 'Technology'} Sourcing Event`.slice(0, 120);
}

export function SourceOriginatePage({
  clientName = 'Apex Retail Group',
  clientShortName = 'Apex Retail',
  clientKey = 'apexretail',
}: SourceOriginatePageProps) {
  const [intake, setIntake] = useState<IntakeState>(initialIntakeState);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });

  const completedCount = useMemo(
    () => INTAKE_FIELDS.filter((field) => intake[field.id].trim().length > 0).length,
    [intake]
  );
  const intakeReady = completedCount === INTAKE_FIELDS.length;
  const clientFacts = CLIENT_CONTEXT_FACTS[clientKey] ?? [
    ['Known context', 'Client-scoped Source context available when loaded'],
    ['Evidence posture', 'Do not assume retrieval until the event cites records'],
  ];

  function patchIntake(fieldId: IntakeFieldId, value: string) {
    setSubmitState({ status: 'idle' });
    setIntake((current) => ({ ...current, [fieldId]: value }));
  }

  async function createEvent() {
    if (!intakeReady || submitState.status === 'submitting') return;
    setSubmitState({ status: 'submitting' });

    const eventName = buildEventName(clientShortName, intake);
    const response = await fetch('/api/v1/source/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventType: inferEventType(intake.scopeBoundary),
        triggerDescription: intake.trigger,
        decisionOwner: intake.decisionOwner,
        scopeDescription: [
          `Scope boundary: ${intake.scopeBoundary}`,
          `Value basis: ${intake.valueTarget}`,
          `Baseline owner: ${intake.baselineOwner}`,
        ].join('\n'),
        estimatedValueUsd: extractEstimatedValue(intake.valueTarget),
      }),
    });

    const payload = await response.json().catch(() => null) as null | {
      event?: { id?: string };
      eventUrl?: string;
      approvalAuthority?: string;
      detail?: string;
      error?: string;
    };

    if (!response.ok || !payload?.event?.id) {
      setSubmitState({
        status: 'error',
        message: payload?.detail ?? payload?.error ?? 'Source event creation failed.',
      });
      return;
    }

    setSubmitState({
      status: 'success',
      eventId: payload.event.id,
      eventUrl: payload.eventUrl ?? `/source/events/${payload.event.id}`,
      approvalAuthority: payload.approvalAuthority ?? 'Tenant admin approval required before Source motion begins.',
    });
  }

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: clientName,
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
                    Source uses {clientShortName} context where available, then asks only for the event-specific facts needed to stand up an IT sourcing event and submit it for admin approval.
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
                  <Eyebrow>What Source already knows for {clientShortName}</Eyebrow>
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
                {clientFacts.map(([label, value]) => (
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
                Start from {clientShortName} context, then fill the floor.
              </div>
              <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, lineHeight: 1.5, margin: 0 }}>
                Source can use {clientShortName} org, IT, program, evidence, vendor, and risk context when it is loaded. Nexus still needs these five event-specific facts before moving to Strategy or Scope.
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
              <Eyebrow>Create and approval</Eyebrow>
              <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, lineHeight: 1.5, margin: '10px 0 14px' }}>
                When all five facts are captured, Nexus creates a persisted Source event and routes it to tenant-admin approval before sourcing motion begins.
              </p>
              <button
                type="button"
                onClick={createEvent}
                disabled={!intakeReady || submitState.status === 'submitting'}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: 10,
                  background: intakeReady ? SHELL.INK : SHELL.GRAY_BG,
                  color: intakeReady ? SHELL.PAPER : SHELL.GRAY_TEXT,
                  cursor: intakeReady ? 'pointer' : 'not-allowed',
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  padding: '12px 14px',
                }}
              >
                {submitState.status === 'submitting' ? 'Creating event...' : 'Create sourcing event'}
              </button>
              {submitState.status === 'success' && (
                <div
                  style={{
                    marginTop: 12,
                    borderRadius: 10,
                    border: `1px solid ${SHELL.MINT_LINE}`,
                    background: SHELL.MINT_BG,
                    padding: 12,
                    fontFamily: SHELL.SANS,
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: SHELL.MINT_TEXT,
                  }}
                >
                  Event created and waiting on admin approval. {submitState.approvalAuthority}
                  <a
                    href={submitState.eventUrl}
                    style={{
                      display: 'block',
                      marginTop: 10,
                      color: SHELL.MINT_TEXT,
                      fontFamily: SHELL.MONO,
                      textDecoration: 'underline',
                    }}
                  >
                    Open created event
                  </a>
                </div>
              )}
              {submitState.status === 'error' && (
                <div
                  role="alert"
                  style={{
                    marginTop: 12,
                    borderRadius: 10,
                    border: `1px solid ${SHELL.PEACH_LINE}`,
                    background: SHELL.PEACH_BG,
                    padding: 12,
                    fontFamily: SHELL.SANS,
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: SHELL.PEACH_TEXT,
                  }}
                >
                  {submitState.message}
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

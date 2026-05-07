'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { useAtlasPageState } from '@/components/shell/AtlasPageStateProvider';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SourcingReactivePanel } from '@/components/source/SourcingReactivePanel';
import { SourceLinkedProgramChip } from '@/components/source/LinkedProgramChip';
import { SourceStageCanvasPanel } from '@/components/source/SourceStageCanvasPanel';
import type { Artifact } from '@/lib/agent/artifacts';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceStageKey, SourcingEventDetail } from '@/lib/source/types';
import type { GateEvaluation } from '@/lib/reasoning/types';
import { getStageCanvasConfig } from '@/lib/source/stage-canvas-config';
import {
  RESTRICTED_SOURCE_FINANCIAL_DETAIL,
  formatSourceFinancialValue,
  redactSourceFinancialText,
} from '@/lib/source/financial-display';

interface SourceEventAgentCanvasProps {
  event: SourcingEventDetail;
  middleStrip: ReactNode;
  quote: string;
  children?: ReactNode;
  canViewFinancialValues?: boolean;
  /** The stage selected in the URL (?stage=X). When set, right panel renders the Universal Canvas for that stage. */
  viewStage?: SourceStageKey | null;
  /** Live gate evaluations for current→next gate (passed from server). Used by SourceStageCanvasPanel. */
  nextGateEvaluations?: GateEvaluation[];
}

const SENTINEL_EVENT_AGENT = {
  initials: 'Se',
  name: 'Sentinel',
  role: 'Source Orchestrator',
} as const;

export function SourceEventAgentCanvas({
  event,
  middleStrip,
  quote,
  children,
  canViewFinancialValues = true,
  viewStage = null,
  nextGateEvaluations = [],
}: SourceEventAgentCanvasProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const safeQuote = redactSourceFinancialText(quote, canViewFinancialValues);
  const safeNextDecision = redactSourceFinancialText(event.nextDecision, canViewFinancialValues);
  const safeNextAction = redactSourceFinancialText(event.nextAction, canViewFinancialValues);
  const safeBlocker = event.blocker
    ? redactSourceFinancialText(event.blocker, canViewFinancialValues)
    : null;

  const handleArtifact = useCallback((artifact: Artifact) => {
    setArtifacts((previous) => {
      const key = JSON.stringify(artifact);
      if (previous.some((item) => JSON.stringify(item) === key)) return previous;
      return [...previous, artifact];
    });

    if (
      artifact.type === 'sourcing-stage-changed'
      && artifact.eventId === event.id
      && typeof window !== 'undefined'
    ) {
      window.location.reload();
    }
  }, [event.id]);

  return (
    <AppShell
      surface="source"
      surfaceContext={{
        eventId: event.id,
        eventName: event.name,
        accountName: event.accountName,
        eventCode: event.code ?? '',
        eventType: event.archetype,
        currentStageKey: event.currentStageKey,
        currentStage: event.currentStageLabel ?? '',
        blocker: safeBlocker,
        valueAtStakeUsd: canViewFinancialValues ? event.valueAtStakeUsd ?? null : null,
        nextDecision: safeNextDecision,
        nextAction: safeNextAction,
        financialVisibility: canViewFinancialValues ? 'allowed' : 'restricted',
      }}
      topBarProps={{
        tenantName: event.accountName,
        showLocked: true,
        context: `Source - ${event.name} - ${event.currentStageLabel}`,
      }}
      middleStrip={middleStrip}
      onArtifact={handleArtifact}
    >
      <main
        data-testid="source-event-agent-canvas"
        aria-label="Sentinel source event canvas"
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '12px 16px 18px',
        }}
      >
        <section
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            alignItems: 'flex-start',
            maxWidth: 1440,
            margin: '0 auto',
          }}
        >
          <div
            data-testid="source-event-workbench"
            style={{
              flex: '1 1 100%',
              minHeight: 0,
              minWidth: 0,
            }}
          >
            <SourceWorkingPane padding="0">
              <div style={{ display: 'grid', gap: 12, paddingRight: 2 }}>
                <section aria-label="Agent-led Source event workspace" style={EVENT_AGENT_CANVAS}>
                  <div style={EVENT_CHAT_COLUMN}>
                    <AtlasDrawer
                      embedded
                      isOpen={true}
                      onClose={() => {
                        // Embedded Source event workspace stays visible; it is not a drawer overlay.
                      }}
                      agent={SENTINEL_EVENT_AGENT}
                      quote={safeQuote}
                      surface="/source"
                      onArtifact={handleArtifact}
                      composerPlacement="afterHeader"
                      sourceUploadContext={{
                        eventId: event.id,
                        stageKey: viewStage ?? event.currentStageKey,
                        stageLabel: event.currentStageLabel,
                      }}
                      emptyState={
                        <SourceEventPromptDeck
                          event={event}
                          viewStage={viewStage}
                        />
                      }
                    />
                  </div>
                  <aside aria-label="Live Source event reasoning pane" style={EVENT_REASONING_COLUMN}>
                    {viewStage ? (
                      <SourceStageCanvasPanel
                        stageKey={viewStage}
                        event={event}
                        nextGateEvaluations={nextGateEvaluations}
                      />
                    ) : (
                      <EventAgentLead
                        event={event}
                        quote={safeQuote}
                        canViewFinancialValues={canViewFinancialValues}
                      />
                    )}
                    <SourcingReactivePanel artifacts={artifacts} />
                  </aside>
                </section>
                <EventCanvasHeader
                  event={event}
                  canViewFinancialValues={canViewFinancialValues}
                />
                <section aria-label="Source event detailed workbench" style={DETAIL_WORKBENCH}>
                  {children}
                </section>
              </div>
            </SourceWorkingPane>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function EventAgentLead({
  event,
  quote,
  canViewFinancialValues,
}: {
  event: SourcingEventDetail;
  quote: string;
  canViewFinancialValues: boolean;
}) {
  const blockerCopy = event.blocker
    ? redactSourceFinancialText(event.blocker, canViewFinancialValues)
    : 'No hard blocker recorded yet. Steward still needs evidence before the gate can be treated as clear.';
  const stageLabel = event.currentStageLabel || 'Current stage';
  const nextAction = redactSourceFinancialText(event.nextAction, canViewFinancialValues);
  const nextDecision = redactSourceFinancialText(event.nextDecision, canViewFinancialValues);

  return (
    <section aria-label="Agent-led Source stage brief" style={EVENT_LEAD_CARD}>
      <div style={EVENT_LEAD_HEADER}>
        <div>
          <div style={META_LABEL}>Agent-led stage brief</div>
          <h2 style={EVENT_LEAD_TITLE}>Sentinel is running {stageLabel}</h2>
        </div>
        <div style={EVENT_LEAD_VALUE}>
          <div style={META_LABEL}>Value at stake</div>
          <div style={META_VALUE}>{formatSourceFinancialValue(event.valueAtStakeUsd, canViewFinancialValues)}</div>
          {!canViewFinancialValues && (
            <div style={{ ...EVENT_AGENT_COPY, margin: '3px 0 0', color: 'rgba(12,26,58,0.54)' }}>
              {RESTRICTED_SOURCE_FINANCIAL_DETAIL}
            </div>
          )}
        </div>
      </div>
      <p style={EVENT_LEAD_COPY}>{quote}</p>

      <div style={EVENT_AGENT_GRID} aria-label="Source agent responsibilities for this stage">
        <EventAgentCard
          agent="Sentinel"
          role="Workflow conductor"
          detail={`${nextAction} Then prepare the team for the next gate with inputs, session plan, and output packet.`}
        />
        <EventAgentCard
          agent="Steward"
          role={event.blocker ? 'Gate / approval blocked' : 'Gate / approval in review'}
          detail={`${blockerCopy} Waivers need explicit rationale; approvals are placeholders until the engine is wired.`}
        />
        <EventAgentCard
          agent="Sentinel"
          role="Evidence and files"
          detail="Paperclip uploads, pasted notes, and vendor files must become validated evidence before they support recommendations."
        />
        <EventAgentCard
          agent="Atlas"
          role="Artifacts and executive decision"
          detail={`Decision posture: ${stripTrailingPeriod(nextDecision)}. Generate the right HTML, Word, or Excel packet before review.`}
        />
      </div>

      <div style={EVENT_ACTION_GRID} aria-label="Agent suggested stage actions">
        <StageAction
          label="Define done"
          prompt={`Define done for ${event.name} at ${stageLabel}: evidence, owner, approval, blocker, and exit criteria.`}
          detail="Evidence, owner, approval, blocker, and exit criteria for this stage."
        />
        <StageAction
          label="Attach evidence"
          prompt={`Tell me the evidence needed for ${event.name} at ${stageLabel}, including file types, citation rules, and what remains metadata-only.`}
          detail="Inventory, contract, pricing, vendor response, meeting notes, or workshop output."
        />
        <StageAction
          label="Generate packet"
          prompt={`Prepare the packet outline for ${event.name} at ${stageLabel}: HTML brief, Word memo, Excel workbook, or meeting packet.`}
          detail="HTML/Word/Excel-ready artifact for the current stage and review audience."
        />
        <StageAction
          label="Prep next step"
          prompt={`Prepare the team for the next Source step after ${stageLabel}: agenda, inputs, roles, and expected outputs.`}
          detail="Team guidance: meeting agenda, required inputs, roles, and expected outputs."
        />
        <StageAction
          label="Run workshop"
          prompt={`Build a workshop kit for ${event.name}: agenda, roles, capture template, decisions needed, and post-session sync checklist.`}
          detail="Facilitation plan, prompts, capture template, and post-session validation."
        />
        <StageAction
          label="Open gate path"
          prompt={`Show the gate path for ${event.name}: who reviews, what can be waived, what cannot advance, and the next blocker.`}
          detail="Who reviews, what can be waived, and what cannot move forward."
        />
      </div>
    </section>
  );
}

function EventAgentCard({
  agent,
  role,
  detail,
}: {
  agent: string;
  role: string;
  detail: string;
}) {
  return (
    <div style={EVENT_AGENT_CARD}>
      <div style={EVENT_AGENT_NAME}>{agent}</div>
      <div style={EVENT_AGENT_ROLE}>{role}</div>
      <p style={EVENT_AGENT_COPY}>{detail}</p>
    </div>
  );
}

function StageAction({
  label,
  detail,
  prompt,
}: {
  label: string;
  detail: string;
  prompt: string;
}) {
  const pageState = useAtlasPageState();
  const disabled = !pageState || pageState.isStreaming;
  return (
    <button
      type="button"
      style={{
        ...EVENT_ACTION_BUTTON,
        opacity: disabled ? 0.62 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      disabled={disabled}
      onClick={() => pageState?.ask(prompt)}
      aria-label={`Ask Sentinel: ${label}`}
      data-testid={`source-stage-action-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <div style={EVENT_ACTION_PROMPT}>Ask Sentinel</div>
      <div style={EVENT_ACTION_LABEL}>{label}</div>
      <div style={EVENT_ACTION_DETAIL}>{detail}</div>
    </button>
  );
}

function SourceEventPromptDeck({
  event,
  viewStage,
}: {
  event: SourcingEventDetail;
  viewStage?: SourceStageKey | null;
}) {
  const pageState = useAtlasPageState();
  const disabled = !pageState || pageState.isStreaming;

  // Resolve the stage config for contextual 3-choices; fall back to current event stage
  const activeStageKey = viewStage ?? event.currentStageKey;
  const stageConfig = getStageCanvasConfig(activeStageKey);
  const stageLabel = event.currentStageLabel;

  // When we have a stage config, show exactly 3 contextual choices (design spec).
  // Otherwise fall back to the 6 generic prompts.
  const prompts = stageConfig
    ? stageConfig.choices.map((choice) => ({
        label: choice.label,
        description: choice.description,
        prompt: choice.prompt,
      }))
    : [
        {
          label: 'What good looks like',
          description: 'Define done criteria for this stage.',
          prompt: `Define done for ${stageLabel}: evidence, owner, approvals, and what blocks advance.`,
        },
        {
          label: 'Capture plan',
          description: 'List meetings, uploads, and templates needed.',
          prompt: 'Tell me which meetings, uploads, and templates are needed before this stage can clear.',
        },
        {
          label: 'Approval path',
          description: 'Who approves and what can be waived.',
          prompt: 'Who approves this gate, what packet do they review, and what waiver is allowed?',
        },
      ];

  const agentName = stageConfig?.leadAgent ?? 'Sentinel';

  return (
    <div style={{ width: '100%', display: 'grid', gap: 8 }}>
      <div
        style={{
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 12,
          background: SHELL.CARD_WHITE,
          padding: '10px 12px',
        }}
      >
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 8.5,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            fontWeight: 700,
          }}
        >
          {stageConfig ? `${agentName} · ${stageLabel}` : 'Contextual prompts'}
        </div>
        <p
          style={{
            margin: '6px 0 0',
            fontFamily: SHELL.SERIF,
            fontSize: 13.5,
            lineHeight: 1.32,
            color: SHELL.INK,
          }}
        >
          {stageConfig
            ? stageConfig.intent
            : 'Stage, blocker, next action, evidence, approval path, artifact packet.'}
        </p>
      </div>

      <div style={{ display: 'grid', gap: 7 }}>
        {prompts.map((item) => (
          <button
            type="button"
            key={item.label}
            disabled={disabled}
            onClick={() => pageState?.ask(item.prompt)}
            style={{
              appearance: 'none',
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              padding: '8px 10px',
              background: SHELL.PAPER_SOFT,
              font: 'inherit',
              textAlign: 'left',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.62 : 1,
            }}
            aria-label={`Ask ${agentName}: ${item.label}`}
          >
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 8,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: SHELL.INK_MUTED,
                fontWeight: 700,
              }}
            >
              {item.label}
            </div>
            {'description' in item && (
              <div
                style={{
                  marginTop: 2,
                  fontFamily: SHELL.SANS,
                  fontSize: 11,
                  lineHeight: 1.28,
                  color: SHELL.INK_MUTED,
                }}
              >
                {item.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function stripTrailingPeriod(text: string | null | undefined): string {
  return (text ?? '').trim().replace(/[.]+$/, '');
}

function EventCanvasHeader({
  event,
  canViewFinancialValues,
}: {
  event: SourcingEventDetail;
  canViewFinancialValues: boolean;
}) {
  const linkedProgramId = getLinkedProgramId(event);
  const clientContext = getClientContextSnapshot(event);
  const synopsis = redactSourceFinancialText(event.synopsis, canViewFinancialValues);
  const nextDecision = redactSourceFinancialText(event.nextDecision, canViewFinancialValues);

  return (
    <header
      style={{
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 16,
        background: SHELL.CARD_WHITE,
        padding: '14px 16px',
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={META_LABEL}>Source event canvas - IT sourcing workspace</div>
        {linkedProgramId ? (
          <SourceLinkedProgramChip linkedProgramId={linkedProgramId} linkType="depends-on" />
        ) : (
          <span style={STANDALONE_BADGE}>Standalone Source event</span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: SHELL.SERIF,
              fontSize: 24,
              lineHeight: 1.12,
              color: SHELL.INK,
              letterSpacing: '-0.02em',
            }}
          >
            {event.name}
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              fontFamily: SHELL.SANS,
              fontSize: 12.5,
              lineHeight: 1.42,
              color: SHELL.INK_MUTED,
            }}
          >
            {synopsis}
          </p>
        </div>
        <div
          style={{
            alignSelf: 'flex-start',
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 12,
            background: SHELL.PAPER_SOFT,
            padding: '9px 11px',
            minWidth: 180,
          }}
        >
          <div style={META_LABEL}>Current stage</div>
          <div style={META_VALUE}>{event.currentStageLabel}</div>
          <div style={{ ...META_LABEL, marginTop: 7 }}>Next decision</div>
          <div style={META_VALUE}>{nextDecision}</div>
        </div>
      </div>
      {clientContext ? <ClientContextSnapshot snapshot={clientContext} /> : null}
    </header>
  );
}

function ClientContextSnapshot({ snapshot }: { snapshot: ClientContextSnapshotData }) {
  return (
    <section style={CLIENT_CONTEXT_CARD} aria-label="Client context evidence snapshot">
      <div style={CLIENT_CONTEXT_HEADER}>
        <div>
          <div style={META_LABEL}>{snapshot.label}</div>
          <div style={CLIENT_CONTEXT_TITLE}>{snapshot.title}</div>
        </div>
        <span style={CLIENT_CONTEXT_BADGE}>{snapshot.embeddingStatus}</span>
      </div>
      <div style={CLIENT_CONTEXT_GRID}>
        {snapshot.metrics.map((metric) => (
          <div key={metric.label} style={CLIENT_CONTEXT_METRIC}>
            <div style={CLIENT_CONTEXT_METRIC_VALUE}>{metric.value}</div>
            <div style={CLIENT_CONTEXT_METRIC_LABEL}>{metric.label}</div>
          </div>
        ))}
      </div>
      <p style={CLIENT_CONTEXT_COPY}>{snapshot.detail}</p>
      <p style={CLIENT_CONTEXT_DISCLOSURE}>{snapshot.disclosure}</p>
    </section>
  );
}

function getLinkedProgramId(event: SourcingEventDetail): string | null {
  const linkedProgramMatch = `${event.problemStatement} ${event.synopsis}`.match(/\b[A-Z]{2,5}-[A-Z]{2,5}-\d{4}\b/);
  return linkedProgramMatch?.[0] ?? null;
}

interface ClientContextSnapshotData {
  label: string;
  title: string;
  embeddingStatus: string;
  metrics: Array<{ label: string; value: string }>;
  detail: string;
  disclosure: string;
}

function getClientContextSnapshot(event: SourcingEventDetail): ClientContextSnapshotData | null {
  if (!/apex/i.test(event.accountName)) return null;

  return {
    label: 'Client context',
    title: 'Apex setup evidence is loaded for Source',
    embeddingStatus: 'Embeddings pending',
    metrics: [
      { label: 'setup domains', value: '14' },
      { label: 'data records', value: '403' },
      { label: 'graph', value: '257 nodes / 275 edges' },
      { label: 'context chunks', value: '415 pending' },
    ],
    detail:
      'Source can reason from loaded client context such as IT landscape (96 rows), evidence ledger (20), vendor contracts (38), program inventory (4), and cross-program signals (12).',
    disclosure:
      'Seeded Source event plus Apex setup data snapshot. Context chunks have embedding_status=pending; this surface does not claim live vector retrieval.',
  };
}

const STANDALONE_BADGE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 999,
  background: SHELL.PAPER_SOFT,
  padding: '5px 10px',
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
};

const EVENT_AGENT_CANVAS: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.7fr) minmax(min(100%, 360px), 1fr)',
  gap: 14,
  alignItems: 'stretch',
  minHeight: 452,
};

const EVENT_CHAT_COLUMN: CSSProperties = {
  minWidth: 0,
  minHeight: 452,
  display: 'grid',
};

const EVENT_REASONING_COLUMN: CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  display: 'grid',
  alignContent: 'start',
  gap: 10,
};

const DETAIL_WORKBENCH: CSSProperties = {
  display: 'grid',
  gap: 12,
};

const EVENT_LEAD_CARD: CSSProperties = {
  border: '1px solid ' + SHELL.BLUE_LINE,
  borderRadius: 16,
  background: 'linear-gradient(135deg, ' + SHELL.CARD_WHITE + ' 0%, ' + SHELL.BLUE_BG + ' 100%)',
  padding: '14px 15px',
  display: 'grid',
  gap: 11,
  boxShadow: '0 16px 38px rgba(12, 26, 58, 0.06)',
};

const EVENT_LEAD_HEADER: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  flexWrap: 'wrap',
};

const EVENT_LEAD_TITLE: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: SHELL.SERIF,
  fontSize: 24,
  lineHeight: 1.08,
  color: SHELL.INK,
  letterSpacing: '-0.02em',
};

const EVENT_LEAD_VALUE: CSSProperties = {
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: 'rgba(253, 251, 246, 0.82)',
  padding: '8px 10px',
  minWidth: 150,
};

const EVENT_LEAD_COPY: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 12.8,
  lineHeight: 1.48,
  color: SHELL.INK_SOFT,
};

const EVENT_AGENT_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 155px), 1fr))',
  gap: 8,
};

const EVENT_AGENT_CARD: CSSProperties = {
  border: '1px solid rgba(12, 26, 58, 0.08)',
  borderRadius: 12,
  background: 'rgba(253, 251, 246, 0.78)',
  padding: '8px 9px',
};

const EVENT_AGENT_NAME: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 800,
};

const EVENT_AGENT_ROLE: CSSProperties = {
  marginTop: 3,
  fontFamily: SHELL.SANS,
  fontSize: 12.3,
  color: SHELL.INK,
  fontWeight: 800,
};

const EVENT_AGENT_COPY: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: SHELL.SANS,
  fontSize: 11.2,
  lineHeight: 1.34,
  color: SHELL.INK_MUTED,
};

const EVENT_ACTION_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))',
  gap: 8,
};

const EVENT_ACTION_CARD: CSSProperties = {
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.PAPER,
  padding: '8px 10px',
};

const EVENT_ACTION_BUTTON: CSSProperties = {
  ...EVENT_ACTION_CARD,
  appearance: 'none',
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  width: '100%',
};

const EVENT_ACTION_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12.3,
  color: SHELL.INK,
  fontWeight: 800,
};

const EVENT_ACTION_PROMPT: CSSProperties = {
  marginBottom: 4,
  fontFamily: SHELL.MONO,
  fontSize: 7.8,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: '#0F766E',
  fontWeight: 900,
};

const EVENT_ACTION_DETAIL: CSSProperties = {
  marginTop: 2,
  fontFamily: SHELL.SANS,
  fontSize: 11.2,
  lineHeight: 1.28,
  color: SHELL.INK_MUTED,
};

const CLIENT_CONTEXT_CARD: CSSProperties = {
  display: 'grid',
  gap: 9,
  border: '1px solid ' + SHELL.BLUE_LINE,
  borderRadius: 14,
  background: SHELL.BLUE_BG,
  padding: '11px 12px',
};

const CLIENT_CONTEXT_HEADER: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 10,
  flexWrap: 'wrap',
};

const CLIENT_CONTEXT_TITLE: CSSProperties = {
  marginTop: 2,
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.25,
  color: SHELL.INK,
  fontWeight: 800,
};

const CLIENT_CONTEXT_BADGE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: '1px solid ' + SHELL.PEACH_LINE,
  borderRadius: 999,
  background: SHELL.PEACH_BG,
  padding: '3px 8px',
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: SHELL.PEACH_TEXT,
  fontWeight: 700,
};

const CLIENT_CONTEXT_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
  gap: 7,
};

const CLIENT_CONTEXT_METRIC: CSSProperties = {
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.CARD_WHITE,
  padding: '7px 8px',
};

const CLIENT_CONTEXT_METRIC_VALUE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.1,
  color: SHELL.INK,
  fontWeight: 900,
};

const CLIENT_CONTEXT_METRIC_LABEL: CSSProperties = {
  marginTop: 3,
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  lineHeight: 1.2,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
};

const CLIENT_CONTEXT_COPY: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 11.8,
  lineHeight: 1.38,
  color: SHELL.INK_SOFT,
};

const CLIENT_CONTEXT_DISCLOSURE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.MONO,
  fontSize: 9,
  lineHeight: 1.45,
  letterSpacing: '0.04em',
  color: SHELL.INK_MUTED,
};

const META_LABEL = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.11em',
  textTransform: 'uppercase' as const,
  color: SHELL.INK_MUTED,
  fontWeight: 700,
};

const META_VALUE = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  color: SHELL.INK,
  fontWeight: 800,
};

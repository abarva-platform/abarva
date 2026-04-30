'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SourcingReactivePanel } from '@/components/source/SourcingReactivePanel';
import { SourceLinkedProgramChip } from '@/components/source/LinkedProgramChip';
import type { Artifact } from '@/lib/agent/artifacts';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourcingEventDetail } from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';

interface SourceEventAgentCanvasProps {
  event: SourcingEventDetail;
  middleStrip: ReactNode;
  quote: string;
  children: ReactNode;
}

const SENTINEL_AGENT = {
  initials: 'Sn',
  name: 'Sentinel',
  role: 'Sourcing Intelligence',
} as const;

export function SourceEventAgentCanvas({
  event,
  middleStrip,
  quote,
  children,
}: SourceEventAgentCanvasProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

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
        eventCode: event.code ?? '',
        eventType: event.archetype,
        currentStageKey: event.currentStageKey,
        currentStage: event.currentStageLabel ?? '',
        blocker: event.blocker ?? null,
        valueAtStakeUsd: event.valueAtStakeUsd ?? null,
        nextDecision: event.nextDecision,
        nextAction: event.nextAction,
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
                <EventCanvasHeader event={event} />
                <section aria-label="Agent-led Source event workspace" style={EVENT_AGENT_CANVAS}>
                  <div style={EVENT_CHAT_COLUMN}>
                    <AtlasDrawer
                      embedded
                      isOpen={true}
                      onClose={() => {
                        // Embedded Source event workspace stays visible; it is not a drawer overlay.
                      }}
                      agent={SENTINEL_AGENT}
                      quote={quote}
                      surface="/source"
                      onArtifact={handleArtifact}
                      emptyState={<SourceEventPromptDeck event={event} />}
                    />
                  </div>
                  <aside aria-label="Live Source event reasoning pane" style={EVENT_REASONING_COLUMN}>
                    <EventAgentLead event={event} quote={quote} />
                    <SourcingReactivePanel artifacts={artifacts} />
                  </aside>
                </section>
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
}: {
  event: SourcingEventDetail;
  quote: string;
}) {
  const blockerCopy = event.blocker ?? 'No hard blocker recorded yet. Steward still needs evidence before the gate can be treated as clear.';
  const stageLabel = event.currentStageLabel || 'Current stage';

  return (
    <section aria-label="Agent-led Source stage brief" style={EVENT_LEAD_CARD}>
      <div style={EVENT_LEAD_HEADER}>
        <div>
          <div style={META_LABEL}>Agent-led stage brief</div>
          <h2 style={EVENT_LEAD_TITLE}>Nexus is running {stageLabel}</h2>
        </div>
        <div style={EVENT_LEAD_VALUE}>
          <div style={META_LABEL}>Value at stake</div>
          <div style={META_VALUE}>{formatUsd(event.valueAtStakeUsd)}</div>
        </div>
      </div>
      <p style={EVENT_LEAD_COPY}>{quote}</p>

      <div style={EVENT_AGENT_GRID} aria-label="Source agent responsibilities for this stage">
        <EventAgentCard
          agent="Nexus"
          role="Workflow conductor"
          detail={`${event.nextAction} Then prepare the team for the next gate with inputs, session plan, and output packet.`}
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
          detail={`Decision posture: ${event.nextDecision}. Generate the right HTML, Word, or Excel packet before review.`}
        />
      </div>

      <div style={EVENT_ACTION_GRID} aria-label="Agent suggested stage actions">
        <StageAction label="Define done" detail="Evidence, owner, approval, blocker, and exit criteria for this stage." />
        <StageAction label="Attach evidence" detail="Inventory, contract, pricing, vendor response, meeting notes, or workshop output." />
        <StageAction label="Generate packet" detail="HTML/Word/Excel-ready artifact for the current stage and review audience." />
        <StageAction label="Prep next step" detail="Team guidance: meeting agenda, required inputs, roles, and expected outputs." />
        <StageAction label="Run workshop" detail="Facilitation plan, prompts, capture template, and post-session validation." />
        <StageAction label="Open gate path" detail="Who reviews, what can be waived, and what cannot move forward." />
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

function StageAction({ label, detail }: { label: string; detail: string }) {
  return (
    <div style={EVENT_ACTION_CARD}>
      <div style={EVENT_ACTION_LABEL}>{label}</div>
      <div style={EVENT_ACTION_DETAIL}>{detail}</div>
    </div>
  );
}

function SourceEventPromptDeck({ event }: { event: SourcingEventDetail }) {
  const prompts = [
    {
      label: 'What good looks like',
      prompt: `Define done for ${event.currentStageLabel}: evidence, owner, approvals, and what blocks advance.`,
    },
    {
      label: 'Capture plan',
      prompt: 'Tell me which meetings, uploads, and templates are needed before this stage can clear.',
    },
    {
      label: 'Approval path',
      prompt: 'Who approves this gate, what packet do they review, and what waiver is allowed?',
    },
    {
      label: 'Attach evidence',
      prompt: 'Upload the file or paste notes; I will separate cited evidence from unvalidated attachment context.',
    },
    {
      label: 'Generate packet',
      prompt: 'Tell me the audience and format: HTML brief, Word memo, Excel pricing workbook, or meeting packet.',
    },
    {
      label: 'Workshop mode',
      prompt: 'Prepare the agenda, roles, capture template, decisions needed, and post-workshop sync checklist.',
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        display: 'grid',
        gap: 8,
      }}
    >
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
          Contextual prompts
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
          Keep guidance short: stage, blocker, next action, exact evidence, approval path, artifact packet, and next
          meeting/workshop prep.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 7 }}>
        {prompts.map((item) => (
          <div
            key={item.label}
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              padding: '7px 10px',
              background: SHELL.PAPER_SOFT,
            }}
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
            <div
              style={{
                marginTop: 2,
                fontFamily: SHELL.SANS,
                fontSize: 11.8,
                lineHeight: 1.32,
                color: SHELL.INK_SOFT,
              }}
            >
              {item.prompt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventCanvasHeader({ event }: { event: SourcingEventDetail }) {
  const linkedProgramId = getLinkedProgramId(event);
  const clientContext = getClientContextSnapshot(event);

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
            {event.synopsis}
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
          <div style={META_VALUE}>{event.nextDecision}</div>
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
  minHeight: 524,
};

const EVENT_CHAT_COLUMN: CSSProperties = {
  minWidth: 0,
  minHeight: 524,
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

const EVENT_ACTION_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12.3,
  color: SHELL.INK,
  fontWeight: 800,
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

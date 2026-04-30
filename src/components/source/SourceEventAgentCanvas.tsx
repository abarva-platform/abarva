'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SourcingReactivePanel } from '@/components/source/SourcingReactivePanel';
import { SourceLinkedProgramChip } from '@/components/source/LinkedProgramChip';
import type { Artifact } from '@/lib/agent/artifacts';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourcingEventDetail } from '@/lib/source/types';

interface SourceEventAgentCanvasProps {
  event: SourcingEventDetail;
  middleStrip: ReactNode;
  quote: string;
  children: ReactNode;
}

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
              flex: '1 1 760px',
              minHeight: 0,
              minWidth: 0,
            }}
          >
            <SourceWorkingPane padding="0">
              <div style={{ display: 'grid', gap: 12, paddingRight: 2 }}>
                <EventCanvasHeader event={event} />
                {children}
              </div>
            </SourceWorkingPane>
          </div>

          <aside
            data-testid="source-event-agent-chat"
            aria-label="Compact Source agent rail"
            style={{
              flex: '0 1 320px',
              minWidth: 260,
              position: 'sticky',
              top: 12,
              display: 'grid',
              gap: 10,
            }}
          >
            <CompactAgentRail event={event} quote={quote} artifacts={artifacts} />
          </aside>
        </section>
      </main>
    </AppShell>
  );
}

function CompactAgentRail({
  event,
  quote,
  artifacts,
}: {
  event: SourcingEventDetail;
  quote: string;
  artifacts: Artifact[];
}) {
  return (
    <>
      <section style={RAIL_CARD}>
        <div style={RAIL_EYEBROW}>Agent rail</div>
        <div style={RAIL_TITLE}>Nexus, Sentinel, Steward, Atlas</div>
        <p style={RAIL_COPY}>{quote}</p>
        <div style={RAIL_SIGNAL_GRID}>
          <SignalPill label="Stage" value={event.currentStageLabel} />
          <SignalPill label="Gate" value={event.blocker ? 'Blocked' : 'In review'} />
          <SignalPill label="Next" value={event.nextAction} />
        </div>
      </section>
      <SourceEventPromptDeck event={event} />
      <SourcingReactivePanel artifacts={artifacts} />
    </>
  );
}

function SignalPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={SIGNAL_PILL}>
      <div style={SIGNAL_LABEL}>{label}</div>
      <div style={SIGNAL_VALUE}>{value}</div>
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
          Keep guidance short: stage, blocker, next action, and the exact evidence needed before movement.
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

const RAIL_CARD: CSSProperties = {
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 14,
  background: SHELL.CARD_WHITE,
  padding: '12px 13px',
  display: 'grid',
  gap: 9,
};

const RAIL_EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 700,
};

const RAIL_TITLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 14,
  lineHeight: 1.2,
  color: SHELL.INK,
  fontWeight: 800,
};

const RAIL_COPY: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.42,
  color: SHELL.INK_MUTED,
};

const RAIL_SIGNAL_GRID: CSSProperties = {
  display: 'grid',
  gap: 7,
};

const SIGNAL_PILL: CSSProperties = {
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.PAPER_SOFT,
  padding: '7px 9px',
};

const SIGNAL_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 700,
};

const SIGNAL_VALUE: CSSProperties = {
  marginTop: 2,
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  lineHeight: 1.3,
  color: SHELL.INK,
  fontWeight: 700,
};

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

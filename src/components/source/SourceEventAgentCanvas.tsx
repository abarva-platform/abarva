'use client';

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SourcingReactivePanel } from '@/components/source/SourcingReactivePanel';
import type { Artifact } from '@/lib/agent/artifacts';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourcingEventDetail } from '@/lib/source/types';

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
  const router = useRouter();
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
      && typeof router?.refresh === 'function'
    ) {
      router.refresh();
    }
  }, [event.id, router]);

  return (
    <AppShell
      surface="source"
      surfaceContext={{
        eventId: event.id,
        eventName: event.name,
        eventCode: event.code ?? '',
        currentStage: event.currentStageLabel ?? '',
        blocker: event.blocker ?? null,
        valueAtStakeUsd: event.valueAtStakeUsd ?? null,
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
          overflow: 'hidden',
          background: SHELL.PAPER,
          padding: '14px 18px 18px',
        }}
      >
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(420px, 1.45fr) minmax(360px, 0.95fr)',
            gap: 14,
            height: '100%',
            minHeight: 0,
            alignItems: 'stretch',
          }}
        >
          <div
            data-testid="source-event-agent-chat"
            style={{
              minHeight: 0,
              minWidth: 0,
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <AtlasDrawer
              embedded
              isOpen={true}
              onClose={() => {
                // Embedded Sentinel chat is always visible on the event canvas.
              }}
              agent={SENTINEL_AGENT}
              quote={quote}
              surface={`/source/events/${event.id}`}
              onArtifact={handleArtifact}
              composerPlacement="afterHeader"
              emptyState={<SourceEventPromptDeck event={event} />}
            />
          </div>

          <SourceWorkingPane padding="0">
            <div style={{ display: 'grid', gap: 14, paddingRight: 4 }}>
              <EventCanvasHeader event={event} />
              <SourcingReactivePanel artifacts={artifacts} />
              {children}
            </div>
          </SourceWorkingPane>
        </section>
      </main>
    </AppShell>
  );
}

function SourceEventPromptDeck({ event }: { event: SourcingEventDetail }) {
  const prompts = [
    {
      label: 'Gate read',
      prompt: `Can we advance ${event.name} past ${event.currentStageLabel}?`,
    },
    {
      label: 'Compare',
      prompt: 'Compare the shortlisted vendors against the stage rubric.',
    },
    {
      label: 'BAFO',
      prompt: 'Run a BAFO check: walkaway credibility, holds, and sequence.',
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        display: 'grid',
        gap: 10,
        padding: '0 0 6px',
      }}
    >
      <div
        style={{
          border: '1px solid rgba(250,247,241,0.12)',
          borderRadius: 12,
          background: 'rgba(250,247,241,0.055)',
          padding: '10px 12px',
        }}
      >
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 8.5,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(250,247,241,0.48)',
            fontWeight: 700,
          }}
        >
          Operator prompt
        </div>
        <p
          style={{
            margin: '6px 0 0',
            fontFamily: SHELL.SERIF,
            fontSize: 14.5,
            lineHeight: 1.32,
            color: 'rgba(250,247,241,0.88)',
          }}
        >
          Ask Sentinel what decision is safe now, what evidence is missing, or what leverage to use next.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 7 }}>
        {prompts.map((item) => (
          <div
            key={item.label}
            style={{
              border: '1px solid rgba(250,247,241,0.10)',
              borderRadius: 10,
              padding: '7px 10px',
              background: 'rgba(250,247,241,0.035)',
            }}
          >
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 8,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(250,247,241,0.40)',
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
                color: 'rgba(250,247,241,0.78)',
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
  return (
    <header
      style={{
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 16,
        background: SHELL.CARD_WHITE,
        padding: '16px 18px',
        display: 'grid',
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          fontWeight: 700,
        }}
      >
        Sentinel - event canvas - deterministic workspace
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: SHELL.SERIF,
              fontSize: 26,
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
              fontSize: 13,
              lineHeight: 1.5,
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
          <div style={{ ...META_LABEL, marginTop: 8 }}>Next decision</div>
          <div style={META_VALUE}>{event.nextDecision}</div>
        </div>
      </div>
    </header>
  );
}

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

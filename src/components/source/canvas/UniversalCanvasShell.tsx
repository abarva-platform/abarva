'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from '@/lib/source/canvas-substrate';
import type { SourceStageKey, SourcingEventSummary } from '@/lib/source/types';
import { EventChatLane, type ChatTurn } from './EventChatLane';
import { EventIdStrip } from './EventIdStrip';
import { EventStepRail } from './EventStepRail';
import { EventWorkspace, type WorkspaceTabKey } from './EventWorkspace';
import { ResizableSplitter } from './ResizableSplitter';
import { CANVAS } from './canvas-tokens';
import { DocumentTab } from './workspace-tabs/DocumentTab';
import { GateTab } from './workspace-tabs/GateTab';
import { EvidenceTab } from './workspace-tabs/EvidenceTab';
import { LogTab, type ActivityEntry } from './workspace-tabs/LogTab';
import { threeChoicesForStage } from './canvas-three-choices';

interface UniversalCanvasShellProps {
  event: Pick<
    SourcingEventSummary,
    'id' | 'code' | 'name' | 'accountName' | 'status' | 'statusLabel' | 'archetype' | 'rigor' | 'owner' | 'currentStageKey'
  >;
  /** Stage being viewed in the workspace; defaults to event.currentStageKey. */
  viewStage: SourceStageKey;
  artifactStates: SourceEventArtifactState[];
  gateCriterionStates: SourceEventGateCriterion[];
  evidenceStates: SourceEventEvidence[];
  /** Map of artifact code → markdown body. Server-loaded. */
  templateByCode: Record<string, string | null>;
  /** Activity log entries (most recent first). */
  activityEntries: ActivityEntry[];
  tenantName: string;
}

/**
 * Top-level universal sourcing canvas. Renders the id strip, step rail, and
 * a resizable two-pane body (chat lane left · workspace right).
 *
 * Reads real data from the canvas substrate — pre-filtered to the stage being
 * viewed. The chat is not yet wired to a backend; the input + 3 choices are
 * functional but submitting a message just appends a placeholder turn for
 * now (Wave 2 wires the agent).
 */
export function UniversalCanvasShell({
  event,
  viewStage,
  artifactStates,
  gateCriterionStates,
  evidenceStates,
  templateByCode,
  activityEntries,
  tenantName,
}: UniversalCanvasShellProps) {
  const [thread, setThread] = useState<ChatTurn[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedDocCode, setSelectedDocCode] = useState<string | undefined>(undefined);

  // Filter substrate to the stage being viewed.
  const stageArtifacts = useMemo(
    () => artifactStates.filter((a) => a.stage === viewStage),
    [artifactStates, viewStage],
  );
  const stageCriteria = useMemo(
    () => gateCriterionStates.filter((c) => c.fromStage === viewStage),
    [gateCriterionStates, viewStage],
  );
  const stageEvidence = useMemo(
    () => evidenceStates.filter((e) => e.stage === viewStage),
    [evidenceStates, viewStage],
  );

  // Context-bundle counts for the chat header.
  const contextBundle = useMemo(() => {
    const usable = stageEvidence.filter(
      (e) => e.currentState === 'Usable Evidence' || e.currentState === 'Available',
    ).length;
    const totalEvidence = stageEvidence.length;
    const liveArtifacts = stageArtifacts.filter((a) => a.tier !== 'stub').length;
    const totalArtifacts = stageArtifacts.length;
    const metCriteria = stageCriteria.filter(
      (c) => c.state === 'met' || c.state === 'waived',
    ).length;
    return {
      readiness: `${usable} / ${totalEvidence}`,
      artifacts: `${liveArtifacts} / ${totalArtifacts}`,
      evidence: `${stageEvidence.length} sources`,
      vendors: undefined,
      metCriteria,
      totalCriteria: stageCriteria.length,
    };
  }, [stageArtifacts, stageCriteria, stageEvidence]);

  const handleSubmit = (text: string) => {
    // Wave 1 stub: append the user turn + a placeholder agent ack.
    // Wave 2 will route this through the agent backend.
    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      body: text,
    };
    const agentTurn: ChatTurn = {
      id: `a-${Date.now() + 1}`,
      role: 'agent',
      body:
        'Agent backend is not wired up in this build. The substrate, three-choice catalog, and workspace tabs are live; the chat will be connected in the next slice.',
    };
    setIsStreaming(true);
    setThread((t) => [...t, userTurn]);
    // Simulate a tiny pause so the UI doesn't feel instant-fake.
    setTimeout(() => {
      setThread((t) => [...t, agentTurn]);
      setIsStreaming(false);
    }, 250);
  };

  const handleChoice = (choice: string) => {
    handleSubmit(choice);
  };

  const initialTab: WorkspaceTabKey = 'document';
  const tabs = [
    {
      key: 'document' as WorkspaceTabKey,
      label: 'Document',
      badge: stageArtifacts.length > 0 ? String(stageArtifacts.length) : undefined,
      content: (
        <DocumentTab
          stage={viewStage}
          artifacts={stageArtifacts}
          templateByCode={templateByCode}
          selectedCode={selectedDocCode}
          onSelectCode={setSelectedDocCode}
        />
      ),
    },
    {
      key: 'gate' as WorkspaceTabKey,
      label: 'Gate',
      badge: `${contextBundle.metCriteria}/${contextBundle.totalCriteria}`,
      content: <GateTab fromStage={viewStage} states={stageCriteria} />,
    },
    {
      key: 'evidence' as WorkspaceTabKey,
      label: 'Evidence',
      badge: contextBundle.readiness,
      content: <EvidenceTab stage={viewStage} states={stageEvidence} />,
    },
    {
      key: 'log' as WorkspaceTabKey,
      label: 'Log',
      content: <LogTab entries={activityEntries} />,
    },
  ];

  return (
    <AppShell
      surface="source-detail"
      agentName="Sentinel"
      surfaceContext={{
        sourceEventId: event.id,
        sourceEventCode: event.code,
        viewStage,
      }}
      topBarProps={{
        tenantName,
        showLocked: true,
        context: `${event.code} · ${event.name}`,
      }}
    >
      <main data-testid="source-event-canvas" style={MAIN_STYLE}>
        <div style={CONTAINER_STYLE}>
          <EventIdStrip event={event} />
          <EventStepRail
            eventId={event.id}
            currentStage={event.currentStageKey}
            viewStage={viewStage}
          />
        </div>
        <div style={SPLITTER_WRAPPER_STYLE}>
          <ResizableSplitter
            left={
              <EventChatLane
                stage={viewStage}
                contextBundle={contextBundle}
                thread={thread}
                choices={threeChoicesForStage(viewStage)}
                isStreaming={isStreaming}
                onSubmit={handleSubmit}
                onChoice={handleChoice}
              />
            }
            right={<EventWorkspace tabs={tabs} defaultTab={initialTab} />}
          />
        </div>
      </main>
    </AppShell>
  );
}

const MAIN_STYLE: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  background: CANVAS.PAGE_BG,
};

const CONTAINER_STYLE: CSSProperties = {
  padding: `0 ${CANVAS.S_PAGE}px`,
};

const SPLITTER_WRAPPER_STYLE: CSSProperties = {
  flex: 1,
  display: 'flex',
  minHeight: 0,
};

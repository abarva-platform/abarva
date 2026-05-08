'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { SourceOnboardingTour } from '@/components/source/onboarding/SourceOnboardingTour';
import { listSupportedGenerationCodes } from '@/lib/source/agent-generation';

// xlsx-generatable codes — surfaced to the canvas so the artifact card
// shows a "Download xlsx template" anchor on the right rows. Hardcoded
// here to keep the canvas client-bundle free of `'server-only'` imports
// — the Source-side xlsx renderer set is small and slow-changing.
const XLSX_GENERATABLE_CODES_CLIENT: ReadonlySet<string> = new Set([
  'd04_app_inv',
  'd11_response_checklist',
  'd16_scorecard',
  'd19_pricing_workbook',
]);
// Comparison-mode codes — show a second "Download comparison xlsx"
// anchor alongside the standard template. Today only d19 (pricing).
const XLSX_COMPARISON_CODES_CLIENT: ReadonlySet<string> = new Set([
  'd19_pricing_workbook',
]);
// Codes for which Source has a docx renderer. Slice 3.1 shipped d05;
// Slice 3.2 adds d09 (RFP), d24 (Decision Brief), d27 (Selection Memo).
const DOCX_GENERATABLE_CODES_CLIENT: ReadonlySet<string> = new Set([
  'd05_scope_memo',
  'd09_rfp_pack',
  'd24_decision_brief',
  'd27_selection_memo',
]);
// Codes for which Source has an HTML renderer. Slice 4.1 — same
// narrative artifacts as docx so the buyer can share a viewable link.
const HTML_GENERATABLE_CODES_CLIENT: ReadonlySet<string> = new Set([
  'd05_scope_memo',
  'd09_rfp_pack',
  'd24_decision_brief',
  'd27_selection_memo',
]);
import type {
  SourceEventArtifactState,
  SourceEventArtifactStatus,
  SourceEventEvidence,
  SourceEventGateCriterion,
  SourceEventGateCriterionState,
} from '@/lib/source/canvas-substrate';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
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
  const router = useRouter();
  const [thread, setThread] = useState<ChatTurn[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedDocCode, setSelectedDocCode] = useState<string | undefined>(undefined);
  const [promotePending, setPromotePending] = useState(false);

  // Per-event artifact state lives in client state so "Mark complete"
  // can update optimistically. Server-loaded props are the source of
  // truth on first render; the PATCH endpoint returns the canonical
  // post-update row to reconcile.
  const [artifactStateMap, setArtifactStateMap] = useState<
    Record<string, SourceEventArtifactState>
  >(() => indexByCode(artifactStates));
  const [pendingStatusByCode, setPendingStatusByCode] = useState<
    Record<string, boolean>
  >({});
  const [pendingBodyByCode, setPendingBodyByCode] = useState<
    Record<string, boolean>
  >({});
  const [pendingGenerationByCode, setPendingGenerationByCode] = useState<
    Record<string, boolean>
  >({});
  const generatableCodes = useMemo(
    () => new Set(listSupportedGenerationCodes()),
    [],
  );
  // Same pattern for gate criteria — Mark met / Reopen flips
  // criterion state without round-tripping through the server props.
  const [criterionStateMap, setCriterionStateMap] = useState<
    Record<string, SourceEventGateCriterion>
  >(() => indexByCriterionId(gateCriterionStates));
  const [pendingCriterionByCriterionId, setPendingCriterionByCriterionId] = useState<
    Record<string, boolean>
  >({});

  const liveArtifactStates = useMemo(
    () =>
      artifactStates.map((a) => artifactStateMap[a.artifactCode] ?? a),
    [artifactStates, artifactStateMap],
  );
  const liveGateCriterionStates = useMemo(
    () =>
      gateCriterionStates.map((c) => criterionStateMap[c.criterionId] ?? c),
    [gateCriterionStates, criterionStateMap],
  );

  // Filter substrate to the stage being viewed.
  const stageArtifacts = useMemo(
    () => liveArtifactStates.filter((a) => a.stage === viewStage),
    [liveArtifactStates, viewStage],
  );
  const stageCriteria = useMemo(
    () => liveGateCriterionStates.filter((c) => c.fromStage === viewStage),
    [liveGateCriterionStates, viewStage],
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

  const handlePromoteStage = async (toStage: SourceStageKey): Promise<void> => {
    if (promotePending) return;
    setPromotePending(true);
    try {
      const res = await fetch(`/api/v1/source/${event.id}/stage`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stageKey: toStage }),
      });
      if (!res.ok) return;
      // Re-fetch the SSR data with the new stage in view, so artifacts +
      // criteria + evidence + chat-lane all switch to the new stage.
      const stageLabel = SOURCE_STAGE_LABELS[toStage];
      router.push(`/source/events/${event.id}?stage=${stageLabel}`);
      router.refresh();
    } finally {
      setPromotePending(false);
    }
  };

  const handleCriterionStateChange = async (
    criterionId: string,
    next: SourceEventGateCriterionState,
  ): Promise<void> => {
    const previous = criterionStateMap[criterionId];
    if (!previous) return;

    setCriterionStateMap((prev) => ({
      ...prev,
      [criterionId]: { ...previous, state: next, updatedAt: new Date().toISOString() },
    }));
    setPendingCriterionByCriterionId((prev) => ({ ...prev, [criterionId]: true }));

    try {
      const res = await fetch(
        `/api/v1/source/${event.id}/gate-criteria/${encodeURIComponent(criterionId)}/state`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ state: next }),
        },
      );
      if (!res.ok) {
        setCriterionStateMap((prev) => ({ ...prev, [criterionId]: previous }));
        return;
      }
      const payload = (await res.json()) as { criterion?: SourceEventGateCriterion };
      if (payload.criterion) {
        setCriterionStateMap((prev) => ({ ...prev, [criterionId]: payload.criterion! }));
      }
    } catch {
      setCriterionStateMap((prev) => ({ ...prev, [criterionId]: previous }));
    } finally {
      setPendingCriterionByCriterionId((prev) => {
        const next = { ...prev };
        delete next[criterionId];
        return next;
      });
    }
  };

  const handleArtifactGenerate = async (
    code: string,
  ): Promise<
    { ok: true } | { ok: false; error: string; detail: string; missingUpstream?: string[] }
  > => {
    setPendingGenerationByCode((prev) => ({ ...prev, [code]: true }));
    try {
      const res = await fetch(
        `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/generate-from-claude`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      const payload = (await res.json().catch(() => null)) as {
        artifact?: SourceEventArtifactState;
        error?: string;
        detail?: string;
        missingUpstream?: string[];
      } | null;
      if (!res.ok || !payload) {
        return {
          ok: false,
          error: payload?.error ?? 'unknown',
          detail: payload?.detail ?? `Generation failed (HTTP ${res.status}).`,
          missingUpstream: payload?.missingUpstream,
        };
      }
      if (payload.artifact) {
        setArtifactStateMap((prev) => ({
          ...prev,
          [code]: payload.artifact!,
        }));
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: 'network',
        detail: err instanceof Error ? err.message : 'Network error',
      };
    } finally {
      setPendingGenerationByCode((prev) => {
        const next = { ...prev };
        delete next[code];
        return next;
      });
    }
  };

  const handleArtifactBodySave = async (
    code: string,
    body: string,
  ): Promise<void> => {
    const previous = artifactStateMap[code];
    if (!previous) return;
    setPendingBodyByCode((prev) => ({ ...prev, [code]: true }));
    setArtifactStateMap((prev) => ({
      ...prev,
      [code]: {
        ...previous,
        body: body.trim().length === 0 ? null : body,
        bodyUpdatedAt: new Date().toISOString(),
      },
    }));
    try {
      const res = await fetch(
        `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/body`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ body }),
        },
      );
      if (!res.ok) {
        setArtifactStateMap((prev) => ({ ...prev, [code]: previous }));
        return;
      }
      const payload = (await res.json()) as { artifact?: SourceEventArtifactState };
      if (payload.artifact) {
        setArtifactStateMap((prev) => ({ ...prev, [code]: payload.artifact! }));
      }
    } catch {
      setArtifactStateMap((prev) => ({ ...prev, [code]: previous }));
    } finally {
      setPendingBodyByCode((prev) => {
        const next = { ...prev };
        delete next[code];
        return next;
      });
    }
  };

  const handleArtifactStatusChange = async (
    code: string,
    next: SourceEventArtifactStatus,
  ): Promise<void> => {
    const previous = artifactStateMap[code];
    if (!previous) return;

    // Optimistic update.
    setArtifactStateMap((prev) => ({
      ...prev,
      [code]: { ...previous, status: next, updatedAt: new Date().toISOString() },
    }));
    setPendingStatusByCode((prev) => ({ ...prev, [code]: true }));

    try {
      const res = await fetch(
        `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/status`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status: next }),
        },
      );
      if (!res.ok) {
        // Revert.
        setArtifactStateMap((prev) => ({ ...prev, [code]: previous }));
        return;
      }
      const payload = (await res.json()) as { artifact?: SourceEventArtifactState };
      if (payload.artifact) {
        setArtifactStateMap((prev) => ({ ...prev, [code]: payload.artifact! }));
      }
    } catch {
      setArtifactStateMap((prev) => ({ ...prev, [code]: previous }));
    } finally {
      setPendingStatusByCode((prev) => {
        const next = { ...prev };
        delete next[code];
        return next;
      });
    }
  };

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

  // B4 — clicking a suggested choice now POPULATES the composer (handled
  // inside EventChatLane). The parent observes the pick for analytics; we
  // intentionally do NOT auto-submit so the user can edit before sending.
  const handleChoice = (_choice: string) => {
    /* analytics hook — kept for parity, no auto-submit */
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
          onChangeStatus={handleArtifactStatusChange}
          pendingByCode={pendingStatusByCode}
          onSaveBody={handleArtifactBodySave}
          bodyPendingByCode={pendingBodyByCode}
          onGenerateFromClaude={handleArtifactGenerate}
          generatableCodes={generatableCodes}
          generationPendingByCode={pendingGenerationByCode}
          xlsxGeneratableCodes={XLSX_GENERATABLE_CODES_CLIENT}
          xlsxDownloadHref={(code) =>
            `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/render-xlsx`
          }
          xlsxComparisonCodes={XLSX_COMPARISON_CODES_CLIENT}
          xlsxComparisonDownloadHref={(code) =>
            `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/render-comparison-xlsx`
          }
          docxGeneratableCodes={DOCX_GENERATABLE_CODES_CLIENT}
          docxDownloadHref={(code) =>
            `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/render-docx`
          }
          htmlGeneratableCodes={HTML_GENERATABLE_CODES_CLIENT}
          htmlViewHref={(code) =>
            `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/render-html`
          }
          eventId={event.id}
        />
      ),
    },
    {
      key: 'gate' as WorkspaceTabKey,
      label: 'Gate',
      badge: `${contextBundle.metCriteria}/${contextBundle.totalCriteria}`,
      content: (
        <GateTab
          fromStage={viewStage}
          states={stageCriteria}
          onChangeCriterionState={handleCriterionStateChange}
          pendingByCriterionId={pendingCriterionByCriterionId}
          onPromoteStage={handlePromoteStage}
          promotePending={promotePending}
        />
      ),
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
        <CanvasTour />
      </main>
    </AppShell>
  );
}

function CanvasTour() {
  const searchParams = useSearchParams();
  const tourActive = searchParams?.get('tour') === '1';
  if (!tourActive) return null;
  return (
    <SourceOnboardingTour
      active={tourActive}
      config={{
        step: 3,
        title: 'This is the universal canvas.',
        body: (
          <>
            Each artifact has a <strong>Mark complete</strong> button — flip them
            as the work lands. Switch to the <strong>Gate</strong> tab to see
            what&rsquo;s blocking promotion; once everything&rsquo;s green,{' '}
            <strong>Promote stage</strong> moves the event forward. The chat on
            the left can draft any artifact for you.
          </>
        ),
        nextLabel: 'Got it',
      }}
    />
  );
}

function indexByCode(
  rows: SourceEventArtifactState[],
): Record<string, SourceEventArtifactState> {
  const out: Record<string, SourceEventArtifactState> = {};
  for (const row of rows) out[row.artifactCode] = row;
  return out;
}

function indexByCriterionId(
  rows: SourceEventGateCriterion[],
): Record<string, SourceEventGateCriterion> {
  const out: Record<string, SourceEventGateCriterion> = {};
  for (const row of rows) out[row.criterionId] = row;
  return out;
}

const MAIN_STYLE: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  // Belt-and-suspenders height pin: AppShell sets minHeight: 100vh + overflow
  // hidden upstream, but explicit height here guarantees the splitter pane
  // (and the chat lane inside it) cannot grow beyond the viewport, so the
  // chat input stays sticky at the bottom without scrolling.
  height: 'calc(100vh - 64px)',
  overflow: 'hidden',
  background: CANVAS.PAGE_BG,
};

const CONTAINER_STYLE: CSSProperties = {
  padding: `0 ${CANVAS.S_PAGE}px`,
  flexShrink: 0,
};

const SPLITTER_WRAPPER_STYLE: CSSProperties = {
  flex: 1,
  display: 'flex',
  minHeight: 0,
  overflow: 'hidden',
};

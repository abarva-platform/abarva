'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
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
  'd20_trap_log',
  'd22_bafo_question_pack',
]);
// Comparison-mode codes — show a second "Download comparison xlsx"
// anchor alongside the standard template. Today only d19 (pricing).
const XLSX_COMPARISON_CODES_CLIENT: ReadonlySet<string> = new Set([
  'd19_pricing_workbook',
]);
// Codes for which Source has a docx renderer. Slice 3.x shipped
// narrative artifacts; Slice 5 adds the structured-data artifacts
// (d04 app inventory, d11 response checklist, d16 scorecard).
const DOCX_GENERATABLE_CODES_CLIENT: ReadonlySet<string> = new Set([
  'd04_app_inv',
  'd05_scope_memo',
  'd09_rfp_pack',
  'd11_response_checklist',
  'd16_scorecard',
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
// Codes for which Source has a PDF renderer. Slice 4.2 — programmatic
// PDF for archives + signatures (HTML's print-to-PDF still works too).
const PDF_GENERATABLE_CODES_CLIENT: ReadonlySet<string> = new Set([
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
import { canvasDockAgentForStage } from '@/lib/source/portfolio-derivations';
import type { SourceStageKey, SourcingEventSummary } from '@/lib/source/types';
import {
  AgentDock,
  type AttachmentRef,
  type ChatMessage,
  type SuggestedAction,
} from '@/components/agent/AgentDock';
import { EventIdStrip } from './EventIdStrip';
import { EventStepRail } from './EventStepRail';
import { EventWorkspace, type WorkspaceTabKey } from './EventWorkspace';
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
 * the shared `<AgentDock>` (chat lane on the left, workspace on the right
 * by default — five toggleable dock modes per surface).
 *
 * Reads real data from the canvas substrate — pre-filtered to the stage being
 * viewed. Chat goes through the existing source Sentinel/Atlas runtime at
 * `/api/v1/source/[eventId]/nexus/ask`; AgentDock paperclip uploads carry
 * the event id so the route can stamp `agent_attachment.linked_event_id`
 * before invoking the deterministic stub. The runtime itself is unchanged.
 *
 * Stage→agent mapping is binary at the dock surface:
 *   stages 1–9 (Strategy → Selection)  → Sentinel
 *   stages 10–11 (Transition, Value)   → Atlas
 * (`canvasDockAgentForStage`). Specialist agents (Nexus, Steward) still
 * lead their respective workflows via tool calls invoked by the front
 * agent — they don't host the chat surface here.
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
  const [thread, setThread] = useState<ChatMessage[]>([]);
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

  const dockAgent = canvasDockAgentForStage(viewStage);

  // POSTs the message + attachment ids to the source Sentinel/Atlas runtime.
  // The route handler links the attachments to this event (via
  // linked_event_id) before invoking the deterministic stub. The runtime
  // itself is unchanged — we just feed it the canvas-scoped attachment refs.
  const handleAgentMessage = async (
    text: string,
    attachments: AttachmentRef[],
  ): Promise<void> => {
    const trimmed = text.trim();
    const attachmentIds = attachments.map((a) => a.id);
    if (!trimmed && attachmentIds.length === 0) return;

    const userTurn: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      body: trimmed.length > 0
        ? trimmed
        : `Attached ${attachmentIds.length} file${attachmentIds.length === 1 ? '' : 's'}.`,
    };
    setThread((t) => [...t, userTurn]);

    try {
      const res = await fetch(`/api/v1/source/${event.id}/nexus/ask`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          mode: 'event',
          stageKey: viewStage,
          selectedAttachmentIds: attachmentIds,
        }),
      });
      const payload = (await res.json().catch(() => null)) as {
        summary?: string;
        nexusSummary?: { summary?: string } | null;
        error?: { message?: string };
      } | null;
      const body =
        payload?.summary ??
        payload?.nexusSummary?.summary ??
        payload?.error?.message ??
        `${dockAgent} could not produce a response right now.`;
      const agentTurn: ChatMessage = {
        id: `a-${Date.now() + 1}`,
        role: 'agent',
        body,
      };
      setThread((t) => [...t, agentTurn]);
    } catch (err) {
      const agentTurn: ChatMessage = {
        id: `a-${Date.now() + 1}`,
        role: 'agent',
        body:
          err instanceof Error
            ? `Network error: ${err.message}`
            : 'Network error reaching the agent runtime.',
      };
      setThread((t) => [...t, agentTurn]);
    }
  };

  // Three-choice catalog mapped to AgentDock SuggestedActions. Click pre-fills
  // the composer rather than auto-submitting so the user can edit first
  // (B4 semantics preserved from the prior chat lane).
  const suggestedActions: SuggestedAction[] = useMemo(
    () =>
      threeChoicesForStage(viewStage).map((choice, i) => ({
        id: `c${i}`,
        label: choice,
        body: choice,
      })),
    [viewStage],
  );

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
            `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/render?format=xlsx`
          }
          xlsxComparisonCodes={XLSX_COMPARISON_CODES_CLIENT}
          xlsxComparisonDownloadHref={(code) =>
            `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/render?format=xlsx&variant=comparison`
          }
          docxGeneratableCodes={DOCX_GENERATABLE_CODES_CLIENT}
          docxDownloadHref={(code) =>
            `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/render?format=docx`
          }
          htmlGeneratableCodes={HTML_GENERATABLE_CODES_CLIENT}
          htmlViewHref={(code) =>
            `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/render?format=html`
          }
          pdfGeneratableCodes={PDF_GENERATABLE_CODES_CLIENT}
          pdfDownloadHref={(code) =>
            `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/render?format=pdf`
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
      agentName={dockAgent}
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
          <AgentDock
            agent={{
              initials: dockAgent[0],
              name: dockAgent,
              role: AGENT_DOCK_ROLE_COPY[dockAgent],
            }}
            surface="source/events/canvas"
            defaultMode="side-rail"
            surfaceContext={{
              sourceEventId: event.id,
              sourceEventCode: event.code,
              viewStage,
            }}
            suggestedActions={suggestedActions}
            thread={thread}
            onMessage={handleAgentMessage}
            workspace={
              <CanvasContextStrip
                stageKey={viewStage}
                contextBundle={contextBundle}
              >
                <EventWorkspace tabs={tabs} defaultTab={initialTab} />
              </CanvasContextStrip>
            }
            defaultLeftPercent={45}
            minLeftPx={320}
          />
        </div>
        <CanvasTour />
      </main>
    </AppShell>
  );
}

// Eyebrow copy under the agent name in the dock header. Action verbs the
// user can ask for, not abstract role descriptions. Mirrors the previous
// EventChatLane.AGENT_DESCRIPTION map (Sentinel + Atlas only — the canvas
// dock is a binary surface; see `canvasDockAgentForStage`).
const AGENT_DOCK_ROLE_COPY: Record<'Sentinel' | 'Atlas', string> = {
  Sentinel: 'Drafts artifacts, surfaces evidence, flags gaps before they cost you.',
  Atlas: 'Frames the executive brief, ranks finalists, locks the decision.',
};

interface CanvasContextStripProps {
  stageKey: SourceStageKey;
  contextBundle: {
    readiness: string;
    artifacts: string;
    vendors?: string;
    evidence?: string;
  };
  children: ReactNode;
}

// Stage label + readiness/artifact counts that previously lived inside the
// chat lane header. AgentDock owns the chat chrome now, so the workspace
// pane absorbs this strip — same data, same testid surface, just hosted by
// the right pane instead of the chat one.
function CanvasContextStrip({ stageKey, contextBundle, children }: CanvasContextStripProps) {
  const stageLabel = SOURCE_STAGE_LABELS[stageKey];
  return (
    <div style={WORKSPACE_WRAPPER_STYLE}>
      <div
        data-testid="source-canvas-context-strip"
        style={CONTEXT_STRIP_STYLE}
        aria-label="Context bundle"
      >
        <span style={CONTEXT_LABEL_STYLE}>Step {stageLabel.toUpperCase()}</span>
        <span style={DOT_SEP}>·</span>
        <span>Readiness {contextBundle.readiness}</span>
        <span style={DOT_SEP}>·</span>
        <span>Artifacts {contextBundle.artifacts}</span>
        {contextBundle.vendors ? (
          <>
            <span style={DOT_SEP}>·</span>
            <span>Vendors {contextBundle.vendors}</span>
          </>
        ) : null}
        {contextBundle.evidence ? (
          <>
            <span style={DOT_SEP}>·</span>
            <span>Evidence {contextBundle.evidence}</span>
          </>
        ) : null}
      </div>
      <div style={WORKSPACE_INNER_STYLE}>{children}</div>
    </div>
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
            <strong>Promote stage</strong> moves the event forward. The agent
            dock on the left can draft any artifact for you — drag a vendor
            response onto it to bring those documents into the conversation.
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

const WORKSPACE_WRAPPER_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  background: CANVAS.PAGE_BG,
};

const WORKSPACE_INNER_STYLE: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden',
};

const CONTEXT_STRIP_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 6,
  padding: '8px 18px',
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: '0.06em',
  color: CANVAS.INK_SOFT,
  background: 'rgba(10,10,11,0.025)',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  flexShrink: 0,
};

const CONTEXT_LABEL_STYLE: CSSProperties = {
  fontWeight: 700,
  color: CANVAS.INK,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  marginRight: 4,
};

const DOT_SEP: CSSProperties = {
  color: CANVAS.GRAY,
};

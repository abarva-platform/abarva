"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { AgentDock, type ChatMessage } from "@/components/agent/AgentDock";
import { useAtlasPageState } from "@/components/shell/AtlasPageStateProvider";
import { SourceNewFiles, type SourceNewFileRow } from "./SourceNewFiles";
import {
  SOURCE_NEW_PHASE_ORDER,
  awaitsIntakeReview,
  isPastSourceNewPhases,
  sourceNewCategoryDisplay,
  sourceNewCurrentPhase,
  sourceNewEventTypeLabel,
  sourceNewLifecycleLabel,
  sourceNewPhaseState,
  sourceNewPhaseStateLabel,
  sourceNewStageLabel,
  type SourceNewPhaseEvidence,
  type SourceNewPhaseKey,
  type SourceNewPhaseState,
} from "@/lib/source/new-workspace/phase-state";
import "./workspace.css";

type Phase = SourceNewPhaseKey;
type View = "work" | "files" | "intelligence" | "approvals";

export interface SourceNewEventView {
  id: string;
  code: string;
  name: string;
  clientName: string;
  clientKey: string;
  eventType: string;
  category: string | null;
  currentStage: string;
  lifecycle: string;
  trigger: string | null;
  scope: string | null;
  decisionOwner: string | null;
}

const PHASE_LABELS: Record<Phase, string> = {
  request: "Request",
  define: "Define",
  suppliers: "Suppliers & NDA",
  rfi: "Market package",
};
// The rail order is the shared one, so the rail and the state resolver can
// never disagree about which phase is behind which.
const PHASES: readonly { key: Phase; label: string }[] = SOURCE_NEW_PHASE_ORDER.map((key) => ({
  key,
  label: PHASE_LABELS[key],
}));
const VIEWS: readonly { key: View; label: string }[] = [
  { key: "work", label: "Work" },
  { key: "files", label: "Files" },
  { key: "intelligence", label: "Intelligence" },
  { key: "approvals", label: "Approvals" },
];

/**
 * What each phase actually holds. A phase behind the event is only described
 * in the past tense when something was recorded in it, so this reads the
 * event's own facts and the files filed against each phase — never the
 * position of the phase in the rail.
 */
function phaseEvidence(
  event: SourceNewEventView,
  files: readonly SourceNewFileRow[],
): SourceNewPhaseEvidence {
  const hasFile = (phase: Phase) => files.some((file) => file.phase === phase);
  const recorded = (value: string | null) => Boolean(value?.trim());
  return {
    request: hasFile("request") || recorded(event.trigger),
    define: hasFile("define") || recorded(event.scope) || recorded(event.decisionOwner),
    suppliers: hasFile("suppliers"),
    rfi: hasFile("rfi"),
  };
}

function fact(value: string | null): string {
  return value?.trim() || "Not recorded";
}

export function sourceNewFileDownloadHref(file: Pick<SourceNewFileRow, "id" | "lifecycleState">): string {
  const base = `/api/v1/source/artifacts/${encodeURIComponent(file.id)}/download`;
  return file.lifecycleState === "current" ? base : `${base}?includeHistory=1`;
}

function nextAction(event: SourceNewEventView): { label: string; detail: string } {
  if (awaitsIntakeReview(event.lifecycle)) return {
    label: "Review intake",
    detail: "Review the recorded request and its approval state.",
  };
  if (event.lifecycle !== "active") return {
    label: "Open event",
    detail: `Current stage: ${sourceNewStageLabel(event.currentStage)}`,
  };
  if (["strategy", "scope", "sourcing_strategy", "intake"].includes(event.currentStage)) return {
    label: "Open scope and strategy",
    detail: "Review scope, baseline and decision requirements in the governed event.",
  };
  if (["rfp", "rfp_rfi_package"].includes(event.currentStage)) return {
    label: "Open market package",
    detail: "Review the package and its release requirements in the governed event.",
  };
  return {
    label: "Open current stage",
    detail: `Current stage: ${sourceNewStageLabel(event.currentStage)}`,
  };
}

export function SourceNewWorkspace({
  event,
  files,
}: {
  event: SourceNewEventView;
  files: readonly SourceNewFileRow[];
}) {
  const evidence = useMemo(() => phaseEvidence(event, files), [event, files]);
  const stateOf = (item: Phase): SourceNewPhaseState => sourceNewPhaseState(item, event, evidence);
  const current = sourceNewCurrentPhase(event);
  // An event past these phases opens on the last one it can show, not on a
  // phase the rail would otherwise present as the live one.
  const [phase, setPhase] = useState<Phase>(() => sourceNewCurrentPhase(event) ?? "rfi");
  const [view, setView] = useState<View>("work");
  const reviewPending = awaitsIntakeReview(event.lifecycle);
  // With no phase current, the rail shows no live step. Say where the event
  // actually is rather than leaving the operator to infer it.
  const advancedBeyondPhases = current === null && isPastSourceNewPhases(event);
  const category = sourceNewCategoryDisplay(event.category);
  const advancedNote = `This event has moved past the phases shown here. Its current stage is ${sourceNewStageLabel(event.currentStage)}.`;
  const approvalHref = `/source/events/${encodeURIComponent(event.id)}/approval`;
  const eventHref = `/source/events/${encodeURIComponent(event.id)}`;
  const actionHref = reviewPending ? approvalHref : eventHref;
  const action = nextAction(event);
  const actionLabel = action.label;
  const isCurrentPhase = phase === current;

  const content = (
    <main className="snw" aria-label="Source New event workspace">
      <div className="snw-inner">
        <div className="snw-crumb"><Link href="/source/new">Source New</Link><span>/</span><span>{event.code}</span></div>
        <header className="snw-heading">
          <div>
            <h1>{event.name}</h1>
            <p>{event.clientName} · {sourceNewEventTypeLabel(event.eventType)}</p>
          </div>
          <span className={`snw-event-state ${event.lifecycle === "active" ? "is-active" : ""}`}>
            {sourceNewLifecycleLabel(event.lifecycle)}
          </span>
        </header>

        <nav className="snw-phases" aria-label="Event phases">
          {PHASES.map((item, index) => (
            <button
              key={item.key}
              type="button"
              aria-current={phase === item.key ? "step" : undefined}
              onClick={() => { setPhase(item.key); setView("work"); }}
            >
              <span className="snw-phase-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="snw-phase-copy"><strong>{item.label}</strong><small>{sourceNewPhaseStateLabel(stateOf(item.key))}</small></span>
            </button>
          ))}
        </nav>

        <nav className="snw-views" aria-label="Workspace views">
          {VIEWS.map((item) => (
            <button key={item.key} type="button" aria-current={view === item.key ? "page" : undefined} onClick={() => setView(item.key)}>{item.label}</button>
          ))}
        </nav>

        {view === "work" && (
          <div className="snw-work">
            <section className="snw-main-work">
              <p className="snw-eyebrow">{PHASES.find((item) => item.key === phase)?.label}</p>
              {isCurrentPhase ? (
                <>
                  <h2>{reviewPending ? "Confirm this request" : "Continue the governed event"}</h2>
                  <p className="snw-lede">
                    {reviewPending
                      ? "The request is recorded. Review its facts and approval before opening supplier work."
                      : "The current event stage owns the next decision and evidence gate."}
                  </p>
                  <div className="snw-known">
                    <h3>What is recorded</h3>
                    <dl>
                      <div><dt>Need</dt><dd>{fact(event.trigger)}</dd></div>
                      <div><dt>Scope</dt><dd>{fact(event.scope)}</dd></div>
                      <div><dt>Decision owner</dt><dd>{fact(event.decisionOwner)}</dd></div>
                    </dl>
                  </div>
                </>
              ) : stateOf(phase) === "not_open" ? (
                <>
                  <h2>This phase is not yet open</h2>
                  <p className="snw-lede">The event has not reached this phase. Earlier gates must be cleared before this work can begin. Browsing here does not advance the event.</p>
                </>
              ) : stateOf(phase) === "no_record" ? (
                <>
                  <h2>Nothing is recorded in this phase</h2>
                  <p className="snw-lede">The event moved past this phase without recording anything here. That is a gap in the record, not completed work, and nothing on this screen changes it.</p>
                  {advancedBeyondPhases && <p className="snw-note">{advancedNote}</p>}
                </>
              ) : (
                <>
                  <h2>Recorded earlier in this event</h2>
                  <p className="snw-lede">This phase holds recorded work. Viewing it does not mark it complete, approve any gate, or change the current stage.</p>
                  {advancedBeyondPhases && <p className="snw-note">{advancedNote}</p>}
                </>
              )}
            </section>
            <aside className="snw-next" aria-label="Next action">
              <p className="snw-eyebrow">Next action</p>
              <h2>{current === null ? actionLabel : isCurrentPhase ? actionLabel : "Return to current work"}</h2>
              <p>{current === null || isCurrentPhase ? action.detail : stateOf(phase) === "not_open" ? "This phase is locked. The event must advance to open it." : "You are reviewing a phase the event has moved past. No gate is changed here."}</p>
              {current === null || isCurrentPhase
                ? <Link className="snw-primary" href={actionHref}>{actionLabel}</Link>
                : <button className="snw-primary" type="button" onClick={() => setPhase(current)}>Current work</button>}
            </aside>
          </div>
        )}

        {view === "files" && <section className="snw-panel"><SourceNewFiles rows={files} initialPhase={phase} onDownload={(file) => { window.location.href = sourceNewFileDownloadHref(file); }} /></section>}
        {view === "intelligence" && (
          <section className="snw-panel snw-plain">
            <p className="snw-eyebrow">Decision support</p>
            <h2>What can inform this event</h2>
            <dl className="snw-facts">
              <div><dt>Classified category</dt><dd>{category.text}</dd></div>
              <div><dt>Evidence basis</dt><dd>Open the current stage for cited insights and missing-input checks.</dd></div>
            </dl>
            {category.note && <p className="snw-note">{category.note}</p>}
            <p className="snw-note">A category alone is not a benchmark, savings claim or supplier recommendation.</p>
            <Link className="snw-text-action" href={eventHref}>View current stage</Link>
          </section>
        )}
        {view === "approvals" && (
          <section className="snw-panel snw-plain">
            <p className="snw-eyebrow">Governed decision</p>
            <h2>{reviewPending ? "Review is still required" : sourceNewLifecycleLabel(event.lifecycle)}</h2>
            <p className="snw-lede">The approval record, actor and evidence live in the governed event flow. This overview does not approve or advance anything.</p>
            <Link className="snw-primary" href={actionHref}>{reviewPending ? "Open approval" : "Open event"}</Link>
          </section>
        )}
      </div>
    </main>
  );

  return (
    <AppShell
      surface="source-detail"
      hasTenantKey
      surfaceContext={{ sourceEventId: event.id, clientKey: event.clientKey, sourceStage: event.currentStage, sourceLifecycle: event.lifecycle }}
      topBarProps={{ tenantName: event.clientName, showLocked: true, context: "Source New" }}
    >
      <SourceNewAvaDock event={event} workspace={content} />
    </AppShell>
  );
}

function SourceNewAvaDock({ event, workspace }: { event: SourceNewEventView; workspace: ReactNode }) {
  const pageState = useAtlasPageState();
  const [compact, setCompact] = useState(true);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(max-width: 900px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const thread: ChatMessage[] = useMemo(() => pageState?.conversation.map((turn) => ({
    id: turn.id,
    role: turn.role,
    body: turn.text,
    at: new Date(turn.timestamp).toISOString(),
  })) ?? [], [pageState?.conversation]);

  return (
    <AgentDock
      key={compact ? "compact" : "wide"}
      agent={{ initials: "aVa", mark: "ava", name: "aVa", role: "Sourcing advisor" }}
      surface="source/new-workspace"
      defaultMode={compact ? "collapsed" : "side-rail"}
      disableStoredMode={compact}
      collapsedRestoreMode={compact ? "expand" : undefined}
      defaultLeftPercent={23}
      minLeftPx={245}
      surfaceContext={{ sourceEventId: event.id, clientKey: event.clientKey, sourceStage: event.currentStage }}
      initialQuote={`Ask about the current Source step for ${event.name}.`}
      thread={thread}
      onMessage={(text, attachments) => {
        const message = [text.trim(), ...attachments.map((file) => `[Attached evidence: ${file.file_name} (${file.id})]`)].filter(Boolean).join("\n");
        if (message) pageState?.ask(message);
      }}
      workspace={workspace}
    />
  );
}

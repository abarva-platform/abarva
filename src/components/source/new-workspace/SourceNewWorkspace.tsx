"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { AgentDock, type ChatMessage } from "@/components/agent/AgentDock";
import { useAtlasPageState } from "@/components/shell/AtlasPageStateProvider";
import { SourceNewFiles, type SourceNewFileRow } from "./SourceNewFiles";
import "./workspace.css";

type Phase = "request" | "define" | "suppliers" | "rfi";
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

const PHASES: readonly { key: Phase; label: string }[] = [
  { key: "request", label: "Request" },
  { key: "define", label: "Define" },
  { key: "suppliers", label: "Suppliers & NDA" },
  { key: "rfi", label: "RFI" },
];
const VIEWS: readonly { key: View; label: string }[] = [
  { key: "work", label: "Work" },
  { key: "files", label: "Files" },
  { key: "intelligence", label: "Intelligence" },
  { key: "approvals", label: "Approvals" },
];

function awaitsIntakeReview(lifecycle: string): boolean {
  return lifecycle === "waiting_on_client";
}

function eventStateLabel(lifecycle: string): string {
  if (awaitsIntakeReview(lifecycle)) return "Awaiting intake review";
  if (lifecycle === "active") return "Active event";
  const plain = lifecycle.replaceAll("_", " ");
  return plain.charAt(0).toUpperCase() + plain.slice(1);
}

function currentPhase(event: SourceNewEventView): Phase | null {
  if (awaitsIntakeReview(event.lifecycle)) return "request";
  if (["strategy", "scope", "intake", "sourcing_strategy"].includes(event.currentStage)) return "define";
  if (["rfp", "rfp_rfi_package"].includes(event.currentStage)) return "rfi";
  return null;
}

function phaseState(event: SourceNewEventView, phase: Phase): string {
  const current = currentPhase(event);
  const index = PHASES.findIndex((item) => item.key === phase);
  const currentIndex = current === null ? PHASES.length : PHASES.findIndex((item) => item.key === current);
  if (index < currentIndex) return "Past work";
  if (index > currentIndex) return "Later";
  if (awaitsIntakeReview(event.lifecycle)) return "Review needed";
  return "Current";
}

function fact(value: string | null): string {
  return value?.trim() || "Not recorded";
}

export function SourceNewWorkspace({
  event,
  files,
}: {
  event: SourceNewEventView;
  files: readonly SourceNewFileRow[];
}) {
  const [phase, setPhase] = useState<Phase>(() => currentPhase(event) ?? "rfi");
  const [view, setView] = useState<View>("work");
  const reviewPending = awaitsIntakeReview(event.lifecycle);
  const current = currentPhase(event);
  const approvalHref = `/source/events/${encodeURIComponent(event.id)}/approval`;
  const eventHref = `/source/events/${encodeURIComponent(event.id)}`;
  const actionHref = reviewPending ? approvalHref : eventHref;
  const actionLabel = reviewPending ? "Review intake" : event.lifecycle === "active" ? "Continue current stage" : "Open event";
  const isCurrentPhase = phase === current;

  const content = (
    <main className="snw" aria-label="Source New event workspace">
      <div className="snw-inner">
        <div className="snw-crumb"><Link href="/source/new">Source New</Link><span>/</span><span>{event.code}</span></div>
        <header className="snw-heading">
          <div>
            <h1>{event.name}</h1>
            <p>{event.clientName} · {event.eventType.replaceAll("_", " ")}</p>
          </div>
          <span className={`snw-event-state ${event.lifecycle === "active" ? "is-active" : ""}`}>
            {eventStateLabel(event.lifecycle)}
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
              <span className="snw-phase-copy"><strong>{item.label}</strong><small>{phaseState(event, item.key)}</small></span>
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
              ) : (
                <>
                  <h2>{phaseState(event, phase) === "Later" ? "This step is not open yet" : "Earlier work"}</h2>
                  <p className="snw-lede">Selecting a step lets you look ahead. It does not advance the event or clear a gate.</p>
                </>
              )}
            </section>
            <aside className="snw-next" aria-label="Next action">
              <p className="snw-eyebrow">Next action</p>
              <h2>{current === null ? actionLabel : isCurrentPhase ? actionLabel : "Return to current work"}</h2>
              <p>{current === null ? `Current stage: ${event.currentStage.replaceAll("_", " ")}` : isCurrentPhase ? (reviewPending ? "Review the recorded request and its approval state." : "Continue in the current stage.") : "This phase is only a preview."}</p>
              {current === null || isCurrentPhase
                ? <Link className="snw-primary" href={actionHref}>{actionLabel}</Link>
                : <button className="snw-primary" type="button" onClick={() => setPhase(current)}>Current work</button>}
            </aside>
          </div>
        )}

        {view === "files" && <section className="snw-panel"><SourceNewFiles rows={files} initialPhase={phase} onDownload={(file) => { window.location.href = `/api/v1/source/artifacts/${encodeURIComponent(file.id)}/download`; }} /></section>}
        {view === "intelligence" && (
          <section className="snw-panel snw-plain">
            <p className="snw-eyebrow">Decision support</p>
            <h2>What can inform this event</h2>
            <dl className="snw-facts">
              <div><dt>Classified category</dt><dd>{event.category?.replaceAll("_", " ") || "Not established"}</dd></div>
              <div><dt>Evidence basis</dt><dd>Open the current stage for cited insights and missing-input checks.</dd></div>
            </dl>
            <p className="snw-note">A category alone is not a benchmark, savings claim or supplier recommendation.</p>
            <Link className="snw-text-action" href={eventHref}>View current stage</Link>
          </section>
        )}
        {view === "approvals" && (
          <section className="snw-panel snw-plain">
            <p className="snw-eyebrow">Governed decision</p>
            <h2>{reviewPending ? "Review is still required" : eventStateLabel(event.lifecycle)}</h2>
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

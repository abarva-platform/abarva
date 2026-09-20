"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { AgentDock, type ChatMessage } from "@/components/agent/AgentDock";
import { useAtlasPageState } from "@/components/shell/AtlasPageStateProvider";
import { SourceNewFiles, type SourceNewFileRow } from "./SourceNewFiles";
import type { SourceEventActivityResult } from "@/lib/source/activity-log";
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
import { normalizeSourceStageKey } from "@/lib/source/constants";
import type { SourceNewEventIntelligenceView } from "@/lib/source/new-workspace/event-intelligence";
import type { SourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";
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
  /** Persisted event snapshot date used for deterministic readiness checks. */
  asOfDate: string;
  solicitationMotion?: "rfi" | "rfp" | null;
  solicitationMotionAcceptedAt?: string | null;
  solicitationMotionAcceptedByUserId?: string | null;
}

const BASE_PHASE_LABELS: Record<Phase, string> = {
  request: "Request",
  define: "Define",
  suppliers: "Suppliers & NDA",
  rfi: "Market package",
};
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
  stage05NdaCoverage: SourceNewStage05NdaCoverage,
): SourceNewPhaseEvidence {
  const hasFile = (phase: Phase) => files.some((file) => file.phase === phase);
  const recorded = (value: string | null) => Boolean(value?.trim());
  return {
    request: hasFile("request") || recorded(event.trigger),
    define:
      hasFile("define") ||
      recorded(event.scope) ||
      recorded(event.decisionOwner),
    suppliers: hasFile("suppliers") || stage05NdaCoverage.suppliers.length > 0,
    rfi: hasFile("rfi"),
  };
}

function fact(value: string | null): string {
  return value?.trim() || "Not recorded";
}

function marketPackageLabel(event: SourceNewEventView): string {
  if (event.solicitationMotion === "rfi") return "RFI";
  if (event.solicitationMotion === "rfp") return "RFP";
  return "Market package";
}

function isResponsesStage(event: SourceNewEventView): boolean {
  return normalizeSourceStageKey(event.currentStage) === "responses";
}

function responseEvidenceRows(
  files: readonly SourceNewFileRow[],
): SourceNewFileRow[] {
  return files.filter(
    (file) => file.phase === "other" && /response/i.test(file.artifactType),
  );
}

function hasAcceptedSolicitationMotion(event: SourceNewEventView): boolean {
  return Boolean(
    event.solicitationMotion &&
    event.solicitationMotionAcceptedAt &&
    event.solicitationMotionAcceptedByUserId,
  );
}

function isCompletedEvent(event: SourceNewEventView): boolean {
  return event.lifecycle === "completed";
}

function phasesFor(
  event: SourceNewEventView,
): readonly { key: Phase; label: string }[] {
  const packageLabel = marketPackageLabel(event);
  // The rail order is the shared one, so the rail and the state resolver can
  // never disagree about which phase is behind which.
  return SOURCE_NEW_PHASE_ORDER.map((key) => ({
    key,
    label: key === "rfi" ? packageLabel : BASE_PHASE_LABELS[key],
  }));
}

export function sourceNewFileDownloadHref(
  file: Pick<SourceNewFileRow, "id" | "lifecycleState">,
): string {
  const base = `/api/v1/source/artifacts/${encodeURIComponent(file.id)}/download`;
  return file.lifecycleState === "current" ? base : `${base}?includeHistory=1`;
}

function nextAction(event: SourceNewEventView): {
  label: string;
  detail: string;
} {
  const packageLabel = marketPackageLabel(event);
  if (awaitsIntakeReview(event.lifecycle))
    return {
      label: "Review intake",
      detail: "Review the recorded request and its approval state.",
    };
  if (event.lifecycle !== "active")
    return {
      label: "Open event",
      detail: `Current stage: ${sourceNewStageLabel(event.currentStage)}`,
    };
  if (
    ["strategy", "scope", "sourcing_strategy", "intake"].includes(
      event.currentStage,
    )
  )
    return {
      label: "Open scope and strategy",
      detail:
        "Review scope, baseline and decision requirements in the governed event.",
    };
  if (["rfp", "rfp_rfi_package"].includes(event.currentStage))
    return {
      label:
        packageLabel === "Market package"
          ? "Open market package"
          : `Open ${packageLabel}`,
      detail:
        packageLabel === "Market package"
          ? "Review the package and its release requirements in the governed event."
          : `Review the ${packageLabel} and its release requirements in the governed event.`,
    };
  return {
    label: "Open current stage",
    detail: `Current stage: ${sourceNewStageLabel(event.currentStage)}`,
  };
}

export type SourceNewWorkspaceProps = {
  event: SourceNewEventView;
  files: readonly SourceNewFileRow[];
  /**
   * The governed decision trail. Optional so existing callers and tests that
   * do not read it still compile; when absent the approvals view says the
   * trail was not loaded rather than implying there is nothing to show.
   */
  activity?: SourceEventActivityResult;
  intelligence?: SourceNewEventIntelligenceView;
  /** Required server projection; an unreadable registry is data, not absence. */
  stage05NdaCoverage: SourceNewStage05NdaCoverage;
};

export function SourceNewWorkspace({
  event,
  files,
  activity,
  intelligence,
  stage05NdaCoverage,
}: SourceNewWorkspaceProps) {
  const evidence = useMemo(
    () => phaseEvidence(event, files, stage05NdaCoverage),
    [event, files, stage05NdaCoverage],
  );
  const stateOf = (item: Phase): SourceNewPhaseState =>
    sourceNewPhaseState(item, event, evidence);
  const current = sourceNewCurrentPhase(event);
  // An event past these phases opens on the last one it can show, not on a
  // phase the rail would otherwise present as the live one.
  const [phase, setPhase] = useState<Phase>(
    () => sourceNewCurrentPhase(event) ?? "rfi",
  );
  const [view, setView] = useState<View>("work");
  const reviewPending = awaitsIntakeReview(event.lifecycle);
  const completedEvent = isCompletedEvent(event);
  const phases = phasesFor(event);
  const packageLabel = marketPackageLabel(event);
  // With no phase current, the rail shows no live step. Say where the event
  // actually is rather than leaving the operator to infer it.
  const advancedBeyondPhases = current === null && isPastSourceNewPhases(event);
  const category = sourceNewCategoryDisplay(event.category);
  const advancedNote = `This event has moved past the phases shown here. Its current stage is ${sourceNewStageLabel(event.currentStage)}.`;
  const completedNote = `This event is completed. Final stage: ${sourceNewStageLabel(event.currentStage)}.`;
  const approvalHref = `/source/events/${encodeURIComponent(event.id)}/approval`;
  const eventHref = `/source/events/${encodeURIComponent(event.id)}`;
  const actionHref = reviewPending ? approvalHref : eventHref;
  const action = nextAction(event);
  const actionLabel = action.label;
  const isCurrentPhase = phase === current;
  const responsesStage = isResponsesStage(event);
  const responseRows = responseEvidenceRows(files);
  const content = (
    <main className="snw" aria-label="Source New event workspace">
      <div className="snw-inner">
        <div className="snw-crumb">
          <Link href="/source/new">Source New</Link>
          <span>/</span>
          <span>{event.code}</span>
        </div>
        <header className="snw-heading">
          <div>
            <h1>{event.name}</h1>
            <p>
              {event.clientName} · {sourceNewEventTypeLabel(event.eventType)}
            </p>
          </div>
          <span
            className={`snw-event-state ${event.lifecycle === "active" ? "is-active" : ""}`}
          >
            {sourceNewLifecycleLabel(event.lifecycle)}
          </span>
        </header>

        <nav className="snw-phases" aria-label="Event phases">
          {phases.map((item, index) => (
            <button
              key={item.key}
              type="button"
              aria-current={phase === item.key ? "step" : undefined}
              onClick={() => {
                setPhase(item.key);
                setView("work");
              }}
            >
              <span className="snw-phase-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="snw-phase-copy">
                <strong>{item.label}</strong>
                <small>{sourceNewPhaseStateLabel(stateOf(item.key))}</small>
              </span>
            </button>
          ))}
        </nav>

        <nav className="snw-views" aria-label="Workspace views">
          {VIEWS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-current={view === item.key ? "page" : undefined}
              onClick={() => setView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {view === "work" && (
          <div className="snw-work">
            <section className="snw-main-work">
              <p className="snw-eyebrow">
                {phases.find((item) => item.key === phase)?.label}
              </p>
              {isCurrentPhase ? (
                <>
                  <h2>
                    {reviewPending
                      ? "Confirm this request"
                      : "Continue the governed event"}
                  </h2>
                  <p className="snw-lede">
                    {reviewPending
                      ? "The request is recorded. Review its facts and approval before opening supplier work."
                      : "The current event stage owns the next decision and evidence gate."}
                  </p>
                  <div className="snw-known">
                    <h3>What is recorded</h3>
                    <dl>
                      <div>
                        <dt>Need</dt>
                        <dd>{fact(event.trigger)}</dd>
                      </div>
                      <div>
                        <dt>Scope</dt>
                        <dd>{fact(event.scope)}</dd>
                      </div>
                      <div>
                        <dt>Decision owner</dt>
                        <dd>{fact(event.decisionOwner)}</dd>
                      </div>
                    </dl>
                  </div>
                </>
              ) : stateOf(phase) === "not_open" ? (
                <>
                  <h2>This phase is not yet open</h2>
                  <p className="snw-lede">
                    The event has not reached this phase. Earlier gates must be
                    cleared before this work can begin. Browsing here does not
                    advance the event.
                  </p>
                </>
              ) : stateOf(phase) === "no_record" ? (
                <>
                  <h2>Nothing is recorded in this phase</h2>
                  <p className="snw-lede">
                    The event moved past this phase without recording anything
                    here. That is a gap in the record, not completed work, and
                    nothing on this screen changes it.
                  </p>
                  {advancedBeyondPhases && (
                    <p className="snw-note">
                      {completedEvent ? completedNote : advancedNote}
                    </p>
                  )}
                  {responsesStage && (
                    <SourceNewStage04VendorReadiness
                      event={event}
                      responseRows={responseRows}
                    />
                  )}
                  {phase === "suppliers" && (
                    <SourceNewStage05NdaReadiness
                      coverage={stage05NdaCoverage}
                      eventHref={eventHref}
                    />
                  )}
                </>
              ) : (
                <>
                  <h2>Recorded earlier in this event</h2>
                  <p className="snw-lede">
                    This phase holds recorded work. Viewing it does not mark it
                    complete, approve any gate, or change the current stage.
                  </p>
                  {advancedBeyondPhases && (
                    <p className="snw-note">
                      {completedEvent ? completedNote : advancedNote}
                    </p>
                  )}
                  {responsesStage && (
                    <SourceNewStage04VendorReadiness
                      event={event}
                      responseRows={responseRows}
                    />
                  )}
                  {phase === "suppliers" && (
                    <SourceNewStage05NdaReadiness
                      coverage={stage05NdaCoverage}
                      eventHref={eventHref}
                    />
                  )}
                </>
              )}
            </section>
            <aside
              className="snw-next"
              aria-label={completedEvent ? "Event status" : "Next action"}
            >
              <p className="snw-eyebrow">
                {completedEvent ? "Event status" : "Next action"}
              </p>
              <h2>
                {completedEvent
                  ? "Event completed"
                  : current === null
                    ? actionLabel
                    : isCurrentPhase
                      ? actionLabel
                      : "Return to current work"}
              </h2>
              <p>
                {completedEvent
                  ? "The governed event is complete. No next action is pending in Source New."
                  : current === null || isCurrentPhase
                    ? action.detail
                    : stateOf(phase) === "not_open"
                      ? "This phase is locked. The event must advance to open it."
                      : "You are reviewing a phase the event has moved past. No gate is changed here."}
              </p>
              {completedEvent ? null : current === null || isCurrentPhase ? (
                <Link className="snw-primary" href={actionHref}>
                  {actionLabel}
                </Link>
              ) : (
                <button
                  className="snw-primary"
                  type="button"
                  onClick={() => setPhase(current)}
                >
                  Current work
                </button>
              )}
            </aside>
          </div>
        )}

        {view === "files" && (
          <section className="snw-panel">
            <SourceNewFiles
              rows={files}
              initialPhase={phase}
              marketPackageLabel={packageLabel}
              onDownload={(file) => {
                window.location.href = sourceNewFileDownloadHref(file);
              }}
            />
          </section>
        )}
        {view === "intelligence" && (
          <SourceNewIntelligenceWorkspace
            categoryText={category.text}
            categoryNote={category.note}
            eventHref={eventHref}
            intelligence={intelligence}
          />
        )}
        {view === "approvals" && (
          <section className="snw-panel snw-plain">
            <p className="snw-eyebrow">Governed decision</p>
            <h2>
              {reviewPending
                ? "Review is still required"
                : sourceNewLifecycleLabel(event.lifecycle)}
            </h2>
            <p className="snw-lede">
              This overview does not approve or advance anything. The decisions
              recorded against this event are below; approving happens in the
              governed event flow.
            </p>
            <Link className="snw-primary" href={actionHref}>
              {reviewPending ? "Open approval" : "Open event"}
            </Link>
            <SourceNewDecisionTrail activity={activity} />
          </section>
        )}
      </div>
    </main>
  );

  return (
    <AppShell
      surface="source-detail"
      hasTenantKey
      surfaceContext={{
        sourceEventId: event.id,
        clientKey: event.clientKey,
        sourceStage: event.currentStage,
        sourceLifecycle: event.lifecycle,
      }}
      topBarProps={{
        tenantName: event.clientName,
        showLocked: true,
        context: "Source New",
      }}
    >
      <SourceNewAvaDock event={event} workspace={content} />
    </AppShell>
  );
}

function SourceNewStage04VendorReadiness({
  event,
  responseRows,
}: {
  event: SourceNewEventView;
  responseRows: readonly SourceNewFileRow[];
}) {
  const motionAccepted = hasAcceptedSolicitationMotion(event);
  const motionLabel =
    event.solicitationMotion === "rfp"
      ? "RFP"
      : event.solicitationMotion === "rfi"
        ? "RFI"
        : "Market package";
  const blockers = [
    !motionAccepted
      ? "No accepted solicitation motion is recorded for this event."
      : null,
    responseRows.length === 0
      ? "No tenant-scoped candidate response files are loaded in Source New."
      : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <section
      className="snw-vendor-readiness"
      aria-label="Stage 04 vendor readiness"
    >
      <p className="snw-eyebrow">Stage 04 · Vendor responses</p>
      <h3>Candidate response readiness</h3>
      <p>
        This checks whether candidate response evidence is ready for evaluation.
        It is not award readiness, and it does not select, contact, or notify
        any vendor.
      </p>
      <dl className="snw-facts">
        <div>
          <dt>Tenant scope</dt>
          <dd>{event.clientName}</dd>
        </div>
        <div>
          <dt>Solicitation motion</dt>
          <dd>
            {motionAccepted
              ? `${motionLabel} accepted for release`
              : "Not accepted for release"}
          </dd>
        </div>
        <div>
          <dt>Candidate response evidence</dt>
          <dd>
            {responseRows.length > 0
              ? `${responseRows.length} tenant-scoped response file${
                  responseRows.length === 1 ? "" : "s"
                } available`
              : "No tenant-scoped candidate response files loaded"}
          </dd>
        </div>
        <div>
          <dt>Readiness posture</dt>
          <dd>
            {blockers.length === 0
              ? "Ready for evaluation intake review"
              : "Blocked before evaluation"}
          </dd>
        </div>
      </dl>
      <div className="snw-vendor-readiness-blockers">
        <strong>Open blockers</strong>
        <ul>
          {blockers.length > 0 ? (
            blockers.map((blocker) => <li key={blocker}>{blocker}</li>)
          ) : (
            <li>
              Candidate response evidence is present for evaluation review.
            </li>
          )}
        </ul>
      </div>
      <p className="snw-note">
        Vendor contact, send, and notification actions stay unavailable until a
        verified participant authority record exists in the governed event.
      </p>
    </section>
  );
}

function SourceNewStage05NdaReadiness({
  coverage,
  eventHref,
}: {
  coverage: SourceNewStage05NdaCoverage;
  eventHref: string;
}) {
  const posture =
    coverage.status === "ready"
      ? "Ready for governed supplier work"
      : coverage.status === "empty"
        ? "No accepted supplier panel"
        : "Blocked before supplier work";
  return (
    <section className="snw-nda-readiness" aria-label="Stage 05 NDA readiness">
      <p className="snw-eyebrow">Stage 05 · NDA readiness</p>
      <h3>Supplier NDA coverage</h3>
      <p>
        This read-only check summarizes existing NDA evidence. It does not send
        supplier communications, approve legal terms, or infer supplier identity
        from filenames.
      </p>
      <dl className="snw-facts">
        <div>
          <dt>Accepted suppliers</dt>
          <dd>{coverage.suppliers.length}</dd>
        </div>
        <div>
          <dt>Covered</dt>
          <dd>{coverage.suppliers.filter((supplier) =>
            supplier.state === "covered_by_nda" || supplier.state === "covered_by_waiver"
          ).length}</dd>
        </div>
        <div>
          <dt>Blocked or unknown</dt>
          <dd>{coverage.suppliers.filter((supplier) =>
            supplier.state === "not_covered" || supplier.state === "unavailable"
          ).length}</dd>
        </div>
        <div>
          <dt>Readiness as of</dt>
          <dd>{coverage.asOf}</dd>
        </div>
        <div>
          <dt>Readiness posture</dt>
          <dd>{posture}</dd>
        </div>
      </dl>
      {coverage.suppliers.length > 0 ? (
        <div className="snw-nda-suppliers" role="list" aria-label="Supplier NDA coverage">
          {coverage.suppliers.map((supplier) => (
            <article key={supplier.legalEntityId} role="listitem">
              <div className="snw-nda-supplier-heading">
                <strong>{supplier.legalName}</strong>
                <span data-state={supplier.state}>
                  {supplier.state === "covered_by_nda"
                    ? "Executed NDA"
                    : supplier.state === "covered_by_waiver"
                      ? "Legal waiver"
                      : supplier.state === "unavailable"
                        ? "Authority unavailable"
                        : "Not covered"}
                </span>
              </div>
              <p>{supplier.reason}</p>
              <dl>
                <div>
                  <dt>Candidate evidence</dt>
                  <dd>{supplier.evidenceReference}</dd>
                </div>
                <div>
                  <dt>NDA authority</dt>
                  <dd>{supplier.authorityReference ?? "Not recorded"}</dd>
                </div>
              </dl>
              {supplier.evidenceCaveats.map((caveat) => (
                <p className="snw-note" key={caveat}>{caveat}</p>
              ))}
            </article>
          ))}
        </div>
      ) : (
        <p className="snw-note">
          {coverage.status === "unavailable"
            ? "Candidate-panel authority is unavailable; an empty result is not assumed."
            : "No supplier has explicit candidate-panel acceptance for this event."}
        </p>
      )}
      <div className="snw-nda-next">
        <strong>{coverage.nextAction.label}</strong>
        <p>{coverage.nextAction.detail}</p>
        <Link className="snw-text-action" href={eventHref}>
          Open governed event
        </Link>
      </div>
    </section>
  );
}

function SourceNewIntelligenceWorkspace({
  categoryText,
  categoryNote,
  eventHref,
  intelligence,
}: {
  categoryText: string;
  categoryNote?: string | null;
  eventHref: string;
  intelligence?: SourceNewEventIntelligenceView;
}) {
  const humanizeToken = (value: string): string => {
    if (value === "pct_per_year") return "% per year";
    return value
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .toLowerCase();
  };
  const evidenceFamilyLabel = (family: string): string =>
    intelligence?.requiredEvidence.find((item) => item.key === family)?.label ??
    humanizeToken(family);

  if (!intelligence) {
    return (
      <section className="snw-panel snw-plain">
        <p className="snw-eyebrow">Decision support</p>
        <h2>What can inform this event</h2>
        <dl className="snw-facts">
          <div>
            <dt>Classified category</dt>
            <dd>{categoryText}</dd>
          </div>
          <div>
            <dt>Evidence basis</dt>
            <dd>Evidence readiness is not available on this view yet.</dd>
          </div>
        </dl>
        {categoryNote && <p className="snw-note">{categoryNote}</p>}
        <p className="snw-note">
          A category alone is not a benchmark, savings claim or supplier
          recommendation.
        </p>
        <Link className="snw-text-action" href={eventHref}>
          View current stage
        </Link>
      </section>
    );
  }

  return (
    <section
      className="snw-panel snw-intelligence"
      aria-label="Event intelligence workspace"
    >
      <div className="snw-intel-heading">
        <div>
          <p className="snw-eyebrow">Decision support</p>
          <h2>Event intelligence workspace</h2>
          <p className="snw-lede">
            See what Source can use now, what evidence is still missing, and the
            next question to resolve. This view does not estimate savings,
            select suppliers, or contact anyone.
          </p>
        </div>
        <span className={`snw-intel-posture is-${intelligence.posture}`}>
          {intelligence.posture}
        </span>
      </div>

      <dl className="snw-facts snw-intel-facts">
        <div>
          <dt>Archetype</dt>
          <dd>{intelligence.archetype.name}</dd>
        </div>
        <div>
          <dt>Why this playbook</dt>
          <dd>
            Matched from the event&apos;s recorded category and sourcing motion.
          </dd>
        </div>
        <div>
          <dt>Evidence readiness</dt>
          <dd>
            {intelligence.governedContext.usableCount} ready ·{" "}
            {intelligence.governedContext.blockedCount} needs review
          </dd>
        </div>
      </dl>

      <div className="snw-intel-grid">
        <section>
          <h3>Required evidence</h3>
          <ul className="snw-intel-list">
            {intelligence.requiredEvidence.length > 0 ? (
              intelligence.requiredEvidence.map((item) => (
                <li key={item.key}>
                  <span className={`snw-intel-state is-${item.state}`}>
                    {item.state === "available" ? "ready" : "needed"}
                  </span>
                  <strong>{item.label}</strong>
                  <small>
                    {item.severity === "hard" ? "required" : "helpful"} ·{" "}
                    {item.sourceDocHint}
                  </small>
                  <p>{item.whyNeeded}</p>
                </li>
              ))
            ) : (
              <li>
                <strong>
                  No stage-specific evidence contract is available.
                </strong>
                <p>
                  The event needs a resolved archetype before evidence can be
                  scored.
                </p>
              </li>
            )}
          </ul>
        </section>

        <section>
          <h3>Evidence ready to use</h3>
          <ul className="snw-intel-list">
            {intelligence.governedContext.available.length > 0 ? (
              intelligence.governedContext.available.map((item) => (
                <li key={item.id}>
                  <span className="snw-intel-state is-available">ready</span>
                  <strong>{item.title}</strong>
                  <small>Cited and retrievable</small>
                  <p>
                    {item.evidenceFamilies.length > 0
                      ? item.evidenceFamilies
                          .map(evidenceFamilyLabel)
                          .join(", ")
                      : "No evidence family labels recorded."}
                  </p>
                </li>
              ))
            ) : (
              <li>
                <strong>No evidence is ready yet.</strong>
                <p>
                  Review the loaded files and complete their evidence checks.
                </p>
              </li>
            )}
          </ul>
        </section>
      </div>

      <div className="snw-intel-grid">
        <section>
          <h3>What is missing</h3>
          <ul className="snw-intel-plain-list">
            {intelligence.gaps.length > 0 ? (
              intelligence.gaps.map((gap) => <li key={gap}>{gap}</li>)
            ) : (
              <li>No unresolved evidence gap is visible.</li>
            )}
          </ul>
        </section>
        <section>
          <h3>What Source can say now</h3>
          <p className="snw-intel-allowed">{intelligence.allowedStatement}</p>
          <ul className="snw-intel-plain-list">
            {intelligence.refusals.length > 0 ? (
              intelligence.refusals.map((refusal) => (
                <li key={refusal}>{refusal}</li>
              ))
            ) : (
              <li>No evidence was excluded.</li>
            )}
          </ul>
        </section>
      </div>

      <section className="snw-intel-next" aria-label="Intelligence next action">
        <p className="snw-eyebrow">Next question</p>
        <h3>{intelligence.nextQuestion}</h3>
        <p>
          <strong>{intelligence.nextAction.label}.</strong>{" "}
          {intelligence.nextAction.detail}
        </p>
        <Link className="snw-primary" href={eventHref}>
          {intelligence.nextAction.label}
        </Link>
      </section>

      {intelligence.industryMetrics.length > 0 && (
        <section
          className="snw-intel-market"
          aria-label="Industry reference requirements"
        >
          <h3>Industry reference requirements</h3>
          <ul className="snw-intel-plain-list">
            {intelligence.industryMetrics.map((metric) => (
              <li key={metric.key}>
                {metric.label} ({humanizeToken(metric.unit)}) requires{" "}
                {metric.requiredComparability.map(humanizeToken).join(", ")}.
                Source options include{" "}
                {metric.sourceAuthorities.map(humanizeToken).join(", ")}.
              </li>
            ))}
          </ul>
          <p className="snw-note">
            These are requirements for a fair comparison, not benchmark values.
            Source shows a number only when the supporting observations are
            ready to cite.
          </p>
        </section>
      )}
    </section>
  );
}

/**
 * The governed decision trail for an event.
 *
 * Three states, kept distinct on purpose. "No decisions recorded yet" and "we
 * could not read the decision log" are different facts, and on an approval
 * surface collapsing them into an empty list states the reassuring one. The
 * reader returns a discriminated result so this component cannot guess.
 */
function SourceNewDecisionTrail({
  activity,
}: {
  activity?: SourceEventActivityResult;
}) {
  if (!activity) {
    return (
      <p className="snw-trail-note" data-decision-trail="not-loaded">
        The decision trail was not loaded on this view.
      </p>
    );
  }
  if (!activity.ok) {
    return (
      <p
        className="snw-trail-note snw-trail-error"
        data-decision-trail="unavailable"
      >
        The decision trail could not be read, so this is not a statement that no
        decisions were recorded. Open the governed event to see the record.
      </p>
    );
  }
  const entries = Array.isArray(activity.entries) ? activity.entries : null;
  if (!entries) {
    return (
      <p
        className="snw-trail-note snw-trail-error"
        data-decision-trail="unavailable"
      >
        The decision trail could not be read, so this is not a statement that no
        decisions were recorded. Open the governed event to see the record.
      </p>
    );
  }
  if (entries.length === 0) {
    return (
      <p className="snw-trail-note" data-decision-trail="empty">
        No decisions have been recorded against this event yet.
      </p>
    );
  }
  return (
    <ol
      className="snw-trail"
      data-decision-trail="entries"
      aria-label="Decision trail"
    >
      {entries.map((entry) => (
        <li key={entry.id}>
          <span className="snw-trail-actor">
            {entry.actor ?? "Actor not recorded"}
          </span>
          <span className="snw-trail-body">{entry.body}</span>
          <time className="snw-trail-at" dateTime={String(entry.at ?? "")}>
            {String(entry.at ?? "")}
          </time>
        </li>
      ))}
    </ol>
  );
}

function SourceNewAvaDock({
  event,
  workspace,
}: {
  event: SourceNewEventView;
  workspace: ReactNode;
}) {
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
  const thread: ChatMessage[] = useMemo(
    () =>
      pageState?.conversation.map((turn) => ({
        id: turn.id,
        role: turn.role,
        body: turn.text,
        at: new Date(turn.timestamp).toISOString(),
      })) ?? [],
    [pageState?.conversation],
  );

  return (
    <AgentDock
      key={compact ? "compact" : "wide"}
      agent={{
        initials: "aVa",
        mark: "ava",
        name: "aVa",
        role: "Sourcing advisor",
      }}
      surface="source/new-workspace"
      defaultMode={compact ? "collapsed" : "side-rail"}
      disableStoredMode={compact}
      collapsedRestoreMode={compact ? "expand" : undefined}
      defaultLeftPercent={23}
      minLeftPx={245}
      surfaceContext={{
        sourceEventId: event.id,
        clientKey: event.clientKey,
        sourceStage: event.currentStage,
      }}
      initialQuote={`Ask about the current Source step for ${event.name}.`}
      thread={thread}
      onMessage={(text, attachments) => {
        const message = [
          text.trim(),
          ...attachments.map(
            (file) => `[Attached evidence: ${file.file_name} (${file.id})]`,
          ),
        ]
          .filter(Boolean)
          .join("\n");
        if (message) pageState?.ask(message);
      }}
      workspace={workspace}
    />
  );
}

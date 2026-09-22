"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { AgentDock, type ChatMessage } from "@/components/agent/AgentDock";
import { useAtlasPageState } from "@/components/shell/AtlasPageStateProvider";
import { SourceNewFiles, type SourceNewFileRow } from "./SourceNewFiles";
import type { SourceEventActivityResult } from "@/lib/source/activity-log";
import type { AskSource } from "@/lib/intelligence/ask/types";
import type { AnswerCitation } from "@/lib/ava-answer/contract";
import {
  SOURCE_NEW_PHASE_DISPLAY_LABELS,
  SOURCE_NEW_PHASE_ORDER,
  awaitsIntakeReview,
  isPastSourceNewPhases,
  sourceNewCategoryDisplay,
  sourceNewCurrentPhase,
  sourceNewEventTypeLabel,
  sourceNewHistoricalGapPhases,
  sourceNewLifecycleLabel,
  sourceNewMarketPackageLabel,
  sourceNewNextAction,
  sourceNewPhaseState,
  sourceNewPhaseStateLabel,
  sourceNewStageLabel,
  type SourceNewPhaseEvidence,
  type SourceNewPhaseKey,
  type SourceNewPhaseState,
} from "@/lib/source/new-workspace/phase-state";
import { normalizeSourceStageKey } from "@/lib/source/constants";
import type { SourceNewEventIntelligenceView } from "@/lib/source/new-workspace/event-intelligence";
import type { SourceNewResponseIntake } from "@/lib/source/new-workspace/response-intake";
import {
  buildHistoricalRequestSummary,
  type HistoricalRequestSummary,
} from "@/lib/source/new-workspace/historical-request-summary";
import type { SourceNewStage04VendorPanel } from "@/lib/source/new-workspace/stage04-vendor-panel";
import type { SourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";
import type { ScorecardAuthorityView } from "@/lib/source/proposal-intelligence";
import "./workspace.css";

type Phase = SourceNewPhaseKey;
type View = "work" | "files" | "intelligence" | "approvals";
type IntelligenceEvidenceItem =
  NonNullable<SourceNewEventIntelligenceView>["requiredEvidence"][number];
type ActivityTrailEntry = Extract<
  SourceEventActivityResult,
  { ok: true }
>["entries"][number];

function sourceNewAskSourceTypeFromCitation(
  sourceClass: AnswerCitation["sourceClass"],
): AskSource["type"] {
  switch (sourceClass) {
    case "tenant-fact":
    case "tenant-chunk":
      return "TENANT";
    case "graph":
      return "GRAPH";
    case "corpus-pattern":
      return "PATTERN";
    case "worldview":
      return "WORLDVIEW";
    default:
      return "GENERAL";
  }
}

function sourceNewAskSourcesFromCitations(
  citations: readonly AnswerCitation[] | undefined,
): AskSource[] | undefined {
  if (!citations || citations.length === 0) return undefined;
  return citations.map((citation) => ({
    id: citation.id,
    type: sourceNewAskSourceTypeFromCitation(citation.sourceClass),
    name: citation.label,
    detail: citation.excerpt ?? "",
    url: citation.url,
    confidence:
      citation.confidence === "high"
        ? 0.9
        : citation.confidence === "medium"
          ? 0.65
          : 0.35,
  }));
}

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
  /**
   * Request-version authority from the persisted store. `null`/absent means
   * the authority could not be read — not that no acceptance exists. The two
   * render differently and only one of them is a blocker.
   */
  requestVersionApproval?: "accepted" | "pending" | "changes_requested" | null;
  /** Current immutable Request authority version used to fence Stage 04 writes. */
  requestAuthorityVersionId?: string | null;
}

const VIEWS: readonly { key: View; label: string }[] = [
  { key: "work", label: "Work" },
  { key: "files", label: "Files" },
  { key: "intelligence", label: "Intelligence" },
  { key: "approvals", label: "Approvals" },
];

const PREVIEW_UNMET_CONDITIONS: Record<Phase, string> = {
  request: "the request must be recorded and accepted for review.",
  define: "intake approval must be recorded.",
  suppliers:
    "scope and strategy must advance, then supplier eligibility and required NDA coverage must be recorded.",
  rfi: "scope, supplier eligibility, and required NDA coverage must be ready.",
};
const INTELLIGENCE_LIST_PREVIEW_COUNT = 5;
const DECISION_TRAIL_PREVIEW_COUNT = 6;

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

function eligibilityLabel(
  eligibility: SourceNewStage04VendorPanel["rows"][number]["eligibility"],
): string {
  const values = [
    ...(eligibility?.categoryKeys ?? []),
    ...(eligibility?.functionKeys ?? []),
    ...(eligibility?.archetypeKeys ?? []),
  ].filter((value) => value.trim());
  return values.length > 0 ? values.join(" / ") : "Not recorded";
}

function contactPolicyLabel(
  policy: SourceNewStage04VendorPanel["rows"][number]["contactPolicy"],
): string {
  if (policy === "contact_allowed") return "contact allowed";
  if (policy === "review_required") return "review required";
  if (policy === "do_not_contact") return "do not contact";
  return "Not recorded";
}

function sourceReferencesLabel(
  row: SourceNewStage04VendorPanel["rows"][number],
): string {
  const values =
    row.sourceReferences && row.sourceReferences.length > 0
      ? row.sourceReferences
      : [row.evidenceReference];
  return values.join("; ");
}

function vendorPanelGroupLabel(
  group: SourceNewStage04VendorPanel["rows"][number]["group"],
): string {
  if (group === "selected_respondent") return "selected respondent";
  if (group === "existing_contract_vendor") return "already under contract";
  return "not under contract";
}

function isResponsesStage(event: SourceNewEventView): boolean {
  return normalizeSourceStageKey(event.currentStage) === "responses";
}

function isScorecardAuthorityStage(event: SourceNewEventView): boolean {
  const stage = normalizeSourceStageKey(event.currentStage);
  return stage === "evaluation" || stage === "bafo";
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

function SourceNewHistoricalRequestSummary({
  summary,
}: {
  summary: HistoricalRequestSummary;
}) {
  const facts = (rows: readonly HistoricalRequestSummary["requestFacts"][number][]) => (
    <dl>
      {rows.map((row) => (
        <div key={row.key}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <section className="snw-known" aria-label="Historical Request summary">
      <h3>Request record</h3>
      {facts(summary.requestFacts)}
      {summary.originFacts.length > 0 && (
        <>
          <h3>Intake authority</h3>
          {facts(summary.originFacts)}
        </>
      )}
      {summary.mappingFacts.length > 0 && (
        <>
          <h3>Mapping authority</h3>
          {facts(summary.mappingFacts)}
        </>
      )}
      {summary.mappingGap && <p className="snw-note">{summary.mappingGap}</p>}
    </section>
  );
}

function phasesFor(
  event: SourceNewEventView,
): readonly { key: Phase; label: string }[] {
  const packageLabel = sourceNewMarketPackageLabel(event);
  // The rail order is the shared one, so the rail and the state resolver can
  // never disagree about which phase is behind which.
  return SOURCE_NEW_PHASE_ORDER.map((key) => ({
    key,
    label: key === "rfi" ? packageLabel : SOURCE_NEW_PHASE_DISPLAY_LABELS[key],
  }));
}

export function sourceNewFileDownloadHref(
  file: Pick<SourceNewFileRow, "id" | "lifecycleState">,
): string {
  const base = `/api/v1/source/artifacts/${encodeURIComponent(file.id)}/download`;
  return file.lifecycleState === "current" ? base : `${base}?includeHistory=1`;
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
  stage04VendorPanel: SourceNewStage04VendorPanel;
  stage05NdaCoverage: SourceNewStage05NdaCoverage;
  /** Required server projection; missing scorecard authority must fail closed. */
  scorecardAuthority: ScorecardAuthorityView;
  /** Responses-stage supplier workbook intake projection. */
  responseIntake?: SourceNewResponseIntake;
  /** Governed summary for the historical Request phase. */
  historicalRequestSummary?: HistoricalRequestSummary;
};

export function SourceNewWorkspace({
  event,
  files,
  activity,
  intelligence,
  stage04VendorPanel,
  stage05NdaCoverage,
  scorecardAuthority,
  responseIntake,
  historicalRequestSummary,
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
  const historicalGapPhases = sourceNewHistoricalGapPhases(event, evidence);
  const completionReviewNeeded = historicalGapPhases.length > 0;
  const phases = phasesFor(event);
  const packageLabel = sourceNewMarketPackageLabel(event);
  // With no phase current, the rail shows no live step. Say where the event
  // actually is rather than leaving the operator to infer it.
  const advancedBeyondPhases = current === null && isPastSourceNewPhases(event);
  const category = sourceNewCategoryDisplay(event.category);
  const advancedNote = `This event has moved past the phases shown here. Its current stage is ${sourceNewStageLabel(event.currentStage)}.`;
  const completedNote = `This event is completed. Final stage: ${sourceNewStageLabel(event.currentStage)}.`;
  const approvalHref = `/source/events/${encodeURIComponent(event.id)}/approval`;
  const eventHref = `/source/events/${encodeURIComponent(event.id)}`;
  const actionHref = reviewPending ? approvalHref : eventHref;
  const action = sourceNewNextAction(event);
  const actionLabel = action.label;
  const isCurrentPhase = phase === current;
  const responsesStage = isResponsesStage(event);
  const scorecardAuthorityStage = isScorecardAuthorityStage(event);
  const responseRows = responseEvidenceRows(files);
  const requestSummary =
    historicalRequestSummary ??
    buildHistoricalRequestSummary({
      event: {
        trigger: event.trigger,
        scope: event.scope,
        category: event.category,
        decisionOwner: event.decisionOwner,
      },
      origin: null,
    });
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
                  <p className="snw-note">
                    Before this phase can open:{" "}
                    {PREVIEW_UNMET_CONDITIONS[phase]}
                  </p>
                </>
              ) : stateOf(phase) === "historical_gap" ? (
                <>
                  <h2>Governed history is missing for this phase</h2>
                  <p className="snw-lede">
                    The completed event has no governed evidence recorded for
                    this phase. Record the missing evidence or a named waiver
                    before treating this history as complete.
                  </p>
                  <p className="snw-note">{completedNote}</p>
                  {phase === "suppliers" && (
                    <SourceNewStage04VendorPanelView
                      event={event}
                      panel={stage04VendorPanel}
                    />
                  )}
                  {phase === "suppliers" && (
                    <SourceNewStage05NdaReadiness
                      coverage={stage05NdaCoverage}
                      eventHref={eventHref}
                    />
                  )}
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
                    responseIntake ? (
                      <SourceNewResponseIntakePanel intake={responseIntake} />
                    ) : (
                      <SourceNewStage04VendorReadiness
                        event={event}
                        responseRows={responseRows}
                      />
                    )
                  )}
                  {phase === "suppliers" && (
                    <SourceNewStage04VendorPanelView
                      event={event}
                      panel={stage04VendorPanel}
                    />
                  )}
                  {phase === "suppliers" && (
                    <SourceNewStage05NdaReadiness
                      coverage={stage05NdaCoverage}
                      eventHref={eventHref}
                    />
                  )}
                  {scorecardAuthorityStage && (
                    <SourceNewStage07ScorecardAuthority
                      authority={scorecardAuthority}
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
                  {phase === "request" && (
                    <SourceNewHistoricalRequestSummary summary={requestSummary} />
                  )}
                  {advancedBeyondPhases && (
                    <p className="snw-note">
                      {completedEvent ? completedNote : advancedNote}
                    </p>
                  )}
                  {responsesStage && (
                    responseIntake ? (
                      <SourceNewResponseIntakePanel intake={responseIntake} />
                    ) : (
                      <SourceNewStage04VendorReadiness
                        event={event}
                        responseRows={responseRows}
                      />
                    )
                  )}
                  {phase === "suppliers" && (
                    <SourceNewStage04VendorPanelView
                      event={event}
                      panel={stage04VendorPanel}
                    />
                  )}
                  {phase === "suppliers" && (
                    <SourceNewStage05NdaReadiness
                      coverage={stage05NdaCoverage}
                      eventHref={eventHref}
                    />
                  )}
                  {scorecardAuthorityStage && (
                    <SourceNewStage07ScorecardAuthority
                      authority={scorecardAuthority}
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
                  ? completionReviewNeeded
                    ? "Completion review needed"
                    : "Event completed"
                  : current === null
                    ? actionLabel
                    : isCurrentPhase
                      ? actionLabel
                      : "Return to current work"}
              </h2>
              <p>
                {completedEvent
                  ? completionReviewNeeded
                    ? `${historicalGapPhases.length} ${historicalGapPhases.length === 1 ? "phase has" : "phases have"} no governed history. Record the missing evidence or a named waiver before treating the event record as complete.`
                    : "The governed event is complete. No next action is pending in Source New."
                  : current === null || isCurrentPhase
                    ? action.detail
                    : stateOf(phase) === "not_open"
                      ? "This phase is locked. The event must advance to open it."
                      : "You are reviewing a phase the event has moved past. No gate is changed here."}
              </p>
              {completedEvent ? (
                completionReviewNeeded ? (
                  <Link className="snw-primary" href={eventHref}>
                    Resolve historical gaps
                  </Link>
                ) : null
              ) : current === null || isCurrentPhase ? (
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
    // Only an explicit negative becomes a blocker. An unreadable authority
    // (null) is reported as unread, never as a refusal: absence is not a
    // decision, and a surface that turns "cannot read" into "changes
    // requested" tells the client something nobody decided.
    event.requestVersionApproval === "changes_requested"
      ? "Changes are requested on the current Request version."
      : null,
  ].filter((item): item is string => Boolean(item));

  const requestAuthorityLabel =
    event.requestVersionApproval === "accepted"
      ? "Request version accepted"
      : event.requestVersionApproval === "pending"
        ? "Request acceptance pending"
        : event.requestVersionApproval === "changes_requested"
          ? "Changes requested on the Request version"
          : "Not recorded";

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
          <dt>Request authority</dt>
          <dd>{requestAuthorityLabel}</dd>
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

function stateLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SourceNewResponseIntakePanel({
  intake,
}: {
  intake: SourceNewResponseIntake;
}) {
  const firstSupplier = intake.rows[0] ?? null;
  return (
    <section
      className="snw-response-intake"
      aria-label="Vendor response intake"
    >
      <p className="snw-eyebrow">Responses · Intake</p>
      <h3>Vendor response intake</h3>
      <p>
        Select one accepted fictional supplier and upload that supplier&apos;s
        synthetic response workbook. This surface records intake state only: it
        does not contact suppliers, score responses, approve evaluation, or
        create an award recommendation.
      </p>
      {intake.status === "blocked" ? (
        <div className="snw-vendor-readiness-blockers">
          <strong>Readback blocked</strong>
          <ul>
            {intake.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <form
            className="snw-response-upload"
            action={intake.uploadActionHref}
            method="post"
            encType="multipart/form-data"
          >
            <input type="hidden" name="stageKey" value="responses" />
            <input type="hidden" name="artifactFamily" value="proposal" />
            <input
              type="hidden"
              name="artifactKind"
              value="vendor_response_workbook"
            />
            <input
              type="hidden"
              name="dataProtectionClassification"
              value="Internal"
            />
            <label>
              Accepted supplier
              <select
                name="vendorName"
                defaultValue={firstSupplier?.legalName ?? ""}
                disabled={intake.rows.length === 0}
              >
                {intake.rows.length === 0 ? (
                  <option value="">No accepted supplier recorded</option>
                ) : (
                  intake.rows.map((row) => (
                    <option key={row.authorityId} value={row.legalName}>
                      {row.legalName}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label>
              Synthetic response workbook
              <input
                name="file"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={intake.rows.length === 0}
              />
            </label>
            <button
              className="snw-primary"
              type="submit"
              disabled={intake.rows.length === 0}
            >
              Upload workbook
            </button>
          </form>
          {intake.blockers.length > 0 && (
            <div className="snw-vendor-readiness-blockers">
              <strong>Open intake gaps</strong>
              <ul>
                {intake.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="snw-response-suppliers">
            {intake.rows.map((row) => (
              <article key={row.authorityId}>
                <div className="snw-response-supplier-heading">
                  <strong>{row.legalName}</strong>
                  <span>{stateLabel(row.supplierGroup)}</span>
                </div>
                <dl>
                  <div>
                    <dt>Upload</dt>
                    <dd>{stateLabel(row.uploadState)}</dd>
                  </div>
                  <div>
                    <dt>Parse</dt>
                    <dd>{stateLabel(row.parseState)}</dd>
                  </div>
                  <div>
                    <dt>Availability review</dt>
                    <dd>{stateLabel(row.availabilityReviewState)}</dd>
                  </div>
                  <div>
                    <dt>Workbook</dt>
                    <dd>{row.workbookName ?? "Not uploaded"}</dd>
                  </div>
                  <div>
                    <dt>Normalized rows</dt>
                    <dd>
                      {row.parsedRequirementCount > 0
                        ? `${row.parsedRequirementCount} normalized requirement rows`
                        : "No normalized rows read back"}
                    </dd>
                  </div>
                  <div>
                    <dt>Reviewer</dt>
                    <dd>{row.reviewedBy ?? "Not reviewed"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </>
      )}
      <div className="snw-nda-next">
        <strong>{intake.nextAction.label}</strong>
        <p>{intake.nextAction.detail}</p>
      </div>
      <p className="snw-note">
        Availability review only confirms that parsed evidence is available for
        workflow use. It is not legal, security, commercial, finance,
        final-acceptance, scoring, or award approval.
      </p>
    </section>
  );
}

function SourceNewStage04VendorPanelView({
  event,
  panel,
}: {
  event: SourceNewEventView;
  panel: SourceNewStage04VendorPanel;
}) {
  const posture =
    panel.status === "available"
      ? "Accepted candidate panel"
      : panel.status === "empty"
        ? "No accepted candidates yet"
        : "Panel withheld";
  return (
    <section className="snw-nda-readiness" aria-label="Stage 04 vendor panel">
      <p className="snw-eyebrow">Stage 04 · Vendor panel</p>
      <h3>{posture}</h3>
      <p>
        This read-only panel separates accepted candidates the organization is
        already under contract with from those it is not, and names selected
        respondents only when human selection evidence is recorded. It sends
        nothing, contacts nobody, and selects no respondent.
      </p>
      <div className="snw-known">
        <h4>Suggested for review</h4>
        {panel.suggestions.status === "blocked" ? (
          <ul className="snw-blockers">
            {panel.suggestions.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        ) : panel.suggestions.status === "empty" ? (
          <p>
            No governed candidate matches the accepted category and archetype.
            Registry coverage must be added before Source can suggest a
            supplier.
          </p>
        ) : (
          <ul className="snw-panel-rows">
            {panel.suggestions.rows.map((row) => (
              <li key={row.supplierId}>
                <strong>{row.legalName}</strong>
                {" — "}
                {row.label}
                {row.existingContractVendor
                  ? ". Existing-contract vendor, shown separately from fresh candidates"
                  : ". Not recorded as an existing-contract vendor"}
                {`. Eligibility: ${eligibilityLabel(row.eligibility)}`}
                {`. Contact policy: ${contactPolicyLabel(row.contactPolicy)}`}
                {`. Contact readiness: ${row.contactReadiness.replaceAll("_", " ")}`}
                {`. Source: ${row.sourceReference}.`}
                {event.requestAuthorityVersionId &&
                event.requestVersionApproval === "accepted" ? (
                  <form
                    className="snw-inline-form"
                    action={`/api/v1/source/${encodeURIComponent(event.id)}/candidate-suppliers/accept`}
                    method="post"
                  >
                    <input
                      type="hidden"
                      name="supplierId"
                      value={row.supplierId}
                    />
                    <input
                      type="hidden"
                      name="categoryId"
                      value={row.acceptedCategoryId}
                    />
                    <input
                      type="hidden"
                      name="archetypeId"
                      value={row.acceptedArchetypeId}
                    />
                    <input
                      type="hidden"
                      name="eventVersionId"
                      value={event.requestAuthorityVersionId}
                    />
                    <input
                      type="hidden"
                      name="sourceReference"
                      value={row.sourceReference}
                    />
                    <label>
                      <span>Rationale</span>
                      <input
                        name="rationale"
                        minLength={12}
                        required
                        placeholder="Why this supplier belongs on the panel"
                      />
                    </label>
                    <button className="snw-primary" type="submit">
                      Accept candidate
                    </button>
                  </form>
                ) : (
                  <p className="snw-note">
                    The current Request version must be readable and accepted
                    before this supplier can be accepted.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="snw-note">
          Suggestions are registry matches only. A named procurement user must
          separately accept a supplier onto the event panel. No contact action
          is available here.
        </p>
      </div>
      <dl className="snw-facts">
        <div>
          <dt>Accepted, not under contract</dt>
          <dd>{panel.counts.eligible_candidate}</dd>
        </div>
        <div>
          <dt>Already under contract</dt>
          <dd>{panel.counts.existing_contract_vendor}</dd>
        </div>
        <div>
          <dt>Selected respondents</dt>
          <dd>{panel.counts.selected_respondent}</dd>
        </div>
        <div>
          <dt>Panel as of</dt>
          <dd>{panel.asOf}</dd>
        </div>
      </dl>
      {panel.status === "blocked" ? (
        <ul className="snw-blockers">
          {panel.blockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      ) : (
        <ul className="snw-panel-rows">
          {panel.rows.map((row) => (
            <li key={row.authorityId}>
              <strong>{row.legalName}</strong>
              {" — "}
              {vendorPanelGroupLabel(row.group)}
              {". Accepted by "}
              {row.acceptedByName}
              {" on "}
              {row.acceptedAt.slice(0, 10)}
              {row.selectedByName && row.selectedAt
                ? `. Selected by ${row.selectedByName} on ${row.selectedAt.slice(0, 10)}`
                : ""}
              {row.selectionEvidenceReference
                ? `. Selection evidence: ${row.selectionEvidenceReference}`
                : ""}
              {". Eligibility: "}
              {eligibilityLabel(row.eligibility)}
              {". Contact policy: "}
              {contactPolicyLabel(row.contactPolicy)}
              {row.contactBlocker ? ` (${row.contactBlocker})` : ""}
              {". Active contacts: "}
              {row.activeContactCount ?? 0}
              {". Sources: "}
              {sourceReferencesLabel(row)}
              {"."}
            </li>
          ))}
        </ul>
      )}
      <p className="snw-caveat">
        <strong>Not recorded:</strong>
      </p>
      <ul className="snw-caveats">
        {panel.notRecorded.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
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
          <dd>
            {
              coverage.suppliers.filter(
                (supplier) =>
                  supplier.state === "covered_by_nda" ||
                  supplier.state === "covered_by_waiver",
              ).length
            }
          </dd>
        </div>
        <div>
          <dt>Blocked or unknown</dt>
          <dd>
            {
              coverage.suppliers.filter(
                (supplier) =>
                  supplier.state === "not_covered" ||
                  supplier.state === "unavailable",
              ).length
            }
          </dd>
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
        <div
          className="snw-nda-suppliers"
          role="list"
          aria-label="Supplier NDA coverage"
        >
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
                <p className="snw-note" key={caveat}>
                  {caveat}
                </p>
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

function SourceNewStage07ScorecardAuthority({
  authority,
}: {
  authority: ScorecardAuthorityView;
}) {
  const lockedScoreCount = authority.vendorRows.reduce(
    (total, row) => total + row.lockedScoreCount,
    0,
  );
  return (
    <section
      className="snw-nda-readiness"
      aria-label="Stage 07 scorecard authority"
    >
      <p className="snw-eyebrow">Stage 07 · Scorecard authority</p>
      <h3>Frozen evaluator scorecard</h3>
      <p>
        This read-only check summarizes whether scorecard authority is ready for
        governed reviewer inspection. It does not rank vendors, send BAFOs,
        approve an award or turn an AI suggestion into a final score.
      </p>
      <dl className="snw-facts">
        <div>
          <dt>Readiness posture</dt>
          <dd>
            {authority.state === "ready"
              ? "Ready for governed scorecard inspection"
              : "Blocked before scorecard inspection"}
          </dd>
        </div>
        <div>
          <dt>Approved criteria</dt>
          <dd>{authority.criteria.length}</dd>
        </div>
        <div>
          <dt>Frozen weight total</dt>
          <dd>{authority.weightTotal}</dd>
        </div>
        <div>
          <dt>Locked evaluator scores</dt>
          <dd>
            {lockedScoreCount > 0
              ? `${lockedScoreCount} score${lockedScoreCount === 1 ? "" : "s"}`
              : "None ready for inspection"}
          </dd>
        </div>
      </dl>
      <div className="snw-nda-grid">
        <div>
          <strong>Criterion authority</strong>
          <ul>
            {authority.criteria.length > 0 ? (
              authority.criteria.map((criterion) => (
                <li key={criterion.criterionId}>
                  {criterion.label}: version {criterion.criterionVersion};
                  approved version{" "}
                  {criterion.approvedCriterionVersion ?? "not recorded"}; weight{" "}
                  {criterion.weight};{" "}
                  {criterion.weightsFrozen
                    ? "weights frozen"
                    : "weights not frozen"}
                </li>
              ))
            ) : (
              <li>No approved scorecard criteria are loaded.</li>
            )}
          </ul>
        </div>
        <div>
          <strong>Open blockers</strong>
          <ul>
            {authority.blockers.length > 0 ? (
              authority.blockers.map((blocker) => (
                <li key={blocker.blockerId}>{blocker.detail}</li>
              ))
            ) : (
              <li>
                Frozen criteria and named evaluator score authority are
                available for review.
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="snw-nda-next">
        <strong>Evaluator authority</strong>
        <ul>
          {authority.scoreRows.length > 0 ? (
            authority.scoreRows.map((row) => (
              <li key={row.scoreId}>
                {row.vendorName} / {row.criterionId}: evaluator{" "}
                {row.evaluatorName ?? "not recorded"}; evidence{" "}
                {row.evidenceReference ?? "not recorded"}; override{" "}
                {row.overrideReasonRequired
                  ? (row.overrideReason ?? "not recorded")
                  : (row.overrideReason ?? "not required")}
                ; lock {row.lockState}
              </li>
            ))
          ) : (
            <li>No named evaluator score authority is loaded.</li>
          )}
        </ul>
      </div>
      {authority.vendorRows.length > 0 && (
        <div className="snw-nda-next">
          <strong>Score authority completeness</strong>
          <ul>
            {authority.vendorRows.map((row) => (
              <li key={row.vendorId}>
                {row.vendorName}: {row.lockedScoreCount}/
                {row.requiredScoreCount} locked; completeness{" "}
                {row.completenessState}; conflicts {row.conflictState}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="snw-note">{authority.guardrail}</p>
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
  const requiredEvidenceListId = useId();
  const readyEvidenceListId = useId();
  const reviewItemsListId = useId();
  const excludedEvidenceListId = useId();
  const [requiredEvidenceExpanded, setRequiredEvidenceExpanded] =
    useState(false);
  const [readyEvidenceExpanded, setReadyEvidenceExpanded] = useState(false);
  const [reviewItemsExpanded, setReviewItemsExpanded] = useState(false);
  const [excludedEvidenceExpanded, setExcludedEvidenceExpanded] =
    useState(false);
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
  const requiredEvidence = intelligence?.requiredEvidence ?? [];
  const readyEvidence = intelligence?.governedContext.available ?? [];
  const reviewItems = intelligence?.gaps ?? [];
  const excludedEvidence = intelligence?.refusals ?? [];
  const evidenceReviewHref = `${eventHref}?workspace=files`;
  const visibleRequiredEvidence = requiredEvidenceExpanded
    ? requiredEvidence
    : requiredEvidence.slice(0, INTELLIGENCE_LIST_PREVIEW_COUNT);
  const visibleReadyEvidence = readyEvidenceExpanded
    ? readyEvidence
    : readyEvidence.slice(0, INTELLIGENCE_LIST_PREVIEW_COUNT);
  const visibleReviewItems = reviewItemsExpanded
    ? reviewItems
    : reviewItems.slice(0, INTELLIGENCE_LIST_PREVIEW_COUNT);
  const visibleExcludedEvidence = excludedEvidenceExpanded
    ? excludedEvidence
    : excludedEvidence.slice(0, INTELLIGENCE_LIST_PREVIEW_COUNT);

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
          <ul className="snw-intel-list" id={requiredEvidenceListId}>
            {requiredEvidence.length > 0 ? (
              visibleRequiredEvidence.map((item) => (
                <SourceNewRequiredEvidenceItem key={item.key} item={item} />
              ))
            ) : (
              <li>
                <strong>
                  {intelligence.stageEvidenceContract === "not_defined"
                    ? "No separate evidence contract for this stage."
                    : "No stage-specific evidence contract is available."}
                </strong>
                <p>
                  {intelligence.stageEvidenceContract === "not_defined"
                    ? intelligence.currentStage === "value"
                      ? "The archetype is resolved. Review governed evidence from the completed lifecycle before relying on a final-stage claim."
                      : "The archetype is resolved, but this stage has no declared evidence contract. Source will not infer requirements."
                    : "The event needs a resolved archetype before evidence can be scored."}
                </p>
              </li>
            )}
          </ul>
          <SourceNewDisclosureControl
            expanded={requiredEvidenceExpanded}
            label="evidence requirements"
            listId={requiredEvidenceListId}
            onToggle={() =>
              setRequiredEvidenceExpanded((expanded) => !expanded)
            }
            previewCount={INTELLIGENCE_LIST_PREVIEW_COUNT}
            total={requiredEvidence.length}
          />
        </section>

        <section>
          <h3>Evidence ready to use</h3>
          <ul className="snw-intel-list" id={readyEvidenceListId}>
            {readyEvidence.length > 0 ? (
              visibleReadyEvidence.map((item) => (
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
          <SourceNewDisclosureControl
            expanded={readyEvidenceExpanded}
            label="ready evidence items"
            listId={readyEvidenceListId}
            onToggle={() => setReadyEvidenceExpanded((expanded) => !expanded)}
            previewCount={INTELLIGENCE_LIST_PREVIEW_COUNT}
            total={readyEvidence.length}
          />
        </section>
      </div>

      <div className="snw-intel-grid">
        <section>
          <h3>What is missing</h3>
          <ul className="snw-intel-plain-list" id={reviewItemsListId}>
            {reviewItems.length > 0 ? (
              visibleReviewItems.map((gap) => <li key={gap}>{gap}</li>)
            ) : (
              <li>No unresolved evidence gap is visible.</li>
            )}
          </ul>
          <SourceNewDisclosureControl
            expanded={reviewItemsExpanded}
            label="review items"
            listId={reviewItemsListId}
            onToggle={() => setReviewItemsExpanded((expanded) => !expanded)}
            previewCount={INTELLIGENCE_LIST_PREVIEW_COUNT}
            total={reviewItems.length}
          />
        </section>
        <section>
          <h3>What Source can say now</h3>
          <p className="snw-intel-allowed">{intelligence.allowedStatement}</p>
          <ul className="snw-intel-plain-list" id={excludedEvidenceListId}>
            {excludedEvidence.length > 0 ? (
              visibleExcludedEvidence.map((refusal) => (
                <li key={refusal}>{refusal}</li>
              ))
            ) : (
              <li>No evidence was excluded.</li>
            )}
          </ul>
          <SourceNewDisclosureControl
            expanded={excludedEvidenceExpanded}
            label="excluded evidence items"
            listId={excludedEvidenceListId}
            onToggle={() =>
              setExcludedEvidenceExpanded((expanded) => !expanded)
            }
            previewCount={INTELLIGENCE_LIST_PREVIEW_COUNT}
            total={excludedEvidence.length}
          />
        </section>
      </div>

      <section className="snw-intel-next" aria-label="Intelligence next action">
        <p className="snw-eyebrow">Next question</p>
        <h3>{intelligence.nextQuestion}</h3>
        <p>
          <strong>{intelligence.nextAction.label}.</strong>{" "}
          {intelligence.nextAction.detail}
        </p>
        <Link className="snw-primary" href={evidenceReviewHref}>
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

function SourceNewRequiredEvidenceItem({
  item,
}: {
  item: IntelligenceEvidenceItem;
}) {
  return (
    <li>
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
  );
}

function SourceNewDisclosureControl({
  expanded,
  label,
  listId,
  onToggle,
  previewCount,
  total,
}: {
  expanded: boolean;
  label: string;
  listId: string;
  onToggle: () => void;
  previewCount: number;
  total: number;
}) {
  if (total <= previewCount) return null;
  const visibleCount = expanded ? total : previewCount;
  return (
    <div className="snw-disclosure-control">
      <p>
        {total} {label} ·{" "}
        {expanded ? "showing all" : `showing first ${visibleCount}`}
      </p>
      <button
        aria-controls={listId}
        aria-expanded={expanded}
        type="button"
        onClick={onToggle}
      >
        {expanded ? `Show fewer ${label}` : `Show all ${total} ${label}`}
      </button>
    </div>
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
  const trailListId = useId();
  const [expanded, setExpanded] = useState(false);
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
  const visibleEntries = expanded
    ? entries
    : entries.slice(0, DECISION_TRAIL_PREVIEW_COUNT);
  return (
    <>
      <ol
        className="snw-trail"
        data-decision-trail="entries"
        aria-label="Decision trail"
        id={trailListId}
      >
        {visibleEntries.map((entry) => (
          <SourceNewDecisionTrailEntry key={entry.id} entry={entry} />
        ))}
      </ol>
      <SourceNewDisclosureControl
        expanded={expanded}
        label="decision trail entries"
        listId={trailListId}
        onToggle={() => setExpanded((current) => !current)}
        previewCount={DECISION_TRAIL_PREVIEW_COUNT}
        total={entries.length}
      />
    </>
  );
}

function SourceNewDecisionTrailEntry({ entry }: { entry: ActivityTrailEntry }) {
  return (
    <li>
      <span className="snw-trail-actor">
        {entry.actor ?? "Actor not recorded"}
      </span>
      <span className="snw-trail-body">{entry.body}</span>
      <time className="snw-trail-at" dateTime={String(entry.at ?? "")}>
        {String(entry.at ?? "")}
      </time>
    </li>
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
        parts: turn.responseParts,
        citations: sourceNewAskSourcesFromCitations(
          turn.agentAnswer?.citations,
        ),
        agentAnswer: turn.agentAnswer,
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

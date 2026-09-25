"use client";

import Link from "next/link";
import {
  AgentDock,
  type AttachmentRef,
  type ChatMessage,
} from "@/components/agent/AgentDock";
import { AppShell } from "@/components/shell/AppShell";
import { useAtlasPageState } from "@/components/shell/AtlasPageStateProvider";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { SHELL } from "@/lib/shell/shell-tokens";
import type { SourceIntakeRequestSummary } from "@/lib/source/intake/servicenow-sourcing-request-repository";
import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import { requesterEstimateCardLabel } from "@/lib/source/requester-estimate-label";

export type SourceNewRequestQueueStatus =
  | "loading"
  | "loaded"
  | "empty"
  | "unauthorized"
  | "unavailable";

export interface SourceNewEventWorkspaceSummary {
  id: string;
  code: string;
  name: string;
  lifecycle: string;
  currentStageLabel: string;
  lifecycleLabel: string;
  trigger: string | null;
  scope: string | null;
  decisionOwner: string | null;
  href: string;
}

export function SourceNewRequestFirstPage({
  clientName,
  clientKey,
  requestQueueStatus,
  importedRequests,
  eventWorkspaces,
  intakeHref = "/source/new?mode=intake",
  onRetryRequestQueue = () => window.location.reload(),
}: {
  clientName: string;
  clientKey: string;
  requestQueueStatus: SourceNewRequestQueueStatus;
  importedRequests: readonly SourceIntakeRequestSummary[];
  eventWorkspaces: readonly SourceNewEventWorkspaceSummary[];
  intakeHref?: string;
  onRetryRequestQueue?: () => void;
}) {
  const canShowRequests =
    requestQueueStatus === "loaded" || requestQueueStatus === "empty";
  const visibleWorkspaces =
    requestQueueStatus === "unauthorized" ? [] : eventWorkspaces;
  const requests = canShowRequests
    ? importedRequests.filter((request) => request.eventLink === null)
    : [];
  const activeWorkspaces = visibleWorkspaces;
  const nextAction =
    requestQueueStatus === "unauthorized"
      ? {
          label: "Sign in to review requests",
          note: "Request details remain hidden until access is confirmed.",
        }
      : requestQueueStatus === "unavailable"
        ? {
            label: "Retry the request queue",
            note: "An unavailable queue is not treated as an empty queue.",
          }
        : requests.length > 0
          ? {
              label: "Review pending requests",
              note: "Each request shows its missing information and next owner.",
            }
          : activeWorkspaces.length > 0
            ? {
                label: "Open accepted work",
                note: "No request is waiting for intake review.",
              }
            : {
                label: "Start a request",
                note: "Capture the need before creating event work.",
              };
  const workspace = (
    <main aria-label="Source New request-first workspace" style={PAGE}>
      <section style={HERO}>
        <div>
          <p style={EYEBROW}>Source New</p>
          <h1 style={TITLE}>Source requests</h1>
          <p style={LEDE}>
            Review what was requested, close any gaps, and confirm whether the
            request is ready for Define. This page does not approve, advance,
            or send anything.
          </p>
        </div>
        <div style={STATUS_BOX}>
          <span style={STATUS_LABEL}>One next action</span>
          <strong style={STATUS_VALUE}>{nextAction.label}</strong>
          <span style={STATUS_NOTE}>{nextAction.note}</span>
        </div>
      </section>

      <div style={GRID}>
        <section aria-label="Request queue" style={PANEL}>
          <div style={PANEL_HEADER}>
            <div>
              <p style={EYEBROW}>Stage 01</p>
              <h2 style={PANEL_TITLE}>Request queue</h2>
            </div>
            <span style={CHIP}>Triage</span>
          </div>
          <RequestQueueState
            status={requestQueueStatus}
            intakeHref={intakeHref}
            requests={requests}
            onRetryRequestQueue={onRetryRequestQueue}
          />
        </section>

        <section aria-label="Event workspaces" style={PANEL}>
          <div style={PANEL_HEADER}>
            <div>
              <p style={EYEBROW}>Accepted work</p>
              <h2 style={PANEL_TITLE}>Event workspaces</h2>
            </div>
            <span style={CHIP}>Accepted work</span>
          </div>
          {activeWorkspaces.length > 0 ? (
            <ol style={EVENT_LIST}>
              {activeWorkspaces.slice(0, 6).map((event) => (
                <li key={event.id} style={EVENT_ROW}>
                  <div style={{ minWidth: 0 }}>
                    <div style={EVENT_LINK}>{event.name}</div>
                    <div style={EVENT_META}>
                      {event.code} · {event.currentStageLabel} ·{" "}
                      {event.lifecycleLabel}
                    </div>
                  </div>
                  <Link href={event.href} style={OPEN_LINK}>
                    Open
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p style={EMPTY_COPY}>
              No governed event workspaces are available from this view.
            </p>
          )}
        </section>
      </div>
    </main>
  );

  return (
    <AppShell
      surface="source"
      surfaceContext={{
        clientKey,
        clientName,
        context: "Source New request intake",
      }}
      topBarProps={{
        tenantName: clientName,
        showLocked: true,
        context: "Source · Request intake",
      }}
      subNav={<SourceSubNav />}
    >
      <SourceNewRequestDock clientName={clientName} workspace={workspace} />
    </AppShell>
  );
}

function RequestQueueState({
  status,
  intakeHref,
  requests,
  onRetryRequestQueue,
}: {
  status: SourceNewRequestQueueStatus;
  intakeHref: string;
  requests: readonly SourceIntakeRequestSummary[];
  onRetryRequestQueue: () => void;
}) {
  if (status === "loading") {
    return (
      <div role="status" style={STATE_BOX}>
        Loading request queue
      </div>
    );
  }
  if (status === "unauthorized") {
    return (
      <div style={STATE_BOX}>
        Source request intake requires a signed-in tenant session.
      </div>
    );
  }
  if (status === "unavailable") {
    return (
      <div style={STATE_BOX}>
        <p style={EMPTY_COPY}>
          The request queue could not be read. This is not an empty queue.
        </p>
        <button
          type="button"
          onClick={onRetryRequestQueue}
          style={PRIMARY_BUTTON}
        >
          Retry request queue
        </button>
      </div>
    );
  }
  if (requests.length > 0) {
    return (
      <ol style={REQUEST_LIST}>
        {requests.slice(0, 6).map((request) => (
          <RequestTriageRow key={request.requestId} request={request} />
        ))}
      </ol>
    );
  }
  return (
    <div style={STATE_BOX}>
      <p style={EMPTY_COPY}>
        No requests are waiting for intake review.
      </p>
      <p style={NOTE_COPY}>
        New requests stay here until their intake review is complete.
      </p>
      <Link href={intakeHref} style={PRIMARY_ACTION}>
        Start a request
      </Link>
    </div>
  );
}

function RequestTriageRow({
  request,
}: {
  request: SourceIntakeRequestSummary;
}) {
  const mappingAccepted = request.mappingDecision !== null;
  const readyForEvent =
    mappingAccepted && request.requiredFactGaps.length === 0;
  const requested = [
    request.requestedFor,
    request.businessFunction,
    request.description,
  ]
    .filter(Boolean)
    .join(" · ");
  const actionHref = request.eventLink
    ? `/source/new/${encodeURIComponent(request.eventLink.eventId)}`
    : `/source/new?mode=intake&requestId=${encodeURIComponent(request.requestId)}`;
  return (
    <li aria-label={`Request ${request.title}`} style={REQUEST_ROW}>
      <div style={REQUEST_HEADER}>
        <div style={{ minWidth: 0 }}>
          <div style={REQUEST_TITLE}>{request.title}</div>
          <div style={EVENT_META}>
            ServiceNow · {request.requestNumber} · {request.sourceStatus}
          </div>
        </div>
        <span style={readyForEvent ? READY_BADGE : GAP_BADGE}>
          {request.eventLink
            ? "Event created"
            : readyForEvent
              ? "Ready to create event"
              : "Review required"}
        </span>
      </div>

      <dl style={TRIAGE_GRID}>
        <div style={TRIAGE_ITEM}>
          <dt style={TRIAGE_LABEL}>What was requested</dt>
          <dd style={TRIAGE_VALUE}>{requested}</dd>
        </div>
        <div style={TRIAGE_ITEM}>
          <dt style={TRIAGE_LABEL}>What is missing</dt>
          <dd style={TRIAGE_VALUE}>
            {request.requiredFactGaps.length === 0 ? (
              "Nothing required is missing"
            ) : (
              <ul style={MISSING_LIST}>
                {request.requiredFactGaps.map((item) => (
                  <li key={item}>{humanize(item)}</li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div style={TRIAGE_ITEM}>
          <dt style={TRIAGE_LABEL}>Proposed routing</dt>
          <dd style={TRIAGE_VALUE}>
            {request.mappingProposal.archetypeId
              ? humanize(request.mappingProposal.archetypeId)
              : "No archetype proposed"}
            {request.mappingProposal.categoryId
              ? ` · ${humanize(request.mappingProposal.categoryId)}`
              : ""}
            <span style={PROPOSAL_NOTE}>
              {request.mappingDecision
                ? `Reviewed by ${request.mappingDecision.decidedByName}`
                : "AI proposal only · named review required"}
            </span>
          </dd>
        </div>
        <div style={TRIAGE_ITEM}>
          <dt style={TRIAGE_LABEL}>Supplier pool</dt>
          <dd style={TRIAGE_VALUE}>
            {request.mappingDecision
              ? "Eligible suppliers can be proposed from the accepted category, function, and archetype. Contact authority remains separate."
              : "Held until a named reviewer accepts or overrides the mapping."}
          </dd>
        </div>
      </dl>

      {request.value ? (
        <p style={NOTE_COPY}>
          {requesterEstimateCardLabel(
            formatMoney(request.value.amount, request.value.currency),
          )}
        </p>
      ) : null}
      <Link href={actionHref} style={PRIMARY_ACTION}>
        {request.eventLink ? "Open event" : "Review request"}
      </Link>
    </li>
  );
}

function humanize(value: string): string {
  const acronyms = new Set([
    "ams",
    "bpo",
    "cx",
    "ehr",
    "erp",
    "itsm",
    "saas",
    "si",
  ]);
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word) =>
      acronyms.has(word) ? word.toUpperCase() : `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`,
    )
    .join(" ");
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function SourceNewRequestDock({
  clientName,
  workspace,
}: {
  clientName: string;
  workspace: ReactNode;
}) {
  const pageState = useAtlasPageState();
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
  const onMessage = (text: string, attachments: AttachmentRef[]) => {
    if (!pageState) return;
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    const fileNote =
      attachments.length > 0
        ? `\n[Attached evidence: ${attachments
            .map((attachment) => `${attachment.file_name} (${attachment.id})`)
            .join("; ")}]`
        : "";
    pageState.ask((trimmed + fileNote).trim());
  };
  return (
    <AgentDock
      agent={{
        initials: "aVa",
        name: "aVa",
        role: "Source request advisor",
      }}
      surface="source/new"
      defaultMode="side-rail"
      disableStoredMode
      defaultLeftPercent={34}
      minLeftPx={320}
      surfaceContext={{ sourceRequestIntakeMode: true, clientName }}
      initialQuote={`Ready to review Source requests for ${clientName}. I will keep request intake separate from active event work.`}
      thread={thread}
      onMessage={onMessage}
      workspace={workspace}
    />
  );
}

const PAGE: CSSProperties = {
  minHeight: "100%",
  padding: 24,
  background: SHELL.PAPER,
  color: SHELL.INK,
  fontFamily: SHELL.SANS,
};

const HERO: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: 18,
  alignItems: "stretch",
  marginBottom: 18,
};

const EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
};

const TITLE: CSSProperties = {
  margin: "6px 0 8px",
  fontSize: 34,
  lineHeight: 1.05,
  letterSpacing: 0,
};

const LEDE: CSSProperties = {
  maxWidth: 720,
  margin: 0,
  fontSize: 14,
  lineHeight: 1.55,
  color: SHELL.INK_SOFT,
};

const STATUS_BOX: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: 5,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  padding: 16,
};

const STATUS_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_MUTED,
  textTransform: "uppercase",
};

const STATUS_VALUE: CSSProperties = {
  fontSize: 16,
  color: SHELL.INK,
};

const STATUS_NOTE: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.45,
  color: SHELL.INK_MUTED,
};

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
  gap: 14,
};

const PANEL: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  padding: 16,
  minHeight: 260,
};

const PANEL_HEADER: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
};

const PANEL_TITLE: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 18,
  lineHeight: 1.2,
  letterSpacing: 0,
};

const CHIP: CSSProperties = {
  flex: "0 0 auto",
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 999,
  padding: "4px 8px",
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_MUTED,
  background: SHELL.PAPER_SOFT,
};

const STATE_BOX: CSSProperties = {
  display: "grid",
  gap: 10,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.PAPER,
  padding: 14,
  fontSize: 13,
  lineHeight: 1.45,
  color: SHELL.INK_SOFT,
};

const EMPTY_COPY: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.45,
  color: SHELL.INK_SOFT,
};

const NOTE_COPY: CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.45,
  color: SHELL.INK_MUTED,
};

const PRIMARY_ACTION: CSSProperties = {
  justifySelf: "start",
  borderRadius: 8,
  background: SHELL.INK,
  color: SHELL.CARD_WHITE,
  padding: "9px 12px",
  fontSize: 12,
  fontWeight: 700,
  textDecoration: "none",
};

const PRIMARY_BUTTON: CSSProperties = {
  ...PRIMARY_ACTION,
  border: 0,
  cursor: "pointer",
  fontFamily: SHELL.SANS,
};

const EVENT_LIST: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: 8,
};

const REQUEST_LIST: CSSProperties = {
  ...EVENT_LIST,
  gap: 12,
};

const REQUEST_ROW: CSSProperties = {
  display: "grid",
  gap: 14,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  padding: 14,
  background: SHELL.PAPER,
};

const REQUEST_HEADER: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
};

const REQUEST_TITLE: CSSProperties = {
  color: SHELL.INK,
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1.3,
};

const BADGE: CSSProperties = {
  flex: "0 0 auto",
  borderRadius: 5,
  padding: "4px 7px",
  fontFamily: SHELL.MONO,
  fontSize: 9,
  fontWeight: 700,
};

const READY_BADGE: CSSProperties = {
  ...BADGE,
  border: `1px solid ${SHELL.MINT_LINE}`,
  background: SHELL.MINT_BG,
  color: SHELL.MINT_TEXT,
};

const GAP_BADGE: CSSProperties = {
  ...BADGE,
  border: `1px solid ${SHELL.PEACH_LINE}`,
  background: SHELL.PEACH_BG,
  color: SHELL.PEACH_TEXT,
};

const TRIAGE_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
  gap: 12,
  margin: 0,
};

const TRIAGE_ITEM: CSSProperties = {
  minWidth: 0,
  borderTop: `1px solid ${SHELL.CARD_LINE}`,
  paddingTop: 9,
};

const TRIAGE_LABEL: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
};

const TRIAGE_VALUE: CSSProperties = {
  margin: "4px 0 0",
  color: SHELL.INK_SOFT,
  fontSize: 12,
  lineHeight: 1.45,
};

const PROPOSAL_NOTE: CSSProperties = {
  display: "block",
  marginTop: 4,
  color: SHELL.INK_MUTED,
  fontSize: 12,
};

const MISSING_LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 16,
};

const EVENT_ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 12,
  alignItems: "center",
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  padding: 12,
  background: SHELL.PAPER,
};

const EVENT_LINK: CSSProperties = {
  display: "block",
  color: SHELL.INK,
  fontSize: 13,
  fontWeight: 700,
  textDecoration: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const EVENT_META: CSSProperties = {
  marginTop: 4,
  color: SHELL.INK_MUTED,
  fontSize: 11,
};

const OPEN_LINK: CSSProperties = {
  color: SHELL.INK,
  fontSize: 12,
  fontWeight: 700,
  textDecoration: "none",
};

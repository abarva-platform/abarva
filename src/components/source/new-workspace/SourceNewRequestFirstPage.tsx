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
import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";

export type SourceNewRequestQueueStatus =
  | "loading"
  | "empty"
  | "unauthorized"
  | "unavailable";

export interface SourceNewEventWorkspaceSummary {
  id: string;
  code: string;
  name: string;
  currentStageLabel: string;
  lifecycleLabel: string;
  href: string;
}

export function SourceNewRequestFirstPage({
  clientName,
  clientKey,
  requestQueueStatus,
  eventWorkspaces,
  intakeHref = "/source/new?mode=intake",
}: {
  clientName: string;
  clientKey: string;
  requestQueueStatus: SourceNewRequestQueueStatus;
  eventWorkspaces: readonly SourceNewEventWorkspaceSummary[];
  intakeHref?: string;
}) {
  const canShowWorkspaces = requestQueueStatus !== "unauthorized";
  const visibleWorkspaces = canShowWorkspaces ? eventWorkspaces : [];
  const workspace = (
    <main aria-label="Source New request-first workspace" style={PAGE}>
      <section style={HERO}>
        <div>
          <p style={EYEBROW}>Source New</p>
          <h1 style={TITLE}>Source requests</h1>
          <p style={LEDE}>
            Start with the request. Accepting a request is a governed handoff
            into an event workspace; viewing this queue does not create an
            event, advance a stage, or send any external communication.
          </p>
        </div>
        <div style={STATUS_BOX}>
          <span style={STATUS_LABEL}>One next action</span>
          <strong style={STATUS_VALUE}>Review the request queue</strong>
          <span style={STATUS_NOTE}>
            Event work opens only after the request is accepted through the
            governed flow.
          </span>
        </div>
      </section>

      <div style={GRID}>
        <section aria-label="Request queue" style={PANEL}>
          <div style={PANEL_HEADER}>
            <div>
              <p style={EYEBROW}>Stage 01</p>
              <h2 style={PANEL_TITLE}>Request queue</h2>
            </div>
            <span style={CHIP}>Request first</span>
          </div>
          <RequestQueueState
            status={requestQueueStatus}
            intakeHref={intakeHref}
          />
        </section>

        <section aria-label="Event workspaces" style={PANEL}>
          <div style={PANEL_HEADER}>
            <div>
              <p style={EYEBROW}>Accepted work</p>
              <h2 style={PANEL_TITLE}>Event workspaces</h2>
            </div>
            <span style={CHIP}>Separated</span>
          </div>
          {visibleWorkspaces.length > 0 ? (
            <ol style={EVENT_LIST}>
              {visibleWorkspaces.slice(0, 6).map((event) => (
                <li key={event.id} style={EVENT_ROW}>
                  <div style={{ minWidth: 0 }}>
                    <Link href={event.href} style={EVENT_LINK}>
                      {event.name}
                    </Link>
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
}: {
  status: SourceNewRequestQueueStatus;
  intakeHref: string;
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
        The request queue could not be read. This is not an empty queue.
      </div>
    );
  }
  return (
    <div style={STATE_BOX}>
      <p style={EMPTY_COPY}>
        No pending requests are loaded from an authoritative request ledger.
      </p>
      <p style={NOTE_COPY}>
        A request does not appear in event workspaces until it is accepted into
        the governed Source event flow.
      </p>
      <Link href={intakeHref} style={PRIMARY_ACTION}>
        Open governed intake
      </Link>
    </div>
  );
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
  gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 320px)",
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
  gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
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

const EVENT_LIST: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: 8,
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

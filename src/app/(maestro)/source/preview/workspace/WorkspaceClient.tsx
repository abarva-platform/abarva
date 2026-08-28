"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./workspace.css";
import {
  buildInitialWorkspaceState,
  WorkspaceViewModel,
  type WorkspaceState,
} from "./viewModel";
import { buildViewModel } from "./buildViewModel";
import type {
  SourceWorkspacePortfolioData,
  SourceWorkspaceProviderMode,
} from "./live/portfolioAdapter";
import type { Contract360Response } from "./live/contractDetail";
import {
  AgentDock,
  type AttachmentRef,
  type ChatMessage,
} from "@/components/agent/AgentDock";
import { stripArtifactsForDisplay } from "@/lib/agent/artifacts";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { stripGovernedArtifactPayloadsFromText } from "@/lib/intelligence/answer/structured-fence-stream-filter";
import type { AskSource } from "@/lib/intelligence/ask/types";
import { Tooltip } from "./Tooltip";
import { ContextLens } from "./lenses/ContextLens";
import { ListLens } from "./lenses/ListLens";
import { VendorCanvas } from "./canvases/VendorCanvas";
import { ContractCanvas } from "./canvases/ContractCanvas";
import { OpportunityCanvas } from "./canvases/OpportunityCanvas";
import { EvidenceCanvas } from "./canvases/EvidenceCanvas";

const SOURCE_WORKSPACE_AGENT = {
  initials: "aVa",
  mark: "ava" as const,
  name: "aVa",
  role: "Source Workspace advisor",
};
const SOURCE_WORKSPACE_AGENT_API_URL = "/api/intelligence/ask";

function buildContractApiUrl(
  contractId: string,
  sourceClientKey: string | null | undefined,
  sourceProviderKey: SourceWorkspaceProviderMode | null | undefined,
  suffix = "",
  extraParams: Record<string, string | null | undefined> = {},
): string {
  const params = new URLSearchParams();
  const client = sourceClientKey?.trim();
  if (client) params.set("client", client);
  const provider = sourceProviderKey?.trim();
  if (provider) params.set("sourceProvider", provider);
  for (const [key, value] of Object.entries(extraParams)) {
    const trimmed = value?.trim();
    if (trimmed) params.set(key, trimmed);
  }
  const query = params.toString();
  return (
    "/api/source/workspace/contract/" +
    encodeURIComponent(contractId) +
    suffix +
    (query ? `?${query}` : "")
  );
}

function eventText(event: Record<string, unknown>): string {
  if (typeof event.text === "string") return event.text;
  if (typeof event.delta === "string") return event.delta;
  return "";
}

function isAvaAnswerPacket(value: unknown): value is AvaAnswerPacket {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as { directAnswer?: unknown }).directAnswer === "string" &&
    Array.isArray((value as { citations?: unknown }).citations) &&
    Array.isArray((value as { nextSteps?: unknown }).nextSteps),
  );
}

function hasPacketArtifacts(answer: AvaAnswerPacket): boolean {
  return (
    answer.artifacts.length > 0 ||
    (answer.tables?.length ?? 0) > 0 ||
    (answer.charts?.length ?? 0) > 0 ||
    (answer.graphs?.length ?? 0) > 0
  );
}

function answerBodyFromPacket(answer: AvaAnswerPacket): string {
  const body =
    answer.prose?.trim() ||
    answer.directAnswer?.trim() ||
    [answer.interpretation, answer.businessImplication, answer.recommendation]
      .filter((part): part is string => Boolean(part?.trim()))
      .join("\n\n")
      .trim();
  return stripGovernedArtifactPayloadsFromText(body);
}

function askSourceTypeFromCitation(
  sourceClass: AvaAnswerPacket["citations"][number]["sourceClass"],
): AskSource["type"] {
  if (sourceClass === "tenant-fact" || sourceClass === "tenant-chunk")
    return "TENANT";
  if (sourceClass === "graph") return "GRAPH";
  if (sourceClass === "worldview") return "WORLDVIEW";
  return "PATTERN";
}

function resolveSourceAssistantAnswerText(
  rawStreamedAnswer: string,
  packetBody: string,
): string {
  const visible = packetBody.trim() ? packetBody : rawStreamedAnswer;
  return stripArtifactsForDisplay(
    stripGovernedArtifactPayloadsFromText(visible),
  ).trim();
}

export function WorkspaceClient({
  portfolio,
  tenantName,
  sourceClientKey,
  sourceProviderKey,
  initialContractId,
  initialContractTab,
}: {
  portfolio: SourceWorkspacePortfolioData;
  tenantName: string;
  sourceClientKey?: string | null;
  sourceProviderKey?: SourceWorkspaceProviderMode | null;
  initialContractId?: string | null;
  initialContractTab?: string | null;
}) {
  const [state, setStateRaw] = useState<WorkspaceState>(() =>
    buildInitialWorkspaceState({
      contractId: initialContractId,
      contractTab: initialContractTab,
    }),
  );
  const [thread, setThread] = useState<ChatMessage[]>([]);

  const setState = useMemo(
    () =>
      (
        patch:
          | Partial<WorkspaceState>
          | ((s: WorkspaceState) => Partial<WorkspaceState>),
      ) => {
        setStateRaw((prev) => ({
          ...prev,
          ...(typeof patch === "function" ? patch(prev) : patch),
        }));
      },
    [],
  );

  const fetchContractDetail = useCallback(
    (contractId: string) => {
      setStateRaw((prev) => {
        if (prev.contractDetail[contractId]) return prev; // already loaded/loading
        return {
          ...prev,
          contractDetail: { ...prev.contractDetail, [contractId]: "loading" },
        };
      });
      fetch(buildContractApiUrl(contractId, sourceClientKey, sourceProviderKey))
        .then((r) =>
          r.ok
            ? (r.json() as Promise<Contract360Response>)
            : Promise.reject(new Error(String(r.status))),
        )
        .then((view) =>
          setStateRaw((prev) => ({
            ...prev,
            contractDetail: { ...prev.contractDetail, [contractId]: view },
          })),
        )
        .catch(() =>
          setStateRaw((prev) => ({
            ...prev,
            contractDetail: { ...prev.contractDetail, [contractId]: "error" },
          })),
        );
    },
    [sourceClientKey, sourceProviderKey],
  );

  const startContractOptimization = useCallback(
    (contractId: string, opportunityId?: string | null) => {
      setStateRaw((prev) => ({
        ...prev,
        optimizationLaunch: {
          ...prev.optimizationLaunch,
          [contractId]: { status: "loading" },
        },
      }));
      fetch(
        buildContractApiUrl(
          contractId,
          sourceClientKey,
          sourceProviderKey,
          "/optimization",
          { opportunityId },
        ),
        {
          method: "POST",
          headers: opportunityId
            ? { "content-type": "application/json" }
            : undefined,
          body: opportunityId ? JSON.stringify({ opportunityId }) : undefined,
        },
      )
        .then(async (r) => {
          const payload = await r.json().catch(() => null);
          if (!r.ok || !payload?.ok) {
            throw new Error(
              payload?.detail ??
                payload?.error ??
                `Source returned ${r.status}`,
            );
          }
          return payload as {
            approvalUrl?: string;
            contractId?: string;
            eventUrl?: string;
            eventId?: string;
            opportunityId?: string | null;
          };
        })
        .then((payload) => {
          if (payload.contractId !== contractId) {
            throw new Error(
              "Contract optimization returned a different contract. The workflow was not opened.",
            );
          }
          if (opportunityId && payload.opportunityId !== opportunityId) {
            throw new Error(
              "Contract optimization returned a different opportunity. The workflow was not opened.",
            );
          }
          window.location.href =
            payload.approvalUrl ??
            payload.eventUrl ??
            `/source/events/${payload.eventId ?? ""}`;
        })
        .catch((err) => {
          const message =
            err instanceof Error
              ? err.message
              : "Could not start optimization workflow.";
          setStateRaw((prev) => ({
            ...prev,
            optimizationLaunch: {
              ...prev.optimizationLaunch,
              [contractId]: { status: "error", message },
            },
          }));
        });
    },
    [sourceClientKey, sourceProviderKey],
  );

  useEffect(() => {
    if (!initialContractId?.trim()) return;
    fetchContractDetail(initialContractId.trim());
  }, [fetchContractDetail, initialContractId]);

  const vm = useMemo(() => {
    const logic = new WorkspaceViewModel(
      state,
      setState,
      portfolio,
      tenantName,
      fetchContractDetail,
      startContractOptimization,
    );
    return buildViewModel(logic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, portfolio, tenantName]);
  const isPortfolioCockpit =
    !vm.isVendor &&
    !vm.isContract &&
    !vm.isOpp &&
    !vm.isEvidence &&
    !vm.isVendorList &&
    !vm.isContractList;
  const hidesWorkspaceHeader = isPortfolioCockpit || vm.isVendor;

  // The Source dock uses the rich aVa route so charts, tables, graphs, and
  // citations survive as structured packets instead of being flattened to text.
  const onAvaMessage = useCallback(
    async (text: string, attachments: AttachmentRef[]) => {
      if (!text && attachments.length === 0) return;
      const now = Date.now();
      const userBody =
        attachments.length > 0
          ? `${text}\n\n[attached: ${attachments.map((a) => a.file_name).join(", ")}]`
          : text;
      const assistantId = `a-${now + 1}`;
      setThread((prev) => [
        ...prev,
        { id: `u-${now}`, role: "user", body: userBody },
        {
          id: assistantId,
          role: "agent",
          body: "Gathering contract, evidence, and outside-in context...",
        },
      ]);

      const attachmentContext = attachments
        .filter(
          (a) =>
            a.extracted_text_preview &&
            a.extracted_text_preview.trim().length > 0,
        )
        .map(
          (a) =>
            `--- attachment: ${a.file_name} (${a.mime}) ---\n${a.extracted_text_preview}\n--- end attachment ---`,
        )
        .join("\n\n");
      const messageForRuntime = attachmentContext
        ? `${text}\n\n${attachmentContext}`
        : text;

      let rawAnswer = "";
      let sawPacket = false;
      try {
        const res = await fetch(SOURCE_WORKSPACE_AGENT_API_URL, {
          method: "POST",
          headers: {
            Accept: "application/x-ndjson",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: messageForRuntime,
            client:
              vm.avaSurfaceContext.clientKey ??
              vm.avaSurfaceContext.activeClient ??
              tenantName,
            format: "rich",
            richText: true,
            answerOnlyStreaming: true,
            traceEnabled: true,
            surfaceContext: vm.avaSurfaceContext,
          }),
        });
        if (!res.ok) throw new Error(`aVa returned ${res.status}`);
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");
        const decoder = new TextDecoder();
        let buffer = "";
        const applyAskEvent = (line: string) => {
          if (!line.trim()) return;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(line) as Record<string, unknown>;
          } catch {
            return;
          }
          if (event.type === "delta") {
            const delta = eventText(event);
            if (!delta) return;
            rawAnswer += delta;
            const body = resolveSourceAssistantAnswerText(rawAnswer, "");
            setThread((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, body: body || "Writing the Source read..." }
                  : msg,
              ),
            );
            return;
          }
          if (event.type === "context-summary") {
            setThread((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? {
                      ...msg,
                      body: "Selecting source systems, contract evidence, and outside-in patterns...",
                    }
                  : msg,
              ),
            );
            return;
          }
          if (event.type === "sources" && Array.isArray(event.sources)) {
            const citations = event.sources as AskSource[];
            setThread((prev) =>
              prev.map((msg) =>
                msg.id === assistantId ? { ...msg, citations } : msg,
              ),
            );
            return;
          }
          if (
            event.type === "agent-answer" &&
            isAvaAnswerPacket(event.answer)
          ) {
            sawPacket = true;
            const answerPacket = event.answer;
            const packetBody = answerBodyFromPacket(answerPacket);
            const hasArtifacts = hasPacketArtifacts(answerPacket);
            const packetCitations: AskSource[] = answerPacket.citations.map(
              (citation) => ({
                id: citation.id,
                type: askSourceTypeFromCitation(citation.sourceClass),
                name: citation.label,
                detail: citation.excerpt ?? "",
                confidence:
                  citation.confidence === "high"
                    ? 0.9
                    : citation.confidence === "medium"
                      ? 0.65
                      : 0.35,
              }),
            );
            setThread((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? {
                      ...msg,
                      body:
                        resolveSourceAssistantAnswerText(
                          rawAnswer,
                          packetBody,
                        ) ||
                        (hasArtifacts
                          ? "Structured answer ready."
                          : "aVa did not return visible prose."),
                      citations:
                        packetCitations.length > 0
                          ? packetCitations
                          : msg.citations,
                      agentAnswer: answerPacket,
                    }
                  : msg,
              ),
            );
            return;
          }
          if (event.type === "error") {
            const message =
              typeof event.error === "string"
                ? event.error
                : "Unknown ask error";
            setThread((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, body: `I hit an error: ${message}` }
                  : msg,
              ),
            );
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            applyAskEvent(line);
          }
        }
        if (buffer.trim()) applyAskEvent(buffer);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection error";
        setThread((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, body: `I hit an error: ${message}` }
              : msg,
          ),
        );
      }

      if (!sawPacket && rawAnswer.trim().length === 0) {
        setThread((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, body: "aVa did not return a response." }
              : msg,
          ),
        );
      }
    },
    [tenantName, vm.avaSurfaceContext],
  );

  useEffect(() => {
    const onResize = () =>
      // "tight" spans the laptop band (roughly a 13"-16" MacBook browser
      // window) where the Explorer starves the canvas below its ~720-800px
      // working width; "wide" is an external-monitor viewport with room for
      // both panes plus the aVa dock at once.
      setState({
        narrow: window.innerWidth < 760,
        tight: window.innerWidth < 1440,
        wide: window.innerWidth >= 1440,
      });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="sw-root"
      style={{
        height: "calc(100dvh - 73px)",
        display: "flex",
        flexDirection: "column",
        background: "#f5f1eb",
        overflow: "hidden",
      }}
    >
      {portfolio.isEmpty ? (
        <div
          role="status"
          style={{
            background: "#3a1f0c",
            color: "rgba(255,255,255,.86)",
            fontSize: 11,
            padding: "5px 20px",
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <strong style={{ color: "#ffb066", fontWeight: 800 }}>
            No Source rows returned
          </strong>
          <span style={{ color: "rgba(255,255,255,.74)" }}>
            Nothing below is estimated in its place.
          </span>
        </div>
      ) : null}

      <div
        style={{
          flex: 1,
          display: "block",
          minHeight: 0,
        }}
      >
        {/* ── Canvas, wrapped in the shared aVa dock (same component/pattern as Moves' Move advisor) ── */}
        <AgentDock
          agent={SOURCE_WORKSPACE_AGENT}
          surface="/source/workspace"
          defaultMode="collapsed"
          collapsedRestoreMode="expand"
          collapsedSummary={{ label: "aVa", detail: vm.title }}
          thread={thread}
          onMessage={onAvaMessage}
          suggestedActions={vm.avaSuggestedActions}
          surfaceContext={vm.avaSurfaceContext}
          workspace={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                height: "100%",
                overflowY: "auto",
              }}
            >
              {hidesWorkspaceHeader ? null : (
                <div
                  style={{
                    background: "#fff",
                    borderBottom: "1px solid rgba(10,10,11,.12)",
                    padding: vm.isContract ? "10px 24px 0" : "16px 30px 0",
                    position: "sticky",
                    top: 0,
                    zIndex: 30,
                    flex: "0 0 auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      color: "#888780",
                      marginBottom: vm.isContract ? 7 : 11,
                    }}
                  >
                    {vm.crumbs.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ color: c.color }}>{c.label}</span>
                        {c.sep ? (
                          <span style={{ color: "#d3d1c7" }}>{c.sep}</span>
                        ) : null}
                      </span>
                    ))}
                    <span
                      style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        textTransform: "none",
                        letterSpacing: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: vm.availDot,
                        }}
                      />
                      <span style={{ color: "#5f5e5a" }}>{vm.availLabel}</span>
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 18,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        flex: "1 1 460px",
                        minWidth: "min(100%,420px)",
                      }}
                    >
                      <h1
                        style={{
                          fontFamily: vm.isContract
                            ? "Inter,system-ui,sans-serif"
                            : "Fraunces,Georgia,serif",
                          fontWeight: vm.isContract ? 760 : 500,
                          fontSize: vm.isContract
                            ? "clamp(19px,1.35vw,24px)"
                            : "clamp(22px,1.8vw,28px)",
                          lineHeight: 1.12,
                          letterSpacing: 0,
                          color: "#0a0a0b",
                          margin: vm.isContract ? "0 0 6px" : "0 0 8px",
                        }}
                      >
                        {vm.title}
                      </h1>
                      <p
                        style={{
                          fontSize: vm.isContract ? 13.2 : 14.5,
                          lineHeight: vm.isContract ? 1.45 : 1.55,
                          color: "#5f5e5a",
                          margin: vm.isContract ? "0 0 9px" : "0 0 14px",
                        }}
                      >
                        {vm.thesis}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        paddingBottom: vm.isContract ? 10 : 14,
                      }}
                    >
                      {vm.headerActions.map((a, i) => (
                        <button
                          key={i}
                          onClick={a.onClick}
                          style={{
                            border: `1px solid ${a.border}`,
                            background: a.bg,
                            color: a.fg,
                            borderRadius: 6,
                            padding: "9px 16px",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
                    {vm.tabs.map((t, i) => (
                      <button
                        key={i}
                        onClick={t.onClick}
                        style={{
                          border: "none",
                          borderBottom: `2px solid ${t.line}`,
                          background: "transparent",
                          color: t.fg,
                          fontSize: vm.isContract ? 12.5 : 13,
                          fontWeight: t.weight,
                          padding: vm.isContract ? "8px 12px" : "11px 14px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  padding: hidesWorkspaceHeader
                    ? "18px clamp(12px,2vw,28px) 70px"
                    : vm.isContract
                      ? "14px 24px 48px"
                      : "22px 30px 60px",
                  display: "flex",
                  flexDirection: "column",
                  gap: vm.isContract ? 12 : 18,
                  width: hidesWorkspaceHeader ? "100%" : undefined,
                  boxSizing: "border-box",
                }}
              >
                {isPortfolioCockpit ? <ContextLens vm={vm} /> : null}
                {vm.isVendorList || vm.isContractList ? (
                  <ListLens vm={vm} />
                ) : null}
                {vm.isVendor ? <VendorCanvas vm={vm} /> : null}
                {vm.isContract ? <ContractCanvas vm={vm} /> : null}
                {vm.isOpp ? <OpportunityCanvas vm={vm} /> : null}
                {vm.isEvidence ? <EvidenceCanvas vm={vm} /> : null}

                {vm.hasPins ? (
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid rgba(10,10,11,.12)",
                      borderRadius: 8,
                      padding: "18px 22px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9.5,
                        fontWeight: 600,
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                        color: "#0066CC",
                        marginBottom: 12,
                      }}
                    >
                      Pinned analyses · part of this workspace
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {vm.pins.map((p, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            border: "1px solid rgba(10,10,11,.12)",
                            borderRadius: 6,
                            padding: "11px 14px",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 9,
                              fontWeight: 600,
                              letterSpacing: ".08em",
                              textTransform: "uppercase",
                              color: "#0066CC",
                              border: "1px solid rgba(0,102,204,.3)",
                              borderRadius: 3,
                              padding: "2px 6px",
                            }}
                          >
                            {p.type}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#0a0a0b",
                            }}
                          >
                            {p.title}
                          </span>
                          <span style={{ fontSize: 12, color: "#5f5e5a" }}>
                            {p.note}
                          </span>
                          <span
                            style={{
                              marginLeft: "auto",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 10,
                              color: "#b4b2a9",
                            }}
                          >
                            {p.when}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          }
        />
      </div>

      <div
        style={{
          background: "#fff",
          borderTop: "1px solid rgba(10,10,11,.12)",
          minHeight: 34,
          display: hidesWorkspaceHeader ? "none" : "flex",
          alignItems: "center",
          gap: 14,
          padding: "6px 20px",
          flexShrink: 0,
          fontSize: 11.5,
          color: "#5f5e5a",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: "#888780",
          }}
        >
          Selection
        </span>
        <span
          style={{
            fontWeight: 600,
            color: "#2c2c2a",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {vm.statusSel}
        </span>
        <span
          style={{
            width: 1,
            height: 14,
            background: "rgba(10,10,11,.12)",
            flexShrink: 0,
          }}
        />
        <span>
          Position as of{" "}
          <b style={{ color: "#2c2c2a" }}>
            {new Date(portfolio.asOfDateIso).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            })}
          </b>{" "}
          · governed as_of_date
        </span>
        {vm.showStatusDetail ? (
          <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{ width: 1, height: 14, background: "rgba(10,10,11,.12)" }}
            />
            <span>
              Freshness <b style={{ color: "#2c2c2a" }}>{vm.freshness}</b>
            </span>
            <span
              style={{ width: 1, height: 14, background: "rgba(10,10,11,.12)" }}
            />
            <span>
              Evidence <b style={{ color: "#2c2c2a" }}>{vm.evidenceState}</b>
            </span>
          </span>
        ) : null}
      </div>

      <Tooltip tip={vm.tip} />
    </div>
  );
}

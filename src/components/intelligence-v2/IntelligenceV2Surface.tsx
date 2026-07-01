"use client";

// Intelligence v2 surface — executive advisor canvas. The default canvas stays
// quiet; detailed evidence, visuals, and context appear after Claude answers.
// The advisor conversation uses the shared AvaChatShell/AgentDock so
// Intelligence cannot fall back to the old centered ask page.

import { useEffect, useMemo, useState } from "react";
import type { IntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";
import {
  AvaChatShell,
  type AvaCanvasTab,
} from "@/components/ava-chat/AvaChatShell";
import type {
  AttachmentRef,
  ChatMessage,
  SuggestedAction,
} from "@/components/agent/AgentDock";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { AgentMarkdown } from "@/lib/agent/markdownRenderer";
import {
  parseIntelligenceTabbedResponse,
  type ParsedIntelligenceTab,
  visibleIntelligenceMainAnswer,
} from "@/lib/intelligence/tabbed-response";

type Tab = string;

type ExecutiveCanvasTab = {
  id: "decision" | "visual" | "context" | "proof";
  label: string;
  items: ParsedIntelligenceTab[];
};

type IntelligenceChatMessage = ChatMessage & {
  intelligenceTabs?: ParsedIntelligenceTab[];
};

const CSS = `
.iv2{--paper:#FBFAF7;--card:#FFFFFF;--ink:#1A1A18;--muted:#6B6B63;--faint:#9A998E;--line:#E7E3DA;--green:#1F6B3A;--greenbg:#E7F0E9;--amber:#A66A1F;
  background:var(--paper);color:var(--ink);min-height:100%;font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;font-size:14px;line-height:1.55}
.iv2 .wrap{max-width:1180px;margin:0 auto;padding:0 28px}
.iv2 .serif{font-family:var(--font-fraunces),Georgia,serif}
.iv2 .ey{font-family:var(--font-geist-mono),'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.iv2 .hero{text-align:left;padding:24px 0 8px}
.iv2 .hero h1{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:40px;line-height:1.08;letter-spacing:0;margin:12px 0 12px}
.iv2 .hero .sub{color:var(--muted);font-size:15px;max-width:720px;margin:0}
.iv2 .chips{display:flex;flex-wrap:nowrap;gap:8px;justify-content:center;max-width:1080px;margin:16px auto 0;overflow:hidden}
.iv2 .chips .chip{max-width:230px}
@media(max-width:760px){.iv2 .chips{flex-wrap:wrap}.iv2 .chips .chip{max-width:340px}}
.iv2 .chip{display:inline-flex;align-items:center;max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:5px 13px;font-size:12px;color:#3a3a34;cursor:pointer}
.iv2 .chip .spark{color:var(--green);margin-right:5px;flex:none}
.iv2 .chiptext{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.iv2 .trust{text-align:center;margin:22px 0 4px}
.iv2 .trust .mono{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11.5px;color:var(--muted)}
.iv2 .trust b{color:var(--ink)}
.iv2 .ansbox{max-width:960px;margin:16px auto 0;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 22px;text-align:left}
.iv2 .ansbox .anslabel{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--green);margin-bottom:8px}
.iv2 .ansbox .ansbody{font-size:14px;line-height:1.65;color:var(--ink)}
.iv2 .ansbox .ansbody>:first-child{margin-top:0}
.iv2 .ansbox .ansbody>:last-child{margin-bottom:0}
.iv2 .ansbox .ansbody table{font-size:13px;margin:10px 0}
.iv2 .ansbox .ansfetching{color:var(--faint);font-style:italic;font-size:13.5px}
.iv2 .ansbox .ansexperts{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-top:14px;padding-top:13px;border-top:1px solid var(--line)}
.iv2 .ansbox .ansexpertslabel{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--faint);margin-right:3px}
.iv2 .ansbox .ansexpertchip{display:inline-flex;align-items:center;background:var(--greenbg);color:var(--green);border-radius:20px;padding:3px 11px;font-size:11.5px;font-weight:500}
.iv2 .ansbox .ansfollowups{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
.iv2 .tabs{display:flex;justify-content:flex-start;gap:22px;border-bottom:1px solid var(--line);margin-top:18px;overflow-x:auto}
.iv2 .tab{padding:13px 2px;font-size:14px;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;display:flex;align-items:center;gap:7px;background:none;font-family:inherit;white-space:nowrap}
.iv2 .tab.active{color:var(--ink);border-bottom-color:var(--green)}
.iv2 .tab .ct{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;color:var(--faint)}
.iv2 .section{padding:26px 0 80px}
.iv2 .answerPanel{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:24px;display:grid;gap:14px;box-shadow:0 1px 0 rgba(0,0,0,.02)}
.iv2 .answerPanel h3{font-family:var(--font-fraunces),Georgia,serif;font-size:24px;font-weight:500;margin:0}
.iv2 .answerText{white-space:pre-wrap;font-size:15px;line-height:1.65;color:var(--ink)}
.iv2 .decisionTabPanel{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:24px;display:grid;gap:18px;box-shadow:0 1px 0 rgba(0,0,0,.02)}
.iv2 .decisionTabHead{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding-bottom:12px}
.iv2 .decisionTabTitle{font-family:var(--font-fraunces),Georgia,serif;font-size:24px;font-weight:500}
.iv2 .decisionTabHint{font-size:12.5px;color:var(--muted);max-width:420px;line-height:1.5}
.iv2 .contextNote{font-size:12px;color:var(--muted);white-space:nowrap}
.iv2 .tabMarkdown{font-size:14px;line-height:1.65}
.iv2 .tabMarkdown table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;margin:10px 0 2px;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.iv2 .tabMarkdown th,.iv2 .tabMarkdown td{border-bottom:1px solid var(--line);padding:10px 12px;vertical-align:top}
.iv2 .tabMarkdown th+th,.iv2 .tabMarkdown td+td{border-left:1px solid var(--line)}
.iv2 .tabMarkdown tr:last-child td{border-bottom:0}
.iv2 .tabMarkdown th{background:#F4F2EC;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
.iv2 .canvasBlock{display:grid;gap:10px}
.iv2 .canvasBlock+.canvasBlock{padding-top:16px;border-top:1px solid var(--line)}
.iv2 .canvasBlockHead{display:flex;align-items:center;justify-content:space-between;gap:12px}
.iv2 .canvasBlockTitle{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--green)}
.iv2 .emptyAnswer{border:1px dashed var(--line);border-radius:8px;padding:22px;color:var(--muted);background:rgba(255,255,255,.55)}
.iv2 .startPanel{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:28px;max-width:760px}
.iv2 .startPanel h3{font-family:var(--font-fraunces),Georgia,serif;font-size:28px;font-weight:500;margin:0 0 10px}
.iv2 .startPanel p{font-size:15px;color:var(--muted);margin:0;max-width:620px}
.iv2 .sechead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px}
.iv2 .grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.iv2 .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.iv2 .card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:22px 24px}
.iv2 .tags{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
.iv2 .tag{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.iv2 .tag.sep{color:var(--faint)}
.iv2 .tag.cross{background:var(--greenbg);color:var(--green);padding:2px 7px;border-radius:4px}
.iv2 .card h3{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:21px;line-height:1.22;letter-spacing:-.01em;margin-bottom:10px}
.iv2 .card .body{color:#3d3d36;font-size:13.5px;line-height:1.6}
.iv2 .card .rule{height:1px;background:var(--line);margin:16px 0 13px}
.iv2 .cardfoot{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.iv2 .conf{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.08em;background:var(--greenbg);color:var(--green);padding:3px 8px;border-radius:4px}
.iv2 .conf.med{background:#FBF3E3;color:var(--amber)}
.iv2 .evi{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px}
.iv2 .evi .dot{width:5px;height:5px;border-radius:50%;background:var(--green);display:inline-block}
.iv2 .act{margin-left:auto;display:flex;gap:18px}
.iv2 .act a{font-size:12.5px;color:#2a2a26;cursor:pointer;text-decoration:none}
.iv2 .act a.move{color:var(--green)}
.iv2 .dimcard{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:20px}
.iv2 .dimhead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.iv2 .dimcard h4{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:18px;letter-spacing:-.01em}
.iv2 .loaded{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;background:var(--greenbg);color:var(--green);padding:3px 7px;border-radius:4px;white-space:nowrap}
.iv2 .dimcard .desc{color:var(--muted);font-size:12.5px;margin:5px 0 16px}
.iv2 .stats{display:flex;gap:26px}
.iv2 .stat .k{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.iv2 .stat .v{font-family:var(--font-fraunces),Georgia,serif;font-size:22px;font-weight:500;margin-top:2px}
.iv2 .flag{color:var(--amber);font-size:11.5px;margin-top:12px;font-family:var(--font-geist-mono),ui-monospace,monospace}
.iv2 .cpat .dom{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--green);margin-bottom:8px}
.iv2 .cpat p{color:var(--muted);font-size:12.5px}
@media(max-width:900px){.iv2 .grid2,.iv2 .grid3{grid-template-columns:1fr}}
`;

function buildSurfaceContext(payload: IntelligenceBindingPayload) {
  const tenantFacts = [
    `Active tenant is ${payload.tenant.displayName} (${payload.tenant.key}), industry ${payload.tenant.industry}.`,
    `The current enterprise view spans ${payload.trustLine.dimensionsLoaded} business areas across ${payload.trustLine.sources} source families, with ${payload.trustLine.searchVerifiedPct}% search verification.`,
    ...payload.context.map(
      (dimension) =>
        `${dimension.dimension}: ${dimension.description}. Source depth: ${sourceDepthLabel(dimension.evidence)} across ${dimension.sources} source families; confidence tier: ${confidenceTierLabel(dimension.trust)}.`,
    ),
  ];
  const strategyFacts = payload.signals.map((signal) => {
    const move = signal.move
      ? ` Recommended move: ${signal.move.title}; owner ${signal.move.owner ?? "unassigned"}; impact ${signal.move.impact ?? "not quantified"}.`
      : "";
    return `${signal.headline} ${signal.body} Confidence ${signal.confidence}; source references available.${move}`;
  });
  const qualityFacts = payload.corpus.map(
    (pattern) =>
      `Industry corpus pattern: ${pattern.patternName} (${pattern.domain}). Apply when: ${pattern.whenToApply}`,
  );

  return {
    activeTab: "intelligence",
    activeClient: payload.tenant.displayName,
    clientKey: payload.tenant.key,
    pageFacts: [
      "This is the Intelligence advisory surface. Prefer tenant-specific business material over generic examples.",
      ...payload.suggestedQuestions.map(
        (question) => `Suggested executive question: ${question}`,
      ),
    ],
    tenantFacts,
    strategyFacts,
    qualityFacts,
  };
}

function sourceDepthLabel(count: number): string {
  if (count >= 1000) return "broad";
  if (count >= 100) return "moderate";
  if (count > 0) return "thin";
  return "not yet represented";
}

function confidenceTierLabel(score: number): string {
  if (score >= 85) return "high";
  if (score >= 65) return "medium";
  if (score > 0) return "low";
  return "not assessed";
}

function eventText(event: { delta?: unknown; text?: unknown }): string {
  if (typeof event.delta === "string") return event.delta;
  if (typeof event.text === "string") return event.text;
  return "";
}

function newTurnId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function answerBodyFromPacket(answer: AvaAnswerPacket): string {
  return (
    answer.prose?.trim() ||
    answer.directAnswer?.trim() ||
    [answer.interpretation, answer.businessImplication, answer.recommendation]
      .filter((part): part is string => Boolean(part?.trim()))
      .join("\n\n")
      .trim()
  );
}

function visibleLatestAnswerText(message: ChatMessage): string {
  const packetText = message.agentAnswer
    ? answerBodyFromPacket(message.agentAnswer)
    : "";
  const raw = packetText || message.body;
  return visibleIntelligenceMainAnswer(raw);
}

function intelligenceTabsFromAnswer(
  answer?: AvaAnswerPacket | null,
): ParsedIntelligenceTab[] {
  const frame = answer?.decisionFrame;
  if (!frame || typeof frame !== "object") return [];
  const tabs = (frame as { intelligenceTabs?: unknown }).intelligenceTabs;
  if (!Array.isArray(tabs)) return [];
  return tabs.filter(isParsedIntelligenceTab);
}

function intelligenceTabsFromMessage(
  message?: IntelligenceChatMessage | null,
): ParsedIntelligenceTab[] {
  if (!message) return [];
  if (message.intelligenceTabs && message.intelligenceTabs.length > 0) {
    return message.intelligenceTabs;
  }
  const packetTabs = intelligenceTabsFromAnswer(message.agentAnswer);
  if (packetTabs.length > 0) return packetTabs;
  return parseIntelligenceTabbedResponse(message.body).tabs;
}

function isParsedIntelligenceTab(
  value: unknown,
): value is ParsedIntelligenceTab {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ParsedIntelligenceTab>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.grounding === "string"
  );
}

function contextLabel(grounding: ParsedIntelligenceTab["grounding"]): string {
  switch (grounding) {
    case "tenant-evidence":
      return "Company evidence";
    case "function-context":
      return "Functional lens";
    case "category-context":
      return "Category lens";
    case "industry-context":
      return "Industry lens";
    case "corpus-pattern":
      return "Pattern lens";
    case "benchmark":
      return "Benchmark lens";
    case "mixed":
      return "Mixed lens";
    case "unknown":
    default:
      return "Context noted";
  }
}

function shouldShowContextNote(
  groupId: ExecutiveCanvasTab["id"],
  grounding: ParsedIntelligenceTab["grounding"],
): boolean {
  if (groupId === "proof") return true;
  return grounding === "industry-context" || grounding === "benchmark";
}

function executiveTabIdFor(
  tab: ParsedIntelligenceTab,
): ExecutiveCanvasTab["id"] {
  if (tab.id === "decision") return "decision";
  if (tab.id === "chart" || tab.id === "table") return "visual";
  if (tab.id === "industry_insights") return "context";
  return "proof";
}

function executiveTabsFrom(
  tabs: ParsedIntelligenceTab[],
): ExecutiveCanvasTab[] {
  const groups: ExecutiveCanvasTab[] = [
    { id: "decision", label: "Decision", items: [] },
    { id: "visual", label: "Visual", items: [] },
    { id: "context", label: "Context", items: [] },
    { id: "proof", label: "Proof", items: [] },
  ];
  for (const item of tabs) {
    const group = groups.find(
      (candidate) => candidate.id === executiveTabIdFor(item),
    );
    if (group) group.items.push(item);
  }
  return groups.filter((group) => group.items.length > 0);
}

function companionHintFor(tabId: ExecutiveCanvasTab["id"]): string {
  switch (tabId) {
    case "decision":
      return "The answer stays in the chat. This pane keeps the choice, tradeoff, and executive action visible.";
    case "visual":
      return "Use this pane for chart-ready or table-ready context that helps size, compare, or sequence the decision.";
    case "context":
      return "Use this pane for adjacent industry, benchmark, or pattern context without confusing it with tenant proof.";
    case "proof":
      return "Use this pane to check the evidence boundary, assumptions, and missing inputs behind the answer.";
  }
}

export function IntelligenceV2Surface({
  payload,
  tenantName,
}: {
  payload: IntelligenceBindingPayload;
  // Accepted for API compatibility (callers still pass it) but intentionally
  // NOT rendered: the header stays generic ("your enterprise") in production so
  // it never surfaces a client/tenant name. Re-bind here to restore personalization.
  tenantName?: string;
}) {
  const [tab, setTab] = useState<Tab>("answer");
  const [thread, setThread] = useState<IntelligenceChatMessage[]>([]);
  const [latestAnswer, setLatestAnswer] =
    useState<IntelligenceChatMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const t = payload;
  const surfaceContext = buildSurfaceContext({
    ...t,
    tenant: {
      ...t.tenant,
      displayName: tenantName?.trim() || t.tenant.displayName,
    },
  });
  const latestIntelligenceTabs = useMemo(
    () => intelligenceTabsFromMessage(latestAnswer),
    [latestAnswer],
  );
  const executiveTabs = useMemo(
    () => executiveTabsFrom(latestIntelligenceTabs),
    [latestIntelligenceTabs],
  );
  const tabs = useMemo<AvaCanvasTab[]>(() => {
    if (executiveTabs.length > 0) {
      return executiveTabs.map((item) => ({
        id: item.id,
        label: item.label,
      }));
    }
    return [{ id: "answer", label: "Answer" }];
  }, [executiveTabs]);

  useEffect(() => {
    if (!latestAnswer) return;
    if (executiveTabs.length > 0) {
      const hasActiveCompanionTab = executiveTabs.some(
        (item) => item.id === tab,
      );
      if (!hasActiveCompanionTab) {
        setTab(executiveTabs[0]?.id ?? "answer");
      }
      return;
    }
    if (tab !== "answer") setTab("answer");
  }, [executiveTabs, latestAnswer, tab]);

  async function askIntelligence(
    text: string,
    attachments: AttachmentRef[] = [],
  ) {
    const q = text.trim();
    if (!q && attachments.length === 0) return;

    const userTurn: ChatMessage = {
      id: newTurnId("intelligence-user"),
      role: "user",
      body:
        attachments.length > 0
          ? `${q}${q ? "\n\n" : ""}[attached: ${attachments.map((a) => a.file_name).join(", ")}]`
          : q,
    };
    const agentId = newTurnId("intelligence-ava");
    const agentTurn: ChatMessage = {
      id: agentId,
      role: "agent",
      body: "",
    };

    setThread((prev) => [...prev, userTurn, agentTurn]);
    setLatestAnswer(agentTurn);
    setTab("answer");
    setBusy(true);

    try {
      const response = await fetch("/api/intelligence/ask", {
        method: "POST",
        headers: {
          Accept: "application/x-ndjson",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q,
          client: t.tenant.key,
          format: "rich",
          surfaceContext,
          attachmentIds: attachments.map((attachment) => attachment.id),
        }),
      });
      if (!response.ok || !response.body) {
        throw new Error(`Intelligence request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answerText = "";
      let structuredAnswer: AvaAnswerPacket | null = null;
      let sawTabPacketDuringStream = false;

      function updateAgentTurn(
        body: string,
        agentAnswer?: AvaAnswerPacket | null,
      ) {
        const parsed = parseIntelligenceTabbedResponse(body);
        const visibleBody = visibleIntelligenceMainAnswer(body);
        const intelligenceTabs =
          parsed.tabs.length > 0 ? parsed.tabs : undefined;
        setThread((prev) =>
          prev.map((turn) =>
            turn.id === agentId
              ? {
                  ...turn,
                  body: visibleBody,
                  intelligenceTabs,
                  ...(agentAnswer ? { agentAnswer } : null),
                }
              : turn,
          ),
        );
        setLatestAnswer((current) =>
          current?.id === agentId
            ? {
                ...current,
                body: visibleBody,
                intelligenceTabs,
                ...(agentAnswer ? { agentAnswer } : null),
              }
            : current,
        );
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as {
            type?: string;
            delta?: string;
            text?: string;
            answer?: AvaAnswerPacket;
            error?: string;
            telemetryEventId?: string;
          };
          if (event.type === "error") {
            throw new Error(event.error ?? "Intelligence stream error");
          }
          if (event.type === "agent-answer" && event.answer) {
            const packetBody = answerBodyFromPacket(event.answer);
            const packetTabs = parseIntelligenceTabbedResponse(
              packetBody || answerText,
            ).tabs;
            const directAnswer = visibleIntelligenceMainAnswer(
              event.answer.directAnswer?.trim() || answerText.trim(),
            );
            const prose = visibleIntelligenceMainAnswer(
              event.answer.prose?.trim() ||
                event.answer.directAnswer?.trim() ||
                answerText.trim(),
            );
            const decisionFrame =
              packetTabs.length > 0
                ? {
                    ...(event.answer.decisionFrame ?? {}),
                    intelligenceTabs: packetTabs,
                  }
                : event.answer.decisionFrame;
            structuredAnswer = {
              ...event.answer,
              directAnswer,
              prose,
              ...(decisionFrame ? { decisionFrame } : null),
            };
            updateAgentTurn(packetBody || answerText.trim(), structuredAnswer);
            continue;
          }
          const delta = eventText(event);
          if (delta) {
            answerText += delta;
            const displayText = structuredAnswer
              ? answerBodyFromPacket(structuredAnswer)
              : answerText;
            sawTabPacketDuringStream =
              sawTabPacketDuringStream || /^\s*<<<TAB:/im.test(displayText);
            updateAgentTurn(
              sawTabPacketDuringStream
                ? visibleIntelligenceMainAnswer(displayText)
                : displayText,
              structuredAnswer,
            );
          }
          if (event.type === "done" && event.telemetryEventId) {
            setThread((prev) =>
              prev.map((turn) =>
                turn.id === agentId
                  ? { ...turn, feedbackEventId: event.telemetryEventId }
                  : turn,
              ),
            );
          }
        }
      }

      if (answerText.trim() && sawTabPacketDuringStream) {
        updateAgentTurn(
          (structuredAnswer ? answerBodyFromPacket(structuredAnswer) : "") ||
            answerText.trim(),
          structuredAnswer,
        );
      } else if (!answerText.trim() && structuredAnswer) {
        updateAgentTurn(
          answerBodyFromPacket(structuredAnswer),
          structuredAnswer,
        );
      } else if (!answerText.trim() && !structuredAnswer) {
        updateAgentTurn(
          "I could not produce a grounded Intelligence answer for that request yet.",
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? `aVa could not complete that request: ${error.message}`
          : "aVa could not complete that request.";
      setThread((prev) =>
        prev.map((turn) =>
          turn.id === agentId ? { ...turn, body: message } : turn,
        ),
      );
      setLatestAnswer((current) =>
        current?.id === agentId ? { ...current, body: message } : current,
      );
    } finally {
      setBusy(false);
    }
  }

  const suggestedActions = useMemo<SuggestedAction[]>(
    () =>
      t.suggestedQuestions.slice(0, 3).map((question, index) => ({
        id: `intelligence-suggested-${index}`,
        label: question,
        body: question,
        onClick: () => {
          void askIntelligence(question, []);
        },
      })),
    // askIntelligence intentionally closes over current tenant payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t.suggestedQuestions, t.tenant.key],
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <AvaChatShell
        surface="intelligence"
        thread={thread}
        onMessage={askIntelligence}
        suggestedActions={suggestedActions}
        surfaceContext={surfaceContext}
        isBusy={busy}
        defaultLeftPercent={34}
        minLeftPx={360}
        placeholder={t.ask.placeholder}
        agent={{
          role: `${t.tenant.displayName} Intelligence advisor`,
        }}
        canvas={
          <div className="iv2">
            <div className="wrap">
              <div className="hero">
                <div>
                  <div className="ey" style={{ color: "var(--green)" }}>
                    INTELLIGENCE · EXECUTIVE ADVISOR
                  </div>
                  <h1>Executive intelligence canvas.</h1>
                  <p className="sub">{t.ask.contract}</p>
                </div>
              </div>

              <div className="tabs">
                {latestAnswer
                  ? tabs.map((item) => {
                      const key = item.id;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`tab${tab === key ? " active" : ""}`}
                          onClick={() => setTab(key)}
                        >
                          {item.label}
                        </button>
                      );
                    })
                  : null}
              </div>

              <div className="section">
                {!latestAnswer && (
                  <div className="startPanel">
                    <h3>What decision needs a sharper answer?</h3>
                    <p>
                      Ask aVa about a funding choice, operating risk, vendor
                      exposure, transformation priority, or AI initiative.
                    </p>
                  </div>
                )}
                {latestAnswer && tab === "answer" && (
                  <div className="answerPanel">
                    {visibleLatestAnswerText(latestAnswer) ? (
                      <div className="answerText">
                        {visibleLatestAnswerText(latestAnswer)}
                      </div>
                    ) : (
                      <div className="ansfetching">
                        aVa is forming the answer…
                      </div>
                    )}
                  </div>
                )}
                {executiveTabs.map((item) =>
                  tab === item.id ? (
                    <div className="decisionTabPanel" key={item.id}>
                      <div className="decisionTabHead">
                        <div className="decisionTabTitle">{item.label}</div>
                        <div className="decisionTabHint">
                          {companionHintFor(item.id)}
                        </div>
                      </div>
                      {item.items.map((canvasItem) => (
                        <div className="canvasBlock" key={canvasItem.id}>
                          <div className="canvasBlockHead">
                            <div className="canvasBlockTitle">
                              {canvasItem.label}
                            </div>
                            {shouldShowContextNote(
                              item.id,
                              canvasItem.grounding,
                            ) ? (
                              <span className="contextNote">
                                {contextLabel(canvasItem.grounding)}
                              </span>
                            ) : null}
                          </div>
                          <div className="tabMarkdown">
                            <AgentMarkdown text={canvasItem.content} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          </div>
        }
      />
    </>
  );
}

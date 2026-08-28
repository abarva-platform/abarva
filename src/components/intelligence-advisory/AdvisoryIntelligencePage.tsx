"use client";

import { useMemo, useState } from "react";
import type {
  EnterpriseLandscapeViewModel,
  LandscapeSection,
} from "@/lib/home/enterprise-landscape-view-model";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { stripGovernedArtifactPayloadsFromText } from "@/lib/intelligence/answer/structured-fence-stream-filter";
import type {
  ChatMessage,
  SuggestedAction,
} from "@/components/agent/AgentDock";
import { AvaChatShell } from "@/components/ava-chat/AvaChatShell";
import type { AskSource } from "@/lib/intelligence/ask/types";

type AssistantMessage = {
  id: string;
  role: "assistant";
  question: string;
  answer: string;
  agentAnswer?: AvaAnswerPacket | null;
  status: "thinking" | "streaming" | "done" | "error";
  sources: AskSource[];
  followups: string[];
  streamStatus?: string;
  error?: string;
};

type UserMessage = { id: string; role: "user"; text: string };
type ThreadMessage = AssistantMessage | UserMessage;

function formatSafeAnswerBoundary(error?: string): string {
  const reason =
    error && !/^(unknown|ask_synthesis_empty)$/i.test(error)
      ? `\n\nEvidence boundary: ${error.replace(/^retired_fact_violation:\s*/i, "A retired or stale fact was blocked: ")}`
      : "";

  return [
    "I cannot make that client-ready claim from the loaded evidence yet.",
    "",
    "Executive read: do not name a person, date, approval status, or go-live decision unless that fact is loaded and reviewable. For a consequential finance-control workflow, keep the move in advisory/shadow mode until the accountable owner, backup authority, decision limits, training attestation, and control evidence are named.",
    "",
    "What is safe to use now:",
    "- Show the confirmed facts already loaded for this tenant.",
    "- Separate what is loaded, inferred, and missing.",
    "- Turn the gap into a decision checklist: owner named, backup named, SLA accepted, attestation captured, SOX/control evidence attached, and approval authority confirmed.",
    "",
    "What needs to be loaded before this becomes board-ready: the named accountable role/person, the effective date or target timeline, the delegation or sign-off artifact, the training/attestation record, and the evidence owner who can certify it.",
    reason,
  ]
    .filter(Boolean)
    .join("\n");
}

const AVA_INTELLIGENCE_AGENT = {
  initials: "aVa",
  mark: "ava" as const,
  name: "aVa",
  role: "Intelligence advisor",
};

function askSourceTypeFromCitation(
  sourceClass: AvaAnswerPacket["citations"][number]["sourceClass"],
): AskSource["type"] {
  if (sourceClass === "tenant-fact" || sourceClass === "tenant-chunk") {
    return "TENANT";
  }
  if (sourceClass === "graph") return "GRAPH";
  if (sourceClass === "worldview") return "WORLDVIEW";
  return "PATTERN";
}

function hasPacketArtifacts(answer: AvaAnswerPacket): boolean {
  return (
    answer.artifacts.length > 0 ||
    (answer.tables?.length ?? 0) > 0 ||
    (answer.charts?.length ?? 0) > 0 ||
    (answer.graphs?.length ?? 0) > 0
  );
}

export function stripNestedCxoBriefLabels(text: string): string {
  return text.replace(
    /((?:\*\*)?(?:Answer|Proof|Move):?(?:\*\*)?:?\s+)(?:Answer|Proof|Move)\.?\s+/gi,
    "$1",
  );
}

/**
 * Once the server has successfully extracted structured artifacts
 * (tables/charts/graphs), always prefer its clean packet body over the raw
 * streamed text. The raw stream is scrubbed PER CHUNK
 * (displaySafeIntelligenceDelta in route.ts), and governed fence markers
 * like ```decision-table are long enough to get split — and corrupted —
 * across multiple small token chunks, so pattern-matching for a "leak" on
 * the accumulated client-side text is unreliable. The server extracted the
 * SAME underlying text server-side (on the unscrubbed accumulator), so
 * packetBody is authoritative whenever it exists.
 */
export function resolveAssistantAnswerText(
  rawStreamedAnswer: string,
  packetBody: string,
  _hasArtifacts: boolean,
): string {
  void _hasArtifacts;
  const cleanPacketBody = packetBody.trim();
  return stripGovernedArtifactPayloadsFromText(
    stripNestedCxoBriefLabels(cleanPacketBody ? packetBody : rawStreamedAnswer),
  );
}

export function AdvisoryIntelligencePage({
  viewModel,
}: {
  viewModel: EnterpriseLandscapeViewModel;
}) {
  const sectionList = useMemo(
    () => Object.values(viewModel.sections),
    [viewModel.sections],
  );
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const starterPrompts = useMemo(
    () => buildStarterPrompts(viewModel),
    [viewModel],
  );

  async function submitAsk(input: string = question) {
    const trimmed = input.trim();
    if (!trimmed || isAsking) return;
    const messageIndex = messages.length;

    const userMsg: UserMessage = {
      id: `u-${messageIndex}`,
      role: "user",
      text: trimmed,
    };
    const assistantId = `a-${messageIndex + 1}`;
    const assistantMsg: AssistantMessage = {
      id: assistantId,
      role: "assistant",
      question: trimmed,
      answer: "",
      status: "thinking",
      streamStatus: "Gathering client context...",
      sources: [],
      followups: [],
    } as unknown as AssistantMessage;

    setMessages((c) => [...c, userMsg, assistantMsg]);
    setQuestion("");
    setIsAsking(true);

    try {
      const response = await fetch("/api/intelligence/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          client: viewModel.clientKey,
          format: "rich",
          richText: true,
          answerOnlyStreaming: true,
          traceEnabled: true,
          surfaceContext: buildSurfaceContext(viewModel, sectionList),
        }),
      });

      if (!response.ok || !response.body)
        throw new Error(`Ask failed with ${response.status}`);
      setMessages((c) =>
        c.map((m) =>
          m.id === assistantId && m.role === "assistant"
            ? { ...m, status: "streaming", streamStatus: "Reading evidence..." }
            : m,
        ),
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) applyAskEvent(assistantId, line);
      }
      if (buffer.trim()) applyAskEvent(assistantId, buffer);

      setMessages((c) =>
        c.map((m) =>
          m.id === assistantId && m.role === "assistant"
            ? {
                ...m,
                status: m.status === "error" ? "error" : "done",
                streamStatus: undefined,
              }
            : m,
        ),
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown ask error";
      setMessages((c) =>
        c.map((m) =>
          m.id === assistantId && m.role === "assistant"
            ? {
                ...m,
                status: "error",
                error,
                answer: "The live model path could not complete this answer.",
              }
            : m,
        ),
      );
    } finally {
      setIsAsking(false);
    }
  }

  function applyAskEvent(assistantId: string, line: string) {
    if (!line.trim()) return;
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return;
    }
    setMessages((c) =>
      c.map((m) => {
        if (m.id !== assistantId || m.role !== "assistant") return m;
        if (event.type === "delta") {
          const delta = eventText(event);
          return delta
            ? {
                ...m,
                answer: stripGovernedArtifactPayloadsFromText(
                  stripNestedCxoBriefLabels(`${m.answer}${delta}`),
                ),
                streamStatus: undefined,
              }
            : { ...m, streamStatus: "Writing the executive read..." };
        }
        if (event.type === "context-summary") {
          return {
            ...m,
            streamStatus: "Selecting client facts, gaps, and evidence...",
          };
        }
        if (event.type === "sources" && Array.isArray(event.sources)) {
          const sources = event.sources as AskSource[];
          return {
            ...m,
            sources,
            streamStatus:
              sources.length > 0
                ? `Using ${sources.length} client/context sources...`
                : "Checking available client context...",
          };
        }
        if (event.type === "agent-answer" && isAvaAnswerPacket(event.answer)) {
          const packetBody = answerBodyFromPacket(event.answer);
          const hasArtifacts = hasPacketArtifacts(event.answer);
          const packetFollowups = event.answer.nextSteps
            .map((s) => s.label)
            .filter((s): s is string => Boolean(s?.trim()))
            .slice(0, 3);
          return {
            ...m,
            agentAnswer: event.answer,
            answer: resolveAssistantAnswerText(
              m.answer,
              packetBody,
              hasArtifacts,
            ),
            sources: event.answer.citations.map((c) => ({
              id: c.id,
              type: askSourceTypeFromCitation(c.sourceClass),
              name: c.label,
              detail: c.excerpt ?? "",
              confidence:
                c.confidence === "high"
                  ? 0.9
                  : c.confidence === "medium"
                    ? 0.65
                    : 0.35,
            })),
            // The dedicated "followups" event (see below) usually arrives
            // before this "agent-answer" event and carries the real,
            // question-specific suggestions; the packet's own nextSteps is
            // frequently empty for this route. Never let an empty packet
            // list clobber followups already set from that earlier event.
            followups: packetFollowups.length ? packetFollowups : m.followups,
            streamStatus: undefined,
          };
        }
        if (event.type === "followups" && Array.isArray(event.followups)) {
          return {
            ...m,
            followups: (event.followups as unknown[])
              .filter((s): s is string => typeof s === "string")
              .slice(0, 3),
          };
        }
        if (event.type === "error")
          return {
            ...m,
            status: "error",
            error:
              typeof event.error === "string"
                ? event.error
                : "Unknown ask error",
          };
        return m;
      }),
    );
  }

  // Convert internal ThreadMessage[] → ChatMessage[] for AgentDock
  const thread = useMemo<ChatMessage[]>(
    () =>
      messages.map((m) =>
        m.role === "user"
          ? { id: m.id, role: "user" as const, body: m.text }
          : {
              id: m.id,
              role: "agent" as const,
              body:
                m.status === "error"
                  ? formatSafeAnswerBoundary(m.error)
                  : m.answer.trim() ||
                    m.streamStatus ||
                    "Gathering client context...",
              citations: m.sources.length > 0 ? m.sources : undefined,
              agentAnswer: m.agentAnswer ?? undefined,
            },
      ),
    [messages],
  );

  // suggestedActions: followups from the latest answer, or starter prompts
  const latestAssistant = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((m): m is AssistantMessage => m.role === "assistant"),
    [messages],
  );
  const suggestedActions = useMemo<SuggestedAction[]>(() => {
    const labels = latestAssistant?.followups.length
      ? latestAssistant.followups
      : starterPrompts;
    return labels.map((p) => ({
      id: p,
      label: p,
      body: p,
      onClick: () => void submitAsk(p),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestAssistant, starterPrompts]);

  // onMessage handler for AvaChatShell
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMessage = async (text: string, _attachments?: unknown) => {
    await submitAsk(text);
  };

  return (
    <AvaChatShell
      surface="intelligence"
      agent={AVA_INTELLIGENCE_AGENT}
      placeholder="Ask aVa"
      layout="chat-only"
      defaultLeftPercent={40}
      minLeftPx={380}
      thread={thread}
      onMessage={handleMessage}
      canvas={null}
      suggestedActions={suggestedActions}
      keepSuggestedActionsVisible={true}
      isBusy={isAsking}
      surfaceContext={buildSurfaceContext(viewModel, sectionList)}
    />
  );
}

function buildStarterPrompts(
  viewModel: EnterpriseLandscapeViewModel,
): string[] {
  return [
    `What are the top AI opportunities for ${viewModel.tenantName}, grounded only in the loaded context?`,
    `Which current-state technology, data, or operating-model gaps should a CXO care about first?`,
    `What can aVa safely say today, what is inferred, and what still needs evidence?`,
  ];
}

function buildSurfaceContext(
  viewModel: EnterpriseLandscapeViewModel,
  sectionList: LandscapeSection[],
) {
  const first = sectionList[0];
  return {
    activeTab: "intelligence",
    activeClient: viewModel.tenantName,
    clientKey: viewModel.clientKey,
    pageFacts: [
      `${viewModel.tenantName} Intelligence briefing — industry & estate context`,
      first?.executiveSummary ?? "",
      first?.leadershipRead ?? "",
    ],
    tenantFacts: [
      ...sectionList
        .slice(0, 3)
        .flatMap((s) =>
          s.currentState.slice(0, 3).map((r) => `${r.area}: ${r.assessment}`),
        ),
    ],
    qualityFacts: sectionList
      .flatMap((s) => s.maturity)
      .slice(0, 8)
      .map((m) => `${m.label}: ${m.score}%`),
    sourceFacts: sectionList
      .flatMap((s) => s.sources)
      .slice(0, 6)
      .map((s) => `${s.title}: ${s.detail}`),
  };
}

function eventText(event: Record<string, unknown>) {
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

function answerBodyFromPacket(answer: AvaAnswerPacket): string {
  const body =
    answer.prose?.trim() ||
    answer.directAnswer?.trim() ||
    [answer.interpretation, answer.businessImplication, answer.recommendation]
      .filter((p): p is string => Boolean(p?.trim()))
      .join("\n\n")
      .trim();
  return stripGovernedArtifactPayloadsFromText(body);
}

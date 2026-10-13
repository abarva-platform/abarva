"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  EnterpriseLandscapeViewModel,
  LandscapeSection,
} from "@/lib/home/enterprise-landscape-view-model";
import { buildEnterpriseContextSpine } from "@/lib/intelligence/enterprise-context-spine";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { stripGovernedArtifactPayloadsFromText } from "@/lib/intelligence/answer/structured-fence-stream-filter";
import type {
  ChatMessage,
  SuggestedAction,
} from "@/components/agent/AgentDock";
import { executiveReviewQuestions } from "@/lib/intelligence/answer/quality-review";
import { AvaChatShell } from "@/components/ava-chat/AvaChatShell";
import type { AskSource } from "@/lib/intelligence/ask/types";
import {
  takeHomeQuestion,
  type HomeIntelligenceState,
} from "@/lib/home/preview/intelligence-handoff";

type AssistantMessage = {
  id: string;
  role: "assistant";
  question: string;
  answer: string;
  /**
   * Every `delta` received so far, unstripped. The visible `answer` is derived
   * from it on each chunk. Stripping the visible text and appending the next
   * chunk to that loses a payload opener the strip already removed, and trims
   * the whitespace a chunk ended on (item U-549).
   */
  rawAnswer?: string;
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
  return `This answer could not be completed.${error ? `\n\n${error}` : ""}`;
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

/**
 * Once the server has successfully extracted structured artifacts
 * (tables/charts/graphs), always prefer its clean packet body over the raw
 * streamed text. Governed artifact fences are protocol payloads for the
 * native renderer; the visible chat should preserve Claude-authored advisory
 * prose rather than rewrite it after generation.
 */
/**
 * Governed artifact payloads are stripped from the visible answer in
 * `resolveAssistantAnswerText`, which only runs in the `agent-answer` branch.
 * An answer that completes without a packet keeps the raw streamed
 * accumulation, which has passed through nothing but label cleanup -- and that
 * text is the only thing the reader ever sees. Finalising every stream through
 * the same strip means a governed fence cannot reach the rail on any path.
 * Stripping already-clean text is a no-op, so the packet branch is unaffected.
 */
export function finalizeAssistantMessage<
  T extends {
    status: string;
    answer: string;
    streamStatus?: string;
    agentAnswer?: AvaAnswerPacket | null;
  },
>(message: T): T {
  return {
    ...message,
    status: message.status === "error" ? "error" : "done",
    answer: message.agentAnswer?.modelAuthored
      ? message.answer
      : stripGovernedArtifactPayloadsFromText(message.answer),
    streamStatus: undefined,
  };
}

export function resolveAssistantAnswerText(
  rawStreamedAnswer: string,
  packetBody: string,
  _hasArtifacts: boolean,
): string {
  void _hasArtifacts;
  const cleanPacketBody = packetBody.trim();
  return stripGovernedArtifactPayloadsFromText(
    cleanPacketBody ? packetBody : rawStreamedAnswer,
  );
}

export function AdvisoryIntelligencePage({
  viewModel,
  homeHandoff,
}: {
  viewModel: EnterpriseLandscapeViewModel;
  homeHandoff?: HomeIntelligenceState;
}) {
  const sectionList = useMemo(
    () => Object.values(viewModel.sections),
    [viewModel.sections],
  );
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [homeQuestion, setHomeQuestion] = useState<string | null>(null);
  const continuationBlocked = homeHandoff && homeHandoff.status !== "ready";
  useEffect(() => {
    if (homeHandoff?.status === "ready") {
      const selectedQuestion = takeHomeQuestion(homeHandoff.request);
      if (selectedQuestion) setHomeQuestion(selectedQuestion);
    }
  }, [homeHandoff]);
  const starterPrompts = useMemo(
    () =>
      homeQuestion
        ? [
            homeQuestion,
            ...buildStarterPrompts(viewModel)
              .filter((prompt) => prompt !== homeQuestion)
              .slice(0, 3),
          ]
        : buildStarterPrompts(viewModel),
    [viewModel, homeQuestion],
  );

  async function submitAsk(input: string = question) {
    const trimmed = input.trim();
    if (!trimmed || isAsking || continuationBlocked) return;
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
      rawAnswer: "",
      status: "thinking",
      streamStatus: "Gathering client context...",
      sources: [],
      followups: [],
    } as unknown as AssistantMessage;

    setMessages((c) => [...c, userMsg, assistantMsg]);
    setQuestion("");
    setIsAsking(true);
    let progressTicks = 0;
    const progressTimer = window.setInterval(() => {
      progressTicks += 1;
      const elapsedSeconds = progressTicks * 10;
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId &&
          message.role === "assistant" &&
          message.status !== "done" &&
          message.status !== "error" &&
          !message.answer.trim()
            ? {
                ...message,
                streamStatus: `Still working on this request · about ${elapsedSeconds}s elapsed`,
              }
            : message,
        ),
      );
    }, 10_000);

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
          modelAuthoredOutput: true,
          traceEnabled: true,
          surfaceContext: buildSurfaceContext(viewModel, sectionList),
          ...(homeHandoff ? { homeContextRequest: homeHandoff.request } : {}),
        }),
      });

      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        throw new Error(
          typeof failure?.error === "string"
            ? failure.error
            : "The advisor could not complete this question.",
        );
      }
      if (!response.body) throw new Error("The advisor returned no answer.");
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
            ? finalizeAssistantMessage(m)
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
      window.clearInterval(progressTimer);
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
        if (
          event.type === "answer-progress" &&
          typeof event.text === "string"
        ) {
          return {
            ...m,
            answer: event.text,
            streamStatus: undefined,
          };
        }
        if (event.type === "delta") {
          const delta = eventText(event);
          if (!delta)
            return { ...m, streamStatus: "Writing the executive read..." };
          const rawAnswer = `${m.rawAnswer ?? ""}${delta}`;
          return {
            ...m,
            rawAnswer,
            answer: stripGovernedArtifactPayloadsFromText(rawAnswer),
            streamStatus: undefined,
          };
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
            answer: event.answer.modelAuthored
              ? packetBody
              : resolveAssistantAnswerText(m.answer, packetBody, hasArtifacts),
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
                  : m.answer || m.streamStatus || "Gathering client context...",
              citations: m.sources.length > 0 ? m.sources : undefined,
              agentAnswer: m.agentAnswer ?? undefined,
              streamStatus:
                m.answer.trim() && m.status === "streaming"
                  ? "Preparing the rest of the answer…"
                  : undefined,
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
    const labels = latestAssistant ? latestAssistant.followups : starterPrompts;
    return labels.map((p) => ({
      id: p,
      label: p,
      body: p,
      onClick: () => void submitAsk(p),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestAssistant, starterPrompts, isAsking, homeHandoff]);

  // onMessage handler for AvaChatShell
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMessage = async (text: string, _attachments?: unknown) => {
    await submitAsk(text);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {homeHandoff && (
        <section
          aria-label="Home continuation"
          className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-3 text-sm"
        >
          <div>
            {homeHandoff.status === "ready" ? (
              <>
                <strong>From Home</strong> · {homeHandoff.sourceLabel}
                {homeHandoff.chapterTitle
                  ? ` · ${homeHandoff.chapterTitle}`
                  : ""}
              </>
            ) : (
              <span role="alert">
                {homeHandoff.status === "changed"
                  ? "Home's record changed."
                  : "The selected Home record is unavailable."}
              </span>
            )}
          </div>
          <a
            href={`/home?tenant=${encodeURIComponent(homeHandoff.request.tenantKey)}`}
            className="text-teal-700 underline"
          >
            Return to Home
          </a>
        </section>
      )}
      <AvaChatShell
        surface="intelligence"
        agent={AVA_INTELLIGENCE_AGENT}
        placeholder="Ask aVa"
        layout="chat-only"
        chatOnlyFullWidth
        defaultLeftPercent={40}
        minLeftPx={380}
        thread={thread}
        onMessage={handleMessage}
        canvas={null}
        suggestedActions={continuationBlocked ? [] : suggestedActions}
        keepSuggestedActionsVisible={true}
        isBusy={isAsking || Boolean(continuationBlocked)}
        preserveVisibleText
        surfaceContext={buildSurfaceContext(viewModel, sectionList)}
      />
    </div>
  );
}

/**
 * Starters are the clearest statement of what this surface is for, so each one
 * points at a different executive job: understand the enterprise, decide where
 * to invest, see what is coming, and pressure-test the strategy against it.
 *
 * Wording is not cosmetic here. The answer-mode classifier is lexical, so a
 * starter phrased without an outlook or ranking signal falls through to the
 * general mode and comes back less specific than the question deserves.
 * `intelligence-starter-prompts.test.ts` pins the mode each starter reaches --
 * change the wording there too, or the guard will tell you what you lost.
 */
export function buildStarterPrompts(
  viewModel: EnterpriseLandscapeViewModel,
): string[] {
  return executiveReviewQuestions(viewModel).slice(0, 4);
}

function buildSurfaceContext(
  viewModel: EnterpriseLandscapeViewModel,
  sectionList: LandscapeSection[],
) {
  return {
    activeTab: "intelligence",
    activeClient: viewModel.tenantName,
    clientKey: viewModel.clientKey,
    ...buildEnterpriseContextSpine(viewModel, sectionList),
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
  if (answer.modelAuthored) return answer.prose ?? answer.directAnswer;
  const body =
    answer.prose?.trim() ||
    answer.directAnswer?.trim() ||
    [answer.interpretation, answer.businessImplication, answer.recommendation]
      .filter((p): p is string => Boolean(p?.trim()))
      .join("\n\n")
      .trim();
  return stripGovernedArtifactPayloadsFromText(body);
}

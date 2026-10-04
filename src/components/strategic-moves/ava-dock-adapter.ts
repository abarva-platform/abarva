import type { ChatMessage, SuggestedAction } from "@/components/agent/AgentDock";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";

/**
 * Adapters that let the existing Moves aVa chat state drive the shared Source
 * New `AgentDock`, so aVa in the redesigned capture flow is the SAME component
 * (look, feel, logic) Source uses — not a lookalike. Pure + framework-free so
 * they are unit-tested directly.
 */

/** A turn of the Moves aVa thread (mirrors the shell's internal `AvaChatMessage`). */
export interface AvaThreadTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  agentAnswer?: AvaAnswerPacket | null;
}

/**
 * Map the Moves aVa thread to `AgentDock`'s `ChatMessage[]`. The only real
 * translation is the role vocabulary (`assistant` → `agent`) and `text` → `body`;
 * the structured answer packet carries over so the dock renders tables/charts.
 */
export function avaThreadToDockMessages(
  turns: readonly AvaThreadTurn[],
): ChatMessage[] {
  return turns.map((turn) => {
    const message: ChatMessage = {
      id: turn.id,
      role: turn.role === "assistant" ? "agent" : "user",
      body: turn.text,
    };
    if (turn.agentAnswer) message.agentAnswer = turn.agentAnswer;
    return message;
  });
}

/**
 * Build the dock's suggested actions. `AgentDock` shows at most three, so
 * caller-supplied actions (e.g. "Draft proposed inputs", "Check blockers") come
 * first and the phase's suggested questions fill the remainder.
 */
export function avaSuggestedActions(
  questions: readonly string[],
  leadingActions: readonly SuggestedAction[] = [],
): SuggestedAction[] {
  const fromQuestions: SuggestedAction[] = questions.map((question, index) => ({
    id: `ava-q-${index}`,
    label: question,
    body: question,
  }));
  return [...leadingActions, ...fromQuestions].slice(0, 3);
}

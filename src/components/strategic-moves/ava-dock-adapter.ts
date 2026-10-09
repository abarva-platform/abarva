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

/**
 * The first phase aVa can draft capture inputs for. Drafting cites an EARLIER
 * approved capture, so P0 Originate — which has no upstream phase — is not
 * draftable, and the drafting endpoint accepts phases 1-5 only.
 */
export const AVA_PHASE_INPUT_DRAFT_FIRST_PHASE = 1;

/** The last phase aVa can draft for; mirrors the drafting endpoint's bound. */
export const AVA_PHASE_INPUT_DRAFT_LAST_PHASE = 5;

/** The dock action id for aVa's capture-input drafting offer. */
export const AVA_PHASE_INPUT_DRAFT_ACTION_ID = "draft-inputs";

export interface AvaPhaseInputDraftAvailability {
  /** Whether aVa can draft this phase's capture inputs at all. */
  available: boolean;
  /**
   * Why not, in one reader-facing sentence, when it cannot. `null` when it can.
   * A sentence rather than a silent `false` because the host both hides the
   * control AND answers a click that reaches the handler anyway: the two must
   * agree, and "nothing happened" is not an answer a product user can act on.
   */
  unavailableReason: string | null;
}

/**
 * Whether aVa's "Draft proposed inputs" offer applies to a phase.
 *
 * The offer is not universal and the dock must not present it as if it were.
 * Drafting works by carrying an EARLIER phase's approved capture forward with a
 * citation, so the first phase has nothing to draft from, and the drafting
 * endpoint (`POST .../phase-input-draft`) validates `phase` as an integer in
 * [1,5] and refuses anything else. A surface that offered the control outside
 * that window would be offering work the product cannot perform.
 */
export function avaPhaseInputDraftAvailability(
  phase: number,
): AvaPhaseInputDraftAvailability {
  if (
    Number.isInteger(phase) &&
    phase >= AVA_PHASE_INPUT_DRAFT_FIRST_PHASE &&
    phase <= AVA_PHASE_INPUT_DRAFT_LAST_PHASE
  ) {
    return { available: true, unavailableReason: null };
  }
  if (phase < AVA_PHASE_INPUT_DRAFT_FIRST_PHASE) {
    return {
      available: false,
      unavailableReason:
        "aVa drafts each input from an earlier approved capture, and P0 Originate is the first phase — there is nothing upstream to cite. Write the originate inputs yourself; aVa can draft from P1 Charter onward.",
    };
  }
  return {
    available: false,
    unavailableReason:
      "aVa drafts capture inputs for P1 Charter through P5 Mobilize. This phase has no capture set for aVa to draft.",
  };
}

/**
 * The dock's leading actions for a phase: aVa's drafting offer where it
 * applies, and NOTHING where it does not.
 *
 * The empty array is the contract. `avaSuggestedActions` places leading actions
 * first and keeps three, so an action handed to it is always rendered as an
 * enabled dock button — returning one for a phase that cannot be drafted puts a
 * dead control on the screen rather than a disabled or explained one.
 */
export function avaPhaseInputDraftLeadingActions(
  phase: number,
  onDraft: () => void,
): SuggestedAction[] {
  if (!avaPhaseInputDraftAvailability(phase).available) return [];
  return [
    {
      id: AVA_PHASE_INPUT_DRAFT_ACTION_ID,
      label: "Draft proposed inputs",
      body: "",
      onClick: onDraft,
    },
  ];
}

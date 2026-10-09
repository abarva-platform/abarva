/**
 * Whether the Moves capture dock may offer aVa's composer right now.
 *
 * The host's send handler refuses while a turn is still streaming
 * (`if (!trimmed || avaStreaming) return;`), so any surface that offers the
 * composer during a stream offers a control that does nothing. The legacy
 * Moves chat rail reads the host's streaming flag at seven sites — the
 * textarea, the send button, the suggested-question buttons, the draft-inputs
 * button and the in-flight turn's placeholder — and disables each one. The
 * `moves_capture_v2` dock read it at none.
 *
 * This module is the single authority both halves consult, so the control the
 * dock renders and the answer the handler gives cannot drift apart. Pure and
 * framework-free so it is unit-tested directly.
 */

/**
 * Placeholder the dock shows in place of the composer while a turn streams.
 * `AgentDock` renders `composerDisabledReason` as the disabled textarea's
 * placeholder, so this is read by a product user and must name the wait and
 * when it ends. No client-derived words.
 */
export const AVA_COMPOSER_STREAMING_REASON =
  "aVa is still answering — the composer reopens when this turn finishes.";

export interface AvaComposerAvailability {
  /** True when the host's send handler will accept a message right now. */
  canSend: boolean;
  /**
   * Reason to pause the dock composer, or `null` to leave it open. Passed
   * straight to `AgentDock`'s `composerDisabledReason`, which disables the
   * textarea, the attach button, the send button and the suggested actions,
   * and shows this sentence as the placeholder.
   */
  disabledReason: string | null;
  /**
   * True when the dock should show its "agent working" throbber. `AgentDock`
   * otherwise falls back to `useAtlasPageState().isStreaming`, which this
   * surface never sets — it owns a separate `avaStreaming` state — so without
   * an explicit value the in-flight turn renders as an empty agent bubble.
   */
  agentBusy: boolean;
}

/**
 * Resolve the composer's availability from the host's streaming flag — the
 * same value the send handler guards on.
 */
export function avaComposerAvailability(
  avaStreaming: boolean,
): AvaComposerAvailability {
  if (avaStreaming) {
    return {
      canSend: false,
      disabledReason: AVA_COMPOSER_STREAMING_REASON,
      agentBusy: true,
    };
  }
  return { canSend: true, disabledReason: null, agentBusy: false };
}

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AgentDock, type SuggestedAction } from "@/components/agent/AgentDock";
import {
  MovesCaptureFlow,
  type MovesCaptureFlowProps,
} from "@/components/strategic-moves/MovesCaptureFlow";
import {
  avaThreadToDockMessages,
  avaSuggestedActions,
  type AvaThreadTurn,
} from "@/components/strategic-moves/ava-dock-adapter";
import { avaComposerAvailability } from "@/components/strategic-moves/ava-composer-availability";

/**
 * The composed phase workspace for `moves_capture_v2`: the Source New
 * `AgentDock` (aVa) wrapping the 3-step `MovesCaptureFlow` as its workspace —
 * the same dock the Source new-event screen uses, so aVa's look, feel, and
 * logic match exactly. The existing Moves aVa chat state (thread, suggested
 * questions, send) drives it through the pure adapters; no second aVa.
 *
 * `tabs` is the workspace tab row (Work / Files / Intelligence / Approvals)
 * rendered above the capture content, passed in by the host so this component
 * stays agnostic to the shell's tab implementation.
 */
export interface MovesCaptureWorkspaceProps {
  moveId: string;
  moveName: string;
  phase: number;
  /** aVa eyebrow role for this phase (e.g. "Charter partner"). */
  avaRole: string;
  avaThread: readonly AvaThreadTurn[];
  avaQuestions: readonly string[];
  /** Leading dock actions (e.g. "Draft proposed inputs", "Check blockers"). */
  avaLeadingActions?: readonly SuggestedAction[];
  /**
   * True while the host's aVa turn is still streaming. The host's send
   * handler refuses in exactly this state, so the dock withholds the composer
   * and shows its throbber rather than offering a send that does nothing.
   * Absent is treated as not streaming, which is the dock's behaviour today.
   */
  avaStreaming?: boolean;
  onAvaMessage: (text: string) => void;
  /** Workspace tab row rendered above the capture content. */
  tabs?: ReactNode;
  /**
   * Governed fill-from-notes affordance (`CaptureNotesFill`), rendered at the
   * top of the dock workspace above the tabs. Absent by default and whenever
   * `moves_capture_notes_v1` is off, in which case the dock renders exactly
   * what it renders today.
   */
  notesFill?: ReactNode;
  /** The 3-step capture flow props (sections, slots, handlers). */
  captureProps?: MovesCaptureFlowProps;
  /**
   * A step page rendered as the dock's workspace instead of the capture flow
   * (`moves_step_pages_v3`). aVa stays this same dock — collapse, hide,
   * expand and full screen included — rather than a second panel.
   */
  content?: ReactNode;
  /**
   * aVa's opening turn for a step page: what it read, drafted, could not find
   * or noticed. Rendered as the first agent message of the thread.
   */
  openingBriefing?: string;
}

export function MovesCaptureWorkspace({
  moveId,
  moveName,
  phase,
  avaRole,
  avaThread,
  avaQuestions,
  avaLeadingActions = [],
  avaStreaming = false,
  onAvaMessage,
  tabs,
  notesFill,
  captureProps,
  content,
  openingBriefing,
}: MovesCaptureWorkspaceProps) {
  const [compactDock, setCompactDock] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setCompactDock(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const thread = useMemo(() => {
    const messages = avaThreadToDockMessages(avaThread);
    return openingBriefing?.trim()
      ? [
          { id: "step-briefing", role: "agent" as const, body: openingBriefing.trim() },
          ...messages,
        ]
      : messages;
  }, [avaThread, openingBriefing]);
  const suggestedActions = useMemo(
    () => avaSuggestedActions(avaQuestions, avaLeadingActions),
    [avaQuestions, avaLeadingActions],
  );

  const composer = avaComposerAvailability(avaStreaming);

  return (
    <AgentDock
      agent={{ initials: "aVa", mark: "ava", name: "aVa", role: avaRole }}
      surface="strategic-moves/phase-capture"
      defaultMode={compactDock ? "collapsed" : "side-rail"}
      disableStoredMode={compactDock}
      collapsedRestoreMode={compactDock ? "expand" : undefined}
      minLeftPx={300}
      defaultLeftPercent={24}
      surfaceContext={{ moveId, phase }}
      initialQuote={`Ask about the current charter step for ${moveName}.`}
      thread={thread}
      suggestedActions={suggestedActions}
      composerDisabledReason={composer.disabledReason}
      isAgentBusy={composer.agentBusy}
      onMessage={(text) => onAvaMessage(text)}
      workspace={
        <>
          {notesFill}
          {tabs}
          {content ?? (captureProps ? <MovesCaptureFlow {...captureProps} /> : null)}
        </>
      }
    />
  );
}

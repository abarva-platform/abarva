"use client";

import { useMemo, type ReactNode } from "react";
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
  onAvaMessage: (text: string) => void;
  /** Workspace tab row rendered above the capture content. */
  tabs?: ReactNode;
  /** The 3-step capture flow props (sections, slots, handlers). */
  captureProps: MovesCaptureFlowProps;
}

export function MovesCaptureWorkspace({
  moveId,
  moveName,
  phase,
  avaRole,
  avaThread,
  avaQuestions,
  avaLeadingActions = [],
  onAvaMessage,
  tabs,
  captureProps,
}: MovesCaptureWorkspaceProps) {
  const thread = useMemo(
    () => avaThreadToDockMessages(avaThread),
    [avaThread],
  );
  const suggestedActions = useMemo(
    () => avaSuggestedActions(avaQuestions, avaLeadingActions),
    [avaQuestions, avaLeadingActions],
  );

  return (
    <AgentDock
      agent={{ initials: "aVa", mark: "ava", name: "aVa", role: avaRole }}
      surface="strategic-moves/phase-capture"
      defaultMode="side-rail"
      minLeftPx={300}
      defaultLeftPercent={24}
      surfaceContext={{ moveId, phase }}
      initialQuote={`Ask about the current charter step for ${moveName}.`}
      thread={thread}
      suggestedActions={suggestedActions}
      onMessage={(text) => onAvaMessage(text)}
      workspace={
        <>
          {tabs}
          <MovesCaptureFlow {...captureProps} />
        </>
      }
    />
  );
}

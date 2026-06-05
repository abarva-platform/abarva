"use client";

import { AgentDock, type AgentDockProps } from "@/components/agent/AgentDock";
import type { SourceEventArtifactState } from "@/lib/source/canvas-substrate";
import { chatWidthForStage } from "@/lib/source/chat-sizing-policy";
import type { SourceStageKey } from "@/lib/source/types";

type SentinelChatProportionalProps = Omit<
  AgentDockProps,
  "defaultLeftPercent" | "defaultMode" | "surface"
> & {
  stage: SourceStageKey;
  artifacts: SourceEventArtifactState[];
  surface: string;
};

export function SentinelChatProportional({
  stage,
  artifacts,
  surface,
  ...dockProps
}: SentinelChatProportionalProps) {
  const policy = chatWidthForStage(stage, artifacts);

  return (
    <AgentDock
      {...dockProps}
      surface={`${surface}/${policy.resetKey}`}
      defaultMode={policy.mode}
      defaultLeftPercent={policy.widthPct}
      collapsedSummary={{
        label: dockProps.agent.name,
        detail: policy.collapsedSummary,
      }}
    />
  );
}

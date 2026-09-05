import { routeAvaModuleHandoff } from "@/lib/agent/module-routing";
import type { AvaModuleHandoff, AvaMovesP0HandoffPayload } from "@/lib/agent/module-routing";
import type { SourcingEventDetail } from "@/lib/source/types";
import { buildSourceAvaChatPacket } from "./module-expert";

type RuntimeSourceEvent = Pick<
  SourcingEventDetail,
  "id" | "code" | "name" | "currentStageKey" | "blocker" | "nextAction"
>;

export interface BuildSourceAvaModuleHandoffRuntimeInput {
  sourceAnalyticsEnabled: boolean;
  movesAvaHardeningEnabled: boolean;
  tenant: string;
  event: RuntimeSourceEvent | null | undefined;
  question: string | null | undefined;
  surface?: string | null;
}

export function shouldEmitSourceAvaModuleHandoff(args: {
  sourceAnalyticsEnabled: boolean;
  movesAvaHardeningEnabled: boolean;
}): boolean {
  return args.sourceAnalyticsEnabled && args.movesAvaHardeningEnabled;
}

export function buildSourceAvaModuleHandoffForRuntime(
  input: BuildSourceAvaModuleHandoffRuntimeInput,
): AvaModuleHandoff<AvaMovesP0HandoffPayload> | null {
  const question = input.question?.trim();
  if (!question) return null;
  if (
    !shouldEmitSourceAvaModuleHandoff({
      sourceAnalyticsEnabled: input.sourceAnalyticsEnabled,
      movesAvaHardeningEnabled: input.movesAvaHardeningEnabled,
    })
  ) {
    return null;
  }
  if (!input.event) return null;

  const packet = buildSourceAvaChatPacket(
    {
      tenant: input.tenant,
      event: {
        code: input.event.code,
        name: input.event.name,
        currentStageKey: input.event.currentStageKey,
        blocker: input.event.blocker,
        nextAction: input.event.nextAction,
      },
      viewStageKey: input.event.currentStageKey,
    },
    question,
  );

  return routeAvaModuleHandoff({
    surface: input.surface ?? `/source/events/${input.event.id}`,
    question,
    sourcePacket: packet,
  });
}

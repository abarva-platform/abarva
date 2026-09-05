import { MOVES_AVA_MODULE_EXPERT_CONTRACT } from "@/lib/programs/ava-chat/module-expert";
import { SOURCE_AVA_MODULE_EXPERT_CONTRACT } from "@/lib/source/ava/module-expert";
import type { SourceAvaChatPacket } from "@/lib/source/ava/module-expert";
import { TOWER_AVA_MODULE_EXPERT_CONTRACT } from "@/lib/tower/ava-chat";
import {
  getSurfaceScope,
  type ProductSurfaceKey,
  type SurfaceScopeEntry,
} from "./product-truth/surface-scope";

export const AVA_MODULE_EXPERT_CONTRACTS = {
  moves: MOVES_AVA_MODULE_EXPERT_CONTRACT,
  source: SOURCE_AVA_MODULE_EXPERT_CONTRACT,
  tower: TOWER_AVA_MODULE_EXPERT_CONTRACT,
} as const;

export type AvaRoutableModuleSurface = keyof typeof AVA_MODULE_EXPERT_CONTRACTS;

export interface AvaExecutableSurfaceScope extends SurfaceScopeEntry {
  surface: ProductSurfaceKey;
}

export interface AvaMovesP0HandoffPayload {
  movePhase: 0;
  movePhaseLabel: "P0 Originate";
  prefill: {
    candidateIdea: string;
    proposedMoveTitle: string;
    originatingSurface: "source";
    suggestedFirstQuestion: string;
  };
  sourceContext: {
    eventCode: string | null;
    eventName: string | null;
    currentStageLabel: string | null;
    blocker: string | null;
    nextAction: string | null;
    gateSummary: string | null;
    citationLabels: string[];
  };
}

export interface AvaModuleHandoff<Payload = Record<string, unknown>> {
  fromSurface: ProductSurfaceKey;
  toSurface: ProductSurfaceKey;
  intent: string;
  reason: string;
  targetRoute: string;
  payload: Payload;
}

export interface RouteAvaModuleHandoffInput {
  surface: string;
  question: string;
  sourcePacket?: SourceAvaChatPacket | null;
}

const SOURCE_ROUTE_PATTERN = /^\/source(?:\/|$)/;
const MOVES_ROUTE_PATTERN = /^\/(?:strategic-moves|moves|programs)(?:\/|$)/;
const TOWER_ROUTE_PATTERN = /^\/tower(?:\/|$)/;
const HOME_ROUTE_PATTERN = /^\/(?:home)?$/;
const INTELLIGENCE_ROUTE_PATTERN = /^\/intelligence(?:\/|$)/;
const SETUP_ROUTE_PATTERN = /^\/setup(?:\/|$)/;

const SOURCE_TO_MOVES_P0_PATTERN =
  /\b(opportunity|use case|idea|candidate|automation|initiative|move|take (?:it |this )?forward|what next|next step)\b/i;

export function resolveAvaModuleSurface(
  surfaceOrPath: string,
): ProductSurfaceKey | undefined {
  const normalized = surfaceOrPath.trim().toLowerCase();
  if (getSurfaceScope(normalized)) {
    return normalized as ProductSurfaceKey;
  }
  if (SOURCE_ROUTE_PATTERN.test(normalized)) return "source";
  if (MOVES_ROUTE_PATTERN.test(normalized)) return "moves";
  if (TOWER_ROUTE_PATTERN.test(normalized)) return "tower";
  if (HOME_ROUTE_PATTERN.test(normalized)) return "home";
  if (INTELLIGENCE_ROUTE_PATTERN.test(normalized)) return "intelligence";
  if (SETUP_ROUTE_PATTERN.test(normalized)) return "setup";
  return undefined;
}

export function getExecutableSurfaceScope(
  surfaceOrPath: string,
): AvaExecutableSurfaceScope | undefined {
  const surface = resolveAvaModuleSurface(surfaceOrPath);
  return surface ? getSurfaceScope(surface) : undefined;
}

export function canAvaModuleHandoff(
  fromSurface: ProductSurfaceKey,
  toSurface: ProductSurfaceKey,
): boolean {
  return getSurfaceScope(fromSurface)?.handoffTargets.includes(toSurface) ?? false;
}

export function getAvaModuleExpertContract(surface: AvaRoutableModuleSurface) {
  return AVA_MODULE_EXPERT_CONTRACTS[surface];
}

export function routeAvaModuleHandoff(
  input: RouteAvaModuleHandoffInput,
): AvaModuleHandoff<AvaMovesP0HandoffPayload> | null {
  const fromSurface = resolveAvaModuleSurface(input.surface);
  if (!fromSurface) return null;

  if (
    fromSurface === "source" &&
    canAvaModuleHandoff("source", "moves") &&
    SOURCE_TO_MOVES_P0_PATTERN.test(input.question)
  ) {
    return buildSourceToMovesP0Handoff(input);
  }

  return null;
}

function buildSourceToMovesP0Handoff(
  input: RouteAvaModuleHandoffInput,
): AvaModuleHandoff<AvaMovesP0HandoffPayload> {
  const candidateIdea = extractCandidateIdea(input.question, input.sourcePacket);
  const sourceContext = buildSourceContext(input.sourcePacket);
  const evidenceSummary = [
    sourceContext.currentStageLabel ? `Source stage: ${sourceContext.currentStageLabel}` : null,
    sourceContext.blocker ? `Blocker: ${sourceContext.blocker}` : null,
    sourceContext.nextAction ? `Next action: ${sourceContext.nextAction}` : null,
  ].filter((item): item is string => Boolean(item));

  return {
    fromSurface: "source",
    toSurface: "moves",
    intent: "source_opportunity_to_moves_p0",
    reason:
      "The user is turning Source event context into a governed Move candidate, which starts in Moves P0.",
    targetRoute: "/strategic-moves/new",
    payload: {
      movePhase: 0,
      movePhaseLabel: "P0 Originate",
      prefill: {
        candidateIdea,
        proposedMoveTitle: titleCaseCandidate(candidateIdea),
        originatingSurface: "source",
        suggestedFirstQuestion: evidenceSummary.length
          ? `Use this Source context to originate the Move: ${evidenceSummary.join("; ")}.`
          : "Use the Source discussion context to originate the Move.",
      },
      sourceContext,
    },
  };
}

function buildSourceContext(
  packet: SourceAvaChatPacket | null | undefined,
): AvaMovesP0HandoffPayload["sourceContext"] {
  if (!packet) {
    return {
      eventCode: null,
      eventName: null,
      currentStageLabel: null,
      blocker: null,
      nextAction: null,
      gateSummary: null,
      citationLabels: [],
    };
  }

  return {
    eventCode: packet.event.code,
    eventName: packet.event.name,
    currentStageLabel: packet.viewedStageLabel ?? packet.currentStageLabel,
    blocker: packet.event.blocker?.trim() || null,
    nextAction: packet.event.nextAction?.trim() || null,
    gateSummary: packet.stageGate
      ? `${packet.stageGate.taskChecklistDone} of ${packet.stageGate.taskChecklistTotal} tasks complete; evidence box ${packet.stageGate.evidenceBox.toUpperCase()}`
      : null,
    citationLabels: packet.citations.map((citation) => `[${citation.id}]`),
  };
}

function extractCandidateIdea(
  question: string,
  packet: SourceAvaChatPacket | null | undefined,
): string {
  const cleanedQuestion = question.trim().replace(/\s+/g, " ");
  const explicitOpportunity = cleanedQuestion.match(
    /\b(?:found|identified|saw|have)\s+(?:a|an|the)?\s*([^?.!,]*\bopportunity\b)/i,
  )?.[1];
  const explicitIdea =
    explicitOpportunity ??
    cleanedQuestion.match(
      /\b(?:found|identified|saw|have)\s+(?:a|an|the)?\s*([^?.!,]+?(?:use case|automation|initiative))/i,
    )?.[1];
  const fallback = packet?.event.name || "Source opportunity";
  return sentenceCase((explicitIdea || fallback).trim());
}

function titleCaseCandidate(value: string): string {
  return value
    .split(/\s+/)
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(" ");
}

function sentenceCase(value: string): string {
  if (!value) return value;
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

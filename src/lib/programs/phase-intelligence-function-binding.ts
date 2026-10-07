// Which curated Function Pack — if any — the Phase Intelligence panel may speak
// for on behalf of a Move.
//
// Archetype ids and Function Pack keys are two DISJOINT id spaces. A Move that
// declares `governed_data_foundation` declares a kind of WORK; it does not
// thereby name a curated industry/function pack, and no pack exists for it. The
// panel's legacy fallback nonetheless scored the Move's text blob against every
// healthcare pack and bound the best scorer, so a declared Move was given a
// value benchmark and a pain theme belonging to a different kind of work
// entirely — a wrong answer that renders perfectly.
//
// Identity is declared, never inferred (AGENTS.md): when a Move declares an
// archetype the registry recognises, this module refuses the keyword guess and
// says what the Move actually declared. Moves that declare nothing recognisable
// — every Move carrying only the coarse `engagements.program_archetype` column,
// whose five storable values name no registry archetype — reach the classifier
// exactly as before.

import { archetypeForDeclaredId } from "@/lib/programs/archetypes/registry";
import { resolveDeclaredProgramArchetypeId } from "@/lib/programs/discovery/evidence-readiness";
import {
  classifyFunctionKey,
  industryKeyForCode,
  resolveMoveFunctionIdentity,
} from "@/lib/programs/function-identity";
import type { MoveFunctionIdentity } from "@/lib/programs/function-identity";

/** The fields of a Move this decision reads. */
export interface PhaseIntelligenceBindingInput {
  name?: string | null;
  displayCode?: string | null;
  archetype?: string | null;
  phaseLabel?: string | null;
  functionPackKey?: string | null;
  charter?: unknown;
  tenant: { name?: string | null; industryCode?: string | null };
  status?: { text?: string | null; description?: string | null };
}

export type PhaseIntelligenceFunctionBinding =
  /** A curated pack is bound: either a persisted key or a classified guess. */
  | {
      kind: "bound";
      identity: MoveFunctionIdentity;
      source: string;
      confidence: number | null;
    }
  /**
   * The Move declares a registry archetype. No Function Pack may be guessed for
   * it, and the declaration is what the panel reports instead.
   */
  | {
      kind: "declared_archetype";
      archetypeId: string;
      archetypeName: string;
    }
  /** Nothing declared and nothing classifiable. */
  | { kind: "unbound" };

function safeCharterText(charter: unknown): string {
  if (!charter || typeof charter !== "object") return "";
  try {
    return JSON.stringify(charter);
  } catch {
    return "";
  }
}

export function buildMoveFunctionBriefText(
  move: PhaseIntelligenceBindingInput,
): string {
  return [
    move.displayCode,
    move.name,
    move.archetype,
    move.phaseLabel,
    move.status?.text,
    move.status?.description,
    move.tenant.name,
    move.tenant.industryCode,
    safeCharterText(move.charter),
  ]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ");
}

function resolveKnownLegacyFunctionAlias(
  industryKey: MoveFunctionIdentity["industryKey"],
  briefText: string,
): { functionKey: string; confidence: number } | null {
  const normalized = briefText.toLowerCase();
  if (industryKey !== "healthcare-provider") return null;

  const namesAgentAssist =
    /\b(agent|member|contact|call|service)\b/.test(normalized) &&
    /\b(ai|assist|assistant|augmentation|copilot)\b/.test(normalized);
  const namesMemberService =
    /\b(member|contact|call)\b/.test(normalized) &&
    /\b(service|center|centre|experience)\b/.test(normalized);
  if (namesAgentAssist || namesMemberService) {
    return { functionKey: "member_service_agent_assist", confidence: 0.95 };
  }

  return null;
}

/**
 * A Move's DECLARED archetype, only when the registry recognises it. The coarse
 * `program.archetype` column is deliberately not enough on its own: none of its
 * five storable values names a registry archetype, so a legacy Move is not
 * treated as having declared anything and still reaches the classifier.
 */
export function declaredArchetypeForBinding(
  move: PhaseIntelligenceBindingInput,
): { id: string; name: string } | null {
  const declaredId = resolveDeclaredProgramArchetypeId({
    functionPackKey: move.functionPackKey,
    archetype: move.archetype,
    name: move.name,
    charter: move.charter,
  });
  const archetype = archetypeForDeclaredId(declaredId);
  if (!archetype) return null;
  return { id: archetype.id, name: archetype.name };
}

export function resolvePhaseIntelligenceFunctionBinding(
  move: PhaseIntelligenceBindingInput,
): PhaseIntelligenceFunctionBinding {
  // A persisted functionPackKey IS a declaration, in the Function Pack id
  // space, so it outranks everything below it.
  const storedIdentity = resolveMoveFunctionIdentity({
    industryCode: move.tenant.industryCode ?? null,
    functionPackKey: move.functionPackKey,
    charter: move.charter,
  });
  if (storedIdentity) {
    return {
      kind: "bound",
      identity: storedIdentity,
      source: "persisted functionPackKey",
      confidence: null,
    };
  }

  const declared = declaredArchetypeForBinding(move);
  if (declared) {
    return {
      kind: "declared_archetype",
      archetypeId: declared.id,
      archetypeName: declared.name,
    };
  }

  const industryKey = industryKeyForCode(move.tenant.industryCode ?? null);
  if (!industryKey) return { kind: "unbound" };

  const briefText = buildMoveFunctionBriefText(move);
  const classified =
    classifyFunctionKey(industryKey, briefText) ??
    resolveKnownLegacyFunctionAlias(industryKey, briefText);
  if (!classified) return { kind: "unbound" };

  return {
    kind: "bound",
    identity: { industryKey, functionKey: classified.functionKey },
    source: "deterministic classifier fallback",
    confidence: classified.confidence,
  };
}

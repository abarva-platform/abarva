// Moves aVa chat hardening — declared-archetype framing for the system prompt.
//
// The grounding block injected into Claude on a Moves phase workspace names the
// Move's title, phase, live gate tally, evidence needs and caveats — but never
// what KIND of Move it is. Every archetype in the registry already declares
// `agentGuidance.systemFraming` (the subject domain to reason over, and the
// domains it must NOT demand evidence from) and the `keyQuestions` it exists to
// answer. Nothing in the product read `agentGuidance`, so a Move whose archetype
// is DECLARED still reached the model with no subject framing at all.
//
// Identity is declared, never inferred. This resolves ONLY through the Move's
// own declaration channels (`resolveDeclaredProgramArchetypeId` -> the registry
// bridge `archetypeForDeclaredId`). A Move with no declaration, or one whose
// declared id names no registry archetype, gets NO framing, and that absence is
// the invariant worth protecting rather than a gap to fill: `DEFAULT_ARCHETYPE_ID`
// is the AI product-development lifecycle, whose framing tells the model to
// reason over engineering delivery, SDLC and tooling evidence. Injecting that
// into an undeclared Move is strictly worse than saying nothing, so there is
// deliberately no fallback here.
//
// Note on channels: `engagements.program_archetype` is an `ArchetypeKey` — one
// of five coarse values, none of which is a registry archetype id — so it can
// never resolve a framing on its own. It is still passed through, because the
// resolver's precedence is declared-first and a widened column should start
// working without a change here, not because it carries a declaration today.
//
// This module is text resolution only. The framing never reaches a gate tally,
// an allowed/disallowed action, `missingInputs`, `caveats`, or any deterministic
// answer path — see the invariant cases in
// `src/lib/programs/__tests__/moves-ava-archetype-framing.test.ts`.

import { archetypeForDeclaredId } from "@/lib/programs/archetypes/registry";
import { resolveDeclaredProgramArchetypeId } from "@/lib/programs/discovery/evidence-readiness";
import type { MovesAvaArchetypeFraming } from "./types";

/** The declaration channels this resolver reads. Mirrors the subset of
 *  `resolveDeclaredProgramArchetypeId`'s input that carries an identity. */
export interface MovesAvaArchetypeFramingProgramInput {
  functionPackKey?: string | null;
  archetype?: string | null;
  charter?: unknown;
}

/**
 * The DECLARED archetype's agent framing for a Move, or `null` when the Move
 * declares nothing the registry knows. Never falls back to a default archetype.
 */
export function resolveMovesAvaArchetypeFraming(
  program: MovesAvaArchetypeFramingProgramInput | null | undefined,
): MovesAvaArchetypeFraming | null {
  if (!program) return null;
  const declaredId = resolveDeclaredProgramArchetypeId(program);
  const archetype = archetypeForDeclaredId(declaredId);
  if (!archetype) return null;
  const { systemFraming, keyQuestions } = archetype.agentGuidance;
  return {
    archetypeId: archetype.id,
    archetypeName: archetype.name,
    systemFraming,
    keyQuestions: [...keyQuestions],
  };
}

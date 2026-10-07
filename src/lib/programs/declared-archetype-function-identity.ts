// =============================================================================
// Declared archetype -> may a business-function pack be GUESSED from prose?
// -----------------------------------------------------------------------------
// At P0, `deriveFunctionPackIdentity` (origination-submit.ts) scores the Move's
// brief text against every Domain Function Pack for its industry and persists
// the winner into the first-class `engagements.function_pack_key` /
// `function_pack_confidence` columns (dual-written into `charter`). Eight
// readers then treat that key as the Move's business-function identity --
// `move-business-case`, `move-solution-architecture-model`, `audit-pack-model`,
// `surface-grounding`, `board-artifacts-registry`, `move-function-binding`,
// `phase-intelligence-summary` -- so a wrong key at P0 grounds P3's
// architecture and P4's business case in the wrong curated depth.
//
// The guess is a reasonable default when nobody has said what the Move is. It
// is NOT reasonable when a human DECLARED an archetype whose work deliberately
// spans every business function: there is no one function to guess, and the
// prose that describes governance work scores against whichever pack happens to
// share its vocabulary.
//
// Measured on `origin/main` with the brief text origination actually builds
// (programName + problemStatement + targetOutcome + classification), for a Move
// declaring `governed_data_foundation`:
//
//   healthcare-provider  realistic GDF brief        -> member_service_agent_assist @ 0.257
//   financial-services   privacy-forward GDF brief  -> risk_management            @ 0.188
//   retail               declaration-only brief     -> workforce_labor            @ 0.25
//
// `FUNCTION_CLASSIFY_CONFIDENCE_FLOOR` is 0.18, so none of these is a
// near-noise match the floor could catch -- 0.257 is a confident wrong answer.
// A contact-centre pack would have grounded a data-governance Move.
//
// Why a declared set and not a heuristic: the five declarable archetypes are
// `ai_operations_customer_digital`, `financial_services_commercial_lending_agent_assist`,
// `general_default`, `governed_data_foundation`, `healthcare_contact_center_agent_assist`.
// Two of those ARE agent-assist archetypes, and for them a
// `member_service_agent_assist` / `customer_servicing_contact_center` bind is
// plausibly RIGHT -- suppressing on "the Move declared something" would lose a
// legitimate pack. None of the five ids is itself a function-pack key (zero
// overlap with the 39 keys), so there is no mapping to consult either. The only
// honest discriminator available today is the archetype stating it for itself.
//
// Default is TODAY'S behaviour. An id absent from the set below -- including
// every undeclared legacy Move, for which the caller passes `null` -- still
// guesses, byte for byte. Only an archetype listed here declines.
// =============================================================================

/**
 * Declared archetypes whose work spans every business function, so no single
 * Domain Function Pack can describe them and none may be guessed from prose.
 *
 * `governed_data_foundation` is the one such archetype today, and it is one by
 * construction: its own module header records that it exists because a
 * data-governance Move was being graded against AI-PDLC's engineering
 * instruments. Its twelve evidence families are governance, platform, privacy
 * and control records that belong to no single function -- a certified semantic
 * layer serves claims, care management and finance alike.
 */
export const FUNCTION_SPANNING_DECLARED_ARCHETYPE_IDS: ReadonlySet<string> =
  new Set(["governed_data_foundation"]);

/**
 * May origination guess a Domain Function Pack from brief prose for this Move?
 *
 * `true` for an undeclared Move (the legacy path, unchanged) and for a declared
 * archetype that has one business function. `false` only for a declared
 * archetype that spans functions, where the honest answer is no key at all --
 * every reader renders a `null` identity as an explicit unbound result with a
 * named reason, never as curated depth it does not have.
 */
export function mayGuessFunctionPackForDeclaredArchetype(
  declaredArchetypeId: string | null | undefined,
): boolean {
  if (!declaredArchetypeId) return true;
  return !FUNCTION_SPANNING_DECLARED_ARCHETYPE_IDS.has(
    declaredArchetypeId.trim(),
  );
}

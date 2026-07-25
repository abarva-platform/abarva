// PR3 — blocking governance-contradiction validator.
//
// A governed artifact must never assert a governance fact that contradicts the
// authoritative server state. The live proof surfaced a roadmap that claimed the
// charter signoff was outstanding and the architecture uncaptured — on a Move
// where both were signed off — plus a self-contradictory "no generation until
// the gate is approved" on an artifact that had just been generated, and a raw
// internal identifier.
//
// This is a PURE validator: it compares the rendered client-facing text against
// the authoritative state and returns violations. Generation BLOCKS on any
// violation (the caller treats a non-empty result as a hard block), so a
// contradictory artifact can never ship. Every rule is unit-tested without the
// data plane.

export interface AuthoritativeGovernanceState {
  phase: number;
  /** Is the charter actually signed off? */
  charterSignedOff: boolean;
  /** Is an authoritative (accepted) architecture actually present? */
  architectureAccepted: boolean;
  /** Is the artifact final (exit gate approved)? */
  isFinal: boolean;
  /** Is the artifact a pre-exit review draft? */
  isReviewDraft: boolean;
}

export interface GovernanceViolation {
  code:
    | "stale_charter_signoff_claim"
    | "stale_architecture_claim"
    | "false_finality_claim"
    | "prohibited_generation_contradiction"
    | "internal_identifier_leak";
  detail: string;
}

const UUID_AFTER_ACTOR_LABEL =
  /\b(approv(?:er|ed)(?:\s+by)?|actor|user|reviewer|owner|assigned to|approver id)\b[^<>a-z0-9]{0,12}[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

/** Strip tags/scripts/styles to inspect only the visible client-facing text. */
function visibleText(htmlOrText: string): string {
  return htmlOrText
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Return every governance contradiction between the rendered artifact and the
 * authoritative state. Empty array = consistent (generation may proceed).
 */
export function validateGovernanceConsistency(
  htmlOrText: string,
  state: AuthoritativeGovernanceState,
): GovernanceViolation[] {
  const text = visibleText(htmlOrText);
  const violations: GovernanceViolation[] = [];

  if (
    state.charterSignedOff &&
    /\bcharter signoff (is )?still required\b|\bcharter (is )?not (yet )?signed off\b|\bcharter signoff (is )?outstanding\b/i.test(
      text,
    )
  ) {
    violations.push({
      code: "stale_charter_signoff_claim",
      detail:
        "Artifact claims the charter signoff is outstanding, but the charter is signed off.",
    });
  }

  if (
    state.architectureAccepted &&
    /\barchitecture is not (yet )?(captured|approved)\b|\barchitecture (is )?not (captured|approved)\b|\bno (approved|accepted) architecture\b/i.test(
      text,
    )
  ) {
    violations.push({
      code: "stale_architecture_claim",
      detail:
        "Artifact claims the architecture is not captured or approved, but an accepted architecture is present.",
    });
  }

  if (
    state.isReviewDraft &&
    !state.isFinal &&
    /\bthis (artifact|roadmap|document|deck) is (now )?final\b|\bboard[- ]approved\b|\bfinal(?:ized|ised)? and (?:sponsor[- ])?approved\b|\bapproved as final\b/i.test(
      text,
    )
  ) {
    violations.push({
      code: "false_finality_claim",
      detail:
        "Artifact asserts it is final/board-approved, but it is a pre-exit review draft.",
    });
  }

  if (
    /\bno generation until the (?:gate|phase \d+ gate) is approved\b/i.test(
      text,
    )
  ) {
    violations.push({
      code: "prohibited_generation_contradiction",
      detail:
        "Artifact says generation is not allowed until the gate is approved, yet the artifact was generated.",
    });
  }

  if (UUID_AFTER_ACTOR_LABEL.test(text)) {
    violations.push({
      code: "internal_identifier_leak",
      detail:
        "Artifact contains a raw internal actor identifier (UUID) in client-facing text.",
    });
  }

  return violations;
}

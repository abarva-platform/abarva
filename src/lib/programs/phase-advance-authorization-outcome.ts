/**
 * Why a phase-advance request was refused by the program allowlist, in a
 * sentence a workspace user can act on.
 *
 * `POST /api/v1/programs/:programId/advance` is the only product path that
 * advances a Move through its phases, and the first thing it does is fence the
 * request against the caller's `programIdsAllowed`. That fence is reachable
 * three ways — an account with no program grants at all, an account whose
 * membership is explicitly program-scoped, and a participant-scoped account
 * whose grants simply do not include the requested id — and only an
 * administrator or a client-wide member bypasses it with a `null` allowlist.
 *
 * Both product controls that call the route render `detail` and otherwise fall
 * through to a generic retry sentence, so a bare `{ error: "forbidden" }` told
 * the user to try again for a condition that no retry can change. Its sibling
 * guard a few lines later (`canApproveGates`) already carried a sentence; this
 * closes the asymmetry.
 *
 * The refusal deliberately carries NO existence information. For a restricted
 * allowlist the fence answers before the Move row is ever read, so a
 * nonexistent id, a foreign-tenant id and an unauthorized own-tenant id all
 * reach it. The sentence therefore describes the caller's own grants and never
 * the requested record, and never echoes the requested id.
 *
 * No DB access and no `server-only` import, so a suite can exercise it
 * directly.
 */

/** The refusal body the advance route returns, minus the HTTP status. */
export type PhaseAdvanceAllowlistRefusal = {
  /**
   * Unchanged from the bare refusal this replaced. Callers that branch on the
   * error code keep working, and the cross-tenant 404 contract is untouched
   * because this fence only ever answers 403.
   */
  error: "forbidden";
  detail: string;
};

export type PhaseAdvanceAllowlistInput = {
  /** The Move id the caller asked to advance. */
  programId: string;
  /**
   * The caller's allowed program ids. `null` means client-wide access, which
   * this fence does not restrict.
   */
  programIdsAllowed: readonly string[] | null;
};

/**
 * `null` when the allowlist permits the request; otherwise the refusal body.
 *
 * The decision itself is identical to the predicate the route hand-rolled
 * (`allowlist === null || allowlist.includes(programId)`); only the refusal
 * gained prose.
 */
export function resolvePhaseAdvanceAllowlistRefusal(
  input: PhaseAdvanceAllowlistInput,
): PhaseAdvanceAllowlistRefusal | null {
  const { programId, programIdsAllowed } = input;

  if (programIdsAllowed === null) return null;
  if (programIdsAllowed.includes(programId)) return null;

  const granted = programIdsAllowed.length;

  if (granted === 0) {
    return {
      error: "forbidden",
      detail:
        "Your account is not authorized to work in any Move in this workspace, " +
        "so it cannot approve a phase gate. Ask a workspace administrator to " +
        "grant you access to this Move.",
    };
  }

  return {
    error: "forbidden",
    detail:
      `Your account is authorized to work in ${granted} ` +
      `Move${granted === 1 ? "" : "s"} in this workspace, and the Move you ` +
      "asked to advance is not one of them. Ask a workspace administrator to " +
      "add it to your access, or advance a Move from your own list.",
  };
}

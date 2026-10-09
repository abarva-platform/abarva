/**
 * The phase-advance allowlist refusal.
 *
 * `POST /api/v1/programs/:programId/advance` fenced the request against the
 * caller's `programIdsAllowed` and refused with a bare `{ error: "forbidden" }`.
 * Both product controls that call the route render `detail` and otherwise show
 * a generic retry sentence, so the one condition no retry can change was the
 * one the user could not read. Every pre-existing case in the route's own suite
 * set `programIdsAllowed: null`, so the fence had no coverage at all.
 *
 * These cases pin the decision (unchanged), the prose (new) and the property
 * that matters for tenancy: the refusal reveals nothing about whether the
 * requested Move exists.
 */
import {
  resolvePhaseAdvanceAllowlistRefusal,
  type PhaseAdvanceAllowlistInput,
} from "../phase-advance-authorization-outcome";

const MOVE = "prog-1";

describe("resolvePhaseAdvanceAllowlistRefusal", () => {
  describe("the decision it inherited from the hand-rolled predicate", () => {
    it("permits a client-wide caller, whose allowlist is null", () => {
      expect(
        resolvePhaseAdvanceAllowlistRefusal({
          programId: MOVE,
          programIdsAllowed: null,
        }),
      ).toBeNull();
    });

    it("permits a restricted caller whose grants include the Move", () => {
      expect(
        resolvePhaseAdvanceAllowlistRefusal({
          programId: MOVE,
          programIdsAllowed: ["prog-0", MOVE, "prog-2"],
        }),
      ).toBeNull();
    });

    it("permits a restricted caller granted exactly the Move", () => {
      expect(
        resolvePhaseAdvanceAllowlistRefusal({
          programId: MOVE,
          programIdsAllowed: [MOVE],
        }),
      ).toBeNull();
    });

    it("refuses a caller with no program grants at all", () => {
      expect(
        resolvePhaseAdvanceAllowlistRefusal({
          programId: MOVE,
          programIdsAllowed: [],
        }),
      ).not.toBeNull();
    });

    it("refuses a restricted caller whose grants omit the Move", () => {
      expect(
        resolvePhaseAdvanceAllowlistRefusal({
          programId: MOVE,
          programIdsAllowed: ["prog-7", "prog-8"],
        }),
      ).not.toBeNull();
    });

    it("agrees with the predicate it replaced across every shape of allowlist", () => {
      const cases: readonly PhaseAdvanceAllowlistInput[] = [
        { programId: MOVE, programIdsAllowed: null },
        { programId: MOVE, programIdsAllowed: [] },
        { programId: MOVE, programIdsAllowed: [MOVE] },
        { programId: MOVE, programIdsAllowed: ["other"] },
        { programId: MOVE, programIdsAllowed: ["other", MOVE] },
        { programId: MOVE, programIdsAllowed: [MOVE, MOVE] },
        { programId: "", programIdsAllowed: [""] },
        { programId: "", programIdsAllowed: [MOVE] },
      ];

      for (const input of cases) {
        const permittedByPredicate =
          input.programIdsAllowed === null ||
          input.programIdsAllowed.includes(input.programId);
        expect(
          resolvePhaseAdvanceAllowlistRefusal(input) === null,
        ).toBe(permittedByPredicate);
      }
    });
  });

  describe("the sentence the user reads", () => {
    it("keeps the error code the bare refusal used", () => {
      const refusal = resolvePhaseAdvanceAllowlistRefusal({
        programId: MOVE,
        programIdsAllowed: [],
      });
      expect(refusal?.error).toBe("forbidden");
    });

    it("tells a caller with no grants that the account has none, and who to ask", () => {
      const refusal = resolvePhaseAdvanceAllowlistRefusal({
        programId: MOVE,
        programIdsAllowed: [],
      });
      expect(refusal?.detail).toContain("not authorized to work in any Move");
      expect(refusal?.detail).toContain("workspace administrator");
    });

    it("tells a restricted caller how many Moves the account may work in", () => {
      const refusal = resolvePhaseAdvanceAllowlistRefusal({
        programId: MOVE,
        programIdsAllowed: ["prog-7", "prog-8", "prog-9"],
      });
      expect(refusal?.detail).toContain("authorized to work in 3 Moves");
      expect(refusal?.detail).toContain("is not one of them");
    });

    it("says Move, not Moves, when the account has exactly one grant", () => {
      const refusal = resolvePhaseAdvanceAllowlistRefusal({
        programId: MOVE,
        programIdsAllowed: ["prog-7"],
      });
      expect(refusal?.detail).toContain("authorized to work in 1 Move ");
      expect(refusal?.detail).not.toContain("1 Moves");
    });

    it("never tells the user to retry, because no retry can clear this fence", () => {
      for (const programIdsAllowed of [[], ["prog-7"], ["prog-7", "prog-8"]]) {
        const refusal = resolvePhaseAdvanceAllowlistRefusal({
          programId: MOVE,
          programIdsAllowed,
        });
        expect(refusal?.detail.toLowerCase()).not.toContain("try again");
        expect(refusal?.detail.toLowerCase()).not.toContain("retry");
      }
    });

    it("names a remedy in every refusal it can produce", () => {
      for (const programIdsAllowed of [[], ["prog-7"], ["prog-7", "prog-8"]]) {
        const refusal = resolvePhaseAdvanceAllowlistRefusal({
          programId: MOVE,
          programIdsAllowed,
        });
        expect(refusal?.detail).toContain("administrator");
      }
    });
  });

  describe("it reveals nothing about the requested Move", () => {
    it("answers a nonexistent id and a foreign-tenant id identically", () => {
      // The fence answers before the Move row is read, so for a restricted
      // caller these two requests are indistinguishable by construction. The
      // refusal must not become the thing that distinguishes them.
      const grants = ["prog-7", "prog-8"];
      const nonexistent = resolvePhaseAdvanceAllowlistRefusal({
        programId: "no-such-move",
        programIdsAllowed: grants,
      });
      const foreignTenant = resolvePhaseAdvanceAllowlistRefusal({
        programId: "prog-of-another-client",
        programIdsAllowed: grants,
      });
      expect(nonexistent).toEqual(foreignTenant);
    });

    it("does not echo the requested id back to the caller", () => {
      const refusal = resolvePhaseAdvanceAllowlistRefusal({
        programId: "prog-of-another-client",
        programIdsAllowed: ["prog-7"],
      });
      expect(refusal?.detail).not.toContain("prog-of-another-client");
    });

    it("does not name any id the account is granted", () => {
      const refusal = resolvePhaseAdvanceAllowlistRefusal({
        programId: MOVE,
        programIdsAllowed: ["prog-7", "prog-8"],
      });
      expect(refusal?.detail).not.toContain("prog-7");
      expect(refusal?.detail).not.toContain("prog-8");
    });

    it("counts a repeated grant once in neither direction — the count is the list length", () => {
      // Guards against someone "improving" the count into a Set size and
      // thereby leaking that the allowlist held duplicates.
      const refusal = resolvePhaseAdvanceAllowlistRefusal({
        programId: MOVE,
        programIdsAllowed: ["prog-7", "prog-7"],
      });
      expect(refusal?.detail).toContain("authorized to work in 2 Moves");
    });
  });
});

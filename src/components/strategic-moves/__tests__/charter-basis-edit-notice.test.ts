/**
 * The decision behind what the per-field charter basis control says about the
 * answer it is recorded against.
 *
 * It lives in this directory, beside the Moves component suites, because
 * `src/components/strategic-moves/__tests__` is named by exact path in a
 * REQUIRED status check, and `src/lib/programs/__tests__` is swept by no job —
 * a case written there would record coverage and block nothing.
 *
 * Every branch is pinned with the other conditions SATISFIED, so removing any
 * one guard turns a case red. A fixture that falsifies two conditions at once
 * would stay green with either half of the guard deleted.
 */
import {
  charterAnswerEditedSinceBasis,
  charterBasisEditNotice,
} from "@/lib/programs/charter-basis-edit-notice";
import type { P1CharterBasisInput } from "@/lib/programs/p1-charter-evidence";

const CHARTER_KEYS = new Set(["sponsor_commitment", "scope_boundary"]);
const ASSERTION: P1CharterBasisInput = { kind: "workspace_assertion" };
const EVIDENCE: P1CharterBasisInput = {
  kind: "approved_evidence",
  evidenceId: "ev-1",
};
const ASSUMPTION: P1CharterBasisInput = {
  kind: "assumption",
  owner: "Workspace user",
  p2ValidationPlan: "Confirm against the operating report in Discover",
};

/** Every condition satisfied: a basis recorded, and the answer still matches. */
function args(overrides: Partial<Parameters<typeof charterBasisEditNotice>[0]> = {}) {
  return {
    sectionKey: "sponsor_commitment",
    basisSurfaceActive: true,
    charterBasisSectionKeys: CHARTER_KEYS,
    recordedBasis: ASSERTION as P1CharterBasisInput | null,
    persistedAnswer: "The COO sponsors this and has committed the budget.",
    visibleAnswer: "The COO sponsors this and has committed the budget.",
    ...overrides,
  };
}

describe("charterBasisEditNotice — when the field says nothing", () => {
  it("says nothing with the basis surface off, though every other condition holds", () => {
    const notice = charterBasisEditNotice(
      args({ basisSurfaceActive: false, visibleAnswer: "rewritten answer" }),
    );
    expect(notice.state).toBe("surface_off");
    expect(notice.message).toBeNull();
    expect(notice.warn).toBe(false);
  });

  it("says nothing for a field that carries no charter basis", () => {
    const notice = charterBasisEditNotice(
      args({ sectionKey: "unrelated_field", visibleAnswer: "rewritten answer" }),
    );
    expect(notice.state).toBe("not_a_charter_field");
    expect(notice.message).toBeNull();
  });

  it("says nothing when no basis is recorded, even with the answer edited", () => {
    const notice = charterBasisEditNotice(
      args({ recordedBasis: null, visibleAnswer: "rewritten answer" }),
    );
    expect(notice.state).toBe("no_basis_recorded");
    expect(notice.message).toBeNull();
  });
});

describe("charterBasisEditNotice — the standing explanation", () => {
  it("explains that the basis is tied to the answer as saved", () => {
    const notice = charterBasisEditNotice(args());
    expect(notice.state).toBe("basis_matches_answer");
    expect(notice.warn).toBe(false);
    // The point of the sentence: it must say the basis clears on a change.
    // Asserted on the mechanism, not on prose, so a reword stays green and a
    // sentence that drops the consequence does not.
    expect(notice.message).toMatch(/\bas saved\b/i);
    expect(notice.message).toMatch(/clear/i);
  });

  it("treats trailing whitespace as no change, exactly as the route's diff does", () => {
    const notice = charterBasisEditNotice(
      args({ visibleAnswer: "  The COO sponsors this and has committed the budget.  " }),
    );
    expect(notice.state).toBe("basis_matches_answer");
  });
});

describe("charterBasisEditNotice — the pending clear", () => {
  it("warns once the answer has been edited away from the recorded basis", () => {
    const notice = charterBasisEditNotice(
      args({ visibleAnswer: "The CFO sponsors this; budget is not yet committed." }),
    );
    expect(notice.state).toBe("pending_clear");
    expect(notice.warn).toBe(true);
    // It must name BOTH halves: that saving clears it, and that the person
    // should record it again. A notice that only warns leaves them stuck.
    expect(notice.message).toMatch(/clears the basis/i);
    expect(notice.message).toMatch(/record it again/i);
  });

  it("warns for an answer cleared to empty while a basis stands", () => {
    const notice = charterBasisEditNotice(args({ visibleAnswer: "   " }));
    expect(notice.state).toBe("pending_clear");
  });

  it("warns for a notes-inserted answer, whose basis was recorded before the save", () => {
    // The insert stamps `workspace_assertion` and fills the field without
    // saving it, so the answer is already edited away from what the basis is
    // recorded against — the save that follows clears it. The field has to say
    // so here too, or the insert silently loses its own provenance.
    const notice = charterBasisEditNotice(
      args({
        persistedAnswer: "",
        visibleAnswer: "Inserted from the client's notes.",
      }),
    );
    expect(notice.state).toBe("pending_clear");
    expect(notice.warn).toBe(true);
  });

  it("warns for every basis kind, not only the assertion", () => {
    for (const recordedBasis of [EVIDENCE, ASSUMPTION, ASSERTION]) {
      expect(
        charterBasisEditNotice(args({ recordedBasis, visibleAnswer: "edited" }))
          .state,
      ).toBe("pending_clear");
    }
  });
});

describe("charterAnswerEditedSinceBasis", () => {
  it("compares trimmed, so only a real wording change counts", () => {
    expect(charterAnswerEditedSinceBasis("a", " a ")).toBe(false);
    expect(charterAnswerEditedSinceBasis("a", "a.")).toBe(true);
  });

  it("treats a missing side as empty rather than throwing", () => {
    expect(charterAnswerEditedSinceBasis(undefined, "")).toBe(false);
    expect(charterAnswerEditedSinceBasis(null, "typed")).toBe(true);
    expect(charterAnswerEditedSinceBasis("saved", undefined)).toBe(true);
  });
});

/**
 * What a refused artifact review decision tells the reviewer.
 *
 * The P2 -> P3 review decision is the only thing
 * `hasPriorPhaseDraftApproval` reads to decide whether a P3 deliverable may
 * be generated, and the document cabinet is its only product reader. Both of
 * the cabinet's calls printed the raw refusal straight into the row: the GET
 * read `json.error` alone (so a prose `detail` the route did send was
 * dropped), and the POST fell through to `HTTP <status>`.
 *
 * The content of the fix is that one code means two different things across
 * those calls, because the state consequence differs: a failed POST recorded
 * nothing, while a failed GET left the document untouched and only hid the
 * packet. These cases pin that per-action split, not just the absence of the
 * code.
 */

import {
  describeMoveReviewDecisionRefusal,
  isMoveReviewDecisionRefusalCode,
  MOVE_REVIEW_DECISION_REFUSAL_CODES,
} from "../move-review-decision-refusal";

const CODE_TOKEN = /_|^HTTP/;

describe("the refusal code set", () => {
  it("names every code this reader can reach", () => {
    expect([...MOVE_REVIEW_DECISION_REFUSAL_CODES].sort()).toEqual([
      "forbidden",
      "invalid_decision",
      "no_client",
      "not_found",
      "rationale_required",
      "tenant_lookup_unavailable",
      "unauthenticated",
    ]);
  });

  it("recognises each of its own codes and nothing else", () => {
    for (const code of MOVE_REVIEW_DECISION_REFUSAL_CODES) {
      expect(isMoveReviewDecisionRefusalCode(code)).toBe(true);
    }
    expect(isMoveReviewDecisionRefusalCode("no_pending_review")).toBe(false);
    expect(isMoveReviewDecisionRefusalCode("")).toBe(false);
    expect(isMoveReviewDecisionRefusalCode(undefined)).toBe(false);
    expect(isMoveReviewDecisionRefusalCode(404)).toBe(false);
  });
});

describe("every named code gets a sentence on both calls", () => {
  for (const action of ["load", "record"] as const) {
    for (const code of MOVE_REVIEW_DECISION_REFUSAL_CODES) {
      it(`${action}: ${code} reads as product language`, () => {
        const sentence = describeMoveReviewDecisionRefusal({ action, code });
        expect(sentence).not.toMatch(CODE_TOKEN);
        expect(sentence).not.toContain(code);
        // A next action, not just a diagnosis.
        expect(sentence.length).toBeGreaterThan(40);
        expect(sentence.trimEnd().endsWith(".")).toBe(true);
      });
    }
  }
});

describe("the same code says different things on the two calls", () => {
  it("tells a reviewer whose decision failed that nothing was recorded", () => {
    const recorded = describeMoveReviewDecisionRefusal({
      action: "record",
      code: "not_found",
    });
    expect(recorded).toMatch(/NOT\s+recorded/);
  });

  it("does not claim a failed packet read lost a decision", () => {
    // The GET never writes, so saying a decision was not recorded would be
    // false — and the reviewer's real question is why the controls vanished.
    const loaded = describeMoveReviewDecisionRefusal({
      action: "load",
      code: "not_found",
    });
    expect(loaded).not.toMatch(/NOT\s+recorded/);
    expect(loaded).toMatch(/controls are hidden/);
  });

  it("gives every code a different sentence per call", () => {
    for (const code of MOVE_REVIEW_DECISION_REFUSAL_CODES) {
      const load = describeMoveReviewDecisionRefusal({ action: "load", code });
      const record = describeMoveReviewDecisionRefusal({
        action: "record",
        code,
      });
      expect(load).not.toBe(record);
    }
  });
});

describe("a server-supplied detail", () => {
  it("wins over the module's own sentence", () => {
    // Every `detail` this route emits is authored prose, so preferring it
    // cannot surface a machine value the way the upload route's can.
    expect(
      describeMoveReviewDecisionRefusal({
        action: "record",
        code: "forbidden",
        detail:
          "Only an authorized workspace user can record review decisions.",
      }),
    ).toBe("Only an authorized workspace user can record review decisions.");
  });

  it("is ignored when blank rather than rendering an empty reason", () => {
    expect(
      describeMoveReviewDecisionRefusal({
        action: "record",
        code: "rationale_required",
        detail: "   ",
      }),
    ).toMatch(/rationale/);
  });

  it("is ignored when it is not a string", () => {
    expect(
      describeMoveReviewDecisionRefusal({
        action: "load",
        code: "not_found",
        detail: { message: "nope" },
      }),
    ).toMatch(/controls are hidden/);
  });
});

describe("an unnamed code", () => {
  it("still gets a next action on each call", () => {
    for (const action of ["load", "record"] as const) {
      const sentence = describeMoveReviewDecisionRefusal({
        action,
        code: "some_future_code",
      });
      expect(sentence).not.toContain("some_future_code");
      expect(sentence).toMatch(/[Rr]eload/);
    }
  });

  it("refuses to claim the decision was not recorded", () => {
    // The catch-all also covers a 5xx thrown AFTER the row was written, so
    // "nothing was recorded" would be a guess. Only a reload can tell.
    const sentence = describeMoveReviewDecisionRefusal({
      action: "record",
      code: undefined,
    });
    expect(sentence).not.toMatch(/not recorded/i);
    expect(sentence).toMatch(/whether it was recorded/);
  });

  it("does not claim a full packet read on the load call either", () => {
    expect(describeMoveReviewDecisionRefusal({ action: "load" })).toMatch(
      /could not be read/,
    );
  });
});

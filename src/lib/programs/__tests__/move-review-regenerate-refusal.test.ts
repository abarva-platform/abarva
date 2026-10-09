import {
  MOVE_REVIEW_REGENERATE_RECORDED_STATE,
  MOVE_REVIEW_REGENERATE_REFUSAL_CODES,
  MOVE_REVIEW_REGENERATE_REFUSAL_DETAIL,
  NOTHING_RECORDED_CLAUSE,
  VERSION_RECORDED_CLAUSE,
  isMoveReviewRegenerateRefusalCode,
  moveReviewRegenerateRefusalDetail,
  type MoveReviewRegenerateRefusalCode,
} from "@/lib/programs/move-review-regenerate-refusal";

const codesWithState = (
  state: "nothing" | "landed" | "unknown",
): MoveReviewRegenerateRefusalCode[] =>
  MOVE_REVIEW_REGENERATE_REFUSAL_CODES.filter(
    (code) => MOVE_REVIEW_REGENERATE_RECORDED_STATE[code] === state,
  );

describe("move review-regenerate refusal copy", () => {
  it("names every code the route declares, and names it once", () => {
    expect(MOVE_REVIEW_REGENERATE_REFUSAL_CODES).toEqual([
      "feedback_required",
      "artifact_not_found",
      "source_artifact_not_extractable",
      "editable_companion_failed",
      "internal_error",
    ]);
    expect(new Set(MOVE_REVIEW_REGENERATE_REFUSAL_CODES).size).toBe(
      MOVE_REVIEW_REGENERATE_REFUSAL_CODES.length,
    );
  });

  it("gives every code a sentence, and never returns the bare code", () => {
    for (const code of MOVE_REVIEW_REGENERATE_REFUSAL_CODES) {
      const detail = moveReviewRegenerateRefusalDetail(code);
      expect(detail.trim().length).toBeGreaterThan(30);
      expect(detail).not.toContain(code);
      // A sentence, not a token: ends in a full stop.
      expect(detail.trim().endsWith(".")).toBe(true);
    }
  });

  it("labels each code with what the vault holds, and the labels are not all one value", () => {
    // Non-vacuity: if a future edit collapsed every code to one state, the
    // claim assertions below would all pass over an empty or a single set.
    expect(codesWithState("nothing").length).toBeGreaterThanOrEqual(3);
    expect(codesWithState("landed")).toEqual(["editable_companion_failed"]);
    expect(codesWithState("unknown")).toEqual(["internal_error"]);
    expect(
      Object.keys(MOVE_REVIEW_REGENERATE_RECORDED_STATE).sort(),
    ).toEqual([...MOVE_REVIEW_REGENERATE_REFUSAL_CODES].sort());
  });

  it("states that nothing was recorded for every refusal that precedes both writes", () => {
    for (const code of codesWithState("nothing")) {
      expect(moveReviewRegenerateRefusalDetail(code)).toContain(
        NOTHING_RECORDED_CLAUSE,
      );
    }
  });

  it("states that the version WAS recorded once the first write has landed, and warns against repeating it", () => {
    const detail = moveReviewRegenerateRefusalDetail(
      "editable_companion_failed",
    );
    expect(detail).toContain(VERSION_RECORDED_CLAUSE);
    expect(detail).not.toContain(NOTHING_RECORDED_CLAUSE);
    expect(detail).toMatch(/second version/i);
  });

  it("claims NEITHER state for the catch-all, which can fire on either side of the writes", () => {
    const detail = moveReviewRegenerateRefusalDetail("internal_error");
    expect(detail).not.toContain(NOTHING_RECORDED_CLAUSE);
    expect(detail).not.toContain(VERSION_RECORDED_CLAUSE);
    // It must still give the reviewer somewhere to look.
    expect(detail).toMatch(/may or may not/i);
    expect(detail).toMatch(/document list/i);
  });

  it("recognises its own codes and nothing else", () => {
    for (const code of MOVE_REVIEW_REGENERATE_REFUSAL_CODES) {
      expect(isMoveReviewRegenerateRefusalCode(code)).toBe(true);
    }
    for (const other of [
      "unauthenticated",
      "forbidden",
      "no_client",
      "feedback_requiredx",
      "",
      null,
      undefined,
      7,
    ]) {
      expect(isMoveReviewRegenerateRefusalCode(other)).toBe(false);
    }
  });

  it("keeps the detail map and the code roster in step", () => {
    expect(Object.keys(MOVE_REVIEW_REGENERATE_REFUSAL_DETAIL).sort()).toEqual(
      [...MOVE_REVIEW_REGENERATE_REFUSAL_CODES].sort(),
    );
  });
});

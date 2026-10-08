import {
  MOVE_UNREADABLE_REFUSAL_DETAIL,
  moveUnreadableRefusalBody,
} from "../move-unreadable-refusal";

describe("moveUnreadableRefusalBody", () => {
  it("keeps the refusal code the cross-tenant denial contract pins", () => {
    expect(moveUnreadableRefusalBody().error).toBe("not_found");
    expect(moveUnreadableRefusalBody({ withResubmitSignal: true }).error).toBe(
      "not_found",
    );
  });

  it("carries a sentence, so a reader that falls through to the code has one", () => {
    // The standalone workspace ladder reads `detail` above `error`. Without a
    // sentence here it printed the literal refusal code to a product user.
    expect(moveUnreadableRefusalBody().detail).toBe(
      MOVE_UNREADABLE_REFUSAL_DETAIL,
    );
    expect(MOVE_UNREADABLE_REFUSAL_DETAIL.length).toBeGreaterThan(40);
  });

  it("names the control that can actually clear the refusal", () => {
    // Every one of the three causes is answered by going back to the list, and
    // by nothing the submit control does.
    expect(MOVE_UNREADABLE_REFUSAL_DETAIL).toMatch(
      /Reopen the Moves list to see the Moves you can work on/,
    );
  });

  it("prescribes no retry, because the body it ships in rules one out", () => {
    // The same refusal carries `resubmitCanSatisfy: false` where a reader
    // consumes it. A sentence telling the reader to try the submission again
    // would contradict that in the same breath — the exact defect the
    // resubmission signal exists to prevent.
    for (const pattern of [
      /try again/i,
      /again in a moment/i,
      /retry/i,
      /resubmit/i,
      /submit (it |the gate )?again/i,
    ]) {
      expect(MOVE_UNREADABLE_REFUSAL_DETAIL).not.toMatch(pattern);
    }
  });

  it("offers both innocent explanations without committing to either", () => {
    expect(MOVE_UNREADABLE_REFUSAL_DETAIL).toMatch(/may have been removed/);
    expect(MOVE_UNREADABLE_REFUSAL_DETAIL).toMatch(
      /access may no longer include it/,
    );
  });

  it("tells none of the three causes apart, so it leaks no existence", () => {
    // An absent Move, a Move in another tenant, and a Move outside this
    // caller's grants all reach this body. A reader must not be able to
    // distinguish them, so the sentence may not name any one of them.
    const forbidden = [
      /\bexist(s|ed)?\b/i,
      /\btenant\b/i,
      /\bclient\b/i,
      /\barchived\b/i,
      /\bdeleted\b/i,
      /\bpermission\b/i,
      /\bgrant(s|ed)?\b/i,
      /\bforbidden\b/i,
    ];
    for (const pattern of forbidden) {
      expect(MOVE_UNREADABLE_REFUSAL_DETAIL).not.toMatch(pattern);
    }
  });

  it("returns the same body whatever the cause, because it takes no cause", () => {
    // The builder has no parameter a caller could use to vary the sentence by
    // cause — the only option it takes is about the reader, not the cause.
    expect(moveUnreadableRefusalBody()).toEqual(moveUnreadableRefusalBody());
    expect(moveUnreadableRefusalBody.length).toBeLessThanOrEqual(1);
  });

  it("omits the resubmission signal by default, so no route emits a field nothing reads", () => {
    const body = moveUnreadableRefusalBody();
    expect(body).toEqual({
      error: "not_found",
      detail: MOVE_UNREADABLE_REFUSAL_DETAIL,
    });
    expect("resubmitCanSatisfy" in body).toBe(false);
  });

  it("rules a re-submission out where a reader consumes the signal", () => {
    const body = moveUnreadableRefusalBody({ withResubmitSignal: true });
    expect(body).toEqual({
      error: "not_found",
      detail: MOVE_UNREADABLE_REFUSAL_DETAIL,
      resubmitCanSatisfy: false,
    });
    // Explicit `false` is what the reader keys on; `undefined` or a missing
    // field is read as "a re-submission may still help".
    expect(body.resubmitCanSatisfy).toBe(false);
  });

  it("treats an absent option object the same as an empty one", () => {
    expect(moveUnreadableRefusalBody()).toEqual(moveUnreadableRefusalBody({}));
    expect(moveUnreadableRefusalBody({ withResubmitSignal: false })).toEqual(
      moveUnreadableRefusalBody(),
    );
  });
});

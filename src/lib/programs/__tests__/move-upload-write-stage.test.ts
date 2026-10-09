// Moves · evidence upload · a refusal after a write names what landed.
//
// The defect these cases guard: the upload route's catch was
// `return tenancyErrorResponse(err)`, whose last statement is `throw err`. Any
// non-tenancy failure was therefore thrown a SECOND time from inside the catch,
// the handler rejected, and the framework answered with no body. All three live
// readers do `await res.json().catch(() => ({}))`, so `error` arrived
// `undefined` for every one of the route's three catch exits and
// `describeMoveUploadRefusal` answered all three with its unnamed default —
// which opens "was not uploaded".
//
// That default is right for one exit, defensible for a second, and FALSE for
// the third: a response that fails to serialise after `saveMoveArtifact` has
// returned describes a COMPLETED upload, and telling that reviewer to upload
// again files a second copy of a file that is already in the cabinet.

import {
  classifyMoveUploadWriteFailure,
  MOVE_UPLOAD_WRITE_STAGE_CODES,
  type MoveUploadWriteStage,
} from "@/lib/programs/move-upload-write-stage";
import {
  describeMoveUploadRefusal,
  DETAIL_IS_REVIEWER_PROSE,
  isMoveUploadRefusalCode,
  MOVE_UPLOAD_REFUSAL_CODES,
} from "@/lib/programs/move-upload-refusal";

const STAGES: MoveUploadWriteStage[] = ["before_storage", "storing", "stored"];

describe("the three exits are ordered against the two writes", () => {
  it("names a distinct code and landed state for each stage", () => {
    const codes = STAGES.map((s) => classifyMoveUploadWriteFailure(s).code);
    const landed = STAGES.map((s) => classifyMoveUploadWriteFailure(s).landed);
    expect(new Set(codes).size).toBe(3);
    expect(new Set(landed).size).toBe(3);
  });

  it("maps each stage to the writes that had actually happened", () => {
    expect(classifyMoveUploadWriteFailure("before_storage").landed).toBe(
      "nothing",
    );
    expect(classifyMoveUploadWriteFailure("storing").landed).toBe(
      "bytes_without_registration",
    );
    expect(classifyMoveUploadWriteFailure("stored").landed).toBe(
      "bytes_and_registration",
    );
  });

  it("calls a retry safe exactly where nothing is registered yet", () => {
    // This is the whole point of the split. `stored` means the row is written,
    // so re-uploading takes a fresh version number and leaves the reviewer
    // with two current-looking copies of one file.
    expect(classifyMoveUploadWriteFailure("before_storage").retryIsSafe).toBe(
      true,
    );
    expect(classifyMoveUploadWriteFailure("storing").retryIsSafe).toBe(true);
    expect(classifyMoveUploadWriteFailure("stored").retryIsSafe).toBe(false);
  });

  it("answers every stage with a body, never an unbodied failure", () => {
    for (const stage of STAGES) {
      const failure = classifyMoveUploadWriteFailure(stage);
      expect(failure.status).toBeGreaterThanOrEqual(400);
      expect(failure.detail.trim()).not.toBe("");
      expect(failure.code.trim()).not.toBe("");
    }
  });

  it("uses a status no tenancy arm uses, so the two cannot be confused", () => {
    // `tenancyErrorResponse` answers 401, 403 and 503 and nothing else. A
    // named arm sharing one of those would make a write failure read as an
    // auth or lookup problem in every log and dashboard that groups by status.
    for (const stage of STAGES) {
      expect([401, 403, 503]).not.toContain(
        classifyMoveUploadWriteFailure(stage).status,
      );
    }
  });
});

describe("the copy module owns every code this classifier emits", () => {
  it("gives each stage code a sentence of its own, not the default", () => {
    // The emitted-field-nobody-reads failure, inverted: a code the copy module
    // does not recognise is answered by the unnamed default, so the fix would
    // be inert at the one place it has to show.
    const fallback = describeMoveUploadRefusal({ fileName: "notes.pdf" });
    const sentences = new Set<string>();
    for (const stage of STAGES) {
      const { code } = classifyMoveUploadWriteFailure(stage);
      expect(isMoveUploadRefusalCode(code)).toBe(true);
      expect(MOVE_UPLOAD_REFUSAL_CODES).toContain(code);
      const sentence = describeMoveUploadRefusal({
        code,
        fileName: "discovery-notes.pdf",
      });
      expect(sentence).not.toBe(fallback);
      expect(sentence).not.toContain(code);
      expect(sentence).toContain("discovery-notes.pdf");
      sentences.add(sentence);
    }
    expect(sentences.size).toBe(3);
  });

  it("declares the same code set the classifier can produce", () => {
    expect([...MOVE_UPLOAD_WRITE_STAGE_CODES].sort()).toEqual(
      STAGES.map((s) => classifyMoveUploadWriteFailure(s).code).sort(),
    );
  });

  it("keeps the engineer-facing detail off the reviewer's screen", () => {
    // `detail` on these arms names a function and a table. None of the three
    // is in `DETAIL_IS_REVIEWER_PROSE`, which is what stops it rendering.
    for (const stage of STAGES) {
      const failure = classifyMoveUploadWriteFailure(stage);
      expect(DETAIL_IS_REVIEWER_PROSE).not.toContain(failure.code);
      expect(
        describeMoveUploadRefusal({
          code: failure.code,
          detail: failure.detail,
          fileName: "notes.pdf",
        }),
      ).not.toContain(failure.detail);
    }
  });
});

describe("the sentence a reviewer reads states the writes, in both directions", () => {
  const sentenceFor = (stage: MoveUploadWriteStage) =>
    describeMoveUploadRefusal({
      code: classifyMoveUploadWriteFailure(stage).code,
      fileName: "workshop-notes.docx",
    });

  it("says nothing was stored only where nothing was", () => {
    expect(sentenceFor("before_storage")).toMatch(/nothing was stored/);
    expect(sentenceFor("storing")).not.toMatch(/nothing was stored/);
    expect(sentenceFor("stored")).not.toMatch(/nothing was stored/);
  });

  it("asks for a second upload on the two stages where it is safe", () => {
    expect(sentenceFor("before_storage")).toMatch(/[Uu]pload it again/);
    expect(sentenceFor("storing")).toMatch(/[Uu]pload it again/);
  });

  it("tells the completed upload NOT to be repeated", () => {
    // The worst outcome this lane prevents. Before the split this stage was
    // answered by a sentence that opens "was not uploaded" and ends "Try
    // again" — for a file that was fully stored, registered and queued for
    // extraction.
    const sentence = sentenceFor("stored");
    expect(sentence).toMatch(/Do not upload it again/);
    expect(sentence).not.toMatch(/Try again/);
    expect(sentence).toMatch(/stored and registered/);
    expect(sentence).toContain("Files & Evidence");
  });

  it("sends the unregistered stage to look nowhere, because the cabinet lists rows", () => {
    // A reviewer told to "check whether a partial record landed" would find
    // nothing: the cabinet reads `move_artifacts`, and the row is exactly what
    // this stage failed to write.
    const sentence = sentenceFor("storing");
    expect(sentence).toMatch(/not be listed/);
    expect(sentence).toMatch(/no duplicate|leaves no duplicate/);
  });
});

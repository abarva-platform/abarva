// Moves · evidence upload · the refusal copy contract.
//
// The defect this guards: the Moves upload route declares six refusal codes
// and put a MACHINE VALUE in `detail` for three of them (the raw MIME string,
// a byte count, the name of a multipart field). One reader preferred `error`
// and showed the bare code; two preferred `detail` and showed the machine
// value. The cases below pin that no code reaches a reviewer as either.

import {
  DETAIL_IS_REVIEWER_PROSE,
  describeMoveUploadRefusal,
  describeUploadSizeLimit,
  isMoveUploadRefusalCode,
  MOVE_UPLOAD_REFUSAL_CODES,
  type MoveUploadRefusalCode,
} from "@/lib/programs/move-upload-refusal";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/lib/programs/attachments/mime";
import { SENSITIVE_UPLOAD_QUARANTINE_CODE } from "@/lib/security/sensitive-upload-guard";

describe("the upload refusal code list", () => {
  it("names the six codes the route declares", () => {
    expect([...MOVE_UPLOAD_REFUSAL_CODES]).toEqual([
      "file_required",
      "file_too_large",
      "unsupported_type",
      "evidence_family_requires_evidence_upload",
      "unknown_evidence_family",
      "sensitive_data_quarantined",
    ]);
  });

  it("agrees with the shared guard's own declaration of the quarantine code", () => {
    // The copy module repeats the literal rather than importing the guard,
    // because the guard reaches a regex-table scanner and every reader of
    // this copy is a client component. This is what stops the repetition
    // drifting from the response the guard actually sends.
    expect(MOVE_UPLOAD_REFUSAL_CODES).toContain(
      SENSITIVE_UPLOAD_QUARANTINE_CODE,
    );
  });

  it("recognises every named code and nothing else", () => {
    for (const code of MOVE_UPLOAD_REFUSAL_CODES) {
      expect(isMoveUploadRefusalCode(code)).toBe(true);
    }
    for (const notACode of [
      "not_found",
      "no_pending_review",
      "",
      undefined,
      null,
      7,
      {},
    ]) {
      expect(isMoveUploadRefusalCode(notACode)).toBe(false);
    }
  });
});

describe("every named refusal reaches the reviewer as product language", () => {
  it("never renders the code itself", () => {
    for (const code of MOVE_UPLOAD_REFUSAL_CODES) {
      const sentence = describeMoveUploadRefusal({
        code,
        fileName: "discovery-notes.pdf",
      });
      expect(sentence).not.toContain(code);
      expect(sentence.length).toBeGreaterThan(40);
    }
  });

  it("gives every named code a next action, and no two the same sentence", () => {
    const sentences = MOVE_UPLOAD_REFUSAL_CODES.map((code) =>
      describeMoveUploadRefusal({ code, fileName: "notes.pdf" }),
    );
    for (const sentence of sentences) {
      // A refusal a reviewer cannot act on is the defect, not the wording.
      expect(sentence).toMatch(
        /[Uu]pload|[Cc]hange|[Pp]ick|[Rr]emove|[Cc]hoose/,
      );
    }
    expect(new Set(sentences).size).toBe(sentences.length);
  });

  it("names the file it refused, and falls back to a subject when it cannot", () => {
    expect(
      describeMoveUploadRefusal({
        code: "file_too_large",
        fileName: "q3-extract.xlsx",
      }),
    ).toContain("q3-extract.xlsx");
    for (const blank of [undefined, "", "   ", 42]) {
      expect(
        describeMoveUploadRefusal({ code: "file_too_large", fileName: blank }),
      ).toMatch(/^That file /);
    }
  });
});

describe("`detail` is trusted only where the route writes it as prose", () => {
  it("discards the machine values the route puts in `detail`", () => {
    // These are the three the route actually emits: the raw MIME type, a byte
    // count, and the name of a multipart form field.
    const machineDetails: Array<[MoveUploadRefusalCode, string]> = [
      ["unsupported_type", "application/zip"],
      ["file_too_large", `max ${MAX_ATTACHMENT_SIZE_BYTES} bytes`],
      ["file_required", "multipart field 'file' is required"],
    ];
    for (const [code, detail] of machineDetails) {
      const sentence = describeMoveUploadRefusal({
        code,
        detail,
        fileName: "notes.pdf",
      });
      expect(sentence).not.toContain(detail);
      expect(sentence).toBe(
        describeMoveUploadRefusal({ code, fileName: "notes.pdf" }),
      );
    }
  });

  it("renders the server sentence for the two codes that author one", () => {
    expect([...DETAIL_IS_REVIEWER_PROSE]).toEqual([
      "evidence_family_requires_evidence_upload",
      "unknown_evidence_family",
    ]);
    for (const code of DETAIL_IS_REVIEWER_PROSE) {
      expect(
        describeMoveUploadRefusal({
          code,
          detail: "'ops_runbook' is not an evidence family this Move requires.",
          fileName: "notes.pdf",
        }),
      ).toBe("'ops_runbook' is not an evidence family this Move requires.");
    }
  });

  it("falls back to its own sentence when a prose-bearing code sends none", () => {
    for (const code of DETAIL_IS_REVIEWER_PROSE) {
      for (const empty of [undefined, "", "   "]) {
        const sentence = describeMoveUploadRefusal({
          code,
          detail: empty,
          fileName: "notes.pdf",
        });
        expect(sentence.trim()).not.toBe("");
        expect(sentence).not.toContain(code);
      }
    }
  });
});

describe("the size limit is stated as the limit declares it", () => {
  it("reads the cap from the allowlist module, not a retyped literal", () => {
    expect(describeUploadSizeLimit()).toBe("100 MB");
    expect(
      describeMoveUploadRefusal({ code: "file_too_large", fileName: "a.pdf" }),
    ).toContain(describeUploadSizeLimit());
  });

  it("states a fractional cap without rounding it away", () => {
    expect(describeUploadSizeLimit(1024 * 1024)).toBe("1 MB");
    expect(describeUploadSizeLimit(1024 * 1024 * 2.5)).toBe("2.5 MB");
  });
});

describe("an unnamed refusal", () => {
  it("does not claim nothing was stored, because it cannot know", () => {
    // Every NAMED code refuses before `saveMoveArtifact`. An unnamed one may
    // have come from the route's catch-all after a partial write, so this
    // sentence sends the reviewer to look rather than asserting a state.
    const sentence = describeMoveUploadRefusal({
      code: "engagement_insert_failed",
      fileName: "notes.pdf",
    });
    expect(sentence).not.toMatch(/nothing was stored/);
    expect(sentence).toContain("Files & Evidence");
    expect(sentence).not.toContain("engagement_insert_failed");
  });

  it("answers the same way for an absent or non-string code", () => {
    const baseline = describeMoveUploadRefusal({ fileName: "notes.pdf" });
    for (const code of [undefined, null, "", 500, {}]) {
      expect(describeMoveUploadRefusal({ code, fileName: "notes.pdf" })).toBe(
        baseline,
      );
    }
  });

  it("ignores a `detail` it cannot vouch for", () => {
    expect(
      describeMoveUploadRefusal({
        code: "something_new",
        detail: "ECONNRESET at pool.acquire (db.ts:88)",
        fileName: "notes.pdf",
      }),
    ).not.toContain("ECONNRESET");
  });
});

describe("the sibling copy module is not this one", () => {
  it("keeps the two detail policies apart", async () => {
    // `describeEvidenceDecisionRefusal` serves the approve route, whose
    // `detail` is uniformly prose, so it prefers `detail` for EVERY code.
    // This module must not: three of its codes carry machine values there.
    // A later "harmonisation" of the two is the regression this case names.
    const { describeEvidenceDecisionRefusal } =
      await import("@/lib/programs/evidence-cabinet-readback");
    expect(
      describeEvidenceDecisionRefusal({
        code: "forbidden",
        detail: "a server sentence",
      }),
    ).toBe("a server sentence");
    expect(
      describeMoveUploadRefusal({
        code: "unsupported_type",
        detail: "a server sentence",
      }),
    ).not.toBe("a server sentence");
  });
});

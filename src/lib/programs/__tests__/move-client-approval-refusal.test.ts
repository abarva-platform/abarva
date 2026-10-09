/**
 * Moves · client approval · the reviewer sentence per refusal code.
 *
 * The route under test accepts an AI-prepared draft as the authoritative phase
 * deliverable, and its decision is read back before the next phase will
 * generate. Its nineteen refusal codes reached both product readers through
 * `json.detail || json.error`, and `detail` on this route is prose for some
 * codes and a machine value for others — a raw MIME string, a byte count, a
 * thrown `Error.message`, or absent entirely. These cases pin which codes may
 * show the server's text, which may not, and what each sentence CLAIMS about
 * whether the approval was recorded.
 *
 * The last fact is the one the previous copy got wrong in the direction that
 * costs a reviewer something: `sign_off_failed` is reached only after the
 * document has been stored and a draft version recorded, and its old sentence
 * ("Deliverable could not be signed off.") stated neither, so a reviewer who
 * read it as "nothing happened" and approved again recorded a second draft.
 */

import {
  APPROVED_EVIDENCE_BASIS_REFUSAL_CODES,
  approvedEvidenceBasisRefusalCode,
  type ApprovedEvidenceBasisRefusal,
} from "@/lib/programs/approved-evidence-basis-refusal";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/lib/programs/attachments/mime";
import { describeUploadSizeLimit } from "@/lib/programs/move-upload-refusal";
import {
  DETAIL_IS_REVIEWER_PROSE,
  describeMoveClientApprovalRefusal,
  isMoveClientApprovalRefusalCode,
  MOVE_CLIENT_APPROVAL_OWN_REFUSAL_CODES,
  MOVE_CLIENT_APPROVAL_REFUSAL_CODES,
  type MoveClientApprovalRefusalCode,
} from "@/lib/programs/move-client-approval-refusal";

/** The machine values the route actually puts in `detail`, verbatim. */
const MACHINE_DETAILS: Partial<Record<MoveClientApprovalRefusalCode, string>> =
  {
    unsupported_type: "application/zip",
    file_too_large: `max ${MAX_ATTACHMENT_SIZE_BYTES} bytes`,
    internal_error: "Cannot read properties of undefined (reading 'id')",
    generated_artifact_final_render_failed:
      "ENOENT: no such file or directory, open '/tmp/docx-render-7f3.tmp'",
  };

/**
 * Codes that refuse before any write, so their sentence is entitled to say the
 * approval was not recorded. `sign_off_failed` and `internal_error` are
 * deliberately absent: one knows a write landed, the other cannot know.
 */
const REFUSES_BEFORE_ANY_WRITE: readonly MoveClientApprovalRefusalCode[] = [
  "not_found",
  "file_required",
  "file_too_large",
  "unsupported_type",
  "generated_artifact_final_render_failed",
  "generated_artifact_final_not_available",
  "artifact_storage_unavailable",
];

describe("the client-approval refusal code roster", () => {
  it("names every code without duplicating one", () => {
    expect(new Set(MOVE_CLIENT_APPROVAL_REFUSAL_CODES).size).toBe(
      MOVE_CLIENT_APPROVAL_REFUSAL_CODES.length,
    );
  });

  it("folds in the delegated approved-evidence basis codes", () => {
    for (const code of APPROVED_EVIDENCE_BASIS_REFUSAL_CODES) {
      expect(MOVE_CLIENT_APPROVAL_REFUSAL_CODES).toContain(code);
      expect(MOVE_CLIENT_APPROVAL_OWN_REFUSAL_CODES).not.toContain(code);
    }
  });

  it("matches what the basis describer can actually return", () => {
    const conditions = [
      "basis_unevaluable",
      "recorded_basis_absent",
      "snapshot_superseded",
    ] as const;
    const emitted = conditions.map((condition) =>
      approvedEvidenceBasisRefusalCode({
        condition,
        reason: null,
      } as unknown as ApprovedEvidenceBasisRefusal),
    );
    expect(new Set(emitted)).toEqual(
      new Set(APPROVED_EVIDENCE_BASIS_REFUSAL_CODES),
    );
  });

  it("recognises every named code and nothing else", () => {
    for (const code of MOVE_CLIENT_APPROVAL_REFUSAL_CODES) {
      expect(isMoveClientApprovalRefusalCode(code)).toBe(true);
    }
    for (const other of [
      "",
      "not_a_code",
      "NOT_FOUND",
      undefined,
      null,
      42,
      {},
    ]) {
      expect(isMoveClientApprovalRefusalCode(other)).toBe(false);
    }
  });
});

describe("every named code gets a reviewer sentence", () => {
  it.each(MOVE_CLIENT_APPROVAL_REFUSAL_CODES)(
    "%s reads as product prose, never the code",
    (code) => {
      const sentence = describeMoveClientApprovalRefusal({
        code,
        detail: DETAIL_IS_REVIEWER_PROSE.includes(code)
          ? "The server's own reviewer sentence."
          : MACHINE_DETAILS[code],
      });
      expect(sentence).not.toContain(code);
      expect(sentence).not.toContain("_");
      expect(sentence.length).toBeGreaterThan(24);
      expect(sentence.trim()).toBe(sentence);
      expect(sentence.endsWith(".")).toBe(true);
    },
  );

  it("never leaks a machine detail the route emitted", () => {
    for (const [code, detail] of Object.entries(MACHINE_DETAILS)) {
      const sentence = describeMoveClientApprovalRefusal({ code, detail });
      expect(sentence).not.toContain(detail);
    }
  });

  it("shows the server's sentence only for the trusted codes", () => {
    const serverProse = "Rebuild the architecture chain before approval.";
    for (const code of MOVE_CLIENT_APPROVAL_REFUSAL_CODES) {
      const sentence = describeMoveClientApprovalRefusal({
        code,
        detail: serverProse,
      });
      if (DETAIL_IS_REVIEWER_PROSE.includes(code)) {
        expect(sentence).toBe(serverProse);
      } else {
        expect(sentence).not.toBe(serverProse);
      }
    }
  });

  it("falls back to its own sentence when a trusted detail is blank", () => {
    for (const code of DETAIL_IS_REVIEWER_PROSE) {
      for (const detail of ["", "   ", undefined, null, 7]) {
        const sentence = describeMoveClientApprovalRefusal({ code, detail });
        expect(sentence.length).toBeGreaterThan(24);
        expect(sentence).not.toContain(code);
      }
    }
  });
});

describe("what each sentence claims was recorded", () => {
  it.each(REFUSES_BEFORE_ANY_WRITE)(
    "%s says the approval was not recorded",
    (code) => {
      // Either wording settles the same fact; what matters is that the
      // sentence states it rather than leaving the reviewer to guess.
      expect(describeMoveClientApprovalRefusal({ code })).toMatch(
        /(approval was not recorded|nothing was recorded)/,
      );
    },
  );

  it("sign_off_failed says the document WAS stored and the approval was not", () => {
    const sentence = describeMoveClientApprovalRefusal({
      code: "sign_off_failed",
      detail: "Deliverable could not be signed off.",
    });
    expect(sentence).toContain("was stored");
    expect(sentence).toContain("draft version recorded");
    expect(sentence).toMatch(/approval itself was not/);
    // It must not tell the reviewer to simply approve this one again: that is
    // the action that records a second draft.
    expect(sentence).toContain("rather than approving this one");
  });

  it("internal_error claims neither outcome", () => {
    const sentence = describeMoveClientApprovalRefusal({
      code: "internal_error",
      detail: MACHINE_DETAILS.internal_error,
    });
    expect(sentence).not.toMatch(
      /(approval was not recorded|nothing was recorded)/,
    );
    expect(sentence).not.toContain("was stored");
    expect(sentence).toContain("may have");
    expect(sentence).toMatch(/check what is recorded/);
  });

  it("the unnamed default claims neither outcome either", () => {
    for (const input of [
      {},
      { code: undefined },
      { code: "a_twentieth_code" },
      { code: "a_twentieth_code", detail: "application/x-tar" },
    ]) {
      const sentence = describeMoveClientApprovalRefusal(input);
      expect(sentence).toContain("not recognised");
      expect(sentence).not.toMatch(
        /(approval was not recorded|nothing was recorded)/,
      );
      expect(sentence).not.toContain("was stored");
      expect(sentence).not.toContain("application/x-tar");
    }
  });
});

describe("the sentences name a next action the reviewer can take", () => {
  it("every authored sentence prescribes something", () => {
    const authoredCodes = MOVE_CLIENT_APPROVAL_REFUSAL_CODES.filter(
      (code) => !DETAIL_IS_REVIEWER_PROSE.includes(code),
    );
    expect(authoredCodes.length).toBeGreaterThan(0);
    for (const code of authoredCodes) {
      const sentence = describeMoveClientApprovalRefusal({ code });
      expect(sentence).toMatch(
        /Reload|Choose|Save|Rebuild|upload it again|try again|download/i,
      );
    }
  });

  it("the size refusal states the limit as the limit itself states it", () => {
    expect(describeUploadSizeLimit()).toBe("100 MB");
    expect(describeUploadSizeLimit(1024 * 1024)).toBe("1 MB");
    expect(describeUploadSizeLimit(1024 * 1024 * 1.5)).toBe("1.5 MB");
    expect(
      describeMoveClientApprovalRefusal({
        code: "file_too_large",
        detail: MACHINE_DETAILS.file_too_large,
      }),
    ).toContain(describeUploadSizeLimit());
  });

  it("the unsupported-format refusal names formats, not a MIME type", () => {
    const sentence = describeMoveClientApprovalRefusal({
      code: "unsupported_type",
      detail: "application/zip",
    });
    expect(sentence).toContain("Word");
    expect(sentence).toContain("PDF");
    expect(sentence).not.toContain("application/");
  });

  it("an un-renderable draft is offered the download-edit-upload route", () => {
    for (const code of [
      "generated_artifact_final_render_failed",
      "generated_artifact_final_not_available",
    ] as const) {
      expect(describeMoveClientApprovalRefusal({ code })).toMatch(
        /upload it as the approved final/,
      );
    }
  });
});

import type { ReviewedEvidenceExtraction } from "@/lib/programs/evidence-review-contract";
import { describeEvidenceDecisionRefusal } from "@/lib/programs/evidence-cabinet-readback";
import { describeMoveUploadRefusal } from "@/lib/programs/move-upload-refusal";

/**
 * The three governed evidence requests every Moves surface makes — read the
 * Move's evidence, upload a file into it, and decide a pending extraction —
 * in one place, so the Files library and the step pages cannot diverge on
 * the request or on what a refusal says.
 */

/** The raw artifacts read. Callers keep their own readback rules over it. */
export async function fetchMoveEvidence(
  moveId: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(`/api/v1/programs/${moveId}/artifacts`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as Record<string, unknown>;
}

/**
 * Upload one file as evidence (or a session file) for a phase. Resolves with
 * the route's body; rejects with the reader-facing refusal sentence.
 */
export async function uploadMoveEvidence(input: {
  moveId: string;
  file: File;
  phase: number;
  family: string;
  evidenceFamily?: string;
}): Promise<Record<string, unknown>> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("phase", String(input.phase));
  form.append("family", input.family);
  if (input.family === "uploaded_evidence" && input.evidenceFamily) {
    form.append("evidenceFamily", input.evidenceFamily);
  }
  const response = await fetch(
    `/api/v1/programs/${input.moveId}/artifacts/upload`,
    {
      method: "POST",
      credentials: "include",
      body: form,
    },
  );
  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok || !body.ok) {
    throw new Error(
      describeMoveUploadRefusal({
        code: body.error,
        detail: body.detail,
        fileName: input.file.name,
      }),
    );
  }
  return body;
}

/**
 * Approve or reject a pending extraction. Rejects with the reader-facing
 * refusal sentence (a repeated decision reads as already decided, not as a
 * bare code).
 */
export async function decideMoveEvidence(input: {
  moveId: string;
  evidenceId: string;
  decision: "approved" | "rejected";
  extraction?: ReviewedEvidenceExtraction;
  rationale?: string;
}): Promise<void> {
  const response = await fetch(
    `/api/v1/programs/${input.moveId}/current-state/evidence/${input.evidenceId}/approve`,
    {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        decision: input.decision,
        reviewedExtraction: input.extraction,
        rationale:
          input.rationale?.trim() ||
          (input.decision === "approved"
            ? "Reviewer approved the corrected evidence extraction."
            : "Reviewer rejected the parsed evidence."),
      }),
    },
  );
  const result = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok || !result.ok) {
    throw new Error(
      describeEvidenceDecisionRefusal({
        code: result.error,
        detail: result.detail,
      }),
    );
  }
}

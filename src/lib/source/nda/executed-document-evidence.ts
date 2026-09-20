/**
 * Stage 05 — what makes an uploaded document *executed*.
 *
 * The recorded decision defers e-signature provider integration entirely:
 * no provider mutation, no supplier email, no access change is authorized.
 * Day one is "a controlled upload of the executed document **plus signature
 * metadata and hashes** through the canonical Evidence/Artifact service".
 *
 * That second half had nothing behind it. An artifact typed `nda_executed`
 * cleared readiness on an approval state and a file hash — neither of which
 * says anyone signed anything. A hash proves the bytes did not change; it
 * says nothing about whose signature is on them, when, or whether both
 * sides signed at all. A scan of an unsigned draft, uploaded and approved,
 * was indistinguishable from an executed agreement.
 *
 * This module is the contract for that evidence. It decides, and refuses.
 * It performs no upload, contacts no provider, and reads nothing.
 */

export type NdaSignatureMethod =
  | "wet_ink"
  | "e_signature_out_of_band"
  | "unknown";

export type ExecutedDocumentEvidence = {
  /** Hash of the executed document itself. */
  documentSha256?: string | null;
  signatureMethod?: NdaSignatureMethod | null;
  signedAt?: string | null;
  supplierSignatoryName?: string | null;
  buyerSignatoryName?: string | null;
  /**
   * Hash of the completion certificate. Only an out-of-band e-signature
   * produces one; a wet-ink document has none, and demanding one there
   * would be a gate nothing could ever pass.
   */
  certificateSha256?: string | null;
  /** Reference into the client's private evidence store, where one exists. */
  privateEvidenceRef?: string | null;
};

export type ExecutedDocumentVerdict = {
  /**
   * `absent` means no evidence was offered at all, which is materially
   * different from evidence that was offered and fell short. A surface that
   * renders the two alike tells a user to fix something they never started.
   */
  state: "complete" | "incomplete" | "absent";
  defects: readonly string[];
  /** Reported rather than required: no producer writes it yet. */
  privateEvidenceRecorded: boolean;
};

const filled = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

function offeredNothing(evidence: ExecutedDocumentEvidence): boolean {
  return (
    !filled(evidence.documentSha256) &&
    !filled(evidence.signedAt) &&
    !filled(evidence.supplierSignatoryName) &&
    !filled(evidence.buyerSignatoryName) &&
    !filled(evidence.certificateSha256) &&
    (evidence.signatureMethod === undefined ||
      evidence.signatureMethod === null)
  );
}

/**
 * Judge the signature evidence on one uploaded document.
 *
 * `asOf` is passed in rather than read from the clock so the verdict is
 * reproducible, and so a document signed in the future can be refused.
 */
export function evaluateExecutedDocumentEvidence(
  evidence: ExecutedDocumentEvidence,
  asOf: string,
): ExecutedDocumentVerdict {
  const privateEvidenceRecorded = filled(evidence.privateEvidenceRef);

  if (offeredNothing(evidence)) {
    return {
      state: "absent",
      defects: [
        "No signature evidence was recorded for this document, so nothing shows it was executed.",
      ],
      privateEvidenceRecorded,
    };
  }

  const defects: string[] = [];

  if (!filled(evidence.documentSha256)) {
    defects.push("The executed document has no hash, so the bytes reviewed cannot be pinned.");
  }

  if (
    evidence.signatureMethod === undefined ||
    evidence.signatureMethod === null ||
    evidence.signatureMethod === "unknown"
  ) {
    defects.push("No signature method is declared, so how this was signed is unknown.");
  }

  // Both sides. A document one party signed is a counter-signature away
  // from being an agreement, and calling it executed skips that step.
  if (!filled(evidence.supplierSignatoryName)) {
    defects.push("No supplier signatory is named.");
  }
  if (!filled(evidence.buyerSignatoryName)) {
    defects.push("No internal signatory is named.");
  }

  const signedAt = filled(evidence.signedAt)
    ? Date.parse(evidence.signedAt!)
    : Number.NaN;
  const at = Date.parse(asOf);
  if (Number.isNaN(signedAt)) {
    defects.push("No usable signature date is recorded.");
  } else if (!Number.isNaN(at) && signedAt > at) {
    defects.push("The signature date is in the future, which cannot be right.");
  }

  // Earned, not blanket: only an out-of-band e-signature produces a
  // completion certificate.
  if (
    evidence.signatureMethod === "e_signature_out_of_band" &&
    !filled(evidence.certificateSha256)
  ) {
    defects.push(
      "An out-of-band e-signature was declared and no completion certificate hash is recorded.",
    );
  }

  return {
    state: defects.length === 0 ? "complete" : "incomplete",
    defects,
    privateEvidenceRecorded,
  };
}

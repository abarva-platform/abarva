import {
  evaluateExecutedDocumentEvidence,
  type ExecutedDocumentEvidence,
} from "@/lib/source/nda/executed-document-evidence";

/**
 * An artifact typed `nda_executed` used to clear readiness on an approval
 * state and a file hash. Neither says anyone signed anything: a hash proves
 * the bytes did not change, not whose signature is on them. A scan of an
 * unsigned draft, uploaded and approved, was indistinguishable from an
 * executed agreement.
 *
 * So each case here removes one thing that would actually make the document
 * executed, and pins the refusal. Two cases matter more than the rest: the
 * one separating "no evidence offered" from "evidence that fell short", and
 * the one keeping the certificate requirement off wet-ink documents, which
 * can never produce one.
 */

const AS_OF = "2026-09-19T00:00:00Z";

function evidence(
  overrides: Partial<ExecutedDocumentEvidence> = {},
): ExecutedDocumentEvidence {
  return {
    documentSha256: "abc123",
    signatureMethod: "wet_ink",
    signedAt: "2026-06-01T00:00:00Z",
    supplierSignatoryName: "R. Vendor",
    buyerSignatoryName: "A. Buyer",
    ...overrides,
  };
}

describe("what makes an uploaded document executed", () => {
  it("accepts a wet-ink document signed by both sides", () => {
    const verdict = evaluateExecutedDocumentEvidence(evidence(), AS_OF);

    expect(verdict.state).toBe("complete");
    expect(verdict.defects).toEqual([]);
  });

  it("separates evidence nobody offered from evidence that fell short", () => {
    // Rendering these alike tells a user to fix something they never
    // started, and hides that the field was never captured.
    const nothing = evaluateExecutedDocumentEvidence({}, AS_OF);
    expect(nothing.state).toBe("absent");
    expect(nothing.defects.join(" ")).toContain("nothing shows it was executed");

    const partial = evaluateExecutedDocumentEvidence(
      { documentSha256: "abc123" },
      AS_OF,
    );
    expect(partial.state).toBe("incomplete");
  });

  it("refuses a document nobody on the supplier side signed", () => {
    const verdict = evaluateExecutedDocumentEvidence(
      evidence({ supplierSignatoryName: "  " }),
      AS_OF,
    );

    expect(verdict.state).toBe("incomplete");
    expect(verdict.defects.join(" ")).toContain("No supplier signatory");
  });

  it("refuses a document nobody internally signed", () => {
    // Half-signed is not executed. A counter-signature is a step, not a
    // formality to infer.
    const verdict = evaluateExecutedDocumentEvidence(
      evidence({ buyerSignatoryName: null }),
      AS_OF,
    );

    expect(verdict.state).toBe("incomplete");
    expect(verdict.defects.join(" ")).toContain("No internal signatory");
  });

  it("refuses a document with no hash", () => {
    const verdict = evaluateExecutedDocumentEvidence(
      evidence({ documentSha256: null }),
      AS_OF,
    );

    expect(verdict.state).toBe("incomplete");
    expect(verdict.defects.join(" ")).toContain("no hash");
  });

  it("refuses an undeclared signature method, and refuses the unknown one too", () => {
    const missing = evaluateExecutedDocumentEvidence(
      evidence({ signatureMethod: null }),
      AS_OF,
    );
    expect(missing.defects.join(" ")).toContain("No signature method");

    // "unknown" is a declared value that declares nothing, and reading it
    // as an answer is how an enum becomes a presence flag.
    const unknown = evaluateExecutedDocumentEvidence(
      evidence({ signatureMethod: "unknown" }),
      AS_OF,
    );
    expect(unknown.state).toBe("incomplete");
    expect(unknown.defects.join(" ")).toContain("No signature method");
  });

  it("refuses an unreadable signature date", () => {
    const verdict = evaluateExecutedDocumentEvidence(
      evidence({ signedAt: "last tuesday" }),
      AS_OF,
    );

    expect(verdict.state).toBe("incomplete");
    expect(verdict.defects.join(" ")).toContain("No usable signature date");
  });

  it("refuses a document signed in the future", () => {
    const verdict = evaluateExecutedDocumentEvidence(
      evidence({ signedAt: "2027-01-01T00:00:00Z" }),
      AS_OF,
    );

    expect(verdict.state).toBe("incomplete");
    expect(verdict.defects.join(" ")).toContain("in the future");
  });

  it("requires a completion certificate for an out-of-band e-signature", () => {
    const withoutCertificate = evaluateExecutedDocumentEvidence(
      evidence({ signatureMethod: "e_signature_out_of_band" }),
      AS_OF,
    );
    expect(withoutCertificate.state).toBe("incomplete");
    expect(withoutCertificate.defects.join(" ")).toContain("completion certificate");

    const withCertificate = evaluateExecutedDocumentEvidence(
      evidence({
        signatureMethod: "e_signature_out_of_band",
        certificateSha256: "cert-hash",
      }),
      AS_OF,
    );
    expect(withCertificate.state).toBe("complete");
  });

  it("does not demand a certificate from a wet-ink document, which has none", () => {
    // A requirement nothing can satisfy is a gate that gets switched off.
    const verdict = evaluateExecutedDocumentEvidence(
      evidence({ signatureMethod: "wet_ink", certificateSha256: null }),
      AS_OF,
    );

    expect(verdict.state).toBe("complete");
  });

  it("reports whether private evidence was recorded without requiring it", () => {
    // No producer writes this field yet. Requiring it would ship a gate
    // that could never pass; hiding it would lose the fact that the
    // document is not stored under the private-evidence contract.
    const without = evaluateExecutedDocumentEvidence(evidence(), AS_OF);
    expect(without.state).toBe("complete");
    expect(without.privateEvidenceRecorded).toBe(false);

    const with_ = evaluateExecutedDocumentEvidence(
      evidence({ privateEvidenceRef: "blob://tenant/evt-1/nda.pdf" }),
      AS_OF,
    );
    expect(with_.privateEvidenceRecorded).toBe(true);
  });

  it("does not read a private evidence reference as evidence of signing", () => {
    // Stored is not signed. A file in the right place, with nothing else,
    // must still read as absent.
    const verdict = evaluateExecutedDocumentEvidence(
      { privateEvidenceRef: "blob://tenant/evt-1/nda.pdf" },
      AS_OF,
    );

    expect(verdict.state).toBe("absent");
    expect(verdict.privateEvidenceRecorded).toBe(true);
  });

  it("names every missing thing at once rather than stopping at the first", () => {
    // A surface that reveals one defect per upload round-trips a person
    // through four attempts.
    const verdict = evaluateExecutedDocumentEvidence(
      {
        signatureMethod: "e_signature_out_of_band",
        signedAt: "2026-06-01T00:00:00Z",
      },
      AS_OF,
    );

    expect(verdict.state).toBe("incomplete");
    expect(verdict.defects).toHaveLength(4);
  });
});

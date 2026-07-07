import {
  PAPERCLIP_ABUSE_FIXTURES,
  PAPERCLIP_ABUSE_LIMITS,
  assessPaperclipAbuse,
  runPaperclipAbuseMatrix,
} from "../paperclip-abuse-guard";

describe("paperclip abuse guard", () => {
  it("throttles 50 rapid-fire uploads in a 60 second window", () => {
    const result = assessPaperclipAbuse(
      PAPERCLIP_ABUSE_FIXTURES.rapidFire50In60s,
    );

    expect(result).toMatchObject({
      decision: "rate_limit",
      reason: "rapid_fire_uploads",
      storageAllowed: false,
      parsingAllowed: false,
      queueAllowed: false,
      retryAfterSeconds: 60,
    });
  });

  it("holds a 1000-page PDF out of the parser queue for operator review", () => {
    const result = assessPaperclipAbuse(
      PAPERCLIP_ABUSE_FIXTURES.thousandPagePdf,
    );

    expect(result).toMatchObject({
      decision: "manual_review",
      reason: "page_count_too_high",
      storageAllowed: true,
      parsingAllowed: false,
      queueAllowed: false,
    });
  });

  it("quarantines an executable wrapped as a PDF before storage or parsing", () => {
    const result = assessPaperclipAbuse(
      PAPERCLIP_ABUSE_FIXTURES.disguisedExecutablePdf,
    );

    expect(result).toMatchObject({
      decision: "quarantine",
      reason: "executable_wrapper_detected",
      storageAllowed: false,
      parsingAllowed: false,
      queueAllowed: false,
    });
  });

  it("rejects files above the paperclip byte cap", () => {
    const result = assessPaperclipAbuse(PAPERCLIP_ABUSE_FIXTURES.oversizedPdf);

    expect(result).toMatchObject({
      decision: "reject",
      reason: "file_too_large",
      storageAllowed: false,
      parsingAllowed: false,
      queueAllowed: false,
    });
    expect(PAPERCLIP_ABUSE_FIXTURES.oversizedPdf.sizeBytes).toBe(
      PAPERCLIP_ABUSE_LIMITS.maxBytes + 1,
    );
  });

  it("allows normal attachments to continue to the standard upload controls", () => {
    const result = assessPaperclipAbuse(PAPERCLIP_ABUSE_FIXTURES.normalPdf);

    expect(result).toMatchObject({
      decision: "allow",
      reason: "within_limits",
      storageAllowed: true,
      parsingAllowed: true,
      queueAllowed: true,
    });
  });

  it("emits an auditable matrix result for every fixture", () => {
    const matrix = runPaperclipAbuseMatrix();

    expect(Object.keys(matrix)).toEqual([
      "rapidFire50In60s",
      "thousandPagePdf",
      "disguisedExecutablePdf",
      "oversizedPdf",
      "normalPdf",
    ]);
    expect(
      Object.values(matrix).every((result) =>
        result.auditEvent.startsWith("paperclip_abuse_assessment:"),
      ),
    ).toBe(true);
  });
});

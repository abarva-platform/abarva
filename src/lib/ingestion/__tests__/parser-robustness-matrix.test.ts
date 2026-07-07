import {
  PARSER_ROBUSTNESS_FIXTURES,
  decideParserRobustness,
  runParserRobustnessMatrix,
} from "../parser-robustness-matrix";

describe("parser robustness matrix", () => {
  it("covers the required adversarial parser cases", () => {
    expect(PARSER_ROBUSTNESS_FIXTURES.map((fixture) => fixture.caseId)).toEqual(
      [
        "corrupted_pdf",
        "encrypted_pdf",
        "oversized_pdf",
        "scanned_only_pdf",
        "multilingual_pdf",
        "executable_wrapped_pdf",
      ],
    );
  });

  it("quarantines executable-wrapped PDFs before parsing", () => {
    expect(
      decideParserRobustness(
        PARSER_ROBUSTNESS_FIXTURES.find(
          (fixture) => fixture.caseId === "executable_wrapped_pdf",
        )!,
      ),
    ).toMatchObject({
      action: "quarantine",
      reason: "malware_or_disguised_executable",
      commitAllowed: false,
      fallbackDecision: null,
    });
  });

  it("pauses encrypted PDFs for a client-supplied password or replacement", () => {
    expect(
      decideParserRobustness(
        PARSER_ROBUSTNESS_FIXTURES.find(
          (fixture) => fixture.caseId === "encrypted_pdf",
        )!,
      ),
    ).toMatchObject({
      action: "manual_review",
      reason: "password_required",
      commitAllowed: false,
      fallbackDecision: null,
    });
  });

  it("blocks oversized PDFs from automatic parsing and commit", () => {
    const result = decideParserRobustness(
      PARSER_ROBUSTNESS_FIXTURES.find(
        (fixture) => fixture.caseId === "oversized_pdf",
      )!,
    );

    expect(result).toMatchObject({
      action: "manual_review",
      reason: "document_too_large",
      commitAllowed: false,
    });
    expect(result.fallbackDecision).toMatchObject({
      route: "marker-self-hosted",
      allowed: true,
      commitAllowed: false,
    });
  });

  it("routes scanned-only PDFs to private OCR and blocks commit pending review", () => {
    const result = decideParserRobustness(
      PARSER_ROBUSTNESS_FIXTURES.find(
        (fixture) => fixture.caseId === "scanned_only_pdf",
      )!,
    );

    expect(result).toMatchObject({
      action: "private_ocr",
      reason: "ocr_required",
      commitAllowed: false,
    });
    expect(result.operatorMessage).toContain("private OCR");
  });

  it("requires language-aware private fallback for unsupported language mixes", () => {
    const result = decideParserRobustness(
      PARSER_ROBUSTNESS_FIXTURES.find(
        (fixture) => fixture.caseId === "multilingual_pdf",
      )!,
    );

    expect(result).toMatchObject({
      action: "private_fallback",
      reason: "language_review_required",
      commitAllowed: false,
    });
    expect(result.fallbackDecision).toMatchObject({
      route: "marker-self-hosted",
      parserId: "marker-self-hosted",
    });
  });

  it("produces ledger events for every fixture and never auto-commits adverse cases", () => {
    const results = runParserRobustnessMatrix();

    expect(results).toHaveLength(6);
    expect(
      results.every((result) =>
        result.ledgerEvent.startsWith("parser_robustness_decision:"),
      ),
    ).toBe(true);
    expect(results.every((result) => result.commitAllowed === false)).toBe(
      true,
    );
  });
});

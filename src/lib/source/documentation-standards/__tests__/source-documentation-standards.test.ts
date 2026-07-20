import {
  getAllSourceArtifactProfiles,
  getSourceArtifactProfile,
  getClientFacingProfiles,
} from "../source-artifact-profiles";
import {
  scanForBannedTerms,
  runDocumentQA,
  buildLanguagePolicyBlock,
  appendLanguagePolicyBlock,
  resolveArtifactFormat,
} from "../source-documentation-standards";

// ── 1. Profile registry ───────────────────────────────────────────────────────

describe("Profile registry", () => {
  it("has all 40 artifact codes registered", () => {
    const profiles = getAllSourceArtifactProfiles();
    expect(profiles).toHaveLength(40);
    const codes = profiles.map((p) => p.id);
    expect(codes).toContain("d01");
    expect(codes).toContain("d33");
    expect(codes).toContain("dx7");
  });

  it("every profile has humanTitle and decisionPurpose", () => {
    for (const p of getAllSourceArtifactProfiles()) {
      expect(p.humanTitle.length).toBeGreaterThan(0);
      expect(p.decisionPurpose.length).toBeGreaterThan(0);
    }
  });

  it("every profile has riskDepth and readerMode", () => {
    for (const p of getAllSourceArtifactProfiles()) {
      expect(p.riskDepth).toBeDefined();
      expect(p.readerMode).toBeDefined();
    }
  });

  it("no profile has maxWords, maxSlides, or maxSections", () => {
    for (const p of getAllSourceArtifactProfiles()) {
      expect(Object.hasOwn(p, "maxWords")).toBe(false);
      expect(Object.hasOwn(p, "maxSlides")).toBe(false);
      expect(Object.hasOwn(p, "maxSections")).toBe(false);
    }
  });

  it("client-facing profiles do not allow internal labels", () => {
    for (const p of getClientFacingProfiles()) {
      expect(p.allowedInternalLabels).toBe(false);
    }
  });

  it("vendor-facing profiles (d09, d11, d22, d14) ban internal sensitivity terms", () => {
    for (const code of ["d09", "d11", "d22", "d14"]) {
      const p = getSourceArtifactProfile(code)!;
      expect(p.bannedTerms).toContain("internal sensitivity");
    }
  });

  it("d09 missingInputPolicy is block_until_complete", () => {
    expect(getSourceArtifactProfile("d09")!.missingInputPolicy).toBe(
      "block_until_complete",
    );
  });

  it("d24 is board-grade riskDepth and decision-brief readerMode", () => {
    const p = getSourceArtifactProfile("d24")!;
    expect(p.riskDepth).toBe("board-grade");
    expect(p.readerMode).toBe("decision-brief");
  });

  it("d24 default format is pptx", () => {
    expect(getSourceArtifactProfile("d24")!.defaultFormat).toBe("pptx");
  });
});

// ── 2. Banned terms scanner ───────────────────────────────────────────────────

describe("Banned terms scanner", () => {
  it("flags d-codes in client-facing content", () => {
    const result = scanForBannedTerms("See the d01 sourcing memo.", "d05");
    expect(result).toContain("d01");
  });

  it("flags AI generation language", () => {
    const result = scanForBannedTerms(
      "This was AI generated using map-reduce.",
      "d01",
    );
    expect(result.some((t) => t.toLowerCase().includes("ai generated"))).toBe(
      true,
    );
  });

  it("flags vendor sensitivity in vendor-facing profile", () => {
    const result = scanForBannedTerms(
      "Our internal sensitivity is $4.5M.",
      "d09",
    );
    expect(result).toContain("internal sensitivity");
  });

  it("does not flag normal text in internal artifact", () => {
    const result = scanForBannedTerms(
      "d02 value analysis complete. Substrate confirmed.",
      "d02",
    );
    // d02 is internal — only AI labels banned, not d-codes
    expect(result).toContain("substrate");
    expect(result).not.toContain("d02");
  });
});

// ── 3. QA gate runner ─────────────────────────────────────────────────────────

describe("QA gate runner", () => {
  it("passes for clean executive memo with decision framing and all required exhibits", () => {
    const content = `Recommendation: approve the sourcing event and authorize scope preparation.
    Decision requested: confirm the sourcing approach and authorize RFP preparation.
    Why now: incumbent contract expires Q4; cost pressure from board.
    Recommended approach: competitive RFP targeting the managed applications estate.
    What we know: estate has 180 apps; current run cost ~$12M/year.
    What remains open: application tiers and ticket volume require upload.
    Value hypothesis: $4–7M annually. Confidence band: medium.
    Next gate: lock scope boundary before RFP issue.`;
    const report = runDocumentQA({ artifactCode: "d01", content });
    expect(report.passed).toBe(true);
    expect(report.blockers).toHaveLength(0);
  });

  it("blocks when client-facing artifact contains banned terms", () => {
    const content =
      "This strategy memo references d01 and was AI generated via map-reduce.";
    const report = runDocumentQA({ artifactCode: "d01", content });
    expect(report.passed).toBe(false);
    expect(report.blockers.length).toBeGreaterThan(0);
  });

  it("blocks when vendor-facing artifact exposes internal sensitivity", () => {
    const content =
      "Our internal sensitivity is $3.5M walk-away. Vendor scorecard follows.";
    const report = runDocumentQA({ artifactCode: "d09", content });
    expect(report.passed).toBe(false);
  });

  it("does not block for length — no hard cap enforcement", () => {
    const longContent = `Recommendation: approve the sourcing strategy.
    Decision requested: authorize full RFP process.
    Why now: contract expires Q2 2027.
    Recommended approach: open competitive RFP.
    What we know: 180 applications, $12M run cost.
    What remains open: ticket volume data.
    Value hypothesis: $4–7M annually.
    Next gate: scope boundary locked.
    ${"Detailed analysis of current state and vendor landscape. ".repeat(200)}`;
    const report = runDocumentQA({ artifactCode: "d01", content: longContent });
    const lengthBlocker = report.blockers.find(
      (b) =>
        b.toLowerCase().includes("word count") ||
        b.toLowerCase().includes("length"),
    );
    expect(lengthBlocker).toBeUndefined();
  });

  it("passes for internal artifact regardless of internal labels", () => {
    const content = `Internal record: d02 approved 2026-06-21.
    Value range: $4–7M.
    Levers: run cost reduction and tower consolidation.
    Confidence band: medium.
    Sensitivity floor: $3.5M.
    Evidence basis: application inventory and benchmark data.`;
    const report = runDocumentQA({ artifactCode: "d02", content });
    expect(report.passed).toBe(true);
    expect(report.blockers).toHaveLength(0);
  });
});

// ── 4. New quality gates ──────────────────────────────────────────────────────

describe("Human consultant voice gate", () => {
  it("warns when generic template language found", () => {
    const content = `The purpose of this document is to outline the sourcing approach.
    Recommendation: approve the sourcing event. Decision requested: authorize scope.
    Why now: contract expiry. Recommended approach: competitive RFP.
    What we know: 180 apps. What remains open: ticket volume.
    Value hypothesis: $4–7M. Next gate: scope locked.`;
    const report = runDocumentQA({ artifactCode: "d01", content });
    const voiceWarning = report.warnings.find((w) =>
      w.includes("Human consultant voice"),
    );
    expect(voiceWarning).toBeDefined();
    // Warning only, not a blocker
    expect(report.passed).toBe(true);
  });

  it("passes when no generic template filler is present", () => {
    const content = `Recommendation: approve the sourcing event and authorize scope preparation.
    Decision requested: authorize RFP preparation.
    Why now: incumbent contract expires Q4.
    Recommended approach: competitive RFP targeting the managed applications estate.
    What we know: 180 apps at $12M/year.
    What remains open: ticket volume and application tiers.
    Value hypothesis: $4–7M annually.
    Next gate: scope boundary locked.`;
    const report = runDocumentQA({ artifactCode: "d01", content });
    const voiceWarning = report.warnings.find((w) =>
      w.includes("Human consultant voice"),
    );
    expect(voiceWarning).toBeUndefined();
  });
});

describe("Exhibit interpretation gate", () => {
  it("warns when table-like content has no interpretation", () => {
    const content = `Recommendation: approve the award. Decision requested: vendor selection.
    Why now: contract expiry Q1 2027. Recommended approach: select Vendor A.
    What we know: evaluation complete. What remains open: contract terms.
    Value hypothesis: $5M. Next gate: contract execution.

    | Vendor | Price | Score |
    | Vendor A | $8M | 87 |
    | Vendor B | $9M | 82 |`;
    const report = runDocumentQA({ artifactCode: "d01", content });
    const exhibitWarning = report.warnings.find((w) =>
      w.includes("Exhibit interpretation"),
    );
    expect(exhibitWarning).toBeDefined();
  });

  it("passes when table has 'what this means' interpretation", () => {
    const content = `Recommendation: approve the award. Decision requested: vendor selection.
    Why now: contract expiry. Recommended approach: select Vendor A.
    What we know: evaluation complete. What remains open: contract terms.
    Value hypothesis: $5M. Next gate: contract execution.

    | Vendor | Price | Score |
    | Vendor A | $8M | 87 |
    | Vendor B | $9M | 82 |

    What this means for the decision: Vendor A leads on both price and quality.`;
    const report = runDocumentQA({ artifactCode: "d01", content });
    const exhibitWarning = report.warnings.find((w) =>
      w.includes("Exhibit interpretation"),
    );
    expect(exhibitWarning).toBeUndefined();
  });
});

// ── 5. Language policy block ──────────────────────────────────────────────────

describe("Language policy block", () => {
  it("includes decision purpose and risk depth for client-facing artifact", () => {
    const block = buildLanguagePolicyBlock("d01");
    expect(block).toContain("Approve the sourcing event");
    expect(block).toContain("high");
    expect(block).toContain("executive-narrative");
  });

  it("includes banned terms list for client-facing artifact", () => {
    const block = buildLanguagePolicyBlock("d01");
    expect(block).toContain("AI generated");
  });

  it("includes board-grade depth note for d24", () => {
    const block = buildLanguagePolicyBlock("d24");
    expect(block).toContain("board-grade");
    expect(block).toContain("Do not shorten artificially");
  });

  it("returns internal artifact note for non-client-facing", () => {
    const block = buildLanguagePolicyBlock("d02");
    expect(block).toContain("internal working artifact");
    expect(block).toContain("Value Target Brief");
  });

  it("includes quality standard language about consultant voice", () => {
    const block = buildLanguagePolicyBlock("d05");
    expect(block).toContain("senior sourcing consultant");
    expect(block).toContain("What this means for the decision");
  });
});

describe("appendLanguagePolicyBlock (generation prompt path)", () => {
  it("appends artifact-specific requirements onto the base prompt without altering it", () => {
    const base = "You are drafting the Value Target Brief. Do the thing.";
    const result = appendLanguagePolicyBlock(base, "d02");

    expect(result.startsWith(base)).toBe(true);
    expect(result).toContain("internal working artifact");
    expect(result).toContain("Value Target Brief");
  });

  it("carries the artifact's own decision purpose and risk depth into the prompt, not a generic default", () => {
    const d01Result = appendLanguagePolicyBlock("BASE", "d01");
    const d24Result = appendLanguagePolicyBlock("BASE", "d24");

    expect(d01Result).toContain("Approve the sourcing event");
    expect(d01Result).toContain("executive-narrative");
    expect(d24Result).toContain("board-grade");
    expect(d24Result).not.toContain("Approve the sourcing event");
  });

  it("does not leak D09's RFP-evidence-coverage-map language into a non-RFP artifact's prompt", () => {
    // d01 legitimately mentions "RFP" in its own decision purpose (it
    // authorizes RFP preparation) — that's real, artifact-specific content,
    // not a leak. What must never appear is the D09-specific evidence
    // coverage-map machinery from quality-review.ts's buildSourceQualitySourceContext.
    const result = appendLanguagePolicyBlock("BASE", "d01");
    expect(result).toContain("RFP preparation");
    expect(result).not.toContain("D09 RFP evidence coverage semantics");
    expect(result).not.toContain("normalized from uploaded D09 coverage map");
  });

  it("includes the banned-terms prevention instruction for a client-facing artifact, complementing the deterministic backstop scan", () => {
    const result = appendLanguagePolicyBlock("BASE", "d01");
    expect(result).toContain("Do not use any of these terms in the main body");
    // The backstop scan (scanForBannedTerms) is a separate, independent
    // mechanism — this instruction is prevention at generation time, not a
    // replacement for the post-generation deterministic scan.
    expect(scanForBannedTerms("This mentions d09.", "d01")).toContain("d09");
  });

  it("returns the base prompt unchanged for an unregistered artifact code", () => {
    const base = "Unmodified base prompt.";
    expect(appendLanguagePolicyBlock(base, "not-a-real-code")).toBe(base);
  });
});

// ── 6. Format routing ─────────────────────────────────────────────────────────

describe("Format routing", () => {
  it("returns default format when no format requested", () => {
    expect(resolveArtifactFormat("d01")).toBe("docx");
    expect(resolveArtifactFormat("d09")).toBe("docx");
    expect(resolveArtifactFormat("d24")).toBe("pptx");
  });

  it("allows secondary formats", () => {
    expect(resolveArtifactFormat("d24", "docx")).toBe("docx");
  });

  it("falls back to default for disallowed format", () => {
    expect(resolveArtifactFormat("d01", "pptx")).toBe("docx");
  });
});

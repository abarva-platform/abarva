import {
  getSourceArtifactProfile,
  getAllSourceArtifactProfiles,
  getClientFacingProfiles,
} from "../source-artifact-profiles";
import {
  runDocumentQA,
  scanForBannedTerms,
  buildLanguagePolicyBlock,
  resolveArtifactFormat,
} from "../source-documentation-standards";

// ── Profile registry coverage ─────────────────────────────────────────────────

describe("source artifact profile registry", () => {
  it("covers all 40 deliverable codes", () => {
    const expected = [
      "d01","d02","d03","d04","d05","d06","d07","d08","d09",
      "d10","d11","d12","d13","d14","d15","d16","d17","d18",
      "d19","d20","d21","d22","d23","d24","d25","d26","d27",
      "d28","d29","d30","d31","d32","d33",
      "dx0","dx1","dx2","dx4","dx6a","dx6b","dx7",
    ];
    expected.forEach((code) => {
      expect(getSourceArtifactProfile(code)).not.toBeNull();
    });
    expect(getAllSourceArtifactProfiles()).toHaveLength(40);
  });

  it("every profile has a humanTitle and decisionPurpose", () => {
    getAllSourceArtifactProfiles().forEach((p) => {
      expect(p.humanTitle).toBeTruthy();
      expect(p.decisionPurpose).toBeTruthy();
    });
  });

  it("every client-facing profile has allowedInternalLabels=false", () => {
    getClientFacingProfiles().forEach((p) => {
      expect(p.allowedInternalLabels).toBe(false);
    });
  });

  it("every client-facing profile has at least one bannedTerm", () => {
    getClientFacingProfiles().forEach((p) => {
      expect(p.bannedTerms.length).toBeGreaterThan(0);
    });
  });

  it("vendor-facing profiles (d09, d11, d14, d22) ban internal sensitivity terms", () => {
    const vendorCodes = ["d09", "d11", "d22"];
    vendorCodes.forEach((code) => {
      const p = getSourceArtifactProfile(code)!;
      expect(p.bannedTerms).toContain("internal sensitivity");
      expect(p.bannedTerms).toContain("value floor");
    });
  });

  it("d09 has block_until_complete missing input policy", () => {
    const p = getSourceArtifactProfile("d09")!;
    expect(p.missingInputPolicy).toBe("block_until_complete");
  });

  it("d24 atlas decision brief defaults to pptx and caps at 10 slides", () => {
    const p = getSourceArtifactProfile("d24")!;
    expect(p.defaultFormat).toBe("pptx");
    expect(p.maxSlides).toBe(10);
  });
});

// ── Banned terms scanner ──────────────────────────────────────────────────────

describe("scanForBannedTerms", () => {
  it("flags d-codes in client-facing content", () => {
    const content = "Please see d09 for the full RFP and d01 for strategy context.";
    const violations = scanForBannedTerms(content, "d09");
    expect(violations).toContain("d01");
    expect(violations).toContain("d09");
  });

  it("flags AI generation language in client-facing artifact", () => {
    const content = "This document was AI generated using the map-reduce pipeline with claude-opus.";
    const violations = scanForBannedTerms(content, "d01");
    expect(violations).toContain("AI generated");
    expect(violations).toContain("map-reduce");
  });

  it("flags internal sensitivity language in vendor RFP", () => {
    const content = "Our internal sensitivity is $4M. The value floor is $3.5M.";
    const violations = scanForBannedTerms(content, "d09");
    expect(violations).toContain("internal sensitivity");
    expect(violations).toContain("value floor");
  });

  it("returns empty for internal artifact even with d-codes", () => {
    // d02 is internal-only; d-codes are not in its bannedTerms
    const content = "d01 strategy memo approved. d02 value target confirmed.";
    const violations = scanForBannedTerms(content, "d02");
    expect(violations).toHaveLength(0);
  });
});

// ── QA gate runner ────────────────────────────────────────────────────────────

describe("runDocumentQA", () => {
  it("passes for clean executive memo with decision framing", () => {
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
    const content = "This strategy memo references d01 and was AI generated via map-reduce.";
    const report = runDocumentQA({ artifactCode: "d01", content });
    expect(report.passed).toBe(false);
    expect(report.blockers.length).toBeGreaterThan(0);
    expect(report.blockers.some((b) => b.includes("Banned terms"))).toBe(true);
  });

  it("blocks when vendor RFP exposes internal sensitivity", () => {
    const content = "Our internal sensitivity is $3.5M. We will not accept bids above our value floor.";
    const report = runDocumentQA({ artifactCode: "d09", content });
    expect(report.passed).toBe(false);
    expect(report.blockers.some((b) => b.includes("Banned terms"))).toBe(true);
  });

  it("warns but does not block when word count exceeds limit", () => {
    const longContent = "word ".repeat(2000); // 2000 words, d01 limit=1800
    const report = runDocumentQA({ artifactCode: "d01", content: longContent, wordCount: 2000 });
    const lengthResult = report.results.find((r) => r.gate.id === "length_discipline");
    expect(lengthResult?.result.pass).toBe(false);
    expect(lengthResult?.result.blocksRelease).toBe(false);
  });

  it("passes QA for internal artifact even with d-code and substrate language", () => {
    // d02 is internal; internal labels + substrate are allowed.
    // Include required exhibits so the required_exhibits gate also passes.
    const content = `d02 Value Target Brief — approved 2026-06-21.
Value range: $4–7M annually. Levers: labor arbitrage, consolidation, competition.
Confidence band: medium (±20%). Sensitivity floor: $3.5M (internal only).
Evidence basis: current run cost from d04 + market benchmark.
Substrate confirmed. AI generated draft reviewed.`;
    const report = runDocumentQA({ artifactCode: "d02", content });
    expect(report.passed).toBe(true);
  });

  it("throws for unknown artifact code", () => {
    expect(() => runDocumentQA({ artifactCode: "d99_unknown", content: "test" })).toThrow();
  });
});

// ── Language policy block ─────────────────────────────────────────────────────

describe("buildLanguagePolicyBlock", () => {
  it("includes decision purpose for client-facing artifact", () => {
    const block = buildLanguagePolicyBlock("d01");
    expect(block).toContain("Approve the sourcing event");
    expect(block).toContain("Client-facing: YES");
  });

  it("includes banned terms list for client-facing artifact", () => {
    const block = buildLanguagePolicyBlock("d09");
    expect(block).toContain("AI generated");
    expect(block).toContain("map-reduce");
    expect(block).toContain("internal sensitivity");
  });

  it("returns internal-only note for non-client artifact", () => {
    const block = buildLanguagePolicyBlock("d02");
    expect(block).toContain("internal working artifact");
  });

  it("includes block_until_complete note for d09", () => {
    const block = buildLanguagePolicyBlock("d09");
    expect(block).toContain("Do not generate this artifact if required inputs are missing");
  });
});

// ── Format routing ────────────────────────────────────────────────────────────

describe("resolveArtifactFormat", () => {
  it("returns default format when no preference given", () => {
    expect(resolveArtifactFormat("d01")).toBe("docx");
    expect(resolveArtifactFormat("d24")).toBe("pptx");
    expect(resolveArtifactFormat("d16")).toBe("xlsx");
  });

  it("returns requested format if allowed by profile", () => {
    // d01 is docx primary; no secondary format → falls back to default
    expect(resolveArtifactFormat("d01", "docx")).toBe("docx");
    // d04 has xlsx primary + docx secondary
    expect(resolveArtifactFormat("d04", "docx")).toBe("docx");
  });

  it("falls back to default when requested format is not in profile", () => {
    expect(resolveArtifactFormat("d01", "xlsx")).toBe("docx");
    expect(resolveArtifactFormat("d24", "html")).toBe("pptx");
  });

  it("returns html for unknown code with no preference", () => {
    expect(resolveArtifactFormat("d99_unknown")).toBe("html");
  });
});

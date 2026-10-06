import { getArtifactBrief } from "../artifact-brief-registry";
import {
  extractExcludedNumericClaims,
  findExcludedNumericClaims,
  redactExcludedNumericClaims,
} from "../excluded-numeric-claims";
import { buildPassPrompt } from "../prompt-builder";
import { validateDeliverableQuality } from "../quality-validator";
import { amsRfpRequest, goodDocument } from "../__fixtures__/ams-rfp";
import type {
  DeliverableIntelligenceRequest,
  GovernedEvidenceItem,
  RenderableSection,
} from "../types";

const evidence: GovernedEvidenceItem[] = [
  {
    citationNumber: 11,
    label: "Finance value hypothesis",
    statement:
      "The $8.0M annual value is an unsupported hypothesis; Finance-validated value is $0. External 12-18% productivity benchmark is unverified and excluded.",
    evidenceFamily: "finance_value_hypothesis",
    confidence: "low",
    disclosureTier: "internal_only",
    provenanceRef: "test-evidence-11",
  },
  {
    citationNumber: 12,
    label: "Operating baseline",
    statement:
      "Annual contact volume is 15.97M; contact-center staffing is 3,483; current adoption is 34%.",
    evidenceFamily: "operating_baseline",
    confidence: "high",
    disclosureTier: "internal_only",
    provenanceRef: "test-evidence-12",
  },
];

const prohibitedNumericClaims = extractExcludedNumericClaims(evidence);

function request(
  overrides: Partial<DeliverableIntelligenceRequest> = {},
): DeliverableIntelligenceRequest {
  return amsRfpRequest({
    module: "moves",
    deliverableType: "discovery_report",
    governedEvidenceBundle: evidence,
    prohibitedNumericClaims,
    requiredEvidenceSignals: [
      {
        key: "finance_value_hypothesis",
        citationNumber: 11,
        label: evidence[0]!.label,
        statement: evidence[0]!.statement,
      },
    ],
    ...overrides,
  });
}

function section(bodyMarkdown: string): RenderableSection {
  return {
    key: "excluded_claim_test",
    title: "Evidence review",
    bodyMarkdown,
    rawBodyMarkdown: bodyMarkdown,
    groundingMode: "governed_facts",
    citationsUsed: [11],
  };
}

describe("explicitly excluded numeric claims", () => {
  it("extracts only the unsupported value and excluded benchmark, not the validated zero or operating metrics", () => {
    expect(prohibitedNumericClaims).toHaveLength(2);
    expect(prohibitedNumericClaims.map((claim) => claim.kind)).toEqual([
      "currency",
      "percentage",
    ]);
    expect(prohibitedNumericClaims.map((claim) => claim.sourceValue)).toEqual([
      "$8.0M",
      "12-18%",
    ]);
  });

  it("does not classify a nearby validated value as excluded", () => {
    const sameClause = extractExcludedNumericClaims([
      {
        ...evidence[0]!,
        statement:
          "The $8.0M annual value is an unsupported hypothesis, while Finance-validated value is $0.",
      },
    ]);
    expect(sameClause.map((claim) => claim.sourceValue)).toEqual(["$8.0M"]);
  });

  it("redacts excluded figures in every model pass while preserving status and safe evidence", () => {
    const req = request();
    const prompt = buildPassPrompt("full_draft", {
      req,
      brief: getArtifactBrief(req),
      evidence: req.governedEvidenceBundle,
    });
    const fullPrompt = `${prompt.system}\n${prompt.user}`;
    expect(fullPrompt).not.toContain("$8.0M");
    expect(fullPrompt).not.toContain("12-18%");
    expect(fullPrompt).toContain("unsupported hypothesis");
    expect(fullPrompt).toContain("Finance-validated value is $0");
    expect(fullPrompt).toContain("15.97M");
    expect(fullPrompt).toContain("34%");
    expect(fullPrompt).toContain("[excluded numeric value omitted]");
  });

  it("redacts a leak carried forward in a prior generated draft", () => {
    const req = request();
    const prompt = buildPassPrompt("red_team", {
      req,
      brief: getArtifactBrief(req),
      evidence: req.governedEvidenceBundle,
      draftMarkdown:
        "The annual savings hypothesis is $8M [11], while the external benchmark is twelve to eighteen percent [11].",
    });
    expect(prompt.user).not.toContain("$8M");
    expect(prompt.user).not.toMatch(/twelve to eighteen percent/i);
    expect(prompt.user).toContain("[excluded numeric value omitted]");
  });

  it.each([
    "The unsupported annual savings hypothesis is $8M [11].",
    "Finance has not validated eight million dollars of annual benefit [11].",
    "The external benchmark range of 12% to 18% is excluded [11].",
    "Twelve to eighteen percent remains an excluded external productivity benchmark [11].",
  ])("blocks an equivalent excluded claim even when cited: %s", (text) => {
    expect(findExcludedNumericClaims(text, prohibitedNumericClaims)).toHaveLength(1);
  });

  it("blocks an excluded value placed in a table, recommendation, or slide notes", () => {
    const req = request();
    const base = goodDocument();
    const result = validateDeliverableQuality(
      {
        ...base,
        generatedSections: [...base.generatedSections, section("No benefit is finance-validated.")],
        tables: [
          ...base.tables,
          {
            key: "value",
            title: "Value review",
            columns: ["Claim", "Status"],
            rows: [["$8,000,000 annual savings", "Excluded"], ["12–18% benchmark", "Excluded"]],
            targetFormat: "docx",
          },
        ],
        recommendation: "Do not use the excluded figure.",
        deckSlides: [
          {
            governingMessage: "Value remains unvalidated.",
            speakerNotes: "The eight million dollar estimate is an excluded hypothesis.",
          },
        ],
      },
      req,
    );
    expect(result.blockers.join(" ")).toMatch(/explicitly excluded numeric claim/i);
  });

  it("allows the validated zero and distinct evidence-backed baseline metrics", () => {
    const text =
      "Finance-validated benefit remains $0 [11]. Annual contacts are 15.97M [12], staffing is 3,483 [12], and adoption is 34% [12].";
    expect(findExcludedNumericClaims(text, prohibitedNumericClaims)).toHaveLength(0);
    const blockers = validateDeliverableQuality(
        {
          ...goodDocument(),
          generatedSections: [
            ...goodDocument().generatedSections,
            section(text),
          ],
        },
        request(),
      ).blockers;
    expect(blockers.some((blocker) => /explicitly excluded numeric claim/i.test(blocker))).toBe(false);
  });

  it("redacts without changing unrelated same-source figures", () => {
    const source = "Annual value $8.0M is unsupported; annual contacts are 8M.";
    const redacted = redactExcludedNumericClaims(source, prohibitedNumericClaims);
    expect(redacted).toContain("Annual value [excluded numeric value omitted] is unsupported");
    expect(redacted).toContain("annual contacts are 8M");
  });
});

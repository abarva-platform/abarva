import { readFileSync } from "node:fs";
import sharp from "sharp";
import corpus from "../__fixtures__/purpose-r3-claims.json";
import {
  classifyPurposeClaims,
  type PurposeClaimEvidence,
} from "../purpose-claim-classifier";
import {
  collapsePurposeCitations,
  purposeCitationIds,
} from "../purpose-citations";
import { balancedPurposeTitle } from "../purpose-page-renderer";
import { purposeFixture } from "../__fixtures__/purpose-pages";
import {
  planPurposePages,
  purposeBodyHeight,
  purposeRowHeight,
  purposeTableHeaderHeight,
} from "../purpose-page-plan";
import {
  validatePurposeText,
  validatePurposeStory,
} from "../purpose-story-contract";

describe("R4 claim and export controls", () => {
  it.each(corpus)("classifies $sentence", (row) => {
    const result = classifyPurposeClaims(
      row.sentence,
      (row.evidence || []) as PurposeClaimEvidence[],
      { completeInputBundle: row.complete },
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => r.classification === row.class)).toBe(true);
    expect(result.every((r) => r.supported)).toBe(row.expected);
  });
  it("rejects a contradicted bundle gap, incomplete search and ambiguous review", () => {
    const text = "No meeting rhythm is recorded in the supplied inputs.";
    expect(
      classifyPurposeClaims(
        text,
        [{ citationNumber: 1, statement: "Meeting rhythm: weekly" }],
        { completeInputBundle: true },
      )[0]?.supported,
    ).toBe(false);
    expect(classifyPurposeClaims(text, [])[0]?.supported).toBe(false);
    expect(
      classifyPurposeClaims(
        "None of these is yet confirmed by a product reviewer.",
        [{ citationNumber: 1, statement: "Review", approvalState: "approved" }],
        { completeInputBundle: true },
      )[0]?.supported,
    ).toBe(false);
  });
  it("does not use a conditional preface to excuse an unsupported factual claim", () => {
    expect(
      classifyPurposeClaims("It commits no implementation funding.", [])[0]
        ?.classification,
    ).toBe("draft_status");
    expect(
      classifyPurposeClaims(
        "It previously committed no implementation funding.",
        [],
      )[0]?.supported,
    ).toBe(false);
    const pending = [
      {
        citationNumber: 1,
        statement: "Proposed input",
        approvalState: "pending" as const,
      },
    ];
    const sentence =
      "No approval has been recorded against the inputs supplied, which are marked pending.";
    expect(
      classifyPurposeClaims(sentence, pending, { completeInputBundle: true })[0]
        ?.supported,
    ).toBe(true);
    expect(
      classifyPurposeClaims(
        sentence,
        [{ ...pending[0]!, approvalState: "approved" }],
        { completeInputBundle: true },
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        "If approved, source teams cannot reliably distinguish expired coverage.",
        [],
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        "This draft records no signature; no baseline has ever been collected.",
        [],
      ).map((r) => r.supported),
    ).toEqual([true, false]);
  });
  it("supports a factual claim only with the cited local source span", () => {
    const claim = "Routing lacks a shared accountable rule [5].";
    expect(
      classifyPurposeClaims(claim, [
        {
          citationNumber: 5,
          statement: "Routing lacks a shared accountable rule.",
        },
      ])[0]?.supported,
    ).toBe(true);
    expect(
      classifyPurposeClaims(claim, [
        {
          citationNumber: 6,
          statement: "Routing lacks a shared accountable rule.",
        },
      ])[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims("No baseline exists [1].", [
        {
          citationNumber: 1,
          statement: "The baseline exists with no personal identifiers.",
        },
      ])[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims("No patient baseline exists [1].", [
        {
          citationNumber: 1,
          statement: "No patient identifiers exist in the approved baseline.",
        },
      ])[0]?.supported,
    ).toBe(false);
  });
  it("uses the visible page citation without borrowing unrelated page sources", () => {
    const doc = purposeFixture();
    doc.deliverableType = "discovery_report";
    doc.deckSlides![0]!.governingMessage =
      "Routing lacks a shared accountable rule";
    doc.deckSlides![0]!.citationsUsed = [1];
    const evidence = [
      {
        citationNumber: 1,
        statement: "Routing lacks a shared accountable rule.",
      },
    ];
    const absenceErrors = () =>
      validatePurposeStory(doc, evidence).filter((e) =>
        e.includes("unsupported_absence:Routing"),
      );
    expect(absenceErrors()).toEqual([]);
    doc.deckSlides![0]!.citationsUsed = [2];
    expect(absenceErrors()).toHaveLength(1);
  });
  it("keeps cited quotations intact across lists and sentence boundaries", () => {
    const fact =
      "Source teams cannot reliably distinguish expired coverage, authorization mismatch, administrative coding errors and missing attachments.";
    const evidence = [{ citationNumber: 1, statement: fact }];
    expect(
      classifyPurposeClaims(`The source states: "${fact}" [1]`, evidence).every(
        (r) => r.supported,
      ),
    ).toBe(true);
    expect(
      classifyPurposeClaims(`The source states: "${fact}" [2]`, evidence).every(
        (r) => r.supported,
      ),
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        `The source states: "${fact}" [1]; no baseline has ever been collected.`,
        evidence,
      ).map((r) => r.supported),
    ).toEqual([true, false]);
  });
  it("classifies coordinated decision limits and checks a cited data restriction locally", () => {
    expect(
      classifyPurposeClaims(
        "It authorises no build, no pilot cohort, no interface access and no benefit target.",
        [],
      ).every((r) => r.supported && r.classification === "draft_status"),
    ).toBe(true);
    expect(
      classifyPurposeClaims("No benefit may be derived from either.", [])[0]
        ?.classification,
    ).toBe("decision_condition");
    expect(
      classifyPurposeClaims(
        "Boundary: no savings, ROI or workforce claim without a validated baseline.",
        [],
      )[0]?.supported,
    ).toBe(true);
    const evidence = [
      { citationNumber: 2, statement: "Use only package files. No PHI." },
    ];
    expect(
      classifyPurposeClaims(
        "Discovery uses only supplied package files, with no PHI [2].",
        evidence,
      )[0]?.supported,
    ).toBe(true);
    expect(
      classifyPurposeClaims(
        "Discovery uses only supplied package files, with no PHI [3].",
        evidence,
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        "It authorises no build; no pilot baseline has ever been collected.",
        [],
      ).map((r) => r.supported),
    ).toEqual([true, false]);
    expect(
      classifyPurposeClaims(
        "Cohort-level effort attribution is not established in this bundle.",
        [],
        { completeInputBundle: true },
      )[0]?.supported,
    ).toBe(true);
    expect(
      classifyPurposeClaims(
        "Cohort-level effort attribution is not established in this bundle.",
        [
          {
            citationNumber: 1,
            statement: "Cohort-level effort attribution: 40 percent.",
          },
        ],
        { completeInputBundle: true },
      )[0]?.supported,
    ).toBe(false);
  });
  it("collapses duplicates without moving sources between sentences or table cells", () => {
    expect(
      collapsePurposeCitations("Routing [5] [5] [5] [2] [5] [6] [7]"),
    ).toBe("Routing [2, 5–7]");
    expect(purposeCitationIds("[2, 5–7]")).toEqual([2, 5, 6, 7]);
    for (const invalid of ["[0]", "[7–5]", "[1–2000]", `[${"9".repeat(400)}]`])
      expect(() => purposeCitationIds(invalid)).toThrow("citation range");
    expect(collapsePurposeCitations("A [1]. B [2].")).toBe("A [1]. B [2].");
    expect(collapsePurposeCitations("A [1]; B [2].")).toBe("A; B [1, 2].");
    expect(collapsePurposeCitations("| A [1] | B [2] |")).toContain("A [1]");
  });
  it("balances a long headline without a one-word last line", () => {
    expect(
      balancedPurposeTitle(
        "The evidence supports a bounded design decision for the next phase of agent assist",
      )
        .split("\n")
        .every((l) => l.split(" ").length > 1),
    ).toBe(true);
  });
  it("rebalances an overflowing register instead of leaving a sparse tail", () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "rows",
        title: "Evidence",
        columns: ["Finding"],
        rows: Array.from({ length: 9 }, (_, i) => [`Recorded item ${i} [1]`]),
        targetFormat: "pptx",
      },
    ];
    doc.deckSlides = [
      {
        key: "rows",
        governingMessage: "Review the recorded items",
        pageIntent: {
          question: "What needs review?",
          scopeNote: "For review.",
          tableKey: "rows",
        },
      },
    ];
    const pages = planPurposePages(doc).filter((p) => p.id.startsWith("rows"));
    expect(pages).toHaveLength(2);
    expect(pages.map((p) => p.rows!.length).sort()).toEqual([4, 5]);
    for (const p of pages) {
      const used =
        purposeTableHeaderHeight(p) +
        p.rows!.reduce((n, r) => n + purposeRowHeight(p, r), 0);
      expect(used).toBeGreaterThanOrEqual(purposeBodyHeight(p) * 0.55);
      expect(used).toBeLessThanOrEqual(purposeBodyHeight(p));
    }
  });
  it("pulls a short remainder into one compact page and reserves the conclusion", () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "rows",
        title: "Evidence",
        columns: ["Finding"],
        rows: Array.from({ length: 7 }, (_, i) => [`Recorded item ${i} [1]`]),
        targetFormat: "pptx",
      },
    ];
    doc.deckSlides = [
      {
        key: "rows",
        governingMessage: "Review the recorded items",
        pageIntent: {
          question: "What needs review?",
          scopeNote: "For review.",
          tableKey: "rows",
          takeawayLabel: "Conditions",
          takeaway: "Conditions: Confirm each record.",
        },
      },
    ];
    const pages = planPurposePages(doc).filter((p) => p.id.startsWith("rows"));
    expect(pages).toHaveLength(1);
    expect(pages[0]!.rows).toHaveLength(7);
    expect(pages[0]!.takeaway).toBe("Confirm each record.");
    expect(purposeBodyHeight(pages[0]!)).toBe(3.9);
  });
  it("retains the input-approval guard without confusing an access prerequisite", () => {
    const doc = { deliverableType: "charter", sourceRegister: [] };
    const input = {
      citationNumber: 1,
      statement: "Input package",
      approvalState: "pending" as const,
    };
    expect(
      validatePurposeText("The approved input package [1].", doc as never, [
        input,
      ]),
    ).toContain("purpose_story:draft_claims_authorization");
    expect(
      validatePurposeText("The approved input package [1].", doc as never, [
        { ...input, approvalState: "approved" },
      ]),
    ).toEqual([]);
    expect(
      validatePurposeText("Confirm approved source access.", doc as never, [
        input,
      ]),
    ).toEqual([]);
    expect(
      validatePurposeText(
        "Findings draw on the approved P0 and P1 package files [1].",
        doc as never,
        [input],
      ),
    ).toContain("purpose_story:draft_claims_authorization");
    expect(
      validatePurposeText("This charter authorises Discovery.", doc as never, [
        input,
      ]),
    ).toContain("purpose_story:draft_claims_authorization");
  });
  it("distinguishes page scope from a historical absence even within a scope note", () => {
    const context = { textRole: "scope" as const };
    expect(
      classifyPurposeClaims("No approved business case is asserted.", [])[0]
        ?.supported,
    ).toBe(true);
    expect(
      classifyPurposeClaims("None is accepted or ranked.", [], context)[0]
        ?.classification,
    ).toBe("draft_status");
    expect(
      classifyPurposeClaims("None is accepted or ranked.", [])[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        "This page establishes no production readiness.",
        [],
        context,
      )[0]?.supported,
    ).toBe(true);
    expect(
      classifyPurposeClaims(
        "No baseline has ever been collected.",
        [],
        context,
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        "This page establishes no production readiness; no baseline has ever been collected.",
        [],
        context,
      ).map((r) => r.supported),
    ).toEqual([true, false]);
    expect(
      classifyPurposeClaims(
        "Workflow change is proposed, not yet confirmed [1].",
        [
          {
            citationNumber: 1,
            statement: "Workflow proposal",
            approvalState: "pending",
          },
        ],
      )[0]?.supported,
    ).toBe(true);
    expect(
      classifyPurposeClaims(
        "Workflow change is proposed, not yet confirmed [1].",
        [
          {
            citationNumber: 1,
            statement: "Workflow proposal",
            approvalState: "approved",
          },
        ],
      )[0]?.supported,
    ).toBe(false);
  });
  it("does not confuse business authorization with data-operator instructions", () => {
    const doc = { deliverableType: "charter", sourceRegister: [] };
    for (const sentence of [
      "Executive sponsor (proposed). Revenue cycle director, who owns the business outcome [1].",
      "If the sponsor approves this charter, authorization is bounded by the following conditions.",
      "Monetary claims follow the matched-comparator and no-double-count rules [1].",
    ])
      expect(validatePurposeText(sentence, doc as never, [])).toEqual([]);
    expect(
      validatePurposeText(
        "The owner reviews seed rows and approves a scoped rebind.",
        doc as never,
        [],
      ),
    ).toEqual([expect.stringContaining("operator_instructions_in_body")]);
  });
  it("keeps provenance disclosures distinct from placeholder prose and checks facts even in footers", () => {
    const doc = { deliverableType: "discovery_report", sourceRegister: [] };
    expect(
      validatePurposeText(
        "The monthly series describes the synthetic scenario; it does not demonstrate an effect.",
        doc as never,
        [],
        { textRole: "scope", syntheticInputBundle: true },
      ),
    ).toEqual([]);
    expect(
      validatePurposeText("Synthetic organization", doc as never, []),
    ).toEqual([expect.stringContaining("classification_in_body")]);
    expect(
      validatePurposeText(
        "No baseline has ever been collected.",
        doc as never,
        [],
        { textRole: "disclosure" },
      ),
    ).toEqual([expect.stringContaining("unsupported_absence")]);
  });
  it("preserves the quantity in a cited negative claim", () => {
    const evidence = [
      {
        citationNumber: 1,
        statement: "Claims timestamps missing in 3 of 20 samples",
      },
    ];
    expect(
      classifyPurposeClaims(
        "Claims timestamps missing in 4 of 20 samples [1].",
        evidence,
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        "Claims timestamps missing in 3 of 20 samples.    [1]",
        evidence,
      )[0]?.supported,
    ).toBe(true);
  });
  it.each(["light", "dark"])(
    "keeps transparent clearance around the %s print logo",
    async (theme) => {
      const { data, info } = await sharp(
        readFileSync(
          `public/brand/nexus/abarva-nexus-navbar-${theme}-print.png`,
        ),
      )
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      expect(info.width).toBe(2560);
      expect(info.height).toBe(342);
      let first = info.height,
        last = -1;
      for (let y = 0; y < info.height; y++)
        for (let x = 0; x < info.width; x++)
          if (data[(y * info.width + x) * 4 + 3]) {
            first = Math.min(first, y);
            last = Math.max(last, y);
          }
      expect(first).toBeGreaterThan(0);
      expect(last).toBeLessThan(info.height - 1);
      expect(last).toBeGreaterThan(first);
      for (let x = 0; x < info.width; x++) {
        expect(data[x * 4 + 3]).toBe(0);
        expect(data[((info.height - 1) * info.width + x) * 4 + 3]).toBe(0);
      }
    },
  );
});

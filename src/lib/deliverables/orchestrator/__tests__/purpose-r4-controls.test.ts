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
import {
  assertPurposeDateSlotUse,
  purposeSourceTrailingUnit,
  assertPurposeUnitSlotUse,
  purposeSourceDatePart,
  stripPurposeSourceVersionReferences,
  purposeSourceRecordReferences,
  stripPurposeSourceRecordReferences,
} from "../purpose-number-display";
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
  it("does not give the offline writer limits that contradict the phase contract", () => {
    const harness = readFileSync(
      "scripts/deliverables/proof/purpose-fresh-source.ts",
      "utf8",
    );
    expect(harness).toContain(
      "Title and scope-note limits are exclusively defined by phaseContract",
    );
    expect(harness).not.toContain("assertion under ninety characters");
    expect(harness).not.toContain("under one hundred and forty characters");
  });
  it("classifies rendered recommendation bullets rather than Markdown delimiters", () => {
    const doc = purposeFixture();
    doc.generatedSections = [];
    doc.tables = [];
    doc.deckSlides = [];
    doc.exhibits = [];
    doc.nextActions = [];
    doc.actionRegister = [];
    doc.recommendation =
      "- **Hold if** the approval record is not yet available.\n- **Proceed if** the baseline has been reviewed.";
    expect(
      validatePurposeStory(doc, []).filter((e) =>
        e.includes("unsupported_absence"),
      ),
    ).toEqual([]);
    doc.recommendation = "- **No evidence was ever collected.**";
    expect(
      validatePurposeStory(doc, []).some((e) =>
        e.includes("unsupported_absence"),
      ),
    ).toBe(true);
    doc.recommendation =
      "- **Hold if** the baseline is missing, and no responses were ever received.";
    expect(
      validatePurposeStory(doc, []).some((e) =>
        e.includes("unsupported_absence"),
      ),
    ).toBe(true);
  });
  it("distinguishes declared record IDs from measured numbers", () => {
    const source =
      'row 1: ["control_id","restriction","cost"]\nrow 2: ["CTRL-01","Review before release","$100"]\nrow 3: ["CTRL-05","Human confirmation","$200"]';
    const references = purposeSourceRecordReferences([source]);
    expect(references).toEqual([
      { identifier: "CTRL-01", source: 1, locator: "extracted line 2" },
      { identifier: "CTRL-05", source: 1, locator: "extracted line 3" },
    ]);
    expect(
      stripPurposeSourceRecordReferences(
        "CTRL-01 and CTRL-05 cost $100",
        references,
      ),
    ).toBe(" and  cost $100");
  });

  it.each(["CTRL-99", "CTRL-010", "CTRL-01.2", "xCTRL-01", "$100", "100"])(
    "does not exempt unknown, partial or numeric reference %s",
    (value) => {
      const references = purposeSourceRecordReferences([
        'row 1: ["id"]\nrow 2: ["CTRL-01"]',
      ]);
      expect(stripPurposeSourceRecordReferences(value, references)).toBe(value);
    },
  );

  it("does not declare identifiers from prose or non-ID columns", () => {
    expect(
      purposeSourceRecordReferences([
        "Mention CTRL-01 in a note.",
        'row 1: ["description","amount"]\nrow 2: ["CTRL-01","$100"]',
        'row 1: ["id"]\nrow 2: ["100"]',
      ]),
    ).toEqual([]);
  });

  it("does not carry an ID column into another worksheet", () => {
    const refs = purposeSourceRecordReferences([
      'Worksheet Controls\nrow 1: ["control_id"]\nrow 2: ["CTRL-01"]\nWorksheet Notes\nrow 1: ["description"]\nrow 2: ["CTRL-02"]',
    ]);
    expect(refs.map((r) => r.identifier)).toEqual(["CTRL-01"]);
  });
  it("checks proposal confirmation against approval state without allowing an independent gap", () => {
    const text =
      "The change record contains a proposal, not yet confirmed, that business owns adoption [1].";
    const pending: PurposeClaimEvidence[] = [
      {
        citationNumber: 1,
        label: "Proposed changes",
        approvalState: "pending",
        statement: "Adoption ownership is proposed.",
      },
    ];
    expect(
      classifyPurposeClaims(text, pending).every((claim) => claim.supported),
    ).toBe(true);
    expect(
      classifyPurposeClaims(text, [
        { ...pending[0]!, approvalState: "approved" },
      ]).some((claim) => !claim.supported),
    ).toBe(true);
    expect(
      classifyPurposeClaims(
        "The sources are missing and the proposal, not yet confirmed, names an owner [1].",
        pending,
      ).some((claim) => !claim.supported),
    ).toBe(true);
  });
  it("distinguishes a required workforce assumption from a historical assertion", () => {
    expect(
      classifyPurposeClaims(
        "Required: decision-rights record keeping no role-elimination assumption [1].",
        [],
      ).every((claim) => claim.supported),
    ).toBe(true);
    expect(
      classifyPurposeClaims(
        "No role elimination occurred previously [1].",
        [],
      ).some((claim) => !claim.supported),
    ).toBe(true);
    expect(
      classifyPurposeClaims(
        "Required: no baseline and no role-elimination assumption [1].",
        [],
      ).some((claim) => !claim.supported),
    ).toBe(true);
  });
  it("keeps an explicit calendar-duration unit attached to its source slot", () => {
    const line = "The calculation uses 2 whole months of lag.";
    expect(purposeSourceTrailingUnit(line, line.indexOf("2"), "2")).toBe(
      "month",
    );
    expect(
      purposeSourceTrailingUnit("2 records in six months", 0, "2"),
    ).toBeUndefined();
    const slots = { lag: { trailingUnit: "month" } };
    for (const text of ["Lag: {lag} whole months [1].", "Months: {lag} [1]."])
      expect(() => assertPurposeUnitSlotUse(text, slots)).not.toThrow();
    for (const text of [
      "Lag: {lag} [1].",
      "Lag: {lag} days [1].",
      "A monthly review uses lag {lag} [1].",
    ])
      expect(() => assertPurposeUnitSlotUse(text, slots)).toThrow(
        "unit_missing",
      );
  });
  it("allows scoped non-conclusions without asserting enterprise absence", () => {
    for (const text of [
      "No access grant is recorded here.",
      "It isolates no cause and measures no intervention.",
      "The proposals await review and none is confirmed here.",
      "None is confirmed by this page.",
      "This page compares routes; it reports no access grant, no selected route and no approved architecture.",
      "This page compares routes; it selects, costs and approves none of them.",
    ]) {
      const claims = classifyPurposeClaims(text, [], { textRole: "scope" });
      expect(claims.length).toBeGreaterThan(0);
      expect(
        claims.every(
          (claim) => claim.classification === "draft_status" && claim.supported,
        ),
      ).toBe(true);
    }
    for (const text of [
      "No access grant was ever recorded here.",
      "The organization approves none of them.",
      "This page isolates no cause; source records are missing.",
      "This page reports no access grant; source teams have no access grant.",
      "No approved architecture.",
    ])
      expect(
        classifyPurposeClaims(text, [], { textRole: "scope" }).some(
          (claim) => !claim.supported,
        ),
      ).toBe(true);
    expect(
      classifyPurposeClaims("None is confirmed here.", [])[0]?.supported,
    ).toBe(false);
  });
  it("separates prospective value recognition from an assertion about collection history", () => {
    expect(
      classifyPurposeClaims(
        "This draft does not authorize a build and credits no benefit before incremental cash is collected against a matched comparator.",
        [],
      )[0],
    ).toMatchObject({ classification: "decision_condition", supported: true });
    for (const text of [
      "This draft credits no benefit because cash was never collected.",
      "This draft credits no benefit until cash is collected; receipts are missing.",
      "This draft previously credited no benefit before cash was collected.",
    ])
      expect(
        classifyPurposeClaims(text, []).some((claim) => !claim.supported),
      ).toBe(true);
  });
  it("exempts only exact source-declared version identifiers from the figure check", () => {
    const sources = ["Use the delivery-model-v1.2 reference for assumptions."];
    expect(
      stripPurposeSourceVersionReferences(
        "delivery-model-v1.2 costs $250.",
        sources,
      ),
    ).toBe(" costs $250.");
    for (const text of [
      "delivery-model-v1.3",
      "delivery-model-v1.20",
      "budget-250",
      "250",
      "x.delivery-model-v1.2",
      "delivery-model-v1.2-extra",
    ])
      expect(stripPurposeSourceVersionReferences(text, sources)).toBe(text);
    expect(stripPurposeSourceVersionReferences("delivery-model-v1.2", [])).toBe(
      "delivery-model-v1.2",
    );
  });
  it("recognizes measurement comparison restrictions without excusing missing-source claims", () => {
    expect(
      classifyPurposeClaims(
        "Two measures use different definitions and cannot be compared [1].",
        [],
      )[0],
    ).toMatchObject({ classification: "decision_condition", supported: true });
    for (const text of [
      "Two measures cannot be compared because source records are missing.",
      "The source team cannot provide the measures.",
      "The measures were never collected.",
    ])
      expect(classifyPurposeClaims(text, [])[0]?.supported).toBe(false);
  });
  it("treats an offered route comparison as non-selection, not evidence about past decisions", () => {
    expect(
      classifyPurposeClaims(
        "Three routes are offered for comparison and none is selected [1].",
        [],
      )[0],
    ).toMatchObject({ classification: "draft_status", supported: true });
    expect(
      classifyPurposeClaims(
        "The organization has reviewed three routes and none is selected [1].",
        [],
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims("None is selected [1].", [])[0]?.supported,
    ).toBe(false);
  });
  it("separates explicit decision instruments and if-conditions from actual business history", () => {
    expect(
      classifyPurposeClaims("This readout approves no build and no spend.", []),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          classification: "draft_status",
          supported: true,
        }),
      ]),
    );
    expect(
      classifyPurposeClaims(
        "This readout approves no build and no spend.",
        [],
      ).every((c) => c.supported),
    ).toBe(true);
    for (const text of [
      "Revise the direction if claim versions cannot be joined.",
      "If source access is unavailable, hold the decision.",
    ])
      expect(classifyPurposeClaims(text, [])[0]).toMatchObject({
        classification: "decision_condition",
        supported: true,
      });
    for (const text of [
      "No build has ever been approved.",
      "Claim versions cannot be joined, so revise the direction.",
      "The source is unavailable if the team asks today.",
    ])
      expect(classifyPurposeClaims(text, [])[0]?.supported).toBe(false);
  });
  it("binds date components to their source role, not merely a matching number", () => {
    const line = "Period,2028-02-29,12";
    const slots = {
      year: { datePart: purposeSourceDatePart(line, 7, "source:1") },
      month: { datePart: purposeSourceDatePart(line, 12, "source:1") },
      day: { datePart: purposeSourceDatePart(line, 15, "source:1") },
      otherYear: { datePart: purposeSourceDatePart(line, 7, "source:2") },
    };
    expect(slots.month.datePart?.part).toBe("month");
    expect(purposeSourceDatePart("2027-02-29", 0, "source:1")).toBeUndefined();
    expect(purposeSourceDatePart("REF-2028-02", 4, "source:1")).toBeUndefined();
    expect(purposeSourceDatePart("2028-02", 5, "source:1")?.part).toBe("month");
    expect(() =>
      assertPurposeDateSlotUse("{year}-{month}-{day}", slots),
    ).not.toThrow();
    expect(() =>
      assertPurposeDateSlotUse("February {year}", slots),
    ).not.toThrow();
    for (const text of [
      "February {month}",
      "{day} calls",
      "{otherYear}-{month}",
      "{month}-{day}",
    ])
      expect(() => assertPurposeDateSlotUse(text, slots)).toThrow(
        "date_part_misused",
      );
  });
  it("recognizes a prospective counting rule without discarding historical claims", () => {
    expect(
      classifyPurposeClaims(
        "No benefit counts until incremental cash is collected against a matched comparator [1].",
        [],
      )[0],
    ).toMatchObject({ classification: "decision_condition", supported: true });
    expect(
      classifyPurposeClaims(
        "No benefit counted last year until cash was collected [1].",
        [],
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims("No benefit was collected [1].", [])[0]?.supported,
    ).toBe(false);
  });
  it("recognizes direct whether questions but still checks asserted inability", () => {
    expect(
      classifyPurposeClaims(
        "Whether both hold, or the evidence cannot yet classify the work [1].",
        [],
      )[0],
    ).toMatchObject({ classification: "decision_condition", supported: true });
    expect(
      classifyPurposeClaims(
        "The evidence cannot yet classify the work [1].",
        [],
      )[0]?.supported,
    ).toBe(false);
  });
  it("checks a brief-bounded absence against the complete input bundle", () => {
    const claim =
      "The brief records no governance cadence, so the proposed sponsor sets a review rhythm [1].";
    const inputs = [
      { citationNumber: 1, statement: "Proposed sponsor: operations lead." },
    ];
    expect(
      classifyPurposeClaims(claim, inputs, { completeInputBundle: true })[0],
    ).toMatchObject({ classification: "evidence_gap", supported: true });
    expect(
      classifyPurposeClaims(
        claim,
        [
          {
            citationNumber: 1,
            statement:
              "The monthly calculation engine uses recorded cash flows.",
          },
        ],
        { completeInputBundle: true },
      )[0]?.supported,
    ).toBe(true);
    expect(classifyPurposeClaims(claim, inputs)[0]?.supported).toBe(false);
    expect(
      classifyPurposeClaims(
        claim,
        [{ citationNumber: 1, statement: "Weekly sponsor review." }],
        { completeInputBundle: true },
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        claim.replace("The brief records", "The organization has"),
        inputs,
        { completeInputBundle: true },
      )[0]?.supported,
    ).toBe(false);
  });
  it("requires local cited support for a proposed gap hypothesis", () => {
    const inputs = [
      {
        citationNumber: 1,
        statement:
          "Inconsistent category mapping leaves queues without a shared routing rule.",
      },
    ];
    const claim = "Category mapping may lack a shared routing rule [1].";
    expect(classifyPurposeClaims(claim, inputs)[0]).toMatchObject({
      classification: "decision_condition",
      supported: true,
    });
    expect(classifyPurposeClaims(claim, [])[0]?.supported).toBe(false);
    expect(
      classifyPurposeClaims(claim.replace("[1]", "[2]"), inputs)[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(claim, [
        {
          ...inputs[0]!,
          statement: "Category mapping uses a shared routing rule.",
        },
      ])[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        claim.replace("routing rule", "approval ledger"),
        inputs,
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        "Category mapping lacks a shared routing rule [1].",
        [
          {
            citationNumber: 1,
            statement: "Category mapping may lack a shared routing rule.",
          },
        ],
      )[0]?.supported,
    ).toBe(false);
  });
  it("recognizes a conditional risk without excusing an absent-evidence premise", () => {
    expect(
      classifyPurposeClaims(
        "A metadata mismatch could make missing-document status wrong [1].",
        [],
      )[0],
    ).toMatchObject({ classification: "decision_condition", supported: true });
    expect(
      classifyPurposeClaims(
        "Missing timestamps could make document status wrong [1].",
        [],
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims("Missing-document status is wrong [1].", [])[0]
        ?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        "No metadata exists and this could make document status wrong [1].",
        [],
      )[0]?.supported,
    ).toBe(false);
  });
  it("allows a measure heading but rejects it copied into a body cell", () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.tables = [];
    doc.generatedSections = [
      {
        key: "success_measures",
        title: "Measures",
        groundingMode: "mixed",
        citationsUsed: [1],
        bodyMarkdown:
          "| Outcome | Measure and definition work | Validation |\n| --- | --- | --- |\n| Service experience | Proposed: agree a repeat-contact definition. | Sponsor reviews the proposed definition [1]. |",
      },
    ];
    const error = "purpose_story:measure_cell_is_column_heading";
    expect(validatePurposeStory(doc, [])).not.toContain(error);
    doc.generatedSections[0]!.bodyMarkdown =
      doc.generatedSections[0]!.bodyMarkdown.replace(
        "Proposed: agree a repeat-contact definition.",
        "**Measure and definition work** [1]",
      );
    expect(validatePurposeStory(doc, [])).toContain(error);
    doc.generatedSections = [];
    doc.tables = [
      {
        key: "success_measures",
        title: "Measures",
        targetFormat: "docx",
        columns: ["Outcome", "Measure"],
        rows: [["Service experience", "Measure and target [1]"]],
      },
    ];
    expect(validatePurposeStory(doc, [])).toContain(error);
  });
  it("recognizes an imperative reporting condition without excusing factual absence", () => {
    expect(
      classifyPurposeClaims(
        "Report no rate until claim versions join back to the original claim [1].",
        [],
      )[0],
    ).toMatchObject({ classification: "decision_condition", supported: true });
    expect(
      classifyPurposeClaims(
        "Records show no rate until claim versions join back to the original claim [1].",
        [],
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        "No rates were reported until claim versions joined back to the original claim [1].",
        [],
      )[0]?.supported,
    ).toBe(false);
  });
  it("separates a double-counting restriction from a historical financial assertion", () => {
    expect(
      classifyPurposeClaims(
        "Financial baseline: existing recovered receipts cannot be counted again [1].",
        [],
      )[0],
    ).toMatchObject({ classification: "decision_condition", supported: true });
    expect(
      classifyPurposeClaims(
        "Recovered receipts historically cannot be counted again [1].",
        [],
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims("Recovered receipts cannot be found [1].", [])[0]
        ?.supported,
    ).toBe(false);
  });
  it("checks a bundle-wide pending disclosure against every input approval", () => {
    const sentence =
      "All inputs in this bundle, including the restrictions below, are recorded as pending owner review and proposed, not approved [1].";
    const inputs = [
      {
        citationNumber: 1,
        statement: "Proposed scope",
        approvalState: "pending" as const,
      },
      {
        citationNumber: 2,
        statement: "Proposed limits",
        approvalState: "proposed" as const,
      },
    ];
    expect(
      classifyPurposeClaims(sentence, inputs, { completeInputBundle: true })[0],
    ).toMatchObject({ classification: "draft_status", supported: true });
    for (const approvalState of ["approved", "unknown"] as const)
      expect(
        classifyPurposeClaims(
          sentence,
          [inputs[0]!, { ...inputs[1]!, approvalState }],
          { completeInputBundle: true },
        )[0]?.supported,
      ).toBe(false);
    expect(classifyPurposeClaims(sentence, inputs)[0]?.supported).toBe(false);
  });
  it("distinguishes a prescriptive restriction from a historical assertion", () => {
    expect(
      classifyPurposeClaims(
        "Knowledge restriction: no stale or conflicting knowledge presented as authoritative [1].",
        [],
      )[0],
    ).toMatchObject({ classification: "decision_condition", supported: true });
    expect(
      classifyPurposeClaims(
        "Knowledge restriction: no stale knowledge was ever presented as authoritative [1].",
        [],
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        "Knowledge restriction: no stale knowledge exists in the enterprise [1].",
        [],
      )[0]?.supported,
    ).toBe(false);
  });
  it("checks a structured no-change proposal against its own value and status", () => {
    const statement = [
      'row 1: ["question","synthetic_hypothesis","status"]',
      'row 2: ["role_accountability_change","none","proposed_not_confirmed"]',
    ].join("\n");
    const check = (
      source: string,
      claim = "No role-accountability change is proposed [1].",
    ) =>
      classifyPurposeClaims(claim, [
        { citationNumber: 1, statement: source },
      ])[0]?.supported;
    expect(check(statement)).toBe(true);
    expect(check(statement.replace('"none"', '"limited"'))).toBe(false);
    expect(
      check(statement.replace('"proposed_not_confirmed"', '"unknown"')),
    ).toBe(false);
    expect(check(statement, "No staffing change is proposed [1].")).toBe(false);
    expect(check(statement, "No role-accountability change exists [1].")).toBe(
      false,
    );
    expect(
      check(statement, "No role-accountability change is proposed [2]."),
    ).toBe(false);
  });
  it("fits mixed-status source registers by balancing columns, without losing review states", () => {
    const doc = purposeFixture();
    doc.sourceRegister = Array.from({ length: 17 }, (_, i) => ({
      citationNumber: i + 1,
      referenceId: `E${String(i + 1).padStart(2, "0")}`,
      label:
        i % 2
          ? "Knowledge ownership and currency"
          : "Metric definitions and comparability",
      evidenceFamily:
        i < 6 ? "Decision inputs" : i < 12 ? "Diagnostic evidence" : "Controls",
      confidence: "low" as const,
      reviewStatus: i % 2 ? "Owner review pending" : "Reviewed for context",
      useAndLimitation: "Defines the measure and its limitations.",
    }));
    const pages = planPurposePages(doc).filter((p) => p.sourceRegister);
    expect(pages).toHaveLength(2);
    expect(pages.flatMap((p) => p.rows!).filter((r) => r[0])).toHaveLength(17);
    expect(
      pages.every(
        (p) =>
          p.scope.includes("R1: Reviewed for context") &&
          p.scope.includes("R2: Owner review pending"),
      ),
    ).toBe(true);
    expect(pages.every((p) => p.columnWeights![1]! >= 4.8)).toBe(true);
  });
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
    const baselineGap =
      "No Finance-validated baseline exists in this package [1].";
    const absentBaseline = {
      citationNumber: 1,
      statement: "No Finance-validated baseline exists.",
    };
    const controlRow = {
      citationNumber: 2,
      statement:
        'row 2: ["Claim savings without validated baseline and capacity","State unknown/unvalidated","Finance Value Owner"]',
    };
    expect(
      classifyPurposeClaims(baselineGap, [absentBaseline, controlRow], {
        completeInputBundle: true,
      })[0]?.supported,
    ).toBe(true);
    expect(
      classifyPurposeClaims(baselineGap, [absentBaseline], {
        completeInputBundle: true,
      })[0]?.supported,
    ).toBe(true);
    expect(
      classifyPurposeClaims(
        baselineGap,
        [
          absentBaseline,
          {
            citationNumber: 2,
            statement:
              "Finance-validated baseline: approved period and denominator.",
          },
        ],
        { completeInputBundle: true },
      )[0]?.supported,
    ).toBe(false);
    const briefGap = "No measurement method stated in the brief [1].";
    expect(
      classifyPurposeClaims(
        briefGap,
        [
          {
            citationNumber: 1,
            statement: "Sponsor proposes an adoption outcome.",
          },
        ],
        { completeInputBundle: true },
      )[0]?.supported,
    ).toBe(true);
    expect(
      classifyPurposeClaims(
        briefGap,
        [
          {
            citationNumber: 1,
            statement: "Measurement method: activity log review.",
          },
        ],
        { completeInputBundle: true },
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(briefGap, [], { completeInputBundle: false })[0]
        ?.supported,
    ).toBe(false);
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
    expect(
      classifyPurposeClaims("Records no approval or resourcing.", [], {
        textRole: "scope",
      })[0]?.classification,
    ).toBe("draft_status");
    expect(
      classifyPurposeClaims("Records no approval or resourcing.", [])[0]
        ?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        "Recorded change position: no staffing model change is proposed [1].",
        [
          {
            citationNumber: 1,
            statement: "No staffing model change is proposed.",
          },
        ],
      )[0]?.supported,
    ).toBe(true);
    const row = {
      citationNumber: 1,
      statement: '"claim_status","status timestamp missing in sampled records"',
    };
    expect(
      classifyPurposeClaims(
        "Claim status timestamp missing in sampled records [1]",
        [row],
      )[0]?.supported,
    ).toBe(true);
    expect(
      classifyPurposeClaims(
        "Claim status timestamp missing in all records [1]",
        [row],
      )[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        "Measures cannot be blended into a baseline; no baseline exists.",
        [],
      ).map((v) => [v.classification, v.supported]),
    ).toEqual([
      ["decision_condition", true],
      ["factual_claim", false],
    ]);
    expect(
      classifyPurposeClaims(
        "Two handle-time measures differ by definition and cannot form one baseline.",
        [],
      )[0]?.classification,
    ).toBe("decision_condition");
    expect(
      classifyPurposeClaims("Routes compared, none selected.", [])[0]
        ?.classification,
    ).toBe("draft_status");
    expect(
      classifyPurposeClaims("No vendor was selected last year.", [])[0]
        ?.supported,
    ).toBe(false);
    const target = "No approved target [1]";
    expect(
      classifyPurposeClaims(target, [
        {
          citationNumber: 1,
          statement: "No target or benefit is approved at P1.",
        },
      ])[0]?.supported,
    ).toBe(true);
    expect(
      classifyPurposeClaims(target, [
        {
          citationNumber: 1,
          statement: "The target is approved. No benefit is approved.",
        },
      ])[0]?.supported,
    ).toBe(false);
    expect(
      classifyPurposeClaims(
        "Discovery should evaluate the options, so no single route is assumed before evidence is reviewed.",
        [],
      )[0]?.classification,
    ).toBe("decision_condition");
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
    const quotedPolicy =
      'Work in this bundle is confined to the supplied planning package, which records "No PHI" [2].';
    expect(
      classifyPurposeClaims(
        quotedPolicy,
        [{ citationNumber: 2, statement: "Use only package files. No PHI." }],
        { completeInputBundle: true },
      ).map((v) => [v.classification, v.supported]),
    ).toEqual([["factual_claim", true]]);
    expect(
      classifyPurposeClaims(
        quotedPolicy,
        [{ citationNumber: 2, statement: "No missing PHI controls." }],
        { completeInputBundle: true },
      )[0]?.supported,
    ).toBe(false);
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
    expect(purposeBodyHeight(pages[0]!)).toBeCloseTo(3.9);
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

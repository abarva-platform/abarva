import {
  purposeFixture,
  purposeChartFixture,
} from "../__fixtures__/purpose-pages";
import {
  estimatedLines,
  planPurposePages,
  validatePurposeChart,
  PURPOSE_LAYOUTS,
  purposeCitations,
  purposeStatementHeight,
  purposePlainText,
  purposeChartHeadline,
  purposeChartAxis,
  purposeStatusLabel,
  purposeBodyHeight,
  purposeRowHeight,
  purposeTableHeaderHeight,
} from "../purpose-page-plan";
import {
  formatPurposeNumber,
  explicitPurposeNumber,
} from "../purpose-number-display";
import { formatConsultantCents } from "@/lib/programs/value-engine/format-money";

/** A register's row codes leave its sentences for one final Source column. */
const shownWithSource = (rows: string[][]) =>
  rows.map((row) => [
    ...row.map((cell) => cell.replace(/ \[\d+\]/g, "")),
    row.join(" ").match(/\[\d+\]/)![0],
  ]);

describe("purpose page planning", () => {
  it("keeps note-only references out of the visible page footer", () => {
    const doc = purposeFixture();
    doc.tables = [];
    doc.exhibits = [];
    doc.nextActions = [];
    doc.deckSlides = [
      {
        key: "finding",
        governingMessage: "The recorded workflow keeps a human review",
        points: ["Review remains part of the recorded workflow [1]."],
        citationsUsed: [1, 2],
        speakerNotes:
          "A separate operational observation [2] informs later work.",
        pageIntent: {
          question: "What is recorded?",
          scopeNote: "This page does not establish improvement.",
        },
      },
    ];
    const page = planPurposePages(doc).find((p) => p.id.startsWith("finding"))!;
    expect(page.sources).toEqual([1]);
    expect(page.notes).toContain("observation [2]");
    doc.deckSlides[0]!.speakerNotes = "An unknown note source [99].";
    expect(() => planPurposePages(doc)).toThrow("unknown_source");
  });
  it("compacts a measures table before splitting and balances a longer continuation", () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "measures",
        title: "Recorded measures and hypotheses",
        columns: [
          "Measure",
          "Recorded trailing year",
          "Proposed hypothesis",
          "Basis",
        ],
        rows: [
          [
            "Initial exception rate",
            "15.0% [1]",
            "Target 11.0% [1]",
            "First exception only, original submissions [1]",
          ],
          [
            "Unrecovered balance",
            "$40.0M [2]",
            "Prevent 18.0% of exposure [2]",
            "Quarter schedule; recorded allowed exposure [2]",
          ],
          [
            "Recovered cash on rejected items",
            "$120.0M [1]",
            "Credit incremental cash only, against a matched comparator [1]",
            "Collected receipts from previously rejected allowed amounts [1]",
          ],
          [
            "Rework hours",
            "80,000.0 hr [2]",
            "Reduce by 20.0% [2]",
            "Capacity until a role or contract release is recorded [2]",
          ],
          [
            "Days in accounts receivable",
            "60 days [1]",
            "Target 50 days [1]",
            "Timing only; engine uses a conservative lag of 2 [1]",
          ],
        ],
        pageShape: "register",
        targetFormat: "pptx",
      },
    ];
    doc.deckSlides = [
      {
        key: "measures",
        governingMessage:
          "Recorded measures and proposed targets require different evidence",
        pageIntent: {
          question: "What is recorded?",
          scopeNote:
            "Recorded measures do not establish that the proposed targets are achievable.",
          tableKey: "measures",
          takeaway: "Review the counting basis before approving any target.",
        },
      },
    ];
    const compact = planPurposePages(doc).filter((page) =>
      page.id.startsWith("measures"),
    );
    expect(compact).toHaveLength(1);
    expect(compact[0]!.tableFontSize).toBe(15);
    expect(compact[0]!.rows).toEqual(shownWithSource(doc.tables[0]!.rows));
    doc.tables[0]!.rows.push(...doc.tables[0]!.rows.slice(0, 3));
    const pages = planPurposePages(doc).filter((page) =>
      page.id.startsWith("measures"),
    );
    expect(pages).toHaveLength(2);
    expect(pages.flatMap((page) => page.rows!)).toEqual(
      shownWithSource(doc.tables[0]!.rows),
    );
    for (const page of pages) {
      const used =
        purposeTableHeaderHeight(page) +
        page.rows!.reduce((sum, row) => sum + purposeRowHeight(page, row), 0);
      expect(page.rows!.length).toBeGreaterThanOrEqual(2);
      expect(used).toBeGreaterThanOrEqual(purposeBodyHeight(page) * 0.55);
      expect(used).toBeLessThanOrEqual(purposeBodyHeight(page) + 0.001);
    }
  });
  it("labels status once without losing the authored distinction", () => {
    // A label that only restates the state becomes the client's word for it.
    expect(purposeStatusLabel("condition", "Condition:")).toBe(
      "CONDITIONS TO CLOSE",
    );
    expect(purposeStatusLabel("later", "Later")).toBe("LATER APPROVAL");
    // A label that NAMES the item is the distinction this test protects. It survives as the label;
    // only the taxonomy prefix and the slash in front of it go.
    expect(purposeStatusLabel("risk", "Access boundary")).toBe(
      "Access boundary",
    );
    expect(purposeStatusLabel("risk", "Access boundary")).not.toContain("/");
  });
  it("bounds line axes around the recorded range and respects explicit bounds", () => {
    const chart = purposeChartFixture();
    chart.points = [72.9, 74, 75.7].map((value, i) => ({
      label: `Month ${i}`,
      value,
      sourceRow: `row ${i}`,
    }));
    const axis = purposeChartAxis(chart);
    expect(axis.min).toBeLessThanOrEqual(72.9);
    expect(axis.min).toBeGreaterThan(0);
    expect(axis.max).toBeGreaterThanOrEqual(75.7);
    expect(axis.max! - axis.min!).toBeLessThan(10);
    expect(purposeChartAxis({ ...chart, axisMin: 0, axisMax: 100 })).toEqual({
      min: 0,
      max: 100,
    });
    expect(
      purposeChartAxis({
        ...chart,
        points: chart.points.map((p) => ({ ...p, value: 4 })),
      }),
    ).toEqual({});
  });
  it("does not add a constant handoff column to unlabelled workflow edges", () => {
    const doc = purposeFixture();
    doc.exhibits[0]!.data = {
      kind: "flow",
      nodes: [
        { id: "a", label: "Review" },
        { id: "b", label: "Accept" },
        { id: "c", label: "Return" },
      ],
      edges: [
        { from: "a", to: "b" },
        { from: "a", to: "c" },
      ],
    };
    const page = planPurposePages(doc).find((p) => p.id === "workflow:1")!;
    expect(page.columns).toEqual(["From", "To"]);
    expect(page.rows).toEqual([
      ["Review", "Accept"],
      ["Review", "Return"],
    ]);
  });
  it("tries compact row padding before leaving one table row on a continuation", () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    const rows = [
      [
        "Fragmented context; identifiers repeated across systems",
        "Workshop account and recorded step sequence [1]",
        "Timed observation of the routine path",
      ],
      [
        "Exception handling depends on supervisor or specialist",
        "Escalation is the longest recorded step [1]",
        "Exception sample with recorded reasons",
      ],
      [
        "Source currency not always visible to the operator",
        "Status timestamp absent in the reviewed sample [1]",
        "Freshness display agreed with the platform owner",
      ],
      [
        "Attachment metadata mismatch in the reviewed records",
        "Mismatch in the reviewed records; missing-document status could be wrong [1]",
        "Owner review of attachment metadata",
      ],
      [
        "Published article may sit outside its review target",
        "Published status is not proof of current content [1]",
        "Owner review against the recorded target [1]",
      ],
    ];
    doc.tables = [
      {
        key: "causes",
        title: "Candidate causes",
        targetFormat: "pptx",
        pageShape: "register",
        columns: ["Candidate cause", "Recorded evidence", "Proposed test"],
        rows,
      },
    ];
    doc.deckSlides = [
      {
        key: "causes",
        governingMessage: "The candidate causes require distinct tests",
        pageIntent: {
          question: "What needs testing?",
          scopeNote: "Hypotheses, not confirmed causes.",
          tableKey: "causes",
          takeaway: "Review the evidence.",
        },
      },
    ];
    const pages = planPurposePages(doc).filter((p) =>
      p.id.startsWith("causes"),
    );
    expect(pages).toHaveLength(1);
    expect(pages[0]!.compactTableRows).toBe(true);
    expect(pages[0]!.rows).toEqual(
      rows.map((row) => row.map((cell) => cell.replace(/ \[1\]$/, ""))),
    );
  });
  it("keeps a bold statement label and moves its full assertion into the body", () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "decision",
        title: "Decision",
        targetFormat: "pptx",
        pageShape: "labelled_statements",
        columns: ["Status", "Basis"],
        rowTones: ["candidate", "condition"],
        rows: [
          [
            "**Proposed direction** - review the operating alternatives before choosing a route",
            "The source remains pending [1].",
          ],
          [
            "**Condition**: confirm the decision owner",
            "Record the review [1].",
          ],
        ],
      },
    ];
    doc.deckSlides = [
      {
        key: "decision",
        governingMessage: "The choice remains conditional",
        pageIntent: {
          question: "What is proposed?",
          scopeNote: "For review.",
          tableKey: "decision",
        },
      },
    ];
    const page = planPurposePages(doc).find((p) =>
      p.id.startsWith("decision"),
    )!;
    expect(page.family).toBe("labelled_statements");
    expect(page.items[0]!.label).toBe("Proposed direction");
    expect(page.items[0]!.detail).toContain(
      "review the operating alternatives before choosing a route",
    );
    expect(page.items[0]!.detail).toContain("The source remains pending [1].");
    expect(page.items[0]!.tone).toBe("candidate");
  });
  it("allocates width to long handoff labels before creating a sparse continuation", () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "handoffs",
        title: "Handoffs",
        targetFormat: "pptx",
        pageShape: "register",
        columns: ["From", "To", "Handoff"],
        // The handoff varies per row: a constant one is removed (covered in the R5 page-craft suite).
        rows: Array.from({ length: 5 }, (_, i) => [
          "Exception: supervisor or specialist queue (Agent and supervisor)",
          "Key and verify interaction summary (Agent)",
          `Handoff ${i + 1}`,
        ]),
      },
    ];
    doc.deckSlides = [
      {
        key: "handoffs",
        governingMessage: "Each handoff retains its declared owner",
        pageIntent: {
          question: "Who hands over?",
          scopeNote: "Recorded connections only.",
          tableKey: "handoffs",
          takeaway: "Review the handoffs.",
        },
      },
    ];
    const pages = planPurposePages(doc).filter((p) =>
      p.id.startsWith("handoffs"),
    );
    expect(pages).toHaveLength(1);
    expect(pages[0]!.rows).toEqual(doc.tables[0]!.rows);
    expect(pages[0]!.columnWeights![0]).toBeGreaterThan(
      pages[0]!.columnWeights![2]!,
    );
  });
  it("binds measurement cautions to declared subjects, populations and units", () => {
    const a = {
      ...purposeChartFixture(),
      comparisonSubject: "Demand",
      population: "incoming work",
    };
    const b = {
      ...a,
      key: "completion",
      comparisonSubject: "service performance",
      population: "eligible work",
      unit: "percent",
    };
    const doc = purposeFixture();
    doc.tables = [];
    doc.exhibits = [];
    doc.deckSlides = [
      {
        key: "method",
        governingMessage: purposeChartHeadline([a, b], "measurement_boundary"),
        pageIntent: {
          question: "How are the measures compared?",
          scopeNote: "Descriptive observations only.",
          chartKeys: [a.key, b.key],
          chartMessage: "measurement_boundary",
          takeaway: `${a.period}. Separate populations and axes; no intervention effect is established.`,
        },
      },
    ];
    expect(() => planPurposePages(doc, [a, b])).not.toThrow();
    expect(() =>
      planPurposePages(doc, [a, { ...b, population: a.population }]),
    ).toThrow("distinct_measures");
    expect(() => planPurposePages(doc, [a, { ...b, unit: a.unit }])).toThrow(
      "distinct_measures",
    );
    expect(() =>
      planPurposePages(doc, [a, { ...b, comparisonSubject: "profitability" }]),
    ).toThrow("headline_not_bound");
    doc.deckSlides[0]!.pageIntent!.takeaway =
      "The intervention improved performance.";
    expect(() => planPurposePages(doc, [a, b])).toThrow(
      "interpretation_needs_governed_binding",
    );
  });
  it("describes an interior dip as a recovery, not a steady trend", () => {
    const chart = purposeChartFixture();
    chart.points = [4, 3, 5].map((value, i) => ({
      value,
      label: `Period ${i}`,
      sourceRow: `row ${i}`,
    }));
    expect(purposeChartHeadline([chart])).toContain("recovers after a dip");
    chart.points[1]!.value = 4.5;
    expect(purposeChartHeadline([chart])).toContain("increases overall");
  });
  it("widens long statement labels before splitting five short status rows", () => {
    const doc = purposeFixture();
    doc.tables = [
      {
        key: "strengths",
        title: "Controls",
        columns: ["Strength", "Status"],
        rows: [
          [
            "Human verification before external member-facing action",
            "Owner review pending [1]",
          ],
          ["Draft red lines with named reviewing roles", "Condition [1]"],
          ["Read-only initial-phase boundary", "Planning decision [1]"],
          ["Metric definitions and their caveats", "For reconciliation [1]"],
          ["Business ownership of training and adoption", "Proposed [1]"],
        ],
        rowTones: [
          "candidate",
          "condition",
          "candidate",
          "candidate",
          "condition",
        ],
        pageShape: "labelled_statements",
        targetFormat: "pptx",
      },
    ];
    doc.deckSlides = [
      {
        key: "strengths",
        governingMessage: "Controls remain explicit",
        pageIntent: {
          question: "What stays?",
          scopeNote: "Owner review pending.",
          tableKey: "strengths",
        },
      },
    ];
    doc.exhibits = [];
    const pages = planPurposePages(doc).filter((p) =>
      p.id.startsWith("strengths"),
    );
    expect(pages).toHaveLength(1);
    expect(pages[0]!.statementLabelWidth).toBeGreaterThan(3.2);
    expect(pages[0]!.items.map((i) => [i.label, i.detail])).toEqual(
      doc.tables[0]!.rows,
    );
  });
  it("refuses unrelated or causal chart headlines even when every numeric source is valid", () => {
    const chart = purposeChartFixture();
    const doc = purposeFixture();
    doc.tables = [];
    doc.exhibits = [];
    doc.deckSlides = [
      {
        key: "trend",
        governingMessage: "Knowledge search causes longer calls",
        pageIntent: {
          question: "What changed?",
          scopeNote: "Recorded series only.",
          chartKeys: [chart.key],
        },
      },
    ];
    expect(() => planPurposePages(doc, [chart])).toThrow(
      "chart_headline_not_bound_to_measures",
    );
    doc.deckSlides[0]!.governingMessage = purposeChartHeadline([chart]);
    expect(() => planPurposePages(doc, [chart])).not.toThrow();
    doc.deckSlides[0]!.pageIntent!.takeaway = "The new tool caused the change";
    expect(() => planPurposePages(doc, [chart])).toThrow(
      "chart_interpretation_needs_governed_binding",
    );
    delete doc.deckSlides[0]!.pageIntent!.takeaway;
    doc.deckSlides[0]!.points = ["Search is the proven cause."];
    expect(() => planPurposePages(doc, [chart])).toThrow(
      "chart_interpretation_needs_governed_binding",
    );
  });
  it("formats typed values without changing source values or money defaults", () => {
    expect(
      formatPurposeNumber(15.8482, { kind: "percent", scale: "whole" }),
    ).toBe("15.8%");
    expect(
      formatPurposeNumber(0.158482, { kind: "percent", scale: "ratio" }),
    ).toBe("15.8%");
    expect(
      formatPurposeNumber(2200000, { kind: "currency", currency: "USD" }),
    ).toBe("$2.2M");
    expect(
      formatPurposeNumber(1236000, { kind: "count", unit: "claims" }),
    ).toBe("1,236,000");
    expect(formatPurposeNumber(638, { kind: "duration", unit: "sec" })).toBe(
      "638 sec",
    );
    expect(formatPurposeNumber(41, { kind: "rate", unit: "USD/hr" })).toBe(
      "41.0 USD/hr",
    );
    expect(explicitPurposeNumber("15.8482%")?.display).toBe("15.8%");
    expect(explicitPurposeNumber("$2,200,000.00")?.display).toBe("$2.2M");
    expect(explicitPurposeNumber("0.95")).toBeUndefined();
    expect(formatConsultantCents(220000000)).toBe("$2.20M");
    expect(() =>
      formatPurposeNumber(NaN, { kind: "percent", scale: "ratio" }),
    ).toThrow("non_finite");
  });
  it("keeps all five next actions in one owner/action/evidence table", () => {
    const doc = purposeFixture();
    doc.nextActions = [];
    doc.actionRegister = Array.from({ length: 5 }, (_, i) => ({
      owner: `Owner ${i}`,
      action: "Confirm the definition.",
      evidence: "Signed definition [1].",
    }));
    const pages = planPurposePages(doc).filter((p) =>
      p.id.startsWith("next-actions"),
    );
    expect(pages).toHaveLength(1);
    expect(pages[0]!.columns).toEqual([
      "Proposed owner",
      "Next action",
      "Proposed evidence",
    ]);
    expect(pages[0]!.rows).toHaveLength(5);
  });
  it("rejects mixed big-number units and adjacent duplicate titles", () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "numbers",
        title: "Different units",
        columns: ["Label", "Value", "Basis"],
        rows: [
          ["Count", "4", "Source [1]"],
          ["Share", "4%", "Source [2]"],
        ],
        pageShape: "big_numbers",
        valueUnits: ["count:claims", "percent"],
        targetFormat: "pptx",
      },
    ];
    doc.deckSlides = [
      {
        key: "numbers",
        governingMessage: "Definitions differ",
        pageIntent: {
          question: "Comparable?",
          scopeNote: "Definition review required.",
          tableKey: "numbers",
        },
      },
    ];
    expect(() => planPurposePages(doc)).toThrow("units_not_comparable");
    doc.tables[0]!.rows = [
      ["Measured", "638 sec [1]", "Monthly record"],
      ["Reference", "approximately 703 sec [2]", "Planning record"],
    ];
    doc.tables[0]!.valueUnits = ["duration:sec", "duration:sec"];
    const values = planPurposePages(doc).find((p) =>
      p.id.startsWith("numbers"),
    );
    expect(values?.items.map((i) => i.value)).toEqual(["638 sec", "~703 sec"]);
    expect(values?.sources).toEqual(expect.arrayContaining([1, 2]));
    doc.tables = [];
    doc.deckSlides = [
      { governingMessage: "Same title", points: ["First question."] },
      { governingMessage: "Same title", points: ["Second question."] },
    ];
    expect(() => planPurposePages(doc)).toThrow("repeated_title");
  });
  it("removes emphasis syntax without erasing words or unsupported markup", () => {
    expect(
      purposePlainText("**Required resolution:** Confirm the source [1]."),
    ).toBe("Required resolution: Confirm the source [1].");
    expect(purposePlainText("**Decision** with `literal_code`")).toBe(
      "**Decision** with `literal_code`",
    );
  });
  it("uses a readable table when a full role title exceeds the card label capacity", () => {
    const doc = purposeFixture();
    doc.tables = [
      {
        key: "roles",
        title: "Decision rights",
        pageShape: "roles",
        targetFormat: "pptx",
        columns: ["Role", "Responsibility"],
        rows: [
          [
            "Coding manager and documentation operations lead",
            "Review correction rules and preserve human approval [1].",
          ],
        ],
      },
    ];
    doc.deckSlides = [
      {
        key: "roles",
        governingMessage: "Decision rights remain with accountable owners",
        pageIntent: {
          question: "Who reviews?",
          scopeNote: "No approval recorded.",
          tableKey: "roles",
        },
      },
    ];
    doc.exhibits = [];
    const page = planPurposePages(doc).find((p) => p.id.startsWith("roles"))!;
    expect(page.family).toBe("register");
    expect(page.rows).toEqual(doc.tables[0]!.rows);
    expect(page.columnWeights).toEqual([4, 8.05]);
  });
  it("compacts statements before splitting without dropping their content", () => {
    const doc = purposeFixture();
    const points = Array.from(
      { length: 3 },
      (_, i) =>
        `Position ${i + 1}: ` +
        "Confirm the source and preserve the decision boundary. ".repeat(4),
    );
    doc.deckSlides = [
      {
        key: "dense",
        governingMessage: "Confirm the evidence before committing",
        points,
      },
    ];
    doc.tables = [];
    doc.exhibits = [];
    doc.nextActions = [];
    const pages = planPurposePages(doc).filter((p) => p.family === "statement");
    expect(pages).toHaveLength(1);
    expect(pages[0]!.compact).toBe(true);
    expect(pages.flatMap((p) => p.items.map((i) => i.detail))).toEqual(
      points.map((p) => p.trim()),
    );
    for (const page of pages)
      expect(
        page.items.reduce(
          (n, i) => n + purposeStatementHeight(i.detail, 11.2, 18),
          0,
        ),
      ).toBeLessThanOrEqual(4.1);
  });
  it("preserves shared comparison attributes as columns and source purposes as semantic groups", () => {
    const doc = purposeFixture();
    doc.sourceRegister[0]!.useAndLimitation = "Scope only; not authorization.";
    const pages = planPurposePages(doc);
    const source = pages.find(
      (p) =>
        p.sourceRegister &&
        p.rows?.some((r) => r.includes("Scope only; not authorization.")),
    )!;
    expect(
      source.rows!.some(
        (r) => r[1]?.toLowerCase() === doc.sourceRegister[0]!.evidenceFamily,
      ),
    ).toBe(true);
    expect(source.rows!.filter((r) => r[0])).toHaveLength(2);
    expect(source.columns).toContain("Use and limitation");
    const table = doc.tables.find((t) => t.pageShape === "comparison")!;
    const comparison = pages.find(
      (p) => JSON.stringify(p.rows) === JSON.stringify(table.rows),
    )!;
    expect(comparison.family).toBe("register");
    expect(comparison.columns).toEqual(table.columns);
    expect(comparison.rows).toEqual(table.rows);
  });
  it("keeps explicit status semantics and number bases without guessing", () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.tables = [
      {
        key: "status",
        title: "Decision boundary",
        targetFormat: "pptx",
        pageShape: "labelled_statements",
        columns: ["Label", "Statement"],
        rows: [
          ["Design candidate", "Review only [1]"],
          ["Conditions to close", "Confirm source [2]"],
        ],
        rowTones: ["candidate", "condition"],
      },
    ];
    doc.deckSlides = [
      {
        key: "status",
        governingMessage: "The decision remains conditional",
        pageIntent: {
          question: "What can proceed?",
          scopeNote: "No approval.",
          tableKey: "status",
          takeaway: "Owner must confirm [1].",
          takeawayLabel: "Required resolution",
        },
      },
    ];
    const page = planPurposePages(doc)[1]!;
    expect(page.family).toBe("labelled_statements");
    expect(page.items.map((i) => i.tone)).toEqual(["candidate", "condition"]);
    expect(page.takeawayLabel).toBe("Required resolution");
    delete doc.tables[0]!.rowTones;
    expect(() => planPurposePages(doc)).toThrow(
      "labelled_statement_semantics_missing",
    );
  });
  it("groups adjacent and already-grouped citations without losing IDs", () => {
    expect(
      purposeCitations("Basis [1] [2]. More [1, 2].", { 1: "C01", 2: "C02" }),
    ).toBe("Basis [C01, C02]. More [C01, C02].");
    expect(() => purposeCitations("[99]", { 1: "C01" })).toThrow(
      "unknown_source",
    );
  });
  it("keeps five short labelled readiness conditions on one semantic page", () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    const labels = [
      "Source access",
      "Identity lineage",
      "Reason grouping",
      "Ownership",
      "Finance certification",
    ];
    doc.tables = [
      {
        key: "readiness",
        title: "Readiness conditions",
        targetFormat: "pptx",
        pageShape: "labelled_statements",
        columns: ["Condition", "Required evidence"],
        rows: labels.map((label) => [
          label,
          "Owner confirms the recorded basis before approval [1].",
        ]),
        rowTones: ["condition", "risk", "risk", "candidate", "later"],
      },
    ];
    doc.deckSlides = [
      {
        key: "readiness",
        governingMessage: "The next decision depends on five conditions",
        pageIntent: {
          question: "What must close?",
          scopeNote: "Proposed only.",
          tableKey: "readiness",
        },
      },
    ];
    const pages = planPurposePages(doc).filter((page) =>
      page.id.startsWith("readiness"),
    );
    expect(pages).toHaveLength(1);
    expect(pages[0]!.family).toBe("labelled_statements");
    expect(pages[0]!.items.map((item) => item.label)).toEqual(labels);
    expect(pages[0]!.compact).toBe(true);
  });
  it("chooses content-shaped families and leaves the input unchanged", () => {
    const doc = purposeFixture(),
      before = JSON.stringify(doc);
    const pages = planPurposePages(doc, [purposeChartFixture()]);
    expect(new Set(pages.map((page) => page.family))).toEqual(
      new Set([
        "cover",
        "decision",
        "process",
        "roles",
        "layers",
        "statement",
        "register",
        "trend",
      ]),
    );
    expect(JSON.stringify(doc)).toBe(before);
    expect(
      pages.every((page) => page.question && page.notes && page.scope),
    ).toBe(true);
  });
  it.each(["concepts", "comparison", "roles", "decision"] as const)(
    "converts overflowing %s to a compact table without losing words",
    (shape) => {
      const doc = purposeFixture();
      doc.exhibits = [];
      doc.tables = [];
      const family = shape === "comparison" ? "options" : shape;
      const limit = PURPOSE_LAYOUTS[family].maxItems;
      for (const count of [limit, limit + 1]) {
        doc.deckSlides = [
          {
            governingMessage: "Each proposed action retains its evidence",
            pageIntent: {
              question: "What changes?",
              scopeNote: "Proposed only.",
              shape,
            },
            points: Array.from(
              { length: count },
              (_, i) => `Item ${i} remains conditional on owner review.`,
            ),
            citationsUsed: [1],
          },
        ];
        const pages = planPurposePages(doc).filter((page) =>
          page.id.startsWith("page-1"),
        );
        expect(pages).toHaveLength(1);
        expect(pages[0]!.family).toBe(count === limit ? family : "register");
        expect(
          pages.flatMap((page) =>
            page.rows
              ? page.rows.map((r) => r[1])
              : page.items.map((item) => item.detail),
          ),
        ).toEqual(doc.deckSlides[0]!.points);
      }
    },
  );
  it("splits long tables by height and repeats the actual columns", () => {
    const doc = purposeFixture();
    doc.tables.push({
      key: "long",
      title: "Source detail",
      columns: ["Record", "Detail"],
      rows: Array.from({ length: 10 }, (_, i) => [
        String(i),
        "Evidence remains unreviewed [1].",
      ]),
      targetFormat: "pptx",
    });
    const pages = planPurposePages(doc).filter((page) =>
      page.id.startsWith("long:"),
    );
    expect(pages.length).toBeGreaterThan(1);
    expect(pages).toHaveLength(2);
    expect(new Set(pages.map((p) => p.title)).size).toBe(2);
    expect(pages[1]!.title.endsWith("(continued)")).toBe(true);
    // Every row cites the same source, so it is stated once in the footer instead.
    expect(pages.flatMap((page) => page.rows!)).toEqual(
      doc.tables
        .at(-1)!
        .rows.map(([record]) => [record, "Evidence remains unreviewed."]),
    );
    expect(pages.every((page) => page.sources.includes(1))).toBe(true);
    expect(
      pages.every((page) => page.columns?.join() === "Record,Detail"),
    ).toBe(true);
  });
  it("refuses a single unreadable record rather than truncating it", () => {
    const doc = purposeFixture();
    doc.tables[3]!.rows[0]![0] = "Long evidence statement. ".repeat(100);
    expect(() => planPurposePages(doc)).toThrow("row_needs_edit");
  });
  it("preserves branching, edge labels and isolated nodes instead of drawing an invented chain", () => {
    const doc = purposeFixture();
    doc.exhibits[0]!.data = {
      kind: "flow",
      nodes: [
        { id: "a", label: "Review", role: "Owner" },
        { id: "b", label: "Accept" },
        { id: "c", label: "Return" },
        { id: "d", label: "Unconnected" },
      ],
      edges: [
        { from: "a", to: "b", label: "Approved" },
        { from: "a", to: "c", label: "Needs evidence" },
      ],
    };
    const page = planPurposePages(doc).find(
      (page) => page.id === "workflow:1",
    )!;
    expect(page.family).toBe("register");
    expect(page.rows).toEqual([
      ["Review (Owner)", "Accept", "Approved"],
      ["Review (Owner)", "Return", "Needs evidence"],
      ["Unconnected", "Not connected", "No edge declared"],
    ]);
  });
  it("refuses unknown citations and unplaced exhibits", () => {
    const doc = purposeFixture();
    doc.deckSlides![0]!.citationsUsed = [999];
    expect(() => planPurposePages(doc)).toThrow("unknown_source");
    const other = purposeFixture();
    other.deckSlides = other.deckSlides!.filter(
      (slide) => slide.key !== "workflow",
    );
    expect(() => planPurposePages(other)).toThrow("unplaced_exhibit");
  });
  it("counts unbroken words and explicit newlines conservatively", () => {
    expect(estimatedLines("a".repeat(41), 20)).toBe(3);
    expect(estimatedLines("one\ntwo", 20)).toBe(2);
  });
  it("retains paragraph boundaries in diagrams and authored qualifiers in notes", () => {
    const doc = purposeFixture();
    doc.deckSlides![4]!.points = [
      "This grouping does not establish a working integration [1].",
    ];
    const page = planPurposePages(doc).find(
      (page) => page.family === "layers",
    )!;
    expect(page.items[0]!.detail).toBe(
      "Reviewed service guidance\nOperational observations",
    );
    expect(page.notes).toContain(doc.deckSlides![4]!.points![0]);
  });
  it("validates citations inside an exhibit rather than only the storyline", () => {
    const doc = purposeFixture();
    doc.exhibits[1]!.data = {
      kind: "logical_architecture",
      lanes: [{ label: "Sources", items: ["Unregistered claim [999]"] }],
    };
    expect(() => planPurposePages(doc)).toThrow("unknown_source");
  });
  it.each(["empty", "ragged"])(
    "refuses %s tables even when converted into cards",
    (kind) => {
      const doc = purposeFixture();
      if (kind === "empty") doc.tables[0]!.rows = [];
      else doc.tables[0]!.rows[0]!.push("Unlabelled value");
      expect(() => planPurposePages(doc)).toThrow(
        kind === "empty" ? "empty_table" : "table_shape",
      );
    },
  );
  it("never infers a chart from table numbers", () => {
    expect(planPurposePages(purposeFixture()).some((page) => page.chart)).toBe(
      false,
    );
  });
  it("refuses unsupported governed inputs rather than dropping their source or calculation contract", () => {
    const doc = purposeFixture();
    doc.publicSources = [
      {
        citationNumber: 1,
        url: "https://example.org/reference",
        title: "Synthetic reference",
        publisher: "Example publisher",
        publishedAt: null,
        retrievedAt: "2026-01-01",
        excerpt: "Synthetic test reference.",
        claim: "Reference for a test.",
      },
    ];
    expect(() => planPurposePages(doc)).toThrow("public_sources_need_adapter");
    delete doc.publicSources;
    doc.referenceDeck = {} as NonNullable<typeof doc.referenceDeck>;
    expect(() => planPurposePages(doc)).toThrow("reference_deck_needs_adapter");
  });
  it("keeps assumptions, open inputs and next actions in the planned output", () => {
    const doc = purposeFixture();
    doc.assumptions = [
      {
        key: "review-availability",
        statement: "Review availability remains unconfirmed.",
        basis: "Source [1]",
        mustValidate: true,
      },
    ];
    const pages = planPurposePages(doc);
    expect(
      pages.find((page) => page.id.startsWith("assumptions:"))?.rows,
    ).toEqual([
      [doc.assumptions[0]!.statement, "Source [1]", "Validation required"],
    ]);
    expect(
      pages.find((page) => page.id.startsWith("next-actions:"))?.items[0]!
        .detail,
    ).toBe(doc.nextActions[0]);
  });
  it.each(["empty", "nan", "source", "row", "unit", "duplicate", "over-limit"])(
    "refuses chart input: %s",
    (bad) => {
      const chart = purposeChartFixture();
      if (bad === "empty") chart.points = [];
      if (bad === "nan") chart.points[0]!.value = NaN;
      if (bad === "source") chart.sourceIds = [999];
      if (bad === "row") chart.points[0]!.sourceRow = "";
      if (bad === "unit") chart.unit = "";
      if (bad === "duplicate") chart.points[1]!.label = chart.points[0]!.label;
      if (bad === "over-limit")
        chart.points = Array.from({ length: 13 }, (_, i) => ({
          label: `P${i}`,
          value: i,
          sourceRow: `row-${i}`,
        }));
      expect(() => validatePurposeChart(chart, new Set([2]))).toThrow();
    },
  );
});

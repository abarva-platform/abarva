import {
  purposeFixture,
  purposeChartFixture,
} from "../__fixtures__/purpose-pages";
import {
  estimatedLines,
  planPurposePages,
  validatePurposeChart,
  PURPOSE_LAYOUTS,
} from "../purpose-page-plan";

describe("purpose page planning", () => {
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
        "options",
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
    "paginates %s at the item limit without losing words",
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
        const pages = planPurposePages(doc).filter(
          (page) => page.family === family,
        );
        expect(pages).toHaveLength(count === limit ? 1 : 2);
        expect(
          pages.flatMap((page) => page.items.map((item) => item.detail)),
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
      rows: Array.from({ length: 15 }, (_, i) => [
        String(i),
        "Evidence remains unreviewed [1].",
      ]),
      targetFormat: "pptx",
    });
    const pages = planPurposePages(doc).filter((page) =>
      page.id.startsWith("long:"),
    );
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.flatMap((page) => page.rows!)).toEqual(
      doc.tables.at(-1)!.rows,
    );
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

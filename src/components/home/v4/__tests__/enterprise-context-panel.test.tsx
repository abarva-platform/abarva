/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";

import type { HomeEnterpriseContext } from "@/lib/home/preview/ecl-enterprise-context";
import { findBuilderLanguage } from "../cxo-language";
import { EnterpriseContextPanel } from "../EnterpriseContextPanel";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * The panel, held to the values it is given.
 *
 * Every figure in the fixture is different from every other figure that could stand in its place,
 * so a cell showing the wrong one, a zero, or nothing fails here. A test that only finds a column
 * heading passes whatever the column holds.
 */

const fact = (rowKey: string, title: string) => ({
  rowKey,
  title,
  sourceRefs: [`source-${rowKey}`],
  asOf: "2026-09-30",
});

const noGap = {
  functionWithoutSegment: 0,
  functionNotInRecord: 0,
  noFunctionRecorded: 0,
};

const context: HomeEnterpriseContext = {
  profile: {
    ...fact("ENT-1", "Reference enterprise"),
    businessModel: "Integrated payer and care delivery",
    annualRevenueUsd: 2_000_000_000,
  },
  segmentSpine: {
    segments: [
      {
        segmentKey: "SEG-1",
        segmentName: "Health plan",
        revenueSharePct: 60,
        revenueUsd: 1_200_000_000,
        pnlOwnerRole: "Plan CEO",
        domains: {
          applications: { count: 12 },
          programs: { count: 3 },
          risks: { count: 4 },
        },
      },
      {
        segmentKey: "SEG-2",
        segmentName: "Care delivery",
        // What the spine carries where the row records no revenue. The panel must not show it.
        revenueSharePct: 0,
        revenueUsd: 0,
        pnlOwnerRole: "",
        domains: {
          applications: { count: 7 },
          programs: { count: 5 },
          risks: { count: 9 },
        },
      },
    ],
    unattributed: { applications: 21, programs: 1, risks: 6 },
    unresolvedByDomain: {},
    shareVsRevenue: [],
  },
  // A row's own key is not the identifier other rows name it by. Kept different throughout, so
  // a control that opens rows by the wrong one of the two is caught.
  segmentFacts: {
    "SEG-1": {
      ...fact("SEG-ROW-1", "Health plan"),
      revenueUsd: 1_200_000_000,
      revenueSharePct: 60,
    },
    "SEG-2": {
      ...fact("SEG-ROW-2", "Care delivery"),
      revenueUsd: null,
      revenueSharePct: null,
    },
  },
  functions: [
    {
      ...fact("FUNC-ROW-1", "Claims"),
      functionId: "FUNC-1",
      segmentKey: "SEG-1",
      executiveOwner: "COO",
      applicationCount: 12,
      programCount: 3,
      riskCount: 4,
    },
    {
      ...fact("FUNC-ROW-2", "Finance"),
      functionId: "FUNC-2",
      segmentKey: null,
      executiveOwner: null,
      applicationCount: 8,
      programCount: 1,
      riskCount: 6,
    },
  ],
  priorities: [
    {
      ...fact("PRI-ROW-1", "Claims modernization"),
      priorityId: "PRI-1",
      segmentKey: "SEG-1",
      ownerRole: "COO",
      targetOutcome: "Faster claims",
      programCount: 3,
      atRiskProgramCount: 1,
      metricCount: 2,
    },
    {
      ...fact("PRI-ROW-2", "Access"),
      priorityId: "PRI-2",
      segmentKey: null,
      ownerRole: null,
      targetOutcome: null,
      programCount: 5,
      atRiskProgramCount: 4,
      metricCount: 7,
    },
  ],
  valueProof: {
    asOf: "2026-09-30",
    programCount: 4,
    approvedBudgetUsd: 4_000_000,
    forecastUsd: 4_500_000,
    overBudgetProgramCount: 2,
    missingFinancialCount: 0,
    modelledClaimCount: 3,
    unsupportedClaimCount: 1,
    otherClaimCount: 0,
    completedPeriodSpendLines: 8,
    excludedSpendLines: 2,
    priorities: [{
      ...fact("PRI-1", "Claims modernization"),
      ownerRole: "COO",
      programCount: 3,
      approvedBudgetUsd: 3_000_000,
      forecastUsd: 3_500_000,
      overBudgetProgramCount: 2,
      missingFinancialCount: 0,
    }, {
      ...fact("unlinked-programs", "No declared priority"),
      unlinked: true,
      ownerRole: null,
      programCount: 1,
      approvedBudgetUsd: 1_000_000,
      forecastUsd: 1_000_000,
      overBudgetProgramCount: 0,
      missingFinancialCount: 0,
    }],
  },
  riskTriage: {
    totalRisks: 4,
    highOrCritical: 2,
    partialControl: 1,
    unknownControl: 1,
    ownerIsConstant: true,
    attentionRisks: [
      {
        ...fact("RISK-1", "Recovery gap"),
        riskType: "resilience",
        severity: "critical",
        controlState: "unknown",
        ownerRole: "Risk chief",
        functionName: "Claims",
        affectedObject: "Claims platform",
      },
      {
        ...fact("RISK-2", "Supplier dependency"),
        riskType: "vendor",
        severity: "high",
        controlState: "partially_effective",
        ownerRole: "Risk chief",
        functionName: "Claims",
        affectedObject: "Billing service",
      },
    ],
  },
  sharedFunctionIds: ["FUNC-2"],
  unlinkedPrograms: [
    { ...fact("PROG-ROW-4", "Unlinked program"), programId: "PROG-4" },
  ],
  attributionGaps: {
    applications: { ...noGap, functionWithoutSegment: 8 },
    programs: { ...noGap, functionWithoutSegment: 1 },
    risks: { ...noGap, functionWithoutSegment: 6 },
  },
  unrecordedSpendAmounts: 0,
  excludedUncitedRows: 0,
  evidenceClass: "synthetic_reference",
};

const CHAPTERS = [
  "executive_brief",
  "our_business",
  "strategy_value_creation",
  "how_we_operate",
] as const;

function show(
  chapterId: (typeof CHAPTERS)[number] | "technology_data",
  value: HomeEnterpriseContext = context,
) {
  const onOpenRows = jest.fn();
  const onOpenMatch = jest.fn();
  const view = render(
    <EnterpriseContextPanel
      chapterId={chapterId}
      context={value}
      onOpenRows={onOpenRows}
      onOpenMatch={onOpenMatch}
    />,
  );
  return { ...view, onOpenRows, onOpenMatch };
}

/** A table row, as the text of each of its cells. */
function cells(row: HTMLElement): string[] {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent ?? "");
}

function rowNamed(name: string): HTMLElement {
  const row = screen.getByText(name).closest("tr");
  if (!row) throw new Error(`no table row for ${name}`);
  return row as HTMLElement;
}

/** The figure printed above a tile's label. */
function tile(label: string): string {
  return screen.getByText(label).previousElementSibling?.textContent ?? "";
}

describe("the enterprise context panel", () => {
  it("states on every view that the record is synthetic and not client-attested", () => {
    for (const chapterId of CHAPTERS) {
      const { container, unmount } = show(chapterId);
      expect(container.firstElementChild?.firstElementChild).toHaveTextContent(
        "Synthetic reference · Not client-attested · Source-linked records",
      );
      unmount();
    }
  });

  it("renders nothing on a chapter it has no view for", () => {
    expect(show("technology_data").container).toBeEmptyDOMElement();
  });

  it("gives the executive view its figures, each under its own label", () => {
    show("executive_brief");
    expect(
      screen.getByText("Integrated payer and care delivery"),
    ).toBeInTheDocument();
    expect(tile("Declared annual revenue")).toBe("$2B");
    expect(tile("Business segments")).toBe("2");
    expect(tile("Declared priorities")).toBe("2");
    // 3 + 5 in the segments, plus 1 outside them.
    expect(tile("Programs")).toBe("9");
    expect(tile("At-risk linked programs")).toBe("5");
    expect(
      screen.getByText(/1 function has no declared segment/),
    ).toHaveTextContent(
      "1 function has no declared segment; 1 program has no declared priority. Changes over time are not established by this view.",
    );
  });

  it("says annual revenue is not recorded rather than leaving it out", () => {
    show("executive_brief", {
      ...context,
      profile: { ...context.profile, annualRevenueUsd: null },
    });
    expect(tile("Declared annual revenue")).toBe("Not recorded");
  });

  it("puts each segment's figures in their own columns, and says when revenue is not recorded", () => {
    show("our_business");
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual([
      "Segment",
      "Revenue",
      "Revenue share",
      "P&L owner",
      "Applications",
      "Programs",
      "Risks",
      "Evidence",
    ]);
    expect(cells(rowNamed("Health plan"))).toEqual([
      "Health planView segment",
      "$1.2B",
      "60.0%",
      "Plan CEO",
      "12",
      "3",
      "4",
      "As of 2026-09-30 · 1 source record",
    ]);
    // The spine carries 0 for this segment's revenue. The row records none, and the panel says so.
    expect(cells(rowNamed("Care delivery"))).toEqual([
      "Care deliveryView segment",
      "Not recorded",
      "Not recorded",
      "Not recorded",
      "7",
      "5",
      "9",
      "As of 2026-09-30 · 1 source record",
    ]);
  });

  it("says why records sit outside the segments, one reason at a time", () => {
    const first = show("our_business");
    const note = screen.getByText(/Under functions with no declared segment/);
    expect(note).toHaveTextContent(
      "Under functions with no declared segment: 8 applications, 1 program, 6 risks. Customer/channel economics are not established by this record.",
    );
    expect(note).not.toHaveTextContent("not in this record");
    expect(note).not.toHaveTextContent("no function recorded");
    first.unmount();

    show("our_business", {
      ...context,
      attributionGaps: {
        applications: {
          functionWithoutSegment: 8,
          functionNotInRecord: 7,
          noFunctionRecorded: 3,
        },
        programs: {
          ...noGap,
          functionWithoutSegment: 1,
          noFunctionRecorded: 2,
        },
        risks: { ...noGap, functionWithoutSegment: 6, functionNotInRecord: 1 },
      },
    });
    expect(
      screen.getByText(/Under functions with no declared segment/),
    ).toHaveTextContent(
      "Under functions with no declared segment: 8 applications, 1 program, 6 risks. Naming a function that is not in this record: 7 applications, 0 programs, 1 risk. With no function recorded: 3 applications, 2 programs, 0 risks. Customer/channel economics are not established by this record.",
    );
  });

  it("puts each priority's figures in their own columns", () => {
    show("strategy_value_creation");
    expect(cells(rowNamed("Claims modernization"))).toEqual([
      "Claims modernizationView programs",
      "COO",
      "Faster claims",
      "3",
      "1",
      "2",
      "As of 2026-09-30 · 1 source record",
    ]);
    expect(cells(rowNamed("Access"))).toEqual([
      "AccessView programs",
      "Not recorded",
      "Not recorded",
      "5",
      "4",
      "7",
      "As of 2026-09-30 · 1 source record",
    ]);
    expect(
      screen.getByText(/not linked to a declared priority/),
    ).toHaveTextContent(
      "1 program is not linked to a declared priority: Unlinked program. Targets and KPIs are not proof of realized value.",
    );
  });

  it("puts each function's figures in their own columns, without saying why one has no segment", () => {
    show("how_we_operate");
    expect(cells(rowNamed("Claims"))).toEqual([
      "ClaimsView function",
      "Health plan",
      "COO",
      "12",
      "3",
      "4",
      "As of 2026-09-30 · 1 source record",
    ]);
    expect(cells(rowNamed("Finance"))).toEqual([
      "FinanceView function",
      "No declared segment",
      "Not recorded",
      "8",
      "1",
      "6",
      "As of 2026-09-30 · 1 source record",
    ]);
    expect(
      screen.getByText(/Function-level accountability is recorded/),
    ).toHaveTextContent(
      "1 function has no declared segment. Function-level accountability is recorded; decision rights are not inferred.",
    );
  });

  it("makes no statement about why a function has no segment", () => {
    for (const chapterId of CHAPTERS) {
      const { container, unmount } = show(chapterId);
      expect(container).not.toHaveTextContent(/deliberately/i);
      expect(container).not.toHaveTextContent(/shared/i);
      expect(container).not.toHaveTextContent(/across segments/i);
      unmount();
    }
  });

  it("reports rows left out for want of a source link, and only when there are some", () => {
    for (const chapterId of CHAPTERS) {
      const none = show(chapterId);
      expect(none.container).not.toHaveTextContent(
        "excluded from these totals",
      );
      none.unmount();
      const two = show(chapterId, { ...context, excludedUncitedRows: 2 });
      expect(two.container).toHaveTextContent(
        "2 records were excluded from these totals because a verified citation was unavailable.",
      );
      two.unmount();
      const one = show(chapterId, { ...context, excludedUncitedRows: 1 });
      expect(one.container).toHaveTextContent(
        "1 record was excluded from these totals because a verified citation was unavailable.",
      );
      one.unmount();
    }
  });

  it("opens a figure's rows by the identifier it was counted on, under the record's own name", () => {
    const business = show("our_business");
    fireEvent.click(
      within(rowNamed("Health plan")).getByRole("button", {
        name: "View segment",
      }),
    );
    expect(business.onOpenMatch).toHaveBeenCalledWith("business_segment", {
      field: "segmentKey",
      value: "SEG-1",
      label: "Health plan",
    });
    business.unmount();

    const strategy = show("strategy_value_creation");
    fireEvent.click(
      within(rowNamed("Claims modernization")).getByRole("button", {
        name: "View programs",
      }),
    );
    // The identifier programs name the priority by -- not the priority row's own key.
    expect(strategy.onOpenMatch).toHaveBeenLastCalledWith(
      "program_initiative",
      {
        field: "priorityId",
        value: "PRI-1",
        label: "Claims modernization",
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Unlinked program" }));
    expect(strategy.onOpenMatch).toHaveBeenLastCalledWith(
      "program_initiative",
      {
        field: "originalRowId",
        value: "PROG-4",
        label: "Unlinked program",
      },
    );
    strategy.unmount();

    const operating = show("how_we_operate");
    fireEvent.click(
      within(rowNamed("Finance")).getByRole("button", {
        name: "View function",
      }),
    );
    expect(operating.onOpenMatch).toHaveBeenCalledWith("business_function", {
      field: "functionId",
      value: "FUNC-2",
      label: "Finance",
    });
    operating.unmount();

    const executive = show("executive_brief");
    fireEvent.click(screen.getByRole("button", { name: "Examine segments" }));
    expect(executive.onOpenRows).toHaveBeenCalledWith("business_segment", "");
    expect(executive.onOpenMatch).not.toHaveBeenCalled();
  });

  it("prints no identifier and no builder vocabulary on any view", () => {
    for (const chapterId of CHAPTERS) {
      const { container, unmount } = show(chapterId, {
        ...context,
        excludedUncitedRows: 2,
      });
      const text = container.textContent ?? "";
      const tooltips = Array.from(container.querySelectorAll("[title]")).map(
        (element) => element.getAttribute("title") ?? "",
      );
      expect(tooltips.length).toBeGreaterThan(0);
      for (const shown of [text, ...tooltips]) {
        expect(findBuilderLanguage([shown])).toEqual([]);
        // The words the advisor is told never to use in front of a reader.
        expect(shown).not.toMatch(/governed|source rows?|payload|projection/i);
        expect(shown).not.toMatch(/\b(?:SEG|FUNC|PRI|PROG|ENT)-/);
      }
      unmount();
    }
  });
});

// From #8875 (source-linked risk review): the executive view's risk flags and the
// attention view's risk review queue, rendered to static markup and matched by text.
test("executive context flags the unresolved risk work", () => {
  const html = renderToStaticMarkup(
    createElement(EnterpriseContextPanel, {
      chapterId: "executive_brief",
      context,
      onOpenRows: () => undefined,
      onOpenMatch: () => undefined,
    }),
  );
  assert.match(html, /At-risk linked programs/);
  assert.match(html, /High\/critical risks with partial or unknown controls/);
  assert.doesNotMatch(html, /serving\.home_|source_record_id/);
});

test("attention view ranks source-linked risk review without calling unknown uncontrolled", () => {
  const html = renderToStaticMarkup(
    createElement(EnterpriseContextPanel, {
      chapterId: "what_needs_attention",
      context,
      onOpenRows: () => undefined,
      onOpenMatch: () => undefined,
    }),
  );
  assert.match(html, /Risk review queue/);
  assert.match(html, /Recovery gap/);
  assert.match(html, /Supplier dependency/);
  assert.match(html, /Risk chief/);
  assert.match(html, /Claims platform/);
  assert.match(html, /Unknown is not the same as uncontrolled/);
  assert.match(html, /item-level accountability is not established/);
  assert.match(html, /View risk/);
  assert.match(html, /As of 2026-09-30/);
  assert.ok(html.indexOf("resilience") < html.indexOf("vendor"));
});

test("business, strategy, and operating views answer different questions", () => {
  const render = (
    chapterId: "our_business" | "strategy_value_creation" | "how_we_operate",
  ) =>
    renderToStaticMarkup(
      createElement(EnterpriseContextPanel, {
        chapterId,
        context,
        onOpenRows: () => undefined,
        onOpenMatch: () => undefined,
      }),
    );
  const business = render("our_business");
  const strategy = render("strategy_value_creation");
  const operating = render("how_we_operate");
  assert.match(business, /Revenue share/);
  assert.match(business, /Plan CEO/);
  assert.match(strategy, /Claims modernization/);
  assert.match(strategy, /Faster claims/);
  assert.match(strategy, /Targets and KPIs are not proof of realized value/);
  assert.match(operating, /Claims/);
  assert.match(operating, /Executive owner/);
  assert.match(operating, /Function-level accountability is recorded/);
  const withUncited = renderToStaticMarkup(
    createElement(EnterpriseContextPanel, {
      chapterId: "our_business",
      context: { ...context, excludedUncitedRows: 2 },
      onOpenRows: () => undefined,
      onOpenMatch: () => undefined,
    }),
  );
  assert.match(withUncited, /2 records were excluded from these totals/);
});

test("performance view separates declared investment from unvalidated value", () => {
  const html = renderToStaticMarkup(createElement(EnterpriseContextPanel, {
    chapterId: "performance_value",
    context,
    onOpenRows: () => undefined,
    onOpenMatch: () => undefined,
  }));
  assert.match(html, /Investment versus proof/);
  assert.match(html, /\$4M/);
  assert.match(html, /Client-attested realized benefits/);
  assert.match(html, /As of 2026-09-30/);
  assert.match(html, /COO/);
  assert.match(html, /Not established/);
  assert.match(html, /3 value claims are/);
  assert.match(html, /2 of 10 spend records lack a verifiable completed-period actual/);
  assert.match(html, /View programs/);
  assert.match(html, /No declared priority/);
  assert.doesNotMatch(html, /serving\.home_|source_record_id/);
});

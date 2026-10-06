/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { FindingsBlock, PageShape, TableSet } from "../TableSet";
import {
  rankFindings,
  splitLeadingFigure,
  type Finding,
  type TableSpec,
} from "../page-tables";

const findings: Finding[] = [
  {
    kind: "established",
    claim: "64% of the estate is self-hosted.",
    owner: "CIO",
    because: "x".repeat(50),
  },
  {
    kind: "absence",
    claim: "53 applications carry an end-of-support date.",
    owner: "TO",
    because: "y".repeat(50),
  },
  {
    kind: "exposure",
    claim: "108 applications holding PHI use local accounts.",
    owner: "CISO",
    because: "z".repeat(50),
  },
];

describe("a block sorted by consequence looks sorted", () => {
  it("shows a finding's rule without asserting an unverified file source", () => {
    const onOpenRows = jest.fn();
    render(<FindingsBlock findings={[{
      kind: "exposure",
      claim: "337 regulated data assets are not yet production-governed.",
      owner: "Data owner",
      because: "Both fields are declared on each row.",
      trace: {
        file: "05_data_assets_integrations.csv",
        grain: "one data asset or integration",
        rule: "regulatedDataFlag is true AND qualityStatus is not governed_production_grade",
      },
      openRows: { objectType: "data_asset_or_integration", filter: "regulatedDataFlag:true" },
    }]} onOpenRows={onOpenRows} />);

    expect(document.querySelector("[data-home-lineage]")?.getAttribute("data-home-lineage")).toBe("unverified");
    fireEvent.click(screen.getByRole("button", { name: "Where this finding comes from" }));
    const panel = document.querySelector("[data-home-lineage-panel]")?.textContent ?? "";
    expect(panel).toContain("Rule; source mapping pending");
    expect(panel).toContain("regulatedDataFlag is true");
    expect(panel).toContain("Source-file identity and supporting rows have not been verified");
    expect(panel).not.toContain("05_data_assets_integrations.csv");
    expect(panel).not.toContain("only file asserting this");
    fireEvent.click(screen.getByRole("button", { name: "Open these rows" }));
    expect(onOpenRows).toHaveBeenCalledWith("data_asset_or_integration", "regulatedDataFlag:true");
  });

  // A block where every finding looks equally important makes the reader do the triage.
  it("puts what the record says is wrong now before what it cannot tell you", () => {
    expect(rankFindings(findings).map((f) => f.kind)).toEqual([
      "exposure",
      "absence",
      "established",
    ]);
  });

  it("keeps original order within a kind, so ranking never reshuffles equals", () => {
    const two: Finding[] = [
      { kind: "absence", claim: "A", owner: "o", because: "b" },
      { kind: "absence", claim: "B", owner: "o", because: "b" },
    ];
    expect(rankFindings(two).map((f) => f.claim)).toEqual(["A", "B"]);
  });

  it("renders in ranked order and names how many are wrong now", () => {
    render(<FindingsBlock findings={findings} />);
    const cards = Array.from(document.querySelectorAll("[data-home-finding]"));
    expect(cards.map((c) => c.getAttribute("data-home-finding"))).toEqual([
      "exposure",
      "absence",
      "established",
    ]);
    expect(
      document.querySelector("[data-home-findings-exposures]")?.textContent,
    ).toMatch(/1 the record says is wrong now/);
  });

  it("says nothing about exposures when there are none", () => {
    render(<FindingsBlock findings={[findings[0]]} />);
    expect(
      document.querySelector("[data-home-findings-exposures]"),
    ).not.toBeInTheDocument();
  });
});

describe("the number a claim opens on is set at the weight it deserves", () => {
  it.each([
    ["108 applications holding PHI use local accounts.", "108"],
    ["$172.6M covered by contracts with no benchmark.", "$172.6M"],
    ["16 of 72 contracts renew automatically.", "16 of 72"],
    ["64% of the estate is self-hosted.", "64%"],
  ])("pulls the figure out of %p", (claim, figure) => {
    expect(splitLeadingFigure(claim)?.figure).toBe(figure);
  });

  it("leaves a claim that does not open on a figure alone", () => {
    expect(
      splitLeadingFigure("Every cost figure here is modelled."),
    ).toBeNull();
  });
});

describe("a count column carries its own shape", () => {
  const table: TableSpec = {
    caption: "Cloud readiness",
    barColumn: "Apps",
    columns: ["State", "Apps"],
    rows: [
      ["Refactor", 158],
      ["Rehost", 109],
      ["Already cloud", 34],
    ],
  };

  it("scales bars against the largest row, not an invented maximum", () => {
    render(<TableSet tables={[table]} />);
    const widths = Array.from(
      document.querySelectorAll("[data-home-table-bar]"),
    ).map((b) => (b as HTMLElement).style.width);
    expect(widths).toEqual(["100%", "69%", "22%"]);
  });

  // The bar is decoration over a number that has not moved; a reader loses no precision.
  it("leaves the number itself untouched", () => {
    render(<TableSet tables={[table]} />);
    expect(document.body.textContent).toContain("158");
  });

  it("draws no bars on a table that declares no bar column", () => {
    render(
      <TableSet
        tables={[{ caption: "c", columns: ["A", "B"], rows: [["x", 1]] }]}
      />,
    );
    expect(document.querySelectorAll("[data-home-table-bar]").length).toBe(0);
  });
});

describe("the page states its own shape", () => {
  it("counts tables, findings, exposures and views it could not build", () => {
    render(
      <PageShape
        tables={[{ caption: "t", columns: ["a"], rows: [] }]}
        findings={findings}
        unsupported={[{ caption: "u", missingColumn: "col", why: "because" }]}
      />,
    );
    const line =
      document.querySelector("[data-home-page-shape]")?.textContent ?? "";
    expect(line).toBe(
      "1 table · 3 findings · 1 the record says is wrong now · 1 evidence view pending",
    );
  });

  it("renders nothing when the page holds nothing", () => {
    render(<PageShape tables={[]} findings={[]} unsupported={[]} />);
    expect(
      document.querySelector("[data-home-page-shape]"),
    ).not.toBeInTheDocument();
  });
});

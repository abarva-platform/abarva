/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import fs from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { RenewalTimeline, buildRenewalYears } from "../RenewalTimeline";

const contracts = () =>
  JSON.parse(
    fs.readFileSync(
      path.join(
        process.cwd(),
        "src/lib/home/preview/golden-snapshots/meridian-health.json",
      ),
      "utf8",
    ),
  ).technologyEstate.recordTypes.find(
    (r: { objectType: string }) => r.objectType === "vendor_contract",
  ).rows as Array<Record<string, unknown>>;

describe("renewal buckets", () => {
  it("splits each year by whether renewal needs a decision", () => {
    const years = buildRenewalYears([
      { termEnd: "2026-12-31", autoRenewFlag: "yes" },
      { termEnd: "2026-06-30", autoRenewFlag: "no" },
      { termEnd: "2027-01-01", autoRenewFlag: "yes" },
    ]);
    expect(years).toEqual([
      { year: "2026", autoRenewing: 1, requiresDecision: 1, past: false },
      { year: "2027", autoRenewing: 1, requiresDecision: 0, past: false },
    ]);
  });

  // Past means past relative to the record, never the clock: a chart whose meaning changes with the
  // day it is opened is not reproducible, and the same figure would read differently next quarter.
  it("marks a year past against the record's own as-of date", () => {
    const years = buildRenewalYears(
      [
        { termEnd: "2024-01-01", autoRenewFlag: "yes" },
        { termEnd: "2030-01-01", autoRenewFlag: "no" },
      ],
      "2026-08-21",
    );
    expect(years.map((y) => y.past)).toEqual([true, false]);
  });

  it("marks nothing past without an as-of date rather than guessing one", () => {
    const years = buildRenewalYears([
      { termEnd: "2024-01-01", autoRenewFlag: "yes" },
    ]);
    expect(years[0].past).toBe(false);
  });

  it("ignores a contract with no parseable term end rather than bucketing it as unknown", () => {
    expect(buildRenewalYears([{ termEnd: "", autoRenewFlag: "yes" }])).toEqual(
      [],
    );
  });
});

describe("the timeline renders only where there is a shape to see", () => {
  it("says nothing for two years, because two years is a list", () => {
    const { container } = render(
      <RenewalTimeline
        contracts={[
          { termEnd: "2026-01-01", autoRenewFlag: "yes" },
          { termEnd: "2027-01-01", autoRenewFlag: "no" },
        ]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders the real spread and names how many are already behind", () => {
    render(<RenewalTimeline contracts={contracts()} asOf="2026-08-21" />);
    const section = document.querySelector("[data-home-renewal-timeline]");
    expect(section).toBeInTheDocument();
    expect(
      Number(section?.getAttribute("data-home-renewal-timeline")),
    ).toBeGreaterThanOrEqual(8);
    expect(
      Number(
        document
          .querySelector("[data-home-renewal-past]")
          ?.getAttribute("data-home-renewal-past"),
      ),
    ).toBe(16);
  });

  // The failure this catches: a responsive container renders nothing without a layout pass, and
  // animated bars render nothing on mount. Both leave axes with an empty plot, and every other
  // assertion in this file still passes -- so the chart is asserted to actually draw.
  it("draws bars, not just axes", () => {
    render(<RenewalTimeline contracts={contracts()} asOf="2026-08-21" />);
    expect(document.querySelectorAll("svg").length).toBe(1);
    expect(
      document.querySelectorAll(
        "svg .recharts-rectangle, svg .recharts-bar-rectangle",
      ).length,
    ).toBeGreaterThan(10);
  });

  it("names the largest cluster and why the year matters", () => {
    render(<RenewalTimeline contracts={contracts()} asOf="2026-08-21" />);
    expect(document.body.textContent).toMatch(
      /16 contracts reach their term end in 2026, the largest\s+cluster/,
    );
    expect(document.body.textContent).toMatch(
      /before its earliest notice window closes/,
    );
  });
});

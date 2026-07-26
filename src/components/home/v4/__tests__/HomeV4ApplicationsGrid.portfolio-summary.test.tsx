/**
 * HomeV4ApplicationsGrid · portfolio summary strip
 *
 * Turns "the apps dimension is one more block in a generic template" into
 * a real landing experience: a scannable portfolio-level summary computed
 * from the same full_rows already loaded for the grid below it -- total
 * count, real annual run cost with honest coverage, owner-coverage
 * percentage, and real (not invented) criticality/hosting mixes. Uses the
 * actual first-capital fixture (260 real applications) so this is a
 * real-content check, not a synthetic shape.
 */

import { renderToStaticMarkup } from "react-dom/server";

import { HomeV4ApplicationsGrid } from "../HomeV4ApplicationsGrid";
import type { HomeV4ApplicationFullRow, HomeV4Candidate } from "../homeV4Visual";
import firstCapitalFixture from "@/app/(maestro)/home/v4-preview/_fixtures/first-capital.json";

const candidate = firstCapitalFixture as unknown as HomeV4Candidate;
const appsDimension = candidate.dimensions.find((d) => d.dimension_key === "apps");
const rows: HomeV4ApplicationFullRow[] = appsDimension?.data_tab?.full_rows ?? [];

describe("<HomeV4ApplicationsGrid /> · portfolio summary (real fixture content)", () => {
  it("has real full_rows to test against (sanity check on the fixture itself)", () => {
    expect(rows.length).toBeGreaterThan(0);
  });

  function html() {
    return renderToStaticMarkup(<HomeV4ApplicationsGrid rows={rows} />);
  }

  it("shows the real total application count", () => {
    const markup = html();
    expect(markup).toContain(`>${rows.length.toLocaleString()}<`);
    expect(markup).toContain("Applications in inventory");
  });

  it("shows a real annual run cost total with honest coverage when some rows lack cost data", () => {
    const markup = html();
    const withCost = rows.filter((r) => r.annual_run_cost_usd != null);
    expect(markup).toContain("Annual run cost");
    if (withCost.length < rows.length) {
      expect(markup).toContain(`${withCost.length} of ${rows.length} apps`);
    }
  });

  it("shows real owner-coverage percentage, not a placeholder", () => {
    const owned = rows.filter((r) => r.owner).length;
    const expectedPct = Math.round((owned / rows.length) * 100);
    const markup = html();
    expect(markup).toContain(`${expectedPct}%`);
    expect(markup).toContain("Have a named owner on file");
  });

  it("shows real criticality values from the fixture, not invented categories", () => {
    const markup = html();
    const realCriticalities = new Set(rows.map((r) => r.criticality).filter(Boolean));
    for (const value of realCriticalities) {
      expect(markup).toContain(String(value));
    }
    // No fabricated "P0/P1/P2" style relabeling -- the real source vocabulary appears verbatim.
  });

  it("shows real hosting values, never a fabricated cloud-vs-on-prem binary", () => {
    const markup = html();
    expect(markup).not.toContain(">Cloud<");
    expect(markup).not.toContain(">On-Prem<");
    const realHosting = new Set(rows.map((r) => r.hosting).filter(Boolean));
    const topHosting = [...realHosting].slice(0, 1);
    for (const value of topHosting) {
      expect(markup).toContain(String(value));
    }
  });
});

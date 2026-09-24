/**
 * @jest-environment jsdom
 */

/*
 * T-555. The control below used to live in
 * `WorkspaceExecutiveShell.performance.test.ts` as `readFileSync` +
 * `toContain` over the bytes of `WorkspaceExecutiveShell.tsx`, where a
 * comment carrying the same text satisfied it and a real removal of the
 * affordance did not fail it. It is the same control, moved to the only
 * place that can actually fail: a rendered tree.
 *
 * Only ONE of the two candidate surfaces made the move. The other had no
 * surface left to render: the legacy graph renderer was mounted by nothing,
 * five green cases written over it were reverted rather than kept, and
 * U-503 has since deleted the renderer, its helpers and its stylesheet
 * classes outright. What replaces that case is not a scan for the absent
 * name — it is the reachability control in the sibling suite, which walks
 * the module's reference graph out from its exports and fails on the next
 * component the product cannot mount.
 */

import { render, screen, within } from "@testing-library/react";

import { EvidenceLaneBarChart } from "../WorkspaceExecutiveShell";

describe("EvidenceLaneBarChart renders the evidence visual it used to be scanned for", () => {
  /*
   * Replaces, from the retired `keeps the Evidence page visual before the
   * row-detail tables`:
   *   expect(source).toContain("EvidenceLaneBarChart")
   *   expect(source).toContain('aria-label="Evidence lane row counts"')
   */
  it("labels the lane chart and draws one bar row per lane", () => {
    render(
      <EvidenceLaneBarChart
        rows={[
          { name: "Spend", support: "loaded", lineage: "a", count: 120, state: "available" },
          { name: "Performance", support: "loaded", lineage: "b", count: 40, state: "available" },
          { name: "Change orders", support: "none", lineage: "c", count: 0, state: "missing" },
        ]}
      />,
    );

    const chart = screen.getByLabelText("Evidence lane row counts");
    expect(chart.querySelectorAll(".sw-v2-visual-bar-row")).toHaveLength(3);
    expect(within(chart).getByText("Spend")).toBeTruthy();
    expect(within(chart).getByText("120")).toBeTruthy();
    // A zero lane is drawn, not dropped: missing is reported, never implied.
    expect(within(chart).getByText("Change orders")).toBeTruthy();
    expect(within(chart).getByText("0")).toBeTruthy();
  });
});

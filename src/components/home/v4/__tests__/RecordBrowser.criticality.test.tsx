/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";

import { render, screen, within } from "@testing-library/react";

import type { TechRecordType } from "@/lib/home/preview/types";
import { RecordBrowser } from "../RecordBrowser";

describe("RecordBrowser criticality metrics", () => {
  it("counts common tier-one spellings as the same executive metric", () => {
    const recordType: TechRecordType = {
      objectType: "application_system",
      label: "Applications & Systems",
      columns: ["systemName", "businessFunction", "criticality", "annualCostUsd"],
      rows: [
        { systemName: "Clinical platform", businessFunction: "Clinical Operations", criticality: "tier1", annualCostUsd: 10 },
        { systemName: "Claims platform", businessFunction: "Health Plan Operations", criticality: "tier-1", annualCostUsd: 10 },
        { systemName: "Finance platform", businessFunction: "Finance", criticality: "tier 1", annualCostUsd: 10 },
        { systemName: "Access platform", businessFunction: "Member Services", criticality: "P0", annualCostUsd: 10 },
        { systemName: "Archive", businessFunction: "Information Technology", criticality: "tier2", annualCostUsd: 10 },
      ],
      primaryDimension: "businessFunction",
      dimensionCounts: [
        { value: "Clinical Operations", count: 1 },
        { value: "Health Plan Operations", count: 1 },
        { value: "Finance", count: 1 },
        { value: "Member Services", count: 1 },
        { value: "Information Technology", count: 1 },
      ],
    };

    const { container } = render(<RecordBrowser recordType={recordType} />);

    const metrics = container.querySelector("[data-record-metrics]");
    expect(metrics).not.toBeNull();
    const tierMetric = within(metrics as HTMLElement).getByText("tier 1").closest("div");
    expect(tierMetric).toHaveTextContent("4");
  });
});

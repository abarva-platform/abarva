/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { TechnologyEstateTable } from "../TechnologyEstateTable";
import type { TechRecordType } from "@/lib/home/preview/types";

function recordType(): TechRecordType {
  return {
    objectType: "application_system",
    label: "Applications & Systems",
    columns: ["systemName", "businessFunction", "vendor"],
    rows: [
      { systemName: "Epic Hyperspace", businessFunction: "Clinical Informatics", vendor: "Epic Systems" },
      { systemName: "Cerner PowerChart", businessFunction: "Clinical Informatics", vendor: "Oracle Health" },
      { systemName: "Workday", businessFunction: "Finance & Accounting", vendor: "Workday, Inc." },
    ],
    primaryDimension: "businessFunction",
    dimensionCounts: [
      { value: "Clinical Informatics", count: 2 },
      { value: "Finance & Accounting", count: 1 },
    ],
  };
}

describe("TechnologyEstateTable", () => {
  it("shows every row with no filter applied", () => {
    render(<TechnologyEstateTable recordType={recordType()} />);
    expect(screen.getByText("Epic Hyperspace")).toBeInTheDocument();
    expect(screen.getByText("Workday")).toBeInTheDocument();
    expect(screen.getByText("3 of 3 shown")).toBeInTheDocument();
  });

  it("narrows to only the tagged segment when a dimension chip is clicked -- the finance/clinical tagging use case", () => {
    render(<TechnologyEstateTable recordType={recordType()} />);
    fireEvent.click(screen.getByRole("button", { name: /Finance & Accounting/ }));
    expect(screen.getByText("Workday")).toBeInTheDocument();
    expect(screen.queryByText("Epic Hyperspace")).not.toBeInTheDocument();
    expect(screen.getByText("1 of 3 shown")).toBeInTheDocument();
  });

  it("returns to the full set when 'All' is clicked again", () => {
    render(<TechnologyEstateTable recordType={recordType()} />);
    fireEvent.click(screen.getByRole("button", { name: /Clinical Informatics/ }));
    fireEvent.click(screen.getByRole("button", { name: /^All/ }));
    expect(screen.getByText("3 of 3 shown")).toBeInTheDocument();
  });

  it("narrows on free-text search across every column, not just the first", () => {
    render(<TechnologyEstateTable recordType={recordType()} />);
    fireEvent.change(screen.getByLabelText("Search Applications & Systems"), { target: { value: "oracle" } });
    expect(screen.getByText("Cerner PowerChart")).toBeInTheDocument();
    expect(screen.queryByText("Epic Hyperspace")).not.toBeInTheDocument();
  });

  it("shows an honest empty state rather than a blank table for no matches", () => {
    render(<TechnologyEstateTable recordType={recordType()} />);
    fireEvent.change(screen.getByLabelText("Search Applications & Systems"), { target: { value: "zzz_no_match" } });
    expect(screen.getByText("No records match this search or filter.")).toBeInTheDocument();
  });

  it("does not render a dimension rollup when primaryDimension is null (no fabricated segmentation)", () => {
    const rt = { ...recordType(), primaryDimension: null, dimensionCounts: [] };
    render(<TechnologyEstateTable recordType={rt} />);
    expect(screen.queryByText(/^By /)).not.toBeInTheDocument();
  });
});

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
      { systemName: "NetSuite", businessFunction: "Finance & Accounting", vendor: "Oracle NetSuite" },
    ],
    primaryDimension: "businessFunction",
    dimensionCounts: [
      { value: "Clinical Informatics", count: 2 },
      { value: "Finance & Accounting", count: 2 },
    ],
  };
}

describe("TechnologyEstateTable", () => {
  it("shows every row with no filter applied", () => {
    render(<TechnologyEstateTable recordType={recordType()} />);
    expect(screen.getByText("Epic Hyperspace")).toBeInTheDocument();
    expect(screen.getByText("Workday")).toBeInTheDocument();
    expect(screen.getByText("4 of 4 shown")).toBeInTheDocument();
  });

  it("narrows to only the tagged segment when a dimension chip is clicked -- the finance/clinical tagging use case", () => {
    render(<TechnologyEstateTable recordType={recordType()} />);
    fireEvent.click(screen.getByRole("button", { name: /Finance & Accounting/ }));
    expect(screen.getByText("Workday")).toBeInTheDocument();
    expect(screen.getByText("NetSuite")).toBeInTheDocument();
    expect(screen.queryByText("Epic Hyperspace")).not.toBeInTheDocument();
    expect(screen.getByText("2 of 4 shown")).toBeInTheDocument();
  });

  it("returns to the full set when 'All' is clicked again", () => {
    render(<TechnologyEstateTable recordType={recordType()} />);
    fireEvent.click(screen.getByRole("button", { name: /Clinical Informatics/ }));
    fireEvent.click(screen.getByRole("button", { name: /^All/ }));
    expect(screen.getByText("4 of 4 shown")).toBeInTheDocument();
  });

  it("collapses singleton dimension values into a note instead of a chip, keeping only real clusters clickable", () => {
    const rt: TechRecordType = {
      objectType: "vendor_contract",
      label: "Vendor Contracts",
      columns: ["vendorName", "serviceCategory"],
      rows: [
        { vendorName: "Epic", serviceCategory: "EHR platform" },
        { vendorName: "Workday", serviceCategory: "HR/payroll" },
        { vendorName: "Salesforce", serviceCategory: "CRM" },
      ],
      primaryDimension: "serviceCategory",
      dimensionCounts: [
        { value: "EHR platform", count: 1 },
        { value: "HR/payroll", count: 1 },
        { value: "CRM", count: 1 },
      ],
    };
    render(<TechnologyEstateTable recordType={rt} />);
    expect(screen.queryByRole("button", { name: /EHR platform/ })).not.toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.tagName === "P" && Boolean(element.textContent?.includes("value here is unique to one record")),
      ),
    ).toBeInTheDocument();
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

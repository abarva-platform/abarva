/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { RelationshipLens } from "../RecordBrowser";

describe("record association cardinality", () => {
  it("preserves punctuation inside scalar supplier names", () => {
    render(<RelationshipLens objectType="vendor_contract" rows={[
      { vendorName: "Supplier, Inc.", supportedFunctions: "Finance; People" },
      { vendorName: "Example (Services, LLC)", supportedFunctions: "Finance" },
    ]} />);
    expect(screen.getByText("Supplier, Inc.")).toBeInTheDocument();
    expect(screen.getByText("Example (Services, LLC)")).toBeInTheDocument();
    expect(screen.queryByText("Inc.")).not.toBeInTheDocument();
    expect(screen.queryByText("LLC)")).not.toBeInTheDocument();
  });

  it("does not tokenize commas or semicolons inside scalar service descriptions", () => {
    render(<RelationshipLens objectType="vendor_contract" rows={[
      { vendorName: "Example", supportedFunctions: "Finance", serviceCategory: "Reporting, planning; analysis", commercialModel: "subscription" },
    ]} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Relationship" }), { target: { value: "service-commercial" } });
    expect(screen.getByText("Reporting, planning; analysis")).toBeInTheDocument();
    expect(screen.queryByText("Reporting")).not.toBeInTheDocument();
  });

  it("deduplicates declared list tokens and distinguishes source rows from attribute pairs", () => {
    render(<RelationshipLens objectType="infrastructure_platform" rows={[
      { hostingModel: "on-prem", technologyStack: "Database; Queue|Queue" },
      { hostingModel: "on-prem", technologyStack: "Database" },
      { hostingModel: "on-prem", technologyStack: null },
    ]} />);
    const card = screen.getByRole("article");
    expect(within(card).getByText("2 source rows")).toBeInTheDocument();
    expect(within(card).getByText("3 attribute pairs")).toBeInTheDocument();
    expect(within(card).getByText("Database")).toBeInTheDocument();
    expect(within(card).getByText("Queue")).toBeInTheDocument();
  });

  it("keeps commas in declared list item names instead of inventing identities", () => {
    render(<RelationshipLens objectType="application_system" rows={[
      { vendor: "Example (Products, LLC)", criticality: "high", dataDomains: "Quality, reporting; Clinical", businessFunction: "Care" },
    ]} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Relationship" }), { target: { value: "domain-function" } });
    expect(screen.getByText("Quality, reporting")).toBeInTheDocument();
    expect(screen.getByText("Clinical")).toBeInTheDocument();
    expect(screen.queryByText("Quality")).not.toBeInTheDocument();
  });

  it("excludes unpopulated endpoints rather than counting a missing association", () => {
    const { container } = render(<RelationshipLens objectType="vendor_contract" rows={[
      { vendorName: "Example", supportedFunctions: null },
      { vendorName: null, supportedFunctions: "Finance" },
    ]} />);
    expect(container.querySelector("article")).toBeNull();
  });
});

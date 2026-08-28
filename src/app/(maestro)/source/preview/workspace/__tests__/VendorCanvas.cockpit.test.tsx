/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import { VendorCanvas } from "../canvases/VendorCanvas";
import type { SourceWorkspaceVM } from "../buildViewModel";

const noop = () => undefined;

function metric(label: string, value: string, sub = "Governed rollup") {
  return {
    label,
    value,
    sub,
    missing: false,
    color: "#0a0a0b",
    size: "24px",
  };
}

function unavailableMetric(label: string) {
  return {
    ...metric(label, "Not established"),
    missing: true,
  };
}

function testVm(): SourceWorkspaceVM {
  return {
    vendorName: "Salesforce, Inc.",
    vendorCat: "Technology",
    vendorRef: "VEN-SALESFORCE",
    tenantName: "Demo Health",
    asOfDateIso: "2027-06-30T00:00:00Z",
    conc: {
      byVendor: [{ vendorRef: "VEN-SALESFORCE" }],
    },
    tabs: [
      {
        label: "Overview",
        onClick: noop,
        line: "#005bd3",
        fg: "#06172f",
        weight: 800,
      },
      {
        label: "Contracts",
        onClick: noop,
        line: "transparent",
        fg: "#53657f",
        weight: 650,
      },
      {
        label: "Dependencies",
        onClick: noop,
        line: "transparent",
        fg: "#53657f",
        weight: 650,
      },
      {
        label: "Opportunities",
        onClick: noop,
        line: "transparent",
        fg: "#53657f",
        weight: 650,
      },
    ],
    valueStrip: [
      metric("Annual contract value", "$48.7M", "12 contracts shown"),
      metric("Total committed value", "$91.2M"),
      metric("Auto-renewing contracts", "6"),
      unavailableMetric("Actual annual spend"),
      unavailableMetric("Renewal exposure"),
      metric("Weak leverage signals", "0", "Highest on any material contract"),
    ],
    vendorContractRows: [
      {
        onClick: noop,
        cells: [
          { text: "Salesforce, Inc." },
          { text: "Enterprise Agreement" },
          { text: "CTR-090" },
          { text: "$19.5M" },
          { text: "$9.9M" },
          { text: "30 Jun 2027" },
          { text: "31 Dec 2027" },
          { text: "Auto-renew" },
          { text: "0 of 4" },
          { text: "Monitor" },
        ],
      },
    ],
    vendorComposition: [],
    vendorDependencyMap: {
      vendorRef: "VEN-SALESFORCE",
      contracts: [
        { id: "CTR-090", name: "Enterprise Agreement", onClick: noop },
      ],
      criticalApplications: 0,
      platforms: [],
      initiatives: [],
    },
    vendorOpps: [],
    vendorHasOpps: false,
    vOverview: true,
    vContracts: false,
    vDeps: false,
    vOppsTab: false,
  } as unknown as SourceWorkspaceVM;
}

describe("VendorCanvas executive cockpit", () => {
  it("renders only populated cross-contract facts in the vendor summary", () => {
    render(<VendorCanvas vm={testVm()} />);

    expect(screen.getByTestId("source-vendor360-exec-cockpit")).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: "Vendor 360 sections" }),
    ).toBeTruthy();
    expect(screen.getByText("Salesforce, Inc.")).toBeTruthy();
    expect(screen.getByText("Annual contract value")).toBeTruthy();
    expect(screen.getByText("Total committed value")).toBeTruthy();
    expect(screen.getByText("Auto-renewing contracts")).toBeTruthy();
    expect(screen.getByText("Active contracts (1)")).toBeTruthy();

    expect(screen.queryByText("Actual annual spend")).toBeNull();
    expect(screen.queryByText("$9.9M")).toBeNull();
    expect(screen.queryByRole("button", { name: "Opportunities" })).toBeNull();
    expect(screen.queryByText("Savings realized")).toBeNull();
    expect(screen.queryByText("Risk score")).toBeNull();
    expect(screen.queryByText("Run Optimize")).toBeNull();
  });
});

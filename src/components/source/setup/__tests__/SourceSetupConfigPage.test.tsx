/**
 * @jest-environment jsdom
 */

// The flag-gated "Source configuration" realign must render three list-row
// cards, and its status chips must obey the honesty contract:
//   - a real, sourced value renders that value (e.g. "2 CONNECTED", "AMS");
//   - an unsourced value renders "NOT CONFIGURED" — NEVER a fabricated count.

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";

import { SourceSetupConfigPage } from "../SourceSetupConfigPage";

// AppShell + SourceSubNav pull in heavy shell chrome that isn't the unit under
// test; stub them to plain passthroughs so we assert on the config cards.
jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/source/SourceSubNav", () => ({
  SourceSubNav: () => null,
}));

describe("SourceSetupConfigPage — three-card realign + honesty", () => {
  it("renders the header and all three config cards with their sub-lines", () => {
    render(<SourceSetupConfigPage tenantName="Lakeshore" />);

    expect(
      screen.getByRole("heading", { name: "Source configuration" }),
    ).toBeInTheDocument();

    // Card 1: Evidence sources
    const evidence = screen.getByRole("article", { name: "Evidence sources" });
    expect(
      within(evidence).getByText(/CMDB, ServiceNow, contract store/),
    ).toBeInTheDocument();

    // Card 2: Approvers
    const approvers = screen.getByRole("article", { name: "Approvers" });
    expect(
      within(approvers).getByText("Who can confirm a gate, per entity"),
    ).toBeInTheDocument();

    // Card 3: Archetype defaults
    const archetype = screen.getByRole("article", {
      name: "Archetype defaults",
    });
    expect(
      within(archetype).getByText("Which archetype loads for a new event"),
    ).toBeInTheDocument();

    // Every card offers a Manage affordance.
    expect(screen.getAllByRole("button", { name: "Manage" })).toHaveLength(3);
  });

  it("renders honest 'NOT CONFIGURED' placeholders when no real state is sourced", () => {
    render(<SourceSetupConfigPage tenantName="Lakeshore" />);

    // All three chips are placeholders — no fabricated count anywhere.
    expect(screen.getAllByText("NOT CONFIGURED")).toHaveLength(3);
    // Never invents a "N of M connected" number when there is no backing.
    expect(screen.queryByText(/\d+ of \d+ connected/)).not.toBeInTheDocument();
  });

  it("shows real chip state when sourced values are provided", () => {
    render(
      <SourceSetupConfigPage
        tenantName="Lakeshore"
        evidenceSources={{ connected: 2, total: 4 }}
        approversConfigured
        archetypeDefault="AMS"
      />,
    );

    const evidence = screen.getByRole("article", { name: "Evidence sources" });
    expect(within(evidence).getByText("2 CONNECTED")).toBeInTheDocument();
    expect(
      within(evidence).getByText(/2 of 4 connected/),
    ).toBeInTheDocument();

    const approvers = screen.getByRole("article", { name: "Approvers" });
    expect(within(approvers).getByText("CONFIGURED")).toBeInTheDocument();

    const archetype = screen.getByRole("article", {
      name: "Archetype defaults",
    });
    expect(within(archetype).getByText("AMS")).toBeInTheDocument();

    // With everything sourced, no placeholder chips remain.
    expect(screen.queryByText("NOT CONFIGURED")).not.toBeInTheDocument();
  });
});

/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { CurrentState } from "../CurrentState";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";

/**
 * CurrentState is the "what has been loaded" survey the user asked for after seeing the first
 * live preview -- grouped by domain, not a flat list. These pin the two things that matter: a
 * fact spanning multiple domains genuinely appears under each one (not just its "primary" domain),
 * and the default-expanded categories actually show real content without an extra click.
 */
describe("CurrentState", () => {
  const bundle = getHomeReviewBundle("meridian-health")!;

  it("shows a category card with a real count for a domain present in the tenant's data", () => {
    render(<CurrentState signalPacket={bundle.thesis.signalPacket} />);
    expect(screen.getByText("Applications & Systems")).toBeInTheDocument();
    expect(screen.getByText("Vendors & Contracts")).toBeInTheDocument();
  });

  it("shows real facts for a category expanded by default (Applications & Systems)", () => {
    render(<CurrentState signalPacket={bundle.thesis.signalPacket} />);
    const appSignal = bundle.thesis.signalPacket.signals.find((s) => s.domains.includes("application_system"));
    expect(appSignal).toBeTruthy();
    expect(screen.getByText(appSignal!.statement)).toBeInTheDocument();
  });

  it("reveals a collapsed category's facts on click", () => {
    render(<CurrentState signalPacket={bundle.thesis.signalPacket} />);
    const riskSignal = bundle.thesis.signalPacket.signals.find((s) => s.domains.includes("risk_or_control"));
    expect(riskSignal).toBeTruthy();
    expect(screen.queryByText(riskSignal!.statement)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk & Controls/ }));
    expect(screen.getByText(riskSignal!.statement)).toBeInTheDocument();
  });

  it("shows a fact spanning two domains under both of its category cards, not just one", () => {
    render(<CurrentState signalPacket={bundle.thesis.signalPacket} />);
    // sig_complexity_042 in the real fixture spans vendor_contract (default-expanded) and
    // spend_value_fact (collapsed by default) -- it must appear once already, then again after
    // opening the second category, proving it's genuinely double-listed, not deduplicated to one.
    const signal = bundle.thesis.signalPacket.signals.find((s) => s.id === "sig_complexity_042")!;
    expect(signal.domains).toEqual(["vendor_contract", "spend_value_fact"]);
    expect(screen.getAllByText(signal.statement)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Spend & Value/ }));
    expect(screen.getAllByText(signal.statement)).toHaveLength(2);
  });
});

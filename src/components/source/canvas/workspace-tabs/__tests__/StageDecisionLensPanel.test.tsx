/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { StageDecisionLensPanel } from "../StageDecisionLensPanel";

describe("StageDecisionLensPanel", () => {
  it("renders pricing completeness as a vendor comparability drilldown", () => {
    render(<StageDecisionLensPanel stage="pricing" />);

    expect(screen.getByTestId("source-stage-decision-lens")).toHaveTextContent(
      "Why is this vendor not comparable?",
    );
    expect(
      screen.getByTestId("source-pricing-completeness-summary"),
    ).toHaveTextContent("Comparable vendors");
    expect(
      screen.getByTestId("source-pricing-completeness-summary"),
    ).toHaveTextContent("0/3");
    expect(
      screen.getByTestId("source-pricing-completeness-summary"),
    ).toHaveTextContent("Cross-vendor gaps");

    const vendorB = screen.getByTestId("source-pricing-vendor-vendor-b");
    expect(vendorB).toHaveTextContent("Vendor B");
    expect(vendorB).toHaveTextContent("not comparable");
    expect(vendorB).toHaveTextContent(
      "SOC-2 compliance cost gap and security tower exclusion",
    );
    expect(vendorB).toHaveTextContent("Security operations monitoring");
    expect(vendorB).toHaveTextContent("142 applications in scope");
    expect(vendorB).toHaveTextContent(
      "request compliance cost estimate before BAFO final",
    );

    const vendorC = screen.getByTestId("source-pricing-vendor-vendor-c");
    expect(vendorC).toHaveTextContent("Below-median pricing basis unconfirmed");
    expect(vendorC).toHaveTextContent("6-month transition period");

    expect(
      screen.getByTestId("source-pricing-cross-vendor-gaps"),
    ).toHaveTextContent("Application count varies by vendor");
    expect(
      screen.getByTestId("source-pricing-cross-vendor-gaps"),
    ).toHaveTextContent("common 160-application basis");
    expect(
      screen.getByRole("button", { name: "Send clarification request" }),
    ).toBeDisabled();
    expect(screen.getByTestId("source-stage-decision-lens")).toHaveTextContent(
      "Deterministic seed",
    );
  });

  it("does not render on non-decision-lens stages", () => {
    const { container } = render(<StageDecisionLensPanel stage="scope" />);

    expect(container).toBeEmptyDOMElement();
  });
});

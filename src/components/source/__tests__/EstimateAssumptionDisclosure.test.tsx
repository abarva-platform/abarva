/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { EstimateAssumptionDisclosure } from "../EstimateAssumptionDisclosure";

describe("EstimateAssumptionDisclosure", () => {
  it("marks Source values as directional estimates and exposes assumptions", () => {
    render(
      <EstimateAssumptionDisclosure
        basis="Savings estimate uses normalized three-year TCO and fixture BAFO scenario values."
        assumptions={[
          "Vendor scope remains comparable through BAFO.",
          "Transition one-time cost is separated from steady-state run cost.",
        ]}
      />,
    );

    expect(screen.getByTestId("source-estimate-assumption-disclosure")).toHaveAttribute(
      "data-source-estimate-disclosure",
      "true",
    );
    expect(screen.getByText(/directional estimate only/i)).toBeInTheDocument();
    expect(screen.getByText(/vendor scope remains comparable/i)).toBeInTheDocument();
    expect(screen.getByText(/transition one-time cost/i)).toBeInTheDocument();
  });
});

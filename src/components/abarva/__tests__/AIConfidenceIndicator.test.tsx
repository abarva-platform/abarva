/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import {
  AIConfidenceIndicator,
  normalizeAIConfidenceTier,
} from "../AIConfidenceIndicator";

describe("AIConfidenceIndicator", () => {
  it("renders the confidence tier and rationale visibly", () => {
    render(
      <AIConfidenceIndicator
        tier="MEDIUM"
        rationale="Evidence is usable with missing baseline data"
      />,
    );

    expect(screen.getByText("Medium confidence")).toBeInTheDocument();
    expect(
      screen.getByText("Evidence is usable with missing baseline data"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "Medium confidence: Evidence is usable with missing baseline data",
      ),
    ).toHaveAttribute("data-ai-confidence-tier", "MEDIUM");
  });

  it("normalizes lower-case and unknown tiers", () => {
    expect(normalizeAIConfidenceTier("high")).toBe("HIGH");
    expect(normalizeAIConfidenceTier("medium")).toBe("MEDIUM");
    expect(normalizeAIConfidenceTier("low")).toBe("LOW");
    expect(normalizeAIConfidenceTier("unknown")).toBe("LOW");
  });
});

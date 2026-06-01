/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { AISuggestionFrame } from "../AISuggestionFrame";

describe("AISuggestionFrame", () => {
  it("wraps AI suggestions in an accessible review frame", () => {
    render(
      <AISuggestionFrame detail="Human decision required">
        <p>Recommended supplier shortlist</p>
      </AISuggestionFrame>,
    );

    expect(
      screen.getByRole("note", { name: "AI-generated suggestion" }),
    ).toHaveAttribute("data-ai-suggestion-frame", "suggested");
    expect(screen.getByText("Suggested")).toBeInTheDocument();
    expect(screen.getByText("Human decision required")).toBeInTheDocument();
    expect(
      screen.getByText("Recommended supplier shortlist"),
    ).toBeInTheDocument();
  });
});

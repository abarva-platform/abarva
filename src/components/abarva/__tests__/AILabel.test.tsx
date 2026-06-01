/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { AILabel } from "../AILabel";

describe("AILabel", () => {
  it("renders the AI Draft label with visible review guidance", () => {
    render(<AILabel status="draft" />);

    expect(screen.getByText("AI Draft")).toBeInTheDocument();
    expect(screen.getByText("Review before commit")).toBeInTheDocument();
    expect(
      screen.getByLabelText("AI Draft: Review before commit"),
    ).toHaveAttribute("data-ai-label-status", "draft");
  });

  it("renders pending-review and suggested states", () => {
    render(
      <>
        <AILabel status="pending_review" />
        <AILabel status="suggested" detail="Cite and verify" />
      </>,
    );

    expect(screen.getByText("Pending Review")).toBeInTheDocument();
    expect(screen.getByText("Human approval required")).toBeInTheDocument();
    expect(screen.getByText("Suggested")).toBeInTheDocument();
    expect(screen.getByText("Cite and verify")).toBeInTheDocument();
  });
});

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
    expect(
      screen.getByText("Drafted by AI. Review before using."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", {
        name: "AI Draft: Drafted by AI. Review before using.",
      }),
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
    expect(
      screen.getByText("Pending your review. No action taken yet."),
    ).toBeInTheDocument();
    expect(screen.getByText("Suggested")).toBeInTheDocument();
    expect(screen.getByText("Cite and verify")).toBeInTheDocument();
  });

  it("supports backlog-style variants and custom labels without breaking status callers", () => {
    render(
      <>
        <AILabel variant="suggestion" />
        <AILabel variant="pending" tooltip="Legal owner must review" />
        <AILabel
          variant="custom"
          label="AI Clause"
          tooltip="Generated clause language"
          className="audit-label"
        />
      </>,
    );

    expect(
      screen.getByRole("status", {
        name: "Suggested: Suggested by AI. You decide whether to apply.",
      }),
    ).toHaveAttribute("data-ai-label-status", "suggested");
    expect(
      screen.getByRole("status", {
        name: "Pending Review: Legal owner must review",
      }),
    ).toHaveAttribute("data-ai-label-status", "pending_review");
    expect(
      screen.getByRole("status", { name: "AI Clause: Generated clause language" }),
    ).toHaveClass("audit-label");
  });
});

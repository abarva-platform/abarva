/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { LineageMark } from "../FactLineage";
import { applicationCountLineage } from "../fact-lineage";

const rows = Array.from({ length: 306 }, () => ({}));

/**
 * Home follows Tower's provenance contract rather than inventing a second one: a trailing mark on
 * the value, a panel on click, outside-click and Escape to close. A reader who learns it on Tower
 * should not have to learn it again here.
 */
describe("the provenance mark follows Tower's contract", () => {
  it("opens a panel from a trailing mark on the value", () => {
    render(<LineageMark lineage={applicationCountLineage(rows, 750)}><span>306</span></LineageMark>);
    expect(document.querySelector("[data-home-lineage-panel]")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(document.querySelector("[data-home-lineage-panel]")).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<LineageMark lineage={applicationCountLineage(rows)}><span>306</span></LineageMark>);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.querySelector("[data-home-lineage-panel]")).not.toBeInTheDocument();
  });

  it("closes on an outside click", () => {
    render(<div><LineageMark lineage={applicationCountLineage(rows)}><span>306</span></LineageMark><button type="button">elsewhere</button></div>);
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.mouseDown(screen.getByText("elsewhere"));
    expect(document.querySelector("[data-home-lineage-panel]")).not.toBeInTheDocument();
  });

  // Grain first: it is the reason two honest counts differ, and reading it second invites the
  // reader to compare numbers before they know the numbers measure different things.
  it("leads the panel with what one row means, before the source", () => {
    render(<LineageMark lineage={applicationCountLineage(rows, 750)}><span>306</span></LineageMark>);
    fireEvent.click(screen.getByRole("button"));
    const text = document.querySelector("[data-home-lineage-panel]")?.textContent ?? "";
    expect(text.indexOf("What one row means")).toBeLessThan(text.indexOf("Source and rule"));
    expect(text).toMatch(/one application record/);
  });

  it("shows the other count and the reason it differs, not just a warning", () => {
    render(<LineageMark lineage={applicationCountLineage(rows, 750)}><span>306</span></LineageMark>);
    fireEvent.click(screen.getByRole("button"));
    const text = document.querySelector("[data-home-lineage-panel]")?.textContent ?? "";
    expect(text).toMatch(/750/);
    expect(text).toMatch(/deployed instance/);
  });

  it("carries the standing on the mark before it is opened", () => {
    const { rerender } = render(<LineageMark lineage={applicationCountLineage(rows, 750)}><span>306</span></LineageMark>);
    expect(document.querySelector("[data-home-lineage]")?.getAttribute("data-home-lineage")).toBe("conflict");
    rerender(<LineageMark lineage={applicationCountLineage(rows)}><span>306</span></LineageMark>);
    expect(document.querySelector("[data-home-lineage]")?.getAttribute("data-home-lineage")).toBe("single_source");
  });
});

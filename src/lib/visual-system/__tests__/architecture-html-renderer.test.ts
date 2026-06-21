import { validateArchitectureModel } from "../architecture-model";
import { renderArchitectureHtml } from "../architecture-html-renderer";
import { FIRST_CAPITAL_ARCHITECTURE } from "../__fixtures__/first-capital-architecture";

describe("architecture model + HTML renderer (W2)", () => {
  it("the First Capital sample model is referentially valid (no errors)", () => {
    const issues = validateArchitectureModel(FIRST_CAPITAL_ARCHITECTURE);
    expect(issues.filter((i) => i.level === "error")).toHaveLength(0);
  });

  it("renders a self-contained HTML document", () => {
    const html = renderArchitectureHtml(FIRST_CAPITAL_ARCHITECTURE);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("</html>");
    expect(html).toContain("<style>");
  });

  it("renders the current-to-target journey (as-is AND to-be)", () => {
    const html = renderArchitectureHtml(FIRST_CAPITAL_ARCHITECTURE);
    expect(html).toContain("Current state (as-is)");
    expect(html).toContain("Target state (to-be)");
  });

  it("renders data flow DISTINCT from AI control/decision flow", () => {
    const html = renderArchitectureHtml(FIRST_CAPITAL_ARCHITECTURE);
    expect(html).toContain("End-to-end data flow");
    // section title's ampersand is HTML-escaped
    expect(html).toContain("AI decision &amp; control flow");
    expect(html).toContain("how the services come alive");
    // both flow kinds present as distinct badges
    expect(html).toContain("fk-data");
    expect(html).toContain("fk-control");
  });

  it("renders the agentic overlay (how services come alive)", () => {
    const html = renderArchitectureHtml(FIRST_CAPITAL_ARCHITECTURE);
    expect(html).toContain("Agentic overlay");
    expect(html).toContain("Human-in-the-loop");
    expect(html).toMatch(/Calls/);
  });

  it("draws named services from the model (cloud not hardcoded)", () => {
    const html = renderArchitectureHtml(FIRST_CAPITAL_ARCHITECTURE);
    expect(html).toContain("Databricks on AWS");
    expect(html).toContain("Amazon Bedrock");
    // provenance note present so it never reads as predetermined
    expect(html).toContain("reflect the solution we designed");
  });

  it("consolidates missing inputs into one Open Inputs list (no scatter)", () => {
    const html = renderArchitectureHtml(FIRST_CAPITAL_ARCHITECTURE);
    expect(html).toContain("Open Inputs Required");
    expect(html).toContain("Annual L/C volume");
  });

  it("renders implementation waves and control points", () => {
    const html = renderArchitectureHtml(FIRST_CAPITAL_ARCHITECTURE);
    expect(html).toContain("Wave 1 — Foundation");
    expect(html).toContain("SR 11-7 model risk");
  });
});

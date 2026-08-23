import { validateArchitectureModel } from "../architecture-model";
import type { ArchitectureModel } from "../architecture-model";
import {
  deriveArchitectureContractSignals,
  renderArchitectureHtml,
} from "../architecture-html-renderer";
import { ARCHITECTURE_V2_EXHIBITS } from "../architecture-model";
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

  it("marks HTML as preview-only and removes internal decision identifiers", () => {
    const html = renderArchitectureHtml({
      ...FIRST_CAPITAL_ARCHITECTURE,
      provenanceNote:
        "Reflects Option A, Decision 097447bd-1755-4f58-bdd0-d3db17990d7e, hash 9fab255…4d58e4ab.",
    });
    expect(html).toContain("HTML preview only");
    expect(html).toContain("Client-final export is DOCX or PPTX");
    expect(html).toContain("approved solution decision");
    expect(html).toContain("validated decision record");
    expect(html).not.toContain("097447bd-1755-4f58-bdd0-d3db17990d7e");
    expect(html).not.toContain("9fab255");
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

  it("validates ArchitectureModel v2 fields as hard requirements", () => {
    const missingPhysical: ArchitectureModel = {
      ...FIRST_CAPITAL_ARCHITECTURE,
      architectureLevels: {
        conceptual: FIRST_CAPITAL_ARCHITECTURE.architectureLevels?.conceptual,
        logical: FIRST_CAPITAL_ARCHITECTURE.architectureLevels?.logical,
      },
    };
    const missingLevelIssues = validateArchitectureModel(missingPhysical);
    expect(
      missingLevelIssues.some((i) =>
        /Missing physical architecture level/i.test(i.message),
      ),
    ).toBe(true);

    const brokenBridge: ArchitectureModel = {
      ...FIRST_CAPITAL_ARCHITECTURE,
      gapToTargetBridge: [
        {
          id: "broken",
          gapId: "g1",
          observation: "Documents arrive manually.",
          gap: "",
          designImplication: "",
          targetCapability: "",
          architectureResponse: "",
        },
      ],
    };
    const brokenBridgeIssues = validateArchitectureModel(brokenBridge);
    expect(
      brokenBridgeIssues.some((i) =>
        /Gap bridge broken is missing/i.test(i.message),
      ),
    ).toBe(true);
  });

  it("renders all 13 architecture exhibits as SVG-backed blocks with so-what captions", () => {
    const html = renderArchitectureHtml(FIRST_CAPITAL_ARCHITECTURE);
    for (const exhibit of ARCHITECTURE_V2_EXHIBITS) {
      const block = html.match(
        new RegExp(
          `<section[^>]+data-exhibit="${exhibit}"[\\s\\S]*?<\\/section>`,
          "i",
        ),
      )?.[0];
      expect(block).toBeDefined();
      expect(block).toContain("<svg");
      expect(block).toContain("So what:");
      expect(block).toContain("Decision implication:");
    }
  });

  it("derives quality signals from rendered model content", () => {
    const html = renderArchitectureHtml(FIRST_CAPITAL_ARCHITECTURE);
    const signals = deriveArchitectureContractSignals(
      FIRST_CAPITAL_ARCHITECTURE,
      html,
    );
    expect(signals).toMatchObject({
      hasStorySpine: true,
      currentStateVisualPresent: true,
      gapToTargetBridgePresent: true,
      conceptualArchPresent: true,
      logicalArchPresent: true,
      physicalArchPresent: true,
      exhibitsRenderedAsVisual: true,
      exhibitsInterpreted: true,
    });
  });

  it("does not claim a missing physical level is present", () => {
    const missingPhysical: ArchitectureModel = {
      ...FIRST_CAPITAL_ARCHITECTURE,
      architectureLevels: {
        conceptual: FIRST_CAPITAL_ARCHITECTURE.architectureLevels?.conceptual,
        logical: FIRST_CAPITAL_ARCHITECTURE.architectureLevels?.logical,
      },
    };
    const html = renderArchitectureHtml(missingPhysical);
    const signals = deriveArchitectureContractSignals(missingPhysical, html);
    expect(signals.physicalArchPresent).toBe(false);
    expect(signals.exhibitsRenderedAsVisual).toBe(true);
  });
});

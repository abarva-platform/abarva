import {
  buildIndustrialCioBackofficeNativeCanvasBlock,
  buildIndustrialCioBackofficePromptAddendum,
  buildIndustrialCioBackofficeSource,
  isIndustrialCioBackofficeQuestion,
  isIndustrialTenantKey,
} from "../industrial-cio-backoffice-source";
import { extractExecutiveCanvasPayloads } from "@/lib/intelligence/executive-canvas-payload";

describe("Industrial CIO back-office ask source", () => {
  it("recognizes Industrial Demo, Lakeshore, and Morgan Street tenant aliases", () => {
    expect(isIndustrialTenantKey("lakeshore-industries")).toBe(true);
    expect(isIndustrialTenantKey("Industrial Demo")).toBe(true);
    expect(isIndustrialTenantKey("Morgan Street")).toBe(true);
    expect(isIndustrialTenantKey("skyharbor-air")).toBe(false);
  });

  it("recognizes Morgan Street CIO back-office questions without matching unrelated prompts", () => {
    expect(
      isIndustrialCioBackofficeQuestion(
        "How should Morgan Street stand up the value office?",
      ),
    ).toBe(true);
    expect(
      isIndustrialCioBackofficeQuestion(
        "Which treasury and finance automations should we fund first?",
      ),
    ).toBe(true);
    expect(
      isIndustrialCioBackofficeQuestion(
        "Should HR and legal be in the shared services AI roadmap?",
      ),
    ).toBe(true);
    expect(
      isIndustrialCioBackofficeQuestion(
        "Summarize the last conversation in one sentence.",
      ),
    ).toBe(false);
  });

  it("builds a high-priority tenant source only for Industrial readiness questions", () => {
    const source = buildIndustrialCioBackofficeSource(
      "Which shared services AI use cases should the CIO fund first?",
      ["lakeshore-industries"],
    );

    expect(source).toMatchObject({
      type: "TENANT",
      id: "industrial-cio-backoffice-readiness",
      name: "Industrial Demo CIO Shared Services value-office context",
      confidence: 0.91,
    });
    expect(source?.detail).toContain("Morgan Street goal");
    expect(source?.detail).toContain("Kyriba");
    expect(source?.detail).toContain("Finance-attested baseline");
    expect(source?.detail).toContain(
      "HR and Legal source-system/process evidence",
    );
    expect(source?.detail).not.toContain("SkyHarbor");

    expect(
      buildIndustrialCioBackofficeSource(
        "Which shared services AI use cases should the CIO fund first?",
        ["skyharbor-air"],
      ),
    ).toBeNull();
    expect(
      buildIndustrialCioBackofficeSource("What is blocking IROPS scale?", [
        "lakeshore-industries",
      ]),
    ).toBeNull();
  });

  it("adds a prompt addendum that asks Claude to own assumptions and right-canvas tabs", () => {
    const addendum = buildIndustrialCioBackofficePromptAddendum(
      "How should the CIO launch the Morgan Street value office?",
      ["industrial demo"],
    );

    expect(addendum).toContain("INDUSTRIAL CIO / MORGAN STREET DEMO MODE");
    expect(addendum).toContain("user-visible advisor identity is aVa");
    expect(addendum).toContain("Treasury and Finance as the Phase 1 proof");
    expect(addendum).toContain("HR and Legal need source evidence");
    expect(addendum).toContain("planning assumptions");
    expect(addendum).toContain(
      "Decision, Industry Insights, Chart, Table, and Evidence",
    );
    expect(addendum).toContain("investmentSequencingMap");
    expect(addendum).toContain("valueReadinessMatrix");
    expect(addendum).toContain("gateToValueRoadmap");
    expect(addendum).toContain("proofBoundary");
    expect(addendum).toContain("include initiative owner and gate");
    expect(addendum).not.toContain("When useful");
  });

  it("builds a valid native sequencing canvas fallback for the CIO demo", () => {
    const block = buildIndustrialCioBackofficeNativeCanvasBlock(
      "How should the CIO prioritize AI and automation across HR, finance, treasury, legal, and shared services?",
      ["industrial demo"],
    );

    const extracted = extractExecutiveCanvasPayloads(block);

    expect(extracted.visibleContent).toBe("");
    expect(extracted.payloads[0]).toMatchObject({
      canvasType: "investmentSequencingMap",
      title: "CIO AI & Automation Sequencing — Industrial Demo",
      columns: [
        { label: "Scale now" },
        { label: "Certify then scale" },
        { label: "Fund readiness" },
        { label: "Hold / discovery" },
      ],
      proofBoundary: {
        decisionRequired: expect.stringContaining("Treasury + Finance"),
      },
    });
  });

  it("builds native matrix and roadmap fallbacks for tradeoff and prerequisite questions", () => {
    const matrixBlock = buildIndustrialCioBackofficeNativeCanvasBlock(
      "Which shared-services AI bets are high value but not ready across HR, finance, treasury, legal, and shared services?",
      ["industrial demo"],
    );
    const roadmapBlock = buildIndustrialCioBackofficeNativeCanvasBlock(
      "What has to happen first before the CIO scales AI across Finance, Treasury, HR, Legal, and shared services?",
      ["industrial demo"],
    );

    const matrix = extractExecutiveCanvasPayloads(matrixBlock).payloads[0];
    const roadmap = extractExecutiveCanvasPayloads(roadmapBlock).payloads[0];

    expect(matrix).toMatchObject({
      canvasType: "valueReadinessMatrix",
      title: "Shared Services AI Value / Readiness Map — Industrial Demo",
      items: expect.arrayContaining([
        expect.objectContaining({
          label: expect.stringContaining("HR"),
          action: "Hold for discovery",
        }),
      ]),
    });
    expect(roadmap).toMatchObject({
      canvasType: "gateToValueRoadmap",
      title: "Shared Services AI Gate-to-Value Roadmap — Industrial Demo",
      gates: expect.arrayContaining([
        expect.objectContaining({
          label: "Load HR and Legal evidence",
          status: "Discovery",
        }),
      ]),
    });
  });
});

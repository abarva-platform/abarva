import {
  buildIndustrialCioBackofficeNativeCanvasBlock,
  buildIndustrialCioBackofficePromptAddendum,
  buildIndustrialCioBackofficeSource,
  isIndustrialCioBackofficeQuestion,
  isIndustrialTenantKey,
} from "../industrial-cio-backoffice-source";
import { extractExecutiveCanvasPayloads } from "@/lib/intelligence/executive-canvas-payload";

describe("Lakeshore Holdings CIO back-office ask source", () => {
  it("recognizes only current Lakeshore Holdings tenant aliases", () => {
    expect(isIndustrialTenantKey("lakeshore")).toBe(true);
    expect(isIndustrialTenantKey("lakeshore-holdings")).toBe(true);
    expect(isIndustrialTenantKey("Lakeshore Holdings")).toBe(true);
    expect(isIndustrialTenantKey("lakeshore-industries")).toBe(false);
    expect(isIndustrialTenantKey("Industrial Demo")).toBe(false);
    expect(isIndustrialTenantKey("Morgan Street")).toBe(false);
    expect(isIndustrialTenantKey("skyharbor-air")).toBe(false);
  });

  it("recognizes Lakeshore Holdings CIO back-office questions without matching unrelated prompts", () => {
    expect(
      isIndustrialCioBackofficeQuestion(
        "How should Lakeshore Holdings stand up the value office?",
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
      ["lakeshore-holdings"],
    );

    expect(source).toMatchObject({
      type: "TENANT",
      id: "industrial-cio-backoffice-readiness",
      name: "Lakeshore Holdings CIO Shared Services value-office context",
      confidence: 0.91,
    });
    expect(source?.detail).toContain("Lakeshore Holdings goal");
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
        "lakeshore-holdings",
      ]),
    ).toBeNull();
  });

  it("adds a prompt addendum that asks Claude to own assumptions and right-canvas tabs", () => {
    const addendum = buildIndustrialCioBackofficePromptAddendum(
      "How should the CIO launch the Lakeshore Holdings value office?",
      ["lakeshore"],
    );

    expect(addendum).toContain("LAKESHORE HOLDINGS CIO MODE");
    expect(addendum).toContain("user-visible advisor identity is aVa");
    expect(addendum).toContain("Treasury and Finance as the Phase 1 proof");
    expect(addendum).toContain("HR and Legal need source evidence");
    expect(addendum).toContain("planning assumptions");
    expect(addendum).toContain(
      "Decision, Industry Insights, Chart, Table, and Evidence",
    );
    expect(addendum).toContain("executive-canvas-sequencing");
    expect(addendum).toContain("value-readiness-matrix");
    expect(addendum).toContain("gate-to-value-roadmap");
    expect(addendum).toContain("proof-boundary-card");
    expect(addendum).toContain("include initiative owner and gate");
    expect(addendum).not.toContain("When useful");
  });

  it("builds a valid native sequencing canvas fallback for the CIO demo", () => {
    const block = buildIndustrialCioBackofficeNativeCanvasBlock(
      "How should the CIO prioritize AI and automation across HR, finance, treasury, legal, and shared services?",
      ["lakeshore"],
    );

    const extracted = extractExecutiveCanvasPayloads(block);

    expect(extracted.visibleContent).toBe("");
    expect(extracted.payloads[0]).toMatchObject({
      canvasType: "executive-canvas-sequencing",
      title: "CIO AI & Automation Sequencing — Lakeshore Holdings",
      lanes: [
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
      ["lakeshore"],
    );
    const roadmapBlock = buildIndustrialCioBackofficeNativeCanvasBlock(
      "What has to happen first before the CIO scales AI across Finance, Treasury, HR, Legal, and shared services?",
      ["lakeshore"],
    );

    const matrix = extractExecutiveCanvasPayloads(matrixBlock).payloads[0];
    const roadmap = extractExecutiveCanvasPayloads(roadmapBlock).payloads[0];

    expect(matrix).toMatchObject({
      canvasType: "value-readiness-matrix",
      title: "Shared Services AI Value / Readiness Map — Lakeshore Holdings",
      items: expect.arrayContaining([
        expect.objectContaining({
          label: expect.stringContaining("HR"),
          action: "Hold for discovery",
        }),
      ]),
    });
    expect(roadmap).toMatchObject({
      canvasType: "gate-to-value-roadmap",
      title: "Shared Services AI Gate-to-Value Roadmap — Lakeshore Holdings",
      gates: expect.arrayContaining([
        expect.objectContaining({
          label: "Load HR and Legal evidence",
          status: "Discovery",
        }),
      ]),
    });
  });
});

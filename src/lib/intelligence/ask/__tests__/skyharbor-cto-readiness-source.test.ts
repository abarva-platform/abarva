import {
  buildSkyHarborCtoReadinessNativeCanvasBlock,
  buildSkyHarborCtoReadinessPromptAddendum,
  buildSkyHarborCtoReadinessSource,
  isSkyHarborCtoReadinessQuestion,
  isSkyHarborTenantKey,
} from "../skyharbor-cto-readiness-source";
import { extractExecutiveCanvasPayloads } from "@/lib/intelligence/executive-canvas-payload";

describe("SkyHarbor CTO readiness ask source", () => {
  it("recognizes SkyHarbor tenant aliases", () => {
    expect(isSkyHarborTenantKey("skyharbor-air")).toBe(true);
    expect(isSkyHarborTenantKey("SkyHarbor Air Group")).toBe(true);
    expect(isSkyHarborTenantKey("Airline Demo")).toBe(true);
    expect(isSkyHarborTenantKey("lakeshore-industries")).toBe(false);
  });

  it("recognizes CTO/IROPS readiness questions without matching unrelated prompts", () => {
    expect(
      isSkyHarborCtoReadinessQuestion(
        "What is blocking agentic IROPS from scaling?",
      ),
    ).toBe(true);
    expect(
      isSkyHarborCtoReadinessQuestion(
        "What data must be certified before autonomous recovery decisions?",
      ),
    ).toBe(true);
    expect(
      isSkyHarborCtoReadinessQuestion(
        "What should the CTO fund first for AI readiness?",
      ),
    ).toBe(true);
    expect(
      isSkyHarborCtoReadinessQuestion(
        "What evidence gaps matter before a board decision?",
      ),
    ).toBe(true);
    expect(
      isSkyHarborCtoReadinessQuestion(
        "What important question is data-thin, and what evidence would close it?",
      ),
    ).toBe(true);
    expect(
      isSkyHarborCtoReadinessQuestion(
        "Summarize the last conversation in one sentence.",
      ),
    ).toBe(false);
  });

  it("builds a high-priority tenant source only for SkyHarbor readiness questions", () => {
    const source = buildSkyHarborCtoReadinessSource(
      "What is blocking agentic IROPS from scaling?",
      ["skyharbor-air"],
    );

    expect(source).toMatchObject({
      type: "TENANT",
      id: "skyharbor-cto-readiness",
      name: "Airline Demo CTO IROPS readiness context",
      confidence: 0.92,
    });
    expect(source?.detail).toContain(
      "Recommended decision posture: fund readiness before autonomous scale.",
    );
    expect(source?.detail).toContain("Operations Control Center Platform");
    expect(source?.detail).toContain(
      "Finance-approved disruption cost baseline",
    );
    expect(source?.detail).toContain("Board decision readiness spine");
    expect(source?.detail).toContain("Vendor/system linkage");
    expect(source?.detail).not.toContain("lakeshore");

    expect(
      buildSkyHarborCtoReadinessSource(
        "What is blocking agentic IROPS from scaling?",
        ["lakeshore-industries"],
      ),
    ).toBeNull();
    expect(
      buildSkyHarborCtoReadinessSource("What should legal automate?", [
        "skyharbor-air",
      ]),
    ).toBeNull();
  });

  it("adds a prompt addendum that asks Claude to own tabs and assumptions", () => {
    const addendum = buildSkyHarborCtoReadinessPromptAddendum(
      "Is the IROPS AI case board-grade today?",
      ["skyharbor-air"],
    );

    expect(addendum).toContain("AIRLINE DEMO CTO DEMO MODE");
    expect(addendum).toContain(
      'Start the first user-visible sentence with exactly "Airline Demo"',
    );
    expect(addendum).toContain('Do not use "SkyHarbor"');
    expect(addendum).toContain("user-visible advisor identity is aVa");
    expect(addendum).toContain("Airline Demo IROPS");
    expect(addendum).toContain("planning assumptions");
    expect(addendum).toContain("client-signoff-required");
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

  it("builds a valid native sequencing canvas fallback for the airline CTO demo", () => {
    const block = buildSkyHarborCtoReadinessNativeCanvasBlock(
      "Which AI investments should Tower hold or scale?",
      ["Airline Demo"],
    );

    const extracted = extractExecutiveCanvasPayloads(block);

    expect(extracted.visibleContent).toBe("");
    expect(extracted.payloads[0]).toMatchObject({
      canvasType: "investmentSequencingMap",
      title: "AI Investment Sequencing — Airline Demo",
      columns: [
        { label: "Scale now" },
        { label: "Certify then scale" },
        { label: "Fund readiness" },
        { label: "Hold / control" },
      ],
      proofBoundary: {
        decisionRequired: expect.stringContaining("readiness-first"),
      },
    });
  });

  it("builds native matrix and roadmap fallbacks for tradeoff and prerequisite questions", () => {
    const matrixBlock = buildSkyHarborCtoReadinessNativeCanvasBlock(
      "Which airline AI bets are high value but not ready across IROPS, crew recovery, passenger disruption recovery, and maintenance?",
      ["skyharbor-air"],
    );
    const roadmapBlock = buildSkyHarborCtoReadinessNativeCanvasBlock(
      "What has to happen first before we scale autonomous IROPS and passenger recovery AI?",
      ["skyharbor-air"],
    );
    const proofBlock = buildSkyHarborCtoReadinessNativeCanvasBlock(
      "Is the IROPS AI case board-grade today, and what evidence is missing?",
      ["skyharbor-air"],
    );

    const matrix = extractExecutiveCanvasPayloads(matrixBlock).payloads[0];
    const roadmap = extractExecutiveCanvasPayloads(roadmapBlock).payloads[0];
    const proof = extractExecutiveCanvasPayloads(proofBlock).payloads[0];

    expect(matrix).toMatchObject({
      canvasType: "valueReadinessMatrix",
      title: "AI Portfolio Value / Readiness Map — Airline Demo",
      items: expect.arrayContaining([
        expect.objectContaining({
          label: "IROPS Decision Assistant",
          action: "Fund readiness before autonomous scale",
        }),
      ]),
    });
    expect(roadmap).toMatchObject({
      canvasType: "gateToValueRoadmap",
      title: "IROPS AI Gate-to-Value Roadmap — Airline Demo",
      gates: expect.arrayContaining([
        expect.objectContaining({
          label: "Close model-risk and HITL controls",
          status: "Gate 3",
        }),
      ]),
    });
    expect(proof).toMatchObject({
      canvasType: "proofBoundary",
      title: "IROPS AI Proof Boundary — Airline Demo",
      proofBoundary: {
        decisionRequired: expect.stringContaining("planning assumptions"),
      },
    });
  });
});

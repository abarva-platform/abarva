import {
  extractExecutiveCanvasPayloads,
  hasExecutiveCanvasPayload,
} from "@/lib/intelligence/executive-canvas-payload";

describe("executive canvas payload extraction", () => {
  it("extracts governed AbarVa canvas JSON and removes it from visible content", () => {
    const content = [
      "Tenant evidence: use this as the decision exhibit.",
      "",
      "```abarva-canvas",
      JSON.stringify({
        canvasType: "valueReadinessMatrix",
        title: "AI portfolio",
        items: [
          {
            label: "Loyalty",
            value: 8,
            readiness: 8,
            risk: 4,
            action: "Scale now",
            owner: "Chief Digital Officer",
            gate: "Certified customer engagement data",
          },
        ],
        proofBoundary: {
          known: ["Loyalty engagement data is certified"],
          missing: ["IROPS certification"],
          decisionRequired: "Give CDAO gate authority",
        },
      }),
      "```",
      "",
      "Use the matrix to separate scale from readiness funding.",
    ].join("\n");

    expect(hasExecutiveCanvasPayload(content)).toBe(true);
    const extracted = extractExecutiveCanvasPayloads(content);

    expect(extracted.payloads).toHaveLength(1);
    expect(extracted.payloads[0]).toMatchObject({
      canvasType: "valueReadinessMatrix",
      title: "AI portfolio",
      items: [
        {
          label: "Loyalty",
          value: 8,
          readiness: 8,
          risk: 4,
          action: "Scale now",
          owner: "Chief Digital Officer",
          gate: "Certified customer engagement data",
        },
      ],
    });
    expect(extracted.visibleContent).toBe(
      "Tenant evidence: use this as the decision exhibit.\n\nUse the matrix to separate scale from readiness funding.",
    );
    expect(extracted.visibleContent).not.toContain("canvasType");
  });

  it("ignores malformed or unsupported canvas blocks", () => {
    const content = [
      "Decision support.",
      "",
      "```abarva-canvas",
      '{"canvasType":"unsupported","items":[]}',
      "```",
    ].join("\n");

    const extracted = extractExecutiveCanvasPayloads(content);
    expect(extracted.payloads).toHaveLength(0);
    expect(extracted.visibleContent).toBe("Decision support.");
  });

  it("repairs supported bare canvas JSON without exposing it as visible prose", () => {
    const content = [
      "The CIO should sequence the shared-services portfolio.",
      "",
      JSON.stringify(
        {
          canvasType: "investmentSequencingMap",
          title: "Shared services AI sequence",
          columns: [
            {
              label: "Scale now",
              items: [
                {
                  label: "Kyriba Cash & Payments",
                  value: 9,
                  readiness: 6,
                  risk: 8,
                  action: "Close control evidence gaps",
                  owner: "Treasurer",
                  gate: "Critical-bank certification",
                },
              ],
            },
          ],
          proofBoundary: {
            missing: ["HR and Legal source-system evidence"],
            decisionRequired: "Approve Treasury + Finance as Phase 1.",
          },
        },
        null,
        2,
      ),
      "",
      "Use this as the board exhibit.",
    ].join("\n");

    expect(hasExecutiveCanvasPayload(content)).toBe(true);
    const extracted = extractExecutiveCanvasPayloads(content);

    expect(extracted.payloads).toHaveLength(1);
    expect(extracted.payloads[0]).toMatchObject({
      canvasType: "investmentSequencingMap",
      title: "Shared services AI sequence",
      columns: [
        {
          label: "Scale now",
          items: [
            {
              label: "Kyriba Cash & Payments",
              owner: "Treasurer",
              gate: "Critical-bank certification",
            },
          ],
        },
      ],
    });
    expect(extracted.visibleContent).toBe(
      "The CIO should sequence the shared-services portfolio.\n\nUse this as the board exhibit.",
    );
    expect(extracted.visibleContent).not.toContain("canvasType");
    expect(extracted.visibleContent).not.toContain("investmentSequencingMap");
  });
});

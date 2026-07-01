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

  it("repairs bare canvas JSON with raw newlines inside string values", () => {
    const content = [
      "Use the decision exhibit.",
      "",
      `{"canvasType":"investmentSequencingMap","title":"CIO AI sequence","columns":[{"label":"Hold — discovery mandate","items":[{"label":"HR AI Operating Model","value":5,"readiness":2,"risk":4,"action":"Load the missing baseline","owner":"CHRO / CIO","gate":"Workday process volumes + HR service taxonomy
loaded and signed off","note":"Raw newline came from the model"}]}]}`,
      "",
      "The CIO should use this to sequence the portfolio.",
    ].join("\n");

    const extracted = extractExecutiveCanvasPayloads(content);

    expect(extracted.payloads).toHaveLength(1);
    expect(extracted.payloads[0]).toMatchObject({
      canvasType: "investmentSequencingMap",
      title: "CIO AI sequence",
      columns: [
        {
          label: "Hold — discovery mandate",
          items: [
            {
              label: "HR AI Operating Model",
              gate: "Workday process volumes + HR service taxonomy\nloaded and signed off",
            },
          ],
        },
      ],
    });
    expect(extracted.visibleContent).toBe(
      "Use the decision exhibit.\n\nThe CIO should use this to sequence the portfolio.",
    );
    expect(extracted.visibleContent).not.toContain("canvasType");
    expect(extracted.visibleContent).not.toContain("Workday process volumes");
  });

  it("hides partial bare canvas JSON during streaming", () => {
    const content = [
      "The answer is ready enough to show.",
      "",
      '{"canvasType":"investmentSequencingMap","title":"Streaming canvas","columns":[{"label":"Scale now","items":[',
    ].join("\n");

    const extracted = extractExecutiveCanvasPayloads(content);

    expect(extracted.payloads).toHaveLength(0);
    expect(extracted.visibleContent).toBe(
      "The answer is ready enough to show.",
    );
    expect(extracted.visibleContent).not.toContain("canvasType");
    expect(extracted.visibleContent).not.toContain("investmentSequencingMap");
  });

  it("removes residual standalone canvas language labels from visible content", () => {
    const content = [
      "Use this as the board exhibit.",
      "",
      "abarva-canvas",
      "",
      "The decision is to fund readiness first.",
    ].join("\n");

    const extracted = extractExecutiveCanvasPayloads(content);

    expect(extracted.payloads).toHaveLength(0);
    expect(extracted.visibleContent).toBe(
      "Use this as the board exhibit.\n\nThe decision is to fund readiness first.",
    );
    expect(extracted.visibleContent).not.toContain("abarva-canvas");
  });
});

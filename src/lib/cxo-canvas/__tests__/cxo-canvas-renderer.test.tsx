/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { CxoCanvasRenderer } from "../rendererRegistry";
import { validateCxoCanvasPayload } from "../validateCxoCanvasPayload";

describe("CXO canvas renderer", () => {
  it("renders a valid executive sequencing canvas natively", () => {
    render(
      <CxoCanvasRenderer
        payload={{
          canvasType: "executive-canvas-sequencing",
          title: "AI funding sequence",
          lanes: [
            {
              label: "Scale now",
              items: [
                {
                  label: "Loyalty AI",
                  value: 8,
                  readiness: 8,
                  risk: 4,
                  action: "Scale now",
                  owner: "Chief Digital Officer",
                  gate: "Certified customer engagement data",
                },
              ],
            },
          ],
          proofBoundary: {
            missing: ["IROPS operational data certification"],
            decisionRequired: "Give CDAO gate authority.",
          },
        }}
        context={{ surface: "intelligence" }}
      />,
    );

    expect(screen.getByTestId("executive-canvas-sequencing")).toHaveAttribute(
      "data-native-canvas-type",
      "executive-canvas-sequencing",
    );
    expect(screen.getByText("AI funding sequence")).toBeInTheDocument();
    expect(screen.getByText("Value vs. readiness")).toBeInTheDocument();
    expect(screen.getByText("Funding sequence")).toBeInTheDocument();
    expect(screen.getAllByText("Loyalty AI").length).toBeGreaterThan(0);
    expect(screen.getByText("Value 8")).toBeInTheDocument();
    expect(screen.getByText("Ready 8")).toBeInTheDocument();
    expect(screen.getByText("Risk 4")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("canvasType");
  });

  it("normalizes legacy canvas names without leaking raw JSON", () => {
    const result = validateCxoCanvasPayload({
      canvasType: "investmentSequencingMap",
      title: "Legacy canvas",
      columns: [
        {
          label: "Scale now",
          items: [{ label: "Treasury", value: 9, readiness: 7 }],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.canvasType).toBe("executive-canvas-sequencing");
      expect(result.payload.lanes?.[0]?.label).toBe("Scale now");
    }
  });

  it("uses the safe fallback for unknown canvas types", () => {
    render(
      <CxoCanvasRenderer
        payload={{
          canvasType: "freeform-html-widget",
          title: "Bad payload",
          raw: "<div>Do not render</div>",
        }}
      />,
    );

    expect(screen.getByTestId("cxo-canvas-fallback")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Executive canvas unavailable. Showing structured recommendation summary.",
      ),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("freeform-html-widget");
    expect(document.body.textContent).not.toContain("<div>");
  });

  it("does not render malformed raw strings or protocol markers", () => {
    render(
      <CxoCanvasRenderer
        payload={{
          canvasType: "executive-canvas-sequencing",
          title: "<<<TAB: Chart | grounding: tenant-evidence>>> AI plan",
          lanes: [
            {
              label: "Scale now",
              items: [
                {
                  label: "grounding: tenant-evidence Loyalty",
                  value: 8,
                  readiness: 8,
                },
              ],
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("AI plan")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("<<<TAB:");
    expect(document.body.textContent).not.toContain("grounding:");
    expect(document.body.textContent).not.toContain(">>>");
  });

  it("rejects raw strings where canvas item objects are expected", () => {
    render(
      <CxoCanvasRenderer
        payload={{
          canvasType: "executive-canvas-sequencing",
          title: "Bad lane",
          lanes: [{ label: "Scale now", items: ["Raw initiative"] }],
        }}
      />,
    );

    expect(screen.getByTestId("cxo-canvas-fallback")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("Raw initiative");
    expect(document.body.textContent).not.toContain("canvasType");
  });
});

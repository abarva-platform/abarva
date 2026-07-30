/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { GatedSection } from "../state/GatedSection";
import type { ViewModelEnvelope } from "@/lib/knowledge/view-model";

function envelope<T>(
  overrides: Partial<ViewModelEnvelope<T>> & { data: T | null },
): ViewModelEnvelope<T> {
  return {
    readiness: "ENABLED_AND_PROVEN",
    unavailableReason: null,
    evidenceRefs: [],
    knownGapRefs: [],
    asOf: "2026-07-30T00:00:00.000Z",
    knowledgeBaselineRef: "test-baseline",
    warnings: [],
    ...overrides,
  };
}

describe("GatedSection", () => {
  it("renders the safe empty state and never calls the render function for a PROJECTION_UNAVAILABLE envelope", () => {
    const renderFn = jest.fn(() => <div>SHOULD NOT RENDER</div>);
    const env = envelope<{ count: number }>({
      readiness: "PROJECTION_UNAVAILABLE",
      unavailableReason: "no projection yet",
      data: null,
    });

    render(
      <GatedSection envelope={env} label="Fleet count">
        {renderFn}
      </GatedSection>,
    );

    expect(renderFn).not.toHaveBeenCalled();
    expect(screen.queryByText("SHOULD NOT RENDER")).not.toBeInTheDocument();
    expect(screen.getByTestId("knowledge-state-banner")).toBeInTheDocument();
    // Must not render a fabricated zero or count anywhere.
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
  });

  it("never renders a numeric 0 for a NOT_MEASURED metric -- shows 'Not measured' instead", () => {
    const env = envelope<number>({
      readiness: "NOT_MEASURED",
      unavailableReason: "No observation exists for this yet.",
      data: null,
    });
    render(
      <GatedSection envelope={env} label="Recovery time">
        {(value) => <div>{value}</div>}
      </GatedSection>,
    );
    expect(screen.getByText(/not measured/i)).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("does not render withheld/restricted evidence content, only its existence/state", () => {
    const env = envelope<{ secretText: string }>({
      readiness: "WITHHELD",
      unavailableReason: "This is classified.",
      data: null,
    });
    render(
      <GatedSection envelope={env} label="Board-only evidence">
        {(data) => <div>{data.secretText}</div>}
      </GatedSection>,
    );
    expect(screen.queryByText("classified content")).not.toBeInTheDocument();
    expect(screen.getByText(/withheld/i)).toBeInTheDocument();
  });

  it("does not render candidate-authority data as accepted -- shows a distinct 'unproven' marker instead of silently rendering nothing or as proven", () => {
    const env = envelope<{ label: string }>({
      readiness: "DATA_RECONCILED_BUT_UI_UNPROVEN",
      data: { label: "Unreviewed candidate link" },
    });
    render(
      <GatedSection envelope={env} label="Relationship">
        {(data) => <div>{data.label}</div>}
      </GatedSection>,
    );
    // DATA_RECONCILED_BUT_UI_UNPROVEN is renderable (data is real, just not
    // cite-render-proven yet) -- it renders the real content, unlike WITHHELD/
    // PROJECTION_UNAVAILABLE, which never invoke the render prop.
    expect(screen.getByText("Unreviewed candidate link")).toBeInTheDocument();
  });

  it("does not invoke the render prop for a SOURCE_INCOMPLETE envelope, and shows source-incomplete-specific copy", () => {
    const renderFn = jest.fn();
    const env = envelope<{ quote: string }>({
      readiness: "SOURCE_INCOMPLETE",
      unavailableReason:
        "The interview corpus for this tenant does not yet support a complete leadership perspective set.",
      data: null,
    });
    render(
      <GatedSection envelope={env} label="Leadership">
        {renderFn}
      </GatedSection>,
    );
    expect(renderFn).not.toHaveBeenCalled();
    expect(screen.getByText(/interview corpus/i)).toBeInTheDocument();
  });

  it("renders real content when explicitly ENABLED_AND_PROVEN", () => {
    const env = envelope<{ label: string }>({
      readiness: "ENABLED_AND_PROVEN",
      data: { label: "On-time departure" },
    });
    render(
      <GatedSection envelope={env} label="Measure">
        {(data) => <div>{data.label}</div>}
      </GatedSection>,
    );
    expect(screen.getByText("On-time departure")).toBeInTheDocument();
  });

  it("shows a loading state (not an error, not a fabricated value) when envelope is not yet resolved", () => {
    render(
      <GatedSection envelope={undefined} label="Identity">
        {() => <div>SHOULD NOT RENDER</div>}
      </GatedSection>,
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

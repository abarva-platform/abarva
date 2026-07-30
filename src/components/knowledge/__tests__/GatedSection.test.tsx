/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { GatedSection } from "../state/GatedSection";
import {
  withheldEnvelope,
  type ConsumptionEnvelope,
  type BaselineMetadata,
} from "@/lib/knowledge/providers/types";

const META: BaselineMetadata = {
  tenantKey: "airline-demo-new",
  knowledgeBaselineRef: "test-baseline",
  domainPublicationRef: null,
  projectionContractVersion: "test-v1",
  asOfDate: "2026-07-29T00:00:00.000Z",
  authorityState: "candidate",
  freshnessState: "unknown",
  availabilityState: "not_loaded",
  evidenceCoverage: null,
  contentHash: null,
};

function availableEnvelope<T>(data: T): ConsumptionEnvelope<T> {
  return {
    data,
    availabilityState: "available",
    authorityState: "accepted",
    freshnessState: "current",
    evidence: [],
    knownGaps: [],
    warnings: [],
    meta: {
      ...META,
      availabilityState: "available",
      authorityState: "accepted",
      freshnessState: "current",
    },
  };
}

describe("GatedSection", () => {
  it("renders the safe empty state and never calls the render function for a withheld envelope", () => {
    const renderFn = jest.fn(() => <div>SHOULD NOT RENDER</div>);
    const envelope = withheldEnvelope<{ count: number }>(META, "not_loaded", [
      "no projection yet",
    ]);

    render(
      <GatedSection envelope={envelope} label="Fleet count">
        {renderFn}
      </GatedSection>,
    );

    expect(renderFn).not.toHaveBeenCalled();
    expect(screen.queryByText("SHOULD NOT RENDER")).not.toBeInTheDocument();
    expect(screen.getByTestId("knowledge-state-banner")).toBeInTheDocument();
    // Must not render a fabricated zero or count anywhere.
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
  });

  it("never renders a numeric 0 for a not_measured metric -- shows 'Not measured' instead", () => {
    const envelope = withheldEnvelope<number>(META, "not_measured");
    render(
      <GatedSection envelope={envelope} label="Recovery time">
        {(value) => <div>{value}</div>}
      </GatedSection>,
    );
    expect(screen.getByText(/not measured/i)).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("does not render withheld/restricted evidence content, only its existence/state", () => {
    const envelope = withheldEnvelope<{ secretText: string }>(META, "withheld");
    render(
      <GatedSection envelope={envelope} label="Board-only evidence">
        {(data) => <div>{data.secretText}</div>}
      </GatedSection>,
    );
    expect(screen.queryByText("classified content")).not.toBeInTheDocument();
    expect(screen.getByText(/withheld/i)).toBeInTheDocument();
  });

  it("does not render candidate-authority data as accepted by default", () => {
    const envelope: ConsumptionEnvelope<{ label: string }> = {
      ...availableEnvelope({ label: "Unreviewed candidate link" }),
      authorityState: "candidate",
    };
    render(
      <GatedSection envelope={envelope} label="Relationship">
        {(data) => <div>{data.label}</div>}
      </GatedSection>,
    );
    expect(
      screen.queryByText("Unreviewed candidate link"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/candidate/i)).toBeInTheDocument();
  });

  it("renders real content when explicitly available and accepted", () => {
    const envelope = availableEnvelope({ label: "On-time departure" });
    render(
      <GatedSection envelope={envelope} label="Measure">
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

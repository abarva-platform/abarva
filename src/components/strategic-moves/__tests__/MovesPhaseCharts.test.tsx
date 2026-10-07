/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MovesPhaseCharts } from "../MovesPhaseCharts";
import type { PhaseChartsModel } from "@/lib/programs/moves-phase-charts";

const DERIVED_P2: PhaseChartsModel = {
  phase: 2,
  surface: "diagnosis",
  anyIllustrative: false,
  honestyNote: null,
  pending: false,
  charts: [
    {
      kind: "governed_share",
      id: "governed_share",
      title: "Governed share by domain",
      caption: "Committed, governed share of each required evidence family.",
      illustrative: false,
      provenance: "readiness_derived",
      provenanceLabel: "Readiness-derived",
      data: [
        { key: "identity", label: "Identity", fraction: 1, valueLabel: "100%", statusLabel: "Committed" },
        { key: "access", label: "Access", fraction: 0, valueLabel: "0%", statusLabel: "Not provided" },
      ],
    },
    {
      kind: "root_cause_pareto",
      id: "root_cause_pareto",
      title: "Why the current state isn't trusted",
      caption: "Open evidence gaps by root-cause category.",
      illustrative: false,
      provenance: "gap_derived",
      provenanceLabel: "Gap-derived",
      thresholdFraction: 0.8,
      data: [
        { key: "g0", label: "Definitions", fraction: 0.6, valueLabel: "60%", cumulativeFraction: 0.6, cumulativeLabel: "60%" },
        { key: "g1", label: "Ownership", fraction: 0.4, valueLabel: "40%", cumulativeFraction: 1, cumulativeLabel: "100%" },
      ],
    },
  ],
};

const ILLUS_P4: PhaseChartsModel = {
  phase: 4,
  surface: "business_case",
  anyIllustrative: true,
  honestyNote: "Every figure here is illustrative. No cost, saving or value is claimed as fact.",
  pending: false,
  charts: [
    {
      kind: "cost_scenarios",
      id: "cost_scenarios",
      title: "Delivery cost scenarios",
      caption: "One-time implementation, low–high.",
      illustrative: true,
      provenance: "illustrative",
      provenanceLabel: "Illustrative",
      unit: "$M",
      axisMax: 3,
      data: [
        { key: "big4", label: "Big 4", low: 1.8, mid: 2.3, high: 2.8, rangeLabel: "1.8–2.8" },
        { key: "boutique", label: "Boutique", low: 0.95, mid: 1.2, high: 1.45, rangeLabel: "0.95–1.45" },
      ],
    },
    {
      kind: "value_bridge",
      id: "value_bridge",
      title: "Value bridge",
      caption: "What the foundation unlocks → net first-year value.",
      illustrative: true,
      provenance: "illustrative",
      provenanceLabel: "Illustrative",
      unit: "$M",
      axisMax: 2.5,
      net: 1.4,
      steps: [
        { key: "uc1", label: "Use-case 1", delta: 1.1, stepKind: "inflow", valueLabel: "+1.1" },
        { key: "run", label: "Run cost", delta: -0.7, stepKind: "outflow", valueLabel: "−0.7" },
        { key: "net", label: "Net Y1", delta: 1.4, stepKind: "net", valueLabel: "1.4" },
      ],
    },
    {
      kind: "sensitivity_tornado",
      id: "sensitivity_tornado",
      title: "Sensitivity",
      caption: "Net first-year value under each driver's low–high.",
      illustrative: true,
      provenance: "illustrative",
      provenanceLabel: "Illustrative",
      unit: "$M",
      center: 1.4,
      centerLabel: "net 1.4",
      axisMin: 0.8,
      axisMax: 2.0,
      data: [
        { key: "adoption", label: "Adoption", low: 0.9, high: 2.0, lowLabel: "0.9", highLabel: "2.0" },
      ],
    },
  ],
};

describe("MovesPhaseCharts", () => {
  it("renders one card per chart", () => {
    render(<MovesPhaseCharts model={DERIVED_P2} />);
    expect(screen.getByTestId("chart-governed_share")).toBeInTheDocument();
    expect(screen.getByTestId("chart-root_cause_pareto")).toBeInTheDocument();
    expect(screen.getByText("Governed share by domain")).toBeInTheDocument();
  });

  it("stamps a readiness/gap-derived chip, NOT 'Illustrative', on real P2 charts", () => {
    render(<MovesPhaseCharts model={DERIVED_P2} />);
    expect(screen.getByTestId("chart-chip-governed_share")).toHaveTextContent(
      "Readiness-derived",
    );
    expect(screen.getByTestId("chart-chip-root_cause_pareto")).toHaveTextContent(
      "Gap-derived",
    );
    // A real P2 model shows no "Illustrative" honesty note.
    expect(screen.queryByTestId("charts-honesty-note")).toBeNull();
  });

  it("stamps 'Illustrative' and shows the honesty note on the P4 charts", () => {
    render(<MovesPhaseCharts model={ILLUS_P4} />);
    for (const id of ["cost_scenarios", "value_bridge", "sensitivity_tornado"]) {
      expect(screen.getByTestId(`chart-chip-${id}`)).toHaveTextContent(
        "Illustrative",
      );
    }
    const note = screen.getByTestId("charts-honesty-note");
    expect(note).toHaveTextContent(/Every figure here is illustrative/i);
  });

  it("names the values it reaches in each chart's accessible label", () => {
    render(<MovesPhaseCharts model={DERIVED_P2} />);
    const share = screen.getByRole("img", { name: /Governed share by domain/ });
    expect(share).toHaveAccessibleName(/Identity 100%/);
    expect(share).toHaveAccessibleName(/Access 0%/);
    const pareto = screen.getByRole("img", {
      name: /Why the current state isn't trusted/,
    });
    expect(pareto).toHaveAccessibleName(/Definitions 60% \(cumulative 60%\)/);
  });

  it("renders the waterfall, range and tornado values inside the P4 SVGs", () => {
    render(<MovesPhaseCharts model={ILLUS_P4} />);
    const cost = screen.getByRole("img", { name: /Delivery cost scenarios/ });
    expect(cost).toHaveAccessibleName(/Big 4 1.8–2.8/);
    const bridge = screen.getByRole("img", { name: /Value bridge/ });
    expect(bridge).toHaveAccessibleName(/Net Y1 1.4/);
    const sens = screen.getByRole("img", { name: /Sensitivity/ });
    expect(sens).toHaveAccessibleName(/Adoption 0.9–2.0/);
  });

  it("renders nothing when the model is pending or empty", () => {
    const { container: c1 } = render(
      <MovesPhaseCharts model={{ ...DERIVED_P2, pending: true }} />,
    );
    expect(c1.querySelector('[data-testid="moves-phase-charts"]')).toBeNull();
    const { container: c2 } = render(
      <MovesPhaseCharts model={{ ...DERIVED_P2, charts: [], pending: false }} />,
    );
    expect(c2.querySelector('[data-testid="moves-phase-charts"]')).toBeNull();
  });
});

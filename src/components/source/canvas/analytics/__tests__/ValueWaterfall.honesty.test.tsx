/**
 * @jest-environment jsdom
 */

// The value-analytics canvas has two doctrine-critical honesty invariants that
// must never regress:
//   1. A band with insufficient evidence renders "needs evidence" — NEVER a
//      fabricated $0 or a guessed number.
//   2. The sample view-model is marked `provenance: 'sample'` so the canvas can
//      render the "sample intelligence" note until the live evaluator wires in.
// These are the honesty contract made executable.

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { ValueWaterfall } from "../ValueWaterfall";
import { SAMPLE_SCOPE_STAGE } from "../sample-view-model";
import type { ValueWaterfallView } from "../view-model";

const waterfall: ValueWaterfallView = {
  provenance: "sample",
  baselineLabel: "Incumbent AMS spend",
  baselineAmount: 10_000_000,
  unit: "usd",
  bands: [
    {
      id: "b-quantified",
      valueType: "expected_concession",
      label: "Change-order leakage folded to base",
      amountLow: 1_200_000,
      amountHigh: 1_800_000,
      unit: "usd",
      confidence: "med",
      state: "quantified",
      citation: { doc: "Incumbent MSA", locator: "Sch. C" },
    },
    {
      id: "b-insufficient",
      valueType: "solution_tightening",
      label: "Automation credit — no committed schedule yet",
      amountLow: 0,
      amountHigh: 0,
      unit: "usd",
      confidence: "low",
      state: "insufficient_evidence",
      citation: null,
    },
  ],
};

describe("ValueWaterfall — honesty invariants", () => {
  it("renders an insufficient-evidence band as 'needs evidence', never $0", () => {
    render(<ValueWaterfall waterfall={waterfall} />);

    // The insufficient band surfaces the honest label...
    expect(screen.getByText("needs evidence")).toBeInTheDocument();
    // ...and does NOT emit a $0 for it (no fabricated number).
    expect(screen.queryByText(/\$0\b/)).not.toBeInTheDocument();
  });

  it("shows the quantified band as a range with a confidence label", () => {
    render(<ValueWaterfall waterfall={waterfall} />);

    // A range (low–high), not a single point estimate. The canvas formats USD
    // compact with 0 fraction digits, so 1.2M–1.8M renders as "$1M–$2M" — and it
    // appears twice (once as the band, once rolled up into the header total,
    // since only the one quantified band contributes).
    expect(screen.getAllByText(/\$1M–\$2M/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("med confidence")).toBeInTheDocument();
  });

  it("totals only the quantified bands (insufficient bands never inflate the total)", () => {
    render(<ValueWaterfall waterfall={waterfall} />);

    // Header total = the single quantified band's range; the insufficient band
    // contributes nothing. 1.2M–1.8M against a 10M baseline = 12–18%.
    expect(screen.getByText(/12–18% of baseline/)).toBeInTheDocument();
  });

  it("ships the sample exemplar marked as sample intelligence (not live)", () => {
    // Guards the default the canvas renders before the live engine wires in.
    expect(SAMPLE_SCOPE_STAGE.intel.provenance).toBe("sample");
  });

  it("does NOT put a value-type waterfall on the Scope (intake) stage", () => {
    // The classified value pool is a downstream artifact (Pricing/Evaluation/
    // Value), computed from real facts — never fabricated at an intake stage.
    // Showing a $-waterfall at Scope for a data-less event is the defect this
    // guards against.
    expect(SAMPLE_SCOPE_STAGE.waterfall).toBeUndefined();
  });

  describe("no valid baseline (freshly-created event)", () => {
    // Defect guarded: a bare/percentage intake value ("Target 15-20% run-cost
    // reduction") must NOT become a $ baseline. When baselineAmount <= 0 the
    // header must suppress the "Value at stake: $0" line and the "% of baseline"
    // fragment — the classified total still shows on its own, never a fabricated
    // denominator.
    const noBaseline: ValueWaterfallView = {
      ...waterfall,
      baselineLabel: "Value at stake (event estimate)",
      baselineAmount: 0,
    };

    it("suppresses the 'Value at stake: $X' baseline line when there is no valid amount", () => {
      render(<ValueWaterfall waterfall={noBaseline} />);
      expect(
        screen.queryByText(/Value at stake \(event estimate\)/),
      ).not.toBeInTheDocument();
      // No fabricated $0 baseline anywhere.
      expect(screen.queryByText(/\$0\b/)).not.toBeInTheDocument();
    });

    it("omits the '% of baseline' fragment but keeps the classified-value label", () => {
      render(<ValueWaterfall waterfall={noBaseline} />);
      expect(screen.queryByText(/% of baseline/)).not.toBeInTheDocument();
      // The classified total still renders (label present, plus the range).
      expect(screen.getByText(/classified value/)).toBeInTheDocument();
      expect(screen.getAllByText(/\$1M–\$2M/).length).toBeGreaterThanOrEqual(1);
    });

    it("still shows the baseline + percentage when a real amount IS present", () => {
      render(<ValueWaterfall waterfall={waterfall} />);
      expect(screen.getByText(/Incumbent AMS spend/)).toBeInTheDocument();
      expect(screen.getByText(/12–18% of baseline/)).toBeInTheDocument();
    });
  });
});

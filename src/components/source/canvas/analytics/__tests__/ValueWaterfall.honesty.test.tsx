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
    expect(SAMPLE_SCOPE_STAGE.waterfall?.provenance).toBe("sample");
  });
});

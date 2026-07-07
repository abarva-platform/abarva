// Golden net for the shared visual engine.
//
// Locks representative SVG outputs byte-stable so a later physical relocation of the engine into
// visual-system/ (or any edit) is caught — this is the "golden-test before refactor" safety net
// the reconciliation note requires. Snapshots reflect the CURRENT expert-kernel output; if they
// change unexpectedly, the dossier's exhibits changed too.

import { investmentWaterfall, optionScorecard } from "../index";

const waterfall = [
  { label: "Gross value", amount: 5_240_000 },
  { label: "Haircut", amount: -980_000 },
  { label: "Investment", amount: -720_000 },
];

const scorecard = [
  {
    name: "AI-native build",
    shapeLabel: "Examination copilot",
    referenceScore: 88,
    productionShaped: true,
    selected: true,
    disposition: "Lowest cost, strongest control posture.",
  },
  {
    name: "Vendor suite",
    shapeLabel: "Packaged L/C suite",
    referenceScore: 61,
    productionShaped: false,
    selected: false,
    disposition: "Faster to stand up but higher run cost.",
  },
];

describe("shared visual engine — golden output", () => {
  it("investmentWaterfall is well-formed SVG and byte-stable", () => {
    const svg = investmentWaterfall(waterfall);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toMatchSnapshot();
  });

  it("optionScorecard is well-formed SVG and byte-stable", () => {
    const svg = optionScorecard(scorecard);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toMatchSnapshot();
  });

  it("the engine is deterministic — identical input yields identical output", () => {
    expect(investmentWaterfall(waterfall)).toBe(investmentWaterfall(waterfall));
    expect(optionScorecard(scorecard)).toBe(optionScorecard(scorecard));
  });
});

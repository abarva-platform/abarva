/**
 * Regression: the trajectory variance label must be derived from the sign of the gap.
 *
 * It was a fixed "Over plan" string sitting on `max(0, planned - measured)` — the SHORTFALL,
 * clamped so it could never represent an overshoot. On live production data, with measured value
 * at zero, it rendered "Over plan $492.5M" beside "Actual $0" — announcing a total measurement
 * failure as outperformance, in the most flattering possible direction. A label that cannot
 * disagree with the number beneath it is the only safe shape here.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const SOURCE = fs.readFileSync(
  path.resolve(__dirname, "../views/ContractTabs.tsx"),
  "utf-8",
);

describe("trajectory plan-variance label", () => {
  it("no longer hardcodes 'Over plan' as a literal label", () => {
    expect(SOURCE).not.toMatch(/<span>Over plan<\/span>/);
  });

  it("renders the magnitude of the gap, not a clamped shortfall", () => {
    expect(SOURCE).toMatch(/Math\.abs\(s\.promisedUsd - measured\)/);
    expect(SOURCE).not.toMatch(/Math\.max\(0, s\.promisedUsd - measured\)/);
  });

  it("derives the wording from the sign in all three directions", () => {
    const fn = SOURCE.slice(
      SOURCE.indexOf("function planVarianceLabel"),
      SOURCE.indexOf("function measuredUsd"),
    );
    expect(fn).toMatch(/measuredUsd > plannedUsd[\s\S]*Over plan/);
    expect(fn).toMatch(/measuredUsd < plannedUsd[\s\S]*Short of plan/);
    expect(fn).toMatch(/return "On plan"/);
  });

  it("calls the helper at the render site", () => {
    expect(SOURCE).toMatch(
      /<span>\{planVarianceLabel\(s\.promisedUsd, measured\)\}<\/span>/,
    );
  });
});

import * as fs from "node:fs";
import * as path from "node:path";

const SOURCE = fs.readFileSync(
  path.resolve(__dirname, "../views/ContractTabs.tsx"),
  "utf-8",
);

describe("trajectory plan variance label", () => {
  it("labels the trajectory gap as unproven value, not outperformance", () => {
    expect(SOURCE).toMatch(/<span>Not yet proven<\/span>/);
    expect(SOURCE).not.toMatch(/<span>Over plan<\/span>/);
  });

  it("calculates unproven value from claimable value, not recorded actuals", () => {
    expect(SOURCE).toMatch(/view\.summary\.promisedUsd - view\.summary\.claimableUsd/);
    expect(SOURCE).not.toMatch(/Math\.max\(0, s\.promisedUsd - actual\)/);
    expect(SOURCE).not.toMatch(/Math\.abs\(s\.promisedUsd - actual\)/);
  });

  it("does not substitute finance run-rate or cash for recorded P&L", () => {
    expect(SOURCE).toMatch(/point\.realizedPAndLUsd/);
    expect(SOURCE).not.toMatch(
      /point\.realizedPAndLUsd[\s\S]*\?\?[\s\S]*point\.realizedCashUsd[\s\S]*\?\?[\s\S]*point\.financeValidatedRunRateUsd/,
    );
  });
});

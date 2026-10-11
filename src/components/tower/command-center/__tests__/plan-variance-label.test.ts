import * as fs from "node:fs";
import * as path from "node:path";

const SOURCE = fs.readFileSync(
  path.resolve(__dirname, "../views/ContractTabs.tsx"),
  "utf-8",
);

describe("trajectory period and value boundaries", () => {
  it("labels the number of loaded quarters instead of promising an eight-quarter trend", () => {
    expect(SOURCE).toMatch(/Quarterly plan and recorded results/);
    expect(SOURCE).toMatch(/view\.valueTrajectory\.length/);
    expect(SOURCE).not.toMatch(/Eight-quarter trajectory/);
  });

  it("does not subtract a YTD claimable amount from an annual plan", () => {
    expect(SOURCE).not.toMatch(/promisedUsd\s*-\s*claimableUsd/);
    expect(SOURCE).not.toMatch(/<span>Not yet proven<\/span>/);
    expect(SOURCE).toMatch(/Value records with measured results/);
  });

  it("does not substitute finance run-rate or cash for recorded P&L", () => {
    expect(SOURCE).toMatch(/point\.realizedPAndLUsd/);
    expect(SOURCE).not.toMatch(
      /point\.realizedPAndLUsd[\s\S]*\?\?[\s\S]*point\.realizedCashUsd[\s\S]*\?\?[\s\S]*point\.financeValidatedRunRateUsd/,
    );
  });
});

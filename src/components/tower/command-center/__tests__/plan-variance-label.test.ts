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

  it("keeps the unproven remainder floored at zero", () => {
    expect(SOURCE).toMatch(
      /Math\.max\(0, s\.promisedUsd - actual\)/,
    );
    expect(SOURCE).not.toMatch(/Math\.abs\(s\.promisedUsd - actual\)/);
  });
});

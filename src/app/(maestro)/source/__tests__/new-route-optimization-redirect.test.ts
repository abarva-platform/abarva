import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.join(__dirname, "..", "new", "page.tsx"),
  "utf8",
);

describe("Source new-event route optimization redirect", () => {
  it("keeps contract optimization out of the New Event intake", () => {
    expect(source).toContain('params.intent === "contract-optimization"');
    expect(source).toContain("redirect(buildSourceOptimizeContractHref(params))");
    expect(source).toContain('@/lib/source/optimize-routing');
    expect(source).not.toContain("contractOptimizationRedirect");
  });
});

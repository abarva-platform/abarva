import fs from "fs";
import path from "path";

const componentPath = path.join(
  process.cwd(),
  "src/components/home/ImpactInsightsHome.tsx",
);

describe("ImpactInsightsHome copy contract", () => {
  const source = fs.readFileSync(componentPath, "utf8");

  it("keeps Home focused on insights instead of setup or corpus readiness", () => {
    expect(source).toContain('data-testid="home-impact-insights"');
    expect(source).toContain("InsightConstellation");
    expect(source).not.toMatch(
      /\b(admin|setup|upload|data loads?|connectors?|templates?|corpus|depth|breadth|segments loaded|template coverage|connector health)\b/i,
    );
  });

  it("keeps the executive greeting measure wide enough for desktop", () => {
    expect(source).toContain("maxWidth: 1120");
    expect(source).not.toContain("maxWidth: 760");
  });
});

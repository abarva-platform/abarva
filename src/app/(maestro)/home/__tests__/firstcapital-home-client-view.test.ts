import { readFileSync } from "node:fs";

describe("First Capital Home client view", () => {
  const homeSource = readFileSync("src/app/(maestro)/home/page.tsx", "utf8");

  it("orients the executive on First Capital business and technology context", () => {
    expect(homeSource).toContain("The enterprise foundation is loaded");
    expect(homeSource).toContain("Revenue");
    expect(homeSource).toContain("Total assets");
    expect(homeSource).toContain("IT budget");
    expect(homeSource).toContain("AI spend");
    expect(homeSource).toContain("$498M");
    expect(homeSource).toContain("$5.4B");
  });

  it("explains how the context and corpus foundation activates product modules", () => {
    expect(homeSource).toContain("Why context and corpus make the product different");
    expect(homeSource).toContain("How the modules shine");
    expect(homeSource).toContain("Questions now answerable");
    expect(homeSource).toContain("Financial-services reasoning layer");
  });
});

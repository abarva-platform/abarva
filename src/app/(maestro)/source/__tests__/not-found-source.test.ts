import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.join(__dirname, "..", "not-found.tsx"),
  "utf8",
);

describe("Source segment not-found state", () => {
  it("uses Source-specific access language and safe Source exits", () => {
    expect(source).toContain("Source · access guard");
    expect(source).toContain("This Source item is not available");
    expect(source).toContain("/source/workspace");
    expect(source).toContain("Open Source workspace");
    expect(source).toContain("Switch account");
  });

  it("does not resurrect the generic Moves / workspace advisor fallback", () => {
    expect(source).not.toContain("Go to Moves");
    expect(source).not.toContain("Workspace advisor");
    expect(source).not.toContain("WORKSPACE ADVISOR");
    expect(source).not.toContain("Return to the Moves portfolio");
  });
});

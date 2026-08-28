import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Source old surface archive guard", () => {
  const eventRoute = "src/app/(maestro)/source/events/[eventId]/page.tsx";

  it("hard-mounts SourceAnalyticsCanvas for event detail routes", () => {
    const source = read(eventRoute);

    expect(source).toContain("SourceAnalyticsCanvas");
    expect(source).toContain("Source event shell v2");
    expect(source).not.toContain("UniversalCanvasShell");
    expect(source).not.toContain("workspaceExplorerEnabled");
    expect(source).not.toContain("strategyAutoDraftEnabled");
    expect(source).not.toContain("simpleFrontEnabled");
  });

  it("archives old Source event-list page into the governed workspace", () => {
    const root = read("src/app/(maestro)/source/page.tsx");
    const events = read("src/app/(maestro)/source/events/page.tsx");

    expect(root).toContain("redirect('/source/preview/workspace')");
    expect(events).toContain('redirect("/source/preview/workspace")');
    expect(root).not.toContain("UniversalCanvasShell");
    expect(events).not.toContain("UniversalCanvasShell");
  });

  it("keeps the canonical eleven-stage event route contract intact", () => {
    const constants = read("src/lib/source/constants.ts");

    for (const stage of [
      "strategy",
      "scope",
      "rfp",
      "responses",
      "evaluation",
      "pricing",
      "bafo",
      "executive_decision",
      "selection",
      "transition",
      "value",
    ]) {
      expect(constants).toContain(`'${stage}'`);
    }
  });
});

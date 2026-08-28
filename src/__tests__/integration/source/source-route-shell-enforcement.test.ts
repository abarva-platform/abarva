import fs from "node:fs";
import path from "node:path";

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
}

describe("DESROUTE4 source route shell enforcement (analytics shell)", () => {
  const sourceDashboardRoute = "src/app/(maestro)/source/page.tsx";
  const sourceEventsRoute = "src/app/(maestro)/source/events/page.tsx";
  const sourceEventDetailRoute =
    "src/app/(maestro)/source/events/[eventId]/page.tsx";
  const sentinelAgentColumn = "src/components/source/SentinelAgentColumn.tsx";
  const chatAgentRoute = "src/app/api/chat/agent/route.ts";

  it("target source routes use the supported shell or archive redirect", () => {
    const events = read(sourceEventsRoute);
    expect(events).toContain('redirect("/source/preview/workspace")');
    expect(events).not.toContain("AppShell");

    // Detail route mounts the redesigned analytics canvas for every tenant.
    const detail = read(sourceEventDetailRoute);
    expect(detail).toContain("SourceAnalyticsCanvas");
    expect(detail).not.toContain("UniversalCanvasShell");
    expect(detail).not.toContain("workspaceExplorerEnabled");
    expect(detail).not.toContain("simpleFrontEnabled");

    // Landing redirects to the governed workspace.
    const dashboard = read(sourceDashboardRoute);
    expect(dashboard).toContain("redirect('/source/preview/workspace')");
  });

  it("event detail route reads analytics facts and registry evidence", () => {
    const source = read(sourceEventDetailRoute);
    expect(source).toContain("readEventFacts");
    expect(source).toContain("buildLiveStageView");
    expect(source).toContain("buildStepInsight");
    expect(source).toContain("listSourceArtifactsForSourceEventId");
  });

  it("Source event routes use the analytics canvas, not the legacy rail wrapper", () => {
    const source = read(sourceEventDetailRoute);
    expect(source).not.toContain("SentinelAgentColumn");
    expect(source).not.toContain("UniversalCanvasShell");
    expect(source).toContain("SourceAnalyticsCanvas");
  });

  it("Source agent prompt uses consulting-partner pacing and tenant context for every Source agent", () => {
    const route = read(chatAgentRoute);

    expect(route).toContain("SOURCE CONSULTING PARTNER STYLE");
    expect(route).toContain("Ask at most ONE question in the chat reply");
    expect(route).toContain("Keep most Source replies under 75 words");
    expect(route).toContain(
      "Never ask 'who is the CIO?' when context names the CIO",
    );
    expect(route).toContain("isSourceSurface(surface) && effectiveClientKey");
    expect(route).toContain(
      "agentName: normalizeEnterpriseAgentName(agentName)",
    );
    expect(route).not.toContain(
      "agentName === 'Sentinel' && isSourceSurface(surface)",
    );
  });

  it("deterministic caveat is preserved — no live claims, no guaranteed savings", () => {
    // Caveat lives in SentinelAgentColumn voice; working-pane components carry it too
    const sentinel = read(sentinelAgentColumn);
    expect(sentinel.toLowerCase()).not.toContain("live ingestion is complete");
    expect(sentinel.toLowerCase()).not.toContain("guaranteed savings");
  });
});

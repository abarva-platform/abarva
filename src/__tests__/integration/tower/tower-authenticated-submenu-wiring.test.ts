import { existsSync, readFileSync } from "node:fs";

describe("Tower authenticated route wiring", () => {
  const pageSource = readFileSync("src/app/(maestro)/tower/page.tsx", "utf8");
  const towerIndexSource = readFileSync("src/components/tower/TowerIndexPage.tsx", "utf8");

  it("resolves the authenticated tenant once and passes that tenant into Tower state", () => {
    expect(pageSource).toContain("getActiveClientRow()");
    expect(pageSource).toContain("canonicalClientDisplayName");
    expect(pageSource).toContain("buildAtlasTowerCurrentState");
    expect(pageSource).toContain("clientId: activeClient.id");
    expect(pageSource).toContain("clientId={activeClient?.id}");
  });

  it("preserves Tower tabs through the React page instead of iframe query wiring", () => {
    expect(pageSource).toContain("searchParams");
    expect(pageSource).toContain("resolveTowerTab(tab)");
    expect(pageSource).toContain("activeTab={activeTab}");
    expect(pageSource).not.toContain("frameSrc");
    expect(pageSource).not.toContain("requestedClient");
  });

  it("mounts the shared aVa dock around the Tower workspace", () => {
    expect(towerIndexSource).toContain("<AtlasChatPanel");
    expect(towerIndexSource).toContain("workspace={towerWorkspace}");
    expect(towerIndexSource).toContain("surface=\"tower\"");
    expect(towerIndexSource).toContain("onSubmit={sendToAtlas}");
  });

  it("keeps retired static Tower endpoints and assets out of the runtime tree", () => {
    expect(existsSync("src/app/api/tower/v2-frame/route.ts")).toBe(false);
    expect(existsSync("src/app/api/tower/v2-data/route.ts")).toBe(false);
    expect(existsSync("public/tower-v2/index.html")).toBe(false);
    expect(existsSync("src/lib/tower-v2/v4-data.ts")).toBe(false);
  });
});

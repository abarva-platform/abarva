import { existsSync, readFileSync } from "node:fs";

const TOWER_PAGE = "src/app/(maestro)/tower/page.tsx";
const TOWER_INDEX_PAGE = "src/components/tower/TowerIndexPage.tsx";
const ATLAS_CHAT_PANEL = "src/components/atlas/AtlasChatPanel.tsx";

describe("Tower route invariants", () => {
  const pageSource = readFileSync(TOWER_PAGE, "utf8");
  const towerIndexSource = readFileSync(TOWER_INDEX_PAGE, "utf8");
  const atlasChatPanelSource = readFileSync(ATLAS_CHAT_PANEL, "utf8");

  it("renders the React Tower page, not the retired static iframe surface", () => {
    expect(pageSource).toContain("TowerIndexPage");
    expect(pageSource).toContain("buildAtlasTowerCurrentState");
    expect(pageSource).toContain("getActiveClientRow()");
    expect(pageSource).not.toContain("TowerIframeContainer");
    expect(pageSource).not.toContain("<iframe");
    expect(pageSource).not.toContain("v2-frame");
    expect(pageSource).not.toContain("tower-v2");
  });

  it("uses the shared AgentDock via the Tower Atlas adapter", () => {
    expect(towerIndexSource).toContain("AtlasChatPanel");
    expect(towerIndexSource).toContain("surface=\"tower\"");
    expect(towerIndexSource).toContain('variant="focused"');
    expect(towerIndexSource).not.toContain("initialQuote=");
    expect(towerIndexSource).toContain("defaultLeftPercent={35}");
    expect(towerIndexSource).toContain("minLeftPx={320}");
    expect(atlasChatPanelSource).toContain("AgentDock");
    expect(atlasChatPanelSource).toContain('defaultMode = "side-rail"');
    expect(atlasChatPanelSource).toContain('name: "aVa"');
    expect(atlasChatPanelSource).not.toContain('name: "Atlas"');
  });

  it("keeps Tower data tenant-bound through the active client id", () => {
    expect(pageSource).toContain("activeClient?.id");
    expect(pageSource).toContain("clientId={activeClient?.id}");
    expect(pageSource).toContain("initiatives={towerState?.initiatives}");
    expect(pageSource).toContain("vendors={towerState?.vendors}");
    expect(pageSource).toContain("bandMetrics={towerState?.bandMetrics}");
    expect(pageSource).toContain("pressuresView={towerState?.pressuresView}");
    expect(pageSource).toContain("atlasObservationsView={towerState?.atlasObservationsView}");
  });

  it("removes static Tower fallback runtime files so production cannot flip back", () => {
    const retired = [
      "src/app/(maestro)/tower/TowerIframeContainer.tsx",
      "src/app/api/tower/v2-frame/route.ts",
      "src/app/api/tower/v2-data/route.ts",
      "src/lib/tower-v2/v4-data.ts",
      "public/tower-v2/index.html",
      "public/tower-v2/default-data.js",
      "public/tower-v2/app.js",
    ];

    for (const path of retired) {
      expect(existsSync(path)).toBe(false);
    }
  });

  it("removes legacy Tower subroutes so retired boards cannot reappear by URL", () => {
    const removedRoutes = [
      "src/app/(maestro)/tower/activity/page.tsx",
      "src/app/(maestro)/tower/lens/page.tsx",
      "src/app/(maestro)/tower/onboard/page.tsx",
      "src/app/(maestro)/tower/onboard/[dimension]/page.tsx",
      "src/app/(maestro)/tower/outcomes/page.tsx",
      "src/app/(maestro)/tower/portfolio/page.tsx",
      "src/app/(maestro)/tower/portfolio-dag/page.tsx",
      "src/app/(maestro)/tower/pressures/page.tsx",
      "src/app/(maestro)/tower/pressures/[pressureId]/page.tsx",
      "src/app/(maestro)/tower/preview/page.tsx",
      "src/app/(maestro)/tower/programs/page.tsx",
      "src/app/(maestro)/tower/programs/[programId]/page.tsx",
      "src/app/(maestro)/tower/programs/[programId]/value/page.tsx",
      "src/app/(maestro)/tower/projects/page.tsx",
      "src/app/(maestro)/tower/source-portfolio-value/page.tsx",
      "src/app/(maestro)/tower/staff-aug/page.tsx",
      "src/app/(maestro)/tower/tech-stack/page.tsx",
      "src/app/(maestro)/tower/volumetrics/page.tsx",
    ];

    for (const route of removedRoutes) {
      expect(existsSync(route)).toBe(false);
    }
  });
});

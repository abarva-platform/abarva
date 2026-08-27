import { readFileSync } from "node:fs";

describe("Tower DB-only surface guard", () => {
  const towerPage = readFileSync("src/app/(maestro)/tower/page.tsx", "utf8");
  const commandCenterAvaShell = readFileSync(
    "src/components/tower/command-center/TowerCommandCenterAvaShell.tsx",
    "utf8",
  );
  const commandCenterViewModel = readFileSync(
    "src/lib/tower/command-center/view-model.ts",
    "utf8",
  );
  const visibleTowerSource = `${towerPage}\n${commandCenterAvaShell}\n${commandCenterViewModel}`;

  it("does not wire visible Tower content to fixture or route-slug fallbacks", () => {
    expect(towerPage).not.toContain("getSetupAiInitiatives");
    expect(towerPage).not.toContain("fixture_fallback");
    expect(towerPage).not.toContain("findTenantByRouteSlug");
    expect(towerPage).not.toContain("findTenantByRouteSlug('apexretail')");
    expect(towerPage).toContain("readTowerCommandCenter");
    expect(towerPage).toContain("buildTowerCommandCenterView");
    expect(towerPage).not.toContain("buildTowerCanonicalReconciliation");
  });

  it("does not render legacy Apex demo values when DB substrate is empty", () => {
    expect(visibleTowerSource).not.toContain("LEGACY_");
    expect(visibleTowerSource).not.toContain("JOULE");
    expect(visibleTowerSource).not.toContain("M365-CORE");
    expect(visibleTowerSource).not.toContain("NOW-ASSIST");
    expect(visibleTowerSource).not.toContain("Portfolio ROI is at 2.8");
    expect(visibleTowerSource).not.toContain(
      "Microsoft EA renewal closes in 47 days",
    );
    expect(visibleTowerSource).not.toContain("Today's pressures · 7 active");
  });
});

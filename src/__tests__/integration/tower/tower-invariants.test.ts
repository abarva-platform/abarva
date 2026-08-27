import { existsSync, readFileSync } from "node:fs";

const TOWER_PAGE = "src/app/(maestro)/tower/page.tsx";

describe("Tower invariants", () => {
  const pageSource = readFileSync(TOWER_PAGE, "utf8");

  it("opens the Command Center surface, not retired Tower boards", () => {
    expect(pageSource).toContain("TowerCommandCenterAvaShell");
    expect(pageSource).toContain("buildTowerCommandCenterView");
    expect(pageSource).not.toContain("TowerLegacySurface");
    expect(pageSource).not.toContain("TowerIndexPage");
    expect(pageSource).not.toContain("AiControlTowerPage");
    expect(pageSource).not.toContain("getAiControlTowerReadModel");
  });

  it("sources its data from the governed ECL Tower serving substrate", () => {
    expect(pageSource).toContain("readTowerCommandCenter");
    expect(pageSource).toContain("buildTowerCommandCenterView");
    const reader = readFileSync("src/lib/tower/readTowerCommandCenter.ts", "utf8");
    expect(reader).toContain("from serving.${viewName}");
    expect(reader).toContain('"tower_command_center"');
    expect(reader).toContain('"tower_value_proof"');
    expect(reader).toContain('"tower_evidence"');
    expect(reader).not.toContain("consumption.tower_board_posture_v1");
    expect(reader).not.toContain("tower.value_case");
  });

  it("removes legacy Tower route files that can show retired views", () => {
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
      "src/components/tower/TowerLegacySurface.tsx",
      "src/components/tower/TowerIndexPage.tsx",
      "src/components/tower/TowerCommandCenterContract.tsx",
      "src/components/tower/AiControlTowerPage.tsx",
      "src/components/tower/TowerLensTabs.tsx",
      "src/lib/ai-control-tower/read-model.ts",
      "src/lib/ai-control-tower/atlas-context-pack.ts",
      "src/lib/ai-control-tower/load-plan.ts",
      "src/lib/ai-control-tower/persistence.ts",
      "src/lib/tower/control-tower-lens-projection.ts",
    ];
    for (const route of removedRoutes) {
      expect(existsSync(route)).toBe(false);
    }
  });
});

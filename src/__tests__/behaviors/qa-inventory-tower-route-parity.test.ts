import { readFileSync } from "node:fs";
import path from "node:path";

import { buildFounderDemoRouteChecklist } from "@/lib/qa/founder-demo-route-checklist";
import { listRouteSmokeTargets } from "@/lib/qa/route-smoke-inventory";

const TOWER_SHELL =
  "src/components/tower/command-center/TowerCommandCenterAvaShell.tsx";

describe("QA inventory Tower route parity", () => {
  it("keeps both deterministic inventories aligned with the shell the route mounts", () => {
    const towerRoute = readFileSync(
      path.join(process.cwd(), "src/app/(maestro)/tower/page.tsx"),
      "utf8",
    );
    const smokeTarget = listRouteSmokeTargets().find(
      (target) => target.ownerSurface === "tower",
    );
    const demoTarget = buildFounderDemoRouteChecklist().routes.find(
      (route) => route.primaryAgent === "Atlas",
    );

    expect(towerRoute).toContain(
      'import { TowerCommandCenterAvaShell } from "@/components/tower/command-center/TowerCommandCenterAvaShell"',
    );
    expect(towerRoute).toContain("<TowerCommandCenterAvaShell");
    expect(smokeTarget?.expectedReadModel).toBe(TOWER_SHELL);
    expect(demoTarget?.expectedComponent).toBe(TOWER_SHELL);
  });

  it("does not advertise the retired pressure-card surface as ready", () => {
    const demoTarget = buildFounderDemoRouteChecklist().routes.find(
      (route) => route.primaryAgent === "Atlas",
    );

    expect(demoTarget?.expectedComponent).not.toContain(
      "ProgramPressureCards",
    );
    expect(demoTarget?.validationStatus).toBe("partial");
    expect(demoTarget?.readinessCaveat).toMatch(/current-data acceptance/i);
  });
});

import { readFileSync } from "fs";
import { join } from "path";

const nexusTopNavSource = readFileSync(
  join(process.cwd(), "src/components/navigation/NexusTopNav.tsx"),
  "utf8",
);

const towerRouteSource = readFileSync(
  join(process.cwd(), "src/app/(maestro)/tower/page.tsx"),
  "utf8",
);

const towerAvaShellSource = readFileSync(
  join(
    process.cwd(),
    "src/components/tower/command-center/TowerCommandCenterAvaShell.tsx",
  ),
  "utf8",
);

const agentDockSource = readFileSync(
  join(process.cwd(), "src/components/agent/AgentDock.tsx"),
  "utf8",
);

const atlasChatPanelSource = readFileSync(
  join(process.cwd(), "src/components/atlas/AtlasChatPanel.tsx"),
  "utf8",
);

describe("Tower tenant display names", () => {
  it("lets Tower preserve its real tenant display name in the top bar instead of demo-safe aliases", () => {
    expect(nexusTopNavSource).toContain("preserveTenantName?: boolean");
    expect(nexusTopNavSource).toContain("Tenant/client names are no");
    expect(nexusTopNavSource).toContain("longer rendered in the global brand area");
    expect(towerRouteSource).toContain("preserveTenantName: true");
  });

  it("lets Tower preserve its real tenant display name in the aVa dock", () => {
    expect(agentDockSource).toContain("preserveVisibleText?: boolean");
    expect(agentDockSource).toContain("preserveVisibleText = false");
    expect(agentDockSource).toContain("preserveVisibleText\n    ? rawAgent");
    expect(agentDockSource).toContain("preserveVisibleText\n    ? rawThread");
    expect(atlasChatPanelSource).toContain("preserveVisibleText?: boolean");
    expect(atlasChatPanelSource).toContain("preserveVisibleText={preserveVisibleText}");
    expect(towerAvaShellSource).toContain("preserveVisibleText");
  });
});

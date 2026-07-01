import { readFileSync } from "fs";
import { join } from "path";

const appTopBarSource = readFileSync(
  join(process.cwd(), "src/components/shell/AppTopBar.tsx"),
  "utf8",
);

const towerPageSource = readFileSync(
  join(process.cwd(), "src/components/tower/TowerIndexPage.tsx"),
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
    expect(appTopBarSource).toContain("preserveTenantName?: boolean");
    expect(appTopBarSource).toContain("preserveTenantName = false");
    expect(appTopBarSource).toContain("const resolvedTenantNameRaw = preserveTenantName");
    expect(appTopBarSource).toContain("? (tenantName ?? currentClient?.name ?? null)");
    expect(appTopBarSource).toContain("? preserveTenantName");
    expect(appTopBarSource).toContain("? resolvedTenantNameRaw");
    expect(towerPageSource).toContain("preserveTenantName: true");
  });

  it("lets Tower preserve its real tenant display name in the aVa dock", () => {
    expect(agentDockSource).toContain("preserveVisibleText?: boolean");
    expect(agentDockSource).toContain("preserveVisibleText = false");
    expect(agentDockSource).toContain("preserveVisibleText ? rawAgent");
    expect(agentDockSource).toContain("preserveVisibleText ? rawThread");
    expect(atlasChatPanelSource).toContain("preserveVisibleText?: boolean");
    expect(atlasChatPanelSource).toContain("preserveVisibleText={preserveVisibleText}");
    expect(towerPageSource).toContain("preserveVisibleText");
  });
});

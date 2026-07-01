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

describe("Tower tenant display names", () => {
  it("lets Tower preserve its real tenant display name instead of demo-safe aliases", () => {
    expect(appTopBarSource).toContain("preserveTenantName?: boolean");
    expect(appTopBarSource).toContain("preserveTenantName = false");
    expect(appTopBarSource).toContain("const resolvedTenantNameRaw = preserveTenantName");
    expect(appTopBarSource).toContain("? (tenantName ?? currentClient?.name ?? null)");
    expect(appTopBarSource).toContain("? preserveTenantName");
    expect(appTopBarSource).toContain("? resolvedTenantNameRaw");
    expect(towerPageSource).toContain("preserveTenantName: true");
  });
});

import { readFileSync } from "fs";
import { join } from "path";

const appShellSource = readFileSync(
  join(process.cwd(), "src/components/shell/AppShell.tsx"),
  "utf8",
);
const appTopBarSource = readFileSync(
  join(process.cwd(), "src/components/shell/AppTopBar.tsx"),
  "utf8",
);

describe("Cockpit shell navigation contract", () => {
  it("defaults AppShell to the cockpit top-nav model and sunsets the old app rail by default", () => {
    expect(appShellSource).toContain("showProductNav = true");
    expect(appShellSource).toContain("showAppRail = false");
    expect(appShellSource).toContain(
      'gridTemplateColumns: showAppRail ? "76px 1fr" : "1fr"',
    );
    expect(appShellSource).toContain("showAppRail ? <AppRail /> : null");
  });

  it("renders product/module navigation in AppTopBar", () => {
    for (const label of [
      "Home",
      "Setup",
      "Programs",
      "Source",
      "Intelligence",
      "Tower",
      "Learn",
    ]) {
      expect(appTopBarSource).toContain(`label: "${label}"`);
    }
    expect(appTopBarSource).toContain('href: "/admin"');
    expect(appTopBarSource).toContain('href: "/learn"');
    expect(appTopBarSource).toContain("resolveModuleAccess");
  });

  it("keeps top bar free of duplicated workspace clutter", () => {
    expect(appTopBarSource).not.toContain("tenantName =");
    expect(appTopBarSource).not.toContain("timeString ?");
    expect(appTopBarSource).not.toContain("Home cockpit");
  });
});

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
const nexusTopNavSource = readFileSync(
  join(process.cwd(), "src/components/navigation/NexusTopNav.tsx"),
  "utf8",
);

describe("Cockpit shell navigation contract", () => {
  it("defaults AppShell to the cockpit top-nav model and sunsets the old app rail by default", () => {
    // Product-nav visibility now lives in NexusTopNav (mounted once by
    // MaestroChrome, not per-page by AppShell) rather than being threaded
    // through as an AppShell prop.
    expect(nexusTopNavSource).toContain("showProductNav: showProductNavProp = true");
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
      "Source",
      "Intelligence",
      "Tower",
      "Learn",
      "Product",
    ]) {
      expect(appTopBarSource).toContain(`label: "${label}"`);
    }
    expect(appTopBarSource).toContain(
      'label: getAtriumProductNavLabel("programs")',
    );
    expect(appTopBarSource).toContain('href: "/admin"');
    expect(appTopBarSource).toContain('href: "/learn"');
    expect(appTopBarSource).toContain('href: "/product"');
    expect(appTopBarSource).toContain("resolveModuleAccess");
    expect(appTopBarSource).toContain("getAtriumProductNavLabel");
  });

  it("keeps top navigation keyboard-visible and responsive", () => {
    expect(appTopBarSource).toContain("app-top-bar__nav-link:focus-visible");
    expect(appTopBarSource).toContain("app-top-bar__sign-out:focus-visible");
    expect(appTopBarSource).toContain("scroll-snap-type: x proximity");
    expect(appTopBarSource).toContain("@media (max-width: 960px)");
    expect(appTopBarSource).toContain("@media (max-width: 430px)");
    expect(appTopBarSource).toContain('aria-label="Sign out"');
  });

  it("keeps top bar free of duplicated workspace clutter", () => {
    expect(appTopBarSource).not.toContain("tenantName =");
    expect(appTopBarSource).not.toContain("timeString ?");
    expect(appTopBarSource).not.toContain("Home cockpit");
  });
});

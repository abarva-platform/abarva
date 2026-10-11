import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Home/Admin boundary contract", () => {
  it("keeps /home on the canonical canvas with no retired runtime root", () => {
    const pageSource = readRepoFile("src/app/(maestro)/home/page.tsx");

    expect(pageSource).toContain("import { HomeCanvasApp }");
    expect(pageSource).toContain("<HomeCanvasApp");
    expect(pageSource).not.toMatch(/HomePreviewAppRoot|HomeV4App/);
    expect(pageSource).toContain("getHomeReviewBundle");
    expect(pageSource).toContain("HOME_PREVIEW_TENANT_KEYS");
    expect(pageSource).not.toContain("HomeEnterpriseLandscapeV2");
    expect(pageSource).not.toContain("import { AiSuccessCommandCenter }");
    expect(pageSource).not.toContain("readSkyHarborAiSuccessHome");
    expect(pageSource).not.toContain("homeView=explorer");
    expect(pageSource).not.toMatch(
      /HomeExecutiveCockpit|HomeOverviewV2|HomeIndexPage|StewardOrientationBlock/,
    );
    expect(pageSource).not.toMatch(
      /ImpactInsightsHome|HomeOverviewV2|HomeIndexPage|StewardOrientationBlock/,
    );
  });

  it("keeps context and architecture inside the canonical Home canvas", () => {
    const pageSource = readRepoFile("src/app/(maestro)/home/page.tsx");
    const shellSource = readRepoFile(
      "src/components/home/canvas/HomeCanvasApp.tsx",
    );
    const chapterSource = readRepoFile(
      "src/components/home/canvas/ChapterCanvas.tsx",
    );
    const architectureSource = readRepoFile(
      "src/components/home/canvas/ArchitectureCanvas.tsx",
    );
    const browserSource = readRepoFile(
      "src/components/home/v4/RecordBrowser.tsx",
    );

    expect(shellSource).toContain("The enterprise");
    expect(shellSource).toContain("Evidence families");
    expect(shellSource).toContain("Current-state architecture");
    expect(shellSource).toContain("Browse the record");
    expect(chapterSource).toContain("LeadershipCanvas");
    expect(architectureSource).toContain("resolveArchitectureView");
    expect(browserSource).toContain("Slice / dice viewer");
    expect(browserSource).toContain("Relationship lens");
    expect(pageSource).toContain("<HomeCanvasApp");
    expect(pageSource).not.toContain("HomeSurface");
    expect(pageSource).not.toContain("buildHomeRuntimeSummarySnapshot");
  });

  it("resolves the initial Home view from URL parameters, not browser-only state", () => {
    const shellSource = readRepoFile(
      "src/components/home/canvas/HomeCanvasApp.tsx",
    );
    expect(shellSource).toContain("resolveCanvasLocation(params, bundle)");
    expect(shellSource).not.toContain("useState<ActiveView>");
  });

  it("keeps the Home explorer as canvas state, not hash-anchor document navigation", () => {
    const commandCenterSource = readRepoFile(
      "src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx",
    );
    const architectureSource = readRepoFile(
      "src/components/architecture/CurrentStateArchitectureMap.tsx",
    );

    expect(commandCenterSource).toContain(
      "data-active-section={activeSection}",
    );
    expect(commandCenterSource).toContain('type="button"');
    expect(commandCenterSource).toContain("window.history.replaceState");
    expect(commandCenterSource).not.toMatch(/href=\\{`#|href="#/);
    expect(commandCenterSource).not.toContain("IntersectionObserver");
    expect(commandCenterSource).not.toContain("document.getElementById");
    expect(architectureSource).toContain("Architecture review board");
    expect(architectureSource).toContain(
      'data-testid="current-state-architecture-board"',
    );
  });

  it("keeps legacy setup-ish Home URLs redirected into Admin", () => {
    const proxySource = readRepoFile("src/proxy.ts");

    for (const [legacyPath, canonicalPath] of [
      ['"/home/admin"', '"/admin"'],
      ['"/home/data-loads"', '"/admin"'],
      ['"/home/data-trust"', '"/admin"'],
      ['"/home/agent-readiness"', '"/admin"'],
      ['"/home/connectors"', '"/admin"'],
      ['"/home/configuration"', '"/admin"'],
      ['"/home/tenant-profile"', '"/admin"'],
    ] as const) {
      expect(proxySource).toContain(`${legacyPath}: ${canonicalPath}`);
    }

    expect(proxySource).toContain(
      'request.nextUrl.pathname.startsWith("/home/admin/")',
    );
    expect(proxySource).toContain('new URL("/admin" + request.nextUrl.search');
    expect(proxySource).toContain(
      'request.nextUrl.pathname.startsWith("/home/connectors/")',
    );
    expect(proxySource).toContain('new URL("/admin" + request.nextUrl.search');
    expect(proxySource).toContain('request.nextUrl.pathname === "/setup"');
    expect(proxySource).toContain(
      'NextResponse.redirect(new URL("/admin", request.url), 301)',
    );
    expect(proxySource).toContain('pathname === "/home"');
    expect(proxySource).toContain('pathname.startsWith("/home/")');
  });

  it("redirects the retired Home Knowledge proof path before route gating", () => {
    const proxySource = readRepoFile("src/proxy.ts");
    const redirectIndex = proxySource.indexOf(
      "request.nextUrl.pathname === FOUNDATION_HOME_KNOWLEDGE_ROUTE",
    );
    const authGateIndex = proxySource.indexOf("const requiresAuth");

    expect(redirectIndex).toBeGreaterThan(-1);
    expect(authGateIndex).toBeGreaterThan(-1);
    expect(redirectIndex).toBeLessThan(authGateIndex);
    expect(proxySource).toContain(
      'NextResponse.redirect(new URL("/home", request.url), 302)',
    );
  });

  it("binds visible Home tenant identity to the canonical tenant resolver", () => {
    const pageSource = readRepoFile("src/app/(maestro)/home/page.tsx");
    const queueSource = readRepoFile("src/app/(maestro)/home/queue/page.tsx");

    expect(pageSource).toContain('from "@/lib/tenant/resolveTenant"');
    expect(pageSource).toContain("resolveTenant().catch");
    expect(pageSource).toContain("function toHomeTenantKey(");
    expect(pageSource).toContain("canonicalTenantKey");
    expect(pageSource).toContain("isHomePreviewTenantKey");
    expect(pageSource).toContain("const activeTenantKey");
    expect(pageSource).toContain("const requestedTenantKey");
    expect(pageSource).toContain("tenantName,");
    expect(pageSource).toContain("<HomeCanvasApp");
    expect(pageSource).toContain("bundle={bundle}");
    expect(pageSource).not.toContain("Governed Source L4 / cube");
    expect(pageSource).not.toContain("Source L4 / Cube");
    expect(pageSource).not.toContain("orientationPack.buildVersion");
    expect(pageSource).not.toContain('from "@/lib/active-client"');
    expect(pageSource).not.toContain("ACTIVE_CLIENT_COOKIE");
    expect(queueSource).toContain('redirect("/home")');
    expect(queueSource).not.toContain("airline-demo-new");
  });
});

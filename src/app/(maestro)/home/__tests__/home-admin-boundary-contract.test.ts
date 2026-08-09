import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Home/Admin boundary contract", () => {
  it("keeps /home on the integrated enterprise landscape canvas", () => {
    const pageSource = readRepoFile("src/app/(maestro)/home/page.tsx");

    expect(pageSource).toContain("import { HomeEnterpriseLandscapeV2 }");
    expect(pageSource).toContain("<HomeEnterpriseLandscapeV2");
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

  it("keeps context and architecture native to the V0.2 Home canvas", () => {
    const pageSource = readRepoFile("src/app/(maestro)/home/page.tsx");
    const modelSource = readRepoFile(
      "src/components/home/enterprise-landscape-v2/homeEnterpriseLandscapeV2Model.ts",
    );

    expect(modelSource).toContain('"context"');
    expect(modelSource).toContain('"architecture"');
    expect(modelSource).toContain("contextSignals");
    expect(modelSource).toContain("architectureLayers");
    expect(modelSource).toContain("architectureDeployments");
    expect(modelSource).toContain("architectureArchetypes");
    expect(modelSource).toContain("Data and AI flow");
    expect(modelSource).toContain("Global airline operating context");
    expect(modelSource).toContain("Applications, cloud, data, integration");
    expect(modelSource).toContain("On-prem / private DC");
    expect(modelSource).toContain("AI agents and copilots");
    expect(pageSource).toContain("<HomeEnterpriseLandscapeV2");
    expect(pageSource).not.toContain("HomeSurface");
    expect(pageSource).not.toContain("buildHomeRuntimeSummarySnapshot");
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
});

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Home/Admin boundary contract", () => {
  it("keeps the canonical /home entry on the AI Success Command Center", () => {
    const pageSource = readRepoFile("src/app/(maestro)/home/page.tsx");
    const commandCenterSource = readRepoFile(
      "src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx",
    );

    expect(pageSource).toContain("import { AiSuccessCommandCenter }");
    expect(pageSource).toContain("readSkyHarborAiSuccessHome");
    expect(pageSource).not.toMatch(
      /HomeExecutiveCockpit|HomeOverviewV2|HomeIndexPage|StewardOrientationBlock/,
    );

    expect(pageSource).toContain("<AiSuccessCommandCenter");
    expect(commandCenterSource).toContain("CurrentStateArchitectureMap");
    expect(commandCenterSource).toContain(
      "AI is scaling across SkyHarbor. Value proof has not caught up.",
    );
    expect(commandCenterSource).toContain("Of 162 governed value claims");
    expect(pageSource).not.toMatch(
      /ImpactInsightsHome|HomeOverviewV2|HomeIndexPage|StewardOrientationBlock/,
    );
  });

  it("keeps /home data-bound to the SkyHarbor command-center snapshot", () => {
    const pageSource = readRepoFile("src/app/(maestro)/home/page.tsx");
    const dataSource = readRepoFile(
      "src/lib/home/readSkyHarborAiSuccessHome.ts",
    );

    expect(pageSource).toContain("const data = readSkyHarborAiSuccessHome()");
    expect(dataSource).toContain("architectureGraphSnapshot");
    expect(dataSource).toContain("advisoryResultSnapshot");
    expect(dataSource).toContain("dataCapabilityPacketSnapshot");
    expect(pageSource).not.toContain("HomeSurface");
    expect(pageSource).not.toContain("buildHomeRuntimeSummarySnapshot");
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

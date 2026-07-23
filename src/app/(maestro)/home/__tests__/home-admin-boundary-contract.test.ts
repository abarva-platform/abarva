import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Home/Admin boundary contract", () => {
  it("keeps the canonical /home entry on the insight surface", () => {
    const pageSource = readRepoFile("src/app/(maestro)/home/page.tsx");
    const homeSource = readRepoFile(
      "src/components/home/HomeEnterpriseBriefApp.tsx",
    );

    expect(pageSource).toContain("import { HomeEnterpriseBriefApp }");
    expect(pageSource).not.toMatch(
      /HomeExecutiveCockpit|HomeOverviewV2|HomeIndexPage|StewardOrientationBlock/,
    );

    expect(pageSource).toContain("<HomeEnterpriseBriefApp");
    expect(homeSource).toContain("HomeEnterpriseBriefApp");
    expect(homeSource).toContain("Context Explorer");
    expect(homeSource).toContain("Enterprise relationship map");
    expect(pageSource).not.toMatch(
      /ImpactInsightsHome|HomeOverviewV2|HomeIndexPage|StewardOrientationBlock/,
    );
  });

  it("bounds optional Knowledge pack lookup so /home can render", () => {
    const pageSource = readRepoFile("src/app/(maestro)/home/page.tsx");

    expect(pageSource).toContain("withHomePageTimeout");
    expect(pageSource).toContain("HOME_OPTIONAL_DATA_TIMEOUT_MS");
    expect(pageSource).toContain('"Home Knowledge Pack v2"');
    expect(pageSource).toContain(
      "readHomeKnowledgeDesignContractForTenantFromPostgres",
    );
    expect(pageSource).toContain("Knowledge pack unavailable");
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
});

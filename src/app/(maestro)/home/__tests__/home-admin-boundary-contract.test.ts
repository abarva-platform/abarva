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
      "src/components/home/ImpactInsightsHome.tsx",
    );

    expect(pageSource).toContain("import { ImpactInsightsHome }");
    expect(pageSource).not.toMatch(
      /HomeOverviewV2|HomeIndexPage|StewardOrientationBlock/,
    );

    expect(homeSource).toContain('data-testid="home-impact-insights"');
    expect(homeSource).toContain("InsightConstellation");
    expect(homeSource).not.toMatch(
      /\b(admin|setup|upload|data loads?|connectors?|templates?|corpus|depth|breadth|segments loaded|template coverage|connector health)\b/i,
    );
  });

  it("keeps legacy setup-ish Home URLs redirected into Admin", () => {
    const proxySource = readRepoFile("src/proxy.ts");

    for (const [legacyPath, canonicalPath] of [
      ['"/home/admin"', '"/admin"'],
      ['"/home/data-loads"', '"/admin/setup"'],
      ['"/home/data-trust"', '"/admin/data-trust"'],
      ['"/home/agent-readiness"', '"/admin/agent-readiness"'],
      ['"/home/connectors"', '"/admin/connectors"'],
      ['"/home/configuration"', '"/admin"'],
      ['"/home/tenant-profile"', '"/admin?tab=tenant"'],
    ] as const) {
      expect(proxySource).toContain(`${legacyPath}: ${canonicalPath}`);
    }

    expect(proxySource).toContain(
      'request.nextUrl.pathname.startsWith("/home/admin/")',
    );
    expect(proxySource).toContain('"/admin/" + sub + request.nextUrl.search');
    expect(proxySource).toContain(
      'request.nextUrl.pathname.startsWith("/home/connectors/")',
    );
    expect(proxySource).toContain(
      '"/admin/connectors/" + sub + request.nextUrl.search',
    );
    expect(proxySource).toContain('request.nextUrl.pathname === "/setup"');
    expect(proxySource).toContain(
      'NextResponse.redirect(new URL("/admin", request.url), 301)',
    );
    expect(proxySource).toContain('const homeCandidate = "/home/" + sub;');
    expect(proxySource).toContain(
      "const target = homeToAdminMap[homeCandidate] ?? homeCandidate;",
    );
  });
});

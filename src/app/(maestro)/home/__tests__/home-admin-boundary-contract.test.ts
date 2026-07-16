import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Home/Admin boundary contract", () => {
  it("keeps the canonical /home entry on the insight surface", () => {
    const pageSource = readRepoFile("src/app/(maestro)/home/page.tsx");
    const homeSource = readRepoFile("src/components/home/HomeSurface.tsx");

    expect(pageSource).toContain("import { HomeSurface }");
    expect(pageSource).not.toMatch(
      /HomeOverviewV2|HomeIndexPage|StewardOrientationBlock/,
    );

    expect(pageSource).toContain("<HomeSurface");
    expect(homeSource).toContain("HomeSurface");
    expect(pageSource).not.toMatch(
      /ImpactInsightsHome|HomeOverviewV2|HomeIndexPage|StewardOrientationBlock/,
    );
  });

  it("bounds optional Knowledge enrichment so /home can render", () => {
    const pageSource = readRepoFile("src/app/(maestro)/home/page.tsx");

    expect(pageSource).toContain("withHomePageTimeout");
    expect(pageSource).toContain("HOME_OPTIONAL_DATA_TIMEOUT_MS");
    expect(pageSource).toContain("HOME_OPTIONAL_RENDER_TIMEOUT_MS");
    expect(pageSource).toContain('"module context"');
    expect(pageSource).toContain('"V7 context browser"');
    expect(pageSource).toContain('"inventory snapshot"');
    expect(pageSource).toContain('"tenant source files"');
    expect(pageSource).toContain('"Claude summary render"');
    expect(pageSource).toContain("buildHomeSummarySnapshot({");
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
    expect(proxySource).toContain(
      'new URL("/admin" + request.nextUrl.search',
    );
    expect(proxySource).toContain('request.nextUrl.pathname === "/setup"');
    expect(proxySource).toContain(
      'NextResponse.redirect(new URL("/admin", request.url), 301)',
    );
    expect(proxySource).toContain('pathname === "/home"');
    expect(proxySource).toContain('pathname.startsWith("/home/")');
  });
});

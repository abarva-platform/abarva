import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// This is the only suite in this directory that still describes code that
// ships. The other 25 read files under `src/components/intelligence/` and the
// retired `src/app/intelligence/*` route trees as TEXT; none of those files
// exists, and they are quarantined by name in
// `scripts/quality/intelligence-integration-quarantine.json`.
//
// Two assertions here were stale in a way worth naming, because both are the
// failure mode this directory is full of:
//
//   · `toContain("return 'first-capital'")` matched a source literal together
//     with its surrounding QUOTE CHARACTERS. The mapping it stands for is still
//     in the page, written with double quotes. The assertion tracked the
//     formatter, not the behaviour, so it is now matched quote-agnostically.
//   · `toContain("AbarVa Intelligence")` and its two siblings named copy that
//     is not in the component and never was — the route's advisory framing
//     lives in the page's `metadata`. Worse, the five NEGATIVE assertions in
//     the same case named copy that exists nowhere in `src/`, so that case
//     passed vacuously for everything it was written to catch: it would have
//     passed against an empty file. The guard is real, so it now runs over the
//     whole advisory surface rather than one file where it has no target.

const MAESTRO_PAGE = "src/app/(maestro)/intelligence/page.tsx";
const ADVISORY_DIR = "src/components/intelligence-advisory";

describe("Advisory Intelligence route wiring", () => {
  const maestroPageSource = readFileSync(MAESTRO_PAGE, "utf8");

  it("renders the advisory board from the maestro shell route, not a raw root page", () => {
    expect(maestroPageSource).toContain("AppShell");
    expect(maestroPageSource).toContain('surface="intelligence"');
    expect(maestroPageSource).toContain("AdvisoryIntelligencePage");
    expect(maestroPageSource).toContain("getEnterpriseLandscapeViewModel");
    expect(maestroPageSource).toContain("enterpriseContextTenantKey");
    expect(maestroPageSource).not.toContain("IntelligenceV3Page");
    expect(maestroPageSource).not.toContain("buildIntelligenceV3PageData");
    expect(maestroPageSource).not.toContain("ContextCorpusExplorerPage");
  });

  it("maps each alias tenant key to its canonical key regardless of quote style", () => {
    // The property is the mapping. Quote characters are the formatter's
    // business, and matching them is what made these three go stale.
    for (const canonical of ["first-capital", "meridian-health", "apex-retail"]) {
      expect(maestroPageSource).toMatch(
        new RegExp(`return\\s+["']${canonical}["']`),
      );
    }
  });

  it("does not create a duplicate route-group page for /intelligence", () => {
    expect(existsSync(MAESTRO_PAGE)).toBe(true);
    expect(existsSync("src/app/intelligence/page.tsx")).toBe(false);
    expect(
      existsSync(
        "src/components/intelligence-v4/ContextCorpusExplorerPage.tsx",
      ),
    ).toBe(false);
  });

  it("presents the route as an advisory board", () => {
    expect(maestroPageSource).toMatch(/title:\s*["'][^"']*Advisory Board/i);
    expect(maestroPageSource).toContain(
      'from "@/components/intelligence-advisory/AdvisoryIntelligencePage"',
    );
  });

  it("keeps old repository/explorer language off the whole advisory surface", () => {
    // Previously read one component file, where none of these strings has ever
    // appeared — so every assertion passed no matter what the surface said.
    // Reading the route page and every advisory source file gives the guard
    // somewhere the copy could actually reappear.
    const advisorySources = readdirSync(ADVISORY_DIR)
      .filter((name) => /\.(tsx?|css)$/.test(name))
      .map((name) => readFileSync(path.join(ADVISORY_DIR, name), "utf8"));

    expect(advisorySources.length).toBeGreaterThan(0);

    for (const source of [maestroPageSource, ...advisorySources]) {
      expect(source).not.toContain("What your context is telling us");
      expect(source).not.toContain("The strongest cross-context reads");
      expect(source).not.toContain("Dimensions Loaded");
      expect(source).not.toContain("Graph Edges");
      expect(source).not.toContain("Ask about loaded context");
    }
  });

  it("tenant-scoped intelligence route has been removed (redirected via app layout)", () => {
    // The tenant/[tenantSlug]/intelligence/ route tree was removed as part of
    // the legacy surface sunset. Deep-links now redirect at the app level.
    //
    // `intelligence-route-shell-wiring.test.ts`, in this same directory,
    // asserts that this exact file EXISTS. It is quarantined; the contradiction
    // is recorded there rather than resolved by weakening either side.
    expect(
      existsSync("src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx"),
    ).toBe(false);
  });
});

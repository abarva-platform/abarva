// PROG23 · Program Source link deepening.
//
// Verifies the cross-surface context wiring added in PROG23:
//   1. ProgramDetailPage imports SourceEventChip + buildProgramSourceLinkView
//   2. program-source-context-card testid present in Overview section
//   3. sourceLinkView is derived from view.displayId (deterministic, no API calls)
//   4. buildProgramSourceLinkView view model contract
//
// (The former Source-side assertions targeted the legacy SourceEventDetailPage
// component, retired 2026-06-03 — the live route renders SourceAnalyticsCanvas.)

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildProgramSourceLinkView } from "@/lib/programs/program-source-link-view";

const DETAIL_PATH = join(
  process.cwd(),
  "src/components/programs/ProgramDetailPage.tsx",
);
const LINK_LIB_PATH = join(
  process.cwd(),
  "src/lib/programs/program-source-link-view.ts",
);

const detailSrc = readFileSync(DETAIL_PATH, "utf8");
const linkLibSrc = readFileSync(LINK_LIB_PATH, "utf8");

// ─── Programs side ────────────────────���───────────────────���────────────────

describe("PROG23 · ProgramDetailPage · source link imports", () => {
  it("imports SourceEventChip from programs components", () => {
    expect(detailSrc).toContain('from "@/components/programs/SourceEventChip"');
  });

  it("imports buildProgramSourceLinkView from programs lib", () => {
    expect(detailSrc).toContain(
      'from "@/lib/programs/program-source-link-view"',
    );
  });

  it("derives sourceLinkView from view.displayId (deterministic)", () => {
    expect(detailSrc).toContain("buildProgramSourceLinkView(view.displayId)");
  });
});

describe("PROG23 · ProgramDetailPage · source context card", () => {
  it('has data-testid="program-source-context-card" in Overview section', () => {
    expect(detailSrc).toContain('data-testid="program-source-context-card"');
  });

  it("renders SourceEventChip when sourceLinkView is available", () => {
    expect(detailSrc).toContain("<SourceEventChip view={sourceLinkView}");
  });

  it("source context card is gated on sourceLinkView truthy check", () => {
    expect(detailSrc).toContain("sourceLinkView && (");
  });
});

// ─── View model lib ───────��────────────────────────────���────────────────────

describe("PROG23 · program-source-link-view · source audit", () => {
  it("buildProgramSourceLinkView is exported", () => {
    expect(linkLibSrc).toContain("export function buildProgramSourceLinkView");
  });

  it("module contains no runtime impurity", () => {
    expect(linkLibSrc).not.toMatch(/Date\.now/);
    expect(linkLibSrc).not.toMatch(/Math\.random/);
    expect(linkLibSrc).not.toMatch(/fetch\(/);
  });

  it("deterministicSeed is true literal", () => {
    expect(linkLibSrc).toContain("deterministicSeed: true");
  });
});

describe("PROG23 · program-source-link-view · runtime contract", () => {
  it("APX-CDP-2026 returns a non-null view", () => {
    const view = buildProgramSourceLinkView("APX-CDP-2026");
    expect(view).not.toBeNull();
    expect(view!.deterministicSeed).toBe(true);
  });

  it("unknown programCode returns null", () => {
    const view = buildProgramSourceLinkView("unknown-program");
    expect(view).toBeNull();
  });

  it("has non-empty topCommercialBlocker (not fabricated)", () => {
    const view = buildProgramSourceLinkView("APX-CDP-2026");
    expect(view!.topCommercialBlocker.trim().length).toBeGreaterThan(0);
  });

  it("routeHint points to source event", () => {
    const view = buildProgramSourceLinkView("APX-CDP-2026");
    expect(view!.routeHint).toContain("/source/events/");
  });

  it("is deterministic across calls", () => {
    const a = buildProgramSourceLinkView("APX-CDP-2026");
    const b = buildProgramSourceLinkView("APX-CDP-2026");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

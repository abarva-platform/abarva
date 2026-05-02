/**
 * SHELL-V2 mode layout guard.
 *
 * Static analysis tests that verify the Shell Layout Spec v2 single-chat-surface
 * invariant is maintained across all surfaces.
 *
 * Rules enforced:
 *  1. No surface page should import BOTH AgentColumn AND AskAnythingBar
 *     (each surface has exactly one chat entry point).
 *  2. Mode A index surfaces must not import AskAnythingBar.
 *  3. Mode B detail surfaces must import AtlasDrawer and RibbonSynthesis.
 *  4. AtlasPageStateProvider must not be imported directly by surface pages
 *     (it is mounted by AppShell — pages use the hook via useAtlasPageState).
 *
 * Shell Layout Spec v2 §3 · April 2026
 */

import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(process.cwd(), "src");

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf-8");
}

function hasImport(content: string, symbol: string): boolean {
  return (
    new RegExp(`import[^;]*['"][^'"]*${symbol}[^'"]*['"]`).test(content) ||
    content.includes(`{ ${symbol} }`) ||
    content.includes(`{ ${symbol},`)
  );
}

// ── Rule 1: no dual-chat surface ──────────────────────────────────────────────

describe("SHELL-V2 Rule 1 — no dual-chat surface", () => {
  const surfaceFiles = [
    "components/tower/TowerIndexPage.tsx",
    "components/intelligence/IntelligenceIndexPage.tsx",
    "components/home/HomeIndexPage.tsx",
    "components/setup/SetupConnectorsPage.tsx",
    "components/setup/SetupPoliciesPage.tsx",
    "components/setup/SetupTenantPage.tsx",
    "components/setup/SetupUsersPage.tsx",
    "components/setup/SetupAuditPage.tsx",
    "components/programs/ProgramsIndexPage.tsx",
    "components/source/SourceIndexPage.tsx",
    "components/programs/ProgramDetailPage.tsx",
    "components/source/SourceEventDetailPage.tsx",
  ];

  for (const file of surfaceFiles) {
    test(`${file} does not have both AgentColumn and AskAnythingBar`, () => {
      const content = read(file);
      const hasAgentColumn = hasImport(content, "AgentColumn");
      const hasAskAnythingBar = hasImport(content, "AskAnythingBar");
      const hasBoth = hasAgentColumn && hasAskAnythingBar;

      if (hasBoth) {
        throw new Error(
          `${file} imports both AgentColumn and AskAnythingBar. ` +
            "Each surface must have exactly one chat entry point. " +
            "Mode A surfaces use AgentColumn; Mode B detail surfaces use AtlasDrawer.",
        );
      }
    });
  }
});

// ── Rule 2: Mode A index surfaces have no AskAnythingBar ──────────────────────

describe("SHELL-V2 Rule 2 — Mode A surfaces have no AskAnythingBar", () => {
  const modeASurfaces = [
    "components/tower/TowerIndexPage.tsx",
    "components/intelligence/IntelligenceIndexPage.tsx",
    "components/home/HomeIndexPage.tsx",
    "components/setup/SetupConnectorsPage.tsx",
    "components/setup/SetupPoliciesPage.tsx",
    "components/programs/ProgramsIndexPage.tsx",
    "components/source/SourceIndexPage.tsx",
  ];

  for (const file of modeASurfaces) {
    test(`${file} does not import AskAnythingBar`, () => {
      const content = read(file);
      if (hasImport(content, "AskAnythingBar")) {
        throw new Error(
          `${file} imports AskAnythingBar but is a Mode A surface. ` +
            "AgentColumn handles chat in Mode A — remove AskAnythingBar.",
        );
      }
    });
  }
});

// ── Rule 3: Mode B detail surfaces use AtlasDrawer + RibbonSynthesis ─────────

describe("SHELL-V2 Rule 3 — Mode B surfaces use AtlasDrawer + RibbonSynthesis", () => {
  const modeBSurfaces = [
    "components/programs/ProgramDetailPage.tsx",
    "components/source/SourceEventDetailPage.tsx",
  ];

  for (const file of modeBSurfaces) {
    test(`${file} imports AtlasDrawer`, () => {
      const content = read(file);
      if (!hasImport(content, "AtlasDrawer")) {
        throw new Error(
          `${file} is a Mode B surface but does not import AtlasDrawer. ` +
            "Add AtlasDrawer per Shell Layout Spec v2 §5.1.",
        );
      }
    });

    test(`${file} imports RibbonSynthesis`, () => {
      const content = read(file);
      if (!hasImport(content, "RibbonSynthesis")) {
        throw new Error(
          `${file} is a Mode B surface but does not import RibbonSynthesis. ` +
            "Add RibbonSynthesis per Shell Layout Spec v2 §5.2.",
        );
      }
    });
  }
});

// ── Rule 4: surface pages don't directly import AtlasPageStateProvider ────────

describe("SHELL-V2 Rule 4 — surface pages do not directly import AtlasPageStateProvider", () => {
  const surfaceFiles = [
    "components/tower/TowerIndexPage.tsx",
    "components/intelligence/IntelligenceIndexPage.tsx",
    "components/home/HomeIndexPage.tsx",
    "components/programs/ProgramsIndexPage.tsx",
    "components/programs/ProgramDetailPage.tsx",
    "components/source/SourceIndexPage.tsx",
    "components/source/SourceEventDetailPage.tsx",
  ];

  for (const file of surfaceFiles) {
    test(`${file} does not directly import AtlasPageStateProvider (AppShell mounts it)`, () => {
      const content = read(file);
      // The hook (useAtlasPageState) is fine — just the Provider component itself
      if (hasImport(content, "AtlasPageStateProvider")) {
        throw new Error(
          `${file} directly imports AtlasPageStateProvider. ` +
            "AppShell mounts the provider — surface pages should only use " +
            "the useAtlasPageState() hook.",
        );
      }
    });
  }
});

// ── Rule 5: global cockpit nav is top-bar first ──────────────────────────────

describe("SHELL-V2 Rule 5 — cockpit shell uses a single top product nav", () => {
  test("AppShell does not render the legacy AppRail unless explicitly opted in", () => {
    const content = read("components/shell/AppShell.tsx");

    expect(content).toContain("showProductNav = true");
    expect(content).toContain("showAppRail = false");
    expect(content).toContain("showAppRail ? <AppRail /> : null");
  });

  test("AppTopBar owns the authenticated product nav labels", () => {
    const content = read("components/shell/AppTopBar.tsx");

    for (const label of ["Home", "Setup", "Source", "Intelligence", "Tower", "Learn"]) {
      expect(content).toContain(`label: "${label}"`);
    }
    expect(content).toContain('label: getAtriumProductNavLabel("programs")');
    expect(content).toContain('aria-label="Product modules"');
  });
});

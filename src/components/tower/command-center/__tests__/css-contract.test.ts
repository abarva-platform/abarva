// Guard: every CSS-module class the components reference must exist in
// TowerCommandCenter.module.css.
//
// Why this test exists: next/jest maps `*.module.css` to a proxy that returns
// the key name for ANY property, and in the browser a missing key is simply
// `undefined` — which React renders as no class at all. A typo therefore
// produces an unstyled element and NO error, in tests or in production. Since
// this page is a verbatim transcription of a pixel contract, a silently
// dropped class is exactly the failure mode that matters most.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src/components/tower/command-center");
const CSS_PATH = path.join(ROOT, "TowerCommandCenter.module.css");

/** Every class selector declared in the module, e.g. `.ptHero` → `ptHero`. */
function declaredClasses(css: string): Set<string> {
  const names = new Set<string>();
  // Strip comments so a class name inside prose is not counted as declared.
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of stripped.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
    names.add(match[1]);
  }
  return names;
}

/** Every `styles.foo` / `styles['foo']` reference across the component tree. */
function referencedClasses(dir: string): Map<string, string[]> {
  const refs = new Map<string, string[]>();
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__tests__") continue;
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      const source = fs.readFileSync(full, "utf8");
      const rel = path.relative(ROOT, full);
      for (const match of source.matchAll(/\bstyles\.([A-Za-z_][\w]*)/g)) {
        refs.set(match[1], [...(refs.get(match[1]) ?? []), rel]);
      }
      for (const match of source.matchAll(/\bstyles\[['"]([^'"]+)['"]\]/g)) {
        refs.set(match[1], [...(refs.get(match[1]) ?? []), rel]);
      }
    }
  };
  walk(dir);
  return refs;
}

describe("TowerCommandCenter.module.css contract", () => {
  const css = fs.readFileSync(CSS_PATH, "utf8");
  const declared = declaredClasses(css);
  const referenced = referencedClasses(ROOT);
  // Rules only — the file's prose explains what it deliberately does NOT do,
  // and that prose must not be mistaken for a declaration.
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, "");

  it("declares every class the components reference", () => {
    const missing = [...referenced.entries()]
      .filter(([name]) => !declared.has(name))
      .map(
        ([name, files]) =>
          `${name} (used in ${[...new Set(files)].join(", ")})`,
      );
    expect(missing).toEqual([]);
  });

  it("does not re-assert a full viewport height — AppShell already owns it", () => {
    // The design's `.app { height:100vh }` is the one rule deliberately dropped.
    // Re-adding it here would reproduce the phantom-scroll bug fixed in 3d89299e9.
    expect(rules).not.toMatch(/(?:min-)?height:\s*100vh/);
  });

  it("scopes the six drifted neutral overrides to the page root only", () => {
    const rootBlock = rules.slice(
      rules.indexOf(".root {"),
      rules.indexOf(".root *,"),
    );
    for (const token of [
      "--canon-bg-cream",
      "--canon-gray-900",
      "--canon-gray-700",
      "--canon-gray-300",
      "--canon-gray-200",
      "--canon-gray-100",
    ]) {
      expect(rootBlock).toContain(token);
    }
    // Never a bare :root / global override — that would restyle Moves, Source,
    // Intelligence and Home, which the locked global canon forbids.
    expect(rules).not.toMatch(/:root\s*\{/);
    expect(rules).not.toMatch(/:global/);
  });

  it("keeps the fixed shell horizontally shrinkable", () => {
    for (const selector of [
      ".root",
      ".stage",
      ".wrap",
      ".dashTop",
      ".bodyregion",
      ".view",
      ".card",
    ]) {
      const blockStart = rules.indexOf(`${selector} {`);
      expect(blockStart).toBeGreaterThanOrEqual(0);
      const blockEnd = rules.indexOf("}", blockStart);
      const block = rules.slice(blockStart, blockEnd);
      expect(block).toContain("min-width: 0");
    }

    const tabsStart = rules.indexOf(".tabs {");
    expect(tabsStart).toBeGreaterThanOrEqual(0);
    const tabsBlock = rules.slice(tabsStart, rules.indexOf("}", tabsStart));
    expect(tabsBlock).toContain("overflow-x: auto");
  });
});

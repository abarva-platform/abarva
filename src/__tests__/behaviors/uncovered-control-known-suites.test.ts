import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * The AI surface control gate checks a declared behavioral test hard: the path
 * must exist, the catalog workflow must actually run it, and the name filter
 * the workflow uses must be the one the catalog declares. Rename the test and
 * the gate fails. That is a control that can fail.
 *
 * Its other branch could not. A control declaring
 * `behavioralTest.status: "none"` was checked for exactly two things — that it
 * names no path, and that its `reason` is at least forty characters of prose.
 * Nothing compared that prose to the repository, so a reason stayed green
 * however far it drifted from the code.
 *
 * It had drifted. `source-estimate-assumption-disclosure` declared *"The
 * disclosure component has no rendering suite, so nothing proves the
 * assumptions list renders rather than collapsing to an empty node"* while
 * `src/components/source/__tests__/EstimateAssumptionDisclosure.test.tsx` sat
 * on `main` rendering that component and asserting both assumption strings.
 * Both clauses of the stated reason were false, and the gate had no way to say
 * so — which is the same shape as the gate that proved a control existed
 * because its name appeared in the file.
 *
 * So an uncovered control now declares `knownSuites`: every test file that
 * references it. The audit derives that set from the tree and fails on any
 * disagreement. A suite landing on an uncovered control turns the gate red
 * until someone reconciles the reason, instead of leaving the prose to rot.
 *
 * The expected set below is walked here, independently of the script under
 * test. Asking the implementation what the answer is and then checking it
 * against itself is a control that cannot fail either.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CATALOG_REL = "docs/security/ai-surface-control-catalog.json";
const SCRIPT = path.join(repoRoot, "scripts/audit/ai-surface-control-catalog.mjs");

type Catalog = {
  controls: Array<{
    id: string;
    path: string;
    requiredControls: Array<{
      kind: string;
      behavioralTest: { status?: string; path?: string; reason?: string; knownSuites?: string[] };
    }>;
  }>;
};

function readCatalog(): Catalog {
  return JSON.parse(readFileSync(path.join(repoRoot, CATALOG_REL), "utf8")) as Catalog;
}

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "coverage"]);

function isTestFile(rel: string): boolean {
  return /(^|\/)__tests__\//.test(rel) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(rel);
}

/** Independent walk: every test file under src/ that names this token. */
function suitesReferencing(token: string): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(rel);
        continue;
      }
      if (!isTestFile(rel)) continue;
      if (readFileSync(path.join(repoRoot, rel), "utf8").includes(token)) found.push(rel);
    }
  };
  walk("src");
  return found.sort();
}

function moduleToken(controlPath: string): string {
  return path.basename(controlPath).replace(/\.[^.]+$/, "");
}

function uncoveredControls(catalog: Catalog) {
  return catalog.controls.flatMap((surface) =>
    surface.requiredControls
      .filter((control) => control.behavioralTest?.status === "none")
      .map((control) => ({ surface, control })),
  );
}

/** Run the audit against a catalog of our choosing. Returns exit code + output. */
function runAudit(catalogPath: string): { code: number; output: string } {
  try {
    const output = execFileSync(process.execPath, [SCRIPT], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, AI_SURFACE_CONTROL_CATALOG_PATH: catalogPath },
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, output };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function writeFixture(mutate: (catalog: Catalog) => void): string {
  const catalog = readCatalog();
  mutate(catalog);
  const file = path.join(mkdtempSync(path.join(tmpdir(), "ai-surface-catalog-")), "catalog.json");
  writeFileSync(file, JSON.stringify(catalog, null, 2));
  return file;
}

describe("an uncovered AI-surface control reconciles against the suites that exist", () => {
  it("declares knownSuites, and the declaration matches an independent walk of the tree", () => {
    const catalog = readCatalog();
    const uncovered = uncoveredControls(catalog);
    expect(uncovered.length).toBeGreaterThan(0);

    for (const { surface, control } of uncovered) {
      const expected = suitesReferencing(moduleToken(surface.path));
      expect({
        control: `${surface.id}:${control.kind}`,
        knownSuites: control.behavioralTest.knownSuites,
      }).toEqual({
        control: `${surface.id}:${control.kind}`,
        knownSuites: expected,
      });
    }
  });

  it("proves the drifted reason it was written for is gone: a suite renders the Source disclosure", () => {
    const catalog = readCatalog();
    const surface = catalog.controls.find((c) => c.id === "source-estimate-assumption-disclosure");
    expect(surface).toBeDefined();
    const control = surface!.requiredControls.find((c) => c.behavioralTest?.status === "none");
    expect(control).toBeDefined();

    // The suite exists on main, so no reason may claim the component has none.
    expect(control!.behavioralTest.knownSuites).toContain(
      "src/components/source/__tests__/EstimateAssumptionDisclosure.test.tsx",
    );
    expect(control!.behavioralTest.reason ?? "").not.toMatch(/no rendering suite/i);
  });

  it("the real catalog passes the audit", () => {
    const { code } = runAudit(path.join(repoRoot, CATALOG_REL));
    expect(code).toBe(0);
  });

  it("fails when a suite exists that the uncovered control does not name", () => {
    const fixture = writeFixture((catalog) => {
      for (const { control } of uncoveredControls(catalog)) {
        control.behavioralTest.knownSuites = [];
      }
    });

    const { code, output } = runAudit(fixture);
    expect(code).not.toBe(0);
    expect(output).toMatch(/source-estimate-assumption-disclosure:risk-caveat/);
    expect(output).toMatch(/EstimateAssumptionDisclosure\.test\.tsx/);
  });

  it("fails when the control names a suite that does not reference it", () => {
    const fixture = writeFixture((catalog) => {
      const [first] = uncoveredControls(catalog);
      first.control.behavioralTest.knownSuites = [
        ...(first.control.behavioralTest.knownSuites ?? []),
        "src/__tests__/behaviors/uncovered-control-known-suites.test.ts",
      ];
    });

    const { code, output } = runAudit(fixture);
    expect(code).not.toBe(0);
    expect(output).toMatch(/uncovered-control-known-suites\.test\.ts/);
  });

  it("fails when an uncovered control omits knownSuites altogether", () => {
    const fixture = writeFixture((catalog) => {
      for (const { control } of uncoveredControls(catalog)) {
        delete control.behavioralTest.knownSuites;
      }
    });

    const { code, output } = runAudit(fixture);
    expect(code).not.toBe(0);
    expect(output).toMatch(/knownSuites/);
  });
});

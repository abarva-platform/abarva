import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * `routeReachable: false` is the catalog's escape hatch, and `unreachableReason`
 * is the prose that justifies taking it. The gate asked that prose for one
 * thing — forty characters — so every factual clause inside it was free to rot
 * while the gate stayed green. That is the failure `knownSuites` was built
 * against, in the one field `knownSuites` does not reach.
 *
 * It had rotted. The Tower entry asserted that
 * `src/lib/qa/route-smoke-inventory.ts` and
 * `src/lib/qa/founder-demo-route-checklist.ts` *still name it as the component
 * `/tenant/[tenantSlug]/tower` renders*. Both files were on `main`; neither
 * contained `ProgramPressureCards` in any casing. Both had been repointed at
 * `TowerCommandCenterAvaShell`.
 *
 * That sentence is `STALE_TOWER_REASON` below, kept verbatim rather than
 * paraphrased, and it is the load-bearing fixture in this file. The clause is
 * corrected in the same change that adds the rules, so the live catalog now
 * passes — and a clean corpus and a blind detector are indistinguishable from
 * outside. Every run therefore puts the original false clause back and proves
 * the gate still goes red on it. Fixing a defect must not retire the guard
 * that proved it.
 *
 * The opposite direction is measured on the same rule rather than on a
 * different one: `NAMES_A_FILE_THAT_DOES` asserts the same shape about a file
 * that really does name the component, and must pass. A detector that flags
 * the shape rather than the fact would fail that case.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CATALOG_REL = "docs/security/ai-surface-control-catalog.json";
const SCRIPT = path.join(repoRoot, "scripts/audit/ai-surface-control-catalog.mjs");

const TOWER_SURFACE = "tower-atlas-program-pressure-brief";

/** Verbatim, as it stood on `main` at e4b9abb5f. Both clauses about the QA files were false. */
const STALE_TOWER_REASON =
  "The Tower route renders TowerCommandCenterAvaShell; nothing imports ProgramPressureCards. " +
  "The brief's five controls exist in a component the Tower rebuild left behind. " +
  "src/lib/qa/route-smoke-inventory.ts and src/lib/qa/founder-demo-route-checklist.ts still name it " +
  "as the component /tenant/[tenantSlug]/tower renders. " +
  "Fixed by mounting the accountability block in the command-center shell, or by moving these five " +
  "controls to the component that now renders there and retiring this entry.";

/**
 * The same clause shape, about a file that does name the component. Must pass.
 *
 * Its subject used to be `docs/demo/ABARVA_FOUNDER_DEMO_ROUTE_CHECKLIST.md`,
 * whose naming of the retired component was the defect `C-536` then fixed —
 * so this control inverted the moment the corpus improved, going red for the
 * repository getting better. The subject is now the suite that exercises the
 * component, which names it because that is what it is for, and
 * `POSITIVE_CONTROL_SUBJECT` is read at test time so the premise cannot rot
 * again without saying so.
 */
const POSITIVE_CONTROL_SUBJECT =
  "src/__tests__/integration/tower/program-pressure-cards.test.ts";
const NAMES_A_FILE_THAT_DOES =
  `No route imports this component. ${POSITIVE_CONTROL_SUBJECT} still names ` +
  "src/components/tower/ProgramPressureCards.tsx as the component it exercises. " +
  "Fixed by mounting the accountability block in the command-center shell.";

type Catalog = {
  controls: Array<{
    id: string;
    path: string;
    routeReachable?: boolean;
    unreachableReason?: string;
  }>;
};

function readCatalog(): Catalog {
  return JSON.parse(readFileSync(path.join(repoRoot, CATALOG_REL), "utf8")) as Catalog;
}

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
  const file = path.join(mkdtempSync(path.join(tmpdir(), "unreachable-reason-")), "catalog.json");
  writeFileSync(file, JSON.stringify(catalog, null, 2));
  return file;
}

function withTowerReason(reason: string): string {
  return writeFixture((catalog) => {
    const surface = catalog.controls.find((entry) => entry.id === TOWER_SURFACE);
    if (!surface) throw new Error(`${TOWER_SURFACE} is no longer in the catalog`);
    surface.unreachableReason = reason;
  });
}

/** Unreachable surfaces other than the one each fixture mutates. */
function otherUnreachableSurfaceIds(): string[] {
  return readCatalog()
    .controls.filter((entry) => entry.routeReachable === false && entry.id !== TOWER_SURFACE)
    .map((entry) => entry.id);
}

describe("an unreachableReason is checked against the tree it describes", () => {
  it("the real catalog passes", () => {
    const { code, output } = runAudit(path.join(repoRoot, CATALOG_REL));
    expect(output).toContain("AI surface control catalog passed");
    expect(code).toBe(0);
  });

  it("goes red on the clause that was false on main, naming both files it was false about", () => {
    const { code, output } = runAudit(withTowerReason(STALE_TOWER_REASON));

    expect(code).not.toBe(0);
    expect(output).toContain("src/lib/qa/route-smoke-inventory.ts");
    expect(output).toContain("src/lib/qa/founder-demo-route-checklist.ts");
    expect(output).toContain("ProgramPressureCards");
  });

  it("flags only the stale reason, leaving the accurate ones alone", () => {
    const { output } = runAudit(withTowerReason(STALE_TOWER_REASON));
    const findings = output
      .split("\n")
      .filter((line) => line.startsWith("- ") && line.includes("unreachableReason"));

    expect(findings.length).toBeGreaterThan(0);
    for (const other of otherUnreachableSurfaceIds()) {
      expect(findings.filter((line) => line.startsWith(`- ${other}`))).toEqual([]);
    }
  });

  it("passes the same clause shape when the file really does name the component", () => {
    // The premise first: a positive control whose subject stopped naming the
    // component would pass for the wrong reason, or fail while the rule is
    // fine. Read it, do not assume it.
    const subject = readFileSync(path.join(repoRoot, POSITIVE_CONTROL_SUBJECT), "utf8");
    expect(subject).toContain("ProgramPressureCards");

    const { code, output } = runAudit(withTowerReason(NAMES_A_FILE_THAT_DOES));

    expect(output).not.toContain(`${POSITIVE_CONTROL_SUBJECT} still names`);
    expect(code).toBe(0);
  });

  it("goes red when a reason names a path that is not in the tree", () => {
    const { code, output } = runAudit(
      withTowerReason(
        "No route imports this component; it is recorded in " +
          "docs/architecture/unreachable-components-that-do-not-exist.json. Fixed by mounting it.",
      ),
    );

    expect(code).not.toBe(0);
    expect(output).toContain("unreachable-components-that-do-not-exist.json");
    expect(output).toContain("not in the tree");
  });

  it("goes red on a naming claim it cannot resolve, rather than letting vaguer prose through", () => {
    const { code, output } = runAudit(
      withTowerReason(
        "No route reaches this component. Some of the QA inventories still name it as the " +
          "component that route renders. Fixed by mounting the accountability block in the shell.",
      ),
    );

    expect(code).not.toBe(0);
    expect(output).toContain("cannot resolve that to a file and a token");
  });

  it("goes red when an absence claim is false — the module is imported", () => {
    const { code, output } = runAudit(
      withTowerReason(
        "The Tower route renders something else; nothing imports shell-tokens. " +
          "Fixed by mounting the accountability block in the command-center shell.",
      ),
    );

    expect(code).not.toBe(0);
    expect(output).toContain("nothing imports shell-tokens");
  });

  it("is green because of the tree, not because of the sentence shape", () => {
    // The live reason passes. Change only the component it claims those files
    // name, and it must fail — otherwise the pass above is the detector being
    // blind rather than the catalog being accurate.
    const live = readCatalog().controls.find((entry) => entry.id === TOWER_SURFACE);
    expect(live?.unreachableReason).toContain("route-smoke-inventory.ts");

    const swapped = live!.unreachableReason!.replace(
      "src/components/tower/command-center/TowerCommandCenterAvaShell.tsx",
      "src/components/tower/ProgramPressureCards.tsx",
    );
    expect(swapped).not.toEqual(live!.unreachableReason);

    const { code, output } = runAudit(withTowerReason(swapped));
    expect(code).not.toBe(0);
    expect(output).toContain("route-smoke-inventory.ts");
  });
});

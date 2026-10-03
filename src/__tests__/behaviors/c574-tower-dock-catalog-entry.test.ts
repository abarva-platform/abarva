import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * The Tower aVa dock is a live AI surface the control catalog did not list
 * (item C-574). `TowerCommandCenterAvaShell` is what the Tower route renders,
 * and C-416 measured by execution that an answered turn there shows no AI
 * label, no citation, no confidence, no human-approval statement and no risk
 * caveat. With no `controls[]` entry, no gate counted any of that: the audit
 * reported "35 of 35 (100%)" of reachable controls covered while a reachable
 * AI answer carried none of them.
 *
 * The entry declares the five controls as uncovered. These cases prove the
 * entry is counted rather than merely present — the audit names each of the
 * five, on a screen, and taking the entry away moves the report by exactly
 * five — and that it claims no coverage it does not have. Whether the dock
 * should switch its review chrome on is an owner decision and is not asserted
 * here in either direction.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CATALOG_REL = "docs/security/ai-surface-control-catalog.json";
const SCRIPT = path.join(repoRoot, "scripts/audit/ai-surface-control-catalog.mjs");

const SURFACE_ID = "tower-command-center-ava-dock";
const SHELL_PATH = "src/components/tower/command-center/TowerCommandCenterAvaShell.tsx";
const MEASURED_KINDS = ["ai-label", "citation", "confidence", "human-approval-gate", "risk-caveat"];

type BehavioralTest = { status?: string; path?: string; reason?: string };
type Surface = {
  id: string;
  path: string;
  routeReachable?: boolean;
  requiredControls: Array<{ kind: string; behavioralTest?: BehavioralTest }>;
};
type CoverageRow = {
  key: string;
  status?: string;
  surfaceId?: string;
  surfaceJoin?: { state: string };
};
type Catalog = { controls: Surface[]; catalogClaimCoverage: CoverageRow[] };

function readCatalog(): Catalog {
  return JSON.parse(readFileSync(path.join(repoRoot, CATALOG_REL), "utf8")) as Catalog;
}

function runAudit(catalogPath?: string): { code: number; output: string } {
  const env = catalogPath
    ? { ...process.env, AI_SURFACE_CONTROL_CATALOG_PATH: catalogPath }
    : process.env;
  try {
    return {
      code: 0,
      output: execFileSync(process.execPath, [SCRIPT], {
        cwd: repoRoot,
        encoding: "utf8",
        env,
        stdio: ["ignore", "pipe", "pipe"],
      }),
    };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

type Headline = { uncovered: number; declared: number; reachable: number };

function headline(output: string): Headline {
  const uncovered = /Controls with no behavioral test: (\d+) of (\d+)\./.exec(output);
  const reachable = /Reachable share of declared controls: (\d+) of (\d+)/.exec(output);
  if (!uncovered || !reachable) throw new Error(`audit printed no headline:\n${output}`);
  return {
    uncovered: Number(uncovered[1]),
    declared: Number(uncovered[2]),
    reachable: Number(reachable[1]),
  };
}

function rosterLines(output: string): string[] {
  return output.split("\n").filter((line) => line.startsWith("  - "));
}

let live: { code: number; output: string };

beforeAll(() => {
  live = runAudit();
}, 120_000);

describe("C-574 · the Tower aVa dock is a catalogued AI surface", () => {
  it("has a controls[] entry on the shell the Tower route renders, not on an unmounted component", () => {
    const surface = readCatalog().controls.find((entry) => entry.id === SURFACE_ID);

    expect(surface?.path).toBe(SHELL_PATH);
    expect(surface?.routeReachable).not.toBe(false);
    expect(surface?.requiredControls.map((control) => control.kind).sort()).toEqual(MEASURED_KINDS);
  });

  it("claims no coverage: every control is declared uncovered, citing the C-416 measurement", () => {
    const catalog = readCatalog();
    const surface = catalog.controls.find((entry) => entry.id === SURFACE_ID);
    const controls = surface?.requiredControls ?? [];

    expect(controls).toHaveLength(MEASURED_KINDS.length);
    for (const control of controls) {
      expect(control.behavioralTest?.status).toBe("none");
      expect(control.behavioralTest?.path).toBeUndefined();
      expect(control.behavioralTest?.reason).toMatch(/C-416/);
    }
    expect(
      catalog.catalogClaimCoverage.filter(
        (row) => row.surfaceId === SURFACE_ID && row.status === "covered",
      ),
    ).toEqual([]);
  });

  it("the live audit passes and names all five controls as uncovered on a screen", () => {
    expect(live.code).toBe(0);
    const named = rosterLines(live.output).filter((line) => line.includes(`- ${SURFACE_ID}:`));

    expect(named).toEqual(
      MEASURED_KINDS.map((kind) => `  - ${SURFACE_ID}:${kind} — ${SHELL_PATH}`),
    );
  });

  it("is counted: without the entry the audit reports exactly five fewer declared, reachable and uncovered", () => {
    // The counterfactual is the catalog before this entry: the surface gone,
    // and every claim row that now joins it back to "uncatalogued". If the
    // entry were decoration the two reports would agree.
    const catalog = readCatalog();
    catalog.controls = catalog.controls.filter((entry) => entry.id !== SURFACE_ID);
    catalog.catalogClaimCoverage = catalog.catalogClaimCoverage.map((row) => {
      if (row.surfaceId !== SURFACE_ID) return row;
      const rest: CoverageRow = { ...row };
      delete rest.surfaceId;
      return { ...rest, surfaceJoin: { state: "uncatalogued" } };
    });
    const dir = mkdtempSync(path.join(tmpdir(), "c574-tower-dock-"));
    const fixture = path.join(dir, "catalog.json");
    writeFileSync(fixture, JSON.stringify(catalog, null, 2));

    const without = runAudit(fixture);

    expect(without.code).toBe(0);
    const before = headline(without.output);
    const after = headline(live.output);
    expect(after.declared - before.declared).toBe(MEASURED_KINDS.length);
    expect(after.reachable - before.reachable).toBe(MEASURED_KINDS.length);
    expect(after.uncovered - before.uncovered).toBe(MEASURED_KINDS.length);
  }, 120_000);
});

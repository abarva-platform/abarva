import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { renderUncoveredRoster } from "../../../scripts/audit/ai-surface-control-catalog.mjs";

/**
 * The AI surface control catalog gate reported how many controls lack a
 * behavioral test, and never which ones (item C-411).
 *
 * The item that filed this said the catalog "records no behavioral-test
 * linkage at all". That part is false and has been since 2026-09-18:
 * `requiredControls[].behavioralTest` carries a path and the case names that
 * prove it, an uncovered control declares `status: "none"` with a reason and
 * the suites that reference its module, and both are checked hard — a control
 * added with no `behavioralTest` key fails the gate outright.
 *
 * What survived the wrong diagnosis is the sentence the item opens with. The
 * passing report is four lines of counts:
 *
 *     AI surface control catalog passed (23 surfaces, 44 declared controls, ...)
 *     Behavioral coverage of reachable controls: 35 of 35 (100%).
 *     Reachable share of declared controls: 35 of 44 (79.5%).
 *     Not on any screen: 9 of 44 controls ...
 *
 * Every figure there is a count. "Which control has no behavioral test" — the
 * question the restocking backlog item is defined to answer — cannot be read
 * off any of them, so restocking still meant a search of the test tree, which
 * is a search and not a read, and two agents doing it get two answers.
 *
 * So the report names them. These cases pin the naming, and they pin it
 * against the failure mode that a roster is most likely to have: being blind.
 * A catalog whose uncovered controls are all on one unmounted surface cannot
 * tell a working roster from an empty list, so one case blinds a control that
 * is genuinely linked today and requires the roster to name it.
 *
 * The expected set is walked from the catalog inside each case rather than
 * written down here. Writing a behavioral test for one of today's uncovered
 * controls must make this suite pass with a shorter roster, not turn it red —
 * a control whose expectation is a fixed count is a ratchet against the work
 * it exists to encourage.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CATALOG_REL = "docs/security/ai-surface-control-catalog.json";
const SCRIPT = path.join(repoRoot, "scripts/audit/ai-surface-control-catalog.mjs");

type BehavioralTest = {
  status?: string;
  path?: string;
  reason?: string;
  knownSuites?: string[];
  provenCases?: string[];
};

type Catalog = {
  controls: Array<{
    id: string;
    path: string;
    requiredControls: Array<{ kind: string; behavioralTest?: BehavioralTest }>;
  }>;
  catalogClaimCoverage?: Array<{ surfaceId?: string; controlKind?: string; status?: string }>;
};

function readCatalog(): Catalog {
  return JSON.parse(readFileSync(path.join(repoRoot, CATALOG_REL), "utf8")) as Catalog;
}

/** Uncovered, as the catalog itself declares it — never a list kept here. */
function declaredUncovered(catalog: Catalog): string[] {
  return catalog.controls
    .flatMap((surface) =>
      surface.requiredControls
        .filter((control) => control.behavioralTest?.status === "none")
        .map((control) => `${surface.id}:${control.kind}`),
    )
    .sort();
}

function declaredControlCount(catalog: Catalog): number {
  return catalog.controls.reduce((total, surface) => total + surface.requiredControls.length, 0);
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

function writeFixture(mutate: (catalog: Catalog) => void): string {
  const catalog = readCatalog();
  mutate(catalog);
  const dir = mkdtempSync(path.join(tmpdir(), "unlinked-control-roster-"));
  const file = path.join(dir, "catalog.json");
  writeFileSync(file, JSON.stringify(catalog, null, 2));
  return file;
}

/** The roster the report printed, read back as `surfaceId:kind`. */
function rosterFrom(output: string): string[] {
  return output
    .split("\n")
    .map((line) => /^ {2}- ([a-z0-9-]+):([a-z0-9-]+) —/.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => `${match[1]}:${match[2]}`)
    .sort();
}

function rosterHeadline(output: string): { named: number; declared: number } {
  const match = /Controls with no behavioral test: (\d+) of (\d+)\./.exec(output);
  if (!match) throw new Error("the report printed no roster headline");
  return { named: Number(match[1]), declared: Number(match[2]) };
}

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "coverage"]);

function isTestFile(rel: string): boolean {
  return /(^|\/)__tests__\//.test(rel) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(rel);
}

/** Independent walk: every test file under src/ that names this module token. */
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

/**
 * Blind one control that is genuinely linked today, leaving a fixture the gate
 * still accepts: a concrete reason, the suites walked from the tree, and no
 * `covered` claim left standing over a control that no longer proves anything.
 */
function blind(catalog: Catalog, surfaceId: string, kind: string): void {
  const surface = catalog.controls.find((entry) => entry.id === surfaceId);
  if (!surface) throw new Error(`fixture names no surface ${surfaceId}`);
  const control = surface.requiredControls.find((entry) => entry.kind === kind);
  if (!control) throw new Error(`fixture names no control ${surfaceId}:${kind}`);
  if (control.behavioralTest?.status === "none") {
    throw new Error(`${surfaceId}:${kind} is already uncovered — it proves nothing about blinding`);
  }
  control.behavioralTest = {
    status: "none",
    reason:
      "Blinded by a behavioral test fixture. No behavioral test is declared here, so nothing " +
      "proves this control reaches a screen; the suites below reference the module without " +
      "proving this kind.",
    knownSuites: suitesReferencing(moduleToken(surface.path)),
  };
  catalog.catalogClaimCoverage = (catalog.catalogClaimCoverage ?? []).filter(
    (entry) => !(entry.surfaceId === surfaceId && entry.controlKind === kind),
  );
}

/** A linked control on a mounted surface, chosen from the catalog rather than pinned here. */
function aGenuinelyLinkedControl(catalog: Catalog): { surfaceId: string; kind: string } {
  for (const surface of catalog.controls) {
    for (const control of surface.requiredControls) {
      if (control.behavioralTest?.path) return { surfaceId: surface.id, kind: control.kind };
    }
  }
  throw new Error("the catalog declares no linked control at all");
}

describe("the control catalog names the controls with no behavioral test", () => {
  it("names every control the catalog declares uncovered, not just how many there are", () => {
    const catalog = readCatalog();
    const run = runAudit();

    expect(run.code).toBe(0);
    expect(rosterFrom(run.output)).toEqual(declaredUncovered(catalog));
  });

  it("counts the roster it printed against every declared control", () => {
    const catalog = readCatalog();
    const run = runAudit();
    const headline = rosterHeadline(run.output);

    expect(headline.named).toBe(declaredUncovered(catalog).length);
    expect(headline.declared).toBe(declaredControlCount(catalog));
    expect(rosterFrom(run.output)).toHaveLength(headline.named);
  });

  it("names the module each uncovered control sits on, so the roster can be acted on", () => {
    const catalog = readCatalog();
    const uncovered = declaredUncovered(catalog);
    if (uncovered.length === 0) return;

    const run = runAudit();
    for (const entry of uncovered) {
      const [surfaceId] = entry.split(":");
      const surface = catalog.controls.find((candidate) => candidate.id === surfaceId);
      const line = run.output
        .split("\n")
        .find((candidate) => candidate.startsWith(`  - ${entry} —`));
      expect(line).toBeDefined();
      expect(line).toContain(surface?.path);
    }
  });

  it("names a control that is linked today the moment it is blinded", () => {
    // The real known positive. Every uncovered control in the catalog today
    // sits on one unmounted surface, so a roster that only ever printed those
    // rows — or printed nothing at all — would pass the cases above on a clean
    // corpus. Blinding a control that genuinely has a test is the only version
    // of this question a blind roster cannot answer.
    const catalog = readCatalog();
    const target = aGenuinelyLinkedControl(catalog);
    const before = declaredUncovered(catalog);
    const fixture = writeFixture((draft) => blind(draft, target.surfaceId, target.kind));

    const run = runAudit(fixture);

    expect(run.code).toBe(0);
    const roster = rosterFrom(run.output);
    expect(roster).toContain(`${target.surfaceId}:${target.kind}`);
    expect(roster).toEqual([...before, `${target.surfaceId}:${target.kind}`].sort());
    expect(rosterHeadline(run.output).named).toBe(before.length + 1);
  });

  it("says so in words when nothing is uncovered, rather than dropping the section", () => {
    // The empty roster is the branch the live catalog cannot reach — it has
    // five uncovered controls today, and a fixture with none fails the gate
    // for an unrelated reason, because removing the surface that holds them
    // orphans a generated-ui claim that must resolve to a controls[] entry.
    // So the renderer is asked directly. A section that vanishes at zero is
    // indistinguishable from a section somebody deleted, and this programme
    // exists because an absent signal was read as a clean one.
    const lines = renderUncoveredRoster([], 44);

    expect(lines.join("\n")).toMatch(/Controls with no behavioral test: 0 of 44\./);
    expect(lines.filter((line) => line.trimStart().startsWith("- "))).toEqual([]);
  });

  it("does not run the audit when the renderer is imported", () => {
    // The renderer is only reachable from a test because the module stopped
    // auditing on import. An unguarded CLI would run the whole catalog gate —
    // route graph, tree walk and all — inside every suite that imports it, and
    // would print its verdict into that suite's output where nobody reads it.
    const output = execFileSync(
      process.execPath,
      ["-e", `import(${JSON.stringify(SCRIPT)}).then(() => {});`],
      { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );

    expect(output).toBe("");
  });

  it("names one line per uncovered control, sorted, whatever order they were collected in", () => {
    // Three entries, and the collected order is one whose REVERSE is not the
    // sorted order either. A two-entry fixture in descending order cannot tell
    // a sort from a reverse, and a case that both a fix and its mutation pass
    // is not pinning anything.
    const lines = renderUncoveredRoster(
      [
        { surfaceId: "charlie-surface", kind: "citation", path: "src/c.tsx", reachable: true },
        { surfaceId: "alpha-surface", kind: "ai-label", path: "src/a.tsx", reachable: false },
        { surfaceId: "bravo-surface", kind: "confidence", path: "src/b.tsx", reachable: true },
      ],
      44,
    );

    expect(lines[0]).toMatch(/Controls with no behavioral test: 3 of 44\./);
    expect(lines.slice(1)).toEqual([
      "  - alpha-surface:ai-label — src/a.tsx — not on any screen",
      "  - bravo-surface:confidence — src/b.tsx",
      "  - charlie-surface:citation — src/c.tsx",
    ]);
  });
});

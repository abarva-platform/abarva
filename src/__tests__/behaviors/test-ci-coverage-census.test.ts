import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  symlinkSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * A census of which Jest suites under `src/` CI actually runs is only worth the
 * number it prints, and the number is only worth the resolution behind it.
 *
 * Six times a directory of tests was found to run in no CI job — each time by
 * accident, each time wired one directory at a time. The census exists so the
 * whole gap is a measurement instead of a series of accidents. What these cases
 * protect is the measurement's honesty, in both directions:
 *
 *   - it must follow every hop a real workflow uses to reach a test path. A
 *     first-hop-only reading calls `src/__tests__/behaviors` uncovered, because
 *     the only thing naming it is an argument array inside a Node script; and
 *   - it must not credit a path a reachable file merely *mentions*. Scanning a
 *     script's whole text credits every integration suite in the repository,
 *     because the sibling checker that guards that tree names its root in a
 *     constant. That error under-states the gap, which is the dangerous
 *     direction.
 *
 * Each case builds a scratch repository containing exactly one route from a
 * workflow to a test file, and drives the real script as a subprocess. The
 * script resolves its repository root from its own file location, so a fixture
 * cannot be handed to it any other way; the copy is made at test time, so a
 * mutation of the real script is a mutation of what runs here.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const SIBLING_SCRIPT = "scripts/quality/check-integration-ci-visibility.mjs";

type Census = {
  counts: {
    testFiles: number;
    coveredTestFiles: number;
    pullRequestCoveredTestFiles: number;
    uncoveredTestFiles: number;
    directoriesWithTests: number;
    directoriesFullyCovered: number;
    directoriesPartiallyCovered: number;
    directoriesUncovered: number;
    directoriesWithUnrunTestFiles: number;
    indeterminateInvocations: number;
    criticalGovernedRiskDirectories: number;
    highGovernedRiskDirectories: number;
    unclassifiedRiskDirectories: number;
  };
  indeterminateInvocations: { source: string; invocation: string }[];
  unresolvedIgnoreArguments: { script: string; source: string; reason: string }[];
  partiallyCoveredDirectories: { directory: string; testFiles: number; coveredTestFiles: number }[];
  governedRiskEvidence: {
    directory: string;
    testFiles: number;
    governedRisk: {
      rank: number;
      score: number;
      band: "critical" | "high";
      signals: string[];
      controlIds?: string[];
      approvalOrLifecycleSourceCount?: number;
      approvalOrLifecycleSources?: string[];
      tenantScopedReadSourceCount?: number;
      tenantScopedReadSources?: string[];
    };
  }[];
  governedRiskRanking: {
    directory: string;
    testFiles: number;
    unrunTestFiles: number;
    governedRisk: {
      rank: number;
      score: number;
      band: "critical" | "high" | "unclassified";
      signals: string[];
    };
  }[];
  uncoveredDirectories: { directory: string; testFiles: number }[];
};

function write(root: string, relative: string, contents: string): void {
  const target = path.join(root, relative);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

/**
 * The Jest suites directly inside one directory, repo-relative. Not recursive:
 * the census keys a directory row on each test file's immediate parent, so a
 * recursive count would compare a subtree against a single row.
 */
function collectTestFilesIn(absolute: string, relative: string): string[] {
  return readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name))
    .map((entry) => `${relative}/${entry.name}`)
    .sort();
}

/** A fixture repository carrying the real census script and its real import. */
function makeFixture(files: Record<string, string>, scripts: Record<string, string> = {}): string {
  // realpath, because the script gates its own entry point on argv[1] matching
  // its module path and the macOS temp directory is reached through a symlink.
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "test-ci-census-")));
  mkdirSync(path.join(dir, "scripts", "quality"), { recursive: true });
  for (const script of [CENSUS_SCRIPT, SIBLING_SCRIPT]) {
    copyFileSync(path.join(repoRoot, script), path.join(dir, script));
  }
  write(dir, "package.json", `${JSON.stringify({ name: "fixture", scripts }, null, 2)}\n`);
  // The census resolves imports with TypeScript's scanner rather than with
  // regular expressions, so the script now has a real dependency. The fixture
  // copied two files because the script used to need nothing but Node; it
  // gets the repository's node_modules by symlink so the copy can actually
  // run. Without it every case in this file fails at module resolution,
  // which is a fixture gap and not a finding about the census.
  symlinkSync(path.join(repoRoot, "node_modules"), path.join(dir, "node_modules"), "dir");
  for (const [relative, contents] of Object.entries(files)) write(dir, relative, contents);
  return dir;
}

/**
 * The `--check` gate, run as the shell runs it. Returns the exit status,
 * which is the whole point: the counts report has always printed its finding
 * and exited 0, and a gate that did the same would be decoration.
 */
function runCensusCheck(cwd: string): { status: number; output: string } {
  try {
    const stdout = execFileSync(
      process.execPath,
      [path.join(cwd, CENSUS_SCRIPT), "--check"],
      { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { status: 0, output: stdout };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return { status: err.status ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function runCensus(cwd: string): { status: number; stdout: string; census: Census } {
  let status = 0;
  let stdout = "";
  try {
    stdout = execFileSync(process.execPath, [path.join(cwd, CENSUS_SCRIPT), "--json"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    status = err.status ?? 1;
    stdout = `${err.stdout ?? ""}${err.stderr ?? ""}`;
  }
  const start = stdout.indexOf("{");
  return {
    status,
    stdout,
    census: start >= 0 ? (JSON.parse(stdout.slice(start)) as Census) : ({} as Census),
  };
}

function runSummary(cwd: string): string {
  return execFileSync(process.execPath, [path.join(cwd, CENSUS_SCRIPT)], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const PR_WORKFLOW = (run: string) =>
  ["name: gate", "on:", "  pull_request:", "jobs:", "  verify:", "    steps:", `      - run: ${run}`].join(
    "\n",
  );

const TEST_FILE = "it('x', () => { expect(1).toBe(1); });\n";

const fixtures: string[] = [];
function fixture(files: Record<string, string>, scripts?: Record<string, string>): string {
  const dir = makeFixture(files, scripts);
  fixtures.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

describe("test CI coverage census", () => {
  it("counts a suite a workflow names directly", () => {
    const dir = fixture({
      "src/lib/alpha/__tests__/alpha.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("npx jest src/lib/alpha"),
    });
    const { census } = runCensus(dir);
    expect(census.counts).toMatchObject({
      testFiles: 1,
      coveredTestFiles: 1,
      pullRequestCoveredTestFiles: 1,
      uncoveredTestFiles: 0,
      directoriesUncovered: 0,
    });
  });

  it("follows a workflow through an npm script", () => {
    const dir = fixture(
      {
        "src/lib/beta/__tests__/beta.test.ts": TEST_FILE,
        ".github/workflows/gate.yml": PR_WORKFLOW("npm run test:beta"),
      },
      { "test:beta": "jest src/lib/beta" },
    );
    expect(runCensus(dir).census.counts.coveredTestFiles).toBe(1);
  });

  it("follows a workflow into a script file that spawns jest", () => {
    // The hop a first-hop-only reading misses. This is how `src/__tests__/behaviors`
    // is reached in the real repository.
    const dir = fixture({
      "src/lib/gamma/__tests__/gamma.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("node scripts/ci/run-gamma.mjs"),
      "scripts/ci/run-gamma.mjs": [
        'import { spawnSync } from "node:child_process";',
        'const result = spawnSync("npx", ["jest", "src/lib/gamma", "--runInBand"], { stdio: "inherit" });',
        "process.exit(result.status ?? 1);",
      ].join("\n"),
    });
    expect(runCensus(dir).census.counts.coveredTestFiles).toBe(1);
  });

  it("preserves regex escapes in a workflow-reachable script's Jest ignore patterns", () => {
    const dir = fixture({
      "src/lib/script-ignore/__tests__/kept.test.ts": TEST_FILE,
      "src/lib/script-ignore/__tests__/excluded.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("bash scripts/ci/run-script-ignore.sh"),
      "scripts/ci/run-script-ignore.sh": String.raw`npx jest src/lib/script-ignore --testPathIgnorePatterns 'script-ignore/__tests__/excluded\.test\.ts$'`,
    });
    const { census } = runCensus(dir);
    expect(census.counts).toMatchObject({
      testFiles: 2,
      coveredTestFiles: 1,
      uncoveredTestFiles: 1,
    });
    expect(census.unresolvedIgnoreArguments).toEqual([]);
  });

  it("reports a script invocation whose structured ignore arguments cannot be parsed", () => {
    const dir = fixture({
      "src/lib/structured-ignore/__tests__/kept.test.ts": TEST_FILE,
      "src/lib/structured-ignore/__tests__/excluded.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW(
        "node scripts/ci/run-structured-ignore.mjs",
      ),
      "scripts/ci/run-structured-ignore.mjs": String.raw`spawnSync("npx", ["jest", "src/lib/structured-ignore", "--testPathIgnorePatterns", "structured-ignore/__tests__/excluded\\.test\\.ts$"]);`,
    });
    const { census } = runCensus(dir);
    expect(census.counts.coveredTestFiles).toBe(2);
    expect(census.unresolvedIgnoreArguments).toEqual([
      expect.objectContaining({
        script: "scripts/ci/run-structured-ignore.mjs",
        reason: "ignore patterns inside this script invocation could not be parsed",
      }),
    ]);
  });

  it("follows a ratchet baseline's declared paths", () => {
    const dir = fixture({
      "src/lib/delta/__tests__/delta.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW(
        "node scripts/ci/test-ratchet.mjs docs/ci/delta-test-baseline.json",
      ),
      "scripts/ci/test-ratchet.mjs": [
        'import { spawnSync } from "node:child_process";',
        "const { paths } = JSON.parse(process.argv[2]);",
        'spawnSync("npx", ["jest", ...paths, "--json"], { stdio: "inherit" });',
      ].join("\n"),
      "docs/ci/delta-test-baseline.json": `${JSON.stringify({ name: "delta", paths: ["src/lib/delta"] })}\n`,
    });
    const { census } = runCensus(dir);
    expect(census.counts.coveredTestFiles).toBe(1);
    // The ratchet's own `...paths` spawn is resolved, not left unresolved.
    expect(census.counts.indeterminateInvocations).toBe(0);
  });

  it("does not credit a path a reachable script only mentions", () => {
    // The whole-file-text reading credits all three of these. None of them runs
    // anything: a constant, a comment, and a release-record snippet a verifier
    // asserts on. Crediting them under-states the gap.
    const dir = fixture({
      "src/lib/epsilon/__tests__/epsilon.test.ts": TEST_FILE,
      "src/lib/zeta/__tests__/zeta.test.ts": TEST_FILE,
      "src/lib/eta/__tests__/eta.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("node scripts/audit/mentions-only.mjs"),
      "scripts/audit/mentions-only.mjs": [
        'const ROOT = "src/lib/epsilon";',
        "// jest reads a bare pattern as a regex, so src/lib/zeta would match loosely",
        'const snippet = "Pass: npx jest src/lib/eta/__tests__/eta.test.ts --runInBand";',
        "console.log(ROOT, snippet.length);",
      ].join("\n"),
    });
    const { census } = runCensus(dir);
    expect(census.counts.coveredTestFiles).toBe(0);
    expect(census.counts.uncoveredTestFiles).toBe(3);
    expect(census.uncoveredDirectories.map((row) => row.directory).sort()).toEqual([
      "src/lib/epsilon/__tests__",
      "src/lib/eta/__tests__",
      "src/lib/zeta/__tests__",
    ]);
  });

  it("separates a suite only a non-gating workflow runs", () => {
    // A scheduled workflow runs the suite, so it is covered — but a red test
    // there blocks no merge, which is the number a scope policy needs.
    const dir = fixture({
      "src/lib/theta/__tests__/theta.test.ts": TEST_FILE,
      ".github/workflows/nightly.yml": [
        "name: nightly",
        "on:",
        "  schedule:",
        '    - cron: "0 3 * * *"',
        "jobs:",
        "  verify:",
        "    steps:",
        "      - run: npx jest src/lib/theta",
      ].join("\n"),
    });
    const { census } = runCensus(dir);
    expect(census.counts.coveredTestFiles).toBe(1);
    expect(census.counts.pullRequestCoveredTestFiles).toBe(0);
  });

  it("reports an unresolvable jest invocation instead of guessing either way", () => {
    const dir = fixture({
      "src/lib/iota/__tests__/iota.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("node scripts/ci/dynamic.mjs"),
      "scripts/ci/dynamic.mjs": [
        'import { spawnSync } from "node:child_process";',
        "const chosen = process.env.SUITES.split(\",\");",
        'spawnSync("npx", ["jest", ...chosen], { stdio: "inherit" });',
      ].join("\n"),
    });
    const { census } = runCensus(dir);
    expect(census.counts.indeterminateInvocations).toBe(1);
    expect(census.indeterminateInvocations[0].source).toBe("scripts/ci/dynamic.mjs");
    // Unresolved means unresolved: the suite is not silently credited.
    expect(census.counts.coveredTestFiles).toBe(0);
    expect(runSummary(dir)).toContain("upper bound");
  });

  it("always exits 0 — it is a measurement, not a gate", () => {
    const dir = fixture({
      "src/lib/kappa/__tests__/kappa.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("echo nothing"),
    });
    const result = runCensus(dir);
    expect(result.status).toBe(0);
    expect(result.census.counts.uncoveredTestFiles).toBe(1);
  });

  it("ranks governed surfaces ahead of larger inert directories", () => {
    const dir = fixture({
      "src/components/agent/__tests__/Control.test.tsx":
        'import "@/components/agent/Control";\nit("control", () => expect(true).toBe(true));\n',
      "src/components/agent/Control.tsx": "export function Control() { return null; }\n",
      "src/app/api/source/action/__tests__/route.test.ts":
        'import "../route";\nit("approval", () => expect(true).toBe(true));\n',
      "src/app/api/source/action/route.ts":
        "export async function POST() { return approve({ value: true }); }\n",
      "src/lib/data/__tests__/reader.test.ts":
        'import "../reader";\nit("tenant", () => expect(true).toBe(true));\n',
      "src/lib/data/reader.ts":
        "export function read() { return requireTenancy({}); }\n",
      "src/lib/helpers/__tests__/one.test.ts":
        'import "../format";\nit("one", () => expect(true).toBe(true));\n',
      "src/lib/helpers/__tests__/two.test.ts":
        'import "../format";\nit("two", () => expect(true).toBe(true));\n',
      "src/lib/helpers/__tests__/three.test.ts":
        'import "../format";\nit("three", () => expect(true).toBe(true));\n',
      "src/lib/helpers/format.ts": "export const format = (value: string) => value.trim();\n",
      "docs/security/ai-surface-control-catalog.json": `${JSON.stringify({
        controls: [
          {
            id: "fixture-control",
            path: "src/components/agent/Control.tsx",
            requiredControls: [],
          },
        ],
      })}\n`,
      ".github/workflows/gate.yml": PR_WORKFLOW("echo nothing"),
    });

    const { census } = runCensus(dir);
    expect(census.governedRiskRanking.map((row) => row.directory)).toEqual([
      "src/components/agent/__tests__",
      "src/app/api/source/action/__tests__",
      "src/lib/data/__tests__",
    ]);
    expect(census.governedRiskRanking.map((row) => row.governedRisk.signals)).toEqual([
      ["declared_ai_surface_control"],
      ["approval_or_lifecycle_write"],
      ["tenant_scoped_read"],
    ]);
    expect(census.governedRiskRanking.map((row) => row.governedRisk.rank)).toEqual([
      1, 2, 3,
    ]);
    expect(census.counts).toMatchObject({
      criticalGovernedRiskDirectories: 2,
      highGovernedRiskDirectories: 1,
      unclassifiedRiskDirectories: 1,
    });
    expect(census.governedRiskEvidence[0]).toMatchObject({
      directory: "src/components/agent/__tests__",
      governedRisk: { controlIds: ["fixture-control"] },
    });
    const summary = runSummary(dir);
    // Heading changed with the ranking it labels: partially covered
    // directories now appear, so "uncovered" would misdescribe the list.
    expect(summary).toContain("top governed-risk directories by unrun tests:");
    expect(summary.indexOf("src/components/agent/__tests__")).toBeLessThan(
      summary.indexOf("src/app/api/source/action/__tests__"),
    );
    expect(summary.indexOf("src/app/api/source/action/__tests__")).toBeLessThan(
      summary.indexOf("src/lib/data/__tests__"),
    );
    expect(summary).not.toContain("src/lib/helpers/__tests__");
  });

  /**
   * A directory with one covered file out of eighty is not less urgent than an
   * empty one with two — it is 79 unrun files, and the ranking could not see
   * it. `governedRiskRows` filtered on `coveredTestFiles === 0`, so every
   * partially covered directory was excluded from the queue that decides what
   * gets wired next. Measured on `49cca7400` when this case was written: 22
   * partial directories holding 257 unrun test files, and not one of them
   * appeared anywhere in the 151-entry ranking. The largest had to be found by
   * hand.
   *
   * Ranking on unrun files puts partial and uncovered directories on one
   * scale. The case that keeps that honest is the third directory below: fully
   * covered, same governed signal, larger than the uncovered one, and it must
   * stay out. "Include partials" and "include everything" differ only there.
   */
  it("ranks a partially covered directory on its unrun files, and still drops a fully covered one", () => {
    const approvalRoute =
      "export async function POST() { return approve({ value: true }); }\n";
    // A `from` specifier, because the scorer reads edges from `from` /
    // `require` / dynamic-import specifiers and an inferred sibling module —
    // a bare side-effect import is not one of them.
    const suite =
      'import { POST } from "../route";\nit("case", () => expect(typeof POST).toBe("function"));\n';
    const dir = fixture({
      // 3 unrun of 4.
      "src/lib/partial/route.ts": approvalRoute,
      "src/lib/partial/__tests__/a.test.ts": suite,
      "src/lib/partial/__tests__/b.test.ts": suite,
      "src/lib/partial/__tests__/c.test.ts": suite,
      "src/lib/partial/__tests__/d.test.ts": suite,
      // 2 unrun of 4 — the same size as `partial`, so ranking by directory
      // size would sort these two alphabetically and put this one first. Only
      // the unrun count separates them, which is what makes the tie-breaker
      // load-bearing rather than decorative.
      "src/lib/big/route.ts": approvalRoute,
      "src/lib/big/__tests__/b1.test.ts": suite,
      "src/lib/big/__tests__/b2.test.ts": suite,
      "src/lib/big/__tests__/b3.test.ts": suite,
      "src/lib/big/__tests__/b4.test.ts": suite,
      // 1 unrun of 1 — uncovered, same signal, so the scores tie throughout.
      "src/lib/small/route.ts": approvalRoute,
      "src/lib/small/__tests__/only.test.ts": suite,
      // 0 unrun of 2 — same signal, larger than `small`. Must not rank.
      "src/lib/full/route.ts": approvalRoute,
      "src/lib/full/__tests__/one.test.ts": suite,
      "src/lib/full/__tests__/two.test.ts": suite,
      ".github/workflows/gate.yml": [
        "name: gate",
        "on:",
        "  pull_request:",
        "jobs:",
        "  verify:",
        "    steps:",
        "      - run: npx jest src/lib/partial/__tests__/a.test.ts",
        "      - run: npx jest src/lib/big/__tests__/b1.test.ts",
        "      - run: npx jest src/lib/big/__tests__/b2.test.ts",
        "      - run: npx jest src/lib/full/__tests__",
      ].join("\n"),
    });

    const { census } = runCensus(dir);

    expect(census.counts).toMatchObject({
      directoriesFullyCovered: 1,
      directoriesPartiallyCovered: 2,
      directoriesUncovered: 1,
      directoriesWithUnrunTestFiles: 3,
      // 3 directories hold unrun files and all 3 are ranked. Computed against
      // the uncovered count instead, this reads -2, which is what a revert of
      // the denominator produces.
      unclassifiedRiskDirectories: 0,
    });
    expect(census.governedRiskRanking.map((row) => row.directory)).toEqual([
      "src/lib/partial/__tests__",
      "src/lib/big/__tests__",
      "src/lib/small/__tests__",
    ]);
    expect(census.governedRiskRanking.map((row) => row.unrunTestFiles)).toEqual([
      3, 2, 1,
    ]);
    // Ranking on directory size would order these big(4), partial(4), small(1)
    // — a different sequence from the one asserted above. The two orderings
    // disagree on purpose, so a revert to `testFiles` cannot pass this case.
    expect(census.governedRiskRanking.map((row) => row.testFiles)).toEqual([
      4, 4, 1,
    ]);
    expect(census.governedRiskRanking.map((row) => row.governedRisk.rank)).toEqual(
      [1, 2, 3],
    );
    // Every score is equal, so the order above is the tie-breaker's doing and
    // nothing else. If this ever stops tying, the case stops proving it.
    expect(
      new Set(census.governedRiskRanking.map((row) => row.governedRisk.score)),
    ).toEqual(new Set([100]));

    const summary = runSummary(dir);
    // The negative control. A fully covered directory with the same governed
    // signal, larger than the uncovered one, has nothing left to wire — and
    // "rank the partials too" differs from "rank everything" only here.
    expect(summary).not.toContain("src/lib/full/__tests__");
    expect(summary).toContain("3 unrun of 4 tests");
    expect(summary.indexOf("src/lib/partial/__tests__")).toBeLessThan(
      summary.indexOf("src/lib/big/__tests__"),
    );
    expect(summary.indexOf("src/lib/big/__tests__")).toBeLessThan(
      summary.indexOf("src/lib/small/__tests__"),
    );
  });
  it("does not score a governed signal from a type-only import", () => {
    // A `import type` specifier is erased at compile time: the test never loads
    // the module and never exercises the control declared on it. The scorer's
    // own method note says signals come from "product modules statically
    // imported by the tests", which a type import satisfies literally and not
    // in substance. `board` reaches the control module only by type; `dock`
    // reaches it by value and must keep its band.
    const dir = fixture({
      "src/components/agent/Control.tsx":
        "export type Turn = { id: string };\nexport function Control() { return null; }\n",
      "src/components/board/Board.tsx": "export function Board() { return null; }\n",
      "src/components/board/__tests__/Board.test.tsx": [
        'import { Board } from "../Board";',
        'import type { Turn } from "@/components/agent/Control";',
        'it("board", () => expect(typeof Board).toBe("function"));',
      ].join("\n"),
      "src/components/dock/Dock.tsx": "export function Dock() { return null; }\n",
      "src/components/dock/__tests__/Dock.test.tsx": [
        'import { Dock } from "../Dock";',
        'import { Control } from "@/components/agent/Control";',
        'it("dock", () => expect(typeof Control).toBe("function"));',
      ].join("\n"),
      "docs/security/ai-surface-control-catalog.json": `${JSON.stringify({
        controls: [
          {
            id: "fixture-control",
            path: "src/components/agent/Control.tsx",
            requiredControls: [],
          },
        ],
      })}\n`,
      ".github/workflows/gate.yml": PR_WORKFLOW("echo nothing"),
    });

    const { census } = runCensus(dir);
    const byDirectory = new Map(
      census.governedRiskRanking.map((row) => [row.directory, row.governedRisk]),
    );
    expect(byDirectory.get("src/components/dock/__tests__")?.signals).toEqual([
      "declared_ai_surface_control",
    ]);
    expect(byDirectory.get("src/components/board/__tests__")?.signals ?? []).not.toContain(
      "declared_ai_surface_control",
    );
    expect(byDirectory.get("src/components/board/__tests__")?.band ?? "unclassified").toBe(
      "unclassified",
    );
    const boardEvidence = census.governedRiskEvidence.find(
      (row) => row.directory === "src/components/board/__tests__",
    );
    expect(boardEvidence?.governedRisk.controlIds ?? []).toEqual([]);
  });

  it("reads the other two erasable import forms the same way", () => {
    // `export type { … } from` and a brace list whose every specifier is
    // `type`-prefixed are both elided by TypeScript exactly as `import type` is.
    // A brace list with one value specifier among the types is not.
    const dir = fixture({
      "src/components/agent/Control.tsx":
        "export type Turn = { id: string };\nexport function Control() { return null; }\n",
      "src/lib/reexport/Reexport.ts": "export const reexport = 1;\n",
      "src/lib/reexport/__tests__/Reexport.test.ts": [
        'import { reexport } from "../Reexport";',
        'export type { Turn } from "@/components/agent/Control";',
        'it("reexport", () => expect(reexport).toBe(1));',
      ].join("\n"),
      "src/lib/inline/Inline.ts": "export const inline = 1;\n",
      "src/lib/inline/__tests__/Inline.test.ts": [
        'import { inline } from "../Inline";',
        'import { type Turn } from "@/components/agent/Control";',
        'it("inline", () => expect(inline).toBe(1));',
      ].join("\n"),
      "src/lib/mixed/Mixed.ts": "export const mixed = 1;\n",
      "src/lib/mixed/__tests__/Mixed.test.ts": [
        'import { mixed } from "../Mixed";',
        'import { type Turn, Control } from "@/components/agent/Control";',
        'it("mixed", () => expect(typeof Control).toBe("function"));',
      ].join("\n"),
      "docs/security/ai-surface-control-catalog.json": `${JSON.stringify({
        controls: [
          {
            id: "fixture-control",
            path: "src/components/agent/Control.tsx",
            requiredControls: [],
          },
        ],
      })}\n`,
      ".github/workflows/gate.yml": PR_WORKFLOW("echo nothing"),
    });

    const { census } = runCensus(dir);
    const signalsFor = (directory: string) =>
      census.governedRiskRanking.find((row) => row.directory === directory)?.governedRisk
        .signals ?? [];
    expect(signalsFor("src/lib/reexport/__tests__")).not.toContain(
      "declared_ai_surface_control",
    );
    expect(signalsFor("src/lib/inline/__tests__")).not.toContain(
      "declared_ai_surface_control",
    );
    expect(signalsFor("src/lib/mixed/__tests__")).toContain("declared_ai_surface_control");
  });

  it("reads a bare side-effect import as a product edge, and still refuses a mention", () => {
    // `import "../route";` loads the module and runs it. It is a product edge in
    // exactly the way `import { POST } from "../route";` is — but it carries no
    // `from`, so the specifier pattern never saw it and the directory scored
    // zero. The two arms here hold the same module through both forms, so the
    // only thing that can differ between them is the shape of the import.
    //
    // `mention` is the control that keeps this narrow. The census already
    // refuses to credit a path a reachable script merely names; reading the
    // side-effect form must not re-introduce that error on the import side, so
    // a file that holds the same specifier in a string and in a comment — and
    // never imports it — must stay unclassified.
    const governed =
      "export async function POST() { return approve({ value: true }); }\n";
    const catalogFor = (...paths: string[]) =>
      `${JSON.stringify({
        controls: paths.map((controlPath, index) => ({
          id: `fixture-control-${index + 1}`,
          path: controlPath,
          requiredControls: [],
        })),
      })}\n`;

    const dir = fixture({
      // Side-effect form. The test file is named so that the inferred sibling
      // (`.../side-effect.*`) does not exist: without the import there is no
      // edge at all, which is the condition the gap hid behind.
      "src/app/api/gamma/route.ts": governed,
      "src/app/api/gamma/__tests__/side-effect.test.ts": [
        'import "../route";',
        'it("side effect", () => expect(true).toBe(true));',
      ].join("\n"),
      // Named form over an identical module, same naming discipline.
      "src/app/api/delta/route.ts": governed,
      "src/app/api/delta/__tests__/named.test.ts": [
        'import { POST } from "../route";',
        'it("named", () => expect(typeof POST).toBe("function"));',
      ].join("\n"),
      // The control: the specifier appears twice and is imported zero times.
      "src/app/api/epsilon/route.ts": governed,
      "src/app/api/epsilon/__tests__/mention.test.ts": [
        'const target = "../route";',
        '// import "../route" would be an edge; this line only talks about one',
        'it("mention", () => expect(target).toBe("../route"));',
      ].join("\n"),
      "docs/security/ai-surface-control-catalog.json": catalogFor(
        "src/app/api/gamma/route.ts",
        "src/app/api/delta/route.ts",
        "src/app/api/epsilon/route.ts",
      ),
      ".github/workflows/gate.yml": PR_WORKFLOW("echo nothing"),
    });

    const { census } = runCensus(dir);
    const riskFor = (directory: string) =>
      census.governedRiskRanking.find((row) => row.directory === directory)?.governedRisk;

    expect(riskFor("src/app/api/delta/__tests__")?.signals).toEqual([
      "declared_ai_surface_control",
      "approval_or_lifecycle_write",
    ]);
    expect(riskFor("src/app/api/gamma/__tests__")?.signals).toEqual(
      riskFor("src/app/api/delta/__tests__")?.signals,
    );
    expect(riskFor("src/app/api/gamma/__tests__")?.score).toBe(
      riskFor("src/app/api/delta/__tests__")?.score,
    );
    expect(riskFor("src/app/api/gamma/__tests__")?.band).toBe("critical");

    const gammaEvidence = census.governedRiskEvidence.find(
      (row) => row.directory === "src/app/api/gamma/__tests__",
    );
    expect(gammaEvidence?.governedRisk.controlIds).toEqual(["fixture-control-1"]);

    expect(riskFor("src/app/api/epsilon/__tests__")?.band ?? "unclassified").toBe(
      "unclassified",
    );
    expect(riskFor("src/app/api/epsilon/__tests__")?.signals ?? []).toEqual([]);
  });

  it("does not promote comments and literals into governed source signals", () => {
    const dir = fixture({
      "src/lib/false-positive/query-reader.ts": [
        'export interface Row { tenantKey: string }',
        'const note = "transition (one-time) and tenant_key";',
        '// approve({ value: true }); clientKey',
        'export function load() { return Promise.reject(new Error(note)); }',
      ].join("\n"),
      "src/lib/false-positive/__tests__/query-reader.test.ts": [
        'import { load } from "../query-reader";',
        'it("loads", () => expect(typeof load).toBe("function"));',
      ].join("\n"),
      ".github/workflows/gate.yml": PR_WORKFLOW("echo nothing"),
    });

    const { census } = runCensus(dir);
    const risk = census.governedRiskEvidence.find(
      (row) => row.directory === "src/lib/false-positive/__tests__",
    )?.governedRisk;
    expect(risk?.signals ?? []).not.toContain("approval_or_lifecycle_write");
    expect(risk?.signals ?? []).not.toContain("tenant_scoped_read");
  });

  it("keeps executable governance calls and tenant keys as governed signals", () => {
    const dir = fixture({
      "src/lib/governed/query-reader.ts": [
        "declare function approve(value: unknown): void;",
        "export function load(tenantKey: string) {",
        "  approve({ tenantKey });",
        "  return tenantKey;",
        "}",
      ].join("\n"),
      "src/lib/governed/__tests__/query-reader.test.ts": [
        'import { load } from "../query-reader";',
        'it("loads", () => expect(load("tenant-a")).toBe("tenant-a"));',
      ].join("\n"),
      ".github/workflows/gate.yml": PR_WORKFLOW("echo nothing"),
    });

    const { census } = runCensus(dir);
    const risk = census.governedRiskEvidence.find(
      (row) => row.directory === "src/lib/governed/__tests__",
    )?.governedRisk;
    expect(risk?.signals).toEqual([
      "approval_or_lifecycle_write",
      "tenant_scoped_read",
    ]);
  });

  it("subtracts a command's own --testPathIgnorePatterns from what it selects", () => {
    // The census answers "does a workflow reach a command that names this
    // file". A command that names a directory and then excludes a file inside
    // it by name does not run that file, and counting it over-states coverage —
    // the dangerous direction, because a quarantined suite then reads as run.
    const dir = fixture({
      "src/lib/theta/__tests__/kept.test.ts": TEST_FILE,
      "src/lib/theta/__tests__/excluded.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW(
        "npx jest src/lib/theta --testPathIgnorePatterns theta/__tests__/excluded\\.test\\.ts$",
      ),
    });
    const { census } = runCensus(dir);
    expect(census.counts).toMatchObject({
      testFiles: 2,
      coveredTestFiles: 1,
      pullRequestCoveredTestFiles: 1,
      uncoveredTestFiles: 1,
    });
    expect(
      census.partiallyCoveredDirectories.find(
        (row) => row.directory === "src/lib/theta/__tests__",
      ),
    ).toMatchObject({ testFiles: 2, coveredTestFiles: 1 });
  });

  it.each([
    ["double", '"'],
    ["single", "'"],
  ])(
    "subtracts an ignore pattern the workflow wrote in %s quotes",
    (_label, quote) => {
      // The shell strips these quotes before jest sees the argument, so jest
      // excludes the file either way. The census reads the raw command text,
      // so without stripping them itself its matcher receives a pattern with
      // quote characters attached and matches nothing — and it then reports
      // the file as covered by a command that is explicitly skipping it.
      //
      // That is the over-stating direction: a quarantined suite reads as run.
      // Quoting is the natural way to write an argument in YAML, so this is a
      // trap laid for whoever writes the next quarantine, not a hypothetical.
      const pattern = `${quote}lambda/__tests__/excluded\\.test\\.ts$${quote}`;
      const dir = fixture({
        "src/lib/lambda/__tests__/kept.test.ts": TEST_FILE,
        "src/lib/lambda/__tests__/excluded.test.ts": TEST_FILE,
        ".github/workflows/gate.yml": PR_WORKFLOW(
          `npx jest src/lib/lambda --testPathIgnorePatterns ${pattern}`,
        ),
      });
      const { census } = runCensus(dir);
      expect(census.counts).toMatchObject({
        testFiles: 2,
        coveredTestFiles: 1,
        uncoveredTestFiles: 1,
      });
    },
  );

  it("leaves a quote inside a pattern alone", () => {
    // Only a matched pair wrapping the whole token is shell quoting. A quote
    // character in the middle is part of the regex, and stripping it would
    // break a pattern that works today — the repair turning into its own
    // defect, pointing the other way.
    const dir = fixture({
      "src/lib/mu/__tests__/kept.test.ts": TEST_FILE,
      'src/lib/mu/__tests__/od"d.test.ts': TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW(
        'npx jest src/lib/mu --testPathIgnorePatterns mu/__tests__/od"d\\.test\\.ts$',
      ),
    });
    const { census } = runCensus(dir);
    expect(census.counts).toMatchObject({
      testFiles: 2,
      coveredTestFiles: 1,
      uncoveredTestFiles: 1,
    });
  });

  it("resolves the ignore patterns a command takes from a $(node …) substitution", () => {
    // The real shape. Every quarantine in this repository is held in JSON and
    // turned into flags by a small script the workflow calls inside `$( )`, so
    // the patterns are never in the command text. Re-deriving them from the
    // JSON here would be a second copy of that derivation, which is how two
    // readings of one contract drift apart; the script is run instead, which is
    // the same hop the shell takes.
    const dir = fixture({
      "src/lib/iota/__tests__/kept.test.ts": TEST_FILE,
      "src/lib/iota/__tests__/quarantined.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW(
        "npx jest src/lib/iota --ci $(node scripts/quality/iota-ignore-args.mjs)",
      ),
      "scripts/quality/iota-ignore-args.mjs": [
        'import { readFileSync } from "node:fs";',
        'import path from "node:path";',
        'import { fileURLToPath } from "node:url";',
        'const here = path.dirname(fileURLToPath(import.meta.url));',
        'const { quarantined } = JSON.parse(',
        '  readFileSync(path.join(here, "iota-quarantine.json"), "utf8"),',
        ');',
        'process.stdout.write(',
        '  ["--testPathIgnorePatterns", ...quarantined.map((s) => `iota/__tests__/${s}$`)].join(" "),',
        ');',
      ].join("\n"),
      "scripts/quality/iota-quarantine.json": `${JSON.stringify({
        quarantined: ["quarantined\\.test\\.ts"],
      })}\n`,
    });
    const { census } = runCensus(dir);
    expect(census.counts).toMatchObject({
      testFiles: 2,
      coveredTestFiles: 1,
      uncoveredTestFiles: 1,
    });
    expect(census.unresolvedIgnoreArguments).toEqual([]);
  });

  it("scopes an ignore pattern to the command that passes it", () => {
    // The guardrail an over-broad fix breaks. A file excluded by one workflow
    // and run in full by another is covered, and a reading that subtracted
    // ignore patterns globally would report it unrun — under-stating coverage
    // and sending someone to wire a directory that is already wired.
    const dir = fixture({
      "src/lib/kappa/__tests__/shared.test.ts": TEST_FILE,
      ".github/workflows/narrow.yml": PR_WORKFLOW(
        "npx jest src/lib/kappa --testPathIgnorePatterns kappa/__tests__/shared\\.test\\.ts$",
      ),
      ".github/workflows/wide.yml": PR_WORKFLOW("npx jest src/lib/kappa"),
    });
    const { census } = runCensus(dir);
    expect(census.counts).toMatchObject({ testFiles: 1, coveredTestFiles: 1 });
  });

  it("reports an ignore substitution it cannot resolve instead of silently crediting the suite", () => {
    // Same rule as `indeterminateInvocations`: when a hop cannot be followed the
    // census says so rather than picking an answer. The coverage number keeps
    // the pre-existing reading — covered — so the failure cannot quietly delete
    // a suite from the run set; the entry is what makes that over-statement
    // visible.
    const dir = fixture({
      "src/lib/mu/__tests__/mu.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW(
        "npx jest src/lib/mu $(node scripts/quality/absent-ignore-args.mjs)",
      ),
    });
    const { census } = runCensus(dir);
    expect(census.counts.coveredTestFiles).toBe(1);
    expect(census.unresolvedIgnoreArguments).toEqual([
      expect.objectContaining({ script: "scripts/quality/absent-ignore-args.mjs" }),
    ]);
  });

  it("subtracts every quarantined suite this repository excludes by name", () => {
    // The repository case the fixtures abstract. Each quarantine script is the
    // authority on its own list, so both sides of the comparison are derived
    // from the repository rather than from counts written here that would rot
    // the first time an entry is cleared.
    const { census } = runCensus(repoRoot);
    const rows = new Map(
      [...census.partiallyCoveredDirectories, ...census.uncoveredDirectories].map((row) => [
        row.directory,
        row,
      ]),
    );

    for (const area of ["source", "qa", "intelligence", "admin"]) {
      const directory = `src/__tests__/integration/${area}`;
      const patterns = execFileSync(
        process.execPath,
        [path.join(repoRoot, `scripts/quality/${area}-integration-ignore-args.mjs`)],
        { cwd: repoRoot, encoding: "utf8" },
      )
        .trim()
        .split(/\s+/)
        .slice(1)
        .map((pattern) => new RegExp(pattern));
      expect(patterns.length).toBeGreaterThan(0);

      const files = collectTestFilesIn(path.join(repoRoot, directory), directory);
      const excluded = files.filter((file) => patterns.some((pattern) => pattern.test(file)));
      expect(excluded.length).toBeGreaterThan(0);

      // A directory whose every suite runs is absent from both published lists;
      // one holding an excluded suite must appear, with exactly the excluded
      // files missing from its covered count.
      const row = rows.get(directory);
      expect(row).toBeDefined();
      expect(row).toMatchObject({
        testFiles: files.length,
        coveredTestFiles: files.length - excluded.length,
      });
    }
  });

  it("refreshes the committed census only when its content changes", () => {
    const dir = fixture({
      "src/lib/lambda/__tests__/lambda.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("npx jest src/lib/lambda"),
    });
    const target = path.join(dir, "docs/architecture/test-ci-coverage-census.json");
    mkdirSync(path.dirname(target), { recursive: true });

    const first = execFileSync(process.execPath, [path.join(dir, CENSUS_SCRIPT), "--write"], {
      cwd: dir,
      encoding: "utf8",
    });
    expect(first).toContain("updated");
    const written = readFileSync(target, "utf8");

    const second = execFileSync(process.execPath, [path.join(dir, CENSUS_SCRIPT), "--write"], {
      cwd: dir,
      encoding: "utf8",
    });
    expect(second).toContain("already current");
    expect(readFileSync(target, "utf8")).toBe(written);
    // No timestamp, so a re-run on an unchanged tree cannot dirty the tree.
    expect(written).not.toMatch(/generatedAt|measuredAt/);
  });

  it("is internally consistent against this repository", () => {
    const { status, census } = runCensus(repoRoot);
    expect(status).toBe(0);
    expect(census.counts.coveredTestFiles + census.counts.uncoveredTestFiles).toBe(
      census.counts.testFiles,
    );
    expect(census.counts.pullRequestCoveredTestFiles).toBeLessThanOrEqual(
      census.counts.coveredTestFiles,
    );
    expect(
      census.counts.directoriesFullyCovered +
        census.counts.directoriesPartiallyCovered +
        census.counts.directoriesUncovered,
    ).toBe(census.counts.directoriesWithTests);
    expect(census.uncoveredDirectories).toHaveLength(census.counts.directoriesUncovered);

    // The one standing anchor: the behaviour suite directory is gated by the
    // behaviour coverage floor, so a reading that calls it uncovered is wrong
    // about the repository rather than about the policy.
    const uncovered = new Set(census.uncoveredDirectories.map((row) => row.directory));
    expect(uncovered.has("src/__tests__/behaviors")).toBe(false);
  });

  it("keeps the committed census readable and shaped like a fresh run", () => {
    const committed = JSON.parse(
      readFileSync(path.join(repoRoot, "docs/architecture/test-ci-coverage-census.json"), "utf8"),
    ) as Census;
    const { census } = runCensus(repoRoot);
    expect(Object.keys(committed.counts).sort()).toEqual(Object.keys(census.counts).sort());
    expect(Array.isArray(committed.uncoveredDirectories)).toBe(true);
    expect(committed.counts.testFiles).toBeGreaterThan(0);
  });

  it("--check fails when a directory changes coverage state", () => {
    // The gate's subject: the committed file omits a directory the
    // measurement finds uncovered. That is the state in which the census
    // mis-ranks the queue of what to wire next, which is what it is read for.
    const dir = fixture({
      "src/lib/nu/__tests__/kept.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("npx jest src/lib/xi"),
      "docs/architecture/test-ci-coverage-census.json": JSON.stringify(
        { counts: {}, partiallyCoveredDirectories: [], uncoveredDirectories: [] },
        null,
        2,
      ),
    });
    const { status, output } = runCensusCheck(dir);
    expect(status).toBe(1);
    expect(output).toContain("src/lib/nu/__tests__");
  });

  it("--check passes when only the counts moved, which is every PR that adds a test", () => {
    // The negative control, and the reason this gate is on the shape rather
    // than on the counts. Adding a test to an already-covered directory moves
    // `testFiles` and `coveredTestFiles` and moves the directory sets by
    // nothing. A gate on the counts would fire here -- on an ordinary pull
    // request that did nothing wrong -- and teach people to regenerate a large
    // generated file to get green.
    const dir = fixture({
      "src/lib/omicron/__tests__/kept.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("npx jest src/lib/omicron"),
      "docs/architecture/test-ci-coverage-census.json": JSON.stringify(
        {
          counts: { testFiles: 999, coveredTestFiles: 999 },
          partiallyCoveredDirectories: [],
          uncoveredDirectories: [],
        },
        null,
        2,
      ),
    });
    const { status, output } = runCensusCheck(dir);
    expect(status).toBe(0);
    expect(output).toContain("coverage shape matches");
  });

  it("the committed census still describes this repository's coverage shape", () => {
    // The enforcement, run here rather than as a workflow step invoking the
    // script. A step would put `scripts/quality/test-ci-coverage-census.mjs`
    // into the set of commands a workflow reaches, and the census would then
    // scan its own source for Jest invocations and find one it cannot resolve
    // to literal paths -- `["jest", ...paths, …]`, quoted in its own
    // documentation of the ratchet hop. That single unresolved invocation
    // makes the census's covered count an upper bound, and three sibling
    // guards correctly refuse to read a guess. Measured, not guessed at: the
    // step took `indeterminateInvocations` from 0 to 1.
    //
    // So the gate lives where it does not perturb what it measures. `--check`
    // remains for anyone running it by hand.
    const { status, output } = runCensusCheck(repoRoot);
    expect(output).toContain("coverage shape");
    expect(status).toBe(0);
  });
});

/**
 * `--explain` names the files behind the counts.
 *
 * The summary says a directory holds "10 unrun of 45" and stops there, so
 * every consumer that needed the actual ten re-derived them by grepping the
 * workflow file. That reads one of the four hops and disagrees with the census
 * it is meant to be reading — a mistake already made against this very script,
 * where a two-hop probe produced a false accusation of a defect.
 *
 * These cases hold two things:
 *
 *   1. the explained set is exactly the unrun set, proved against a fixture
 *      whose coverage is decided by the fixture rather than read back from the
 *      census; and
 *   2. the query does not perturb what it measures — no field reaches the
 *      committed artifact, and `--explain` never writes.
 */
function runExplain(cwd: string): string {
  return execFileSync(process.execPath, [path.join(cwd, CENSUS_SCRIPT), "--explain"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

describe("test CI coverage census --explain", () => {
  it("names the unrun file and not the covered one beside it", () => {
    // Ground truth is the ignore pattern, not anything the census reports:
    // `kept` is run, `excluded` is not, and they sit in the same directory so
    // a directory-level answer cannot pass this.
    const dir = fixture({
      "src/lib/explain/__tests__/kept.test.ts": TEST_FILE,
      "src/lib/explain/__tests__/excluded.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("bash scripts/ci/run-explain.sh"),
      "scripts/ci/run-explain.sh": String.raw`npx jest src/lib/explain --testPathIgnorePatterns 'explain/__tests__/excluded\.test\.ts$'`,
    });

    const output = runExplain(dir);

    expect(output).toContain("src/lib/explain/__tests__/excluded.test.ts");
    // The negative half. Listing every file would satisfy the line above.
    expect(output).not.toContain("src/lib/explain/__tests__/kept.test.ts");
    expect(output).toContain("1 test files no workflow runs");
  });

  it("reports nothing to explain when every suite is reached", () => {
    // Guards against an implementation that always prints something.
    const dir = fixture({
      "src/lib/allcovered/__tests__/a.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("npx jest src/lib/allcovered"),
    });
    expect(runExplain(dir)).toContain("0 test files no workflow runs, across 0 directories");
  });

  it("agrees with the counts the census already publishes", () => {
    // `one` deliberately holds a covered file AND an unrun one. With a single
    // file per directory, "every file" and "the unrun files" are the same set
    // everywhere this can look, and the path assertion below cannot fail.
    const dir = fixture({
      "src/lib/one/__tests__/a.test.ts": TEST_FILE,
      "src/lib/one/__tests__/b.test.ts": TEST_FILE,
      "src/lib/two/__tests__/c.test.ts": TEST_FILE,
      "src/lib/three/__tests__/d.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW(
        "npx jest src/lib/one/__tests__/a.test.ts",
      ),
    });
    const { census } = runCensus(dir);
    const output = runExplain(dir);

    // The detail and the published totals are two renderings of one
    // computation; if they can disagree, one of them is lying.
    expect(output).toContain(
      `${census.counts.uncoveredTestFiles} test files no workflow runs, ` +
        `across ${census.counts.directoriesWithUnrunTestFiles} directories`,
    );

    // The header alone is not enough: it once read a count derived separately
    // from the paths, so listing every file in the repository still printed
    // the right number. Count the paths actually listed.
    const listed = output
      .split("\n")
      .filter((line) => /^ {4}\S+\.test\.tsx?$/.test(line));
    expect(listed).toHaveLength(census.counts.uncoveredTestFiles);
  });

  it("adds no field to the published artifact and writes nothing", () => {
    const dir = fixture({
      "src/lib/artifact/__tests__/a.test.ts": TEST_FILE,
      "src/lib/artifact/__tests__/b.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW(
        "npx jest src/lib/artifact/__tests__/a.test.ts",
      ),
    });
    const censusPath = path.join(dir, "docs/architecture/test-ci-coverage-census.json");
    mkdirSync(path.dirname(censusPath), { recursive: true });

    execFileSync(process.execPath, [path.join(dir, CENSUS_SCRIPT), "--write"], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const before = readFileSync(censusPath, "utf8");

    runExplain(dir);

    // A query that rewrites the artifact it interrogates would send churn into
    // whatever pull request happened to be open, which is the defect
    // `writeIfChanged` already exists to prevent.
    expect(readFileSync(censusPath, "utf8")).toBe(before);
    expect(before).not.toContain("unrunTestPathsByDirectory");
    // The per-directory rows spread `...row`, so a field added to a row reaches
    // the artifact unless it is explicitly stripped back out.
    expect(before).not.toContain("unrunTestPaths");
  });
});

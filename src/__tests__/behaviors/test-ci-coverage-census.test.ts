import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
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
    directoriesWithUntriagedUnrunTestFiles: number;
    declaredQuarantineTestFiles: number;
    untriagedUnrunTestFiles: number;
    indeterminateInvocations: number;
    criticalGovernedRiskDirectories: number;
    highGovernedRiskDirectories: number;
    unclassifiedRiskDirectories: number;
    // The two halves of that word. `unclassified` means either "the census
    // resolved this directory's product modules and none of the three signals
    // matched" or "the census resolved nothing, so it is saying something about
    // its own reach". These separate them, and they sum to the line above.
    unclassifiedRiskDirectoriesWithResolvedProductSources: number;
    unclassifiedRiskDirectoriesWithNoResolvedProductSource: number;
  };
  indeterminateInvocations: { source: string; invocation: string }[];
  unresolvedIgnoreArguments: { script: string; source: string; reason: string }[];
  partiallyCoveredDirectories: {
    directory: string;
    testFiles: number;
    coveredTestFiles: number;
    declaredQuarantineTestFiles: number;
    untriagedUnrunTestFiles: number;
  }[];
  governedRiskEvidence: {
    directory: string;
    testFiles: number;
    governedRisk: {
      rank: number;
      score: number;
      band: "critical" | "high";
      signals: string[];
      productSourceCount: number;
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
    declaredQuarantineTestFiles: number;
    untriagedUnrunTestFiles: number;
    governedRisk: {
      rank: number;
      score: number;
      band: "critical" | "high" | "unclassified";
      signals: string[];
      productSourceCount: number;
    };
  }[];
  // Every directory holding an untriaged unrun file that the ranking does not
  // carry, because its score is zero. Published so the zero can be read: a
  // directory here with `productSourceCount: 0` is unmeasured, not safe.
  unclassifiedRiskDirectories: {
    directory: string;
    testFiles: number;
    unrunTestFiles: number;
    declaredQuarantineTestFiles: number;
    untriagedUnrunTestFiles: number;
    governedRisk: {
      score: 0;
      band: "unclassified";
      signals: [];
      productSourceCount: number;
    };
  }[];
  governedRiskFiles: {
    directory: string;
    testPath: string;
    // `enumerated`, not `loaded`: the census walked the tree and found the
    // file. It never imports it, and `loaded` invited the one inference these
    // rows must not support (T-551).
    enumerated: boolean;
    collected: boolean;
    // Not booleans. The census executes nothing, so it can never report a pass;
    // `green` is `"unknown"` for every file and `run` is `false` only where no
    // reachable command selects the file, which is the one execution fact the
    // census does know (T-551).
    run: false | "unknown";
    green: "unknown";
    covered: boolean;
    declaredQuarantine: boolean;
    declaredQuarantineShape:
      | "excluded-by-naming-command"
      | "declared-in-quarantine-list"
      | null;
    untriaged: boolean;
    governedRisk: {
      rank: number;
      score: number;
      band: "critical" | "high";
      signals: string[];
      productSourceCount: number;
    };
  }[];
  uncoveredDirectories: {
    directory: string;
    testFiles: number;
    declaredQuarantineTestFiles: number;
    untriagedUnrunTestFiles: number;
  }[];
  quarantineLists: {
    list: string;
    declaredSuites: number;
    resolvedTestFiles: string[];
    unresolvedDeclarations: string[];
  }[];
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

/**
 * Every repository file the given scripts reach through a relative import,
 * including the seeds themselves, as repo-relative paths.
 *
 * The fixture used to copy a hand-written list of two. That list was correct
 * only for as long as neither script grew a dependency, and when both of them
 * took the shared invocation guard from `scripts/exec/` the list said nothing
 * and every case here died at module resolution — a fixture gap wearing the
 * costume of a finding about the census. A list cannot notice that it is
 * stale; a closure has nothing to keep up to date.
 *
 * Relative specifiers only: a bare specifier is a package and arrives through
 * the `node_modules` symlink below. This resolves static imports, which is
 * sound for the modules it actually reaches (they import node builtins and
 * nothing else) but is NOT sound in general — a module that composes a path at
 * run time is invisible to it. If one is ever added, copy its directory rather
 * than widening this.
 */
function relativeImportClosure(seeds: readonly string[]): string[] {
  const seen = new Set<string>();
  const queue = [...seeds];
  while (queue.length > 0) {
    const relativePath = queue.shift() as string;
    if (seen.has(relativePath)) continue;
    seen.add(relativePath);
    const source = readFileSync(path.join(repoRoot, relativePath), "utf8");
    for (const match of source.matchAll(/\bfrom\s+["'](\.[^"']*)["']/g)) {
      const target = path.posix.normalize(
        path.posix.join(path.posix.dirname(relativePath), match[1]),
      );
      if (!existsSync(path.join(repoRoot, target))) {
        throw new Error(`${relativePath} imports ${match[1]}, which does not exist at ${target}`);
      }
      queue.push(target);
    }
  }
  return [...seen].sort();
}

/** A fixture repository carrying the real census script and its real import. */
function makeFixture(files: Record<string, string>, scripts: Record<string, string> = {}): string {
  // realpath, because the script gates its own entry point on argv[1] matching
  // its module path and the macOS temp directory is reached through a symlink.
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "test-ci-census-")));
  mkdirSync(path.join(dir, "scripts", "quality"), { recursive: true });
  for (const script of relativeImportClosure([CENSUS_SCRIPT, SIBLING_SCRIPT])) {
    mkdirSync(path.dirname(path.join(dir, script)), { recursive: true });
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
    // directories now appear, so "uncovered" would misdescribe the list. It
    // moved a second time under T-471, when the ranking's basis narrowed from
    // every unrun file to only the untriaged ones — a directory whose unrun
    // set is entirely declared quarantine is no longer ranked, so "by unrun
    // tests" would now overstate what the list is ordered on. The assertion is
    // updated rather than relaxed: it still pins an exact heading.
    expect(summary).toContain(
      "top governed-risk directories by untriaged unrun tests:",
    );
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
  /**
   * `unclassified` is two different facts wearing one word, and until this case
   * existed the census could not tell them apart.
   *
   * A directory scores zero either because the census resolved the product
   * modules its tests import and none of the three signals matched — genuinely
   * low risk, as far as this measurement reaches — or because it resolved no
   * product module at all, in which case the census knows nothing about the
   * directory and `unclassified` is a statement about the resolver rather than
   * about the code. 180 of the 190 directories holding an untriaged unrun file
   * land in that word, so which of the two it means decides whether a
   * triage queue built from this file is ordered or merely short (T-758).
   *
   * The two arms below are identical in every published field the census had
   * before this case: same band, same score, same empty signal list, both
   * absent from `governedRiskRanking` because that list is filtered on a
   * non-zero score. The ONLY thing that separates them is how many product
   * modules resolved, which is why that number has to be on the face of the
   * output rather than inferable from it.
   *
   * Both test files are named so the census's inferred sibling
   * (`.../<name>.ts` beside `.../__tests__/<name>.test.ts`) does not exist:
   * without that discipline the unresolved arm picks up an edge for free and
   * the case proves nothing.
   */
  it("separates an unclassified directory that resolved product sources from one that resolved none", () => {
    const dir = fixture({
      // Arm A — resolves one real product module. It matches no signal: no
      // catalog entry, no approval or lifecycle write, no tenant-scoped read.
      "src/lib/plain/format.ts": "export const format = (s: string) => s.trim();\n",
      "src/lib/plain/__tests__/formatting.test.ts": [
        'import { format } from "../format";',
        'it("formats", () => expect(format(" x ")).toBe("x"));',
      ].join("\n"),
      // Arm B — resolves nothing. The specifier is a bare package, which is a
      // dependency rather than a product module, so the census follows no edge
      // out of this directory at all.
      "src/lib/opaque/__tests__/opacity.test.ts": [
        'import path from "node:path";',
        'it("opaque", () => expect(typeof path.join).toBe("function"));',
      ].join("\n"),
      // Arm C — a directory that DOES score, present so the two lists can be
      // shown to partition the population rather than merely to be non-empty.
      // Without it, a filter that swept every directory into the unclassified
      // list would look identical to one that took the complement of the
      // ranking, because the ranking would be empty either way.
      "src/app/api/theta/route.ts":
        "export async function POST() { return approve({ value: true }); }\n",
      "src/app/api/theta/__tests__/approving.test.ts": [
        'import { POST } from "../route";',
        'it("approves", () => expect(typeof POST).toBe("function"));',
      ].join("\n"),
      ".github/workflows/gate.yml": PR_WORKFLOW("echo nothing"),
    });

    const { census } = runCensus(dir);

    // Three directories hold an untriaged unrun file; one scores and two do
    // not. The two lists are complements over that population, which is the
    // property the counts below are arithmetic on.
    expect(census.counts.directoriesWithUntriagedUnrunTestFiles).toBe(3);
    expect(census.counts.unclassifiedRiskDirectories).toBe(2);
    expect(census.governedRiskRanking.map((row) => row.directory)).toEqual([
      "src/app/api/theta/__tests__",
    ]);

    // The split, by number.
    expect(census.counts).toMatchObject({
      unclassifiedRiskDirectoriesWithResolvedProductSources: 1,
      unclassifiedRiskDirectoriesWithNoResolvedProductSource: 1,
    });
    // The two are exhaustive of the word, asserted rather than assumed: a third
    // bucket appearing later must not quietly leave part of the 180 unexplained.
    expect(
      census.counts.unclassifiedRiskDirectoriesWithResolvedProductSources +
        census.counts.unclassifiedRiskDirectoriesWithNoResolvedProductSource,
    ).toBe(census.counts.unclassifiedRiskDirectories);

    // The per-directory count, which is what makes a single row readable rather
    // than only the population.
    const unclassified = new Map(
      census.unclassifiedRiskDirectories.map((row) => [row.directory, row]),
    );
    expect([...unclassified.keys()].sort()).toEqual([
      "src/lib/opaque/__tests__",
      "src/lib/plain/__tests__",
    ]);
    // Stated as its own assertion rather than left implicit in the list above:
    // a ranked directory belongs to the ranking and to nothing else, or the two
    // published lists double-count the population they split.
    expect(unclassified.has("src/app/api/theta/__tests__")).toBe(false);
    expect(unclassified.get("src/lib/plain/__tests__")).toMatchObject({
      untriagedUnrunTestFiles: 1,
      governedRisk: { band: "unclassified", score: 0, signals: [], productSourceCount: 1 },
    });
    expect(unclassified.get("src/lib/opaque/__tests__")).toMatchObject({
      untriagedUnrunTestFiles: 1,
      governedRisk: { band: "unclassified", score: 0, signals: [], productSourceCount: 0 },
    });
    // The list and the count are two computations over the same population, so
    // they are checked against each other. A header that disagrees with its own
    // body is the shape this census has already been caught in once.
    expect(census.unclassifiedRiskDirectories.length).toBe(
      census.counts.unclassifiedRiskDirectories,
    );

    // The summary says it in words, because the JSON is not what a person reads
    // when they are deciding what to triage next.
    expect(runSummary(dir)).toContain(
      "unclassified: 2 (1 resolved no product source, so the band is the resolver's silence)",
    );
  });

  /**
   * The companion to the case above, and the reason `productSourceCount` is
   * published on every directory rather than only on the unclassified ones: a
   * RANKED directory carries it too, so the number that explains a zero score
   * is the same number, read the same way, on a row that scored.
   */
  it("publishes the resolved product source count on a ranked directory as well", () => {
    const dir = fixture({
      "src/app/api/zeta/route.ts":
        "export async function POST() { return approve({ value: true }); }\n",
      "src/app/api/zeta/__tests__/posting.test.ts": [
        'import { POST } from "../route";',
        'it("posts", () => expect(typeof POST).toBe("function"));',
      ].join("\n"),
      ".github/workflows/gate.yml": PR_WORKFLOW("echo nothing"),
    });

    const { census } = runCensus(dir);
    const ranked = census.governedRiskRanking.find(
      (row) => row.directory === "src/app/api/zeta/__tests__",
    );
    expect(ranked?.governedRisk.band).toBe("critical");
    expect(ranked?.governedRisk.productSourceCount).toBe(1);
    expect(
      census.governedRiskFiles.find(
        (row) => row.testPath === "src/app/api/zeta/__tests__/posting.test.ts",
      )?.governedRisk.productSourceCount,
    ).toBe(1);
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

  /**
   * Updated for T-551. As written by T-582 this case pinned `run: true` and
   * `green: true` on the covered file — the defect, recorded as the contract.
   * It now asserts what the census can honestly answer and what it must refuse;
   * the refusal itself is proved against a file that cannot pass in the
   * `refuses to call a covered file green` case below.
   */
  it("reports enumerated, collected and covered status per governed-risk file", () => {
    const route =
      "export async function POST() { return approve({ value: true }); }\n";
    const suite =
      'import { POST } from "../route";\nit("approval", () => expect(typeof POST).toBe("function"));\n';
    const dir = fixture({
      "src/app/api/source/action/route.ts": route,
      "src/app/api/source/action/__tests__/run.test.ts": suite,
      "src/app/api/source/action/__tests__/quarantined.test.ts": suite,
      "src/app/api/source/action/__tests__/dark.test.ts": suite,
      ".github/workflows/gate.yml": [
        "name: gate",
        "on:",
        "  pull_request:",
        "jobs:",
        "  verify:",
        "    steps:",
        "      - run: npx jest src/app/api/source/action/__tests__/run.test.ts",
        "      - run: npx jest src/app/api/source/action/__tests__/quarantined.test.ts --testPathIgnorePatterns action/__tests__/quarantined\\.test\\.ts$",
      ].join("\n"),
    });

    const { census } = runCensus(dir);
    const files = new Map(
      census.governedRiskFiles.map((row) => [row.testPath, row]),
    );

    expect(census.governedRiskRanking.map((row) => row.directory)).toEqual([
      "src/app/api/source/action/__tests__",
    ]);
    expect(files.get("src/app/api/source/action/__tests__/run.test.ts")).toMatchObject({
      enumerated: true,
      collected: true,
      run: "unknown",
      green: "unknown",
      covered: true,
      declaredQuarantine: false,
      untriaged: false,
    });
    expect(
      files.get("src/app/api/source/action/__tests__/quarantined.test.ts"),
    ).toMatchObject({
      enumerated: true,
      collected: true,
      run: false,
      green: "unknown",
      covered: false,
      declaredQuarantine: true,
      untriaged: false,
    });
    expect(files.get("src/app/api/source/action/__tests__/dark.test.ts")).toMatchObject({
      enumerated: true,
      collected: false,
      run: false,
      green: "unknown",
      covered: false,
      declaredQuarantine: false,
      untriaged: true,
    });
  });

  /**
   * T-551. The per-file fields that name an EXECUTION, measured against a file
   * that cannot pass under any runner.
   *
   * The census executes nothing. It reads workflows and answers a reachability
   * question over 2,363 files in about four seconds. Before this, `run` and
   * `green` were each assigned `result.covered` — three field names carrying one
   * fact — so `green: true` meant only "a workflow command reaches this file",
   * and 78 files were published green having never been executed. A run-status
   * field that cannot report a covered-but-failing file cannot report the one
   * thing such a field exists for.
   *
   * The failing suite below is PROVED failing by a real process rather than
   * asserted to be. It throws at module scope, so `node` refuses it outright and
   * no runner can reach a passing outcome from it. Establishing that with the
   * census — the thing under test — would reproduce the defect inside its own
   * test: a claim of execution nothing executed.
   */
  it("refuses to call a covered file green, because it executes nothing", () => {
    const route =
      "export async function POST() { return approve({ value: true }); }\n";
    // The module-scope statement that makes the suite unable to pass, proved
    // unable to pass by a real Node process. It is asserted in isolation rather
    // than as part of the whole fixture file, so the non-zero exit is caused by
    // THIS statement and not by an unresolved import inside a scratch directory.
    const throwsAtModuleScope =
      'throw new Error("T-551: this suite throws at module scope and cannot pass");';
    let nodeStatus = 0;
    try {
      execFileSync(
        process.execPath,
        ["--input-type=module", "-e", throwsAtModuleScope],
        { stdio: "ignore" },
      );
    } catch (error) {
      nodeStatus = (error as { status?: number }).status ?? 1;
    }
    expect(nodeStatus).not.toBe(0);

    // The same statement at module scope in the fixture's covered suite, above
    // the only `it` in the file: nothing can define a test, let alone pass one.
    const cannotPass = [
      'import { POST } from "../route";',
      throwsAtModuleScope,
      'it("never reached", () => expect(typeof POST).toBe("function"));',
    ].join("\n");
    // A sibling no command names. The governed-risk ranking only ranks a
    // directory that still holds an untriaged unrun file, so without this the
    // directory is absent from governedRiskFiles and every assertion below
    // passes against `undefined`.
    const dark =
      'import { POST } from "../route";\nit("dark", () => expect(typeof POST).toBe("function"));\n';

    const dir = fixture({
      "src/app/api/source/action/route.ts": route,
      "src/app/api/source/action/__tests__/red.test.ts": cannotPass,
      "src/app/api/source/action/__tests__/dark.test.ts": dark,
      ".github/workflows/gate.yml": PR_WORKFLOW(
        "npx jest src/app/api/source/action/__tests__/red.test.ts",
      ),
    });

    const { census } = runCensus(dir);
    const row = census.governedRiskFiles.find(
      (file) =>
        file.testPath === "src/app/api/source/action/__tests__/red.test.ts",
    );

    // What the census does measure: a workflow command reaches this file.
    expect(row).toMatchObject({
      enumerated: true,
      collected: true,
      covered: true,
    });
    // What it has no evidence for, and must therefore refuse.
    expect(row?.green).toBe("unknown");
    expect(row?.green).not.toBe(true);
    expect(row?.run).toBe("unknown");
    expect(row?.run).not.toBe(true);
  });

  /**
   * The same control stated over a whole tree rather than one row, because the
   * defect was a per-row assignment and a single-row assertion can be satisfied
   * by a special case. `green` carries no boolean for any file in any state:
   * the census holds an execution outcome for none of them.
   *
   * `run` keeps the one certainty the census genuinely has — a file no reachable
   * command selects cannot have executed in CI, so `false` there is a true
   * statement — and refuses the other direction, because selection is not
   * execution. That asymmetry is deliberate and it is the fail-closed direction:
   * neither field can ever claim a run or a pass.
   */
  it("publishes no boolean green, and no true run, on any file in any state", () => {
    const route =
      "export async function POST() { return approve({ value: true }); }\n";
    const suite =
      'import { POST } from "../route";\nit("approval", () => expect(typeof POST).toBe("function"));\n';
    const dir = fixture({
      "src/app/api/source/action/route.ts": route,
      "src/app/api/source/action/__tests__/run.test.ts": suite,
      "src/app/api/source/action/__tests__/quarantined.test.ts": suite,
      "src/app/api/source/action/__tests__/dark.test.ts": suite,
      ".github/workflows/gate.yml": [
        "name: gate",
        "on:",
        "  pull_request:",
        "jobs:",
        "  verify:",
        "    steps:",
        "      - run: npx jest src/app/api/source/action/__tests__/run.test.ts",
        "      - run: npx jest src/app/api/source/action/__tests__/quarantined.test.ts --testPathIgnorePatterns action/__tests__/quarantined\\.test\\.ts$",
      ].join("\n"),
    });

    const { census } = runCensus(dir);
    const rows = census.governedRiskFiles;

    // Guard the guard: an empty list would satisfy every assertion below.
    expect(rows).toHaveLength(3);
    expect(rows.filter((file) => file.covered === true)).toHaveLength(1);

    // Read each row as the untyped JSON it actually is. The declared type is
    // the contract this case exists to enforce, so comparing its `"unknown"`
    // against `true` is statically impossible and TypeScript says so — a fair
    // complaint about the declaration and the wrong one about the check. The
    // census is a `.mjs` script TypeScript never sees and these rows came from
    // `JSON.parse`, so the assertion has to test the artifact rather than my
    // description of it, or it proves only that I typed the field correctly.
    const raw = (file: Census["governedRiskFiles"][number]) =>
      file as unknown as Record<string, unknown>;

    expect(rows.filter((file) => raw(file).green === true)).toEqual([]);
    expect(rows.filter((file) => raw(file).green === false)).toEqual([]);
    expect([...new Set(rows.map((file) => raw(file).green))]).toEqual([
      "unknown",
    ]);
    expect(rows.filter((file) => raw(file).run === true)).toEqual([]);
    expect(
      rows.filter((file) => file.run === "unknown").map((file) => file.testPath),
    ).toEqual(["src/app/api/source/action/__tests__/run.test.ts"]);
  });

  /**
   * `loaded` was the third field naming something the census never does. Unlike
   * `run` and `green` it had a true measurement underneath — the census did walk
   * the tree and find the file — so it is renamed to what it measures rather
   * than re-typed. The old name is asserted GONE, not merely the new one
   * present: publishing both would leave every reader who greps for `loaded`
   * with the inference this item exists to remove.
   */
  it("names the tree walk `enumerated` and publishes no `loaded` field", () => {
    const route =
      "export async function POST() { return approve({ value: true }); }\n";
    const suite =
      'import { POST } from "../route";\nit("approval", () => expect(typeof POST).toBe("function"));\n';
    const dir = fixture({
      "src/app/api/source/action/route.ts": route,
      "src/app/api/source/action/__tests__/dark.test.ts": suite,
      ".github/workflows/gate.yml": PR_WORKFLOW("echo nothing"),
    });

    const { census } = runCensus(dir);
    expect(census.governedRiskFiles).toHaveLength(1);
    for (const row of census.governedRiskFiles) {
      expect(row).not.toHaveProperty("loaded");
      expect(row).toHaveProperty("enumerated", true);
    }
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
        scope: "src/lib/iota/__tests__",
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


  /**
   * T-615. `declaredQuarantine` recognised one shape — a command that NAMES a
   * file and then subtracts it through its own `--testPathIgnorePatterns` — and
   * that shape needs the naming for the subtraction to have something to
   * subtract. A directory whose default is EXCLUDED expresses its carve-out the
   * other way round: it enumerates the files it runs, so a file left out is
   * named by nothing at all and no ignore pattern mentions it.
   *
   * `src/__tests__/integration` is that directory, deliberately, and three files
   * declared in `scripts/quality/integration-root-quarantine.json` on 2026-09-23
   * with a reason, an owner and a verdict were reported `untriaged` two days
   * later. `untriagedUnrunTestFiles` is the sole input to `governedRiskRanking`,
   * so those three were the entire reason that directory sat at rank 1 of the
   * critical band, and two backlog items drew work from that rank.
   *
   * Measured on the real tree before this changed, with one root file unwired
   * from the workflow's enumeration AND declared in the list: the census at
   * `406b24498` reported 398 untriaged, 49 declared quarantines, and the root at
   * rank 1 `critical`; with this reading it reports 397, 50, and the root
   * unranked. The fixture below is that state, minimised.
   *
   * The fixture has to disagree with itself or it cannot fail. `runs.test.ts` is
   * enumerated and covered; `declared.test.ts` is enumerated by nothing and named
   * in the list; nothing anywhere passes an ignore pattern, so the first shape
   * has no way to be true and only the second reading can credit the file.
   */
  it("credits a quarantine a directory expresses by enumeration, not by an ignore pattern", () => {
    const dir = fixture({
      "src/app/api/rho/action/route.ts":
        "export async function POST() { return approve({ value: true }); }\n",
      "src/app/api/rho/action/__tests__/runs.test.ts":
        'import "../route";\nit("runs", () => expect(true).toBe(true));\n',
      "src/app/api/rho/action/__tests__/ignored.test.ts":
        'import "../route";\nit("ignored", () => expect(true).toBe(true));\n',
      "src/app/api/rho/action/__tests__/declared.test.ts":
        'import "../route";\nit("declared", () => expect(true).toBe(true));\n',
      "src/app/api/rho/action/__tests__/dark.test.ts":
        'import "../route";\nit("dark", () => expect(true).toBe(true));\n',
      // Enumeration, not a directory. `declared.test.ts` and `dark.test.ts` are
      // named by nothing, which is what makes the first shape unable to see
      // either of them; `ignored.test.ts` is named and then subtracted, so both
      // shapes are present in one directory and a reading that conflated them
      // would publish the wrong reason for one of the two.
      ".github/workflows/gate.yml": PR_WORKFLOW(
        [
          "npx jest",
          "src/app/api/rho/action/__tests__/runs.test.ts",
          "src/app/api/rho/action/__tests__/ignored.test.ts",
          "--testPathIgnorePatterns action/__tests__/ignored\\.test\\.ts$",
          "--ci",
        ].join(" "),
      ),
      "scripts/quality/rho-quarantine.json": `${JSON.stringify(
        {
          scope: "src/app/api/rho/action/__tests__",
          quarantined: [
            {
              suite: "declared.test.ts",
              owner: "T-615",
              reason: "Declared with a reason, and named by no command.",
              verdict: "update",
            },
          ],
        },
        null,
        2,
      )}\n`,
    });

    const { census } = runCensus(dir);

    // Three unrun files, two of them triaged by different evidence, one dark.
    // The total must not move: only the classification changed.
    expect(census.counts.uncoveredTestFiles).toBe(3);
    expect(census.counts.declaredQuarantineTestFiles).toBe(2);
    expect(census.counts.untriagedUnrunTestFiles).toBe(1);

    // Per file, naming WHICH shape credited it. A count cannot tell the two
    // apart: widening the first shape instead of adding the second would satisfy
    // the three numbers above and still report the wrong reason here.
    const shapes = Object.fromEntries(
      census.governedRiskFiles
        .filter((row) => row.directory === "src/app/api/rho/action/__tests__")
        .map((row) => [
          row.testPath.split("/").pop(),
          { declaredQuarantine: row.declaredQuarantine, shape: row.declaredQuarantineShape, untriaged: row.untriaged },
        ]),
    );
    expect(shapes).toEqual({
      "runs.test.ts": { declaredQuarantine: false, shape: null, untriaged: false },
      "ignored.test.ts": {
        declaredQuarantine: true,
        shape: "excluded-by-naming-command",
        untriaged: false,
      },
      "declared.test.ts": {
        declaredQuarantine: true,
        shape: "declared-in-quarantine-list",
        untriaged: false,
      },
      "dark.test.ts": { declaredQuarantine: false, shape: null, untriaged: true },
    });

    expect(
      census.quarantineLists.find(
        (row) => row.list === "scripts/quality/rho-quarantine.json",
      ),
    ).toEqual({
      list: "scripts/quality/rho-quarantine.json",
      declaredSuites: 1,
      resolvedTestFiles: ["src/app/api/rho/action/__tests__/declared.test.ts"],
      unresolvedDeclarations: [],
    });

    // The consequence the item is about: the directory is still ranked, because
    // one dark file remains — and it is ranked on ONE untriaged file rather than
    // on two, so the next drawer is not sent to work already done.
    const ranked = census.governedRiskRanking.find(
      (row) => row.directory === "src/app/api/rho/action/__tests__",
    );
    expect(ranked).toMatchObject({
      unrunTestFiles: 3,
      declaredQuarantineTestFiles: 2,
      untriagedUnrunTestFiles: 1,
    });
  });

  /**
   * The same tree with the declaration removed, which is the state before
   * anybody triaged the file. Without this the case above passes for a census
   * that called every unrun file a quarantine, and the ranking would stop
   * offering real work.
   */
  it("still reports an enumerated-out file as untriaged when no list declares it", () => {
    const dir = fixture({
      "src/app/api/rho/action/route.ts":
        "export async function POST() { return approve({ value: true }); }\n",
      "src/app/api/rho/action/__tests__/runs.test.ts":
        'import "../route";\nit("runs", () => expect(true).toBe(true));\n',
      "src/app/api/rho/action/__tests__/declared.test.ts":
        'import "../route";\nit("declared", () => expect(true).toBe(true));\n',
      ".github/workflows/gate.yml": PR_WORKFLOW(
        "npx jest src/app/api/rho/action/__tests__/runs.test.ts --ci",
      ),
      // The list exists and is EMPTY, which is the state the real root list is in
      // today. An empty carve-out is the strongest state of the control, not a
      // missing one, so it must still appear in the published inventory.
      "scripts/quality/rho-quarantine.json": `${JSON.stringify(
        { scope: "src/app/api/rho/action/__tests__", quarantined: [] },
        null,
        2,
      )}\n`,
    });

    const { census } = runCensus(dir);

    expect(census.counts.declaredQuarantineTestFiles).toBe(0);
    expect(census.counts.untriagedUnrunTestFiles).toBe(1);
    expect(census.governedRiskRanking.map((row) => row.directory)).toEqual([
      "src/app/api/rho/action/__tests__",
    ]);
    expect(census.quarantineLists).toEqual([
      {
        list: "scripts/quality/rho-quarantine.json",
        declaredSuites: 0,
        resolvedTestFiles: [],
        unresolvedDeclarations: [],
      },
    ]);
  });

  /**
   * Why scope is declared and never inferred, held as a case rather than as a
   * comment. Resolving an entry's basename against the walked tree looks like it
   * would save the field, and it is ambiguous on this repository TODAY:
   * `ai-program-failure-modes.test.ts` exists under both
   * `src/lib/intelligence/__tests__` and `src/__tests__/integration/intelligence`
   * while `intelligence-library-quarantine.json` declares that name, and 40
   * basenames in the tree are non-unique. Crediting the wrong file is the
   * over-stating direction: an untriaged suite would read as triaged and drop out
   * of the ranking.
   *
   * Two files, same basename, two directories, one declaration. A basename match
   * credits both and puts `untriagedUnrunTestFiles` at 0.
   */
  it("credits only the declared scope when two directories hold the same suite name", () => {
    const dir = fixture({
      "src/app/api/sigma/action/route.ts":
        "export async function POST() { return approve({ value: true }); }\n",
      "src/app/api/sigma/action/__tests__/same-name.test.ts":
        'import "../route";\nit("in scope", () => expect(true).toBe(true));\n',
      "src/app/api/tau/action/route.ts":
        "export async function POST() { return approve({ value: true }); }\n",
      "src/app/api/tau/action/__tests__/same-name.test.ts":
        'import "../route";\nit("out of scope", () => expect(true).toBe(true));\n',
      ".github/workflows/gate.yml": PR_WORKFLOW("npx jest src/app/api/absent --ci"),
      "scripts/quality/sigma-quarantine.json": `${JSON.stringify(
        {
          scope: "src/app/api/sigma/action/__tests__",
          quarantined: [
            { suite: "same-name.test.ts", owner: "T-615", reason: "Declared in sigma only." },
          ],
        },
        null,
        2,
      )}\n`,
    });

    const { census } = runCensus(dir);

    expect(census.counts.uncoveredTestFiles).toBe(2);
    expect(census.counts.declaredQuarantineTestFiles).toBe(1);
    expect(census.counts.untriagedUnrunTestFiles).toBe(1);
    expect(
      census.quarantineLists.find(
        (row) => row.list === "scripts/quality/sigma-quarantine.json",
      )?.resolvedTestFiles,
    ).toEqual(["src/app/api/sigma/action/__tests__/same-name.test.ts"]);
    // The out-of-scope namesake is still work somebody has to triage.
    expect(census.governedRiskRanking.map((row) => row.directory)).toEqual([
      "src/app/api/tau/action/__tests__",
    ]);
  });

  /**
   * The same fence, on the OTHER resolution branch. An entry whose scoped path
   * is not a file in the tree is read as the regex fragment the
   * `*-ignore-args.mjs` scripts turn it into — that is how this repository's
   * lists are consumed — and a fragment must not reach outside the directory its
   * list guards.
   *
   * This case exists because the first fence case could not prove it: its entry
   * resolved through the exact-path branch and returned before the fragment
   * branch ran, so inverting the fence left the suite green. Both branches now
   * have a namesake outside scope to credit if the fence is dropped.
   */
  it("keeps a declared regex fragment inside its own scope", () => {
    const dir = fixture({
      "src/app/api/psi/action/route.ts":
        "export async function POST() { return approve({ value: true }); }\n",
      "src/app/api/psi/action/__tests__/swept.test.ts":
        'import "../route";\nit("in scope", () => expect(true).toBe(true));\n',
      "src/app/api/omega/action/route.ts":
        "export async function POST() { return approve({ value: true }); }\n",
      "src/app/api/omega/action/__tests__/swept.test.ts":
        'import "../route";\nit("out of scope", () => expect(true).toBe(true));\n',
      ".github/workflows/gate.yml": PR_WORKFLOW("npx jest src/app/api/absent --ci"),
      "scripts/quality/psi-quarantine.json": `${JSON.stringify(
        {
          scope: "src/app/api/psi/action/__tests__",
          // A fragment, not a filename: no file is called `swept\\.test\\.ts`,
          // so this can only resolve through the regex branch.
          quarantined: ["swept\\.test\\.ts"],
        },
        null,
        2,
      )}\n`,
    });

    const { census } = runCensus(dir);

    expect(census.counts.uncoveredTestFiles).toBe(2);
    expect(census.counts.declaredQuarantineTestFiles).toBe(1);
    expect(census.counts.untriagedUnrunTestFiles).toBe(1);
    expect(
      census.quarantineLists.find(
        (row) => row.list === "scripts/quality/psi-quarantine.json",
      )?.resolvedTestFiles,
    ).toEqual(["src/app/api/psi/action/__tests__/swept.test.ts"]);
    expect(census.governedRiskRanking.map((row) => row.directory)).toEqual([
      "src/app/api/omega/action/__tests__",
    ]);
  });

  /**
   * Discovery is a glob, so a new list cannot be missed; a list the census
   * cannot RESOLVE is the remaining way to go silent, and it refuses to measure
   * instead. The item that found this named five quarantine lists and
   * `scripts/quality` holds seven, which is the argument: a list of lists rots,
   * and an unscoped list would otherwise be read as declaring nothing at all —
   * under-stating triage, with no row to read.
   */
  it("refuses to measure when a quarantine list declares suites with no scope", () => {
    const dir = fixture({
      "src/lib/upsilon/__tests__/only.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("npx jest src/lib/upsilon --ci"),
      "scripts/quality/upsilon-quarantine.json": `${JSON.stringify({
        quarantined: [{ suite: "only.test.ts", reason: "no scope declared" }],
      })}\n`,
    });

    const { status, stdout } = runCensus(dir);
    expect(status).not.toBe(0);
    expect(stdout).toContain("scripts/quality/upsilon-quarantine.json");
    expect(stdout).toContain('"scope"');
  });

  /**
   * A sibling array carries its own scope, because `alsoIgnored` entries are
   * swept in from a DIFFERENT directory than the one their list guards — the
   * integration root, reached by an un-slashed directory pattern — so sharing
   * the list's scope would file them under the wrong directory. Both such arrays
   * in the repository are empty today; this is the case that makes the next
   * entry declare where it belongs rather than being credited to the wrong row.
   */
  it("requires a sibling declaration array to carry its own scope", () => {
    const dir = fixture({
      "src/lib/phi/__tests__/only.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("npx jest src/lib/phi --ci"),
      "scripts/quality/phi-quarantine.json": `${JSON.stringify({
        scope: "src/lib/phi/__tests__",
        quarantined: [],
        alsoIgnored: [{ suite: "swept-in.test.ts", reason: "from another directory" }],
      })}\n`,
    });

    const { status, stdout } = runCensus(dir);
    expect(status).not.toBe(0);
    expect(stdout).toContain("scripts/quality/phi-quarantine.json");
    expect(stdout).toContain('"alsoIgnoredScope"');
  });

  /**
   * A declaration naming a file that is not in the tree credits nobody and is
   * published as such. It is a stale entry, and every one of these lists has a
   * checker that re-runs its entries and fails on a name that no longer resolves;
   * that finding belongs there. A census that threw on it would stop measuring
   * over somebody else's bookkeeping, and one that dropped it silently would let
   * a list shrink to nothing without a row changing.
   */
  it("records a declaration that names no file in the tree and credits it to nobody", () => {
    const dir = fixture({
      "src/lib/chi/__tests__/present.test.ts": TEST_FILE,
      ".github/workflows/gate.yml": PR_WORKFLOW("npx jest src/lib/chi --ci"),
      "scripts/quality/chi-quarantine.json": `${JSON.stringify({
        scope: "src/lib/chi/__tests__",
        quarantined: [{ suite: "deleted.test.ts", reason: "the file was removed" }],
      })}\n`,
    });

    const { census } = runCensus(dir);

    expect(census.counts.declaredQuarantineTestFiles).toBe(0);
    expect(census.quarantineLists).toEqual([
      {
        list: "scripts/quality/chi-quarantine.json",
        declaredSuites: 1,
        resolvedTestFiles: [],
        unresolvedDeclarations: [
          "quarantined:src/lib/chi/__tests__/deleted.test.ts",
        ],
      },
    ]);
  });

  /**
   * The repository's own lists, read through the census rather than described
   * here. Every `*-quarantine.json` in `scripts/quality` must reach the census's
   * inventory: the count is derived from the directory on both sides, so a list
   * added tomorrow is covered without editing this case, and a list the glob
   * stops finding fails it.
   */
  it("reads every quarantine list this repository holds", () => {
    const onDisk = readdirSync(path.join(repoRoot, "scripts", "quality"))
      .filter((name) => name.endsWith("-quarantine.json"))
      .map((name) => `scripts/quality/${name}`)
      .sort();
    expect(onDisk.length).toBeGreaterThan(0);

    const committed = JSON.parse(
      readFileSync(path.join(repoRoot, "docs/architecture/test-ci-coverage-census.json"), "utf8"),
    ) as Census;
    expect(committed.quarantineLists.map((row) => row.list)).toEqual(onDisk);
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

  /**
   * T-471. The draw that produced this case asked for "the next 20 stale
   * suites to triage", ranked by `governedRiskRanking`, and 11 of the 20 came
   * back already triaged: seven named in
   * `scripts/quality/source-integration-quarantine.json`, one in its
   * `alsoIgnored`, two named in the auth step's `--testPathIgnorePatterns`,
   * and one recorded as triaged-red in a workflow comment. The census counted
   * every one of them as simply "uncovered", which is true and useless: an
   * unrun file that a command names and then deliberately excludes has been
   * looked at, and an unrun file no command names at all has not. Ranks 2 and
   * 3 of the critical band were directories whose entire unrun set was
   * declared quarantine, so the ranking was pointing the next agent at work
   * that was already done.
   *
   * The fixture has to disagree with itself or it cannot fail: one unrun file
   * that a command names and excludes, one unrun file nothing names, in two
   * directories carrying the same governed signal. Classifying all unrun
   * files as quarantine fails the dark half; classifying none fails the
   * excluded half; dropping the ranking filter fails the first assertion.
   */
  it("separates an unrun file a command excludes by name from one nothing names", () => {
    const dir = fixture({
      "src/app/api/alpha/action/route.ts":
        "export async function POST() { return approve({ value: true }); }\n",
      "src/app/api/alpha/action/__tests__/green.test.ts":
        'import "../route";\nit("green", () => expect(true).toBe(true));\n',
      "src/app/api/alpha/action/__tests__/red.test.ts":
        'import "../route";\nit("red", () => expect(true).toBe(true));\n',
      "src/app/api/beta/action/route.ts":
        "export async function POST() { return approve({ value: true }); }\n",
      "src/app/api/beta/action/__tests__/dark.test.ts":
        'import "../route";\nit("dark", () => expect(true).toBe(true));\n',
      ".github/workflows/gate.yml": PR_WORKFLOW(
        [
          "npx jest src/app/api/alpha/action/__tests__",
          "--testPathIgnorePatterns /node_modules/",
          "src/app/api/alpha/action/__tests__/red.test.ts",
        ].join(" "),
      ),
    });

    const { census } = runCensus(dir);

    // Both files are unrun, and the total is unchanged by the classification.
    expect(census.counts.uncoveredTestFiles).toBe(2);
    expect(census.counts.declaredQuarantineTestFiles).toBe(1);
    expect(census.counts.untriagedUnrunTestFiles).toBe(1);

    const alpha = census.partiallyCoveredDirectories.find(
      (row) => row.directory === "src/app/api/alpha/action/__tests__",
    );
    expect(alpha).toMatchObject({
      testFiles: 2,
      coveredTestFiles: 1,
      declaredQuarantineTestFiles: 1,
      untriagedUnrunTestFiles: 0,
    });

    const beta = census.uncoveredDirectories.find(
      (row) => row.directory === "src/app/api/beta/action/__tests__",
    );
    expect(beta).toMatchObject({
      testFiles: 1,
      declaredQuarantineTestFiles: 0,
      untriagedUnrunTestFiles: 1,
    });

    // The whole point: a directory whose unrun set is entirely declared
    // quarantine is not offered as work to triage, while the dark one is.
    expect(census.governedRiskRanking.map((row) => row.directory)).toEqual([
      "src/app/api/beta/action/__tests__",
    ]);
    expect(census.governedRiskRanking[0]).toMatchObject({
      unrunTestFiles: 1,
      declaredQuarantineTestFiles: 0,
      untriagedUnrunTestFiles: 1,
    });
  });

  /**
   * A second command running the same file in full must still count it as
   * covered rather than as a quarantine. `coverageFor` already scopes the
   * ignore patterns to the command that passes them; this holds that the new
   * classification did not reintroduce the global subtraction.
   */
  it("does not call a file quarantined when another command runs it in full", () => {
    const dir = fixture({
      "src/lib/gamma/__tests__/shared.test.ts": TEST_FILE,
      ".github/workflows/narrow.yml": PR_WORKFLOW(
        [
          "npx jest src/lib/gamma/__tests__",
          "--testPathIgnorePatterns /node_modules/",
          "src/lib/gamma/__tests__/shared.test.ts",
        ].join(" "),
      ),
      ".github/workflows/full.yml": PR_WORKFLOW("npx jest src/lib/gamma/__tests__"),
    });

    const { census } = runCensus(dir);

    expect(census.counts.uncoveredTestFiles).toBe(0);
    expect(census.counts.declaredQuarantineTestFiles).toBe(0);
    expect(census.counts.untriagedUnrunTestFiles).toBe(0);
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

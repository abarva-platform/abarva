import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
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
    indeterminateInvocations: number;
    criticalGovernedRiskDirectories: number;
    highGovernedRiskDirectories: number;
    unclassifiedRiskDirectories: number;
  };
  indeterminateInvocations: { source: string; invocation: string }[];
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
  for (const [relative, contents] of Object.entries(files)) write(dir, relative, contents);
  return dir;
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
    expect(summary).toContain("top uncovered governed-risk directories:");
    expect(summary.indexOf("src/components/agent/__tests__")).toBeLessThan(
      summary.indexOf("src/app/api/source/action/__tests__"),
    );
    expect(summary.indexOf("src/app/api/source/action/__tests__")).toBeLessThan(
      summary.indexOf("src/lib/data/__tests__"),
    );
    expect(summary).not.toContain("src/lib/helpers/__tests__");
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
});

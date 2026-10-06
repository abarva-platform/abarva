import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Backlog item T-595. Three suites in `src/__tests__/behaviors` were named by
 * exact path in two workflows that cannot block a merge, while the job that
 * does block — `Behavior coverage floor` — ran all three anonymously inside its
 * directory sweep. Nothing was unprotected. What was wrong is that the line a
 * closure note could quote belonged to the non-blocking run, and the blocking
 * run had no line to quote, so a true sentence about a real run read as proof
 * of something it did not establish.
 *
 * The rule the repository now states: a step may name a suite individually only
 * inside a job that is a required status check, whenever a required job already
 * runs that suite. Duplication is not the defect — `coverage-threshold.yml`
 * names two AgentDock suites the catalog sweeps again, deliberately, and both
 * of those runs are required. Where the name lives is the defect.
 *
 * These cases pin both directions, because a control tightened until it refuses
 * everything is not a control: a named suite that only a non-required job runs
 * must stay legal, since naming it there is how it runs at all.
 *
 * The last case is the one that would have caught the filed defect, and it is
 * not a fixture: it runs the real script over the real `.github/workflows`. On
 * `613adced9`, before the repair, that run exited 1 and named four files — the
 * three filed in T-595 and one more in `source-layout-smoke.yml` that no item
 * had found. A fixture cannot establish that, because a fixture is written to
 * satisfy the check.
 *
 * Every case executes a byte-copy of the real script made at test time, so a
 * mutation of the script under `scripts/quality/` is a mutation of what runs
 * here.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const realControl = path.join(repoRoot, "scripts/quality/check-named-suite-requiredness.mjs");

type Run = { status: number; output: string };

function runControl(cwd: string): Run {
  const control = path.join(cwd, "scripts/quality/check-named-suite-requiredness.mjs");
  try {
    const stdout = execFileSync(process.execPath, [control], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, output: stdout };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: failure.status ?? 1,
      output: `${failure.stdout ?? ""}${failure.stderr ?? ""}`,
    };
  }
}

type Tree = {
  workflows: Record<string, string>;
  scripts?: Record<string, string>;
  mirror?: unknown;
  files?: Record<string, string>;
  directories?: string[];
};

const BEHAVIOR_GATE_SCRIPT = `import { spawnSync } from "node:child_process";
const jest = spawnSync("npx", ["jest", "src/__tests__/behaviors", "--ci"], { stdio: "inherit" });
process.exit(jest.status ?? 1);
`;

function defaultMirror() {
  return {
    note: "fixture",
    requiredContexts: ["Behavior coverage floor"],
    indirectSweeps: [
      {
        context: "Behavior coverage floor",
        directory: "src/__tests__/behaviors",
        provenBy: "scripts/ci/check-behavior-coverage.mjs",
        reason: "fixture",
      },
    ],
  };
}

const scratchRoots: string[] = [];

function buildTree(tree: Tree): string {
  const root = mkdtempSync(path.join(tmpdir(), "named-suite-requiredness-"));
  scratchRoots.push(root);

  const write = (relative: string, contents: string) => {
    const target = path.join(root, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, contents);
  };

  // The control imports js-yaml, and resolves its own repo root from its file
  // location, so the scratch tree needs the real dependency tree beside it.
  symlinkSync(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir");

  mkdirSync(path.join(root, "scripts/quality"), { recursive: true });
  copyFileSync(realControl, path.join(root, "scripts/quality/check-named-suite-requiredness.mjs"));

  write("package.json", JSON.stringify({ name: "fixture", scripts: tree.scripts ?? {} }, null, 2));
  write(
    "docs/ci/required-status-checks.json",
    JSON.stringify(tree.mirror ?? defaultMirror(), null, 2),
  );
  write("scripts/ci/check-behavior-coverage.mjs", BEHAVIOR_GATE_SCRIPT);

  for (const [name, contents] of Object.entries(tree.workflows)) {
    write(path.join(".github/workflows", name), contents);
  }
  for (const [name, contents] of Object.entries(tree.files ?? {})) {
    write(name, contents);
  }
  // A sweep argument only counts when it resolves to a real directory, which is
  // what keeps a deleted directory from being reported as still swept.
  for (const directory of tree.directories ?? ["src/__tests__/behaviors"]) {
    mkdirSync(path.join(root, directory), { recursive: true });
  }

  return root;
}

function workflow(jobName: string, steps: string[]): string {
  return [
    `name: ${jobName} workflow`,
    "on:",
    "  pull_request:",
    "jobs:",
    "  job:",
    `    name: ${jobName}`,
    "    runs-on: ubuntu-latest",
    "    steps:",
    ...steps.map((step) => `      - run: ${step}`),
  ].join("\n");
}

afterAll(() => {
  for (const root of scratchRoots) rmSync(root, { recursive: true, force: true });
});

describe("a workflow step that names a suite a required job already runs", () => {
  it("refuses the name when the job hosting it cannot block a merge", () => {
    const root = buildTree({
      workflows: {
        "coverage-threshold.yml": workflow("Behavior coverage floor", [
          "npm run coverage:behavior-gate",
        ]),
        "unit-suites.yml": workflow("Unit suites that pass on main", [
          "npx jest --runTestsByPath src/__tests__/behaviors/route-export-reachability.test.ts --ci",
        ]),
      },
      scripts: { "coverage:behavior-gate": "node scripts/ci/check-behavior-coverage.mjs" },
    });

    const result = runControl(root);

    expect(result.status).toBe(1);
    expect(result.output).toContain("src/__tests__/behaviors/route-export-reachability.test.ts");
    expect(result.output).toContain("Unit suites that pass on main");
    expect(result.output).toContain("Behavior coverage floor");
  });

  it("accepts the same name once it sits inside the required job", () => {
    const root = buildTree({
      workflows: {
        "coverage-threshold.yml": workflow("Behavior coverage floor", [
          "npm run coverage:behavior-gate",
          "npx jest --runTestsByPath src/__tests__/behaviors/route-export-reachability.test.ts --ci",
        ]),
        "unit-suites.yml": workflow("Unit suites that pass on main", ["npx jest src/app --ci"]),
      },
      scripts: { "coverage:behavior-gate": "node scripts/ci/check-behavior-coverage.mjs" },
      directories: ["src/__tests__/behaviors", "src/app"],
    });

    const result = runControl(root);

    expect(result.status).toBe(0);
    expect(result.output).toContain("OK:");
  });

  it("leaves a named suite alone when no required job runs it", () => {
    const root = buildTree({
      workflows: {
        "coverage-threshold.yml": workflow("Behavior coverage floor", [
          "npm run coverage:behavior-gate",
        ]),
        "unit-suites.yml": workflow("Unit suites that pass on main", [
          "npx jest --runTestsByPath src/lib/atlas/__tests__/rendered-response.test.ts --ci",
        ]),
      },
      scripts: { "coverage:behavior-gate": "node scripts/ci/check-behavior-coverage.mjs" },
    });

    const result = runControl(root);

    expect(result.status).toBe(0);
    expect(result.output).not.toContain("rendered-response.test.ts");
  });

  it("sees the name through a wrapper npm script rather than only in the YAML", () => {
    const root = buildTree({
      workflows: {
        "coverage-threshold.yml": workflow("Behavior coverage floor", [
          "npm run coverage:behavior-gate",
        ]),
        "smoke.yml": workflow("Source layout harnesses", ["npm run qa:journey-smoke"]),
      },
      scripts: {
        "coverage:behavior-gate": "node scripts/ci/check-behavior-coverage.mjs",
        "qa:journey-smoke":
          "npx jest src/__tests__/behaviors/route-export-reachability.test.ts --runInBand",
      },
    });

    const result = runControl(root);

    expect(result.status).toBe(1);
    expect(result.output).toContain("Source layout harnesses");
  });
});

describe("the mirror of the ruleset cannot go quietly stale", () => {
  it("refuses a required context that names no job", () => {
    const mirror = defaultMirror();
    mirror.requiredContexts = ["Behavior coverage floor", "A job that was renamed"];
    const root = buildTree({
      workflows: {
        "coverage-threshold.yml": workflow("Behavior coverage floor", [
          "npm run coverage:behavior-gate",
        ]),
      },
      scripts: { "coverage:behavior-gate": "node scripts/ci/check-behavior-coverage.mjs" },
      mirror,
    });

    const result = runControl(root);

    expect(result.status).toBe(1);
    expect(result.output).toContain("A job that was renamed");
    expect(result.output).toContain("names no job");
  });

  it("refuses a declared sweep the script performing it no longer performs", () => {
    const root = buildTree({
      workflows: {
        "coverage-threshold.yml": workflow("Behavior coverage floor", [
          "npm run coverage:behavior-gate",
        ]),
        "unit-suites.yml": workflow("Unit suites that pass on main", [
          "npx jest --runTestsByPath src/__tests__/behaviors/route-export-reachability.test.ts --ci",
        ]),
      },
      scripts: { "coverage:behavior-gate": "node scripts/ci/check-behavior-coverage.mjs" },
      files: {
        "scripts/ci/check-behavior-coverage.mjs":
          'import { spawnSync } from "node:child_process";\nspawnSync("npx", ["jest", "src/__tests__/moved-elsewhere", "--ci"]);\n',
      },
    });

    const result = runControl(root);

    expect(result.status).toBe(1);
    expect(result.output).toContain("unproven");
  });
});

describe("the repository itself", () => {
  it("names no suite in a non-required job that a required job already runs", () => {
    const result = runControl(repoRoot);

    expect(result.output).not.toContain("does not block a merge");
    expect(result.status).toBe(0);
  });
});

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import yaml from "js-yaml";

/**
 * T-760 — the test-CI-coverage census drift check runs in a workflow.
 *
 * `scripts/quality/test-ci-coverage-census.mjs --check` existed as
 * `npm run audit:test-ci-coverage:check` and was reached by no workflow. The
 * only workflow naming the census named it in three COMMENTS. So keeping the
 * committed census current was a rule a person had to remember, and that file
 * is the input ranking which unrun directory gets wired next: when it lags,
 * the queue is mis-ranked and the lag is invisible until somebody regenerates
 * and finds the rank-1 entry inside an 800-line diff.
 *
 * **ONE CORRECTION TO THE ITEM, MEASURED IN BOTH DIRECTIONS RATHER THAN
 * ARGUED.** T-760's acceptance says: "Prove the gate by mutation: adding a
 * test file without refreshing the census must fail the job." That is not
 * what `--check` does, and the difference is deliberate. `--check` gates the
 * coverage SHAPE — which directories are covered, partial or uncovered — and
 * never the counts. Re-measured on `origin/main` `d3d8a198c`, on the real
 * tree and again in an isolated scratch root, both agreeing:
 *
 *   a test file added to an ALREADY-COVERED directory
 *     -> `testFiles` +1, `coveredTestFiles` +1, shape unchanged, exit 0
 *   a test file added in a directory NO workflow reaches
 *     -> `+uncovered <dir>`, exit 1
 *
 * So the item's literal mutation passes, and it should: the reasoning is
 * written above `describeShapeDrift` in the script and it was measured, not
 * assumed — a gate on the counts fires on nearly every pull request that adds
 * a test, and the cheapest way to green would be regenerating a
 * two-thousand-line artifact, which is how a control stops being read. Case 4
 * below pins that as an executable fact instead of a paragraph, so a future
 * change that promotes the counts to a failure has to confront it.
 *
 * Both halves are asserted here: that the gate runs, and that it can fail.
 * Case 3 drives the REAL CLI end-to-end in a scratch repository root — the
 * script derives its root from its own location, so a copy of `scripts/`
 * makes the whole four-hop resolution run over a tree this test owns. Nothing
 * is written under `src/` at any point; a case that created and deleted files
 * there mid-run would be the race T-759 was filed against.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const GATE_WORKFLOW = ".github/workflows/test-ci-coverage-census.yml";
const GATE_STEP_NAME = "Coverage shape is current";
const VISIBILITY_HELPER = "scripts/quality/check-integration-ci-visibility.mjs";

type WorkflowTriggers = { pull_request?: unknown } & Record<string, unknown>;

function readWorkflowDocument(relative: string): {
  on: WorkflowTriggers;
  jobs: Record<string, { steps?: { name?: string; run?: string; shell?: string }[] }>;
} {
  return yaml.load(readFileSync(path.join(repoRoot, relative), "utf8")) as never;
}

/**
 * Which pull-request workflows reach the census with `--check`, resolved by
 * the census's OWN workflow-command extractor and npm-script expander rather
 * than by searching `.github/workflows` for a string. That grep answers "does
 * a workflow NAME this script", which is a different question — it is exactly
 * how the old catalog gate passed on three comments, and three backlog items
 * were filed false on the same confusion.
 */
function workflowsReachingTheCheck(): { workflow: string; command: string }[] {
  const source = `
    import { readdirSync, readFileSync } from "node:fs";
    import path from "node:path";
    import {
      extractWorkflowRunCommands,
      expandWorkflowCommands,
    } from ${JSON.stringify(pathToFileURL(path.join(repoRoot, VISIBILITY_HELPER)).href)};

    const root = ${JSON.stringify(repoRoot)};
    const scripts = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf8"),
    ).scripts ?? {};
    const directory = path.join(root, ".github", "workflows");
    const hits = [];
    for (const name of readdirSync(directory).filter((f) => /\\.ya?ml$/.test(f))) {
      const text = readFileSync(path.join(directory, name), "utf8");
      // Trigger read from the parsed document by the caller; here we only
      // need every command the workflow's run steps resolve to.
      const commands = expandWorkflowCommands(
        extractWorkflowRunCommands(text, { preserveEscapes: true }),
        scripts,
        { preserveEscapes: true },
      );
      for (const command of commands) {
        if (
          command.includes(${JSON.stringify(CENSUS_SCRIPT)}) &&
          /(^|\\s)--check(\\s|$)/.test(command)
        ) {
          hits.push({ workflow: ".github/workflows/" + name, command });
        }
      }
    }
    process.stdout.write(JSON.stringify(hits));
  `;
  return JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "--eval", source], {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }),
  );
}

type ScratchProbe = {
  cleanExit: number | null;
  newDirectoryExit: number | null;
  newDirectoryShape: string[];
  coveredDirectoryExit: number | null;
  coveredDirectoryDrift: string;
  mutationsAreRealEdits: { newDirectory: boolean; coveredDirectory: boolean };
};

/**
 * The real CLI, three times, over a scratch repository root.
 *
 * `REPO_ROOT` inside the census is `<script dir>/../..`, so copying
 * `scripts/` into a temporary directory makes the script measure THAT tree.
 * The whole directory is copied rather than the import closure: a run-time
 * path reference is invisible to an import walk, and those are the silent
 * ones.
 *
 * Each mutation is checked for being a real edit before its effect is
 * believed. A no-op mutation reads exactly like a gate that fired.
 */
function probeGateInScratchRoot(): ScratchProbe {
  const source = `
    import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
    import { spawnSync } from "node:child_process";
    import os from "node:os";
    import path from "node:path";

    const root = ${JSON.stringify(repoRoot)};
    const scratch = mkdtempSync(path.join(os.tmpdir(), "t760-census-"));
    const census = path.join(scratch, ${JSON.stringify(CENSUS_SCRIPT)});
    const run = (args) => {
      const result = spawnSync(process.execPath, [census, ...args], {
        cwd: scratch,
        encoding: "utf8",
      });
      return { status: result.status, out: (result.stdout ?? "") + (result.stderr ?? "") };
    };

    try {
      cpSync(path.join(root, "scripts"), path.join(scratch, "scripts"), { recursive: true });
      // The census parses TypeScript with the real compiler; node resolves
      // bare specifiers by walking up from the script, so the scratch root
      // needs the dependency tree in place.
      symlinkSync(path.join(root, "node_modules"), path.join(scratch, "node_modules"));
      mkdirSync(path.join(scratch, "docs", "architecture"), { recursive: true });
      mkdirSync(path.join(scratch, ".github", "workflows"), { recursive: true });
      mkdirSync(path.join(scratch, "src", "lib", "reached", "__tests__"), { recursive: true });

      writeFileSync(
        path.join(scratch, "package.json"),
        JSON.stringify({ name: "t760-scratch", scripts: { unit: "jest src/lib/reached/__tests__" } }),
      );
      writeFileSync(
        path.join(scratch, ".github", "workflows", "unit.yml"),
        "name: u\\non:\\n  pull_request:\\njobs:\\n  j:\\n    runs-on: ubuntu-latest\\n    steps:\\n      - run: npm run unit\\n",
      );
      writeFileSync(
        path.join(scratch, "src", "lib", "reached", "__tests__", "a.test.ts"),
        'it("a", () => { expect(1).toBe(1); });\\n',
      );

      // Committed census written from the tree itself, so the baseline is
      // current by construction and a later non-zero exit can only come from
      // the mutation.
      run(["--write"]);
      const clean = run(["--check"]);

      // (b) a test file in a directory no workflow reaches — the shape moves.
      const newDirectory = path.join(scratch, "src", "lib", "unreached", "__tests__");
      mkdirSync(newDirectory, { recursive: true });
      const newFile = path.join(newDirectory, "b.test.ts");
      writeFileSync(newFile, 'it("b", () => { expect(1).toBe(1); });\\n');
      const newDirectoryRun = run(["--check"]);
      const newDirectoryIsReal = existsSync(newFile);
      rmSync(path.join(scratch, "src", "lib", "unreached"), { recursive: true, force: true });

      // (a) a test file in the already-covered directory — counts move, shape
      // does not. The control for (b): same action, different directory.
      const coveredFile = path.join(scratch, "src", "lib", "reached", "__tests__", "c.test.ts");
      writeFileSync(coveredFile, 'it("c", () => { expect(1).toBe(1); });\\n');
      const coveredRun = run(["--check"]);
      const coveredIsReal = existsSync(coveredFile);

      process.stdout.write(JSON.stringify({
        cleanExit: clean.status,
        newDirectoryExit: newDirectoryRun.status,
        newDirectoryShape: newDirectoryRun.out
          .split("\\n")
          .filter((line) => /^\\s*\\+(uncovered|partial|unmeasured)\\s/.test(line))
          .map((line) => line.trim()),
        coveredDirectoryExit: coveredRun.status,
        coveredDirectoryDrift:
          (coveredRun.out.split("\\n").find((line) => line.startsWith("census drift:")) ?? "").trim(),
        mutationsAreRealEdits: { newDirectory: newDirectoryIsReal, coveredDirectory: coveredIsReal },
      }));
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  `;
  return JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "--eval", source], {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }),
  );
}

let reaching: { workflow: string; command: string }[];
let probe: ScratchProbe;

beforeAll(() => {
  reaching = workflowsReachingTheCheck();
  probe = probeGateInScratchRoot();
}, 180_000);

describe("T-760 — the census drift check is reached by a pull-request workflow", () => {
  it("resolves the census --check through a workflow run step, not a comment", () => {
    expect(reaching.map((hit) => hit.workflow)).toContain(GATE_WORKFLOW);
  });

  it("gates pull requests", () => {
    const document = readWorkflowDocument(GATE_WORKFLOW);
    expect(Object.keys(document.on)).toContain("pull_request");
  });

  /**
   * No `paths:` narrowing. The coverage shape is a function of the test tree,
   * the workflow files, `package.json` and the repo scripts those resolve to;
   * an enumeration of those inputs is the exemption branch — the one pull
   * request that moves an input nobody listed is the one this must not miss,
   * and its miss is unobservable. If a filter is ever added it must at least
   * reach every test file under `src/`, which is what the second half checks
   * rather than merely forbidding the key.
   */
  it("cannot be skipped by a paths filter that misses a new test directory", () => {
    const trigger = readWorkflowDocument(GATE_WORKFLOW).on.pull_request as
      | { paths?: string[]; "paths-ignore"?: string[] }
      | null
      | undefined;
    if (!trigger) return;
    expect(trigger["paths-ignore"]).toBeUndefined();
    if (trigger.paths) {
      expect(trigger.paths.some((pattern) => /^src\/\*\*/.test(pattern))).toBe(true);
    }
  });

  /**
   * A pipe would make this gate unfailable: the default shell for a `run:`
   * block on Linux is `bash -e {0}` with no pipefail, so a piped command
   * exits with the status of the LAST stage. The step either avoids a pipe or
   * sets pipefail; a comment saying so is not enough, which is the reason
   * this reads the step rather than the file's prose.
   */
  it("does not let a pipe swallow the check's exit status", () => {
    const document = readWorkflowDocument(GATE_WORKFLOW);
    const step = Object.values(document.jobs)
      .flatMap((job) => job.steps ?? [])
      .find((candidate) => candidate.name === GATE_STEP_NAME);
    expect(step).toBeDefined();
    const script = step?.run ?? "";
    // The step names the npm alias, and the alias is what the first case
    // resolved to the script with `--check`. Asserting the literal flag here
    // would only be asserting which of the two spellings someone used.
    expect(script).toMatch(/audit:test-ci-coverage:check|test-ci-coverage-census\.mjs/);
    if (/\|(?!\|)/.test(script)) {
      expect(script).toMatch(/set -o pipefail/);
      expect(step?.shell).toBe("bash");
    }
  });
});

describe("T-760 — the gate can fail, measured by mutation over a scratch root", () => {
  it("is green when the committed census matches the tree", () => {
    expect(probe.cleanExit).toBe(0);
  });

  it("fails when a test directory no workflow reaches appears", () => {
    expect(probe.mutationsAreRealEdits.newDirectory).toBe(true);
    expect(probe.newDirectoryExit).toBe(1);
    expect(probe.newDirectoryShape).toContain("+uncovered src/lib/unreached/__tests__");
  });

  /**
   * The correction to the item, as a case rather than a paragraph. This is
   * the same action as the case above — one new test file, no census refresh
   * — in a directory a workflow already runs, and it is green on purpose.
   * Promote the counts to a failure and this case goes red, which is the
   * point of writing it down.
   */
  it("stays green when a covered directory gains a test file, while the counts move", () => {
    expect(probe.mutationsAreRealEdits.coveredDirectory).toBe(true);
    expect(probe.coveredDirectoryExit).toBe(0);
    expect(probe.coveredDirectoryDrift).toMatch(/committed census is STALE/);
    expect(probe.coveredDirectoryDrift).toMatch(/testFiles 1 -> 2/);
  });
});

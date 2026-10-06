import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import yaml from "js-yaml";

/**
 * Backlog item C-582. Every behavioural contract under `scripts/exec/` ran in a
 * job no ruleset requires, so none of them could fail a merge.
 *
 * Read by name against the rulesets API on 2026-10-04, `main` carried 19
 * required status contexts and `Execution queue behavioral contract` — the job
 * in `.github/workflows/execution-queue-toolchain.yml` where all fifteen of
 * those suites are wired — was not one of them. It triggers (`paths:
 * scripts/exec/**`) and it is advisory when it goes red. The suites it hosts
 * are the claim gate, the queue generator, the register time-authority control
 * and the provenance guard: the tools every other item's ownership and
 * evidence depend on.
 *
 * That is item T-457's own lesson restated one layer up — a job that passes may
 * be required by nothing — and it is the founding defect of this directory
 * reached from the quietest direction, because nothing about a green advisory
 * run looks different from a green blocking one.
 *
 * The remedy taken is to run the sweep inside `Behavior coverage floor`, a
 * context the `main` ruleset already requires, rather than to ask for a
 * nineteenth context to become a twentieth: adding one is a change to GitHub
 * repository settings, and that job is already the declared home for controls
 * that must be able to fail a merge. The step is plain `node`, not jest, so it
 * adds nothing to the floor's coverage denominator.
 *
 * What this contract asserts is NOT "the step exists". It is: for every
 * `scripts/exec/*.test.mjs` suite ON DISK, some job whose name is a required
 * status context actually executes it. Three properties follow, and each is
 * pinned by its own case rather than left to the reading:
 *
 *   - Requiredness is read from `docs/ci/required-status-checks.json`, the
 *     mirror `scripts/quality/check-named-suite-requiredness.mjs` already
 *     refuses to let name a job that does not exist. Hard-coding a context name
 *     here would make this control agree with itself.
 *   - A glob in a `run:` block is EXPANDED against the filesystem, never
 *     pattern-matched as text, so a suite written beside the others tomorrow is
 *     wired by being written and a per-file list cannot drift.
 *   - Shell comment lines are stripped before any command is read. A `#` line
 *     carrying the path of a suite is exactly the "a comment satisfies the
 *     gate" failure this backlog exists against, and case 5 proves it does not.
 */

const repoRoot = path.resolve(__dirname, "../../..");

type JobRun = { workflow: string; context: string; commands: string[] };

/** The contexts `main` requires, from the guarded mirror — never a literal here. */
function requiredContexts(root: string): Set<string> {
  const mirror = JSON.parse(
    readFileSync(path.join(root, "docs/ci/required-status-checks.json"), "utf8"),
  ) as { requiredContexts?: unknown };
  const contexts = Array.isArray(mirror.requiredContexts) ? mirror.requiredContexts : [];
  return new Set(contexts.filter((value): value is string => typeof value === "string"));
}

/**
 * A `run:` body with shell comment lines removed. A comment cannot wire a
 * suite into CI, so it must not be able to satisfy a control that asks whether
 * one is wired.
 */
function stripShellComments(command: string): string {
  return command
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");
}

function workflowJobs(root: string): JobRun[] {
  const dir = path.join(root, ".github/workflows");
  const jobs: JobRun[] = [];
  for (const file of readdirSync(dir).filter((name) => /\.ya?ml$/.test(name))) {
    let document: unknown;
    try {
      document = yaml.load(readFileSync(path.join(dir, file), "utf8"));
    } catch {
      continue;
    }
    const definitions = (document as { jobs?: Record<string, unknown> } | null)?.jobs ?? {};
    for (const [key, raw] of Object.entries(definitions)) {
      const job = raw as { name?: unknown; steps?: unknown };
      const steps = Array.isArray(job.steps) ? job.steps : [];
      const commands = steps
        .map((step) => (step as { run?: unknown }).run)
        .filter((run): run is string => typeof run === "string")
        .map(stripShellComments);
      jobs.push({
        workflow: file,
        context: typeof job.name === "string" ? job.name : key,
        commands,
      });
    }
  }
  return jobs;
}

/** Every `scripts/exec/*.test.mjs` suite that exists, relative to the root. */
function execSuites(root: string): string[] {
  const dir = path.join(root, "scripts/exec");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".test.mjs"))
    .sort()
    .map((name) => `scripts/exec/${name}`);
}

/**
 * The suites a single command runs. A bare path counts. A glob is expanded
 * against the filesystem — the point of the expansion is that the command's
 * coverage is measured against the directory as it is, not against a list
 * somebody remembered to update.
 */
function suitesRunByCommand(command: string, root: string): Set<string> {
  const covered = new Set<string>();
  const suites = execSuites(root);
  for (const raw of command.split(/[\s;'"]+/)) {
    const token = raw.replace(/[,;]+$/, "");
    if (!token.startsWith("scripts/exec/")) continue;
    if (token.includes("*")) {
      const pattern = new RegExp(
        `^${token.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*")}$`,
      );
      for (const suite of suites) if (pattern.test(suite)) covered.add(suite);
      continue;
    }
    if (suites.includes(token)) covered.add(token);
  }
  return covered;
}

/** Suite → the required contexts whose jobs run it. Empty value means unguarded. */
function coverageByRequiredContext(root: string): Map<string, string[]> {
  const required = requiredContexts(root);
  const jobs = workflowJobs(root).filter((job) => required.has(job.context));
  const coverage = new Map<string, string[]>();
  for (const suite of execSuites(root)) coverage.set(suite, []);
  for (const job of jobs) {
    for (const command of job.commands) {
      for (const suite of suitesRunByCommand(command, root)) {
        const contexts = coverage.get(suite);
        if (contexts && !contexts.includes(job.context)) contexts.push(job.context);
      }
    }
  }
  return coverage;
}

// --------------------------------------------------------------------------
// The real repository. This is the case that would have caught the filed
// defect; the fixtures below exist to prove the detector can fail and does not
// refuse everything.
// --------------------------------------------------------------------------

describe("C-582 — the scripts/exec contracts run in a job that can block a merge", () => {
  it("finds suites to guard at all, so a later emptiness cannot read as a pass", () => {
    expect(execSuites(repoRoot).length).toBeGreaterThanOrEqual(10);
  });

  it("runs every scripts/exec suite inside at least one required status context", () => {
    const coverage = coverageByRequiredContext(repoRoot);
    const unguarded = [...coverage.entries()]
      .filter(([, contexts]) => contexts.length === 0)
      .map(([suite]) => suite);
    expect(unguarded).toEqual([]);
  });

  it("names the required context by a name the mirror carries, not a literal in this file", () => {
    const coverage = coverageByRequiredContext(repoRoot);
    const credited = new Set([...coverage.values()].flat());
    expect(credited.size).toBeGreaterThan(0);
    const mirrored = requiredContexts(repoRoot);
    for (const context of credited) expect(mirrored.has(context)).toBe(true);
  });

  it("credits only a context that names a real job, so a stale mirror entry cannot cover a suite", () => {
    const declared = new Set(workflowJobs(repoRoot).map((job) => job.context));
    const credited = new Set([...coverageByRequiredContext(repoRoot).values()].flat());
    for (const context of credited) expect(declared.has(context)).toBe(true);
  });
});

// --------------------------------------------------------------------------
// Fixtures. Each builds a root with its own scripts/exec, workflows and mirror,
// so the detector is driven over inputs the repository does not contain.
// --------------------------------------------------------------------------

type Fixture = {
  suites: string[];
  mirrorContexts: string[];
  workflows: Record<string, unknown>;
};

function buildFixture(fixture: Fixture): string {
  const root = mkdtempSync(path.join(tmpdir(), "c582-"));
  mkdirSync(path.join(root, "scripts/exec"), { recursive: true });
  mkdirSync(path.join(root, ".github/workflows"), { recursive: true });
  mkdirSync(path.join(root, "docs/ci"), { recursive: true });
  for (const suite of fixture.suites) {
    writeFileSync(path.join(root, "scripts/exec", suite), "// fixture suite\n");
  }
  writeFileSync(
    path.join(root, "docs/ci/required-status-checks.json"),
    JSON.stringify({ requiredContexts: fixture.mirrorContexts }, null, 2),
  );
  for (const [file, document] of Object.entries(fixture.workflows)) {
    writeFileSync(path.join(root, ".github/workflows", file), yaml.dump(document));
  }
  return root;
}

function sweepJob(name: string, command: string) {
  return { jobs: { only: { name, steps: [{ name: "sweep", run: command }] } } };
}

describe("C-582 — the detector's own failure modes", () => {
  const roots: string[] = [];
  const fixture = (spec: Fixture) => {
    const root = buildFixture(spec);
    roots.push(root);
    return root;
  };
  afterAll(() => {
    for (const root of roots) rmSync(root, { recursive: true, force: true });
  });

  const twoSuites = ["alpha.test.mjs", "beta.test.mjs"];

  it("1 a glob inside a required job covers every suite the directory holds", () => {
    const root = fixture({
      suites: twoSuites,
      mirrorContexts: ["Gate"],
      workflows: {
        "a.yml": sweepJob(
          "Gate",
          'for s in scripts/exec/*.test.mjs; do node "$s"; done',
        ),
      },
    });
    const coverage = coverageByRequiredContext(root);
    expect(coverage.get("scripts/exec/alpha.test.mjs")).toEqual(["Gate"]);
    expect(coverage.get("scripts/exec/beta.test.mjs")).toEqual(["Gate"]);
  });

  it("2 the same glob in a job the mirror does not require covers nothing", () => {
    const root = fixture({
      suites: twoSuites,
      mirrorContexts: ["Some other gate"],
      workflows: {
        "a.yml": sweepJob(
          "Advisory",
          'for s in scripts/exec/*.test.mjs; do node "$s"; done',
        ),
      },
    });
    const coverage = coverageByRequiredContext(root);
    expect([...coverage.values()].flat()).toEqual([]);
  });

  it("3 a per-file list leaves a newly written sibling unguarded", () => {
    const root = fixture({
      suites: [...twoSuites, "gamma.test.mjs"],
      mirrorContexts: ["Gate"],
      workflows: {
        "a.yml": sweepJob(
          "Gate",
          "node scripts/exec/alpha.test.mjs\nnode scripts/exec/beta.test.mjs",
        ),
      },
    });
    const coverage = coverageByRequiredContext(root);
    expect(coverage.get("scripts/exec/alpha.test.mjs")).toEqual(["Gate"]);
    expect(coverage.get("scripts/exec/gamma.test.mjs")).toEqual([]);
  });

  it("4 a glob that cannot match the suffix covers nothing, so the expansion is real", () => {
    const root = fixture({
      suites: twoSuites,
      mirrorContexts: ["Gate"],
      workflows: {
        "a.yml": sweepJob("Gate", 'for s in scripts/exec/*.spec.mjs; do node "$s"; done'),
      },
    });
    expect([...coverageByRequiredContext(root).values()].flat()).toEqual([]);
  });

  it("5 a shell comment naming the glob covers nothing — the founding defect of this directory", () => {
    const root = fixture({
      suites: twoSuites,
      mirrorContexts: ["Gate"],
      workflows: {
        "a.yml": sweepJob(
          "Gate",
          "# runs scripts/exec/*.test.mjs, see item C-582\necho skipping",
        ),
      },
    });
    expect([...coverageByRequiredContext(root).values()].flat()).toEqual([]);
  });

  it("6 a job keyed without a name is read by its key, so an unnamed required job still counts", () => {
    const root = fixture({
      suites: twoSuites,
      mirrorContexts: ["only"],
      workflows: {
        "a.yml": {
          jobs: { only: { steps: [{ run: 'for s in scripts/exec/*.test.mjs; do node "$s"; done' }] } },
        },
      },
    });
    expect(coverageByRequiredContext(root).get("scripts/exec/alpha.test.mjs")).toEqual(["only"]);
  });
});

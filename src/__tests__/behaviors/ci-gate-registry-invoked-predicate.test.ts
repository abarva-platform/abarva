import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * The CI gate registry enforces one consequence: a script classified `pr-gate`
 * must actually be invoked by a workflow. That is the first of the three things
 * this repository now requires of a gate — it runs, it sees, it proves.
 *
 * The predicate deciding "it runs" was `workflowText.includes(`npm run ${name}`)`,
 * a substring test. npm script names nest by colon, so `audit:foo` is a prefix of
 * `audit:foo:guard` — and a workflow that runs only the longer one satisfied the
 * check for the shorter one too. Three scripts on `main` were counted as wired
 * that way while running in no workflow at all.
 *
 * That is the same defect the registry exists to remove, one level up: a token
 * match standing in for the thing it claims to prove. These cases pin both
 * directions — the prefix no longer counts, and every legitimate way a workflow
 * reaches a script still does, because a predicate tightened until it says "no"
 * to everything is not a repair.
 *
 * Each case builds a scratch tree and runs a byte-copy of the real checker
 * inside it: the checker resolves its own repo root from its file location, so
 * it cannot be pointed at a fixture any other way. The copy is made at test
 * time, so a mutation of the real script is a mutation of what runs here.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const realChecker = path.join(repoRoot, "scripts/audit/ci-gate-registry-check.mjs");

type Run = { status: number; output: string };

function run(cwd: string): Run {
  const checker = path.join(cwd, "scripts/audit/ci-gate-registry-check.mjs");
  try {
    const stdout = execFileSync(process.execPath, [checker], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, output: stdout };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: err.status ?? 1,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}`,
    };
  }
}

const scratchDirs: string[] = [];

/**
 * A minimal repository the checker can read: its own copy at the path it expects,
 * a package.json, one workflow, and a registry.
 */
function makeTree(options: {
  scripts: Record<string, string>;
  workflow: string;
  entries: Record<string, { kind: string; reason?: string }>;
}): string {
  const dir = mkdtempSync(path.join(tmpdir(), "ci-gate-registry-"));
  scratchDirs.push(dir);

  mkdirSync(path.join(dir, "scripts/audit"), { recursive: true });
  copyFileSync(realChecker, path.join(dir, "scripts/audit/ci-gate-registry-check.mjs"));

  writeFileSync(
    path.join(dir, "package.json"),
    `${JSON.stringify({ name: "scratch", scripts: options.scripts }, null, 2)}\n`,
  );

  mkdirSync(path.join(dir, ".github/workflows"), { recursive: true });
  writeFileSync(path.join(dir, ".github/workflows/ci.yml"), options.workflow);

  mkdirSync(path.join(dir, "docs/architecture"), { recursive: true });
  writeFileSync(
    path.join(dir, "docs/architecture/ci-gate-registry.json"),
    `${JSON.stringify({ note: "scratch", entries: options.entries }, null, 2)}\n`,
  );

  return dir;
}

function workflowRunning(...commands: string[]): string {
  const steps = commands.map((c) => `      - run: ${c}`).join("\n");
  return `name: ci\non:\n  pull_request:\njobs:\n  gates:\n    runs-on: ubuntu-latest\n    steps:\n${steps}\n`;
}

afterAll(() => {
  for (const dir of scratchDirs) rmSync(dir, { recursive: true, force: true });
});

describe("ci gate registry: a longer script name does not vouch for a shorter one", () => {
  it("fails a pr-gate whose only workflow mention is a longer script that shares its prefix", () => {
    const dir = makeTree({
      scripts: {
        "audit:foo": "node scripts/audit/foo.mjs",
        "audit:foo:guard": "node scripts/audit/foo.mjs --fail",
      },
      workflow: workflowRunning("npm run audit:foo:guard"),
      entries: {
        "audit:foo": { kind: "pr-gate" },
        "audit:foo:guard": { kind: "pr-gate" },
      },
    });

    const result = run(dir);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("audit:foo: classified pr-gate but no workflow invokes it");
    // The sibling that really is wired must not be caught by the tightening.
    expect(result.output).not.toContain("audit:foo:guard: classified pr-gate");
  });

  it("fails a quarantined gate that is only invoked by prefix, rather than telling the author to reclassify it", () => {
    // The mirror consequence. `quarantined` means "a pr-gate we have not wired";
    // the substring made the checker insist a quarantined gate was already running
    // and demand it be promoted to pr-gate — advice that would have wired nothing.
    const dir = makeTree({
      scripts: {
        "audit:foo": "node scripts/audit/foo.mjs",
        "audit:foo:guard": "node scripts/audit/foo.mjs --fail",
      },
      workflow: workflowRunning("npm run audit:foo:guard"),
      entries: {
        "audit:foo": {
          kind: "quarantined",
          reason: "fails on main today; wiring it needs the baseline regenerated first",
        },
        "audit:foo:guard": { kind: "pr-gate" },
      },
    });

    const result = run(dir);

    expect(result.status).toBe(0);
    expect(result.output).not.toContain("classified quarantined but a workflow invokes it");
  });

  it("still counts a script the workflow names exactly", () => {
    const dir = makeTree({
      scripts: { "audit:foo": "node scripts/audit/foo.mjs" },
      workflow: workflowRunning("npm run audit:foo"),
      entries: { "audit:foo": { kind: "pr-gate" } },
    });

    expect(run(dir).status).toBe(0);
  });

  it("still counts a script the workflow names with trailing arguments", () => {
    const dir = makeTree({
      scripts: { "audit:foo": "node scripts/audit/foo.mjs" },
      workflow: workflowRunning("npm run audit:foo -- --check"),
      entries: { "audit:foo": { kind: "pr-gate" } },
    });

    expect(run(dir).status).toBe(0);
  });

  it("still counts a script the workflow runs by its entry file", () => {
    const dir = makeTree({
      scripts: { "audit:foo": "node scripts/audit/foo.mjs" },
      workflow: workflowRunning("node scripts/audit/foo.mjs"),
      entries: { "audit:foo": { kind: "pr-gate" } },
    });

    expect(run(dir).status).toBe(0);
  });

  it("does not let one direct entry-file mode vouch for a sibling mode", () => {
    const dir = makeTree({
      scripts: {
        "audit:foo:check": "node scripts/audit/foo.mjs --check",
        "audit:foo:baseline": "node scripts/audit/foo.mjs --baseline",
      },
      workflow: workflowRunning("node scripts/audit/foo.mjs --check"),
      entries: {
        "audit:foo:check": { kind: "pr-gate" },
        "audit:foo:baseline": { kind: "pr-gate" },
      },
    });

    const result = run(dir);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain(
      "audit:foo:baseline: classified pr-gate but no workflow invokes it",
    );
    expect(result.output).not.toContain(
      "audit:foo:check: classified pr-gate but no workflow invokes it",
    );
  });

  it("still counts a script reached through a composite the workflow runs", () => {
    const dir = makeTree({
      scripts: {
        "audit:foo": "node scripts/audit/foo.mjs",
        "audit:all": "npm run audit:foo && npm run audit:bar",
        "audit:bar": "node scripts/audit/bar.mjs",
      },
      workflow: workflowRunning("npm run audit:all"),
      entries: {
        "audit:foo": { kind: "pr-gate" },
        "audit:bar": { kind: "pr-gate" },
        "audit:all": { kind: "pr-gate" },
      },
    });

    expect(run(dir).status).toBe(0);
  });

  it("follows composite scripts to a fixed point", () => {
    const dir = makeTree({
      scripts: {
        "audit:foo": "node scripts/audit/foo.mjs",
        "audit:inner": "npm run audit:foo",
        "audit:outer": "npm run audit:inner",
      },
      workflow: workflowRunning("npm run audit:outer"),
      entries: {
        "audit:foo": { kind: "pr-gate" },
        "audit:inner": { kind: "pr-gate" },
        "audit:outer": { kind: "pr-gate" },
      },
    });

    expect(run(dir).status).toBe(0);
  });

  it("terminates composite cycles without inventing an unreachable script", () => {
    const dir = makeTree({
      scripts: {
        "audit:a": "npm run audit:b",
        "audit:b": "npm run audit:a",
        "audit:unreachable": "node scripts/audit/unreachable.mjs",
      },
      workflow: workflowRunning("npm run audit:a"),
      entries: {
        "audit:a": { kind: "pr-gate" },
        "audit:b": { kind: "pr-gate" },
        "audit:unreachable": { kind: "pr-gate" },
      },
    });

    const result = run(dir);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain(
      "audit:unreachable: classified pr-gate but no workflow invokes it",
    );
    expect(result.output).not.toContain("audit:a: classified pr-gate");
    expect(result.output).not.toContain("audit:b: classified pr-gate");
  });

  it("does not let a composite vouch for a shorter name it never runs", () => {
    const dir = makeTree({
      scripts: {
        "audit:foo": "node scripts/audit/foo.mjs",
        "audit:foo:guard": "node scripts/audit/foo.mjs --fail",
        "audit:all": "npm run audit:foo:guard",
      },
      workflow: workflowRunning("npm run audit:all"),
      entries: {
        "audit:foo": { kind: "pr-gate" },
        "audit:foo:guard": { kind: "pr-gate" },
        "audit:all": { kind: "pr-gate" },
      },
    });

    const result = run(dir);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("audit:foo: classified pr-gate but no workflow invokes it");
  });
});

/**
 * The second consequence the registry now enforces. An npm entry whose command
 * passes a write flag rewrites the standard some sibling gate measures against:
 * `audit:control-plane-purity:baseline` rewrites the file
 * `audit:control-plane-purity:check` compares today's tenant counts to. Running
 * the writer after adding debt therefore makes the check pass — by moving the
 * goalposts, not by paying anything down, and the passing check looks exactly
 * like a gate doing its job.
 *
 * So a writer may never be a pr-gate and may never be reached from a workflow,
 * and leaving one unclassified is how it slips into either. The negative case
 * matters as much: the `:check` sibling names the same baseline file, and a rule
 * that flagged it would be condemning the thing being protected.
 */
describe("ci gate registry: an entry that writes the baseline cannot also be a gate", () => {
  it("refuses a write-flag entry classified as a pr-gate", () => {
    const dir = makeTree({
      scripts: {
        "audit:foo:check": "node scripts/audit/foo.mjs --check",
        "audit:foo:baseline": "node scripts/audit/foo.mjs --baseline",
      },
      workflow: workflowRunning("npm run audit:foo:check", "npm run audit:foo:baseline"),
      entries: {
        "audit:foo:check": { kind: "pr-gate" },
        "audit:foo:baseline": { kind: "pr-gate" },
      },
    });

    const result = run(dir);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("audit:foo:baseline: passes a write flag");
    expect(result.output).toContain("it cannot be a pr-gate");
  });

  it("refuses a write-flag entry that a workflow invokes, whatever it is classified as", () => {
    const dir = makeTree({
      scripts: {
        "audit:foo:check": "node scripts/audit/foo.mjs --check",
        "audit:foo:baseline": "node scripts/audit/foo.mjs --baseline",
      },
      workflow: workflowRunning("npm run audit:foo:check", "npm run audit:foo:baseline"),
      entries: {
        "audit:foo:check": { kind: "pr-gate" },
        "audit:foo:baseline": {
          kind: "operator",
          reason: "rewrites the baseline audit:foo:check measures against",
        },
      },
    });

    const result = run(dir);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("audit:foo:baseline: passes a write flag and is invoked");
  });

  it("refuses to let a write-flag entry sit unclassified", () => {
    const dir = makeTree({
      scripts: {
        "audit:foo:check": "node scripts/audit/foo.mjs --check",
        "audit:foo:baseline": "node scripts/audit/foo.mjs --baseline",
      },
      workflow: workflowRunning("npm run audit:foo:check"),
      entries: {
        "audit:foo:check": { kind: "pr-gate" },
        "audit:foo:baseline": { kind: "unclassified" },
      },
    });

    const result = run(dir);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("audit:foo:baseline: passes a write flag and is unclassified");
  });

  it("accepts the writer once it is an operator that no workflow reaches", () => {
    const dir = makeTree({
      scripts: {
        "audit:foo:check": "node scripts/audit/foo.mjs --check",
        "audit:foo:baseline": "node scripts/audit/foo.mjs --baseline",
      },
      workflow: workflowRunning("npm run audit:foo:check"),
      entries: {
        "audit:foo:check": { kind: "pr-gate" },
        "audit:foo:baseline": {
          kind: "operator",
          reason: "rewrites the baseline audit:foo:check measures against",
        },
      },
    });

    expect(run(dir).status).toBe(0);
  });

  it("does not flag the checking sibling, which reads the same baseline it protects", () => {
    // The rule tests the command for a write flag, not the script for a baseline
    // path. `--check` reads that file; flagging it would condemn the gate itself.
    const dir = makeTree({
      scripts: {
        "audit:foo:check":
          "node scripts/audit/foo.mjs --check --input scripts/audit/foo.baseline.json",
      },
      workflow: workflowRunning("npm run audit:foo:check"),
      entries: { "audit:foo:check": { kind: "pr-gate" } },
    });

    const result = run(dir);

    expect(result.status).toBe(0);
    expect(result.output).not.toContain("audit:foo:check: passes a write flag");
  });
});

describe("ci gate registry: the real repository", () => {
  it("has no pr-gate that only a prefix vouches for", () => {
    // The end-to-end case. It fails on the unfixed checker only after the three
    // entries it exposed are reclassified; before that, the unfixed checker passes
    // here for the wrong reason, which is exactly what the scratch cases catch.
    const result = execFileSync(process.execPath, [realChecker], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    expect(result).toContain("CI gate registry passed");
  });
});

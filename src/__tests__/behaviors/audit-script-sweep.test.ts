import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * The sweep behind item 44 exists to turn "186 audit scripts have never been run"
 * into a number. What these cases protect is whether that number can be believed.
 *
 * Three ways it could lie, each of which was a live risk while it was written:
 *
 *   - **A writer counted as an audit.** The first version of this sweep decided
 *     what a script does by reading its entry file for `writeFileSync`. Of the
 *     first ten it cleared as read-only, four wrote fifteen tracked files under
 *     `reports/` — they write through an imported helper, so the entry file
 *     contains no write call. Only the tree can answer the question, so
 *     `changedPaths` decides `writesRepoFiles` on its own, regardless of exit
 *     code, name or source.
 *   - **An empty environment counted as a defect.** A script exiting non-zero
 *     because `DATABASE_URL` is unset has found nothing, and counting it inflates
 *     the failure count this sweep exists to establish.
 *   - **The same predicate swallowing a real failure.** Several swept scripts
 *     audit database projections and say the word "database" while failing for
 *     real reasons. A credential predicate loose enough to match those reports
 *     zero failures and is worse than none, so both directions are pinned here.
 *
 * Every case drives the real module in a subprocess, so a mutation of the
 * shipped file is a mutation of what runs.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const SWEEP_SCRIPT = path.join(repoRoot, "scripts/quality/audit-script-sweep.mjs");

type Classification = {
  outcome: string;
  reason: string | null;
  writesRepoFiles: boolean;
};

type Target = {
  script: string;
  runnable: boolean;
  refusal: string | null;
};

type Summary = Record<string, number>;

function callSweep<T>(fn: string, ...args: unknown[]): T {
  const source = `
    import { ${fn} } from ${JSON.stringify(SWEEP_SCRIPT)};
    const args = ${JSON.stringify(args)};
    process.stdout.write(JSON.stringify(${fn}(...args)));
  `;
  const out = execFileSync("node", ["--input-type=module", "-e", source], {
    encoding: "utf8",
    cwd: repoRoot,
  });
  return JSON.parse(out) as T;
}

const classify = (run: Record<string, unknown>) =>
  callSweep<Classification>("classifyRunOutcome", run);

describe("audit script sweep — what the number means", () => {
  it("calls a script that dirtied the tree a writer even when it exited 0", () => {
    const result = classify({
      exitCode: 0,
      changedPaths: ["reports/all-tenant-readiness-closure/summary.json"],
    });

    expect(result.outcome).toBe("passed");
    expect(result.writesRepoFiles).toBe(true);
  });

  it("calls a script that changed nothing a non-writer", () => {
    const result = classify({ exitCode: 0, changedPaths: [] });

    expect(result.outcome).toBe("passed");
    expect(result.writesRepoFiles).toBe(false);
  });

  it("separates an empty environment from a defect", () => {
    const result = classify({
      exitCode: 1,
      stderr: "Error: DATABASE_URL is not set",
      changedPaths: [],
    });

    expect(result.outcome).toBe("needs_environment");
  });

  it("treats a refused connection as an empty environment, not a defect", () => {
    const result = classify({
      exitCode: 1,
      stderr: "connect ECONNREFUSED 127.0.0.1:5432",
      changedPaths: [],
    });

    expect(result.outcome).toBe("needs_environment");
  });

  it("still calls a real failure a failure when its subject is a database", () => {
    const result = classify({
      exitCode: 1,
      stdout:
        "database projection audit: 3 tenants have no active pointer\nFAIL",
      changedPaths: [],
    });

    expect(result.outcome).toBe("failed");
    expect(result.reason).toContain("database projection audit");
  });

  it("recognises a credential by its shape, not by a hand-kept list", () => {
    const result = classify({
      exitCode: 1,
      stderr:
        "Error: Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for audit",
      changedPaths: [],
    });

    expect(result.outcome).toBe("needs_environment");
  });

  it("separates a script that was never told what to do from one that is broken", () => {
    const result = classify({
      exitCode: 1,
      stdout:
        "Usage: npm run audit:active-module-context-promotion -- --tenant <tenant-key>",
      changedPaths: [],
    });

    expect(result.outcome).toBe("needs_arguments");
  });

  it("does not call a failure report 'needs arguments' for describing usage", () => {
    const result = classify({
      exitCode: 1,
      stdout:
        "3 tenants failed the check. See the usage: block in the runbook for the rerun.",
      changedPaths: [],
    });

    expect(result.outcome).toBe("failed");
  });

  it("reports the line that says what went wrong, not the first PASS above it", () => {
    const result = classify({
      exitCode: 1,
      stdout: [
        "PASS src/lib/admin/setup-control.ts exists",
        "PASS src/lib/admin/registry.ts exists",
        "FAIL admin data control center: 2 subjects are gone",
      ].join("\n"),
      changedPaths: [],
    });

    expect(result.outcome).toBe("failed");
    expect(result.reason).toContain("2 subjects are gone");
  });

  it("reaches past an informational line to the one that states the failure", () => {
    const result = classify({
      exitCode: 1,
      stdout: [
        "PASS registry loaded",
        "checked 12 subjects across 4 tenants",
        "FAIL admin data control center: 2 subjects are gone",
      ].join("\n"),
      changedPaths: [],
    });

    expect(result.reason).toContain("2 subjects are gone");
  });

  it("never reports a timeout as passed", () => {
    const result = classify({
      exitCode: null,
      timedOut: true,
      changedPaths: [],
    });

    expect(result.outcome).toBe("timed_out");
  });

  it("reports a registry entry with no npm script instead of dropping it", () => {
    const targets = callSweep<Target[]>(
      "selectSweepTargets",
      { "audit:ghost": { kind: "unclassified" } },
      {},
    );

    expect(targets).toHaveLength(1);
    expect(targets[0].runnable).toBe(false);
    expect(targets[0].refusal).toMatch(/no package.json script/);
  });

  it("refuses to execute a swept script that reaches outside this checkout", () => {
    const targets = callSweep<Target[]>(
      "selectSweepTargets",
      { "audit:deploys": { kind: "unclassified" } },
      { "audit:deploys": "az containerapp update --name web" },
    );

    expect(targets[0].runnable).toBe(false);
    expect(targets[0].refusal).toMatch(/outside this checkout/);
  });

  it("sweeps only the kinds it was asked for, never a wired gate", () => {
    const entries = {
      "audit:unclassified-one": { kind: "unclassified" },
      "audit:wired-one": { kind: "pr-gate" },
    };
    const scripts = {
      "audit:unclassified-one": "node scripts/audit/one.mjs",
      "audit:wired-one": "node scripts/audit/two.mjs",
    };

    const targets = callSweep<Target[]>("selectSweepTargets", entries, scripts);

    expect(targets.map((target) => target.script)).toEqual([
      "audit:unclassified-one",
    ]);
  });

  it("counts a passing writer in both columns, because it is both", () => {
    const summary = callSweep<Summary>("summarizeSweep", [
      { outcome: "passed", writesRepoFiles: true },
      { outcome: "passed", writesRepoFiles: false },
      { outcome: "failed", writesRepoFiles: false },
      { outcome: "needs_environment", writesRepoFiles: false },
      { outcome: "needs_arguments", writesRepoFiles: false },
    ]);

    expect(summary).toMatchObject({
      total: 5,
      passed: 2,
      failed: 1,
      needsEnvironment: 1,
      needsArguments: 1,
      writesRepoFiles: 1,
      passedButWrites: 1,
    });
  });
});

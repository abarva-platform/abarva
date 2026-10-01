import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * D-512 — running the placeholder-corruption suite must not write a tracked file.
 *
 * `scripts/data-build/tenant-scenario-model/__tests__/run-placeholder-corruption-fix-tests.mjs`
 * is the suite for `fix-placeholder-corrupted-references.mjs`. Invoked the
 * documented way it called `fixTenant`, which writes its candidate CSVs to
 * `datasets/tenant-inputs/candidates/<tenant>/gate-2-1-phase-d-v1/` — tracked
 * files. Reproduced on `origin/main` `e714d3ecb8` from a clean worktree: exit 0,
 * and one tenant's committed `14_metrics_outcomes.csv` left with a -125/+27
 * diff for whoever staged broadly next.
 *
 * The 2026-09-21 change stopped Jest from executing that body on import; it did
 * not change what a direct run writes. This test drives the direct run.
 *
 * Two observations, because each misses a case the other catches:
 *   - sha256 of every file in the candidate directories: catches a rewrite of a
 *     file that was already dirty before the run, which `git status` cannot.
 *   - `git status --porcelain` over `datasets/` and `reports/`: catches a write
 *     to any other tracked or new path.
 * Whatever the run changes is put back in `afterAll`, so a red run does not
 * leave the damage it detected.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const RUNNER =
  "scripts/data-build/tenant-scenario-model/__tests__/run-placeholder-corruption-fix-tests.mjs";
const CANDIDATES_ROOT = "datasets/tenant-inputs/candidates";
const CANDIDATE_VERSION = "gate-2-1-phase-d-v1";

function candidateFiles(): string[] {
  const root = path.join(repoRoot, CANDIDATES_ROOT);
  const files: string[] = [];
  for (const tenant of readdirSync(root)) {
    const dir = path.join(root, tenant, CANDIDATE_VERSION);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) files.push(path.join(dir, name));
  }
  return files.sort();
}

function snapshot(files: string[]): Map<string, Buffer> {
  return new Map(files.map((f) => [f, readFileSync(f)]));
}

function digest(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function porcelain(): string {
  return execFileSync(
    "git",
    ["status", "--porcelain", "--untracked-files=all", "--", "datasets", "reports"],
    { cwd: repoRoot, encoding: "utf8" },
  );
}

describe("D-512: the placeholder-corruption suite writes nothing under the repository", () => {
  let before: Map<string, Buffer>;
  let statusBefore: string;
  let statusAfter: string;
  let run: ReturnType<typeof spawnSync>;

  beforeAll(() => {
    before = snapshot(candidateFiles());
    statusBefore = porcelain();
    run = spawnSync(process.execPath, [RUNNER], { cwd: repoRoot, encoding: "utf8" });
    statusAfter = porcelain();
  });

  afterAll(() => {
    if (!before) return;
    for (const [file, bytes] of before) {
      if (!existsSync(file) || !readFileSync(file).equals(bytes)) writeFileSync(file, bytes);
    }
  });

  it("the run exits 0 and actually ran its checks", () => {
    expect(run.status).toBe(0);
    const out = String(run.stdout);
    expect(out).toContain("All checks passed.");
    expect((out.match(/^\[PASS\] /gm) ?? []).length).toBeGreaterThanOrEqual(10);
  });

  it("there are committed candidate files to protect (the guard is not vacuous)", () => {
    expect(before.size).toBeGreaterThan(0);
  });

  it("every committed candidate file is byte-identical after the run", () => {
    const changed = [...before]
      .filter(([file, bytes]) => !existsSync(file) || digest(readFileSync(file)) !== digest(bytes))
      .map(([file]) => path.relative(repoRoot, file));
    expect(changed).toEqual([]);
  });

  it("git status over datasets/ and reports/ is unchanged by the run", () => {
    expect(statusAfter).toBe(statusBefore);
  });
});

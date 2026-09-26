import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Which Jest run owns the lifecycle of the transient probe files under one
 * repository root (item T-485).
 *
 * T-759 placed the removal of those files in `globalSetup` and
 * `globalTeardown`, on the invariant that **during a Jest run the set of files
 * under `src/` only grows**. Those two hooks are the only place a probe may be
 * removed, and no worker is alive when either runs — for ONE run.
 *
 * A second Jest run at the same root breaks it, and this repository starts one
 * from inside the first: `source-quarantine-ceiling-is-a-ratchet.test.ts` runs
 * `scripts/quality/check-source-integration-quarantine.mjs`, which spawns
 * `node_modules/.bin/jest` over eight Source integration suites with
 * `cwd: REPO` to prove each quarantine reason has not expired. That nested run
 * executes the same two hooks against the same tree, and its `globalTeardown`
 * deletes the outer run's probe file while the outer run's workers are still
 * reading. Measured on an unmodified worktree of `origin/main` `a4c9e4f69`,
 * three runs of `jest src/__tests__/behaviors`: 3, 8 and 10 failing suites of
 * 136, sets largely disjoint, every failure the same path —
 * `src/lib/agent/__tests__/t743-coverage-probe.generated.test.ts` — reached
 * either as an unhandled `ENOENT` inside the census or, in the one suite that
 * parses the census's stdout, as `SyntaxError: Expected property name or '}' in
 * JSON at position 4`, which is that crash's printed error object and not a
 * half-written file.
 *
 * So ownership is explicit rather than assumed. The first run to arrive claims
 * it and is the only one that clears or removes anything; a run that finds a
 * live claim by another process does neither. Nothing is lost by the nested run
 * skipping both: the owner's teardown still removes the file after every one of
 * its own workers has exited.
 *
 * The claim lives in the OS temp directory, keyed by a digest of the root, for
 * two reasons: it must not sit in any tree the coverage census walks (a marker
 * under `src/` or `docs/` would be the same class of defect one layer down),
 * and two worktrees of this repository are two roots and must not share one.
 *
 * WHY NOT AN ENVIRONMENT VARIABLE. A marker in `process.env` set by
 * `globalSetup` reaches the workers, but the chain that matters here is
 * worker → `execFileSync` of a checker → `spawnSync` of Jest, and any link in
 * it may scrub or replace the environment. A claim on disk survives a scrubbed
 * environment and also covers the case the environment cannot see at all: two
 * independent Jest runs started against one checkout, which is what happens
 * when two agents share a worktree.
 */

/** What a claim file holds. `startedAt` is what bounds a stale one. */
export type TransientProbeClaim = {
  pid: number;
  startedAt: string;
  root: string;
};

/**
 * A claim older than this is treated as abandoned even if its pid answers,
 * because pids are recycled and a recycled one would otherwise make a fresh
 * run believe it is nested — and a run that believes it is nested never clears
 * a leaked probe, which is a failure that persists rather than one that passes.
 * No Jest run in this repository approaches an hour; six is a wide margin.
 */
export const CLAIM_STALE_AFTER_MS = 6 * 60 * 60 * 1000;

/**
 * Where the claim for `root` lives. Exported so the control suite can assert
 * the path is outside the repository rather than infer it.
 */
export function claimPathFor(root: string): string {
  const digest = createHash("sha256").update(path.resolve(root)).digest("hex").slice(0, 16);
  return path.join(tmpdir(), `abarva-transient-probe-owner-${digest}.json`);
}

/** Whether a process is still running. Injectable so a test need not fork. */
export type Liveness = (pid: number) => boolean;

export const processIsAlive: Liveness = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists and belongs to someone else.
    return (error as NodeJS.ErrnoException)?.code === "EPERM";
  }
};

function readClaim(file: string): TransientProbeClaim | null {
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<TransientProbeClaim>;
    if (typeof parsed?.pid !== "number" || typeof parsed?.startedAt !== "string") return null;
    return { pid: parsed.pid, startedAt: parsed.startedAt, root: parsed.root ?? "" };
  } catch {
    // An unreadable or half-written claim is no claim. Failing open here is
    // safe in the direction that matters: the run takes ownership and clears,
    // which is the pre-T-485 behaviour.
    return null;
  }
}

export type ClaimOptions = {
  pid?: number;
  now?: () => Date;
  isAlive?: Liveness;
};

export type ClaimOutcome =
  | { owner: true; reason: "claimed" | "took-over-stale" | "took-over-dead" }
  | { owner: false; reason: "nested"; heldBy: number };

/**
 * Claim probe ownership for `root`, or report that another live run holds it.
 *
 * `owner: true` means the caller may clear leaked probes now and must remove
 * them in its teardown. `owner: false` means the caller is nested inside
 * someone else's run and must touch nothing.
 */
export function claimTransientProbeOwnership(
  root: string,
  options: ClaimOptions = {},
): ClaimOutcome {
  const pid = options.pid ?? process.pid;
  const now = options.now ?? (() => new Date());
  const isAlive = options.isAlive ?? processIsAlive;
  const file = claimPathFor(root);

  const existing = readClaim(file);
  if (existing && existing.pid !== pid) {
    const age = now().getTime() - new Date(existing.startedAt).getTime();
    const stale = !Number.isFinite(age) || age >= CLAIM_STALE_AFTER_MS;
    if (!stale && isAlive(existing.pid)) {
      return { owner: false, reason: "nested", heldBy: existing.pid };
    }
    writeClaim(file, pid, now, root);
    return { owner: true, reason: stale ? "took-over-stale" : "took-over-dead" };
  }

  writeClaim(file, pid, now, root);
  return { owner: true, reason: "claimed" };
}

function writeClaim(file: string, pid: number, now: () => Date, root: string): void {
  const claim: TransientProbeClaim = {
    pid,
    startedAt: now().toISOString(),
    root: path.resolve(root),
  };
  writeFileSync(file, `${JSON.stringify(claim, null, 2)}\n`, "utf8");
}

/**
 * Whether the caller currently holds the claim for `root`. A teardown asks
 * this rather than remembering the setup's answer: the two hooks are separate
 * modules loaded through Jest's transform, and a remembered flag would be the
 * kind of state a nested run could read as its own.
 */
export function holdsTransientProbeOwnership(root: string, options: ClaimOptions = {}): boolean {
  const pid = options.pid ?? process.pid;
  return readClaim(claimPathFor(root))?.pid === pid;
}

/**
 * Give up the claim for `root`, but only the caller's own. Returns whether a
 * claim was released, so a teardown can report an unexpected state instead of
 * silently doing nothing.
 */
export function releaseTransientProbeOwnership(
  root: string,
  options: ClaimOptions = {},
): boolean {
  const pid = options.pid ?? process.pid;
  const file = claimPathFor(root);
  if (readClaim(file)?.pid !== pid) return false;
  rmSync(file, { force: true });
  return true;
}

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  CLAIM_STALE_AFTER_MS,
  claimPathFor,
  claimTransientProbeOwnership,
  holdsTransientProbeOwnership,
  releaseTransientProbeOwnership,
} from "../../testing/transient-probe-ownership";
import {
  TRANSIENT_PROBE_FILES,
  removeTransientProbeFiles,
} from "../../testing/transient-probe-files";

/**
 * Item T-485. `npm run test:behaviors` was non-deterministically red on an
 * unmodified tree, and the failures read as a defect in whatever change was
 * being baselined.
 *
 * WHAT THE FILING GOT WRONG, because the fix follows from the correction rather
 * than from the filing. It named two mechanisms, both concurrency: several
 * `*-ci-coverage` suites reading "the shared JSON output half-written", and a
 * sibling suite creating and deleting a probe file under
 * `src/lib/agent/__tests__` while the census walks the tree. Measured here on an
 * unmodified worktree of `origin/main` `a4c9e4f69`, three runs of
 * `jest src/__tests__/behaviors` reported 3, 8 and 10 failing suites of 136 with
 * largely disjoint sets — and every failure in all three, including the
 * `SyntaxError: Expected property name or '}' in JSON at position 4`, resolved
 * to ONE path. That SyntaxError is `test-ci-coverage-census.test.ts` parsing the
 * stdout of a census that had already crashed: position 4, line 2 column 3 is
 * the `e` of `errno` in Node's printed error object, not a truncated file. One
 * mechanism, not two, and the remedies the acceptance prescribed — per-suite
 * census output paths, or moving the probe outside the tree the census walks —
 * would have fixed neither, the second by destroying what `T-743` asserts.
 *
 * AND `T-759` DID NOT CLOSE IT. It removed the deletion from inside the suite
 * and placed it in `globalSetup`/`globalTeardown`, where no worker is alive to
 * observe it. That holds for one run. This repository starts a second run
 * inside the first: `source-quarantine-ceiling-is-a-ratchet.test.ts` runs
 * `scripts/quality/check-source-integration-quarantine.mjs`, which spawns
 * `node_modules/.bin/jest` over eight Source integration suites with
 * `cwd: REPO` to prove no quarantine reason has expired. That nested run
 * executes both hooks against the live tree — its `globalSetup` 1.5s into the
 * outer run and its `globalTeardown` ~20s later, both timestamped from a traced
 * run — and the outer run's probe went with it.
 *
 * So the invariant T-759 wrote down needs an owner, and that is what these
 * cases hold. EVERY CASE RUNS OVER A SCRATCH ROOT, for T-759's reason: a case
 * that created and removed a real file under `src/` to prove this would be the
 * race it is testing for.
 */

const PROBE = TRANSIENT_PROBE_FILES[0];
const repoRoot = path.resolve(__dirname, "../../..");
const claimedRoots: string[] = [];

function scratchRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), "t485-probe-"));
  claimedRoots.push(root);
  return root;
}

function seedProbe(root: string): string {
  const absolute = path.join(root, PROBE);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, "// seeded by t485\n", "utf8");
  return absolute;
}

/** A pid that is certainly not this process and certainly not running. */
const DEAD_PID = 2 ** 30;

afterAll(() => {
  for (const root of claimedRoots) {
    rmSync(claimPathFor(root), { force: true });
    rmSync(root, { recursive: true, force: true });
  }
});

describe("a nested Jest run does not remove the outer run's probe files", () => {
  it("keeps the claim outside the repository, where the census cannot walk it", () => {
    // A marker under `src/` or `docs/` would be enumerated by the very census
    // whose readers this protects, which is the same defect one layer down.
    const claim = claimPathFor(repoRoot);
    expect(path.relative(repoRoot, claim).startsWith("..")).toBe(true);
    expect(claim.startsWith(path.resolve(tmpdir()))).toBe(true);
  });

  it("keys the claim by root, so two worktrees of this repository do not share one", () => {
    const a = scratchRoot();
    const b = scratchRoot();
    expect(claimPathFor(a)).not.toEqual(claimPathFor(b));
    // The same root written two ways is one claim, or a nested run whose cwd
    // carries a trailing separator would read itself as the owner.
    expect(claimPathFor(a)).toEqual(claimPathFor(`${a}${path.sep}`));
  });

  it("refuses ownership to a second live run and grants it to the first", () => {
    const root = scratchRoot();
    const first = claimTransientProbeOwnership(root, { pid: 4001, isAlive: () => true });
    const second = claimTransientProbeOwnership(root, { pid: 4002, isAlive: () => true });

    expect(first).toEqual({ owner: true, reason: "claimed" });
    expect(second).toEqual({ owner: false, reason: "nested", heldBy: 4001 });
    expect(holdsTransientProbeOwnership(root, { pid: 4001 })).toBe(true);
    expect(holdsTransientProbeOwnership(root, { pid: 4002 })).toBe(false);
  });

  it("releases only the caller's own claim", () => {
    const root = scratchRoot();
    claimTransientProbeOwnership(root, { pid: 4001, isAlive: () => true });

    expect(releaseTransientProbeOwnership(root, { pid: 4002 })).toBe(false);
    expect(holdsTransientProbeOwnership(root, { pid: 4001 })).toBe(true);
    expect(releaseTransientProbeOwnership(root, { pid: 4001 })).toBe(true);
    expect(existsSync(claimPathFor(root))).toBe(false);
  });

  it("takes ownership from a claim whose process is gone, so a killed run cannot disable clearing forever", () => {
    // The direction that matters: a run that wrongly believes it is nested
    // never clears a leaked probe, and that failure persists across every
    // later run rather than passing.
    const root = scratchRoot();
    claimTransientProbeOwnership(root, { pid: DEAD_PID, isAlive: () => true });

    expect(claimTransientProbeOwnership(root, { pid: 4002, isAlive: () => false })).toEqual({
      owner: true,
      reason: "took-over-dead",
    });
    expect(holdsTransientProbeOwnership(root, { pid: 4002 })).toBe(true);
  });

  it("takes ownership from a claim old enough that its pid may have been recycled", () => {
    const root = scratchRoot();
    const long = new Date(Date.now() - CLAIM_STALE_AFTER_MS - 1_000);
    claimTransientProbeOwnership(root, { pid: 4001, now: () => long, isAlive: () => true });

    expect(claimTransientProbeOwnership(root, { pid: 4002, isAlive: () => true })).toEqual({
      owner: true,
      reason: "took-over-stale",
    });
  });

  it("treats an unreadable claim as no claim rather than as a live one", () => {
    const root = scratchRoot();
    writeFileSync(claimPathFor(root), "{ half-writ", "utf8");

    expect(claimTransientProbeOwnership(root, { pid: 4002, isAlive: () => true })).toEqual({
      owner: true,
      reason: "claimed",
    });
  });

  /**
   * The destination assertion, and the only one in this file that runs the real
   * hooks in a second OS process. The unit cases above pass an injected pid,
   * which cannot show that a genuinely separate process reads the same claim
   * off disk — and "a worker spawns a checker which spawns Jest" is exactly a
   * chain where an in-process flag or an environment variable would not
   * survive.
   *
   * This process plays the owner: it claims the scratch root and stays alive
   * for the duration, as an outer Jest run does. The spawned process plays the
   * nested run and executes `jest-global-setup` and `jest-global-teardown`
   * verbatim.
   */
  it("survives a real second process running both hooks against the same root", () => {
    const root = scratchRoot();
    expect(claimTransientProbeOwnership(root).owner).toBe(true);
    const probe = seedProbe(root);

    const script = path.join(root, "nested-run.mts");
    writeFileSync(
      script,
      [
        // The hooks are TypeScript modules Jest loads through its own
        // transform; from a standalone process the default export may arrive
        // wrapped once or twice by the CJS/ESM interop, so unwrap rather than
        // assume a shape. The interop is not what this case is about.
        "const callable = (module) =>",
        '  typeof module === "function"',
        "    ? module",
        '    : typeof module?.default === "function"',
        "      ? module.default",
        "      : module?.default?.default;",
        `const setup = callable(await import(${JSON.stringify(
          path.join(repoRoot, "src/testing/jest-global-setup.ts"),
        )}));`,
        `const teardown = callable(await import(${JSON.stringify(
          path.join(repoRoot, "src/testing/jest-global-teardown.ts"),
        )}));`,
        'if (typeof setup !== "function" || typeof teardown !== "function") {',
        '  throw new Error("could not load the real hooks; this case would prove nothing");',
        "}",
        "await setup();",
        "await teardown();",
        "",
      ].join("\n"),
      "utf8",
    );

    const output = execFileSync("npx", ["tsx", script], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, ABARVA_TRANSIENT_PROBE_ROOT: root },
      stdio: ["ignore", "pipe", "pipe"],
    });

    // The destination first: the file is still there for the outer run's
    // readers. Reverting either hook to its pre-T-485 body fails THIS line,
    // which is the property; the message below is corroboration and would be
    // the wrong thing to fail on.
    expect(existsSync(probe)).toBe(true);
    expect(holdsTransientProbeOwnership(root)).toBe(true);
    expect(output).toContain("[t485] nested Jest run");

    // And the owner still cleans up, which is the property T-759 added. Without
    // this the case would pass on a hook that never removes anything.
    removeTransientProbeFiles(root);
    expect(releaseTransientProbeOwnership(root)).toBe(true);
    expect(existsSync(probe)).toBe(false);
  });

  it("would fail if the nested run removed probe files unconditionally", () => {
    // The negative control for the case above. It reintroduces the defect by
    // calling the remover with no ownership check — which is what both hooks
    // did before this item — and requires the probe to disappear. If this went
    // green while the case above also went green, the assertion up there would
    // be about a file nothing was ever going to touch.
    const root = scratchRoot();
    expect(claimTransientProbeOwnership(root, { pid: 4001, isAlive: () => true }).owner).toBe(true);
    const probe = seedProbe(root);

    expect(removeTransientProbeFiles(root)).toEqual([PROBE]);
    expect(existsSync(probe)).toBe(false);
  });
});

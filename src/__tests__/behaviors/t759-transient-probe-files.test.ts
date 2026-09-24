import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  TRANSIENT_PROBE_FILES,
  removeTransientProbeFiles,
  writeTransientProbeFile,
} from "../../testing/transient-probe-files";

/**
 * Item T-759. `src/__tests__/behaviors` was CI-gated and non-deterministically
 * red because one suite added a file under `src/` mid-run and deleted it in a
 * `finally`, while thirty-one suites in the same directory enumerate the test
 * files under `src/` and then read each one. Measured at `origin/main`
 * `15e0e9994` with a cold Jest cache, three runs of three: 4, 3 and 4 suites
 * failing of 114, every failure an unhandled ENOENT on that one path.
 *
 * The end-to-end proof of the repair is repeated cold-cache execution of the
 * whole directory, which is what the acceptance asks for and is recorded in the
 * release record. This suite is the deterministic half: it holds the mechanism
 * that makes those runs green, so the invariant cannot be undone silently by a
 * later edit to the config or the registry.
 *
 * EVERY CASE HERE RUNS OVER A SCRATCH DIRECTORY, on purpose. A case that
 * created and then removed a real file under `src/` to prove this would BE the
 * race it is testing for — it would reintroduce the defect into the very run
 * that is meant to prove the defect is gone. So the real functions are called
 * with an injected root. The one thing a scratch root cannot answer — does the
 * probe suite still delete its own file — is asserted by that suite itself,
 * against the real path, in `t743-agent-tests-directory-ci.test.ts`.
 */

function scratchRoot(): string {
  return mkdtempSync(path.join(tmpdir(), "t759-probe-"));
}

function seed(root: string, relative: string): string {
  const absolute = path.join(root, relative);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, "// seeded by t759\n", "utf8");
  return absolute;
}

describe("transient probe files are removed outside the run, not inside it", () => {
  it("registers at least one probe file, so every case below is about something", () => {
    // Non-vacuous first. An emptied registry makes "removed exactly the
    // registered files" trivially true and the teardown a no-op, which is
    // indistinguishable from a working mechanism if nothing asserts this.
    expect(TRANSIENT_PROBE_FILES.length).toBeGreaterThan(0);
    expect(TRANSIENT_PROBE_FILES).toContain(
      "src/lib/agent/__tests__/t743-coverage-probe.generated.test.ts",
    );
  });

  it("removes every registered probe file under the root it is given", () => {
    const root = scratchRoot();
    try {
      const seeded = TRANSIENT_PROBE_FILES.map((relative) => seed(root, relative));
      expect(seeded.every((file) => existsSync(file))).toBe(true);

      expect(removeTransientProbeFiles(root).sort()).toEqual(
        [...TRANSIENT_PROBE_FILES].sort(),
      );
      expect(seeded.filter((file) => existsSync(file))).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("removes nothing it was not told about", () => {
    // The teardown runs on every Jest invocation in this repository. A version
    // that swept the directory rather than the registry would delete real
    // suites sitting beside the probe.
    const root = scratchRoot();
    try {
      const probe = seed(root, TRANSIENT_PROBE_FILES[0]);
      const neighbour = seed(
        root,
        path.posix.join(path.posix.dirname(TRANSIENT_PROBE_FILES[0]), "neighbour.test.ts"),
      );

      removeTransientProbeFiles(root);

      expect({ probe: existsSync(probe), neighbour: existsSync(neighbour) }).toEqual({
        probe: false,
        neighbour: true,
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports nothing removed when there is nothing to remove, rather than failing", () => {
    // globalSetup calls this on a clean tree on every run; a throw here would
    // fail every Jest invocation in the repository.
    const root = scratchRoot();
    try {
      expect(removeTransientProbeFiles(root)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("refuses to write a path nothing would clean up", () => {
    // The registry is what the teardown reads. A file written outside it is
    // left in the working tree after the run.
    const root = scratchRoot();
    try {
      expect(() =>
        writeTransientProbeFile("src/lib/agent/__tests__/unregistered.generated.test.ts", "", root),
      ).toThrow(/not registered in TRANSIENT_PROBE_FILES/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("is wired into the Jest config as both globalSetup and globalTeardown, and both execute", async () => {
    // The wiring half, executed rather than read. Dropping either key from
    // `jest.config.ts` leaves the registry and its functions correct and the
    // run racy again, which is exactly the shape of gate this backlog exists
    // to remove: the control has to run.
    const jestConfig = (await import("../../../jest.config")).default;
    const resolved = (await jestConfig()) as {
      globalSetup?: string;
      globalTeardown?: string;
    };

    const repoRoot = path.resolve(__dirname, "../../..");
    const hooks = {
      globalSetup: resolved.globalSetup,
      globalTeardown: resolved.globalTeardown,
    };
    expect(Object.values(hooks).filter(Boolean)).toHaveLength(2);

    for (const [name, hookPath] of Object.entries(hooks)) {
      const absolute = String(hookPath).replace("<rootDir>", repoRoot);
      expect(existsSync(absolute)).toBe(true);

      const root = scratchRoot();
      const previous = process.env.ABARVA_TRANSIENT_PROBE_ROOT;
      try {
        const probe = seed(root, TRANSIENT_PROBE_FILES[0]);
        process.env.ABARVA_TRANSIENT_PROBE_ROOT = root;

        const hook = (await import(absolute)).default as () => void | Promise<void>;
        await hook();

        expect({ hook: name, probeStillThere: existsSync(probe) }).toEqual({
          hook: name,
          probeStillThere: false,
        });
      } finally {
        if (previous === undefined) delete process.env.ABARVA_TRANSIENT_PROBE_ROOT;
        else process.env.ABARVA_TRANSIENT_PROBE_ROOT = previous;
        rmSync(root, { recursive: true, force: true });
      }
    }
  });
});

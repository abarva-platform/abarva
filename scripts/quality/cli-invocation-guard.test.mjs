#!/usr/bin/env node
/**
 * Every control gate in this directory and in `scripts/release-control/` must
 * behave the same whether it is invoked through its real path or through a
 * symlink (item T-741).
 *
 * T-723 found the shape in `scripts/exec/`: a guard that compares
 * `import.meta.url` against `process.argv[1]` as typed answers "imported"
 * whenever the script is reached through a symlinked directory, so the CLI
 * body never runs, nothing is printed, and the process exits 0. It shipped
 * `scripts/exec/cli-entry.mjs` and audited only `scripts/exec/`. The same
 * broken shape was still here, in gates whose whole job is to exit non-zero.
 *
 * Measured on `d9d1fb9ee` before the repair, real path -> symlinked path:
 *
 *   check-intelligence-library-quarantine.mjs   61 bytes, exit 0 -> 0 bytes, exit 0
 *   check-source-ava-library-quarantine.mjs     58 bytes, exit 0 -> 0 bytes, exit 0
 *   check-integration-root-quarantine.mjs      192 bytes, exit 0 -> 0 bytes, exit 0
 *   check-tenant-narrative-term-drift.mjs     1034 bytes, exit 1 -> 0 bytes, exit 0
 *
 * The last one is the one to keep in view: the same gate, the same inputs, and
 * a verdict that flips from fail to pass because of how the path was spelled.
 *
 * This suite proves the CLI RUNS, not that a predicate returns true. A guard
 * inverted so that it always answers "imported" passes every import-shaped
 * assertion anyone can write about it and leaves the CLI dead, so the only
 * assertion worth making is made against the process: same exit code, same
 * bytes, through both paths.
 *
 * The symlink is created by this suite rather than borrowed from the platform.
 * `/tmp` is a symlink on macOS and is not one on a Linux runner, so a suite
 * that relied on it would quietly stop testing anything in CI.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = fs.realpathSync(path.resolve(here, "../.."));

/** The directories whose CLIs are gates: they are expected to fail builds. */
const SWEPT_DIRS = ["scripts/quality", "scripts/release-control"];

/**
 * A file is a CLI with an invocation guard if it decides whether to run: it
 * either reaches for `process.argv[1]` itself or takes the shared guard. Both
 * spellings have to be discovered, because the repair changes one into the
 * other — a marker naming only the broken spelling would stop sweeping each
 * gate at the moment it was fixed, which is the moment the sweep starts being
 * the only thing keeping it fixed.
 */
const GUARD_MARKERS = ["process.argv[1]", "isDirectInvocation"];

/**
 * Exempt from the process sweep, and the exemption is not a free pass: the
 * case below requires every exempt file to already take the shared guard from
 * `scripts/exec/cli-entry.mjs`, so a broken guard cannot be exempted. Only the
 * cost of running it twice buys an entry here.
 */
const EXEMPT_FROM_SWEEP = new Map([
  ["scripts/quality/typecheck.mjs", "runs tsc over the repository; ~45s per invocation"],
]);

function listGuardedClis() {
  const found = [];
  for (const dir of SWEPT_DIRS) {
    const abs = path.join(repo, dir);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs).sort()) {
      if (!name.endsWith(".mjs") || name.endsWith(".test.mjs")) continue;
      const rel = `${dir}/${name}`;
      const source = fs.readFileSync(path.join(abs, name), "utf8");
      if (!GUARD_MARKERS.some((marker) => source.includes(marker))) continue;
      found.push(rel);
    }
  }
  return found;
}

function run(scriptPath) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: repo,
    encoding: "utf8",
    env: process.env,
    timeout: 300_000,
  });
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

/** A run that says nothing and exits 0 cannot tell a working CLI from a dead one. */
function isDistinguishable({ status, output }) {
  return output.trim().length > 0 || status !== 0;
}

const guarded = listGuardedClis();

test("the sweep found the gates it is supposed to sweep", () => {
  // The seven measured broken on `d9d1fb9ee`, plus the two that were already
  // right and serve as the negative control: if the sweep could not fail, these
  // two would pass it just as silently as the seven did.
  for (const rel of [
    "scripts/quality/check-integration-ci-visibility.mjs",
    "scripts/quality/check-integration-root-quarantine.mjs",
    "scripts/quality/check-intelligence-integration-quarantine.mjs",
    "scripts/quality/check-intelligence-library-quarantine.mjs",
    "scripts/quality/check-source-ava-library-quarantine.mjs",
    "scripts/quality/test-ci-coverage-census.mjs",
    "scripts/release-control/check-tenant-narrative-term-drift.mjs",
    "scripts/quality/check-named-suite-requiredness.mjs",
    "scripts/quality/enum-reachability.mjs",
  ]) {
    assert.ok(
      guarded.includes(rel),
      `${rel} is no longer swept, so nothing proves it still runs through a symlink`,
    );
  }
  assert.ok(
    guarded.length >= 9,
    `expected the gate directories to hold guarded CLIs, found ${guarded.length}: ${guarded.join(", ")}`,
  );
});

test("an exemption from the sweep already takes the shared guard", () => {
  for (const [rel, reason] of EXEMPT_FROM_SWEEP) {
    const abs = path.join(repo, rel);
    assert.ok(fs.existsSync(abs), `exempt file no longer exists: ${rel}`);
    assert.match(
      fs.readFileSync(abs, "utf8"),
      /isDirectInvocation/,
      `${rel} is exempt from the sweep (${reason}) but does not use the shared guard, `
        + "so nothing proves it runs through a symlink",
    );
  }
});

test("every guarded gate behaves identically through a symlinked repository root", (t) => {
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "t741-"));
  const link = path.join(tmp, "repo");
  fs.symlinkSync(repo, link, "dir");
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  assert.notEqual(fs.realpathSync(link), link, "the fixture symlink did not resolve elsewhere");

  const failures = [];
  for (const rel of guarded) {
    if (EXEMPT_FROM_SWEEP.has(rel)) continue;
    const real = run(path.join(repo, rel));
    const viaLink = run(path.join(link, rel));
    // The gate may name the path it was invoked with; that difference is not
    // the defect. Everything else in the output must match byte for byte.
    const normalised = viaLink.output.split(link).join(repo);

    if (!isDistinguishable(real)) {
      failures.push(
        `${rel}: says nothing and exits 0 on its real path, so this sweep cannot tell `
          + "a gate that ran from one that declined",
      );
      continue;
    }
    if (real.status !== viaLink.status || real.output !== normalised) {
      failures.push(
        `${rel}: real path exit=${real.status} bytes=${real.output.length}; `
          + `through a symlink exit=${viaLink.status} bytes=${viaLink.output.length}`,
      );
    }
  }

  assert.deepEqual(failures, [], `\n${failures.join("\n")}\n`);
});

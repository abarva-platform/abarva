#!/usr/bin/env node
/**
 * What this toolchain needs in order to run, declared once (item T-726).
 *
 * Four behavioural suites in this directory build an isolated fixture by
 * copying a **hand-maintained list** of files into a temp directory and running
 * the real executables there. Nothing stated which files the toolchain needs,
 * so each suite kept its own copy of that answer and found out it was wrong by
 * crashing — twice in one session:
 *
 *   - T-720: `build-execution-queue.test.mjs` failed to collect when the
 *     generator began importing `queue-provenance.mjs`.
 *   - T-723: it crashed again, and `queue-provenance.test.mjs` went 30/0 to
 *     27/3, when `queue-provenance.mjs` began importing `cli-entry.mjs`.
 *
 * Both were loud, and loud is cheap. This module exists because the same list
 * decides what a fixture's executables can *see*, and the quiet version was
 * already on `main` when T-726 was filed: `cli-entry.test.mjs` copies three
 * files, and `queue-provenance.mjs` reaches `build-execution-queue.mjs`
 * through a sibling **path** rather than an import. Run over a queue file that
 * exists, the repo directory returns verdict `unstamped` and that three-file
 * copy returns `generator_missing` — a different verdict from the same input,
 * in a suite that stayed green because its cases drive only the branch where
 * both collapse to `absent`.
 *
 * **An import closure is the obvious answer and the wrong one.** A missing
 * static import throws on load; that failure has never cost anything here. The
 * dependencies that are silent are the ones that are not imports at all:
 *
 *   queue-provenance.mjs   -> build-execution-queue.mjs   (DEFAULT_GENERATOR)
 *   append-claim.mjs       -> register-time-authority.mjs (DEFAULT_GATE)
 *                          -> build-execution-queue.mjs   (DEFAULT_QUEUE_GENERATOR)
 *   build-source-board.mjs -> source-stage-map.json       (read at run time)
 *
 * A literal scan that tried to catch those was written first and thrown away:
 * every module in this directory names most of the others in prose, so its
 * closure degenerated to the whole directory anyway — while still being a
 * parser that can go stale. So the answer is the honest form of the same
 * result: **a fixture gets the directory, not a list.** Eight small files,
 * no list to maintain, and a module added tomorrow is picked up by every
 * fixture without anyone remembering to.
 *
 * Suites are never copied: a fixture runs executables, not tests.
 *
 * A case that needs a file *absent* — to reproduce this very defect — passes
 * `exclude`, so the omission is declared in the case rather than implied by a
 * list being short.
 *
 * Run:  node scripts/exec/toolchain-manifest.mjs [--dir <directory>] [--json]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isDirectInvocation } from "./cli-entry.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** A suite is never a runtime dependency of an executable. */
export function isSuiteFile(name) {
  return name.endsWith(".test.mjs");
}

/**
 * Every file this toolchain needs at run time: each non-suite file beside this
 * module. Read from disk on every call rather than frozen into a constant —
 * a constant is a list, and a list is what went stale.
 */
export function toolchainFiles(dir = HERE) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !isSuiteFile(entry.name))
    .map((entry) => entry.name)
    .sort();
}

/**
 * Copy the toolchain into `destDir` and return the names copied.
 *
 * Callers that want a drifted or superseded variant overwrite the file
 * afterwards; this guarantees only that nothing an executable reaches for is
 * missing by accident.
 */
export function copyToolchainInto(destDir, { dir = HERE, exclude = [] } = {}) {
  const withheld = new Set(exclude);
  for (const name of withheld) {
    if (!fs.existsSync(path.join(dir, name))) {
      throw new Error(
        `toolchain manifest: cannot exclude "${name}" — no such file in ${dir}. ` +
          "An exclusion that names nothing withholds nothing, and would read as " +
          "a case testing an absence it is not testing.",
      );
    }
  }

  fs.mkdirSync(destDir, { recursive: true });
  const copied = [];
  for (const name of toolchainFiles(dir)) {
    if (withheld.has(name)) continue;
    fs.copyFileSync(path.join(dir, name), path.join(destDir, name));
    copied.push(name);
  }
  return copied;
}

/**
 * Which toolchain files `fixtureDir` is missing. The assertion a suite makes
 * about a fixture it did not build itself, and the one that would have caught
 * the three-file copy on `main`.
 */
export function missingToolchainFiles(fixtureDir, dir = HERE) {
  return toolchainFiles(dir).filter(
    (name) => !fs.existsSync(path.join(fixtureDir, name)),
  );
}

/* ------------------------------------------------------------------------- */
/* CLI                                                                        */
/* ------------------------------------------------------------------------- */

const USAGE =
  "usage: toolchain-manifest.mjs [--dir <directory>] [--json]\n" +
  "prints the files a fixture must contain for this toolchain to run.";

function cli(argv) {
  if (argv.includes("--help")) {
    console.log(USAGE);
    process.exit(0);
  }

  const dirAt = argv.indexOf("--dir");
  const dir = dirAt >= 0 ? path.resolve(argv[dirAt + 1]) : HERE;
  const files = toolchainFiles(dir);

  if (argv.includes("--json")) {
    console.log(JSON.stringify({ dir, files }, null, 2));
  } else {
    for (const name of files) console.log(name);
  }
  process.exit(0);
}

// Resolved through the shared guard (item T-723), not a filename suffix and not
// a composed-string comparison.
if (isDirectInvocation(import.meta.url)) {
  cli(process.argv.slice(2));
}

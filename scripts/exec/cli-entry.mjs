#!/usr/bin/env node
/**
 * Was this module run, or imported? (item T-723)
 *
 * Every script in this directory is a module with a CLI attached, so each one
 * needs to answer that question. Four of them answered it four different ways
 * and only one was right:
 *
 *   append-claim.mjs           fs.realpathSync both sides          CORRECT
 *   queue-provenance.mjs       path.resolve both sides             BROKEN
 *   worktree-retention.mjs     import.meta.url === `file://${a1}`  BROKEN
 *   register-time-authority.mjs  argv[1].endsWith("<name>.mjs")    loose
 *
 * `path.resolve` normalises a path; it does not resolve symlinks. On macOS
 * `/tmp` is a symlink to `/private/tmp`, and `import.meta.url` is ALWAYS the
 * realpath while `process.argv[1]` is the path as typed. So both broken guards
 * silently answer "imported" whenever the script is invoked through `/tmp` —
 * and the operator task file instructs agents to work in
 * `/tmp/exec-<item>-<timestamp>`, which makes the broken path the likely one.
 *
 * Measured on 2026-09-23, both through a `/tmp` path:
 *
 *   node <dir>/queue-provenance.mjs --register <register>
 *     -> no output, exit 0
 *   node <dir>/worktree-retention.mjs --check --free-floor-gib 9999
 *     -> no output, exit 0, when its contract is to exit 1 below the floor
 *
 * The second is the one that matters: that is the disk-safety control shipped
 * at 06:25Z the same day because a run had died `ENOSPC`. A control that exits
 * 0 having done nothing is the shape this directory exists against, reached
 * from the quietest possible direction.
 *
 * The composed-string guard loses a second case for a second reason:
 * `import.meta.url` percent-encodes a space, `file://${argv[1]}` does not. So
 * this compares resolved FILES, never composed strings.
 *
 * The unknown case answers "imported", and that inversion is deliberate. Every
 * other control in this directory fails closed, because refusing costs one
 * rerun. This is not a gate — it decides whether to execute a CLI, and an
 * unknown case that answered "run" would make `import` execute it, breaking
 * every importer. `append-claim.mjs` imports `queue-provenance.mjs` on every
 * single claim.
 */

import fs from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * True when `argv1` names the same file on disk as `importMetaUrl`.
 *
 * Both sides go through `fs.realpathSync`, so a symlinked directory, a
 * symlinked file, a relative path and a path needing URL encoding all compare
 * correctly. Either side failing to resolve — it does not exist, or it cannot
 * be read — answers false, never true.
 */
export function isDirectInvocation(importMetaUrl, argv1 = process.argv[1]) {
  if (!argv1) return false;
  try {
    return fs.realpathSync(argv1) === fs.realpathSync(fileURLToPath(importMetaUrl));
  } catch {
    return false;
  }
}

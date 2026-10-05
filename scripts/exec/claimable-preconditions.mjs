#!/usr/bin/env node
/**
 * Does a claimable row name a file that is not in the checkout?
 *
 * The queue decides claimability from the backlog's own text and from the
 * register. Neither can say whether the row is BUILDABLE. A row that describes
 * a scanner it says "already reads and reports" two fields is offered as
 * ordinary work even when that scanner exists nowhere in the tree — and then
 * each run in turn reads the row, re-derives the absence by hand, writes it in
 * prose the generator does not read, and hands the row on unchanged. Measured
 * on two consecutive runs against the same row.
 *
 * So this module answers one mechanical question — which repo paths does this
 * row name, and which of them are not on disk — and the generator renders the
 * answer beside the row.
 *
 * **It never changes claimability, and that is a design choice, not a gap.**
 * The paths come out of prose, and prose names DELIVERABLES as well as
 * preconditions: an acceptance that says "add a manifest under
 * `docs/governance/dataset-manifests/<id>.json`" names a path that is supposed
 * to be absent. Filtering on this signal would hide real work, which is worse
 * than the defect it would fix. An annotation costs a reader one sentence and
 * can hide nothing.
 *
 * Calibration, because the row that exposed this says "measure before gating":
 * over 760 backlog items, 612 root-anchored paths are named and 11 rows name an
 * absent one; over the 7 rows claimable at the time, exactly 1 fires and it is
 * the true positive. The two rules that got it there are in REPO_PATH_ROOTS and
 * PATH_EXTENSIONS, each with the false positive it exists to refuse.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * The directory prefixes that make a path repo-root-anchored.
 *
 * An ALLOWLIST, deliberately, rather than "the top-level directories of this
 * repository". Rows routinely write a path relative to a prose prefix — "the
 * two routes `intelligence/query/route.ts` and `chat/agent/route.ts`" means
 * `src/app/api/...` — and this repository happens to have a real top-level
 * `intelligence/`, so deriving the roots from the directory listing accepts
 * that fragment and then reports it absent. Measured: the listing-derived rule
 * fires on 30 rows, this one on 11, and the 19 it drops are all fragments.
 *
 * Add a root only with the same measurement. A root that admits fragments
 * turns this from a signal into noise, and noise in a queue is read as a
 * string literal rather than as a finding.
 */
export const REPO_PATH_ROOTS = Object.freeze([
  "src/",
  "scripts/",
  "docs/",
  "tests/",
  "datasets/",
  ".github/",
  "supabase/",
]);

/**
 * Extensions, LONGEST FIRST — the ordering is load-bearing.
 *
 * JavaScript alternation is first-match, not longest-match. The first draft
 * read `ts|tsx|json|js`, so `HomeSurface.tsx` matched as `HomeSurface.ts` and
 * `source-stage-map.json` as `source-stage-map.js`; both then resolved to
 * nothing on disk and were reported ABSENT. That is the tool manufacturing a
 * defect out of two files that are present, and it is the failure mode a
 * trailing-character lookahead alone does not catch, because the regex simply
 * backtracks into the shorter alternative.
 */
const PATH_EXTENSIONS = [
  "tsx",
  "json",
  "yaml",
  "mjs",
  "cjs",
  "yml",
  "sql",
  "ts",
  "js",
  "sh",
  "md",
];

/*
 * The body allows `[` and `]` because a Next.js dynamic segment is a literal
 * directory name on disk, so `src/app/api/v1/programs/[programId]/route.ts`
 * is checkable exactly as a row writes it.
 *
 * The leading lookbehind stops `vendor/src/lib/foo.ts` matching from `src/`.
 * The trailing lookahead forbids only word characters, so a path written last
 * in a sentence — `…/stale-claim-guard.ts.` — keeps its extension; forbidding
 * any following character at all would drop most paths in the corpus.
 */
const PATH_PATTERN = new RegExp(
  "(?<![A-Za-z0-9_./-])" +
    `((?:${REPO_PATH_ROOTS.map((r) => r.slice(0, -1).replace(".", "\\.")).join("|")})` +
    "/[A-Za-z0-9_./\\[\\]-]*?" +
    `\\.(?:${PATH_EXTENSIONS.join("|")}))` +
    "(?![A-Za-z0-9_-])",
  "g",
);

/**
 * Every repo-root-anchored path this text names, de-duplicated and sorted.
 *
 * Reads BARE tokens, not backticked ones: the board strips backticks out of
 * `title` and `acceptance` before the generator sees them, so a
 * backtick-dependent reader finds nothing on the real corpus while passing on
 * every hand-written fixture.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function namedRepoPaths(text) {
  if (!text) return [];
  const found = new Set();
  for (const m of String(text).matchAll(PATH_PATTERN)) found.add(m[1]);
  return [...found].sort();
}

/**
 * Walk up from `startDir` to the first directory holding a `.git` entry.
 *
 * `.git` is tested with `existsSync` rather than `isDirectory` on purpose: in
 * a git WORKTREE it is a FILE containing a `gitdir:` pointer, and every run of
 * the execution task works in a worktree — a directory-only test would find no
 * root in exactly the place this tool is used.
 *
 * @param {string} startDir
 * @returns {string|null} the repo root, or null when there is none above it
 */
export function findRepoRoot(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * The paths this text names that are NOT in the tree at `repoRoot`.
 *
 * A null root means the scan did not run, and the answer is the EMPTY list
 * rather than every path. With no tree to check against every path looks
 * absent, and a queue that annotated all 612 of them would be noise — the
 * conservative answer here is to say nothing, and let the caller report that
 * the scan did not run.
 *
 * @param {string} text
 * @param {string|null} repoRoot
 * @returns {string[]}
 */
export function absentNamedPaths(text, repoRoot) {
  if (!repoRoot) return [];
  return namedRepoPaths(text).filter((p) => !fs.existsSync(path.join(repoRoot, p)));
}

/**
 * The marker the queue renders inside a lane-table cell.
 *
 * It NAMES the paths. A marker that said only "a precondition is unmet" would
 * send the reader back to the backlog to find out which one, which is the cost
 * this scan exists to remove. It also says the row is still claimable, because
 * a `⚠` next to a row otherwise reads as a block and the next agent would skip
 * work that is perfectly takeable.
 *
 * Pipes are escaped: this string is rendered inside a Markdown table cell, and
 * a bare pipe shifts every column after it.
 *
 * @param {string[]} absent
 * @returns {string} the marker, or "" when nothing is absent
 */
export function describePreconditionGap(absent) {
  if (!absent?.length) return "";
  const list = absent.map((p) => `\`${String(p).replace(/\|/g, "\\|")}\``).join(", ");
  return (
    ` ⚠ PRECONDITION — ${absent.length === 1 ? "a path" : "paths"} this row names ${
      absent.length === 1 ? "is" : "are"
    } not in the checkout: ${list}.` +
    " Measured by existence against the repo root, not read off the row." +
    " This does NOT change claimability — the row may name it as something to CREATE," +
    " in which case the absence is the point. Establish which before you start:" +
    " if the row describes it as already existing, the work is blocked until it lands" +
    " and claiming the row builds a second copy or edits a sibling's branch."
  );
}

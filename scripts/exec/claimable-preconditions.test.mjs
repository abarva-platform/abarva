#!/usr/bin/env node
/**
 * Behavioural test for the claimable-row precondition scan.
 *
 * THE DEFECT. The queue offers a row as claimable with no signal that a file
 * the row describes as ALREADY EXISTING is absent from the checkout. Measured
 * twice on consecutive runs against the same row: the row names a scanner it
 * says "already reads and reports" two fields, that scanner exists nowhere in
 * the tree, and the only occurrence of its name anywhere is one sentence in a
 * release record saying so. Both runs read the row, re-derived the absence by
 * hand, and reported it in prose that the generator does not read — so the row
 * was offered again, unchanged, to the next run.
 *
 * WHY THIS IS AN ANNOTATION AND NOT A FILTER. A filter on a prose-extracted
 * path would hide real work: an acceptance that says "add a manifest under
 * `docs/governance/...json`" names a path that is a DELIVERABLE, and suppressing
 * that row would be worse than the defect. So claimability is untouched and the
 * scan only writes a sentence next to the row. The cases below hold that shut
 * from both sides: the marker appears for an absent path, and the row stays in
 * its lane table.
 *
 * WHAT HAD TO BE CALIBRATED FIRST, because the acceptance of the row that
 * exposed this says "measure before gating" and the same hazard applies here:
 *
 *   - **The extension alternation must be longest-first.** The first draft
 *     ordered it `ts|tsx|json|js`, so `HomeSurface.tsx` matched as
 *     `HomeSurface.ts` and `source-stage-map.json` as `source-stage-map.js`.
 *     Both were then reported ABSENT — two false positives manufactured by the
 *     regex out of files that exist. Case 4 is that bug.
 *   - **The root must be an allowlist, not "any top-level directory".** This
 *     repository has a top-level `intelligence/`, and rows write relative
 *     fragments like `intelligence/query/route.ts` meaning
 *     `src/app/api/intelligence/query/route.ts`. Deriving roots from the
 *     directory listing accepts the fragment and reports it absent. Case 5.
 *   - Measured over the real corpus of 760 items with the shipped rules: 612
 *     root-anchored paths named, 11 rows naming an absent one, and over the 7
 *     rows that were claimable at the time exactly 1 fires — the true positive.
 *
 * Run:  node scripts/exec/claimable-preconditions.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  REPO_PATH_ROOTS,
  absentNamedPaths,
  describePreconditionGap,
  findRepoRoot,
  namedRepoPaths,
} from "./claimable-preconditions.mjs";

let failures = 0;
let passes = 0;

function check(name, ok, detail) {
  if (ok) {
    passes += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}`);
    if (detail !== undefined) console.log(`        ${String(detail).split("\n").join("\n        ")}`);
  }
}

console.log("claimable-preconditions — precondition scan over claimable rows\n");

/* ---------------------------------------------------------------------- */
/* 1. The extractor finds a root-anchored path written in bare prose.      */
/*    The board strips backticks out of title and acceptance before the    */
/*    generator ever sees them, so a backtick-dependent reader would find  */
/*    nothing on the real corpus while passing on a hand-written fixture.  */
/* ---------------------------------------------------------------------- */
{
  const text =
    "scripts/ci/scheduled-workflow-streak.mjs already reads and reports each " +
    "workflow's state and lastRunAt from the API for exactly this reason.";
  check(
    "a bare, unbackticked path in prose is extracted",
    namedRepoPaths(text).includes("scripts/ci/scheduled-workflow-streak.mjs"),
    namedRepoPaths(text),
  );
}

/* ---------------------------------------------------------------------- */
/* 2. Several paths in one row, de-duplicated and ordered.                */
/* ---------------------------------------------------------------------- */
{
  const text =
    "Point sentenceList in src/components/home/HomeSurface.tsx at " +
    "src/lib/home/preview/narrative-sentences.ts, and src/components/home/HomeSurface.tsx " +
    "is already listed in docs/architecture/unreachable-components.json.";
  check(
    "repeated paths collapse to one entry each, sorted",
    JSON.stringify(namedRepoPaths(text)) ===
      JSON.stringify([
        "docs/architecture/unreachable-components.json",
        "src/components/home/HomeSurface.tsx",
        "src/lib/home/preview/narrative-sentences.ts",
      ]),
    namedRepoPaths(text),
  );
}

/* ---------------------------------------------------------------------- */
/* 3. A path at the end of a sentence keeps its extension.                */
/*    `foo.ts.` must yield `foo.ts`, not nothing: a lookahead that forbids */
/*    any following character at all drops every path written last in a    */
/*    sentence, which is most of them.                                     */
/* ---------------------------------------------------------------------- */
{
  check(
    "a path followed by a full stop is still extracted",
    namedRepoPaths("The guard lives in src/lib/home/preview/stale-claim-guard.ts.")
      .includes("src/lib/home/preview/stale-claim-guard.ts"),
    namedRepoPaths("The guard lives in src/lib/home/preview/stale-claim-guard.ts."),
  );
}

/* ---------------------------------------------------------------------- */
/* 4. THE REGEX BUG, held shut. Longest extension wins.                   */
/*    With `ts|tsx` ordering these two truncate to `.ts` and `.js` and are */
/*    then reported absent — the tool inventing a defect out of a file     */
/*    that is there.                                                       */
/* ---------------------------------------------------------------------- */
{
  const got = namedRepoPaths(
    "src/components/home/HomeSurface.tsx and scripts/exec/source-stage-map.json",
  );
  check(
    "a .tsx path is not truncated to .ts",
    got.includes("src/components/home/HomeSurface.tsx") && !got.includes("src/components/home/HomeSurface.ts"),
    got,
  );
  check(
    "a .json path is not truncated to .js",
    got.includes("scripts/exec/source-stage-map.json") && !got.includes("scripts/exec/source-stage-map.js"),
    got,
  );
}

/* ---------------------------------------------------------------------- */
/* 4b. THE GUARD THAT IS INDIVIDUALLY NECESSARY.                           */
/*                                                                         */
/*   Case 4 above does NOT pin the extension ordering, and the mutation     */
/*   table says so: reordering PATH_EXTENSIONS shortest-first leaves this   */
/*   suite 21/0, because the trailing lookahead closes the same defect on   */
/*   its own, and removing the lookahead with the ordering intact also      */
/*   survives. Either guard alone is sufficient, so no behavioural case can */
/*   tell them apart — case 4 pins the CONJUNCTION and nothing smaller.     */
/*                                                                         */
/*   This case is what the lookahead can do that ordering cannot: refuse an */
/*   extension-shaped prefix of a longer word. With the lookahead gone,     */
/*   `foo.tsxyz` matches as `foo.tsx` however the list is ordered, and the  */
/*   queue would then report a path that was never written.                 */
/* ---------------------------------------------------------------------- */
{
  check(
    "an extension that is only a prefix of a longer word matches nothing",
    namedRepoPaths("src/lib/foo.tsxyz and src/lib/a.jsonx").length === 0,
    namedRepoPaths("src/lib/foo.tsxyz and src/lib/a.jsonx"),
  );
  check(
    "and the same tokens cut short at a real extension still match",
    JSON.stringify(namedRepoPaths("src/lib/foo.tsx and src/lib/a.json")) ===
      JSON.stringify(["src/lib/a.json", "src/lib/foo.tsx"]),
    namedRepoPaths("src/lib/foo.tsx and src/lib/a.json"),
  );
}

/* ---------------------------------------------------------------------- */
/* 5. A relative fragment is NOT a repo path.                             */
/*    `intelligence/` is a real top-level directory here, so a rule that   */
/*    derives roots from the directory listing would accept the fragment   */
/*    and report it absent. The allowlist is what refuses it.              */
/* ---------------------------------------------------------------------- */
{
  const text =
    "the two routes intelligence/query/route.ts and chat/agent/route.ts, and " +
    "canvas/analytics/ValueWaterfall.tsx under the Source canvas";
  check(
    "a relative fragment outside the declared roots is not extracted",
    namedRepoPaths(text).length === 0,
    namedRepoPaths(text),
  );
  check(
    "the declared roots are an explicit allowlist, not the directory listing",
    Array.isArray(REPO_PATH_ROOTS) && REPO_PATH_ROOTS.length > 0 && !REPO_PATH_ROOTS.includes("intelligence/"),
    REPO_PATH_ROOTS,
  );
}

/* ---------------------------------------------------------------------- */
/* 6. A path embedded in a longer token does not start a match.           */
/* ---------------------------------------------------------------------- */
{
  check(
    "a path that is a suffix of a longer token is not extracted",
    namedRepoPaths("vendor/src/lib/foo.ts").length === 0,
    namedRepoPaths("vendor/src/lib/foo.ts"),
  );
}

/* ---------------------------------------------------------------------- */
/* 7. Next.js bracket segments survive, because they are literal          */
/*    directory names on disk and a row names them as written.            */
/* ---------------------------------------------------------------------- */
{
  const p = "src/app/api/v1/programs/[programId]/advance/route.ts";
  check(
    "a bracketed dynamic segment is extracted verbatim",
    namedRepoPaths(`the route ${p} refuses`).includes(p),
    namedRepoPaths(`the route ${p} refuses`),
  );
}

/* ---------------------------------------------------------------------- */
/* 8. absentNamedPaths answers against a REAL tree, both ways.            */
/*    The present case matters as much as the absent one: a scan that      */
/*    reported everything absent would "catch" the defect while being      */
/*    useless, and that is the shape this backlog exists to refuse.        */
/* ---------------------------------------------------------------------- */
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "precond-"));
  fs.mkdirSync(path.join(dir, "scripts", "ci"), { recursive: true });
  fs.writeFileSync(path.join(dir, "scripts", "ci", "present.mjs"), "// here\n");

  check(
    "a named path that exists is not reported",
    absentNamedPaths("see scripts/ci/present.mjs for the scanner", dir).length === 0,
    absentNamedPaths("see scripts/ci/present.mjs for the scanner", dir),
  );
  check(
    "a named path that does not exist is reported",
    JSON.stringify(absentNamedPaths("see scripts/ci/absent.mjs for the scanner", dir)) ===
      JSON.stringify(["scripts/ci/absent.mjs"]),
    absentNamedPaths("see scripts/ci/absent.mjs for the scanner", dir),
  );
  check(
    "a row naming one present and one absent path reports only the absent one",
    JSON.stringify(
      absentNamedPaths("scripts/ci/present.mjs and scripts/ci/absent.mjs", dir),
    ) === JSON.stringify(["scripts/ci/absent.mjs"]),
    absentNamedPaths("scripts/ci/present.mjs and scripts/ci/absent.mjs", dir),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/* ---------------------------------------------------------------------- */
/* 9. No repo root means the scan DID NOT RUN, and reports nothing.       */
/*    Fail-closed here is reporting nothing, not reporting everything:     */
/*    with no tree to check against, every path looks absent, and a queue  */
/*    annotating all 612 of them would be noise nobody reads.              */
/* ---------------------------------------------------------------------- */
{
  check(
    "a null root reports no absent paths rather than all of them",
    absentNamedPaths("scripts/ci/absent.mjs and src/lib/also-absent.ts", null).length === 0,
    absentNamedPaths("scripts/ci/absent.mjs and src/lib/also-absent.ts", null),
  );
}

/* ---------------------------------------------------------------------- */
/* 10. findRepoRoot walks up to a `.git` entry, and a git WORKTREE's       */
/*     `.git` is a FILE, not a directory — every run of this task works in */
/*     a worktree, so a directory-only test would find no root in exactly  */
/*     the place the tool is used.                                         */
/* ---------------------------------------------------------------------- */
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "precond-root-"));
  const nested = path.join(dir, "scripts", "exec");
  fs.mkdirSync(nested, { recursive: true });
  fs.writeFileSync(path.join(dir, ".git"), "gitdir: /elsewhere/.git/worktrees/x\n");
  check(
    "a worktree's .git FILE is recognised as the repo root",
    fs.realpathSync(findRepoRoot(nested) ?? "/nonexistent") === fs.realpathSync(dir),
    findRepoRoot(nested),
  );

  const bare = fs.mkdtempSync(path.join(os.tmpdir(), "precond-noroot-"));
  check(
    "a directory under no repository yields null",
    findRepoRoot(bare) === null,
    findRepoRoot(bare),
  );
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(bare, { recursive: true, force: true });
}

/* ---------------------------------------------------------------------- */
/* 11. The marker names the path. A marker that only says "a precondition  */
/*     is unmet" sends the reader back to the backlog, which is the cost    */
/*     this whole scan exists to remove.                                   */
/* ---------------------------------------------------------------------- */
{
  const said = describePreconditionGap(["scripts/ci/scheduled-workflow-streak.mjs"]);
  check(
    "the marker names the absent path",
    said.includes("scripts/ci/scheduled-workflow-streak.mjs"),
    said,
  );
  check(
    "the marker says the row is still claimable rather than implying a block",
    /not a filter|still claimable|claimability/i.test(said),
    said,
  );
  check(
    "no absent path yields no marker at all",
    describePreconditionGap([]) === "",
    describePreconditionGap([]),
  );
  check(
    "the marker escapes the table-cell pipe it will be rendered inside",
    !describePreconditionGap(["scripts/a|b.ts"]).includes("a|b"),
    describePreconditionGap(["scripts/a|b.ts"]),
  );
}

/* ---------------------------------------------------------------------- */
/* 12. The REAL repository is the calibration case. Run against this       */
/*     checkout, the roots must resolve and the toolchain's own files must  */
/*     all be present — if this fails, the extractor or the root walk is    */
/*     wrong in a way no fixture would show.                               */
/* ---------------------------------------------------------------------- */
{
  const root = findRepoRoot(path.dirname(new URL(import.meta.url).pathname));
  if (root === null) {
    check("the real checkout resolves a repo root", false, "findRepoRoot returned null");
  } else {
    const selfNamed =
      "the generator scripts/exec/build-execution-queue.mjs and the register " +
      "reader scripts/exec/register-time-authority.mjs and docs/ci/required-status-checks.json";
    check(
      "three paths that exist in this checkout are all reported present",
      absentNamedPaths(selfNamed, root).length === 0,
      absentNamedPaths(selfNamed, root),
    );
    check(
      "a path that does not exist in this checkout is reported absent",
      absentNamedPaths("scripts/exec/there-is-no-such-file.mjs", root).length === 1,
      absentNamedPaths("scripts/exec/there-is-no-such-file.mjs", root),
    );
  }
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);

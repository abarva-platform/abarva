#!/usr/bin/env node
/**
 * Behavioural test for the shared CLI entry guard (item T-723).
 *
 * Every script in this directory is a module with a CLI attached, so each needs
 * to answer one question: was I run, or was I imported? Four scripts had four
 * different answers and only one was right.
 *
 * The defect is not a wrong answer. It is a control that answers "imported",
 * does nothing, and **exits 0**. On macOS `/tmp` is a symlink to `/private/tmp`;
 * `import.meta.url` is always the realpath, while `process.argv[1]` is the path
 * as typed. So a guard that compares them without resolving symlinks never
 * matches when the script is invoked through `/tmp`, and the operator task file
 * instructs agents to work in `/tmp/exec-<item>-<timestamp>`.
 *
 * Measured before the fix, both via a `/tmp` path:
 *
 *   node <dir>/queue-provenance.mjs --register <register>   -> no output, exit 0
 *   node <dir>/worktree-retention.mjs --check --free-floor-gib 9999
 *                                                          -> no output, exit 0
 *
 * The second is the serious one: that is T-719's disk-safety control, and its
 * whole contract is to exit 1 below the floor.
 *
 * So every case below invokes a REAL CLI as a child process through a REAL
 * symlink, because that is the only way to distinguish a guard that works from
 * one that silently declines. A unit test of the predicate alone would have
 * passed against every one of the four broken guards — the predicate was never
 * the thing that was wrong, the comparison it was given was.
 *
 * Run:  node scripts/exec/cli-entry.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { isDirectInvocation, unknownFlags } from "./cli-entry.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

let passes = 0;
let failures = 0;

function check(name, condition, detail) {
  if (condition) {
    passes += 1;
    console.log(`  PASS  ${name}`);
    return;
  }
  failures += 1;
  console.log(`  FAIL  ${name}`);
  if (detail) console.log(`        ${String(detail).split("\n").join("\n        ")}`);
}

function run(script, args, cwd) {
  try {
    const stdout = execFileSync(process.execPath, [script, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? String(error),
    };
  }
}

/**
 * A real directory reachable by two different paths, one of them a symlink.
 *
 * Built rather than assumed: `/tmp` happens to be a symlink on macOS and is not
 * on Linux, so a suite that relied on it would silently stop testing anything
 * in CI — which is the same "passes because it never ran" shape this item is
 * about. `realDir` and `linkDir` name the same files on every platform.
 */
function symlinkedCopy({ toolchain = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "t723-"));
  const realDir = path.join(root, "real");
  const linkDir = path.join(root, "link");
  fs.mkdirSync(realDir);
  // `toolchain` copies the whole declared toolchain (item T-726). It used to be
  // a hand-written list of three names, and `queue-provenance.mjs` reaches
  // `build-execution-queue.mjs` through a sibling PATH rather than an import --
  // so the short copy threw nothing and silently answered `generator_missing`
  // where the repo directory answers `unstamped`. The cases here never drove
  // that branch, so the list was wrong and the suite was green.
  //
  // The list is asked for by RUNNING the manifest CLI rather than importing it.
  // This suite is the one that has to stay runnable when an entry guard in this
  // directory is wrong: a module whose guard answers "run" prints and exits
  // during import, which would take this suite down with it and leave exit 0
  // and no cases -- the exact defect it exists against.
  if (toolchain) {
    const listed = run(path.join(HERE, "toolchain-manifest.mjs"), ["--json"], root);
    if (listed.status !== 0) throw new Error(`toolchain-manifest.mjs --json failed: ${listed.stderr}`);
    for (const f of JSON.parse(listed.stdout).files) {
      fs.copyFileSync(path.join(HERE, f), path.join(realDir, f));
    }
  }
  fs.symlinkSync(realDir, linkDir, "dir");
  return { root, realDir, linkDir };
}

/* ------------------------------------------------------------------------ */
/* 1-4. The predicate itself, including the symlink case.                   */
/* ------------------------------------------------------------------------ */
{
  const { root, realDir, linkDir } = symlinkedCopy();
  const target = path.join(realDir, "thing.mjs");
  fs.writeFileSync(target, "// a module\n");
  const viaLink = path.join(linkDir, "thing.mjs");
  const url = `file://${target}`;

  check(
    "the file's own path is a direct invocation",
    isDirectInvocation(url, target),
  );
  check(
    "THE DEFECT: the same file reached through a symlinked directory is still a direct invocation",
    isDirectInvocation(url, viaLink),
    `url=${url} argv1=${viaLink}`,
  );
  check(
    "a different file in the same directory is NOT a direct invocation",
    !isDirectInvocation(url, path.join(realDir, "other.mjs")),
  );
  check(
    "a file whose name merely ends with the module's name is NOT a direct invocation",
    !isDirectInvocation(url, path.join(realDir, "my-thing.mjs")),
    "a suffix match would accept this; the register-time-authority guard does",
  );

  fs.rmSync(root, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 5-6. Absent and unreadable argv[1].                                     */
/*                                                                          */
/* Failing closed is WRONG here and that is deliberate. Everywhere else in   */
/* this directory an unknown case refuses, because refusing costs one rerun. */
/* This predicate is not a gate; it decides whether to run a CLI. An unknown */
/* case that answers "yes, run" would make `import` execute the CLI, which   */
/* breaks every importer. So the safe direction is inverted, and it is       */
/* inverted on purpose rather than by omission.                              */
/* ------------------------------------------------------------------------ */
{
  const { root, realDir } = symlinkedCopy();
  const target = path.join(realDir, "thing.mjs");
  fs.writeFileSync(target, "// a module\n");
  const url = `file://${target}`;

  check(
    "no argv[1] at all is not a direct invocation",
    !isDirectInvocation(url, undefined) && !isDirectInvocation(url, ""),
  );
  check(
    "an argv[1] that does not exist on disk is not a direct invocation",
    !isDirectInvocation(url, path.join(realDir, "never-written.mjs")),
  );
  check(
    "a module url that does not exist on disk is not a direct invocation",
    !isDirectInvocation(`file://${path.join(realDir, "gone.mjs")}`, target),
  );

  fs.rmSync(root, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 7-8. A path with a space, which the string-concatenation guard also lost. */
/*                                                                          */
/* `import.meta.url` percent-encodes a space; `file://${argv[1]}` does not,  */
/* so the two never compare equal. Same silent exit 0, different cause, and  */
/* it is why the fix compares resolved FILES rather than composed strings.   */
/* ------------------------------------------------------------------------ */
{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "t723-"));
  const spaced = path.join(root, "dir with space");
  fs.mkdirSync(spaced);
  const target = path.join(spaced, "thing.mjs");
  fs.writeFileSync(target, "// a module\n");

  check(
    "a path containing a space is a direct invocation",
    isDirectInvocation(`file://${encodeURI(target)}`, target),
    `encoded=${encodeURI(target)}`,
  );
  check(
    "the unencoded composed form is what the old guard compared, and it differs",
    `file://${target}` !== `file://${encodeURI(target)}`,
    "if these were equal this case would prove nothing",
  );

  fs.rmSync(root, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 9-12. THE ACCEPTANCE. Real CLIs, invoked through a real symlink.         */
/*                                                                          */
/* These are the cases the item exists for. Each asserts the CLI produced    */
/* its verdict, not that it exited 0 — a silent exit 0 is the defect.        */
/* ------------------------------------------------------------------------ */
{
  const { root, realDir, linkDir } = symlinkedCopy({ toolchain: true });

  // queue-provenance: point it at a queue that does not exist. The verdict is
  // `absent` and the exit code is 1 — a CLI that declined to run gives neither.
  const missingQueue = path.join(root, "EXECUTION_QUEUE.md");
  const qpVia = (dir) =>
    run(path.join(dir, "queue-provenance.mjs"), ["--queue", missingQueue, "--json"], root);

  const qpReal = qpVia(realDir);
  const qpLink = qpVia(linkDir);

  check(
    "queue-provenance runs when invoked through its real path",
    qpReal.status === 1 && /"verdict"/.test(qpReal.stdout),
    `status=${qpReal.status} stdout=${qpReal.stdout.slice(0, 200)}`,
  );
  check(
    "THE ACCEPTANCE: queue-provenance runs when invoked through a SYMLINKED path",
    qpLink.status === 1 && /"verdict"/.test(qpLink.stdout),
    `status=${qpLink.status} stdout=${qpLink.stdout.slice(0, 200)}\n` +
      "a silent exit 0 with no stdout is the defect this case exists against",
  );
  check(
    "both invocations of queue-provenance report the same verdict",
    qpReal.stdout === qpLink.stdout && qpReal.status === qpLink.status,
    `real=${qpReal.status} link=${qpLink.status}`,
  );

  // worktree-retention: `--check` with an impossible floor must exit non-zero.
  // Run from a directory that is not a git repository, so the outcome cannot
  // depend on this machine's worktree population; what is asserted is that the
  // CLI ENGAGED, which a refusal to run does not.
  const wrVia = (dir) =>
    run(path.join(dir, "worktree-retention.mjs"), ["--check", "--free-floor-gib", "9999"], root);

  const wrReal = wrVia(realDir);
  const wrLink = wrVia(linkDir);
  const engaged = (r) => r.status !== 0 || `${r.stdout}${r.stderr}`.trim().length > 0;

  check(
    "worktree-retention --check engages when invoked through its real path",
    engaged(wrReal),
    `status=${wrReal.status} out=${(wrReal.stdout + wrReal.stderr).slice(0, 200)}`,
  );
  check(
    "THE ACCEPTANCE: worktree-retention --check engages when invoked through a SYMLINKED path",
    engaged(wrLink),
    `status=${wrLink.status} out=${(wrLink.stdout + wrLink.stderr).slice(0, 200)}\n` +
      "exit 0 and no output means the disk-safety control declined to run",
  );
  check(
    "both invocations of worktree-retention behave identically",
    wrReal.status === wrLink.status,
    `real=${wrReal.status} link=${wrLink.status}`,
  );

  fs.rmSync(root, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 13-14. Importing a CLI module must NOT run its CLI.                     */
/*                                                                          */
/* The opposite error, and it has to be held down or the fix could be "just  */
/* always run". append-claim.mjs imports queue-provenance.mjs on every claim.*/
/* ------------------------------------------------------------------------ */
{
  const { root, realDir, linkDir } = symlinkedCopy({ toolchain: true });

  for (const [label, dir] of [["real", realDir], ["symlinked", linkDir]]) {
    const importer = path.join(root, `import-${label}.mjs`);
    fs.writeFileSync(
      importer,
      `import "${path.join(dir, "queue-projected").replace("queue-projected", "queue-provenance.mjs")}";\n` +
        `import "${path.join(dir, "worktree-retention.mjs")}";\n` +
        `console.log("IMPORTED_CLEANLY");\n`,
    );
    const r = run(importer, [], root);
    check(
      `importing both modules through the ${label} path does not run either CLI`,
      r.status === 0 && r.stdout.trim() === "IMPORTED_CLEANLY",
      `status=${r.status} stdout=${r.stdout.slice(0, 300)} stderr=${r.stderr.slice(0, 200)}`,
    );
  }

  fs.rmSync(root, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 15-17. EVERY module in this directory, not two named ones.               */
/*                                                                          */
/* Cases 13-14 name `queue-provenance.mjs` and `worktree-retention.mjs`,    */
/* which were the two modules that had the defect on the day. A guard that  */
/* wrongly answers "run" makes the module print and exit during import --   */
/* so any suite importing it reports nothing and EXITS 0, which CI reads as */
/* a pass. Measured while item T-726 was in flight: with the guard in       */
/* `toolchain-manifest.mjs` forced to true, three suites exited 0 having    */
/* run zero cases.                                                          */
/*                                                                          */
/* The list is read from the directory, not written here, because a         */
/* hand-written one is the defect T-726 is about and a new module is        */
/* exactly what it misses.                                                  */
/*                                                                          */
/* THE EXEMPTION RETIRED ITSELF, WHICH IS WHY THE MACHINERY STAYS. T-723    */
/* gave four modules the shared guard and never looked at the two           */
/* generators, so importing either RAN it; both were exempt here, and the   */
/* case below asserted each exempt module STILL had the defect, so the day  */
/* one of them gained a guard the list failed until the name came out. That */
/* is exactly what happened: item T-728 guarded both generators and emptied */
/* the list in the same change, because it had to. The list and both cases  */
/* are kept for the next module that arrives unguarded.                     */
/*                                                                          */
/* An empty list, though, makes those two cases assert nothing -- `every`   */
/* is true of no elements and `0 === 0` compares two empty lists. So the    */
/* empty case has a case of its own rather than inheriting two unfailable   */
/* ones; see the comment at the branch below.                               */
/* ------------------------------------------------------------------------ */
{
  // Item T-728 emptied this list: both generators now take the shared guard.
  // The list and its two cases are kept rather than deleted -- the next module
  // that arrives unguarded goes here, and the machinery that retires the
  // exemption has to be standing when it does.
  const EXEMPT_UNGUARDED = [];

  const root = fs.mkdtempSync(path.join(os.tmpdir(), "t726-import-all-"));
  const modules = fs
    .readdirSync(HERE, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".mjs") && !e.name.endsWith(".test.mjs"))
    .map((e) => e.name)
    .sort();

  const importOnly = (names, label) => {
    const importer = path.join(root, `import-${label}.mjs`);
    fs.writeFileSync(
      importer,
      `${names.map((m) => `import "${path.join(HERE, m)}";`).join("\n")}\n` +
        `console.log("IMPORTED_CLEANLY");\n`,
    );
    return run(importer, [], root);
  };

  const guarded = modules.filter((m) => !EXEMPT_UNGUARDED.includes(m));
  const r = importOnly(guarded, "guarded");

  check(
    `importing all ${guarded.length} guarded modules in this directory runs no CLI`,
    r.status === 0 && r.stdout.trim() === "IMPORTED_CLEANLY",
    `status=${r.status}\nstdout=${r.stdout.slice(0, 400)}\nstderr=${r.stderr.slice(0, 300)}\n` +
      `modules=${guarded.join(", ")}\n` +
      "output other than IMPORTED_CLEANLY means a module ran its CLI on import",
  );

  if (EXEMPT_UNGUARDED.length === 0) {
    // An empty exemption makes the two cases in the `else` assert NOTHING:
    // `Array.every` is true of an empty list and `0 === 0` is true of two of
    // them. Emptying the list would therefore have turned two green cases
    // into two unfailable ones -- the exact shape this directory exists
    // against. So the empty case gets a case of its own, and it is STRONGER
    // than the batch above rather than a restatement of it: the batch
    // importer stops at the first module that exits, so a second offender
    // standing behind the first is invisible to it. This imports every module
    // ON ITS OWN and names all of them.
    const runsOnImport = modules.filter((m) => {
      const one = importOnly([m], m.replace(/\W/g, "-"));
      return !(one.status === 0 && one.stdout.trim() === "IMPORTED_CLEANLY");
    });

    check(
      `NO EXEMPTION REMAINS: each of the ${modules.length} modules, imported ON ITS OWN, runs no CLI`,
      modules.length > 0 && runsOnImport.length === 0,
      `modules=${modules.join(", ")}\n` +
        `runs its CLI on import=${runsOnImport.join(", ") || "none"}\n` +
        "the module count is asserted too: a directory read that returned\n" +
        "nothing would otherwise satisfy every check in this block",
    );
  } else {
    check(
      "every exempt module is a module that exists",
      EXEMPT_UNGUARDED.every((m) => modules.includes(m)),
      `exempt=${EXEMPT_UNGUARDED.join(", ")} present=${modules.join(", ")}`,
    );

    const stillUnguarded = EXEMPT_UNGUARDED.filter((m) => {
      const one = importOnly([m], m.replace(/\W/g, "-"));
      return !(one.status === 0 && one.stdout.trim() === "IMPORTED_CLEANLY");
    });

    check(
      "THE EXEMPTION RETIRES ITSELF: every exempt module still runs on import",
      stillUnguarded.length === EXEMPT_UNGUARDED.length,
      `exempt=${EXEMPT_UNGUARDED.join(", ")} still unguarded=${stillUnguarded.join(", ")}\n` +
        "a module here that no longer runs on import has been fixed;\n" +
        "remove it from EXEMPT_UNGUARDED so the case above covers it",
    );
  }

  fs.rmSync(root, { recursive: true, force: true });
}


/*
 * ---------------------------------------------------------------------------
 * The shared argv expectation (item T-748)
 * ---------------------------------------------------------------------------
 *
 * The second question every CLI in this directory has to answer: is this an
 * argument I read? Ten hand-written `process.argv` readers, and on 2026-09-23
 * not one of them noticed a flag it did not recognise. Measured by execution on
 * `main` `7e74fe7a0`, `append-claim.mjs` accepted `--release`,
 * `--totally-made-up-flag` and `--wrong-flag-two=x` and produced a normal
 * `item <id> claimed` line at exit 0 for each. `--release` is not a flag; the
 * sanctioned spelling is `--action release`. So a run that believed it had
 * handed work back left a LIVE CLAIM on its files.
 *
 * The three invocations below are those three, verbatim, because a fixture in a
 * shape somebody already thought of proves less than the case that actually
 * happened (T-718, T-721). The negative controls are the two real actions that
 * must keep working, so the repair cannot be a blanket rejection of anything
 * unfamiliar.
 */
{
  console.log("\nT-748 — a flag the reader does not read is reported, not dropped");

  // append-claim.mjs's own vocabulary, restated here as the spec a caller
  // passes. The suite beside that CLI asserts this list equals its USAGE text.
  const SPEC = {
    value: [
      "--file", "--item", "--identity", "--message", "--files", "--action",
      "--branch", "--now", "--window-hours", "--gate", "--gate-arg", "--queue",
    ],
    boolean: ["--strict", "--dry-run"],
  };
  const BASE = [
    "--file", "/tmp/r.md", "--item", "T-999", "--identity", "a#b",
    "--message", "probe", "--branch", "probe", "--dry-run",
  ];

  // The three real invocations.
  for (const bad of ["--release", "--totally-made-up-flag", "--wrong-flag-two=x"]) {
    const found = unknownFlags([...BASE, bad], SPEC);
    check(
      `the real invocation \`${bad}\` is reported`,
      found.length === 1 && found[0] === bad,
      `reported ${JSON.stringify(found)}; this is the invocation that produced a\n` +
        "normal `claimed` line at exit 0 on main 7e74fe7a0",
    );
  }

  // Negative controls: what must still be accepted.
  check(
    "NEGATIVE CONTROL: `--action release` is not a flag error",
    unknownFlags([...BASE, "--action", "release"], SPEC).length === 0,
    "the sanctioned release path must not be refused by the repair for it",
  );
  check(
    "NEGATIVE CONTROL: `--action abstain` is not a flag error",
    unknownFlags([...BASE, "--action", "abstain"], SPEC).length === 0,
    "an abstention is the one record that survives a refused gate; it must not die here",
  );
  check(
    "NEGATIVE CONTROL: the full legitimate invocation reports nothing",
    unknownFlags(
      [...BASE, "--files", "a.mjs,b.mjs", "--strict", "--window-hours", "3",
        "--now", "2026-09-23T22:00:00Z", "--queue", "/tmp/q.md", "--gate", "/tmp/g.mjs"],
      SPEC,
    ).length === 0,
    "every flag this CLI advertises must pass",
  );

  // A value is a value, whatever it looks like. This is the case a naive
  // "every token starting with -- must be known" check gets wrong, and both
  // shapes are in real use: `--gate-arg --github` is how a gate check is
  // forwarded, and a claim message quoting a flag is ordinary prose.
  check(
    "a forwarded flag VALUE (`--gate-arg --github`) is not itself read as a flag",
    unknownFlags([...BASE, "--gate-arg", "--github"], SPEC).length === 0,
    "the token after a value flag is skipped, whatever it looks like",
  );
  check(
    "a message whose TEXT begins with `--` is not read as a flag",
    unknownFlags(
      ["--file", "/tmp/r.md", "--item", "T-999", "--identity", "a#b",
        "--message", "--action release was already done"],
      SPEC,
    ).length === 0,
    "a claim message is free text and may quote a flag",
  );

  // `=` spellings. None of these readers parses them: `argv.indexOf("--file")`
  // does not match `--file=x`, so the value is silently dropped and the flag
  // reads as absent. Reporting it is the whole point of the item.
  check(
    "`--file=x` is reported, because this reader does not parse `=`",
    unknownFlags(["--file=x", "--item", "T-999", "--identity", "a#b", "--message", "m"], SPEC)
      .join() === "--file=x",
    "a spelling the reader does not read is the silent no-op this item is about",
  );

  check(
    "`--` ends the flags",
    unknownFlags(["--strict", "--", "--not-a-flag"], SPEC).length === 0,
    "everything after `--` is positional",
  );

  // The guard has to be able to fail. A spec that accidentally matched
  // everything would pass every case above.
  check(
    "MUTATION SHAPE: an empty spec reports every flag given",
    unknownFlags(["--file", "x", "--strict"], {}).join() === "--file,--strict",
    "with nothing declared, nothing is recognised",
  );
}

/*
 * ---------------------------------------------------------------------------
 * The census (item T-748) — which CLIs in this directory refuse a flag they do
 * not read, and which still swallow it.
 * ---------------------------------------------------------------------------
 *
 * "A defect in an argument reader is almost never in one reader only." All ten
 * scripts here parse `process.argv` by hand with `indexOf`/`includes`, and on
 * 2026-09-23 not one noticed an argument it did not recognise. Repairing the
 * one with a measured cost — `append-claim.mjs`, the path the claim protocol
 * sanctions — and leaving the rest unrecorded would put the residual in prose,
 * where the last eight weeks of this backlog says it does not survive.
 *
 * So the residual lives here, in a control that runs, and the exemption
 * RETIRES ITSELF: a module that starts refusing while still listed fails the
 * second case below and has to be removed from the list. That is the same
 * machinery T-726 left standing for the import guard, reused rather than
 * reinvented.
 *
 * CLASSIFICATION IS BY DIFFERENCE, not by exit code. A CLI given an unknown
 * flag is run twice with identical arguments — with the flag and without —
 * inside a sandbox. It REFUSES only if the two runs differ AND the flag's own
 * name appears in its output. Anything else is ignoring it. That discriminates
 * correctly even for an invocation that was going to fail anyway, which is
 * what the generators do against an empty operator root: a gate proved by an
 * exit code it would have produced regardless is the unfailable kind.
 */
{
  const EXEMPT_SWALLOWS_UNKNOWN_FLAGS = [
    "build-execution-queue.mjs",
    "build-source-board.mjs",
    "fossil-claims.mjs",
    "id-collision.mjs",
    "queue-provenance.mjs",
    "register-time-authority.mjs",
    "toolchain-manifest.mjs",
    "worktree-retention.mjs",
  ];

  const BAD = "--totally-made-up-flag";
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "t748-census-"));
  const emptyRegister = path.join(sandbox, "EXECUTION_CLAIMS.md");
  fs.writeFileSync(emptyRegister, "# Claims\n\n## Claim log — append only\n");
  const emptyPrIndex = path.join(sandbox, "pr-index.json");
  fs.writeFileSync(emptyPrIndex, "[]");
  // A real but empty git repository, so `worktree-retention.mjs` answers in a
  // moment instead of walking every checkout on the machine.
  const tinyRepo = path.join(sandbox, "repo");
  fs.mkdirSync(tinyRepo);
  try {
    execFileSync("git", ["init", "-q"], { cwd: tinyRepo, stdio: "ignore" });
  } catch {
    /* without git the worktree case still runs; it just fails earlier, and
       failing identically with and without the flag is still "ignores" */
  }

  /*
   * A harmless invocation for each CLI that has a useful one: read-only,
   * pointed at the sandbox, never at an operator document. Two are generators,
   * so the sandbox is where anything they write lands. A module absent from
   * this table is still measured — with no arguments.
   */
  const INVOCATIONS = {
    "append-claim.mjs": ["--file", emptyRegister, "--item", "T-999", "--identity", "a#b",
      "--message", "census probe", "--dry-run"],
    "build-execution-queue.mjs": ["--operator-root", sandbox],
    "build-source-board.mjs": ["--operator-root", sandbox, "--out", path.join(sandbox, "b.html")],
    "fossil-claims.mjs": ["--operator-root", sandbox, "--no-probe", "--quiet"],
    "id-collision.mjs": ["--id", "T-999", "--operator-root", sandbox, "--quiet"],
    "queue-provenance.mjs": ["--register", emptyRegister],
    "register-time-authority.mjs": ["--file", emptyRegister, "--limit", "1"],
    "toolchain-manifest.mjs": ["--json"],
    "worktree-retention.mjs": ["--repo", tinyRepo, "--claims", emptyRegister,
      "--pr-index", emptyPrIndex, "--json"],
  };

  const modules = fs
    .readdirSync(HERE, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".mjs") && !e.name.endsWith(".test.mjs"))
    .map((e) => e.name)
    .filter((m) => m !== "cli-entry.mjs") // a module with no CLI of its own
    .sort();

  /*
   * The census is driven by the DIRECTORY, not by `INVOCATIONS`. A module that
   * arrives tomorrow is measured with no arguments at all rather than skipped:
   * a hand-written list that silently omits what it has not heard of is the
   * shape `toolchain-manifest.test.mjs` exists to catch, and it catches this
   * one — `probe-sibling.mjs` is added to a copy of this directory precisely to
   * see whether a suite here notices. `INVOCATIONS` only supplies a *cheaper or
   * more meaningful* invocation where one exists; `worktree-retention.mjs` with
   * no arguments would walk every checkout on the machine.
   */
  const refuses = [];
  const ignores = [];
  const noCli = [];
  for (const m of modules) {
    const args = INVOCATIONS[m] ?? [];
    const script = path.join(HERE, m);
    const clean = run(script, args, sandbox);
    const dirty = run(script, [...args, BAD], sandbox);

    // A module that does nothing observable when invoked has no CLI to
    // protect. It is reported rather than assumed away.
    const silent = (r) => r.status === 0 && r.stdout.trim() === "" && r.stderr.trim() === "";
    if (silent(clean) && silent(dirty)) {
      noCli.push(m);
      continue;
    }

    const differs =
      clean.status !== dirty.status ||
      clean.stdout !== dirty.stdout ||
      clean.stderr !== dirty.stderr;
    const named = `${dirty.stdout}${dirty.stderr}`.includes(BAD);
    // Non-zero AND different AND naming the flag. Each clause removes a way of
    // looking like a refusal without being one: an exit code the invocation
    // would have produced anyway, an unchanged run, and a flag echoed inside
    // some other error.
    (dirty.status !== 0 && differs && named ? refuses : ignores).push(m);
  }

  check(
    "every CLI in this directory was classified by the census",
    refuses.length + ignores.length + noCli.length === modules.length,
    `modules=${modules.length} refuses=${refuses.length} ignores=${ignores.length} noCli=${noCli.length}`,
  );

  check(
    "every CLI that still swallows an unknown flag is on the exemption list",
    ignores.every((m) => EXEMPT_SWALLOWS_UNKNOWN_FLAGS.includes(m)),
    `swallows: ${ignores.join(", ")}\nexempt:   ${EXEMPT_SWALLOWS_UNKNOWN_FLAGS.join(", ")}\n` +
      "a CLI here that ignores an argument it does not read runs a different\n" +
      "command from the one it was asked for, and says nothing",
  );

  check(
    "THE EXEMPTION RETIRES ITSELF: no exempt CLI has quietly started refusing",
    EXEMPT_SWALLOWS_UNKNOWN_FLAGS.every((m) => ignores.includes(m)),
    `exempt: ${EXEMPT_SWALLOWS_UNKNOWN_FLAGS.join(", ")}\nrefuses: ${refuses.join(", ")}\n` +
      "a module listed here that now refuses has been repaired;\n" +
      "remove it from EXEMPT_SWALLOWS_UNKNOWN_FLAGS so the case above covers it",
  );

  check(
    "POSITIVE CONTROL: the one repaired CLI is measured as refusing",
    refuses.includes("append-claim.mjs"),
    `refuses: ${refuses.join(", ")}\nswallows: ${ignores.join(", ")}\n` +
      "if the census cannot see the one repair that exists, it cannot see the next",
  );

  fs.rmSync(sandbox, { recursive: true, force: true });
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);

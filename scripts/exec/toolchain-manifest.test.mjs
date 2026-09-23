#!/usr/bin/env node
/**
 * Behavioural test for the toolchain manifest (item T-726).
 *
 * The defect: four suites in this directory each kept their own hand-written
 * list of the files a fixture needs, and nothing declared the real answer. Two
 * of those lists went stale loudly inside one session (T-720, T-723). A third
 * was stale *quietly* on `main` when this item was filed, and the acceptance
 * cases below are built so that a list going stale can only be loud again.
 *
 * Cases 9-12 are the ones this item exists for, and they are deliberately
 * expensive: each adds a real new module to a copy of this directory, makes a
 * real executable import it, and runs a real sibling suite from that copy. A
 * fixture built from a hand-list cannot see the new module and the suite fails;
 * a fixture given the directory can. That is T-720 and T-723 replayed as a
 * control rather than described in a comment.
 *
 * Run:  node scripts/exec/toolchain-manifest.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  copyToolchainInto,
  isSuiteFile,
  missingToolchainFiles,
  toolchainFiles,
} from "./toolchain-manifest.mjs";

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

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function run(script, args, cwd) {
  try {
    const stdout = execFileSync(process.execPath, [script, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 240_000,
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    return {
      status: typeof error.status === "number" ? error.status : 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? String(error.message ?? error),
    };
  }
}

/* ------------------------------------------------------------------------ */
/* 1-3. What the manifest declares.                                         */
/* ------------------------------------------------------------------------ */

{
  const files = toolchainFiles();

  check(
    "the manifest names the executables a fixture runs",
    ["build-source-board.mjs", "build-execution-queue.mjs", "queue-provenance.mjs", "cli-entry.mjs"]
      .every((name) => files.includes(name)),
    files.join(", "),
  );

  check(
    "the manifest names the data file the board reads at run time",
    files.includes("source-stage-map.json"),
    files.join(", "),
  );

  // A fixture runs executables, not tests. If suites were copied, every fixture
  // would carry this file, and a suite that ran inside a fixture would recurse.
  check(
    "no suite is a toolchain file",
    files.every((name) => !isSuiteFile(name)) && isSuiteFile("x.test.mjs") && !isSuiteFile("x.mjs"),
    files.filter(isSuiteFile).join(", "),
  );
}

/* ------------------------------------------------------------------------ */
/* 4-5. A file added to the directory is picked up without anyone editing    */
/* a list. This is the whole point; a frozen constant would fail it.         */
/* ------------------------------------------------------------------------ */

{
  const dir = tmpdir("t726-added-");
  fs.writeFileSync(path.join(dir, "existing.mjs"), "export const a = 1;\n");
  fs.writeFileSync(path.join(dir, "existing.test.mjs"), "// a suite\n");

  const before = toolchainFiles(dir);
  fs.writeFileSync(path.join(dir, "brand-new.mjs"), "export const b = 2;\n");
  const after = toolchainFiles(dir);

  check(
    "a module added to the directory joins the manifest with no list edited",
    !before.includes("brand-new.mjs") && after.includes("brand-new.mjs"),
    `before=${before.join(",")} after=${after.join(",")}`,
  );

  const dest = path.join(dir, "fixture");
  const copied = copyToolchainInto(dest, { dir });

  check(
    "copying the toolchain copies every non-suite file and no suite",
    copied.includes("brand-new.mjs") &&
      copied.includes("existing.mjs") &&
      !copied.includes("existing.test.mjs") &&
      !fs.existsSync(path.join(dest, "existing.test.mjs")),
    copied.join(", "),
  );

  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 6-8. Withholding a file is declared, not implied by a short list.        */
/* ------------------------------------------------------------------------ */

{
  const dir = tmpdir("t726-exclude-");
  fs.writeFileSync(path.join(dir, "kept.mjs"), "export const a = 1;\n");
  fs.writeFileSync(path.join(dir, "withheld.mjs"), "export const b = 2;\n");

  const dest = path.join(dir, "fixture");
  const copied = copyToolchainInto(dest, { dir, exclude: ["withheld.mjs"] });

  check(
    "an excluded file is withheld and nothing else is",
    copied.includes("kept.mjs") &&
      !copied.includes("withheld.mjs") &&
      !fs.existsSync(path.join(dest, "withheld.mjs")),
    copied.join(", "),
  );

  check(
    "the fixture reports exactly the withheld file as missing",
    missingToolchainFiles(dest, dir).join(",") === "withheld.mjs",
    missingToolchainFiles(dest, dir).join(","),
  );

  // An exclusion that names nothing withholds nothing. Left silent, a renamed
  // module would turn a case that tests an absence into a case that tests the
  // ordinary path while still reading as if it tested the absence.
  let threw = false;
  try {
    copyToolchainInto(path.join(dir, "fixture2"), { dir, exclude: ["never-existed.mjs"] });
  } catch (error) {
    threw = /never-existed\.mjs/.test(String(error.message));
  }
  check("excluding a file that does not exist is refused", threw);

  fs.rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 9-11. THE KNOWN POSITIVE, replayed on the real toolchain.                */
/*                                                                          */
/* `cli-entry.test.mjs` on `main` copied exactly these three files.         */
/* `queue-provenance.mjs` reaches `build-execution-queue.mjs` through a      */
/* sibling PATH, not an import, so nothing throws — the verdict just         */
/* silently changes. Over a queue file that exists, the repo directory said   */
/* `unstamped` and that copy said `generator_missing`.                       */
/* ------------------------------------------------------------------------ */

{
  const root = tmpdir("t726-known-positive-");
  const queue = path.join(root, "EXECUTION_QUEUE.md");
  fs.writeFileSync(queue, "# Execution queue\n\n| id | lane |\n|---|---|\n");

  const handList = path.join(root, "hand-list");
  fs.mkdirSync(handList);
  for (const name of ["cli-entry.mjs", "queue-provenance.mjs", "worktree-retention.mjs"]) {
    fs.copyFileSync(path.join(HERE, name), path.join(handList, name));
  }

  const declared = path.join(root, "declared");
  copyToolchainInto(declared);

  const verdictFrom = (dir) => {
    const r = run(path.join(dir, "queue-provenance.mjs"), ["--queue", queue, "--json"], root);
    const match = /"verdict":\s*"([a-z_]+)"/.exec(r.stdout);
    return match ? match[1] : `NO_VERDICT(status=${r.status})`;
  };

  const repoVerdict = verdictFrom(HERE);
  const handVerdict = verdictFrom(handList);
  const declaredVerdict = verdictFrom(declared);

  check(
    "the repo directory reaches its default generator and reports on the queue",
    repoVerdict === "unstamped",
    `verdict=${repoVerdict}`,
  );

  check(
    "THE KNOWN POSITIVE: the hand-list fixture silently returns a different verdict",
    handVerdict === "generator_missing" && handVerdict !== repoVerdict,
    `hand-list=${handVerdict} repo=${repoVerdict}\n` +
      "nothing threw; queue-provenance.mjs names build-execution-queue.mjs by path, not by import",
  );

  check(
    "THE ACCEPTANCE: a fixture given the toolchain agrees with the repo directory",
    declaredVerdict === repoVerdict && missingToolchainFiles(declared).length === 0,
    `declared=${declaredVerdict} repo=${repoVerdict} missing=${missingToolchainFiles(declared).join(",")}`,
  );

  fs.rmSync(root, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 12-15. THE ACCEPTANCE THIS ITEM EXISTS FOR.                              */
/*                                                                          */
/* Add a real module to a copy of this directory, make two real executables  */
/* import it, and run each sibling suite from that copy. A suite whose       */
/* fixture is built from a hand-written list cannot see the new module and   */
/* fails — which is exactly what T-720 and T-723 did, twice, by accident.    */
/* ------------------------------------------------------------------------ */

{
  const root = tmpdir("t726-new-sibling-");
  const dir = path.join(root, "exec");
  fs.mkdirSync(dir);

  for (const entry of fs.readdirSync(HERE, { withFileTypes: true })) {
    if (entry.isFile()) fs.copyFileSync(path.join(HERE, entry.name), path.join(dir, entry.name));
  }

  fs.writeFileSync(
    path.join(dir, "probe-sibling.mjs"),
    "// Added by toolchain-manifest.test.mjs. A module that did not exist when\n" +
      "// any fixture list was written — which is the only thing under test.\n" +
      "export const PROBE_SIBLING = true;\n",
  );

  // A top-level static import, inserted ahead of each module's first import so
  // it loads before anything else can fail for another reason.
  const addImport = (name) => {
    const file = path.join(dir, name);
    const source = fs.readFileSync(file, "utf8");
    const at = source.indexOf("\nimport ");
    if (at < 0) throw new Error(`no import to anchor to in ${name}`);
    fs.writeFileSync(
      file,
      `${source.slice(0, at + 1)}import "./probe-sibling.mjs";\n${source.slice(at + 1)}`,
    );
  };
  addImport("queue-provenance.mjs");
  addImport("build-source-board.mjs");

  for (const suite of [
    "build-execution-queue.test.mjs",
    "build-source-board.test.mjs",
    "queue-provenance.test.mjs",
    "cli-entry.test.mjs",
  ]) {
    const r = run(path.join(dir, suite), [], dir);
    const tail = `${r.stdout}\n${r.stderr}`.trim().split("\n").slice(-6).join("\n");
    check(
      `THE ACCEPTANCE: ${suite} survives a module added to the toolchain`,
      r.status === 0,
      `status=${r.status}\n${tail}\n` +
        "a fixture built from a hand-written list cannot see probe-sibling.mjs",
    );
  }

  fs.rmSync(root, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 16-17. This module is a CLI in this directory, so it owes the T-723 rule. */
/* ------------------------------------------------------------------------ */

{
  const root = tmpdir("t726-entry-");
  const realDir = path.join(root, "real");
  fs.mkdirSync(realDir);
  for (const name of ["cli-entry.mjs", "toolchain-manifest.mjs"]) {
    fs.copyFileSync(path.join(HERE, name), path.join(realDir, name));
  }
  const linkDir = path.join(root, "linked");
  fs.symlinkSync(realDir, linkDir);

  const viaLink = run(path.join(linkDir, "toolchain-manifest.mjs"), ["--json"], root);
  check(
    "the CLI runs when invoked through a symlinked path",
    viaLink.status === 0 && /"files"/.test(viaLink.stdout),
    `status=${viaLink.status} stdout=${viaLink.stdout.slice(0, 200)}\n` +
      "exit 0 with no output is the T-723 defect, not a pass",
  );

  const importer = path.join(root, "importer.mjs");
  fs.writeFileSync(
    importer,
    `import "${path.join(linkDir, "toolchain-manifest.mjs")}";\nconsole.log("IMPORTED_CLEANLY");\n`,
  );
  const imported = run(importer, [], root);
  check(
    "importing the module does not run its CLI",
    imported.status === 0 && imported.stdout.trim() === "IMPORTED_CLEANLY",
    `status=${imported.status} stdout=${imported.stdout.slice(0, 200)}`,
  );

  fs.rmSync(root, { recursive: true, force: true });
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);

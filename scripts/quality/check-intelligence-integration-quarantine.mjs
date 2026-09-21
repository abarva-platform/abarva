#!/usr/bin/env node
/**
 * Keep the Intelligence integration quarantine list honest.
 *
 * `src/__tests__/integration/intelligence/` held 33 suites that no GitHub
 * workflow ran. The "Changed integration suites have a CI owner" gate only
 * fires on a suite a PR *changes*, so the rest sat unexecuted — and running the
 * directory for the first time found 26 red suites and 133 failing assertions.
 *
 * The triage found one cause, not 133 problems: 131 of those 133 are a source
 * file read as TEXT that does not exist. So the 25 excluded suites are stale
 * contracts for a component and route tree that was replaced, not defects in
 * shipping code — which is exactly the kind of exclusion that becomes permanent
 * because nobody ever re-measures it.
 *
 * A list of names in a file is not a control. This checks the four ways it
 * rots, and the third one is the one that matters:
 *
 *   1. A named suite no longer exists — a stale exclusion that excludes nothing
 *      while hiding that the list was never revisited.
 *   2. A suite is named twice.
 *   3. THE REASON EXPIRED. Every entry names the paths whose absence is why it
 *      is quarantined. If one of those files comes back, the suite may well
 *      pass again and must be re-measured — so this fails and says so. That
 *      makes the list self-clearing rather than self-perpetuating, and it is a
 *      check that can actually fail: create any named file and this exits 1.
 *   4. The list has grown past the size it was created at. Appending to a
 *      quarantine is how a temporary carve-out becomes the standard.
 *   5. WHAT THE SUITE COVERS IS DECLARED AND RE-MEASURED. Batch 1 of the
 *      clear-out found that the cheap repair — delete the stale `describe`,
 *      keep the rest — would have manufactured coverage of unreachable code in
 *      all nine cases, and eight modules went with their tests. That lesson
 *      lived in `clearedBatches` as prose, which the next agent has to read,
 *      believe, and re-derive by hand. Now every entry declares the modules it
 *      imports and what happens to each when the suite goes, and this
 *      recomputes all of it: a module that gains a product importer or a live
 *      sibling test flips class and the check fails, naming the entry.
 *
 * THE LIMIT OF CONTROL 5, STATED RATHER THAN DISCOVERED. It is a ONE-HOP
 * reader over import and export statements with line comments stripped. It
 * does not resolve a transitive chain, a dynamic `import()`, a `require` built
 * from a variable, or a path that only a bundler alias reaches. It is
 * deliberately not a second reachability engine — `docs/architecture/
 * orphaned-lib-modules.json` is that — because the question here is narrower
 * and answerable exactly: does anything OTHER than this suite and the modules
 * going with it reach this file. Where the one hop is not enough, the answer
 * is `kept-*`, which is the safe direction: it refuses a deletion rather than
 * waving one through.
 *
 * `alsoIgnored` is a second, separate list: full path fragments for red files
 * that the workflow command's path regex sweeps in from OUTSIDE the suite
 * directory. Until backlog item T-044 it was read by the ignore-args generator
 * and by nothing else — no shape, no reason, no owner, and no check that the
 * file it named still existed. Two bare strings sat in it untriaged. It is
 * empty now, and the rules below are what has to be true of anything added to
 * it: an object naming the repo-relative path, why it is out, and the item that
 * owns getting it back in.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");
const SUITE_DIR = path.join(REPO, "src/__tests__/integration", "intelligence");
const LIST = path.join(HERE, "intelligence-integration-quarantine.json");

/**
 * The list length. 25 when the directory was first wired on 2026-09-19; 16 once
 * backlog item T-043 batch 1 cleared the nine IntelligenceLensTabs suites the
 * same day.
 *
 * This is a RATCHET, not headroom: the check below fails when the list is
 * shorter than this number as well as when it is longer. A ceiling left above
 * the list after entries are cleared hands the next nine exclusions a silent
 * pass, which is the same carve-out-by-drift the reason-expiry control exists
 * to stop — the size would then only be re-measured by whoever happened to
 * exceed the old high-water mark. Moving it is the visible decision in both
 * directions.
 */
const CEILING = 15;


// ---------------------------------------------------------------------------
// Control 5 — what each quarantined suite covers
// ---------------------------------------------------------------------------

/** The three things that can happen to a module when its suite is deleted. */
export const COVER_STATUSES = Object.freeze([
  // Nothing else reaches it. It goes in the same change, as the eight
  // `*-view.ts` modules did in batch 1.
  "goes-with-the-suite",
  // A suite that is NOT quarantined imports it, so it is under live CI
  // coverage; deleting it would delete assertions that run today.
  "kept-live-test",
  // A non-test file that is not itself going imports it. Deliberately NOT a
  // claim that product code reaches it — see the limit note in the header.
  "kept-other-importer",
]);

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs"];

/**
 * Alias specifiers from `import`/`export … from '…'` statements only.
 *
 * Reading every quoted `@/…` in the file would be wrong here in a way that
 * matters: three of these suites assert on source TEXT, so
 * `expect(src).not.toContain("from '@/lib/auth'")` and
 * `'src/components/intelligence/SolutionsIndexPage.tsx'` appear as string
 * literals. A scanner that counted those would report a suite as covering a
 * module it never loads — and two of them name files that were deleted, so it
 * would report coverage of nothing at all.
 */
export function importedModulePaths(text) {
  const code = text
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const found = [];
  const statement = /(?:^|\n)\s*(?:import|export)\b[\s\S]*?\bfrom\s+["']((?:@\/|\.\.?\/)[^"']+)["']/g;
  let match;
  while ((match = statement.exec(code)) !== null) {
    if (!found.includes(match[1])) found.push(match[1]);
  }
  return found;
}

/**
 * `@/lib/x` or `./x` -> `src/lib/x.ts`, or null when nothing answers to it.
 *
 * Relative specifiers are here because leaving them out was not a theoretical
 * gap: the first run of this classifier put `seed-signals-manual.ts` in the
 * delete column, and three surviving modules — `indexer.ts`, `loader.ts` and
 * `types.ts` — import it as `./seed-signals-manual`. An alias-only reader had
 * measured a module as unreachable while its neighbours were using it.
 */
export function resolveSpecifier(repo, specifier, fromFile) {
  const base = specifier.startsWith("@/")
    ? specifier.replace(/^@\//, "src/")
    : normalizeRelative(`${fromFile.split("/").slice(0, -1).join("/")}/${specifier}`);
  const candidates = [base, ...SOURCE_EXTENSIONS.flatMap((e) => [base + e, `${base}/index${e}`])];
  return candidates.find((candidate) => repo.exists(candidate)) ?? null;
}

function normalizeRelative(joined) {
  const out = [];
  for (const segment of joined.split("/")) {
    if (segment === "." || segment === "") continue;
    if (segment === "..") out.pop();
    else out.push(segment);
  }
  return out.join("/");
}

const isTestFile = (rel) =>
  /(^|\/)__tests__\//.test(rel) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(rel);

/** file -> the module paths it imports, built once and cached on the repo. */
function importIndex(repo) {
  if (repo.__importIndex) return repo.__importIndex;
  const index = new Map();
  for (const file of repo.files()) {
    const modules = new Set();
    for (const specifier of importedModulePaths(repo.read(file))) {
      const resolved = resolveSpecifier(repo, specifier, file);
      if (resolved) modules.add(resolved);
    }
    index.set(file, modules);
  }
  Object.defineProperty(repo, "__importIndex", { value: index, enumerable: false });
  return index;
}

/**
 * What happens to `modulePath` when `suitePath` is deleted.
 *
 * `doomedModules` is the union of every module the list declares as going with
 * its suite. It is what stops a cluster from vouching for itself: eight of the
 * nine batch-1 modules imported each other, so "something imports it" was true
 * of nearly all of them and meant nothing.
 */
export function classifyCoveredModule(repo, modulePath, options) {
  const { suitePath, quarantinedSuiteBasenames, doomedModules } = options;
  const index = importIndex(repo);
  let liveTest = false;
  let survivingSource = false;
  for (const [file, modules] of index) {
    if (file === suitePath || file === modulePath) continue;
    if (!modules.has(modulePath)) continue;
    if (isTestFile(file)) {
      if (!quarantinedSuiteBasenames.has(file.split("/").pop())) liveTest = true;
    } else if (!doomedModules.has(file)) {
      survivingSource = true;
    }
  }
  if (survivingSource) return "kept-other-importer";
  if (liveTest) return "kept-live-test";
  return "goes-with-the-suite";
}

/**
 * Re-measure every `covers` claim in the list. Returns the problems; empty is
 * clean. Called with no arguments it reads the committed list and the real
 * repository, which is how the sibling `node --test` file pins it.
 */
export function evaluateCoverageClaims(repo, entries, options) {
  const r = repo ?? realRepo();
  const list = entries ?? JSON.parse(readFileSync(LIST, "utf8")).quarantined;
  const suiteDirRelative =
    options?.suiteDirRelative ?? "src/__tests__/integration/intelligence";
  const quarantinedSuiteBasenames =
    options?.quarantinedSuiteBasenames ?? allQuarantinedSuiteBasenames();
  const problems = [];

  const doomedModules = new Set();
  for (const entry of list) {
    for (const cover of entry.covers ?? []) {
      if (cover?.status === "goes-with-the-suite" && typeof cover.module === "string") {
        doomedModules.add(cover.module);
      }
    }
  }

  for (const entry of list) {
    const suitePath = `${suiteDirRelative}/${entry.suite}`;
    if (!r.exists(suitePath)) continue; // control 1 already reports this
    if (!Array.isArray(entry.covers)) {
      problems.push(
        `${entry.suite} declares no "covers". Every entry must list the modules ` +
          "it imports and what happens to each when it is cleared — an empty " +
          "array when it imports none. Batch 1 is why: the cheap repair looked " +
          "safe until the modules were counted.",
      );
      continue;
    }

    const actual = importedModulePaths(r.read(suitePath))
      .map((specifier) => resolveSpecifier(r, specifier, suitePath))
      .filter(Boolean);
    const declared = entry.covers.map((c) => c?.module);

    for (const modulePath of actual) {
      if (!declared.includes(modulePath)) {
        problems.push(
          `${entry.suite} imports ${modulePath} but its "covers" does not list ` +
            "it. Classify it before clearing the entry, or the module's fate is " +
            "decided by whoever forgets it.",
        );
      }
    }

    for (const cover of entry.covers) {
      if (typeof cover?.module !== "string" || !COVER_STATUSES.includes(cover?.status)) {
        problems.push(
          `${entry.suite} has a malformed "covers" entry ${JSON.stringify(cover)}. ` +
            `Each needs a repo-relative "module" and a "status" of ${COVER_STATUSES.join(", ")}.`,
        );
        continue;
      }
      if (!actual.includes(cover.module)) {
        problems.push(
          `${entry.suite} declares it covers ${cover.module}, which it does not ` +
            "import. Remove the line — a covers list that names modules the suite " +
            "never loads overstates what clearing it would cost.",
        );
        continue;
      }
      const measured = classifyCoveredModule(r, cover.module, {
        suitePath,
        quarantinedSuiteBasenames,
        doomedModules,
      });
      if (measured !== cover.status) {
        problems.push(
          `${entry.suite} records ${cover.module} as "${cover.status}", but it ` +
            `measures as "${measured}" today. Re-read before clearing: the ` +
            "classification is what decides whether the module goes with the suite.",
        );
      }
    }
  }
  return problems;
}

/** Every suite basename excluded by ANY of the four quarantine lists. */
function allQuarantinedSuiteBasenames() {
  const names = new Set();
  for (const area of ["intelligence", "qa", "admin", "source"]) {
    const file = path.join(HERE, `${area}-integration-quarantine.json`);
    if (!existsSync(file)) continue;
    for (const entry of JSON.parse(readFileSync(file, "utf8")).quarantined ?? []) {
      const suite = typeof entry === "string" ? entry : entry?.suite;
      if (typeof suite === "string") names.add(suite.split("/").pop());
    }
  }
  return names;
}

/** The real tree, behind the same tiny interface the unit cases inject. */
function realRepo() {
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(path.join(REPO, dir), { withFileTypes: true })) {
      if (name.name === "node_modules" || name.name.startsWith(".")) continue;
      const rel = `${dir}/${name.name}`;
      if (name.isDirectory()) walk(rel);
      else if (SOURCE_EXTENSIONS.some((e) => rel.endsWith(e))) files.push(rel);
    }
  };
  walk("src");
  return {
    exists: (rel) => existsSync(path.join(REPO, rel)),
    read: (rel) => (existsSync(path.join(REPO, rel)) ? readFileSync(path.join(REPO, rel), "utf8") : ""),
    files: () => files,
  };
}

// ---------------------------------------------------------------------------

function main() {
  const {
    quarantined,
    alsoIgnored = [],
    alsoIgnoredCeiling = 0,
  } = JSON.parse(readFileSync(LIST, "utf8"));
  const problems = [];

  for (const entry of quarantined) {
    if (typeof entry?.suite !== "string" || !Array.isArray(entry?.missing)) {
      problems.push(
        `Malformed entry ${JSON.stringify(entry)}. Every entry needs a "suite" ` +
          'filename and a "missing" list of the paths whose absence is its reason.',
      );
      continue;
    }

    if (!existsSync(path.join(SUITE_DIR, entry.suite))) {
      problems.push(
        `${entry.suite} is quarantined but no longer exists. Remove it from the ` +
          "list — a stale exclusion hides that the list was never revisited.",
      );
    }

    if (entry.missing.length === 0) {
      problems.push(
        `${entry.suite} names no missing path, so nothing can ever expire its ` +
          "exclusion. Name the paths it reads that do not exist.",
      );
    }

    const returned = entry.missing.filter((rel) => existsSync(path.join(REPO, rel)));
    if (returned.length > 0) {
      problems.push(
        `${entry.suite} is excluded because ${entry.missing.join(", ")} do not ` +
          `exist, but ${returned.join(", ")} now does. Re-run the suite: if it ` +
          "passes, delete its entry here; if it still fails, it fails for a new " +
          "reason that has to be written down.",
      );
    }
  }

  // Control 5. Recomputed against the real tree on every run, so a module that
  // gains a product importer or a live sibling test flips class and fails here.
  problems.push(...evaluateCoverageClaims(undefined, quarantined, undefined));

  const seen = new Set();
  for (const { suite } of quarantined) {
    if (seen.has(suite)) problems.push(`${suite} appears more than once in the quarantine list.`);
    seen.add(suite);
  }

  for (const entry of alsoIgnored) {
    if (
      typeof entry?.path !== "string" ||
      typeof entry?.reason !== "string" ||
      typeof entry?.owner !== "string" ||
      entry.reason.trim() === "" ||
      entry.owner.trim() === ""
    ) {
      problems.push(
        `Malformed alsoIgnored entry ${JSON.stringify(entry)}. Every entry needs ` +
          'a repo-relative "path", a "reason" it is excluded, and an "owner" backlog ' +
          "item that gets it back in. A bare string is how an exclusion loses " +
          "the argument for its own existence.",
      );
      continue;
    }

    if (!existsSync(path.join(REPO, entry.path))) {
      problems.push(
        `alsoIgnored names ${entry.path}, which does not exist. Remove it — an ` +
          "exclusion that excludes nothing still reads like a known problem.",
      );
    }
  }

  if (alsoIgnored.length > alsoIgnoredCeiling) {
    problems.push(
      `alsoIgnored holds ${alsoIgnored.length} paths; the ceiling is ` +
        `${alsoIgnoredCeiling}. These are files OUTSIDE the suite directory that ` +
        "the command's path regex sweeps in. Triage the file or narrow the " +
        "command, and raise alsoIgnoredCeiling in the list with a reason if " +
        "neither is possible — so growing this is a visible decision too.",
    );
  }

  if (quarantined.length > CEILING) {
    problems.push(
      `The quarantine holds ${quarantined.length} suites; the ceiling is ${CEILING}. ` +
        "Rewrite the suite against the surface that ships instead of excluding it, " +
        "or raise CEILING in this file with a reason — so growing the carve-out is " +
        "a visible decision.",
    );
  } else if (quarantined.length < CEILING) {
    problems.push(
      `The quarantine holds ${quarantined.length} suites but CEILING is still ` +
        `${CEILING}, so ${CEILING - quarantined.length} slot(s) of headroom were ` +
        "just created by clearing entries. A ceiling that stays above the list is " +
        `not a ratchet: the next ${CEILING - quarantined.length} exclusion(s) would ` +
        `pass this check silently. Lower CEILING to ${quarantined.length} in the ` +
        "same change that removes the entries.",
    );
  }

  if (problems.length > 0) {
    console.error("Intelligence integration quarantine list needs attention:\n");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  const total = readdirSync(SUITE_DIR).filter((n) =>
    /\.(test|spec)\.[cm]?[jt]sx?$/.test(n),
  ).length;
  const watched = new Set(quarantined.flatMap((e) => e.missing));
  const covers = quarantined.flatMap((e) => e.covers ?? []);
  const covered = new Set(covers.map((c) => c.module));
  const goesWithSuite = new Set(
    covers.filter((c) => c.status === "goes-with-the-suite").map((c) => c.module),
  ).size;
  console.log(
    `Intelligence integration quarantine is clean: ${quarantined.length} excluded of ` +
      `${total} suites in the directory; ${total - quarantined.length} run on every PR. ` +
      `${watched.size} retired paths are watched for return. ` +
      `${covered.size} covered modules are classified, ${goesWithSuite} of which go with their suite. ` +
      `${alsoIgnored.length} swept-in sibling paths are excluded (ceiling ${alsoIgnoredCeiling}).`,
  );
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();

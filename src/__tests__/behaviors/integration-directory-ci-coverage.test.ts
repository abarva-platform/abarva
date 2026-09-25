import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
  isIntegrationTestRegistered,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

/**
 * `src/__tests__/integration/source` held 92 suites that no workflow ran. It was
 * found by accident — a pull request added two suites there and the "changed
 * integration suites have a CI owner" gate blocked it, because that gate only
 * ever fires on a suite the current pull request *changes*. Every untouched
 * suite sat unexecuted indefinitely.
 *
 * Wiring that one directory did not answer the question it raised: how much of
 * the rest of the integration tree is in the same position. Measured on
 * `2a1a87dd0`, through the census's own resolver rather than by reading YAML:
 * **467 integration suites exist, 172 were reached by a workflow, 295 by
 * nothing**, across 21 leaf directories with zero coverage. The directory that
 * revealed the blind spot was a third of it.
 *
 * These cases hold two separate things, and the second is the one that lasts:
 *
 *   1. the directories this repository claims to run really are reached — proved
 *      through the same four-hop resolver the census uses, never by searching
 *      the workflow file for a string. A wrapper script that shells out to jest
 *      satisfies a string search and registers nothing; that exact draft was
 *      written and discarded when the `source` directory was wired; and
 *   2. no *new* integration directory joins the dark set. A ratchet, not a
 *      floor: wiring one of the named twelve is always allowed and needs no
 *      edit here, while adding a twenty-second dark directory fails.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const INTEGRATION_ROOT = "src/__tests__/integration";
/**
 * Directories wired WITH A QUARANTINE: the workflow names the directory, and a
 * generated `--testPathIgnorePatterns` list holds named red suites out of the
 * run. Each carries its own list, and each is held to the same enumeration as
 * the un-quarantined directories below.
 *
 * `source` lives in its own workflow. `intelligence` is wired as a second step
 * inside `integration-suites.yml`, because folding its exclusion flags into
 * that workflow's green command would apply an Intelligence-shaped ignore list
 * to every other directory's run.
 *
 * `excludedRootFiles` is the enumeration that matters. A jest path argument is
 * a regex against the full path, so naming a directory also selects loose root
 * files whose names start with it. Each such file has exactly two acceptable
 * states — excluded by the workflow's own ignore args, or registered with the
 * visibility gate — and a NEW one has been measured by nobody, so it fails the
 * case below until somebody runs it and decides.
 */
const QUARANTINED_WIRED_DIRECTORIES = [
  {
    directory: "source",
    workflow: ".github/workflows/source-integration.yml",
    ignoreArgsScript: "scripts/quality/source-integration-ignore-args.mjs",
    // Was `["source-chat-shape.test.ts"]`. That file is a loose root file
    // swept in by the `source` directory pattern, and it sat in the FIRST
    // acceptable state — excluded by the workflow's own ignore args — because
    // it was red on the Brief C vendor-shortlist shaping contract. C-502 fixed
    // the shaper, so the quarantine ratchet required the entry to go; the file
    // is now named by exact path in the same workflow's command, which is the
    // SECOND acceptable state. Empty here because nothing is in the first, the
    // same move T-044 made for the two Intelligence root files.
    excludedRootFiles: [],
  },
  {
    // 2026-09-19 (T-032). 51 suites, of which one workflow reached one file by
    // name. 12 red on first run; 22 of the 24 failing assertions were repaired
    // and 2 suites are excluded because each found something real that needs a
    // product decision - U-008 (palette drift) and U-009 (two merged decisions
    // that disagree on admin chrome vocabulary).
    //
    // `excludedRootFiles` is empty and that is the SECOND acceptable state, not
    // an oversight: naming this directory also selects the loose root file
    // `admin-context-uploads-tabs.test.tsx`, which is green and is already
    // registered by exact path in the same workflow's green command. It runs
    // twice in that workflow as a result. Excluding it instead would take a
    // genuinely covered file out of the run to tidy a list.
    directory: "admin",
    workflow: ".github/workflows/integration-suites.yml",
    ignoreArgsScript: "scripts/quality/admin-integration-ignore-args.mjs",
    excludedRootFiles: [],
  },
  {
    // 2026-09-19 (T-500) wired this directory with a six-suite quarantine but
    // did not list it here, so every case in this file that iterates the
    // quarantine-wired directories skipped it. It was invisible while the
    // census counted an excluded suite as covered; correcting that (T-045,
    // coverage-census section) made the omission observable.
    //
    // `excludedRootFiles` is empty because no loose root file begins with
    // `qa` — checked by listing the integration root, not assumed.
    directory: "qa",
    workflow: ".github/workflows/integration-suites.yml",
    ignoreArgsScript: "scripts/quality/qa-integration-ignore-args.mjs",
    excludedRootFiles: [],
  },
  {
    directory: "intelligence",
    workflow: ".github/workflows/integration-suites.yml",
    ignoreArgsScript:
      "scripts/quality/intelligence-integration-ignore-args.mjs",
    // Both were red and untriaged when the directory was wired, and both were
    // named in the quarantine's `alsoIgnored` rather than running. Backlog item
    // T-044 triaged them: both were stale contracts, both are repaired, and
    // both are now named in the workflow command so they are registered with
    // the visibility gate as well as selected by the directory pattern. That is
    // the second of this case's two acceptable states, and the enumeration is
    // empty because nothing is in the first.
    excludedRootFiles: [],
  },
] as const;

type Census = {
  counts: { indeterminateInvocations: number };
  partiallyCoveredDirectories: {
    directory: string;
    testFiles: number;
    coveredTestFiles: number;
  }[];
  uncoveredDirectories: {
    directory: string;
    testFiles: number;
    coveredTestFiles: number;
  }[];
};

/**
 * Directories wired by `.github/workflows/integration-suites.yml`. Each one was
 * run in full on `2a1a87dd0` and passed with no exclusions, which is why none of
 * them needs a quarantine list the way `source` does.
 */
/**
 * Every directory name a workflow wires, from BOTH workflows.
 *
 * `WIRED_DIRECTORIES` is what `integration-suites.yml` runs with no
 * exclusions; `QUARANTINED_WIRED_DIRECTORIES` is what a workflow runs with a
 * quarantine, which today is its own file. The prefix case below used to
 * iterate only the first, so a directory colliding with a quarantine-wired
 * name was not checked for the prefix hazard at all.
 *
 * It was still caught — by the enumeration case, incidentally — and that is
 * the problem worth fixing rather than the coverage. A directory swept in
 * under a quarantine-wired name reported *"the enumeration is out of date"*,
 * which sends the reader to update a list. The actual hazard is that a stray
 * directory silently adopts every suite written in it afterwards, and the
 * message has to say so or the next person fixes the symptom.
 *
 * Measured: creating a directory colliding with a `WIRED_DIRECTORIES` name
 * failed three cases including the prefix one; colliding with a
 * quarantine-wired name failed two, and the prefix case was not among them.
 */
const ALL_WIRED_DIRECTORY_NAMES: string[] = [];

const WIRED_DIRECTORIES = [
  "architecture",
  "corpus",
  "data-trust",
  "demo",
  "deployment",
  "engagement",
  "knowledge",
  "nexus",
  "observability",
  "programs",
  "security",
  "sentinel",
  "setup",
  "solutions",
  "story-pack",
  "tenants",
] as const;

/**
 * Directories whose suites are wired by EXACT FILE PATH rather than by naming
 * the directory, with the reason each one cannot be named as a directory.
 *
 * `src/__tests__/integration/agent` as a jest path argument is a regex against
 * the full path, so it also selects `…/integration/agents/` — a different
 * directory, five of whose eight suites are red — and the loose root file
 * `agent-column-agent-answer.test.ts`. Naming the one suite it holds runs it
 * without dragging either in. The cost is that a NEW suite added to `agent/`
 * would not run; the ratchet at the bottom of this file is what catches that,
 * because the directory drops back to partial coverage the moment a second
 * suite lands.
 */
const DIRECTORIES_WIRED_BY_FILE: Record<string, readonly string[]> = {
  agent: ["src/__tests__/integration/agent/agent1-foundation.test.ts"],
};

/**
 * Loose suites directly under `src/__tests__/integration` that were measured
 * and explicitly named in the workflow because the integration root itself is
 * not a safe ownership shape. Naming the root would also select every red
 * subdirectory below it.
 */
const ROOT_FILES_WIRED_BY_FILE = [
  "src/__tests__/integration/admin-context-uploads-tabs.test.tsx",
  "src/__tests__/integration/agent-column-agent-answer.test.ts",
  "src/__tests__/integration/app-rail-home-nav.test.tsx",
  "src/__tests__/integration/app-topbar-prefetch-guard.test.tsx",
  "src/__tests__/integration/app-topbar-preserve-tenant-name.test.ts",
  "src/__tests__/integration/ask-anything-bar-agent-answer.test.tsx",
  "src/__tests__/integration/atlas-page-state-timeout.test.ts",
  "src/__tests__/integration/email-code-sign-in-panel.test.tsx",
  "src/__tests__/integration/evidence-registry.test.ts",
  "src/__tests__/integration/learn-welcome-cxo-toggle.test.tsx",
  "src/__tests__/integration/pack-j-realistic-portfolio.test.ts",
  "src/__tests__/integration/pattern-deliverable-api.test.ts",
  "src/__tests__/integration/shell-topbar-auth.test.tsx",
  "src/__tests__/integration/sign-in-route-contract.test.ts",
  "src/__tests__/integration/strategic-moves-chat-shape.test.ts",
  "src/__tests__/integration/supabase.test.ts",
  "src/__tests__/integration/tenant-empty-states.test.tsx",
  "src/__tests__/integration/tower-p6-handoff-panel.test.ts",
] as const;

/**
 * Loose root suites that were measured and are still red. They stay out of the
 * green CI job until each has its own repair or quarantine item; wiring these
 * by naming the integration root would convert a known red set into ambient CI
 * noise.
 */
const KNOWN_DARK_ROOT_FILES = new Set([
  "src/__tests__/integration/atlas-ask-route.test.ts",
  "src/__tests__/integration/deliverable-render-contract.test.ts",
  "src/__tests__/integration/marketing-nav-dropdowns.test.tsx",
  "src/__tests__/integration/sign-in-shell.test.tsx",
  "src/__tests__/integration/source-chat-shape.test.ts",
]);

/**
 * The directories still reached by nothing, each with the reason it was not
 * wired in the same change. Every one of them failed when run on `2a1a87dd0`;
 * a red directory is wired by fixing it or by quarantining named suites with
 * named reasons, never by adding it here.
 *
 * `""` is the integration root itself — 45 loose suites directly under
 * `src/__tests__/integration`, 11 of which a workflow reaches. It cannot be
 * wired by naming the root, because that command would also run every red
 * subdirectory below it.
 */
const KNOWN_DARK_DIRECTORIES = new Set([
  // 2026-09-25 (T-477) - the integration ROOT itself, `""`, is no longer dark.
  // It was the last entry standing for a directory rather than a subdirectory:
  // the root is enumerated file by file, so it stayed partially covered for as
  // long as any root file was unwired. The last three were repaired and wired
  // into the integration-suites jest command, `integration-root-quarantine.json`
  // is empty and its ceiling is 0, so every root-level file runs on every PR
  // and the root is fully covered. Cleared here in the same change that did the
  // wiring, which is the friction the two-directional check below asks for and
  // the reason it found this one line rather than leaving it to mean nothing.
  // 2026-09-19 (T-032) - `admin` and `admin/data` are no longer dark. The
  // workflow names `src/__tests__/integration/admin` without a trailing slash,
  // which as a regex covers the `data/` subdirectory too, so wiring the parent
  // closed both. 49 of the directory's 51 suites now run on every PR.
  // 2026-09-19 (T-500) - `qa` is no longer dark. 37 suites and 915
  // assertions ran nowhere; the directory is now wired with 6 red suites
  // quarantined by name, and 31 suites run on every PR. Cleared here in the
  // same change that wired it, which the two-directional check below now
  // requires rather than merely hopes for.
  "agents",
  // 2026-09-19 (T-501) - `design` was already stale when the check below was
  // made two-directional: the workflow names src/__tests__/integration/design
  // in its green command and has for some time, while the entry sat here. It
  // was the first thing the new direction found, on its first run, which is
  // the argument for the change better than any reasoning about it.
  "ops",
]);

function runCensus(): Census {
  const stdout = execFileSync(
    process.execPath,
    [path.join(repoRoot, CENSUS_SCRIPT), "--json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(stdout.slice(stdout.indexOf("{"))) as Census;
}

/** Every directory under the integration root that directly holds a test file. */
function integrationLeafDirectories(): string[] {
  const found: string[] = [];
  const walk = (relative: string) => {
    const absolute = path.join(repoRoot, relative);
    const entries = readdirSync(absolute);
    if (entries.some((entry) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry))) {
      found.push(relative);
    }
    for (const entry of entries) {
      if (entry === "__snapshots__" || entry === "fixtures") continue;
      if (statSync(path.join(absolute, entry)).isDirectory())
        walk(path.join(relative, entry));
    }
  };
  walk(INTEGRATION_ROOT);
  return found;
}

const census = runCensus();
const zeroCoverage = new Set(
  census.uncoveredDirectories
    .filter(
      (row) =>
        row.directory === INTEGRATION_ROOT ||
        row.directory.startsWith(`${INTEGRATION_ROOT}/`),
    )
    .map((row) => row.directory),
);
const partialCoverage = new Map(
  census.partiallyCoveredDirectories
    .filter(
      (row) =>
        row.directory === INTEGRATION_ROOT ||
        row.directory.startsWith(`${INTEGRATION_ROOT}/`),
    )
    .map((row) => [row.directory, row]),
);

/**
 * Per quarantine-wired directory: how many of its suites its own ignore
 * patterns exclude, and how many the census says no workflow runs.
 *
 * A directory wired WITH a quarantine is partially covered by construction —
 * its named exclusions do not run, on purpose, with an owner and a reason each,
 * and the quarantine checker refuses an entry whose cause has been fixed. That
 * is not the state this file's dark-directory case is about, which is a
 * directory no workflow reaches at all. Until the census subtracted a command's
 * own `--testPathIgnorePatterns` these directories read as fully covered, so
 * the two states were never distinguishable here; now they are, and conflating
 * them would report four correctly-wired directories as dark.
 *
 * The exemption is earned rather than granted: the case below requires the two
 * numbers to agree, so a suite that stops running in one of these directories
 * for any reason other than its own quarantine entry still fails.
 */
function quarantineAccounting(): {
  directory: string;
  excludedBySelf: string[];
  unrun: number;
  testFiles: number;
}[] {
  return QUARANTINED_WIRED_DIRECTORIES.map(
    ({ directory, ignoreArgsScript }) => {
      const relative = `${INTEGRATION_ROOT}/${directory}`;
      const patterns = execFileSync(
        process.execPath,
        [path.join(repoRoot, ignoreArgsScript)],
        { cwd: repoRoot, encoding: "utf8" },
      )
        .trim()
        .split(/\s+/)
        .filter((token) => token !== "--testPathIgnorePatterns")
        .map((pattern) => new RegExp(pattern));

      const files = readdirSync(path.join(repoRoot, relative), {
        withFileTypes: true,
      })
        .filter(
          (entry) =>
            entry.isFile() && /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name),
        )
        .map((entry) => `${relative}/${entry.name}`)
        .sort();

      const row = partialCoverage.get(relative);
      return {
        directory,
        excludedBySelf: files.filter((file) =>
          patterns.some((pattern) => pattern.test(file)),
        ),
        unrun: row ? row.testFiles - row.coveredTestFiles : 0,
        testFiles: row?.testFiles ?? files.length,
      };
    },
  );
}

function expandedWorkflowCommands(): string[] {
  const workflowDir = path.join(repoRoot, ".github/workflows");
  return expandWorkflowCommands(
    readdirSync(workflowDir)
      .filter((name) => /\.ya?ml$/.test(name))
      .flatMap((name) =>
        extractWorkflowRunCommands(
          readFileSync(path.join(workflowDir, name), "utf8"),
        ),
      ),
    JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"))
      .scripts as Record<string, string>,
  );
}

ALL_WIRED_DIRECTORY_NAMES.push(
  ...WIRED_DIRECTORIES.filter((name) => !name.includes("/")),
  ...QUARANTINED_WIRED_DIRECTORIES.map((entry) => entry.directory),
);

describe("integration directories a workflow actually reaches", () => {
  it("resolves every wired directory through the real four-hop resolver, not a text search", () => {
    // If the census cannot resolve some Jest invocation to literal paths its
    // coverage answer is an upper bound, and these assertions would be reading
    // a guess. Fail loudly rather than pass on one.
    expect(census.counts.indeterminateInvocations).toBe(0);

    const unreached = WIRED_DIRECTORIES.filter((name) => {
      const directory = `${INTEGRATION_ROOT}/${name}`;
      return zeroCoverage.has(directory) || partialCoverage.has(directory);
    });
    expect(unreached).toEqual([]);
  });

  it("names each wired directory literally in a workflow command, so the visibility gate can see it", () => {
    const workflow = readFileSync(
      path.join(repoRoot, ".github/workflows/integration-suites.yml"),
      "utf8",
    );
    const runLines = workflow
      .split("\n")
      .filter((line) => /\bjest\b/.test(line))
      .join("\n");

    for (const name of WIRED_DIRECTORIES) {
      // Followed by whitespace or end of line: the visibility gate requires the
      // path to end the token, so a trailing slash would make it stop matching.
      expect(runLines).toMatch(
        new RegExp(`${INTEGRATION_ROOT}/${name}(?=\\s|$)`),
      );
    }
  });

  it("does not name the integration root as an ownership shortcut", () => {
    const commands = expandedWorkflowCommands().filter((command) =>
      /\b(?:npx\s+)?(?:jest|vitest|playwright)\b/.test(command),
    );

    const rootPattern = new RegExp(`${INTEGRATION_ROOT}(?=\\s|$)`);
    const rootOwners = commands.filter((command) => rootPattern.test(command));
    expect(rootOwners).toEqual([]);
  });

  it("records every extra path a wired directory's jest pattern also selects", () => {
    // A jest path argument is a regex tested against the full path, not a
    // directory handle. Naming `…/agent` also runs `…/agents`; naming
    // `…/programs` also runs the loose root file `…/programs-api-contracts.test.ts`.
    // Anchoring the pattern is not available — a trailing slash is exactly what
    // makes the visibility gate stop seeing the path — so the collisions are
    // enumerated and each one has to have been measured.
    const entries = readdirSync(path.join(repoRoot, INTEGRATION_ROOT));
    const collisions: string[] = [];
    for (const name of WIRED_DIRECTORIES) {
      for (const entry of entries) {
        if (entry === name || !entry.startsWith(name)) continue;
        collisions.push(entry);
      }
    }
    // The eight below are root-level suites the `programs` pattern also selects.
    // All eight were run on `2a1a87dd0` as part of the wired command and passed,
    // which is the only reason they are acceptable here: they are 8 of the 45
    // loose root suites, and they now run rather than not running. A NEW
    // colliding entry has been measured by nobody, so it fails this case until
    // somebody runs it and decides.
    expect(collisions.sort()).toEqual([
      // The `demo` pattern selects these three root-level suites. All three
      // were run on `66acc1a2a` as part of the wired command and pass;
      // `demo-code-sign-in-panel.test.ts` is one of the five this change
      // repaired, so it is measured rather than assumed.
      "demo-code-sign-in-panel.test.tsx",
      "demo-code-sign-in-route.test.ts",
      "demo-p0-graceful-degradation.test.ts",
      "programs-api-contracts.test.ts",
      "programs-demo-beats.test.ts",
      "programs-enhancement-seed-planner.test.ts",
      "programs-enhancement-seed-writer.test.ts",
      "programs-enhancement-spec.test.ts",
      "programs-nexus-ask-route.test.ts",
      "programs-nexus-free-text.test.ts",
      "programs-quality-gates.test.ts",
    ]);
  });

  it("every suite a wired pattern selects is also one the visibility gate can see", () => {
    // The runner and the gate do not use the same matching rule, and until this
    // case existed nothing said so.
    //
    //   jest  — a path argument is a regex against the full path, so
    //           `…/integration/demo` SELECTS `…/integration/demo-…test.tsx`.
    //   gate  — registers a suite by its exact path or by an ANCESTOR
    //           DIRECTORY. `…/integration/demo` is not an ancestor directory of
    //           that file; the only ancestor is the integration root, which no
    //           command names.
    //
    // A loose root suite picked up by a directory pattern therefore RUNS in CI
    // and is reported as having no CI owner at the same time. The eight
    // `programs-*` files were in exactly that state from the day the
    // directories were first wired: executing on every pull request, and
    // invisible to the gate, so anyone who edited one would have been blocked
    // by a gate that was wrong about its own repository. It stayed hidden
    // because the gate only fires on a suite the current pull request changes.
    //
    // The fix is to name those files in the command as well. This case is what
    // keeps the two sets agreeing, and it fails locally rather than in CI.
    const commands = expandedWorkflowCommands();

    const entries = readdirSync(path.join(repoRoot, INTEGRATION_ROOT));
    const selectedButInvisible: string[] = [];

    for (const name of WIRED_DIRECTORIES) {
      for (const entry of entries) {
        // Loose root FILES the directory pattern also selects. A colliding
        // directory is covered by the resolver cases above.
        if (entry === name || !entry.startsWith(name)) continue;
        if (!/\.tsx?$/.test(entry)) continue;

        const testPath = `${INTEGRATION_ROOT}/${entry}`;
        if (!isIntegrationTestRegistered(testPath, commands)) {
          selectedButInvisible.push(entry);
        }
      }
    }

    expect(selectedButInvisible.sort()).toEqual([]);
  });

  it("registers the measured green loose root suites by exact file path", () => {
    const commands = expandedWorkflowCommands();
    const missing = ROOT_FILES_WIRED_BY_FILE.filter(
      (file) => !isIntegrationTestRegistered(file, commands),
    );

    expect(missing).toEqual([]);
  });

  it("classifies every loose root suite as registered or measured-red", () => {
    const commands = expandedWorkflowCommands();
    const rootFiles = readdirSync(path.join(repoRoot, INTEGRATION_ROOT))
      .filter((entry) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry))
      .map((entry) => `${INTEGRATION_ROOT}/${entry}`)
      .sort();

    const unclassified = rootFiles.filter(
      (file) =>
        !isIntegrationTestRegistered(file, commands) &&
        !KNOWN_DARK_ROOT_FILES.has(file),
    );

    expect(rootFiles).toHaveLength(45);
    expect(unclassified).toEqual([]);
  });

  it("reaches a file-wired directory in full, and names the file so the gate sees it", () => {
    const workflow = readFileSync(
      path.join(repoRoot, ".github/workflows/integration-suites.yml"),
      "utf8",
    );
    const runLines = workflow
      .split("\n")
      .filter((line) => /\bjest\b/.test(line))
      .join("\n");

    for (const [name, files] of Object.entries(DIRECTORIES_WIRED_BY_FILE)) {
      const directory = `${INTEGRATION_ROOT}/${name}`;
      // Covered in full: naming every suite a directory holds is as good as
      // naming the directory, and it is what lets the ratchet below drop the
      // directory out of the dark set. If a second suite lands and is not named
      // here, the directory falls back to partial coverage and this fails.
      expect(
        zeroCoverage.has(directory) || partialCoverage.has(directory),
      ).toBe(false);

      const onDisk = readdirSync(path.join(repoRoot, directory))
        .filter((entry) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry))
        .map((entry) => `${directory}/${entry}`)
        .sort();
      expect(onDisk).toEqual([...files].sort());

      for (const file of files) {
        expect(runLines).toMatch(new RegExp(`${file}(?=\\s|$)`));
      }
      // The directory itself must NOT be named, or the collision it was wired
      // by file to avoid comes straight back.
      expect(runLines).not.toMatch(new RegExp(`${directory}(?=\\s|$)`));
    }
  });

  it("refuses a wired directory name that is a prefix of another integration directory", () => {
    // The collision case above enumerates loose root FILES a directory pattern
    // also selects. A colliding DIRECTORY is the dangerous half and nothing
    // covered it, because no wired name currently prefixes one: a stray file
    // runs once and is enumerated, while a stray directory silently adopts
    // every suite written in it afterwards. `agent`/`agents` is the live
    // example — five of `agents`' eight suites are red — and it is why `agent`
    // is wired by file path instead.
    const directories = readdirSync(path.join(repoRoot, INTEGRATION_ROOT), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    const colliding: string[] = [];
    for (const name of ALL_WIRED_DIRECTORY_NAMES) {
      for (const directory of directories) {
        if (directory === name || !directory.startsWith(name)) continue;
        colliding.push(`${name} -> ${directory}`);
      }
    }

    // Named, and named with the consequence: the failure has to say why a
    // colliding directory is worse than a colliding file, or it reads as a
    // list that needs updating.
    expect({
      hazard:
        "a wired name prefixes a directory, which silently adopts every suite written in it afterwards",
      colliding: colliding.sort(),
    }).toEqual({
      hazard:
        "a wired name prefixes a directory, which silently adopts every suite written in it afterwards",
      colliding: [],
    });
  });

  it("has an entry for every quarantine that exists on disk", () => {
    // T-500 wired a directory with a quarantine and did not add it here, so
    // every case that iterates this list skipped it from the day it landed.
    // Nothing said so, because the list is hand-maintained and nothing
    // derives it: the only thing standing between a wired quarantine and an
    // unchecked one was somebody remembering.
    //
    // Both directions. A quarantine with no entry means cases silently skip
    // a directory; an entry naming a script that does not exist means the
    // list describes a quarantine that was removed, and the cases iterating
    // it are asserting against nothing.
    const onDisk = readdirSync(path.join(repoRoot, "scripts/quality"))
      .filter((file) => file.endsWith("-integration-ignore-args.mjs"))
      .map((file) => `scripts/quality/${file}`)
      .sort();

    // The control: if this listing came back empty, the comparison below
    // would pass against a list that also happens to be empty.
    expect(onDisk.length).toBeGreaterThan(0);

    const listed = QUARANTINED_WIRED_DIRECTORIES.map(
      (entry) => entry.ignoreArgsScript,
    ).sort();

    expect({
      hazard:
        "a quarantine with no entry here is a directory every case in this file skips",
      scripts: listed,
    }).toEqual({
      hazard:
        "a quarantine with no entry here is a directory every case in this file skips",
      scripts: onDisk,
    });
  });

  it.each(QUARANTINED_WIRED_DIRECTORIES)(
    "holds the quarantined directory $directory to the same enumeration",
    ({
      directory: name,
      workflow: workflowPath,
      ignoreArgsScript,
      excludedRootFiles,
    }) => {
      // A directory wired WITH a quarantine is covered by nothing above: every
      // case in this file iterates WIRED_DIRECTORIES, which is the list of
      // directories `integration-suites.yml` runs with no exclusions at all.
      //
      // The item that asked for the first of these said nothing under the
      // integration root is prefixed by `source` today. That was not so —
      // `source-chat-shape.test.ts` sits at the root and the pattern
      // `…/integration/source` selects it, because a jest path argument is a
      // regex against the full path. It was found when the directory was wired
      // and handled by NAMING it in the quarantine's `alsoIgnored`, so it does
      // not run. That is a correct resolution held in place by nothing: delete
      // that entry and a red suite rejoins the lane from a path pattern nobody
      // would think to read. `intelligence` arrived with two of them.
      //
      // A colliding root FILE has two acceptable states and this case admits
      // both: excluded by the workflow's own ignore args (it does not run), or
      // registered with the visibility gate (it runs AND has a CI owner). The
      // state it refuses is the middle one — selected by the pattern, invisible
      // to the gate — which is where the eight `programs-*` suites sat for weeks.
      //
      // A colliding DIRECTORY is refused outright, for the reason given in the
      // case above: a stray file runs once and is enumerated, a stray directory
      // silently adopts every suite written in it afterwards.
      const workflow = readFileSync(path.join(repoRoot, workflowPath), "utf8");
      const runLines = workflow
        .split("\n")
        .filter((line) => /\bjest\b/.test(line))
        .join("\n");

      expect(runLines).toMatch(
        new RegExp(`${INTEGRATION_ROOT}/${name}(?=\\s|$)`),
      );

      // The real exclusion list, produced by the same script the workflow runs,
      // not a copy of it. A rewritten generator is exercised here rather than
      // described.
      const ignorePatterns = execFileSync(
        process.execPath,
        [path.join(repoRoot, ignoreArgsScript)],
        { cwd: repoRoot, encoding: "utf8" },
      )
        .trim()
        .split(/\s+/)
        .filter((token) => token !== "--testPathIgnorePatterns")
        .map((pattern) => new RegExp(pattern));

      const commands = expandWorkflowCommands(
        readdirSync(path.join(repoRoot, ".github/workflows"))
          .filter((entry) => /\.ya?ml$/.test(entry))
          .flatMap((entry) =>
            extractWorkflowRunCommands(
              readFileSync(
                path.join(repoRoot, ".github/workflows", entry),
                "utf8",
              ),
            ),
          ),
        JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"))
          .scripts as Record<string, string>,
      );

      const entries = readdirSync(path.join(repoRoot, INTEGRATION_ROOT), {
        withFileTypes: true,
      });
      const collidingDirectories: string[] = [];
      const excludedFromTheRun: string[] = [];
      const selectedButInvisible: string[] = [];

      for (const entry of entries) {
        if (entry.name === name || !entry.name.startsWith(name)) continue;
        if (entry.isDirectory()) {
          collidingDirectories.push(`${name} -> ${entry.name}`);
          continue;
        }
        if (!/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) continue;

        const testPath = `${INTEGRATION_ROOT}/${entry.name}`;
        if (ignorePatterns.some((pattern) => pattern.test(testPath))) {
          excludedFromTheRun.push(entry.name);
        } else if (!isIntegrationTestRegistered(testPath, commands)) {
          selectedButInvisible.push(entry.name);
        }
      }

      expect(collidingDirectories.sort()).toEqual([]);
      expect(selectedButInvisible.sort()).toEqual([]);
      // Enumerated rather than counted: a NEW colliding file has been measured
      // by nobody, so it fails here until somebody runs it and decides which of
      // the two acceptable states it belongs in.
      expect(excludedFromTheRun.sort()).toEqual([...excludedRootFiles].sort());
    },
  );

  it("accounts for every unrun suite in a quarantine-wired directory by its own quarantine", () => {
    // What earns those directories their exemption from the dark-directory
    // case below. Each is partially covered on purpose; this asserts that the
    // purpose is the whole of it. The two sides are derived independently — the
    // exclusion list from the generator the workflow itself runs, the unrun
    // count from the census — so a suite that stops running for any other
    // reason is a disagreement rather than a silence.
    const accounting = quarantineAccounting();
    expect(accounting).not.toHaveLength(0);

    for (const entry of accounting) {
      expect({
        directory: entry.directory,
        unrun: entry.unrun,
      }).toEqual({
        directory: entry.directory,
        unrun: entry.excludedBySelf.length,
      });
      // And the quarantine must be doing something: an empty list here means
      // the directory belongs in the unquarantined set, not this one.
      expect(entry.excludedBySelf.length).toBeGreaterThan(0);
      expect(entry.testFiles).toBeGreaterThan(entry.excludedBySelf.length);
    }
  });

  it("admits no integration directory that is newly reached by nothing", () => {
    // A quarantine-wired directory is partially covered by construction, and
    // the case above proves its unrun suites are exactly the ones it excludes
    // by name. Reading that as darkness would report four correctly-wired
    // directories as reached by nothing.
    const accounted = new Set(
      quarantineAccounting().map((entry) => entry.directory),
    );
    const dark = integrationLeafDirectories()
      .filter(
        (directory) =>
          zeroCoverage.has(directory) || partialCoverage.has(directory),
      )
      .map((directory) =>
        directory.slice(INTEGRATION_ROOT.length).replace(/^\//, ""),
      )
      .filter((name) => !accounted.has(name))
      .sort();

    const unrecorded = dark.filter((name) => !KNOWN_DARK_DIRECTORIES.has(name));
    // A new integration directory belongs in a workflow command on the day it
    // lands, not on the day somebody trips over it.
    expect(unrecorded).toEqual([]);

    // And the other direction, which this check used to leave open.
    //
    // The list was allowed to shrink without being edited, so wiring a
    // directory left its name sitting here meaning nothing, and the suite
    // stayed green. `qa` sat in it while 915 assertions ran nowhere: the
    // entry was correct, nobody was ever made to revisit it, and the list
    // slowly stopped describing the repository.
    //
    // The repository's own quarantine checks already refuse exactly this —
    // a list BELOW its ceiling fails there, because silent headroom is how a
    // carve-out becomes permanent. Two controls with opposite rules is one
    // control too many.
    //
    // The trade-off is real and worth naming: the one-way version is lower
    // friction, because wiring a directory needs no edit here. The two-way
    // version is the one that stays true. Truth wins, and the friction is one
    // line in the same change that did the wiring.
    const stale = [...KNOWN_DARK_DIRECTORIES].filter(
      (name) => !dark.includes(name),
    );
    expect(stale).toEqual([]);
  });
});

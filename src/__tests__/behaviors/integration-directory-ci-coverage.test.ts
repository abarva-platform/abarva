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
    excludedRootFiles: ["source-chat-shape.test.ts"],
  },
  {
    directory: "intelligence",
    workflow: ".github/workflows/integration-suites.yml",
    ignoreArgsScript: "scripts/quality/intelligence-integration-ignore-args.mjs",
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
  partiallyCoveredDirectories: { directory: string; testFiles: number; coveredTestFiles: number }[];
  uncoveredDirectories: { directory: string; testFiles: number; coveredTestFiles: number }[];
};

/**
 * Directories wired by `.github/workflows/integration-suites.yml`. Each one was
 * run in full on `2a1a87dd0` and passed with no exclusions, which is why none of
 * them needs a quarantine list the way `source` does.
 */
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
  "",
  "admin",
  "admin/data",
  "agents",
  "design",
  "ops",
  "qa",
]);

function runCensus(): Census {
  const stdout = execFileSync(
    process.execPath,
    [path.join(repoRoot, CENSUS_SCRIPT), "--json"],
    { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 },
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
      if (statSync(path.join(absolute, entry)).isDirectory()) walk(path.join(relative, entry));
    }
  };
  walk(INTEGRATION_ROOT);
  return found;
}

const census = runCensus();
const zeroCoverage = new Set(
  census.uncoveredDirectories
    .filter((row) => row.directory === INTEGRATION_ROOT || row.directory.startsWith(`${INTEGRATION_ROOT}/`))
    .map((row) => row.directory),
);
const partialCoverage = new Map(
  census.partiallyCoveredDirectories
    .filter((row) => row.directory === INTEGRATION_ROOT || row.directory.startsWith(`${INTEGRATION_ROOT}/`))
    .map((row) => [row.directory, row]),
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
      expect(runLines).toMatch(new RegExp(`${INTEGRATION_ROOT}/${name}(?=\\s|$)`));
    }
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
    const workflowDir = path.join(repoRoot, ".github/workflows");
    const commands = expandWorkflowCommands(
      readdirSync(workflowDir)
        .filter((name) => /\.ya?ml$/.test(name))
        .flatMap((name) =>
          extractWorkflowRunCommands(
            readFileSync(path.join(workflowDir, name), "utf8"),
          ),
        ),
      JSON.parse(
        readFileSync(path.join(repoRoot, "package.json"), "utf8"),
      ).scripts as Record<string, string>,
    );

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
      expect(zeroCoverage.has(directory) || partialCoverage.has(directory)).toBe(
        false,
      );

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
    for (const name of WIRED_DIRECTORIES) {
      for (const directory of directories) {
        if (directory === name || !directory.startsWith(name)) continue;
        colliding.push(`${name} -> ${directory}`);
      }
    }
    expect(colliding.sort()).toEqual([]);
  });

  it.each(QUARANTINED_WIRED_DIRECTORIES)(
    "holds the quarantined directory $directory to the same enumeration",
    ({ directory: name, workflow: workflowPath, ignoreArgsScript, excludedRootFiles }) => {
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

      expect(runLines).toMatch(new RegExp(`${INTEGRATION_ROOT}/${name}(?=\\s|$)`));

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
              readFileSync(path.join(repoRoot, ".github/workflows", entry), "utf8"),
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

  it("admits no integration directory that is newly reached by nothing", () => {
    const dark = integrationLeafDirectories()
      .filter((directory) => zeroCoverage.has(directory) || partialCoverage.has(directory))
      .map((directory) => directory.slice(INTEGRATION_ROOT.length).replace(/^\//, ""))
      .sort();

    const unrecorded = dark.filter((name) => !KNOWN_DARK_DIRECTORIES.has(name));
    // A ratchet: the set may shrink without editing this file. It may not grow.
    // A new integration directory belongs in a workflow command on the day it
    // lands, not on the day somebody trips over it.
    expect(unrecorded).toEqual([]);
  });
});

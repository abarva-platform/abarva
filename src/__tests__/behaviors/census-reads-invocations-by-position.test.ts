import { readFileSync } from "node:fs";
import path from "node:path";

import { jestInvocationsInScript } from "../../../scripts/quality/test-ci-coverage-census.mjs";

/**
 * T-727. The census asks, per test file, whether a workflow reaches a command
 * that names it. Part of that answer comes from reading the script files a
 * workflow executes, and it read them by matching the runner token against
 * source TEXT. Text cannot tell a command being run from a command being
 * talked about.
 *
 * The cost was measured on the run that found it. One string in a test fixture
 * — a negative control quoting a runner invocation as data — was counted as a
 * real invocation, could not be resolved to a directory, and landed in
 * `indeterminateInvocations`. Twenty-five behaviour suites assert that count
 * is zero, so twenty-five unrelated suites went red, and the failure named
 * none of them: `Expected: 0, Received: 1` on a census those suites do not
 * own.
 *
 * The over-crediting direction was already live and nobody had found it.
 * `scripts/quality/check-integration-root-quarantine.mjs` explains, in a JSDoc
 * block, that naming a directory selects root files beginning with the same
 * prefix — and it spells an invocation out to do so. The census read that
 * sentence as a run of that suite. It is masked today because a workflow line
 * genuinely names the same directory, which is exactly the state in which a
 * false credit is never noticed: remove the real line and the comment keeps
 * vouching for it.
 *
 * So the cue is not the text. It is the POSITION: argument position of a
 * child-process call, a `command`/`args` property, or a declaration passed as
 * such an argument — and, in a shell script, command position on a line.
 * Anything else is a mention, and mentions are REPORTED rather than dropped,
 * because a rule that silently demoted a real invocation would take a suite
 * out of the covered set and look like nothing happened.
 *
 * EVERY FIXTURE BELOW IS COMPOSED FROM TOKENS AT RUN TIME and no line of this
 * file spells an invocation out. That is not fastidiousness: the first draft of
 * the explanatory comment on the run that found this defect spelled one out
 * while explaining why it must not, and failed the same gate a second time. A
 * fixture that quotes an invocation in the file under test cannot fail a check
 * about quoting invocations.
 */

const REPO_ROOT = path.resolve(__dirname, "../../..");

/** The bare runner element, never written as one token in this file. */
const RUNNER = "je" + "st";
/** A runner command line, assembled rather than quoted. */
const RUNNER_CLI = `npx ${RUNNER}`;
const SUITE = "src/__tests__/example.test.ts";
const OTHER_SUITE = "src/__tests__/other.test.ts";

const q = (value: string) => JSON.stringify(value);

function commandsIn(source: string, scriptPath = "scripts/ci/example.mjs"): string[] {
  return jestInvocationsInScript(source, scriptPath).commands;
}

function mentionsIn(source: string, scriptPath = "scripts/ci/example.mjs"): string[] {
  return jestInvocationsInScript(source, scriptPath).mentions;
}

function realScript(relative: string): { commands: string[]; mentions: string[] } {
  return jestInvocationsInScript(
    readFileSync(path.join(REPO_ROOT, relative), "utf8"),
    relative,
  );
}

describe("the census counts invocations by position, not by text", () => {
  describe("positions that run the runner", () => {
    it("counts an array argument to spawnSync", () => {
      const source = [
        `import { spawnSync } from "node:child_process";`,
        `spawnSync("npx", [${q(RUNNER)}, ${q(SUITE)}, "--ci"], { stdio: "inherit" });`,
      ].join("\n");

      expect(commandsIn(source).join(" ")).toContain(SUITE);
    });

    it("counts an array argument to execFileSync", () => {
      const source = [
        `import { execFileSync } from "node:child_process";`,
        `execFileSync("npx", [${q(RUNNER)}, ${q(SUITE)}]);`,
      ].join("\n");

      expect(commandsIn(source).join(" ")).toContain(SUITE);
    });

    it("counts a whole command line handed to execSync", () => {
      const source = [
        `import { execSync } from "node:child_process";`,
        `execSync(${q(`${RUNNER_CLI} ${SUITE}`)});`,
      ].join("\n");

      expect(commandsIn(source).join(" ")).toContain(SUITE);
    });

    it("counts a command property, the shape the predeploy gate declares", () => {
      // The ECL predeploy gate holds its checks as data — `{ key, command }` —
      // and maps a spawn over them. The array is never written at a call site,
      // so a rule that only read call arguments would lose every suite that
      // gate runs.
      const source = [
        `const CHECKS = [`,
        `  { key: "a", command: ["npm", "run", "test:x"] },`,
        `  { key: "b", command: [${q(RUNNER)}, ${q(SUITE)}, "--runInBand"] },`,
        `];`,
      ].join("\n");

      expect(commandsIn(source).join(" ")).toContain(SUITE);
    });

    it("counts an array bound to a name that is then spawned", () => {
      const source = [
        `import { spawnSync } from "node:child_process";`,
        `const args = [${q(RUNNER)}, ${q(SUITE)}];`,
        `spawnSync("npx", args, { stdio: "inherit" });`,
      ].join("\n");

      expect(commandsIn(source).join(" ")).toContain(SUITE);
    });

    it("counts command position in a shell script", () => {
      const source = [`set -euo pipefail`, `${RUNNER_CLI} ${SUITE} --ci`].join("\n");

      expect(commandsIn(source, "scripts/ci/example.sh").join(" ")).toContain(SUITE);
    });
  });

  describe("positions that run nothing", () => {
    it("does not count a line comment", () => {
      const source = [
        `// ${RUNNER_CLI} ${SUITE} is how you would run it by hand`,
        `export const noop = 1;`,
      ].join("\n");

      expect(commandsIn(source)).toEqual([]);
    });

    it("does not count a block comment that spells a command out", () => {
      // The live shape. A JSDoc paragraph explaining what naming a directory
      // selects has to name the directory, and that sentence was a vouch.
      const source = [
        `/**`,
        ` * Naming a directory also selects root files with the same prefix:`,
        ` * \`${RUNNER_CLI} ${SUITE}\` is a regular expression, not a path.`,
        ` */`,
        `export const noop = 1;`,
      ].join("\n");

      expect(commandsIn(source)).toEqual([]);
    });

    it("does not count a command quoted inside an assertion", () => {
      const source = [
        `it("names the suite", () => {`,
        `  expect(workflow).toContain(${q(`${RUNNER_CLI} ${SUITE}`)});`,
        `});`,
      ].join("\n");

      expect(commandsIn(source)).toEqual([]);
    });

    it("does not count a command sitting in a data field", () => {
      const source = [
        `export const QUARANTINE = [`,
        `  { file: ${q(SUITE)}, reason: ${q(`${RUNNER_CLI} ${SUITE} passes locally`)} },`,
        `];`,
      ].join("\n");

      expect(commandsIn(source)).toEqual([]);
    });

    it("does not count a commented line in a shell script", () => {
      // Not a bare `# npx …` line: that never reached the command-position
      // rule, so a case built on one would pass whatever the rule did. The `&&`
      // is what the rule accepts as command position, and it is inside a
      // comment here.
      const source = [
        `set -euo pipefail`,
        `# was: build && ${RUNNER_CLI} ${SUITE} --ci`,
      ].join("\n");

      expect(commandsIn(source, "scripts/ci/example.sh")).toEqual([]);
      expect(mentionsIn(source, "scripts/ci/example.sh").join(" ")).toContain(SUITE);
    });
  });

  describe("a mention is reported, not discarded", () => {
    // The reverse failure is the dangerous one. If the position rule demoted a
    // real invocation, the suite it runs would quietly leave the covered set
    // and the census would print the same shape it printed before. Mentions are
    // therefore carried out of the reader so that a demotion is visible.
    it("reports the command it declined to count", () => {
      const source = [
        `// ${RUNNER_CLI} ${SUITE}`,
        `export const noop = 1;`,
      ].join("\n");

      expect(mentionsIn(source).join(" ")).toContain(SUITE);
    });

    it("says nothing about a mention that names no suite", () => {
      // A mention exists to make a wrong demotion visible, so it is worth
      // reading only when it names a path the census could have credited.
      // Measured on the 141 scripts the census reads: 5 mentions name a `src/`
      // path, 12 match the runner at all. Reporting all 12 would bury the 5.
      const source = [
        `// ${RUNNER_CLI} --listTests shows what a pattern picks up`,
        `export const noop = 1;`,
      ].join("\n");

      expect(commandsIn(source)).toEqual([]);
      expect(mentionsIn(source)).toEqual([]);
    });

    it("keeps a use and a mention of the same suite apart in one file", () => {
      // A single answer per file would let either direction hide the other.
      const source = [
        `import { spawnSync } from "node:child_process";`,
        `// historically this also ran ${RUNNER_CLI} ${OTHER_SUITE}`,
        `spawnSync("npx", [${q(RUNNER)}, ${q(SUITE)}]);`,
      ].join("\n");

      const { commands, mentions } = jestInvocationsInScript(
        source,
        "scripts/ci/example.mjs",
      );

      expect(commands.join(" ")).toContain(SUITE);
      expect(commands.join(" ")).not.toContain(OTHER_SUITE);
      expect(mentions.join(" ")).toContain(OTHER_SUITE);
    });
  });

  describe("the reader is not vacuous, measured on real scripts", () => {
    // Fixtures prove the reader handles what was imagined. These four files are
    // the whole of what the census reads today: three real invocations and the
    // one mention that has been credited as an invocation all along.
    it("still finds the behaviour-coverage gate's own invocation", () => {
      const { commands } = realScript("scripts/ci/check-behavior-coverage.mjs");
      expect(commands.join(" ")).toContain("src/__tests__/behaviors");
    });

    it("still finds the ratchet's spread invocation", () => {
      const { commands } = realScript("scripts/ci/test-ratchet.mjs");
      expect(commands.join(" ")).toContain("...paths");
    });

    it("still finds the predeploy gate's declared command, exactly once", () => {
      // Exactly once, and with nothing declined. Its checks live inside an
      // outer array, which carries the runner token through its own element —
      // so a reader that took every matching array would count the outer one
      // too and report the same suites a second time, as a command or as a
      // mention depending on where the outer array sits.
      const { commands, mentions } = realScript(
        "scripts/ecl/run_product_ecl_predeploy_gate.mjs",
      );
      expect(commands).toHaveLength(1);
      expect(commands.join(" ")).toContain("--runTestsByPath");
      expect(mentions).toEqual([]);
    });

    it("stops crediting the quarantine checker's JSDoc paragraph", () => {
      // The live positive, by name. This file runs quarantined suites through
      // spawnSync with paths it reads from JSON at run time, so it has no
      // literal invocation to find — the only match was the sentence.
      const { commands, mentions } = realScript(
        "scripts/quality/check-integration-root-quarantine.mjs",
      );

      expect(commands).toEqual([]);
      expect(mentions.join(" ")).toContain("src/__tests__/integration/programs");
    });

    it("finds nothing in a script that never mentions the runner", () => {
      const { commands, mentions } = realScript("scripts/exec/cli-entry.mjs");
      expect(commands).toEqual([]);
      expect(mentions).toEqual([]);
    });
  });
});

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");
const jestCli = path.join(repoRoot, "node_modules/jest/bin/jest.js");

/**
 * T-480 asks for two suites to be wired into a named CI scope, and its
 * acceptance says plainly that `npm run` output is not evidence that a workflow
 * selects a path. Neither is the workflow's own text: every existing wiring
 * assertion in this directory checks that a command *contains* a path string,
 * which a command can do while selecting nothing.
 *
 * These two files are the reason that distinction is not academic. They sit
 * under the `(maestro)` route group, and a bare Jest path argument is a regular
 * expression, so `src/app/(maestro)/home/...` reads `(maestro)` as a capture
 * group and matches `src/app/maestro/home/...` — a directory that does not
 * exist. `docs/ci/home-test-baseline.json` names `src/app/(maestro)/home` and
 * for that reason selects zero files beneath it; the coverage census credits
 * the name as coverage anyway (T-487). So the only honest proof is to hand a
 * workflow command's own arguments to Jest and read back what it selects.
 */
const T480_SUITES = [
  "src/app/(maestro)/home/__tests__/home-page-ecl-route.test.tsx",
  "src/app/(maestro)/home/__tests__/no-readmin-reexports.test.ts",
] as const;

/** Split a shell command into argv, honouring the double quotes a `(maestro)` path needs. */
function shellArgv(command: string): string[] {
  const argv: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  for (const match of command.matchAll(pattern)) {
    argv.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return argv;
}

function jestCommands(): string[] {
  const workflow = readFileSync(
    path.join(repoRoot, ".github/workflows/unit-suites.yml"),
    "utf8",
  );
  const scripts = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ).scripts as Record<string, string>;
  return expandWorkflowCommands(
    extractWorkflowRunCommands(workflow, { preserveEscapes: true }),
    scripts,
    { preserveEscapes: true },
  ).filter((command) => /\b(?:npx\s+)?jest\b/.test(command));
}

/** The workflow command that names both suites, as the workflow actually writes it. */
function wiringCommand(): string | undefined {
  return jestCommands().find((candidate) =>
    T480_SUITES.every((suite) => candidate.includes(suite)),
  );
}

/** Repo-relative paths Jest selects for `argv`. Jest exits non-zero when it selects nothing. */
function selectedPaths(argv: string[]): string[] {
  const stdout = execFileSync(process.execPath, [jestCli, "--listTests", ...argv], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.endsWith(".ts") || line.endsWith(".tsx"))
    .map((line) => path.relative(repoRoot, line));
}

describe("T-480 Home route-group suite CI wiring", () => {
  jest.setTimeout(120_000);

  it("names both suites in one unit-suites command, by exact path", () => {
    const command = wiringCommand();

    expect(command).toBeDefined();
    // `--runTestsByPath` is the half that makes the names mean something: it
    // tells Jest these arguments are file paths, not patterns.
    expect(command).toContain("--runTestsByPath");
    for (const suite of T480_SUITES) {
      // Quoted, because `(` and `)` are shell metacharacters and an unquoted
      // path would never reach Jest as written.
      expect(command).toContain(`"${suite}"`);
    }
  });

  it("selects both suites when Jest is given that command's own arguments", () => {
    const command = wiringCommand();
    expect(command).toBeDefined();

    const argv = shellArgv(command as string);
    const jestIndex = argv.findIndex((token) => token === "jest");
    expect(jestIndex).toBeGreaterThanOrEqual(0);

    const selected = selectedPaths(argv.slice(jestIndex + 1));

    for (const suite of T480_SUITES) expect(selected).toContain(suite);
  });

  it("would select neither suite if the command dropped --runTestsByPath", () => {
    // The negative control. Without it the case above cannot tell a real
    // selection from a Jest invocation that happens to succeed for some other
    // reason, and the regex trap that hid these two files from the Home
    // ratchet baseline for weeks would pass this suite unnoticed.
    const selected = selectedPaths([...T480_SUITES]);

    expect(selected).toEqual([]);
  });
});

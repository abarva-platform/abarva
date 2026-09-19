import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
  isIntegrationTestRegistered,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

/**
 * `src/__tests__/integration/source/` held 92 suites that no GitHub workflow
 * ran. The "Changed integration suites have a CI owner" gate only fires on a
 * suite a PR *changes*, so the rest sat unexecuted indefinitely — 591 passing
 * assertions nobody was collecting, and 68 failures nobody could see until the
 * directory was run for the first time.
 *
 * The registration is easy to break in a way that still looks correct. That
 * gate counts a suite as registered only when a workflow command mentions a
 * test runner AND names the suite or a containing directory. The obvious
 * tidy-up — moving the jest invocation behind `npm run test:source-integration`
 * or a wrapper script — satisfies neither condition, so every new Source
 * integration suite would start failing the gate again while the workflow
 * still appeared to run fine. The first draft of this change did exactly that,
 * and only checking the gate's own predicate caught it.
 *
 * These cases pin the property rather than the spelling of the command: a
 * suite in that directory is registered, a suite that does not exist yet is
 * registered, and a suite in a different integration directory is not.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const SUITE_DIR = "src/__tests__/integration/source";

function registeredCommands(): string[] {
  const workflowDir = path.join(repoRoot, ".github/workflows");
  const commands = readdirSync(workflowDir)
    .filter((name) => /\.ya?ml$/.test(name))
    .flatMap((name) =>
      extractWorkflowRunCommands(readFileSync(path.join(workflowDir, name), "utf8")),
    );
  const scripts = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ).scripts as Record<string, string>;
  return expandWorkflowCommands(commands, scripts);
}

describe("Source integration suites are registered with CI", () => {
  it("registers a suite that exists in the directory today", () => {
    expect(
      isIntegrationTestRegistered(
        `${SUITE_DIR}/source-rfp-readiness.test.ts`,
        registeredCommands(),
      ),
    ).toBe(true);
  });

  it("registers a suite nobody has written yet", () => {
    // The whole reason the workflow names the directory instead of 68 file
    // paths. Without this, every new Source integration suite needs a workflow
    // edit, and the visibility gate blocks the PR until someone remembers.
    expect(
      isIntegrationTestRegistered(
        `${SUITE_DIR}/a-suite-nobody-has-written-yet.test.ts`,
        registeredCommands(),
      ),
    ).toBe(true);
  });

  it("does not register a suite in a different integration directory", () => {
    // The negative control. A command broad enough to cover everything would
    // make this gate meaningless for every other product area, and the failure
    // would look like success.
    //
    // The stand-in used to be `…/integration/knowledge`, chosen because no
    // workflow named it. That made the control go red the day `knowledge` was
    // legitimately wired into `integration-suites.yml` — the control was right
    // and its example had simply expired, which is the same shape as the five
    // stale assertions that wiring repaired. A directory no workflow will ever
    // name keeps the control exact and stops it expiring again: an over-broad
    // command (naming the integration root, say) still registers this path and
    // still fails the case.
    expect(
      isIntegrationTestRegistered(
        "src/__tests__/integration/__not-a-registered-directory__/some-suite.test.ts",
        registeredCommands(),
      ),
    ).toBe(false);
  });

  it("registers by a command naming a test runner and the directory, not by a wrapper", () => {
    // Stated as a property of the command rather than its exact text, so a
    // reworded step still passes while a wrapper script does not.
    const covering = registeredCommands().filter(
      (command) =>
        /\b(?:npx\s+)?(?:jest|vitest|playwright)\b/.test(command) &&
        command.includes(SUITE_DIR),
    );

    expect(covering.length).toBeGreaterThan(0);
  });

  it("quarantines only suites that exist, and only a minority of the directory", () => {
    const { quarantined } = JSON.parse(
      readFileSync(
        path.join(repoRoot, "scripts/quality/source-integration-quarantine.json"),
        "utf8",
      ),
    ) as { quarantined: string[] };

    const present = readdirSync(path.join(repoRoot, SUITE_DIR)).filter((name) =>
      /\.(test|spec)\.[cm]?[jt]sx?$/.test(name),
    );

    // A stale exclusion is how a carve-out quietly becomes permanent.
    for (const name of quarantined) {
      expect(present).toContain(name);
    }
    // And the carve-out stays the exception, not the norm.
    expect(quarantined.length).toBeLessThan(present.length / 2);
  });
});

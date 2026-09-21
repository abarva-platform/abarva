import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * The hygiene gate gained a third verdict so a real finding that must not
 * block could still be reported as a finding. It then printed that verdict
 * to stdout and nowhere else, while the workflow consulted only the exit
 * status — so a warning lived in the raw job log and in no place a person
 * looks. Its own top line said "HYGIENE GATE: PASS" either way.
 *
 * These cases RUN the reporting rather than reading the gate's source text.
 * A guard that asserts a script contains certain strings is the shape of the
 * bug it usually guards against: it passes on any rewrite that keeps the
 * words and breaks the behaviour.
 *
 * Where a warning surfaces is not invented here — eleven workflows in this
 * repository already write to $GITHUB_STEP_SUMMARY and several emit
 * ::warning:: annotations. These cases pin that the gate now does the same.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const REPORT = path.join(repoRoot, "scripts/integration/hygiene_gate_report.sh");

const tmpRoot = mkdtempSync(path.join(tmpdir(), "hygiene-report-"));
let seq = 0;

interface Run {
  stdout: string;
  summary: string;
}

/**
 * Source the reporting unit and run `script` against it.
 *
 * `env` controls the two things the reporting keys off: whether it is running
 * under Actions, and where the step summary goes.
 */
function run(script: string, env: Record<string, string> = {}): Run {
  seq += 1;
  const summaryPath = path.join(tmpRoot, `summary-${seq}.md`);
  const stdout = execFileSync(
    "bash",
    ["-c", `set -u; . "${REPORT}"; ${script}`],
    {
      encoding: "utf8",
      // GITHUB_ACTIONS is deleted unless a case asks for it. Spreading the
      // ambient environment would inherit it in CI, where it is always set --
      // so the case below that proves no annotation is emitted outside
      // Actions would quietly stop testing anything on the only machine
      // whose answer matters.
      env: {
        ...process.env,
        GITHUB_ACTIONS: undefined,
        ...env,
        GITHUB_STEP_SUMMARY: env.GITHUB_STEP_SUMMARY ?? summaryPath,
      } as NodeJS.ProcessEnv,
    },
  );
  const target = env.GITHUB_STEP_SUMMARY ?? summaryPath;
  return {
    stdout,
    summary: existsSync(target) ? readFileSync(target, "utf8") : "",
  };
}

describe("a hygiene-gate warning reaches somewhere a person looks", () => {
  it("still prints the line it always printed", () => {
    const { stdout } = run(`hygiene_warn "stash stack is not safe to integrate"`);
    expect(stdout).toContain("[WARN] stash stack is not safe to integrate");
  });

  it("annotates the pull request when running under Actions", () => {
    const { stdout } = run(`hygiene_warn "stash stack is not safe to integrate"`, {
      GITHUB_ACTIONS: "true",
    });
    expect(stdout).toContain("::warning title=Hygiene gate::stash stack is not safe to integrate");
  });

  it("emits no annotation outside Actions, so a local run is unchanged", () => {
    // The negative control for the annotation. Without it the case above is
    // satisfied by a script that annotates unconditionally, which would put
    // Actions command syntax into every developer's terminal.
    const { stdout } = run(`hygiene_warn "a local finding"`);
    expect(stdout).toContain("[WARN] a local finding");
    expect(stdout).not.toContain("::warning");
  });

  it("escapes a newline rather than starting a second annotation", () => {
    const { stdout } = run(`hygiene_warn "first line\nsecond line"`, {
      GITHUB_ACTIONS: "true",
    });
    const annotations = stdout.split("\n").filter((l) => l.startsWith("::warning"));
    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toContain("%0A");
  });

  it("lists every finding in the step summary", () => {
    const { summary } = run(
      `hygiene_warn "first finding"; hygiene_warn "second finding"; ` +
        `hygiene_write_step_summary 40 2 0`,
    );

    expect(summary).toContain("## Hygiene gate");
    expect(summary).toContain("| warn | 2 |");
    expect(summary).toContain("- first finding");
    expect(summary).toContain("- second finding");
  });

  it("writes no findings section when there are none", () => {
    // The other direction: a clean run must not print an empty heading that
    // reads as though something was found and then lost.
    const { summary } = run(`hygiene_write_step_summary 40 0 0`);

    expect(summary).toContain("| warn | 0 |");
    expect(summary).not.toContain("Findings that did not block");
  });

  it("writes nothing at all when there is no summary to write to", () => {
    // A local run has no $GITHUB_STEP_SUMMARY. The reporting must be a no-op
    // rather than creating a file or failing.
    const target = path.join(tmpRoot, "must-not-be-created.md");
    const { stdout } = run(`hygiene_write_step_summary 1 1 0; echo done`, {
      GITHUB_STEP_SUMMARY: "",
    });

    expect(stdout).toContain("done");
    expect(existsSync(target)).toBe(false);
  });

  describe("the verdict line stops reading the same with and without findings", () => {
    it("says PASS only when nothing was found", () => {
      expect(run(`hygiene_verdict_line 0 0`).stdout.trim()).toBe("HYGIENE GATE: PASS");
    });

    it("says so when something was found, and does not say plain PASS", () => {
      const line = run(`hygiene_verdict_line 0 3`).stdout.trim();
      expect(line).toBe("HYGIENE GATE: PASS WITH WARNINGS (3)");
      expect(line).not.toBe("HYGIENE GATE: PASS");
    });

    it("still says FAIL when something blocked, warnings or not", () => {
      expect(run(`hygiene_verdict_line 1 0`).stdout.trim()).toBe("HYGIENE GATE: FAIL");
      expect(run(`hygiene_verdict_line 1 5`).stdout.trim()).toBe("HYGIENE GATE: FAIL");
    });
  });

  it("does not promote a warning into a failure", () => {
    // The acceptance's explicit constraint. A warning must change what is
    // reported and nothing about whether the gate blocks, so the exit status
    // of a warn-only run is asserted directly.
    const status = execFileSync(
      "bash",
      [
        "-c",
        `set -u; . "${REPORT}"; hygiene_warn "a finding"; ` +
          `hygiene_verdict_line 0 1 >/dev/null; echo "exit=$?"`,
      ],
      { encoding: "utf8", env: { ...process.env, GITHUB_ACTIONS: undefined } as NodeJS.ProcessEnv },
    );
    expect(status).toContain("exit=0");
  });

  it("the gate routes its warnings through this unit", () => {
    // The seam. Every case above drives the reporting directly, which proves
    // the reporting works and nothing about whether the gate uses it.
    const gate = readFileSync(
      path.join(repoRoot, "scripts/integration/hygiene_gate.sh"),
      "utf8",
    );
    expect(gate).toContain("hygiene_gate_report.sh");
    expect(gate).toMatch(/warn\(\)\s*\{\s*hygiene_warn/);
    expect(gate).toContain("hygiene_write_step_summary");
    expect(gate).toContain("hygiene_verdict_line");
    // And it must no longer print its own verdict line, or the run would
    // carry two and the old one would win the reader's eye.
    expect(gate).not.toMatch(/echo "HYGIENE GATE: PASS"/);
  });
});

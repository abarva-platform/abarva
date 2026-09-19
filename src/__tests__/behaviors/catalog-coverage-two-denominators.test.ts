import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The AI surface control catalog used to report one figure — "29 of 37
 * controls run a test" — alongside a note that 8 controls sit on surfaces no
 * route reaches.
 *
 * That single figure conflates two problems with different owners. Read as
 * written it says 78% of controls are tested and 8 lack tests. The truth was
 * the opposite in character: **every reachable control was tested**, and the
 * entire gap was unreachability. `29 + 8 = 37`.
 *
 * It also made one action look like two different things depending on which
 * figure someone quoted. A control on an unmounted surface can never be
 * counted as covered, so mounting one moves it into the reachable denominator
 * and lowers covered-of-reachable until it has a test — while
 * covered-of-declared cannot fall at all, because its numerator only rises.
 * The action the backlog most wants someone to take is the one that makes the
 * honest figure look worse, and that has to be said next to the number rather
 * than discovered by whoever is blamed for it.
 *
 * So both denominators are printed, and the incentive note is attached to the
 * figure it actually applies to. These cases pin that, and pin the arithmetic
 * that makes the two figures consistent — if `covered + unreachable` ever
 * stops equalling `declared`, one of them is measuring something else.
 */

const repoRoot = path.resolve(__dirname, "../../..");

function catalogOutput(): string {
  return execFileSync(
    process.execPath,
    [path.join(repoRoot, "scripts/audit/ai-surface-control-catalog.mjs")],
    { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
}

function figure(output: string, label: RegExp): { n: number; d: number } {
  const m = label.exec(output);
  if (!m) throw new Error(`figure not printed: ${label}`);
  return { n: Number(m[1]), d: Number(m[2]) };
}

describe("the control catalog reports both denominators", () => {
  it("prints coverage against reachable controls, not against every declared control", () => {
    const out = catalogOutput();

    expect(out).toMatch(/Behavioral coverage of reachable controls: \d+ of \d+ \(/);
  });

  it("prints the reachable share separately, so the gap has its own number", () => {
    const out = catalogOutput();

    expect(out).toMatch(/Reachable share of declared controls: \d+ of \d+ \(/);
  });

  it("keeps the two figures arithmetically consistent with the unreachable count", () => {
    // covered-of-reachable and reachable-of-declared must describe the same
    // population. If this breaks, one figure has quietly changed what it counts.
    const out = catalogOutput();
    const coverage = figure(out, /Behavioral coverage of reachable controls: (\d+) of (\d+)/);
    const reach = figure(out, /Reachable share of declared controls: (\d+) of (\d+)/);

    // The reachable denominator of the first is the numerator of the second.
    expect(coverage.d).toBe(reach.n);
    expect(coverage.n).toBeLessThanOrEqual(coverage.d);

    const unreachable = /Not on any screen: (\d+) of (\d+)/.exec(out);
    if (unreachable) {
      expect(reach.d - reach.n).toBe(Number(unreachable[1]));
      expect(Number(unreachable[2])).toBe(reach.d);
    }
  });

  it("states, where the number is printed, that mounting a surface lowers the first figure", () => {
    // The incentive warning. It belongs next to the number, not in a backlog
    // item read by whoever later has to explain the dip.
    const out = catalogOutput();
    if (!/Not on any screen:/.test(out)) return;

    expect(out).toMatch(/Mounting one lowers the first figure until it has a test/);
    expect(out).toMatch(/That is the arithmetic working, not a regression/);
  });

  it("does not report unreachable controls as covered", () => {
    // The fix the item explicitly refused: counting unmounted surfaces as
    // covered would move the number the right way for the wrong reason.
    //
    // The first draft of this case asserted only that coverage cannot exceed
    // what is reachable — trivially true, and it stayed green when the
    // reachability branch was disabled outright. A mutation caught it. The
    // check now reads ground truth from the catalog rather than from the
    // script whose behaviour is in question: if the catalog declares surfaces
    // as unreachable, the run must still be excluding controls for that
    // reason.
    const catalog = JSON.parse(
      readFileSync(path.join(repoRoot, "docs/security/ai-surface-control-catalog.json"), "utf8"),
    ) as { controls: Array<{ routeReachable?: boolean }> };
    const declaredUnreachable = catalog.controls.filter(
      (surface) => surface.routeReachable === false,
    ).length;

    const out = catalogOutput();
    if (declaredUnreachable === 0) {
      // Nothing to exclude; the run may legitimately omit the line.
      return;
    }

    expect(out).toMatch(/Not on any screen: [1-9]\d* of \d+ controls/);
    const reach = figure(out, /Reachable share of declared controls: (\d+) of (\d+)/);
    expect(reach.n).toBeLessThan(reach.d);
  });
});

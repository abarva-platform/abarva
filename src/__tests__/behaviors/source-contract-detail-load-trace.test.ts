import fs from "node:fs";
import path from "node:path";
import { createLoadTrace } from "@/lib/source/contract-detail-load-trace";

/**
 * Contract detail has been observed at 50-90 seconds signed in (backlog A9),
 * whose exit condition is "measured p50/p95; budget agreed and met". There was
 * no instrument: the only thing named "performance" in this area asserts string
 * formatting. A budget cannot be agreed against a number nobody has.
 *
 * The read resolves through a six-rung fallback ladder. Which rung answers
 * decides the cost, so the rung is recorded alongside the durations.
 */

const route = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/api/source/workspace/contract/[contractId]/route.ts",
  ),
  "utf8",
);

/**
 * A clock the test drives, so durations are asserted rather than tolerated.
 * `step` reads the clock twice — once before the stage, once in `finally` — so
 * each requested duration becomes a pair of readings.
 */
function fakeClock(durations: number[]) {
  const readings: number[] = [];
  let at = 0;
  for (const d of durations) {
    readings.push(at);
    at += d;
    readings.push(at);
  }
  let i = 0;
  return () => readings[i++] ?? at;
}

describe("the contract-detail load trace", () => {
  it("records each stage's duration", async () => {
    const trace = createLoadTrace(fakeClock([120, 4_500]));
    await trace.step("contract360", async () => null);
    await trace.step("projection-detail", async () => ({ ok: true }));

    expect(trace.spans()).toEqual([
      { name: "contract360", ms: 120 },
      { name: "projection-detail", ms: 4_500 },
    ]);
    expect(trace.totalMs()).toBe(4_620);
  });

  it("records which rung answered, and keeps the first answer", () => {
    const trace = createLoadTrace(fakeClock([]));
    trace.resolved("projection-detail");
    trace.resolved("direct-impact");
    // The ladder stops at the rung that answers; a later mark would overwrite
    // the true answer with a stage that ran afterwards.
    expect(trace.resolvedBy()).toBe("projection-detail");
  });

  it("reports nothing resolved rather than guessing a rung", () => {
    expect(createLoadTrace(fakeClock([])).resolvedBy()).toBeNull();
  });

  // A stage whose cost disappears when it throws is the one most worth seeing.
  it("still records a stage that throws, and lets the error through", async () => {
    const trace = createLoadTrace(fakeClock([900]));
    await expect(
      trace.step("detail-fallback", async () => {
        throw new Error("read failed");
      }),
    ).rejects.toThrow("read failed");
    expect(trace.spans()).toEqual([{ name: "detail-fallback", ms: 900 }]);
  });

  it("returns the stage's own value unchanged", async () => {
    const trace = createLoadTrace(fakeClock([1]));
    const value = { contract_id: "CTR-1" };
    await expect(trace.step("contract360", async () => value)).resolves.toBe(value);
  });

  it("emits a Server-Timing value a browser will not drop", () => {
    const trace = createLoadTrace(fakeClock([120, 4_500]));
    return (async () => {
      await trace.step("contract360", async () => null);
      await trace.step("projection detail!", async () => null);
      trace.resolved("projection detail!");
      const header = trace.serverTiming();

      expect(header).toContain("contract360;dur=120");
      // Server-Timing names are tokens. An unsanitised name produces a header
      // the browser discards silently — a measurement that reports nothing
      // while appearing to work.
      expect(header).toContain("projection-detail-;dur=4500");
      expect(header).toContain("resolved-by-projection-detail-");
      expect(header).not.toMatch(/[^A-Za-z0-9_;=,.\s-]/);
    })();
  });

  it("is applied to every rung of the ladder and both query batches", () => {
    for (const name of [
      "contract360",
      "detail-fallback",
      "projection-detail",
      "action-candidate",
      "evidence-coverage",
      "direct-impact",
      "detail-batch",
      "subject-batch",
    ]) {
      expect(route).toContain(`trace.step("${name}"`);
    }
    // Control: the ladder really is in this file, so the assertions above
    // cannot be passing against an unrelated route.
    expect(route).toContain("getSourceContractEvidenceCoverage");
  });

  it("marks the answering rung for each of the six", () => {
    const marks = route.match(/trace\.resolved\("/g) ?? [];
    expect(marks).toHaveLength(6);
  });

  it("returns the profile on the response", () => {
    expect(route).toContain('"Server-Timing": trace.serverTiming()');
  });
});

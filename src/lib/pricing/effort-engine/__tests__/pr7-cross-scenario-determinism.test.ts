/**
 * Nexus Pricing Engine — PR7 hardening: brief §12's determinism extension.
 *
 * PR4 already proved "same inputs+model+rate card -> identical output"
 * PER ARCHETYPE (`golden-fixtures.test.ts`'s 8 pinned fixtures, each running
 * `assertDeterministicRecomputation` — two in-process calls, deep-compared).
 * This file extends that proof in the two directions brief §12 asks for
 * that the golden fixtures do NOT already cover:
 *
 *   1. Running the SAME scenario TWICE with a full JSON serialize/parse
 *      round-trip of the INPUT between runs (not just comparing two
 *      raw-object outputs) — catching any hidden dependency on object
 *      identity, `Map` iteration order surviving a non-JSON-safe channel, or
 *      any mutable module-level state that a plain in-process re-call could
 *      miss if the two calls happened to share a reference.
 *   2. Running the SAME scenario across TWO INDEPENDENT MODULE INSTANCES —
 *      via `jest.resetModules()` + a fresh `require(...)` of every
 *      `effort-engine/*` module between the two runs — the closest a single
 *      Jest process can get to "two separate process boundaries" without
 *      literally shelling out a second Node process. This is the real,
 *      meaningful test for "hidden shared mutable module state": if any
 *      `effort-engine` module accidentally memoized something in a
 *      module-level `let`/cache that a fresh require would NOT carry over,
 *      re-requiring exposes it; if the module tree is genuinely pure (as
 *      designed), the two runs are byte-identical.
 */
import { runEffortEngine as runEffortEngineDirect } from "../effort-engine";
import { resolveActivityPacksForArchetype } from "../activity-packs";
import { resolveRoleRate } from "../rate-card-resolver";
import { loadRealEffortEnginePack, loadRealRoleRateSnapshot } from "../__fixtures__/test-fixtures";
import type { EffortEngineInput } from "../effort-engine";
import type { ResolvedRate } from "../types";

const pack = loadRealEffortEnginePack();
const rateSnapshot = loadRealRoleRateSnapshot();

function buildInput(archetypeCode: string): EffortEngineInput {
  const resolved = resolveActivityPacksForArchetype(pack, archetypeCode);
  const driverCodes = new Set<string>();
  for (const p of resolved) for (const rule of p.rules) if ("driverCode" in rule.operation) driverCodes.add(rule.operation.driverCode);
  const scopeDrivers: Record<string, number> = {};
  for (const code of driverCodes) scopeDrivers[code] = 7; // any fixed, realistic quantity

  const roleCodes = new Set<string>();
  for (const p of resolved) for (const rm of p.roleMix) roleCodes.add(rm.roleCode);
  const rates = new Map<string, ResolvedRate>();
  for (const roleCode of roleCodes) rates.set(roleCode, resolveRoleRate(roleCode, null, rateSnapshot));

  return {
    archetypeCode,
    tenantKey: "tenant-determinism",
    scenarioKey: "traditional",
    scopeDrivers,
    rates,
  };
}

describe("PR7 — cross-scenario determinism (JSON round-trip + independent module instances)", () => {
  it("re-serializing the input through JSON between two runs still produces byte-identical output", () => {
    const input = buildInput("ARCH-04");

    // Round-trip the scope-driver/rate inputs through JSON — the `rates`
    // Map can't survive JSON directly, so rebuild it from a JSON-safe array
    // form exactly the way a real cross-process hand-off (e.g. a queued job
    // payload) would have to.
    const ratesArray = Array.from(input.rates.entries());
    const ratesArrayRoundTripped: [string, ResolvedRate][] = JSON.parse(JSON.stringify(ratesArray));
    const scopeDriversRoundTripped: Record<string, number> = JSON.parse(JSON.stringify(input.scopeDrivers));

    const firstRun = runEffortEngineDirect(pack, input);
    const secondRun = runEffortEngineDirect(pack, {
      ...input,
      scopeDrivers: scopeDriversRoundTripped,
      rates: new Map(ratesArrayRoundTripped),
    });

    expect(JSON.stringify(secondRun)).toBe(JSON.stringify(firstRun));
  });

  it("running via a FRESH, independently-required module instance (jest.resetModules) produces byte-identical output — no hidden shared mutable state", async () => {
    const archetypeCode = "ARCH-07";
    const input = buildInput(archetypeCode);
    const firstRun = runEffortEngineDirect(pack, input);

    jest.resetModules();
    // Re-import the ENTIRE effort-engine module tree fresh — a new module
    // registry entry for every file `effort-engine.ts` transitively imports
    // (rule-interpreter, activity-packs, archetypes, cost-engine, money,
    // scenarios), the closest single-process proxy for "a second process
    // boundary" Jest can offer. `jest.resetModules()` invalidates Jest's
    // module registry, so this dynamic `import()` re-executes every module
    // top-to-bottom rather than reusing the already-loaded instance.
    const freshModule = await import("../effort-engine");
    const secondRun = freshModule.runEffortEngine(pack, input);

    expect(JSON.stringify(secondRun)).toBe(JSON.stringify(firstRun));
  });
});

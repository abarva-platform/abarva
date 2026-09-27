import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  collectCreditedControls,
  findSharedProvenCases,
  reconcileProvenCases,
} from "../../../scripts/audit/ai-surface-control-cases.mjs";

/**
 * A control's behavioral test was checked hard as a FILE and not at all as a
 * proof (item C-554).
 *
 * `scripts/audit/ai-surface-control-catalog.mjs` required that the declared
 * path exist, that the catalog workflow run it, and that the workflow's name
 * filter be the one the catalog declares. Rename the file and the gate fails.
 * What it never did was look inside, and coverage is credited **per control
 * kind**, so a suite named by four kinds earned four credits whatever it
 * actually exercised.
 *
 * Measured on `912a1c593c`: 10 test files carried 25 of the 35 reachable
 * credits. The worst was `src/components/agent/__tests__/AgentDock.test.tsx`, a
 * 61-case general suite credited for two kinds. Deleting the single case
 * `renders the persistent AI responsibility footer` — the only proof of
 * `agent-dock-chat-turns/responsibility-footer` — left the suite green at 60
 * cases and left `npm run audit:ai-surface-controls` at exit 0, still reporting
 * that control covered inside "35 of 35 (100%)". Nothing went red anywhere.
 * That is the founding defect of this catalog restated: a control proved by a
 * name rather than by something that runs.
 *
 * So each credit names the case(s) that prove it, in two halves:
 *
 *   - the static gate requires the declaration and forbids one case being sold
 *     as the proof of two kinds;
 *   - `scripts/audit/ai-surface-control-cases.mjs` reads the case names back
 *     from **jest's own report** and requires each one to have run and passed.
 *
 * The names come from jest rather than from a scan of the test file because a
 * case name is a runtime value: a template literal, a `describe.each` row or an
 * imported constant all defeat a grep, and `describe.each` is already in use by
 * the suites in this catalog.
 *
 * The expected answers below are derived here, independently of the modules
 * under test. Asking an implementation what the answer is and then checking it
 * against itself is a control that cannot fail either.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CATALOG_REL = "docs/security/ai-surface-control-catalog.json";
const STATIC_GATE = path.join(repoRoot, "scripts/audit/ai-surface-control-catalog.mjs");
const WORKFLOW_REL = ".github/workflows/ai-surface-control-catalog.yml";

type BehavioralTest = {
  status?: string;
  path?: string;
  reason?: string;
  provenCases?: unknown;
};

type Catalog = {
  controls: Array<{
    id: string;
    path: string;
    requiredControls: Array<{ kind: string; behavioralTest: BehavioralTest }>;
  }>;
};

function readCatalog(): Catalog {
  return JSON.parse(readFileSync(path.join(repoRoot, CATALOG_REL), "utf8")) as Catalog;
}

/**
 * Run the static gate against a catalog this test wrote.
 *
 * Through `AI_SURFACE_CONTROL_CATALOG_PATH`, the seam the gate already carries
 * for exactly this purpose: the repository's own catalog is never written, so a
 * failing assertion cannot leave a mutated control catalog behind.
 */
function runStaticGateWith(mutate: (catalog: Catalog) => void): {
  code: number;
  output: string;
} {
  const catalog = readCatalog();
  mutate(catalog);
  const fixture = path.join(
    mkdtempSync(path.join(tmpdir(), "control-case-proof-catalog-")),
    "catalog.json",
  );
  writeFileSync(fixture, JSON.stringify(catalog, null, 2));

  try {
    const output = execFileSync(process.execPath, [STATIC_GATE], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, AI_SURFACE_CONTROL_CATALOG_PATH: fixture },
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, output };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return { code: failure.status ?? 1, output: `${failure.stdout ?? ""}${failure.stderr ?? ""}` };
  }
}

/** A minimal catalog, so each branch below is driven by one thing only. */
function catalogFixture(behavioralTest: BehavioralTest, second?: BehavioralTest): Catalog {
  const requiredControls = [{ kind: "ai-label", behavioralTest }];
  if (second) requiredControls.push({ kind: "confidence", behavioralTest: second });
  return {
    controls: [{ id: "fixture-surface", path: "src/components/Fixture.tsx", requiredControls }],
  } as Catalog;
}

const suiteResults = (cases: Array<{ fullName: string; status: string }>) =>
  new Map([["src/components/__tests__/Fixture.test.tsx", cases]]);

const PASSING = { fullName: "fixture · ai label says draft", status: "passed" };

describe("a credit names the case that proves it, not just the file", () => {
  it("accepts a credit whose declared case ran and passed", () => {
    const problems = reconcileProvenCases(
      catalogFixture({
        path: "src/components/__tests__/Fixture.test.tsx",
        provenCases: [PASSING.fullName],
      }),
      suiteResults([PASSING]),
    );

    expect(problems).toEqual([]);
  });

  it("rejects a credit that names a case the suite no longer ran", () => {
    const problems = reconcileProvenCases(
      catalogFixture({
        path: "src/components/__tests__/Fixture.test.tsx",
        provenCases: ["fixture · ai label says draft (renamed away)"],
      }),
      suiteResults([PASSING]),
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("fixture-surface/ai-label");
    expect(problems[0]).toContain("ran no case named");
  });

  it("rejects a declared case that was skipped, which reads as green in a suite total", () => {
    const problems = reconcileProvenCases(
      catalogFixture({
        path: "src/components/__tests__/Fixture.test.tsx",
        provenCases: [PASSING.fullName],
      }),
      suiteResults([{ ...PASSING, status: "pending" }]),
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("reported pending rather than passed");
  });

  it("rejects a declared case that failed", () => {
    const problems = reconcileProvenCases(
      catalogFixture({
        path: "src/components/__tests__/Fixture.test.tsx",
        provenCases: [PASSING.fullName],
      }),
      suiteResults([{ ...PASSING, status: "failed" }]),
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("reported failed rather than passed");
  });

  it("rejects a credit that names no case at all", () => {
    const problems = reconcileProvenCases(
      catalogFixture({ path: "src/components/__tests__/Fixture.test.tsx" }),
      suiteResults([PASSING]),
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("declares no provenCases");
  });

  it("rejects a suite that reported no cases, rather than reading it as nothing to check", () => {
    const problems = reconcileProvenCases(
      catalogFixture({
        path: "src/components/__tests__/Fixture.test.tsx",
        provenCases: [PASSING.fullName],
      }),
      new Map(),
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("reported no cases at all");
  });

  it("leaves an uncovered control alone — it declares no path, so there is no credit to bind", () => {
    const problems = reconcileProvenCases(
      catalogFixture({ status: "none", reason: "x".repeat(60) }),
      new Map(),
    );

    expect(problems).toEqual([]);
    expect(collectCreditedControls(catalogFixture({ status: "none" }))).toEqual([]);
  });
});

describe("one case cannot be the proof of two controls", () => {
  it("rejects two kinds on one surface declaring the same case", () => {
    const shared = {
      path: "src/components/__tests__/Fixture.test.tsx",
      provenCases: [PASSING.fullName],
    };
    const problems = findSharedProvenCases(catalogFixture(shared, { ...shared }));

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("cannot be the proof of two different controls");
    expect(problems[0]).toContain("ai-label");
    expect(problems[0]).toContain("confidence");
  });

  it("allows two kinds on one surface to credit the same suite through different cases", () => {
    const problems = findSharedProvenCases(
      catalogFixture(
        {
          path: "src/components/__tests__/Fixture.test.tsx",
          provenCases: ["fixture · ai label says draft"],
        },
        {
          path: "src/components/__tests__/Fixture.test.tsx",
          provenCases: ["fixture · confidence tier is disclosed"],
        },
      ),
    );

    expect(problems).toEqual([]);
  });
});

describe("the static gate, over the real catalog", () => {
  it("fails when a credited control drops its provenCases", () => {
    const { code, output } = runStaticGateWith((catalog) => {
      const surface = catalog.controls.find((entry) => entry.id === "agent-dock-chat-turns");
      const control = surface?.requiredControls.find(
        (entry) => entry.kind === "responsibility-footer",
      );
      if (!control) throw new Error("fixture surface/kind is gone — update this test, not the gate");
      delete control.behavioralTest.provenCases;
    });

    expect(code).toBe(1);
    expect(output).toContain("agent-dock-chat-turns:responsibility-footer");
    expect(output).toContain("no provenCases");
  });

  it("fails when one case is declared as proof of two kinds", () => {
    const { code, output } = runStaticGateWith((catalog) => {
      const surface = catalog.controls.find((entry) => entry.id === "agent-dock-chat-turns");
      const footer = surface?.requiredControls.find(
        (entry) => entry.kind === "responsibility-footer",
      );
      const gate = surface?.requiredControls.find((entry) => entry.kind === "human-approval-gate");
      if (!footer || !gate) throw new Error("fixture surface/kind is gone — update this test");
      gate.behavioralTest.provenCases = [...(footer.behavioralTest.provenCases as string[])];
    });

    expect(code).toBe(1);
    expect(output).toContain("cannot be the proof of two different controls");
  });

  it("passes on the catalog as committed", () => {
    const { code } = runStaticGateWith(() => {});

    expect(code).toBe(0);
  });
});

describe("the committed catalog binds every credit it makes", () => {
  it("declares provenCases for every control that names a behavioral test", () => {
    const catalog = readCatalog();

    // Derived from the catalog here rather than read back from the module under
    // test, so a reader that silently stopped finding credits cannot pass this.
    const unbound: string[] = [];
    let credits = 0;
    for (const surface of catalog.controls) {
      for (const control of surface.requiredControls) {
        const declared = control.behavioralTest;
        if (typeof declared?.path !== "string" || !declared.path.trim()) continue;
        credits += 1;
        if (!Array.isArray(declared.provenCases) || declared.provenCases.length === 0) {
          unbound.push(`${surface.id}/${control.kind}`);
        }
      }
    }

    expect(unbound).toEqual([]);
    // A floor, not the exact figure: this must not quietly become zero credits
    // and report itself clean.
    expect(credits).toBeGreaterThanOrEqual(35);
  });

  it("names no case under two kinds of the same surface", () => {
    expect(findSharedProvenCases(readCatalog() as never)).toEqual([]);
  });

  it("is enforced by a step the catalog workflow actually runs", () => {
    const workflow = readFileSync(path.join(repoRoot, WORKFLOW_REL), "utf8");
    const scripts = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")).scripts;

    // A test that does not run proves nothing — the same sentence the gate it
    // extends applies to the suites it names.
    expect(scripts["audit:ai-surface-control-cases"]).toBe(
      "node scripts/audit/ai-surface-control-cases.mjs",
    );
    expect(workflow).toContain("npm run audit:ai-surface-control-cases");
  });
});

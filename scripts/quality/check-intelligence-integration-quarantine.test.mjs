/**
 * The quarantine list's fifth control: what each excluded suite COVERS.
 *
 * Batch 1 of the clear-out (backlog T-043) found that the cheap repair —
 * delete the one stale `describe`, keep the rest — would have manufactured
 * coverage of unreachable code in all nine cases. Backlog item T-050 recorded
 * that lesson in prose, in `clearedBatches`. Prose is not a control: the next
 * agent has to read it, believe it, and re-derive the measurement by hand.
 *
 * So the measurement is now declared per entry and recomputed on every run.
 * These cases are about the recomputation, and the important ones are the
 * mutations: a `covers` classification that is wrong has to FAIL, or the field
 * is decoration that makes the list look more governed than it is.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyCoveredModule,
  evaluateCoverageClaims,
  importedModulePaths,
  resolveSpecifier,
} from "./check-intelligence-integration-quarantine.mjs";

const SUITE = "src/__tests__/integration/intelligence/example.test.ts";

/** A tiny in-memory repository: path -> file text. */
function repo(files) {
  return {
    exists: (rel) => Object.prototype.hasOwnProperty.call(files, rel),
    read: (rel) => files[rel] ?? "",
    files: () => Object.keys(files),
  };
}

test("reads import statements and ignores an alias quoted inside an assertion", () => {
  const text = [
    "import { buildView } from '@/lib/intelligence/view-model';",
    "export type { Thing } from '@/lib/intelligence/types';",
    "import { near } from './sibling';",
    "// from '@/lib/intelligence/mentioned-in-a-comment'",
    "it('the page no longer imports auth', () => {",
    "  expect(src).not.toContain(\"from '@/lib/auth'\");",
    "});",
  ].join("\n");
  assert.deepEqual(importedModulePaths(text), [
    "@/lib/intelligence/view-model",
    "@/lib/intelligence/types",
    "./sibling",
  ]);
});

test("a relative importer counts — the gap that put a live module in the delete column", () => {
  // Not hypothetical. The first draft read `@/` specifiers only and classified
  // `seed-signals-manual.ts` as going with its suite, while `indexer.ts`,
  // `loader.ts` and `types.ts` import it as `./seed-signals-manual`.
  const r = repo({
    [SUITE]: "import { COUNT } from '@/lib/intelligence/seeds';",
    "src/lib/intelligence/loader.ts": "import { SEEDS } from './seeds';",
    "src/lib/intelligence/seeds.ts": "export const SEEDS = [];",
  });
  assert.equal(
    resolveSpecifier(r, "./seeds", "src/lib/intelligence/loader.ts"),
    "src/lib/intelligence/seeds.ts",
  );
  assert.equal(
    classifyCoveredModule(r, "src/lib/intelligence/seeds.ts", {
      suitePath: SUITE,
      quarantinedSuiteBasenames: new Set(["example.test.ts"]),
      doomedModules: new Set(),
    }),
    "kept-other-importer",
  );
});

test("a module nothing else imports goes with the suite", () => {
  const r = repo({
    [SUITE]: "import { a } from '@/lib/intelligence/only-here';",
    "src/lib/intelligence/only-here.ts": "export const a = 1;",
  });
  assert.equal(
    classifyCoveredModule(r, "src/lib/intelligence/only-here.ts", {
      suitePath: SUITE,
      quarantinedSuiteBasenames: new Set(["example.test.ts"]),
      doomedModules: new Set(["src/lib/intelligence/only-here.ts"]),
    }),
    "goes-with-the-suite",
  );
});

test("a module a NON-quarantined suite also tests is kept — deleting it would delete live coverage", () => {
  const r = repo({
    [SUITE]: "import { a } from '@/lib/sentinel/graph.ts';",
    "src/__tests__/integration/sentinel/graph.test.ts":
      "import { a } from '@/lib/sentinel/graph';",
    "src/lib/sentinel/graph.ts": "export const a = 1;",
  });
  assert.equal(
    classifyCoveredModule(r, "src/lib/sentinel/graph.ts", {
      suitePath: SUITE,
      quarantinedSuiteBasenames: new Set(["example.test.ts"]),
      doomedModules: new Set(),
    }),
    "kept-live-test",
  );
});

test("a quarantined sibling does not count as live coverage", () => {
  const r = repo({
    [SUITE]: "import { a } from '@/lib/intelligence/shared';",
    "src/__tests__/integration/intelligence/other.test.ts":
      "import { a } from '@/lib/intelligence/shared';",
    "src/lib/intelligence/shared.ts": "export const a = 1;",
  });
  assert.equal(
    classifyCoveredModule(r, "src/lib/intelligence/shared.ts", {
      suitePath: SUITE,
      quarantinedSuiteBasenames: new Set(["example.test.ts", "other.test.ts"]),
      doomedModules: new Set(["src/lib/intelligence/shared.ts"]),
    }),
    "goes-with-the-suite",
  );
});

test("a module a surviving non-test file imports is kept, even with no live test at all", () => {
  const r = repo({
    [SUITE]: "import { a } from '@/lib/programs/planner';",
    "src/app/(maestro)/programs/page.tsx":
      "import { a } from '@/lib/programs/planner';",
    "src/lib/programs/planner.ts": "export const a = 1;",
  });
  assert.equal(
    classifyCoveredModule(r, "src/lib/programs/planner.ts", {
      suitePath: SUITE,
      quarantinedSuiteBasenames: new Set(["example.test.ts"]),
      doomedModules: new Set(),
    }),
    "kept-other-importer",
  );
});

test("an importer that is itself going does not make a module product-reachable", () => {
  const r = repo({
    [SUITE]: "import { a } from '@/lib/intelligence/leaf';",
    "src/lib/intelligence/branch.ts": "import { a } from '@/lib/intelligence/leaf';",
    "src/lib/intelligence/leaf.ts": "export const a = 1;",
  });
  assert.equal(
    classifyCoveredModule(r, "src/lib/intelligence/leaf.ts", {
      suitePath: SUITE,
      quarantinedSuiteBasenames: new Set(["example.test.ts"]),
      doomedModules: new Set([
        "src/lib/intelligence/leaf.ts",
        "src/lib/intelligence/branch.ts",
      ]),
    }),
    "goes-with-the-suite",
  );
});

test("MUTATION — a covers entry claiming a product module goes with the suite fails", () => {
  const r = repo({
    [SUITE]: "import { a } from '@/lib/programs/planner';",
    "src/app/(maestro)/programs/page.tsx":
      "import { a } from '@/lib/programs/planner';",
    "src/lib/programs/planner.ts": "export const a = 1;",
  });
  const problems = evaluateCoverageClaims(r, [
    {
      suite: "example.test.ts",
      covers: [
        { module: "src/lib/programs/planner.ts", status: "goes-with-the-suite" },
      ],
    },
  ], { suiteDirRelative: "src/__tests__/integration/intelligence" });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /kept-other-importer/);
  assert.match(problems[0], /planner\.ts/);
});

test("MUTATION — an omitted module fails, so covers cannot be quietly narrowed", () => {
  const r = repo({
    [SUITE]: [
      "import { a } from '@/lib/intelligence/one';",
      "import { b } from '@/lib/intelligence/two';",
    ].join("\n"),
    "src/lib/intelligence/one.ts": "export const a = 1;",
    "src/lib/intelligence/two.ts": "export const b = 2;",
  });
  const problems = evaluateCoverageClaims(r, [
    {
      suite: "example.test.ts",
      covers: [{ module: "src/lib/intelligence/one.ts", status: "goes-with-the-suite" }],
    },
  ], { suiteDirRelative: "src/__tests__/integration/intelligence" });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /two\.ts/);
  assert.match(problems[0], /does not list/);
});

test("MUTATION — a covers entry naming a module the suite does not import fails", () => {
  const r = repo({
    [SUITE]: "import { a } from '@/lib/intelligence/one';",
    "src/lib/intelligence/one.ts": "export const a = 1;",
    "src/lib/intelligence/unrelated.ts": "export const c = 3;",
  });
  const problems = evaluateCoverageClaims(r, [
    {
      suite: "example.test.ts",
      covers: [
        { module: "src/lib/intelligence/one.ts", status: "goes-with-the-suite" },
        { module: "src/lib/intelligence/unrelated.ts", status: "goes-with-the-suite" },
      ],
    },
  ], { suiteDirRelative: "src/__tests__/integration/intelligence" });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /unrelated\.ts/);
});

test("a suite that imports nothing but node builtins needs an empty covers, not a missing one", () => {
  const r = repo({ [SUITE]: "import fs from 'fs';" });
  assert.deepEqual(
    evaluateCoverageClaims(r, [{ suite: "example.test.ts", covers: [] }], {
      suiteDirRelative: "src/__tests__/integration/intelligence",
    }),
    [],
  );
  const missing = evaluateCoverageClaims(r, [{ suite: "example.test.ts" }], {
    suiteDirRelative: "src/__tests__/integration/intelligence",
  });
  assert.equal(missing.length, 1);
  assert.match(missing[0], /covers/);
});

test("the real list classifies every module it declares, and agrees with the tree", () => {
  // Not a fixture: the committed list against the real repository. This is the
  // case that goes red when someone clears an entry without re-measuring.
  const problems = evaluateCoverageClaims(undefined, undefined, undefined);
  assert.deepEqual(problems, []);
});

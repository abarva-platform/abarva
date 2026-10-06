#!/usr/bin/env node
/**
 * Item U-504. The walk that item U-503 shipped inside one component's test
 * file, now a repo-owned module, plus the census it exists to make possible.
 *
 * The item's own words: "the false-positive question is the whole difficulty
 * and must not be waved past... A control that flags a live route file is a
 * control someone will disable." The first census run proved that warning
 * concrete rather than theoretical, so the cases below are ordered by which
 * half they defend.
 *
 * MEASURED on `origin/main` `c9adfff40`, with U-503's walk ported verbatim:
 * 22 unreachable declarations over 1611 component files — of which **15 were
 * false positives from a single mechanism**, and every one of them named a
 * declaration that is plainly referenced a few lines below.
 *
 * The mechanism is a comment-stripper with no model of JSX text:
 *
 *     <Code>src/lib/reasoning/*</Code>
 *
 * The `/*` in that glob opens a block comment. Everything to the next `*​/` is
 * blanked — which is the whole remainder of the component body, and therefore
 * every reference the page makes to its own tables, styles and rows. Both
 * `docs/reasoning/page.tsx` (8 reported) and `docs/reasoning/api/page.tsx`
 * (7 reported) fail exactly this way, and no third mechanism accounts for any
 * of the other seven findings.
 *
 * So the two real pages are the known positives of the false-positive class,
 * used here in preference to a fixture: they are real product files, in the
 * repository, that a hand-written stripper gets wrong.
 *
 * The other half is harder and is the reason `goes blind` is a named case
 * below: a walk can reach zero false positives by reporting nothing at all,
 * and that is indistinguishable from a fix in every assertion that only counts
 * findings. So a file carrying BOTH a JSX glob and a genuine dead closure must
 * still report the closure.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CENSUS_ROOTS,
  census,
  compareToBaseline,
  componentFiles,
  unreachableInFile,
  unreachableTopLevelDeclarations,
} from "./export-reachability.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = fs.realpathSync(path.resolve(here, "../.."));

/*
 * ---------------------------------------------------------------- real files
 *
 * These are not fixtures. Each is a product file on `main`, named because the
 * census measured it, and each answer below was verified by reading the file
 * rather than by trusting the walk.
 */

const JSX_GLOB_PAGES = [
  // `<Code>src/lib/reasoning/*</Code>` at line 289; every name the stripper
  // buried is referenced between lines 300 and 335.
  "src/app/(maestro)/docs/reasoning/page.tsx",
  // `<InlineCode>src/lib/reasoning/*</InlineCode>` at line 1139.
  "src/app/(maestro)/docs/reasoning/api/page.tsx",
];

for (const rel of JSX_GLOB_PAGES) {
  test(`a JSX glob does not bury the references below it: ${rel}`, () => {
    assert.deepEqual(
      unreachableInFile(path.join(repo, rel)),
      [],
      "every top-level declaration in this page is referenced by its exported "
        + "component; a finding here is the stripper losing the component body",
    );
  });
}

test("the live subject of U-503 still reports clean", () => {
  assert.deepEqual(
    unreachableInFile(
      path.join(
        repo,
        "src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx",
      ),
    ),
    [],
  );
});

test("the seven single-constant findings are real and are still reported", () => {
  /*
   * The residue of the first census after the 15 false positives are removed.
   * Each was verified by counting occurrences in its own file: the declaration
   * is the ONLY occurrence of the name, so nothing in the module refers to it.
   *
   * They are asserted as findings, not cleaned up: U-504 excludes deleting
   * anything the census finds, because a deletion justified only by a bulk
   * report is how a live surface gets removed.
   */
  const expected = [
    ["src/app/(maestro)/platform/page.tsx", ["PANEL_SOFT"]],
    ["src/app/demo/explore/page.tsx", ["MUTED"]],
    ["src/app/investors/page.tsx", ["PAGE_SKY"]],
    ["src/components/ModuleHeader.tsx", ["SANS"]],
    ["src/components/source/SourceCommercialSummarySurface.tsx", ["DARK", "TEXT"]],
    ["src/components/source/SourcePricingComparisonPanel.tsx", ["DARK"]],
  ];
  for (const [rel, names] of expected) {
    assert.deepEqual(
      unreachableInFile(path.join(repo, rel)),
      names,
      `${rel} should still report ${names.join(", ")}`,
    );
  }
});

/*
 * ------------------------------------------------------------------ the walk
 */

test("goes blind is not a fix: a JSX glob and a dead closure in one file", () => {
  /*
   * The negative control for the repair. If the stripper stops swallowing the
   * body by simply not reading the file, this case goes green for the wrong
   * reason — so the same file carries a live reference AFTER the glob and a
   * two-declaration dead closure that must survive.
   *
   * `DeadCard` referencing `deadLabel` is the shape U-503 met: `no-unused-vars`
   * is satisfied the moment one dead declaration references another, which is
   * why a closure of ten survived where a single orphan would not have.
   */
  const source = `
import type { ReactNode } from "react";

const LIVE_STYLE = { color: "red" };

function deadLabel(n: number) {
  return \`row \${n}\`;
}

function DeadCard({ n }: { n: number }) {
  return <li>{deadLabel(n)}</li>;
}

export default function Page(): ReactNode {
  return (
    <main style={LIVE_STYLE}>
      <Code>src/lib/reasoning/*</Code>
      <p style={LIVE_STYLE}>after the glob</p>
    </main>
  );
}
`;
  assert.deepEqual(unreachableTopLevelDeclarations(source), [
    "DeadCard",
    "deadLabel",
  ]);
});

test("an export is a root, whatever reaches the file from outside", () => {
  /*
   * The false positive the item warns would get the control disabled. A
   * Next.js route module is reached by the router and a test-only component by
   * a suite — under a walk that asked WHO IMPORTS A FILE both are unreachable.
   * This walk never asks, so neither is reportable.
   */
  const source = `
export const metadata = { title: "t" };
export default function Page() { return null; }
export function ForTestsOnly() { return null; }
`;
  assert.deepEqual(unreachableTopLevelDeclarations(source), []);
});

test("`export { a }` is a root and a re-export barrel declares nothing", () => {
  assert.deepEqual(
    unreachableTopLevelDeclarations(`
function helper() { return 1; }
function Widget() { return helper(); }
export { Widget as default };
`),
    [],
  );
  assert.deepEqual(
    unreachableTopLevelDeclarations(`
export { Alpha } from "./alpha";
export * from "./beta";
`),
    [],
  );
});

test("a JSX tag name is an edge", () => {
  assert.deepEqual(
    unreachableTopLevelDeclarations(`
function Row() { return null; }
export default function Table() { return <Row />; }
`),
    [],
  );
});

test("a module-level statement is a root, not a gap", () => {
  /*
   * Code outside every declaration — a registration call, a side effect — is
   * reached by the module loading. A walk that rooted only at exports would
   * report `register` and `Panel` as dead.
   */
  assert.deepEqual(
    unreachableTopLevelDeclarations(`
function Panel() { return null; }
function register(c: unknown) { return c; }
register(Panel);
export const ready = true;
`),
    [],
  );
});

test("a comment cannot manufacture an edge", () => {
  /*
   * The property U-503 built the stripper for, kept: a comment naming a dead
   * component must not keep it alive.
   */
  assert.deepEqual(
    unreachableTopLevelDeclarations(`
function Orphan() { return null; }
// <Orphan /> used to be mounted here
/* Orphan */
export default function Page() { return null; }
`),
    ["Orphan"],
  );
});

test("a string cannot manufacture an edge", () => {
  assert.deepEqual(
    unreachableTopLevelDeclarations(`
function Orphan() { return null; }
export default function Page() { return "Orphan"; }
`),
    ["Orphan"],
  );
});

/*
 * --------------------------------------------------------------- the census
 */

test("the census skips what the test runner mounts", () => {
  const files = componentFiles(repo);
  assert.ok(files.length > 500, `expected a real corpus, got ${files.length}`);
  for (const file of files) {
    assert.doesNotMatch(file, /__tests__|__mocks__|__fixtures__/, file);
    assert.doesNotMatch(file, /\.(test|spec)\.tsx?$/, file);
    assert.doesNotMatch(file, /\.d\.ts$/, file);
  }
});

test("the census reports its denominator, not only its findings", () => {
  const report = census(repo, CENSUS_ROOTS);
  assert.equal(report.filesScanned, componentFiles(repo).length);
  assert.ok(
    report.filesScanned > report.filesWithFindings,
    "a census whose findings equal its corpus is measuring the walk, not the code",
  );
  assert.equal(
    report.declarationCount,
    report.findings.reduce((n, f) => n + f.unreachable.length, 0),
  );
  for (const finding of report.findings) {
    assert.ok(finding.unreachable.length > 0, `${finding.file} listed with no finding`);
  }
});

test("the census total is the measured 7, and every finding is named", () => {
  /*
   * The number U-504 asked for. Asserted rather than described, so the census
   * cannot drift silently: if it moves, this case says so and the next reader
   * decides whether a real declaration died or the walk changed.
   */
  const report = census(repo, CENSUS_ROOTS);
  assert.deepEqual(
    report.findings.map((f) => `${f.file}: ${f.unreachable.join(", ")}`),
    [
      "src/components/source/SourceCommercialSummarySurface.tsx: DARK, TEXT",
      "src/app/(maestro)/platform/page.tsx: PANEL_SOFT",
      "src/app/demo/explore/page.tsx: MUTED",
      "src/app/investors/page.tsx: PAGE_SKY",
      "src/components/ModuleHeader.tsx: SANS",
      "src/components/source/SourcePricingComparisonPanel.tsx: DARK",
    ],
  );
  assert.equal(report.declarationCount, 7);
});

/*
 * ---------------------------------------------------------------- the gate
 */

test("the recorded baseline is exactly today's census", () => {
  const baseline = JSON.parse(
    fs.readFileSync(path.join(repo, "scripts/quality/export-reachability-baseline.json"), "utf8"),
  );
  const { added, fixed } = compareToBaseline(census(repo, CENSUS_ROOTS), baseline);
  assert.deepEqual(added, [], "findings the baseline does not record");
  assert.deepEqual(fixed, [], "baseline entries whose defect is gone");
});

test("a new unreachable declaration fails the check", () => {
  const baseline = { findings: [{ file: "a.tsx", unreachable: ["Old"] }] };
  const report = {
    findings: [{ file: "a.tsx", unreachable: ["Old"] }, { file: "b.tsx", unreachable: ["New"] }],
  };
  assert.deepEqual(compareToBaseline(report, baseline), {
    added: ["b.tsx::New"],
    fixed: [],
  });
});

test("a baseline entry whose defect is gone ALSO fails the check", () => {
  /*
   * The direction that is easy to leave out, and the one that decides whether
   * the list can rot. An exemption nobody is forced to retire outlives its
   * defect and then protects code that no longer needs protecting — so a
   * cleanup must delete its line in the same change.
   */
  const baseline = { findings: [{ file: "a.tsx", unreachable: ["Old", "Kept"] }] };
  const report = { findings: [{ file: "a.tsx", unreachable: ["Kept"] }] };
  assert.deepEqual(compareToBaseline(report, baseline), {
    added: [],
    fixed: ["a.tsx::Old"],
  });
});

test("a baseline is compared per declaration, not per file", () => {
  /*
   * A file-level baseline would accept a brand-new dead renderer in any file
   * that already had one recorded — which is the whole population this control
   * is for, since the defect U-503 repaired was a closure of ten in a file
   * nobody suspected.
   */
  const baseline = { findings: [{ file: "a.tsx", unreachable: ["Old"] }] };
  const report = { findings: [{ file: "a.tsx", unreachable: ["Old", "Renderer"] }] };
  assert.deepEqual(compareToBaseline(report, baseline).added, ["a.tsx::Renderer"]);
});

test("an absent findings list is not read as acceptance", () => {
  assert.deepEqual(
    compareToBaseline({ findings: [{ file: "a.tsx", unreachable: ["X"] }] }, {}),
    { added: ["a.tsx::X"], fixed: [] },
  );
});

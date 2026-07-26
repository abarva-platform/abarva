#!/usr/bin/env node
// Zero-cost, zero-network regression suite for the dimension-headline
// duplication fix in renderDimensionsFromBook(). Before this fix, a
// dimension's headline was pulled from `sections[chapter].headline` -- one
// string shared by every dimension mapped to that chapter -- so a large
// majority of a tenant's 38 dimensions showed the exact same headline
// verbatim (confirmed on all 3 real tenant candidates during the
// 2026-07-25 acceptance review, see
// docs/releases/records/2026-07-25-home-v4-three-tenant-acceptance-review.md).
// Run: node scripts/knowledge/__tests__/run-dimension-headline-tests.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pickDimensionHeadline, renderDimensionsFromBook } from "../build-home-knowledge-v4-review-pack.mjs";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.join(path.dirname(__filename), "..", "..", "..");

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`[FAIL] ${message}`);
  } else {
    console.log(`[PASS] ${message}`);
  }
}

// --- Unit tests: pickDimensionHeadline ---

assert(
  pickDimensionHeadline([], [], []) === "",
  "no relevant gaps/advantages/conclusions -> empty headline (honest empty state, not a borrowed chapter headline)",
);

assert(
  pickDimensionHeadline(
    [{ statement: "Shared gap.", applies_to_dimensions: ["a", "b"] }],
    [],
    [],
  ) === "Shared gap.",
  "falls back to a broadly-shared gap when no dimension-exclusive item exists",
);

assert(
  pickDimensionHeadline(
    [
      { statement: "Shared gap.", applies_to_dimensions: ["a", "b"] },
      { statement: "Exclusive gap just for this dimension.", applies_to_dimensions: ["a"] },
    ],
    [],
    [],
  ) === "Exclusive gap just for this dimension.",
  "prefers a dimension-exclusive gap over an earlier broadly-shared one",
);

assert(
  pickDimensionHeadline(
    [],
    [{ statement: "Exclusive advantage.", applies_to_dimensions: ["a"] }],
    [{ statement: "Exclusive conclusion.", applies_to_dimensions: ["a"] }],
  ) === "Exclusive advantage.",
  "prefers gaps over advantages over conclusions when multiple exclusive candidates exist",
);

const longStatement = Array.from({ length: 20 }, (_, i) => `word${i + 1}`).join(" ");
const truncated = pickDimensionHeadline([{ statement: longStatement, applies_to_dimensions: ["a"] }], [], []);
assert(
  truncated === `${Array.from({ length: 12 }, (_, i) => `word${i + 1}`).join(" ")}…`,
  `truncates to <=12 words per the schema's headline hard limit (got ${JSON.stringify(truncated)})`,
);

// --- Integration check: real fixture books, all three tenants ---
// Not a full duplication-elimination claim (some overlap is architecturally
// correct -- a fact genuinely shared by several related dimensions should
// read the same on all of them). The regression this guards against is the
// OLD failure mode: virtually the entire 38-dimension pack collapsing onto
// ~9 chapter-wide strings. Assert a real, verified ceiling well below that.

const MAX_DIMENSIONS_IN_ANY_ONE_DUPLICATE_GROUP = 10; // old bug: up to 14; real chapters cap near 8-9 members anyway.

for (const tenant of ["first-capital", "meridian-health", "skyharbor-air"]) {
  const bookPath = path.join(repoRoot, "scripts", "knowledge", "__fixtures__", "enterprise-book", `${tenant}-book.json`);
  if (!fs.existsSync(bookPath)) {
    console.log(`[SKIP] ${tenant}: no enterprise-book fixture at ${bookPath}`);
    continue;
  }
  const book = JSON.parse(fs.readFileSync(bookPath, "utf8"));
  const dimensions = renderDimensionsFromBook(book, { deterministic_dataset_registry: [] });
  const headlineGroups = new Map();
  for (const dim of dimensions) {
    if (!dim.headline) continue;
    if (!headlineGroups.has(dim.headline)) headlineGroups.set(dim.headline, []);
    headlineGroups.get(dim.headline).push(dim.dimension_key);
  }
  const largestGroup = Math.max(0, ...[...headlineGroups.values()].map((keys) => keys.length));
  assert(
    largestGroup <= MAX_DIMENSIONS_IN_ANY_ONE_DUPLICATE_GROUP,
    `${tenant}: largest headline-duplicate group is ${largestGroup} dimensions (must be <= ${MAX_DIMENSIONS_IN_ANY_ONE_DUPLICATE_GROUP})`,
  );
  // Every non-empty headline must trace back to real per-dimension content
  // (a gap/advantage/conclusion statement), never the literal chapter
  // headline string the old code used.
  const chapterHeadlines = new Set(
    Object.values(book.sections ?? {}).map((s) => s?.headline).filter(Boolean),
  );
  const stillUsesChapterHeadline = dimensions.filter((d) => d.headline && chapterHeadlines.has(d.headline));
  assert(
    stillUsesChapterHeadline.length === 0,
    `${tenant}: no dimension headline equals a raw chapter headline string (found ${stillUsesChapterHeadline.length}: ${stillUsesChapterHeadline.map((d) => d.dimension_key).join(", ")})`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("\nAll dimension-headline tests passed.");
}

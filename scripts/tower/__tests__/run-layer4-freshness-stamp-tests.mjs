#!/usr/bin/env node
/**
 * Layer 4 must stamp the freshness the surface reports.
 *
 * The Tower header reads `as_of_period` and `refresh_timestamp` off the executive summary row. Both
 * were absent from the projection, so the page honestly said "as-of date not recorded" — correct,
 * but only because the value was being dropped: `as_of_date` is in the package and reaches
 * canonical, and was simply not carried into Layer 4.
 *
 * These are two different facts and neither may stand in for the other. `as_of_period` is the
 * period the figures cover; `refresh_timestamp` is when the projection was built. An earlier
 * version of this surface rendered a render-time date as though it were the age of the data, which
 * is the defect this stamping exists to retire — so the build time must come from the loader, and
 * the period must come from the package.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const loader = fs.readFileSync(
  path.resolve(here, "../load-healthcare-demo-layer4-products.mjs"),
  "utf8",
);

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("the reporting period comes from the package, not the clock", () => {
  assert.match(loader, /as_of_period: data\.summary\.as_of_date \?\? null/);
});

test("an absent period is null, never substituted", () => {
  const line = loader
    .split("\n")
    .find((l) => l.includes("as_of_period:"));
  assert.ok(line, "as_of_period not stamped");
  assert.ok(
    line.includes("?? null"),
    "an absent period must be null so the surface can report a gap",
  );
  assert.ok(
    !/as_of_period:[^\n]*\|\|/.test(line),
    "no || fallback: the period must not borrow another field",
  );
});

test("the build time comes from the loader run", () => {
  assert.match(loader, /refresh_timestamp: options\.builtAt/);
  assert.match(loader, /builtAt: new Date\(\)\.toISOString\(\)/);
});

test("the two facts are stamped separately", () => {
  const a = loader.indexOf("as_of_period:");
  const b = loader.indexOf("refresh_timestamp: options.builtAt");
  assert.ok(a > 0 && b > 0 && a !== b, "both must be present and distinct");
  assert.ok(
    !loader.includes("as_of_period: options.builtAt"),
    "build time must never stand in for the reporting period",
  );
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL  ${name}\n        ${err.message}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);

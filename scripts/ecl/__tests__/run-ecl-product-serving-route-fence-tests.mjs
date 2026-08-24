#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const REF = process.env.ECL_SERVING_ROUTE_FENCE_REF || "HEAD";
const PLAN_DOC = "docs/architecture/ECL_CLEAN_BREAK_INTEGRATED_EXECUTION_PLAN_2026_08_24.md";
const SCAN_ROOTS = ["src/app", "src/lib"];

function gitShow(path) {
  const result = spawnSync("git", ["show", `${REF}:${path}`], {
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `git show ${REF}:${path} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result.stdout;
}

function gitLsTree(paths) {
  const result = spawnSync("git", ["ls-tree", "-r", "--name-only", REF, "--", ...paths], {
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `git ls-tree ${REF} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function cleanMarkdownCell(value) {
  return value.trim().replace(/^`|`$/g, "");
}

function extractMarkdownTable(markdown, heading) {
  const start = markdown.indexOf(heading);
  assert.notEqual(start, -1, `${PLAN_DOC} must contain ${heading}`);
  const rest = markdown.slice(start + heading.length);
  const nextHeading = rest.search(/\n#{1,6}\s+/);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  const lines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"));
  assert(lines.length >= 2, `${heading} must contain a markdown table`);
  const headers = lines[0].split("|").slice(1, -1).map(cleanMarkdownCell);
  return lines.slice(2).map((line) => {
    const cells = line.split("|").slice(1, -1).map(cleanMarkdownCell);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

const planDoc = gitShow(PLAN_DOC);
const surfaceRows = extractMarkdownTable(planDoc, "### Serving Surface Enumeration");
const productProjectionTables = [
  ...new Set(surfaceRows.map((row) => row["ecl backing"].replace(/^ecl_projection\./, ""))),
].sort();

assert.equal(surfaceRows.length, 40, "serving surface enumeration must remain 40 surfaces");
assert.ok(productProjectionTables.length >= 12, "expected 12 product projection backing tables");

const productProjectionPattern = new RegExp(
  `ecl_projection\\.(${productProjectionTables.map((table) => table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "g",
);

const files = gitLsTree(SCAN_ROOTS).filter((path) =>
  /\.(ts|tsx|js|jsx)$/.test(path) &&
  !path.includes("/__tests__/") &&
  !/(\.|-)test\.[tj]sx?$/.test(path) &&
  !/\.spec\.[tj]sx?$/.test(path),
);

const violations = [];
for (const path of files) {
  const content = REF === "HEAD" ? readFileSync(path, "utf8") : gitShow(path);
  const lines = content.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    productProjectionPattern.lastIndex = 0;
    const matches = [...line.matchAll(productProjectionPattern)];
    for (const match of matches) {
      violations.push({
        path,
        line: index + 1,
        table: match[1],
        text: line.trim(),
      });
    }
  }
}

assert.deepEqual(
  violations,
  [],
  "product runtime code must read ECL product surfaces through serving.* views, not direct ecl_projection tables",
);

console.log(
  JSON.stringify(
    {
      accepted: true,
      ref: REF,
      scannedFiles: files.length,
      enumeratedSurfaces: surfaceRows.length,
      fencedProjectionTables: productProjectionTables.length,
      violations: 0,
    },
    null,
    2,
  ),
);

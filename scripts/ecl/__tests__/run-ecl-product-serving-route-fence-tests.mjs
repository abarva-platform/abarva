#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const REF = process.env.ECL_SERVING_ROUTE_FENCE_REF || "HEAD";
const PLAN_DOC = "docs/architecture/ECL_CLEAN_BREAK_INTEGRATED_EXECUTION_PLAN_2026_08_24.md";
const SCAN_ROOTS = ["src/app", "src/lib"];
const TOWER_RUNTIME_ENTRY_FILES = [
  "src/app/(maestro)/tower/page.tsx",
  "src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx",
  "src/app/(maestro)/tenant/[tenantSlug]/tower/[surface]/page.tsx",
  "src/app/api/tower/ask/route.ts",
  "src/app/api/tower/chat/route.ts",
];
const PRE_ECL_TOWER_READ_PATTERNS = [
  /cio_tower\.[a-z0-9_]+/g,
  /consumption\.tower_[a-z0-9_]+/g,
  /tower\.(value_case|value_case_period|subject_link|economic_conversion|attestation_event|proof_action|value_case_claim_link|ai_identity_crosswalk|value_claim|metric_definition|metric_observation|metric_provenance)\b/g,
];

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
  !/\.spec\.[tj]sx?$/.test(path) &&
  (REF !== "HEAD" || existsSync(path)),
);
const fileSet = new Set(files);

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

function localImportSpecifiers(content) {
  const specifiers = [];
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+(?:type\s+)?[^'"]*?\s+from\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) specifiers.push(match[1]);
  }
  return specifiers.filter((specifier) => specifier.startsWith("@/") || specifier.startsWith("."));
}

function resolveImport(currentPath, specifier) {
  const base =
    specifier.startsWith("@/")
      ? specifier.replace(/^@\//, "src/")
      : path.posix.normalize(path.posix.join(path.posix.dirname(currentPath), specifier));
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.posix.join(base, "index.ts"),
    path.posix.join(base, "index.tsx"),
    path.posix.join(base, "index.js"),
    path.posix.join(base, "index.jsx"),
  ];
  return candidates.find((candidate) => fileSet.has(candidate)) ?? null;
}

function reachableRuntimeFiles(entryFiles) {
  const seen = new Set();
  const stack = entryFiles.filter((entry) => fileSet.has(entry));
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    const content = REF === "HEAD" ? readFileSync(current, "utf8") : gitShow(current);
    for (const specifier of localImportSpecifiers(content)) {
      const resolved = resolveImport(current, specifier);
      if (resolved && !seen.has(resolved)) stack.push(resolved);
    }
  }
  return [...seen].sort();
}

const towerRuntimeFiles = reachableRuntimeFiles(TOWER_RUNTIME_ENTRY_FILES);
assert.ok(
  towerRuntimeFiles.includes("src/lib/tower/readTowerCommandCenter.ts"),
  "Tower runtime import graph must include the ECL serving reader",
);
assert.ok(
  !towerRuntimeFiles.includes("src/lib/cio-tower/tower-mart-view-model.ts"),
  "Tower runtime import graph must not include the pre-ECL CIO Tower mart reader",
);

const preEclTowerViolations = [];
for (const scanPath of towerRuntimeFiles) {
  const content = REF === "HEAD" ? readFileSync(scanPath, "utf8") : gitShow(scanPath);
  const lines = content.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const pattern of PRE_ECL_TOWER_READ_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = [...line.matchAll(pattern)];
      for (const match of matches) {
        preEclTowerViolations.push({
          path: scanPath,
          line: index + 1,
          reference: match[0],
          text: line.trim(),
        });
      }
    }
  }
}

assert.deepEqual(
  preEclTowerViolations,
  [],
  "Tower runtime path must not read pre-ECL cio_tower.*, tower.*, or consumption.tower_* schemas",
);

console.log(
  JSON.stringify(
    {
      accepted: true,
      ref: REF,
      scannedFiles: files.length,
      towerRuntimeFilesScanned: towerRuntimeFiles.length,
      enumeratedSurfaces: surfaceRows.length,
      fencedProjectionTables: productProjectionTables.length,
      violations: 0,
      preEclTowerViolations: 0,
    },
    null,
    2,
  ),
);

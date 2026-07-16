#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "reports", "route-archive-audit");
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".md",
  ".mdx",
  ".json",
  ".css",
  ".scss",
  ".html",
]);

const SCAN_DIRS = [
  "src",
  "docs",
  "scripts",
  "tests",
  "package.json",
  "middleware.ts",
  "next.config.mjs",
  "next.config.ts",
];

const NAV_FILES = [
  "src/components/shell/topbar-nav-items.ts",
  "src/components/abarva/AbarVaShellNav.tsx",
  "src/components/abarva/AbarVaTopNav.tsx",
  "src/components/AbarvaNav.tsx",
  "src/lib/home/top-nav-items.ts",
  "src/lib/admin/admin-shell-config.ts",
  "src/lib/shell/atrium-contract.ts",
  "src/components/shell/AppRail.tsx",
  "src/components/shell/CommandPalette.tsx",
];

const PRIMARY_APP_ROUTES = new Set([
  "/",
  "/home",
  "/home/learn",
  "/learn",
  "/intelligence",
  "/strategic-moves",
  "/strategic-moves/new",
  "/source",
  "/tower",
  "/admin",
  "/setup",
]);

const ACCESS_ROUTES = new Set([
  "/access",
  "/access-denied",
  "/session-expired",
  "/invite/:slug",
]);

const LEGACY_ALIAS_ROOTS = new Map([
  ["/programs", "/strategic-moves"],
  ["/moves", "/strategic-moves"],
  ["/learn", "/home/learn"],
]);

function walk(dir, predicate = () => true, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    if (predicate(dir)) acc.push(dir);
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === ".git" ||
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === "out" ||
      entry.name === "coverage"
    ) {
      continue;
    }
    walk(path.join(dir, entry.name), predicate, acc);
  }
  return acc;
}

function routeFromAppPage(filePath) {
  const rel = path.relative(path.join(ROOT, "src", "app"), filePath);
  const parts = rel.split(path.sep);
  parts.pop();
  const routeParts = parts
    .filter((part) => !(part.startsWith("(") && part.endsWith(")")))
    .map((part) => {
      if (part.startsWith("[[...") && part.endsWith("]]")) return "*";
      if (part.startsWith("[...") && part.endsWith("]")) return "*";
      if (part.startsWith("[") && part.endsWith("]")) {
        return `:${part.slice(1, -1)}`;
      }
      return part;
    });
  return `/${routeParts.join("/")}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

function appGroup(filePath) {
  const rel = path.relative(path.join(ROOT, "src", "app"), filePath);
  const match = rel.match(/^\(([^)]+)\)\//);
  return match?.[1] ?? "root";
}

function routeBase(route) {
  const parts = route.split("/").filter(Boolean);
  const dynamicIndex = parts.findIndex((part) => part.startsWith(":") || part === "*");
  if (dynamicIndex < 0) return route;
  const base = `/${parts.slice(0, dynamicIndex).join("/")}`;
  return base === "/" ? route : base;
}

function literalNeedles(route) {
  if (route === "/") return ['href="/"', "href={'/'}", 'href="/"'];
  const staticRoute = !route.includes(":") && !route.includes("*");
  if (staticRoute) {
    return [
      `"${route}"`,
      `'${route}'`,
      `\`${route}\``,
      `href="${route}"`,
      `href='${route}'`,
      `router.push("${route}")`,
      `router.push('${route}')`,
      `window.location.assign("${route}")`,
      `window.location.assign('${route}')`,
    ];
  }
  const base = routeBase(route);
  return [
    `"${base}/`,
    `'${base}/`,
    `\`${base}/`,
    `href="${base}/`,
    `href='${base}/`,
    `router.push("${base}/`,
    `router.push('${base}/`,
  ];
}

function listTextFiles() {
  const files = [];
  for (const entry of SCAN_DIRS) {
    const abs = path.join(ROOT, entry);
    if (!fs.existsSync(abs)) continue;
    walk(
      abs,
      (file) => TEXT_EXTENSIONS.has(path.extname(file)) || path.basename(file) === "package.json",
      files,
    );
  }
  return Array.from(new Set(files));
}

function buildTextCorpus(textFiles) {
  return textFiles.flatMap((file) => {
    try {
      return [
        {
          file,
          relativeFile: path.relative(ROOT, file),
          text: fs.readFileSync(file, "utf8"),
        },
      ];
    } catch {
      return [];
    }
  });
}

function countReferences(route, ownFile, textCorpus) {
  const needles = literalNeedles(route);
  const references = [];
  for (const { file, relativeFile, text } of textCorpus) {
    if (file === ownFile) continue;
    const hits = needles.reduce((count, needle) => {
      let next = 0;
      let index = text.indexOf(needle);
      while (index >= 0) {
        next += 1;
        index = text.indexOf(needle, index + needle.length);
      }
      return count + next;
    }, 0);
    if (hits > 0) {
      references.push({
        file: relativeFile,
        hits,
        isNavFile: NAV_FILES.includes(relativeFile),
      });
    }
  }
  return references.sort((a, b) => b.hits - a.hits || a.file.localeCompare(b.file));
}

function inferRouteKind(route, sourcePath, group) {
  if (route === "/") return "public-root";
  if (group === "public") return "public-marketing";
  if (route.startsWith("/api/")) return "api";
  if (route.startsWith("/demo") || route.startsWith("/_dev")) return "demo-dev";
  if (route.startsWith("/preview")) return "preview";
  if (route.startsWith("/admin") || route.startsWith("/platform/admin")) return "admin-internal";
  if (route.startsWith("/source")) return "source";
  if (route.startsWith("/strategic-moves") || route.startsWith("/moves")) return "moves";
  if (route.startsWith("/programs")) return "programs-legacy";
  if (route.startsWith("/tenant")) return "tenant-deep-link";
  if (route.startsWith("/sponsor")) return "sponsor";
  if (route.startsWith("/invite") || ACCESS_ROUTES.has(route)) return "access";
  if (route.startsWith("/home") || route === "/learn") return "knowledge-home";
  if (route.startsWith("/intelligence")) return "intelligence";
  if (route.startsWith("/tower")) return "tower";
  if (sourcePath.includes("/docs/")) return "docs";
  return "other";
}

function classify(route, sourcePath, group, references) {
  const navRefs = references.filter((ref) => ref.isNavFile).length;
  const refCount = references.reduce((total, ref) => total + ref.hits, 0);
  const dynamic = route.includes(":") || route.includes("*");
  const kind = inferRouteKind(route, sourcePath, group);
  const reasons = [];

  if (PRIMARY_APP_ROUTES.has(route)) {
    reasons.push("primary app route");
    return { classification: "keep", confidence: "high", reasons };
  }
  if (ACCESS_ROUTES.has(route) || kind === "access") {
    reasons.push("auth/access route");
    return { classification: "keep", confidence: "high", reasons };
  }
  if (kind === "public-root" || kind === "public-marketing") {
    reasons.push("public or marketing route");
    return { classification: "keep", confidence: "medium", reasons };
  }
  if (navRefs > 0) {
    reasons.push("referenced by shell/navigation config");
    return { classification: "keep", confidence: "high", reasons };
  }
  for (const [legacyRoot, target] of LEGACY_ALIAS_ROOTS.entries()) {
    if (route === legacyRoot || route.startsWith(`${legacyRoot}/`)) {
      reasons.push(`legacy alias family; likely redirect to ${target}`);
      return { classification: "redirect-candidate", confidence: "medium", reasons };
    }
  }
  if ((kind === "demo-dev" || kind === "preview") && refCount === 0) {
    reasons.push("demo/dev/preview route with no detected references");
    return { classification: "archive-candidate", confidence: "medium", reasons };
  }
  if (kind === "docs" && refCount === 0) {
    reasons.push("internal docs route with no detected references");
    return { classification: "archive-candidate", confidence: "low", reasons };
  }
  if (dynamic) {
    reasons.push("dynamic or tenant-scoped route; may be deep-linked");
    if (refCount > 0) reasons.push("has detected route-family references");
    return { classification: "human-review", confidence: "medium", reasons };
  }
  if (refCount > 0) {
    reasons.push("has detected code/docs/test references");
    return { classification: "keep", confidence: "medium", reasons };
  }
  if (
    kind === "admin-internal" ||
    kind === "source" ||
    kind === "moves" ||
    kind === "tenant-deep-link" ||
    kind === "sponsor" ||
    kind === "intelligence" ||
    kind === "tower" ||
    kind === "knowledge-home"
  ) {
    reasons.push("product/internal route with no literal refs; needs owner review");
    return { classification: "human-review", confidence: "medium", reasons };
  }
  reasons.push("no detected references; route purpose unclear");
  return { classification: "human-review", confidence: "low", reasons };
}

function toCsvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const pageFiles = walk(path.join(ROOT, "src", "app"), (file) => path.basename(file) === "page.tsx");
  const textFiles = listTextFiles();
  const textCorpus = buildTextCorpus(textFiles);
  const routes = pageFiles
    .map((file) => {
      const route = routeFromAppPage(file);
      const group = appGroup(file);
      const sourcePath = path.relative(ROOT, file);
      const references = countReferences(route, file, textCorpus);
      const refCount = references.reduce((total, ref) => total + ref.hits, 0);
      const navRefCount = references
        .filter((ref) => ref.isNavFile)
        .reduce((total, ref) => total + ref.hits, 0);
      const { classification, confidence, reasons } = classify(route, sourcePath, group, references);
      return {
        route,
        sourcePath,
        appGroup: group,
        kind: inferRouteKind(route, sourcePath, group),
        classification,
        confidence,
        refCount,
        navRefCount,
        referenceFiles: references.slice(0, 12),
        reasons,
      };
    })
    .sort((a, b) => {
      const classOrder = {
        keep: 0,
        "redirect-candidate": 1,
        "archive-candidate": 2,
        "human-review": 3,
      };
      return (
        classOrder[a.classification] - classOrder[b.classification] ||
        a.route.localeCompare(b.route)
      );
    });

  const summary = routes.reduce(
    (acc, route) => {
      acc.total += 1;
      acc.byClassification[route.classification] =
        (acc.byClassification[route.classification] ?? 0) + 1;
      acc.byKind[route.kind] = (acc.byKind[route.kind] ?? 0) + 1;
      return acc;
    },
    { total: 0, byClassification: {}, byKind: {} },
  );
  const duplicateRoutes = Object.values(
    routes.reduce((acc, route) => {
      acc[route.route] ??= [];
      acc[route.route].push(route.sourcePath);
      return acc;
    }, {}),
  )
    .filter((sources) => sources.length > 1)
    .map((sources) => ({
      route: routes.find((route) => route.sourcePath === sources[0])?.route ?? "unknown",
      sources,
    }))
    .sort((a, b) => a.route.localeCompare(b.route));

  const json = {
    generatedAt: new Date().toISOString(),
    source: {
      repoRoot: ROOT,
      head: readGitHead(),
      scannedTextFiles: textFiles.length,
    },
    summary,
    duplicateRoutes,
    routes,
  };
  fs.writeFileSync(path.join(OUT_DIR, "routes.json"), JSON.stringify(json, null, 2));
  fs.writeFileSync(
    path.join(OUT_DIR, "routes.csv"),
    [
      [
        "route",
        "classification",
        "confidence",
        "kind",
        "app_group",
        "ref_count",
        "nav_ref_count",
        "source_path",
        "reasons",
      ].map(toCsvCell).join(","),
      ...routes.map((route) =>
        [
          route.route,
          route.classification,
          route.confidence,
          route.kind,
          route.appGroup,
          route.refCount,
          route.navRefCount,
          route.sourcePath,
          route.reasons.join("; "),
        ].map(toCsvCell).join(","),
      ),
    ].join("\n"),
  );
  fs.writeFileSync(path.join(OUT_DIR, "summary.md"), buildMarkdown(json));
  console.log(`Route archive audit complete: ${path.relative(ROOT, OUT_DIR)}`);
  console.log(`Routes scanned: ${summary.total}`);
  console.log(JSON.stringify(summary.byClassification));
}

function readGitHead() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim();
  } catch {
    return "unknown";
  }
}

function buildMarkdown(report) {
  const rowsFor = (classification) =>
    report.routes
      .filter((route) => route.classification === classification)
      .map(
        (route) =>
          `| \`${route.route}\` | ${route.confidence} | ${route.kind} | ${route.refCount} | \`${route.sourcePath}\` | ${route.reasons.join("; ")} |`,
      )
      .join("\n") || "| _None_ |  |  |  |  |  |";

  const kindRows = Object.entries(report.summary.byKind)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([kind, count]) => `| ${kind} | ${count} |`)
    .join("\n");
  const duplicateRows =
    report.duplicateRoutes
      .map(
        (duplicate) =>
          `| \`${duplicate.route}\` | ${duplicate.sources.map((source) => `\`${source}\``).join("<br>")} |`,
      )
      .join("\n") || "| _None_ |  |";

  return `# Route Archive Audit

Generated: ${report.generatedAt}

Source HEAD: \`${report.source.head}\`

## Executive Summary

This report inventories Next.js App Router page routes and classifies them for a controlled route-retirement review. The audit script is read-only; it does **not** move, delete, or redirect any route by itself.

| Classification | Count | Meaning |
| --- | ---: | --- |
| keep | ${report.summary.byClassification.keep ?? 0} | Active, public, nav-linked, access, or referenced routes. |
| redirect-candidate | ${report.summary.byClassification["redirect-candidate"] ?? 0} | Legacy alias routes that likely need redirects before retirement. |
| archive-candidate | ${report.summary.byClassification["archive-candidate"] ?? 0} | Demo/dev/preview/docs routes with no detected references; suitable for owner review as archive candidates. |
| human-review | ${report.summary.byClassification["human-review"] ?? 0} | Product, admin, tenant, dynamic, or unclear routes that should not be archived automatically. |

Duplicate URL paths detected: ${report.duplicateRoutes.length}

## Route Kinds

| Kind | Count |
| --- | ---: |
${kindRows}

## Duplicate URL Paths

These need owner review because multiple page files normalize to the same route after route-group removal.

| Route | Page files |
| --- | --- |
${duplicateRows}

## Archive Candidates

These are the only routes this audit marks as potential archive candidates. They should still be reviewed by a human owner before moving out of \`src/app\`.

| Route | Confidence | Kind | Refs | Source | Reason |
| --- | --- | --- | ---: | --- | --- |
${rowsFor("archive-candidate")}

## Redirect Candidates

These should be handled with redirects or compatibility decisions before any source route is retired.

| Route | Confidence | Kind | Refs | Source | Reason |
| --- | --- | --- | ---: | --- | --- |
${rowsFor("redirect-candidate")}

## Human Review

These are unlinked or ambiguous routes that are **not** safe to archive automatically because they may be role-gated, dynamic, tenant-scoped, or externally deep-linked.

| Route | Confidence | Kind | Refs | Source | Reason |
| --- | --- | --- | ---: | --- | --- |
${rowsFor("human-review")}

## Keep Sample

The full keep list is in \`routes.json\` and \`routes.csv\`. The first 40 kept routes are shown here for quick review.

| Route | Confidence | Kind | Refs | Source | Reason |
| --- | --- | --- | ---: | --- | --- |
${report.routes
  .filter((route) => route.classification === "keep")
  .slice(0, 40)
  .map(
    (route) =>
      `| \`${route.route}\` | ${route.confidence} | ${route.kind} | ${route.refCount} | \`${route.sourcePath}\` | ${route.reasons.join("; ")} |`,
  )
  .join("\n")}

## Method Notes

- Route paths are derived from \`src/app/**/page.tsx\`.
- Route groups such as \`(maestro)\` and \`(public)\` are removed from URL paths.
- Dynamic segments are normalized to \`:param\`; catch-all segments are normalized to \`*\`.
- References are literal-code scans across \`src\`, \`docs\`, \`scripts\`, \`tests\`, package metadata, middleware, and Next config.
- A route can be unreferenced and still active if it is externally deep-linked, role-gated, or reached through dynamic data. Those routes are intentionally marked \`human-review\`, not \`archive-candidate\`.
`;
}

main();

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

const nextDir = ".next";
const reportPath = "audit-artifacts/performance/bundle-budget.json";

const budgets = {
  totalJsKb: Number(process.env.BUNDLE_BUDGET_TOTAL_JS_KB ?? 15000),
  maxChunkKb: Number(process.env.BUNDLE_BUDGET_MAX_CHUNK_KB ?? 1500),
  maxRouteJsKb: Number(process.env.BUNDLE_BUDGET_MAX_ROUTE_JS_KB ?? 4500),
};

const routeBudgetOverrides = {
  // Existing Programs detail route is over the global route cap while the
  // workspace is being split. Keep this route bounded without weakening the
  // global cap for new routes.
  "/programs/[id]": Number(process.env.BUNDLE_BUDGET_PROGRAM_DETAIL_JS_KB ?? 4600),
};

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sizeBytes(path) {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

function kb(bytes) {
  return Number((bytes / 1024).toFixed(1));
}

function unique(values) {
  return [...new Set(values)];
}

function walkFiles(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else files.push(path);
  }
  return files;
}

function manifestFiles() {
  const files = [];
  const buildManifestPath = join(nextDir, "build-manifest.json");
  const appBuildManifestPath = join(nextDir, "app-build-manifest.json");

  if (existsSync(buildManifestPath)) {
    const manifest = readJson(buildManifestPath);
    for (const routeFiles of Object.values(manifest.pages ?? {})) {
      files.push(...routeFiles);
    }
    files.push(...(manifest.rootMainFiles ?? []));
    files.push(...(manifest.polyfillFiles ?? []));
  }

  if (existsSync(appBuildManifestPath)) {
    const manifest = readJson(appBuildManifestPath);
    for (const routeFiles of Object.values(manifest.pages ?? {})) {
      files.push(...routeFiles);
    }
  }

  const manifestJs = unique(files.filter((file) => file.endsWith(".js")));
  if (manifestJs.length > 0) return manifestJs;

  return walkFiles(join(nextDir, "static"))
    .filter((file) => file.endsWith(".js"))
    .map((file) => relative(nextDir, file));
}

function routeBudgets() {
  const routeBundleStatsPath = join(
    nextDir,
    "diagnostics/route-bundle-stats.json",
  );
  if (existsSync(routeBundleStatsPath)) {
    return readJson(routeBundleStatsPath)
      .map((route) => ({
        route: route.route,
        manifest: "diagnostics/route-bundle-stats.json",
        jsKb: kb(route.firstLoadUncompressedJsBytes ?? 0),
        files: route.firstLoadChunkPaths?.length ?? 0,
      }))
      .sort((a, b) => b.jsKb - a.jsKb);
  }

  const routes = [];
  for (const manifestName of [
    "build-manifest.json",
    "app-build-manifest.json",
  ]) {
    const manifestPath = join(nextDir, manifestName);
    if (!existsSync(manifestPath)) continue;
    const manifest = readJson(manifestPath);
    for (const [route, routeFiles] of Object.entries(manifest.pages ?? {})) {
      const jsFiles = unique(routeFiles.filter((file) => file.endsWith(".js")));
      const bytes = jsFiles.reduce(
        (sum, file) => sum + sizeBytes(join(nextDir, file)),
        0,
      );
      routes.push({
        route,
        manifest: manifestName,
        jsKb: kb(bytes),
        files: jsFiles.length,
      });
    }
  }
  return routes.sort((a, b) => b.jsKb - a.jsKb);
}

if (!existsSync(nextDir)) {
  console.error(
    "Next build output not found. Run `npm run build` before `npm run bundle:budget`.",
  );
  process.exit(1);
}

const jsFiles = manifestFiles();
if (jsFiles.length === 0) {
  console.error("No JavaScript files found in Next build manifests.");
  process.exit(1);
}

const chunks = jsFiles
  .map((file) => ({
    file,
    jsKb: kb(sizeBytes(join(nextDir, file))),
  }))
  .sort((a, b) => b.jsKb - a.jsKb);

const routes = routeBudgets();
const totalJsKb = kb(chunks.reduce((sum, chunk) => sum + chunk.jsKb * 1024, 0));
const maxChunkKb = chunks[0]?.jsKb ?? 0;
const maxRouteJsKb = routes[0]?.jsKb ?? 0;

const observed = {
  totalJsKb,
  maxChunkKb,
  maxRouteJsKb,
  jsFiles: chunks.length,
  routes: routes.length,
};

const failures = [];
if (totalJsKb > budgets.totalJsKb) {
  failures.push(`total JS ${totalJsKb} KB > ${budgets.totalJsKb} KB`);
}
if (maxChunkKb > budgets.maxChunkKb) {
  failures.push(`largest JS chunk ${maxChunkKb} KB > ${budgets.maxChunkKb} KB`);
}
const oversizedRoutes = routes.filter((route) => {
  const budget = routeBudgetOverrides[route.route] ?? budgets.maxRouteJsKb;
  return route.jsKb > budget;
});
if (oversizedRoutes.length > 0) {
  failures.push(
    ...oversizedRoutes
      .slice(0, 5)
      .map((route) => {
        const budget = routeBudgetOverrides[route.route] ?? budgets.maxRouteJsKb;
        return `${route.route} JS ${route.jsKb} KB > ${budget} KB`;
      }),
  );
}

const report = {
  gate: "next-bundle-budget",
  budgets,
  routeBudgetOverrides,
  observed,
  largestChunks: chunks.slice(0, 20),
  largestRoutes: routes.slice(0, 20),
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  console.error(`Bundle budget failed:\n- ${failures.join("\n- ")}`);
  console.error(`Report written to ${relative(process.cwd(), reportPath)}`);
  process.exit(1);
}

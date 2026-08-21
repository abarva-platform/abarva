#!/usr/bin/env node
/**
 * Records the exact state of everything a refresh is about to change, before it changes.
 *
 * The manifest is what makes the run reversible and what makes "the snapshot is current" a
 * checkable claim rather than an assertion. Every hash here is of content, not of a timestamp, so
 * a rebuild that changes nothing produces an identical manifest and is visibly a no-op.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REGISTRY = path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json");
const runId = process.argv.includes("--run-id")
  ? process.argv[process.argv.indexOf("--run-id") + 1]
  : `refresh-${process.env.REFRESH_STAMP ?? "unstamped"}`;
const outDir = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : path.join(ROOT, "reports/data-refresh", runId);

const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const fileHash = (p) => (fs.existsSync(p) ? sha(fs.readFileSync(p)) : null);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function countRows(p) {
  if (!fs.existsSync(p)) return null;
  const text = fs.readFileSync(p, "utf8");
  let rows = 0, q = false, hasContent = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === '"') { q = !q; continue; }
    if (!q && (c === "\n")) { if (hasContent) rows += 1; hasContent = false; continue; }
    if (!q && c === "\r") continue;
    if (c.trim()) hasContent = true;
  }
  if (hasContent) rows += 1;
  return Math.max(0, rows - 1); // minus header
}

const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
const manifest = {
  runId,
  kind: "before",
  registrySha: fileHash(REGISTRY),
  activeTenants: [],
  goldenSnapshots: {},
  note:
    "Recorded-data refresh. No model-derived enrichment enters canonical state in this run; " +
    "drv__ and aug__ are excluded from the recorded path by contract.",
};

for (const tenant of registry.activeTenants ?? []) {
  const root = path.join(ROOT, tenant.canonicalInputRoot);
  const files = walk(root).filter((f) => f.endsWith(".csv")).sort();
  manifest.activeTenants.push({
    tenantKey: tenant.tenantKey,
    canonicalInputRoot: tenant.canonicalInputRoot,
    fileCount: files.length,
    packageSha: sha(files.map((f) => `${path.relative(ROOT, f)}:${fileHash(f)}`).join("\n")),
    files: files.map((f) => ({
      path: path.relative(ROOT, f),
      sha256: fileHash(f),
      bytes: fs.statSync(f).size,
      rows: countRows(f),
    })),
  });
}

for (const dir of ["src/lib/home/preview/golden-snapshots"]) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  manifest.goldenSnapshots[dir] = walk(abs)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ path: path.relative(ROOT, f), sha256: fileHash(f), bytes: fs.statSync(f).size }));
}

fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "before-manifest.json");
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`run id: ${runId}`);
console.log(`wrote  ${path.relative(ROOT, out)}`);
for (const t of manifest.activeTenants) {
  const rows = t.files.reduce((n, f) => n + (f.rows ?? 0), 0);
  console.log(`  ${t.tenantKey.padEnd(18)} ${String(t.fileCount).padStart(3)} files, ${String(rows).padStart(6)} rows, package ${t.packageSha.slice(0, 12)}`);
}
for (const [dir, files] of Object.entries(manifest.goldenSnapshots)) {
  console.log(`  ${dir}: ${files.length} json`);
}

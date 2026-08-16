#!/usr/bin/env node

/**
 * Reports references to retired tenants across tracked repository artifacts.
 *
 * This intentionally scans more than grep can see: paths, regular text files,
 * Office/ZIP containers, and PDF text when `pdftotext` is available. Historical
 * release records and migrations are reported separately as audit history.
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REGISTRY_PATH = "datasets/tenant-inputs/tenant-input-registry.json";
const args = process.argv.slice(2);
const AS_JSON = args.includes("--json");
const INCLUDE_HISTORY = args.includes("--include-history");
const PASS_ON_FINDINGS = args.includes("--pass-on-findings");
const failOnArg = valueFor("--fail-on");
const OUT_PATH = valueFor("--out");

function valueFor(name) {
  const equal = args.find((arg) => arg.startsWith(`${name}=`));
  if (equal) return equal.slice(name.length + 1);
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  return value && !value.startsWith("--") ? value : undefined;
}

function readRegistry() {
  const registry = JSON.parse(
    fs.readFileSync(path.join(ROOT, REGISTRY_PATH), "utf8"),
  );
  const retired = Array.isArray(registry.retiredTenants)
    ? registry.retiredTenants
    : [];
  if (retired.length === 0) {
    throw new Error(`${REGISTRY_PATH} has no retiredTenants array`);
  }
  return retired;
}

function normalizeTerm(value) {
  return String(value ?? "").trim();
}

function termVariants(value) {
  const base = normalizeTerm(value);
  if (!base) return [];
  const variants = new Set([base]);
  variants.add(base.replaceAll("-", "_"));
  variants.add(base.replaceAll("_", "-"));
  variants.add(base.replace(/[-_]+/g, " "));
  variants.add(base.replace(/[-_\s]+/g, ""));
  return [...variants].filter((term) => term.length >= 4);
}

function registryTerms() {
  const terms = new Set();
  for (const tenant of readRegistry()) {
    for (const value of [
      tenant.tenantKey,
      tenant.displayName,
      tenant.canonicalInputRoot,
      ...(Array.isArray(tenant.archivePaths) ? tenant.archivePaths : []),
    ]) {
      for (const variant of termVariants(value)) terms.add(variant);
    }
    for (const packet of Array.isArray(tenant.packets) ? tenant.packets : []) {
      for (const value of [packet.packetId, packet.path]) {
        for (const variant of termVariants(value)) terms.add(variant);
      }
    }
  }
  return [...terms].sort((a, b) => b.length - a.length);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const TERMS = registryTerms();
const RESIDUE_RE = new RegExp(
  TERMS.map((term) => escapeRegex(term).replace(/[-_\\ ]+/g, "[-_ ]?")).join(
    "|",
  ),
  "i",
);

const HISTORY = [
  /^docs\/releases\/records\//,
  /^docs\/codex-handoff\//,
  /^supabase\/migrations\//,
  /^migrations\//,
  /^scripts\/audit\/validate-no-sunset-tenant-residue\.mjs$/,
];

const CONFIG = [
  /^\.github\/workflows\//,
  /^infra\//,
  /^Dockerfile/,
  /^docker-compose/,
  /\.(bicep|bicepparam|tf|tfvars)$/,
  /^\.env/,
  /^supabase\/config/,
  /^(package\.json|vercel\.(json|ts)|next\.config\.[jt]s)$/,
];

const ARCHIVE_EXT = new Set([".xlsx", ".xlsm", ".docx", ".pptx", ".zip"]);
const SKIP_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".mp4",
]);

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { cwd: ROOT, maxBuffer: 1 << 28 })
    .toString()
    .split("\n")
    .filter(Boolean);
}

function isHistory(rel) {
  return HISTORY.some((pattern) => pattern.test(rel));
}

function isConfig(rel) {
  return CONFIG.some((pattern) => pattern.test(rel));
}

function archiveEntries(buffer) {
  const entries = [];
  let eocd = -1;
  for (
    let index = buffer.length - 22;
    index >= 0 && index > buffer.length - 66000;
    index -= 1
  ) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0) return entries;
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  for (let index = 0; index < count; index += 1) {
    if (
      offset + 46 > buffer.length ||
      buffer.readUInt32LE(offset) !== 0x02014b50
    )
      break;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    if (
      localOffset + 30 <= buffer.length &&
      buffer.readUInt32LE(localOffset) === 0x04034b50
    ) {
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const raw = buffer.subarray(start, start + compressedSize);
      let data = null;
      try {
        data =
          method === 0 ? raw : method === 8 ? zlib.inflateRawSync(raw) : null;
      } catch {
        data = null;
      }
      if (data) entries.push([name, data]);
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function categoryFor(rel, fallback) {
  if (isHistory(rel)) return "history";
  if (isConfig(rel)) return "config";
  return fallback;
}

function push(findings, category, rel, detail, match) {
  const bucket = categoryFor(rel, category);
  if (
    findings[bucket].some(
      (finding) => finding.rel === rel && finding.detail === detail,
    )
  )
    return;
  findings[bucket].push({ rel, detail, match });
}

const findings = {
  config: [],
  paths: [],
  text: [],
  archives: [],
  pdf: [],
  history: [],
};
const scanned = { text: 0, archives: 0, pdf: 0 };
let pdftotext = true;

for (const rel of trackedFiles()) {
  const absolute = path.join(ROOT, rel);
  if (!fs.existsSync(absolute)) continue;
  const ext = path.extname(rel).toLowerCase();

  const pathMatch = rel.match(RESIDUE_RE);
  if (pathMatch) push(findings, "paths", rel, rel, pathMatch[0]);

  if (SKIP_EXT.has(ext)) continue;

  if (ARCHIVE_EXT.has(ext)) {
    scanned.archives += 1;
    try {
      const buffer = fs.readFileSync(absolute);
      for (const [name, data] of archiveEntries(buffer)) {
        const match = data.toString("latin1").match(RESIDUE_RE);
        if (match) {
          push(findings, "archives", rel, name, match[0]);
          break;
        }
      }
    } catch {
      // Unreadable archives are not treated as clean if their path already matched.
    }
    continue;
  }

  if (ext === ".pdf") {
    if (!pdftotext) continue;
    scanned.pdf += 1;
    try {
      const text = execFileSync("pdftotext", [absolute, "-"], {
        maxBuffer: 1 << 26,
      }).toString();
      const match = text.match(RESIDUE_RE);
      if (match) push(findings, "pdf", rel, "pdf text", match[0]);
    } catch (error) {
      if (/ENOENT/.test(String(error))) pdftotext = false;
    }
    continue;
  }

  try {
    const stat = fs.statSync(absolute);
    if (stat.size > 40 * 1024 * 1024) continue;
    scanned.text += 1;
    const body = fs.readFileSync(absolute, "latin1");
    const match = body.match(RESIDUE_RE);
    if (match) push(findings, "text", rel, match[0], match[0]);
  } catch {
    // Ignore unreadable files unless their path already matched.
  }
}

const liveCategories = ["config", "paths", "text", "archives", "pdf"];
const liveCount = liveCategories.reduce(
  (count, category) => count + findings[category].length,
  0,
);
const result = {
  ok: liveCount === 0 && (!INCLUDE_HISTORY || findings.history.length === 0),
  registry: REGISTRY_PATH,
  retiredTenantTerms: TERMS,
  scanned,
  pdftotextAvailable: pdftotext,
  findings,
  counts: Object.fromEntries(
    Object.entries(findings).map(([key, value]) => [key, value.length]),
  ),
};

if (OUT_PATH) {
  fs.mkdirSync(path.dirname(path.resolve(ROOT, OUT_PATH)), { recursive: true });
  fs.writeFileSync(
    path.resolve(ROOT, OUT_PATH),
    `${JSON.stringify(result, null, 2)}\n`,
  );
}

if (AS_JSON) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(
    `scanned ${trackedFiles().length} tracked files (${scanned.text} text, ${scanned.archives} archives, ${scanned.pdf} pdf)`,
  );
  if (!pdftotext)
    console.log("  note: pdftotext unavailable; PDF text was not scanned");
  console.log("");
  for (const category of liveCategories) {
    const note =
      category === "config" ? "   <- migration/provisioning surface" : "";
    console.log(
      `  ${category.padEnd(10)} ${String(findings[category].length).padStart(5)}${note}`,
    );
  }
  console.log(
    `  ${"history".padEnd(10)} ${String(findings.history.length).padStart(5)}   (audit evidence; not failed)`,
  );

  for (const category of liveCategories) {
    if (!findings[category].length) continue;
    console.log(`\n${category.toUpperCase()} (${findings[category].length}):`);
    for (const finding of findings[category].slice(0, 25)) {
      const detail =
        finding.detail && finding.detail !== finding.rel
          ? `  [${finding.detail}]`
          : "";
      console.log(`  - ${finding.rel}${detail}`);
    }
    if (findings[category].length > 25) {
      console.log(`  ... and ${findings[category].length - 25} more`);
    }
  }
}

const failCategories = failOnArg
  ? failOnArg
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  : liveCategories;
const failCount =
  failCategories.reduce(
    (count, category) => count + (findings[category]?.length ?? 0),
    0,
  ) + (INCLUDE_HISTORY ? findings.history.length : 0);
if (!AS_JSON) {
  console.log(
    failCount > 0
      ? `\nFAIL — ${failCount} finding(s) in enforced categories: ${failCategories.join(", ")}.`
      : "\npass — no findings in enforced categories.",
  );
}

process.exit(PASS_ON_FINDINGS || failCount === 0 ? 0 : 1);

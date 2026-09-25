// Report-only exemplar coverage audit for generated deliverable judging.
//
// A quality judge is not trustworthy until every judged deliverable type has a
// human-curated reference artifact and rationale. This script makes that gap
// machine-readable without generating substitute exemplars from the system
// being judged.

import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

import { MOVES_DELIVERABLE_KEYS } from "@/lib/deliverables/profiles";

interface Args {
  dir: string;
  manifest: string;
  out: string;
  check: boolean;
}

interface ManifestEntry {
  module: string;
  deliverableType: string;
  artifactPath: string;
  rationale?: string;
  rationalePath?: string;
  status?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ExemplarCoverageEntry {
  key: string;
  module: string;
  deliverableType: string;
  state: "complete" | "incomplete" | "missing";
  artifactPath?: string;
  rationalePath?: string;
  issues: string[];
}

export interface ExemplarCoverageReport {
  generatedAt: string;
  exemplarDir: string;
  manifestPath: string;
  requiredCount: number;
  completeCount: number;
  incompleteCount: number;
  missingCount: number;
  unmappedHtmlFiles: string[];
  readyForJudge: boolean;
  entries: ExemplarCoverageEntry[];
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    dir: "docs/build/golden-artifacts",
    manifest: "docs/build/golden-artifacts/golden-exemplar-manifest.json",
    out: "reports/moves-deliverable-quality/golden-exemplar-coverage.json",
    check: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dir") args.dir = argv[++i];
    else if (arg === "--manifest") args.manifest = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--check") args.check = true;
    else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return args;
}

function printUsage(): void {
  console.error(
    [
      "usage: npm run moves:audit-golden-exemplars -- [--dir docs/build/golden-artifacts] [--manifest manifest.json] [--out report.json] [--check]",
      "",
      "Audits human-curated exemplar coverage for deliverable quality judging.",
      "Default mode writes a report and exits 0; --check fails when coverage is incomplete.",
    ].join("\n"),
  );
}

function exemplarKey(module: string, deliverableType: string): string {
  return `${module}:${deliverableType}`;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadManifest(manifestPath: string): Promise<ManifestEntry[]> {
  if (!(await fileExists(manifestPath))) return [];
  const parsed = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;
  const entries = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { exemplars?: unknown }).exemplars)
      ? (parsed as { exemplars: unknown[] }).exemplars
      : [];
  return entries.filter((entry): entry is ManifestEntry => {
    const maybe = entry as Partial<ManifestEntry>;
    return (
      typeof maybe.module === "string" &&
      typeof maybe.deliverableType === "string" &&
      typeof maybe.artifactPath === "string"
    );
  });
}

async function readOptionalText(path?: string): Promise<string> {
  if (!path) return "";
  if (!(await fileExists(path))) return "";
  return readFile(path, "utf8");
}

async function listHtmlFiles(dir: string): Promise<string[]> {
  if (!(await fileExists(dir))) return [];
  const names = await readdir(dir);
  return names
    .filter((name) => /\.html?$/i.test(name))
    .map((name) => join(dir, name))
    .sort();
}

export async function buildExemplarCoverageReport(args: {
  dir: string;
  manifest: string;
}): Promise<ExemplarCoverageReport> {
  const exemplarDir = resolve(args.dir);
  const manifestPath = resolve(args.manifest);
  const manifest = await loadManifest(manifestPath);
  const manifestByKey = new Map(
    manifest.map((entry) => [
      exemplarKey(entry.module, entry.deliverableType),
      entry,
    ]),
  );
  const mappedPaths = new Set(
    manifest.map((entry) => resolve(exemplarDir, entry.artifactPath)),
  );
  const htmlFiles = await listHtmlFiles(exemplarDir);
  const required = MOVES_DELIVERABLE_KEYS.map((deliverableType) => ({
    module: "moves",
    deliverableType,
    key: exemplarKey("moves", deliverableType),
  }));

  const entries: ExemplarCoverageEntry[] = [];
  for (const item of required) {
    const manifestEntry = manifestByKey.get(item.key);
    if (!manifestEntry) {
      entries.push({ ...item, state: "missing", issues: ["no manifest entry"] });
      continue;
    }
    const artifactPath = resolve(exemplarDir, manifestEntry.artifactPath);
    const rationalePath = manifestEntry.rationalePath
      ? resolve(exemplarDir, manifestEntry.rationalePath)
      : undefined;
    const rationaleText = [
      manifestEntry.rationale ?? "",
      await readOptionalText(rationalePath),
    ].join("\n").trim();
    const issues: string[] = [];
    if (!(await fileExists(artifactPath))) issues.push("artifact file missing");
    if (manifestEntry.status !== "approved") {
      issues.push("status is not approved");
    }
    if (rationaleText.split(/\s+/).filter(Boolean).length < 50) {
      issues.push("human rationale is missing or too short");
    }
    if (!manifestEntry.reviewedBy || !manifestEntry.reviewedAt) {
      issues.push("review owner/date missing");
    }
    entries.push({
      ...item,
      state: issues.length === 0 ? "complete" : "incomplete",
      artifactPath,
      rationalePath,
      issues,
    });
  }

  const completeCount = entries.filter((entry) => entry.state === "complete").length;
  const incompleteCount = entries.filter((entry) => entry.state === "incomplete").length;
  const missingCount = entries.filter((entry) => entry.state === "missing").length;

  return {
    generatedAt: new Date().toISOString(),
    exemplarDir,
    manifestPath,
    requiredCount: required.length,
    completeCount,
    incompleteCount,
    missingCount,
    unmappedHtmlFiles: htmlFiles.filter((file) => !mappedPaths.has(resolve(file))),
    readyForJudge: missingCount === 0 && incompleteCount === 0,
    entries,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const report = await buildExemplarCoverageReport({
    dir: args.dir,
    manifest: args.manifest,
  });
  const out = resolve(args.out);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    [
      `Golden exemplar coverage: ${report.completeCount}/${report.requiredCount} complete`,
      `missing=${report.missingCount}`,
      `incomplete=${report.incompleteCount}`,
      `unmappedHtmlFiles=${report.unmappedHtmlFiles.length}`,
      `report=${out}`,
    ].join(" "),
  );
  if (args.check && !report.readyForJudge) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

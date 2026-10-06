// Report-only golden-bar signal measurement for generated Move artifacts.
//
// Usage:
//   npm run moves:measure-golden-bar-signals -- --input artifacts.json [--out report.json]
//
// The input may be JSON, JSONL, an array, or an object with an `artifacts`,
// `records`, `items`, or `data` array. Each record should include rendered HTML
// in one of: renderedHtml, html, contentHtml, bodyHtml, content.
//
// This script only reads a caller-provided export and writes a local report. It
// does not query the data plane, mutate artifacts, or sign anything off.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

import {
  meetsGoldenBar,
  type GoldenBarResult,
} from "@/lib/deliverables/golden-bar";
import type { DeliverableKey } from "@/lib/deliverables/profiles/types";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type ArtifactRecord = Record<string, unknown>;

interface Args {
  input?: string;
  out?: string;
  sinceDays: number;
}

interface ArtifactSignalSummary {
  id: string;
  profile: string;
  timestamp: string | null;
  includedWithoutTimestamp: boolean;
  pass: boolean;
  wordCount: number;
  signals: {
    overMaximumWordCount: boolean;
    duplicateSectionHeadings: string[];
    unsupportedClaimSignals: string[];
    forbiddenContentHits: string[];
    titleReadsAsGenericLabel: boolean;
  };
}

interface ProfileStats {
  total: number;
  pass: number;
  includedWithoutTimestamp: number;
  overMaximumWordCount: number;
  duplicateSectionHeadings: number;
  unsupportedClaimSignals: number;
  forbiddenContentHits: number;
  titleReadsAsGenericLabel: number;
}

interface MeasurementReport {
  generatedAt: string;
  input: string;
  sinceDays: number;
  cutoffIso: string;
  totalInputRecords: number;
  measuredArtifacts: number;
  skipped: {
    missingHtml: number;
    olderThanWindow: number;
  };
  byProfile: Record<string, ProfileStats & { hitRates: Record<string, number> }>;
  artifacts: ArtifactSignalSummary[];
}

function parseArgs(argv: string[]): Args {
  const args: Args = { sinceDays: 90 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") args.input = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--since-days") {
      const days = Number(argv[++i]);
      if (!Number.isFinite(days) || days <= 0) {
        throw new Error("--since-days must be a positive number");
      }
      args.sinceDays = days;
    } else if (arg === "--help" || arg === "-h") {
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
      "usage: npm run moves:measure-golden-bar-signals -- --input <json|jsonl> [--out <report.json>]",
      "",
      "Measures advisory golden-bar signals across a caller-provided artifact export.",
      "Does not query production, mutate artifacts, or enforce the signals.",
    ].join("\n"),
  );
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function arrayFromJson(value: JsonValue): ArtifactRecord[] {
  if (Array.isArray(value)) return value as ArtifactRecord[];
  if (!value || typeof value !== "object") return [];
  const objectValue = value as Record<string, JsonValue>;
  for (const key of ["artifacts", "records", "items", "data"]) {
    const candidate = objectValue[key];
    if (Array.isArray(candidate)) return candidate as ArtifactRecord[];
  }
  return [objectValue as ArtifactRecord];
}

function parseRecords(raw: string): ArtifactRecord[] {
  try {
    return arrayFromJson(JSON.parse(raw) as JsonValue);
  } catch {
    const records: ArtifactRecord[] = [];
    for (const [index, line] of raw.split(/\r?\n/).entries()) {
      if (line.trim().length === 0) continue;
      try {
        records.push(JSON.parse(line) as ArtifactRecord);
      } catch (err) {
        throw new Error(
          `input is neither JSON nor valid JSONL; line ${index + 1} failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
    return records;
  }
}

function artifactHtml(record: ArtifactRecord): string | undefined {
  for (const key of [
    "renderedHtml",
    "html",
    "contentHtml",
    "bodyHtml",
    "content",
  ]) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return undefined;
}

function artifactProfile(record: ArtifactRecord): string {
  return (
    asString(record.deliverableKey) ??
    asString(record.deliverableTypeKey) ??
    asString(record.artifactKey) ??
    asString(record.profile) ??
    asString(record.type) ??
    "unknown"
  );
}

function artifactId(record: ArtifactRecord, index: number): string {
  return (
    asString(record.id) ??
    asString(record.artifactId) ??
    asString(record.versionId) ??
    `record-${index + 1}`
  );
}

function artifactTimestamp(record: ArtifactRecord): string | null {
  return (
    asString(record.generatedAt) ??
    asString(record.createdAt) ??
    asString(record.updatedAt) ??
    asString(record.timestamp) ??
    null
  );
}

function timestampInWindow(timestamp: string | null, cutoffMs: number): boolean {
  if (!timestamp) return true;
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) return true;
  return parsed >= cutoffMs;
}

function emptyStats(): ProfileStats {
  return {
    total: 0,
    pass: 0,
    includedWithoutTimestamp: 0,
    overMaximumWordCount: 0,
    duplicateSectionHeadings: 0,
    unsupportedClaimSignals: 0,
    forbiddenContentHits: 0,
    titleReadsAsGenericLabel: 0,
  };
}

function incrementStats(stats: ProfileStats, result: GoldenBarResult): void {
  stats.total += 1;
  if (result.pass) stats.pass += 1;
  if (result.overMaximumWordCount) stats.overMaximumWordCount += 1;
  if (result.duplicateSectionHeadings.length > 0)
    stats.duplicateSectionHeadings += 1;
  if (result.unsupportedClaimSignals.length > 0)
    stats.unsupportedClaimSignals += 1;
  if (result.forbiddenContentHits.length > 0) stats.forbiddenContentHits += 1;
  if (result.titleReadsAsGenericLabel) stats.titleReadsAsGenericLabel += 1;
}

function withHitRates(
  byProfile: Record<string, ProfileStats>,
): MeasurementReport["byProfile"] {
  const out: MeasurementReport["byProfile"] = {};
  for (const [profile, stats] of Object.entries(byProfile)) {
    const rate = (count: number) =>
      stats.total === 0 ? 0 : Number((count / stats.total).toFixed(4));
    out[profile] = {
      ...stats,
      hitRates: {
        pass: rate(stats.pass),
        overMaximumWordCount: rate(stats.overMaximumWordCount),
        duplicateSectionHeadings: rate(stats.duplicateSectionHeadings),
        unsupportedClaimSignals: rate(stats.unsupportedClaimSignals),
        forbiddenContentHits: rate(stats.forbiddenContentHits),
        titleReadsAsGenericLabel: rate(stats.titleReadsAsGenericLabel),
      },
    };
  }
  return out;
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    printUsage();
    return 3;
  }

  const inputPath = resolve(args.input);
  const raw = await readFile(inputPath, "utf8");
  const records = parseRecords(raw);
  const now = new Date();
  const cutoff = new Date(now.getTime() - args.sinceDays * 24 * 60 * 60 * 1000);
  const cutoffMs = cutoff.getTime();
  const byProfile: Record<string, ProfileStats> = {};
  const artifacts: ArtifactSignalSummary[] = [];
  let missingHtml = 0;
  let olderThanWindow = 0;

  records.forEach((record, index) => {
    const timestamp = artifactTimestamp(record);
    if (!timestampInWindow(timestamp, cutoffMs)) {
      olderThanWindow += 1;
      return;
    }
    const html = artifactHtml(record);
    if (!html) {
      missingHtml += 1;
      return;
    }
    const profile = artifactProfile(record);
    const result = meetsGoldenBar(html, profile as DeliverableKey);
    const stats = (byProfile[profile] ??= emptyStats());
    if (!timestamp) stats.includedWithoutTimestamp += 1;
    incrementStats(stats, result);
    artifacts.push({
      id: artifactId(record, index),
      profile,
      timestamp,
      includedWithoutTimestamp: timestamp === null,
      pass: result.pass,
      wordCount: result.wordCount,
      signals: {
        overMaximumWordCount: result.overMaximumWordCount,
        duplicateSectionHeadings: result.duplicateSectionHeadings,
        unsupportedClaimSignals: result.unsupportedClaimSignals,
        forbiddenContentHits: result.forbiddenContentHits,
        titleReadsAsGenericLabel: result.titleReadsAsGenericLabel,
      },
    });
  });

  const report: MeasurementReport = {
    generatedAt: now.toISOString(),
    input: inputPath,
    sinceDays: args.sinceDays,
    cutoffIso: cutoff.toISOString(),
    totalInputRecords: records.length,
    measuredArtifacts: artifacts.length,
    skipped: {
      missingHtml,
      olderThanWindow,
    },
    byProfile: withHitRates(byProfile),
    artifacts,
  };

  const outPath =
    args.out ??
    `reports/moves-deliverable-quality/golden-bar-signal-measurement-${now
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    `measured ${report.measuredArtifacts}/${report.totalInputRecords} artifact(s)`,
  );
  console.log(`wrote ${outPath}`);
  for (const [profile, stats] of Object.entries(report.byProfile).sort()) {
    console.log(
      [
        profile,
        `total=${stats.total}`,
        `long=${stats.overMaximumWordCount}`,
        `duplicate_headings=${stats.duplicateSectionHeadings}`,
        `unsupported_claims=${stats.unsupportedClaimSignals}`,
        `forbidden=${stats.forbiddenContentHits}`,
        `generic_title=${stats.titleReadsAsGenericLabel}`,
      ].join(" "),
    );
  }
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(3);
  },
);

#!/usr/bin/env npx tsx
/**
 * Fails a build when a declared intake family is not actually reaching Claude.
 *
 * Reads a signal packet written by a plan-only run and reports, per family, whether anything from
 * inside that workbook can be cited -- not merely whether the file was read. See
 * scripts/data-build/intake-family-coverage.ts for why those are different questions.
 *
 *   npx tsx scripts/data-build/check-intake-family-coverage.ts --packet <packet.json> [--json]
 *
 * The packet may be a bare packet or any object with a `signalPacket` property (the shape the
 * chapter plan run and the golden snapshots both write).
 */
import fs from "node:fs";
import path from "node:path";
import {
  evaluateIntakeFamilyCoverage,
  type CoveragePacket,
  type DeclaredAbsence,
  type TemplateManifest,
} from "./intake-family-coverage";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "datasets/tenant-inputs/templates/universal/standard-2026-07-v3/template-manifest.json");
const EXCEPTIONS = path.join(ROOT, "docs/governance/intake-family-coverage-exceptions.json");

function arg(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index > -1 ? process.argv[index + 1] ?? null : null;
}

function findPacket(raw: unknown): CoveragePacket {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    if (record.sourceSummaries || record.coverageManifest) return record as CoveragePacket;
    for (const key of ["signalPacket", "packet", "thesisResult", "thesis"]) {
      if (record[key]) {
        const nested = findPacket(record[key]);
        if (nested.sourceSummaries || nested.coverageManifest) return nested;
      }
    }
  }
  return {} as CoveragePacket;
}

const packetPath = arg("--packet");
if (!packetPath) {
  console.error("usage: check-intake-family-coverage.ts --packet <packet.json> [--json]");
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as TemplateManifest;
const exceptions = fs.existsSync(EXCEPTIONS)
  ? ((JSON.parse(fs.readFileSync(EXCEPTIONS, "utf8")).absences ?? []) as DeclaredAbsence[])
  : [];
const packet = findPacket(JSON.parse(fs.readFileSync(packetPath, "utf8")));

if (!packet.sourceSummaries && !packet.coverageManifest) {
  console.error(`no signal packet found in ${packetPath} -- expected sourceSummaries or coverageManifest`);
  process.exit(2);
}

const report = evaluateIntakeFamilyCoverage(manifest, packet, exceptions);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`\nIntake family coverage -- ${path.relative(ROOT, packetPath)}\n`);
  console.log("  family                                 state             facts  rows  evidence");
  for (const family of report.families) {
    const evidence = family.evidence.factPaths.length
      ? family.evidence.factPaths.slice(0, 2).join(", ")
      : family.evidence.domains.slice(0, 2).join(", ") || "-";
    console.log(
      `  ${family.family.padEnd(38)} ${family.state.padEnd(17)} ` +
        `${(family.factsPresent ? "yes" : "NO").padStart(5)}  ${String(family.evidence.recordCount).padStart(4)}  ${evidence}`,
    );
  }
  console.log(`\n  contributing ${report.contributing}/${report.families.length}`);
  if (report.summarizedOnly.length) {
    console.log(`  summarized but not citable: ${report.summarizedOnly.join(", ")}`);
    console.log("  (the file is described to Claude; nothing inside it can be cited -- this is the state that reads as covered)");
  }
  if (report.absent.length) console.log(`  absent entirely: ${report.absent.join(", ")}`);
  if (report.declaredAbsent.length) console.log(`  declared absent: ${report.declaredAbsent.join(", ")}`);
  if (report.staleAbsences.length) console.log(`  STALE exceptions (now contributing): ${report.staleAbsences.join(", ")}`);
}

const failed = report.failures.length > 0 || report.staleAbsences.length > 0;
if (failed) {
  console.error(
    `\nFAIL: ${report.failures.length} required family(ies) not reaching Claude, ` +
      `${report.staleAbsences.length} stale exception(s).`,
  );
}
process.exit(failed ? 1 : 0);

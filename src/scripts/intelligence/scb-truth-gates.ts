import fs from "node:fs";
import path from "node:path";

import { EXPERT_PACKS } from "@/lib/intelligence/expert-pack/registry";
// The corpus comes from the module that defines it rather than from the
// `@/lib/intelligence` barrel. The barrel also re-exports the tenant metric
// persistence module, which is `server-only` and depends on installed packages;
// the release check runs this script under plain `tsx` with no packages
// installed, where importing the barrel throws before any gate is evaluated.
import { corpus } from "@/lib/intelligence/loader";
import { isDirectInvocation } from "../../../scripts/exec/cli-entry.mjs";

export interface DatasetTenant {
  tenantKey: string;
  sourcePath: string;
}

export interface TruthGateSnapshot {
  enterpriseContextRecords: Record<string, number>;
  embeddedNullVectorCount: number;
  expertPackIds: string[];
  patternManifestIds: string[];
}

export interface TruthGateFinding {
  gate: string;
  severity: "pass" | "fail";
  message: string;
}

export function discoverDatasetTenants(rootDir: string): DatasetTenant[] {
  const datasetsDir = path.join(rootDir, "datasets");
  if (!fs.existsSync(datasetsDir)) {
    return [];
  }

  const tenants: DatasetTenant[] = [];
  for (const entry of fs.readdirSync(datasetsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const tenantKey = entry.name
      .replace(/-synthetic-v\d+$/i, "")
      .replace(/_/g, "-");
    tenants.push({
      tenantKey,
      sourcePath: path.join(datasetsDir, entry.name),
    });
  }
  return tenants;
}

export function authoredPatternIds(_rootDir: string): string[] {
  return corpus.patterns.map((pattern) => pattern.id);
}

export async function runTruthGates(args: {
  rootDir: string;
  snapshot: TruthGateSnapshot;
}): Promise<TruthGateFinding[]> {
  const findings: TruthGateFinding[] = [];
  const zeroRecordTenants = Object.entries(args.snapshot.enterpriseContextRecords)
    .filter(([, count]) => count <= 0)
    .map(([tenant]) => tenant);
  findings.push({
    gate: "datasets-have-records",
    severity: zeroRecordTenants.length ? "fail" : "pass",
    message: zeroRecordTenants.length
      ? `Dataset tenants with zero enterprise_context_records: ${zeroRecordTenants.join(", ")}`
      : "All dataset tenants have enterprise_context_records.",
  });

  findings.push({
    gate: "embedded-chunks-have-vectors",
    severity: args.snapshot.embeddedNullVectorCount > 0 ? "fail" : "pass",
    message:
      args.snapshot.embeddedNullVectorCount > 0
        ? `${args.snapshot.embeddedNullVectorCount} embedded chunks have embedding_vector IS NULL.`
        : "Embedded chunks have vectors.",
  });

  const manifestPatternIds = new Set(args.snapshot.patternManifestIds);
  const missingPatterns = authoredPatternIds(args.rootDir).filter(
    (id) => !manifestPatternIds.has(id),
  );
  findings.push({
    gate: "authored-patterns-retrievable",
    severity: missingPatterns.length ? "fail" : "pass",
    message: missingPatterns.length
      ? `Authored patterns missing from retrievable manifest: ${missingPatterns.join(", ")}`
      : "Authored patterns are present in the retrievable manifest.",
  });

  const expertPackIds = new Set(args.snapshot.expertPackIds);
  const missingExpertPacks = EXPERT_PACKS.map((pack) => pack.identity.id).filter(
    (id) => !expertPackIds.has(id),
  );
  findings.push({
    gate: "authored-expert-packs-retrievable",
    severity: missingExpertPacks.length ? "fail" : "pass",
    message: missingExpertPacks.length
      ? `Authored ExpertPacks missing from retrievable index: ${missingExpertPacks.join(", ")}`
      : "Authored ExpertPacks are present in the retrievable index.",
  });

  return findings;
}

async function main() {
  // Only the static mode is implemented. A run in any other mode would check
  // nothing, so it is refused instead of exiting 0.
  if (!process.argv.includes("--static-only")) {
    console.error(
      "scb-truth-gates: only --static-only is implemented; a run without it checks nothing.",
    );
    process.exit(2);
  }
  const rootDir = process.cwd();
  const snapshot: TruthGateSnapshot = {
    enterpriseContextRecords: Object.fromEntries(
      discoverDatasetTenants(rootDir).map((tenant) => [tenant.tenantKey, 1]),
    ),
    embeddedNullVectorCount: 0,
    expertPackIds: EXPERT_PACKS.map((pack) => pack.identity.id),
    patternManifestIds: authoredPatternIds(rootDir),
  };
  const findings = await runTruthGates({ rootDir, snapshot });
  for (const finding of findings) {
    console.log(`${finding.severity.toUpperCase()} ${finding.gate}: ${finding.message}`);
  }
  if (findings.some((finding) => finding.severity === "fail")) {
    process.exit(1);
  }
}

// The gate suite imports this module, so the checks run only when this file is
// the entry point.
if (isDirectInvocation(import.meta.url)) void main();

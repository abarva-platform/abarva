import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";

import { Client } from "pg";

import { SOURCE_LIFECYCLE_PATTERNS } from "@/lib/intelligence/source-lifecycle-patterns";
import { corpus } from "@/lib/intelligence/loader";
import { getPatternManifestPayload } from "@/lib/intelligence/pattern-manifest";
import { EXPERT_PACKS } from "@/lib/intelligence/expert-pack/registry";
import { validateExpertPackCollection } from "@/lib/intelligence/expert-pack/store";
import { extractPatterns } from "../../../scripts/corpus/load-authored-genome-seeds";
import { postgresClientOptions } from "@/scripts/postgres-client-options";

type GateSeverity = "fail" | "warn" | "pass";

export interface TruthGateFinding {
  severity: GateSeverity;
  gate: string;
  message: string;
}

export interface TruthGateSnapshot {
  enterpriseContextRecords?: Record<string, number>;
  embeddedNullVectorCount?: number;
  expertPackIds?: string[];
  patternManifestIds?: string[];
}

export interface TruthGateOptions {
  rootDir: string;
  snapshot?: TruthGateSnapshot | null;
  databaseUrl?: string | null;
  staticOnly?: boolean;
  requireLive?: boolean;
}

interface LiveDbSnapshot {
  enterpriseContextRecords: Record<string, number>;
  embeddedNullVectorCount: number;
  expertPackIds: string[];
}

interface DatasetTenant {
  tenantKey: string;
  datasetDir: string;
  manifestPath: string;
  fileCount: number;
}

const GENOME_SEED_DIR = "scripts/corpus/generated";
const LEGACY_COMPAT_PATTERN_IDS = ["pattern_analytics_modernization"];

const TENANT_ALIASES: Record<string, string> = {
  apex: "apex-retail",
  arcturus: "first-capital",
  firstcapital: "first-capital",
  lakeshore: "lakeshore",
  meridian: "meridian-health",
  northstar: "northstar-clinical",
  skyharbor: "skyharbor-air",
};

function normalizeTenantKey(value: string): string {
  const cleaned = value
    .trim()
    .replace(/^["']|["']$/g, "")
    .toLowerCase()
    .replace(/_/g, "-");
  return TENANT_ALIASES[cleaned] ?? cleaned;
}

function stripSyntheticSuffix(datasetDir: string): string {
  return datasetDir
    .replace(/-synthetic-v\d+$/i, "")
    .replace(/-synthetic$/i, "");
}

function readManifestTenantKey(manifestPath: string, datasetDir: string): string {
  const manifest = readFileSync(manifestPath, "utf8");
  const explicit = manifest.match(/^\s*(tenant_key|tenant|client_key)\s*:\s*(.+?)\s*$/m);
  if (explicit?.[2]) return normalizeTenantKey(explicit[2]);
  return normalizeTenantKey(stripSyntheticSuffix(datasetDir));
}

function countDataFiles(dir: string): number {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const filePath = join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countDataFiles(filePath);
      continue;
    }
    if (entry.isFile() && entry.name !== "manifest.yaml") count += 1;
  }
  return count;
}

export function discoverDatasetTenants(rootDir: string): DatasetTenant[] {
  const datasetsDir = join(rootDir, "datasets");
  return readdirSync(datasetsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const manifestPath = join(datasetsDir, entry.name, "manifest.yaml");
      if (!statExists(manifestPath)) return null;
      return {
        tenantKey: readManifestTenantKey(manifestPath, entry.name),
        datasetDir: entry.name,
        manifestPath: relative(rootDir, manifestPath),
        fileCount: countDataFiles(join(datasetsDir, entry.name)),
      };
    })
    .filter((tenant): tenant is DatasetTenant => Boolean(tenant))
    .filter((tenant) => tenant.fileCount > 0);
}

function statExists(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function listJsonlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const filePath = join(dir, entry.name);
      if (entry.isDirectory()) return listJsonlFiles(filePath);
      return entry.isFile() && entry.name.endsWith(".jsonl") ? [filePath] : [];
    })
    .sort((left, right) => left.localeCompare(right));
}

export function authoredPatternIds(rootDir: string): string[] {
  const ids = [
    ...corpus.patterns.map((pattern) => pattern.id),
    ...SOURCE_LIFECYCLE_PATTERNS.map((pattern) => pattern.id),
    ...LEGACY_COMPAT_PATTERN_IDS,
  ];
  for (const filePath of listJsonlFiles(join(rootDir, GENOME_SEED_DIR))) {
    for (const pattern of extractPatterns(filePath) as Array<{
      id?: unknown;
      code?: unknown;
    }>) {
      const id = typeof pattern.id === "string" ? pattern.id : pattern.code;
      if (typeof id === "string" && id.trim()) ids.push(id.trim());
    }
  }
  return Array.from(new Set(ids)).sort();
}

function currentPatternManifestIds(snapshot?: TruthGateSnapshot | null): string[] {
  if (snapshot?.patternManifestIds) return snapshot.patternManifestIds.slice().sort();
  return getPatternManifestPayload()
    .patterns.map((pattern) => pattern.id)
    .sort();
}

function currentExpertPackIds(snapshot?: TruthGateSnapshot | null): string[] {
  if (snapshot?.expertPackIds) return snapshot.expertPackIds.slice().sort();
  return EXPERT_PACKS.map((pack) => pack.identity.id).sort();
}

async function readLiveDbSnapshot(
  databaseUrl: string,
  tenantKeys: string[],
): Promise<LiveDbSnapshot> {
  const client = new Client(
    postgresClientOptions(databaseUrl, "scb-truth-gates"),
  );
  await client.connect();
  try {
    const recordResult = await client.query<{
      tenant_key: string;
      count: string;
    }>(
      `select tenant_key, count(*)::bigint as count
       from public.enterprise_context_records
       where tenant_key = any($1::text[])
       group by tenant_key`,
      [tenantKeys],
    );
    const enterpriseContextRecords = Object.fromEntries(
      recordResult.rows.map((row) => [row.tenant_key, Number(row.count)]),
    );

    const embeddedResult = await client.query<{ count: string }>(
      `select count(*)::bigint as count
       from public.enterprise_context_chunks
       where embedding_status = 'embedded'
         and embedding_vector is null`,
    );

    const expertResult = await client.query<{ pack_id: string }>(
      `select pack_id from public.expert_packs where gate_pass is true`,
    );

    return {
      enterpriseContextRecords,
      embeddedNullVectorCount: Number(embeddedResult.rows[0]?.count ?? 0),
      expertPackIds: expertResult.rows.map((row) => row.pack_id),
    };
  } finally {
    await client.end();
  }
}

function pushMissingFindings(
  findings: TruthGateFinding[],
  gate: string,
  noun: string,
  missing: string[],
): void {
  if (missing.length === 0) return;
  findings.push({
    severity: "fail",
    gate,
    message: `${missing.length} authored ${noun} absent from retrievable index: ${missing.slice(0, 12).join(", ")}${missing.length > 12 ? " ..." : ""}`,
  });
}

export async function runTruthGates(
  options: TruthGateOptions,
): Promise<TruthGateFinding[]> {
  const findings: TruthGateFinding[] = [];
  const datasetTenants = discoverDatasetTenants(options.rootDir);
  const tenantKeys = Array.from(
    new Set(datasetTenants.map((tenant) => tenant.tenantKey)),
  ).sort();

  const snapshot =
    options.snapshot ??
    (!options.staticOnly && options.databaseUrl
      ? await readLiveDbSnapshot(options.databaseUrl, tenantKeys)
      : null);

  if (!snapshot && options.requireLive) {
    findings.push({
      severity: "fail",
      gate: "live-db-required",
      message:
        "Missing DATABASE_URL/ABARVA_AZURE_DATABASE_URL for live data-plane truth gates.",
    });
  }

  if (snapshot?.enterpriseContextRecords) {
    for (const tenantKey of tenantKeys) {
      const recordCount = snapshot.enterpriseContextRecords[tenantKey] ?? 0;
      if (recordCount === 0) {
        const dirs = datasetTenants
          .filter((tenant) => tenant.tenantKey === tenantKey)
          .map((tenant) => tenant.datasetDir)
          .join(", ");
        findings.push({
          severity: "fail",
          gate: "datasets-have-records",
          message: `${tenantKey} has dataset files (${dirs}) but zero enterprise_context_records.`,
        });
      }
    }
  } else if (!options.staticOnly) {
    findings.push({
      severity: "warn",
      gate: "datasets-have-records",
      message:
        "Skipped live tenant record-count gate because no database URL or fixture snapshot was provided.",
    });
  }

  if (typeof snapshot?.embeddedNullVectorCount === "number") {
    if (snapshot.embeddedNullVectorCount > 0) {
      findings.push({
        severity: "fail",
        gate: "embedded-chunks-have-vectors",
        message: `${snapshot.embeddedNullVectorCount} chunk(s) are embedding_status='embedded' with embedding_vector IS NULL.`,
      });
    }
  } else if (!options.staticOnly) {
    findings.push({
      severity: "warn",
      gate: "embedded-chunks-have-vectors",
      message:
        "Skipped embedded-null-vector gate because no database URL or fixture snapshot was provided.",
    });
  }

  const authoredIds = authoredPatternIds(options.rootDir);
  const manifestIds = currentPatternManifestIds(options.snapshot);
  const manifestIdSet = new Set(manifestIds);
  pushMissingFindings(
    findings,
    "authored-patterns-retrievable",
    "pattern(s)",
    authoredIds.filter((id) => !manifestIdSet.has(id)),
  );
  if (manifestIds.length !== getPatternManifestPayload().patternCount) {
    findings.push({
      severity: "fail",
      gate: "pattern-manifest-count",
      message: `patternCount=${getPatternManifestPayload().patternCount} but manifest contains ${manifestIds.length} pattern row(s).`,
    });
  }

  const packValidation = validateExpertPackCollection(EXPERT_PACKS);
  if (packValidation.invalid.length > 0) {
    findings.push({
      severity: "fail",
      gate: "authored-expert-packs-valid",
      message: `${packValidation.invalid.length} authored ExpertPack(s) fail the depth/quality gate.`,
    });
  }
  const authoredPackIds = EXPERT_PACKS.map((pack) => pack.identity.id).sort();
  const retrievablePackIds = currentExpertPackIds(snapshot);
  const retrievablePackIdSet = new Set(retrievablePackIds);
  pushMissingFindings(
    findings,
    "authored-expert-packs-retrievable",
    "ExpertPack(s)",
    authoredPackIds.filter((id) => !retrievablePackIdSet.has(id)),
  );

  if (findings.every((finding) => finding.severity !== "fail")) {
    findings.push({
      severity: "pass",
      gate: "scb-truth-gates",
      message: `passed tenantKeys=${tenantKeys.length} authoredPatterns=${authoredIds.length} authoredExpertPacks=${authoredPackIds.length}`,
    });
  }

  return findings;
}

function parseArgs(argv: string[]) {
  let fixturePath: string | null = null;
  let staticOnly = false;
  let requireLive = false;
  let databaseUrl =
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL ??
    process.env.DATABASE_URL ??
    null;

  for (const arg of argv) {
    if (arg === "--static-only") staticOnly = true;
    else if (arg === "--require-live") requireLive = true;
    else if (arg.startsWith("--fixture=")) fixturePath = arg.slice("--fixture=".length);
    else if (arg.startsWith("--database-url="))
      databaseUrl = arg.slice("--database-url=".length);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  const snapshot = fixturePath
    ? (JSON.parse(readFileSync(fixturePath, "utf8")) as TruthGateSnapshot)
    : null;

  return { snapshot, staticOnly, requireLive, databaseUrl };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const findings = await runTruthGates({
    rootDir: process.cwd(),
    snapshot: options.snapshot,
    databaseUrl: options.databaseUrl,
    staticOnly: options.staticOnly,
    requireLive: options.requireLive,
  });

  for (const finding of findings) {
    const label = finding.severity.toUpperCase();
    const stream = finding.severity === "fail" ? console.error : console.log;
    stream(`[${label}] ${finding.gate}: ${finding.message}`);
  }

  if (findings.some((finding) => finding.severity === "fail")) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

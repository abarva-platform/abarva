// CLI: project the unified facts layer into cio_tower.mart_* for one tenant.
//
//   npx tsx src/scripts/tower/project-tower-mart.ts \
//     --tenant meridian-health \
//     --v3-dir datasets/tenant-inputs/active/meridian-health/current \
//     [--dry-run] [--actor <email>]
//
// Pipeline (facts -> mart is the single Tower projection path):
//   1. Read V3 CSVs (budget 08, programs 09, benefits SA08) -> V3 facts.
//   2. Read tower_* operational tables from Azure Postgres -> tower facts
//      (client_id UUID -> tenant_key resolved via clients).
//   3. Read cio_tower.tool_identity_aliases -> tool->program crosswalk.
//   4. Precedence-merge facts by canonical identity (tenant_file wins).
//   5. Assemble all 7 cio_tower.mart_* tables + gaps + evidence lineage.
//   6. --dry-run: print summary + write proof files, NO DB write.
//      --write: write facts + mart in ONE transaction, tracked by an
//      ai_control_refresh_runs row (job contract: run id, tenant scope,
//      idempotency key, row counts, status).
//
// The shell that runs this in production is the governed ACA data-build job
// (docs/ops/aca-data-build-job-rule.md); direct --write is gated on a live
// Azure DB the local dev shell cannot reach.

import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

import { postgresClientOptions } from "../postgres-client-options";
import {
  projectV3ToFacts,
  type CsvRow,
} from "../../lib/cio-tower/mart-projection/facts-from-v3";
import {
  projectTowerOperationalToFacts,
  type TowerOperationalInput,
} from "../../lib/cio-tower/mart-projection/facts-from-tower";
import {
  projectSourceContractDepthToFacts,
  type SourceContractDepthInput,
} from "../../lib/cio-tower/mart-projection/facts-from-source-contracts";
import { mergeFactsByCanonicalIdentity } from "../../lib/cio-tower/mart-projection/merge-facts";
import { assembleMartFromFacts } from "../../lib/cio-tower/mart-projection/assemble-mart";
import {
  buildToolProgramCrosswalk,
  type ToolIdentityAlias,
} from "../../lib/cio-tower/mart-projection/tool-identity-crosswalk";
import { canonicalCioTowerTenantKey } from "../../lib/cio-tower/metric-packet";
import type {
  CioTowerFactRow,
  CioTowerTenantIdentity,
} from "../../lib/cio-tower/mart-projection/facts-schema";

const MART_VERSION = "tower_command_mart_v1";
const FORMULA_VERSION = "unified_facts_v1";
const TENANT_INPUT_REGISTRY_PATH =
  "datasets/tenant-inputs/tenant-input-registry.json";

interface CliArgs {
  tenant: string;
  v3Dir: string | null;
  supplementalDir: string | null;
  dryRun: boolean;
  noDb: boolean;
  emitProofBundle: boolean;
  actor: string;
  outDir: string;
}

function parseArgs(argv: readonly string[]): CliArgs {
  const args = argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    if (i === -1) return undefined;
    const v = args[i + 1];
    return v && !v.startsWith("--") ? v : undefined;
  };
  const tenant = get("--tenant");
  const v3Dir = get("--v3-dir");
  if (!tenant) {
    console.error(
      "usage: project-tower-mart --tenant <key> [--v3-dir <active packet path>] [--dry-run] [--actor <email>] [--out-dir <path>]",
    );
    process.exit(2);
  }
  return {
    tenant,
    v3Dir: v3Dir ? path.resolve(process.cwd(), v3Dir) : null,
    supplementalDir: get("--supplemental-dir")
      ? path.resolve(process.cwd(), get("--supplemental-dir")!)
      : null,
    dryRun: args.includes("--dry-run") || !args.includes("--write"),
    // Local pure-pipeline run: skip the DB entirely (V3 CSVs only, no tower_*
    // telemetry, no alias crosswalk). Proves the projection without the VNet.
    noDb: args.includes("--no-db"),
    // Emit the out-dir as a base64 tar between the proof markers the governed
    // ACA operator wrapper (scripts/ops/submit-aca-operator-job.mjs) extracts
    // from job logs — so a live ACA run returns its proof/summary/mart JSON.
    emitProofBundle: args.includes("--emit-proof-bundle"),
    actor: get("--actor") ?? "tower-mart-cli",
    outDir:
      get("--out-dir") ??
      path.join(process.cwd(), "reports", `tower-mart-projection-${tenant}`),
  };
}

interface TenantInputRegistry {
  activeTenants?: Array<{
    tenantKey?: string;
    displayName?: string;
    canonicalInputRoot?: string;
  }>;
}

function readTenantInputRegistry(): TenantInputRegistry {
  const full = path.resolve(process.cwd(), TENANT_INPUT_REGISTRY_PATH);
  return JSON.parse(fs.readFileSync(full, "utf8")) as TenantInputRegistry;
}

function resolveActiveTenantInputRoot(tenantKey: string): string {
  const canonicalTenantKey = canonicalCioTowerTenantKey(tenantKey);
  const registry = readTenantInputRegistry();
  const activeTenant = registry.activeTenants?.find(
    (tenant) =>
      canonicalCioTowerTenantKey(tenant.tenantKey ?? "") ===
      canonicalTenantKey,
  );
  const root = activeTenant?.canonicalInputRoot;
  if (!root) {
    throw new Error(
      `No active input packet found for tenant "${tenantKey}" in ${TENANT_INPUT_REGISTRY_PATH}.`,
    );
  }
  const absoluteRoot = path.resolve(process.cwd(), root);
  if (!fs.existsSync(absoluteRoot)) {
    throw new Error(
      `Active input packet for tenant "${tenantKey}" does not exist: ${root}`,
    );
  }
  return absoluteRoot;
}

function sourceStandardForDir(dir: string): string {
  const relative = path.relative(process.cwd(), dir).replaceAll(path.sep, "/");
  if (relative.startsWith("datasets/tenant-inputs/active/")) {
    return "active-current";
  }
  return path.basename(dir);
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let val = "";
  let q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const n = text[i + 1];
    if (q) {
      if (c === '"' && n === '"') {
        val += '"';
        i += 1;
      } else if (c === '"') q = false;
      else val += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(val);
      val = "";
    } else if (c === "\n") {
      row.push(val);
      rows.push(row);
      row = [];
      val = "";
    } else if (c !== "\r") val += c;
  }
  if (val.length || row.length) {
    row.push(val);
    rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

function readV3Csv(dir: string, file: string): CsvRow[] {
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) return [];
  return parseCsv(fs.readFileSync(full, "utf8"));
}

function readV3Csvs(dirs: readonly string[], file: string): CsvRow[] {
  return dirs.flatMap((dir) => readV3Csv(dir, file));
}

function existingV3Files(
  dirs: readonly string[],
  files: readonly string[],
): string[] {
  const found: string[] = [];
  for (const dir of dirs) {
    for (const file of files) {
      if (fs.existsSync(path.join(dir, file))) found.push(file);
    }
  }
  return [...new Set(found)];
}

async function resolveTenant(
  client: Client | null,
  tenantKey: string,
  tenantNameFallback: string,
): Promise<CioTowerTenantIdentity> {
  const canonicalTenantKey = canonicalCioTowerTenantKey(tenantKey);
  if (!client) {
    return {
      tenantKey: canonicalTenantKey,
      clientId: null,
      tenantName: tenantNameFallback,
    };
  }
  const aliases = tenantLookupAliases(canonicalTenantKey, tenantKey);
  const res = await client.query<{ id: string; name: string }>(
    `SELECT id, name
       FROM public.clients
      WHERE tenant_key = ANY($1::text[])
         OR slug = ANY($1::text[])
         OR lower(name) = ANY($3::text[])
      ORDER BY CASE
        WHEN tenant_key = $2 THEN 0
        WHEN slug = $2 THEN 1
        ELSE 2
      END
      LIMIT 1`,
    [aliases, canonicalTenantKey, tenantNameLookupAliases(canonicalTenantKey, tenantNameFallback)],
  );
  const row = res.rows[0];
  return {
    tenantKey: canonicalTenantKey,
    clientId: row?.id ?? null,
    tenantName: row?.name ?? tenantNameFallback,
  };
}

function tenantLookupAliases(
  canonicalTenantKey: string,
  requestedTenantKey: string,
): string[] {
  const aliases = new Set([canonicalTenantKey, requestedTenantKey]);
  const normalized = canonicalTenantKey.trim().toLowerCase();
  if (normalized === "meridian-health") aliases.add("meridian");
  if (normalized === "skyharbor-air") aliases.add("skyharbor");
  if (normalized === "first-capital-financial") {
    aliases.add("first-capital");
    aliases.add("firstcapital");
    aliases.add("arcturus");
  }
  if (normalized === "apex-retail") {
    aliases.add("apex");
    aliases.add("apexretail");
  }
  if (normalized === "lakeshore-holdings") {
    aliases.add("lakeshore");
    aliases.add("lakeshoreholdings");
  }
  if (normalized === "lakeshore-industries") {
    aliases.add("lakeshoreindustries");
  }
  return [...aliases].filter(Boolean);
}

function tenantNameLookupAliases(canonicalTenantKey: string, tenantNameFallback: string): string[] {
  const aliases = new Set([tenantNameFallback.trim().toLowerCase()]);
  const normalized = canonicalTenantKey.trim().toLowerCase();
  if (normalized === "meridian-health") {
    aliases.add("meridian");
    aliases.add("meridian health");
    aliases.add("healthcare demo");
  }
  if (normalized === "skyharbor-air") aliases.add("skyharbor air");
  if (normalized === "first-capital-financial") {
    aliases.add("first capital");
    aliases.add("first capital financial");
    aliases.add("fs demo");
  }
  return [...aliases].filter(Boolean);
}

async function readTowerFacts(
  client: Client | null,
  identity: CioTowerTenantIdentity,
): Promise<CioTowerFactRow[]> {
  if (!client || !identity.clientId) return [];
  const cid = identity.clientId;
  const input: TowerOperationalInput = {};
  // Each read is best-effort; a missing table or zero rows just contributes
  // nothing (the assembler records the absence as a gap, not a crash).
  const q = async <T extends Record<string, unknown>>(
    sql: string,
  ): Promise<T[]> => {
    try {
      const r = await client.query<T>(sql, [cid]);
      return r.rows;
    } catch {
      return [];
    }
  };
  // Raw SQL rows: column names match the source-row interfaces, so a cast
  // through unknown is the honest mapping (pg returns strings/numbers).
  input.aiToolUsage = (await q(
    `SELECT client_id, tool::text AS tool, team, to_char(period_start,'YYYY-MM-DD') period_start, to_char(period_end,'YYYY-MM-DD') period_end,
            active_users, total_suggestions, accepted_suggestions, acceptance_rate_pct, monthly_cost_usd, seats_assigned, seats_used, source_file_id
       FROM public.tower_ai_tool_usage WHERE client_id = $1`,
  )) as unknown as TowerOperationalInput["aiToolUsage"];
  input.cloudCost = (await q(
    `SELECT client_id, subscription_id, resource_group, resource_name, service, meter_category, tag_program, tag_environment,
            to_char(period_start,'YYYY-MM-DD') period_start, to_char(period_end,'YYYY-MM-DD') period_end, monthly_cost_usd, source_file_id::text
       FROM public.tower_cloud_cost WHERE client_id = $1`,
  )) as unknown as TowerOperationalInput["cloudCost"];
  input.doraMetrics = (await q(
    `SELECT client_id, repo, team, to_char(period_start,'YYYY-MM-DD') period_start, to_char(period_end,'YYYY-MM-DD') period_end,
            deployment_frequency_per_day, lead_time_for_changes_hours, change_failure_rate_pct, mttr_hours, sample_size_deploys, source_file_id
       FROM public.tower_dora_metrics WHERE client_id = $1 AND deleted_at IS NULL`,
  )) as unknown as TowerOperationalInput["doraMetrics"];
  input.jiraIssues = (await q(
    `SELECT client_id, issue_key, issue_type::text, team, status::text, story_points, cycle_time_hours, to_char(completed_at,'YYYY-MM-DD') completed_at, source_file
       FROM public.tower_jira_issues WHERE client_id = $1`,
  )) as unknown as TowerOperationalInput["jiraIssues"];
  // ITSM keys on tenant_key, not client_id.
  try {
    const r = await client.query(
      `SELECT tenant_key, record_number, record_type::text, priority::text, service, to_char(opened_at,'YYYY-MM-DD') opened_at, to_char(closed_at,'YYYY-MM-DD') closed_at, mttr_minutes, change_success, source_file_id
         FROM public.tower_itsm_records WHERE tenant_key = $1`,
      [identity.tenantKey],
    );
    input.itsmRecords = r.rows as TowerOperationalInput["itsmRecords"];
  } catch {
    input.itsmRecords = [];
  }
  return projectTowerOperationalToFacts(input, identity);
}

export async function readSourceContractDepthFacts(
  client: Client | null,
  identity: CioTowerTenantIdentity,
): Promise<CioTowerFactRow[]> {
  if (!client) return [];
  const input: SourceContractDepthInput = {};
  await client.query("SELECT set_config('app.tenant_key', $1, false)", [
    identity.tenantKey,
  ]);
  const q = async <T extends Record<string, unknown>>(
    sql: string,
  ): Promise<T[]> => {
    try {
      const r = await client.query<T>(sql, [identity.tenantKey]);
      return r.rows;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`source_contract_depth_read_failed: ${message}`);
    }
  };

  try {
    input.contracts = (await q(
      `SELECT contract_id, contract_name, vendor_name, annual_contract_value,
              actual_annual_spend, authority_state, quality_state, knowledge_baseline_ref
         FROM source.contract_360
        WHERE tenant_key = $1
        ORDER BY annual_contract_value DESC NULLS LAST, contract_id`,
    )) as unknown as SourceContractDepthInput["contracts"];

    input.opportunities = (await q(
      `SELECT opportunity_id, contract_id, NULL::text AS vendor_name, title, annual_value_exposed,
              readiness_state, evidence_state, recommended_action, accountable_role,
              knowledge_baseline_ref
         FROM consumption.sourcing_opportunity_v1
        WHERE tenant_key = $1
          AND COALESCE(annual_value_exposed, 0) > 0
        ORDER BY annual_value_exposed DESC NULLS LAST, opportunity_id`,
    )) as unknown as SourceContractDepthInput["opportunities"];

    input.performance = (await q(
      `SELECT contract_id,
              COALESCE(sum(breach_count), 0) AS breached_periods,
              COALESCE(sum(credit_calculated), 0) AS credit_calculated,
              COALESCE(sum(credit_claimed), 0) AS credit_claimed,
              COALESCE(sum(credit_recovered), 0) AS credit_recovered,
              count(*) FILTER (WHERE evidence_state = 'present') AS evidence_rows,
              min(knowledge_baseline_ref) AS knowledge_baseline_ref
         FROM consumption.sourcing_performance_v1
        WHERE tenant_key = $1
        GROUP BY contract_id
        ORDER BY contract_id`,
    )) as unknown as SourceContractDepthInput["performance"];

    return projectSourceContractDepthToFacts(input, identity);
  } finally {
    await client.query("SELECT set_config('app.tenant_key', '', false)");
  }
}

async function readAliases(
  client: Client | null,
  tenantKey: string,
): Promise<ToolIdentityAlias[]> {
  if (!client) return [];
  try {
    const r = await client.query<ToolIdentityAlias>(
      `SELECT tenant_key, canonical_tool_key, alias, vendor_name, system_name, program_code, canonical_program_key, active
         FROM cio_tower.tool_identity_aliases WHERE tenant_key = $1 AND active = true`,
      [tenantKey],
    );
    return r.rows;
  } catch {
    return [];
  }
}

function idempotencyKey(tenantKey: string, facts: CioTowerFactRow[]): string {
  const h = crypto.createHash("sha256");
  h.update(tenantKey);
  for (const f of facts) h.update(`${f.fact_key}:${f.value_numeric ?? ""}`);
  return h.digest("hex").slice(0, 32);
}

async function loadEnvFiles(): Promise<void> {
  loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
  loadEnv();
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  await loadEnvFiles();
  const activeV3Dir = args.v3Dir ?? resolveActiveTenantInputRoot(args.tenant);

  const connectionString = args.noDb
    ? null
    : process.env.ABARVA_AZURE_DATABASE_URL?.trim() ||
      process.env.TARGET_DATABASE_URL?.trim() ||
      process.env.DATABASE_URL?.trim() ||
      null;

  const wantWrite = !args.dryRun;
  if (wantWrite && !connectionString) {
    console.error(
      "--write requires a database URL; use the governed ACA job path.",
    );
    process.exit(1);
  }

  let client: Client | null = null;
  if (connectionString) {
    client = new Client(
      postgresClientOptions(connectionString, "tower-mart-projection"),
    );
    await client.connect();
  }

  try {
    const identity = await resolveTenant(client, args.tenant, args.tenant);
    const csvDirs = [activeV3Dir, args.supplementalDir].filter(
      Boolean,
    ) as string[];
    const primaryCsvDirs = [activeV3Dir];

    // 1. V3 facts (local CSVs)
    const v3Facts = projectV3ToFacts(
      {
        budget: [
          ...readV3Csvs(csvDirs, "08_it_budget_spend_value.csv"),
          ...readV3Csvs(csvDirs, "08_spend_value.csv"),
        ],
        programs: readV3Csvs(primaryCsvDirs, "09_programs_initiatives.csv"),
        aiUseCases: readV3Csvs(primaryCsvDirs, "10_ai_automation_use_cases.csv"),
        benefits: readV3Csvs(
          primaryCsvDirs,
          "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
        ),
      },
      identity,
    );
    // 2. tower_* operational facts (DB)
    const towerFacts = await readTowerFacts(client, identity);
    // 3. Source contract-depth facts (DB)
    const sourceContractFacts = await readSourceContractDepthFacts(
      client,
      identity,
    );
    // 4. crosswalk (DB)
    const aliases = await readAliases(client, args.tenant);
    const { crosswalk, conflicts } = buildToolProgramCrosswalk(
      aliases,
      args.tenant,
    );

    // 5. merge
    const merged = mergeFactsByCanonicalIdentity([
      ...v3Facts,
      ...towerFacts,
      ...sourceContractFacts,
    ]);
    // 6. assemble
    const mart = assembleMartFromFacts(merged.facts, {
      tenantKey: identity.tenantKey,
      tenantName: identity.tenantName,
      martVersion: MART_VERSION,
      formulaVersion: FORMULA_VERSION,
      sourceStandard: sourceStandardForDir(activeV3Dir),
      crosswalk,
      sourceFiles: [
        ...existingV3Files(csvDirs, [
          "08_it_budget_spend_value.csv",
          "08_spend_value.csv",
        ]),
        ...existingV3Files(primaryCsvDirs, [
          "09_programs_initiatives.csv",
          "10_ai_automation_use_cases.csv",
          "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
        ]),
      ],
    });

    const idemKey = idempotencyKey(identity.tenantKey, merged.facts);
    const summary = {
      tenant_key: identity.tenantKey,
      client_id: identity.clientId,
      idempotency_key: idemKey,
      v3_facts: v3Facts.length,
      tower_facts: towerFacts.length,
      source_contract_facts: sourceContractFacts.length,
      merged_facts: merged.facts.length,
      suppressed_facts: merged.suppressed.length,
      crosswalk_size: crosswalk.size,
      crosswalk_conflicts: conflicts,
      mart_counts: {
        command_center: mart.command_center.length,
        value_funnel: mart.value_funnel.length,
        program_decision_lanes: mart.program_decision_lanes.length,
        ai_portfolio: mart.ai_portfolio.length,
        cxo_actions: mart.cxo_actions.length,
        evidence_lineage: mart.evidence_lineage.length,
        required_field_gaps: mart.required_field_gaps.length,
      },
      command_center: mart.command_center[0] ?? null,
      decision_lanes: mart.program_decision_lanes.map((l) => ({
        program: l.program_name,
        lane: l.decision_lane,
        funded: l.approved_funding_usd,
        promised: l.promised_value_usd,
        validated: l.finance_validated_value_usd,
        usage: `${l.usage_metric ?? "-"}=${l.usage_actual ?? "-"}`,
        status: l.value_claim_status,
      })),
      gaps: mart.required_field_gaps.map((g) => ({
        field: g.required_field,
        severity: g.severity,
        remediation: g.remediation_action,
      })),
    };

    fs.mkdirSync(args.outDir, { recursive: true });
    fs.writeFileSync(
      path.join(args.outDir, "projection-summary.json"),
      JSON.stringify(summary, null, 2),
    );
    fs.writeFileSync(
      path.join(args.outDir, "mart.json"),
      JSON.stringify(mart, null, 2),
    );
    console.log(JSON.stringify(summary, null, 2));

    if (conflicts.length > 0) {
      console.warn(
        `\nCROSSWALK CONFLICTS (${conflicts.length}) — resolve in tool_identity_aliases:`,
      );
      for (const c of conflicts) console.warn(`  - ${c}`);
    }

    if (args.dryRun || !client) {
      console.log(`\nDRY RUN — no DB write. Proof written to ${args.outDir}`);
      if (args.emitProofBundle) emitProofBundle(args.outDir);
      return;
    }

    // Fail closed: a live write MUST resolve to a real client_id. Otherwise the
    // run cannot be tenant-attributed or tracked in ai_control_refresh_runs, and
    // an untracked mutating data build is exactly what the ACA job rule forbids.
    if (!identity.clientId) {
      console.error(
        `--write aborted: tenant "${args.tenant}" did not resolve to a clients.id. ` +
          `Seed the tenant (clients.tenant_key) before running the governed write job.`,
      );
      process.exit(1);
    }

    await writeMart(client, identity, mart, merged.facts, {
      idempotencyKey: idemKey,
      actor: args.actor,
    });
    console.log("\nWrite complete: facts + mart committed with run tracking.");
    if (args.emitProofBundle) emitProofBundle(args.outDir);
  } finally {
    if (client) await client.end();
  }
}

/**
 * Tar the out-dir and print it, base64-encoded, between the proof markers the
 * governed ACA operator wrapper extracts from job logs. Mirrors the pattern in
 * scripts/tower/project-meridian-v3-to-cio-tower.mjs so a live ACA run returns
 * its projection-summary.json + mart.json without any DB access from the
 * caller.
 */
function emitProofBundle(outDir: string): void {
  const tarPath = path.join(
    path.dirname(outDir),
    `${path.basename(outDir)}.tgz`,
  );
  const result = spawnSync(
    "tar",
    ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.status !== 0) {
    throw new Error(
      `Failed to create proof bundle: ${result.stderr || result.stdout}`,
    );
  }
  const payload = fs.readFileSync(tarPath).toString("base64");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(payload);
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

// Placeholder invoked only on --write (live DB path). Kept in a separate
// function so the dry-run path never references write internals.
async function writeMart(
  client: Client,
  identity: CioTowerTenantIdentity,
  mart: ReturnType<typeof assembleMartFromFacts>,
  facts: CioTowerFactRow[],
  meta: { idempotencyKey: string; actor: string },
): Promise<void> {
  const { runInTransactionWithTracking } =
    await import("./project-tower-mart-write");
  await runInTransactionWithTracking(client, identity, mart, facts, meta);
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  main().catch((err) => {
    console.error(err instanceof Error ? (err.stack ?? err.message) : err);
    process.exit(1);
  });
}

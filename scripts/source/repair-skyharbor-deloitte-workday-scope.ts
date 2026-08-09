import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Client } from "pg";

import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

type Row = Record<string, unknown>;

const DEFAULT_TENANT_KEY = "skyharbor_global";
const RAW_SCHEMA = "raw_enterprise_it";
const RAW_TABLE = "vendors_contracts";
const REPAIR_ID = "skyharbor-deloitte-workday-scope-20260809";
const CORRECTED_SCOPE_SUMMARY =
  "Direct Booking Web Platform managed-services support only; HCM managed-services support is represented by internal workforce roles.";

interface Args {
  apply: boolean;
  emitProofBundle: boolean;
  outDir: string;
  tenantKey: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const value = (flag: string): string | undefined => {
    const index = args.indexOf(flag);
    if (index >= 0) return args[index + 1];
    const prefixed = args.find((arg) => arg.startsWith(`${flag}=`));
    return prefixed?.slice(flag.length + 1);
  };
  return {
    apply:
      args.includes("--apply") ||
      process.env.SOURCE_SKYHARBOR_DELOITTE_REPAIR_APPLY === "true",
    emitProofBundle:
      args.includes("--emit-proof-bundle") ||
      process.env.SOURCE_SKYHARBOR_DELOITTE_REPAIR_EMIT_PROOF_BUNDLE === "true",
    outDir:
      value("--out-dir") ??
      process.env.SOURCE_SKYHARBOR_DELOITTE_REPAIR_OUT_DIR ??
      path.join(os.tmpdir(), REPAIR_ID),
    tenantKey:
      value("--tenant-key") ??
      process.env.SKYHARBOR_TENANT_KEY ??
      process.env.TENANT_KEY ??
      DEFAULT_TENANT_KEY,
  };
}

function databaseUrl(): string {
  const url =
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return url;
}

function quoteIdent(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeRows(rows: Row[]): Row[] {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        value == null ? null : String(value),
      ]),
    ),
  );
}

async function readColumns(client: Client): Promise<Set<string>> {
  const result = await client.query<{ column_name: string }>(
    `
      select column_name
        from information_schema.columns
       where table_schema = $1
         and table_name = $2
    `,
    [RAW_SCHEMA, RAW_TABLE],
  );
  return new Set(result.rows.map((row) => row.column_name));
}

async function relationExists(
  client: Client,
  schemaName: string,
  tableName: string,
): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `
      select to_regclass($1) is not null as exists
    `,
    [`${schemaName}.${tableName}`],
  );
  return result.rows[0]?.exists === true;
}

async function readSourceVendorIds(
  client: Client,
  tenantKey: string,
): Promise<string[]> {
  if (!(await relationExists(client, "source", "vendor"))) return [];
  const result = await client.query<{ vendor_id: string }>(
    `
      select distinct vendor_id
        from source.vendor
       where tenant_key = $1
         and (
           vendor_id ilike '%Deloitte%'
           or legal_name ilike '%Deloitte%'
           or raw_payload::text ilike '%Deloitte%'
         )
       order by vendor_id
    `,
    [tenantKey],
  );
  return result.rows.map((row) => row.vendor_id).filter(Boolean);
}

async function readDeloitteContractIds(
  client: Client,
  tenantKey: string,
  vendorIds: string[],
): Promise<string[]> {
  if (!(await relationExists(client, "source", "contract"))) return [];
  const result = await client.query<{ contract_id: string }>(
    `
      select distinct c.contract_id
        from source.contract c
        left join source.vendor v
          on v.tenant_key = c.tenant_key
         and v.vendor_id = c.vendor_id
       where c.tenant_key = $1
         and (
           c.vendor_id = any($2::text[])
           or v.legal_name ilike '%Deloitte%'
           or c.raw_payload::text ilike '%Deloitte%'
         )
       order by c.contract_id
    `,
    [tenantKey, vendorIds],
  );
  return result.rows.map((row) => row.contract_id).filter(Boolean);
}

function candidateColumns(columns: Set<string>): string[] {
  return [
    "contract_name",
    "scope_summary",
    "supported_applications",
    "supported_systems",
    "supported_functions",
  ].filter((column) => columns.has(column));
}

function whereClause(columns: string[]): string {
  const workdayChecks = columns
    .map((column) => `${quoteIdent(column)} ilike '%Workday%'`)
    .join(" or ");
  const functionCheck = columns.includes("supported_functions")
    ? ` or ${quoteIdent("supported_functions")} ilike '%Human Resources%'`
    : "";
  return `
    _tenant_key = $1
    and vendor_name ilike '%Deloitte%'
    and (${workdayChecks || "false"}${functionCheck})
  `;
}

async function readRawRows(client: Client, tenantKey: string, columns: Set<string>) {
  const selected = [
    "_tenant_key",
    "contract_id",
    "vendor_id",
    "vendor_name",
    ...candidateColumns(columns),
  ].filter((column) => columns.has(column));
  const result = await client.query(
    `
      select ${selected.map(quoteIdent).join(", ")}
        from ${quoteIdent(RAW_SCHEMA)}.${quoteIdent(RAW_TABLE)}
       where ${whereClause(candidateColumns(columns))}
       order by contract_id nulls last, vendor_id nulls last
    `,
    [tenantKey],
  );
  return normalizeRows(result.rows);
}

async function readSourceRows(client: Client, tenantKey: string): Promise<Row[]> {
  try {
    const result = await client.query(
      `
        select tenant_key, contract_id, vendor_ref, vendor_name, contract_name,
               scope_summary, annual_value
          from source.contract_360
         where tenant_key = $1
           and vendor_name ilike '%Deloitte%'
         order by annual_value desc nulls last
         limit 20
      `,
      [tenantKey],
    );
    return normalizeRows(result.rows);
  } catch (error) {
    return [{ error: error instanceof Error ? error.message : String(error) }];
  }
}

async function readGovernedRows(
  client: Client,
  tenantKey: string,
  vendorIds: string[],
  contractIds: string[],
): Promise<Record<string, Row[]>> {
  const empty: Record<string, Row[]> = {
    sourceVendor: [],
    sourceContract: [],
    sourceContractScope: [],
    sourceVendorApplicationRelationship: [],
    sourceVendorPlatformRelationship: [],
    sourceContract360: [],
    sourceContractApplicationScope: [],
  };
  const maybe = async (
    key: keyof typeof empty,
    relation: string,
    sql: string,
    params: unknown[],
  ) => {
    const [schemaName, tableName] = relation.split(".");
    if (!(await relationExists(client, schemaName, tableName))) return;
    try {
      const result = await client.query(sql, params);
      empty[key] = normalizeRows(result.rows);
    } catch (error) {
      empty[key] = [
        { error: error instanceof Error ? error.message : String(error) },
      ];
    }
  };

  await maybe(
    "sourceVendor",
    "source.vendor",
    `
      select vendor_id, legal_name, raw_payload
        from source.vendor
       where tenant_key = $1
         and vendor_id = any($2::text[])
       order by vendor_id
    `,
    [tenantKey, vendorIds],
  );
  await maybe(
    "sourceContract",
    "source.contract",
    `
      select c.contract_id, c.vendor_id, v.legal_name, c.contract_name,
             c.agreement_type, c.source_record_id, c.raw_payload
        from source.contract c
        left join source.vendor v
          on v.tenant_key = c.tenant_key
         and v.vendor_id = c.vendor_id
       where c.tenant_key = $1
         and (
           c.contract_id = any($2::text[])
           or c.vendor_id = any($3::text[])
           or c.raw_payload::text ilike '%Deloitte%'
         )
         and (
           c.contract_name ilike '%Workday%'
           or c.contract_name ilike '%HCM%'
           or c.raw_payload::text ilike '%Workday%'
           or c.raw_payload::text ilike '%HCM%'
         )
       order by c.contract_id
    `,
    [tenantKey, contractIds, vendorIds],
  );
  await maybe(
    "sourceContractScope",
    "source.contract_scope",
    `
      select contract_scope_id, contract_id, scope_type, scope_ref, scope_name,
             relationship_method, quality_state, raw_payload
        from source.contract_scope
       where tenant_key = $1
         and contract_id = any($2::text[])
         and quality_state is distinct from 'superseded'
         and (
           scope_name ilike '%Workday%'
           or scope_name ilike '%HCM%'
           or raw_payload::text ilike '%Workday%'
           or raw_payload::text ilike '%HCM%'
         )
       order by contract_id, scope_name
    `,
    [tenantKey, contractIds],
  );
  await maybe(
    "sourceVendorApplicationRelationship",
    "source.vendor_application_relationship",
    `
      select relationship_id, vendor_id, application_ref, application_name,
             relationship_method, quality_state, raw_payload
        from source.vendor_application_relationship
       where tenant_key = $1
         and vendor_id = any($2::text[])
         and quality_state is distinct from 'superseded'
         and (
           application_name ilike '%Workday%'
           or application_name ilike '%HCM%'
           or raw_payload::text ilike '%Workday%'
           or raw_payload::text ilike '%HCM%'
         )
       order by vendor_id, application_name
    `,
    [tenantKey, vendorIds],
  );
  await maybe(
    "sourceVendorPlatformRelationship",
    "source.vendor_platform_relationship",
    `
      select relationship_id, vendor_id, platform_ref, platform_name,
             relationship_method, quality_state, raw_payload
        from source.vendor_platform_relationship
       where tenant_key = $1
         and vendor_id = any($2::text[])
         and quality_state is distinct from 'superseded'
         and (
           platform_name ilike '%Workday%'
           or platform_name ilike '%HCM%'
           or raw_payload::text ilike '%Workday%'
           or raw_payload::text ilike '%HCM%'
         )
       order by vendor_id, platform_name
    `,
    [tenantKey, vendorIds],
  );
  await maybe(
    "sourceContract360",
    "source.contract_360",
    `
      select tenant_key, contract_id, vendor_ref, vendor_name, contract_name,
             scope_summary, annual_value
        from source.contract_360
       where tenant_key = $1
         and (
           vendor_name ilike '%Deloitte%'
           or contract_id = any($2::text[])
         )
       order by contract_id
       limit 50
    `,
    [tenantKey, contractIds],
  );
  await maybe(
    "sourceContractApplicationScope",
    "source.contract_application_scope",
    `
      select tenant_key, contract_id, vendor_ref, vendor_name, application_ref,
             application_name, business_function, criticality
        from source.contract_application_scope
       where tenant_key = $1
         and (
           vendor_name ilike '%Deloitte%'
           or contract_id = any($2::text[])
         )
         and (
           application_name ilike '%Workday%'
           or application_name ilike '%HCM%'
           or business_function ilike '%Human Resources%'
         )
       order by contract_id, application_name
       limit 50
    `,
    [tenantKey, contractIds],
  );

  return empty;
}

function updateAssignments(columns: Set<string>): string[] {
  const assignments: string[] = [];
  if (columns.has("contract_name")) {
    assignments.push(
      `${quoteIdent("contract_name")} = regexp_replace(${quoteIdent(
        "contract_name",
      )}, '\\s*&\\s*Workday Managed Services', '', 'gi')`,
    );
  }
  if (columns.has("scope_summary")) {
    assignments.push(
      `${quoteIdent(
        "scope_summary",
      )} = '${CORRECTED_SCOPE_SUMMARY.replace(/'/g, "''")}'`,
    );
  }
  if (columns.has("supported_applications")) {
    assignments.push(
      `${quoteIdent("supported_applications")} = 'Direct Booking Web Platform'`,
    );
  }
  if (columns.has("supported_systems")) {
    assignments.push(
      `${quoteIdent("supported_systems")} = 'Direct Booking Web Platform'`,
    );
  }
  if (columns.has("supported_functions")) {
    assignments.push(
      `${quoteIdent("supported_functions")} = 'Distribution, Sales & E-Commerce'`,
    );
  }
  return assignments;
}

async function applyRepair(
  client: Client,
  tenantKey: string,
  columns: Set<string>,
): Promise<Row[]> {
  const assignments = updateAssignments(columns);
  if (assignments.length === 0) {
    throw new Error("No supported raw columns found for Deloitte scope repair.");
  }
  const result = await client.query(
    `
      update ${quoteIdent(RAW_SCHEMA)}.${quoteIdent(RAW_TABLE)}
         set ${assignments.join(", ")}
       where ${whereClause(candidateColumns(columns))}
       returning _tenant_key, contract_id, vendor_id, vendor_name,
                 ${candidateColumns(columns).map(quoteIdent).join(", ")}
    `,
    [tenantKey],
  );
  return normalizeRows(result.rows);
}

async function applyGovernedRepair(
  client: Client,
  tenantKey: string,
  vendorIds: string[],
  contractIds: string[],
): Promise<Record<string, Row[]>> {
  const changed: Record<string, Row[]> = {
    sourceContract: [],
    sourceContractScopeArchived: [],
    sourceVendorApplicationRelationshipArchived: [],
    sourceVendorPlatformRelationshipArchived: [],
  };

  if (await relationExists(client, "source", "contract")) {
    const contractResult = await client.query(
      `
        update source.contract c
           set contract_name = regexp_replace(
                 regexp_replace(c.contract_name, '\\s*&\\s*Workday Managed Services', '', 'gi'),
                 '\\s*Workday HCM Managed Services\\s*', '',
                 'gi'
               ),
               raw_payload = jsonb_build_object(
                 'scope_summary', $4::text,
                 'supported_systems', 'Direct Booking Web Platform',
                 'supported_functions', 'Distribution, Sales & E-Commerce',
                 'scope_correction_id', $5::text,
                 'previous_payload_md5', md5(coalesce(c.raw_payload::text, ''))
               ),
               quality_state = case
                 when c.quality_state in ('accepted', 'reviewed') then c.quality_state
                 else 'reviewed'
               end
         where c.tenant_key = $1
           and (
             c.contract_id = any($2::text[])
             or c.vendor_id = any($3::text[])
             or c.raw_payload::text ilike '%Deloitte%'
           )
           and (
             c.contract_name ilike '%Workday%'
             or c.contract_name ilike '%HCM%'
             or c.raw_payload::text ilike '%Workday%'
             or c.raw_payload::text ilike '%HCM%'
           )
         returning c.contract_id, c.vendor_id, c.contract_name, c.quality_state
      `,
      [tenantKey, contractIds, vendorIds, CORRECTED_SCOPE_SUMMARY, REPAIR_ID],
    );
    changed.sourceContract = normalizeRows(contractResult.rows);
  }

  if (await relationExists(client, "source", "contract_scope")) {
    const scopeResult = await client.query(
      `
        update source.contract_scope
           set quality_state = 'superseded',
               relationship_method = 'superseded_scope_correction',
               raw_payload = coalesce(raw_payload, '{}'::jsonb)
                 || jsonb_build_object(
                   'superseded_by', $3::text,
                   'superseded_reason', 'Deloitte scope corrected to Direct Booking Web Platform only'
                 )
         where tenant_key = $1
           and contract_id = any($2::text[])
           and (
             scope_name ilike '%Workday%'
             or scope_name ilike '%HCM%'
             or raw_payload::text ilike '%Workday%'
             or raw_payload::text ilike '%HCM%'
           )
         returning contract_scope_id, contract_id, scope_type, scope_ref,
                   scope_name, relationship_method, quality_state
      `,
      [tenantKey, contractIds, REPAIR_ID],
    );
    changed.sourceContractScopeArchived = normalizeRows(scopeResult.rows);
  }

  if (await relationExists(client, "source", "vendor_application_relationship")) {
    const appResult = await client.query(
      `
        update source.vendor_application_relationship
           set quality_state = 'superseded',
               relationship_method = 'superseded_scope_correction',
               raw_payload = coalesce(raw_payload, '{}'::jsonb)
                 || jsonb_build_object(
                   'superseded_by', $3::text,
                   'superseded_reason', 'Deloitte application scope corrected to Direct Booking Web Platform only'
                 )
         where tenant_key = $1
           and vendor_id = any($2::text[])
           and (
             application_name ilike '%Workday%'
             or application_name ilike '%HCM%'
             or raw_payload::text ilike '%Workday%'
             or raw_payload::text ilike '%HCM%'
           )
         returning relationship_id, vendor_id, application_ref, application_name,
                   relationship_method, quality_state
      `,
      [tenantKey, vendorIds, REPAIR_ID],
    );
    changed.sourceVendorApplicationRelationshipArchived = normalizeRows(
      appResult.rows,
    );
  }

  if (await relationExists(client, "source", "vendor_platform_relationship")) {
    const platformResult = await client.query(
      `
        update source.vendor_platform_relationship
           set quality_state = 'superseded',
               relationship_method = 'superseded_scope_correction',
               raw_payload = coalesce(raw_payload, '{}'::jsonb)
                 || jsonb_build_object(
                   'superseded_by', $3::text,
                   'superseded_reason', 'Deloitte platform scope corrected to Direct Booking Web Platform only'
                 )
         where tenant_key = $1
           and vendor_id = any($2::text[])
           and (
             platform_name ilike '%Workday%'
             or platform_name ilike '%HCM%'
             or raw_payload::text ilike '%Workday%'
             or raw_payload::text ilike '%HCM%'
           )
         returning relationship_id, vendor_id, platform_ref, platform_name,
                   relationship_method, quality_state
      `,
      [tenantKey, vendorIds, REPAIR_ID],
    );
    changed.sourceVendorPlatformRelationshipArchived = normalizeRows(
      platformResult.rows,
    );
  }

  return changed;
}

function emitProofBundle(outDir: string): void {
  const result = spawnSync("tar", ["-czf", "-", "-C", outDir, "."], {
    encoding: "buffer",
  });
  if (result.status !== 0) {
    throw new Error(
      `Failed to create proof bundle: ${result.stderr.toString("utf8")}`,
    );
  }
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(result.stdout.toString("base64"));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

async function main() {
  const args = parseArgs();
  fs.mkdirSync(args.outDir, { recursive: true });

  const client = new Client(
    postgresClientOptions(databaseUrl(), "source-deloitte-scope-repair"),
  );
  await client.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.tenant_key', $1, false)", [
      args.tenantKey,
    ]);
    const columns = await readColumns(client);
    const beforeRaw = await readRawRows(client, args.tenantKey, columns);
    const sourceVendorIds = await readSourceVendorIds(client, args.tenantKey);
    const rawVendorIdsFromRows = beforeRaw
      .map((row) => String(row.vendor_id ?? ""))
      .filter(Boolean);
    const vendorIds = Array.from(
      new Set([...sourceVendorIds, ...rawVendorIdsFromRows]),
    ).sort();
    const sourceContractIds = await readDeloitteContractIds(
      client,
      args.tenantKey,
      vendorIds,
    );
    const contractIds = Array.from(
      new Set([
        ...sourceContractIds,
        ...beforeRaw.map((row) => String(row.contract_id ?? "")).filter(Boolean),
      ]),
    ).sort();
    const beforeSource = await readSourceRows(client, args.tenantKey);
    const beforeGoverned = await readGovernedRows(
      client,
      args.tenantKey,
      vendorIds,
      contractIds,
    );
    const staleGovernedCount = Object.entries(beforeGoverned)
      .filter(([key]) => key !== "sourceVendor" && key !== "sourceContract360")
      .reduce((sum, [, rows]) => sum + rows.filter((row) => !row.error).length, 0);
    if (beforeRaw.length === 0 && staleGovernedCount === 0) {
      throw new Error(
        "No tenant-scoped Deloitte raw or governed Source row with Workday/HCM overlap was found; no mutation performed.",
      );
    }

    const updatedRaw = args.apply
      ? beforeRaw.length > 0
        ? await applyRepair(client, args.tenantKey, columns)
        : []
      : [];
    const updatedGoverned = args.apply
      ? await applyGovernedRepair(client, args.tenantKey, vendorIds, contractIds)
      : {
          sourceContract: [],
          sourceContractScopeArchived: [],
          sourceVendorApplicationRelationshipArchived: [],
          sourceVendorPlatformRelationshipArchived: [],
        };
    const afterRaw = args.apply
      ? await readRawRows(client, args.tenantKey, columns)
      : beforeRaw;
    const afterSource = args.apply
      ? await readSourceRows(client, args.tenantKey)
      : beforeSource;
    const afterGoverned = args.apply
      ? await readGovernedRows(client, args.tenantKey, vendorIds, contractIds)
      : beforeGoverned;

    const residualWorkdayRaw = afterRaw.filter((row) =>
      JSON.stringify(row).toLowerCase().includes("workday"),
    );
    const residualHumanResourcesRaw = afterRaw.filter((row) =>
      String(row.supported_functions ?? "")
        .toLowerCase()
        .includes("human resources"),
    );
    const passed =
      args.apply &&
      (updatedRaw.length > 0 ||
        Object.values(updatedGoverned).some((rows) => rows.length > 0)) &&
      residualWorkdayRaw.length === 0 &&
      residualHumanResourcesRaw.length === 0;

    const proof = {
      event: "source_deloitte_workday_scope_repair",
      repairId: REPAIR_ID,
      tenantKey: args.tenantKey,
      apply: args.apply,
      rawTable: `${RAW_SCHEMA}.${RAW_TABLE}`,
      changedRows: updatedRaw.length,
      sourceVendorIds: vendorIds,
      sourceContractIds: contractIds,
      beforeRaw,
      updatedRaw,
      afterRaw,
      beforeSource,
      afterSource,
      beforeGoverned,
      updatedGoverned,
      afterGoverned,
      residualWorkdayRaw,
      residualHumanResourcesRaw,
      passed,
      proofSha256: "",
    };
    proof.proofSha256 = sha256(JSON.stringify(proof));
    writeJson(path.join(args.outDir, "proof.json"), proof);
    writeJson(path.join(args.outDir, "request.json"), {
      repairId: REPAIR_ID,
      tenantKey: args.tenantKey,
      apply: args.apply,
      outDir: args.outDir,
    });

    await client.query(args.apply ? "commit" : "rollback");
    console.log(JSON.stringify(proof, null, 2));
    if (!passed) process.exitCode = 1;
    if (args.emitProofBundle) emitProofBundle(args.outDir);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

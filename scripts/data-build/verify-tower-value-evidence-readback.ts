#!/usr/bin/env npx tsx

import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

function args(name: string): string[] {
  const out: string[] = [];
  process.argv.forEach((a, i) => {
    if (a === `--${name}`) out.push(process.argv[i + 1]);
  });
  return out;
}

const OUT_DIR = arg("out-dir") ?? process.env.TOWER_EVIDENCE_READBACK_OUT_DIR ?? "/tmp/tower-value-evidence-readback";
const TENANTS = args("tenant").length ? args("tenant") : ["meridian-health", "skyharbor-air"];
const BUILD_VERSION =
  process.env.TOWER_EVIDENCE_BUILD_VERSION ?? arg("build-version") ?? "recorded-data-refresh-86a3fac4-tower-evidence";
const CLAIM_RULE_VERSION = "tower-value-evidence/v1";
const provenanceIdForTenant = (tenantKey: string) => `PROV-${tenantKey}-${CLAIM_RULE_VERSION}-${BUILD_VERSION}`;

interface QueryRow {
  [key: string]: unknown;
}

async function query<T extends QueryRow>(client: Client, sql: string, params: unknown[] = []): Promise<T[]> {
  return (await client.query<T>(sql, params)).rows;
}

async function isolationProbe(client: Client, tenantKey: string): Promise<QueryRow> {
  await client.query("BEGIN READ ONLY");
  try {
    await client.query("SET LOCAL ROLE authenticated");
    await client.query("SELECT set_config('app.tenant_key', $1, true)", [tenantKey]);
    const rows = await query(client, `
      select
        current_user as effective_user,
        count(*)::int as visible_claims,
        count(*) filter (where tenant_key <> $1)::int as cross_tenant_claims
      from tower.value_claim
      where claim_rule_version = $2
    `, [tenantKey, CLAIM_RULE_VERSION]);
    await client.query("ROLLBACK");
    return { tenantKey, status: "attempted", rows };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    return { tenantKey, status: "blocked_by_role_permissions", error: error instanceof Error ? error.message : String(error) };
  }
}

async function main(): Promise<number> {
  const connectionString = process.env.ABARVA_AZURE_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("ABARVA_AZURE_DATABASE_URL or DATABASE_URL is required");

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    application_name: "tower-value-evidence-readback-proof",
  });
  await client.connect();

  try {
    const provenanceIds = TENANTS.map(provenanceIdForTenant);
    const summary = {
      event: "tower_value_evidence_readback",
      checkedAt: new Date().toISOString(),
      gitSha: process.env.ABARVA_OPERATOR_BRANCH_COMMIT ?? null,
      imageDigest: process.env.ABARVA_OPERATOR_IMAGE_DIGEST ?? null,
      buildVersion: BUILD_VERSION,
      tenantScope: TENANTS,
      claimRuleVersion: CLAIM_RULE_VERSION,
      identity: await query(client, `
        select current_database() as database_name,
               current_user as user_name,
               session_user as session_user_name,
               current_setting('app.tenant_key', true) as tenant_setting
      `),
      claimCountsByTenant: await query(client, `
        select tenant_key, count(*)::int as claims
        from tower.value_claim
        where claim_rule_version = $1
          and tenant_key = any($2::text[])
        group by tenant_key
        order by tenant_key
      `, [CLAIM_RULE_VERSION, TENANTS]),
      claimStatesByTenant: await query(client, `
        select tenant_key, claim_state, count(*)::int as claims
        from tower.value_claim
        where claim_rule_version = $1
          and tenant_key = any($2::text[])
        group by tenant_key, claim_state
        order by tenant_key, claim_state
      `, [CLAIM_RULE_VERSION, TENANTS]),
      observationCountsByTenant: await query(client, `
        select tenant_key, scenario, count(*)::int as observations
        from tower.metric_observation
        where provenance_id = any($1::text[])
        group by tenant_key, scenario
        order by tenant_key, scenario
      `, [provenanceIds]),
      provenanceRows: await query(client, `
        select tenant_key, provenance_id, source_system, source_schema, source_table,
               formula_version, attestation_status, quality_score::text as quality_score
        from tower.metric_provenance
        where provenance_id = any($1::text[])
        order by tenant_key
      `, [provenanceIds]),
      metricDefinitionReferencedByClaims: await query(client, `
        select count(distinct c.outcome_metric_ref)::int as referenced_metrics,
               count(distinct m.metric_ref)::int as present_metric_definitions,
               count(distinct c.outcome_metric_ref) filter (where m.metric_ref is null)::int as missing_metric_definitions
        from tower.value_claim c
        left join tower.metric_definition m on m.metric_ref = c.outcome_metric_ref
        where c.claim_rule_version = $1
          and c.tenant_key = any($2::text[])
      `, [CLAIM_RULE_VERSION, TENANTS]),
      observationReferenceIntegrity: await query(client, `
        select count(*) filter (where c.baseline_observation_id is not null and b.observation_id is null)::int as missing_baseline_refs,
               count(*) filter (where c.target_observation_id is not null and t.observation_id is null)::int as missing_target_refs,
               count(*) filter (where c.actual_observation_id is not null and a.observation_id is null)::int as missing_actual_refs
        from tower.value_claim c
        left join tower.metric_observation b on b.tenant_key = c.tenant_key and b.observation_id = c.baseline_observation_id
        left join tower.metric_observation t on t.tenant_key = c.tenant_key and t.observation_id = c.target_observation_id
        left join tower.metric_observation a on a.tenant_key = c.tenant_key and a.observation_id = c.actual_observation_id
        where c.claim_rule_version = $1
          and c.tenant_key = any($2::text[])
      `, [CLAIM_RULE_VERSION, TENANTS]),
      isolation: [] as QueryRow[],
      passed: false,
      errors: [] as string[],
    };

    for (const tenantKey of TENANTS) {
      summary.isolation.push(await isolationProbe(client, tenantKey));
    }

    const totalClaims = summary.claimCountsByTenant.reduce((sum, row) => sum + Number(row.claims ?? 0), 0);
    const totalObservations = summary.observationCountsByTenant.reduce((sum, row) => sum + Number(row.observations ?? 0), 0);
    const missingMetrics = Number(summary.metricDefinitionReferencedByClaims[0]?.missing_metric_definitions ?? 0);
    const refIntegrity = summary.observationReferenceIntegrity[0] ?? {};
    const missingObservationRefs =
      Number(refIntegrity.missing_baseline_refs ?? 0) +
      Number(refIntegrity.missing_target_refs ?? 0) +
      Number(refIntegrity.missing_actual_refs ?? 0);

    if (totalClaims !== 102) summary.errors.push(`expected 102 claims, read ${totalClaims}`);
    if (totalObservations !== 78) summary.errors.push(`expected 78 observations, read ${totalObservations}`);
    if (summary.provenanceRows.length !== TENANTS.length) {
      summary.errors.push(`expected ${TENANTS.length} provenance rows, read ${summary.provenanceRows.length}`);
    }
    if (missingMetrics !== 0) summary.errors.push(`missing metric definitions: ${missingMetrics}`);
    if (missingObservationRefs !== 0) summary.errors.push(`missing observation references: ${missingObservationRefs}`);

    summary.passed = summary.errors.length === 0;
    fs.mkdirSync(path.resolve(OUT_DIR), { recursive: true });
    fs.writeFileSync(path.join(path.resolve(OUT_DIR), "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    console.log(JSON.stringify(summary, null, 2));
    return summary.passed ? 0 : 1;
  } finally {
    await client.end();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error("verify-tower-value-evidence-readback failed:", error);
    process.exit(1);
  });

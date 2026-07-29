#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const PHASE_ROOT = "18-phase2b3c-azure-lab-implementation";
const GENERATED_AT = "2026-07-27T00:00:00.000Z";

const TENANTS = [
  {
    displayName: "HC Demo New",
    tenantKey: "hc-demo-new",
    shortCode: "hcdn",
    database: "abarva_hc_demo_new_knowledge_lab",
    postgresServer: "pg-abarva-hc-demo-new-lab-eus-001",
    migrationJob: "job-hcdn-db-migration-lab",
  },
  {
    displayName: "Airline Demo New",
    tenantKey: "airline-demo-new",
    shortCode: "airdn",
    database: "abarva_airline_demo_new_knowledge_lab",
    postgresServer: "pg-abarva-airdn-lab-eus-001",
    migrationJob: "job-airdn-db-migration-lab",
  },
];

const SCHEMAS = [
  "source_registry",
  "evidence",
  "working",
  "knowledge",
  "metrics",
  "governance",
  "publication",
  "consumption",
  "audit",
  "operations",
];

const TENANT_TABLES = [
  ["operations", "job_run", "admin"],
  ["operations", "backfill_queue", "admin"],
  ["source_registry", "source", "ingest"],
  ["source_registry", "source_version", "ingest"],
  ["source_registry", "source_manifest", "ingest"],
  ["evidence", "evidence_item", "ingest"],
  ["working", "entity_candidate", "ingest"],
  ["working", "fact_candidate", "ingest"],
  ["working", "relationship_candidate", "ingest"],
  ["working", "metric_candidate", "ingest"],
  ["working", "entity_resolution_candidate", "ingest"],
  ["working", "normalization_result", "ingest"],
  ["working", "quarantine_item", "ingest"],
  ["knowledge", "entity", "publisher"],
  ["knowledge", "fact_assertion", "publisher"],
  ["knowledge", "relationship_assertion", "publisher"],
  ["metrics", "metric_definition", "publisher"],
  ["metrics", "metric_observation", "publisher"],
  ["metrics", "metric_target", "publisher"],
  ["governance", "review_batch", "reviewer"],
  ["governance", "review_batch_approval", "reviewer"],
  ["governance", "review_decision", "reviewer"],
  ["governance", "authority_transition", "reviewer"],
  ["governance", "knowledge_gap", "reviewer"],
  ["governance", "knowledge_conflict", "reviewer"],
  ["governance", "completion_work_item", "reviewer"],
  ["governance", "supersession_record", "reviewer"],
  ["publication", "domain_publication", "publisher"],
  ["publication", "knowledge_baseline", "publisher"],
  ["publication", "publication_activation", "publisher"],
  ["consumption", "enterprise_brief", "reader"],
  ["consumption", "domain_overview", "reader"],
  ["consumption", "entity_inventory", "reader"],
  ["consumption", "entity_detail", "reader"],
  ["consumption", "relationship_projection", "reader"],
  ["consumption", "relationship_node_v1", "reader"],
  ["consumption", "relationship_edge_v1", "reader"],
  ["consumption", "relationship_graph_v1", "reader"],
  ["consumption", "relationship_evidence_v1", "reader"],
  ["consumption", "relationship_query_index_v1", "reader"],
  ["consumption", "entity_impact_summary_v1", "reader"],
  ["consumption", "metric_projection", "reader"],
  ["consumption", "evidence_gap_projection", "reader"],
  ["consumption", "strategic_insight", "reader"],
  ["consumption", "executive_perspective", "reader"],
  ["consumption", "industry_assessment", "reader"],
  ["consumption", "search_document", "reader"],
  ["consumption", "module_packet_projection", "reader"],
  ["audit", "change_event", "admin"],
  ["audit", "access_event", "admin"],
  ["audit", "model_execution", "admin"],
  ["audit", "rule_execution", "admin"],
  ["audit", "publication_lineage", "admin"],
];

function writeFile(rel, content) {
  const target = path.join(REPO_ROOT, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.endsWith("\n") ? content : `${content}\n`);
}

function writeJson(rel, value) {
  writeFile(rel, `${JSON.stringify(value, null, 2)}\n`);
}

function writeCsv(rel, rows, headers) {
  const escape = (value) => {
    const text = value == null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  writeFile(rel, [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n"));
}

function tenantRoot(tenant) {
  return `clients/${tenant.tenantKey}/${PHASE_ROOT}`;
}

function slugSnake(value) {
  return value.replaceAll("-", "_");
}

function roles(tenant) {
  const prefix = slugSnake(tenant.tenantKey);
  return {
    ingest: `${prefix}_ingest`,
    reviewer: `${prefix}_reviewer`,
    publisher: `${prefix}_publisher`,
    reader: `${prefix}_reader`,
    evaluator: `${prefix}_evaluator`,
    admin: `${prefix}_admin`,
  };
}

function identities(tenant) {
  return {
    ingest: `mi-${tenant.shortCode}-ingest-lab-001`,
    reviewer: `mi-${tenant.shortCode}-review-lab-001`,
    publisher: `mi-${tenant.shortCode}-publish-lab-001`,
    reader: `mi-${tenant.shortCode}-read-lab-001`,
    evaluator: `mi-${tenant.shortCode}-evaluator-lab-001`,
    admin: `mi-${tenant.shortCode}-admin-lab-001`,
  };
}

function roleGrantRows(tenant) {
  const r = roles(tenant);
  const rows = [];
  for (const schema of SCHEMAS) {
    rows.push({ role: r.admin, schema, usage: "yes", select: "yes", insert: "yes", update: "yes", delete: "yes", execute: "yes", default_privileges: "all" });
  }
  for (const schema of ["source_registry", "evidence", "working", "operations"]) {
    rows.push({ role: r.ingest, schema, usage: "yes", select: "yes", insert: "yes", update: "yes", delete: "no", execute: "limited", default_privileges: "select_insert_update" });
  }
  for (const schema of ["working", "governance", "operations"]) {
    rows.push({ role: r.reviewer, schema, usage: "yes", select: "yes", insert: "yes", update: "yes", delete: "no", execute: "limited", default_privileges: "select_insert_update" });
  }
  for (const schema of ["knowledge", "metrics", "publication", "consumption", "operations"]) {
    rows.push({ role: r.publisher, schema, usage: "yes", select: "yes", insert: "yes", update: "yes", delete: "no", execute: "limited", default_privileges: "select_insert_update" });
  }
  for (const schema of ["knowledge", "metrics", "publication", "consumption"]) {
    rows.push({ role: r.reader, schema, usage: "yes", select: "yes", insert: "no", update: "no", delete: "no", execute: "limited_read", default_privileges: "select_only" });
  }
  for (const schema of ["knowledge", "metrics", "publication", "consumption", "governance", "evidence", "audit", "operations"]) {
    rows.push({ role: r.evaluator, schema, usage: "yes", select: "yes", insert: "no", update: "no", delete: "no", execute: "limited_read", default_privileges: "select_only" });
  }
  return rows;
}

function rlsRows(tenant) {
  const r = roles(tenant);
  return TENANT_TABLES.map(([schema, table, owner]) => ({
    schema,
    table,
    tenant_column: "tenant_key",
    rls_required: "yes",
    policy_name: `${tenant.shortCode}_${schema}_${table}_tenant_policy`.replaceAll(/[^a-zA-Z0-9_]/g, "_"),
    accepted_states_visible_to_reader:
      schema === "consumption" || schema === "publication" || schema === "knowledge" || schema === "metrics"
        ? "accepted,planning_grade,published,built,activated"
        : "not_visible",
    writer_role:
      owner === "ingest" ? r.ingest : owner === "reviewer" ? r.reviewer : owner === "publisher" ? r.publisher : r.admin,
    reader_role: r.reader,
    evaluator_role: r.evaluator,
    boundary: schema === "working" ? "reader_denied_candidates" : schema === "evidence" ? "runtime_denied_hidden_truth" : "tenant_scoped",
  }));
}

function migrationJobRows(tenant) {
  const r = roles(tenant);
  return [
    {
      job_name: tenant.migrationJob,
      tenant_key: tenant.tenantKey,
      database: tenant.database,
      required_identity: identities(tenant).admin,
      database_role: r.admin,
      mode: "preflight",
      command: `node scripts/knowledge/hcdn-job-runner.mjs --tenant ${tenant.tenantKey} --process ${tenant.tenantKey}-knowledge-validate-v1 --mode preflight --stage 00_database_preflight`,
    },
    {
      job_name: tenant.migrationJob,
      tenant_key: tenant.tenantKey,
      database: tenant.database,
      required_identity: identities(tenant).admin,
      database_role: r.admin,
      mode: "migration_replay",
      command: `psql \"$DATABASE_URL\" --set=ON_ERROR_STOP=on --file clients/${tenant.tenantKey}/${PHASE_ROOT}/12-postgres-security-plan/phase2b3c2c-postgres-readiness.sql`,
    },
    {
      job_name: tenant.migrationJob,
      tenant_key: tenant.tenantKey,
      database: tenant.database,
      required_identity: identities(tenant).admin,
      database_role: r.admin,
      mode: "rollback_rehearsal",
      command: `psql \"$DATABASE_URL\" --set=ON_ERROR_STOP=on --file clients/${tenant.tenantKey}/${PHASE_ROOT}/12-postgres-security-plan/phase2b3c2c-rollback-rehearsal.sql`,
    },
  ];
}

function sqlLiteral(value) {
  return value.replaceAll("'", "''");
}

function postgresSql(tenant) {
  const r = roles(tenant);
  const id = identities(tenant);
  const roleValues = Object.entries(r)
    .map(([kind, role]) => `  ('${kind}', '${role}')`)
    .join(",\n");
  const identityRoleValues = [
    [id.ingest, r.ingest],
    [id.reviewer, r.reviewer],
    [id.publisher, r.publisher],
    [id.reader, r.reader],
    [id.evaluator, r.evaluator],
    [id.admin, r.admin],
  ]
    .map(([identityName, roleName]) => `  ('${identityName}', '${roleName}')`)
    .join(",\n");
  const tableValues = rlsRows(tenant)
    .map((row) => `  ('${row.schema}', '${row.table}', '${row.policy_name}')`)
    .join(",\n");
  return `\\set ON_ERROR_STOP on

-- Phase 2B-3C-2C readiness SQL for ${tenant.displayName}.
-- Plan-only artifact. Run only through the governed migration ACA job after independent approval.

do $$
begin
  if current_database() <> '${sqlLiteral(tenant.database)}' then
    raise exception 'wrong database target: %, expected ${sqlLiteral(tenant.database)}', current_database();
  end if;
end $$;

create schema if not exists audit;

create or replace function audit.assert_${tenant.shortCode}_tenant(target_tenant text)
returns void language plpgsql as $$
begin
  if target_tenant is null or btrim(target_tenant) = '' then
    raise exception 'blank tenant is not allowed';
  end if;
  if target_tenant in ('all','*','%') then
    raise exception 'wildcard tenant is not allowed: %', target_tenant;
  end if;
  if target_tenant <> '${sqlLiteral(tenant.tenantKey)}' then
    raise exception 'wrong tenant: %, expected ${sqlLiteral(tenant.tenantKey)}', target_tenant;
  end if;
end $$;

do $$
declare
  role_row record;
begin
  for role_row in
    select * from (values
${roleValues}
    ) as r(role_kind, role_name)
  loop
    if not exists (select 1 from pg_roles where rolname = role_row.role_name) then
      execute format('create role %I nologin', role_row.role_name);
    end if;
  end loop;
end $$;

-- Entra users for managed identities are created by Azure PostgreSQL administrator bootstrap.
-- The governed migration job must map each managed identity principal to the role below before grants are used:
-- ${identities(tenant).ingest} -> ${r.ingest}
-- ${identities(tenant).reviewer} -> ${r.reviewer}
-- ${identities(tenant).publisher} -> ${r.publisher}
-- ${identities(tenant).reader} -> ${r.reader}
-- ${identities(tenant).evaluator} -> ${r.evaluator}
-- ${identities(tenant).admin} -> ${r.admin}
do $$
declare
  role_map record;
begin
  for role_map in
    select * from (values
${identityRoleValues}
    ) as m(identity_name, role_name)
  loop
    if exists (select 1 from pg_roles where rolname = role_map.identity_name) then
      execute format('grant %I to %I', role_map.role_name, role_map.identity_name);
    end if;
  end loop;
end $$;

grant usage on schema source_registry, evidence, working, operations to ${r.ingest};
grant select, insert, update on all tables in schema source_registry, evidence, working, operations to ${r.ingest};
grant usage on all sequences in schema source_registry, evidence, working, operations to ${r.ingest};

grant usage on schema working, governance, operations to ${r.reviewer};
grant select, insert, update on all tables in schema working, governance, operations to ${r.reviewer};
grant usage on all sequences in schema working, governance, operations to ${r.reviewer};

grant usage on schema knowledge, metrics, publication, consumption, operations to ${r.publisher};
grant select, insert, update on all tables in schema knowledge, metrics, publication, consumption, operations to ${r.publisher};
grant usage on all sequences in schema knowledge, metrics, publication, consumption, operations to ${r.publisher};

grant usage on schema knowledge, metrics, publication, consumption to ${r.reader};
grant select on all tables in schema knowledge, metrics, publication, consumption to ${r.reader};

grant usage on schema knowledge, metrics, publication, consumption, governance, evidence, audit, operations to ${r.evaluator};
grant select on all tables in schema knowledge, metrics, publication, consumption, governance, evidence, audit, operations to ${r.evaluator};
alter default privileges in schema knowledge, metrics, publication, consumption, governance, evidence, audit, operations grant select on tables to ${r.evaluator};

grant usage on schema ${SCHEMAS.join(", ")} to ${r.admin};
grant all privileges on all tables in schema ${SCHEMAS.join(", ")} to ${r.admin};
grant all privileges on all sequences in schema ${SCHEMAS.join(", ")} to ${r.admin};

revoke all on schema working from ${r.reader};
revoke all on all tables in schema working from ${r.reader};
revoke insert, update, delete on all tables in schema knowledge, metrics, publication, consumption from ${r.reader}, ${r.evaluator};
revoke insert, update, delete on all tables in schema publication, consumption from ${r.ingest}, ${r.reviewer};

do $$
declare
  table_row record;
begin
  for table_row in
    select * from (values
${tableValues}
    ) as t(schema_name, table_name, policy_name)
  loop
    if to_regclass(format('%I.%I', table_row.schema_name, table_row.table_name)) is not null then
      execute format('alter table %I.%I enable row level security', table_row.schema_name, table_row.table_name);
      execute format('alter table %I.%I force row level security', table_row.schema_name, table_row.table_name);
      execute format('drop policy if exists %I on %I.%I', table_row.policy_name, table_row.schema_name, table_row.table_name);
      execute format(
        'create policy %I on %I.%I for all using (tenant_key = %L) with check (tenant_key = %L)',
        table_row.policy_name,
        table_row.schema_name,
        table_row.table_name,
        '${sqlLiteral(tenant.tenantKey)}',
        '${sqlLiteral(tenant.tenantKey)}'
      );
    end if;
  end loop;
end $$;

-- Strategic insight must not default to accepted. It stays planning-grade/candidate until explicit review.
do $$
begin
  if to_regclass('consumption.strategic_insight') is not null then
    alter table consumption.strategic_insight alter column authority_state set default 'planning_grade';
  end if;
end $$;
`;
}

function rollbackSql(tenant) {
  const r = roles(tenant);
  return `\\set ON_ERROR_STOP on

-- Rollback rehearsal for ${tenant.displayName}. Plan-only until an independent migration review authorizes execution.
do $$
begin
  if current_database() <> '${sqlLiteral(tenant.database)}' then
    raise exception 'wrong database target: %, expected ${sqlLiteral(tenant.database)}', current_database();
  end if;
end $$;

select audit.assert_${tenant.shortCode}_tenant('${sqlLiteral(tenant.tenantKey)}');

-- Rehearsal posture: prove rollback is explicit and bounded. No tables are dropped here.
revoke insert, update, delete on all tables in schema publication, consumption from ${r.ingest}, ${r.reviewer};
revoke all on schema working from ${r.reader};
revoke all on all tables in schema working from ${r.reader};
`;
}

function readme(tenant) {
  const r = roles(tenant);
  return `# Phase 2B-3C-2C PostgreSQL Identity, RLS and Migration Readiness

Tenant: \`${tenant.tenantKey}\` (${tenant.displayName})

This package is plan-only. It does not apply a migration and does not load source data.

## Required readiness controls

- Azure Lab database guard: \`${tenant.database}\`.
- Entra authentication and Entra administrator bootstrap must be enabled before SQL execution.
- Managed identities map to database roles: \`${Object.values(r).join("`, `")}\`.
- Ingest can create candidates but cannot publish.
- Reviewer can review and route, but cannot publish baselines.
- Publisher can publish domain/baseline/read models but cannot read hidden evaluator truth.
- Reader can read accepted/published consumption surfaces but cannot read working candidates.
- Evaluator can read hidden truth and published reconstruction outputs, but cannot mutate Knowledge.
- Strategic insight defaults to planning grade; accepted insight requires explicit review/publication.
- Empty database replay, idempotent second replay, and rollback rehearsal are mandatory before Azure migration apply.

## Still blocked

- No Azure PostgreSQL DDL has been applied.
- No source landing, parsing, normalization, publication, or runtime read-model switch is authorized by this package.
- Execution must be through the governed ACA migration job only.
`;
}

function plan(tenant) {
  return {
    schema: "abarva.phase2b3c.postgres-identity-rls-plan/v1",
    generatedAt: GENERATED_AT,
    tenantKey: tenant.tenantKey,
    displayName: tenant.displayName,
    azureApplyBlocked: true,
    databaseMigrationBlocked: true,
    postgresServer: tenant.postgresServer,
    database: tenant.database,
    entra: {
      authenticationRequired: true,
      administratorBootstrapRequired: true,
      localPasswordFallbackAllowed: false,
    },
    roles: roles(tenant),
    managedIdentities: identities(tenant),
    governedMigrationJob: tenant.migrationJob,
    tableCoverage: rlsRows(tenant).length,
    replayRequirements: [
      "empty_database_migration_replay",
      "idempotent_second_replay",
      "rollback_rehearsal",
      "wrong_database_guard",
      "wrong_tenant_guard",
      "reader_candidate_denial",
      "ingest_publish_denial",
      "evaluator_mutation_denial",
    ],
  };
}

function validationSummary(tenant, checks) {
  return {
    schema: "abarva.phase2b3c.postgres-readiness-validation/v1",
    generatedAt: GENERATED_AT,
    tenantKey: tenant.tenantKey,
    status: checks.every((check) => check.status === "pass") ? "pass" : "fail",
    checks,
  };
}

function generateTenant(tenant) {
  const root = tenantRoot(tenant);
  const out = `${root}/12-postgres-security-plan`;
  const roleRows = roleGrantRows(tenant);
  const tableRows = rlsRows(tenant);
  const jobRows = migrationJobRows(tenant);

  writeJson(`${out}/POSTGRES_IDENTITY_RLS_PLAN.json`, plan(tenant));
  writeFile(`${out}/POSTGRES_IDENTITY_RLS_READINESS.md`, readme(tenant));
  writeCsv(`${out}/ROLE_GRANT_MATRIX.csv`, roleRows, [
    "role",
    "schema",
    "usage",
    "select",
    "insert",
    "update",
    "delete",
    "execute",
    "default_privileges",
  ]);
  writeCsv(`${out}/RLS_TABLE_COVERAGE.csv`, tableRows, [
    "schema",
    "table",
    "tenant_column",
    "rls_required",
    "policy_name",
    "accepted_states_visible_to_reader",
    "writer_role",
    "reader_role",
    "evaluator_role",
    "boundary",
  ]);
  writeCsv(`${out}/MIGRATION_JOB_CONTRACT.csv`, jobRows, [
    "job_name",
    "tenant_key",
    "database",
    "required_identity",
    "database_role",
    "mode",
    "command",
  ]);
  writeCsv(
    `${out}/MIGRATION_REPLAY_CHECKLIST.csv`,
    [
      ["correct_database_guard", "must_pass_before_ddl", tenant.database],
      ["entra_auth_enabled", "must_be_verified_by_azure_plan", "authentication: Entra-only runtime path"],
      ["empty_database_replay", "must_pass_before_source_load", "schema creates cleanly"],
      ["idempotent_second_replay", "must_pass_before_source_load", "second run is no-op or safe replace"],
      ["rollback_rehearsal", "must_pass_before_source_load", "bounded rollback script runs without drops"],
      ["ingest_cannot_publish", "must_pass_before_source_load", "negative grant probe"],
      ["reader_cannot_read_candidates", "must_pass_before_runtime", "negative RLS/schema probe"],
      ["evaluator_cannot_mutate_knowledge", "must_pass_before_evaluation", "negative grant probe"],
      ["strategic_insight_not_accepted_by_default", "must_pass_before_runtime", "default planning_grade"],
    ].map(([check, gate, evidence]) => ({ check, gate, evidence })),
    ["check", "gate", "evidence"],
  );
  writeFile(`${out}/phase2b3c2c-postgres-readiness.sql`, postgresSql(tenant));
  writeFile(`${out}/phase2b3c2c-rollback-rehearsal.sql`, rollbackSql(tenant));

  const checks = [
    { name: "database_guard", status: postgresSql(tenant).includes(`current_database() <> '${tenant.database}'`) ? "pass" : "fail" },
    { name: "six_roles", status: Object.keys(roles(tenant)).length === 6 ? "pass" : "fail" },
    { name: "rls_table_coverage", status: tableRows.length >= 50 ? "pass" : "fail", count: tableRows.length },
    { name: "reader_candidate_denial", status: postgresSql(tenant).includes(`revoke all on schema working from ${roles(tenant).reader}`) ? "pass" : "fail" },
    { name: "ingest_publish_denial", status: postgresSql(tenant).includes(`from ${roles(tenant).ingest}`) ? "pass" : "fail" },
    { name: "evaluator_mutation_denial", status: postgresSql(tenant).includes(`from ${roles(tenant).reader}, ${roles(tenant).evaluator}`) ? "pass" : "fail" },
    { name: "evaluator_governance_read", status: postgresSql(tenant).includes(`consumption, governance, evidence`) ? "pass" : "fail" },
    { name: "managed_identity_role_inheritance", status: postgresSql(tenant).includes("grant %I to %I") ? "pass" : "fail" },
    { name: "strategic_insight_planning_grade", status: postgresSql(tenant).includes("set default 'planning_grade'") ? "pass" : "fail" },
    { name: "migration_job_contract", status: jobRows.every((row) => row.job_name === tenant.migrationJob) ? "pass" : "fail" },
  ];
  writeJson(`${root}/validation/phase2b3c2c-postgres-readiness-validation-summary.json`, validationSummary(tenant, checks));
  return { tenantKey: tenant.tenantKey, status: checks.every((check) => check.status === "pass") ? "pass" : "fail", rlsTables: tableRows.length };
}

const results = TENANTS.map(generateTenant);
const reportRoot = "reports/phase2b3c-postgres-readiness";
writeJson(`${reportRoot}/rollup.json`, {
  schema: "abarva.phase2b3c.postgres-readiness-rollup/v1",
  generatedAt: GENERATED_AT,
  azureApplyBlocked: true,
  databaseMigrationBlocked: true,
  tenants: results,
});
writeCsv(`${reportRoot}/rollup.csv`, results, ["tenantKey", "status", "rlsTables"]);
writeFile(
  `${reportRoot}/README.md`,
  `# Phase 2B-3C-2C PostgreSQL readiness rollup

Generated ${GENERATED_AT}.

This is a plan-only package for HC Demo New and Airline Demo New. It prepares identity, role, RLS, replay, rollback, and migration-job contracts. It does not apply DDL, create Azure resources, or load data.
`,
);

const failed = results.filter((result) => result.status !== "pass");
if (failed.length > 0) {
  console.error(`PostgreSQL readiness generation failed for: ${failed.map((result) => result.tenantKey).join(", ")}`);
  process.exit(1);
}
console.log(`Generated PostgreSQL readiness packages for ${results.length} tenants.`);

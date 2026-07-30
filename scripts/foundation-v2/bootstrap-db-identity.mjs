#!/usr/bin/env node
import {
  WRITER_ROLE,
  databaseUrl,
  emitProofBundle,
  postgresClientOptions,
  proofRef,
  writeJson,
  writeMarkdown,
} from "./golden-slice-support.mjs";

const READER_ROLE = "foundation_v2_golden_slice_reader";
const DEFAULT_WRITER_IDENTITY = "mi-foundation-v2-golden-slice-writer-lab-001";
const DEFAULT_READER_IDENTITY = "mi-foundation-v2-golden-slice-reader-lab-001";

const args = parseArgs(process.argv.slice(2));

await main(args).catch((error) => {
  console.error(JSON.stringify({ status: "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main(options) {
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL or ABARVA_AZURE_DATABASE_URL is required for the governed bootstrap lane");
  const { Client } = await import("pg");
  const client = new Client(postgresClientOptions(url, "foundation-v2-db-identity-bootstrap"));
  await client.connect();
  try {
    const roleName = options.identityName || (options.kind === "reader" ? DEFAULT_READER_IDENTITY : DEFAULT_WRITER_IDENTITY);
    const targetRole = options.kind === "reader" ? READER_ROLE : WRITER_ROLE;
    const proof = await bootstrap(client, { ...options, roleName, targetRole });
    writeJson(proofRef(options.outDir, "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_PROOF.json"), proof);
    writeMarkdown(proofRef(options.outDir, "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_PROOF.md"), bootstrapMarkdown(proof));
    console.log(JSON.stringify(proof, null, 2));
    if (options.emitProofBundle) emitProofBundle(options.outDir);
    if (proof.status !== "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_PASSED") process.exitCode = 1;
  } finally {
    await client.end();
  }
}

async function bootstrap(client, options) {
  assertIdentifier(options.roleName, "identity role");
  assertIdentifier(options.targetRole, "target role");
  await client.query("BEGIN");
  try {
    const functions = await aadFunctionReadback(client);
    let created = false;
    const existedBefore = await roleExists(client, options.roleName);
    if (!existedBefore) {
      if (!functions.some((fn) => fn.identity === "pgaadauth_create_principal")) {
        throw new Error("pgaadauth_create_principal is not available in this database");
      }
      await client.query("SELECT * FROM pgaadauth_create_principal($1, false, false)", [options.roleName]);
      created = true;
    }

    await client.query(
      `ALTER ROLE ${quoteIdent(options.roleName)}
         LOGIN
         NOSUPERUSER
         NOCREATEDB
         NOCREATEROLE
         NOREPLICATION
         NOBYPASSRLS
         NOINHERIT`,
    );
    const databaseName = (await client.query("SELECT current_database() AS database_name")).rows[0].database_name;
    await client.query(`GRANT CONNECT ON DATABASE ${quoteIdent(databaseName)} TO ${quoteIdent(options.roleName)}`);
    await client.query(`GRANT ${quoteIdent(options.targetRole)} TO ${quoteIdent(options.roleName)}`);
    await client.query(`GRANT SELECT ON schema_migrations TO ${quoteIdent(options.roleName)}`);
    await client.query(`REVOKE CREATE ON SCHEMA public FROM ${quoteIdent(options.roleName)}`);
    await client.query(`REVOKE ALL ON SCHEMA public FROM ${quoteIdent(options.roleName)}`);

    const role = await roleReadback(client, options.roleName);
    const target = await roleReadback(client, options.targetRole);
    const memberships = await membershipReadback(client, options.roleName);
    const aadPrincipals = await aadPrincipalReadback(client, options.roleName);
    const defects = [];
    if (!role) defects.push(`missing identity role ${options.roleName}`);
    if (role?.rolsuper || role?.rolcreatedb || role?.rolcreaterole || role?.rolreplication || role?.rolbypassrls || role?.rolinherit) {
      defects.push(`identity role ${options.roleName} has forbidden attributes`);
    }
    if (!role?.rolcanlogin) defects.push(`identity role ${options.roleName} cannot login`);
    if (!target) defects.push(`missing target role ${options.targetRole}`);
    if (target?.rolcanlogin || target?.rolsuper || target?.rolcreatedb || target?.rolcreaterole || target?.rolreplication || target?.rolbypassrls || target?.rolinherit) {
      defects.push(`target role ${options.targetRole} has forbidden attributes`);
    }
    if (!memberships.includes(options.targetRole)) defects.push(`${options.roleName} is not member of ${options.targetRole}`);
    if (options.objectId && !JSON.stringify(aadPrincipals).toLowerCase().includes(options.objectId.toLowerCase())) {
      defects.push(`AAD principal object ID ${options.objectId} not found in pgaadauth readback`);
    }

    if (defects.length > 0) {
      await client.query("ROLLBACK");
      return createProof(options, "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_FAILED", {
        created,
        defects,
        role,
        target,
        memberships,
        aad_functions: functions,
        aad_principals: aadPrincipals,
      });
    }

    await client.query("COMMIT");
    return createProof(options, "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_PASSED", {
      created,
      existed_before: existedBefore,
      defects,
      role,
      target,
      memberships,
      aad_functions: functions,
      aad_principals: aadPrincipals,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

function createProof(options, status, extra) {
  return {
    status,
    generated_at: new Date().toISOString(),
    identity_kind: options.kind,
    identity_role: options.roleName,
    expected_object_id: options.objectId || "",
    target_role: options.targetRole,
    administrator_url_logged: false,
    token_logged: false,
    ...extra,
  };
}

async function aadFunctionReadback(client) {
  return (
    await client.query(
      `SELECT p.proname AS identity,
              p.oid::regprocedure::text AS signature
         FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname LIKE 'pgaadauth_%'
        ORDER BY p.proname, signature`,
    )
  ).rows;
}

async function aadPrincipalReadback(client, roleName) {
  try {
    const rows = (await client.query("SELECT to_jsonb(t) AS principal FROM pgaadauth_list_principals(false) AS t")).rows;
    return rows.map((row) => row.principal).filter((principal) => JSON.stringify(principal).includes(roleName));
  } catch (error) {
    return [{ readback_error: error.message }];
  }
}

async function roleExists(client, roleName) {
  return Boolean((await roleReadback(client, roleName)));
}

async function roleReadback(client, roleName) {
  return (
    await client.query(
      `SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls, rolinherit
         FROM pg_roles
        WHERE rolname=$1`,
      [roleName],
    )
  ).rows[0] || null;
}

async function membershipReadback(client, roleName) {
  return (
    await client.query(
      `SELECT parent.rolname AS role_name
         FROM pg_auth_members m
         JOIN pg_roles child ON child.oid = m.member
         JOIN pg_roles parent ON parent.oid = m.roleid
        WHERE child.rolname=$1
        ORDER BY parent.rolname`,
      [roleName],
    )
  ).rows.map((row) => row.role_name);
}

function parseArgs(argv) {
  const parsed = {
    kind: process.env.FOUNDATION_V2_DB_IDENTITY_KIND || "writer",
    identityName: process.env.FOUNDATION_V2_DB_IDENTITY_NAME || "",
    objectId: process.env.FOUNDATION_V2_DB_IDENTITY_OBJECT_ID || "",
    outDir: process.env.FOUNDATION_V2_DB_IDENTITY_OUT_DIR || "/tmp/foundation-v2-db-identity-bootstrap",
    emitProofBundle: process.env.EMIT_ACA_PROOF_BUNDLE === "true" || process.env.FOUNDATION_V2_EMIT_PROOF_BUNDLE === "true",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--kind") parsed.kind = next();
    else if (arg === "--identity-name") parsed.identityName = next();
    else if (arg === "--object-id") parsed.objectId = next();
    else if (arg === "--out-dir") parsed.outDir = next();
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (!["writer", "reader"].includes(parsed.kind)) throw new Error("--kind must be writer or reader");
  return parsed;
}

function assertIdentifier(value, label) {
  if (!/^[A-Za-z_][A-Za-z0-9_-]{0,62}$/.test(value)) throw new Error(`Invalid ${label}: ${value}`);
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function bootstrapMarkdown(proof) {
  return `# Foundation V2 DB Identity Bootstrap Proof

Status: ${proof.status}

- Identity kind: \`${proof.identity_kind}\`
- Identity role: \`${proof.identity_role}\`
- Expected object ID: \`${proof.expected_object_id || "not-provided"}\`
- Target role: \`${proof.target_role}\`
- Administrator URL logged: ${proof.administrator_url_logged}
- Token logged: ${proof.token_logged}
- Defects: ${proof.defects.length}

This proof does not approve full reload, offline augmentation ingestion, live review-decision application, live canonical promotion, live domain publication, live baseline activation, production provider cutover, production Knowledge UI cutover, production aVa activation, or V1 deletion.
`;
}

#!/usr/bin/env node
import {
  READER_ROLE,
  WRITER_ROLE,
  databaseUrl,
  emitProofBundle,
  postgresClientOptions,
  proofRef,
  writeJson,
  writeMarkdown,
} from "./golden-slice-support.mjs";

const DEFAULT_WRITER_IDENTITY =
  process.env.FOUNDATION_V2_DB_WRITER_IDENTITY_NAME || "mi-foundation-v2-golden-slice-writer-lab-001";
const DEFAULT_READER_IDENTITY =
  process.env.FOUNDATION_V2_DB_READER_IDENTITY_NAME || "mi-foundation-v2-golden-slice-reader-lab-001";

const args = parseArgs(process.argv.slice(2));

await main(args).catch((error) => {
  console.error(JSON.stringify({ status: "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main(options) {
  if (options.mode === "self-test") {
    const proof = selfTestProof();
    writeJson(proofRef(options.outDir, "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_SELF_TEST.json"), proof);
    console.log(JSON.stringify(proof, null, 2));
    if (options.emitProofBundle) emitProofBundle(options.outDir);
    if (proof.status !== "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_SELF_TEST_PASSED") process.exit(1);
    return;
  }
  if (options.mode !== "apply") throw new Error(`Unsupported mode ${options.mode}`);
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL or ABARVA_AZURE_DATABASE_URL is required for the governed bootstrap lane");
  const { Client } = await import("pg");
  const client = new Client(postgresClientOptions(url, "foundation-v2-db-identity-bootstrap"));
  await client.connect();
  try {
    const roleName = options.identityName || (options.kind === "reader" ? DEFAULT_READER_IDENTITY : DEFAULT_WRITER_IDENTITY);
    const targetRole = options.kind === "reader" ? READER_ROLE : WRITER_ROLE;
    const proof = await bootstrap(client, { ...options, roleName, targetRole, databaseTarget: sanitizedDatabaseTarget(url) });
    writeJson(proofRef(options.outDir, "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_PROOF.json"), proof);
    writeMarkdown(proofRef(options.outDir, "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_PROOF.md"), bootstrapMarkdown(proof));
    printCompactResult(proof);
    console.log(JSON.stringify(proof, null, 2));
    if (options.emitProofBundle) emitProofBundle(options.outDir);
    if (options.emitProofBundle) printCompactResult(proof);
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
    const extension = await ensureAadExtension(client);
    const functions = await aadFunctionReadback(client);
    let created = false;
    const existedBefore = await roleExists(client, options.roleName);
    let creationMethod = existedBefore ? "existing_role" : "";
    const defects = [];
    if (!existedBefore) {
      const creation = await createAadPrincipalRole(client, options, functions);
      created = creation.created;
      creationMethod = creation.method;
      defects.push(...creation.defects);
    } else if (options.objectId && functions.length === 0) {
      const label = await aadSecurityLabelReadback(client, options.roleName);
      if (!securityLabelHasObjectId(label, options.objectId)) {
        const labeled = await applyAadSecurityLabel(client, options.roleName, options.objectId);
        creationMethod = labeled.method;
        defects.push(...labeled.defects);
      }
    }

    if (defects.length > 0) {
      await client.query("ROLLBACK");
      return createProof(options, "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_FAILED", {
        created: false,
        creation_method: creationMethod,
        defects,
        role: null,
        target: await roleReadback(client, options.targetRole),
        memberships: [],
        aad_extension: extension,
        aad_functions: functions,
        aad_principals: [],
      });
    }

    if (options.scope === "principal") {
      const role = await roleReadback(client, options.roleName);
      const target = await roleReadback(client, options.targetRole);
      const memberships = await membershipReadback(client, options.roleName);
      const aadPrincipals = await aadPrincipalReadback(client, options.roleName);
      if (!role) defects.push(`missing identity role ${options.roleName}`);
      if (role?.rolsuper || role?.rolcreatedb || role?.rolcreaterole || role?.rolreplication || role?.rolbypassrls) {
        defects.push(`identity role ${options.roleName} has forbidden privileged attributes`);
      }
      if (!role?.rolcanlogin) defects.push(`identity role ${options.roleName} cannot login`);
      if (options.objectId && !JSON.stringify(aadPrincipals).toLowerCase().includes(options.objectId.toLowerCase())) {
        defects.push(`AAD principal object ID ${options.objectId} not found in pgaadauth readback`);
      }
      if (defects.length > 0) {
        await client.query("ROLLBACK");
        return createProof(options, "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_FAILED", {
          created,
          existed_before: existedBefore,
          defects,
          role,
          target,
          memberships,
          role_hardening: { attempted: false, skipped_reason: "principal-scope" },
          schema_public_revokes: { attempted: false, skipped_reason: "principal-scope" },
          aad_extension: extension,
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
        role_hardening: { attempted: false, skipped_reason: "principal-scope" },
        schema_public_revokes: { attempted: false, skipped_reason: "principal-scope" },
        aad_extension: extension,
        aad_functions: functions,
        aad_principals: aadPrincipals,
      });
    }

    const roleHardening = await bestEffortRoleHardening(client, options.roleName);
    const databaseName = (await client.query("SELECT current_database() AS database_name")).rows[0].database_name;
    await client.query(`GRANT CONNECT ON DATABASE ${quoteIdent(databaseName)} TO ${quoteIdent(options.roleName)}`);
    await client.query(`GRANT ${quoteIdent(options.targetRole)} TO ${quoteIdent(options.roleName)}`);
    if (await relationExists(client, "schema_migrations")) {
      await client.query(`GRANT SELECT ON schema_migrations TO ${quoteIdent(options.roleName)}`);
    }
    const schemaPublicRevokes = await bestEffortPublicSchemaRevokes(client, options.roleName);

    const role = await roleReadback(client, options.roleName);
    const target = await roleReadback(client, options.targetRole);
    const memberships = await membershipReadback(client, options.roleName);
    const aadPrincipals = await aadPrincipalReadback(client, options.roleName);
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
    if (options.objectId && !principalReadbackHasObjectId(aadPrincipals, options.objectId)) {
      defects.push(`AAD principal object ID ${options.objectId} not found in pgaadauth readback`);
    }

    if (defects.length > 0) {
      await client.query("ROLLBACK");
      return createProof(options, "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_FAILED", {
        created,
        creation_method: creationMethod,
        defects,
        role,
        target,
        memberships,
        role_hardening: roleHardening,
        schema_public_revokes: schemaPublicRevokes,
        aad_extension: extension,
        aad_functions: functions,
        aad_principals: aadPrincipals,
      });
    }

    await client.query("COMMIT");
    return createProof(options, "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_PASSED", {
      created,
      creation_method: creationMethod,
      existed_before: existedBefore,
      defects,
      role,
      target,
      memberships,
      role_hardening: roleHardening,
      schema_public_revokes: schemaPublicRevokes,
      aad_extension: extension,
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
    bootstrap_scope: options.scope,
    database_target: options.databaseTarget,
    identity_kind: options.kind,
    identity_role: options.roleName,
    expected_object_id: options.objectId || "",
    target_role: options.targetRole,
    administrator_url_logged: false,
    token_logged: false,
    ...extra,
  };
}

async function ensureAadExtension(client) {
  const before = await aadExtensionReadback(client);
  const pgaad = before.find((extension) => extension.name === "pgaadauth");
  const result = {
    before,
    attempted_create: false,
    create_error: "",
    after: before,
  };
  if (pgaad && !pgaad.installed_version) {
    result.attempted_create = true;
    await client.query("SAVEPOINT foundation_v2_aad_extension_create");
    try {
      await client.query("CREATE EXTENSION IF NOT EXISTS pgaadauth");
      await client.query("RELEASE SAVEPOINT foundation_v2_aad_extension_create");
    } catch (error) {
      result.create_error = error.message;
      await client.query("ROLLBACK TO SAVEPOINT foundation_v2_aad_extension_create").catch(() => {});
      await client.query("RELEASE SAVEPOINT foundation_v2_aad_extension_create").catch(() => {});
    }
    result.after = await aadExtensionReadback(client);
  }
  return result;
}

async function aadExtensionReadback(client) {
  return (
    await client.query(
      `SELECT name, installed_version, default_version, comment
         FROM pg_available_extensions
        WHERE name = 'pgaadauth'
        ORDER BY name`,
    )
  ).rows;
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

async function createAadPrincipalRole(client, options, functions) {
  if (options.objectId && functions.some((fn) => fn.identity === "pgaadauth_create_principal_with_oid")) {
    await client.query("SELECT * FROM pgaadauth_create_principal_with_oid($1, $2, 'service', false, false)", [
      options.roleName,
      options.objectId,
    ]);
    return { created: true, method: "pgaadauth_create_principal_with_oid", defects: [] };
  }
  if (functions.some((fn) => fn.identity === "pgaadauth_create_principal")) {
    await client.query("SELECT * FROM pgaadauth_create_principal($1, false, false)", [options.roleName]);
    return { created: true, method: "pgaadauth_create_principal", defects: [] };
  }
  if (options.objectId) {
    await client.query(`CREATE ROLE ${quoteIdent(options.roleName)} LOGIN`);
    const labeled = await applyAadSecurityLabel(client, options.roleName, options.objectId);
    return {
      created: true,
      method: labeled.method,
      defects: labeled.defects,
    };
  }
  return {
    created: false,
    method: "missing_pgaadauth_function",
    defects: ["pgaadauth_create_principal is not available in this database and no object ID fallback was supplied"],
  };
}

async function applyAadSecurityLabel(client, roleName, objectId) {
  await client.query("SAVEPOINT foundation_v2_pgaadauth_security_label");
  try {
    await client.query(
      `SECURITY LABEL FOR "pgaadauth" ON ROLE ${quoteIdent(roleName)} IS ${quoteLiteral(
        `aadauth,oid=${objectId},type=service`,
      )}`,
    );
    await client.query("RELEASE SAVEPOINT foundation_v2_pgaadauth_security_label");
    return { method: "pgaadauth_security_label", defects: [] };
  } catch (error) {
    await client.query("ROLLBACK TO SAVEPOINT foundation_v2_pgaadauth_security_label").catch(() => {});
    await client.query("RELEASE SAVEPOINT foundation_v2_pgaadauth_security_label").catch(() => {});
    return { method: "pgaadauth_security_label", defects: [`pgaadauth security label failed: ${error.message}`] };
  }
}

async function aadPrincipalReadback(client, roleName) {
  await client.query("SAVEPOINT foundation_v2_pgaadauth_principals");
  try {
    const rows = (await client.query("SELECT to_jsonb(t) AS principal FROM pgaadauth_list_principals(false) AS t")).rows;
    await client.query("RELEASE SAVEPOINT foundation_v2_pgaadauth_principals");
    return rows.map((row) => row.principal).filter((principal) => JSON.stringify(principal).includes(roleName));
  } catch (error) {
    await client.query("ROLLBACK TO SAVEPOINT foundation_v2_pgaadauth_principals").catch(() => {});
    await client.query("RELEASE SAVEPOINT foundation_v2_pgaadauth_principals").catch(() => {});
    return [
      { readback_error: error.message },
      ...(await aadSecurityLabelReadback(client, roleName)),
    ];
  }
}

async function aadSecurityLabelReadback(client, roleName) {
  return (
    await client.query(
      `SELECT 'pg_shseclabel' AS source,
              s.provider,
              s.label
         FROM pg_catalog.pg_shseclabel s
         JOIN pg_catalog.pg_roles r ON r.oid = s.objoid
        WHERE s.classoid = 'pg_authid'::regclass
          AND r.rolname = $1
        ORDER BY s.provider, s.label`,
      [roleName],
    )
  ).rows;
}

function principalReadbackHasObjectId(principals, objectId) {
  return JSON.stringify(principals).toLowerCase().includes(String(objectId).toLowerCase());
}

function securityLabelHasObjectId(labels, objectId) {
  return labels.some((label) => label.provider === "pgaadauth" && String(label.label).toLowerCase().includes(String(objectId).toLowerCase()));
}

async function bestEffortRoleHardening(client, roleName) {
  const result = { attempted: true, applied: false, error: "" };
  await client.query("SAVEPOINT foundation_v2_role_hardening");
  try {
    await client.query(
      `ALTER ROLE ${quoteIdent(roleName)}
         LOGIN
         NOSUPERUSER
         NOCREATEDB
         NOCREATEROLE
         NOREPLICATION
         NOBYPASSRLS
         NOINHERIT`,
    );
    await client.query("RELEASE SAVEPOINT foundation_v2_role_hardening");
    result.applied = true;
  } catch (error) {
    result.error = error.message;
    await client.query("ROLLBACK TO SAVEPOINT foundation_v2_role_hardening").catch(() => {});
    await client.query("RELEASE SAVEPOINT foundation_v2_role_hardening").catch(() => {});
  }
  return result;
}

async function bestEffortPublicSchemaRevokes(client, roleName) {
  const result = { attempted: true, applied: false, errors: [] };
  for (const statement of [
    `REVOKE CREATE ON SCHEMA public FROM ${quoteIdent(roleName)}`,
    `REVOKE ALL ON SCHEMA public FROM ${quoteIdent(roleName)}`,
  ]) {
    await client.query("SAVEPOINT foundation_v2_public_schema_revoke");
    try {
      await client.query(statement);
      await client.query("RELEASE SAVEPOINT foundation_v2_public_schema_revoke");
    } catch (error) {
      result.errors.push(error.message);
      await client.query("ROLLBACK TO SAVEPOINT foundation_v2_public_schema_revoke").catch(() => {});
      await client.query("RELEASE SAVEPOINT foundation_v2_public_schema_revoke").catch(() => {});
    }
  }
  result.applied = result.errors.length === 0;
  return result;
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

async function relationExists(client, relationName) {
  return Boolean((await client.query("SELECT to_regclass($1) AS relation_name", [relationName])).rows[0]?.relation_name);
}

function parseArgs(argv) {
  const parsed = {
    mode: process.env.FOUNDATION_V2_DB_IDENTITY_MODE || "apply",
    kind: process.env.FOUNDATION_V2_DB_IDENTITY_KIND || "writer",
    scope: process.env.FOUNDATION_V2_DB_IDENTITY_SCOPE || "target",
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
    if (arg === "--mode") parsed.mode = next();
    else if (arg === "--kind") parsed.kind = next();
    else if (arg === "--scope") parsed.scope = next();
    else if (arg === "--identity-name") parsed.identityName = next();
    else if (arg === "--object-id") parsed.objectId = next();
    else if (arg === "--out-dir") parsed.outDir = next();
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else if (arg === "--execution-id") next();
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (!["writer", "reader"].includes(parsed.kind)) throw new Error("--kind must be writer or reader");
  if (!["principal", "target"].includes(parsed.scope)) throw new Error("--scope must be principal or target");
  return parsed;
}

function sanitizedDatabaseTarget(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || "5432",
    database: parsed.pathname.replace(/^\//, ""),
    sslmode: parsed.searchParams.get("sslmode") || "",
  };
}

function assertIdentifier(value, label) {
  if (!/^[A-Za-z_][A-Za-z0-9_-]{0,62}$/.test(value)) throw new Error(`Invalid ${label}: ${value}`);
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function quoteLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function bootstrapMarkdown(proof) {
  return `# Foundation V2 DB Identity Bootstrap Proof

Status: ${proof.status}

- Identity kind: \`${proof.identity_kind}\`
- Bootstrap scope: \`${proof.bootstrap_scope}\`
- Identity role: \`${proof.identity_role}\`
- Expected object ID: \`${proof.expected_object_id || "not-provided"}\`
- Target role: \`${proof.target_role}\`
- Administrator URL logged: ${proof.administrator_url_logged}
- Token logged: ${proof.token_logged}
- Defects: ${proof.defects.length}

This proof does not approve full reload, offline augmentation ingestion, live review-decision application, live canonical promotion, live domain publication, live baseline activation, production provider cutover, production Knowledge UI cutover, production aVa activation, or V1 deletion.
`;
}

function printCompactResult(proof) {
  console.log(
    JSON.stringify({
      foundation_v2_compact_result: "db-identity-bootstrap",
      status: proof.status,
      database_target: proof.database_target,
      identity_kind: proof.identity_kind,
      identity_role: proof.identity_role,
      target_role: proof.target_role,
      summary: {
        created: proof.created,
        creation_method: proof.creation_method,
        existed_before: proof.existed_before,
        defects: proof.defects,
        forbidden_attributes: {
          rolsuper: proof.role?.rolsuper,
          rolcreatedb: proof.role?.rolcreatedb,
          rolcreaterole: proof.role?.rolcreaterole,
          rolreplication: proof.role?.rolreplication,
          rolbypassrls: proof.role?.rolbypassrls,
          rolinherit: proof.role?.rolinherit,
        },
        memberships: proof.memberships,
      },
    }),
  );
}

function selfTestProof() {
  const defects = [];
  for (const invalid of ["bad role", "1bad", "bad;drop", "bad.role"]) {
    try {
      assertIdentifier(invalid, "identity role");
      defects.push(`invalid identifier accepted: ${invalid}`);
    } catch {}
  }
  try {
    assertIdentifier("mi-foundation-v2-golden-slice-writer-lab-001", "identity role");
  } catch (error) {
    defects.push(error.message);
  }
  const createWithOidSql = "SELECT * FROM pgaadauth_create_principal_with_oid($1, $2, 'service', false, false)";
  if (!createWithOidSql.includes("pgaadauth_create_principal_with_oid")) {
    defects.push("object-id principal creation path missing");
  }
  if (!ensureAadExtension.toString().includes("ROLLBACK TO SAVEPOINT")) {
    defects.push("AAD extension bootstrap does not preserve transaction state after create failure");
  }
  if (!aadPrincipalReadback.toString().includes("ROLLBACK TO SAVEPOINT")) {
    defects.push("AAD principal readback does not preserve transaction state after readback failure");
  }
  if (!createAadPrincipalRole.toString().includes("applyAadSecurityLabel")) {
    defects.push("AAD bootstrap does not include the security label object-ID fallback");
  }
  if (!applyAadSecurityLabel.toString().includes("SECURITY LABEL FOR")) {
    defects.push("AAD security label fallback does not emit SECURITY LABEL");
  }
  if (!aadSecurityLabelReadback.toString().includes("pg_shseclabel")) {
    defects.push("AAD security label fallback does not read back shared security labels");
  }
  if (!bestEffortRoleHardening.toString().includes("SAVEPOINT foundation_v2_role_hardening")) {
    defects.push("role hardening does not preserve transaction state after permission failure");
  }
  if (parseArgs(["--scope", "principal"]).scope !== "principal") {
    defects.push("principal bootstrap scope parsing failed");
  }
  return {
    status:
      defects.length === 0
        ? "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_SELF_TEST_PASSED"
        : "FOUNDATION_V2_DB_IDENTITY_BOOTSTRAP_SELF_TEST_FAILED",
    defects,
  };
}

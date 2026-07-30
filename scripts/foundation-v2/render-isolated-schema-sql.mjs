#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  DATABASE_SCHEMA,
  FOUNDATION_V2_CONTEXT,
  IDENTITY_CONTROL_MIGRATION_NAME,
  MIGRATION_NAME,
  REPO_ROOT,
  WRITE_POLICY_MIGRATION_NAME,
  rewriteFoundationV2Sql,
  sha256,
  writeJson,
} from "./golden-slice-support.mjs";

const args = parseArgs(process.argv.slice(2));

await main(args).catch((error) => {
  console.error(JSON.stringify({ status: "FOUNDATION_V2_ISOLATED_SCHEMA_RENDER_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main(options) {
  const migrations = [MIGRATION_NAME, WRITE_POLICY_MIGRATION_NAME, IDENTITY_CONTROL_MIGRATION_NAME].map((name) => {
    const sourcePath = path.join(REPO_ROOT, "supabase/migrations", name);
    const sourceSql = fs.readFileSync(sourcePath, "utf8");
    const renderedSql = rewriteFoundationV2Sql(sourceSql);
    return {
      name,
      source_path: path.relative(REPO_ROOT, sourcePath),
      source_sha256: sha256(sourceSql),
      rendered_sha256: sha256(renderedSql),
      rendered_sql: renderedSql,
    };
  });

  const sql = [
    `-- Foundation V2 isolated schema render`,
    `-- Domain: ${FOUNDATION_V2_CONTEXT.domain}`,
    `-- Schema: ${DATABASE_SCHEMA}`,
    ...migrations.map((migration) => `\n-- BEGIN ${migration.name}\n${migration.rendered_sql}\n-- END ${migration.name}\n`),
  ].join("\n");

  fs.mkdirSync(options.outDir, { recursive: true });
  const sqlPath = path.join(options.outDir, `${DATABASE_SCHEMA}.sql`);
  fs.writeFileSync(sqlPath, sql.endsWith("\n") ? sql : `${sql}\n`);
  const manifest = {
    status: "FOUNDATION_V2_ISOLATED_SCHEMA_RENDERED",
    generated_at: new Date().toISOString(),
    context: FOUNDATION_V2_CONTEXT,
    sql_path: sqlPath,
    sql_sha256: sha256(sql),
    migrations: migrations.map(({ rendered_sql, ...migration }) => migration),
  };
  writeJson(path.join(options.outDir, `${DATABASE_SCHEMA}.manifest.json`), manifest);
  console.log(JSON.stringify(manifest, null, 2));
}

function parseArgs(argv) {
  const parsed = {
    outDir:
      process.env.FOUNDATION_V2_ISOLATED_SCHEMA_OUT_DIR ||
      path.join(REPO_ROOT, "reports/foundation-v2/isolated-schema-renders", DATABASE_SCHEMA),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--out-dir") parsed.outDir = path.resolve(process.cwd(), next());
    else throw new Error(`Unknown argument ${arg}`);
  }
  return parsed;
}

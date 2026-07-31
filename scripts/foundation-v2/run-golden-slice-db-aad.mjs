#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(`Usage: node scripts/foundation-v2/run-golden-slice-db-aad.mjs --target bootstrap|execute|verify|source-volume|normalize-candidates --mode <mode> [--emit-proof-bundle]

Required:
  FOUNDATION_V2_POSTGRES_AAD_CLIENT_ID
  FOUNDATION_V2_POSTGRES_AAD_USER
  FOUNDATION_V2_POSTGRES_HOST
  FOUNDATION_V2_POSTGRES_DATABASE
`);
  process.exit(0);
}

await main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "FOUNDATION_V2_AAD_DATABASE_URL_BINDING_FAILED",
        error: error.message,
      },
      null,
      2,
    ),
  );
  process.exit(1);
});

async function main() {
  const token = await managedIdentityPostgresToken(requiredEnv("FOUNDATION_V2_POSTGRES_AAD_CLIENT_ID"));
  const user = requiredEnv("FOUNDATION_V2_POSTGRES_AAD_USER");
  const host = requiredEnv("FOUNDATION_V2_POSTGRES_HOST");
  const database = requiredEnv("FOUNDATION_V2_POSTGRES_DATABASE");
  const port = process.env.FOUNDATION_V2_POSTGRES_PORT || "5432";
  process.env.ABARVA_AZURE_DATABASE_URL = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(token)}@${host}:${port}/${database}?sslmode=require`;
  process.env.DATABASE_URL = "";
  if (args.target === "migration") {
    runMigrationTarget(args.mode);
    return;
  }

  const thisFile = fileURLToPath(import.meta.url);
  const script =
    args.target === "verify"
      ? "verify-golden-slice-db.mjs"
      : args.target === "bootstrap"
        ? "bootstrap-db-identity.mjs"
        : args.target === "source-volume"
          ? "load-healthcare-source-volume-db.mjs"
          : args.target === "normalize-candidates"
            ? "normalize-healthcare-source-volume-db.mjs"
            : "execute-golden-slice-db.mjs";
  process.argv = [process.argv[0], path.join(path.dirname(thisFile), script), "--mode", args.mode];
  if (args.emitProofBundle) process.argv.push("--emit-proof-bundle");
  await import(`./${script}`);
}

function runMigrationTarget(mode) {
  const migrationArgs =
    mode === "dry" ? ["run", "foundation-v2:migrate:dry"] : mode === "apply" ? ["run", "foundation-v2:migrate:apply"] : null;
  if (!migrationArgs) throw new Error(`Unsupported migration mode ${mode}`);
  const result = spawnSync("npm", migrationArgs, {
    cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}

function parseArgs(argv) {
  const parsed = {
    target: process.env.FOUNDATION_V2_AAD_TARGET || "execute",
    mode: process.env.FOUNDATION_V2_AAD_MODE || "schema-readback",
    emitProofBundle:
      process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      process.env.FOUNDATION_V2_EMIT_PROOF_BUNDLE === "true",
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--target") parsed.target = next();
    else if (arg === "--mode") parsed.mode = next();
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else if (arg === "--no-emit-proof-bundle") parsed.emitProofBundle = false;
    else if (arg === "--help" || arg === "-h") parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!["bootstrap", "execute", "verify", "migration", "source-volume", "normalize-candidates"].includes(parsed.target)) {
    throw new Error(`Unsupported target ${parsed.target}`);
  }
  return parsed;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function managedIdentityPostgresToken(clientId) {
  const resource = encodeURIComponent("https://ossrdbms-aad.database.windows.net");
  if (process.env.IDENTITY_ENDPOINT && process.env.IDENTITY_HEADER) {
    const url = new URL(process.env.IDENTITY_ENDPOINT);
    url.searchParams.set("api-version", "2019-08-01");
    url.searchParams.set("resource", "https://ossrdbms-aad.database.windows.net");
    url.searchParams.set("client_id", clientId);
    const response = await fetch(url, { headers: { "X-IDENTITY-HEADER": process.env.IDENTITY_HEADER } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.access_token) {
      throw new Error(`container apps managed identity token request failed: ${response.status} ${JSON.stringify(body)}`);
    }
    return body.access_token;
  }

  const url = `http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=${resource}&client_id=${encodeURIComponent(clientId)}`;
  const response = await fetch(url, { headers: { Metadata: "true" } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    throw new Error(`managed identity token request failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

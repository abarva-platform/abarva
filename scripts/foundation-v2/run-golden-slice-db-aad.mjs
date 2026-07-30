#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(`Usage: node scripts/foundation-v2/run-golden-slice-db-aad.mjs --target bootstrap|execute|verify --mode <mode> [--emit-proof-bundle]

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

  const thisFile = fileURLToPath(import.meta.url);
  const script =
    args.target === "verify"
      ? "verify-golden-slice-db.mjs"
      : args.target === "bootstrap"
        ? "bootstrap-db-identity.mjs"
        : "execute-golden-slice-db.mjs";
  process.argv = [process.argv[0], path.join(path.dirname(thisFile), script), "--mode", args.mode];
  if (args.emitProofBundle) process.argv.push("--emit-proof-bundle");
  await import(`./${script}`);
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
  if (!["bootstrap", "execute", "verify"].includes(parsed.target)) throw new Error(`Unsupported target ${parsed.target}`);
  return parsed;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function managedIdentityPostgresToken(clientId) {
  const resource = encodeURIComponent("https://ossrdbms-aad.database.windows.net");
  const url = `http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=${resource}&client_id=${encodeURIComponent(clientId)}`;
  const response = await fetch(url, { headers: { Metadata: "true" } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    throw new Error(`managed identity token request failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

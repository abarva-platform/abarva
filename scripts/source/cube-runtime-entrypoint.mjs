import { spawn } from "node:child_process";

const DEFAULTS = {
  CUBEJS_DB_TYPE: "postgres",
  CUBEJS_DEV_MODE: "false",
  CUBEJS_SCHEMA_PATH: "model",
  CUBEJS_DB_SSL: "true",
  CUBEJS_PG_SQL_PORT: "15432",
  CUBEJS_SQL_USER: "cube",
  CUBEJS_DEFAULT_API_SCOPES: "meta,data,sql",
  CUBEJS_LOG_LEVEL: "warn",
};

function setDefault(name, value) {
  if (!process.env[name]) process.env[name] = value;
}

function parseDatabaseUrl() {
  const raw = process.env.DATABASE_URL || process.env.SOURCE_CUBE_DATABASE_URL;
  if (!raw) return;

  const url = new URL(raw);
  setDefault("CUBEJS_DB_TYPE", "postgres");
  setDefault("CUBEJS_DB_HOST", url.hostname);
  setDefault("CUBEJS_DB_PORT", url.port || "5432");
  setDefault("CUBEJS_DB_NAME", decodeURIComponent(url.pathname.replace(/^\//, "")));
  setDefault("CUBEJS_DB_USER", decodeURIComponent(url.username));
  setDefault("CUBEJS_DB_PASS", decodeURIComponent(url.password));

  const sslMode = url.searchParams.get("sslmode");
  if (sslMode && sslMode !== "disable") {
    process.env.CUBEJS_DB_SSL = "true";
  }
}

for (const [name, value] of Object.entries(DEFAULTS)) setDefault(name, value);
parseDatabaseUrl();

const missing = [
  "CUBEJS_API_SECRET",
  "CUBEJS_DB_HOST",
  "CUBEJS_DB_NAME",
  "CUBEJS_DB_USER",
  "CUBEJS_DB_PASS",
].filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Cube runtime is missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const child = spawn("/usr/local/bin/docker-entrypoint.sh", args.length > 0 ? args : ["cubejs", "server"], {
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

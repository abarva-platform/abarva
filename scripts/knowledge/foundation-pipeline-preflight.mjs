#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..", "..");

export const PREFLIGHT_SCHEMA_VERSION = "foundation-pipeline-preflight/v1";

const DEFAULTS = Object.freeze({
  tenant: "airline-demo-new",
  resourceGroup: "rg-abarva-airdn-lab-eus2-001",
  stageMap: "clients/airline-demo-new/18-phase2b3c-azure-lab-implementation/03-container-app-jobs/JOB_STAGE_MAP.csv",
  postgresHost: "pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com",
  postgresDatabase: "abarva_airline_demo_new_knowledge_lab",
});

function csvSplit(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

export function readCsvRecords(filePath) {
  const text = fs.readFileSync(filePath, "utf8").trim();
  if (!text) return [];
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  const headers = csvSplit(headerLine).map((header) => header.trim());
  return lines.map((line) => {
    const values = csvSplit(line);
    return Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()]));
  });
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    tenant: DEFAULTS.tenant,
    resourceGroup: DEFAULTS.resourceGroup,
    stageMap: DEFAULTS.stageMap,
    expectedImage: "",
    out: "",
    jobJsonDir: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
      i += 1;
      return value;
    };
    switch (token) {
      case "--tenant":
        args.tenant = next();
        break;
      case "--resource-group":
        args.resourceGroup = next();
        break;
      case "--stage-map":
        args.stageMap = next();
        break;
      case "--expected-image":
        args.expectedImage = next();
        break;
      case "--out":
        args.out = next();
        break;
      case "--job-json-dir":
        args.jobJsonDir = next();
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function absoluteRepoPath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(REPO_ROOT, inputPath);
}

function runAzJson(args) {
  const stdout = execFileSync("az", [...args, "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return JSON.parse(stdout);
}

function loadJob(row, options) {
  if (options.jobJsonDir) {
    const filePath = path.join(options.jobJsonDir, `${row.reserved_aca_job_name}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  return runAzJson(["containerapp", "job", "show", "--resource-group", options.resourceGroup, "--name", row.reserved_aca_job_name]);
}

function containerFor(job) {
  return job?.properties?.template?.containers?.[0] ?? {};
}

function configFor(job) {
  return job?.properties?.configuration ?? {};
}

function identityKeys(job) {
  return Object.keys(job?.identity?.userAssignedIdentities ?? {});
}

function envMap(container) {
  return Object.fromEntries((container.env ?? []).map((item) => [item.name, item.value ?? item.secretRef ?? ""]));
}

function argvText(container) {
  return [...(container.command ?? []), ...(container.args ?? [])].join(" ");
}

function containsCliArg(text, flag, expected) {
  const escapedFlag = flag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedExpected = expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escapedFlag}\\s+${escapedExpected}(?:\\s|$)`).test(text);
}

function check(condition, id, message, details = {}) {
  return { id, status: condition ? "pass" : "fail", message, details };
}

export function validateJob(row, job, options) {
  const checks = [];
  if (!job) {
    return {
      jobName: row.reserved_aca_job_name,
      processName: row.approved_process_name,
      stage: row.stage,
      status: "fail",
      checks: [check(false, "job_exists", "Container Apps Job exists")],
    };
  }

  const container = containerFor(job);
  const config = configFor(job);
  const env = envMap(container);
  const text = argvText(container);
  const identities = identityKeys(job);
  const image = container.image ?? "";

  checks.push(check(Boolean(job.name), "job_exists", "Container Apps Job exists"));
  checks.push(check(config.triggerType === "Manual", "manual_trigger", "Job trigger is Manual", { actual: config.triggerType ?? null }));
  checks.push(
    check(
      identities.some((identity) => identity.split("/").pop() === row.managed_identity),
      "managed_identity_bound",
      "Expected user-assigned managed identity is bound",
      { expected: row.managed_identity, actual: identities },
    ),
  );
  checks.push(check(/@sha256:[a-f0-9]{64}$/i.test(image), "digest_pinned_image", "Job image is digest-pinned", { image }));
  if (options.expectedImage) {
    checks.push(check(image === options.expectedImage, "expected_image", "Job image matches expected image", { expected: options.expectedImage, actual: image }));
  }
  checks.push(check(text.includes("scripts/knowledge/hcdn-job-runner.mjs"), "runner_entrypoint", "Job command uses the governed HCDN runner", { command: text }));
  checks.push(check(containsCliArg(text, "--tenant", options.tenant), "tenant_arg", "Job command binds the tenant", { expected: options.tenant, command: text }));
  checks.push(
    check(
      containsCliArg(text, "--process", row.approved_process_name) || env.ABARVA_HCDN_PROCESS === row.approved_process_name,
      "process_binding",
      "Job command or env binds the approved process",
      { expected: row.approved_process_name, command: text, env: env.ABARVA_HCDN_PROCESS ?? null },
    ),
  );
  checks.push(
    check(
      containsCliArg(text, "--stage", row.stage) || env.ABARVA_HCDN_STAGE === row.stage,
      "stage_binding",
      "Job command or standard env binds the approved stage",
      { expected: row.stage, command: text, env: env.ABARVA_HCDN_STAGE ?? null },
    ),
  );
  checks.push(check(env.PGHOST === DEFAULTS.postgresHost, "postgres_host", "Job targets the approved private Postgres host", { expected: DEFAULTS.postgresHost, actual: env.PGHOST ?? null }));
  checks.push(check(env.PGDATABASE === DEFAULTS.postgresDatabase, "postgres_database", "Job targets the approved Postgres database", { expected: DEFAULTS.postgresDatabase, actual: env.PGDATABASE ?? null }));
  checks.push(check(env.PGUSER === row.managed_identity, "postgres_user", "Job authenticates as the managed-identity database user", { expected: row.managed_identity, actual: env.PGUSER ?? null }));
  checks.push(check(env.ABARVA_POSTGRES_AAD_CLIENT_ID && env.MANAGED_IDENTITY_CLIENT_ID, "aad_token_env", "Job can acquire PostgreSQL AAD token using managed identity"));
  checks.push(check(!Object.hasOwn(env, "PGPASSWORD"), "no_pgpassword", "Job does not carry a static PostgreSQL password"));

  const failed = checks.filter((item) => item.status !== "pass");
  return {
    jobName: row.reserved_aca_job_name,
    processName: row.approved_process_name,
    stage: row.stage,
    managedIdentity: row.managed_identity,
    databaseRole: row.database_role,
    image,
    status: failed.length === 0 ? "pass" : "fail",
    checks,
  };
}

export function buildSummary({ rows, jobResults, options }) {
  const failedJobs = jobResults.filter((job) => job.status !== "pass");
  const failedChecks = jobResults.flatMap((job) => job.checks.filter((item) => item.status !== "pass").map((item) => ({ jobName: job.jobName, ...item })));
  return {
    schemaVersion: PREFLIGHT_SCHEMA_VERSION,
    checkedAt: new Date().toISOString(),
    tenantKey: options.tenant,
    resourceGroup: options.resourceGroup,
    stageMap: options.stageMap,
    expectedJobs: rows.length,
    passedJobs: jobResults.length - failedJobs.length,
    failedJobs: failedJobs.length,
    failedChecks: failedChecks.length,
    status: failedJobs.length === 0 ? "pass" : "fail",
    jobResults,
    failedCheckSummary: failedChecks,
  };
}

export async function runPreflight(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const stageMapPath = absoluteRepoPath(options.stageMap);
  const rows = readCsvRecords(stageMapPath);
  const jobResults = rows.map((row) => {
    let job = null;
    try {
      job = loadJob(row, options);
    } catch (error) {
      return {
        jobName: row.reserved_aca_job_name,
        processName: row.approved_process_name,
        stage: row.stage,
        status: "fail",
        checks: [check(false, "job_readable", "Container Apps Job can be read", { error: error.message })],
      };
    }
    return validateJob(row, job, options);
  });

  const summary = buildSummary({ rows, jobResults, options: { ...options, stageMap: path.relative(REPO_ROOT, stageMapPath) } });
  if (options.out) {
    fs.mkdirSync(path.dirname(options.out), { recursive: true });
    fs.writeFileSync(options.out, `${JSON.stringify(summary, null, 2)}\n`);
  }
  return summary;
}

if (process.argv[1] === __filename) {
  runPreflight()
    .then((summary) => {
      console.log(JSON.stringify(summary, null, 2));
      process.exitCode = summary.status === "pass" ? 0 : 1;
    })
    .catch((error) => {
      console.error(error?.stack ?? error);
      process.exitCode = 1;
    });
}

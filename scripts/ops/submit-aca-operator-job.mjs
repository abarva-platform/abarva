#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_RESOURCE_GROUP = "rg-abarva-controlplane-lab-eastus";
const DEFAULT_JOB = "job-abarva-private-operator-eus";
const DEFAULT_CONTAINER = "db-migrate";
const DEFAULT_IDLE_IMAGE =
  "acrabarvalab001.azurecr.io/abarva/web@sha256:918b6cbf298ebd5bd20782b15f7d1817111d94e438436d64f2ea64db543db8a9";
// The documented idle contract for the shared operator job. restoreIdle()
// writes these; verifyIdle() reads them back and fails loudly on any drift
// (e.g. a caller passing a --container name that doesn't exist on the job
// template, which silently orphans the template in a non-idle state).
const IDLE_COMMAND = "/bin/true";
const IDLE_CPU = "0.5";
const IDLE_MEMORY = "1Gi";
const IDLE_REPLICA_TIMEOUT = "1800";

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function usage() {
  return `Usage:
  node scripts/ops/submit-aca-operator-job.mjs --image <acr@sha256> --script <npm-script> [options]

Required:
  --image <image>          Digest-pinned image to run. Env: ACA_OPERATOR_IMAGE.
  --script <npm-script>    npm script to run inside the job. Env: ACA_OPERATOR_SCRIPT.

Options:
  --job <name>             ACA job name. Default: ${DEFAULT_JOB}
  --resource-group <name>  Resource group. Default: ${DEFAULT_RESOURCE_GROUP}
  --container <name>       Container name for logs/update. Default: ${DEFAULT_CONTAINER}
  --cpu <cores>            Start override CPU. Default: 2
  --memory <Gi>            Start override memory. Default: 4Gi
  --timeout <seconds>      Replica timeout on the job definition. Default: 7200
  --env KEY=VALUE          Env var override for this execution. Repeatable.
  --secret-env KEY=NAME    Secret reference override for this execution. Repeatable.
  --out-dir <path>         Local proof/log output folder.
  --poll-seconds <n>       Poll interval. Default: 15
  --idle-verify-wait-seconds <n>
                           If restore verification only fails because another
                           execution on this shared job is still running, wait
                           up to this many seconds before failing. Default: 0.
  --no-wait                Start and return without polling.
  --no-restore-idle        Do not restore the job command/image after submission.
  --idle-image <image>     Idle image used when restoring. Env: ACA_OPERATOR_IDLE_IMAGE.
  --plan-only              Build and write the intended az command args to plan.json without
                            calling az at all. Never authenticates, never touches Azure. Use
                            this to validate argument construction (e.g. in CI) for inputs
                            that would otherwise require real credentials.
  --self-test              Run parser/proof-extraction self-test without Azure.
  --help                   Show this help.

The wrapper refuses mutable images unless ALLOW_MUTABLE_ACA_IMAGE=true is set.
`;
}

function parseArgs(argv) {
  const parsed = {
    env: [],
    secretEnv: [],
    job: process.env.ACA_OPERATOR_JOB || DEFAULT_JOB,
    resourceGroup: process.env.RESOURCE_GROUP || process.env.ACA_OPERATOR_RESOURCE_GROUP || DEFAULT_RESOURCE_GROUP,
    container: process.env.ACA_OPERATOR_CONTAINER || DEFAULT_CONTAINER,
    image: process.env.ACA_OPERATOR_IMAGE || "",
    script: process.env.ACA_OPERATOR_SCRIPT || "",
    cpu: process.env.ACA_OPERATOR_CPU || "2",
    memory: process.env.ACA_OPERATOR_MEMORY || "4Gi",
    timeout: process.env.ACA_OPERATOR_TIMEOUT || "7200",
    pollSeconds: Number(process.env.ACA_OPERATOR_POLL_SECONDS || 15),
    idleVerifyWaitSeconds: Number(process.env.ACA_OPERATOR_IDLE_VERIFY_WAIT_SECONDS || 0),
    outDir: "",
    wait: true,
    restoreIdle: process.env.ACA_OPERATOR_RESTORE_IDLE !== "false",
    idleImage: process.env.ACA_OPERATOR_IDLE_IMAGE || DEFAULT_IDLE_IMAGE,
    planOnly: false,
    selfTest: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[i];
    };

    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--self-test") parsed.selfTest = true;
    else if (arg === "--plan-only") parsed.planOnly = true;
    else if (arg === "--no-wait") parsed.wait = false;
    else if (arg === "--no-restore-idle") parsed.restoreIdle = false;
    else if (arg === "--image") parsed.image = next();
    else if (arg === "--script") parsed.script = next();
    else if (arg === "--job") parsed.job = next();
    else if (arg === "--resource-group") parsed.resourceGroup = next();
    else if (arg === "--container") parsed.container = next();
    else if (arg === "--cpu") parsed.cpu = next();
    else if (arg === "--memory") parsed.memory = next();
    else if (arg === "--timeout") parsed.timeout = next();
    else if (arg === "--env") parsed.env.push(next());
    else if (arg === "--secret-env") {
      const value = next();
      const [key, secret] = splitKeyValue(value, "--secret-env");
      parsed.secretEnv.push(`${key}=secretref:${secret}`);
    } else if (arg === "--out-dir") parsed.outDir = next();
    else if (arg === "--poll-seconds") parsed.pollSeconds = Number(next());
    else if (arg === "--idle-verify-wait-seconds") parsed.idleVerifyWaitSeconds = Number(next());
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!parsed.outDir) {
    parsed.outDir = path.join(os.tmpdir(), `abarva-aca-operator-job-${stamp()}`);
  }
  return parsed;
}

function splitKeyValue(value, label) {
  const index = value.indexOf("=");
  if (index <= 0 || index === value.length - 1) {
    throw new Error(`${label} must be KEY=VALUE`);
  }
  return [value.slice(0, index), value.slice(index + 1)];
}

function assertDigestPinned(image) {
  if (!image) throw new Error("--image or ACA_OPERATOR_IMAGE is required");
  if (!image.includes("@sha256:") && process.env.ALLOW_MUTABLE_ACA_IMAGE !== "true") {
    throw new Error(`ACA operator image must be digest-pinned (@sha256:...). Received: ${image}`);
  }
}

function assertScript(script) {
  if (!script) throw new Error("--script or ACA_OPERATOR_SCRIPT is required");
  if (!/^[a-zA-Z0-9:_-]+$/.test(script)) {
    throw new Error(`Refusing suspicious npm script name: ${script}`);
  }
}

function runAz(args, options = {}) {
  const result = spawnSync("az", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  if (result.status !== 0) {
    throw new Error(`az ${redactArgs(args).join(" ")} failed (${result.status})\n${stderr || stdout}`);
  }
  return { stdout, stderr };
}

function redactArgs(args) {
  return args.map((arg) => {
    const [key] = String(arg).split("=", 1);
    return isSensitiveName(key) ? `${key}=<redacted>` : arg;
  });
}

function isSensitiveName(name) {
  return /(SECRET|TOKEN|KEY|PASSWORD|DATABASE_URL|CONNECTION|SAS|SIGNED|URL)/i.test(String(name));
}

function envArgs(options) {
  const values = [...options.env, ...options.secretEnv];
  for (const value of operatorMetadataEnv(options)) {
    const [key] = splitKeyValue(value, "--env");
    if (!values.some((existing) => existing.startsWith(`${key}=`))) {
      values.push(value);
    }
  }
  if (!values.some((value) => value.startsWith("NODE_OPTIONS="))) {
    values.push("NODE_OPTIONS=--conditions=react-server");
  }
  return values;
}

function sanitizedEnv(values) {
  return values.map((value) => {
    const [key, rest] = splitKeyValue(value, "--env");
    return isSensitiveName(key) ? `${key}=<redacted>` : `${key}=${rest}`;
  });
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function imageDigest(image) {
  const match = String(image).match(/@sha256:([0-9a-f]{64})$/i);
  return match ? `sha256:${match[1].toLowerCase()}` : null;
}

function currentGitCommit() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return result.status === 0 ? result.stdout.trim() || null : null;
}

function operatorMetadataEnv(options) {
  const values = [
    `ABARVA_OPERATOR_IMAGE=${options.image}`,
    `ABARVA_OPERATOR_IMAGE_DIGEST=${imageDigest(options.image) ?? ""}`,
  ];
  const commit = currentGitCommit();
  if (commit) values.push(`ABARVA_OPERATOR_BRANCH_COMMIT=${commit}`);
  return values;
}

function resolvePackageScript(scriptName) {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
    );
    return packageJson.scripts?.[scriptName] ?? null;
  } catch {
    return null;
  }
}

function migrationNamesFromScript(scriptCommand) {
  if (!scriptCommand || !scriptCommand.includes("run-migrations")) return [];
  return Array.from(
    new Set(scriptCommand.match(/\b\d{14}_[^\s"'`]+\.sql\b/g) ?? []),
  );
}

function databaseEvidence(options, effectiveEnv) {
  const secretRefs = options.secretEnv
    .map((value) => splitKeyValue(value, "--secret-env"))
    .map(([key, secretRef]) => ({
      key,
      secret_ref: secretRef.replace(/^secretref:/, ""),
    }));
  const keys = effectiveEnv
    .map((value) => splitKeyValue(value, "--env")[0])
    .filter((key) => /DATABASE_URL|AZURE_DATABASE_URL/i.test(key));
  return {
    env_keys: Array.from(new Set(keys)).sort(),
    secret_refs: secretRefs,
  };
}

function writeMigrationSeal(
  options,
  effectiveEnv,
  executionName,
  status,
  logText,
  finishedAt,
  outDir,
) {
  const scriptCommand = resolvePackageScript(options.script);
  const migrationNames = migrationNamesFromScript(scriptCommand);
  if (migrationNames.length === 0) return null;

  const mode = scriptCommand.includes("--dry")
    ? "dry-run"
    : scriptCommand.includes("--ci")
      ? "apply"
      : "unknown";
  const branchCommit =
    effectiveEnv
      .find((value) => value.startsWith("ABARVA_OPERATOR_BRANCH_COMMIT="))
      ?.split("=")
      .slice(1)
      .join("=") || null;
  const digest =
    effectiveEnv
      .find((value) => value.startsWith("ABARVA_OPERATOR_IMAGE_DIGEST="))
      ?.split("=")
      .slice(1)
      .join("=") || imageDigest(options.image);
  const migrations = migrationNames.map((migrationName) => {
    const filePath = path.join(
      process.cwd(),
      "supabase/migrations",
      migrationName,
    );
    const sql = fs.readFileSync(filePath, "utf8");
    return {
      migration_name: migrationName,
      migration_sha256: sha256(sql),
      branch_commit: branchCommit,
      operator_image_digest: digest,
      database: databaseEvidence(options, effectiveEnv),
      execution_id: executionName,
      applied_at: mode === "apply" && status === "Succeeded" ? finishedAt : null,
    };
  });
  const seal = {
    event: "private_operator_migration_seal",
    script: options.script,
    script_command: scriptCommand,
    mode,
    status,
    execution_id: executionName,
    operator_image: options.image,
    operator_image_digest: digest,
    branch_commit: branchCommit,
    log_sha256: sha256(logText || ""),
    migrations,
  };
  const sealPath = path.join(outDir, "06-migration-seal.json");
  writeJson(sealPath, seal);
  return { path: sealPath, migrationCount: migrations.length, mode };
}

function parseExecutionName(startJson) {
  const parsed = JSON.parse(startJson);
  return parsed.name || parsed.properties?.name || parsed.id?.split("/").pop();
}

function executionStatus(executionJson) {
  const parsed = JSON.parse(executionJson);
  return (
    parsed.properties?.status ||
    parsed.properties?.runningState ||
    parsed.properties?.provisioningState ||
    parsed.status ||
    "Unknown"
  );
}

export function terminalStatus(status) {
  // "Stopped" was missing here and caused a real false-positive in
  // verifyIdle()'s first live run: a two-day-old, genuinely-inactive
  // execution (confirmed via `az containerapp job execution show` — same
  // status, same startTime, no resource consumption) was misclassified as
  // "non-terminal" and blocked an otherwise-clean preflight run.
  return ["Succeeded", "Failed", "Canceled", "Cancelled", "Stopped"].includes(status);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function stripLogPrefix(line) {
  const match = line.match(/(?:stdout|stderr)\s+F\s+(.*)$/);
  return match ? match[1] : line;
}

function collectJsonObjects(logText) {
  const objects = [];
  let collecting = false;
  let buffer = [];
  let depth = 0;
  let inString = false;
  let escaped = false;

  const updateDepth = (value) => {
    for (const char of value) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (char === "{") depth += 1;
      else if (char === "}") depth -= 1;
    }
  };

  for (const rawLine of logText.split(/\r?\n/)) {
    const line = stripLogPrefix(rawLine).trim();
    if (!line) continue;
    if (!collecting && !line.startsWith("{")) continue;

    if (!collecting) {
      collecting = true;
      buffer = [];
      depth = 0;
      inString = false;
      escaped = false;
    }

    buffer.push(line);
    updateDepth(line);

    if (collecting && depth === 0) {
      const candidate = buffer.join("\n");
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === "object") objects.push(parsed);
      } catch {
        // Ignore non-JSON brace blocks in mixed application logs.
      }
      collecting = false;
      buffer = [];
    }
  }

  return objects;
}

function extractStructuredEvents(logText, outDir) {
  const events = collectJsonObjects(logText).filter(
    (event) =>
      typeof event.event === "string" ||
      typeof event.structured_event === "string",
  );
  if (!events.length) return null;
  const eventPath = path.join(outDir, "05-structured-events.json");
  writeJson(eventPath, events);
  return {
    extracted: true,
    extractionKind: "structured_events",
    proofBundleExtracted: false,
    structuredEventsExtracted: true,
    eventPath,
    eventCount: events.length,
    eventNames: events.map((event) => event.event ?? event.structured_event),
    events,
  };
}

function extractProofBundle(logText, outDir) {
  const markerPairs = [
    {
      begin: "__SEMANTIC2_PROOF_TGZ_BEGIN__",
      end: "__SEMANTIC2_PROOF_TGZ_END__",
      marker: "semantic2",
    },
    {
      begin: "__SOURCE_L4_CUBE_PROOF_TGZ_BEGIN__",
      end: "__SOURCE_L4_CUBE_PROOF_TGZ_END__",
      marker: "source_l4_cube",
    },
    {
      begin: "__ECL_SUBSTRATE_BASELINE_TGZ_BEGIN__",
      end: "__ECL_SUBSTRATE_BASELINE_TGZ_END__",
      marker: "ecl_substrate_baseline",
    },
  ];
  const lines = logText.split(/\r?\n/);
  const payload = [];
  let activeMarker = null;
  let collecting = false;
  for (const rawLine of lines) {
    const line = stripLogPrefix(rawLine).trim();
    if (!collecting) {
      const pair = markerPairs.find((candidate) => line === candidate.begin);
      if (pair) {
        activeMarker = pair;
        collecting = true;
        continue;
      }
    }
    if (collecting && activeMarker && line === activeMarker.end) break;
    if (collecting && line) payload.push(line);
  }
  if (!payload.length) {
    return extractStructuredEvents(logText, outDir) ?? { extracted: false, reason: "No proof bundle marker found in logs." };
  }

  const tarPath = path.join(outDir, "proof.tgz");
  fs.writeFileSync(tarPath, Buffer.from(payload.join(""), "base64"));
  const extractDir = path.join(outDir, "proof");
  fs.mkdirSync(extractDir, { recursive: true });
  const result = spawnSync("tar", ["-xzf", tarPath, "-C", extractDir], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    return { extracted: false, tarPath, reason: result.stderr || result.stdout || "tar extraction failed" };
  }
  return { extracted: true, tarPath, extractDir, marker: activeMarker?.marker ?? "unknown" };
}

function restoreIdle(options, outDir) {
  const args = [
    "containerapp",
    "job",
    "update",
    "--name",
    options.job,
    "--resource-group",
    options.resourceGroup,
    "--container-name",
    options.container,
    "--image",
    options.idleImage,
    "--command",
    IDLE_COMMAND,
    "--args",
    "",
    "--cpu",
    IDLE_CPU,
    "--memory",
    IDLE_MEMORY,
    "--replica-timeout",
    IDLE_REPLICA_TIMEOUT,
    "--output",
    "json",
  ];
  const result = runAz(args);
  fs.writeFileSync(path.join(outDir, "99-restore-idle.json"), result.stdout);
  return { restored: true, idleImage: options.idleImage };
}

// Fixed expectations for the manual-trigger shape of this job. Unlike
// image/command/args/cpu/memory/replicaTimeout (which restoreIdle()
// actively writes), nothing in this wrapper sets these — they're asserted
// as a golden constant because a change here would mean the job's
// fundamental invocation shape (single ad-hoc execution, not a
// parallel/batch job) was altered by something outside this wrapper.
const IDLE_PARALLELISM = "1";
const IDLE_REPLICA_COMPLETION_COUNT = "1";

function fetchJobShow(options, outDir, label) {
  const show = runAz([
    "containerapp",
    "job",
    "show",
    "--name",
    options.job,
    "--resource-group",
    options.resourceGroup,
    "--output",
    "json",
  ]);
  fs.writeFileSync(path.join(outDir, label), show.stdout);
  return JSON.parse(show.stdout);
}

// A snapshot of everything this wrapper never intentionally changes
// (env vars, secret references, managed identity) taken before any
// mutation. verifyIdle() diffs the post-run state against this rather than
// a hardcoded expectation — those fields are legitimate for operators to
// evolve over time (e.g. adding a new secret to the job), so the safe check
// is "didn't change during this run," not "matches a value baked into this
// script."
function captureBaseline(options, outDir) {
  const parsed = fetchJobShow(options, outDir, "00b-baseline-job-show.json");
  return snapshotDriftFields(parsed, options);
}

function snapshotDriftFields(parsed, options) {
  const containers = parsed.properties?.template?.containers ?? [];
  const target = containers.find((c) => c.name === options.container);
  const envNames = (target?.env ?? [])
    .map((e) => `${e.name}${e.secretRef ? `:secretref:${e.secretRef}` : ""}`)
    .sort();
  const identity = parsed.identity ?? { type: "None" };
  return {
    envNames,
    identityType: identity.type ?? "None",
    userAssignedIdentityIds: Object.keys(identity.userAssignedIdentities ?? {}).sort(),
  };
}

// Reads the job template back (not the execution — the persistent resource
// that future job starts inherit) and asserts every idle field matches what
// restoreIdle() just wrote, plus the full "golden idle state": trigger
// shape (parallelism / replica completion count), no non-terminal execution
// left running or queued, and no drift in env vars / secret references /
// managed identity relative to the pre-run baseline. This exists because of
// a real incident: an execution-scoped --container-name override that
// didn't match any real template container name failed silently as far as
// the job resource was concerned, and a --no-restore-idle test run left
// replicaTimeout drifted from the documented idle value with nothing to
// catch it. This check — the full version, not just the fields restoreIdle()
// itself writes — is the catch. "Never trust cleanup; always verify it."
function verifyIdle(options, outDir, baseline, ownExecutionName) {
  const parsed = fetchJobShow(options, outDir, "99b-verify-idle.json");
  const cfg = parsed.properties?.configuration ?? {};
  const containers = parsed.properties?.template?.containers ?? [];
  const target = containers.find((c) => c.name === options.container);

  const problems = [];
  if (!target) {
    problems.push(`container "${options.container}" not found on the job template`);
  } else {
    if (target.image !== options.idleImage) {
      problems.push(`image is "${target.image}", expected "${options.idleImage}"`);
    }
    const command = (target.command || []).join(" ");
    if (command !== IDLE_COMMAND) {
      problems.push(`command is "${command}", expected "${IDLE_COMMAND}"`);
    }
    const args = (target.args || []).filter((value) => value !== "");
    if (args.length > 0) {
      problems.push(`args are ${JSON.stringify(target.args)}, expected empty`);
    }
    const cpu = String(target.resources?.cpu ?? "");
    if (cpu !== IDLE_CPU) {
      problems.push(`cpu is "${cpu}", expected "${IDLE_CPU}"`);
    }
    const memory = target.resources?.memory ?? "";
    if (memory !== IDLE_MEMORY) {
      problems.push(`memory is "${memory}", expected "${IDLE_MEMORY}"`);
    }
  }
  const replicaTimeout = String(cfg.replicaTimeout ?? "");
  if (replicaTimeout !== IDLE_REPLICA_TIMEOUT) {
    problems.push(`replicaTimeout is "${replicaTimeout}", expected "${IDLE_REPLICA_TIMEOUT}"`);
  }
  const parallelism = String(cfg.manualTriggerConfig?.parallelism ?? "");
  if (parallelism !== IDLE_PARALLELISM) {
    problems.push(`parallelism is "${parallelism}", expected "${IDLE_PARALLELISM}"`);
  }
  const replicaCompletionCount = String(cfg.manualTriggerConfig?.replicaCompletionCount ?? "");
  if (replicaCompletionCount !== IDLE_REPLICA_COMPLETION_COUNT) {
    problems.push(
      `replicaCompletionCount is "${replicaCompletionCount}", expected "${IDLE_REPLICA_COMPLETION_COUNT}"`,
    );
  }

  if (baseline) {
    const current = snapshotDriftFields(parsed, options);
    if (JSON.stringify(current.envNames) !== JSON.stringify(baseline.envNames)) {
      problems.push(
        `env/secret references changed during this run: before=${JSON.stringify(baseline.envNames)} after=${JSON.stringify(current.envNames)}`,
      );
    }
    if (current.identityType !== baseline.identityType) {
      problems.push(`identity type changed: before="${baseline.identityType}" after="${current.identityType}"`);
    }
    if (JSON.stringify(current.userAssignedIdentityIds) !== JSON.stringify(baseline.userAssignedIdentityIds)) {
      problems.push(
        `user-assigned identities changed: before=${JSON.stringify(baseline.userAssignedIdentityIds)} after=${JSON.stringify(current.userAssignedIdentityIds)}`,
      );
    }
  }

  const executionList = runAz([
    "containerapp",
    "job",
    "execution",
    "list",
    "--name",
    options.job,
    "--resource-group",
    options.resourceGroup,
    "--output",
    "json",
  ]);
  fs.writeFileSync(path.join(outDir, "99d-execution-list.json"), executionList.stdout);
  const executions = JSON.parse(executionList.stdout);
  const nonTerminal = executions.filter((execution) => {
    if (execution.name === ownExecutionName) return false; // this run's own execution — checked via `status` separately.
    return !terminalStatus(execution.properties?.status);
  });
  if (nonTerminal.length > 0) {
    problems.push(
      `non-terminal execution(s) left running or queued: ${nonTerminal.map((e) => `${e.name} (${e.properties?.status})`).join(", ")}`,
    );
  }

  const result = { idleVerified: problems.length === 0, problems };
  writeJson(path.join(outDir, "99c-idle-verification.json"), result);
  if (problems.length > 0) {
    throw new Error(`Job did not return to the documented idle state after restore:\n${problems.join("\n")}`);
  }
  return result;
}

function verifyIdleWithRetry(options, outDir, baseline, ownExecutionName) {
  const waitSeconds = Number(options.idleVerifyWaitSeconds || 0);
  const pollSeconds = Math.max(1, Number(options.pollSeconds || 15));
  const deadline = Date.now() + waitSeconds * 1000;
  const attempts = [];

  while (true) {
    try {
      const result = verifyIdle(options, outDir, baseline, ownExecutionName);
      attempts.push({
        at: new Date().toISOString(),
        idleVerified: true,
        problems: [],
      });
      writeJson(path.join(outDir, "99e-idle-verification-wait-log.json"), attempts);
      return result;
    } catch (error) {
      let verification = null;
      try {
        verification = JSON.parse(fs.readFileSync(path.join(outDir, "99c-idle-verification.json"), "utf8"));
      } catch {
        verification = { idleVerified: false, problems: [error.message] };
      }
      const problems = verification.problems ?? [error.message];
      attempts.push({
        at: new Date().toISOString(),
        idleVerified: false,
        problems,
      });
      writeJson(path.join(outDir, "99e-idle-verification-wait-log.json"), attempts);

      const onlyOtherExecutionsPending =
        problems.length > 0 &&
        problems.every((problem) => String(problem).startsWith("non-terminal execution(s) left running or queued:"));
      if (!onlyOtherExecutionsPending || waitSeconds <= 0 || Date.now() >= deadline) {
        throw error;
      }

      const remainingMs = Math.max(0, deadline - Date.now());
      sleep(Math.min(pollSeconds * 1000, remainingMs));
    }
  }
}

function buildTimeoutUpdateArgs(options) {
  return [
    "containerapp",
    "job",
    "update",
    "--name",
    options.job,
    "--resource-group",
    options.resourceGroup,
    "--replica-timeout",
    options.timeout,
    "--output",
    "json",
  ];
}

function buildStartArgs(options, effectiveEnv) {
  return [
    "containerapp",
    "job",
    "start",
    "--name",
    options.job,
    "--resource-group",
    options.resourceGroup,
    "--image",
    options.image,
    "--container-name",
    options.container,
    "--command",
    "npm",
    "--args",
    "run",
    options.script,
    "--cpu",
    options.cpu,
    "--memory",
    options.memory,
    "--env-vars",
    ...effectiveEnv,
    "--output",
    "json",
  ];
}

// Builds the exact command sequence a real run would issue and writes it to
// plan.json, without calling az at all. No authentication, no network call,
// no Azure state read or mutated — safe to run in CI on every PR to catch
// argument-construction bugs (like a --container-name that doesn't match
// any real container on the job template) before they ever reach Azure.
function planOnly(options) {
  fs.mkdirSync(options.outDir, { recursive: true });
  const effectiveEnv = envArgs(options);
  const plan = {
    job: options.job,
    resourceGroup: options.resourceGroup,
    container: options.container,
    image: options.image,
    script: options.script,
    pollSeconds: options.pollSeconds,
    idleVerifyWaitSeconds: options.idleVerifyWaitSeconds,
    env: sanitizedEnv(effectiveEnv),
    commands: {
      timeoutUpdate: redactArgs(buildTimeoutUpdateArgs(options)),
      start: redactArgs(buildStartArgs(options, effectiveEnv)),
      restoreIdle: options.restoreIdle
        ? redactArgs([
            "containerapp",
            "job",
            "update",
            "--name",
            options.job,
            "--resource-group",
            options.resourceGroup,
            "--container-name",
            options.container,
            "--image",
            options.idleImage,
            "--command",
            IDLE_COMMAND,
            "--args",
            "",
            "--cpu",
            IDLE_CPU,
            "--memory",
            IDLE_MEMORY,
            "--replica-timeout",
            IDLE_REPLICA_TIMEOUT,
            "--output",
            "json",
          ])
        : null,
    },
  };
  writeJson(path.join(options.outDir, "plan.json"), plan);
  console.log(`plan-only: wrote ${path.join(options.outDir, "plan.json")}`);
  return plan;
}

function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aca-operator-self-test-"));
  const payloadDir = path.join(dir, "payload-root");
  fs.mkdirSync(payloadDir, { recursive: true });
  fs.writeFileSync(path.join(payloadDir, "proof.txt"), "ok\n");
  const tarPath = path.join(dir, "payload.tgz");
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", dir, "payload-root"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (tar.status !== 0) throw new Error(tar.stderr || "tar self-test failed");
  const encoded = fs.readFileSync(tarPath).toString("base64");
  const logText = [
    "2026-01-01 stdout F __SEMANTIC2_PROOF_TGZ_BEGIN__",
    `2026-01-01 stdout F ${encoded}`,
    "2026-01-01 stdout F __SEMANTIC2_PROOF_TGZ_END__",
  ].join("\n");
  const result = extractProofBundle(logText, dir);
  if (!result.extracted) throw new Error(`proof extraction self-test failed: ${result.reason}`);
  const sourceMarkerDir = fs.mkdtempSync(path.join(os.tmpdir(), "aca-operator-source-l4-proof-self-test-"));
  const sourceMarkerLogText = [
    "2026-01-01 stdout F __SOURCE_L4_CUBE_PROOF_TGZ_BEGIN__",
    `2026-01-01 stdout F ${encoded}`,
    "2026-01-01 stdout F __SOURCE_L4_CUBE_PROOF_TGZ_END__",
  ].join("\n");
  const sourceMarkerResult = extractProofBundle(sourceMarkerLogText, sourceMarkerDir);
  if (!sourceMarkerResult.extracted || sourceMarkerResult.marker !== "source_l4_cube") {
    throw new Error(`Source L4 proof extraction self-test failed: ${JSON.stringify(sourceMarkerResult)}`);
  }
  const baselineMarkerDir = fs.mkdtempSync(path.join(os.tmpdir(), "aca-operator-ecl-baseline-proof-self-test-"));
  const baselineMarkerLogText = [
    "2026-01-01 stdout F __ECL_SUBSTRATE_BASELINE_TGZ_BEGIN__",
    `2026-01-01 stdout F ${encoded}`,
    "2026-01-01 stdout F __ECL_SUBSTRATE_BASELINE_TGZ_END__",
  ].join("\n");
  const baselineMarkerResult = extractProofBundle(baselineMarkerLogText, baselineMarkerDir);
  if (!baselineMarkerResult.extracted || baselineMarkerResult.marker !== "ecl_substrate_baseline") {
    throw new Error(`ECL baseline proof extraction self-test failed: ${JSON.stringify(baselineMarkerResult)}`);
  }
  const eventDir = fs.mkdtempSync(path.join(os.tmpdir(), "aca-operator-json-event-self-test-"));
  const eventLogText = [
    '2026-01-01 stdout F {',
    '2026-01-01 stdout F   "structured_event": "skyharbor_v3_current_state_loaded",',
    '2026-01-01 stdout F   "reconciliation": {',
    '2026-01-01 stdout F     "passed": true',
    '2026-01-01 stdout F   }',
    '2026-01-01 stdout F }',
  ].join("\n");
  const eventResult = extractProofBundle(eventLogText, eventDir);
  if (!eventResult.extracted || !eventResult.structuredEventsExtracted || eventResult.eventCount !== 1) {
    throw new Error(`structured event extraction self-test failed: ${JSON.stringify(eventResult)}`);
  }
  assertDigestPinned("repo.azurecr.io/app@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  assertScript("semantic2:l3-dossiers:self-test");
  console.log(`self-test passed: ${dir}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  if (options.selfTest) {
    selfTest();
    return;
  }

  assertDigestPinned(options.image);
  assertDigestPinned(options.idleImage);
  assertScript(options.script);
  if (!Number.isFinite(options.pollSeconds) || options.pollSeconds <= 0) {
    throw new Error("--poll-seconds must be a positive number");
  }
  if (!Number.isFinite(options.idleVerifyWaitSeconds) || options.idleVerifyWaitSeconds < 0) {
    throw new Error("--idle-verify-wait-seconds must be a non-negative number");
  }

  if (options.planOnly) {
    planOnly(options);
    return;
  }

  fs.mkdirSync(options.outDir, { recursive: true });
  // Captured before any mutation so verifyIdle() can assert env/secret/
  // identity fields are unchanged by this run, without hardcoding what they
  // should be (see captureBaseline()'s doc comment).
  const baseline = options.restoreIdle ? captureBaseline(options, options.outDir) : null;
  const effectiveEnv = envArgs(options);
  const request = {
    job: options.job,
    resourceGroup: options.resourceGroup,
    container: options.container,
    image: options.image,
    imageSha256: sha256(options.image),
    script: options.script,
    cpu: options.cpu,
    memory: options.memory,
    timeout: options.timeout,
    wait: options.wait,
    restoreIdle: options.restoreIdle,
    idleImage: options.idleImage,
    idleVerifyWaitSeconds: options.idleVerifyWaitSeconds,
    env: sanitizedEnv(effectiveEnv),
    startedAt: new Date().toISOString(),
  };
  writeJson(path.join(options.outDir, "00-request.json"), request);

  let executionName = null;
  let status = "NotStarted";
  let proof = { extracted: false, reason: "not attempted" };
  let migrationSeal = null;
  let logText = "";
  let restored = { restored: false };
  let failed = null;

  try {
    const update = runAz(buildTimeoutUpdateArgs(options));
    fs.writeFileSync(path.join(options.outDir, "01-timeout-update.json"), update.stdout);

    const start = runAz(buildStartArgs(options, effectiveEnv));
    fs.writeFileSync(path.join(options.outDir, "02-start.json"), start.stdout);
    executionName = parseExecutionName(start.stdout);
    if (!executionName) throw new Error("Could not parse execution name from az containerapp job start output");
    console.log(`Started ${options.job} execution ${executionName}`);

    if (options.wait) {
      const pollLog = [];
      do {
        sleep(options.pollSeconds * 1000);
        const show = runAz([
          "containerapp",
          "job",
          "execution",
          "show",
          "--name",
          options.job,
          "--resource-group",
          options.resourceGroup,
          "--job-execution-name",
          executionName,
          "--output",
          "json",
        ]);
        fs.writeFileSync(path.join(options.outDir, "03-execution-latest.json"), show.stdout);
        status = executionStatus(show.stdout);
        pollLog.push({ at: new Date().toISOString(), status });
        console.log(`Execution ${executionName}: ${status}`);
      } while (!terminalStatus(status));
      writeJson(path.join(options.outDir, "03-poll-log.json"), pollLog);
    }

    if (executionName) {
      const logs = runAz([
        "containerapp",
        "job",
        "logs",
        "show",
        "--name",
        options.job,
        "--resource-group",
        options.resourceGroup,
        "--execution",
        executionName,
        "--container",
        options.container,
        "--tail",
        "300",
        "--format",
        "text",
      ]);
      logText = logs.stdout;
      fs.writeFileSync(path.join(options.outDir, "04-logs.txt"), logText);
      proof = extractProofBundle(logText, options.outDir);
      writeJson(path.join(options.outDir, "05-proof-extraction.json"), proof);
    }
  } catch (error) {
    failed = error;
    fs.writeFileSync(path.join(options.outDir, "ERROR.txt"), `${error.stack || error.message}\n`);
  } finally {
    if (options.restoreIdle) {
      try {
        restored = restoreIdle(options, options.outDir);
        restored.idleVerification = verifyIdleWithRetry(options, options.outDir, baseline, executionName);
      } catch (error) {
        restored = { restored: restored.restored, error: error.message };
        if (!failed) failed = error;
      }
    }
    const finishedAt = new Date().toISOString();
    try {
      migrationSeal = writeMigrationSeal(
        options,
        effectiveEnv,
        executionName,
        status,
        logText,
        finishedAt,
        options.outDir,
      );
    } catch (error) {
      migrationSeal = {
        error: error instanceof Error ? error.message : String(error),
      };
      if (!failed) failed = error;
    }
    const summary = {
      ...request,
      finishedAt,
      executionName,
      status,
      proof,
      migrationSeal,
      restored,
      ok: !failed && (!options.wait || status === "Succeeded"),
      outputDir: options.outDir,
    };
    writeJson(path.join(options.outDir, "summary.json"), summary);
  }

  if (failed) throw failed;
  if (options.wait && status !== "Succeeded") {
    throw new Error(`ACA job execution ${executionName} ended with status ${status}`);
  }
}

// Only auto-run when invoked as a script — importing pure helpers (like
// terminalStatus) from a test file must not trigger main()'s network/Azure
// calls or its unconditional process.exit(1) on failure.
const invokedAsScript = (() => {
  if (!process.argv[1]) return false;
  try {
    return path.resolve(process.argv[1]).includes("submit-aca-operator-job");
  } catch {
    return false;
  }
})();

if (invokedAsScript) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}

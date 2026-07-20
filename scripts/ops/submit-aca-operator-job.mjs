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
  return /(SECRET|TOKEN|KEY|PASSWORD|DATABASE_URL|CONNECTION)/i.test(String(name));
}

function envArgs(options) {
  const values = [...options.env, ...options.secretEnv];
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

function terminalStatus(status) {
  return ["Succeeded", "Failed", "Canceled", "Cancelled"].includes(status);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function stripLogPrefix(line) {
  const match = line.match(/(?:stdout|stderr)\s+F\s+(.*)$/);
  return match ? match[1] : line;
}

function extractProofBundle(logText, outDir) {
  const begin = "__SEMANTIC2_PROOF_TGZ_BEGIN__";
  const end = "__SEMANTIC2_PROOF_TGZ_END__";
  const lines = logText.split(/\r?\n/);
  const payload = [];
  let collecting = false;
  for (const rawLine of lines) {
    const line = stripLogPrefix(rawLine).trim();
    if (line === begin) {
      collecting = true;
      continue;
    }
    if (line === end) break;
    if (collecting && line) payload.push(line);
  }
  if (!payload.length) return { extracted: false, reason: "No proof bundle marker found in logs." };

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
  return { extracted: true, tarPath, extractDir };
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

// Reads the job template back (not the execution — the persistent resource
// that future job starts inherit) and asserts every idle field matches what
// restoreIdle() just wrote. This exists because of a real incident: an
// execution-scoped --container-name override that didn't match any real
// template container name failed silently as far as the job resource was
// concerned, and a --no-restore-idle test run left replicaTimeout drifted
// from the documented idle value with nothing to catch it. This check is
// the catch.
function verifyIdle(options, outDir) {
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
  fs.writeFileSync(path.join(outDir, "99b-verify-idle.json"), show.stdout);
  const parsed = JSON.parse(show.stdout);
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

  const result = { idleVerified: problems.length === 0, problems };
  writeJson(path.join(outDir, "99c-idle-verification.json"), result);
  if (problems.length > 0) {
    throw new Error(`Job did not return to the documented idle state after restore:\n${problems.join("\n")}`);
  }
  return result;
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

  if (options.planOnly) {
    planOnly(options);
    return;
  }

  fs.mkdirSync(options.outDir, { recursive: true });
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
    env: sanitizedEnv(effectiveEnv),
    startedAt: new Date().toISOString(),
  };
  writeJson(path.join(options.outDir, "00-request.json"), request);

  let executionName = null;
  let status = "NotStarted";
  let proof = { extracted: false, reason: "not attempted" };
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
      fs.writeFileSync(path.join(options.outDir, "04-logs.txt"), logs.stdout);
      proof = extractProofBundle(logs.stdout, options.outDir);
      writeJson(path.join(options.outDir, "05-proof-extraction.json"), proof);
    }
  } catch (error) {
    failed = error;
    fs.writeFileSync(path.join(options.outDir, "ERROR.txt"), `${error.stack || error.message}\n`);
  } finally {
    if (options.restoreIdle) {
      try {
        restored = restoreIdle(options, options.outDir);
        restored.idleVerification = verifyIdle(options, options.outDir);
      } catch (error) {
        restored = { restored: restored.restored, error: error.message };
        if (!failed) failed = error;
      }
    }
    const summary = {
      ...request,
      finishedAt: new Date().toISOString(),
      executionName,
      status,
      proof,
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

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

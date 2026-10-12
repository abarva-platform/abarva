import crypto from "node:crypto";

const check = (value, message) => {
  if (!value) throw new Error(message);
};
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value !== null && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([k, v]) => [k, canonical(v)]),
        )
      : value;
export const safetyHash = (value) =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
export const bytesHash = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

export function azureLogPayload(line) {
  const marker = / (?:stdout|stderr) F /.exec(line);
  return marker ? line.slice(marker.index + marker[0].length) : line;
}

export function requireSyntheticTenant(registry, tenantKey) {
  check(
    Array.isArray(registry.activeTenants),
    "Deployed active registry required",
  );
  const matches = registry.activeTenants.filter(
    (t) => t.tenantKey === tenantKey,
  );
  check(
    matches.length === 1 &&
      Array.isArray(matches[0].packets) &&
      matches[0].packets.length > 0 &&
      matches[0].packets.every((p) => p.classification === "synthetic-demo"),
    "Every nonempty declared tenant packet must be synthetic-demo",
  );
  return {
    tenantKey,
    classification: "synthetic-demo",
    packetCount: matches[0].packets.length,
    tenantEntrySha256: safetyHash(matches[0]),
  };
}

export function deployedWorkerJobs(script) {
  const declarations = script.match(/^WORKER_JOB_NAMES=.*$/gm) ?? [];
  check(
    declarations.length === 1,
    "Single deployed worker-job declaration required",
  );
  const match =
    /^WORKER_JOB_NAMES="\$\{WORKER_JOB_NAMES:-([a-z0-9-]+(?: [a-z0-9-]+)*)\}"$/.exec(
      declarations[0],
    );
  check(match, "Unsupported deployed worker-job declaration");
  const names = match[1].split(" ");
  check(
    names.length > 0 &&
      names.length <= 10 &&
      new Set(names).size === names.length,
    "Distinct bounded required worker names",
  );
  return names;
}

const terminal = new Set(["Succeeded", "Failed", "Stopped", "Cancelled"]);
export function activeJobExecutions(executions) {
  check(Array.isArray(executions), "Actual execution list required");
  return executions.filter((e) => !terminal.has(e.properties?.status));
}

// Full values are compared by digest; audit output exposes no secret/env/arg values.
export function operatorBaseline(job) {
  check(
    job.properties?.template && job.properties?.configuration,
    "Full operator template/configuration required",
  );
  const secretNames = (job.properties.configuration.secrets ?? [])
    .map((s) => s.name)
    .sort();
  const configuration = {
    ...job.properties.configuration,
    secrets: (job.properties.configuration.secrets ?? [])
      .map((s) => {
        const metadata = { ...s };
        delete metadata.value;
        return metadata;
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  const template = job.properties.template;
  return {
    templateSha256: safetyHash(template),
    configurationSha256: safetyHash(configuration),
    identitySha256: safetyHash(job.identity ?? null),
    retryLimit: configuration.replicaRetryLimit,
    secretNames,
    containers: (template.containers ?? []).map((c) => ({
      name: c.name,
      image: c.image,
      commandSha256: safetyHash(c.command ?? null),
      argsSha256: safetyHash(c.args ?? null),
      resources: c.resources,
      env: (c.env ?? []).map((e) => ({
        name: e.name,
        secretRef: e.secretRef ?? null,
        valueSha256: e.value === undefined ? null : bytesHash(String(e.value)),
      })),
    })),
  };
}

export function requireIdleOperator(
  job,
  privateExecutions,
  migrationExecutions,
) {
  const containers = job.properties?.template?.containers;
  check(
    job.properties?.provisioningState === "Succeeded" &&
      job.properties?.configuration?.replicaRetryLimit === 0,
    "Succeeded operator with automatic retry disabled required",
  );
  check(
    containers?.length === 1 &&
      containers[0].name === "db-migrate" &&
      safetyHash(containers[0].command) === safetyHash(["/bin/true"]) &&
      safetyHash(containers[0].args) === safetyHash([""]),
    "Original idle command and arguments required",
  );
  check(
    activeJobExecutions(privateExecutions).length === 0 &&
      activeJobExecutions(migrationExecutions).length === 0,
    "Private and migration execution lanes must both be idle",
  );
  return operatorBaseline(job);
}

export function requireSoleNativeExecution(
  privateExecutions,
  migrationExecutions,
  runId,
  image,
  scriptSha256,
) {
  const active = activeJobExecutions(privateExecutions);
  check(
    active.length === 1 &&
      activeJobExecutions(migrationExecutions).length === 0,
    "Exact sole private execution and idle actual migration lane required",
  );
  const own = active[0];
  const containers = own.properties?.template?.containers;
  check(
    own.properties.status === "Running" &&
      containers?.length === 1 &&
      containers[0].image === image,
    "Exact running native operator image required",
  );
  const c = containers[0];
  const configs = (c.env ?? []).filter(
    (e) => e.name === "SOURCE_VISIBILITY_CONFIG",
  );
  check(
    configs.length === 1 &&
      JSON.parse(configs[0].value).runId === runId &&
      safetyHash(c.command) === safetyHash(["node"]) &&
      c.args?.length === 2 &&
      c.args[0] === "-e" &&
      bytesHash(c.args[1]) === scriptSha256,
    "Actual execution and reviewed Node-e bytes required",
  );
  return own.name;
}

export function requireRuntimeWitness(
  witness,
  expectedImage,
  expectedSha,
  workerNames,
) {
  check(
    witness.templateImage === expectedImage &&
      witness.revisionImage === expectedImage &&
      witness.healthState === "Healthy" &&
      witness.active === true &&
      witness.trafficCount === 1 &&
      witness.trafficWeight === 100 &&
      witness.revisionName?.endsWith(`--m${expectedSha.slice(0, 8)}`),
    "Exact digest-pinned healthy serving runtime required",
  );
  check(witness.health?.ok === true, "Live health.ok proof required");
  check(
    safetyHash(Object.keys(witness.workers ?? {}).sort()) ===
      safetyHash(workerNames.slice().sort()) &&
      Object.values(witness.workers).every((image) => image === expectedImage),
    "Every deployed required worker must match the approved digest",
  );
  return witness;
}

export async function collectOperatorCompletion(collectors, baselineBefore) {
  const observations = {};
  const failures = {};
  for (const [name, collect] of Object.entries(collectors)) {
    try {
      observations[name] = await collect();
    } catch (error) {
      failures[name] = { name: error.name, code: error.code ?? null };
    }
  }
  let baselineAfter = null;
  try {
    if (observations.job) baselineAfter = operatorBaseline(observations.job);
  } catch (error) {
    failures.baseline = { name: error.name, code: error.code ?? null };
  }
  const templateAndConfigurationUnchanged =
    baselineAfter !== null &&
    safetyHash(baselineAfter) === safetyHash(baselineBefore);
  const privateIdle =
    Array.isArray(observations.privateExecutions) &&
    activeJobExecutions(observations.privateExecutions).length === 0;
  const migrationIdle =
    Array.isArray(observations.migrationExecutions) &&
    activeJobExecutions(observations.migrationExecutions).length === 0;
  const executionNotStarted = observations.execution?.notStarted === true;
  const executionTerminal = executionNotStarted
    ? null
    : observations.execution !== undefined &&
      terminal.has(observations.execution.properties?.status);
  return {
    baselineBefore,
    baselineAfter,
    templateAndConfigurationUnchanged,
    privateIdle,
    migrationIdle,
    executionTerminal,
    executionNotStarted,
    executionStatus: observations.execution?.properties?.status ?? null,
    privateExecutionStates: Array.isArray(observations.privateExecutions)
      ? observations.privateExecutions.map((e) => ({
          name: e.name,
          status: e.properties?.status ?? null,
        }))
      : null,
    migrationExecutionStates: Array.isArray(observations.migrationExecutions)
      ? observations.migrationExecutions.map((e) => ({
          name: e.name,
          status: e.properties?.status ?? null,
        }))
      : null,
    failures,
    complete:
      Object.keys(failures).length === 0 &&
      templateAndConfigurationUnchanged &&
      privateIdle &&
      migrationIdle &&
      (executionNotStarted || executionTerminal),
  };
}

export async function withOperatorCompletion(
  action,
  collectors,
  baselineBefore,
  persist,
) {
  let result, failure;
  try {
    result = await action();
  } catch (error) {
    failure = error;
  } finally {
    try {
      const completion = await collectOperatorCompletion(
        collectors,
        baselineBefore,
      );
      await persist(completion);
      if (failure) failure.operatorCompletion = completion;
      else
        check(
          completion.complete,
          "Operator completion/baseline proof is incomplete",
        );
    } catch (error) {
      if (failure) failure.completionProofUnavailable = true;
      else failure = error;
    }
  }
  if (failure) throw failure;
  return result;
}

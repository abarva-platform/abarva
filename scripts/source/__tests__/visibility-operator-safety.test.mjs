import assert from "node:assert/strict";
import { test } from "node:test";
import {
  requireSyntheticTenant,
  deployedWorkerJobs,
  operatorBaseline,
  requireIdleOperator,
  collectOperatorCompletion,
  requireSoleNativeExecution,
  bytesHash,
  requireRuntimeWitness,
  withOperatorCompletion,
  azureLogPayload,
} from "../visibility-operator-safety.mjs";

const registry = (packets) => ({
  activeTenants: [{ tenantKey: "fixture", packets }],
});
test("nonempty all-synthetic registry passes", () =>
  assert.equal(
    requireSyntheticTenant(
      registry([{ classification: "synthetic-demo" }]),
      "fixture",
    ).packetCount,
    1,
  ));
for (const [name, packets] of [
  ["empty", []],
  [
    "mixed",
    [{ classification: "synthetic-demo" }, { classification: "real-client" }],
  ],
  ["missing classification", [{}]],
])
  test(`registry refuses ${name}`, () =>
    assert.throws(
      () => requireSyntheticTenant(registry(packets), "fixture"),
      /Every nonempty/,
    ));
test("registry refuses duplicate identity", () =>
  assert.throws(
    () =>
      requireSyntheticTenant(
        {
          activeTenants: [
            ...registry([{}]).activeTenants,
            ...registry([{}]).activeTenants,
          ],
        },
        "fixture",
      ),
    /Every nonempty/,
  ));
test("workers derive from the deployed declaration, including added workers", () =>
  assert.deepEqual(
    deployedWorkerJobs(
      'WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-worker-a worker-b worker-c}"',
    ),
    ["worker-a", "worker-b", "worker-c"],
  ));
for (const [name, script] of [
  ["missing", ""],
  ["dynamic", 'WORKER_JOB_NAMES="$(unsafe)"'],
  ["duplicate", 'WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-worker-a worker-a}"'],
])
  test(`workers refuse ${name} declaration`, () =>
    assert.throws(() => deployedWorkerJobs(script)));
const job = () => ({
  identity: {
    type: "UserAssigned",
    userAssignedIdentities: { "fixture-id": {} },
  },
  properties: {
    provisioningState: "Succeeded",
    configuration: {
      replicaRetryLimit: 0,
      replicaTimeout: 1800,
      secrets: [{ name: "db-secret", value: "DO-NOT-PRINT" }],
    },
    template: {
      containers: [
        {
          name: "db-migrate",
          image: "fixture-digest",
          command: ["/bin/true"],
          args: [""],
          resources: { cpu: 0.5, memory: "1Gi" },
          env: [
            { name: "DATABASE_URL", secretRef: "db-secret" },
            { name: "LITERAL", value: "DO-NOT-PRINT" },
          ],
        },
      ],
    },
  },
});
test("baseline preserves full comparison without exposing values", () => {
  const baseline = operatorBaseline(job());
  assert.ok(!JSON.stringify(baseline).includes("DO-NOT-PRINT"));
  assert.deepEqual(baseline.secretNames, ["db-secret"]);
  assert.equal(requireIdleOperator(job(), [], []).retryLimit, 0);
});
for (const [name, change] of [
  ["retry", (j) => (j.properties.configuration.replicaRetryLimit = 1)],
  [
    "arguments",
    (j) => (j.properties.template.containers[0].args = ["changed"]),
  ],
])
  test(`idle operator refuses changed ${name}`, () => {
    const j = job();
    change(j);
    assert.throws(() => requireIdleOperator(j, [], []));
  });
test("actual migration execution blocks dispatch even with idle private job", () =>
  assert.throws(
    () =>
      requireIdleOperator(job(), [], [{ properties: { status: "Running" } }]),
    /both be idle/,
  ));
test("unknown execution state is active, not idle", () =>
  assert.throws(
    () => requireIdleOperator(job(), [{ properties: {} }], []),
    /both be idle/,
  ));
const own = () => ({
  name: "fixture-execution",
  properties: {
    status: "Running",
    template: {
      containers: [
        {
          image: "fixture-digest",
          command: ["node"],
          args: ["-e", "fixture-code"],
          env: [
            {
              name: "SOURCE_VISIBILITY_CONFIG",
              value: JSON.stringify({ runId: "fixture-run" }),
            },
          ],
        },
      ],
    },
  },
});
test("native must be the sole active exact execution", () => {
  assert.equal(
    requireSoleNativeExecution(
      [own()],
      [],
      "fixture-run",
      "fixture-digest",
      bytesHash("fixture-code"),
    ),
    "fixture-execution",
  );
  assert.throws(
    () =>
      requireSoleNativeExecution(
        [own(), { properties: { status: "Pending" } }],
        [],
        "fixture-run",
        "fixture-digest",
        bytesHash("fixture-code"),
      ),
    /sole private/,
  );
});
test("failure seals survive stderr framing just like stdout proof markers", () => {
  assert.equal(
    azureLogPayload('2026-10-12 run stderr F {"event":"failure"}'),
    '{"event":"failure"}',
  );
  assert.equal(
    azureLogPayload("2026-10-12 run stdout F __PROOF__"),
    "__PROOF__",
  );
  assert.equal(azureLogPayload("unframed"), "unframed");
});
test("native refuses concurrent actual migration", () =>
  assert.throws(
    () =>
      requireSoleNativeExecution(
        [own()],
        [{ properties: { status: "Running" } }],
        "fixture-run",
        "fixture-digest",
        bytesHash("fixture-code"),
      ),
    /migration lane/,
  ));
const runtime = () => ({
  templateImage: "fixture-digest",
  revisionImage: "fixture-digest",
  healthState: "Healthy",
  active: true,
  trafficCount: 1,
  trafficWeight: 100,
  revisionName: "web--m12345678",
  health: { ok: true },
  workers: { "worker-a": "fixture-digest", "worker-b": "fixture-digest" },
});
test("runtime proves all declared workers and explicit live health", () =>
  assert.equal(
    requireRuntimeWitness(runtime(), "fixture-digest", "12345678full-sha", [
      "worker-a",
      "worker-b",
    ]).health.ok,
    true,
  ));
for (const [name, change] of [
  ["missing health", (r) => delete r.health],
  ["false health", (r) => (r.health.ok = false)],
  ["missing third declared worker", (r) => delete r.workers["worker-b"]],
  ["stale worker", (r) => (r.workers["worker-b"] = "stale")],
  ["extra traffic", (r) => (r.trafficCount = 2)],
])
  test(`runtime refuses ${name}`, () => {
    const r = runtime();
    change(r);
    assert.throws(() =>
      requireRuntimeWitness(r, "fixture-digest", "12345678full-sha", [
        "worker-a",
        "worker-b",
      ]),
    );
  });
test("finally collection attempts every observation despite execution/log-like failure", async () => {
  const attempted = [];
  const proof = await collectOperatorCompletion(
    {
      execution: async () => {
        attempted.push("execution");
        throw new Error("not captured");
      },
      job: async () => {
        attempted.push("job");
        return job();
      },
      privateExecutions: async () => {
        attempted.push("private");
        return [];
      },
      migrationExecutions: async () => {
        attempted.push("migration");
        return [];
      },
    },
    operatorBaseline(job()),
  );
  assert.deepEqual(attempted, ["execution", "job", "private", "migration"]);
  assert.equal(proof.templateAndConfigurationUnchanged, true);
  assert.equal(proof.complete, false);
});
test("actual finally wrapper persists terminal and baseline evidence after log/proof failure", async () => {
  let saved;
  await assert.rejects(
    withOperatorCompletion(
      async () => {
        throw new Error("log retrieval failed");
      },
      {
        job: async () => job(),
        privateExecutions: async () => [],
        migrationExecutions: async () => [],
        execution: async () => ({ properties: { status: "Failed" } }),
      },
      operatorBaseline(job()),
      async (p) => {
        saved = p;
      },
    ),
    (error) => {
      assert.equal(error.message, "log retrieval failed");
      assert.equal(error.operatorCompletion.complete, true);
      return true;
    },
  );
  assert.equal(saved.executionTerminal, true);
  assert.equal(saved.templateAndConfigurationUnchanged, true);
});
test("finally proof failure preserves the original failure instead of disguising it", async () => {
  await assert.rejects(
    withOperatorCompletion(
      async () => {
        throw new Error("original unknown outcome");
      },
      {
        job: async () => job(),
        privateExecutions: async () => [],
        migrationExecutions: async () => [],
        execution: async () => ({ properties: { status: "Failed" } }),
      },
      operatorBaseline(job()),
      async () => {
        throw new Error("sink unavailable");
      },
    ),
    (error) =>
      error.message === "original unknown outcome" &&
      error.completionProofUnavailable === true,
  );
});

test("no-start completion is explicit, not a fabricated terminal execution", async () => {
  let saved;
  await withOperatorCompletion(
    async () => {},
    {
      job: async () => job(),
      privateExecutions: async () => [],
      migrationExecutions: async () => [],
      execution: async () => ({ notStarted: true }),
    },
    operatorBaseline(job()),
    async (p) => {
      saved = p;
    },
  );
  assert.equal(saved.executionNotStarted, true);
  assert.equal(saved.executionTerminal, null);
  assert.equal(saved.executionStatus, null);
  assert.equal(saved.complete, true);
});
for (const [name, change] of [
  ["resources", (j) => (j.properties.template.containers[0].resources.cpu = 1)],
  [
    "environment",
    (j) => (j.properties.template.containers[0].env[1].value = "changed"),
  ],
  ["identity", (j) => (j.identity.type = "SystemAssigned")],
  ["configuration", (j) => (j.properties.configuration.replicaTimeout = 1900)],
  [
    "secret names",
    (j) => j.properties.configuration.secrets.push({ name: "extra" }),
  ],
])
  test(`finally detects changed ${name}`, async () => {
    const before = job(),
      after = job();
    change(after);
    const proof = await collectOperatorCompletion(
      {
        job: async () => after,
        privateExecutions: async () => [],
        migrationExecutions: async () => [],
        execution: async () => ({ properties: { status: "Succeeded" } }),
      },
      operatorBaseline(before),
    );
    assert.equal(proof.templateAndConfigurationUnchanged, false);
    assert.equal(proof.complete, false);
  });

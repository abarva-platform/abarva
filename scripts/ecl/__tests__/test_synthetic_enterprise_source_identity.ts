import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import {
  APPLICATION_DEPTH_TARGET,
  applicationDepth,
  applicationGrainOrigin,
  assertRegisteredIdentity,
  buildLoadRows,
  generatePack,
  loadJobName,
  loadProof,
  progressRecord,
  qualityGate,
  readGeneratedPack,
  sourceRows,
  type GeneratedPack,
} from "../load_synthetic_enterprise_v1";
import {
  readSourceVersions,
  resolveSourceVersion,
  sourceVersionRegistryPath,
  type SourceVersion,
} from "../synthetic_source_versions";
import { REPO_ROOT, fixturePack } from "./synthetic_enterprise_gate_fixtures";

const packs = new Map<string, GeneratedPack>();
let scratch: string;

before(async () => {
  scratch = await mkdtemp(path.join(tmpdir(), "ecl-source-versions-"));
  for (const version of readSourceVersions().keys()) {
    packs.set(version, await generatePack(version));
  }
});

after(async () => {
  for (const pack of packs.values()) {
    await rm(pack.dir, { recursive: true, force: true });
  }
  await rm(scratch, { recursive: true, force: true });
});

const registered = () => readSourceVersions();

async function registryFile(
  name: string,
  change: (versions: Record<string, Record<string, unknown>>) => void,
  schemaVersion: unknown = 1,
): Promise<string> {
  const versions = Object.fromEntries(
    [...registered()].map(([key, { key: _key, ...entry }]) => [key, entry]),
  ) as Record<string, Record<string, unknown>>;
  change(versions);
  const file = path.join(scratch, `${name}.json`);
  await writeFile(
    file,
    JSON.stringify({
      schema_version: schemaVersion,
      source_versions: versions,
    }),
  );
  return file;
}

test("the registry declares the identity each published version already has", () => {
  // These are the values persisted ids and the adapter output were built from.
  assert.deepEqual(
    [...registered().values()].map((version) => [
      version.key,
      version.id_namespace,
      version.adapter_contract_version,
      version.source_system,
      version.base_version,
    ]),
    [
      [
        "v1",
        "ecl-synthetic-enterprise-v1",
        "synthetic-enterprise-v1/layer2/v1",
        "synthetic_enterprise_v1_generator",
        null,
      ],
      [
        "v2",
        "ecl-synthetic-enterprise-v2",
        "synthetic-enterprise-v2/layer2/v1",
        "synthetic_enterprise_v2_generator",
        "v1",
      ],
    ],
  );
  for (const [version, pack] of packs) {
    assert.equal(pack.source.key, version);
    assert.equal(pack.manifest.dataset_id, pack.source.dataset_id);
    assert.equal(pack.manifest.assessment_id, pack.source.assessment_id);
    assert.equal(
      pack.normalized.adapter_contract_version,
      pack.source.adapter_contract_version,
    );
    assert.deepEqual(
      [
        ...new Set(
          pack.normalized.objects.map(
            (object) => (object.source as Record<string, string>).source_system,
          ),
        ),
      ],
      [pack.source.source_system],
    );
  }
});

test("a version the registry does not list is refused before anything is generated", async () => {
  assert.throws(
    () => resolveSourceVersion("v3"),
    /^Error: Unregistered synthetic source version: v3$/,
  );
  await assert.rejects(
    generatePack("v3"),
    /^Error: Unregistered synthetic source version: v3$/,
  );
  // A key that is only an inherited property of an object is not a version.
  assert.throws(
    () => resolveSourceVersion("constructor"),
    /Unregistered synthetic source version: constructor/,
  );
});

test("the Python and TypeScript readers resolve the same registry", () => {
  const python = spawnSync(
    "python3",
    [
      "-c",
      "import json, sys\nsys.path.insert(0, 'scripts/ecl')\nimport synthetic_source_versions as registry\nprint(json.dumps(registry.load_registry()))",
    ],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  assert.equal(python.status, 0, python.stderr);
  assert.deepEqual(
    JSON.parse(python.stdout),
    Object.fromEntries(
      [...registered()].map(([key, { key: _key, ...entry }]) => [key, entry]),
    ),
  );
  assert.equal(
    path.relative(REPO_ROOT, sourceVersionRegistryPath),
    "datasets/synthetic/source-versions.json",
  );
});

test("a registry that is malformed, ambiguous or circular is refused", async () => {
  const refused = async (
    name: string,
    change: (versions: Record<string, Record<string, unknown>>) => void,
    expected: RegExp,
    schemaVersion: unknown = 1,
  ) => {
    const file = await registryFile(name, change, schemaVersion);
    assert.throws(() => readSourceVersions(file), expected, name);
  };
  await refused("schema", () => undefined, /unknown schema/, 2);
  await refused(
    "empty",
    (versions) => {
      for (const key of Object.keys(versions)) delete versions[key];
    },
    /unknown schema/,
  );
  await refused(
    "missing-field",
    (versions) => {
      delete versions.v2.id_namespace;
    },
    /Source version v2 does not declare exactly the registered fields/,
  );
  await refused(
    "extra-field",
    (versions) => {
      versions.v1.note = "unreviewed";
    },
    /Source version v1 does not declare exactly the registered fields/,
  );
  await refused(
    "empty-identity",
    (versions) => {
      versions.v1.dataset_id = "";
    },
    /Source version v1 has an empty identity field/,
  );
  await refused(
    "grain-origin",
    (versions) => {
      versions.v2.application_grain_origin = { logical_service: "assumed" };
    },
    /Source version v2 declares an unknown application grain origin/,
  );
  for (const field of [
    "definition_path",
    "dataset_id",
    "assessment_id",
    "id_namespace",
  ]) {
    await refused(
      `shared-${field}`,
      (versions) => {
        versions.v2[field] = versions.v1[field];
      },
      new RegExp(`Two source versions declare the same ${field}`),
    );
  }
  await refused(
    "unknown-base",
    (versions) => {
      versions.v2.base_version = "v0";
    },
    /Source version v2 has an unregistered or circular base version/,
  );
  await refused(
    "circular-base",
    (versions) => {
      versions.v1.base_version = "v2";
    },
    /has an unregistered or circular base version/,
  );
  // The unchanged registry, written the same way, is accepted.
  assert.deepEqual(
    readSourceVersions(await registryFile("unchanged", () => undefined)),
    registered(),
  );
});

test("a pack that is not the registered dataset, assessment or adapter contract is refused", () => {
  const source = resolveSourceVersion("v2");
  const manifest = {
    dataset_id: source.dataset_id,
    assessment_id: source.assessment_id,
  };
  const normalized = {
    ...manifest,
    adapter_contract_version: source.adapter_contract_version,
  };
  assert.doesNotThrow(() =>
    assertRegisteredIdentity(source, manifest, normalized),
  );
  const other = resolveSourceVersion("v1");
  for (const [changedManifest, changedNormalized] of [
    [{ ...manifest, dataset_id: other.dataset_id }, normalized],
    [manifest, { ...normalized, dataset_id: other.dataset_id }],
    [{ ...manifest, assessment_id: other.assessment_id }, normalized],
    [manifest, { ...normalized, assessment_id: other.assessment_id }],
    [
      manifest,
      {
        ...normalized,
        adapter_contract_version: other.adapter_contract_version,
      },
    ],
  ] as const) {
    assert.throws(
      () =>
        assertRegisteredIdentity(source, changedManifest, changedNormalized),
      /^Error: Generated pack is not the registered source version v2$/,
    );
  }
});

test("a generated pack is read back only as the version it was requested as", async () => {
  // A complete, valid pack of one registered version, read as another.
  const dir = packs.get("v1")!.dir;
  assert.equal(
    (await readGeneratedPack(dir, resolveSourceVersion("v1"))).manifest
      .source_set_hash,
    packs.get("v1")!.manifest.source_set_hash,
  );
  await assert.rejects(
    readGeneratedPack(dir, resolveSourceVersion("v2")),
    /^Error: Generated pack is not the registered source version v2$/,
  );
});

test("a row id comes from the registered namespace, not from how the dataset is named", () => {
  const withGrain = (pack: GeneratedPack): GeneratedPack => ({
    ...pack,
    normalized: {
      ...pack.normalized,
      objects: pack.normalized.objects.map((object) => ({
        ...object,
        attributes: { application_grain: "fixture_product" },
      })),
    },
  });
  const ids = (pack: GeneratedPack) =>
    buildLoadRows(withGrain(pack), new Map(), new Map()).object.map(
      (row) => row.id,
    );
  const base = fixturePack();
  const renamed: GeneratedPack = {
    ...base,
    manifest: { ...base.manifest, dataset_id: "FIXTURE_ENTERPRISE_V2" },
  };
  const otherNamespace: GeneratedPack = {
    ...base,
    source: { ...base.source, id_namespace: "ecl-fixture-enterprise-other" },
  };
  assert.equal(ids(base).length, 3);
  assert.deepEqual(ids(renamed), ids(base));
  assert.notDeepEqual(ids(otherNamespace), ids(base));
});

test("application depth is counted by declared grain, and generated rows are not counted toward the target", () => {
  const depth = (version: string) => {
    const pack = packs.get(version)!;
    return applicationDepth(pack.normalized.objects, pack.source);
  };
  assert.equal(APPLICATION_DEPTH_TARGET, 300);
  assert.deepEqual(depth("v1"), {
    depth_target: 300,
    declared_applications: 24,
    generated_applications: 0,
    application_modules: 726,
    applications_by_grain: { logical_product: 24, governed_module: 726 },
    counted_toward_target: 24,
    serving_eligible: false,
    serving_blockers: ["logical_application_depth_below_300"],
  });
  // 344 application rows exist, but 320 of them were generated: the target is
  // reached only by counting those, and the blocker says so.
  assert.deepEqual(depth("v2"), {
    depth_target: 300,
    declared_applications: 24,
    generated_applications: 320,
    application_modules: 726,
    applications_by_grain: {
      logical_product: 24,
      governed_module: 726,
      logical_service: 320,
    },
    counted_toward_target: 24,
    serving_eligible: false,
    serving_blockers: [
      "logical_application_depth_met_only_with_generated_rows",
    ],
  });

  const source: Pick<SourceVersion, "key" | "application_grain_origin"> = {
    key: "fixture",
    application_grain_origin: {
      named: "declared_in_definition",
      multiplied: "generated_by_formula",
      part: "generated_by_formula",
    },
  };
  const rows = (count: number, grain: string, type = "application") =>
    Array.from({ length: count }, (_, index) => ({
      id: `${grain}-${index}`,
      type,
      attributes: { application_grain: grain },
    }));
  const blockers = (objects: ReturnType<typeof rows>) => {
    const result = applicationDepth(objects, source);
    assert.equal(result.serving_eligible, result.serving_blockers.length === 0);
    return result.serving_blockers;
  };
  assert.deepEqual(blockers(rows(300, "named")), []);
  assert.deepEqual(blockers(rows(299, "named")), [
    "logical_application_depth_below_300",
  ]);
  assert.deepEqual(
    blockers([...rows(299, "named"), ...rows(1, "multiplied")]),
    ["logical_application_depth_met_only_with_generated_rows"],
  );
  assert.deepEqual(blockers(rows(5000, "multiplied")), [
    "logical_application_depth_met_only_with_generated_rows",
  ]);
  // Modules are never applications, however many there are.
  assert.deepEqual(
    blockers([
      ...rows(299, "named"),
      ...rows(5000, "part", "application_module"),
    ]),
    ["logical_application_depth_below_300"],
  );
  // The grain field decides, never a name: a generated row called a product is
  // still generated, and other object types are not applications at all.
  const misnamed = applicationDepth(
    [
      {
        id: "Logical Product",
        type: "application",
        attributes: { application_grain: "multiplied" },
      },
      {
        id: "named-vendor",
        type: "vendor",
        attributes: { application_grain: "named" },
      },
    ],
    source,
  );
  assert.deepEqual(
    [misnamed.declared_applications, misnamed.generated_applications],
    [0, 1],
  );
  for (const attributes of [
    { application_grain: "unlisted" },
    {},
    { application_grain: "toString" },
  ]) {
    assert.throws(
      () =>
        applicationGrainOrigin(
          { id: "APP-X", type: "application", attributes } as Parameters<
            typeof applicationGrainOrigin
          >[0],
          source,
        ),
      /^Error: Application row APP-X carries a grain source version fixture does not register$/,
    );
  }
});

test("rows the generator multiplied out load as calculated, declared ones as source recorded", async () => {
  const expected: Record<string, Record<string, number>> = {
    v1: { calculated: 726, model_inferred: 1, source_recorded: 5032 },
    v2: { calculated: 1046, model_inferred: 1, source_recorded: 5032 },
  };
  for (const [version, pack] of packs) {
    const rows = buildLoadRows(pack, await sourceRows(pack), new Map());
    const byBasis: Record<string, number> = {};
    const basisOfGrain = new Map<string, Set<unknown>>();
    for (const row of rows.object) {
      const basis = String(row.basis);
      byBasis[basis] = (byBasis[basis] ?? 0) + 1;
      const grain = (row.attributes_json as Record<string, unknown>)
        .application_grain;
      if (typeof grain === "string") {
        basisOfGrain.set(
          grain,
          (basisOfGrain.get(grain) ?? new Set()).add(basis),
        );
      }
    }
    assert.deepEqual(byBasis, expected[version], version);
    assert.deepEqual(
      Object.fromEntries(
        [...basisOfGrain].map(([grain, bases]) => [grain, [...bases]]),
      ),
      Object.fromEntries(
        Object.entries(pack.source.application_grain_origin).map(
          ([grain, origin]) => [
            grain,
            [
              origin === "generated_by_formula"
                ? "calculated"
                : "source_recorded",
            ],
          ],
        ),
      ),
      version,
    );
    // A row is never recorded as reviewed by being loaded.
    assert.deepEqual(
      [
        ...new Set(
          [...rows.object, ...rows.relationship].map((row) => row.review_state),
        ),
      ],
      ["not_reviewed"],
    );
  }
});

test("a load names its own source version, and its quality gate reports the depth facts", () => {
  assert.deepEqual(
    [...packs.values()].map((pack) => loadJobName(pack.source)),
    ["ecl-synthetic-enterprise-v1-load", "ecl-synthetic-enterprise-v2-load"],
  );
  const pack = packs.get("v2")!;
  const counts = { applications: 344 };
  const committed = { counts, unresolved_relationships: ["REL-X"] };
  const depth = applicationDepth(pack.normalized.objects, pack.source);
  assert.deepEqual(qualityGate(pack, committed), {
    load_integrity_pass: true,
    serving_eligible: false,
    serving_blockers: [
      "logical_application_depth_met_only_with_generated_rows",
    ],
    application_depth: depth,
    counts,
    unresolved_relationships: ["REL-X"],
    serving_state: "not_promoted",
    client_attestation_state: "not_client_attested",
  });

  // What an executing run writes as its progress and its proof.
  const run = { runId: "run-fixture-1", startedAt: "2026-01-01T00:00:00.000Z" };
  const { updated_at: updatedAt, ...progress } = progressRecord(
    pack,
    run,
    "canonical_load",
    "running",
  );
  assert.equal(typeof updatedAt, "string");
  assert.deepEqual(progress, {
    job_name: "ecl-synthetic-enterprise-v2-load",
    run_id: "run-fixture-1",
    tenant_scope: pack.manifest.tenant_key,
    assessment_id: pack.manifest.assessment_id,
    input_source_version: pack.manifest.source_set_hash,
    stage: "canonical_load",
    status: "running",
    started_at: run.startedAt,
  });
  const { finished_at: finishedAt, ...proof } = loadProof(
    pack,
    committed,
    run,
    {
      ECL_SYNTHETIC_OPERATOR_IDENTITY: "fixture-operator",
      ECL_SYNTHETIC_BUILD_VERSION: "build-fixture-1",
      ECL_SYNTHETIC_INPUT_SOURCE_VERSION: pack.manifest.source_set_hash,
      ECL_SYNTHETIC_IDEMPOTENCY_KEY: "fixture-key",
      ECL_SYNTHETIC_IMAGE_DIGEST: "registry.invalid/web@sha256:fixture",
      ECL_SYNTHETIC_RELEASE_RECORD:
        "docs/releases/records/2026-01-01-fixture-load.md",
    },
    "https://synthetic.invalid/runs/run-fixture-1",
  );
  assert.equal(typeof finishedAt, "string");
  assert.deepEqual(proof, {
    counts,
    unresolved_relationships: ["REL-X"],
    serving_eligible: false,
    application_depth: depth,
    job_name: "ecl-synthetic-enterprise-v2-load",
    run_id: "run-fixture-1",
    operator_identity: "fixture-operator",
    build_version: "build-fixture-1",
    input_source_version: pack.manifest.source_set_hash,
    idempotency_key: "fixture-key",
    image_digest: "registry.invalid/web@sha256:fixture",
    release_record: "docs/releases/records/2026-01-01-fixture-load.md",
    retry_count: 0,
    timeout_seconds: 1800,
    status: "succeeded",
    started_at: run.startedAt,
    blob_proof_bundle:
      "https://synthetic.invalid/runs/run-fixture-1/proof.json",
    validation_output:
      "https://synthetic.invalid/runs/run-fixture-1/validation.json",
    quality_gate_output:
      "https://synthetic.invalid/runs/run-fixture-1/quality-gate.json",
    progress_output:
      "https://synthetic.invalid/runs/run-fixture-1/progress.json",
  });
  assert.equal(
    loadProof(packs.get("v1")!, committed, run, {}, "https://synthetic.invalid")
      .job_name,
    "ecl-synthetic-enterprise-v1-load",
  );
});

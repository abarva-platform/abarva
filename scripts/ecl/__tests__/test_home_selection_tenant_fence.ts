/**
 * The Home tenant fence, held against a real database.
 *
 * Home decides which assessment a tenant reads from a declaration row, and then reads that
 * assessment's projection rows. Each step carries its own tenant predicate, and the unit suites
 * stub the query, so removing either predicate left every one of them passing. This runs the real
 * reader against a disposable Postgres holding two tenants, with rows deliberately placed where a
 * missing predicate would pick them up, and asserts on what each tenant is actually served.
 *
 * It also holds the declaration to its manifest: a declared assessment is read as the projection
 * the declaration names, a declaration naming another tenant's manifest serves nothing, and every
 * path that serves something other than the selected projection reports itself.
 *
 * Run only against a database this test may fill and throw away:
 *
 *   ECL_ADMISSION_TEST_DATABASE_URL=postgresql://…@127.0.0.1:…/ecl_admission_test \
 *   NODE_OPTIONS=--conditions=react-server \
 *   npx tsx scripts/ecl/__tests__/test_home_selection_tenant_fence.ts
 */
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";
import { denseAssessmentIdForTenant } from "../../../src/lib/ecl/denseAssessment";
import {
  getHomeEclProjectionBundle,
  getHomeEclProjectionBundleOrReviewedSnapshotWithSource,
} from "../../../src/lib/home/preview/ecl-projection-bundle";
import {
  getHomeReviewBundle,
  HOME_PREVIEW_TENANT_KEYS,
  type HomePreviewTenantKey,
} from "../../../src/lib/home/preview/golden-snapshot";
import { selectHomeAssessment } from "../../../src/lib/home/preview/home-assessment-selection";
import {
  resetStructuredLogSinkForTests,
  setStructuredLogSinkForTests,
} from "../../../src/lib/observability/structured-logger";

const ROOT = process.cwd();
const TEST_PATH = "scripts/ecl/__tests__/test_home_selection_tenant_fence.ts";
const WORKFLOW_PATH = ".github/workflows/home-selection-tenant-fence.yml";
const SNAPSHOT_GLOB = "src/lib/home/preview/golden-snapshots/**";
const SURFACE = "home_enterprise_landscape";

/** Applied in order to an empty database. The workflow's trigger list is checked against these. */
const MIGRATIONS = [
  "supabase/migrations/20260831031000_ecl_substrate_baseline.sql",
  "supabase/migrations/20260901090000_home_serving_views_intake_families.sql",
  "supabase/migrations/20260902090000_home_serving_view_executive_interviews.sql",
  "supabase/migrations/20260902100000_home_serving_view_relationships.sql",
  "supabase/migrations/20261002013000_home_active_assessment.sql",
];

interface Projection {
  tenantKey: string;
  assessmentId: string;
  snapshotId: string;
  manifestId: string;
  projectionVersion: number;
  projectionHash: string;
  sourceHash: string;
  titles: string[];
}

interface Signal {
  level: string;
  event: string;
  metadata: {
    tenantKey: string;
    reason: string;
    served: string;
    assessmentId?: string;
    detail?: string;
  };
}

const signals: Signal[] = [];

function takeSignals(): Signal[] {
  return signals.splice(0, signals.length);
}

function hashOf(label: string): string {
  return createHash("sha256").update(label).digest("hex");
}

async function insertSnapshot(
  db: pg.Client,
  tenantKey: string,
  assessmentId: string,
): Promise<string> {
  const id = randomUUID();
  await db.query(
    `insert into ecl_context.snapshot
       (id, tenant_key, assessment_id, snapshot_key, snapshot_type, source_hash,
        context_hash, created_by_job, quality_state, proof_uri)
     values ($1,$2,$3,$4,'projection_source',$5,$6,'tenant-fence-test','passed',$7)`,
    [
      id,
      tenantKey,
      assessmentId,
      `tenant-fence-${id}`,
      hashOf(`source-${id}`),
      hashOf(`context-${id}`),
      "https://synthetic.invalid/tenant-fence",
    ],
  );
  return id;
}

/** One application row, and the projection entry it hangs from. */
async function insertRow(
  db: pg.Client,
  row: {
    tenantKey: string;
    assessmentId: string;
    snapshotId: string;
    manifestId: string;
    projectionVersion: number;
    title: string;
  },
): Promise<string> {
  const entryId = randomUUID();
  const rowId = randomUUID();
  const rowKey = `row-${rowId}`;
  await db.query(
    `insert into ecl_projection.projection_entry
       (id, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_version,
        surface_key, row_key, row_type, source_hash, refs_content_hash)
     values ($1,$2,$3,$4,$5,$6,$7,$8,'application',$9,$10)`,
    [
      entryId,
      row.tenantKey,
      row.assessmentId,
      row.snapshotId,
      row.manifestId,
      row.projectionVersion,
      SURFACE,
      rowKey,
      hashOf(`row-${rowId}`),
      hashOf(`refs-${rowId}`),
    ],
  );
  await db.query(
    `insert into ecl_projection.home_enterprise_landscape
       (id, tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id,
        projection_version, page_key, row_key, section_key, row_type, title, basis_summary,
        value_state, quality_state, admission_status, display_payload_json, source_hash)
     values ($1,$2,$3,$4,$5,$6,$7,'applications_systems',$8,'applications_systems','application',
             $9,'tenant-fence-test','known','passed','not_applicable',$10::jsonb,$11)`,
    [
      rowId,
      row.tenantKey,
      row.assessmentId,
      row.snapshotId,
      row.manifestId,
      entryId,
      row.projectionVersion,
      rowKey,
      row.title,
      JSON.stringify({ application_name: row.title }),
      hashOf(`row-${rowId}`),
    ],
  );
  return rowId;
}

/**
 * A snapshot, a manifest that records its own row count, and its rows. A Home projection unless
 * `projectionKey` says otherwise; `hashesOf` gives the manifest another projection's hashes, so
 * that it differs from that projection in what the caller varies and in nothing else.
 */
async function seedProjection(
  db: pg.Client,
  input: {
    tenantKey: string;
    assessmentId: string;
    titles: string[];
    projectionVersion?: number;
    projectionKey?: string;
    snapshotId?: string;
    hashesOf?: Projection;
  },
): Promise<Projection> {
  const projectionVersion = input.projectionVersion ?? 1;
  const snapshotId =
    input.snapshotId ??
    (await insertSnapshot(db, input.tenantKey, input.assessmentId));
  const manifestId = randomUUID();
  const projectionHash =
    input.hashesOf?.projectionHash ?? hashOf(`projection-${manifestId}`);
  const sourceHash =
    input.hashesOf?.sourceHash ?? hashOf(`source-set-${manifestId}`);
  await db.query(
    `insert into ecl_projection.projection_manifest
       (id, tenant_key, assessment_id, snapshot_id, projection_key, projection_version,
        rebuild_command, source_hash, projection_hash, row_count, quality_state,
        admission_status, proof_uri)
     values ($1,$2,$3,$4,$5,$6,'tenant-fence-test',$7,$8,$9,'passed','not_applicable',$10)`,
    [
      manifestId,
      input.tenantKey,
      input.assessmentId,
      snapshotId,
      input.projectionKey ?? SURFACE,
      projectionVersion,
      sourceHash,
      projectionHash,
      input.titles.length,
      `https://synthetic.invalid/tenant-fence/${manifestId}`,
    ],
  );
  for (const title of input.titles) {
    await insertRow(db, {
      tenantKey: input.tenantKey,
      assessmentId: input.assessmentId,
      snapshotId,
      manifestId,
      projectionVersion,
      title,
    });
  }
  return {
    tenantKey: input.tenantKey,
    assessmentId: input.assessmentId,
    snapshotId,
    manifestId,
    projectionVersion,
    projectionHash,
    sourceHash,
    titles: [...input.titles].sort(),
  };
}

/** An active declaration for `tenantKey` naming `projection`, which need not be that tenant's own. */
async function declare(
  db: pg.Client,
  tenantKey: string,
  projection: Projection,
): Promise<void> {
  await db.query(
    `insert into ecl_projection.home_active_assessment
       (tenant_key, assessment_id, projection_manifest_id, source_set_hash, projection_hash,
        projection_proof_uri, state)
     values ($1,$2,$3,$4,$5,$6,'active')`,
    [
      tenantKey,
      projection.assessmentId,
      projection.manifestId,
      projection.sourceHash,
      projection.projectionHash,
      `https://synthetic.invalid/tenant-fence/${projection.manifestId}`,
    ],
  );
}

/** The application names Home serves the tenant from the projection, refusing to fall back. */
async function servedApplications(
  tenantKey: HomePreviewTenantKey,
): Promise<string[]> {
  const bundle = await getHomeEclProjectionBundle(tenantKey);
  const applications = bundle.technologyEstate?.recordTypes.find(
    (recordType) => recordType.objectType === "application_system",
  );
  return (applications?.rows ?? []).map((row) => String(row.systemName)).sort();
}

/** What `/home` renders for the tenant: the projection, or the reviewed snapshot it falls back to. */
async function servedRecord(tenantKey: HomePreviewTenantKey) {
  const served =
    await getHomeEclProjectionBundleOrReviewedSnapshotWithSource(tenantKey);
  return {
    kind: served.recordSource.kind,
    isReviewedSnapshot: served.bundle === getHomeReviewBundle(tenantKey),
  };
}

async function expectReviewedSnapshotBecause(
  tenantKey: HomePreviewTenantKey,
  reason: string,
): Promise<void> {
  takeSignals();
  assert.deepEqual(await servedRecord(tenantKey), {
    kind: "reviewed_snapshot_fallback",
    isReviewedSnapshot: true,
  });
  const reported = takeSignals();
  assert.equal(reported.length, 1, `one signal for ${reason}`);
  assert.equal(reported[0].level, "error");
  assert.equal(reported[0].event, "home_projection_fault");
  assert.equal(reported[0].metadata.tenantKey, tenantKey);
  assert.equal(reported[0].metadata.reason, reason);
  assert.equal(reported[0].metadata.served, "reviewed_snapshot");
}

/** The repository files this run loaded, as paths the workflow's trigger list is written in. */
function loadedRepositoryModules(): string[] {
  return Object.keys(require.cache)
    .filter(
      (file) =>
        file.startsWith(ROOT + path.sep) &&
        !file.includes(`${path.sep}node_modules${path.sep}`),
    )
    .map((file) => path.relative(ROOT, file).split(path.sep).join("/"))
    .sort();
}

/**
 * This suite runs only when a pull request touches a path the workflow names, so a file the
 * reader loads and the workflow does not name can change the fence without the fence being run.
 * The list is therefore derived from what this run loaded and applied, and checked here.
 */
function assertWorkflowTriggersCover(required: string[]): void {
  const workflow = readFileSync(path.join(ROOT, WORKFLOW_PATH), "utf8");
  const block = workflow.slice(
    workflow.indexOf("    paths:"),
    workflow.indexOf("  workflow_dispatch:"),
  );
  const triggers = [...block.matchAll(/^\s+- "([^"]+)"$/gm)].map((m) => m[1]);
  assert.ok(triggers.length > 0, "the workflow declares trigger paths");
  const covered = (file: string) =>
    triggers.some((trigger) =>
      trigger.endsWith("/**")
        ? file.startsWith(trigger.slice(0, -2))
        : trigger === file,
    );
  const uncovered = required.filter((file) => !covered(file));
  assert.deepEqual(
    uncovered,
    [],
    `${WORKFLOW_PATH} does not trigger on files this suite loads or applies`,
  );
  const stale = triggers.filter(
    (trigger) =>
      !trigger.endsWith("/**") && !existsSync(path.join(ROOT, trigger)),
  );
  assert.deepEqual(stale, [], `${WORKFLOW_PATH} names paths that do not exist`);
}

async function main(): Promise<void> {
  const connectionString = process.env.ECL_ADMISSION_TEST_DATABASE_URL ?? "";
  const url = new URL(connectionString);
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.equal(url.pathname, "/ecl_admission_test");
  assert.ok(
    existsSync(path.join(ROOT, "package.json")),
    "run from the repository root",
  );

  // The reader takes its connection from the environment. Point it at the disposable database and
  // at nothing else, whatever the caller's shell held.
  for (const name of Object.keys(process.env)) {
    if (
      /DATABASE_URL/.test(name) &&
      name !== "ECL_ADMISSION_TEST_DATABASE_URL"
    ) {
      delete process.env[name];
    }
  }
  for (const name of [
    "ABARVA_ACTIVE_CLIENT_KEY",
    "ABARVA_CLIENT_KEY",
    "ABARVA_ACTIVE_CLIENT_ID",
    "ABARVA_CLIENT_ID",
  ]) {
    delete process.env[name];
  }
  process.env.DATABASE_URL = connectionString;

  const tenants: readonly HomePreviewTenantKey[] = HOME_PREVIEW_TENANT_KEYS;
  assert.ok(
    new Set(tenants).size >= 2,
    "the fence needs two tenants to tell apart",
  );
  const [first, second] = tenants;
  const firstDefault = denseAssessmentIdForTenant(first);
  const secondDefault = denseAssessmentIdForTenant(second);
  assert.notEqual(firstDefault, secondDefault);

  setStructuredLogSinkForTests({
    info: () => undefined,
    warn: () => undefined,
    error: (line: string) => {
      signals.push(JSON.parse(line) as Signal);
    },
  });

  const db = new pg.Client({ connectionString });
  await db.connect();
  try {
    const existing = await db.query<{ n: string }>(
      "select count(*) as n from information_schema.schemata where schema_name like 'ecl_%'",
    );
    assert.equal(
      Number(existing.rows[0].n),
      0,
      "requires a fresh disposable database",
    );
    for (const migration of MIGRATIONS) {
      await db.query(readFileSync(path.join(ROOT, migration), "utf8"));
    }

    // ── No declaration: each tenant reads its own default assessment, by tenant ───────────────
    const firstDefaults = await seedProjection(db, {
      tenantKey: first,
      assessmentId: firstDefault,
      titles: ["first default application 1", "first default application 2"],
    });
    const secondDefaults = await seedProjection(db, {
      tenantKey: second,
      assessmentId: secondDefault,
      titles: ["second default application 1"],
    });
    // Rows one tenant holds under the OTHER tenant's default assessment id. Only the tenant
    // predicate on the row read keeps them out of the other tenant's Home.
    await seedProjection(db, {
      tenantKey: first,
      assessmentId: secondDefault,
      titles: ["first tenant row under the second default assessment"],
    });
    await seedProjection(db, {
      tenantKey: second,
      assessmentId: firstDefault,
      titles: ["second tenant row under the first default assessment"],
    });

    assert.deepEqual(await selectHomeAssessment(first), {
      assessmentId: firstDefault,
      declared: null,
    });
    assert.deepEqual(await selectHomeAssessment(second), {
      assessmentId: secondDefault,
      declared: null,
    });
    assert.deepEqual(await servedApplications(first), firstDefaults.titles);
    assert.deepEqual(await servedApplications(second), secondDefaults.titles);
    assert.deepEqual(takeSignals(), [], "an undeclared read reports nothing");

    // ── One declaration: it selects for its own tenant and for no other ──────────────────────
    const firstDeclared = await seedProjection(db, {
      tenantKey: first,
      assessmentId: "assessment-fence-first",
      titles: ["first declared application 1", "first declared application 2"],
    });
    await declare(db, first, firstDeclared);
    assert.deepEqual(await selectHomeAssessment(first), {
      assessmentId: firstDeclared.assessmentId,
      declared: {
        manifestId: firstDeclared.manifestId,
        projectionVersion: 1,
        projectionHash: firstDeclared.projectionHash,
        sourceSetHash: firstDeclared.sourceHash,
        rowCount: firstDeclared.titles.length,
      },
    });
    assert.deepEqual(
      await selectHomeAssessment(second),
      { assessmentId: secondDefault, declared: null },
      "a declaration for one tenant selects nothing for another",
    );
    assert.deepEqual(await servedApplications(first), firstDeclared.titles);
    assert.deepEqual(await servedApplications(second), secondDefaults.titles);

    // ── Two declarations: each tenant gets its own assessment and its own rows ───────────────
    const secondDeclared = await seedProjection(db, {
      tenantKey: second,
      assessmentId: "assessment-fence-second",
      titles: [
        "second declared application 1",
        "second declared application 2",
        "second declared application 3",
      ],
    });
    await declare(db, second, secondDeclared);
    assert.equal(
      (await selectHomeAssessment(first)).declared?.manifestId,
      firstDeclared.manifestId,
    );
    assert.equal(
      (await selectHomeAssessment(second)).declared?.manifestId,
      secondDeclared.manifestId,
    );
    assert.deepEqual(await servedApplications(first), firstDeclared.titles);
    assert.deepEqual(await servedApplications(second), secondDeclared.titles);

    // ── Rows outside what was declared are not served ────────────────────────────────────────
    // Another manifest under the same tenant and assessment.
    const anotherManifest = await seedProjection(db, {
      tenantKey: first,
      assessmentId: firstDeclared.assessmentId,
      snapshotId: firstDeclared.snapshotId,
      projectionVersion: 2,
      titles: ["first row under another manifest"],
    });
    // That other manifest's id, under the declared projection version.
    await insertRow(db, {
      tenantKey: first,
      assessmentId: firstDeclared.assessmentId,
      snapshotId: firstDeclared.snapshotId,
      manifestId: anotherManifest.manifestId,
      projectionVersion: 1,
      title: "first row under another manifest and the declared version",
    });
    // The declared manifest's id, under another projection version.
    await insertRow(db, {
      tenantKey: first,
      assessmentId: firstDeclared.assessmentId,
      snapshotId: firstDeclared.snapshotId,
      manifestId: firstDeclared.manifestId,
      projectionVersion: 3,
      title: "first row under another projection version",
    });
    // Another tenant's row carrying the declared assessment, manifest and version. The schema
    // allows it, and only the tenant predicate on the row read keeps it out.
    await insertRow(db, {
      tenantKey: second,
      assessmentId: firstDeclared.assessmentId,
      snapshotId: await insertSnapshot(db, second, firstDeclared.assessmentId),
      manifestId: firstDeclared.manifestId,
      projectionVersion: 1,
      title: "second tenant row carrying the first declared manifest",
    });
    assert.deepEqual(await servedApplications(first), firstDeclared.titles);
    assert.deepEqual(await servedApplications(second), secondDeclared.titles);
    assert.deepEqual(
      takeSignals(),
      [],
      "rows outside the declaration are not read at all",
    );

    // What the schema leaves unbound: a row added under the declared manifest AND version is
    // still that manifest's row. It is served, and the count that no longer matches is reported.
    const added = await insertRow(db, {
      tenantKey: first,
      assessmentId: firstDeclared.assessmentId,
      snapshotId: firstDeclared.snapshotId,
      manifestId: firstDeclared.manifestId,
      projectionVersion: 1,
      title: "first row added under the declared manifest",
    });
    assert.deepEqual(
      await servedApplications(first),
      [
        ...firstDeclared.titles,
        "first row added under the declared manifest",
      ].sort(),
    );
    const drift = takeSignals();
    assert.equal(drift.length, 1);
    assert.equal(drift[0].metadata.tenantKey, first);
    assert.equal(drift[0].metadata.reason, "declared_row_count_differs");
    assert.equal(drift[0].metadata.served, "declared_projection");
    await db.query(
      "delete from ecl_projection.home_enterprise_landscape where id = $1",
      [added],
    );

    // ── A declaration naming another tenant's manifest serves nothing ─────────────────────────
    await db.query(
      `update ecl_projection.home_active_assessment
       set state = 'retired', retired_at = now() where tenant_key = $1`,
      [second],
    );
    assert.deepEqual(await selectHomeAssessment(second), {
      assessmentId: secondDefault,
      declared: null,
      retired: true,
    });
    assert.deepEqual(await servedRecord(second), {
      kind: "reviewed_snapshot",
      isReviewedSnapshot: true,
    });
    await assert.rejects(getHomeEclProjectionBundle(second), {
      reason: "retired_declaration",
    });
    assert.deepEqual(await servedApplications(first), firstDeclared.titles);
    assert.deepEqual(takeSignals(), [], "retirement is an intentional source selection");
    await declare(db, second, firstDeclared);
    await assert.rejects(selectHomeAssessment(second), {
      reason: "declaration_not_bound_to_manifest",
    });
    await assert.rejects(getHomeEclProjectionBundle(second), {
      reason: "declaration_not_bound_to_manifest",
    });
    await expectReviewedSnapshotBecause(
      second,
      "declaration_not_bound_to_manifest",
    );
    assert.deepEqual(await servedApplications(first), firstDeclared.titles);
    await db.query(
      `delete from ecl_projection.home_active_assessment
       where tenant_key = $1 and assessment_id = $2`,
      [second, firstDeclared.assessmentId],
    );

    await db.query(
      `update ecl_projection.home_active_assessment
       set state = 'active', retired_at = null where tenant_key = $1`,
      [second],
    );
    assert.deepEqual(await servedApplications(second), secondDeclared.titles);

    // ── A declaration is bound to its manifest on every fact the two share ───────────────────
    // Each stand-in carries the declared hashes and differs from the declared manifest in one
    // fact only, so each refusal is owed to one condition of the binding and to no other.
    const standIns = [
      // another tenant's manifest
      await seedProjection(db, {
        tenantKey: second,
        assessmentId: firstDeclared.assessmentId,
        titles: [],
        hashesOf: firstDeclared,
      }),
      // another assessment's manifest
      await seedProjection(db, {
        tenantKey: first,
        assessmentId: "assessment-fence-first-other",
        titles: [],
        hashesOf: firstDeclared,
      }),
      // a manifest that is not a Home projection
      await seedProjection(db, {
        tenantKey: first,
        assessmentId: firstDeclared.assessmentId,
        snapshotId: firstDeclared.snapshotId,
        projectionKey: "tower_command_center",
        titles: [],
        hashesOf: firstDeclared,
      }),
    ];
    const nameManifest = (manifestId: string) =>
      db.query(
        `update ecl_projection.home_active_assessment
         set projection_manifest_id = $2 where tenant_key = $1 and state = 'active'`,
        [first, manifestId],
      );
    for (const standIn of standIns) {
      await nameManifest(standIn.manifestId);
      await expectReviewedSnapshotBecause(
        first,
        "declaration_not_bound_to_manifest",
      );
    }
    await nameManifest(firstDeclared.manifestId);
    // And on the two hashes the declaration recorded: a manifest rewritten since the declaration
    // is not the manifest that was declared.
    const recorded = {
      projection_hash: firstDeclared.projectionHash,
      source_set_hash: firstDeclared.sourceHash,
    };
    for (const [column, declaredHash] of Object.entries(recorded)) {
      const record = (hash: string) =>
        db.query(
          `update ecl_projection.home_active_assessment
           set ${column} = $2 where tenant_key = $1 and state = 'active'`,
          [first, hash],
        );
      await record(hashOf(`a ${column} the manifest does not carry`));
      await expectReviewedSnapshotBecause(
        first,
        "declaration_not_bound_to_manifest",
      );
      await record(declaredHash);
    }
    assert.deepEqual(await servedApplications(first), firstDeclared.titles);

    // ── A declared manifest with no rows left is not served from anything else ───────────────
    const emptied = await db.query<{ id: string }>(
      `delete from ecl_projection.home_enterprise_landscape
       where tenant_key = $1 and projection_manifest_id = $2 and projection_version = 1
       returning id`,
      [second, secondDeclared.manifestId],
    );
    assert.equal(emptied.rows.length, secondDeclared.titles.length);
    await expectReviewedSnapshotBecause(
      second,
      "declared_assessment_has_no_rows",
    );

    // ── More than one active declaration ─────────────────────────────────────────────────────
    await db.query(
      "drop index ecl_projection.home_active_assessment_one_active",
    );
    await db.query(
      `insert into ecl_projection.home_active_assessment
         (tenant_key, assessment_id, projection_manifest_id, source_set_hash, projection_hash,
          projection_proof_uri, state)
       values ($1,'assessment-fence-first-again',$2,$3,$4,'https://synthetic.invalid/tenant-fence','active')`,
      [
        first,
        firstDeclared.manifestId,
        firstDeclared.sourceHash,
        firstDeclared.projectionHash,
      ],
    );
    await expectReviewedSnapshotBecause(first, "multiple_active_declarations");
    await db.query(
      `delete from ecl_projection.home_active_assessment
       where tenant_key = $1 and assessment_id = 'assessment-fence-first-again'`,
      [first],
    );
    assert.deepEqual(await servedApplications(first), firstDeclared.titles);

    // ── The selection query fails for a reason that is not a missing table ───────────────────
    await db.query(
      "alter table ecl_projection.home_active_assessment rename column state to state_renamed",
    );
    await expectReviewedSnapshotBecause(first, "selection_query_error");
    await db.query(
      "alter table ecl_projection.home_active_assessment rename column state_renamed to state",
    );

    // ── The declarations table does not exist ────────────────────────────────────────────────
    await db.query(
      "alter table ecl_projection.home_active_assessment rename to home_active_assessment_absent",
    );
    takeSignals();
    // Each tenant is served its OWN default assessment, and each read says the table is missing.
    for (const [tenantKey, defaults] of [
      [first, firstDefaults],
      [second, secondDefaults],
    ] as const) {
      assert.deepEqual(await servedApplications(tenantKey), defaults.titles);
      const missing = takeSignals();
      assert.equal(missing.length, 1);
      assert.equal(missing[0].metadata.tenantKey, tenantKey);
      assert.equal(missing[0].metadata.reason, "declaration_table_missing");
      assert.equal(missing[0].metadata.served, "default_assessment");
      assert.equal(missing[0].metadata.assessmentId, defaults.assessmentId);
    }

    const loaded = loadedRepositoryModules();
    if (process.env.HOME_FENCE_PRINT_LOADED === "1") {
      console.log(loaded.join("\n"));
    }
    assertWorkflowTriggersCover([
      TEST_PATH,
      WORKFLOW_PATH,
      ...MIGRATIONS,
      ...loaded,
      ...HOME_PREVIEW_TENANT_KEYS.map((tenantKey) =>
        SNAPSHOT_GLOB.replace("**", `${tenantKey}.json`),
      ),
    ]);
    console.log(JSON.stringify({ status: "passed", tenants: 2 }));
  } finally {
    resetStructuredLogSinkForTests();
    await db.end();
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);

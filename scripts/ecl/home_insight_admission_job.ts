import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_TENANT_KEYS } from "../../src/config/tenants/CANONICAL_TENANTS";
import { readQueryTransactionContext } from "../../src/lib/data-plane/azureTransactionReadContext";
import { getHomeEclProjectionBundle } from "../../src/lib/home/preview/ecl-projection-bundle";
import { homeRecordSourceToken } from "../../src/lib/home/preview/record-source-token";
import { isHomePreviewTenantKey } from "../../src/lib/home/preview/golden-snapshot";
import {
  HomeInsightReviewSchema,
  validateHomeInsightAdmission,
  type HomeInsightAdmission,
} from "../../src/lib/ecl/insights/home-admission";
import {
  buildIntegratedInsightPlan,
  insightHash,
} from "../../src/lib/ecl/insights/engine";
import { readInsightInput } from "../../src/lib/ecl/insights/read-input";
import { verifyInsightCandidates } from "../../src/lib/ecl/insights/store";
import { readDatasetManifests } from "./load_synthetic_enterprise_v1";
import {
  applySqlLimits,
  blobProofStore,
  commitTransaction,
  connectDatabase,
  jobLimits,
  jobRecord,
  jobRun,
  proofBytes,
  type JobClient,
  type ProofStore,
} from "./synthetic_enterprise_home_job";
import { emitInsightProofBundle } from "./integrated_insights_job";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
type Env = Record<string, string | undefined>;
export interface HomeAdmissionRuntime {
  connect: (url: string) => Promise<JobClient>;
  store: (env: Env) => Promise<ProofStore>;
  manifests: () => Promise<unknown[]>;
  recordExists: (file: string) => boolean;
  baseToken: (
    db: JobClient,
    tenantKey: string,
    assessmentId: string,
  ) => Promise<string>;
}
export const defaultHomeAdmissionRuntime: HomeAdmissionRuntime = {
  connect: connectDatabase,
  manifests: readDatasetManifests,
  recordExists: (file) => existsSync(path.join(root, file)),
  store: (env) =>
    blobProofStore(
      env.ECL_INSIGHT_STORAGE_ACCOUNT ?? "",
      env.AZURE_CLIENT_ID ?? "",
      jobLimits(env),
    ),
  baseToken: (db, tenantKey, assessmentId) =>
    readQueryTransactionContext.run(
      async (sql, params) => {
        const { rows } = await db.query(sql, params);
        return {
          rows,
          command: "SELECT",
          rowCount: rows.length,
          oid: 0,
          fields: [],
        };
      },
      async () => {
        if (!isHomePreviewTenantKey(tenantKey))
          throw new Error("No Home bundle for this canonical tenant");
        const bundle = await getHomeEclProjectionBundle(tenantKey);
        if (
          bundle.contextVersion?.assessmentId !== assessmentId ||
          bundle.contextVersion.coherence !== "coherent" ||
          !bundle.contextVersion.sourceSetHash
        ) {
          throw new Error(
            "The selected Home record is not a coherent live version of this assessment",
          );
        }
        return homeRecordSourceToken(tenantKey, {
          kind: "ecl_serving_projection",
          canonicalSnapshotHash: bundle.provenance.canonical_snapshot_hash,
          contextVersion: bundle.contextVersion,
        });
      },
    ),
};

export async function runHomeInsightAdmissionJob(
  env: Env,
  runtime = defaultHomeAdmissionRuntime,
) {
  const tenantKey = env.ECL_INSIGHT_TENANT_KEY ?? "";
  if (!(CANONICAL_TENANT_KEYS as readonly string[]).includes(tenantKey))
    throw new Error("Explicit canonical tenant required");
  const run = jobRun(
    {
      ...env,
      ECL_SYNTHETIC_RUN_ID: env.ECL_INSIGHT_RUN_ID,
      ECL_SYNTHETIC_OPERATOR_IDENTITY: env.ECL_INSIGHT_OPERATOR_IDENTITY,
      ECL_SYNTHETIC_BUILD_VERSION: env.ECL_INSIGHT_BUILD_VERSION,
      ECL_SYNTHETIC_RELEASE_RECORD: env.ECL_INSIGHT_RELEASE_RECORD,
      ECL_SYNTHETIC_IMAGE_DIGEST: env.ABARVA_OPERATOR_IMAGE,
    },
    "home-integrated-insight-admission",
  );
  if (!runtime.recordExists(run.releaseRecord))
    throw new Error("Admission release record missing from image");
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL required");
  const store = await runtime.store(env);
  const reviewUri = env.ECL_INSIGHT_REVIEW_PROOF_URI ?? "";
  if (
    !reviewUri ||
    !/^[a-f0-9]{64}$/.test(env.ECL_INSIGHT_REVIEW_PROOF_HASH ?? "")
  ) {
    throw new Error(
      "Private human review proof URI and exact SHA-256 required",
    );
  }
  const reviewBytes = await store.read(reviewUri);
  if (
    createHash("sha256").update(reviewBytes).digest("hex") !==
    env.ECL_INSIGHT_REVIEW_PROOF_HASH
  ) {
    throw new Error("Review proof bytes changed");
  }
  const review = HomeInsightReviewSchema.parse(
    JSON.parse(reviewBytes.toString("utf8")),
  );
  const limits = jobLimits(env);
  const db = await runtime.connect(env.DATABASE_URL);
  let transaction = false;
  let committed = false;
  try {
    await db.query("begin isolation level serializable");
    transaction = true;
    await applySqlLimits(db, limits);
    await db.query("select set_config('app.tenant_key',$1,true)", [tenantKey]);
    const assessmentId = env.ECL_INSIGHT_ASSESSMENT_ID ?? "";
    const plan = buildIntegratedInsightPlan(
      await readInsightInput(
        db,
        tenantKey,
        assessmentId,
        env.ECL_INSIGHT_AS_OF ?? "",
      ),
    );
    if (env.ECL_INSIGHT_EXPECTED_VERSION_HASH !== plan.loadVersionHash)
      throw new Error("Canonical input or planned version changed");
    const manifests = await runtime.manifests();
    const manifest = manifests.find(
      (item) =>
        (item as { dataset_id?: string })?.dataset_id ===
        env.ECL_INSIGHT_DATASET_ID,
    );
    if (
      manifests.filter(
        (item) =>
          (item as { dataset_id?: string })?.dataset_id ===
          env.ECL_INSIGHT_DATASET_ID,
      ).length !== 1
    ) {
      throw new Error("Exactly one committed dataset declaration required");
    }
    const admission: HomeInsightAdmission = { plan, review, manifest };
    const baseHomeRecordToken = await runtime.baseToken(
      db,
      tenantKey,
      assessmentId,
    );
    validateHomeInsightAdmission({
      admission,
      tenantKey,
      assessmentId,
      baseHomeRecordToken,
    });
    const release = await db.query<{
      first_run_id: string;
      result_hash: string;
      load_version_hash: string;
    }>(
      `select first_run_id, result_hash, load_version_hash from ecl_projection.enterprise_insight_release
       where tenant_key=$1 and assessment_id=$2 and id=$3`,
      [tenantKey, assessmentId, plan.releaseId],
    );
    if (
      release.rows.length !== 1 ||
      release.rows[0].result_hash !== plan.resultHash ||
      release.rows[0].load_version_hash !== plan.loadVersionHash
    )
      throw new Error("Exact candidate release has not been loaded");
    await verifyInsightCandidates(db, plan, release.rows[0].first_run_id);
    const admissionHash = insightHash(admission);
    await db.query(
      `insert into ecl_projection.home_insight_admission
      (tenant_key,assessment_id,release_id,base_home_record_token,admission_hash,admission_json,review_proof_uri,first_run_id)
      values($1,$2,$3,$4,$5,$6::jsonb,$7,$8) on conflict do nothing`,
      [
        tenantKey,
        assessmentId,
        plan.releaseId,
        baseHomeRecordToken,
        admissionHash,
        JSON.stringify(admission),
        reviewUri,
        run.runId,
      ],
    );
    const verify = async (reader: JobClient) => {
      const rows = await reader.query<{
        admission_hash: string;
        admission_json: HomeInsightAdmission;
      }>(
        `select admission_hash, admission_json from serving.home_insight_admissions
         where tenant_key=$1 and assessment_id=$2 and base_home_record_token=$3`,
        [tenantKey, assessmentId, baseHomeRecordToken],
      );
      if (
        rows.rows.length !== 1 ||
        rows.rows[0].admission_hash !== admissionHash ||
        insightHash(rows.rows[0].admission_json) !== admissionHash
      )
        throw new Error("Admission content readback failed");
      validateHomeInsightAdmission({
        admission: rows.rows[0].admission_json,
        tenantKey,
        assessmentId,
        baseHomeRecordToken,
      });
    };
    await verify(db);
    await commitTransaction(
      db,
      "Home insight admission",
      "no insight admission persisted",
    );
    transaction = false;
    committed = true;
    const reader = await runtime.connect(env.DATABASE_URL);
    try {
      await reader.query("begin isolation level repeatable read read only");
      await applySqlLimits(reader, limits);
      await reader.query("select set_config('app.tenant_key',$1,true)", [
        tenantKey,
      ]);
      if (
        (await runtime.baseToken(reader, tenantKey, assessmentId)) !==
        baseHomeRecordToken
      )
        throw new Error("Home changed after admission commit");
      await verify(reader);
      await reader.query("rollback");
    } finally {
      await reader.end();
    }
    const proofPath = `${tenantKey}/enterprise-insights/admissions/${admissionHash}/runs/${run.runId}/proof.json`;
    const proof = {
      ...jobRecord(run, {
        tenantScope: tenantKey,
        inputSourceVersion: plan.loadVersionHash,
        idempotencyKey: admissionHash,
        status: "succeeded",
        proofUri: store.uriFor(proofPath),
        limits,
      }),
      blob_proof_bundle: store.uriFor(proofPath),
      mutation_applied: true,
      assessment_id: assessmentId,
      admission_hash: admissionHash,
      base_home_record_token: baseHomeRecordToken,
      findings: plan.findings.length,
      validation: {
        candidate_content: "passed",
        independent_readback: "passed",
      },
      quality_gate: {
        agent_readiness: "passed",
        serving_approval: "passed",
        home_activation_changed: false,
        signed_in_browser_proof: "not_run",
      },
    };
    await store.writeOnce(proofPath, proofBytes(proof));
    return proof;
  } catch (error) {
    if (transaction) await db.query("rollback").catch(() => undefined);
    if (committed)
      throw new Error(
        "Admission committed; final proof failed. Inspect before retrying",
        { cause: error },
      );
    throw error;
  } finally {
    await db.end();
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runHomeInsightAdmissionJob(process.env)
    .then((proof) => {
      console.log(JSON.stringify(proof));
      if (process.env.ECL_INSIGHT_EMIT_PROOF_BUNDLE === "true")
        emitInsightProofBundle(proof);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

import "server-only";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { Client } from "pg";
import { z } from "zod";
import { DefaultAzureCredential } from "@azure/identity";
import manifestJson from "@/../docs/governance/dataset-manifests/moves-reviewed-source-preparation-v1.json";
import captureManifestJson from "@/../docs/governance/dataset-manifests/moves-phase-capture-preparation-v1.json";
import {
  LoadApprovalSchema,
  resolveLoadApproval,
  type DatasetManifest,
} from "@/lib/governance/dataset-manifest";
import { loadDelegationEvidence } from "@/lib/governance/delegated-approval";
import {
  ExactSourceCohortSchema,
  prepareExactSourcePlan,
  isDeclaredSyntheticSourceTenant,
  verifyExactIndexedDocuments,
  type NativeSourceRow,
} from "@/lib/programs/evidence-readiness/exact-source-preparation";
import { readExactSourceSnapshot } from "@/lib/programs/evidence-readiness/exact-source-reader";
import {
  PhaseCaptureCohortSchema,
  CAPTURE_DATASET_ID,
  readPhaseCaptureSnapshot,
  preparePhaseCapturePlan,
} from "@/lib/programs/evidence-readiness/phase-capture-preparation";
import { buildExactSourceReadinessRows } from "@/lib/programs/evidence-readiness/exact-source-readiness";
import { readExactSourceIndexDocuments } from "@/lib/azure-search/tenant-context-retriever";
import {
  admitMoveSources,
  moveSourceRevision,
  type MoveAdmissionSource,
} from "@/lib/programs/move-agent-admission";
import {
  applyApprovedExactSourceIndex,
  scopedIndexRowDiff,
} from "./moves-exact-source-index-adapter";
import { sourceOperatorVerifier } from "./moves-source-operator-identity";
import { blobProofStore } from "../../scripts/ecl/synthetic_enterprise_home_job";

const sha = (bytes: Buffer | string) =>
  createHash("sha256").update(bytes).digest("hex");
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const privateProof = z
  .object({ uri: z.string().url(), sha256: digest })
  .strict();
const Input = z
  .object({
    cohort: z.union([ExactSourceCohortSchema, PhaseCaptureCohortSchema]),
    sourceSetHash: digest.optional(),
    loadApproval: LoadApprovalSchema.optional(),
    indexProof: privateProof.optional(),
    renderReceipts: z.unknown().optional(),
  })
  .strict();
const required = (key: string) => {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`Required ${key}`);
  return value;
};

async function main() {
  const bytes = Buffer.from(
    required("MOVES_SOURCE_SECRET_INPUT_BASE64"),
    "base64",
  );
  if (
    bytes.length > 200_000 ||
    sha(bytes) !== required("MOVES_SOURCE_INPUT_SHA256")
  )
    throw new Error("source_job_input_changed");
  const input = Input.parse(JSON.parse(bytes.toString("utf8"))),
    cohort = input.cohort;
  const mode = z
    .enum(["plan", "index", "promote", "verify"])
    .parse(required("MOVES_SOURCE_MODE"));
  const runId = required("MOVES_SOURCE_RUN_ID"),
    releaseRecord = required("MOVES_SOURCE_RELEASE_RECORD");
  const image = required("ABARVA_OPERATOR_IMAGE"),
    gitSha = required("ABARVA_OPERATOR_BRANCH_COMMIT");
  if (
    !/^[a-zA-Z0-9_-]{1,80}$/.test(runId) ||
    !/^docs\/releases\/records\/[a-zA-Z0-9._-]+\.md$/.test(releaseRecord) ||
    !/^[a-f0-9]{40}$/.test(gitSha) ||
    !/@sha256:[a-f0-9]{64}$/.test(image) ||
    required("ABARVA_OPERATOR_IMAGE_DIGEST") !== image.split("@")[1] ||
    required("MOVES_SOURCE_EXECUTION_LANE") !== "aca_operator_job" ||
    required("MOVES_SOURCE_IDEMPOTENCY_KEY") !==
      `move-source:${mode}:${sha(bytes)}`
  )
    throw new Error("source_job_unbound");
  readFileSync(releaseRecord);
  const registry = JSON.parse(
    readFileSync("datasets/tenant-inputs/tenant-input-registry.json", "utf8"),
  );
  if (!isDeclaredSyntheticSourceTenant(registry, cohort.clientKey))
    throw new Error("source_tenant_not_released");
  const mutating = mode === "index" || mode === "promote";
  if (mutating && required("MOVES_SOURCE_APPLY") !== "true")
    throw new Error("source_apply_not_authorized");
  const manifest = {
    ...(cohort.datasetId === CAPTURE_DATASET_ID
      ? captureManifestJson
      : manifestJson),
    expected_object_count: cohort.sources.filter(
      (s) => s.phase <= cohort.expectedCurrentPhase,
    ).length,
    load_approval: input.loadApproval ?? null,
  } as DatasetManifest;
  const store = await blobProofStore(
    required("AZURE_STORAGE_ACCOUNT_NAME"),
    required("ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID"),
    {
      statementTimeoutMs: 60000,
      lockTimeoutMs: 15000,
      proofStoreTimeoutMs: 30000,
    },
  );
  const prefix = `moves-exact-source/${runId}`;
  const proof = async (name: string, value: unknown) => {
    const body = Buffer.from(JSON.stringify(value, null, 2));
    const result = await store.writeOnce(`${prefix}/${name}.json`, body);
    if (
      !result.created ||
      !(await store.read(result.uri, 5_000_000)).equals(body)
    )
      throw new Error("source_job_proof_failed");
    const ref = { uri: result.uri, sha256: sha(body) };
    console.log(
      JSON.stringify({
        checkpoint: name,
        ...ref,
        at: new Date().toISOString(),
      }),
    );
    return ref;
  };
  const readProof = async (ref: z.infer<typeof privateProof>) => {
    const body = await store.read(ref.uri, 2_000_000);
    if (sha(body) !== ref.sha256)
      throw new Error("source_private_proof_changed");
    return JSON.parse(body.toString("utf8"));
  };
  const evidence =
    mutating && input.loadApproval?.delegated_decision
      ? await loadDelegationEvidence(
          [input.loadApproval.delegated_decision],
          (uri) => store.read(uri, 1_000_000),
        )
      : undefined;
  if (mutating && !evidence)
    throw new Error("source_verified_delegation_required");
  const verifyActor = await sourceOperatorVerifier(cohort);
  const client = new Client({ connectionString: required("DATABASE_URL") });
  let open = false,
    committed = false;
  try {
    await client.connect();
    const db = {
      query: async (sql: string, values: unknown[]) => ({
        rows: (await client.query(sql, values)).rows as NativeSourceRow[],
      }),
    };
    const replan = async () =>
      cohort.datasetId === CAPTURE_DATASET_ID
        ? preparePhaseCapturePlan(
            cohort,
            await readPhaseCaptureSnapshot(db, cohort, verifyActor),
            manifest,
            mode === "verify",
          )
        : prepareExactSourcePlan(
            cohort,
            await readExactSourceSnapshot(db, cohort, undefined, verifyActor),
            manifest,
            { inspectBoundReadiness: mode === "verify" },
          );
    const lock = async () => {
      await client.query("BEGIN");
      open = true;
      await client.query("SET LOCAL statement_timeout='60s'");
      await client.query("SET LOCAL lock_timeout='15s'");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
        [`move-source:${cohort.moveId}`],
      );
      await client.query(
        "SELECT id FROM public.engagements WHERE id=$1::uuid FOR UPDATE",
        [cohort.moveId],
      );
      if (cohort.datasetId === CAPTURE_DATASET_ID) {
        await client.query(
          "SELECT id FROM public.program_modules WHERE engagement_id=$1::uuid AND id=ANY($2::uuid[]) ORDER BY id FOR UPDATE",
          [cohort.moveId, cohort.sources.map((s) => s.moduleId)],
        );
        return;
      }
      await client.query(
        "SELECT id FROM public.program_evidence_items WHERE program_id=$1::uuid AND id=ANY($2::uuid[]) ORDER BY id FOR UPDATE",
        [cohort.moveId, cohort.sources.map((s) => s.evidenceId)],
      );
      await client.query(
        "SELECT id FROM public.program_evidence_reviews WHERE program_id=$1::uuid AND id=ANY($2::uuid[]) ORDER BY id FOR UPDATE",
        [cohort.moveId, cohort.sources.map((s) => s.reviewId)],
      );
      await client.query(
        "SELECT artifact_id FROM public.move_artifacts WHERE move_id=$1::uuid AND artifact_id=ANY($2::uuid[]) ORDER BY artifact_id FOR UPDATE",
        [cohort.moveId, cohort.sources.map((s) => s.artifactId)],
      );
    };
    if (mutating) await lock();
    else {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      open = true;
    }
    const plan = await replan();
    if (input.sourceSetHash && input.sourceSetHash !== plan.sourceSetHash)
      throw new Error("source_candidate_changed");
    if (mutating) {
      const approval = resolveLoadApproval(
        [manifest],
        {
          dataset_id: plan.datasetId,
          tenant_key: cohort.clientKey,
          assessment_id: cohort.moveId,
          move_id: cohort.moveId,
          source_set_hash: plan.sourceSetHash,
          object_count: manifest.expected_object_count!,
          ingestion_method: "operator_aca_job",
          release_record: releaseRecord,
        },
        evidence,
      );
      if (!input.sourceSetHash || !approval.approved)
        throw new Error("source_exact_load_not_approved");
    }
    const readIndex = () =>
      readExactSourceIndexDocuments({ ids: plan.documents.map((d) => d.id) });
    const before = await readIndex();
    await proof("before", {
      mode,
      plan,
      indexRowDiff: scopedIndexRowDiff(plan, before),
      image,
      gitSha,
      releaseRecord,
      inputSha256: sha(bytes),
      operator: input.loadApproval?.delegated_decision?.actor ?? null,
    });
    if (mode === "plan") {
      await client.query("ROLLBACK");
      open = false;
      await proof("complete", {
        status: "planned",
        plan,
        indexRowDiff: scopedIndexRowDiff(plan, before),
        readOnly: true,
      });
      return;
    }
    if (mode === "verify") {
      verifyExactIndexedDocuments(plan.documents, before);
      const admission = await admitMoveSources<{ admissionSource: MoveAdmissionSource }>(
        plan.sources,
        (s) => s.admissionSource,
        {
          clientKey: cohort.clientKey,
          tenantId: cohort.clientId,
          moveId: cohort.moveId,
          phase: cohort.expectedCurrentPhase,
        },
      );
      if (
        admission.items.length !== plan.sources.filter((s) => s.eligible).length
      )
        throw new Error("source_native_admission_incomplete");
      await client.query("ROLLBACK");
      open = false;
      await proof("complete", {
        status: "verified",
        sourceSetHash: plan.sourceSetHash,
        diagnostics: admission.diagnostics,
        readOnly: true,
      });
      return;
    }
    if (mode === "index") {
      const result = await applyApprovedExactSourceIndex({
        plan,
        manifest,
        releaseRecord,
        evidence,
        replan,
        readBefore: readIndex,
        serialize: async (work) => work(),
        auditUpload: (receipt) =>
          proof("index-upload-receipt", receipt).then(() => {}),
        upload: async (documents) => {
          const endpoint = required("AZURE_SEARCH_ENDPOINT");
          if (!/^https:\/\/[a-z0-9-]+\.search\.windows\.net$/.test(endpoint))
            throw new Error("source_index_endpoint_invalid");
          const token = await new DefaultAzureCredential({
            managedIdentityClientId: process.env.AZURE_CLIENT_ID,
          }).getToken("https://search.azure.com/.default");
          const response = await fetch(
            `${endpoint}/indexes/tenant-context-v1/docs/index?api-version=2024-07-01`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token.token}`,
              },
              body: JSON.stringify({
                value: documents.map((d) => ({
                  ...d,
                  "@search.action": "upload",
                })),
              }),
              signal: AbortSignal.timeout(30000),
            },
          );
          if (!response.ok)
            throw new Error(`source_index_upload_failed:${response.status}`);
          return response.json();
        },
      });
      await client.query("COMMIT");
      open = false;
      committed = true;
      await proof("complete", result);
      return;
    }
    if (!input.indexProof || !input.renderReceipts)
      throw new Error("source_render_proof_required");
    const indexed = await readProof(input.indexProof);
    if (
      indexed.status !== "indexed" ||
      indexed.sourceSetHash !== plan.sourceSetHash
    )
      throw new Error("source_index_proof_unbound");
    const renderProof = await proof("render-receipts", input.renderReceipts);
    const rows = buildExactSourceReadinessRows({
      plan,
      manifest,
      receipts: input.renderReceipts,
      indexed: before,
      indexedAt: indexed.indexedAt,
      now: new Date().toISOString(),
      runId,
      proofUri: renderProof.uri,
      proofSha256: renderProof.sha256,
    });
    for (const row of rows) {
      const columns = Object.keys(row),
        values = Object.values(row).map((v) =>
          v && typeof v === "object" && !Array.isArray(v)
            ? JSON.stringify(v)
            : v,
        );
      const result = await client.query(
        `INSERT INTO public.governed_object_readiness (${columns.join(",")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(",")}) ON CONFLICT (object_table,object_id,client_key) DO NOTHING RETURNING id`,
        values,
      );
      if (result.rowCount !== 1)
        throw new Error("source_readiness_existing_row_preserved");
    }
    const { rows: written } = await client.query(
      "SELECT * FROM public.governed_object_readiness WHERE object_table=$4 AND client_key=$1 AND tenant_id=$2 AND object_id=ANY($3::text[])",
      [
        cohort.clientKey,
        cohort.clientId,
        rows.map((r) => r.object_id),
        cohort.datasetId === CAPTURE_DATASET_ID
          ? "program_modules"
          : "program_evidence_items",
      ],
    );
    if (
      written.length !== rows.length ||
      rows.some(
        (row) =>
          !written.some((stored) =>
            Object.entries(row).every(
              ([key, value]) =>
                moveSourceRevision(stored[key]) === moveSourceRevision(value),
            ),
          ),
      )
    )
      throw new Error("source_readiness_readback_failed");
    await proof("readiness-prepared", {
      rows,
      sourceSetHash: plan.sourceSetHash,
      indexProof: input.indexProof,
      renderProof,
    });
    await client.query("COMMIT");
    open = false;
    committed = true;
    const admitted = await admitMoveSources<{ admissionSource: MoveAdmissionSource }>(
      plan.sources,
      (s) => s.admissionSource,
      {
        clientKey: cohort.clientKey,
        tenantId: cohort.clientId,
        moveId: cohort.moveId,
        phase: cohort.expectedCurrentPhase,
      },
    );
    if (admitted.items.length !== rows.length)
      throw new Error("source_readiness_consumer_readback_failed");
    await proof("complete", {
      status: "admitted",
      sourceSetHash: plan.sourceSetHash,
      diagnostics: admitted.diagnostics,
      readinessWrites: rows.length,
      phaseWrites: 0,
    });
  } catch (error) {
    if (open) {
      await client.query("ROLLBACK");
      open = false;
    }
    await proof("failed", {
      error: error instanceof Error ? error.message : "source_job_failed",
      committed,
      indexDeleteAllowed: false,
    }).catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}
if (process.argv[1]?.endsWith("moves-exact-source-job.ts"))
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "source_job_failed");
    process.exitCode = 1;
  });

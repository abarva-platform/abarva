import "server-only";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { z } from "zod";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { isDeclaredSyntheticSourceTenant } from "@/lib/programs/evidence-readiness/exact-source-preparation";
import { moveSourceRevision } from "@/lib/programs/move-agent-admission";
import { resolveLoadApproval } from "@/lib/governance/dataset-manifest";
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { artifactTypeForUpload } from "@/lib/programs/deliverables/move-artifacts";
import { blobProofStore } from "../../scripts/ecl/synthetic_enterprise_home_job";
import permit from "@/../docs/governance/data-repairs/moves-source-original-repair-20261017.json";

const sha = (bytes: string | Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const RepairInput = z
  .object({
    version: z.literal(1),
    moveId: z.string().uuid(),
    clientId: z.string().uuid(),
    clientKey: z.string(),
    nativeTenantKey: z.string(),
    expectedPhase: z.number().int().min(0).max(5),
    datasetId: z.string(),
    sourceSetHash: digest,
    sources: z
      .array(
        z
          .object({
            evidenceId: z.string().uuid(),
            reviewId: z.string().uuid(),
            beforeHash: digest,
            sourceFile: z.string(),
            sourceSha256: digest,
          })
          .strict(),
      )
      .min(1)
      .max(32),
  })
  .strict();
type Row = Record<string, unknown>;
const object = (v: unknown): Row =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Row) : {};

/** Restores only an already-declared exact synthetic original, never new facts. */
export function verifyOriginalRepairSource(
  input: z.infer<typeof RepairInput>,
  expected: z.infer<typeof RepairInput>["sources"][number],
  evidence: Row,
  review: Row,
  bytes: Buffer,
) {
  const ref = object(review.source_ref),
    structured = object(evidence.extracted_structured);
  if (
    moveSourceRevision({ evidence, review }) !== expected.beforeHash ||
    evidence.id !== expected.evidenceId ||
    review.id !== expected.reviewId ||
    review.evidence_id !== expected.evidenceId ||
    evidence.program_id !== input.moveId ||
    review.program_id !== input.moveId ||
    evidence.tenant_key !== input.nativeTenantKey ||
    review.tenant_key !== input.nativeTenantKey ||
    !Number.isInteger(evidence.phase) ||
    Number(evidence.phase) > input.expectedPhase ||
    review.phase !== evidence.phase ||
    evidence.attachment_id !== null ||
    ref.move_artifact_id != null ||
    review.decision !== "approved" ||
    ref.synthetic !== true ||
    ref.client_attested !== false ||
    structured.synthetic !== true ||
    structured.client_attested !== false ||
    ref.governance_dataset_id !== input.datasetId ||
    structured.governance_dataset_id !== input.datasetId ||
    ref.source_set_hash !== input.sourceSetHash ||
    structured.source_set_hash !== input.sourceSetHash ||
    ref.source_file !== expected.sourceFile ||
    ref.source_file_sha256 !== expected.sourceSha256 ||
    sha(bytes) !== expected.sourceSha256 ||
    evidence.extracted_text !== bytes.toString("utf8")
  ) {
    throw new Error("source_original_repair_precondition_changed");
  }
  if (
    !/^scripts\/moves\/fixtures\/[a-zA-Z0-9_/-]+\.(md|csv|txt)$/.test(
      expected.sourceFile,
    ) ||
    expected.sourceFile.includes("..")
  ) {
    throw new Error("source_original_repair_path_invalid");
  }
}

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Required ${name}`);
  return value;
};

async function main() {
  const bytes = Buffer.from(
    required("MOVES_SOURCE_REPAIR_INPUT_BASE64"),
    "base64",
  );
  if (
    sha(bytes) !== permit.input_sha256 ||
    required("MOVES_SOURCE_REPAIR_APPLY") !== "true" ||
    required("MOVES_SOURCE_REPAIR_RELEASE_RECORD") !== permit.release_record ||
    required("MOVES_SOURCE_REPAIR_EXECUTION_LANE") !== "aca_operator_job" ||
    Date.now() >= Date.parse(permit.expires_at)
  )
    throw new Error("source_original_repair_not_authorized");
  const input = RepairInput.parse(JSON.parse(bytes.toString("utf8")));
  const runId = required("MOVES_SOURCE_REPAIR_RUN_ID");
  const image = required("ABARVA_OPERATOR_IMAGE"),
    gitSha = required("ABARVA_OPERATOR_BRANCH_COMMIT");
  if (
    !/^[a-zA-Z0-9_-]{1,80}$/.test(runId) ||
    !/^[a-f0-9]{40}$/.test(gitSha) ||
    !/@sha256:[a-f0-9]{64}$/.test(image) ||
    required("ABARVA_OPERATOR_IMAGE_DIGEST") !== image.split("@")[1] ||
    required("MOVES_SOURCE_REPAIR_IDEMPOTENCY_KEY") !==
      `source-original:${permit.input_sha256}`
  )
    throw new Error("source_original_repair_job_unbound");
  if (
    canonicalTenantKey(input.nativeTenantKey) !== input.clientKey ||
    !isDeclaredSyntheticSourceTenant(
      JSON.parse(
        readFileSync(
          "datasets/tenant-inputs/tenant-input-registry.json",
          "utf8",
        ),
      ),
      input.clientKey,
    ) ||
    new Set(input.sources.map((s) => s.evidenceId)).size !==
      input.sources.length ||
    new Set(input.sources.map((s) => s.reviewId)).size !==
      input.sources.length ||
    new Set(input.sources.map((s) => s.sourceFile)).size !==
      input.sources.length
  )
    throw new Error("source_original_repair_scope_invalid");
  const manifests = readdirSync("docs/governance/dataset-manifests")
    .filter((f) => f.endsWith(".json"))
    .map((f) =>
      JSON.parse(
        readFileSync(`docs/governance/dataset-manifests/${f}`, "utf8"),
      ),
    );
  const approval = resolveLoadApproval(manifests, {
    dataset_id: input.datasetId,
    tenant_key: input.nativeTenantKey,
    move_id: input.moveId,
    assessment_id: input.moveId,
    source_set_hash: input.sourceSetHash,
    object_count: input.sources.length,
    ingestion_method: "operator_aca_job",
  });
  if (!approval.approved) throw new Error("source_original_load_not_approved");
  const store = await blobProofStore(
    required("AZURE_STORAGE_ACCOUNT_NAME"),
    required("ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID"),
    {
      statementTimeoutMs: 60000,
      lockTimeoutMs: 15000,
      proofStoreTimeoutMs: 30000,
    },
  );
  const prefix = `moves-source-original-repair/${runId}`;
  const proof = async (name: string, value: unknown) => {
    const body = Buffer.from(JSON.stringify(value, null, 2));
    const result = await store.writeOnce(`${prefix}/${name}.json`, body);
    if (
      !result.created ||
      !(await store.read(result.uri, 2_000_000)).equals(body)
    )
      throw new Error("source_repair_proof_write_failed");
    console.log(
      JSON.stringify({
        checkpoint: name,
        uri: result.uri,
        sha256: sha(body),
        at: new Date().toISOString(),
      }),
    );
  };
  const client = new Client({ connectionString: required("DATABASE_URL") });
  let open = false,
    committed = false;
  try {
    await client.connect();
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    open = true;
    await client.query("SET LOCAL statement_timeout='60s'");
    await client.query("SET LOCAL lock_timeout='15s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      `move-source:${input.moveId}`,
    ]);
    const { rows: moves } = await client.query(
      `SELECT e.id,e.client_id,e.current_phase,e.deleted_at,e.archived_at,c.tenant_key,c.slug FROM public.engagements e JOIN public.clients c ON c.id=e.client_id WHERE e.id=$1::uuid FOR UPDATE OF e`,
      [input.moveId],
    );
    const move = moves[0];
    if (
      moves.length !== 1 ||
      move.client_id !== input.clientId ||
      move.current_phase !== input.expectedPhase ||
      move.deleted_at !== null ||
      move.archived_at !== null ||
      canonicalTenantKey(move.tenant_key) !== input.clientKey ||
      canonicalTenantKey(move.slug) !== input.clientKey
    )
      throw new Error("source_repair_move_changed");
    const { rows } = await client.query(
      `SELECT row_to_json(e) evidence,row_to_json(r) review FROM public.program_evidence_items e JOIN public.program_evidence_reviews r ON r.evidence_id=e.id AND r.program_id=e.program_id WHERE e.program_id=$1::uuid AND e.id=ANY($2::uuid[]) FOR UPDATE OF e,r`,
      [input.moveId, input.sources.map((s) => s.evidenceId)],
    );
    if (rows.length !== input.sources.length)
      throw new Error("source_repair_membership_changed");
    const { rows: existing } = await client.query(
      `SELECT artifact_id FROM public.move_artifacts WHERE move_id=$1::uuid AND file_name=ANY($2::text[])`,
      [input.moveId, input.sources.map((s) => path.basename(s.sourceFile))],
    );
    if (existing.length) throw new Error("source_original_already_registered");
    const prepared = input.sources.map((expected) => {
      const row = rows.find((r) => r.evidence.id === expected.evidenceId);
      if (!row) throw new Error("source_repair_membership_changed");
      if (
        !/^scripts\/moves\/fixtures\/[a-zA-Z0-9_/-]+\.(md|csv|txt)$/.test(
          expected.sourceFile,
        ) ||
        expected.sourceFile.includes("..")
      )
        throw new Error("source_repair_path_invalid");
      const body = readFileSync(expected.sourceFile);
      verifyOriginalRepairSource(
        input,
        expected,
        row.evidence,
        row.review,
        body,
      );
      return { expected, row, body };
    });
    await proof("before", {
      input,
      rows,
      permit,
      image,
      gitSha,
      idempotencyKey: `source-original:${permit.input_sha256}`,
      operator: permit.actor,
      independentHumanAttestation: false,
      independentFinanceAttestation: false,
    });
    const storage = getObjectStorageAdapter(),
      container =
        process.env.DATA_PLANE_OBJECT_STORE_CONTAINER ?? "context-drops";
    const created: Array<{
      evidenceId: string;
      reviewId: string;
      artifactId: string;
      blobPath: string;
      sha256: string;
    }> = [];
    for (const { expected, row, body } of prepared) {
      const fileName = path.basename(expected.sourceFile),
        format = path.extname(fileName).slice(1);
      const artifactType = artifactTypeForUpload({
        body,
        family: "uploaded_evidence",
        fileName,
        phase: row.evidence.phase,
      });
      const blobPath = `moves/${input.nativeTenantKey}/${input.moveId}/P${row.evidence.phase}/uploads/${artifactType}/v1/${fileName}`;
      try {
        await storage.upload(container, blobPath, body, {
          upsert: false,
          contentType:
            format === "csv" ? "text/csv" : "text/markdown; charset=utf-8",
        });
      } catch (error) {
        // A retry may find the exact immutable original from a rolled-back run.
        const existing = await storage
          .download(container, blobPath)
          .catch(() => null);
        if (!existing || sha(existing) !== expected.sourceSha256) throw error;
      }
      if (
        sha(await storage.download(container, blobPath)) !==
        expected.sourceSha256
      )
        throw new Error("source_original_blob_readback_failed");
      const { rows: artifacts } = await client.query(
        `INSERT INTO public.move_artifacts (tenant_id,tenant_key,move_id,phase,artifact_type,artifact_family,title,file_name,file_format,blob_container,blob_path,blob_sha256,file_size,version,status,source_basis,confidence,citation_ready,metadata,uploaded_by,uploaded_at) VALUES ($1,$2,$3::uuid,$4,$5,'uploaded_evidence',$6,$7,$8,$9,$10,$11,$12,1,'review_required',$13,'unverified',false,$14::jsonb,$15,now()) RETURNING artifact_id`,
        [
          input.clientId,
          input.nativeTenantKey,
          input.moveId,
          row.evidence.phase,
          artifactType,
          row.evidence.title,
          fileName,
          format,
          container,
          blobPath,
          expected.sourceSha256,
          body.length,
          "Restored exact declared synthetic original; not client-attested",
          JSON.stringify({
            sha256: expected.sourceSha256,
            storage: "azure_blob",
            classification: "internal",
            synthetic: true,
            client_attested: false,
            repair_run_id: runId,
            source_file: expected.sourceFile,
          }),
          permit.actor,
        ],
      );
      const artifactId = artifacts[0].artifact_id;
      const sourceRef = {
        ...row.review.source_ref,
        move_artifact_id: artifactId,
        original_repair_run_id: runId,
      };
      await client.query(
        `UPDATE public.program_evidence_reviews SET source_ref=$1::jsonb,decision='pending',auto_promoted=false,reviewed_at=NULL,reviewed_by_user_id=NULL,rationale=$2,updated_at=now() WHERE id=$3::uuid AND program_id=$4::uuid`,
        [
          JSON.stringify(sourceRef),
          "Original bytes restored. Review the actual passages before approving the revised source binding; prior review retained in the private repair proof.",
          expected.reviewId,
          input.moveId,
        ],
      );
      created.push({
        evidenceId: expected.evidenceId,
        reviewId: expected.reviewId,
        artifactId,
        blobPath,
        sha256: expected.sourceSha256,
      });
    }
    await proof("prepared", {
      created,
      reviewState: "pending",
      readinessWrites: 0,
      phaseWrites: 0,
      indexWrites: 0,
    });
    await client.query("COMMIT");
    open = false;
    committed = true;
    const { rows: after } = await client.query(
      `SELECT r.id,r.evidence_id,r.decision,r.reviewed_at,r.source_ref,a.artifact_id,a.blob_sha256,a.lifecycle_state FROM public.program_evidence_reviews r JOIN public.move_artifacts a ON a.artifact_id::text=r.source_ref->>'move_artifact_id' WHERE r.program_id=$1::uuid AND r.id=ANY($2::uuid[])`,
      [input.moveId, input.sources.map((s) => s.reviewId)],
    );
    if (
      after.length !== created.length ||
      after.some(
        (r) =>
          r.decision !== "pending" ||
          r.reviewed_at !== null ||
          r.lifecycle_state !== "current" ||
          !created.some(
            (c) =>
              c.reviewId === r.id &&
              c.artifactId === r.artifact_id &&
              c.sha256 === r.blob_sha256,
          ),
      )
    )
      throw new Error("source_original_repair_readback_failed");
    await proof("complete", {
      status: "passed",
      created,
      after,
      checkedAt: new Date().toISOString(),
      readinessWrites: 0,
      phaseWrites: 0,
      indexWrites: 0,
    });
  } catch (error) {
    if (open) {
      await client.query("ROLLBACK");
      open = false;
    }
    await proof("failed", {
      error: error instanceof Error ? error.message : "source_repair_failed",
      committed,
      databaseTransactionRolledBack: !committed,
    }).catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.endsWith("moves-source-original-repair.ts"))
  main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : "source_repair_failed",
    );
    process.exitCode = 1;
  });

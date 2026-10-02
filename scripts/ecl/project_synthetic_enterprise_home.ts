#!/usr/bin/env tsx

/** Build a shadow Home projection from admitted canonical rows, never from the source pack. */

import { createHash } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BlobServiceClient } from "@azure/storage-blob";
import { ManagedIdentityCredential } from "@azure/identity";
import pg from "pg";
import {
  generatePack,
  type GeneratedPack,
} from "./load_synthetic_enterprise_v1";
import {
  buildSyntheticHomeRows,
  type CanonicalHomeObject,
} from "./synthetic_enterprise_home_rows";

const surface = "home_enterprise_landscape";
const version = 1;
const containerName = "ecl-synthetic-intake";

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function stableUuid(...parts: string[]): string {
  const bytes = Buffer.from(
    createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32),
    "hex",
  );
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

type ReadbackProof = {
  status: string;
  tenant_scope: string;
  assessment_id: string;
  source_set_hash: string;
  client_attestation_state: string;
  actual: Record<string, number>;
};

async function insertBatch(
  db: pg.Client,
  table: string,
  columns: readonly [string, string][],
  rows: Record<string, unknown>[],
): Promise<void> {
  const names = columns.map(([name]) => name).join(", ");
  const types = columns.map(([name, type]) => `${name} ${type}`).join(", ");
  const values = columns
    .map(([name, type]) => (type === "text" ? name : `${name}::${type}`))
    .join(", ");
  for (let offset = 0; offset < rows.length; offset += 400) {
    await db.query(
      `insert into ${table} (${names}) select ${values} from jsonb_to_recordset($1::jsonb) as item(${types})`,
      [JSON.stringify(rows.slice(offset, offset + 400))],
    );
  }
}

export async function writeShadowHomeProjection(
  db: pg.Client,
  pack: GeneratedPack,
  readbackUri: string,
  runId: string,
  projectionProofUri: string,
): Promise<Record<string, unknown>> {
  const { manifest, normalized } = pack;
  await db.query("begin isolation level serializable");
  try {
    const occupied = await db.query<{ n: string }>(
      `
      select (select count(*) from ecl_projection.projection_manifest
        where tenant_key = $1 and assessment_id = $2 and projection_key = $3)
        + (select count(*) from ecl_projection.home_enterprise_landscape
        where tenant_key = $1 and assessment_id = $2) as n
    `,
      [manifest.tenant_key, manifest.assessment_id, surface],
    );
    if (Number(occupied.rows[0].n) !== 0)
      throw new Error("Refusing occupied Home projection");
    const catalog = await db.query<{
      source_owner: string;
      file_name: string;
      file_hash: string;
    }>(
      `
      select source_owner, file_name, file_hash from ecl_source.source_file
      where tenant_key = $1 and assessment_id = $2 and quality_state = 'accepted'
        and metadata_json->>'source_set_hash' = $3
    `,
      [manifest.tenant_key, manifest.assessment_id, manifest.source_set_hash],
    );
    const expectedFiles = new Map(
      manifest.files.map((file) => [
        `${file.source_room_family}/${path.basename(file.file_path)}`,
        file.sha256,
      ]),
    );
    if (
      catalog.rows.length !== expectedFiles.size ||
      catalog.rows.some(
        (row) =>
          expectedFiles.get(`${row.source_owner}/${row.file_name}`) !==
          row.file_hash,
      )
    ) {
      throw new Error(
        "Canonical source catalog drifted after independent readback",
      );
    }
    const canonical = await db.query<CanonicalHomeObject>(
      `
      select id::text, object_key, object_type, display_name,
        source_record_id::text, value_state, attributes_json
      from ecl_context.object where tenant_key = $1 and assessment_id = $2
    `,
      [manifest.tenant_key, manifest.assessment_id],
    );
    if (canonical.rows.length !== normalized.objects.length) {
      throw new Error(
        "Canonical object count changed after independent readback",
      );
    }
    const rows = buildSyntheticHomeRows(canonical.rows);
    const count = (type: string) =>
      rows.filter((row) => row.row_type === type).length;
    if (
      count("application") !== 344 ||
      count("contract") !== 230 ||
      count("business_segment") !== 3 ||
      count("business_function") !== 14 ||
      count("program") !== 24 ||
      count("metric") !== 36
    ) {
      throw new Error("Home projection lost a required canonical family");
    }
    const snapshotId = stableUuid(
      "synthetic-home-snapshot",
      manifest.assessment_id,
      manifest.source_set_hash,
    );
    const manifestId = stableUuid(
      "synthetic-home-manifest",
      manifest.assessment_id,
      manifest.source_set_hash,
    );
    const projectionHash = hash(rows.map((row) => row.source_hash));
    await db.query(
      `insert into ecl_context.snapshot
      (id, tenant_key, assessment_id, snapshot_key, snapshot_type, source_hash,
       context_hash, created_by_job, quality_state, proof_uri)
      values ($1,$2,$3,$4,'projection_source',$5,$6,$7,'warning',$8)`,
      [
        snapshotId,
        manifest.tenant_key,
        manifest.assessment_id,
        `synthetic-home-${manifest.source_set_hash}`,
        manifest.source_set_hash,
        projectionHash,
        runId,
        readbackUri,
      ],
    );
    await db.query(
      `insert into ecl_projection.projection_manifest
      (id, tenant_key, assessment_id, snapshot_id, projection_key, projection_version,
       rebuild_command, source_hash, projection_hash, row_count, quality_state,
       admission_status, proof_uri)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'warning','not_applicable',$11)`,
      [
        manifestId,
        manifest.tenant_key,
        manifest.assessment_id,
        snapshotId,
        surface,
        version,
        "npm run ecl:synthetic-enterprise-v2:project-job",
        manifest.source_set_hash,
        projectionHash,
        rows.length,
        projectionProofUri,
      ],
    );
    const entryRows = rows.map((row) => {
      const entryId = stableUuid(
        "synthetic-home-entry",
        manifest.assessment_id,
        row.page_key,
        row.row_key,
      );
      return {
        id: entryId,
        tenant_key: manifest.tenant_key,
        assessment_id: manifest.assessment_id,
        snapshot_id: snapshotId,
        projection_manifest_id: manifestId,
        projection_version: version,
        surface_key: surface,
        row_key: row.row_key,
        row_type: row.row_type,
        source_hash: row.source_hash,
        refs_content_hash: hash([row.primary_object_id, row.source_record_id]),
        refs_cache_json: {
          objects: [row.primary_object_id],
          source_records: [row.source_record_id],
        },
        display_cache_json: { page_key: row.page_key, title: row.title },
      };
    });
    await insertBatch(
      db,
      "ecl_projection.projection_entry",
      [
        ["id", "uuid"],
        ["tenant_key", "text"],
        ["assessment_id", "text"],
        ["snapshot_id", "uuid"],
        ["projection_manifest_id", "uuid"],
        ["projection_version", "integer"],
        ["surface_key", "text"],
        ["row_key", "text"],
        ["row_type", "text"],
        ["source_hash", "text"],
        ["refs_content_hash", "text"],
        ["refs_cache_json", "jsonb"],
        ["display_cache_json", "jsonb"],
      ],
      entryRows,
    );
    await insertBatch(
      db,
      "ecl_projection.projection_entry_source_record_ref",
      [
        ["tenant_key", "text"],
        ["assessment_id", "text"],
        ["projection_entry_id", "uuid"],
        ["source_record_id", "uuid"],
        ["ref_role", "text"],
        ["sort_order", "integer"],
        ["source_hash", "text"],
      ],
      rows.map((row, index) => ({
        tenant_key: manifest.tenant_key,
        assessment_id: manifest.assessment_id,
        projection_entry_id: entryRows[index].id,
        source_record_id: row.source_record_id,
        ref_role: "primary_source",
        sort_order: 1,
        source_hash: row.source_hash,
      })),
    );
    await insertBatch(
      db,
      "ecl_projection.home_enterprise_landscape",
      [
        ["id", "uuid"],
        ["tenant_key", "text"],
        ["assessment_id", "text"],
        ["snapshot_id", "uuid"],
        ["projection_manifest_id", "uuid"],
        ["projection_entry_id", "uuid"],
        ["projection_version", "integer"],
        ["page_key", "text"],
        ["row_key", "text"],
        ["section_key", "text"],
        ["row_type", "text"],
        ["title", "text"],
        ["summary", "text"],
        ["primary_object_id", "uuid"],
        ["source_refs_json", "jsonb"],
        ["basis_summary", "text"],
        ["value_state", "text"],
        ["quality_state", "text"],
        ["admission_status", "text"],
        ["display_payload_json", "jsonb"],
        ["source_hash", "text"],
      ],
      rows.map((row, index) => ({
        ...row,
        id: stableUuid(
          "synthetic-home-row",
          manifest.assessment_id,
          row.page_key,
          row.row_key,
        ),
        tenant_key: manifest.tenant_key,
        assessment_id: manifest.assessment_id,
        snapshot_id: snapshotId,
        projection_manifest_id: manifestId,
        projection_entry_id: entryRows[index].id,
        projection_version: version,
        source_refs_json: [{ source_record_id: row.source_record_id }],
        basis_summary: "synthetic_reference_not_client_attested",
        quality_state: "passed",
        admission_status: "not_applicable",
      })),
    );
    const checks = await db.query<{ projected: string; links: string }>(
      `
      select (select count(*) from ecl_projection.home_enterprise_landscape
        where tenant_key = $1 and assessment_id = $2) as projected,
        (select count(*) from ecl_projection.projection_entry_source_record_ref
        where tenant_key = $1 and assessment_id = $2) as links
    `,
      [manifest.tenant_key, manifest.assessment_id],
    );
    if (
      Number(checks.rows[0].projected) !== rows.length ||
      Number(checks.rows[0].links) !== rows.length
    ) {
      throw new Error("Projection/source-link readback failed");
    }
    await db.query("commit");
    return {
      job_name: "ecl-synthetic-enterprise-v2-project",
      run_id: runId,
      assessment_id: manifest.assessment_id,
      source_set_hash: manifest.source_set_hash,
      readback_proof_uri: readbackUri,
      projection_hash: projectionHash,
      rows: rows.length,
      source_linked_rows: rows.length,
      row_types: Object.fromEntries(
        [...new Set(rows.map((row) => row.row_type))].map((type) => [
          type,
          count(type),
        ]),
      ),
      client_attestation_state: "not_client_attested",
      serving_state: "shadow_not_promoted",
      status: "passed",
    };
  } catch (error) {
    await db.query("rollback").catch(() => undefined);
    throw error;
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  const runId = process.env.ECL_SYNTHETIC_RUN_ID;
  const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const identity = process.env.ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID;
  const readbackUri = process.env.ECL_SYNTHETIC_READBACK_PROOF_URI;
  if (
    !databaseUrl ||
    !runId ||
    !account ||
    !identity ||
    !readbackUri ||
    process.env.ECL_SYNTHETIC_LAB_APPROVAL !== "accepted_lab" ||
    !process.env.ECL_SYNTHETIC_IMAGE_DIGEST?.includes("@sha256:")
  ) {
    throw new Error(
      "Projection requires approved synthetic job, pinned image and readback proof bindings",
    );
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(runId))
    throw new Error("Unsafe run ID");
  const pack = await generatePack("v2");
  try {
    const { manifest } = pack;
    const service = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      new ManagedIdentityCredential({ clientId: identity }),
    );
    const blobContainer = service.getContainerClient(containerName);
    const proofUrl = new URL(readbackUri);
    if (
      proofUrl.host !== `${account}.blob.core.windows.net` ||
      !proofUrl.pathname.startsWith(
        `/${containerName}/${manifest.tenant_key}/${manifest.assessment_id}/${manifest.source_set_hash}/runs/`,
      ) ||
      !proofUrl.pathname.endsWith("/readback.json")
    ) {
      throw new Error("Readback proof URI is outside the pinned source set");
    }
    const proofPath = decodeURIComponent(
      proofUrl.pathname.slice(containerName.length + 2),
    );
    const readback = JSON.parse(
      (
        await blobContainer.getBlockBlobClient(proofPath).downloadToBuffer()
      ).toString("utf8"),
    ) as ReadbackProof;
    if (
      readback.status !== "passed" ||
      readback.tenant_scope !== manifest.tenant_key ||
      readback.assessment_id !== manifest.assessment_id ||
      readback.source_set_hash !== manifest.source_set_hash ||
      readback.client_attestation_state !== "not_client_attested" ||
      readback.actual.applications !== 344 ||
      readback.actual.invalid_source_files !== 0 ||
      readback.actual.home_projection_manifests !== 0 ||
      process.env.ECL_SYNTHETIC_INPUT_SOURCE_VERSION !==
        manifest.source_set_hash
    ) {
      throw new Error(
        "Independent admission proof did not authorize this projection",
      );
    }
    const proofPathOut = `${manifest.tenant_key}/${manifest.assessment_id}/${manifest.source_set_hash}/runs/${runId}/projection-proof.json`;
    const projectionProofUri =
      blobContainer.getBlockBlobClient(proofPathOut).url;
    const db = new pg.Client({ connectionString: databaseUrl });
    await db.connect();
    try {
      const proof = await writeShadowHomeProjection(
        db,
        pack,
        readbackUri,
        runId,
        projectionProofUri,
      );
      await blobContainer
        .getBlockBlobClient(proofPathOut)
        .uploadData(Buffer.from(JSON.stringify(proof)), {
          conditions: { ifNoneMatch: "*" },
          blobHTTPHeaders: { blobContentType: "application/json" },
        });
      process.stdout.write(
        `${JSON.stringify({ ...proof, proof_uri: projectionProofUri })}\n`,
      );
    } finally {
      await db.end();
    }
  } finally {
    await rm(pack.dir, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

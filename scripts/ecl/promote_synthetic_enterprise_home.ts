#!/usr/bin/env tsx

/** Admit one independently proved synthetic Home projection for Home only. */

import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BlobServiceClient } from "@azure/storage-blob";
import { ManagedIdentityCredential } from "@azure/identity";
import pg from "pg";
import { buildHomeEnterpriseContext } from "../../src/lib/home/preview/ecl-enterprise-context";
import type { HomeProjectionRow } from "../../src/lib/home/preview/ecl-projection-bundle";
import { generatePack } from "./load_synthetic_enterprise_v1";

const containerName = "ecl-synthetic-intake";

type ProjectionProof = {
  status: string;
  assessment_id: string;
  source_set_hash: string;
  projection_hash: string;
  readback_proof_uri: string;
  rows: number;
  source_linked_rows: number;
  row_types: Record<string, number>;
  client_attestation_state: string;
  serving_state: string;
};

export function assertProjectionProof(
  proof: ProjectionProof,
  expected: { assessmentId: string; sourceSetHash: string },
): void {
  if (
    proof.status !== "passed" ||
    proof.assessment_id !== expected.assessmentId ||
    proof.source_set_hash !== expected.sourceSetHash ||
    proof.client_attestation_state !== "not_client_attested" ||
    proof.serving_state !== "shadow_not_promoted" ||
    !/^[a-f0-9]{64}$/.test(proof.projection_hash) ||
    proof.rows !== 3643 ||
    proof.source_linked_rows !== proof.rows ||
    proof.row_types.enterprise_profile !== 1 ||
    proof.row_types.business_segment !== 3 ||
    proof.row_types.business_function !== 14 ||
    proof.row_types.priority !== 5 ||
    proof.row_types.program !== 24 ||
    proof.row_types.application !== 344 ||
    proof.row_types.contract !== 230
  ) {
    throw new Error("Projection proof does not meet the Home admission contract");
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const identity = process.env.ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID;
  const runId = process.env.ECL_SYNTHETIC_RUN_ID;
  const projectionProofUri = process.env.ECL_SYNTHETIC_PROJECTION_PROOF_URI;
  const image = process.env.ECL_SYNTHETIC_IMAGE_DIGEST;
  const mode = process.env.ECL_SYNTHETIC_PROMOTION_MODE || "promote";
  if (
    !databaseUrl || !account || !identity || !runId || !projectionProofUri ||
    !["check", "promote"].includes(mode) ||
    process.env.ECL_SYNTHETIC_LAB_APPROVAL !== "accepted_lab" ||
    !image?.includes("@sha256:") ||
    image !== process.env.ABARVA_OPERATOR_IMAGE ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(runId)
  ) {
    throw new Error("Home admission requires a pinned, approved private job and projection proof");
  }

  const pack = await generatePack("v2");
  try {
    const { manifest } = pack;
    if (process.env.ECL_SYNTHETIC_INPUT_SOURCE_VERSION !== manifest.source_set_hash) {
      throw new Error("Home admission source version is not pinned");
    }
    const service = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      new ManagedIdentityCredential({ clientId: identity }),
    );
    const container = service.getContainerClient(containerName);
    const url = new URL(projectionProofUri);
    const prefix = `/${containerName}/${manifest.tenant_key}/${manifest.assessment_id}/${manifest.source_set_hash}/runs/`;
    if (
      url.host !== `${account}.blob.core.windows.net` ||
      !url.pathname.startsWith(prefix) ||
      !url.pathname.endsWith("/projection-proof.json") ||
      url.search
    ) {
      throw new Error("Projection proof URI is outside the pinned source set");
    }
    const pathInContainer = decodeURIComponent(
      url.pathname.slice(containerName.length + 2),
    );
    const proof = JSON.parse(
      (await container.getBlockBlobClient(pathInContainer).downloadToBuffer())
        .toString("utf8"),
    ) as ProjectionProof;
    assertProjectionProof(proof, {
      assessmentId: manifest.assessment_id,
      sourceSetHash: manifest.source_set_hash,
    });
    if (!proof.readback_proof_uri.includes(
      `/${containerName}/${manifest.tenant_key}/${manifest.assessment_id}/${manifest.source_set_hash}/runs/`,
    )) {
      throw new Error("Projection proof is not bound to the independent readback");
    }

    const db = new pg.Client({ connectionString: databaseUrl });
    await db.connect();
    try {
      await db.query("begin isolation level serializable");
      try {
        await db.query("select pg_advisory_xact_lock(hashtext($1))", [
          `home-assessment:${manifest.tenant_key}`,
        ]);
        const existing = await db.query<{
          assessment_id: string;
          projection_hash: string;
        }>(
          `select assessment_id, projection_hash
           from ecl_projection.home_active_assessment
           where tenant_key = $1 and state = 'active'`,
          [manifest.tenant_key],
        );
        if (existing.rows.length > 1 || (
          existing.rows.length === 1 && (
            existing.rows[0].assessment_id !== manifest.assessment_id ||
            existing.rows[0].projection_hash !== proof.projection_hash
          )
        )) {
          throw new Error("A different Home assessment is already active");
        }
        const manifests = await db.query<{
          id: string;
          row_count: number;
          projection_hash: string;
          proof_uri: string;
        }>(
          `select id::text, row_count, projection_hash, proof_uri
           from ecl_projection.projection_manifest
           where tenant_key = $1 and assessment_id = $2
             and projection_key = 'home_enterprise_landscape'
             and source_hash = $3 and projection_version = 1`,
          [manifest.tenant_key, manifest.assessment_id, manifest.source_set_hash],
        );
        if (
          manifests.rows.length !== 1 ||
          manifests.rows[0].row_count !== proof.rows ||
          manifests.rows[0].projection_hash !== proof.projection_hash ||
          manifests.rows[0].proof_uri !== projectionProofUri
        ) {
          throw new Error("Projection manifest does not match the independent proof");
        }
        const checks = await db.query<{
          rows: string;
          linked: string;
          applications: string;
          contracts: string;
          segments: string;
          functions: string;
          priorities: string;
          programs: string;
          bad_rows: string;
        }>(
          `select
             count(*)::text as rows,
             count(ref.source_record_id)::text as linked,
             count(*) filter (where p.row_type = 'application')::text as applications,
             count(*) filter (where p.row_type = 'contract')::text as contracts,
             count(*) filter (where p.row_type = 'business_segment')::text as segments,
             count(*) filter (where p.row_type = 'business_function')::text as functions,
             count(*) filter (where p.row_type = 'priority')::text as priorities,
             count(*) filter (where p.row_type = 'program')::text as programs,
             count(*) filter (where p.quality_state <> 'passed'
               or p.admission_status = 'refused'
               or ref.source_record_id is null
               or source.id is null)::text as bad_rows
           from ecl_projection.home_enterprise_landscape p
           left join ecl_projection.projection_entry_source_record_ref ref
             on ref.tenant_key = p.tenant_key
             and ref.assessment_id = p.assessment_id
             and ref.projection_entry_id = p.projection_entry_id
             and ref.source_hash = p.source_hash
           left join ecl_source.source_record source
             on source.tenant_key = ref.tenant_key
             and source.assessment_id = ref.assessment_id
             and source.id = ref.source_record_id
           where p.tenant_key = $1 and p.assessment_id = $2`,
          [manifest.tenant_key, manifest.assessment_id],
        );
        const actual = checks.rows[0];
        if (
          Number(actual.rows) !== proof.rows ||
          Number(actual.linked) !== proof.rows ||
          Number(actual.applications) !== 344 ||
          Number(actual.contracts) !== 230 ||
          Number(actual.segments) !== 3 ||
          Number(actual.functions) !== 14 ||
          Number(actual.priorities) !== 5 ||
          Number(actual.programs) !== 24 ||
          Number(actual.bad_rows) !== 0
        ) {
          throw new Error("Canonical Home rows or source links drifted before admission");
        }
        const serving = await db.query<{ apps: string; contracts: string; segments: string }>(
          `select
             (select count(*) from serving.home_applications_systems
               where tenant_key = $1 and assessment_id = $2)::text as apps,
             (select count(*) from serving.home_vendor_contracts
               where tenant_key = $1 and assessment_id = $2)::text as contracts,
             (select count(*) from serving.home_business_unit_profile
               where tenant_key = $1 and assessment_id = $2
                 and row_type = 'business_segment')::text as segments`,
          [manifest.tenant_key, manifest.assessment_id],
        );
        if (
          Number(serving.rows[0].apps) !== 344 ||
          Number(serving.rows[0].contracts) !== 230 ||
          Number(serving.rows[0].segments) !== 3
        ) {
          throw new Error("Home serving views do not expose the shadow assessment");
        }
        const contextRows = await db.query<HomeProjectionRow & {
          verified_source_record_id: string;
        }>(
          `select p.page_key, p.row_key, p.row_type, p.title, p.summary,
                  p.display_payload_json, p.projection_entry_id::text,
                  ref.source_record_id::text as verified_source_record_id
           from ecl_projection.home_enterprise_landscape p
           join ecl_projection.projection_entry_source_record_ref ref
             on ref.tenant_key = p.tenant_key
             and ref.assessment_id = p.assessment_id
             and ref.projection_entry_id = p.projection_entry_id
             and ref.source_hash = p.source_hash
           where p.tenant_key = $1 and p.assessment_id = $2`,
          [manifest.tenant_key, manifest.assessment_id],
        );
        const refsByEntry = new Map(
          contextRows.rows.map((row) => [
            row.projection_entry_id,
            row.verified_source_record_id,
          ]),
        );
        const context = buildHomeEnterpriseContext(
          contextRows.rows,
          (row) => {
            const ref = refsByEntry.get(row.projection_entry_id);
            return ref ? [ref] : [];
          },
        );
        if (
          !context ||
          contextRows.rows.length !== proof.rows ||
          context.segmentSpine.segments.length !== 3 ||
          context.functions.length !== 14 ||
          context.priorities.length !== 5 ||
          context.excludedUncitedRows !== 0
        ) {
          throw new Error("Home business spine cannot be built from the served projection");
        }
        if (mode === "promote" && existing.rows.length === 0) {
          const selected = await db.query(
            `insert into ecl_projection.home_active_assessment
             (tenant_key, assessment_id, projection_manifest_id, source_set_hash,
              projection_hash, projection_proof_uri, state)
             values ($1,$2,$3,$4,$5,$6,'active')
             on conflict (tenant_key, assessment_id) do update
             set state = 'active', retired_at = null, activated_at = now()
             where ecl_projection.home_active_assessment.state = 'retired'
               and ecl_projection.home_active_assessment.projection_manifest_id = excluded.projection_manifest_id
               and ecl_projection.home_active_assessment.source_set_hash = excluded.source_set_hash
               and ecl_projection.home_active_assessment.projection_hash = excluded.projection_hash
               and ecl_projection.home_active_assessment.projection_proof_uri = excluded.projection_proof_uri
             returning assessment_id`,
            [manifest.tenant_key, manifest.assessment_id, manifests.rows[0].id,
              manifest.source_set_hash, proof.projection_hash, projectionProofUri],
          );
          if (selected.rows.length !== 1) {
            throw new Error("Existing retired Home declaration has a different proof");
          }
        }
        await db.query("commit");
      } catch (error) {
        await db.query("rollback").catch(() => undefined);
        throw error;
      }
    } finally {
      await db.end();
    }
    const output = {
      job_name: mode === "check"
        ? "ecl-synthetic-enterprise-v2-check-home"
        : "ecl-synthetic-enterprise-v2-promote-home",
      run_id: runId,
      tenant_scope: manifest.tenant_key,
      assessment_id: manifest.assessment_id,
      source_set_hash: manifest.source_set_hash,
      projection_hash: proof.projection_hash,
      projection_proof_uri: projectionProofUri,
      serving_state: mode === "check" ? "shadow_verified" : "home_active",
      client_attestation_state: "not_client_attested",
      status: "passed",
    };
    const outputPath = `${manifest.tenant_key}/${manifest.assessment_id}/${manifest.source_set_hash}/runs/${runId}/${mode === "check" ? "home-preflight-proof.json" : "home-admission-proof.json"}`;
    const outputBlob = container.getBlockBlobClient(outputPath);
    await outputBlob.uploadData(Buffer.from(JSON.stringify(output)), {
      conditions: { ifNoneMatch: "*" },
      blobHTTPHeaders: { blobContentType: "application/json" },
    });
    process.stdout.write(`${JSON.stringify({ ...output, proof_uri: outputBlob.url })}\n`);
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

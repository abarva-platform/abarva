#!/usr/bin/env tsx

/** Post-commit, read-only admission proof for the versioned synthetic enterprise. */

import { BlobServiceClient } from "@azure/storage-blob";
import { ManagedIdentityCredential } from "@azure/identity";
import path from "node:path";
import pg from "pg";
import { isDirectInvocation } from "../exec/cli-entry.mjs";
import { generatePack } from "./load_synthetic_enterprise_v1";

type CountRow = Record<string, string>;

export function admissionIssues(
  actual: Record<string, number>,
  expected: Record<string, number>,
): string[] {
  return [...new Set([...Object.keys(expected), ...Object.keys(actual)])]
    .map((key) => [key, expected[key]] as const)
    .filter(([key, value]) => actual[key] !== value)
    .map(([key, value]) => `${key}: expected ${value}, read ${actual[key] ?? "missing"}`);
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  const runId = process.env.ECL_SYNTHETIC_RUN_ID;
  const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const identity = process.env.ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID;
  if (!connectionString || !runId || !account || !identity) {
    throw new Error("Readback requires database, run ID, storage account and managed identity");
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(runId)) {
    throw new Error("Unsafe run ID");
  }
  const pack = await generatePack("v2");
  const { manifest, normalized } = pack;
  const db = new pg.Client({ connectionString });
  await db.connect();
  try {
    await db.query("begin transaction isolation level repeatable read read only");
    const result = await db.query<CountRow>(`
      select
        (select count(*) from ecl_source.source_file
          where tenant_key = $1 and assessment_id = $2) as source_files,
        (select count(*) from ecl_source.source_record
          where tenant_key = $1 and assessment_id = $2) as source_records,
        (select count(*) from ecl_context.object
          where tenant_key = $1 and assessment_id = $2) as objects,
        (select count(*) from ecl_context.relationship
          where tenant_key = $1 and assessment_id = $2) as relationships,
        (select count(*) from ecl_context.application_v
          where tenant_key = $1 and assessment_id = $2) as applications,
        (select count(*) from ecl_context.object
          where tenant_key = $1 and assessment_id = $2 and object_type = 'application_module') as application_modules,
        (select count(*) from ecl_context.object
          where tenant_key = $1 and assessment_id = $2 and object_type = 'business_segment') as segments,
        (select count(*) from ecl_context.object
          where tenant_key = $1 and assessment_id = $2 and object_type = 'business_function') as functions,
        (select count(*) from ecl_context.object
          where tenant_key = $1 and assessment_id = $2 and object_type = 'strategic_priority') as priorities,
        (select count(*) from ecl_context.object
          where tenant_key = $1 and assessment_id = $2 and object_type = 'program') as programs,
        (select count(*) from ecl_context.relationship
          where tenant_key = $1 and assessment_id = $2 and relationship_type = 'BELONGS_TO_SEGMENT') as function_segment_edges,
        (select count(*) from ecl_context.relationship
          where tenant_key = $1 and assessment_id = $2 and relationship_type = 'ADVANCES_PRIORITY') as program_priority_edges,
        (select count(*) from ecl_context.object o
          left join ecl_source.source_record r
            on r.tenant_key = o.tenant_key and r.assessment_id = o.assessment_id
           and r.id = o.source_record_id
          where o.tenant_key = $1 and o.assessment_id = $2 and r.id is null) as missing_object_lineage,
        (select count(*) from ecl_context.relationship e
          left join ecl_source.source_record r
            on r.tenant_key = e.tenant_key and r.assessment_id = e.assessment_id
           and r.id = e.source_record_id
          where e.tenant_key = $1 and e.assessment_id = $2 and r.id is null) as missing_edge_lineage,
        (select count(*) from ecl_source.source_file
          where tenant_key = $1 and assessment_id = $2
            and (blob_uri !~ '^https://' or metadata_json->>'source_set_hash' is distinct from $3
              or metadata_json->>'synthetic_review_state' is distinct from 'accepted_lab'
              or quality_state <> 'accepted')) as invalid_source_files,
        (select count(*) from ecl_projection.projection_manifest
          where tenant_key = $1 and assessment_id = $2
            and projection_key = 'home_enterprise_landscape') as home_projection_manifests
    `, [manifest.tenant_key, manifest.assessment_id, manifest.source_set_hash]);
    const actual = Object.fromEntries(
      Object.entries(result.rows[0]).map(([key, value]) => [key, Number(value)]),
    );
    const typeCounts = await db.query<{ object_type: string; n: string }>(`
      select object_type, count(*) as n from ecl_context.object
      where tenant_key = $1 and assessment_id = $2 group by object_type
    `, [manifest.tenant_key, manifest.assessment_id]);
    const edgeCounts = await db.query<{ relationship_type: string; n: string }>(`
      select relationship_type, count(*) as n from ecl_context.relationship
      where tenant_key = $1 and assessment_id = $2 group by relationship_type
    `, [manifest.tenant_key, manifest.assessment_id]);
    const sourceCatalog = await db.query<{
      source_owner: string;
      file_name: string;
      file_hash: string;
    }>(`
      select source_owner, file_name, file_hash from ecl_source.source_file
      where tenant_key = $1 and assessment_id = $2
    `, [manifest.tenant_key, manifest.assessment_id]);
    await db.query("commit");
    const expected = {
      source_files: manifest.files.length,
      source_records: manifest.files.reduce((sum, file) => sum + file.row_count, 0),
      objects: normalized.objects.length,
      relationships: normalized.relationships.length,
      applications: normalized.objects.filter((object) => object.type === "application").length,
      application_modules: normalized.objects.filter((object) => object.type === "application_module").length,
      segments: 3,
      functions: 14,
      priorities: 5,
      programs: 24,
      function_segment_edges: normalized.relationships.filter((edge) => edge.type === "BELONGS_TO_SEGMENT").length,
      program_priority_edges: normalized.relationships.filter((edge) => edge.type === "ADVANCES_PRIORITY").length,
      missing_object_lineage: 0,
      missing_edge_lineage: 0,
      invalid_source_files: 0,
      home_projection_manifests: 0,
    };
    const issues = admissionIssues(actual, expected);
    const expectedFiles = Object.fromEntries(manifest.files.map((file) => [
      `${file.source_room_family}/${path.basename(file.file_path)}`, file.sha256,
    ]));
    const actualFiles = Object.fromEntries(sourceCatalog.rows.map((file) => [
      `${file.source_owner}/${file.file_name}`, file.file_hash,
    ]));
    for (const key of new Set([...Object.keys(expectedFiles), ...Object.keys(actualFiles)])) {
      if (actualFiles[key] !== expectedFiles[key]) issues.push(`source file hash drift: ${key}`);
    }
    const expectedObjectTypes: Record<string, number> = {};
    const expectedEdgeTypes: Record<string, number> = {};
    for (const object of normalized.objects) {
      expectedObjectTypes[object.type] = (expectedObjectTypes[object.type] ?? 0) + 1;
    }
    for (const edge of normalized.relationships) {
      expectedEdgeTypes[edge.type] = (expectedEdgeTypes[edge.type] ?? 0) + 1;
    }
    issues.push(...admissionIssues(
      Object.fromEntries(typeCounts.rows.map((row) => [row.object_type, Number(row.n)])),
      expectedObjectTypes,
    ).map((issue) => `object ${issue}`));
    issues.push(...admissionIssues(
      Object.fromEntries(edgeCounts.rows.map((row) => [row.relationship_type, Number(row.n)])),
      expectedEdgeTypes,
    ).map((issue) => `relationship ${issue}`));
    const proof = {
      job_name: "ecl-synthetic-enterprise-v2-readback",
      run_id: runId,
      tenant_scope: manifest.tenant_key,
      assessment_id: manifest.assessment_id,
      source_set_hash: manifest.source_set_hash,
      client_attestation_state: manifest.client_attestation_state,
      observed_at: new Date().toISOString(),
      actual,
      expected,
      unresolved_relationships: normalized.unresolved_relationships.map((edge) => edge.id),
      status: issues.length ? "failed" : "passed",
      issues,
      serving_state: "not_promoted",
    };
    const service = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      new ManagedIdentityCredential({ clientId: identity }),
    );
    const blob = service.getContainerClient("ecl-synthetic-intake").getBlockBlobClient(
      `${manifest.tenant_key}/${manifest.assessment_id}/${manifest.source_set_hash}/runs/${runId}/readback.json`,
    );
    await blob.uploadData(Buffer.from(JSON.stringify(proof)), {
      conditions: { ifNoneMatch: "*" },
      blobHTTPHeaders: { blobContentType: "application/json" },
    });
    process.stdout.write(`${JSON.stringify({ ...proof, proof_uri: blob.url })}\n`);
    if (issues.length) process.exitCode = 1;
  } catch (error) {
    await db.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await db.end();
    const { rm } = await import("node:fs/promises");
    await rm(pack.dir, { recursive: true, force: true });
  }
}

if (isDirectInvocation(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

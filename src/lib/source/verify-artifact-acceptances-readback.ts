// Proves the source_artifact_acceptances migration is not just applied but
// actually usable: calls the real repository functions
// (insertArtifactAcceptance / getLatestArtifactAcceptance), the same seam
// production code uses, rather than asserting on raw SQL. "Schema exists"
// and "application can use it" are different claims — this checks the
// second one, mirroring stage-guidebooks/verify-repository-readback.ts.
//
// Unlike the guidebooks readback (which only reads pre-seeded, tenant-
// independent data), this table has no seed data and is deeply tied to real
// event_id/artifact_id via FK CASCADE. To avoid ever writing a verification
// row against a REAL client's real artifact (which would show up in that
// client's live "Artifact status" panel), this script creates its own
// fully-synthetic, obviously-labeled source_events + source_artifacts rows
// under a nonexistent tenant key first, then accepts against those — never
// touching real tenant data. Nothing is deleted afterward (append-only
// philosophy); the fixture rows are harmless and easily identified by their
// tenant key / naming if ever inspected.
//
// Run with NODE_OPTIONS=--conditions=react-server (this module and its
// dependencies import "server-only", a Next.js build-time guard, not a
// runtime one; the react-server condition satisfies it outside the
// Next.js server-component tree).

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  insertArtifactAcceptance,
  getLatestArtifactAcceptance,
} from "@/lib/source/artifact-acceptances";

const VERIFY_TENANT_KEY = "db-migration-lab-verification-nonexistent-tenant";

async function main() {
  const db = getAzureWriteFluentClient();

  const { data: event, error: eventError } = await db
    .from("source_events")
    .insert({
      client_key: VERIFY_TENANT_KEY,
      event_code: "DB-MIGRATION-LAB-VERIFY",
      event_name: "db-migration-lab verification fixture — safe to ignore",
      current_stage_key: "responses",
    })
    .select("id")
    .single<{ id: string }>();
  if (eventError || !event) {
    console.error("x Failed to create the synthetic verification event.");
    console.error(eventError);
    process.exit(1);
    return;
  }

  const { data: artifact, error: artifactError } = await db
    .from("source_artifacts")
    .insert({
      client_id: "00000000-0000-0000-0000-000000000000",
      tenant_key: VERIFY_TENANT_KEY,
      source_event_id: event.id,
      artifact_type: "db_migration_lab_verify",
      title: "db-migration-lab verification fixture — safe to ignore",
      file_name: "db-migration-lab-verify.txt",
      file_format: "txt",
      blob_container: "verify",
      blob_path: "verify/db-migration-lab-verify.txt",
      status: "approved",
      approved_by: "db-migration-lab",
    })
    .select("id")
    .single<{ id: string }>();
  if (artifactError || !artifact) {
    console.error("x Failed to create the synthetic verification artifact.");
    console.error(artifactError);
    process.exit(1);
    return;
  }

  const write = await insertArtifactAcceptance({
    artifactId: artifact.id,
    eventId: event.id,
    stageKey: "responses",
    artifactState: "approved_for_external_use",
    authoritativeVersionId: artifact.id,
    artifactRole: "evidence",
    contentDriftStatus: "unknown",
    gatePreconditionStatus: "waived",
    downstreamContextPolicy: "exclude",
    diffSummary: null,
    approvalRationale:
      "db-migration-lab automated repository readback — not a real acceptance.",
    acceptedBy: "db-migration-lab",
  });
  if (!write.ok) {
    console.error("x insertArtifactAcceptance failed.");
    console.error(write.error);
    process.exit(1);
    return;
  }

  const readBack = await getLatestArtifactAcceptance(artifact.id);
  if (!readBack) {
    console.error(
      "x getLatestArtifactAcceptance returned null — the row just inserted was not readable through the repository function.",
    );
    process.exit(1);
    return;
  }

  const problems: string[] = [];
  if (readBack.id !== write.record.id) problems.push(`id mismatch: ${readBack.id}`);
  if (readBack.artifactId !== artifact.id) problems.push(`artifactId mismatch: ${readBack.artifactId}`);
  if (readBack.eventId !== event.id) problems.push(`eventId mismatch: ${readBack.eventId}`);
  if (readBack.artifactState !== "approved_for_external_use") {
    problems.push(`artifactState mismatch: ${readBack.artifactState}`);
  }
  if (readBack.contentDriftStatus !== "unknown") {
    problems.push(`contentDriftStatus mismatch: ${readBack.contentDriftStatus}`);
  }
  if (readBack.gatePreconditionStatus !== "waived") {
    problems.push(`gatePreconditionStatus mismatch: ${readBack.gatePreconditionStatus}`);
  }
  if (readBack.downstreamContextPolicy !== "exclude") {
    problems.push(`downstreamContextPolicy mismatch: ${readBack.downstreamContextPolicy}`);
  }
  if (!readBack.approvalRationale) problems.push("approvalRationale is empty");

  if (problems.length > 0) {
    console.error("x Repository readback returned a record, but it failed shape checks:");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
    return;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        verificationEventId: event.id,
        verificationArtifactId: artifact.id,
        acceptanceId: readBack.id,
        artifactState: readBack.artifactState,
        acceptedBy: readBack.acceptedBy,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("x Repository readback threw.");
  console.error(error);
  process.exit(1);
});

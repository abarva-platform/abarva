// Source File Cabinet — persistence service.
//
// The single durable path for any Source artifact: render bytes (caller) → upload to
// Azure Blob → create a versioned Postgres metadata row (superseding the prior current
// version) → return the record for the File Cabinet. Collaborators are injectable so the
// versioning/upload orchestration is unit-tested without Blob/DB.

import "server-only";

import { createHash } from "node:crypto";
import {
  getCurrentArtifacts as defaultGetCurrent,
  insertSourceArtifact as defaultInsert,
  supersedePriorVersions as defaultSupersede,
} from "./repository";
import {
  locationForGroup as defaultLocationForGroup,
  uploadArtifactBytes as defaultUpload,
} from "./blob-store";
import type { PersistArtifactInput, SourceArtifactRecord } from "./types";

export interface PersistArtifactDeps {
  getCurrent?: typeof defaultGetCurrent;
  insert?: typeof defaultInsert;
  supersede?: typeof defaultSupersede;
  upload?: typeof defaultUpload;
  locationForGroup?: typeof defaultLocationForGroup;
}

/**
 * Persist one artifact version durably. Computes the next version for the
 * (event, artifact_type, group), uploads bytes to Blob at the versioned canonical path,
 * inserts the metadata row, and supersedes prior current versions.
 */
export async function persistSourceArtifact(
  input: PersistArtifactInput,
  deps: PersistArtifactDeps = {},
): Promise<SourceArtifactRecord> {
  const getCurrent = deps.getCurrent ?? defaultGetCurrent;
  const insert = deps.insert ?? defaultInsert;
  const supersede = deps.supersede ?? defaultSupersede;
  const upload = deps.upload ?? defaultUpload;
  const buildLocation = deps.locationForGroup ?? defaultLocationForGroup;

  const prior = await getCurrent(
    input.sourceEventId,
    input.artifactType,
    input.artifactGroup,
  );
  const priorMaxVersion = prior.reduce((m, p) => Math.max(m, p.version), 0);
  const version = priorMaxVersion + 1;
  const priorId = prior.length ? prior[0].id : null;

  const location = buildLocation({
    group: input.artifactGroup,
    tenantKey: input.tenantKey,
    sourceEventId: input.sourceEventId,
    artifactType: input.artifactType,
    version,
    fileName: input.fileName,
    ...(input.artifactFamily ? { artifactFamily: input.artifactFamily } : {}),
  });

  const sha = createHash("sha256").update(input.bytes).digest("hex");
  await upload(location, input.bytes, input.fileFormat, {
    tenantKey: input.tenantKey,
    sourceEventId: input.sourceEventId,
    artifactType: input.artifactType,
    version: String(version),
  });

  const record = await insert({
    clientId: input.clientId,
    tenantKey: input.tenantKey,
    sourceEventId: input.sourceEventId,
    sourcingStage: input.sourcingStage ?? null,
    artifactGroup: input.artifactGroup,
    artifactType: input.artifactType,
    artifactFamily: input.artifactFamily ?? null,
    title: input.title,
    description: input.description ?? null,
    fileName: input.fileName,
    fileFormat: input.fileFormat,
    blobContainer: location.bucket,
    blobPath: location.path,
    fileSize: input.bytes.length,
    version,
    status: input.status ?? "draft",
    generatedBy: input.generatedBy ?? null,
    sourceBasis: input.sourceBasis ?? null,
    confidence: input.confidence ?? null,
    citationReady: input.citationReady ?? false,
    evidenceFamiliesUsed: input.evidenceFamiliesUsed ?? [],
    sourceRegisterId: input.sourceRegisterId ?? null,
    contextBundleTraceId: input.contextBundleTraceId ?? null,
    missingInputs: input.missingInputs ?? [],
    clientCompleteItems: input.clientCompleteItems ?? [],
    assumptions: input.assumptions ?? [],
    supersedesArtifactId: priorId,
    blobSha256: sha,
    isClientFinal: input.isClientFinal ?? false,
    isCurrentAuthoritative: input.isCurrentAuthoritative ?? false,
    sourceGeneratedArtifactId: input.sourceGeneratedArtifactId ?? null,
    clientFinalUploadedBy: input.clientFinalUploadedBy ?? null,
    clientFinalUploadedAt: input.clientFinalUploadedAt ?? null,
    clientFinalAcceptedBy: input.clientFinalAcceptedBy ?? null,
    clientFinalAcceptedAt: input.clientFinalAcceptedAt ?? null,
    clientFinalNote: input.clientFinalNote ?? null,
    clientFinalReviewMeetingDate: input.clientFinalReviewMeetingDate ?? null,
    clientFinalStakeholderGroup: input.clientFinalStakeholderGroup ?? null,
    clientFinalChangeSummary: input.clientFinalChangeSummary ?? {},
  });

  if (priorId) {
    await supersede(
      input.sourceEventId,
      input.artifactType,
      input.artifactGroup,
      record.id,
    );
  }

  return record;
}

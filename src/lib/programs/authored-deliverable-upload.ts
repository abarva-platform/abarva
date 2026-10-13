import "server-only";
import { createHash } from "node:crypto";
import { canonicalTenantKey } from "@/lib/tenant-keys";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { createAzureProgramsWriteAdapter } from "@/lib/data-plane/write-adapters/programsWriteAdapter";
import { parseIngestionDocument } from "@/lib/ingestion/document-upload-parser";
import { assessMoveUploadSensitivity } from "./current-state-doc-ingest";
import { extractProgramEvidenceFromUploadBuffer } from "./evidence-ingestion";
import { DELIVERABLE_REGISTRY } from "./deliverable-registry";
import { loadApprovedMoveEvidenceSnapshot, approvedMoveEvidenceRevisionForPhase, isApprovedMoveEvidenceBasisCurrent } from "./approved-move-evidence-snapshot";
import { downloadArtifactOutcome, getMoveArtifactForTenant, saveMoveArtifact } from "./deliverables/move-artifacts";
import type { TenancyCtx } from "./types.db";

import { AUTHORED_P1_UPLOAD_FLAG, AUTHORED_DOCX_MIME, readAuthoredUploadReceipt,
  type AuthoredUploadReceipt, type AuthoredP1Key, type AuthoredAdmissionResponse } from "./authored-deliverable-receipt";
export { AUTHORED_P1_UPLOAD_FLAG, AUTHORED_DOCX_MIME, readAuthoredUploadReceipt };
export type { AuthoredUploadReceipt, AuthoredP1Key, AuthoredAdmissionResponse };

export class AuthoredUploadRefusal extends Error {
  constructor(public readonly code: string, public readonly status: number, detail: string,
    public readonly storedArtifactId: string | null = null) { super(detail); }
}

const hash = (body: Buffer) => createHash("sha256").update(body).digest("hex");
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const checksum = /^[0-9a-f]{64}$/;

export async function verifyAuthoredUploadFile(ctx: TenancyCtx, r: AuthoredUploadReceipt): Promise<string> {
  if (r.tenantKey !== canonicalTenantKey(ctx.clientKey) || canonicalTenantKey(r.storageTenantKey) !== r.tenantKey || r.storageTenantKey !== ctx.clientKey || r.moveId.length === 0) {
    throw new AuthoredUploadRefusal("authored_file_scope_changed", 409, "The authored file scope cannot be verified.");
  }
  const scoped = ctx;
  const artifact = await getMoveArtifactForTenant(scoped, r.artifactId);
  const meta = artifact?.metadata as Record<string, unknown> | null;
  if (!artifact || artifact.move_id !== r.moveId || artifact.phase !== 1 || artifact.file_format !== "docx" ||
    artifact.version !== r.artifactVersion || meta?.sha256 !== r.sha256 || meta?.storage !== "azure_blob" ||
    meta?.authoredRequestId !== r.requestId || meta?.canonicalDeliverableKey !== r.deliverableTypeKey ||
    meta?.authoredOrigin !== r.origin) {
    throw new AuthoredUploadRefusal("authored_file_receipt_changed", 409, "The exact stored authored file no longer matches this document version.");
  }
  const downloaded = await downloadArtifactOutcome(scoped, r.artifactId, r.moveId);
  if (!downloaded.ok) throw new AuthoredUploadRefusal("authored_file_unavailable", 503, "The uploaded original must be readable before this document can be reviewed.");
  if (downloaded.file.fileFormat !== "docx" || hash(downloaded.file.bytes) !== r.sha256) {
    throw new AuthoredUploadRefusal("authored_file_hash_changed", 409, "The downloaded original does not match the reviewed file hash.");
  }
  const parsed = await extractProgramEvidenceFromUploadBuffer({ filename: downloaded.file.fileName,
    mimeType: AUTHORED_DOCX_MIME, buffer: downloaded.file.bytes, cacheScope: `authored:${r.moveId}:${r.sha256}` });
  if (!parsed.extractedText?.trim()) throw new AuthoredUploadRefusal("authored_file_not_extractable", 422, "The uploaded original has no extractable document text.");
  return parsed.extractedText.trim();
}

export async function verifyAuthoredApproval(ctx: TenancyCtx, args: {
  moveId: string; key: string; content: string; receipt: unknown;
}): Promise<AuthoredUploadReceipt> {
  const r = readAuthoredUploadReceipt(args.receipt);
  if (!r || r.moveId !== args.moveId || r.deliverableTypeKey !== args.key) {
    throw new AuthoredUploadRefusal("authored_file_receipt_invalid", 409, "This authored document has no complete file receipt.");
  }
  if (await verifyAuthoredUploadFile(ctx, r) !== args.content.trim()) {
    throw new AuthoredUploadRefusal("authored_content_changed", 409, "The document text differs from its exact uploaded original.");
  }
  const snapshot = await loadApprovedMoveEvidenceSnapshot({ tenantKey: r.tenantKey, moveId: r.moveId }).catch(() => null);
  if (!snapshot || !r.phaseEvidenceSnapshotHash || !isApprovedMoveEvidenceBasisCurrent({ snapshot, phase: 1,
    recordedRevision: r.phaseEvidenceSnapshotHash, scope: "phase", generatedAt: r.observedAt })) {
    throw new AuthoredUploadRefusal("authored_evidence_basis_not_current", 409,
      "The current approved evidence basis must match the authored draft before approval. Review a current file and evidence basis first.");
  }
  return r;
}

export async function admitAuthoredP1Draft(ctx: TenancyCtx, input: {
  moveId: string; key: string; requestId: string; expectedState: string; expectedFileSha256: string;
  fileName: string; mimeType: string; body: Buffer; delegatedReviewReference?: string;
  canStoreText: (text: string) => boolean;
}): Promise<AuthoredAdmissionResponse> {
  const tenantKey = canonicalTenantKey(ctx.clientKey);
  const spec = DELIVERABLE_REGISTRY.find(s => s.deliverableTypeKey === input.key && s.phase === 1 && !s.deprecated);
  if (!spec || (input.key !== "charter" && input.key !== "discovery_plan"))
    throw new AuthoredUploadRefusal("authored_key_not_declared", 422, "Choose a declared P1 Charter or Discovery Workshop Guide.");
  if (!tenantKey || !uuid.test(input.moveId) || !uuid.test(input.requestId) || input.expectedState !== "absent" || !checksum.test(input.expectedFileSha256))
    throw new AuthoredUploadRefusal("authored_request_invalid", 400, "An absent-document request ID and exact file hash are required.");
  if (!/\.docx$/i.test(input.fileName) || input.mimeType !== AUTHORED_DOCX_MIME || input.body.length > 20 * 1024 * 1024 || input.body.length === 0)
    throw new AuthoredUploadRefusal("authored_docx_required", 415, "Select an editable DOCX file of at most 20 MB.");
  const sha256 = hash(input.body);
  if (sha256 !== input.expectedFileSha256) throw new AuthoredUploadRefusal("authored_hash_mismatch", 409, "The selected file differs from the reviewed hash.");
  try { await parseIngestionDocument({ filename: input.fileName, mimeType: input.mimeType, bytes: input.body }); }
  catch { throw new AuthoredUploadRefusal("authored_docx_invalid", 422, "The file is not a readable DOCX package."); }
  const protection = await assessMoveUploadSensitivity({ filename: input.fileName, mimeType: input.mimeType, buffer: input.body });
  if (protection.decision === "quarantine") throw new AuthoredUploadRefusal("sensitive_data_quarantined", 422, "This file needs the governed sensitive-data intake lane; nothing was admitted.");
  const parsed = await extractProgramEvidenceFromUploadBuffer({ filename: input.fileName, mimeType: input.mimeType, buffer: input.body,
    cacheScope: `authored:${input.requestId}:${sha256}` });
  if (!parsed.extractedText?.trim()) throw new AuthoredUploadRefusal("authored_file_not_extractable", 422, "The DOCX must contain extractable authored text.");
  if (!input.canStoreText(parsed.extractedText.trim())) throw new AuthoredUploadRefusal("authored_output_visibility_refused", 403,
    "This file contains content outside the permitted document visibility. Use the governed intake lane.");
  return persistAuthoredDraft(ctx, { ...input, key: input.key, tenantKey, title: spec.documentTitle,
    sha256, content: parsed.extractedText.trim(), parseMethod: String(parsed.extractedStructured.parse_method) });
}

async function persistAuthoredDraft(ctx: TenancyCtx, input: {
  moveId: string; key: AuthoredP1Key; tenantKey: string; title: string; requestId: string; sha256: string;
  content: string; parseMethod: string; fileName: string; body: Buffer; delegatedReviewReference?: string;
}): Promise<AuthoredAdmissionResponse> {
  const sb = getAzureWriteFluentClient();
  const scoped = ctx;
  const { data: existing, error } = await sb.from("deliverables_v2")
    .select("id, current_version, deliverable_versions(id, version, structured_data)")
    .eq("engagement_id", input.moveId).eq("deliverable_type_key", input.key);
  if (error || !Array.isArray(existing) || existing.length > 1)
    throw new AuthoredUploadRefusal("authored_inventory_unavailable", 503, "The document inventory could not be verified. No new file was stored.");
  const current = existing[0] as { id: string; current_version: number; deliverable_versions: Array<{ id: string; version: number; structured_data: Record<string, unknown> }> } | undefined;
  const replay = current?.deliverable_versions?.find(v => {
    const r = readAuthoredUploadReceipt(v.structured_data?.authoredUpload);
    return r?.requestId === input.requestId && r.sha256 === input.sha256 && r.uploadedBy === ctx.userId &&
      r.moveId === input.moveId && r.deliverableTypeKey === input.key && r.tenantKey === input.tenantKey;
  });
  if (current) {
    if (!replay) throw new AuthoredUploadRefusal("authored_document_exists", 409, "This document already has a version. Open its existing review and replacement flow.");
    const receipt = readAuthoredUploadReceipt(replay.structured_data.authoredUpload)!;
    await verifyAuthoredUploadFile(ctx, receipt);
    return admissionResponse(current.id, replay.id, current.current_version, replay.version, receipt, true);
  }
  const snapshot = await loadApprovedMoveEvidenceSnapshot({ tenantKey: input.tenantKey, moveId: input.moveId }).catch(() => null);
  const observedAt = new Date().toISOString();
  const artifactType = `${input.key}_authored_${input.requestId}`;
  const { data: retained, error: retainedError } = await sb.from("move_artifacts").select("artifact_id, version, blob_sha256, metadata")
    .eq("tenant_key", ctx.clientKey).eq("move_id", input.moveId).eq("artifact_type", artifactType).eq("lifecycle_state", "current").maybeSingle();
  if (retainedError) throw new AuthoredUploadRefusal("authored_storage_read_unavailable", 503, "Prior upload storage could not be verified. Keep this request and retry the read.");
  const fileName = `${input.requestId}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100)}`;
  let stored: { artifactId: string; version: number; blobStored: boolean };
  if (retained) {
    const r = retained as { artifact_id: string; version: number; blob_sha256: string; metadata: Record<string, unknown> };
    if (r.blob_sha256 !== input.sha256 || r.metadata.authoredUploadedBy !== ctx.userId || r.metadata.storage !== "azure_blob")
      throw new AuthoredUploadRefusal("authored_replay_mismatch", 409, "This request is already bound to different upload bytes or an uploader.", r.artifact_id);
    stored = { artifactId: r.artifact_id, version: r.version, blobStored: true };
  } else {
    try { stored = await saveMoveArtifact(scoped, { moveId: input.moveId, phase: 1, artifactType,
      artifactFamily: "generated_deliverable", title: `${input.title} — authored draft`, fileName, fileFormat: "docx", body: input.body,
      status: "draft", sourceBasis: "client_upload", confidence: "unreviewed", citationReady: false, requireBlobStored: true,
      metadata: { canonicalDeliverableKey: input.key, authoredRequestId: input.requestId, authoredOrigin: "abarva_uploaded",
        authoredUploadedBy: ctx.userId, authoringBasis: "abarva_authored_unsigned", originalFileName: input.fileName } }); }
    catch { throw new AuthoredUploadRefusal("authored_storage_unavailable", 503, "Original-file storage or registration could not be confirmed. No document admission is claimed; keep this request and check storage before retrying."); }
  }
  if (!stored.blobStored) throw new AuthoredUploadRefusal("authored_storage_unavailable", 503,
    "The upload has a record, but original-byte storage was not confirmed. No document was admitted.", stored.artifactId);
  const receipt: AuthoredUploadReceipt = { source: "authored_docx_upload", origin: "abarva_uploaded", tenantKey: input.tenantKey, storageTenantKey: ctx.clientKey!,
    moveId: input.moveId, deliverableTypeKey: input.key, phase: 1, requestId: input.requestId, sha256: input.sha256,
    artifactId: stored.artifactId, artifactVersion: stored.version, uploadedBy: ctx.userId, authoringBasis: "abarva_authored_unsigned",
    delegatedReviewReference: input.delegatedReviewReference?.trim().slice(0, 200) || null, originalFileName: input.fileName,
    parseMethod: input.parseMethod, evidenceSnapshotHash: snapshot?.revision ?? null,
    phaseEvidenceSnapshotHash: snapshot ? approvedMoveEvidenceRevisionForPhase(snapshot, 1) : null,
    evidenceSnapshotScope: "phase", observedAt };
  try { await verifyAuthoredUploadFile(ctx, receipt); }
  catch { throw new AuthoredUploadRefusal("authored_stored_file_unverified", 503,
    "The upload has a storage record, but its original bytes could not be verified. Document admission was withheld; keep this request and check storage.", stored.artifactId); }
  const written = await createAzureProgramsWriteAdapter().runInitialAuthoredDeliverable({ programId: input.moveId,
    clientId: ctx.clientId, title: input.title, content: input.content, receipt });
  if (!written.ok || !written.data) throw new AuthoredUploadRefusal("authored_admission_unavailable", 503,
    "The original file is retained, but document admission could not be confirmed. Keep this request and check the current document before retrying.", stored.artifactId);
  if (written.data.kind === "conflict") throw new AuthoredUploadRefusal("authored_document_exists", 409,
    "The original file is retained, but another document version now exists. Open that version; this upload was not admitted.", stored.artifactId);
  if (written.data.kind === "replay") await verifyAuthoredUploadFile(ctx, written.data.receipt);
  return admissionResponse(written.data.deliverableId, written.data.versionId, written.data.currentVersion,
    written.data.version, written.data.receipt, written.data.kind === "replay");
}

function admissionResponse(deliverableId: string, versionId: string, currentVersion: number, version: number,
  r: AuthoredUploadReceipt, replayed: boolean): AuthoredAdmissionResponse {
  return { deliverableId, deliverableVersionId: versionId, currentVersion, admittedVersion: version,
    artifactId: r.artifactId, artifactVersion: r.artifactVersion, sha256: r.sha256, storage: "azure_blob",
    origin: r.origin, replayed, originalDownloadUrl: `/api/v1/programs/${r.moveId}/artifacts/${r.artifactId}/download` };
}

import "server-only";
import { createHash } from "node:crypto";
import { canonicalTenantKey } from "@/lib/tenant-keys";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { createAzureProgramsWriteAdapter } from "@/lib/data-plane/write-adapters/programsWriteAdapter";
import { parseIngestionDocument } from "@/lib/ingestion/document-upload-parser";
import { assessExtractedTextSensitivity, assessMoveUploadSensitivity } from "./current-state-doc-ingest";
import { extractProgramEvidenceFromUploadBuffer } from "./evidence-ingestion";
import { DELIVERABLE_REGISTRY } from "./deliverable-registry";
import { loadApprovedMoveEvidenceSnapshot, approvedMoveEvidenceRevisionForPhase, isApprovedMoveEvidenceBasisCurrent } from "./approved-move-evidence-snapshot";
import { downloadArtifactOutcome, getMoveArtifactForTenant, saveMoveArtifact } from "./deliverables/move-artifacts";
import type { TenancyCtx } from "./types.db";
import { AUTHORED_P1_UPLOAD_FLAG, AUTHORED_P2_UPLOAD_FLAG, AUTHORED_DOCX_MIME, AUTHORED_PPTX_MIME,
  authoredDocumentSpec, authoredUploadFlag, readAuthoredUploadReceipt,
  type AuthoredUploadReceipt, type AuthoredP1Key, type AuthoredDocumentKey,
  type AuthoredCompanionReceipt, type AuthoredOfficeFormat, type AuthoredAdmissionResponse } from "./authored-deliverable-receipt";
export { AUTHORED_P1_UPLOAD_FLAG, AUTHORED_P2_UPLOAD_FLAG, AUTHORED_DOCX_MIME, AUTHORED_PPTX_MIME,
  authoredDocumentSpec, authoredUploadFlag, readAuthoredUploadReceipt };
export type { AuthoredUploadReceipt, AuthoredP1Key, AuthoredDocumentKey, AuthoredAdmissionResponse };

type RetainedOriginal = { fileRole: "primary" | "diagnostic_word"; artifactId: string; artifactVersion: number; sha256: string; blobStored: boolean };
export class AuthoredUploadRefusal extends Error {
  constructor(public readonly code: string, public readonly status: number, detail: string,
    public readonly storedArtifactId: string | null = null, public readonly retainedOriginals?: RetainedOriginal[]) { super(detail); }
}

const hash = (body: Buffer) => createHash("sha256").update(body).digest("hex");
const textHash = (text: string) => hash(Buffer.from(text, "utf8"));
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const checksum = /^[0-9a-f]{64}$/;
const mimeFor = (format: AuthoredOfficeFormat) => format === "docx" ? AUTHORED_DOCX_MIME : AUTHORED_PPTX_MIME;
type FileInput = { fileName: string; mimeType: string; body: Buffer; expectedFileSha256: string };
type ParsedFile = FileInput & { sha256: string; content: string; parseMethod: string; fileFormat: AuthoredOfficeFormat };
type DraftInput = FileInput & { phase: 1 | 2; moveId: string; key: string; requestId: string; expectedState: string;
  delegatedReviewReference?: string; companionFile?: FileInput; canStoreText: (text: string) => boolean };

/** Decoded package text is a visibility check only; it is never model context. */
async function checkOfficeScope(body: Buffer, fileName: string, mimeType: string, canStoreText: (text: string) => boolean) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(body);
  const parts: string[] = [];
  let length = 0;
  for (const entry of Object.values(zip.files).filter(f => !f.dir && /\.xml$/i.test(f.name))) {
    const xml = await entry.async("string");
    const attributes = [...xml.matchAll(/\b(?:name|title|descr|author|authorName|email)=["']([^"']*)["']/g)].map(x => x[1]);
    const text = [xml.replace(/<[^>]*>/g, " "), ...attributes].join(" ")
      .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) => {
        const value = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
        return value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : "";
      }).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    length += text.length;
    if (length > 2_000_000) throw new AuthoredUploadRefusal("authored_package_text_too_large", 422, "The complete Office text exceeds the bounded review limit.");
    parts.push(text);
  }
  const scope = parts.join("\n");
  if (assessExtractedTextSensitivity(scope, { filename: fileName, mimeType }).decision === "quarantine")
    throw new AuthoredUploadRefusal("sensitive_data_quarantined", 422, "This file needs the governed sensitive-data intake lane; nothing was admitted.");
  if (!canStoreText(scope)) throw new AuthoredUploadRefusal("authored_output_visibility_refused", 403,
    "This file contains content outside the permitted document visibility. Use the governed intake lane.");
}

async function parseOriginal(input: FileInput, format: AuthoredOfficeFormat, phase: 1 | 2,
  canStoreText: (text: string) => boolean, cacheScope: string): Promise<ParsedFile> {
  if (!new RegExp(`\\.${format}$`, "i").test(input.fileName) || input.mimeType !== mimeFor(format) ||
    input.body.length > 20 * 1024 * 1024 || input.body.length === 0)
    throw new AuthoredUploadRefusal(format === "docx" ? "authored_docx_required" : "authored_pptx_required", 415,
      `Select an editable ${format.toUpperCase()} file of at most 20 MB.`);
  if (!checksum.test(input.expectedFileSha256)) throw new AuthoredUploadRefusal("authored_request_invalid", 400, "An exact file hash is required for every original.");
  const sha256 = hash(input.body);
  if (sha256 !== input.expectedFileSha256) throw new AuthoredUploadRefusal("authored_hash_mismatch", 409, "The selected file differs from the reviewed hash.");
  let parsed;
  try { parsed = await parseIngestionDocument({ filename: input.fileName, mimeType: input.mimeType, bytes: input.body }); }
  catch { throw new AuthoredUploadRefusal(format === "docx" ? "authored_docx_invalid" : "authored_pptx_invalid", 422,
    `The file is not a readable ${format.toUpperCase()} package.`); }
  if (phase === 2 && (parsed.metadata.truncated || parsed.warnings.some(w => /truncat/i.test(w))))
    throw new AuthoredUploadRefusal("authored_extraction_incomplete", 422, "The entire authored file must be extractable before admission.");
  const protection = await assessMoveUploadSensitivity({ filename: input.fileName, mimeType: input.mimeType, buffer: input.body });
  if (protection.decision === "quarantine") throw new AuthoredUploadRefusal("sensitive_data_quarantined", 422, "This file needs the governed sensitive-data intake lane; nothing was admitted.");
  if (phase === 2) await checkOfficeScope(input.body, input.fileName, input.mimeType, canStoreText);
  if (phase === 2) {
    if (!parsed.text?.trim() || typeof parsed.parseMethod !== "string" || !parsed.parseMethod.trim())
      throw new AuthoredUploadRefusal("authored_extraction_incomplete", 422, "A complete Office text and parser receipt are required before admission.");
    if (!canStoreText(parsed.text.trim())) throw new AuthoredUploadRefusal("authored_output_visibility_refused", 403,
      "This file contains content outside the permitted document visibility. Use the governed intake lane.");
    return { ...input, sha256, content: parsed.text.trim(), fileFormat: format, parseMethod: parsed.parseMethod };
  }
  const extracted = await extractProgramEvidenceFromUploadBuffer({ filename: input.fileName, mimeType: input.mimeType, buffer: input.body, cacheScope });
  if (!extracted.extractedText?.trim()) throw new AuthoredUploadRefusal("authored_file_not_extractable", 422,
    phase === 1 ? "The DOCX must contain extractable authored text." : "Every Office original must contain extractable authored text.");
  if (!canStoreText(extracted.extractedText.trim())) throw new AuthoredUploadRefusal("authored_output_visibility_refused", 403,
    "This file contains content outside the permitted document visibility. Use the governed intake lane.");
  return { ...input, sha256, content: extracted.extractedText.trim(), fileFormat: format,
    parseMethod: String(extracted.extractedStructured.parse_method) };
}

function packageContent(primary: string, companion?: string) {
  return companion === undefined ? primary : `## Authored presentation\n${primary}\n\n## Current-state Word record\n${companion}`;
}

async function verifyOriginal(ctx: TenancyCtx, r: AuthoredUploadReceipt, original: {
  artifactId: string; artifactVersion: number; sha256: string; parseMethod: string; textSha256?: string;
}, format: AuthoredOfficeFormat, role: "primary" | "diagnostic_word", canStoreText?: (text: string) => boolean) {
  const artifact = await getMoveArtifactForTenant(ctx, original.artifactId);
  const meta = artifact?.metadata as Record<string, unknown> | null;
  if (!artifact || artifact.move_id !== r.moveId || artifact.phase !== r.phase || artifact.file_format !== format ||
    artifact.version !== original.artifactVersion || meta?.sha256 !== original.sha256 || meta?.storage !== "azure_blob" ||
    meta?.authoredRequestId !== r.requestId || meta?.canonicalDeliverableKey !== r.deliverableTypeKey || meta?.authoredOrigin !== r.origin ||
    (r.phase === 2 && (meta?.authoredFileRole !== role || meta?.authoredUploadedBy !== r.uploadedBy || meta?.authoredTextSha256 !== original.textSha256)))
    throw new AuthoredUploadRefusal("authored_file_receipt_changed", 409, "The exact stored authored file no longer matches this document version.");
  const downloaded = await downloadArtifactOutcome(ctx, original.artifactId, r.moveId);
  if (!downloaded.ok) throw new AuthoredUploadRefusal("authored_file_unavailable", 503, "The uploaded original must be readable before this document can be reviewed.");
  if (downloaded.file.fileFormat !== format || hash(downloaded.file.bytes) !== original.sha256)
    throw new AuthoredUploadRefusal("authored_file_hash_changed", 409, "The downloaded original does not match the reviewed file hash.");
  if (r.phase === 2) {
    if (!canStoreText) throw new AuthoredUploadRefusal("authored_visibility_unavailable", 403, "Current document visibility must be verified before package review.");
    const parsed = await parseOriginal({ body: downloaded.file.bytes, fileName: downloaded.file.fileName,
      mimeType: mimeFor(format), expectedFileSha256: original.sha256 }, format, 2, canStoreText, `authored:${r.moveId}:${original.sha256}`);
    if (textHash(parsed.content) !== original.textSha256 || parsed.parseMethod !== original.parseMethod)
      throw new AuthoredUploadRefusal("authored_content_changed", 409, "The original extraction differs from the recorded authored file.");
    return parsed.content;
  }
  const parsed = await extractProgramEvidenceFromUploadBuffer({ filename: downloaded.file.fileName,
    mimeType: AUTHORED_DOCX_MIME, buffer: downloaded.file.bytes, cacheScope: `authored:${r.moveId}:${r.sha256}` });
  if (!parsed.extractedText?.trim()) throw new AuthoredUploadRefusal("authored_file_not_extractable", 422, "The uploaded original has no extractable document text.");
  return parsed.extractedText.trim();
}

export async function verifyAuthoredUploadFile(ctx: TenancyCtx, r: AuthoredUploadReceipt, canStoreText?: (text: string) => boolean): Promise<string> {
  if (!readAuthoredUploadReceipt(r) || r.tenantKey !== canonicalTenantKey(ctx.clientKey) || canonicalTenantKey(r.storageTenantKey) !== r.tenantKey || r.storageTenantKey !== ctx.clientKey || r.moveId.length === 0)
    throw new AuthoredUploadRefusal("authored_file_scope_changed", 409, "The authored file scope cannot be verified.");
  const format = authoredDocumentSpec(r.phase, r.deliverableTypeKey)!.format;
  const primary = await verifyOriginal(ctx, r, r, format, "primary", canStoreText);
  const companion = r.companion ? await verifyOriginal(ctx, r, r.companion, "docx", "diagnostic_word", canStoreText) : undefined;
  return packageContent(primary, companion);
}

export async function verifyAuthoredApproval(ctx: TenancyCtx, args: {
  moveId: string; key: string; content: string; receipt: unknown; canStoreText?: (text: string) => boolean;
}): Promise<AuthoredUploadReceipt> {
  const r = readAuthoredUploadReceipt(args.receipt);
  if (!r || r.moveId !== args.moveId || r.deliverableTypeKey !== args.key)
    throw new AuthoredUploadRefusal("authored_file_receipt_invalid", 409, "This authored document has no complete file receipt.");
  if (await verifyAuthoredUploadFile(ctx, r, args.canStoreText) !== args.content.trim())
    throw new AuthoredUploadRefusal("authored_content_changed", 409, "The document text differs from its exact uploaded original.");
  const snapshot = await loadApprovedMoveEvidenceSnapshot({ tenantKey: r.tenantKey, moveId: r.moveId }).catch(() => null);
  if (!snapshot || !r.phaseEvidenceSnapshotHash || !isApprovedMoveEvidenceBasisCurrent({ snapshot, phase: r.phase,
    recordedRevision: r.phaseEvidenceSnapshotHash, scope: "phase", generatedAt: r.observedAt }))
    throw new AuthoredUploadRefusal("authored_evidence_basis_not_current", 409,
      "The current approved evidence basis must match the authored draft before approval. Review a current file and evidence basis first.");
  return r;
}

export function admitAuthoredP1Draft(ctx: TenancyCtx, input: Omit<DraftInput, "phase" | "companionFile">) {
  return admitAuthoredDraft(ctx, { ...input, phase: 1 });
}

export async function admitAuthoredDraft(ctx: TenancyCtx, input: DraftInput): Promise<AuthoredAdmissionResponse> {
  const tenantKey = canonicalTenantKey(ctx.clientKey);
  const declared = authoredDocumentSpec(input.phase, input.key);
  const spec = DELIVERABLE_REGISTRY.find(s => s.deliverableTypeKey === input.key && s.phase === input.phase && !s.deprecated);
  if (!declared || !spec) throw new AuthoredUploadRefusal("authored_key_not_declared", 422,
    input.phase === 1 ? "Choose a declared P1 Charter or Discovery Workshop Guide." : "Choose a declared P2 report, worksheet or design working guide.");
  if (!tenantKey || !uuid.test(input.moveId) || !uuid.test(input.requestId) || input.expectedState !== "absent" || !checksum.test(input.expectedFileSha256))
    throw new AuthoredUploadRefusal("authored_request_invalid", 400, "An absent-document request ID and exact file hash are required.");
  if (declared.requiresWordCompanion !== Boolean(input.companionFile)) throw new AuthoredUploadRefusal("authored_package_incomplete", 422,
    "The discovery report requires its diagnostic Word original; other declared documents accept only their own original.");
  const primary = await parseOriginal(input, declared.format, input.phase, input.canStoreText, `authored:${input.requestId}:${input.expectedFileSha256}`);
  const companion = input.companionFile ? await parseOriginal(input.companionFile, "docx", input.phase, input.canStoreText,
    `authored:${input.requestId}:${input.companionFile.expectedFileSha256}`) : undefined;
  return persistAuthoredDraft(ctx, { ...input, key: declared.key, tenantKey, title: spec.documentTitle,
    primary, companion, content: packageContent(primary.content, companion?.content) });
}

async function persistAuthoredDraft(ctx: TenancyCtx, input: DraftInput & {
  key: AuthoredDocumentKey; tenantKey: string; title: string; primary: ParsedFile; companion?: ParsedFile; content: string;
}): Promise<AuthoredAdmissionResponse> {
  const sb = getAzureWriteFluentClient();
  const { data: existing, error } = await sb.from("deliverables_v2")
    .select("id, current_version, deliverable_versions(id, version, structured_data, content)")
    .eq("engagement_id", input.moveId).eq("deliverable_type_key", input.key);
  if (error || !Array.isArray(existing) || existing.length > 1)
    throw new AuthoredUploadRefusal("authored_inventory_unavailable", 503, "The document inventory could not be verified. No new file was stored.");
  const current = existing[0] as { id: string; current_version: number; deliverable_versions: Array<{ id: string; version: number; content?: string; structured_data: Record<string, unknown> }> } | undefined;
  const replay = current?.deliverable_versions?.find(v => {
    const r = readAuthoredUploadReceipt(v.structured_data?.authoredUpload);
    return r?.requestId === input.requestId && r.sha256 === input.primary.sha256 && r.uploadedBy === ctx.userId &&
      r.phase === input.phase && r.moveId === input.moveId && r.deliverableTypeKey === input.key && r.tenantKey === input.tenantKey &&
      (input.phase === 1 || (r.companion?.sha256 === input.companion?.sha256 && v.content === input.content));
  });
  if (current) {
    if (!replay) throw new AuthoredUploadRefusal("authored_document_exists", 409, "This document already has a version. Open its existing review and replacement flow.");
    const receipt = readAuthoredUploadReceipt(replay.structured_data.authoredUpload)!;
    await verifyAuthoredUploadFile(ctx, receipt, input.canStoreText);
    return admissionResponse(current.id, replay.id, current.current_version, replay.version, receipt, true);
  }
  const snapshot = await loadApprovedMoveEvidenceSnapshot({ tenantKey: input.tenantKey, moveId: input.moveId }).catch(() => null);
  const retained: RetainedOriginal[] = [];
  async function retain(file: ParsedFile, role: "primary" | "diagnostic_word") {
    const artifactType = `${input.key}_authored_${input.requestId}${role === "primary" ? "" : "_diagnostic_word"}`;
    const { data: prior, error: priorError } = await sb.from("move_artifacts").select("artifact_id, version, blob_sha256, metadata")
      .eq("tenant_key", ctx.clientKey).eq("move_id", input.moveId).eq("artifact_type", artifactType).eq("lifecycle_state", "current").maybeSingle();
    if (priorError) throw new AuthoredUploadRefusal("authored_storage_read_unavailable", 503, "Prior upload storage could not be verified. Keep this request and retry the read.");
    let stored: { artifactId: string; version: number; blobStored: boolean };
    if (prior) {
      const p = prior as { artifact_id: string; version: number; blob_sha256: string; metadata: Record<string, unknown> };
      if (p.blob_sha256 !== file.sha256 || p.metadata.authoredUploadedBy !== ctx.userId || p.metadata.storage !== "azure_blob")
        throw new AuthoredUploadRefusal("authored_replay_mismatch", 409, "This request is already bound to different upload bytes or an uploader.", p.artifact_id);
      stored = { artifactId: p.artifact_id, version: p.version, blobStored: true };
    } else {
      const fileName = `${input.requestId}-${role === "primary" ? "" : "diagnostic-word-"}${file.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100)}`;
      try { stored = await saveMoveArtifact(ctx, { moveId: input.moveId, phase: input.phase, artifactType,
        artifactFamily: "generated_deliverable", title: `${input.title} — authored draft`, fileName, fileFormat: file.fileFormat, body: file.body,
        status: "draft", sourceBasis: "client_upload", confidence: "unreviewed", citationReady: false, requireBlobStored: true,
        metadata: { canonicalDeliverableKey: input.key, authoredRequestId: input.requestId, authoredOrigin: "abarva_uploaded",
          authoredUploadedBy: ctx.userId, authoringBasis: "abarva_authored_unsigned", originalFileName: file.fileName,
          ...(input.phase === 2 ? { authoredFileRole: role, authoredTextSha256: textHash(file.content) } : {}) } }); }
      catch { throw new AuthoredUploadRefusal("authored_storage_unavailable", 503, "Original-file storage or registration could not be confirmed. No document admission is claimed; keep this request and check storage before retrying."); }
    }
    retained.push({ fileRole: role, artifactId: stored.artifactId, artifactVersion: stored.version, sha256: file.sha256, blobStored: stored.blobStored });
    if (!stored.blobStored) throw new AuthoredUploadRefusal("authored_storage_unavailable", 503,
      "The upload has a record, but original-byte storage was not confirmed. No document was admitted.", stored.artifactId);
    return { file, stored };
  }
  try {
    const primary = await retain(input.primary, "primary");
    const companion = input.companion ? await retain(input.companion, "diagnostic_word") : undefined;
    const companionReceipt: AuthoredCompanionReceipt | undefined = companion ? {
      source: "authored_docx_upload", origin: "abarva_uploaded", tenantKey: input.tenantKey, storageTenantKey: ctx.clientKey!,
      moveId: input.moveId, deliverableTypeKey: "discovery_report", phase: 2, requestId: input.requestId,
      fileRole: "diagnostic_word", fileFormat: "docx", sha256: companion.file.sha256, textSha256: textHash(companion.file.content),
      artifactId: companion.stored.artifactId, artifactVersion: companion.stored.version, uploadedBy: ctx.userId,
      authoringBasis: "abarva_authored_unsigned", originalFileName: companion.file.fileName, parseMethod: companion.file.parseMethod,
    } : undefined;
    const receipt: AuthoredUploadReceipt = { source: input.primary.fileFormat === "docx" ? "authored_docx_upload" : "authored_pptx_upload",
      origin: "abarva_uploaded", tenantKey: input.tenantKey, storageTenantKey: ctx.clientKey!, moveId: input.moveId,
      deliverableTypeKey: input.key, phase: input.phase, requestId: input.requestId, sha256: input.primary.sha256,
      artifactId: primary.stored.artifactId, artifactVersion: primary.stored.version, uploadedBy: ctx.userId,
      authoringBasis: "abarva_authored_unsigned", delegatedReviewReference: input.delegatedReviewReference?.trim().slice(0, 200) || null,
      originalFileName: input.primary.fileName, parseMethod: input.primary.parseMethod,
      evidenceSnapshotHash: snapshot?.revision ?? null,
      phaseEvidenceSnapshotHash: snapshot ? approvedMoveEvidenceRevisionForPhase(snapshot, input.phase) : null,
      evidenceSnapshotScope: "phase", observedAt: new Date().toISOString(),
      ...(input.phase === 2 ? { fileRole: "primary", fileFormat: input.primary.fileFormat, textSha256: textHash(input.primary.content),
        ...(companionReceipt ? { companion: companionReceipt } : {}) } : {}),
    };
    try { await verifyAuthoredUploadFile(ctx, receipt, input.canStoreText); }
    catch { throw new AuthoredUploadRefusal("authored_stored_file_unverified", 503,
      "The upload has a storage record, but every original could not be verified. Document admission was withheld; keep this request and check storage.", primary.stored.artifactId); }
    const written = await createAzureProgramsWriteAdapter().runInitialAuthoredDeliverable({ programId: input.moveId,
      clientId: ctx.clientId, title: input.title, content: input.content, receipt });
    if (!written.ok || !written.data) throw new AuthoredUploadRefusal("authored_admission_unavailable", 503,
      "The original was retained, but document admission could not be confirmed. Keep this request and check the current document before retrying.", receipt.artifactId);
    if (written.data.kind === "conflict") throw new AuthoredUploadRefusal("authored_document_exists", 409,
      "Another document version exists. The uploaded original is retained; use its existing review flow.", receipt.artifactId);
    return admissionResponse(written.data.deliverableId, written.data.versionId, written.data.currentVersion, written.data.version,
      written.data.receipt, written.data.kind === "replay");
  } catch (error) {
    if (error instanceof AuthoredUploadRefusal && input.phase === 2)
      throw new AuthoredUploadRefusal(error.code, error.status, error.message,
        error.storedArtifactId ?? retained[0]?.artifactId ?? null, retained);
    throw error;
  }
}

function admissionResponse(deliverableId: string, versionId: string, currentVersion: number, version: number,
  r: AuthoredUploadReceipt, replayed: boolean): AuthoredAdmissionResponse {
  return { deliverableId, deliverableVersionId: versionId, currentVersion, admittedVersion: version,
    artifactId: r.artifactId, artifactVersion: r.artifactVersion, sha256: r.sha256, storage: "azure_blob",
    origin: r.origin, replayed, originalDownloadUrl: `/api/v1/programs/${r.moveId}/artifacts/${r.artifactId}/download`,
    ...(r.companion ? { companionOriginal: { artifactId: r.companion.artifactId, artifactVersion: r.companion.artifactVersion,
      sha256: r.companion.sha256, originalDownloadUrl: `/api/v1/programs/${r.moveId}/artifacts/${r.companion.artifactId}/download` } } : {}) };
}

export const AUTHORED_P1_UPLOAD_FLAG = "moves_authored_p1_draft_upload_v1";
export const AUTHORED_ADMISSION_RECORDED_EVENT = "moves:authored-admission-recorded";
export const AUTHORED_P2_UPLOAD_FLAG = "moves_authored_p2_draft_upload_v1";
export const AUTHORED_DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const AUTHORED_PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
export type AuthoredP1Key = "charter" | "discovery_plan";
export type AuthoredP2Key = "discovery_report" | "root_cause_worksheet" | "design_workshop_guide";
export type AuthoredDocumentKey = AuthoredP1Key | AuthoredP2Key;
export type AuthoredOfficeFormat = "docx" | "pptx";

export function authoredDocumentSpec(phase: number, key: string): {
  phase: 1 | 2; key: AuthoredDocumentKey; format: AuthoredOfficeFormat; requiresWordCompanion: boolean;
} | null {
  if (phase === 1 && (key === "charter" || key === "discovery_plan"))
    return { phase: 1 as const, key, format: "docx" as const, requiresWordCompanion: false };
  if (phase === 2 && (key === "discovery_report" || key === "root_cause_worksheet" || key === "design_workshop_guide"))
    return { phase: 2 as const, key, format: key === "design_workshop_guide" ? "docx" as const : "pptx" as const,
      requiresWordCompanion: key === "discovery_report" };
  return null;
}

export function authoredUploadFlag(phase: 1 | 2) {
  return phase === 1 ? AUTHORED_P1_UPLOAD_FLAG : AUTHORED_P2_UPLOAD_FLAG;
}

export interface AuthoredCompanionReceipt {
  source: "authored_docx_upload";
  origin: "abarva_uploaded";
  tenantKey: string;
  storageTenantKey: string;
  moveId: string;
  deliverableTypeKey: "discovery_report";
  phase: 2;
  requestId: string;
  fileRole: "diagnostic_word";
  fileFormat: "docx";
  sha256: string;
  textSha256: string;
  artifactId: string;
  artifactVersion: number;
  uploadedBy: string;
  authoringBasis: "abarva_authored_unsigned";
  originalFileName: string;
  parseMethod: string;
}

export interface AuthoredUploadReceipt {
  source: "authored_docx_upload" | "authored_pptx_upload";
  origin: "abarva_uploaded";
  tenantKey: string;
  storageTenantKey: string;
  moveId: string;
  deliverableTypeKey: AuthoredDocumentKey;
  phase: 1 | 2;
  requestId: string;
  sha256: string;
  artifactId: string;
  artifactVersion: number;
  uploadedBy: string;
  authoringBasis: "abarva_authored_unsigned";
  delegatedReviewReference: string | null;
  originalFileName: string;
  parseMethod: string;
  evidenceSnapshotHash: string | null;
  phaseEvidenceSnapshotHash: string | null;
  evidenceSnapshotScope: "phase";
  observedAt: string;
  fileRole?: "primary";
  fileFormat?: AuthoredOfficeFormat;
  textSha256?: string;
  companion?: AuthoredCompanionReceipt;
}


const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const checksum = /^[0-9a-f]{64}$/;

export function readAuthoredUploadReceipt(value: unknown): AuthoredUploadReceipt | null {
  if (!value || typeof value !== "object") return null;
  const r = value as AuthoredUploadReceipt;
  const spec = authoredDocumentSpec(r.phase, r.deliverableTypeKey);
  if (!spec || r.source !== (spec.format === "docx" ? "authored_docx_upload" : "authored_pptx_upload")) return null;
  if (r.phase === 2 && (r.fileRole !== "primary" || r.fileFormat !== spec.format || !checksum.test(r.textSha256 ?? ""))) return null;
  if (spec.requiresWordCompanion) {
    const c = r.companion;
    if (!c || c.source !== "authored_docx_upload" || c.origin !== r.origin || c.phase !== 2 ||
      c.deliverableTypeKey !== "discovery_report" || c.fileRole !== "diagnostic_word" || c.fileFormat !== "docx" ||
      c.tenantKey !== r.tenantKey || c.storageTenantKey !== r.storageTenantKey || c.moveId !== r.moveId ||
      c.requestId !== r.requestId || c.uploadedBy !== r.uploadedBy || c.authoringBasis !== r.authoringBasis ||
      !uuid.test(c.artifactId) || c.artifactId === r.artifactId || !checksum.test(c.sha256) || !checksum.test(c.textSha256) ||
      !Number.isSafeInteger(c.artifactVersion) || c.artifactVersion <= 0 ||
      typeof c.originalFileName !== "string" || !c.originalFileName || typeof c.parseMethod !== "string" || !c.parseMethod) return null;
  } else if (r.companion !== undefined) return null;
  return r.origin === "abarva_uploaded" &&
    typeof r.tenantKey === "string" && r.tenantKey.length > 0 && typeof r.storageTenantKey === "string" && r.storageTenantKey.length > 0 && uuid.test(r.moveId) && uuid.test(r.requestId) &&
    uuid.test(r.artifactId) && checksum.test(r.sha256) && Number.isSafeInteger(r.artifactVersion) && r.artifactVersion > 0 &&
    typeof r.uploadedBy === "string" && r.uploadedBy.length > 0 && r.authoringBasis === "abarva_authored_unsigned" &&
    typeof r.originalFileName === "string" && r.originalFileName.length > 0 && typeof r.parseMethod === "string" && r.parseMethod.length > 0 &&
    (r.delegatedReviewReference === null || (typeof r.delegatedReviewReference === "string" && r.delegatedReviewReference.length <= 200)) &&
    (r.evidenceSnapshotHash === null || typeof r.evidenceSnapshotHash === "string") &&
    (r.phaseEvidenceSnapshotHash === null || typeof r.phaseEvidenceSnapshotHash === "string") &&
    r.evidenceSnapshotScope === "phase" && typeof r.observedAt === "string" && Number.isFinite(Date.parse(r.observedAt))
    ? r : null;
}

export interface AuthoredAdmissionResponse {
  deliverableId: string;
  deliverableVersionId: string;
  currentVersion: number;
  admittedVersion: number;
  artifactId: string;
  artifactVersion: number;
  sha256: string;
  storage: "azure_blob";
  origin: "abarva_uploaded";
  replayed: boolean;
  originalDownloadUrl: string;
  companionOriginal?: {
    artifactId: string;
    artifactVersion: number;
    sha256: string;
    originalDownloadUrl: string;
  };
}

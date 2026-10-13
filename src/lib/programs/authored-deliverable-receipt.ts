export const AUTHORED_P1_UPLOAD_FLAG = "moves_authored_p1_draft_upload_v1";
export const AUTHORED_ADMISSION_RECORDED_EVENT = "moves:authored-admission-recorded";
export const AUTHORED_DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export type AuthoredP1Key = "charter" | "discovery_plan";

export interface AuthoredUploadReceipt {
  source: "authored_docx_upload";
  origin: "abarva_uploaded";
  tenantKey: string;
  storageTenantKey: string;
  moveId: string;
  deliverableTypeKey: AuthoredP1Key;
  phase: 1;
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
}


const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const checksum = /^[0-9a-f]{64}$/;

export function readAuthoredUploadReceipt(value: unknown): AuthoredUploadReceipt | null {
  if (!value || typeof value !== "object") return null;
  const r = value as AuthoredUploadReceipt;
  return r.source === "authored_docx_upload" && r.origin === "abarva_uploaded" && r.phase === 1 &&
    (r.deliverableTypeKey === "charter" || r.deliverableTypeKey === "discovery_plan") &&
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
}

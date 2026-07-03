// Source File Cabinet / Artifact Vault — types.

export type ArtifactGroup =
  | "generated"
  | "upload"
  | "template"
  | "session"
  | "approval";

export type ArtifactStatus =
  | "draft"
  | "preliminary"
  | "issue_ready"
  | "client_to_complete"
  | "legal_review_required"
  | "procurement_review_required"
  | "approved"
  | "client_final"
  | "superseded"
  | "retired"
  | "blocked";

export type ArtifactLifecycle = "current" | "superseded" | "retired";

export type ArtifactFileFormat =
  | "docx"
  | "xlsx"
  | "pptx"
  | "pdf"
  | "html"
  | "md"
  | "csv"
  | "json";

export interface SourceArtifactRecord {
  id: string;
  clientId: string;
  tenantKey: string;
  sourceEventId: string;
  sourcingStage: string | null;
  artifactGroup: ArtifactGroup;
  artifactType: string;
  artifactFamily: string | null;
  title: string;
  description: string | null;
  fileName: string;
  fileFormat: ArtifactFileFormat;
  blobContainer: string;
  blobPath: string;
  fileSize: number | null;
  version: number;
  status: ArtifactStatus;
  generatedBy: string | null;
  generatedAt: string;
  sourceBasis: string | null;
  confidence: string | null;
  citationReady: boolean;
  evidenceFamiliesUsed: string[];
  sourceRegisterId: string | null;
  contextBundleTraceId: string | null;
  approvalState: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  maestroOverrideId: string | null;
  missingInputs: string[];
  clientCompleteItems: string[];
  assumptions: string[];
  supersedesArtifactId: string | null;
  supersededByArtifactId: string | null;
  lifecycleState: ArtifactLifecycle;
  blobSha256: string | null;
  isClientFinal: boolean;
  isCurrentAuthoritative: boolean;
  sourceGeneratedArtifactId: string | null;
  clientFinalUploadedBy: string | null;
  clientFinalUploadedAt: string | null;
  clientFinalAcceptedBy: string | null;
  clientFinalAcceptedAt: string | null;
  clientFinalNote: string | null;
  clientFinalReviewMeetingDate: string | null;
  clientFinalStakeholderGroup: string | null;
  clientFinalChangeSummary: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Input to persist a new artifact (one version). */
export interface PersistArtifactInput {
  clientId: string;
  tenantKey: string;
  sourceEventId: string;
  artifactGroup: ArtifactGroup;
  artifactType: string;
  title: string;
  fileName: string;
  fileFormat: ArtifactFileFormat;
  bytes: Buffer;
  sourcingStage?: string;
  artifactFamily?: string;
  description?: string;
  status?: ArtifactStatus;
  generatedBy?: string;
  sourceBasis?: string;
  confidence?: string;
  citationReady?: boolean;
  evidenceFamiliesUsed?: string[];
  sourceRegisterId?: string;
  contextBundleTraceId?: string;
  missingInputs?: string[];
  clientCompleteItems?: string[];
  assumptions?: string[];
  isClientFinal?: boolean;
  isCurrentAuthoritative?: boolean;
  sourceGeneratedArtifactId?: string | null;
  clientFinalUploadedBy?: string | null;
  clientFinalUploadedAt?: string | null;
  clientFinalAcceptedBy?: string | null;
  clientFinalAcceptedAt?: string | null;
  clientFinalNote?: string | null;
  clientFinalReviewMeetingDate?: string | null;
  clientFinalStakeholderGroup?: string | null;
  clientFinalChangeSummary?: Record<string, unknown>;
}

export interface ListArtifactsFilter {
  artifactGroup?: ArtifactGroup;
  status?: ArtifactStatus;
  /** when true, include superseded/retired history; default false (current only). */
  includeHistory?: boolean;
}

const CONTENT_TYPES: Record<ArtifactFileFormat, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
  html: "text/html; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  json: "application/json",
};

export function contentTypeFor(format: ArtifactFileFormat): string {
  return CONTENT_TYPES[format] ?? "application/octet-stream";
}

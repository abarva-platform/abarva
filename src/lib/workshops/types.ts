export type WorkshopTemplateStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'retired';

export type WorkshopAssetType =
  | 'pre_read'
  | 'agenda'
  | 'facilitator_brief'
  | 'worksheet'
  | 'decision_capture'
  | 'pre_mortem'
  | 'post_read'
  | 'stakeholder_map';

export type WorkshopReviewDecision = 'commented' | 'changes_requested' | 'approved' | 'rejected';

export type WorkshopInstanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface WorkshopMutationContext {
  userId: string;
  clientId?: string | null;
}

export interface WorkshopTemplateInput {
  slug: string;
  name: string;
  durationMinutes: number;
  owningGateId?: string | null;
  hypothesisToTest?: string;
  stakeholderMap?: Record<string, unknown>;
  facilitatorTactics?: Record<string, unknown>;
  verticalOverlays?: string[];
  clientId?: string | null;
}

export interface WorkshopAssetInput {
  assetType: WorkshopAssetType;
  sequenceIndex: number;
  name: string;
  format: string;
  contentText?: string | null;
  contentBlobRef?: string | null;
  schema?: Record<string, unknown>;
  timeBoxMinutes?: number | null;
}

export interface WorkshopAssetRecord extends Required<Omit<WorkshopAssetInput, 'schema' | 'contentText' | 'contentBlobRef' | 'timeBoxMinutes'>> {
  id: string;
  clientId: string | null;
  workshopId: string;
  contentText: string | null;
  contentBlobRef: string | null;
  schema: Record<string, unknown>;
  timeBoxMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopTemplateRecord {
  id: string;
  clientId: string | null;
  slug: string;
  name: string;
  durationMinutes: number;
  version: number;
  parentVersionId: string | null;
  status: WorkshopTemplateStatus;
  depthScore: number;
  owningGateId: string | null;
  hypothesisToTest: string;
  stakeholderMap: Record<string, unknown>;
  facilitatorTactics: Record<string, unknown>;
  verticalOverlays: string[];
  createdBy: string | null;
  updatedBy: string | null;
  approvedBy: string | null;
  publishedAt: string | null;
  retiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  assets: WorkshopAssetRecord[];
}

export interface WorkshopReviewInput {
  decision: WorkshopReviewDecision;
  comment?: string;
}

export interface WorkshopInstanceInput {
  templateId: string;
  versionPinned?: number;
  clientId?: string | null;
  moveInstanceId?: string | null;
  gateId?: string | null;
  scheduledAt?: string | null;
  status?: WorkshopInstanceStatus;
  decisions?: unknown[];
  dissentLog?: unknown[];
  postReadSentAt?: string | null;
}

export interface WorkshopInstanceRecord {
  id: string;
  templateId: string;
  templateName: string | null;
  templateSlug: string | null;
  versionPinned: number;
  clientId: string;
  moveInstanceId: string | null;
  gateId: string | null;
  scheduledAt: string | null;
  status: WorkshopInstanceStatus;
  decisions: unknown[];
  dissentLog: unknown[];
  postReadSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopDepthLintResult {
  score: number;
  pass: boolean;
  findings: string[];
  reasoning: string;
}

export interface WorkshopPackResult {
  workshopId: string;
  version: number;
  moveInstanceId: string | null;
  format: 'pdf' | 'zip';
  blobRef: string;
  byteLength: number;
  sha256: string;
  contentType: string;
  pdfBytes: Buffer;
  zipBytes?: Buffer;
}

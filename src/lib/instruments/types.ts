export type InstrumentTemplateStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'retired';

export type InstrumentFormat = 'csv' | 'md' | 'json' | 'docx' | 'sql' | 'interactive_form';

export type InstrumentReviewDecision = 'commented' | 'changes_requested' | 'approved' | 'rejected';

export interface InstrumentTemplateInput {
  clientId?: string | null;
  slug: string;
  name: string;
  category: string;
  format: InstrumentFormat;
  schema: Record<string, unknown>;
  contentTemplateText: string;
  contentBlobRef?: string | null;
  sampleSizeMath: Record<string, unknown>;
  biasControls: Record<string, unknown>;
  privacyBlock: string;
  validationRules: Record<string, unknown>;
  triangulationPlan: Record<string, unknown>;
  edgeCaseGuide: Record<string, unknown>;
  refreshCadence: string;
  tTier: 1 | 2 | 3;
  ownerRole: string;
  timeToCompleteDays: number;
  verticalOverlays?: string[];
  depthScore?: number;
}

export interface InstrumentTemplateRecord extends InstrumentTemplateInput {
  id: string;
  clientId: string | null;
  status: InstrumentTemplateStatus;
  version: number;
  parentVersionId: string | null;
  depthScore: number;
  contentBlobRef: string | null;
  verticalOverlays: string[];
  primaryAuthorId: string | null;
  approvedById: string | null;
  publishedAt: string | null;
  retiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstrumentMutationContext {
  userId: string;
  clientId?: string | null;
}

export interface InstrumentReviewInput {
  decision: InstrumentReviewDecision;
  comment?: string;
}

export interface InstrumentDepthLintResult {
  score: number;
  pass: boolean;
  findings?: string[];
}

export interface DiscoveryKitItem {
  assignmentId: string;
  moveId: string;
  templateId: string;
  templateVersion: number;
  slug: string;
  name: string;
  category: string;
  format: InstrumentFormat;
  status: string;
  ownerName: string | null;
  ownerRole: string;
  dueDate: string | null;
  evidenceLink: string | null;
  tTier: 1 | 2 | 3;
  completionPct: number;
  gateLabel: string;
}

export interface RenderInstrumentResult {
  bytes: Buffer | string;
  contentType: string;
  filename: string;
  format: InstrumentFormat;
}

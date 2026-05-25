export type MoveTemplateKind = 'Move' | 'SourceWorkflow';
export type MoveTemplateStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'retired';
export type MoveTemplateReviewDecision = 'commented' | 'changes_requested' | 'approved' | 'rejected';
export type MoveInstanceStatus = 'draft' | 'active' | 'paused' | 'completed' | 'retired';

export interface TemplateMutationContext {
  userId: string;
  clientId?: string | null;
}

export interface MoveTemplateArtifactInput {
  artifactId: string;
  name: string;
  toc?: unknown[];
  schema?: Record<string, unknown>;
  templateMarkdown?: string;
  depthScore?: number;
}

export interface MoveTemplateGateInput {
  gateId: string;
  sequenceIndex: number;
  name: string;
  sponsorRaci?: Record<string, unknown>;
  requiredArtifacts?: string[];
  evidenceAnchors?: string[];
  numericKillCriteria?: Record<string, unknown>;
  sensitivityAnalysisTemplate?: string;
  preMortemRequired?: boolean;
  timeBudgetP50Days?: number | null;
  timeBudgetP90Days?: number | null;
  handOffRitual?: string;
  maturityTarget?: number | null;
  depthScore?: number;
  artifacts?: MoveTemplateArtifactInput[];
}

export interface MoveTemplateInput {
  slug: string;
  kind: MoveTemplateKind;
  name: string;
  summary?: string;
  sponsorRaci?: Record<string, unknown>;
  depthScore?: number;
  verticalOverlays?: string[];
  horizonDefault?: string | null;
  intendedPersonas?: string[];
  gates?: MoveTemplateGateInput[];
}

export interface MoveTemplateArtifactRecord extends Required<Omit<MoveTemplateArtifactInput, 'toc' | 'schema' | 'templateMarkdown' | 'depthScore'>> {
  id: string;
  gateId: string;
  toc: unknown[];
  schema: Record<string, unknown>;
  templateMarkdown: string;
  depthScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface MoveTemplateGateRecord extends Required<Omit<MoveTemplateGateInput, 'sponsorRaci' | 'numericKillCriteria' | 'sensitivityAnalysisTemplate' | 'preMortemRequired' | 'timeBudgetP50Days' | 'timeBudgetP90Days' | 'handOffRitual' | 'maturityTarget' | 'depthScore' | 'artifacts'>> {
  id: string;
  templateId: string;
  sponsorRaci: Record<string, unknown>;
  numericKillCriteria: Record<string, unknown>;
  sensitivityAnalysisTemplate: string;
  preMortemRequired: boolean;
  timeBudgetP50Days: number | null;
  timeBudgetP90Days: number | null;
  handOffRitual: string;
  maturityTarget: number | null;
  depthScore: number;
  artifacts: MoveTemplateArtifactRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface MoveTemplateRecord {
  id: string;
  slug: string;
  kind: MoveTemplateKind;
  name: string;
  summary: string;
  sponsorRaci: Record<string, unknown>;
  version: number;
  parentVersionId: string | null;
  status: MoveTemplateStatus;
  depthScore: number;
  publishedAt: string | null;
  retiredAt: string | null;
  verticalOverlays: string[];
  horizonDefault: string | null;
  intendedPersonas: string[];
  primaryAuthorId: string | null;
  approvedById: string | null;
  gates: MoveTemplateGateRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface MoveTemplateReviewInput {
  decision: MoveTemplateReviewDecision;
  comment?: string;
}

export interface InstantiateTemplateOptions {
  instanceName?: string;
  sponsorAssignments?: Record<string, unknown>;
  status?: MoveInstanceStatus;
  createdById?: string;
  origin?: string;
  createProgramShell?: boolean;
  originatingIntelligenceSessionId?: string | null;
}

export interface MoveInstanceRecord {
  instanceId: string;
  templateId: string;
  templateVersionPinned: number;
  clientId: string;
  engagementId: string | null;
  sponsorAssignments: Record<string, unknown>;
  currentGate: string | null;
  status: MoveInstanceStatus;
  artifactCompletion: Record<string, unknown>;
  gateSkeleton: unknown[];
  options: Record<string, unknown>;
  originatingIntelligenceSessionId: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateDepthCheck {
  pass: boolean;
  score: number;
  gateScores: Array<{ gateId: string; score: number; pass: boolean; reasoning: string }>;
  artifactScores: Array<{ gateId: string; artifactId: string; score: number; pass: boolean; reasoning: string }>;
}

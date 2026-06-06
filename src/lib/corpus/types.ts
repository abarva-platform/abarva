export type CorpusPatternStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'retired';

export type CorpusRelationshipType =
  | 'supports'
  | 'contradicts'
  | 'extends'
  | 'depends_on'
  | 'replaces'
  | 'related';

export interface CorpusStructuredContent {
  claims?: unknown[];
  evidence?: unknown[];
  counterarguments?: unknown[];
  synthesis?: Record<string, unknown>;
}

export interface CorpusPatternInput {
  slug: string;
  title: string;
  category: string;
  markdownBody: string;
  confidence?: number;
  depthScore?: number;
  verticalOverlays?: string[];
  regionOverlays?: string[];
  applicableHorizons?: string[];
  structured?: CorpusStructuredContent;
  clientId?: string | null;
}

export interface CorpusPatternRecord {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: CorpusPatternStatus;
  confidence: number;
  version: number;
  parentVersionId: string | null;
  primaryAuthorId: string | null;
  approvedById: string | null;
  publishedAt: string | null;
  retiredAt: string | null;
  searchDocId: string | null;
  depthScore: number;
  verticalOverlays: string[];
  regionOverlays: string[];
  applicableHorizons: string[];
  markdownBody: string;
  claims: unknown[];
  evidence: unknown[];
  counterarguments: unknown[];
  synthesis: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CorpusSearchOptions {
  clientId: string;
  clientKey?: string | null;
  userId?: string;
  category?: string;
  verticalOverlays?: string[];
  regionOverlays?: string[];
  minConfidence?: number;
  minDepthScore?: number;
  includePrivate?: boolean;
  versionPin?: number;
  limit?: number;
}

export interface CorpusSearchHit extends CorpusPatternRecord {
  score: number;
  source: 'azure' | 'postgres' | 'fused';
}

export interface CorpusMutationContext {
  userId: string;
  clientId?: string | null;
  clientKey?: string | null;
}

export interface CorpusReviewInput {
  decision: 'commented' | 'changes_requested' | 'approved' | 'rejected';
  comment?: string;
}

export interface DepthLintResult {
  score: number;
  pass: boolean;
  findings?: string[];
}

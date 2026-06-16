import type { AiCallResult, TenantAiPolicy } from '@/lib/integrations/ai-egress';

export type GeneratedArtifactType =
  | 'move_board_pack'
  | 'source_board_pack'
  | 'pilot_evidence_package'
  | 'watchlist_review_pack'
  | 'dossier_board_pack';

export type GeneratedArtifactFormat = 'pptx' | 'pdf' | 'html' | 'docx' | 'xlsx';
export type GeneratedArtifactRenderEngine = 'gamma' | 'internal' | 'gamma_with_internal_fallback';

export interface BoardPackFact {
  id: string;
  label: string;
  value: string;
  evidenceLedgerId: string;
}

export interface BoardPackSection {
  id: string;
  title: string;
  claims: string[];
}

export interface BoardPackRenderInput {
  clientId: string;
  sourceArtifactRef: string;
  artifactType: GeneratedArtifactType;
  outputFormat?: GeneratedArtifactFormat;
  renderEngine?: GeneratedArtifactRenderEngine;
  renderedBy: string;
  title: string;
  sections: BoardPackSection[];
  facts: BoardPackFact[];
  tenantPolicy: TenantAiPolicy;
  userId?: string;
}

export interface BoardPackRenderResult {
  artifactType: GeneratedArtifactType;
  sourceArtifactRef: string;
  renderEngine: GeneratedArtifactRenderEngine;
  outputFormat: GeneratedArtifactFormat;
  html: string;
  blobUrl: string;
  blobSha256: string;
  qualityScore: number;
  evidenceLedgerIds: string[];
  generationEgressAudit: string | null;
  quarantined: boolean;
  quarantineReason: string | null;
  aiResult?: AiCallResult;
}


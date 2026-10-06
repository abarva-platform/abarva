import type { AiDataClass } from '@/lib/integrations/ai-egress';

export type SentinelIntent = 'it_productivity' | 'general';

export type SentinelStageId =
  | 'clarify'
  | 'alignment_check'
  | 'portfolio_segmentation'
  | 'tom_recommendation'
  | 'tooling_governance'
  | 'sibling_move_portfolio';

export interface SentinelCitation {
  id: string;
  label: string;
  sourceType: 'corpus_pattern' | 'move_template' | 'client_data' | 'reasoning_trace';
  version?: number;
  url?: string;
  detail?: string;
}

export interface SentinelMoveProposal {
  id: string;
  title: string;
  templateSlug: string;
  rationale: string;
  dependencyIds: string[];
  projectedValueUsd: number;
}

export interface SentinelOneClickAction {
  label: string;
  endpoint: string;
  method: 'POST';
  payload: {
    traceId: string;
    clientId: string;
    proposals: SentinelMoveProposal[];
    parentMoveInstanceId?: string | null;
    acceptAll?: boolean;
    includeSourceWorkflows?: boolean;
  } & Record<string, unknown>;
  href?: string;
}

export interface SentinelReasoningStage {
  id: SentinelStageId;
  name: string;
  sequence: number;
  content: string;
  citations: SentinelCitation[];
  confidence: number;
  dataClass: AiDataClass;
  clientId: string;
  corpusVersionPinned: number;
  templateVersionPinned: number;
  traceId: string;
  dissent?: string;
  oneClickAction?: SentinelOneClickAction;
}

export interface SentinelIntentClassification {
  intent: SentinelIntent;
  confidence: number;
  entities: string[];
  matchedPatternSlugs: string[];
  citations: SentinelCitation[];
  reason: string;
}

export interface SentinelReasoningInput {
  query: string;
  clientId: string;
  userId?: string | null;
  surfaceContext?: unknown;
  conversationContextBlock?: string;
  intelligenceSessionId?: string | null;
}

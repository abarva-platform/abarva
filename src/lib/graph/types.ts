export interface PeerDecisionSummary {
  choice: string;
  engagement_count: number;
  avg_outcome_usd: number;
  total_savings_usd: number;
  notes: string[];
}

export interface ChainedPattern {
  from_code: string;
  to_code: string;
  to_name: string;
  to_failure_rate: number;
  weight: number;
}

export interface ActivePattern {
  code: string;
  name: string;
  failure_rate: number;
  category: string;
  observed_at: string | null;
}

export interface SimilarEngagement {
  id: string;
  name: string;
  industry_code: string;
  status: string;
  outcome_savings_usd: number | null;
}

export interface PersonContext {
  id: string;
  name: string;
  role: string;
  organization: string;
  familiarity: 'first_meeting' | 'returning_recent' | 'returning_dormant' | 'frequent_collaborator';
  past_engagement_count: number;
  last_seen_at: string | null;
}

export interface EngagementIntelligence {
  engagement_id: string;
  phase: number;
  peer_decisions: PeerDecisionSummary[];
  active_patterns: ActivePattern[];
  chained_patterns: ChainedPattern[];
  similar_engagements: SimilarEngagement[];
  sponsor: PersonContext | null;
}

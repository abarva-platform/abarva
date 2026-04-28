export type PatternDomain =
  | 'meta'
  | 'sourcing'
  | 'cdp'
  | 'ai_programs'
  | 'architecture'
  | 'industry_specific'
  | 'compliance'
  | 'future_of_work';

export type PatternTier = 'M' | 'authoritative' | 'validated';

export type PatternStatus =
  | 'AUTHORED-DRAFT'
  | 'AUTHORED-REVIEWED'
  | 'AUTHORED-EXPERT'
  | 'IN-AUTHORING'
  | 'COMMISSIONED'
  | 'PROPOSED';

export type PatternCreatedFrom = 'human_authored' | 'deterministic_seed';

export interface PatternSeed {
  id: string;
  slug: string;
  title: string;
  domain: PatternDomain;
  tier: PatternTier;
  vertical: string;
  thesis: string;
  applicability: string;
  status: PatternStatus;
  version: string;
  confidence: number;
  createdFrom: PatternCreatedFrom;
  createdBy: string;
  createdAt: string;
  instanceCount: number;
  sourceDocuments: string[];
  regulatoryChips: string[];
  relatedPatternIds: string[];
  derivedFromPatternIds: string[];
  taggedContradictionIds: string[];
  body: string;
}

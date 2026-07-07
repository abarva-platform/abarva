export type IntentClass =
  | "insight-lookup"
  | "sql-fact"
  | "freshness"
  | "retrieval"
  | "corpus"
  | "hybrid";

export type AnswerConfidence = "high" | "medium" | "low" | "none";
export type AnswerFreshness = "fresh" | "attention" | "stale" | "unknown";

export interface Citation {
  label: string;
  sourceType: string;
  locator: string | null;
  freshness: AnswerFreshness;
}

export interface ViewDirective {
  tab: "insights" | "explore" | "change" | "trust" | "corpus";
  entityName?: string;
  filter?: string;
}

export interface RoutedAnswer {
  answer: string;
  routeUsed: IntentClass;
  citations: Citation[];
  confidence: AnswerConfidence;
  freshnessStatus: AnswerFreshness;
  missingContext: string[];
  viewDirective?: ViewDirective;
  factsUsed?: string[];
  chunksUsed?: string[];
}

import type { EvidenceRef, KnowledgeTruthStatus } from "./evidence-ref";

export type FactValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | Record<string, unknown>;

export type FactConfidence = "high" | "medium" | "low" | "blocked";

export interface CanonicalFact {
  factId: string;
  tenantKey: string;
  domain:
    | "enterprise_profile"
    | "functions"
    | "applications_systems"
    | "data_domains"
    | "infrastructure"
    | "vendors_contracts"
    | "programs"
    | "risks_controls"
    | "metrics_outcomes"
    | "use_cases"
    | "processes"
    | "relationships";
  subjectEntityId: string;
  predicate: string;
  value: FactValue;
  valueType:
    | "string"
    | "number"
    | "boolean"
    | "currency"
    | "percent"
    | "date"
    | "list"
    | "json"
    | "unknown";
  evidenceRefs: EvidenceRef[];
  truthStatus: KnowledgeTruthStatus;
  confidence: FactConfidence;
  caveats: string[];
  inferred: boolean;
}

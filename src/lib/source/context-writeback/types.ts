import type { SourceEventFactRow } from "@/lib/source/facts/fact-types";

export const SOURCE_CONTEXT_WRITEBACK_SCHEMA_VERSION = 1;
export const SOURCE_CONTEXT_RECORD_TYPE = "source_event_fact";
export const SOURCE_CONTEXT_SOURCE_SYSTEM = "source_event_facts";
export const SOURCE_CONTEXT_TABLE = "enterprise_context_records";
export const SOURCE_CONTEXT_FACTS_TABLE = "enterprise_context_facts";
export const SOURCE_CONTEXT_READINESS_TABLE = "governed_object_readiness";

export interface SourceContextWritebackEvent {
  readonly id: string;
  readonly code?: string | null;
  readonly name?: string | null;
  readonly clientId?: string | null;
  readonly clientKey: string;
  readonly stageKey?: string | null;
}

export interface SourceContextFactPayload {
  readonly sourceEventId: string;
  readonly sourceEventCode: string | null;
  readonly sourceEventName: string | null;
  readonly sourceFactId: string;
  readonly factKey: string;
  readonly entityKind: string;
  readonly entityRef: string | null;
  readonly valueNumeric: number | null;
  readonly valueText: string | null;
  readonly unit: string;
  readonly sourceMethod: string;
  readonly sourceCitation: SourceEventFactRow["source_citation"];
  readonly confidence: SourceEventFactRow["confidence"];
  readonly capturedAt: string;
  readonly stageKey: string | null;
  readonly writebackSchemaVersion: number;
}

export interface SourceEnterpriseContextRecordRow {
  readonly client_id: string | null;
  readonly tenant_key: string;
  readonly canonical_record_id: string;
  readonly record_type: typeof SOURCE_CONTEXT_RECORD_TYPE;
  readonly record_subtype: string;
  readonly title: string;
  readonly source_system: typeof SOURCE_CONTEXT_SOURCE_SYSTEM;
  readonly source_record_id: string;
  readonly source_file: string | null;
  readonly source_sheet: string | null;
  readonly source_row_number: number | null;
  readonly last_synced_at: string;
  readonly confidence: number;
  readonly freshness_status: "fresh";
  readonly evidence_pointer: string;
  readonly lifecycle_state: "active";
  readonly payload_hash: string;
  readonly payload: SourceContextFactPayload;
}

export interface SourceEnterpriseContextFactDraft {
  readonly canonical_record_id: string;
  readonly client_id: string | null;
  readonly tenant_key: string;
  readonly fact_key: string;
  readonly fact_type: "number" | "text";
  readonly fact_value: Record<string, unknown>;
  readonly fact_text: string | null;
  readonly source_system: typeof SOURCE_CONTEXT_SOURCE_SYSTEM;
  readonly source_record_id: string;
  readonly source_file: string | null;
  readonly source_sheet: string | null;
  readonly source_row_number: number | null;
  readonly last_synced_at: string;
  readonly confidence: number;
  readonly freshness_status: "fresh";
  readonly evidence_pointer: string;
  readonly lifecycle_state: "active";
  readonly value_hash: string;
}

export interface SourceEnterpriseContextFactRow extends Omit<
  SourceEnterpriseContextFactDraft,
  "canonical_record_id"
> {
  readonly record_id: string;
}

export interface SourceGovernedReadinessDraft {
  readonly canonical_record_id: string;
  readonly object_table: typeof SOURCE_CONTEXT_TABLE;
  readonly object_id: string;
  readonly client_key: string;
  readonly tenant_id: string | null;
  readonly source_layer: "tenant_context";
  readonly agent_readiness_status: "not_reviewed";
  readonly retrievability: "committed_not_indexed";
  readonly classification: "internal";
  readonly source_basis: "source_event_fact";
  readonly confidence_level: "high" | "medium" | "low";
  readonly confidence_rationale: string;
  readonly applicable_agents: readonly ["source", "atlas", "tower", "nexus"];
  readonly policy_validation_status: "pending";
  readonly provenance: Record<string, unknown>;
  readonly backfill_reason: string;
}

export type SourceGovernedReadinessRow = Omit<
  SourceGovernedReadinessDraft,
  "canonical_record_id"
>;

export interface SourceContextWritebackPlan {
  readonly records: readonly SourceEnterpriseContextRecordRow[];
  readonly factDrafts: readonly SourceEnterpriseContextFactDraft[];
  readonly readinessDrafts: readonly SourceGovernedReadinessDraft[];
  readonly skippedFacts: readonly SourceContextWritebackSkip[];
}

export interface SourceContextWritebackSkip {
  readonly factId: string;
  readonly factKey: string;
  readonly reason:
    | "wrong_client"
    | "stale"
    | "missing_value"
    | "missing_citation";
}

export type SourceContextWritebackResult =
  | {
      readonly status: "skipped";
      readonly reason: "no_eligible_facts";
      readonly skippedFacts: readonly SourceContextWritebackSkip[];
    }
  | {
      readonly status: "written";
      readonly recordsWritten: number;
      readonly factsWritten: number;
      readonly readinessRowsWritten: number;
      readonly skippedFacts: readonly SourceContextWritebackSkip[];
    }
  | { readonly status: "failed"; readonly detail: string };

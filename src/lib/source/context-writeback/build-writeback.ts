import { createHash } from "node:crypto";
import { canonicalTenantKey } from "@/lib/tenant-keys";
import type { SourceEventFactRow } from "@/lib/source/facts/fact-types";
import {
  SOURCE_CONTEXT_RECORD_TYPE,
  SOURCE_CONTEXT_SOURCE_SYSTEM,
  SOURCE_CONTEXT_WRITEBACK_SCHEMA_VERSION,
  type SourceContextFactPayload,
  type SourceContextWritebackEvent,
  type SourceContextWritebackPlan,
  type SourceContextWritebackSkip,
  type SourceEnterpriseContextFactDraft,
  type SourceEnterpriseContextRecordRow,
  type SourceGovernedReadinessDraft,
} from "./types";

function hashJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function confidenceNumber(
  confidence: SourceEventFactRow["confidence"],
): number {
  if (confidence === "high") return 0.92;
  if (confidence === "med") return 0.76;
  return 0.52;
}

function confidenceLevel(
  confidence: SourceEventFactRow["confidence"],
): SourceGovernedReadinessDraft["confidence_level"] {
  if (confidence === "high") return "high";
  if (confidence === "med") return "medium";
  return "low";
}

function citationDoc(fact: SourceEventFactRow): string | null {
  const doc = fact.source_citation?.doc;
  return typeof doc === "string" && doc.trim() ? doc.trim() : null;
}

function citationLocator(fact: SourceEventFactRow): string | null {
  const locator = fact.source_citation?.locator;
  return typeof locator === "string" && locator.trim() ? locator.trim() : null;
}

function evidencePointerOf(fact: SourceEventFactRow): string {
  const doc = citationDoc(fact) ?? "source_event_fact";
  const locator = citationLocator(fact);
  return locator
    ? `source-event-fact://${fact.source_event_id}/${fact.id}#${encodeURIComponent(doc)}:${encodeURIComponent(locator)}`
    : `source-event-fact://${fact.source_event_id}/${fact.id}#${encodeURIComponent(doc)}`;
}

function finiteNumericValue(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function canonicalRecordIdOf(fact: SourceEventFactRow): string {
  return `source-event-fact-${fact.source_event_id}-${fact.id}`;
}

function valueForFact(fact: SourceEventFactRow): {
  factType: "number" | "text";
  factValue: Record<string, unknown>;
  factText: string | null;
} | null {
  const numericValue = finiteNumericValue(fact.value_numeric);
  if (numericValue !== null) {
    return {
      factType: "number",
      factValue: { value: numericValue, unit: fact.unit },
      factText: `${numericValue} ${fact.unit}`,
    };
  }
  if (fact.value_text !== null && fact.value_text.trim()) {
    return {
      factType: "text",
      factValue: { value: fact.value_text, unit: fact.unit },
      factText: fact.value_text,
    };
  }
  return null;
}

function titleOf(
  event: SourceContextWritebackEvent,
  fact: SourceEventFactRow,
): string {
  const eventLabel = event.code ?? event.name ?? event.id;
  const entity = fact.entity_ref
    ? ` · ${fact.entity_kind}:${fact.entity_ref}`
    : "";
  return `Source fact — ${eventLabel} · ${fact.fact_key}${entity}`;
}

function skip(
  fact: SourceEventFactRow,
  reason: SourceContextWritebackSkip["reason"],
): SourceContextWritebackSkip {
  return { factId: fact.id, factKey: fact.fact_key, reason };
}

export function buildSourceContextWritebackPlan(input: {
  readonly event: SourceContextWritebackEvent;
  readonly facts: readonly SourceEventFactRow[];
  readonly committedAt: string;
}): SourceContextWritebackPlan {
  const tenantKey = canonicalTenantKey(input.event.clientKey);
  const records: SourceEnterpriseContextRecordRow[] = [];
  const factDrafts: SourceEnterpriseContextFactDraft[] = [];
  const readinessDrafts: SourceGovernedReadinessDraft[] = [];
  const skippedFacts: SourceContextWritebackSkip[] = [];

  for (const fact of input.facts) {
    if (canonicalTenantKey(fact.client_key) !== tenantKey) {
      skippedFacts.push(skip(fact, "wrong_client"));
      continue;
    }
    if (fact.is_stale) {
      skippedFacts.push(skip(fact, "stale"));
      continue;
    }
    const value = valueForFact(fact);
    if (!value) {
      skippedFacts.push(skip(fact, "missing_value"));
      continue;
    }
    if (!fact.source_citation || !citationDoc(fact)) {
      skippedFacts.push(skip(fact, "missing_citation"));
      continue;
    }

    const canonicalRecordId = canonicalRecordIdOf(fact);
    const evidencePointer = evidencePointerOf(fact);
    const payload: SourceContextFactPayload = {
      sourceEventId: input.event.id,
      sourceEventCode: input.event.code ?? null,
      sourceEventName: input.event.name ?? null,
      sourceFactId: fact.id,
      factKey: fact.fact_key,
      entityKind: fact.entity_kind,
      entityRef: fact.entity_ref,
      valueNumeric: fact.value_numeric,
      valueText: fact.value_text,
      unit: fact.unit,
      sourceMethod: fact.source_method,
      sourceCitation: fact.source_citation,
      confidence: fact.confidence,
      capturedAt: fact.captured_at,
      stageKey: input.event.stageKey ?? null,
      writebackSchemaVersion: SOURCE_CONTEXT_WRITEBACK_SCHEMA_VERSION,
    };

    records.push({
      client_id: input.event.clientId ?? null,
      tenant_key: tenantKey,
      canonical_record_id: canonicalRecordId,
      record_type: SOURCE_CONTEXT_RECORD_TYPE,
      record_subtype: fact.fact_key,
      title: titleOf(input.event, fact),
      source_system: SOURCE_CONTEXT_SOURCE_SYSTEM,
      source_record_id: fact.id,
      source_file: citationDoc(fact),
      source_sheet: null,
      source_row_number: null,
      last_synced_at: input.committedAt,
      confidence: confidenceNumber(fact.confidence),
      freshness_status: "fresh",
      evidence_pointer: evidencePointer,
      lifecycle_state: "active",
      payload_hash: hashJson(payload),
      payload,
    });

    factDrafts.push({
      canonical_record_id: canonicalRecordId,
      client_id: input.event.clientId ?? null,
      tenant_key: tenantKey,
      fact_key: fact.fact_key,
      fact_type: value.factType,
      fact_value: value.factValue,
      fact_text: value.factText,
      source_system: SOURCE_CONTEXT_SOURCE_SYSTEM,
      source_record_id: fact.id,
      source_file: citationDoc(fact),
      source_sheet: null,
      source_row_number: null,
      last_synced_at: input.committedAt,
      confidence: confidenceNumber(fact.confidence),
      freshness_status: "fresh",
      evidence_pointer: evidencePointer,
      lifecycle_state: "active",
      value_hash: hashJson({
        factKey: fact.fact_key,
        value: value.factValue,
        sourceFactId: fact.id,
      }),
    });

    readinessDrafts.push({
      canonical_record_id: canonicalRecordId,
      object_table: "enterprise_context_records",
      object_id: "",
      client_key: tenantKey,
      tenant_id: input.event.clientId ?? null,
      source_layer: "tenant_context",
      agent_readiness_status: "not_reviewed",
      retrievability: "committed_not_indexed",
      classification: "internal",
      source_basis: "source_event_fact",
      confidence_level: confidenceLevel(fact.confidence),
      confidence_rationale:
        "Source fact is cited and persisted, but has not yet been indexed or citation-render verified for enterprise context retrieval.",
      applicable_agents: ["source", "atlas", "tower", "nexus"],
      policy_validation_status: "pending",
      provenance: {
        sourceSystem: SOURCE_CONTEXT_SOURCE_SYSTEM,
        sourceEventId: input.event.id,
        sourceFactId: fact.id,
        sourceFactKey: fact.fact_key,
        sourceCitation: fact.source_citation,
        writebackSchemaVersion: SOURCE_CONTEXT_WRITEBACK_SCHEMA_VERSION,
      },
      backfill_reason:
        "Source evidence writeback candidate; agent_ready requires separate retrieval and citation proof.",
    });
  }

  return { records, factDrafts, readinessDrafts, skippedFacts };
}

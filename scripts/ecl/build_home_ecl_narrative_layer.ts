#!/usr/bin/env npx tsx
/**
 * Generate Home narrative from the ECL projection substrate.
 *
 * This is the seam between the existing model-backed Home writer and the ECL cutover. It reads
 * governed Home projection rows, builds the same EnterpriseSignalPacket shape the writer already
 * verifies, asks the existing thesis/chapter pipeline to write prose, and optionally persists the
 * resulting chapter summaries and claim rows back to ecl_projection.home_enterprise_landscape.
 *
 * Plan-only by default. Writes require both:
 *   HOME_ECL_NARRATIVE_WRITE=true
 *   HOME_ECL_NARRATIVE_WRITE_APPROVED=true
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

import {
  buildVerifiedEnterpriseThesisFromSignalPacket,
  callClaude,
  THESIS_PROMPT_VERSION,
  validateStructure,
  type AnthropicLikeClient,
  type EnterpriseThesis,
  type GroundedClaim,
  type VisualOpportunity,
} from "../data-build/build-enterprise-thesis";
import {
  buildChapterViewsFromVerifiedThesis,
  buildHomeChapterProvenance,
  type ChapterId,
  type ChapterView,
} from "../data-build/build-home-chapters";
import type { ContextItem, Signal, SourceSummary, buildEnterpriseSignalPacket } from "../data-build/enterprise-signal-packet";
import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
  type ValidatedAgentContextBundle,
} from "../../src/lib/governance/agent-context-bundle";

type EnterpriseSignalPacket = ReturnType<typeof buildEnterpriseSignalPacket>;
type VerifiedEnterpriseThesisResult = Awaited<ReturnType<typeof buildVerifiedEnterpriseThesisFromSignalPacket>>;
type JsonRecord = Record<string, unknown>;

const HOME_SURFACE_KEY = "home_enterprise_landscape";
const DEFAULT_TENANT_KEY = "meridian-health";
const DEFAULT_ASSESSMENT_ID = "assessment-dense-source-room-20260823";
const DEFAULT_OUT_DIR = "/tmp/home-ecl-narrative-layer";
const PROJECTION_VERSION = 1;
const WRITE = process.env.HOME_ECL_NARRATIVE_WRITE === "true" && process.env.HOME_ECL_NARRATIVE_WRITE_APPROVED === "true";

const CXO_FORBIDDEN_VISIBLE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "ecl", pattern: /\bECL\b/i },
  { label: "projection", pattern: /\bprojections?\b/i },
  { label: "serving_view", pattern: /\bserving views?\b/i },
  { label: "loaded_row", pattern: /\bloaded rows?\b/i },
  { label: "canonical_entity", pattern: /\bcanonical entit(?:y|ies)\b/i },
  { label: "row_count", pattern: /\brow counts?\b/i },
  { label: "payload", pattern: /\bpayload\b/i },
  { label: "schema", pattern: /\bschemas?\b/i },
  { label: "source_room", pattern: /\bsource rooms?\b/i },
  { label: "writer", pattern: /\bwriter\b/i },
  { label: "provider_flag", pattern: /\bprovider flag\b/i },
  { label: "projection_entry", pattern: /\bprojection_entry\b/i },
  { label: "source_refs_json", pattern: /\bsource_refs_json\b/i },
  { label: "context_policy", pattern: /\bcontext_policy\b/i },
  { label: "usable_count", pattern: /\busable_count\b/i },
  { label: "row_readiness", pattern: /\brow readiness\b/i },
  { label: "bland_empty_headline", pattern: /\bnot enough verified evidence yet\b/i },
  { label: "routed_empty_claim", pattern: /\bNo verified claims were routed\b/i },
  { label: "build_gap", pattern: /\bcoverage gap in the build\b/i },
  { label: "raw_object_id", pattern: /\b(?:APP|PLAT|CTR|VEN|FLOW|DOC|INV|SLA|PO|RISK|CTRL|PROG|MEAS|MET|OBJ)-[A-Z0-9][A-Z0-9_-]*\b/i },
];

const RAW_VISIBLE_ID_PATTERN = /\b(?:APP|PLAT|CTR|VEN|FLOW|DOC|INV|SLA|PO|RISK|CTRL|PROG|MEAS|MET|OBJ)-[A-Z0-9][A-Z0-9_-]*\b/g;

const MACHINE_REFERENCE_KEYS = new Set([
  "id",
  "ids",
  "evidence_id",
  "evidence_ids",
  "evidenceIds",
  "evidenceRefs",
  "source_ref",
  "source_refs",
  "sourceRefs",
  "source_record_id",
  "sourceRecordId",
  "source_file_id",
  "sourceFileId",
  "row_key",
  "rowKey",
  "dataset_ref",
  "datasetRef",
]);

const CHAPTER_IDS: ChapterId[] = [
  "executive_brief",
  "our_business",
  "strategy_value_creation",
  "how_we_operate",
  "technology_data",
  "performance_value",
  "leadership_perspective",
  "what_needs_attention",
];

interface CliOptions {
  tenantKey: string;
  assessmentId: string;
  outDir: string;
  chapterIds: ChapterId[];
}

interface HomeProjectionWriteRow {
  id: string;
  tenant_key: string;
  assessment_id: string;
  snapshot_id: string;
  projection_manifest_id: string;
  projection_entry_id: string;
  projection_version: number;
  page_key: string;
  row_key: string;
  section_key: string;
  row_type: string;
  title: string;
  summary: string | null;
  primary_object_id: string | null;
  metric_keys_json: unknown;
  relationship_ids_json: unknown;
  source_refs_json: unknown;
  basis_summary: string | null;
  value_state: string;
  quality_state: string;
  admission_status: string;
  admission_gate_key: string | null;
  admission_result_json: unknown;
  gap_flags_json: unknown;
  display_payload_json: JsonRecord | null;
  source_hash: string;
}

interface ExecutiveSignalContent {
  row?: HomeProjectionWriteRow;
  statement: string;
  domains: string[];
}

interface ContextPolicyProof {
  policy_version: string;
  candidate_count: number;
  usable_count: number;
  agent_ready_count: number;
  blocked_count: number;
  blocked_count_by_reason: Record<string, number>;
  row_readiness_counts: Record<string, number>;
  usable_candidate_ids: string[];
  context_bundle_hash: string;
  source_hashes: string[];
}

interface GovernedSignalPacketBuild {
  signalPacket: EnterpriseSignalPacket;
  contextPolicyProof: ContextPolicyProof;
}

interface EclSourceRecordSummaryRow {
  file_name: string;
  source_type: string;
  origin: string;
  source_owner: string | null;
  quality_state: string;
  record_type: string | null;
  row_number: number | null;
  payload_json: JsonRecord | null;
}

function cliValue(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function parseChapterIds(raw: string | null): ChapterId[] {
  if (!raw || raw === "all") return CHAPTER_IDS;
  const ids = raw.split(",").map((item) => item.trim()).filter(Boolean);
  const invalid = ids.filter((id) => !CHAPTER_IDS.includes(id as ChapterId));
  if (invalid.length) throw new Error(`Unsupported --chapter value(s): ${invalid.join(", ")}`);
  return ids as ChapterId[];
}

function parseCli(): CliOptions {
  return {
    tenantKey: cliValue("--tenant") ?? process.env.ECL_DENSE_TENANT_KEY ?? DEFAULT_TENANT_KEY,
    assessmentId: cliValue("--assessment") ?? process.env.ECL_DENSE_ASSESSMENT_ID ?? DEFAULT_ASSESSMENT_ID,
    outDir: cliValue("--out-dir") ?? DEFAULT_OUT_DIR,
    chapterIds: parseChapterIds(cliValue("--chapter")),
  };
}

function hashJson(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function text(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function payloadText(data: JsonRecord, ...fields: string[]): string | null {
  for (const field of fields) {
    const value = text(data[field]);
    if (value) return value;
  }
  return null;
}

function payloadNumber(data: JsonRecord, ...fields: string[]): number {
  for (const field of fields) {
    const value = data[field];
    if (value === null || value === undefined || value === "") continue;
    const parsed = numberValue(value);
    if (parsed !== 0) return parsed;
  }
  return 0;
}

function payload(row: HomeProjectionWriteRow): JsonRecord {
  return row.display_payload_json && typeof row.display_payload_json === "object" ? row.display_payload_json : {};
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function materialPayloadFields(rows: EclSourceRecordSummaryRow[]): string[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const payload = row.payload_json && typeof row.payload_json === "object" ? row.payload_json : {};
    for (const [key, value] of Object.entries(payload)) {
      if (MACHINE_REFERENCE_KEYS.has(key)) continue;
      if (value === null || value === undefined || value === "") continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key]) => key)
    .slice(0, 12);
}

function sourceSummaryExample(row: EclSourceRecordSummaryRow, fields: string[]): string | null {
  const payload = row.payload_json && typeof row.payload_json === "object" ? row.payload_json : {};
  const values = fields.map((field) => text(payload[field])).filter((value): value is string => Boolean(value)).slice(0, 3);
  return values.length ? values.join(" · ") : text(row.record_type);
}

function sourceRefIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value
    .map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return null;
      const ref = item as Record<string, unknown>;
      return text(ref.source_record_id) ?? text(ref.sourceRecordId) ?? text(ref.record_id) ?? text(ref.source_file_id) ?? text(ref.id);
    })
    .filter((item): item is string => Boolean(item && item.trim().length > 0))
    .map((item) => item.trim());
  return [...new Set(ids)];
}

function incrementCount(counts: Map<string, number>, key: string) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function rowsOf(rows: HomeProjectionWriteRow[], pageKey: string, rowType: string): HomeProjectionWriteRow[] {
  return rows.filter((row) => row.page_key === pageKey && row.row_type === rowType);
}

function sumPayload(rows: HomeProjectionWriteRow[], field: string): number {
  return rows.reduce((sum, row) => sum + numberValue(payload(row)[field]), 0);
}

function dimensionShareRows(rows: HomeProjectionWriteRow[], field: string, limit: number): Array<Record<string, unknown>> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = text(payload(row)[field]) ?? "(not specified)";
    totals.set(label, (totals.get(label) ?? 0) + 1);
  }
  return Array.from(totals, ([label, count]) => ({
    label,
    sharePct: rows.length ? Number(((count / rows.length) * 100).toFixed(1)) : 0,
  }))
    .sort((a, b) => Number(b.sharePct) - Number(a.sharePct))
    .slice(0, limit);
}

function topSpendShareRows(
  rows: HomeProjectionWriteRow[],
  labelField: string,
  valueField: string,
  limit: number,
): Array<Record<string, unknown>> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = text(payload(row)[labelField]) ?? "(not specified)";
    totals.set(label, (totals.get(label) ?? 0) + numberValue(payload(row)[valueField]));
  }
  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  return Array.from(totals, ([label, value]) => ({
    label,
    sharePct: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
  }))
    .sort((a, b) => Number(b.sharePct) - Number(a.sharePct))
    .slice(0, limit);
}

function topCountShareRows(rows: HomeProjectionWriteRow[], labelField: string, limit: number): Array<{ label: string; count: number; sharePct: number }> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = text(payload(row)[labelField]) ?? "(not specified)";
    totals.set(label, (totals.get(label) ?? 0) + 1);
  }
  return Array.from(totals, ([label, count]) => ({
    label,
    count,
    sharePct: rows.length ? Number(((count / rows.length) * 100).toFixed(1)) : 0,
  }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function rowsWherePayload(rows: HomeProjectionWriteRow[], predicate: (data: JsonRecord) => boolean): HomeProjectionWriteRow[] {
  return rows.filter((row) => predicate(payload(row)));
}

function compactList(values: string[], limit = 3): string {
  const visible = values.slice(0, limit);
  const remainder = values.length - visible.length;
  return remainder > 0 ? `${visible.join(", ")} and ${remainder.toLocaleString()} more` : visible.join(", ");
}

function rowsForFieldValue(rows: HomeProjectionWriteRow[], field: string, value: string, limit = 20): HomeProjectionWriteRow[] {
  return rows.filter((row) => text(payload(row)[field]) === value).slice(0, limit);
}

function rowsForRankedFieldValues(
  rows: HomeProjectionWriteRow[],
  field: string,
  items: Array<{ label: string }>,
  rowsPerItem = 4,
): HomeProjectionWriteRow[] {
  const selected: HomeProjectionWriteRow[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    for (const row of rowsForFieldValue(rows, field, item.label, rowsPerItem)) {
      if (seen.has(row.projection_entry_id)) continue;
      seen.add(row.projection_entry_id);
      selected.push(row);
    }
  }
  return selected;
}

function evidenceRefsForRows(rows: HomeProjectionWriteRow[], limit = 20): string[] {
  return rows.map(contextId).slice(0, limit);
}

function contextId(row: HomeProjectionWriteRow): string {
  return `ctx_ecl_${row.page_key}_${row.row_type}_${row.row_key}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

function candidateIsReady(row: HomeProjectionWriteRow): boolean {
  const sourceRefs = sourceRefIds(row.source_refs_json);
  const admitted = row.admission_status === "admitted" || row.admission_status === "not_applicable";
  const usableQuality = ["passed", "warning", "accepted", "usable"].includes(row.quality_state);
  return (
    admitted &&
    row.value_state === "known" &&
    usableQuality &&
    Boolean(row.basis_summary) &&
    sourceRefs.length > 0 &&
    Boolean(row.source_hash)
  );
}

function confidenceForRow(row: HomeProjectionWriteRow): GovernedCandidate["confidence_level"] {
  if (!candidateIsReady(row)) return "unverified";
  return row.quality_state === "passed" || row.quality_state === "accepted" ? "high" : "medium";
}

function rowReadinessCounts(rows: HomeProjectionWriteRow[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const sourceRefs = sourceRefIds(row.source_refs_json);
    const admitted = row.admission_status === "admitted" || row.admission_status === "not_applicable";
    const usableQuality = ["passed", "warning", "accepted", "usable"].includes(row.quality_state);
    if (candidateIsReady(row)) {
      incrementCount(counts, "ready");
      incrementCount(counts, `ready_quality_${row.quality_state}`);
      continue;
    }
    if (!admitted) incrementCount(counts, `blocked_admission_${row.admission_status || "missing"}`);
    if (row.value_state !== "known") incrementCount(counts, `blocked_value_${row.value_state || "missing"}`);
    if (!usableQuality) incrementCount(counts, `blocked_quality_${row.quality_state || "missing"}`);
    if (!row.basis_summary) incrementCount(counts, "blocked_missing_basis_summary");
    if (sourceRefs.length === 0) incrementCount(counts, "blocked_missing_source_refs");
    if (!row.source_hash) incrementCount(counts, "blocked_missing_source_hash");
  }
  return Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function readinessStatus(row: HomeProjectionWriteRow): GovernedCandidate["agent_readiness_status"] {
  if (candidateIsReady(row)) return "agent_ready";
  if (row.admission_status === "refused" || row.quality_state === "blocked") return "blocked";
  return "not_reviewed";
}

function governedCandidateForRow(row: HomeProjectionWriteRow, tenantKey: string, renderedAt: string): GovernedCandidate {
  return {
    id: contextId(row),
    client_key: tenantKey,
    tenant_id: tenantKey,
    source_layer: "signal",
    source_basis: row.basis_summary,
    classification: "internal",
    retrievability: candidateIsReady(row) ? "fts_indexed" : "not_indexed",
    agent_readiness_status: readinessStatus(row),
    confidence_level: confidenceForRow(row),
    cited_render_verified_at: candidateIsReady(row) ? renderedAt : null,
    title: row.title,
    citations: sourceRefIds(row.source_refs_json),
  };
}

function governedCandidateForSignal(signal: Signal, tenantKey: string, renderedAt: string): GovernedCandidate {
  const citations = stringArray(signal.evidenceRefs);
  const ready = citations.length > 0;
  return {
    id: signal.id,
    client_key: tenantKey,
    tenant_id: tenantKey,
    source_layer: "signal",
    source_basis: "deterministic_home_signal_packet_v2",
    classification: "internal",
    retrievability: ready ? "fts_indexed" : "not_indexed",
    agent_readiness_status: ready ? "agent_ready" : "not_reviewed",
    confidence_level: ready ? "high" : "unverified",
    cited_render_verified_at: ready ? renderedAt : null,
    title: signal.kind,
    citations,
  };
}

function rowDomains(row: HomeProjectionWriteRow): string[] {
  switch (row.page_key) {
    case "applications_systems":
      return ["application_system"];
    case "vendor_contracts":
      return ["vendor_contract"];
    case "infrastructure_platforms":
      return ["infrastructure_platform"];
    case "current_state_data_flow":
    case "data_assets_integrations":
      return ["data_asset_or_integration", "application_system"];
    default:
      return ["evidence_sources"];
  }
}

function proofFromBundle(
  bundle: ValidatedAgentContextBundle,
  candidates: GovernedCandidate[],
  sourceHashes: string[],
  readinessCounts: Record<string, number>,
): ContextPolicyProof {
  const blockedCountByReason = new Map<string, number>();
  for (const blocked of bundle.blocked) {
    const firstReason = blocked.errors[0] ?? "unknown_policy_block";
    const reasonCode = firstReason
      .replace(/["']/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase()
      .slice(0, 120) || "unknown_policy_block";
    blockedCountByReason.set(reasonCode, (blockedCountByReason.get(reasonCode) ?? 0) + 1);
  }
  return {
    policy_version: bundle.policy_version,
    candidate_count: candidates.length,
    usable_count: bundle.usable.length,
    agent_ready_count: bundle.agentReadyCount,
    blocked_count: bundle.blocked.length,
    blocked_count_by_reason: Object.fromEntries(blockedCountByReason),
    row_readiness_counts: readinessCounts,
    usable_candidate_ids: bundle.usable.map((candidate) => candidate.id),
    context_bundle_hash: hashJson({
      policy_version: bundle.policy_version,
      usable_candidate_ids: bundle.usable.map((candidate) => candidate.id),
      blocked_candidate_ids: bundle.blocked.map((blocked) => blocked.candidate.id),
      citations: bundle.citations,
    }),
    source_hashes: [...new Set(sourceHashes.filter(Boolean))].sort(),
  };
}

function rowStatement(row: HomeProjectionWriteRow, labelByIdentifier: Map<string, string> = new Map()): string {
  const data = payload(row);
  const visible = (value: unknown) => visibleText(value, labelByIdentifier);
  switch (row.page_key) {
    case "applications_systems":
      return [
        `${visible(data.application_name) ?? visible(row.title) ?? row.title} is recorded as an application`,
        visible(data.business_function) ? `for ${visible(data.business_function)}` : null,
        visible(data.vendor_name) ? `supplied by ${visible(data.vendor_name)}` : null,
        visible(data.criticality_tier) ? `with ${visible(data.criticality_tier)} criticality` : null,
        numberValue(data.annual_cost_usd) > 0 ? `and $${(numberValue(data.annual_cost_usd) / 1_000_000).toFixed(1)}M annual cost` : null,
      ].filter(Boolean).join(" ") + ".";
    case "vendor_contracts":
      return [
        `${visible(data.contract_name) ?? visible(row.title) ?? row.title} is recorded as a contract`,
        payloadText(data, "supplier_name", "vendor_name") ? `with ${visible(payloadText(data, "supplier_name", "vendor_name"))}` : null,
        visible(data.service_category) ? `for ${visible(data.service_category)}` : null,
        payloadNumber(data, "annualized_value_usd", "annual_spend_usd") > 0 ? `with $${(payloadNumber(data, "annualized_value_usd", "annual_spend_usd") / 1_000_000).toFixed(1)}M annualized value` : null,
        payloadNumber(data, "notice_window_days", "notice_period_days") > 0 ? `and ${payloadNumber(data, "notice_window_days", "notice_period_days")} days notice` : null,
      ].filter(Boolean).join(" ") + ".";
    case "infrastructure_platforms":
      return [
        `${visible(data.platform_name) ?? visible(row.title) ?? row.title} is recorded as an infrastructure or platform record`,
        visible(data.platform_type) ? `of type ${visible(data.platform_type)}` : null,
        visible(data.hosting_model) ? `on ${visible(data.hosting_model)}` : null,
        visible(data.criticality_tier) ? `with ${visible(data.criticality_tier)} criticality` : null,
        visible(data.support_end_date) ? `with support ending ${visible(data.support_end_date)}` : null,
      ].filter(Boolean).join(" ") + ".";
    case "current_state_data_flow":
    case "data_assets_integrations":
      return [
        `${visible(data.data_asset_name) ?? visible(row.title) ?? row.title} is recorded as a data movement`,
        visible(data.source_system) ? `from ${visible(data.source_system)}` : null,
        visible(data.target_system) ? `to ${visible(data.target_system)}` : null,
        visible(data.integration_type) ? `using ${visible(data.integration_type)}` : null,
        visible(data.consumption_layer) ? `serving ${visible(data.consumption_layer)}` : null,
      ].filter(Boolean).join(" ") + ".";
    default:
      return visible(row.summary) ?? visible(row.title) ?? row.title;
  }
}

function visibleText(value: unknown, labelByIdentifier: Map<string, string>): string | null {
  const raw = text(value);
  return raw ? scrubRawVisibleIds(raw, labelByIdentifier) : null;
}

function rawIdentifierFallback(id: string): string {
  if (id.startsWith("APP-")) return "a named application";
  if (id.startsWith("PLAT-")) return "a named platform";
  if (id.startsWith("CTR-")) return "a named contract";
  if (id.startsWith("VEN-")) return "a named supplier";
  if (id.startsWith("FLOW-")) return "a governed data movement";
  if (id.startsWith("DOC-")) return "a governed evidence document";
  if (id.startsWith("INV-")) return "a governed invoice record";
  if (id.startsWith("SLA-")) return "a governed service-level record";
  if (id.startsWith("PO-")) return "a governed purchase order";
  if (id.startsWith("RISK-")) return "a governed risk item";
  if (id.startsWith("CTRL-")) return "a governed control item";
  if (id.startsWith("PROG-")) return "a governed program";
  if (id.startsWith("MEAS-") || id.startsWith("MET-")) return "a governed metric";
  return "a governed record";
}

function hasRawVisibleId(value: string): boolean {
  RAW_VISIBLE_ID_PATTERN.lastIndex = 0;
  const found = RAW_VISIBLE_ID_PATTERN.test(value);
  RAW_VISIBLE_ID_PATTERN.lastIndex = 0;
  return found;
}

function safeVisibleIdentifierLabel(id: string, label: string): string | null {
  const candidate = label
    .replace(RAW_VISIBLE_ID_PATTERN, (match) => rawIdentifierFallback(match))
    .replace(/\s+/g, " ")
    .trim();
  if (!candidate || candidate === id || hasRawVisibleId(candidate)) return null;
  return candidate;
}

function scrubRawVisibleIds(value: string, labelByIdentifier: Map<string, string>): string {
  return value.replace(RAW_VISIBLE_ID_PATTERN, (match) => {
    const label = labelByIdentifier.get(match);
    return label && !hasRawVisibleId(label) ? label : rawIdentifierFallback(match);
  });
}

function preferredDisplayLabel(row: HomeProjectionWriteRow): string | null {
  const data = payload(row);
  return (
    text(data.application_name) ??
    text(data.system_name) ??
    text(data.platform_name) ??
    text(data.contract_name) ??
    text(data.supplier_name) ??
    text(data.vendor_name) ??
    text(data.data_asset_name) ??
    text(data.metric_name) ??
    text(data.measure_name) ??
    text(data.name) ??
    text(row.title)
  );
}

function addIdentifierLabel(labelByIdentifier: Map<string, string>, id: unknown, label: string | null) {
  const key = text(id);
  const rawLabel = text(label);
  RAW_VISIBLE_ID_PATTERN.lastIndex = 0;
  if (!key || !rawLabel || !RAW_VISIBLE_ID_PATTERN.test(key)) return;
  RAW_VISIBLE_ID_PATTERN.lastIndex = 0;
  const safeLabel = safeVisibleIdentifierLabel(key, rawLabel);
  if (!safeLabel) return;
  labelByIdentifier.set(key, safeLabel);
}

function buildVisibleIdentifierLabels(rows: HomeProjectionWriteRow[]): Map<string, string> {
  const labelByIdentifier = new Map<string, string>();
  const idKeys = [
    "application_id",
    "system_id",
    "app_id",
    "platform_id",
    "infrastructure_id",
    "contract_id",
    "supplier_id",
    "vendor_id",
    "data_flow_id",
    "flow_id",
    "document_id",
    "invoice_id",
    "sla_id",
    "purchase_order_id",
    "risk_id",
    "control_id",
    "program_id",
    "metric_id",
    "measure_id",
  ];
  for (const row of rows) {
    const label = preferredDisplayLabel(row);
    addIdentifierLabel(labelByIdentifier, row.primary_object_id, label);
    addIdentifierLabel(labelByIdentifier, row.row_key, label);
    const data = payload(row);
    for (const key of idKeys) addIdentifierLabel(labelByIdentifier, data[key], label);
  }
  return labelByIdentifier;
}

function scrubVisibleIdsInValue(value: unknown, labelByIdentifier: Map<string, string>, parentKey?: string): unknown {
  if (parentKey && MACHINE_REFERENCE_KEYS.has(parentKey)) return value;
  if (typeof value === "string") return scrubRawVisibleIds(value, labelByIdentifier);
  if (Array.isArray(value)) return value.map((item) => scrubVisibleIdsInValue(item, labelByIdentifier, parentKey));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as JsonRecord).map(([key, item]) => [key, scrubVisibleIdsInValue(item, labelByIdentifier, key)]),
    );
  }
  return value;
}

function scrubThesisResultVisibleIds(
  thesisResult: VerifiedEnterpriseThesisResult,
  labelByIdentifier: Map<string, string>,
): VerifiedEnterpriseThesisResult {
  return {
    ...thesisResult,
    publishedGeneration: thesisResult.publishedGeneration
      ? scrubVisibleIdsInValue(thesisResult.publishedGeneration, labelByIdentifier) as EnterpriseThesis
      : thesisResult.publishedGeneration,
  } as VerifiedEnterpriseThesisResult;
}

function makeClaim(statement: string, evidenceIds: string[], claimType: GroundedClaim["claim_type"] = "FACT", confidence: GroundedClaim["confidence"] = "high"): GroundedClaim {
  return { statement, evidence_ids: evidenceIds, confidence, claim_type: claimType };
}

function makeVisual(datasetRef: string, title: string, keyMessage: string, evidenceIds: string[]): VisualOpportunity {
  return {
    visual_type: "horizontal_bar",
    title,
    purpose: "Render a precomputed governed dataset without generating values.",
    dataset_ref: datasetRef,
    key_message: keyMessage,
    evidence_ids: evidenceIds,
    priority: "high",
  };
}

function buildScopeContextItems(args: {
  rows: HomeProjectionWriteRow[];
  sourceSummaries: SourceSummary[];
}): ContextItem[] {
  const { rows, sourceSummaries } = args;
  const readyRowsForPage = (pageKey: string) =>
    rows.filter((row) => row.page_key === pageKey && row.row_type !== "summary" && row.row_type !== "chapter_claim" && candidateIsReady(row));
  const sourceRows = sourceSummaries.reduce((sum, item) => sum + (item.rawRowCount ?? item.recordCount), 0);
  const sourceFamilies = [...new Set(sourceSummaries.map((item) => item.domain).filter(Boolean))].length;
  const leadershipRows = readyRowsForPage("leadership_perspective");
  const strategyRows = readyRowsForPage("strategy_value_creation");
  const performanceRows = readyRowsForPage("performance_value");

  return [
    {
      id: "ctx_ecl_scope_business_economics_001",
      statement:
        "Segment revenue, customer/channel economics, and formal enterprise identity attributes are not supplied by the current Home narrative input; business-model conclusions should therefore be limited to the cited technology, commercial, infrastructure, and data-movement facts.",
      domains: ["enterprise_profile", "spend_value_fact", "application_system", "vendor_contract"],
    },
    {
      id: "ctx_ecl_scope_strategy_programs_001",
      statement: strategyRows.length
        ? `The strategy and value chapter has ${strategyRows.length.toLocaleString()} ready evidence items, but the Home narrative input does not supply a full program-to-outcome ledger; strategic claims must cite the named evidence and avoid implying a complete transformation roadmap.`
        : "Declared strategic priorities, funded programs, and program-to-outcome linkage are not supplied by the current Home narrative input; the chapter should treat strategy as an evidence gap rather than infer a transformation agenda.",
      domains: ["spend_value_fact", "vendor_contract", "evidence_sources"],
    },
    {
      id: "ctx_ecl_scope_leadership_001",
      statement: leadershipRows.length
        ? `The leadership perspective chapter has ${leadershipRows.length.toLocaleString()} ready evidence items; leadership consensus or disagreement claims must cite those items and should not be generalized beyond them.`
        : "Leadership interview quotes, leadership sentiment, and named consensus or disagreement evidence are not supplied by the current Home narrative input; do not infer executive priorities or leadership alignment.",
      domains: ["evidence_sources"],
    },
    {
      id: "ctx_ecl_scope_value_linkage_001",
      statement: performanceRows.length
        ? `The performance and value chapter has ${performanceRows.length.toLocaleString()} ready evidence items, but the Home narrative input does not establish a complete value chain from spend to programs, KPIs, finance attestation, and realized benefit.`
        : "Contract values and application costs are present, but program, KPI, finance-attestation, and realized-benefit mappings are not supplied by the current Home narrative input; value claims should name that limitation instead of implying measured outcomes.",
      domains: ["spend_value_fact", "vendor_contract", "evidence_sources"],
    },
    {
      id: "ctx_ecl_scope_source_breadth_001",
      statement:
        sourceSummaries.length > 0
          ? `The source ledger contributes ${sourceSummaries.length.toLocaleString()} source-family summaries across ${sourceFamilies.toLocaleString()} source families and ${sourceRows.toLocaleString()} raw source rows; those summaries describe coverage breadth, not proof for a tenant-specific business claim.`
          : "No source-family summary ledger is present in the current Home narrative input; coverage breadth cannot be used to support business claims.",
      domains: ["evidence_sources"],
    },
  ];
}

function buildDeterministicHomeSignals(args: {
  permittedApplications: HomeProjectionWriteRow[];
  permittedContracts: HomeProjectionWriteRow[];
  permittedInfrastructure: HomeProjectionWriteRow[];
  permittedDataFlows: HomeProjectionWriteRow[];
  permittedRows: HomeProjectionWriteRow[];
  contractSpend: number;
  vendorRows: Array<Record<string, unknown>>;
}): Signal[] {
  const {
    permittedApplications,
    permittedContracts,
    permittedInfrastructure,
    permittedDataFlows,
    permittedRows,
    contractSpend,
    vendorRows,
  } = args;
  const signals: Signal[] = [];
  const add = (
    id: string,
    kind: Signal["kind"],
    statement: string,
    domains: string[],
    evidenceRows: HomeProjectionWriteRow[],
    value?: number,
  ) => {
    const evidenceRefs = evidenceRefsForRows(evidenceRows);
    if (evidenceRefs.length === 0) return;
    signals.push({ id, kind, statement, domains, evidenceRefs, ...(value === undefined ? {} : { value }) });
  };

  const topFunctions = topCountShareRows(permittedApplications, "business_function", 8);
  const topFunction = topFunctions[0];
  const applicationCost = sumPayload(permittedApplications, "annual_cost_usd");
  const applicationsWithCost = rowsWherePayload(permittedApplications, (data) => numberValue(data.annual_cost_usd) > 0);
  const tierOneApplications = rowsWherePayload(permittedApplications, (data) => /tier[-_\s]?1/i.test(text(data.criticality_tier) ?? ""));
  const lifecycleWatch = rowsWherePayload(permittedApplications, (data) => {
    const lifecycle = `${text(data.lifecycle_status) ?? ""} ${text(data.disposition) ?? ""} ${text(data.watch_status) ?? ""}`;
    return /watch|aging|replace|legacy|retir/i.test(lifecycle);
  });
  const topVendor = vendorRows[0];
  const autoRenewContracts = rowsWherePayload(permittedContracts, (data) => /^true$/i.test(text(data.auto_renew) ?? ""));
  const longNoticeContracts = rowsWherePayload(permittedContracts, (data) => payloadNumber(data, "notice_window_days", "notice_period_days") >= 180);
  const contractsWithValue = rowsWherePayload(permittedContracts, (data) => payloadNumber(data, "annualized_value_usd", "annual_spend_usd") > 0);
  const topHosting = topCountShareRows(permittedInfrastructure, "hosting_model", 5)[0];
  const supportDatedPlatforms = rowsWherePayload(permittedInfrastructure, (data) => Boolean(text(data.support_end_date)));
  const criticalPlatforms = rowsWherePayload(permittedInfrastructure, (data) => /tier[-_\s]?1|critical/i.test(text(data.criticality_tier) ?? ""));
  const topFlowTarget = topCountShareRows(permittedDataFlows, "target_system", 5)[0];
  const topFlowType = topCountShareRows(permittedDataFlows, "integration_type", 5)[0];
  const consumptionLayers = topCountShareRows(permittedDataFlows, "consumption_layer", 4)
    .filter((item) => item.label !== "(not specified)")
    .map((item) => `${item.label} (${item.count.toLocaleString()})`);
  const chapterEvidenceRows = (pageKey: string) => permittedRows.filter((row) => row.page_key === pageKey).slice(0, 20);

  add(
    "sig_ecl_estate_001",
    "portfolio",
    `The executive-ready record contains ${permittedApplications.length.toLocaleString()} applications, ${permittedContracts.length.toLocaleString()} contracts, ${permittedInfrastructure.length.toLocaleString()} infrastructure and platform records, and ${permittedDataFlows.length.toLocaleString()} data movements.`,
    ["application_system", "vendor_contract", "infrastructure_platform", "data_asset_or_integration"],
    [...permittedApplications, ...permittedContracts, ...permittedInfrastructure, ...permittedDataFlows],
  );
  if (topFunction) {
    add(
      "sig_ecl_application_function_002",
      "concentration",
      `${topFunction.label} is the largest application function in the current estate at ${topFunction.count.toLocaleString()} of ${permittedApplications.length.toLocaleString()} applications (${topFunction.sharePct.toFixed(1)}%).`,
      ["application_system"],
      rowsForFieldValue(permittedApplications, "business_function", topFunction.label),
      topFunction.sharePct,
    );
  }
  if (topFunctions.length) {
    add(
      "sig_ecl_application_function_ranking_012",
      "portfolio",
      `The largest application functions by recorded application count are ${compactList(
        topFunctions.map((item) => `${item.label} (${item.count.toLocaleString()} of ${permittedApplications.length.toLocaleString()}, ${item.sharePct.toFixed(1)}%)`),
        8,
      )}. Do not name another function as strategically prominent unless a cited fact states that prominence.`,
      ["application_system"],
      rowsForRankedFieldValues(permittedApplications, "business_function", topFunctions),
    );
  }
  if (applicationCost > 0) {
    add(
      "sig_ecl_application_cost_013",
      "portfolio",
      `${applicationsWithCost.length.toLocaleString()} applications carry annual-cost evidence totaling $${(applicationCost / 1_000_000).toFixed(1)}M. This is recorded application annual cost, not a complete enterprise technology budget or finance-attested spend total unless another cited fact says so.`,
      ["application_system", "spend_value_fact"],
      applicationsWithCost,
      applicationCost,
    );
  }
  add(
    "sig_ecl_application_criticality_003",
    "risk",
    `${tierOneApplications.length.toLocaleString()} of ${permittedApplications.length.toLocaleString()} applications are marked tier-1, while ${lifecycleWatch.length.toLocaleString()} carry lifecycle or replacement-watch evidence.`,
    ["application_system"],
    [...tierOneApplications, ...lifecycleWatch],
  );
  if (topVendor) {
    const topVendorLabel = String(topVendor.label);
    const topFiveShare = vendorRows.slice(0, 5).reduce((sum, item) => sum + numberValue(item.sharePct), 0);
    add(
      "sig_ecl_vendor_concentration_004",
      "concentration",
      `${topVendorLabel} is the largest supplier group at ${Number(topVendor.sharePct).toFixed(1)}% of ready contract value; the top five supplier groups account for ${topFiveShare.toFixed(1)}%.`,
      ["vendor_contract", "spend_value_fact"],
      rowsForFieldValue(permittedContracts, "supplier_name", topVendorLabel),
      Number(topVendor.sharePct),
    );
  }
  add(
    "sig_ecl_contract_value_005",
    "portfolio",
    `${contractsWithValue.length.toLocaleString()} contracts carry annualized-value evidence totaling $${(contractSpend / 1_000_000).toFixed(1)}M across the ready contract base.`,
    ["vendor_contract", "spend_value_fact"],
    contractsWithValue,
    contractSpend,
  );
  add(
    "sig_ecl_contract_flexibility_006",
    "risk",
    `${autoRenewContracts.length.toLocaleString()} ready contracts are marked auto-renewal and ${longNoticeContracts.length.toLocaleString()} require at least 180 days notice, making renewal timing a commercial control to inspect before asserting savings or flexibility.`,
    ["vendor_contract", "spend_value_fact"],
    [...autoRenewContracts, ...longNoticeContracts],
  );
  if (topHosting) {
    add(
      "sig_ecl_hosting_mix_007",
      "complexity",
      `${topHosting.label} is the largest hosting model among infrastructure and platform records at ${topHosting.count.toLocaleString()} of ${permittedInfrastructure.length.toLocaleString()} records (${topHosting.sharePct.toFixed(1)}%).`,
      ["infrastructure_platform", "application_system"],
      rowsForFieldValue(permittedInfrastructure, "hosting_model", topHosting.label),
      topHosting.sharePct,
    );
  }
  add(
    "sig_ecl_platform_resilience_008",
    "risk",
    `${supportDatedPlatforms.length.toLocaleString()} infrastructure or platform records carry support-end dates, and ${criticalPlatforms.length.toLocaleString()} carry tier-1 or criticality evidence.`,
    ["infrastructure_platform"],
    [...supportDatedPlatforms, ...criticalPlatforms],
  );
  if (topFlowTarget) {
    add(
      "sig_ecl_data_flow_convergence_009",
      "dependency",
      `${topFlowTarget.label} is the most frequent recorded data-movement destination at ${topFlowTarget.count.toLocaleString()} of ${permittedDataFlows.length.toLocaleString()} movements (${topFlowTarget.sharePct.toFixed(1)}%).`,
      ["data_asset_or_integration", "application_system"],
      rowsForFieldValue(permittedDataFlows, "target_system", topFlowTarget.label),
      topFlowTarget.sharePct,
    );
  }
  add(
    "sig_ecl_data_flow_total_014",
    "portfolio",
    `The data-movement inventory contains ${permittedDataFlows.length.toLocaleString()} recorded source-to-target movement rows. This is an integration-record count, not transaction volume, data volume, business usage, or proof of analytics consumption.`,
    ["data_asset_or_integration"],
    permittedDataFlows,
  );
  if (topFlowType) {
    add(
      "sig_ecl_integration_pattern_010",
      "complexity",
      `${topFlowType.label} is the most common recorded integration pattern at ${topFlowType.count.toLocaleString()} of ${permittedDataFlows.length.toLocaleString()} movements (${topFlowType.sharePct.toFixed(1)}%).`,
      ["data_asset_or_integration"],
      rowsForFieldValue(permittedDataFlows, "integration_type", topFlowType.label),
      topFlowType.sharePct,
    );
  }
  if (consumptionLayers.length) {
    add(
      "sig_ecl_data_consumption_011",
      "portfolio",
      `The data-movement record names consumption layers including ${compactList(consumptionLayers)}, so the analytics story should distinguish source movement from business consumption.`,
      ["data_asset_or_integration"],
      permittedDataFlows,
    );
  }
  for (const [pageKey, label, domains] of [
    ["our_business", "business model", ["enterprise_profile", "application_system"]],
    ["strategy_value_creation", "strategy and value", ["spend_value_fact", "vendor_contract"]],
    ["how_we_operate", "operating model", ["application_system", "data_asset_or_integration"]],
    ["technology_data", "technology and data", ["application_system", "infrastructure_platform", "data_asset_or_integration"]],
    ["performance_value", "performance and value", ["spend_value_fact", "vendor_contract"]],
    ["leadership_perspective", "leadership perspective", ["evidence_sources"]],
    ["what_needs_attention", "executive attention", ["risk_control", "vendor_contract", "infrastructure_platform"]],
  ] as Array<[string, string, string[]]>) {
    const evidenceRows = chapterEvidenceRows(pageKey);
    if (evidenceRows.length === 0) continue;
    add(
      `sig_ecl_${pageKey}_coverage`,
      "operational",
      `The ${label} chapter has ${evidenceRows.length.toLocaleString()} ready evidence items available; its conclusions should stay within those named items and their cited source records.`,
      domains,
      evidenceRows,
    );
  }
  add(
    "sig_ecl_source_breadth_guardrail_019",
    "data_quality",
    `This narrative packet is built from ${permittedRows.length.toLocaleString()} ready governed facts; source-family summaries describe intake breadth but are not evidence for a business claim by themselves.`,
    ["evidence_sources"],
    permittedRows,
  );
  return signals;
}

function buildGovernedSignalPacket(
  rows: HomeProjectionWriteRow[],
  tenantKey: string,
  assessmentId: string,
  sourceSummaries: SourceSummary[] = [],
): GovernedSignalPacketBuild {
  const renderedAt = new Date().toISOString();
  const rowContentByCandidateId = new Map<string, ExecutiveSignalContent>();
  const rowCandidates: GovernedCandidate[] = [];
  const labelByIdentifier = buildVisibleIdentifierLabels(rows);

  for (const row of rows.filter((item) => item.row_type !== "summary" && item.row_type !== "chapter_claim")) {
    const candidate = governedCandidateForRow(row, tenantKey, renderedAt);
    rowCandidates.push(candidate);
    rowContentByCandidateId.set(candidate.id, {
      row,
      statement: rowStatement(row, labelByIdentifier),
      domains: rowDomains(row),
    });
  }

  const validatedRows = buildValidatedAgentContextBundle(rowCandidates, { requireAgentReady: true });
  const readinessCounts = rowReadinessCounts(rows.filter((item) => item.row_type !== "summary" && item.row_type !== "chapter_claim"));
  const permittedRowIds = new Set(validatedRows.usable.map((candidate) => candidate.id));
  const permittedRows = rows.filter((row) => permittedRowIds.has(contextId(row)));

  const applications = rowsOf(rows, "applications_systems", "application");
  const contracts = rowsOf(rows, "vendor_contracts", "contract");
  const infrastructure = rowsOf(rows, "infrastructure_platforms", "infrastructure");
  const dataFlows = [
    ...rowsOf(rows, "current_state_data_flow", "data_flow"),
    ...rowsOf(rows, "data_assets_integrations", "data_flow"),
  ];
  const permittedApplications = rowsOf(permittedRows, "applications_systems", "application");
  const permittedContracts = rowsOf(permittedRows, "vendor_contracts", "contract");
  const permittedInfrastructure = rowsOf(permittedRows, "infrastructure_platforms", "infrastructure");
  const permittedDataFlows = [
    ...rowsOf(permittedRows, "current_state_data_flow", "data_flow"),
    ...rowsOf(permittedRows, "data_assets_integrations", "data_flow"),
  ];
  const contractSpend = permittedContracts.reduce((sum, row) => sum + payloadNumber(payload(row), "annualized_value_usd", "annual_spend_usd"), 0);
  const vendorRows = topSpendShareRows(permittedContracts, "supplier_name", "annualized_value_usd", 8);
  const rawSignals = buildDeterministicHomeSignals({
    permittedApplications,
    permittedContracts,
    permittedInfrastructure,
    permittedDataFlows,
    permittedRows,
    contractSpend,
    vendorRows,
  });
  const signalCandidates = rawSignals.map((signal) => governedCandidateForSignal(signal, tenantKey, renderedAt));
  const validatedSignals = buildValidatedAgentContextBundle(signalCandidates, { requireAgentReady: true });
  const usableSignalIds = new Set(validatedSignals.usable.map((candidate) => candidate.id));
  const signals = rawSignals.filter((signal) => usableSignalIds.has(signal.id));

  const contextItems: ContextItem[] = [
    {
      id: "ctx_ecl_assessment_001",
      statement: `The current evidence package is synthetic and not client-attested; executive conclusions must preserve that limitation.`,
      domains: ["enterprise_profile", "evidence_sources"],
    },
    ...buildScopeContextItems({ rows, sourceSummaries }),
    ...validatedRows.usable
      .map((candidate) => {
        const content = rowContentByCandidateId.get(candidate.id);
        return content ? { id: candidate.id, statement: content.statement, domains: content.domains } : null;
      })
      .filter((item): item is ContextItem => Boolean(item))
      .slice(0, 900),
  ];
  if (validatedRows.blocked.length > 0) {
    contextItems.push({
      id: "ctx_ecl_context_policy_summary_001",
      statement: `Some candidate facts were withheld from executive use; the affected areas should be treated as evidence-readiness gaps until source, review, retrievability, or admission status is corrected.`,
      domains: ["evidence_sources"],
    });
  }

  const mergedBundle: ValidatedAgentContextBundle = {
    ...validatedRows,
    usable: [...validatedRows.usable, ...validatedSignals.usable],
    blocked: [...validatedRows.blocked, ...validatedSignals.blocked],
    agentReadyCount: validatedRows.agentReadyCount + validatedSignals.agentReadyCount,
    citations: [...new Set([...validatedRows.citations, ...validatedSignals.citations])],
  };
  const contextPolicyProof = proofFromBundle(
    mergedBundle,
    [...rowCandidates, ...signalCandidates],
    rows.map((row) => row.source_hash),
    readinessCounts,
  );

  const packet = {
    enterpriseIdentity: {
      businessModel: null,
      industry: null,
      revenue: null,
      employeeCount: null,
    },
    businessEconomics: {
      operatingSegments: [],
      customerSegments: [],
      technologyBudget: sumPayload(permittedApplications, "annual_cost_usd"),
      technologyBudgetShareOfRevenue: null,
    },
    strategicPriorities: [],
    signals,
    contextItems,
    visualDatasets: {
      application_landscape_by_function: dimensionShareRows(permittedApplications, "business_function", 8),
      vendor_spend_concentration: vendorRows,
    },
    sourceSummaries,
    analyticalLenses: [],
    coverageManifest: {
      dimensionCoverage: [
        { key: "home_applications_systems", recordCount: applications.length, evidencedShare: applications.length ? 1 : 0 },
        { key: "home_vendor_contracts", recordCount: contracts.length, evidencedShare: contracts.length ? 1 : 0 },
        { key: "home_infrastructure_platforms", recordCount: infrastructure.length, evidencedShare: infrastructure.length ? 1 : 0 },
        { key: "home_data_flows", recordCount: dataFlows.length, evidencedShare: dataFlows.length ? 1 : 0 },
        { key: "home_agent_ready_applications_systems", recordCount: permittedApplications.length, evidencedShare: applications.length ? permittedApplications.length / applications.length : 0 },
        { key: "home_agent_ready_vendor_contracts", recordCount: permittedContracts.length, evidencedShare: contracts.length ? permittedContracts.length / contracts.length : 0 },
        { key: "home_agent_ready_infrastructure_platforms", recordCount: permittedInfrastructure.length, evidencedShare: infrastructure.length ? permittedInfrastructure.length / infrastructure.length : 0 },
        { key: "home_agent_ready_data_flows", recordCount: permittedDataFlows.length, evidencedShare: dataFlows.length ? permittedDataFlows.length / dataFlows.length : 0 },
      ],
      leadershipToPortfolioLinkage: {
        resolvableRows: 0,
        totalRows: 0,
        coveragePct: 0,
        linkedPrograms: 0,
        interpretation: "Leadership-to-portfolio linkage is not supplied by the Home ECL projection rows used for this narrative build.",
      },
      vendorDocumentEvidence: {
        contractsWithExtraction: 0,
        totalContracts: contracts.length,
        interpretation: "Document extraction coverage is outside this Home projection narrative input and must be checked in the commercial evidence layer.",
      },
      metricComparability: {
        comparable: 0,
        total: 0,
        inconsistentNotation: 0,
        interpretation: "Metric comparability is not supplied by the Home ECL projection rows used for this narrative build.",
      },
      prohibitedComparisons: [
        "Do not infer leadership consensus, program sponsorship, or causal performance impact from Home projection rows alone.",
      ],
    },
  };
  return { signalPacket: packet, contextPolicyProof };
}

async function readEclSourceSummaries(db: Client, tenantKey: string, assessmentId: string): Promise<SourceSummary[]> {
  const result = await db.query<EclSourceRecordSummaryRow>(
    `
      select
        f.file_name,
        f.source_type,
        f.origin,
        f.source_owner,
        f.quality_state,
        r.record_type,
        r.row_number,
        r.payload_json
      from ecl_source.source_file f
      left join ecl_source.source_record r
        on r.tenant_key = f.tenant_key
       and r.assessment_id = f.assessment_id
       and r.source_file_id = f.id
      where f.tenant_key = $1
        and f.assessment_id = $2
      order by f.file_name, r.row_number nulls last
    `,
    [tenantKey, assessmentId],
  );

  const byFile = new Map<string, EclSourceRecordSummaryRow[]>();
  for (const row of result.rows) {
    const rows = byFile.get(row.file_name) ?? [];
    rows.push(row);
    byFile.set(row.file_name, rows);
  }

  return [...byFile.entries()]
    .map(([fileName, rows]) => {
      const first = rows[0];
      const recordRows = rows.filter((row) => row.record_type);
      const materialFields = materialPayloadFields(recordRows);
      return {
        sourcePath: fileName,
        domain: first.source_type,
        objectTypes: [...new Set(recordRows.map((row) => row.record_type).filter((value): value is string => Boolean(value)))].sort(),
        recordCount: 0,
        rawRowCount: recordRows.length,
        canonicalRecordCount: 0,
        sourceKind: first.origin === "client_intake" ? "client_intake_file" : "source_layer_file",
        basis: ["coverage_context_not_citable"],
        authority: [first.source_owner ?? first.origin],
        qualityStates: [first.quality_state],
        materialFields,
        exampleRecords: recordRows
          .map((row) => sourceSummaryExample(row, materialFields))
          .filter((value): value is string => Boolean(value))
          .slice(0, 5),
      } satisfies SourceSummary;
    })
    .sort((a, b) => (b.rawRowCount ?? 0) - (a.rawRowCount ?? 0) || a.sourcePath.localeCompare(b.sourcePath));
}

async function readHomeProjectionRows(db: Client, tenantKey: string, assessmentId: string): Promise<HomeProjectionWriteRow[]> {
  const result = await db.query<HomeProjectionWriteRow>(
    `
      select
        id,
        tenant_key,
        assessment_id,
        snapshot_id,
        projection_manifest_id,
        projection_entry_id,
        projection_version,
        page_key,
        row_key,
        section_key,
        row_type,
        title,
        summary,
        primary_object_id,
        metric_keys_json,
        relationship_ids_json,
        source_refs_json,
        basis_summary,
        value_state,
        quality_state,
        admission_status,
        admission_gate_key,
        admission_result_json,
        gap_flags_json,
        display_payload_json,
        source_hash
      from ecl_projection.home_enterprise_landscape
      where tenant_key = $1 and assessment_id = $2 and projection_version = $3
      order by page_key, row_key
    `,
    [tenantKey, assessmentId, PROJECTION_VERSION],
  );
  return result.rows;
}

function claimRowsForChapter(chapter: ChapterView): GroundedClaim[] {
  return [...chapter.key_insights, ...chapter.tensions, ...chapter.what_to_watch].filter(Boolean);
}

function verdictTally(ledger: Array<{ verdict: string }>): Record<string, number> {
  return ledger.reduce<Record<string, number>>((acc, row) => {
    acc[row.verdict] = (acc[row.verdict] ?? 0) + 1;
    return acc;
  }, {});
}

function actionTally(ledger: Array<{ action: string }>): Record<string, number> {
  return ledger.reduce<Record<string, number>>((acc, row) => {
    acc[row.action] = (acc[row.action] ?? 0) + 1;
    return acc;
  }, {});
}

function publicationGateIssues(
  thesisResult: Awaited<ReturnType<typeof buildVerifiedEnterpriseThesisFromSignalPacket>>,
  signalPacket: EnterpriseSignalPacket,
): string[] {
  const issues = [...(thesisResult.publicationIssues ?? [])];
  if (thesisResult.publishedGeneration) {
    const publishedStructuralIssues = validateStructure(thesisResult.publishedGeneration, signalPacket);
    if (publishedStructuralIssues.length) {
      issues.push(`published_structural_issues_${publishedStructuralIssues.length}`);
    }
  }
  for (const row of thesisResult.verificationLedger) {
    if (row.verdict === "UNSUPPORTED" && !row.action.startsWith("dropped")) {
      issues.push(`unsupported_claim_not_dropped:${row.path}:${row.action}`);
    }
    if (row.verdict === "OVERSTATED" && !row.action.startsWith("repaired") && !row.action.startsWith("dropped")) {
      issues.push(`overstated_claim_not_repaired_or_dropped:${row.path}:${row.action}`);
    }
  }
  return issues;
}

function visibleClaimTexts(claims: GroundedClaim[] | null | undefined): string[] {
  return (claims ?? []).filter(Boolean).map((claim) => claim.statement);
}

function visibleNarrativeText(
  thesisResult: Awaited<ReturnType<typeof buildVerifiedEnterpriseThesisFromSignalPacket>>,
  chapters: ChapterView[],
): Array<{ path: string; text: string }> {
  const out: Array<{ path: string; text: string }> = [];
  const thesis = thesisResult.publishedGeneration as EnterpriseThesis | null;
  if (thesis) {
    out.push({ path: "thesis.enterprise_story", text: thesis.enterprise_story });
    out.push({ path: "thesis.value_creation_model.summary", text: thesis.value_creation_model.summary });
    for (const [section, claims] of Object.entries({
      enterprise_story_claims: thesis.enterprise_story_claims,
      primary_value_drivers: thesis.value_creation_model.primary_value_drivers,
      economic_dependencies: thesis.value_creation_model.economic_dependencies,
      strategic_bets: thesis.strategic_bets,
      structural_constraints: thesis.structural_constraints,
      operating_tensions: thesis.operating_tensions,
      leadership_consensus: thesis.leadership_consensus,
      leadership_disagreements: thesis.leadership_disagreements,
      where_improving: thesis.performance_story.where_improving,
      where_off_track: thesis.performance_story.where_off_track,
      where_unknown: thesis.performance_story.where_unknown,
      technology_and_data_implications: thesis.technology_and_data_implications,
      material_risks: thesis.material_risks,
      value_realization_tensions: thesis.value_realization_tensions,
      what_needs_attention: thesis.what_needs_attention,
      things_a_new_cxo_should_know: thesis.things_a_new_cxo_should_know,
      questions_for_management: thesis.questions_for_management,
    })) {
      visibleClaimTexts(claims as GroundedClaim[]).forEach((text, index) => {
        out.push({ path: `thesis.${section}[${index}]`, text });
      });
    }
    for (const [index, visual] of (thesis.visual_opportunities ?? []).entries()) {
      out.push({ path: `thesis.visual_opportunities[${index}].title`, text: visual.title });
      out.push({ path: `thesis.visual_opportunities[${index}].key_message`, text: visual.key_message });
    }
  }
  for (const chapter of chapters) {
    out.push({ path: `chapter.${chapter.chapterId}.headline`, text: chapter.headline });
    out.push({ path: `chapter.${chapter.chapterId}.executive_synthesis`, text: chapter.executive_synthesis });
    [
      ...chapter.key_insights,
      ...chapter.tensions,
      ...chapter.what_to_watch,
    ].forEach((claim, index) => {
      out.push({ path: `chapter.${chapter.chapterId}.claim[${index}]`, text: claim.statement });
    });
    chapter.questions_to_ask.forEach((question, index) => {
      out.push({ path: `chapter.${chapter.chapterId}.question[${index}]`, text: question });
    });
    for (const [index, visual] of (chapter.visual_opportunities ?? []).entries()) {
      out.push({ path: `chapter.${chapter.chapterId}.visual[${index}].title`, text: visual.title });
      out.push({ path: `chapter.${chapter.chapterId}.visual[${index}].key_message`, text: visual.key_message });
    }
  }
  return out;
}

function visibleNarrativeQualityIssues(
  thesisResult: Awaited<ReturnType<typeof buildVerifiedEnterpriseThesisFromSignalPacket>>,
  chapters: ChapterView[],
): string[] {
  const issues: string[] = [];
  for (const item of visibleNarrativeText(thesisResult, chapters)) {
    for (const forbidden of CXO_FORBIDDEN_VISIBLE_PATTERNS) {
      if (forbidden.pattern.test(item.text)) {
        issues.push(`forbidden_visible_term:${forbidden.label}:${item.path}`);
      }
    }
  }
  return issues;
}

function hasForbiddenVisibleLanguage(text: string): boolean {
  return CXO_FORBIDDEN_VISIBLE_PATTERNS.some((forbidden) => forbidden.pattern.test(text));
}

function chapterHasSubstantiveContent(chapter: ChapterView): boolean {
  return (
    chapter.key_insights.length > 0 ||
    chapter.tensions.length > 0 ||
    chapter.what_to_watch.length > 0 ||
    chapter.questions_to_ask.length > 0 ||
    chapter.visual_opportunities.length > 0
  );
}

function normalizeChapterTerminalStates(chapters: ChapterView[]): ChapterView[] {
  return chapters.map((chapter) => {
    const terminalText = [
      chapter.headline,
      chapter.executive_synthesis,
      ...chapter.limitations,
    ].some((textValue) => hasForbiddenVisibleLanguage(textValue));

    if (!terminalText) return chapter;

    const hasContent = chapterHasSubstantiveContent(chapter);
    return {
      ...chapter,
      headline: `${chapter.title}: evidence needs resolution before executive use`,
      executive_synthesis: `The current governed record does not yet support a board-ready answer to "${chapter.guidingQuestion}". Keep this chapter in review until named sources establish the operating facts, decision stakes, and accountable owner.`,
      key_insights: hasContent ? chapter.key_insights : [],
      tensions: hasContent ? chapter.tensions : [],
      what_to_watch: hasContent ? chapter.what_to_watch : [],
      questions_to_ask: hasContent ? chapter.questions_to_ask : [],
      visual_opportunities: hasContent ? chapter.visual_opportunities : [],
      limitations: [
        "Deferred for executive use because the published evidence is not yet strong enough to support the chapter answer.",
      ],
    };
  });
}

async function writeNarrativeRows(
  db: Client,
  options: CliOptions,
  rows: HomeProjectionWriteRow[],
  chapters: ChapterView[],
  thesisResult: Awaited<ReturnType<typeof buildVerifiedEnterpriseThesisFromSignalPacket>>,
  signalPacket: EnterpriseSignalPacket,
  contextPolicyProof: ContextPolicyProof,
) {
  const generatedAt = new Date().toISOString();
  const provenance = buildHomeChapterProvenance(signalPacket, THESIS_PROMPT_VERSION, generatedAt);
  const summaryRowsByPage = new Map(rows.filter((row) => row.row_type === "summary").map((row) => [row.page_key, row]));
  const selectedIds = new Set(chapters.map((chapter) => chapter.chapterId));

  await db.query("BEGIN");
  try {
    await db.query(
      `
        delete from ecl_projection.home_enterprise_landscape
        where tenant_key = $1
          and assessment_id = $2
          and projection_version = $3
          and row_type = 'chapter_claim'
          and page_key = any($4::text[])
      `,
      [options.tenantKey, options.assessmentId, PROJECTION_VERSION, Array.from(selectedIds)],
    );
    await db.query(
      `
        delete from ecl_projection.projection_entry
        where tenant_key = $1
          and assessment_id = $2
          and projection_version = $3
          and surface_key = $4
          and row_type = 'chapter_claim'
          and split_part(row_key, '_writer_claim_', 1) = any($5::text[])
      `,
      [options.tenantKey, options.assessmentId, PROJECTION_VERSION, HOME_SURFACE_KEY, Array.from(selectedIds)],
    );

    for (const chapter of chapters) {
      const summaryRow = summaryRowsByPage.get(chapter.chapterId);
      if (!summaryRow) throw new Error(`No summary row exists for chapter ${chapter.chapterId}`);
      const writerPayload = {
        ...payload(summaryRow),
        writer: {
          source: "ecl_projection.home_enterprise_landscape",
          generated_at: generatedAt,
          provenance,
          raw_thesis_structural_issue_count: thesisResult.structuralIssues.length,
          published_thesis_structural_issue_count: validateStructure(thesisResult.publishedGeneration as EnterpriseThesis, signalPacket).length,
          verification_verdict_tally: verdictTally(thesisResult.verificationLedger),
          verification_action_tally: actionTally(thesisResult.verificationLedger),
          publication_gate: {
            accepted: true,
            issues: [],
          },
          context_policy: contextPolicyProof,
          signal_packet_hash: hashJson(signalPacket),
          claim_rows_written: claimRowsForChapter(chapter).length,
        },
        writer_headline: chapter.headline,
        writer_executive_synthesis: chapter.executive_synthesis,
      };
      const summarySourceHash = hashJson({
        page_key: chapter.chapterId,
        row_key: summaryRow.row_key,
        title: chapter.headline,
        summary: chapter.executive_synthesis,
        writer: writerPayload.writer,
      });
      await db.query(
        `
          update ecl_projection.projection_entry
          set source_hash = $5,
              display_cache_json = $6::jsonb
          where tenant_key = $1
            and assessment_id = $2
            and projection_version = $3
            and id = $4
        `,
        [
          options.tenantKey,
          options.assessmentId,
          PROJECTION_VERSION,
          summaryRow.projection_entry_id,
          summarySourceHash,
          JSON.stringify({ page_key: chapter.chapterId, section_key: summaryRow.section_key, title: chapter.headline }),
        ],
      );
      await db.query(
        `
          update ecl_projection.home_enterprise_landscape
          set title = $4,
              summary = $5,
              display_payload_json = $6::jsonb,
              basis_summary = 'model_generated_from_ecl_projection',
              quality_state = case when quality_state = 'failed' then quality_state else 'passed' end,
              source_hash = $7
          where tenant_key = $1
            and assessment_id = $2
            and projection_version = $3
            and id = $8
        `,
        [
          options.tenantKey,
          options.assessmentId,
          PROJECTION_VERSION,
          chapter.headline,
          chapter.executive_synthesis,
          JSON.stringify(writerPayload),
          summarySourceHash,
          summaryRow.id,
        ],
      );

      const claims = claimRowsForChapter(chapter);
      for (const [index, claim] of claims.entries()) {
        const rowKey = `${chapter.chapterId}_writer_claim_${String(index + 1).padStart(3, "0")}`;
        const displayPayload = {
          writer: {
            source: "ecl_projection.home_enterprise_landscape",
            generated_at: generatedAt,
            provenance,
            claim_path: rowKey,
          },
          chapter_id: chapter.chapterId,
          claim_type: claim.claim_type,
          evidence_ids: claim.evidence_ids,
          confidence: claim.confidence,
        };
        const rowHash = hashJson({ rowKey, claim, displayPayload });
        const entryResult = await db.query<{ id: string }>(
          `
            insert into ecl_projection.projection_entry (
              tenant_key,
              assessment_id,
              snapshot_id,
              projection_manifest_id,
              projection_version,
              surface_key,
              row_key,
              row_type,
              source_hash,
              refs_content_hash,
              refs_cache_json,
              display_cache_json
            )
            values ($1,$2,$3,$4,$5,$6,$7,'chapter_claim',$8,$9,$10::jsonb,$11::jsonb)
            returning id
          `,
          [
            options.tenantKey,
            options.assessmentId,
            summaryRow.snapshot_id,
            summaryRow.projection_manifest_id,
            PROJECTION_VERSION,
            HOME_SURFACE_KEY,
            rowKey,
            rowHash,
            hashJson({ evidence_ids: claim.evidence_ids }),
            JSON.stringify({ objects: [], metrics: [], measures: [], relationships: [], source_records: [], document_extractions: [] }),
            JSON.stringify({ page_key: chapter.chapterId, section_key: "chapter_narrative", title: claim.statement }),
          ],
        );
        await db.query(
          `
            insert into ecl_projection.home_enterprise_landscape (
              tenant_key,
              assessment_id,
              snapshot_id,
              projection_manifest_id,
              projection_entry_id,
              projection_version,
              page_key,
              row_key,
              section_key,
              row_type,
              title,
              summary,
              primary_object_id,
              metric_keys_json,
              relationship_ids_json,
              source_refs_json,
              basis_summary,
              value_state,
              quality_state,
              admission_status,
              admission_gate_key,
              admission_result_json,
              gap_flags_json,
              display_payload_json,
              source_hash
            )
            values ($1,$2,$3,$4,$5,$6,$7,$8,'chapter_narrative','chapter_claim',$9,$10,null,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,
              'model_generated_from_ecl_projection','known','passed','not_applicable',null,'{}'::jsonb,'[]'::jsonb,$11::jsonb,$12)
          `,
          [
            options.tenantKey,
            options.assessmentId,
            summaryRow.snapshot_id,
            summaryRow.projection_manifest_id,
            entryResult.rows[0].id,
            PROJECTION_VERSION,
            chapter.chapterId,
            rowKey,
            claim.statement,
            claim.statement,
            JSON.stringify(displayPayload),
            rowHash,
          ],
        );
      }
    }

    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function main() {
  const options = parseCli();
  fs.mkdirSync(options.outDir, { recursive: true });

  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to read ECL Home projection rows.");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is required to generate Home narrative.");

  const { getAnthropicDirectClient } = await import("../../src/lib/integrations/ai-egress/anthropic-direct");
  const anthropic = getAnthropicDirectClient({ workload: "home_ecl_narrative" }) as AnthropicLikeClient;
  const db = new Client({ connectionString: process.env.DATABASE_URL });

  await db.connect();
  try {
    const rows = await readHomeProjectionRows(db, options.tenantKey, options.assessmentId);
    if (rows.length === 0) throw new Error(`No Home ECL projection rows found for ${options.tenantKey}/${options.assessmentId}.`);

    const sourceSummaries = await readEclSourceSummaries(db, options.tenantKey, options.assessmentId);
    const { signalPacket, contextPolicyProof } = buildGovernedSignalPacket(
      rows,
      options.tenantKey,
      options.assessmentId,
      sourceSummaries,
    );
    console.log(
      `${options.tenantKey}/${options.assessmentId}: ${rows.length} Home projection rows -> ` +
        `${signalPacket.signals.length} signals, ${signalPacket.contextItems.length} context items, ` +
        `${signalPacket.sourceSummaries.length} source summaries; ` +
        `${contextPolicyProof.usable_count}/${contextPolicyProof.candidate_count} governed candidates usable`,
    );
    console.log(`row readiness: ${JSON.stringify(contextPolicyProof.row_readiness_counts)}`);
    if (contextPolicyProof.usable_count === 0 || signalPacket.signals.length === 0) {
      throw new Error(
        `Home ECL narrative refused: no governed usable evidence reached the executive packet. ` +
          `readiness=${JSON.stringify(contextPolicyProof.row_readiness_counts)}`,
      );
    }

    const labelByIdentifier = buildVisibleIdentifierLabels(rows);
    const rawThesisResult = await buildVerifiedEnterpriseThesisFromSignalPacket(signalPacket, anthropic);
    const thesisResult = scrubThesisResultVisibleIds(rawThesisResult, labelByIdentifier);
    if (!thesisResult.publishedGeneration) throw new Error("Home ECL narrative writer produced no publishable thesis.");
    const publicationIssues = publicationGateIssues(thesisResult, signalPacket);
    if (publicationIssues.length) {
      throw new Error(`Home ECL narrative publication gate failed: ${publicationIssues.join("; ")}`);
    }

    const generatedChapters = await buildChapterViewsFromVerifiedThesis(
      signalPacket,
      thesisResult.publishedGeneration as EnterpriseThesis,
      anthropic,
      options.chapterIds,
    );
    const chapters = normalizeChapterTerminalStates(scrubVisibleIdsInValue(generatedChapters, labelByIdentifier) as ChapterView[]);
    const visibleQualityIssues = visibleNarrativeQualityIssues(thesisResult, chapters);
    if (visibleQualityIssues.length) {
      throw new Error(`Home ECL narrative visible-quality gate failed: ${visibleQualityIssues.join("; ")}`);
    }
    const result = {
      tenantKey: options.tenantKey,
      assessmentId: options.assessmentId,
      writeApplied: WRITE,
      chapters,
      signalPacket,
      contextPolicyProof,
      thesisResult,
    };
    const outFile = path.join(options.outDir, `${options.tenantKey}-home-ecl-narrative-layer.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
    console.log(`-> ${outFile}`);

    if (WRITE) {
      await writeNarrativeRows(db, options, rows, chapters, thesisResult, signalPacket, contextPolicyProof);
      console.log(`✓ wrote ${chapters.length} chapter summaries and ${chapters.reduce((sum, chapter) => sum + claimRowsForChapter(chapter).length, 0)} chapter claim rows`);
    } else {
      console.log("Plan-only complete. Set HOME_ECL_NARRATIVE_WRITE=true and HOME_ECL_NARRATIVE_WRITE_APPROVED=true to write ECL projection narrative rows.");
    }

    const verificationSummary = {
      structural_issue_count: thesisResult.structuralIssues.length,
      verdict_tally: verdictTally(thesisResult.verificationLedger),
      action_tally: actionTally(thesisResult.verificationLedger),
      publication_gate: {
        accepted: true,
        issues: [],
      },
      ledger_rows: thesisResult.verificationLedger.length,
    };

    console.log(JSON.stringify({
      structured_event: "home_ecl_narrative_layer_summary",
      tenant_key: options.tenantKey,
      assessment_id: options.assessmentId,
      write_applied: WRITE,
      source_projection_rows: rows.length,
      signal_count: signalPacket.signals.length,
      context_item_count: signalPacket.contextItems.length,
      source_summary_count: signalPacket.sourceSummaries.length,
      source_summary_rows: signalPacket.sourceSummaries.reduce((sum, item) => sum + (item.rawRowCount ?? item.recordCount), 0),
      chapter_count: chapters.length,
      chapter_claim_rows: chapters.reduce((sum, chapter) => sum + claimRowsForChapter(chapter).length, 0),
      thesis_prompt_version: THESIS_PROMPT_VERSION,
      context_policy: contextPolicyProof,
      signal_packet_hash: hashJson(signalPacket),
      verification: verificationSummary,
      out_file: outFile,
    }));

    console.log(`__HOME_ECL_NARRATIVE_RESULT_BEGIN__${JSON.stringify(result)}__HOME_ECL_NARRATIVE_RESULT_END__`);
  } finally {
    await db.end();
  }
}

if (process.argv[1] && process.argv[1].includes("build_home_ecl_narrative_layer")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

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
import type { ContextItem, Signal, buildEnterpriseSignalPacket } from "../data-build/enterprise-signal-packet";
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
const DEFAULT_ASSESSMENT_ID = "ecl-dense-meridian-2026-08-23";
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
    purpose: "Render a precomputed ECL projection dataset without generating values.",
    dataset_ref: datasetRef,
    key_message: keyMessage,
    evidence_ids: evidenceIds,
    priority: "high",
  };
}

function buildGovernedSignalPacket(rows: HomeProjectionWriteRow[], tenantKey: string, assessmentId: string): GovernedSignalPacketBuild {
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
  const topVendor = vendorRows[0];
  const allUsableRowIds = validatedRows.usable.map((candidate) => candidate.id);
  const rowIdsFor = (needle: string) => allUsableRowIds.filter((id) => id.includes(needle)).slice(0, 20);

  const rawSignals: Signal[] = [
    {
      id: "sig_ecl_estate_001",
      kind: "portfolio",
      statement: `The governed record contains ${permittedApplications.length.toLocaleString()} applications, ${permittedContracts.length.toLocaleString()} contracts, ${permittedInfrastructure.length.toLocaleString()} infrastructure/platform records, and ${permittedDataFlows.length.toLocaleString()} data-flow movements eligible for executive use.`,
      domains: ["application_system", "vendor_contract", "infrastructure_platform", "data_asset_or_integration"],
      evidenceRefs: allUsableRowIds.slice(0, 20),
    },
    {
      id: "sig_ecl_vendor_002",
      kind: "concentration",
      statement: topVendor
        ? `The governed contract record contains ${permittedContracts.length.toLocaleString()} contracts with $${(contractSpend / 1_000_000).toFixed(1)}M annualized value; ${String(topVendor.label)} is the largest visible supplier group at ${Number(topVendor.sharePct).toFixed(1)}% of ready contract value.`
        : "The governed contract record has no supplier spend facts eligible for executive use.",
      domains: ["vendor_contract", "spend_value_fact"],
      evidenceRefs: rowIdsFor("_vendor_contracts_"),
    },
    {
      id: "sig_ecl_data_flow_003",
      kind: "complexity",
      statement: `The governed data-flow record contains ${permittedDataFlows.length.toLocaleString()} source-target movements eligible for executive use, giving the architecture and data-flow pages topology evidence rather than a fixed inventory list.`,
      domains: ["data_asset_or_integration", "application_system"],
      evidenceRefs: rowIdsFor("_data_flow_"),
    },
    {
      id: "sig_ecl_writer_004",
      kind: "operational",
      statement: "Home narrative prose is allowed to use only governed facts with citations, while factual counts remain deterministic record facts.",
      domains: ["evidence_sources", "application_system", "vendor_contract"],
      evidenceRefs: allUsableRowIds.slice(0, 20),
    },
  ];
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

    const { signalPacket, contextPolicyProof } = buildGovernedSignalPacket(rows, options.tenantKey, options.assessmentId);
    console.log(
      `${options.tenantKey}/${options.assessmentId}: ${rows.length} Home projection rows -> ` +
        `${signalPacket.signals.length} signals, ${signalPacket.contextItems.length} context items; ` +
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

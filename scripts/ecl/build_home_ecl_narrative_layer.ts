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
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Client } from "pg";

import {
  buildVerifiedEnterpriseThesisFromSignalPacket,
  THESIS_PROMPT_VERSION,
  validateStructure,
  type AnthropicLikeClient,
  type EnterpriseThesis,
  type GroundedClaim,
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
import { HOME_PAGE_PROMPT_CONTRACT } from "./home_page_prompt_contracts";

type EnterpriseSignalPacket = ReturnType<typeof buildEnterpriseSignalPacket>;
type VerifiedEnterpriseThesisResult = Awaited<ReturnType<typeof buildVerifiedEnterpriseThesisFromSignalPacket>>;
type JsonRecord = Record<string, unknown>;
type HomeExecutiveStoryTerminalState = "published" | "refused" | "deferred";
type HomeExecutiveStorySectionId = "enterprise" | "bets" | "runs-on" | "costs-returns" | "exposed" | "attention";
type HomeExecutiveStoryPlanV1 = {
  contractVersion: "home-executive-story-plan/v1";
  tenantKey: string;
  assessmentId: string;
  snapshotId: string | null;
  openingThesisClaimRef: string | null;
  openingSupportingClaimRefs: string[];
  scaleFactRef: string | null;
  decisions: Array<{
    decisionId: string;
    question: string;
    whyNowClaimRefs: string[];
    ownerRef: string | null;
    handoffModule: "moves" | "source" | "tower" | "intelligence" | null;
    evidenceNeeded: string[];
  }>;
  sectionOrder: HomeExecutiveStorySectionId[];
  sections: Array<{
    sectionId: HomeExecutiveStorySectionId;
    state: HomeExecutiveStoryTerminalState;
    leadClaimRef: string | null;
    supportingClaimRefs: string[];
    reasonCode: string | null;
  }>;
  chapterStates: Record<ChapterId, { state: HomeExecutiveStoryTerminalState; reasonCode: string | null }>;
  heroVisualDatasetRef: string | null;
  overallEvidenceBoundary: string;
  sourceClaimRefs: string[];
  storyPlanHash: string;
};
type DeterministicCategorySummary = {
  key: string;
  label: string;
  sourcePaths: string[];
  recordCount: number;
  denominator: string;
  topDimensions: Array<{ field: string; values: Array<{ label: string; count: number; sharePct: number }> }>;
  measures: Record<string, number>;
  gaps: string[];
};
type HomePagePromptContract = {
  pageKey: string;
  label: string;
  writerLens: string;
  voice: string;
  decisionQuestion: string;
  requiredContext: string[];
  sourceLayerReads: string[];
  mustShow: string[];
  forbidden: string[];
  lensContract?: HomeLensContract;
};
type HomeLensContract = {
  hat: string;
  primaryAudience: string;
  promptInstruction: string;
  evidencePriority: string[];
  style: string;
  mustNotDo: string[];
};

const HOME_SURFACE_KEY = "home_enterprise_landscape";
const HOME_PAGE_PROMPT_CONTRACT_PATH = "docs/architecture/home-v2-page-prompt-contracts-2026-08-30.json";
const DEFAULT_TENANT_KEY = "meridian-health";
const DEFAULT_ASSESSMENT_ID = "assessment-dense-source-room-20260823";
const DEFAULT_OUT_DIR = "/tmp/home-ecl-narrative-layer";
const DEFAULT_ACTIVE_SOURCE_ROOT = "datasets/tenant-inputs/active";
const PROJECTION_VERSION = 1;
const STORY_PLAN_CONTRACT_VERSION = "home-executive-story-plan/v1" as const;
const WRITE = process.env.HOME_ECL_NARRATIVE_WRITE === "true" && process.env.HOME_ECL_NARRATIVE_WRITE_APPROVED === "true";
const RAW_PUBLICATION_MAX_UNSUPPORTED = 0;
const RAW_PUBLICATION_MAX_OVERSTATED = 3;
const RAW_PUBLICATION_MIN_CLEAN_KEEP_RATE = 0.85;

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
const FAKE_DATA_WORKLOAD_GAP_PATTERN =
  /\b(?:confirm|validate|collect|provide|supply|obtain)\b[\s\S]{0,100}\b(?:reports?|ETL|jobs?|scripts?|users?|data[-\s]?volume|TB)\b/i;
const INVENTORY_OPENING_PATTERN =
  /\b(?:largest application functions|recorded application count|data-movement inventory|recorded source-to-target movement rows|infrastructure or platform records|named infrastructure or platform examples|\d+(?:,\d{3})*(?:\.\d+)?\s+(?:applications|systems|source-target|data movements|flows|workload items|reports|ETL jobs|scripts|platforms|vendors|suppliers|contracts)|\d+(?:,\d{3})*(?:\.\d+)?\s+of\s+\d+(?:,\d{3})*)\b/i;
const COMMERCIAL_OPENING_PATTERN =
  /\b(?:vendor|supplier|supplier group|top five supplier|contract|contracted value|commercial exposure|ready contract value|reviewed contract value)\b/i;
const EVIDENCE_BOUNDARY_OPENING_PATTERN =
  /\b(?:not supplied|not yet supplied|not available|does not yet establish|should therefore be limited|do not infer|coverage gap|evidence gap|missing evidence|not enough verified evidence|not client-attested|synthetic)\b/i;
const NARROW_PROGRAM_OPENING_PATTERN =
  /\b(?:named strategic priority|named program|named initiative|\d+(?:\.\d+)?%\s+complete|blocked on unconfirmed|single program)\b/i;
const BUSINESS_CONSEQUENCE_PATTERN =
  /\b(?:value|revenue|margin|patient|member|provider|payer|care|operating model|priority|outcome|finance|risk|accountability|decision|capacity|service|access|performance|modernization|transformation)\b/i;
const BROAD_ENTERPRISE_THESIS_PATTERN =
  /\b(?:operating[-\s]model|business[-\s]model|value creation|provider|payer|health plan|member|patient|care delivery|book of business|leadership agenda|executive agenda)\b/i;
const INDIVIDUAL_ASSET_OPENING_PATTERN =
  /\b(?:regional server room|server room|appliance|cluster|single system|single platform|named infrastructure|named platform)\b/i;

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
  source_record_id?: string | null;
  file_name: string;
  source_type: string;
  origin: string;
  source_owner: string | null;
  quality_state: string;
  record_type: string | null;
  row_number: number | null;
  payload_json: JsonRecord | null;
}

type SourceTableSummary = {
  rows: EclSourceRecordSummaryRow[];
  recordCount: number;
};

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

function readHomePagePromptContracts(): HomePagePromptContract[] {
  const contractPath = path.join(process.cwd(), HOME_PAGE_PROMPT_CONTRACT_PATH);
  const parsed = fs.existsSync(contractPath)
    ? (JSON.parse(fs.readFileSync(contractPath, "utf8")) as {
        pages?: Array<Record<string, unknown>>;
        lens_contracts?: Record<string, Record<string, unknown>>;
      })
    : (HOME_PAGE_PROMPT_CONTRACT as unknown as {
        pages?: Array<Record<string, unknown>>;
        lens_contracts?: Record<string, Record<string, unknown>>;
      });
  const lensContracts = parsed.lens_contracts ?? {};
  return (parsed.pages ?? [])
    .map((page) => {
      const writerLens = text(page.writer_lens) ?? "";
      const lens = lensContracts[writerLens];
      return {
        pageKey: text(page.page_key) ?? "",
        label: text(page.label) ?? "",
        writerLens,
        voice: text(page.voice) ?? "",
        decisionQuestion: text(page.decision_question) ?? "",
        requiredContext: stringArray(page.required_context),
        sourceLayerReads: stringArray(page.source_layer_reads),
        mustShow: stringArray(page.must_show),
        forbidden: stringArray(page.forbidden),
        lensContract: lens
          ? {
              hat: text(lens.hat) ?? "",
              primaryAudience: text(lens.primary_audience) ?? "",
              promptInstruction: text(lens.prompt_instruction) ?? "",
              evidencePriority: stringArray(lens.evidence_priority),
              style: text(lens.style) ?? "",
              mustNotDo: stringArray(lens.must_not_do),
            }
          : undefined,
      };
    })
    .filter((page) => page.pageKey && page.writerLens);
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

function payloadField(data: JsonRecord, ...fields: string[]): string | null {
  for (const field of fields) {
    const value = text(data[field]);
    if (value) return value;
  }
  return null;
}

function splitSourceList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/;|\n|\|/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatUsd(value: string | null): string | null {
  if (!value) return null;
  const numeric = Number(value.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(numeric)) return value;
  if (numeric >= 1_000_000_000) return `$${(numeric / 1_000_000_000).toFixed(1)}B`;
  if (numeric >= 1_000_000) return `$${(numeric / 1_000_000).toFixed(1)}M`;
  return `$${numeric.toLocaleString()}`;
}

function formatUsdNumber(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value).toLocaleString()}`;
}

function rawNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = text(value);
  if (!raw) return 0;
  const cleaned = raw.replace(/[$,%\s,]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sourceRowsMatching(rows: EclSourceRecordSummaryRow[], pattern: RegExp): EclSourceRecordSummaryRow[] {
  return rows.filter((row) => pattern.test(row.file_name) && row.payload_json && typeof row.payload_json === "object");
}

function rowPayload(row: EclSourceRecordSummaryRow): JsonRecord {
  return row.payload_json && typeof row.payload_json === "object" ? row.payload_json : {};
}

function sanitizeIdPart(value: string): string {
  return value
    .replace(/\.csv$/i, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function sourceRecordContextId(row: EclSourceRecordSummaryRow): string {
  if (row.source_record_id) return `ctx_ecl_source_record_${sanitizeIdPart(row.source_record_id)}`;
  return `ctx_ecl_source_row_${sanitizeIdPart(row.file_name)}_${String(row.row_number ?? 0).padStart(5, "0")}`;
}

function sourceRowsByFile(rows: EclSourceRecordSummaryRow[]): Map<string, SourceTableSummary> {
  const byFile = new Map<string, SourceTableSummary>();
  for (const row of rows.filter((item) => item.payload_json && item.record_type)) {
    const current = byFile.get(row.file_name) ?? { rows: [], recordCount: 0 };
    current.rows.push(row);
    current.recordCount += 1;
    byFile.set(row.file_name, current);
  }
  return byFile;
}

function sumSourceNumber(rows: EclSourceRecordSummaryRow[], ...fields: string[]): number {
  return rows.reduce((sum, row) => {
    const data = rowPayload(row);
    for (const field of fields) {
      const value = rawNumber(data[field]);
      if (value !== 0) return sum + value;
    }
    return sum;
  }, 0);
}

function topSourceCountRows(
  rows: EclSourceRecordSummaryRow[],
  field: string,
  limit: number,
): Array<{ label: string; count: number; sharePct: number }> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = payloadField(rowPayload(row), field) ?? "(not specified)";
    totals.set(label, (totals.get(label) ?? 0) + 1);
  }
  return [...totals.entries()]
    .map(([label, count]) => ({ label, count, sharePct: rows.length ? Number(((count / rows.length) * 100).toFixed(1)) : 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function topSourceNumberRows(
  rows: EclSourceRecordSummaryRow[],
  labelField: string,
  valueField: string,
  limit: number,
): Array<{ label: string; value: number; sharePct: number }> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const data = rowPayload(row);
    const label = payloadField(data, labelField) ?? "(not specified)";
    totals.set(label, (totals.get(label) ?? 0) + rawNumber(data[valueField]));
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value, sharePct: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0 }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function countSourceRows(rows: EclSourceRecordSummaryRow[], field: string, pattern: RegExp): number {
  return rows.filter((row) => pattern.test(payloadField(rowPayload(row), field) ?? "")).length;
}

function sourceFileRows(rows: EclSourceRecordSummaryRow[], filePattern: RegExp): EclSourceRecordSummaryRow[] {
  return sourceRowsMatching(rows, filePattern).filter((row) => row.record_type);
}

function sourceTypeForFile(fileName: string): string {
  const stem = sanitizeIdPart(fileName);
  if (/enterprise_profile|business_segments/.test(stem)) return "enterprise_profile";
  if (/business_functions|org_ownership|workforce_roles/.test(stem)) return "organization_operating_model";
  if (/applications_systems/.test(stem)) return "application_system";
  if (/data_assets_integrations|data_analytics/.test(stem)) return "data_asset_or_integration";
  if (/infrastructure_platforms/.test(stem)) return "infrastructure_platform";
  if (/vendors_contracts|service_scope/.test(stem)) return "vendor_contract";
  if (/spend_value|metrics_outcomes|kpi/.test(stem)) return "spend_value_fact";
  if (/programs_initiatives/.test(stem)) return "program_initiative";
  if (/ai_/.test(stem)) return "ai_value";
  if (/risks_controls/.test(stem)) return "risk_control";
  if (/relationships/.test(stem)) return "relationship";
  if (/evidence_sources|industry_context|expert_lenses/.test(stem)) return "evidence_sources";
  return "client_intake";
}

function parseCsvRecords(csvText: string): JsonRecord[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.trim().length > 0)) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  row.push(field);
  if (row.some((value) => value.trim().length > 0)) rows.push(row);
  if (rows.length === 0) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) => {
    const record: JsonRecord = {};
    headers.forEach((header, index) => {
      record[header] = (values[index] ?? "").trim();
    });
    return record;
  });
}

function activeSourceRootForTenant(tenantKey: string): string {
  const configured = process.env.HOME_ECL_ACTIVE_SOURCE_ROOT;
  if (configured) return path.resolve(configured);
  return path.join(process.cwd(), DEFAULT_ACTIVE_SOURCE_ROOT, tenantKey, "current");
}

function readActiveTenantSourceRows(tenantKey: string): EclSourceRecordSummaryRow[] {
  const root = activeSourceRootForTenant(tenantKey);
  if (!fs.existsSync(root)) return [];
  const files = fs.readdirSync(root)
    .filter((fileName) => fileName.endsWith(".csv") && !/^00_GUIDE/i.test(fileName))
    .sort();
  const rows: EclSourceRecordSummaryRow[] = [];
  for (const fileName of files) {
    const filePath = path.join(root, fileName);
    const content = fs.readFileSync(filePath, "utf8");
    const fileHash = crypto.createHash("sha256").update(content).digest("hex");
    parseCsvRecords(content).forEach((record, index) => {
      rows.push({
        source_record_id: `active:${tenantKey}:${fileName}:${index + 1}`,
        file_name: fileName,
        source_type: sourceTypeForFile(fileName),
        origin: "client_intake_repo_package",
        source_owner: payloadField(record, "source_owner", "likely_owner") ?? "active tenant source package",
        quality_state: "passed",
        record_type: sanitizeIdPart(fileName),
        row_number: index + 1,
        payload_json: { ...record, __source_file_hash: fileHash },
      });
    });
  }
  return rows;
}

function mergeSourceRows(
  dbRows: EclSourceRecordSummaryRow[],
  activeRows: EclSourceRecordSummaryRow[],
): EclSourceRecordSummaryRow[] {
  const seen = new Set<string>();
  const merged: EclSourceRecordSummaryRow[] = [];
  for (const row of [...dbRows, ...activeRows]) {
    const key = row.source_record_id ?? `${row.origin}:${row.file_name}:${row.row_number ?? "file"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }
  return merged;
}

function buildSourceRecordContextItems(sourceRows: EclSourceRecordSummaryRow[]): ContextItem[] {
  const items: ContextItem[] = [];
  const add = (id: string, statement: string | null, domains: string[]) => {
    if (!statement) return;
    items.push({ id, statement, domains });
  };

  const enterpriseProfile = sourceRowsMatching(sourceRows, /00_enterprise_profile/i)[0];
  if (enterpriseProfile) {
    const data = rowPayload(enterpriseProfile);
    const businessModel = payloadField(data, "business_model", "businessModel");
    const industry = payloadField(data, "industry");
    const subIndustry = payloadField(data, "sub_industry", "subIndustry");
    const revenue = formatUsd(payloadField(data, "revenue_usd", "revenueUsd", "revenue"));
    const employees = payloadField(data, "employee_count", "employeeCount");
    const employeeNumber = employees ? Number(employees.replace(/,/g, "")) : NaN;
    const customerSegments = splitSourceList(payloadField(data, "customer_segments", "customerSegments")).slice(0, 8);
    const mission = payloadField(data, "mission");
    const vision = payloadField(data, "vision");
    const priorities = splitSourceList(payloadField(data, "strategic_priorities", "strategicPriorities")).slice(0, 8);
    const currentState = payloadField(data, "current_state_notes", "currentStateNotes");
    const targetState = payloadField(data, "target_state_notes", "targetStateNotes");
    const profileBits = [
      industry && subIndustry ? `${industry}: ${subIndustry}` : industry ?? subIndustry,
      revenue ? `${revenue} revenue` : null,
      employees ? `${Number.isFinite(employeeNumber) ? employeeNumber.toLocaleString() : employees} employees` : null,
      businessModel,
    ].filter(Boolean);
    add(
      "ctx_ecl_source_enterprise_profile_001",
      profileBits.length ? `Enterprise profile source record: ${profileBits.join("; ")}.` : null,
      ["tenant_profile", "enterprise_profile", "business_model"],
    );
    add(
      "ctx_ecl_source_enterprise_mission_001",
      mission ? `Declared mission from enterprise profile: ${mission}.` : null,
      ["tenant_profile", "enterprise_profile"],
    );
    add(
      "ctx_ecl_source_enterprise_vision_001",
      vision ? `Declared vision from enterprise profile: ${vision}.` : null,
      ["tenant_profile", "enterprise_profile"],
    );
    add(
      "ctx_ecl_source_strategic_priorities_001",
      priorities.length ? `Declared strategic priorities from enterprise profile: ${priorities.join("; ")}.` : null,
      ["tenant_profile", "enterprise_profile", "program_initiative"],
    );
    add(
      "ctx_ecl_source_customer_segments_001",
      customerSegments.length ? `Declared customer and member segments: ${customerSegments.join("; ")}.` : null,
      ["tenant_profile", "enterprise_profile", "business_model"],
    );
    add(
      "ctx_ecl_source_current_state_001",
      currentState ? `Enterprise profile current-state notes: ${currentState}` : null,
      ["tenant_profile", "application_system", "data_asset_or_integration", "infrastructure_platform"],
    );
    add(
      "ctx_ecl_source_target_state_001",
      targetState ? `Enterprise profile target-state notes: ${targetState}` : null,
      ["tenant_profile", "program_initiative", "data_asset_or_integration"],
    );
  }

  const segmentRows = sourceRowsMatching(sourceRows, /01b_business_segments/i);
  const segmentStatements = segmentRows
    .map((row) => {
      const data = rowPayload(row);
      const name = payloadField(data, "segment_name", "segmentName");
      const share = payloadField(data, "revenue_share_pct", "revenueSharePct");
      const revenue = formatUsd(payloadField(data, "revenue_usd", "revenueUsd"));
      return name ? `${name}${share ? ` ${share}%` : ""}${revenue ? ` (${revenue})` : ""}` : null;
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, 8);
  add(
    "ctx_ecl_source_business_segments_001",
    segmentStatements.length ? `Operating segments from business-segment source: ${segmentStatements.join("; ")}.` : null,
    ["tenant_profile", "business_model", "business_function"],
  );

  const programRows = sourceRowsMatching(sourceRows, /09_programs_initiatives/i);
  const programs = programRows
    .map((row) => {
      const data = rowPayload(row);
      const name = payloadField(data, "program_name", "programName");
      const sponsor = payloadField(data, "business_sponsor", "businessSponsor");
      const budget = formatUsd(payloadField(data, "budget_usd", "budgetUsd"));
      return name ? `${name}${sponsor ? ` sponsored by ${sponsor}` : ""}${budget ? `, ${budget} budget` : ""}` : null;
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, 8);
  add(
    "ctx_ecl_source_program_portfolio_001",
    programs.length ? `Program and initiative source examples: ${programs.join("; ")}.` : null,
    ["program_initiative", "spend_value_fact", "tenant_profile"],
  );

  const interviewRows = sourceRowsMatching(sourceRows, /SA10_AI_Value_Interview_Evidence/i);
  const interviewQuotes = interviewRows
    .map((row) => {
      const data = rowPayload(row);
      const role = payloadField(data, "stakeholder_role", "stakeholderRole", "named_owner", "namedOwner");
      const quote = payloadField(data, "verbatim_quote", "answer_summary", "answerSummary");
      return role && quote ? `${role}: ${quote.replace(/^"+|"+$/g, "")}` : null;
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, 8);
  add(
    "ctx_ecl_source_leadership_excerpts_001",
    interviewQuotes.length ? `Leadership interview excerpts from source evidence: ${interviewQuotes.join(" | ")}.` : null,
    ["leadership_voice", "ai_value_interview_evidence", "tenant_profile"],
  );

  const functionRows = sourceFileRows(sourceRows, /01_business_functions/i);
  const functionBudget = sumSourceNumber(functionRows, "annual_budget_usd");
  const functionFte = sumSourceNumber(functionRows, "fte_count");
  const topFunctionOwners = topSourceCountRows(functionRows, "executive_owner", 5)
    .filter((item) => item.label !== "(not specified)")
    .map((item) => `${item.label} (${item.count.toLocaleString()} functions)`);
  add(
    "ctx_ecl_source_business_functions_001",
    functionRows.length
      ? `Business-function source contains ${functionRows.length.toLocaleString()} functions, ${formatUsdNumber(functionBudget)} of function budget authority, and ${Math.round(functionFte).toLocaleString()} FTE; named executive-owner concentrations include ${compactList(topFunctionOwners, 5)}.`
      : null,
    ["business_function", "organization", "spend_value_fact"],
  );

  const orgRows = sourceFileRows(sourceRows, /02_org_ownership/i);
  const orgBudget = sumSourceNumber(orgRows, "budget_authority_usd");
  const orgHeadcount = sumSourceNumber(orgRows, "headcount");
  const decisionRights = topSourceCountRows(orgRows, "decision_rights", 6)
    .filter((item) => item.label !== "(not specified)")
    .map((item) => `${item.label} (${item.count.toLocaleString()})`);
  const successionValues = topSourceCountRows(orgRows, "succession_risk", 4)
    .filter((item) => item.label !== "(not specified)")
    .map((item) => `${item.label} (${item.count.toLocaleString()})`);
  add(
    "ctx_ecl_source_org_accountability_001",
    orgRows.length
      ? `Organization ownership source contains ${orgRows.length.toLocaleString()} ownership rows, ${Math.round(orgHeadcount).toLocaleString()} headcount, and ${formatUsdNumber(orgBudget)} budget authority; decision-rights groups include ${compactList(decisionRights, 6)}. Succession-risk values are ${compactList(successionValues, 4)}, so constant succession-risk data should be treated as a quality caveat if it does not vary.`
      : null,
    ["organization", "business_function", "spend_value_fact"],
  );

  const workforceRows = sourceFileRows(sourceRows, /03_workforce_roles/i);
  const workforceRoles = sumSourceNumber(workforceRows, "role_count");
  const automationRoles = countSourceRows(workforceRows, "automation_opportunity", /yes|high|candidate|autom/i);
  add(
    "ctx_ecl_source_workforce_roles_001",
    workforceRows.length
      ? `Workforce-role source contains ${workforceRows.length.toLocaleString()} role/persona rows covering about ${Math.round(workforceRoles).toLocaleString()} roles; ${automationRoles.toLocaleString()} rows name an automation opportunity.`
      : null,
    ["workforce", "business_function", "ai_value"],
  );

  const spendRows = sourceFileRows(sourceRows, /08_spend_value/i);
  const annualSpend = sumSourceNumber(spendRows, "annual_spend_usd");
  const savingsOpportunity = sumSourceNumber(spendRows, "savings_opportunity_usd");
  const spendOwners = topSourceNumberRows(spendRows, "cost_center_or_owner", "annual_spend_usd", 5)
    .filter((item) => item.value > 0)
    .map((item) => `${item.label} ${formatUsdNumber(item.value)} (${item.sharePct.toFixed(1)}%)`);
  add(
    "ctx_ecl_source_spend_value_001",
    spendRows.length
      ? `Spend and value source contains ${spendRows.length.toLocaleString()} spend categories totaling ${formatUsdNumber(annualSpend)} and ${formatUsdNumber(savingsOpportunity)} in declared savings opportunity; largest recorded owners/categories include ${compactList(spendOwners, 5)}.`
      : null,
    ["spend_value_fact", "business_function", "performance_metric"],
  );

  const metricRows = sourceFileRows(sourceRows, /14_metrics_outcomes/i);
  const claimableMetrics = countSourceRows(metricRows, "claim_readiness", /claimable|ready/i);
  const financeAttestedValue = sumSourceNumber(metricRows, "finance_attested_value_usd");
  const blockedMetrics = metricRows.filter((row) => payloadField(rowPayload(row), "claim_blocked_reason", "blocked_reason"));
  const blockedReasons = topSourceCountRows(metricRows, "claim_blocked_reason", 5)
    .filter((item) => item.label !== "(not specified)")
    .map((item) => `${item.label} (${item.count.toLocaleString()})`);
  add(
    "ctx_ecl_source_metrics_outcomes_001",
    metricRows.length
      ? `Metrics and outcomes source contains ${metricRows.length.toLocaleString()} metrics; ${claimableMetrics.toLocaleString()} are claimable or ready, ${blockedMetrics.length.toLocaleString()} carry a blocked reason, and ${formatUsdNumber(financeAttestedValue)} is finance-attested value. Blocked reasons include ${compactList(blockedReasons, 5)}.`
      : null,
    ["performance_metric", "spend_value_fact", "risk_control"],
  );

  const riskRows = sourceFileRows(sourceRows, /11_risks_controls/i);
  const highSeverityRisks = countSourceRows(riskRows, "severity", /high|critical/i);
  const openControls = countSourceRows(riskRows, "control_status", /open|gap|partial|not/i);
  const riskDomains = topSourceCountRows(riskRows, "risk_domain", 5)
    .filter((item) => item.label !== "(not specified)")
    .map((item) => `${item.label} (${item.count.toLocaleString()})`);
  add(
    "ctx_ecl_source_risks_controls_001",
    riskRows.length
      ? `Risk and control source contains ${riskRows.length.toLocaleString()} rows; ${highSeverityRisks.toLocaleString()} are high or critical severity and ${openControls.toLocaleString()} have open or partial control status. Risk domains include ${compactList(riskDomains, 5)}.`
      : null,
    ["risk_control", "business_function", "application_system"],
  );

  const aiUseCaseRows = sourceFileRows(sourceRows, /10_ai_automation_use_cases/i);
  const aiBenefitRows = sourceFileRows(sourceRows, /SA08_AI_Benefits_Realization_Usage_Ledger/i);
  const aiToolRows = sourceFileRows(sourceRows, /SA09_AI_Tool_Usage_Feed/i);
  const aiKpiRows = sourceFileRows(sourceRows, /SA11_AI_KPI_Operational_Outcome_Feed/i);
  const promisedAiValue = sumSourceNumber(aiBenefitRows, "promised_value_usd");
  const actualAiSpend = sumSourceNumber(aiBenefitRows, "actual_spend_ytd_usd", "funded_spend_usd");
  const activeUsers = sumSourceNumber(aiToolRows, "active_users");
  add(
    "ctx_ecl_source_ai_value_001",
    aiUseCaseRows.length || aiBenefitRows.length || aiToolRows.length || aiKpiRows.length
      ? `AI source package contains ${aiUseCaseRows.length.toLocaleString()} use cases, ${aiBenefitRows.length.toLocaleString()} benefit-ledger rows, ${aiToolRows.length.toLocaleString()} tool-usage rows, and ${aiKpiRows.length.toLocaleString()} KPI outcome rows; promised value totals ${formatUsdNumber(promisedAiValue)}, actual or funded spend totals ${formatUsdNumber(actualAiSpend)}, and tool feed records ${Math.round(activeUsers).toLocaleString()} active users.`
      : null,
    ["ai_value", "performance_metric", "workforce", "business_function"],
  );

  const serviceRows = sourceFileRows(sourceRows, /17_service_scope_managed_services/i);
  const runCost = sumSourceNumber(serviceRows, "run_cost_usd");
  add(
    "ctx_ecl_source_managed_services_001",
    serviceRows.length
      ? `Managed-services scope source contains ${serviceRows.length.toLocaleString()} service rows with ${formatUsdNumber(runCost)} recorded run cost and named in-scope functions/systems.`
      : null,
    ["vendor_contract", "business_function", "spend_value_fact"],
  );

  const processRows = sourceFileRows(sourceRows, /18_operational_process_evidence/i);
  const transactionVolume = sumSourceNumber(processRows, "transaction_volume");
  const automationCandidates = countSourceRows(processRows, "automation_candidate", /yes|high|candidate|autom/i);
  add(
    "ctx_ecl_source_operational_process_001",
    processRows.length
      ? `Operational-process evidence contains ${processRows.length.toLocaleString()} process rows, ${Math.round(transactionVolume).toLocaleString()} recorded transaction volume where supplied, and ${automationCandidates.toLocaleString()} automation candidates.`
      : null,
    ["operational_process", "business_function", "ai_value"],
  );

  const dataMaturityRows = sourceFileRows(sourceRows, /19_data_analytics_platform_maturity/i);
  const maturityGaps = countSourceRows(dataMaturityRows, "gaps", /\w/);
  add(
    "ctx_ecl_source_data_analytics_maturity_001",
    dataMaturityRows.length
      ? `Data and analytics maturity source contains ${dataMaturityRows.length.toLocaleString()} platform/capability assessments, with ${maturityGaps.toLocaleString()} rows naming gaps between current and target maturity.`
      : null,
    ["data_asset_or_integration", "infrastructure_platform", "performance_metric"],
  );

  return items;
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

function dataWorkloadRows(rows: HomeProjectionWriteRow[]): HomeProjectionWriteRow[] {
  return rowsOf(rows, "data_assets_integrations", "data_analytics_workload");
}

function dataMovementRows(rows: HomeProjectionWriteRow[]): HomeProjectionWriteRow[] {
  return [
    ...rowsOf(rows, "current_state_data_flow", "data_flow"),
    ...rowsOf(rows, "data_assets_integrations", "data_flow"),
  ];
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

function workloadSummaryRows(rows: HomeProjectionWriteRow[], field: string, limit: number): Array<Record<string, unknown>> {
  const groups = new Map<string, { rows: number; workloadItems: number; activeUsers: number; dataVolumeTb: number; technologies: Map<string, number> }>();
  for (const row of rows) {
    const data = payload(row);
    const label = text(data[field]) ?? text(data.function) ?? "(not specified)";
    const group = groups.get(label) ?? { rows: 0, workloadItems: 0, activeUsers: 0, dataVolumeTb: 0, technologies: new Map<string, number>() };
    group.rows += 1;
    group.workloadItems += payloadNumber(data, "workload_count");
    group.activeUsers += payloadNumber(data, "active_user_count");
    group.dataVolumeTb += payloadNumber(data, "data_volume_tb");
    const technology = text(data.technology_name);
    if (technology) group.technologies.set(technology, (group.technologies.get(technology) ?? 0) + 1);
    groups.set(label, group);
  }
  return Array.from(groups, ([label, group]) => ({
    label,
    segments: group.rows,
    workloadItems: Math.round(group.workloadItems),
    activeUsers: Math.round(group.activeUsers),
    dataVolumeTb: Number(group.dataVolumeTb.toFixed(1)),
    topTechnologies: Array.from(group.technologies, ([technology, count]) => ({ technology, count }))
      .sort((a, b) => b.count - a.count || a.technology.localeCompare(b.technology))
      .slice(0, 5),
  }))
    .sort((a, b) => Number(b.workloadItems) - Number(a.workloadItems) || String(a.label).localeCompare(String(b.label)))
    .slice(0, limit);
}

function topDimension(rows: HomeProjectionWriteRow[], field: string, limit: number) {
  return topCountShareRows(rows, field, limit).map((item) => ({
    label: item.label,
    count: item.count,
    sharePct: item.sharePct,
  }));
}

function buildCategorySummaries(args: {
  applications: HomeProjectionWriteRow[];
  contracts: HomeProjectionWriteRow[];
  infrastructure: HomeProjectionWriteRow[];
  dataFlows: HomeProjectionWriteRow[];
  dataWorkloads: HomeProjectionWriteRow[];
  sourceSummaries: SourceSummary[];
}): DeterministicCategorySummary[] {
  const { applications, contracts, infrastructure, dataFlows, dataWorkloads, sourceSummaries } = args;
  const sourcePaths = (pattern: RegExp, fallback: string[]) => {
    const matched = sourceSummaries.map((summary) => summary.sourcePath).filter((sourcePath) => pattern.test(sourcePath));
    return matched.length ? matched.slice(0, 12) : fallback;
  };
  const workloadItems = dataWorkloads.reduce((sum, row) => sum + payloadNumber(payload(row), "workload_count"), 0);
  const activeUsers = dataWorkloads.reduce((sum, row) => sum + payloadNumber(payload(row), "active_user_count"), 0);
  const dataVolumeTb = dataWorkloads.reduce((sum, row) => sum + payloadNumber(payload(row), "data_volume_tb"), 0);
  return [
    {
      key: "applications_by_business_function",
      label: "Applications by business function",
      sourcePaths: ["serving.home_applications_systems"],
      recordCount: applications.length,
      denominator: "application_v rows, not deployments or raw canonical objects",
      topDimensions: [{ field: "business_function", values: topDimension(applications, "business_function", 8) }],
      measures: {
        applications: applications.length,
        annualCostUsd: sumPayload(applications, "annual_cost_usd"),
      },
      gaps: applications.length ? [] : ["No governed application rows reached the Home packet."],
    },
    {
      key: "contracts_by_supplier_and_service",
      label: "Contracts by supplier and service",
      sourcePaths: ["serving.home_vendor_contracts"],
      recordCount: contracts.length,
      denominator: "contract rows with known value state",
      topDimensions: [
        { field: "supplier_name", values: topDimension(contracts, "supplier_name", 8) },
        { field: "service_category", values: topDimension(contracts, "service_category", 8) },
      ],
      measures: {
        contracts: contracts.length,
        annualizedValueUsd: contracts.reduce((sum, row) => sum + payloadNumber(payload(row), "annualized_value_usd", "annual_spend_usd"), 0),
      },
      gaps: contracts.length ? [] : ["No governed contract rows reached the Home packet."],
    },
    {
      key: "infrastructure_by_hosting_and_lifecycle",
      label: "Infrastructure by hosting and lifecycle",
      sourcePaths: ["serving.home_infrastructure_platforms"],
      recordCount: infrastructure.length,
      denominator: "platform and infrastructure records, not confirmed app-hosting joins",
      topDimensions: [
        { field: "hosting_model", values: topDimension(infrastructure, "hosting_model", 8) },
        { field: "platform_type", values: topDimension(infrastructure, "platform_type", 8) },
      ],
      measures: {
        platforms: infrastructure.length,
      },
      gaps: infrastructure.length ? [] : ["No governed infrastructure/platform rows reached the Home packet."],
    },
    {
      key: "data_movements_by_domain_and_mechanism",
      label: "Data movements by domain and mechanism",
      sourcePaths: ["serving.home_current_state_data_flow", "serving.home_data_assets_integrations"],
      recordCount: dataFlows.length,
      denominator: "source-to-target movement rows, not reports, users, jobs, or data volume",
      topDimensions: [
        { field: "data_domain", values: topDimension(dataFlows, "data_domain", 8) },
        { field: "integration_type", values: topDimension(dataFlows, "integration_type", 8) },
      ],
      measures: {
        dataMovements: dataFlows.length,
      },
      gaps: dataFlows.length ? [] : ["No governed source-to-target data movement rows reached the Home packet."],
    },
    {
      key: "data_bi_etl_workloads_by_function_and_technology",
      label: "Data, BI, ETL, report, script, and analytics workloads",
      sourcePaths: sourcePaths(/SP04|Data_BI_ETL|data.*bi|etl|analytics/i, ["serving.home_data_assets_integrations"]),
      recordCount: dataWorkloads.length,
      denominator: "segment-level workload rows; not one row per report, job, script, or user",
      topDimensions: [
        { field: "function", values: topDimension(dataWorkloads, "function", 8) },
        { field: "technology_name", values: topDimension(dataWorkloads, "technology_name", 8) },
        { field: "workload_type", values: topDimension(dataWorkloads, "workload_type", 8) },
      ],
      measures: {
        workloadSegments: dataWorkloads.length,
        workloadItems: Math.round(workloadItems),
        activeUsers: Math.round(activeUsers),
        dataVolumeTb: Number(dataVolumeTb.toFixed(1)),
      },
      gaps: dataWorkloads.length
        ? []
        : ["No segment-level data/BI/ETL workload rows reached the Home packet. Report, job, user, script, and data-volume counts are unavailable from this source family."],
    },
  ];
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

function topRowsByPayloadNumber(rows: HomeProjectionWriteRow[], field: string, limit: number): HomeProjectionWriteRow[] {
  return [...rows]
    .sort((a, b) => payloadNumber(payload(b), field) - payloadNumber(payload(a), field))
    .slice(0, limit);
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
      return [
        `${visible(data.data_asset_name) ?? visible(row.title) ?? row.title} is recorded as a data movement`,
        visible(data.source_system) ? `from ${visible(data.source_system)}` : null,
        visible(data.target_system) ? `to ${visible(data.target_system)}` : null,
        visible(data.integration_type) ? `using ${visible(data.integration_type)}` : null,
        visible(data.consumption_layer) ? `serving ${visible(data.consumption_layer)}` : null,
      ].filter(Boolean).join(" ") + ".";
    case "data_assets_integrations":
      if (row.row_type === "data_analytics_workload") {
        return [
          `${visible(data.workload_name) ?? visible(data.platform_name) ?? visible(row.title) ?? row.title} is recorded as a data, reporting, ETL, script, or analytics workload segment`,
          visible(data.function) ? `for ${visible(data.function)}` : null,
          visible(data.technology_name) ? `using ${visible(data.technology_name)}` : null,
          visible(data.workload_type) ? `as ${visible(data.workload_type)}` : null,
          payloadNumber(data, "workload_count") > 0 ? `with ${payloadNumber(data, "workload_count").toLocaleString()} workload items` : null,
          payloadNumber(data, "active_user_count") > 0 ? `${payloadNumber(data, "active_user_count").toLocaleString()} active users` : null,
          payloadNumber(data, "data_volume_tb") > 0 ? `${payloadNumber(data, "data_volume_tb").toLocaleString()} TB` : null,
        ].filter(Boolean).join(" ") + ".";
      }
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

function buildScopeContextItems(args: {
  rows: HomeProjectionWriteRow[];
  sourceSummaries: SourceSummary[];
  sourceRows: EclSourceRecordSummaryRow[];
}): ContextItem[] {
  const { rows, sourceSummaries, sourceRows } = args;
  const readyRowsForPage = (pageKey: string) =>
    rows.filter((row) => row.page_key === pageKey && row.row_type !== "summary" && row.row_type !== "chapter_claim" && candidateIsReady(row));
  const rawSourceRowCount = sourceSummaries.reduce((sum, item) => sum + (item.rawRowCount ?? item.recordCount), 0);
  const sourceFamilies = [...new Set(sourceSummaries.map((item) => item.domain).filter(Boolean))].length;
  const leadershipRows = readyRowsForPage("leadership_perspective");
  const strategyRows = readyRowsForPage("strategy_value_creation");
  const performanceRows = readyRowsForPage("performance_value");
  const workloadRows = readyRowsForPage("data_assets_integrations").filter((row) => row.row_type === "data_analytics_workload");
  const workloadSourceSummaries = sourceSummaries.filter((summary) =>
    /SP04|Data_BI_ETL|data.*bi|etl|analytics/i.test(summary.sourcePath) ||
    summary.materialFields.some((field) => /workload_count|active_user_count|data_volume_tb|technology_name/i.test(field)),
  );
  const profileRows = sourceFileRows(sourceRows, /00_enterprise_profile/i);
  const segmentRows = sourceFileRows(sourceRows, /01b_business_segments/i);
  const programRows = sourceFileRows(sourceRows, /09_programs_initiatives/i);
  const interviewRows = sourceFileRows(sourceRows, /SA10_AI_Value_Interview_Evidence/i);
  const spendRows = sourceFileRows(sourceRows, /08_spend_value/i);
  const metricRows = sourceFileRows(sourceRows, /14_metrics_outcomes/i);
  const aiRows = [
    ...sourceFileRows(sourceRows, /10_ai_automation_use_cases/i),
    ...sourceFileRows(sourceRows, /SA08_AI_Benefits_Realization_Usage_Ledger/i),
    ...sourceFileRows(sourceRows, /SA09_AI_Tool_Usage_Feed/i),
    ...sourceFileRows(sourceRows, /SA11_AI_KPI_Operational_Outcome_Feed/i),
  ];

  return [
    {
      id: "ctx_ecl_scope_business_economics_001",
      statement: profileRows.length || segmentRows.length
        ? `Enterprise profile and segment evidence is supplied by ${profileRows.length.toLocaleString()} enterprise-profile row and ${segmentRows.length.toLocaleString()} business-segment rows; business-model conclusions may use those cited rows while keeping synthetic/non-client-attested limits explicit.`
        : "Segment revenue, customer/channel economics, and formal enterprise identity attributes are not supplied by the current Home narrative input; business-model conclusions should therefore be limited to the cited technology, commercial, infrastructure, and data-movement facts.",
      domains: ["enterprise_profile", "spend_value_fact", "application_system", "vendor_contract"],
    },
    {
      id: "ctx_ecl_scope_strategy_programs_001",
      statement: programRows.length
        ? `Declared strategic priorities and ${programRows.length.toLocaleString()} program/initiative rows are supplied; strategic claims must cite profile or program evidence and distinguish funded programs from achieved outcomes.`
        : strategyRows.length
        ? `The strategy and value chapter has ${strategyRows.length.toLocaleString()} ready evidence items, but the Home narrative input does not supply a full program-to-outcome ledger; strategic claims must cite the named evidence and avoid implying a complete transformation roadmap.`
        : "Declared strategic priorities, funded programs, and program-to-outcome linkage are not supplied by the current Home narrative input; the chapter should treat strategy as an evidence gap rather than infer a transformation agenda.",
      domains: ["spend_value_fact", "vendor_contract", "evidence_sources"],
    },
    {
      id: "ctx_ecl_scope_leadership_001",
      statement: interviewRows.length
        ? `${interviewRows.length.toLocaleString()} leadership or operator interview evidence rows are supplied; leadership claims must cite interview evidence and should not generalize beyond the roles, tracks, and questions represented.`
        : leadershipRows.length
        ? `The leadership perspective chapter has ${leadershipRows.length.toLocaleString()} ready evidence items; leadership consensus or disagreement claims must cite those items and should not be generalized beyond them.`
        : "Leadership interview quotes, leadership sentiment, and named consensus or disagreement evidence are not supplied by the current Home narrative input; do not infer executive priorities or leadership alignment.",
      domains: ["evidence_sources"],
    },
    {
      id: "ctx_ecl_scope_value_linkage_001",
      statement: spendRows.length || metricRows.length || aiRows.length
        ? `Spend, metric, and AI value evidence is supplied by ${spendRows.length.toLocaleString()} spend rows, ${metricRows.length.toLocaleString()} metric rows, and ${aiRows.length.toLocaleString()} AI value/usage/KPI rows; value claims must separate source-recorded opportunity, finance-attested value, and blocked/unverified claims.`
        : performanceRows.length
        ? `The performance and value chapter has ${performanceRows.length.toLocaleString()} ready evidence items, but the Home narrative input does not establish a complete value chain from spend to programs, KPIs, finance attestation, and realized benefit.`
        : "Contract values and application costs are present, but program, KPI, finance-attestation, and realized-benefit mappings are not supplied by the current Home narrative input; value claims should name that limitation instead of implying measured outcomes.",
      domains: ["spend_value_fact", "vendor_contract", "evidence_sources"],
    },
    {
      id: "ctx_ecl_scope_data_workload_001",
      statement: workloadRows.length
        ? `The data, reporting, ETL, script, and analytics workload context includes ${workloadRows.length.toLocaleString()} ready segment-level evidence rows from ${Math.max(1, workloadSourceSummaries.length).toLocaleString()} source-family summaries.`
        : "No ready segment-level data, reporting, ETL, script, or analytics workload rows reached the Home narrative packet.",
      domains: ["data_asset_or_integration", "infrastructure_platform", "evidence_sources"],
    },
    {
      id: "ctx_ecl_scope_source_breadth_001",
      statement:
        sourceSummaries.length > 0
          ? `The source ledger contributes ${sourceSummaries.length.toLocaleString()} source-family summaries across ${sourceFamilies.toLocaleString()} source families and ${rawSourceRowCount.toLocaleString()} raw source rows; those summaries describe coverage breadth, not proof for a tenant-specific business claim.`
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
  permittedDataWorkloads: HomeProjectionWriteRow[];
  permittedRows: HomeProjectionWriteRow[];
  contractSpend: number;
  vendorRows: Array<Record<string, unknown>>;
}): Signal[] {
  const {
    permittedApplications,
    permittedContracts,
    permittedInfrastructure,
    permittedDataFlows,
    permittedDataWorkloads,
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
  const topWorkloadFunction = topCountShareRows(permittedDataWorkloads, "function", 5)[0];
  const topWorkloadTechnology = topCountShareRows(permittedDataWorkloads, "technology_name", 5)[0];
  const workloadItems = permittedDataWorkloads.reduce((sum, row) => sum + payloadNumber(payload(row), "workload_count"), 0);
  const workloadUsers = permittedDataWorkloads.reduce((sum, row) => sum + payloadNumber(payload(row), "active_user_count"), 0);
  const workloadVolumeTb = permittedDataWorkloads.reduce((sum, row) => sum + payloadNumber(payload(row), "data_volume_tb"), 0);
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
      )}.`,
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
  const namedApplicationExamples = topRowsByPayloadNumber(applicationsWithCost, "annual_cost_usd", 8)
    .map((row) => {
      const data = payload(row);
      const name = payloadText(data, "application_name", "system_name") ?? row.title;
      const vendor = payloadText(data, "vendor_name", "supplier_name");
      const functionName = payloadText(data, "business_function");
      const cost = payloadNumber(data, "annual_cost_usd");
      return `${name}${vendor ? ` from ${vendor}` : ""}${functionName ? ` in ${functionName}` : ""}${cost > 0 ? ` at $${(cost / 1_000_000).toFixed(1)}M annual cost` : ""}`;
    })
    .filter(Boolean);
  if (namedApplicationExamples.length) {
    add(
      "sig_ecl_application_named_examples_015",
      "portfolio",
      `Named high-cost application examples in the record include ${compactList(namedApplicationExamples, 8)}.`,
      ["application_system", "spend_value_fact"],
      topRowsByPayloadNumber(applicationsWithCost, "annual_cost_usd", 8),
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
    `${permittedContracts.length.toLocaleString()} ready contracts are in the current ready contract base; ${autoRenewContracts.length.toLocaleString()} of ${permittedContracts.length.toLocaleString()} are marked auto-renewal and ${longNoticeContracts.length.toLocaleString()} of ${permittedContracts.length.toLocaleString()} require at least 180 days notice, making renewal timing a commercial control to inspect before asserting savings or flexibility.`,
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
    `${permittedInfrastructure.length.toLocaleString()} infrastructure or platform records are in the current platform base; ${supportDatedPlatforms.length.toLocaleString()} of ${permittedInfrastructure.length.toLocaleString()} carry support-end dates, and ${criticalPlatforms.length.toLocaleString()} of ${permittedInfrastructure.length.toLocaleString()} carry tier-1 or criticality evidence.`,
    ["infrastructure_platform"],
    [...supportDatedPlatforms, ...criticalPlatforms],
  );
  const namedPlatformExamples = topRowsByPayloadNumber(
    rowsWherePayload(permittedInfrastructure, (data) => Boolean(text(data.support_end_date)) || /tier[-_\s]?1|critical/i.test(text(data.criticality_tier) ?? "")),
    "annual_cost_usd",
    8,
  )
    .map((row) => {
      const data = payload(row);
      const name = payloadText(data, "platform_name", "infrastructure_name", "application_name") ?? row.title;
      const hosting = payloadText(data, "hosting_model");
      const supportEnd = payloadText(data, "support_end_date");
      const criticality = payloadText(data, "criticality_tier");
      return `${name}${hosting ? ` on ${hosting}` : ""}${criticality ? ` with ${criticality} criticality` : ""}${supportEnd ? ` and support ending ${supportEnd}` : ""}`;
    })
    .filter(Boolean);
  if (namedPlatformExamples.length) {
    add(
      "sig_ecl_platform_named_resilience_016",
      "risk",
      `Named infrastructure or platform examples with resilience evidence include ${compactList(namedPlatformExamples, 8)}.`,
      ["infrastructure_platform"],
      topRowsByPayloadNumber(
        rowsWherePayload(permittedInfrastructure, (data) => Boolean(text(data.support_end_date)) || /tier[-_\s]?1|critical/i.test(text(data.criticality_tier) ?? "")),
        "annual_cost_usd",
        8,
      ),
    );
  }
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
  if (permittedDataWorkloads.length) {
    add(
      "sig_ecl_data_workload_segments_017",
      "portfolio",
      `The data, reporting, ETL, script, and analytics workload inventory contains ${permittedDataWorkloads.length.toLocaleString()} segment-level rows totaling ${Math.round(workloadItems).toLocaleString()} workload items, ${Math.round(workloadUsers).toLocaleString()} active users, and ${Number(workloadVolumeTb.toFixed(1)).toLocaleString()} TB; ${topWorkloadFunction ? `${topWorkloadFunction.label} is the largest function by segment count at ${topWorkloadFunction.count.toLocaleString()} segments` : "no function ranking is available"}${topWorkloadTechnology ? `, and ${topWorkloadTechnology.label} is the most frequent named technology at ${topWorkloadTechnology.count.toLocaleString()} segments` : ""}.`,
      ["data_asset_or_integration", "infrastructure_platform"],
      permittedDataWorkloads,
    );
  }
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

function buildSourceFamilyHomeSignals(sourceRows: EclSourceRecordSummaryRow[], sourceContextItems: ContextItem[]): Signal[] {
  const contextIds = new Set(sourceContextItems.map((item) => item.id));
  const signals: Signal[] = [];
  const add = (
    id: string,
    kind: Signal["kind"],
    statement: string | null,
    domains: string[],
    evidenceRefs: string[],
    value?: number,
  ) => {
    const refs = evidenceRefs.filter((ref) => contextIds.has(ref));
    if (!statement || refs.length === 0) return;
    signals.push({ id, kind, statement, domains, evidenceRefs: refs, ...(value === undefined ? {} : { value }) });
  };

  const profileRows = sourceFileRows(sourceRows, /00_enterprise_profile/i);
  const profile = profileRows[0] ? rowPayload(profileRows[0]) : {};
  const segmentRows = sourceFileRows(sourceRows, /01b_business_segments/i);
  const revenue = rawNumber(payloadField(profile, "revenue_usd", "revenueUsd", "revenue"));
  const employeeCount = rawNumber(payloadField(profile, "employee_count", "employeeCount"));
  const industry = payloadField(profile, "industry");
  const subIndustry = payloadField(profile, "sub_industry", "subIndustry");
  const businessModel = payloadField(profile, "business_model", "businessModel");
  const priorities = splitSourceList(payloadField(profile, "strategic_priorities", "strategicPriorities"));
  const segmentNames = segmentRows
    .map((row) => {
      const data = rowPayload(row);
      const name = payloadField(data, "segment_name", "segmentName");
      const share = payloadField(data, "revenue_share_pct", "revenueSharePct");
      return name ? `${name}${share ? ` (${share}%)` : ""}` : null;
    })
    .filter((value): value is string => Boolean(value));
  add(
    "sig_ecl_source_enterprise_identity_020",
    "portfolio",
    profileRows.length
      ? `Enterprise profile identifies the organization as ${industry ?? "a healthcare enterprise"}${subIndustry ? ` in ${subIndustry}` : ""}${revenue ? ` with ${formatUsdNumber(revenue)} revenue` : ""}${employeeCount ? ` and ${Math.round(employeeCount).toLocaleString()} employees` : ""}; its business model is ${businessModel ?? "not separately stated"}, and declared operating segments include ${compactList(segmentNames, 6)}.`
      : null,
    ["tenant_profile", "business_model", "business_function"],
    ["ctx_ecl_source_enterprise_profile_001", "ctx_ecl_source_business_segments_001", "ctx_ecl_source_customer_segments_001"],
    revenue,
  );
  add(
    "sig_ecl_source_strategy_priorities_021",
    "portfolio",
    priorities.length
      ? `The enterprise profile declares strategic priorities: ${compactList(priorities, 8)}. These priorities are source-recorded context for the Home strategy story; they are not to be replaced by application or vendor trivia.`
      : null,
    ["tenant_profile", "program_initiative", "business_model"],
    ["ctx_ecl_source_strategic_priorities_001", "ctx_ecl_source_enterprise_mission_001", "ctx_ecl_source_enterprise_vision_001"],
  );

  const programRows = sourceFileRows(sourceRows, /09_programs_initiatives/i);
  const programBudget = sumSourceNumber(programRows, "budget_usd");
  const expectedValue = sumSourceNumber(programRows, "expected_value_usd");
  const blockedPrograms = programRows.filter((row) => payloadField(rowPayload(row), "blocked_reason", "known_gaps", "risks"));
  add(
    "sig_ecl_source_program_portfolio_022",
    "change",
    programRows.length
      ? `The program portfolio source records ${programRows.length.toLocaleString()} programs with ${formatUsdNumber(programBudget)} budget and ${formatUsdNumber(expectedValue)} expected value; ${blockedPrograms.length.toLocaleString()} rows carry a blocker, risk, or known gap.`
      : null,
    ["program_initiative", "spend_value_fact", "risk_control"],
    ["ctx_ecl_source_program_portfolio_001"],
    expectedValue,
  );

  const spendRows = sourceFileRows(sourceRows, /08_spend_value/i);
  const spend = sumSourceNumber(spendRows, "annual_spend_usd");
  const opportunity = sumSourceNumber(spendRows, "savings_opportunity_usd");
  add(
    "sig_ecl_source_spend_value_023",
    "portfolio",
    spendRows.length
      ? `Spend and value source records ${formatUsdNumber(spend)} annual spend and ${formatUsdNumber(opportunity)} declared savings opportunity across ${spendRows.length.toLocaleString()} categories; this is the spend/value denominator for Home, separate from application annual cost and contract annualized value.`
      : null,
    ["spend_value_fact", "performance_metric", "business_function"],
    ["ctx_ecl_source_spend_value_001"],
    spend,
  );

  const metricRows = sourceFileRows(sourceRows, /14_metrics_outcomes/i);
  const readyMetrics = countSourceRows(metricRows, "claim_readiness", /claimable|ready/i);
  const blockedMetrics = metricRows.filter((row) => payloadField(rowPayload(row), "claim_blocked_reason", "blocked_reason")).length;
  const financeAttested = sumSourceNumber(metricRows, "finance_attested_value_usd");
  add(
    "sig_ecl_source_metrics_readiness_024",
    "data_quality",
    metricRows.length
      ? `Metrics and outcomes source records ${metricRows.length.toLocaleString()} metrics: ${readyMetrics.toLocaleString()} claimable or ready, ${blockedMetrics.toLocaleString()} carrying blocker evidence, and ${formatUsdNumber(financeAttested)} finance-attested value.`
      : null,
    ["performance_metric", "spend_value_fact", "risk_control"],
    ["ctx_ecl_source_metrics_outcomes_001"],
    financeAttested,
  );

  const orgRows = sourceFileRows(sourceRows, /02_org_ownership/i);
  const orgBudget = sumSourceNumber(orgRows, "budget_authority_usd");
  const orgHeadcount = sumSourceNumber(orgRows, "headcount");
  add(
    "sig_ecl_source_org_accountability_025",
    "workforce",
    orgRows.length
      ? `Organization ownership source records ${orgRows.length.toLocaleString()} accountability rows, ${Math.round(orgHeadcount).toLocaleString()} headcount, and ${formatUsdNumber(orgBudget)} budget authority, giving Home a leadership-accountability substrate beyond application ownership.`
      : null,
    ["organization", "workforce", "spend_value_fact"],
    ["ctx_ecl_source_org_accountability_001", "ctx_ecl_source_business_functions_001"],
    orgBudget,
  );

  const interviewRows = sourceFileRows(sourceRows, /SA10_AI_Value_Interview_Evidence/i);
  add(
    "sig_ecl_source_leadership_voice_026",
    "testimony",
    interviewRows.length
      ? `Leadership and operator interview evidence contributes ${interviewRows.length.toLocaleString()} source rows; Home may use it for leadership themes only when the visible claim cites the interview evidence, not as free-form sentiment.`
      : null,
    ["leadership_voice", "ai_value_interview_evidence", "tenant_profile"],
    ["ctx_ecl_source_leadership_excerpts_001"],
    interviewRows.length,
  );

  const riskRows = sourceFileRows(sourceRows, /11_risks_controls/i);
  const highSeverity = countSourceRows(riskRows, "severity", /high|critical/i);
  add(
    "sig_ecl_source_risk_control_027",
    "risk",
    riskRows.length
      ? `Risk and controls source records ${riskRows.length.toLocaleString()} risks or controls, including ${highSeverity.toLocaleString()} high or critical severity rows, so executive risk must be grounded in the named risk/control register rather than inferred from system age alone.`
      : null,
    ["risk_control", "business_function", "application_system"],
    ["ctx_ecl_source_risks_controls_001"],
    highSeverity,
  );

  const aiUseCases = sourceFileRows(sourceRows, /10_ai_automation_use_cases/i);
  const aiBenefits = sourceFileRows(sourceRows, /SA08_AI_Benefits_Realization_Usage_Ledger/i);
  const aiTools = sourceFileRows(sourceRows, /SA09_AI_Tool_Usage_Feed/i);
  const aiKpis = sourceFileRows(sourceRows, /SA11_AI_KPI_Operational_Outcome_Feed/i);
  add(
    "sig_ecl_source_ai_value_028",
    "ai_value",
    aiUseCases.length || aiBenefits.length || aiTools.length || aiKpis.length
      ? `AI evidence spans ${aiUseCases.length.toLocaleString()} use cases, ${aiBenefits.length.toLocaleString()} benefit rows, ${aiTools.length.toLocaleString()} tool-usage rows, and ${aiKpis.length.toLocaleString()} KPI rows, allowing Home to distinguish AI ambition, usage, and measured outcome instead of collapsing them into one adoption story.`
      : null,
    ["ai_value", "performance_metric", "workforce", "business_function"],
    ["ctx_ecl_source_ai_value_001", "ctx_ecl_source_workforce_roles_001"],
  );

  const serviceRows = sourceFileRows(sourceRows, /17_service_scope_managed_services/i);
  const processRows = sourceFileRows(sourceRows, /18_operational_process_evidence/i);
  add(
    "sig_ecl_source_operating_model_029",
    "operational",
    serviceRows.length || processRows.length
      ? `Operating-model evidence includes ${serviceRows.length.toLocaleString()} managed-services scope rows and ${processRows.length.toLocaleString()} operational-process rows, giving Home a process and service-delivery view in addition to system inventory.`
      : null,
    ["operational_process", "vendor_contract", "business_function"],
    ["ctx_ecl_source_managed_services_001", "ctx_ecl_source_operational_process_001"],
  );

  const maturityRows = sourceFileRows(sourceRows, /19_data_analytics_platform_maturity/i);
  add(
    "sig_ecl_source_data_analytics_maturity_030",
    "data_quality",
    maturityRows.length
      ? `Data and analytics maturity source contributes ${maturityRows.length.toLocaleString()} assessments; Home should use these maturity rows when explaining analytics capability, not ask leaders to reconfirm ETL, report, or job counts already present in the record.`
      : null,
    ["data_asset_or_integration", "infrastructure_platform", "performance_metric"],
    ["ctx_ecl_source_data_analytics_maturity_001"],
  );

  return signals;
}

function emitHomeNarrativeProofBundle(outFile: string, result: unknown, options: CliOptions) {
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "home-ecl-narrative-proof-"));
  const proofDir = path.join(proofRoot, "home-ecl-narrative-proof");
  fs.mkdirSync(proofDir, { recursive: true });
  const resultPath = path.join(proofDir, path.basename(outFile));
  fs.copyFileSync(outFile, resultPath);
  const summaryPath = path.join(proofDir, "summary.json");
  fs.writeFileSync(
    summaryPath,
    `${JSON.stringify({
      tenantKey: options.tenantKey,
      assessmentId: options.assessmentId,
      writeApplied: WRITE,
      resultFile: path.basename(outFile),
      proofGeneratedAt: new Date().toISOString(),
      resultHash: hashJson(result),
    }, null, 2)}\n`,
  );
  const tarPath = path.join(proofRoot, "home-ecl-narrative-proof.tgz");
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", proofRoot, "home-ecl-narrative-proof"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (tar.status !== 0) {
    console.log(`! Home narrative proof bundle could not be archived: ${tar.stderr || tar.stdout || "tar failed"}`);
    return;
  }
  const encoded = fs.readFileSync(tarPath).toString("base64");
  console.log("__HOME_ECL_NARRATIVE_PROOF_TGZ_BEGIN__");
  for (let index = 0; index < encoded.length; index += 7600) {
    console.log(encoded.slice(index, index + 7600));
  }
  console.log("__HOME_ECL_NARRATIVE_PROOF_TGZ_END__");
}

function buildGovernedSignalPacket(
  rows: HomeProjectionWriteRow[],
  tenantKey: string,
  assessmentId: string,
  sourceSummaries: SourceSummary[] = [],
  sourceRows: EclSourceRecordSummaryRow[] = [],
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
  const dataFlows = dataMovementRows(rows);
  const dataWorkloads = dataWorkloadRows(rows);
  const permittedApplications = rowsOf(permittedRows, "applications_systems", "application");
  const permittedContracts = rowsOf(permittedRows, "vendor_contracts", "contract");
  const permittedInfrastructure = rowsOf(permittedRows, "infrastructure_platforms", "infrastructure");
  const permittedDataFlows = dataMovementRows(permittedRows);
  const permittedDataWorkloads = dataWorkloadRows(permittedRows);
  const contractSpend = permittedContracts.reduce((sum, row) => sum + payloadNumber(payload(row), "annualized_value_usd", "annual_spend_usd"), 0);
  const vendorRows = topSpendShareRows(permittedContracts, "supplier_name", "annualized_value_usd", 8);
  const sourceContextItems = buildSourceRecordContextItems(sourceRows);
  const rawSignals = buildDeterministicHomeSignals({
    permittedApplications,
    permittedContracts,
    permittedInfrastructure,
    permittedDataFlows,
    permittedDataWorkloads,
    permittedRows,
    contractSpend,
    vendorRows,
  });
  rawSignals.unshift(...buildSourceFamilyHomeSignals(sourceRows, sourceContextItems));
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
    ...sourceContextItems,
    ...buildScopeContextItems({ rows, sourceSummaries, sourceRows }),
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

  const enterpriseProfile = sourceRowsMatching(sourceRows, /00_enterprise_profile/i)[0];
  const enterpriseProfilePayload = enterpriseProfile ? rowPayload(enterpriseProfile) : {};
  const segmentRows = sourceRowsMatching(sourceRows, /01b_business_segments/i);
  const revenue = Number(payloadField(enterpriseProfilePayload, "revenue_usd", "revenueUsd", "revenue") ?? NaN);
  const employeeCount = Number(payloadField(enterpriseProfilePayload, "employee_count", "employeeCount") ?? NaN);
  const businessEconomics = {
    operatingSegments: segmentRows
      .map((row) => payloadField(rowPayload(row), "segment_name", "segmentName"))
      .filter((value): value is string => Boolean(value)),
    customerSegments: splitSourceList(payloadField(enterpriseProfilePayload, "customer_segments", "customerSegments")),
    technologyBudget: sumPayload(permittedApplications, "annual_cost_usd"),
    technologyBudgetShareOfRevenue: Number.isFinite(revenue) && revenue > 0
      ? sumPayload(permittedApplications, "annual_cost_usd") / revenue
      : null,
  };
  const packet = {
    enterpriseIdentity: {
      businessModel: payloadField(enterpriseProfilePayload, "business_model", "businessModel"),
      industry: payloadField(enterpriseProfilePayload, "industry"),
      revenue: Number.isFinite(revenue) ? revenue : null,
      employeeCount: Number.isFinite(employeeCount) ? employeeCount : null,
    },
    businessEconomics,
    strategicPriorities: splitSourceList(payloadField(enterpriseProfilePayload, "strategic_priorities", "strategicPriorities")),
    signals,
    contextItems,
    visualDatasets: {
      application_landscape_by_function: dimensionShareRows(permittedApplications, "business_function", 8),
      vendor_spend_concentration: vendorRows,
      data_workload_by_function: workloadSummaryRows(permittedDataWorkloads, "function", 12),
      data_workload_by_technology: workloadSummaryRows(permittedDataWorkloads, "technology_name", 12),
    },
    categorySummaries: buildCategorySummaries({
      applications: permittedApplications,
      contracts: permittedContracts,
      infrastructure: permittedInfrastructure,
      dataFlows: permittedDataFlows,
      dataWorkloads: permittedDataWorkloads,
      sourceSummaries,
    }),
    pagePromptContracts: readHomePagePromptContracts(),
    sourceSummaries,
    analyticalLenses: [],
    coverageManifest: {
      dimensionCoverage: [
        { key: "home_applications_systems", recordCount: applications.length, evidencedShare: applications.length ? 1 : 0 },
        { key: "home_vendor_contracts", recordCount: contracts.length, evidencedShare: contracts.length ? 1 : 0 },
        { key: "home_infrastructure_platforms", recordCount: infrastructure.length, evidencedShare: infrastructure.length ? 1 : 0 },
        { key: "home_data_flows", recordCount: dataFlows.length, evidencedShare: dataFlows.length ? 1 : 0 },
        { key: "home_data_workload_segments", recordCount: dataWorkloads.length, evidencedShare: dataWorkloads.length ? 1 : 0 },
        { key: "home_agent_ready_applications_systems", recordCount: permittedApplications.length, evidencedShare: applications.length ? permittedApplications.length / applications.length : 0 },
        { key: "home_agent_ready_vendor_contracts", recordCount: permittedContracts.length, evidencedShare: contracts.length ? permittedContracts.length / contracts.length : 0 },
        { key: "home_agent_ready_infrastructure_platforms", recordCount: permittedInfrastructure.length, evidencedShare: infrastructure.length ? permittedInfrastructure.length / infrastructure.length : 0 },
        { key: "home_agent_ready_data_flows", recordCount: permittedDataFlows.length, evidencedShare: dataFlows.length ? permittedDataFlows.length / dataFlows.length : 0 },
        { key: "home_agent_ready_data_workload_segments", recordCount: permittedDataWorkloads.length, evidencedShare: dataWorkloads.length ? permittedDataWorkloads.length / dataWorkloads.length : 0 },
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

async function readEclSourceRecordRows(db: Client, tenantKey: string, assessmentId: string): Promise<EclSourceRecordSummaryRow[]> {
  const result = await db.query<EclSourceRecordSummaryRow>(
    `
      select
        r.id::text as source_record_id,
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
  return result.rows;
}

function buildEclSourceSummaries(rows: EclSourceRecordSummaryRow[]): SourceSummary[] {
  const byFile = new Map<string, EclSourceRecordSummaryRow[]>();
  for (const row of rows) {
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

function claimRef(chapterId: ChapterId, index: number): string {
  return `${chapterId}_writer_claim_${String(index + 1).padStart(3, "0")}`;
}

function claimRowsWithRefs(chapters: ChapterView[]): Array<GroundedClaim & { claim_ref: string; chapter_id: ChapterId }> {
  return chapters.flatMap((chapter) =>
    claimRowsForChapter(chapter).map((claim, index) => ({
      ...claim,
      claim_ref: claim.claim_ref ?? claimRef(chapter.chapterId, index),
      chapter_id: chapter.chapterId,
    })),
  );
}

function standaloneInventoryClaim(statement: string): boolean {
  return (
    INVENTORY_OPENING_PATTERN.test(statement) &&
    !/\b(?:because|therefore|so that|making|means leadership|requires leadership|materially changes|constrains|unlocks)\b/i.test(statement)
  );
}

function unsuitableOpeningClaim(statement: string): boolean {
  return (
    COMMERCIAL_OPENING_PATTERN.test(statement) ||
    EVIDENCE_BOUNDARY_OPENING_PATTERN.test(statement) ||
    NARROW_PROGRAM_OPENING_PATTERN.test(statement) ||
    INDIVIDUAL_ASSET_OPENING_PATTERN.test(statement) ||
    standaloneInventoryClaim(statement)
  );
}

function businessFirstOpeningClaim(claims: Array<GroundedClaim & { claim_ref: string; chapter_id: ChapterId }>) {
  return (
    claims.find((claim) =>
      claim.chapter_id === "executive_brief" &&
      BROAD_ENTERPRISE_THESIS_PATTERN.test(claim.statement) &&
      BUSINESS_CONSEQUENCE_PATTERN.test(claim.statement) &&
      !unsuitableOpeningClaim(claim.statement),
    ) ??
    claims.find((claim) =>
      BROAD_ENTERPRISE_THESIS_PATTERN.test(claim.statement) &&
      BUSINESS_CONSEQUENCE_PATTERN.test(claim.statement) &&
      !unsuitableOpeningClaim(claim.statement),
    ) ??
    null
  );
}

function scaleFactClaim(claims: Array<GroundedClaim & { claim_ref: string }>, openingRef: string | null) {
  return claims.find((claim) => claim.claim_ref !== openingRef && INVENTORY_OPENING_PATTERN.test(claim.statement)) ?? null;
}

const SECTION_CHAPTERS: Record<HomeExecutiveStorySectionId, ChapterId[]> = {
  enterprise: ["our_business", "executive_brief"],
  bets: ["strategy_value_creation"],
  "runs-on": ["how_we_operate", "technology_data"],
  "costs-returns": ["performance_value"],
  exposed: ["technology_data", "what_needs_attention"],
  attention: ["what_needs_attention", "leadership_perspective"],
};

function chapterTerminalState(chapter: ChapterView): { state: HomeExecutiveStoryTerminalState; reasonCode: string | null } {
  const hasClaims = claimRowsForChapter(chapter).length > 0;
  if (hasClaims) return { state: "published", reasonCode: null };
  return {
    state: chapter.limitations.length > 0 ? "refused" : "deferred",
    reasonCode: chapter.limitations.length > 0 ? "evidence_not_sufficient" : "no_verified_claims",
  };
}

function sectionPlan(
  sectionId: HomeExecutiveStorySectionId,
  claims: Array<GroundedClaim & { claim_ref: string; chapter_id: ChapterId }>,
  openingRef: string | null,
): HomeExecutiveStoryPlanV1["sections"][number] {
  const sectionClaims = claims.filter((claim) => SECTION_CHAPTERS[sectionId].includes(claim.chapter_id));
  const lead = sectionLeadClaim(sectionId, sectionClaims, openingRef);
  const supporting = sectionClaims
    .filter((claim) => claim.claim_ref !== lead?.claim_ref)
    .slice(0, 3)
    .map((claim) => claim.claim_ref);
  return {
    sectionId,
    state: lead ? "published" : "deferred",
    leadClaimRef: lead?.claim_ref ?? null,
    supportingClaimRefs: supporting,
    reasonCode: lead ? null : "no_verified_claim_for_section",
  };
}

function sectionLeadClaim(
  sectionId: HomeExecutiveStorySectionId,
  sectionClaims: Array<GroundedClaim & { claim_ref: string; chapter_id: ChapterId }>,
  openingRef: string | null,
): (GroundedClaim & { claim_ref: string; chapter_id: ChapterId }) | null {
  if (sectionId === "enterprise" && openingRef) {
    return sectionClaims.find((claim) => claim.claim_ref === openingRef) ?? null;
  }

  const evidenceLedCandidate =
    sectionClaims.find((claim) => !EVIDENCE_BOUNDARY_OPENING_PATTERN.test(claim.statement)) ?? null;

  if (sectionId === "runs-on" || sectionId === "exposed") {
    return evidenceLedCandidate;
  }

  return sectionClaims.find((claim) => !unsuitableOpeningClaim(claim.statement)) ?? null;
}

function buildHomeExecutiveStoryPlan(
  options: CliOptions,
  rows: HomeProjectionWriteRow[],
  chapters: ChapterView[],
  signalPacket: EnterpriseSignalPacket,
): HomeExecutiveStoryPlanV1 {
  const allClaims = claimRowsWithRefs(chapters);
  const opening = businessFirstOpeningClaim(allClaims);
  const scale = scaleFactClaim(allClaims, opening?.claim_ref ?? null);
  const sourceClaimRefs = allClaims.map((claim) => claim.claim_ref);
  const planWithoutHash: Omit<HomeExecutiveStoryPlanV1, "storyPlanHash"> = {
    contractVersion: STORY_PLAN_CONTRACT_VERSION,
    tenantKey: options.tenantKey,
    assessmentId: options.assessmentId,
    snapshotId: rows[0]?.snapshot_id ?? null,
    openingThesisClaimRef: opening?.claim_ref ?? null,
    openingSupportingClaimRefs: allClaims
      .filter((claim) => claim.claim_ref !== opening?.claim_ref)
      .filter((claim) => !unsuitableOpeningClaim(claim.statement))
      .slice(0, 3)
      .map((claim) => claim.claim_ref),
    scaleFactRef: scale?.claim_ref ?? null,
    decisions: [
      {
        decisionId: "home-exec-decision-001",
        question: "Which business consequence should leadership act on before reviewing lower-level evidence?",
        whyNowClaimRefs: opening ? [opening.claim_ref] : [],
        ownerRef: null,
        handoffModule: null,
        evidenceNeeded: opening ? [] : ["Publish a verified business-consequence thesis before executive use."],
      },
    ],
    sectionOrder: ["enterprise", "bets", "runs-on", "costs-returns", "exposed", "attention"],
    sections: ["enterprise", "bets", "runs-on", "costs-returns", "exposed", "attention"].map((sectionId) =>
      sectionPlan(sectionId as HomeExecutiveStorySectionId, allClaims, opening?.claim_ref ?? null),
    ),
    chapterStates: Object.fromEntries(
      chapters.map((chapter) => [chapter.chapterId, chapterTerminalState(chapter)]),
    ) as HomeExecutiveStoryPlanV1["chapterStates"],
    heroVisualDatasetRef: signalPacket.visualDatasets?.application_landscape_by_function ? "application_landscape_by_function" : null,
    overallEvidenceBoundary:
      "The executive story uses only verified Home chapter claims; counts are shown as scale facts, not as the thesis.",
    sourceClaimRefs,
  };
  return {
    ...planWithoutHash,
    storyPlanHash: hashJson(planWithoutHash),
  };
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

function compactFailedLedger(
  ledger: Array<{ path: string; verdict: string; action: string; reasoning: string; claim_statement?: string }>,
  limit = 20,
): Array<{ path: string; verdict: string; action: string; reasoning: string; claim_statement?: string }> {
  return ledger
    .filter((row) => !row.action.startsWith("kept"))
    .slice(0, limit)
    .map((row) => ({
      path: row.path,
      verdict: row.verdict,
      action: row.action,
      reasoning: row.reasoning.slice(0, 360),
      claim_statement: row.claim_statement?.slice(0, 360),
    }));
}

function logPublicationGateEvent(
  options: CliOptions,
  thesisResult: Awaited<ReturnType<typeof buildVerifiedEnterpriseThesisFromSignalPacket>>,
  signalPacket: EnterpriseSignalPacket,
  publicationIssues: string[],
): void {
  const ledger = thesisResult.verificationLedger;
  const actionTallyRows = actionTally(ledger);
  const cleanKept = actionTallyRows.kept ?? 0;
  console.log(
    JSON.stringify({
      structured_event: "home_ecl_narrative_publication_gate",
      tenant_key: options.tenantKey,
      assessment_id: options.assessmentId,
      accepted: publicationIssues.length === 0,
      issues: publicationIssues,
      ledger_rows: ledger.length,
      clean_keep_rate: ledger.length ? Number((cleanKept / ledger.length).toFixed(4)) : 0,
      verdict_tally: verdictTally(ledger),
      action_tally: actionTallyRows,
      structural_issue_count: thesisResult.structuralIssues.length,
      signal_count: signalPacket.signals.length,
      context_item_count: signalPacket.contextItems.length,
      source_summary_count: signalPacket.sourceSummaries.length,
      failed_ledger_sample: compactFailedLedger(ledger),
    }),
  );
}

function publicationGateIssues(
  thesisResult: Awaited<ReturnType<typeof buildVerifiedEnterpriseThesisFromSignalPacket>>,
  signalPacket: EnterpriseSignalPacket,
): string[] {
  const issues = [...(thesisResult.publicationIssues ?? [])];
  const ledgerRows = thesisResult.verificationLedger.length;
  const actionTallyRows = actionTally(thesisResult.verificationLedger);
  const verdictTallyRows = verdictTally(thesisResult.verificationLedger);
  const cleanKept = actionTallyRows.kept ?? 0;
  const cleanKeepRate = ledgerRows ? cleanKept / ledgerRows : 0;
  const unsupported = verdictTallyRows.UNSUPPORTED ?? 0;
  const overstated = verdictTallyRows.OVERSTATED ?? 0;
  if (unsupported > RAW_PUBLICATION_MAX_UNSUPPORTED) {
    issues.push(`raw_unsupported_claims_${unsupported}_gt_${RAW_PUBLICATION_MAX_UNSUPPORTED}`);
  }
  if (overstated > RAW_PUBLICATION_MAX_OVERSTATED) {
    issues.push(`raw_overstated_claims_${overstated}_gt_${RAW_PUBLICATION_MAX_OVERSTATED}`);
  }
  if (cleanKeepRate < RAW_PUBLICATION_MIN_CLEAN_KEEP_RATE) {
    issues.push(`raw_clean_keep_rate_${cleanKept}_of_${ledgerRows}_lt_${Math.round(RAW_PUBLICATION_MIN_CLEAN_KEEP_RATE * 100)}pct`);
  }
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
  signalPacket: EnterpriseSignalPacket,
): string[] {
  const issues: string[] = [];
  const workloadContextLoaded = dataWorkloadContextLoaded(signalPacket);
  for (const item of visibleNarrativeText(thesisResult, chapters)) {
    for (const forbidden of CXO_FORBIDDEN_VISIBLE_PATTERNS) {
      if (forbidden.pattern.test(item.text)) {
        issues.push(`forbidden_visible_term:${forbidden.label}:${item.path}`);
      }
    }
    if (workloadContextLoaded && FAKE_DATA_WORKLOAD_GAP_PATTERN.test(item.text)) {
      issues.push(`fake_data_workload_gap_when_loaded:${item.path}`);
    }
  }
  return issues;
}

function dataWorkloadContextLoaded(signalPacket: EnterpriseSignalPacket): boolean {
  const packet = signalPacket as unknown as {
    visualDatasets?: Record<string, unknown>;
    categorySummaries?: Array<{ key?: string; recordCount?: number }>;
  };
  const byFunction = packet.visualDatasets?.data_workload_by_function;
  const byTechnology = packet.visualDatasets?.data_workload_by_technology;
  const category = packet.categorySummaries?.find((item) => item.key === "data_bi_etl_workloads_by_function_and_technology");
  return (
    (Array.isArray(byFunction) && byFunction.length > 0) ||
    (Array.isArray(byTechnology) && byTechnology.length > 0) ||
    Number(category?.recordCount ?? 0) > 0
  );
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
  const storyPlan = buildHomeExecutiveStoryPlan(options, rows, chapters, signalPacket);
  const storyPlanAnchor = summaryRowsByPage.get("executive_brief") ?? rows.find((row) => row.row_type === "summary");
  if (!storyPlanAnchor) throw new Error("No summary row exists to anchor the Home executive story plan");

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
    await db.query(
      `
        delete from ecl_projection.home_enterprise_landscape
        where tenant_key = $1
          and assessment_id = $2
          and projection_version = $3
          and row_type = 'story_plan'
      `,
      [options.tenantKey, options.assessmentId, PROJECTION_VERSION],
    );
    await db.query(
      `
        delete from ecl_projection.projection_entry
        where tenant_key = $1
          and assessment_id = $2
          and projection_version = $3
          and surface_key = $4
          and row_type = 'story_plan'
      `,
      [options.tenantKey, options.assessmentId, PROJECTION_VERSION, HOME_SURFACE_KEY],
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
        const rowKey = claim.claim_ref ?? `${chapter.chapterId}_writer_claim_${String(index + 1).padStart(3, "0")}`;
        const displayPayload = {
          writer: {
            source: "ecl_projection.home_enterprise_landscape",
            generated_at: generatedAt,
            provenance,
            claim_path: rowKey,
          },
          claim_ref: rowKey,
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

    const storyPlanPayload = {
      writer: {
        source: "ecl_projection.home_enterprise_landscape",
        generated_at: generatedAt,
        provenance,
        contract_version: STORY_PLAN_CONTRACT_VERSION,
      },
      story_plan: storyPlan,
    };
    const storyPlanEntry = await db.query<{ id: string }>(
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
        values ($1,$2,$3,$4,$5,$6,'executive_story_plan_v1','story_plan',$7,$8,$9::jsonb,$10::jsonb)
        returning id
      `,
      [
        options.tenantKey,
        options.assessmentId,
        storyPlanAnchor.snapshot_id,
        storyPlanAnchor.projection_manifest_id,
        PROJECTION_VERSION,
        HOME_SURFACE_KEY,
        storyPlan.storyPlanHash,
        hashJson({ sourceClaimRefs: storyPlan.sourceClaimRefs }),
        JSON.stringify({ objects: [], metrics: [], measures: [], relationships: [], source_records: [], document_extractions: [] }),
        JSON.stringify({ page_key: "executive_brief", section_key: "story_plan", title: "Home executive story plan" }),
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
        values ($1,$2,$3,$4,$5,$6,'executive_brief','executive_story_plan_v1','story_plan','story_plan',
          'Home executive story plan',$7,null,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,
          'deterministic_story_plan_from_verified_claims','known','passed','not_applicable',null,'{}'::jsonb,'[]'::jsonb,$8::jsonb,$9)
      `,
      [
        options.tenantKey,
        options.assessmentId,
        storyPlanAnchor.snapshot_id,
        storyPlanAnchor.projection_manifest_id,
        storyPlanEntry.rows[0].id,
        PROJECTION_VERSION,
        storyPlan.overallEvidenceBoundary,
        JSON.stringify(storyPlanPayload),
        storyPlan.storyPlanHash,
      ],
    );

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

    const dbSourceRows = await readEclSourceRecordRows(db, options.tenantKey, options.assessmentId);
    const activeSourceRows = readActiveTenantSourceRows(options.tenantKey);
    const sourceRows = mergeSourceRows(dbSourceRows, activeSourceRows);
    const sourceSummaries = buildEclSourceSummaries(sourceRows);
    const { signalPacket, contextPolicyProof } = buildGovernedSignalPacket(
      rows,
      options.tenantKey,
      options.assessmentId,
      sourceSummaries,
      sourceRows,
    );
    console.log(
      `${options.tenantKey}/${options.assessmentId}: ${rows.length} Home projection rows -> ` +
        `${signalPacket.signals.length} signals, ${signalPacket.contextItems.length} context items, ` +
        `${signalPacket.sourceSummaries.length} source summaries; ` +
        `${activeSourceRows.length.toLocaleString()} active intake source rows; ` +
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
    const rawThesisResult = await buildVerifiedEnterpriseThesisFromSignalPacket(signalPacket, anthropic, {
      deterministicClaimPlan: true,
    });
    const thesisResult = scrubThesisResultVisibleIds(rawThesisResult, labelByIdentifier);
    if (!thesisResult.publishedGeneration) throw new Error("Home ECL narrative writer produced no publishable thesis.");
    const publicationIssues = publicationGateIssues(thesisResult, signalPacket);
    logPublicationGateEvent(options, thesisResult, signalPacket, publicationIssues);
    if (publicationIssues.length && WRITE) {
      throw new Error(`Home ECL narrative publication gate failed: ${publicationIssues.join("; ")}`);
    }
    if (publicationIssues.length) {
      console.log(`  ! Home ECL narrative publication gate would fail on write: ${publicationIssues.join("; ")}`);
    }

    const generatedChapters = await buildChapterViewsFromVerifiedThesis(
      signalPacket,
      thesisResult.publishedGeneration as EnterpriseThesis,
      anthropic,
      options.chapterIds,
    );
    const chapters = normalizeChapterTerminalStates(
      scrubVisibleIdsInValue(generatedChapters, labelByIdentifier) as ChapterView[],
    );
    const visibleQualityIssues = visibleNarrativeQualityIssues(thesisResult, chapters, signalPacket);
    if (visibleQualityIssues.length) {
      throw new Error(`Home ECL narrative visible-quality gate failed: ${visibleQualityIssues.join("; ")}`);
    }
    const verificationSummary = {
      structural_issue_count: thesisResult.structuralIssues.length,
      verdict_tally: verdictTally(thesisResult.verificationLedger),
      action_tally: actionTally(thesisResult.verificationLedger),
      publication_gate: {
        accepted: publicationIssues.length === 0,
        issues: publicationIssues,
      },
      ledger_rows: thesisResult.verificationLedger.length,
    };
    const result = {
      tenantKey: options.tenantKey,
      assessmentId: options.assessmentId,
      writeApplied: WRITE,
      chapters,
      storyPlan: buildHomeExecutiveStoryPlan(options, rows, chapters, signalPacket),
      signalPacket,
      contextPolicyProof,
      thesisResult,
      publicationGate: verificationSummary.publication_gate,
      verificationSummary,
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
      active_source_file_rows: activeSourceRows.length,
      chapter_count: chapters.length,
      chapter_claim_rows: chapters.reduce((sum, chapter) => sum + claimRowsForChapter(chapter).length, 0),
      thesis_prompt_version: THESIS_PROMPT_VERSION,
      context_policy: contextPolicyProof,
      signal_packet_hash: hashJson(signalPacket),
      story_plan_hash: buildHomeExecutiveStoryPlan(options, rows, chapters, signalPacket).storyPlanHash,
      verification: verificationSummary,
      out_file: outFile,
    }));
    emitHomeNarrativeProofBundle(outFile, result, options);
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

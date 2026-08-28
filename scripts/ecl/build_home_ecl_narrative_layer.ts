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

type EnterpriseSignalPacket = ReturnType<typeof buildEnterpriseSignalPacket>;
type JsonRecord = Record<string, unknown>;

const HOME_SURFACE_KEY = "home_enterprise_landscape";
const DEFAULT_TENANT_KEY = "meridian-health";
const DEFAULT_ASSESSMENT_ID = "ecl-dense-meridian-2026-08-23";
const DEFAULT_OUT_DIR = "/tmp/home-ecl-narrative-layer";
const PROJECTION_VERSION = 1;
const WRITE = process.env.HOME_ECL_NARRATIVE_WRITE === "true" && process.env.HOME_ECL_NARRATIVE_WRITE_APPROVED === "true";

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

function rowStatement(row: HomeProjectionWriteRow): string {
  const data = payload(row);
  switch (row.page_key) {
    case "applications_systems":
      return [
        `${text(data.application_name) ?? row.title} is loaded as an application`,
        text(data.business_function) ? `for ${text(data.business_function)}` : null,
        text(data.vendor_name) ? `supplied by ${text(data.vendor_name)}` : null,
        text(data.criticality_tier) ? `with ${text(data.criticality_tier)} criticality` : null,
        numberValue(data.annual_cost_usd) > 0 ? `and $${(numberValue(data.annual_cost_usd) / 1_000_000).toFixed(1)}M annual cost` : null,
      ].filter(Boolean).join(" ") + ".";
    case "vendor_contracts":
      return [
        `${text(data.contract_name) ?? row.title} is loaded as a contract`,
        payloadText(data, "supplier_name", "vendor_name") ? `with ${payloadText(data, "supplier_name", "vendor_name")}` : null,
        text(data.service_category) ? `for ${text(data.service_category)}` : null,
        payloadNumber(data, "annualized_value_usd", "annual_spend_usd") > 0 ? `with $${(payloadNumber(data, "annualized_value_usd", "annual_spend_usd") / 1_000_000).toFixed(1)}M annualized value` : null,
        payloadNumber(data, "notice_window_days", "notice_period_days") > 0 ? `and ${payloadNumber(data, "notice_window_days", "notice_period_days")} days notice` : null,
      ].filter(Boolean).join(" ") + ".";
    case "infrastructure_platforms":
      return [
        `${text(data.platform_name) ?? row.title} is loaded as an infrastructure or platform record`,
        text(data.platform_type) ? `of type ${text(data.platform_type)}` : null,
        text(data.hosting_model) ? `on ${text(data.hosting_model)}` : null,
        text(data.criticality_tier) ? `with ${text(data.criticality_tier)} criticality` : null,
        text(data.support_end_date) ? `with support ending ${text(data.support_end_date)}` : null,
      ].filter(Boolean).join(" ") + ".";
    case "current_state_data_flow":
    case "data_assets_integrations":
      return [
        `${text(data.data_asset_name) ?? row.title} is loaded as a data movement`,
        text(data.source_system) ? `from ${text(data.source_system)}` : null,
        text(data.target_system) ? `to ${text(data.target_system)}` : null,
        text(data.integration_type) ? `using ${text(data.integration_type)}` : null,
        text(data.consumption_layer) ? `serving ${text(data.consumption_layer)}` : null,
      ].filter(Boolean).join(" ") + ".";
    default:
      return row.summary ?? row.title;
  }
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

function buildSignalPacket(rows: HomeProjectionWriteRow[], assessmentId: string): EnterpriseSignalPacket {
  const applications = rowsOf(rows, "applications_systems", "application");
  const contracts = rowsOf(rows, "vendor_contracts", "contract");
  const infrastructure = rowsOf(rows, "infrastructure_platforms", "infrastructure");
  const dataFlows = [
    ...rowsOf(rows, "current_state_data_flow", "data_flow"),
    ...rowsOf(rows, "data_assets_integrations", "data_flow"),
  ];
  const contractSpend = contracts.reduce((sum, row) => sum + payloadNumber(payload(row), "annualized_value_usd", "annual_spend_usd"), 0);
  const vendorRows = topSpendShareRows(contracts, "supplier_name", "annualized_value_usd", 8);
  const topVendor = vendorRows[0];

  const signals: Signal[] = [
    {
      id: "sig_ecl_estate_001",
      kind: "portfolio",
      statement: `The ECL Home projection contains ${applications.length.toLocaleString()} applications, ${contracts.length.toLocaleString()} contracts, ${infrastructure.length.toLocaleString()} infrastructure/platform records, and ${dataFlows.length.toLocaleString()} data-flow rows.`,
      domains: ["application_system", "vendor_contract", "infrastructure_platform", "data_asset_or_integration"],
      evidenceRefs: ["ecl_projection.home_enterprise_landscape"],
    },
    {
      id: "sig_ecl_vendor_002",
      kind: "concentration",
      statement: topVendor
        ? `The ECL contract view shows ${contracts.length.toLocaleString()} contracts with $${(contractSpend / 1_000_000).toFixed(1)}M annualized value; ${String(topVendor.label)} is the largest visible supplier group at ${Number(topVendor.sharePct).toFixed(1)}% of loaded contract value.`
        : "The ECL contract view has no supplier spend rows loaded.",
      domains: ["vendor_contract", "spend_value_fact"],
      evidenceRefs: ["ecl_projection.home_enterprise_landscape"],
    },
    {
      id: "sig_ecl_data_flow_003",
      kind: "complexity",
      statement: `The ECL data-flow view carries ${dataFlows.length.toLocaleString()} source-target movement rows, so architecture and data-flow pages should render from topology evidence rather than from static snapshot counts.`,
      domains: ["data_asset_or_integration", "application_system"],
      evidenceRefs: ["ecl_projection.home_enterprise_landscape"],
    },
    {
      id: "sig_ecl_writer_004",
      kind: "operational",
      statement: "Home narrative prose is generated from ECL projection rows through the verified EnterpriseThesis writer, while factual counts remain deterministic projection facts.",
      domains: ["evidence_sources", "application_system", "vendor_contract"],
      evidenceRefs: ["ecl_projection.home_enterprise_landscape"],
    },
  ];

  const contextItems: ContextItem[] = [
    {
      id: "ctx_ecl_assessment_001",
      statement: `This Home narrative build is based on ECL assessment ${assessmentId}; the fixture is synthetic and not client-attested.`,
      domains: ["enterprise_profile", "evidence_sources"],
    },
    ...rows
      .filter((row) => row.row_type !== "summary" && row.row_type !== "chapter_claim")
      .slice(0, 900)
      .map((row) => ({
        id: contextId(row),
        statement: rowStatement(row),
        domains: rowDomains(row),
      })),
  ];

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
      technologyBudget: sumPayload(applications, "annual_cost_usd"),
      technologyBudgetShareOfRevenue: null,
    },
    strategicPriorities: [],
    signals,
    contextItems,
    visualDatasets: {
      application_landscape_by_function: dimensionShareRows(applications, "business_function", 8),
      vendor_spend_concentration: vendorRows,
    },
    analyticalLenses: [],
    coverageManifest: {
      dimensionCoverage: [
        { key: "home_applications_systems", recordCount: applications.length, evidencedShare: applications.length ? 1 : 0 },
        { key: "home_vendor_contracts", recordCount: contracts.length, evidencedShare: contracts.length ? 1 : 0 },
        { key: "home_infrastructure_platforms", recordCount: infrastructure.length, evidencedShare: infrastructure.length ? 1 : 0 },
        { key: "home_data_flows", recordCount: dataFlows.length, evidencedShare: dataFlows.length ? 1 : 0 },
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
  return packet;
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
): string[] {
  const issues = [...(thesisResult.publicationIssues ?? [])];
  if (thesisResult.structuralIssues.length) {
    issues.push(`structural_issues_${thesisResult.structuralIssues.length}`);
  }
  for (const row of thesisResult.verificationLedger) {
    if (row.verdict === "UNSUPPORTED" && row.action !== "dropped") {
      issues.push(`unsupported_claim_not_dropped:${row.path}:${row.action}`);
    }
    if (row.verdict === "OVERSTATED" && !row.action.startsWith("repaired") && !row.action.startsWith("dropped")) {
      issues.push(`overstated_claim_not_repaired_or_dropped:${row.path}:${row.action}`);
    }
  }
  return issues;
}

async function writeNarrativeRows(
  db: Client,
  options: CliOptions,
  rows: HomeProjectionWriteRow[],
  chapters: ChapterView[],
  thesisResult: Awaited<ReturnType<typeof buildVerifiedEnterpriseThesisFromSignalPacket>>,
  signalPacket: EnterpriseSignalPacket,
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
          thesis_structural_issue_count: thesisResult.structuralIssues.length,
          verification_verdict_tally: verdictTally(thesisResult.verificationLedger),
          verification_action_tally: actionTally(thesisResult.verificationLedger),
          publication_gate: {
            accepted: true,
            issues: [],
          },
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

    const signalPacket = buildSignalPacket(rows, options.assessmentId);
    console.log(
      `${options.tenantKey}/${options.assessmentId}: ${rows.length} Home projection rows -> ` +
        `${signalPacket.signals.length} signals, ${signalPacket.contextItems.length} context items`,
    );

    const thesisResult = await buildVerifiedEnterpriseThesisFromSignalPacket(signalPacket, anthropic);
    if (!thesisResult.publishedGeneration) throw new Error("Home ECL narrative writer produced no publishable thesis.");
    const publicationIssues = publicationGateIssues(thesisResult);
    if (publicationIssues.length) {
      throw new Error(`Home ECL narrative publication gate failed: ${publicationIssues.join("; ")}`);
    }

    const chapters = await buildChapterViewsFromVerifiedThesis(
      signalPacket,
      thesisResult.publishedGeneration as EnterpriseThesis,
      anthropic,
      options.chapterIds,
    );
    const result = {
      tenantKey: options.tenantKey,
      assessmentId: options.assessmentId,
      writeApplied: WRITE,
      chapters,
      signalPacket,
      thesisResult,
    };
    const outFile = path.join(options.outDir, `${options.tenantKey}-home-ecl-narrative-layer.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
    console.log(`-> ${outFile}`);

    if (WRITE) {
      await writeNarrativeRows(db, options, rows, chapters, thesisResult, signalPacket);
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

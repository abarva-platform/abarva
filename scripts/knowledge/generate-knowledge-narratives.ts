#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import Papa from "papaparse";
import { Client } from "pg";

import {
  KNOWLEDGE_NARRATIVE_LENSES,
  KnowledgeNarrativeGenerator,
  type AcceptedNarrativeFact,
  type AcceptedNarrativeRelationship,
  type EnterpriseIdentityNarrativeSummary,
  type KnowledgeNarrativeDraft,
  type NarrativeIndustryContextRow,
  type NarrativeInterviewExcerpt,
  type NarrativeMetric,
} from "@/lib/knowledge/consumption-server/generate-narrative";

interface CliArgs {
  tenant: string;
  releaseId: string | null;
  baselineRef: string | null;
  interviewsCsv: string;
  industryContextCsv: string;
  outDir: string | null;
  write: boolean;
  json: boolean;
}

interface BriefRow {
  tenant_key: string;
  knowledge_baseline_ref: string;
  domain_publication_ref: string;
  projection_contract_version: string;
  as_of_date: string;
  authority_state: string;
  freshness_state: string;
  availability_state: string;
  evidence_coverage: string | number | null;
  content_hash: string;
  object_ref: string;
  display_name: string;
  executive_summary: string | null;
  payload: Record<string, unknown>;
}

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.tenant) throw new Error("--tenant is required.");
  if (args.write && process.env.ABARVA_KNOWLEDGE_NARRATIVE_WRITE_APPROVED !== "true") {
    throw new Error("Writes require ABARVA_KNOWLEDGE_NARRATIVE_WRITE_APPROVED=true.");
  }

  const { dbConnectionConfig } = await import("./build-review-decision-ledger.mjs");
  const client = new Client(await dbConnectionConfig(process.env));
  await client.connect();
  try {
    await client.query("SELECT set_config('app.tenant_key', $1, false)", [args.tenant]);
    const baselineRef = args.baselineRef ?? await activeBaselineRef(client, args.tenant, args.releaseId);
    if (!baselineRef) throw new Error(`No active Knowledge Baseline found for ${args.tenant}.`);
    const baseBrief = await loadBaseBrief(client, args.tenant, baselineRef);
    if (!baseBrief) throw new Error(`consumption.enterprise_brief_v1 base row is missing for ${args.tenant}/${baselineRef}.`);

    const [facts, relationships, metrics, interviews, industryRows] = await Promise.all([
      loadFacts(client, args.tenant),
      loadRelationships(client, args.tenant),
      loadMetrics(client, args.tenant),
      loadInterviews(args.interviewsCsv),
      loadIndustryContext(args.industryContextCsv),
    ]);

    const identity = enterpriseIdentityFromBrief(baseBrief);
    const generator = new KnowledgeNarrativeGenerator();
    const drafts: KnowledgeNarrativeDraft[] = [];
    for (const lens of KNOWLEDGE_NARRATIVE_LENSES) {
      drafts.push(await generator.generate({
        tenantKey: args.tenant,
        knowledgeBaselineRef: baselineRef,
        lens,
        enterpriseIdentity: identity,
        facts,
        relationships,
        interviewExcerpts: interviews,
        industryContextRows: industryRows,
        metrics,
      }));
    }

    if (args.write) {
      for (const draft of drafts) {
        if (draft.refused || !draft.interpretation) continue;
        await writeNarrativeBrief(client, baseBrief, draft);
      }
    }

    const summary = {
      tenantKey: args.tenant,
      knowledgeBaselineRef: baselineRef,
      writeApplied: args.write,
      generatedCount: drafts.filter((draft) => !draft.refused && draft.interpretation).length,
      refusalCount: drafts.filter((draft) => draft.refused || !draft.interpretation).length,
      benchmarkGeneratedCount: drafts.reduce((sum, draft) => sum + draft.benchmarks.length, 0),
      perspectiveGeneratedCount: drafts.reduce((sum, draft) => sum + draft.perspectives.length, 0),
      drafts,
    };
    if (args.outDir) await writeProof(args.outDir, summary);
    if (args.json) console.log(JSON.stringify(summary));
    else console.log(renderSummary(summary));
  } finally {
    await client.end();
  }
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    tenant: process.env.ABARVA_TENANT_KEY ?? "",
    releaseId: process.env.ABARVA_RELEASE_ID ?? process.env.ABARVA_SOURCE_RELEASE_ID ?? null,
    baselineRef: process.env.ABARVA_KNOWLEDGE_BASELINE_REF ?? null,
    interviewsCsv: "datasets/tenant-inputs/skyharbor-air/interviews/executive_interviews.csv",
    industryContextCsv: "datasets/tenant-inputs/active/skyharbor-air/current/15_industry_context_patterns.csv",
    outDir: null,
    write: false,
    json: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
      i += 1;
      return value;
    };
    if (token === "--tenant") args.tenant = next();
    else if (token === "--release-id") args.releaseId = next();
    else if (token === "--baseline-ref") args.baselineRef = next();
    else if (token === "--interviews-csv") args.interviewsCsv = next();
    else if (token === "--industry-context-csv") args.industryContextCsv = next();
    else if (token === "--out-dir") args.outDir = next();
    else if (token === "--write") args.write = true;
    else if (token === "--json") args.json = true;
    else throw new Error(`Unknown argument: ${token}`);
  }
  return args;
}

async function activeBaselineRef(client: Client, tenantKey: string, releaseId: string | null): Promise<string | null> {
  const params = releaseId ? [tenantKey, releaseId] : [tenantKey];
  const releaseClause = releaseId ? "AND release_id = $2" : "";
  const result = await client.query<{ knowledge_baseline_ref: string }>(
    `SELECT knowledge_baseline_ref
       FROM publication.knowledge_baseline
      WHERE tenant_key = $1
        ${releaseClause}
        AND is_active = true
      ORDER BY activated_at DESC NULLS LAST
      LIMIT 1`,
    params,
  );
  return result.rows[0]?.knowledge_baseline_ref ?? null;
}

async function loadBaseBrief(client: Client, tenantKey: string, baselineRef: string): Promise<BriefRow | null> {
  const result = await client.query<BriefRow>(
    `SELECT *
       FROM consumption.enterprise_brief_v1
      WHERE tenant_key = $1
        AND knowledge_baseline_ref = $2
        AND object_ref = 'enterprise'
      LIMIT 1`,
    [tenantKey, baselineRef],
  );
  return result.rows[0] ?? null;
}

async function loadFacts(client: Client, tenantKey: string): Promise<AcceptedNarrativeFact[]> {
  const result = await client.query<{
    fact_ref: string;
    entity_ref: string | null;
    entity_type: string | null;
    display_name: string | null;
    fact_type: string;
    fact_value: unknown;
    evidence_refs: string[] | null;
    evidence_text: string | null;
  }>(
    `SELECT f.fact_ref, f.entity_ref, e.entity_type, e.display_name, f.fact_type,
            f.fact_value, f.evidence_refs,
            string_agg(ev.evidence_text, E'\n---\n' ORDER BY ev.evidence_ref) AS evidence_text
       FROM knowledge.fact_assertion f
       LEFT JOIN knowledge.entity e
         ON e.tenant_key = f.tenant_key AND e.entity_ref = f.entity_ref
       LEFT JOIN evidence.evidence_item ev
         ON ev.tenant_key = f.tenant_key
        AND ev.evidence_ref = ANY(f.evidence_refs)
        AND ev.authority_state = 'accepted'
        AND ev.visibility = 'client_visible'
      WHERE f.tenant_key = $1
        AND f.authority_state = 'accepted'
      GROUP BY f.fact_ref, f.entity_ref, e.entity_type, e.display_name, f.fact_type, f.fact_value, f.evidence_refs
      ORDER BY f.fact_ref
      LIMIT 240`,
    [tenantKey],
  );
  return result.rows.map((row) => ({
    factRef: row.fact_ref,
    entityRef: row.entity_ref,
    entityDisplayName: row.display_name,
    entityType: row.entity_type,
    factType: row.fact_type,
    factValue: row.fact_value,
    evidenceRefs: row.evidence_refs ?? [],
    evidenceText: row.evidence_text,
    confidence: null,
  }));
}

async function loadRelationships(client: Client, tenantKey: string): Promise<AcceptedNarrativeRelationship[]> {
  const result = await client.query<{
    relationship_ref: string;
    relationship_type_ref: string;
    from_entity_ref: string;
    to_entity_ref: string;
    evidence_refs: string[] | null;
    relationship_payload: unknown;
  }>(
    `SELECT relationship_ref, relationship_type_ref, from_entity_ref, to_entity_ref, evidence_refs, relationship_payload
       FROM knowledge.relationship_assertion
      WHERE tenant_key = $1
        AND authority_state = 'accepted'
      ORDER BY relationship_ref
      LIMIT 240`,
    [tenantKey],
  );
  return result.rows.map((row) => ({
    relationshipRef: row.relationship_ref,
    relationshipTypeRef: row.relationship_type_ref,
    fromEntityRef: row.from_entity_ref,
    toEntityRef: row.to_entity_ref,
    evidenceRefs: row.evidence_refs ?? [],
    payload: row.relationship_payload,
  }));
}

async function loadMetrics(client: Client, tenantKey: string): Promise<NarrativeMetric[]> {
  const result = await client.query<{
    metric_ref: string;
    metric_name: string | null;
    metric_value: number | null;
    unit: string | null;
    period_start: string | null;
    period_end: string | null;
    evidence_refs: string[] | null;
  }>(
    `SELECT o.metric_ref, d.metric_name, o.metric_value, d.unit,
            o.period_start::text, o.period_end::text, o.evidence_refs
       FROM metrics.metric_observation o
       LEFT JOIN metrics.metric_definition d
         ON d.tenant_key = o.tenant_key AND d.metric_ref = o.metric_ref
      WHERE o.tenant_key = $1
        AND o.authority_state = 'accepted'
      ORDER BY o.metric_ref
      LIMIT 120`,
    [tenantKey],
  );
  return result.rows.map((row) => ({
    metricRef: row.metric_ref,
    metricName: row.metric_name ?? row.metric_ref,
    value: row.metric_value,
    unit: row.unit,
    period: row.period_start && row.period_end ? `${row.period_start}..${row.period_end}` : row.period_start,
    evidenceRefs: row.evidence_refs ?? [],
  }));
}

async function loadInterviews(filePath: string): Promise<NarrativeInterviewExcerpt[]> {
  const rows = await parseCsv(filePath);
  return rows
    .filter((row) => row.synthetic_answer && row.source_row_id && row.evidence_id)
    .slice(0, 24)
    .map((row) => ({
      role: row.stakeholder_role ?? row.executive_area ?? "Executive",
      quote: row.synthetic_answer,
      sourceRowId: row.source_row_id,
      evidenceRef: row.evidence_id,
      initiativeLink: row.initiative_link,
      metricMentioned: row.metric_mentioned,
      confidence: row.confidence,
    }));
}

async function loadIndustryContext(filePath: string): Promise<NarrativeIndustryContextRow[]> {
  const rows = await parseCsv(filePath);
  return rows.map((row) => ({
    patternName: row.pattern_name ?? "Industry pattern",
    businessContext: row.business_context ?? null,
    applicability: row.applicability ?? null,
    evidenceBasis: row.evidence_basis ?? null,
    caveats: row.caveats ?? null,
    confidence: row.confidence ?? null,
    sourceRowId: row.original_row_id ?? row.source_row_id ?? row.pattern_name ?? "industry-context-row",
    hasRealCohortMetric: hasRealCohortMetric(row),
  }));
}

async function parseCsv(filePath: string): Promise<Record<string, string>[]> {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
  const text = await fs.readFile(absolute, "utf8");
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    throw new Error(`CSV parse failed for ${filePath}: ${parsed.errors[0]?.message}`);
  }
  return parsed.data;
}

function hasRealCohortMetric(row: Record<string, string>): boolean {
  return Object.entries(row).some(([key, value]) => {
    const normalized = key.toLowerCase();
    if (!/(peer|cohort|quartile|percentile|median|benchmark_value|sample_size)/.test(normalized)) return false;
    return /\d/.test(value ?? "") && !/synthetic|planning-grade|not yet validated/i.test(value ?? "");
  });
}

function enterpriseIdentityFromBrief(baseBrief: BriefRow): EnterpriseIdentityNarrativeSummary {
  const payload = baseBrief.payload;
  const identity = typeof payload.identity === "object" && payload.identity ? payload.identity as Record<string, unknown> : {};
  return {
    displayName: typeof identity.displayName === "string" ? identity.displayName : baseBrief.display_name,
    industry: typeof identity.industry === "string" ? identity.industry : null,
    summary: baseBrief.executive_summary,
    evidenceRefs: [],
  };
}

async function writeNarrativeBrief(client: Client, baseBrief: BriefRow, draft: KnowledgeNarrativeDraft): Promise<void> {
  const payload = {
    ...baseBrief.payload,
    interpretation: draft.interpretation,
    perspectives: draft.perspectives,
    benchmarks: draft.benchmarks,
  };
  const contentHash = sha256(payload);
  await client.query(
    `INSERT INTO consumption.enterprise_brief_v1 (
       tenant_key, knowledge_baseline_ref, domain_publication_ref,
       projection_contract_version, as_of_date, authority_state,
       freshness_state, availability_state, evidence_coverage, content_hash,
       object_ref, display_name, executive_summary, payload
     )
     VALUES ($1,$2,$3,$4,$5::date,$6::abarva_authority_state,$7::abarva_freshness_state,
       $8::abarva_availability_state,$9,$10,$11,$12,$13,$14::jsonb)
     ON CONFLICT (tenant_key, knowledge_baseline_ref, object_ref)
     DO UPDATE SET
       freshness_state = EXCLUDED.freshness_state,
       availability_state = EXCLUDED.availability_state,
       evidence_coverage = EXCLUDED.evidence_coverage,
       content_hash = EXCLUDED.content_hash,
       display_name = EXCLUDED.display_name,
       executive_summary = EXCLUDED.executive_summary,
       payload = EXCLUDED.payload`,
    [
      baseBrief.tenant_key,
      baseBrief.knowledge_baseline_ref,
      baseBrief.domain_publication_ref,
      baseBrief.projection_contract_version,
      baseBrief.as_of_date,
      baseBrief.authority_state,
      "fresh",
      "available",
      baseBrief.evidence_coverage,
      contentHash,
      draft.objectRef,
      `${baseBrief.display_name} (${draft.lens})`,
      draft.interpretation?.headline ?? baseBrief.executive_summary,
      JSON.stringify(payload),
    ],
  );
}

async function writeProof(outDir: string, summary: unknown): Promise<void> {
  const absolute = path.isAbsolute(outDir) ? outDir : path.join(repoRoot, outDir);
  await fs.mkdir(absolute, { recursive: true });
  await fs.writeFile(path.join(absolute, "knowledge-narrative-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(absolute, "knowledge-narrative-summary.md"), renderSummary(summary as {
    tenantKey: string;
    knowledgeBaselineRef: string;
    writeApplied: boolean;
    generatedCount: number;
    refusalCount: number;
    drafts: KnowledgeNarrativeDraft[];
  }));
}

function renderSummary(summary: {
  tenantKey: string;
  knowledgeBaselineRef: string;
  writeApplied: boolean;
  generatedCount: number;
  refusalCount: number;
  drafts: KnowledgeNarrativeDraft[];
}): string {
  const lines = [
    `# Knowledge Narrative Generation`,
    "",
    `- Tenant: ${summary.tenantKey}`,
    `- Baseline: ${summary.knowledgeBaselineRef}`,
    `- Write applied: ${summary.writeApplied}`,
    `- Generated interpretations: ${summary.generatedCount}`,
    `- Refusals: ${summary.refusalCount}`,
    "",
  ];
  for (const draft of summary.drafts) {
    lines.push(`## ${draft.lens}`);
    if (draft.interpretation) {
      lines.push(`- Headline: ${draft.interpretation.headline}`);
      lines.push(`- Body: ${draft.interpretation.body}`);
      lines.push(`- Evidence: ${draft.interpretation.evidenceRefs.join(", ")}`);
    } else {
      lines.push(`- Refused: ${draft.refusalReasons.join(", ") || "model_refusal_or_invalid_grounding"}`);
    }
    lines.push(`- Perspectives: ${draft.perspectives.length}`);
    lines.push(`- Benchmarks: ${draft.benchmarks.length}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});

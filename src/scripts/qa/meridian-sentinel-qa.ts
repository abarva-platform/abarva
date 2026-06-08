import "server-only";

/**
 * Meridian Sentinel — 80-question evidence QA harness + scorer (Agent D).
 *
 * Runs the live Intelligence answer engine (`askIntelligence`) against the
 * authored 80-question set for the Meridian tenancy, then scores each answer on
 * 12 dimensions using a hybrid of deterministic checks + a Claude judge.
 *
 * It must run inside the in-VNet operator-job image (needs the private Azure
 * Postgres data plane + ANTHROPIC_API_KEY). It does NOT mutate product runtime
 * code or any DB rows — it is read-only against retrieval and write-only to the
 * local reports directory.
 *
 * Usage (headless, in the operator-job):
 *   npx tsx src/scripts/qa/meridian-sentinel-qa.ts [--limit N] [--out <dir>]
 *
 * Outputs (into --out, default reports/meridian-sentinel-citation-hardening-2026-06-08/):
 *   - qa-results.jsonl       one JSON line per question
 *   - qa-scorecard.html      self-contained scorecard
 *   - recommended-fixes.md   systemic gaps + recommendations
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { askIntelligence } from "@/lib/intelligence/ask";
import type { AskSource } from "@/lib/intelligence/ask";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";

import {
  SCORE_DIMENSIONS,
  JUDGE_DIMENSIONS,
  scoreDeterministic,
  countSourceBuckets,
  normalizeJudgeScore,
  computeOverall,
  type ScoreDimension,
} from "./scoring";

// ---------------------------------------------------------------------------
// Tenancy + run constants
// ---------------------------------------------------------------------------

const MERIDIAN = {
  tenantId: "6e419b6e-950d-4d34-a4fc-06c3e451a6c4",
  clientKey: "meridian",
  inventoryKey: "meridian-health",
  userId: "qa-agent-d",
} as const;

const DEFAULT_OUT = "reports/meridian-sentinel-citation-hardening-2026-06-08";
const QUESTIONS_FILE = "qa-questions.json";

const JUDGE_MODEL = "claude-opus-4-7";
const JUDGE_MAX_TOKENS = 700; // modest — strict JSON only, bounds cost.
const ANSWER_TRUNCATE = 1200;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QaQuestion {
  id: string;
  category: string;
  role: string;
  question: string;
}

interface QaQuestionsFile {
  meta?: { scoreDimensions?: string[] };
  questions: QaQuestion[];
}

interface CollectedAnswer {
  answer: string;
  sources: Array<{
    type: string;
    name: string;
    id: string | null;
    confidence: number | null;
  }>;
  sourceCount: number;
  coverageReport: unknown;
}

interface ScoredRow {
  id: string;
  category: string;
  role: string;
  question: string;
  answer: string;
  sourceCount: number;
  sourceTypes: Record<string, number>;
  sourceBuckets: { tenant: number; pattern: number; inference: number };
  scores: Record<ScoreDimension, number>;
  overall: number;
  judgeOk: boolean;
  notes: string[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { limit: number | null; out: string } {
  let limit: number | null = null;
  let out = DEFAULT_OUT;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--limit") {
      const v = Number(argv[i + 1]);
      limit = Number.isFinite(v) && v > 0 ? Math.floor(v) : null;
      i += 1;
    } else if (a.startsWith("--limit=")) {
      const v = Number(a.split("=")[1]);
      limit = Number.isFinite(v) && v > 0 ? Math.floor(v) : null;
    } else if (a === "--out") {
      out = argv[i + 1] ?? out;
      i += 1;
    } else if (a.startsWith("--out=")) {
      out = a.split("=")[1] ?? out;
    }
  }
  return { limit, out };
}

// ---------------------------------------------------------------------------
// Answer engine driver
// ---------------------------------------------------------------------------

async function runAsk(question: string): Promise<CollectedAnswer> {
  let answer = "";
  let sources: AskSource[] = [];
  let coverageReport: unknown = null;

  const stream = askIntelligence(question, {
    tenantId: MERIDIAN.tenantId,
    tenantClientKey: MERIDIAN.clientKey,
    tenantInventoryKey: MERIDIAN.inventoryKey,
    userId: MERIDIAN.userId,
  });

  for await (const ev of stream) {
    if (ev.type === "delta" && typeof ev.text === "string") {
      answer += ev.text;
    } else if (ev.type === "sources") {
      if (Array.isArray(ev.sources)) sources = ev.sources;
      if (ev.coverageReport !== undefined) coverageReport = ev.coverageReport;
    } else if (ev.type === "error") {
      throw new Error(ev.error ?? "askIntelligence emitted error event");
    }
  }

  return {
    answer: answer.trim(),
    sources: sources.map((s) => ({
      type: s.type,
      name: s.name,
      id: s.id,
      confidence: typeof s.confidence === "number" ? s.confidence : null,
    })),
    sourceCount: sources.length,
    coverageReport,
  };
}

// ---------------------------------------------------------------------------
// Claude judge (qualitative dimensions)
// ---------------------------------------------------------------------------

const JUDGE_RUBRIC = `You are a STRICT evaluator of an AI advisory answer produced for Meridian Health
(a 1.4M-lives integrated payer/provider) by an executive intelligence agent named Sentinel.

Score ONLY these dimensions, each an integer 0-5 (0 = absent/wrong, 5 = excellent):
- specificity: concrete, Meridian-/healthcare-specific claims vs. generic boilerplate. Penalize vague consultant-speak.
- executive_clarity: a CXO can read it once and act. Penalize rambling, hedging, or burying the lede.
- next_action_quality: are the recommended next steps concrete, sequenced, and owned? Penalize "consider exploring" filler.
- missing_evidence_honesty: does it openly flag what it does NOT have (baselines, data, evidence) rather than bluffing? Reward calibrated honesty; penalize fabricated certainty AND penalize over-refusal that dodges the question.
- clinical_regulatory_caution: for clinical/PHI/regulatory topics, does it apply appropriate caution (HITL, BAA, PHI handling, model risk, attestation)? If the question is non-clinical, score 5 if nothing reckless is asserted.
- value_model_rigor: for value/ROI/financial questions, is the value logic sound (baseline -> driver -> mechanism -> guardrail) rather than unsupported dollar claims? If the question is not financial, score 5 unless it makes a bogus quantified claim.

Return STRICT JSON ONLY, no prose, exactly:
{"specificity":N,"executive_clarity":N,"next_action_quality":N,"missing_evidence_honesty":N,"clinical_regulatory_caution":N,"value_model_rigor":N}`;

interface JudgeResult {
  scores: Partial<Record<ScoreDimension, number>>;
  ok: boolean;
  note?: string;
}

function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function judgeAnswer(
  q: QaQuestion,
  collected: CollectedAnswer,
): Promise<JudgeResult> {
  const prompt = [
    JUDGE_RUBRIC,
    "",
    `ROLE: ${q.role}`,
    `CATEGORY: ${q.category}`,
    `QUESTION: ${q.question}`,
    "",
    `SOURCE COUNT: ${collected.sourceCount}`,
    `SOURCE TYPES: ${collected.sources.map((s) => s.type).join(", ") || "(none)"}`,
    "",
    "ANSWER:",
    collected.answer.slice(0, 6000),
  ].join("\n");

  try {
    const { client } = await getAuditedAnthropicClient({
      tenantId: MERIDIAN.tenantId,
      userId: MERIDIAN.userId,
      workflow: "meridian-qa-judge",
      model: JUDGE_MODEL,
      prompt,
      dataClass: "confidential",
    });

    const response = await client.messages.create({
      model: JUDGE_MODEL,
      max_tokens: JUDGE_MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");

    const parsed = extractJson(text);
    if (!parsed) {
      return {
        scores: {},
        ok: false,
        note: "judge returned non-JSON; deterministic-only",
      };
    }

    const scores: Partial<Record<ScoreDimension, number>> = {};
    for (const dim of JUDGE_DIMENSIONS) {
      scores[dim] = normalizeJudgeScore(parsed[dim]);
    }
    return { scores, ok: true };
  } catch (err) {
    // Fail-open: keep deterministic scores, record the reason.
    return {
      scores: {},
      ok: false,
      note: `judge error (fail-open): ${(err as Error).message}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Per-question scoring
// ---------------------------------------------------------------------------

async function scoreQuestion(q: QaQuestion): Promise<ScoredRow> {
  const notes: string[] = [];
  let collected: CollectedAnswer;
  try {
    collected = await runAsk(q.question);
  } catch (err) {
    const empty = Object.fromEntries(
      SCORE_DIMENSIONS.map((d) => [d, 0]),
    ) as Record<ScoreDimension, number>;
    return {
      id: q.id,
      category: q.category,
      role: q.role,
      question: q.question,
      answer: "",
      sourceCount: 0,
      sourceTypes: {},
      sourceBuckets: { tenant: 0, pattern: 0, inference: 0 },
      scores: empty,
      overall: 0,
      judgeOk: false,
      notes: [`ask error: ${(err as Error).message}`],
      error: (err as Error).message,
    };
  }

  const det = scoreDeterministic({
    answer: collected.answer,
    sources: collected.sources,
  });
  const judge = await judgeAnswer(q, collected);
  if (judge.note) notes.push(judge.note);

  // Merge: deterministic dims win for their six; judge dims filled from judge,
  // falling back to a neutral 0 with a note when the judge failed open.
  const scores = {} as Record<ScoreDimension, number>;
  for (const dim of SCORE_DIMENSIONS) {
    if (dim in det) {
      scores[dim] = (det as Record<string, number>)[dim];
    } else if (judge.ok && dim in judge.scores) {
      scores[dim] = judge.scores[dim] ?? 0;
    } else {
      scores[dim] = 0; // judge unavailable -> conservative 0, flagged via notes
    }
  }

  const sourceTypes: Record<string, number> = {};
  for (const s of collected.sources) {
    const t = (s.type ?? "UNKNOWN").toUpperCase();
    sourceTypes[t] = (sourceTypes[t] ?? 0) + 1;
  }

  return {
    id: q.id,
    category: q.category,
    role: q.role,
    question: q.question,
    answer: collected.answer.slice(0, ANSWER_TRUNCATE),
    sourceCount: collected.sourceCount,
    sourceTypes,
    sourceBuckets: countSourceBuckets(collected.sources),
    scores,
    overall: computeOverall(scores),
    judgeOk: judge.ok,
    notes,
  };
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function recommendFix(row: ScoredRow): string {
  const weak = SCORE_DIMENSIONS.filter((d) => row.scores[d] <= 2);
  const fixes: string[] = [];
  if (row.error)
    return `Answer engine errored (${row.error}); fix retrieval/runtime before re-scoring.`;
  if (weak.includes("citation_presence"))
    fixes.push(
      "No sources returned — investigate retriever coverage / segment gating for this category.",
    );
  if (weak.includes("healthcare_corpus_usage"))
    fixes.push(
      "Healthcare PATTERN-class corpus not surfacing — add/seed domain patterns + benchmarks for this topic.",
    );
  if (weak.includes("meridian_context_usage"))
    fixes.push(
      "No Meridian TENANT/GRAPH facts used — verify enterprise_context_* + graph segments are retrievable for this question.",
    );
  if (weak.includes("no_raw_id_leakage"))
    fixes.push(
      "Raw id / uuid / tmp path / internal table name leaked into the answer — tighten citation renderer / sanitization.",
    );
  if (weak.includes("no_cross_tenant_leakage"))
    fixes.push(
      "Foreign tenant name leaked — strengthen tenant-pin / cross-tenant isolation.",
    );
  if (weak.includes("citation_correctness"))
    fixes.push(
      "Cited sources missing usable names — fix source-name population so citations render.",
    );
  if (weak.includes("missing_evidence_honesty"))
    fixes.push(
      "Answer bluffs or over-refuses on missing evidence — calibrate the partial-evidence policy / advisory.",
    );
  if (weak.includes("value_model_rigor"))
    fixes.push(
      "Weak value logic — require baseline->driver->mechanism->guardrail before any ROI claim.",
    );
  if (weak.includes("clinical_regulatory_caution"))
    fixes.push(
      "Insufficient clinical/regulatory caution — inject HITL/PHI/BAA/model-risk guardrails for clinical topics.",
    );
  if (
    weak.includes("specificity") ||
    weak.includes("executive_clarity") ||
    weak.includes("next_action_quality")
  )
    fixes.push(
      "Generic / unclear / weak next-actions — strengthen synthesizer prompt for concrete, sequenced, owned recommendations.",
    );
  return fixes.length
    ? fixes.join(" ")
    : "Minor — review weak dimensions individually.";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function categoryAverages(
  rows: ScoredRow[],
): Array<{ category: string; avg: number; n: number }> {
  const byCat = new Map<string, number[]>();
  for (const r of rows) {
    const arr = byCat.get(r.category) ?? [];
    arr.push(r.overall);
    byCat.set(r.category, arr);
  }
  return [...byCat.entries()]
    .map(([category, vals]) => ({
      category,
      n: vals.length,
      avg:
        Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100,
    }))
    .sort((a, b) => a.avg - b.avg);
}

function dimensionAverages(
  rows: ScoredRow[],
): Array<{ dim: ScoreDimension; avg: number }> {
  return SCORE_DIMENSIONS.map((dim) => {
    const vals = rows.map((r) => r.scores[dim]);
    return {
      dim,
      avg: vals.length
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) /
          100
        : 0,
    };
  });
}

function buildScorecardHtml(rows: ScoredRow[]): string {
  const overall =
    rows.length === 0
      ? 0
      : Math.round(
          (rows.reduce((a, r) => a + r.overall, 0) / rows.length) * 100,
        ) / 100;
  const catAvgs = categoryAverages(rows);
  const dimAvgs = dimensionAverages(rows);
  const judgeFailures = rows.filter((r) => !r.judgeOk).length;

  const weakest = [...rows].sort((a, b) => a.overall - b.overall).slice(0, 15);

  const dimHeaderCells = SCORE_DIMENSIONS.map(
    (d) => `<th title="${d}">${d.replace(/_/g, " ").slice(0, 14)}</th>`,
  ).join("");

  const tableRows = rows
    .map((r, i) => {
      const dimCells = SCORE_DIMENSIONS.map((d) => {
        const v = r.scores[d];
        const cls = v <= 2 ? "bad" : v >= 4 ? "good" : "mid";
        return `<td class="${cls}">${v}</td>`;
      }).join("");
      return `<tr data-overall="${r.overall}" data-sources="${r.sourceCount}">
        <td>${i + 1}</td>
        <td>${escapeHtml(r.id)}</td>
        <td>${escapeHtml(r.category)}</td>
        <td class="overall">${r.overall.toFixed(2)}</td>
        <td>${r.sourceCount}</td>
        <td>${r.sourceBuckets.tenant}/${r.sourceBuckets.pattern}/${r.sourceBuckets.inference}</td>
        ${dimCells}
      </tr>`;
    })
    .join("\n");

  const weakSections = weakest
    .map((r) => {
      const failing = SCORE_DIMENSIONS.filter((d) => r.scores[d] <= 2);
      return `<div class="weak">
        <h3>${escapeHtml(r.id)} · ${escapeHtml(r.category)} · overall ${r.overall.toFixed(2)}</h3>
        <p class="q"><strong>Q:</strong> ${escapeHtml(r.question)}</p>
        <p class="a"><strong>A:</strong> ${escapeHtml(r.answer.slice(0, 600))}${r.answer.length > 600 ? "…" : ""}</p>
        <p class="dims"><strong>Failing dims (&le;2):</strong> ${failing.map((d) => escapeHtml(d)).join(", ") || "(none individually, low across board)"}</p>
        <p class="fix"><strong>Recommended fix:</strong> ${escapeHtml(recommendFix(r))}</p>
        ${r.notes.length ? `<p class="notes"><em>${escapeHtml(r.notes.join(" | "))}</em></p>` : ""}
      </div>`;
    })
    .join("\n");

  const catRows = catAvgs
    .map(
      (c) =>
        `<tr><td>${escapeHtml(c.category)}</td><td>${c.n}</td><td class="${c.avg < 3 ? "bad" : c.avg >= 4 ? "good" : "mid"}">${c.avg.toFixed(2)}</td></tr>`,
    )
    .join("\n");

  const dimRows = dimAvgs
    .map(
      (d) =>
        `<tr><td>${escapeHtml(d.dim)}</td><td class="${d.avg < 3 ? "bad" : d.avg >= 4 ? "good" : "mid"}">${d.avg.toFixed(2)}</td></tr>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>Meridian Sentinel — Evidence QA Scorecard</title>
<style>
  :root { --bg:#F8F7F4; --ink:#1a1a1a; --line:#e3e0d8; }
  body { background:var(--bg); color:var(--ink); font-family:"DM Sans",system-ui,sans-serif; margin:0; padding:32px; }
  h1 { font-family:Georgia,serif; font-weight:normal; font-size:28px; margin:0 0 4px; }
  h2 { font-family:Georgia,serif; font-weight:normal; font-size:20px; margin:32px 0 12px; }
  .meta { color:#666; font-size:13px; margin-bottom:24px; }
  .kpis { display:flex; gap:24px; margin:16px 0 8px; flex-wrap:wrap; }
  .kpi { background:#fff; border:1px solid var(--line); border-radius:8px; padding:14px 20px; }
  .kpi .v { font-size:30px; font-family:Georgia,serif; }
  .kpi .l { font-size:12px; color:#666; text-transform:uppercase; letter-spacing:.05em; }
  table { border-collapse:collapse; width:100%; font-size:12px; background:#fff; }
  th,td { border:1px solid var(--line); padding:5px 7px; text-align:left; }
  th { background:#efece4; cursor:pointer; position:sticky; top:0; white-space:nowrap; }
  td.overall { font-weight:bold; }
  td.bad { background:#fbe3e3; } td.mid { background:#fdf6e3; } td.good { background:#e6f4ea; }
  .weak { background:#fff; border:1px solid var(--line); border-left:4px solid #c0392b; border-radius:6px; padding:12px 16px; margin:12px 0; }
  .weak h3 { margin:0 0 6px; font-size:15px; font-family:Georgia,serif; font-weight:normal; }
  .weak p { margin:4px 0; font-size:13px; line-height:1.45; }
  .weak .fix { color:#7a1f12; }
  .legend { font-size:12px; color:#666; }
  .scroll { overflow-x:auto; }
</style></head>
<body>
  <h1>Meridian Sentinel — Evidence QA Scorecard</h1>
  <div class="meta">Tenant ${MERIDIAN.clientKey} (${MERIDIAN.inventoryKey}) · ${rows.length} questions · 12 dimensions (0-5) · judge: ${JUDGE_MODEL} · judge fail-open count: ${judgeFailures}</div>

  <div class="kpis">
    <div class="kpi"><div class="v">${overall.toFixed(2)}</div><div class="l">Overall avg</div></div>
    <div class="kpi"><div class="v">${rows.filter((r) => r.overall >= 4).length}</div><div class="l">Strong (&ge;4)</div></div>
    <div class="kpi"><div class="v">${rows.filter((r) => r.overall < 3).length}</div><div class="l">Weak (&lt;3)</div></div>
    <div class="kpi"><div class="v">${rows.filter((r) => r.sourceCount === 0).length}</div><div class="l">Zero-source answers</div></div>
  </div>

  <h2>Per-category averages (worst first)</h2>
  <table><thead><tr><th>Category</th><th>N</th><th>Overall avg</th></tr></thead><tbody>${catRows}</tbody></table>

  <h2>Per-dimension averages</h2>
  <table><thead><tr><th>Dimension</th><th>Avg (0-5)</th></tr></thead><tbody>${dimRows}</tbody></table>

  <h2>All answers <span class="legend">(click a header to sort; source col = tenant/pattern/inference)</span></h2>
  <div class="scroll">
  <table id="grid"><thead><tr>
    <th>#</th><th>ID</th><th>Category</th><th>Overall</th><th>Src</th><th>T/P/I</th>${dimHeaderCells}
  </tr></thead><tbody>
  ${tableRows}
  </tbody></table>
  </div>

  <h2>Top-15 weakest answers</h2>
  ${weakSections}

  <script>
  (function(){
    var grid=document.getElementById('grid');
    var ths=grid.tHead.rows[0].cells;
    for(var c=0;c<ths.length;c++){(function(col){ths[col].addEventListener('click',function(){
      var tb=grid.tBodies[0];var rows=[].slice.call(tb.rows);
      var asc=ths[col].dataset.asc!=='1';ths[col].dataset.asc=asc?'1':'0';
      rows.sort(function(a,b){var x=a.cells[col].textContent.trim(),y=b.cells[col].textContent.trim();
        var nx=parseFloat(x),ny=parseFloat(y);
        if(!isNaN(nx)&&!isNaN(ny)){return asc?nx-ny:ny-nx;}
        return asc?x.localeCompare(y):y.localeCompare(x);});
      rows.forEach(function(r){tb.appendChild(r);});
    });})(c);}
  })();
  </script>
</body></html>`;
}

function buildRecommendedFixes(rows: ScoredRow[]): string {
  const dimAvgs = dimensionAverages(rows);
  const catAvgs = categoryAverages(rows);
  const zeroSource = rows.filter((r) => r.sourceCount === 0);
  const noPattern = rows.filter((r) => r.sourceBuckets.pattern === 0);
  const noTenant = rows.filter((r) => r.sourceBuckets.tenant === 0);
  const leaks = rows.filter(
    (r) =>
      r.scores.no_raw_id_leakage < 5 || r.scores.no_cross_tenant_leakage < 5,
  );
  const errored = rows.filter((r) => r.error);

  const lines: string[] = [];
  lines.push("# Meridian Sentinel — Recommended Systemic Fixes");
  lines.push("");
  lines.push(
    `Generated by \`src/scripts/qa/meridian-sentinel-qa.ts\` over ${rows.length} questions (Meridian tenancy).`,
  );
  lines.push("");
  lines.push("## Weakest dimensions (corpus-wide averages, 0-5)");
  for (const d of [...dimAvgs].sort((a, b) => a.avg - b.avg).slice(0, 6)) {
    lines.push(`- **${d.dim}**: ${d.avg.toFixed(2)}`);
  }
  lines.push("");
  lines.push("## Weakest categories");
  for (const c of catAvgs.slice(0, 5)) {
    lines.push(`- **${c.category}** (n=${c.n}): ${c.avg.toFixed(2)}`);
  }
  lines.push("");
  lines.push("## Systemic gaps observed");
  if (errored.length)
    lines.push(
      `- **Answer-engine errors (${errored.length})**: retrieval/runtime failed for: ${errored.map((r) => r.id).join(", ")}. Fix before re-scoring.`,
    );
  if (zeroSource.length)
    lines.push(
      `- **Zero-source answers (${zeroSource.length})**: ${zeroSource.map((r) => r.id).join(", ")}. Retriever returns nothing for these — investigate segment gating / coverage.`,
    );
  if (noPattern.length)
    lines.push(
      `- **Healthcare corpus not surfacing (${noPattern.length} answers with 0 PATTERN-class sources)**: e.g. ${noPattern
        .slice(0, 12)
        .map((r) => r.id)
        .join(
          ", ",
        )}. Seed/route domain patterns + benchmarks (payer, RCM, clinical) so corpus evidence appears.`,
    );
  if (noTenant.length)
    lines.push(
      `- **Meridian facts not used (${noTenant.length} answers with 0 TENANT/GRAPH sources)**: e.g. ${noTenant
        .slice(0, 12)
        .map((r) => r.id)
        .join(
          ", ",
        )}. Confirm enterprise_context_* + graph segments are retrievable for these question shapes.`,
    );
  if (leaks.length)
    lines.push(
      `- **Leakage (${leaks.length})**: raw-id or cross-tenant leakage detected in: ${leaks.map((r) => r.id).join(", ")}. Tighten citation sanitization / tenant-pin.`,
    );
  lines.push("");
  lines.push("## Per-question recommended fixes (overall < 3.0)");
  for (const r of rows
    .filter((x) => x.overall < 3)
    .sort((a, b) => a.overall - b.overall)) {
    lines.push(`- **${r.id}** (${r.overall.toFixed(2)}): ${recommendFix(r)}`);
  }
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { limit, out } = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(process.cwd(), out);
  const questionsPath = path.join(outDir, QUESTIONS_FILE);

  const raw = await fs.readFile(questionsPath, "utf8");
  const parsed = JSON.parse(raw) as QaQuestionsFile;
  let questions = parsed.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error(`No questions found in ${questionsPath}`);
  }
  if (limit) questions = questions.slice(0, limit);

  console.log(
    `[qa] scoring ${questions.length} questions for ${MERIDIAN.clientKey} → ${outDir}`,
  );

  const rows: ScoredRow[] = [];
  const jsonlPath = path.join(outDir, "qa-results.jsonl");
  await fs.writeFile(jsonlPath, "", "utf8"); // truncate

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    const row = await scoreQuestion(q);
    rows.push(row);
    await fs.appendFile(
      jsonlPath,
      JSON.stringify({
        id: row.id,
        category: row.category,
        role: row.role,
        answer: row.answer,
        sourceCount: row.sourceCount,
        sourceTypes: row.sourceTypes,
        sourceBuckets: row.sourceBuckets,
        scores: row.scores,
        overall: row.overall,
        judgeOk: row.judgeOk,
        notes: row.notes,
        ...(row.error ? { error: row.error } : {}),
      }) + "\n",
      "utf8",
    );

    console.log(
      `[qa] ${i + 1}/${questions.length} ${row.id} overall=${row.overall.toFixed(2)} src=${row.sourceCount}${row.judgeOk ? "" : " (judge fail-open)"}`,
    );
  }

  const html = buildScorecardHtml(rows);
  await fs.writeFile(path.join(outDir, "qa-scorecard.html"), html, "utf8");

  const fixes = buildRecommendedFixes(rows);
  await fs.appendFile(
    path.join(outDir, "recommended-fixes.md"),
    fixes + "\n",
    "utf8",
  );

  const overall =
    rows.length === 0
      ? 0
      : Math.round(
          (rows.reduce((a, r) => a + r.overall, 0) / rows.length) * 100,
        ) / 100;

  console.log(
    `[qa] DONE. overall avg=${overall.toFixed(2)} · results=${jsonlPath} · scorecard=${path.join(outDir, "qa-scorecard.html")}`,
  );
}

main().catch((err) => {
  console.error("[qa] FATAL", err);
  process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * The EnterpriseThesis: one whole-enterprise reasoning pass, built once and inherited by every
 * Home chapter that reads it downstream.
 *
 * This sits after the deterministic layers (decision context → quality manifest → signal packet)
 * and before any chapter is written. Its entire reason to exist is the finding from the first
 * design pass at this problem: a model asked to reason over 4,026 undifferentiated records has no
 * way to know which sixty of them matter, and a model asked to write eight independent chapters
 * without a shared spine produces eight disconnected mini-essays that happen to describe the same
 * company. This call sees the whole signal packet once, is asked to find the smallest set of ideas
 * that explain the enterprise, and that structured output becomes the one thing every chapter
 * writer downstream is required to stay consistent with.
 *
 * What makes this call different from every other generation call built this session — the
 * six-block orientation pack, the per-dimension insights — is that those were asked to *describe*
 * a narrow slice and validated by literal substring matching. This call is asked to *synthesize*
 * across the whole packet, and substring matching cannot validate a synthesized claim: "the number
 * 407 appears somewhere in the packet" proves nothing about whether the sentence connecting it to
 * three other numbers is actually true. That is why this file also carries a second, adversarial
 * verification call — not deferred to a later iteration, because this is the surface that makes
 * the strongest connected claims Home will show, and it is the one place a plausible-sounding but
 * unsupported synthesis would do the most damage if it shipped unverified.
 *
 * Usage:
 *   npx tsx scripts/data-build/build-enterprise-thesis.ts [--tenant <key>] [--out-dir <dir>]
 *
 * Dry-run by default. Writes only with THESIS_WRITE=true and THESIS_WRITE_APPROVED=true.
 * Requires ANTHROPIC_API_KEY to generate; without it, the deterministic layers still build and
 * are written to the output directory, with no thesis attempted.
 */

import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { Client } from "pg";

import { buildCanonicalTenantDataReport } from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";
import {
  buildDecisionContext,
  buildContextQualityManifest,
  buildEnterpriseSignalPacket,
  type Signal,
} from "./enterprise-signal-packet";

const TENANTS = (() => {
  const i = process.argv.indexOf("--tenant");
  return i > -1 ? [process.argv[i + 1]] : ["meridian-health", "skyharbor-air"];
})();
const OUT_DIR = (() => {
  const i = process.argv.indexOf("--out-dir");
  return i > -1 ? process.argv[i + 1] : "/tmp/enterprise-thesis";
})();
const WRITE = process.env.THESIS_WRITE === "true" && process.env.THESIS_WRITE_APPROVED === "true";
const CLAUDE_MODEL = "claude-sonnet-5";
const ARTIFACT_TYPE = "NexusEnterpriseThesisV1";

/**
 * Contracts with document-level extraction, per tenant. Not derivable from canonical -- that
 * evidence lives in a separate root that never merges into the canonical vendor_contract object.
 * Named explicitly here, the same way the golden-evidence loaders name their own contract scope.
 */
const GOLDEN_EVIDENCE_CONTRACTS: Record<string, string[]> = {
  "skyharbor-air": ["Vantage", "Northgate"],
  "meridian-health": [],
};

/* ------------------------------------------------------------------------------------------------
 * Thesis shape
 * ---------------------------------------------------------------------------------------------- */

/** Every substantive claim in the thesis takes this shape. Nothing floats free of its evidence. */
export interface GroundedClaim {
  statement: string;
  evidence_ids: string[];
  confidence: "low" | "medium" | "high";
}

export interface EnterpriseThesis {
  enterprise_story: string;
  value_creation_model: {
    summary: string;
    primary_value_drivers: string[];
    economic_dependencies: string[];
    evidence_ids: string[];
  };
  strategic_bets: GroundedClaim[];
  structural_constraints: GroundedClaim[];
  operating_tensions: GroundedClaim[];
  leadership_consensus: GroundedClaim[];
  leadership_disagreements: GroundedClaim[];
  performance_story: {
    where_improving: GroundedClaim[];
    where_off_track: GroundedClaim[];
    where_unknown: GroundedClaim[];
  };
  technology_and_data_implications: GroundedClaim[];
  material_risks: GroundedClaim[];
  value_realization_tensions: GroundedClaim[];
  evidence_gaps: string[];
  things_a_new_cxo_should_know: GroundedClaim[];
  questions_for_management: string[];
}

/* ------------------------------------------------------------------------------------------------
 * The prompt
 * ---------------------------------------------------------------------------------------------- */

const SYSTEM_PROMPT = `You are not writing Home-page copy yet. You are constructing the internal enterprise
thesis that every Abarva Home narrative will inherit.

Act as the senior strategy partner responsible for briefing a newly appointed CEO or CXO before
their first executive-team meetings.

You have been given a governed enterprise context packet containing deterministic facts, valid
canonical relationships, leadership perspectives, precomputed material signals, evidence quality,
and coverage limitations. Every signal in the packet carries an id (sig_XXX) and the names of the
records that produced it.

Your objective is to determine the smallest set of ideas that best explain how this enterprise
works, where value is created, what management is trying to change, what is helping or constraining
that change, where leadership perceptions and system evidence diverge, and what deserves executive
attention.

Do not summarize datasets or dimensions individually. Build a single coherent theory of the
enterprise.

A strong thesis connects multiple domains. Seek connections such as:
strategy <-> economics <-> portfolio
operating model <-> performance <-> technology
technology <-> spend <-> vendor dependency
data <-> operational capability <-> transformation
leadership perspective <-> system evidence
risk <-> capability <-> system <-> owner
investment <-> expected value <-> measured outcome

EVIDENCE DISCIPLINE
- The signals and facts in the packet are authoritative. Never recompute a number that appears
  there; quote it exactly.
- Every claim you make must carry evidence_ids citing the specific signals it draws on. A claim
  with no evidence_ids will be discarded before a person ever sees it.
- Leadership perspectives are perspectives, not enterprise facts. Say so.
- Never translate an enterprise-wide leadership theme into program-specific sentiment unless a
  signal in the packet explicitly resolves that specific link. The packet tells you the resolution
  rate for that link; if it is low, say the theme is enterprise-wide and stop there.
- Coverage limitations are part of the analysis, not a footnote. Sparse evidence must reduce your
  stated confidence, not be omitted.
- Data-quality defects (missing baselines, inconsistent notation, unlinked evidence) are not
  performance results. Never characterize a measurement gap as good or bad performance.
- Do not use an industry benchmark for an industry other than the one stated in the packet.
- Never state that two facts are causally related merely because they coexist in the packet.
- A "candidate relationship" in the packet, if present, is explicitly not client-attested and must
  never be presented as a fact.

ANALYTICAL STANDARD
Prioritize materiality over completeness. Do not mention something merely because a signal exists
for it — the packet has already filtered for materiality; your job is synthesis across what
survived that filter, not further summary of it.

Look specifically for: concentration, fragmentation, dependencies, duplication, strategic tension,
investment/outcome gaps, transformation load, structural complexity, leadership consensus,
leadership disagreement, execution risk, evidence gaps, and emerging opportunity.

Each major thesis statement should connect at least two domains from the list above; the strongest
connect three or more. Write like an adviser who has studied this enterprise closely — not like a
reporting engine describing a database.

Output strict JSON matching the schema you are given. No prose outside the JSON.`;

function buildUserPrompt(signalPacket: ReturnType<typeof buildEnterpriseSignalPacket>): string {
  return (
    `Build the EnterpriseThesis for this enterprise from the governed context packet below. ` +
    `Every claim needs evidence_ids from the signals list. Return JSON matching this shape exactly:\n\n` +
    JSON.stringify(
      {
        enterprise_story: "string, 120-180 words",
        value_creation_model: { summary: "string", primary_value_drivers: ["string"], economic_dependencies: ["string"], evidence_ids: ["sig_xxx"] },
        strategic_bets: [{ statement: "string", evidence_ids: ["sig_xxx"], confidence: "low|medium|high" }],
        structural_constraints: [{ statement: "string", evidence_ids: ["sig_xxx"], confidence: "low|medium|high" }],
        operating_tensions: [{ statement: "string", evidence_ids: ["sig_xxx"], confidence: "low|medium|high" }],
        leadership_consensus: [{ statement: "string", evidence_ids: ["sig_xxx"], confidence: "low|medium|high" }],
        leadership_disagreements: [{ statement: "string", evidence_ids: ["sig_xxx"], confidence: "low|medium|high" }],
        performance_story: {
          where_improving: [{ statement: "string", evidence_ids: ["sig_xxx"], confidence: "low|medium|high" }],
          where_off_track: [{ statement: "string", evidence_ids: ["sig_xxx"], confidence: "low|medium|high" }],
          where_unknown: [{ statement: "string", evidence_ids: ["sig_xxx"], confidence: "low|medium|high" }],
        },
        technology_and_data_implications: [{ statement: "string", evidence_ids: ["sig_xxx"], confidence: "low|medium|high" }],
        material_risks: [{ statement: "string", evidence_ids: ["sig_xxx"], confidence: "low|medium|high" }],
        value_realization_tensions: [{ statement: "string", evidence_ids: ["sig_xxx"], confidence: "low|medium|high" }],
        evidence_gaps: ["string"],
        things_a_new_cxo_should_know: [{ statement: "string", evidence_ids: ["sig_xxx"], confidence: "low|medium|high" }],
        questions_for_management: ["string"],
      },
      null,
      2,
    ) +
    `\n\nGoverned context packet:\n` +
    JSON.stringify(signalPacket, null, 2)
  );
}

/* ------------------------------------------------------------------------------------------------
 * Structural validation — cheap, automatic, runs on every claim before anything else does
 * ---------------------------------------------------------------------------------------------- */

interface StructuralIssue {
  path: string;
  reason: string;
}

/**
 * Every evidence_id cited must exist in the packet, and a claim calling itself an "insight" in
 * spirit (i.e. every GroundedClaim here) must draw on signals spanning at least two domains,
 * exactly the bar the user's own prompt sets for what counts as a real connection rather than a
 * restatement of one signal in different words. Both are free to check because the signal packet
 * already carries each signal's `domains` — this function does not re-derive anything, only looks
 * up what the compiler already computed.
 */
export function validateStructure(thesis: EnterpriseThesis, signalPacket: ReturnType<typeof buildEnterpriseSignalPacket>): StructuralIssue[] {
  const issues: StructuralIssue[] = [];
  const byId = new Map<string, Signal>(signalPacket.signals.map((s) => [s.id, s]));

  function checkClaim(path: string, claim: GroundedClaim) {
    if (claim.evidence_ids.length === 0) {
      issues.push({ path, reason: "no evidence_ids cited" });
      return;
    }
    const domains = new Set<string>();
    for (const evId of claim.evidence_ids) {
      const sig = byId.get(evId);
      if (!sig) {
        issues.push({ path, reason: `cites unknown evidence id: ${evId}` });
        continue;
      }
      sig.domains.forEach((d) => domains.add(d));
    }
    if (domains.size < 2) {
      issues.push({ path, reason: `claim spans only ${domains.size} domain(s), below the two-domain bar for a real connection` });
    }
  }

  thesis.strategic_bets.forEach((c, i) => checkClaim(`strategic_bets[${i}]`, c));
  thesis.structural_constraints.forEach((c, i) => checkClaim(`structural_constraints[${i}]`, c));
  thesis.operating_tensions.forEach((c, i) => checkClaim(`operating_tensions[${i}]`, c));
  thesis.leadership_consensus.forEach((c, i) => checkClaim(`leadership_consensus[${i}]`, c));
  thesis.leadership_disagreements.forEach((c, i) => checkClaim(`leadership_disagreements[${i}]`, c));
  thesis.performance_story.where_improving.forEach((c, i) => checkClaim(`performance_story.where_improving[${i}]`, c));
  thesis.performance_story.where_off_track.forEach((c, i) => checkClaim(`performance_story.where_off_track[${i}]`, c));
  thesis.technology_and_data_implications.forEach((c, i) => checkClaim(`technology_and_data_implications[${i}]`, c));
  thesis.material_risks.forEach((c, i) => checkClaim(`material_risks[${i}]`, c));
  thesis.value_realization_tensions.forEach((c, i) => checkClaim(`value_realization_tensions[${i}]`, c));
  thesis.things_a_new_cxo_should_know.forEach((c, i) => checkClaim(`things_a_new_cxo_should_know[${i}]`, c));

  return issues;
}

/* ------------------------------------------------------------------------------------------------
 * Entailment verification — the part that structural checks cannot do
 *
 * A structural check proves every cited evidence_id is real and spans two domains. It cannot prove
 * the claim's SENTENCE actually follows from what those signals say — a model can cite two genuine
 * signal ids next to a connection between them that isn't actually supported by either. That gap
 * is why this exists, and why it runs in V1 rather than being deferred: this is the surface making
 * the strongest synthesized claims Home will show a reader, which is exactly where an unverified
 * plausible-sounding connection would do the most damage.
 *
 * The verifier call is deliberately blind to everything except the claim and its own cited
 * evidence -- it never sees the rest of the thesis, the rest of the packet, or the reasoning that
 * produced the claim. That is the same "narrow is safer" discipline the orientation-pack
 * generator uses, applied to checking instead of writing.
 * ---------------------------------------------------------------------------------------------- */

type Verdict = "SUPPORTED" | "PARTIALLY_SUPPORTED" | "UNSUPPORTED" | "OVERSTATED";

const VERIFIER_SYSTEM_PROMPT = `You are a skeptical fact-checker. You will be given a claim and a list of
facts. Your only job is to decide whether the claim follows from exactly those facts and nothing else.

Return one of:
SUPPORTED — every part of the claim is directly stated or is a direct, unambiguous consequence of the facts.
PARTIALLY_SUPPORTED — some of the claim follows from the facts, but part of it goes beyond what they state.
UNSUPPORTED — the claim does not follow from the facts at all.
OVERSTATED — the claim's direction is right but its strength, certainty, or scope exceeds the facts (e.g. the facts show a correlation and the claim asserts causation, or the facts describe two of something and the claim implies a pattern).

Default to UNSUPPORTED or OVERSTATED when uncertain. A missed real insight costs a sentence. A
false pass costs a fabricated claim reaching an executive.

Respond with strict JSON: { "verdict": "...", "reasoning": "one sentence" }`;

async function verifyClaim(
  client: Parameters<typeof callClaude>[0],
  claim: GroundedClaim,
  signalPacket: ReturnType<typeof buildEnterpriseSignalPacket>,
): Promise<{ verdict: Verdict; reasoning: string }> {
  const byId = new Map(signalPacket.signals.map((s) => [s.id, s]));
  const facts = claim.evidence_ids.map((id) => byId.get(id)?.statement).filter(Boolean);
  if (facts.length === 0) return { verdict: "UNSUPPORTED", reasoning: "no resolvable evidence ids" };

  const userPrompt =
    `Claim:\n${claim.statement}\n\nFacts (this is all you may use):\n` +
    facts.map((f, i) => `${i + 1}. ${f}`).join("\n");

  // 200 tokens produced the same empty-text failure as the main thesis call, for the same reason:
  // the diagnostic logging added after the first run showed stop_reason=max_tokens with only a
  // "thinking" content block and zero output tokens spent on visible text -- the model's internal
  // reasoning consumed the entire budget before it could write the one-sentence verdict. 3072
  // gives comfortable headroom above the observed failure point rather than the minimum that
  // might clear it -- a second budget-too-small cycle on the same call costs a full deploy, and
  // the marginal cost of extra unused headroom on a short classification response is negligible.
  const result = await callClaude(client, VERIFIER_SYSTEM_PROMPT, userPrompt, 3072);
  if (!result) return { verdict: "UNSUPPORTED", reasoning: "verifier call failed" };
  try {
    const parsed = JSON.parse(result.text) as { verdict: Verdict; reasoning: string };
    return parsed;
  } catch {
    return { verdict: "UNSUPPORTED", reasoning: "verifier returned non-JSON" };
  }
}

/** Claim categories verified in V1 — the highest-stakes surfaces, per the standing instruction not
 * to defer entailment checking on Executive Brief / What Needs Attention material. Not every array
 * needs this cost; these are the ones carrying the strongest synthesized, cross-domain claims. */
function claimsRequiringVerification(thesis: EnterpriseThesis): Array<{ path: string; claim: GroundedClaim }> {
  const out: Array<{ path: string; claim: GroundedClaim }> = [];
  thesis.strategic_bets.forEach((c, i) => out.push({ path: `strategic_bets[${i}]`, claim: c }));
  thesis.operating_tensions.forEach((c, i) => out.push({ path: `operating_tensions[${i}]`, claim: c }));
  thesis.material_risks.forEach((c, i) => out.push({ path: `material_risks[${i}]`, claim: c }));
  thesis.value_realization_tensions.forEach((c, i) => out.push({ path: `value_realization_tensions[${i}]`, claim: c }));
  thesis.things_a_new_cxo_should_know.forEach((c, i) => out.push({ path: `things_a_new_cxo_should_know[${i}]`, claim: c }));
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * Claude call plumbing
 * ---------------------------------------------------------------------------------------------- */

async function callClaude(
  client: { messages: { create: (p: Record<string, unknown>) => Promise<unknown> } } | null,
  system: string,
  userPrompt: string,
  maxTokens: number,
): Promise<{ text: string; inputTokens: number; outputTokens: number; model: string } | null> {
  if (!client) return null;
  const response = (await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userPrompt }],
  })) as {
    model: string;
    stop_reason?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
    content: Array<{ type: string; text?: string }>;
  };
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n").trim();
  if (!text) {
    // The first real run against both tenants returned empty text from every call with no other
    // signal to explain why. Guessing at a fix (a bigger max_tokens budget) without knowing the
    // actual cause is exactly the mistake this session spent four deploy cycles unlearning on the
    // orientation pack's validator. Print what the API actually said -- block types and the stop
    // reason -- so a second empty response is diagnosable instead of another guess.
    const blockTypes = response.content.map((b) => b.type).join(",") || "(no content blocks)";
    console.log(
      `    ! empty text -- stop_reason=${response.stop_reason ?? "unknown"} blocks=[${blockTypes}] ` +
        `output_tokens=${response.usage?.output_tokens ?? "unknown"} max_tokens=${maxTokens}`,
    );
    return null;
  }
  return {
    text,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    model: response.model,
  };
}

export function parseThesisJson(text: string): EnterpriseThesis | null {
  // Models occasionally wrap JSON in a code fence despite instructions. Strip it if present.
  const cleaned = text.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned) as EnterpriseThesis;
  } catch {
    return null;
  }
}

/** Drop a claim from its array in place. Used after verification rejects it. */
export function dropClaim(thesis: EnterpriseThesis, path: string) {
  const m = path.match(/^([a-zA-Z_.]+)\[(\d+)\]$/);
  if (!m) return;
  const [, arrayPath, idxStr] = m;
  const idx = Number(idxStr);
  const segments = arrayPath.split(".");
  let target: any = thesis;
  for (const seg of segments.slice(0, -1)) target = target[seg];
  const arr = target[segments[segments.length - 1]] as unknown[];
  arr[idx] = null as never;
}

/* ------------------------------------------------------------------------------------------------
 * Build
 * ---------------------------------------------------------------------------------------------- */

async function buildTenant(tenantKey: string, client: Parameters<typeof callClaude>[0]) {
  const report = await buildCanonicalTenantDataReport({ repoRoot: process.cwd(), tenantKeys: [tenantKey] });
  const records = report.canonicalRecords.filter((r: any) => r.tenantKey === tenantKey) as any;
  if (records.length === 0) throw new Error(`no canonical records for ${tenantKey}`);

  const crosswalkPath = path.join(
    process.cwd(),
    `datasets/tenant-inputs/active/${tenantKey}/current/12b_interview_initiative_metric_crosswalk.csv`,
  );
  let crosswalkRows: Array<{ canonicalObjectType: string; canonicalObjectName?: string }> = [];
  if (fs.existsSync(crosswalkPath)) {
    const parsed = Papa.parse(fs.readFileSync(crosswalkPath, "utf8"), { header: true, skipEmptyLines: true });
    crosswalkRows = (parsed.data as any[]).map((r) => ({
      canonicalObjectType: r.canonical_object_type,
      canonicalObjectName: r.canonical_object_name,
    }));
  }

  const dc = buildDecisionContext(records);
  const quality = buildContextQualityManifest(records, crosswalkRows, GOLDEN_EVIDENCE_CONTRACTS[tenantKey] ?? []);
  const signalPacket = buildEnterpriseSignalPacket(dc, quality);

  console.log(`  ${records.length.toLocaleString()} records → ${signalPacket.signals.length} material signals`);

  if (!client) {
    return { signalPacket, thesis: null, structuralIssues: [], verifierResults: [], usage: { input: 0, output: 0 } };
  }

  const userPrompt = buildUserPrompt(signalPacket);
  const usage = { input: 0, output: 0 };
  // The schema asks for up to a dozen array fields, several holding multiple GroundedClaim
  // objects (statement + evidence_ids + confidence each). 4000 tokens produced empty output on
  // the first real run against both tenants -- raised well above what the schema should need in
  // the worst case, on a claim-count-bounded prompt, rather than guessed at a second time.
  const generation = await callClaude(client, SYSTEM_PROMPT, userPrompt, 16000);
  if (!generation) {
    console.log("  ! thesis generation returned no text");
    return { signalPacket, thesis: null, structuralIssues: [], verifierResults: [], usage };
  }
  usage.input += generation.inputTokens;
  usage.output += generation.outputTokens;

  const thesis = parseThesisJson(generation.text);
  if (!thesis) {
    console.log("  ! thesis did not parse as JSON — first 300 chars:");
    console.log("   ", generation.text.slice(0, 300));
    return { signalPacket, thesis: null, structuralIssues: [], verifierResults: [], usage };
  }

  const structuralIssues = validateStructure(thesis, signalPacket);
  console.log(`  structural check: ${structuralIssues.length} issue(s)`);
  for (const issue of structuralIssues.slice(0, 10)) console.log(`    - ${issue.path}: ${issue.reason}`);

  const toVerify = claimsRequiringVerification(thesis);
  console.log(`  verifying ${toVerify.length} high-stakes claims...`);
  const verifierResults: Array<{ path: string; verdict: Verdict; reasoning: string }> = [];
  for (const { path: claimPath, claim } of toVerify) {
    const result = await verifyClaim(client, claim, signalPacket);
    verifierResults.push({ path: claimPath, verdict: result.verdict, reasoning: result.reasoning });
    if (result.verdict === "UNSUPPORTED" || result.verdict === "OVERSTATED") {
      dropClaim(thesis, claimPath);
    }
  }
  const tally: Record<string, number> = {};
  for (const r of verifierResults) tally[r.verdict] = (tally[r.verdict] ?? 0) + 1;
  console.log(`  verifier verdicts:`, tally);

  return { signalPacket, thesis, structuralIssues, verifierResults, usage };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  let client: Parameters<typeof callClaude>[0] = null;
  if (hasKey) {
    const { getAnthropicDirectClient } = await import("../../src/lib/integrations/ai-egress/anthropic-direct");
    client = getAnthropicDirectClient({ workload: "enterprise_thesis" }) as never;
  } else {
    console.log("! ANTHROPIC_API_KEY absent — building deterministic layers only, no thesis attempted\n");
  }

  for (const tenantKey of TENANTS) {
    console.log(`\n=== ${tenantKey} ===`);
    const { signalPacket, thesis, structuralIssues, verifierResults, usage } = await buildTenant(tenantKey, client);

    const result = { tenantKey, signalPacket, thesis, structuralIssues, verifierResults };
    const outFile = path.join(OUT_DIR, `${tenantKey}-enterprise-thesis.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
    console.log(`  → ${outFile}`);
    if (usage.output) console.log(`  tokens in ${usage.input} / out ${usage.output}`);

    // The out-dir above is inside the job's ephemeral container and is lost when it exits. Print
    // the full result to stdout too, one line per tenant, so it survives in the captured job log
    // and can be parsed back out locally -- the same reason the orientation-pack build's rejection
    // reasons were readable from console output earlier this session, just generalized to the
    // whole result instead of a summary line.
    console.log(`__ENTERPRISE_THESIS_RESULT_BEGIN__${JSON.stringify(result)}__ENTERPRISE_THESIS_RESULT_END__`);

    if (!WRITE || !thesis) continue;

    const contentHash = require("node:crypto")
      .createHash("sha256")
      .update(JSON.stringify(signalPacket))
      .digest("hex");

    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    try {
      await db.query("BEGIN");
      const existing = await db.query<{ content_hash: string }>(
        `SELECT content_hash FROM public.home_knowledge_packs
          WHERE tenant_key = $1 AND artifact_type = $2 AND status <> 'retired'
          ORDER BY created_at DESC LIMIT 1`,
        [tenantKey, ARTIFACT_TYPE],
      );
      if (existing.rows[0]?.content_hash === contentHash) {
        console.log("  = unchanged since last build, not rewritten");
        await db.query("ROLLBACK");
        continue;
      }
      await db.query(
        `UPDATE public.home_knowledge_packs
            SET status = 'retired', effective_to = now(), updated_at = now()
          WHERE tenant_key = $1 AND artifact_type = $2 AND status <> 'retired'`,
        [tenantKey, ARTIFACT_TYPE],
      );
      const inserted = await db.query<{ id: string }>(
        `INSERT INTO public.home_knowledge_packs (
           tenant_key, tenant_name, pack_version, status, artifact_type,
           source_pack_hash, generator_version, generated_by, generated_model,
           claude_model, claude_prompt_version, content_hash, render_pack,
           quality_report, validation_status, validation_issues, effective_from
         ) VALUES ($1,$2,$3,'candidate',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now())
         RETURNING id`,
        [
          tenantKey,
          tenantKey,
          `${ARTIFACT_TYPE}:${contentHash.slice(0, 12)}`,
          ARTIFACT_TYPE,
          contentHash,
          "enterprise-thesis/v1",
          "build-enterprise-thesis",
          CLAUDE_MODEL,
          CLAUDE_MODEL,
          "enterprise-thesis/v1",
          contentHash,
          JSON.stringify({ signalPacket, thesis }),
          JSON.stringify({ structuralIssues, verifierResults }),
          structuralIssues.length === 0 ? "pass" : "warn",
          JSON.stringify(structuralIssues),
        ],
      );
      const readback = await db.query<{ has_thesis: boolean }>(
        `SELECT (render_pack->'thesis') IS NOT NULL AS has_thesis FROM public.home_knowledge_packs WHERE id = $1`,
        [inserted.rows[0].id],
      );
      if (!readback.rows[0]?.has_thesis) throw new Error("readback found no thesis in stored render_pack");
      await db.query("COMMIT");
      console.log(`  ✓ stored ${inserted.rows[0].id}`);
    } catch (error) {
      await db.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      await db.end();
    }
  }
}

// Only run when invoked directly -- importing this module (e.g. from a test) must not execute a
// build. The same mistake, fixed once already this session in the orientation-pack generator when
// the dimension registry lived in a script that ran its own build on import.
if (process.argv[1] && process.argv[1].includes("build-enterprise-thesis")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

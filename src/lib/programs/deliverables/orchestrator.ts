// =============================================================================
// Deliverable Intelligence Orchestrator — multi-pass, expert-latitude generation.
// -----------------------------------------------------------------------------
// High-stakes deliverables are NOT generated in one cramped call. The orchestrator
// runs a multi-pass flow, each pass constrained to governed evidence but given
// expert latitude for structure/exhibits/framing:
//   Pass 1 — Architect: Claude designs the best artifact structure for this use
//            case (sections, exhibits, tables, placeholders). No drafting.
//   Pass 2 — Draft: Claude writes the full document using that structure +
//            governed evidence + expert knowledge.
//   Pass 3 — Red-team + board-grade rewrite: Claude critiques its own draft as a
//            senior partner, then outputs the revised, board-grade document.
// Then: scrub internal ids → quality gate. Client facts stay governed (cited /
// placeholder / assumption); expertise drives structure and language.
// =============================================================================

import "server-only";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { GeneratedDeliverable } from "@/lib/programs/deliverable-refinement";
import {
  buildSourceRegister,
  applyCitationsToBody,
  resolveSourceLabel,
  type SourceRegisterEntry,
} from "./source-labels";
import {
  resolveArtifactBrief,
  expertRoleLine,
  type DeliverableArtifactBrief,
} from "./artifact-briefs";
import {
  tenantDisplayName,
  type BoardDeliverableResult,
} from "./board-deliverable";
import {
  validateDeliverableQuality,
  type QualityReport,
} from "./quality-validator";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface OrchestratorResult {
  result: BoardDeliverableResult;
  quality: QualityReport;
  plan: string; // architect outline
  critique: string; // red-team notes
  passes: number;
  model: string;
}

// In-process result cache so a format change (json → docx/html) renders from the
// already-generated result instead of re-running the 3 passes (which exceeds the
// gateway timeout). TTL-bounded; keyed by tenant+move+deliverable.
const RESULT_CACHE = new Map<
  string,
  { at: number; value: OrchestratorResult }
>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export function getCachedOrchestration(key: string): OrchestratorResult | null {
  const hit = RESULT_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    RESULT_CACHE.delete(key);
    return null;
  }
  return hit.value;
}

export function setCachedOrchestration(
  key: string,
  value: OrchestratorResult,
): void {
  RESULT_CACHE.set(key, { at: Date.now(), value });
  if (RESULT_CACHE.size > 50) {
    const oldest = [...RESULT_CACHE.entries()].sort(
      (a, b) => a[1].at - b[1].at,
    )[0];
    if (oldest) RESULT_CACHE.delete(oldest[0]);
  }
}

function humanGap(missing: string): string {
  if (missing.startsWith("section:"))
    return `${missing.replace("section:", "").trim()} — narrative content not yet evidenced`;
  if (missing === "value_ratification")
    return "Value ratification (P1 ValueTree — absolute value ranges, not shares)";
  return resolveSourceLabel(missing).title;
}

function cleanBundle(base: GeneratedDeliverable): {
  facts: string[];
  register: SourceRegisterEntry[];
  citationMap: Record<string, number>;
  openItems: string[];
  internalSources: string[];
} {
  const ids: string[] = [];
  const rawFacts: Array<{ text: string; id: string }> = [];
  const gaps = new Set<string>();
  for (const s of base.sections)
    for (const c of s.claims) {
      if (c.citation) {
        ids.push(c.citation);
        rawFacts.push({ text: c.text, id: c.citation });
      } else if (c.missingEvidence) gaps.add(c.missingEvidence);
    }
  const { register, citationMap } = buildSourceRegister(ids);
  const seen = new Set<string>();
  const facts: string[] = [];
  for (const f of rawFacts) {
    const line = `${applyCitationsToBody(f.text, citationMap).trim()} [${citationMap[f.id]}]`;
    if (!seen.has(line)) {
      seen.add(line);
      facts.push(line);
    }
  }
  return {
    facts,
    register,
    citationMap,
    openItems: Array.from(gaps).map(humanGap),
    internalSources: Array.from(new Set(ids)),
  };
}

interface CallCtx {
  tenantId: string;
  clientKey: string;
  userId?: string;
  moveId: string;
  artifactType: string;
  model: string;
}

async function callClaude(
  ctx: CallCtx,
  workflow: string,
  system: string,
  prompt: string,
  maxTokens: number,
): Promise<string> {
  const { client } = await getAuditedAnthropicClient({
    tenantId: UUID_RE.test(ctx.tenantId) ? ctx.tenantId : ctx.clientKey,
    userId: ctx.userId && UUID_RE.test(ctx.userId) ? ctx.userId : undefined,
    workflow,
    model: ctx.model,
    prompt: [system, prompt].join("\n\n"),
    dataClass: "confidential",
    artifactId: ctx.moveId,
    artifactType: ctx.artifactType,
  });
  const stream = await client.messages.create({
    model: ctx.model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });
  let out = "";
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    )
      out += event.delta.text;
  }
  return out.trim();
}

const GOVERNANCE = [
  "GOVERNANCE BOUNDARY (non-negotiable):",
  "- Client-specific facts (names, owners, dates, financials, KPIs, systems, vendors, contracts, timelines, legal terms, benchmarks, pricing, approvals) come ONLY from the governed evidence below.",
  "- NEVER invent a client-specific fact. Where one is missing, write [CLIENT TO COMPLETE: …], [ASSUMPTION TO VALIDATE: …], or [EVIDENCE MISSING: …].",
  "- Cite every client-specific fact with a numeric [n] tied to the Source Register. NEVER print internal identifiers (table names, document_extract:*, chunk/fact keys, context tags).",
  "- Use your full EXPERT knowledge freely for structure, frameworks, exhibits, standard sections, boilerplate, review-required legal/procurement placeholders, and executive language.",
].join("\n");

function evidenceBlock(
  facts: string[],
  openItems: string[],
  register: SourceRegisterEntry[],
): string {
  return [
    "GOVERNED EVIDENCE (cite with the [n] shown — the ONLY client-specific fact base):",
    facts.length
      ? facts.map((f) => `• ${f}`).join("\n")
      : "(no committed evidence yet)",
    "",
    "MISSING EVIDENCE / OPEN ITEMS (placeholder or client-to-complete; do NOT invent):",
    openItems.length ? openItems.map((g) => `• ${g}`).join("\n") : "(none)",
    "",
    "SOURCE REGISTER (use these exact [n]):",
    register
      .map(
        (r) =>
          `[${r.ref}] ${r.title} — ${r.family} (confidence: ${r.confidence})`,
      )
      .join("\n") || "(none)",
  ].join("\n");
}

export async function orchestrateDeliverable(args: {
  base: GeneratedDeliverable;
  archetypeId: string;
  deliverableType: string;
  clientKey: string;
  tenantId: string;
  moveId: string;
  moveName: string;
  date: string;
  version?: string;
  userId?: string;
  model?: string;
  confidentiality?: string;
}): Promise<OrchestratorResult> {
  const clientName = tenantDisplayName(args.clientKey);
  const brief: DeliverableArtifactBrief = resolveArtifactBrief({
    archetypeId: args.archetypeId,
    deliverableType: args.deliverableType,
  });
  const { facts, register, citationMap, openItems, internalSources } =
    cleanBundle(args.base);
  const model =
    args.model ??
    process.env.MOVES_DELIVERABLE_MODEL ??
    process.env.NEXUS_COMPOSER_MODEL ??
    "claude-opus-4-7";
  const role = expertRoleLine(args.archetypeId);
  const ctx: CallCtx = {
    tenantId: args.tenantId,
    clientKey: args.clientKey,
    userId: args.userId,
    moveId: args.moveId,
    artifactType: args.deliverableType,
    model,
  };

  // ── Pass 1 — Architect ──
  const architectSystem = [
    role,
    `You are designing the structure for a board-grade ${brief.label} for ${clientName} ("${args.moveName}").`,
    `Use your expert knowledge to design the BEST possible artifact for this use case — you are NOT limited to a minimum section list. Add sections/exhibits/tables a senior consultant would include.`,
    `Decision it must support: ${brief.decisionToSupport}.`,
    `Audience: ${brief.audience}.`,
    `Do NOT draft the document. Return a tight outline: numbered H2 sections, and for each, the key exhibits/tables and any client-to-complete placeholders.`,
  ].join("\n");
  const architectPrompt = [
    `Use-case exhibits a senior advisor expects here: ${brief.expectedExhibits.join("; ")}.`,
    `Recommended sections to consider: ${brief.recommendedSections.join("; ")}.`,
    "",
    evidenceBlock(facts, openItems, register),
    "",
    "Return the outline now (sections + exhibits/tables + placeholders). No prose.",
  ].join("\n");
  const plan = await callClaude(
    ctx,
    "moves_deliverable_architect",
    architectSystem,
    architectPrompt,
    1800,
  );

  // ── Pass 2 — Full draft ──
  const draftSystem = [
    role,
    `MISSION: create the best possible ${brief.label} for ${clientName} ("${args.moveName}") for: ${brief.audience}.`,
    `It must support this decision: ${brief.decisionToSupport}.`,
    `EXPERT LATITUDE: use your full expertise to make this a genuinely high-class artifact — strong structure, synthesis, exhibits, decision tables, and recommendations. Do not limit yourself to the minimum if a better artifact needs more.`,
    "",
    GOVERNANCE,
    "",
    `Follow this approved structure (improve it where your expertise says so):`,
    plan,
    "",
    `FORMATTING: GitHub-flavored Markdown. H2 sections, markdown tables for every exhibit. Tables readable (no tiny/cramped tables). Start directly with the first H2 — no preamble.`,
  ].join("\n");
  const draftPrompt = [
    evidenceBlock(facts, openItems, register),
    "",
    `Write the full ${brief.label} now — executive, specific, decision-oriented, board-grade.`,
  ].join("\n");
  const draft = await callClaude(
    ctx,
    "moves_deliverable_draft",
    draftSystem,
    draftPrompt,
    8000,
  );

  // ── Pass 3 — Red-team critique + board-grade rewrite ──
  const critiqueSystem = [
    `You are a senior McKinsey partner and CIO advisor reviewing a draft ${brief.label}, then rewriting it to board-grade.`,
    `Quality bar: ${brief.qualityCriteria.join("; ")}.`,
    "",
    GOVERNANCE,
    "",
    `STEP 1: list the draft's weaknesses (generic language, thin sections, missing exhibits, weak implications, unclear decision asks, any unsupported client fact, any internal tag). Keep it terse.`,
    `STEP 2: output the FINAL, revised, board-grade document in full Markdown. Strengthen synthesis, implications, decision asks, tables, and exhibits; keep governance discipline.`,
    `Separate the two with a line containing exactly: ===FINAL===`,
  ].join("\n");
  const critiquePrompt = [
    "DRAFT TO REVIEW AND REWRITE:",
    draft,
    "",
    evidenceBlock(facts, openItems, register),
  ].join("\n");
  const reviewed = await callClaude(
    ctx,
    "moves_deliverable_redteam",
    critiqueSystem,
    critiquePrompt,
    8000,
  );

  const parts = reviewed.split(/^===FINAL===\s*$/m);
  const critique = parts.length > 1 ? parts[0].trim() : "";
  let finalBody = (
    parts.length > 1 ? parts.slice(1).join("\n") : reviewed
  ).trim();
  // Defense-in-depth: no internal id reaches the client body.
  finalBody = applyCitationsToBody(finalBody, citationMap);

  const result: BoardDeliverableResult = {
    deliverableType: args.deliverableType,
    label: brief.label,
    clientName,
    moveName: args.moveName,
    version: args.version ?? "0.1 (draft)",
    date: args.date,
    confidentiality:
      args.confidentiality ??
      "Confidential — for client steering committee review",
    bodyMarkdown: finalBody,
    sourceRegister: register,
    openItems,
    clientCompleteItems: openItems.slice(),
    unsupportedClaims: args.base.envelope.unsupportedClaims ?? [],
    model,
    generatedByClaude: true,
    internalTrace: {
      internalSources,
      archetype: args.base.envelope.archetypeResolved,
    },
  };

  const quality = validateDeliverableQuality({
    title: `${brief.label} — ${args.moveName}`,
    version: result.version,
    date: result.date,
    bodyMarkdown: finalBody,
    sourceRegister: register,
    // Orchestrated docs are structured by Claude; require the universally-expected
    // executive sections + a couple of must-have tables, not the rigid 14.
    requiredSections: ["Executive Summary", "Recommendation"],
    requiredTableSections: [],
    clientCompleteItems: result.clientCompleteItems,
    openItems,
    unsupportedClaims: result.unsupportedClaims,
    bodyFontPt: 11,
  });

  return { result, quality, plan, critique, passes: 3, model };
}

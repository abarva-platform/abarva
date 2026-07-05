/*
 * AbarVa Confidential — Trade Secret (TS-01)
 *
 * Companion Canvas engine.
 *
 * Builds the structured, typed `CompanionCanvasPayload` that renders beside
 * every Intelligence answer (the five-lens decision companion). This runs
 * AFTER the answer-only stream has finished — the answer is already on the
 * user's screen — so this engine spends quality, not latency: five focused
 * PARALLEL model calls (one per lens), each followed by a focused
 * verify-and-repair pass that enforces the honesty rules.
 *
 * Honesty model (the point of the feature): a tile may legally carry NO value.
 * Absence is a first-class, renderable state ("we are not instrumented here —
 * load X"), never a fabricated tenant number. Industry values are RANGES, not
 * decimals. The canvas is ADJACENT to the answer, not a restatement of it.
 *
 * ROBUSTNESS CONTRACT: every lens degrades to a safe default on any throw or
 * parse failure. `buildCompanionCanvasPayload` NEVER throws — a failure yields
 * an honest, empty-but-valid payload.
 */

import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { AskIntent, AskSource } from "./types";
import {
  computeLensOrder,
  isTenantThin,
  type CompanionCanvasPayload,
  type CompanionDecisionView,
  type CompanionExhibit,
  type CompanionIndustryContext,
  type CompanionNextMove,
  type Provenance,
  type SignalState,
  type SignalTile,
} from "./companion-canvas";
import { detectCrossTenantIdentityLeak } from "./tenant-identity-pin";

// Strongest available tier — matches the synthesizer's topic_synthesis model.
const COMPANION_MODEL = "claude-opus-4-7";
const COMPANION_WORKFLOW = "intelligence-companion-canvas";

const HONESTY_RULES = [
  "HONESTY RULES (binding):",
  "- Never fabricate a tenant number, date, dollar figure, vendor name, or metric. If a value is not present in the supplied EVIDENCE, omit it.",
  '- If a metric governs the decision but is NOT instrumented in the evidence, mark it state "expected_uncaptured" (or "benchmark" if an industry range stands in), give a one-line whyItMatters, and a loadHint naming what to ingest to light it up.',
  "- Industry / peer values are RANGES (for example \"8-15%\", \"$8-25M\"), never fake single decimals.",
  "- Be ADJACENT to the provided answer — add signals, framing, exhibit, field context, and next moves. Do NOT restate the answer's prose.",
  "- Stay strictly inside the active tenant. Never import another organization's facts.",
  "- Provenance is one of: enterprise-evidence (a tenant fact), industry-context (a peer/benchmark range), inference (your reasoning). Label honestly.",
].join("\n");

interface CompanionCanvasInput {
  query: string;
  intent: AskIntent;
  answer: string;
  sources: AskSource[];
  tenantClientKey: string | null;
  tenantId: string | null;
  userId?: string | null;
  factAvailabilityBlock?: string;
  coverageReportBlock?: string;
}

interface LensCallContext {
  tenantId: string;
  userId?: string | null;
  tenantClientKey: string | null;
  query: string;
  answer: string;
  sourcesBlock: string;
  contextBlock: string;
}

/**
 * Build the full companion canvas payload. Never throws — on total failure it
 * returns a valid, honest, empty payload.
 */
export async function buildCompanionCanvasPayload(
  input: CompanionCanvasInput,
): Promise<CompanionCanvasPayload> {
  const tenantId = input.tenantId ?? input.tenantClientKey;
  if (!process.env.ANTHROPIC_API_KEY || !tenantId) {
    return emptyCanvasPayload();
  }

  const ctx: LensCallContext = {
    tenantId,
    userId: input.userId,
    tenantClientKey: input.tenantClientKey,
    query: input.query,
    answer: input.answer,
    sourcesBlock: formatSourcesForLens(input.sources),
    contextBlock: [
      input.factAvailabilityBlock?.trim() ?? "",
      input.coverageReportBlock?.trim() ?? "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };

  // Five focused lenses, in parallel. Each is independently robust: a rejected
  // promise cannot happen (each generator catches internally), but we still
  // guard with Promise.all over already-safe generators.
  const [evidence, decision, visual, industryContext, nextMoves] =
    await Promise.all([
      safeLens(() => generateEvidenceLens(ctx), [] as SignalTile[]),
      safeLens(() => generateDecisionLens(ctx), defaultDecision()),
      safeLens(() => generateVisualLens(ctx), null as CompanionExhibit | null),
      safeLens(() => generateIndustryLens(ctx), defaultIndustryContext()),
      safeLens(() => generateNextMovesLens(ctx), [] as CompanionNextMove[]),
    ]);

  const tenantThin = isTenantThin(evidence);
  const majorityTilesInference =
    evidence.length > 0 &&
    evidence.filter((tile) => tile.provenance === "inference").length /
      evidence.length >
      0.5;
  const visualUnverified = visual?.unverified === true;

  const payload: CompanionCanvasPayload = {
    lensOrder: computeLensOrder(tenantThin),
    tabs: {
      evidence,
      decision,
      visual,
      industryContext,
      nextMoves,
    },
    meta: {
      canvasType: visual?.canvasType ?? null,
      unverified: visualUnverified || majorityTilesInference,
      tenantThin,
      generatedAt: new Date().toISOString(),
    },
  };

  // Final defense-in-depth: hard-scrub any lens value that slipped a
  // cross-tenant identity assertion past the per-lens verify pass. Recompute
  // tenantThin from the (possibly filtered) evidence so lensOrder stays honest.
  const scrubbed = scrubCrossTenantAssertions(
    payload,
    input.tenantClientKey ?? input.tenantId ?? null,
  );
  scrubbed.meta.tenantThin = isTenantThin(scrubbed.tabs.evidence);
  scrubbed.lensOrder = computeLensOrder(scrubbed.meta.tenantThin);
  return scrubbed;
}

// --------------------------------------------------------------------------
// Lens generators. Each: focused generate call → focused verify-and-repair
// call → validated typed value. All internally catch and degrade to a safe
// default; they never throw.
// --------------------------------------------------------------------------

async function generateEvidenceLens(
  ctx: LensCallContext,
): Promise<SignalTile[]> {
  const generatePrompt = [
    "You author the EVIDENCE lens of a decision companion: a small ladder of signal tiles that separate what is MEASURED in this tenant's evidence from what is EXPECTED but UNCAPTURED.",
    "",
    HONESTY_RULES,
    "",
    "Return 3-6 tiles. Each tile object:",
    '{ "label": string, "state": "measured"|"benchmark"|"expected_uncaptured"|"none", "value"?: string, "context"?: string, "provenance": "enterprise-evidence"|"industry-context"|"inference", "whyItMatters": string, "loadHint"?: string }',
    '- Use "measured" ONLY when a tenant evidence fact carries the value; set that value and provenance "enterprise-evidence".',
    '- Use "benchmark" when there is no tenant value but an industry RANGE stands in; put the range in value/context and provenance "industry-context".',
    '- Use "expected_uncaptured" when the metric governs the decision but is not instrumented; OMIT value, add whyItMatters + loadHint.',
    "- whyItMatters is REQUIRED on every tile, even value-less ones.",
    "",
    lensTaskBlock(ctx),
    "",
    'Output ONLY a fenced ```json block containing {"tiles": SignalTile[]}. No prose.',
  ].join("\n");

  const raw = await callLens(ctx, generatePrompt, "evidence");
  const parsed = parseJsonBlock(raw);
  let tiles = normalizeTiles(parsed?.tiles);

  const verifyPrompt = [
    "Verify the EVIDENCE tiles below against the honesty rules and the supplied evidence.",
    "",
    HONESTY_RULES,
    "",
    "Checks: (1) no fabricated tenant number appears with state measured unless it is actually in the evidence; (2) every value-less metric that matters is expected_uncaptured or benchmark with whyItMatters + loadHint; (3) industry values are ranges, not fake decimals; (4) provenance labels are honest; (5) no other tenant's facts leak in.",
    "",
    lensTaskBlock(ctx),
    "",
    "CURRENT TILES:",
    JSON.stringify({ tiles }),
    "",
    'If everything is correct, output ```json {"ok": true}```. If not, output ```json {"ok": false, "tiles": SignalTile[]}``` with the corrected full tile list. No prose.',
  ].join("\n");

  const verifyRaw = await callLens(ctx, verifyPrompt, "evidence-verify");
  const verify = parseJsonBlock(verifyRaw);
  if (verify && verify.ok === false && Array.isArray(verify.tiles)) {
    tiles = normalizeTiles(verify.tiles);
  }
  return tiles;
}

async function generateDecisionLens(
  ctx: LensCallContext,
): Promise<CompanionDecisionView> {
  const generatePrompt = [
    "You author the DECISION lens: the crisp executive call the answer implies, framed as a judgment with a tradeoff and the cost of waiting.",
    "",
    HONESTY_RULES,
    "",
    "Return an object:",
    '{ "judgment": string (fund/hold/certify/stop/investigate/escalate style, one line), "tradeoff": string, "owner"?: string, "consequenceOfWaiting": string }',
    "- judgment names the call, not a summary of options.",
    "- Do not invent an owner; omit owner unless the evidence names a plausible accountable role.",
    "",
    lensTaskBlock(ctx),
    "",
    'Output ONLY a fenced ```json block containing {"decision": CompanionDecisionView}. No prose.',
  ].join("\n");

  const raw = await callLens(ctx, generatePrompt, "decision");
  let decision = normalizeDecision(parseJsonBlock(raw)?.decision);

  const verifyPrompt = [
    "Verify the DECISION frame below against the honesty rules.",
    "",
    HONESTY_RULES,
    "",
    "Checks: judgment is a real call (not a restatement of the answer prose), tradeoff is concrete, owner is omitted unless plausibly grounded, consequenceOfWaiting is specific, no other tenant's facts leak in.",
    "",
    lensTaskBlock(ctx),
    "",
    "CURRENT DECISION:",
    JSON.stringify({ decision }),
    "",
    'If correct, output ```json {"ok": true}```. Otherwise output ```json {"ok": false, "decision": CompanionDecisionView}```. No prose.',
  ].join("\n");

  const verify = parseJsonBlock(await callLens(ctx, verifyPrompt, "decision-verify"));
  if (verify && verify.ok === false && verify.decision) {
    decision = normalizeDecision(verify.decision);
  }
  return decision;
}

async function generateVisualLens(
  ctx: LensCallContext,
): Promise<CompanionExhibit | null> {
  const generatePrompt = [
    "You author the VISUAL lens: at most ONE native exhibit that makes the decision clearer. If no exhibit genuinely helps, return null — do NOT force one.",
    "",
    HONESTY_RULES,
    "",
    "Choose exactly one canvasType and fill its shape, or return null:",
    '- investmentSequencingMap: { "canvasType":"investmentSequencingMap", "unverified"?:boolean, "items":[{ "label":string, "band":"scale_now"|"certify_then_scale"|"fund_readiness"|"hold_discovery", "value"?:string, "readiness"?:string, "provenance":Provenance }] }',
    '- valueReadinessMatrix: { "canvasType":"valueReadinessMatrix", "unverified"?:boolean, "axes":{"x":string,"y":string}, "points":[{ "label":string, "value":number(0-100), "readiness":number(0-100), "provenance":Provenance }] }',
    '- gateToValueRoadmap: { "canvasType":"gateToValueRoadmap", "unverified"?:boolean, "gates":[{ "label":string, "prerequisite":string, "unlocks":string, "provenance":Provenance }] }',
    '- proofBoundary: { "canvasType":"proofBoundary", "unverified"?:boolean, "dimensions":[{ "label":string, "status":"proven"|"partial"|"unproven"|"uncaptured", "note":string, "provenance":Provenance }] }',
    "- Provenance is enterprise-evidence | industry-context | inference. Set unverified:true when the exhibit is mostly inference, not tenant proof.",
    "- Never fabricate tenant numbers into the exhibit. If positions are your reasoning, mark provenance inference and unverified:true.",
    "",
    lensTaskBlock(ctx),
    "",
    'Output ONLY a fenced ```json block containing {"visual": CompanionExhibit | null}. No prose.',
  ].join("\n");

  const raw = await callLens(ctx, generatePrompt, "visual");
  let visual = normalizeVisual(parseJsonBlock(raw)?.visual);

  const verifyPrompt = [
    "Verify the VISUAL exhibit below against the honesty rules.",
    "",
    HONESTY_RULES,
    "",
    "Checks: the canvasType shape is valid, no fabricated tenant numbers, provenance is honest, unverified:true is set when the exhibit is mostly inference. If the exhibit does not genuinely aid the decision, set visual to null.",
    "",
    lensTaskBlock(ctx),
    "",
    "CURRENT VISUAL:",
    JSON.stringify({ visual }),
    "",
    'If correct, output ```json {"ok": true}```. Otherwise output ```json {"ok": false, "visual": CompanionExhibit | null}```. No prose.',
  ].join("\n");

  const verify = parseJsonBlock(await callLens(ctx, verifyPrompt, "visual-verify"));
  if (verify && verify.ok === false && "visual" in verify) {
    visual = normalizeVisual(verify.visual);
  }
  return visual;
}

async function generateIndustryLens(
  ctx: LensCallContext,
): Promise<CompanionIndustryContext> {
  const generatePrompt = [
    "You author the INDUSTRY lens: the most relevant peer/benchmark field context for this decision. Values are RANGES, never fake decimals. This is industry context, not tenant proof.",
    "",
    HONESTY_RULES,
    "",
    "Return an object:",
    '{ "note": string, "series"?: [{ "label": string, "range": string }] }',
    "- note is one or two sentences of peer pattern / benchmark framing.",
    '- series entries carry RANGES (for example { "label":"Margin lift", "range":"8-15%" }). Omit series if you have no honest range.',
    "",
    lensTaskBlock(ctx),
    "",
    'Output ONLY a fenced ```json block containing {"industryContext": CompanionIndustryContext}. No prose.',
  ].join("\n");

  const raw = await callLens(ctx, generatePrompt, "industry");
  let industry = normalizeIndustry(parseJsonBlock(raw)?.industryContext);

  const verifyPrompt = [
    "Verify the INDUSTRY context below against the honesty rules.",
    "",
    HONESTY_RULES,
    "",
    "Checks: every numeric is a RANGE not a fake decimal, framing is labeled as industry/benchmark context, no other tenant's facts leak in, note is not a restatement of the answer.",
    "",
    lensTaskBlock(ctx),
    "",
    "CURRENT INDUSTRY CONTEXT:",
    JSON.stringify({ industryContext: industry }),
    "",
    'If correct, output ```json {"ok": true}```. Otherwise output ```json {"ok": false, "industryContext": CompanionIndustryContext}```. No prose.',
  ].join("\n");

  const verify = parseJsonBlock(await callLens(ctx, verifyPrompt, "industry-verify"));
  if (verify && verify.ok === false && verify.industryContext) {
    industry = normalizeIndustry(verify.industryContext);
  }
  return industry;
}

async function generateNextMovesLens(
  ctx: LensCallContext,
): Promise<CompanionNextMove[]> {
  const generatePrompt = [
    "You author the NEXT MOVES lens: 2-4 concrete adjacent actions that advance the decision. Each names what it unlocks. Do not invent owners.",
    "",
    HONESTY_RULES,
    "",
    "Return 2-4 move objects:",
    '{ "action": string, "owner"?: string, "unlocks": string, "moveHref"?: string }',
    "- action is a concrete next step, not a restatement of the answer.",
    "- omit owner unless the evidence names a plausible accountable role.",
    "- omit moveHref unless you are certain of a real route.",
    "",
    lensTaskBlock(ctx),
    "",
    'Output ONLY a fenced ```json block containing {"nextMoves": CompanionNextMove[]}. No prose.',
  ].join("\n");

  const raw = await callLens(ctx, generatePrompt, "next-moves");
  let moves = normalizeNextMoves(parseJsonBlock(raw)?.nextMoves);

  const verifyPrompt = [
    "Verify the NEXT MOVES below against the honesty rules.",
    "",
    HONESTY_RULES,
    "",
    "Checks: each action is concrete and adjacent (not a restatement of the answer), owners are omitted unless plausibly grounded, no fabricated hrefs, no other tenant's facts leak in.",
    "",
    lensTaskBlock(ctx),
    "",
    "CURRENT NEXT MOVES:",
    JSON.stringify({ nextMoves: moves }),
    "",
    'If correct, output ```json {"ok": true}```. Otherwise output ```json {"ok": false, "nextMoves": CompanionNextMove[]}```. No prose.',
  ].join("\n");

  const verify = parseJsonBlock(await callLens(ctx, verifyPrompt, "next-moves-verify"));
  if (verify && verify.ok === false && Array.isArray(verify.nextMoves)) {
    moves = normalizeNextMoves(verify.nextMoves);
  }
  return moves;
}

// --------------------------------------------------------------------------
// Model plumbing
// --------------------------------------------------------------------------

async function callLens(
  ctx: LensCallContext,
  userPrompt: string,
  lens: string,
): Promise<string> {
  const system = [
    "You are the AbarVa Intelligence decision-companion author. You produce STRUCTURED JSON only, never prose. You stay strictly inside the active tenant and never fabricate tenant facts.",
    ctx.tenantClientKey
      ? `Active tenant client key: ${ctx.tenantClientKey}. Never assert or import any other organization's identity or facts.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const { client } = await getAuditedAnthropicClient({
    tenantId: ctx.tenantId,
    userId: ctx.userId ?? undefined,
    workflow: COMPANION_WORKFLOW,
    model: COMPANION_MODEL,
    prompt: [system, userPrompt].join("\n\n"),
    dataClass: "confidential",
    metadata: { lens },
  });

  const response = await client.messages.create({
    model: COMPANION_MODEL,
    max_tokens: 1400,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  return extractText(response);
}

function lensTaskBlock(ctx: LensCallContext): string {
  return [
    "USER QUESTION:",
    ctx.query,
    "",
    "ANSWER ALREADY SHOWN TO THE USER (be adjacent to it, do not restate it):",
    ctx.answer.trim() || "(no answer text available)",
    "",
    "EVIDENCE AVAILABLE:",
    ctx.sourcesBlock,
    ctx.contextBlock ? `\nADDITIONAL CONTEXT:\n${ctx.contextBlock}` : "",
  ].join("\n");
}

function formatSourcesForLens(sources: AskSource[]): string {
  if (sources.length === 0) {
    return "[no direct evidence rows retrieved — do not fabricate tenant facts; use expected_uncaptured / benchmark / inference states honestly]";
  }
  return sources
    .slice(0, 16)
    .map(
      (source, index) =>
        `[EVIDENCE ${index + 1} · ${source.type} · ${source.name}]\n${source.detail}`,
    )
    .join("\n\n");
}

function extractText(response: unknown): string {
  const content = (response as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const maybeText = (block as { text?: unknown }).text;
      return typeof maybeText === "string" ? maybeText : "";
    })
    .join("");
}

/** Wrap a lens generator so a throw degrades to the supplied safe default. */
async function safeLens<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn("[companion-canvas.lens]", err);
    return fallback;
  }
}

// --------------------------------------------------------------------------
// Defensive JSON parsing + normalization
// --------------------------------------------------------------------------

function parseJsonBlock(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  // Prefer a fenced ```json block; fall back to the first balanced object.
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const value = JSON.parse(candidate.slice(start, end + 1));
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

const SIGNAL_STATES: ReadonlySet<SignalState> = new Set([
  "measured",
  "benchmark",
  "expected_uncaptured",
  "none",
]);
const PROVENANCES: ReadonlySet<Provenance> = new Set([
  "enterprise-evidence",
  "industry-context",
  "inference",
]);

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function asProvenance(value: unknown): Provenance {
  return typeof value === "string" && PROVENANCES.has(value as Provenance)
    ? (value as Provenance)
    : "inference";
}

function normalizeTiles(value: unknown): SignalTile[] {
  if (!Array.isArray(value)) return [];
  const tiles: SignalTile[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    const label = asString(record.label);
    const whyItMatters = asString(record.whyItMatters);
    if (!label || !whyItMatters) continue;
    const state =
      typeof record.state === "string" && SIGNAL_STATES.has(record.state as SignalState)
        ? (record.state as SignalState)
        : "none";
    const provenance = asProvenance(record.provenance);
    // Honesty invariant: a value is only allowed when the state is measured or
    // benchmark. Strip stray values off uncaptured/none tiles so a model
    // slip cannot surface a fabricated number.
    const rawValue = asString(record.value);
    const value_ =
      state === "measured" || state === "benchmark" ? rawValue : undefined;
    tiles.push({
      label,
      state,
      value: value_,
      context: asString(record.context),
      provenance,
      whyItMatters,
      loadHint: asString(record.loadHint),
    });
  }
  return tiles.slice(0, 8);
}

function normalizeDecision(value: unknown): CompanionDecisionView {
  if (!value || typeof value !== "object") return defaultDecision();
  const record = value as Record<string, unknown>;
  const judgment = asString(record.judgment);
  const tradeoff = asString(record.tradeoff);
  const consequenceOfWaiting = asString(record.consequenceOfWaiting);
  if (!judgment || !tradeoff || !consequenceOfWaiting) {
    return {
      judgment: judgment ?? defaultDecision().judgment,
      tradeoff: tradeoff ?? defaultDecision().tradeoff,
      owner: asString(record.owner),
      consequenceOfWaiting:
        consequenceOfWaiting ?? defaultDecision().consequenceOfWaiting,
    };
  }
  return {
    judgment,
    tradeoff,
    owner: asString(record.owner),
    consequenceOfWaiting,
  };
}

function normalizeIndustry(value: unknown): CompanionIndustryContext {
  if (!value || typeof value !== "object") return defaultIndustryContext();
  const record = value as Record<string, unknown>;
  const note = asString(record.note);
  if (!note) return defaultIndustryContext();
  const series = Array.isArray(record.series)
    ? record.series
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const e = entry as Record<string, unknown>;
          const label = asString(e.label);
          const range = asString(e.range);
          if (!label || !range) return null;
          return { label, range };
        })
        .filter((entry): entry is { label: string; range: string } =>
          Boolean(entry),
        )
        .slice(0, 6)
    : undefined;
  return { note, series: series && series.length > 0 ? series : undefined };
}

function normalizeNextMoves(value: unknown): CompanionNextMove[] {
  if (!Array.isArray(value)) return [];
  const moves: CompanionNextMove[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    const action = asString(record.action);
    const unlocks = asString(record.unlocks);
    if (!action || !unlocks) continue;
    moves.push({
      action,
      owner: asString(record.owner),
      unlocks,
      moveHref: asString(record.moveHref),
    });
  }
  return moves.slice(0, 4);
}

function normalizeVisual(value: unknown): CompanionExhibit | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const canvasType = record.canvasType;
  const unverified = record.unverified === true ? true : undefined;

  if (canvasType === "investmentSequencingMap") {
    const bands = new Set([
      "scale_now",
      "certify_then_scale",
      "fund_readiness",
      "hold_discovery",
    ]);
    const items = Array.isArray(record.items)
      ? record.items
          .map((raw) => {
            if (!raw || typeof raw !== "object") return null;
            const e = raw as Record<string, unknown>;
            const label = asString(e.label);
            const band =
              typeof e.band === "string" && bands.has(e.band)
                ? (e.band as
                    | "scale_now"
                    | "certify_then_scale"
                    | "fund_readiness"
                    | "hold_discovery")
                : null;
            if (!label || !band) return null;
            return {
              label,
              band,
              value: asString(e.value),
              readiness: asString(e.readiness),
              provenance: asProvenance(e.provenance),
            };
          })
          .filter(Boolean)
      : [];
    if (items.length === 0) return null;
    return {
      canvasType: "investmentSequencingMap",
      unverified,
      items: items as Extract<
        CompanionExhibit,
        { canvasType: "investmentSequencingMap" }
      >["items"],
    };
  }

  if (canvasType === "valueReadinessMatrix") {
    const axesRaw = record.axes as Record<string, unknown> | undefined;
    const axes = {
      x: asString(axesRaw?.x) ?? "Value",
      y: asString(axesRaw?.y) ?? "Readiness",
    };
    const points = Array.isArray(record.points)
      ? record.points
          .map((raw) => {
            if (!raw || typeof raw !== "object") return null;
            const e = raw as Record<string, unknown>;
            const label = asString(e.label);
            const val = clamp0to100(e.value);
            const readiness = clamp0to100(e.readiness);
            if (!label || val === null || readiness === null) return null;
            return {
              label,
              value: val,
              readiness,
              provenance: asProvenance(e.provenance),
            };
          })
          .filter(Boolean)
      : [];
    if (points.length === 0) return null;
    return {
      canvasType: "valueReadinessMatrix",
      unverified,
      axes,
      points: points as Extract<
        CompanionExhibit,
        { canvasType: "valueReadinessMatrix" }
      >["points"],
    };
  }

  if (canvasType === "gateToValueRoadmap") {
    const gates = Array.isArray(record.gates)
      ? record.gates
          .map((raw) => {
            if (!raw || typeof raw !== "object") return null;
            const e = raw as Record<string, unknown>;
            const label = asString(e.label);
            const prerequisite = asString(e.prerequisite);
            const unlocks = asString(e.unlocks);
            if (!label || !prerequisite || !unlocks) return null;
            return {
              label,
              prerequisite,
              unlocks,
              provenance: asProvenance(e.provenance),
            };
          })
          .filter(Boolean)
      : [];
    if (gates.length === 0) return null;
    return {
      canvasType: "gateToValueRoadmap",
      unverified,
      gates: gates as Extract<
        CompanionExhibit,
        { canvasType: "gateToValueRoadmap" }
      >["gates"],
    };
  }

  if (canvasType === "proofBoundary") {
    const statuses = new Set(["proven", "partial", "unproven", "uncaptured"]);
    const dimensions = Array.isArray(record.dimensions)
      ? record.dimensions
          .map((raw) => {
            if (!raw || typeof raw !== "object") return null;
            const e = raw as Record<string, unknown>;
            const label = asString(e.label);
            const status =
              typeof e.status === "string" && statuses.has(e.status)
                ? (e.status as "proven" | "partial" | "unproven" | "uncaptured")
                : null;
            const note = asString(e.note);
            if (!label || !status || !note) return null;
            return {
              label,
              status,
              note,
              provenance: asProvenance(e.provenance),
            };
          })
          .filter(Boolean)
      : [];
    if (dimensions.length === 0) return null;
    return {
      canvasType: "proofBoundary",
      unverified,
      dimensions: dimensions as Extract<
        CompanionExhibit,
        { canvasType: "proofBoundary" }
      >["dimensions"],
    };
  }

  return null;
}

function clamp0to100(value: unknown): number | null {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : NaN;
  if (!Number.isFinite(num)) return null;
  return Math.min(100, Math.max(0, num));
}

// --------------------------------------------------------------------------
// Safe defaults
// --------------------------------------------------------------------------

function defaultDecision(): CompanionDecisionView {
  return {
    judgment: "Investigate before committing.",
    tradeoff:
      "The evidence on hand does not yet resolve the call; forcing a decision now trades speed for proof.",
    consequenceOfWaiting:
      "Waiting is low-cost here as long as the missing evidence is being captured in parallel.",
  };
}

function defaultIndustryContext(): CompanionIndustryContext {
  return {
    note: "Industry context was not assembled for this turn. Treat any peer figures as planning ranges, not tenant proof, until captured.",
  };
}

function emptyCanvasPayload(): CompanionCanvasPayload {
  const evidence: SignalTile[] = [];
  const tenantThin = isTenantThin(evidence);
  return {
    lensOrder: computeLensOrder(tenantThin),
    tabs: {
      evidence,
      decision: defaultDecision(),
      visual: null,
      industryContext: defaultIndustryContext(),
      nextMoves: [],
    },
    meta: {
      canvasType: null,
      unverified: false,
      tenantThin,
      generatedAt: new Date().toISOString(),
    },
  };
}

// Hard-scrub any lens value that asserts a cross-tenant identity. Runs as the
// final gate inside buildCompanionCanvasPayload; exported for direct testing.
export function scrubCrossTenantAssertions(
  payload: CompanionCanvasPayload,
  tenantClientKey: string | null,
): CompanionCanvasPayload {
  if (!tenantClientKey) return payload;
  const check = (text: string | undefined): boolean =>
    Boolean(
      text &&
        detectCrossTenantIdentityLeak({
          clientKey: tenantClientKey,
          response: text,
        }).leaked,
    );
  const decisionLeak =
    check(payload.tabs.decision.judgment) ||
    check(payload.tabs.decision.tradeoff) ||
    check(payload.tabs.decision.consequenceOfWaiting);
  if (decisionLeak) {
    payload.tabs.decision = defaultDecision();
  }
  const industryLeak = check(payload.tabs.industryContext.note);
  if (industryLeak) {
    payload.tabs.industryContext = defaultIndustryContext();
  }
  payload.tabs.evidence = payload.tabs.evidence.filter(
    (tile) => !check(tile.label) && !check(tile.whyItMatters) && !check(tile.context),
  );
  return payload;
}

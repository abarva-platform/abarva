import "server-only";

/**
 * The REAL Claude-calling implementation behind the fixture aVa "real" mode.
 *
 * WHY THIS FILE EXISTS (and why AnthropicAvaReasoningProvider in
 * consumption-client/ava-provider.ts is only a thin HTTP-calling shell):
 *
 * src/lib/knowledge/consumption-client/context.tsx is a "use client" module
 * (ConsumptionRuntimeProvider runs in the browser -- KnowledgePreviewApp's
 * admin fixture control calls createFixtureRuntime directly client-side, with
 * no server hop). Because of that, EVERYTHING reachable from context.tsx
 * (factory.ts, ava-provider.ts, ...) is part of the Next.js CLIENT bundle
 * graph, whether or not any given code path actually runs in the browser.
 *
 * A first version of this feature put the @anthropic-ai/sdk call directly in
 * consumption-client/ava-provider.ts behind a dynamic import(), reasoning
 * that a dynamic import wouldn't be evaluated unless actually invoked. That
 * is true at RUNTIME but not at Next.js/Turbopack's BUILD time: Turbopack
 * still statically discovers the import() call while building the client
 * chunk graph and tries to bundle @anthropic-ai/sdk for the browser -- which
 * fails outright, because the SDK's agent-toolset code path imports
 * `node:fs/promises`, a Node-only built-in with no browser equivalent. This
 * broke `next build` (Error: "the chunking context (unknown) does not
 * support external modules (request: node:fs/promises)"), even though tsc,
 * eslint and every jsdom Jest test stayed green -- none of those run a real
 * Next.js client bundler pass, so none of them could catch it.
 *
 * The fix follows the SAME pattern this codebase already uses for the real
 * (non-fixture) tenant path: consumption-server/ava-egress-provider.ts is
 * `import "server-only"` and is only ever reached via a POST to
 * /api/knowledge/ava (an actual Route Handler, i.e. a real network/process
 * boundary, not just a lazy import). This file is the fixture-tenant
 * counterpart, reached via /api/knowledge/fixture-ava. The client-side
 * AnthropicAvaReasoningProvider now does nothing but `fetch()` that route and
 * shape the JSON response back into an AvaAnswer -- it imports no SDK and no
 * server-only code, so it is safe to be part of the client bundle graph.
 */

import Anthropic from "@anthropic-ai/sdk";

import type {
  AvaAnswer,
  AvaAnswerSection,
  AvaKnowledgePacket,
  AvaRequest,
  BenchmarkV1,
  EntityDetailV1,
  EntitySummaryV1,
  EvidenceDescriptor,
  EvidenceGapV1,
  GovernedMetricValue,
  LeadershipPerspectiveV1,
} from "../consumption-contracts";
import { assertFixtureNamespace, getFixturePack } from "../fixtures";
import {
  resolveAnthropicKeyForLane,
  laneForWorkloadOrDefault,
} from "@/lib/integrations/ai-egress/anthropic-key-lanes";

const AVA_FIXTURE_WORKLOAD = "home_knowledge_fixture_preview";
const DEFAULT_AVA_MODEL = "claude-sonnet-4-6";
const DEFAULT_AVA_MAX_TOKENS = 1600;

// ---------------------------------------------------------------------------
// Grounded corpus + scoping (server-side only; see module header)
// ---------------------------------------------------------------------------

interface FixtureAvaCorpus {
  entities: EntitySummaryV1[];
  entityDetails: Record<string, EntityDetailV1>;
  perspectives: LeadershipPerspectiveV1[];
  benchmarks: BenchmarkV1[];
  gaps: EvidenceGapV1[];
  evidenceDescriptors: Record<string, EvidenceDescriptor>;
  interpretation: {
    id: string;
    headline: string;
    body: string;
    evidenceRefs: string[];
  } | null;
  headlineMetrics: GovernedMetricValue[];
}

function loadCorpus(tenantKey: string): FixtureAvaCorpus {
  assertFixtureNamespace(tenantKey);
  const pack = getFixturePack(tenantKey);
  if (!pack) {
    throw new Error(`fixture-ava: no fixture pack for "${tenantKey}".`);
  }
  return {
    entities: pack.exploreLanding.entities,
    entityDetails: pack.entityDetails,
    perspectives: pack.brief.perspectives,
    benchmarks: pack.brief.benchmarks,
    gaps: pack.evidence.gaps,
    evidenceDescriptors: pack.evidenceDescriptors,
    interpretation: pack.brief.interpretation
      ? {
          id: pack.brief.interpretation.id,
          headline: pack.brief.interpretation.headline,
          body: pack.brief.interpretation.body,
          evidenceRefs: pack.brief.interpretation.evidenceRefs,
        }
      : null,
    headlineMetrics: pack.brief.headlineMetrics,
  };
}

interface ScopedGroundedContext {
  evidence: EvidenceDescriptor[];
  entities: EntitySummaryV1[];
  entityDetails: EntityDetailV1[];
  perspectives: LeadershipPerspectiveV1[];
  benchmarks: BenchmarkV1[];
  gaps: EvidenceGapV1[];
  metrics: GovernedMetricValue[];
  interpretation: FixtureAvaCorpus["interpretation"];
  allowedEvidenceRefs: Set<string>;
}

/**
 * Narrow the corpus to exactly what the packet declares in scope. This is the
 * enforcement point for "aVa cannot see beyond the page's boundary": nothing
 * outside packet.evidenceRefs / packet.acceptedFactRefs / packet.knownGapRefs
 * survives into the prompt, no matter how rich the underlying corpus is.
 */
function scopeCorpusToPacket(
  corpus: FixtureAvaCorpus,
  packet: AvaKnowledgePacket,
): ScopedGroundedContext {
  const evidenceScope = new Set(packet.evidenceRefs);
  const factScope = new Set(packet.acceptedFactRefs);
  const gapScope = new Set(packet.knownGapRefs);
  const inEvidenceScope = (refs: string[]) =>
    refs.some((r) => evidenceScope.has(r));

  const evidence = Object.values(corpus.evidenceDescriptors).filter((d) =>
    evidenceScope.has(d.evidenceRef),
  );
  // Entities are included when the packet names them directly (Explore mode's
  // acceptedFactRefs IS entity refs); per-field evidenceRefs still gate what
  // is citable (see AVA_SYSTEM_PROMPT rule #2).
  const entities = corpus.entities.filter(
    (e) => factScope.has(e.entityRef) || inEvidenceScope(e.evidenceRefs),
  );
  const entityDetails = entities
    .map((e) => corpus.entityDetails[e.entityRef])
    .filter((d): d is EntityDetailV1 => Boolean(d));
  // Perspectives, benchmarks and metrics are single value-bearing statements
  // (a quote, a peer number, a headline figure), gated STRICTLY on their own
  // evidenceRefs overlapping the packet's evidenceRefs -- never on
  // acceptedFactRefs alone. See the long comment in the git history of
  // ava-provider.ts / this file for the misattribution bug this prevents:
  // admitting a fact via acceptedFactRefs alone when its own evidence isn't
  // in scope hands the model a real number with no correct citation
  // available, and the model will sometimes attach a real-but-WRONG ref
  // rather than the correct "not available in this scope" refusal.
  const perspectives = corpus.perspectives.filter((p) =>
    inEvidenceScope(p.evidenceRefs),
  );
  const benchmarks = corpus.benchmarks.filter((b) =>
    inEvidenceScope(b.evidenceRefs),
  );
  const gaps = corpus.gaps.filter((g) => gapScope.has(g.gapId));
  const metrics = corpus.headlineMetrics.filter((m) =>
    inEvidenceScope(m.evidenceRefs),
  );
  const interpretation =
    corpus.interpretation && inEvidenceScope(corpus.interpretation.evidenceRefs)
      ? corpus.interpretation
      : null;

  return {
    evidence,
    entities,
    entityDetails,
    perspectives,
    benchmarks,
    gaps,
    metrics,
    interpretation,
    allowedEvidenceRefs: new Set(evidenceScope),
  };
}

function scopedContextIsEmpty(ctx: ScopedGroundedContext): boolean {
  return (
    ctx.evidence.length === 0 &&
    ctx.entities.length === 0 &&
    ctx.perspectives.length === 0 &&
    ctx.benchmarks.length === 0 &&
    ctx.metrics.length === 0 &&
    !ctx.interpretation
  );
}

function renderScopedContextForPrompt(ctx: ScopedGroundedContext): string {
  const payload = {
    interpretation: ctx.interpretation
      ? {
          headline: ctx.interpretation.headline,
          body: ctx.interpretation.body,
          evidenceRefs: ctx.interpretation.evidenceRefs,
        }
      : null,
    metrics: ctx.metrics.map((m) => ({
      metricKey: m.metricKey,
      label: m.label ?? m.metricKey,
      value: m.value,
      unit: m.unit,
      period: m.period,
      availabilityState: m.availabilityState,
      evidenceRefs: m.evidenceRefs,
    })),
    entities: ctx.entities.map((e) => ({
      entityRef: e.entityRef,
      displayName: e.displayName,
      entityType: e.entityType,
      domainKey: e.domainKey,
      availabilityState: e.availabilityState,
      fields: e.fields.map((f) => ({
        key: f.key,
        label: f.label,
        value: f.value,
        availabilityState: f.availabilityState,
        evidenceRefs: f.evidenceRefs,
      })),
      evidenceRefs: e.evidenceRefs,
    })),
    entityDetailFields: ctx.entityDetails.map((d) => ({
      entityRef: d.entity.entityRef,
      fields: d.fields.map((f) => ({
        key: f.key,
        label: f.label,
        value: f.value,
        availabilityState: f.availabilityState,
        evidenceRefs: f.evidenceRefs,
      })),
    })),
    perspectives: ctx.perspectives.map((p) => ({
      id: p.id,
      quote: p.quote,
      role: p.role,
      attribution: p.attribution,
      evidenceRefs: p.evidenceRefs,
    })),
    benchmarksAndPatterns: ctx.benchmarks.map((b) => ({
      id: b.id,
      contentClass: b.contentClass,
      label: b.label,
      value: b.value,
      peerContext: b.peerContext,
      evidenceRefs: b.evidenceRefs,
    })),
    knownGaps: ctx.gaps.map((g) => ({
      gapId: g.gapId,
      severity: g.severity,
      title: g.title,
      businessImpact: g.businessImpact,
      gapState: g.gapState,
    })),
    evidenceSources: ctx.evidence.map((d) => ({
      evidenceRef: d.evidenceRef,
      sourceName: d.sourceName,
      sourceType: d.sourceType,
      sourceDate: d.sourceDate,
      citation: d.citation,
      confidence: d.confidence,
    })),
    allowedEvidenceRefs: Array.from(ctx.allowedEvidenceRefs),
  };
  return JSON.stringify(payload, null, 2);
}

const AVA_SYSTEM_PROMPT = [
  "You are aVa, AbarVa's governed Knowledge reasoning companion.",
  "You will be given a JSON block called GOVERNED_CONTEXT: the ONLY facts, quotes, metrics, and",
  "evidence citations you are permitted to use. Nothing outside GOVERNED_CONTEXT exists to you.",
  "",
  "Hard rules:",
  "1. Never invent a number, name, date, quote, vendor, system, or fact that is not present",
  "   verbatim in GOVERNED_CONTEXT.",
  "2. Every evidenceRef you cite (top-level and per-section) MUST be one of the exact strings in",
  "   GOVERNED_CONTEXT.allowedEvidenceRefs. Do not paraphrase, rename, or guess a ref id. When you",
  "   state a SPECIFIC fact/value (a field, a metric, a quote, a benchmark), the evidenceRef you cite",
  "   for it must be one of the evidenceRefs listed against THAT exact fact in GOVERNED_CONTEXT --",
  "   never a different fact's ref borrowed because it happens to be allowed. If a fact's own",
  "   evidenceRefs don't overlap allowedEvidenceRefs, that fact has no citable source in this scope:",
  "   do not state its specific value at all, and say plainly that it is not available in the",
  "   current scope rather than presenting it uncited or under a mismatched citation.",
  "3. If GOVERNED_CONTEXT does not contain enough to answer the question, you MUST refuse: set",
  '   outcome to "refused", leave sections and evidenceRefs empty, and explain in refusalReason',
  "   what evidence would be needed. Do not soften a refusal into a vague best-effort answer.",
  '4. A field with availabilityState other than "available" or "accepted" (e.g. withheld,',
  "   not_measured, not_loaded, conflicting) has NO usable value -- treat it as absent, never as",
  "   zero or as a real number.",
  '5. Set outcome to "partial" (not "answered") when knownGaps materially limit the answer.',
  "6. Write plain business prose. Do not expose internal identifiers, JSON, or record ids in the",
  "   body text -- reference objects by their displayName/label, not their ref id.",
  "7. Your answer is ephemeral: never claim it is accepted, published, or promoted Knowledge.",
  "",
  "Respond only by calling the submit_ava_answer tool.",
].join("\n");

const AVA_ANSWER_TOOL: Anthropic.Tool = {
  name: "submit_ava_answer",
  description:
    "Submit the structured aVa answer. Every evidenceRef must come from GOVERNED_CONTEXT.allowedEvidenceRefs.",
  input_schema: {
    type: "object",
    properties: {
      outcome: { type: "string", enum: ["answered", "refused", "partial"] },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            heading: { type: "string" },
            body: { type: "string" },
            evidenceRefs: { type: "array", items: { type: "string" } },
          },
          required: ["heading", "body", "evidenceRefs"],
        },
      },
      evidenceRefs: { type: "array", items: { type: "string" } },
      limitations: { type: "array", items: { type: "string" } },
      whatWouldChangeIt: { type: "array", items: { type: "string" } },
      refusalReason: { type: ["string", "null"] },
    },
    required: [
      "outcome",
      "sections",
      "evidenceRefs",
      "limitations",
      "whatWouldChangeIt",
      "refusalReason",
    ],
  },
};

interface RawAvaToolResponse {
  outcome: "answered" | "refused" | "partial";
  sections: Array<{ heading: string; body: string; evidenceRefs: string[] }>;
  evidenceRefs: string[];
  limitations: string[];
  whatWouldChangeIt: string[];
  refusalReason: string | null;
}

function refusalAnswer(reason: string, limitations: string[]): AvaAnswer {
  return {
    outcome: "refused",
    sections: [],
    evidenceRefs: [],
    limitations,
    whatWouldChangeIt: [
      "Load or accept evidence for this scope, or widen the selection to entities that carry evidence.",
    ],
    refusalReason: reason,
    promoted: false,
  };
}

function verifyAndCleanAnswer(
  raw: RawAvaToolResponse,
  allowed: Set<string>,
): AvaAnswer | { invalid: true; reason: string } {
  if (raw.outcome === "refused") {
    return refusalAnswer(
      raw.refusalReason?.trim() ||
        "aVa could not substantiate an answer from the evidence in scope.",
      raw.limitations.length > 0
        ? raw.limitations
        : ["No accepted evidence in scope supports this question."],
    );
  }

  const cleanSections: AvaAnswerSection[] = [];
  for (const s of raw.sections) {
    const heading = s.heading?.trim();
    const body = s.body?.trim();
    if (!heading || !body) continue;
    const evidenceRefs = (s.evidenceRefs ?? []).filter((r) => allowed.has(r));
    if (evidenceRefs.length === 0) continue;
    cleanSections.push({ heading, body, evidenceRefs });
  }

  if (cleanSections.length === 0) {
    return {
      invalid: true,
      reason:
        "aVa's response did not cite any verifiable in-scope evidence reference, so it cannot be trusted as a grounded answer.",
    };
  }

  const topEvidenceRefs = Array.from(
    new Set([
      ...raw.evidenceRefs.filter((r) => allowed.has(r)),
      ...cleanSections.flatMap((s) => s.evidenceRefs),
    ]),
  );

  return {
    outcome: raw.outcome,
    sections: cleanSections,
    evidenceRefs: topEvidenceRefs,
    limitations:
      raw.limitations.length > 0
        ? raw.limitations
        : [
            "aVa's answer is ephemeral and is not accepted Knowledge unless separately promoted.",
          ],
    whatWouldChangeIt:
      raw.whatWouldChangeIt.length > 0
        ? raw.whatWouldChangeIt
        : ["Loading additional accepted evidence for the selected entities."],
    refusalReason: null,
    promoted: false,
  };
}

function getAnthropicClient(): Anthropic {
  const resolved = resolveAnthropicKeyForLane(
    laneForWorkloadOrDefault(AVA_FIXTURE_WORKLOAD),
  );
  return new Anthropic({ apiKey: resolved.apiKey });
}

function safeErrorText(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "unknown_error";
  return message
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, "[redacted-anthropic-key]")
    .slice(0, 400);
}

export function fixtureAvaIsAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function runFixtureAvaAsk(args: {
  tenantKey: string;
  request: AvaRequest;
}): Promise<AvaAnswer> {
  const { packet, intent, question } = args.request;

  if (
    packet.evidenceRefs.length === 0 &&
    packet.acceptedFactRefs.length === 0
  ) {
    return refusalAnswer(
      "Required evidence is unavailable for the current scope; aVa does not estimate.",
      [
        "No accepted evidence is in scope for the current lens, filters and permission boundary.",
      ],
    );
  }
  if (!fixtureAvaIsAvailable()) {
    return refusalAnswer(
      "Model provider is not configured in this environment.",
      ["ANTHROPIC_API_KEY is not set."],
    );
  }

  const corpus = loadCorpus(args.tenantKey);
  const scoped = scopeCorpusToPacket(corpus, packet);
  if (scopedContextIsEmpty(scoped)) {
    return refusalAnswer(
      "The evidence and fact references in scope do not resolve to any governed content aVa can reason over.",
      [
        "The current selection's refs did not match any entity, metric, perspective, benchmark, or evidence item in the fixture corpus.",
      ],
    );
  }

  const userPrompt = [
    `Intent: ${intent}. Mode: ${packet.mode}. Lens: ${packet.lens}. Depth: ${packet.depth}.`,
    `Active Knowledge Baseline: ${packet.knowledgeBaselineRef}.`,
    "",
    "GOVERNED_CONTEXT:",
    renderScopedContextForPrompt(scoped),
    "",
    `Question: ${question}`,
  ].join("\n");

  let raw: RawAvaToolResponse;
  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: DEFAULT_AVA_MODEL,
      max_tokens: DEFAULT_AVA_MAX_TOKENS,
      system: AVA_SYSTEM_PROMPT,
      tools: [AVA_ANSWER_TOOL],
      tool_choice: { type: "tool", name: "submit_ava_answer" },
      messages: [{ role: "user", content: userPrompt }],
    });
    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    if (!toolUse) {
      return refusalAnswer(
        "aVa's model call did not return a structured answer.",
        ["The model response did not include the expected tool call."],
      );
    }
    raw = toolUse.input as RawAvaToolResponse;
  } catch (error) {
    return refusalAnswer(
      `aVa reasoning failed before a valid response was available: ${safeErrorText(error)}`,
      ["The model call failed or timed out."],
    );
  }

  const cleaned = verifyAndCleanAnswer(raw, scoped.allowedEvidenceRefs);
  if ("invalid" in cleaned) {
    return refusalAnswer(cleaned.reason, [
      "aVa's draft answer failed evidence verification and was withheld rather than shown unverified.",
    ]);
  }
  return cleaned;
}

export type FixtureAvaInterpretationDraft =
  | {
      drafted: true;
      headline: string;
      body: string;
      evidenceRefs: string[];
      pinnedBaselineRef: string;
    }
  | { drafted: false; refusalReason: string };

/**
 * Draft an AbarVaInterpretationV1-shaped narrative (headline + body) from the
 * evidence in scope. NOT part of the AvaReasoningProvider interface -- an
 * additional, explicitly opt-in capability for exercising real generation of
 * the Brief-mode "abarva_interpretation" content type. Deliberately NOT wired
 * into KnowledgeUiViewModelAssembler.getStrategicContext/getAbarVaView: those
 * read consumption.strategic_interpretation_v1 as an already-governed,
 * already-accepted publication, and the deterministic page must keep
 * rendering that governed value with every model provider disabled.
 * Live-generating it on every page load would make Brief mode's core render
 * path depend on a model call. Use this from an offline/reviewed drafting
 * flow instead -- draft, review, then a separate governed step
 * promotes/pins it.
 */
export async function runFixtureAvaDraftInterpretation(args: {
  tenantKey: string;
  packet: AvaKnowledgePacket;
}): Promise<FixtureAvaInterpretationDraft> {
  const { packet } = args;
  if (!fixtureAvaIsAvailable()) {
    return {
      drafted: false,
      refusalReason: "Model provider is not configured in this environment.",
    };
  }
  if (packet.evidenceRefs.length === 0) {
    return {
      drafted: false,
      refusalReason:
        "No accepted evidence is in scope; aVa does not draft an interpretation without evidence.",
    };
  }
  const corpus = loadCorpus(args.tenantKey);
  const scoped = scopeCorpusToPacket(corpus, packet);
  if (scopedContextIsEmpty(scoped)) {
    return {
      drafted: false,
      refusalReason:
        "The evidence in scope does not resolve to any governed content to interpret.",
    };
  }

  const tool: Anthropic.Tool = {
    name: "submit_interpretation",
    description:
      "Submit a draft strategic interpretation grounded only in GOVERNED_CONTEXT.",
    input_schema: {
      type: "object",
      properties: {
        drafted: { type: "boolean" },
        headline: { type: "string" },
        body: { type: "string" },
        evidenceRefs: { type: "array", items: { type: "string" } },
        refusalReason: { type: ["string", "null"] },
      },
      required: [
        "drafted",
        "headline",
        "body",
        "evidenceRefs",
        "refusalReason",
      ],
    },
  };
  const system = [
    "You are aVa, drafting a single strategic interpretation for an executive Knowledge brief.",
    "You will be given GOVERNED_CONTEXT: the only facts you may use. Set drafted=false and explain",
    "in refusalReason if GOVERNED_CONTEXT does not support a specific, evidence-backed headline --",
    "never draft a generic or hedged interpretation just to produce output.",
    "headline: one sentence, specific, names the actual entities/metrics involved.",
    "body: 2-3 sentences explaining the interpretation and its basis, referencing only",
    "GOVERNED_CONTEXT facts.",
    'Do not expose internal identifiers, ref ids, or JSON keys (e.g. "app-crew-sched") in the',
    "headline or body -- refer to objects only by their displayName/label.",
    "evidenceRefs must all be from GOVERNED_CONTEXT.allowedEvidenceRefs.",
    "Respond only by calling submit_interpretation.",
  ].join("\n");
  const user = [
    `Active Knowledge Baseline: ${packet.knowledgeBaselineRef}.`,
    "GOVERNED_CONTEXT:",
    renderScopedContextForPrompt(scoped),
  ].join("\n");

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: DEFAULT_AVA_MODEL,
      max_tokens: DEFAULT_AVA_MAX_TOKENS,
      system,
      tools: [tool],
      tool_choice: { type: "tool", name: "submit_interpretation" },
      messages: [{ role: "user", content: user }],
    });
    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    if (!toolUse) {
      return {
        drafted: false,
        refusalReason: "Model did not return a structured draft.",
      };
    }
    const out = toolUse.input as {
      drafted: boolean;
      headline: string;
      body: string;
      evidenceRefs: string[];
      refusalReason: string | null;
    };
    if (!out.drafted) {
      return {
        drafted: false,
        refusalReason:
          out.refusalReason?.trim() ||
          "aVa declined to draft an interpretation from the evidence in scope.",
      };
    }
    const evidenceRefs = (out.evidenceRefs ?? []).filter((r) =>
      scoped.allowedEvidenceRefs.has(r),
    );
    const headline = out.headline?.trim();
    const body = out.body?.trim();
    if (!headline || !body || evidenceRefs.length === 0) {
      return {
        drafted: false,
        refusalReason:
          "aVa's draft failed evidence verification (missing headline/body or no verifiable citation).",
      };
    }
    return {
      drafted: true,
      headline,
      body,
      evidenceRefs,
      pinnedBaselineRef: packet.knowledgeBaselineRef,
    };
  } catch (error) {
    return {
      drafted: false,
      refusalReason: `Model call failed: ${safeErrorText(error)}`,
    };
  }
}

/**
 * Attempt to draft an industry_benchmark / industry_pattern statement.
 * Included for completeness per the gap-register item, but in practice this
 * refuses against the fixture corpus every time: BenchmarkV1 entries here are
 * already the single governed data point the fixture author supplied (e.g.
 * "peer median cloud adoption = 63%") with no broader external peer dataset
 * behind them. Claude has nothing to reason over beyond restating that one
 * number, which is not a genuine new interpretation -- so the grounded thing
 * to do is refuse rather than manufacture a second opinion that looks like
 * real industry research.
 */
export async function runFixtureAvaDraftIndustryContext(args: {
  tenantKey: string;
  packet: AvaKnowledgePacket;
}): Promise<{ drafted: false; refusalReason: string }> {
  const corpus = loadCorpus(args.tenantKey);
  const scoped = scopeCorpusToPacket(corpus, args.packet);
  if (scoped.benchmarks.length === 0) {
    return {
      drafted: false,
      refusalReason:
        "No industry_benchmark/industry_pattern evidence is in scope, and the fixture corpus has no external peer dataset to draw a new comparison from.",
    };
  }
  return {
    drafted: false,
    refusalReason:
      "The fixture corpus only carries the single already-governed benchmark data point in scope; there is no independent external industry dataset for aVa to reason over, so generating an additional benchmark/pattern here would not be grounded in real peer data.",
  };
}

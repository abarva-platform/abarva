import "server-only";

/**
 * The research step: one audited Anthropic call with the web search and web
 * fetch server tools, run before a Moves deliverable build assembles its
 * evidence.
 *
 * What leaves: only the screened research brief (`research-brief.ts`) — no
 * client name, no figure, no client text. What comes back is stored for this
 * tenant and this Move as PENDING sources; nothing here is cited. Citation of
 * approved sources is a later slice.
 *
 * Where a source comes from: ONLY the API's own blocks. The URL, title and
 * excerpt come from `web_search_result_location` citations on text blocks
 * (the excerpt is the API's `cited_text`, cut to 300 characters), and the page
 * age from `web_search_tool_result` blocks. The model's own JSON only ANNOTATES
 * a cited URL (publisher, published date, claim, confidence); a JSON entry for
 * a URL the API never cited is dropped, so the model cannot add a source.
 *
 * It never throws into the build. Every outcome — flag off, empty brief,
 * egress denied, timeout, unparseable answer, storage failure — comes back as
 * a value with a status and a note, and every attempt that reached the egress
 * path is recorded as a run.
 */

import { z } from "zod";

import { policyForTier } from "@/lib/ai/document-generation-policy";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress/anthropic-direct";

import {
  buildResearchBrief,
  renderResearchBrief,
  type ResearchBriefInput,
} from "./research-brief";
import {
  findReusableResearchRun,
  insertPublicSources,
  insertResearchRun,
} from "./repository";
import {
  charLength,
  normalizePublicSourceUrl,
  PUBLIC_SOURCE_CONFIDENCE_LEVELS,
  PUBLIC_SOURCE_EXCERPT_MAX_CHARS,
  PUBLIC_SOURCES_PER_RUN_MAX,
  type NewPublicSource,
  type PublicResearchScope,
  type ResearchRunStatus,
} from "./types";

export const PUBLIC_RESEARCH_FLAG = "moves_public_source_research" as const;
export const PUBLIC_RESEARCH_WORKLOAD = "moves_public_research" as const;

/** Budgets. Together the two tool caps are the manifest's 9 tool uses. */
export const RESEARCH_WEB_SEARCH_MAX_USES = 6;
export const RESEARCH_WEB_FETCH_MAX_USES = 3;
export const RESEARCH_WEB_FETCH_MAX_CONTENT_TOKENS = 6000;
export const RESEARCH_MAX_TOOL_USES =
  RESEARCH_WEB_SEARCH_MAX_USES + RESEARCH_WEB_FETCH_MAX_USES;
export const RESEARCH_MAX_TOKENS = 4096;
export const RESEARCH_TIMEOUT_MS = 90_000;
/** How many times a paused turn is resumed before the run stops. */
export const RESEARCH_MAX_CONTINUATIONS = 3;
export const RESEARCH_CACHE_DAYS = 14;

export function researchWorkflow(deliverableType: string): string {
  return `deliverable:research:${deliverableType}`;
}

export interface PublicResearchInput {
  /** Tenant key the sources are stored under. */
  tenantClientKey: string;
  /** Client UUID: the egress identity (the audit sink writes a uuid). */
  clientId: string;
  userId?: string;
  /** The Move id. */
  programId: string;
  phase?: number | null;
  deliverableType: string;
  brief: ResearchBriefInput;
  model?: string;
}

export interface PublicResearchOptions {
  timeoutMs?: number;
  now?: () => Date;
}

export interface PublicResearchOutcome {
  status: ResearchRunStatus;
  /** `searched` called the API; `cache` reused a run; `not_run` did neither. */
  origin: "searched" | "cache" | "not_run";
  runId: string | null;
  briefHash: string | null;
  /** Sources from this result now stored and pending review. */
  pendingSources: number;
  /** Whether a run row was written (a cache hit writes none). */
  recorded: boolean;
  auditId: string | null;
  /** The sentence drafting can show. Never carries a source's content. */
  note: string;
  error: string | null;
}

export function researchCoverageNote(
  status: ResearchRunStatus,
  pendingSources: number,
): string {
  if (status === "ok" && pendingSources > 0) {
    return `${pendingSources} outside ${pendingSources === 1 ? "source" : "sources"} found, awaiting review`;
  }
  if (status === "ok") return "No outside sources found";
  return `No outside sources: research ${status}`;
}

// ── Parsing ─────────────────────────────────────────────────────────────────

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** What the model writes per cited source. Anything else is dropped. */
export const SourceAnnotationSchema = z.object({
  url: z.string().min(1),
  publisher: z.string().trim().min(1).max(200).nullable().optional(),
  publishedDate: z.string().regex(ISO_DATE).nullable().optional(),
  claim: z.string().trim().min(1).max(500),
  confidence: z.enum(PUBLIC_SOURCE_CONFIDENCE_LEVELS),
});
export type SourceAnnotation = z.infer<typeof SourceAnnotationSchema>;

type Block = Record<string, unknown>;

interface Citation {
  url: string;
  title: string | null;
  excerpt: string;
}

function asBlocks(value: unknown): Block[] {
  return Array.isArray(value)
    ? value.filter((b): b is Block => !!b && typeof b === "object")
    : [];
}

function cut(value: string, max: number): string {
  return charLength(value) > max
    ? Array.from(value).slice(0, max).join("").trim()
    : value;
}

/** First citation per https URL, from text blocks' web search citations. */
export function extractCitations(blocks: readonly Block[]): Citation[] {
  const byUrl = new Map<string, Citation>();
  for (const block of blocks) {
    if (block.type !== "text") continue;
    for (const citation of asBlocks(block.citations)) {
      if (citation.type !== "web_search_result_location") continue;
      const url = normalizePublicSourceUrl(citation.url);
      if (!url.ok || byUrl.has(url.value)) continue;
      const cited =
        typeof citation.cited_text === "string"
          ? citation.cited_text.replace(/\s+/g, " ").trim()
          : "";
      if (!cited) continue;
      byUrl.set(url.value, {
        url: url.value,
        title:
          typeof citation.title === "string" && citation.title.trim()
            ? citation.title.trim()
            : null,
        excerpt: cut(cited, PUBLIC_SOURCE_EXCERPT_MAX_CHARS),
      });
    }
  }
  return Array.from(byUrl.values());
}

/** URL → { title, page age } from the search result blocks. */
export function extractSearchResults(
  blocks: readonly Block[],
): Map<string, { title: string | null; pageAge: string | null }> {
  const out = new Map<
    string,
    { title: string | null; pageAge: string | null }
  >();
  for (const block of blocks) {
    if (block.type !== "web_search_tool_result") continue;
    // A failed search carries an error OBJECT, not a list.
    for (const result of asBlocks(block.content)) {
      if (result.type !== "web_search_result") continue;
      const url = normalizePublicSourceUrl(result.url);
      if (!url.ok || out.has(url.value)) continue;
      out.set(url.value, {
        title:
          typeof result.title === "string" && result.title.trim()
            ? result.title.trim()
            : null,
        pageAge:
          typeof result.page_age === "string" && result.page_age.trim()
            ? result.page_age.trim()
            : null,
      });
    }
  }
  return out;
}

/** A page age like "March 4, 2026" becomes 2026-03-04; "2 days ago" is null. */
export function pageAgeToDate(pageAge: string | null): string | null {
  if (!pageAge || !/\b\d{4}\b/.test(pageAge)) return null;
  const parsed = Date.parse(pageAge);
  if (Number.isNaN(parsed)) return null;
  const date = new Date(parsed);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type AnnotationParse =
  | { ok: true; annotations: SourceAnnotation[]; dropped: number }
  | { ok: false; detail: string };

/** The LAST fenced json block (or bare array) in the answer, validated per item. */
export function parseSourceAnnotations(text: string): AnnotationParse {
  const fenced = Array.from(text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi));
  let raw = fenced.length > 0 ? fenced[fenced.length - 1]![1]!.trim() : "";
  if (!raw) {
    const start = text.lastIndexOf("[");
    const end = text.lastIndexOf("]");
    raw = start >= 0 && end > start ? text.slice(start, end + 1) : "";
  }
  if (!raw) return { ok: false, detail: "no JSON source list in the answer" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, detail: "the source list is not valid JSON" };
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, detail: "the source list is not a JSON array" };
  }
  const annotations: SourceAnnotation[] = [];
  let dropped = 0;
  for (const item of parsed) {
    const result = SourceAnnotationSchema.safeParse(item);
    if (result.success) annotations.push(result.data);
    else dropped += 1;
  }
  return { ok: true, annotations, dropped };
}

/**
 * Join the API's citations with the model's annotations. A citation with no
 * valid annotation, and an annotation with no citation, are both dropped.
 * At most PUBLIC_SOURCES_PER_RUN_MAX are returned.
 */
export function assembleSources(
  blocks: readonly Block[],
  annotations: readonly SourceAnnotation[],
  retrievedAt: string,
): NewPublicSource[] {
  const searchResults = extractSearchResults(blocks);
  const annotationByUrl = new Map<string, SourceAnnotation>();
  for (const annotation of annotations) {
    const url = normalizePublicSourceUrl(annotation.url);
    if (url.ok && !annotationByUrl.has(url.value)) {
      annotationByUrl.set(url.value, annotation);
    }
  }
  const sources: NewPublicSource[] = [];
  for (const citation of extractCitations(blocks)) {
    if (sources.length >= PUBLIC_SOURCES_PER_RUN_MAX) break;
    const annotation = annotationByUrl.get(citation.url);
    if (!annotation) continue;
    const result = searchResults.get(citation.url);
    sources.push({
      kind: "public_source",
      url: citation.url,
      title:
        citation.title ??
        result?.title ??
        annotation.publisher ??
        new URL(citation.url).hostname,
      publisher: annotation.publisher ?? null,
      publishedAt:
        annotation.publishedDate ?? pageAgeToDate(result?.pageAge ?? null),
      retrievedAt,
      excerpt: citation.excerpt,
      claim: annotation.claim,
      confidence: annotation.confidence,
    });
  }
  return sources;
}

// ── The call ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = [
  "You research PUBLIC, client-neutral sources for a consulting team: government and payer program rules, payment rules, regulator guidance, standards, and published studies.",
  "The brief describes a kind of initiative, never an organisation. Do not search for any organisation by name and do not guess who the client is.",
  "Use web search to find authoritative public pages, and web fetch only to read a page a search returned. Prefer primary sources (the agency, regulator, standards body or journal).",
  "Cite every claim from a search result. Do not state a figure that is not in a cited passage.",
  'End your answer with exactly one fenced ```json block: an array with one object per source you cited, {"url": the cited URL exactly, "publisher": string or null, "publishedDate": "YYYY-MM-DD" or null, "claim": one sentence the cited passage supports, "confidence": "high" | "medium" | "low" | "unverified"}.',
].join("\n");

function userPrompt(briefText: string): string {
  return `Find public sources relevant to this initiative type.\n\n${briefText}`;
}

function errorText(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return String(error ?? "unknown error");
}

function isAbort(error: unknown, signal: AbortSignal): boolean {
  if (signal.aborted) return true;
  const name = (error as { name?: unknown } | null)?.name;
  return (
    name === "AbortError" ||
    name === "APIUserAbortError" ||
    name === "TimeoutError"
  );
}

interface CallResult {
  status: ResearchRunStatus;
  sources: NewPublicSource[];
  auditId: string | null;
  error: string | null;
}

async function searchPublicSources(
  input: PublicResearchInput,
  briefText: string,
  briefHash: string,
  options: Required<PublicResearchOptions>,
): Promise<CallResult> {
  const model = input.model ?? policyForTier("tier2_working_draft").model;
  const system = SYSTEM_PROMPT;
  const user = userPrompt(briefText);

  let preflight: Awaited<ReturnType<typeof preflightAnthropicDirectClient>>;
  try {
    preflight = await preflightAnthropicDirectClient({
      tenantId: input.clientId,
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
      workflow: researchWorkflow(input.deliverableType),
      prompt: `${system}\n\n${user}`,
      model,
      dataClass: "internal",
      artifactType: `deliverable_${input.deliverableType}`,
      workload: PUBLIC_RESEARCH_WORKLOAD,
      metadata: {
        module: "moves",
        deliverableType: input.deliverableType,
        phase: input.phase ?? null,
        briefHash,
        maxTokens: RESEARCH_MAX_TOKENS,
        webSearchMaxUses: RESEARCH_WEB_SEARCH_MAX_USES,
        webFetchMaxUses: RESEARCH_WEB_FETCH_MAX_USES,
      },
    });
  } catch (error) {
    return {
      status: "failed",
      sources: [],
      auditId: null,
      error: `preflight_failed: ${errorText(error)}`,
    };
  }
  if (!preflight.ok) {
    return {
      status: "denied",
      sources: [],
      auditId: preflight.auditId,
      error: `egress_denied: ${preflight.reason}`,
    };
  }

  const signal = AbortSignal.timeout(options.timeoutMs);
  const userMessage = { role: "user" as const, content: user };
  const collected: Block[] = [];
  let toolUses = 0;
  let stopReason: string | null = null;
  try {
    let assistantContent: Block[] | null = null;
    for (let turn = 0; turn <= RESEARCH_MAX_CONTINUATIONS; turn += 1) {
      const response = await preflight.client.messages.create(
        {
          model,
          max_tokens: RESEARCH_MAX_TOKENS,
          system,
          messages: assistantContent
            ? [
                userMessage,
                // A paused turn is resumed by sending it back as-is.
                { role: "assistant", content: assistantContent as never },
              ]
            : [userMessage],
          tools: [
            {
              type: "web_search_20260209",
              name: "web_search",
              max_uses: RESEARCH_WEB_SEARCH_MAX_USES,
            },
            {
              type: "web_fetch_20260309",
              name: "web_fetch",
              max_uses: RESEARCH_WEB_FETCH_MAX_USES,
              max_content_tokens: RESEARCH_WEB_FETCH_MAX_CONTENT_TOKENS,
            },
          ],
        },
        { signal },
      );
      const content = asBlocks((response as { content?: unknown }).content);
      collected.push(...content);
      toolUses += content.filter((b) => b.type === "server_tool_use").length;
      stopReason =
        (response as { stop_reason?: string | null }).stop_reason ?? null;
      if (stopReason !== "pause_turn") break;
      if (toolUses >= RESEARCH_MAX_TOOL_USES) break;
      assistantContent = [...(assistantContent ?? []), ...content];
    }
  } catch (error) {
    if (isAbort(error, signal)) {
      return {
        status: "timeout",
        sources: [],
        auditId: preflight.auditId,
        error: `timeout after ${options.timeoutMs} ms`,
      };
    }
    return {
      status: "failed",
      sources: [],
      auditId: preflight.auditId,
      error: `model_call_failed: ${errorText(error)}`,
    };
  }

  if (stopReason === "refusal") {
    return {
      status: "failed",
      sources: [],
      auditId: preflight.auditId,
      error: "model_refused",
    };
  }
  const text = collected
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("");
  const annotations = parseSourceAnnotations(text);
  if (!annotations.ok) {
    return {
      status: "failed",
      sources: [],
      auditId: preflight.auditId,
      error: `parse_failure: ${annotations.detail}${stopReason === "pause_turn" ? " (turn still paused at the continuation bound)" : ""}`,
    };
  }
  return {
    status: "ok",
    sources: assembleSources(
      collected,
      annotations.annotations,
      options.now().toISOString(),
    ),
    auditId: preflight.auditId,
    error: null,
  };
}

function outcome(
  partial: Omit<PublicResearchOutcome, "note">,
): PublicResearchOutcome {
  return {
    ...partial,
    note: researchCoverageNote(partial.status, partial.pendingSources),
  };
}

/**
 * Run (or reuse) public research for one Move build. Never throws.
 */
export async function runPublicResearch(
  input: PublicResearchInput,
  options: PublicResearchOptions = {},
): Promise<PublicResearchOutcome> {
  const resolved: Required<PublicResearchOptions> = {
    timeoutMs: options.timeoutMs ?? RESEARCH_TIMEOUT_MS,
    now: options.now ?? (() => new Date()),
  };
  const base = {
    runId: null,
    pendingSources: 0,
    recorded: false,
    auditId: null,
    error: null,
  };
  try {
    // Defence in depth: the build hook checks the flag first. An unenrolled
    // tenant gets no egress and no write, not even a `skipped` row.
    if (
      !isFeatureEnabled(
        { clientKey: input.tenantClientKey },
        PUBLIC_RESEARCH_FLAG,
      )
    ) {
      return outcome({
        ...base,
        status: "skipped",
        origin: "not_run",
        briefHash: null,
        error: "flag_off",
      });
    }

    const scope: PublicResearchScope = {
      tenantKey: input.tenantClientKey,
      programId: input.programId,
    };
    const startedAt = resolved.now();
    const built = buildResearchBrief(input.brief);
    const phase =
      typeof input.phase === "number" && Number.isInteger(input.phase)
        ? input.phase
        : null;

    const record = async (
      status: ResearchRunStatus,
      sourceCount: number,
      auditId: string | null,
      error: string | null,
    ) => {
      const finished = resolved.now();
      return insertResearchRun(scope, {
        phase,
        briefHash: built.briefHash,
        status,
        sourceCount,
        auditId,
        startedAt: startedAt.toISOString(),
        completedAt: finished.toISOString(),
        durationMs: Math.max(0, finished.getTime() - startedAt.getTime()),
        error,
      });
    };

    if (built.empty) {
      const run = await record("skipped", 0, null, "empty_brief");
      return outcome({
        ...base,
        status: "skipped",
        origin: "not_run",
        briefHash: built.briefHash,
        runId: run.ok ? run.run.id : null,
        recorded: run.ok,
        error: run.ok
          ? "empty_brief"
          : `empty_brief; run not recorded: ${run.reason}`,
      });
    }

    const since = new Date(
      startedAt.getTime() - RESEARCH_CACHE_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    const cached = await findReusableResearchRun(scope, built.briefHash, since);
    if (cached.ok && cached.run) {
      return outcome({
        ...base,
        status: "ok",
        origin: "cache",
        briefHash: built.briefHash,
        runId: cached.run.id,
        pendingSources: cached.pendingSourceCount,
        auditId: cached.run.auditId,
      });
    }
    // A failed cache read is not a reason to skip research; it searches.

    const call = await searchPublicSources(
      input,
      renderResearchBrief(built.brief),
      built.briefHash,
      resolved,
    );
    const run = await record(
      call.status,
      call.sources.length,
      call.auditId,
      call.error,
    );
    if (!run.ok) {
      return outcome({
        ...base,
        status: call.status === "ok" ? "failed" : call.status,
        origin: "searched",
        briefHash: built.briefHash,
        auditId: call.auditId,
        error: `run not recorded: ${run.reason}${call.error ? `; ${call.error}` : ""}`,
      });
    }
    if (call.status !== "ok" || call.sources.length === 0) {
      return outcome({
        ...base,
        status: call.status,
        origin: "searched",
        briefHash: built.briefHash,
        runId: run.run.id,
        recorded: true,
        auditId: call.auditId,
        error: call.error,
      });
    }
    const stored = await insertPublicSources(scope, run.run.id, call.sources);
    if (!stored.ok) {
      return outcome({
        ...base,
        status: "failed",
        origin: "searched",
        briefHash: built.briefHash,
        runId: run.run.id,
        recorded: true,
        auditId: call.auditId,
        error: `sources not stored: ${stored.reason}`,
      });
    }
    return outcome({
      ...base,
      status: "ok",
      origin: "searched",
      briefHash: built.briefHash,
      runId: run.run.id,
      recorded: true,
      auditId: call.auditId,
      pendingSources: stored.inserted.length,
    });
  } catch (error) {
    return outcome({
      ...base,
      status: "failed",
      origin: "not_run",
      briefHash: null,
      error: `research_step_failed: ${errorText(error)}`,
    });
  }
}

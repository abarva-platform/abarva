/**
 * The research brief: the ONLY thing about a Move that leaves for the public
 * web during governed public-source research.
 *
 * The brief's text becomes search queries the model sends to a public search
 * engine, so it is built from an ALLOWLIST of declared Move fields and nothing
 * else:
 *
 *   - industry          (the tenant's declared industry code)
 *   - archetype         (the declared archetype identifier)
 *   - use case          (a declared use-case label)
 *   - value levers      (lever NAMES chosen in capture, e.g. "cycle time")
 *   - register questions (open questions from the Move's register, optional)
 *
 * Every value is screened before it is admitted, and a value that fails a
 * screen is DROPPED WHOLE, never trimmed into something that looks clean:
 *
 *   - no figures: any digit, currency or percent sign drops the value;
 *   - no names: any tenant name, cover name or alias known to the tenant
 *     registry (derived from code, never hand-typed), and any name the caller
 *     adds (the client's display name), drops the value;
 *   - no free text: a term longer than a short label, or with characters a
 *     label does not carry, drops the value; a register question must be one
 *     short question.
 *
 * Pure (no I/O). The brief hash keys the 14-day research cache.
 */

import { createHash } from "node:crypto";

import {
  CANONICAL_TENANT_KEYS,
  resolveTenantAlias,
  tenantAliasesFor,
} from "@/lib/tenant/aliases";

/** The allowlisted fields. Anything else on a Move never reaches the brief. */
export const RESEARCH_BRIEF_FIELDS = [
  "industry",
  "archetype",
  "useCase",
  "valueLevers",
  "registerQuestions",
] as const;
export type ResearchBriefField = (typeof RESEARCH_BRIEF_FIELDS)[number];

/** A label is a few words; anything longer is free text. */
export const BRIEF_TERM_MAX_WORDS = 6;
export const BRIEF_TERM_MAX_CHARS = 60;
/** A register question is one short question. */
export const BRIEF_QUESTION_MAX_WORDS = 25;
export const BRIEF_QUESTION_MAX_CHARS = 200;
export const BRIEF_VALUE_LEVERS_MAX = 6;
export const BRIEF_REGISTER_QUESTIONS_MAX = 5;

export interface ResearchBriefInput {
  industry?: string | null;
  archetype?: string | null;
  useCase?: string | null;
  valueLevers?: readonly (string | null | undefined)[] | null;
  /** Open register questions, when the Move has a register. Optional. */
  registerQuestions?: readonly (string | null | undefined)[] | null;
  /**
   * Names that must never leave (for example the client's display name).
   * Added to the tenant registry's names, never replacing them.
   */
  deniedNames?: readonly (string | null | undefined)[] | null;
}

export interface ResearchBrief {
  industry: string | null;
  archetype: string | null;
  useCase: string | null;
  valueLevers: string[];
  registerQuestions: string[];
}

export type BriefDropReason =
  | "figure"
  | "name"
  | "free_text"
  | "empty"
  | "over_limit";

/** Why a value was left out. Carries the field, never the value. */
export interface BriefDrop {
  field: ResearchBriefField;
  reason: BriefDropReason;
}

export interface BuiltResearchBrief {
  brief: ResearchBrief;
  briefHash: string;
  /** True when no allowlisted field survived; there is nothing to research. */
  empty: boolean;
  dropped: BriefDrop[];
}

const FIGURE = /[\p{Nd}$€£¥%‰]/u;
const TERM_CHARS = /^[\p{L} /&]+$/u;
const QUESTION_CHARS = /^[\p{L} ,'’/&()-]+\?$/u;

function words(value: string): string[] {
  return value.split(" ").filter(Boolean);
}

/** Lowercase, identifiers spelled as words, whitespace collapsed. */
function normalizeSpelling(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeName(value: string): string {
  return normalizeSpelling(value)
    .replace(/[^\p{L}\p{Nd} ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every tenant name the registry knows: canonical keys, aliases, display
 * names. Derived from code so a new tenant is covered the day it is added.
 */
export function registryDeniedNames(): string[] {
  const names = new Set<string>();
  for (const key of CANONICAL_TENANT_KEYS) {
    for (const alias of tenantAliasesFor(key)) names.add(alias);
    const profile = resolveTenantAlias(key);
    if (profile) {
      names.add(profile.displayName);
      names.add(profile.appClientKey);
      names.add(profile.brokerKey);
    }
  }
  return Array.from(names);
}

function deniedNameSet(extra: ResearchBriefInput["deniedNames"]): string[] {
  const all = [...registryDeniedNames(), ...(extra ?? [])];
  const out = new Set<string>();
  for (const name of all) {
    if (typeof name !== "string") continue;
    const normalized = normalizeName(name);
    if (normalized.length >= 2) out.add(normalized);
  }
  return Array.from(out);
}

function containsName(value: string, denied: readonly string[]): boolean {
  const haystack = ` ${normalizeName(value)} `;
  return denied.some((name) => haystack.includes(` ${name} `));
}

type Screened =
  | { ok: true; value: string }
  | { ok: false; reason: BriefDropReason };

function screenTerm(raw: unknown, denied: readonly string[]): Screened {
  if (typeof raw !== "string" || !raw.trim())
    return { ok: false, reason: "empty" };
  if (FIGURE.test(raw)) return { ok: false, reason: "figure" };
  const value = normalizeSpelling(raw);
  if (containsName(value, denied)) return { ok: false, reason: "name" };
  if (
    !TERM_CHARS.test(value) ||
    words(value).length > BRIEF_TERM_MAX_WORDS ||
    value.length > BRIEF_TERM_MAX_CHARS
  ) {
    return { ok: false, reason: "free_text" };
  }
  return { ok: true, value };
}

function screenQuestion(raw: unknown, denied: readonly string[]): Screened {
  if (typeof raw !== "string" || !raw.trim())
    return { ok: false, reason: "empty" };
  if (FIGURE.test(raw)) return { ok: false, reason: "figure" };
  const value = raw.normalize("NFKC").replace(/\s+/g, " ").trim();
  if (containsName(value, denied)) return { ok: false, reason: "name" };
  if (
    !QUESTION_CHARS.test(value) ||
    words(value).length > BRIEF_QUESTION_MAX_WORDS ||
    value.length > BRIEF_QUESTION_MAX_CHARS
  ) {
    return { ok: false, reason: "free_text" };
  }
  return { ok: true, value };
}

function screenList(
  field: ResearchBriefField,
  raw: readonly unknown[] | null | undefined,
  screen: (value: unknown, denied: readonly string[]) => Screened,
  denied: readonly string[],
  max: number,
  dropped: BriefDrop[],
): string[] {
  const kept = new Set<string>();
  for (const item of raw ?? []) {
    const result = screen(item, denied);
    if (!result.ok) {
      if (result.reason !== "empty")
        dropped.push({ field, reason: result.reason });
      continue;
    }
    if (kept.has(result.value)) continue;
    if (kept.size >= max) {
      dropped.push({ field, reason: "over_limit" });
      continue;
    }
    kept.add(result.value);
  }
  return Array.from(kept).sort();
}

/** The cache key: a hash of the screened brief, never of the raw input. */
export function hashResearchBrief(brief: ResearchBrief): string {
  const canonical = JSON.stringify([
    brief.industry,
    brief.archetype,
    brief.useCase,
    brief.valueLevers,
    brief.registerQuestions,
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}

export function buildResearchBrief(
  input: ResearchBriefInput,
): BuiltResearchBrief {
  const denied = deniedNameSet(input.deniedNames);
  const dropped: BriefDrop[] = [];
  const single = (field: ResearchBriefField, raw: unknown): string | null => {
    const result = screenTerm(raw, denied);
    if (result.ok) return result.value;
    if (result.reason !== "empty")
      dropped.push({ field, reason: result.reason });
    return null;
  };
  const brief: ResearchBrief = {
    industry: single("industry", input.industry),
    archetype: single("archetype", input.archetype),
    useCase: single("useCase", input.useCase),
    valueLevers: screenList(
      "valueLevers",
      input.valueLevers,
      screenTerm,
      denied,
      BRIEF_VALUE_LEVERS_MAX,
      dropped,
    ),
    registerQuestions: screenList(
      "registerQuestions",
      input.registerQuestions,
      screenQuestion,
      denied,
      BRIEF_REGISTER_QUESTIONS_MAX,
      dropped,
    ),
  };
  const empty =
    !brief.industry &&
    !brief.archetype &&
    !brief.useCase &&
    brief.valueLevers.length === 0 &&
    brief.registerQuestions.length === 0;
  return { brief, briefHash: hashResearchBrief(brief), empty, dropped };
}

/** The brief as the research prompt states it. Only screened values appear. */
export function renderResearchBrief(brief: ResearchBrief): string {
  const lines: string[] = [];
  if (brief.industry) lines.push(`Industry: ${brief.industry}`);
  if (brief.archetype) lines.push(`Archetype: ${brief.archetype}`);
  if (brief.useCase) lines.push(`Use case: ${brief.useCase}`);
  if (brief.valueLevers.length > 0) {
    lines.push(`Value levers: ${brief.valueLevers.join("; ")}`);
  }
  if (brief.registerQuestions.length > 0) {
    lines.push("Open questions:");
    for (const question of brief.registerQuestions) lines.push(`- ${question}`);
  }
  return lines.join("\n");
}

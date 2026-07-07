// =============================================================================
// Board-grade, Claude-GENERATED Move deliverables — grounded in committed evidence.
// -----------------------------------------------------------------------------
// The deterministic generator (deliverable-refinement.ts) proves grounding but
// reads like a checklist. THIS produces the real, senior-partner-quality narrative
// by handing Claude the GOVERNED EVIDENCE BUNDLE (the committed, cited facts + the
// open gaps) and constraining it: use only bundle facts, cite each, name gaps as
// open items, never fabricate. Rich prose AND grounded — the same governed-LLM
// pattern proven in the Source reasoning chain.
//
// Degrades gracefully: if ANTHROPIC_API_KEY is absent / egress denied, the caller
// falls back to the deterministic grounded draft.
// =============================================================================

import "server-only";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { GeneratedDeliverable } from "@/lib/programs/deliverable-refinement";
import type { DeliverableSpec } from "@/lib/programs/archetypes/types";
import {
  resolveSourceLabel,
  scrubInternalSourceTags,
} from "@/lib/programs/deliverables/source-labels";

export interface NarrativeDeliverable {
  label: string;
  markdown: string;
  /** Governance carried from the grounded base — the evidence boundary. */
  envelope: GeneratedDeliverable["envelope"];
  model: string;
  generatedByClaude: true;
  evidenceFactCount: number;
  openGapCount: number;
}

/** The evidence boundary Claude must stay within: committed cited facts + gaps. */
export function buildEvidenceBundle(base: GeneratedDeliverable): {
  facts: string[];
  gaps: string[];
} {
  const facts: string[] = [];
  const gaps: string[] = [];
  for (const s of base.sections) {
    for (const c of s.claims) {
      if (c.missingEvidence) {
        gaps.push(
          `${c.text.replace(/^\[MISSING EVIDENCE\]\s*/, "").trim()} (needs: ${resolveSourceLabel(c.missingEvidence).title})`,
        );
      } else if (c.citation) {
        // The citation is shown to Claude (and kept inline in the body) — it
        // MUST be the human-readable source name, never the raw internal id.
        facts.push(
          `${c.text} [source: ${resolveSourceLabel(c.citation).title}]`,
        );
      }
    }
  }
  return {
    facts: Array.from(new Set(facts)),
    gaps: Array.from(new Set(gaps)),
  };
}

function buildSystemPrompt(spec: DeliverableSpec, moveName: string): string {
  return [
    `You are a senior partner at a top-tier strategy firm (McKinsey/BCG caliber) writing a board-grade ${spec.label} for the initiative "${moveName}".`,
    `Write for a CEO/board audience: specific, decisive, structured, and concise. Every sentence earns its place.`,
    ``,
    `ABSOLUTE GROUNDING RULES (non-negotiable — you will be audited):`,
    `1. Use ONLY facts from the EVIDENCE BUNDLE. Every quantitative, named, or dated claim MUST trace to a bundle fact, with its [source: ...] kept inline.`,
    `2. NEVER invent numbers, vendor names, benchmarks, dates, people, or industry statistics that are not in the bundle. No "typically 20-30%" filler.`,
    `3. For each OPEN GAP, write an explicit "Open item — <what is needed and why it matters for this decision>". Do not paper over gaps or imply you have the data.`,
    `4. If a required section has thin evidence, say so plainly and state exactly what to collect next. A shorter honest section beats a padded one.`,
    ``,
    `STRUCTURE: use exactly these H2 sections, in order: ${spec.sections.join("; ")}.`,
    `For each: lead with the decision/insight (1-2 sentences), then the cited evidence, then the implication. Use tight paragraphs with selective bullets. Open with a 3-4 sentence executive summary that a board could read alone.`,
    `Output GitHub-flavored Markdown only. No preamble, no "here is the charter" — start with the title.`,
  ].join("\n");
}

function buildUserPrompt(args: {
  spec: DeliverableSpec;
  moveName: string;
  tenant: string;
  archetype: string;
  facts: string[];
  gaps: string[];
}): string {
  return [
    `INITIATIVE: ${args.moveName}`,
    `TENANT: ${args.tenant} · ARCHETYPE: ${args.archetype}`,
    ``,
    `EVIDENCE BUNDLE — committed, cited facts you MAY use (and must cite):`,
    args.facts.length
      ? args.facts.map((f) => `• ${f}`).join("\n")
      : "(no committed evidence yet — the charter must say so honestly)",
    ``,
    `OPEN GAPS — evidence NOT yet available. Address each as an "Open item"; do NOT invent values for them:`,
    args.gaps.length ? args.gaps.map((g) => `• ${g}`).join("\n") : "(none)",
    ``,
    `Write the complete ${args.spec.label} now.`,
  ].join("\n");
}

/**
 * Generate the board-grade narrative deliverable with Claude, constrained to the
 * governed evidence bundle. Throws if egress is unavailable/denied (caller falls
 * back to the deterministic grounded draft).
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateNarrativeDeliverable(args: {
  spec: DeliverableSpec;
  base: GeneratedDeliverable;
  /** Display/grounding tenant (client key, e.g. "skyharbor"). */
  tenant: string;
  /** Tenant UUID for the egress audit row (client_id). */
  tenantId: string;
  moveId: string;
  moveName: string;
  userId?: string;
  model?: string;
  maxTokens?: number;
}): Promise<NarrativeDeliverable> {
  const { facts, gaps } = buildEvidenceBundle(args.base);
  const model =
    args.model ??
    process.env.MOVES_DELIVERABLE_MODEL ??
    process.env.NEXUS_COMPOSER_MODEL ??
    "claude-opus-4-7";
  const system = buildSystemPrompt(args.spec, args.moveName);
  const prompt = buildUserPrompt({
    spec: args.spec,
    moveName: args.moveName,
    tenant: args.tenant,
    archetype: args.base.envelope.archetypeResolved,
    facts,
    gaps,
  });

  const { client } = await getAuditedAnthropicClient({
    // Audit columns are UUID-typed — pass the tenant UUID, not the client key,
    // and only pass a UUID-shaped userId (operator personas may be "clerk:...").
    tenantId: UUID_RE.test(args.tenantId) ? args.tenantId : args.tenant,
    userId: args.userId && UUID_RE.test(args.userId) ? args.userId : undefined,
    workflow: "moves_deliverable_generation",
    model,
    prompt: [system, prompt].join("\n\n"),
    dataClass: "confidential",
    artifactId: args.moveId,
    artifactType: args.spec.key,
    metadata: {
      deliverable: args.spec.key,
      facts: facts.length,
      gaps: gaps.length,
    },
  });

  const stream = await client.messages.create({
    model,
    max_tokens: args.maxTokens ?? 6000,
    system,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  let markdown = "";
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      markdown += event.delta.text;
    }
  }

  return {
    label: args.spec.label,
    // Defense-in-depth: scrub any internal id the model may have echoed before
    // the markdown reaches a client surface.
    markdown: scrubInternalSourceTags(markdown.trim()),
    envelope: args.base.envelope,
    model,
    generatedByClaude: true,
    evidenceFactCount: facts.length,
    openGapCount: gaps.length,
  };
}

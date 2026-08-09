// d09 RFP Pack — parallel map-reduce generator.
//
// Replaces the monolithic 128k-token single call (8-9 min wall-clock)
// with 10 parallel section calls (§2-§11) then a fast assembly pass
// for §1. Total wall-clock: ~2-3 min.
//
// Each section call produces one self-contained heading + table + prose
// block. The assembly pass generates §1 (exec summary) after seeing all
// other sections, then stitches the document in order.
//
// Default path for d09 generation. Set ABARVA_SOURCE_D09_MAP_REDUCE=0
// to opt out and fall back to the legacy single-call path.
//
// The assembled body feeds directly into the existing quality gate and
// d09-completion governance appender — no other route changes required.

import type {
  AnthropicDirectClient,
} from "@/lib/integrations/ai-egress";
import type { SourceGenerationContext } from "./types";
import { SOURCE_VENDOR_RESPONSE_CONTROL_MANDATE } from "./prompt-registry";

const SECTION_MODEL = "claude-opus-4-8";
const SECTION_MAX_TOKENS = 4_000;
const ASSEMBLY_MAX_TOKENS = 2_000;

const SENTINEL_VOICE = `You are a senior sourcing and vendor-strategy advisor writing for a CIO and their leadership team. You have personally run dozens of large-enterprise sourcing events. You write with the judgment, structure, and candor of a top-tier consulting partner — never like a template engine or a compliance checklist.

Format requirements:
- Markdown only. Use ## for section headers and ### for subsections.
- Tables when comparing. Bullet lists when enumerating.
- Numbered §-prefixed sections (## §N · …) match the AbarVa house style.
- No fabrication. If evidence is missing, say so explicitly and surface it as a gap.`;

// ── Section definitions ─────────────────────────────────────────────────────

interface SectionDef {
  key: string;
  heading: string;
  instruction: string;
}

const D09_PARALLEL_SECTIONS: SectionDef[] = [
  {
    key: "s2",
    heading: "§2 · Enterprise current-state baseline",
    instruction: `Write ONLY ## §2 · Enterprise current-state baseline.
300 words max of narrative. Include one mandatory current-state baseline table with columns:
Application/Workload | Hosting | Criticality | FTE | Run Cost | Data Center | Network | Security/Compliance | Contract | Run-vs-Change
6 rows max. Draw from uploaded evidence (Exhibits 01, 03, 04, 11, 12, 15) and upstream context only. No fabrication.`,
  },
  {
    key: "s3",
    heading: "§3 · Scope, service towers, and exclusions",
    instruction: `Write ONLY ## §3 · Scope, service towers, and exclusions.
250 words max. Include one in-scope/out-of-scope service tower matrix:
Tower | In/Out | Description | Exclusions
6 rows max. Quote scope from the d05 scope memo verbatim where applicable. Be exhaustive about exclusions — anything not listed is implicitly out. Reference Exhibit 06 (tower scope/service catalog) if uploaded.`,
  },
  {
    key: "s4",
    heading: "§4 · Application, workload, infrastructure, network, and cloud estate",
    instruction: `Write ONLY ## §4 · Application, workload, infrastructure, network, and cloud estate.
250 words max. Include one estate table:
App/System | Workload Type | Hosting | Criticality | Support Tier | Volume Indicator
6 rows max. Draw from d04 application inventory and Exhibits 01, 03, 11, 12 where available. Note data center / private cloud / SD-WAN / cloud mix.`,
  },
  {
    key: "s5",
    heading: "§5 · Service-level, operational, and security obligations",
    instruction: `Write ONLY ## §5 · Service-level, operational, and security obligations.
250 words max. Include one SLA/obligations table:
Metric | Current Baseline | Required SLA | Measurement Period | Credit/Penalty
6 rows max. Draw from d07 ticket synthesis and Exhibits 02, 05, 13 where available. Include security and compliance obligations.`,
  },
  {
    key: "s6",
    heading: "§6 · Transition approach, blackout constraints, and risk controls",
    instruction: `Write ONLY ## §6 · Transition approach, blackout constraints, and risk controls.
300 words max. Include one transition/blackout table:
Milestone | Planned Date | Blackout Window | Risk | Mitigation | Owner
6 rows max. Reference Exhibit 14 (transition ops blackout calendar) if uploaded. Use gate-relative target dates when exact dates are genuinely missing; do not use bracketed client fill-in markers.`,
  },
  {
    key: "s7",
    heading: "§7 · Commercial model, run/change baseline, and pricing instructions",
    instruction: `Write ONLY ## §7 · Commercial model, run/change baseline, and pricing instructions.
Include one pricing/commercial table:
Item | Basis | Vendor-to-Complete | Notes
Minimum 4 rows. Reference Exhibit 08 (pricing assumptions) and Exhibit 15 (run-vs-change baseline) if uploaded. Reference the value-target range from d01 without disclosing internal sensitivity. Instruct vendors to complete the Pricing Response tab in the single Vendor Response Workbook. Do not create separate pricing-file burden unless a counsel-approved schedule explicitly requires it.`,
  },
  {
    key: "s8",
    heading: "§8 · Vendor response instructions and mandatory submission tables",
    instruction: `Write ONLY ## §8 · Vendor response instructions and mandatory submission tables.
Include the following response-compliance mandate:
${SOURCE_VENDOR_RESPONSE_CONTROL_MANDATE}

Include one vendor response-control table:
Required Deliverable | Format | Required Completion Rule | Downstream Use | Due Date | Notes
Minimum 8 rows and include the single Vendor Response Workbook tabs: Guide, Mandatory Compliance, Vendor Claim Register, Solution Approach, Pricing Response, Staffing and Location Model, SLA Commitment Table, Assumptions and Exclusions Log, Transition Plan Template, Commercial Exceptions Table, and Evidence Checklist. Reference Exhibit 10 (vendor response expectations) if uploaded. Use gate-relative target dates for submission dates when exact dates are missing; do not use bracketed client fill-in markers.`,
  },
  {
    key: "s9",
    heading: "§9 · Evaluation framework, weights, and disqualification rules",
    instruction: `Write ONLY ## §9 · Evaluation framework, weights, and disqualification rules.
Table only. 6 rows max. Columns:
Evaluation Area | Weight (%) | Scoring Basis | Disqualification / Red Flag | Evidence Source
Weights must sum to 100%. Include shortlist threshold. Include at least one disqualification rule. Reference Exhibit 09 (evaluation criteria and weights) if uploaded.`,
  },
  {
    key: "s10",
    heading: "§10 · Risk register, transition controls, and failure modes",
    instruction: `Write ONLY ## §10 · Risk register, transition controls, and failure modes.
Table only. 8 rows max. Columns:
Risk ID | Failure Mode | Evidence Source | Owner Placeholder | Mitigation | Blocking Gate
Reference Exhibits 07, 13, and 14 where applicable.`,
  },
  {
    key: "s11",
    heading: "§11 · Source register, assumptions, and client-to-complete gaps",
    instruction: `Write ONLY ## §11 · Source register, assumptions, and issue-to-release gaps.
Two tables only. 8 rows max each.

Table A — Source register:
Source | Status | Used In Sections | Remaining Action
Separate: locked uploaded evidence / upstream draft artifacts / working assumptions / issue-to-release gaps.

Table B — Gap closure register:
Gap ID | Item | Owner Placeholder | Due Date Placeholder | Blocking Gate | Downstream Impact
Every unresolved item must appear in Table B.`,
  },
];

// ── Shared context block ────────────────────────────────────────────────────

function buildSharedContext(
  ctx: SourceGenerationContext,
  upstream: Record<string, string | null>,
): string {
  const lines: string[] = [
    `Company: ${ctx.tenantName}`,
    `Event: ${ctx.event.name} (${ctx.event.code})`,
    ctx.event.archetype ? `Archetype: ${ctx.event.archetype}` : null,
    ctx.event.rigor ? `Rigor: ${ctx.event.rigor}` : null,
    ctx.event.owner ? `Decision owner: ${ctx.event.owner}` : null,
    "",
    "— UPSTREAM CONTEXT —",
    "",
    "Approved Sourcing Strategy Memo (d01_strategy_memo):",
    upstream.d01_strategy_memo ??
      "(NOT YET AUTHORED — surface the gap in the draft, do not fabricate)",
    "",
    "Approved Scope Memo (d05_scope_memo):",
    upstream.d05_scope_memo ??
      "(NOT YET AUTHORED — surface the gap in the draft, do not fabricate)",
    "",
  ].filter((l): l is string => l !== null);

  if (upstream.d02_value_target) {
    lines.push("Value Target Brief (d02_value_target):");
    lines.push(upstream.d02_value_target);
    lines.push("");
  }
  if (upstream.d04_app_inv) {
    lines.push("Application Inventory (d04_app_inv):");
    lines.push(upstream.d04_app_inv);
    lines.push("");
  }
  if (upstream.d07_ticket_synth) {
    lines.push("Ticket History Synthesis (d07_ticket_synth):");
    lines.push(upstream.d07_ticket_synth);
    lines.push("");
  }

  if (ctx.evidence.length > 0) {
    lines.push("— EVIDENCE STATE SUMMARY —");
    lines.push(
      ctx.evidence
        .map((e) =>
          [
            `- ${e.requirementId}`,
            `state=${e.currentState}`,
            e.notes ? `notes=${e.notes}` : null,
          ]
            .filter(Boolean)
            .join("; "),
        )
        .join("\n"),
    );
    lines.push("");
  }

  const uploaded = ctx.uploadedEvidence ?? [];
  if (uploaded.length > 0) {
    lines.push("— PARSED UPLOADED EVIDENCE —");
    for (const artifact of uploaded) {
      lines.push(`### ${artifact.originalName}`);
      lines.push(
        `parse=${artifact.parseStatus}; evidence=${artifact.evidenceState}; stage=${artifact.stageKey}`,
      );
      for (const excerpt of artifact.chunkExcerpts.slice(0, 2)) {
        lines.push(`- ${excerpt}`);
      }
      for (const fact of artifact.factSummaries.slice(0, 2)) {
        lines.push(`- ${fact}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ── Section generation ──────────────────────────────────────────────────────

export interface D09SectionResult {
  key: string;
  body: string;
  tokensOut: number;
  error?: string;
}

async function generateSection(args: {
  section: SectionDef;
  sharedContext: string;
  client: AnthropicDirectClient;
}): Promise<D09SectionResult> {
  const { section, sharedContext, client } = args;
  const systemPrompt = `${SENTINEL_VOICE}

You are writing a single section of the d09 RFP Package for a large enterprise sourcing event. Output ONLY the markdown for this one section. Do not include any other sections, preamble, or closing remarks. The section must begin with the heading: ## ${section.heading}`;

  const userMessage = `${sharedContext}\n\n${section.instruction}`;

  try {
    const result = await streamAnthropicMarkdown({
      client,
      model: SECTION_MODEL,
      max_tokens: SECTION_MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    return {
      key: section.key,
      body: result.text,
      tokensOut: result.outputTokens,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[d09-map-reduce] section ${section.key} failed: ${errMsg}`);
    return {
      key: section.key,
      body: `## ${section.heading}\n\n*Section generation failed — retry required. Error: ${errMsg}*`,
      tokensOut: 0,
      error: errMsg,
    };
  }
}

// ── Assembly pass: §1 + stitch ──────────────────────────────────────────────

async function assembleWithExecSummary(args: {
  sharedContext: string;
  sectionResults: D09SectionResult[];
  client: AnthropicDirectClient;
}): Promise<{ body: string; tokensOut: number }> {
  const { sharedContext, sectionResults, client } = args;

  const sectionsText = sectionResults.map((r) => r.body).join("\n\n---\n\n");

  const systemPrompt = `${SENTINEL_VOICE}

You are writing §1 of the d09 RFP Package. You have been given the complete §2-§11 sections. Write ONLY ## §1 · Executive summary and decision context. 250 words max, plus a 5-row decision table with columns: Decision Area | Current Position | This RFP Addresses | Owner | Gate. Reference facts from the sections below. Be concise and decision-focused.`;

  const userMessage = `${sharedContext}\n\n— DRAFTED SECTIONS §2-§11 —\n\n${sectionsText}\n\nWrite ## §1 · Executive summary and decision context now.`;

  let execSummary = "";
  let tokensOut = 0;
  try {
    const result = await streamAnthropicMarkdown({
      client,
      model: SECTION_MODEL,
      max_tokens: ASSEMBLY_MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    execSummary = result.text;
    tokensOut = result.outputTokens;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[d09-map-reduce] assembly pass failed: ${errMsg}`);
    execSummary =
      "## §1 · Executive summary and decision context\n\n*Executive summary generation failed — retry required.*";
  }

  // Stitch in canonical section order: §1, then §2-§11
  const body = [execSummary, ...sectionResults.map((r) => r.body)]
    .filter(Boolean)
    .join("\n\n");

  return { body, tokensOut };
}

async function streamAnthropicMarkdown(args: {
  client: AnthropicDirectClient;
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: "user"; content: string }>;
}): Promise<{ text: string; outputTokens: number }> {
  const stream = args.client.messages.stream({
    model: args.model,
    max_tokens: args.max_tokens,
    system: args.system,
    messages: args.messages,
  });
  const parts: string[] = [];
  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      parts.push(chunk.delta.text);
    }
  }
  const finalMessage = await stream.finalMessage();
  return {
    text: parts.join("").trim(),
    outputTokens: finalMessage.usage?.output_tokens ?? 0,
  };
}

// ── Public entry point ──────────────────────────────────────────────────────

export interface D09MapReduceResult {
  body: string;
  sectionResults: D09SectionResult[];
  tokensTotal: number;
  failedSections: string[];
}

export async function generateD09ViaMapReduce(args: {
  ctx: SourceGenerationContext;
  upstreamBound: Record<string, string | null>;
  client: AnthropicDirectClient;
}): Promise<D09MapReduceResult> {
  const { ctx, upstreamBound, client } = args;
  const sharedContext = buildSharedContext(ctx, upstreamBound);

  // Pass 1: parallel section generation §2-§11
  const sectionResults = await Promise.all(
    D09_PARALLEL_SECTIONS.map((section) =>
      generateSection({ section, sharedContext, client }),
    ),
  );

  const failedSections = sectionResults
    .filter((r) => r.error !== undefined)
    .map((r) => r.key);

  if (failedSections.length > 0) {
    console.warn(
      `[d09-map-reduce] ${failedSections.length} section(s) failed: ${failedSections.join(", ")}`,
    );
  }

  // Pass 2: executive summary + assembly
  const { body, tokensOut: assemblyTokens } = await assembleWithExecSummary({
    sharedContext,
    sectionResults,
    client,
  });

  const tokensTotal =
    sectionResults.reduce((sum, r) => sum + r.tokensOut, 0) + assemblyTokens;

  return { body, sectionResults, tokensTotal, failedSections };
}

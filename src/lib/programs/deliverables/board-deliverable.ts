// =============================================================================
// Board-grade deliverable generator — the "deliverable factory" entry point.
// -----------------------------------------------------------------------------
// Turns the move's grounded evidence into a clean, citation-hygienic, structured
// board document: builds a numbered Source Register, scrubs internal ids, prompts
// Claude with the section contract + clean evidence + open items + formatting +
// citation rules, post-processes the body to guarantee no tag leakage, and runs
// the quality gate. Returns the result + a QualityReport (export is blocked if it
// does not pass). Reusable across deliverable types via the contract registry.
// =============================================================================

import "server-only";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { getClientOption } from "@/lib/client-config";
import type { GeneratedDeliverable } from "@/lib/programs/deliverable-refinement";
import {
  buildSourceRegister,
  applyCitationsToBody,
  resolveSourceLabel,
  type SourceRegisterEntry,
} from "./source-labels";
import {
  type DeliverableContract,
  authoredSectionTitles,
  authoredTableSectionTitles,
} from "./contracts";
import {
  validateDeliverableQuality,
  type QualityReport,
} from "./quality-validator";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TENANT_DISPLAY: Record<string, string> = {
  skyharbor: getClientOption("skyharbor").name,
  "skyharbor-air": getClientOption("skyharbor").name,
  "apex-retail": getClientOption("apexretail").name,
  apexretail: getClientOption("apexretail").name,
  "meridian-health": getClientOption("meridian").name,
  "first-capital": getClientOption("arcturus").name,
  "lakeshore-holdings": getClientOption("lakeshore").name,
  "northstar-clinical": getClientOption("northstar").name,
};

export function tenantDisplayName(clientKey: string): string {
  const k = (clientKey || "").toLowerCase();
  if (TENANT_DISPLAY[k]) return TENANT_DISPLAY[k];
  return k
    .replace(/[-_]+/g, " ")
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .trim();
}

export interface BoardDeliverableResult {
  deliverableType: string;
  label: string;
  clientName: string;
  moveName: string;
  version: string;
  date: string;
  confidentiality: string;
  bodyMarkdown: string;
  sourceRegister: SourceRegisterEntry[];
  openItems: string[];
  clientCompleteItems: string[];
  unsupportedClaims: string[];
  model: string;
  generatedByClaude: boolean;
  /** Internal trace (appendix-only) — never rendered in client body. */
  internalTrace: { internalSources: string[]; archetype: string };
}

function humanGap(missing: string): string {
  if (missing.startsWith("section:")) {
    return `${missing.replace("section:", "").trim()} — narrative content not yet evidenced`;
  }
  if (missing === "value_ratification") {
    return "Value ratification (P1 ValueTree — absolute value ranges, not shares)";
  }
  return resolveSourceLabel(missing).title;
}

/** Collect cited facts + open gaps from the grounded base, citation-mapped. */
function buildCleanBundle(base: GeneratedDeliverable): {
  facts: string[];
  register: SourceRegisterEntry[];
  citationMap: Record<string, number>;
  openItems: string[];
  internalSources: string[];
} {
  const citedIds: string[] = [];
  const rawFacts: Array<{ text: string; id: string }> = [];
  const gaps = new Set<string>();
  for (const s of base.sections) {
    for (const c of s.claims) {
      if (c.citation) {
        citedIds.push(c.citation);
        rawFacts.push({ text: c.text, id: c.citation });
      } else if (c.missingEvidence) {
        gaps.add(c.missingEvidence);
      }
    }
  }
  const { register, citationMap } = buildSourceRegister(citedIds);
  // Each fact: scrub any embedded raw id in the text, then tag with [n].
  const seen = new Set<string>();
  const facts: string[] = [];
  for (const f of rawFacts) {
    const ref = citationMap[f.id];
    const cleanText = applyCitationsToBody(f.text, citationMap).trim();
    const line = `${cleanText} [${ref}]`;
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
    internalSources: Array.from(new Set(citedIds)),
  };
}

function buildSystemPrompt(
  contract: DeliverableContract,
  clientName: string,
  moveName: string,
): string {
  const sectionLines = contract.sections
    .filter((s) => s.authored)
    .map((s) => {
      const tbl = s.requiresTable
        ? ` [TABLE required, columns: ${s.tableColumns?.join(" | ")}]`
        : "";
      const crit = s.qualityCriteria ? ` — ${s.qualityCriteria}` : "";
      return `- ${s.title} (${s.mode})${tbl}${crit}`;
    })
    .join("\n");
  const isP1Charter = contract.deliverableType === "program_charter";
  const roleLine = isP1Charter
    ? `You are drafting a concise P1 Charter Brief / gate decision record for ${clientName} for the "${moveName}" initiative.`
    : `You are a senior partner at a top-tier strategy firm (McKinsey/BCG caliber) plus a CIO advisory partner, drafting a board-grade ${contract.label} for ${clientName} for the "${moveName}" initiative.`;
  const styleLine = isP1Charter
    ? "STYLE: concise, factual, plain-English, decision-record quality. Target 700-1,200 words / 2-4 pages. No table of contents, no appendix, no implementation plan, no target-state design, no roadmap, no estimate, no detailed RACI, and no current-state diagnosis beyond P0 facts."
    : "STYLE: executive, concise but complete, advisory, specific (not generic, not salesy), with clear implications and explicit decision asks.";
  const outputLine = isP1Charter
    ? "Output GitHub-flavored Markdown only. Use exactly the H2 sections below, in order. Use only the specified concise tables. Start directly with the first section heading."
    : `Output GitHub-flavored Markdown only (H2 sections, markdown tables). Start directly with the first section heading — no preamble, no title line, no "here is".`;
  return [
    roleLine,
    `Audience: ${contract.audience}.`,
    ``,
    `NON-NEGOTIABLE RULES:`,
    `1. Use ONLY the governed evidence provided for client-specific facts. Do NOT invent names, numbers, owners, dates, systems, risks, KPIs, or value estimates.`,
    `2. Cite every evidence-based claim with a numeric [n] tied to the Source Register. NEVER write internal identifiers (table names, document_extract:*, chunk ids, fact keys, context tags) anywhere in the body.`,
    `3. Where required evidence is missing, insert an explicit placeholder: [CLIENT TO COMPLETE: ...], [CLIENT TO CONFIRM: ...], [VALUE TEAM TO CONFIRM: ...], or [LEGAL/PROCUREMENT REVIEW REQUIRED: ...]. Never hide a gap in prose.`,
    `4. Produce the TABLES specified for each section, with the exact columns. Tables must be readable and complete (use a placeholder cell rather than omitting a row).`,
    ...(isP1Charter
      ? [
          `5. P1 is not Discovery. Current-state process, technology stack, org structure, baseline metrics, solution options, architecture, roadmap, estimates, and operating-model details must be written as "To validate in P2" unless they are explicitly present in governed evidence.`,
        ]
      : []),
    ``,
    styleLine,
    ``,
    `REQUIRED SECTIONS (use exactly these as H2 headings, in this order):`,
    sectionLines,
    ``,
    outputLine,
  ].join("\n");
}

function buildUserPrompt(args: {
  contract: DeliverableContract;
  clientName: string;
  moveName: string;
  facts: string[];
  openItems: string[];
  register: SourceRegisterEntry[];
}): string {
  const reg = args.register
    .map(
      (r) =>
        `[${r.ref}] ${r.title} — ${r.family} (confidence: ${r.confidence})`,
    )
    .join("\n");
  const isP1Charter = args.contract.deliverableType === "program_charter";
  return [
    `CLIENT: ${args.clientName}`,
    `INITIATIVE: ${args.moveName}`,
    ``,
    `GOVERNED EVIDENCE (cite with the [n] shown; this is the ONLY client-specific fact base):`,
    args.facts.length
      ? args.facts.map((f) => `• ${f}`).join("\n")
      : "(no committed evidence yet)",
    ``,
    `OPEN ITEMS / MISSING EVIDENCE (address each as a placeholder or client-to-complete row; do NOT invent values):`,
    args.openItems.length
      ? args.openItems.map((g) => `• ${g}`).join("\n")
      : "(none)",
    ``,
    `SOURCE REGISTER (use these exact [n] numbers):`,
    reg || "(none)",
    ``,
    isP1Charter
      ? `Write the concise P1 Charter Brief now. It must record the P0-approved bet and define what P2 must validate. Do not expand into a discovery report, solution design, roadmap, estimate, or operating model.`
      : `Write the complete board-grade document now, following the required sections and tables.`,
  ].join("\n");
}

export async function generateBoardDeliverable(args: {
  contract: DeliverableContract;
  base: GeneratedDeliverable;
  clientKey: string;
  tenantId: string;
  moveId: string;
  moveName: string;
  version?: string;
  date: string; // caller supplies (Date.* is unavailable in some contexts)
  userId?: string;
  model?: string;
}): Promise<{ result: BoardDeliverableResult; quality: QualityReport }> {
  const clientName = tenantDisplayName(args.clientKey);
  const { facts, register, citationMap, openItems, internalSources } =
    buildCleanBundle(args.base);
  const model =
    args.model ??
    process.env.MOVES_DELIVERABLE_MODEL ??
    process.env.NEXUS_COMPOSER_MODEL ??
    "claude-opus-4-7";

  const system = buildSystemPrompt(args.contract, clientName, args.moveName);
  const prompt = buildUserPrompt({
    contract: args.contract,
    clientName,
    moveName: args.moveName,
    facts,
    openItems,
    register,
  });

  let bodyMarkdown = "";
  let generatedByClaude = false;
  try {
    const { client } = await getAuditedAnthropicClient({
      tenantId: UUID_RE.test(args.tenantId) ? args.tenantId : args.clientKey,
      userId:
        args.userId && UUID_RE.test(args.userId) ? args.userId : undefined,
      workflow: "moves_board_deliverable",
      model,
      prompt: [system, prompt].join("\n\n"),
      dataClass: "confidential",
      artifactId: args.moveId,
      artifactType: args.contract.deliverableType,
      metadata: { facts: facts.length, openItems: openItems.length },
    });
    const stream = await client.messages.create({
      model,
      max_tokens: args.contract.deliverableType === "program_charter" ? 2600 : 8000,
      system,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        bodyMarkdown += event.delta.text;
      }
    }
    generatedByClaude = true;
  } catch {
    // Fallback: a structured, citation-clean draft from the evidence + open items.
    bodyMarkdown = buildFallbackBody(
      args.contract,
      facts,
      openItems,
    );
  }

  // Defense-in-depth: guarantee the body carries no internal ids.
  bodyMarkdown = applyCitationsToBody(bodyMarkdown.trim(), citationMap);

  const clientCompleteItems = openItems.slice();
  const result: BoardDeliverableResult = {
    deliverableType: args.contract.deliverableType,
    label: args.contract.label,
    clientName,
    moveName: args.moveName,
    version: args.version ?? "0.1 (draft)",
    date: args.date,
    confidentiality: args.contract.confidentiality,
    bodyMarkdown,
    sourceRegister: register,
    openItems,
    clientCompleteItems,
    unsupportedClaims: args.base.envelope.unsupportedClaims ?? [],
    model,
    generatedByClaude,
    internalTrace: {
      internalSources,
      archetype: args.base.envelope.archetypeResolved,
    },
  };

  const quality = validateDeliverableQuality({
    title: `${args.contract.label} — ${args.moveName}`,
    version: result.version,
    date: result.date,
    bodyMarkdown,
    sourceRegister: register,
    requiredSections: authoredSectionTitles(args.contract),
    requiredTableSections: authoredTableSectionTitles(args.contract),
    clientCompleteItems,
    openItems,
    unsupportedClaims: result.unsupportedClaims,
    bodyFontPt: 11,
  });

  return { result, quality };
}

function buildFallbackBody(
  contract: DeliverableContract,
  facts: string[],
  openItems: string[],
): string {
  const lines: string[] = [];
  for (const s of contract.sections) {
    if (!s.authored) continue;
    lines.push(`## ${s.title}`);
    if (s.requiresTable && s.tableColumns) {
      lines.push(`| ${s.tableColumns.join(" | ")} |`);
      lines.push(`| ${s.tableColumns.map(() => "---").join(" | ")} |`);
      lines.push(
        `| ${s.tableColumns.map(() => "[CLIENT TO COMPLETE]").join(" | ")} |`,
      );
    }
    if (s.id === "current_state" && facts.length) {
      for (const f of facts.slice(0, 8)) lines.push(`- ${f}`);
    } else if (s.id === "client_complete" && openItems.length) {
      for (const g of openItems) lines.push(`- [CLIENT TO COMPLETE: ${g}]`);
    } else {
      lines.push(
        `_Review required — to be completed from governed evidence and client input._`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

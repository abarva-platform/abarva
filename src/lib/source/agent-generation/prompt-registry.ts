// Agent generation · prompt registry
//
// Per-artifact prompt templates. Versioned so generation receipts
// remain explicable when prompts change. Voice + structural
// requirements live in the system prompt; bound context lives in the
// user message.
//
// Slice 1 ships templates for d01, d05, d09 — the minimum chain to
// generate an RFP package end-to-end (Strategy Memo → Scope Memo →
// RFP). Subsequent slices extend coverage to the remaining 30 codes.

import type {
  SourceArtifactPromptTemplate,
  SourceGenerationContext,
} from './types';
import { buildAppInventoryPromptBlock } from './app-inventory';

// Environment-tiered model selection. Each environment (dev / preprod / prod,
// and per-client preprod / prod) sets these via env so the highest-quality
// (most expensive) model is reserved for the highest environments — no code
// change per environment.
//   - DEFAULT_MODEL: non-gated drafts (fast, lower cost).
//   - BOARD_GRADE_MODEL: gated/board-grade deliverables (d02/d03/d09); defaults
//     to the most capable model so prod gets top quality unless a lower env
//     dials it down via ABARVA_SOURCE_BOARD_GRADE_MODEL.
const DEFAULT_MODEL =
  process.env.ABARVA_SOURCE_DEFAULT_MODEL?.trim() || "claude-sonnet-4-6";
const BOARD_GRADE_MODEL =
  process.env.ABARVA_SOURCE_BOARD_GRADE_MODEL?.trim() || "claude-opus-4-8";
// Output token ceilings — quality over speed. Board-grade artifacts need room
// to develop complete arguments, tables, and all required sections without
// truncation. Increase these rather than accept a truncated draft.
const DEFAULT_MAX_TOKENS = 24_000;

const AVA_SOURCE_ADVISOR_VOICE = `You are aVa, AbarVa's senior sourcing and vendor-strategy advisor writing for a CIO and their leadership team. You have personally run dozens of large-enterprise sourcing events. You write with the judgment, structure, and candor of a top-tier consulting partner — never like a template engine or a compliance checklist.

Write like an expert, not a machine:
- Have a point of view. Make the call. Recommend a direction and own the reasoning behind it. Lead each section with the insight that matters, then support it — do not bury the decision under background.
- Bring judgment from experience. Name the real leverage in an event like this, the levers that actually move the number, the failure modes that usually derail it, and where the value truly sits — the things a seasoned advisor flags that a checklist would miss.
- Write in flowing, confident executive prose. Plain, precise English. Use a table or a bullet list only where it genuinely sharpens a comparison or an enumeration — never as a substitute for an argument, and never to pad.
- Earn every specific. Tie each claim to this event's facts and the uploaded evidence; cite source files by name and upstream artifacts by code (e.g. "per the d05 scope memo"). Every number carries its basis.
- Story-led. Explain the business situation, the sourcing implication, the tradeoffs, and the next operating move.
- Visual when it helps the decision. Use tables for comparisons, gating, owner/action maps, pricing assumptions, and risk registers. Use chart-ready summaries when ranking options or showing TCO layers.

Integrity is what makes you credible, not generic — keep it, but in an advisor's voice:
- Never fabricate. If an input is missing, say so plainly and treat it as a gap to close — phrased as advice ("we don't yet have the current SLA baseline; until we do, treat the savings target as directional"), not as a bare "asserted / unknown" tag.
- Separate what the evidence supports from what is still a working assumption — woven into the reasoning, not bolted on as audit labels.
- No hedging-by-listing, no generic procurement boilerplate, no restating the prompt. If a section has nothing decision-relevant to say, say less.

Client-facing language:
- Say "company", "business", "event", "evidence", "source file"; never say "tenant", "tenant key", "substrate", a raw table name, an internal id, or a routing key.

Format:
- Markdown only. ATX headings (#, ##, ###). Numbered §-prefixed sections (## §1 · …) match the AbarVa house style — but let the argument lead; headings serve the narrative, not the reverse.
- Tables when comparing. Bullet lists when enumerating. Add a compact "so what" line after dense tables.`;

export const SOURCE_VENDOR_RESPONSE_CONTROL_MANDATE = `Vendor responses must be submitted using the provided response templates and pricing workbook. Narrative responses may supplement, but may not replace, the required structured response tables.

Any productivity, automation, transformation, service-level, transition, cost-reduction, or outcome claim must be entered in the Vendor Claim Register with supporting evidence, measurement method, commercial commitment, and related pricing impact.

The buyer reserves the right to treat unsupported claims, incomplete pricing fields, missing assumptions, undocumented exclusions, or non-compliant response formats as evaluation risks and/or grounds for clarification before scoring.`;

const VENDOR_RESPONSE_CONTROL_SECTIONS = [
  {
    title: "Vendor Claim Register",
    purpose: "Force vendors to declare major claims in a structured way.",
    columns: [
      "Claim ID",
      "Claim Type",
      "Vendor Claim",
      "Related RFP Requirement",
      "Evidence Provided",
      "Commercial Commitment: Yes/No",
      "Pricing Impact",
      "Measurement Method",
      "Timeframe",
      "Contractual Location / Proposed Exhibit",
      "Vendor Owner",
      "Notes",
    ],
  },
  {
    title: "Automation / Productivity Commitment Table",
    purpose: "Prevent vague AI, automation, transformation, productivity, or efficiency promises.",
    columns: [
      "Use Case",
      "Baseline Volume",
      "Current Cost / Effort Baseline",
      "Automation Method",
      "Tooling / Platform",
      "Year 1 Impact",
      "Year 2 Impact",
      "Year 3 Impact",
      "Price Impact",
      "Productivity Credit / Gainshare",
      "Measurement Method",
      "Evidence Provided",
      "Dependencies",
      "Vendor Owner",
    ],
  },
  {
    title: "Structured Pricing Workbook",
    purpose: "Make vendor pricing comparable across one-time, run, transition, transformation, tooling, governance, pass-through, optional-service, unit-rate, retained-cost, volume-pricing, productivity-credit, SLA-credit, and assumption sections.",
    columns: [
      "Cost Category",
      "Cost Description",
      "Year 0",
      "Year 1",
      "Year 2",
      "Year 3",
      "Year 4",
      "Year 5",
      "Unit",
      "Quantity",
      "Unit Price",
      "One-Time / Recurring",
      "Included / Optional",
      "Assumption Reference",
      "Notes",
    ],
  },
  {
    title: "Staffing and Location Model",
    purpose: "Expose delivery model, rate-card, coverage, and staffing-mix risk.",
    columns: [
      "Role",
      "Level",
      "Tower / Service Area",
      "Location",
      "Onshore / Nearshore / Offshore",
      "FTE",
      "Rate",
      "Annual Cost",
      "Coverage Window",
      "Responsibility",
      "Named / Pooled",
      "Assumption Reference",
    ],
  },
  {
    title: "SLA Commitment Table",
    purpose: "Separate binding service commitments from cosmetic targets.",
    columns: [
      "Service Area",
      "Metric",
      "Baseline if Known",
      "Proposed Target",
      "Measurement Window",
      "Reporting Frequency",
      "Service Credit",
      "Credit Cap",
      "Exclusions",
      "Root Cause / Cure Process",
      "Executive Escalation Trigger",
      "Evidence Provided",
    ],
  },
  {
    title: "Assumptions and Exclusions Log",
    purpose: "Prevent vendors from hiding change-order traps in footnotes.",
    columns: [
      "ID",
      "Assumption / Exclusion",
      "Applies To",
      "Category",
      "Financial Impact",
      "Operational Impact",
      "Change Order Risk",
      "Vendor Position",
      "Client Action Required",
      "Proposed Treatment",
      "Notes",
    ],
  },
  {
    title: "Transition Plan Template",
    purpose: "Make transition commitments testable and milestone-linked.",
    columns: [
      "Phase",
      "Week",
      "Activity",
      "Owner",
      "Client Dependency",
      "Vendor Dependency",
      "Exit Criteria",
      "Evidence",
      "Risk",
      "Fee / Milestone Linkage",
    ],
  },
  {
    title: "Commercial Exceptions Table",
    purpose: "Make vendor exceptions visible before evaluation and BAFO.",
    columns: [
      "RFP Requirement",
      "Vendor Response",
      "Exception: Yes/No",
      "Proposed Alternative",
      "Buyer Risk",
      "Price Impact",
      "Legal / Procurement Review Needed",
      "Vendor Rationale",
    ],
  },
] as const;

const COMMERCIAL_LEVERAGE_READINESS_CHECKS = [
  "Productivity claimed but not priced back",
  "Transition fees not milestone-based",
  "Weak SLA credit economics",
  "Vague exclusions / change-order exposure",
  "Rate card or staffing mix issue",
  "Outcome claim not contractually committed",
  "24x7 support not staffed",
  "Pricing not comparable",
  "Proposal claim not supported by evidence",
  "Commercial exception creates buyer risk",
] as const;

function formatVendorResponseControlSections(): string {
  return VENDOR_RESPONSE_CONTROL_SECTIONS.map((section, index) =>
    [
      `${index + 1}. ${section.title}`,
      `   Purpose: ${section.purpose}`,
      `   Required columns: ${section.columns.join(" | ")}`,
    ].join("\n"),
  ).join("\n");
}

function formatCommercialLeverageReadinessChecks(): string {
  return COMMERCIAL_LEVERAGE_READINESS_CHECKS.map(
    (check, index) => `${index + 1}. ${check}`,
  ).join("\n");
}

// Render the tenant's uploaded, parsed evidence (incumbent contracts, ticket
// extracts, etc.) so the draft can CITE it by filename. The consulting-grade
// quality gate already sees this evidence and penalises drafts that ignore it;
// without this block the draft is blind to evidence it is graded on.
function formatDraftEvidenceContext(ctx: SourceGenerationContext): string | null {
  const items = ctx.uploadedEvidence ?? [];
  if (items.length === 0) return null;
  const lines = items.slice(0, 8).map((a) => {
    const facts = a.factSummaries?.length
      ? `\n    Facts: ${a.factSummaries.slice(0, 6).join("; ")}`
      : "";
    const excerpt = a.chunkExcerpts?.length
      ? `\n    Excerpt: ${a.chunkExcerpts[0].slice(0, 500)}`
      : "";
    return `  - ${a.originalName} (${a.artifactFamily} · ${a.evidenceState})${facts}${excerpt}`;
  });
  return [
    "Uploaded evidence for this event — CITE these by filename where they support a claim,",
    "and do not invent figures beyond what they state:",
    ...lines,
  ].join("\n");
}
const REGISTRY: Record<string, SourceArtifactPromptTemplate> = {
  d01_strategy_memo: {
    artifactCode: "d01_strategy_memo",
    version: 1,
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
    upstreamRequired: [],
    upstreamOptional: [],
    systemPrompt: `${AVA_SOURCE_ADVISOR_VOICE}

You are drafting the Sourcing Strategy Memo (artifact d01_strategy_memo). This is the foundational document for a sourcing event — it answers Why Now, What we're sourcing, the Value Target, the Archetype, and the Rigor level.

Required structural sections:
${formatRequiredSectionsForPrompt("d01_strategy_memo")}

This memo is your recommendation to the CIO on whether and how to take this to market. Open with an executive summary a CIO can absorb quickly — the business context, why this matters now, the value at stake, and the specific decision needed — as a few crisp bullets or a compact table. Then make the case: cite the trigger from the intake, name the decision owner, and give the value target as a range with a confidence band when the intake supports one (and say plainly when it does not, rather than manufacturing precision). Choose the archetype and rigor and defend the choice in an advisor's voice — standard for run-rate continuity, enhanced for a material savings claim, strategic for a transformation — and explain what that choice means for how the event should actually run. Include at least one compact table that maps current facts to sourcing implications. Depth is allowed when it changes decision quality; every section should earn its place. Never expose internal product terms (tenant, tenant key, substrate, table names, artifact ids, chunk ids).`,
    buildUserMessage: (ctx) => {
      return [
        `Company: ${ctx.tenantName}`,
        `Event: ${ctx.event.name}`,
        `Code: ${ctx.event.code}`,
        ctx.event.archetype ? `Archetype: ${ctx.event.archetype}` : null,
        ctx.event.rigor ? `Rigor: ${ctx.event.rigor}` : null,
        ctx.event.owner ? `Owner: ${ctx.event.owner}` : null,
        ctx.event.estimatedValueUsd
          ? `Estimated value: $${ctx.event.estimatedValueUsd.toLocaleString()}`
          : null,
        "",
        `Trigger / why-now: ${ctx.event.triggerDescription ?? "(not provided in intake)"}`,
        "",
        `Scope description from intake:`,
        ctx.event.scopeDescription || "(not provided)",
        "",
        formatDraftEvidenceContext(ctx),
        "",
        ctx.archetypeAdvisory
          ? `— SOURCING-ADVISOR PLAYBOOK (archetype-specific commercial intelligence) —\n\n${ctx.archetypeAdvisory}\n`
          : null,
        `Draft the Sourcing Strategy Memo per the system prompt requirements.`,
      ]
        .filter((line): line is string => line !== null)
        .join("\n");
    },
  },

  d02_value_target: {
    artifactCode: "d02_value_target",
    version: 3,
    model: BOARD_GRADE_MODEL,
    maxTokens: 12_000,
    upstreamRequired: [],
    upstreamOptional: ["d01_strategy_memo"],
    systemPrompt: `${AVA_SOURCE_ADVISOR_VOICE}

You are drafting the Value Target Brief (artifact d02_value_target). It quantifies the value this sourcing event is expected to create — the range, the levers, the assumptions, and how it will be measured — so the funding decision rests on an evidence-disciplined number, not optimism.

Required structural sections:
## §1 · Value thesis
## §2 · Value levers
## §3 · Sizing, range, and confidence band
## §4 · Assumptions and sensitivities
## §5 · Realization and measurement

Requirements:
- State the value target as a RANGE (low / base / high) with an explicit confidence band (low / medium / high) and the basis for each bound.
- Decompose value by lever: labor arbitrage, automation / productivity, consolidation / rationalization, rate / commercial, demand / volume. Quantify each lever's contribution where the bound context supports it; mark unsupported levers as "indicative — requires baseline".
- Tie every number to a source: incumbent baseline, ticket / volume evidence, or a stated assumption. Never fabricate a baseline. If the baseline is missing, size the lever as a range against a clearly labeled assumption and flag it as a client-to-complete gap.
- Name the realization owner and the first measurement window. Separate projected → committed → measured value.
- 600-1000 words. Use a table for the lever decomposition and a table for the sizing range. No generic savings boilerplate.`,
    buildUserMessage: (ctx, upstream) => {
      return [
        `Company: ${ctx.tenantName}`,
        `Event: ${ctx.event.name} (${ctx.event.code})`,
        ctx.event.archetype ? `Archetype: ${ctx.event.archetype}` : null,
        ctx.event.estimatedValueUsd
          ? `Intake value estimate: $${ctx.event.estimatedValueUsd.toLocaleString()}`
          : `Intake value estimate: (not provided)`,
        ctx.event.owner ? `Owner: ${ctx.event.owner}` : null,
        "",
        `Trigger / why-now: ${ctx.event.triggerDescription ?? "(not provided)"}`,
        `Scope description: ${ctx.event.scopeDescription || "(not provided)"}`,
        "",
        upstream.d01_strategy_memo
          ? `Approved Sourcing Strategy Memo (d01_strategy_memo) — anchor the value thesis to it:\n${upstream.d01_strategy_memo}`
          : `(Strategy memo d01 not yet authored — derive the thesis from the intake and flag the dependency as a gap.)`,
        "",
        formatDraftEvidenceContext(ctx),
        "",
        `Draft the Value Target Brief per the system prompt requirements.`,
      ]
        .filter((line): line is string => line !== null)
        .join("\n");
    },
  },

  d03_archetype_decision: {
    artifactCode: "d03_archetype_decision",
    version: 3,
    model: BOARD_GRADE_MODEL,
    maxTokens: 12_000,
    upstreamRequired: [],
    upstreamOptional: ["d01_strategy_memo"],
    systemPrompt: `${AVA_SOURCE_ADVISOR_VOICE}

You are drafting the Archetype Decision Record (artifact d03_archetype_decision). It documents which sourcing archetype and rigor level the event will run, the criteria behind the choice, and what the choice implies for scope, evaluation, and timeline — so the decision is explicit, defensible, and auditable.

Required structural sections:
## §1 · Candidate archetypes considered
## §2 · Decision criteria
## §3 · Selected archetype and rationale
## §4 · Rigor level and rationale
## §5 · Implications for the sourcing approach

Requirements:
- Enumerate the realistic candidate archetypes (e.g. AMS / managed service, cloud / infrastructure, data & AI platform, enterprise software, custom build / integration) and why each is or is not a fit for THIS event.
- Score the candidates against explicit criteria (value mechanism, market maturity, switching cost, transition risk, internal capability) in a comparison table.
- State the selected archetype with a rationale grounded in the intake and the strategy memo. Pick the rigor level — standard (run-rate continuity), enhanced (material savings claim), or strategic (transformation) — and justify it.
- Spell out the implications: how the archetype shapes the RFP structure, the evaluation weights, the vendor pool, and the timeline. No fabrication; flag unknowns as client-to-complete gaps.
- 500-900 words. Include the archetype scoring comparison table.`,
    buildUserMessage: (ctx, upstream) => {
      return [
        `Company: ${ctx.tenantName}`,
        `Event: ${ctx.event.name} (${ctx.event.code})`,
        ctx.event.archetype
          ? `Intake archetype signal: ${ctx.event.archetype}`
          : `Intake archetype signal: (not provided)`,
        ctx.event.rigor ? `Intake rigor signal: ${ctx.event.rigor}` : null,
        ctx.event.owner ? `Owner: ${ctx.event.owner}` : null,
        "",
        `Trigger / why-now: ${ctx.event.triggerDescription ?? "(not provided)"}`,
        `Scope description: ${ctx.event.scopeDescription || "(not provided)"}`,
        "",
        upstream.d01_strategy_memo
          ? `Approved Sourcing Strategy Memo (d01_strategy_memo) — align the archetype + rigor to it:\n${upstream.d01_strategy_memo}`
          : `(Strategy memo d01 not yet authored — derive the decision from the intake and flag the dependency as a gap.)`,
        "",
        formatDraftEvidenceContext(ctx),
        "",
        `Draft the Archetype Decision Record per the system prompt requirements.`,
      ]
        .filter((line): line is string => line !== null)
        .join("\n");
    },
  },

  d02_value_target: {
    artifactCode: 'd02_value_target',
    version: 1,
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
    upstreamRequired: [],
    upstreamOptional: [],
    systemPrompt: `${SENTINEL_VOICE}

You are drafting the Value Target Brief (artifact d02_value_target) — the financial bracket this sourcing event is set up to deliver. Always a range with a confidence band, never a point estimate.

Required structural sections:
## §1 · Value range
## §2 · Lever rationale
## §3 · Confidence posture
## §4 · What tightens the band

Tone: tight, quantitative, 500-900 words. Model a low/high range around the intake's estimated value at stake (if given) over a 3-year horizon; if no estimate was provided, say so explicitly and frame the range qualitatively. Break value out by lever (labor arbitrage, automation, consolidation, license rationalization, avoidance) in a markdown table with low / high / confidence columns. State which downstream evidence (ticket history, pricing, BAFO concessions, scorecard) tightens which bracket. Do not fabricate benchmarks — where a number is modeled rather than evidenced, mark it as modeled.`,
    buildUserMessage: (ctx) => {
      return [
        `Tenant: ${ctx.tenantName} (key: ${ctx.tenantKey})`,
        `Event: ${ctx.event.name}`,
        `Code: ${ctx.event.code}`,
        ctx.event.archetype ? `Archetype: ${ctx.event.archetype}` : null,
        ctx.event.rigor ? `Rigor: ${ctx.event.rigor}` : null,
        ctx.event.owner ? `Owner: ${ctx.event.owner}` : null,
        ctx.event.estimatedValueUsd
          ? `Estimated value at stake (intake): $${ctx.event.estimatedValueUsd.toLocaleString()}`
          : 'Estimated value at stake (intake): (not provided — frame the range qualitatively)',
        '',
        `Trigger / why-now: ${ctx.event.triggerDescription ?? '(not provided in intake)'}`,
        '',
        `Scope description from intake:`,
        ctx.event.scopeDescription || '(not provided)',
        '',
        `Draft the Value Target Brief per the system prompt requirements.`,
      ]
        .filter((line): line is string => line !== null)
        .join('\n');
    },
  },

  d03_archetype_decision: {
    artifactCode: 'd03_archetype_decision',
    version: 1,
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
    upstreamRequired: [],
    upstreamOptional: [],
    systemPrompt: `${SENTINEL_VOICE}

You are drafting the Archetype Decision Record (artifact d03_archetype_decision) — which sourcing archetype this event maps to and why. This drives the artifact pack, agent line-up, and gate criteria.

Required structural sections:
## §1 · Selected archetype
## §2 · Why this archetype
## §3 · What the archetype unlocks
## §4 · Variations from the canonical archetype

Archetypes: Application Managed Services · Cloud & Infrastructure · Data & Analytics · Enterprise Software · Custom / Multi-tower.

Tone: decisive, 400-800 words. Name the selected archetype — use the intake archetype if provided, otherwise infer the best fit from the trigger + scope and state plainly that it is inferred. Justify why it fits and why the adjacent archetypes do not. State what the archetype unlocks (the pre-shaped artifact pack, agent line-up, and gate criteria). Call out any variations that bend the canonical archetype (multi-tower scope, regulated tenant, prior failed sourcing, vendor-concentration constraint). Tie the rigor level to the archetype and the value at stake.`,
    buildUserMessage: (ctx) => {
      return [
        `Tenant: ${ctx.tenantName} (key: ${ctx.tenantKey})`,
        `Event: ${ctx.event.name}`,
        `Code: ${ctx.event.code}`,
        ctx.event.archetype
          ? `Archetype (intake): ${ctx.event.archetype}`
          : 'Archetype (intake): (not provided — infer best fit and mark as inferred)',
        ctx.event.rigor ? `Rigor (intake): ${ctx.event.rigor}` : null,
        ctx.event.estimatedValueUsd
          ? `Estimated value at stake: $${ctx.event.estimatedValueUsd.toLocaleString()}`
          : null,
        '',
        `Trigger / why-now: ${ctx.event.triggerDescription ?? '(not provided in intake)'}`,
        '',
        `Scope description from intake:`,
        ctx.event.scopeDescription || '(not provided)',
        '',
        `Draft the Archetype Decision Record per the system prompt requirements.`,
      ]
        .filter((line): line is string => line !== null)
        .join('\n');
    },
  },

  d04_app_inv: {
    artifactCode: 'd04_app_inv',
    version: 1,
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
    upstreamRequired: [],
    upstreamOptional: [],
    systemPrompt: `${SENTINEL_VOICE}

You are drafting the Application Inventory & Tiering (artifact d04_app_inv). This is the factual base the scope memo and RFP price against — the in-scope applications/systems with their tier, owner, and criticality.

Required structural sections:
## §1 · Inventory source
## §2 · Application list
## §3 · Tiering rationale
## §4 · Coverage + gaps
## §5 · Inventory owner + sign-off

Tone: factual, table-first. §2 MUST be a markdown table with columns: App ID | Name | Tier | Owner | Vendor | Criticality | Notes.

When an enterprise application inventory is supplied in the user message, populate §2 directly from it — one row per system, verbatim IDs and names — and DO NOT invent applications beyond that list. In §1, state that the inventory derives from the tenant's loaded systems inventory and name the source. In §4, list every row with a missing Tier or Owner as a coverage gap to confirm, rather than guessing the value.

When no inventory is supplied, produce the §2 table framework (headers + a placeholder row), and state plainly in §1 and §4 that the inventory is not yet ingested and must be authored or uploaded before scope can lock. Never fabricate applications.`,
    buildUserMessage: (ctx) => {
      return [
        `Tenant: ${ctx.tenantName} (key: ${ctx.tenantKey})`,
        `Event: ${ctx.event.name}`,
        `Code: ${ctx.event.code}`,
        ctx.event.owner ? `Owner: ${ctx.event.owner}` : null,
        '',
        `Scope description from intake:`,
        ctx.event.scopeDescription || '(not provided)',
        '',
        '— ENTERPRISE APPLICATION INVENTORY —',
        '',
        buildAppInventoryPromptBlock(ctx.enterpriseAppInventory),
        '',
        `Draft the Application Inventory & Tiering per the system prompt requirements.`,
      ]
        .filter((line): line is string => line !== null)
        .join('\n');
    },
  },

  d05_scope_memo: {
    artifactCode: "d05_scope_memo",
    version: 1,
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
    upstreamRequired: ["d01_strategy_memo"],
    upstreamOptional: ["d04_app_inv", "d07_ticket_synth"],
    systemPrompt: `${AVA_SOURCE_ADVISOR_VOICE}

You are drafting the Scope Memo with Boundaries (artifact d05_scope_memo). This document is vendor-facing once locked — it must be precise about what's in and out of scope so vendors price + propose against the same definition.

Required structural sections:
${formatRequiredSectionsForPrompt("d05_scope_memo")}

Tone: precise, business-facing, list-heavy, and operational. Start with an executive summary that explains the sourcing context, value/urgency, decision owner, and the boundary decision in a simple scan-friendly way. The "in scope" section must be a bulleted or tabular list grouped by tower/service area; do not run multiple scope items together in one paragraph. The "in scope" section names systems, services, hours-of-coverage, and SLA expectations. The "out of scope" section is exhaustive and also list-heavy — anything not listed in §1 is implicitly out, but explicit listings prevent later vendor disputes. Boundary clarifications cover edge cases the strategy memo didn't pin down. Include a table that turns each boundary into vendor pricing and proposal implications. End with the named scope owner who locks the document. Do not expose internal product terms such as tenant, tenant key, substrate, table names, artifact ids, or chunk ids.`,
    buildUserMessage: (ctx, upstream) => {
      const lines: string[] = [
        `Company: ${ctx.tenantName}`,
        `Event: ${ctx.event.name} (${ctx.event.code})`,
        ctx.event.owner ? `Owner: ${ctx.event.owner}` : null,
        "",
        "— UPSTREAM CONTEXT —",
        "",
        `Approved Sourcing Strategy Memo (d01_strategy_memo):`,
        upstream.d01_strategy_memo ??
          "(NOT YET AUTHORED — generate using event intake fallback)",
        "",
      ].filter((line): line is string => line !== null);

      if (upstream.d04_app_inv) {
        lines.push(
          "Approved Application Inventory (d04_app_inv) — use as in-scope source list:",
        );
        lines.push(upstream.d04_app_inv);
        lines.push("");
      }
      if (upstream.d07_ticket_synth) {
        lines.push(
          "Ticket History Synthesis (d07_ticket_synth) — informs SLA / hours-of-coverage:",
        );
        lines.push(upstream.d07_ticket_synth);
        lines.push("");
      }

      lines.push("Draft the Scope Memo per the system prompt requirements.");
      return lines.join("\n");
    },
  },

  d09_rfp_pack: {
    artifactCode: "d09_rfp_pack",
    version: 10,
    model: BOARD_GRADE_MODEL,
    maxTokens: 128_000,
    upstreamRequired: ["d01_strategy_memo", "d05_scope_memo"],
    upstreamOptional: ["d02_value_target", "d04_app_inv", "d07_ticket_synth"],
    systemPrompt: `${AVA_SOURCE_ADVISOR_VOICE}

You are drafting the RFP Package (artifact d09_rfp_pack) — the flagship vendor-facing document. Vendors will price + propose against this, and executives will judge whether the event is ready to enter market. It must read like a partner-grade consulting artifact for an $80B enterprise-scale sourcing event: complete, unambiguous, quantified, evidence-aware, and structured so vendor responses are comparable downstream.

Required structural sections:
## §1 · Executive summary and decision context
## §2 · Enterprise current-state baseline
## §3 · Scope, service towers, and exclusions
## §4 · Application, workload, infrastructure, network, and cloud estate
## §5 · Service-level, operational, and security obligations
## §6 · Transition approach, blackout constraints, and risk controls
## §7 · Commercial model, run/change baseline, and pricing instructions
## §8 · Vendor response instructions and mandatory submission tables
## §9 · Evaluation framework, weights, and disqualification rules
## §10 · Risk register, transition controls, and failure modes
## §11 · Source register, assumptions, and client-to-complete gaps

Mandatory response-compliance language for §8:
${SOURCE_VENDOR_RESPONSE_CONTROL_MANDATE}

Mandatory response-control components to reference in §8:
${formatVendorResponseControlSections()}

Mandatory tables:
- In-scope / out-of-scope service tower matrix.
- Current-state baseline table covering applications, workloads, tickets, FTE, run cost, data center/private cloud, network, security/compliance, contracts, and run-vs-change spend.
- SLA and operational obligations table.
- Transition constraints and blackout calendar table.
- Pricing and volume-basis instruction table.
- Vendor response control table covering the Vendor Claim Register, Automation / Productivity Commitment Table, Structured Pricing Workbook, Staffing and Location Model, SLA Commitment Table, Assumptions and Exclusions Log, Transition Plan Template, and Commercial Exceptions Table.
- Evaluation weights and evidence-required scoring table.
- Risk, issue, dependency, and mitigation table.
- Process timeline table using governed dates from evidence or explicit gate-relative anchors when dates are genuinely missing.
- Source register separating locked uploaded evidence, upstream draft artifacts, working assumptions, and client-to-complete gaps.
- Client-to-complete / vendor-to-confirm register with accountable role, target date or gate-relative trigger, why it matters, and downstream impact.

Tone: formal procurement style, but executive-polished. Vendor-facing draft — assume the reader is a senior sales engineer or pursuit partner at a tier-one infrastructure, cloud, managed services, or application operations vendor. Be explicit, evidence-disciplined, and compact enough to complete in one synchronous generation: target 2,800-3,500 words. Quote scope from d05 only where needed. Reference the value-target range from d01 without disclosing internal sensitivity. Distinguish locked facts, working assumptions, validation gates, and missing evidence. Do not use generic procurement boilerplate. Do not invent names, dates, systems, or volumes not present in the bound context. If evidence is missing, label it as a client-to-complete gap.

Source discipline requirement: treat parsed uploaded evidence as governed draft evidence. Assign friendly exhibit labels such as Exhibit 01 — Run/Change Financial Baseline and cite those labels in the body. Do not expose artifact_id, chunk_id, raw table names, or other internal ids. If an evidence row is parsed_uncited, mark it as "Available parsed evidence — citation review pending" in the source register instead of ignoring it.

Hard output budget and completion requirement: every required section and mandatory table must be present, even if concise. Never stop after a partial table or omit downstream sections. Preserve sections §7–§11; they are more important than long prose in §2–§6. If token budget feels tight, shorten narrative first; use exhibit references instead of restating full datasets; keep every table to 4–8 rows unless the row is mandatory. Do not end mid-sentence. The final line must be: "RFP package draft complete — pending client closure of registered gaps."

Section budget:
- §1: 250 words max plus a 5-row decision table.
- §2: 300 words max plus one current-state baseline table, 6 rows max.
- §3: 250 words max plus one tower matrix, 6 rows max.
- §4: 250 words max plus one estate table, 6 rows max.
- §5: 250 words max plus one obligations table, 6 rows max.
- §6: 300 words max plus one transition/blackout table, 6 rows max.
- §7: must include commercial terms and pricing instructions table.
- §8: must include the response-compliance mandate above, vendor response/submission requirements table, and explicit completion instructions for every Vendor Response Control Pack component.
- §9: table only, 6 rows max, must include weights/scoring/disqualification controls.
- §10: table only, 8 rows max, must include accountable risk roles/mitigations from Exhibits 07, 13, and 14.
- §11: two tables only, 8 rows max each, must include source register and gap closure register.

Compact required appendix block:
After §8, use compact tables instead of long prose for the remaining governance material:
- §9 table: Evaluation area | Weight | Scoring basis | Disqualification / red flag | Evidence source.
- §10 table: Risk ID | Failure mode | Evidence source | Accountable role | Mitigation | Blocking gate.
- §11A table: Source | Status | Used in sections | Remaining action.
- §11B table: Gap ID | Item | Accountable role | Target date / trigger | Blocking gate | Downstream impact.

Required compact section skeleton:
## §1 · Executive summary and decision context
## §2 · Enterprise current-state baseline
## §3 · Scope, service towers, and exclusions
## §4 · Application, workload, infrastructure, network, and cloud estate
## §5 · Service-level, operational, and security obligations
## §6 · Transition approach, blackout constraints, and risk controls
## §7 · Commercial model, run/change baseline, and pricing instructions
## §8 · Vendor response instructions and mandatory submission tables
## §9 · Evaluation framework, weights, and disqualification rules
## §10 · Risk register, transition controls, and failure modes
## §11 · Source register, assumptions, and client-to-complete gaps

Quality requirement: produce a draft that can pass the partner-grade quality review without a follow-up rewrite. Every major claim must either cite/derive from bound evidence, be framed as an assumption to validate, or be listed as a client-to-complete gap with accountable role/action. Include practical mitigations for risks; do not merely flag them. Do not use bracketed client fill-in markers. If exact names or dates are not loaded, provide the accountable role and a gate-relative target date or trigger in the §11 closure table with blocking gate and downstream impact.`,
    buildUserMessage: (ctx, upstream) => {
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
          "(NOT YET AUTHORED — DO NOT FABRICATE; surface the gap in the draft)",
        "",
        "Approved Scope Memo (d05_scope_memo):",
        upstream.d05_scope_memo ??
          "(NOT YET AUTHORED — DO NOT FABRICATE; surface the gap in the draft)",
        "",
        "— GOVERNED EVIDENCE STATE SUMMARY (NORMALIZED FOR D09) —",
        formatEvidenceStates(ctx),
        "",
        "— PARSED UPLOADED EVIDENCE EXCERPTS —",
        formatUploadedEvidence(ctx),
        "",
      ].filter((line): line is string => line !== null);

      if (upstream.d02_value_target) {
        lines.push("Value Target Brief (d02_value_target):");
        lines.push(upstream.d02_value_target);
        lines.push("");
      }
      if (upstream.d04_app_inv) {
        lines.push("Application Inventory (d04_app_inv) — drives §3:");
        lines.push(upstream.d04_app_inv);
        lines.push("");
      }
      if (upstream.d07_ticket_synth) {
        lines.push(
          "Ticket History Synthesis (d07_ticket_synth) — drives §4 SLA expectations:",
        );
        lines.push(upstream.d07_ticket_synth);
        lines.push("");
      }

      lines.push(
        "— D09 RFP EVIDENCE COVERAGE MAP —",
        formatD09RfpEvidenceCoverage(ctx),
        "",
      );

      if (ctx.archetypeAdvisory) {
        lines.push(
          "— SOURCING-ADVISOR PLAYBOOK (archetype-specific commercial intelligence) —",
          "",
          ctx.archetypeAdvisory,
          "",
        );
      }

      lines.push(
        "Draft the RFP Package per the system prompt requirements. Use the evidence-state summary and uploaded evidence excerpts as a completeness checklist: when a category is loaded or usable, reflect it in the right section and cite a friendly exhibit label; when a coverage-map rule says an uploaded exhibit satisfies an EVID-SRC-* requirement, do not call that requirement Not Requested in the source register. When a category is missing or low confidence, add it to the client-to-complete register with accountable role/action/why-it-matters instead of filling with generic text. This is a governed vendor-facing draft, not an issued final; do not use bracketed client fill-in markers. If exact human names or calendar dates are missing, use accountable role names and gate-relative target triggers. Keep the draft compact and section-complete: every section §1 through §11 must appear, §7–§11 must not be sacrificed for long baseline prose, §9 must include weights/scoring/disqualification controls, §10 must include risk owners/mitigations, §11 must include a blocking-gap closure table with accountable role, target date or trigger, blocking gate, and downstream impact for every unresolved item, and the final line must confirm the draft is complete pending registered gap closure.",
      );
      return lines.join("\n");
    },
  },

  d11_response_checklist: {
    artifactCode: "d11_response_checklist",
    version: 1,
    model: BOARD_GRADE_MODEL,
    maxTokens: 48_000,
    upstreamRequired: ["d01_strategy_memo", "d05_scope_memo"],
    upstreamOptional: ["d02_value_target", "d04_app_inv", "d07_ticket_synth", "d09_rfp_pack"],
    systemPrompt: `${AVA_SOURCE_ADVISOR_VOICE}

You are drafting the Vendor Response Control Pack (artifact d11_response_checklist). This is not a generic checklist. It is the vendor-facing response package that forces proposals to arrive structured, evidence-backed, comparable, commercially useful, and ready for evaluation, pricing normalization, challenge logs, and BAFO negotiation.

Core principle:
Do not assume AbarVa can perfectly parse every messy vendor proposal after the fact. Shape the response upfront. Vendors must complete the structured tables and pricing workbook; narrative can supplement but cannot replace them.

Mandatory response-compliance language:
${SOURCE_VENDOR_RESPONSE_CONTROL_MANDATE}

Required structural sections:
## §1 · Response compliance mandate
## §2 · Vendor Claim Register
## §3 · Automation / Productivity Commitment Table
## §4 · Structured Pricing Workbook
## §5 · Staffing and Location Model
## §6 · SLA Commitment Table
## §7 · Assumptions and Exclusions Log
## §8 · Transition Plan Template
## §9 · Commercial Exceptions Table
## §10 · Commercial leverage readiness checks enabled
## §11 · Completion, submission, and clarification rules

Required response-control components:
${formatVendorResponseControlSections()}

Claim type values for the Vendor Claim Register:
automation | productivity | cost reduction | SLA | transition | transformation | innovation | security | staffing | outcome-based pricing | service quality | risk reduction

Assumption / exclusion category values:
scope | pricing | staffing | transition | SLA | tooling | security | data | dependency | retained team | third-party cost

Commercial leverage readiness checks this pack must make possible:
${formatCommercialLeverageReadinessChecks()}

Writing and format requirements:
- Open with a short procurement-ready explanation of why this pack exists: to make vendor proposals comparable, evidence-backed, and negotiation-ready.
- Include the response-compliance mandate in §1.
- For every required component, include a table specification with purpose, required columns, required completion rule, and how Source will use it later.
- For the Structured Pricing Workbook, name every required cost section: one-time costs, recurring run costs, transition costs, transformation costs, tooling costs, governance costs, pass-through costs, optional services, change-order unit rates, retained client cost assumptions, volume-based pricing, productivity credits, SLA credits, assumptions.
- For the Automation / Productivity Commitment Table, state that it is required whenever the vendor claims AI, automation, productivity, transformation, or efficiency.
- For the Transition Plan Template, require named transition lead, knowledge-transfer plan, dependency list, cutover criteria, service-readiness criteria, early-life support plan, and transition-fee milestone linkage.
- Include an appendix-style commercial leverage readiness matrix mapping each future check to the response-control fields that enable it.
- Vendor-facing language only. Do not expose internal agent names, raw ids, routing keys, model/provider names, table names, or implementation labels. Do not claim perfect proposal parsing.
- Markdown only. Tables are expected. Keep the artifact complete enough to be copied into a vendor instruction pack or converted to xlsx/docx/pdf.`,
    buildUserMessage: (ctx, upstream) => {
      const lines: string[] = [
        `Company: ${ctx.tenantName}`,
        `Event: ${ctx.event.name} (${ctx.event.code})`,
        ctx.event.archetype ? `Archetype: ${ctx.event.archetype}` : null,
        ctx.event.rigor ? `Rigor: ${ctx.event.rigor}` : null,
        ctx.event.owner ? `Decision owner: ${ctx.event.owner}` : null,
        ctx.event.estimatedValueUsd
          ? `Intake value estimate: $${ctx.event.estimatedValueUsd.toLocaleString()}`
          : `Intake value estimate: (not provided)`,
        "",
        `Trigger / why-now: ${ctx.event.triggerDescription ?? "(not provided)"}`,
        `Scope description: ${ctx.event.scopeDescription || "(not provided)"}`,
        "",
        "— UPSTREAM CONTEXT —",
        "Approved Sourcing Strategy Memo (d01_strategy_memo):",
        upstream.d01_strategy_memo ??
          "(NOT YET AUTHORED — do not fabricate; surface as a prerequisite if the artifact is generated early)",
        "",
        "Approved Scope Memo (d05_scope_memo):",
        upstream.d05_scope_memo ??
          "(NOT YET AUTHORED — do not fabricate; surface as a prerequisite if the artifact is generated early)",
        "",
      ].filter((line): line is string => line !== null);

      if (upstream.d09_rfp_pack) {
        lines.push(
          "Draft RFP Package (d09_rfp_pack) — align response-control instructions to it:",
        );
        lines.push(upstream.d09_rfp_pack);
        lines.push("");
      }
      if (upstream.d02_value_target) {
        lines.push("Value Target Brief (d02_value_target) — use to shape commercial claim controls:");
        lines.push(upstream.d02_value_target);
        lines.push("");
      }
      if (upstream.d04_app_inv) {
        lines.push("Application Inventory (d04_app_inv) — use to shape tower/application response fields:");
        lines.push(upstream.d04_app_inv);
        lines.push("");
      }
      if (upstream.d07_ticket_synth) {
        lines.push("Ticket History Synthesis (d07_ticket_synth) — use to shape SLA/volume response fields:");
        lines.push(upstream.d07_ticket_synth);
        lines.push("");
      }

      const evidenceBlock = formatDraftEvidenceContext(ctx);
      if (evidenceBlock) {
        lines.push(evidenceBlock);
        lines.push("");
      }

      if (ctx.archetypeAdvisory) {
        lines.push(
          "— SOURCING-ADVISOR PLAYBOOK (archetype-specific commercial intelligence) —",
          "",
          ctx.archetypeAdvisory,
          "",
        );
      }

      lines.push(
        "Draft the Vendor Response Control Pack per the system prompt. Bind it to this event and scope, include all eight required response-control components, include the response-compliance mandate, and make the future commercial leverage checks possible without claiming perfect downstream proposal parsing.",
      );

      return lines.join("\n");
    },
  },

  d04_app_inv: {
    artifactCode: "d04_app_inv",
    version: 1,
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
    upstreamRequired: ["d01_strategy_memo"],
    upstreamOptional: ["d05_scope_memo"],
    systemPrompt: `${AVA_SOURCE_ADVISOR_VOICE}

You are drafting the Application and System Inventory (artifact d04_app_inv). This document catalogs the in-scope application and technology estate for this sourcing event — it is the estate baseline that drives scope definition, vendor sizing, SLA design, and the current-state baseline in the RFP.

Required structural sections:
## §1 · In-scope application and system inventory
## §2 · Criticality and risk tiering
## §3 · Integration and dependency map
## §4 · Disposition and support-model analysis
## §5 · Coverage gaps and assumptions

Requirements:
- §1 must include a table: Application/System | Type | Technology stack | Department/function | Current support model | Annual incident volume (if known) | Disposition. Derive the list from the scope memo, strategy memo, and uploaded evidence. If no application list is available, construct a representative draft from the event context and mark each row as [ASSUMED — client to validate].
- §2 classifies each application by criticality tier (Mission Critical / Business Critical / Standard) and risk dimension (compliance, data sensitivity, integration breadth, age/tech debt). Use a compact table.
- §3 captures key integration touch-points, upstream/downstream dependencies, and data flows relevant to sourcing scope decisions. Focus on dependencies that create transition risk or scope-split ambiguity.
- §4 recommends a disposition per application: retain current support model / include in scope / carve out / rationalize / retire. Ground recommendations in evidence where available; flag assumptions explicitly.
- §5 lists applications the evidence cannot confirm, assumptions made, and client actions needed to validate the inventory before RFP issue.
- 700–1,100 words total across narrative and tables. No generic IT boilerplate. Cite uploaded evidence files by name where they substantiate a row or claim.`,
    buildUserMessage: (ctx, upstream) => {
      const lines: string[] = [
        `Company: ${ctx.tenantName}`,
        `Event: ${ctx.event.name} (${ctx.event.code})`,
        ctx.event.archetype ? `Archetype: ${ctx.event.archetype}` : null,
        ctx.event.owner ? `Owner: ${ctx.event.owner}` : null,
        "",
        `Trigger / why-now: ${ctx.event.triggerDescription ?? "(not provided)"}`,
        `Scope description: ${ctx.event.scopeDescription || "(not provided)"}`,
        "",
        "— UPSTREAM CONTEXT —",
        "",
        `Approved Sourcing Strategy Memo (d01_strategy_memo):`,
        upstream.d01_strategy_memo ??
          "(NOT YET AUTHORED — derive from event intake; mark assumptions explicitly)",
        "",
      ].filter((line): line is string => line !== null);

      if (upstream.d05_scope_memo) {
        lines.push("Approved Scope Memo (d05_scope_memo) — use as primary scope boundary:");
        lines.push(upstream.d05_scope_memo);
        lines.push("");
      }

      lines.push("— ENTERPRISE APPLICATION INVENTORY (company's loaded systems estate) —");
      lines.push("");
      lines.push(buildAppInventoryPromptBlock(ctx.enterpriseAppInventory));
      lines.push("");

      const evidenceBlock = formatDraftEvidenceContext(ctx);
      if (evidenceBlock) {
        lines.push(evidenceBlock);
        lines.push("");
      }

      lines.push(
        "Draft the Application and System Inventory per the system prompt requirements. Where the company's application inventory above is provided, build the in-scope application table directly from it (verbatim IDs and names). Any application row NOT supported by that inventory or by uploaded evidence must be marked [ASSUMED — client to validate]. Do not expose internal product terms.",
      );
      return lines.join("\n");
    },
  },

  d07_ticket_synth: {
    artifactCode: "d07_ticket_synth",
    version: 1,
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
    upstreamRequired: ["d01_strategy_memo"],
    upstreamOptional: ["d05_scope_memo"],
    systemPrompt: `${AVA_SOURCE_ADVISOR_VOICE}

You are drafting the Ticket History Synthesis (artifact d07_ticket_synth). This document analyzes service demand, incident patterns, and ITSM volumetrics to ground the SLA obligations, vendor sizing, and pricing-volume basis in the RFP — so the §5 service-level table and §7 pricing instructions are evidence-anchored, not assumed.

Required structural sections:
## §1 · Ticket volume baseline and demand profile
## §2 · Incident severity distribution and SLA performance
## §3 · Service tower workload breakdown
## §4 · Trend analysis and seasonality
## §5 · SLA and operational implications for the RFP

Requirements:
- §1 must include a demand table: Period | Total tickets | P1 | P2 | P3/P4 | Monthly average | Peak month | Channel split. Derive from uploaded ITSM/ticket evidence or SLA reports. Where evidence is missing, construct a representative baseline from the event context and mark every row [ASSUMED — client to validate].
- §2 must include an SLA performance table: Severity | SLA target | Actual performance | Breach count | Breach penalty (if stated) | Root cause trend. Cite uploaded SLA performance evidence by filename.
- §3 breaks ticket volume by service tower (e.g. MDR/SOC, endpoint, IAM, PAM, OT security for a cybersecurity event; or service desk, infrastructure, application ops for a managed services event). Use a workload-by-tower table: Tower | Volume | % of total | Primary driver | SLA tier.
- §4 identifies demand trends, seasonality peaks, and structural shifts that the vendor must price for. Note any incident patterns (recurring root causes, growing categories) that signal scope risk.
- §5 translates the analysis into concrete SLA and operational implications: which SLA targets are achievable based on current incumbent performance, which need to be renegotiated, and where demand growth requires pricing-volume escalators. Write this as direct advice to the sourcing team.
- 700–1,100 words total across narrative and tables. No generic ITSM boilerplate. Cite uploaded evidence files by name where they substantiate a claim. Mark every unsupported claim as an assumption.`,
    buildUserMessage: (ctx, upstream) => {
      const lines: string[] = [
        `Company: ${ctx.tenantName}`,
        `Event: ${ctx.event.name} (${ctx.event.code})`,
        ctx.event.archetype ? `Archetype: ${ctx.event.archetype}` : null,
        ctx.event.owner ? `Owner: ${ctx.event.owner}` : null,
        "",
        `Trigger / why-now: ${ctx.event.triggerDescription ?? "(not provided)"}`,
        `Scope description: ${ctx.event.scopeDescription || "(not provided)"}`,
        "",
        "— UPSTREAM CONTEXT —",
        "",
        `Approved Sourcing Strategy Memo (d01_strategy_memo):`,
        upstream.d01_strategy_memo ??
          "(NOT YET AUTHORED — derive the SLA context from the event intake; mark all baselines as assumptions)",
        "",
      ].filter((line): line is string => line !== null);

      if (upstream.d05_scope_memo) {
        lines.push("Approved Scope Memo (d05_scope_memo) — use as the tower/service-level boundary:");
        lines.push(upstream.d05_scope_memo);
        lines.push("");
      }

      const evidenceBlock = formatDraftEvidenceContext(ctx);
      if (evidenceBlock) {
        lines.push(evidenceBlock);
        lines.push("");
      }

      lines.push(
        "Draft the Ticket History Synthesis per the system prompt requirements. Prioritize uploaded SLA performance, incident log, and ITSM evidence; where that evidence exists, derive every SLA figure and volume from it. Where it is absent, construct a plausible baseline from the event context and mark every row [ASSUMED — client to validate]. Do not expose internal product terms.",
      );
      return lines.join("\n");
    },
  },

  d24_decision_brief: {
    artifactCode: "d24_decision_brief",
    version: 1,
    model: BOARD_GRADE_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
    upstreamRequired: [],
    upstreamOptional: [
      "d01_strategy_memo",
      "d02_value_target",
      "d05_scope_memo",
      "d16_scorecard",
      "d19_pricing_workbook",
      "d22_bafo_question_pack",
    ],
    systemPrompt: `${AVA_SOURCE_ADVISOR_VOICE}

You are drafting the Decision Brief (artifact d24_decision_brief) — the board-grade recommendation that closes the event. It is the single most consequential document in the sourcing lifecycle: it synthesizes the whole chain (strategy, scope, evaluation scores, pricing, BAFO) into one defensible call an executive can sign.

Required structural sections:
## §1 · Recommendation
## §2 · Why this vendor
## §3 · Tradeoff card
## §4 · Finalist comparison
## §5 · Counter-recommendation
## §6 · Required sign-offs

Ground every claim in the bound upstream artifacts and uploaded evidence, cited by code and source-file name:
- §1 leads with the recommendation, stated conditionally (which vendor, conditional on what — e.g. security uplift, a priced assumption, a transition milestone).
- §4 finalist comparison must draw normalized TCO from the pricing workbook (d19) and the capability / security / transition scores from the evaluation scorecard (d16), and present them as a comparison table. Do NOT invent vendor names, scores, or prices that are not present in the bound upstream — if a finalist's number is missing, show it as a gap to close, not a guess.
- §3 tradeoff card frames value posture from the value target (d02), open risks with residual exposure, and the transition window; scope boundaries come from d05; the mandate from d01.
- §5 states the runner-up's case honestly so the brief is a real decision, not a one-sided pitch.
- §6 lists the sign-offs required to advance to Selection (sponsor commitment, Steward sign-off, Sentinel risk attestation).

If the evaluation scorecard (d16) or pricing workbook (d19) has not been authored yet, do not fabricate a comparison. Say plainly that the finalist comparison cannot be completed until those exist, name exactly what is missing, and give a conditional recommendation only to the extent the available evidence supports it. 1200-2400 words.`,
    buildUserMessage: (ctx, upstream) => {
      const lines: string[] = [
        `Company: ${ctx.tenantName}`,
        `Event: ${ctx.event.name} (${ctx.event.code})`,
        ctx.event.archetype ? `Archetype: ${ctx.event.archetype}` : null,
        ctx.event.owner ? `Decision owner: ${ctx.event.owner}` : null,
        ctx.event.estimatedValueUsd
          ? `Estimated value at stake: $${ctx.event.estimatedValueUsd.toLocaleString()}`
          : null,
        "",
        "— UPSTREAM EVENT CHAIN —",
        "",
      ].filter((line): line is string => line !== null);

      const bind = (code: string, label: string, driverNote: string) => {
        lines.push(`${label} (${code})${driverNote ? ` — ${driverNote}` : ""}:`);
        lines.push(
          upstream[code] ??
            "(NOT YET AUTHORED — do not fabricate; surface as a gap to close)",
        );
        lines.push("");
      };

      bind("d01_strategy_memo", "Sourcing Strategy Memo", "the mandate for §2");
      bind("d02_value_target", "Value Target Brief", "the value posture for §3");
      bind("d05_scope_memo", "Scope Memo", "scope boundaries");
      bind(
        "d16_scorecard",
        "Evaluation Scorecard",
        "capability / security / transition scores for §4",
      );
      bind("d19_pricing_workbook", "Pricing Workbook", "normalized TCO for §4");
      bind(
        "d22_bafo_question_pack",
        "BAFO Question Pack",
        "open concessions / clarifications",
      );

      const evidenceBlock = formatDraftEvidenceContext(ctx);
      if (evidenceBlock) {
        lines.push(evidenceBlock);
        lines.push("");
      }

      if (ctx.archetypeAdvisory) {
        lines.push(
          "— SOURCING-ADVISOR PLAYBOOK (archetype-specific commercial intelligence) —",
          "",
          ctx.archetypeAdvisory,
          "",
        );
      }

      lines.push(
        "Draft the Decision Brief per the system prompt requirements. Lead with the recommendation; build the finalist comparison only from the scorecard and pricing numbers above; keep the counter-recommendation honest.",
      );
      return lines.join("\n");
    },
  },

  d24_decision_brief: {
    artifactCode: 'd24_decision_brief',
    version: 1,
    model: DEFAULT_MODEL,
    maxTokens: 5000,
    upstreamRequired: [],
    upstreamOptional: [
      'd01_strategy_memo',
      'd02_value_target',
      'd05_scope_memo',
      'd16_scorecard',
      'd19_pricing_workbook',
      'd22_bafo_question_pack',
    ],
    systemPrompt: `${SENTINEL_VOICE}

You are drafting the Atlas Decision Brief (artifact d24_decision_brief) — the board-grade recommendation that closes the event. It synthesizes the whole event chain into one defensible call.

Required structural sections:
## §1 · Recommendation
## §2 · Why this vendor
## §3 · Tradeoff card
## §4 · Finalist comparison
## §5 · Counter-recommendation
## §6 · Required sign-offs

Ground every claim in the upstream artifacts bound below, cited by code:
- §1 recommendation must be conditional (which vendor, conditional on what).
- §4 finalist comparison must draw normalized TCO from the pricing workbook (d19) and the capability/security/transition scores from the scorecard (d16). Build the comparison table from those numbers — do NOT invent vendor names, scores, or prices that are not present in the bound upstream.
- §3 value posture draws from the value target (d02); scope boundaries from d05; the mandate from d01.
- §5 counter-recommendation states the runner-up case honestly so the brief is not a one-sided pitch.
- §6 lists the required sign-offs (sponsor commitment, Steward sign-off, Sentinel risk attestation).

If the scorecard (d16) or pricing workbook (d19) has not been authored, DO NOT fabricate a comparison. State plainly that the finalist comparison cannot be completed until those artifacts exist, list exactly what is missing, and give a conditional recommendation only to the extent the available evidence supports it. Tone: decisive but honest about evidence gaps. 800-1600 words.`,
    buildUserMessage: (ctx, upstream) => {
      const lines: string[] = [
        `Tenant: ${ctx.tenantName}`,
        `Event: ${ctx.event.name} (${ctx.event.code})`,
        ctx.event.archetype ? `Archetype: ${ctx.event.archetype}` : null,
        ctx.event.owner ? `Decision owner: ${ctx.event.owner}` : null,
        ctx.event.estimatedValueUsd
          ? `Estimated value at stake: $${ctx.event.estimatedValueUsd.toLocaleString()}`
          : null,
        '',
        '— UPSTREAM EVENT CHAIN —',
        '',
      ].filter((line): line is string => line !== null);

      const bind = (code: string, label: string, driverNote: string) => {
        lines.push(`${label} (${code})${driverNote ? ` — ${driverNote}` : ''}:`);
        lines.push(upstream[code] ?? '(NOT YET AUTHORED — do not fabricate; surface as a gap)');
        lines.push('');
      };

      bind('d01_strategy_memo', 'Sourcing Strategy Memo', 'the mandate for §2');
      bind('d02_value_target', 'Value Target Brief', 'the value posture for §3');
      bind('d05_scope_memo', 'Scope Memo', 'scope boundaries');
      bind('d16_scorecard', 'Evaluation Scorecard', 'capability/security/transition scores for §4');
      bind('d19_pricing_workbook', 'Pricing Workbook', 'normalized TCO for §4');
      bind('d22_bafo_question_pack', 'BAFO Question Pack', 'open concessions/clarifications');

      lines.push('Draft the Atlas Decision Brief per the system prompt requirements.');
      return lines.join('\n');
    },
  },
};

export function getPromptTemplate(
  artifactCode: string,
): SourceArtifactPromptTemplate | null {
  return REGISTRY[artifactCode] ?? null;
}

function formatEvidenceStates(ctx: SourceGenerationContext): string {
  if (ctx.evidence.length === 0) return "(no evidence states recorded)";
  const d09SatisfiedIds = getD09RfpSatisfiedRequirementIds(ctx);
  return ctx.evidence
    .map((item) => {
      const state =
        item.currentState === "Not Requested" &&
        d09SatisfiedIds.has(item.requirementId)
          ? "Available parsed evidence — citation review pending (normalized from uploaded D09 coverage map)"
          : item.currentState;
      return [
        `- ${item.requirementId}`,
        `stage=${item.stage}`,
        `state=${state}`,
        item.sourceArtifactId ? `artifact=${item.sourceArtifactId}` : null,
        item.notes ? `notes=${item.notes}` : null,
      ]
        .filter(Boolean)
        .join("; ");
    })
    .join("\n");
}

function formatUploadedEvidence(ctx: SourceGenerationContext): string {
  const evidence = ctx.uploadedEvidence ?? [];
  if (evidence.length === 0) return "(no parsed uploaded evidence available)";
  return evidence
    .map((artifact) => {
      const lines = [
        `### ${artifact.originalName}`,
        `artifact_id=${artifact.id}; family=${artifact.artifactFamily}; format=${artifact.sourceFormat}; parse=${artifact.parseStatus}; evidence=${artifact.evidenceState}; stage=${artifact.stageKey}`,
      ];
      const excerpts = artifact.chunkExcerpts.slice(0, 2);
      if (excerpts.length > 0) {
        lines.push("Chunk excerpts:");
        lines.push(...excerpts.map((excerpt) => `- ${excerpt}`));
      }
      const facts = artifact.factSummaries.slice(0, 2);
      if (facts.length > 0) {
        lines.push("Structured fact summaries:");
        lines.push(...facts.map((fact) => `- ${fact}`));
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

interface RfpEvidenceCoverageRule {
  label: string;
  keywords: string[];
  satisfies: string[];
  sections: string[];
  requiredUse: string;
}

const D09_RFP_EVIDENCE_COVERAGE_RULES: RfpEvidenceCoverageRule[] = [
  {
    label: "Exhibit 01 — Application portfolio and criticality baseline",
    keywords: ["application", "portfolio", "inscope"],
    satisfies: ["EVID-SRC-SCOPE-APP-INV"],
    sections: ["§2", "§3", "§4"],
    requiredUse:
      "Quantify in-scope application estate, tiering, stacks, interfaces, incident pressure, disposition, and support ownership.",
  },
  {
    label: "Exhibit 02 — ITSM ticket volumetrics and service demand baseline",
    keywords: ["itsm", "ticket", "volumetrics"],
    satisfies: ["EVID-SRC-SCOPE-TICKET-HISTORY"],
    sections: ["§2", "§5", "§7"],
    requiredUse:
      "Ground SLA/XLA obligations, service-desk sizing, incident demand, seasonality, and tower workload assumptions.",
  },
  {
    label: "Exhibit 03 — System workload volumetrics",
    keywords: ["system", "workload", "volumetrics"],
    satisfies: ["EVID-SRC-SCOPE-APP-INV"],
    sections: ["§2", "§4", "§7"],
    requiredUse:
      "Ground mainframe, batch, VM/container, database, storage, API, endpoint, and surge-volume instructions.",
  },
  {
    label: "Exhibit 04 — Resource capacity and FTE pyramid",
    keywords: ["resource", "capacity", "pyramid"],
    satisfies: ["EVID-SRC-SCOPE-ORG"],
    sections: ["§2", "§6", "§7"],
    requiredUse:
      "Ground retained/provider staffing, loaded-cost logic, transition capacity, KT exposure, and role mix.",
  },
  {
    label: "Exhibit 05 — SLA/XLA matrix",
    keywords: ["sla", "xla", "matrix"],
    satisfies: ["EVID-SRC-SCOPE-TICKET-HISTORY"],
    sections: ["§5", "§8", "§9"],
    requiredUse:
      "Populate service levels, credits, response/resolution commitments, and vendor response compliance requirements.",
  },
  {
    label: "Exhibit 06 — Tower scope and service catalog",
    keywords: ["tower", "scope", "service", "catalog"],
    satisfies: ["EVID-SRC-SCOPE-FY-CONTRACT"],
    sections: ["§3", "§5", "§8"],
    requiredUse:
      "Define tower inclusions, exclusions, volumetric basis, dependencies, service levels, and response tables.",
  },
  {
    label: "Exhibit 07 — Incumbent contract baseline (internal-only)",
    keywords: ["incumbent", "contract", "baseline"],
    satisfies: ["EVID-SRC-STR-INCUMBENT", "EVID-SRC-SCOPE-FY-CONTRACT"],
    sections: ["§1", "§2", "§6", "§7"],
    requiredUse:
      "Ground renewal/notice windows, KT provisions, run-cost baseline, and commercial guardrails without exposing incumbent names/spend in vendor-facing body.",
  },
  {
    label: "Exhibit 08 — Locked pricing assumptions and volume bands",
    keywords: ["locked", "pricing", "assumptions", "volume", "bands"],
    satisfies: ["EVID-SRC-PRICE-ASSUMPTIONS"],
    sections: ["§7", "§8", "§9"],
    requiredUse:
      "Ground pricing normalization, should-cost assumptions, volume bands, pass-through rules, productivity glidepath, COLA caps, and pricing-template instructions.",
  },
  {
    label: "Exhibit 09 — Approved evaluation criteria and weights",
    keywords: ["evaluation", "criteria", "weights", "approved"],
    satisfies: ["EVID-SRC-EVAL-WEIGHT-RATIONALE"],
    sections: ["§8", "§9", "§11"],
    requiredUse:
      "Populate weighted scorecard, scoring guidance, red-flag/disqualification rules, shortlist thresholds, and evaluation gate criteria.",
  },
  {
    label: "Exhibit 10 — Vendor response expectations",
    keywords: ["vendor", "response", "expectations"],
    satisfies: ["EVID-SRC-RFP-LEGAL-TEMPLATE"],
    sections: ["§8", "§9", "§11"],
    requiredUse:
      "Treat as the governed response-format and RFP-instruction template for required forms, pricing workbook instructions, BAFO/compliance fields, and submission rules.",
  },
  {
    label: "Exhibit 11 — Data center and infrastructure inventory",
    keywords: ["data", "center", "infrastructure", "inventory"],
    satisfies: ["EVID-SRC-SCOPE-APP-INV"],
    sections: ["§2", "§4", "§6"],
    requiredUse:
      "Ground data centers, private-cloud/HCI footprint, storage/compute refresh status, operational dependencies, and transition constraints.",
  },
  {
    label: "Exhibit 12 — Network topology and circuit inventory",
    keywords: ["network", "topology", "circuit"],
    satisfies: ["EVID-SRC-SCOPE-APP-INV"],
    sections: ["§2", "§4", "§6"],
    requiredUse:
      "Ground SD-WAN/MPLS, bandwidth, redundancy, airport/site connectivity, carrier handoffs, and network operations obligations.",
  },
  {
    label: "Exhibit 13 — Security and compliance control posture",
    keywords: ["security", "compliance", "control", "posture"],
    satisfies: ["EVID-SRC-DEC-RISK-REGISTER"],
    sections: ["§5", "§6", "§10", "§11"],
    requiredUse:
      "Ground control obligations, open findings, patch/compliance gaps, CSPM remediation, risk register entries, and security response requirements.",
  },
  {
    label: "Exhibit 14 — Transition operations blackout calendar",
    keywords: ["transition", "ops", "blackout", "calendar"],
    satisfies: ["EVID-SRC-TRAN-MILESTONES", "EVID-SRC-DEC-RISK-REGISTER"],
    sections: ["§6", "§8", "§10", "§11"],
    requiredUse:
      "Ground transition timeline, blackout/freeze periods, critical decision dates, cutover constraints, and transition risk mitigations.",
  },
  {
    label: "Exhibit 15 — Run-vs-change financial baseline",
    keywords: ["run", "change", "financial", "baseline"],
    satisfies: ["EVID-SRC-SCOPE-FY-CONTRACT", "EVID-SRC-PRICE-ASSUMPTIONS"],
    sections: ["§1", "§2", "§7", "§9"],
    requiredUse:
      "Ground run/change spend, tower financial baseline, pricing normalization, value target, and commercial comparison controls.",
  },
];

export function formatD09RfpEvidenceCoverage(
  ctx: SourceGenerationContext,
): string {
  const uploaded = ctx.uploadedEvidence ?? [];
  if (uploaded.length === 0) {
    return [
      "- No uploaded evidence artifacts are available to bind. The RFP must remain a client-to-complete draft.",
      "- Do not claim pricing, evaluation, risk, legal, or transition evidence is loaded unless an uploaded artifact supports it.",
    ].join("\n");
  }

  const lines = [
    "Use this map as the authoritative bridge from uploaded evidence-room files to D09 RFP sections. If a mapped file appears below, do not call that requirement Not Requested in the source register; mark it as Available parsed evidence — citation review pending when parseStatus/evidenceState is still draft.",
  ];

  for (const rule of D09_RFP_EVIDENCE_COVERAGE_RULES) {
    const match = uploaded.find((artifact) =>
      rule.keywords.every((keyword) =>
        artifact.originalName.toLowerCase().includes(keyword),
      ),
    );
    if (!match) {
      lines.push(
        `- ${rule.label}: MISSING — client action required; satisfies ${rule.satisfies.join(", ")}; required for ${rule.sections.join(", ")}.`,
      );
      continue;
    }
    lines.push(
      [
        `- ${rule.label}: uploaded as "${match.originalName}"`,
        `parse=${match.parseStatus}`,
        `evidence=${match.evidenceState}`,
        `satisfies=${rule.satisfies.join(", ")}`,
        `use_in=${rule.sections.join(", ")}`,
        `required_use=${rule.requiredUse}`,
      ].join("; "),
    );
  }

  lines.push(
    "Source register rule: list every mapped exhibit above with status, section use, and any remaining client-to-complete action. Blocking gaps are only items still missing after this coverage map, not mapped files that were uploaded.",
  );
  lines.push(
    "Risk/action rule: §10 must include a risk register derived from Exhibits 07, 13, and 14; §11 must include a gap closure register with accountable roles, target dates or gate-relative triggers, blocking gate, and downstream impact.",
  );
  return lines.join("\n");
}

export function getD09RfpSatisfiedRequirementIds(
  ctx: SourceGenerationContext,
): Set<string> {
  const satisfied = new Set<string>();
  const uploaded = ctx.uploadedEvidence ?? [];
  for (const rule of D09_RFP_EVIDENCE_COVERAGE_RULES) {
    const match = uploaded.find((artifact) =>
      rule.keywords.every((keyword) =>
        artifact.originalName.toLowerCase().includes(keyword),
      ),
    );
    if (!match) continue;
    for (const requirementId of rule.satisfies) {
      satisfied.add(requirementId);
    }
  }
  return satisfied;
}

export function listSupportedGenerationCodes(): string[] {
  return Object.keys(REGISTRY).sort();
}

/**
 * Resolve the upstream-required gap for a template against bound
 * context. Returns null if all required upstream codes have non-empty
 * bodies; returns the missing codes otherwise.
 */
export function findMissingUpstreamCodes(
  template: SourceArtifactPromptTemplate,
  ctx: SourceGenerationContext,
): string[] {
  return template.upstreamRequired.filter((code) => {
    const row = ctx.artifactStates.find((a) => a.artifactCode === code);
    return !row?.body || row.body.trim().length === 0;
  });
}

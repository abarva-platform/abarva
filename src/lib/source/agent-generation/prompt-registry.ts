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
} from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-6";
// Practical ceiling — 4000 output tokens produces ~10–12 pages
// of polished markdown in ~30–45s wall-clock. Above 4000 the marginal
// quality is small and the wall-clock blows past Vercel function
// budgets. Override per template only when the artifact genuinely needs
// more (BAFO question pack with finalist-specific sections, decision
// brief with multiple appendices).
const DEFAULT_MAX_TOKENS = 4000;

const SENTINEL_VOICE = `You are Sentinel, AbarVa's information-integrity validator on the Source surface.

Voice register:
- Validator, not advisor. State what is verified, what is asserted, and what is unknown.
- Cite specific upstream artifacts by their code when relevant (e.g. "per d05 scope memo").
- Lead with the most decision-relevant signal, not background.
- Precise. No hedging language. No generic procurement boilerplate.
- No fabrication. If an upstream input is missing, say so explicitly and surface it as a gap rather than inventing content.

Format requirements:
- Markdown only. Use ATX headings (#, ##, ###).
- Use ## for section headers and ### for subsections.
- Tables when comparing. Bullet lists when enumerating.
- Numbered §-prefixed sections (## §1 · …) match the AbarVa house style.`;

const REGISTRY: Record<string, SourceArtifactPromptTemplate> = {
  d01_strategy_memo: {
    artifactCode: "d01_strategy_memo",
    version: 1,
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
    upstreamRequired: [],
    upstreamOptional: [],
    systemPrompt: `${SENTINEL_VOICE}

You are drafting the Sourcing Strategy Memo (artifact d01_strategy_memo). This is the foundational document for a sourcing event — it answers Why Now, What we're sourcing, the Value Target, the Archetype, and the Rigor level.

Required structural sections:
## §1 · Why now
## §2 · What we are sourcing
## §3 · Value target
## §4 · Archetype + rigor
## §5 · Decision-gate posture

Tone: tight. 600-1200 words total. No filler. Cite the trigger from the event intake. Name the decision owner explicitly. State the value target as a range with confidence band when the intake provided one. Pick the archetype + rigor based on archetype + rigor heuristics: standard rigor for run-rate continuity, enhanced for material savings claims, strategic for transformation programs.`,
    buildUserMessage: (ctx) => {
      return [
        `Tenant: ${ctx.tenantName} (key: ${ctx.tenantKey})`,
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
        `Draft the Sourcing Strategy Memo per the system prompt requirements.`,
      ]
        .filter((line): line is string => line !== null)
        .join("\n");
    },
  },

  d05_scope_memo: {
    artifactCode: "d05_scope_memo",
    version: 1,
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
    upstreamRequired: ["d01_strategy_memo"],
    upstreamOptional: ["d04_app_inv", "d07_ticket_synth"],
    systemPrompt: `${SENTINEL_VOICE}

You are drafting the Scope Memo with Boundaries (artifact d05_scope_memo). This document is vendor-facing once locked — it must be precise about what's in and out of scope so vendors price + propose against the same definition.

Required structural sections:
## §1 · In scope
## §2 · Out of scope
## §3 · Boundary clarifications
## §4 · Scope owner + approval

Tone: precise, list-heavy. The "in scope" section names systems, services, hours-of-coverage, and SLA expectations. The "out of scope" section is exhaustive — anything not listed in §1 is implicitly out, but explicit listings prevent later vendor disputes. Boundary clarifications cover edge cases the strategy memo didn't pin down. End with the named scope owner who locks the document.`,
    buildUserMessage: (ctx, upstream) => {
      const lines: string[] = [
        `Tenant: ${ctx.tenantName}`,
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
    version: 7,
    model: DEFAULT_MODEL,
    maxTokens: 5600,
    upstreamRequired: ["d01_strategy_memo", "d05_scope_memo"],
    upstreamOptional: ["d02_value_target", "d04_app_inv", "d07_ticket_synth"],
    systemPrompt: `${SENTINEL_VOICE}

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

Mandatory tables:
- In-scope / out-of-scope service tower matrix.
- Current-state baseline table covering applications, workloads, tickets, FTE, run cost, data center/private cloud, network, security/compliance, contracts, and run-vs-change spend.
- SLA and operational obligations table.
- Transition constraints and blackout calendar table.
- Pricing and volume-basis instruction table.
- Evaluation weights and evidence-required scoring table.
- Risk, issue, dependency, and mitigation table.
- Process timeline table with [CLIENT TO SET] placeholders only when dates are genuinely missing.
- Source register separating locked uploaded evidence, upstream draft artifacts, working assumptions, and client-to-complete gaps.
- Client-to-complete / vendor-to-confirm register with owner, due date placeholder, why it matters, and downstream impact.

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
- §8: must include vendor response/submission requirements table.
- §9: must include evaluation methodology table with weights/scoring bands/disqualification controls.
- §10: must include consolidated risk register table with owner and mitigation.
- §11: must include source register and gap closure/client-to-complete register with owner, due date placeholder, blocking gate, and downstream impact.

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

Quality requirement: produce a draft that can pass the partner-grade quality review without a follow-up rewrite. Every major claim must either cite/derive from bound evidence, be framed as an assumption to validate, or be listed as a client-to-complete gap with owner/action. Include practical mitigations for risks; do not merely flag them.`,
    buildUserMessage: (ctx, upstream) => {
      const lines: string[] = [
        `Tenant: ${ctx.tenantName}`,
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
        "— GOVERNED EVIDENCE STATE SUMMARY —",
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

      lines.push(
        "Draft the RFP Package per the system prompt requirements. Use the evidence-state summary and uploaded evidence excerpts as a completeness checklist: when a category is loaded or usable, reflect it in the right section and cite a friendly exhibit label; when a category is missing or low confidence, add it to the client-to-complete register with owner/action/why-it-matters instead of filling with generic text. This is a governed vendor-facing draft, not an issued final; explicit client-to-complete placeholders are acceptable only when clearly registered and not hidden in the narrative. Keep the draft compact and section-complete: every section §1 through §11 must appear, §7–§11 must not be sacrificed for long baseline prose, and the final line must confirm the draft is complete pending registered gap closure.",
      );
      return lines.join("\n");
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
  return ctx.evidence
    .map((item) =>
      [
        `- ${item.requirementId}`,
        `stage=${item.stage}`,
        `state=${item.currentState}`,
        item.sourceArtifactId ? `artifact=${item.sourceArtifactId}` : null,
        item.notes ? `notes=${item.notes}` : null,
      ]
        .filter(Boolean)
        .join("; "),
    )
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
      "Treat as the governed response-format and RFP-instruction template for required forms, pricing workbook instructions, BAFO/compliance placeholders, and submission rules.",
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

function formatD09RfpEvidenceCoverage(ctx: SourceGenerationContext): string {
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
        `- ${rule.label}: [CLIENT TO COMPLETE] missing upload; satisfies ${rule.satisfies.join(", ")}; required for ${rule.sections.join(", ")}.`,
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
    "Risk/action rule: §10 must include a risk register derived from Exhibits 07, 13, and 14; §11 must include a gap closure register with owner placeholders, due-date placeholders, blocking gate, and downstream impact.",
  );
  return lines.join("\n");
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

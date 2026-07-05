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

const DEFAULT_MODEL = 'claude-sonnet-4-6';
// Practical ceiling — Sonnet at 4000 output tokens produces ~10–12 pages
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
    artifactCode: 'd01_strategy_memo',
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
        '',
        `Trigger / why-now: ${ctx.event.triggerDescription ?? '(not provided in intake)'}`,
        '',
        `Scope description from intake:`,
        ctx.event.scopeDescription || '(not provided)',
        '',
        `Draft the Sourcing Strategy Memo per the system prompt requirements.`,
      ]
        .filter((line): line is string => line !== null)
        .join('\n');
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
    artifactCode: 'd05_scope_memo',
    version: 1,
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
    upstreamRequired: ['d01_strategy_memo'],
    upstreamOptional: ['d04_app_inv', 'd07_ticket_synth'],
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
        '',
        '— UPSTREAM CONTEXT —',
        '',
        `Approved Sourcing Strategy Memo (d01_strategy_memo):`,
        upstream.d01_strategy_memo ?? '(NOT YET AUTHORED — generate using event intake fallback)',
        '',
      ].filter((line): line is string => line !== null);

      if (upstream.d04_app_inv) {
        lines.push('Approved Application Inventory (d04_app_inv) — use as in-scope source list:');
        lines.push(upstream.d04_app_inv);
        lines.push('');
      }
      if (upstream.d07_ticket_synth) {
        lines.push('Ticket History Synthesis (d07_ticket_synth) — informs SLA / hours-of-coverage:');
        lines.push(upstream.d07_ticket_synth);
        lines.push('');
      }

      lines.push('Draft the Scope Memo per the system prompt requirements.');
      return lines.join('\n');
    },
  },

  d09_rfp_pack: {
    artifactCode: 'd09_rfp_pack',
    version: 2,
    model: DEFAULT_MODEL,
    maxTokens: 5000,
    upstreamRequired: ['d01_strategy_memo', 'd05_scope_memo'],
    upstreamOptional: ['d02_value_target', 'd04_app_inv', 'd07_ticket_synth'],
    systemPrompt: `${SENTINEL_VOICE}

You are drafting the RFP Package (artifact d09_rfp_pack) — the flagship vendor-facing document. Vendors will price + propose against this. It must be complete, unambiguous, and structured so vendor responses are comparable downstream.

Required structural sections:
## §1 · Executive summary + scope
## §2 · Sourcing background
## §3 · In-scope services + applications
## §4 · Service-level expectations
## §5 · Required vendor capabilities
## §6 · Response format + completeness checklist
## §7 · Pricing instructions
## §8 · Evaluation criteria + weights
## §9 · Timeline + key dates
## §10 · Submission instructions

Tone: formal procurement style. Vendor-facing — assume the reader is a sales engineer at AWS/Azure/GCP/Coupa-tier vendor. Explicit, exhaustive, no procurement boilerplate. Quote scope from d05 verbatim where possible. Reference the value-target range from d01 without disclosing internal sensitivity. Pricing instructions point to the assumption set d21 + the empty pricing template d19a (note: those exist as separate artifacts; the RFP body references them).`,
    buildUserMessage: (ctx, upstream) => {
      const lines: string[] = [
        `Tenant: ${ctx.tenantName}`,
        `Event: ${ctx.event.name} (${ctx.event.code})`,
        ctx.event.archetype ? `Archetype: ${ctx.event.archetype}` : null,
        ctx.event.rigor ? `Rigor: ${ctx.event.rigor}` : null,
        ctx.event.owner ? `Decision owner: ${ctx.event.owner}` : null,
        '',
        '— UPSTREAM CONTEXT —',
        '',
        'Approved Sourcing Strategy Memo (d01_strategy_memo):',
        upstream.d01_strategy_memo ?? '(NOT YET AUTHORED — DO NOT FABRICATE; surface the gap in the draft)',
        '',
        'Approved Scope Memo (d05_scope_memo):',
        upstream.d05_scope_memo ?? '(NOT YET AUTHORED — DO NOT FABRICATE; surface the gap in the draft)',
        '',
      ].filter((line): line is string => line !== null);

      if (upstream.d02_value_target) {
        lines.push('Value Target Brief (d02_value_target):');
        lines.push(upstream.d02_value_target);
        lines.push('');
      }
      if (upstream.d04_app_inv) {
        lines.push('Application Inventory (d04_app_inv) — drives §3:');
        lines.push(upstream.d04_app_inv);
        lines.push('');
      }
      if (upstream.d07_ticket_synth) {
        lines.push('Ticket History Synthesis (d07_ticket_synth) — drives §4 SLA expectations:');
        lines.push(upstream.d07_ticket_synth);
        lines.push('');
      }

      lines.push('Draft the RFP Package per the system prompt requirements.');
      return lines.join('\n');
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

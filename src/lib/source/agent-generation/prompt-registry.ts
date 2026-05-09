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

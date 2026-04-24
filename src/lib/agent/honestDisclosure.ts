// Honest-disclosure vocabulary · File 08 Section 10
//
// Agents speak with consistent confidence vocabulary. This module is the
// single source of truth for the phrases listed in §10.1-10.6. The
// renderer composes them against the `rendered_response` shape to tell
// the reader what kind of claim they're looking at.
//
// Why a module and not inline strings: personas reading the library (Dr.
// L especially) track confidence vocabulary carefully. If Nexus and
// Sentinel say the same thing different ways for "evidence is thin" the
// pattern reads as sloppy, not rigorous. One module ensures the voice
// stays tight across four agents.
//
// The phrases here are intentionally short — they're headers or openers,
// not body prose. The agent's composed response provides the substantive
// claim; the vocabulary frames what level of certainty the claim carries.

import type { ConfidenceSignal, Provenance } from './renderedResponse';

/**
 * §10.1 · High confidence openers.
 * Use when retrieval returned ≥3 patterns above 0.8 confidence and at
 * least one direct precedent was cited.
 */
export const HIGH_CONFIDENCE_PHRASES = [
  'Direct precedent.',
  'Measured across multiple programs.',
  'Benchmarked.',
] as const;

/**
 * §10.2 · Medium confidence openers.
 * Use when retrieval matched adjacent patterns or when direct evidence
 * is limited but inference is defensible.
 */
export const MEDIUM_CONFIDENCE_PHRASES = [
  'Inferred from adjacent pattern. Direct evidence is limited.',
  'Pattern suggests, though we haven\u2019t seen this specific case.',
  'Reasonable extrapolation; applies if the named assumption holds.',
] as const;

/**
 * §10.3 · Low confidence openers.
 * Use when retrieval returned nothing above 0.6 or when the claim is
 * explicitly speculative. The response MUST open with one of these before
 * rendering any LOW-tier citations (per §9.3 rule).
 */
export const LOW_CONFIDENCE_PHRASES = [
  'This is a reasoned guess \u2014 we don\u2019t have direct evidence.',
  'The pattern library doesn\u2019t cover this case; here\u2019s the closest analog.',
  'I don\u2019t have strong data on this. Want me to tell you what we\u2019d need to answer better?',
] as const;

/**
 * §10.4 · Sparse retrieval openers.
 * When `rendered_response.sparsity_flag` is true, the renderer MUST show
 * one of these as the first substantive sentence (§4.7, §7.3).
 */
export const SPARSITY_PHRASES = [
  'Evidence on this is thin \u2014 here\u2019s what we can say.',
  'The library doesn\u2019t have strong patterns for this. What we do have is below.',
  'I can\u2019t answer this from patterns alone. Do you want me to reason from first principles instead?',
] as const;

/**
 * §10.5 · Industry-authored vs measured-outcome prefixes.
 * Attach to any observation citation so the reader sees whether the
 * source is industry knowledge vs customer outcomes. Conflating them is
 * a rendering bug per §10.5 and the canonical disclaimer.
 */
export const PROVENANCE_PREFIXES: Record<Provenance, string> = {
  authored: 'Authored from industry knowledge (not measured outcomes):',
  observed: 'Observed in program telemetry:',
  measured: 'Measured in programs:',
  composite: 'Composite observation (aggregated across tenants):',
};

/**
 * §10.6 · "I can't help on this turn" patterns.
 * Used when Claude legitimately can't answer — outside scope, missing
 * composition, wrong surface. Every one of these offers a path forward;
 * never a bare refusal.
 */
export const CANNOT_HELP_PHRASES = [
  'That\u2019s outside what AbarVa tracks.',
  'I don\u2019t have access to that data in the current composition. Want me to flag it for the program team?',
  'The question is worth asking but the answer lives outside the pattern library. Try the linked alternate path.',
] as const;

/**
 * Select the opener phrase that matches the response's confidence signal.
 * Returns null for `none` signal (operational/procedural responses don't
 * need a confidence opener).
 */
export function openerFor(signal: ConfidenceSignal, index = 0): string | null {
  switch (signal) {
    case 'high':
      return HIGH_CONFIDENCE_PHRASES[index % HIGH_CONFIDENCE_PHRASES.length];
    case 'medium':
      return MEDIUM_CONFIDENCE_PHRASES[index % MEDIUM_CONFIDENCE_PHRASES.length];
    case 'low':
      return LOW_CONFIDENCE_PHRASES[index % LOW_CONFIDENCE_PHRASES.length];
    case 'none':
    default:
      return null;
  }
}

/**
 * Select a sparsity opener. Callers can rotate the index to avoid the
 * library feeling stale across repeated sparse responses.
 */
export function sparsityOpener(index = 0): string {
  return SPARSITY_PHRASES[index % SPARSITY_PHRASES.length];
}

/**
 * Attach §10.5 provenance prefix to an observation label. Returns the
 * label unchanged when provenance is unset (legacy citations from
 * earlier work orders may not have it yet).
 */
export function withProvenance(label: string, provenance?: Provenance): string {
  if (!provenance) return label;
  return `${PROVENANCE_PREFIXES[provenance]} ${label}`;
}

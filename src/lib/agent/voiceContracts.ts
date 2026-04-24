// Voice contracts · File 08 Section 5
//
// Per-agent response-structure rules. Codex's Stage 5 composition reads
// these when building each agent's system prompt; Code's Stage 7 render
// reads them when laying out the response body. One file, two consumers.
//
// This module is declarative — it does not render. It ships the shape
// (opener vs body vs closer rules, word-count ceilings, citation
// frequency expectations) that both runtime and renderer agree on.

import type { AgentKey } from '@/components/agent-rail/AgentRail';

/**
 * The response-structure contract each agent renders to. These aren't
 * hard constraints the UI enforces — they're the shape Stage 5 system
 * prompts target, and Stage 7 uses to pick between compact and sectioned
 * citation layouts.
 */
export interface VoiceContract {
  agent: AgentKey;

  /**
   * What the opening sentence of every response must do. Not a template —
   * a constraint Stage 5 anchors in the system prompt.
   */
  opener_rule: string;

  /**
   * Body structure — how §5 says the agent organizes claims.
   */
  body_structure: string;

  /**
   * What the last line must be. Never a generic "let me know if you have
   * questions" (§5.1). Each agent closes differently.
   */
  closer_rule: string;

  /**
   * Soft word-count ceiling. Stage 5 token budgets enforce a hard cap;
   * this is the stylistic target.
   */
  target_word_count: number;

  /**
   * Expected citation cadence. Nexus/Sentinel cite every substantive
   * claim; Atlas cites dollar figures and named programs; Steward cites
   * connector states and audit refs.
   */
  citation_cadence: 'every-claim' | 'every-substantive' | 'named-entities-only';

  /**
   * Renderer hint for AgentResponse: compact citations (superscript) fit
   * dense prose; sectioned layouts use full pills.
   */
  render_mode: 'compact' | 'sectioned';

  /**
   * Accent color for this agent's citations and follow-up chips in its
   * own zone. Other agents citing this agent's content keep their own
   * zone accent (zone continuity beats citation provenance color).
   */
  accent: string;

  /**
   * Phrases this agent must NEVER use. Stage 5 system prompts include
   * these as anti-patterns; Stage 7 can lint the rendered text for them
   * and flag as `quality_issue: voice_violation` per §15.
   */
  forbidden_phrases: readonly string[];
}

export const VOICE_CONTRACTS: Record<AgentKey, VoiceContract> = {
  nexus: {
    agent: 'nexus',
    opener_rule: 'Direct engagement. No preamble. No "great question." First sentence must take a position or name the key pressure-test.',
    body_structure: 'Numbered or sectioned — threes are common ("three things worth pressure-testing"). Each substantive claim carries an inline citation.',
    closer_rule: 'Close with a concrete next step — a reframing suggestion, a diagnostic question, or a next-step proposal. Never "let me know if you have any questions."',
    target_word_count: 220,
    citation_cadence: 'every-substantive',
    render_mode: 'sectioned',
    accent: '#0E9F8C',
    forbidden_phrases: [
      'great question',
      'let me know if you have',
      'happy to help',
      'hope that helps',
      'feel free to',
    ],
  },
  sentinel: {
    agent: 'sentinel',
    opener_rule: 'Reference the specific pattern or library slice the query matched. When retrieval is sparse, say "evidence on this is thin" as the first substantive sentence — never buried.',
    body_structure: 'Evidence-forward. Cite observations with evidence counts and confidence per claim. Never invent patterns or observations — only cite existing ones.',
    closer_rule: 'Close with either a drill-down offer ("I can walk you through the two strongest citations") or a related-pattern pointer.',
    target_word_count: 240,
    citation_cadence: 'every-claim',
    render_mode: 'sectioned',
    accent: '#9B6DFF',
    forbidden_phrases: [
      'evidence suggests',
      'studies have shown',
      'it is well known',
      'experts agree',
    ],
  },
  atlas: {
    agent: 'atlas',
    opener_rule: 'Open with the headline — what matters right now. No preamble.',
    body_structure: 'Two or three short paragraphs. Each paragraph one pressure, one recommended action. Dollar amounts always carry context (per month, projected, realized).',
    closer_rule: 'Close with a single decision prompt — "decide by [date]" or "choose: pursue / defer / reject."',
    target_word_count: 150,
    citation_cadence: 'named-entities-only',
    render_mode: 'compact',
    accent: '#F59E0B',
    forbidden_phrases: [
      'overall',
      'in summary',
      'to conclude',
      'moving forward',
      'going forward',
    ],
  },
  steward: {
    agent: 'steward',
    opener_rule: 'Open with the specific operational status the query bears on. Terse is fine.',
    body_structure: 'List-structured — operations in progress, anomalies detected, actions required. Cite specific connector states, audit records, quality scores. Never speculate about business outcomes; stay operational.',
    closer_rule: 'Close with a prioritized action list — "fix first: A. fix next: B. monitor: C."',
    target_word_count: 180,
    citation_cadence: 'every-substantive',
    render_mode: 'compact',
    accent: '#3B82F6',
    forbidden_phrases: [
      'should improve',
      'likely to',
      'may lead to',
      'strategic',
    ],
  },
};

/**
 * Lint a rendered agent response for forbidden phrases. Returns the
 * violations so the renderer or the feedback store can tag the turn.
 * Case-insensitive match.
 */
export function lintVoice(agent: AgentKey, text: string): string[] {
  const contract = VOICE_CONTRACTS[agent];
  const lower = text.toLowerCase();
  return contract.forbidden_phrases.filter((p) => lower.includes(p.toLowerCase()));
}

/**
 * Soft word-count check. Returns the delta over the target; 0 or negative
 * means within budget. Stage 5 uses this to decide whether to trim.
 */
export function wordCountDelta(agent: AgentKey, text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return words - VOICE_CONTRACTS[agent].target_word_count;
}

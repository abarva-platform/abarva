import type { AtlasIntent, AtlasRouteType } from '@/lib/atlas/types';

export interface AtlasClassification {
  intent: AtlasIntent;
  routeType: AtlasRouteType;
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

interface IntentRule {
  intent: AtlasIntent;
  routeType: AtlasRouteType;
  /** All terms grouped — a hit on any term routes here. */
  terms: string[];
  /**
   * Optional gate: every gate phrase must also match (in addition to a term hit)
   * for this rule to fire. Used to disambiguate "industry" between context and
   * peer-leader questions, for example.
   */
  requireAll?: string[];
}

/**
 * Intent catalog — every intent maps to a deterministic handler in
 * scripted-engine.ts. The catalog covers the 25 canonical CXO question types
 * documented in docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md §3. Rules
 * are evaluated in order; the first match wins. The catch-all `llm` route at
 * the bottom is the deliberate fallback for genuinely free-form questions —
 * not the default for missing coverage.
 */
const INTENT_RULES: IntentRule[] = [
  // ---- Drilldowns (Q21, Q22, Q23) — checked first because "tell me more about
  // <thing>" is very specific and we want it to win over broader terms below.
  {
    intent: 'vendor_drilldown',
    routeType: 'scripted',
    terms: [
      'tell me about vendor',
      'tell me more about vendor',
      'what about vendor',
      'walk me through vendor',
      'vendor profile',
      'vendor detail',
      'who is the vendor',
    ],
  },
  {
    intent: 'program_drilldown',
    routeType: 'scripted',
    terms: [
      'tell me about program',
      'tell me more about program',
      'tell me about apx-',
      'tell me about mhg-',
      'tell me about fcb-',
      'walk me through program',
      'walk me through apx-',
      'walk me through mhg-',
      'walk me through fcb-',
      'program profile',
      'program detail',
      'program drilldown',
      'show me program ',
    ],
  },
  {
    intent: 'signal_drilldown',
    routeType: 'hybrid',
    terms: [
      'tell me more about',
      'walk me through',
      'show provenance',
      'walk me through signal',
      'signal detail',
    ],
  },

  // ---- Decisions (Q19, Q20, Q24, Q25) — refusal posture, hands off to
  // Sentinel. Catch before LLM fallback. Includes the new "why" intents that
  // explicitly ask Atlas to recommend a fund/kill/reshape — Atlas refuses with
  // a handoff and shows the facts a Sentinel decision would weigh.
  {
    intent: 'fund_next_why',
    routeType: 'scripted',
    terms: [
      'what should i fund',
      'what should we fund',
      'where should i invest',
      'where should we invest',
      'what to fund next',
      'fund next',
      'next program to fund',
    ],
  },
  {
    intent: 'kill_next_why',
    routeType: 'scripted',
    terms: [
      'what should i kill',
      'what should we kill',
      'what should we cancel',
      'what to kill next',
      'kill next',
      'shut down next',
      'sunset next',
    ],
  },
  {
    intent: 'reshape_next_why',
    routeType: 'scripted',
    terms: [
      'what should i reshape',
      'what should we reshape',
      'what should we rescope',
      'reshape next',
      'rescope next',
      'pivot next',
    ],
  },
  {
    intent: 'cut_program_impact',
    routeType: 'scripted',
    terms: [
      "what's at stake",
      'what is at stake',
      'if i cut',
      'if we cut',
      'if i kill program',
      'if we kill program',
      'impact of cutting',
      'impact of canceling',
      'impact of cancelling',
    ],
  },
  {
    intent: 'fund_x_vs_y',
    routeType: 'scripted',
    terms: [
      'fund x instead of y',
      ' instead of ',
      ' versus ',
      ' vs ',
      'compare program',
      'compare programs',
      'tradeoff between',
      'trade-off between',
      'trade off between',
    ],
    requireAll: ['program'],
  },
  {
    intent: 'strategy_refusal',
    routeType: 'scripted',
    terms: [
      'is this the right move',
      'what should our strategy be',
      'should we buy',
      'should we consolidate',
      'should we fund',
      'should we renew',
      'should we exit',
      'should we double down',
      'cancel the',
      'approve the',
      'terminate the',
      'renegotiate the',
      'sign the',
    ],
  },

  // ---- Portfolio diagnostics (Q1-Q6)
  {
    intent: 'lagging_programs_by_value',
    routeType: 'scripted',
    terms: [
      'lagging programs',
      'lagging program',
      'programs lagging',
      'underperforming program',
      'underperforming programs',
      'behind on value',
      'behind on realized value',
      'lagging by realized value',
      'lagging by value',
      'ranked by realized value',
      'ranked by value attainment',
      'show me lagging',
    ],
  },
  {
    intent: 'at_risk_gates',
    routeType: 'scripted',
    terms: [
      'at risk of missing',
      'at-risk gate',
      'at risk gate',
      'risk of missing the next gate',
      'risk of missing gate',
      'missing the next gate',
      'next gate at risk',
      'gate at risk',
      'bets at risk',
      'programs at risk',
    ],
  },
  {
    intent: 'portfolio_confidence',
    routeType: 'scripted',
    terms: [
      'portfolio confidence',
      'confidence right now',
      'confidence on the portfolio',
      'how confident',
      'confidence level',
      'overall confidence',
    ],
  },
  {
    intent: 'value_attainment_vs_commitment',
    routeType: 'scripted',
    terms: [
      'value attainment vs commitment',
      'value attainment versus commitment',
      'attainment vs commitment',
      'attainment versus commitment',
      'value vs commitment',
      'attainment to commitment',
      'where is value attainment',
    ],
  },
  {
    intent: 'roi',
    routeType: 'scripted',
    terms: ['roi', 'value attainment', 'realized value', 'worth it'],
  },

  // ---- Federated Tower governance
  {
    intent: 'federated_visibility_boundary',
    routeType: 'scripted',
    terms: [
      'l0 sponsor',
      'sibling holdcos',
      'sibling holdco',
      'explicit grant',
      'visibility grant',
      'what can i see across',
      'what can we see across',
      'federated visibility',
    ],
    requireAll: ['tower'],
  },

  // ---- Peer / industry (Q7-Q10)
  {
    intent: 'industry_leaders',
    routeType: 'scripted',
    terms: [
      'industry leaders',
      'what are industry leaders doing',
      'leaders are doing',
      'leaders in this industry',
      'industry leader playbook',
      'leaders on ai governance',
      'best in class',
      'best-in-class',
    ],
  },
  {
    intent: 'cohort_lagging',
    routeType: 'scripted',
    terms: [
      'lagging in our cohort',
      'lagging in cohort',
      'where are we lagging',
      'cohort lagging',
      'behind our cohort',
      'behind the cohort',
      'where do we trail',
      'where are we trailing',
    ],
  },
  {
    intent: 'peer_adoption_compare',
    routeType: 'scripted',
    terms: [
      'how do we compare to retail peers',
      'compare to peers on adoption',
      'compare to peers on',
      'peer adoption',
      'peer median',
      'peer group',
      'cohort',
      'benchmark',
      'how do we compare',
      'percentile',
    ],
  },
  // Peer/industry "what are others doing" — keep on LLM since this needs
  // industry corpus context, but route is deliberate not default.
  {
    intent: 'llm',
    routeType: 'llm',
    terms: [
      'what are others doing',
      'what are peers doing',
      'what are other companies doing',
      'industry insight',
      'industry context',
      'knowledge corpus',
      'corpus',
      'market practice',
      'best practice',
      'what can tower answer',
      'what can you answer',
      'what is in scope',
      'tower scope',
    ],
  },

  // ---- Spend / cost (Q11-Q14)
  {
    intent: 'ai_spend_vs_budget',
    routeType: 'scripted',
    terms: [
      'spend run-rate',
      'spend runrate',
      'spend run rate',
      'spend vs budget',
      'spend versus budget',
      'ai spend vs',
      'ai spend versus',
      'run-rate vs budget',
      'budget burn',
      'budget vs spend',
    ],
  },
  {
    intent: 'vendor_concentration_risk',
    routeType: 'scripted',
    terms: [
      'vendor concentration',
      'concentrated vendor',
      'vendor risk',
      'vendor lock-in',
      'vendor lock in',
      'single vendor',
      'sole vendor',
    ],
  },
  {
    intent: 'cost_overruns',
    routeType: 'scripted',
    terms: [
      'cost overrun',
      'cost overruns',
      'over budget',
      'over-budget',
      'overrun by program',
      'overruns by program',
      'burn rate',
      'overspending',
    ],
  },
  {
    intent: 'idle_seats',
    routeType: 'scripted',
    terms: ['idle seats', 'copilot seats', 'licensed vs active', 'seat utilization'],
  },
  {
    intent: 'copilot_usage_value',
    routeType: 'scripted',
    terms: [
      'copilot usage',
      'copilot value',
      'copilot adoption',
      'copilot utilization',
      'copilot usage and value',
      'copilot adoption and value',
      'talk to me about copilot',
      'talk to me about copiplot',
      'copiplot usage',
      'copiplot value',
      'copiplot',
    ],
  },

  // ---- Risk / governance (Q15-Q18)
  {
    intent: 'shadow_ai_exposure',
    routeType: 'scripted',
    terms: ['shadow ai', 'jasper', 'grammarly', 'unmanaged tools', 'shadow ai exposure'],
  },
  {
    intent: 'governance_coverage_gaps',
    routeType: 'scripted',
    terms: [
      'governance coverage',
      'governance gap',
      'governance gaps',
      'policy gap',
      'policy gaps',
      'control coverage',
      'attestation gap',
      'attestations gap',
      'stale attestation',
      'stale attestations',
      'outstanding dissent',
    ],
  },
  {
    intent: 'regulatory_open_items',
    routeType: 'scripted',
    terms: [
      'regulatory item',
      'regulatory items',
      'open regulatory',
      'regulatory open',
      'compliance item',
      'compliance items',
      'audit finding',
      'audit findings',
      'open audit',
    ],
  },

  // ---- Broad portfolio status (Q1, Q2) — placed late so more-specific
  // diagnostic intents above win first.
  {
    intent: 'morning_summary',
    routeType: 'scripted',
    terms: [
      'good morning',
      'morning summary',
      'welcome back',
      'portfolio look like',
      'portfolio status',
      'current state',
      'state of play',
      'where are we',
      'where do we stand',
      'how are we doing',
      'what is going on',
      'what do you see',
      'give me perspective',
      'your perspective',
      'executive read',
    ],
  },
  {
    intent: 'portfolio_status',
    routeType: 'scripted',
    terms: ['biggest issue', 'largest issue', 'active signals', 'what changed', 'signals'],
  },
];

export function classifyAtlasIntent(message: string): AtlasClassification {
  const text = message.trim().toLowerCase();

  if (!text) {
    return { intent: 'morning_summary', routeType: 'scripted' };
  }

  for (const rule of INTENT_RULES) {
    if (!hasAny(text, rule.terms)) continue;
    if (rule.requireAll && !rule.requireAll.every((term) => text.includes(term))) {
      continue;
    }
    return { intent: rule.intent, routeType: rule.routeType };
  }

  // Genuine free-form / multi-faceted questions — deliberate fallback, not the
  // default for missing coverage. Adding a new canonical question type means
  // adding a rule above, NOT letting it land here.
  return { intent: 'llm', routeType: 'llm' };
}

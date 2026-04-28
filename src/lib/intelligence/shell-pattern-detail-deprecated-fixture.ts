// Shell-native Intelligence pattern detail fixture — deprecated pattern.
// Backs the T2-C03 Rules-Based Recommendation Engine reading view.

export const T2_C03_PATTERN = {
  id: 'T2-C03',
  name: 'Rules-Based Recommendation Engine',
  tier: 'T2' as const,
  status: 'deprecated' as const,
  lastReviewed: 'Jan 2026',
  usedInPrograms: 0,

  sentinelVerdict: {
    status: 'deprecated' as const,
    confidence: 'high' as const,
    verdictDate: 'Jan 15 2026',
    evidenceSources: 5,
    note: 'Deprecated by Sentinel consensus in January 2026. Five programs have migrated away from this pattern. ML-based personalization (T3-H01, T3-H03) delivers consistently higher lift with lower maintenance burden. This pattern should not be applied to new programs.',
  },

  sections: [
    {
      heading: 'Why deprecated',
      body: "Rules-based recommendation engines require manual curation of decision trees that become brittle as product catalogs scale. Evidence across five retail programs shows that ML-based alternatives achieve 40-60% higher click-through rates with one-quarter of the ongoing maintenance effort. The primary remaining use case — cold-start recommendations for new users with no history — is now covered by the T3-H01 Ambient AI pattern's passive signal collection.",
    },
    {
      heading: 'Superseded by',
      body: 'T3-H01 Ambient AI in Retail covers the real-time personalization use case. T3-H03 Unified Loyalty Intelligence covers the loyalty-linked recommendation use case. For programs that have not yet migrated, Sentinel will surface this deprecation as a program risk signal.',
    },
    {
      heading: 'Migration guidance',
      body: 'Programs currently using rules-based recommendation should plan migration in two phases: (1) shadow mode — run the ML model in parallel to generate baseline comparisons; (2) graduated cutover — shift 10%, 25%, 50%, 100% of traffic over 4 weeks with A/B outcome monitoring. Nexus can generate a migration brief for your specific program on request.',
    },
    {
      heading: 'Historical context',
      body: 'This pattern was validated in 2023 when ML infrastructure was cost-prohibitive for most mid-market retailers. The cost of inference has since dropped by more than 80%, eliminating the primary advantage rules-based systems held. The pattern is retained in the archive for historical reference.',
    },
  ],

  usedByPrograms: [] as Array<{ id: string; name: string; phase: string }>,

  agentQuote: 'T2-C03 was deprecated by Sentinel consensus in January 2026. Five programs have migrated to ML-based alternatives. If your program still references this pattern, Sentinel will surface it as a risk signal — the migration path via T3-H01 is well-tested.',
  agentContext: 'Sentinel · T2-C03 · deprecated Jan 15 2026',
  actions: [
    { letter: 'A' as const, text: 'Generate migration brief', detail: 'Tailor a T3-H01 migration plan for a specific program' },
    { letter: 'B' as const, text: 'View T3-H01 pattern', detail: 'Recommended ML-based replacement' },
    { letter: 'C' as const, text: 'Check program exposure', detail: 'Find any active programs still citing T2-C03' },
  ],
};

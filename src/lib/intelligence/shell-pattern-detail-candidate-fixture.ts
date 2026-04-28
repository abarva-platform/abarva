// Shell-native Intelligence pattern detail fixture
// Backs the T1-F02 AI Governance Baseline pattern detail reading view (candidate).

export const T1_F02_PATTERN = {
  id: 'T1-F02',
  name: 'AI Governance Baseline',
  tier: 'T1' as const,
  status: 'candidate' as const,
  lastReviewed: '—',
  usedInPrograms: 0,

  // Sentinel verdict
  sentinelVerdict: {
    status: 'candidate' as const,
    confidence: 'low' as const,
    verdictDate: 'Apr 27 2026',
    evidenceSources: 0,
    note: 'This pattern is a candidate for inclusion in the library. It has been nominated by the Steward team based on cross-program governance gaps. No evidence has been collected yet. Sentinel will open a review cycle once an owner is assigned.',
  },

  // Reading sections
  sections: [
    {
      heading: 'What it does',
      body: 'AI Governance Baseline defines the minimum viable governance stack for production AI deployments at enterprise retail clients. It specifies required artefacts — model cards, bias audit reports, human-in-the-loop decision thresholds, and a model incident log — and the review cadence for each. It is a foundational (T1) pattern: other patterns that deploy AI components cite it as a prerequisite.',
    },
    {
      heading: 'When to use',
      body: 'Apply this pattern to every program that deploys a model into a production decision flow where the output affects a customer, employee, or financial outcome. The pattern is currently a candidate — it has not yet been validated with evidence from live programs. Use the T3 patterns (T3-H01, T3-H02) for program-specific guidance until this pattern is validated.',
    },
    {
      heading: 'Authoring guidance',
      body: 'To promote this pattern to Validated status, the following evidence is required: at least two programs that have completed a model card review cycle, one bias audit report reviewed by a qualified assessor, and a documented human-in-the-loop threshold for at least one production decision. Contact Sentinel to open a formal evidence collection cycle.',
    },
    {
      heading: 'Anti-patterns',
      body: 'Do not treat governance as a one-time gate artefact. Model cards must be live documents updated at each retraining cycle. Do not conflate bias audit with fairness — bias audit is a quantitative measure; fairness is a policy decision made by the client. This pattern does not dictate fairness thresholds — it requires that they be set and documented.',
    },
  ],

  // No programs yet — candidate status
  usedByPrograms: [],

  // Sentinel agent voice for detail
  agentQuote: 'T1-F02 is a candidate pattern — nominated by the Steward team but not yet validated. It has zero evidence sources. The first step is assigning an owner and opening a formal evidence collection cycle. No programs can formally cite this pattern until it reaches Validated status.',
  agentContext: 'Sentinel · T1-F02 · candidate Apr 27 2026',
  actions: [
    { letter: 'A' as const, text: 'Assign pattern owner', detail: 'Assign a named owner to open the evidence collection cycle' },
    { letter: 'B' as const, text: 'Open evidence cycle', detail: 'Request Sentinel open a formal review cycle for T1-F02' },
    { letter: 'C' as const, text: 'Link to a program', detail: 'Tag a program as a candidate evidence source before promotion' },
  ],
};

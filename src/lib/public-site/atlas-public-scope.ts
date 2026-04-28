// Atlas public scope — sample insights shown on the public /atlas/ page.
// The real Atlas agent is private-beta only. These are representative examples
// that demonstrate the type of synthesis Atlas produces.

export interface AtlasSampleInsight {
  id: string;
  question: string;
  answer: string;
  patterns: string[];
  confidence: number;
}

export const ATLAS_SAMPLE_INSIGHTS: AtlasSampleInsight[] = [
  {
    id: 'insight-001',
    question: 'Which patterns matter most when standing up a new AI program?',
    answer:
      'Programs that establish a structured knowledge infrastructure and program management discipline in the first 90 days are 3× more likely to reach sustained value delivery. The evidence across our corpus points to three foundational patterns: knowledge capture cadence, stakeholder alignment rituals, and outcome measurement baselines. Without all three, even technically strong programs accumulate invisible debt that compounds across phases.',
    patterns: ['knowledge-capture-cadence', 'stakeholder-alignment', 'outcome-measurement'],
    confidence: 0.87,
  },
  {
    id: 'insight-002',
    question: 'Why do AI programs with high technical scores still fail?',
    answer:
      "Technical execution rarely explains failure. Programs scoring in the top quartile on model performance and infrastructure readiness fail at the same rate as the median when organizational adoption patterns are absent. The dominant failure modes are misaligned sponsorship, absence of feedback loops between AI outputs and business decisions, and treating AI deployment as a project with an end date rather than an ongoing program capability.",
    patterns: ['sponsorship-alignment', 'feedback-loop-design', 'program-vs-project'],
    confidence: 0.91,
  },
  {
    id: 'insight-003',
    question: 'How do we know when our AI program has drifted?',
    answer:
      "Drift manifests as a widening gap between the program's original intent and its current operational behavior — detectable through signal monitoring before it becomes visible in outcomes. Early indicators include declining stakeholder engagement scores, pattern regression on knowledge checks, and increasing time-to-decision ratios. AbarVa's 30 signals are specifically designed to surface drift 4–8 weeks before it becomes a remediation problem.",
    patterns: ['signal-monitoring', 'pattern-regression', 'drift-detection'],
    confidence: 0.84,
  },
];

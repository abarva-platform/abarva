export const arcturusLeadership = {
  source: 'client+public' as const,
  uploadedAt: '2026-03-28',
  confidence: 0.91,

  executives: [
    {
      role: 'CEO',
      name: 'Victoria Hargreaves',
      tenure: 3,             // years
      background: 'BlackRock COO, 12 years',
      priorities: [
        'Close the CIR gap from 71% to 58% within 24 months',
        'Grow AUM through performance, not just flows',
        'Become the reference case for AI-native asset management',
      ],
      concerns: [
        'CDO vacancy stalling every technology initiative',
        '$94M AI spend with no documented outcomes',
        'MAS FEAT overdue — regulatory relationship at risk',
      ],
      quote: '"We have the capital. We have the mandate. What we don\'t have is a data foundation that lets AI actually work."',
      reportingTo: null,
      linkedIn: 'public',
    },
    {
      role: 'CIO',
      name: 'Raj Malhotra',
      tenure: 0.67,          // 8 months
      background: 'JPMorgan Global Technology, Head of Markets AI',
      priorities: [
        'Establish AI governance before adding any new initiatives',
        'Build golden record as foundation for all downstream AI',
        'Migrate Bloomberg AIM or add modern API layer',
      ],
      concerns: [
        'Inherited 28 ungoverned AI initiatives with zero baselines',
        'No CDO to partner with on data governance',
        'Board expects visible wins within first year',
      ],
      quote: '"I inherited a portfolio of experiments, not a programme. Governance first, then acceleration."',
      reportingTo: 'CEO',
      linkedIn: 'public',
    },
    {
      role: 'CFO',
      name: 'Thomas Kellner',
      tenure: 6,
      background: 'Deutsche Bank, Head of Finance EMEA; PwC Financial Services',
      priorities: [
        'Document ROI for every dollar of AI investment',
        'Reduce cost-to-income ratio to peer median (61%) in 18 months',
        'IT budget from 4.2% to 3.1% of revenue over 3 years',
      ],
      concerns: [
        '$94M AI spend, zero documented ROI — "I cannot defend this at the next board meeting"',
        'IT budget 35% above peer benchmark',
        'Salesforce FSC: $38M invested, 44% adoption, NPS 31',
      ],
      quote: '"AI is not a strategy. AI with baselines and outcome tracking is a strategy. We don\'t have the second thing."',
      reportingTo: 'CEO',
      linkedIn: 'public',
    },
    {
      role: 'CDO',
      name: null,
      status: 'VACANT',
      vacantMonths: 11,
      searchFirmsEngaged: 3,
      impact: 'Every AI and data initiative is blocked or degraded by this vacancy. 14 of 28 AI initiatives cite CDO vacancy as primary stall reason.',
      previousHolder: 'Departed January 2025 — moved to competitor',
      note: 'Critical blocker. AbarVa Genome shows 79% failure rate for AI programmes at this stage without CDO.',
    },
    {
      role: 'CRO',
      name: 'Sarah Chen',
      tenure: 4,
      background: 'Federal Reserve Board (Model Risk); Goldman Sachs Risk',
      priorities: [
        'MAS FEAT compliance — overdue 4 months, escalating',
        'SEC MRA remediation on model risk governance',
        'Build AI model risk framework before next regulatory exam',
      ],
      concerns: [
        'MAS FEAT explainability requirement: zero AI models documented',
        'SEC MRA open since September 2024 — model risk governance inadequate',
        'Cannot sign off on new AI deployments until governance framework exists',
      ],
      quote: '"I\'ve stopped approving new AI deployments. The regulatory exposure from ungoverned models is not acceptable."',
      reportingTo: 'CEO',
      linkedIn: 'public',
    },
    {
      role: 'Head of Technology',
      name: 'Michael Santos',
      tenure: 2,
      background: 'AWS Enterprise, Head of Financial Services APAC',
      priorities: [
        'Modernize Bloomberg AIM — phased API layer approach',
        'Reduce 14 data silos to unified data platform',
        'Close 3-day reporting lag',
      ],
      concerns: [
        'Bloomberg AIM: 3 failed modernizations before him',
        '14 data systems with no golden record — AI deployment is theoretically blocked',
        'Daily stress testing regulatory requirement vs monthly Aladdin cadence',
      ],
      quote: '"The data architecture is not just a technology problem. It\'s the reason every other initiative is slower than it should be."',
      reportingTo: 'CIO',
      linkedIn: 'public',
    },
  ],

  boardDynamics: {
    aiChampion: 'Victoria Hargreaves (CEO)',
    aiSkeptic: 'Thomas Kellner (CFO)',
    blockerRole: 'CDO (vacant)',
    regulatoryUrgency: 'Sarah Chen (CRO) — MAS FEAT overdue, SEC MRA open',
  },
}

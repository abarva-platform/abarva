export const arcturusIndustry = {
  source: 'industry+public' as const,
  confidence: 0.89,

  sources: [
    'Oliver Wyman — Global Asset Management Report 2025',
    'McKinsey — AI in Asset Management: From Pilots to Scale (2025)',
    'Gartner — Wealth Management Platform Magic Quadrant 2025',
    'ICI — Investment Company Fact Book 2025',
    'SEC EDGAR — Form ADV filings (public)',
    'Bloomberg Intelligence — AM Fee Compression Tracker',
  ],

  peerBenchmarks: {
    costToIncomeRatio: {
      label: 'Cost-to-Income Ratio',
      arcturus: 71,
      peerMedian: 61,
      topQuartile: 52,
      unit: '%',
      direction: 'lower-is-better',
      gap: 10, // pp vs peer median
      note: '$840M efficiency gap vs peer median at current revenue base',
    },
    aumPerEmployee: {
      label: 'AUM per Employee',
      arcturus: 500,
      peerMedian: 620,
      topQuartile: 820,
      unit: '$M',
      direction: 'higher-is-better',
      gap: -120,
      note: '13,000 employees vs ~10,500 at comparable AUM (peer median)',
    },
    aiMaturityScore: {
      label: 'AI Maturity Score',
      arcturus: 28,
      peerMedian: 54,
      topQuartile: 78,
      unit: 'out of 100',
      direction: 'higher-is-better',
      gap: -26,
      source: 'Gartner WM Platform Survey 2025',
    },
    clientPortalAdoption: {
      label: 'Client Portal Adoption',
      arcturus: 44,
      industryMedian: 78,
      topQuartile: 91,
      unit: '%',
      direction: 'higher-is-better',
      gap: -34,
      note: '$38M invested in Salesforce FSC. 44% adoption at 18 months is bottom quartile.',
    },
    managementFeeMargin: {
      label: 'Management Fee Margin',
      arcturus: 76.5,
      peerMedian: 71.2,
      unit: '% of revenue',
      direction: 'neutral',
    },
    digitalAdvicePenetration: {
      label: 'Digital Advice Penetration',
      arcturus: 12,
      peerMedian: 34,
      unit: '% of client base',
      direction: 'higher-is-better',
      gap: -22,
    },
  },

  feeCompressionContext: {
    averageManagementFeeDecline5yr: -18, // bps
    passiveToActiveRatioTrend: 'accelerating',
    performanceFeeViability: 'Only top-quartile performers sustaining performance fees',
    arcturusPerformanceRanking: '62nd percentile (not sustainably earning performance fees)',
  },

  publicDataHighlights: [
    {
      source: 'SEC Form ADV (public filing, March 2026)',
      finding: '$840B AUM disclosed. 28 AI/ML models in use for investment decisions. Zero with documented validation per Form ADV Item 17.',
      severity: 'critical',
    },
    {
      source: 'Annual Report 2024 (public)',
      finding: 'CIR 71% disclosed — management acknowledges "elevated cost base relative to peers" and targets 58% by 2027. No credible cost reduction programme articulated.',
      severity: 'high',
    },
    {
      source: 'MAS Financial Institutions Directory (public)',
      finding: 'Arcturus Singapore subsidiary. MAS FEAT compliance window expired December 2025. No public update filed.',
      severity: 'critical',
    },
    {
      source: 'FCA Register (public)',
      finding: 'UK wealth management subsidiary registered. Consumer Duty implementation update pending — 40% progress disclosed in FCA supervisory meeting notes (leaked via FOI).',
      severity: 'high',
    },
    {
      source: 'Bloomberg News, Feb 2026',
      finding: '"Arcturus Financial Group\'s CDO position has been vacant for nearly a year, sources say. Three search firms have been engaged. The vacancy is increasingly cited by regulators and the CRO as a governance gap."',
      severity: 'high',
    },
    {
      source: 'Glassdoor / LinkedIn (public sentiment)',
      finding: '3.2/5 employer rating. Recent reviews cite "AI initiatives start but never finish", "no data governance", "good people leaving for better-run firms".',
      severity: 'medium',
    },
  ],

  genomePatterns: [
    {
      pattern: 'CDO Vacancy During AI Scale-Up',
      occurrences: 14,
      failureRate: 79,
      failureRatePct: '79%',
      presentAtArcturus: true,
      presentSince: '11 months',
      mitigation: 'Appoint interim CDO from existing CIO/CRO office within 30 days. Full CDO hire within 90. All AI programmes pause governance sign-off until interim in place.',
      arcturusSpecific: '14 of 28 AI initiatives cite CDO vacancy as stall reason. MAS FEAT and SEC MRA both reference governance gap created by vacancy.',
    },
    {
      pattern: 'AI Deployment Without Golden Record',
      occurrences: 22,
      failureRate: 86,
      failureRatePct: '86%',
      presentAtArcturus: true,
      presentSince: 'ongoing — architecture never had golden record',
      mitigation: 'Build unified client data entity (golden record) before deploying any AI that requires client signals. 14-system silo architecture makes this 6-9 month build.',
      arcturusSpecific: 'Portfolio construction AI, client churn model, advisor productivity — all require cross-system client entity that doesn\'t exist.',
    },
    {
      pattern: 'Portal Adoption <50% at 18 Months',
      occurrences: 11,
      failureRate: 64,
      failureRatePct: '64%',
      presentAtArcturus: true,
      presentSince: 'Salesforce FSC live August 2024 (8 months). Already at 44%.',
      mitigation: 'Executive-sponsored adoption sprint: advisor compensation tied to portal migration, white-glove client onboarding team deployed, SSO and data lag issues resolved first.',
      arcturusSpecific: 'At current trajectory, FSC adoption will not reach 85% by 24-month mark. $38M investment at risk of write-down.',
    },
    {
      pattern: 'Regulatory Overdue With No Remediation Plan',
      occurrences: 9,
      failureRate: 89,
      failureRatePct: '89%',
      presentAtArcturus: true,
      presentSince: 'MAS FEAT overdue 4 months. SEC MRA open 6+ months.',
      mitigation: 'Assign dedicated regulatory programme director. Separate remediation team from innovation team. Regulatory commitments take precedence over AI investment spend.',
      arcturusSpecific: 'CRO has stopped approving new AI deployments. Until MAS FEAT and SEC MRA are closed, the AI portfolio cannot grow.',
    },
  ],
}

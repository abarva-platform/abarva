export const arcturusRegulatory = {
  source: 'client+public+genome' as const,
  uploadedAt: '2026-03-31',
  confidence: 0.94,

  regulators: ['SEC', 'FINRA', 'FCA', 'BaFin', 'FINMA', 'MAS', 'DFSA'],

  openMatters: [
    {
      regulator: 'SEC',
      type: 'MRA',
      category: 'Model Risk Governance',
      openedDate: '2024-09',
      status: 'open',
      severity: 'high',
      description: 'Model risk management framework inadequate for AI/ML models in production. 14 models in production with no validation documentation. Examination team flagged absence of CDO as aggravating factor.',
      remediation: 'Model inventory + validation framework required by 2026-Q2',
      estimatedCost: 5, // $M
      daysOpen: 198,
    },
    {
      regulator: 'MAS',
      type: 'FEAT Compliance',
      category: 'Fairness, Ethics, Accountability, Transparency in AI',
      openedDate: '2024-11',
      dueDate: '2025-12',
      overdueMonths: 4,
      status: 'overdue-critical',
      severity: 'critical',
      description: 'MAS FEAT requires explainability documentation for all client-facing AI models. Arcturus has zero models with FEAT-compliant documentation. Singapore AUM at risk if not remediated — MAS has indicated supervisory action under consideration.',
      remediation: 'Full FEAT audit + explainability layer required immediately',
      estimatedCost: 6, // $M
      aumAtRisk: 2.4, // $B Singapore AUM
    },
  ],

  upcomingRequirements: [
    {
      title: 'SEC AI Governance Rule',
      regulator: 'SEC',
      deadline: '2026-Q2',
      status: 'not-started',
      risk: 'high',
      estimatedCost: 8, // $M
      description: 'Proposed rule requires documented AI governance framework, model inventory, and conflict-of-interest disclosures for all AI-driven investment recommendations.',
      arcturusGap: 'No AI governance framework. 28 initiatives, 0 with documentation meeting proposed rule standard.',
    },
    {
      title: 'FCA Consumer Duty — AI in Advice',
      regulator: 'FCA',
      deadline: '2026-Q1',
      status: 'in-progress',
      progressPct: 40,
      risk: 'high',
      estimatedCost: 4,
      description: 'FCA requires firms to demonstrate AI-driven advice outcomes are fair. Arcturus UK wealth management uses 2 AI recommendation models with no outcome tracking.',
      arcturusGap: 'Outcome tracking not in place. 40% complete on framework — stalled pending CDO.',
    },
    {
      title: 'EU AI Act — High Risk Classification',
      regulator: 'EU',
      deadline: '2026-08',
      status: 'gap-assessment-needed',
      risk: 'medium',
      estimatedCost: 6,
      description: 'Arcturus EU operations subject to EU AI Act. Investment recommendation systems likely classified as high-risk. Technical documentation and conformity assessment required.',
      arcturusGap: 'No gap assessment completed. 6 EU-deployed models may require reclassification.',
    },
    {
      title: 'SEC Daily Stress Testing Requirement',
      regulator: 'SEC',
      deadline: '2026-06',
      status: 'system-gap',
      risk: 'high',
      estimatedCost: 12,
      description: 'Rule 18f-4 derivatives risk management requires daily stress testing for fund complexes above Arcturus\'s AUM threshold. Aladdin currently configured for monthly cadence.',
      arcturusGap: 'Aladdin runs monthly. Daily cadence requires configuration + data pipeline changes. 6-month build estimated.',
    },
    {
      title: 'FINMA Outsourcing Circular Update',
      regulator: 'FINMA',
      deadline: '2026-Q3',
      status: 'monitoring',
      risk: 'low',
      estimatedCost: 1,
      description: 'Updated guidance on cloud and AI vendor outsourcing risk management for Swiss-regulated entities.',
      arcturusGap: 'Current vendor risk inventory incomplete. Monitoring only at this stage.',
    },
  ],

  aiGovernance: {
    frameworkExists: false,
    initiativesWithDocumentation: 8,
    totalInitiatives: 28,
    documentationPct: 29,
    modelInventoryExists: false,
    validationFrameworkExists: false,
    conflictOfInterestDisclosures: false,
    cdoVacancyImpact: 'AI governance framework stalled — 3rd CDO search firm engaged April 2026',
  },

  complianceCostEstimate: {
    immediate: 11,   // $M (MAS FEAT + SEC MRA)
    next12Months: 30, // $M all requirements
    if_unaddressed: '85-220', // $M range in fines + AUM at risk
  },
}

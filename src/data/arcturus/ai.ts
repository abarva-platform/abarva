export const arcturusAI = {
  maturity: {
    dataReadiness: {
      overall: 32,
      portfolioPositions: 42,    // Bloomberg AIM has positions but siloed
      clientRelationship: 35,    // FSC at 44% adoption — 56% of signals missing
      riskAnalytics: 28,         // Aladdin disconnected, monthly vs daily cadence
      regulatory: 38,            // Charles River exists but compliance gaps
      financeReporting: 45,      // Advent Geneva functional but not AI-connected
    },
    techReadiness: {
      overall: 28,
      mlPlatform: 18,            // No ML platform — no Azure ML, no Databricks
      dataPlatform: 22,          // 14 silos, no unified platform, no golden record
      integration: 24,           // Bloomberg AIM API severely limited
      mlops: 8,                  // No MLOps — models cannot be deployed at scale
      governance: 14,            // CRO has frozen new AI deployments
    },
    orgReadiness: {
      overall: 35,
      talent: 38,                // quant talent exists in investment teams, no CDO
      literacy: 42,              // investment teams have quant backgrounds
      changeCapacity: 24,        // CDO vacant 11 months — no change champion
      leadership: 36,            // CEO champion, CFO skeptic, CRO is blocker
    },
    currentInitiatives: [
      { name: 'Intelligent Portfolio Construction', status: 'Stalled', scope: 'Not started — data dependency unresolved', monthsStuck: 8, investment: 18400000, outcome: 'Blocked by 14 data silos — no golden record available' },
      { name: 'Client Churn Prediction Model', status: 'Live — Underperforming', scope: 'Partial CRM data only (44% portal adoption)', monthsStuck: 6, investment: 12200000, outcome: '44% portal adoption means 56% of client signals are missing — model accuracy severely degraded' },
      { name: 'Automated ESG Scoring', status: 'Stalled', scope: 'No CDO to govern data sourcing standards', monthsStuck: 9, investment: 8600000, outcome: 'Compliance blocked sign-off. No AI governance framework exists.' },
      { name: 'AI-Powered Client Reporting', status: 'In Planning', scope: 'Not started — 3-day data lag blocks real-time', monthsStuck: 4, investment: 11000000, outcome: 'TBD — requires real-time data architecture as prerequisite' },
      { name: 'Regulatory Change Monitor', status: 'Stalled', scope: 'MAS FEAT overdue — legal freeze on AI deployments', monthsStuck: 7, investment: 7800000, outcome: 'Legal blocked further AI deployments pending governance framework' },
      { name: 'Advisor Productivity Assistant', status: 'In Planning', scope: 'Not started — Salesforce FSC adoption too low at 44%', monthsStuck: 6, investment: 14000000, outcome: 'TBD — requires 85%+ FSC adoption before ROI is achievable' },
    ],
    pattern: 'PILOT_PURGATORY',
    pilotsPurgatory: 4,
    patternDescription: '28 AI initiatives. 3 live (all underperforming). 14 stalled. 2 cancelled. Root cause: CDO vacant 11 months, no golden record, no AI governance, CRO has frozen new deployments. $94M invested. $0 documented ROI.',
  },

  interviews: {
    cio: {
      name: 'Raj Malhotra', tenure: '8 months',
      aiPriority: 'Governance and golden record before any new AI initiatives',
      biggestBlocker: 'CDO vacant 11 months — no data strategy owner, no model registry, no governance',
      investmentAppetite: '$40–60M over 24 months contingent on governance framework being established first',
      successMetric: 'Golden record live, AI governance framework established, 3 AI models with documented ROI by Q2 2027',
      changeReadiness: 'Medium',
      aiQuote: 'I inherited a portfolio of experiments, not a programme. Governance first, then acceleration.',
    },
    cfo: {
      name: 'Thomas Kellner', tenure: '6 years',
      aiPriority: 'Document ROI for every dollar of AI investment before any new approvals',
      biggestBlocker: 'Zero documented outcomes on $94M invested — board exposure at next meeting is critical',
      investmentAppetite: 'Outcome-based only — baseline required before any new AI spending is approved',
      successMetric: 'CIR below 65% in 18 months, $94M AI portfolio with documented baselines',
      changeReadiness: 'Low',
      aiQuote: 'AI is not a strategy. AI with baselines and outcome tracking is a strategy. We don\'t have the second thing.',
    },
    ceo: {
      name: 'Victoria Hargreaves', tenure: '3 years',
      aiPriority: 'Become the reference case for AI-native asset management',
      biggestBlocker: 'CDO vacancy stalling every technology initiative — 11 months is too long',
      investmentAppetite: 'Whatever it takes — AI is the strategic differentiator for the next decade',
      successMetric: 'CIR at 58%, documented alpha from AI portfolio construction by 2028',
      changeReadiness: 'High',
      aiQuote: 'We have the capital. We have the mandate. What we don\'t have is a data foundation that lets AI actually work.',
    },
    cro: {
      name: 'Sarah Chen', tenure: '4 years',
      aiPriority: 'MAS FEAT compliance and AI model risk governance framework',
      biggestBlocker: 'Cannot sign off on new AI deployments until governance framework and model registry are in place',
      investmentAppetite: 'Regulatory compliance investment is non-negotiable and must come first',
      successMetric: 'MAS FEAT closed, SEC MRA remediated, AI governance framework live, all deployed models documented',
      changeReadiness: 'Low',
      aiQuote: 'I\'ve stopped approving new AI deployments. The regulatory exposure from ungoverned models is not acceptable.',
    },
  },

  changeReadiness: {
    overall: 31,
    components: { leadership: 42, workforce: 38, technology: 24, culture: 36, capacity: 22 },
    riskFactors: [
      'CDO vacant 11 months — no AI change champion or data strategy owner',
      'CRO has frozen new AI deployments — compliance blocker active',
      '14 of 28 AI initiatives stalled — organisational change fatigue from failures',
      'Bloomberg AIM 3 failed modernisations — IT credibility deficit',
      '3-day reporting lag undermines executive trust in AI-generated outputs',
    ],
    recommendation: 'Sequence regulatory compliance first — resolves CRO blocker, closes MAS FEAT, remediates SEC MRA. Then CDO hire and golden record as data foundation. AI initiatives can only scale after governance framework is live and CRO re-opens the door.',
  },

  opportunities: {
    frontOffice: [
      {
        id: 'fo-001', name: 'Client Churn Prediction (Remediated)',
        annualValue: 84000000, investment: 3200000, roi: 26.3, timeline: '9 months',
        dataReadiness: 'yellow', dataReadinessPct: 58,
        aiApproach: 'ML on unified CRM + portfolio data to predict 90-day AUM withdrawal risk per client',
        complexity: 'medium', wave: 1, vendor: ['Internal rebuild on Azure ML', 'Salesforce Einstein'],
        problem: 'Churn model exists but trained on incomplete data — 44% portal adoption means 56% of client signals are missing. Remediate data gaps first, retrain model, then deploy with MLOps governance.',
      },
      {
        id: 'fo-002', name: 'Personalised Client Reporting AI',
        annualValue: 22000000, investment: 4800000, roi: 4.6, timeline: '12 months',
        dataReadiness: 'yellow', dataReadinessPct: 45,
        aiApproach: 'LLM-generated personalised performance commentary from unified portfolio data via Azure OpenAI',
        complexity: 'medium', wave: 2, vendor: ['Microsoft Copilot Studio', 'Salesforce Einstein Copilot', 'Azure OpenAI'],
        problem: '3-day reporting lag makes real-time reports impossible. 68% of HNW clients cited reporting quality in FSC survey. Requires golden record as prerequisite.',
      },
      {
        id: 'fo-003', name: 'Intelligent Portfolio Construction',
        annualValue: 120000000, investment: 18400000, roi: 6.5, timeline: '24 months',
        dataReadiness: 'red', dataReadinessPct: 28,
        aiApproach: 'Reinforcement learning on unified position + market data for systematic alpha generation and portfolio optimisation',
        complexity: 'high', wave: 3, vendor: ['Build on Azure ML', 'Kensho (S&P)', 'Refinitiv Eikon AI'],
        problem: 'Requires golden record across 14 data silos. Bloomberg AIM API too limited for real-time model input. Highest-value initiative but Waves 1 and 2 are hard prerequisites.',
      },
    ],
    middleOffice: [
      {
        id: 'mo-001', name: 'AI Governance and Model Risk Framework',
        annualValue: 35000000, investment: 4200000, roi: 8.3, timeline: '6 months',
        dataReadiness: 'yellow', dataReadinessPct: 62,
        aiApproach: 'Governance framework + model registry + MAS FEAT documentation + SEC MRA remediation programme',
        complexity: 'medium', wave: 1, vendor: ['IBM OpenPages', 'OneTrust', 'Build internal'],
        problem: 'CRO has frozen new AI deployments. MAS FEAT overdue 4 months — $2.4B Singapore AUM at risk. SEC MRA open since Sep 2024. Governance framework unlocks all other AI initiatives and removes regulatory risk.',
      },
      {
        id: 'mo-002', name: 'Regulatory Change Monitor',
        annualValue: 15000000, investment: 3800000, roi: 3.9, timeline: '9 months',
        dataReadiness: 'yellow', dataReadinessPct: 58,
        aiApproach: 'NLP on SEC, MAS, and FCA regulatory feeds to classify changes and auto-route to compliance owners',
        complexity: 'medium', wave: 2, vendor: ['Ascent RegTech', 'AxiomSL', 'Azure OpenAI NLP'],
        problem: 'Manual regulatory monitoring. 4 compliance staff spending 60% of time on change surveillance. MAS FEAT breach illustrates cost of missed regulatory changes.',
      },
      {
        id: 'mo-003', name: 'Automated ESG Scoring',
        annualValue: 45000000, investment: 6400000, roi: 7.0, timeline: '12 months',
        dataReadiness: 'yellow', dataReadinessPct: 48,
        aiApproach: 'ML on alternative data (news, supply chain, carbon data) for portfolio-level ESG scoring and real-time monitoring',
        complexity: 'high', wave: 2, vendor: ['Clarity AI', 'Sustainalytics (Morningstar)', 'MSCI ESG'],
        problem: 'No CDO to govern data sourcing standards. CRO blocked sign-off. ESG mandates from 3 institutional clients at risk. $45M AUM premium from ESG-certified portfolios is locked until governance is resolved.',
      },
      {
        id: 'mo-004', name: 'Advisor Productivity Assistant',
        annualValue: 38000000, investment: 5200000, roi: 7.3, timeline: '12 months',
        dataReadiness: 'yellow', dataReadinessPct: 52,
        aiApproach: 'LLM assistant integrated with Salesforce FSC for meeting prep, CRM synthesis, and client communication drafting',
        complexity: 'medium', wave: 2, vendor: ['Microsoft 365 Copilot', 'Salesforce Einstein Copilot'],
        problem: '44% FSC adoption means majority of advisors not on target platform. Advisor capacity 34% below target — 21 admin hours per advisor per week vs 9 hours at peer firms.',
      },
    ],
    backOffice: [
      {
        id: 'bo-001', name: 'Golden Record Data Infrastructure',
        annualValue: 35000000, investment: 12000000, roi: 2.9, timeline: '12 months',
        dataReadiness: 'yellow', dataReadinessPct: 38,
        aiApproach: 'Master data management platform to unify 14 data silos into single client/portfolio golden record',
        complexity: 'high', wave: 1, vendor: ['Informatica MDM', 'Reltio', 'IBM Master Data Management'],
        problem: '14 data silos. No golden record. 3-day reporting lag. Every AI initiative requiring real-time portfolio data is blocked. Foundation investment — without it, 18 of 28 AI initiatives cannot proceed.',
      },
      {
        id: 'bo-002', name: 'Daily Stress Testing Automation',
        annualValue: 18000000, investment: 2400000, roi: 7.5, timeline: '6 months',
        dataReadiness: 'green', dataReadinessPct: 72,
        aiApproach: 'Automate Aladdin stress testing from monthly to daily cadence using Azure batch processing pipeline',
        complexity: 'medium', wave: 1, vendor: ['BlackRock Aladdin upgrade', 'Azure Batch'],
        problem: 'SEC requires daily stress testing. Aladdin runs monthly. Direct regulatory exposure. Fix is technical — Aladdin configuration upgrade resolves it without new vendor.',
      },
      {
        id: 'bo-003', name: 'Bloomberg AIM Modern API Layer',
        annualValue: 28000000, investment: 8600000, roi: 3.3, timeline: '18 months',
        dataReadiness: 'yellow', dataReadinessPct: 42,
        aiApproach: 'Modern REST/GraphQL API layer on Bloomberg AIM to expose position data to downstream AI systems without core migration',
        complexity: 'high', wave: 2, vendor: ['Bloomberg AIM Professional Services', 'Charles River (OMS alternative)', 'Finastra'],
        problem: 'Bloomberg AIM is 28 years old with 3 failed modernisations. Core replacement carries unacceptable operational risk. API layer gives AI systems real-time access without migration disruption.',
      },
    ],
  },

  roadmap: {
    wave1: {
      name: 'Governance and Foundation',
      months: '0–6',
      totalInvestment: 21800000,
      totalAnnualValue: 172000000,
      roi: 7.9,
      initiatives: ['bo-001', 'bo-002', 'mo-001', 'fo-001'],
      prerequisite: '',
    },
    wave2: {
      name: 'Intelligence Activation',
      months: '6–12',
      totalInvestment: 25800000,
      totalAnnualValue: 120000000,
      roi: 4.7,
      initiatives: ['mo-002', 'mo-003', 'mo-004', 'fo-002', 'bo-003'],
      prerequisite: 'CDO hired, golden record live, AI governance framework established, CRO sign-off restored',
    },
    wave3: {
      name: 'Alpha Generation',
      months: '12–24',
      totalInvestment: 18400000,
      totalAnnualValue: 120000000,
      roi: 6.5,
      initiatives: ['fo-003'],
      prerequisite: 'Waves 1 and 2 complete, Bloomberg AIM API layer live, real-time data pipeline operational',
    },
    summary: {
      totalInvestment: 66000000,
      totalAnnualValue: 412000000,
      blendedROI: 6.2,
      paybackMonths: 9.6,
      mckinseyEquivalent: 4500000,
      abarvaFee: 200000,
      saving: 4300000,
    },
  },
}

export const nexoraAI = {
  maturity: {
    dataReadiness: {
      overall: 38,
      ecommerce: 58,       // SFCC has clean transaction and cart data
      inventory: 32,       // 6 ERPs unconnected — no unified inventory view
      customerLoyalty: 45, // loyalty data exists but unactivated
      operations: 28,      // SAP fragmentation blocks operational data
      supplier: 18,        // 0 of 2,400 suppliers risk-scored
    },
    techReadiness: {
      overall: 48,
      mlPlatform: 42,      // Databricks live for APAC but not connected to loyalty or Einstein
      dataPlatform: 38,    // fragmented ERPs block unified data platform
      integration: 52,     // SFCC is modern and well-integrated
      mlops: 28,           // deployed tools not connected — execution gap
      governance: 24,      // no CDO, no AI governance framework
    },
    orgReadiness: {
      overall: 42,
      talent: 44,          // technology talent exists across teams
      literacy: 38,        // retail operations teams have limited AI literacy
      changeCapacity: 42,  // reorganisation capacity moderate
      leadership: 44,      // CMO champion, CIO mixed, COO aligned on inventory
    },
    currentInitiatives: [
      { name: 'Einstein Personalization Activation', status: 'Not Started', scope: '18 months idle — zero activation work begun', monthsStuck: 18, investment: 21000000, outcome: '$14M/yr license paid. $248M revenue opportunity idle. No organisational owner named.' },
      { name: 'o9 Demand Forecasting', status: 'Stalled — 40%', scope: 'Partial NA rollout only — 18 months on this', monthsStuck: 18, investment: 6800000, outcome: '40% implemented. Decision required: complete or replace. Completion recommended at 85% vs 58% restart success rate.' },
      { name: 'Cart Recovery (Klaviyo + Segment)', status: 'Built — Not Deployed', scope: 'Triggers built, platform teams not connected', monthsStuck: 6, investment: 2400000, outcome: 'Infrastructure ready and paid for. Pure execution gap — platform teams not coordinated.' },
      { name: 'Shrinkage AI Detection', status: 'Piloting — Scale Decision Pending', scope: '12 stores piloted, 2,388 stores waiting', monthsStuck: 4, investment: 4200000, outcome: '34% shrinkage reduction in pilot stores. No executive sponsor named for scale decision.' },
      { name: 'Store Traffic AI Optimisation', status: 'Stalled', scope: 'Requires unified ERP data from all 6 regions', monthsStuck: 8, investment: 8600000, outcome: 'Blocked by 4 of 6 ERPs not AI-ready. Will remain blocked until data unification layer is complete.' },
      { name: 'Supplier Risk Intelligence', status: 'Not Started', scope: 'SAP R/3 Continental Europe blocks supplier data feed', monthsStuck: 0, investment: 3800000, outcome: '0 of 2,400 suppliers risk-scored. SAP R/3 EOL 2027 is primary data gap.' },
    ],
    pattern: 'BUILT_NOT_DEPLOYED',
    pilotsPurgatory: 3,
    patternDescription: 'Technology has been built and paid for: Einstein licensed 18 months, Klaviyo/Segment both active, churn model built in Databricks, cart triggers designed. Failure is execution, not technology. No single owner for any initiative. Governance vacuum creates paralysis.',
  },

  interviews: {
    cio: {
      name: 'David Park', tenure: '3 years',
      aiPriority: 'Activate what we already own before buying or building anything new',
      biggestBlocker: 'CIO and CMO not aligned on Einstein ownership — 18 months of paralysis on a $14M/yr licensed asset',
      investmentAppetite: '$0 incremental — we have $148M invested and $12M returned. That ratio needs to change first.',
      successMetric: 'Einstein live and $50M revenue verified within 90 days of activation',
      changeReadiness: 'Medium',
      aiQuote: 'We have bought everything we need. The problem is execution, not technology.',
    },
    cmo: {
      name: 'Sophie Laurent', tenure: '2 years',
      aiPriority: 'Einstein activation for loyalty personalisation — 28.4M members are receiving identical experiences',
      biggestBlocker: 'IT ownership dispute — CMO can approve but cannot deploy without CIO sign-off on technical activation',
      investmentAppetite: '$5–10M for activation, measurement infrastructure, and loyalty reactivation programme',
      successMetric: 'Loyalty active rate from 42% to 60%, email open rate from 14% to 24% within 12 months',
      changeReadiness: 'High',
      aiQuote: '28 million members and we\'re sending the same email to all of them. That ends the moment Einstein is live.',
    },
    cfo: {
      name: 'Marcus Webb', tenure: '4 years',
      aiPriority: 'Operating margin from 3.2% to 5.0% — that is the only metric that matters this year',
      biggestBlocker: 'E-commerce is growing and margin-negative. CFO has mandated no further ecom investment without a path to positive contribution margin.',
      investmentAppetite: 'Outcome-based — verified savings only. No more projections.',
      successMetric: 'Blended operating margin above 4.5% within 24 months. E-commerce contribution margin above 0% by end of year.',
      changeReadiness: 'Low',
      aiQuote: 'We\'re investing in AI and growing a channel that loses money. Those two things cannot both be true for long.',
    },
    coo: {
      name: 'Priya Krishnamurthy', tenure: '5 years',
      aiPriority: 'Inventory turns from 4.2x to 6.0x — $900M trapped capital is unacceptable',
      biggestBlocker: '6 ERP systems cannot produce a unified inventory view in real time. Demand forecasting runs on islands of data.',
      investmentAppetite: '$10–15M for o9 completion and supply chain data unification layer',
      successMetric: 'Inventory turns above 5.5x, lead time under 35 days, o9 fully deployed within 18 months',
      changeReadiness: 'High',
      aiQuote: 'Every turn I add to inventory is cash I can return to shareholders. The 6 ERP systems are the enemy of that goal.',
    },
  },

  changeReadiness: {
    overall: 44,
    components: { leadership: 48, workforce: 42, technology: 52, culture: 40, capacity: 38 },
    riskFactors: [
      'CIO/CMO ownership dispute on Einstein — 18 months of stalled execution on highest-ROI asset',
      '6 AI initiatives stalled or built-not-deployed — change fatigue from execution failures',
      'SAP R/3 EOL creates forced organisational urgency in 2027 — timeline pressure rising',
      'No CDO — AI strategy ownership is diffuse across CIO, CMO, and COO',
      'E-commerce growing margin-negative — CFO pressure can derail AI investment at any time',
    ],
    recommendation: 'Resolve Einstein ownership dispute this week — appoint single executive owner. Then cart recovery activation (8 weeks). These two moves validate $316M in idle technology at $2M cost before any new investment is approved.',
  },

  opportunities: {
    frontOffice: [
      {
        id: 'fo-001', name: 'Einstein Personalization Activation',
        annualValue: 248000000, investment: 1200000, roi: 207.0, timeline: '8 weeks',
        dataReadiness: 'green', dataReadinessPct: 82,
        aiApproach: 'Activate Salesforce Einstein within existing SFCC license for loyalty member personalisation and product recommendations',
        complexity: 'low', wave: 1, vendor: ['Salesforce (Einstein already licensed — no new vendor)'],
        problem: 'Licensed 18 months. $14M/yr paid. Zero activation work started. CIO and CMO not aligned on ownership. $248M annual revenue opportunity idle. 207:1 ROI on $1.2M activation cost.',
      },
      {
        id: 'fo-002', name: 'Cart Recovery Automation (Klaviyo + Segment)',
        annualValue: 68000000, investment: 800000, roi: 85.0, timeline: '8 weeks',
        dataReadiness: 'green', dataReadinessPct: 88,
        aiApproach: 'Connect existing Segment + Klaviyo infrastructure to SFCC cart abandonment events for automated triggered campaigns',
        complexity: 'low', wave: 1, vendor: ['Klaviyo + Segment (both already licensed and paid for)'],
        problem: 'Triggers built in Klaviyo. Segment connected to SFCC. Not activated end-to-end. Platform teams not coordinated. 72% cart abandonment vs 58% benchmark. Infrastructure already paid for — pure execution gap.',
      },
      {
        id: 'fo-003', name: 'Loyalty Reactivation Programme',
        annualValue: 84000000, investment: 2400000, roi: 35.0, timeline: '6 months',
        dataReadiness: 'yellow', dataReadinessPct: 68,
        aiApproach: 'ML segmentation on 28.4M loyalty members to identify lapsed segments and re-engage with personalised incentives',
        complexity: 'medium', wave: 1, vendor: ['Salesforce Einstein', 'Klaviyo', 'Databricks ML'],
        problem: '28.4M loyalty members. Only 42% active (11.9M). 16.5M inactive members. Email open rate 14% vs 28% benchmark. AI segmentation brings active rate to 65%+ within 12 months.',
      },
    ],
    middleOffice: [
      {
        id: 'mo-001', name: 'o9 Demand Forecasting Completion',
        annualValue: 180000000, investment: 3600000, roi: 50.0, timeline: '9 months',
        dataReadiness: 'yellow', dataReadinessPct: 62,
        aiApproach: 'Complete o9 implementation from 40% to 100% — North America model as template for remaining 4 regions',
        complexity: 'medium', wave: 1, vendor: ['o9 Solutions (contract active)', 'Deloitte Supply Chain SI'],
        problem: '$6.8M already invested. 40% complete after 18 months. $900M excess inventory and 4.2x turns vs 6.8x benchmark. Completion success rate 85% vs restart 58%. Fixed-fee completion contract required.',
      },
      {
        id: 'mo-002', name: 'Shrinkage AI Detection Scale',
        annualValue: 130000000, investment: 8400000, roi: 15.5, timeline: '12 months',
        dataReadiness: 'green', dataReadinessPct: 78,
        aiApproach: 'Scale camera-based AI shrinkage detection from 12 pilot stores to all 2,400 stores over 12 months',
        complexity: 'medium', wave: 2, vendor: ['Verkada', 'Checkpoint Systems', 'Sensormatic (Johnson Controls)'],
        problem: '12-store pilot proven: 34% shrinkage reduction. No executive sponsor named for scale decision. $259M excess shrinkage vs benchmark. 50% reduction target at scale = $130M annual recovery.',
      },
      {
        id: 'mo-003', name: 'Store Traffic AI Optimisation',
        annualValue: 85000000, investment: 6800000, roi: 12.5, timeline: '18 months',
        dataReadiness: 'red', dataReadinessPct: 32,
        aiApproach: 'ML on unified store traffic + inventory data to optimise staffing, merchandising, and store layout',
        complexity: 'high', wave: 3, vendor: ['RetailNext', 'Pathr.ai', 'Databricks ML'],
        problem: 'Requires unified store data from all 6 ERP systems. 4 of 6 ERPs not AI-ready. Blocked until data unification complete. High value but Wave 3 — after ERP work is underway.',
      },
    ],
    backOffice: [
      {
        id: 'bo-001', name: 'SAP R/3 Migration Planning (Continental Europe)',
        annualValue: 0, investment: 2800000, roi: 0, timeline: '24+ months to complete',
        dataReadiness: 'yellow', dataReadinessPct: 55,
        aiApproach: 'SAP S/4HANA migration programme for Continental Europe: 8,200 customisations, 25% of global revenue, EOL Dec 2027',
        complexity: 'high', wave: 1, vendor: ['SAP Professional Services', 'Accenture SAP Practice', 'Deloitte SAP CoE'],
        problem: 'SAP R/3 EOL December 2027. 20 months remaining. Migration window is 18–24 months. Starting now means arriving exactly at deadline. Every month of delay increases forced-migration risk for a $4.6B revenue region.',
      },
      {
        id: 'bo-002', name: 'E-Commerce Fulfilment Cost Reduction',
        annualValue: 269000000, investment: 4800000, roi: 56.0, timeline: '9 months',
        dataReadiness: 'green', dataReadinessPct: 76,
        aiApproach: 'Carrier consolidation + ML route optimisation + return friction programme to close the $615M annual fulfilment drag',
        complexity: 'medium', wave: 1, vendor: ['Shipbob', 'Flexe', 'Manhattan Associates'],
        problem: 'Fulfilment cost $18.40/order vs $11.20 target — $7.20 gap × 48M orders = $346M excess. Return rate 28% vs 18% industry = $269M excess. E-commerce at -2.1% margin destroys blended margin as channel grows.',
      },
      {
        id: 'bo-003', name: 'Supplier Risk Intelligence',
        annualValue: 45000000, investment: 3200000, roi: 14.1, timeline: '12 months',
        dataReadiness: 'red', dataReadinessPct: 28,
        aiApproach: 'ML risk scoring on all 2,400 suppliers using alternative data (news, financial, climate risk) + EDI integration',
        complexity: 'medium', wave: 2, vendor: ['Riskmethods (Sphera)', 'Interos', 'Elementum'],
        problem: '0 of 2,400 suppliers risk-scored. SAP R/3 EOL blocks Continental Europe supplier data feed. Top 20 suppliers = 68% of COGS. Zero visibility on supply chain disruption risk across entire network.',
      },
    ],
  },

  roadmap: {
    wave1: {
      name: 'Activate the Built',
      months: '0–6',
      totalInvestment: 15600000,
      totalAnnualValue: 599000000,
      roi: 38.4,
      initiatives: ['fo-001', 'fo-002', 'fo-003', 'mo-001', 'bo-001', 'bo-002'],
      prerequisite: '',
    },
    wave2: {
      name: 'Scale the Proven',
      months: '6–12',
      totalInvestment: 15000000,
      totalAnnualValue: 218000000,
      roi: 14.5,
      initiatives: ['mo-002', 'bo-003'],
      prerequisite: 'Einstein live and delivering revenue, o9 at 75%+, SAP migration SI selected and scoped',
    },
    wave3: {
      name: 'Foundation AI',
      months: '12–24',
      totalInvestment: 6800000,
      totalAnnualValue: 85000000,
      roi: 12.5,
      initiatives: ['mo-003'],
      prerequisite: 'Data unification layer complete, minimum 4 ERP systems AI-ready',
    },
    summary: {
      totalInvestment: 37400000,
      totalAnnualValue: 902000000,
      blendedROI: 24.1,
      paybackMonths: 2.5,
      mckinseyEquivalent: 6000000,
      abarvaFee: 280000,
      saving: 5720000,
    },
  },
}

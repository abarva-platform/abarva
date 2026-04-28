export const nexoraIndustry = {
  source: 'industry+public' as const,
  confidence: 0.91,

  sources: [
    'NRF — Retail Technology Report 2025',
    'Gartner — Retail AI Maturity Survey 2025',
    'McKinsey — The Retail AI Dividend (2025)',
    'BCG — Margin Recovery in Retail (2025)',
    'Forrester — Customer Experience Index, Retail 2025',
    'SAP — ECC End of Life Documentation (official)',
    'Nexora 10-K 2024 (public SEC filing)',
  ],

  peerBenchmarks: {
    operatingMargin: {
      label: 'Operating Margin',
      nexora: 3.2,
      peerMedian: 5.1,
      topQuartile: 7.8,
      unit: '%',
      direction: 'higher-is-better',
      gap: -1.9,
      gapDollars: 350, // $M at current revenue
    },
    ecommerceConversion: {
      label: 'E-Commerce Conversion Rate',
      nexora: 2.3,
      peerMedian: 3.4,
      topQuartile: 4.8,
      unit: '%',
      direction: 'higher-is-better',
      gap: -1.1,
      revenueImpact: 248, // $M from conversion improvement to peer median
    },
    inventoryTurns: {
      label: 'Inventory Turns',
      nexora: 4.2,
      peerMedian: 5.6,
      topQuartile: 7.4,
      unit: 'x',
      direction: 'higher-is-better',
      gap: -1.4,
      capitalTrapped: 900, // $M
    },
    fulfillmentCost: {
      label: 'Fulfillment Cost per Order',
      nexora: 18.40,
      peerMedian: 12.80,
      topQuartile: 9.20,
      unit: '$',
      direction: 'lower-is-better',
      gap: 5.60,
      annualExcess: 269, // $M at 48M orders
    },
    aiROI: {
      label: 'Documented AI ROI on Investment',
      nexora: 8,
      peerMedian: 38,
      topQuartile: 72,
      unit: '%',
      direction: 'higher-is-better',
      gap: -30,
      note: 'Nexora 8% vs 38% peer median. $148M invested, $12M return.',
    },
    shrinkageRate: {
      label: 'Shrinkage Rate',
      nexora: 2.8,
      industryMedian: 1.4,
      topQuartile: 0.9,
      unit: '% of revenue',
      direction: 'lower-is-better',
      gap: 1.4,
      excessCost: 259, // $M
    },
    loyaltyEngagement: {
      label: 'Loyalty Program Active Rate',
      nexora: 42,
      industryMedian: 64,
      topQuartile: 82,
      unit: '%',
      direction: 'higher-is-better',
      gap: -22,
    },
  },

  publicDataHighlights: [
    {
      source: 'Nexora 10-K 2024 (SEC filing)',
      finding: 'Operating margin disclosed at 3.2%, down from 3.9% in 2023 and 4.8% in 2022. Management cited "investment in digital and supply chain capabilities" but provided no timeline for margin recovery.',
      severity: 'critical',
    },
    {
      source: 'Nexora 10-K 2024 — Risk Factors',
      finding: 'SAP ECC end-of-support risk disclosed: "Certain legacy ERP systems will reach end of vendor support by December 2027. Migration planning is underway." No specific timeline or cost estimate provided.',
      severity: 'high',
    },
    {
      source: 'SAP Official EOL Documentation (public)',
      finding: 'SAP R/3 mainstream maintenance ends December 2025. Extended maintenance ends December 2027. Any organization on SAP R/3 after 2027 has no security patches, no compliance updates, no support.',
      severity: 'critical',
    },
    {
      source: 'Press Release, January 2026',
      finding: '"Nexora announces $148M AI investment programme over 3 years." No mention of ROI tracking methodology or baselines. CFO statement: "We expect material returns by 2027."',
      severity: 'medium',
    },
    {
      source: 'Bloomberg Retail Tech Survey, Q1 2026',
      finding: 'Nexora ranked 3rd-lowest among 28 peer retailers on e-commerce margin. "Negative contribution margin from digital channel is the defining strategic challenge for the next 18 months."',
      severity: 'high',
    },
    {
      source: 'Glassdoor / LinkedIn (public)',
      finding: '3.4/5 employer rating. COO team reviews cite fragmented ERP systems and "impossible to get clean data across regions." CIO reviews mention "technology is bought but not deployed."',
      severity: 'medium',
    },
  ],

  genomePatterns: [
    {
      pattern: 'AI Personalization Idle >12 Months',
      occurrences: 8,
      failureRate: 75,
      failureRatePct: '75%',
      presentAtNexora: true,
      presentSince: 'Einstein licensed April 2024 — 18 months idle',
      mitigation: 'Assign single executive owner. Activate in 6-week sprint. Defer platform decisions until activation ROI is measured.',
      nexoraSpecific: '$14M/yr license paid. $248M revenue opportunity idle. $1.2M activation cost. 207:1 ROI. No organizational owner named.',
    },
    {
      pattern: 'ERP EOL <24 Months With No Migration Plan',
      occurrences: 12,
      failureRate: 83,
      failureRatePct: '83%',
      presentAtNexora: true,
      presentSince: 'SAP R/3 Continental Europe: EOL December 2027 — 20 months away',
      mitigation: 'Begin vendor selection and scope immediately. S/4HANA migration is 18-24 months. Starting now means arriving exactly at deadline. Every month of delay increases risk.',
      nexoraSpecific: '8,200 customizations in SAP R/3. Continental Europe = 25% of revenue. No migration programme initiated as of Q1 2026.',
    },
    {
      pattern: '6+ ERP Systems Blocking Unified Commerce',
      occurrences: 7,
      failureRate: 71,
      failureRatePct: '71%',
      presentAtNexora: true,
      presentSince: 'Ongoing — 6 ERP systems, no unified data model since at least 2020',
      mitigation: 'Prioritize data unification layer (not full ERP replacement) as immediate step. S/4HANA rollout is 3-5 year programme. Data virtualization buys 18 months while migration is planned.',
      nexoraSpecific: 'Store traffic AI, supplier risk, and inventory forecasting all blocked by fragmented ERP data. $82M annual ERP cost for systems that can\'t talk to each other.',
    },
    {
      pattern: 'Negative E-Commerce Margin With No Roadmap',
      occurrences: 14,
      failureRate: 64,
      failureRatePct: '64%',
      presentAtNexora: true,
      presentSince: 'E-commerce -2.1% margin since at least 2023',
      mitigation: 'Fulfillment cost reduction and return rate improvement are the fastest paths. Carrier consolidation + return friction ($3-5 charge) can close 60% of margin gap within 6 months.',
      nexoraSpecific: 'E-commerce growing (22% of revenue) but destroying blended margin. $346M annual fulfillment cost excess. $269M return cost excess. Combined: $615M drag.',
    },
  ],
}

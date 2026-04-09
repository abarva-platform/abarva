export const apexRetailAI = {
  maturity: {
    dataReadiness: { overall: 54, customer: 48, inventory: 42, financial: 68, store: 52, supplyChain: 58 },
    techReadiness: { overall: 48, mlPlatform: 42, dataPlatform: 38, integration: 44, mlops: 18, governance: 12 },
    orgReadiness: { overall: 36, talent: 42, literacy: 28, changeCapacity: 32, leadership: 44 },
    currentInitiatives: [
      { name: "Demand Forecasting (o9)", status: "Pilot Purgatory", scope: "40% implemented", monthsStuck: 18, investment: 6800000, outcome: "62% accuracy vs 84% benchmark. $180M excess inventory." },
      { name: "Customer Churn Model", status: "Validated — Not Deployed", scope: "Built in Databricks", monthsStuck: 8, investment: 280000, outcome: "Model validated. No activation workflow built." },
      { name: "Loss Prevention AI", status: "Pilot — 12 stores", scope: "12 of 800 stores", monthsStuck: 6, investment: 400000, outcome: "28% shrinkage reduction in pilot stores." },
      { name: "Personalization", status: "BLOCKED — Einstein Not Activated", scope: "Enterprise", monthsStuck: 14, investment: 0, outcome: "$248M opportunity. Einstein purchased never activated." },
    ],
    pattern: "PILOT_PURGATORY",
    pilotsPurgatory: 4,
    patternDescription: "4 AI initiatives and 0 at enterprise scale. CDO vacant, no MLOps, SAP blocks real-time data, Segment CDP fragmented.",
  },
  interviews: {
    ceo: { name: "Margaret Chen", tenure: "3 years", aiPriority: "Personalization — 18 million loyalty members marketed to like strangers is inexcusable", biggestBlocker: "Data fragmentation — Segment CDP 50% fragmentation, SAP not connected to Snowflake", investmentAppetite: "$20-40M if it moves digital revenue from 28% to 40%", successMetric: "Digital revenue above 35% and loyalty active rate above 60% by FY2026", changeReadiness: "High", aiQuote: "Amazon knows what our customers want before they do. We are marketing to 18 million people like they are the same person." },
    cto: { name: "James Okafor", tenure: "18 months", aiPriority: "Complete the data foundation — Snowflake, Databricks, SAP integration — before adding more AI", biggestBlocker: "SAP ECC blocks real-time data flow. 8,400 customizations mean every integration is a project.", investmentAppetite: "$15-25M for AI after data foundation is fixed", successMetric: "Databricks models from 3 to 15 in production by Q4 2025", changeReadiness: "Medium", aiQuote: "We have Databricks, Snowflake, and Segment. We have the tools. We need the data plumbing and the people." },
    cfo: { name: "Robert Martinez", tenure: "6 years", aiPriority: "Inventory optimization — $180M in excess inventory is a balance sheet problem", biggestBlocker: "Every technology project has gone over budget. I need outcome-based contracts.", investmentAppetite: "$10-20M with outcome-based fees tied to inventory reduction", successMetric: "Inventory turnover above 5.5x and shrinkage below 2.0% by FY2026", changeReadiness: "Medium", aiQuote: "Complete the o9 implementation we already paid for before buying anything new." },
    cmo: { name: "David Park", tenure: "2 years", aiPriority: "Activate Salesforce Einstein NOW — we are paying for it and not using it", biggestBlocker: "Segment CDP fragmentation — cannot personalize when same customer counted 2.8 times", investmentAppetite: "$5-8M for personalization and loyalty activation", successMetric: "Email conversion rate 3x and loyalty redemption above 45%", changeReadiness: "High", aiQuote: "Einstein is sitting there, paid for, and not activated. That is the first call I make Monday morning." },
  },
  changeReadiness: {
    overall: 36,
    components: { leadership: 52, workforce: 28, technology: 44, culture: 32, capacity: 24 },
    riskFactors: [
      "68% annual store staff turnover — training AI tools on staff that leave is wasted investment",
      "CDO role vacant — no AI strategy ownership",
      "SAP ECC migration decision pending — IT team cannot focus on AI",
      "o9 implementation failure creating cynicism about AI promises",
      "28,000 store employees across 42 states — change management at scale is complex",
    ],
    recommendation: "Start with Einstein activation (zero cost, marketing ready) and churn model deployment (already validated). Then complete o9. Do not start store labor AI until turnover below 40%.",
  },
  opportunities: {
    frontOffice: [
      { id: "fo-001", name: "Einstein Personalization Activation", annualValue: 248000000, investment: 800000, roi: 310.0, timeline: "6 weeks", dataReadiness: "yellow", dataReadinessPct: 72, aiApproach: "Activate Salesforce Einstein in existing SFCC license — zero incremental software cost", complexity: "low", wave: 1, vendor: ["Salesforce existing"], problem: "18M loyalty members receive identical experience. Einstein purchased and never activated. $248M personalization revenue opportunity." },
      { id: "fo-002", name: "Customer Churn Model Deployment", annualValue: 84000000, investment: 600000, roi: 140.0, timeline: "8 weeks", dataReadiness: "green", dataReadinessPct: 86, aiApproach: "Deploy existing validated Databricks churn model — build activation workflow in Segment", complexity: "low", wave: 1, vendor: ["Internal Databricks existing"], problem: "Model built validated sitting undeployed 8 months. 18M members 58% inactive." },
      { id: "fo-003", name: "Loyalty Program Reactivation AI", annualValue: 124000000, investment: 4200000, roi: 29.5, timeline: "6 months", dataReadiness: "yellow", dataReadinessPct: 64, aiApproach: "ML on purchase history to generate personalized reactivation offers via Punchh", complexity: "medium", wave: 1, vendor: ["Punchh existing", "Sailthru"], problem: "42% loyalty active rate vs 68% benchmark. 10.4M inactive members. $1.24B untapped revenue." },
      { id: "fo-004", name: "Cart Abandonment Recovery AI", annualValue: 168000000, investment: 2400000, roi: 70.0, timeline: "4 months", dataReadiness: "green", dataReadinessPct: 82, aiApproach: "ML on abandonment patterns plus real-time triggered email and SMS via Segment and Yotpo", complexity: "low", wave: 1, vendor: ["Klaviyo", "Attentive", "Yotpo existing"], problem: "72% cart abandonment vs 58% benchmark. $840M recovery opportunity. Real-time trigger infrastructure exists." },
    ],
    middleOffice: [
      { id: "mo-001", name: "Demand Forecasting Completion o9", annualValue: 180000000, investment: 8400000, roi: 21.4, timeline: "9 months", dataReadiness: "yellow", dataReadinessPct: 64, aiApproach: "Complete remaining 60% of o9 implementation — connect SAP ECC actuals and train all planners", complexity: "medium", wave: 1, vendor: ["o9 Solutions existing"], problem: "62% forecast accuracy vs 84% benchmark. $180M excess inventory. $6.8M per year already paid for 40% of value." },
      { id: "mo-002", name: "Loss Prevention AI Scale-up", annualValue: 84000000, investment: 4200000, roi: 20.0, timeline: "6 months", dataReadiness: "green", dataReadinessPct: 84, aiApproach: "Scale pilot from 12 to 800 stores — computer vision plus transaction anomaly detection", complexity: "medium", wave: 1, vendor: ["Verkada", "Evolv Technology"], problem: "2.8% shrinkage vs 1.4% benchmark. $347M annual loss. Pilot showed 28% reduction." },
      { id: "mo-003", name: "Store Labor Optimization AI", annualValue: 48000000, investment: 3600000, roi: 13.3, timeline: "9 months", dataReadiness: "yellow", dataReadinessPct: 56, aiApproach: "ML on store traffic and transaction volume to optimize scheduling in Infor WFM", complexity: "medium", wave: 2, vendor: ["Reflexis", "Legion WFM"], problem: "Manual scheduling. 68% turnover partly driven by poor scheduling. $48M labor optimization." },
      { id: "mo-004", name: "Supply Chain Route Optimization", annualValue: 96000000, investment: 5800000, roi: 16.6, timeline: "12 months", dataReadiness: "yellow", dataReadinessPct: 62, aiApproach: "ML on Oracle TMS plus store demand data for optimal routing and carrier selection", complexity: "high", wave: 2, vendor: ["Blue Yonder TMS AI", "Oracle Fusion existing"], problem: "Supply chain cost 20% of revenue vs 16% benchmark. On-time delivery 82% vs 96% benchmark." },
    ],
    backOffice: [
      { id: "bo-001", name: "Segment CDP Identity Resolution", annualValue: 62000000, investment: 800000, roi: 77.5, timeline: "90 days", dataReadiness: "green", dataReadinessPct: 82, aiApproach: "Twilio Professional Services for identity resolution — reduce 2.8x duplication to 1.1x", complexity: "low", wave: 1, vendor: ["Twilio Segment Professional Services"], problem: "50% profile fragmentation. CCPA compliance risk. Blocks all personalization use cases." },
      { id: "bo-002", name: "AP and Finance Automation", annualValue: 8400000, investment: 1200000, roi: 7.0, timeline: "4 months", dataReadiness: "green", dataReadinessPct: 86, aiApproach: "OCR plus NLP for invoice processing integrated with SAP ECC via API", complexity: "low", wave: 1, vendor: ["Esker", "Basware", "SAP Concur AI"], problem: "Manual AP processing. 38 FTE. 6-day payment cycle vs 2-day benchmark." },
      { id: "bo-003", name: "Procurement Analytics AI", annualValue: 24000000, investment: 2000000, roi: 12.0, timeline: "6 months", dataReadiness: "yellow", dataReadinessPct: 64, aiApproach: "ML on SAP Ariba spend data for supplier risk pricing and consolidation opportunities", complexity: "medium", wave: 2, vendor: ["Jaggaer", "Ivalua", "SAP Ariba Intelligence existing"], problem: "$2.4B managed spend. China sourcing 48% strategic risk. No AI-driven spend analytics." },
    ],
  },
  roadmap: {
    wave1: { name: "Activate What You Already Have", months: "0-6", totalInvestment: 27200000, totalAnnualValue: 866000000, roi: 31.8, initiatives: ["fo-001", "fo-002", "fo-003", "fo-004", "mo-001", "mo-002", "bo-001", "bo-002"], tagline: "Einstein is already paid for. Churn model is already built. Just activate.", prerequisite: "" },
    wave2: { name: "Scale and Optimize", months: "6-12", totalInvestment: 18200000, totalAnnualValue: 282000000, roi: 15.5, initiatives: ["mo-003", "mo-004", "bo-003"], prerequisite: "Einstein live, CDP unified, o9 complete" },
    wave3: { name: "Transform the Business Model", months: "12-18", totalInvestment: 12000000, totalAnnualValue: 124000000, roi: 10.3, initiatives: [], prerequisite: "Wave 1 and 2 complete" },
    summary: { totalInvestment: 57400000, totalAnnualValue: 1272000000, blendedROI: 22.2, paybackMonths: 2.8, mckinseyEquivalent: 3500000, abarvaFee: 140000, saving: 3360000 },
  },
}

export const firstCapitalAI = {
  maturity: {
    dataReadiness: { overall: 52, transactional: 72, customer: 44, risk: 62, operational: 38, technology: 42 },
    techReadiness: { overall: 38, mlPlatform: 18, dataPlatform: 32, integration: 44, mlops: 8, governance: 12 },
    orgReadiness: { overall: 42, talent: 32, literacy: 28, changeCapacity: 48, leadership: 58 },
    currentInitiatives: [
      { name: "Fraud Detection ML", status: "In Development", scope: "Credit card only", monthsStuck: 6, investment: 400000, outcome: "TBD" },
      { name: "AML Automation Upgrade", status: "Blocked — vendor version behind", scope: "Enterprise", monthsStuck: 18, investment: 1200000, outcome: "Blocked by NICE Actimize 8.1" },
      { name: "Credit Underwriting AI", status: "Concept Only", scope: "None", monthsStuck: 8, investment: 0, outcome: "TBD" },
    ],
    pattern: "TECHNOLOGY_CONSTRAINED",
    pilotsPurgatory: 2,
    patternDescription: "FIS HORIZON architecture blocks real-time AI. SQL Server 2017 EOS blocks modern data platform. No CDO role.",
  },
  interviews: {
    cto: { name: "James Okafor", tenure: "18 months", aiPriority: "Fraud detection ML — we are losing $3.8M annually above benchmark", biggestBlocker: "FIS HORIZON — real-time scoring requires API layer we do not have", investmentAppetite: "$8-15M if it reduces cost-to-income ratio", successMetric: "Fraud losses below $4M and AML false positives below 50%", changeReadiness: "Medium", aiQuote: "We cannot build AI on a 22-year-old core banking system. The modernization decision unlocks everything." },
    cfo: { name: "Robert Martinez", tenure: "6 years", aiPriority: "Cost-to-income from 68% to 55% — AI in back office automation", biggestBlocker: "Capital allocation — every dollar on AI is not spent on core banking modernization", investmentAppetite: "$5-10M maximum until cost-to-income improves", successMetric: "Cost-to-income below 62% by end of FY2025", changeReadiness: "Medium", aiQuote: "If AI can reduce our compliance cost from 34% of IT budget I will fund it." },
    coo: { name: "Sandra Williams", tenure: "8 years", aiPriority: "Customer service automation — every call we deflect is cost reduction", biggestBlocker: "Every system we implement takes twice as long and costs twice as much", investmentAppetite: "$3-5M for proven use cases only", successMetric: "Digital adoption from 41% to 55% and call center volume down 20%", changeReadiness: "Low", aiQuote: "Show me one thing that works before asking me to believe in a portfolio of AI projects." },
    cmo: { name: "David Park", tenure: "2 years", aiPriority: "Personalization — we have 1.8M digital customers and market to them all the same way", biggestBlocker: "T+1 balances — we cannot personalize in real time when data is 24 hours stale", investmentAppetite: "$2-4M for customer analytics and personalization", successMetric: "Digital adoption 55% and mobile app rating above 4.0", changeReadiness: "High", aiQuote: "Our customers see yesterday balances. We cannot build a digital bank on stale data." },
  },
  changeReadiness: {
    overall: 44,
    components: { leadership: 58, workforce: 38, technology: 32, culture: 42, capacity: 48 },
    riskFactors: [
      "FIS HORIZON blocks real-time AI — architecture constraint not culture",
      "SQL Server 2017 EOS October 2025 — data platform risk",
      "No CDO — analytics ownership gap",
      "3 OCC MRAs consuming AI investment capacity",
      "COO resistance — every project has gone over budget",
    ],
    recommendation: "Lead with fraud and AML — high ROI, regulatory benefit, low resistance. Sequence personalization after FedNow API layer fixes real-time data.",
  },
  opportunities: {
    frontOffice: [
      { id: "fo-001", name: "Real-time Fraud Detection ML", annualValue: 3800000, investment: 2400000, roi: 9.5, timeline: "9 months", dataReadiness: "yellow", dataReadinessPct: 68, aiApproach: "ML scoring on transaction characteristics via FedNow API layer", complexity: "medium", wave: 1, vendor: ["FICO Falcon", "Featurespace", "Feedzai"], problem: "Fraud losses $7M vs $3.2M benchmark. Rule-based detection only. $3.8M annual excess." },
      { id: "fo-002", name: "Customer Churn Prediction", annualValue: 8400000, investment: 1800000, roi: 11.0, timeline: "9 months", dataReadiness: "yellow", dataReadinessPct: 62, aiApproach: "ML on transaction behavior and digital engagement patterns", complexity: "medium", wave: 2, vendor: ["Build internal", "Pega"], problem: "Digital adoption 41% vs 67%. 180,000 customers at churn risk. No early warning system." },
      { id: "fo-003", name: "Personalized Digital Banking", annualValue: 12000000, investment: 2800000, roi: 4.3, timeline: "12 months", dataReadiness: "red", dataReadinessPct: 42, aiApproach: "Real-time ML recommendations via Q2 API — requires FedNow real-time data fix first", complexity: "high", wave: 3, vendor: ["Personetics", "MX Technologies"], problem: "1.8M digital customers receive identical experience. T+1 data blocks real-time personalization." },
      { id: "fo-004", name: "Mobile App AI Features", annualValue: 4800000, investment: 1200000, roi: 4.0, timeline: "6 months", dataReadiness: "yellow", dataReadinessPct: 64, aiApproach: "LLM chatbot and spending insights and savings recommendations in Q2 app", complexity: "medium", wave: 2, vendor: ["Q2 Innovation Studio", "Clinc"], problem: "Mobile rating 3.2/5. 64% account opening abandonment. AI features close gap vs neobanks." },
    ],
    middleOffice: [
      { id: "mo-001", name: "AML Automation Upgrade", annualValue: 3800000, investment: 2400000, roi: 8.0, timeline: "9 months", dataReadiness: "yellow", dataReadinessPct: 72, aiApproach: "NICE Actimize 10.2 upgrade — ML detection reduces false positives from 78% to 42%", complexity: "medium", wave: 1, vendor: ["NICE Actimize 10.2 existing vendor"], problem: "78% false positive rate. 6 excess FTE. $1.08M annual manual review cost. 3 OCC MRAs." },
      { id: "mo-002", name: "Credit Underwriting AI", annualValue: 6200000, investment: 3600000, roi: 7.2, timeline: "12 months", dataReadiness: "yellow", dataReadinessPct: 58, aiApproach: "ML on alternative data sources for faster and more accurate decisioning", complexity: "high", wave: 2, vendor: ["Zest AI", "Upstart Network"], problem: "Manual underwriting. 5 day decision time vs 2 hour neobank benchmark. Losing commercial clients." },
      { id: "mo-003", name: "Deposit Pricing Optimization", annualValue: 12000000, investment: 2100000, roi: 14.0, timeline: "6 months", dataReadiness: "green", dataReadinessPct: 82, aiApproach: "ML optimization on rate elasticity and competitor pricing data", complexity: "low", wave: 1, vendor: ["Build internal on Azure ML", "Nomis Solutions"], problem: "Manual pricing decisions — leaving $12M per year in margin due to suboptimal deposit rates." },
      { id: "mo-004", name: "Regulatory Reporting Automation", annualValue: 5200000, investment: 3200000, roi: 8.1, timeline: "12 months", dataReadiness: "yellow", dataReadinessPct: 64, aiApproach: "NLP and ML to automate FFIEC BSA OCC regulatory report generation", complexity: "high", wave: 2, vendor: ["Axiom SL", "Wolters Kluwer OneSumX"], problem: "Compliance cost 34% of IT budget. Highest in peer group. Manual regulatory reporting consuming 28 FTE." },
    ],
    backOffice: [
      { id: "bo-001", name: "Intelligent Document Processing", annualValue: 2800000, investment: 800000, roi: 7.0, timeline: "4 months", dataReadiness: "green", dataReadinessPct: 84, aiApproach: "OCR and NLP for loan documents account opening and compliance documentation", complexity: "low", wave: 1, vendor: ["ABBYY", "Hyperscience", "Azure Form Recognizer"], problem: "84% of documents processed manually. 18 FTE. Loan processing 5 days vs 1 day benchmark." },
      { id: "bo-002", name: "Branch Network Optimization AI", annualValue: 4400000, investment: 1600000, roi: 6.25, timeline: "9 months", dataReadiness: "green", dataReadinessPct: 78, aiApproach: "ML on transaction volume and digital adoption to optimize 84 branch footprint", complexity: "medium", wave: 2, vendor: ["Novantas", "Build internal"], problem: "84 branches sized for pre-digital banking. 22% of branches below profitability threshold." },
    ],
  },
  roadmap: {
    wave1: { name: "Architecture Fix and Quick Wins", months: "0-6", totalInvestment: 12900000, totalAnnualValue: 37800000, roi: 5.8, initiatives: ["fo-001", "mo-001", "mo-003", "bo-001"], prerequisite: "" },
    wave2: { name: "Digital and Risk AI", months: "6-12", totalInvestment: 11900000, totalAnnualValue: 36400000, roi: 3.1, initiatives: ["fo-002", "fo-004", "mo-002", "mo-004", "bo-002"], prerequisite: "FedNow live, Snowflake migration complete" },
    wave3: { name: "Personalization and Advanced AI", months: "12-18", totalInvestment: 6800000, totalAnnualValue: 16800000, roi: 2.5, initiatives: ["fo-003"], prerequisite: "Real-time data infrastructure complete" },
    summary: { totalInvestment: 31600000, totalAnnualValue: 91000000, blendedROI: 4.9, paybackMonths: 10.4, mckinseyEquivalent: 2500000, abarvaFee: 120000, saving: 2380000 },
  },
}

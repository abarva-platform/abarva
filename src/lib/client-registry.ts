import { meridianHealth } from '@/data/meridian/index'
import { meridianAI } from '@/data/meridian/ai'
import { firstCapital } from '@/data/firstcapital/index'
import { firstCapitalAI } from '@/data/firstcapital/ai'
import { apexRetail } from '@/data/apexretail/index'
import { apexRetailAI } from '@/data/apexretail/ai'

export type DataStatus = 'loaded' | 'pending' | 'missing' | 'na'

export type DataCategory = {
  key: string
  label: string
  status: DataStatus
  loadedDate?: string
  approvedBy?: string
  fileName?: string
  powers: string[]
  keyPoints: string[]
  missingUnlocks?: string[]
  missingValue?: string
}

export type ClientEntry = {
  id: string
  name: string
  shortName: string
  vertical: string
  revenue: string
  employees: string
  color: string
  status: 'active' | 'onboarding' | 'closed'
  maestro: string
  startDate: string
  dataCompleteness: number
  keyMetrics: Array<{
    label: string
    value: string
    target: string
    status: 'critical' | 'warning' | 'ok'
  }>
  dataCategories: DataCategory[]
  intelligence: {
    critical: Array<{ text: string; metric?: string }>
    ready: Array<{ product: string; href: string; summary: string }>
    contradictions: number
  }
}

// ─── Meridian Health System ─────────────────────────────────────────────────

const meridianCategories: DataCategory[] = [
  {
    key: 'financials', label: 'FINANCIALS', status: 'loaded',
    loadedDate: 'March 16, 2026', approvedBy: 'Robert Chen (CFO)',
    fileName: 'meridian_financials_2025.xlsx',
    powers: ['Situation Intelligence — operating margin analysis', 'AI Investment Intelligence — budget allocation', 'Business Case Intelligence — ROI baseline', 'Outcome Intelligence — savings tracking'],
    keyPoints: [`Revenue: $${meridianHealth.org.revenue}B (FY2025)`, `Operating margin: ${meridianHealth.org.operatingMargin}% (target: ${meridianHealth.org.targetOperatingMargin}%)`, `IT budget: $${meridianHealth.financials.itBudget2024}M`, `RCM denial write-off: $${meridianHealth.technology.rcm.denialWriteOff2023}M annual`],
  },
  {
    key: 'technology', label: 'TECHNOLOGY', status: 'loaded',
    loadedDate: 'March 16, 2026', approvedBy: 'Marcus Webb (CIO)',
    fileName: 'meridian_technology_inventory.xlsx',
    powers: ['Situation Intelligence — technology gap analysis', 'Blueprint Intelligence — architecture decisions', 'Select Intelligence — vendor shortlists'],
    keyPoints: [`EHR: ${meridianHealth.technology.ehr.vendor} (optimization ${meridianHealth.technology.ehr.optimizationScore}/100)`, `RCM: ${meridianHealth.technology.rcm.vendor} — $${meridianHealth.technology.rcm.contractValue}M contract`, `SLA breach penalties: $8M enforceable`, 'Prior auth automation: 23% of payers only'],
  },
  {
    key: 'leadership', label: 'LEADERSHIP', status: 'loaded',
    loadedDate: 'March 17, 2026', approvedBy: 'Anand Sundaram (Maestro)',
    fileName: 'meridian_leadership_profiles.docx',
    powers: ['Situation Intelligence — stakeholder context', 'Stakeholder Intelligence — executive map', 'AI Strategy — change readiness'],
    keyPoints: ['8 executive profiles loaded', 'Marcus Webb (CIO) — 18 months tenure', 'CDO role vacant since March 2025', 'Robert Chen (CFO): $94M denial write-off cited in interviews'],
  },
  {
    key: 'clinical', label: 'CLINICAL', status: 'loaded',
    loadedDate: 'March 17, 2026', approvedBy: 'Dr. Sarah Okonkwo (CMIO)',
    fileName: 'meridian_clinical_operations.xlsx',
    powers: ['CMIO Intelligence — clinical performance', 'AI Investment — clinical use cases', 'Outcome Intelligence — clinical baselines'],
    keyPoints: [`23 hospitals, ${meridianHealth.hospitals.totalBeds.toLocaleString()} total beds`, `${meridianHealth.hospitals.annualDischarges.toLocaleString()} annual discharges`, `${meridianHealth.hospitals.occupancyRate}% occupancy rate`, `Medicare Advantage: ${meridianHealth.healthPlan.medicareAdvantage.starRating} stars (target: 4.0)`],
  },
  {
    key: 'ai', label: 'AI', status: 'loaded',
    loadedDate: 'March 18, 2026', approvedBy: 'Marcus Webb (CIO)',
    fileName: 'meridian_ai_assessment.xlsx',
    powers: ['AI Investment Intelligence — all 8 steps', 'Prioritization Matrix', 'Board Deck generation'],
    keyPoints: [`9 AI opportunities mapped`, `$${Math.round(meridianAI.roadmap.summary.totalAnnualValue / 1e6)}M total annual value`, `Wave 1: $${Math.round(meridianAI.roadmap.wave1.totalAnnualValue / 1e6)}M in months 0–6`, `Blended ROI: ${meridianAI.roadmap.summary.blendedROI}x`],
  },
  {
    key: 'vendors', label: 'VENDORS', status: 'loaded',
    loadedDate: 'March 19, 2026', approvedBy: 'James Whitfield (COO)',
    fileName: 'meridian_vendor_contracts.xlsx',
    powers: ['Select Intelligence — 6 open decisions scored', 'Procurement Intelligence — spend analysis', 'Negotiation playbooks generated'],
    keyPoints: ['6 open vendor decisions', '$292M at stake across decisions', 'Cohere Health: 94/100 for Prior Auth', '$8M in Ensemble SLA penalties — enforceable now'],
  },
  {
    key: 'interviews', label: 'INTERVIEWS', status: 'loaded',
    loadedDate: 'March 20, 2026', approvedBy: 'Anand Sundaram (Maestro)',
    fileName: 'meridian_stakeholder_interviews.docx',
    powers: ['Situation Intelligence — contradiction detection', 'Stakeholder Intelligence — executive priorities', 'AI Strategy — change readiness scoring'],
    keyPoints: [`${meridianHealth.contradictions.length} contradictions identified`, 'CIO: "I need 6 months just to do a proper assessment"', 'CFO: "$94M denial write-off keeps me up at night"', 'COO: "Show me a vendor who will put fees at risk"'],
  },
  {
    key: 'outcomes', label: 'OUTCOMES', status: 'loaded',
    loadedDate: 'March 21, 2026', approvedBy: 'Robert Chen (CFO)',
    fileName: 'meridian_outcome_baselines.xlsx',
    powers: ['Outcome Intelligence — portfolio tracking', 'Board Report — outcomes only', 'Outcome fee activation — verified savings'],
    keyPoints: ['3 active initiatives being tracked', '$28M projected Wave 1 savings', 'Baseline set: 18.2% denial rate, 4.2d prior auth', 'Prior auth initiative: 90-day milestone Apr 18'],
  },
]

// ─── First Capital Financial ─────────────────────────────────────────────────

const firstCapitalCategories: DataCategory[] = [
  {
    key: 'financials', label: 'FINANCIALS', status: 'loaded',
    loadedDate: 'March 29, 2026', approvedBy: 'Robert Martinez (CFO)',
    fileName: 'firstcapital_financials_2025.xlsx',
    powers: ['Situation Intelligence — cost-to-income analysis', 'Business Case Intelligence — ROI model', 'CFO Briefing — efficiency roadmap'],
    keyPoints: [`$${firstCapital.org.assets}B total assets`, `Cost-to-income: ${firstCapital.org.costToIncomeRatio}% (target: ${firstCapital.org.targetCostToIncomeRatio}%)`, `Fraud losses: $${firstCapital.financials.annualFraudExcess}M above benchmark`, `IT budget: $${firstCapital.financials.itBudget}M (${firstCapital.financials.itBudgetAsPercentRevenue}% of revenue)`],
  },
  {
    key: 'technology', label: 'TECHNOLOGY', status: 'loaded',
    loadedDate: 'March 29, 2026', approvedBy: 'James Okafor (CTO)',
    fileName: 'firstcapital_technology_inventory.xlsx',
    powers: ['Situation Intelligence — architecture constraints', 'Blueprint Intelligence — modernization path', 'AI Investment — sequencing decisions'],
    keyPoints: [`Core banking: ${firstCapital.technology.coreBanking.vendor} v${firstCapital.technology.coreBanking.version} (${firstCapital.technology.coreBanking.age} years old)`, `FedNow: Not live (${firstCapital.technology.payments.peerBanksOnFedNow}% of peers live)`, `Mobile app rating: ${firstCapital.technology.digital.mobileAppRating}/5.0`, `SQL Server 2017: EOS ${firstCapital.technology.dataWarehouse.endOfSupport}`],
  },
  {
    key: 'leadership', label: 'LEADERSHIP', status: 'loaded',
    loadedDate: 'March 30, 2026', approvedBy: 'Anand Sundaram (Maestro)',
    fileName: 'firstcapital_leadership_profiles.docx',
    powers: ['Stakeholder Intelligence — executive priorities', 'AI Strategy — change readiness', 'Executive Briefings per role'],
    keyPoints: ['4 executive profiles loaded', 'CTO James Okafor — 18 months', 'CDO reports to CRO — misaligned governance signal', 'COO: "Every system costs twice as much and takes twice as long"'],
  },
  {
    key: 'clinical', label: 'CLINICAL', status: 'na',
    powers: [],
    keyPoints: [],
    missingUnlocks: ['Not applicable for Financial Services engagements'],
  },
  {
    key: 'ai', label: 'AI', status: 'loaded',
    loadedDate: 'April 1, 2026', approvedBy: 'James Okafor (CTO)',
    fileName: 'firstcapital_ai_assessment.xlsx',
    powers: ['AI Investment Intelligence — all 8 steps', 'Fraud and AML prioritization', 'FedNow sequencing roadmap'],
    keyPoints: [`10 AI opportunities mapped`, `$${Math.round(firstCapitalAI.roadmap.summary.totalAnnualValue / 1e6)}M total annual value`, `Wave 1: Fraud + AML + Deposit Pricing`, `Blended ROI: ${firstCapitalAI.roadmap.summary.blendedROI}x`],
  },
  {
    key: 'vendors', label: 'VENDORS', status: 'loaded',
    loadedDate: 'April 2, 2026', approvedBy: 'Sandra Williams (COO)',
    fileName: 'firstcapital_vendor_contracts.xlsx',
    powers: ['Select Intelligence — vendor shortlists', 'Procurement Intelligence — FIS renegotiation', 'AML vendor upgrade path'],
    keyPoints: [`FIS HORIZON: $${firstCapital.technology.coreBanking.annualLicenseCost}M/yr license`, 'NICE Actimize: 2 major versions behind', `AML false positive rate: ${firstCapital.technology.aml.falsePositiveRate}% (benchmark: 42%)`, `Excess AML cost: $${(firstCapital.technology.aml.annualExcessCost / 1e6).toFixed(1)}M/yr`],
  },
  {
    key: 'interviews', label: 'INTERVIEWS', status: 'loaded',
    loadedDate: 'April 3, 2026', approvedBy: 'Anand Sundaram (Maestro)',
    fileName: 'firstcapital_stakeholder_interviews.docx',
    powers: ['Situation Intelligence — contradiction mapping', 'Executive Briefings', 'Stakeholder alignment analysis'],
    keyPoints: [`${firstCapital.contradictions.length} contradictions identified`, 'CTO: "14 years of technical debt and 2 years to fix it"', 'CFO: "Show me ROI or show me a cheaper path"', 'CMO: "1.8M customers seeing yesterday\'s balances"'],
  },
  {
    key: 'outcomes', label: 'OUTCOMES', status: 'loaded',
    loadedDate: 'April 4, 2026', approvedBy: 'Robert Martinez (CFO)',
    fileName: 'firstcapital_outcome_baselines.xlsx',
    powers: ['Outcome Intelligence — initiative tracking', 'Board Report generation', 'Outcome fee baseline — cost-to-income trajectory'],
    keyPoints: ['Baseline set: 68% cost-to-income ratio', 'Target: 55% by FY2027', 'Fraud baseline: $7M annual losses', 'AML false positive baseline: 78%'],
  },
]

// ─── Apex Retail Group ───────────────────────────────────────────────────────

const apexCategories: DataCategory[] = [
  {
    key: 'financials', label: 'FINANCIALS', status: 'loaded',
    loadedDate: 'April 3, 2026', approvedBy: 'Robert Martinez (CFO)',
    fileName: 'apex_financials_2025.xlsx',
    powers: ['Situation Intelligence — margin analysis', 'Business Case Intelligence — Einstein ROI', 'Board narrative — operating margin recovery'],
    keyPoints: [`Revenue: $${apexRetail.financials.revenue2023}B (FY2025)`, `Operating margin: ${apexRetail.org.operatingMargin}% (target: ${apexRetail.org.targetOperatingMargin}%)`, `IT budget: $${apexRetail.financials.itBudget}M (${apexRetail.financials.itBudgetAsPercentRevenue}% of revenue)`, `Inventory turns: ${apexRetail.financials.inventoryTurnover}x (benchmark: 6.8x)`],
  },
  {
    key: 'technology', label: 'TECHNOLOGY', status: 'loaded',
    loadedDate: 'April 3, 2026', approvedBy: 'James Okafor (CTO)',
    fileName: 'apex_technology_inventory.xlsx',
    powers: ['Blueprint Intelligence — SAP migration path', 'Architecture Intelligence — commerce platform', 'AI sequencing — Einstein activation first'],
    keyPoints: [`SAP ECC ${apexRetail.technology.erp.age} years old — support ends ${apexRetail.technology.erp.sapSupportEndDate}`, `${apexRetail.technology.erp.customizations.toLocaleString()} custom SAP objects`, `Cart abandonment: ${apexRetail.technology.commercePlatform.ecommerce.cartAbandonmentRate}% (benchmark: ${apexRetail.technology.commercePlatform.ecommerce.benchmarkCartAbandonmentRate}%)`, `o9 demand planning: 40% implemented`],
  },
  {
    key: 'leadership', label: 'LEADERSHIP', status: 'loaded',
    loadedDate: 'April 4, 2026', approvedBy: 'Anand Sundaram (Maestro)',
    fileName: 'apex_leadership_profiles.docx',
    powers: ['Stakeholder Intelligence — CEO/CFO deadlock', 'Executive Briefings — Margaret Chen framing', 'AI Strategy — change readiness'],
    keyPoints: ['6 executive profiles loaded', 'CEO Margaret Chen — former Amazon VP', 'CFO blocking $180M SAP investment', 'CMO: "18M loyalty members marketed like strangers"'],
  },
  {
    key: 'clinical', label: 'CLINICAL', status: 'na',
    powers: [],
    keyPoints: [],
    missingUnlocks: ['Not applicable for Retail engagements'],
  },
  {
    key: 'ai', label: 'AI', status: 'loaded',
    loadedDate: 'April 5, 2026', approvedBy: 'James Okafor (CTO)',
    fileName: 'apex_ai_assessment.xlsx',
    powers: ['AI Investment Intelligence — Einstein activation path', 'Demand forecasting roadmap', 'Personalization ROI model'],
    keyPoints: [`9 AI opportunities mapped`, `$${(apexRetailAI.roadmap.summary.totalAnnualValue / 1e9).toFixed(2)}B total annual value`, `Wave 1: Einstein + Churn model activation`, `Blended ROI: ${apexRetailAI.roadmap.summary.blendedROI}x`],
  },
  {
    key: 'vendors', label: 'VENDORS', status: 'loaded',
    loadedDate: 'April 5, 2026', approvedBy: 'Sandra Williams (COO)',
    fileName: 'apex_vendor_contracts.xlsx',
    powers: ['Select Intelligence — SAP migration options', 'Procurement Intelligence — Salesforce activation', 'Vendor rationalization — 8 overlapping tools'],
    keyPoints: [`SAP license: $${apexRetail.technology.erp.annualLicenseCost}M/yr`, 'Salesforce Einstein: licensed and idle', 'o9: 40% implemented — activation opportunity', `eCommerce conversion: ${apexRetail.technology.commercePlatform.ecommerce.conversionRate}% (benchmark: ${apexRetail.technology.commercePlatform.ecommerce.benchmarkConversionRate}%)`],
  },
  {
    key: 'interviews', label: 'INTERVIEWS', status: 'loaded',
    loadedDate: 'April 6, 2026', approvedBy: 'Anand Sundaram (Maestro)',
    fileName: 'apex_stakeholder_interviews.docx',
    powers: ['Situation Intelligence — contradiction mapping', 'CEO/CFO deadlock analysis', 'Board narrative framing'],
    keyPoints: [`${apexRetail.contradictions.length} contradictions identified`, 'CEO vs CFO: SAP investment deadlock identified', 'CMO: Personalization engine purchased but unused', 'COO: "Every system costs twice as much"'],
  },
  {
    key: 'outcomes', label: 'OUTCOMES', status: 'loaded',
    loadedDate: 'April 7, 2026', approvedBy: 'Lisa Thompson (CSCO)',
    fileName: 'apex_outcome_baselines.xlsx',
    powers: ['Outcome Intelligence — initiative tracking', 'Board Report — margin recovery path', 'Outcome fee baseline — Einstein activation'],
    keyPoints: ['Baseline set: 3.8% operating margin', 'Target: 6.0% by FY2027', 'Inventory baseline: 4.2x turns', 'Churn model: built and validated — not deployed'],
  },
]

// ─── Registry ───────────────────────────────────────────────────────────────

export const CLIENT_REGISTRY: ClientEntry[] = [
  {
    id: 'meridian',
    name: meridianHealth.org.name,
    shortName: meridianHealth.org.shortName,
    vertical: 'Healthcare',
    revenue: `$${meridianHealth.org.revenue}B`,
    employees: meridianHealth.org.employees.toLocaleString(),
    color: '#2DD4C8', // teal — healthcare
    status: 'active',
    maestro: 'Anand Sundaram',
    startDate: 'March 15, 2026',
    dataCompleteness: 100,
    keyMetrics: [
      { label: 'RCM Denial Rate', value: `${meridianHealth.technology.rcm.denialRate}%`, target: `Benchmark ${meridianHealth.technology.rcm.benchmarkDenialRate}%`, status: 'critical' },
      { label: 'Operating Margin', value: `${meridianHealth.org.operatingMargin}%`, target: `Target ${meridianHealth.org.targetOperatingMargin}%`, status: 'critical' },
      { label: 'Prior Auth Days', value: `${meridianHealth.technology.rcm.priorAuthAvgDays}d`, target: `Peer ${meridianHealth.technology.rcm.priorAuthPeerDays}d`, status: 'critical' },
      { label: 'Epic Optimization', value: `${meridianHealth.technology.ehr.optimizationScore}/100`, target: 'Target 85/100', status: 'warning' },
    ],
    dataCategories: meridianCategories,
    intelligence: {
      contradictions: meridianHealth.contradictions.length,
      critical: [
        { text: `RCM denial rate ${meridianHealth.technology.rcm.denialRate}% vs ${meridianHealth.technology.rcm.benchmarkDenialRate}% benchmark`, metric: `$${meridianHealth.technology.rcm.denialWriteOff2023}M annual write-off` },
        { text: 'CDO role vacant 8 months — 3 AI vendors awaiting executive decision', metric: '$94M pipeline stalled' },
        { text: `Epic optimization at ${meridianHealth.technology.ehr.optimizationScore}/100 — physician documentation AI not activated`, metric: '$18M unclaimed' },
      ],
      ready: [
        { product: 'Situation Intelligence', href: '/diagnose?client=meridian', summary: `${meridianHealth.contradictions.length} contradictions mapped, $218M total impact quantified` },
        { product: 'AI Investment Intelligence', href: '/ai-strategy?client=meridian', summary: `9 opportunities ranked, $${Math.round(meridianAI.roadmap.summary.totalAnnualValue / 1e6)}M annual value` },
        { product: 'Select Intelligence', href: '/select?client=meridian', summary: 'Prior Auth AI shortlist ready — 3 vendors scored, Cohere Health recommended' },
      ],
    },
  },
  {
    id: 'firstcapital',
    name: firstCapital.org.name,
    shortName: firstCapital.org.shortName,
    vertical: 'Financial Services',
    revenue: `$${firstCapital.org.assets}B assets`,
    employees: firstCapital.org.employees.toLocaleString(),
    color: '#6366F1', // indigo — financial services
    status: 'active',
    maestro: 'Anand Sundaram',
    startDate: 'March 28, 2026',
    dataCompleteness: 88,
    keyMetrics: [
      { label: 'Digital Adoption', value: `${firstCapital.org.digitalAdoption}%`, target: `Benchmark ${firstCapital.technology.digital.benchmarkAdoptionRate}%`, status: 'critical' },
      { label: 'Cost-to-Income', value: `${firstCapital.org.costToIncomeRatio}%`, target: `Target ${firstCapital.org.targetCostToIncomeRatio}%`, status: 'critical' },
      { label: 'FedNow Live', value: 'No', target: `${firstCapital.technology.payments.peerBanksOnFedNow}% peers live`, status: 'critical' },
      { label: 'AML False Positive', value: `${firstCapital.technology.aml.falsePositiveRate}%`, target: 'Benchmark 42%', status: 'warning' },
    ],
    dataCategories: firstCapitalCategories,
    intelligence: {
      contradictions: firstCapital.contradictions.length,
      critical: [
        { text: `FedNow not live — ${firstCapital.technology.payments.peerBanksOnFedNow}% of peer banks already deployed`, metric: '$180M commercial deposits at risk' },
        { text: `Cost-to-income ${firstCapital.org.costToIncomeRatio}% vs ${firstCapital.org.targetCostToIncomeRatio}% target`, metric: '$99M annual efficiency gap' },
        { text: `SQL Server 2017 end-of-support ${firstCapital.technology.dataWarehouse.endOfSupport}`, metric: 'AI roadmap blocked until resolved' },
      ],
      ready: [
        { product: 'Situation Intelligence', href: '/diagnose?client=firstcapital', summary: `${firstCapital.contradictions.length} contradictions mapped, $127M total impact quantified` },
        { product: 'AI Investment Intelligence', href: '/ai-strategy?client=firstcapital', summary: `10 opportunities ranked, $${Math.round(firstCapitalAI.roadmap.summary.totalAnnualValue / 1e6)}M annual value` },
        { product: 'Blueprint Intelligence', href: '/blueprint?client=firstcapital', summary: 'FedNow architecture and data platform modernization path ready' },
      ],
    },
  },
  {
    id: 'apexretail',
    name: apexRetail.org.name,
    shortName: apexRetail.org.shortName,
    vertical: 'Retail',
    revenue: `$${apexRetail.org.revenue}B`,
    employees: apexRetail.org.employees.toLocaleString(),
    color: '#F59E0B', // amber/orange — retail
    status: 'active',
    maestro: 'Anand Sundaram',
    startDate: 'April 2, 2026',
    dataCompleteness: 88,
    keyMetrics: [
      { label: 'Einstein Active', value: 'No', target: '$248M idle', status: 'critical' },
      { label: 'Cart Abandonment', value: `${apexRetail.technology.commercePlatform.ecommerce.cartAbandonmentRate}%`, target: `Benchmark ${apexRetail.technology.commercePlatform.ecommerce.benchmarkCartAbandonmentRate}%`, status: 'critical' },
      { label: 'Inventory Turns', value: `${apexRetail.financials.inventoryTurnover}x`, target: 'Benchmark 6.8x', status: 'warning' },
      { label: 'Forecast Accuracy', value: '62%', target: 'Benchmark 84%', status: 'warning' },
    ],
    dataCategories: apexCategories,
    intelligence: {
      contradictions: apexRetail.contradictions.length,
      critical: [
        { text: 'Einstein AI licensed and paid — not activated', metric: '$248M in personalization revenue idle' },
        { text: 'Churn prediction model built and validated — not deployed', metric: 'No activation workflow exists' },
        { text: `Demand forecasting at 62% accuracy vs 84% benchmark`, metric: '$180M excess inventory annually' },
      ],
      ready: [
        { product: 'Situation Intelligence', href: '/diagnose?client=apexretail', summary: `${apexRetail.contradictions.length} contradictions mapped, $183M total impact quantified` },
        { product: 'AI Investment Intelligence', href: '/ai-strategy?client=apexretail', summary: `9 opportunities ranked, $${(apexRetailAI.roadmap.summary.totalAnnualValue / 1e9).toFixed(2)}B annual value` },
        { product: 'Select Intelligence', href: '/select?client=apexretail', summary: 'Einstein activation path ready — SAP migration decision included' },
      ],
    },
  },
]

export function getDataCompleteness(client: ClientEntry): number {
  return client.dataCompleteness
}

export function getTotalPortfolioValue(): number {
  return [meridianAI, firstCapitalAI, apexRetailAI]
    .reduce((sum, ai) => sum + ai.roadmap.summary.totalAnnualValue, 0)
}

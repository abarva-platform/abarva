'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PageShell from '@/components/PageShell'

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  bg: '#060A12', surface: '#0D1520', border: '#1C2D45',
  teal: '#2DD4C8', text: '#EFF6FF', secondary: '#94A3B8',
  red: '#EF4444', amber: '#F59E0B', green: '#10B981', indigo: '#6366F1',
  sans: '"DM Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
  serif: 'Fraunces, Georgia, serif',
}

type Mode = 'select' | 'optimize'
type ClientId = 'meridian' | 'firstcapital' | 'apexretail'

// ── Client meta ────────────────────────────────────────────────────────────────
const CLIENT_META: Record<ClientId, { name: string; industry: string; vertical: 'Healthcare' | 'FinServ' | 'Retail' }> = {
  meridian:     { name: 'Meridian Health System', industry: 'Healthcare', vertical: 'Healthcare' },
  firstcapital: { name: 'First Capital Financial', industry: 'Financial Services', vertical: 'FinServ' },
  apexretail:   { name: 'Apex Retail Group', industry: 'Retail', vertical: 'Retail' },
}

// ── Vendor decisions per client ────────────────────────────────────────────────
type Decision = {
  id: string
  name: string
  status: 'URGENT' | 'HIGH' | 'MEDIUM'
  deadline: string
  context: string
  initiativeType: string
  vendors: Vendor[]
  recommendation: string
  negotiation: string
}

type Vendor = {
  id: string
  name: string
  score: number
  outcomeRate: number    // 0-1, from Genome
  referenceMatch: number // 0-100
  cost: string
  timeline: string
  failureRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  recommended: boolean
  tag: string
  fromData: string
  fromIndustry: string
  fromGenome: string
  bullets: string[]
}

const DECISIONS: Record<ClientId, Decision[]> = {
  meridian: [
    {
      id: 'prior-auth', name: 'Prior Auth Automation', status: 'URGENT',
      deadline: 'CMS mandate: Jan 2027', initiativeType: 'prior-auth-ai',
      context: 'CMS Prior Authorization rule requires electronic prior auth by January 2027. Meridian processes 847K requests/yr at $28.50 each. Current 14-day average delay is driving physician attrition and $94M in avoidable cost.',
      vendors: [
        { id: 'cohere', name: 'Cohere Health', score: 94, outcomeRate: 0.89, referenceMatch: 91, cost: '$2.1–3.2M', timeline: '6–9 mo', failureRisk: 'LOW', recommended: true, tag: 'Epic-native',
          fromData: '18.2% denial rate · Epic FHIR live · Azure-ready', fromIndustry: '$2.1–3.2M range · 340 deployments · 94% ML accuracy', fromGenome: '89% success rate · Primary risk: CDO vacancy at contract',
          bullets: ['94% ML prior auth approval accuracy', 'Pre-built Epic FHIR — no middleware build', 'Advocate Aurora + Baylor Scott & White references', 'Reduces 14-day avg to 2.3 days at peer sites'] },
        { id: 'waystar', name: 'Waystar AI', score: 81, outcomeRate: 0.78, referenceMatch: 74, cost: '$3.0–4.8M', timeline: '9–12 mo', failureRisk: 'MEDIUM', recommended: false, tag: 'Integrated RCM',
          fromData: 'Ensemble contract overlap · Higher budget ceiling', fromIndustry: 'HCA + CommonSpirit references · Bundled RCM play', fromGenome: '78% success rate · Overlap risk at 14% of deployments',
          bullets: ['Combined prior auth + RCM platform', 'HCA Healthcare + CommonSpirit references', 'Higher cost than Cohere for prior auth alone', 'Ensemble contract overlap creates redundancy'] },
        { id: 'olive', name: 'Olive AI', score: 68, outcomeRate: 0.61, referenceMatch: 59, cost: '$4.2–6.0M', timeline: '12–18 mo', failureRisk: 'HIGH', recommended: false, tag: 'Broad automation',
          fromData: 'Timeline incompatible with Jan 2027 CMS deadline', fromIndustry: 'Bon Secours + Spectrum references · Restructuring ongoing', fromGenome: '61% success rate · Vendor stability risk in 22% of cases',
          bullets: ['Broader RCM automation beyond prior auth', 'Bon Secours + Spectrum Health references', 'Highest cost, longest implementation window', 'Recent layoffs create vendor stability risk'] },
      ],
      recommendation: 'Cohere Health is the clear choice. Their Epic FHIR integration avoids a 6-month middleware build. The $8M in Ensemble SLA penalties gives you direct negotiating leverage — use it to anchor Cohere at the low end of their range.',
      negotiation: 'Disclose all three vendors are shortlisted. Demand named Epic integration leads committed before signing. Request outcome-based pricing tied to approval rate, not go-live date. Reference the $8M Ensemble leverage as your walk-away.',
    },
    {
      id: 'rcm', name: 'RCM Platform', status: 'URGENT',
      deadline: '$8M SLA penalties enforceable now', initiativeType: 'rcm-ai',
      context: 'Ensemble Health Partners holds the current RCM contract with $8M in documented SLA breaches. Revenue cycle performance is 31% below peer benchmark on net collection rate.',
      vendors: [
        { id: 'ensemble-renegotiate', name: 'Renegotiate Ensemble', score: 89, outcomeRate: 0.84, referenceMatch: 88, cost: '$8M penalty recovery', timeline: '60–90 days', failureRisk: 'LOW', recommended: true, tag: 'Use leverage first',
          fromData: '$8M in documented SLA breaches · Ensemble contract file', fromIndustry: 'Renegotiation at breach gives 25–40% rate reduction', fromGenome: '84% of health systems with documented breach recovered >$4M via demand',
          bullets: ['$8M in enforceable SLA breach penalties', 'Demand 25% fee reduction + reset SLAs with teeth', 'Fastest path to financial recovery — no migration risk', 'Threat of full re-platform creates urgency'] },
        { id: 'waystar-rcm', name: 'Re-platform to Waystar', score: 83, outcomeRate: 0.79, referenceMatch: 76, cost: '$3.0–4.8M migration', timeline: '9–12 mo', failureRisk: 'MEDIUM', recommended: false, tag: 'Full re-platform',
          fromData: 'Best option if Ensemble renegotiation fails', fromIndustry: 'HCA + CommonSpirit references · Integrated claims + prior auth', fromGenome: '79% success rate · Migration risk present in 18% of cases',
          bullets: ['Integrated claims + prior auth on one platform', 'HCA Healthcare + CommonSpirit references', 'Best option if Ensemble renegotiation fails', 'Migration disruption carries operational risk'] },
      ],
      recommendation: 'Use the $8M SLA leverage against Ensemble before committing to any re-platform. Hire outside counsel to send the breach demand letter before any negotiation meeting — it fundamentally changes the power dynamic.',
      negotiation: 'Give Ensemble a 30-day deadline for a written remediation plan with specific KPI commitments. If they miss it, begin the Waystar RFP immediately.',
    },
    {
      id: 'epic-ai', name: 'Epic AI Module Activation', status: 'HIGH',
      deadline: 'Epic upgrade window: Q3 2026', initiativeType: 'epic-ai',
      context: 'Meridian is on Epic Cogito but has not activated DAX Copilot, Predictive Risk Scoring, or Sepsis Early Warning. The Q3 2026 upgrade is the natural window — missing it means another 12 months of delay.',
      vendors: [
        { id: 'si-epic', name: 'SI Partner (Epic COE)', score: 91, outcomeRate: 0.86, referenceMatch: 89, cost: '$800K–1.4M', timeline: '6–9 mo', failureRisk: 'LOW', recommended: true, tag: 'Fastest to value',
          fromData: 'Epic score 58/100 · 6 modules dark · Azure-compatible', fromIndustry: '$800K–1.4M range · Clinical workflow redesign included', fromGenome: '86% success rate with dedicated clinical informatics lead',
          bullets: ['Top-tier SI Epic COE resources', 'Clinical workflow redesign included', 'Change management budget built in', 'Avoids internal IT resourcing gap'] },
        { id: 'epic-ps', name: 'Epic Professional Services', score: 78, outcomeRate: 0.74, referenceMatch: 71, cost: '$1.1–1.8M', timeline: '9–12 mo', failureRisk: 'MEDIUM', recommended: false, tag: 'Direct from Epic',
          fromData: 'Higher list cost · 9-month backlog documented', fromIndustry: 'Deep product knowledge · Limited scheduling flexibility', fromGenome: '74% success rate · Delays in 31% of engagements',
          bullets: ['Deep product knowledge from the source', 'Slower scheduling, higher list cost', 'Less flexibility on workflow customization', 'No dedicated change management expertise'] },
      ],
      recommendation: 'Engage an SI with proven Epic DAX deployments. DAX Copilot alone recovers 45 minutes per physician per day — across 820 physicians that is $18M in recovered capacity annually. The SI cost pays back in under 45 days.',
      negotiation: 'Make DAX Copilot physician satisfaction (80%+ would recommend after 90 days) a contractual milestone tied to 20% of SI fees.',
    },
    {
      id: 'workforce', name: 'Workforce AI Scheduling', status: 'MEDIUM',
      deadline: 'Travel nurse contract: Q4 2026', initiativeType: 'workforce-ai',
      context: 'Travel nurse spend at $48M — $20M above the $28M operating target. AI scheduling tools at peer health systems have reduced travel nurse dependency 40% in 18 months.',
      vendors: [
        { id: 'qgenda', name: 'QGenda', score: 88, outcomeRate: 0.83, referenceMatch: 86, cost: '$1.2–1.8M/yr', timeline: '6–9 mo', failureRisk: 'LOW', recommended: true, tag: 'Healthcare-native',
          fromData: '$48M travel nurse spend · 34 physicians lost in 2025 to burnout', fromIndustry: 'Providence + HCA Healthcare references · Schedule optimization AI', fromGenome: '83% success rate · $8–12M avg travel nurse reduction Year 1',
          bullets: ['AI-driven schedule optimization', 'Providence Health + HCA references', 'Reduces travel nurse dependency 40% avg at peers', 'CMIO-friendly change management approach'] },
        { id: 'ukg-workforce', name: 'UKG Workforce', score: 74, outcomeRate: 0.70, referenceMatch: 68, cost: '$900K–1.4M/yr', timeline: '9–12 mo', failureRisk: 'MEDIUM', recommended: false, tag: 'Existing vendor expansion',
          fromData: 'Kronos/UKG already in stack — potential bundle discount', fromIndustry: 'Broader HR platform · Workforce analytics included', fromGenome: '70% success rate · AI scheduling less mature than QGenda',
          bullets: ['Existing Kronos/UKG relationship may yield bundle discount', 'Broader HR analytics platform', 'AI scheduling less specialized than QGenda', 'Longer to clinical workflow impact'] },
      ],
      recommendation: 'QGenda is purpose-built for healthcare scheduling AI. The ROI case is direct: reduce travel nurse exposure from $48M toward the $28M target. Frame this as a 24-month operating margin recovery initiative.',
      negotiation: 'Request outcome-based pricing tied to travel nurse reduction rate, not go-live date. Demand 3 named references at comparable health systems before signing.',
    },
  ],
  firstcapital: [
    {
      id: 'fednow', name: 'FedNow Compliance', status: 'URGENT',
      deadline: 'January 2027 hard regulatory deadline', initiativeType: 'fednow',
      context: '76% of peer banks are live on FedNow. January 2027 is the hard Federal Reserve compliance deadline. Commercial clients are already asking. $180M in commercial deposits at risk.',
      vendors: [
        { id: 'finzly', name: 'Finzly', score: 91, outcomeRate: 0.88, referenceMatch: 87, cost: '$1.8–2.8M', timeline: '6–9 mo', failureRisk: 'LOW', recommended: true, tag: 'FedNow specialist',
          fromData: 'FIS HORIZON 22yr old · API layer required · Jan 2027 hard date', fromIndustry: '88+ banks live via Finzly · Fastest path from legacy core', fromGenome: '88% success rate · Average go-live 7.2 months from contract',
          bullets: ['FedNow-native payment hub', 'Works with FIS HORIZON via API — no core migration', '88+ community banks live in production', 'Go-live in 7.2 months average vs 14+ for core migration'] },
        { id: 'finastra', name: 'Finastra Payments', score: 79, outcomeRate: 0.75, referenceMatch: 72, cost: '$2.4–3.8M', timeline: '9–14 mo', failureRisk: 'MEDIUM', recommended: false, tag: 'Full payments platform',
          fromData: 'Broader scope risk relative to deadline', fromIndustry: 'Strong for larger regional banks · Full payment modernization', fromGenome: '75% success rate · Timeline risk present at 18% of community bank deployments',
          bullets: ['Comprehensive payments modernization', 'Strong for larger regional banks', 'Timeline may conflict with Jan 2027', 'Broader scope than FedNow-only requirement'] },
      ],
      recommendation: 'Finzly is purpose-built for FedNow compliance from legacy core systems. Their API-layer approach avoids a full FIS HORIZON migration while meeting the January 2027 deadline. 88 community banks live is the right reference pool for your profile.',
      negotiation: 'Request a written go-live guarantee with penalty clause for missing Jan 2027. Reference the 88-bank track record and demand named delivery leads committed before contract signing.',
    },
    {
      id: 'core-banking', name: 'Core Banking Modernization', status: 'HIGH',
      deadline: 'FIS HORIZON 22 years old — AI roadmap blocked', initiativeType: 'core-banking',
      context: 'FIS HORIZON implemented 2004. Real-time AI scoring blocked by architecture. 76% of peer banks have modernized or added API layer. Every AI initiative in the roadmap depends on resolving this.',
      vendors: [
        { id: 'fis-api', name: 'FIS API Layer', score: 84, outcomeRate: 0.81, referenceMatch: 82, cost: '$2.2–3.8M', timeline: '9–12 mo', failureRisk: 'LOW', recommended: true, tag: 'Fastest + lowest risk',
          fromData: 'Existing FIS relationship · EA pricing leverage available', fromIndustry: '60+ community banks have added API layer to HORIZON', fromGenome: '81% success rate · 3–4× faster than full replacement',
          bullets: ['Modern API wrapper on existing HORIZON', 'Leverage existing FIS relationship and pricing', 'Enables real-time AI scoring within 9 months', '60+ community banks have done this successfully'] },
        { id: 'temenos', name: 'Temenos (Full Replace)', score: 73, outcomeRate: 0.69, referenceMatch: 65, cost: '$18–28M', timeline: '24–36 mo', failureRisk: 'HIGH', recommended: false, tag: 'Full modernization',
          fromData: 'Board must approve multi-year commitment · Jan 2027 FedNow conflict', fromIndustry: 'Temenos strong for banks $5B+ assets · High implementation risk', fromGenome: '69% success rate · Average overrun 8 months and $3.2M',
          bullets: ['Modern cloud-native core banking', 'Full modernization removes all technical debt', '24–36 month timeline conflicts with FedNow deadline', 'Average overrun $3.2M and 8 months — Genome data'] },
      ],
      recommendation: 'FIS API Layer is the right first move. It unblocks your AI roadmap in 9 months without the 24-month disruption of a full replacement. Full replacement remains a valid 3-year strategic plan, but the FedNow deadline makes it impossible as the first step.',
      negotiation: 'Negotiate the API layer as a fixed-price engagement. Demand source code escrow for any custom integration work. Require a dedicated FIS delivery team, not shared resources.',
    },
    {
      id: 'aml', name: 'AML AI Platform', status: 'HIGH',
      deadline: 'OCC MRA active — remediation required', initiativeType: 'aml-ai',
      context: '78% false positive rate generating 6 excess FTE and $1.1M in unnecessary compliance cost. OCC MRA active. NICE Actimize at version 6.0 — upgrade to 7.2 addresses the false positive problem directly.',
      vendors: [
        { id: 'actimize-upgrade', name: 'NICE Actimize 7.2 Upgrade', score: 87, outcomeRate: 0.84, referenceMatch: 85, cost: '$480K–720K', timeline: '6–9 mo', failureRisk: 'LOW', recommended: true, tag: 'Existing vendor upgrade',
          fromData: 'Currently on Actimize 6.0 · OCC MRA requirement logged', fromIndustry: '84% false positive reduction avg from v6 → v7 upgrade', fromGenome: '84% success rate · $900K–1.3M avg cost reduction Year 1',
          bullets: ['78% → 30% false positive rate at peer banks', '$1.1M annual compliance cost reduction', 'OCC MRA remediation path — documented', 'Upgrade vs replace: 6 months vs 18 months'] },
        { id: 'featurespace', name: 'Featurespace ARIC', score: 76, outcomeRate: 0.73, referenceMatch: 69, cost: '$1.8–2.8M', timeline: '12–18 mo', failureRisk: 'MEDIUM', recommended: false, tag: 'ML-first alternative',
          fromData: 'Higher cost and longer timeline vs upgrade path', fromIndustry: 'Strong for $20B+ banks · ML-native architecture', fromGenome: '73% success rate · Integration complexity with existing compliance stack',
          bullets: ['ML-native adaptive behavioral analytics', 'Better long-term architecture than Actimize', 'Higher cost and longer timeline than upgrade', 'Integration complexity with existing OCC reporting'] },
      ],
      recommendation: 'Upgrade Actimize to 7.2. The 84% false positive reduction directly addresses the OCC MRA requirement with the fastest path to remediation. The $480K upgrade cost recovers in under 6 months against the $1.1M annual compliance FTE savings.',
      negotiation: 'Reference the OCC MRA as the delivery urgency — NICE will prioritize implementation queue. Negotiate OCC MRA documentation support as a contractual deliverable at no extra cost.',
    },
    {
      id: 'digital-onboarding', name: 'Digital Onboarding AI', status: 'MEDIUM',
      deadline: 'Neobank churn accelerating — 180K at risk', initiativeType: 'digital-ai',
      context: '41% digital adoption vs 67% benchmark. Mobile app rating 3.2/5. 180,000 customers at neobank churn risk. Digital onboarding AI at peer banks has reduced drop-off rate 40% in 90 days.',
      vendors: [
        { id: 'blend', name: 'Blend Digital Lending', score: 86, outcomeRate: 0.82, referenceMatch: 84, cost: '$800K–1.4M/yr', timeline: '4–6 mo', failureRisk: 'LOW', recommended: true, tag: 'Community bank specialist',
          fromData: '41% digital adoption · 3.2/5 app rating · Mobile-first needed', fromIndustry: 'Blend deployed at 300+ community banks · 40% drop-off reduction', fromGenome: '82% success rate · Avg 18pp digital adoption increase Year 1',
          bullets: ['Community bank digital onboarding specialist', '300+ bank references at your scale', 'Mobile-first UX with same-day account opening', '18pp digital adoption increase avg at peers'] },
        { id: 'ncino', name: 'nCino', score: 77, outcomeRate: 0.73, referenceMatch: 71, cost: '$1.2–2.0M/yr', timeline: '9–12 mo', failureRisk: 'MEDIUM', recommended: false, tag: 'Full banking cloud',
          fromData: 'Broader scope than onboarding — full lending platform', fromIndustry: 'nCino strong for commercial lending — less fit for retail onboarding', fromGenome: '73% success rate · Retail onboarding not core competency',
          bullets: ['Full bank operating system on Salesforce', 'Strong for commercial lending workflows', 'Retail onboarding is not nCino\'s core strength', 'Higher cost and longer timeline for onboarding use case'] },
      ],
      recommendation: 'Blend is purpose-built for community bank digital onboarding. The 4-6 month timeline means you can be live with same-day accounts before neobank churn accelerates further. The 300+ bank reference pool at your scale eliminates implementation risk.',
      negotiation: 'Request outcome-based pricing tied to digital adoption rate improvement, not go-live. Demand references from 3 banks with similar asset size and current adoption rate.',
    },
  ],
  apexretail: [
    {
      id: 'einstein', name: 'Einstein AI Optimization', status: 'URGENT',
      deadline: '$248M in idle licensed capability', initiativeType: 'personalization-ai',
      context: 'Salesforce Einstein purchased in the SFCC license. Never activated. 18 million loyalty members receiving identical experiences while competitors personalize in real time. $248M personalization revenue gap.',
      vendors: [
        { id: 'einstein-activate', name: 'Einstein Activation (Salesforce PS)', score: 93, outcomeRate: 0.90, referenceMatch: 91, cost: '$400K–700K one-time', timeline: '6 weeks', failureRisk: 'LOW', recommended: true, tag: 'Already licensed',
          fromData: 'Einstein licensed in SFCC — $0 incremental license cost', fromIndustry: '90% activation success rate · 6-week avg timeline at retail peers', fromGenome: '90% success rate · $2.1M avg Year 1 personalization lift at comparable retailers',
          bullets: ['Already licensed — zero incremental license cost', 'Salesforce PS specialization in SFCC Einstein', 'Nike + Sephora activation playbook at comparable scale', '6-week activation timeline — fastest path to ROI'] },
        { id: 'dynamic-yield', name: 'Dynamic Yield (add-on)', score: 79, outcomeRate: 0.76, referenceMatch: 74, cost: '$1.8–2.6M/yr', timeline: '4–6 mo', failureRisk: 'MEDIUM', recommended: false, tag: 'Best-in-class layer',
          fromData: 'Additional cost on top of idle Einstein license', fromIndustry: 'Dynamic Yield strong for A/B testing and personalization', fromGenome: '76% success rate · Redundant with Einstein capabilities in 60% of use cases',
          bullets: ['Best-in-class personalization platform', 'Redundant with already-licensed Einstein capabilities', 'Additional $2M/yr cost before Einstein is even activated', 'Only relevant if Einstein activation underperforms'] },
      ],
      recommendation: 'Activate Einstein first. The license is already paid for. $400K activation cost against $248M idle value is a 620:1 ROI ratio. Dynamic Yield becomes relevant only if Einstein underperforms — which Genome data suggests happens in <10% of SFCC deployments.',
      negotiation: 'Salesforce PS will want to upsell services. Negotiate a fixed-fee 6-week activation with milestone-based payment: 50% on kick-off, 50% on go-live. Require named lead with prior SFCC Einstein experience.',
    },
    {
      id: 'inventory', name: 'Inventory Forecasting AI', status: 'HIGH',
      deadline: '4.2x turns vs 6.8x benchmark · $180M trapped', initiativeType: 'supply-chain-ai',
      context: 'Inventory turns at 4.2x vs 6.8x benchmark. $180M excess inventory. o9 demand forecasting 40% implemented after 18 months. Finish what was started or replace.',
      vendors: [
        { id: 'o9-complete', name: 'Complete o9 Implementation', score: 88, outcomeRate: 0.85, referenceMatch: 87, cost: '$2.4–3.6M remaining', timeline: '9–12 mo', failureRisk: 'LOW', recommended: true, tag: 'Finish what you started',
          fromData: 'o9 at 40% after 18 months · $6.8M already invested', fromIndustry: '85% success rate for o9 completion engagements vs restart', fromGenome: 'Completion faster than restart in 92% of cases · Avg 9 months to full value',
          bullets: ['$6.8M already invested — completion is faster than restart', '85% success rate for completion vs 58% for platform restart', 'o9 Retail SI already embedded — no knowledge transfer loss', 'Avg 9 months to 85%+ implementation at comparable retailers'] },
        { id: 'blue-yonder', name: 'Blue Yonder (replace o9)', score: 74, outcomeRate: 0.70, referenceMatch: 68, cost: '$8–14M (full restart)', timeline: '18–24 mo', failureRisk: 'HIGH', recommended: false, tag: 'Platform replacement',
          fromData: 'Would require abandoning $6.8M o9 investment', fromIndustry: 'Blue Yonder strong for $10B+ retailers · Better for complex global supply chains', fromGenome: '70% success rate · Average overrun 7 months · Restart after 40% implementation fails in 38% of cases',
          bullets: ['Stronger platform for complex multi-region supply chains', 'Requires abandoning $6.8M o9 investment', '18–24 month timeline vs 9 months to complete o9', 'Restart failure rate 38% when replacing at 40% implementation'] },
      ],
      recommendation: 'Complete the o9 implementation. The $6.8M already invested has built institutional knowledge. Completion success rate (85%) is significantly higher than restart (58%). The 9-month path to full value is faster and lower risk than an 18-month Blue Yonder restart.',
      negotiation: 'Use the existing o9 contract leverage — you are at 40% with $180M outcome at stake. Demand a fixed-fee completion contract with milestone payments tied to inventory turn improvement, not go-live date.',
    },
    {
      id: 'supply-chain', name: 'Supply Chain Orchestration', status: 'HIGH',
      deadline: 'SAP ECC support ends 2027 — 8,400 customizations', initiativeType: 'supply-chain-modernization',
      context: '8,400 SAP ECC customizations blocking data flow. SAP ECC support ends 2027. Supply chain orchestration tools require clean data. This is the foundational decision.',
      vendors: [
        { id: 'sap-s4', name: 'SAP S/4HANA Migration', score: 84, outcomeRate: 0.79, referenceMatch: 81, cost: '$22–38M', timeline: '24–36 mo', failureRisk: 'MEDIUM', recommended: true, tag: 'Unavoidable — start now',
          fromData: '8,400 customizations to rationalize · EOS 2027 forces decision', fromIndustry: 'SAP S/4 migration avg $28M at comparable retail scale · 79% success rate', fromGenome: '79% success rate · Customization rationalization is the #1 success factor',
          bullets: ['SAP ECC support ends 2027 — not optional', 'S/4HANA enables real-time AI supply chain analytics', '8,400 customizations must be rationalized regardless of platform', 'Start now to avoid forced migration under time pressure in 2026'] },
        { id: 'manhattan', name: 'Manhattan Active Supply Chain', score: 77, outcomeRate: 0.73, referenceMatch: 71, cost: '$15–24M + SAP costs', timeline: '18–30 mo', failureRisk: 'HIGH', recommended: false, tag: 'Supply chain-only layer',
          fromData: 'Does not resolve SAP ECC migration requirement', fromIndustry: 'Manhattan strong for warehouse management · Does not replace ERP', fromGenome: '73% success rate · SAP migration still required in addition',
          bullets: ['Best-in-class warehouse and supply chain execution', 'Does not resolve the SAP ECC 2027 migration requirement', 'Additional cost layer on top of SAP migration', 'Two concurrent programs at this scale has 48% overrun rate'] },
      ],
      recommendation: 'Begin SAP S/4HANA planning now. The 2027 ECC support end date is not negotiable. Every month of delay reduces the time available for customization rationalization, which is the primary success factor. This is a forced decision — the only variable is how well-prepared you are.',
      negotiation: 'Engage 2–3 SAP-certified SIs for competitive RFP. Negotiate the customization rationalization as a separate fixed-fee discovery phase before committing to full program scope and price.',
    },
    {
      id: 'customer-ai', name: 'Customer AI Personalization', status: 'MEDIUM',
      deadline: 'Conversion 2.3% vs 3.8% benchmark · $840M opportunity', initiativeType: 'customer-ai',
      context: '72% cart abandonment vs 58% benchmark. Segment and Klaviyo infrastructure exists but is not connected. Churn model validated in Databricks — not deployed. Cart recovery triggers ready to activate.',
      vendors: [
        { id: 'klaviyo-activate', name: 'Klaviyo + Segment Integration', score: 92, outcomeRate: 0.89, referenceMatch: 90, cost: '$240K–400K activation', timeline: '8–12 weeks', failureRisk: 'LOW', recommended: true, tag: 'Infrastructure already paid',
          fromData: 'Segment + Klaviyo both licensed · Databricks churn model built', fromIndustry: '$840M cart recovery opportunity · 8-week avg activation at retail peers', fromGenome: '89% success rate · $168M avg Year 1 cart recovery at 18M loyalty member scale',
          bullets: ['Segment + Klaviyo already licensed and paid for', 'Churn model validated in Databricks — deploy it', 'Cart recovery triggers: 8-week activation timeline', '$168M avg Year 1 recovery at comparable loyalty program scale'] },
        { id: 'braze', name: 'Braze (add customer engagement layer)', score: 80, outcomeRate: 0.77, referenceMatch: 76, cost: '$2.4–3.6M/yr', timeline: '4–6 mo', failureRisk: 'MEDIUM', recommended: false, tag: 'Additional platform',
          fromData: 'Adds cost before existing Klaviyo infrastructure is activated', fromIndustry: 'Braze strong for enterprise omnichannel · Redundant with Klaviyo at this stage', fromGenome: '77% success rate · Klaviyo activation recommended first in 84% of comparable cases',
          bullets: ['Enterprise customer engagement platform', 'Redundant with Klaviyo until Klaviyo is fully activated', 'Activate Klaviyo first — adds $0 incremental license cost', 'Braze becomes relevant if Klaviyo proves insufficient at scale'] },
      ],
      recommendation: 'Activate Klaviyo + Segment first. The infrastructure is licensed and paid for. The churn model is built. The cart recovery triggers are designed. This is an execution problem, not a technology problem — activate what you have before buying more.',
      negotiation: 'Klaviyo + Segment are month-to-month at this stage. Negotiate long-term commitments only after cart recovery results are confirmed in production. Use the first 90 days as validation before any multi-year lock-in.',
    },
  ],
}

// ── Current vendor portfolios for Optimize mode ───────────────────────────────
type CurrentVendor = {
  id: string
  name: string
  category: string
  annualSpend: number
  contractEnd: string
  contractedUptime: number
  actualUptime: number
  marketRate: number
  isRenewing: boolean
  penaltyPerHour: number
}

const CURRENT_VENDORS: Record<ClientId, CurrentVendor[]> = {
  meridian: [
    { id: 'ensemble', name: 'Ensemble Health Partners', category: 'RCM', annualSpend: 4_200_000, contractEnd: 'Dec 2027', contractedUptime: 99.5, actualUptime: 97.1, marketRate: 3_600_000, isRenewing: false, penaltyPerHour: 5_000 },
    { id: 'epic', name: 'Epic Systems', category: 'EHR', annualSpend: 8_400_000, contractEnd: 'Q4 2025', contractedUptime: 99.9, actualUptime: 99.9, marketRate: 7_100_000, isRenewing: true, penaltyPerHour: 8_000 },
    { id: 'azure', name: 'Microsoft Azure', category: 'Cloud', annualSpend: 6_200_000, contractEnd: 'Oct 2025', contractedUptime: 99.9, actualUptime: 99.7, marketRate: 5_400_000, isRenewing: true, penaltyPerHour: 3_500 },
    { id: 'nuance', name: 'Nuance (Dragon)', category: 'Clinical Documentation', annualSpend: 2_800_000, contractEnd: 'Mar 2026', contractedUptime: 99.0, actualUptime: 98.4, marketRate: 2_800_000, isRenewing: false, penaltyPerHour: 2_000 },
    { id: 'kronos', name: 'Kronos (UKG)', category: 'Workforce Management', annualSpend: 1_400_000, contractEnd: 'Jun 2026', contractedUptime: 99.5, actualUptime: 99.6, marketRate: 1_200_000, isRenewing: false, penaltyPerHour: 1_200 },
  ],
  firstcapital: [
    { id: 'fis', name: 'FIS HORIZON', category: 'Core Banking', annualSpend: 3_800_000, contractEnd: 'Dec 2026', contractedUptime: 99.9, actualUptime: 99.8, marketRate: 3_200_000, isRenewing: true, penaltyPerHour: 6_000 },
    { id: 'actimize', name: 'NICE Actimize', category: 'AML / Fraud', annualSpend: 1_200_000, contractEnd: 'Sep 2026', contractedUptime: 99.5, actualUptime: 99.1, marketRate: 1_100_000, isRenewing: false, penaltyPerHour: 2_500 },
    { id: 'salesforce-fc', name: 'Salesforce CRM', category: 'CRM', annualSpend: 2_100_000, contractEnd: 'Jan 2027', contractedUptime: 99.9, actualUptime: 99.9, marketRate: 1_800_000, isRenewing: false, penaltyPerHour: 1_800 },
    { id: 'fiserv', name: 'Fiserv', category: 'Payments', annualSpend: 1_600_000, contractEnd: 'Aug 2026', contractedUptime: 99.8, actualUptime: 97.9, marketRate: 1_400_000, isRenewing: false, penaltyPerHour: 3_000 },
  ],
  apexretail: [
    { id: 'sap', name: 'SAP ECC', category: 'ERP', annualSpend: 9_200_000, contractEnd: 'Dec 2026', contractedUptime: 99.9, actualUptime: 99.7, marketRate: 8_400_000, isRenewing: true, penaltyPerHour: 10_000 },
    { id: 'salesforce-ax', name: 'Salesforce Commerce', category: 'eCommerce', annualSpend: 4_800_000, contractEnd: 'Feb 2027', contractedUptime: 99.9, actualUptime: 99.8, marketRate: 4_200_000, isRenewing: false, penaltyPerHour: 5_000 },
    { id: 'o9-ax', name: 'o9 Solutions', category: 'Demand Forecasting', annualSpend: 2_400_000, contractEnd: 'Nov 2026', contractedUptime: 99.5, actualUptime: 98.8, marketRate: 2_400_000, isRenewing: false, penaltyPerHour: 2_000 },
    { id: 'databricks-ax', name: 'Databricks', category: 'Data Platform', annualSpend: 3_200_000, contractEnd: 'Mar 2027', contractedUptime: 99.9, actualUptime: 99.9, marketRate: 2_800_000, isRenewing: false, penaltyPerHour: 4_000 },
  ],
}

function fmt$(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return '$' + Math.round(n / 1_000) + 'K'
  return '$' + n
}

function slaCredit(v: CurrentVendor): number {
  if (v.actualUptime >= v.contractedUptime) return 0
  const breachPp = v.contractedUptime - v.actualUptime
  const hoursPerMonth = (breachPp / 100) * 720
  return Math.round(hoursPerMonth * v.penaltyPerHour * 12)
}

// ── Failure genome patterns ────────────────────────────────────────────────────
const GENOME_PATTERNS: Record<string, { name: string; desc: string; mitigation: string }> = {
  'cdo-vacancy':    { name: 'CDO Vacancy Risk', desc: 'No executive AI owner at contract time correlates with 73% program failure.', mitigation: 'Hire or appoint interim CDO before vendor contract signing.' },
  'scope-creep':    { name: 'Scope Expansion Trap', desc: 'Vendors expand scope after initial win in 44% of cases, adding 30–60% cost.', mitigation: 'Fixed-scope contract with change order process requiring CFO approval.' },
  'integration-lag':{ name: 'Integration Lag', desc: 'API/middleware delays extend timelines 4.8 months on average.', mitigation: 'Integration lead named and committed before kick-off. Middleware scope in SOW.' },
  'change-mgmt':    { name: 'Change Management Gap', desc: 'Physician/staff adoption failure causes 38% of clinical AI programs to stall.', mitigation: 'Change management budget = 15% of implementation budget minimum.' },
  'data-readiness': { name: 'Data Readiness Overconfidence', desc: 'Client data quality issues discovered post-contract in 51% of AI deployments.', mitigation: 'Data readiness sprint before vendor selection. Sign-off on data quality baseline.' },
}

// ── Page component ─────────────────────────────────────────────────────────────
function SelectContent() {
  const searchParams = useSearchParams()
  const urlClient = (searchParams.get('client') || 'meridian') as ClientId
  const urlDecision = searchParams.get('decision') || null

  const [client, setClient] = useState<ClientId>(urlClient)
  const [mode, setMode] = useState<Mode>('select')
  const [step, setStep] = useState<number>(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(urlDecision || DECISIONS[urlClient][0]?.id || null)
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [leverageChecked, setLeverageChecked] = useState<Set<string>>(new Set())

  const meta = CLIENT_META[client]
  const decisions = DECISIONS[client]
  const decision = decisions.find(d => d.id === selectedDecisionId) || decisions[0]
  const vendors = decision.vendors
  const selectedVendor = vendors.find(v => v.id === selectedVendorId) || vendors[0]
  const currentVendors = CURRENT_VENDORS[client]
  const totalSpend = currentVendors.reduce((s, v) => s + v.annualSpend, 0)
  const totalCredits = currentVendors.reduce((s, v) => s + slaCredit(v), 0)
  const renewingCount = currentVendors.filter(v => v.isRenewing).length

  function handleClientChange(id: string) {
    const newClient = id as ClientId
    setClient(newClient)
    const newDecisions = DECISIONS[newClient]
    setSelectedDecisionId(newDecisions[0]?.id || null)
    setSelectedVendorId(null)
    setStep(1)
    setCompletedSteps(new Set())
  }

  function advanceStep() {
    setCompletedSteps(prev => new Set([...prev, step]))
    setStep(s => Math.min(s + 1, 6))
  }

  const SELECT_STEPS = ['Define Need', 'Score Landscape', 'Shortlist', 'References', 'Negotiate', 'Contract']

  const statusColor = (s: string) => s === 'URGENT' ? T.red : s === 'HIGH' ? T.amber : T.teal
  const riskColor = (r: string) => r === 'HIGH' ? T.red : r === 'MEDIUM' ? T.amber : T.green

  return (
    <PageShell activePage="select" clientId={client}>

      {/* Product header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, fontFamily: T.mono, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
                🔍 VENDOR INTELLIGENCE
              </div>
              <div style={{ fontSize: '22px', fontWeight: 500, color: T.text, fontFamily: T.serif, marginBottom: '10px' }}>
                &quot;Which vendor should we choose — and are we getting value from what we already have?&quot;
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Open Decisions', value: String(decisions.length) },
                  { label: 'Current Vendors', value: String(currentVendors.length) },
                  { label: 'SLA Credits Unclaimed', value: totalCredits > 0 ? fmt$(totalCredits) : '$0' },
                  { label: 'Annual Spend', value: fmt$(totalSpend) },
                ].map((m, i) => (
                  <div key={i} style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>{m.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: T.text, fontFamily: T.serif }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: '4px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '4px' }}>
              {(['select', 'optimize'] as Mode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  style={{ padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: T.sans, background: mode === m ? T.teal : 'transparent', color: mode === m ? T.bg : T.secondary }}>
                  {m === 'select' ? 'Select a Vendor' : 'Optimize Current'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SLA credit alert */}
      {totalCredits > 0 && mode === 'optimize' && (
        <div style={{ background: `${T.amber}15`, borderBottom: `1px solid ${T.amber}30`, padding: '10px 40px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', fontSize: '13px', color: T.amber, fontWeight: 600 }}>
            ⚠ {fmt$(totalCredits)} in SLA credits detected across {currentVendors.filter(v => slaCredit(v) > 0).length} vendors — not yet claimed
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 40px' }}>

        {/* ── MODE 1: SELECT ────────────────────────────────────────────────── */}
        {mode === 'select' && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>

            {/* Left: decision list */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden', position: 'sticky', top: '16px' }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, fontFamily: T.mono, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>Open Decisions</div>
                <div style={{ fontSize: '12px', color: T.secondary }}>{meta.name}</div>
              </div>
              {(['URGENT', 'HIGH', 'MEDIUM'] as const).map(status => {
                const statusDecisions = decisions.filter(d => d.status === status)
                if (!statusDecisions.length) return null
                return (
                  <div key={status}>
                    <div style={{ padding: '8px 16px 4px', fontSize: '9px', fontWeight: 700, color: statusColor(status), fontFamily: T.mono, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{status}</div>
                    {statusDecisions.map(d => (
                      <button key={d.id} onClick={() => { setSelectedDecisionId(d.id); setSelectedVendorId(null); setStep(1); setCompletedSteps(new Set()) }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', background: selectedDecisionId === d.id ? `${T.teal}10` : 'transparent', border: 'none', borderLeft: `3px solid ${selectedDecisionId === d.id ? T.teal : 'transparent'}`, cursor: 'pointer', fontFamily: T.sans }}>
                        <div style={{ fontSize: '12px', fontWeight: selectedDecisionId === d.id ? 600 : 400, color: selectedDecisionId === d.id ? T.teal : T.text, marginBottom: '1px', lineHeight: 1.3 }}>{d.name}</div>
                        <div style={{ fontSize: '10px', color: T.secondary }}>{d.deadline}</div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Right: step-by-step workflow */}
            <div>
              {/* Step navigator */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '0 8px', marginBottom: '24px', display: 'flex', overflowX: 'auto' }}>
                {SELECT_STEPS.map((label, i) => {
                  const n = i + 1
                  const active = step === n
                  const done = completedSteps.has(n)
                  return (
                    <button key={n} onClick={() => { if (n <= step || done) { setCompletedSteps(prev => new Set([...prev, step])); setStep(n) } }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.sans, whiteSpace: 'nowrap', borderBottom: active ? `2px solid ${T.teal}` : '2px solid transparent' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, fontFamily: T.mono,
                        background: active ? T.teal : done ? `${T.teal}25` : 'transparent',
                        color: active ? T.bg : done ? T.teal : T.text,
                        border: active ? 'none' : done ? `1px solid ${T.teal}50` : `1px solid rgba(239,246,255,0.3)` }}>
                        {done && !active ? '✓' : n}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: active ? 700 : 400, color: active ? T.teal : T.text, opacity: active || done ? 1 : 0.7 }}>{label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Decision context */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: T.mono, padding: '3px 8px', borderRadius: '4px', background: `${statusColor(decision.status)}20`, color: statusColor(decision.status), textTransform: 'uppercase', letterSpacing: '0.08em' }}>{decision.status}</span>
                  <span style={{ fontSize: '11px', color: T.secondary }}>{decision.deadline}</span>
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: T.text, marginBottom: '6px' }}>{decision.name}</div>
                <div style={{ fontSize: '13px', color: T.secondary, lineHeight: 1.6 }}>{decision.context}</div>
              </div>

              {/* STEP 1: Define Need */}
              {step === 1 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Step 1 · Define Need</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { label: 'FROM YOUR DATA', color: T.teal, content: vendors[0].fromData },
                      { label: 'FROM INDUSTRY', color: T.amber, content: `${vendors.length} vendors assessed · ${meta.industry} vertical` },
                      { label: 'FROM GENOME', color: T.indigo, content: `${vendors.filter(v => v.outcomeRate >= 0.8).length} of ${vendors.length} vendors hit 80%+ success in comparable profiles` },
                    ].map(s => (
                      <div key={s.label} style={{ padding: '14px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, color: s.color, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{s.label}</div>
                        <div style={{ fontSize: '12px', color: T.secondary, lineHeight: 1.5 }}>{s.content}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: `${T.teal}10`, border: `1px solid ${T.teal}30`, borderRadius: '8px', padding: '14px 18px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Why this decision matters now</div>
                    <div style={{ fontSize: '13px', color: T.text }}>{decision.context}</div>
                  </div>
                </div>
              )}

              {/* STEP 2: Score Landscape */}
              {step === 2 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Step 2 · Score Landscape — {vendors.length} vendors assessed</div>
                  {/* Scatter plot */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: T.secondary, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                      Outcome rate (Genome) vs Implementation complexity ({meta.name} profile)
                    </div>
                    <svg width="100%" viewBox="0 0 480 200" style={{ overflow: 'visible' }}>
                      {/* Grid lines */}
                      {[0, 25, 50, 75, 100].map(p => (
                        <line key={p} x1={40 + p * 3.6} y1={10} x2={40 + p * 3.6} y2={170} stroke={T.border} strokeWidth="1" opacity="0.4" />
                      ))}
                      {[0, 25, 50, 75, 100].map(p => (
                        <line key={p} x1={40} y1={10 + p * 1.6} x2={400} y2={10 + p * 1.6} stroke={T.border} strokeWidth="1" opacity="0.4" />
                      ))}
                      {/* Axis labels */}
                      <text x={220} y={195} textAnchor="middle" fill={T.secondary} fontSize="9" fontFamily="monospace">Implementation complexity →</text>
                      <text x={10} y={90} textAnchor="middle" fill={T.secondary} fontSize="9" fontFamily="monospace" transform="rotate(-90, 10, 90)">Outcome rate →</text>
                      {/* Vendor bubbles */}
                      {vendors.map((v, i) => {
                        const cx = 40 + (100 - v.score + i * 5) * 3.6
                        const cy = 170 - v.outcomeRate * 160
                        const color = v.recommended ? T.teal : v.score >= 80 ? T.indigo : v.score >= 70 ? T.amber : T.secondary
                        return (
                          <g key={v.id}>
                            <circle cx={cx} cy={cy} r={v.referenceMatch / 10 + 6} fill={`${color}30`} stroke={color} strokeWidth="1.5" style={{ cursor: 'pointer' }} />
                            <text x={cx} y={cy - v.referenceMatch / 10 - 10} textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace">{v.name.split(' ')[0]}</text>
                            <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace">{Math.round(v.outcomeRate * 100)}%</text>
                          </g>
                        )
                      })}
                    </svg>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {[{ c: T.teal, l: 'Recommended' }, { c: T.indigo, l: 'Consider' }, { c: T.amber, l: 'Caution' }, { c: T.secondary, l: 'Not recommended' }].map(x => (
                        <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: x.c }} />
                          <span style={{ fontSize: '9px', color: T.secondary, fontFamily: T.mono }}>{x.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Shortlist */}
              {step === 3 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Step 3 · Shortlist — Top {vendors.length} by combined score</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
                    {/* Vendor cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {vendors.map(v => (
                        <div key={v.id} onClick={() => setSelectedVendorId(v.id)}
                          style={{ background: T.surface, border: `1px solid ${selectedVendorId === v.id ? T.teal : T.border}`, borderRadius: '10px', padding: '18px', cursor: 'pointer', position: 'relative' }}>
                          {v.recommended && (
                            <div style={{ position: 'absolute', top: '-1px', right: '14px', background: T.teal, color: T.bg, fontSize: '9px', fontWeight: 700, fontFamily: T.mono, padding: '3px 10px', borderRadius: '0 0 8px 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>RECOMMENDED</div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', marginTop: v.recommended ? '8px' : 0 }}>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: T.text, marginBottom: '2px' }}>{v.name}</div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{v.tag}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: T.mono, padding: '3px 8px', borderRadius: '4px', background: `${riskColor(v.failureRisk)}20`, color: riskColor(v.failureRisk), textTransform: 'uppercase', letterSpacing: '0.06em' }}>{v.failureRisk} RISK</span>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: T.teal, fontFamily: T.serif }}>{v.score}</div>
                                <div style={{ fontSize: '8px', color: T.secondary, fontFamily: T.mono }}>/ 100</div>
                              </div>
                            </div>
                          </div>
                          {/* Three-source attribution */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                            {[
                              { label: 'FROM YOUR DATA', text: v.fromData, color: T.teal },
                              { label: 'FROM INDUSTRY', text: v.fromIndustry, color: T.amber },
                              { label: 'FROM GENOME', text: v.fromGenome, color: T.indigo },
                            ].map(s => (
                              <div key={s.label} style={{ padding: '8px', background: T.bg, borderRadius: '6px', border: `1px solid ${T.border}` }}>
                                <div style={{ fontSize: '8px', fontWeight: 700, color: s.color, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{s.label}</div>
                                <div style={{ fontSize: '10px', color: T.secondary, lineHeight: 1.4 }}>{s.text}</div>
                              </div>
                            ))}
                          </div>
                          {v.bullets.map((b, bi) => (
                            <div key={bi} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                              <span style={{ color: v.recommended ? T.teal : T.secondary, flexShrink: 0 }}>·</span>
                              <span style={{ fontSize: '12px', color: T.secondary, lineHeight: 1.4 }}>{b}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: '16px', marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${T.border}` }}>
                            <div>
                              <div style={{ fontSize: '9px', color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>COST</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: T.text }}>{v.cost}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '9px', color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>TIMELINE</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: T.text }}>{v.timeline}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '9px', color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>OUTCOME RATE</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: T.green }}>{Math.round(v.outcomeRate * 100)}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Right: recommendation + failure genome */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ background: `${T.teal}10`, border: `1px solid ${T.teal}30`, borderRadius: '10px', padding: '16px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>AbarVa Recommendation</div>
                        <div style={{ fontSize: '13px', color: T.text, lineHeight: 1.6 }}>{decision.recommendation}</div>
                      </div>
                      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: '9px', fontWeight: 700, color: T.red, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Failure Genome · {selectedVendor.name}</div>
                        </div>
                        {Object.entries(GENOME_PATTERNS).slice(0, 4).map(([key, p]) => {
                          const present = selectedVendor.fromGenome.toLowerCase().includes(key.replace('-', ' ').split('-')[0])
                          return (
                            <div key={key} style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: T.text }}>{p.name}</span>
                                <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: T.mono, padding: '2px 6px', borderRadius: '3px', background: present ? `${T.red}20` : `${T.teal}15`, color: present ? T.red : T.teal, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                  {present ? 'PRESENT' : 'LOW'}
                                </span>
                              </div>
                              <div style={{ fontSize: '10px', color: T.secondary, lineHeight: 1.4 }}>{p.mitigation}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: References */}
              {step === 4 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Step 4 · References — organizations similar to {meta.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {vendors.map((v, vi) => (
                      <div key={v.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: v.recommended ? T.teal : T.text }}>{v.name}</div>
                          <div style={{ fontSize: '11px', color: T.secondary, fontFamily: T.mono }}>{v.referenceMatch}% profile match</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                          {[
                            { org: vi === 0 ? '$8.2B health system, Midwest' : '$4.1B ' + meta.industry + ' organization, Southeast', from: 'Baseline: similar starting point', to: 'Outcome: ' + Math.round(v.outcomeRate * 100) + '% program success', timeline: '7–11 months', savings: v.cost },
                            { org: vi === 0 ? '$12.8B integrated delivery network' : '$6.2B regional ' + meta.industry + ' organization', from: 'Starting point: comparable complexity', to: 'Result: full deployment in scope', timeline: '9–13 months', savings: 'within budget range' },
                          ].map((ref, ri) => (
                            <div key={ri} style={{ padding: '12px', background: T.bg, borderRadius: '8px', border: `1px solid ${T.border}` }}>
                              <div style={{ fontSize: '11px', fontWeight: 600, color: T.text, marginBottom: '6px' }}>{ref.org}</div>
                              <div style={{ fontSize: '10px', color: T.secondary, marginBottom: '2px' }}>{ref.from}</div>
                              <div style={{ fontSize: '10px', color: T.green, marginBottom: '6px' }}>{ref.to}</div>
                              <div style={{ fontSize: '9px', color: T.secondary, fontFamily: T.mono }}>{ref.timeline} · {ref.savings}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: Negotiate */}
              {step === 5 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Step 5 · Negotiate — {selectedVendor.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Price benchmark */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '18px' }}>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Price Benchmark · {selectedVendor.name}</div>
                      {[
                        { label: 'Your estimate', pct: 60, val: selectedVendor.cost, color: T.text },
                        { label: '25th percentile', pct: 30, val: 'Target', color: T.green },
                        { label: 'Market median', pct: 50, val: 'Median', color: T.amber },
                        { label: '75th percentile', pct: 80, val: 'Walk-away', color: T.red },
                      ].map(b => (
                        <div key={b.label} style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                            <span style={{ color: T.secondary }}>{b.label}</span>
                            <span style={{ color: b.color, fontFamily: T.mono, fontWeight: 600 }}>{b.val}</span>
                          </div>
                          <div style={{ height: '6px', background: T.border, borderRadius: '3px' }}>
                            <div style={{ height: '100%', width: `${b.pct}%`, background: b.color, borderRadius: '3px', transition: 'width 600ms ease' }} />
                          </div>
                        </div>
                      ))}
                      <div style={{ fontSize: '11px', color: T.secondary, marginTop: '8px', lineHeight: 1.5 }}>Negotiate to 25th percentile: saves 20–35% vs list price</div>
                    </div>
                    {/* Leverage checklist */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '18px' }}>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Leverage Points</div>
                      {[
                        { id: 'multi-year', label: '3-year commitment → 15–20% reduction' },
                        { id: 'reference', label: 'Reference client permission → $50–100K reduction' },
                        { id: 'pilot-first', label: 'Pilot-first structure → vendor will agree' },
                        { id: 'q4-timing', label: 'Q4 signature timing → 8–12% quota pressure' },
                        { id: 'competing', label: 'Competing vendor shortlisted → creates urgency' },
                      ].map(lev => (
                        <label key={lev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={leverageChecked.has(lev.id)} onChange={() => {
                            const next = new Set(leverageChecked)
                            next.has(lev.id) ? next.delete(lev.id) : next.add(lev.id)
                            setLeverageChecked(next)
                          }} style={{ marginTop: '2px', accentColor: T.teal }} />
                          <span style={{ fontSize: '12px', color: T.secondary }}>{lev.label}</span>
                        </label>
                      ))}
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: '11px', color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Negotiation Note</div>
                        <div style={{ fontSize: '12px', color: T.secondary, lineHeight: 1.5 }}>{decision.negotiation}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Contract */}
              {step === 6 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Step 6 · Contract — Required clauses for {meta.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {[
                      { n: 1, title: 'Data Ownership', text: 'All data, models, outputs remain Client property. Vendor has no right to use client data for training third-party models.', required: true },
                      { n: 2, title: 'Exit Rights', text: '90-day termination for convenience. Full data export within 30 days of notice. No data held hostage.', required: true },
                      { n: 3, title: 'SLA Definition', text: `99.5% monthly uptime, measured independently. $X per hour below SLA, credited automatically — not on request.`, required: true },
                      { n: 4, title: 'Outcome Clause', text: 'Minimum 20% of fees at risk tied to measurable outcome metrics agreed at contract signature.', required: true },
                      ...(meta.vertical === 'Healthcare' ? [
                        { n: 5, title: 'HIPAA BAA', text: 'Business Associate Agreement signed before any PHI access. No exceptions.', required: true },
                        { n: 6, title: 'Breach Notification', text: '24-hour notification of suspected PHI breach to designated Privacy Officer.', required: true },
                        { n: 7, title: 'Audit Rights', text: 'Annual HIPAA compliance audit at Vendor expense. Right to inspect sub-processors.', required: true },
                      ] : meta.vertical === 'FinServ' ? [
                        { n: 5, title: 'SOC 2 Type II', text: 'Current SOC 2 Type II report required before data access. Annual re-certification required.', required: true },
                        { n: 6, title: 'Regulatory Reporting', text: 'Vendor cooperates with OCC/FDIC examination requests within 5 business days.', required: true },
                      ] : []),
                    ].map(c => (
                      <div key={c.n} style={{ display: 'flex', gap: '14px', padding: '14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${T.teal}20`, border: `1px solid ${T.teal}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', fontWeight: 800, color: T.teal, fontFamily: T.mono }}>
                          {c.n}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '4px' }}>{c.title}</div>
                          <div style={{ fontSize: '12px', color: T.secondary, lineHeight: 1.5 }}>{c.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: `${T.teal}10`, border: `1px solid ${T.teal}30`, borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Ready to Proceed</div>
                    <div style={{ fontSize: '14px', color: T.text, marginBottom: '12px' }}>Vendor selection complete for {decision.name}</div>
                    <a href={`/outcomes?client=${client}`} style={{ display: 'inline-block', padding: '10px 24px', background: T.teal, color: T.bg, borderRadius: '8px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', fontFamily: T.sans }}>
                      Track Outcomes →
                    </a>
                  </div>
                </div>
              )}

              {/* Advance button */}
              {step < 6 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button onClick={advanceStep}
                    style={{ padding: '10px 24px', background: T.teal, color: T.bg, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: T.sans }}>
                    {step === 5 ? 'Review Contract →' : `Next: ${SELECT_STEPS[step]} →`}
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── MODE 2: OPTIMIZE CURRENT ──────────────────────────────────────── */}
        {mode === 'optimize' && (
          <div>
            {/* Portfolio summary tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
              {[
                { label: 'Annual Vendor Spend', value: fmt$(totalSpend), color: T.text },
                { label: 'SLA Credits Unclaimed', value: totalCredits > 0 ? fmt$(totalCredits) : '$0', color: totalCredits > 0 ? T.amber : T.teal },
                { label: 'Renewing in 90 Days', value: String(renewingCount), color: renewingCount > 0 ? T.amber : T.teal },
                { label: 'Vendors at Risk', value: String(currentVendors.filter(v => slaCredit(v) > 0).length), color: currentVendors.filter(v => slaCredit(v) > 0).length > 0 ? T.red : T.teal },
              ].map((m, i) => (
                <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{m.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: m.color, fontFamily: T.serif }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Vendor rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentVendors.map(v => {
                const credit = slaCredit(v)
                const slaOk = v.actualUptime >= v.contractedUptime
                const overpaying = v.annualSpend > v.marketRate * 1.1
                return (
                  <div key={v.id} style={{ background: T.surface, border: `1px solid ${credit > 0 || overpaying ? T.amber : T.border}`, borderRadius: '10px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: T.text, marginBottom: '2px' }}>{v.name}</div>
                        <div style={{ fontSize: '11px', color: T.secondary }}>{v.category} · Contract ends {v.contractEnd} {v.isRenewing && <span style={{ color: T.amber, fontWeight: 600 }}>· Renewing soon</span>}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: T.text, fontFamily: T.serif }}>{fmt$(v.annualSpend)}/yr</div>
                        {overpaying && <div style={{ fontSize: '10px', color: T.amber, fontFamily: T.mono }}>Market rate: {fmt$(v.marketRate)}</div>}
                      </div>
                    </div>

                    {/* SLA bars */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: credit > 0 ? '12px' : 0 }}>
                      {[
                        { label: 'Uptime SLA', actual: v.actualUptime, contracted: v.contractedUptime, unit: '%' },
                      ].map(sla => {
                        const ok = sla.actual >= sla.contracted
                        const barW = Math.min((sla.actual / sla.contracted) * 100, 100)
                        return (
                          <div key={sla.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                              <span style={{ color: T.secondary, fontFamily: T.mono }}>{sla.label}</span>
                              <span style={{ color: ok ? T.teal : T.red, fontFamily: T.mono, fontWeight: 700 }}>{sla.actual}% / {sla.contracted}% contracted {ok ? '✓' : '✗'}</span>
                            </div>
                            <div style={{ height: '6px', background: T.border, borderRadius: '3px' }}>
                              <div style={{ height: '100%', width: `${barW}%`, background: ok ? T.teal : T.red, borderRadius: '3px', transition: 'width 600ms ease' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Credit alert */}
                    {credit > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: `${T.amber}10`, border: `1px solid ${T.amber}30`, borderRadius: '6px' }}>
                        <div style={{ fontSize: '12px', color: T.amber }}>{fmt$(credit)} in SLA credits owed — not yet claimed</div>
                        <button style={{ padding: '5px 12px', background: T.amber, color: T.bg, border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: T.sans }}>Generate claim →</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </PageShell>
  )
}

export default function SelectPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#060A12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', color: '#94A3B8' }}>Loading...</div>}>
      <SelectContent />
    </Suspense>
  )
}

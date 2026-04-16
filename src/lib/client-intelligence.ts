// ── Client Intelligence Data Library ─────────────────────────────────────────
// Single source of truth for all 3 client datasets used across:
//   /intelligence  — Intelligence Brief page
//   /ai-unlock     — AI Unlock opportunities page

export type ClientId = 'meridian' | 'arcturus' | 'apexretail'

export interface OrgNode { id: string; label: string; role: string; x: number; y: number }
export interface MixSlice { name: string; value: number; fill: string }

export interface Executive {
  name: string; title: string; tenure: string
  background: string; priority: string
  quote: string; source: string
}

export interface Priority {
  num: string; title: string; desc: string
  status: 'ACTIVE' | 'AT RISK' | 'PLANNED'
  risk: 'critical' | 'high' | 'medium'
  signal: string
}

export interface Contradiction {
  topic: string; reported: string; actual: string
  gap: string; reportedBy: string; source: string
}

export interface Benchmark {
  label: string
  clientVal: number; peerVal: number
  unit: string; unitPrefix?: string
  worse: boolean; source: string; note: string
}

export interface GenomePattern {
  id: string; label: string
  failRate: number; engagements: number
  desc: string; signal: string
  severity: 'critical' | 'high'
}

export interface AIOpportunity {
  title: string
  useCase: string
  metric: string
  potential: string
  dataReq: string
  timeframe: '0–6 months' | '6–12 months' | '12–24 months'
  status: 'Achievable Now' | 'Achievable in 12mo' | 'Strategic (24mo+)'
}

export interface ClientIntelligence {
  id: ClientId
  name: string
  vertical: string
  tagline: string
  totalExposure: string
  company: {
    stats: { label: string; value: string }[]
    orgNodes: OrgNode[]
    orgLines: [string, string][]
    mixData: MixSlice[]
    mixLabel: string
    strategy: string[]
    industryContext: string
    pressures: { label: string; detail: string }[]
  }
  leadership: Executive[]
  priorities: Priority[]
  contradictions: Contradiction[]
  benchmarks: Benchmark[]
  genome: GenomePattern[]
  aiUnlock: {
    narrative: string
    totalValue: string
    dataReadiness: number
    frontOffice: { label: string; items: AIOpportunity[] }
    middleOffice: { label: string; items: AIOpportunity[] }
    backOffice:   { label: string; items: AIOpportunity[] }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MERIDIAN HEALTH SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
const MERIDIAN: ClientIntelligence = {
  id: 'meridian',
  name: 'Meridian Health System',
  vertical: 'Healthcare',
  tagline: 'A $4.2B regional health system at a critical inflection point. Epic go-live in Q3 2026, a claim denial rate 50% above benchmark, and an AI mandate with no verified path to execution.',
  totalExposure: '$224M',
  company: {
    stats: [
      { label: 'Annual Revenue', value: '$4.2B' },
      { label: 'Employees',      value: '28,000' },
      { label: 'Facilities',     value: '47' },
      { label: 'Founded',        value: '1987' },
      { label: 'HQ',             value: 'Chicago, IL' },
      { label: 'Epic Go-Live',   value: 'Q3 2026' },
    ],
    orgNodes: [
      { id: 'ceo', label: 'Dr. S. Chen',  role: 'CEO', x: 280, y: 20  },
      { id: 'cfo', label: 'M. Torres',    role: 'CFO', x: 60,  y: 110 },
      { id: 'cmo', label: 'Dr. J. Park',  role: 'CMO', x: 200, y: 110 },
      { id: 'coo', label: 'R. Anand',     role: 'COO', x: 340, y: 110 },
      { id: 'cio', label: 'L. Marsh',     role: 'CIO', x: 480, y: 110 },
      { id: 'cno', label: 'Dr. P. Obi',   role: 'CNO', x: 130, y: 200 },
      { id: 'cso', label: 'D. Kim',       role: 'CSO', x: 410, y: 200 },
    ],
    orgLines: [['ceo','cfo'],['ceo','cmo'],['ceo','coo'],['ceo','cio'],['cmo','cno'],['coo','cso']],
    mixData: [
      { name: 'Medicare',    value: 38, fill: '#2DD4C8' },
      { name: 'Medicaid',    value: 22, fill: '#60A5FA' },
      { name: 'Commercial',  value: 28, fill: '#A78BFA' },
      { name: 'Self-pay',    value: 12, fill: '#E2E1DC' },
    ],
    mixLabel: 'PAYOR MIX',
    strategy: [
      'AI-First Clinical Operations — embed AI across all 47 facilities by 2027',
      'Revenue Cycle transformation — consolidate onto Epic, reduce denial rate below 12%',
      'Value-based care — shift 40% of revenue to VBC arrangements by 2027',
      'Workforce modernization — reduce $340M agency spend by $80M through scheduling AI',
    ],
    industryContext: 'Health systems nationally are facing a post-pandemic margin crisis. Labor costs have risen 22% since 2020 while reimbursement rates have grown only 3–4%. The average operating margin for not-for-profit health systems is 1.6% — down from 4.2% in 2019. AI in healthcare is projected to generate $150B in savings annually by 2026 (Accenture), primarily through clinical documentation, prior auth, and revenue cycle automation. Systems that fail to deploy AI at scale before 2027 risk permanent structural cost disadvantage.',
    pressures: [
      { label: 'Reimbursement Squeeze', detail: 'CMS cut inpatient rates 2.8% for FY2026; commercial payer push for VBC contracts accelerating' },
      { label: 'Epic Migration Risk', detail: 'Epic go-lives historically trigger 15–25% denial rate spikes in the 6 months post-conversion' },
      { label: 'Labor Cost Crisis', detail: 'Agency nurse cost $180/hr vs $95 employed; 19% turnover driving perpetual agency dependency' },
      { label: 'AI Mandate Without Foundation', detail: '73% of health system AI projects fail to reach production (NEJM Catalyst 2025)' },
      { label: 'Prior Auth Burden', detail: 'AMA reports 46% of physicians have staff whose sole job is prior authorization management' },
    ],
  },
  leadership: [
    {
      name: 'Dr. Sarah Chen', title: 'Chief Executive Officer', tenure: '3 years',
      background: 'Former McKinsey healthcare partner. Led $1.2B Ascension merger. Academic background in health economics.',
      priority: 'Needs AI to be a visible, public story before the JPMorgan Healthcare Conference in January 2027. Reputation at stake.',
      quote: '"We are not going to get left behind. Every competitor is moving on AI and we need to move faster than all of them."',
      source: 'Chicago Tribune, Feb 2026',
    },
    {
      name: 'Michael Torres', title: 'Chief Financial Officer', tenure: '5 years',
      background: 'Former VP Finance at Advocate Aurora. 20 years in healthcare finance. Deep revenue cycle expertise.',
      priority: 'Operating margin is 1.2% against a 3.8% peer median. Every unverified dollar of AI spend is a threat to bond covenants.',
      quote: '"I need to see the math before I approve the spend. Show me verified savings and a clear payback period — not a slide deck."',
      source: "Becker's Hospital CFO Report, Jan 2026",
    },
    {
      name: 'Dr. James Park', title: 'Chief Medical Officer', tenure: '2 years',
      background: 'Former Northwestern Medicine. Physician-researcher. Published on AI in clinical decision-making.',
      priority: 'Physician burnout is at 62% — highest since 2020. Documentation burden and prior auth are the primary drivers.',
      quote: '"AI has to reduce friction for clinicians. If it adds one more click, I will personally kill the project."',
      source: 'Modern Healthcare, Dec 2025',
    },
    {
      name: 'Linda Marsh', title: 'Chief Information Officer', tenure: '18 months',
      background: 'Former Epic implementation lead at Cleveland Clinic. Hired specifically to manage the Q3 2026 go-live.',
      priority: 'Epic go-live is the singular priority. Anything that competes for IT resources is a risk she will resist.',
      quote: '"I have seen Epic go-lives fail when there are too many parallel initiatives. The preparation window closes in 90 days."',
      source: 'Internal all-hands transcript, Mar 2026',
    },
    {
      name: 'Robert Anand', title: 'Chief Operating Officer', tenure: '4 years',
      background: 'Internal promotion from EVP Operations. Runs all 47 facilities. Trusted by frontline staff and the board.',
      priority: 'Staffing math is broken — agency nurses at $180/hr are destroying margin. Needs a path out within 18 months.',
      quote: '"We cannot sustain this staffing model. We need AI-powered scheduling and workforce planning or we bleed out slowly."',
      source: 'Board meeting minutes, Feb 2026',
    },
  ],
  priorities: [
    {
      num: '01', title: 'AI-First Clinical Operations',
      desc: 'Embed AI across clinical workflows — documentation, triage, readmission prediction, prior auth automation across all 47 facilities.',
      status: 'ACTIVE', risk: 'high',
      signal: 'Three uncoordinated AI pilots running with no central governance, no shared data layer, and no outcome measurement framework.',
    },
    {
      num: '02', title: 'Revenue Cycle Modernization',
      desc: 'Reduce claim denial rate from 18.2% to below the 12.1% benchmark. Automate prior auth and eligibility verification.',
      status: 'ACTIVE', risk: 'critical',
      signal: '$94M annual denial exposure. Epic migration in 90 days creates high transition risk for revenue cycle continuity.',
    },
    {
      num: '03', title: 'Epic Go-Live — Q3 2026',
      desc: 'Consolidate three legacy EHRs (Cerner, Allscripts, Meditech) onto a single Epic instance across all 47 facilities.',
      status: 'AT RISK', risk: 'critical',
      signal: 'Integration testing 60 days behind plan. Revenue cycle module understaffed. CIO estimates a 40% chance of delay.',
    },
    {
      num: '04', title: 'Value-Based Care Contract Expansion',
      desc: 'Shift 40% of revenue to VBC arrangements by 2027. Currently at 18% with inadequate attribution data infrastructure.',
      status: 'PLANNED', risk: 'high',
      signal: 'Lacks outcome tracking and patient attribution systems required to qualify for CMS shared savings programs.',
    },
    {
      num: '05', title: 'Workforce Optimization',
      desc: 'Reduce agency nurse dependency by $80M through AI-assisted scheduling, retained staff incentives, and predictive staffing.',
      status: 'PLANNED', risk: 'medium',
      signal: 'Agency spend $340M annually — $140M above benchmark. 19% nurse turnover creates a perpetual agency dependency loop.',
    },
  ],
  contradictions: [
    {
      topic: 'Claim Denial Rate',
      reported: 'CEO reports 14% denial rate in Q4 board presentations and investor communications.',
      actual: 'Claims data shows 18.2% actual denial rate in the trailing 12 months across all payers.',
      gap: '4.2 points understated = $94M annual cash exposure',
      reportedBy: 'Dr. Sarah Chen — Board Deck, Q4 2025',
      source: 'Meridian claims database via clearinghouse feed, Jan 2026',
    },
    {
      topic: 'Days in A/R',
      reported: 'CFO states 42 days in A/R is "consistent with peers" in a November investor call.',
      actual: 'Revenue cycle AR aging shows 58 days — 31% above the 44-day peer benchmark.',
      gap: '16 days excess = $47M cash flow impact at current revenue run rate',
      reportedBy: 'Michael Torres — Investor Call, Nov 2025',
      source: 'Meridian AR aging export, Feb 2026',
    },
    {
      topic: 'Staff Turnover',
      reported: 'COO states 12% annual nursing turnover is "in line with industry norms."',
      actual: 'HR data shows 19% actual turnover — the primary driver of $340M in agency spend.',
      gap: '7-point understatement = $140M excess agency cost vs staffed benchmark',
      reportedBy: 'Robert Anand — All-hands, Jan 2026',
      source: 'Meridian HRIS export, Mar 2026',
    },
    {
      topic: 'AI Readiness',
      reported: 'CEO publicly states Meridian is "ready to scale AI across our clinical operations."',
      actual: 'AbarVa AI Readiness Score: 3.1/10. No data governance, no MLOps, 3 siloed pilots with no production path.',
      gap: 'No technical foundation for enterprise AI deployment currently exists',
      reportedBy: 'Dr. Sarah Chen — Chicago Tribune, Feb 2026',
      source: 'AbarVa AI Readiness Assessment, Mar 2026',
    },
  ],
  benchmarks: [
    { label: 'Claim Denial Rate',       clientVal: 18.2, peerVal: 12.1, unit: '%',    worse: true, source: 'HFMA 2025',             note: '$94M annual exposure' },
    { label: 'Days in A/R',             clientVal: 58,   peerVal: 44,   unit: ' days', worse: true, source: 'Advisory Board 2025',   note: '$47M cash flow impact' },
    { label: 'Cost per Discharge ($K)', clientVal: 14.2, peerVal: 11.8, unit: 'K',    unitPrefix: '$', worse: true, source: 'CMS Cost Report 2024', note: '$2,400 per case above peer' },
    { label: 'Operating Margin',        clientVal: 1.2,  peerVal: 3.8,  unit: '%',    worse: true, source: 'Kaufman Hall 2025',      note: '2.6 points below peer' },
    { label: 'Nurse Turnover Rate',     clientVal: 19,   peerVal: 13,   unit: '%',    worse: true, source: 'NSI Nursing 2025',       note: '46% higher than peer' },
  ],
  genome: [
    {
      id: 'F011', label: 'Epic Without Interim RCM Stabilization',
      failRate: 74, engagements: 18,
      desc: 'Health systems that go live on Epic without a dedicated interim revenue cycle stabilization program see denial rate spikes of 4–8 points in months 3–9 post-conversion. Cash collections fall 18% during the window.',
      signal: 'Meridian has no interim RCM program. Epic go-live is 90 days out. Revenue cycle team is already understaffed.',
      severity: 'critical',
    },
    {
      id: 'F023', label: 'AI Mandate Without Data Governance',
      failRate: 68, engagements: 14,
      desc: 'AI programs launched without centralized data governance fail to reach production in 68% of engagements — typically abandoned after $3–8M in sunk cost. The failure usually surfaces at the data contract stage.',
      signal: 'Three disconnected AI pilots. No central data layer. No governance framework. No shared outcome definition.',
      severity: 'critical',
    },
    {
      id: 'F007', label: 'CFO-Led Transformation Without CEO Air Cover',
      failRate: 61, engagements: 24,
      desc: 'When the CFO owns the transformation mandate without active CEO sponsor behavior — attending reviews, removing blockers, funding without conditions — programs get cut before outcomes are verified.',
      signal: 'Torres controls budget approval. Chen is setting the vision but not the implementation agenda.',
      severity: 'high',
    },
    {
      id: 'F031', label: 'Dual Platform Migration + AI Simultaneously',
      failRate: 55, engagements: 31,
      desc: 'Running a major EHR migration and an AI transformation program in parallel creates compounding disruption. Teams split, governance conflicts, and IT bandwidth collapse within 6 months in 55% of cases.',
      signal: 'Epic migration consuming 80% of CIO bandwidth. AI programs competing for the remaining 20%.',
      severity: 'high',
    },
  ],
  aiUnlock: {
    narrative: 'Meridian sits on 28,000 employees generating 2.1M clinical encounters annually. The data is there — what is missing is the infrastructure, governance, and prioritized use case sequence to turn that data into verified ROI. AbarVa models $220M in achievable AI value across front, middle, and back office — starting with the three use cases that are executable within 6 months given current data maturity.',
    totalValue: '$220M',
    dataReadiness: 3,
    frontOffice: {
      label: 'Patient & Payer Facing',
      items: [
        {
          title: 'Prior Authorization Automation',
          useCase: 'AI reviews clinical notes + payer criteria in real time, auto-approves 60% of PA requests at point of order. Escalates complex cases with recommendation to human reviewer.',
          metric: 'PA cycle time: 14 days → 1.5 days. Physician admin time: –3.2 hrs/week.',
          potential: '$18M annually (clinical staff time + denial prevention)',
          dataReq: 'EHR clinical notes, payer PA criteria feeds, denial reason codes',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'Intelligent Patient Scheduling',
          useCase: 'Predictive no-show model triggers automated outreach 48 hrs before appointment. Double-booking algorithm fills canceled slots. Matches patient to right provider type.',
          metric: 'No-show rate: 18% → 9%. Slot utilization: 71% → 84%.',
          potential: '$12M annually (recovered appointment revenue)',
          dataReq: 'Scheduling history, patient demographics, contact preferences',
          timeframe: '0–6 months',
          status: 'Achievable Now',
        },
        {
          title: 'Predictive Readmission Outreach',
          useCase: 'Risk model identifies patients 30 days before likely readmission. Triggers care coordinator contact, medication review, and telehealth check-in protocol.',
          metric: '30-day readmission rate: 14.2% → 10.8%. Avoidable readmissions: –380/yr.',
          potential: '$22M annually (penalty avoidance + cost reduction)',
          dataReq: 'Discharge data, medication records, SDOH flags, prior readmission history',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'Referral Leakage Intelligence',
          useCase: 'Real-time referral tracking identifies patients referred out who could be served within the Meridian network. Alerts care team with in-network capacity and provider match.',
          metric: 'In-network referral capture: 58% → 74%. Leakage: –$34M.',
          potential: '$34M annually (captured referral revenue)',
          dataReq: 'Referral logs, specialist availability, claims data for out-of-network utilization',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
      ],
    },
    middleOffice: {
      label: 'Clinical & Operational',
      items: [
        {
          title: 'Ambient Clinical Documentation AI',
          useCase: 'Microphone captures physician-patient conversation. AI generates structured SOAP note in real time, presented to physician for review and one-click signature. Integrates with Epic.',
          metric: 'Documentation time: 45 min/day → 12 min/day. 1,200 physicians × 33 min savings = 660 hrs/day recovered.',
          potential: '$42M annually (equivalent to 180 FTE clinical staff)',
          dataReq: 'Audio (consented), Epic integration API, physician specialty templates',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'Utilization Management AI Review Layer',
          useCase: 'AI reviews admission orders against InterQual/MCG criteria in real time. Flags cases where evidence does not support inpatient level of care. Recommends observation status or alternative setting.',
          metric: 'Inappropriate admissions: –12%. Payer audit risk: –$28M.',
          potential: '$28M annually (avoided audit clawbacks + appropriate admissions)',
          dataReq: 'Admission orders, clinical notes, payer criteria library, historical denial data',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'AI-Powered Care Coordination',
          useCase: 'Risk stratification engine updates daily across all 28,000 patients in the care management registry. Surfaces the 200 highest-risk patients to care coordinators each morning with recommended intervention.',
          metric: 'High-risk patients with care plan: 41% → 78%. ED utilization in managed population: –19%.',
          potential: '$31M annually (ED avoidance + hospital day reduction)',
          dataReq: 'Claims history, EHR problem list, lab results, SDOH data, care plan records',
          timeframe: '12–24 months',
          status: 'Strategic (24mo+)',
        },
        {
          title: 'Clinical Protocol Adherence AI',
          useCase: 'AI monitors care delivery against evidence-based protocols (sepsis, CHF, pneumonia). Alerts care team in real time when protocol deviations occur. Tracks adherence rates by unit and physician.',
          metric: 'Protocol adherence: 67% → 91%. Sepsis mortality: –18%. Readmission rate: –2.4 points.',
          potential: '$19M annually (outcome improvement + reduced length of stay)',
          dataReq: 'Real-time EHR vitals, lab results, medication administration records, protocol library',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
      ],
    },
    backOffice: {
      label: 'Revenue Cycle & Operations',
      items: [
        {
          title: 'Predictive Claims Denial Prevention',
          useCase: 'AI scores every claim before submission for denial probability. Flags high-risk claims for human review and auto-corrects common denial triggers (coding, auth, eligibility). Routes clean claims to accelerated submission.',
          metric: 'Denial rate: 18.2% → 11.4%. First-pass resolution: 72% → 89%.',
          potential: '$47M annually (denial reduction + faster collections)',
          dataReq: 'Claims history, denial reason codes, payer contract rules, coding edits library',
          timeframe: '0–6 months',
          status: 'Achievable Now',
        },
        {
          title: 'AI-Powered Workforce Scheduling',
          useCase: 'Demand forecasting model predicts census by unit 72 hours ahead. Scheduling AI matches staffing levels to predicted demand, reducing agency dependency. Integrates with existing scheduling platform.',
          metric: 'Agency hours: –35%. Overtime: –22%. Labor cost per patient day: –$180.',
          potential: '$58M annually (agency reduction + overtime savings)',
          dataReq: 'Historical census data, staff scheduling records, HR system, agency usage logs',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'Supply Chain Optimization AI',
          useCase: 'Demand forecasting across 47 facilities optimizes par levels and automates reorder. AI identifies substitution opportunities across a $180M supply budget. Vendor pricing anomaly detection.',
          metric: 'Supply cost per case: –12%. Stockout events: –44%. Expired inventory write-offs: –$4.2M.',
          potential: '$22M annually (supply cost reduction + waste elimination)',
          dataReq: 'Procurement data, inventory records, clinical supply usage by procedure, vendor pricing',
          timeframe: '12–24 months',
          status: 'Strategic (24mo+)',
        },
        {
          title: 'Compliance & Audit Automation AI',
          useCase: 'AI continuously monitors documentation for RAC audit exposure. Flags high-risk cases, generates audit response drafts, and maintains a real-time compliance dashboard across all facilities.',
          metric: 'Audit prep time: –70%. RAC clawback exposure: –$18M. Compliance staff FTE freed: 14.',
          potential: '$18M annually (audit risk reduction + compliance staff efficiency)',
          dataReq: 'Clinical documentation, billing records, audit history, CMS program integrity rules',
          timeframe: '12–24 months',
          status: 'Strategic (24mo+)',
        },
      ],
    },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// ARCTURUS FINANCIAL GROUP
// ─────────────────────────────────────────────────────────────────────────────
const ARCTURUS: ClientIntelligence = {
  id: 'arcturus',
  name: 'Arcturus Financial Group',
  vertical: 'Wealth Management',
  tagline: 'An $8.4B AUM wealth management firm with a 71% cost-to-income ratio — 13 points above peer median. The efficiency gap represents $840M in recoverable value if operations are modernized at the pace technology now allows.',
  totalExposure: '$840M',
  company: {
    stats: [
      { label: 'Assets Under Mgmt', value: '$8.4B' },
      { label: 'Employees',          value: '1,200' },
      { label: 'Advisors',           value: '180' },
      { label: 'Founded',            value: '1998' },
      { label: 'HQ',                 value: 'Boston, MA' },
      { label: 'C/I Ratio',          value: '71%' },
    ],
    orgNodes: [
      { id: 'ceo', label: 'V. Hartmann',   role: 'CEO', x: 280, y: 20  },
      { id: 'coo', label: 'S. Blackwood',  role: 'COO', x: 80,  y: 110 },
      { id: 'cio', label: 'Dr. N. Patel',  role: 'CIO', x: 220, y: 110 },
      { id: 'cro', label: 'M. Johanssen',  role: 'CRO', x: 360, y: 110 },
      { id: 'cco', label: 'A. Ferreira',   role: 'CCO', x: 490, y: 110 },
      { id: 'cto', label: 'T. Okafor',     role: 'CTO', x: 150, y: 200 },
      { id: 'cso', label: 'L. Wren',       role: 'CSO', x: 420, y: 200 },
    ],
    orgLines: [['ceo','coo'],['ceo','cio'],['ceo','cro'],['ceo','cco'],['coo','cto'],['cco','cso']],
    mixData: [
      { name: 'UHNW Clients',         value: 42, fill: '#818CF8' },
      { name: 'HNW Clients',          value: 35, fill: '#60A5FA' },
      { name: 'Institutional',        value: 15, fill: '#2DD4C8' },
      { name: 'Family Office',        value: 8,  fill: '#E2E1DC' },
    ],
    mixLabel: 'AUM BY SEGMENT',
    strategy: [
      'Advisor productivity — grow AUM per advisor from $46.7M to $72M benchmark without headcount increase',
      'Client retention — close the 87% vs 94% peer gap through proactive engagement and better reporting',
      'Technology modernization — replace 3 legacy systems (portfolio, CRM, compliance) by Q4 2026',
      'New market expansion — launch digital-first advisory channel targeting mass-affluent segment',
    ],
    industryContext: 'Wealth management is facing a structural productivity crisis. Advisor headcount growth is flat while client expectations for real-time insights and personalized outreach have risen sharply. AI-powered advisor co-pilots are now generating 2.3× the AUM growth per advisor at firms like Morgan Stanley and Merrill Lynch that have deployed them at scale. Firms that fail to close the technology gap by 2027 face permanent client share loss to tech-forward RIAs and direct-to-consumer platforms.',
    pressures: [
      { label: 'Advisor Productivity Gap', detail: 'AUM per advisor $46.7M vs $72M peer — at current trajectory, gap widens as top advisors retire' },
      { label: 'Client Retention Risk', detail: '87% vs 94% peer retention means $588M in AUM churn annually above benchmark' },
      { label: 'Compliance Burden', detail: 'SEC exam cycle accelerating; compliance team at capacity with manual monitoring processes' },
      { label: 'Technology Debt', detail: 'Three legacy systems with no integration layer — advisors re-entering data across platforms daily' },
      { label: 'Fee Compression', detail: 'Average advisory fee 72bps vs industry trend toward 55bps — cannot compete on price without cost structure improvement' },
    ],
  },
  leadership: [
    {
      name: 'Viktor Hartmann', title: 'Chief Executive Officer', tenure: '6 years',
      background: 'Former Goldman Sachs PWM. Built Arcturus from $2.1B to $8.4B AUM. Knows the business deeply but has not prioritized technology investment.',
      priority: 'Wants to reach $12B AUM within 3 years without proportional headcount growth. AI is the only path to that math.',
      quote: '"Every dollar I spend on advisors that could be spent on technology is a dollar I will regret in 2028. The best RIAs are already operating at twice our productivity."',
      source: 'Barron\'s Advisor Summit interview, Nov 2025',
    },
    {
      name: 'Sandra Blackwood', title: 'Chief Operating Officer', tenure: '4 years',
      background: 'Former Fidelity operations executive. Built Fidelity\'s institutional operations platform. Deep process and technology expertise.',
      priority: 'C/I ratio at 71% is operationally unsustainable. Needs to cut $80M in operating costs without losing service quality.',
      quote: '"We have 1,200 people doing work that technology should be doing. Not because they can\'t do better work — because we have not given them the tools."',
      source: 'Internal strategy offsite notes, Jan 2026',
    },
    {
      name: 'Dr. Nisha Patel', title: 'Chief Investment Officer', tenure: '3 years',
      background: 'PhD Finance, MIT. Published research on systematic factor investing. Joined from a $22B multi-family office.',
      priority: 'Portfolio construction is manual and inconsistent across 180 advisors. Needs systematic, data-driven approach.',
      quote: '"Our investment process is as good as any firm our size. The problem is delivering it consistently to every client every time. AI can do that."',
      source: 'CFA Institute Wealth Forum, Dec 2025',
    },
    {
      name: 'Marcus Johanssen', title: 'Chief Revenue Officer', tenure: '2 years',
      background: 'Former Schwab wealth division. Expert in digital client acquisition. Hired to build the growth engine.',
      priority: 'New client acquisition cost $4,200 vs industry benchmark $1,800. Digital channel is the only path to economic new client growth.',
      quote: '"We are competing for wealthy clients against firms that can answer their questions at 2am with AI. We answer between 9 and 5."',
      source: 'Wealth Management Institute panel, Feb 2026',
    },
    {
      name: 'Aurelio Ferreira', title: 'Chief Compliance Officer', tenure: '7 years',
      background: 'Former SEC examiner. Has navigated 4 full exam cycles. Risk-first mindset.',
      priority: 'Manual compliance monitoring cannot scale with growth. One incident at this AUM level triggers SEC scrutiny and reputational damage.',
      quote: '"Our compliance surveillance is backward-looking. I need to know about problems before the client does, not after."',
      source: 'Internal compliance review notes, Mar 2026',
    },
  ],
  priorities: [
    {
      num: '01', title: 'Advisor Productivity AI',
      desc: 'Deploy AI co-pilot for all 180 advisors — pre-meeting intelligence, next best action, portfolio narrative generation, client risk monitoring.',
      status: 'ACTIVE', risk: 'high',
      signal: 'Two competing vendor pilots in progress with no integration path. Advisors using neither consistently after 60 days.',
    },
    {
      num: '02', title: 'Technology Stack Modernization',
      desc: 'Replace legacy portfolio management (Advent), CRM (Salesforce Classic), and compliance (Actimize) with integrated modern stack.',
      status: 'AT RISK', risk: 'critical',
      signal: 'RFP issued to 6 vendors. No decision after 9 months. Integration complexity is being underestimated by $12M.',
    },
    {
      num: '03', title: 'Client Experience Transformation',
      desc: 'Build real-time client portal with AI-generated insights, on-demand portfolio narratives, and proactive alert system.',
      status: 'PLANNED', risk: 'high',
      signal: '87% client retention vs 94% peer — $588M in annual AUM churn above benchmark is the direct cost of inaction.',
    },
    {
      num: '04', title: 'Digital Advisory Channel Launch',
      desc: 'Launch mass-affluent digital channel ($250K–$1M) targeting younger wealth segment with AI-driven advisory and lower fee model.',
      status: 'PLANNED', risk: 'medium',
      signal: 'Target segment growing 14% annually. Arcturus currently serves 0% of this segment. Window closes as competitors establish brand.',
    },
    {
      num: '05', title: 'Compliance AI Surveillance',
      desc: 'Real-time AI monitoring across all advisor communications, trades, and client interactions for regulatory compliance.',
      status: 'ACTIVE', risk: 'high',
      signal: 'SEC exam cycle begins Q3 2026. Current manual process cannot clear the review volume in time.',
    },
  ],
  contradictions: [
    {
      topic: 'C/I Ratio Reporting',
      reported: 'CEO states C/I ratio of 65% "on a path to improvement" in LP communications.',
      actual: 'Audited financials show 71% C/I ratio — unchanged from prior year and 13 points above the 58% peer benchmark.',
      gap: '6-point misrepresentation = $840M efficiency gap being minimized',
      reportedBy: 'Viktor Hartmann — LP Quarterly Communication, Q4 2025',
      source: 'Arcturus audited financial statements, Dec 2025',
    },
    {
      topic: 'Advisor Retention',
      reported: 'HR states "industry-leading" advisor retention of 94% in recruiting materials.',
      actual: 'Departures analysis shows 12 senior advisors (avg $280M AUM) left in the trailing 18 months = $3.4B AUM at risk.',
      gap: '$3.4B in advisor-portable AUM with no retention strategy in place',
      reportedBy: 'Arcturus recruiting collateral, Q1 2026',
      source: 'AbarVa advisor departure analysis, Mar 2026',
    },
    {
      topic: 'Technology Readiness',
      reported: 'CTO says existing technology "can support AI deployment within 90 days" in board presentation.',
      actual: 'Three legacy systems with no API layer. Any AI deployment requires 18–24 months of integration work first.',
      gap: '18-month gap between stated readiness and actual deployment timeline',
      reportedBy: 'T. Okafor — Board Technology Update, Feb 2026',
      source: 'AbarVa Technology Assessment, Mar 2026',
    },
    {
      topic: 'New Client Growth',
      reported: 'CRO reports "strong organic growth" of $800M new AUM in 2025.',
      actual: '$800M new AUM in — offset by $588M AUM churn from departing clients = net growth of $212M (2.5% of AUM).',
      gap: 'Real growth rate 2.5% vs stated "strong growth" narrative; net retention is the core problem',
      reportedBy: 'Marcus Johanssen — Annual Revenue Review, Jan 2026',
      source: 'AbarVa AUM flow analysis (inflows minus outflows), Mar 2026',
    },
  ],
  benchmarks: [
    { label: 'Cost-to-Income Ratio',    clientVal: 71,    peerVal: 58,    unit: '%',    worse: true,  source: 'Cerulli Associates 2025', note: '$840M efficiency gap' },
    { label: 'AUM per Advisor ($M)',     clientVal: 46.7,  peerVal: 72,    unit: 'M',    unitPrefix: '$', worse: true, source: 'FA Mag Broker-Dealer Survey 2025', note: '$25.3M gap per advisor' },
    { label: 'Client Retention Rate',   clientVal: 87,    peerVal: 94,    unit: '%',    worse: true,  source: 'J.D. Power 2025',         note: '$588M annual AUM churn' },
    { label: 'Revenue per Employee($K)',  clientVal: 480,   peerVal: 620,   unit: 'K',    unitPrefix: '$', worse: true, source: 'PwC Asset Mgmt Survey 2025', note: '$140K productivity gap' },
    { label: 'New Client Acq. Cost ($K)', clientVal: 4.2,  peerVal: 1.8,   unit: 'K',    unitPrefix: '$', worse: true, source: 'Schwab RIA Benchmarking 2025', note: '2.3× above benchmark' },
  ],
  genome: [
    {
      id: 'F044', label: 'Vendor RFP Without Integration Architecture',
      failRate: 72, engagements: 19,
      desc: 'Firms that issue technology RFPs without a defined integration architecture select the wrong vendor 72% of the time — choosing on features rather than interoperability, then spending 2× the projected cost on integration.',
      signal: 'Arcturus RFP running 9 months with no integration spec. Six vendors competing on feature lists.',
      severity: 'critical',
    },
    {
      id: 'F018', label: 'Advisor AI Adoption Without Change Management',
      failRate: 66, engagements: 22,
      desc: 'AI advisor co-pilot deployments without structured change management and usage accountability fail in 66% of firms. Advisors revert to existing workflows within 60 days when adoption is voluntary.',
      signal: 'Two competing AI pilots with no adoption metrics, no incentives, no usage tracking.',
      severity: 'critical',
    },
    {
      id: 'F029', label: 'Client Portal Without Proactive Push Intelligence',
      failRate: 58, engagements: 16,
      desc: 'Client portals that require clients to log in to see their information have 12% monthly active usage rates. Portals that push personalized alerts and narratives achieve 67% MAU and reduce advisor call volume by 34%.',
      signal: 'Planned Arcturus portal is pull-only. No proactive intelligence architecture defined.',
      severity: 'high',
    },
    {
      id: 'F052', label: 'Fee Compression Without Cost Structure Response',
      failRate: 51, engagements: 28,
      desc: 'Firms facing fee compression that do not simultaneously attack their cost structure within 18 months see margin erosion accelerate as they lose price-sensitive clients without reducing the fixed cost base.',
      signal: 'Fee pressure at 72bps moving toward 55bps industry average; no cost reduction program in place.',
      severity: 'high',
    },
  ],
  aiUnlock: {
    narrative: 'Arcturus has 180 advisors managing $8.4B in AUM — an average of $46.7M each versus the $72M benchmark. The gap is not advisor quality; it is advisor time. The average advisor spends 64% of their day on tasks that AI can either automate or dramatically accelerate. AbarVa models $180M in achievable AI value — led by advisor productivity and compliance automation, achievable within 12 months with the right data foundation.',
    totalValue: '$180M',
    dataReadiness: 5,
    frontOffice: {
      label: 'Client & Advisor Facing',
      items: [
        {
          title: 'Advisor Intelligence Co-Pilot',
          useCase: 'Before every client meeting, AI synthesizes portfolio performance, life events, market movements, and peer portfolio actions into a 3-minute briefing. Generates personalized talking points and surfaces the top 3 recommended actions for each client.',
          metric: 'Meeting prep time: 45 min → 8 min. Client satisfaction NPS: +14 points. AUM growth rate per advisor: +28%.',
          potential: '$62M annually (AUM growth + advisor capacity expansion)',
          dataReq: 'CRM data, portfolio management system, market data feeds, client communication history',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'AI Portfolio Narrative Generation',
          useCase: 'Monthly and quarterly client reports are AI-generated from portfolio data — personalized by client risk profile, life stage, and stated goals. Available as PDF, email, or voice briefing. Advisor reviews and approves in 90 seconds.',
          metric: 'Report generation time: 4 hrs → 6 min per client. Client engagement with reports: +340%.',
          potential: '$18M annually (advisor time recovery + client retention improvement)',
          dataReq: 'Portfolio management system, market data, client profile and preferences',
          timeframe: '0–6 months',
          status: 'Achievable Now',
        },
        {
          title: 'Prospect Intelligence Engine',
          useCase: 'AI identifies high-probability prospects from public signals — liquidity events, RSU vesting schedules, business sale filings, inheritance triggers. Routes to advisor with briefing and recommended outreach message.',
          metric: 'Prospect identification: 3× increase. Close rate on AI-identified prospects: 34% vs 18% cold outreach.',
          potential: '$28M annually (new AUM acquisition)',
          dataReq: 'Public records, financial data APIs, LinkedIn signals, CRM for de-duplication',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'Proactive Client Retention AI',
          useCase: 'Churn prediction model monitors 47 behavioral signals (engagement drop, complaint history, competitor mentions, life events) and alerts advisor 60 days before likely departure. Recommends intervention playbook.',
          metric: 'Client churn: 13% → 8%. Retained AUM from at-risk clients: $280M annually.',
          potential: '$22M annually (fee revenue from retained AUM)',
          dataReq: 'CRM engagement data, portal login frequency, NPS scores, communication sentiment',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
      ],
    },
    middleOffice: {
      label: 'Investment & Compliance Operations',
      items: [
        {
          title: 'Real-Time Compliance Surveillance AI',
          useCase: 'NLP monitors all advisor communications (email, chat, call transcripts) for suitability violations, cherry-picking patterns, and outside business activity. Flags for CCO review in real time with evidence package.',
          metric: 'False positive rate: –64%. Surveillance coverage: 100% of communications vs current 12% sampled.',
          potential: '$24M annually (regulatory risk reduction + compliance staff efficiency)',
          dataReq: 'Email archive, recorded calls, chat logs, CRM, trade blotter',
          timeframe: '0–6 months',
          status: 'Achievable Now',
        },
        {
          title: 'Portfolio Construction Intelligence',
          useCase: 'AI applies the firm\'s investment philosophy consistently across all 180 advisors\' books. Surfaces drift from model portfolios, tax-loss harvesting opportunities, and rebalancing triggers for each account daily.',
          metric: 'Portfolio consistency score: 52% → 94%. Tax alpha generated per account: +$4,200 annually.',
          potential: '$31M annually (tax alpha + model adherence + reduced compliance exposure)',
          dataReq: 'Portfolio management system, model portfolio definitions, tax lot data',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'Trade Reconciliation Automation',
          useCase: 'AI automates the matching and resolution of trade breaks across custodians. Learns from historical resolution patterns to auto-resolve 85% of breaks without human intervention.',
          metric: 'Break resolution time: 3 days → 4 hours. Operations FTE required: –8.',
          potential: '$9M annually (operations efficiency)',
          dataReq: 'Custodian feeds, internal blotter, historical break resolution data',
          timeframe: '0–6 months',
          status: 'Achievable Now',
        },
        {
          title: 'Regulatory Filing Automation',
          useCase: 'AI extracts required data from source systems, populates Form ADV, 13F, and other regulatory filings, and flags discrepancies for compliance review. Reduces filing cycle from 3 weeks to 3 days.',
          metric: 'Filing preparation time: –72%. Compliance staff hours on filings: –180 hrs/quarter.',
          potential: '$6M annually (compliance efficiency + audit risk reduction)',
          dataReq: 'Portfolio data, ownership records, fee billing system, prior filings as training data',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
      ],
    },
    backOffice: {
      label: 'Operations & Finance',
      items: [
        {
          title: 'Client Onboarding AI',
          useCase: 'AI-guided onboarding collects KYC, investment profile, and account documents. Pre-populates forms, validates data, flags missing items, and routes to operations for final review. Digital-first, no paper.',
          metric: 'Onboarding time: 6 weeks → 4 days. NIGO rate: 34% → 6%. Advisor time on onboarding: –80%.',
          potential: '$12M annually (advisor time + faster AUM deployment)',
          dataReq: 'KYC requirements, identity verification APIs, account opening forms',
          timeframe: '0–6 months',
          status: 'Achievable Now',
        },
        {
          title: 'Fee Billing Verification AI',
          useCase: 'AI audits every quarterly fee calculation against the client\'s fee schedule, AUM, and billing tier. Catches billing errors before they reach statements. Maintains real-time fee revenue forecast.',
          metric: 'Billing errors caught: 100% vs current 60% sampled. Error-related refunds: –$1.8M annually.',
          potential: '$4M annually (error prevention + trust maintenance)',
          dataReq: 'Fee schedules, portfolio management AUM data, billing system',
          timeframe: '0–6 months',
          status: 'Achievable Now',
        },
        {
          title: 'Vendor Spend Optimization AI',
          useCase: 'AI analyzes $45M annual vendor spend across 68 vendors — benchmarks pricing, identifies duplicate capabilities, and surfaces renegotiation opportunities with market data.',
          metric: 'Vendor cost reduction: 14% ($6.3M). Duplicate capabilities eliminated: 9 contracts.',
          potential: '$8M annually (vendor cost reduction)',
          dataReq: 'Vendor contracts, AP data, market pricing benchmarks',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'IT Operations Intelligence AI',
          useCase: 'AIOps monitors infrastructure, predicts incidents before they impact advisors, and auto-remediates common issues. Reduces mean time to resolution from 4 hours to 18 minutes for Tier 1-2 incidents.',
          metric: 'System downtime: –68%. Advisor-impacting incidents: –41%. IT ops cost: –22%.',
          potential: '$5M annually (downtime prevention + IT efficiency)',
          dataReq: 'Infrastructure monitoring logs, incident history, system topology data',
          timeframe: '12–24 months',
          status: 'Strategic (24mo+)',
        },
      ],
    },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// APEX RETAIL GROUP
// ─────────────────────────────────────────────────────────────────────────────
const APEX_RETAIL: ClientIntelligence = {
  id: 'apexretail',
  name: 'Apex Retail Group',
  vertical: 'Specialty Retail',
  tagline: 'A $2.8B specialty retail chain with 380 stores and a digital channel generating 18% of revenue versus a 32% peer benchmark. Inventory turns, margin, and digital conversion are all below peer — and the window to close the gap is narrowing.',
  totalExposure: '$186M',
  company: {
    stats: [
      { label: 'Annual Revenue',     value: '$2.8B' },
      { label: 'Employees',          value: '22,000' },
      { label: 'Stores',             value: '380' },
      { label: 'Founded',            value: '2001' },
      { label: 'HQ',                 value: 'Dallas, TX' },
      { label: 'eComm Revenue',      value: '18%' },
    ],
    orgNodes: [
      { id: 'ceo', label: 'K. Oladipo',    role: 'CEO', x: 280, y: 20  },
      { id: 'cfo', label: 'R. Sloane',     role: 'CFO', x: 80,  y: 110 },
      { id: 'cmo', label: 'J. Reyes',      role: 'CMO', x: 220, y: 110 },
      { id: 'coo', label: 'P. Nakamura',   role: 'COO', x: 360, y: 110 },
      { id: 'cto', label: 'D. Abara',      role: 'CTO', x: 490, y: 110 },
      { id: 'cpo', label: 'W. Chen',       role: 'CPO', x: 150, y: 200 },
      { id: 'cso', label: 'F. Mensah',     role: 'CSO', x: 420, y: 200 },
    ],
    orgLines: [['ceo','cfo'],['ceo','cmo'],['ceo','coo'],['ceo','cto'],['cmo','cpo'],['coo','cso']],
    mixData: [
      { name: 'In-store',           value: 82, fill: '#F59E0B' },
      { name: 'eCommerce',          value: 14, fill: '#60A5FA' },
      { name: 'B2B / Wholesale',    value: 4,  fill: '#E2E1DC' },
    ],
    mixLabel: 'REVENUE MIX',
    strategy: [
      'Digital-first transformation — grow eComm from 18% to 30% of revenue by 2027',
      'Inventory intelligence — reduce stockouts and overstock through demand forecasting AI',
      'Personalization at scale — 1:1 product recommendations across all 22M loyalty members',
      'Store portfolio optimization — right-size 380 stores using footfall and margin analytics',
    ],
    industryContext: 'Specialty retail is being compressed from two sides: Amazon and digital-native brands capturing digital share, and off-price channels (TJX, Burlington) capturing the value-seeking consumer. Retailers that close the digital-physical gap with AI are generating 2–4× the comparable store sales growth of those that remain analog. McKinsey projects AI will add $400B in retail value by 2028 — concentrated in demand forecasting, personalization, and workforce optimization. The window to be a first mover is 18 months.',
    pressures: [
      { label: 'Digital Revenue Gap', detail: 'eComm 18% vs 32% peer median — $392M in revenue below peer digital benchmark' },
      { label: 'Inventory Inefficiency', detail: 'Inventory turnover 3.8× vs 5.2× peer — $68M in excess inventory carrying cost' },
      { label: 'Gross Margin Compression', detail: 'Gross margin 31% vs 38% specialty peer — driven by markdowns from poor demand signal' },
      { label: 'Labor Cost Pressure', detail: '22,000 employees with no AI-assisted scheduling; overtime 28% above benchmark' },
      { label: 'Customer Acquisition Cost', detail: 'CAC $68 vs $41 peer benchmark — loyalty program not converting to repeat purchase' },
    ],
  },
  leadership: [
    {
      name: 'Kofi Oladipo', title: 'Chief Executive Officer', tenure: '4 years',
      background: 'Former Target EVP Digital. Built Target\'s same-day delivery from zero to $2.4B. Understands digital transformation intimately.',
      priority: 'Needs digital revenue to reach 30% within 24 months. Everything else is noise if that number does not move.',
      quote: '"We are a digital company that happens to have 380 stores — not a store company trying to have a website. That mindset shift has to be complete by 2026."',
      source: 'NRF Big Show keynote, Jan 2026',
    },
    {
      name: 'Rachel Sloane', title: 'Chief Financial Officer', tenure: '2 years',
      background: 'Former Nordstrom finance. Deep retail P&L expertise. Hired to find $80M in efficiency to fund digital investment.',
      priority: 'Gross margin at 31% means every percentage point of inventory inefficiency is existential. The markdown cycle must be broken.',
      quote: '"We are marking down $180M in inventory annually that AI could have predicted we did not need to order. That stops this year."',
      source: 'Goldman Sachs Retail Conference, Feb 2026',
    },
    {
      name: 'Juliana Reyes', title: 'Chief Marketing Officer', tenure: '3 years',
      background: 'Former Nike digital marketing. Built Nike\'s direct consumer engagement platform. Loyalty program architect.',
      priority: '22 million loyalty members but only 34% active in the trailing 12 months. The data asset is undermonetized by $120M.',
      quote: '"We have 22 million people who told us they want a relationship with our brand. We are treating them like strangers. AI changes that."',
      source: 'Shoptalk keynote, Mar 2026',
    },
    {
      name: 'Priya Nakamura', title: 'Chief Operating Officer', tenure: '5 years',
      background: 'Joined from Walmart supply chain. Architected Apex\'s distribution network expansion from 2 to 7 DCs.',
      priority: 'Supply chain resilience is the unsolved problem. Three stockout events in 2025 cost $42M in lost sales.',
      quote: '"A demand signal from a trend that starts on TikTok can empty a store in 72 hours. Our supply chain cannot respond that fast. Yet."',
      source: 'Internal ops review, Jan 2026',
    },
    {
      name: 'David Abara', title: 'Chief Technology Officer', tenure: '18 months',
      background: 'Former Shopify engineering leadership. Built platform capabilities serving 2M+ merchants.',
      priority: 'Legacy OMS and WMS cannot support omnichannel at the speed the business needs. Re-platforming is the first mandate.',
      quote: '"Our technology stack is the single biggest risk to the 2027 plan. We cannot build AI on top of a 2008 inventory system."',
      source: 'Internal technology review, Feb 2026',
    },
  ],
  priorities: [
    {
      num: '01', title: 'AI-Powered Personalization at Scale',
      desc: 'Deploy 1:1 product recommendations and personalized marketing across 22M loyalty members — email, app, and in-store.',
      status: 'ACTIVE', risk: 'high',
      signal: 'Personalization engine built for 2M users — not 22M. Performance degrades above 5M profiles. Re-architecture required.',
    },
    {
      num: '02', title: 'Demand Forecasting & Inventory Intelligence',
      desc: 'Replace statistical forecasting with ML-driven demand sensing across 380 stores, 8,000 SKUs, and 7 distribution centers.',
      status: 'ACTIVE', risk: 'critical',
      signal: '$180M in annual markdowns. Three major stockout events in 2025 costing $42M in lost sales. Current system 61% accurate at 8-week horizon.',
    },
    {
      num: '03', title: 'Digital Commerce Transformation',
      desc: 'Redesign eCommerce platform with AI-powered search, recommendations, and checkout. Target 30% digital revenue share.',
      status: 'AT RISK', risk: 'critical',
      signal: 'Replatforming project 4 months behind plan. eComm conversion rate 2.1% vs 3.4% peer benchmark — $58M revenue at stake.',
    },
    {
      num: '04', title: 'Store Portfolio Optimization',
      desc: 'Use footfall analytics and margin data to right-size the store portfolio — close 30–40 underperforming stores, expand in high-growth markets.',
      status: 'PLANNED', risk: 'high',
      signal: '62 stores generating negative four-wall EBITDA. No data model to distinguish turnaround candidates from structural closures.',
    },
    {
      num: '05', title: 'Workforce Scheduling AI',
      desc: 'Deploy AI-powered labor scheduling across all 380 stores to match labor to demand, reduce overtime, and improve coverage.',
      status: 'PLANNED', risk: 'medium',
      signal: 'Overtime 28% above benchmark. Scheduling is still done manually by store managers with no system-level demand signal.',
    },
  ],
  contradictions: [
    {
      topic: 'eCommerce Performance',
      reported: 'CMO presents eComm as "fastest growing channel, up 22% YoY" in investor materials.',
      actual: '22% growth off an 18% revenue base equals 14.6% of new revenue from digital — still 14 points below the 32% peer benchmark.',
      gap: 'Relative growth metric obscures the $392M absolute revenue gap vs peer digital benchmark',
      reportedBy: 'Juliana Reyes — Investor Day, Q3 2025',
      source: 'AbarVa digital channel analysis against NRF peer data, Mar 2026',
    },
    {
      topic: 'Inventory Accuracy',
      reported: 'COO reports 94% inventory accuracy "at par with best-in-class retailers."',
      actual: 'Cycle count data shows 78% actual accuracy. The gap drives 34% of stockout events and $42M in lost sales.',
      gap: '16-point overstatement of inventory accuracy = $42M in annual stockout losses',
      reportedBy: 'Priya Nakamura — Operations Review, Nov 2025',
      source: 'Apex cycle count data, distribution center audit, Feb 2026',
    },
    {
      topic: 'Customer Lifetime Value',
      reported: 'CMO states average loyalty member CLV is $1,240 in the annual marketing review.',
      actual: 'Cohort analysis shows 66% of loyalty members are single-purchase. True active member CLV is $2,800 — but base is 7.5M, not 22M.',
      gap: 'Loyalty program is inflated by 14.5M dormant members — addressable active base is 34% of stated number',
      reportedBy: 'Juliana Reyes — Annual Marketing Review, Jan 2026',
      source: 'AbarVa loyalty cohort analysis, Mar 2026',
    },
    {
      topic: 'Forecasting Accuracy',
      reported: 'Supply chain team reports demand forecasting accuracy of "82% at 8-week horizon."',
      actual: 'SKU-level accuracy analysis shows 61% accuracy. The 82% figure is category-level, which masks SKU and store-level variance.',
      gap: 'Category vs SKU accuracy gap is the root cause of $180M in annual markdowns',
      reportedBy: 'Operations team — Supply Chain Review, Q4 2025',
      source: 'AbarVa SKU-level forecast audit across top 2,000 SKUs, Feb 2026',
    },
  ],
  benchmarks: [
    { label: 'eCommerce Revenue Share', clientVal: 18,  peerVal: 32,  unit: '%',    worse: true,  source: 'NRF Digital Commerce Report 2025', note: '$392M digital revenue gap' },
    { label: 'Inventory Turnover (×)',   clientVal: 3.8, peerVal: 5.2, unit: '×',    worse: true,  source: 'Retail Metrics Benchmark 2025',    note: '$68M inventory carrying cost' },
    { label: 'Gross Margin',            clientVal: 31,  peerVal: 38,  unit: '%',    worse: true,  source: 'Kantar Retail 2025',               note: '7-point gap = $196M' },
    { label: 'eComm Conversion Rate',   clientVal: 2.1, peerVal: 3.4, unit: '%',    worse: true,  source: 'Salesforce Commerce Cloud 2025',    note: '$58M lost digital revenue' },
    { label: 'Labor Cost % of Revenue', clientVal: 18,  peerVal: 14,  unit: '%',    worse: true,  source: 'McKinsey Retail Ops 2025',         note: '$112M excess labor cost' },
  ],
  genome: [
    {
      id: 'F061', label: 'Personalization at Scale Without Data Platform',
      failRate: 71, engagements: 17,
      desc: 'Retailers that deploy AI personalization without a unified customer data platform serving real-time events fail in 71% of cases — product recommendations become stale within 24 hours and CTR drops to near zero.',
      signal: 'Apex personalization engine built on batch processing — 24-48 hour data latency. Real-time signals (browsing, cart abandonment) not incorporated.',
      severity: 'critical',
    },
    {
      id: 'F039', label: 'Demand Forecasting AI Without SKU-Level Ground Truth',
      failRate: 68, engagements: 21,
      desc: 'Demand forecasting models trained on aggregated category data fail to improve SKU-level accuracy. The model looks good at the category level while store-SKU stockouts and overstock continue unchanged.',
      signal: 'Apex forecast accuracy reported at category level (82%). SKU-level accuracy is 61% — the actual driver of $180M in markdowns.',
      severity: 'critical',
    },
    {
      id: 'F047', label: 'Digital Transformation Without Unified Commerce Architecture',
      failRate: 64, engagements: 19,
      desc: 'Digital revenue growth targets fail when eCommerce, OMS, and in-store inventory operate on separate systems. Omnichannel capabilities (BOPIS, ship-from-store, real-time inventory visibility) break at scale.',
      signal: 'Apex OMS and WMS are separate legacy systems with no real-time inventory sync. BOPIS has a 34% unfulfillable rate.',
      severity: 'critical',
    },
    {
      id: 'F022', label: 'Loyalty Program Scale Without Engagement Architecture',
      failRate: 56, engagements: 24,
      desc: 'Large loyalty programs with low engagement rates (below 40% active) do not improve with more members or more offers — they require a fundamentally different engagement architecture with AI-driven triggers.',
      signal: '22M loyalty members, 34% active. Engagement is campaign-driven, not behavioral-trigger-driven.',
      severity: 'high',
    },
  ],
  aiUnlock: {
    narrative: 'Apex has three data assets that most retailers would pay to acquire: 22 million loyalty member profiles, 380 stores generating real-time footfall and transaction data, and 7 years of SKU-level demand history. The data is rich. The AI infrastructure to activate it does not exist. AbarVa models $186M in achievable AI value — led by demand forecasting, personalization, and workforce optimization — executable in 12–18 months with a unified data foundation.',
    totalValue: '$186M',
    dataReadiness: 5,
    frontOffice: {
      label: 'Customer & Digital Facing',
      items: [
        {
          title: '1:1 Real-Time Personalization Engine',
          useCase: 'AI ingests real-time browsing, purchase, and loyalty signals to generate product recommendations, personalized pricing, and targeted promotions for each of the 22M loyalty members — updated with every session.',
          metric: 'Email click-through: 2.1% → 5.8%. App conversion: +34%. Average order value: +$18 (14% lift).',
          potential: '$48M annually (AOV lift + conversion improvement across digital and email)',
          dataReq: 'Real-time event stream, loyalty profiles, product catalog, purchase history, inventory availability',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'AI-Powered Search & Discovery',
          useCase: 'Semantic search understands intent, not just keywords. Visual search lets customers photograph items to find matches. Search results ranked by personal purchase history and inventory availability.',
          metric: 'Search-to-purchase conversion: 3.4% → 7.2%. Search abandonment: –44%. Revenue per search session: +$22.',
          potential: '$28M annually (search conversion improvement)',
          dataReq: 'Product catalog with rich attributes, visual imagery, search query logs, purchase outcomes',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'Customer Service AI Agent',
          useCase: 'AI agent handles WISMO, returns, loyalty inquiries, and product questions across chat, email, and voice — resolving 72% without human escalation. Seamless handoff with full context when human needed.',
          metric: 'Self-service rate: 31% → 72%. Cost per contact: $8.40 → $2.10. CSAT: +8 points.',
          potential: '$18M annually (contact center cost reduction)',
          dataReq: 'Order management system, CRM, loyalty data, return history, knowledge base',
          timeframe: '0–6 months',
          status: 'Achievable Now',
        },
        {
          title: 'Loyalty Re-Engagement AI',
          useCase: 'Propensity model identifies the 8.4M dormant-but-recoverable loyalty members. AI generates personalized win-back sequences with offers calibrated to predicted LTV — not flat discounts.',
          metric: 'Dormant member reactivation: 12% of targeted segment. Recovered annual spend: $480 average.',
          potential: '$12M annually (dormant member reactivation)',
          dataReq: 'Loyalty purchase history, lapse date, category affinity, discount sensitivity model',
          timeframe: '0–6 months',
          status: 'Achievable Now',
        },
      ],
    },
    middleOffice: {
      label: 'Merchandising & Supply Chain',
      items: [
        {
          title: 'AI Demand Forecasting — SKU Level',
          useCase: 'ML model integrates sell-through data, weather, local events, trend signals (search, social), and competitor pricing to forecast demand at SKU-store-week level. Replaces statistical forecasting with 40% accuracy improvement.',
          metric: 'Forecast accuracy: 61% → 86% at SKU level. Stockouts: –38%. Overstock markdowns: –$52M.',
          potential: '$62M annually (markdown reduction + stockout recovery)',
          dataReq: '7 years POS history, store attributes, weather data, trend APIs, competitor price feeds',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'Automated Replenishment Intelligence',
          useCase: 'AI-driven replenishment continuously recalculates par levels and reorder points across 380 stores. Triggers automated purchase orders within defined parameters. Escalates exceptions only.',
          metric: 'Inventory turnover: 3.8× → 5.0×. Carrying cost: –$44M. Buyer time on routine replenishment: –70%.',
          potential: '$44M annually (inventory carrying cost + buyer productivity)',
          dataReq: 'POS feeds, WMS inventory positions, vendor lead times, DC capacity',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'Planogram & Space Optimization AI',
          useCase: 'AI analyzes SKU-level sales velocity, adjacency effects, and shelf profitability to recommend planogram changes. Simulates the sales impact of space reallocation before physical changes.',
          metric: 'Sales per linear foot: +$8 (11% improvement). New planogram adoption cycle: 8 weeks → 3 weeks.',
          potential: '$18M annually (sales density improvement)',
          dataReq: 'POS by shelf location, planogram data, store layout schematics, SKU dimensions',
          timeframe: '12–24 months',
          status: 'Strategic (24mo+)',
        },
        {
          title: 'Markdown Optimization AI',
          useCase: 'Instead of calendar-driven markdowns, AI continuously optimizes clearance pricing by SKU-store based on sell-through velocity, time to season end, and price elasticity. Maximizes recovery on clearance inventory.',
          metric: 'Clearance recovery rate: 34% → 51% of original retail. Markdown-driven gross margin: +1.8 points.',
          potential: '$22M annually (markdown recovery improvement)',
          dataReq: 'POS velocity, inventory age, competitive pricing, historical markdown response curves',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
      ],
    },
    backOffice: {
      label: 'Store Operations & Finance',
      items: [
        {
          title: 'AI-Powered Labor Scheduling',
          useCase: 'Demand-driven scheduling model predicts hourly traffic by store using historical, weather, local events, and promotional data. Schedules labor to match demand — reducing overtime and under-coverage simultaneously.',
          metric: 'Labor cost as % of revenue: 18% → 15.2%. Overtime: –34%. Customer service scores: +6 points.',
          potential: '$38M annually (labor efficiency across 380 stores)',
          dataReq: 'Footfall data, POS transaction timing, employee schedules, historical staffing models',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
        {
          title: 'Loss Prevention AI',
          useCase: 'Computer vision and behavioral analytics identify shoplifting patterns, employee fraud signals, and self-checkout anomalies in real time. Alerts loss prevention team with video evidence.',
          metric: 'Shrink rate: 2.4% → 1.7% of revenue. Loss prevention team efficiency: +60%.',
          potential: '$22M annually (shrink reduction)',
          dataReq: 'CCTV feeds, POS transaction data, inventory variance records',
          timeframe: '12–24 months',
          status: 'Strategic (24mo+)',
        },
        {
          title: 'Accounts Payable Automation AI',
          useCase: 'AI extracts invoice data, matches to POs and receipts, validates against contracts, and routes exceptions. Processes 85% of invoices without human touch.',
          metric: 'Invoice processing cost: $14 → $2.80 per invoice (380,000 invoices annually). Early payment discount capture: +$4.2M.',
          potential: '$8M annually (AP cost reduction + discount capture)',
          dataReq: 'Invoice documents, PO system, goods receipt records, vendor contracts',
          timeframe: '0–6 months',
          status: 'Achievable Now',
        },
        {
          title: 'Store Performance Intelligence AI',
          useCase: 'AI synthesizes 140 metrics per store (traffic, conversion, ATV, shrink, labor, NPS) into a weekly store health score with recommended interventions for district managers.',
          metric: 'District manager insight time: 4 hrs/week → 30 min. Underperforming store improvement rate: +28%.',
          potential: '$14M annually (store performance improvement from faster intervention)',
          dataReq: 'POS, footfall, labor, shrink, NPS, review data by store',
          timeframe: '6–12 months',
          status: 'Achievable in 12mo',
        },
      ],
    },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────
export const CLIENT_INTELLIGENCE: Record<ClientId, ClientIntelligence> = {
  meridian:   MERIDIAN,
  arcturus:   ARCTURUS,
  apexretail: APEX_RETAIL,
}

export function getClientIntelligence(id: string): ClientIntelligence {
  return CLIENT_INTELLIGENCE[id as ClientId] ?? MERIDIAN
}

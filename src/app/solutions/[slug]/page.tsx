'use client'

import { Suspense, use } from 'react'
import { useSearchParams, notFound } from 'next/navigation'
import { buildSolutionUrl, objectiveColor } from '@/lib/solution-library'

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: '#060A12',
  surface: '#0D1520',
  border: '#1C2D45',
  teal: '#2DD4C8',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#10B981',
  indigo: '#6366F1',
  text: '#EFF6FF',
  secondary: '#94A3B8',
  fraunces: 'Fraunces, Georgia, serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
  sans: '"DM Sans", system-ui, sans-serif',
}

type Client = 'meridian' | 'firstcapital' | 'apexretail'

const CLIENT_LABELS: Record<Client, string> = {
  meridian: 'Meridian Health',
  firstcapital: 'First Capital Bank',
  apexretail: 'Apex Retail',
}

// ── Full solution definitions ─────────────────────────────────────────────────
const SOLUTIONS = {
  'revenue-cycle-intelligence': {
    code: 'HC-01',
    name: 'Revenue Cycle Intelligence',
    objective: 'Grow' as const,
    office: 'Front Office',
    vertical: 'Healthcare',
    problem: 'My denial rate is killing us and my board is asking questions I can\'t answer about where the revenue went.',
    entryHref: '/diagnose',
    products: [
      { name: 'Situation Intelligence', href: '/diagnose', role: 'Surface the full RCM picture — denial waterfall, prior auth gaps, cost per claim' },
      { name: 'AI Investment Intelligence', href: '/ai-strategy', role: 'Which RCM AI bets deliver the most value first' },
      { name: 'Vendor Intelligence', href: '/vendor-intelligence', role: 'Score RCM AI vendors against your situation and Genome data' },
      { name: 'Business Case Intelligence', href: '/business-case', role: 'CFO-ready model with risk-adjusted NPV and board brief' },
      { name: 'Outcome Intelligence', href: '/outcome-intelligence', role: 'Lock baseline, track savings, trigger outcome fee' },
    ],
    workflow: [
      {
        step: 1,
        name: 'Situation Intelligence',
        what: 'Surface the full RCM picture — denial waterfall, prior auth gaps, cost per claim vs peers',
        yourData: 'Denial rate 18.2% · $94M revenue gap · Prior auth 23%',
        industry: 'Health systems at your size: median denial 11.4% · $13.8M per point',
        genome: '47 deployments · 71% achieve target · 34% fail without CDO',
        output: 'Situation Brief: "What\'s happening and why it costs you"',
      },
      {
        step: 2,
        name: 'AI Investment Intelligence',
        what: 'Identify which RCM AI bets deliver value first at Meridian\'s readiness level',
        yourData: 'Data readiness 67% · Tech 52% · Org 41%',
        industry: 'RCM AI median payback: 14 months · $28M base case',
        genome: '3 failure patterns detected · Adjusted success 76% with mitigations',
        output: '5 prioritized investment bets with confidence scores',
      },
      {
        step: 3,
        name: 'Vendor Intelligence',
        what: 'Score RCM AI vendors against your situation, then build the contract and RFP',
        yourData: 'Epic native required · Azure integration · HIPAA BAA mandatory',
        industry: 'Ensemble: 71% success rate · 8 similar wins · $4-6M year 1',
        genome: 'CDO vacancy risk in 3 of 12 Ensemble failures — mitigate before contract',
        output: 'Vendor scorecard + contract intelligence + RFP',
      },
      {
        step: 4,
        name: 'Business Case Intelligence',
        what: 'Build the CFO-defensible business case with three scenarios and risk adjustment',
        yourData: '$13.8M per denial rate point · $6.2M year 1 investment',
        industry: '40th price percentile · Base case achieved 62% of the time',
        genome: 'Risk-adjusted NPV $41M · 76% success with mitigations',
        output: 'Board brief + CFO validation mode',
      },
      {
        step: 5,
        name: 'Outcome Intelligence',
        what: 'Lock the baseline, track savings, trigger the outcome fee when verified',
        yourData: 'Baseline 18.2% denial rate locked · Methodology signed',
        industry: 'Verification threshold: $5M · Third-party audit required',
        genome: 'AbarVa earns 15-20% of verified savings above baseline',
        output: 'Immutable baseline record + quarterly board report',
      },
    ],
    genomeData: {
      successRate: 71,
      outcomeRange: '$28-94M annually',
      failurePattern: 'CDO vacancy at go-live (in 34% of failures)',
      avoidance: 'Appoint CDO interim 90 days before go-live. All 3 closest peers succeeded with this step.',
      sampleSize: 47,
    },
    dataRequirements: [
      { label: 'Claims data (12 months)', loaded: true },
      { label: 'Denial reason codes', loaded: true },
      { label: 'Prior auth payer connections', loaded: true },
      { label: 'Cost per claim by department', loaded: false, unlocks: 'Opportunity sizing' },
      { label: 'CDO org chart', loaded: false, unlocks: 'Governance assessment' },
    ],
    metrics: [
      { icon: '🔴', text: 'Denial rate 18.2% vs 11.4% benchmark — $94M annual gap', source: 'FROM YOUR DATA' },
      { icon: '🔴', text: 'Prior auth 23% automated vs 62% peer average', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: 'Health systems at your size averaged 6.1pp improvement in 14 months', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: '47 deployments in Genome · 71% achieved target', source: 'FROM GENOME' },
      { icon: '🔴', text: '3 failure patterns detected: CDO, prior auth data, vendor selection', source: 'FROM GENOME' },
    ],
  },
  'analytics-modernization-intelligence': {
    code: 'AM-01',
    name: 'Analytics Modernization Intelligence',
    objective: 'Optimise' as const,
    office: 'Back Office',
    vertical: 'All',
    problem: 'We have hundreds of reports, a dozen BI tools, and nobody knows which ones anyone uses. We\'re paying millions to maintain analytics nobody reads.',
    entryHref: '/diagnose',
    products: [
      { name: 'Situation Intelligence', href: '/diagnose', role: 'Full analytics estate picture — inventory, usage, redundancy' },
      { name: 'Business Case Intelligence', href: '/business-case', role: 'Migration ROI model with rationalization savings' },
      { name: 'Vendor Intelligence', href: '/vendor-intelligence', role: 'Cloud stack scored for your situation' },
      { name: 'Data Estate Intelligence', href: '/data-intelligence', role: 'Inventory and rationalize before migrating' },
    ],
    workflow: [
      {
        step: 1,
        name: 'Situation Intelligence',
        what: 'Map the full analytics estate — every tool, every report, every license',
        yourData: '312 apps · 42% redundant · $38M shadow IT',
        industry: '3-4x more tools than needed typical at your size · 62% of reports never accessed',
        genome: 'Most common mistake: migrating before rationalizing',
        output: 'Analytics estate map with rationalization opportunities',
      },
      {
        step: 2,
        name: 'Data Estate Intelligence',
        what: 'Inventory and rationalize before spending on migration',
        yourData: '3 BI platforms overlapping · IT spend 4.5% of revenue',
        industry: 'License rationalization saves $2-4M immediately at your scale',
        genome: '23 engagements · average Year 1 savings $4.2M',
        output: 'Rationalization plan with immediate license savings',
      },
      {
        step: 3,
        name: 'Vendor Intelligence',
        what: 'Select cloud analytics stack scored against your situation',
        yourData: 'Azure infrastructure already in place',
        industry: 'Fabric + PowerBI native at Azure shops: 40% deployment faster',
        genome: 'Vendors chosen on demo quality: 4x higher failure rate',
        output: 'Vendor scorecard + migration RFP',
      },
      {
        step: 4,
        name: 'Business Case Intelligence',
        what: 'Build the CFO model for migration + rationalization ROI',
        yourData: '$38M shadow IT baseline · 312 app inventory',
        industry: '$2-4M immediate · $6.8M by year 3 average',
        genome: 'Risk-adjusted: 74% success rate at your readiness profile',
        output: 'Board brief with 3 scenarios',
      },
    ],
    genomeData: {
      successRate: 74,
      outcomeRange: '$3-8M annual savings',
      failurePattern: 'Migrating before rationalizing (in 68% of failures)',
      avoidance: 'Complete rationalization sprint before any cloud migration begins.',
      sampleSize: 23,
    },
    dataRequirements: [
      { label: 'Application inventory', loaded: true },
      { label: 'BI tool license data', loaded: true },
      { label: 'Report usage analytics', loaded: false, unlocks: 'Rationalization scoring' },
      { label: 'IT spend breakdown', loaded: true },
    ],
    metrics: [
      { icon: '🔴', text: '312 apps in inventory — 42% flagged redundant', source: 'FROM YOUR DATA' },
      { icon: '🔴', text: '$38M shadow IT spend — untracked SaaS', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: 'Organizations your size typically have 3-4x more tools than needed', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: '23 engagements · average $4.2M savings year 1', source: 'FROM GENOME' },
      { icon: '🟢', text: 'License rationalization: $2-4M immediate opportunity identified', source: 'FROM YOUR DATA' },
    ],
  },
  'it-spend-optimization-intelligence': {
    code: 'IT-01',
    name: 'IT Spend Optimization Intelligence',
    objective: 'Optimise' as const,
    office: 'Back Office',
    vertical: 'All',
    problem: 'I\'m spending hundreds of millions on IT. I can\'t tell my CFO what we\'re getting for it or where to cut.',
    entryHref: '/diagnose',
    products: [
      { name: 'Situation Intelligence', href: '/diagnose', role: 'Full IT spend picture — vendor portfolio, SLA status, market rates' },
      { name: 'Vendor Intelligence', href: '/vendor-intelligence', role: 'Optimize current vendors — claim credits, renegotiate, consolidate' },
      { name: 'Business Case Intelligence', href: '/business-case', role: 'Rebalancing model with savings projections' },
      { name: 'Outcome Intelligence', href: '/outcome-intelligence', role: 'Track savings vs IT spend baseline' },
    ],
    workflow: [
      {
        step: 1,
        name: 'Situation Intelligence',
        what: 'Map the full IT spend — every vendor, every contract, every SLA',
        yourData: 'IT spend 4.5% revenue · $2.1M SLA credits unclaimed · 3 contracts renewing',
        industry: 'Organizations your size overpay vendors by 15-25% on average',
        genome: 'Fastest win: claim existing SLA credits (avg 3 weeks)',
        output: 'IT spend map with immediate action items',
      },
      {
        step: 2,
        name: 'Vendor Intelligence — Optimize mode',
        what: 'Claim SLA credits, renegotiate at renewal, consolidate overlapping vendors',
        yourData: 'Ensemble $2.1M credits owed NOW · Epic renewing in 90 days',
        industry: 'Contract timing is the single biggest lever — negotiate at renewal',
        genome: 'Reference clients leverage: $50-100K per major vendor',
        output: 'Credit claims + negotiation briefs + consolidation plan',
      },
      {
        step: 3,
        name: 'Business Case Intelligence',
        what: 'Build the CFO model for IT spend rebalancing',
        yourData: '$2.1M immediate · $8-18M annual potential',
        industry: 'Average savings: $11M year 1 at your scale',
        genome: 'Risk-adjusted: 79% success rate',
        output: 'Board brief with 3 scenarios',
      },
      {
        step: 4,
        name: 'Outcome Intelligence',
        what: 'Lock IT spend baseline, track savings vs target',
        yourData: '$168M annual vendor spend baseline',
        industry: '12-month payback typical',
        genome: '31 engagements · 79% success rate',
        output: 'Vendor spend dashboard + quarterly board report',
      },
    ],
    genomeData: {
      successRate: 79,
      outcomeRange: '$8-18M annual savings',
      failurePattern: 'Negotiating too early — before contract renewal window opens',
      avoidance: 'Map all renewal dates first. Negotiate only within 90-day window for maximum leverage.',
      sampleSize: 31,
    },
    dataRequirements: [
      { label: 'Vendor contract list', loaded: true },
      { label: 'SLA performance data', loaded: true },
      { label: 'IT spend by category', loaded: true },
      { label: 'License utilization data', loaded: false, unlocks: 'License right-sizing analysis' },
    ],
    metrics: [
      { icon: '🔴', text: 'IT spend 4.5% of revenue — above 3.8% peer median', source: 'FROM YOUR DATA' },
      { icon: '🔴', text: '$2.1M in vendor SLA credits unclaimed right now', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: '3 vendor contracts renewing in the next 90 days', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: 'Organizations your size overpay vendors by 15-25% on average', source: 'FROM INDUSTRY' },
      { icon: '🟢', text: '31 IT spend engagements · average $11M savings year 1', source: 'FROM GENOME' },
    ],
  },
  'digital-banking-transformation': {
    code: 'FS-01',
    name: 'Digital Banking Transformation',
    objective: 'Grow' as const,
    office: 'Front Office',
    vertical: 'Financial Services',
    problem: 'Our digital adoption is 26 percentage points behind our competitors. Every point costs us revenue and customers.',
    entryHref: '/diagnose',
    products: [
      { name: 'Situation Intelligence', href: '/diagnose', role: 'Digital adoption picture — gap analysis, FedNow deadline, core system risk' },
      { name: 'AI Investment Intelligence', href: '/ai-strategy', role: 'Which digital bets deliver value fastest at your tech readiness' },
      { name: 'Vendor Intelligence', href: '/vendor-intelligence', role: 'Core modernization and digital banking vendors scored' },
      { name: 'Business Case Intelligence', href: '/business-case', role: 'Transformation ROI model with FedNow compliance cost' },
      { name: 'Outcome Intelligence', href: '/outcome-intelligence', role: 'Track digital adoption vs baseline' },
    ],
    workflow: [
      {
        step: 1,
        name: 'Situation Intelligence',
        what: 'Map the digital adoption gap — core system age, FedNow status, mobile NPS',
        yourData: 'Digital adoption 41% vs 67% benchmark · FIS HORIZON 22 years old',
        industry: 'FedNow compliance cost: $8-14M at your core system age',
        genome: 'Primary failure: underestimating core system integration complexity',
        output: 'Digital gap brief with FedNow deadline path',
      },
      {
        step: 2,
        name: 'AI Investment Intelligence',
        what: 'Which digital AI bets come first at First Capital\'s readiness profile',
        yourData: 'Data readiness 52% · Tech 38% — core system risk',
        industry: 'Banks closing digital gap: $22M annual revenue uplift at your AUM',
        genome: 'CEO sponsor from day 1 in 94% of successes',
        output: 'Prioritized digital bets with readiness gaps identified',
      },
      {
        step: 3,
        name: 'Vendor Intelligence',
        what: 'Select core modernization and digital banking vendors',
        yourData: 'FIS HORIZON replacement or modernization required',
        industry: 'FedNow API layer: 3 vendors with proven HORIZON integration',
        genome: 'Vendor selected on demo quality: 4x failure rate',
        output: 'Vendor scorecard + core modernization RFP',
      },
      {
        step: 4,
        name: 'Business Case Intelligence',
        what: 'Build the board case for transformation investment',
        yourData: '$48M revenue gap · $8-14M FedNow compliance cost',
        industry: '$22M annual uplift at your AUM if gap closed in 24 months',
        genome: 'Risk-adjusted: 68% success with CEO sponsor',
        output: 'Board brief with regulatory compliance timeline',
      },
      {
        step: 5,
        name: 'Outcome Intelligence',
        what: 'Lock digital adoption baseline, track improvement monthly',
        yourData: '41% digital adoption baseline locked',
        industry: 'Monthly NPS tracking · quarterly board report',
        genome: 'AbarVa fee: 15-20% of revenue uplift above baseline',
        output: 'Digital dashboard + board report',
      },
    ],
    genomeData: {
      successRate: 68,
      outcomeRange: '$18-48M annual revenue uplift',
      failurePattern: 'Underestimating core system integration complexity (in 58% of failures)',
      avoidance: 'Complete core system integration assessment before vendor selection. Budget 30% contingency.',
      sampleSize: 34,
    },
    dataRequirements: [
      { label: 'Digital adoption metrics', loaded: true },
      { label: 'Core system architecture', loaded: true },
      { label: 'FedNow compliance status', loaded: true },
      { label: 'Mobile NPS data', loaded: true },
      { label: 'Customer AUM by channel', loaded: false, unlocks: 'Revenue gap sizing' },
    ],
    metrics: [
      { icon: '🔴', text: 'Digital adoption 41% vs 67% peer benchmark — $48M revenue gap', source: 'FROM YOUR DATA' },
      { icon: '🔴', text: 'Core system 22 years old — FIS HORIZON — modernization critical', source: 'FROM YOUR DATA' },
      { icon: '🔴', text: 'FedNow: not compliant — January 2027 hard deadline', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: 'Banks closing digital gap: average $22M annual revenue uplift at your AUM', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: '34 digital banking engagements · 68% success rate', source: 'FROM GENOME' },
    ],
  },
  'ai-portfolio-accountability': {
    code: 'AI-01',
    name: 'AI Portfolio Accountability',
    objective: 'Protect' as const,
    office: 'Middle Office',
    vertical: 'All',
    problem: 'We\'ve spent tens of millions on AI. I can\'t tell the board what\'s working, what isn\'t, or whether any of it was worth it.',
    entryHref: '/diagnose',
    products: [
      { name: 'Situation Intelligence', href: '/diagnose', role: 'AI program current state — which pilots are real, which are stalled' },
      { name: 'AI Investment Intelligence', href: '/ai-strategy', role: 'Re-prioritize AI bets based on Genome success patterns' },
      { name: 'Outcome Intelligence', href: '/outcome-intelligence', role: 'Lock baseline, start tracking, trigger fees on verified savings' },
    ],
    workflow: [
      {
        step: 1,
        name: 'Situation Intelligence',
        what: 'Inventory all AI spend — find the stalled pilots, the shadow AI, the missing baselines',
        yourData: '0 of 6 AI pilots delivering value · 14 AI tools in shadow IT',
        industry: 'Less than 12% of enterprise AI spend has outcome measurement',
        genome: 'Most common finding: leadership thinks pilots are running — data shows zero delivery',
        output: 'AI program current state map',
      },
      {
        step: 2,
        name: 'AI Investment Intelligence',
        what: 'Re-prioritize which AI bets to continue, pause, or cancel',
        yourData: '$42M AI budget committed · $0 in tracked outcomes',
        industry: 'Average value unlocked by accountability reset: $28M',
        genome: 'Genome pattern: pilots fail when no baseline locked before start',
        output: 'Re-prioritized AI portfolio with stop/continue/start decisions',
      },
      {
        step: 3,
        name: 'Outcome Intelligence',
        what: 'Lock baselines for all continuing initiatives. Start tracking.',
        yourData: 'Responsible AI score 52/100 — compliance exposure',
        industry: 'Verification threshold: $5M · fee at 15-20%',
        genome: '41 accountability engagements · 82% success rate',
        output: 'Locked baselines + quarterly board accountability report',
      },
    ],
    genomeData: {
      successRate: 82,
      outcomeRange: '$42M stalled spend unlocked · 90 days',
      failurePattern: 'No baseline locked before pilot start (in 91% of failures)',
      avoidance: 'Lock baseline on day 1 of every pilot. No exceptions.',
      sampleSize: 41,
    },
    dataRequirements: [
      { label: 'AI program inventory', loaded: true },
      { label: 'AI spend by initiative', loaded: true },
      { label: 'Pilot status tracking', loaded: false, unlocks: 'Portfolio accountability map' },
      { label: 'Responsible AI scores', loaded: true },
    ],
    metrics: [
      { icon: '🔴', text: '0 of 6 AI pilots delivering value — $42M stalled', source: 'FROM YOUR DATA' },
      { icon: '🔴', text: '14 AI tools found in shadow IT — not in IT registry', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: 'Less than 12% of enterprise AI spend has documented outcome measurement', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: 'Average value unlocked by accountability reset: $28M', source: 'FROM GENOME' },
      { icon: '🔴', text: 'Responsible AI score 52/100 — compliance exposure', source: 'FROM YOUR DATA' },
    ],
  },
}

// ── Per-client hero metrics ───────────────────────────────────────────────────
const CLIENT_METRICS: Record<string, Partial<Record<Client, Array<{ icon: string; text: string; source: string }>>>> = {
  'HC-01': {
    meridian: [
      { icon: '🔴', text: 'Denial rate 18.2% vs 11.4% benchmark — $94M annual gap', source: 'FROM YOUR DATA' },
      { icon: '🔴', text: 'Prior auth 23% automated vs 62% peer average', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: 'Health systems at your size averaged 6.1pp improvement in 14 months', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: '47 deployments in Genome · 71% achieved target', source: 'FROM GENOME' },
      { icon: '🔴', text: '3 failure patterns detected: CDO, prior auth data, vendor selection', source: 'FROM GENOME' },
    ],
    firstcapital: [
      { icon: '🟡', text: 'No RCM programme active — not applicable for financial services', source: 'FROM YOUR DATA' },
      { icon: '🟢', text: 'Consider FS-01 Digital Banking Transformation instead', source: 'FROM GENOME' },
    ],
    apexretail: [
      { icon: '🟡', text: 'No healthcare revenue cycle operations — not applicable', source: 'FROM YOUR DATA' },
      { icon: '🟢', text: 'Consider AM-01 Analytics Modernization instead', source: 'FROM GENOME' },
    ],
  },
  'AM-01': {
    meridian: [
      { icon: '🔴', text: '312 apps in inventory — 42% flagged redundant', source: 'FROM YOUR DATA' },
      { icon: '🔴', text: '$38M shadow IT spend — untracked SaaS', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: 'Organizations your size typically have 3-4x more tools than needed', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: '23 engagements · average $4.2M savings year 1', source: 'FROM GENOME' },
      { icon: '🟢', text: 'License rationalization: $2-4M immediate opportunity identified', source: 'FROM YOUR DATA' },
    ],
    firstcapital: [
      { icon: '🔴', text: '180 applications — 38% redundancy rate estimated', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: '$22M shadow IT estimated based on headcount', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: '23 engagements · average $4.2M savings year 1', source: 'FROM GENOME' },
    ],
    apexretail: [
      { icon: '🔴', text: '420 applications including full e-commerce stack', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: '5 analytics tools across departments — overlap detected', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: '23 engagements · average $4.2M savings year 1', source: 'FROM GENOME' },
    ],
  },
  'IT-01': {
    meridian: [
      { icon: '🔴', text: 'IT spend 4.5% of revenue — above 3.8% peer median', source: 'FROM YOUR DATA' },
      { icon: '🔴', text: '$2.1M in vendor SLA credits unclaimed right now', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: '3 vendor contracts renewing in the next 90 days', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: 'Organizations your size overpay vendors by 15-25% on average', source: 'FROM INDUSTRY' },
      { icon: '🟢', text: '31 IT spend engagements · average $11M savings year 1', source: 'FROM GENOME' },
    ],
    firstcapital: [
      { icon: '🔴', text: 'IT spend 3.8% of AUM — elevated for community bank', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: '$800K estimated SLA credits based on contract review', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: '31 IT spend engagements · average $11M savings year 1', source: 'FROM GENOME' },
    ],
    apexretail: [
      { icon: '🔴', text: 'IT spend 2.8% of revenue — in range but opportunity exists', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: 'Multiple logistics vendors with capability overlap detected', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: '31 IT spend engagements · average $11M savings year 1', source: 'FROM GENOME' },
    ],
  },
  'FS-01': {
    firstcapital: [
      { icon: '🔴', text: 'Digital adoption 41% vs 67% peer benchmark — $48M revenue gap', source: 'FROM YOUR DATA' },
      { icon: '🔴', text: 'Core system 22 years old — FIS HORIZON — modernization critical', source: 'FROM YOUR DATA' },
      { icon: '🔴', text: 'FedNow: not compliant — January 2027 hard deadline', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: 'Banks closing digital gap: average $22M annual revenue uplift at your AUM', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: '34 digital banking engagements · 68% success rate', source: 'FROM GENOME' },
    ],
    meridian: [
      { icon: '🟡', text: 'Not a financial services organization — see HC-01 instead', source: 'FROM YOUR DATA' },
      { icon: '🟢', text: 'Consider HC-01 Revenue Cycle Intelligence for Meridian', source: 'FROM GENOME' },
    ],
    apexretail: [
      { icon: '🟡', text: 'Retail financial services scope — see AI-01 or AM-01', source: 'FROM YOUR DATA' },
    ],
  },
  'AI-01': {
    meridian: [
      { icon: '🔴', text: '0 of 6 AI pilots delivering value — $42M stalled', source: 'FROM YOUR DATA' },
      { icon: '🔴', text: '14 AI tools found in shadow IT — not in IT registry', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: 'Less than 12% of enterprise AI spend has documented outcome measurement', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: 'Average value unlocked by accountability reset: $28M', source: 'FROM GENOME' },
      { icon: '🔴', text: 'Responsible AI score 52/100 — compliance exposure', source: 'FROM YOUR DATA' },
    ],
    firstcapital: [
      { icon: '🔴', text: 'Fraud ML pilot stalled — no outcome measurement in place', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: 'AI spend estimated $4M — no ROI tracking', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: '41 accountability engagements · 82% success rate', source: 'FROM GENOME' },
    ],
    apexretail: [
      { icon: '🔴', text: 'Personalisation AI deployed — outcomes not measured', source: 'FROM YOUR DATA' },
      { icon: '🔴', text: '$8M AI investment — no baseline locked before deployment', source: 'FROM YOUR DATA' },
      { icon: '🟡', text: '41 accountability engagements · 82% success rate', source: 'FROM GENOME' },
    ],
  },
}

// ── Solution banner (when running in solution mode) ───────────────────────────
function SolutionBanner({
  solution, client, currentStep,
}: {
  solution: typeof SOLUTIONS['revenue-cycle-intelligence'];
  client: Client;
  currentStep: number;
}) {
  return (
    <div style={{
      background: T.surface,
      borderBottom: `1px solid ${T.border}`,
      padding: '10px 32px',
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ fontSize: 10, fontFamily: T.mono, color: T.teal }}>
        {solution.name.toUpperCase()} · {solution.code}
      </div>
      <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary }}>
        Step {currentStep} of {solution.workflow.length}: {solution.workflow[currentStep - 1]?.name}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {solution.workflow.map((s, i) => (
          <div
            key={i}
            style={{
              fontSize: 9, fontFamily: T.mono,
              padding: '2px 8px', borderRadius: 4,
              background: i + 1 === currentStep ? T.teal : i + 1 < currentStep ? 'rgba(45,212,200,0.2)' : 'transparent',
              color: i + 1 === currentStep ? T.bg : i + 1 < currentStep ? T.teal : T.secondary,
              border: `1px solid ${i + 1 <= currentStep ? T.teal : T.border}`,
            }}
          >
            {i + 1 < currentStep ? '✓ ' : ''}{s.name.split(' ')[0]}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Individual solution page content ─────────────────────────────────────────
function SolutionPageContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const clientParam = (searchParams.get('client') as Client) || 'meridian'
  const solution = SOLUTIONS[slug as keyof typeof SOLUTIONS]

  if (!solution) {
    notFound()
  }

  const color = objectiveColor(solution.objective)
  const defaultClient: Client = solution.vertical === 'Financial Services' ? 'firstcapital' : clientParam
  const runUrl = buildSolutionUrl(defaultClient, solution.code)
  const clientMetrics = CLIENT_METRICS[solution.code]?.[defaultClient] ?? solution.metrics

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.sans }}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }` }} />

      {/* Back nav */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: '12px 32px' }}>
        <a
          href="/solutions"
          style={{ fontSize: 12, fontFamily: T.mono, color: T.secondary, textDecoration: 'none' }}
        >
          ← Solution Library
        </a>
      </div>

      {/* Section 1 — Hero */}
      <div style={{
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        padding: '40px 48px',
      }}>
        {/* Color top bar */}
        <div style={{ height: 3, background: color, marginBottom: 24, marginLeft: -32, marginRight: -32, width: 'calc(100% + 64px)' }} />

        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {[solution.code, solution.objective, solution.office, solution.vertical].map(badge => (
              <div key={badge} style={{
                fontSize: 9, fontFamily: T.mono, padding: '2px 8px',
                border: `1px solid ${T.border}`, color: T.secondary, borderRadius: 4,
              }}>
                {badge}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 36, fontFamily: T.fraunces, color: T.text, marginBottom: 12 }}>
            {solution.name}
          </div>
          <div style={{ fontSize: 16, fontFamily: T.sans, color: T.secondary, fontStyle: 'italic', marginBottom: 32, maxWidth: 600 }}>
            &ldquo;{solution.problem}&rdquo;
          </div>

          {/* Five metric tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {clientMetrics.map(({ icon, text, source }) => (
              <div key={text} style={{
                background: T.bg,
                border: `1px solid ${T.border}`,
                borderRadius: 8, padding: 16,
              }}>
                <div style={{
                  fontSize: 8, fontFamily: T.mono, marginBottom: 8,
                  color: source === 'FROM YOUR DATA' ? T.teal
                    : source === 'FROM INDUSTRY' ? T.indigo
                    : '#F472B6',
                }}>
                  {source}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 11, fontFamily: T.sans, color: T.text, lineHeight: 1.4 }}>{text}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            <a
              href={runUrl}
              style={{
                padding: '12px 28px', background: color, color: T.bg,
                border: 'none', borderRadius: 8, fontSize: 13,
                fontFamily: T.mono, fontWeight: 700,
                cursor: 'pointer', textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Run for {CLIENT_LABELS[defaultClient]} →
            </a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 48px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 56, alignItems: 'start' }}>

          {/* LEFT — workflow + run CTA */}
          <div>
            {/* Section 2 — Five-step workflow */}
            <div style={{ marginBottom: 48 }}>
              <div style={{ fontSize: 22, fontFamily: T.fraunces, color: T.text, marginBottom: 32 }}>
                The Five-Step Workflow
              </div>
              {solution.workflow.map((step, i) => (
                <div key={step.step} style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
                  {/* Step number + connector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: T.teal, color: T.bg,
                      fontSize: 14, fontFamily: T.mono, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {step.step}
                    </div>
                    {i < solution.workflow.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: T.border, marginTop: 8, minHeight: 40 }} />
                    )}
                  </div>

                  {/* Step content */}
                  <div style={{ flex: 1, paddingBottom: 16 }}>
                    <div style={{ fontSize: 16, fontFamily: T.sans, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                      {step.name}
                    </div>
                    <div style={{ fontSize: 12, fontFamily: T.sans, color: T.secondary, marginBottom: 16 }}>
                      {step.what}
                    </div>

                    {/* Three-source panel */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                      {[
                        { label: 'FROM YOUR DATA', color: T.teal, text: step.yourData },
                        { label: 'FROM INDUSTRY', color: T.indigo, text: step.industry },
                        { label: 'FROM GENOME', color: '#F472B6', text: step.genome },
                      ].map(({ label, color: c, text }) => (
                        <div key={label} style={{
                          background: T.surface, border: `1px solid ${T.border}`,
                          borderRadius: 6, padding: '10px 12px',
                        }}>
                          <div style={{ fontSize: 8, fontFamily: T.mono, color: c, marginBottom: 6 }}>{label}</div>
                          <div style={{ fontSize: 11, fontFamily: T.sans, color: T.text, lineHeight: 1.4 }}>{text}</div>
                        </div>
                      ))}
                    </div>

                    {/* Output artifact */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px',
                      background: 'rgba(45,212,200,0.08)',
                      border: `1px solid rgba(45,212,200,0.3)`,
                      borderRadius: 6,
                    }}>
                      <span style={{ fontSize: 9, fontFamily: T.mono, color: T.teal }}>OUTPUT:</span>
                      <span style={{ fontSize: 11, fontFamily: T.sans, color: T.text }}>{step.output}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 6 — Run this solution */}
            <div>
              <div style={{ fontSize: 22, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
                Run This Solution
              </div>
              <div style={{
                background: 'rgba(45,212,200,0.06)',
                border: `1px solid rgba(45,212,200,0.25)`,
                borderRadius: 12, padding: 32,
              }}>
                <a
                  href={runUrl}
                  style={{
                    display: 'inline-block',
                    padding: '14px 32px',
                    background: color, color: T.bg,
                    border: 'none', borderRadius: 8,
                    fontSize: 15, fontFamily: T.mono, fontWeight: 700,
                    cursor: 'pointer', textDecoration: 'none',
                    marginBottom: 16,
                  }}
                >
                  Run for {CLIENT_LABELS[defaultClient]} →
                </a>
                <div style={{ fontSize: 12, fontFamily: T.sans, color: T.secondary, lineHeight: 1.6 }}>
                  This will open Situation Intelligence pre-configured for {solution.name}, with {CLIENT_LABELS[defaultClient]} loaded.
                  All {solution.products.length} products will be available in sequence.
                  Estimated time: 45-90 minutes for full analysis.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — products + genome + data requirements */}
          <div>
            {/* Section 3 — Products activated */}
            <div style={{ marginBottom: 48 }}>
              <div style={{ fontSize: 22, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
                Products Activated
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {solution.products.map(product => (
                  <a
                    key={product.name}
                    href={`${product.href}?client=${defaultClient}`}
                    style={{
                      background: T.surface, border: `1px solid ${T.border}`,
                      borderRadius: 8, padding: 16, textDecoration: 'none',
                      display: 'block',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 13, fontFamily: T.sans, fontWeight: 700, color: T.teal, marginBottom: 6 }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: 11, fontFamily: T.sans, color: T.secondary }}>
                      {product.role}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Section 4 — From the Genome */}
            <div style={{ marginBottom: 48 }}>
              <div style={{ fontSize: 22, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
                From the Transformation Genome
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                  <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary, marginBottom: 8 }}>SUCCESS RATE</div>
                  <div style={{ fontSize: 32, fontFamily: T.mono, color: T.teal, marginBottom: 4 }}>{solution.genomeData.successRate}%</div>
                  <div style={{ fontSize: 11, fontFamily: T.sans, color: T.secondary }}>
                    Based on {solution.genomeData.sampleSize} engagements
                  </div>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                  <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary, marginBottom: 8 }}>TYPICAL OUTCOME</div>
                  <div style={{ fontSize: 18, fontFamily: T.mono, color: T.text, marginBottom: 4 }}>{solution.genomeData.outcomeRange}</div>
                  <div style={{ fontSize: 11, fontFamily: T.sans, color: T.secondary }}>
                    Across {solution.genomeData.sampleSize} Genome engagements
                  </div>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.amber}`, borderRadius: 8, padding: 20 }}>
                  <div style={{ fontSize: 10, fontFamily: T.mono, color: T.amber, marginBottom: 8 }}>MOST COMMON FAILURE</div>
                  <div style={{ fontSize: 12, fontFamily: T.sans, color: T.text, marginBottom: 8 }}>
                    {solution.genomeData.failurePattern}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>
                    Avoidance: {solution.genomeData.avoidance}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5 — Data requirements */}
            <div>
              <div style={{ fontSize: 22, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
                Data Requirements
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                {solution.dataRequirements.map((req, i) => (
                  <div
                    key={req.label}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      borderBottom: i < solution.dataRequirements.length - 1 ? `1px solid ${T.border}` : 'none',
                    }}
                  >
                    <span style={{ color: req.loaded ? T.green : T.red, fontSize: 14, flexShrink: 0 }}>
                      {req.loaded ? '✓' : '✗'}
                    </span>
                    <span style={{ fontSize: 12, fontFamily: T.sans, color: T.text, flex: 1 }}>
                      {req.label}
                    </span>
                    {!req.loaded && 'unlocks' in req && (
                      <span style={{ fontSize: 10, fontFamily: T.mono, color: T.amber }}>
                        Unlocks: {req.unlocks}
                      </span>
                    )}
                    {!req.loaded && (
                      <button style={{
                        fontSize: 10, fontFamily: T.mono, padding: '3px 8px',
                        background: 'transparent', border: `1px solid ${T.border}`,
                        color: T.secondary, borderRadius: 4, cursor: 'pointer',
                      }}>
                        Download template →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function SolutionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return (
    <Suspense>
      <SolutionPageContent slug={slug} />
    </Suspense>
  )
}

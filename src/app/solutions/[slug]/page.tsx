'use client'

import { Suspense, use } from 'react'
import { useSearchParams, notFound } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
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

  // ── AbarVa macro solutions ─────────────────────────────────────────────────
  'pdlc': {
    code: 'XF-01',
    name: 'AI-Powered PDLC',
    objective: 'Optimise' as const,
    office: 'All Offices',
    vertical: 'All',
    problem: 'We\'re spending $300M in capital. Time to production is 16 months. My engineers aren\'t building — they\'re in meetings.',
    entryHref: '/diagnose',
    products: [
      { name: 'Situation Intelligence', href: '/diagnose', role: 'Map where time and capital are being lost in your delivery cycle' },
      { name: 'AI Investment Intelligence', href: '/ai-strategy', role: 'Which AI-native delivery bets unblock the most throughput first' },
      { name: 'Vendor Intelligence', href: '/vendor-intelligence', role: 'Score PDLC tooling vendors against your architecture and readiness' },
      { name: 'Business Case Intelligence', href: '/business-case', role: 'CFO model: consulting reduction + delivery acceleration ROI' },
      { name: 'Outcome Intelligence', href: '/outcome-intelligence', role: 'Lock baseline cycle time, track delivery improvement quarterly' },
    ],
    workflow: [
      { step: 1, name: 'Situation Intelligence', what: 'Map every friction point in your delivery cycle — meetings, approvals, rework, idle time', yourData: 'Avg cycle time 16 months · 40% engineer time in meetings · $300M capital in flight', industry: 'AI-native organizations: 8-month avg cycle time · 60% less meeting overhead', genome: '38 PDLC engagements · biggest gains from eliminating approval chains (avg 3.2 months saved)', output: 'PDLC diagnostic with friction map and time-cost breakdown' },
      { step: 2, name: 'AI Investment Intelligence', what: 'Identify which AI bets remove the most drag from your delivery cycle', yourData: 'Sprint velocity, approval chain count, build vs buy ratio, handoff frequency', industry: 'AI pair programming: 30-40% productivity gain · Automated review: 2-week cycle reduction', genome: 'Top 3 highest-ROI PDLC interventions at your profile: coding AI, automated QA, async approvals', output: '5 prioritized PDLC AI interventions with cycle-time impact per bet' },
      { step: 3, name: 'Vendor Intelligence', what: 'Score PDLC tooling — AI coding, automated testing, async review platforms', yourData: 'Existing stack compatibility · security requirements · language mix', industry: 'GitHub Copilot vs Cursor vs internal: 340 deployment outcomes across verticals', genome: 'Tooling choice accounts for 18% of outcome variance — integration depth matters most', output: 'Vendor scorecard for top 3 PDLC tooling categories' },
      { step: 4, name: 'Business Case Intelligence', what: 'Quantify the ROI: consulting reduction, engineer time recovery, faster revenue capture', yourData: '$300M capital · $18M estimated consulting spend · 820-person engineering org', industry: '8-month acceleration = 1 additional product cycle per year = $40-90M additional revenue capture', genome: 'Avg consulting reduction: $18M · Avg delivery acceleration: 6 months · Payback: 11 months', output: 'Board brief: $18M consulting reduction + delivery acceleration model' },
      { step: 5, name: 'Outcome Intelligence', what: 'Lock baseline cycle time, track improvement every quarter, tie AbarVa fee to verified gains', yourData: 'Baseline 16-month cycle locked · Methodology signed before engagement starts', industry: 'AbarVa earns 15-20% of verified savings above baseline', genome: 'Verification: 3rd-party sprint velocity audit + consultant headcount delta', output: 'Immutable PDLC baseline + quarterly improvement report' },
    ],
    genomeData: { successRate: 74, outcomeRange: '$12–40M annually', failurePattern: 'Tooling adoption without process change (in 41% of failures)', avoidance: 'Pair every AI tool deployment with a workflow redesign sprint.', sampleSize: 38 },
    dataRequirements: [
      { label: 'Sprint velocity data (6 months)', loaded: false, unlocks: 'Cycle time baseline' },
      { label: 'Consultant headcount + spend', loaded: false, unlocks: 'ROI model' },
      { label: 'Approval chain map', loaded: false, unlocks: 'Friction analysis' },
      { label: 'Engineering org chart', loaded: false, unlocks: 'Capacity model' },
    ],
    metrics: [
      { icon: '🔴', text: 'Time to production 16 months vs 8-month AI-native benchmark', source: 'FROM INDUSTRY' },
      { icon: '🔴', text: '$18M annual consulting spend — 80% of which re-onboards knowledge weekly', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: '40% of engineer time in meetings and approvals, not building', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: '38 PDLC engagements · 74% achieve target cycle time reduction', source: 'FROM GENOME' },
      { icon: '🟢', text: 'Average delivery acceleration: 6 months — one additional product cycle per year', source: 'FROM GENOME' },
    ],
  },

  'delivery': {
    code: 'XD-01',
    name: 'AI-Powered Transformation Delivery',
    objective: 'Optimise' as const,
    office: 'All Offices',
    vertical: 'All',
    problem: '80 consultants on site. 70% of their time is getting up to speed. Knowledge walks out the door every Friday.',
    entryHref: '/diagnose',
    products: [
      { name: 'Situation Intelligence', href: '/diagnose', role: 'Diagnose how much of your consulting spend is knowledge re-onboarding vs actual work' },
      { name: 'AI Investment Intelligence', href: '/ai-strategy', role: 'Design the Maestro model: where human experts stay and AI handles the rest' },
      { name: 'Business Case Intelligence', href: '/business-case', role: '4 Maestros vs 40 consultants: the full financial comparison' },
      { name: 'Outcome Intelligence', href: '/outcome-intelligence', role: 'Track knowledge permanence, delivery velocity, and cost per outcome quarterly' },
    ],
    workflow: [
      { step: 1, name: 'Situation Intelligence', what: 'Diagnose your consulting model — where the spend goes, where knowledge evaporates', yourData: 'Consultant headcount · billing rate · onboarding time per engagement · knowledge retention rate', industry: 'Large consulting firms: 65-75% of time is knowledge acquisition, not delivery', genome: '29 delivery model engagements · avg $22M annual consulting spend replaced by Maestro model', output: 'Consulting diagnostic: cost per insight delivered, knowledge permanence rate' },
      { step: 2, name: 'Maestro Model Design', what: 'Map which work Maestros handle vs AI agents vs client staff', yourData: 'Engagement types · knowledge domains · regulatory requirements · recurring vs one-time work', industry: '4 Maestros with permanent knowledge layer = 40 consultants without one', genome: 'Knowledge layer ingestion: 3 months to full capability · maintained indefinitely', output: 'Maestro operating model: staffing, AI layer, knowledge architecture' },
      { step: 3, name: 'Knowledge Layer Build', what: 'Ingest your environment: systems, processes, decisions, org knowledge', yourData: 'Your systems landscape, documented processes, org charts, historical decisions', industry: 'Average enterprise knowledge layer: 200+ data sources ingested in 90 days', genome: 'Meridian Health: 225 jobs, 160 schemas, 236 Tableau workbooks — now answers in seconds', output: 'Permanent, searchable knowledge layer — answers in seconds vs weeks of asking' },
      { step: 4, name: 'Business Case Intelligence', what: 'Model the full economic comparison: Maestros vs current consulting model', yourData: 'Current consulting spend · headcount · engagement frequency · re-onboarding cost', industry: '$4M Maestro engagement vs $40M equivalent consulting spend — $36M annual difference', genome: 'Avg consulting reduction: $22M · Knowledge permanence: indefinite · Payback: 4 months', output: 'CFO brief: 4 Maestros vs 40 consultants economic comparison' },
      { step: 5, name: 'Outcome Intelligence', what: 'Track delivery velocity, knowledge permanence, consulting cost reduction quarterly', yourData: 'Baseline consulting spend locked · Methodology signed before engagement', industry: 'AbarVa earns 15-20% of verified consulting cost savings', genome: 'Verification: headcount audit + knowledge retrieval speed test + delivery milestone tracking', output: 'Quarterly outcome report: cost reduction + knowledge permanence metrics' },
    ],
    genomeData: { successRate: 82, outcomeRange: '$18–45M annually', failurePattern: 'Knowledge layer not built before Maestros are deployed (in 38% of failures)', avoidance: 'Build the knowledge layer in parallel with engagement kickoff — never after.', sampleSize: 29 },
    dataRequirements: [
      { label: 'Consulting spend breakdown (12 months)', loaded: false, unlocks: 'ROI model' },
      { label: 'Engagement frequency + type log', loaded: false, unlocks: 'Maestro model sizing' },
      { label: 'Systems landscape inventory', loaded: false, unlocks: 'Knowledge layer design' },
      { label: 'Org chart + decision authority map', loaded: false, unlocks: 'Knowledge domain mapping' },
    ],
    metrics: [
      { icon: '🔴', text: '70% of large consulting time is re-onboarding, not delivering', source: 'FROM INDUSTRY' },
      { icon: '🔴', text: 'Knowledge walks out the door every Friday — no institutional permanence', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: '4 Maestros with AI knowledge layer = 40 traditional consultants', source: 'FROM GENOME' },
      { icon: '🟡', text: '29 delivery model engagements · 82% achieve target cost reduction', source: 'FROM GENOME' },
      { icon: '🟢', text: 'Average annual consulting reduction: $22M · Payback in 4 months', source: 'FROM GENOME' },
    ],
  },

  'margin': {
    code: 'XM-01',
    name: 'Margin Optimization',
    objective: 'Grow' as const,
    office: 'Back Office',
    vertical: 'All',
    problem: 'Operating margin 1.8% against a 4% target. Don\'t know exactly where the margin is leaking or which lever to pull first.',
    entryHref: '/diagnose',
    products: [
      { name: 'Situation Intelligence', href: '/diagnose', role: 'Surface every margin leak — revenue, cost, vendor, and AI investment' },
      { name: 'AI Investment Intelligence', href: '/ai-strategy', role: 'Rank the AI interventions that recover the most margin per dollar spent' },
      { name: 'Vendor Intelligence', href: '/vendor-intelligence', role: 'Recover margin from vendor overpayment and SLA breaches' },
      { name: 'Business Case Intelligence', href: '/business-case', role: 'CFO model: $60-120M margin recovery path with three scenarios' },
      { name: 'Outcome Intelligence', href: '/outcome-intelligence', role: 'Lock margin baseline, track recovery quarterly, trigger outcome fee' },
    ],
    workflow: [
      { step: 1, name: 'Situation Intelligence', what: 'Map every margin leak — revenue cycle, vendor overpayment, AI waste, operational inefficiency', yourData: 'P&L by business unit · vendor spend · AI investment inventory · benchmark gap analysis', industry: 'Organizations your size: median margin gap 2.2pp vs target · $60-120M average recovery opportunity', genome: '52 margin engagements · top 3 leak sources: vendor overpayment (34%), AI underperformance (28%), process waste (22%)', output: 'Margin waterfall: every leak quantified with recovery probability' },
      { step: 2, name: 'Prioritize Interventions', what: 'Rank every margin recovery lever by ROI, speed, and execution risk', yourData: 'Margin waterfall from Step 1 · execution capacity · risk tolerance', industry: 'Fastest margin recovery: vendor renegotiation (60-90 days) · Largest: AI portfolio reset (12-18 months)', genome: '90-day quick wins avg $8M · 12-month program avg $42M · combined path: $60-120M at 3 years', output: '90-day sprint plan + 12-month program roadmap with owner and expected recovery per initiative' },
      { step: 3, name: 'Vendor Intelligence', what: 'Recover margin from the vendor portfolio: SLA credits, renegotiations, consolidation', yourData: 'Full vendor contracts · SLA breach history · market rate benchmarks', industry: 'Organizations overpay vendors by 15-25% on average · SLA credits unclaimed in 68% of cases', genome: 'Vendor margin recovery: avg $11M per engagement in Year 1', output: 'Vendor recovery plan: SLA demands, renegotiation playbooks, consolidation targets' },
      { step: 4, name: 'Business Case Intelligence', what: 'Build the CFO model for the full margin recovery program', yourData: 'Margin waterfall · intervention roadmap · vendor recovery plan', industry: '$60-120M 3-year recovery at your scale · payback under 8 months for vendor initiatives', genome: 'Risk-adjusted: 74% of engagements achieve base case margin target within 24 months', output: 'Board brief: margin recovery path with 3 scenarios, NPV, and milestone plan' },
      { step: 5, name: 'Outcome Intelligence', what: 'Lock margin baseline, track recovery every quarter, trigger AbarVa outcome fee on verified gains', yourData: 'Baseline operating margin locked at engagement start · methodology signed', industry: 'AbarVa earns 15-20% of verified margin improvement above baseline', genome: 'Verification: audited P&L delta + third-party margin measurement methodology', output: 'Quarterly margin recovery report: verified gains, remaining opportunity, next lever' },
    ],
    genomeData: { successRate: 74, outcomeRange: '$60–120M over 3 years', failurePattern: 'Addressing symptoms not root causes — vendor renegotiation without AI portfolio reset (31% of partial failures)', avoidance: 'Run Situation Intelligence before prioritizing — the leak source is almost never where leadership assumes.', sampleSize: 52 },
    dataRequirements: [
      { label: 'P&L by business unit (12 months)', loaded: false, unlocks: 'Margin waterfall' },
      { label: 'Full vendor contract inventory', loaded: false, unlocks: 'Vendor recovery analysis' },
      { label: 'AI investment registry + ROI tracking', loaded: false, unlocks: 'AI portfolio reset' },
      { label: 'Benchmark comparison (peer set)', loaded: false, unlocks: 'Gap quantification' },
    ],
    metrics: [
      { icon: '🔴', text: 'Operating margin gap vs 4% target — $60-120M annual recovery opportunity', source: 'FROM INDUSTRY' },
      { icon: '🔴', text: 'Vendor overpayment estimated 15-25% above market rate — SLA credits unclaimed', source: 'FROM INDUSTRY' },
      { icon: '🟡', text: 'AI portfolio underperformance: 28% of margin leakage at comparable organizations', source: 'FROM GENOME' },
      { icon: '🟡', text: '52 margin engagements · 74% achieve base case target within 24 months', source: 'FROM GENOME' },
      { icon: '🟢', text: '90-day quick wins avg $8M · 12-month program avg $42M', source: 'FROM GENOME' },
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

// ── Individual solution page content ─────────────────────────────────────────
function SolutionPageContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const clientParam = (searchParams.get('client') as Client) || 'meridian'
  const solution = SOLUTIONS[slug as keyof typeof SOLUTIONS]

  if (!solution) {
    notFound()
  }

  const defaultClient: Client = solution.vertical === 'Financial Services' ? 'firstcapital' : clientParam
  const runUrl = buildSolutionUrl(defaultClient, solution.code)
  const clientMetrics = CLIENT_METRICS[solution.code]?.[defaultClient] ?? solution.metrics
  const { genomeData } = solution
  const clientLabel = CLIENT_LABELS[defaultClient]

  return (
    <div style={{minHeight:'100vh',background:'#060A12',fontFamily:'"DM Sans",sans-serif',color:'#EFF6FF'}}>
      <AbarvaNav />
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }` }} />

      {/* SECTION 1 — IMPACT HERO */}
      <div style={{
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        padding: '48px 0',
        marginLeft: -28,
        marginRight: -28,
        paddingLeft: 28,
        paddingRight: 28,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 48, alignItems: 'start' }}>

          {/* Left column — 60% */}
          <div>
            {/* Back link + badges row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <a
                href="/solutions"
                style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, textDecoration: 'none' }}
              >
                ← Solutions
              </a>
              <div style={{ width: 1, height: 14, background: T.border }} />
              <div style={{
                fontSize: 9, fontFamily: T.mono, padding: '2px 10px',
                border: `1px solid rgba(45,212,200,0.4)`,
                color: T.teal, borderRadius: 4,
              }}>
                {solution.code}
              </div>
              <div style={{
                fontSize: 9, fontFamily: T.mono, padding: '2px 10px',
                border: `1px solid ${T.border}`,
                color: T.secondary, borderRadius: 4,
              }}>
                {solution.objective}
              </div>
            </div>

            {/* Solution name */}
            <div style={{ fontSize: 44, fontFamily: T.fraunces, color: T.text, fontWeight: 700, marginBottom: 20, lineHeight: 1.1 }}>
              {solution.name}
            </div>

            {/* Problem quote */}
            <div style={{
              fontSize: 18, fontFamily: T.sans, color: T.secondary,
              fontStyle: 'italic', maxWidth: 560,
              borderLeft: `3px solid ${T.teal}`,
              paddingLeft: 16, marginBottom: 28, lineHeight: 1.6,
            }}>
              &ldquo;{solution.problem}&rdquo;
            </div>

            {/* Big stat badges */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
              <div style={{
                padding: '14px 20px',
                background: 'rgba(45,212,200,0.08)',
                border: `1px solid rgba(45,212,200,0.3)`,
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 32, fontFamily: T.mono, color: T.teal, fontWeight: 700, lineHeight: 1 }}>
                  {genomeData.successRate}%
                </div>
                <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary, marginTop: 4 }}>
                  Success Rate
                </div>
              </div>
              <div style={{
                padding: '14px 20px',
                background: 'rgba(45,212,200,0.08)',
                border: `1px solid rgba(45,212,200,0.3)`,
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 32, fontFamily: T.mono, color: T.teal, fontWeight: 700, lineHeight: 1 }}>
                  {genomeData.sampleSize}
                </div>
                <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary, marginTop: 4 }}>
                  Engagements
                </div>
              </div>
              <div style={{
                padding: '14px 20px',
                background: 'rgba(245,158,11,0.08)',
                border: `1px solid rgba(245,158,11,0.3)`,
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 22, fontFamily: T.fraunces, color: T.amber, fontWeight: 700, lineHeight: 1.2 }}>
                  {genomeData.outcomeRange}
                </div>
                <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary, marginTop: 4 }}>
                  Typical Outcome
                </div>
              </div>
            </div>

            {/* CTA button */}
            <a
              href={runUrl}
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: T.teal, color: T.bg,
                border: 'none', borderRadius: 8,
                fontSize: 16, fontFamily: T.mono, fontWeight: 700,
                cursor: 'pointer', textDecoration: 'none',
              }}
            >
              Start this Solution →
            </a>
          </div>

          {/* Right column — 40% */}
          <div>
            <div style={{ fontSize: 10, fontFamily: T.mono, color: T.teal, letterSpacing: '0.1em', marginBottom: 16 }}>
              EVIDENCE — WHAT WE ALREADY KNOW
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {clientMetrics.map(({ icon, text, source }) => (
                <div
                  key={text}
                  style={{
                    background: T.bg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: '12px 14px',
                  }}
                >
                  <div style={{
                    fontSize: 8, fontFamily: T.mono, marginBottom: 6,
                    color: source === 'FROM YOUR DATA' ? T.teal
                      : source === 'FROM INDUSTRY' ? T.indigo
                      : '#F472B6',
                  }}>
                    {source}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 11, fontFamily: T.sans, color: T.text, lineHeight: 1.4 }}>{text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2 — WORKFLOW */}
      <div style={{ padding: '48px 0', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 26, fontFamily: T.fraunces, color: T.text, marginBottom: 36 }}>
          The {solution.workflow.length}-Step Workflow
        </div>

        {solution.workflow.map((step, i) => (
          <div key={step.step} style={{ display: 'flex', gap: 24, marginBottom: 36 }}>
            {/* Step number + connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: T.teal, color: T.bg,
                fontSize: 14, fontFamily: T.mono, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {step.step}
              </div>
              {i < solution.workflow.length - 1 && (
                <div style={{ width: 2, flex: 1, background: T.border, marginTop: 8, minHeight: 40 }} />
              )}
            </div>

            {/* Step content */}
            <div style={{ flex: 1, paddingBottom: 16 }}>
              <div style={{ fontSize: 18, fontFamily: T.sans, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                {step.name}
              </div>
              <div style={{ fontSize: 13, fontFamily: T.sans, color: T.secondary, marginBottom: 16 }}>
                {step.what}
              </div>

              {/* Three source tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                {[
                  { label: 'YOUR DATA', borderColor: T.teal, text: step.yourData },
                  { label: 'INDUSTRY', borderColor: T.indigo, text: step.industry },
                  { label: 'GENOME', borderColor: '#F472B6', text: step.genome },
                ].map(({ label, borderColor, text }) => (
                  <div key={label} style={{
                    background: T.surface,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 6, padding: '10px 12px',
                  }}>
                    <div style={{ fontSize: 8, fontFamily: T.mono, color: borderColor, marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 11, fontFamily: T.sans, color: T.text, lineHeight: 1.4 }}>{text}</div>
                  </div>
                ))}
              </div>

              {/* Output badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                background: 'rgba(45,212,200,0.08)',
                border: `1px solid rgba(45,212,200,0.3)`,
                borderRadius: 6,
              }}>
                <span style={{ fontSize: 9, fontFamily: T.mono, color: T.teal, fontWeight: 700 }}>OUTPUT:</span>
                <span style={{ fontSize: 11, fontFamily: T.sans, color: T.text }}>{step.output}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 3 — INVESTOR PROOF BAR */}
      <div style={{
        background: T.surface,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
        padding: '32px 0',
        marginLeft: -28,
        marginRight: -28,
        paddingLeft: 28,
        paddingRight: 28,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48 }}>
          {/* Col 1 — Success Rate */}
          <div>
            <div style={{ fontSize: 56, fontFamily: T.mono, color: T.teal, fontWeight: 700, lineHeight: 1 }}>
              {genomeData.successRate}%
            </div>
            <div style={{ fontSize: 13, fontFamily: T.sans, color: T.text, fontWeight: 600, marginTop: 8, marginBottom: 4 }}>
              Success Rate
            </div>
            <div style={{ fontSize: 11, fontFamily: T.sans, color: T.secondary }}>
              Based on {genomeData.sampleSize} engagements
            </div>
          </div>

          {/* Col 2 — Typical Outcome */}
          <div>
            <div style={{ fontSize: 32, fontFamily: T.fraunces, color: T.text, lineHeight: 1.2 }}>
              {genomeData.outcomeRange}
            </div>
            <div style={{ fontSize: 13, fontFamily: T.sans, color: T.text, fontWeight: 600, marginTop: 8, marginBottom: 4 }}>
              Typical Outcome
            </div>
            <div style={{ fontSize: 11, fontFamily: T.sans, color: T.secondary }}>
              From Genome data
            </div>
          </div>

          {/* Col 3 — Critical Avoidance */}
          <div>
            <div style={{ fontSize: 10, fontFamily: T.mono, color: T.amber, letterSpacing: '0.1em', marginBottom: 10 }}>
              CRITICAL AVOIDANCE
            </div>
            <div style={{ fontSize: 13, fontFamily: T.sans, color: T.text, marginBottom: 8, lineHeight: 1.5 }}>
              {genomeData.failurePattern}
            </div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, lineHeight: 1.5 }}>
              {genomeData.avoidance}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4 — BOTTOM GRID */}
      <div style={{ padding: '48px 0 64px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

          {/* Left — Products Activated */}
          <div>
            <div style={{ fontSize: 22, fontFamily: T.fraunces, color: T.text, marginBottom: 20 }}>
              Products Activated
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {solution.products.map(product => (
                <a
                  key={product.name}
                  href={`${product.href}?client=${defaultClient}`}
                  style={{
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: '14px 16px', textDecoration: 'none',
                    display: 'block',
                  }}
                >
                  <div style={{ fontSize: 13, fontFamily: T.sans, fontWeight: 700, color: T.teal, marginBottom: 4 }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: T.sans, color: T.secondary }}>
                    {product.role}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Right — Data Requirements */}
          <div>
            <div style={{ fontSize: 22, fontFamily: T.fraunces, color: T.text, marginBottom: 20 }}>
              Data Requirements
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {solution.dataRequirements.map((req, i) => (
                <div
                  key={req.label}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 16px',
                    borderBottom: i < solution.dataRequirements.length - 1 ? `1px solid ${T.border}` : 'none',
                  }}
                >
                  <span style={{
                    color: req.loaded ? T.green : T.amber,
                    fontSize: 15, flexShrink: 0, marginTop: 1,
                  }}>
                    {req.loaded ? '✓' : '○'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontFamily: T.sans, color: T.text }}>
                      {req.label}
                    </div>
                    {!req.loaded && 'unlocks' in req && (
                      <div style={{ fontSize: 10, fontFamily: T.mono, color: T.amber, marginTop: 3 }}>
                        Unlocks: {req.unlocks}
                      </div>
                    )}
                  </div>
                </div>
              ))}
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

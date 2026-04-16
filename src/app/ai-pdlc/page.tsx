'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { useClientContext, ALL_CLIENTS } from '@/lib/use-client-context'

// ── Design System ──────────────────────────────────────────────────────────────
const BG = '#060A12'
const CARD = '#0D1520'
const BORDER = '#1C2D45'
const TEAL = '#2DD4C8'
const WHITE = '#EFF6FF'
const MUTED = 'rgba(255,255,255,0.75)'
const DIM = 'rgba(255,255,255,0.6)'
const MONO = 'JetBrains Mono, monospace'
const SANS = 'DM Sans, sans-serif'
const SERIF = 'Georgia, serif'
const RED = '#EF4444'
const AMBER = '#F59E0B'
const GREEN = '#34D399'
const INDIGO = '#818CF8'

// ── AI Initiative Portfolio ────────────────────────────────────────────────────
type InitStatus = 'live-underperforming' | 'live-limited' | 'live-legacy' | 'stalled' | 'cancelled' | 'planning'
type RootCause = 'cdo' | 'cro' | 'fsc' | 'bloomberg' | 'data' | 'none'

interface Initiative {
  id: string
  name: string
  status: InitStatus
  category: 'Front Office' | 'Middle Office' | 'Back Office'
  investment: number   // $M
  valueCommitted: number  // $M annual
  valueActual: number  // $M actual annual
  monthsStuck: number
  blocker: string
  rootCause: RootCause
  outcome: string
  recommendation: string
}

const INITIATIVES: Initiative[] = [
  // LIVE — UNDERPERFORMING
  {
    id: 'i-01', name: 'Client Churn Prediction', status: 'live-underperforming',
    category: 'Front Office', investment: 12.2, valueCommitted: 84, valueActual: 18,
    monthsStuck: 6, rootCause: 'fsc',
    blocker: 'FSC 44% adoption — 56% of client signals absent from training data',
    outcome: '61% accuracy vs 78% design target. 34% false positive rate — advisors distrust the output. $12.2M invested delivering $18M of the $84M committed value.',
    recommendation: 'SSO Bloomberg→FSC is the single fix. Raises FSC adoption without behaviour change. Retrain model after adoption reaches 80%+. Expected: 78% accuracy, 14% false positive rate.',
  },
  {
    id: 'i-02', name: 'Trade Surveillance AI', status: 'live-limited',
    category: 'Middle Office', investment: 4.8, valueCommitted: 22, valueActual: 7.2,
    monthsStuck: 0, rootCause: 'bloomberg',
    blocker: 'Bloomberg AIM US desk FIX format incompatibility — EMEA-only, 60% of volume out of scope',
    outcome: '89% recall on wash trades and layering patterns — EMEA only. 3 FCA escalations in 14 months. Extension to global requires Bloomberg API modernisation (Phase 4, $22M, not started).',
    recommendation: 'Bloomberg AIM API modernisation (Phase 4) unlocks global extension. December 2026 renewal negotiation window is the leverage point. Negotiate FIX data standardisation as renewal condition.',
  },
  {
    id: 'i-03', name: 'ESG Screening Rules Engine', status: 'live-legacy',
    category: 'Front Office', investment: 2.1, valueCommitted: 12, valueActual: 9.8,
    monthsStuck: 0, rootCause: 'none',
    blocker: 'Rules-based system cannot adapt to new ESG criteria without manual rule changes',
    outcome: 'Functional — screens 97% of positions against exclusion lists. 3 institutional clients requesting dynamic ESG scoring the system cannot deliver. EU AI Act classification pending.',
    recommendation: 'Superseded by Automated ESG Scoring (ML) initiative — currently stalled by CRO freeze. Once governance framework established, migrate to ML model and retire rules engine.',
  },
  // STALLED
  {
    id: 'i-04', name: 'Intelligent Portfolio Construction', status: 'stalled',
    category: 'Front Office', investment: 18.4, valueCommitted: 120, valueActual: 0,
    monthsStuck: 8, rootCause: 'cdo',
    blocker: 'CDO vacancy + no golden record + Bloomberg AIM API — 3 prerequisites, all blocked',
    outcome: 'RL model design complete. Data pipeline architecture blocked by 14-silo problem. $18.4M invested, $0 value. 8 months no progress.',
    recommendation: 'Prerequisite chain: CDO hire → golden record (12 months) → Bloomberg API layer (18 months) → model training → deployment. Highest-value initiative but Wave 3 only — cannot shortcut the sequence.',
  },
  {
    id: 'i-05', name: 'Automated ESG Scoring (ML)', status: 'stalled',
    category: 'Middle Office', investment: 8.6, valueCommitted: 45, valueActual: 0,
    monthsStuck: 9, rootCause: 'cro',
    blocker: 'CRO governance freeze + CDO vacancy — circular dependency',
    outcome: 'PoC on Clarity AI data showed 22% improvement over rules engine. CRO blocked sign-off — governance required. CDO vacancy means no data sourcing standards to satisfy CRO.',
    recommendation: 'AI Governance Framework (Wave 1) resolves the CRO blocker. CDO hire resolves data sourcing standards. Both are Wave 1 prerequisites. This initiative is Wave 2 — sequence is correct.',
  },
  {
    id: 'i-06', name: 'Regulatory Change Monitor', status: 'stalled',
    category: 'Middle Office', investment: 7.8, valueCommitted: 15, valueActual: 0,
    monthsStuck: 7, rootCause: 'cro',
    blocker: 'Legal freeze — MAS FEAT non-compliance means no new AI deployments until existing models are documented',
    outcome: 'NLP pipeline built, 94% accuracy in sandbox. Legal froze deployment when MAS FEAT crisis surfaced — irony: the tool that monitors regulatory changes is itself blocked by regulatory non-compliance.',
    recommendation: 'Fastest unlock: MAS FEAT remediation (document existing 3 models). Once legal freeze lifted, this is ready to deploy. Target: live within 60 days of governance framework approval.',
  },
  {
    id: 'i-07', name: 'Client Risk Profiling AI', status: 'stalled',
    category: 'Front Office', investment: 5.2, valueCommitted: 28, valueActual: 0,
    monthsStuck: 7, rootCause: 'fsc',
    blocker: 'Salesforce FSC 44% adoption — 56% of client records missing behavioural data',
    outcome: 'Model architecture complete. Training data pull found 56% of client records missing behavioural signals — only available for FSC portal users. Cannot achieve 82% target accuracy.',
    recommendation: 'Identical blocker to Client Churn model. Bloomberg→FSC SSO fix resolves both. Single infrastructure change unlocks two $5M+ invested initiatives.',
  },
  {
    id: 'i-08', name: 'Alternative Data Integration Platform', status: 'stalled',
    category: 'Front Office', investment: 6.2, valueCommitted: 32, valueActual: 0,
    monthsStuck: 11, rootCause: 'cdo',
    blocker: 'CDO vacancy — no authority to make data sourcing, MNPI risk, and vendor sign-off decisions',
    outcome: 'RFP completed, 4 vendors evaluated (Quandl, Thinknum, Preqin, Two Sigma). Legal raised MNPI concerns. 11 months blocked — longest-stalled initiative in portfolio.',
    recommendation: 'CDO hire unlocks this immediately — this is the top priority for the incoming CDO. Legal MNPI framework is a 30-day exercise once CDO makes data governance calls.',
  },
  {
    id: 'i-09', name: 'Portfolio Attribution AI', status: 'stalled',
    category: 'Front Office', investment: 3.4, valueCommitted: 18, valueActual: 0,
    monthsStuck: 9, rootCause: 'bloomberg',
    blocker: 'BlackRock Aladdin attribution API not exposed for external ML consumption',
    outcome: 'Design complete. BlackRock confirmed attribution calculation API is reporting-only — no external ML access. Parallel attribution engine risks conflicting Aladdin outputs and compliance exposure.',
    recommendation: 'Negotiate Aladdin API access at March 2027 renewal. Daily stress testing non-compliance gives leverage — Aladdin must fix the daily cadence problem and can negotiate API terms at the same time.',
  },
  {
    id: 'i-10', name: 'Trade Cost Analysis (TCA) AI', status: 'stalled',
    category: 'Middle Office', investment: 2.8, valueCommitted: 14, valueActual: 0,
    monthsStuck: 5, rootCause: 'bloomberg',
    blocker: 'Bloomberg AIM FIX data: 38% of required fields missing — proprietary fields not exported in batch',
    outcome: 'Training data audit revealed Bloomberg AIM FIX uses FIX 4.4 subset without counterparty venue or market impact fields. 3 analysts spending 100% of time on manual TCA as a result.',
    recommendation: 'Bloomberg API layer (Phase 4) resolves FIX data completeness. December 2026 renewal negotiation: demand FIX 4.4 full field export as contract condition.',
  },
  {
    id: 'i-11', name: 'Liquidity Risk AI', status: 'stalled',
    category: 'Middle Office', investment: 4.1, valueCommitted: 22, valueActual: 0,
    monthsStuck: 7, rootCause: 'cro',
    blocker: 'CRO froze after discovering shadow AI — model bypassed IT governance, now requires formal model validation',
    outcome: 'Built by quant team without IT governance sign-off. CRO discovered during MAS FEAT audit. Frozen pending model validation framework that does not yet exist.',
    recommendation: 'AI Governance Framework (Wave 1) creates the model validation process this needs. Fast-track once governance live — quant team already built the model. 30-day validation path.',
  },
  {
    id: 'i-12', name: 'Counterparty Credit AI', status: 'stalled',
    category: 'Middle Office', investment: 3.6, valueCommitted: 18, valueActual: 0,
    monthsStuck: 6, rootCause: 'cro',
    blocker: 'CRO freeze caught this 60% complete — 2 quants reassigned to MAS FEAT documentation',
    outcome: 'Model 60% built when CRO froze all AI in October 2025. Resources redirected to MAS FEAT compliance work. Development environment only.',
    recommendation: 'Once governance framework established, 2–3 months to completion. Fastest CRO-blocked initiative to value after freeze is lifted — most work already done.',
  },
  {
    id: 'i-13', name: 'Advisor Next Best Action', status: 'stalled',
    category: 'Front Office', investment: 4.4, valueCommitted: 24, valueActual: 0,
    monthsStuck: 8, rootCause: 'fsc',
    blocker: 'Salesforce FSC 44% — 56% of advisor-client interactions invisible to the model',
    outcome: 'Pilot with 12 FSC-native advisors: 70% recommendation acceptance rate. Cannot scale — 56% of advisors not on FSC means 56% of client interactions not captured. Third initiative with identical FSC blocker.',
    recommendation: 'Same fix as churn model and client risk profiling — SSO resolves all three FSC-blocked initiatives simultaneously. The FSC fix is the highest-leverage single action in the portfolio.',
  },
  {
    id: 'i-14', name: 'Market Regime Detection', status: 'stalled',
    category: 'Front Office', investment: 2.8, valueCommitted: 16, valueActual: 0,
    monthsStuck: 6, rootCause: 'cro',
    blocker: 'CRO has not approved Aladdin risk factor data feed into AI model under current freeze',
    outcome: 'Model designed for macro regime classification (risk-on/off, inflationary, recessionary). Requires Aladdin risk feed. CRO freeze applies to any Aladdin→AI integration.',
    recommendation: 'AI Governance Framework resolves CRO freeze. Aladdin integration for daily stress testing (approved) proves the integration pattern — use it as precedent for this initiative.',
  },
  {
    id: 'i-15', name: 'Client Onboarding AI (KYC)', status: 'stalled',
    category: 'Back Office', investment: 3.2, valueCommitted: 14, valueActual: 0,
    monthsStuck: 5, rootCause: 'cdo',
    blocker: 'CDO vacancy — KYC documents in 3 formats across 3 regions, no CDO to govern architecture',
    outcome: 'NLP model designed for KYC document review and AML screening. Data audit: PDFs in Europe, Salesforce attachments in US, SharePoint in APAC. No unified document store.',
    recommendation: 'CDO hire + document management architecture decision unblocks this. Technical implementation is straightforward once architecture is decided — 6 months to live.',
  },
  {
    id: 'i-16', name: 'Performance Attribution Explainer', status: 'stalled',
    category: 'Front Office', investment: 1.9, valueCommitted: 9, valueActual: 0,
    monthsStuck: 4, rootCause: 'cdo',
    blocker: 'CDO vacancy — no governance owner for FCA/SEC disclosure decision on AI-generated client communications',
    outcome: 'LLM tool generates natural language performance explanations. CFO approved the concept. Legal: AI-generated client communications may require FCA/SEC disclosure under proposed AI governance rules.',
    recommendation: 'CDO makes the disclosure framework call. This is a 2-week legal review once CDO is hired and governance exists. CFO is already a champion — fast approval path.',
  },
  {
    id: 'i-17', name: 'Dynamic Fee Optimizer', status: 'stalled',
    category: 'Front Office', investment: 1.8, valueCommitted: 12, valueActual: 0,
    monthsStuck: 3, rootCause: 'cdo',
    blocker: 'Legal clearance required — AI-recommended fees create MiFID II conflict-of-interest disclosure risk',
    outcome: 'ML model for client-specific fee recommendations. Clear commercial case. Legal flagged MiFID II and SEC conflict-of-interest disclosure concerns — AI optimization decisions create a documented audit trail regulators can scrutinize.',
    recommendation: 'AI governance framework includes client-facing AI disclosure standards. CDO and legal clearance within 30 days of governance framework. Clear path from planning to live.',
  },
  // CANCELLED
  {
    id: 'i-18', name: 'Real-Time FX Sentiment Signal', status: 'cancelled',
    category: 'Front Office', investment: 1.4, valueCommitted: 0, valueActual: 0,
    monthsStuck: 0, rootCause: 'bloomberg',
    blocker: 'Cancelled Q3 2023 — Bloomberg News sentiment data: duplicate stories, inconsistent timestamps',
    outcome: '$1.4M written off. Training data audit revealed Bloomberg News quality insufficient for high-frequency signals. Recurring theme: Bloomberg data dependency without pre-validation.',
    recommendation: 'Lessons applied to current portfolio. Any Bloomberg-dependent initiative must pass data quality audit before investment is committed — this process now exists.',
  },
  {
    id: 'i-19', name: 'AI-Driven Strategic Asset Allocation', status: 'cancelled',
    category: 'Front Office', investment: 3.8, valueCommitted: 0, valueActual: 0,
    monthsStuck: 0, rootCause: 'cro',
    blocker: 'Cancelled Q4 2024 — model contradicted Investment Committee guidance; CRO and CIO jointly cancelled',
    outcome: 'Model completed and backtested. In simulation, recommended 40% TIPS allocation counter to IC\'s explicit guidance. CRO/CIO: AI contradicting IC creates fiduciary and governance risk without a framework to resolve authority.',
    recommendation: 'The clearest illustration of why CDO + AI governance is not optional. Without authority framework, AI cannot participate in investment-critical decisions. Governance Framework (Wave 1) is the prerequisite for any future investment AI.',
  },
  // IN PLANNING
  {
    id: 'i-20', name: 'AI-Powered Client Reporting', status: 'planning',
    category: 'Front Office', investment: 11.0, valueCommitted: 22, valueActual: 0,
    monthsStuck: 4, rootCause: 'data',
    blocker: '3-day reporting lag from Advent Geneva — real-time reporting requires cloud-native fund accounting',
    outcome: 'Design phase. 68% of HNW clients cited reporting quality in FSC survey. Requires golden record and real-time data pipeline — both Wave 1 prerequisites.',
    recommendation: 'Wave 2 initiative. Unlock path: golden record (Wave 1) + Advent Geneva cloud migration (June 2026 renewal). Sequence: fix data layer first, then build the AI on top.',
  },
  {
    id: 'i-21', name: 'Advisor Productivity Assistant', status: 'planning',
    category: 'Front Office', investment: 14.0, valueCommitted: 38, valueActual: 0,
    monthsStuck: 6, rootCause: 'fsc',
    blocker: 'Einstein licensed, not activated — FSC 44% adoption + CRO freeze',
    outcome: 'Design phase. Advisors at 34% below target capacity — 21 admin hours per week vs 9 peer benchmark. Einstein AI is licensed and ready. 4th initiative blocked by the FSC adoption ceiling.',
    recommendation: 'Wave 2. Unlock: SSO fix raises FSC adoption → CRO governance framework → Einstein activation. This is the highest-value FSC-dependent initiative at $38M annual value.',
  },
  {
    id: 'i-22', name: 'Golden Record Data Infrastructure', status: 'planning',
    category: 'Back Office', investment: 12.0, valueCommitted: 35, valueActual: 0,
    monthsStuck: 0, rootCause: 'cdo',
    blocker: 'CDO hire is prerequisite — budget approved, architecture decisions require CDO',
    outcome: 'Not started. Unblocks 18 of 28 AI initiatives. Informatica MDM to unify 14 data silos into single client and portfolio golden record.',
    recommendation: 'Wave 1, Month 1. This is the foundational investment. CDO hire on day 1 → architecture decision in week 2 → vendor selection in month 1 → go-live month 12. Every month of delay compounds across the entire portfolio.',
  },
  {
    id: 'i-23', name: 'AI Governance Framework', status: 'planning',
    category: 'Back Office', investment: 4.2, valueCommitted: 35, valueActual: 0,
    monthsStuck: 0, rootCause: 'cdo',
    blocker: 'CDO hire is prerequisite — governance owner required before framework can be ratified',
    outcome: 'Not started. Unlocks CRO sign-off on all stalled deployments. Closes MAS FEAT overdue position. Remediates SEC MRA open since Sep 2024.',
    recommendation: 'Wave 1, Month 0–3. This is the CRO unlock — once ratified, 4 CRO-frozen initiatives immediately resume. MAS FEAT remediation is weeks not months once this exists.',
  },
  {
    id: 'i-24', name: 'Daily Stress Testing Automation', status: 'planning',
    category: 'Middle Office', investment: 2.4, valueCommitted: 18, valueActual: 0,
    monthsStuck: 0, rootCause: 'none',
    blocker: 'No blocker — CRO has prioritised this. Configuration change only, no migration.',
    outcome: 'Not started. Resolves SEC Rule 18f-4 daily compliance gap. Lowest technical risk in portfolio — Aladdin configuration upgrade, no new vendor. CRO has approved.',
    recommendation: 'IMMEDIATE ACTION. CRO already approved. $2.4M investment, $18M annual value, 6-month timeline, no migration required. This is the one AI initiative that can start TODAY — no CDO, no governance, no golden record needed.',
  },
  {
    id: 'i-25', name: 'Bloomberg AIM Modern API Layer', status: 'planning',
    category: 'Back Office', investment: 22.0, valueCommitted: 28, valueActual: 0,
    monthsStuck: 0, rootCause: 'cdo',
    blocker: 'CDO hire required before Bloomberg engages on technical discussions for Phase 4',
    outcome: '$22M Phase 4 approved. December 2026 Bloomberg auto-renewal is the negotiation leverage window. API layer (not core migration) gives AI real-time position access without the $22M sunk cost risk.',
    recommendation: 'December 2026 Bloomberg renewal is the ONLY leverage window in 5+ years. Negotiate API modernisation terms as renewal condition. CDO hire enables technical discussions to begin.',
  },
  {
    id: 'i-26', name: 'MA Stars Client Retention Programme', status: 'planning',
    category: 'Front Office', investment: 3.4, valueCommitted: 22, valueActual: 0,
    monthsStuck: 0, rootCause: 'fsc',
    blocker: 'NPS 31 vs median 58 — FSC platform issues driving HNW client satisfaction risk',
    outcome: 'Not started. HNW client retention AI — NPS at 31 vs 58 industry median. FSC platform issues are the root cause of the NPS gap, not the product.',
    recommendation: 'Fix FSC adoption first. NPS will improve as FSC becomes usable for advisors. This initiative builds the AI layer on top — Wave 2 after FSC fix.',
  },
  {
    id: 'i-27', name: 'Automated Compliance Reporting (MiFID II)', status: 'planning',
    category: 'Middle Office', investment: 2.8, valueCommitted: 12, valueActual: 0,
    monthsStuck: 0, rootCause: 'data',
    blocker: 'Charles River Cloud migration required to expose AI-readable compliance audit trails',
    outcome: 'Not started. 4 FTE on manual MiFID II transaction reporting. Charles River Cloud (Sep 2026 renewal) unlocks automation.',
    recommendation: 'September 2026 Charles River renewal: negotiate cloud migration roadmap as renewal condition. Once on cloud, compliance reporting automation is a 6-month implementation.',
  },
  {
    id: 'i-28', name: 'Supply Chain Finance AI (APAC)', status: 'planning',
    category: 'Front Office', investment: 4.2, valueCommitted: 18, valueActual: 0,
    monthsStuck: 0, rootCause: 'cdo',
    blocker: 'Wave 2 — requires governance framework as prerequisite before Wave 2 funding approved',
    outcome: 'Not started. APAC wealth management growth initiative. Wave 2 funding not yet approved — governance framework is the prerequisite.',
    recommendation: 'Wave 2. After governance framework established, APAC initiative is positioned as the growth vector for the post-governance portfolio.',
  },
]

const BLOCKERS = [
  {
    id: 'cdo',
    label: 'CDO Vacancy — 11 Months',
    color: RED,
    count: 5,
    lockedValue: 187,
    initiatives: ['Intelligent Portfolio Construction', 'Alternative Data Integration', 'Client Onboarding AI', 'Performance Attribution Explainer', 'Dynamic Fee Optimizer'],
    description: 'The CDO role has been vacant for 11 months. No executive owns data architecture, model governance, vendor sign-off on data contracts, or the AI authority framework. Every cross-system data decision is paralysed.',
    fix: 'Hire CDO. Day 1 actions: data architecture decisions, MNPI governance calls, Bloomberg Phase 4 re-engagement. 30-day impact unlocks all 5 initiatives to resume.',
    secondaryImpact: 'Also blocks Golden Record ($35M value), AI Governance Framework ($35M value), and Bloomberg API Layer ($28M value) — which together unblock an additional 13 initiatives.',
  },
  {
    id: 'cro',
    label: 'CRO Governance Freeze',
    color: AMBER,
    count: 4,
    lockedValue: 101,
    initiatives: ['Automated ESG Scoring', 'Liquidity Risk AI', 'Counterparty Credit AI', 'Market Regime Detection'],
    description: 'CRO froze all new AI deployments in October 2025 when MAS FEAT audit revealed ungoverned models in production. MAS FEAT is 4 months overdue — $2.4B Singapore AUM at regulatory risk. SEC MRA open since September 2024.',
    fix: 'AI Governance Framework ratification (Wave 1, 3 months). Once governance framework is live and MAS FEAT is remediated, CRO has committed to reopening the door. Counterparty Credit AI is 60% complete — fastest to value after freeze lifts.',
    secondaryImpact: 'CRO freeze is self-reinforcing: MAS FEAT requires documenting existing models before new deployments, creating a regulatory catch-22 that only the governance framework resolves.',
  },
  {
    id: 'fsc',
    label: 'Salesforce FSC 44% Adoption',
    color: INDIGO,
    count: 4,
    lockedValue: 156,
    initiatives: ['Client Churn Prediction (underperforming)', 'Client Risk Profiling', 'Advisor Next Best Action', 'Advisor Productivity Assistant'],
    description: '44% advisor adoption after 18 months and $38M. Flat for 3 consecutive quarters. 56% of advisor-client interactions, document uploads, and preference signals are invisible to any ML model trained on FSC data.',
    fix: 'One infrastructure change: Bloomberg AIM → Salesforce FSC SSO integration. Advisors currently must switch between two systems. SSO makes FSC the primary interface without requiring any advisor behaviour change. This single fix unlocks all 4 initiatives.',
    secondaryImpact: 'Einstein AI is licensed and idle. 4 AI initiatives share this identical root cause. The FSC fix is the highest-leverage single action in the portfolio — $156M locked value, one integration fix.',
  },
  {
    id: 'bloomberg',
    label: 'Bloomberg Data Restrictions',
    color: TEAL,
    count: 2,
    lockedValue: 32,
    initiatives: ['Portfolio Attribution AI', 'Trade Cost Analysis AI'],
    description: 'Bloomberg restricts API access (500 calls/hr vs 50,000 needed), limits FIX export to a proprietary subset missing 38% of TCA fields, and blocks attribution calculation APIs for external ML. Three failed modernisations ($22.2M sunk) confirm Bloomberg\'s platform actively resists AI augmentation.',
    fix: 'Bloomberg API modernisation Phase 4 ($22M approved, not started). December 2026 auto-renewal is the negotiation window. Use Charles River + Aladdin OMS migration threat as leverage. Negotiate: full FIX 4.4 export, real-time API access, attribution data feed — as contract conditions.',
    secondaryImpact: 'Bloomberg data restrictions also limit Trade Surveillance AI (EMEA-only) and are the primary cause of the 18 AI initiative blockage pattern.',
  },
]

const ROADMAP = [
  {
    wave: 1, name: 'Governance & Foundation', months: '0–6', investment: 21.8, annualValue: 172, color: GREEN,
    prerequisite: 'CDO hire (Day 1)',
    initiatives: ['Golden Record Data Infrastructure', 'AI Governance Framework', 'Daily Stress Testing (immediate)', 'Client Churn Prediction (retrain)'],
    outcome: 'CDO hired. MAS FEAT closed. SEC MRA remediated. CRO freeze lifted. Golden record architecture started. 3 AI models with documented baselines.',
    unlocks: 'All Wave 2 initiatives. CRO sign-off restored. Bloomberg Phase 4 negotiations begin.',
  },
  {
    wave: 2, name: 'Intelligence Activation', months: '6–18', investment: 25.8, annualValue: 120, color: TEAL,
    prerequisite: 'Wave 1: CDO, golden record, governance framework, CRO sign-off',
    initiatives: ['Automated ESG Scoring', 'Advisor Productivity Assistant', 'Regulatory Change Monitor', 'AI-Powered Client Reporting', 'Bloomberg AIM API Layer'],
    outcome: 'Einstein AI activated. 5 stalled initiatives deployed. Bloomberg Phase 4 underway. Real-time reporting live.',
    unlocks: 'Wave 3 — Intelligent Portfolio Construction. Bloomberg API unblocks global Trade Surveillance extension.',
  },
  {
    wave: 3, name: 'Alpha Generation', months: '18–30', investment: 18.4, annualValue: 120, color: AMBER,
    prerequisite: 'Wave 2: Bloomberg API layer live, real-time data pipeline, governance mature',
    initiatives: ['Intelligent Portfolio Construction', 'Alternative Data Integration', 'Supply Chain Finance AI (APAC)'],
    outcome: 'Reinforcement learning portfolio construction live. Alternative data integrated. $120M annual value from AI-driven alpha generation.',
    unlocks: 'AI-native asset management — the CEO\'s stated strategic objective.',
  },
]

const PRE_BUILT = [
  '$94M in AI investment. Zero documented ROI. What is the exact board narrative I need for the Q2 board meeting — addressing the CFO\'s "baselines required" demand and the CEO\'s "AI is our strategy" mandate simultaneously?',
  'Daily Stress Testing Automation is the only initiative CRO has approved. $2.4M investment, $18M annual value, configuration change only — no migration. What is the step-by-step 90-day plan to get this from planning to live?',
  'CDO has been vacant 11 months. I have 3 finalist candidates. Which 5 CDO-blocked initiatives should I show them as their Day 1 priorities — ranked by speed to value after hire?',
  'CRO has frozen all AI deployments. MAS FEAT is 4 months overdue — $2.4B Singapore AUM at risk. What is the minimum viable AI governance framework that gets the CRO to lift the freeze in 90 days?',
  'Without the CDO and without the golden record — which 3 AI initiatives can I start ROI tracking on TODAY, and what does that baseline look like?',
]

// ── Meridian Health System Data ────────────────────────────────────────────────
const MERIDIAN_INITIATIVES: Initiative[] = [
  {
    id: 'm-01', name: 'Sepsis Early Warning AI', status: 'live-underperforming',
    category: 'Middle Office', investment: 3.8, valueCommitted: 24, valueActual: 4.2,
    monthsStuck: 14, rootCause: 'data',
    blocker: 'MLOps pipeline absent — model runs on nightly Epic data exports, not real-time feeds. 3 of 5 live hospitals show <30% alert accuracy due to incomplete Epic flowsheet mapping. 13 hospitals have no deployment path.',
    outcome: '5 of 18 hospitals live. 2 hospitals show 34% ICU transfer reduction — model is validated. 3 live hospitals show <30% accuracy. 13 hospitals not deployed. $3.8M invested, $4.2M of $24M committed annual value, 14 months of deployment stall.',
    recommendation: 'Azure Synapse completion provides real-time Epic feeds. MLOps deployment layer (Databricks or Azure ML) adds model serving and monitoring. Target: all 18 hospitals within 9 months of Synapse go-live. Each month of delay = $1.7M in unrealised annual value.',
  },
  {
    id: 'm-02', name: 'Clinical Coding AI', status: 'live-legacy',
    category: 'Back Office', investment: 2.4, valueCommitted: 16, valueActual: 17.2,
    monthsStuck: 0, rootCause: 'none',
    blocker: 'Rules-based engine cannot handle ICD-11 code structure — transition mandated October 2026 requires full engine rebuild or replacement.',
    outcome: 'Only outperforming initiative — 34% coding time reduction, $17.2M annual value vs $16M committed. ICD-11 mandate October 2026 will break the current system. No upgrade plan exists. The portfolio\'s one success is at risk.',
    recommendation: 'ML-based coding engine upgrade — $1.8M, 8-month implementation, October 2026 deadline. Only $1.8M protects $17.2M annual value. Highest ROI maintenance investment in the portfolio. Start immediately.',
  },
  {
    id: 'm-03', name: 'RCM Denial Prevention AI', status: 'live-underperforming',
    category: 'Back Office', investment: 3.2, valueCommitted: 28, valueActual: 8.4,
    monthsStuck: 0, rootCause: 'bloomberg',
    blocker: 'Ensemble Health contract prohibits automated denial remediation workflows — AI identifies 89% of preventable denials but cannot trigger remediation. Manual intervention required for every flagged denial.',
    outcome: 'Denial rate 18.2% vs 12% SLA target. AI correctly identifies 89% of preventable denials. Ensemble contract blocks automated remediation — staff must manually action every AI flag. $8.4M of $28M committed value recovered. Each 1pp denial rate improvement = $12M annual revenue.',
    recommendation: 'Ensemble contract renewal October 2026 — negotiate workflow automation API access as renewal condition. CDO must own this negotiation. 6pp denial rate improvement (18.2% → 12%) = $74M annual revenue uplift.',
  },
  {
    id: 'm-04', name: 'Prior Auth AI', status: 'stalled',
    category: 'Back Office', investment: 1.8, valueCommitted: 18, valueActual: 0,
    monthsStuck: 8, rootCause: 'bloomberg',
    blocker: 'Ensemble contract prohibits alternative prior auth vendors for 62% of payer contracts. Currently live with 23 of 100 payers — 77% of prior auth volume excluded by contract terms.',
    outcome: 'Pilot live with 23 payers — 34% reduction in manual authorisation time. Cannot extend to 77 remaining payers: Ensemble exclusivity clause. $1.8M invested, $0 at scale. 8 months blocked.',
    recommendation: 'Ensemble October 2026 renewal is the negotiation window. CDO must demand elimination of prior auth exclusivity clause. 77% payer coverage unlocks $18M annually. October 2026 is the only leverage window for 5+ years.',
  },
  {
    id: 'm-05', name: 'Travel Nurse Demand Prediction', status: 'stalled',
    category: 'Middle Office', investment: 0.8, valueCommitted: 12, valueActual: 0,
    monthsStuck: 6, rootCause: 'data',
    blocker: 'Kronos WFM contract expired August 2025 — data export API suspended. Historical workforce data cannot be extracted for model training or live prediction.',
    outcome: '$142M annual travel nurse spend. Demand prediction model would reduce spend 15–20% ($21–28M). Kronos contract expiry August 2025 killed the data feed. $0.8M invested, $0 value. 6 months stalled.',
    recommendation: 'Kronos contract renewal immediately — data feed restoration in 30 days. Azure Synapse then ingests WFM data in real time. Travel nurse prediction is 6 months to live once Kronos data is restored. $21M+ annual value for a $0.8M model investment.',
  },
  {
    id: 'm-06', name: 'Patient Readmission Prediction', status: 'stalled',
    category: 'Middle Office', investment: 1.4, valueCommitted: 22, valueActual: 0,
    monthsStuck: 5, rootCause: 'fsc',
    blocker: 'Azure Synapse 40% complete — model requires real-time patient data across all 18 hospitals. Nightly Epic extracts are insufficient for 30-day readmission risk prediction.',
    outcome: 'Model validated in sandbox on 2019 historical data — 78% accuracy, above 72% clinical threshold. Cannot train on live data or deploy without real-time pipeline. $1.4M invested, $0 value. 5 months stalled.',
    recommendation: 'Azure Synapse completion (Wave 1) unlocks immediately. Once real-time pipeline live, 4-month path from sandbox to production deployment. Epic integration and clinical workflow build runs parallel to Synapse completion.',
  },
  {
    id: 'm-07', name: 'ED Throughput AI', status: 'stalled',
    category: 'Middle Office', investment: 1.2, valueCommitted: 14, valueActual: 0,
    monthsStuck: 4, rootCause: 'fsc',
    blocker: 'Azure Synapse required — ED model needs real-time patient flow data from Epic ADT events and bed management system. No real-time pipeline exists.',
    outcome: '23% of Meridian ED patients exceed 4-hour target. Simulation on historical data shows 18% throughput improvement achievable. Cannot operationalise without real-time Epic ADT data feed. $1.2M invested, $0 value.',
    recommendation: 'Wave 2 after Azure Synapse live. Epic ADT integration for bed management can be built in parallel to Synapse completion. Target: live 4 months after Synapse go-live.',
  },
  {
    id: 'm-08', name: 'AI Governance Framework', status: 'planning',
    category: 'Back Office', investment: 0.8, valueCommitted: 40, valueActual: 0,
    monthsStuck: 0, rootCause: 'cdo',
    blocker: 'CDO vacancy — governance owner required. CMS AI guidance and state regulations require documented framework before clinical AI expansion. No owner to create or ratify it.',
    outcome: 'Not started. Unlocks clinical AI expansion to all 18 hospitals. Satisfies CMS AI assurance requirements. CDO vacancy means no executive to own model validation protocols, bias testing, or FDA SaMD classification decisions.',
    recommendation: 'CDO hire Day 1 priority. Governance framework enables scaling clinical AI beyond current 5-hospital pilot. CMS compliance is weeks not months once CDO owns the process.',
  },
  {
    id: 'm-09', name: 'Azure Synapse Completion', status: 'planning',
    category: 'Back Office', investment: 4.8, valueCommitted: 0, valueActual: 0,
    monthsStuck: 0, rootCause: 'cdo',
    blocker: 'CDO vacancy — 40% complete, stalled 6 months. Three competing architecture proposals. No decision-maker with authority to choose between Databricks, Azure ML, and on-premises hybrid.',
    outcome: '40% complete, $4.8M invested on a $12M project. Unblocks Patient Readmission Prediction, ED Throughput AI, and Sepsis scale-out. CDO must choose between 3 competing architecture proposals to proceed.',
    recommendation: 'CDO hire unlocks immediately. Architecture decision in week 2. Synapse completion in 9 months. Every month of CDO vacancy = $3.1M/month in locked AI initiative value across 4 dependent initiatives.',
  },
  {
    id: 'm-10', name: 'Clinical Decision Support Suite', status: 'planning',
    category: 'Middle Office', investment: 2.4, valueCommitted: 18, valueActual: 0,
    monthsStuck: 0, rootCause: 'cdo',
    blocker: 'CDO vacancy and AI governance framework absent. FDA SaMD classification applies to 3 of 5 planned modules — requires governance framework before any can be built.',
    outcome: 'Not started. 5 clinical decision support modules planned. FDA SaMD classification for 3 modules requires documented AI governance framework. Cannot proceed without governance framework and CDO authority.',
    recommendation: 'Wave 2 after governance framework live and CDO hired. FDA SaMD pathway is 9–18 months once CDO makes classification decisions. Sequence: governance framework → FDA pathway → build.',
  },
]

const MERIDIAN_BLOCKERS = [
  {
    id: 'cdo',
    label: 'CDO Vacancy — 8 Months',
    color: RED,
    count: 3,
    lockedValue: 82,
    initiatives: ['AI Governance Framework', 'Azure Synapse Completion', 'Clinical Decision Support Suite'],
    description: 'CDO role vacant 8 months. No executive owns data architecture decisions, Azure Synapse completion, AI governance, or Ensemble contract renegotiation authority. Three Synapse architecture proposals sit undecided. CMS AI guidance requires documented governance framework before clinical AI expansion — no owner exists to create it.',
    fix: 'Hire CDO. Day 1: select Azure Synapse architecture from 3 proposals. Week 2: initiate AI governance framework. Month 1: begin Ensemble contract renegotiation strategy for October 2026 renewal. CDO hire is the single decision with the largest downstream impact on portfolio value.',
    secondaryImpact: 'CDO vacancy stalls Azure Synapse — which blocks Patient Readmission Prediction ($22M) and ED Throughput AI ($14M). CDO also required to lead Ensemble negotiation. Total CDO-attributable locked value across primary and secondary effects: $164M.',
  },
  {
    id: 'data',
    label: 'MLOps Pipeline Missing',
    color: AMBER,
    count: 2,
    lockedValue: 36,
    initiatives: ['Sepsis AI (scale-out to 13 hospitals)', 'Travel Nurse Demand Prediction'],
    description: 'No MLOps deployment infrastructure. Sepsis AI runs on nightly Epic data exports — cannot achieve real-time alerting or scale to remaining 13 hospitals. Travel nurse prediction built and validated, cannot reach production. Both initiatives are technically ready; the deployment rail is missing.',
    fix: 'Azure Synapse completion provides the real-time data foundation. MLOps layer (Databricks or Azure ML) adds model serving and monitoring. Both initiatives can reach production within 6 months of MLOps infrastructure being live. Total timeline: 15 months from CDO hire.',
    secondaryImpact: 'MLOps absence prevents Sepsis AI from reaching 13 remaining hospitals — $19.8M additional annual value waiting on deployment rails. Combined with Travel Nurse Prediction, total MLOps-blocked value: $31.8M annually.',
  },
  {
    id: 'bloomberg',
    label: 'Ensemble Contract Restrictions',
    color: TEAL,
    count: 2,
    lockedValue: 46,
    initiatives: ['RCM Denial Prevention AI (partial)', 'Prior Auth AI'],
    description: 'Ensemble contract prohibits workflow automation and restricts prior auth alternatives for 62% of payer contracts. AI identifies denials and flags auth issues but cannot trigger remediation workflows. October 2026 renewal is the only negotiation window for 5+ years.',
    fix: 'October 2026 Ensemble renewal is the leverage point. CDO leads negotiation: demand workflow automation API access and elimination of prior auth exclusivity clause. $46M in annual value depends on this negotiation. Preparation must begin now — 6 months before October 2026.',
    secondaryImpact: 'Ensemble denial rate 18.2% vs 12% SLA. Each 1pp improvement = $12M annual revenue. Full SLA achievement = $74M annually. Ensemble restriction is Meridian\'s largest single source of unrealised RCM value.',
  },
  {
    id: 'fsc',
    label: 'Azure Synapse Stalled',
    color: INDIGO,
    count: 2,
    lockedValue: 36,
    initiatives: ['Patient Readmission Prediction', 'ED Throughput AI'],
    description: 'Azure Synapse 40% complete, stalled 6 months. CDO vacancy means no decision-maker across 3 competing architecture proposals. Without Synapse, no real-time patient data pipeline. Readmission prediction and ED throughput models are built and validated — they wait on the data foundation.',
    fix: 'CDO hire unlocks Synapse immediately. Architecture decision in week 2. Synapse completion in 9 months. This is fundamentally a CDO decision bottleneck — the technical work is scoped, the authority to proceed is missing.',
    secondaryImpact: 'Azure Synapse also enables Sepsis AI scale-out to 13 remaining hospitals. Combined Synapse-dependent value: $55M annually. Synapse is the data foundation the entire clinical AI portfolio requires.',
  },
]

const MERIDIAN_ROADMAP = [
  {
    wave: 1, name: 'Foundation & Governance', months: '0–6', investment: 8.4, annualValue: 58, color: GREEN,
    prerequisite: 'CDO hire (Day 1)',
    initiatives: ['CDO Hire', 'Azure Synapse Architecture Decision', 'AI Governance Framework (initiate)', 'Kronos Contract Renewal', 'Clinical Coding AI — ICD-11 Upgrade'],
    outcome: 'CDO hired. Synapse architecture decided. ICD-11 upgrade underway — $17.2M value protected. Kronos data feed restored. AI governance framework initiated.',
    unlocks: 'All Wave 2 initiatives. MLOps deployment path. Ensemble contract negotiation authority. CMS compliance pathway.',
  },
  {
    wave: 2, name: 'Clinical AI Activation', months: '6–18', investment: 7.2, annualValue: 72, color: TEAL,
    prerequisite: 'Wave 1: CDO, Synapse completion, governance framework, Kronos data restored',
    initiatives: ['Sepsis AI — all 18 hospitals', 'Travel Nurse Demand Prediction', 'Patient Readmission Prediction', 'ED Throughput AI', 'Prior Auth AI (post-Ensemble negotiation)'],
    outcome: 'Sepsis live at all 18 hospitals — $24M annual value. Travel nurse demand model live — $142M spend optimised. Three additional clinical AI models in production.',
    unlocks: 'Wave 3 — Clinical Decision Support Suite. Ensemble negotiation delivers prior auth automation to 100 payers.',
  },
  {
    wave: 3, name: 'Platform & Decision Support', months: '18–30', investment: 3.2, annualValue: 40, color: AMBER,
    prerequisite: 'Wave 2: MLOps mature, governance live, Ensemble renegotiated, Synapse stable',
    initiatives: ['Clinical Decision Support Suite', 'RCM Denial Prevention at SLA', 'Patient Experience AI'],
    outcome: 'FDA SaMD-compliant clinical decision support live. RCM operating at <12% denial rate. AI-native health system operations.',
    unlocks: 'Full AI-native clinical operations — CEO strategic objective.',
  },
]

const MERIDIAN_PRE_BUILT = [
  'Sepsis AI is live at 5 hospitals but 13 are still waiting — 14 months of deployment stall. MLOps pipeline is the blocker. What is the fastest path to all-hospital deployment, and what is the dollar value of each month of delay?',
  'CDO has been vacant 8 months. Azure Synapse is at 40%, three architecture proposals, no decision-maker. What are the 5 decisions the incoming CDO must make in their first 30 days — ranked by downstream impact?',
  'Ensemble October 2026 renewal is our only negotiation window for 5+ years. We need workflow automation API access and prior auth exclusivity eliminated. What is the negotiation strategy and what concessions should we offer?',
  'Travel nurse spend is $142M annually. Demand prediction would cut it 15–20% — but Kronos data feed is dead (contract expired August 2025). What is the fastest path from Kronos renewal to model in production?',
  'Clinical Coding AI is our only profitable initiative at $17.2M annual value. ICD-11 mandate hits October 2026. What does the upgrade plan look like, and what is the risk if we miss the deadline?',
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function statusConfig(s: InitStatus) {
  if (s === 'live-underperforming') return { label: 'LIVE · UNDERPERFORMING', color: AMBER, dot: AMBER }
  if (s === 'live-limited') return { label: 'LIVE · LIMITED SCOPE', color: TEAL, dot: TEAL }
  if (s === 'live-legacy') return { label: 'LIVE · LEGACY RISK', color: GREEN, dot: GREEN }
  if (s === 'stalled') return { label: 'STALLED', color: RED, dot: RED }
  if (s === 'cancelled') return { label: 'CANCELLED', color: MUTED, dot: 'rgba(255,255,255,0.3)' }
  return { label: 'IN PLANNING', color: INDIGO, dot: INDIGO }
}

function rootCauseLabel(r: RootCause, clientId?: string) {
  const isMeridian = clientId === 'meridian'
  if (r === 'cdo') return 'CDO Vacancy'
  if (r === 'cro') return isMeridian ? 'CMO Approval' : 'CRO Freeze'
  if (r === 'fsc') return isMeridian ? 'Azure Synapse' : 'FSC Adoption'
  if (r === 'bloomberg') return isMeridian ? 'Ensemble Contract' : 'Bloomberg Data'
  if (r === 'data') return 'Data Pipeline'
  return '—'
}

function rootCauseColor(r: RootCause) {
  if (r === 'cdo') return RED
  if (r === 'cro') return AMBER
  if (r === 'fsc') return INDIGO
  if (r === 'bloomberg') return TEAL
  return MUTED
}

// ── Main component ─────────────────────────────────────────────────────────────
function AIDeliveryContent() {
  const { clientId } = useClientContext()
  const [selectedInit, setSelectedInit] = useState<Initiative | null>(null)
  const [selectedBlocker, setSelectedBlocker] = useState<typeof BLOCKERS[0] | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'initiatives' | 'blockers' | 'roadmap' | 'chat'>('overview')
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [streamingResponse, setStreamingResponse] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatMessages.length === 0 && !streamingResponse) return
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, streamingResponse])

  // Reset panel state when user switches clients
  useEffect(() => {
    setSelectedInit(null)
    setSelectedBlocker(null)
    setActiveTab('overview')
    setChatMessages([])
  }, [clientId])

  async function sendChat(text?: string) {
    const msg = text || chatInput
    if (!msg.trim()) return
    const newMsg = { role: 'user', content: msg }
    const updated = [...chatMessages, newMsg]
    setChatMessages(updated)
    setChatInput('')
    setChatLoading(true)
    setStreamingResponse('')
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, role: 'CFO', clientId }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          full += decoder.decode(value)
          setStreamingResponse(full)
        }
      }
      setChatMessages(prev => [...prev, { role: 'assistant', content: full }])
    } finally {
      setStreamingResponse('')
      setChatLoading(false)
    }
  }

  const isMeridian = clientId === 'meridian'
  const currentInitiatives = isMeridian ? MERIDIAN_INITIATIVES : INITIATIVES
  const currentBlockers = isMeridian ? MERIDIAN_BLOCKERS : BLOCKERS
  const currentRoadmap = isMeridian ? MERIDIAN_ROADMAP : ROADMAP
  const currentPreBuilt = isMeridian ? MERIDIAN_PRE_BUILT : PRE_BUILT

  const live = currentInitiatives.filter(i => i.status.startsWith('live'))
  const stalled = currentInitiatives.filter(i => i.status === 'stalled')
  const planning = currentInitiatives.filter(i => i.status === 'planning')
  const cancelled = currentInitiatives.filter(i => i.status === 'cancelled')

  const totalInvested = currentInitiatives.reduce((s, i) => s + i.investment, 0)
  const totalActual = currentInitiatives.reduce((s, i) => s + i.valueActual, 0)
  const totalCommitted = currentInitiatives.reduce((s, i) => s + i.valueCommitted, 0)
  const stalledValue = stalled.reduce((s, i) => s + i.valueCommitted, 0)
  const planningValue = planning.reduce((s, i) => s + i.valueCommitted, 0)

  function handleTabChange(tab: typeof activeTab) {
    setActiveTab(tab)
    setSelectedInit(null)
    setSelectedBlocker(null)
  }

  const centerIsEmpty = !selectedInit && !selectedBlocker

  const currentClientName = ALL_CLIENTS.find(c => c.id === clientId)?.name || 'your account'

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="ai-pdlc" />

      {/* ── Sticky header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: CARD, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 48px 0' }}>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Delivery Intelligence · {currentClientName}
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: '26px', fontWeight: 700, color: WHITE, margin: '0 0 20px', lineHeight: 1.25, maxWidth: '720px' }}>
            &ldquo;Are our AI initiatives actually being delivered — and what&rsquo;s blocking the ones that aren&rsquo;t?&rdquo;
          </h1>
          <div style={{ display: 'flex', gap: '40px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Invested', value: `$${Math.round(totalInvested)}M` },
              { label: 'Live', value: String(live.length), dot: TEAL },
              { label: 'Stalled', value: String(stalled.length), dot: RED },
              { label: 'Value Locked', value: `$${stalledValue}M`, dot: AMBER },
              { label: 'Root Causes', value: String(currentBlockers.length), dot: INDIGO },
            ].map(s => (
              <div key={s.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />}
                  <div style={{ fontFamily: MONO, fontSize: '22px', fontWeight: 700, color: WHITE }}>{s.value}</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, marginTop: '2px', letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 0 }}>
            {([
              ['overview', 'Portfolio Overview'],
              ['initiatives', 'Initiative Detail'],
              ['blockers', 'Root Causes'],
              ['roadmap', 'Roadmap'],
              ['chat', 'Ask Maestro'],
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => handleTabChange(id)}
                style={{ padding: '12px 24px', fontFamily: MONO, fontSize: '10px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', border: 'none', borderBottom: activeTab === id ? `2px solid ${TEAL}` : '2px solid transparent', background: 'transparent', color: activeTab === id ? WHITE : MUTED, transition: 'color 0.12s' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 48px 80px', width: '100%' }}>

        {/* ── PORTFOLIO OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
              {(isMeridian ? [
                { severity: RED, title: '$23M invested — 3 of 10 initiatives live, $66M stalled value, 4 root causes blocking the portfolio', body: 'CDO vacancy blocks Azure Synapse and governance. MLOps absence prevents Sepsis AI from scaling. Ensemble contract blocks prior auth. These form a dependency chain — CDO hire resolves the first blocker, which unlocks the rest.' },
                { severity: GREEN, title: 'Clinical Coding AI is the only outperformer — $17.2M vs $16M committed. ICD-11 upgrade required by October 2026.', body: '$1.8M upgrade, 8-month implementation, October 2026 hard deadline. Missing this deadline puts $17.2M annual value at risk. This is the one action that protects existing portfolio value. Start immediately.' },
                { severity: AMBER, title: 'Ensemble October 2026 renewal is the portfolio\'s only negotiation window for 5+ years.', body: '$46M in locked value depends on this single negotiation. Demand workflow automation API access and elimination of prior auth exclusivity. CDO must lead — start preparation now, 6 months before October 2026 renewal date.' },
                { severity: INDIGO, title: 'CDO hire is the critical path — the single decision with the largest downstream impact.', body: 'CDO vacancy blocks Azure Synapse completion, AI governance framework, and Ensemble negotiation authority. All 4 root causes trace back to CDO vacancy. Every month of delay: $3.1M in compounding locked value across the portfolio.' },
              ] : [
                { severity: RED, title: '$94M invested, $35M actual value — 63% programme shortfall', body: '14 stalled initiatives, 2 cancelled. 4 root causes are blocking the entire portfolio: CDO vacancy, CRO governance freeze, FSC 44% adoption, Bloomberg data restrictions. These are not separate problems — they form a dependency chain.' },
                { severity: GREEN, title: 'One initiative has NO blocker and CRO has approved: Daily Stress Testing', body: '$2.4M investment, $18M annual value, 6-month timeline, Aladdin configuration change only — no migration, no CDO needed, no governance framework needed. This starts TODAY.' },
                { severity: AMBER, title: 'FSC SSO is the single fix that unlocks $156M in locked value', body: '4 AI initiatives share the identical root cause: Salesforce FSC 44% adoption. Bloomberg→FSC SSO integration is one infrastructure change. It does not require behaviour change from advisors. It unlocks all 4 initiatives simultaneously.' },
                { severity: INDIGO, title: 'CDO hire is the critical path — it unblocks everything else', body: 'CDO vacancy enables the AI Governance Framework (CRO unblock), Golden Record (data foundation), and Bloomberg Phase 4 (API negotiations). CDO hire is the single decision that has the largest downstream impact on portfolio value.' },
              ]).map((a, i) => (
                <div key={i} style={{ background: CARD, border: `1px solid ${a.severity}25`, borderLeft: `3px solid ${a.severity}`, borderRadius: '8px', padding: '14px 18px' }}>
                  <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, fontWeight: 600, marginBottom: '4px' }}>{a.title}</div>
                  <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{a.body}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Portfolio by Status · Click any initiative for detail</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '28px' }}>
              {[
                { label: 'Live', count: live.length, value: `$${totalActual}M actual`, color: TEAL, items: live },
                { label: 'Stalled', count: stalled.length, value: `$${stalledValue}M locked`, color: RED, items: stalled },
                { label: 'In Planning', count: planning.length, value: `$${planningValue}M planned`, color: INDIGO, items: planning },
                { label: 'Cancelled', count: cancelled.length, value: `$${Math.round(cancelled.reduce((s,i)=>s+i.investment,0))}M written off`, color: MUTED, items: cancelled },
              ].map(group => (
                <div key={group.label} style={{ background: CARD, border: `1px solid ${group.color}25`, borderTop: `2px solid ${group.color}`, borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, fontWeight: 600 }}>{group.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: group.color, flexShrink: 0 }} />
                      <div style={{ fontFamily: MONO, fontSize: '18px', color: WHITE, fontWeight: 700 }}>{group.count}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, marginBottom: '10px' }}>{group.value}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {group.items.slice(0, 3).map(init => (
                      <button key={init.id} onClick={() => { setSelectedInit(init); setActiveTab('initiatives') }}
                        style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                        <div style={{ fontFamily: SANS, fontSize: '10px', color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{init.name}</div>
                      </button>
                    ))}
                    {group.items.length > 3 && <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>+{group.items.length - 3} more</div>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Root Cause Map · Click for detail</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {currentBlockers.map(b => (
                <button key={b.id} onClick={() => { setSelectedBlocker(b); setActiveTab('blockers') }}
                  style={{ textAlign: 'left', background: CARD, border: `1px solid ${b.color}25`, borderTop: `2px solid ${b.color}`, borderRadius: '8px', padding: '14px', cursor: 'pointer' }}>
                  <div style={{ fontFamily: SANS, fontSize: '12px', color: WHITE, fontWeight: 600, marginBottom: '4px', lineHeight: 1.3 }}>{b.label.split(' — ')[0]}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '2px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                    <div style={{ fontFamily: MONO, fontSize: '16px', color: WHITE, fontWeight: 700 }}>${b.lockedValue}M</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>{b.count} initiatives blocked</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── INITIATIVE DETAIL ── */}
        {activeTab === 'initiatives' && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[
                { label: 'Live', items: live },
                { label: 'Stalled', items: stalled },
                { label: 'In Planning', items: planning },
                { label: 'Cancelled', items: cancelled },
              ].map(({ label, items }) => items.length > 0 && (
                <div key={label}>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: DIM, letterSpacing: '.1em', textTransform: 'uppercase', padding: '10px 10px 6px', marginTop: '4px' }}>
                    {label} · {items.length}
                  </div>
                  {items.map(init => {
                    const sc = statusConfig(init.status)
                    const active = selectedInit?.id === init.id
                    return (
                      <button key={init.id} onClick={() => { setSelectedInit(init); setSelectedBlocker(null) }}
                        style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: '6px', cursor: 'pointer', border: `1px solid ${active ? sc.color + '40' : 'transparent'}`, background: active ? `${sc.color}08` : 'transparent', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: SANS, fontSize: '12px', color: active ? WHITE : MUTED, fontWeight: active ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {init.name}
                          </div>
                          <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM, marginTop: '1px' }}>
                            ${init.investment}M · {init.valueCommitted > 0 ? `→$${init.valueCommitted}M` : 'N/A'}
                          </div>
                        </div>
                        {init.rootCause !== 'none' && (
                          <div style={{ fontFamily: MONO, fontSize: '7px', color: MUTED, background: 'rgba(255,255,255,0.06)', borderRadius: '3px', padding: '1px 4px', flexShrink: 0, border: `1px solid ${BORDER}` }}>
                            {rootCauseLabel(init.rootCause, clientId).split(' ')[0]}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
            {/* Right: detail or prompt */}
            <div>
              {selectedInit ? (() => {
                const sc = statusConfig(selectedInit.status)
                const performancePct = selectedInit.valueCommitted > 0 ? Math.round((selectedInit.valueActual / selectedInit.valueCommitted) * 100) : 0
                const rcColor = rootCauseColor(selectedInit.rootCause)
                return (
                  <div>
                    <div style={{ background: CARD, border: `1px solid ${sc.color}30`, borderTop: `3px solid ${sc.color}`, borderRadius: '10px', padding: '24px', marginBottom: '16px' }}>
                      <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{sc.label} · {selectedInit.category}</div>
                      <h2 style={{ fontFamily: SANS, fontSize: '22px', fontWeight: 700, color: WHITE, margin: '0 0 4px' }}>{selectedInit.name}</h2>
                      {selectedInit.monthsStuck > 0 && <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, marginBottom: '16px' }}>{selectedInit.monthsStuck} months stalled · ${selectedInit.investment}M invested</div>}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '16px' }}>
                        {[
                          { label: 'Invested', value: `$${selectedInit.investment}M`, color: WHITE },
                          { label: 'Committed Value', value: selectedInit.valueCommitted > 0 ? `$${selectedInit.valueCommitted}M/yr` : 'N/A', color: MUTED },
                          { label: 'Actual Value', value: selectedInit.valueActual > 0 ? `$${selectedInit.valueActual}M/yr` : '$0', color: WHITE, dot: selectedInit.valueActual > 0 ? TEAL : RED },
                          { label: 'Performance', value: selectedInit.valueCommitted > 0 ? `${performancePct}%` : '—', color: WHITE, dot: performancePct === 0 ? RED : performancePct < 50 ? AMBER : GREEN },
                        ].map(m => (
                          <div key={m.label} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '10px 12px' }}>
                            <div style={{ fontFamily: MONO, fontSize: '8px', color: DIM, marginBottom: '4px' }}>{m.label}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              {(m as any).dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: (m as any).dot, flexShrink: 0 }} />}
                              <div style={{ fontFamily: MONO, fontSize: '13px', color: m.color, fontWeight: 600 }}>{m.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>
                      <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Current Status</div>
                      <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, lineHeight: 1.65 }}>{selectedInit.outcome}</div>
                    </div>
                    {selectedInit.rootCause !== 'none' && (
                      <div style={{ background: `${rcColor}06`, border: `1px solid ${rcColor}25`, borderRadius: '10px', padding: '16px 20px', marginBottom: '12px' }}>
                        <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Root Cause · {rootCauseLabel(selectedInit.rootCause, clientId)}</div>
                        <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>{selectedInit.blocker}</div>
                      </div>
                    )}
                    <div style={{ background: 'rgba(45,212,200,0.04)', border: `1px solid rgba(45,212,200,0.2)`, borderRadius: '10px', padding: '16px 20px' }}>
                      <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Recommended Action</div>
                      <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, lineHeight: 1.65 }}>{selectedInit.recommendation}</div>
                      <button
                        onClick={() => { sendChat(`I need a detailed action plan for ${selectedInit!.name}. Current status: ${selectedInit!.outcome} The specific blocker is: ${selectedInit!.blocker} What are my next 3 moves to unblock this initiative?`); setActiveTab('chat') }}
                        style={{ marginTop: '12px', fontFamily: MONO, fontSize: '10px', padding: '8px 16px', background: 'rgba(45,212,200,0.1)', border: `1px solid rgba(45,212,200,0.3)`, borderRadius: '6px', color: TEAL, cursor: 'pointer' }}>
                        Build action plan for {selectedInit.name} →
                      </button>
                    </div>
                  </div>
                )
              })() : (
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '40px', textAlign: 'center' as const }}>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Select an initiative</div>
                  <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED }}>Click any initiative from the list to see its status, root cause, and recommended action.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ROOT CAUSES ── */}
        {activeTab === 'blockers' && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>
            {/* Left: blocker list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontFamily: SANS, fontSize: '11px', color: DIM, marginBottom: '4px', lineHeight: 1.5 }}>
                {isMeridian ? '4 root causes constrain 9 of 10 initiatives. Fix these in sequence and the portfolio unlocks.' : '4 root causes block 25 of 28 initiatives. Fix these in sequence and the portfolio unlocks.'}
              </div>
              {currentBlockers.map(b => (
                <button key={b.id} onClick={() => setSelectedBlocker(b)}
                  style={{ textAlign: 'left', background: selectedBlocker?.id === b.id ? `${b.color}08` : CARD, border: `1px solid ${selectedBlocker?.id === b.id ? b.color + '50' : b.color + '20'}`, borderLeft: `3px solid ${b.color}`, borderRadius: '6px', padding: '12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ fontFamily: SANS, fontSize: '12px', color: WHITE, fontWeight: 600, lineHeight: 1.3, flex: 1, marginRight: '8px' }}>{b.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: '8px', color: MUTED, background: BORDER, borderRadius: '3px', padding: '1px 5px', flexShrink: 0 }}>{b.count} init</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED }}>${b.lockedValue}M locked</div>
                </button>
              ))}
              <div style={{ marginTop: '4px', background: 'rgba(45,212,200,0.04)', border: `1px solid rgba(45,212,200,0.15)`, borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: TEAL, marginBottom: '4px' }}>CRITICAL PATH</div>
                <div style={{ fontFamily: SANS, fontSize: '11px', color: MUTED, lineHeight: 1.5 }}>{isMeridian ? 'CDO hire unblocks everything else. CDO → Azure Synapse completes (data foundation) → MLOps deployment rails → Ensemble negotiation at October 2026 renewal. This is the only sequence that works.' : 'CDO hire unblocks everything else. Fix CDO → governance framework resolves CRO → SSO fixes FSC → Bloomberg negotiation follows. This is the only sequence that works.'}</div>
              </div>
            </div>
            {/* Right: blocker detail or prompt */}
            <div>
              {selectedBlocker ? (
                <div>
                  <div style={{ background: CARD, border: `1px solid ${selectedBlocker.color}30`, borderTop: `3px solid ${selectedBlocker.color}`, borderRadius: '10px', padding: '24px', marginBottom: '16px' }}>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Root Cause Analysis</div>
                    <h2 style={{ fontFamily: SANS, fontSize: '22px', fontWeight: 700, color: WHITE, margin: '0 0 16px' }}>{selectedBlocker.label}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { label: 'Blocked Initiatives', value: `${selectedBlocker.count}` },
                        { label: 'Locked Annual Value', value: `$${selectedBlocker.lockedValue}M` },
                      ].map(m => (
                        <div key={m.label} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '12px 16px' }}>
                          <div style={{ fontFamily: MONO, fontSize: '8px', color: DIM, marginBottom: '4px' }}>{m.label}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: selectedBlocker.color, flexShrink: 0 }} />
                            <div style={{ fontFamily: MONO, fontSize: '20px', color: WHITE, fontWeight: 700 }}>{m.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>What Is Blocking Progress</div>
                    <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, lineHeight: 1.65 }}>{selectedBlocker.description}</div>
                  </div>
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '12px' }}>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Affected Initiatives</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedBlocker.initiatives.map((name, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: selectedBlocker.color, flexShrink: 0 }} />
                          <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED }}>{name}</div>
                        </div>
                      ))}
                    </div>
                    {selectedBlocker.secondaryImpact && (
                      <div style={{ marginTop: '12px', padding: '10px 12px', background: `${selectedBlocker.color}08`, border: `1px solid ${selectedBlocker.color}20`, borderRadius: '6px', fontFamily: SANS, fontSize: '11px', color: DIM, lineHeight: 1.5 }}>
                        Secondary impact: {selectedBlocker.secondaryImpact}
                      </div>
                    )}
                  </div>
                  <div style={{ background: 'rgba(45,212,200,0.04)', border: `1px solid rgba(45,212,200,0.2)`, borderRadius: '10px', padding: '16px 20px' }}>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>How to Fix</div>
                    <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, lineHeight: 1.65 }}>{selectedBlocker.fix}</div>
                    <button
                      onClick={() => { sendChat(`I need a detailed action plan to resolve the "${selectedBlocker!.label}" blocker. It is blocking ${selectedBlocker!.count} AI initiatives and locking $${selectedBlocker!.lockedValue}M in annual value. ${selectedBlocker!.description} What are the exact steps I need to take in the next 90 days?`); setActiveTab('chat') }}
                      style={{ marginTop: '12px', fontFamily: MONO, fontSize: '10px', padding: '8px 16px', background: 'rgba(45,212,200,0.1)', border: `1px solid rgba(45,212,200,0.3)`, borderRadius: '6px', color: TEAL, cursor: 'pointer' }}>
                      90-day unblock plan for {selectedBlocker.label} →
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '40px', textAlign: 'center' as const }}>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Select a root cause</div>
                  <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED }}>Click any root cause from the list to see what is blocking progress and how to fix it.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ROADMAP ── */}
        {activeTab === 'roadmap' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
              {currentRoadmap.map(w => (
                <div key={w.wave} style={{ background: CARD, border: `1px solid ${w.color}25`, borderTop: `3px solid ${w.color}`, borderRadius: '10px', padding: '20px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>WAVE {w.wave} · MONTHS {w.months}</div>
                  <div style={{ fontFamily: SANS, fontSize: '18px', fontWeight: 700, color: WHITE, marginBottom: '12px' }}>{w.name}</div>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: '14px', color: WHITE, fontWeight: 600 }}>${w.investment}M</div>
                      <div style={{ fontFamily: MONO, fontSize: '8px', color: DIM }}>INVESTED</div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: w.color, flexShrink: 0 }} />
                        <div style={{ fontFamily: MONO, fontSize: '14px', color: WHITE, fontWeight: 600 }}>${w.annualValue}M/yr</div>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: '8px', color: DIM }}>ANNUAL VALUE</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, marginBottom: '10px' }}>PREREQUISITE: {w.prerequisite}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                    {w.initiatives.map((init, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: w.color, flexShrink: 0 }} />
                        <div style={{ fontFamily: SANS, fontSize: '11px', color: MUTED }}>{init}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '10px', marginBottom: '10px' }}>
                    <div style={{ fontFamily: MONO, fontSize: '8px', color: DIM, marginBottom: '4px' }}>OUTCOME</div>
                    <div style={{ fontFamily: SANS, fontSize: '11px', color: MUTED, lineHeight: 1.5 }}>{w.outcome}</div>
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: '10px', color: DIM, lineHeight: 1.4 }}>
                    <span style={{ color: TEAL }}>Unlocks: </span>{w.unlocks}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(45,212,200,0.04)', border: `1px solid rgba(45,212,200,0.15)`, borderRadius: '10px', padding: '20px 28px', display: 'flex', alignItems: 'center', gap: '40px' }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>PROGRAMME TOTAL</div>
                <div style={{ fontFamily: MONO, fontSize: '26px', color: WHITE, fontWeight: 700 }}>{isMeridian ? '$18.8M → $170M/yr' : '$66M → $412M/yr'}</div>
              </div>
              <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, lineHeight: 1.65 }}>{isMeridian ? 'Waves 1–3 over 30 months. 9.0× annual value on investment. CDO hire on day 1 is the critical path — every month of CDO vacancy compounds across the entire portfolio.' : 'Waves 1–3 over 30 months. 6.2× annual value on investment. CDO hire on day 1 is the critical path — every month of CDO vacancy compounds across the entire portfolio.'}</div>
            </div>
          </div>
        )}

        {/* ── ASK MAESTRO ── */}
        {activeTab === 'chat' && (
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '4px' }}>Programme Intelligence</div>
              <div style={{ fontFamily: SANS, fontSize: '13px', color: DIM, marginBottom: '20px', lineHeight: 1.5 }}>Ask about specific initiatives, unblock sequences, board narratives, or ROI baselines.</div>
              {chatMessages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {currentPreBuilt.map((q, i) => (
                    <button key={i} onClick={() => sendChat(q)}
                      style={{ textAlign: 'left', background: BG, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '12px 14px', cursor: 'pointer', fontFamily: SANS, fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>
                      {q.length > 120 ? q.slice(0, 120) + '…' : q}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '85%', padding: '12px 16px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? 'rgba(45,212,200,0.12)' : BG, border: `1px solid ${m.role === 'user' ? 'rgba(45,212,200,0.25)' : BORDER}`, fontFamily: SANS, fontSize: '13px', color: m.role === 'user' ? TEAL : MUTED, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {(chatLoading || streamingResponse) && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ maxWidth: '85%', padding: '12px 16px', borderRadius: '12px 12px 12px 2px', background: BG, border: `1px solid ${BORDER}`, fontFamily: SANS, fontSize: '13px', color: MUTED, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {streamingResponse || '…'}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()} placeholder="Ask about any initiative…" disabled={chatLoading} style={{ flex: 1, background: BG, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px', color: WHITE, fontFamily: SANS, fontSize: '13px', outline: 'none' }} />
                <button onClick={() => sendChat()} disabled={chatLoading || !chatInput.trim()} style={{ background: chatLoading ? BORDER : TEAL, color: chatLoading ? DIM : BG, border: 'none', borderRadius: '8px', padding: '10px 16px', fontFamily: MONO, fontSize: '12px', cursor: chatLoading ? 'default' : 'pointer', fontWeight: 700 }}>→</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function AIDeliveryPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#060A12' }} />}>
      <AIDeliveryContent />
    </Suspense>
  )
}

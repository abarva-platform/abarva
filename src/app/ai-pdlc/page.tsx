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

// ── Helpers ────────────────────────────────────────────────────────────────────
function statusConfig(s: InitStatus) {
  if (s === 'live-underperforming') return { label: 'LIVE · UNDERPERFORMING', color: AMBER, dot: AMBER }
  if (s === 'live-limited') return { label: 'LIVE · LIMITED SCOPE', color: TEAL, dot: TEAL }
  if (s === 'live-legacy') return { label: 'LIVE · LEGACY RISK', color: GREEN, dot: GREEN }
  if (s === 'stalled') return { label: 'STALLED', color: RED, dot: RED }
  if (s === 'cancelled') return { label: 'CANCELLED', color: MUTED, dot: 'rgba(255,255,255,0.3)' }
  return { label: 'IN PLANNING', color: INDIGO, dot: INDIGO }
}

function rootCauseLabel(r: RootCause) {
  if (r === 'cdo') return 'CDO Vacancy'
  if (r === 'cro') return 'CRO Freeze'
  if (r === 'fsc') return 'FSC Adoption'
  if (r === 'bloomberg') return 'Bloomberg Data'
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
  const [activeTab, setActiveTab] = useState<'initiatives' | 'blockers' | 'roadmap'>('initiatives')
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [streamingResponse, setStreamingResponse] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, streamingResponse])

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

  const live = INITIATIVES.filter(i => i.status.startsWith('live'))
  const stalled = INITIATIVES.filter(i => i.status === 'stalled')
  const planning = INITIATIVES.filter(i => i.status === 'planning')
  const cancelled = INITIATIVES.filter(i => i.status === 'cancelled')

  const totalInvested = INITIATIVES.reduce((s, i) => s + i.investment, 0)
  const totalActual = INITIATIVES.reduce((s, i) => s + i.valueActual, 0)
  const totalCommitted = INITIATIVES.reduce((s, i) => s + i.valueCommitted, 0)
  const roiPct = Math.round((totalActual / totalInvested) * 100)

  const stalledValue = stalled.reduce((s, i) => s + i.valueCommitted, 0)
  const planningValue = planning.reduce((s, i) => s + i.valueCommitted, 0)

  function handleTabChange(tab: typeof activeTab) {
    setActiveTab(tab)
    setSelectedInit(null)
    setSelectedBlocker(null)
  }

  const centerIsEmpty = !selectedInit && !selectedBlocker

  const currentClientName = ALL_CLIENTS.find(c => c.id === clientId)?.name || 'your account'

  // Non-Arcturus client users: show coming-soon state (account isolation)
  if (clientId !== 'arcturus') {
    return (
      <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE, display: 'flex', flexDirection: 'column' }}>
        <AbarvaNav activePage="ai-pdlc" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '60px 24px' }}>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase' }}>AI Programme Intelligence · {currentClientName}</div>
          <h2 style={{ fontFamily: SANS, fontSize: '22px', fontWeight: 700, color: WHITE, margin: 0, textAlign: 'center' }}>AI Initiative Portfolio</h2>
          <p style={{ fontFamily: SANS, fontSize: '14px', color: MUTED, maxWidth: '480px', textAlign: 'center', lineHeight: 1.6 }}>
            Your AI programme data is being prepared. This module will track your AI initiative portfolio, investment ROI, blockers, and three-wave delivery roadmap.
          </p>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, background: `${TEAL}15`, border: `1px solid ${TEAL}35`, borderRadius: '6px', padding: '8px 20px' }}>
            Coming soon — engagement scoping in progress
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE, display: 'flex', flexDirection: 'column' }}>
      <AbarvaNav activePage="ai-pdlc" />

      {/* Header */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '20px 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '6px' }}>
                AI Programme Intelligence · Arcturus Financial Group · April 2026
              </div>
              <h1 style={{ fontFamily: SANS, fontSize: '22px', fontWeight: 700, color: WHITE, margin: 0 }}>
                AI Initiative Portfolio
              </h1>
              <p style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, margin: '4px 0 0', lineHeight: 1.5 }}>
                28 initiatives · $94M invested · {live.length} live · {stalled.length} stalled · {planning.length} in planning · ${totalActual}M actual annual value
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Invested', value: `$${Math.round(totalInvested)}M`, color: WHITE, sub: 'Committed to AI since 2021' },
                { label: 'Actual ROI', value: `${roiPct}%`, color: RED, sub: `$${totalActual}M of $${Math.round(totalCommitted)}M committed` },
                { label: 'Stalled Value', value: `$${stalledValue}M`, color: AMBER, sub: `${stalled.length} initiatives — no progress` },
                { label: 'Immediate Action', value: 'Day 1', color: GREEN, sub: 'Daily Stress Testing — CRO approved' },
              ].map(m => (
                <div key={m.label} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 16px', textAlign: 'right', minWidth: '140px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 700, color: m.color }}>{m.value}</div>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, marginTop: '2px' }}>{m.label}</div>
                  <div style={{ fontFamily: SANS, fontSize: '10px', color: DIM, marginTop: '1px' }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '24px 32px', gap: '20px' }}>

        {/* LEFT — Navigation panel */}
        <div style={{ width: '280px', flexShrink: 0 }}>
          {/* Tab nav */}
          <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>
            {([['initiatives', 'Initiatives'], ['blockers', 'Root Causes'], ['roadmap', 'Roadmap']] as const).map(([id, label]) => (
              <button key={id} onClick={() => handleTabChange(id)}
                style={{ flex: 1, fontFamily: MONO, fontSize: '9px', padding: '6px 4px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer', border: `1px solid ${activeTab === id ? TEAL : BORDER}`, background: activeTab === id ? 'rgba(45,212,200,0.08)' : BG, color: activeTab === id ? TEAL : MUTED }}>
                {label}
              </button>
            ))}
          </div>

          {/* INITIATIVES TAB */}
          {activeTab === 'initiatives' && (
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
                          <div style={{ fontFamily: MONO, fontSize: '7px', color: rootCauseColor(init.rootCause), background: `${rootCauseColor(init.rootCause)}15`, borderRadius: '3px', padding: '1px 4px', flexShrink: 0 }}>
                            {rootCauseLabel(init.rootCause).split(' ')[0]}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* BLOCKERS TAB */}
          {activeTab === 'blockers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontFamily: SANS, fontSize: '11px', color: DIM, marginBottom: '4px', lineHeight: 1.5 }}>
                4 root causes block 25 of 28 initiatives. Fix these in sequence and the portfolio unlocks.
              </div>
              {BLOCKERS.map(b => (
                <button key={b.id} onClick={() => { setSelectedBlocker(b); setSelectedInit(null) }}
                  style={{ textAlign: 'left', background: selectedBlocker?.id === b.id ? `${b.color}08` : CARD, border: `1px solid ${selectedBlocker?.id === b.id ? b.color + '50' : b.color + '20'}`, borderLeft: `3px solid ${b.color}`, borderRadius: '6px', padding: '12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ fontFamily: SANS, fontSize: '12px', color: WHITE, fontWeight: 600, lineHeight: 1.3, flex: 1, marginRight: '8px' }}>{b.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: '8px', color: b.color, background: `${b.color}15`, borderRadius: '3px', padding: '1px 5px', flexShrink: 0 }}>{b.count} init</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: b.color }}>${b.lockedValue}M locked</div>
                </button>
              ))}
              <div style={{ marginTop: '4px', background: 'rgba(45,212,200,0.04)', border: `1px solid rgba(45,212,200,0.15)`, borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: TEAL, marginBottom: '4px' }}>CRITICAL PATH</div>
                <div style={{ fontFamily: SANS, fontSize: '11px', color: MUTED, lineHeight: 1.5 }}>CDO hire unblocks everything else. Fix CDO → governance framework resolves CRO → SSO fixes FSC → Bloomberg negotiation follows. This is the only sequence that works.</div>
              </div>
            </div>
          )}

          {/* ROADMAP TAB */}
          {activeTab === 'roadmap' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ROADMAP.map(w => (
                <div key={w.wave} style={{ background: CARD, border: `1px solid ${w.color}25`, borderLeft: `3px solid ${w.color}`, borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: w.color, marginBottom: '4px' }}>WAVE {w.wave} · {w.months} MONTHS</div>
                  <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, fontWeight: 600, marginBottom: '4px' }}>{w.name}</div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: '10px', color: WHITE }}>${w.investment}M</div>
                      <div style={{ fontFamily: MONO, fontSize: '8px', color: DIM }}>invested</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: '10px', color: w.color }}>${w.annualValue}M</div>
                      <div style={{ fontFamily: MONO, fontSize: '8px', color: DIM }}>annual value</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: '10px', color: DIM, lineHeight: 1.4 }}>{w.prerequisite}</div>
                </div>
              ))}
              <div style={{ background: 'rgba(45,212,200,0.04)', border: `1px solid rgba(45,212,200,0.15)`, borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: TEAL, marginBottom: '4px' }}>PROGRAMME TOTAL</div>
                <div style={{ fontFamily: MONO, fontSize: '14px', color: WHITE, marginBottom: '2px' }}>$66M → $412M/yr</div>
                <div style={{ fontFamily: SANS, fontSize: '10px', color: MUTED }}>Waves 1–3 over 30 months. 6.2× annual value on investment.</div>
              </div>
            </div>
          )}
        </div>

        {/* CENTER — Detail or Overview */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* INITIATIVE DETAIL */}
          {selectedInit && (
            <div>
              <button onClick={() => setSelectedInit(null)}
                style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
                ← Back to portfolio
              </button>

              {/* Header */}
              {(() => {
                const sc = statusConfig(selectedInit.status)
                const performancePct = selectedInit.valueCommitted > 0 ? Math.round((selectedInit.valueActual / selectedInit.valueCommitted) * 100) : 0
                const rcColor = rootCauseColor(selectedInit.rootCause)
                return (
                  <div>
                    <div style={{ background: CARD, border: `1px solid ${sc.color}30`, borderTop: `3px solid ${sc.color}`, borderRadius: '10px', padding: '24px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                          <div style={{ fontFamily: MONO, fontSize: '9px', color: sc.color, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                            {sc.label} · {selectedInit.category}
                          </div>
                          <h2 style={{ fontFamily: SANS, fontSize: '22px', fontWeight: 700, color: WHITE, margin: 0 }}>{selectedInit.name}</h2>
                          {selectedInit.monthsStuck > 0 && (
                            <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, marginTop: '4px' }}>
                              {selectedInit.monthsStuck} months stalled · ${selectedInit.investment}M invested
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        {[
                          { label: 'Invested', value: `$${selectedInit.investment}M`, color: WHITE },
                          { label: 'Committed Value', value: selectedInit.valueCommitted > 0 ? `$${selectedInit.valueCommitted}M/yr` : 'N/A', color: MUTED },
                          { label: 'Actual Value', value: selectedInit.valueActual > 0 ? `$${selectedInit.valueActual}M/yr` : '$0', color: selectedInit.valueActual > 0 ? TEAL : RED },
                          { label: 'Performance', value: selectedInit.valueCommitted > 0 ? `${performancePct}%` : '—', color: performancePct === 0 ? RED : performancePct < 50 ? AMBER : GREEN },
                        ].map(m => (
                          <div key={m.label} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '10px 12px' }}>
                            <div style={{ fontFamily: MONO, fontSize: '8px', color: DIM, marginBottom: '4px' }}>{m.label}</div>
                            <div style={{ fontFamily: MONO, fontSize: '13px', color: m.color, fontWeight: 600 }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Outcome */}
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>
                      <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Current Status</div>
                      <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, lineHeight: 1.65 }}>{selectedInit.outcome}</div>
                    </div>

                    {/* Blocker */}
                    {selectedInit.rootCause !== 'none' && (
                      <div style={{ background: `${rcColor}06`, border: `1px solid ${rcColor}25`, borderRadius: '10px', padding: '16px 20px', marginBottom: '12px' }}>
                        <div style={{ fontFamily: MONO, fontSize: '9px', color: rcColor, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Root Cause · {rootCauseLabel(selectedInit.rootCause)}
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>{selectedInit.blocker}</div>
                      </div>
                    )}

                    {/* Recommendation */}
                    <div style={{ background: 'rgba(45,212,200,0.04)', border: `1px solid rgba(45,212,200,0.2)`, borderRadius: '10px', padding: '16px 20px' }}>
                      <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Recommended Action</div>
                      <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, lineHeight: 1.65 }}>{selectedInit.recommendation}</div>
                      <button
                        onClick={() => sendChat(`I need a detailed action plan for ${selectedInit.name}. Current status: ${selectedInit.outcome} The specific blocker is: ${selectedInit.blocker} What are my next 3 moves to unblock this initiative?`)}
                        style={{ marginTop: '12px', fontFamily: MONO, fontSize: '10px', padding: '8px 16px', background: 'rgba(45,212,200,0.1)', border: `1px solid rgba(45,212,200,0.3)`, borderRadius: '6px', color: TEAL, cursor: 'pointer' }}>
                        Build action plan for {selectedInit.name} →
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* BLOCKER DETAIL */}
          {selectedBlocker && (
            <div>
              <button onClick={() => setSelectedBlocker(null)}
                style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
                ← Back to root causes
              </button>

              <div style={{ background: CARD, border: `1px solid ${selectedBlocker.color}30`, borderTop: `3px solid ${selectedBlocker.color}`, borderRadius: '10px', padding: '24px', marginBottom: '16px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: selectedBlocker.color, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Root Cause Analysis</div>
                <h2 style={{ fontFamily: SANS, fontSize: '22px', fontWeight: 700, color: WHITE, margin: '0 0 16px' }}>{selectedBlocker.label}</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'Blocked Initiatives', value: `${selectedBlocker.count}`, color: selectedBlocker.color },
                    { label: 'Locked Annual Value', value: `$${selectedBlocker.lockedValue}M`, color: selectedBlocker.color },
                  ].map(m => (
                    <div key={m.label} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '12px 16px' }}>
                      <div style={{ fontFamily: MONO, fontSize: '8px', color: DIM, marginBottom: '4px' }}>{m.label}</div>
                      <div style={{ fontFamily: MONO, fontSize: '20px', color: m.color, fontWeight: 700 }}>{m.value}</div>
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
                  onClick={() => sendChat(`I need a detailed action plan to resolve the "${selectedBlocker.label}" blocker. It is blocking ${selectedBlocker.count} AI initiatives and locking $${selectedBlocker.lockedValue}M in annual value. ${selectedBlocker.description} What are the exact steps I need to take in the next 90 days?`)}
                  style={{ marginTop: '12px', fontFamily: MONO, fontSize: '10px', padding: '8px 16px', background: 'rgba(45,212,200,0.1)', border: `1px solid rgba(45,212,200,0.3)`, borderRadius: '6px', color: TEAL, cursor: 'pointer' }}>
                  90-day unblock plan for {selectedBlocker.label} →
                </button>
              </div>
            </div>
          )}

          {/* OVERVIEW */}
          {centerIsEmpty && (
            <div>
              {/* Programme scorecard */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  AI Programme State · Arcturus Financial Group
                </div>

                {/* Headline alerts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {[
                    {
                      severity: RED,
                      title: '$94M invested, $35M actual value — 63% programme shortfall',
                      body: '14 stalled initiatives, 2 cancelled. 4 root causes are blocking the entire portfolio: CDO vacancy, CRO governance freeze, FSC 44% adoption, Bloomberg data restrictions. These are not separate problems — they form a dependency chain.',
                    },
                    {
                      severity: GREEN,
                      title: 'One initiative has NO blocker and CRO has approved: Daily Stress Testing',
                      body: '$2.4M investment, $18M annual value, 6-month timeline, Aladdin configuration change only — no migration, no CDO needed, no governance framework needed. This starts TODAY.',
                    },
                    {
                      severity: AMBER,
                      title: 'FSC SSO is the single fix that unlocks $156M in locked value',
                      body: '4 AI initiatives share the identical root cause: Salesforce FSC 44% adoption. Bloomberg→FSC SSO integration is one infrastructure change. It does not require behaviour change from advisors. It unlocks all 4 initiatives simultaneously.',
                    },
                    {
                      severity: INDIGO,
                      title: 'CDO hire is the critical path — it unblocks everything else',
                      body: 'CDO vacancy enables the AI Governance Framework (CRO unblock), Golden Record (data foundation), and Bloomberg Phase 4 (API negotiations). CDO hire is the single decision that has the largest downstream impact on portfolio value.',
                    },
                  ].map((a, i) => (
                    <div key={i} style={{ background: CARD, border: `1px solid ${a.severity}25`, borderLeft: `3px solid ${a.severity}`, borderRadius: '8px', padding: '14px 18px' }}>
                      <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, fontWeight: 600, marginBottom: '4px' }}>{a.title}</div>
                      <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{a.body}</div>
                    </div>
                  ))}
                </div>

                {/* Initiative breakdown grid */}
                <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Portfolio by Status · Click any initiative for detail
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { label: 'Live', count: live.length, value: `$${totalActual}M actual`, color: TEAL, items: live },
                    { label: 'Stalled', count: stalled.length, value: `$${stalledValue}M locked`, color: RED, items: stalled },
                    { label: 'In Planning', count: planning.length, value: `$${planningValue}M planned`, color: INDIGO, items: planning },
                    { label: 'Cancelled', count: cancelled.length, value: `$${Math.round(cancelled.reduce((s,i)=>s+i.investment,0))}M written off`, color: MUTED, items: cancelled },
                  ].map(group => (
                    <div key={group.label} style={{ background: CARD, border: `1px solid ${group.color}25`, borderTop: `2px solid ${group.color}`, borderRadius: '8px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, fontWeight: 600 }}>{group.label}</div>
                        <div style={{ fontFamily: MONO, fontSize: '18px', color: group.color, fontWeight: 700 }}>{group.count}</div>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: '10px', color: group.color, marginBottom: '10px' }}>{group.value}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {group.items.slice(0, 3).map(init => (
                          <button key={init.id} onClick={() => { setSelectedInit(init); setActiveTab('initiatives') }}
                            style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                            <div style={{ fontFamily: SANS, fontSize: '10px', color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {init.name}
                            </div>
                          </button>
                        ))}
                        {group.items.length > 3 && (
                          <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>+{group.items.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Root cause summary */}
              <div style={{ marginTop: '4px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Root Cause Map · Click for detail
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {BLOCKERS.map(b => (
                    <button key={b.id} onClick={() => { setSelectedBlocker(b); setActiveTab('blockers') }}
                      style={{ textAlign: 'left', background: CARD, border: `1px solid ${b.color}25`, borderTop: `2px solid ${b.color}`, borderRadius: '8px', padding: '14px', cursor: 'pointer' }}>
                      <div style={{ fontFamily: SANS, fontSize: '12px', color: WHITE, fontWeight: 600, marginBottom: '4px', lineHeight: 1.3 }}>{b.label.split(' — ')[0]}</div>
                      <div style={{ fontFamily: MONO, fontSize: '16px', color: b.color, fontWeight: 700, marginBottom: '2px' }}>${b.lockedValue}M</div>
                      <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>{b.count} initiatives blocked</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Chat */}
        <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
              Programme Intelligence
            </div>
            <div style={{ fontFamily: SANS, fontSize: '11px', color: DIM, marginBottom: '12px', lineHeight: 1.4 }}>
              Ask about specific initiatives, unblock sequences, board narratives, or ROI baselines.
            </div>

            {/* Pre-built questions */}
            {chatMessages.length === 0 && (
              <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {PRE_BUILT.map((q, i) => (
                  <button key={i} onClick={() => sendChat(q)}
                    style={{ textAlign: 'left', background: BG, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '9px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: '11px', color: MUTED, lineHeight: 1.4 }}>
                    {q.length > 90 ? q.slice(0, 90) + '…' : q}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '90%', padding: '10px 12px', borderRadius: m.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                    background: m.role === 'user' ? 'rgba(45,212,200,0.12)' : CARD,
                    border: `1px solid ${m.role === 'user' ? 'rgba(45,212,200,0.25)' : BORDER}`,
                    fontFamily: SANS, fontSize: '12px', color: m.role === 'user' ? TEAL : MUTED, lineHeight: 1.55, whiteSpace: 'pre-wrap',
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {(chatLoading || streamingResponse) && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ maxWidth: '90%', padding: '10px 12px', borderRadius: '10px 10px 10px 2px', background: CARD, border: `1px solid ${BORDER}`, fontFamily: SANS, fontSize: '12px', color: MUTED, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                    {streamingResponse || '…'}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                placeholder="Ask about any initiative…"
                disabled={chatLoading}
                style={{ flex: 1, background: BG, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '8px 10px', color: WHITE, fontFamily: SANS, fontSize: '12px', outline: 'none' }}
              />
              <button onClick={() => sendChat()}
                disabled={chatLoading || !chatInput.trim()}
                style={{ background: chatLoading ? BORDER : TEAL, color: chatLoading ? DIM : BG, border: 'none', borderRadius: '6px', padding: '8px 12px', fontFamily: MONO, fontSize: '10px', cursor: chatLoading ? 'default' : 'pointer', fontWeight: 700 }}>
                →
              </button>
            </div>
          </div>
        </div>
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

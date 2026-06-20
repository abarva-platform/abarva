/* AbarVa · IT Investment Tower — DATA MODEL
   First Capital Financial · synthetic reference dataset (not a real customer).
   $342M FY26 IT budget. Every slice (CapEx/OpEx, category, Run/Change, function,
   vendor, AI) is COMPUTED from the program rows below, so all views reconcile. */

// ── PROGRAMS (top 10 IT programs; AI portion tracked within each) ──────
// budget = capex + opex; mix{software,hardware,services,cloud,labor} sums to budget.
const PROGRAMS = [
  { id: 'P1', name: 'Core Banking Platform', fn: 'Retail Banking', owner: 'CIO', cat: 'Run', vendor: 'FIS', budget: 84, ytd: 45.0, capex: 8, opex: 76,
    mix: { software: 28, services: 34, hardware: 6, cloud: 4, labor: 12 }, aiBudget: 3.0, aiYtd: 0.84, status: 'watch',
    note: 'FIS core AMS $38M/yr renews Feb 2027 — the largest run-and-sustain line, mostly fixed.', inits: ['FCF-INIT-011', 'FCF-INIT-003'] },
  { id: 'P2', name: 'Infrastructure & Hosting', fn: 'Technology', owner: 'VP Infrastructure', cat: 'Run', vendor: 'DXC', budget: 48, ytd: 26.4, capex: 6, opex: 42,
    mix: { hardware: 13, services: 22, cloud: 11, software: 1, labor: 1 }, aiBudget: 0, aiYtd: 0, status: 'watch',
    note: 'DXC mainframe AMS $26M/yr renews Nov 30, 2026 — the nearest contract leverage window.', inits: [] },
  { id: 'P3', name: 'Risk & Compliance Technology', fn: 'Risk & Compliance', owner: 'Chief Risk Officer', cat: 'Change', vendor: 'NICE Actimize', budget: 52, ytd: 28.6, capex: 18, opex: 34,
    mix: { software: 22, services: 16, cloud: 8, hardware: 2, labor: 4 }, aiBudget: 17.8, aiYtd: 11.6, status: 'at-risk',
    note: '12 Tier-1 models past SR 11-7 validation — the governance exposure gating AI scale.', inits: ['FCF-INIT-004', 'FCF-INIT-002', 'FCF-INIT-012'] },
  { id: 'P4', name: 'Payments Modernization', fn: 'Operations', owner: 'SVP Payments Technology', cat: 'Transform', vendor: 'Accenture', budget: 38, ytd: 21.0, capex: 28, opex: 10,
    mix: { services: 20, software: 11, cloud: 5, hardware: 1, labor: 1 }, aiBudget: 18.6, aiYtd: 9.86, status: 'at-risk',
    note: 'FedNow/RTP at 2% instant-payment adoption vs 35% target — restructure candidate.', inits: ['FCF-INIT-001'] },
  { id: 'P5', name: 'Digital Banking & Channels', fn: 'Digital', owner: 'Chief Digital Officer', cat: 'Transform', vendor: 'Salesforce', budget: 28, ytd: 13.4, capex: 20, opex: 8,
    mix: { software: 13, services: 10, cloud: 4, labor: 1 }, aiBudget: 7.5, aiYtd: 3.5, status: 'watch',
    note: 'Account-open abandonment 58% vs 28% target — recovery program in build.', inits: ['FCF-INIT-005', 'FCF-INIT-006'] },
  { id: 'P6', name: 'Enterprise Applications', fn: 'Finance', owner: 'CFO', cat: 'Run', vendor: 'SAP', budget: 26, ytd: 14.6, capex: 4, opex: 22,
    mix: { software: 16, services: 6, cloud: 3, labor: 1 }, aiBudget: 0, aiYtd: 0, status: 'watch',
    note: 'SAP ECC renews Mar 2027; Workday Illuminate AI deflects 34% of HR queries but is untracked.', inits: [] },
  { id: 'P7', name: 'Cybersecurity & Identity', fn: 'Technology', owner: 'CISO', cat: 'Run', vendor: 'CrowdStrike', budget: 22, ytd: 12.1, capex: 3, opex: 19,
    mix: { software: 12, services: 6, cloud: 3, labor: 1 }, aiBudget: 0, aiYtd: 0, status: 'on-track',
    note: 'Stable run line; no material AI exposure or governance debt.', inits: [] },
  { id: 'P8', name: 'Data & Analytics Platform', fn: 'Technology', owner: 'CDAO', cat: 'Change', vendor: 'Databricks', budget: 18, ytd: 9.4, capex: 8, opex: 10,
    mix: { cloud: 8, services: 5, software: 4, labor: 1 }, aiBudget: 2.4, aiYtd: 0.8, status: 'watch',
    note: 'Data-lineage control deficient (OCC) — the constraint on scaling customer AI.', inits: ['FCF-INIT-012'] },
  { id: 'P9', name: 'Workplace & Productivity', fn: 'Technology', owner: 'CIO', cat: 'Change', vendor: 'Microsoft', budget: 16, ytd: 8.6, capex: 2, opex: 14,
    mix: { software: 13, services: 2, cloud: 1 }, aiBudget: 3.8, aiYtd: 3.35, status: 'watch',
    note: 'M365 Copilot frozen in Finance (40%) and Ops (0%) on a pending DLP review — paid-for, unused.', inits: ['FCF-INIT-010'] },
  { id: 'P10', name: 'Wealth & Advisory Technology', fn: 'Wealth & Private', owner: 'SVP Wealth Technology', cat: 'Run', vendor: 'Salesforce FSC', budget: 10, ytd: 5.2, capex: 2, opex: 8,
    mix: { software: 6, services: 3, cloud: 1 }, aiBudget: 3.1, aiYtd: 1.55, status: 'at-risk',
    note: 'Advisor Copilot blocked by an unresolved FINRA supervision gap — kill candidate.', inits: ['FCF-INIT-009'] },
];

// ── VENDORS (F11 — annual contract value + renewals) ──────────────────
const VENDORS = [
  { name: 'FIS', cat: 'Core banking', acv: 38, renew: 'Feb 15, 2027', months: 8, urgency: 'watch', prog: 'Core Banking Platform', note: 'Core AMS; no exit analysis on file.' },
  { name: 'DXC', cat: 'Infrastructure / AMS', acv: 26, renew: 'Nov 30, 2026', months: 5, urgency: 'at-risk', prog: 'Infrastructure & Hosting', note: 'Nearest leverage window — no consolidation owner named.' },
  { name: 'Accenture', cat: 'Services / SI', acv: 18, renew: 'Sep 30, 2026', months: 3, urgency: 'at-risk', prog: 'Payments Modernization', note: 'Payments SI; renews first of the three big contracts.' },
  { name: 'Microsoft', cat: 'M365 / Azure / Copilot', acv: 14, renew: 'Jun 30, 2027', months: 12, urgency: 'on-track', prog: 'Workplace & Productivity', note: 'EA bundles Copilot seats — 324 idle on DLP freeze.' },
  { name: 'NICE Actimize', cat: 'Fraud / AML', acv: 11, renew: 'Jan 31, 2027', months: 7, urgency: 'watch', prog: 'Risk & Compliance Technology', note: 'Hosts several overdue Tier-1 models.' },
  { name: 'Salesforce', cat: 'CRM / FSC', acv: 9, renew: 'Aug 31, 2027', months: 14, urgency: 'on-track', prog: 'Digital Banking & Channels', note: 'Financial Services Cloud across Digital + Wealth.' },
  { name: 'SAP', cat: 'ERP', acv: 8, renew: 'Mar 31, 2027', months: 9, urgency: 'watch', prog: 'Enterprise Applications', note: 'ECC EA; Joule agent re-enable is a shadow-AI risk.' },
  { name: 'Databricks', cat: 'Data / lakehouse', acv: 6, renew: 'Dec 31, 2027', months: 18, urgency: 'on-track', prog: 'Data & Analytics Platform', note: 'Hosts the proven fraud workload.' },
  { name: 'CrowdStrike', cat: 'Security', acv: 5, renew: 'Oct 31, 2027', months: 16, urgency: 'on-track', prog: 'Cybersecurity & Identity', note: 'Stable; no renewal pressure.' },
  { name: 'Workday', cat: 'HCM', acv: 5, renew: 'May 31, 2027', months: 11, urgency: 'on-track', prog: 'Enterprise Applications', note: 'Illuminate AI deflecting HR work, untracked.' },
];

// ── FUNCTIONS (spend + AI + adoption + realized value) ────────────────
// itSpend derived from PROGRAMS by fn; aiYtd derived; adoption & value are observed.
const FN_OBS = {
  'Technology': { adoption: 59, value: 4.2, vnote: 'GitHub Copilot — 18h/engineer/mo' },
  'Risk & Compliance': { adoption: 51, value: 26.1, vnote: 'Fraud Graph v2 — $26.1M avoidance' },
  'Finance': { adoption: 40, value: 0.0, vnote: 'Copilot frozen on DLP review' },
  'Digital': { adoption: 22, value: 0.9, vnote: 'Account-open recovery, early' },
  'Operations': { adoption: 8, value: 0.8, vnote: 'FedNow underperforming; HR deflection untracked' },
  'Retail Banking': { adoption: 8, value: 0.7, vnote: '3,200 bankers — largest gap' },
  'Wealth & Private': { adoption: 0, value: 0.0, vnote: 'Blocked by FINRA supervision gap' },
};

// ── AI INITIATIVES (subset — drives drawer + Actions) ─────────────────
const INITS = {
  'FCF-INIT-004': { t: 'Fraud Graph Analytics v2', committed: 7.3, ytd: 4.02, realized: 26.12, verdict: 'continue' },
  'FCF-INIT-010': { t: 'M365 Copilot Controlled Rollout', committed: 3.8, ytd: 2.28, realized: 3.08, verdict: 'continue' },
  'FCF-INIT-002': { t: 'AML Case Triage Automation', committed: 8.9, ytd: 4.1, realized: 1.26, verdict: 'restructure' },
  'FCF-INIT-012': { t: 'Model Risk Evidence Automation', committed: 1.6, ytd: 0.8, realized: 0.82, verdict: 'continue' },
  'FCF-INIT-011': { t: 'Mortgage Document Intelligence', committed: 2.8, ytd: 0.84, realized: 0.74, verdict: 'continue' },
  'FCF-INIT-005': { t: 'Digital Account Opening Recovery', committed: 4.1, ytd: 2.05, realized: 0.92, verdict: 'continue' },
  'FCF-INIT-006': { t: 'Commercial Credit Memo AI', committed: 3.4, ytd: 1.02, realized: 0.24, verdict: 'continue' },
  'FCF-INIT-001': { t: 'FedNow & RTP Modernization', committed: 18.6, ytd: 9.86, realized: 0.84, verdict: 'restructure' },
  'FCF-INIT-003': { t: 'Core Banking Future Decision', committed: 14.0, ytd: 2.8, realized: 0, verdict: 'hold' },
  'FCF-INIT-009': { t: 'Wealth Advisor Copilot Shadow', committed: 3.1, ytd: 1.55, realized: 0, verdict: 'kill' },
};

// ── ACTIONS (fund / fix / kill) ───────────────────────────────────────
const ACTIONS = [
  { id: 'A1', kind: 'kill', kicker: 'Stop the spend', impact: '$7.4M committed · $0 realized',
    title: 'Kill three AI initiatives with no verified value.',
    why: 'Branch Queue Vision, Contact Center Sentiment, and Wealth Advisor Copilot have failed gates or no KPI, zero realized value, and $3.87M already burned this year.',
    rec: 'Stop all three now and redirect the remaining commitment. None has verified value and all carry unresolved governance gaps.',
    grid: [['Committed', '$7.4M'], ['Burned YTD', '$3.87M'], ['Realized', '$0'], ['Owners', '3 SVPs']],
    owner: 'SVP Retail Ops · SVP Client Service · SVP Wealth Tech',
    move: 'Terminate 3 unproven AI initiatives · redirect $3.5M' },
  { id: 'A2', kind: 'gov', kicker: 'Governance — critical', impact: '12 Tier-1 models past validation',
    title: 'Approve an SR 11-7 validation sprint for 12 overdue models.',
    why: 'Twelve high-impact production models — Sanctions Name Match, KYC Risk Score, the AML Alert Prioritizer — are past validation expiry, with 24 open findings and 4 linked to a Matter Requiring Attention.',
    rec: 'Approve a validation sprint sequenced by regulatory exposure — <b>Sanctions, KYC and AML first</b> (all MRA-linked). This also unblocks AML Case Triage scale.',
    grid: [['Tier-1 overdue', '12'], ['Open findings', '24'], ['MRA-linked', '4'], ['Backlog', '7 months']],
    owner: 'Chief Model Risk Officer',
    move: 'Tier-1 SR 11-7 validation sprint · Sanctions / KYC / AML first' },
  { id: 'A3', kind: 'fund', kicker: 'Unblock value', impact: 'Highest-value Copilot use frozen',
    title: 'File the DLP policies blocking M365 Copilot in Finance and Ops.',
    why: 'Finance Copilot sits at 40% adoption and Operations at 0% — both frozen on a pending DLP review. 324 paid seats sit idle and the highest-value close-narrative use case is held.',
    rec: 'Fast-track the CFO DLP review for GL data and file the Ops PII-in-Teams assessment. Converts paid-for, unused seats into measured benefit with no new spend.',
    grid: [['Finance adoption', '40%'], ['Ops adoption', '0%'], ['Idle seats', '324'], ['New spend', '$0']],
    owner: 'CIO · CFO',
    move: 'Fast-track DLP policy for M365 Copilot · Finance + Ops' },
  { id: 'A4', kind: 'fund', kicker: 'Pull the leverage', impact: '$82M/yr renewing, no owner',
    title: 'Name an owner for the $82M of contracts renewing in 15 months.',
    why: 'DXC ($26M, Nov 2026), Accenture ($18M, Sep 2026) and FIS ($38M, Feb 2027) renew within fifteen months with no consolidation owner. The renewals auto-extend the status quo by default.',
    rec: 'Name a single renewal owner this week and pull the consolidation analysis ahead of the Sep Accenture date. This is the largest negotiable line in the estate.',
    grid: [['Renewing ACV', '$82M/yr'], ['Contracts', '3'], ['First date', 'Sep 2026'], ['Owner', 'None']],
    owner: 'CIO · Chief Procurement Officer',
    move: 'Pre-renewal consolidation review · DXC / Accenture / FIS' },
];

// ── DERIVED TOTALS (computed — everything ties to PROGRAMS) ────────────
const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
const TOTAL = {
  budget: sum(PROGRAMS, p => p.budget),
  ytd: sum(PROGRAMS, p => p.ytd),
  capex: sum(PROGRAMS, p => p.capex),
  opex: sum(PROGRAMS, p => p.opex),
  aiBudget: sum(PROGRAMS, p => p.aiBudget),
  aiYtd: sum(PROGRAMS, p => p.aiYtd),
  run: sum(PROGRAMS.filter(p => p.cat === 'Run'), p => p.budget),
  change: sum(PROGRAMS.filter(p => p.cat === 'Change'), p => p.budget),
  transform: sum(PROGRAMS.filter(p => p.cat === 'Transform'), p => p.budget),
};
const CAT_MIX = ['software', 'hardware', 'services', 'cloud', 'labor'].map(k => ({
  key: k, label: k[0].toUpperCase() + k.slice(1), val: sum(PROGRAMS, p => p.mix[k] || 0),
}));
const AI_REALIZED = sum(Object.values(INITS), i => i.realized); // ≈ $33.2M

// ── AGENT (Nexus) — canned answers that render text + table/chart ─────
const NEXUS_CHIPS = [
  'Where is the money going?',
  'Show CapEx vs OpEx',
  'Which contracts renew soonest?',
  'How are AI investments doing?',
  'What should we stop?',
];

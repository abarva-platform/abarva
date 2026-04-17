// HTML deliverable generator for AVR Navigator phases
// Design tokens match AbarVa design system

export interface OutcomeItem { stepId: string; label: string; value: string }
export interface GeneratedDocument { document_type: string; title: string; html_content: string }

function ov(outcomes: OutcomeItem[], stepId: string): string {
  return outcomes.find(x => x.stepId === stepId)?.value ?? '—'
}

function row(label: string, value: string, accent = false): string {
  return `<div class="row${accent ? ' accent' : ''}"><div class="row-lbl">${label}</div><div class="row-val">${value}</div></div>`
}

function callout(label: string, value: string): string {
  return `<div class="callout"><div class="callout-lbl">${label}</div><div class="callout-val">${value}</div></div>`
}

function section(tag: string, content: string): string {
  return `<div class="section"><div class="section-tag">${tag}</div>${content}</div>`
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',-apple-system,sans-serif;background:#FAFAF9;color:#3C3C3C;line-height:1.6}
.doc{max-width:860px;margin:0 auto;padding-bottom:80px}
.nav{background:#0F0E0D;padding:16px 40px;display:flex;justify-content:space-between;align-items:center}
.logo{font-family:Georgia,serif;font-size:16px;color:#FAFAF9}
.logo span{color:#2DD4C8}
.nav-r{text-align:right}
.nav-tag{font-size:9px;font-family:monospace;color:rgba(255,255,255,.35);letter-spacing:.12em;text-transform:uppercase;margin-bottom:2px}
.nav-sub{font-size:12px;color:rgba(255,255,255,.5)}
.hero{background:#F3F4F6;border-bottom:1px solid #E8E6E3;padding:36px 40px}
.hero-tag{font-size:10px;font-family:monospace;color:#2DD4C8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px}
.hero-title{font-family:Georgia,serif;font-size:26px;color:#0F0E0D;font-weight:400;margin-bottom:16px;line-height:1.2}
.hero-meta{display:flex;gap:24px;flex-wrap:wrap;font-size:12px;color:#706D66}
.hero-meta strong{color:#0F0E0D}
.body{padding:40px}
.section{margin-bottom:40px}
.section-tag{font-size:10px;font-family:monospace;color:#2DD4C8;text-transform:uppercase;letter-spacing:.1em;padding-bottom:10px;border-bottom:1px solid #E8E6E3;margin-bottom:20px}
.row{border:1px solid #E8E6E3;border-radius:8px;padding:16px 20px;margin-bottom:10px;background:#fff}
.row.accent{border-left:3px solid #2DD4C8}
.row-lbl{font-size:10px;font-family:monospace;color:#706D66;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
.row-val{font-size:15px;color:#0F0E0D;line-height:1.5}
.callout{background:rgba(45,212,200,.05);border:1px solid rgba(45,212,200,.2);border-radius:8px;padding:20px 24px;margin-bottom:16px}
.callout-lbl{font-size:10px;font-family:monospace;color:#2DD4C8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
.callout-val{font-size:17px;color:#0F0E0D;font-weight:600;line-height:1.35}
.foot{background:#0F0E0D;padding:20px 40px;display:flex;justify-content:space-between;align-items:center;margin-top:40px}
.foot-l{font-size:10px;font-family:monospace;color:rgba(255,255,255,.3);letter-spacing:.08em}
.foot-r{font-size:11px;color:rgba(255,255,255,.3)}
`

function wrapDoc(docTag: string, title: string, clientName: string, engId: string, body: string, generatedBy: string): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} — ${clientName}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<div class="doc">
<nav class="nav">
  <div class="logo">Abar<span>Va</span></div>
  <div class="nav-r">
    <div class="nav-tag">${docTag}</div>
    <div class="nav-sub">${clientName} · ${engId}</div>
  </div>
</nav>
<div class="hero">
  <div class="hero-tag">Engagement ${engId}</div>
  <h1 class="hero-title">${title}</h1>
  <div class="hero-meta">
    <span>Client: <strong>${clientName}</strong></span>
    <span>Generated: <strong>${date}</strong></span>
    <span>Maestro: <strong>${generatedBy}</strong></span>
  </div>
</div>
<div class="body">
${body}
</div>
<footer class="foot">
  <div class="foot-l">AbarVa AI Value Realization Navigator · Confidential</div>
  <div class="foot-r">${engId} · ${date}</div>
</footer>
</div>
</body>
</html>`
}

// ── Phase 0 → Situation Brief ─────────────────────────────────────────────────
function situationBrief(outcomes: OutcomeItem[], clientName: string): string {
  return [
    section('Executive Summary',
      callout('Priority Signal', ov(outcomes, '0.1')) +
      callout('Strategic AI Focus', ov(outcomes, '0.2'))
    ),
    section('Readiness Assessment',
      row('Data Readiness Baseline', ov(outcomes, '0.3')) +
      row('Foundation Status', 'Assessed across five dimensions: completeness, accessibility, quality, timeliness, and AI-readiness. Score reflects current state prior to engagement.')
    ),
    section('Genome Intelligence',
      row('Pattern Match', ov(outcomes, '0.4'), true) +
      row('Methodology', `AbarVa's Genome library matches ${clientName} against prior organisations of comparable size, sector, and maturity. Failure patterns identify risk before engagement begins.`)
    ),
    section('Confirmed Scope',
      row('Engagement Scope', ov(outcomes, '0.5'), true) +
      row('Delivery Model', 'Gate-locked across 5 phases. Each phase requires named executive sponsor approval before the next begins. No scope or cost commitment without a CXO owner.')
    ),
    section('Next Steps',
      row('Phase 1 — Diagnose', 'Situation intelligence, contradiction analysis, competitive benchmarks, data readiness gap assessment.', true) +
      row('Gate Condition', 'Executive sponsor must approve Phase 0 gate. Gate brief shared within 24 hours of this document.')
    ),
  ].join('\n')
}

// ── Phase 1 → Diagnose Report ────────────────────────────────────────────────
function diagnoseReport(outcomes: OutcomeItem[], clientName: string): string {
  return [
    section('Phase 0 Context',
      row('Priority Signal', ov(outcomes, '0.1')) +
      row('AI Aspiration', ov(outcomes, '0.2')) +
      row('Confirmed Scope', ov(outcomes, '0.5'))
    ),
    section('Primary Finding',
      callout('Situation Intelligence', ov(outcomes, '1.1')) +
      row('Analysis', `The finding above represents the most material risk identified through ${clientName}'s operational data. This forms the basis of the value case.`)
    ),
    section('Contradiction Analysis',
      row('Key Contradiction', ov(outcomes, '1.2'), true) +
      row('Implication', 'Contradictions between stated priorities and operational data are the strongest predictor of AI initiative failure. This must be resolved before Phase 2.')
    ),
    section('Competitive Position',
      row('Benchmark Gap', ov(outcomes, '1.3'), true) +
      row('Peer Methodology', 'Benchmarks drawn from AbarVa Genome — anonymised performance data from comparable organisations in the same industry, size band, and maturity stage.')
    ),
    section('Data Readiness Gap',
      row('Gap Identified', ov(outcomes, '1.4'), true) +
      row('Resolution Path', 'This gap must be closed or mitigated before AI deployment. Phase 2 prescriptions will include a specific data remediation workstream.')
    ),
    section('Phase 2 Preview',
      row('Prescribe Deliverables', 'Technology assessment · Vendor recommendation · Target architecture blueprint · CFO-approved business case', true)
    ),
  ].join('\n')
}

// ── Phase 2 → Architecture ────────────────────────────────────────────────────
function architectureDoc(outcomes: OutcomeItem[], clientName: string): string {
  return [
    section('Technology Assessment',
      callout('Priority Use Case', ov(outcomes, '2.1')) +
      row('Scope', `Application portfolio, vendor contracts, technical debt, and integration architecture assessed against AI-readiness criteria for ${clientName}.`)
    ),
    section('Vendor Strategy',
      row('Vendor Direction', ov(outcomes, '2.2'), true) +
      row('Assessment Methodology', 'Vendors scored against Genome outcomes data — not vendor case studies. Criteria: integration complexity, outcome track record, contract flexibility, support model.')
    ),
    section('Target Architecture',
      callout('Architecture Decision', ov(outcomes, '2.3')) +
      row('Design Principles', '1. AI-native — no retrofitting. 2. Data as first-class asset. 3. Integration before replacement. 4. Measurable value at each build milestone.') +
      row('Current → Target', 'Current state documented. Target designed around confirmed scope and data readiness constraints from Phases 0–1. Build sequence delivers measurable value at each milestone.')
    ),
    section('Investment & Returns',
      row('Business Case', ov(outcomes, '2.4'), true) +
      row('Baseline', 'Day 0 baseline locked using KPMG-validated methodology. All future outcome verification measures against this immutable baseline.')
    ),
  ].join('\n')
}

// ── Phase 2 → Roadmap ────────────────────────────────────────────────────────
function roadmapDoc(outcomes: OutcomeItem[], clientName: string): string {
  return [
    section('Programme Overview',
      callout('Business Case', ov(outcomes, '2.4')) +
      row('Scope', ov(outcomes, '0.5')) +
      row('Primary Use Case', ov(outcomes, '2.1'))
    ),
    section('Execution Phases',
      row('Phase 3 — Value Realization (Months 1–3)', 'Value model built. KPI framework agreed. Day 0 baseline locked. First delivery sprint begins.', true) +
      row('Phase 4 — Execute & Verify (Months 3–12)', '90-day sprint cadence. Monthly actuals vs baseline. Outcome verification at Month 3, Month 6, Month 12.', true) +
      row('Fee Trigger', 'AbarVa fee triggered on verified outcome delta — not delivery milestones. Fee = verified delta × AbarVa percentage. Invoice within 5 business days of verification.')
    ),
    section('Governance',
      row('Executive Sponsor', 'Named CXO required for each phase gate approval.') +
      row('Steering Committee', 'Monthly review. Actuals vs baseline reviewed. Scope changes require sponsor approval.') +
      row('AbarVa Role', `Maestro-led. ${clientName} retains delivery ownership. AbarVa provides AI architecture, Genome benchmarking, and outcome verification.`)
    ),
    section('Risk Register',
      row('Genome Risk Patterns', ov(outcomes, '0.4'), true) +
      row('Contradiction Risk', ov(outcomes, '1.2')) +
      row('Mitigation', 'Gate-locked model ensures risks addressed before each phase begins.')
    ),
  ].join('\n')
}

// ── Phase 3 → Value & KPI Framework ──────────────────────────────────────────
function kpiFramework(outcomes: OutcomeItem[], clientName: string): string {
  return [
    section('Value Model',
      callout('Value Potential', ov(outcomes, '3.1')) +
      row('Baseline Lock', 'Day 0 baseline locked upon Phase 3 approval. All future measurement references this baseline.') +
      row('Methodology', 'Monthly actuals collected directly from operational systems. Compared against Day 0 baseline. Variance documented. Annualised projection updated monthly.')
    ),
    section('KPI Framework',
      row('Primary KPI', ov(outcomes, '3.2'), true) +
      row('Data Collection', 'KPI data sourced directly from operational systems. No self-reporting. Audit trail maintained from source to dashboard.')
    ),
    section('Milestone Plan',
      row('First Milestone', ov(outcomes, '3.3'), true) +
      row('Cadence', 'Month 1 — baseline confirmed. Month 3 — first outcome verification. Month 6 — mid-programme review. Month 12 — full audit.') +
      row('Fee Trigger Points', 'Outcome fee calculated at each verification milestone. Invoice issued within 5 business days of verification.')
    ),
    section('Governance',
      row('Monthly Review', `Steering committee reviews actuals vs plan. ${clientName} executive sponsor confirms figures. AbarVa Maestro presents verification pack.`) +
      row('Dispute Resolution', 'Any variance disputed by client reviewed within 10 business days. Third-party audit available on request.')
    ),
  ].join('\n')
}

// ── Phase 4 → Board Pack ──────────────────────────────────────────────────────
function boardPack(outcomes: OutcomeItem[], clientName: string): string {
  return [
    section('Engagement Summary',
      callout('Confirmed Scope', ov(outcomes, '0.5')) +
      row('Primary Finding', ov(outcomes, '1.1')) +
      row('Business Case', ov(outcomes, '2.4'))
    ),
    section('Delivery Progress',
      row('Value Model', ov(outcomes, '3.1')) +
      row('Primary KPI', ov(outcomes, '3.2')) +
      row('Milestone Achievement', ov(outcomes, '3.3')) +
      row('90-Day Sprint', ov(outcomes, '4.1'), true)
    ),
    section('Outcome Verification',
      callout('Governance Model', ov(outcomes, '4.2')) +
      row('Methodology', 'All outcomes measured against Day 0 immutable baseline. Independent audit trail maintained from source system to verified delta.')
    ),
    section('Strategic Path Forward',
      row('Completion Status', 'All 5 phases complete. Engagement in verified outcome state.', true) +
      row('Renewal / Expansion', 'Genome updated with this engagement. Expansion opportunities identified based on verified ROI.')
    ),
  ].join('\n')
}

// ── Phase 4 → Fee Calculation ─────────────────────────────────────────────────
function feeCalculation(outcomes: OutcomeItem[], clientName: string): string {
  return [
    section('Fee Summary',
      callout('90-Day Sprint Result', ov(outcomes, '4.1')) +
      callout('Governance Confirmation', ov(outcomes, '4.2'))
    ),
    section('Calculation Basis',
      row('Business Case Baseline', ov(outcomes, '2.4'), true) +
      row('Value Model', ov(outcomes, '3.1')) +
      row('Methodology', 'Fee calculated as a percentage of independently verified outcome delta vs Day 0 immutable baseline. Outcome-contingent — not payable on delivery milestones.') +
      row('Audit Standard', 'Verification against KPMG-validated Day 0 baseline. All calculations documented and available for client review.')
    ),
    section('Invoice',
      row('Client', `${clientName} — ${ov(outcomes, '0.5')}`, true) +
      row('Reference', 'Invoice generated upon Phase 4 gate approval. Contact your AbarVa Maestro for invoice details and payment terms.') +
      row('Payment Terms', 'Net 30 days from invoice date. Disputes must be raised within 10 business days.')
    ),
  ].join('\n')
}

// ── Public API ────────────────────────────────────────────────────────────────
export function generateDeliverables(
  phase: number,
  clientId: string,
  engagementId: string,
  outcomes: OutcomeItem[],
  clientName: string,
  maestroName: string,
): GeneratedDocument[] {
  const wrap = (docTag: string, title: string, body: string): string =>
    wrapDoc(docTag, title, clientName, engagementId, body, maestroName)

  switch (phase) {
    case 0: return [{
      document_type: 'situation_brief',
      title: `Situation Brief — ${clientName}`,
      html_content: wrap('Phase 0 · Situation Brief', `Situation Brief — ${clientName}`, situationBrief(outcomes, clientName)),
    }]
    case 1: return [{
      document_type: 'diagnose_report',
      title: `Diagnose Report — ${clientName}`,
      html_content: wrap('Phase 1 · Diagnose Report', `Diagnose Report — ${clientName}`, diagnoseReport(outcomes, clientName)),
    }]
    case 2: return [
      {
        document_type: 'architecture',
        title: `Target Architecture — ${clientName}`,
        html_content: wrap('Phase 2 · Architecture', `Target Architecture — ${clientName}`, architectureDoc(outcomes, clientName)),
      },
      {
        document_type: 'roadmap',
        title: `Execution Roadmap — ${clientName}`,
        html_content: wrap('Phase 2 · Roadmap', `Execution Roadmap — ${clientName}`, roadmapDoc(outcomes, clientName)),
      },
    ]
    case 3: return [{
      document_type: 'monthly_actuals',
      title: `Value & KPI Framework — ${clientName}`,
      html_content: wrap('Phase 3 · Value & KPI Framework', `Value & KPI Framework — ${clientName}`, kpiFramework(outcomes, clientName)),
    }]
    case 4: return [
      {
        document_type: 'board_pack',
        title: `Board Pack — ${clientName}`,
        html_content: wrap('Phase 4 · Board Pack', `Board Pack — ${clientName}`, boardPack(outcomes, clientName)),
      },
      {
        document_type: 'fee_calculation',
        title: `Fee Calculation — ${clientName}`,
        html_content: wrap('Phase 4 · Fee Calculation', `Fee Calculation — ${clientName}`, feeCalculation(outcomes, clientName)),
      },
    ]
    default: return []
  }
}

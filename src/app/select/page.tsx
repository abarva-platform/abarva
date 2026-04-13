'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import EngagementProgress from '@/components/EngagementProgress'

const STATUS_COLOR: Record<string, string> = { URGENT: '#EF4444', HIGH: '#F59E0B', MEDIUM: '#4DA3FF' }
const STATUS_BG: Record<string, string> = { URGENT: 'rgba(239,68,68,0.12)', HIGH: 'rgba(245,158,11,0.12)', MEDIUM: 'rgba(77,163,255,0.12)' }

const DECISIONS = [
  {
    id: 'prior-auth',
    label: 'Prior Auth Automation',
    status: 'URGENT',
    deadline: 'CMS mandate: Jan 2027',
    context: 'CMS Prior Authorization rule requires electronic prior auth by January 2027. Meridian processes 847K prior auth requests annually at $28.50 each. Current 14-day average delay is driving physician attrition and $94M in avoidable cost.',
    options: [
      {
        name: 'Cohere Health', cost: '$2.1–3.2M', timeline: '6–9 mo', score: 94, recommended: true, tag: 'Epic-native integration',
        bullets: ['ML approval prediction 94% accuracy', 'Pre-built Epic FHIR integration — no middleware', 'Advocate Aurora + Baylor Scott & White references', 'Reduces 14-day avg to 2.3 days at peer sites'],
      },
      {
        name: 'Waystar AI', cost: '$3.0–4.8M', timeline: '9–12 mo', score: 81, recommended: false, tag: 'Integrated RCM play',
        bullets: ['Combined prior auth + full RCM platform', 'HCA Healthcare + CommonSpirit references', 'Higher cost and longer timeline than Cohere', 'Overlap with existing Ensemble RCM contract'],
      },
      {
        name: 'Olive AI', cost: '$4.2–6.0M', timeline: '12–18 mo', score: 68, recommended: false, tag: 'Broad automation suite',
        bullets: ['Beyond prior auth — covers broader RCM automation', 'Bon Secours + Spectrum Health references', 'Highest cost, longest implementation window', 'Recent layoffs create vendor stability risk'],
      },
    ],
    recommendation: 'Cohere Health is the clear choice. Their Epic FHIR integration avoids a 6-month middleware build, and their 94% ML accuracy exceeds your 85% target. The $8M in enforceable Ensemble SLA penalties gives you direct negotiating leverage — use it to get Cohere at the low end of their range.',
    negotiation: 'Disclose you are evaluating all three vendors simultaneously. Demand named Epic integration leads committed before signing. Request outcome-based pricing tied to approval rate improvement, not go-live date.',
  },
  {
    id: 'cdo',
    label: 'CDO / AI Leadership',
    status: 'URGENT',
    deadline: 'Board asks every quarter',
    context: 'The CDO role has been vacant since March 2025. Without executive ownership, the $94M AI savings pipeline stalls. Three AI vendors have already stated they will not commit to contracts without a named internal champion on the Meridian side.',
    options: [
      {
        name: 'Hire Full-Time CDO', cost: '$420–580K/yr', timeline: '4–6 mo search', score: 88, recommended: true, tag: 'Permanent fix',
        bullets: ['Right-sized for a $2.1B health system', 'Creates vendor accountability structure', 'Board-level credibility for AI roadmap', 'Risk: wrong hire takes 18 months to unwind'],
      },
      {
        name: 'Fractional CDO (Consulting)', cost: '$180–240K/yr', timeline: '30 days', score: 74, recommended: false, tag: 'Fast but limited',
        bullets: ['Get moving in 30 days', 'Typically 20% time — not a real owner', 'Vendors see it as a placeholder move', 'No institutional knowledge building'],
      },
      {
        name: 'Promote Internal Analytics Lead', cost: '$60–80K raise', timeline: 'Immediate', score: 61, recommended: false, tag: 'Internal option',
        bullets: ['Mark Chen knows the data estate deeply', 'No AI vendor management experience', 'Board likely to push back on seniority', 'Signals insufficient AI ambition'],
      },
      {
        name: 'Defer to 2026', cost: '$0', timeline: 'N/A', score: 22, recommended: false, tag: 'Status quo',
        bullets: ['No near-term cost', 'Loses board confidence quarter over quarter', 'Vendors deprioritize Meridian pipeline', '$94M savings pipeline deteriorates further'],
      },
    ],
    recommendation: 'Hire a full-time CDO. The cost is trivial relative to the $94M annual savings at stake. Specify healthcare AI operational experience — not just a data science background. Use the job description itself to signal vendor seriousness and create urgency.',
    negotiation: 'Negotiate current AI vendor contracts to include a 90-day re-opener clause triggered if CDO hire changes strategic direction. Protect yourself from pre-CDO commitments.',
  },
  {
    id: 'epic-ai',
    label: 'Epic AI Module Activation',
    status: 'HIGH',
    deadline: 'Epic upgrade window: Q3 2026',
    context: 'Meridian is on Epic Cogito but has not activated DAX Copilot, Predictive Risk Scoring, or the Sepsis Early Warning models already licensed. The annual Epic upgrade in Q3 2026 is the natural activation window — missing it means another 12 months of delay.',
    options: [
      {
        name: 'Activate via SI Partner', cost: '$800K–1.4M', timeline: '6–9 mo', score: 91, recommended: true, tag: 'Fastest to clinical value',
        bullets: ['Top-tier SI Epic COE resources', 'Clinical workflow redesign included', 'Change management budget built in', 'Avoids internal IT resourcing gap'],
      },
      {
        name: 'Epic Professional Services', cost: '$1.1–1.8M', timeline: '9–12 mo', score: 78, recommended: false, tag: 'Direct from Epic',
        bullets: ['Deep product knowledge from the source', 'Slower scheduling, higher list cost', 'Less flexibility on workflow customization', 'No dedicated change management expertise'],
      },
      {
        name: 'Internal IT Activation', cost: '$180–320K', timeline: '12–18 mo', score: 44, recommended: false, tag: 'Low cost, high risk',
        bullets: ['IT team already at capacity', 'DAX requires clinical informaticist skill set', 'Timeline incompatible with Q3 window', 'High rework probability — peer health systems 0 for 3'],
      },
    ],
    recommendation: 'Engage an SI with proven Epic DAX deployments at Meridian\'s scale. DAX Copilot alone should recover 45 minutes per physician per day — across 820 physicians that is $18M in recovered capacity annually. The SI cost pays back in under 45 days.',
    negotiation: 'Make DAX Copilot physician satisfaction (target: 80%+ would recommend after 90 days) a contractual milestone tied to 20% of SI fees. Prevents an activation-only engagement with no adoption follow-through.',
  },
  {
    id: 'rcm',
    label: 'RCM Platform',
    status: 'HIGH',
    deadline: '$8M SLA penalties enforceable now',
    context: 'Ensemble Health Partners holds your current RCM contract with $8M in documented SLA breaches on file. You have leverage right now. Revenue cycle performance is 31% below peer benchmark on net collection rate and denial resolution time.',
    options: [
      {
        name: 'Renegotiate Ensemble Contract', cost: '$8M penalty recovery', timeline: '60–90 days', score: 89, recommended: true, tag: 'Use your leverage first',
        bullets: ['$8M in enforceable SLA breach penalties', 'Demand 25% fee reduction + reset SLAs with teeth', 'Threat of full re-platform creates urgency', 'Fastest path to financial recovery — no migration risk'],
      },
      {
        name: 'Re-platform to Waystar', cost: '$3.0–4.8M migration', timeline: '9–12 mo', score: 83, recommended: false, tag: 'Full re-platform option',
        bullets: ['Integrated claims + prior auth on one platform', 'HCA Healthcare + CommonSpirit references', 'Best option if Ensemble renegotiation fails', 'Migration disruption carries operational risk'],
      },
      {
        name: 'nThrive (Kaufman Hall)', cost: '$2.4–4.2M', timeline: '9–15 mo', score: 71, recommended: false, tag: 'Mid-market alternative',
        bullets: ['Strong denial management AI capabilities', 'Better fit for smaller health systems', 'Private equity owned — long-term stability risk', 'Weaker prior auth automation module'],
      },
    ],
    recommendation: 'Use the $8M SLA leverage against Ensemble before committing to any re-platform. Hire outside counsel to send the breach demand letter before any negotiation meeting — it fundamentally changes the power dynamic. Do not telegraph a final decision until you have Ensemble\'s best offer in writing.',
    negotiation: 'Give Ensemble a 30-day deadline for a written remediation plan with specific KPI commitments. If they miss it, begin the Waystar RFP immediately. The credible exit threat is your strongest asset.',
  },
  {
    id: 'data-platform',
    label: 'Data & Analytics Platform',
    status: 'HIGH',
    deadline: 'AI use cases blocked without this',
    context: 'Epic Caboodle is Meridian\'s only analytical data store. It cannot support real-time AI use cases, streaming clinical data, or ML model training. A modern data lakehouse is a hard dependency for 5 of the 7 AI initiatives in the $94M savings pipeline.',
    options: [
      {
        name: 'Databricks on Azure', cost: '$1.8–3.2M/yr', timeline: '6–9 mo', score: 92, recommended: true, tag: 'Healthcare AI leader',
        bullets: ['Delta Lake for HIPAA-compliant streaming data', 'Unity Catalog for Epic data governance layer', 'Providence Health + Kaiser Permanente references', 'MLflow for model lifecycle — needed for clinical AI'],
      },
      {
        name: 'Snowflake + Azure ML', cost: '$1.4–2.6M/yr', timeline: '6–9 mo', score: 84, recommended: false, tag: 'Strong SQL-first option',
        bullets: ['Best-in-class SQL analytics and BI layer', 'Weaker real-time streaming than Databricks', 'Excellent for financial and operational reporting', 'Additional Azure ML tooling adds cost'],
      },
      {
        name: 'Azure Synapse Analytics', cost: '$900K–1.6M/yr', timeline: '4–6 mo', score: 68, recommended: false, tag: 'Microsoft bundle play',
        bullets: ['Potential discount via existing Azure EA', 'Weaker for ML model deployment at scale', 'Limited healthcare-specific data tooling', 'Microsoft roadmap deprioritizing Synapse for Fabric'],
      },
      {
        name: 'Keep Epic Caboodle Only', cost: '$0 incremental', timeline: 'N/A', score: 18, recommended: false, tag: 'Status quo — blocks AI',
        bullets: ['No additional platform cost', 'Cannot support streaming or real-time AI', 'Blocks the entire $94M savings pipeline', 'Eliminates competitive differentiation within 24 months'],
      },
    ],
    recommendation: 'Databricks on Azure is the only platform that can support your full AI roadmap. Providence Health\'s deployment at comparable scale is the right reference to visit. The $2M annual cost is 2% of the $94M savings it enables — frame it that way to the board.',
    negotiation: 'Databricks is aggressive on healthcare deals. Request a committed-use discount, Unity Catalog licensing at no cost for Year 1, and a named Customer Success Manager with prior Epic integration experience as contractual terms.',
  },
  {
    id: 'physician-ai',
    label: 'Physician AI Tools',
    status: 'MEDIUM',
    deadline: 'Physician attrition: 34 lost in 2025',
    context: 'Meridian lost 34 physicians in 2025, 60% citing administrative burden as the primary reason. Average physician spends 3.1 hours per day on documentation. AI-assisted documentation directly addresses the top attrition driver and is the fastest ROI in the AI portfolio.',
    options: [
      {
        name: 'Nuance DAX (Microsoft)', cost: '$400–700K/yr', timeline: '3–5 mo', score: 93, recommended: true, tag: 'Clinical documentation standard',
        bullets: ['Ambient AI — no dictation, no templates required', 'Epic-native integration live since late 2024', '91% physician satisfaction at peer health systems', 'Reduces documentation time 45 min/day per physician'],
      },
      {
        name: 'Augmedix', cost: '$350–600K/yr', timeline: '4–6 mo', score: 79, recommended: false, tag: 'Live scribe + AI hybrid',
        bullets: ['Human scribe + AI model combination', 'Better for complex subspecialty documentation', 'Less Epic-native integration than DAX', 'Smaller health system reference base'],
      },
      {
        name: 'Suki AI', cost: '$280–480K/yr', timeline: '3–4 mo', score: 71, recommended: false, tag: 'Lower cost entry point',
        bullets: ['Voice AI for clinical note generation', 'Smaller vendor — long-term stability risk', 'Good fit for primary care workflows', 'Limited coverage for specialist use cases'],
      },
    ],
    recommendation: 'Nuance DAX is the market standard for health systems at Meridian\'s scale. The ROI is simple: 45 min/day recovered across 820 physicians = $18M annually in productive physician capacity. Frame this as attrition prevention — not a technology purchase — when presenting to the board.',
    negotiation: 'Check your existing Microsoft EA before pricing — DAX is often bundled with M365 enterprise agreements at significant discount. Negotiate a 6-month pilot for 200 physicians before committing to full deployment.',
  },
  {
    id: 'ai-governance',
    label: 'AI Governance Model',
    status: 'MEDIUM',
    deadline: 'Board request: Q1 2026',
    context: 'The board requested a formal AI governance framework in Q1 2026. Without it, Meridian cannot safely deploy clinical AI models or satisfy upcoming HHS AI transparency requirements. Governance is table stakes for deploying any of the $94M roadmap initiatives.',
    options: [
      {
        name: 'Internal AI Ethics Committee', cost: '$180–280K/yr', timeline: '3–4 mo to establish', score: 86, recommended: true, tag: 'Right long-term model',
        bullets: ['CMO + CDO + Legal + Clinical Informatics leads', 'Owns model validation, approval, and monitoring', 'Meets HHS AI transparency requirements directly', 'Credible to medical staff, regulators, and board'],
      },
      {
        name: 'Third-Party AI Audit Firm', cost: '$320–520K/yr', timeline: '2–3 mo', score: 74, recommended: false, tag: 'External credibility layer',
        bullets: ['Independent validation of clinical AI models', 'Strong optics for board and external stakeholders', 'Adds approval overhead to deployment timelines', 'Not a substitute for internal governance authority'],
      },
      {
        name: 'AHA AI Consortium Membership', cost: '$45–75K/yr', timeline: 'Immediate', score: 58, recommended: false, tag: 'Peer benchmarking access',
        bullets: ['Access to peer health system governance frameworks', 'Not a decision-making body for Meridian', 'Good supplement to accelerate framework design', 'Policy advocacy participation as side benefit'],
      },
    ],
    recommendation: 'Build the internal committee — it is the only structure with actual decision authority over Meridian\'s AI deployments. Use the AHA consortium to shortcut framework design by 60 days. Budget a third-party AI audit for Year 1 clinical model deployments to establish external validation credibility.',
    negotiation: 'Frame the committee charter explicitly around HHS AI transparency requirements. This gives the incoming CDO a legal mandate to enforce governance decisions — not just best-practice advocacy that can be overridden.',
  },
]

// Vendors with AbarVa referral relationships — disclosed on every card
const REFERRAL_VENDORS = new Set(['Cohere Health', 'Databricks on Azure', 'Nuance DAX (Microsoft)', 'Amazon Bedrock'])

// Vendors with "Why not" explanations
const WHY_NOT: Record<string, string> = {
  'Waystar AI': 'Overlap with your existing Ensemble RCM contract creates redundancy. Higher cost than Cohere for prior auth alone. Best evaluated after Ensemble renegotiation.',
  'Olive AI': 'Recent Series E restructuring and layoffs create vendor stability risk. Timeline incompatible with CMS mandate. Not the right moment.',
  'Fractional CDO (Consulting)': 'Vendors have told us directly they deprioritize organizations without full-time AI leadership. A fractional CDO signals insufficient commitment.',
  'Promote Internal Analytics Lead': 'Mark Chen is an excellent analyst. This role requires vendor contract authority and board-level credibility he does not yet have.',
  'Defer to 2026': 'Every quarter without a CDO costs roughly $6M in delayed AI pipeline execution. This is not a neutral option.',
  'Epic Professional Services': 'Epic PS has a 9-month backlog and charges list price. SI partner route is faster, more flexible, and better at change management.',
  'Internal IT Activation': 'Your IT team is at capacity. Three peer health systems tried internal DAX activation in 2024 — all three failed and restarted with an SI.',
  'nThrive (Kaufman Hall)': 'Private equity ownership creates pricing instability risk. Weaker prior auth automation is a dealbreaker given the CMS mandate.',
  'Keep Epic Caboodle Only': 'This blocks your entire AI roadmap. Not a viable option.',
  'Snowflake + Azure ML': 'Strong for analytics. Not strong enough for real-time clinical AI streaming — your specific requirement.',
  'Azure Synapse Analytics': 'Microsoft is de-emphasizing Synapse in favor of Microsoft Fabric. You would be building on a deprecated architecture.',
  'Augmedix': 'Live scribe model is being outpaced by pure AI. DAX ambient AI requires zero physician behavior change — Augmedix still requires structured workflow.',
  'Suki AI': 'Smaller vendor with limited subspecialty coverage. Risk profile is high for a primary care-plus-specialist deployment at Meridian\'s scale.',
  'Third-Party AI Audit Firm': 'Useful supplement. Not a substitute for an internal governance body with actual decision authority.',
  'AHA AI Consortium Membership': 'Good for benchmarking. Has no governance authority over Meridian\'s deployments.',
}

type EntryPath = 'select' | 'rationalize' | 'audit' | 'rfp'

function SelectContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [activeClient, setActiveClient] = useState(clientId)
  const [selectedId, setSelectedId] = useState(DECISIONS[0].id)
  const [entryPath, setEntryPath] = useState<EntryPath | null>(null)
  const [openWhyNot, setOpenWhyNot] = useState<string | null>(null)
  const [rfpStreaming, setRfpStreaming] = useState(false)
  const [rfpText, setRfpText] = useState('')

  const decision = DECISIONS.find(d => d.id === selectedId) || DECISIONS[0]
  const recommended = decision.options.find(o => o.recommended)
  const clientName = activeClient === 'firstcapital' ? 'First Capital Financial' : activeClient === 'apexretail' ? 'Apex Retail Group' : 'Meridian Health System'
  const clientIndustry = activeClient === 'firstcapital' ? 'Financial Services' : activeClient === 'apexretail' ? 'Retail' : 'Healthcare'

  function generateRFP() {
    if (rfpStreaming) return
    setRfpStreaming(true)
    setRfpText('')
    const rfpContent = `REQUEST FOR PROPOSAL
${decision.label.toUpperCase()}
${clientName} — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — OVERVIEW AND CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${clientName} is soliciting proposals for ${decision.label}.

Background: ${decision.context}

This RFP is issued to qualified vendors. Responses are due within 30 days of issuance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — SCOPE OF WORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vendors are requested to provide:
• Detailed implementation approach and timeline
• Integration requirements with existing systems
• Staffing plan and named project resources
• References from comparable organizations (minimum 3)
• Pricing model with all cost components itemized

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — EVALUATION CRITERIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Proposals will be scored on:
• Technical capability and integration depth (30%)
• Implementation timeline and approach (25%)
• Total cost of ownership over 3 years (20%)
• Reference quality and outcome data (15%)
• Vendor stability and roadmap (10%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — MANDATORY REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All vendors must confirm:
• HIPAA BAA execution prior to any data access
• Named implementation lead committed before contract signing
• Outcome-based pricing component available (minimum 20% at risk)
• Exit clause at 12 months with data portability guaranteed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — SUBMISSION REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Deadline: 30 days from issuance
Format: PDF, maximum 40 pages excluding appendices
Contact: [Procurement contact to be designated]

Generated by AbarVa Vendor Intelligence. All criteria derived from ${clientName} data.`

    let i = 0
    const interval = setInterval(() => {
      i += 3
      if (i >= rfpContent.length) {
        setRfpText(rfpContent)
        setRfpStreaming(false)
        clearInterval(interval)
      } else {
        setRfpText(rfpContent.slice(0, i))
      }
    }, 16)
  }

  // Entry path selector
  if (!entryPath) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ maxWidth: '640px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>What are you trying to decide?</div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>Choose a path — we&apos;ll load the right intelligence for {clientName}.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {[
              { id: 'select' as EntryPath, icon: '◈', title: 'Select a vendor', desc: '7 open decisions · Scored shortlists · Negotiation playbooks', color: '#0F172A', bg: '#FFFFFF', border: '#E2E8F0' },
              { id: 'rationalize' as EntryPath, icon: '◇', title: 'Rationalize vendors', desc: 'Audit current spend · Identify overlap · Consolidation opportunities', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
              { id: 'audit' as EntryPath, icon: '◉', title: 'Audit current vendors', desc: 'Performance vs SLA · Value realized · Renegotiation leverage', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
              { id: 'rfp' as EntryPath, icon: '◎', title: 'Build an RFP/RFI', desc: 'One-click RFP from your requirements · Download formatted document', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
            ].map(path => (
              <button key={path.id} onClick={() => setEntryPath(path.id)}
                style={{ padding: '20px', background: path.bg, border: '1px solid ' + path.border, borderRadius: '12px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
                <div style={{ fontSize: '24px', marginBottom: '10px', color: path.color }}>{path.icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{path.title}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.4 }}>{path.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <a href="/admin" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}>← Engagement Hub</a>
          </div>
        </div>
      </div>
    )
  }

  // IT Audit path
  if (entryPath === 'audit') {
    const vendors = [
      { name: 'Ensemble Health Partners', category: 'RCM', spend: '$28M/yr', sla: 'BREACHED', slaDetail: '$8M in documented SLA violations', score: 38, action: 'Renegotiate immediately', urgency: 'red' },
      { name: 'Epic Systems', category: 'EHR', spend: '$84M total / $12M/yr', sla: 'MET', slaDetail: 'Optimization score 58/100 — underutilized', score: 71, action: 'Activate DAX + AI modules', urgency: 'amber' },
      { name: 'Microsoft Azure', category: 'Cloud', spend: '$4.2M/yr', sla: 'MET', slaDetail: 'Underutilized capacity — 34% utilization', score: 76, action: 'Consolidate workloads', urgency: 'amber' },
      { name: 'Nuance (Microsoft)', category: 'Voice AI', spend: '$0 (licensed, unused)', sla: 'N/A', slaDetail: 'DAX Copilot licensed but not activated', score: 55, action: 'Activate immediately — free', urgency: 'red' },
      { name: 'Workday', category: 'HR/Finance', spend: '$6.8M/yr', sla: 'MET', slaDetail: 'AI workforce planning module unused', score: 73, action: 'Activate workforce analytics', urgency: 'amber' },
    ]
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        <AbarvaNav clientId={activeClient} onClientChange={id => setActiveClient(id)} activePage="select" />
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <button onClick={() => setEntryPath(null)} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#6B7280', cursor: 'pointer', padding: 0, marginBottom: '6px', display: 'block' }}>← Change path</button>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Vendor Audit — {clientName}</h1>
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>$141M total vendor spend</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 200px 80px 200px', gap: 0, padding: '10px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
              <span>Vendor</span><span>Annual Spend</span><span>SLA Status</span><span>Score</span><span>Recommended Action</span>
            </div>
            {vendors.map((v, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 200px 80px 200px', gap: 0, padding: '16px 20px', borderBottom: i < vendors.length - 1 ? '1px solid #F1F5F9' : 'none', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{v.name}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{v.category}</div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{v.spend}</div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: v.sla === 'BREACHED' ? '#DC2626' : v.sla === 'MET' ? '#059669' : '#94A3B8', marginBottom: '2px' }}>{v.sla}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{v.slaDetail}</div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: v.score >= 70 ? '#059669' : v.score >= 50 ? '#D97706' : '#DC2626' }}>{v.score}</div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: v.urgency === 'red' ? '#FEF2F2' : '#FFFBEB', color: v.urgency === 'red' ? '#DC2626' : '#D97706' }}>{v.action}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#0D1117', borderRadius: '12px', padding: '20px', border: '1px solid #1E293B' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#2DD4C8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>IMMEDIATE RENEGOTIATION OPPORTUNITY</div>
            <div style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: 1.6 }}>Ensemble Health Partners has $8M in enforceable SLA breach penalties. Use this leverage before any renegotiation meeting. Outside counsel should send the breach demand letter first — it fundamentally changes the power dynamic. Nuance DAX is licensed but dormant — activating it costs nothing and recovers $18M annually in physician capacity.</div>
          </div>
        </div>
      </div>
    )
  }

  // RFP path
  if (entryPath === 'rfp') {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        <AbarvaNav clientId={activeClient} onClientChange={id => setActiveClient(id)} activePage="select" />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
          <button onClick={() => setEntryPath(null)} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#6B7280', cursor: 'pointer', padding: 0, marginBottom: '16px', display: 'block' }}>← Change path</button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>Build an RFP / RFI</h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Select a decision to generate a complete RFP document in seconds. All requirements derived from {clientName} data.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
            {DECISIONS.slice(0, 6).map(d => (
              <button key={d.id} onClick={() => setSelectedId(d.id)}
                style={{ padding: '12px', background: selectedId === d.id ? '#0F172A' : '#FFFFFF', border: '1px solid ' + (selectedId === d.id ? '#0F172A' : '#E2E8F0'), borderRadius: '8px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: selectedId === d.id ? '#2DD4C8' : '#0F172A', lineHeight: 1.3 }}>{d.label}</div>
              </button>
            ))}
          </div>
          <button onClick={generateRFP} disabled={rfpStreaming}
            style={{ padding: '12px 28px', background: rfpStreaming ? '#94A3B8' : '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: rfpStreaming ? 'not-allowed' : 'pointer', marginBottom: '20px', fontFamily: 'inherit' }}>
            {rfpStreaming ? 'Generating...' : 'Generate RFP →'}
          </button>
          {rfpText && (
            <div style={{ background: '#0F172A', borderRadius: '12px', padding: '24px', border: '1px solid #1E293B' }}>
              <pre style={{ fontSize: '12px', color: '#E2E8F0', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{rfpText}</pre>
              {!rfpStreaming && (
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <button style={{ padding: '8px 16px', background: '#2DD4C8', color: '#0D1117', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Download as PDF →</button>
                  <button style={{ padding: '8px 16px', background: 'none', color: '#8B949E', border: '1px solid #30363D', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Copy to clipboard</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <AbarvaNav clientId={activeClient} onClientChange={id => setActiveClient(id)} activePage="select" />
      <EngagementProgress />

      {/* breadcrumb */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a href="/" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}>Home</a>
        <span style={{ color: '#D1D5DB' }}>›</span>
        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>Select</span>
        <span style={{ color: '#D1D5DB' }}>›</span>
        <span style={{ fontSize: '13px', color: '#6B7280' }}>{clientName} · {clientIndustry}</span>
      </div>

      {/* Journey */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #F3F4F6', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '0', height: '36px', overflowX: 'auto' as const }}>
        {[
          { label: 'Diagnose', href: '/diagnose?client=' + clientId, active: false },
          { label: 'AI Strategy', href: '/ai-strategy?client=' + clientId, active: false },
          { label: 'Justify', href: '/justify?client=' + clientId, active: false },
          { label: 'Select', href: '/select?client=' + clientId, active: true },
          { label: 'Blueprint', href: '/blueprint?client=' + clientId, active: false },
        ].map((s, i) => (
          <a key={i} href={s.href} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', height: '36px', fontSize: '11px', fontWeight: s.active ? 700 : 500, color: s.active ? '#1B4FD8' : '#9CA3AF', textDecoration: 'none', borderBottom: s.active ? '2px solid #1B4FD8' : '2px solid transparent', whiteSpace: 'nowrap' as const, boxSizing: 'border-box' as const }}>
            {s.active && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1B4FD8', display: 'block' }} />}
            {s.label}
          </a>
        ))}
      </div>

      {/* two-column layout */}
      <div style={{ display: 'flex', height: 'calc(100vh - 113px)' }}>

        {/* left sidebar */}
        <div style={{ width: '280px', flexShrink: 0, background: '#111827', overflowY: 'auto', borderRight: '1px solid #1F2937' }}>
          <div style={{ padding: '20px 16px 12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#6EE7B7', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Decision Intelligence</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#F9FAFB', marginBottom: '2px' }}>Meridian Health System</div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>7 open decisions · $292M at stake</div>
          </div>

          <div style={{ height: '1px', background: '#1F2937', margin: '0 16px 12px' }} />

          {['URGENT', 'HIGH', 'MEDIUM'].map(status => (
            <div key={status} style={{ marginBottom: '16px' }}>
              <div style={{ padding: '0 16px', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: STATUS_COLOR[status], letterSpacing: '0.1em' }}>{status}</span>
              </div>
              {DECISIONS.filter(d => d.status === status).map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left' as const, padding: '10px 16px',
                    background: selectedId === d.id ? '#1F2937' : 'transparent',
                    border: 'none', borderLeft: selectedId === d.id ? `3px solid ${STATUS_COLOR[d.status]}` : '3px solid transparent',
                    cursor: 'pointer', transition: 'all 0.1s',
                  }}>
                  <div style={{ fontSize: '13px', fontWeight: selectedId === d.id ? 600 : 400, color: selectedId === d.id ? '#F9FAFB' : '#9CA3AF', marginBottom: '2px', lineHeight: 1.3 }}>{d.label}</div>
                  <div style={{ fontSize: '11px', color: '#4B5563' }}>{d.deadline}</div>
                </button>
              ))}
            </div>
          ))}

          <div style={{ height: '1px', background: '#1F2937', margin: '0 16px 16px' }} />
          <div style={{ padding: '0 16px 20px' }}>
            <a href="/admin" style={{ display: 'block', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textDecoration: 'none', border: '1px solid #1F2937', textAlign: 'center' as const }}>← Engagement Hub</a>
          </div>
        </div>

        {/* right content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <div style={{ maxWidth: '900px' }}>

            {/* decision header */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: STATUS_BG[decision.status], color: STATUS_COLOR[decision.status], letterSpacing: '0.06em' }}>{decision.status}</span>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>{decision.deadline}</span>
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '10px', marginTop: 0 }}>{decision.label}</h1>
              <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, margin: 0 }}>{decision.context}</p>
            </div>

            {/* options */}
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>OPTIONS EVALUATED</div>
            <div style={{ display: 'grid', gridTemplateColumns: decision.options.length === 4 ? 'repeat(2, 1fr)' : 'repeat(' + Math.min(decision.options.length, 3) + ', 1fr)', gap: '12px', marginBottom: '24px' }}>
              {decision.options.map((opt, i) => (
                <div key={i} style={{
                  background: opt.recommended ? '#FFFFFF' : '#FFFFFF',
                  border: opt.recommended ? '2px solid #0F172A' : '1px solid #E2E8F0',
                  borderRadius: '12px', padding: '16px',
                  position: 'relative' as const,
                }}>
                  {opt.recommended && (
                    <div style={{ position: 'absolute' as const, top: '-1px', right: '12px', background: '#0F172A', color: '#2DD4C8', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '0 0 8px 8px', letterSpacing: '0.06em' }}>RECOMMENDED</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', marginTop: opt.recommended ? '8px' : 0 }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>{opt.name}</div>
                      {REFERRAL_VENDORS.has(opt.name) && (
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#D97706' }}>★ AbarVa referral partner — disclosed</span>
                      )}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: opt.recommended ? '#0F172A' : '#94A3B8', marginLeft: '8px', flexShrink: 0 }}>{opt.score}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 600, marginBottom: '10px' }}>{opt.tag}</div>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '2px' }}>COST</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{opt.cost}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '2px' }}>TIMELINE</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{opt.timeline}</div>
                    </div>
                  </div>
                  {opt.bullets.map((b, bi) => (
                    <div key={bi} style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}>
                      <span style={{ color: opt.recommended ? '#059669' : '#94A3B8', flexShrink: 0, fontSize: '12px' }}>·</span>
                      <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.4 }}>{b}</span>
                    </div>
                  ))}
                  {!opt.recommended && WHY_NOT[opt.name] && (
                    <div style={{ marginTop: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                      <button onClick={() => setOpenWhyNot(openWhyNot === opt.name ? null : opt.name)}
                        style={{ background: 'none', border: 'none', padding: 0, fontSize: '11px', color: '#94A3B8', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        {openWhyNot === opt.name ? '▲ Hide' : '▼ Why not this one?'}
                      </button>
                      {openWhyNot === opt.name && (
                        <div style={{ marginTop: '6px', padding: '8px 10px', background: '#FEF2F2', borderRadius: '6px', fontSize: '12px', color: '#78350F', lineHeight: 1.5 }}>
                          {WHY_NOT[opt.name]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* AbarVa recommendation */}
            <div style={{ background: '#0D1117', borderRadius: '12px', padding: '20px 24px', marginBottom: '16px', border: '1px solid #21262D' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2DD4C8' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#2DD4C8', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>AbarVa Recommendation</span>
                {recommended && <span style={{ fontSize: '11px', color: '#8B949E', marginLeft: '4px' }}>→ {recommended.name}</span>}
              </div>
              <p style={{ fontSize: '13px', color: '#E6EDF3', lineHeight: 1.6, margin: 0 }}>{decision.recommendation}</p>
            </div>

            {/* negotiation note */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px 20px', marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Negotiation Note</div>
              <p style={{ fontSize: '13px', color: '#78350F', lineHeight: 1.6, margin: 0 }}>{decision.negotiation}</p>
            </div>

            {/* footer nav */}
            <div style={{ display: 'flex', gap: '12px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
              {(() => {
                const idx = DECISIONS.findIndex(d => d.id === selectedId)
                const prev = DECISIONS[idx - 1]
                const next = DECISIONS[idx + 1]
                return (
                  <>
                    {prev && (
                      <button onClick={() => setSelectedId(prev.id)} style={{ padding: '8px 16px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>← {prev.label}</button>
                    )}
                    <div style={{ flex: 1 }} />
                    {next && (
                      <button onClick={() => setSelectedId(next.id)} style={{ padding: '8px 16px', borderRadius: '8px', background: '#0F172A', border: 'none', fontSize: '13px', fontWeight: 600, color: '#F8FAFC', cursor: 'pointer' }}>{next.label} →</button>
                    )}
                  </>
                )
              })()}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default function SelectPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}>Loading...</div>}>
      <SelectContent />
    </Suspense>
  )
}

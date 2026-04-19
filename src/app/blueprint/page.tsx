'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useActiveClient } from '@/lib/use-active-client'
import AbarvaNav from '@/components/AbarvaNav'

const BLUEPRINTS: Record<string, any> = {
  meridian: {
    client: 'Meridian Health System',
    industry: 'Healthcare IDN · 23 Hospitals · $11.2B Revenue',
    initiative: 'Prior Authorization AI Automation',
    domain: 'Middle Office · Revenue Cycle Management',
    preparedBy: 'AbarVa Intelligence Platform',
    date: 'April 2026',
    color: '#1B4FD8',
    executiveSummary: {
      headline: 'Meridian is leaving $28M annually on the table due to manual prior authorization — and faces $1M/day in CMS penalties starting January 2026.',
      bullets: [
        'Current state: 23% of payers connected to electronic prior auth. 77% processed manually by 14 FTE.',
        'The CMS Interoperability and Prior Authorization Final Rule requires 100% electronic connection by January 1, 2026. Meridian is 8 months from a compliance crisis.',
        'The solution: AI-powered prior auth automation connected to Epic — already deployed at Advocate Aurora, Baylor Scott & White, and 18 other health systems.',
        'Investment: $4.2M over 9 months. Annual value: $28M. Payback: 1.8 months after go-live.',
        'Critical dependency: This initiative requires Ensemble cooperation OR becomes the exit strategy from Ensemble.',
      ],
      decision: 'The board needs to make one decision this week: enforce the $8M in Ensemble penalties as leverage, or begin parallel RCM vendor evaluation. AbarVa recommends both simultaneously.',
    },
    problemStatement: {
      current: [
        { metric: 'Payers on electronic prior auth', current: '23%', target: '100%', gap: '77% manual', dollarImpact: '$28M annually' },
        { metric: 'Prior auth FTE', current: '14 FTE', target: '3 FTE', gap: '11 FTE excess', dollarImpact: '$2.1M annually' },
        { metric: 'Average auth turnaround', current: '4.2 days', target: '< 4 hours', gap: '3.8 days', dollarImpact: 'Patient satisfaction, discharge delays' },
        { metric: 'Denial rate from auth failures', current: '18.2%', target: '< 12%', gap: '6.2 points', dollarImpact: '$37.6M annual write-off' },
        { metric: 'CMS compliance', current: '23%', target: '100% by Jan 2026', gap: '8 months', dollarImpact: '$1M/day penalty exposure' },
      ],
      rootCause: 'Ensemble Health Partners, contracted at $48M/year to manage RCM, has connected only 23% of payers to electronic prior auth despite contractual requirements. The $8M in accumulated SLA penalties have never been enforced. Ensemble has no financial incentive to accelerate because the manual process requires more Ensemble staff — and their contract is structured on FTE count, not outcomes.',
      cmsDeadline: 'The CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F) requires all applicable payers and providers to implement electronic prior authorization by January 1, 2026. Non-compliance penalties: up to $1,000 per day per API specification not met. At 77% non-compliance, Meridians exposure is $7-28M annually depending on enforcement intensity.',
    },
    solutionDesign: {
      approach: 'Deploy an AI-powered prior auth automation layer that connects directly to Epics existing prior auth workflow, integrates with all 847 payer portals via the vendors pre-built connections, and uses NLP to auto-complete authorization requests from clinical documentation.',
      architecture: [
        { layer: 'AI Layer', component: 'NLP Engine', description: 'Reads Epic clinical notes and auto-populates prior auth fields. Classifies authorization likelihood before submission.', technology: 'Claude API (Anthropic) — selected for medical document comprehension' },
        { layer: 'Integration Layer', component: 'Epic FHIR API', description: 'Pulls clinical data, pushes auth status back to Epic workflow. Eliminates dual data entry.', technology: 'Epic FHIR R4 — native integration, no custom build' },
        { layer: 'Payer Layer', component: 'Payer Network', description: '847 payer connections pre-built by vendor. Covers 100% of Meridians payer mix.', technology: 'Vendor-managed — Cohere Health or Waystar' },
        { layer: 'Analytics Layer', component: 'Denial Prediction', description: 'ML model scores each auth request before submission. Flags high-risk requests for human review.', technology: 'Azure ML — Meridians existing platform' },
        { layer: 'Governance Layer', component: 'Audit Trail', description: 'Every AI decision logged. Explainable output for compliance. HIPAA-compliant PHI handling.', technology: 'Azure Monitor + existing BAA' },
      ],
      dataRequirements: [
        { data: 'Epic prior auth history', status: 'Available', completeness: '94%', note: '3 years of historical auths — sufficient for model training' },
        { data: 'Payer coverage policies', status: 'Available via vendor', completeness: '100%', note: 'Vendor maintains real-time payer policy database' },
        { data: 'Clinical documentation (notes)', status: 'Available', completeness: '87%', note: 'Blue Ridge Cerner data not yet migrated — affects 2 hospitals' },
        { data: 'Denial reason codes', status: 'Available', completeness: '91%', note: 'Ensemble data — will require cooperation or exit to access' },
        { data: 'Real-time payer portal access', status: 'Vendor-provided', completeness: '100%', note: 'Core value of vendor solution' },
      ],
    },
    vendorDecision: {
      headline: 'AbarVa recommends Cohere Health over Waystar and Olive for Meridians specific context.',
      recommendation: 'Cohere Health',
      reasoning: [
        'Epic integration: Cohere has 23 live Epic integrations. Their implementation team has completed the exact Meridian version (2023) at Advocate Aurora. Implementation is 6 weeks not the 16 weeks Waystar requires.',
        'Payer network: Cohere covers 847 payers — Meridians complete payer mix including the 6 TennCare plans that are the highest denial risk.',
        'AI approach: Coheres NLP model was trained on 180M prior auth requests. Denial prediction accuracy is 91% vs 78% for Waystar.',
        'Pricing: Cohere list price is $2.8-3.8M. AbarVa intelligence shows Baylor Scott & White paid $2.1M for same scope in Q4 2024. Target: $2.0-2.4M.',
        'Ensemble leverage: Cohere actively competes against Ensemble and will price aggressively to displace them.',
      ],
      vendorComparison: [
        { vendor: 'Cohere Health', klas: '4.4/5', cost: '$2.0-2.4M', timeline: '6-8 months', epicFit: 'Native', aiCapability: 'Best in class', recommendation: true },
        { vendor: 'Waystar AI', klas: '4.1/5', cost: '$3.0-4.2M', timeline: '9-12 months', epicFit: 'API integration', aiCapability: 'Strong', recommendation: false },
        { vendor: 'Olive AI', klas: '3.8/5', cost: '$4.2-6.0M', timeline: '12-18 months', epicFit: 'Custom build', aiCapability: 'Broad but shallow', recommendation: false },
      ],
      negotiationPlaybook: [
        'Open with: "We are also evaluating Waystar and building internally on Azure ML. We have budget for one vendor." This creates urgency.',
        'Mention the Ensemble situation: "We are managing a $48M RCM relationship that has underperformed. We need outcome-based contracts where fees are tied to denial rate improvement."',
        'Request: Cohere bears implementation risk — fixed fee, not time and materials. Penalty clause if denial rate does not reach 14% within 6 months of go-live.',
        'Pricing anchor: "Advocate Aurora paid $2.1M for comparable scope. We need to be in that range." Do not reveal this was Q4 2024 pricing.',
        'Walk away condition: If Cohere will not accept outcome-based pricing, they do not believe in their own product.',
      ],
    },
    resourceModel: {
      headline: 'This initiative requires 1 Maestro, 1 Cohere PS team, and 0.5 FTE internal. No SI required.',
      phases: [
        {
          phase: 'Phase 1', name: 'Foundation and Contracting', duration: 'Months 1-2', cost: '$800K',
          resources: [
            { role: 'AbarVa Maestro', type: 'AbarVa', allocation: '40%', cost: 'Included in platform fee', responsibility: 'Vendor negotiation, contract review, stakeholder alignment' },
            { role: 'Epic Integration Lead', type: 'Internal', allocation: '50%', cost: '$0 incremental', responsibility: 'Epic FHIR API configuration, workflow design' },
            { role: 'Cohere Implementation Lead', type: 'Vendor', allocation: '100%', cost: 'Included in vendor fee', responsibility: 'Payer network configuration, system setup' },
            { role: 'Legal / Contracting', type: 'Internal', allocation: '20%', cost: '$0 incremental', responsibility: 'BAA, SLA terms, penalty clauses' },
          ],
        },
        {
          phase: 'Phase 2', name: 'Build and Test', duration: 'Months 3-6', cost: '$2.4M',
          resources: [
            { role: 'Cohere PS Team (3)', type: 'Vendor', allocation: '100%', cost: 'Included in vendor fee', responsibility: 'Payer integrations, NLP configuration, Epic build' },
            { role: 'Azure ML Engineer', type: 'SI (Avanade)', allocation: '100%', cost: '$180K (3 months)', responsibility: 'Denial prediction model on Azure ML' },
            { role: 'Epic Analyst', type: 'Internal', allocation: '75%', cost: '$0 incremental', responsibility: 'Workflow configuration, UAT' },
            { role: 'AbarVa Maestro', type: 'AbarVa', allocation: '20%', cost: 'Included', responsibility: 'Milestone governance, issue escalation' },
          ],
        },
        {
          phase: 'Phase 3', name: 'Deploy and Scale', duration: 'Months 7-9', cost: '$1.0M',
          resources: [
            { role: 'Cohere PS Team (2)', type: 'Vendor', allocation: '100%', cost: 'Included in vendor fee', responsibility: 'Go-live support, payer issue resolution' },
            { role: 'Prior Auth Coordinator (retrain)', type: 'Internal', allocation: '100%', cost: '$0 incremental', responsibility: 'Exception handling, payer escalations' },
            { role: 'AbarVa Maestro', type: 'AbarVa', allocation: '10%', cost: 'Included', responsibility: 'Outcome measurement, fee calculation' },
          ],
        },
      ],
      agentVsHuman: [
        { task: 'Standard prior auth submission (routine)', recommended: 'Agent (Cohere AI)', cost: '$0.08/auth', volume: '~12,000/month', note: 'Fully automated — no human touch' },
        { task: 'Complex clinical justification (high-risk)', recommended: 'AI-assisted human', cost: '$12/auth', volume: '~800/month', note: 'AI drafts, coordinator reviews' },
        { task: 'Payer portal escalation (denied)', recommended: 'Human (retrained FTE)', cost: '$45/auth', volume: '~400/month', note: 'Human judgment required' },
        { task: 'Model monitoring and drift detection', recommended: 'Agent (Azure ML)', cost: '$400/month', volume: 'Continuous', note: 'Alert if accuracy drops below 88%' },
      ],
    },
    businessCase: {
      investment: [
        { phase: 'Phase 1 (months 1-2)', amount: 800000, type: 'Setup and contracting' },
        { phase: 'Phase 2 (months 3-6)', amount: 2400000, type: 'Build and integration' },
        { phase: 'Phase 3 (months 7-9)', amount: 1000000, type: 'Deploy and stabilize' },
      ],
      totalInvestment: 4200000,
      valueCapture: [
        { source: 'Denial rate improvement (18.2% → 12%)', year1: 14800000, steady: 28000000 },
        { source: 'Prior auth FTE reduction (14 → 3 FTE)', year1: 1600000, steady: 2100000 },
        { source: 'CMS penalty avoidance', year1: 0, steady: 7000000 },
        { source: 'Turnaround time improvement (discharge delays)', year1: 800000, steady: 2400000 },
      ],
      totalYear1Value: 17200000,
      totalSteadyValue: 39500000,
      paybackMonths: 5.4,
      roi: 9.4,
      abarvaFee: {
        platform: 500000,
        outcomeFee: 4200000,
        total: 4700000,
        note: '15% of Year 1 realized savings — paid quarterly as savings are verified',
      },
    },
    governance: {
      kpis: [
        { metric: 'Prior auth electronic connection rate', baseline: '23%', target: '100%', frequency: 'Monthly', owner: 'CIO' },
        { metric: 'Denial rate', baseline: '18.2%', target: '< 12%', frequency: 'Monthly', owner: 'CFO / RCM Director' },
        { metric: 'Auth turnaround time', baseline: '4.2 days', target: '< 4 hours', frequency: 'Weekly', owner: 'COO' },
        { metric: 'AI model accuracy', baseline: 'N/A', target: '> 88%', frequency: 'Continuous', owner: 'CDO (hire first)' },
        { metric: 'CMS compliance status', baseline: '23%', target: '100% by Jan 2026', frequency: 'Monthly', owner: 'CIO / Legal' },
      ],
      risks: [
        { risk: 'Ensemble non-cooperation on denial data', probability: 'High', impact: 'Medium', mitigation: 'Use Coheres payer network data as primary — Ensemble data is secondary. Simultaneously enforce $8M SLA penalties as leverage.' },
        { risk: 'Blue Ridge Cerner data unavailable', probability: 'Medium', impact: 'Low', mitigation: 'Phase 1 covers 21 Epic hospitals. Add 2 Blue Ridge hospitals in Phase 3 after Cerner migration completes.' },
        { risk: 'CDO vacancy delays governance', probability: 'High', impact: 'High', mitigation: 'AbarVa Maestro covers CDO functions during implementation. CDO hire must start immediately — this is the critical path.' },
        { risk: 'Payer portal changes post go-live', probability: 'Low', impact: 'Medium', mitigation: 'Cohere maintains payer network — contractually responsible for keeping connections current.' },
      ],
      nextSteps: [
        { action: 'Enforce $8M Ensemble SLA penalties', owner: 'CFO + Legal', deadline: 'This week', rationale: 'Creates leverage for Ensemble cooperation AND funds Phase 1' },
        { action: 'Issue RFP to Cohere Health and Waystar', owner: 'CIO', deadline: 'This week', rationale: 'Parallel track — 6-week vendor selection process' },
        { action: 'Post CDO job description', owner: 'CHRO', deadline: 'This week', rationale: 'CDO is critical path — 90-day hire timeline means start now' },
        { action: 'Brief CFO on business case', owner: 'CIO + AbarVa', deadline: 'Next week', rationale: 'Robert Chen needs to approve $4.2M — business case is ready' },
        { action: 'Notify CMS of remediation plan', owner: 'CIO + Legal', deadline: 'This month', rationale: 'Proactive notification reduces penalty risk — shows good faith' },
      ],
    },
  },

  arcturus: {
    client: 'Arcturus Financial Group',
    industry: 'Wealth Management · $200B AUM · 180 Advisors',
    initiative: 'Advisor Intelligence Co-Pilot',
    domain: 'Front Office · Advisor Productivity & Client Intelligence',
    preparedBy: 'AbarVa Intelligence Platform',
    date: 'April 2026',
    color: '#2DD4C8',
    executiveSummary: {
      headline: 'Arcturus advisors spend 64% of their time on tasks AI can handle — while Morgan Stanley and Merrill Lynch have already deployed advisor AI. Every quarter of delay widens the productivity gap.',
      bullets: [
        'Current state: advisors spend 64% of time on prep, reporting, admin. Only 36% on client relationship work — the only activity that retains AUM.',
        'The business case: $42M annual value from advisor productivity alone, with a further $18M from proactive churn prevention. Combined $60M — against $3.2M investment.',
        'The urgency: two institutional clients ($1.1B AUM) have issued RFPs citing fee competitiveness. Advisor AI is the only structural answer to fee pressure short of headcount reduction.',
        'Vendor recommendation: Salesforce Einstein (already on FSC) + Azure OpenAI orchestration — zero new vendor relationship, 4-month deployment vs 14 months for alternatives.',
        'AbarVa role: negotiate Salesforce Einstein contract (benchmarked to Fidelity pricing), deploy integration layer, and verify $42M in advisor productivity improvement within 12 months.',
      ],
      decision: 'The board needs one decision: approve the $3.2M Salesforce Einstein + Azure OpenAI budget this quarter. Delay compounds — Morgan Stanley advisor AI is already in the market. Every quarter of inaction costs $10M in advisor productivity and widens the churn risk.',
    },
    problemStatement: {
      current: [
        { metric: 'Advisor time on relationship work', current: '36%', target: '60%', gap: '24 percentage points', dollarImpact: '$42M/yr in productivity gap' },
        { metric: 'Client meeting prep time', current: '45 min/meeting', target: '8 min/meeting', gap: '37 min/meeting', dollarImpact: '660 advisor-hours/week recoverable' },
        { metric: 'AUM churn rate', current: '13%/year', target: '8%/year', gap: '5 points above benchmark', dollarImpact: '$588M AUM lost annually' },
        { metric: 'New client prospect identification', current: 'Manual, opportunistic', target: 'AI-driven, systematic', gap: 'No predictive engine', dollarImpact: '$22M/yr in pipeline gap' },
        { metric: 'Cost-to-income ratio', current: '71%', target: '58% (peer median)', gap: '$840M structural gap', dollarImpact: 'Largest single performance gap' },
      ],
      rootCause: 'The Salesforce FSC deployment was done without enabling Einstein or AI features — the tool is present but not activated. Bloomberg Terminal and Aladdin remain disconnected from the CRM, so advisors spend 45 minutes before each client meeting manually pulling data from three systems. There is no pre-built meeting brief, no portfolio narrative generation, and no proactive churn signal. The technology to solve this is already contracted — it simply has not been turned on.',
      urgencyTitle: 'Competitive Pressure — Peer Firms Already Deployed',
      urgency: 'Morgan Stanley launched MS Vantage (advisor AI) in Q3 2025. Merrill Lynch launched Client Insight in Q1 2026. Both are already in the hands of advisors competing for the same client base. UBS and Raymond James are 6-9 months behind Arcturus. The window to be the first independent RIA at scale to deploy advisor AI is closing. Two institutional clients representing $1.1B AUM have issued RFPs citing fee competitiveness — the decision arrives in 90 days, and advisor AI capability will be a scored criterion.',
    },
    solutionDesign: {
      approach: 'Activate Salesforce Einstein (already contracted, not deployed) and connect Bloomberg, Aladdin, and Advent portfolio data via a real-time Azure integration layer. The AI co-pilot generates pre-meeting briefs, portfolio narratives, and churn alerts automatically — no new vendor relationship required. Azure OpenAI orchestrates the intelligence layer using the golden record as the data source.',
      architecture: [
        { layer: 'AI Layer', component: 'Azure OpenAI Orchestrator', description: 'Generates pre-meeting briefings, portfolio narratives, and churn signals from the golden record. Delivers 3-minute briefing 2 hours before each meeting.', technology: 'Azure OpenAI GPT-4o — already on Arcturus Azure tenant' },
        { layer: 'CRM Layer', component: 'Salesforce Einstein', description: 'Surfaces AI recommendations inside advisor workflow. Next-best-action, churn prediction, and prospect alerts within FSC.', technology: 'Einstein for FSC — already contracted, activation only' },
        { layer: 'Data Layer', component: 'Golden Record', description: 'Real-time integration of Bloomberg, Aladdin, Advent, and Salesforce into a unified client + portfolio record. Single source of truth for AI.', technology: 'Azure SQL + Azure Data Factory — 6-week build' },
        { layer: 'Market Data', component: 'Bloomberg API', description: 'Real-time market data and portfolio valuations injected into pre-meeting briefings and portfolio narratives.', technology: 'Bloomberg B-PIPE API — already licensed' },
        { layer: 'Governance Layer', component: 'Compliance Filter', description: 'Every AI recommendation reviewed against FSC compliance rules before delivery to advisor. Suitability flags auto-suppressed until human review.', technology: 'Azure AI Content Safety + Actimize integration' },
      ],
      dataRequirements: [
        { data: 'Salesforce FSC CRM data', status: 'Available', completeness: '91%', note: '180 advisors, 12,000 clients — FSC already in use. Einstein activation only.' },
        { data: 'Bloomberg market data', status: 'Available', completeness: '100%', note: 'B-PIPE API licensed. Requires connection to golden record — 2-week integration.' },
        { data: 'Aladdin portfolio positions', status: 'Available', completeness: '88%', note: 'Real-time positions available via API. 14 alternative fund positions are manual — 12% of AUM.' },
        { data: 'Advent historical performance', status: 'Available', completeness: '96%', note: 'Full performance history from Advent. 3-day lag to golden record eliminated in Phase 1.' },
        { data: 'Client communication history', status: 'Partial', completeness: '62%', note: '38% of advisor emails not captured. CRM email sync required — 4-week configuration.' },
      ],
    },
    vendorDecision: {
      headline: 'AbarVa recommends Salesforce Einstein activation over Microsoft Copilot for Sales or custom Azure OpenAI build.',
      recommendation: 'Salesforce Einstein (already contracted)',
      reasoning: [
        'Already contracted: Arcturus holds an FSC + Einstein contract. Activation cost is $380K (implementation only). No new vendor negotiation, no new security review, no procurement cycle.',
        'Advisor workflow: Einstein lives inside Salesforce FSC — where advisors already work. Copilot for Sales requires a Teams-first workflow that conflicts with advisor habits at 11 of 14 surveyed firms.',
        'Time to value: Einstein activation + Azure golden record = 14 weeks to first advisor brief. Custom Azure build = 52+ weeks. The 38-week difference costs $8M in delayed productivity.',
        'Compliance coverage: Salesforce FSC + Einstein is the only solution with pre-built wealth management compliance guardrails. Custom build requires 6 months of compliance configuration that is already done in Einstein.',
        'AbarVa benchmarking: Edward Jones paid $2.8M for equivalent Einstein deployment in 2025. LPL Financial paid $2.1M. Arcturus should target $1.8-2.2M for implementation — not the list price of $3.4M.',
      ],
      vendorComparison: [
        { vendor: 'Salesforce Einstein (activate)', klas: 'N/A', cost: '$1.8-2.2M', timeline: '14 weeks', epicFit: 'Native to FSC', aiCapability: 'Best fit for wealth mgmt', recommendation: true },
        { vendor: 'Microsoft Copilot for Sales', klas: 'N/A', cost: '$2.4-3.2M', timeline: '22 weeks', epicFit: 'Teams-first, non-native', aiCapability: 'Strong but generic', recommendation: false },
        { vendor: 'Custom Azure OpenAI build', klas: 'N/A', cost: '$4.8-7.0M', timeline: '52+ weeks', epicFit: 'Custom integration required', aiCapability: 'Maximum flexibility', recommendation: false },
      ],
      negotiationPlaybook: [
        'Open with: "We are also evaluating Microsoft Copilot for Sales. Their implementation team is available in 6 weeks." This activates the Salesforce competitive response.',
        'Anchor to benchmarks: "Edward Jones paid $2.1M for comparable scope in 2025. Our target is $1.8M for implementation — and we need outcome-based pricing tied to adoption rate and advisor productivity."',
        'Request: Einstein usage-based activation — Arcturus pays per activated advisor, not per licensed seat. Starts at 40 advisors, scales to 180 based on demonstrated productivity improvement.',
        'Demand: Salesforce PS team must include one wealth management-specific Einstein deployment resource. Generic FSC PS teams have 40% longer deployment cycles at comparable firms.',
        'Walk away condition: If Salesforce will not price competitively vs. Microsoft, escalate to SVP Sales level — the competitive displacement threat is real at this AUM tier.',
      ],
    },
    resourceModel: {
      headline: 'This initiative requires 1 AbarVa Maestro, 1 Salesforce PS lead, and 1 Azure data engineer. No SI required.',
      phases: [
        {
          phase: 'Phase 1', name: 'Golden Record & Data Layer', duration: 'Weeks 1-6', cost: '$480K',
          resources: [
            { role: 'AbarVa Maestro', type: 'AbarVa', allocation: '60%', cost: 'Included in platform fee', responsibility: 'Vendor negotiation, architecture design, stakeholder alignment' },
            { role: 'Azure Data Engineer (Avanade)', type: 'SI', allocation: '100%', cost: '$180K (6 weeks)', responsibility: 'Bloomberg-Aladdin-Advent-Salesforce golden record integration' },
            { role: 'Salesforce FSC Admin', type: 'Internal', allocation: '50%', cost: '$0 incremental', responsibility: 'FSC data model preparation, field mapping' },
            { role: 'Compliance Officer', type: 'Internal', allocation: '20%', cost: '$0 incremental', responsibility: 'AI recommendation guardrail approval' },
          ],
        },
        {
          phase: 'Phase 2', name: 'Einstein Activation & Pilot (40 advisors)', duration: 'Weeks 7-14', cost: '$1.4M',
          resources: [
            { role: 'Salesforce Einstein PS Lead', type: 'Vendor', allocation: '100%', cost: 'Included in vendor fee', responsibility: 'Einstein configuration, model training on Arcturus data, FSC workflow build' },
            { role: 'Azure OpenAI Engineer', type: 'Vendor', allocation: '100%', cost: '$240K (8 weeks)', responsibility: 'Orchestration layer, briefing generation, meeting prep automation' },
            { role: 'AbarVa Maestro', type: 'AbarVa', allocation: '40%', cost: 'Included', responsibility: 'Pilot governance, advisor feedback loop, outcome baseline measurement' },
            { role: 'Change Management Lead', type: 'Internal', allocation: '80%', cost: '$0 incremental', responsibility: 'Advisor adoption program, training, feedback collection' },
          ],
        },
        {
          phase: 'Phase 3', name: 'Full Rollout (180 advisors)', duration: 'Weeks 15-20', cost: '$1.3M',
          resources: [
            { role: 'Salesforce PS Team (2)', type: 'Vendor', allocation: '100%', cost: 'Included in vendor fee', responsibility: 'Scale deployment, advisor customization, FSC reporting dashboards' },
            { role: 'AbarVa Maestro', type: 'AbarVa', allocation: '20%', cost: 'Included', responsibility: 'Productivity measurement, churn impact tracking, fee calculation' },
            { role: 'IT Operations', type: 'Internal', allocation: '30%', cost: '$0 incremental', responsibility: 'Production support, monitoring, SLA management' },
          ],
        },
      ],
      agentVsHuman: [
        { task: 'Pre-meeting briefing generation (standard)', recommended: 'Agent (Azure OpenAI)', cost: '$0.12/brief', volume: '~2,400/week', note: '3-minute briefing generated automatically 2hr before meeting' },
        { task: 'Portfolio narrative (quarterly report)', recommended: 'AI-generated, advisor reviews', cost: '$0.45/report', volume: '~2,400/quarter', note: 'Advisor approves in 90 seconds — not 4 hours' },
        { task: 'Churn alert triage', recommended: 'AI flags, advisor acts', cost: '$0/alert', volume: '~30 alerts/week', note: 'Model surfaces top 30 at-risk clients weekly — advisor decides intervention' },
        { task: 'Complex estate planning analysis', recommended: 'Human (advisor)', cost: '$N/A', volume: 'Case by case', note: 'AI provides data package; judgment stays with advisor' },
      ],
    },
    businessCase: {
      investment: [
        { phase: 'Phase 1 (weeks 1-6)', amount: 480000, type: 'Golden record & data layer' },
        { phase: 'Phase 2 (weeks 7-14)', amount: 1400000, type: 'Einstein activation & pilot' },
        { phase: 'Phase 3 (weeks 15-20)', amount: 1300000, type: 'Full rollout' },
      ],
      totalInvestment: 3180000,
      valueCapture: [
        { source: 'Advisor productivity (64% → 40% admin time)', year1: 24000000, steady: 42000000 },
        { source: 'AUM churn reduction (13% → 9%)', year1: 8400000, steady: 18000000 },
        { source: 'New AUM from prospect intelligence', year1: 6000000, steady: 22000000 },
        { source: 'C/I ratio improvement (contribution)', year1: 4200000, steady: 12000000 },
      ],
      totalYear1Value: 42600000,
      totalSteadyValue: 94000000,
      paybackMonths: 4.2,
      roi: 29.6,
      abarvaFee: {
        platform: 500000,
        outcomeFee: 6390000,
        total: 6890000,
        note: '15% of Year 1 realized savings — paid quarterly as advisor productivity and churn improvement are verified against Day 0 baseline',
      },
    },
    governance: {
      kpis: [
        { metric: 'Advisor time on client relationship work', baseline: '36%', target: '60%', frequency: 'Monthly', owner: 'COO / Head of Advisor Experience' },
        { metric: 'Meeting prep time per client', baseline: '45 min', target: '< 10 min', frequency: 'Weekly', owner: 'COO' },
        { metric: 'Client churn rate (AUM)', baseline: '13%/yr', target: '< 9%/yr', frequency: 'Quarterly', owner: 'CEO / Head of Wealth' },
        { metric: 'Einstein adoption rate (advisors)', baseline: '0%', target: '> 85% active users', frequency: 'Monthly', owner: 'CTO / Change Management' },
        { metric: 'New AUM from AI-identified prospects', baseline: '$0', target: '$120M/yr', frequency: 'Quarterly', owner: 'Head of Business Development' },
      ],
      risks: [
        { risk: 'Advisor adoption resistance (technology change)', probability: 'High', impact: 'High', mitigation: 'Pilot with the 10 most tech-forward advisors first. Build advocacy group. Adoption tracks against compensation KPIs for senior advisors.' },
        { risk: 'CTO resistance — "90 days away" narrative disrupted', probability: 'High', impact: 'Medium', mitigation: 'Frame as "activating existing contracts" not "new AI deployment." CTO owns the Einstein activation — credit, not disruption.' },
        { risk: 'Data quality in Advent (3-day lag)', probability: 'Medium', impact: 'Medium', mitigation: 'Golden record build eliminates lag in Phase 1. Pilot advisors use Bloomberg-only briefings until Advent is connected.' },
        { risk: 'Compliance pushback on AI recommendations', probability: 'Medium', impact: 'High', mitigation: 'All AI content flagged "for advisor review" — not client-facing. CCO co-designs guardrails in Phase 1 alongside compliance surveillance deployment.' },
      ],
      nextSteps: [
        { action: 'Audit Salesforce Einstein contract — activation scope and terms', owner: 'CTO + Legal', deadline: 'This week', rationale: 'Confirms what is already contracted vs what requires new spend' },
        { action: 'Commission Azure data engineer (Avanade)', owner: 'CTO + AbarVa', deadline: 'This week', rationale: 'Golden record is critical path — 6-week build starts now' },
        { action: 'Identify 10 pilot advisors', owner: 'COO + Head of Wealth', deadline: 'This week', rationale: 'Pilot group must be credible internally — success converts the skeptics' },
        { action: 'Brief CFO on business case and AbarVa fee structure', owner: 'CEO + AbarVa', deadline: 'Next week', rationale: '$3.2M investment against $42M Year 1 value — straightforward approval' },
        { action: 'Initiate Salesforce renegotiation', owner: 'CTO + AbarVa', deadline: 'This month', rationale: 'AbarVa benchmarking shows $1.2M savings vs list price — requires dedicated negotiation' },
      ],
    },
  },

  apexretail: {
    client: 'Apex Retail Group',
    industry: 'Omnichannel Retail · 380 Stores · $2.8B Revenue',
    initiative: 'AI Demand Forecasting & Inventory Intelligence',
    domain: 'Middle Office · Merchandising, Demand Planning & Supply Chain',
    preparedBy: 'AbarVa Intelligence Platform',
    date: 'April 2026',
    color: '#F59E0B',
    executiveSummary: {
      headline: '$180M in annual markdowns and $42M in stockout losses are both traceable to a statistical forecasting system that is 61% accurate at the SKU level. AI forecasting achieves 86% SKU-level accuracy — using data Apex already has.',
      bullets: [
        'Current state: category-level forecast is 82% accurate — but SKU-store-week accuracy is 61%. The 21-point gap produces $180M in markdowns and 3 major stockout events annually.',
        'The solution: ML demand forecasting model trained on 7 years of Apex POS data, integrated with weather, local events, and competitor pricing. SKU-store-week accuracy to 86%.',
        'The business case: $62M from markdown reduction + $24M from inventory efficiency = $86M steady-state value against $5.8M investment. 4.1-month payback.',
        'The timeline urgency: Q4 2026 holiday season is the highest-stakes demand window. Production deployment needed 6 months before — start by Q2 2026.',
        'Critical dependency: Teradata end-of-life creates a data infrastructure deadline. The forecasting AI migration and Teradata replacement must be sequenced — AbarVa has designed the combined roadmap.',
      ],
      decision: 'The board needs one decision: approve the $5.8M demand forecasting AI program this quarter. Delay costs $45M/quarter in continuing markdown losses, and the Teradata end-of-life creates a hard deadline that makes delay more expensive, not less.',
    },
    problemStatement: {
      current: [
        { metric: 'SKU-level forecast accuracy', current: '61%', target: '86%', gap: '25 percentage points', dollarImpact: '$180M annual markdowns' },
        { metric: 'Annual markdown cost', current: '$180M', target: '< $128M', gap: '$52M recoverable', dollarImpact: '$52M gross margin improvement' },
        { metric: 'Inventory turnover', current: '3.8×/year', target: '5.0×/year', gap: '1.2× below benchmark', dollarImpact: '$24M inventory carrying cost' },
        { metric: 'Stockout events (2025)', current: '3 events', target: '0–1 events', gap: '$42M in lost sales', dollarImpact: '$42M in 2025 alone' },
        { metric: 'Clearance recovery rate', current: '34% of original retail', target: '51%', gap: '17 points', dollarImpact: '$22M on current clearance volume' },
      ],
      rootCause: "The statistical forecasting model measures accuracy at the category level — the level at which the merchandising team reports performance. SKU-store-week accuracy, which actually drives replenishment decisions, is 61% — 21 points lower. This gap is structurally invisible to the organization because KPIs are designed around the misleading category metric. The result: buyers make replenishment decisions on bad data, inventory accumulates in the wrong SKUs, and markdowns are the only tool to clear the overstock. The $180M markdown cost is not a one-time problem — it is the steady-state cost of a measurement system designed to hide the forecast error.",
      urgencyTitle: 'Infrastructure Deadline — Teradata End-of-Life & Holiday Season Window',
      urgency: "Teradata's end-of-life notice creates a hard data infrastructure deadline: the platform that currently houses Apex's 7-year POS history must be migrated by Q4 2026 or Apex faces data loss and license cost escalation. AbarVa has matched this as Genome failure pattern F003 (platform end-of-life unplanned — 82% budget overrun rate). The AI forecasting migration and Teradata replacement must be sequenced together — doing them separately adds $4.2M and 8 months. Additionally, Q4 2026 is the highest-stakes demand window: holiday season. To have the AI model in production and validated before Q4, the program must start immediately. A 90-day delay pushes production live-date past the holiday window, forfeiting the single largest SKU accuracy payoff of the year.",
    },
    solutionDesign: {
      approach: "Train a gradient boosting ML model on Apex's 7 years of SKU-store-week POS data, augmented with weather, local events, social trend signals, and competitor pricing. Deploy on Azure Databricks (replacing Teradata), integrated with the existing JDA replenishment system for automated par-level adjustment. The Teradata migration and AI model build run concurrently — 4-month total timeline to production on the first 80 stores.",
      architecture: [
        { layer: 'Data Layer', component: 'Azure Databricks Medallion', description: 'Bronze/Silver/Gold data lake architecture replaces Teradata. Ingests POS, WMS, weather, social, and competitive feeds in real time. Eliminates 3-day batch latency.', technology: 'Azure Databricks on Apex Azure tenant — already contracted for data modernization' },
        { layer: 'AI/ML Layer', component: 'Demand Forecasting Model', description: 'LightGBM gradient boosting model trained on 7 years of SKU-store-week history. Incorporates external signals (weather, events, trends). Retrained weekly on latest POS actuals.', technology: 'Azure ML + MLflow — model registry and drift monitoring included' },
        { layer: 'Integration Layer', component: 'JDA Replenishment Connector', description: 'Forecasts pushed to JDA (Blue Yonder) replenishment engine automatically. Par levels updated daily. Purchase orders within defined parameters require no buyer approval.', technology: 'JDA REST API — existing integration, configuration only' },
        { layer: 'Analytics Layer', component: 'Forecast Accuracy Dashboard', description: 'Real-time accuracy tracking at SKU-store-week level. Variance alerts to buyers when model confidence is below threshold. Bias detection and model performance monitoring.', technology: 'Power BI on Azure — Apex already licensed' },
        { layer: 'Clearance Layer', component: 'Markdown Optimization Engine', description: 'Calculates optimal clearance price by SKU-store based on sell-through velocity, time to season end, and price elasticity. Eliminates calendar-driven blanket markdowns.', technology: 'Python optimization layer on Azure ML — 6-week build' },
      ],
      dataRequirements: [
        { data: '7-year POS history (SKU-store-week)', status: 'Available', completeness: '96%', note: 'In Teradata today. Migration to Databricks is Phase 1 — data quality is high, 4% gap from store format changes.' },
        { data: 'WMS inventory positions (real-time)', status: 'Available', completeness: '92%', note: 'JDA WMS feeds available. 12 distribution centres connected; 8 satellite DCs require WMS agent.' },
        { data: 'Weather API (store-level, hourly)', status: 'Vendor-provided', completeness: '100%', note: 'Tomorrow.io weather API — $28K/year license. Critical for apparel seasonal accuracy.' },
        { data: 'Social trend signals (by SKU category)', status: 'Available', completeness: '78%', note: 'Google Trends + Meta signals available by category. SKU-level mapping requires 3-week merchandising team effort.' },
        { data: 'Competitor pricing (key SKUs)', status: 'Partial', completeness: '55%', note: 'Competitor price scraping for top 2,000 SKUs. Expand to 8,000 SKUs in Phase 2.' },
      ],
    },
    vendorDecision: {
      headline: 'AbarVa recommends Azure Databricks + custom LightGBM model over o9 Solutions or Blue Yonder AI add-on.',
      recommendation: 'Azure Databricks + LightGBM (build on existing platform)',
      reasoning: [
        'Apex already has Azure Databricks contracted for the Teradata migration. Building the forecasting AI on Databricks means zero new vendor relationship — the forecasting build and infrastructure migration happen simultaneously, saving $4.2M and 8 months.',
        'o9 Solutions is the market leader for AI demand planning at enterprise retail — but Apex does not have the data maturity for the full o9 deployment. o9 requires a 12-month data foundation build before the AI model is useful. That misses Q4 2026.',
        'Blue Yonder AI add-on requires upgrading the existing JDA license from version 8.4 to 9.1 — a $3.8M upgrade fee that was not in the business case and a 9-month migration. The Databricks approach uses the existing JDA API.',
        'Custom LightGBM model trained on Apex data will outperform a generalist vendor model for Apex-specific demand patterns (seasonal fashion, loyalty program signals, regional store format variation).',
        'AbarVa benchmarking: Target Corporation built equivalent capability on Databricks in 14 weeks at $4.2M in 2024. Dollar Tree built equivalent in 18 weeks at $5.1M. Apex should target 16 weeks at $5.4M.',
      ],
      vendorComparison: [
        { vendor: 'Azure Databricks + custom model', klas: 'N/A', cost: '$5.4-5.8M', timeline: '16 weeks', epicFit: 'Native to existing Azure + JDA', aiCapability: 'Best for Apex data patterns', recommendation: true },
        { vendor: 'o9 Solutions', klas: '4.2/5', cost: '$8.0-12.0M', timeline: '14-18 months', epicFit: 'Requires 12-month data foundation', aiCapability: 'Best-in-class but needs data maturity', recommendation: false },
        { vendor: 'Blue Yonder AI (JDA upgrade)', klas: '3.9/5', cost: '$7.2-9.0M', timeline: '9-12 months', epicFit: 'Requires JDA 9.1 upgrade ($3.8M)', aiCapability: 'Good for standard retail patterns', recommendation: false },
      ],
      negotiationPlaybook: [
        'Open with the Databricks team: "We are running a competitive build vs. buy analysis. We have o9 in the room next week. What can you commit on time-to-production for the demand forecasting use case?"',
        'Anchor to benchmarks: "Target built this on Databricks in 14 weeks at $4.2M. We have comparable data maturity and volume. Our target is $4.8M — including the Teradata migration work."',
        'Bundle the Teradata migration with the AI build: Databricks has strong incentive to win the full data platform replacement, not just the AI workload. Use the migration work to negotiate the AI build at near-cost.',
        'Demand dedicated retail industry specialist: Do not accept a generalist ML team. Require a PM and data scientist with prior retail demand forecasting deployments.',
        'Walk away: If Databricks cannot commit to a 16-week production timeline with fixed fee, the build is better handled with a boutique ML firm (Fractal Analytics or Mu Sigma) on Azure at lower cost.',
      ],
    },
    resourceModel: {
      headline: 'This initiative requires 1 AbarVa Maestro, 1 Databricks data engineering team, and 0.5 FTE internal data scientist. No large SI required.',
      phases: [
        {
          phase: 'Phase 1', name: 'Data Migration & Foundation', duration: 'Weeks 1-6', cost: '$1.2M',
          resources: [
            { role: 'AbarVa Maestro', type: 'AbarVa', allocation: '60%', cost: 'Included in platform fee', responsibility: 'Architecture design, vendor coordination, data quality assessment' },
            { role: 'Databricks Data Engineer (2)', type: 'Vendor', allocation: '100%', cost: 'Included in Databricks contract', responsibility: 'Teradata-to-Databricks migration, POS data pipeline, Medallion architecture' },
            { role: 'Apex Data Architect', type: 'Internal', allocation: '80%', cost: '$0 incremental', responsibility: 'Source system access, data governance, WMS integration' },
            { role: 'JDA Administrator', type: 'Internal', allocation: '30%', cost: '$0 incremental', responsibility: 'JDA API configuration for replenishment integration' },
          ],
        },
        {
          phase: 'Phase 2', name: 'Model Build & Pilot (80 stores)', duration: 'Weeks 7-14', cost: '$2.8M',
          resources: [
            { role: 'ML Engineer (Fractal Analytics, 2)', type: 'SI', allocation: '100%', cost: '$520K (8 weeks × 2 FTE)', responsibility: 'LightGBM model build, feature engineering, Azure ML deployment' },
            { role: 'Databricks Solutions Architect', type: 'Vendor', allocation: '100%', cost: 'Included', responsibility: 'MLflow model registry, monitoring, drift detection setup' },
            { role: 'Apex Data Scientist', type: 'Internal', allocation: '100%', cost: '$0 incremental', responsibility: 'Model validation, accuracy testing, buyer feedback loop' },
            { role: 'AbarVa Maestro', type: 'AbarVa', allocation: '40%', cost: 'Included', responsibility: 'Pilot governance, accuracy baseline measurement, stakeholder reporting' },
          ],
        },
        {
          phase: 'Phase 3', name: 'Full Rollout (380 stores)', duration: 'Weeks 15-20', cost: '$1.8M',
          resources: [
            { role: 'Fractal Analytics ML Engineer', type: 'SI', allocation: '60%', cost: '$180K (6 weeks)', responsibility: 'Store format model variants, markdown optimization layer build' },
            { role: 'Apex Replenishment Team', type: 'Internal', allocation: '100%', cost: '$0 incremental', responsibility: 'JDA integration testing, buyer training, exception handling' },
            { role: 'AbarVa Maestro', type: 'AbarVa', allocation: '20%', cost: 'Included', responsibility: 'Full-scale outcome measurement, $52M markdown reduction tracking, fee calculation' },
          ],
        },
      ],
      agentVsHuman: [
        { task: 'Standard replenishment orders (model confidence > 85%)', recommended: 'Agent (Azure ML + JDA)', cost: '$0.04/order', volume: '~18,000 POs/week', note: 'Fully automated within defined parameters — 85% of all orders' },
        { task: 'High-value replenishment (>$50K order, confidence 70-85%)', recommended: 'AI recommendation + buyer approval', cost: '$0.20/order', volume: '~800 POs/week', note: 'Buyer reviews AI brief, approves in 2 min vs 45 min' },
        { task: 'Markdown price setting (model confidence > 80%)', recommended: 'Agent (markdown engine)', cost: '$0.02/SKU', volume: '~12,000 SKUs/week', note: 'Replaces blanket calendar-driven markdown — captures $22M/yr' },
        { task: 'Strategic category decisions (new brand, seasonal open)', recommended: 'Human (merchant team)', cost: 'N/A', volume: 'Case by case', note: 'AI provides demand simulation; merchant judgment drives final call' },
      ],
    },
    businessCase: {
      investment: [
        { phase: 'Phase 1 (weeks 1-6)', amount: 1200000, type: 'Data migration & foundation' },
        { phase: 'Phase 2 (weeks 7-14)', amount: 2800000, type: 'Model build & pilot' },
        { phase: 'Phase 3 (weeks 15-20)', amount: 1800000, type: 'Full rollout' },
      ],
      totalInvestment: 5800000,
      valueCapture: [
        { source: 'Markdown reduction (61% → 86% SKU accuracy)', year1: 32000000, steady: 52000000 },
        { source: 'Inventory carrying cost (turnover 3.8× → 5.0×)', year1: 14000000, steady: 24000000 },
        { source: 'Clearance recovery improvement (34% → 51%)', year1: 10000000, steady: 22000000 },
        { source: 'Stockout revenue recovery', year1: 18000000, steady: 28000000 },
      ],
      totalYear1Value: 74000000,
      totalSteadyValue: 126000000,
      paybackMonths: 4.1,
      roi: 21.7,
      abarvaFee: {
        platform: 500000,
        outcomeFee: 11100000,
        total: 11600000,
        note: '15% of Year 1 realized savings — paid quarterly as markdown reduction and inventory improvement are verified against Day 0 baseline via Apex POS actuals',
      },
    },
    governance: {
      kpis: [
        { metric: 'SKU-store-week forecast accuracy', baseline: '61%', target: '> 86%', frequency: 'Weekly', owner: 'Chief Merchandising Officer' },
        { metric: 'Annual markdown cost', baseline: '$180M', target: '< $128M', frequency: 'Monthly', owner: 'CFO' },
        { metric: 'Inventory turnover', baseline: '3.8×', target: '5.0×', frequency: 'Quarterly', owner: 'COO / SVP Supply Chain' },
        { metric: 'AI model accuracy drift', baseline: 'N/A', target: '< 3-point monthly drift', frequency: 'Weekly', owner: 'Data Science team' },
        { metric: 'Automated replenishment rate', baseline: '0%', target: '> 85%', frequency: 'Monthly', owner: 'SVP Supply Chain' },
      ],
      risks: [
        { risk: 'Buyer resistance to automated replenishment', probability: 'High', impact: 'High', mitigation: 'Phase 2 pilot keeps buyer in approval loop for all orders. Automation gates unlock only when accuracy exceeds 84% for 4 consecutive weeks. Buyers become model reviewers, not order placers.' },
        { risk: 'Teradata data quality issues surfaced during migration', probability: 'Medium', impact: 'High', mitigation: 'AbarVa data quality assessment in Week 1 identifies gaps before the model build starts. Worst case: Phase 1 extended 3 weeks — not a project-stopper.' },
        { risk: 'Holiday season timing pressure causes shortcuts', probability: 'Medium', impact: 'High', mitigation: 'Fixed go-live date is Week 16. If Phase 2 slips, rollout scope is reduced to top 150 stores for Q4 — Q4 holiday coverage still achieved with partial deployment.' },
        { risk: 'JDA version incompatibility with new forecasts', probability: 'Low', impact: 'Medium', mitigation: 'API compatibility confirmed in Week 1 tech assessment. JDA REST API on version 8.4 supports the integration without upgrade.' },
      ],
      nextSteps: [
        { action: 'Commission Databricks data quality assessment of Teradata POS', owner: 'CTO + AbarVa', deadline: 'This week', rationale: 'Data quality determines model training timeline — must be known before committing to schedule' },
        { action: 'Align Q4 2026 go-live deadline with CMO and CFO', owner: 'CEO + AbarVa', deadline: 'This week', rationale: 'Q4 holiday season is the ROI inflection point — must be board-level commitment' },
        { action: 'Issue competitive brief to Databricks vs o9 Solutions', owner: 'CTO + AbarVa', deadline: 'This week', rationale: 'Competitive tension required for Databricks pricing to reach the Target Corp benchmark' },
        { action: 'Initiate Teradata end-of-life formal notice', owner: 'CTO + Legal', deadline: 'This month', rationale: 'Formalizing the exit triggers Teradata negotiation on license wind-down cost — AbarVa benchmarks suggest 40% reduction is achievable' },
        { action: 'Brief CFO on business case', owner: 'CMO + AbarVa', deadline: 'Next week', rationale: '$5.8M against $74M Year 1 value — straightforward CFO approval once presented cleanly' },
      ],
    },
  },
}

function fmt(n: number) {
  if (n >= 1e9) return '$' + (n/1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n/1e3).toFixed(0) + 'K'
  return '$' + n.toLocaleString()
}

const SECTIONS = [
  { id: 'summary', label: 'Executive Summary' },
  { id: 'problem', label: 'Problem Statement' },
  { id: 'solution', label: 'Solution Design' },
  { id: 'vendor', label: 'Vendor Decision' },
  { id: 'resources', label: 'Resource Model' },
  { id: 'business', label: 'Business Case' },
  { id: 'governance', label: 'Governance' },
]

function BlueprintContent() {
  const searchParams = useSearchParams()
  const clientId = useActiveClient()
  const [section, setSection] = useState('summary')
  const bp = BLUEPRINTS[clientId] || BLUEPRINTS.meridian

  useEffect(() => { document.title = 'Blueprint — ' + bp.client + ' | AbarVa' }, [bp.client])

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; }
    .tag { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
    .h1 { font-size: 32px; font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; color: #0C0C0C; margin-bottom: 12px; }
    .h2 { font-size: 20px; font-weight: 800; color: #0C0C0C; margin-bottom: 12px; letter-spacing: -0.01em; }
    .h3 { font-size: 14px; font-weight: 700; color: #3C3C3C; margin-bottom: 8px; }
    .body { font-size: 14px; line-height: 1.75; color: #888888; }
    .card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .section-nav { background: none; border: none; cursor: pointer; font-size: 13px; padding: 10px 16px; border-radius: 6px; width: 100%; text-align: left; font-family: inherit; transition: all 0.12s; color: #6B7280; }
    .section-nav.active { background: #F3F4F6; color: #0C0C0C; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6B7280; background: #F9FAFB; border-bottom: 2px solid #E5E7EB; }
    td { padding: 12px 14px; border-bottom: 1px solid #F3F4F6; color: #3C3C3C; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #FAFAFA; }
    .badge { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 8px; border-radius: 100px; }
    .risk-high { background: #FEF2F2; color: #DC2626; }
    .risk-med { background: #FFFBEB; color: #D97706; }
    .risk-low { background: #ECFDF5; color: #059669; }
  `

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif" }}>
      <style>{css}</style>

      <AbarvaNav />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', maxWidth: '1480px', margin: '0 auto', padding: '0 24px' }}>

        {/* SIDEBAR */}
        <div style={{ padding: '32px 16px 32px 0', position: 'sticky' as const, top: '56px', height: 'calc(100vh - 56px)', overflowY: 'auto' as const }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888888', marginBottom: '4px' }}>Initiative</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0C0C0C', lineHeight: 1.4 }}>{bp.initiative}</div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888888', marginBottom: '4px' }}>Domain</div>
            <div style={{ fontSize: '13px', color: '#3C3C3C' }}>{bp.domain}</div>
          </div>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888888', marginBottom: '4px' }}>Investment</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0C0C0C', letterSpacing: '-0.02em' }}>{fmt(bp.businessCase.totalInvestment)}</div>
          </div>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888888', marginBottom: '4px' }}>Annual Value</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em' }}>{fmt(bp.businessCase.totalSteadyValue)}</div>
          </div>
          <div style={{ height: '1px', background: '#E5E7EB', marginBottom: '20px' }} />
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={'section-nav' + (section === s.id ? ' active' : '')}>
              {section === s.id && <span style={{ color: bp.color, marginRight: '6px' }}>›</span>}
              {s.label}
            </button>
          ))}
          <div style={{ height: '1px', background: '#E5E7EB', margin: '20px 0' }} />
          <div style={{ fontSize: '11px', color: '#888888', lineHeight: 1.6 }}>
            Prepared by {bp.preparedBy}<br />{bp.date}
          </div>
        </div>

        {/* MAIN */}
        <div style={{ padding: '32px 0 64px 32px', borderLeft: '1px solid #E5E7EB' }}>

          {/* HEADER */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
              <span className="badge" style={{ background: bp.color + '15', color: bp.color }}>{bp.domain}</span>
              <span className="badge" style={{ background: '#F3F4F6', color: '#3C3C3C' }}>{bp.client}</span>
              <span className="badge" style={{ background: '#ECFDF5', color: '#059669' }}>Solution Blueprint</span>
            </div>
            <h1 className="h1">{bp.initiative}</h1>
            <p className="body" style={{ maxWidth: '680px' }}>{bp.executiveSummary.headline}</p>
          </div>

          {/* EXECUTIVE SUMMARY */}
          {section === 'summary' && (
            <div>
              <div className="card" style={{ borderLeft: '4px solid ' + bp.color }}>
                <h2 className="h2">Executive Summary</h2>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '20px' }}>
                  {bp.executiveSummary.bullets.map((b: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ color: bp.color, fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>0{i+1}</span>
                      <span className="body">{b}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '16px 20px', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FEF3C7' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#D97706', display: 'block', marginBottom: '6px' }}>Decision Required This Week</span>
                  <span className="body" style={{ fontWeight: 600, color: '#3C3C3C' }}>{bp.executiveSummary.decision}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#E5E7EB', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                {[
                  { label: 'Total Investment', value: fmt(bp.businessCase.totalInvestment), color: bp.color },
                  { label: 'Annual Value', value: fmt(bp.businessCase.totalSteadyValue), color: '#059669' },
                  { label: 'ROI', value: bp.businessCase.roi + 'x', color: '#6D28D9' },
                  { label: 'Payback', value: bp.businessCase.paybackMonths + ' months', color: '#D97706' },
                ].map((m, i) => (
                  <div key={i} style={{ background: '#fff', padding: '20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: m.color, marginBottom: '6px' }}>{m.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0C0C0C', letterSpacing: '-0.02em' }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ background: '#F0FDF4', border: '1px solid #A7F3D0' }}>
                <h3 className="h3" style={{ color: '#059669', marginBottom: '12px' }}>AbarVa Economics on This Initiative</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div><div style={{ fontSize: '11px', color: '#3C3C3C', marginBottom: '4px' }}>Platform fee</div><div style={{ fontSize: '18px', fontWeight: 800, color: '#0C0C0C' }}>{fmt(bp.businessCase.abarvaFee.platform)}</div></div>
                  <div><div style={{ fontSize: '11px', color: '#3C3C3C', marginBottom: '4px' }}>Outcome fee (15%)</div><div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>{fmt(bp.businessCase.abarvaFee.outcomeFee)}</div></div>
                  <div><div style={{ fontSize: '11px', color: '#3C3C3C', marginBottom: '4px' }}>Total Year 1</div><div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>{fmt(bp.businessCase.abarvaFee.total)}</div></div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#3C3C3C', fontStyle: 'italic' }}>{bp.businessCase.abarvaFee.note}</div>
              </div>
            </div>
          )}

          {/* PROBLEM STATEMENT */}
          {section === 'problem' && (
            <div>
              <h2 className="h2">Problem Statement</h2>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Current State vs Target State</h3>
                <table>
                  <thead><tr><th>Metric</th><th>Current</th><th>Target</th><th>Gap</th><th>Dollar Impact</th></tr></thead>
                  <tbody>
                    {bp.problemStatement.current.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{row.metric}</td>
                        <td style={{ color: '#DC2626', fontWeight: 600 }}>{row.current}</td>
                        <td style={{ color: '#059669', fontWeight: 600 }}>{row.target}</td>
                        <td style={{ color: '#D97706' }}>{row.gap}</td>
                        <td style={{ fontWeight: 600 }}>{row.dollarImpact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card" style={{ background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: '16px' }}>
                <h3 className="h3" style={{ color: '#DC2626' }}>Root Cause Analysis</h3>
                <p className="body">{bp.problemStatement.rootCause}</p>
              </div>
              <div className="card" style={{ background: '#FFFBEB', border: '1px solid #FEF3C7' }}>
                <h3 className="h3" style={{ color: '#D97706' }}>{bp.problemStatement.urgencyTitle ?? 'Regulatory Deadline — CMS Compliance'}</h3>
                <p className="body">{bp.problemStatement.urgency ?? bp.problemStatement.cmsDeadline}</p>
              </div>
            </div>
          )}

          {/* SOLUTION DESIGN */}
          {section === 'solution' && (
            <div>
              <h2 className="h2">Solution Design</h2>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Approach</h3>
                <p className="body">{bp.solutionDesign.approach}</p>
              </div>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Architecture Layers</h3>
                <table>
                  <thead><tr><th>Layer</th><th>Component</th><th>Description</th><th>Technology</th></tr></thead>
                  <tbody>
                    {bp.solutionDesign.architecture.map((row: any, i: number) => (
                      <tr key={i}>
                        <td><span className="badge" style={{ background: bp.color + '15', color: bp.color }}>{row.layer}</span></td>
                        <td style={{ fontWeight: 600 }}>{row.component}</td>
                        <td>{row.description}</td>
                        <td style={{ color: '#3C3C3C', fontSize: '12px' }}>{row.technology}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h3 className="h3">Data Requirements</h3>
                <table>
                  <thead><tr><th>Data Source</th><th>Status</th><th>Completeness</th><th>Notes</th></tr></thead>
                  <tbody>
                    {bp.solutionDesign.dataRequirements.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{row.data}</td>
                        <td><span className="badge" style={{ background: row.status === 'Available' ? '#ECFDF5' : '#EFF6FF', color: row.status === 'Available' ? '#059669' : '#1B4FD8' }}>{row.status}</span></td>
                        <td style={{ fontWeight: 700, color: parseInt(row.completeness) > 80 ? '#059669' : '#D97706' }}>{row.completeness}</td>
                        <td style={{ color: '#3C3C3C', fontSize: '12px' }}>{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VENDOR DECISION */}
          {section === 'vendor' && (
            <div>
              <h2 className="h2">Vendor Decision</h2>
              <div className="card" style={{ borderLeft: '4px solid ' + bp.color, marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: bp.color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '4px' }}>AbarVa Recommendation</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0C0C0C' }}>{bp.vendorDecision.recommendation}</div>
                  </div>
                  <span className="badge" style={{ background: '#ECFDF5', color: '#059669', fontSize: '12px', padding: '6px 14px' }}>RECOMMENDED</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                  {bp.vendorDecision.reasoning.map((r: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ color: bp.color, fontWeight: 800, flexShrink: 0 }}>→</span>
                      <span className="body">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Vendor Comparison</h3>
                <table>
                  <thead><tr><th>Vendor</th><th>KLAS</th><th>Cost</th><th>Timeline</th><th>Epic Fit</th><th>AI Capability</th><th></th></tr></thead>
                  <tbody>
                    {bp.vendorDecision.vendorComparison.map((v: any, i: number) => (
                      <tr key={i} style={{ background: v.recommendation ? bp.color + '08' : undefined }}>
                        <td style={{ fontWeight: v.recommendation ? 800 : 600 }}>{v.vendor}</td>
                        <td style={{ fontWeight: 600, color: '#059669' }}>{v.klas}</td>
                        <td style={{ fontWeight: 600 }}>{v.cost}</td>
                        <td>{v.timeline}</td>
                        <td>{v.epicFit}</td>
                        <td>{v.aiCapability}</td>
                        <td>{v.recommendation && <span className="badge" style={{ background: bp.color, color: '#fff' }}>Pick</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card" style={{ background: '#1B4FD808', border: '1px solid ' + bp.color + '30' }}>
                <h3 className="h3">Negotiation Playbook — Specific to {bp.client}</h3>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                  {bp.vendorDecision.negotiationPlaybook.map((tip: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '12px 16px', background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                      <span style={{ color: '#D97706', fontWeight: 800, flexShrink: 0 }}>⚡</span>
                      <span className="body">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RESOURCE MODEL */}
          {section === 'resources' && (
            <div>
              <h2 className="h2">Resource Model</h2>
              <div className="card" style={{ marginBottom: '16px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <p className="body" style={{ fontWeight: 600, color: '#3C3C3C' }}>{bp.resourceModel.headline}</p>
              </div>
              {bp.resourceModel.phases.map((phase: any, pi: number) => (
                <div key={pi} className="card" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <span className="badge" style={{ background: bp.color, color: '#fff', marginRight: '8px' }}>{phase.phase}</span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#0C0C0C' }}>{phase.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0C0C0C' }}>{fmt(phase.cost)}</div>
                      <div style={{ fontSize: '12px', color: '#888888' }}>{phase.duration}</div>
                    </div>
                  </div>
                  <table>
                    <thead><tr><th>Role</th><th>Type</th><th>Allocation</th><th>Cost</th><th>Responsibility</th></tr></thead>
                    <tbody>
                      {phase.resources.map((r: any, ri: number) => (
                        <tr key={ri}>
                          <td style={{ fontWeight: 600 }}>{r.role}</td>
                          <td><span className="badge" style={{ background: r.type === 'AbarVa' ? '#EFF6FF' : r.type === 'Vendor' ? '#F5F3FF' : r.type === 'Internal' ? '#ECFDF5' : '#FEF2F2', color: r.type === 'AbarVa' ? '#1B4FD8' : r.type === 'Vendor' ? '#6D28D9' : r.type === 'Internal' ? '#059669' : '#DC2626' }}>{r.type}</span></td>
                          <td>{r.allocation}</td>
                          <td style={{ fontWeight: 600, color: r.cost === 'Included in platform fee' || r.cost === 'Included' || r.cost === '$0 incremental' ? '#059669' : '#0C0C0C' }}>{r.cost}</td>
                          <td style={{ color: '#3C3C3C', fontSize: '12px' }}>{r.responsibility}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <div style={{ marginBottom: '12px' }}>
                <a href={'/how-to-build?client=' + clientId} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '8px', background: '#0F172A', color: '#2DD4C8', textDecoration: 'none', fontSize: '13px', fontWeight: 600, border: '1px solid #1E293B' }}>View Full Build Plan →</a>
                <span style={{ marginLeft: '12px', fontSize: '12px', color: '#3C3C3C' }}>4-phase approach · cost comparison · agent decision matrix · outcome tracking</span>
              </div>
              <div className="card">
                <h3 className="h3">Agent vs Human Decision Matrix</h3>
                <table>
                  <thead><tr><th>Task</th><th>Recommended</th><th>Cost per Unit</th><th>Volume</th><th>Note</th></tr></thead>
                  <tbody>
                    {bp.resourceModel.agentVsHuman.map((row: any, i: number) => (
                      <tr key={i}>
                        <td>{row.task}</td>
                        <td style={{ fontWeight: 600, color: row.recommended.includes('Agent') ? '#1B4FD8' : '#3C3C3C' }}>{row.recommended}</td>
                        <td>{row.cost}</td>
                        <td>{row.volume}</td>
                        <td style={{ color: '#3C3C3C', fontSize: '12px' }}>{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BUSINESS CASE */}
          {section === 'business' && (
            <div>
              <h2 className="h2">Business Case</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#E5E7EB', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                {[
                  { label: 'Total Investment', value: fmt(bp.businessCase.totalInvestment), color: bp.color },
                  { label: 'Year 1 Value', value: fmt(bp.businessCase.totalYear1Value), color: '#059669' },
                  { label: 'Steady State Value', value: fmt(bp.businessCase.totalSteadyValue), color: '#059669' },
                  { label: 'Payback Period', value: bp.businessCase.paybackMonths + ' months', color: '#D97706' },
                ].map((m, i) => (
                  <div key={i} style={{ background: '#fff', padding: '20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: m.color, marginBottom: '6px' }}>{m.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0C0C0C', letterSpacing: '-0.02em' }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Investment Schedule</h3>
                <table>
                  <thead><tr><th>Phase</th><th>Investment</th><th>Type</th></tr></thead>
                  <tbody>
                    {bp.businessCase.investment.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{row.phase}</td>
                        <td style={{ fontWeight: 700, color: '#0C0C0C' }}>{fmt(row.amount)}</td>
                        <td style={{ color: '#3C3C3C' }}>{row.type}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#F9FAFB' }}>
                      <td style={{ fontWeight: 800 }}>Total</td>
                      <td style={{ fontWeight: 800, color: bp.color, fontSize: '16px' }}>{fmt(bp.businessCase.totalInvestment)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h3 className="h3">Value Capture by Source</h3>
                <table>
                  <thead><tr><th>Value Source</th><th>Year 1</th><th>Steady State (Annual)</th></tr></thead>
                  <tbody>
                    {bp.businessCase.valueCapture.map((row: any, i: number) => (
                      <tr key={i}>
                        <td>{row.source}</td>
                        <td style={{ fontWeight: 700, color: '#059669' }}>{fmt(row.year1)}</td>
                        <td style={{ fontWeight: 700, color: '#059669' }}>{fmt(row.steady)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#F0FDF4' }}>
                      <td style={{ fontWeight: 800 }}>Total</td>
                      <td style={{ fontWeight: 800, color: '#059669', fontSize: '16px' }}>{fmt(bp.businessCase.totalYear1Value)}</td>
                      <td style={{ fontWeight: 800, color: '#059669', fontSize: '16px' }}>{fmt(bp.businessCase.totalSteadyValue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* GOVERNANCE */}
          {section === 'governance' && (
            <div>
              <h2 className="h2">Governance and Next Steps</h2>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Success KPIs</h3>
                <table>
                  <thead><tr><th>Metric</th><th>Baseline</th><th>Target</th><th>Frequency</th><th>Owner</th></tr></thead>
                  <tbody>
                    {bp.governance.kpis.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{row.metric}</td>
                        <td style={{ color: '#DC2626', fontWeight: 600 }}>{row.baseline}</td>
                        <td style={{ color: '#059669', fontWeight: 600 }}>{row.target}</td>
                        <td>{row.frequency}</td>
                        <td style={{ color: '#3C3C3C' }}>{row.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Risk Register</h3>
                <table>
                  <thead><tr><th>Risk</th><th>Probability</th><th>Impact</th><th>Mitigation</th></tr></thead>
                  <tbody>
                    {bp.governance.risks.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{row.risk}</td>
                        <td><span className={'badge risk-' + (row.probability === 'High' ? 'high' : row.probability === 'Medium' ? 'med' : 'low')}>{row.probability}</span></td>
                        <td><span className={'badge risk-' + (row.impact === 'High' ? 'high' : row.impact === 'Medium' ? 'med' : 'low')}>{row.impact}</span></td>
                        <td style={{ color: '#3C3C3C', fontSize: '12px' }}>{row.mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card" style={{ background: '#0C0C0C' }}>
                <h3 className="h3" style={{ color: '#fff', marginBottom: '16px' }}>Actions Required This Week</h3>
                {bp.governance.nextSteps.map((step: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', padding: '14px 0', borderBottom: i < bp.governance.nextSteps.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', alignItems: 'flex-start' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6EE7B7', marginTop: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{step.action}</div>
                      <div style={{ fontSize: '12px', color: '#888888' }}>{step.owner} · {step.deadline}</div>
                      <div style={{ fontSize: '12px', color: '#3C3C3C', marginTop: '2px', fontStyle: 'italic' }}>{step.rationale}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function BlueprintPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#3C3C3C' }}>Loading blueprint...</div>}>
      <BlueprintContent />
    </Suspense>
  )
}

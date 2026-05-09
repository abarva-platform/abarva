import type { PatternDomain, PatternSeed } from './seed-types';

type CxoThemeKey =
  | 'ai-led-operations'
  | 'back-office-ai-automation'
  | 'contact-to-experience-transformation'
  | 'ambient-ai'
  | 'value-based-contracting'
  | 'it-reorg-under-ai-pressure';

interface CxoThemePatternInput {
  id: string;
  slug: string;
  title: string;
  domain: PatternDomain;
  vertical: string;
  thesis: string;
  applicability: string;
  confidence: number;
  instanceCount: number;
  theme: CxoThemeKey;
  evidenceAnchors: string[];
  failureModes: string[];
  worldviewLinkage: string;
  relatedPatternIds: string[];
}

const CXO_SOURCE_DOCUMENTS = [
  'docs/build/CXO_TALK_TRACK_2026-05-07.md',
  'docs/build/intelligence/ai-initiatives-package/BUSINESS_GOAL_LINKAGE.md',
  'docs/build/INTELLIGENCE_AUDIT_2026-05-06.md',
] as const;

function buildBody(input: CxoThemePatternInput): string {
  return `## Summary
${input.thesis}

## When to apply
${input.applicability}

## Evidence anchors
${input.evidenceAnchors.map((anchor) => `- ${anchor}`).join('\n')}

## Failure modes
${input.failureModes.map((mode) => `- ${mode}`).join('\n')}

## Worldview linkage
${input.worldviewLinkage}

## Instances
Use this pattern as CXO-demo corpus coverage for the ${input.theme} theme. It should ground Sentinel answers in named decision evidence instead of generic market commentary.`;
}

function pattern(input: CxoThemePatternInput): PatternSeed {
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    domain: input.domain,
    tier: 'validated',
    vertical: input.vertical,
    thesis: input.thesis,
    applicability: input.applicability,
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: input.confidence,
    createdFrom: 'deterministic_seed',
    createdBy: 'codex',
    createdAt: '2026-05-09',
    instanceCount: input.instanceCount,
    sourceDocuments: [...CXO_SOURCE_DOCUMENTS],
    regulatoryChips: [],
    relatedPatternIds: input.relatedPatternIds,
    derivedFromPatternIds: input.relatedPatternIds.slice(0, 2),
    taggedContradictionIds: [],
    body: buildBody(input),
  };
}

export const CXO_THEME_PATTERNS: PatternSeed[] = [
  pattern({
    id: 'PAT-CXO-AIOPS-001',
    slug: 'ai-led-operations-control-plane',
    title: 'AI-Led Operations Control Plane',
    domain: 'ai_programs',
    vertical: 'cross-industry',
    thesis:
      'AI-led operations only becomes executive-grade when operating signals, exception routing, and decision rights are composed into a control plane rather than scattered copilots.',
    applicability:
      'Apply when a CIO or COO is moving from AI pilots toward function-level operating visibility across service, supply chain, IT, finance, or store operations.',
    confidence: 0.82,
    instanceCount: 6,
    theme: 'ai-led-operations',
    evidenceAnchors: [
      'Named operating signals with owners, thresholds, and escalation paths.',
      'Workflow telemetry showing which exceptions can be resolved without new headcount.',
      'Decision-rights map that names what the AI can recommend, draft, or execute.',
    ],
    failureModes: [
      'Pilots optimize local tasks while executive operations still run through meetings and spreadsheets.',
      'Automation expands without an accountable exception owner.',
      'Dashboards describe activity but do not change routing, approval, or intervention behavior.',
    ],
    worldviewLinkage:
      'Worldview W3: AI advantage comes from re-architecting the operating system around signals and decisions, not from adding assistant features at the edge.',
    relatedPatternIds: ['PAT-AI-004', 'PAT-AI-010', 'PAT-ARCH-006'],
  }),
  pattern({
    id: 'PAT-CXO-AIOPS-002',
    slug: 'ai-operations-exception-portfolio',
    title: 'AI Operations Exception Portfolio',
    domain: 'ai_programs',
    vertical: 'cross-industry',
    thesis:
      'The scalable unit of AI operations is the exception portfolio: the recurring decisions where signal quality, latency, and ownership determine whether automation creates leverage.',
    applicability:
      'Apply when executives want to know which operational decisions should be automated, augmented, or left human-owned.',
    confidence: 0.8,
    instanceCount: 5,
    theme: 'ai-led-operations',
    evidenceAnchors: [
      'Top exception classes ranked by volume, cost, and cycle-time drag.',
      'Baseline resolution time and rework rate for each exception class.',
      'Named intervention path for auto-resolve, agent-assist, or executive escalation.',
    ],
    failureModes: [
      'Use cases are selected by enthusiasm rather than exception economics.',
      'Teams automate rare exceptions while high-volume work remains untouched.',
      'No kill criteria exist when exception rates fail to improve.',
    ],
    worldviewLinkage:
      'Worldview W2: AI portfolio management should concentrate investment where repeated decisions compound operational advantage.',
    relatedPatternIds: ['PAT-AI-004', 'PAT-AI-008', 'PAT-AI-010'],
  }),
  pattern({
    id: 'PAT-CXO-AIOPS-003',
    slug: 'ai-led-service-recovery-loop',
    title: 'AI-Led Service Recovery Loop',
    domain: 'ai_programs',
    vertical: 'retail',
    thesis:
      'AI-led operations becomes visible to customers when service recovery loops connect detection, root cause, next best action, and accountable follow-through.',
    applicability:
      'Apply when contact center, store, ecommerce, or field-service signals expose preventable customer friction but ownership is split across functions.',
    confidence: 0.78,
    instanceCount: 4,
    theme: 'ai-led-operations',
    evidenceAnchors: [
      'Customer friction taxonomy tied to operational root causes.',
      'Closed-loop evidence showing whether recommended actions resolved the issue.',
      'Store, service, or digital owner assigned to each recovery path.',
    ],
    failureModes: [
      'Sentiment detection is treated as the solution even though recovery work is not routed.',
      'Next-best-action models recommend actions that stores or agents cannot execute.',
      'Customer outcomes are not measured after the intervention.',
    ],
    worldviewLinkage:
      'Worldview W4: customer-facing AI is only strategic when it changes the underlying operating loop, not just the interaction script.',
    relatedPatternIds: ['PAT-IND-RET-002', 'PAT-AI-004', 'PAT-AI-010'],
  }),
  pattern({
    id: 'PAT-CXO-AIOPS-004',
    slug: 'ai-led-operations-value-ledger',
    title: 'AI-Led Operations Value Ledger',
    domain: 'ai_programs',
    vertical: 'cross-industry',
    thesis:
      'AI-led operations needs a value ledger that separates avoided work, faster cycle time, risk reduction, and revenue recovery so executives do not collapse all value into vague productivity.',
    applicability:
      'Apply when an AI operations initiative has executive attention but lacks a finance-ready attribution model.',
    confidence: 0.84,
    instanceCount: 7,
    theme: 'ai-led-operations',
    evidenceAnchors: [
      'Baseline operational volume, cost, and cycle-time evidence.',
      'Attribution method for each value line with confidence and evidence status.',
      'Decision cadence for moving projected value into realized value.',
    ],
    failureModes: [
      'Every benefit is counted as productivity without proving capacity release or avoided spend.',
      'Vendor benchmarks become the business case without tenant baseline evidence.',
      'Realized value is never reconciled after deployment.',
    ],
    worldviewLinkage:
      'Worldview W5: executive trust depends on evidence discipline around value, especially when AI claims outrun measurable operational change.',
    relatedPatternIds: ['PAT-AI-010', 'PAT-AI-004', 'PAT-AI-008'],
  }),
  pattern({
    id: 'PAT-CXO-BOAI-001',
    slug: 'back-office-ai-work-intake-redesign',
    title: 'Back-Office AI Work Intake Redesign',
    domain: 'ai_programs',
    vertical: 'cross-industry',
    thesis:
      'Back-office AI automation works when intake, triage, evidence capture, and exception handling are redesigned before task automation is scaled.',
    applicability:
      'Apply to finance, procurement, HR, legal, and shared-services processes where queues are large but work arrives with inconsistent evidence.',
    confidence: 0.81,
    instanceCount: 6,
    theme: 'back-office-ai-automation',
    evidenceAnchors: [
      'Queue taxonomy showing request type, volume, cycle time, and rework.',
      'Minimum evidence requirements for straight-through or assisted processing.',
      'Exception routing model by risk tier and approval authority.',
    ],
    failureModes: [
      'Automation is pointed at messy intake and amplifies rework.',
      'High-risk exceptions are hidden inside straight-through processing.',
      'The queue clears faster but downstream approvers still redo the work.',
    ],
    worldviewLinkage:
      'Worldview W3: automation advantage follows from changing the work system, not only applying a model to a task.',
    relatedPatternIds: ['PAT-AI-004', 'PAT-AI-002', 'PAT-AI-010'],
  }),
  pattern({
    id: 'PAT-CXO-BOAI-002',
    slug: 'finance-ai-close-controls',
    title: 'Finance AI Close Controls',
    domain: 'ai_programs',
    vertical: 'cross-industry',
    thesis:
      'Finance AI should first target reconciliation, variance explanation, and close evidence where control quality can improve alongside cycle-time reduction.',
    applicability:
      'Apply when CFOs want AI efficiency but cannot compromise auditability, segregation of duties, or variance evidence.',
    confidence: 0.79,
    instanceCount: 5,
    theme: 'back-office-ai-automation',
    evidenceAnchors: [
      'Close calendar bottlenecks by entity, account, and evidence dependency.',
      'Variance explanation quality scored before and after AI assistance.',
      'Control-owner approval trace for AI-drafted reconciliations or narratives.',
    ],
    failureModes: [
      'AI drafts explanations that are plausible but not control-grade.',
      'Efficiency is claimed without measuring reviewer rework.',
      'Finance uses AI outside the audit trail.',
    ],
    worldviewLinkage:
      'Worldview W5: trusted AI in the CFO lane requires traceable evidence and explicit confidence markings.',
    relatedPatternIds: ['PAT-AI-002', 'PAT-AI-010', 'PAT-SRC-CAT-ERP-001'],
  }),
  pattern({
    id: 'PAT-CXO-BOAI-003',
    slug: 'procurement-ai-commercial-evidence',
    title: 'Procurement AI Commercial Evidence',
    domain: 'sourcing',
    vertical: 'cross-industry',
    thesis:
      'Procurement AI creates leverage when it turns market, contract, pricing, and vendor-response evidence into comparable commercial decisions instead of faster document summaries.',
    applicability:
      'Apply when sourcing teams have many vendor artifacts but weak comparability across pricing, assumptions, service levels, and negotiation levers.',
    confidence: 0.83,
    instanceCount: 7,
    theme: 'back-office-ai-automation',
    evidenceAnchors: [
      'Normalized vendor pricing and assumptions by service tower or capability.',
      'Contract clause deltas tied to business risk and negotiation posture.',
      'Evidence citations behind each projected savings or avoided-risk line.',
    ],
    failureModes: [
      'AI summarizes proposals without detecting non-comparable assumptions.',
      'Negotiation recommendations are not tied to contract language or pricing math.',
      'Savings are labeled realized before award and implementation evidence exists.',
    ],
    worldviewLinkage:
      'Worldview W5: commercial AI must preserve the distinction between seeded, projected, and realized evidence.',
    relatedPatternIds: ['PAT-SRC-CAT-FINOPS-001', 'PAT-SRC-PRC-SAAS-001', 'PAT-AI-010'],
  }),
  pattern({
    id: 'PAT-CXO-BOAI-004',
    slug: 'back-office-ai-capacity-release',
    title: 'Back-Office AI Capacity Release',
    domain: 'ai_programs',
    vertical: 'cross-industry',
    thesis:
      'Back-office AI value is credible only when the organization names where released capacity will go: lower backlog, reduced overtime, redeployed specialists, or avoided hires.',
    applicability:
      'Apply when productivity claims are material to the business case but there is no operating plan for what changes after automation.',
    confidence: 0.82,
    instanceCount: 6,
    theme: 'back-office-ai-automation',
    evidenceAnchors: [
      'Baseline hours by work type and role.',
      'Target operating model showing capacity redeployment or expense avoidance.',
      'Post-launch measurement separating time saved from value captured.',
    ],
    failureModes: [
      'Hours saved are counted even when staffing, backlog, and service levels do not change.',
      'Teams redeploy capacity informally and lose attribution.',
      'Automation creates new review work that offsets the benefit.',
    ],
    worldviewLinkage:
      'Worldview W2: AI value must be connected to an investment and operating decision, not a disconnected efficiency estimate.',
    relatedPatternIds: ['PAT-AI-010', 'PAT-AI-004', 'PAT-AI-008'],
  }),
  pattern({
    id: 'PAT-CXO-CX-001',
    slug: 'contact-to-experience-operating-model',
    title: 'Contact-to-Experience Operating Model',
    domain: 'ai_programs',
    vertical: 'retail',
    thesis:
      'Contact center transformation becomes experience transformation only when contact reasons are tied to upstream product, store, fulfillment, and policy fixes.',
    applicability:
      'Apply when executives want Contact Center AI to improve customer experience rather than only reduce handle time.',
    confidence: 0.83,
    instanceCount: 6,
    theme: 'contact-to-experience-transformation',
    evidenceAnchors: [
      'Contact reason taxonomy mapped to upstream owning function.',
      'Cost and experience impact by contact reason.',
      'Closed-loop action tracker for product, store, fulfillment, or policy fixes.',
    ],
    failureModes: [
      'The AI platform deflects contacts while root causes remain untouched.',
      'Experience metrics improve in the contact center but degrade elsewhere.',
      'Upstream owners are not accountable for recurring contact drivers.',
    ],
    worldviewLinkage:
      'Worldview W4: CX AI should change the enterprise response system, not just the channel interaction.',
    relatedPatternIds: ['PAT-AI-004', 'PAT-AI-008', 'PAT-AI-010'],
  }),
  pattern({
    id: 'PAT-CXO-CX-002',
    slug: 'agent-assist-knowledge-quality-gate',
    title: 'Agent Assist Knowledge Quality Gate',
    domain: 'ai_programs',
    vertical: 'cross-industry',
    thesis:
      'Agent assist value depends less on model selection than on whether knowledge, policy, and resolution paths are current enough for agents to trust recommendations.',
    applicability:
      'Apply when an enterprise is evaluating agent assist, knowledge copilots, or next-best-action tooling for service teams.',
    confidence: 0.8,
    instanceCount: 5,
    theme: 'contact-to-experience-transformation',
    evidenceAnchors: [
      'Knowledge article freshness, owner, and resolution success data.',
      'Agent acceptance, override, and escalation signals.',
      'Policy exception taxonomy for cases where AI guidance cannot be followed.',
    ],
    failureModes: [
      'The model is blamed for low adoption when the knowledge base is stale.',
      'Agents receive suggestions they cannot execute under policy.',
      'Leaders count AI usage without measuring resolution quality.',
    ],
    worldviewLinkage:
      'Worldview W3: AI assistance depends on codified context and maintained operating knowledge.',
    relatedPatternIds: ['PAT-AI-001', 'PAT-AI-010', 'PAT-AI-004'],
  }),
  pattern({
    id: 'PAT-CXO-CX-003',
    slug: 'contact-center-ai-containment-trust',
    title: 'Contact Center AI Containment Trust',
    domain: 'ai_programs',
    vertical: 'cross-industry',
    thesis:
      'Containment is executive-safe only when the organization measures what was resolved, what was deferred, and what created repeat contact.',
    applicability:
      'Apply when self-service, voice bot, or chat AI containment is a material value lever in a CX business case.',
    confidence: 0.81,
    instanceCount: 6,
    theme: 'contact-to-experience-transformation',
    evidenceAnchors: [
      'Containment taxonomy separating resolved, abandoned, transferred, and repeat contacts.',
      'Customer satisfaction and repeat-contact evidence after containment.',
      'Escalation design for high-emotion, high-risk, or policy-constrained issues.',
    ],
    failureModes: [
      'Deflection is mistaken for resolution.',
      'Repeat contacts erase the apparent savings.',
      'Customers are trapped in automation for issues that require human authority.',
    ],
    worldviewLinkage:
      'Worldview W5: AI metrics need honesty labels because volume reduction can hide customer harm.',
    relatedPatternIds: ['PAT-AI-010', 'PAT-AI-008', 'PAT-AI-004'],
  }),
  pattern({
    id: 'PAT-CXO-CX-004',
    slug: 'experience-signal-product-feedback',
    title: 'Experience Signal Product Feedback',
    domain: 'ai_programs',
    vertical: 'retail',
    thesis:
      'The strategic prize in Contact Center AI is a product and operations feedback loop that turns customer friction into roadmap and process decisions.',
    applicability:
      'Apply when contact transcripts, chat logs, claims, returns, or store-service notes contain recurring signals that product and operations teams do not consume.',
    confidence: 0.78,
    instanceCount: 4,
    theme: 'contact-to-experience-transformation',
    evidenceAnchors: [
      'Recurring friction themes ranked by revenue, churn, cost, or brand impact.',
      'Backlog or operating change linked to each high-confidence theme.',
      'Measurement of whether the fix reduced future contact volume.',
    ],
    failureModes: [
      'Insights stay inside the service organization.',
      'Theme extraction produces dashboards but no backlog or process owner.',
      'The enterprise cannot prove whether fixes reduced friction.',
    ],
    worldviewLinkage:
      'Worldview W4: customer intelligence has leverage when it reaches the operating owners who can remove friction.',
    relatedPatternIds: ['PAT-IND-RET-002', 'PAT-AI-004', 'PAT-AI-010'],
  }),
  pattern({
    id: 'PAT-CXO-AMB-001',
    slug: 'ambient-ai-value-chain-expansion',
    title: 'Ambient AI Value Chain Expansion',
    domain: 'industry_specific',
    vertical: 'healthcare',
    thesis:
      'Ambient AI creates strategic value when encounter capture feeds coding, quality, care-gap, and revenue workflows rather than stopping at note creation.',
    applicability:
      'Apply when a healthcare organization is evaluating Abridge-style ambient AI and needs to decide whether the scope is documentation relief or value-chain transformation.',
    confidence: 0.86,
    instanceCount: 8,
    theme: 'ambient-ai',
    evidenceAnchors: [
      'Encounter-note completion, physician time, and documentation burden baseline.',
      'Downstream coding, quality, HCC, and care-gap workflows that consume encounter signal.',
      'Revenue integrity and quality-measure evidence after ambient deployment.',
    ],
    failureModes: [
      'The business case stops at physician time saved.',
      'Encounter signal is not integrated into downstream workflows.',
      'Quality and coding teams do not trust or consume ambient-derived evidence.',
    ],
    worldviewLinkage:
      'Worldview W4: ambient AI is a signal-routing architecture, not a point product, when it reaches the full clinical value chain.',
    relatedPatternIds: ['PAT-IND-HC-001', 'PAT-AI-010', 'PAT-AI-002'],
  }),
  pattern({
    id: 'PAT-CXO-AMB-002',
    slug: 'ambient-ai-clinician-trust',
    title: 'Ambient AI Clinician Trust',
    domain: 'industry_specific',
    vertical: 'healthcare',
    thesis:
      'Ambient AI adoption depends on clinician trust in capture quality, correction workflow, and liability boundaries as much as note speed.',
    applicability:
      'Apply when ambient tools are piloted but adoption, specialty fit, compliance, or physician satisfaction is uncertain.',
    confidence: 0.82,
    instanceCount: 6,
    theme: 'ambient-ai',
    evidenceAnchors: [
      'Clinician acceptance, correction, and override rates by specialty.',
      'Quality review of generated note sections and unsupported assertions.',
      'Liability, consent, and privacy control evidence for ambient capture.',
    ],
    failureModes: [
      'Clinicians edit so heavily that time savings disappear.',
      'The system creates unsupported clinical assertions.',
      'Consent and privacy concerns slow adoption after pilot enthusiasm.',
    ],
    worldviewLinkage:
      'Worldview W5: high-stakes AI requires explicit evidence, review, and confidence boundaries before scale.',
    relatedPatternIds: ['PAT-IND-HC-001', 'PAT-AI-002', 'PAT-AI-010'],
  }),
  pattern({
    id: 'PAT-CXO-AMB-003',
    slug: 'ambient-ai-coding-quality-linkage',
    title: 'Ambient AI Coding Quality Linkage',
    domain: 'industry_specific',
    vertical: 'healthcare',
    thesis:
      'Ambient AI value compounds when documentation quality improves coding specificity, quality capture, and value-based performance evidence.',
    applicability:
      'Apply when healthcare executives want ambient AI to support revenue, HCC, quality, Stars, or VBC economics.',
    confidence: 0.84,
    instanceCount: 7,
    theme: 'ambient-ai',
    evidenceAnchors: [
      'Pre/post documentation specificity and coding query rates.',
      'HCC, quality, or care-gap capture deltas tied to encounter evidence.',
      'Revenue integrity review confirming value is not over-coded or unsupported.',
    ],
    failureModes: [
      'The organization claims revenue lift without auditable documentation support.',
      'Coding teams see more volume but not better evidence.',
      'Quality teams are not integrated into ambient workflow design.',
    ],
    worldviewLinkage:
      'Worldview W5: AI value in regulated domains must prove both outcome lift and evidence integrity.',
    relatedPatternIds: ['PAT-IND-HC-001', 'PAT-AI-010', 'PAT-AI-002'],
  }),
  pattern({
    id: 'PAT-CXO-AMB-004',
    slug: 'ambient-ai-operating-model-redesign',
    title: 'Ambient AI Operating Model Redesign',
    domain: 'industry_specific',
    vertical: 'healthcare',
    thesis:
      'Ambient AI scale requires redesigning clinical, coding, compliance, IT, and vendor operations around a shared encounter-signal operating model.',
    applicability:
      'Apply when an ambient AI pilot is successful but enterprise rollout needs ownership, support, integration, and governance clarity.',
    confidence: 0.81,
    instanceCount: 5,
    theme: 'ambient-ai',
    evidenceAnchors: [
      'RACI across clinical leadership, compliance, coding, IT, and vendor operations.',
      'Integration map for EHR, coding, quality, and analytics workflows.',
      'Support and model-monitoring cadence after go-live.',
    ],
    failureModes: [
      'Clinical leadership owns adoption while IT and coding own the unresolved dependencies.',
      'Specialty rollout expands faster than support and review capacity.',
      'Vendor performance is not monitored after implementation.',
    ],
    worldviewLinkage:
      'Worldview W3: AI scale is an operating-model redesign problem once a point solution touches multiple decision systems.',
    relatedPatternIds: ['PAT-IND-HC-001', 'PAT-AI-002', 'PAT-AI-004'],
  }),
  pattern({
    id: 'PAT-CXO-VBC-001',
    slug: 'value-based-contracting-risk-spine',
    title: 'Value-Based Contracting Risk Spine',
    domain: 'industry_specific',
    vertical: 'healthcare',
    thesis:
      'Value-based contracting works when financial risk, quality accountability, attribution, and care-management operations are modeled as one contract spine.',
    applicability:
      'Apply when providers, payers, or enablement platforms are moving from fee-for-service economics into shared savings, downside risk, or delegated value-based contracts.',
    confidence: 0.84,
    instanceCount: 7,
    theme: 'value-based-contracting',
    evidenceAnchors: [
      'Attributed population, risk adjustment, quality targets, and benchmark methodology.',
      'Care-management operating capacity by risk cohort.',
      'Contract clauses naming data sharing, reconciliation, and dispute mechanisms.',
    ],
    failureModes: [
      'The contract transfers risk without operational capacity to manage it.',
      'Attribution and benchmark methods are not understood before signing.',
      'Quality and financial incentives point in different directions.',
    ],
    worldviewLinkage:
      'Worldview W2: strategic contracts are operating-model choices, not only payment terms.',
    relatedPatternIds: ['PAT-IND-HC-001', 'PAT-AI-010', 'PAT-SRC-CON-004'],
  }),
  pattern({
    id: 'PAT-CXO-VBC-002',
    slug: 'value-based-contracting-data-readiness',
    title: 'Value-Based Contracting Data Readiness',
    domain: 'industry_specific',
    vertical: 'healthcare',
    thesis:
      'VBC economics fail when claims, clinical, quality, attribution, and care-gap data are not timely enough to guide action before reconciliation.',
    applicability:
      'Apply when a health organization has VBC ambition but cannot produce decision-grade data for population risk, quality gaps, or contract performance.',
    confidence: 0.83,
    instanceCount: 6,
    theme: 'value-based-contracting',
    evidenceAnchors: [
      'Data latency and completeness by claims, clinical, quality, and care-gap feed.',
      'Attribution confidence and leakage analysis.',
      'Actionability test showing whether frontline teams can intervene before period close.',
    ],
    failureModes: [
      'Analytics arrive after the care-management window has passed.',
      'Executives accept contract risk on retrospective reports.',
      'Data feeds reconcile financially but do not support patient-level intervention.',
    ],
    worldviewLinkage:
      'Worldview W5: value claims are not credible unless evidence arrives in time to change outcomes.',
    relatedPatternIds: ['PAT-IND-HC-001', 'PAT-AI-010', 'PAT-AI-004'],
  }),
  pattern({
    id: 'PAT-CXO-VBC-003',
    slug: 'value-based-contracting-ai-care-gap',
    title: 'Value-Based Contracting AI Care Gap',
    domain: 'industry_specific',
    vertical: 'healthcare',
    thesis:
      'AI in value-based care should prioritize care-gap detection, prioritization, and outreach orchestration where it can change quality and risk outcomes before contract measurement.',
    applicability:
      'Apply when a VBC program is considering AI for population health, Stars, HEDIS, MA, ACO, or risk-bearing care management.',
    confidence: 0.81,
    instanceCount: 5,
    theme: 'value-based-contracting',
    evidenceAnchors: [
      'Care-gap inventory by measure, cohort, owner, and intervention path.',
      'Outreach capacity and completion evidence by risk segment.',
      'Pre/post quality and utilization trend tied to AI-prioritized interventions.',
    ],
    failureModes: [
      'AI identifies gaps but outreach capacity is unchanged.',
      'Predicted gaps are not aligned to contract measures.',
      'Model performance is measured without tracking completed interventions.',
    ],
    worldviewLinkage:
      'Worldview W4: AI should route scarce attention toward the interventions that change outcome economics.',
    relatedPatternIds: ['PAT-IND-HC-001', 'PAT-AI-004', 'PAT-AI-010'],
  }),
  pattern({
    id: 'PAT-CXO-VBC-004',
    slug: 'value-based-contracting-contract-governance',
    title: 'Value-Based Contracting Contract Governance',
    domain: 'sourcing',
    vertical: 'healthcare',
    thesis:
      'VBC contracts need governance clauses that make performance, data sharing, attribution disputes, and model-supported interventions auditable throughout the term.',
    applicability:
      'Apply when payer, provider, or enablement vendor contracts include outcome guarantees, shared savings, risk adjustment, or AI-supported population health operations.',
    confidence: 0.8,
    instanceCount: 5,
    theme: 'value-based-contracting',
    evidenceAnchors: [
      'Contract language for measurement, reconciliation, data sharing, and audit rights.',
      'Governance cadence for disputed attribution, quality gaps, and performance variance.',
      'Evidence requirements for AI-supported interventions and outcome claims.',
    ],
    failureModes: [
      'Outcome guarantees exist without inspectable measurement evidence.',
      'Data-sharing clauses are too weak to manage performance mid-term.',
      'AI-supported interventions create accountability ambiguity.',
    ],
    worldviewLinkage:
      'Worldview W5: outcome-linked AI and VBC contracts must be evidence-governed or they become narrative risk.',
    relatedPatternIds: ['PAT-SRC-CON-004', 'PAT-AI-002', 'PAT-AI-010'],
  }),
  pattern({
    id: 'PAT-CXO-ITORG-001',
    slug: 'it-reorg-ai-platform-operating-model',
    title: 'IT Reorg AI Platform Operating Model',
    domain: 'architecture',
    vertical: 'cross-industry',
    thesis:
      'AI pressure reorganizes IT around platform ownership, policy enforcement, reusable components, and product-facing enablement rather than ticket fulfillment alone.',
    applicability:
      'Apply when CIOs face rising AI demand across functions and the current IT model cannot support model access, integration, security, and adoption at portfolio scale.',
    confidence: 0.84,
    instanceCount: 7,
    theme: 'it-reorg-under-ai-pressure',
    evidenceAnchors: [
      'Demand map for AI use cases by function and required platform capability.',
      'RACI for model access, data products, integration, evaluation, and security review.',
      'Shared platform roadmap tied to business use-case portfolio.',
    ],
    failureModes: [
      'Every function builds its own AI stack.',
      'IT becomes an approval bottleneck without reusable platform capability.',
      'Security and architecture controls arrive after pilots are already embedded.',
    ],
    worldviewLinkage:
      'Worldview W3: enterprise AI shifts IT from system custodian to operating-platform steward.',
    relatedPatternIds: ['PAT-AI-002', 'PAT-AI-003', 'PAT-ARCH-006'],
  }),
  pattern({
    id: 'PAT-CXO-ITORG-002',
    slug: 'it-reorg-ai-talent-topology',
    title: 'IT Reorg AI Talent Topology',
    domain: 'ai_programs',
    vertical: 'cross-industry',
    thesis:
      'AI-ready IT organizations deliberately rebalance product, data, platform, security, and domain roles instead of assuming existing delivery squads can absorb AI work.',
    applicability:
      'Apply when AI initiatives expose gaps in data product ownership, model evaluation, prompt/product design, platform engineering, or risk review capacity.',
    confidence: 0.8,
    instanceCount: 5,
    theme: 'it-reorg-under-ai-pressure',
    evidenceAnchors: [
      'Role inventory across product, data, security, architecture, platform, and domain ownership.',
      'Bottleneck analysis for AI delivery stages from intake to operate.',
      'Upskilling and hiring roadmap tied to the AI portfolio.',
    ],
    failureModes: [
      'Existing teams receive AI demand without time, skills, or decision rights.',
      'Specialist roles are created but not connected to product delivery.',
      'The operating model depends on a few senior experts and creates scale fragility.',
    ],
    worldviewLinkage:
      'Worldview W3: AI changes the shape of work and therefore the topology of talent and decision rights.',
    relatedPatternIds: ['PAT-AI-001', 'PAT-AI-013', 'PAT-AI-014'],
  }),
  pattern({
    id: 'PAT-CXO-ITORG-003',
    slug: 'it-reorg-ai-vendor-boundary',
    title: 'IT Reorg AI Vendor Boundary',
    domain: 'sourcing',
    vertical: 'cross-industry',
    thesis:
      'AI vendor strategy should redraw the boundary between internal platform control and external capability consumption before spend and risk sprawl become structural.',
    applicability:
      'Apply when AI capabilities enter through model providers, embedded SaaS, consulting partners, data platforms, and shadow subscriptions at the same time.',
    confidence: 0.82,
    instanceCount: 6,
    theme: 'it-reorg-under-ai-pressure',
    evidenceAnchors: [
      'AI vendor inventory by capability, data boundary, spend owner, and integration depth.',
      'Buy/build/partner decision criteria by capability layer.',
      'Contract controls for data use, model changes, audit, and portability.',
    ],
    failureModes: [
      'Procurement optimizes vendor count without preserving strategic platform control.',
      'Embedded AI features bypass architecture and risk review.',
      'Internal teams lose leverage because critical context is trapped in vendor workflows.',
    ],
    worldviewLinkage:
      'Worldview W2: AI sourcing is an architecture and operating-control decision as much as a procurement decision.',
    relatedPatternIds: ['PAT-AI-003', 'PAT-SRC-CAT-LLM-001', 'PAT-AI-002'],
  }),
  pattern({
    id: 'PAT-CXO-ITORG-004',
    slug: 'it-reorg-ai-governance-velocity',
    title: 'IT Reorg AI Governance Velocity',
    domain: 'ai_programs',
    vertical: 'cross-industry',
    thesis:
      'AI governance must move at delivery velocity by using risk tiers, reusable control patterns, and embedded review instead of one-off committees for every use case.',
    applicability:
      'Apply when AI demand is rising faster than architecture, privacy, security, legal, or risk teams can review through legacy gates.',
    confidence: 0.83,
    instanceCount: 7,
    theme: 'it-reorg-under-ai-pressure',
    evidenceAnchors: [
      'Risk-tier classification for AI use cases and vendor features.',
      'Reusable control patterns by data sensitivity, autonomy, and external exposure.',
      'Review lead time and escalation data before and after governance redesign.',
    ],
    failureModes: [
      'Governance slows delivery enough that teams route around it.',
      'Low-risk and high-risk use cases receive the same review burden.',
      'Controls are approved once but not monitored after deployment.',
    ],
    worldviewLinkage:
      'Worldview W5: fast AI governance needs evidence and tiering so speed and trust reinforce each other.',
    relatedPatternIds: ['PAT-AI-002', 'PAT-AI-005', 'PAT-AI-014'],
  }),
];

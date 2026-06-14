import type { CorpusPatternInput } from '@/lib/corpus/types';

type HealthPlanPattern = CorpusPatternInput & {
  sourceStarterId: string;
  policyStatus: 'review_ready';
};

const COMMON_VERTICALS = ['healthcare', 'health_plan', 'payer_provider'];
const COMMON_HORIZONS = ['P0_originate', 'P1_charter', 'P2_diagnose', 'P3_design', 'P4_roadmap'];

function md(args: {
  title: string;
  quantifiedClaim: string;
  evidence: string[];
  counterarguments: string[];
  confidence: string;
  boundary: string[];
  failureModes: string[];
  maturity: string;
  verticalOverlay: string;
  related: string[];
  synthesis: string;
}): string {
  return [
    `# ${args.title}`,
    '',
    '## Quantified claim',
    args.quantifiedClaim,
    '',
    '## Evidence',
    ...args.evidence.map((item, index) => `- Evidence chunk ${index + 1} with primary citation source: ${item}`),
    '',
    '## Counterarguments',
    ...args.counterarguments.map((item, index) => `- Counterargument ${index + 1} steelman: ${item}`),
    '',
    '## Confidence',
    `Calibrated confidence: ${args.confidence}`,
    '',
    '## Boundary conditions',
    ...args.boundary.map((item) => `- Does not apply when ${item}`),
    '',
    '## Failure modes',
    ...args.failureModes.map((item, index) => `- Failure mode ${index + 1}: goes wrong when ${item}`),
    '',
    '## Maturity model',
    args.maturity,
    '',
    '## Vertical overlay',
    args.verticalOverlay,
    '',
    '## Related patterns',
    ...args.related.map((item) => `- ${item}`),
    '',
    '## Synthesis',
    `So what: ${args.synthesis}`,
  ].join('\n');
}

function claims(...items: string[]) {
  return items.map((claim, index) => ({
    id: `claim-${index + 1}`,
    type: 'strategy_pattern_claim',
    claim,
    source_basis: 'synthetic_or_deidentified_aggregate_strategy_pattern',
  }));
}

function evidence(...items: string[]) {
  return items.map((summary, index) => ({
    id: `evidence-${index + 1}`,
    summary,
    citation_requirement: 'Use client aggregate template row, source document section, or governed public benchmark before citing in a deliverable.',
    classification: 'internal',
  }));
}

function counterarguments(...items: string[]) {
  return items.map((summary, index) => ({
    id: `counterargument-${index + 1}`,
    summary,
    response_required: true,
  }));
}

export const PHS_HEALTH_PLAN_CORPUS_PATTERNS: HealthPlanPattern[] = [
  {
    sourceStarterId: 'HP-PAT-001',
    policyStatus: 'review_ready',
    slug: 'health-plan-payment-integrity-leakage-triage',
    title: 'Payment integrity leakage triage without raw claims',
    category: 'payer_health_plan_strategy',
    confidence: 0.84,
    depthScore: 9,
    verticalOverlays: COMMON_VERTICALS,
    regionOverlays: ['us_healthcare'],
    applicableHorizons: ['P1_charter', 'P2_diagnose', 'P3_design', 'P4_roadmap'],
    markdownBody: md({
      title: 'Payment integrity leakage triage without raw claims',
      quantifiedClaim:
        'A strategy-stage payment integrity Move can size and prioritize leakage using 6-10 aggregate denial, recovery, provider-pattern, and service-line slices; raw claim lines, member identifiers, and provider-level accusations are not needed until a controlled operating pilot.',
      evidence: [
        'Aggregated denial category mix, appeal overturn rate, recoverable value band, and aging bucket by payer/service-line from kpi_baseline.csv and current_state_process.csv.',
        'Vendor and internal capability evidence from vendor_contract_context.csv showing FWA tooling, claim edit platforms, recovery vendors, and renewal or SLA constraints.',
        'Risk guardrails from risk_guardrail_register.csv requiring compliance review before provider-facing or fraud-facing action.',
      ],
      counterarguments: [
        'The team may argue that raw claim detail is required to find leakage; for Moves P0-P2, aggregate leakage categories are enough to choose the first diagnostic cohort.',
        'The team may argue vendor scorecards are enough; without process owner, recovery cycle, and appeal feedback evidence, the Move will misclassify technology gaps as vendor gaps.',
      ],
      confidence:
        'High for strategy prioritization because the pattern uses common payment-integrity operating mechanics; medium for value sizing until client-specific aggregate recovery and denial baselines are loaded.',
      boundary: [
        'the decision requires member-level adjudication, fraud accusation, provider sanctions, or claims recoupment.',
        'the available evidence lacks source basis, confidence, classification, and human compliance review.',
      ],
      failureModes: [
        'AbarVa ranks individual providers or codes without attribution confidence and compliance review.',
        'the Move treats leakage value as booked savings before recovery, overturn, and payer/provider response rates are measured.',
        'old or superseded denial-category facts remain in the default current view.',
      ],
      maturity:
        'Stage 1: aggregate leakage heatmap. Stage 2: recoverability and effort scoring. Stage 3: controlled diagnostic cohort. Stage 4: governed operating pilot with auditable claim-level access outside the strategy corpus.',
      verticalOverlay:
        'Healthcare payer/provider overlay: keep this as a payer operations and finance strategy pattern; never ingest raw claims, member IDs, PHI, or provider accusation detail into the shared corpus.',
      related: [
        'depends_on: health-plan-governed-data-foundation-strategy',
        'reinforces: health-plan-cost-transparency-strategy',
        'contradicts: raw-claims-required-for-strategy-anti-pattern',
      ],
      synthesis:
        'Use this pattern to launch payment integrity as a board-grade Move with credible value framing while keeping the data boundary strategy-safe.',
    }),
    structured: {
      claims: claims(
        'Aggregate denial and recovery categories are sufficient for P0-P2 payment integrity strategy.',
        'Raw claim lines and member identifiers should stay out of strategy corpus and shared model context.',
      ),
      evidence: evidence(
        'Aggregated denial mix and recovery value bands.',
        'Vendor contract and SLA context.',
        'Compliance guardrail register.',
      ),
      counterarguments: counterarguments(
        'Raw claim detail may be needed later for root-cause analytics.',
        'Vendor dashboards may already claim leakage opportunity sizing.',
      ),
      synthesis: {
        recommended_move: 'Payment Integrity Leakage Diagnostic',
        allowed_data: ['aggregate denial categories', 'recovery value bands', 'process owner roles', 'vendor context'],
        blocked_data: ['raw claims', 'member identifiers', 'PHI', 'provider accusation detail'],
      },
    },
  },
  {
    sourceStarterId: 'HP-PAT-002',
    policyStatus: 'review_ready',
    slug: 'health-plan-prior-authorization-modernization',
    title: 'Prior authorization modernization strategy pattern',
    category: 'payer_health_plan_strategy',
    confidence: 0.86,
    depthScore: 9,
    verticalOverlays: COMMON_VERTICALS,
    regionOverlays: ['us_healthcare'],
    applicableHorizons: COMMON_HORIZONS,
    markdownBody: md({
      title: 'Prior authorization modernization strategy pattern',
      quantifiedClaim:
        'A prior authorization Move should evaluate at least 5 evidence dimensions before automation funding: volume by service family, denial/overturn rate, cycle-time distribution, clinical criteria ownership, and payer/API readiness.',
      evidence: [
        'Current-state process evidence for intake, nurse review, medical director escalation, denial handling, and appeal feedback loops.',
        'System/data landscape evidence for EHR, payer portal, FHIR/API, document management, and workqueue integration readiness.',
        'Risk guardrails requiring clinical governance before any automated determination, denial, or member/provider communication.',
      ],
      counterarguments: [
        'Automation vendors may promise throughput without proving clinical criteria governance, auditability, and provider abrasion impact.',
        'Operations may ask for transactional prior-auth samples immediately; for P0-P2, aggregate workqueue and criteria metadata are enough to shape the Move.',
      ],
      confidence:
        'High for scope design because prior authorization modernization has repeatable operating constraints; medium for ROI until aggregate cycle-time and denial/overturn baselines are loaded.',
      boundary: [
        'the workflow would automate clinical determinations without documented medical-policy governance.',
        'the client cannot provide aggregate volume, cycle-time, denial, and appeal evidence.',
      ],
      failureModes: [
        'automation accelerates bad criteria and increases appeals, provider abrasion, or regulatory exposure.',
        'the Move ignores payer portal constraints and assumes API readiness that does not exist.',
        'model outputs cross into clinical decisioning without human-in-loop controls.',
      ],
      maturity:
        'Stage 1: aggregate workqueue and denial baseline. Stage 2: criteria governance and API readiness. Stage 3: first cohort workflow design. Stage 4: human-reviewed automation pilot.',
      verticalOverlay:
        'Health-plan overlay: use CMS interoperability and clinical-governance constraints as design inputs; keep raw clinical records out of the strategy pattern.',
      related: [
        'depends_on: health-plan-governed-data-foundation-strategy',
        'reinforces: healthcare-responsible-ai-clinical-ops',
        'related: health-plan-member-experience-contact-center',
      ],
      synthesis:
        'This pattern keeps prior-auth strategy grounded in operating evidence and clinical governance, not vendor automation theater.',
    }),
    structured: {
      claims: claims(
        'Prior authorization strategy requires process, clinical governance, and integration readiness evidence before automation scope is funded.',
        'Raw medical records are not required for P0-P2 strategy decisions.',
      ),
      evidence: evidence(
        'Aggregate prior-auth volume, cycle time, denial, and appeal data.',
        'Clinical criteria owner and approval evidence.',
        'FHIR/API and portal readiness summary.',
      ),
      counterarguments: counterarguments(
        'Vendor demos may imply the process is ready for straight-through automation.',
        'Clinical teams may need case-level evidence later for pilot design.',
      ),
      synthesis: {
        recommended_move: 'Prior Authorization Modernization',
        first_cohort_design: 'payer/service-line cohort with high volume, clear criteria ownership, and measurable cycle-time friction',
      },
    },
  },
  {
    sourceStarterId: 'HP-PAT-003',
    policyStatus: 'review_ready',
    slug: 'health-plan-provider-quality-hedis-star',
    title: 'Provider quality HEDIS STAR strategy pattern',
    category: 'payer_health_plan_strategy',
    confidence: 0.82,
    depthScore: 9,
    verticalOverlays: COMMON_VERTICALS,
    regionOverlays: ['us_healthcare'],
    applicableHorizons: ['P1_charter', 'P2_diagnose', 'P3_design', 'P4_roadmap'],
    markdownBody: md({
      title: 'Provider quality HEDIS STAR strategy pattern',
      quantifiedClaim:
        'A quality-performance Move should select 3-5 measure families and prove attribution, gap-closure ownership, data-lag, and intervention capacity before any provider benchmarking surface is trusted.',
      evidence: [
        'Aggregate HEDIS/STAR measure baseline, covered-life denominator, measure owner, and intervention owner from kpi_baseline.csv and operating_model_roles.csv.',
        'Data readiness evidence for attribution method, supplemental data, EHR/claims lag, and measure specification version.',
        'Decision log evidence that leadership selected the first wave of measure families and excluded unsafe provider-ranking uses.',
      ],
      counterarguments: [
        'Provider scorecards may look compelling, but rankings are unsafe without attribution confidence and measure-lag context.',
        'Quality teams may prefer broad dashboards; the Move needs a narrow first wave tied to bonus, compliance, or care-gap value.',
      ],
      confidence:
        'Medium-high because HEDIS/STAR operating patterns are well understood; confidence depends on the client loading aggregate attribution and measure-lag evidence.',
      boundary: [
        'provider-level ranking would be shown before attribution methodology is reviewed.',
        'measure data is stale, unaudited, or missing denominator/source basis.',
      ],
      failureModes: [
        'scorecards create provider distrust because attribution and exclusions are opaque.',
        'teams optimize low-value measures while missing high-weight or bonus-sensitive measures.',
        'intervention capacity is not matched to the selected measure families.',
      ],
      maturity:
        'Stage 1: measure family selection. Stage 2: attribution and lag review. Stage 3: intervention operating model. Stage 4: provider-facing scorecard with review controls.',
      verticalOverlay:
        'Payer/provider overlay: this pattern is about quality strategy and intervention design, not patient-level care-gap disclosure in model prompts.',
      related: [
        'depends_on: health-plan-governed-data-foundation-strategy',
        'reinforces: health-plan-member-experience-contact-center',
        'related: value-based-care-performance-management',
      ],
      synthesis:
        'Use this pattern to prevent quality Moves from becoming dashboard projects with weak attribution and no operating action.',
    }),
    structured: {
      claims: claims(
        'Provider quality strategy needs measure-family selection and attribution confidence before benchmarking.',
        'Patient-level care gaps are not needed in the strategy corpus.',
      ),
      evidence: evidence(
        'Aggregate HEDIS/STAR baseline and denominator.',
        'Attribution method and data-lag summary.',
        'Intervention owner and capacity evidence.',
      ),
      counterarguments: counterarguments(
        'A broad provider dashboard may feel like faster progress.',
        'Patient-level gaps may be required later for care operations.',
      ),
      synthesis: {
        recommended_move: 'Provider Quality Performance Engine',
        first_wave: ['HEDIS/STAR measure family', 'attribution confidence', 'intervention capacity'],
      },
    },
  },
  {
    sourceStarterId: 'HP-PAT-004',
    policyStatus: 'review_ready',
    slug: 'health-plan-member-experience-contact-center',
    title: 'Member experience contact center strategy without raw transcripts',
    category: 'payer_health_plan_strategy',
    confidence: 0.8,
    depthScore: 9,
    verticalOverlays: COMMON_VERTICALS,
    regionOverlays: ['us_healthcare'],
    applicableHorizons: COMMON_HORIZONS,
    markdownBody: md({
      title: 'Member experience contact center strategy without raw transcripts',
      quantifiedClaim:
        'A contact-center AI Move can reach P2/P3 decision quality using 8-12 aggregate intent, containment, repeat-contact, complaint, SLA, CRM, and next-best-action evidence fields; raw call audio and transcripts are not required for strategy.',
      evidence: [
        'Aggregate call volume, top intents, average handle time, abandonment, repeat contact, complaint category, and escalation rate.',
        'System landscape evidence for telephony, CRM, claims lookup, knowledge base, and agent-assist integration readiness.',
        'Guardrail evidence for member communication review, TCPA/privacy controls, and no raw transcript ingestion in strategy surfaces.',
      ],
      counterarguments: [
        'Teams may believe transcript mining is required; aggregate intent taxonomy and journey-friction evidence are enough for strategy and first-cohort selection.',
        'Leaders may over-focus on call deflection; member experience and complaint risk must remain co-equal value metrics.',
      ],
      confidence:
        'Medium until call-intent taxonomy and SLA baselines are loaded; high that raw transcripts should stay out of shared strategy context.',
      boundary: [
        'model context would include raw transcript text, member identifiers, or protected complaint details.',
        'the Move cannot identify the CRM/telephony/claims systems needed for an agent-assist pilot.',
      ],
      failureModes: [
        'automation deflects calls while increasing repeat contacts and grievances.',
        'knowledge base quality is ignored, so agent assist retrieves stale or conflicting answers.',
        'member communication guardrails are absent.',
      ],
      maturity:
        'Stage 1: intent taxonomy and SLA baseline. Stage 2: journey-friction and system-readiness map. Stage 3: agent-assist first cohort. Stage 4: monitored next-best-action pilot.',
      verticalOverlay:
        'Health-plan overlay: treat member experience, complaint risk, and STAR/CAHPS adjacency as strategy evidence; do not expose raw member interactions to general agents.',
      related: [
        'depends_on: health-plan-governed-data-foundation-strategy',
        'reinforces: health-plan-prior-authorization-modernization',
        'related: service-experience-ai-agent-assist',
      ],
      synthesis:
        'The best first Move is usually not a chatbot; it is a governed agent-assist and intent-resolution program with measured member-experience outcomes.',
    }),
    structured: {
      claims: claims(
        'Aggregate contact-center metrics and intent taxonomy are sufficient for P0-P3 member-experience strategy.',
        'Raw transcripts should not be loaded into shared strategy context.',
      ),
      evidence: evidence(
        'Intent category mix and SLA summary.',
        'CRM, claims lookup, and knowledge-base integration readiness.',
        'Privacy and communication guardrail evidence.',
      ),
      counterarguments: counterarguments(
        'Transcript analytics can be valuable later in a controlled private plane.',
        'Call deflection alone may be an insufficient success metric.',
      ),
      synthesis: {
        recommended_move: 'Member Experience Agent Assist',
        first_cohort: 'high-volume administrative intents with clear policy answers and low clinical risk',
      },
    },
  },
  {
    sourceStarterId: 'HP-PAT-005',
    policyStatus: 'review_ready',
    slug: 'health-plan-cost-transparency-strategy',
    title: 'Cost transparency by product, provider, and population strategy pattern',
    category: 'payer_health_plan_strategy',
    confidence: 0.83,
    depthScore: 9,
    verticalOverlays: COMMON_VERTICALS,
    regionOverlays: ['us_healthcare'],
    applicableHorizons: ['P1_charter', 'P2_diagnose', 'P3_design', 'P4_roadmap'],
    markdownBody: md({
      title: 'Cost transparency by product, provider, and population strategy pattern',
      quantifiedClaim:
        'A cost-transparency Move should reconcile at least 6 aggregate dimensions before executive use: claims cost, capitation, provider contract terms, GL allocation, product line, population/risk segment, and margin definition.',
      evidence: [
        'Aggregate cost-of-care, capitation, contract, and GL mapping evidence from KPI and vendor/contract templates.',
        'Decision log evidence defining which margin view is authoritative for the Move.',
        'Data readiness evidence for claims lag, provider attribution, product hierarchy, and finance reconciliation confidence.',
      ],
      counterarguments: [
        'Finance may ask for transaction-level GL and claim detail; P1/P2 needs reconciled definitions and aggregate baselines first.',
        'Medical economics may define cost differently from finance; without a decision log, the platform will surface dueling truths.',
      ],
      confidence:
        'Medium-high for strategy pattern; confidence rises when product hierarchy, provider contract summaries, and aggregate GL mapping are loaded.',
      boundary: [
        'the question requires member-level profitability or raw claim-level adjudication.',
        'the client cannot define product, provider, population, and GL mapping conventions.',
      ],
      failureModes: [
        'leaders compare unreconciled medical economics and finance numbers.',
        'capitation and provider-contract terms are missing from the cost view.',
        'claims lag creates false variance alerts.',
      ],
      maturity:
        'Stage 1: authoritative margin definition. Stage 2: aggregate dimension reconciliation. Stage 3: opportunity heatmap. Stage 4: operating cadence and variance governance.',
      verticalOverlay:
        'Health-plan overlay: cost transparency must respect regulated financial reporting, actuarial assumptions, and payer/provider contract boundaries.',
      related: [
        'depends_on: health-plan-governed-data-foundation-strategy',
        'reinforces: health-plan-payment-integrity-leakage-triage',
        'related: finance-close-reporting-automation-strategy',
      ],
      synthesis:
        'Cost transparency is a strategy and governance Move before it is an analytics dashboard; the first artifact should define the economic truth model.',
    }),
    structured: {
      claims: claims(
        'Cost transparency strategy requires reconciled economic definitions before analytics scale.',
        'Aggregate cost and contract dimensions are enough for P1/P2 strategy.',
      ),
      evidence: evidence(
        'Aggregate cost, capitation, and GL mapping.',
        'Provider contract summary.',
        'Margin definition decision log.',
      ),
      counterarguments: counterarguments(
        'Transaction-level detail may be needed later for finance close or audit.',
        'Actuarial and finance teams may use different definitions intentionally.',
      ),
      synthesis: {
        recommended_move: 'Cost Transparency Economic Truth Model',
        key_decision: 'authoritative margin and variance definition',
      },
    },
  },
  {
    sourceStarterId: 'HP-PAT-006',
    policyStatus: 'review_ready',
    slug: 'health-plan-governed-data-foundation-strategy',
    title: 'Governed healthcare data foundation strategy pattern',
    category: 'payer_health_plan_strategy',
    confidence: 0.88,
    depthScore: 9,
    verticalOverlays: COMMON_VERTICALS,
    regionOverlays: ['us_healthcare'],
    applicableHorizons: COMMON_HORIZONS,
    markdownBody: md({
      title: 'Governed healthcare data foundation strategy pattern',
      quantifiedClaim:
        'A health-plan data-foundation Move should prove 10 strategy-level controls before AI workflow funding: domain ownership, semantic layer, lineage, quality SLAs, classification, access model, evidence citations, integration pattern, stewardship cadence, and model-use boundary.',
      evidence: [
        'System/data landscape evidence for EMR, claims, pharmacy, CRM, finance, and lakehouse integration posture.',
        'Data readiness evidence for quality, lineage, stewardship, classification, and source-basis status by use case.',
        'Risk guardrail evidence for minimum necessary data, PHI exclusion from shared corpus, and restricted/private-plane escalation.',
      ],
      counterarguments: [
        'Teams may frame this as a platform build; the strategy Move should instead tie foundation controls to use-case readiness and value decisions.',
        'Teams may ask to load raw EMR/claims early; strategy evidence should use metadata, aggregate readiness, and de-identified summaries.',
      ],
      confidence:
        'High as a strategy pattern because every listed PHA use case depends on governed data foundations; execution confidence depends on client-specific source-system and stewardship evidence.',
      boundary: [
        'the environment lacks a private data plane for PHI-bearing operational proof.',
        'source ownership and classification are missing.',
      ],
      failureModes: [
        'the lakehouse becomes a dumping ground without semantic ownership.',
        'AI workflows are funded before data quality and lineage are trusted.',
        'minimum-necessary controls are bypassed for convenience.',
      ],
      maturity:
        'Stage 1: source and owner inventory. Stage 2: semantic and quality contract. Stage 3: governed use-case readiness score. Stage 4: private-plane operational data pilot.',
      verticalOverlay:
        'Healthcare overlay: separate strategy corpus from PHI-bearing operational stores; use private client planes for sensitive proof and only after approval.',
      related: [
        'supports: all PHA health-plan pilot patterns',
        'depends_on: healthcare-governance-security-compliance',
        'reinforces: responsible-ai-minimum-necessary-data',
      ],
      synthesis:
        'This is the foundation pattern: it tells Nexus and Sentinel when a use case is strategy-ready, evidence-ready, or blocked by data governance.',
    }),
    structured: {
      claims: claims(
        'All PHA pilot use cases require governed source ownership, semantic layer, quality, lineage, and classification evidence.',
        'Strategy-phase corpus should use metadata, aggregate readiness, and de-identified summaries rather than PHI.',
      ),
      evidence: evidence(
        'Source-system and domain ownership map.',
        'Data quality and lineage readiness summary.',
        'Classification and minimum-necessary guardrail register.',
      ),
      counterarguments: counterarguments(
        'Some technical teams may want to start with raw ingestion.',
        'A data platform alone does not prove AI workflow readiness.',
      ),
      synthesis: {
        recommended_move: 'Governed Healthcare Data Foundation',
        readiness_dimensions: ['ownership', 'semantic layer', 'lineage', 'quality', 'classification', 'access', 'citations'],
      },
    },
  },
  {
    sourceStarterId: 'HP-PAT-007',
    policyStatus: 'review_ready',
    slug: 'health-plan-finance-close-reporting-automation',
    title: 'Automated close and reporting strategy pattern',
    category: 'payer_health_plan_strategy',
    confidence: 0.79,
    depthScore: 9,
    verticalOverlays: COMMON_VERTICALS,
    regionOverlays: ['us_healthcare'],
    applicableHorizons: ['P1_charter', 'P2_diagnose', 'P3_design', 'P4_roadmap'],
    markdownBody: md({
      title: 'Automated close and reporting strategy pattern',
      quantifiedClaim:
        'A finance close automation Move should prove 5-8 current-state controls before funding: close calendar, manual reconciliation inventory, system-of-record map, adjustment categories, control owner, reporting pack lineage, and exception threshold.',
      evidence: [
        'Current-state process evidence for close steps, handoffs, reconciliations, adjustment categories, and reporting deadlines.',
        'System landscape evidence for GL, claims finance feeds, capitation, provider contracts, data warehouse, and reporting tools.',
        'Decision and risk evidence for signoff responsibility, materiality thresholds, audit evidence, and rollback controls.',
      ],
      counterarguments: [
        'Finance may want immediate automation; without control ownership and exception thresholds, automation can accelerate unreconciled numbers.',
        'Technology teams may focus on dashboard refresh; the Move is really about close control, lineage, and decision accountability.',
      ],
      confidence:
        'Medium until finance process and control-owner templates are loaded; high that strategy does not require raw transaction-level journals.',
      boundary: [
        'the use case requires actual close posting, journal creation, or audit-significant action without finance approval.',
        'materiality, control owner, and evidence trail are undefined.',
      ],
      failureModes: [
        'AI creates or explains variance using stale or unreconciled source feeds.',
        'manual reconciliations remain invisible and break the automation business case.',
        'generated reporting narratives lack citation to source packs and signoff evidence.',
      ],
      maturity:
        'Stage 1: close inventory and control map. Stage 2: reconciliation and reporting lineage. Stage 3: exception workflow design. Stage 4: governed narrative and dashboard automation.',
      verticalOverlay:
        'Health-plan finance overlay: include claims finance lag, capitation, provider contracts, and regulated reporting deadlines without loading raw journals into shared corpus.',
      related: [
        'depends_on: health-plan-governed-data-foundation-strategy',
        'reinforces: health-plan-cost-transparency-strategy',
        'related: finance-control-narrative-automation',
      ],
      synthesis:
        'The right first Move is a controlled close-readiness and reporting-lineage program, not an unconstrained AI finance narrator.',
    }),
    structured: {
      claims: claims(
        'Finance close automation strategy requires control ownership and lineage before automation.',
        'Raw journals are not required for strategy-phase Move design.',
      ),
      evidence: evidence(
        'Close calendar and reconciliation inventory.',
        'System-of-record and reporting lineage map.',
        'Materiality threshold and signoff evidence.',
      ),
      counterarguments: counterarguments(
        'Some finance teams may require transaction detail later for implementation.',
        'Dashboard automation can hide unresolved control problems.',
      ),
      synthesis: {
        recommended_move: 'Automated Close and Reporting Readiness',
        first_output: 'close-control and reporting-lineage map',
      },
    },
  },
];

export function getPhsHealthPlanCorpusPatterns(): HealthPlanPattern[] {
  return PHS_HEALTH_PLAN_CORPUS_PATTERNS;
}

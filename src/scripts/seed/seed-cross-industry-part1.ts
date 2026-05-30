// seed-cross-industry-part1.ts
// Cross-industry genome patterns — AI/ML Governance at Scale + Vendor Consolidation Risk
// Code range: X100–X149  (50 patterns)
// Loaded by: scripts/corpus/load-authored-genome-seeds.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface PatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
  subTopic?: string;
  verticals?: string[];
}

export const CROSS_INDUSTRY_PART1_PATTERNS: PatternSeed[] = [
  // ── AI Inventory & Risk Tiering ──────────────────────────────────────────────
  {
    code: 'X100',
    name: 'AI Inventory Blind To Vendor-Embedded Models',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Enterprise AI inventories capture internally built models but systematically miss AI embedded in ERP suites, core-banking platforms, EMR systems, revenue-management tools, and SaaS procurement products. The result is a shadow AI fleet that bypasses SR 11-7 model validation, HIPAA BAA review, and Third-Party Risk Management controls while the board believes the model estate is small and auditable.',
    keywords: ['AI inventory', 'vendor AI', 'SR 11-7', 'TPRM', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-inventory',
    verticals: ['airline', 'healthcare_provider', 'medtech', 'banking', 'retail'],
  },
  {
    code: 'X101',
    name: 'AI Risk Tiering Treats All Models Equally',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Organizations maintain a flat model inventory where a marketing chatbot and a clinical decision-support algorithm share the same validation checklist, escalation path, and change-control cadence. High-blast-radius operational AI — credit underwriting models, surgical-scheduling algorithms, predictive maintenance tools, and dynamic pricing engines — receives no additional pre-launch governance, violating SR 11-7 tiering requirements and FDA SaMD classification thresholds.',
    keywords: ['AI risk tiering', 'SR 11-7', 'FDA SaMD', 'model validation', 'blast radius'],
    demoRelevant: true,
    subTopic: 'ai-inventory',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X102',
    name: 'AI Use Case Approved Before Data Readiness Gate',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'AI use cases receive funding and vendor selection approval before source-system ownership, data lineage, refresh cadence, and quality thresholds are formally verified. Teams discover downstream that claims data, PSS feeds, device telemetry, and transaction logs do not meet model training requirements — creating rework cycles after budgets are committed and vendor contracts signed.',
    keywords: ['AI use case', 'data readiness', 'lineage', 'approval gate', 'model inventory'],
    demoRelevant: true,
    subTopic: 'ai-inventory',
    verticals: ['airline', 'healthcare_provider', 'medtech', 'banking', 'retail'],
  },
  {
    code: 'X103',
    name: 'AI Safety Classification Not Embedded In Intake',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Intake forms for new AI projects ask about budget, sponsor, and ROI but do not classify models by safety risk at the point of origination. High-risk clinical AI, fraud-scoring models, and DOT-regulated pricing tools enter lightweight delivery lanes because no safety classification was assigned at intake, bypassing mandatory pre-deployment controls.',
    keywords: ['AI safety classification', 'intake', 'FDA SaMD', 'DOT unfair pricing', 'model governance'],
    demoRelevant: true,
    subTopic: 'ai-inventory',
    verticals: ['healthcare_provider', 'medtech', 'banking', 'airline', 'retail'],
  },
  {
    code: 'X104',
    name: 'Model Inventory Lacks Refresh And Retirement Cadence',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'AI model inventories record when a model launched but do not track last validation date, drift status, or planned retirement. Stale predictive models continue to drive clinical recommendations, credit decisions, and dynamic pricing after population shift renders training data unrepresentative, with no governance trigger to re-validate or retire.',
    keywords: ['model inventory', 'model drift', 'champion-challenger', 'model validation', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-inventory',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },

  // ── AI Governance Board ──────────────────────────────────────────────────────
  {
    code: 'X105',
    name: 'AI Governance Board Reviews Policies Not Live Model Behavior',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'AI governance committees approve model policies, principles documents, and risk frameworks but do not review live model drift reports, adoption telemetry, or production exception logs. Models exhibiting concept drift, low adoption, or increasing override rates remain in production undetected because the board has no operational dashboard reviewing what models are actually doing post-launch.',
    keywords: ['AI governance board', 'model drift', 'adoption telemetry', 'SR 11-7', 'operational AI'],
    demoRelevant: true,
    subTopic: 'ai-governance-board',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X106',
    name: 'AI Steering Committee Approves Funding Without Kill Criteria',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'AI steering committees approve program funding but do not set explicit kill criteria for adoption floor, accuracy floor, or decision-quality threshold. Programs that fail to achieve meaningful adoption run indefinitely, consuming governance and IT bandwidth without delivering value, while sponsors avoid recommending discontinuation because no objective decision gate was established at inception.',
    keywords: ['AI steering committee', 'kill criteria', 'adoption telemetry', 'AI governance board', 'program management'],
    demoRelevant: true,
    subTopic: 'ai-governance-board',
    verticals: ['airline', 'healthcare_provider', 'medtech', 'banking', 'retail'],
  },
  {
    code: 'X107',
    name: 'AI Governance Excludes Labor And Contract Obligations',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'AI governance frameworks address model accuracy, bias, and data privacy but do not surface labor agreements, customer-facing SLAs, or commercial contracts that restrict how AI can alter workflows, staffing levels, or service commitments. AI deployments trigger union grievances, contract breach claims, and regulatory complaints that governance reviewers were not positioned to flag during approval.',
    keywords: ['AI governance', 'labor obligations', 'contract compliance', 'TPRM', 'AI risk'],
    demoRelevant: true,
    subTopic: 'ai-governance-board',
    verticals: ['airline', 'healthcare_provider', 'banking', 'retail', 'medtech'],
  },
  {
    code: 'X108',
    name: 'Governance Audit Trail Omits Rejected AI Recommendations',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'AI governance audit trails record which model recommendations were accepted and acted upon but do not capture recommendations that were rejected, overridden, or ignored by human reviewers. This creates an incomplete evidentiary record for SR 11-7 model validation, HIPAA compliance audits, and internal model risk management reviews, and biases any retrospective accuracy analysis toward accepted cases.',
    keywords: ['AI audit trail', 'human override', 'SR 11-7', 'HIPAA', 'model governance'],
    demoRelevant: true,
    subTopic: 'ai-governance-board',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X109',
    name: 'AI Governance Cadence Misaligned With Model Release Pace',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'Quarterly AI governance board meetings cannot keep pace with monthly or continuous model releases from vendor-managed LLM platforms, embedded SaaS AI, and internal data science teams. The mismatch creates a backlog of unreviewed model changes and a governance board that is perpetually reviewing last quarter while this quarter deploys.',
    keywords: ['AI governance cadence', 'model change notice', 'LLM', 'SR 11-7', 'release management'],
    demoRelevant: false,
    subTopic: 'ai-governance-board',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },

  // ── Vendor AI Contract ───────────────────────────────────────────────────────
  {
    code: 'X110',
    name: 'Vendor AI Contract Lacks Model Change Notice Clause',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'AI vendor contracts do not require advance notice when the vendor updates the underlying model, changes prompt templates, or retrains on new data. Banks, hospitals, and airlines discover model behavior changes in production — pricing shifts, triage reclassifications, scheduling anomalies — before any formal notification is received, making SR 11-7 model change management and FDA SaMD change control impossible to implement.',
    keywords: ['vendor AI contract', 'model change notice', 'SR 11-7', 'FDA SaMD', 'TPRM'],
    demoRelevant: true,
    subTopic: 'vendor-ai-contract',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X111',
    name: 'AI RFP Scores Demo Quality Not Workflow Fit',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'AI procurement RFPs evaluate vendors on benchmark accuracy, demo polish, and reference quality while omitting workflow integration depth, exception-handling coverage, and audit evidence capacity. Organizations select tools that perform well in controlled demonstrations but require extensive post-purchase customization to handle the edge cases that define operational workload.',
    keywords: ['AI procurement', 'RFP', 'vendor selection', 'workflow fit', 'TPRM'],
    demoRelevant: true,
    subTopic: 'vendor-ai-contract',
    verticals: ['airline', 'healthcare_provider', 'medtech', 'banking', 'retail'],
  },
  {
    code: 'X112',
    name: 'Vendor AI Contract Allows Customer Data For Model Training',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'AI vendor agreements do not restrict the vendor from using customer interaction data to improve shared foundation models or shared training datasets. Protected health information, proprietary credit data, and commercially sensitive operational data are inadvertently contributed to a shared model that also serves competitors, violating HIPAA BAA terms, banking confidentiality requirements, and customer data agreements.',
    keywords: ['vendor AI contract', 'data training clause', 'HIPAA BAA', 'TPRM', 'model training'],
    demoRelevant: true,
    subTopic: 'vendor-ai-contract',
    verticals: ['healthcare_provider', 'medtech', 'banking', 'airline', 'retail'],
  },
  {
    code: 'X113',
    name: 'AI Vendor Exit Rights Not Negotiated At Procurement',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Organizations procure proprietary AI platforms without negotiating model portability, data export rights, or fallback transition periods. When the vendor relationship deteriorates or economics change, the cost of migration — retraining on new platforms, re-validating models, rebuilding integrations — exceeds the theoretical switching benefit and creates effective lock-in.',
    keywords: ['AI vendor exit', 'data portability', 'lock-in', 'TPRM', 'vendor contract'],
    demoRelevant: true,
    subTopic: 'vendor-ai-contract',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X114',
    name: 'AI Pilot Success Measured On Biased Adoption Denominator',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'AI pilot success metrics are calculated as satisfaction or accuracy among users who actively tried the tool, omitting the eligible population who were given access but did not engage. Vendors and sponsors report high satisfaction rates while the majority of intended users never adopted the tool, masking a structural adoption failure before scale-up investment is approved.',
    keywords: ['AI pilot', 'adoption telemetry', 'adoption denominator', 'vendor contract', 'success metrics'],
    demoRelevant: true,
    subTopic: 'vendor-ai-contract',
    verticals: ['airline', 'healthcare_provider', 'medtech', 'banking', 'retail'],
  },

  // ── Model Explainability & Human Override ────────────────────────────────────
  {
    code: 'X115',
    name: 'Explainability Artifacts Satisfy Governance But Not Operators',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'Model explainability outputs — SHAP values, feature importance rankings, and confidence scores — are produced to satisfy SR 11-7 model risk documentation requirements but are not surfaced to operators in a form that communicates what changed in today\'s recommendation. Frontline staff cannot distinguish between a model recommendation that shifted due to new data, feature drift, or a vendor model update, reducing override quality and accountability.',
    keywords: ['explainability', 'SR 11-7', 'SHAP', 'model governance', 'operator decision'],
    demoRelevant: true,
    subTopic: 'explainability',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X116',
    name: 'Human Override Captured Without Override Rationale',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'Operational AI allows human reviewers to override model recommendations but only records the override action, not the reviewer\'s stated rationale or the downstream outcome. This prevents learning-loop improvements, limits SR 11-7 model validation retrospective analysis, and makes it impossible to distinguish expert correction from uninformed dismissal when auditing model performance.',
    keywords: ['human override', 'override rationale', 'SR 11-7', 'audit trail', 'model validation'],
    demoRelevant: true,
    subTopic: 'explainability',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X117',
    name: 'AI Incident Response Playbook Covers Infrastructure Not Models',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'Incident response playbooks define procedures for infrastructure outages, API failures, and data pipeline disruptions but have no documented steps for model rollback, prompt rollback, vendor model freeze requests, or emergency override when AI is producing materially incorrect decisions. Organizations respond to AI incidents by escalating through IT infrastructure channels that were not designed for behavioral model failures.',
    keywords: ['AI incident response', 'model rollback', 'vendor model freeze', 'operational AI', 'explainability'],
    demoRelevant: true,
    subTopic: 'explainability',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X118',
    name: 'AI Decision Ledger Omits Rejected Recommendations',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'AI decision ledgers record recommendations that were accepted and executed but do not systematically capture recommendations that were rejected or ignored by human reviewers. Retrospective accuracy analysis and SR 11-7 model performance reporting are therefore calculated only on the accepted population, systematically overstating model effectiveness and creating biased retraining data for the next model version.',
    keywords: ['AI decision ledger', 'audit trail', 'SR 11-7', 'rejected recommendations', 'model validation'],
    demoRelevant: true,
    subTopic: 'explainability',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X119',
    name: 'Explainability Layer Not Updated When Vendor Model Changes',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'Organizations build explainability wrappers around vendor AI models, but when the vendor silently updates the underlying model the explainability layer continues to reference old feature attribution logic. Operators and auditors receive explanations that no longer correspond to how the current model produces its output, invalidating SR 11-7 model documentation and creating false confidence in audit readiness.',
    keywords: ['explainability', 'vendor model update', 'model change notice', 'SR 11-7', 'audit trail'],
    demoRelevant: false,
    subTopic: 'explainability',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },

  // ── AI Value Measurement ─────────────────────────────────────────────────────
  {
    code: 'X120',
    name: 'AI Value Dashboard Reports Activity Not Business Outcomes',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'AI program dashboards report prompt counts, active users, models launched, and queries processed as primary success metrics rather than cycle-time reduction, revenue impact, risk reduction, or decision quality improvement. Activity metrics satisfy internal reporting requirements but cannot justify continued investment or demonstrate that AI contributed to measurable business outcomes as required by board-level AI governance reviews.',
    keywords: ['AI value measurement', 'adoption telemetry', 'business outcomes', 'AI governance board', 'ROI'],
    demoRelevant: true,
    subTopic: 'ai-value',
    verticals: ['airline', 'healthcare_provider', 'medtech', 'banking', 'retail'],
  },
  {
    code: 'X121',
    name: 'AI Productivity Gains Booked Before Rework Rates Stabilize',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'Finance teams book AI productivity savings in the quarter of deployment before escaped defect rates, QA review burden, and downstream rework cycles have stabilized. Net savings estimates are overstated by the cost of correcting AI-generated errors that are only discovered in subsequent periods, undermining business case credibility and future AI program funding.',
    keywords: ['AI productivity', 'escaped defects', 'rework rate', 'AI value measurement', 'business case'],
    demoRelevant: true,
    subTopic: 'ai-value',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X122',
    name: 'AI Business Case Omits Human Review Capacity Cost',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'AI business cases model the productivity gain from automated decisions but do not include the headcount, training, and tooling cost of the human review and exception-handling layer required to manage AI errors at scale. As AI volume scales, the exception queue grows faster than review capacity can absorb, producing a control deficit that was never modeled in the original investment case.',
    keywords: ['AI business case', 'human review capacity', 'exception handling', 'AI value measurement', 'control layer'],
    demoRelevant: true,
    subTopic: 'ai-value',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X123',
    name: 'AI Adoption Telemetry Not Tied To Decision Outcomes',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'AI adoption metrics track logins, recommendations served, and acceptance rates but are not joined to downstream decision outcomes — claim resolutions, credit performance, patient readmissions, or revenue realized. Organizations cannot distinguish AI contribution from external market recovery, seasonal trends, or coincident process changes, making attribution of business value to AI investments methodologically unsound.',
    keywords: ['adoption telemetry', 'decision outcomes', 'AI attribution', 'AI value measurement', 'champion-challenger'],
    demoRelevant: true,
    subTopic: 'ai-value',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X124',
    name: 'AI Program Renewal Based On Vendor-Supplied Metrics',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'AI program renewal decisions rely primarily on vendor-supplied performance reports rather than independently measured business outcome data. Vendors naturally optimize the metrics they report to support renewal, while the organization lacks the instrumentation to validate vendor claims against independent production data, leading to renewal of programs that are underperforming relative to their stated value.',
    keywords: ['AI value measurement', 'vendor metrics', 'adoption telemetry', 'TPRM', 'independent validation'],
    demoRelevant: false,
    subTopic: 'ai-value',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },

  // ── Vendor Consolidation Risk ────────────────────────────────────────────────
  {
    code: 'X125',
    name: 'Single-Vendor ERP Consolidation Destroys Contract Leverage',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'Consolidating core operations onto a single ERP or platform vendor reduces negotiating leverage at renewal as switching costs become prohibitive. Organizations that signed competitive deals during multi-vendor environments accept unfavorable price escalations, product roadmap changes, and support tier downgrades at renewal because the cost of re-platforming exceeds any near-term savings from switching.',
    keywords: ['vendor consolidation', 'ERP', 'contract leverage', 'TPRM', 'single vendor risk'],
    demoRelevant: true,
    subTopic: 'vendor-consolidation',
    verticals: ['airline', 'healthcare_provider', 'medtech', 'banking', 'retail'],
  },
  {
    code: 'X126',
    name: 'Platform Consolidation Outruns Internal Skills Transfer',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Vendor platform consolidation programs migrate workloads faster than internal IT and operations teams acquire proficiency in the new platform. When issues arise, organizations depend entirely on vendor support, and staff revert to shadow workarounds using legacy tools or spreadsheets to compensate for capability gaps, accumulating technical debt the consolidation was meant to eliminate.',
    keywords: ['vendor consolidation', 'skills transfer', 'shadow workaround', 'platform migration', 'TPRM'],
    demoRelevant: true,
    subTopic: 'vendor-consolidation',
    verticals: ['airline', 'healthcare_provider', 'medtech', 'banking', 'retail'],
  },
  {
    code: 'X127',
    name: 'Mega-Vendor Contract Signed Without Data Portability Clause',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Enterprise-scale vendor contracts for cloud platforms, AI services, and SaaS suites are executed without requiring the vendor to support structured data export in open, machine-readable formats within defined migration windows. Organizations discover at exit that their data is stored in proprietary formats, schema-less warehouses, or compressed archives that require vendor tooling to reconstruct, making migration economically and technically infeasible.',
    keywords: ['data portability', 'mega-vendor contract', 'lock-in', 'TPRM', 'cloud contract'],
    demoRelevant: true,
    subTopic: 'vendor-consolidation',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X128',
    name: 'Strategic Vendor Dependency Not Visible At Board Level',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Procurement and IT teams create material dependencies on single vendors through incremental contract expansions — adding modules, geographies, and data types — without triggering enterprise risk escalation or board-level concentration-risk review. The strategic dependency is only surfaced at the next renewal cycle, by which point the organization has no credible fallback and no negotiating leverage.',
    keywords: ['vendor concentration risk', 'TPRM', 'board visibility', 'strategic vendor', 'procurement governance'],
    demoRelevant: true,
    subTopic: 'vendor-consolidation',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X129',
    name: 'Consolidation Reduces Redundancy Below Resilience Floor',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Vendor consolidation programs eliminate redundant vendors and duplicate contracts to achieve cost savings but inadvertently reduce operational redundancy below the resilience requirements defined in business continuity and disaster recovery plans. A single-vendor failure, service outage, or regulatory action creates a single point of failure in a capability that previously had backup coverage.',
    keywords: ['vendor consolidation', 'operational resilience', 'business continuity', 'TPRM', 'single point of failure'],
    demoRelevant: true,
    subTopic: 'vendor-consolidation',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },

  // ── AI Tool Sprawl ───────────────────────────────────────────────────────────
  {
    code: 'X130',
    name: 'Business Units Procure AI Tools With Separate Controls',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'Individual business units procure copilots, chatbots, forecasting tools, optimization models, and generative AI assistants independently, each with separate vendor agreements, security reviews, and data-use policies. The resulting portfolio has no shared model inventory, no unified audit trail, and no consistent SR 11-7 or HIPAA BAA coverage — creating governance fragmentation that is invisible to the enterprise AI governance board.',
    keywords: ['AI tool sprawl', 'AI governance', 'model inventory', 'SR 11-7', 'procurement governance'],
    demoRelevant: true,
    subTopic: 'ai-sprawl',
    verticals: ['airline', 'healthcare_provider', 'medtech', 'banking', 'retail'],
  },
  {
    code: 'X131',
    name: 'AI Sprawl Duplicates Governance Burden Without Shared Infrastructure',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Each independently procured AI tool requires its own security assessment, privacy impact analysis, model risk review, and vendor due-diligence process. Without a shared governance infrastructure — common intake form, shared model registry, reusable TPRM templates — the overhead of reviewing dozens of AI tools consumes risk and compliance capacity that cannot scale proportionally with the rate of AI procurement.',
    keywords: ['AI tool sprawl', 'governance overhead', 'TPRM', 'model registry', 'AI governance'],
    demoRelevant: true,
    subTopic: 'ai-sprawl',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X132',
    name: 'Overlapping AI Vendors Create Management Overhead Exceeding Optionality Value',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'Organizations maintain multiple AI vendors for substantially overlapping use cases — three copilot tools, two forecasting platforms, two NLP vendors — reasoning that optionality justifies the cost. The vendor management overhead, integration complexity, and governance duplication consistently exceeds the strategic value of optionality for organizations that lack the internal AI platform engineering capacity to actively exploit multiple vendor relationships.',
    keywords: ['AI vendor management', 'AI tool sprawl', 'vendor consolidation', 'TPRM', 'platform strategy'],
    demoRelevant: true,
    subTopic: 'ai-sprawl',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X133',
    name: 'AI Platform Standardization Loses Executive Sponsorship Before Completion',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'AI platform standardization initiatives begin with strong executive sponsorship and a mandate to consolidate AI tooling onto a common infrastructure, but lose sponsorship momentum mid-execution as the sponsor transitions, priorities shift, or early migration timelines slip. Business units that have not yet migrated exploit the sponsorship gap to retain their independent AI tools, leaving the organization with a partially consolidated estate that captures consolidation costs without delivering consolidation benefits.',
    keywords: ['AI platform standardization', 'AI sprawl', 'executive sponsorship', 'kill criteria', 'AI governance'],
    demoRelevant: true,
    subTopic: 'ai-sprawl',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X134',
    name: 'Copilot Proliferation Without Prompt Governance',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Organizations deploy LLM-based copilot tools across business units without establishing prompt governance standards — no approved prompt library, no prohibited topic taxonomy, and no mechanism to track what prompts are in production use. Individual employees craft prompts that expose protected data, generate non-compliant advice, or produce outputs that conflict with official policy without any governance review.',
    keywords: ['LLM copilot', 'prompt governance', 'AI sprawl', 'HIPAA', 'AI tool sprawl'],
    demoRelevant: true,
    subTopic: 'ai-sprawl',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },

  // ── AI Training Data & Fairness ──────────────────────────────────────────────
  {
    code: 'X135',
    name: 'AI Models Learn And Automate Past Service Inequities',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'AI models trained on historical operational decisions inherit and automate patterns of unequal service delivery, access, or pricing that reflect past discriminatory practices or systemic resource inequities. Credit underwriting models trained on historical approval data, clinical scheduling models trained on historical access patterns, and pricing models trained on historical transaction data replicate inequitable outcomes at scale and at speed, triggering CFPB disparate-impact scrutiny, CMS equity requirements, and DOT unfair pricing enforcement.',
    keywords: ['AI fairness', 'historical bias', 'CFPB disparate impact', 'DOT unfair pricing', 'fairness drift'],
    demoRelevant: true,
    subTopic: 'ai-fairness',
    verticals: ['banking', 'healthcare_provider', 'airline', 'retail', 'medtech'],
  },
  {
    code: 'X136',
    name: 'Feature Store Reuses Data Without High-Risk Model Safety Certification',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'Centralized feature stores make it easy for model teams to reuse precomputed features across multiple AI projects, but features certified as safe for analytics or low-risk recommendation models are reused in high-risk credit, clinical, or safety-critical models without reassessment. A feature that is safe for product recommendation is not necessarily safe for underwriting or patient triage, and the feature store lacks a risk tier label that would trigger re-review.',
    keywords: ['feature store', 'AI risk tiering', 'SR 11-7', 'FDA SaMD', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-fairness',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X137',
    name: 'AI Training Data Captures Historical Bias In Customer Treatment',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'AI personalization, service-recovery, and retention models are trained on historical customer interaction data that reflects patterns of differential treatment — longer hold times, fewer proactive outreach attempts, and lower service-recovery generosity — correlated with demographic or behavioral proxies. Fairness drift post-deployment is difficult to detect because the ground truth labels used for retraining contain the same biased outcomes that initial model training introduced.',
    keywords: ['AI fairness', 'training data bias', 'fairness drift', 'CFPB', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-fairness',
    verticals: ['banking', 'healthcare_provider', 'airline', 'retail', 'medtech'],
  },
  {
    code: 'X138',
    name: 'AI Personalization Proxy Bias Creates Discriminatory Pricing Signal',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      'AI personalization and dynamic pricing models use proxy features — loyalty tier, device type, zip code, and session behavior — that are correlated with protected demographic characteristics. The model achieves commercial optimization objectives but produces a pricing or offer pattern that constitutes unlawful discrimination under CFPB fair lending rules, DOT unfair and deceptive pricing regulations, and CMS non-discrimination requirements, without any prohibited feature explicitly appearing in the model input.',
    keywords: ['proxy bias', 'DOT unfair pricing', 'CFPB disparate impact', 'AI personalization', 'fairness drift'],
    demoRelevant: true,
    subTopic: 'ai-fairness',
    verticals: ['airline', 'banking', 'retail', 'healthcare_provider', 'medtech'],
  },
  {
    code: 'X139',
    name: 'Fairness Monitoring Stops At Launch And Is Not Continuous',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'AI fairness assessments are conducted as part of pre-launch validation but are not scheduled as ongoing monitoring activities post-deployment. Population composition shifts, seasonal data patterns, and model updates can introduce fairness drift that a launch-only assessment cannot detect, leaving organizations exposed to CFPB disparate-impact findings, CMS equity audits, and DOT enforcement actions months after a model that passed initial review begins producing disparate outcomes.',
    keywords: ['fairness drift', 'model drift', 'CFPB disparate impact', 'continuous monitoring', 'AI fairness'],
    demoRelevant: true,
    subTopic: 'ai-fairness',
    verticals: ['banking', 'healthcare_provider', 'airline', 'retail', 'medtech'],
  },

  // ── Additional Cross-Cutting Patterns ────────────────────────────────────────
  {
    code: 'X140',
    name: 'GenAI Output Not Routed Through Quality Gate Before Operational Use',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      'Generative AI outputs — draft clinical summaries, credit memo narratives, maintenance work orders, and customer-facing communications — are routed directly into operational workflows without a structured quality gate that checks for factual accuracy, prohibited content, or regulatory compliance. Reviewers treat AI-generated content as drafts that save time rather than as high-error-rate outputs that require systematic verification, causing regulated communications to exit the organization without adequate human oversight.',
    keywords: ['GenAI', 'output quality gate', 'human oversight', 'HIPAA', 'AI governance'],
    demoRelevant: true,
    subTopic: 'ai-governance-board',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X141',
    name: 'AI Drift Detection Configured For Statistical Metrics Not Business Metrics',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'AI model monitoring systems detect input feature drift and prediction distribution shift using statistical control charts, but do not monitor the business metrics that the model was deployed to improve — claim denial rates, credit default rates, on-time performance, or patient readmission. Models can produce statistically stable outputs that are commercially or clinically degraded because the monitoring layer was not connected to the operational outcome it was designed to influence.',
    keywords: ['model drift', 'champion-challenger', 'business outcome monitoring', 'SR 11-7', 'AI value measurement'],
    demoRelevant: true,
    subTopic: 'ai-value',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X142',
    name: 'AI Model Validation Independent Of Model Owner But Not Of Vendor',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Organizations establish model validation functions that are organizationally independent of the internal model development team to satisfy SR 11-7 independent review requirements, but the validation team has no authority or tooling to independently evaluate vendor-managed AI models. Vendor AI receives a lighter review — vendor documentation and demo evidence — while the organization assumes model risk without the same validation depth applied to internally built models.',
    keywords: ['model validation', 'SR 11-7', 'independent validation', 'vendor AI', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-inventory',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X143',
    name: 'AI Regulatory Horizon Scanning Not Linked To Model Inventory',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'Compliance and legal teams monitor emerging AI regulation — EU AI Act, proposed NIST AI RMF adoptions, state-level algorithmic accountability laws, and FDA digital health guidance — but do not map new requirements to models in the current inventory to assess which models will require remediation. New regulatory obligations arrive at the model team as surprises rather than as planned engineering work, creating last-minute compliance cycles.',
    keywords: ['AI regulation', 'EU AI Act', 'NIST AI RMF', 'model inventory', 'regulatory horizon scanning'],
    demoRelevant: true,
    subTopic: 'ai-governance-board',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X144',
    name: 'LLM Hallucination Rate Not Tracked As Operational KPI',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'Organizations deploy LLM-based tools for patient documentation, credit analysis, regulatory filings, and customer correspondence without establishing a hallucination rate KPI that is monitored in production. Error rates in AI-generated content are discovered episodically through downstream complaints or audit findings rather than being proactively measured against an acceptable error tolerance threshold, making it impossible to assess whether the tool is operating within governed risk tolerance.',
    keywords: ['LLM', 'hallucination rate', 'GenAI', 'AI governance', 'kill criteria'],
    demoRelevant: true,
    subTopic: 'ai-governance-board',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X145',
    name: 'AI Program Scope Creep Bypasses Governance Re-Entry',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'AI programs approved for a specific use case and risk tier expand their scope — broader data access, new decision types, additional user populations — through incremental change requests that are treated as feature enhancements rather than material changes requiring governance re-entry. A model approved for low-risk recommendation gradually becomes an operational decision-making tool without the escalation to SR 11-7 model risk review, HIPAA BAA reassessment, or FDA SaMD reclassification that the expanded scope would require.',
    keywords: ['AI scope creep', 'SR 11-7', 'FDA SaMD', 'AI governance', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-governance-board',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X146',
    name: 'Predictive AI Confidence Score Not Communicated With Recommendation',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'Operational AI tools surface recommendations to clinicians, underwriters, analysts, and operators without displaying the model confidence score or the data freshness that informed the recommendation. Decision-makers apply equal weight to high-confidence and low-confidence recommendations because the interface does not differentiate between them, leading to over-reliance on uncertain model outputs and under-reliance on cases where the model has strong signal.',
    keywords: ['predictive AI', 'confidence score', 'explainability', 'human override', 'operational AI'],
    demoRelevant: true,
    subTopic: 'explainability',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X147',
    name: 'AI Vendor Subprocessor Chain Not Visible In TPRM Review',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'TPRM reviews assess the primary AI vendor but do not map the vendor\'s AI subprocessors — cloud GPU providers, foundation model licensors, data annotation vendors, and fine-tuning services — that have access to or process customer data as part of the AI service delivery chain. Breaches, regulatory actions, or service failures at a subprocessor create unexpected liability and compliance exposure for the contracting organization.',
    keywords: ['TPRM', 'AI subprocessor', 'vendor contract', 'HIPAA BAA', 'third-party risk'],
    demoRelevant: true,
    subTopic: 'vendor-ai-contract',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X148',
    name: 'AI Champion-Challenger Process Not Applied To Vendor Model Updates',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Internal model development teams are required to run champion-challenger evaluations before promoting a new model version to production, but vendor-initiated model updates — fine-tuning releases, foundation model version bumps, and prompt template changes — bypass the champion-challenger process because they arrive as product updates rather than model deployments. Performance regressions from vendor model changes are discovered in production rather than during controlled evaluation.',
    keywords: ['champion-challenger', 'model validation', 'vendor model update', 'SR 11-7', 'model change notice'],
    demoRelevant: true,
    subTopic: 'vendor-ai-contract',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
  {
    code: 'X149',
    name: 'AI Skills Gap Concentrated In Governance Not Delivery',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'Organizations invest heavily in AI delivery talent — data scientists, ML engineers, and AI product managers — but under-invest in AI governance capacity including model risk validators, AI audit specialists, and responsible AI program managers. Delivery outpaces governance, creating a model portfolio that is technically functional but poorly documented, inadequately monitored, and unable to withstand regulatory scrutiny under SR 11-7, FDA SaMD, or emerging EU AI Act requirements.',
    keywords: ['AI governance', 'AI skills gap', 'model risk management', 'SR 11-7', 'EU AI Act'],
    demoRelevant: true,
    subTopic: 'ai-governance-board',
    verticals: ['banking', 'healthcare_provider', 'medtech', 'airline', 'retail'],
  },
];

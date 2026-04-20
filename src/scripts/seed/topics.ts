import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

// Pack L · topic catalog v1 seed. Content is my best-guess until the full
// 951-line spec lands at /abarva-pack-topics-deliverables.md — reconcile
// titles + diagnostic questions against spec once available. Schema shape
// is authoritative; content is reconcilable.

interface TopicSeed {
  topic_key: string;
  title: string;
  tagline: string;
  industries: string[];
  typical_triggers: Array<{ phrase: string; confidence: 'high' | 'medium' | 'low' }>;
  key_patterns: string[];
  vendor_landscape: Record<string, string[]>;
  diagnostic_questions: Array<{ id: string; question: string; phase: number }>;
  common_contradictions: string[];
  phase_playbook: Record<string, string>;
  typical_deliverables: string[];
  success_signals: string[];
  failure_modes: string[];
  source_attribution: string;
}

const TOPICS: TopicSeed[] = [
  {
    topic_key: 'ai_governance',
    title: 'AI Governance & Risk',
    tagline: 'Build the governance layer before the model surface gets bigger than the oversight.',
    industries: ['HEALTHCARE_IDN', 'FINSERV', 'RETAIL', 'GENERAL'],
    typical_triggers: [
      { phrase: 'AI governance', confidence: 'high' },
      { phrase: 'responsible AI', confidence: 'high' },
      { phrase: 'model risk', confidence: 'high' },
      { phrase: 'AI review board', confidence: 'medium' },
      { phrase: 'model inventory', confidence: 'medium' },
    ],
    key_patterns: ['F001', 'F004', 'F012'],
    vendor_landscape: {
      governance: ['Credo AI', 'Watershed', 'ServiceNow'],
      observability: ['Datadog', 'Arize AI'],
      compliance: ['Saifr', 'ComplyAdvantage'],
    },
    diagnostic_questions: [
      { id: 'gov-1', question: 'Who owns model approval today — single committee or ad-hoc?', phase: 0 },
      { id: 'gov-2', question: 'How many production AI use cases are in your current inventory? Best guess if not tracked.', phase: 1 },
      { id: 'gov-3', question: 'When a model fails a fairness check, what is the actual rollback path — documented or tribal?', phase: 1 },
      { id: 'gov-4', question: 'Which regulation is the forcing function — SR 11-7, EU AI Act, state privacy, or internal policy?', phase: 0 },
      { id: 'gov-5', question: 'What is the measured gap between policy on paper and practice in shipped models?', phase: 1 },
    ],
    common_contradictions: [
      'Governance policy exists but model inventory is not maintained',
      'Review board approves models but has no sunset authority',
      'Bias testing cadence differs by business unit',
    ],
    phase_playbook: {
      '0': 'Name the forcing function. Identify who has the pen on policy vs practice.',
      '1': 'Quantify the gap: models in production vs models in the governance register.',
      '2': 'Propose one of three governance patterns — centralized review, federated with escalation, or risk-tiered with automated gates.',
      '3': 'Roll out in phases: register all models, add pre-deployment gates, add ongoing monitoring.',
      '4': 'Measure review cycle time, % of models with owner, fairness testing coverage.',
    },
    typical_deliverables: ['governance_charter', 'model_inventory_audit', 'review_board_operating_model', 'policy_to_practice_gap_analysis'],
    success_signals: ['Model inventory coverage > 90%', 'Review cycle time < 10 business days', 'Zero models in production without named owner'],
    failure_modes: ['Governance body becomes bottleneck — engineering bypasses', 'Policy written but no enforcement mechanism', 'Risk tiering too coarse — every model treated as high-risk'],
    source_attribution: 'AbarVa v1 · reconcile with /abarva-pack-topics-deliverables.md',
  },
  {
    topic_key: 'cost_to_income_banking',
    title: 'Cost-to-Income Transformation',
    tagline: 'The banking benchmark that drives every transformation conversation — and the one most programs fail to move.',
    industries: ['FINSERV'],
    typical_triggers: [
      { phrase: 'cost-to-income', confidence: 'high' },
      { phrase: 'CTI ratio', confidence: 'high' },
      { phrase: 'operating leverage', confidence: 'medium' },
      { phrase: 'run the bank', confidence: 'medium' },
    ],
    key_patterns: ['F001', 'F007', 'F013'],
    vendor_landscape: {
      core_modernization: ['Oracle', 'SAP', 'Temenos'],
      intelligent_automation: ['UiPath', 'Automation Anywhere'],
      ai_productivity: ['Hebbia', 'Glean', 'GitHub Copilot'],
    },
    diagnostic_questions: [
      { id: 'cti-1', question: 'Current CTI ratio vs top-quartile peer in your segment?', phase: 0 },
      { id: 'cti-2', question: 'Which of operations / tech / risk / sales drives the largest cost base?', phase: 1 },
      { id: 'cti-3', question: 'How much of tech spend is run-the-bank vs change-the-bank, and how is it trending?', phase: 1 },
      { id: 'cti-4', question: 'Have you quantified AI productivity gains by function, or is it still narrative?', phase: 1 },
      { id: 'cti-5', question: 'Is the savings target run-rate or cumulative, and over what horizon?', phase: 0 },
    ],
    common_contradictions: [
      'Headcount reduction announced but run-the-bank spend not indexed to it',
      'Digital revenue grows but branch cost base unchanged',
      'Automation pilot ROI ≠ scaled ROI',
    ],
    phase_playbook: {
      '0': 'Baseline CTI, segment benchmark, stakeholder alignment on top-quartile target.',
      '1': 'Decompose cost base by function. Identify the 3 programs worth 2+ CTI points.',
      '2': 'Design operating-model targets + technology enablers. Propose core modernization tradeoffs.',
      '3': 'Track program-level run-rate. Watch for offsets that erase gains.',
      '4': 'Verify year-one run-rate impact. Project out-year trajectory.',
    },
    typical_deliverables: ['cti_baseline', 'cost_base_decomposition', 'target_operating_model', 'program_portfolio'],
    success_signals: ['CTI ratio improves by ≥ 200 bps in year one', 'Run-the-bank % declining year over year', 'Top 5 programs each moving CTI independently'],
    failure_modes: ['Target headline set without program-level math', 'Savings offset by growth-related cost additions', 'Change-the-bank funding cut to hit short-term CTI — long-term CTI suffers'],
    source_attribution: 'AbarVa v1 · reconcile with /abarva-pack-topics-deliverables.md',
  },
  {
    topic_key: 'rcm_healthcare',
    title: 'Revenue Cycle Management',
    tagline: 'The operational spine of every health system — where AI has the shortest payback and the loudest stakeholder politics.',
    industries: ['HEALTHCARE_IDN'],
    typical_triggers: [
      { phrase: 'revenue cycle', confidence: 'high' },
      { phrase: 'RCM', confidence: 'high' },
      { phrase: 'denial rate', confidence: 'high' },
      { phrase: 'AR days', confidence: 'medium' },
      { phrase: 'prior auth', confidence: 'medium' },
    ],
    key_patterns: ['F002', 'F005', 'F009'],
    vendor_landscape: {
      coding: ['3M 360 Encompass', 'Epic'],
      denial_management: ['Waystar', 'Olive (legacy)'],
      prior_auth: ['Cohere Health', 'Olive'],
      autonomous_ar: ['AKASA', 'Notable'],
    },
    diagnostic_questions: [
      { id: 'rcm-1', question: 'Initial denial rate today vs MGMA median for your bed-size?', phase: 0 },
      { id: 'rcm-2', question: 'AR days by payer — commercial vs Medicare vs managed Medicaid?', phase: 1 },
      { id: 'rcm-3', question: 'Are prior-auth submissions centralized or service-line-owned?', phase: 1 },
      { id: 'rcm-4', question: 'Have you quantified the denial-to-appeal conversion rate by denial reason code?', phase: 1 },
      { id: 'rcm-5', question: 'What is the current coder-to-encounter ratio, and how has it trended?', phase: 0 },
    ],
    common_contradictions: [
      'Denial rate falling but write-offs climbing',
      'AR days improving overall but worst payer segment widening',
      'Coder productivity rises but CMI (case-mix index) stagnant',
    ],
    phase_playbook: {
      '0': 'Anchor to denial rate, AR days, cash collection velocity.',
      '1': 'Decompose by payer, service line, denial reason. Name the 20% that drives 80%.',
      '2': 'Options: augment with autonomous AR, replace coding workflow, or both. Trade-off risk vs payback.',
      '3': 'Phase rollout by service line. Watch for cross-functional friction.',
      '4': 'Verify net revenue impact, not just operational KPIs.',
    },
    typical_deliverables: ['rcm_baseline', 'denial_reason_analysis', 'payer_segmentation', 'vendor_shortlist'],
    success_signals: ['Initial denial rate drops ≥ 200 bps', 'AR days < 45', 'Net collection rate > 95%'],
    failure_modes: ['Vendor claims modernize but payer contracts unchanged', 'Autonomous AR learns the wrong denials', 'Coding accuracy up but DRG optimization opportunity left on table'],
    source_attribution: 'AbarVa v1 · reconcile with /abarva-pack-topics-deliverables.md',
  },
  {
    topic_key: 'data_readiness',
    title: 'Data Readiness for AI',
    tagline: 'The precondition that decides whether your AI program compounds or collapses.',
    industries: ['HEALTHCARE_IDN', 'FINSERV', 'RETAIL', 'GENERAL'],
    typical_triggers: [
      { phrase: 'data readiness', confidence: 'high' },
      { phrase: 'data foundation', confidence: 'high' },
      { phrase: 'data quality', confidence: 'medium' },
      { phrase: 'data lake', confidence: 'low' },
    ],
    key_patterns: ['F003', 'F006'],
    vendor_landscape: {
      lakehouse: ['Snowflake', 'Databricks'],
      observability: ['Monte Carlo', 'Datadog'],
      catalog: ['dbt', 'Informatica', 'Alation'],
      governance: ['Collibra', 'Privacera'],
    },
    diagnostic_questions: [
      { id: 'dr-1', question: 'Do the top 3 AI use cases depend on the same data sources, or different ones?', phase: 0 },
      { id: 'dr-2', question: 'What is the median data freshness for decisioning models — minutes, hours, days?', phase: 1 },
      { id: 'dr-3', question: 'Who owns data quality at the source system level — centralized data team, or business owners?', phase: 1 },
      { id: 'dr-4', question: 'What % of planned AI use cases have passed a data-readiness review before build?', phase: 0 },
    ],
    common_contradictions: [
      'Data platform spend rising but AI use-case velocity unchanged',
      'Quality rules defined but not enforced on producers',
      'Lakehouse migration complete but feature store still not in production',
    ],
    phase_playbook: {
      '0': 'Map top AI use cases to their data dependencies. Identify shared vs isolated.',
      '1': 'Score each dependency: availability, freshness, quality, lineage, governance.',
      '2': 'Prioritize remediation by use-case value × readiness gap.',
      '3': 'Stand up feature store, lineage, and contracts incrementally.',
      '4': 'Verify AI use-case cycle time improvement post-remediation.',
    },
    typical_deliverables: ['data_dependency_map', 'readiness_scorecard', 'remediation_roadmap'],
    success_signals: ['New AI use case moves from design to production in < 90 days', 'Data incidents affecting models < 1 per month', 'Feature reuse across use cases > 30%'],
    failure_modes: ['Platform built but adoption low — still shadow SQL', 'Readiness reviewed for some use cases, skipped for others', 'Quality alerts flood ops without SLA on remediation'],
    source_attribution: 'AbarVa v1 · reconcile with /abarva-pack-topics-deliverables.md',
  },
  {
    topic_key: 'vendor_rationalization',
    title: 'Vendor Rationalization',
    tagline: 'Overlap kills compounding. Rationalize before you scale AI.',
    industries: ['HEALTHCARE_IDN', 'FINSERV', 'RETAIL', 'GENERAL'],
    typical_triggers: [
      { phrase: 'vendor rationalization', confidence: 'high' },
      { phrase: 'vendor overlap', confidence: 'high' },
      { phrase: 'too many tools', confidence: 'medium' },
      { phrase: 'SaaS sprawl', confidence: 'medium' },
    ],
    key_patterns: ['F008', 'F011'],
    vendor_landscape: {},
    diagnostic_questions: [
      { id: 'vr-1', question: 'How many AI/analytics vendors are currently in paid production?', phase: 0 },
      { id: 'vr-2', question: 'Which capabilities have ≥ 2 overlapping vendors?', phase: 1 },
      { id: 'vr-3', question: 'What is the typical contract cycle — multi-year with auto-renew, or single-year?', phase: 0 },
      { id: 'vr-4', question: 'Have you quantified the integration + support tax per additional vendor?', phase: 1 },
    ],
    common_contradictions: [
      'Mandate to rationalize, but new vendor added for same capability',
      'Vendor consolidation announced but orphaned integrations not decommissioned',
    ],
    phase_playbook: {
      '0': 'Inventory all AI/analytics vendors. Tag by capability + business unit + spend.',
      '1': 'Identify overlap clusters. Score each by switching cost vs consolidation benefit.',
      '2': 'Propose ranked rationalization list: sunset, consolidate, retain.',
      '3': 'Execute in order of lowest risk × highest savings.',
      '4': 'Verify spend reduction + complexity reduction (integration count).',
    },
    typical_deliverables: ['vendor_inventory', 'overlap_heatmap', 'rationalization_roadmap'],
    success_signals: ['Vendor count down ≥ 20%', 'Integration count down proportionally', 'Cost per capability down year over year'],
    failure_modes: ['Consolidation on paper, shadow tools persist', 'Savings not net of exit costs', 'Politically-sponsored vendor retained despite overlap'],
    source_attribution: 'AbarVa v1 · reconcile with /abarva-pack-topics-deliverables.md',
  },
  {
    topic_key: 'agent_atlas',
    title: 'Agent Atlas & Orchestration',
    tagline: 'Agents need an atlas. Without it, you get a zoo with no map.',
    industries: ['HEALTHCARE_IDN', 'FINSERV', 'RETAIL', 'GENERAL'],
    typical_triggers: [
      { phrase: 'agent atlas', confidence: 'high' },
      { phrase: 'multi-agent', confidence: 'high' },
      { phrase: 'agent orchestration', confidence: 'high' },
      { phrase: 'agent sprawl', confidence: 'medium' },
    ],
    key_patterns: ['F004', 'F010'],
    vendor_landscape: {
      orchestration: ['LangGraph', 'Temporal'],
      observability: ['Arize AI', 'Datadog', 'Honeycomb'],
      runtime: ['Anthropic', 'OpenAI', 'Microsoft Copilot Studio'],
    },
    diagnostic_questions: [
      { id: 'aa-1', question: 'How many agents are in production today, and are any of them catalogued?', phase: 0 },
      { id: 'aa-2', question: 'What percentage of agent runs are traced with token + latency attribution?', phase: 1 },
      { id: 'aa-3', question: 'Is there a shared orchestration framework, or does each team ship its own?', phase: 0 },
      { id: 'aa-4', question: 'How are agents deprecated — is there a sunset lifecycle, or do they linger?', phase: 1 },
    ],
    common_contradictions: [
      'Agent count grows but cost per outcome not tracked',
      'Orchestrator standardized but teams still bypass with custom scripts',
    ],
    phase_playbook: {
      '0': 'Inventory agents. Name their business outcomes and invocation cadence.',
      '1': 'Score observability coverage. Identify which agents have cost/latency/quality telemetry.',
      '2': 'Design the atlas: shared runtime, shared observability, shared sunset policy.',
      '3': 'Migrate agents into the atlas in order of business criticality.',
      '4': 'Verify cost per outcome + agent lifecycle hygiene.',
    },
    typical_deliverables: ['agent_inventory', 'orchestration_blueprint', 'observability_standards'],
    success_signals: ['100% of production agents in atlas', 'Cost per outcome trending down', 'Agent sunset cadence tracked'],
    failure_modes: ['Atlas built but adoption patchy', 'Observability retrofitted in-name-only', 'Framework chosen top-down without team input'],
    source_attribution: 'AbarVa v1 · reconcile with /abarva-pack-topics-deliverables.md',
  },
  {
    topic_key: 'genai_productivity',
    title: 'GenAI Productivity at Scale',
    tagline: 'Pilots prove; scaling requires a measurement system pilots never built.',
    industries: ['HEALTHCARE_IDN', 'FINSERV', 'RETAIL', 'GENERAL'],
    typical_triggers: [
      { phrase: 'copilot rollout', confidence: 'high' },
      { phrase: 'GenAI adoption', confidence: 'high' },
      { phrase: 'productivity measurement', confidence: 'medium' },
      { phrase: 'AI ROI', confidence: 'medium' },
    ],
    key_patterns: ['F004', 'F013'],
    vendor_landscape: {
      horizontal: ['Microsoft Copilot', 'GitHub Copilot', 'Glean', 'Notion AI'],
      vertical: ['Hebbia', 'Harvey', 'Abridge', 'Nuance DAX'],
    },
    diagnostic_questions: [
      { id: 'gp-1', question: 'What is the current active-user rate for your largest GenAI rollout?', phase: 0 },
      { id: 'gp-2', question: 'How is productivity gain measured — self-reported, observed task time, or output volume?', phase: 1 },
      { id: 'gp-3', question: 'Is there a control group that did not get the tool, for counterfactual measurement?', phase: 1 },
      { id: 'gp-4', question: 'Have you priced the cost of GenAI seat + support per user vs measured output delta?', phase: 1 },
    ],
    common_contradictions: [
      'High self-reported productivity, low observed output change',
      'Seat license growing but active-user rate declining',
      'ROI reported as cost savings, but headcount unchanged',
    ],
    phase_playbook: {
      '0': 'Name the target outcome — hours saved, quality lift, volume lift. Pick one.',
      '1': 'Baseline pre-rollout output metrics. Design counterfactual cohort.',
      '2': 'Scale roll-out in waves with measurement rituals built in.',
      '3': 'Monitor active-user + output deltas weekly. Kill tools that plateau.',
      '4': 'Verify ROI with output-based (not self-reported) evidence.',
    },
    typical_deliverables: ['productivity_baseline', 'rollout_plan', 'measurement_framework'],
    success_signals: ['Active-user rate > 60%', 'Measured output delta attributable to tool', 'Seat-to-outcome ratio improving'],
    failure_modes: ['Self-reported survey methodology masks no-impact cohort', 'Rollout without measurement — sunk cost bias sets in', 'Seat count driven by procurement rather than demonstrated need'],
    source_attribution: 'AbarVa v1 · reconcile with /abarva-pack-topics-deliverables.md',
  },
  {
    topic_key: 'cdo_transition',
    title: 'CDO / CAIO Transition',
    tagline: 'The role transition pattern that sinks most programs in the first 18 months.',
    industries: ['HEALTHCARE_IDN', 'FINSERV', 'RETAIL', 'GENERAL'],
    typical_triggers: [
      { phrase: 'new CDO', confidence: 'high' },
      { phrase: 'CAIO', confidence: 'high' },
      { phrase: 'chief data officer', confidence: 'high' },
      { phrase: 'leadership change', confidence: 'medium' },
    ],
    key_patterns: ['F001', 'F014'],
    vendor_landscape: {},
    diagnostic_questions: [
      { id: 'cdo-1', question: 'When did the CDO/CAIO start, and what is their 12-month mandate from the CEO?', phase: 0 },
      { id: 'cdo-2', question: 'Which prior programs are continued vs sunset under the new mandate?', phase: 0 },
      { id: 'cdo-3', question: 'Is there budget attached to the mandate, or is it a cost-center role expected to fund via savings?', phase: 1 },
      { id: 'cdo-4', question: 'Are peers (CIO, CTO, CHRO) aligned on the mandate, or competing?', phase: 0 },
    ],
    common_contradictions: [
      'Mandate says "transform data" but budget is expected from operating savings',
      'Prior flagship program continued out of political cost but no longer strategic',
    ],
    phase_playbook: {
      '0': 'Understand the mandate as written + as negotiated. Name the gap.',
      '1': 'Audit inherited portfolio. Rank by strategic fit × momentum × political cost.',
      '2': 'Propose the rationalized portfolio + new programs aligned with mandate.',
      '3': 'Execute in order of lowest political risk × highest impact.',
      '4': 'Measure against the mandate language, not against operational proxies.',
    },
    typical_deliverables: ['mandate_analysis', 'portfolio_audit', 'ninety_day_plan'],
    success_signals: ['Programs aligned to mandate > 80%', 'Stakeholder alignment score rising', 'New flagship program launched within 120 days'],
    failure_modes: ['Everything continues because sunset is politically expensive', 'New CDO ships strategy doc with no program-level commitment', 'Mandate retroactively revised after early mis-steps'],
    source_attribution: 'AbarVa v1 · reconcile with /abarva-pack-topics-deliverables.md',
  },
  {
    topic_key: 'retail_ai_personalization',
    title: 'Retail AI Personalization',
    tagline: 'Personalization at retail scale needs an architecture — not a vendor shootout.',
    industries: ['RETAIL'],
    typical_triggers: [
      { phrase: 'personalization', confidence: 'high' },
      { phrase: 'recommendation engine', confidence: 'high' },
      { phrase: 'search relevance', confidence: 'medium' },
      { phrase: 'customer experience', confidence: 'low' },
    ],
    key_patterns: ['F006', 'F011'],
    vendor_landscape: {
      recommendation: ['Bloomreach', 'Dynamic Yield', 'Algolia', 'Constructor.io'],
      experimentation: ['Dynamic Yield', 'Nosto'],
      analytics: ['Analytic Partners', 'Persado'],
    },
    diagnostic_questions: [
      { id: 'rp-1', question: 'What fraction of revenue is currently served by any personalization layer?', phase: 0 },
      { id: 'rp-2', question: 'Are the online + in-store identity stitched, or separate?', phase: 1 },
      { id: 'rp-3', question: 'What lift has been observed from current personalization, and is it statistically tested?', phase: 1 },
      { id: 'rp-4', question: 'Who owns the experimentation calendar — marketing, product, engineering?', phase: 0 },
    ],
    common_contradictions: [
      'Personalization lift claimed but not A/B tested',
      'Vendor recommends all products but conversion lift flat for low-margin SKUs',
    ],
    phase_playbook: {
      '0': 'Baseline current personalization coverage + lift + identity stitch quality.',
      '1': 'Decompose revenue by channel × customer segment × journey stage.',
      '2': 'Design: identity layer first, then experimentation, then model surface.',
      '3': 'Roll out in priority journey stages. Measure margin-weighted lift.',
      '4': 'Verify incremental margin, not just conversion lift.',
    },
    typical_deliverables: ['personalization_audit', 'architecture_blueprint', 'experimentation_plan'],
    success_signals: ['Personalized revenue share rising quarter over quarter', 'Margin-weighted lift positive across segments', 'Identity match rate > 70%'],
    failure_modes: ['Vendor tunnel — architecture fits vendor instead of journey', 'Top-funnel lift high, bottom-funnel lift zero', 'Identity stitch shallow — store anonymous, online known'],
    source_attribution: 'AbarVa v1 · reconcile with /abarva-pack-topics-deliverables.md',
  },
  {
    topic_key: 'wealth_advisor_ai',
    title: 'Wealth Advisor AI',
    tagline: 'Advisor productivity is the wealth management AI wedge — but compliance is the moat or the moat-breaker.',
    industries: ['FINSERV'],
    typical_triggers: [
      { phrase: 'advisor productivity', confidence: 'high' },
      { phrase: 'wealth management AI', confidence: 'high' },
      { phrase: 'RIA', confidence: 'medium' },
      { phrase: 'next best action', confidence: 'medium' },
    ],
    key_patterns: ['F004', 'F009'],
    vendor_landscape: {
      meeting_capture: ['Jump', 'Zocks', 'Observe.AI'],
      portfolio: ['BlackRock Aladdin', 'SS&C'],
      compliance: ['Saifr', 'Behavox'],
    },
    diagnostic_questions: [
      { id: 'wa-1', question: 'Current advisor:client ratio, and is it the binding constraint on AUM growth?', phase: 0 },
      { id: 'wa-2', question: 'What is the current prep-time-per-meeting vs target?', phase: 1 },
      { id: 'wa-3', question: 'Are meeting-note summaries subject to supervisory review, and at what cadence?', phase: 0 },
      { id: 'wa-4', question: 'Is next-best-action personalized by household, or segment-level?', phase: 1 },
    ],
    common_contradictions: [
      'Productivity claims rise but AUM-per-advisor flat',
      'Meeting capture in place but supervisory review cycle not updated',
    ],
    phase_playbook: {
      '0': 'Name the binding constraint — prep time, meeting volume, or household complexity.',
      '1': 'Baseline time allocation. Identify the 20% of activities AI can actually compress.',
      '2': 'Propose tool stack aligned to constraint. Compliance review approach.',
      '3': 'Roll out in advisor cohort waves. Watch for AUM retention vs growth.',
      '4': 'Measure AUM growth per advisor + client satisfaction + compliance exception rate.',
    },
    typical_deliverables: ['advisor_time_audit', 'tool_stack_design', 'compliance_review_framework'],
    success_signals: ['Advisor:client ratio rising', 'Prep time falling without CSAT degradation', 'Compliance exception rate unchanged'],
    failure_modes: ['Time savings claimed but no observed AUM or CSAT lift', 'Meeting capture introduced without supervisory review update — compliance exposure', 'Next-best-action sophistication above advisor trust — tool ignored'],
    source_attribution: 'AbarVa v1 · reconcile with /abarva-pack-topics-deliverables.md',
  },
  {
    topic_key: 'fraud_aml',
    title: 'Fraud, AML & Financial Crime',
    tagline: 'Model lift is ceiling, alert quality is floor — most programs optimize one and ignore the other.',
    industries: ['FINSERV'],
    typical_triggers: [
      { phrase: 'fraud detection', confidence: 'high' },
      { phrase: 'AML', confidence: 'high' },
      { phrase: 'financial crime', confidence: 'high' },
      { phrase: 'false positive rate', confidence: 'medium' },
    ],
    key_patterns: ['F002', 'F009'],
    vendor_landscape: {
      fraud: ['Feedzai', 'Forter', 'Signifyd', 'Socure'],
      aml: ['NICE Actimize', 'ComplyAdvantage', 'Hummingbird'],
    },
    diagnostic_questions: [
      { id: 'fr-1', question: 'Current model lift vs benchmark + alert-to-SAR conversion rate?', phase: 0 },
      { id: 'fr-2', question: 'How many alerts per investigator per day, and what is the SLA?', phase: 1 },
      { id: 'fr-3', question: 'Is the investigator workflow a single system or stitched across vendors?', phase: 1 },
      { id: 'fr-4', question: 'Have you measured disparate impact on legitimate customers post-model-change?', phase: 0 },
    ],
    common_contradictions: [
      'Model lift rises but SAR quality unchanged',
      'Alert volume down but investigator headcount untouched',
    ],
    phase_playbook: {
      '0': 'Baseline: lift, alert volume, conversion, SLA compliance.',
      '1': 'Decompose by typology. Name the 20% of typologies driving 80% of losses.',
      '2': 'Propose model uplift + workflow rationalization + disparate-impact guardrails.',
      '3': 'Roll out model + workflow together — never model alone.',
      '4': 'Measure loss rate, investigator productivity, customer friction.',
    },
    typical_deliverables: ['fraud_aml_baseline', 'typology_decomposition', 'workflow_target_state'],
    success_signals: ['Loss rate down', 'Alert-to-SAR conversion up', 'Investigator throughput up without backlog'],
    failure_modes: ['Vendor model drops but workflow untouched — no productivity lift', 'False-positive rate down but legitimate-customer friction rising', 'Disparate impact introduced with new model, not measured until regulator asks'],
    source_attribution: 'AbarVa v1 · reconcile with /abarva-pack-topics-deliverables.md',
  },
  {
    topic_key: 'change_management',
    title: 'Change Management for AI',
    tagline: 'The reason AI programs fail has less to do with the model than the org.',
    industries: ['HEALTHCARE_IDN', 'FINSERV', 'RETAIL', 'GENERAL'],
    typical_triggers: [
      { phrase: 'change management', confidence: 'high' },
      { phrase: 'adoption', confidence: 'high' },
      { phrase: 'user training', confidence: 'medium' },
      { phrase: 'resistance', confidence: 'medium' },
    ],
    key_patterns: ['F001', 'F012', 'F014'],
    vendor_landscape: {},
    diagnostic_questions: [
      { id: 'cm-1', question: 'Is the sponsor committed to behavior change, or only to the tool rollout?', phase: 0 },
      { id: 'cm-2', question: 'What is the observed adoption curve from prior programs — months to plateau?', phase: 1 },
      { id: 'cm-3', question: 'Are frontline managers incentivized on adoption, or on the prior way of working?', phase: 1 },
      { id: 'cm-4', question: 'Is training assumed to be enough, or is there a coaching follow-through?', phase: 0 },
    ],
    common_contradictions: [
      'Training delivered but workflow incentives unchanged',
      'Sponsor says change is critical but dashboard still shows old metrics',
    ],
    phase_playbook: {
      '0': 'Name the behavior change. Confirm sponsor commitment beyond tool rollout.',
      '1': 'Map current incentives + rituals + dashboards. Identify misalignment.',
      '2': 'Design aligned incentives, rituals, and measurement. Propose coaching model.',
      '3': 'Roll out with coaching waves, not training waves. Track adoption at manager level.',
      '4': 'Measure behavior change — not just tool usage.',
    },
    typical_deliverables: ['change_readiness_assessment', 'incentive_alignment_plan', 'coaching_model'],
    success_signals: ['Adoption reaches steady-state faster than prior baseline', 'Manager-level adoption variation narrowing', 'Behavior metrics (not just tool usage) shifting'],
    failure_modes: ['Tool usage tracked, behavior change not', 'Coaching outsourced and decoupled from operating ritual', 'Incentives misaligned — old KPIs still dominate'],
    source_attribution: 'AbarVa v1 · reconcile with /abarva-pack-topics-deliverables.md',
  },
];

function getSb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
  const sb = getSb();
  let inserted = 0;
  let updated = 0;
  for (const topic of TOPICS) {
    const { data: existing } = await sb
      .from('topics')
      .select('id')
      .eq('topic_key', topic.topic_key)
      .maybeSingle();

    const payload = {
      topic_key: topic.topic_key,
      title: topic.title,
      tagline: topic.tagline,
      industries: topic.industries,
      typical_triggers: topic.typical_triggers,
      key_patterns: topic.key_patterns,
      vendor_landscape: topic.vendor_landscape,
      diagnostic_questions: topic.diagnostic_questions,
      common_contradictions: topic.common_contradictions,
      phase_playbook: topic.phase_playbook,
      typical_deliverables: topic.typical_deliverables,
      success_signals: topic.success_signals,
      failure_modes: topic.failure_modes,
      source_attribution: topic.source_attribution,
    };

    if (existing) {
      const { error } = await sb.from('topics').update(payload).eq('id', existing.id);
      if (error) throw error;
      updated += 1;
    } else {
      const { error } = await sb.from('topics').insert(payload);
      if (error) throw error;
      inserted += 1;
    }
  }
  console.log(`Topics seed complete — ${inserted} inserted, ${updated} updated, ${TOPICS.length} total`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});

// SOL2 · AI-led PDLC Solution Component Pack.
//
// Pure deterministic library naming the canonical components of an
// AI-led product development lifecycle (PDLC). Programs, Atlas, and
// Steward can subscribe to this pack to recommend, sequence, and
// govern AI-led delivery components without inventing them at runtime.
//
// This module is a *library*. It does NOT generate live architectures,
// invoke models, or read tenant state. Recommendations are pure pattern
// overlap on the input.
//
// No live runtime, no Claude / OpenAI / Pinecone invocation, no
// Date.now() reads, no random IDs, no Supabase reads, no migrations.
//
// This module does NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type AiLedPdlcComponentKey =
  | 'context_as_code_foundation'
  | 'ai_assisted_requirements'
  | 'spec_to_code_workflow'
  | 'ai_code_review'
  | 'ai_test_generation'
  | 'secure_coding_guardrails'
  | 'architecture_decision_records'
  | 'developer_knowledge_graph'
  | 'dora_telemetry_layer'
  | 'ai_adoption_measurement'
  | 'human_in_loop_approval'
  | 'release_risk_intelligence'
  | 'engineering_coach_agent'
  | 'value_ledger_for_pdlc';

export interface AiLedPdlcSolutionComponent {
  key: AiLedPdlcComponentKey;
  name: string;
  definition: string;
  problemSolved: string;
  requiredCurrentStateInputs: ReadonlyArray<string>;
  requiredMetrics: ReadonlyArray<string>;
  targetCapabilities: ReadonlyArray<string>;
  enablingTools: ReadonlyArray<string>;
  governanceRequirements: ReadonlyArray<string>;
  implementationSteps: ReadonlyArray<string>;
  expectedOutcomes: ReadonlyArray<string>;
  risks: ReadonlyArray<string>;
  relatedFailureModes: ReadonlyArray<string>;
  relatedPatterns: ReadonlyArray<string>;
  requiredWorkshops: ReadonlyArray<string>;
  deliverablesProduced: ReadonlyArray<string>;
  createdFrom: 'deterministic_solution_component_pack';
}

export interface AiLedPdlcComponentPackSummary {
  totalCount: number;
  byRequiredWorkshopCount: Record<string, number>;
  uniqueRelatedFailureModes: ReadonlyArray<string>;
  uniqueRelatedPatterns: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------
// Component pack
// ---------------------------------------------------------------------

const PACK: Record<AiLedPdlcComponentKey, AiLedPdlcSolutionComponent> = {
  context_as_code_foundation: {
    key: 'context_as_code_foundation',
    name: 'Context-as-code foundation',
    definition:
      'A versioned, machine-readable context layer (repo conventions, domain glossary, architectural principles, risk policies) that AI assistants and reviewers consume before generating or grading code.',
    problemSolved:
      'Without a captured context layer, AI assistants invent conventions per session; suggestions drift from house style; review burden grows; defects rise.',
    requiredCurrentStateInputs: [
      'Inventory of existing engineering handbooks, ADRs, and style guides',
      'Repository topology and ownership map per service / package',
      'Domain glossary covering top business entities and their lifecycle',
    ],
    requiredMetrics: [
      'Lead time for changes (DORA)',
      'Change-failure rate (DORA)',
      'Convention-drift defect ratio (defects tagged as style/convention divided by total defects)',
    ],
    targetCapabilities: [
      'AI assistants ground suggestions in versioned house conventions',
      'Reviewers can cite the context source in pull-request feedback',
      'New engineers ramp by reading the same context the AI consumes',
    ],
    enablingTools: [
      'Claude Code',
      'GitHub Copilot',
      'Cursor',
      'Internal context repository (CLAUDE.md / AGENTS.md / CONTEXT.md per repo)',
    ],
    governanceRequirements: [
      'Named owner per context document with quarterly review cadence',
      'Change to context layer requires architecture decision record sign-off',
    ],
    implementationSteps: [
      'Audit existing conventions, ADRs, and tribal knowledge sources',
      'Author the canonical context files at repo root and package root',
      'Wire AI assistant configurations to load the context files automatically',
      'Add a context-coverage check to the pull-request pipeline',
    ],
    expectedOutcomes: [
      'AI suggestions align with house conventions on the first pass',
      'Convention-drift defects fall as the context layer matures',
      'New engineers ramp faster because the AI explains house style consistently',
    ],
    risks: [
      'Context drift if no owner is named and reviews lapse',
      'False sense of safety if the context layer is incomplete but treated as authoritative',
    ],
    relatedFailureModes: ['weak_data_foundation', 'tool_first_thinking'],
    relatedPatterns: ['program_context_sparsity'],
    requiredWorkshops: ['current_state_discovery', 'data_foundation_assessment'],
    deliverablesProduced: [
      'Repo context manifest (CLAUDE.md / AGENTS.md per repo)',
      'Domain glossary',
      'Convention-coverage report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  ai_assisted_requirements: {
    key: 'ai_assisted_requirements',
    name: 'AI-assisted requirements capture',
    definition:
      'Workflow where product, engineering, and stakeholders capture user stories, acceptance criteria, and edge cases with AI co-authoring against the context-as-code layer.',
    problemSolved:
      'Vague stories and missing acceptance criteria cause rework deep in the build phase; AI assistants generate plausible-but-wrong code from thin briefs.',
    requiredCurrentStateInputs: [
      'Existing requirements artifact set (Jira / Linear / docs) with sample of last quarter',
      'List of named product owners per workstream',
      'Definition of done currently in use, including acceptance criteria patterns',
    ],
    requiredMetrics: [
      'Lead time for changes (DORA)',
      'Story-to-rework ratio (stories returned to refinement after acceptance)',
      'Acceptance-criteria coverage rate per merged story',
    ],
    targetCapabilities: [
      'Stories carry executable acceptance criteria the AI can verify',
      'Edge cases and non-functional requirements are captured before build',
      'Product owners can challenge AI-generated stories with grounded counter-examples',
    ],
    enablingTools: [
      'Claude Code',
      'GitHub Copilot',
      'Linear AI',
      'Jira AI',
    ],
    governanceRequirements: [
      'Product owner sign-off on every AI-co-authored story before refinement',
      'Responsible-AI review when stories touch regulated decisions',
    ],
    implementationSteps: [
      'Train product owners on prompt patterns that ground stories in the context layer',
      'Template stories with explicit acceptance criteria and edge-case sections',
      'Pilot AI co-authoring on one squad and measure rework ratio',
      'Promote the pattern to the broader portfolio after baseline shifts',
    ],
    expectedOutcomes: [
      'Story-to-rework ratio falls measurably',
      'Acceptance-criteria coverage rises toward full coverage on merged stories',
      'Stakeholders can replay why a story was scoped the way it was',
    ],
    risks: [
      'AI generates plausible stories that bypass real user discovery',
      'Product owners rubber-stamp AI suggestions without challenge',
    ],
    relatedFailureModes: ['poor_use_case_framing', 'no_business_owner', 'no_measurable_baseline'],
    relatedPatterns: ['program_context_sparsity', 'value_ledger_incompleteness'],
    requiredWorkshops: ['use_case_framing', 'value_framing'],
    deliverablesProduced: [
      'Story refinement playbook',
      'Acceptance-criteria template',
      'Sample refined story set with edge-case coverage',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  spec_to_code_workflow: {
    key: 'spec_to_code_workflow',
    name: 'Spec-to-code workflow',
    definition:
      'Disciplined workflow where AI assistants translate accepted specs into scaffolded code (modules, types, tests, migrations) with reviewer-in-the-loop gating before merge.',
    problemSolved:
      'Engineers improvise scaffolds from sparse stories; AI assistants generate inconsistent module shapes; review effort scales with surface area instead of intent.',
    requiredCurrentStateInputs: [
      'Reference scaffolds for the top three module types in the codebase',
      'Existing test conventions and fixture patterns',
      'Current pull-request review checklist',
    ],
    requiredMetrics: [
      'Lead time for changes (DORA)',
      'Deployment frequency (DORA)',
      'Scaffolded-change first-pass review acceptance rate',
    ],
    targetCapabilities: [
      'AI translates an accepted spec into a scaffold the reviewer can grade quickly',
      'Module shape is consistent across squads and services',
      'Reviewer effort focuses on intent and risk, not boilerplate',
    ],
    enablingTools: [
      'Claude Code',
      'Cursor',
      'GitHub Copilot Workspace',
      'Codex',
    ],
    governanceRequirements: [
      'Reviewer-in-the-loop sign-off on every spec-to-code scaffold before merge',
      'Architecture decision record required when scaffold introduces a new module shape',
    ],
    implementationSteps: [
      'Capture the top scaffold archetypes as templates the AI can reproduce',
      'Define the reviewer checklist for AI-scaffolded changes',
      'Pilot the workflow on a single low-risk squad with measurement',
      'Roll out the workflow squad-by-squad after first-pass acceptance baseline shifts',
    ],
    expectedOutcomes: [
      'First-pass review acceptance rate rises on AI-scaffolded changes',
      'Module shape consistency across the codebase improves',
    ],
    risks: [
      'Engineers accept AI scaffolds without verifying intent',
      'Scaffold drift if archetypes are not maintained',
    ],
    relatedFailureModes: ['tool_first_thinking', 'weak_workflow_integration'],
    relatedPatterns: ['program_context_sparsity'],
    requiredWorkshops: ['architecture_solution_design', 'use_case_framing'],
    deliverablesProduced: [
      'Scaffold archetype library',
      'Spec-to-code reviewer checklist',
      'Pilot acceptance-rate report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  ai_code_review: {
    key: 'ai_code_review',
    name: 'AI code review',
    definition:
      'AI reviewer that grades pull requests against the context-as-code layer, surfacing convention violations, missing tests, and risky changes before a human reviewer engages.',
    problemSolved:
      'Human reviewers spend cycles on style and convention nits; meaningful design feedback is delayed; reviewer fatigue grows; defects slip through.',
    requiredCurrentStateInputs: [
      'Last quarter of merged pull requests with review comments classified',
      'Existing reviewer checklist or rubric',
      'Repository topology with ownership map',
    ],
    requiredMetrics: [
      'Lead time for changes (DORA)',
      'Change-failure rate (DORA)',
      'Reviewer comment volume per pull request',
    ],
    targetCapabilities: [
      'AI grades convention and missing-test gaps automatically',
      'Human reviewers focus on design intent and risk',
      'Authors get fast first-round feedback before requesting human review',
    ],
    enablingTools: [
      'Claude Code',
      'GitHub Copilot Code Review',
      'Cursor',
      'CodeRabbit',
    ],
    governanceRequirements: [
      'Human reviewer sign-off remains required on every merge',
      'AI review outputs are auditable and tied to a versioned rubric',
    ],
    implementationSteps: [
      'Author the AI review rubric grounded in the context-as-code layer',
      'Wire the AI reviewer into the pull-request pipeline as a non-blocking commenter',
      'Measure reviewer comment volume and lead time before and after rollout',
      'Promote the AI review to a required check only after baseline shifts and false-positive rate is acceptable',
    ],
    expectedOutcomes: [
      'Reviewer comment volume falls on convention nits',
      'Lead time for changes drops as authors address feedback faster',
      'Change-failure rate holds or improves as missing-test gaps surface earlier',
    ],
    risks: [
      'False positives erode reviewer trust if the rubric is poorly grounded',
      'Authors over-rely on AI review and skip self-review',
    ],
    relatedFailureModes: ['missing_governance_risk', 'weak_workflow_integration'],
    relatedPatterns: ['evidence_chain_gap', 'gate_governance_gap'],
    requiredWorkshops: ['architecture_solution_design', 'governance_risk_review'],
    deliverablesProduced: [
      'AI review rubric',
      'Reviewer comment-volume baseline + post-rollout report',
      'False-positive triage log',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  ai_test_generation: {
    key: 'ai_test_generation',
    name: 'AI test generation',
    definition:
      'AI assistant generates unit, integration, and edge-case tests from the spec and the existing module surface, with the engineer accepting / amending generated tests before merge.',
    problemSolved:
      'Tests are written last and skipped under deadline pressure; coverage is uneven; edge cases are missed; AI-generated code lands without proportional test coverage.',
    requiredCurrentStateInputs: [
      'Test conventions and fixture patterns currently in use',
      'Coverage report per package or service',
      'Sample of historical defects mapped to missing tests',
    ],
    requiredMetrics: [
      'Change-failure rate (DORA)',
      'Mean time to recovery (DORA)',
      'Test coverage delta per pull request',
    ],
    targetCapabilities: [
      'Engineers accept or amend AI-generated tests rather than authoring from scratch',
      'Edge cases captured in stories propagate into tests automatically',
      'Coverage moves toward agreed thresholds without manual chasing',
    ],
    enablingTools: [
      'Claude Code',
      'GitHub Copilot',
      'Cursor',
      'Codium',
    ],
    governanceRequirements: [
      'Engineer sign-off on every AI-generated test before merge',
      'Coverage threshold enforced as a required check; AI-generated tests counted only after engineer review',
    ],
    implementationSteps: [
      'Capture the test conventions and fixture patterns as a context block',
      'Pilot AI test generation on a high-leverage package and measure coverage delta',
      'Wire the workflow into the standard pull-request loop',
      'Track change-failure rate and mean time to recovery as the rollout progresses',
    ],
    expectedOutcomes: [
      'Coverage rises on AI-touched code paths',
      'Change-failure rate holds or improves',
      'Engineers spend less time writing boilerplate test scaffolds',
    ],
    risks: [
      'AI generates tautological tests that pass without exercising real behavior',
      'Coverage metrics rise without defect-finding power',
    ],
    relatedFailureModes: ['no_measurable_baseline', 'missing_governance_risk'],
    relatedPatterns: ['evidence_chain_gap'],
    requiredWorkshops: ['architecture_solution_design'],
    deliverablesProduced: [
      'Test convention context block',
      'Coverage delta report per pilot',
      'Tautological-test triage rubric',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  secure_coding_guardrails: {
    key: 'secure_coding_guardrails',
    name: 'Secure coding guardrails',
    definition:
      'Pre-commit and pull-request guardrails that block secrets, vulnerable dependencies, and risky patterns before they land, with AI explanation tied to the violation.',
    problemSolved:
      'AI-assisted code can introduce credentials, vulnerable dependencies, and unsafe patterns at higher velocity than manual review can catch.',
    requiredCurrentStateInputs: [
      'Inventory of secret-management practices and credential rotation policy',
      'Current dependency-scanning posture per repo',
      'List of regulated data classes the codebase touches',
    ],
    requiredMetrics: [
      'Change-failure rate (DORA)',
      'Mean time to recovery (DORA)',
      'Secret / vulnerability blocks per week (lagging indicator)',
    ],
    targetCapabilities: [
      'Guardrails block secrets and known-vulnerable dependencies before merge',
      'AI explains why a guardrail fired and how to remediate',
      'Security posture is auditable per pull request',
    ],
    enablingTools: [
      'GitGuardian',
      'Snyk',
      'Trufflehog',
      'GitHub Advanced Security',
      'Dependabot',
    ],
    governanceRequirements: [
      'Security owner approves the guardrail rule set and quarterly review',
      'Bypass requires named approver and audit-log entry',
    ],
    implementationSteps: [
      'Inventory current scanning tools and consolidate to a coherent set',
      'Wire scanners into pre-commit and pull-request stages',
      'Train engineers on remediation playbooks tied to the most-fired rules',
      'Track block volume and bypass volume monthly',
    ],
    expectedOutcomes: [
      'Secret leaks fall to zero on guarded paths',
      'Vulnerable dependency MTTR drops',
      'Audit posture improves for regulated workloads',
    ],
    risks: [
      'Bypass culture if guardrails fire too often without good remediation guidance',
      'False sense of safety if scanners cover only known patterns',
    ],
    relatedFailureModes: ['missing_governance_risk', 'weak_data_foundation'],
    relatedPatterns: ['gate_governance_gap', 'ai_governance_operating_model_gap'],
    requiredWorkshops: ['governance_risk_review', 'data_foundation_assessment'],
    deliverablesProduced: [
      'Consolidated guardrail rule set',
      'Remediation playbook per top-fired rule',
      'Quarterly security posture report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  architecture_decision_records: {
    key: 'architecture_decision_records',
    name: 'Architecture decision records',
    definition:
      'Lightweight, versioned ADRs capturing every meaningful architecture choice — including the AI tool / model decisions — with named owner, alternatives considered, and revisit trigger.',
    problemSolved:
      'AI-led PDLC shifts decisions earlier and across more contributors; without ADRs the rationale is lost; revisiting becomes guesswork; tool-first thinking goes unchallenged.',
    requiredCurrentStateInputs: [
      'List of in-flight architecture decisions and their owners',
      'Current ADR format if any exists',
      'List of AI tool / model decisions made in the last two quarters',
    ],
    requiredMetrics: [
      'ADR coverage rate of merged architecture-affecting changes',
      'Time-to-first ADR for a new decision (lead time)',
      'Revisit-trigger hit rate (decisions revisited at the planned moment)',
    ],
    targetCapabilities: [
      'Every architecture decision carries a named owner and a revisit trigger',
      'Tool / model decisions are graded the same way structural decisions are',
      'Reviewers can challenge decisions against the captured alternatives',
    ],
    enablingTools: [
      'Claude Code',
      'GitHub Copilot',
      'Cursor',
      'ADR template repository',
    ],
    governanceRequirements: [
      'Architecture review board sign-off on ADRs touching cross-cutting concerns',
      'Tool / model ADR escalates to responsible-AI review when the decision touches regulated data',
    ],
    implementationSteps: [
      'Standardize an ADR template carrying owner, alternatives, decision, revisit trigger',
      'Backfill ADRs for the top in-flight decisions to seed the practice',
      'Add an ADR-coverage check to the pull-request pipeline for architecture-affecting changes',
      'Run a quarterly ADR review to retire or refresh open records',
    ],
    expectedOutcomes: [
      'ADR coverage rises toward full coverage on architecture-affecting merges',
      'Tool / model decisions are revisited on schedule rather than when something breaks',
    ],
    risks: [
      'ADRs become checkbox theater if no review cadence exists',
      'Engineers route around ADRs to avoid the overhead',
    ],
    relatedFailureModes: ['tool_first_thinking', 'no_operating_model_for_scale', 'missing_governance_risk'],
    relatedPatterns: ['gate_governance_gap', 'ai_governance_operating_model_gap'],
    requiredWorkshops: ['architecture_solution_design', 'governance_risk_review', 'executive_decision_review'],
    deliverablesProduced: [
      'ADR template',
      'Initial ADR backfill set for top decisions',
      'Quarterly ADR review report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  developer_knowledge_graph: {
    key: 'developer_knowledge_graph',
    name: 'Developer knowledge graph',
    definition:
      'Graph linking code, ADRs, runbooks, incidents, and ownership so AI assistants and engineers can answer "who owns this", "what depends on this", and "what failed last time" without spelunking.',
    problemSolved:
      'AI assistants generate confident-but-wrong answers when context is fragmented across wikis, repos, and chat; on-call engineers waste time tracing dependencies; AI-led velocity outpaces tribal knowledge.',
    requiredCurrentStateInputs: [
      'Repository topology + ownership data export',
      'Incident postmortem corpus from the last four quarters',
      'Wiki / runbook export with author and last-edit metadata',
    ],
    requiredMetrics: [
      'Mean time to recovery (DORA)',
      'Knowledge-graph query coverage of on-call questions',
      'Stale-doc ratio (docs touched in the last 180 days vs. total)',
    ],
    targetCapabilities: [
      'AI grounds dependency / ownership answers in the graph rather than inventing them',
      'On-call engineers find the right runbook in one query',
      'Knowledge gaps are visible as graph-coverage gaps, not as silent risk',
    ],
    enablingTools: [
      'Claude Code',
      'Backstage',
      'OpenContext',
      'Internal graph database',
    ],
    governanceRequirements: [
      'Named owner per graph dimension (code, runbooks, incidents, people)',
      'Stale-content escalation policy with sign-off authority',
    ],
    implementationSteps: [
      'Inventory the existing knowledge sources and de-duplicate',
      'Stand up the graph with the highest-leverage dimensions first',
      'Wire AI assistants to query the graph before answering ownership / dependency questions',
      'Measure on-call query coverage and stale-doc ratio quarterly',
    ],
    expectedOutcomes: [
      'On-call mean time to recovery falls',
      'AI-assistant ownership / dependency answers become trustworthy',
      'Stale-doc ratio drops as ownership becomes legible',
    ],
    risks: [
      'Graph becomes another stale source if owners are not named',
      'Engineers mistrust the graph after one bad answer and revert to spelunking',
    ],
    relatedFailureModes: ['weak_data_foundation', 'no_operating_model_for_scale'],
    relatedPatterns: ['program_context_sparsity', 'evidence_chain_gap'],
    requiredWorkshops: ['data_foundation_assessment', 'operating_model_alignment'],
    deliverablesProduced: [
      'Knowledge-graph dimension owner roster',
      'Initial graph build report with coverage map',
      'On-call query coverage report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  dora_telemetry_layer: {
    key: 'dora_telemetry_layer',
    name: 'DORA telemetry layer',
    definition:
      'Captured, defensible measurement of the four DORA metrics — lead time for changes, deployment frequency, change-failure rate, and mean time to recovery — with named source-of-truth per metric and CXO-visible dashboards.',
    problemSolved:
      'AI-led PDLC claims velocity and quality gains; without DORA telemetry the gains are anecdotal; CXOs cannot defend the AI investment at the next steering touchpoint.',
    requiredCurrentStateInputs: [
      'Current state of CI / CD / incident systems with API access notes',
      'Team / service topology with named owners',
      'Existing dashboards or attempts to measure DORA today',
    ],
    requiredMetrics: [
      'Lead time for changes (DORA)',
      'Deployment frequency (DORA)',
      'Change-failure rate (DORA)',
      'Mean time to recovery (DORA)',
    ],
    targetCapabilities: [
      'Every DORA metric has a named source-of-truth and refresh cadence',
      'Dashboards segment by squad / service / portfolio',
      'CXO can see the AI-led PDLC trend over time, not just point-in-time numbers',
    ],
    enablingTools: [
      'GitHub Actions / GitLab CI telemetry',
      'PagerDuty / Opsgenie incident data',
      'Internal data warehouse',
      'Sleuth',
      'LinearB',
    ],
    governanceRequirements: [
      'Named owner per metric with sign-off authority on definition changes',
      'Data quality sign-off before any number is shown to executive sponsors',
    ],
    implementationSteps: [
      'Define each DORA metric with explicit numerator / denominator and exclusions',
      'Wire the source systems into the telemetry layer',
      'Build a baseline report for each metric across the last two quarters',
      'Stand up the executive dashboard with refresh cadence and named owner',
    ],
    expectedOutcomes: [
      'Baseline measurement is defensible at executive review',
      'AI-led PDLC value claims are tied back to the source-of-truth metric',
      'Trend visibility replaces point-in-time numbers',
    ],
    risks: [
      'Definition drift if no owner is named',
      'Vanity-metric framing if change-failure rate and mean time to recovery are not equally weighted with velocity metrics',
    ],
    relatedFailureModes: ['no_measurable_baseline', 'no_value_ledger', 'no_operating_model_for_scale'],
    relatedPatterns: ['value_ledger_incompleteness', 'evidence_chain_gap'],
    requiredWorkshops: ['data_foundation_assessment', 'value_framing'],
    deliverablesProduced: [
      'DORA metric definition document',
      'Baseline DORA report',
      'Executive DORA dashboard',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  ai_adoption_measurement: {
    key: 'ai_adoption_measurement',
    name: 'AI adoption measurement',
    definition:
      'Telemetry capturing per-engineer and per-team adoption of AI assistants across PDLC stages, tied back to outcome metrics so adoption can be defended as value-creating rather than seat-counting.',
    problemSolved:
      'Tool licenses are bought without measurement; usage is partial; adoption claims are anecdotal; license rationalization becomes a board issue rather than an evidence-based decision.',
    requiredCurrentStateInputs: [
      'Current AI tool license inventory with renewal dates',
      'Existing usage telemetry export (where available) per tool',
      'List of squads with named champions or skeptics',
    ],
    requiredMetrics: [
      'Active-user rate per tool per cohort',
      'Adoption depth (lines of AI-assisted code accepted divided by lines authored)',
      'Cycle time for changes (DORA-adjacent)',
    ],
    targetCapabilities: [
      'Per-tool, per-cohort adoption is measurable and refreshed weekly',
      'Adoption is correlated with outcome metrics (DORA, defect, rework)',
      'License rationalization is evidence-based',
    ],
    enablingTools: [
      'GitHub Copilot Metrics API',
      'Cursor admin dashboard',
      'Claude Code telemetry export',
      'Internal data warehouse',
    ],
    governanceRequirements: [
      'Named owner for adoption telemetry with sign-off on definitional changes',
      'Privacy review before any per-engineer telemetry is shown beyond the engineer and their manager',
    ],
    implementationSteps: [
      'Inventory the current AI tool licenses and renewal dates',
      'Wire usage telemetry exports from each tool into the data warehouse',
      'Build the adoption dashboard with cohort segmentation',
      'Run a quarterly license rationalization review using the dashboard as primary evidence',
    ],
    expectedOutcomes: [
      'Adoption claims become defensible at executive review',
      'License rationalization decisions reduce sprawl and renew only tools with measurable adoption',
      'Tool sprawl risk falls as evidence replaces anecdote',
    ],
    risks: [
      'Surveillance optics if telemetry is shown beyond manager / engineer without privacy review',
      'Adoption-as-vanity-metric if no outcome correlation is required',
    ],
    relatedFailureModes: ['ai_tool_sprawl_without_value', 'no_adoption_change_plan', 'no_value_ledger'],
    relatedPatterns: ['ai_governance_operating_model_gap', 'value_ledger_incompleteness'],
    requiredWorkshops: ['adoption_change_readiness', 'operating_model_alignment'],
    deliverablesProduced: [
      'AI tool license inventory',
      'Adoption telemetry definition document',
      'Quarterly license rationalization report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  human_in_loop_approval: {
    key: 'human_in_loop_approval',
    name: 'Human-in-loop approval',
    definition:
      'Captured policy and workflow gating where AI-generated changes that touch production data, regulated logic, or external customers cannot merge or deploy without a named human approver.',
    problemSolved:
      'AI-led velocity can ship regulated or customer-facing changes faster than the approval chain can intervene; without explicit human-in-loop gating, governance is reactive.',
    requiredCurrentStateInputs: [
      'Current change-management policy and named approvers per workload class',
      'List of regulated data classes the codebase touches',
      'Production deployment and rollback playbooks',
    ],
    requiredMetrics: [
      'Approval coverage rate on regulated changes',
      'Bypass volume per quarter (lagging indicator)',
      'Mean time to recovery (DORA)',
    ],
    targetCapabilities: [
      'Regulated changes carry a named approver before merge or deploy',
      'AI assistant identifies regulated changes and routes them automatically',
      'Audit log captures every approval and bypass with reason',
    ],
    enablingTools: [
      'GitHub branch protection',
      'ServiceNow Agent',
      'Jira Service Management',
      'Internal policy-as-code engine',
    ],
    governanceRequirements: [
      'Responsible-AI review of the policy and the routing rules',
      'Sign-off authority defined per workload class with backup approvers',
    ],
    implementationSteps: [
      'Inventory the workload classes that require human-in-loop approval',
      'Encode the routing rules as policy-as-code',
      'Wire policy enforcement into the pull-request and deployment pipelines',
      'Audit approval and bypass volume monthly',
    ],
    expectedOutcomes: [
      'Approval coverage rises toward full coverage on regulated changes',
      'Bypass volume falls as routing matures',
      'Audit posture improves for regulated workloads',
    ],
    risks: [
      'Approver bottleneck if backup approvers are not named',
      'Policy bypass culture if the rules are perceived as overreach',
    ],
    relatedFailureModes: ['missing_governance_risk', 'no_operating_model_for_scale'],
    relatedPatterns: ['gate_governance_gap', 'ai_governance_operating_model_gap'],
    requiredWorkshops: ['governance_risk_review', 'executive_decision_review'],
    deliverablesProduced: [
      'Workload-class approver matrix',
      'Policy-as-code rule set',
      'Quarterly approval / bypass audit report',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  release_risk_intelligence: {
    key: 'release_risk_intelligence',
    name: 'Release risk intelligence',
    definition:
      'Pre-deploy risk score per release computed from change set, blast radius, telemetry health, and historical incident correlation, with AI-authored release notes for the on-call rotation.',
    problemSolved:
      'AI-led PDLC raises deployment frequency; without proportional release-risk visibility, on-call becomes reactive; mean time to recovery rises during the velocity ramp.',
    requiredCurrentStateInputs: [
      'Historical incident corpus correlated to releases',
      'Service / module ownership map',
      'Current release-notes practice and on-call handover ritual',
    ],
    requiredMetrics: [
      'Mean time to recovery (DORA)',
      'Change-failure rate (DORA)',
      'Release-risk score calibration error (predicted vs. observed)',
    ],
    targetCapabilities: [
      'Every release carries a risk score and AI-authored release notes',
      'On-call sees the risk score and notes before the deploy lands',
      'Risk-score calibration is measured and improved quarterly',
    ],
    enablingTools: [
      'Claude Code',
      'Sleuth',
      'LinearB',
      'PagerDuty release intelligence',
    ],
    governanceRequirements: [
      'Named owner of the risk-score model and the calibration cadence',
      'Sign-off authority for releases above an agreed risk threshold',
    ],
    implementationSteps: [
      'Inventory the historical incident-to-release correlation set',
      'Define the risk-score inputs and the calibration metric',
      'Pilot the score on a single release train and measure calibration error',
      'Roll out to the broader portfolio after calibration baseline is acceptable',
    ],
    expectedOutcomes: [
      'Mean time to recovery falls as on-call has earlier signal',
      'Change-failure rate trends improve as high-risk releases get sign-off',
      'On-call handover ritual becomes evidence-led',
    ],
    risks: [
      'Score over-fitting to historical patterns and missing novel risk',
      'Alert fatigue if the score fires too often without good remediation',
    ],
    relatedFailureModes: ['no_measurable_baseline', 'no_operating_model_for_scale', 'pilot_purgatory'],
    relatedPatterns: ['evidence_chain_gap', 'gate_governance_gap'],
    requiredWorkshops: ['governance_risk_review', 'operating_model_alignment'],
    deliverablesProduced: [
      'Risk-score input definition document',
      'Calibration report per pilot',
      'AI-authored release-notes template',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  engineering_coach_agent: {
    key: 'engineering_coach_agent',
    name: 'Engineering coach agent',
    definition:
      'AI agent that grades engineer pull requests against the context-as-code layer and the engineer\'s growth plan, surfacing patterns to discuss in one-on-ones rather than blocking the merge.',
    problemSolved:
      'Coaching is anecdotal and lossy; managers cannot scale coaching across larger spans; engineers receive style nits in review but not patterned growth feedback.',
    requiredCurrentStateInputs: [
      'Manager span and one-on-one cadence per squad',
      'Engineer growth plan format (if any)',
      'Sample of merged pull requests per engineer over the last quarter',
    ],
    requiredMetrics: [
      'One-on-one coverage rate (one-on-ones held vs. scheduled)',
      'Engineer growth-plan progress per quarter',
      'Coaching-pattern recurrence rate (patterns flagged vs. patterns resolved)',
    ],
    targetCapabilities: [
      'Managers receive patterned feedback from the agent before each one-on-one',
      'Engineers see their own growth signal without it landing as merge-blocking critique',
      'Coaching scales across larger spans without surveillance optics',
    ],
    enablingTools: [
      'Claude Code',
      'Cursor',
      'Internal manager dashboard',
      'GitHub Copilot Metrics API',
    ],
    governanceRequirements: [
      'Privacy review of what the agent can see and what it can surface to whom',
      'Engineer opt-in or transparent opt-out before the agent operates on their pull requests',
    ],
    implementationSteps: [
      'Define the coaching rubric grounded in the context-as-code layer and growth-plan format',
      'Pilot the agent on volunteer managers and engineers',
      'Measure one-on-one coverage and growth-plan progress before and after rollout',
      'Promote the agent to broader use only after privacy review and pilot results are acceptable',
    ],
    expectedOutcomes: [
      'One-on-one coverage rises and growth conversations become specific',
      'Coaching-pattern recurrence rate falls as patterns get addressed',
    ],
    risks: [
      'Surveillance optics erode trust if privacy review is skipped',
      'Coaching becomes mechanical if managers defer to the agent\'s patterns without judgment',
    ],
    relatedFailureModes: ['no_adoption_change_plan', 'no_operating_model_for_scale'],
    relatedPatterns: ['program_context_sparsity', 'ai_governance_operating_model_gap'],
    requiredWorkshops: ['adoption_change_readiness', 'operating_model_alignment'],
    deliverablesProduced: [
      'Coaching rubric',
      'Pilot one-on-one coverage report',
      'Privacy review record',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
  value_ledger_for_pdlc: {
    key: 'value_ledger_for_pdlc',
    name: 'Value ledger for PDLC',
    definition:
      'Captured value chain — baseline KPI, target with confidence band, realized value with same measurement source — for every AI-led PDLC investment, defended by the DORA telemetry layer and AI adoption measurement.',
    problemSolved:
      'AI-led PDLC investments make value claims that cannot be defended at the next steering touchpoint; baseline / target / realized are anecdotal; investment confidence erodes.',
    requiredCurrentStateInputs: [
      'List of in-flight AI-led PDLC investments with named sponsors',
      'Existing value-claim artifacts (deck slides, business cases) for those investments',
      'Source-of-truth measurement systems referenced in the claims',
    ],
    requiredMetrics: [
      'Lead time for changes (DORA)',
      'Change-failure rate (DORA)',
      'Adoption-to-outcome correlation per investment',
    ],
    targetCapabilities: [
      'Every AI-led PDLC investment carries a captured baseline, target, and realized entry',
      'Realized value is defended by the DORA telemetry layer and adoption telemetry',
      'CXO can challenge any claim and trace it back to the source-of-truth measurement',
    ],
    enablingTools: [
      'Internal data warehouse',
      'Internal value-ledger application',
      'GitHub Copilot Metrics API',
      'Claude Code',
    ],
    governanceRequirements: [
      'Sponsor sign-off on baseline and target before any realized claim is published',
      'Responsible-AI review when the investment touches regulated workloads',
    ],
    implementationSteps: [
      'Inventory in-flight AI-led PDLC investments and their existing value claims',
      'Capture baseline + target + measurement source per investment using the canonical ledger',
      'Wire realized-value entries to the DORA telemetry layer and adoption telemetry',
      'Run a quarterly value review with sponsors to retire or refresh entries',
    ],
    expectedOutcomes: [
      'AI-led PDLC investments produce defensible value claims',
      'Investment confidence rises as evidence replaces anecdote',
      'Tool / model rationalization decisions are grounded in the ledger',
    ],
    risks: [
      'Ledger entries become checkbox theater without sponsor accountability',
      'Realized claims drift from the measurement source if the telemetry layer regresses',
    ],
    relatedFailureModes: ['no_value_ledger', 'no_measurable_baseline', 'ai_tool_sprawl_without_value', 'pilot_purgatory'],
    relatedPatterns: ['value_ledger_incompleteness', 'evidence_chain_gap', 'ai_governance_operating_model_gap'],
    requiredWorkshops: ['value_framing', 'executive_decision_review', 'operating_model_alignment'],
    deliverablesProduced: [
      'Per-investment value ledger entry',
      'Quarterly value review report',
      'Adoption-to-outcome correlation summary',
    ],
    createdFrom: 'deterministic_solution_component_pack',
  },
};

const PACK_KEYS_IN_ORDER: ReadonlyArray<AiLedPdlcComponentKey> = [
  'context_as_code_foundation',
  'ai_assisted_requirements',
  'spec_to_code_workflow',
  'ai_code_review',
  'ai_test_generation',
  'secure_coding_guardrails',
  'architecture_decision_records',
  'developer_knowledge_graph',
  'dora_telemetry_layer',
  'ai_adoption_measurement',
  'human_in_loop_approval',
  'release_risk_intelligence',
  'engineering_coach_agent',
  'value_ledger_for_pdlc',
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Return the full component pack in canonical order. Pure: same call →
 * identical output.
 */
export function listAiLedPdlcSolutionComponents(): ReadonlyArray<AiLedPdlcSolutionComponent> {
  return PACK_KEYS_IN_ORDER.map((k) => PACK[k]);
}

/**
 * Return one component by key. Pure. Returns null for unknown keys.
 */
export function getAiLedPdlcSolutionComponent(
  key: string,
): AiLedPdlcSolutionComponent | null {
  if (!isAiLedPdlcComponentKey(key)) return null;
  return PACK[key];
}

/**
 * Recommend components whose relatedFailureModes overlap with the
 * caller's failure-mode list OR whose relatedPatterns overlap with
 * the caller's pattern-key list. Pure. Order is canonical.
 *
 * The currentStateNotes input is reserved for forward compatibility
 * (a future caller may match notes to component requiredCurrentStateInputs).
 * Today it does not affect the result.
 */
export function recommendPdlcComponentsFromInputs(input: {
  currentStateNotes?: ReadonlyArray<string>;
  failureModes?: ReadonlyArray<string>;
  patternKeys?: ReadonlyArray<string>;
}): ReadonlyArray<AiLedPdlcSolutionComponent> {
  const failureModes = input.failureModes ?? [];
  const patternKeys = input.patternKeys ?? [];
  if (failureModes.length === 0 && patternKeys.length === 0) {
    return [];
  }
  const fmSet = new Set<string>(failureModes);
  const pkSet = new Set<string>(patternKeys);
  return PACK_KEYS_IN_ORDER.map((k) => PACK[k]).filter((c) => {
    const fmOverlap = c.relatedFailureModes.some((fm) => fmSet.has(fm));
    const pkOverlap = c.relatedPatterns.some((pk) => pkSet.has(pk));
    return fmOverlap || pkOverlap;
  });
}

/**
 * Aggregate counts by required-workshop key, plus the unique sets of
 * related failure modes and related patterns observed across the pack.
 * Pure.
 */
export function summarizePdlcSolutionComponentPack(): AiLedPdlcComponentPackSummary {
  const components = PACK_KEYS_IN_ORDER.map((k) => PACK[k]);
  const byRequiredWorkshopCount: Record<string, number> = {};
  const fmSet = new Set<string>();
  const pkSet = new Set<string>();
  for (const c of components) {
    for (const w of c.requiredWorkshops) {
      byRequiredWorkshopCount[w] = (byRequiredWorkshopCount[w] ?? 0) + 1;
    }
    for (const fm of c.relatedFailureModes) fmSet.add(fm);
    for (const pk of c.relatedPatterns) pkSet.add(pk);
  }
  return {
    totalCount: components.length,
    byRequiredWorkshopCount,
    uniqueRelatedFailureModes: Array.from(fmSet).sort(),
    uniqueRelatedPatterns: Array.from(pkSet).sort(),
  };
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const AI_LED_PDLC_COMPONENT_KEYS_IN_ORDER: ReadonlyArray<AiLedPdlcComponentKey> =
  PACK_KEYS_IN_ORDER;

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function isAiLedPdlcComponentKey(value: string): value is AiLedPdlcComponentKey {
  return (PACK_KEYS_IN_ORDER as ReadonlyArray<string>).includes(value);
}

import type { MoveArtifactConsumer } from '@/lib/programs/evidence-readiness/types';

import type { OperationalEvidenceRecordType } from './operational-evidence';

export type OperationalTemplatePack = 'minimum_viable' | 'optional_deep_dive';

export type OperationalTemplateFieldSensitivity = 'none' | 'internal' | 'pii_phi_possible' | 'secret_possible' | 'financial';

export interface OperationalEvidenceTemplateField {
  name: string;
  description: string;
  example: string;
  sensitivity: OperationalTemplateFieldSensitivity;
}

export interface OperationalEvidenceTemplateDefinition {
  templateId: string;
  version: string;
  name: string;
  pack: OperationalTemplatePack;
  purpose: string;
  typicalSourceSystems: string[];
  requiredFields: OperationalEvidenceTemplateField[];
  optionalFields: OperationalEvidenceTemplateField[];
  dataSensitivityNotes: string;
  piiPhiSecretsHandling: string;
  syntheticDataInstructions: string;
  contextLayerEntityMappings: OperationalEvidenceRecordType[];
  movesArtifactConsumers: MoveArtifactConsumer[];
  qualityCompletenessScoringRules: string[];
}

export interface OperationalSourceSystemGuidance {
  sourceSystem: string;
  request: string[];
  value: string;
  safeCaptureGuidance: string;
}

export interface OperationalDerivedOpportunityExplanation {
  opportunityId: string;
  opportunityName: string;
  sourceEvidenceUsed: string[];
  patternDetected: string;
  currentPain: string;
  businessImpact: string;
  proposedAiCapability: string;
  humanRole: string;
  agentRole: string;
  estimatedValue: string;
  riskFeasibilityReadiness: string;
  requiredControls: string[];
  recommendedNextStep: string;
}

export interface SyntheticOperationalEvidencePack {
  tenantId: string;
  useCaseName: string;
  sourceType: 'synthetic_demo';
  syntheticLabel: string;
  generatedAt: string;
  templatesUsed: string[];
  records: {
    operationalUseCaseIntake: Record<string, unknown>;
    serviceNowTickets: Record<string, unknown>[];
    jiraDeliveryItems: Record<string, unknown>[];
    appCmdbInventory: Record<string, unknown>[];
    logEventSummaries: Record<string, unknown>[];
    processFlowObservations: Record<string, unknown>[];
    aiOpportunityBacklog: Record<string, unknown>[];
    valueEffortEstimates: Record<string, unknown>[];
  };
  derivedOpportunityExplanations: OperationalDerivedOpportunityExplanation[];
}

const field = (
  name: string,
  description: string,
  example: string,
  sensitivity: OperationalTemplateFieldSensitivity = 'internal',
): OperationalEvidenceTemplateField => ({ name, description, example, sensitivity });

const minimumConsumers: MoveArtifactConsumer[] = [
  'charter',
  'discovery_report',
  'solution_approach_options',
  'target_state_architecture',
  'execution_roadmap',
  'business_case',
  'handoff_package',
];

export const MINIMUM_OPERATIONAL_EVIDENCE_TEMPLATES: OperationalEvidenceTemplateDefinition[] = [
  {
    templateId: 'operational_use_case_intake',
    version: '1.0.0',
    name: 'Operational Use Case Intake Template',
    pack: 'minimum_viable',
    purpose: 'Capture the business/process area to analyze and the desired AI automation objective.',
    typicalSourceSystems: ['Business sponsor input', 'IT leader input', 'Innovation office intake', 'Workshop notes'],
    requiredFields: [
      field('tenant_id', 'Tenant or client identifier.', 'morganstreet'),
      field('use_case_name', 'Name of the operational intelligence use case.', 'Advisor Operations AI Opportunity Discovery'),
      field('business_domain', 'Domain or function being analyzed.', 'Wealth operations'),
      field('process_area', 'Process area in scope.', 'Client onboarding and service request resolution'),
      field('sponsor', 'Executive sponsor.', 'COO'),
      field('business_owner', 'Business owner accountable for outcomes.', 'Head of Advisor Operations'),
      field('IT_owner', 'Technology owner accountable for systems/data access.', 'VP Enterprise Applications'),
      field('problem_statement', 'Business problem to solve.', 'High reassignment, duplicate requests, and slow approvals delay advisor service.'),
      field('desired_outcome', 'Target business outcome.', 'Reduce operational handoffs and identify safe AI assistance opportunities.'),
      field('systems_in_scope', 'Systems and evidence sources in scope.', 'ServiceNow; Jira; Splunk; CMDB; Knowledge Base'),
      field('time_period_to_analyze', 'Evidence window.', 'Trailing 12 months'),
      field('known_constraints', 'Known delivery, data, or compliance constraints.', 'No raw client PII in working corpus.', 'pii_phi_possible'),
      field('expected_value', 'Expected value thesis.', '$1.2M-$1.8M ROM annual productivity and cycle-time benefit.', 'financial'),
      field('risk_or_compliance_constraints', 'Risk/compliance constraints.', 'Human approval required for client-impacting actions.', 'pii_phi_possible'),
      field('success_criteria', 'Measurable success criteria.', 'Top 5 opportunities with evidence, controls, roadmap, and ROM value.'),
    ],
    optionalFields: [
      field('workshop_date', 'Date of intake or discovery workshop.', '2026-06-18', 'none'),
      field('decision_forum', 'Forum that approves the opportunity backlog.', 'Operations AI Steering Committee'),
    ],
    dataSensitivityNotes: 'May include business priorities, process constraints, and regulated-data boundaries.',
    piiPhiSecretsHandling: 'Do not include raw customer/member/patient identifiers or credentials in intake notes.',
    syntheticDataInstructions: 'Generate a realistic operational friction problem with sponsor, owner, IT owner, expected value, constraints, and success criteria.',
    contextLayerEntityMappings: ['operational_evidence_source', 'operational_evidence_insight'],
    movesArtifactConsumers: minimumConsumers,
    qualityCompletenessScoringRules: [
      'All required ownership, objective, scope, systems, constraint, value, and success-criteria fields present.',
      'Systems in scope map to at least one evidence source request.',
      'Success criteria are measurable enough to drive P1 charter and P4 value case.',
    ],
  },
  {
    templateId: 'servicenow_ticket_extract',
    version: '1.0.0',
    name: 'ServiceNow Ticket Extract Template',
    pack: 'minimum_viable',
    purpose: 'Capture incidents, requests, changes, and problems to identify triage, routing, recurring issue, knowledge, SLA, and automation opportunities.',
    typicalSourceSystems: ['ServiceNow ITSM', 'Jira Service Management', 'BMC Remedy', 'Freshservice'],
    requiredFields: [
      field('ticket_id', 'Source ticket identifier.', 'INC1048821'),
      field('ticket_type', 'incident, request, change, or problem.', 'incident'),
      field('short_description', 'Sanitized short description.', 'Portfolio feed failed overnight.', 'pii_phi_possible'),
      field('category', 'Ticket category.', 'Integration'),
      field('subcategory', 'Ticket subcategory.', 'Batch failure'),
      field('priority', 'Priority value.', 'P2'),
      field('severity', 'Severity value.', 'High'),
      field('business_service', 'Business service impacted.', 'Advisor desktop'),
      field('application_or_CI', 'Application or CI reference.', 'MS-APP-012'),
      field('assignment_group', 'Resolver group.', 'Integration Support'),
      field('opened_at', 'Opened timestamp.', '2026-05-03T02:14:00Z', 'none'),
      field('resolved_at', 'Resolved timestamp.', '2026-05-03T08:37:00Z', 'none'),
      field('status', 'Current or final status.', 'Resolved'),
      field('resolution_code', 'Resolution category/code.', 'Job rerun'),
      field('resolution_summary', 'Sanitized resolution summary.', 'Restarted failed job and replayed message batch.', 'pii_phi_possible'),
      field('sla_breached', 'Whether SLA breached.', 'true', 'none'),
      field('reopen_count', 'Number of reopens.', '1', 'none'),
      field('reassignment_count', 'Number of assignment transfers.', '3', 'none'),
      field('knowledge_article_used', 'Knowledge article reference or boolean.', 'KB-1182'),
      field('requester_group', 'Requester population/group.', 'Advisor support'),
      field('channel', 'Intake channel.', 'Portal'),
    ],
    optionalFields: [
      field('affected_user_role', 'Affected persona or role.', 'Advisor assistant'),
      field('major_incident_flag', 'Major incident indicator.', 'false', 'none'),
      field('change_id', 'Linked change identifier.', 'CHG009812'),
      field('linked_jira_key', 'Linked Jira issue.', 'OPS-421'),
      field('linked_alert_id', 'Linked observability alert.', 'ALERT-8871'),
      field('close_notes_summary', 'Sanitized close notes summary.', 'Escalated due to missing runbook.', 'pii_phi_possible'),
      field('root_cause_category', 'Root cause category.', 'Upstream timeout'),
      field('after_hours_flag', 'After-hours indicator.', 'true', 'none'),
      field('vip_flag', 'VIP/customer criticality indicator.', 'false', 'pii_phi_possible'),
    ],
    dataSensitivityNotes: 'Ticket summaries can contain names, account identifiers, PHI/PII, secrets, and client-specific operational details.',
    piiPhiSecretsHandling: 'Do not ingest sensitive comments by default. Redact names, secrets, credentials, PHI/PII, request bodies, and sensitive business data.',
    syntheticDataInstructions: 'Generate realistic distributions by category, assignment group, app/CI, severity, SLA breach, reopen, and resolution with repeated patterns.',
    contextLayerEntityMappings: ['work_item', 'process_flow_observation', 'operational_evidence_insight'],
    movesArtifactConsumers: ['discovery_report', 'solution_approach_options', 'target_state_architecture', 'execution_roadmap', 'business_case'],
    qualityCompletenessScoringRules: [
      'At least 90% of records include category, app/CI, assignment group, opened/resolved timestamps, status, SLA breach, reopen, and reassignment values.',
      'No raw comments or sensitive free text unless explicitly approved and redacted.',
      'Records preserve source ticket id and links to Jira/log evidence where available.',
    ],
  },
  {
    templateId: 'jira_delivery_extract',
    version: '1.0.0',
    name: 'Jira Delivery Extract Template',
    pack: 'minimum_viable',
    purpose: 'Capture delivery work to identify story quality, duplicate demand, delivery bottlenecks, release risk, and backlog automation opportunities.',
    typicalSourceSystems: ['Jira', 'Azure DevOps', 'Rally', 'Linear', 'Asana'],
    requiredFields: [
      field('issue_key', 'Source issue key.', 'OPS-421'),
      field('issue_type', 'Epic, story, bug, task, or defect.', 'bug'),
      field('summary', 'Sanitized issue summary.', 'Stabilize portfolio feed retry handling.', 'pii_phi_possible'),
      field('component', 'Component.', 'Integration services'),
      field('application', 'Application impacted.', 'Advisor desktop'),
      field('business_domain', 'Business domain.', 'Wealth operations'),
      field('status', 'Current/final status.', 'Done'),
      field('created_at', 'Created timestamp.', '2026-05-04T12:00:00Z', 'none'),
      field('updated_at', 'Updated timestamp.', '2026-05-13T15:20:00Z', 'none'),
      field('resolved_at', 'Resolved timestamp.', '2026-05-13T15:20:00Z', 'none'),
      field('assignee_team', 'Owning team.', 'Integration Engineering'),
      field('sprint', 'Sprint value.', '2026.10'),
      field('release', 'Release value.', 'R26.05'),
      field('story_points', 'Story points.', '5', 'none'),
      field('blocked_flag', 'Whether blocked.', 'true', 'none'),
      field('blocker_reason', 'Blocker reason.', 'Awaiting environment access'),
      field('acceptance_criteria_present', 'Whether AC is present.', 'false', 'none'),
      field('linked_incident_or_request', 'Linked ServiceNow ticket.', 'INC1048821'),
      field('priority', 'Priority.', 'High'),
    ],
    optionalFields: [
      field('labels', 'Labels.', 'prod-support, batch'),
      field('parent_epic', 'Parent epic.', 'OPS-100'),
      field('dependency_keys', 'Issue dependencies.', 'SEC-12'),
      field('defect_escape_flag', 'Escaped defect indicator.', 'true', 'none'),
      field('reopened_flag', 'Reopen indicator.', 'false', 'none'),
      field('cycle_time_days', 'Cycle time in days.', '8.4', 'none'),
      field('comments_summary', 'Sanitized comment summary.', 'Repeated clarification required.', 'pii_phi_possible'),
      field('test_status', 'Test status.', 'Passed'),
      field('deployment_status', 'Deployment status.', 'Released'),
    ],
    dataSensitivityNotes: 'Delivery items can expose client names, defects, release risks, and security issues.',
    piiPhiSecretsHandling: 'Avoid raw comment threads by default. Capture metadata, summaries, transition history, blockers, and acceptance-criteria quality signals.',
    syntheticDataInstructions: 'Generate epics/stories/bugs across apps and teams with unclear stories, duplicate themes, blockers, slow cycle time, escaped defects, release risk, and linked incidents.',
    contextLayerEntityMappings: ['work_item', 'process_flow_observation', 'operational_evidence_insight'],
    movesArtifactConsumers: ['discovery_report', 'solution_approach_options', 'execution_roadmap', 'business_case'],
    qualityCompletenessScoringRules: [
      'At least 85% of records include component/application, status dates, team, release/sprint, blocked flag, priority, and issue type.',
      'Acceptance criteria quality and blocker fields are populated enough to detect delivery automation opportunities.',
      'Links to incidents/requests are preserved when available.',
    ],
  },
  {
    templateId: 'app_cmdb_inventory',
    version: '1.0.0',
    name: 'App / CMDB Inventory Template',
    pack: 'minimum_viable',
    purpose: 'Map operational work to systems, applications, business services, owners, dependencies, and criticality.',
    typicalSourceSystems: ['ServiceNow CMDB', 'LeanIX', 'Apptio', 'Excel app inventory', 'EA repository', 'Cloud asset inventory'],
    requiredFields: [
      field('application_id', 'Application identifier.', 'MS-APP-012'),
      field('application_name', 'Application name.', 'Advisor Desktop'),
      field('business_service', 'Business service.', 'Advisor service operations'),
      field('business_domain', 'Business domain.', 'Wealth operations'),
      field('technical_owner', 'Technical owner.', 'VP Enterprise Apps'),
      field('business_owner', 'Business owner.', 'Head of Advisor Operations'),
      field('support_group', 'Support group.', 'Advisor Platform Support'),
      field('criticality', 'Criticality rating.', 'Tier 1'),
      field('hosting_model', 'Hosting model.', 'Azure PaaS'),
      field('environment', 'Environment.', 'Production'),
      field('technology_stack', 'Technology stack.', 'React; .NET; SQL Server; Azure Functions'),
      field('upstream_dependencies', 'Upstream dependencies.', 'CRM; portfolio accounting'),
      field('downstream_dependencies', 'Downstream dependencies.', 'Reporting mart; call center desktop'),
      field('regulatory_flag', 'Regulatory indicator.', 'SEC/FINRA recordkeeping', 'pii_phi_possible'),
      field('lifecycle_status', 'Lifecycle status.', 'Modernizing'),
      field('incident_volume_12m', '12-month incident volume.', '428', 'none'),
      field('change_volume_12m', '12-month change volume.', '74', 'none'),
    ],
    optionalFields: [
      field('vendor', 'Vendor or product owner.', 'Internal custom app'),
      field('contract_owner', 'Contract owner.', 'Procurement'),
      field('cost_center', 'Cost center.', 'OPS-1220', 'financial'),
      field('cloud_subscription', 'Cloud subscription/account.', 'sub-prod-wealth'),
      field('data_classification', 'Data classification.', 'Confidential', 'pii_phi_possible'),
      field('retirement_candidate', 'Retirement candidate flag.', 'false', 'none'),
      field('modernization_status', 'Modernization status.', 'Target-state retained'),
      field('known_technical_debt', 'Known technical debt summary.', 'Manual retry workflow; brittle overnight feed.'),
      field('monitoring_tool', 'Monitoring tool.', 'Datadog'),
    ],
    dataSensitivityNotes: 'Can expose critical systems, dependencies, owners, regulatory scope, and cloud/account metadata.',
    piiPhiSecretsHandling: 'Do not include credentials, architecture secrets, private endpoint details, or unnecessary owner personal data.',
    syntheticDataInstructions: 'Generate realistic app inventory with critical apps, legacy apps, SaaS apps, ownership gaps, incident volumes, dependencies, and modernization candidates.',
    contextLayerEntityMappings: ['system_service_map', 'operational_evidence_insight'],
    movesArtifactConsumers: ['discovery_report', 'target_state_architecture', 'execution_roadmap', 'business_case'],
    qualityCompletenessScoringRules: [
      'Critical applications include owners, support groups, dependencies, lifecycle, criticality, and incident/change volume.',
      'Inventory links to ticket/log records through application_id or CI.',
      'Security-sensitive architecture details are excluded or redacted.',
    ],
  },
  {
    templateId: 'log_event_summary',
    version: '1.0.0',
    name: 'Log / Event Summary Template',
    pack: 'minimum_viable',
    purpose: 'Capture observability signals without storing raw logs.',
    typicalSourceSystems: ['Splunk', 'Datadog', 'Dynatrace', 'New Relic', 'Azure Monitor', 'AWS CloudWatch', 'App Insights', 'ELK'],
    requiredFields: [
      field('event_id', 'Event summary identifier.', 'EVT-2026-05-03-01'),
      field('event_time_bucket', 'Time bucket rather than raw event line.', '2026-05-03T02:00Z', 'none'),
      field('application_or_service', 'Application/service.', 'Advisor Desktop API'),
      field('environment', 'Environment.', 'Production'),
      field('event_type', 'error, alert, latency, api_failure, batch_failure, security_signal, or availability.', 'batch_failure'),
      field('severity', 'Severity.', 'High'),
      field('event_class', 'Normalized event class.', 'Nightly portfolio feed failure'),
      field('message_summary', 'Sanitized message summary.', 'Feed job failed after upstream timeout.', 'secret_possible'),
      field('count', 'Event count.', '31', 'none'),
      field('frequency', 'Frequency.', '9 occurrences in 30 days', 'none'),
      field('affected_transaction_or_job', 'Affected transaction or job.', 'Portfolio valuation import'),
      field('average_latency_ms', 'Average latency.', '1840', 'none'),
      field('peak_latency_ms', 'Peak latency.', '9200', 'none'),
      field('linked_ticket_id', 'Linked incident/request.', 'INC1048821'),
      field('linked_change_id', 'Linked change.', 'CHG009812'),
      field('owner_team', 'Owner team.', 'Integration Support'),
    ],
    optionalFields: [
      field('correlation_id', 'Correlation id.', 'corr-a19f'),
      field('API_endpoint', 'Sanitized endpoint/path.', '/portfolio/import', 'secret_possible'),
      field('error_code', 'Error code.', 'UPSTREAM_TIMEOUT'),
      field('retry_count', 'Retry count.', '4', 'none'),
      field('impacted_users_estimate', 'Estimated impacted users.', '220', 'none'),
      field('business_process', 'Business process impacted.', 'Advisor morning readiness'),
      field('alert_noise_flag', 'Noisy alert flag.', 'false', 'none'),
      field('auto_remediation_attempted', 'Auto-remediation attempted.', 'false', 'none'),
    ],
    dataSensitivityNotes: 'Raw logs may contain secrets, tokens, request bodies, customer identifiers, and infrastructure details.',
    piiPhiSecretsHandling: 'Prefer aggregates and sanitized summaries. Do not ingest raw payloads, tokens, secrets, credentials, request bodies, or sensitive data.',
    syntheticDataInstructions: 'Generate repeated API failures, nightly batch failures, latency spikes, retry storms, failed jobs, noisy alerts, and post-release error spikes linked to tickets/Jira.',
    contextLayerEntityMappings: ['operational_event', 'operational_evidence_insight'],
    movesArtifactConsumers: ['discovery_report', 'solution_approach_options', 'target_state_architecture', 'execution_roadmap', 'business_case'],
    qualityCompletenessScoringRules: [
      'Events are aggregated by class/time bucket and include counts/frequency/severity/application.',
      'At least some events link to ticket or change evidence.',
      'No raw logs, secrets, request bodies, or credentials are stored.',
    ],
  },
  {
    templateId: 'process_flow_observation',
    version: '1.0.0',
    name: 'Process Flow Observation Template',
    pack: 'minimum_viable',
    purpose: 'Represent how work actually flows across teams and systems.',
    typicalSourceSystems: ['ServiceNow workflows', 'Jira workflow/status history', 'Approval systems', 'Process interviews', 'Workflow logs', 'Manual process mapping'],
    requiredFields: [
      field('process_name', 'Process name.', 'Incident triage and fulfillment'),
      field('business_domain', 'Business domain.', 'Wealth operations'),
      field('start_event', 'Process start.', 'Advisor submits service request'),
      field('end_event', 'Process end.', 'Request resolved and confirmed'),
      field('process_step', 'Step name.', 'Triage and route'),
      field('system_of_record', 'System of record.', 'ServiceNow'),
      field('owner_team', 'Owner team.', 'Advisor Platform Support'),
      field('queue_or_status', 'Queue/status.', 'Awaiting assignment'),
      field('average_wait_time', 'Average wait time.', '7.5 hours', 'none'),
      field('average_work_time', 'Average work time.', '22 minutes', 'none'),
      field('handoff_to', 'Next team or queue.', 'Integration Support'),
      field('approval_required', 'Approval required.', 'false', 'none'),
      field('rework_loop_flag', 'Rework loop indicator.', 'true', 'none'),
      field('exception_flag', 'Exception indicator.', 'true', 'none'),
      field('evidence_source', 'Evidence source reference.', 'ServiceNow export + process interview'),
      field('pain_point', 'Observed pain point.', 'Manual routing causes repeated handoffs.'),
    ],
    optionalFields: [
      field('automation_candidate', 'Automation candidate.', 'Ticket intake and routing agent'),
      field('policy_or_control', 'Policy/control applicable.', 'Human review for P1/P2 incidents'),
      field('manual_effort_hours', 'Manual effort.', '136 monthly hours', 'none'),
      field('SLA_target', 'SLA target.', '8 business hours', 'none'),
      field('SLA_actual', 'SLA actual.', '12.4 business hours', 'none'),
      field('volume', 'Volume.', '1,240 per quarter', 'none'),
      field('failure_mode', 'Failure mode.', 'Incorrect resolver group'),
      field('improvement_idea', 'Improvement idea.', 'AI classification and KB recommendation.'),
    ],
    dataSensitivityNotes: 'Can include operational controls and sensitive process bottlenecks.',
    piiPhiSecretsHandling: 'Use role/team names and sanitized process summaries rather than user-specific activity traces.',
    syntheticDataInstructions: 'Generate observations showing queues, handoffs, approvals, wait time, rework, exceptions, manual updates, and recurring bottlenecks.',
    contextLayerEntityMappings: ['process_flow_observation', 'operational_evidence_insight'],
    movesArtifactConsumers: minimumConsumers,
    qualityCompletenessScoringRules: [
      'Each process has start/end, owner team, queue/status, wait/work time, handoff, exception/rework, evidence source, and pain point.',
      'Process observations can render a current-state process map and bottleneck map.',
      'Evidence source ties back to ticket/Jira/log/interview records.',
    ],
  },
  {
    templateId: 'ai_opportunity_backlog',
    version: '1.0.0',
    name: 'AI Opportunity Backlog Template',
    pack: 'minimum_viable',
    purpose: 'Capture candidate AI automation opportunities grounded in operational evidence.',
    typicalSourceSystems: ['AbarVa analysis', 'Workshops', 'ServiceNow/Jira/log pattern analysis', 'Process interviews'],
    requiredFields: [
      field('opportunity_id', 'Opportunity identifier.', 'AI-OPP-001'),
      field('opportunity_name', 'Opportunity name.', 'Ticket Intake Agent'),
      field('opportunity_type', 'Opportunity type.', 'triage'),
      field('source_pattern', 'Pattern detected.', 'High reassignment and reopen rates across top categories.'),
      field('affected_process', 'Affected process.', 'Incident triage'),
      field('affected_applications', 'Affected applications.', 'Advisor Desktop; Portfolio Feed'),
      field('affected_teams', 'Affected teams.', 'Advisor Platform Support; Integration Support'),
      field('current_pain', 'Current pain.', 'Manual triage creates handoffs and delays.'),
      field('proposed_ai_capability', 'AI capability.', 'Classify, summarize, recommend resolver group and KB.'),
      field('human_role', 'Future human role.', 'Review high-severity and low-confidence recommendations.'),
      field('agent_role', 'Future agent role.', 'Draft summary and routing recommendation.'),
      field('automation_level', 'assist, recommend, automate_with_approval, or automate.', 'recommend'),
      field('value_score', 'Value score.', '5', 'none'),
      field('feasibility_score', 'Feasibility score.', '4', 'none'),
      field('risk_score', 'Risk score.', '2', 'none'),
      field('readiness_score', 'Readiness score.', '4', 'none'),
      field('priority', 'Priority.', 'P1'),
      field('required_controls', 'Required controls.', 'Human approval for P1/P2; audit log; confidence threshold.'),
      field('evidence_refs', 'Evidence references.', 'INC1048821; EVT-2026-05-03-01; PROC-001'),
    ],
    optionalFields: [
      field('estimated_volume', 'Volume estimate.', '7,500 annual tickets', 'none'),
      field('estimated_effort_saved', 'Effort saved.', '2,100 annual hours', 'none'),
      field('cycle_time_reduction', 'Cycle-time reduction.', '18%', 'none'),
      field('implementation_complexity', 'Implementation complexity.', 'Medium'),
      field('run_cost_impact', 'Run cost impact.', 'Adds model/runtime monitoring cost.', 'financial'),
      field('owner', 'Opportunity owner.', 'Director Service Operations'),
      field('pilot_candidate', 'Pilot candidate flag.', 'true', 'none'),
      field('90_day_fit', 'Fits 90-day pilot.', 'true', 'none'),
      field('dependencies', 'Dependencies.', 'ServiceNow API access; resolver group taxonomy.'),
    ],
    dataSensitivityNotes: 'Opportunity backlog may include sensitive operational weaknesses, controls, and cost/value assumptions.',
    piiPhiSecretsHandling: 'Use evidence references and sanitized patterns, not raw ticket/log text.',
    syntheticDataInstructions: 'Generate ranked AI opportunities tied to evidence patterns with value, feasibility, risk, controls, priority, and pilot fit.',
    contextLayerEntityMappings: ['automation_opportunity', 'human_agent_responsibility', 'operational_evidence_insight'],
    movesArtifactConsumers: ['solution_approach_options', 'target_state_architecture', 'execution_roadmap', 'business_case', 'handoff_package'],
    qualityCompletenessScoringRules: [
      'Each opportunity includes evidence_refs, source pattern, value/feasibility/risk/readiness scores, controls, priority, and human-agent roles.',
      'At least one pilot-suitable opportunity is identified for a 90-day roadmap.',
      'Higher-risk automation levels include explicit human approval and audit controls.',
    ],
  },
  {
    templateId: 'value_effort_estimate',
    version: '1.0.0',
    name: 'Value / Effort Estimate Template',
    pack: 'minimum_viable',
    purpose: 'Estimate value of solving automation opportunities.',
    typicalSourceSystems: ['Ticket volume', 'Cycle time', 'Effort estimates', 'Rate cards', 'Finance assumptions', 'Operational owner input', 'AbarVa estimate model'],
    requiredFields: [
      field('opportunity_id', 'Opportunity identifier.', 'AI-OPP-001'),
      field('value_driver', 'Value driver.', 'Reduced handoffs and faster resolution'),
      field('baseline_volume', 'Baseline volume.', '7,500 annual tickets', 'none'),
      field('baseline_effort_minutes', 'Baseline effort per unit.', '18', 'none'),
      field('baseline_cycle_time', 'Baseline cycle time.', '14.2 hours', 'none'),
      field('baseline_cost', 'Baseline cost.', '$675,000', 'financial'),
      field('target_reduction_percent', 'Target reduction.', '28%', 'none'),
      field('estimated_savings', 'Estimated savings.', '$190,000-$260,000', 'financial'),
      field('implementation_cost', 'Implementation cost.', '$220,000-$310,000', 'financial'),
      field('run_cost', 'Run cost.', '$55,000 annual', 'financial'),
      field('payback_period', 'Payback period.', '12-16 months', 'financial'),
      field('confidence', 'Estimate confidence.', 'Medium'),
      field('assumptions', 'Assumptions.', 'Benchmark planning rates; 50% adoption by month 9.'),
      field('rate_card_source', 'Rate-card source.', 'Benchmark planning assumption', 'financial'),
      field('finance_validation_status', 'Finance validation status.', 'Finance/client validation required'),
    ],
    optionalFields: [
      field('internal_labor_rate', 'Internal labor rate.', '$95/hour', 'financial'),
      field('external_labor_rate', 'External labor rate.', '$150/hour', 'financial'),
      field('agent_runtime_cost', 'Agent runtime cost.', '$1,800/month', 'financial'),
      field('model_api_cost', 'Model/API cost.', '$0.012/request', 'financial'),
      field('monitoring_cost', 'Monitoring cost.', '$20,000 annual', 'financial'),
      field('governance_cost', 'Governance cost.', '$35,000 annual', 'financial'),
      field('training_cost', 'Training cost.', '$45,000', 'financial'),
      field('adoption_cost', 'Adoption cost.', '$60,000', 'financial'),
    ],
    dataSensitivityNotes: 'Contains labor rates, cost assumptions, value estimates, and finance validation state.',
    piiPhiSecretsHandling: 'Do not present fallback or benchmark rates as client-approved rates. Mark validation requirements clearly.',
    syntheticDataInstructions: 'Generate plausible ROM estimates using volume, effort, rate assumptions, confidence levels, and finance validation caveats.',
    contextLayerEntityMappings: ['opportunity_value_estimate', 'operational_evidence_insight'],
    movesArtifactConsumers: ['execution_roadmap', 'business_case', 'handoff_package'],
    qualityCompletenessScoringRules: [
      'Every estimate has baseline volume, effort/cycle/cost, target reduction, savings, implementation/run cost, confidence, rate-card source, and finance validation status.',
      'Fallback or benchmark rates use ranges and finance/client validation wording.',
      'Each estimate maps to an opportunity_id in the AI opportunity backlog.',
    ],
  },
];

const optionalTemplate = (
  templateId: string,
  name: string,
  purpose: string,
  mappings: OperationalEvidenceRecordType[],
  consumers: MoveArtifactConsumer[],
): OperationalEvidenceTemplateDefinition => ({
  templateId,
  version: '1.0.0',
  name,
  pack: 'optional_deep_dive',
  purpose,
  typicalSourceSystems: ['Client upload', 'Workshop notes', 'System export', 'AbarVa analysis'],
  requiredFields: [
    field('tenant_id', 'Tenant or client identifier.', 'morganstreet'),
    field('evidence_id', 'Evidence identifier.', `${templateId.toUpperCase()}-001`),
    field('summary', 'Sanitized evidence summary.', 'Pattern summary tied to source evidence.'),
    field('source_refs', 'Traceable source references.', 'INC1048821; OPS-421; EVT-2026-05-03-01'),
    field('owner', 'Business or technical owner.', 'Operations owner'),
    field('confidence', 'Evidence confidence.', 'Medium'),
  ],
  optionalFields: [
    field('control_notes', 'Control or governance notes.', 'Human review required for high-risk action.'),
    field('client_to_complete', 'Missing client input needed.', 'Confirm rate-card source and owner.'),
  ],
  dataSensitivityNotes: 'Optional evidence can improve executive/board readiness but must not block draft generation.',
  piiPhiSecretsHandling: 'Use sanitized summaries and source references. Avoid raw comments, logs, PHI/PII, secrets, and credentials.',
  syntheticDataInstructions: 'Generate realistic but clearly labeled synthetic evidence connected to minimum-template records.',
  contextLayerEntityMappings: mappings,
  movesArtifactConsumers: consumers,
  qualityCompletenessScoringRules: [
    'Includes evidence id, summary, source refs, owner, and confidence.',
    'Improves readiness without blocking draft generation.',
    'Preserves traceability to minimum evidence or source-system records.',
  ],
});

export const OPTIONAL_OPERATIONAL_EVIDENCE_TEMPLATES: OperationalEvidenceTemplateDefinition[] = [
  optionalTemplate('knowledge_article_gap', 'Knowledge Article Gap Template', 'Identify missing, stale, or low-use runbooks and self-service knowledge.', ['operational_evidence_insight'], ['discovery_report', 'solution_approach_options', 'execution_roadmap']),
  optionalTemplate('change_release_risk', 'Change / Release Risk Template', 'Identify change/release risk patterns and escaped defect signals.', ['work_item', 'operational_evidence_insight'], ['discovery_report', 'execution_roadmap', 'business_case']),
  optionalTemplate('security_privacy_constraint', 'Security / Privacy Constraint Template', 'Document sensitive-data, security, privacy, and compliance constraints.', ['operational_evidence_insight'], ['target_state_architecture', 'execution_roadmap', 'business_case']),
  optionalTemplate('human_agent_responsibility_matrix', 'Human-Agent Responsibility Matrix', 'Specify human-owned, agent-assisted, automated, approval, and exception responsibilities.', ['human_agent_responsibility'], ['target_state_architecture', 'execution_roadmap', 'handoff_package']),
  optionalTemplate('governance_decision', 'Governance Decision Template', 'Capture governance decisions, owners, approval status, and reversibility.', ['operational_evidence_insight'], ['solution_approach_options', 'execution_roadmap', 'handoff_package']),
  optionalTemplate('adoption_readiness', 'Adoption Readiness Template', 'Assess impacted users, readiness, training, and change risks.', ['operational_evidence_insight'], ['execution_roadmap', 'business_case', 'handoff_package']),
  optionalTemplate('data_quality_trust', 'Data Quality / Trust Template', 'Capture operational data completeness, consistency, lineage, and trust caveats.', ['operational_evidence_insight'], ['discovery_report', 'target_state_architecture', 'business_case']),
  optionalTemplate('automation_control_guardrail', 'Automation Control / Guardrail Template', 'Define controls for AI recommendations, approvals, audit, thresholds, and exceptions.', ['human_agent_responsibility', 'operational_evidence_insight'], ['target_state_architecture', 'execution_roadmap', 'handoff_package']),
  optionalTemplate('benefits_realization', 'Benefits Realization Template', 'Track benefit owners, measurement cadence, baselines, and realization gates.', ['opportunity_value_estimate', 'operational_evidence_insight'], ['business_case', 'handoff_package', 'final_readout']),
  optionalTemplate('operational_support_model', 'Operational Support Model Template', 'Define run ownership, support model, monitoring, incident process, and sustainment.', ['system_service_map', 'human_agent_responsibility'], ['target_state_architecture', 'execution_roadmap', 'handoff_package']),
  optionalTemplate('integration_api_failure_pattern', 'Integration/API Failure Pattern Template', 'Summarize recurring API/integration failure patterns and remediation opportunities.', ['operational_event', 'operational_evidence_insight'], ['discovery_report', 'target_state_architecture', 'execution_roadmap']),
  optionalTemplate('alert_noise_reduction', 'Alert Noise Reduction Template', 'Identify noisy alerts, low-signal event classes, and auto-remediation candidates.', ['operational_event', 'automation_opportunity'], ['discovery_report', 'solution_approach_options', 'execution_roadmap']),
];

export const OPERATIONAL_EVIDENCE_TEMPLATE_LIBRARY: OperationalEvidenceTemplateDefinition[] = [
  ...MINIMUM_OPERATIONAL_EVIDENCE_TEMPLATES,
  ...OPTIONAL_OPERATIONAL_EVIDENCE_TEMPLATES,
];

export const OPERATIONAL_SOURCE_SYSTEM_GUIDANCE: OperationalSourceSystemGuidance[] = [
  {
    sourceSystem: 'ServiceNow / ITSM',
    request: ['Incidents', 'Requests', 'Changes', 'Problems', 'Assignment groups', 'Business services', 'CMDB CI references', 'SLA breach fields', 'Reassignment/reopen history', 'Resolution codes', 'Knowledge usage', 'Linked changes/incidents/problems'],
    value: 'Shows operational pain, handoffs, recurring work, SLA gaps, support patterns, knowledge gaps, and automation candidates.',
    safeCaptureGuidance: 'Prefer metadata, sanitized summaries, categories, resolution codes, assignment history, and source refs. Avoid raw comments and attachments unless reviewed.',
  },
  {
    sourceSystem: 'Jira / Delivery System',
    request: ['Epics', 'Stories', 'Bugs', 'Tasks', 'Components', 'Labels', 'Status history', 'Sprint/release', 'Blockers', 'Story points', 'Acceptance criteria', 'Linked incidents/requests', 'Defects'],
    value: 'Shows delivery bottlenecks, backlog quality, duplicate demand, dependencies, release risk, and product/process improvement opportunities.',
    safeCaptureGuidance: 'Use issue metadata, sanitized summaries, blocker reasons, acceptance-criteria quality flags, and transition dates rather than raw comments.',
  },
  {
    sourceSystem: 'Logs / Observability',
    request: ['Aggregated error classes', 'Alert summaries', 'Latency metrics', 'API failure counts', 'Batch/job failure summaries', 'Retry counts', 'Correlation to incidents/changes', 'Service/application mapping'],
    value: 'Shows system behavior before it becomes tickets and helps detect incident prevention, root-cause, alert noise, and performance opportunities.',
    safeCaptureGuidance: 'Capture aggregate event classes and sanitized summaries. Do not store raw payloads, request bodies, tokens, secrets, or credentials.',
  },
  {
    sourceSystem: 'CMDB / App Inventory',
    request: ['Application inventory', 'Business services', 'CIs', 'Owners', 'Criticality', 'Dependencies', 'Support group', 'Lifecycle status', 'Hosting model', 'Vendor', 'Incident/change volume'],
    value: 'Connects operational evidence to systems, services, dependencies, owners, criticality, and accountability.',
    safeCaptureGuidance: 'Avoid secrets and over-specific security topology. Use owners as roles/groups where possible.',
  },
  {
    sourceSystem: 'Knowledge Base',
    request: ['KB article list', 'Usage counts', 'Linked ticket categories', 'Last updated date', 'Ownership', 'Feedback/usefulness rating'],
    value: 'Identifies where AI can generate or improve runbooks, self-service guidance, and resolver recommendations.',
    safeCaptureGuidance: 'Capture article metadata, sanitized excerpts, and source links. Do not ingest sensitive article bodies without review.',
  },
];

export function operationalTemplateToJsonSchema(templateId: string): Record<string, unknown> {
  const template = OPERATIONAL_EVIDENCE_TEMPLATE_LIBRARY.find((candidate) => candidate.templateId === templateId);
  if (!template) {
    throw new Error(`Unknown operational evidence template: ${templateId}`);
  }

  const properties = [...template.requiredFields, ...template.optionalFields].reduce<Record<string, unknown>>((acc, templateField) => {
    acc[templateField.name] = {
      type: 'string',
      description: templateField.description,
      examples: [templateField.example],
      sensitivity: templateField.sensitivity,
    };
    return acc;
  }, {});

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: template.name,
    description: template.purpose,
    type: 'object',
    required: template.requiredFields.map((templateField) => templateField.name),
    properties,
    additionalProperties: true,
    'x-abarva-template-id': template.templateId,
    'x-abarva-version': template.version,
    'x-abarva-context-layer-mappings': template.contextLayerEntityMappings,
    'x-abarva-moves-artifact-consumers': template.movesArtifactConsumers,
  };
}

export function generateSyntheticOperationalEvidencePack(input: {
  tenantId: string;
  useCaseName?: string;
  generatedAt?: string;
}): SyntheticOperationalEvidencePack {
  const tenantId = input.tenantId;
  const useCaseName = input.useCaseName ?? 'Morgan Street-style AI Opportunity Discovery';
  const generatedAt = input.generatedAt ?? '2026-06-23T00:00:00.000Z';

  const operationalUseCaseIntake = {
    tenant_id: tenantId,
    use_case_name: useCaseName,
    business_domain: 'Wealth operations',
    process_area: 'Advisor service operations and production support',
    sponsor: 'COO',
    business_owner: 'Head of Advisor Operations',
    IT_owner: 'VP Enterprise Applications',
    problem_statement: 'Advisor operations experience repeated ticket handoffs, delayed approvals, and recurring integration failures across ServiceNow, Jira, and application telemetry.',
    desired_outcome: 'Identify evidence-backed AI opportunities that reduce handoffs, improve knowledge reuse, and accelerate safe resolution.',
    systems_in_scope: 'ServiceNow ITSM; Jira; Datadog; CMDB; Knowledge Base',
    time_period_to_analyze: 'Trailing 12 months',
    known_constraints: 'No raw client PII, credentials, or raw log payloads in working corpus.',
    expected_value: 'ROM annual value pool of $1.1M-$1.7M before finance validation.',
    risk_or_compliance_constraints: 'Human approval required for high-severity incidents and client-impacting workflow actions.',
    success_criteria: 'Ranked opportunity backlog with evidence, human-agent controls, 90-day pilot, and value estimate.',
    source_type: 'synthetic_demo',
  };

  const serviceNowTickets = [
    {
      ticket_id: 'INC1048821',
      ticket_type: 'incident',
      short_description: 'Portfolio feed failed overnight',
      category: 'Integration',
      subcategory: 'Batch failure',
      priority: 'P2',
      severity: 'High',
      business_service: 'Advisor service operations',
      application_or_CI: 'MS-APP-012',
      assignment_group: 'Integration Support',
      opened_at: '2026-05-03T02:14:00Z',
      resolved_at: '2026-05-03T08:37:00Z',
      status: 'Resolved',
      resolution_code: 'Job rerun',
      resolution_summary: 'Restarted failed job and replayed message batch.',
      sla_breached: true,
      reopen_count: 1,
      reassignment_count: 3,
      knowledge_article_used: 'KB-1182',
      requester_group: 'Advisor support',
      channel: 'Portal',
      linked_jira_key: 'OPS-421',
      linked_alert_id: 'EVT-2026-05-03-01',
      source_type: 'synthetic_demo',
    },
    {
      ticket_id: 'REQ771204',
      ticket_type: 'request',
      short_description: 'Advisor assistant access request waiting for approval',
      category: 'Access',
      subcategory: 'Role provisioning',
      priority: 'P3',
      severity: 'Medium',
      business_service: 'Advisor onboarding',
      application_or_CI: 'MS-APP-009',
      assignment_group: 'Identity Operations',
      opened_at: '2026-05-05T14:12:00Z',
      resolved_at: '2026-05-09T19:42:00Z',
      status: 'Closed',
      resolution_code: 'Approved and provisioned',
      resolution_summary: 'Manual manager approval and entitlement update completed.',
      sla_breached: true,
      reopen_count: 0,
      reassignment_count: 2,
      knowledge_article_used: 'KB-0922',
      requester_group: 'Branch operations',
      channel: 'Email',
      linked_jira_key: 'OPS-447',
      linked_alert_id: '',
      source_type: 'synthetic_demo',
    },
    {
      ticket_id: 'INC1049914',
      ticket_type: 'incident',
      short_description: 'Client document package generation returned errors',
      category: 'Application',
      subcategory: 'Document workflow',
      priority: 'P2',
      severity: 'High',
      business_service: 'Client onboarding',
      application_or_CI: 'MS-APP-018',
      assignment_group: 'Digital Workflow Support',
      opened_at: '2026-05-08T16:08:00Z',
      resolved_at: '2026-05-09T01:45:00Z',
      status: 'Resolved',
      resolution_code: 'Configuration corrected',
      resolution_summary: 'Corrected document template mapping.',
      sla_breached: false,
      reopen_count: 2,
      reassignment_count: 4,
      knowledge_article_used: 'none',
      requester_group: 'Onboarding operations',
      channel: 'Portal',
      linked_jira_key: 'OPS-462',
      linked_alert_id: 'EVT-2026-05-08-02',
      source_type: 'synthetic_demo',
    },
  ];

  const jiraDeliveryItems = [
    {
      issue_key: 'OPS-421',
      issue_type: 'bug',
      summary: 'Stabilize portfolio feed retry handling',
      component: 'Integration services',
      application: 'Advisor Desktop',
      business_domain: 'Wealth operations',
      status: 'Done',
      created_at: '2026-05-04T12:00:00Z',
      updated_at: '2026-05-13T15:20:00Z',
      resolved_at: '2026-05-13T15:20:00Z',
      assignee_team: 'Integration Engineering',
      sprint: '2026.10',
      release: 'R26.05',
      story_points: 5,
      blocked_flag: true,
      blocker_reason: 'Awaiting production log correlation access',
      acceptance_criteria_present: false,
      linked_incident_or_request: 'INC1048821',
      priority: 'High',
      cycle_time_days: 8.4,
      source_type: 'synthetic_demo',
    },
    {
      issue_key: 'OPS-447',
      issue_type: 'story',
      summary: 'Automate approval reminders for advisor access requests',
      component: 'Identity workflow',
      application: 'Access Manager',
      business_domain: 'Wealth operations',
      status: 'In Progress',
      created_at: '2026-05-05T18:00:00Z',
      updated_at: '2026-05-15T16:00:00Z',
      resolved_at: '',
      assignee_team: 'Identity Engineering',
      sprint: '2026.11',
      release: 'R26.06',
      story_points: 8,
      blocked_flag: true,
      blocker_reason: 'Approval policy owner not confirmed',
      acceptance_criteria_present: true,
      linked_incident_or_request: 'REQ771204',
      priority: 'Medium',
      cycle_time_days: 10.1,
      source_type: 'synthetic_demo',
    },
  ];

  const appCmdbInventory = [
    {
      application_id: 'MS-APP-012',
      application_name: 'Advisor Desktop',
      business_service: 'Advisor service operations',
      business_domain: 'Wealth operations',
      technical_owner: 'VP Enterprise Applications',
      business_owner: 'Head of Advisor Operations',
      support_group: 'Advisor Platform Support',
      criticality: 'Tier 1',
      hosting_model: 'Azure PaaS',
      environment: 'Production',
      technology_stack: 'React; .NET; SQL Server; Azure Functions',
      upstream_dependencies: 'Portfolio Accounting; CRM',
      downstream_dependencies: 'Reporting mart; Call center desktop',
      regulatory_flag: 'SEC/FINRA recordkeeping',
      lifecycle_status: 'Modernizing',
      incident_volume_12m: 428,
      change_volume_12m: 74,
      source_type: 'synthetic_demo',
    },
    {
      application_id: 'MS-APP-018',
      application_name: 'Client Document Workflow',
      business_service: 'Client onboarding',
      business_domain: 'Wealth operations',
      technical_owner: 'Director Digital Workflow',
      business_owner: 'Head of Onboarding Operations',
      support_group: 'Digital Workflow Support',
      criticality: 'Tier 2',
      hosting_model: 'SaaS + custom integration',
      environment: 'Production',
      technology_stack: 'Doc platform; API gateway; workflow engine',
      upstream_dependencies: 'CRM; KYC provider',
      downstream_dependencies: 'Archive; advisor desktop',
      regulatory_flag: 'Client document retention',
      lifecycle_status: 'Retain and remediate',
      incident_volume_12m: 211,
      change_volume_12m: 49,
      source_type: 'synthetic_demo',
    },
  ];

  const logEventSummaries = [
    {
      event_id: 'EVT-2026-05-03-01',
      event_time_bucket: '2026-05-03T02:00Z',
      application_or_service: 'Advisor Desktop API',
      environment: 'Production',
      event_type: 'batch_failure',
      severity: 'High',
      event_class: 'Nightly portfolio feed failure',
      message_summary: 'Feed job failed after upstream timeout.',
      count: 31,
      frequency: '9 occurrences in 30 days',
      affected_transaction_or_job: 'Portfolio valuation import',
      average_latency_ms: 1840,
      peak_latency_ms: 9200,
      linked_ticket_id: 'INC1048821',
      linked_change_id: 'CHG009812',
      owner_team: 'Integration Support',
      source_type: 'synthetic_demo',
    },
    {
      event_id: 'EVT-2026-05-08-02',
      event_time_bucket: '2026-05-08T16:00Z',
      application_or_service: 'Document Workflow API',
      environment: 'Production',
      event_type: 'api_failure',
      severity: 'Medium',
      event_class: 'Template mapping validation error',
      message_summary: 'Document generation failed for invalid template mapping.',
      count: 18,
      frequency: '5 occurrences in 30 days',
      affected_transaction_or_job: 'Client document generation',
      average_latency_ms: 980,
      peak_latency_ms: 4100,
      linked_ticket_id: 'INC1049914',
      linked_change_id: 'CHG009944',
      owner_team: 'Digital Workflow Support',
      source_type: 'synthetic_demo',
    },
  ];

  const processFlowObservations = [
    {
      process_name: 'Incident triage and fulfillment',
      business_domain: 'Wealth operations',
      start_event: 'Advisor support opens incident',
      end_event: 'Incident resolved and pattern tagged',
      process_step: 'Triage and route',
      system_of_record: 'ServiceNow',
      owner_team: 'Advisor Platform Support',
      queue_or_status: 'Awaiting assignment',
      average_wait_time: '7.5 hours',
      average_work_time: '22 minutes',
      handoff_to: 'Integration Support',
      approval_required: false,
      rework_loop_flag: true,
      exception_flag: true,
      evidence_source: 'INC1048821; INC1049914; EVT-2026-05-03-01',
      pain_point: 'Manual routing causes repeated handoffs and late expert engagement.',
      automation_candidate: 'Ticket Intake Agent',
      source_type: 'synthetic_demo',
    },
    {
      process_name: 'Advisor access request approval',
      business_domain: 'Wealth operations',
      start_event: 'Access request submitted',
      end_event: 'Entitlement provisioned',
      process_step: 'Manager and policy approval',
      system_of_record: 'ServiceNow + Access Manager',
      owner_team: 'Identity Operations',
      queue_or_status: 'Awaiting approval',
      average_wait_time: '31.4 hours',
      average_work_time: '14 minutes',
      handoff_to: 'Manager approver',
      approval_required: true,
      rework_loop_flag: false,
      exception_flag: true,
      evidence_source: 'REQ771204; OPS-447',
      pain_point: 'Approvals stall when policy owner or manager is unclear.',
      automation_candidate: 'Approval Policy Assistant',
      source_type: 'synthetic_demo',
    },
  ];

  const aiOpportunityBacklog = [
    {
      opportunity_id: 'AI-OPP-001',
      opportunity_name: 'Ticket Intake Agent',
      opportunity_type: 'triage',
      source_pattern: 'High reassignment and reopen rates across integration and document workflow incidents.',
      affected_process: 'Incident triage and fulfillment',
      affected_applications: 'MS-APP-012; MS-APP-018',
      affected_teams: 'Advisor Platform Support; Integration Support; Digital Workflow Support',
      current_pain: 'Manual triage creates handoffs, slow resolver engagement, and inconsistent knowledge use.',
      proposed_ai_capability: 'Classify, summarize, detect pattern, recommend priority, resolver group, and KB/runbook.',
      human_role: 'Review high-severity and low-confidence recommendations before assignment.',
      agent_role: 'Draft summary, routing recommendation, KB suggestion, and evidence citation.',
      automation_level: 'recommend',
      value_score: 5,
      feasibility_score: 4,
      risk_score: 2,
      readiness_score: 4,
      priority: 'P1',
      required_controls: 'Confidence threshold; human approval for P1/P2; audit log; resolver override tracking.',
      evidence_refs: 'INC1048821; INC1049914; EVT-2026-05-03-01; PROC-incident-triage',
      estimated_volume: 7500,
      estimated_effort_saved: '2100 annual hours',
      cycle_time_reduction: '18%',
      pilot_candidate: true,
      '90_day_fit': true,
      source_type: 'synthetic_demo',
    },
    {
      opportunity_id: 'AI-OPP-002',
      opportunity_name: 'Approval Policy Assistant',
      opportunity_type: 'approval',
      source_pattern: 'Access requests breach SLA because approval owner and policy conditions are unclear.',
      affected_process: 'Advisor access request approval',
      affected_applications: 'MS-APP-009',
      affected_teams: 'Identity Operations; Branch Operations',
      current_pain: 'Manual follow-up and unclear approval paths delay advisor onboarding.',
      proposed_ai_capability: 'Recommend approval path, summarize entitlement purpose, and prompt approver action.',
      human_role: 'Approve/deny access and handle exceptions.',
      agent_role: 'Summarize request, identify policy owner, send reminders, and maintain audit evidence.',
      automation_level: 'assist',
      value_score: 4,
      feasibility_score: 4,
      risk_score: 3,
      readiness_score: 3,
      priority: 'P2',
      required_controls: 'Role policy validation; approver attestation; SoD check; audit log.',
      evidence_refs: 'REQ771204; OPS-447; PROC-access-approval',
      estimated_volume: 4200,
      estimated_effort_saved: '980 annual hours',
      cycle_time_reduction: '22%',
      pilot_candidate: true,
      '90_day_fit': true,
      source_type: 'synthetic_demo',
    },
  ];

  const valueEffortEstimates = [
    {
      opportunity_id: 'AI-OPP-001',
      value_driver: 'Reduced reassignment, faster resolver engagement, better knowledge reuse',
      baseline_volume: 7500,
      baseline_effort_minutes: 18,
      baseline_cycle_time: '14.2 hours',
      baseline_cost: '$675,000',
      target_reduction_percent: '28%',
      estimated_savings: '$190,000-$260,000 annual ROM',
      implementation_cost: '$220,000-$310,000',
      run_cost: '$55,000 annual',
      payback_period: '12-16 months',
      confidence: 'Medium',
      assumptions: 'Benchmark planning rates; 50% adoption by month 9; human review retained for P1/P2.',
      rate_card_source: 'Benchmark planning assumption',
      finance_validation_status: 'Finance/client validation required',
      source_type: 'synthetic_demo',
    },
    {
      opportunity_id: 'AI-OPP-002',
      value_driver: 'Lower approval wait time and fewer manual follow-ups',
      baseline_volume: 4200,
      baseline_effort_minutes: 14,
      baseline_cycle_time: '38.6 hours',
      baseline_cost: '$245,000',
      target_reduction_percent: '22%',
      estimated_savings: '$75,000-$115,000 annual ROM',
      implementation_cost: '$140,000-$210,000',
      run_cost: '$35,000 annual',
      payback_period: '18-24 months',
      confidence: 'Low-Medium',
      assumptions: 'Requires client approval policy confirmation and finance rate validation.',
      rate_card_source: 'Benchmark planning assumption',
      finance_validation_status: 'Finance/client validation required',
      source_type: 'synthetic_demo',
    },
  ];

  const derivedOpportunityExplanations: OperationalDerivedOpportunityExplanation[] = [
    {
      opportunityId: 'AI-OPP-001',
      opportunityName: 'Ticket Intake Agent',
      sourceEvidenceUsed: ['INC1048821', 'INC1049914', 'EVT-2026-05-03-01', 'PROC-incident-triage'],
      patternDetected: 'Repeated integration/document incidents show multiple reassignments, reopens, and inconsistent knowledge use.',
      currentPain: 'Manual triage causes handoffs, delays, and late expert engagement.',
      businessImpact: 'Advisor service readiness is delayed and support effort is spent on classification rather than resolution.',
      proposedAiCapability: 'Classify, summarize, recommend resolver group/priority/KB, and cite supporting evidence.',
      humanRole: 'Review high-severity and low-confidence routing recommendations.',
      agentRole: 'Prepare routing recommendation, summary, KB suggestion, and audit trail.',
      estimatedValue: '$190,000-$260,000 annual ROM; finance/client validation required.',
      riskFeasibilityReadiness: 'Value 5 / feasibility 4 / risk 2 / readiness 4.',
      requiredControls: ['Confidence threshold', 'Human approval for P1/P2', 'Audit log', 'Resolver override tracking'],
      recommendedNextStep: 'Run 90-day pilot on integration and document workflow categories.',
    },
    {
      opportunityId: 'AI-OPP-002',
      opportunityName: 'Approval Policy Assistant',
      sourceEvidenceUsed: ['REQ771204', 'OPS-447', 'PROC-access-approval'],
      patternDetected: 'Access requests stall because approval owners and policy conditions are unclear.',
      currentPain: 'Manual follow-ups delay advisor onboarding and increase operations effort.',
      businessImpact: 'Advisor productivity and onboarding speed suffer while identity teams chase approvals.',
      proposedAiCapability: 'Recommend approval path, summarize entitlement purpose, and nudge approvers with policy context.',
      humanRole: 'Approve or deny access and resolve exceptions.',
      agentRole: 'Draft request summary, identify approver/policy, send reminders, and retain evidence.',
      estimatedValue: '$75,000-$115,000 annual ROM; finance/client validation required.',
      riskFeasibilityReadiness: 'Value 4 / feasibility 4 / risk 3 / readiness 3.',
      requiredControls: ['Role policy validation', 'Approver attestation', 'SoD check', 'Audit log'],
      recommendedNextStep: 'Validate approval-policy ownership and pilot with branch operations.',
    },
  ];

  return {
    tenantId,
    useCaseName,
    sourceType: 'synthetic_demo',
    syntheticLabel: 'Synthetic demo evidence - not client-approved production truth',
    generatedAt,
    templatesUsed: MINIMUM_OPERATIONAL_EVIDENCE_TEMPLATES.map((template) => template.templateId),
    records: {
      operationalUseCaseIntake,
      serviceNowTickets,
      jiraDeliveryItems,
      appCmdbInventory,
      logEventSummaries,
      processFlowObservations,
      aiOpportunityBacklog,
      valueEffortEstimates,
    },
    derivedOpportunityExplanations,
  };
}

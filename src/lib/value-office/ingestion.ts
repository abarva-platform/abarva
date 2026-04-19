import { getAbarNexusSourcesForVertical, type AbarNexusSource } from './abarnexus'

export type AbarNexusLandingZone = 'vector_index' | 'structured_tables' | 'both'
export type AbarNexusObjectType =
  | 'document'
  | 'metric_series'
  | 'org_fact'
  | 'workflow_fact'
  | 'financial_fact'
  | 'telemetry_fact'
  | 'benchmark_fact'

export interface AbarNexusIngestionBlueprint {
  sourceId: string
  sourceName: string
  tier: AbarNexusSource['tier']
  category: AbarNexusSource['category']
  delivery: AbarNexusSource['delivery']
  landingZone: AbarNexusLandingZone
  normalizedObjects: AbarNexusObjectType[]
  freshnessExpectation: 'ad_hoc' | 'monthly' | 'quarterly' | 'continuous'
  initialStatus: 'planned' | 'candidate' | 'preferred'
  whyItMatters: string
}

export type AbarNexusRunStatus = 'ready' | 'needs_setup' | 'blocked' | 'planned'

export interface AbarNexusOperationalSource extends AbarNexusIngestionBlueprint {
  runStatus: AbarNexusRunStatus
  readinessScore: number
  blocker: string | null
  nextStep: string
}

export interface AbarNexusNormalizedRecord {
  objectType: AbarNexusObjectType
  title: string
  summary: string
  sourceId: string
  recordDate: string
  payload: Record<string, unknown>
}

export interface AbarNexusConnectorTemplate {
  id: 'manual_input' | 'extract_upload' | 'scheduled_feed' | 'direct_api' | 'data_share'
  title: string
  summary: string
  bestFor: string
  setupEffort: 'low' | 'medium' | 'high'
  automationLevel: 'manual' | 'semi_automated' | 'automated'
  requiredInputs: string[]
  emittedObjects: AbarNexusObjectType[]
  setupSteps: string[]
  outputContract: string
}

export interface AbarNexusExportContract {
  objectName: string
  cadence: string
  requiredColumns: string[]
  joinKeys: string[]
  qualityChecks: string[]
}

export interface AbarNexusConnectorPlaybook {
  id: string
  title: string
  systemFamily: string
  recommendedTemplateId: AbarNexusConnectorTemplate['id']
  summary: string
  bestFor: string
  onboardingChecklist: string[]
  exportContract: AbarNexusExportContract
  requestTemplate: {
    subject: string
    instructions: string[]
  }
}

function inferLandingZone(source: AbarNexusSource): AbarNexusLandingZone {
  if (source.category === 'research' || source.category === 'regulatory') return 'both'
  if (source.category === 'benchmark' || source.category === 'labor' || source.category === 'financial') return 'structured_tables'
  if (source.delivery === 'manual_input') return 'both'
  return 'structured_tables'
}

function inferNormalizedObjects(source: AbarNexusSource): AbarNexusObjectType[] {
  switch (source.category) {
    case 'business':
      return ['org_fact', 'workflow_fact', 'document']
    case 'financial':
      return ['financial_fact', 'metric_series', 'document']
    case 'workflow':
      return ['workflow_fact', 'metric_series']
    case 'it':
      return ['org_fact', 'telemetry_fact', 'document']
    case 'benchmark':
      return ['benchmark_fact', 'metric_series']
    case 'labor':
      return ['benchmark_fact', 'document']
    case 'market':
      return ['benchmark_fact', 'document']
    case 'regulatory':
      return ['benchmark_fact', 'document']
    case 'technographic':
      return ['telemetry_fact', 'benchmark_fact']
    case 'research':
      return ['benchmark_fact', 'document']
    default:
      return ['document']
  }
}

function inferFreshness(source: AbarNexusSource): AbarNexusIngestionBlueprint['freshnessExpectation'] {
  if (source.delivery === 'manual_input') return 'ad_hoc'
  if (source.delivery === 'extract_upload' || source.delivery === 'data_share') return 'monthly'
  if (source.category === 'financial' || source.category === 'benchmark') return 'quarterly'
  return 'continuous'
}

function inferInitialStatus(source: AbarNexusSource): AbarNexusIngestionBlueprint['initialStatus'] {
  if (source.tier === 'client_required') return 'preferred'
  if (source.tier === 'free_now') return 'candidate'
  return 'planned'
}

export function buildAbarNexusIngestionBlueprint(vertical: string): AbarNexusIngestionBlueprint[] {
  return getAbarNexusSourcesForVertical(vertical).map(source => ({
    sourceId: source.id,
    sourceName: source.name,
    tier: source.tier,
    category: source.category,
    delivery: source.delivery,
    landingZone: inferLandingZone(source),
    normalizedObjects: inferNormalizedObjects(source),
    freshnessExpectation: inferFreshness(source),
    initialStatus: inferInitialStatus(source),
    whyItMatters: source.why_it_matters,
  }))
}

export function getPriorityIngestionBlueprint(vertical: string) {
  const blueprints = buildAbarNexusIngestionBlueprint(vertical)

  return {
    preferred: blueprints.filter(source => source.initialStatus === 'preferred'),
    candidate: blueprints.filter(source => source.initialStatus === 'candidate'),
    planned: blueprints.filter(source => source.initialStatus === 'planned'),
  }
}

function inferRunStatus(source: AbarNexusIngestionBlueprint): AbarNexusRunStatus {
  if (source.tier === 'premium_later') return 'planned'
  if (source.tier === 'client_required' && source.delivery === 'manual_input') return 'needs_setup'
  if (source.tier === 'client_required') return 'ready'
  if (source.delivery === 'direct_api') return 'ready'
  if (source.delivery === 'data_share') return 'planned'
  return 'needs_setup'
}

function inferReadinessScore(source: AbarNexusIngestionBlueprint) {
  if (source.tier === 'premium_later') return 20
  if (source.delivery === 'direct_api') return 80
  if (source.delivery === 'extract_upload') return 65
  if (source.delivery === 'manual_input') return 50
  return 40
}

function inferBlocker(source: AbarNexusIngestionBlueprint) {
  if (source.tier === 'premium_later') return 'Commercial data agreement not yet justified.'
  if (source.tier === 'client_required' && source.delivery === 'manual_input') return 'Needs structured client submission workflow.'
  if (source.tier === 'client_required' && source.delivery === 'extract_upload') return 'Needs repeatable client extract template and drop zone.'
  if (source.delivery === 'data_share') return 'Data-share contract and ingestion parser not in place yet.'
  return null
}

function inferNextStep(source: AbarNexusIngestionBlueprint) {
  if (source.tier === 'premium_later') return 'Keep in roadmap until a paid enrichment case is proven.'
  if (source.tier === 'client_required' && source.delivery === 'manual_input') return 'Design guided submission object and validation rules.'
  if (source.tier === 'client_required' && source.delivery === 'extract_upload') return 'Define extract template and map fields into normalized objects.'
  if (source.delivery === 'direct_api') return 'Add a lightweight fetch job and map responses into structured facts.'
  return 'Define the first runnable ingestion job.'
}

export function buildOperationalIngestionRegistry(vertical: string): AbarNexusOperationalSource[] {
  return buildAbarNexusIngestionBlueprint(vertical).map(source => ({
    ...source,
    runStatus: inferRunStatus(source),
    readinessScore: inferReadinessScore(source),
    blocker: inferBlocker(source),
    nextStep: inferNextStep(source),
  }))
}

export function getOperationalIngestionSummary(vertical: string) {
  const registry = buildOperationalIngestionRegistry(vertical)
  return {
    registry,
    ready: registry.filter(source => source.runStatus === 'ready'),
    needsSetup: registry.filter(source => source.runStatus === 'needs_setup'),
    blocked: registry.filter(source => source.runStatus === 'blocked'),
    planned: registry.filter(source => source.runStatus === 'planned'),
  }
}

export function getConnectorTemplates(): AbarNexusConnectorTemplate[] {
  return [
    {
      id: 'manual_input',
      title: 'Guided manual input',
      summary: 'Structured submission flow for cases where the client has the information but no export path yet.',
      bestFor: 'IT estate, governance facts, ownership maps, architecture context, and early design-partner onboarding.',
      setupEffort: 'low',
      automationLevel: 'manual',
      requiredInputs: ['Structured form fields', 'Validation rules', 'Named business owner', 'Submission notes'],
      emittedObjects: ['org_fact', 'workflow_fact', 'document'],
      setupSteps: [
        'Define the submission object and required fields.',
        'Validate entries before they land in structured tables.',
        'Store the narrative context in vector memory for retrieval.',
      ],
      outputContract: 'One validated submission produces reusable client truth objects plus linked narrative context.',
    },
    {
      id: 'extract_upload',
      title: 'Extract and upload',
      summary: 'Repeatable export template the client can pull from ERP, workflow, finance, or BI systems and upload on a cadence.',
      bestFor: 'Finance baselines, workflow metrics, productivity snapshots, vendor spend, and historical KPI files.',
      setupEffort: 'medium',
      automationLevel: 'semi_automated',
      requiredInputs: ['CSV or XLSX extract template', 'Field mapping', 'Cadence owner', 'Quality checks'],
      emittedObjects: ['financial_fact', 'workflow_fact', 'metric_series'],
      setupSteps: [
        'Define the export columns once per source system.',
        'Map columns into normalized AbarNexus objects.',
        'Run validation checks before evidence becomes visible to the product.',
      ],
      outputContract: 'Each upload creates traceable normalized fact tables and timestamped evidence snapshots.',
    },
    {
      id: 'scheduled_feed',
      title: 'Scheduled feed',
      summary: 'File-drop or warehouse-feed pattern that moves recurring extracts into AbarNexus without a full direct API integration.',
      bestFor: 'ServiceNow exports, Copilot usage exports, data warehouse tables, and recurring business performance feeds.',
      setupEffort: 'medium',
      automationLevel: 'semi_automated',
      requiredInputs: ['Drop zone or warehouse table', 'Refresh cadence', 'Schema contract', 'Monitoring rules'],
      emittedObjects: ['workflow_fact', 'telemetry_fact', 'metric_series'],
      setupSteps: [
        'Agree the delivery path and file or table schema.',
        'Schedule ingestion and freshness checks.',
        'Attach alerts for stale or malformed deliveries.',
      ],
      outputContract: 'Each scheduled delivery refreshes evidence and telemetry facts without manual recapture.',
    },
    {
      id: 'direct_api',
      title: 'Direct integration',
      summary: 'API-driven connector for sources with stable endpoints where automation is worth the implementation effort.',
      bestFor: 'Public benchmark APIs, mature telemetry endpoints, and high-value recurring sources.',
      setupEffort: 'high',
      automationLevel: 'automated',
      requiredInputs: ['API credentials', 'Endpoint contract', 'Rate-limit policy', 'Retry and monitoring plan'],
      emittedObjects: ['benchmark_fact', 'telemetry_fact', 'metric_series', 'document'],
      setupSteps: [
        'Implement a fetch job with retry and backoff behavior.',
        'Map API payloads into normalized records.',
        'Persist run logs and surface freshness state in the product.',
      ],
      outputContract: 'Connector runs autonomously, refreshes normalized records, and exposes run health back to Control Tower.',
    },
    {
      id: 'data_share',
      title: 'Data share',
      summary: 'Roadmap pattern for premium or partner datasets that arrive as governed shares rather than one-off extracts.',
      bestFor: 'Premium labor intelligence, technographics, market data, and subscription enrichment layers.',
      setupEffort: 'high',
      automationLevel: 'automated',
      requiredInputs: ['Commercial agreement', 'Schema agreement', 'Entitlement controls', 'Refresh ownership'],
      emittedObjects: ['benchmark_fact', 'telemetry_fact', 'document'],
      setupSteps: [
        'Validate product rights and embedding terms.',
        'Map shared tables or files into normalized objects.',
        'Gate access so premium enrichment augments but does not break the core workflow.',
      ],
      outputContract: 'Shared premium datasets land as optional enrichment without changing the rest of the product model.',
    },
  ]
}

export function getConnectorTemplate(id: AbarNexusConnectorTemplate['id']) {
  return getConnectorTemplates().find(template => template.id === id) || null
}

export function getPriorityConnectorPlaybooks(): AbarNexusConnectorPlaybook[] {
  return [
    {
      id: 'servicenow-ops-feed',
      title: 'ServiceNow evidence feed',
      systemFamily: 'ServiceNow',
      recommendedTemplateId: 'scheduled_feed',
      summary: 'Use recurring exports or warehouse-fed ServiceNow tables to prove ticket-volume reduction, triage quality, and automation throughput.',
      bestFor: 'IT run reduction, service desk transformation, incident triage, access requests, and agentic workflow operations.',
      onboardingChecklist: [
        'Confirm the source of truth for incidents, requests, and task state changes.',
        'Agree whether the feed comes from ServiceNow export, data warehouse table, or managed file drop.',
        'Identify the operational owner and the finance or transformation owner who trusts the KPI definitions.',
        'Lock a refresh cadence and escalation rule for stale deliveries.',
      ],
      exportContract: {
        objectName: 'servicenow_ticket_fact',
        cadence: 'Daily or weekly scheduled feed',
        requiredColumns: ['ticket_id', 'opened_at', 'closed_at', 'assignment_group', 'category', 'priority', 'resolution_code', 'automation_flag'],
        joinKeys: ['ticket_id', 'assignment_group', 'opened_at'],
        qualityChecks: ['No duplicate ticket_id per delivery', 'opened_at and closed_at parse cleanly', 'automation_flag values are normalized'],
      },
      requestTemplate: {
        subject: 'Request ServiceNow operational export for AI value tracking',
        instructions: [
          'Provide a recurring export or warehouse-fed table covering incidents, requests, and task state transitions.',
          'Use the agreed contract so we can measure automation throughput, resolution speed, and ticket-volume shifts.',
          'Name the operational owner for the feed and confirm the refresh cadence.',
        ],
      },
    },
    {
      id: 'copilot-usage-feed',
      title: 'Copilot usage and adoption feed',
      systemFamily: 'Microsoft Copilot',
      recommendedTemplateId: 'scheduled_feed',
      summary: 'Use recurring admin exports to connect seat usage, active adoption, and workflow proxy metrics back to approved AI initiatives.',
      bestFor: 'Adoption tracking, productivity proxy measurement, and proving whether a broad Copilot rollout is creating real operating value.',
      onboardingChecklist: [
        'Identify the export path from Microsoft admin or reporting surfaces.',
        'Define the user-population mapping back to business units, roles, or approved use cases.',
        'Agree which downstream workflow or KPI source will validate value beyond seat activity.',
        'Set a refresh SLA so leadership sees drift before quarter-end reviews.',
      ],
      exportContract: {
        objectName: 'copilot_usage_fact',
        cadence: 'Weekly scheduled feed',
        requiredColumns: ['user_id', 'reporting_period_start', 'reporting_period_end', 'active_days', 'interaction_count', 'feature_family', 'license_type'],
        joinKeys: ['user_id', 'reporting_period_start'],
        qualityChecks: ['Every row maps to a known org identity', 'Reporting windows do not overlap unexpectedly', 'Feature families use a controlled vocabulary'],
      },
      requestTemplate: {
        subject: 'Request Copilot usage export for adoption and value tracking',
        instructions: [
          'Provide the recurring Copilot admin usage export covering active users, interaction counts, and feature families.',
          'Include the identity field needed to map users back to business unit, role, or approved use case population.',
          'Confirm the refresh SLA and the owner responsible for validating the export each cycle.',
        ],
      },
    },
    {
      id: 'erp-finance-extract',
      title: 'ERP and finance baseline extract',
      systemFamily: 'ERP / Finance',
      recommendedTemplateId: 'extract_upload',
      summary: 'Use recurring finance extracts to anchor labor, spend, throughput, and savings claims in numbers the CFO can defend.',
      bestFor: 'ROI baselines, cost-to-serve, vendor spend, labor-capacity recovery, and transformation business cases.',
      onboardingChecklist: [
        'Confirm the official finance system or reporting mart used for board or CFO reporting.',
        'Lock the business unit, cost center, or workflow hierarchy the extract needs to preserve.',
        'Decide which metrics are baseline only versus those refreshed every review cycle.',
        'Document how labor assumptions, vendor spend, and realized savings are reconciled.',
      ],
      exportContract: {
        objectName: 'finance_baseline_fact',
        cadence: 'Monthly extract upload',
        requiredColumns: ['period', 'business_unit', 'cost_center', 'metric_name', 'metric_value', 'currency', 'source_system'],
        joinKeys: ['period', 'business_unit', 'cost_center', 'metric_name'],
        qualityChecks: ['One row per metric grain', 'Currency is populated for financial metrics', 'Source system is carried through every delivery'],
      },
      requestTemplate: {
        subject: 'Request ERP and finance baseline extract for AI value proof',
        instructions: [
          'Provide the baseline extract used for finance or board reporting with the agreed grain and column contract.',
          'Preserve business unit, cost center, and metric naming so the data can be reconciled over time.',
          'Confirm who owns the extract and how realized savings or labor-capacity recovery will be validated.',
        ],
      },
    },
  ]
}

export function findConnectorPlaybook(systemName: string, sourceName: string) {
  const haystack = `${systemName} ${sourceName}`.toLowerCase()

  if (haystack.includes('service') && haystack.includes('now')) {
    return getPriorityConnectorPlaybooks().find(playbook => playbook.id === 'servicenow-ops-feed') || null
  }

  if (haystack.includes('copilot') || haystack.includes('microsoft')) {
    return getPriorityConnectorPlaybooks().find(playbook => playbook.id === 'copilot-usage-feed') || null
  }

  if (
    haystack.includes('erp') ||
    haystack.includes('oracle') ||
    haystack.includes('sap') ||
    haystack.includes('workday') ||
    haystack.includes('finance')
  ) {
    return getPriorityConnectorPlaybooks().find(playbook => playbook.id === 'erp-finance-extract') || null
  }

  return null
}

export function buildConnectorRequestPack(playbook: AbarNexusConnectorPlaybook, sourceLabel: string) {
  return [
    playbook.requestTemplate.subject,
    '',
    `Source: ${sourceLabel}`,
    `Recommended connector pattern: ${playbook.title}`,
    `Best for: ${playbook.bestFor}`,
    '',
    'Requested delivery instructions:',
    ...playbook.requestTemplate.instructions.map(step => `- ${step}`),
    '',
    `Sample export contract: ${playbook.exportContract.objectName} (${playbook.exportContract.cadence})`,
    `Required columns: ${playbook.exportContract.requiredColumns.join(', ')}`,
    `Join keys: ${playbook.exportContract.joinKeys.join(', ')}`,
    'Quality checks:',
    ...playbook.exportContract.qualityChecks.map(check => `- ${check}`),
  ].join('\n')
}

export function buildConnectorDeliveryPackage(playbook: AbarNexusConnectorPlaybook, sourceLabel: string) {
  return {
    title: `${playbook.title} delivery package`,
    sourceLabel,
    requestPack: buildConnectorRequestPack(playbook, sourceLabel),
    exportContract: playbook.exportContract,
    onboardingChecklist: playbook.onboardingChecklist,
  }
}

export function formatConnectorDeliveryPackage(playbook: AbarNexusConnectorPlaybook, sourceLabel: string) {
  const pkg = buildConnectorDeliveryPackage(playbook, sourceLabel)

  return [
    pkg.title,
    '',
    `Source: ${pkg.sourceLabel}`,
    `Export contract: ${pkg.exportContract.objectName}`,
    `Cadence: ${pkg.exportContract.cadence}`,
    '',
    'Required columns:',
    ...pkg.exportContract.requiredColumns.map(column => `- ${column}`),
    '',
    'Join keys:',
    ...pkg.exportContract.joinKeys.map(key => `- ${key}`),
    '',
    'Quality checks:',
    ...pkg.exportContract.qualityChecks.map(check => `- ${check}`),
    '',
    'Onboarding checklist:',
    ...pkg.onboardingChecklist.map(step => `- ${step}`),
    '',
    'Request pack:',
    pkg.requestPack,
  ].join('\n')
}

export function runIngestionPreview(sourceId: string): AbarNexusNormalizedRecord[] {
  const today = new Date().toISOString().slice(0, 10)

  switch (sourceId) {
    case 'fred':
      return [
        {
          objectType: 'metric_series',
          title: 'Federal Funds Rate',
          summary: 'Macro rate context that can be used to pressure-test timing, cost of capital, and transformation urgency.',
          sourceId,
          recordDate: today,
          payload: {
            series_id: 'FEDFUNDS',
            latest_value: 4.75,
            unit: 'percent',
            cadence: 'monthly',
          },
        },
        {
          objectType: 'benchmark_fact',
          title: 'Inflation context',
          summary: 'Inflation backdrop used to sanity-check labor, productivity, and savings assumptions.',
          sourceId,
          recordDate: today,
          payload: {
            series_id: 'CPIAUCSL',
            latest_value: 319.1,
            unit: 'index',
            cadence: 'monthly',
          },
        },
      ]
    case 'onet':
      return [
        {
          objectType: 'document',
          title: 'IT support specialist task profile',
          summary: 'Task decomposition for workflow redesign and future-of-work use-case framing.',
          sourceId,
          recordDate: today,
          payload: {
            role: 'Computer User Support Specialists',
            top_tasks: ['Resolve user issues', 'Document incidents', 'Escalate complex cases'],
          },
        },
        {
          objectType: 'benchmark_fact',
          title: 'HR administrator task profile',
          summary: 'Role and task map to ground workflow AI opportunities in real work rather than vague automation claims.',
          sourceId,
          recordDate: today,
          payload: {
            role: 'Human Resources Specialists',
            top_tasks: ['Answer policy questions', 'Support onboarding', 'Maintain employee records'],
          },
        },
      ]
    case 'cms-open-data':
      return [
        {
          objectType: 'benchmark_fact',
          title: 'Hospital quality benchmark',
          summary: 'External operational benchmark that can anchor healthcare performance and mission-impact claims.',
          sourceId,
          recordDate: today,
          payload: {
            measure_group: 'Patient experience',
            benchmark_type: 'national',
            note: 'Illustrative preview record',
          },
        },
      ]
    case 'sec-edgar':
      return [
        {
          objectType: 'financial_fact',
          title: '10-K management discussion excerpt',
          summary: 'Public-company strategy and risk context useful for aligning use cases to disclosed priorities.',
          sourceId,
          recordDate: today,
          payload: {
            filing_type: '10-K',
            section: 'Management Discussion and Analysis',
            note: 'Illustrative preview record',
          },
        },
      ]
    default:
      return [
        {
          objectType: 'document',
          title: 'Ingestion preview stub',
          summary: 'This source is recognized, but its first concrete preview adapter has not been authored yet.',
          sourceId,
          recordDate: today,
          payload: {
            status: 'stub',
          },
        },
      ]
  }
}

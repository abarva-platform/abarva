export type SetupConnectorStatus = 'healthy' | 'degraded' | 'disconnected';

export type SetupConnectorClass =
  | 'itsm'
  | 'crm'
  | 'data_warehouse'
  | 'project_delivery'
  | 'knowledge_base'
  | 'devops'
  | 'productivity'
  | 'database'
  | 'engineering_signal'
  | 'model_provider';

export type SetupConnectorDataMode = 'seeded' | 'live';

export type SetupConnectorAuthMethod =
  | 'oauth'
  | 'app_install'
  | 'api_key'
  | 'connection_string';

export interface ConnectorActionItem {
  letter: 'A' | 'B' | 'C';
  text: string;
  detail?: string;
}

export interface ConnectorDataFlow {
  direction: 'inbound' | 'outbound';
  description: string;
  lastSynced: string;
}

export interface ConnectorReconnectProfile {
  summary: string;
  estimate: string;
  callToAction: string;
  successMessage: string;
  steps: string[];
}

export interface ConnectorItem {
  id: string;
  name: string;
  logo: string;
  connectorClass: SetupConnectorClass;
  connectorClassLabel: string;
  dataMode: SetupConnectorDataMode;
  lastSync: string;
  status: SetupConnectorStatus;
  statusNote: string;
}

export interface ConnectorDetail extends ConnectorItem {
  vendor: string;
  authType: string;
  authMethod: SetupConnectorAuthMethod;
  endpoint: string;
  connectorType: string;
  description: string;
  errorCode?: string;
  errorMessage?: string;
  errorTime?: string;
  lastSuccessfulSync?: string;
  syncFrequency: string;
  dataFlows: ConnectorDataFlow[];
  agentQuote: string;
  actions: ConnectorActionItem[];
  reconnectProfile?: ConnectorReconnectProfile;
}

const SETUP_CONNECTOR_DETAILS: ConnectorDetail[] = [
  {
    id: 'sn',
    name: 'ServiceNow',
    logo: 'SN',
    connectorClass: 'itsm',
    connectorClassLabel: 'ITSM',
    dataMode: 'seeded',
    lastSync: '14:22 UTC · Apr 27',
    status: 'degraded',
    statusNote: 'OAuth token expired - reconnect required',
    vendor: 'ServiceNow Inc.',
    authType: 'OAuth 2.0',
    authMethod: 'oauth',
    endpoint: 'https://apex-retail.service-now.com/api/now/v2',
    connectorType: 'ITSM',
    description: 'IT Service Management integration for change requests, incidents, and program-risk monitoring.',
    errorCode: 'OAUTH_TOKEN_EXPIRED',
    errorMessage: 'OAuth access token expired. Refresh token remains valid in the setup seed - re-authorize to restore sync.',
    errorTime: 'Apr 27 · 14:22 UTC',
    lastSuccessfulSync: 'Apr 27 · 14:15 UTC',
    syncFrequency: 'Every 15 minutes',
    dataFlows: [
      { direction: 'inbound', description: 'Change requests -> Program risk signals', lastSynced: 'Apr 27 · 14:15 UTC' },
      { direction: 'inbound', description: 'Incident P1/P2 alerts -> Tower pressure feed', lastSynced: 'Apr 27 · 14:15 UTC' },
      { direction: 'outbound', description: 'Program gate events -> ServiceNow change log', lastSynced: 'Apr 27 · 14:15 UTC' },
    ],
    agentQuote: 'ServiceNow remains the only degraded setup connector. The seed shows a token-expiry checkpoint 7 minutes after the last successful sync, with 3 queued imports waiting behind re-authorization.',
    actions: [
      { letter: 'A', text: 'Reconnect ServiceNow', detail: 'Refresh the OAuth grant on the canonical route' },
      { letter: 'B', text: 'Review queued change requests', detail: '3 items remain blocked behind reconnect' },
      { letter: 'C', text: 'Set token expiry alert', detail: 'Flag the next expiry 24 hours earlier' },
    ],
    reconnectProfile: {
      summary: 'OAuth re-authorization on the canonical route. The setup surface stays deterministic and does not perform a live token exchange.',
      estimate: 'Estimated 60 seconds',
      callToAction: 'Authorize ServiceNow',
      successMessage: 'ServiceNow reconnect checkpoint recorded. Steward should validate the next live import separately.',
      steps: [
        'Confirm your ServiceNow admin credentials are ready',
        'Open the OAuth consent screen for the ServiceNow tenant',
        'Approve the AbarVa integration and return to the canonical route',
        'Steward records the new checkpoint and verifies queued imports separately',
      ],
    },
  },
  {
    id: 'sfdc',
    name: 'Salesforce CRM',
    logo: 'SF',
    connectorClass: 'crm',
    connectorClassLabel: 'CRM',
    dataMode: 'seeded',
    lastSync: '15:45 UTC · Apr 27',
    status: 'healthy',
    statusNote: 'CRM pipeline sync current in the seeded profile',
    vendor: 'Salesforce Inc.',
    authType: 'OAuth 2.0',
    authMethod: 'oauth',
    endpoint: 'https://apex-retail.my.salesforce.com/services/data/v58.0',
    connectorType: 'CRM',
    description: 'CRM integration for accounts, opportunities, and source-event enrichment.',
    lastSuccessfulSync: 'Apr 27 · 15:45 UTC',
    syncFrequency: 'Every 15 minutes',
    dataFlows: [
      { direction: 'inbound', description: 'Account records -> Source event enrichment', lastSynced: 'Apr 27 · 15:45 UTC' },
      { direction: 'inbound', description: 'Opportunity pipeline -> Program context', lastSynced: 'Apr 27 · 15:45 UTC' },
      { direction: 'outbound', description: 'Program milestones -> Salesforce opportunity stage', lastSynced: 'Apr 27 · 15:45 UTC' },
    ],
    agentQuote: 'Salesforce remains healthy in the seeded setup profile. Mapping coverage is complete for account, opportunity, and milestone pull-through.',
    actions: [
      { letter: 'A', text: 'Review recent sync log', detail: 'Inspect the last seeded checkpoint bundle' },
      { letter: 'B', text: 'Test connection scope', detail: 'Confirm account and opportunity mappings' },
      { letter: 'C', text: 'Update data flow mappings', detail: 'Add or remove staged CRM fields' },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    logo: 'GH',
    connectorClass: 'engineering_signal',
    connectorClassLabel: 'Engineering signal',
    dataMode: 'seeded',
    lastSync: '13:10 UTC · Apr 27',
    status: 'healthy',
    statusNote: 'Repo, PR, and check mappings seeded for setup review',
    vendor: 'GitHub, Inc.',
    authType: 'GitHub App',
    authMethod: 'app_install',
    endpoint: 'https://api.github.com/repos/abarva/nexus',
    connectorType: 'Engineering',
    description: 'Engineering-signal integration for pull requests, checks, issue links, and release evidence.',
    lastSuccessfulSync: 'Apr 27 · 13:10 UTC',
    syncFrequency: 'Every 30 minutes',
    dataFlows: [
      { direction: 'inbound', description: 'Pull requests -> Build-progress and slice evidence', lastSynced: 'Apr 27 · 13:10 UTC' },
      { direction: 'inbound', description: 'Checks and workflow summaries -> Readiness narrative', lastSynced: 'Apr 27 · 13:10 UTC' },
      { direction: 'outbound', description: 'Canonical route links -> Repository deep links', lastSynced: 'Apr 27 · 13:10 UTC' },
    ],
    agentQuote: 'GitHub is now a first-class setup connector class. The seed models repository, PR, and check coverage without claiming live polling from this surface.',
    actions: [
      { letter: 'A', text: 'Review repo scope', detail: 'Confirm the GitHub App install is limited to the canonical repository set' },
      { letter: 'B', text: 'Inspect seeded check mappings', detail: 'Verify PR and workflow fields on the setup profile' },
      { letter: 'C', text: 'Open reconnect path', detail: 'Refresh the GitHub App install if scopes change' },
    ],
    reconnectProfile: {
      summary: 'GitHub App installation refresh on the canonical route. This setup surface records the handoff and does not poll the GitHub API live.',
      estimate: 'Estimated 90 seconds',
      callToAction: 'Refresh GitHub App install',
      successMessage: 'GitHub install refresh checkpoint recorded. Live repo polling remains a separate validation step.',
      steps: [
        'Confirm the GitHub App owner and repository scope for the canonical /admin/connectors profile',
        'Open the GitHub App installation screen and re-authorize repository access',
        'Return to the connector detail surface so Steward can record the updated install checkpoint',
        'Validate PR and check mappings separately before treating the connector as live-ready',
      ],
    },
  },
  {
    id: 'snow',
    name: 'Snowflake',
    logo: 'DW',
    connectorClass: 'data_warehouse',
    connectorClassLabel: 'Data warehouse',
    dataMode: 'seeded',
    lastSync: '08:00 UTC · Apr 27',
    status: 'healthy',
    statusNote: 'Warehouse sync profile current',
    vendor: 'Snowflake Inc.',
    authType: 'Key pair',
    authMethod: 'api_key',
    endpoint: 'https://xy12345.snowflakecomputing.com',
    connectorType: 'Warehouse',
    description: 'Warehouse integration for curated tables, data-quality checkpoints, and downstream evidence joins.',
    lastSuccessfulSync: 'Apr 27 · 08:00 UTC',
    syncFrequency: 'Hourly',
    dataFlows: [
      { direction: 'inbound', description: 'Curated tables -> Program evidence joins', lastSynced: 'Apr 27 · 08:00 UTC' },
      { direction: 'inbound', description: 'Exception tables -> Steward data-quality review', lastSynced: 'Apr 27 · 08:00 UTC' },
    ],
    agentQuote: 'Snowflake remains a seeded healthy profile with no live query executed from setup.',
    actions: [
      { letter: 'A', text: 'Review staged schemas', detail: 'Confirm in-scope warehouse datasets' },
      { letter: 'B', text: 'Inspect exception feed', detail: 'Look for tables with stale checkpoints' },
      { letter: 'C', text: 'Rotate warehouse secret', detail: 'Record the next credential rollover' },
    ],
  },
  {
    id: 'jira',
    name: 'Jira',
    logo: 'Ji',
    connectorClass: 'project_delivery',
    connectorClassLabel: 'Project delivery',
    dataMode: 'seeded',
    lastSync: '11:30 UTC · Apr 27',
    status: 'healthy',
    statusNote: 'Project tracker scope approved',
    vendor: 'Atlassian',
    authType: 'OAuth 2.0',
    authMethod: 'oauth',
    endpoint: 'https://apex-retail.atlassian.net/rest/api/3',
    connectorType: 'Delivery',
    description: 'Project delivery integration for epics, issues, and workflow-state evidence.',
    lastSuccessfulSync: 'Apr 27 · 11:30 UTC',
    syncFrequency: 'Every 30 minutes',
    dataFlows: [
      { direction: 'inbound', description: 'Issue status -> Program execution signal', lastSynced: 'Apr 27 · 11:30 UTC' },
      { direction: 'inbound', description: 'Epic progress -> Delivery milestone evidence', lastSynced: 'Apr 27 · 11:30 UTC' },
    ],
    agentQuote: 'Jira is healthy in the seeded profile. Issue-state coverage is ready for setup sign-off.',
    actions: [
      { letter: 'A', text: 'Review board mappings', detail: 'Confirm in-scope projects and boards' },
      { letter: 'B', text: 'Inspect issue-state pull', detail: 'Validate status and assignee fields' },
      { letter: 'C', text: 'Refresh OAuth grant', detail: 'Prepare the next Atlassian consent review' },
    ],
  },
  {
    id: 'conf',
    name: 'Confluence',
    logo: 'Co',
    connectorClass: 'knowledge_base',
    connectorClassLabel: 'Knowledge base',
    dataMode: 'seeded',
    lastSync: '11:30 UTC · Apr 27',
    status: 'healthy',
    statusNote: 'Knowledge pages staged for setup review',
    vendor: 'Atlassian',
    authType: 'OAuth 2.0',
    authMethod: 'oauth',
    endpoint: 'https://apex-retail.atlassian.net/wiki/api/v2',
    connectorType: 'Knowledge',
    description: 'Knowledge-base integration for playbooks, architecture notes, and operating-procedure evidence.',
    lastSuccessfulSync: 'Apr 27 · 11:30 UTC',
    syncFrequency: 'Every 2 hours',
    dataFlows: [
      { direction: 'inbound', description: 'Architecture pages -> Setup context', lastSynced: 'Apr 27 · 11:30 UTC' },
      { direction: 'inbound', description: 'Policy pages -> Steward review queue', lastSynced: 'Apr 27 · 11:30 UTC' },
    ],
    agentQuote: 'Confluence is healthy in the setup seed. Documentation coverage is staged but not live-crawled here.',
    actions: [
      { letter: 'A', text: 'Review page scope', detail: 'Confirm the canonical spaces remain in scope' },
      { letter: 'B', text: 'Inspect page freshness', detail: 'Check seeded timestamps for stale guidance' },
      { letter: 'C', text: 'Update content filters', detail: 'Exclude non-canonical spaces from setup' },
    ],
  },
  {
    id: 'azd',
    name: 'Azure DevOps',
    logo: 'Az',
    connectorClass: 'devops',
    connectorClassLabel: 'DevOps',
    dataMode: 'seeded',
    lastSync: '10:45 UTC · Apr 27',
    status: 'healthy',
    statusNote: 'Pipeline references aligned with the setup profile',
    vendor: 'Microsoft',
    authType: 'PAT token',
    authMethod: 'api_key',
    endpoint: 'https://dev.azure.com/apex-retail',
    connectorType: 'DevOps',
    description: 'DevOps integration for build pipelines, release references, and work-item linkage.',
    lastSuccessfulSync: 'Apr 27 · 10:45 UTC',
    syncFrequency: 'Hourly',
    dataFlows: [
      { direction: 'inbound', description: 'Pipeline runs -> Delivery readiness signal', lastSynced: 'Apr 27 · 10:45 UTC' },
      { direction: 'inbound', description: 'Work items -> Implementation traceability', lastSynced: 'Apr 27 · 10:45 UTC' },
    ],
    agentQuote: 'Azure DevOps stays in the healthy seeded set. Pipeline lineage is represented here without a live run poll.',
    actions: [
      { letter: 'A', text: 'Inspect pipeline list', detail: 'Validate which build definitions remain in scope' },
      { letter: 'B', text: 'Review work-item mapping', detail: 'Confirm traceability fields' },
      { letter: 'C', text: 'Rotate PAT checkpoint', detail: 'Record the next secret refresh window' },
    ],
  },
  {
    id: 'ms365',
    name: 'Microsoft 365',
    logo: 'M3',
    connectorClass: 'productivity',
    connectorClassLabel: 'Productivity',
    dataMode: 'seeded',
    lastSync: '07:00 UTC · Apr 27',
    status: 'healthy',
    statusNote: 'Email and calendar scope approved',
    vendor: 'Microsoft',
    authType: 'OAuth 2.0',
    authMethod: 'oauth',
    endpoint: 'https://graph.microsoft.com/v1.0',
    connectorType: 'Productivity',
    description: 'Productivity-suite integration for calendar evidence, email workflows, and contact checkpoints.',
    lastSuccessfulSync: 'Apr 27 · 07:00 UTC',
    syncFrequency: 'Every 4 hours',
    dataFlows: [
      { direction: 'inbound', description: 'Mailbox events -> Governance review triggers', lastSynced: 'Apr 27 · 07:00 UTC' },
      { direction: 'inbound', description: 'Calendar events -> Program operating cadence', lastSynced: 'Apr 27 · 07:00 UTC' },
    ],
    agentQuote: 'Microsoft 365 is healthy in the seed. Governance and operating-cadence evidence are staged for review.',
    actions: [
      { letter: 'A', text: 'Review inbox scope', detail: 'Confirm which shared mailboxes are included' },
      { letter: 'B', text: 'Inspect calendar pull', detail: 'Validate meeting-series coverage' },
      { letter: 'C', text: 'Refresh OAuth scopes', detail: 'Prepare the next admin consent review' },
    ],
  },
  {
    id: 'pgsql',
    name: 'PostgreSQL',
    logo: 'PG',
    connectorClass: 'database',
    connectorClassLabel: 'Database',
    dataMode: 'seeded',
    lastSync: 'Apr 24 2026',
    status: 'disconnected',
    statusNote: 'Connection string not yet configured',
    vendor: 'PostgreSQL',
    authType: 'Connection string',
    authMethod: 'connection_string',
    endpoint: 'postgres://<workspace-secret>@db.apex-retail.internal:5432/ops',
    connectorType: 'Operational database',
    description: 'Operational database integration for checkpoint tables, shared state, and steward-owned control records.',
    errorCode: 'MISSING_CONNECTION_STRING',
    errorMessage: 'No database connection string is present in the seeded setup profile.',
    errorTime: 'Apr 24 · 08:00 UTC',
    syncFrequency: 'On demand',
    dataFlows: [
      { direction: 'inbound', description: 'Operational tables -> Setup readiness exceptions', lastSynced: 'Not yet configured' },
    ],
    agentQuote: 'PostgreSQL remains disconnected in setup. Until a connection string is staged, 3 readiness checks stay blocked.',
    actions: [
      { letter: 'A', text: 'Stage connection string', detail: 'Provide the environment-scoped database secret' },
      { letter: 'B', text: 'Review in-scope tables', detail: 'Confirm which schemas belong in setup' },
      { letter: 'C', text: 'Document network path', detail: 'Record the bastion and allowlist requirements' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    logo: 'AI',
    connectorClass: 'model_provider',
    connectorClassLabel: 'Model provider',
    dataMode: 'seeded',
    lastSync: 'Apr 26 · 17:40 UTC',
    status: 'disconnected',
    statusNote: 'API key placeholder remains empty in the setup seed',
    vendor: 'Anthropic PBC',
    authType: 'API key',
    authMethod: 'api_key',
    endpoint: 'https://api.anthropic.com/v1/messages',
    connectorType: 'Model provider',
    description: 'Model-provider integration for structured prompting, review loops, and controlled generation checkpoints.',
    errorCode: 'API_KEY_NOT_CONFIGURED',
    errorMessage: 'Anthropic credentials are not mounted in this setup profile. This surface stays explicit about seeded versus live state.',
    errorTime: 'Apr 26 · 17:40 UTC',
    syncFrequency: 'On demand',
    dataFlows: [
      { direction: 'outbound', description: 'Structured prompts -> Model inference requests', lastSynced: 'Not yet configured' },
      { direction: 'inbound', description: 'Completion metadata -> Steward audit trail', lastSynced: 'Not yet configured' },
    ],
    agentQuote: 'Anthropic is now modeled as a typed setup connector class. The profile is intentionally seeded-only until an API key handoff is recorded and validated elsewhere.',
    actions: [
      { letter: 'A', text: 'Add Anthropic key checkpoint', detail: 'Record where the API key will be staged' },
      { letter: 'B', text: 'Review prompt-scope policy', detail: 'Confirm which surfaces are allowed to call the provider' },
      { letter: 'C', text: 'Open reconnect path', detail: 'Walk through the seeded credential handoff flow' },
    ],
    reconnectProfile: {
      summary: 'API key handoff on the canonical route. Setup records the credential workflow and does not perform a live Anthropic API call.',
      estimate: 'Estimated 45 seconds',
      callToAction: 'Record Anthropic key handoff',
      successMessage: 'Anthropic credential handoff recorded. Live model verification remains a separate step.',
      steps: [
        'Confirm which environment secret store will hold the Anthropic API key',
        'Paste the key reference or secret path into the canonical setup workflow',
        'Return to the connector detail surface so Steward can record the checkpoint',
        'Run live provider verification separately before calling the connector active',
      ],
    },
  },
];

export const SETUP_CONNECTOR_DETAIL_MAP: Record<string, ConnectorDetail> = Object.fromEntries(
  SETUP_CONNECTOR_DETAILS.map((detail) => [detail.id, detail]),
) as Record<string, ConnectorDetail>;

export const SERVICENOW_CONNECTOR_DETAIL = SETUP_CONNECTOR_DETAIL_MAP.sn;
export const SALESFORCE_CONNECTOR_DETAIL = SETUP_CONNECTOR_DETAIL_MAP.sfdc;
export const GITHUB_CONNECTOR_DETAIL = SETUP_CONNECTOR_DETAIL_MAP.github;
export const ANTHROPIC_CONNECTOR_DETAIL = SETUP_CONNECTOR_DETAIL_MAP.anthropic;

export function getSetupConnectorDetail(connectorId: string): ConnectorDetail | null {
  return SETUP_CONNECTOR_DETAIL_MAP[connectorId] ?? null;
}

export function getReconnectableSetupConnectorDetail(connectorId: string): ConnectorDetail | null {
  const detail = getSetupConnectorDetail(connectorId);
  return detail?.reconnectProfile ? detail : null;
}

const CONNECTORS: ConnectorItem[] = SETUP_CONNECTOR_DETAILS.map((detail) => ({
  id: detail.id,
  name: detail.name,
  logo: detail.logo,
  connectorClass: detail.connectorClass,
  connectorClassLabel: detail.connectorClassLabel,
  dataMode: detail.dataMode,
  lastSync: detail.lastSync,
  status: detail.status,
  statusNote: detail.statusNote,
}));

const healthyCount = CONNECTORS.filter((connector) => connector.status === 'healthy').length;
const degradedCount = CONNECTORS.filter((connector) => connector.status === 'degraded').length;
const disconnectedCount = CONNECTORS.filter((connector) => connector.status === 'disconnected').length;

export const SETUP_INDEX_VIEW = {
  tenant: 'Apex Retail Group',
  agentQuote:
    '10 typed connector profiles are registered. ServiceNow is the only degraded connector. PostgreSQL and Anthropic remain disconnected, and every card now calls out whether the profile is seeded or live.',
  agentContext: 'Steward · Setup · governance and platform control',
  actions: [
    {
      letter: 'A' as const,
      text: 'Reconnect ServiceNow',
      detail: 'Refresh the seeded OAuth checkpoint on the canonical route',
    },
    {
      letter: 'B' as const,
      text: 'Record Anthropic key handoff',
      detail: 'Model provider profile is disconnected until a credential checkpoint exists',
    },
    {
      letter: 'C' as const,
      text: 'Review GitHub install scope',
      detail: 'Validate repository and workflow coverage for the engineering-signal connector',
    },
  ],
  connectors: CONNECTORS,
  healthyCount,
  degradedCount,
  disconnectedCount,
};
// ─── Users fixture ───────────────────────────────────────────────────────────

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'collaborator' | 'viewer';
  surface: string;   // e.g. "All surfaces" or "Programs · Tower"
  lastActive: string;
  status: 'active' | 'pending' | 'inactive';
}

export const USERS_FIXTURE: UserItem[] = [
  { id: 'u1', name: 'David Chen', email: 'david@apexretail.com', role: 'admin', surface: 'All surfaces', lastActive: 'Today', status: 'active' },
  { id: 'u2', name: 'Priya Sharma', email: 'priya@apexretail.com', role: 'collaborator', surface: 'Programs · Source', lastActive: 'Yesterday', status: 'active' },
  { id: 'u3', name: 'Marcus Webb', email: 'marcus@apexretail.com', role: 'collaborator', surface: 'Tower · Intelligence', lastActive: 'Apr 24', status: 'active' },
  { id: 'u4', name: 'Sofia Navarro', email: 'sofia@apexretail.com', role: 'viewer', surface: 'Programs', lastActive: 'Apr 20', status: 'active' },
  { id: 'u5', name: 'James Okafor', email: 'james@apexretail.com', role: 'collaborator', surface: 'Source', lastActive: 'Never', status: 'pending' },
];

export const USERS_AGENT_VOICE = {
  quote: '5 users total — 4 active, 1 invite pending (James Okafor, Source collaborator). David Chen is the only admin. Priya and Marcus are active collaborators covering Programs, Source, Tower, and Intelligence.',
  actions: [
    { letter: 'A' as const, text: 'Resend James Okafor invite', detail: 'Source collaborator — pending since Apr 22' },
    { letter: 'B' as const, text: 'Review access for Sofia', detail: 'Viewer-only on Programs — consider adding Tower' },
    { letter: 'C' as const, text: 'Invite new collaborator', detail: 'Add team member to AbarVa workspace' },
  ],
};

// ─── Audit log fixture ────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorInitials: string;
  action: string;
  surface: string;
  detail: string;
  severity: 'info' | 'warn' | 'critical';
}

export const AUDIT_LOG_FIXTURE: AuditEntry[] = [
  { id: 'a1', timestamp: 'Apr 27 · 14:22', actor: 'System', actorInitials: 'Sy', action: 'ServiceNow OAuth token expired', surface: 'Setup', detail: 'Connector degraded — reconnect required', severity: 'critical' },
  { id: 'a2', timestamp: 'Apr 27 · 11:05', actor: 'David Chen', actorInitials: 'DC', action: 'Gate criteria reviewed for APX-CDP-2026', surface: 'Programs', detail: 'P2 Synthesis gate status: 1 of 5 criteria met', severity: 'info' },
  { id: 'a3', timestamp: 'Apr 26 · 16:40', actor: 'Nexus', actorInitials: 'Nx', action: 'Phase evidence coverage updated', surface: 'Programs', detail: 'APX-CDP-2026 evidence: 34% → 36%', severity: 'info' },
  { id: 'a4', timestamp: 'Apr 26 · 09:18', actor: 'Priya Sharma', actorInitials: 'PS', action: 'Source event updated — AMS BAFO Stage 7', surface: 'Source', detail: 'Vendor B SOC-2 gap flagged', severity: 'warn' },
  { id: 'a5', timestamp: 'Apr 25 · 15:55', actor: 'Atlas', actorInitials: 'At', action: 'AI Cloud Spend pressure escalated to HIGH', surface: 'Tower', detail: '$2.4M actual vs $1.8M budget (+33%)', severity: 'critical' },
  { id: 'a6', timestamp: 'Apr 24 · 12:00', actor: 'David Chen', actorInitials: 'DC', action: 'Pattern T3-H01 applied to APX-CDP-2026', surface: 'Intelligence', detail: 'Ambient Intelligence Capture linked', severity: 'info' },
  { id: 'a7', timestamp: 'Apr 23 · 10:30', actor: 'James Okafor', actorInitials: 'JO', action: 'Invite sent — Source collaborator', surface: 'Setup', detail: 'Pending acceptance', severity: 'info' },
];

export const AUDIT_AGENT_VOICE = {
  quote: '7 events in the last 4 days. Two critical items: ServiceNow OAuth expired (reconnect needed) and AI Cloud Spend escalated to HIGH. Vendor B SOC-2 gap from Priya\'s Source update is still open.',
  actions: [
    { letter: 'A' as const, text: 'Resolve ServiceNow auth', detail: 'Critical — connector degraded since Apr 27 14:22' },
    { letter: 'B' as const, text: 'Review AI Cloud Spend escalation', detail: 'Atlas escalated to HIGH Apr 25 — decision pending' },
    { letter: 'C' as const, text: 'Export audit log', detail: 'Last 30 days · CSV format' },
  ],
};

// ─── Policies fixture ─────────────────────────────────────────────────────────

export interface PolicyItem {
  id: string;
  name: string;
  category: 'data' | 'access' | 'compliance' | 'ai';
  status: 'active' | 'review-due' | 'draft';
  lastReviewed: string;
  nextReview: string;
  owner: string;
}

export const POLICIES_FIXTURE: PolicyItem[] = [
  { id: 'p1', name: 'Data Residency Policy', category: 'data', status: 'active', lastReviewed: 'Jan 2026', nextReview: 'Jan 2027', owner: 'David Chen' },
  { id: 'p2', name: 'AI Model Usage Policy', category: 'ai', status: 'review-due', lastReviewed: 'Oct 2025', nextReview: 'Apr 2026', owner: 'David Chen' },
  { id: 'p3', name: 'Vendor Access Policy', category: 'access', status: 'active', lastReviewed: 'Mar 2026', nextReview: 'Mar 2027', owner: 'Priya Sharma' },
  { id: 'p4', name: 'Privacy Boundary Policy', category: 'compliance', status: 'draft', lastReviewed: '—', nextReview: 'May 2026', owner: 'David Chen' },
  { id: 'p5', name: 'Evidence Retention Policy', category: 'data', status: 'active', lastReviewed: 'Feb 2026', nextReview: 'Feb 2027', owner: 'Marcus Webb' },
];

export const POLICIES_AGENT_VOICE = {
  quote: '1 policy overdue for review (AI Model Usage Policy — Apr 2026 deadline) and 1 draft not yet activated (Privacy Boundary Policy — needed for APX-CDP-2026 gate). Both need action this week.',
  actions: [
    { letter: 'A' as const, text: 'Review AI Model Usage Policy', detail: 'Review due Apr 2026 — schedule 30-min review' },
    { letter: 'B' as const, text: 'Finalize Privacy Boundary Policy', detail: 'Draft → Active blocks APX-CDP-2026 P2 gate criterion' },
    { letter: 'C' as const, text: 'Schedule annual policy review', detail: 'All 5 policies · June 2026' },
  ],
};

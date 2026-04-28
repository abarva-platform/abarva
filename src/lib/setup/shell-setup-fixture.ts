export interface ConnectorItem {
  id: string;
  name: string;
  logo: string;       // 2-letter abbreviation for the glyph
  lastSync: string;   // display string e.g. '14:22 UTC · Apr 27'
  status: 'healthy' | 'degraded' | 'disconnected';
  statusNote: string; // one-line Steward observation
}

const CONNECTORS: ConnectorItem[] = [
  {
    id: 'sn',
    name: 'ServiceNow',
    logo: 'SN',
    lastSync: '14:22 UTC · Apr 27',
    status: 'degraded',
    statusNote: 'OAuth token expired — reconnect required',
  },
  {
    id: 'sfdc',
    name: 'Salesforce CRM',
    logo: 'SF',
    lastSync: '09:15 UTC · Apr 27',
    status: 'healthy',
    statusNote: 'CRM pipeline sync current',
  },
  {
    id: 'snow',
    name: 'Snowflake',
    logo: 'DW',
    lastSync: '08:00 UTC · Apr 27',
    status: 'healthy',
    statusNote: 'Data warehouse sync running normally',
  },
  {
    id: 'jira',
    name: 'Jira',
    logo: 'Ji',
    lastSync: '11:30 UTC · Apr 27',
    status: 'healthy',
    statusNote: 'Project tracker in sync',
  },
  {
    id: 'conf',
    name: 'Confluence',
    logo: 'Co',
    lastSync: '11:30 UTC · Apr 27',
    status: 'healthy',
    statusNote: 'Knowledge base pages current',
  },
  {
    id: 'azd',
    name: 'Azure DevOps',
    logo: 'Az',
    lastSync: '10:45 UTC · Apr 27',
    status: 'healthy',
    statusNote: 'Build pipeline connected',
  },
  {
    id: 'ms365',
    name: 'Microsoft 365',
    logo: 'M3',
    lastSync: '07:00 UTC · Apr 27',
    status: 'healthy',
    statusNote: 'Email and calendar events flowing',
  },
  {
    id: 'pgsql',
    name: 'PostgreSQL',
    logo: 'PG',
    lastSync: 'Apr 24 2026',
    status: 'disconnected',
    statusNote: 'Connection string not yet configured',
  },
];

export const SETUP_INDEX_VIEW = {
  tenant: 'Apex Retail Group',
  agentQuote:
    '8 connectors registered. ServiceNow lost OAuth auth at 14:22 UTC — reconnect is the only blocker. PostgreSQL is not yet configured. Everything else is running normally.',
  agentContext: 'Steward · Setup · governance and platform control',
  actions: [
    {
      letter: 'A' as const,
      text: 'Reconnect ServiceNow',
      detail: 'OAuth token expired · takes 2 minutes to refresh',
    },
    {
      letter: 'B' as const,
      text: 'Configure PostgreSQL connection',
      detail: 'Connection string not yet set — blocking 3 data readiness checks',
    },
    {
      letter: 'C' as const,
      text: 'Review annual policy renewal',
      detail: 'Privacy policy due for sign-off by Apr 30',
    },
  ],
  connectors: CONNECTORS,
  healthyCount: 6,
  degradedCount: 1,
  disconnectedCount: 1,
};

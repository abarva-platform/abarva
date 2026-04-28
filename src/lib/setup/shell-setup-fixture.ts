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

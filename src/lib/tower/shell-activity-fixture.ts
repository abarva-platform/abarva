export interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorInitials: string;
  actorType: 'nexus' | 'sentinel' | 'atlas' | 'steward' | 'human';
  event: string;
  surface: string;
  detail?: string;
  linkedProgram?: string;
  linkedProgramHref?: string;
}

export const ACTIVITY_LOG: ActivityEntry[] = [
  { id: 'ac1', timestamp: 'Apr 27 · 15:40', actor: 'Atlas', actorInitials: 'At', actorType: 'atlas', event: 'AI Cloud Spend pressure reviewed', surface: 'Tower', detail: 'Rate card negotiation flagged as highest-leverage action — $180K recovery' },
  { id: 'ac2', timestamp: 'Apr 27 · 15:05', actor: 'David Chen', actorInitials: 'DC', actorType: 'human', event: 'Gate criteria reviewed for APX-CDP-2026', surface: 'Programs', linkedProgram: 'APX-CDP-2026', linkedProgramHref: '/programs/apx-cdp-2026' },
  { id: 'ac3', timestamp: 'Apr 27 · 14:22', actor: 'Steward', actorInitials: 'St', actorType: 'steward', event: 'ServiceNow OAuth token expired — connector degraded', surface: 'Setup', detail: 'Reconnect required to restore 15-minute sync' },
  { id: 'ac4', timestamp: 'Apr 27 · 11:05', actor: 'Nexus', actorInitials: 'Nx', actorType: 'nexus', event: 'Workshop 5 evidence gap identified in APX-CDP-2026', surface: 'Programs', linkedProgram: 'APX-CDP-2026', linkedProgramHref: '/programs/apx-cdp-2026', detail: 'Missing: value hypothesis log + privacy boundary confirmation' },
  { id: 'ac5', timestamp: 'Apr 26 · 16:40', actor: 'Nexus', actorInitials: 'Nx', actorType: 'nexus', event: 'Evidence coverage updated — APX-CDP-2026', surface: 'Programs', linkedProgram: 'APX-CDP-2026', linkedProgramHref: '/programs/apx-cdp-2026', detail: '34% → 36% (+2pp after Workshop 4 session)' },
  { id: 'ac6', timestamp: 'Apr 26 · 09:18', actor: 'Priya Sharma', actorInitials: 'PS', actorType: 'human', event: 'AMS BAFO Stage 7 updated — Vendor B SOC-2 gap flagged', surface: 'Source', detail: 'Vendor B SOC-2 report overdue — BAFO evaluation on hold' },
  { id: 'ac7', timestamp: 'Apr 25 · 15:55', actor: 'Atlas', actorInitials: 'At', actorType: 'atlas', event: 'AI Cloud Spend escalated to HIGH severity', surface: 'Tower', detail: '$2.4M actual vs $1.8M budget — LLM inference is the top driver' },
  { id: 'ac8', timestamp: 'Apr 25 · 10:30', actor: 'Sentinel', actorInitials: 'Sn', actorType: 'sentinel', event: 'T3-H01 Ambient AI pattern validated across 4 programs', surface: 'Intelligence', detail: 'Highest program citation count in library — recommended for featured status' },
  { id: 'ac9', timestamp: 'Apr 24 · 14:00', actor: 'Marcus Webb', actorInitials: 'MW', actorType: 'human', event: 'APX-CC-2026 NLP classifier hit 94% accuracy', surface: 'Programs', linkedProgram: 'APX-CC-2026', linkedProgramHref: '/programs/apx-cc-2026' },
  { id: 'ac10', timestamp: 'Apr 24 · 11:20', actor: 'Nexus', actorInitials: 'Nx', actorType: 'nexus', event: 'APX-SAP-2026 Discovery phase — 4 of 6 interviews complete', surface: 'Programs', linkedProgram: 'APX-SAP-2026', linkedProgramHref: '/programs/apx-sap-2026' },
  { id: 'ac11', timestamp: 'Apr 23 · 16:00', actor: 'Steward', actorInitials: 'St', actorType: 'steward', event: 'James Okafor invite sent — Source collaborator', surface: 'Setup' },
  { id: 'ac12', timestamp: 'Apr 22 · 09:00', actor: 'Atlas', actorInitials: 'At', actorType: 'atlas', event: 'DFv2 Q1 outcome report published — $1.4M savings confirmed', surface: 'Programs', linkedProgram: 'APX-DFV2-2025', linkedProgramHref: '/programs/apx-dfv2-2025' },
];

export const ACTIVITY_AGENT_VOICE = {
  quote: '12 events in the last 5 days. The CDP gate block and AI Cloud Spend are the two highest-priority threads. ServiceNow reconnect is a quick fix. DFv2 outcome report confirms $1.4M savings — well above projection.',
  agentContext: 'Atlas · Cross-program activity · last 5 days',
  actions: [
    { letter: 'A' as const, text: 'Resolve CDP Workshop 5 blocker', detail: 'Highest-leverage action — unlocks Design gate' },
    { letter: 'B' as const, text: 'Reconnect ServiceNow', detail: 'Quick fix — OAuth re-auth, 60 seconds' },
    { letter: 'C' as const, text: 'Review AI Cloud Spend rate card', detail: 'Decision needed this week — $180K recovery' },
  ],
};

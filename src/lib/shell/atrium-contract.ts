export type AtriumModuleId =
  | 'home'
  | 'setup'
  | 'programs'
  | 'source'
  | 'intelligence'
  | 'tower';

export type AtriumAgent = 'Atlas' | 'Steward' | 'Nexus' | 'Sentinel';
export type AtriumAgentState = 'ambient' | 'engaged' | 'focus';

export interface AtriumSubmenuItem {
  key: string;
  label: string;
  purpose: string;
}

export interface AtriumModuleContract {
  id: AtriumModuleId;
  route: string;
  productNavLabel: string;
  canonicalName: string;
  agent: AtriumAgent;
  canvasCharacter: string;
  defaultSubmenuKey: string;
  submenus: readonly AtriumSubmenuItem[];
}

export const ATRIUM_AGENT_STATES: readonly AtriumAgentState[] = [
  'ambient',
  'engaged',
  'focus',
] as const;

export const ATRIUM_LOCKED_DIMENSIONS = {
  topNavHeightPx: 32,
  submenuStripHeightPx: 36,
  ambientAgentWidthPx: 200,
  engagedAgentWidthPx: 360,
  focusAgentWidthPx: 520,
} as const;

export const ATRIUM_MODULES: readonly AtriumModuleContract[] = [
  {
    id: 'home',
    route: '/home',
    productNavLabel: 'Home',
    canonicalName: 'Home',
    agent: 'Atlas',
    canvasCharacter: 'Personalized morning brief; cross-module surfacing.',
    defaultSubmenuKey: 'today',
    submenus: [
      { key: 'today', label: 'Today', purpose: 'Personalized cross-module morning brief.' },
      { key: 'calendar', label: 'Calendar', purpose: 'Platform-relevant calendar events.' },
      { key: 'inbox', label: 'Inbox', purpose: 'Mentions, handoffs, and decisions awaiting the user.' },
      { key: 'recent-activity', label: 'Recent activity', purpose: 'The user\'s recent platform actions.' },
    ],
  },
  {
    id: 'setup',
    route: '/admin',
    productNavLabel: 'Setup',
    canonicalName: 'Setup',
    agent: 'Steward',
    canvasCharacter: 'Foundation status; tenant metric ingestion; readiness.',
    defaultSubmenuKey: 'overview',
    submenus: [
      { key: 'overview', label: 'Overview', purpose: 'Foundation health summary.' },
      { key: 'data-trust', label: 'Data trust', purpose: 'Data quality, lineage, and identity resolution.' },
      { key: 'connectors', label: 'Connectors', purpose: 'Tenant integrations such as POS, EHR, core banking, and BI.' },
      { key: 'users', label: 'Users', purpose: 'Access control, role assignment, and entitlements.' },
      { key: 'metrics', label: 'Metrics', purpose: 'Tenant metric mapping for the gap engine.' },
      { key: 'architecture', label: 'Architecture', purpose: 'Technical configuration and platform foundation.' },
    ],
  },
  {
    id: 'programs',
    route: '/programs',
    productNavLabel: 'Strategic Moves',
    canonicalName: 'Strategic Moves',
    agent: 'Nexus',
    canvasCharacter: 'Move registry; per-move lifecycle deep-dive.',
    defaultSubmenuKey: 'portfolio',
    submenus: [
      { key: 'portfolio', label: 'Portfolio', purpose: 'Registry default for active moves.' },
      { key: 'by-phase', label: 'By phase', purpose: 'Move views grouped by P0-P6 lifecycle phase.' },
      { key: 'pending-decisions', label: 'Pending decisions', purpose: 'Moves where user action is required.' },
      { key: 'settled', label: 'Settled', purpose: 'Completed moves archive.' },
      { key: 'calendar', label: 'Calendar', purpose: 'BAFOs, reviews, and kill-criteria check-ins.' },
    ],
  },
  {
    id: 'source',
    route: '/source',
    productNavLabel: 'Source',
    canonicalName: 'Source',
    agent: 'Nexus',
    canvasCharacter: 'Sourcing event registry; per-event lifecycle deep-dive.',
    defaultSubmenuKey: 'pipeline',
    submenus: [
      { key: 'pipeline', label: 'Pipeline', purpose: 'Active sourcing events default view.' },
      { key: 'by-stage', label: 'By stage', purpose: 'Events grouped by sourcing lifecycle stage.' },
      { key: 'vendors', label: 'Vendors', purpose: 'Vendor relationship registry.' },
      { key: 'decisions', label: 'Decisions', purpose: 'Executive decision queue.' },
      { key: 'settled', label: 'Settled', purpose: 'Awarded and closed events archive.' },
    ],
  },
  {
    id: 'intelligence',
    route: '/intelligence',
    productNavLabel: 'Intelligence',
    canonicalName: 'Intelligence',
    agent: 'Sentinel',
    canvasCharacter: 'Three substrates; two outcomes; metric gap engine.',
    defaultSubmenuKey: 'today',
    submenus: [
      { key: 'today', label: 'Today', purpose: 'Curated entry state with pressure cards and metric gaps.' },
      { key: 'by-function', label: 'By function', purpose: 'Front, middle, and back office industry views with gap overlay.' },
      { key: 'patterns', label: 'Patterns', purpose: 'Corpus pattern catalog.' },
      { key: 'vendors', label: 'Vendors', purpose: 'Vendor landscape intelligence.' },
      { key: 'peer-activity', label: 'Peer activity', purpose: 'Anonymized aggregate peer activity by industry and scale.' },
      { key: 'my-strategy', label: 'My strategy', purpose: 'Uploaded strategy, linked moves, and empirical challenge.' },
      { key: 'sessions', label: 'Sessions', purpose: 'Persistent thinking sessions.' },
    ],
  },
  {
    id: 'tower',
    route: '/tower',
    productNavLabel: 'Tower',
    canonicalName: 'Tower',
    agent: 'Atlas',
    canvasCharacter: 'Portfolio observation; cross-program synthesis.',
    defaultSubmenuKey: 'pressures',
    submenus: [
      { key: 'pressures', label: 'Pressures', purpose: 'Decision pressure and cascade synthesis.' },
      { key: 'cascade', label: 'Cascade', purpose: 'Cross-program dependency graph.' },
      { key: 'realized-v-committed', label: 'Realized v committed', purpose: 'Promise-versus-actual tracking.' },
      { key: 'move-grid', label: 'Move grid', purpose: 'Full active portfolio grid.' },
      { key: 'sourcing', label: 'Sourcing', purpose: 'Cross-portfolio sourcing pressure view.' },
      { key: 'handoffs', label: 'Handoffs', purpose: 'Recent P6 Tower Handoff archive.' },
    ],
  },
] as const;

export const ATRIUM_MODULE_BY_ID: ReadonlyMap<AtriumModuleId, AtriumModuleContract> =
  new Map(ATRIUM_MODULES.map((module) => [module.id, module]));

export function getAtriumModule(moduleId: AtriumModuleId): AtriumModuleContract {
  const contract = ATRIUM_MODULE_BY_ID.get(moduleId);
  if (!contract) {
    throw new Error(`Unknown Atrium module: ${moduleId}`);
  }
  return contract;
}

export function getAtriumProductNavLabel(moduleId: AtriumModuleId): string {
  return getAtriumModule(moduleId).productNavLabel;
}

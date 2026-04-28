/**
 * W32E — Admin Zone E Action Strip View Model
 *
 * Pure TypeScript read-model for the Admin Zone E (action strip) surface.
 * The WIRE2 audit found Zone E is absent from the Admin page — next recommended
 * actions are buried in sub-sections with no single top CTA.
 *
 * This view model surfaces the top-priority actions as a priority-ordered strip
 * with honest status, owner agent, and deferred/blocked disclosure.
 *
 * No React. No network calls. No model calls. Deterministic seed output only.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminActionStatus = 'available' | 'disabled' | 'deferred' | 'blocked';
export type AdminActionCategory =
  | 'dataset_approval'
  | 'connector_setup'
  | 'user_access'
  | 'production_readiness'
  | 'architecture_review';

export interface AdminAction {
  id: string;
  category: AdminActionCategory;
  label: string;
  description: string;
  status: AdminActionStatus;
  disabledReason: string | null;
  deferredReason: string | null;
  ownerAgent: 'steward' | 'nexus' | 'atlas';
  priority: 'high' | 'medium' | 'low';
  clickTarget: string | null; // route or null if not wired
  deterministicSeed: true;
}

export interface AdminActionStripView {
  actions: AdminAction[];
  topPriorityAction: AdminAction | null;
  availableCount: number;
  blockedCount: number;
  deterministicSeed: true;
  caveat: string;
}

// ---------------------------------------------------------------------------
// Apex Retail action seed data
// ---------------------------------------------------------------------------

const APEX_RETAIL_ACTIONS: AdminAction[] = [
  {
    id: 'adm-act-apex-001',
    category: 'dataset_approval',
    label: 'Review pending dataset approvals',
    description:
      'There are datasets awaiting Steward approval before they can be used in programme analysis. ' +
      'Review and approve or reject each dataset with a documented rationale.',
    status: 'available',
    disabledReason: null,
    deferredReason: null,
    ownerAgent: 'steward',
    priority: 'high',
    clickTarget: '/platform/admin',
    deterministicSeed: true,
  },
  {
    id: 'adm-act-apex-002',
    category: 'connector_setup',
    label: 'Configure contract management connector',
    description:
      'The contract management stub connector requires end-to-end connectivity testing and ' +
      'field mapping review before it can be trusted for programme use.',
    status: 'available',
    disabledReason: null,
    deferredReason: null,
    ownerAgent: 'steward',
    priority: 'high',
    clickTarget: null,
    deterministicSeed: true,
  },
  {
    id: 'adm-act-apex-003',
    category: 'user_access',
    label: 'Grant programme team access',
    description:
      'Programme team members require access to the AbarVa platform to participate in ' +
      'workshop mode and view programme artefacts. Review and grant roles.',
    status: 'available',
    disabledReason: null,
    deferredReason: null,
    ownerAgent: 'steward',
    priority: 'medium',
    clickTarget: '/platform/admin',
    deterministicSeed: true,
  },
  {
    id: 'adm-act-apex-004',
    category: 'production_readiness',
    label: 'Complete production readiness review',
    description:
      'Production deployment is blocked by 3 open issues: (1) evidence upload connector not wired, ' +
      '(2) model gateway not configured, (3) SOC2 certification pending. ' +
      'Review each blocker and assign resolution owners.',
    status: 'blocked',
    disabledReason: null,
    deferredReason: null,
    ownerAgent: 'steward',
    priority: 'high',
    clickTarget: '/platform/admin/production-readiness',
    deterministicSeed: true,
  },
  {
    id: 'adm-act-apex-005',
    category: 'architecture_review',
    label: 'Architecture sign-off (Atlas)',
    description:
      'Atlas requires a formal architecture review sign-off before production deployment. ' +
      'Review the platform integration planes and confirm alignment with the Azure target architecture.',
    status: 'deferred',
    disabledReason: null,
    deferredReason:
      'Architecture sign-off is deferred until production readiness blockers are resolved. ' +
      'Complete the production readiness review first.',
    ownerAgent: 'atlas',
    priority: 'medium',
    clickTarget: '/platform/admin/architecture',
    deterministicSeed: true,
  },
];

// ---------------------------------------------------------------------------
// Meridian action seed (thinner)
// ---------------------------------------------------------------------------

const MERIDIAN_ACTIONS: AdminAction[] = [
  {
    id: 'adm-act-mer-001',
    category: 'dataset_approval',
    label: 'Review pending dataset approvals',
    description:
      'Datasets are awaiting Steward approval before they can be used in programme analysis.',
    status: 'available',
    disabledReason: null,
    deferredReason: null,
    ownerAgent: 'steward',
    priority: 'high',
    clickTarget: '/platform/admin',
    deterministicSeed: true,
  },
  {
    id: 'adm-act-mer-002',
    category: 'user_access',
    label: 'Grant programme team access',
    description: 'Programme team members require access to the platform.',
    status: 'available',
    disabledReason: null,
    deferredReason: null,
    ownerAgent: 'steward',
    priority: 'medium',
    clickTarget: '/platform/admin',
    deterministicSeed: true,
  },
  {
    id: 'adm-act-mer-003',
    category: 'production_readiness',
    label: 'Complete production readiness review',
    description:
      'Production deployment has open blockers. Review each and assign resolution owners.',
    status: 'blocked',
    disabledReason: null,
    deferredReason: null,
    ownerAgent: 'steward',
    priority: 'high',
    clickTarget: '/platform/admin/production-readiness',
    deterministicSeed: true,
  },
];

const DETERMINISTIC_CAVEAT =
  'Admin actions are deterministic seed data — not live system state. ' +
  'Action availability and status are fixed until runtime wiring is complete.';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all actions with status 'available' for the given tenant.
 */
export function getAvailableAdminActions(tenantSlug: string): AdminAction[] {
  const view = buildAdminActionStripView(tenantSlug);
  return view.actions.filter((a) => a.status === 'available');
}

/**
 * Returns all actions with status 'blocked' for the given tenant.
 */
export function getBlockedAdminActions(tenantSlug: string): AdminAction[] {
  const view = buildAdminActionStripView(tenantSlug);
  return view.actions.filter((a) => a.status === 'blocked');
}

/**
 * Builds the Admin Zone E Action Strip view for the given tenant.
 */
export function buildAdminActionStripView(tenantSlug: string): AdminActionStripView {
  const actions: AdminAction[] =
    tenantSlug === 'apex-retail'
      ? APEX_RETAIL_ACTIONS
      : tenantSlug === 'meridian'
        ? MERIDIAN_ACTIONS
        : [];

  const availableCount = actions.filter((a) => a.status === 'available').length;
  const blockedCount = actions.filter((a) => a.status === 'blocked').length;

  // Top priority action = first high-priority available action
  const topPriorityAction =
    actions.find((a) => a.status === 'available' && a.priority === 'high') ?? null;

  return {
    actions,
    topPriorityAction,
    availableCount,
    blockedCount,
    deterministicSeed: true,
    caveat: DETERMINISTIC_CAVEAT,
  };
}

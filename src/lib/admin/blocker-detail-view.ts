/**
 * W32F — Production Readiness Blocker Detail Drawer View Model
 *
 * Pure TypeScript read-model for the Production Readiness blocker detail drawer.
 * The WIRE2 audit found the blocker detail drawer is not implemented — clicking
 * a blocker does not open any detail view.
 *
 * This view model provides the data contract for the drawer, with realistic
 * blockers derived from the existing production readiness manifest seed.
 *
 * No React. No network calls. No model calls. Deterministic seed output only.
 * No blocker is marked resolved unless genuinely resolved in seed data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BlockerSeverity = 'critical' | 'high' | 'medium' | 'low';
export type BlockerOwner = 'steward' | 'nexus' | 'atlas' | 'founder' | 'engineering';

export interface BlockerDetail {
  id: string;
  title: string;
  description: string;
  severity: BlockerSeverity;
  impactedComponent: string;
  evidenceBasis: string;
  nextAction: string;
  owner: BlockerOwner;
  estimatedResolutionPath: string;
  pilotImpact: boolean;
  productionImpact: boolean;
  deterministicSeed: true;
}

export interface BlockerDetailDrawerView {
  blockerId: string;
  blocker: BlockerDetail | null;
  relatedBlockers: BlockerDetail[];
  drawerTitle: string;
  caveat: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Apex Retail blocker seed data
// ---------------------------------------------------------------------------

const APEX_RETAIL_BLOCKERS: BlockerDetail[] = [
  {
    id: 'blk-apex-001',
    title: 'Evidence upload connector not wired',
    description:
      'The evidence upload pathway is not connected to the evidence fabric. ' +
      'Programme documents, vendor responses, and workshop notes must be manually ' +
      'uploaded by an operator — no automated ingestion is available. ' +
      'This prevents Sentinel from detecting new patterns as evidence arrives.',
    severity: 'critical',
    impactedComponent: 'Evidence Fabric / Sentinel Pattern Detection',
    evidenceBasis:
      'Connector readiness stub inventory — evidence upload connector shows not_configured status. ' +
      'Deterministic Wave 2 seed.',
    nextAction:
      'Engineering team to implement evidence upload connector. ' +
      'Interim: Steward uploads evidence manually via Admin evidence intake.',
    owner: 'engineering',
    estimatedResolutionPath:
      'Scope and implement evidence upload connector API. ' +
      'Estimated effort: 2–3 sprint cycles post-pilot.',
    pilotImpact: true,
    productionImpact: true,
    deterministicSeed: true,
  },
  {
    id: 'blk-apex-002',
    title: 'Model gateway not configured',
    description:
      'The model gateway is not configured for production use. ' +
      'All model inference is deferred — no live AI outputs are generated. ' +
      'This means Intelligence pattern detection, Sentinel signals, and Atlas ' +
      'recommendations are all running on deterministic seed data, not live analysis.',
    severity: 'critical',
    impactedComponent: 'Intelligence / Sentinel / Atlas — all model-backed surfaces',
    evidenceBasis:
      'Production readiness manifest — model gateway component shows not_started status. ' +
      'Deterministic Wave 2 seed.',
    nextAction:
      'Configure model gateway with approved model provider (Azure OpenAI). ' +
      'Requires founder decision on model provider and security review.',
    owner: 'founder',
    estimatedResolutionPath:
      'Founder decision on model provider required. ' +
      'Then: configure gateway credentials, run security review, integration test.',
    pilotImpact: false,
    productionImpact: true,
    deterministicSeed: true,
  },
  {
    id: 'blk-apex-003',
    title: 'Connector stubs — no live data ingestion',
    description:
      'All data connectors are in stub state. No live data ingestion is wired. ' +
      'The platform is operating on Wave 2 seed data only. ' +
      'CDP programme analysis, AMS BAFO tracking, and spend analytics all ' +
      'require connector activation before live programme signals can be generated.',
    severity: 'high',
    impactedComponent: 'All data-backed surfaces (CDP, AMS, Intelligence)',
    evidenceBasis:
      'Connector readiness view — all connectors show configured_stub or not_configured. ' +
      'Deterministic Wave 2 seed.',
    nextAction:
      'Activate contract management connector (highest priority pilot connector). ' +
      'Then: identity connector production verification.',
    owner: 'steward',
    estimatedResolutionPath:
      'Contract management connector: end-to-end test required before activation. ' +
      'Identity connector: IT Security domain verification required.',
    pilotImpact: true,
    productionImpact: true,
    deterministicSeed: true,
  },
  {
    id: 'blk-apex-004',
    title: 'SOC2 certification pending',
    description:
      'SOC2 Type II certification has not been initiated. ' +
      'Enterprise customers require SOC2 certification before allowing AbarVa to ' +
      'process their programme data in a production context.',
    severity: 'high',
    impactedComponent: 'Tenant onboarding / Enterprise deployment',
    evidenceBasis:
      'Enterprise deployment trust verification runbook — SOC2 certification status: not_started. ' +
      'Deterministic Wave 2 seed.',
    nextAction:
      'Initiate SOC2 audit with approved auditor. ' +
      'This is a founder-level decision requiring legal and compliance review.',
    owner: 'founder',
    estimatedResolutionPath:
      'Estimated 6–9 months for SOC2 Type II certification. ' +
      'Pilot deployments can proceed under a mutual NDA and data processing agreement.',
    pilotImpact: false,
    productionImpact: true,
    deterministicSeed: true,
  },
];

const DETERMINISTIC_CAVEAT =
  'Blocker details are deterministic seed data — not live system monitoring. ' +
  'Status and descriptions reflect the Wave 2 seed state and will update when runtime ' +
  'ingestion is wired.';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all blocker details for the given tenant.
 */
export function getAllBlockerDetails(tenantSlug: string): BlockerDetail[] {
  if (tenantSlug === 'apex-retail') return APEX_RETAIL_BLOCKERS;
  return [];
}

/**
 * Returns only critical-severity blockers for the given tenant.
 */
export function getCriticalBlockers(tenantSlug: string): BlockerDetail[] {
  return getAllBlockerDetails(tenantSlug).filter((b) => b.severity === 'critical');
}

/**
 * Builds the BlockerDetailDrawerView for a specific blocker.
 *
 * @param blockerId - The ID of the blocker to show in the drawer
 * @param tenantSlug - The tenant identifier
 */
export function buildBlockerDetailDrawerView(
  blockerId: string,
  tenantSlug: string,
): BlockerDetailDrawerView {
  const allBlockers = getAllBlockerDetails(tenantSlug);
  const blocker = allBlockers.find((b) => b.id === blockerId) ?? null;

  // Related blockers = same severity or same impactedComponent, excluding the main blocker
  const relatedBlockers = blocker
    ? allBlockers.filter(
        (b) =>
          b.id !== blockerId &&
          (b.severity === blocker.severity ||
            b.impactedComponent === blocker.impactedComponent),
      )
    : [];

  const drawerTitle = blocker
    ? blocker.title
    : 'Blocker not found';

  return {
    blockerId,
    blocker,
    relatedBlockers,
    drawerTitle,
    caveat: DETERMINISTIC_CAVEAT,
    deterministicSeed: true,
  };
}

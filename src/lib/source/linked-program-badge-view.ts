// SRC33 — Linked Program Badge View Model
// Pure TypeScript, no React, no model calls, no network calls.
// All data is deterministic seed data for demonstration purposes only.

export interface LinkedProgramBadgeView {
  programCode: string;           // "APX-CDP-2026"
  programName: string;           // "CDP Activation"
  tenantSlug: string;            // "apex-retail"
  relationship: string;          // "Supports programme commercial readiness"
  status: string;                // "deterministic_seed"
  ctaLabel: string;              // "View linked programme"
  routeHint: string | null;      // "/tenant/apex-retail/programs/apx-cdp-2026" or null
  evidenceCaveat: string;        // "Deterministic seed. No live procurement decision."
  deterministicSeed: true;
}

export function buildLinkedProgramBadgeView(sourceEventId: string): LinkedProgramBadgeView | null {
  if (sourceEventId === 'apex-retail-ams-outsourcing-2026') {
    return {
      programCode: 'APX-CDP-2026',
      programName: 'CDP Activation',
      tenantSlug: 'apex-retail',
      relationship: 'Supports programme commercial readiness',
      status: 'deterministic_seed',
      ctaLabel: 'View linked programme',
      routeHint: '/tenant/apex-retail/programs/apx-cdp-2026',
      evidenceCaveat: 'Deterministic seed. No live procurement decision.',
      deterministicSeed: true,
    };
  }
  return null;
}

// /home · canonical Home landing per Home Refinement Package.
//
// PR-H7 (2026-05-07): Setup IS the new Home. The Atlas-led
// HomeIndexPage that previously rendered here was deleted (per
// founder direction "delete"). This route now renders the Setup
// Overview (the 4-block compressed Overview from the Setup Redesign
// Package — status / orientation / action queue / activity), with
// AdminCanonShellV2's sidebar surfacing the canonical 7 sub-panels
// (Overview · Data Trust · AI Initiatives · Connectors · Users &
// Access · Agent Readiness · Production Readiness · plus AI
// Initiatives added in PR-H3).
//
// HomePanelGrid (the 8-card grid component built in PR-H3) is kept
// in the codebase as an unused alternative for future use, but is
// not rendered here — AdminCanonShellV2's sidebar IS the Home panel
// navigation per HOME_PANELS_INVENTORY.md.

import type { Metadata } from 'next';

export { default } from '../admin/page';

export const metadata: Metadata = { title: 'Home · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

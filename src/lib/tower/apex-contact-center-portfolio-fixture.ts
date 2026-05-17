// Apex contact-centre Move · Tower portfolio derivation · GAP-4.
//
// GAP-4 of the Apex end-to-end loop inventory
// (docs/strategy/scenarios/APEX-LOOP-WIRING-GAPS.md): the seeded
// `Contact Center AI Routing` Move (P3 Design) flows through the loop
// but never appeared as a first-class card in the Tower portfolio
// surface. The Source -> Tower handoff data and the cross-module trace
// viewer both show the linkage; the portfolio surface did not.
//
// The outcome-ledger and Source-to-Move handoff tables carry no seeded
// rows for the contact-centre Move (the read adapters degrade to empty
// rather than throw — see `outcomeLedgerReadAdapter`). Rather than run
// a DB migration or mutate production data, this module DERIVES the
// Tower-facing inputs for that one Move deterministically, in product,
// so the Tower portfolio surface can render it as a card.
//
// Everything here is a pure constant or a pure projection through the
// canonical Tower builders (`buildOutcomeLedgerView`, `buildSourceRiskView`,
// `buildTowerAdoptionRealizationView`) — no clock, no randomness, no I/O.
// Source/Moves files are NOT imported: the `SourceToMoveHandoff` record
// is constructed here as a plain typed object so this stays a Tower
// surface module.

import { buildOutcomeLedgerView } from '@/lib/tower/outcome-ledger';
import type { OutcomeLedgerRow, OutcomeLedgerView } from '@/lib/tower/outcome-ledger';
import { buildSourceRiskView } from '@/lib/tower/source-risk';
import type { SourceRiskView } from '@/lib/tower/source-risk';
import { buildTowerAdoptionRealizationView } from '@/lib/tower/outcome-ledger';
import type { TowerAdoptionRealizationView } from '@/lib/tower/outcome-ledger';
import type { SourceToMoveHandoff } from '@/lib/source/handoff/source-to-move-handoff-types';
import {
  buildMovePortfolioCards,
  type MovePortfolioCard,
  type PortfolioMoveRef,
} from '@/lib/tower/move-portfolio-card';

/** Canonical Apex tenant key on the app tier (no dash). */
export const APEX_TENANT_KEY = 'apexretail';

/**
 * The seeded contact-centre Move. `moveId` is the `graph_node_id` from
 * `scripts/seed-apex-demo-move.ts` — the same id the cross-module trace
 * route (`/strategic-moves/[moveId]/trace`) resolves the Move by.
 */
export const APEX_CONTACT_CENTER_MOVE: PortfolioMoveRef = {
  moveId: 'eng_apex_contact_center_ai_routing_p3_demo',
  moveName: 'Contact Center AI Routing',
  phaseLabel: 'P3 Design',
};

/** The decided Source event behind the Move's sourcing-strategy decision. */
const APEX_CONTACT_CENTER_EVENT_ID = 'evt-apex-contact-center-sourcing-001';

// ── Outcome-ledger derivation ─────────────────────────────────────────────────
//
// One `move`-subject value claim for the contact-centre Move, at the
// `baseline_set` readiness rung — projected economics with a baseline
// established but no measured result yet. This projects to the
// `tracked` value tier in the Tower view model.

const APEX_CONTACT_CENTER_LEDGER_ROW: OutcomeLedgerRow = {
  id: 'ledger-apex-contact-center-001',
  supersedesEntryId: null,
  isCurrent: true,
  tenantClientKey: APEX_TENANT_KEY,
  clientId: null,
  subjectKind: 'move',
  subjectRef: APEX_CONTACT_CENTER_MOVE.moveId,
  subjectLabel: 'Contact Center AI Routing — projected handle-time reduction',
  valueRung: 'baseline_set',
  valueCategory: 'cost_avoidance',
  measurementUnit: 'usd_seed',
  projectedAmount: 4_200_000,
  realizedAmount: null,
  baselineAmount: 0,
  counterfactualConfidence: 'medium',
  governanceReviewStatus: 'in_review',
  measurementOwnerRole: 'VP Customer Operations',
  evidencePointer: null,
  evidenceClaimIds: [],
  note: 'Projected from the P2 baseline metrics deliverable; pilot measurement pending.',
  recordedBy: null,
  recordedAt: '2026-05-10T00:00:00.000Z',
};

/**
 * The Tower outcome-ledger view for the Apex contact-centre Move,
 * derived through the canonical `buildOutcomeLedgerView` builder.
 */
export function buildApexContactCenterLedgerView(): OutcomeLedgerView {
  return buildOutcomeLedgerView(APEX_TENANT_KEY, [APEX_CONTACT_CENTER_LEDGER_ROW]);
}

// ── Source-to-Move handoff derivation ─────────────────────────────────────────
//
// A `ready_with_open_items` handoff: the sourcing decision is decided
// and the Move can mobilize, but one delivery-model gate question
// follows it into execution. This classifies as `watch` in the
// source-risk view — manageable sourcing risk to track, surfaced next
// to the portfolio value claim.

const APEX_CONTACT_CENTER_HANDOFF: SourceToMoveHandoff = {
  eventId: APEX_CONTACT_CENTER_EVENT_ID,
  targetMoveId: APEX_CONTACT_CENTER_MOVE.moveId,
  eventLabel: 'Apex contact-centre AI routing — sourcing strategy decision',
  handoffVersion: 'source-to-move-handoff/v1',
  handedOffAt: '2026-05-08T00:00:00.000Z',
  readiness: 'ready_with_open_items',
  sourcingRecommendation:
    'Buy the AI routing layer from a specialist vendor; integrate against the existing Genesys + Salesforce Service Cloud estate.',
  recommendedDeliveryModel: 'buy',
  plannedCostUsd: 3_800_000,
  deltas: [],
  mobilizationAssumptions: [
    {
      id: 'mob-a1',
      assumption:
        'The Move plans integration against the existing Genesys + Salesforce Service Cloud estate, not a platform replacement.',
      rationale:
        'The sourcing decision scoped a routing layer on the current estate; a replacement would invalidate the Move execution plan.',
      source: 'delivery_model_gate',
    },
  ],
  carriedOpenItems: [
    {
      id: 'open-1',
      question:
        'Is the incumbent telephony contract being renewed on its current term, or re-bid alongside the routing layer?',
      whyItMatters:
        'The Move execution timeline assumes the incumbent contract holds; a re-bid would shift the mobilization window.',
    },
  ],
  receivingMoveGuidance:
    'Mobilize on the buy decision, but resolve the incumbent-contract open item before committing the integration timeline.',
};

/**
 * The Tower source-risk view for the Apex contact-centre Move, derived
 * by joining the handoff record above against the outcome-ledger view
 * through the canonical `buildSourceRiskView` builder.
 */
export function buildApexContactCenterSourceRiskView(
  ledger: OutcomeLedgerView,
): SourceRiskView {
  return buildSourceRiskView({
    tenantClientKey: APEX_TENANT_KEY,
    handoffs: [APEX_CONTACT_CENTER_HANDOFF],
    ledger,
  });
}

// ── Adoption + realization derivation ─────────────────────────────────────────

/**
 * The Tower adoption + benefit-realization view for the Apex
 * contact-centre Move, derived purely from its outcome-ledger view.
 */
export function buildApexContactCenterAdoptionRealizationView(
  ledger: OutcomeLedgerView,
): TowerAdoptionRealizationView {
  return buildTowerAdoptionRealizationView(ledger);
}

// ── Top-level: the portfolio card ─────────────────────────────────────────────

/**
 * Build the full set of Tower portfolio cards for the Apex tenant —
 * currently the single contact-centre Move that has flowed through the
 * end-to-end loop. Composes the three Tower module reads (outcome
 * ledger, source risk, adoption realization) into the card.
 */
export function buildApexPortfolioCards(): readonly MovePortfolioCard[] {
  const ledger = buildApexContactCenterLedgerView();
  return buildMovePortfolioCards({
    moves: [APEX_CONTACT_CENTER_MOVE],
    ledger,
    sourceRisk: buildApexContactCenterSourceRiskView(ledger),
    adoptionRealization: buildApexContactCenterAdoptionRealizationView(ledger),
  });
}

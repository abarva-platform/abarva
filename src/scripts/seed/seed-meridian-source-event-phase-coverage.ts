// Seed — one Source event parked at each workspace phase, for the synthetic
// Meridian tenant.
//
// WHY THIS EXISTS
//
// Several merged Source New features cannot be observed on the running product
// because no served event sits at the stage that renders them. The signed-in
// acceptance walks record the same reason repeatedly, in these words: "the
// merge's claimed behaviour has no subject on this runtime".
//
// Measured on the deployed runtime, four events are served and they cluster:
// two normalise to the Define phase and two to the market-package phase. None
// is at Request, none at Responses, none past it. The consequences are
// specific, not general:
//
//   * The single-status step-readiness banner covers the Request step and
//     returns null for every other step, so it renders on NONE of the four —
//     every served event is already past Request.
//   * `SourceNewStage04VendorReadiness` renders only when the event's stage
//     normalises to `responses`. No event is there, so neither the Strategy
//     authority row nor its pre-existing Request authority sibling appears
//     anywhere.
//   * The supplier and NDA panels sit behind the same guard.
//
// This seed gives each of those surfaces a subject. It writes events only — no
// authority rows, no candidate suppliers, no NDAs — so a panel that renders
// will render its honest empty state rather than invented content. Populating
// those panels is a separate slice and is named in the release record.
//
// TENANT KEY — the one that is easy to get wrong
//
// `source_events.client_key` matches `active_clients.key`, which for this
// tenant is the APP key `meridian`, not the canonical substrate key
// `meridian-health`. Both are real and both appear in the alias profile
// (`appClientKey: "meridian"`, `canonicalKey: "meridian-health"`). Writing the
// canonical key here would produce rows the Source surface never queries, so
// the seed would appear to succeed and change nothing on screen.
//
// IDEMPOTENCY
//
// Upserted on `(client_key, event_code)`, which migration
// `20260602100000_source_events_idempotency.sql` enforces as
// `source_events_client_event_code_unique`. Re-running moves each event back
// to its declared stage rather than creating a second copy — which is also how
// the demo is reset after someone advances an event while rehearsing.
//
// SYNTHETIC
//
// Every row below is invented for the synthetic demo tenant. No real
// organisation, vendor or person is named, and no real engagement is described.
//
// Run:  npx tsx src/scripts/seed/seed-meridian-source-event-phase-coverage.ts [--dry-run]

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from "@/lib/data-plane/postgresCompat";
import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

type SeedClient = PostgresCompatClient;

/**
 * The app client key, not the canonical substrate key. See the tenant-key note
 * at the top of this file: the canonical key would write rows nothing reads.
 */
const TENANT_KEY = "meridian";

const SYNTHETIC_AUTHOR = "Synthetic demo dataset · Source phase coverage";

type PhaseCoverageEvent = {
  /** Natural key, with `(client_key, event_code)`. */
  eventCode: string;
  eventName: string;
  /** One of managed_service | software | staffing | infrastructure | consulting | other. */
  eventType: string;
  /**
   * The stage this event is parked at, and the surface it exists to give a
   * subject. A stage key here must be one `normalizeSourceStageKey` accepts;
   * `intake` is the pre-strategy state the table itself defaults to.
   */
  currentStageKey: string;
  /** What this event unblocks, recorded so a later reader knows why it is here. */
  rendersForTheFirstTime: string;
  estimatedValueUsd: number;
  triggerDescription: string;
  scopeDescription: string;
  decisionOwner: string;
};

const EVENTS: readonly PhaseCoverageEvent[] = [
  {
    eventCode: "MER-SRC-PH1-REQUEST",
    eventName: "Revenue cycle managed services — intake",
    eventType: "managed_service",
    currentStageKey: "intake",
    rendersForTheFirstTime:
      "the step-readiness banner, which covers the Request step and currently renders on no served event",
    estimatedValueUsd: 4_200_000,
    triggerDescription:
      "Incumbent agreement reaches its notice window in two quarters and the current scope has never been competed.",
    scopeDescription:
      "Patient access, coding, billing and denials management across the hospital group and the plan's claims operation.",
    decisionOwner: "Director, Revenue Cycle Operations",
  },
  {
    eventCode: "MER-SRC-PH2-DEFINE",
    eventName: "Payment integrity platform — scope and strategy",
    eventType: "software",
    currentStageKey: "scope",
    rendersForTheFirstTime:
      "the Define phase with a second event, so the phase rail shows more than one state",
    estimatedValueUsd: 2_750_000,
    triggerDescription:
      "Two business units buy overlapping capability under separate agreements with no consolidated view of the relationship.",
    scopeDescription:
      "Pre-pay and post-pay integrity, subrogation and coordination of benefits for the plan, with provider-side audit support in scope.",
    decisionOwner: "VP, Health Plan Operations",
  },
  {
    eventCode: "MER-SRC-PH3-SUPPLIERS",
    eventName: "Care management platform — supplier panel and NDA",
    eventType: "software",
    currentStageKey: "responses",
    rendersForTheFirstTime:
      "Stage 04 vendor readiness, the Strategy authority row, its Request authority sibling, and the supplier and NDA panels — all of which render only at this stage and currently have no subject",
    estimatedValueUsd: 3_400_000,
    triggerDescription:
      "The member population and the patient population overlap, and the tooling supporting each was bought separately.",
    scopeDescription:
      "Care coordination, population health stratification and transitions of care, evaluated across both the plan and the delivery system.",
    decisionOwner: "Chief Nursing Informatics Officer",
  },
  {
    eventCode: "MER-SRC-PH4-MARKET",
    eventName: "Enterprise data platform — market package",
    eventType: "software",
    currentStageKey: "rfp",
    rendersForTheFirstTime:
      "the market-package phase with a third event, so release state can be read against more than one package",
    estimatedValueUsd: 6_100_000,
    triggerDescription:
      "Consumption has grown past the committed tier and the agreement carries no benchmark right.",
    scopeDescription:
      "Lakehouse, governance and analytics engineering for clinical, claims and corporate domains under one enterprise agreement.",
    decisionOwner: "VP, Data and Analytics",
  },
  {
    eventCode: "MER-SRC-PH5-DECIDE",
    eventName: "Managed security services — award decision",
    eventType: "managed_service",
    currentStageKey: "executive_decision",
    rendersForTheFirstTime:
      "the decide phase, which no served event reaches, and which is where an award would be recorded",
    estimatedValueUsd: 5_300_000,
    triggerDescription:
      "Detection and response coverage is split across three agreements with inconsistent service credits.",
    scopeDescription:
      "24x7 monitoring, detection and response across the clinical estate, corporate systems and the plan's claims platform.",
    decisionOwner: "Chief Information Security Officer",
  },
];

type SourceEventRow = {
  client_key: string;
  event_code: string;
  event_name: string;
  event_type: string;
  current_stage_key: string;
  lifecycle_state: string;
  estimated_value_usd: number;
  trigger_description: string;
  scope_description: string;
  decision_owner: string;
  created_by_user_id: string;
};

export function eventRow(event: PhaseCoverageEvent): SourceEventRow {
  return {
    client_key: TENANT_KEY,
    event_code: event.eventCode,
    event_name: event.eventName,
    event_type: event.eventType,
    current_stage_key: event.currentStageKey,
    lifecycle_state: "active",
    estimated_value_usd: event.estimatedValueUsd,
    trigger_description: event.triggerDescription,
    scope_description: event.scopeDescription,
    decision_owner: event.decisionOwner,
    // Not a real Clerk user id. The column is nullable and documented as "may
    // be null for agent-initiated rows"; a label is more use to an operator
    // reading the row than a null, and it marks the row as seeded.
    created_by_user_id: SYNTHETIC_AUTHOR,
  };
}

export const PHASE_COVERAGE_EVENTS = EVENTS;

function summary() {
  return {
    tenantKey: TENANT_KEY,
    events: EVENTS.length,
    stages: EVENTS.map((event) => ({
      eventCode: event.eventCode,
      stage: event.currentStageKey,
      unblocks: event.rendersForTheFirstTime,
    })),
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) {
    console.log(JSON.stringify({ ...summary(), status: "dry-run" }, null, 2));
    return;
  }

  const client: SeedClient = getAzureWriteFluentClient();
  const rows = EVENTS.map(eventRow);

  const upsert = await client
    .from("source_events")
    .upsert(rows, { onConflict: "client_key,event_code" });
  if (upsert.error) {
    throw new Error(`source_events upsert failed: ${upsert.error.message}`);
  }

  console.log(JSON.stringify({ ...summary(), status: "seeded" }, null, 2));
}

// Only run when executed directly, so the tests can import the row builder
// without opening a database connection.
if (process.argv[1]?.includes("seed-meridian-source-event-phase-coverage")) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

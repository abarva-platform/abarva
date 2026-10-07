import fs from "node:fs";
import path from "node:path";
import {
  PHASE_COVERAGE_EVENTS,
  eventRow,
} from "@/scripts/seed/seed-meridian-source-event-phase-coverage";
import { normalizeSourceStageKey } from "@/lib/source/constants";
import { appClientKeyForTenant } from "@/lib/tenant/aliases";

/**
 * Several merged Source New features render on no served event, because the
 * four events the runtime serves cluster at two phases. The signed-in
 * acceptance walks record it in these words: "the merge's claimed behaviour has
 * no subject on this runtime."
 *
 * This seed parks one event at each phase so those surfaces have a subject.
 * Two things make it either work or silently do nothing, and both are asserted
 * against the product's own code rather than restated here:
 *
 *   1. the tenant key must be the APP key, since the canonical key would write
 *      rows the Source surface never queries;
 *   2. each stage key must be one the stage normaliser accepts, or the event
 *      resolves to no phase at all.
 */

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/scripts/seed/seed-meridian-source-event-phase-coverage.ts",
  ),
  "utf8",
);

describe("the Source event phase-coverage seed", () => {
  it("writes the app client key, not the canonical substrate key", () => {
    // The mistake this guards is not a typo: both keys are real and both name
    // this tenant. `meridian-health` is the canonical substrate key, and rows
    // written under it would never be read by the Source surface — the seed
    // would report success and change nothing on screen.
    const appKey = appClientKeyForTenant("meridian-health");
    expect(appKey).toBe("meridian");
    for (const event of PHASE_COVERAGE_EVENTS) {
      expect(eventRow(event).client_key).toBe(appKey);
      expect(eventRow(event).client_key).not.toBe("meridian-health");
    }
  });

  it("parks every event at a stage the normaliser accepts", () => {
    for (const event of PHASE_COVERAGE_EVENTS) {
      // `intake` is the pre-strategy state the table itself defaults to and is
      // not in SOURCE_STAGE_ORDER, so it is allowed explicitly rather than
      // being asserted through the normaliser.
      if (event.currentStageKey === "intake") continue;
      expect(normalizeSourceStageKey(event.currentStageKey)).toBe(
        event.currentStageKey,
      );
    }
  });

  it("covers five distinct stages, so no two events light the same surface", () => {
    const stages = PHASE_COVERAGE_EVENTS.map((e) => e.currentStageKey);
    expect(stages).toHaveLength(5);
    expect(new Set(stages).size).toBe(5);
  });

  // The two stages that are the whole point. Each was measured as the gate for
  // a surface that currently renders on nothing.
  it("puts an event at responses, which is the vendor-readiness gate", () => {
    const atResponses = PHASE_COVERAGE_EVENTS.filter(
      (e) => e.currentStageKey === "responses",
    );
    expect(atResponses).toHaveLength(1);
    expect(atResponses[0].rendersForTheFirstTime).toContain("Stage 04");
  });

  it("puts an event at intake, which is the only step the banner covers", () => {
    const atIntake = PHASE_COVERAGE_EVENTS.filter(
      (e) => e.currentStageKey === "intake",
    );
    expect(atIntake).toHaveLength(1);
    expect(atIntake[0].rendersForTheFirstTime).toContain("step-readiness");
  });

  it("gives every event a distinct natural key", () => {
    const codes = PHASE_COVERAGE_EVENTS.map((e) => e.eventCode);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code.trim()).not.toBe("");
  });

  it("upserts on the unique constraint the schema actually enforces", () => {
    expect(source).toContain('onConflict: "client_key,event_code"');
    // Control: the constraint exists. Migration 20260602100000 adds
    // `source_events_client_event_code_unique UNIQUE (client_key, event_code)`,
    // and an upsert naming a key the schema does not enforce fails at runtime.
    const migration = fs.readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260602100000_source_events_idempotency.sql",
      ),
      "utf8",
    );
    expect(migration).toContain("source_events_client_event_code_unique");
    expect(migration.replace(/\s+/g, " ")).toContain(
      "UNIQUE (client_key, event_code)",
    );
  });

  it("records every event as active, so the workspace serves it", () => {
    for (const event of PHASE_COVERAGE_EVENTS) {
      expect(eventRow(event).lifecycle_state).toBe("active");
    }
  });

  it("states its own content and value for every event", () => {
    for (const event of PHASE_COVERAGE_EVENTS) {
      const row = eventRow(event);
      expect(row.trigger_description.length).toBeGreaterThan(40);
      expect(row.scope_description.length).toBeGreaterThan(40);
      expect(row.decision_owner.trim()).not.toBe("");
      expect(row.estimated_value_usd).toBeGreaterThan(0);
    }
  });

  // This repository is public and the seed ships in it. A synthetic fixture
  // tenant is fine to name; a real organisation is not.
  it("names no real organisation", () => {
    for (const forbidden of [
      "Presbyterian",
      "PHS",
      "Optum",
      "Workday",
      "Epic",
      "Kyndryl",
      "Databricks",
      "Cognizant",
    ]) {
      expect(source).not.toContain(forbidden);
    }
    // Control: the matcher works on this file, so the absences above are
    // measured rather than vacuous.
    expect(source).toContain("Meridian");
  });

  it("does not open a database connection when imported", () => {
    // The guard that makes this suite safe: `main()` runs only when the file is
    // the entry point, so importing it to test the row builder cannot connect.
    expect(source).toContain("if (process.argv[1]?.includes(");
  });
});

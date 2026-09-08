// Proves Source event approval persistence is usable after migration repair.
//
// The check creates its own synthetic event under a non-client verification
// tenant, runs the same Azure Source write adapter used by the approval route,
// then reads the receipt back through loadApprovalLedger. This deliberately
// avoids real client events while proving that the route's core database
// contract can update lifecycle state and append/read the approval receipt.
//
// Run with NODE_OPTIONS=--conditions=react-server because loadApprovalLedger
// imports server-only through the Next.js server module boundary.

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { createAzureSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { loadApprovalLedger } from "@/lib/source/approval-ledger";

const VERIFY_TENANT_KEY = "db-migration-lab-verification-nonexistent-tenant";

async function main() {
  const db = getAzureWriteFluentClient();
  const verificationRunId = new Date()
    .toISOString()
    .replaceAll(/[-:.TZ]/g, "")
    .slice(0, 14);
  const eventCode = `DB-MIGRATION-LAB-APPROVAL-${verificationRunId}-${process.pid}`;
  const fixtureLabel = `db-migration-lab approval verification fixture ${eventCode} - safe to ignore`;

  const { data: event, error: eventError } = await db
    .from("source_events")
    .insert({
      client_key: VERIFY_TENANT_KEY,
      event_code: eventCode,
      event_name: fixtureLabel,
      event_type: "managed_service",
      sourcing_motion: "contract_optimization",
      current_stage_key: "strategy",
      lifecycle_state: "waiting_on_client",
      estimated_value_usd: 1,
      trigger_description: "Synthetic approval-ledger repository readback.",
      scope_description: "Synthetic verification event; not client data.",
      decision_owner: "db-migration-lab",
      created_by_user_id: "db-migration-lab",
    })
    .select("id")
    .single<{ id: string }>();

  if (eventError || !event) {
    console.error("x Failed to create the synthetic approval verification event.");
    console.error(eventError);
    process.exit(1);
    return;
  }

  const adapter = createAzureSourceWriteAdapter();
  const approval = await adapter.applyApproval({
    eventId: event.id,
    clientKey: VERIFY_TENANT_KEY,
    fromState: "waiting_on_client",
    toState: "active",
    approvalAction: "admin_review",
    approvedByUserId: "db-migration-lab",
    notes: "db-migration-lab automated approval-ledger repository readback.",
    stageKey: "strategy",
  });

  if (!approval.ok) {
    console.error("x applyApproval failed.");
    console.error(approval.error);
    process.exit(1);
    return;
  }

  const stage = await adapter.updateStage({
    eventId: event.id,
    clientKey: VERIFY_TENANT_KEY,
    stageKey: "scope",
    lifecycleState: "active",
    updatedAtIso: new Date().toISOString(),
  });

  if (!stage.ok) {
    console.error("x updateStage failed after approval receipt write.");
    console.error(stage.error);
    process.exit(1);
    return;
  }

  const { data: persistedEvent, error: persistedEventError } = await db
    .from("source_events")
    .select("id, lifecycle_state, current_stage_key")
    .eq("id", event.id)
    .eq("client_key", VERIFY_TENANT_KEY)
    .single<{
      id: string;
      lifecycle_state: string;
      current_stage_key: string;
    }>();

  if (persistedEventError || !persistedEvent) {
    console.error("x The synthetic event was not readable after approval.");
    console.error(persistedEventError);
    process.exit(1);
    return;
  }

  const ledger = await loadApprovalLedger(event.id, "scope", [
    { key: "strategy", label: "Strategy" },
    { key: "scope", label: "Scope" },
  ]);
  const approvedStrategy = ledger.find((row) => row.stageKey === "strategy");

  const problems: string[] = [];
  if (persistedEvent.lifecycle_state !== "active") {
    problems.push(`lifecycle_state mismatch: ${persistedEvent.lifecycle_state}`);
  }
  if (persistedEvent.current_stage_key !== "scope") {
    problems.push(`current_stage_key mismatch: ${persistedEvent.current_stage_key}`);
  }
  if (!approvedStrategy) {
    problems.push("strategy approval ledger row missing");
  } else {
    if (approvedStrategy.state !== "approved") {
      problems.push(`strategy ledger state mismatch: ${approvedStrategy.state}`);
    }
    if (!approvedStrategy.approvedAtIso) {
      problems.push("strategy approvedAtIso missing");
    }
    if (
      approvedStrategy.approverRationale !==
      "db-migration-lab automated approval-ledger repository readback."
    ) {
      problems.push("strategy approval rationale mismatch");
    }
  }

  if (problems.length > 0) {
    console.error("x Approval repository readback failed shape checks:");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
    return;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        verificationEventId: event.id,
        tenantKey: VERIFY_TENANT_KEY,
        lifecycleState: persistedEvent.lifecycle_state,
        currentStageKey: persistedEvent.current_stage_key,
        approvedStageKey: approvedStrategy?.stageKey ?? null,
        approvedAtIso: approvedStrategy?.approvedAtIso ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("x Approval repository readback threw.");
  console.error(error);
  process.exit(1);
});

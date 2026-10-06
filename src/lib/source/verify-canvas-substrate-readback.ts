// Verifies the physical Source canvas tables through the production Azure
// repository seams. The fixture is inserted and deleted in one transaction,
// so the check proves read/write behavior without leaving tenant data behind.

import { createAzureSourceCanvasSubstrateReadAdapter } from "@/lib/data-plane/read-adapters/sourceCanvasSubstrateReadAdapter";
import { createTxSession } from "@/lib/data-plane/read-adapters/azureSession";
import { createAzureSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";

const VERIFY_TENANT_KEY = "db-migration-lab-verification-nonexistent-tenant";

async function main() {
  const transaction = createTxSession("source-canvas-substrate-readback");
  const proof = await transaction(async (run) => {
    const suffix = `${Date.now()}-${process.pid}`;
    const eventCode = `DB-MIGRATION-LAB-CANVAS-${suffix}`;
    const [event] = await run<{ id: string }>(
      `INSERT INTO source_events
         (client_key, event_code, event_name, event_type, sourcing_motion,
          current_stage_key, lifecycle_state, estimated_value_usd,
          trigger_description, scope_description, decision_owner,
          created_by_user_id)
       VALUES ($1,$2,$3,'managed_service','contract_optimization','strategy',
               'active',1,'Synthetic canvas readback.','Synthetic verification event.',
               'db-migration-lab','db-migration-lab')
       RETURNING id`,
      [
        VERIFY_TENANT_KEY,
        eventCode,
        `db-migration-lab canvas verification fixture ${eventCode}`,
      ],
    );
    if (!event?.id) throw new Error("synthetic Source event insert returned no id");

    const [artifact] = await run<{ id: string }>(
      `INSERT INTO source_event_artifact_states
         (source_event_id, tenant_key, artifact_code, stage_key,
          artifact_family, requirement_level, gate_defining)
       VALUES ($1,$2,'d01_strategy_memo','strategy','sourcing_strategy','required',true)
       RETURNING id`,
      [event.id, VERIFY_TENANT_KEY],
    );
    await run(
      `INSERT INTO source_event_gate_criterion_states
         (source_event_id, tenant_key, criterion_id, from_stage, to_stage)
       VALUES ($1,$2,'GATE-VERIFY-01','strategy','scope')`,
      [event.id, VERIFY_TENANT_KEY],
    );
    await run(
      `INSERT INTO source_event_evidence_states
         (source_event_id, tenant_key, requirement_id, stage_key)
       VALUES ($1,$2,'EVID-VERIFY-01','strategy')`,
      [event.id, VERIFY_TENANT_KEY],
    );

    const sameTransaction = async <T>(
      fn: (sqlRun: typeof run) => Promise<T>,
    ): Promise<T> => fn(run);
    const reads = createAzureSourceCanvasSubstrateReadAdapter(sameTransaction);
    const writes = createAzureSourceWriteAdapter(sameTransaction);

    if (!artifact?.id) throw new Error("artifact-state insert returned no id");
    const update = await writes.updateArtifactBody({
      artifactRowId: artifact.id,
      columns: {
        body: "# Synthetic canvas repository readback",
        body_format: "markdown",
        body_authored_by: "db-migration-lab",
        body_updated_at: new Date().toISOString(),
        body_generation_metadata: { verification: true },
        status: "drafting",
      },
    });
    if (!update.ok) throw new Error(`artifact-state update failed: ${update.error}`);

    // Keep these sequential because the verifier deliberately binds all
    // repository calls to one transaction-scoped pg client.
    const artifacts = await reads.listArtifactStateRows(event.id);
    const criteria = await reads.listGateCriterionStateRows(event.id);
    const evidence = await reads.listEvidenceStateRows(event.id);
    const problems: string[] = [];
    if (artifacts.length !== 1) problems.push(`artifact rows: ${artifacts.length}`);
    if (criteria.length !== 1) problems.push(`criterion rows: ${criteria.length}`);
    if (evidence.length !== 1) problems.push(`evidence rows: ${evidence.length}`);
    if (artifacts[0]?.body !== "# Synthetic canvas repository readback") {
      problems.push("artifact body did not round-trip through repository seams");
    }
    if (artifacts[0]?.body_generation_metadata?.verification !== true) {
      problems.push("artifact generation metadata did not round-trip");
    }
    if (problems.length > 0) throw new Error(problems.join("; "));

    await run("DELETE FROM source_events WHERE id = $1", [event.id]);
    return {
      structured_event: "source_canvas_substrate_repository_readback",
      ok: true,
      artifactRows: artifacts.length,
      criterionRows: criteria.length,
      evidenceRows: evidence.length,
      bodyRoundTrip: true,
      fixtureRemovedBeforeCommit: true,
    };
  });

  console.log(JSON.stringify(proof, null, 2));
}

main().catch((error) => {
  console.error("x Source canvas substrate repository readback failed.");
  console.error(error);
  process.exit(1);
});

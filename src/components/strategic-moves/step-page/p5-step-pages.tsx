"use client";

import { useEffect, useState } from "react";
import type { AssumptionView } from "@/lib/programs/assumption-register/register-request";
import { SourceLine, type StepPageRow } from "./MovesStepPage";
import { CaptureStepPage, field } from "./p4-step-pages";
import type { PhaseStepPageMap } from "./phase-step-pages";
import styles from "./MovesStepPage.module.css";

function MeasurementBaselines({ moveId }: { moveId: string }) {
  const [rows, setRows] = useState<AssumptionView[] | null>(null);
  const [status, setStatus] = useState("Reading confirmed register rows…");
  useEffect(() => {
    let live = true;
    fetch(`/api/v1/programs/${encodeURIComponent(moveId)}/assumptions`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<{ assumptions?: AssumptionView[] }>;
      })
      .then((body) => {
        if (live) {
          setRows((body.assumptions ?? []).filter((row) => row.status === "confirmed" || row.status === "corrected"));
          setStatus("");
        }
      })
      .catch(() => { if (live) setStatus("Register rows could not be read. No measurement baseline is claimed."); });
    return () => { live = false; };
  }, [moveId]);
  return <div>
    <p role="status" className={styles.proposal}>{status || `${rows?.length ?? 0} confirmed register rows available as proposed measurement baselines.`}</p>
    {rows?.map((row) => <p key={row.id} className={styles.proposal}>
      <strong>[A:{row.id}] {row.statement}</strong>
      <SourceLine source={{ kind: "est", text: row.figuresRedacted ? "Figure withheld" : (row.workingFigure ?? "No working figure"), cite: row.source }} />
    </p>)}
    <p className={styles["item-note"]}>Tower validates the baseline after handoff. This page does not start measurement or execution.</p>
  </div>;
}

export const P5_STEP_PAGES: PhaseStepPageMap = {
  "p5-owners": (host) => <CaptureStepPage host={host} view="p5-owners" title="Name handoff owners and readiness" intro="Name the owner roles and the conditions for a governed handoff to execution." checkIds={["launch_readiness_attested"]} fields={[
    field("mobilization_plan", "Mobilization plan", "mobilization plan", "name the handoff owner roles", "Name role owners and handoff responsibilities. Add named people only where governance permits."),
    field("launch_readiness", "Launch readiness", "readiness conditions", "record the launch readiness conditions", "Record entry conditions, go/no-go criteria and unresolved prerequisites."),
  ]} carry="Owner roles and readiness conditions for Tower handoff." />,
  "p5-measurement": (host) => {
    const baselines: StepPageRow = { id: "BASELINES", rank: 0, shortName: "measurement baselines", subject: "Confirmed assumptions for measurement", state: "settled", wide: true, middle: <MeasurementBaselines moveId={host.move.id} />, facts: [{ kind: "team", text: "Read-only register projection; confirmation is recorded in the register." }] };
    return <CaptureStepPage host={host} view="p5-measurement" title="Define Tower measurement" intro="Record the value proof rules and governance cadence for the handoff." checkIds={["tower_cadence_defined", "value_measurement_contract_signed_off"]} beforeRows={[baselines]} fields={[
      field("value_proof_rules", "Value proof rules", "value proof", "record the value proof rules", "Name each metric, baseline source, measurement owner role, validation rule and review date."),
      field("governance_cadence", "Governance cadence", "governance cadence", "record the Tower governance cadence", "Name the review rhythm, decision forum and escalation role."),
    ]} carry="Read-only baseline references and the measurement contract inputs." />;
  },
  "p5-first-90": (host) => <CaptureStepPage host={host} view="p5-first-90" title="Plan the first 90 days" intro="Record the handoff sequence and open items without claiming execution has started." checkIds={["p5_open_risks_recorded"]} fields={[
    field("first_90_days", "First 90 days", "first 90 days", "record the first 90-day plan", "Describe planned checkpoints, role owners and decision dates; these are future commitments."),
    field("risks_open_items", "Risks and open items", "open items", "record the open items", "Name each risk or client-to-complete item, its owner role and resolution path."),
  ]} carry="The planned checkpoints and unresolved items; execution remains downstream." />,
};

"use client";

import { useState, type ReactNode } from "react";
import { DiagnosisFactsEditor } from "@/components/strategic-moves/DiagnosisFactsEditor";
import { looksLikePersonalName } from "@/lib/programs/assumption-register/owner-role";
import { effectiveFigure } from "@/lib/programs/assumption-register/model";
import {
  parseCaptureTextStepRecord,
  type CaptureTextStepEntry,
} from "@/lib/programs/capture-text-step-record";
import { parseDiagnosisFacts } from "@/lib/programs/diagnosis-facts";
import {
  p2CheckState,
  p2EvidencePlanReady,
  numberedP2EvidenceReferences,
  uncitedP2BaselineReasons,
  type P2HardCheckId,
} from "@/lib/programs/p2-step-readiness";
import { SOLUTION_ROUTE_LABELS } from "@/lib/programs/solution-route-assessment";
import { resolveStepNextAction } from "@/lib/programs/step-page-model";
import { MovesStepPage, SourceLine, type StepPageRow } from "./MovesStepPage";
import { useStepEvidence } from "./StepEvidence";
import type { PhaseStepPageMap, StepPageHostProps } from "./phase-step-pages";
import styles from "./MovesStepPage.module.css";

const cx = (...names: string[]) =>
  names.map((name) => styles[name] ?? name).join(" ");
const phaseHref = (moveId: string) =>
  `/strategic-moves/${encodeURIComponent(moveId)}/phase/2`;
const evidenceHref = (moveId: string) =>
  `/strategic-moves/${encodeURIComponent(moveId)}/evidence`;

function recordEntry(
  host: StepPageHostProps,
  recordKey: string,
  key: string,
  text: string,
) {
  const record = parseCaptureTextStepRecord(host.values[recordKey] ?? "");
  const entry: CaptureTextStepEntry = {
    text,
    source: "team",
    status: "accepted",
  };
  host.setValue(
    recordKey,
    JSON.stringify({
      version: 1,
      entries: { ...record.entries, [key]: entry },
    }),
  );
}

function baselineTeamWords(raw: string): string {
  return parseDiagnosisFacts(raw)
    .map((fact) =>
      [fact.metric, fact.value, fact.source].filter(Boolean).join(" · "),
    )
    .join("\n");
}

function gateRows(
  host: StepPageHostProps,
  ids: readonly P2HardCheckId[],
  rank: number,
): StepPageRow[] {
  return ids.map((id, index) => {
    const criterion = host.gateProps.criteria.find((check) => check.id === id);
    const state = p2CheckState(host.gateProps.criteria, id);
    return {
      id,
      rank: rank + index,
      eyebrow: "Governed gate check",
      shortName: criterion?.label ?? id,
      subject: criterion?.label ?? "Gate check unavailable",
      state: state === "met" ? "settled" : "decision",
      clause:
        state === "unavailable"
          ? "read the P2 gate state"
          : `resolve ${criterion?.label.toLowerCase() ?? "the gate check"}`,
      middle: (
        <p className={cx("proposal")}>
          {state === "unavailable"
            ? "Not evaluated. Refresh the gate readback before treating this check as passed."
            : state === "met"
              ? "Met in the gate evaluator's current readback."
              : (criterion?.reason ??
                "Still open in the gate evaluator's current readback.")}
        </p>
      ),
      actions:
        state === "met" ? null : (
          <a
            className={cx("link-btn")}
            href={`${phaseHref(host.move.id)}?step=p2-gate`}
          >
            Open Gate readiness →
          </a>
        ),
    };
  });
}

function P2Page({
  host,
  title,
  intro,
  rows,
  checkIds,
  blockedBy,
  context,
  contextAction,
  notesPanel = null,
  carry,
  routeReadbackInconsistent = false,
}: {
  host: StepPageHostProps;
  title: string;
  intro: string;
  rows: StepPageRow[];
  checkIds: readonly P2HardCheckId[];
  blockedBy?: string | null;
  context: readonly ReactNode[];
  contextAction?: ReactNode;
  notesPanel?: ReactNode;
  carry?: string;
  routeReadbackInconsistent?: boolean;
}) {
  const checks = checkIds.map((id) => {
    const criterion = host.gateProps.criteria.find((check) => check.id === id);
    const state = p2CheckState(host.gateProps.criteria, id);
    const inconsistent =
      id === "solution_route_validated" && routeReadbackInconsistent;
    return {
      met: state === "met" && !inconsistent,
      unknown: state === "unavailable",
      level: "hard" as const,
      text: criterion?.label ?? id,
      note: inconsistent
        ? "Evaluator reports met, but the confirmed route readback is missing. This step remains open."
        : criterion?.reason,
      targetRowId: id,
    };
  });
  const next = resolveStepNextAction({
    depth: "full",
    rows,
    blockedBy,
    readySentence: `Continue to ${host.chrome.steps[host.chrome.stepIndex + 1]?.title ?? "Gate readiness"}`,
    emptySentence: "Review this step",
  });
  const page = (
    <MovesStepPage
      moveName={host.gateProps.moveName}
      clientDisplayName={host.move.tenant.name}
      syntheticNote="Synthetic demo data"
      tabs={host.chrome.tabs}
      phases={host.chrome.phases}
      steps={host.chrome.steps}
      stepIndex={host.chrome.stepIndex}
      phaseCode="P2"
      phaseName="Discover"
      title={title}
      intro={intro}
      nextAction={next}
      checks={checks}
      checksLabel="Show gate checks"
      checksWhenBlocked
      blockedLink={
        blockedBy
          ? {
              label: "Open Gate readiness →",
              href: `${phaseHref(host.move.id)}?step=p2-gate`,
            }
          : undefined
      }
      blockedWork={
        blockedBy ? (
          <p className={cx("item-note")}>
            Previously saved answers remain on the Move. Refresh to re-read the
            governed status before editing this step.
          </p>
        ) : undefined
      }
      context={{ items: context, details: [] }}
      contextAction={contextAction}
      rows={rows}
      carry={carry ? { label: "Carries to P3", text: carry } : undefined}
      onBack={
        host.chrome.stepIndex > 0
          ? () =>
              window.location.assign(
                host.chrome.steps[host.chrome.stepIndex - 1]?.href ??
                  phaseHref(host.move.id),
              )
          : undefined
      }
      onContinue={() =>
        window.location.assign(
          host.chrome.steps[host.chrome.stepIndex + 1]?.href ??
            phaseHref(host.move.id),
        )
      }
    />
  );
  return host.dock(page, {
    briefing: `I read the saved ${title.toLowerCase()} and the current governed gate readback. I can help you organize notes, but I do not approve evidence, attest baselines, or confirm the solution route. Drafts stay drafts until you accept them. I don't write figures.`,
    actions: [],
    notesPanel,
  });
}

function EvidencePlan({ host }: { host: StepPageHostProps }) {
  const source = host.p2Evidence;
  const packets = (source?.packets ?? []).filter(
    (packet) => packet.phase === 2,
  );
  const [chosenFamily, setChosenFamily] = useState(
    packets.find(
      (packet) => packet.priority === "required" && packet.status !== "covered",
    )?.familyId ??
      packets[0]?.familyId ??
      "",
  );
  const uploadFamily = packets.some(
    (packet) => packet.familyId === chosenFamily,
  )
    ? chosenFamily
    : (packets[0]?.familyId ?? "");
  const [owners, setOwners] = useState<Record<string, string>>({});
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const evidence = useStepEvidence({
    moveId: host.move.id,
    phase: 2,
    canReview: host.canApproveGates,
    onEvidenceChanged: () => window.location.reload(),
    uploadLabel: "Upload evidence",
    uploadEvidenceFamily: uploadFamily || undefined,
  });
  const record = parseCaptureTextStepRecord(
    host.values.p2_evidence_plan_step ?? "",
  );
  const rows: StepPageRow[] = [
    ...evidence.rows,
    ...packets.map((packet, index): StepPageRow => {
      const required = packet.priority === "required";
      const covered = packet.status === "covered";
      const acknowledged = record.entries[packet.familyId]?.text ?? "";
      const draft = owners[packet.familyId] ?? acknowledged;
      const pending = evidence.pending.filter(
        (item) => item.familyKey === packet.familyId,
      );
      return {
        id: `need-${packet.familyId}`,
        rank: index + 1,
        eyebrow: required ? "Required evidence" : "Optional evidence",
        shortName: packet.evidenceSlot,
        subject: packet.evidenceSlot,
        state: covered ? "settled" : required ? "decision" : "advisory",
        clause: required ? `review ${packet.evidenceSlot.toLowerCase()}` : null,
        facts: [
          {
            kind: "team",
            text: `${packet.status.replaceAll("_", " ")} · ${packet.evidenceTitles.length} linked file${packet.evidenceTitles.length === 1 ? "" : "s"} · ${pending.length} awaiting review`,
          },
        ],
        middle: (
          <div>
            <details className={cx("disc")}>
              <summary>Review need and gap owner</summary>
              <p className={cx("proposal")}>{packet.nextAction}</p>
              <p className={cx("item-note")}>
                {covered
                  ? "Approved coverage recorded by the evidence resolver."
                  : "A file only counts after governed review and approval."}
                {acknowledged
                  ? ` Gap acknowledged by ${acknowledged}. This does not approve the need.`
                  : ""}
              </p>
              {!covered && required ? (
                <>
                  <label className={cx("q-label")}>
                    Gap owner role
                    <input
                      className={cx("q-input")}
                      value={draft}
                      onChange={(event) =>
                        setOwners((before) => ({
                          ...before,
                          [packet.familyId]: event.target.value,
                        }))
                      }
                      placeholder="Data steward role"
                    />
                  </label>
                  <button
                    type="button"
                    className={cx("btn-ink")}
                    disabled={!draft.trim()}
                    onClick={() => {
                      if (looksLikePersonalName(draft)) {
                        setOwnerError(
                          "Name an owner role or function, not a person.",
                        );
                        return;
                      }
                      setOwnerError(null);
                      recordEntry(
                        host,
                        "p2_evidence_plan_step",
                        packet.familyId,
                        draft.trim(),
                      );
                    }}
                  >
                    Save owner role
                  </button>{" "}
                  <a
                    className={cx("link-btn")}
                    href={evidenceHref(host.move.id)}
                  >
                    Open Files &amp; Evidence →
                  </a>
                </>
              ) : null}
            </details>
          </div>
        ),
        actions: null,
      };
    }),
    ...gateRows(
      host,
      ["discovery_notes_ingested", "p2_readiness_cleared"],
      packets.length + 10,
    ),
  ];
  const ready = source
    ? p2EvidencePlanReady({
        packets: source.packets,
        readiness: source.readiness,
        readable: source.readable,
        criteria: host.gateProps.criteria,
      })
    : false;
  const blockedBy =
    !source?.readable || !source.readiness
      ? "Wait for the P2 evidence and gate readbacks to be available"
      : packets.filter((packet) => packet.priority === "required").length === 0
        ? "Wait for the required P2 evidence needs to be declared"
        : null;
  if (evidence.loaded && !evidence.readable) {
    rows.push({
      id: "evidence-review-unreadable",
      rank: packets.length + 8,
      eyebrow: "Evidence readback",
      shortName: "evidence review status",
      subject: "Re-read the evidence review status",
      state: "decision",
      clause: "re-read evidence review status",
      middle: <p className={cx("proposal")}>{evidence.summary}</p>,
    });
  }
  if (!ready && source?.readiness?.hardGaps.length) {
    rows.push({
      id: "p2-readiness-gaps",
      rank: packets.length + 9,
      eyebrow: "Current-state readiness",
      shortName: "current-state hard gaps",
      subject: "Current-state hard gaps",
      state: "decision",
      clause: "resolve current-state hard gaps",
      middle: (
        <p className={cx("proposal")}>
          {source.readiness.hardGaps.join(" · ")}
        </p>
      ),
      actions: (
        <a className={cx("link-btn")} href={evidenceHref(host.move.id)}>
          Open Files &amp; Evidence →
        </a>
      ),
    });
  }
  return (
    <P2Page
      host={host}
      title="Plan the evidence"
      intro="Review each required discovery need and its governed approval status. An acknowledged gap remains a gap."
      rows={rows}
      checkIds={["discovery_notes_ingested", "p2_readiness_cleared"]}
      blockedBy={blockedBy}
      context={[
        "Full depth",
        `${packets.filter((packet) => packet.priority === "required" && packet.status === "covered").length} of ${packets.filter((packet) => packet.priority === "required").length} required needs approved`,
        evidence.summary,
      ]}
      contextAction={
        uploadFamily ? (
          <span>
            <label className={cx("q-label")}>
              Upload for need
              <select
                className={cx("q-input")}
                aria-label="Evidence need for upload"
                value={uploadFamily}
                onChange={(event) => setChosenFamily(event.target.value)}
              >
                {packets.map((packet) => (
                  <option key={packet.familyId} value={packet.familyId}>
                    {packet.evidenceSlot}
                  </option>
                ))}
              </select>
            </label>{" "}
            {evidence.uploadControl}
          </span>
        ) : null
      }
      notesPanel={ownerError ? <p role="alert">{ownerError}</p> : null}
      carry="Approved discovery evidence and explicitly owned open gaps."
    />
  );
}

function Baseline({ host }: { host: StepPageHostProps }) {
  const source = host.p2Evidence;
  const [findings, setFindings] = useState(
    host.values.current_state_findings ?? "",
  );
  const [baseline, setBaseline] = useState(host.values.baseline_metrics ?? "");
  const [editFindings, setEditFindings] = useState(false);
  const [editBaseline, setEditBaseline] = useState(false);
  const evidence = useStepEvidence({
    moveId: host.move.id,
    phase: 2,
    canReview: host.canApproveGates,
    onEvidenceChanged: () => window.location.reload(),
    uploadLabel: "Add session output",
  });
  const savedFindings = host.values.current_state_findings ?? "";
  const savedBaseline = host.values.baseline_metrics ?? "";
  const citationReasons = uncitedP2BaselineReasons({
    findings: findings,
    baseline,
    registerIds: source?.registerIds ?? null,
    approvedEvidenceIds: (source?.approvedReferences ?? []).map(
      (reference) => reference.evidenceId,
    ),
  });
  const savedCitationReasons = uncitedP2BaselineReasons({
    findings: savedFindings,
    baseline: savedBaseline,
    registerIds: source?.registerIds ?? null,
    approvedEvidenceIds: (source?.approvedReferences ?? []).map(
      (reference) => reference.evidenceId,
    ),
  });
  const evidenceReferences = numberedP2EvidenceReferences(
    source?.approvedReferences ?? [],
  );
  const confirmedRegisterRows = (source?.registerRows ?? []).filter(
    (row) => row.status === "confirmed" || row.status === "corrected",
  );
  const rows: StepPageRow[] = [
    ...evidence.rows,
    {
      id: "current-state-findings",
      rank: 1,
      eyebrow: "Team capture answer",
      shortName: "current-state findings",
      subject: "Current-state findings",
      state:
        savedFindings.trim() &&
        !editFindings &&
        !(host.captureSaved?.current_state_findings === false) &&
        !(host.sectionReady?.current_state_findings === false) &&
        !savedCitationReasons.some((reason) => reason.startsWith("Finding"))
          ? "settled"
          : "decision",
      clause: "record evidence-cited current-state findings",
      middle:
        editFindings || !savedFindings ? (
          <label className={cx("q-label")}>
            Team findings
            <textarea
              className={cx("q-input")}
              rows={5}
              value={findings}
              onChange={(event) => setFindings(event.target.value)}
              placeholder="State the team's observed finding and cite figures [E:n] or [A:ID]."
            />
          </label>
        ) : (
          <p className={cx("proposal")}>{savedFindings}</p>
        ),
      actions:
        editFindings || !savedFindings ? (
          <>
            <button
              type="button"
              className={cx("btn-ink")}
              disabled={
                !findings.trim() ||
                citationReasons.some((reason) => reason.startsWith("Finding"))
              }
              onClick={() => {
                host.setValue("current_state_findings", findings.trim());
                recordEntry(
                  host,
                  "p2_baseline_step",
                  "current_state_findings",
                  findings.trim(),
                );
                setEditFindings(false);
              }}
            >
              Save
            </button>
            {savedFindings ? (
              <button
                type="button"
                className={cx("link-btn")}
                onClick={() => {
                  setFindings(savedFindings);
                  setEditFindings(false);
                }}
              >
                Cancel
              </button>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => setEditFindings(true)}
          >
            Edit
          </button>
        ),
    },
    {
      id: "baseline-metrics",
      rank: 2,
      eyebrow: "FACT or ESTIMATE",
      shortName: "baseline metrics",
      subject: "Baseline metrics",
      state:
        savedBaseline.trim() &&
        !editBaseline &&
        !(host.captureSaved?.baseline_metrics === false) &&
        !(host.sectionReady?.baseline_metrics === false) &&
        !savedCitationReasons.some((reason) => reason.startsWith("Baseline"))
          ? "settled"
          : "decision",
      clause: "record cited baseline metrics",
      facts: [
        {
          kind: "team",
          text: "FACT cites approved evidence [E:n]; ESTIMATE cites a Move register row [A:ID].",
        },
      ],
      middle:
        editBaseline || !savedBaseline ? (
          <DiagnosisFactsEditor
            value={baseline}
            onChange={setBaseline}
            label="P2 baseline metrics"
          />
        ) : (
          <div>
            {parseDiagnosisFacts(savedBaseline).map((fact, index) => (
              <p key={index} className={cx("proposal")}>
                <strong>{fact.metric}:</strong> {fact.value} · {fact.source}
              </p>
            ))}
          </div>
        ),
      wide: true,
      actions:
        editBaseline || !savedBaseline ? (
          <>
            <button
              type="button"
              className={cx("btn-ink")}
              disabled={
                !baseline.trim() ||
                citationReasons.some((reason) => reason.startsWith("Baseline"))
              }
              onClick={() => {
                host.setValue("baseline_metrics", baseline);
                recordEntry(
                  host,
                  "p2_baseline_step",
                  "baseline_metrics",
                  baselineTeamWords(baseline),
                );
                setEditBaseline(false);
              }}
            >
              Save baselines
            </button>
            {savedBaseline ? (
              <button
                type="button"
                className={cx("link-btn")}
                onClick={() => {
                  setBaseline(savedBaseline);
                  setEditBaseline(false);
                }}
              >
                Cancel
              </button>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => setEditBaseline(true)}
          >
            Edit
          </button>
        ),
    },
    {
      id: "baseline-reference-list",
      rank: 3,
      eyebrow: "Source references",
      shortName: "baseline references",
      subject: "Approved evidence and confirmed register rows",
      state:
        evidenceReferences.length > 0 || confirmedRegisterRows.length > 0
          ? "settled"
          : "advisory",
      wide: true,
      middle: (
        <div>
          {evidenceReferences.length ? (
            evidenceReferences.map((reference) => (
              <p key={reference.evidenceId} className={cx("proposal")}>
                <strong>{reference.citation}</strong> {reference.title}
                <SourceLine
                  source={{
                    kind: "fact",
                    text: "Approved evidence",
                    cite: reference.evidenceId,
                  }}
                />
              </p>
            ))
          ) : (
            <p className={cx("item-note")}>
              No approved P2 evidence references are available.
            </p>
          )}
          {confirmedRegisterRows.length ? (
            confirmedRegisterRows.map((row) => (
              <p key={row.id} className={cx("proposal")}>
                <strong>
                  [A:{row.registerId}] {row.statement}
                </strong>
                <SourceLine
                  source={{
                    kind: "est",
                    text: row.figuresRedacted
                      ? "Figure withheld"
                      : (effectiveFigure(row) ?? "No confirmed figure"),
                    cite: row.source,
                  }}
                />
              </p>
            ))
          ) : source?.registerRows === null ? (
            <p className={cx("item-note")}>
              The register could not be read. No register baseline is claimed.
            </p>
          ) : (
            <p className={cx("item-note")}>
              No confirmed register rows are available as proposed baselines.
            </p>
          )}
          <a
            className={cx("link-btn")}
            href={`${phaseHref(host.move.id)}?workspace=intelligence`}
          >
            Open Assumptions register →
          </a>
        </div>
      ),
    },
    ...gateRows(
      host,
      ["discovery_baseline_attested", "discovery_stakeholders_named"],
      10,
    ),
  ];
  if (citationReasons.length)
    rows.push({
      id: "citation-hold",
      rank: 9,
      eyebrow: "Citation hold",
      shortName: "baseline source citations",
      subject: "Resolve figure citations",
      state: "decision",
      clause: "cite each baseline figure",
      middle: (
        <div>
          {citationReasons.map((reason) => (
            <p key={reason} className={cx("item-note")}>
              {reason}
            </p>
          ))}
        </div>
      ),
      actions: (
        <a
          className={cx("link-btn")}
          href={`${phaseHref(host.move.id)}?workspace=intelligence`}
        >
          Open Assumptions register →
        </a>
      ),
    });
  if (evidence.loaded && !evidence.readable) {
    rows.push({
      id: "evidence-review-unreadable",
      rank: 8,
      eyebrow: "Evidence readback",
      shortName: "evidence review status",
      subject: "Re-read the evidence review status",
      state: "decision",
      clause: "re-read evidence review status",
      middle: <p className={cx("proposal")}>{evidence.summary}</p>,
    });
  }
  return (
    <P2Page
      host={host}
      title="Establish the baseline"
      intro="Record the team's current state and cite every figure. The gate evaluator, not this form, decides attestation."
      rows={rows}
      checkIds={["discovery_baseline_attested", "discovery_stakeholders_named"]}
      context={[
        "Full depth",
        evidence.summary,
        `${source?.approvedReferences.length ?? 0} approved evidence references`,
      ]}
      contextAction={evidence.uploadControl}
      carry="Evidence-cited current-state findings and baseline metrics; attestation remains governed."
    />
  );
}

function Validate({ host }: { host: StepPageHostProps }) {
  const source = host.p2Evidence;
  const evidence = useStepEvidence({
    moveId: host.move.id,
    phase: 2,
    canReview: host.canApproveGates,
    onEvidenceChanged: () => window.location.reload(),
    uploadLabel: "Add session output",
  });
  const route = source?.confirmedRoute;
  const routeMet =
    p2CheckState(host.gateProps.criteria, "solution_route_validated") === "met";
  const routeReadbackInconsistent = routeMet && !route;
  const rows: StepPageRow[] = [
    ...evidence.rows,
    {
      id: "solution-route-validation",
      rank: 1,
      eyebrow: "Structured route assessment",
      shortName: "solution route",
      subject: "Confirm or correct the solution route",
      state:
        route &&
        routeMet &&
        host.sectionReady?.solution_route_validation !== false
          ? "settled"
          : "decision",
      clause: "confirm the evidence-backed route",
      middle: (
        <div>
          {source?.routeEditor}
          <p className={cx("item-note")}>
            {route
              ? `Current confirmed route: ${SOLUTION_ROUTE_LABELS[route.route]}. Confirmed by ${route.validatedBy}. Confirmation time is not recorded in this assessment.`
              : "No governed route is confirmed yet."}
          </p>
        </div>
      ),
      wide: true,
    },
    ...gateRows(host, ["solution_route_validated"], 10).map((row) =>
      routeReadbackInconsistent
        ? {
            ...row,
            state: "decision" as const,
            clause: "reconcile the confirmed route readback",
            middle: (
              <p className={cx("proposal")}>
                The gate evaluator reports this check met, but the confirmed
                route could not be read. This step stays open until both
                readbacks agree.
              </p>
            ),
            actions: (
              <a
                className={cx("link-btn")}
                href={`${phaseHref(host.move.id)}?step=p2-gate`}
              >
                Open Gate readiness →
              </a>
            ),
          }
        : row,
    ),
  ];
  if (evidence.loaded && !evidence.readable) {
    rows.push({
      id: "evidence-review-unreadable",
      rank: 8,
      eyebrow: "Evidence readback",
      shortName: "evidence review status",
      subject: "Re-read the evidence review status",
      state: "decision",
      clause: "re-read evidence review status",
      middle: <p className={cx("proposal")}>{evidence.summary}</p>,
    });
  }
  return (
    <P2Page
      host={host}
      title="Validate the solution route"
      intro="Use the existing structured assessment to confirm or correct the route against approved evidence. This decides P3 depth."
      rows={rows}
      checkIds={["solution_route_validated"]}
      routeReadbackInconsistent={routeReadbackInconsistent}
      context={[
        "Full depth",
        evidence.summary,
        route
          ? `${SOLUTION_ROUTE_LABELS[route.route]} · confirmed by ${route.validatedBy}`
          : "Route not confirmed",
      ]}
      contextAction={evidence.uploadControl}
      carry="The confirmed route and its approved evidence reference set P3 depth."
    />
  );
}

export const P2_STEP_PAGES: PhaseStepPageMap = {
  "p2-evidence-plan": (host) => <EvidencePlan host={host} />,
  "p2-baseline": (host) => <Baseline host={host} />,
  "p2-validate": (host) => <Validate host={host} />,
};

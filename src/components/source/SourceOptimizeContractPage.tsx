"use client";

import React, { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { ANALYTICS } from "@/components/source/canvas/analytics/analytics-tokens";
import type {
  ContractOptimizationCandidate,
  ContractOptimizationSourceConnection,
  ContractOptimizationSourcingRequirement,
  ContractOptimizationSpine,
} from "@/lib/source/data-model/contract-optimization-spine";
import type { ContractOptimizationEvidencePack } from "@/lib/source/data-model/contract-optimization-evidence";
import {
  buildContractOptimizationEvidenceReadiness,
  type ContractOptimizationEvidenceReadiness,
  type ContractOptimizationEvidenceReadinessRow,
} from "@/lib/source/data-model/contract-optimization-evidence-readiness";
import type {
  ContractOptimizationOpportunity,
  ContractOptimizationOpportunitySet,
} from "@/lib/source/data-model/contract-optimization-opportunity";
import {
  summarizeOpportunityTraceability,
  type OpportunityTraceabilitySummary,
} from "@/lib/source/data-model/contract-optimization-traceability";
import {
  deriveOptimizeWorkflowPosition,
  type OptimizeWorkflowPosition,
  type OptimizeWorkflowStep,
} from "@/lib/source/data-model/contract-optimization-workflow-step";
import { buildSourceOptimizeContractHref } from "@/lib/source/optimize-routing";

interface SourceOptimizeContractPageProps {
  tenantName: string;
  asOfDateIso: string;
  spine: ContractOptimizationSpine;
  opportunitySet: ContractOptimizationOpportunitySet | null;
  evidencePack?: ContractOptimizationEvidencePack | null;
}

export function SourceOptimizeContractPage({
  tenantName,
  asOfDateIso,
  spine,
  opportunitySet,
  evidencePack = null,
}: SourceOptimizeContractPageProps) {
  const selected = spine.selected;
  const readiness = useMemo(
    () => buildContractOptimizationEvidenceReadiness({ evidencePack }),
    [evidencePack],
  );
  const selectedOpportunity = useMemo(() => {
    if (!opportunitySet) return null;
    const id = opportunitySet.selectedOpportunityId;
    return (
      opportunitySet.opportunities.find(
        (opportunity) => opportunity.opportunityId === id,
      ) ??
      opportunitySet.opportunities[0] ??
      null
    );
  }, [opportunitySet]);
  const traceability = useMemo(
    () => summarizeOpportunityTraceability(opportunitySet?.opportunities ?? []),
    [opportunitySet],
  );
  const position = useMemo(
    () =>
      deriveOptimizeWorkflowPosition({
        hasSelectedContract: Boolean(selected),
        opportunitySet,
        readiness,
        traceability,
      }),
    [selected, opportunitySet, readiness, traceability],
  );

  return (
    <AppShell
      surface="source"
      agentName="Ava"
      surfaceContext={{
        sourceOptimizeContractMode: true,
        contractId: selected?.contractId,
      }}
      topBarProps={{
        tenantName,
        showLocked: true,
        context: "Source · Optimize Contract",
      }}
      subNav={<SourceSubNav />}
    >
      <main data-testid="source-optimize-contract" style={MAIN_STYLE}>
        <div style={CONTAINER_STYLE}>
          <ModuleHeader
            asOfDateIso={asOfDateIso}
            selected={selected}
            selectedOpportunity={selectedOpportunity}
          />
          <StageRail steps={position.steps} />
          <NextDecisionBar position={position} />
          {selected ? (
            <SelectedContractView
              candidate={selected}
              spine={spine}
              opportunitySet={opportunitySet}
              selectedOpportunity={selectedOpportunity}
              readiness={readiness}
              traceability={traceability}
              position={position}
            />
          ) : (
            <ContractPicker candidates={spine.topCandidates} />
          )}
        </div>
      </main>
    </AppShell>
  );
}

function ModuleHeader({
  asOfDateIso,
  selected,
  selectedOpportunity,
}: {
  asOfDateIso: string;
  selected: ContractOptimizationCandidate | null;
  selectedOpportunity: ContractOptimizationOpportunity | null;
}) {
  return (
    <header style={HEADER_STYLE}>
      <div style={{ minWidth: 0, display: "grid", gap: 5 }}>
        <div style={EYEBROW_STYLE}>Source · Optimize Contract</div>
        <h1 style={H1_STYLE}>
          {selected
            ? `${selected.vendorName} contract optimization`
            : "Optimize an existing contract"}
        </h1>
        <p style={SUBLINE_STYLE}>
          {selected
            ? `${selected.contractName} · ${formatUsd(selected.annualValue)} annual value · focused 7-step incumbent-contract path.`
            : "Select one governed contract first. This is the focused incumbent-contract path, not the 11-stage sourcing event intake."}
        </p>
        <div style={META_ROW_STYLE}>
          <span>As of {formatDate(asOfDateIso)}</span>
          <span>
            No realized value is claimed until Finance/Tower confirms it.
          </span>
          {selectedOpportunity ? (
            <span>Selected opportunity: {selectedOpportunity.shortLabel}</span>
          ) : null}
        </div>
      </div>
      <div style={HEADER_ACTIONS_STYLE}>
        <Link href="/source/preview/workspace" style={GHOST_BUTTON_STYLE}>
          Source workspace
        </Link>
        <Link href="/source/new" style={GHOST_BUTTON_STYLE}>
          New 11-stage event
        </Link>
      </div>
    </header>
  );
}

function StageRail({ steps }: { steps: readonly OptimizeWorkflowStep[] }) {
  return (
    <nav aria-label="Optimize contract stages" style={STAGE_RAIL_STYLE}>
      {steps.map((step) => (
        <div
          key={step.key}
          data-testid={`optimize-step-${step.key}`}
          data-state={step.state}
          aria-current={
            step.state === "current" || step.state === "blocked"
              ? "step"
              : undefined
          }
          style={{
            ...STAGE_CHIP_STYLE,
            ...(step.state === "current" || step.state === "blocked"
              ? STAGE_CHIP_ACTIVE_STYLE
              : null),
            ...(step.state === "future" ? STAGE_CHIP_FUTURE_STYLE : null),
          }}
        >
          <span style={STAGE_NUMBER_STYLE}>
            {step.state === "complete"
              ? "✓"
              : String(step.index).padStart(2, "0")}
          </span>
          {step.label}
        </div>
      ))}
    </nav>
  );
}

function NextDecisionBar({
  position,
}: {
  position: OptimizeWorkflowPosition;
}) {
  return (
    <section style={NEXT_BAR_STYLE} data-testid="optimize-next-decision">
      <div style={{ minWidth: 0, display: "grid", gap: 3 }}>
        <div style={MUTED_SMALL_STYLE}>
          Step {position.currentIndex} of {position.steps.length} ·{" "}
          {position.currentLabel}
        </div>
        <strong style={NEXT_ACTION_STYLE}>{position.primaryAction}</strong>
        <p style={DECISION_DETAIL_STYLE}>{position.primaryActionDetail}</p>
      </div>
      {position.blocker ? (
        <div style={BLOCKER_STYLE} data-testid="optimize-next-blocker">
          <div style={MUTED_SMALL_STYLE}>Blocked by</div>
          {position.blocker}
        </div>
      ) : null}
    </section>
  );
}

function ContractPicker({
  candidates,
}: {
  candidates: readonly ContractOptimizationCandidate[];
}) {
  return (
    <section data-testid="optimize-contract-picker" style={PANEL_STYLE}>
      <div style={PANEL_HEAD_STYLE}>
        <div>
          <h2 style={SECTION_TITLE_STYLE}>Select a contract to optimize</h2>
          <p style={PANEL_COPY_STYLE}>
            Optimize Contract cannot start from a blank brief. Pick a governed
            contract so Source can bring the contract baseline, evidence
            readiness, opportunity rows, and value-proof path into one case.
          </p>
        </div>
      </div>
      {candidates.length === 0 ? (
        <div style={EMPTY_STYLE}>
          No governed contract candidates are available for this tenant.
        </div>
      ) : (
        <div style={TABLE_WRAP_STYLE}>
          <table style={TABLE_STYLE}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Rank</th>
                <th style={TH_STYLE}>Contract</th>
                <th style={TH_STYLE}>Annual value</th>
                <th style={TH_STYLE}>Fit</th>
                <th style={TH_STYLE}>Why it is surfaced</th>
                <th style={TH_STYLE}>Action</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.contractId}>
                  <td style={TD_STYLE}>#{candidate.rank}</td>
                  <td style={TD_STYLE}>
                    <strong>{candidate.vendorName}</strong>
                    <div style={MUTED_SMALL_STYLE}>
                      {candidate.contractName}
                    </div>
                  </td>
                  <td style={TD_STYLE}>{formatUsd(candidate.annualValue)}</td>
                  <td style={TD_STYLE}>
                    <strong>{candidate.score}/100</strong>
                    <div style={MUTED_SMALL_STYLE}>{candidate.band}</div>
                  </td>
                  <td style={TD_STYLE}>
                    {candidate.reasons[0]?.detail ??
                      "Governed optimization signals are still being assembled."}
                  </td>
                  <td style={TD_STYLE}>
                    <Link
                      href={buildSourceOptimizeContractHref({
                        contractId: candidate.contractId,
                      })}
                      style={ROW_BUTTON_STYLE}
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SelectedContractView({
  candidate,
  spine,
  opportunitySet,
  selectedOpportunity,
  readiness,
  traceability,
  position,
}: {
  candidate: ContractOptimizationCandidate;
  spine: ContractOptimizationSpine;
  opportunitySet: ContractOptimizationOpportunitySet | null;
  selectedOpportunity: ContractOptimizationOpportunity | null;
  readiness: ContractOptimizationEvidenceReadiness;
  traceability: OpportunityTraceabilitySummary;
  position: OptimizeWorkflowPosition;
}) {
  const missingCount =
    spine.missingEvidenceSources.length +
    (opportunitySet?.evidenceRequirements.length ?? 0);
  const opportunityCount = opportunitySet?.opportunities.length ?? 0;
  const workflowBlocked =
    !readiness.sizingBlocked &&
    Boolean(position.blocker) &&
    (position.currentKey === "plan" || position.currentKey === "approve");
  const valueProofGapLabel =
    workflowBlocked
      ? "Workflow gaps"
      : position.readyForApproval && !readiness.sizingBlocked
        ? "Value proof gaps"
        : "Open evidence gaps";
  const valueProofGapDetail =
    workflowBlocked
      ? "Evidence may be ready, but approval/outcome workflow state is not complete."
      : missingCount > 0
        ? position.readyForApproval && !readiness.sizingBlocked
          ? "Approval can proceed; these limit external value claims until accepted."
          : "These block sizing or external value claims."
        : position.readyForApproval && !readiness.sizingBlocked
          ? "No unresolved value-proof rows for the current decision."
          : "No missing rows in the current evidence spine.";
  const primaryAction =
    !opportunitySet || opportunitySet.baseline.status !== "ready"
      ? "Build or resolve the commercial baseline before approving action."
      : readiness.sizingBlocked
        ? "Collect the missing required evidence families before using a value number externally."
        : workflowBlocked
          ? position.primaryActionDetail
        : missingCount > 0
          ? position.readyForApproval
            ? "Approval can proceed; unresolved proof rows still constrain external value claims."
            : "Collect the missing value-proof rows before using a value number externally."
          : "Open the optimization case and move the evidenced opportunity through approval.";
  return (
    <div style={SELECTED_GRID_STYLE}>
      <section style={PANEL_STYLE}>
        <div style={PANEL_HEAD_STYLE}>
          <div>
            <h2 style={SECTION_TITLE_STYLE}>Optimization decision brief</h2>
            <p style={PANEL_COPY_STYLE}>
              #{candidate.rank} · {candidate.band}. {primaryAction}
            </p>
          </div>
          <div style={SCORE_BADGE_STYLE}>
            <strong>{candidate.score}</strong>
            <span>fit score</span>
          </div>
        </div>
        <div style={DECISION_STRIP_STYLE}>
          <DecisionCell
            label="Contract exposure"
            value={formatUsd(candidate.annualValue)}
            detail="Annual value from governed contract register."
          />
          <DecisionCell
            label="Opportunity rows"
            value={String(opportunityCount)}
            detail={
              opportunityCount > 0
                ? "Loaded evidence rows are available for diagnosis."
                : "No opportunity rows are loaded yet."
            }
          />
          <DecisionCell
            label={valueProofGapLabel}
            value={String(missingCount)}
            detail={valueProofGapDetail}
          />
        </div>
        <div style={REASON_GRID_STYLE}>
          {candidate.reasons.slice(0, 4).map((reason) => (
            <div key={`${reason.kind}-${reason.label}`} style={REASON_STYLE}>
              <div style={REASON_LABEL_STYLE}>{reason.label}</div>
              <p style={REASON_COPY_STYLE}>{reason.detail}</p>
              <div style={MUTED_SMALL_STYLE}>{reason.sourceRef}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={PANEL_STYLE}>
        <div style={PANEL_HEAD_STYLE}>
          <div>
            <h2 style={SECTION_TITLE_STYLE}>
              Baseline and opportunity evidence
            </h2>
            <p style={PANEL_COPY_STYLE}>
              The case starts from commercial baseline and evidence rows.
              Missing inputs stay pending; they are never displayed as zero.
            </p>
          </div>
          <StartOptimizationButton
            contractId={candidate.contractId}
            opportunityId={selectedOpportunity?.opportunityId ?? null}
          />
        </div>
        <BaselineRead opportunitySet={opportunitySet} />
        <WorkflowActionPanel
          contractId={candidate.contractId}
          opportunitySet={opportunitySet}
          selectedOpportunity={selectedOpportunity}
          position={position}
        />
        <OpportunityTable
          opportunities={opportunitySet?.opportunities ?? []}
          selectedOpportunityId={selectedOpportunity?.opportunityId ?? null}
          traceability={traceability}
        />
      </section>

      <section style={PANEL_STYLE} data-testid="optimize-evidence-readiness">
        <div style={PANEL_HEAD_STYLE}>
          <div>
            <h2 style={SECTION_TITLE_STYLE}>Evidence readiness</h2>
            <p style={PANEL_COPY_STYLE}>{readiness.summary}</p>
          </div>
          <ReadinessBadge readiness={readiness} />
        </div>
        <EvidenceReadinessTable rows={readiness.rows} />
        <OpportunityAsks
          requirements={spine.missingEvidenceSources}
          opportunitySet={opportunitySet}
        />
      </section>

      <section style={PANEL_STYLE}>
        <h2 style={SECTION_TITLE_STYLE}>Where the data comes from</h2>
        <SourceConnectionTable connections={spine.sourceConnections} />
      </section>
    </div>
  );
}

function DecisionCell({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div style={DECISION_CELL_STYLE}>
      <div style={MUTED_SMALL_STYLE}>{label}</div>
      <strong style={DECISION_VALUE_STYLE}>{value}</strong>
      <p style={DECISION_DETAIL_STYLE}>{detail}</p>
    </div>
  );
}

function StartOptimizationButton({
  contractId,
  opportunityId,
}: {
  contractId: string;
  opportunityId: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function start() {
    setState("busy");
    setMessage(null);
    try {
      const response = await fetch(
        `/api/source/workspace/contract/${encodeURIComponent(contractId)}/optimization`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ opportunityId }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        approvalUrl?: string;
        error?: string;
        detail?: string;
      } | null;
      if (!response.ok || !payload?.ok || !payload.approvalUrl) {
        throw new Error(
          payload?.detail ??
            payload?.error ??
            "Could not open optimization case.",
        );
      }
      router.push(payload.approvalUrl);
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not open optimization case.",
      );
    }
  }

  return (
    <div style={START_WRAP_STYLE}>
      <button
        type="button"
        onClick={start}
        disabled={state === "busy"}
        style={PRIMARY_BUTTON_STYLE}
        data-testid="start-optimize-contract"
      >
        {state === "busy" ? "Opening..." : "Open optimize case"}
      </button>
      {message ? <div style={ERROR_STYLE}>{message}</div> : null}
    </div>
  );
}

function WorkflowActionPanel({
  contractId,
  opportunitySet,
  selectedOpportunity,
  position,
}: {
  contractId: string;
  opportunitySet: ContractOptimizationOpportunitySet | null;
  selectedOpportunity: ContractOptimizationOpportunity | null;
  position: OptimizeWorkflowPosition;
}) {
  const router = useRouter();
  const [state, setState] = useState<
    "idle" | "busy" | "error" | "success"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");

  if (!opportunitySet || !selectedOpportunity) return null;

  const requests = opportunitySet.approvalRequests ?? [];
  const pendingRequest = requests.find(
    (request) => request.approvalState === "pending",
  );
  const sentBackRequest = requests.find(
    (request) => request.approvalState === "sent_back",
  );
  const approvedRequest = requests.find(
    (request) =>
      request.approvalState === "approved" ||
      request.decisions.some((decision) => decision.decision === "approved"),
  );
  const hasAgreedOutcome = (opportunitySet.negotiatedOutcomes ?? []).some(
    (outcome) => outcome.outcomeState === "agreed",
  );

  const canCreate =
    position.currentKey === "plan" &&
    !pendingRequest &&
    !approvedRequest &&
    !hasAgreedOutcome;
  const canDecide = position.currentKey === "approve" && Boolean(pendingRequest);
  const canRecordOutcome =
    position.currentKey === "approve" &&
    Boolean(approvedRequest) &&
    !hasAgreedOutcome;
  const showPanel =
    canCreate || canDecide || canRecordOutcome || Boolean(sentBackRequest);
  if (!showPanel) return null;

  async function submit(action: string) {
    setState("busy");
    setMessage(null);
    try {
      const response = await fetch(
        `/api/source/optimize/contract/${encodeURIComponent(contractId)}/workflow`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action,
            opportunityId: selectedOpportunity?.opportunityId ?? null,
            rationale: rationale.trim() || null,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        error?: string;
        detail?: string;
      } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.detail ??
            payload?.error ??
            "Could not update optimization workflow.",
        );
      }
      setState("success");
      setMessage(payload.message ?? "Optimization workflow updated.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update optimization workflow.",
      );
    }
  }

  return (
    <div style={WORKFLOW_ACTION_PANEL_STYLE} data-testid="workflow-action-panel">
      <div style={{ minWidth: 0 }}>
        <div style={MUTED_SMALL_STYLE}>Governed workflow action</div>
        <strong style={WORKFLOW_ACTION_TITLE_STYLE}>
          {canCreate
            ? "Create the strategy approval request"
            : canDecide
              ? "Approve or send back the strategy request"
              : canRecordOutcome
                ? "Record the negotiated outcome"
                : "Approval request needs revision"}
        </strong>
        <p style={DECISION_DETAIL_STYLE}>
          {canCreate
            ? "This writes a governed approval_request row. It does not contact the vendor or claim realized value."
            : canDecide
              ? "A named approver must record the decision before outreach or commercial commitment."
              : canRecordOutcome
                ? "This records agreement state only. Finance/Tower still controls realized value."
                : "The prior request was sent back; revise the target position, then resubmit."}
        </p>
      </div>
      {canDecide ? (
        <textarea
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
          placeholder="Decision rationale for the audit trail..."
          style={WORKFLOW_TEXTAREA_STYLE}
          aria-label="Approval rationale"
        />
      ) : null}
      <div style={WORKFLOW_ACTIONS_STYLE}>
        {canCreate || sentBackRequest ? (
          <button
            type="button"
            disabled={state === "busy"}
            onClick={() => submit("create_approval_request")}
            style={PRIMARY_BUTTON_STYLE}
            data-testid="create-optimize-approval-request"
          >
            {state === "busy" ? "Writing..." : "Create request"}
          </button>
        ) : null}
        {canDecide ? (
          <>
            <button
              type="button"
              disabled={state === "busy"}
              onClick={() => submit("send_back_request")}
              style={GHOST_BUTTON_STYLE}
              data-testid="send-back-optimize-approval-request"
            >
              Send back
            </button>
            <button
              type="button"
              disabled={state === "busy"}
              onClick={() => submit("approve_request")}
              style={PRIMARY_BUTTON_STYLE}
              data-testid="approve-optimize-approval-request"
            >
              Approve
            </button>
          </>
        ) : null}
        {canRecordOutcome ? (
          <button
            type="button"
            disabled={state === "busy"}
            onClick={() => submit("record_agreed_outcome")}
            style={PRIMARY_BUTTON_STYLE}
            data-testid="record-optimize-negotiated-outcome"
          >
            Record outcome
          </button>
        ) : null}
      </div>
      {message ? (
        <div
          style={state === "error" ? ERROR_STYLE : SUCCESS_STYLE}
          data-testid="workflow-action-message"
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}

function BaselineRead({
  opportunitySet,
}: {
  opportunitySet: ContractOptimizationOpportunitySet | null;
}) {
  if (!opportunitySet) {
    return (
      <div style={BASELINE_STYLE}>
        <strong>Baseline unavailable</strong>
        <span>
          The contract can be selected, but the opportunity spine has not found
          a governed commercial baseline yet.
        </span>
      </div>
    );
  }
  const baseline = opportunitySet.baseline;
  const readinessRows = baselineReadinessRows(opportunitySet);
  return (
    <div style={BASELINE_STYLE}>
      <div style={BASELINE_HEADER_STYLE}>
        <div>
          <strong>{baseline.headline}</strong>
          <p style={BASELINE_DETAIL_STYLE}>{baseline.detail}</p>
        </div>
        <span
          style={{
            ...BASELINE_STATUS_STYLE,
            ...(baseline.status === "conflict"
              ? BASELINE_STATUS_WARNING_STYLE
              : baseline.status === "missing"
                ? BASELINE_STATUS_MISSING_STYLE
                : null),
          }}
        >
          {baseline.status === "ready"
            ? "baseline ready"
            : baseline.status === "conflict"
              ? "baseline conflict"
              : "baseline missing"}
        </span>
      </div>
      <div style={BASELINE_METRICS_STYLE}>
        <Metric
          label="Annual value"
          value={formatMaybeUsd(baseline.annualValueUsd)}
        />
        <Metric
          label="Actual spend"
          value={formatMaybeUsd(baseline.actualAnnualSpendUsd)}
        />
        <Metric
          label="Committed"
          value={formatMaybeUsd(baseline.totalCommittedValueUsd)}
        />
        <Metric
          label="Finance confirmed"
          value={formatUsd(opportunitySet.financeConfirmedUsd)}
        />
      </div>
      <div style={BASELINE_READINESS_STYLE}>
        {readinessRows.map((row) => (
          <div key={row.id} style={BASELINE_READINESS_ROW_STYLE}>
            <span
              aria-label={`${row.label} ${row.state}`}
              style={{
                ...STATE_DOT_STYLE,
                ...(row.state === "included"
                  ? STATE_DOT_READY_STYLE
                  : row.state === "conflict"
                    ? STATE_DOT_WARNING_STYLE
                    : null),
              }}
            />
            <div>
              <strong>{row.label}</strong>
              <p style={DECISION_DETAIL_STYLE}>{row.detail}</p>
            </div>
            <span style={BASELINE_ROW_STATE_STYLE}>{row.state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={METRIC_STYLE}>
      <div style={METRIC_VALUE_STYLE}>{value}</div>
      <div style={MUTED_SMALL_STYLE}>{label}</div>
    </div>
  );
}

function OpportunityTable({
  opportunities,
  selectedOpportunityId,
  traceability,
}: {
  opportunities: readonly ContractOptimizationOpportunity[];
  selectedOpportunityId: string | null;
  traceability: OpportunityTraceabilitySummary;
}) {
  if (opportunities.length === 0) {
    return (
      <div style={EMPTY_STYLE}>
        No quantified opportunity rows are loaded yet.
      </div>
    );
  }
  const traceById = new Map(
    traceability.rows.map((row) => [row.opportunityId, row]),
  );
  return (
    <div style={TABLE_WRAP_STYLE}>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            <th style={TH_STYLE}>Opportunity</th>
            <th style={TH_STYLE}>Value type</th>
            <th style={TH_STYLE}>Amount</th>
            <th style={TH_STYLE}>Evidence</th>
            <th style={TH_STYLE}>Inputs</th>
            <th style={TH_STYLE}>Next action</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.slice(0, 6).map((opportunity) => (
            <tr
              key={opportunity.opportunityId}
              style={
                opportunity.opportunityId === selectedOpportunityId
                  ? SELECTED_ROW_STYLE
                  : undefined
              }
            >
              <td style={TD_STYLE}>
                <strong>{opportunity.shortLabel}</strong>
                <div style={MUTED_SMALL_STYLE}>{opportunity.stage}</div>
              </td>
              <td style={TD_STYLE}>{labelValueType(opportunity.valueType)}</td>
              <td style={TD_STYLE}>{formatMaybeUsd(opportunity.amountUsd)}</td>
              <td style={TD_STYLE}>
                {opportunity.evidenceGrade}
                <div style={MUTED_SMALL_STYLE}>
                  {opportunity.sourceSystems.join(", ") || "No source system"}
                </div>
              </td>
              <td
                style={TD_STYLE}
                data-testid={`opportunity-trace-${opportunity.opportunityId}`}
              >
                {opportunity.calculation ? (
                  <>
                    {opportunity.calculation.includedLineCount} included
                    <div style={MUTED_SMALL_STYLE}>
                      {opportunity.calculation.pendingLineCount} pending ·{" "}
                      {opportunity.calculation.excludedLineCount} excluded
                    </div>
                  </>
                ) : null}
                <div
                  style={
                    opportunity.calculation ? MUTED_SMALL_STYLE : undefined
                  }
                >
                  {traceById.get(opportunity.opportunityId)?.label ??
                    "Traceability not evaluated"}
                </div>
              </td>
              <td style={TD_STYLE}>{opportunity.nextAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={TRACE_NOTE_STYLE} data-testid="opportunity-traceability-note">
        <strong>
          {formatUsd(traceability.tracedAmountUsd)} reproducible from a
          calculation run
          {traceability.hasUntracedAmounts
            ? ` · ${formatUsd(traceability.untracedAmountUsd)} not reproducible`
            : ""}
        </strong>
        <span style={DECISION_DETAIL_STYLE}>{traceability.summary}</span>
      </div>
    </div>
  );
}

function ReadinessBadge({
  readiness,
}: {
  readiness: ContractOptimizationEvidenceReadiness;
}) {
  return (
    <div style={SCORE_BADGE_STYLE} data-testid="optimize-evidence-readiness-badge">
      <strong>
        {readiness.requiredEvidenced}/{readiness.requiredTotal}
      </strong>
      <span>required evidenced</span>
    </div>
  );
}

function EvidenceReadinessTable({
  rows,
}: {
  rows: readonly ContractOptimizationEvidenceReadinessRow[];
}) {
  if (rows.length === 0) {
    return (
      <div style={EMPTY_STYLE}>
        No governed evidence families are defined for this optimization
        archetype.
      </div>
    );
  }
  return (
    <div style={TABLE_WRAP_STYLE}>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            <th style={TH_STYLE}>Evidence</th>
            <th style={TH_STYLE}>Obligation</th>
            <th style={TH_STYLE}>Source system / owner</th>
            <th style={TH_STYLE}>Grain / history</th>
            <th style={TH_STYLE}>Loaded / parsed</th>
            <th style={TH_STYLE}>Impact if missing</th>
            <th style={TH_STYLE}>Next action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.family} data-testid={`evidence-row-${row.family}`}>
              <td style={TD_STYLE}>
                <strong>{row.label}</strong>
                <div style={MUTED_SMALL_STYLE}>{row.templateFileName}</div>
              </td>
              <td style={TD_STYLE}>
                <span
                  style={{
                    ...OBLIGATION_STYLE,
                    ...(row.obligation === "required"
                      ? OBLIGATION_REQUIRED_STYLE
                      : null),
                  }}
                >
                  {row.obligation}
                </span>
                <div style={MUTED_SMALL_STYLE}>
                  {labelEvidenceClass(row.evidenceClass)}
                </div>
              </td>
              <td style={TD_STYLE}>
                {row.sourceSystems.join(", ")}
                <div style={MUTED_SMALL_STYLE}>{row.ownerRole}</div>
              </td>
              <td style={TD_STYLE}>{row.grainHistory}</td>
              <td style={TD_STYLE}>
                <span
                  aria-label={`${row.label} ${row.loadState}`}
                  style={{
                    ...INLINE_DOT_STYLE,
                    ...(row.loadState === "not_loaded"
                      ? null
                      : row.parserState === "needs_review"
                        ? STATE_DOT_WARNING_STYLE
                        : STATE_DOT_READY_STYLE),
                  }}
                />
                {labelLoadState(row.loadState)}
                <div style={MUTED_SMALL_STYLE}>
                  {labelParserState(row.parserState)} ·{" "}
                  {row.factObjectCount === 0
                    ? "no fact objects yet"
                    : `${row.factObjectCount} fact object${row.factObjectCount === 1 ? "" : "s"}`}
                </div>
              </td>
              <td style={TD_STYLE}>
                {row.blocks}
                <div style={MUTED_SMALL_STYLE}>{row.artifactImpact}</div>
              </td>
              <td style={TD_STYLE}>{row.nextAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OpportunityAsks({
  requirements,
  opportunitySet,
}: {
  requirements: readonly ContractOptimizationSourcingRequirement[];
  opportunitySet: ContractOptimizationOpportunitySet | null;
}) {
  const rows = [
    ...requirements.map(requirementRowFromSourcingRequirement),
    ...(opportunitySet?.evidenceRequirements.map(
      requirementRowFromOpportunityRequirement,
    ) ?? []),
  ];
  if (rows.length === 0) return null;
  return (
    <div style={ASKS_STYLE} data-testid="optimize-opportunity-asks">
      <div style={MUTED_SMALL_STYLE}>
        Opportunity-specific asks on top of the evidence families above
      </div>
      {rows.map((row) => (
        <div key={row.id} style={ASK_ROW_STYLE}>
          <div>
            <strong>{row.label}</strong>
            <div style={MUTED_SMALL_STYLE}>{row.requirementType}</div>
          </div>
          <div>
            {row.whereToPull}
            <div style={MUTED_SMALL_STYLE}>{row.grainHistory}</div>
          </div>
          <div>
            {row.nextAction}
            <div style={MUTED_SMALL_STYLE}>{row.blocks}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function labelEvidenceClass(value: string): string {
  if (value === "missing") return "no governed evidence";
  return value.replace(/_/g, " ");
}

function labelLoadState(value: string): string {
  if (value === "not_loaded") return "Not loaded";
  if (value === "system_loaded") return "System loaded";
  if (value === "document_loaded") return "Document loaded";
  return "Human confirmed";
}

function labelParserState(value: string): string {
  if (value === "not_run") return "parser not run";
  if (value === "needs_review") return "needs review";
  if (value === "extracted") return "extracted";
  if (value === "reviewed") return "reviewed";
  return "finance validated";
}

interface BaselineReadinessRow {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly state: "included" | "pending" | "conflict";
}

function baselineReadinessRows(
  opportunitySet: ContractOptimizationOpportunitySet,
): readonly BaselineReadinessRow[] {
  const baseline = opportunitySet.baseline;
  const calculationCount = opportunitySet.opportunities.filter(
    (opportunity) => opportunity.calculation,
  ).length;
  return [
    {
      id: "pricing-schedule",
      label: "Pricing schedule tie-out",
      detail:
        baseline.status === "conflict"
          ? "Pricing rows and stated annual value disagree; do not approve a value case until this reconciles."
          : baseline.pricingScheduleAnnualValueUsd == null
            ? "Pricing schedule rows are not loaded, so rate and quantity coverage is still pending."
            : "Pricing schedule value is available for baseline review.",
      state:
        baseline.status === "conflict"
          ? "conflict"
          : baseline.pricingScheduleAnnualValueUsd == null
            ? "pending"
            : "included",
    },
    {
      id: "actual-spend",
      label: "Actual spend baseline",
      detail:
        baseline.actualAnnualSpendUsd == null
          ? "Actual annual spend is pending; variance may be visible elsewhere but is not a savings claim."
          : "Actual spend is loaded and can be compared with contract and pricing baselines.",
      state: baseline.actualAnnualSpendUsd == null ? "pending" : "included",
    },
    {
      id: "calculation-lines",
      label: "Calculation trace",
      detail:
        calculationCount > 0
          ? `${calculationCount} opportunity row(s) have line-level calculation detail.`
          : opportunitySet.opportunities.length > 0
            ? "Opportunity rows exist, but line-level calculation runs are not persisted for this case yet."
            : "No opportunity rows are loaded yet.",
      state: calculationCount > 0 ? "included" : "pending",
    },
    {
      id: "finance-proof",
      label: "Finance realization proof",
      detail:
        opportunitySet.financeConfirmedUsd > 0
          ? "Finance-confirmed value exists and remains separate from potential opportunity."
          : "Finance confirmation is pending; realized value must stay not established.",
      state: opportunitySet.financeConfirmedUsd > 0 ? "included" : "pending",
    },
  ];
}

interface EvidenceRequirementRow {
  readonly id: string;
  readonly label: string;
  readonly requirementType: string;
  readonly whereToPull: string;
  readonly grainHistory: string;
  readonly blocks: string;
  readonly nextAction: string;
}

function requirementRowFromSourcingRequirement(
  requirement: ContractOptimizationSourcingRequirement,
): EvidenceRequirementRow {
  return {
    id: requirement.lineId,
    label: requirement.lineLabel,
    requirementType: "Required for sizing",
    whereToPull: [
      requirement.connections
        .map((connection) => connection.sourceSystem)
        .join(" + "),
      requirement.ask,
    ]
      .filter(Boolean)
      .join(" — "),
    grainHistory: grainForRequirement(requirement),
    blocks: blocksForRequirement(requirement),
    nextAction: requirement.nextAction,
  };
}

function requirementRowFromOpportunityRequirement(
  requirement: string,
  index: number,
): EvidenceRequirementRow {
  const normalized = requirement.toLowerCase();
  if (
    normalized.includes("baseline") ||
    normalized.includes("pricing") ||
    normalized.includes("annual-value")
  ) {
    return {
      id: `opportunity-baseline-${index}`,
      label: "Commercial baseline reconciliation",
      requirementType: "Required before approval",
      whereToPull:
        "CLM / contract repository + pricing schedule extract — annual value, line values, effective dates, and document refs.",
      grainHistory:
        "Pricing-schedule line item grain for the active term, including amendments or order forms.",
      blocks: "Baseline lock, opportunity sizing, and approval-quality case",
      nextAction: requirement,
    };
  }
  if (normalized.includes("finance") || normalized.includes("realized")) {
    return {
      id: `opportunity-finance-${index}`,
      label: "Finance value confirmation",
      requirementType: "Required for realized value",
      whereToPull:
        "Finance / FP&A / Tower value evidence — claim record, baseline, actuals, cadence, owner, and attestation state.",
      grainHistory: "Monthly or quarterly claim period after action.",
      blocks: "Realized value and Tower handoff",
      nextAction: requirement,
    };
  }
  if (
    normalized.includes("vendor agreement") ||
    normalized.includes("executed amendment") ||
    normalized.includes("negotiation target") ||
    normalized.includes("approved position")
  ) {
    return {
      id: `opportunity-negotiated-improvement-${index}`,
      label: "Signed concession or amendment evidence",
      requirementType: "Required before negotiated improvement",
      whereToPull:
        "CLM / contract repository + Procurement / S2P — executed amendment, concession approval, supplier response, and sourcing case reference.",
      grainHistory:
        "Signed amendment or approved negotiation package for the current action.",
      blocks: "Negotiated improvement approval and external supplier position",
      nextAction: requirement,
    };
  }
  if (
    normalized.includes("usage supports") ||
    normalized.includes("reclaim") ||
    normalized.includes("service impact") ||
    normalized.includes("scope")
  ) {
    return {
      id: `opportunity-scope-reduction-${index}`,
      label: "Usage, entitlement, and scope-reduction approval",
      requirementType: "Required before avoided cost",
      whereToPull:
        "Usage / entitlement platform + application owner sign-off + sourcing workspace — active users, assignment, reclaim list, and approved scope change.",
      grainHistory:
        "User, seat, feature, or workload grain for the active term; 12 months preferred when consumption varies.",
      blocks: "Avoided-cost sizing, service-impact review, and renewal scope",
      nextAction: requirement,
    };
  }
  if (
    normalized.includes("ap and procurement") ||
    normalized.includes("po coverage") ||
    normalized.includes("off-contract") ||
    normalized.includes("dispute eligibility") ||
    normalized.includes("coverage")
  ) {
    return {
      id: `opportunity-invoice-coverage-${index}`,
      label: "Invoice, PO, and active-contract coverage",
      requirementType: "Required before leakage claim",
      whereToPull:
        "AP / ERP financial subledger + Procurement / S2P — invoice lines, PO match, payment status, active contract coverage, and dispute state.",
      grainHistory:
        "Invoice-line and PO-line grain for the active contract term; 12-24 months preferred.",
      blocks:
        "Off-contract billing, duplicate charge, and recoverable leakage claim",
      nextAction: requirement,
    };
  }
  if (
    normalized.includes("sla") ||
    normalized.includes("service-credit") ||
    normalized.includes("claim status") ||
    normalized.includes("vendor-responsibility")
  ) {
    return {
      id: `opportunity-sla-credit-${index}`,
      label: "SLA credit entitlement and claim status",
      requirementType: "Required before credit recovery",
      whereToPull:
        "ITSM / service management + CLM / contract repository — SLA performance, breach logs, service-review pack, credit clause, exclusions, and claim/receipt status.",
      grainHistory:
        "Monthly SLA, incident, and service-credit rows for 24 months preferred.",
      blocks: "Service-credit recovery and vendor claim package",
      nextAction: requirement,
    };
  }
  if (
    normalized.includes("rate") ||
    normalized.includes("rate-card") ||
    normalized.includes("billed rates") ||
    normalized.includes("approved amendment") ||
    normalized.includes("exception")
  ) {
    return {
      id: `opportunity-rate-card-${index}`,
      label: "Rate-card amendment and exception search",
      requirementType: "Required before rate variance claim",
      whereToPull:
        "AP / ERP invoice extract + CLM pricing schedule + VMS / rate-card system — billed rate, contracted rate, quantity, amendment, and exception approval.",
      grainHistory:
        "Invoice-line, time-entry, and rate-card line grain for the active term; 12-24 months preferred.",
      blocks: "Rate-card variance recovery and supplier dispute pack",
      nextAction: requirement,
    };
  }
  return {
    id: `opportunity-requirement-${index}`,
    label: "Unclassified evidence requirement",
    requirementType: "Required before external claim",
    whereToPull:
      "Named source owner extract tied to the active opportunity row.",
    grainHistory:
      "Native source grain for the active contract term; 12-24 months when periodized evidence is needed.",
    blocks: "Approval-quality opportunity sizing",
    nextAction: requirement,
  };
}

function SourceConnectionTable({
  connections,
}: {
  connections: readonly ContractOptimizationSourceConnection[];
}) {
  return (
    <div style={TABLE_WRAP_STYLE}>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            <th style={TH_STYLE}>System</th>
            <th style={TH_STYLE}>What to pull</th>
            <th style={TH_STYLE}>Feeds</th>
            <th style={TH_STYLE}>Why it matters</th>
          </tr>
        </thead>
        <tbody>
          {connections.map((connection) => (
            <tr key={connection.id}>
              <td style={TD_STYLE}>
                <strong>{connection.sourceSystem}</strong>
                <div style={MUTED_SMALL_STYLE}>
                  {connection.examples.slice(0, 3).join(", ")}
                </div>
              </td>
              <td style={TD_STYLE}>{connection.extract}</td>
              <td style={TD_STYLE}>
                {connection.ledgers.map(labelLedger).join(", ")}
              </td>
              <td style={TD_STYLE}>{connection.outcome}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function grainForRequirement(
  requirement: ContractOptimizationSourcingRequirement,
): string {
  if (requirement.lineId.includes("sla")) {
    return "Monthly SLA and credit rows, 24 months preferred.";
  }
  if (
    requirement.lineId.includes("invoice") ||
    requirement.lineId.includes("rate")
  ) {
    return "Invoice and rate-card line grain, last 12-24 months.";
  }
  if (requirement.lineId.includes("realized")) {
    return "Finance confirmation by month or quarter after action.";
  }
  return "Contract-line or usage-line grain for the relevant term.";
}

function blocksForRequirement(
  requirement: ContractOptimizationSourcingRequirement,
): string {
  if (requirement.lineId.includes("sla")) return "Service-credit recovery";
  if (
    requirement.lineId.includes("invoice") ||
    requirement.lineId.includes("rate")
  ) {
    return "Leakage and rate variance sizing";
  }
  if (requirement.lineId.includes("realized")) {
    return "Finance-confirmed value";
  }
  return "Approval-quality opportunity sizing";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatMaybeUsd(value: number | null): string {
  return value == null ? "Not established" : formatUsd(value);
}

function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "Not established";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
}

function labelLedger(value: string): string {
  return value.replace(/_/g, " ");
}

function labelValueType(value: string): string {
  if (value === "recoverable_leakage") return "Recoverable leakage";
  if (value === "avoided_cost") return "Avoided cost";
  if (value === "negotiable_improvement") return "Negotiated improvement";
  return value;
}

const MAIN_STYLE: CSSProperties = {
  minHeight: "100vh",
  background: ANALYTICS.PAGE_BG,
  color: ANALYTICS.INK,
};

const CONTAINER_STYLE: CSSProperties = {
  maxWidth: 1480,
  margin: "0 auto",
  padding: "24px 28px 48px",
  display: "grid",
  gap: 16,
};

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 18,
};

const HEADER_ACTIONS_STYLE: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexShrink: 0,
};

const EYEBROW_STYLE: CSSProperties = {
  color: ANALYTICS.BLUE,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1.5,
  textTransform: "uppercase",
};

const H1_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: "Georgia, serif",
  fontSize: 30,
  lineHeight: 1.1,
  letterSpacing: 0,
};

const SUBLINE_STYLE: CSSProperties = {
  margin: 0,
  color: ANALYTICS.MUTED,
  fontSize: 15,
  lineHeight: 1.4,
};

const META_ROW_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  color: ANALYTICS.MUTED,
  fontSize: 12,
};

const GHOST_BUTTON_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  padding: "10px 12px",
  color: ANALYTICS.INK,
  textDecoration: "none",
  background: "#fff",
  fontSize: 13,
  fontWeight: 800,
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  border: "none",
  borderRadius: 8,
  padding: "11px 14px",
  color: "#fff",
  background: ANALYTICS.INK,
  fontSize: 13,
  fontWeight: 900,
  cursor: "pointer",
};

const ROW_BUTTON_STYLE: CSSProperties = {
  ...PRIMARY_BUTTON_STYLE,
  display: "inline-block",
  textDecoration: "none",
};

const STAGE_RAIL_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 8,
};

const STAGE_CHIP_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  background: "#fff",
  padding: "9px 10px",
  fontSize: 12,
  fontWeight: 850,
  color: ANALYTICS.MUTED,
  display: "flex",
  gap: 8,
  alignItems: "center",
  minHeight: 42,
};

const STAGE_CHIP_ACTIVE_STYLE: CSSProperties = {
  background: ANALYTICS.INK,
  color: "#fff",
  borderColor: ANALYTICS.INK,
};

const STAGE_NUMBER_STYLE: CSSProperties = {
  color: ANALYTICS.BLUE,
  fontSize: 11,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const PANEL_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  background: "#fff",
  padding: 18,
  display: "grid",
  gap: 14,
};

const PANEL_HEAD_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
};

const SECTION_TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontSize: 18,
  lineHeight: 1.2,
  letterSpacing: 0,
};

const PANEL_COPY_STYLE: CSSProperties = {
  margin: "5px 0 0",
  color: ANALYTICS.MUTED,
  fontSize: 13,
  lineHeight: 1.45,
};

const TABLE_WRAP_STYLE: CSSProperties = {
  overflowX: "auto",
};

const TABLE_STYLE: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const TH_STYLE: CSSProperties = {
  textAlign: "left",
  padding: "9px 10px",
  borderBottom: `1px solid ${ANALYTICS.LINE}`,
  color: ANALYTICS.MUTED,
  fontSize: 10,
  letterSpacing: 1.2,
  textTransform: "uppercase",
};

const TD_STYLE: CSSProperties = {
  padding: "11px 10px",
  borderBottom: `1px solid ${ANALYTICS.LINE}`,
  verticalAlign: "top",
  lineHeight: 1.35,
};

const MUTED_SMALL_STYLE: CSSProperties = {
  color: ANALYTICS.MUTED,
  fontSize: 11,
  lineHeight: 1.35,
  marginTop: 3,
};

const EMPTY_STYLE: CSSProperties = {
  border: `1px dashed ${ANALYTICS.LINE}`,
  borderRadius: 8,
  padding: 18,
  color: ANALYTICS.MUTED,
  fontSize: 13,
};

const SELECTED_GRID_STYLE: CSSProperties = {
  display: "grid",
  gap: 16,
};

const SCORE_BADGE_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  padding: "10px 12px",
  display: "grid",
  gap: 2,
  minWidth: 92,
  textAlign: "center",
};

const REASON_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const REASON_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  padding: 12,
  minHeight: 108,
};

const REASON_LABEL_STYLE: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
};

const REASON_COPY_STYLE: CSSProperties = {
  margin: "7px 0 0",
  color: ANALYTICS.MUTED,
  fontSize: 12,
  lineHeight: 1.4,
};

const BASELINE_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  padding: 14,
  display: "grid",
  gap: 9,
  color: ANALYTICS.INK,
};

const BASELINE_HEADER_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
};

const BASELINE_DETAIL_STYLE: CSSProperties = {
  margin: "4px 0 0",
  color: ANALYTICS.MUTED,
  fontSize: 13,
  lineHeight: 1.45,
};

const BASELINE_STATUS_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.GREEN}`,
  borderRadius: 999,
  color: ANALYTICS.GREEN,
  background: "#ecfdf5",
  padding: "5px 8px",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const BASELINE_STATUS_WARNING_STYLE: CSSProperties = {
  borderColor: ANALYTICS.RUST,
  color: ANALYTICS.RUST,
  background: "#fff7ed",
};

const BASELINE_STATUS_MISSING_STYLE: CSSProperties = {
  borderColor: ANALYTICS.MUTED,
  color: ANALYTICS.MUTED,
  background: "#f8fafc",
};

const BASELINE_METRICS_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 8,
};

const BASELINE_READINESS_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const BASELINE_READINESS_ROW_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  padding: 10,
  display: "grid",
  gridTemplateColumns: "10px minmax(0, 1fr) auto",
  gap: 9,
  alignItems: "start",
};

const STATE_DOT_STYLE: CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: 999,
  background: ANALYTICS.MUTED,
  marginTop: 4,
};

const STATE_DOT_READY_STYLE: CSSProperties = {
  background: ANALYTICS.GREEN,
};

const STATE_DOT_WARNING_STYLE: CSSProperties = {
  background: ANALYTICS.RUST,
};

const BASELINE_ROW_STATE_STYLE: CSSProperties = {
  color: ANALYTICS.MUTED,
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const METRIC_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  padding: 10,
};

const METRIC_VALUE_STYLE: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontWeight: 900,
  fontSize: 15,
};

const SELECTED_ROW_STYLE: CSSProperties = {
  background: "#f8fafc",
};

const DECISION_STRIP_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

const DECISION_CELL_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  padding: 12,
};

const DECISION_VALUE_STYLE: CSSProperties = {
  display: "block",
  marginTop: 3,
  fontSize: 17,
  lineHeight: 1.2,
};

const DECISION_DETAIL_STYLE: CSSProperties = {
  margin: "5px 0 0",
  color: ANALYTICS.MUTED,
  fontSize: 12,
  lineHeight: 1.35,
};

const START_WRAP_STYLE: CSSProperties = {
  display: "grid",
  gap: 6,
  justifyItems: "end",
};

const WORKFLOW_ACTION_PANEL_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderLeft: `3px solid ${ANALYTICS.BLUE}`,
  borderRadius: 8,
  background: "#f8fbff",
  padding: 12,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 320px) auto",
  gap: 12,
  alignItems: "center",
};

const WORKFLOW_ACTION_TITLE_STYLE: CSSProperties = {
  display: "block",
  marginTop: 3,
  fontSize: 15,
  lineHeight: 1.25,
};

const WORKFLOW_TEXTAREA_STYLE: CSSProperties = {
  width: "100%",
  minHeight: 68,
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  padding: 10,
  font: "inherit",
  fontSize: 13,
  resize: "vertical",
  background: ANALYTICS.CARD,
};

const WORKFLOW_ACTIONS_STYLE: CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
  flexWrap: "wrap",
};

const NEXT_BAR_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderLeft: `3px solid ${ANALYTICS.INK}`,
  borderRadius: 8,
  background: ANALYTICS.CARD,
  padding: "12px 14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
};

const NEXT_ACTION_STYLE: CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: ANALYTICS.INK,
  lineHeight: 1.25,
};

const BLOCKER_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12,
  color: ANALYTICS.INK,
  maxWidth: 320,
  flexShrink: 0,
};

const STAGE_CHIP_FUTURE_STYLE: CSSProperties = {
  opacity: 0.55,
};

const TRACE_NOTE_STYLE: CSSProperties = {
  display: "grid",
  gap: 3,
  marginTop: 10,
  paddingTop: 10,
  borderTop: `1px solid ${ANALYTICS.LINE}`,
  fontSize: 12,
};

const INLINE_DOT_STYLE: CSSProperties = {
  display: "inline-block",
  width: 8,
  height: 8,
  borderRadius: 999,
  background: ANALYTICS.MUTED,
  marginRight: 6,
};

const OBLIGATION_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 999,
  color: ANALYTICS.MUTED,
  padding: "3px 7px",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const OBLIGATION_REQUIRED_STYLE: CSSProperties = {
  borderColor: ANALYTICS.INK,
  color: ANALYTICS.INK,
};

const ASKS_STYLE: CSSProperties = {
  display: "grid",
  gap: 6,
  marginTop: 12,
  paddingTop: 12,
  borderTop: `1px solid ${ANALYTICS.LINE}`,
};

const ASK_ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 240px) minmax(0, 1fr) minmax(0, 260px)",
  gap: 12,
  alignItems: "baseline",
  fontSize: 12,
};

const ERROR_STYLE: CSSProperties = {
  color: ANALYTICS.RUST,
  fontSize: 12,
  maxWidth: 260,
  textAlign: "right",
};

const SUCCESS_STYLE: CSSProperties = {
  color: ANALYTICS.GREEN,
  fontSize: 12,
  gridColumn: "1 / -1",
};

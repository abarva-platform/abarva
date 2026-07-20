"use client";

// Multi-role approval status + decision UI for a single deliverable —
// surfaces the per-role (business/technology/finance/risk_security) tracked
// approval state added by the deliverable_role_approvals data model
// (docs/releases/records/2026-07-20-deliverable-role-approvals.md) alongside
// the existing single-actor "Client Approved" sign-off (DeliverableApprovalAction).
// These are two independent, additive systems: this panel renders nothing for
// a deliverable type that requires no role approvals (the vast majority),
// and does not replace or gate the existing sign-off action.

import { useCallback, useEffect, useState } from "react";

type ApprovalRole = "business" | "technology" | "finance" | "risk_security";
type RoleApprovalStatus = "pending" | "reviewed" | "approved" | "rejected";

interface RoleApprovalRecord {
  role: ApprovalRole;
  status: RoleApprovalStatus;
  approverUserId: string | null;
  approverName: string | null;
  outstandingConditions: string | null;
  decidedAt: string | null;
}

interface RoleApprovalSummary {
  requiredRoles: ApprovalRole[];
  records: RoleApprovalRecord[];
  allRequiredApproved: boolean;
  anyRejected: boolean;
}

const ROLE_LABELS: Record<ApprovalRole, string> = {
  business: "Business",
  technology: "Technology",
  finance: "Finance",
  risk_security: "Risk/security",
};

const STATUS_STYLE: Record<RoleApprovalStatus, { bg: string; fg: string; border: string; label: string }> = {
  pending: { bg: "rgba(154,163,178,0.12)", fg: "#525866", border: "rgba(154,163,178,0.3)", label: "Pending" },
  reviewed: { bg: "rgba(217,119,6,0.1)", fg: "#92400E", border: "rgba(217,119,6,0.28)", label: "Reviewed" },
  approved: { bg: "rgba(22,163,74,0.1)", fg: "#14532D", border: "rgba(22,163,74,0.28)", label: "Approved" },
  rejected: { bg: "rgba(185,28,28,0.1)", fg: "#7F1D1D", border: "rgba(185,28,28,0.28)", label: "Rejected" },
};

function RolePill({ record }: { record: RoleApprovalRecord }) {
  const s = STATUS_STYLE[record.status];
  return (
    <span
      title={record.outstandingConditions ?? undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.02em",
        padding: "2px 7px",
        borderRadius: 10,
        backgroundColor: s.bg,
        color: s.fg,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {ROLE_LABELS[record.role]} · {s.label}
      {record.approverName ? ` (${record.approverName})` : ""}
    </span>
  );
}

interface Props {
  moveId: string;
  deliverableId: string;
}

export function RoleApprovalsPanel({ moveId, deliverableId }: Props) {
  const [summary, setSummary] = useState<RoleApprovalSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [role, setRole] = useState<ApprovalRole | "">("");
  const [status, setStatus] = useState<RoleApprovalStatus>("approved");
  const [approverName, setApproverName] = useState("");
  const [outstandingConditions, setOutstandingConditions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const base = `/api/v1/programs/${moveId}/deliverables/${deliverableId}/role-approvals`;

  const load = useCallback(async () => {
    try {
      const res = await fetch(base);
      if (!res.ok) {
        // A deliverable with no required roles, or one not visible to this
        // route (e.g. not yet persisted), is treated as "nothing to show"
        // rather than surfacing an error — this panel is additive, not a gate.
        setSummary(null);
        return;
      }
      const body = (await res.json()) as RoleApprovalSummary;
      setSummary(body);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load approval status");
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitDecision() {
    if (!role) {
      setSubmitError("Choose a role first");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          status,
          approverName: approverName.trim() || undefined,
          outstandingConditions: outstandingConditions.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || body?.error || `HTTP ${res.status}`);
      }
      setFormOpen(false);
      setRole("");
      setApproverName("");
      setOutstandingConditions("");
      await load();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not record decision");
    } finally {
      setSubmitting(false);
    }
  }

  // No required roles for this deliverable type (the common case — most
  // types are unaffected by this system) — render nothing.
  if (!summary || summary.requiredRoles.length === 0) {
    return loadError ? (
      <span style={{ fontSize: 9.5, color: "#B91C1C" }}>{loadError}</span>
    ) : null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
        {summary.records
          .filter((r) => summary.requiredRoles.includes(r.role))
          .map((r) => (
            <RolePill key={r.role} record={r} />
          ))}
        {summary.allRequiredApproved ? (
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "#14532D" }}>
            ✓ All required roles approved
          </span>
        ) : summary.anyRejected ? (
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "#7F1D1D" }}>
            ✕ A required role rejected this version
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            color: "#1B2B5C",
            backgroundColor: "transparent",
            border: "1px solid rgba(27,43,92,0.2)",
            borderRadius: 4,
            padding: "2px 7px",
            cursor: "pointer",
          }}
        >
          {formOpen ? "Cancel" : "Record role decision"}
        </button>
      </div>

      {formOpen ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            alignItems: "center",
            padding: "8px 10px",
            backgroundColor: "rgba(27,43,92,0.03)",
            border: "1px solid rgba(27,43,92,0.12)",
            borderRadius: 6,
          }}
        >
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ApprovalRole)}
            style={{ fontSize: 10.5, padding: "3px 5px" }}
          >
            <option value="">Role…</option>
            {summary.requiredRoles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as RoleApprovalStatus)}
            style={{ fontSize: 10.5, padding: "3px 5px" }}
          >
            <option value="reviewed">Reviewed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            type="text"
            placeholder="Approver name (e.g. Jane Doe, CFO)"
            value={approverName}
            onChange={(e) => setApproverName(e.target.value)}
            style={{ fontSize: 10.5, padding: "3px 5px", flex: "1 1 160px", minWidth: 140 }}
          />
          <input
            type="text"
            placeholder="Outstanding conditions (optional)"
            value={outstandingConditions}
            onChange={(e) => setOutstandingConditions(e.target.value)}
            style={{ fontSize: 10.5, padding: "3px 5px", flex: "1 1 200px", minWidth: 160 }}
          />
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submitDecision()}
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "#14532D",
              backgroundColor: "rgba(22,163,74,0.1)",
              border: "1px solid rgba(22,163,74,0.3)",
              borderRadius: 4,
              padding: "3px 9px",
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting ? "Saving…" : "Save decision"}
          </button>
          {submitError ? (
            <span style={{ fontSize: 9.5, color: "#B91C1C", width: "100%" }}>{submitError}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

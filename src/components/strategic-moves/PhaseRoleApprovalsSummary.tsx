"use client";

// Phase-level condensed view of multi-role deliverable approval status
// (MOVES-UI-011). RoleApprovalsPanel.tsx already renders this correctly per
// deliverable, but only inside Files & Evidence — a user reading the
// phase-level gate decision surface (MovesPhaseStandaloneClient.tsx) has no
// visibility into pending Business/Technology/Finance/Risk approvers even
// though governance.ts's meetsApprovalBar() silently gates advancement on
// exactly that data. This component surfaces the same underlying data
// (GET .../deliverables/:id/role-approvals, the same route RoleApprovalsPanel
// already calls) condensed across every role-gated deliverable in the phase,
// with no new data model and no change to gate-evaluation logic.

import { useEffect, useState } from "react";
import { getDeliverablesByPhase } from "@/lib/programs/deliverable-registry";
import {
  requiredApprovalRolesFor,
  type ApprovalRole,
} from "@/lib/programs/deliverable-role-approval-policy";

type RoleApprovalStatus = "pending" | "reviewed" | "approved" | "rejected";

interface RoleApprovalRecord {
  role: ApprovalRole;
  status: RoleApprovalStatus;
  approverName: string | null;
}

interface RoleApprovalSummary {
  requiredRoles: ApprovalRole[];
  records: RoleApprovalRecord[];
  allRequiredApproved: boolean;
  anyRejected: boolean;
}

interface DeliverableRoleStatus {
  deliverableId: string;
  title: string;
  summary: RoleApprovalSummary;
}

interface DeliverableRef {
  id: string;
  typeKey: string;
  title: string;
}

interface Props {
  moveId: string;
  phase: number;
  deliverables: DeliverableRef[];
}

const ROLE_LABELS: Record<ApprovalRole, string> = {
  business: "Business",
  technology: "Technology",
  finance: "Finance",
  risk_security: "Risk/security",
};

const STATUS_LABEL: Record<RoleApprovalStatus, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  approved: "Approved",
  rejected: "Rejected",
};

export function PhaseRoleApprovalsSummary({ moveId, phase, deliverables }: Props) {
  // Role-approval requirements (REQUIRED_APPROVAL_ROLES) are declared per
  // deliverable TYPE, independent of whether that type is formally a
  // "gateArtifact" for phase-advancement purposes — governance.ts's
  // meetsApprovalBar() checks named criteria against specific deliverable
  // rows, not filtered by the gateArtifact flag. operating_model_design, for
  // example, requires business+technology approval but is gateArtifact:false
  // (a working doc). Use every deliverable declared for the phase, not just
  // its gate artifacts, so role-gated working docs aren't silently dropped.
  const roleGatedSpecs = getDeliverablesByPhase(phase).filter(
    (spec) => requiredApprovalRolesFor(spec.deliverableTypeKey).length > 0,
  );
  const matches = roleGatedSpecs
    .map((spec) => {
      const match = deliverables.find((d) => d.typeKey === spec.deliverableTypeKey);
      return match ? { deliverableId: match.id, title: match.title } : null;
    })
    .filter((value): value is { deliverableId: string; title: string } => value !== null);
  const matchKey = matches.map((m) => m.deliverableId).join(",");

  const [statuses, setStatuses] = useState<DeliverableRoleStatus[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (matches.length === 0) {
      setStatuses([]);
      return;
    }
    Promise.all(
      matches.map(async (m): Promise<DeliverableRoleStatus | null> => {
        try {
          const res = await fetch(
            `/api/v1/programs/${moveId}/deliverables/${m.deliverableId}/role-approvals`,
          );
          if (!res.ok) return null;
          const summary = (await res.json()) as RoleApprovalSummary;
          return { deliverableId: m.deliverableId, title: m.title, summary };
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (!cancelled) {
        setStatuses(results.filter((r): r is DeliverableRoleStatus => r !== null));
      }
    });
    return () => {
      cancelled = true;
    };
    // matchKey (not matches, a fresh array every render) is the real dependency —
    // it only changes when the actual set of role-gated deliverable ids changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveId, matchKey]);

  if (roleGatedSpecs.length === 0) return null;
  const withRoles = statuses.filter((s) => s.summary.requiredRoles.length > 0);
  if (withRoles.length === 0) return null;

  const fullyApprovedCount = withRoles.filter((s) => s.summary.allRequiredApproved).length;

  return (
    <details className="mxw-gate-detail" data-testid="mxw-role-approvals-summary">
      <summary>
        <span>Approver status by role</span>
        <strong>
          {fullyApprovedCount}/{withRoles.length} fully approved
        </strong>
      </summary>
      <div className="mxw-role-approvals-body">
        {withRoles.map((s) => (
          <div key={s.deliverableId} className="mxw-role-approvals-row">
            <span className="mxw-role-approvals-title">{s.title}</span>
            <div className="mxw-role-approvals-pills">
              {s.summary.requiredRoles.map((role) => {
                const record = s.summary.records.find((r) => r.role === role);
                const status = record?.status ?? "pending";
                return (
                  <span key={role} className={`mxw-role-pill mxw-role-pill-${status}`}>
                    {ROLE_LABELS[role]} · {STATUS_LABEL[status]}
                    {record?.approverName ? ` (${record.approverName})` : ""}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

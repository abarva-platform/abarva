/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { PhaseRoleApprovalsSummary } from "../PhaseRoleApprovalsSummary";

// Phase 3's gate artifacts include target_state_architecture (requires
// technology + risk_security) and operating_model_design (requires business +
// technology) — real entries from deliverable-registry.ts /
// deliverable-role-approval-policy.ts, not fixtures invented for this test.

function mockFetchOnce(responses: Record<string, unknown>) {
  global.fetch = jest.fn((url: string) => {
    const match = Object.keys(responses).find((key) => url.includes(key));
    if (!match) {
      return Promise.resolve({ ok: false } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: async () => responses[match],
    } as Response);
  }) as unknown as typeof fetch;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("PhaseRoleApprovalsSummary", () => {
  it("renders nothing for a phase with no role-gated deliverables", () => {
    mockFetchOnce({});
    const { container } = render(
      <PhaseRoleApprovalsSummary
        moveId="move-1"
        phase={1}
        deliverables={[{ id: "d1", typeKey: "charter", title: "Charter" }]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the phase's role-gated deliverable types haven't been generated yet", () => {
    mockFetchOnce({});
    const { container } = render(
      <PhaseRoleApprovalsSummary moveId="move-1" phase={3} deliverables={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a condensed per-role breakdown for each role-gated deliverable in the phase", async () => {
    mockFetchOnce({
      "deliverables/arch-1/role-approvals": {
        requiredRoles: ["technology", "risk_security"],
        records: [
          { role: "technology", status: "approved", approverName: "Jane Doe" },
          { role: "risk_security", status: "pending", approverName: null },
        ],
        allRequiredApproved: false,
        anyRejected: false,
      },
      "deliverables/omd-1/role-approvals": {
        requiredRoles: ["business", "technology"],
        records: [
          { role: "business", status: "approved", approverName: "Sam Lee" },
          { role: "technology", status: "approved", approverName: "Jane Doe" },
        ],
        allRequiredApproved: true,
        anyRejected: false,
      },
    });

    render(
      <PhaseRoleApprovalsSummary
        moveId="move-1"
        phase={3}
        deliverables={[
          { id: "arch-1", typeKey: "target_state_architecture", title: "Target Architecture" },
          { id: "omd-1", typeKey: "operating_model_design", title: "Operating Model Design" },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Approver status by role")).toBeInTheDocument();
    });

    expect(screen.getByText("1/2 fully approved")).toBeInTheDocument();
    expect(screen.getByText("Target Architecture")).toBeInTheDocument();
    expect(screen.getByText("Operating Model Design")).toBeInTheDocument();
    expect(screen.getAllByText("Technology · Approved (Jane Doe)").length).toBe(2);
    expect(screen.getByText("Risk/security · Pending")).toBeInTheDocument();
    expect(screen.getByText("Business · Approved (Sam Lee)")).toBeInTheDocument();
  });

  it("renders nothing while the fetch is still in flight (no flash of empty state text)", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    const { container } = render(
      <PhaseRoleApprovalsSummary
        moveId="move-1"
        phase={3}
        deliverables={[
          { id: "arch-1", typeKey: "target_state_architecture", title: "Target Architecture" },
        ]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("degrades gracefully (renders nothing) when the role-approvals fetch fails", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("network error"))) as unknown as typeof fetch;
    const { container } = render(
      <PhaseRoleApprovalsSummary
        moveId="move-1"
        phase={3}
        deliverables={[
          { id: "arch-1", typeKey: "target_state_architecture", title: "Target Architecture" },
        ]}
      />,
    );
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });
});

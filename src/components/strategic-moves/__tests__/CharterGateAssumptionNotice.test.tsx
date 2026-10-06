/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { CharterGateAssumptionNotice } from "../CharterBasisField";
import { GateApprovalConfirmDialog } from "../GateApprovalConfirmDialog";
import { charterGateAssumptionDisclosure } from "@/lib/programs/charter-gate-assumption-disclosure";

const BASE = {
  total: 6,
  answered: 6,
  evidence: 6,
  asserted: 0,
  assumptions: 0,
  unrecorded: 0,
  openAssumptions: [],
} as const;

describe("CharterGateAssumptionNotice", () => {
  it("renders nothing when the disclosure is null", () => {
    const { container } = render(
      <CharterGateAssumptionNotice disclosure={null} />,
    );
    expect(container.textContent).toBe("");
  });

  it("names each open assumption's owner and how Discover validates it", () => {
    render(
      <CharterGateAssumptionNotice
        disclosure={charterGateAssumptionDisclosure({
          active: true,
          counts: {
            ...BASE,
            evidence: 4,
            assumptions: 2,
            openAssumptions: [
              {
                sectionKey: "scope",
                label: "What the bet covers",
                owner: "Operations lead",
                p2ValidationPlan: "Discover samples 30 days of tickets.",
              },
              {
                sectionKey: "owner",
                label: "Who decides",
                owner: "Workspace owner",
                p2ValidationPlan: "Discover confirms the decision rights.",
              },
            ],
          },
        })}
      />,
    );
    const notice = screen.getByTestId("charter-gate-assumption-notice");
    expect(notice).toHaveAttribute("data-tone", "amber");
    expect(notice).toHaveAttribute("data-assumptions", "2");
    expect(screen.getByText(/What the bet covers · Operations lead/)).toBeInTheDocument();
    expect(
      screen.getByText("Discover samples 30 days of tickets."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Who decides · Workspace owner/)).toBeInTheDocument();
  });

  it("never presents an assumption as evidence", () => {
    render(
      <CharterGateAssumptionNotice
        disclosure={charterGateAssumptionDisclosure({
          active: true,
          counts: {
            ...BASE,
            evidence: 5,
            assumptions: 1,
            openAssumptions: [
              {
                sectionKey: "scope",
                label: "What the bet covers",
                owner: "Operations lead",
                p2ValidationPlan: "Discover samples 30 days of tickets.",
              },
            ],
          },
        })}
      />,
    );
    const notice = screen.getByTestId("charter-gate-assumption-notice");
    expect(notice.textContent).toMatch(/assumption/i);
    expect(notice.textContent).not.toMatch(/backed by evidence/i);
    expect(notice.textContent).not.toMatch(/evidence covered/i);
  });

  it("states the clean case in words rather than rendering empty", () => {
    render(
      <CharterGateAssumptionNotice
        disclosure={charterGateAssumptionDisclosure({
          active: true,
          counts: { ...BASE, evidence: 4, asserted: 2 },
        })}
      />,
    );
    const notice = screen.getByTestId("charter-gate-assumption-notice");
    expect(notice).toHaveAttribute("data-tone", "neutral");
    expect(notice.textContent).toMatch(/None is an open assumption/);
  });
});

describe("GateApprovalConfirmDialog disclosure slot", () => {
  const props = {
    open: true,
    title: "Approve the P1 gate?",
    summary: "This records your approval and unlocks P2 Discover.",
    approverLabel: "owner@example.test · Client admin",
    onCancel: () => {},
    onConfirm: () => {},
  };

  it("renders exactly as before when no disclosure is passed", () => {
    render(<GateApprovalConfirmDialog {...props} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.queryByTestId("charter-gate-assumption-notice"),
    ).not.toBeInTheDocument();
  });

  it("shows the disclosure without disabling the confirm action", () => {
    // The disclosure is advisory: it tells the approver what they are signing
    // for, it does not become a second gate.
    render(
      <GateApprovalConfirmDialog
        {...props}
        disclosure={
          <CharterGateAssumptionNotice
            disclosure={charterGateAssumptionDisclosure({
              active: true,
              counts: {
                ...BASE,
                evidence: 5,
                assumptions: 1,
                openAssumptions: [
                  {
                    sectionKey: "scope",
                    label: "What the bet covers",
                    owner: "Operations lead",
                    p2ValidationPlan: "Discover samples 30 days of tickets.",
                  },
                ],
              },
            })}
          />
        }
      />,
    );
    expect(
      screen.getByTestId("charter-gate-assumption-notice"),
    ).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Confirm approval" });
    expect(confirm).toBeEnabled();
  });
});

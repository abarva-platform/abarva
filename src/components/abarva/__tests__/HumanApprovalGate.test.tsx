/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import {
  canSubmitHumanApproval,
  HumanApprovalGate,
} from "../HumanApprovalGate";

function Harness() {
  const [justification, setJustification] = useState("");
  const [accepted, setAccepted] = useState(false);
  return (
    <HumanApprovalGate
      justification={justification}
      onJustificationChange={setJustification}
      acceptedResponsibility={accepted}
      onAcceptedResponsibilityChange={setAccepted}
      minChars={20}
    />
  );
}

describe("HumanApprovalGate", () => {
  it("requires both responsibility acceptance and a minimum-length justification", () => {
    expect(
      canSubmitHumanApproval({
        acceptedResponsibility: false,
        justification: "Reviewed evidence and accept the gate.",
      }),
    ).toBe(false);
    expect(
      canSubmitHumanApproval({
        acceptedResponsibility: true,
        justification: "too short",
      }),
    ).toBe(false);
    expect(
      canSubmitHumanApproval({
        acceptedResponsibility: true,
        justification: "Reviewed the evidence bundle and accept ownership.",
      }),
    ).toBe(true);
  });

  it("renders attestation, checkbox, rationale field, and readiness state", () => {
    render(<Harness />);

    expect(screen.getByTestId("human-approval-attestation")).toHaveTextContent(
      /decision support/i,
    );
    expect(screen.getByTestId("human-approval-validation")).toHaveAttribute(
      "data-human-approval-ready",
      "false",
    );

    fireEvent.change(screen.getByTestId("human-approval-justification"), {
      target: { value: "Reviewed the evidence bundle and accept ownership." },
    });
    expect(screen.getByTestId("human-approval-validation")).toHaveAttribute(
      "data-human-approval-ready",
      "false",
    );

    fireEvent.click(
      screen.getByTestId("human-approval-responsibility-checkbox"),
    );
    expect(screen.getByTestId("human-approval-validation")).toHaveAttribute(
      "data-human-approval-ready",
      "true",
    );
  });
});

/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

import { ScopeGate } from "../ScopeGate";
import type { StageGateView } from "../view-model";

describe("ScopeGate artifact quality state", () => {
  it("renders persisted quality state instead of the static nothing-generated message", () => {
    const gate: StageGateView = {
      approver: "VP Sourcing",
      confirms: [
        { label: "Evidence complete", detail: "Required evidence is present." },
      ],
      generates: [
        { label: "RFP Package", code: "d09_rfp_pack" },
        { label: "Response Checklist", code: "d11_response_checklist" },
      ],
      nextStageName: "Responses",
      artifactQualityStates: [
        {
          artifactCode: "d09_rfp_pack",
          label: "RFP Package",
          status: "needs_review",
          vendorFacingSafe: false,
          blockerCount: 2,
          warningCount: 0,
          summary: "RFP Package did not pass its quality gate.",
        },
      ],
    };

    render(<ScopeGate gate={gate} stageName="RFP" />);

    expect(screen.getByText("Needs review · 2")).toBeInTheDocument();
    expect(screen.getByText(/Generated state is live/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nothing is generated yet/i)).not.toBeInTheDocument();
  });
});

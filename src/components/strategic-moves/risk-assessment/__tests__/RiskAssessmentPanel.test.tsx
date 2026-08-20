/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { RiskAssessmentPanel } from "../RiskAssessmentPanel";

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

async function waitForLoaded() {
  await waitFor(() => {
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });
}

function selectField(label: string | RegExp, value: string) {
  fireEvent.change(screen.getByRole("combobox", { name: label }), {
    target: { value },
  });
}

async function fillAllFields() {
  selectField(/D1 · Data Sensitivity/, "Critical"); // 4
  selectField(/D2 · Human Oversight/, "Low"); // 1
  selectField(/D3 · Integration Impact/, "Critical"); // 4
  selectField(/D4 · Build Origin/, "Moderate"); // 2
  selectField(/D5 · Domain Breadth/, "Low"); // 1 -> dimension 12
  selectField(/E1 · PHI/, "Critical"); // 4
  selectField(/E2 · Autonomous/, "NotTriggered");
  selectField(/E3 · Clinical Decisioning/, "NotTriggered");
  selectField(/E4 · Organization Readiness/, "Moderate"); // 2 -> escalator 6
  selectField(/E5 · Cross-Domain/, "NotTriggered");
  selectField(/E6 · Public/, "NotTriggered");
  selectField(/E7 · Brand/, "NotTriggered");
  selectField(/E8 · Patient-Facing/, "NotTriggered");
}

describe("RiskAssessmentPanel", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => jsonResponse({ inputs: null, result: null }));
  });

  it("loads with every field unanswered and the save button disabled", async () => {
    render(<RiskAssessmentPanel moveId="move-1" />);
    await waitForLoaded();
    expect(
      screen.getByRole("button", { name: /save risk assessment/i }),
    ).toBeDisabled();
    expect(screen.getByText(/answer all 13 questions/i)).toBeInTheDocument();
  });

  it("computes and shows a live preview matching the Ambient Listening golden fixture as soon as all 13 fields are answered, without saving", async () => {
    render(<RiskAssessmentPanel moveId="move-1" />);
    await waitForLoaded();

    await act(async () => {
      await fillAllFields();
    });

    expect(screen.getByText("12 / 20")).toBeInTheDocument(); // dimension score
    expect(screen.getByText("6 / 32")).toBeInTheDocument(); // escalator score
    expect(screen.getByText("18")).toBeInTheDocument(); // total score
    expect(
      within(screen.getByTestId("risk-band")).getByText("Moderate"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Live preview — not yet saved/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Required — 2 escalators triggered/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save risk assessment/i }),
    ).toBeEnabled();
  });

  it("POSTs the exact 13-field payload on save and displays the server-returned result", async () => {
    const postBodies: unknown[] = [];
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        postBodies.push(JSON.parse(init.body as string));
        return jsonResponse({
          ok: true,
          result: {
            dimensionScore: 12,
            escalatorScore: 6,
            totalScore: 18,
            additiveBand: "Moderate",
            band: "Moderate",
            escalatorsTriggered: 2,
            anyEscalatorTriggered: true,
            governanceCouncilReviewRequired: true,
            severeConditionOverrideApplied: false,
          },
        });
      }
      return jsonResponse({ inputs: null, result: null });
    });

    render(<RiskAssessmentPanel moveId="move-42" />);
    await waitForLoaded();
    await act(async () => {
      await fillAllFields();
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /save risk assessment/i }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Last saved/i)).toBeInTheDocument();
    });

    expect(postBodies).toHaveLength(1);
    expect(postBodies[0]).toEqual({
      inputs: {
        d1DataSensitivity: "Critical",
        d2HumanOversight: "Low",
        d3IntegrationImpact: "Critical",
        d4BuildOrigin: "Moderate",
        d5DomainBreadth: "Low",
        e1PhiExposure: "Critical",
        e2AutonomousAction: "NotTriggered",
        e3ClinicalDecisioning: "NotTriggered",
        e4OrganizationReadiness: "Moderate",
        e5CrossDomainIntegration: "NotTriggered",
        e6PublicRegulatoryExposure: "NotTriggered",
        e7BrandReputationRisk: "NotTriggered",
        e8PatientFacingExposure: "NotTriggered",
      },
    });
    expect(
      (global.fetch as jest.Mock).mock.calls.some(
        ([url]) => url === "/api/v1/programs/move-42/risk-assessment",
      ),
    ).toBe(true);
  });

  it("shows a save error and does not clear the form when the server rejects the save", async () => {
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return jsonResponse({ error: "not_enabled" }, false, 404);
      }
      return jsonResponse({ inputs: null, result: null });
    });

    render(<RiskAssessmentPanel moveId="move-1" />);
    await waitForLoaded();
    await act(async () => {
      await fillAllFields();
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /save risk assessment/i }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/not_enabled/i);
    });
    // Live preview (unsaved) should still be showing — the failed save didn't wipe the form.
    expect(
      screen.getByText(/Live preview — not yet saved/i),
    ).toBeInTheDocument();
  });

  it("loads a prior saved assessment and shows it as 'Last saved' immediately, without requiring re-entry", async () => {
    global.fetch = jest.fn(() =>
      jsonResponse({
        inputs: {
          d1DataSensitivity: "Low",
          d2HumanOversight: "Low",
          d3IntegrationImpact: "Low",
          d4BuildOrigin: "Low",
          d5DomainBreadth: "Low",
          e1PhiExposure: "NotTriggered",
          e2AutonomousAction: "NotTriggered",
          e3ClinicalDecisioning: "NotTriggered",
          e4OrganizationReadiness: "NotTriggered",
          e5CrossDomainIntegration: "NotTriggered",
          e6PublicRegulatoryExposure: "NotTriggered",
          e7BrandReputationRisk: "NotTriggered",
          e8PatientFacingExposure: "NotTriggered",
        },
        result: {
          dimensionScore: 5,
          escalatorScore: 0,
          totalScore: 5,
          additiveBand: "Low",
          band: "Low",
          escalatorsTriggered: 0,
          anyEscalatorTriggered: false,
          governanceCouncilReviewRequired: false,
          severeConditionOverrideApplied: false,
        },
      }),
    );

    render(<RiskAssessmentPanel moveId="move-1" />);
    await waitForLoaded();
    await waitFor(() => {
      expect(screen.getByText(/Last saved/i)).toBeInTheDocument();
    });
    expect(
      within(screen.getByTestId("risk-result")).getByText("5"),
    ).toBeInTheDocument(); // total score
    expect(
      within(screen.getByTestId("risk-band")).getByText("Low"),
    ).toBeInTheDocument(); // band
    expect(
      screen.getByText(/Not required — no escalators triggered/i),
    ).toBeInTheDocument();
    // Save should be enabled immediately since all fields loaded pre-filled.
    expect(
      screen.getByRole("button", { name: /save risk assessment/i }),
    ).toBeEnabled();
  });
});

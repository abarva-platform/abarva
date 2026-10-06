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

/**
 * The declared-archetype vocabulary join, on screen.
 *
 * Before it, the thirteen factors were asked in one hardcoded clinical
 * vocabulary on every Move. The panel will not save until all thirteen are
 * answered, so a Move that had DECLARED a non-clinical archetype had to rate a
 * clinical decision and a patient-facing audience to record an assessment at
 * all. These cases pin the wording to the DECLARATION the GET serves, and pin
 * that only the wording moved: the same thirteen keys are required, saved and
 * read back.
 */
describe("RiskAssessmentPanel · declared-archetype vocabulary", () => {
  function mockLoad(archetypeId: string | null, inputs: unknown = null) {
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") return jsonResponse({ ok: true });
      return jsonResponse({ inputs, result: null, archetypeId });
    });
  }

  it("asks a declared Move's factors in that archetype's words", async () => {
    mockLoad("governed_data_foundation");
    render(<RiskAssessmentPanel moveId="move-gdf" />);
    await waitForLoaded();

    expect(
      screen.getByRole("combobox", { name: /E3 · Decision Authority/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /E8 · External-Facing Exposure/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", {
        name: /E1 · Regulated \/ Sensitive Data Exposure/,
      }),
    ).toBeInTheDocument();
  });

  it("asks a declared Move none of the clinical questions", async () => {
    mockLoad("governed_data_foundation");
    const { container } = render(<RiskAssessmentPanel moveId="move-gdf" />);
    await waitForLoaded();

    // Read the text NODES, not a concatenated textContent: adjacent spans join
    // with no separator, which would defeat a word-boundary assertion.
    const nodes: string[] = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      nodes.push(n.textContent ?? "");
    }
    const joined = nodes.join(" | ");
    expect(joined).not.toMatch(/clinical/i);
    expect(joined).not.toMatch(/patient/i);
    expect(joined).not.toMatch(/PHI/);
    // Control: the shipped wording DOES contain all three, so the assertion
    // above is not vacuously true against an empty render.
    expect(joined).toMatch(/Data Sensitivity/);
  });

  it("still asks an undeclared Move the shipped questions", async () => {
    mockLoad(null);
    render(<RiskAssessmentPanel moveId="move-plain" />);
    await waitForLoaded();
    expect(
      screen.getByRole("combobox", { name: /E3 · Clinical Decisioning/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /E8 · Patient-Facing Exposure/ }),
    ).toBeInTheDocument();
  });

  it("falls back to the shipped questions for an archetype with no vocabulary", async () => {
    mockLoad("some_archetype_with_no_entry");
    render(<RiskAssessmentPanel moveId="move-other" />);
    await waitForLoaded();
    expect(
      screen.getByRole("combobox", { name: /E3 · Clinical Decisioning/ }),
    ).toBeInTheDocument();
  });

  it("requires and saves the same thirteen keys for a declared Move", async () => {
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
      return jsonResponse({
        inputs: null,
        result: null,
        archetypeId: "governed_data_foundation",
      });
    });

    render(<RiskAssessmentPanel moveId="move-gdf" />);
    await waitForLoaded();

    // Save is held until all thirteen are answered, exactly as before — the
    // re-wording must not make a factor optional.
    expect(
      screen.getByRole("button", { name: /save risk assessment/i }),
    ).toBeDisabled();

    await act(async () => {
      selectField(/D1 · Data Sensitivity/, "Critical");
      selectField(/D2 · Human Oversight/, "Low");
      selectField(/D3 · Integration Impact/, "Critical");
      selectField(/D4 · Build Origin/, "Moderate");
      selectField(/D5 · Domain Breadth/, "Low");
      selectField(/E1 · Regulated/, "Critical");
      selectField(/E2 · Autonomous/, "NotTriggered");
      selectField(/E3 · Decision Authority/, "NotTriggered");
      selectField(/E4 · Organization Readiness/, "Moderate");
      selectField(/E5 · Cross-Domain/, "NotTriggered");
      selectField(/E6 · Public/, "NotTriggered");
      selectField(/E7 · Brand/, "NotTriggered");
      selectField(/E8 · External-Facing/, "NotTriggered");
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /save risk assessment/i }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Last saved/i)).toBeInTheDocument();
    });

    // The STORED keys are the shipped ones whatever the archetype — an
    // assessment is not re-keyed by the words it was asked in.
    expect(postBodies).toEqual([
      {
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
      },
    ]);
  });

  it("holds the save until every factor is answered, not just the dimensions", async () => {
    // The required-key list is assembled from the vocabulary module's two key
    // arrays. Dropping either one would enable the save on a partial
    // assessment, which the server then rejects as a bad request — so the
    // partial fill is asserted, not only the empty and the complete one.
    mockLoad("governed_data_foundation");
    render(<RiskAssessmentPanel moveId="move-gdf" />);
    await waitForLoaded();

    const save = () =>
      screen.getByRole("button", { name: /save risk assessment/i });
    expect(save()).toBeDisabled();

    await act(async () => {
      selectField(/D1 · Data Sensitivity/, "Critical");
      selectField(/D2 · Human Oversight/, "Low");
      selectField(/D3 · Integration Impact/, "Critical");
      selectField(/D4 · Build Origin/, "Moderate");
      selectField(/D5 · Domain Breadth/, "Low");
    });
    expect(save()).toBeDisabled();

    // One escalator short is still short.
    await act(async () => {
      selectField(/E1 · Regulated/, "Critical");
      selectField(/E2 · Autonomous/, "NotTriggered");
      selectField(/E3 · Decision Authority/, "NotTriggered");
      selectField(/E4 · Organization Readiness/, "Moderate");
      selectField(/E5 · Cross-Domain/, "NotTriggered");
      selectField(/E6 · Public/, "NotTriggered");
      selectField(/E7 · Brand/, "NotTriggered");
    });
    expect(save()).toBeDisabled();

    await act(async () => {
      selectField(/E8 · External-Facing/, "NotTriggered");
    });
    expect(save()).toBeEnabled();
  });

  it("holds the save on every escalator answered but a dimension missing", async () => {
    // The mirror of the case above. Asserted in BOTH directions because a
    // required-key list built from one of the two key arrays satisfies the
    // other direction's assertions on its own: filling the dimensions first
    // cannot observe a list that dropped them.
    mockLoad("governed_data_foundation");
    render(<RiskAssessmentPanel moveId="move-gdf" />);
    await waitForLoaded();

    const save = () =>
      screen.getByRole("button", { name: /save risk assessment/i });

    await act(async () => {
      selectField(/E1 · Regulated/, "Critical");
      selectField(/E2 · Autonomous/, "NotTriggered");
      selectField(/E3 · Decision Authority/, "NotTriggered");
      selectField(/E4 · Organization Readiness/, "Moderate");
      selectField(/E5 · Cross-Domain/, "NotTriggered");
      selectField(/E6 · Public/, "NotTriggered");
      selectField(/E7 · Brand/, "NotTriggered");
      selectField(/E8 · External-Facing/, "NotTriggered");
    });
    expect(save()).toBeDisabled();

    await act(async () => {
      selectField(/D1 · Data Sensitivity/, "Critical");
      selectField(/D2 · Human Oversight/, "Low");
      selectField(/D3 · Integration Impact/, "Critical");
      selectField(/D4 · Build Origin/, "Moderate");
    });
    expect(save()).toBeDisabled();

    await act(async () => {
      selectField(/D5 · Domain Breadth/, "Low");
    });
    expect(save()).toBeEnabled();
  });

  it("reads back an assessment saved before the Move was declared", async () => {
    mockLoad("governed_data_foundation", {
      d1DataSensitivity: "High",
      d2HumanOversight: "Low",
      d3IntegrationImpact: "Moderate",
      d4BuildOrigin: "Low",
      d5DomainBreadth: "Low",
      e1PhiExposure: "Moderate",
      e2AutonomousAction: "NotTriggered",
      e3ClinicalDecisioning: "NotTriggered",
      e4OrganizationReadiness: "NotTriggered",
      e5CrossDomainIntegration: "NotTriggered",
      e6PublicRegulatoryExposure: "NotTriggered",
      e7BrandReputationRisk: "NotTriggered",
      e8PatientFacingExposure: "NotTriggered",
    });
    render(<RiskAssessmentPanel moveId="move-gdf" />);
    await waitForLoaded();

    // The value was stored under `e1PhiExposure`; it shows against the
    // re-worded prompt, not blank.
    expect(
      screen.getByRole("combobox", { name: /E1 · Regulated/ }),
    ).toHaveValue("Moderate");
    expect(
      screen.getByRole("combobox", { name: /D1 · Data Sensitivity/ }),
    ).toHaveValue("High");
  });
});

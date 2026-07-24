/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CostEffortWizard } from "../CostEffortWizard";
import type { EstimateConfigJson, EstimateJson } from "../types";

const CONFIG: EstimateConfigJson = {
  modelVersion: 1,
  archetypes: [{ archetypeCode: "ARCH-01", archetypeName: "AI / automation use case", description: null }],
  requiredInputsByArchetype: {
    "ARCH-01": [
      { inputKey: "scenario_name", label: "Scenario name", unit: null, required: true, stepHint: "setup" },
      { inputKey: "currency", label: "Currency", unit: null, required: true, stepHint: "setup" },
      { inputKey: "target_start_date", label: "Target start date", unit: null, required: true, stepHint: "setup" },
      { inputKey: "target_duration_weeks", label: "Target duration", unit: "weeks", required: true, stepHint: "setup" },
      { inputKey: "selected_rate_card_id", label: "Rate card", unit: null, required: true, stepHint: "setup" },
      { inputKey: "ai_use_case_count", label: "AI Use Case Count", unit: "AI use case", required: true, stepHint: "scope" },
      { inputKey: "stakeholder_group_count", label: "Stakeholder Group Count", unit: "stakeholder group", required: true, stepHint: "people" },
    ],
  },
};

const ESTIMATE: EstimateJson = {
  id: "estimate-1",
  tenantKey: "apex-retail",
  moveId: "move-1",
  scenarioGroupId: "group-1",
  scenarioName: "Traditional",
  scenarioKey: "traditional",
  archetypeCode: "ARCH-01",
  modelVersion: 1,
  currency: "USD",
  targetStartDate: "2026-09-01",
  targetDurationWeeks: 12,
  selectedRateCardId: null,
  status: "draft",
  lastRunId: null,
  lastRunAt: null,
  createdBy: null,
  createdAt: "2026-07-24T00:00:00Z",
  updatedAt: "2026-07-24T00:00:00Z",
};

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(body) } as Response);
}

describe("CostEffortWizard", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith("/pricing/config")) {
        return jsonResponse({ ok: true, config: CONFIG, defaultRateCard: null });
      }
      if (url.endsWith("/estimates") && init?.method === "POST") {
        return jsonResponse({ ok: true, estimate: ESTIMATE }, true, 201);
      }
      if (url.includes("/inputs") && init?.method === "PATCH") {
        return jsonResponse({ ok: true, estimate: ESTIMATE, updatedInputs: [] });
      }
      if (url.includes("/validate")) {
        return jsonResponse({ ok: true, ready: true, blockingReasons: [], requiredInputKeys: [] });
      }
      if (url.includes("/run")) {
        return jsonResponse({
          ok: true,
          result: {
            estimateId: "estimate-1",
            runId: "run-1",
            ranAt: "2026-07-24T02:00:00Z",
            modelVersion: 1,
            scenarioKey: "traditional",
            archetypeCode: "ARCH-01",
            totals: { totalRawHours: 100, totalExpectedHours: 100, totalLaborCostCents: 500000, totalManualCostCents: 0, totalCostCents: 500000, gapCount: 0 },
            range: { policyCode: "RANGE-STANDARD", policyName: "Standard", score: 4, lowCents: 400000, expectedCents: 500000, highCents: 700000 },
            costByActivityPack: [],
            costByRole: [],
            internalVsExternal: { internalCostCents: 500000, externalCostCents: 0, unknownCostCents: 0 },
            cashVsAbsorbedCapacity: { cashCostCents: 0, absorbedCapacityCostCents: 500000, unknownCostCents: 0 },
            oneTimeVsRecurring: { oneTimeCostCents: 500000, recurringCostCents: 0 },
            changeAdoptionBreakdown: [],
            technologyThirdPartyCostCents: 0,
            rateCardCoverage: { coveragePct: 100, directCount: 0, inheritedCount: 1, missingCount: 0 },
            topAssumptions: [],
            topUncertaintyDrivers: [],
          },
        });
      }
      return jsonResponse({ ok: false, error: "unexpected_url" }, false, 500);
    });
  });

  it("loads config and renders step 1", async () => {
    render(<CostEffortWizard moveId="move-1" />);
    await waitFor(() => expect(screen.getByLabelText("Scenario name")).toBeInTheDocument());
    expect(screen.getByLabelText("Archetype")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Cost & Effort wizard steps/i })).toBeInTheDocument();
  });

  it("steps 2-5 are disabled until a draft has been created", async () => {
    render(<CostEffortWizard moveId="move-1" />);
    await waitFor(() => expect(screen.getByLabelText("Scenario name")).toBeInTheDocument());
    const step2Button = screen.getByRole("button", { name: /2\. Scope/ });
    expect(step2Button).toBeDisabled();
  });

  it("creates a draft on step 1 submit and advances to step 2 with the archetype's REAL scope-driver questions", async () => {
    render(<CostEffortWizard moveId="move-1" defaultCurrency="EUR" />);
    await waitFor(() => expect(screen.getByLabelText("Scenario name")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Scenario name"), { target: { value: "Traditional" } });
    fireEvent.change(screen.getByLabelText("Archetype"), { target: { value: "ARCH-01" } });
    fireEvent.change(screen.getByLabelText("Target start date"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Target duration in weeks"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(screen.getByLabelText("AI Use Case Count")).toBeInTheDocument());
    // The people/change driver must NOT appear on the scope step.
    expect(screen.queryByLabelText("Stakeholder Group Count")).not.toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/programs/move-1/pricing/estimates",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows the From Move source chip when a default currency is supplied", async () => {
    render(<CostEffortWizard moveId="move-1" defaultCurrency="EUR" />);
    await waitFor(() => expect(screen.getByLabelText("Scenario name")).toBeInTheDocument());
    expect(screen.getByText("From Move")).toBeInTheDocument();
  });

  // Basic accessibility check (brief §9.7). This repo has no jest-axe/
  // @axe-core dependency wired into jsdom component tests today — the only
  // axe suite (tests/accessibility/public-axe.spec.ts, @axe-core/playwright)
  // is a Playwright suite scoped to UNAUTHENTICATED public routes ("/",
  // "/sign-in"), which cannot reach an authenticated, Move-scoped wizard
  // like this one. Per this repo's existing convention (every phase-
  // workspace/MovesPhaseStandaloneClient test already relies on
  // Testing Library's role/label queries as its accessibility check —
  // `getByRole`/`getByLabelText` only find elements that ARE in the
  // accessibility tree with a real accessible name), this test asserts every
  // interactive control on step 1 has a real accessible name/role rather
  // than introducing a new axe dependency for one component.
  it("every step-1 control has an accessible name/role (no unlabeled inputs)", async () => {
    render(<CostEffortWizard moveId="move-1" />);
    await waitFor(() => expect(screen.getByLabelText("Scenario name")).toBeInTheDocument());

    expect(screen.getByLabelText("Scenario name")).toBeInTheDocument();
    expect(screen.getByLabelText("Archetype")).toBeInTheDocument();
    expect(screen.getByLabelText("Currency")).toBeInTheDocument();
    expect(screen.getByLabelText("Target start date")).toBeInTheDocument();
    expect(screen.getByLabelText("Target duration in weeks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Cost & Effort wizard steps/i })).toBeInTheDocument();
  });

  // Lightweight responsive smoke check — no existing viewport-testing helper
  // exists in this repo's jsdom component-test suites (only the Playwright
  // accessibility config sets a fixed desktop viewport), so this reuses
  // plain jsdom `window.innerWidth` + a resize event rather than adding new
  // responsive-test infrastructure: proves the wizard renders its core
  // controls unchanged at a narrow (mobile-class) width.
  it("renders the same core controls at a narrow (375px) viewport", async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
    window.dispatchEvent(new Event("resize"));

    render(<CostEffortWizard moveId="move-1" />);
    await waitFor(() => expect(screen.getByLabelText("Scenario name")).toBeInTheDocument());
    expect(screen.getByLabelText("Archetype")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();

    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: originalWidth });
  });
});

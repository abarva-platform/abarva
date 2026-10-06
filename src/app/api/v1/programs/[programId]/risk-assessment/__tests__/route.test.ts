/**
 * GET /api/v1/programs/:programId/risk-assessment — the declared-archetype
 * half of the risk-factor vocabulary join.
 *
 * The panel asks the thirteen D1-D5/E1-E8 factors in the DECLARED archetype's
 * words, and the declaration reaches it only through this response. Mocking
 * `fetch` in the panel's own suite cannot see this end of the wire, so the
 * route is pinned here: a declared Move's archetype is served, an undeclared
 * Move's is null, and the inputs/result/score are unchanged either way.
 */

const requireTenancyMock = jest.fn();
jest.mock("@/app/api/v1/programs/_auth", () => ({
  __esModule: true,
  requireTenancy: (...args: unknown[]) => requireTenancyMock(...args),
  tenancyErrorResponse: () =>
    Response.json({ error: "unauthorized" }, { status: 401 }),
}));

const getProgramByIdMock = jest.fn();
jest.mock("@/lib/programs/queries", () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

const isFeatureEnabledMock = jest.fn();
jest.mock("@/lib/features/is-feature-enabled", () => ({
  __esModule: true,
  isFeatureEnabled: (...args: unknown[]) => isFeatureEnabledMock(...args),
}));

jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  __esModule: true,
  getProgramsRouteSupabase: async () => ({ supabase: { from: jest.fn() } }),
}));

import { NextRequest } from "next/server";
import { GET } from "../route";

const PROGRAM_ID = "program-abc";
const CTX = { clientId: "client-1", userId: "user-1", role: "maestro" };

const SAVED_INPUTS = {
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
};

function makeRequest(): NextRequest {
  return new NextRequest(
    `http://localhost/api/v1/programs/${PROGRAM_ID}/risk-assessment`,
  );
}

async function callGet() {
  const res = await GET(makeRequest(), {
    params: Promise.resolve({ programId: PROGRAM_ID }),
  });
  return { res, body: (await res.json()) as Record<string, unknown> };
}

beforeEach(() => {
  requireTenancyMock.mockReset();
  getProgramByIdMock.mockReset();
  isFeatureEnabledMock.mockReset();
  requireTenancyMock.mockResolvedValue(CTX);
  isFeatureEnabledMock.mockReturnValue(true);
});

describe("GET risk-assessment · declared archetype", () => {
  it("serves the archetype a Move declared in its charter classification", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: PROGRAM_ID,
      charter: {
        classification: { archetype: "governed_data_foundation" },
        p2_risk_tier_inputs_v1: SAVED_INPUTS,
      },
    });
    const { res, body } = await callGet();
    expect(res.status).toBe(200);
    expect(body.archetypeId).toBe("governed_data_foundation");
  });

  it("serves null for a Move that has declared nothing", async () => {
    getProgramByIdMock.mockResolvedValue({ id: PROGRAM_ID, charter: {} });
    const { body } = await callGet();
    expect(body.archetypeId).toBeNull();
  });

  it("serves the saved inputs and a freshly computed result alongside it", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: PROGRAM_ID,
      charter: {
        classification: { archetype: "governed_data_foundation" },
        p2_risk_tier_inputs_v1: SAVED_INPUTS,
      },
    });
    const { body } = await callGet();
    expect(body.ok).toBe(true);
    expect(body.inputs).toEqual(SAVED_INPUTS);
    expect(body.result).toMatchObject({ band: expect.any(String) });
  });

  it("scores a declared Move and an undeclared Move with the same answers identically", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: PROGRAM_ID,
      charter: {
        classification: { archetype: "governed_data_foundation" },
        p2_risk_tier_inputs_v1: SAVED_INPUTS,
      },
    });
    const declared = (await callGet()).body;

    getProgramByIdMock.mockResolvedValue({
      id: PROGRAM_ID,
      charter: { p2_risk_tier_inputs_v1: SAVED_INPUTS },
    });
    const undeclared = (await callGet()).body;

    expect(declared.archetypeId).not.toEqual(undeclared.archetypeId);
    expect(declared.result).toEqual(undeclared.result);
    expect(declared.inputs).toEqual(undeclared.inputs);
  });

  it("serves no inputs and no result when the Move has no saved assessment", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: PROGRAM_ID,
      charter: { classification: { archetype: "governed_data_foundation" } },
    });
    const { body } = await callGet();
    expect(body.inputs).toBeNull();
    expect(body.result).toBeNull();
    expect(body.archetypeId).toBe("governed_data_foundation");
  });

  it("still refuses a tenant without the flag", async () => {
    isFeatureEnabledMock.mockReturnValue(false);
    const { res, body } = await callGet();
    expect(res.status).toBe(404);
    expect(body.error).toBe("not_enabled");
    expect(getProgramByIdMock).not.toHaveBeenCalled();
  });

  it("still 404s an unknown Move", async () => {
    getProgramByIdMock.mockResolvedValue(null);
    const { res, body } = await callGet();
    expect(res.status).toBe(404);
    expect(body.error).toBe("not_found");
  });
});

/**
 * Behavioral test for the `intelligence-pattern-to-move-promotion-submit`
 * control declared in docs/security/ai-surface-control-catalog.json.
 *
 * The control guards the moment an AI suggestion becomes a real program: a
 * brief originating from an Intelligence pattern cannot be submitted unless a
 * human explicitly accepts decision responsibility, gives a rationale, and
 * names the evidence they relied on.
 *
 * The catalog checker proves those names appear in executable code. It cannot
 * prove the code is reached. This calls the real `submitOriginationBrief` and
 * asserts the refusal happens before anything is written — the proof is that
 * `requireTenancy` was never reached, which is the first thing the function
 * does after the gate.
 */

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({
    userId: "user-1",
    clientKey: "tenant-a",
    clientId: "tenant-a",
    role: "client_admin",
  })),
  TenancyError: class TenancyError extends Error {
    code = "unauthenticated";
  },
}));

import { submitOriginationBrief } from "../origination-submit";
import { requireTenancy } from "@/lib/auth/tenancy";

const mockRequireTenancy = jest.mocked(requireTenancy);

const PROMOTION_RATIONALE =
  "The sponsor reviewed the matched pattern against our own denial data and accepted it as the basis for this program.";

/** A brief carrying both fields is a promotion from an Intelligence pattern. */
function promotionBrief(extra: Record<string, unknown> = {}) {
  return {
    programName: "Denials recovery program",
    problemStatement:
      "Denial write-offs are rising faster than collections across the network.",
    sponsor: "CFO",
    originatingIntelligenceSessionId: "session-1",
    matchedPatternId: "PAT-AI-004",
    ...extra,
  } as never;
}

async function submitError(brief: never): Promise<{ code: string } | null> {
  try {
    await submitOriginationBrief(brief);
    return null;
  } catch (error) {
    const code = (error as { code?: string }).code;
    return { code: code ?? String(error) };
  }
}

describe("origination submit · intelligence promotion gate", () => {
  beforeEach(() => {
    mockRequireTenancy.mockClear();
  });

  it("refuses a promotion with no human acceptance, before touching anything", async () => {
    const result = await submitError(promotionBrief());

    expect(result?.code).toBe("intelligence_promotion_approval_required");
    // The gate runs before authentication, which is the first step after it.
    expect(mockRequireTenancy).not.toHaveBeenCalled();
  });

  it("refuses an acceptance with no real rationale", async () => {
    const result = await submitError(
      promotionBrief({
        humanPromotionAccepted: true,
        humanPromotionRationale: "ok",
        promotionEvidenceRefs: ["EV-1"],
      }),
    );

    expect(result?.code).toBe("intelligence_promotion_approval_required");
    expect(mockRequireTenancy).not.toHaveBeenCalled();
  });

  it("refuses an accepted, justified promotion that names no evidence", async () => {
    const result = await submitError(
      promotionBrief({
        humanPromotionAccepted: true,
        humanPromotionRationale: PROMOTION_RATIONALE,
      }),
    );

    expect(result?.code).toBe("intelligence_promotion_approval_required");
    expect(mockRequireTenancy).not.toHaveBeenCalled();
  });

  it("does not demand promotion approval for a brief that came from no pattern", async () => {
    // A blanket gate would be its own defect: it would train people to accept
    // responsibility reflexively on briefs that no AI suggestion produced.
    const result = await submitError({
      programName: "Denials recovery program",
      problemStatement:
        "Denial write-offs are rising faster than collections across the network.",
      sponsor: "CFO",
    } as never);

    expect(result?.code).not.toBe("intelligence_promotion_approval_required");
  });

  it("lets a fully approved promotion past the gate", async () => {
    const result = await submitError(
      promotionBrief({
        humanPromotionAccepted: true,
        humanPromotionRationale: PROMOTION_RATIONALE,
        promotionEvidenceRefs: ["EV-1", "EV-2"],
      }),
    );

    // Whatever happens downstream in this unit context, the gate is not what
    // stopped it, and authentication was reached.
    expect(result?.code).not.toBe("intelligence_promotion_approval_required");
    expect(mockRequireTenancy).toHaveBeenCalled();
  });
});

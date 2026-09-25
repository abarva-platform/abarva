/**
 * @jest-environment jsdom
 */

/**
 * Item U-517. The event approval page called
 * `formatSourceFinancialValue(row.estimated_value_usd, true)` with the literal
 * `true`. That argument is `canViewFinancialValues`, and it is the only thing
 * that makes the helper return `RESTRICTED_SOURCE_FINANCIAL_LABEL` instead of
 * the figure — so a viewer whose policy restricts exact financial values was
 * shown the exact figure. The page already loads
 * `loadUserSourceAccessPolicy` a few lines above for a different question, so
 * the policy object was in hand and simply not asked.
 *
 * Three directions are asserted, because one of them alone would pass a
 * page that is always-restrict or always-reveal:
 *
 *   1. a RESTRICTED viewer sees `Restricted` and does NOT see the amount
 *   2. a PERMITTED viewer sees the amount
 *   3. an UNREADABLE policy restricts — fail CLOSED, not open
 *
 * Every assertion is made against RENDERED DOM, not against the file
 * containing a symbol. A byte-scan for `canViewFinancialValues` would have
 * stayed green over the literal this item is about, since the literal sits in
 * the argument position of exactly that name.
 */
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { getSourceJourneyForEvent } from "@/lib/source/sourcing-motion-journeys";

// The event detail route's module graph reaches `pg`, which needs Node's
// TextEncoder/TextDecoder — absent from this jsdom environment. Supplying them
// is cheaper than splitting these cases into a second suite, and the route
// never opens a connection here: its data client is mocked below.
import { TextDecoder, TextEncoder } from "node:util";

Object.assign(globalThis, { TextEncoder, TextDecoder });

jest.mock("server-only", () => ({}));

jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/source/SourceSubNav", () => ({
  SourceSubNav: () => null,
}));
jest.mock("@/components/source/SourceWorkingPane", () => ({
  SourceWorkingPane: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound() was called; the fixture should not reach it");
  },
  redirect: (href: string) => {
    throw new Error(
      `redirect(${href}) was called; the fixture should not reach it`,
    );
  },
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

const getActiveClientRow = jest.fn();
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: (...args: unknown[]) => getActiveClientRow(...args),
}));

const getSourcingEvent = jest.fn();
jest.mock("@/lib/source/queries", () => ({
  getSourcingEvent: (...args: unknown[]) => getSourcingEvent(...args),
  isUuid: (value: unknown) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    ),
}));

const requireTenancy = jest.fn();
jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: (...args: unknown[]) => requireTenancy(...args),
}));

const loadUserSourceAccessPolicy = jest.fn();
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: (...args: unknown[]) =>
    loadUserSourceAccessPolicy(...args),
}));

let persistedEventRow: Record<string, unknown> | null = null;
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: async () => ({ data: persistedEventRow, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

jest.mock("@/lib/source/artifact-registry", () => ({
  listSourceArtifactsForSourceEventId: jest.fn(async () => []),
}));
jest.mock("@/lib/source/artifact-acceptances", () => ({
  getLatestArtifactAcceptancesByArtifactIds: jest.fn(async () => new Map()),
}));
jest.mock("@/lib/source/approval-ledger", () => ({
  loadApprovalLedger: jest.fn(async () => []),
}));
jest.mock("@/lib/source/contract-optimization/read", () => ({
  getContractOptimizationProfile: jest.fn(async () => null),
}));
jest.mock("@/lib/source/new-workspace/authority-version-store", () => ({
  readSourceAuthorityVersionState: jest.fn(async () => ({
    kind: "unavailable" as const,
  })),
}));
jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: jest.fn(() => false),
}));

const CLIENT = { key: "meridian-grid", name: "Meridian Grid" };

const EVENT_ROW = {
  id: "11111111-2222-4333-8444-555555555555",
  client_key: "meridian-grid",
  event_code: "SRC-0042",
  event_name: "Network operations managed service",
  event_type: "managed_service",
  sourcing_motion: "competitive_rfp",
  current_stage_key: "intake",
  lifecycle_state: "waiting_on_client",
  linked_program_id: null,
  estimated_value_usd: 4_200_000,
  trigger_description: "Incumbent term expires and scope has drifted.",
  scope_description: "Scope boundary: Tier 1 and Tier 2 network operations.",
  decision_owner: "VP Network Operations",
  created_by_user_id: "user-7",
  created_at: "2026-02-03T10:00:00.000Z",
  updated_at: "2026-02-04T10:00:00.000Z",
};

async function renderEventApproval() {
  const { default: SourceEventApprovalPage } = await import(
    "@/app/(maestro)/source/events/[eventId]/approval/page"
  );
  render(
    await SourceEventApprovalPage({
      params: Promise.resolve({ eventId: EVENT_ROW.id }),
    }),
  );
}

/**
 * The page renders the value-target fact TWICE — once in the brief `<dl>` and
 * once inside `IntakeFactsReview`. Both are read, because a fix applied to one
 * rendering would leave the other printing the figure.
 */
function valueTargetRenderings(): string[] {
  const labels = screen.getAllByText("Value or savings target");
  expect(labels.length).toBeGreaterThan(0);
  return labels.map((label) => label.parentElement?.textContent ?? "");
}

beforeEach(() => {
  jest.clearAllMocks();
  persistedEventRow = { ...EVENT_ROW };
  getActiveClientRow.mockResolvedValue(CLIENT);
  requireTenancy.mockResolvedValue({
    userId: "user-7",
    clientKey: "meridian-grid",
  });
  getSourcingEvent.mockResolvedValue({
    id: EVENT_ROW.id,
    code: EVENT_ROW.event_code,
    name: EVENT_ROW.event_name,
    accountName: "Meridian Grid",
  });
});

describe("U-517 · the event approval page restricts the figure a policy restricts", () => {
  it("shows Restricted and not the amount to a viewer whose policy denies exact financial values", async () => {
    loadUserSourceAccessPolicy.mockResolvedValue({
      canApproveSourceStages: true,
      canViewFinancialData: false,
    });

    await renderEventApproval();

    const renderings = valueTargetRenderings();
    expect(renderings).toHaveLength(2);
    for (const text of renderings) {
      expect(text).toContain("Restricted");
      expect(text).not.toContain("$4.2M");
      expect(text).not.toContain("4,200,000");
    }
  });

  it("shows the amount to a viewer whose policy permits exact financial values", async () => {
    loadUserSourceAccessPolicy.mockResolvedValue({
      canApproveSourceStages: true,
      canViewFinancialData: true,
    });

    await renderEventApproval();

    const renderings = valueTargetRenderings();
    expect(renderings).toHaveLength(2);
    for (const text of renderings) {
      expect(text).toContain("$4.2M");
      expect(text).not.toContain("Restricted");
    }
  });

  it("fails CLOSED when the policy cannot be read at all", async () => {
    loadUserSourceAccessPolicy.mockRejectedValue(
      new Error("policy read failed"),
    );

    await renderEventApproval();

    const renderings = valueTargetRenderings();
    expect(renderings).toHaveLength(2);
    for (const text of renderings) {
      expect(text).toContain("Restricted");
      expect(text).not.toContain("$4.2M");
    }
  });
});

/**
 * The same literal lived in `deriveStrategyIntakeFacts`, which the event
 * detail route calls for the Strategy (P0) stage — the in-canvas mirror of the
 * page above, documented as such in its own header. The flag is now a REQUIRED
 * parameter there rather than a defaulted one, so a caller cannot reach the
 * old behaviour by omission; these two cases assert the derivation moves with
 * it in both directions.
 */
describe("U-517 · the mirrored Strategy derivation restricts the same field", () => {
  const STRATEGY_ROW = {
    decision_owner: "VP Network Operations",
    trigger_description: "Incumbent term expires and scope has drifted.",
    scope_description: "Scope boundary: Tier 1 and Tier 2 network operations.",
    estimated_value_usd: 4_200_000,
  };

  it("restricts the value thesis for a denied viewer", async () => {
    const { deriveStrategyIntakeFacts } = await import(
      "@/lib/source/facts/view/strategy-stage-builder"
    );

    expect(deriveStrategyIntakeFacts(STRATEGY_ROW, false).valueThesis).toBe(
      "Restricted",
    );
  });

  it("renders the value thesis for a permitted viewer", async () => {
    const { deriveStrategyIntakeFacts } = await import(
      "@/lib/source/facts/view/strategy-stage-builder"
    );

    expect(deriveStrategyIntakeFacts(STRATEGY_ROW, true).valueThesis).toContain(
      "$4.2M",
    );
  });

  it("leaves an intake-authored value target alone in both directions", async () => {
    const { deriveStrategyIntakeFacts } = await import(
      "@/lib/source/facts/view/strategy-stage-builder"
    );
    const row = {
      ...STRATEGY_ROW,
      scope_description:
        "Scope boundary: Tier 1 and Tier 2 network operations.\nValue target: Hold contracted annual value flat.",
    };

    for (const permitted of [true, false]) {
      expect(deriveStrategyIntakeFacts(row, permitted).valueThesis).toBe(
        "Hold contracted annual value flat.",
      );
    }
  });
});

/**
 * The event detail route is the OTHER caller, and it is the one a mutation
 * could quietly re-break: `deriveStrategyIntakeFacts(row, true)` typechecks,
 * so the required parameter alone does not guard this call site. These cases
 * invoke the route's own strategy builder with the three policy answers and
 * read the value thesis out of the StageAnalyticsView it returns, which is the
 * model the canvas renders from.
 */
describe("U-517 · the event detail route resolves the flag it passes", () => {
  const JOURNEY = getSourceJourneyForEvent({ sourcingMotion: "competitive_rfp" });

  async function strategyValueThesis(): Promise<string> {
    const { buildStrategyStageForRoute } = await import(
      "@/app/(maestro)/source/events/[eventId]/page"
    );
    const view = await buildStrategyStageForRoute(
      EVENT_ROW.id,
      CLIENT.key,
      "strategy",
      JOURNEY,
    );
    const rows = view?.tasks?.[0]?.rows ?? [];
    const thesis = rows.find((row) => row.key === "Value thesis");
    expect(thesis).toBeDefined();
    return thesis!.value;
  }

  it("restricts the value thesis for a denied viewer", async () => {
    loadUserSourceAccessPolicy.mockResolvedValue({
      canApproveSourceStages: true,
      canViewFinancialData: false,
    });

    expect(await strategyValueThesis()).toBe("Restricted");
  });

  it("renders the value thesis for a permitted viewer", async () => {
    loadUserSourceAccessPolicy.mockResolvedValue({
      canApproveSourceStages: true,
      canViewFinancialData: true,
    });

    expect(await strategyValueThesis()).toContain("$4.2M");
  });

  it("fails CLOSED when the policy cannot be read", async () => {
    loadUserSourceAccessPolicy.mockRejectedValue(new Error("policy read failed"));

    expect(await strategyValueThesis()).toBe("Restricted");
  });
});

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { StrategicMoveHomeSource } from "@/components/strategic-moves/moves-home-mapper";

jest.mock("@/lib/auth/server-module-access", () => ({
  requireProductModule: jest.fn(async () => undefined),
}));
jest.mock("@/lib/programs/strategic-moves-context", () => ({
  getStrategicMovesTenancy: jest.fn(async () => ({ clientId: "test-client" })),
}));
jest.mock("@/lib/programs/queries", () => ({
  getStrategicMovePortfolio: jest.fn(),
}));
jest.mock("@/lib/programs/effective-move-phase", () => ({
  applyEffectivePhasesToPortfolio: jest.fn(
    async (_ctx, portfolio) => portfolio,
  ),
}));
jest.mock("@/lib/programs/strategic-moves-preferences", () => ({
  DEFAULT_STRATEGIC_MOVES_PREFERENCES: {},
  getStrategicMovesPreferences: jest.fn(async () => ({})),
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => null),
}));
jest.mock("@/lib/programs/canonical-portfolio-reconciliation", () => ({
  buildPortfolioReconciliation: jest.fn(async () => null),
}));
jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: jest.fn(),
}));
jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/strategic-moves/StrategicMovesHomeClient", () => ({
  StrategicMovesHomeClient: () => <div>Legacy portfolio</div>,
}));

import Page from "@/app/(maestro)/strategic-moves/page";
import { getStrategicMovePortfolio } from "@/lib/programs/queries";
import { buildPortfolioReconciliation } from "@/lib/programs/canonical-portfolio-reconciliation";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";

type FixtureMove = StrategicMoveHomeSource & { archived: boolean };

function move(id: string, overrides: Partial<FixtureMove> = {}): FixtureMove {
  return {
    id,
    displayCode: id,
    name: `Move ${id}`,
    currentPhase: 1,
    phaseLabel: "P1 Charter",
    terminalComplete: false,
    status: { key: "on_track", text: "On track", description: "Review scope." },
    statusColor: "green",
    sponsor: null,
    valueAtStake: null,
    updatedAt: null,
    archived: false,
    ...overrides,
  };
}

let rows: FixtureMove[];

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(isFeatureEnabled).mockReturnValue(true);
  rows = [
    move("active", { statusColor: "amber" }),
    move("complete", { terminalComplete: true, statusColor: "teal" }),
    move("archived", {
      archived: true,
      statusColor: "amber",
      valueAtStake: {
        projected: { low: 100, high: 200, currency: "USD" },
        verified: null,
      },
    }),
  ];
  // Model the query's active/all read contract, not a second UI filter.
  jest.mocked(getStrategicMovePortfolio).mockImplementation(
    async (_ctx, opts) =>
      ({
        moves: rows.filter((row) => opts?.includeArchived || !row.archived),
      }) as unknown as Awaited<ReturnType<typeof getStrategicMovePortfolio>>,
  );
});

it("excludes archived records from the rendered landing and all its denominators", async () => {
  const html = renderToStaticMarkup(await Page());

  expect(getStrategicMovePortfolio).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ includeArchived: false }),
  );
  expect(html).toContain("1 move in flight · 1 waiting on a decision");
  expect(html).toContain("0 of 2 moves have declared value");
  expect(html).toContain("Move active");
  expect(html).toContain("Move complete");
  expect(html).not.toContain("Move archived");
  expect(html).toContain('href="/strategic-moves/manage"');
  expect(buildPortfolioReconciliation).toHaveBeenCalledWith(null, [
    "Move active",
    "Move complete",
  ]);
});

it("renders an empty active portfolio when every record is archived", async () => {
  rows = rows.filter((row) => row.archived);
  const html = renderToStaticMarkup(await Page());

  expect(html).toContain("0 moves in flight");
  expect(html).toContain("No moves yet.");
  expect(html).not.toContain("Move archived");
  expect(html).not.toContain("Waiting on you");
});

it("includes a restored record again without changing the archive query contract", async () => {
  rows[2] = { ...rows[2], archived: false };
  const html = renderToStaticMarkup(await Page());

  expect(html).toContain("2 moves in flight · 2 waiting on a decision");
  expect(html).toContain("1 of 3 moves have declared value");
  expect(html).toContain("Move archived");
});

it("preserves archived records for the legacy landing's Archived filter", async () => {
  jest.mocked(isFeatureEnabled).mockReturnValue(false);
  const html = renderToStaticMarkup(await Page());

  expect(getStrategicMovePortfolio).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ includeArchived: true }),
  );
  expect(html).toContain("Legacy portfolio");
});

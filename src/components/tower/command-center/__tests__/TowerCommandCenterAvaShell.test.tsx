/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { TowerCommandCenterAvaShell } from "../TowerCommandCenterAvaShell";

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: (...args: unknown[]) => replace(...args) }),
  usePathname: () => "/tower",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <actual.ResponsiveContainer width={800} height={400}>
        {children}
      </actual.ResponsiveContainer>
    ),
  };
});

const view = buildTowerCommandCenterView(designFixtureMart(), {
  tenantName: "Meridian",
})!;

describe("TowerCommandCenterAvaShell", () => {
  beforeEach(() => {
    replace.mockClear();
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  it("wraps the Command Center in the same collapsed Tower aVa launcher", async () => {
    render(
      <TowerCommandCenterAvaShell
        view={view}
        tenantName="Meridian"
        clientId="meridian"
        clientKey="meridian"
      />,
    );

    expect(screen.getByTestId("tower-command-center")).toBeInTheDocument();
    expect(screen.getByTestId("agent-dock-collapsed-chip")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("agent-dock-collapsed-chip"));

    await waitFor(() =>
      expect(screen.getByTestId("agent-dock-form")).toBeInTheDocument(),
    );
    expect(screen.getByPlaceholderText(/Ask aVa/)).toBeInTheDocument();
    expect(
      screen.getByText(/aVa can explain the visible value proof/i),
    ).toBeInTheDocument();
  });

  it("posts Tower questions to the current chat route with the selected client key", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      body: null,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({
        response: "Answer from Tower.",
        modelOutput: {
          version: "cio_tower_visible_answer_v1",
          answer: "Answer from Tower.",
          tables: [],
          tabs: [],
          followUpQuestion: null,
        },
        traceKey: "trace-1",
        validationStatus: "passed",
      }),
    });
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchMock,
    });

    render(
      <TowerCommandCenterAvaShell
        view={view}
        tenantName="Meridian"
        clientId="client-id"
        clientKey="selected-client"
      />,
    );

    fireEvent.click(screen.getByTestId("agent-dock-collapsed-chip"));
    await waitFor(() =>
      expect(screen.getByTestId("agent-dock-form")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByTestId("agent-dock-input"), {
      target: { value: "What value is claimable?" },
    });
    fireEvent.submit(screen.getByTestId("agent-dock-form"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tower/chat",
      expect.objectContaining({
        method: "POST",
        body: expect.any(String),
      }),
    );
    expect(
      JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)),
    ).toMatchObject({
      message: "What value is claimable?",
      clientKey: "selected-client",
      stream: true,
      pageContext: {
        activeTab: "verdict",
        activeTabLabel: "Today's verdict",
      },
    });
  });
});

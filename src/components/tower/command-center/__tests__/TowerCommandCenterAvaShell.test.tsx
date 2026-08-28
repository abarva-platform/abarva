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
    window.localStorage.clear();
  });

  it("wraps the Command Center in the same collapsed Tower aVa launcher", async () => {
    render(
      <TowerCommandCenterAvaShell
        view={view}
        tenantName="Meridian"
        clientId="meridian"
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
});

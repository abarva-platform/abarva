/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import type { ElementType, ReactNode } from "react";

import { readSkyHarborAiSuccessHome } from "@/lib/home/readSkyHarborAiSuccessHome";

import { AiSuccessCommandCenter } from "../AiSuccessCommandCenter";

jest.mock("recharts", () => {
  const passthrough =
    (tag: ElementType = "div") =>
    function RechartsPassthrough({ children }: { children?: ReactNode }) {
      const Tag = tag;
      return <Tag>{children}</Tag>;
    };

  return {
    Bar: passthrough(),
    BarChart: passthrough(),
    CartesianGrid: passthrough(),
    Cell: passthrough(),
    Funnel: passthrough(),
    FunnelChart: passthrough(),
    LabelList: passthrough(),
    ResponsiveContainer: passthrough(),
    Tooltip: passthrough(),
    XAxis: passthrough(),
    YAxis: passthrough(),
  };
});

jest.mock("@/components/architecture/CurrentStateArchitectureMap", () => ({
  CurrentStateArchitectureMap: () => <div>Architecture map</div>,
}));

describe("AiSuccessCommandCenter tool usage drill", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  it("opens source-backed tool usage detail on double click", () => {
    render(<AiSuccessCommandCenter data={readSkyHarborAiSuccessHome()} />);

    fireEvent.click(
      screen.getByRole("button", { name: /06 value realization/i }),
    );

    expect(screen.getByText(/Tool usage is a telemetry lens/i)).toBeTruthy();
    expect(screen.getByText(/480/)).toBeTruthy();
    expect(
      screen.getAllByText(/active-user observations/i).length,
    ).toBeGreaterThan(0);

    fireEvent.doubleClick(screen.getByRole("button", { name: /SAP Joule/i }));

    expect(screen.getByRole("heading", { name: "SAP Joule" })).toBeTruthy();
    expect(screen.getByText("Tool usage drill")).toBeTruthy();
    expect(
      screen.getByText("Aggregated tool-period observations for this tool"),
    ).toBeTruthy();
    expect(screen.getByText(/HOME-EVID-/)).toBeTruthy();
    expect(
      screen.getAllByText(/10_ai_adoption_usage.csv/).length,
    ).toBeGreaterThan(0);
  });
});

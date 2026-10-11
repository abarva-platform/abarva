/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { ModelAuthoredExhibits } from "../ModelAuthoredExhibits";
import { modelAuthoredAnswerPacket } from "@/lib/intelligence/answer/model-authored-answer";

jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    BarChart: ({ data }: { data: unknown }) => (
      <div data-testid="bar-data">{JSON.stringify(data)}</div>
    ),
    LineChart: ({ data }: { data: unknown }) => (
      <div data-testid="line-data">{JSON.stringify(data)}</div>
    ),
  };
});

const packet = (chart: unknown) =>
  modelAuthoredAnswerPacket(
    `Decision.\n\n\`\`\`chart\n${JSON.stringify(chart)}\n\`\`\``,
    "Compare",
    "test",
    [],
  );
it.each(["bar", "horizontal-bar", "line"])(
  "sends every authored %s value to Recharts unchanged",
  (kind) => {
    const data = [
      { label: "Zero", value: 0 },
      { label: "Negative", value: -12.5 },
      { label: "Positive", value: 19.25 },
    ];
    const answer = packet({
      id: "actuals",
      title: "Supplied values",
      kind,
      xKey: "label",
      yKey: "value",
      data,
    });
    const raw = answer.modelAuthored!.rawText;
    const { container } = render(<ModelAuthoredExhibits answer={answer} />);
    expect(
      container.querySelector('[data-chart-renderer="recharts"]'),
    ).not.toBeNull();
    expect(
      screen.getByTestId(kind === "line" ? "line-data" : "bar-data")
        .textContent,
    ).toBe(JSON.stringify(data));
    expect(screen.getByText("Negative: -12.5")).toBeTruthy();
    expect(answer.modelAuthored!.rawText).toBe(raw);
  },
);
it("renders authored qualitative tradeoffs with their evidence caveat and no numeric scores", () => {
  const answer = packet({
    id: "bets",
    kind: "quadrant-matrix",
    title: "Tradeoffs",
    subtitle: "Advisory judgment; validate before investment",
    xKey: "Effort",
    yKey: "Potential",
    data: [
      {
        label: "Assist",
        Effort: "low",
        Potential: "high",
        reason: "Needs economics",
      },
      {
        label: "Platform",
        Effort: "high",
        Potential: "high",
        reason: "Needs proof",
      },
    ],
  });
  const { container } = render(<ModelAuthoredExhibits answer={answer} />);
  expect(
    container.querySelector('[data-chart-renderer="categorical-matrix"]'),
  ).not.toBeNull();
  expect(screen.getByText("Assist")).toBeTruthy();
  expect(screen.getByText("reason: Needs economics")).toBeTruthy();
  expect(
    screen.getByText("Advisory judgment; validate before investment"),
  ).toBeTruthy();
  expect(container.textContent).not.toMatch(/\d+%/);
});

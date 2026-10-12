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

it("shows readable source names without rendering transport code badges", () => {
  const raw = 'Decision.\n\n```sources\n["S2"]\n```';
  const answer = modelAuthoredAnswerPacket(raw, "Decide", "test", [
    { id: "unused", type: "TENANT", name: "Unused", detail: "" },
    { id: "plan", type: "TENANT", name: "Reviewed operating plan", detail: "Decision evidence" },
  ]);
  const { container } = render(<ModelAuthoredExhibits answer={answer} />);
  expect(screen.getByText("Sources")).toBeTruthy();
  expect(screen.getByText("Reviewed operating plan")).toBeTruthy();
  expect(container.textContent).not.toContain("S2");
  expect(answer.modelAuthored?.rawText).toBe(raw);
});
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
    container.querySelector('[data-chart-renderer="svg-matrix"]'),
  ).not.toBeNull();
  expect(screen.getAllByText("Assist")).toHaveLength(2);
  expect(screen.getByText("Needs economics")).toBeTruthy();
  expect(
    screen.getByText("Advisory judgment; validate before investment"),
  ).toBeTruthy();
  expect(container.textContent).not.toMatch(/\d+%/);
});

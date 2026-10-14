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
    {
      id: "plan",
      type: "TENANT",
      name: "Reviewed operating plan",
      detail: "Decision evidence",
    },
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

it("bounds compact numeric charts and keeps all original data in a disclosure", () => {
  const answer = packet({
    id: "measure",
    kind: "horizontal-bar",
    title: "Measured mix",
    xKey: "label",
    yKey: "value",
    unit: "%",
    data: [
      { label: "First", value: 60 },
      { label: "Second", value: 40 },
    ],
    sourceNote: "Declared shares, not measured benefits",
  });
  const { container } = render(
    <ModelAuthoredExhibits answer={answer} compact />,
  );
  expect(
    container.querySelector<HTMLElement>('[data-chart-frame="numeric"]')?.style
      .height,
  ).toBe("clamp(220px, 30dvh, 300px)");
  const details = screen.getByText("Chart data").closest("details");
  expect(details?.open).toBe(false);
  expect(details?.textContent).toContain("First: 60");
  expect(
    screen.getByText("Declared shares, not measured benefits"),
  ).toBeTruthy();
});

it("keeps compact matrix labels legible and all rationale available without changing the packet", () => {
  const data = Array.from({ length: 8 }, (_, i) => ({
    label: `Option ${i + 1}`,
    Effort: "low",
    Potential: "high",
    reason: `Constraint ${i + 1}`,
    Gate: `Evidence ${i + 1}`,
  }));
  const answer = packet({
    id: "tradeoff",
    kind: "quadrant-matrix",
    title: "Options",
    xKey: "Effort",
    yKey: "Potential",
    data,
    subtitle: "Advisory judgment, not verified value",
  });
  const before = JSON.stringify(answer);
  const { container } = render(
    <ModelAuthoredExhibits answer={answer} compact />,
  );
  expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
    "0 0 500 340",
  );
  const circles = Array.from(container.querySelectorAll("circle"));
  expect(circles).toHaveLength(8);
  expect(
    new Set(
      circles.map((c) => `${c.getAttribute("cx")}:${c.getAttribute("cy")}`),
    ).size,
  ).toBe(8);
  expect(screen.getByLabelText("Options in the matrix").textContent).toContain(
    "Option 8",
  );
  expect(
    screen.getByText("Rationale & validation gates").closest("details")?.open,
  ).toBe(false);
  expect(screen.getByText("Gate: Evidence 8")).toBeTruthy();
  expect(JSON.stringify(answer)).toBe(before);
});

import { buildTowerChatAvaAnswerPacket } from "../tower-chat-artifacts";

const baseArgs = {
  tenantKey: "skyharbor",
  tenantName: "Airline Demo",
  response: null,
  validationStatus: "passed" as const,
  traceKey: "tower-chat-test-trace",
};

describe("buildTowerChatAvaAnswerPacket", () => {
  it("keeps Tower prose and renders model tables as Recharts-ready artifacts", () => {
    const packet = buildTowerChatAvaAnswerPacket({
      ...baseArgs,
      question: "Rank the top Tower value levers.",
      modelOutput: {
        answer: "Prioritize the two highest-value levers first.",
        tables: [
          {
            id: "value_levers",
            title: "Tower value levers",
            columns: ["Lever", "Annual value"],
            rows: [
              ["Contact center deflection", "$18M"],
              ["Maintenance automation", "$12M"],
              ["Crew recovery tooling", "$8M"],
            ],
          },
        ],
      },
      metricCards: [{ label: "Claimable value", value: "$38M" }],
    });

    expect(packet.surface).toBe("tower");
    expect(packet.directAnswer).toBe(
      "Prioritize the two highest-value levers first.",
    );
    expect(packet.tables).toHaveLength(2);
    expect(packet.charts).toHaveLength(1);
    expect(packet.charts?.[0]).toMatchObject({
      kind: "horizontal-bar",
      title: "Tower value levers",
      data: {
        xKey: "lever",
        yKey: "annual_value",
        unit: "usd",
      },
    });
    expect(
      (packet.charts?.[0]?.data as { data: Array<Record<string, unknown>> })
        .data[0]?.annual_value,
    ).toBe(18_000_000);
  });

  it("uses a line chart for trend-oriented Tower questions", () => {
    const packet = buildTowerChatAvaAnswerPacket({
      ...baseArgs,
      question: "Show the FY26 to FY28 value trend for the portfolio.",
      modelOutput: {
        answer: "The value trend steps up as evidence gates clear.",
        tables: [
          {
            id: "value_trend",
            title: "Portfolio value trend",
            columns: ["Year", "Committed value"],
            rows: [
              ["FY26", "$48M"],
              ["FY27", "$72M"],
              ["FY28", "$96M"],
            ],
          },
        ],
      },
    });

    expect(packet.charts?.[0]?.kind).toBe("line");
    expect(
      (packet.charts?.[0]?.data as { data: Array<Record<string, unknown>> })
        .data[2]?.committed_value,
    ).toBe(96_000_000);
  });

  it("uses a quadrant chart when the question asks for a 2x2 matrix", () => {
    const packet = buildTowerChatAvaAnswerPacket({
      ...baseArgs,
      question: "Rank these moves in a 2x2 matrix by value and complexity.",
      modelOutput: {
        answer: "The highest-value, lower-complexity moves should go first.",
        tables: [
          {
            id: "move_matrix",
            title: "Move priority matrix",
            columns: ["Move", "Value score", "Complexity score"],
            rows: [
              ["Claims automation", "85", "45"],
              ["Data foundation", "70", "80"],
              ["Agent assist", "78", "50"],
            ],
          },
        ],
      },
    });

    expect(packet.charts?.[0]?.kind).toBe("quadrant-matrix");
    expect(
      (packet.charts?.[0]?.data as { points: Array<Record<string, unknown>> })
        .points,
    ).toContainEqual({ label: "Claims automation", x: 85, y: 45 });
  });
});

import { buildAvaIntakeResponseParts } from "../ava-intake-response-parts";

describe("buildAvaIntakeResponseParts", () => {
  const fields = [
    {
      id: "trigger",
      label: "Which contract & renewal date",
      prompt: "Which contract is renewing, and what is the deadline?",
    },
    {
      id: "decisionOwner",
      label: "Renewal decision owner",
      prompt: "Who decides whether to renew, renegotiate, or compete?",
    },
  ];

  it("builds structured Ava intake text, metrics, table, chart, and next action", () => {
    const parts = buildAvaIntakeResponseParts({
      body: "Five fields unlock the intake.",
      fields,
      capturedIds: new Set(["trigger"]),
      routeLabel: "Renewal Cockpit",
    });

    expect(parts.map((part) => part.type)).toEqual([
      "text",
      "metricStrip",
      "table",
      "barChart",
      "nextAction",
    ]);
    expect(parts[0]).toMatchObject({
      type: "text",
      title: "Ava sourcing read",
      text: "Five fields unlock the intake.",
    });
    expect(parts[1]).toMatchObject({
      type: "metricStrip",
      metrics: expect.arrayContaining([
        expect.objectContaining({ label: "Facts captured", value: "1/2" }),
        expect.objectContaining({ label: "Next surface", value: "Renewal Cockpit" }),
      ]),
    });
    expect(parts[2]).toMatchObject({
      type: "table",
      rows: [
        ["Which contract & renewal date", "Captured", fields[0].prompt],
        ["Renewal decision owner", "Needed", fields[1].prompt],
      ],
    });
    expect(parts[3]).toMatchObject({
      type: "barChart",
      bars: [
        expect.objectContaining({ label: "Captured", value: 1 }),
        expect.objectContaining({ label: "Open", value: 1 }),
      ],
    });
    expect(parts[4]).toMatchObject({
      type: "nextAction",
      confidence: "medium",
    });
  });
});

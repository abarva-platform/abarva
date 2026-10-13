import {
  decodeModelAuthoredAnswer,
  isIntactModelAuthoredPacket,
  measureExecutiveAnswer,
  modelAuthoredAnswerPacket,
  modelAuthoredStreamingProse,
} from "../model-authored-answer";

const table = {
  id: "priority",
  title: "Decision",
  columns: [
    { key: "option", label: "Option" },
    { key: "action", label: "Action" },
  ],
  rows: [{ option: "Assist", action: "Validate first" }],
  citationIds: ["S1"],
};
const graph = {
  id: "deps",
  title: "Dependencies",
  nodes: [
    { id: "a", label: "Platform" },
    { id: "b", label: "Assist" },
  ],
  edges: [{ from: "a", to: "b", label: "feeds" }],
  citationIds: ["S1"],
};
const chart = {
  id: "trend",
  kind: "line",
  xKey: "period",
  yKey: "value",
  data: [
    { period: "A", value: 0 },
    { period: "B", value: -12.5 },
  ],
  unit: "USD",
  citationIds: ["S1"],
};
const fence = (kind: string, value: unknown) =>
  `\`\`\`${kind}\n${JSON.stringify(value)}\n\`\`\``;

it("previews prose through character-split exhibit and provenance blocks without exposing transport", () => {
  const opening = "Validate the opportunity.\n\n";
  const raw = `${opening}${fence("table", table)}\n\n${fence("chart", chart)}\n\n${fence("graph", graph)}\n\n${fence("sources", ["S1"])}\n\n${fence("followups", ["Which scope?", "Which baseline?", "Which decision?"])}\n\nNext decision.`;
  for (let i = opening.length; i <= raw.length; i += 1) {
    const preview = modelAuthoredStreamingProse(raw.slice(0, i));
    expect(preview).toContain(opening);
    expect(preview).not.toMatch(
      /`|citationIds|columns|sources|followups|S1|Which scope/,
    );
  }
  expect(modelAuthoredStreamingProse(raw)).toBe(
    decodeModelAuthoredAnswer(raw).prose,
  );
  expect(
    modelAuthoredStreamingProse(`${opening}\`\`\`table\n{bad JSON}\n\`\`\``),
  ).toBe(opening);
});

it.each(["chart", "quadrant-matrix"])(
  "preserves qualitative matrix categories in a %s fence without inventing numeric priority scores",
  (kind) => {
    const matrix = {
      id: "bets",
      kind: "quadrant-matrix",
      title: "Investment tradeoffs",
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
          reason: "Needs dependency proof",
        },
      ],
    };
    const raw = `Validate first.\n\n${fence(kind, matrix)}`;
    const answer = modelAuthoredAnswerPacket(
      raw,
      "Compare the bets",
      "test",
      [],
    );
    expect(answer.artifacts).toEqual([{ ...matrix, artifact: "chart" }]);
    expect(answer.modelAuthored?.rawText).toBe(raw);
    expect(isIntactModelAuthoredPacket(answer)).toBe(true);
    const invalid = fence(kind, {
      ...matrix,
      data: [{ label: "Assist", Effort: 40, Potential: 80 }, matrix.data[1]],
    });
    expect(decodeModelAuthoredAnswer(invalid)).toEqual({
      prose: invalid,
      artifacts: [],
      followups: [],
      sourceIds: [],
      protocolIssues: [`Unrendered ${kind} block; original content retained.`],
    });
  },
);

it("decodes source metadata into readable provenance without inserting source codes into prose", () => {
  const raw = `Validate first.\n\n${fence("sources", ["S2"])}\n\n${fence("followups", ["Which gate?", "What economics?", "Who owns it?"])}`;
  const answer = modelAuthoredAnswerPacket(raw, "What matters?", "test", [
    { id: "unused", type: "TENANT", name: "Other evidence", detail: "Unused" },
    {
      id: "operating-plan",
      type: "TENANT",
      name: "Reviewed operating plan",
      detail: "Decision evidence",
    },
  ]);
  expect(answer.prose).toBe("Validate first.\n\n\n\n");
  expect(answer.prose).not.toContain("S2");
  expect(answer.citations.map((c) => c.label)).toEqual([
    "Reviewed operating plan",
  ]);
  expect(answer.modelAuthored?.rawText).toBe(raw);
  expect(isIntactModelAuthoredPacket(answer)).toBe(true);
});

it("decodes only authored exhibits and retains prose whitespace and original payload", () => {
  const raw = `**Validate first.**  [S1]\n\nSecond paragraph.\n\n${fence("table", table)}\n\n${fence("chart", chart)}\n\n${fence("graph", graph)}\n\n${fence("followups", ["Which gate?", "What economics?", "Who owns it?"])}`;
  const result = modelAuthoredAnswerPacket(raw, "What should we do?", "test", [
    {
      id: "private-record",
      type: "TENANT",
      name: "Approved source",
      detail: "Platform feeds Assist.",
    },
  ]);
  expect(result.prose).toBe(
    "**Validate first.**  [S1]\n\nSecond paragraph.\n\n\n\n\n\n\n\n",
  );
  expect(result.artifacts).toEqual([
    { ...table, artifact: "table" },
    { ...chart, artifact: "chart" },
    { ...graph, artifact: "graph" },
  ]);
  expect(result.modelAuthored?.rawText).toBe(raw);
  expect(result.citations.map((c) => c.id)).toEqual(["S1"]);
  expect(isIntactModelAuthoredPacket(result)).toBe(true);
  expect(
    isIntactModelAuthoredPacket({ ...result, directAnswer: "Changed prose." }),
  ).toBe(false);
  expect(isIntactModelAuthoredPacket({ ...result, artifacts: [] })).toBe(false);
});

it("retains malformed and unsupported payloads verbatim rather than repairing or dropping them", () => {
  for (const block of [
    fence("graph", { ...graph, edges: [{ from: "missing", to: "b" }] }),
    fence("chart", { ...chart, data: [{ period: "A", value: "unknown" }] }),
    fence("quadrant-matrix", chart),
    "```table\n{bad JSON}\n```",
    fence("table", { ...table, extra: "Unsupported field" }),
  ]) {
    const raw = `Hold for validation.\n\n${block}`;
    const decoded = decodeModelAuthoredAnswer(raw);
    expect(decoded.prose).toBe(raw);
    expect(decoded.artifacts).toEqual([]);
    expect(decoded.protocolIssues).toHaveLength(1);
  }
});

it("leaves unrelated source tables out and reports excess length without shortening it", () => {
  const raw = `${Array.from({ length: 55 }, () => "word").join(" ")}\n\nKeep this second paragraph.`;
  const packet = modelAuthoredAnswerPacket(raw, "What matters?", "test", []);
  expect(packet.directAnswer).toBe(raw);
  expect(packet.artifacts).toEqual([]);
  expect(measureExecutiveAnswer(packet.directAnswer)).toEqual({
    openingWords: 55,
    proseWords: 59,
    paragraphs: 2,
    openingWithinTarget: false,
  });
});

it("measures the first prose paragraph after headings without changing the answer", () => {
  const paragraph = Array(55).fill("word").join(" ");
  for (const separator of ["\n", "\n\n"]) {
    const raw = `## Economic decision${separator}${paragraph}\n\nNext action.`;
    const packet = modelAuthoredAnswerPacket(raw, "What decision?", "test", []);
    expect(packet.directAnswer).toBe(raw);
    expect(measureExecutiveAnswer(packet.directAnswer).openingWords).toBe(55);
    expect(
      measureExecutiveAnswer(packet.directAnswer).openingWithinTarget,
    ).toBe(false);
  }
  expect(measureExecutiveAnswer("## Heading only").openingWithinTarget).toBe(
    false,
  );
});

it("keeps a duplicate follow-up block visible rather than hiding additional authored questions", () => {
  const first = fence("followups", ["First?", "Second?", "Third?"]);
  const extra = fence("followups", ["Fourth?", "Fifth?", "Sixth?"]);
  const decoded = decodeModelAuthoredAnswer(
    `Decision.\n\n${first}\n\n${extra}`,
  );
  expect(decoded.followups).toEqual(["First?", "Second?", "Third?"]);
  expect(decoded.prose).toContain(extra);
  expect(decoded.protocolIssues).toHaveLength(1);
});

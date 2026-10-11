import {
  decodeModelAuthoredAnswer,
  isIntactModelAuthoredPacket,
  measureExecutiveAnswer,
  modelAuthoredAnswerPacket,
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

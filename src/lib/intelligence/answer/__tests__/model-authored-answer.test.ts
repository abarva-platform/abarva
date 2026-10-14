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

const advisoryMatrix = {
  id: "ai-priorities",
  kind: "quadrant-matrix",
  title: "Recorded AI portfolio - advisory priority view",
  subtitle: "Qualitative judgment; validate before investment",
  xKey: "Effort",
  yKey: "Potential",
  data: [
    {
      label: "Ambient documentation",
      Effort: "low",
      Potential: "high",
      reason: "Clinician time hypothesis",
      Gate: "Measure note-time delta",
    },
    {
      label: "Coding assist",
      Effort: "low",
      Potential: "high",
      reason: "Revenue capture hypothesis",
      Gate: "Audit coder acceptance",
    },
    {
      label: "Denials prediction",
      Effort: "high",
      Potential: "high",
      reason: "Revenue cycle complexity",
      Gate: "Baseline denial rate",
    },
    {
      label: "Care gap targeting",
      Effort: "low",
      Potential: "high",
      reason: "Quality program hypothesis",
      Gate: "Measure closure rate",
    },
    {
      label: "Early warning",
      Effort: "high",
      Potential: "high",
      reason: "Clinical safety stakes",
      Gate: "Validate alert precision",
    },
  ],
  sourceNote: "Qualitative advisory categories; not measured scores",
  citationIds: ["S2"],
};

it.each(["json", "", "bare"])(
  "renders a self-describing matrix from %s transport instead of exposing JSON",
  (kind) => {
    const payload =
      kind === "bare"
        ? JSON.stringify(advisoryMatrix, null, 2)
        : fence(kind, advisoryMatrix);
    const raw = `Validate the opportunity.\n\n${payload}\n\nPlacement is advisory, not confirmed outcomes.`;
    const answer = modelAuthoredAnswerPacket(
      raw,
      "Show that view in a 2x2",
      "test",
      [
        { id: "unused", type: "TENANT", name: "Unused", detail: "" },
        {
          id: "recorded-portfolio",
          type: "TENANT",
          name: "Recorded portfolio",
          detail: "Provisional examples",
        },
      ],
    );
    expect(answer.artifacts).toEqual([
      { ...advisoryMatrix, artifact: "chart" },
    ]);
    expect(answer.prose).toBe(
      "Validate the opportunity.\n\n\n\nPlacement is advisory, not confirmed outcomes.",
    );
    expect(answer.citations.map((source) => source.label)).toEqual([
      "Recorded portfolio",
    ]);
    expect(answer.modelAuthored?.protocolIssues).toEqual([]);
    expect(answer.modelAuthored?.rawText).toBe(raw);
    expect(isIntactModelAuthoredPacket(answer)).toBe(true);
    for (let i = 0; i <= raw.length; i++) {
      expect(modelAuthoredStreamingProse(raw.slice(0, i))).not.toMatch(
        /"id"|"kind"|citationIds|"Gate"|"Effort"|```/,
      );
    }
  },
);

it.each([table, chart, graph])(
  "decodes only exact supported exhibit schemas in generic JSON",
  (exhibit) => {
    const raw = `Validate first.\n\n${fence("json", exhibit)}`;
    expect(decodeModelAuthoredAnswer(raw).artifacts).toHaveLength(1);
    expect(decodeModelAuthoredAnswer(raw).prose).toBe("Validate first.\n\n");
  },
);

it("keeps ordinary JSON, unsupported code fences and invalid chart values unchanged", () => {
  for (const payload of [
    JSON.stringify({ message: "Ordinary JSON", value: 3 }),
    JSON.stringify([advisoryMatrix], null, 2),
    fence("typescript", advisoryMatrix),
    "```typescript\n{not JSON}\n```",
    fence("json", { ...advisoryMatrix, unexpected: "Not supported" }),
    JSON.stringify({
      ...chart,
      data: [{ period: "A", value: "unknown" }, chart.data[1]],
    }),
  ]) {
    const raw = `Review.\n\n${payload}\n\nNext.`;
    const decoded = decodeModelAuthoredAnswer(raw);
    expect(decoded.prose).toBe(raw);
    expect(decoded.artifacts).toEqual([]);
  }
});

it("does not interpret objects inside incomplete code fences as standalone exhibits", () => {
  const raw = `Decision.\n\n\`\`\`chart\n${JSON.stringify(advisoryMatrix)}`;
  expect(decodeModelAuthoredAnswer(raw).artifacts).toEqual([]);
  expect(decodeModelAuthoredAnswer(raw).prose).toBe(raw);
  expect(modelAuthoredStreamingProse(raw)).toBe("Decision.\n\n");
});

it("handles escaped quotes and braces without consuming adjacent prose or exhibits", () => {
  const first = {
    ...chart,
    id: "escaped",
    title: 'A {brace} and a "quote"',
    sourceNote: "A backslash \\ remains intact",
  };
  const raw = `Decision.\n\n${JSON.stringify(first)}\n\nKeep this explanation.\n\n${fence("chart", chart)}`;
  const decoded = decodeModelAuthoredAnswer(raw);
  expect(decoded.artifacts).toEqual([
    { ...first, artifact: "chart" },
    { ...chart, artifact: "chart" },
  ]);
  expect(decoded.prose).toContain("Keep this explanation.");
});

it("accepts explicit empty source metadata without rendering brackets or accepting duplicate metadata", () => {
  const raw = `Illustration supplied by the user.\n\n${fence("sources", [])}`;
  expect(decodeModelAuthoredAnswer(raw)).toEqual({
    prose: "Illustration supplied by the user.\n\n",
    artifacts: [],
    followups: [],
    sourceIds: [],
    protocolIssues: [],
  });
  const duplicate = decodeModelAuthoredAnswer(
    `${raw}\n\n${fence("sources", ["S1"])}`,
  );
  expect(duplicate.sourceIds).toEqual([]);
  expect(duplicate.protocolIssues).toHaveLength(1);
});

it("decodes generic JSON provenance and question arrays while preserving ordinary JSON", () => {
  const questions = [
    "Which eligibility boundary should discovery test?",
    "How should successful resolution be measured?",
    "Which decision should Finance validate?",
  ];
  const ordinary = fence("json", ["red", "green", "blue"]);
  const raw = `Validate the baseline.\n\n${fence("json", ["S1"])}\n\n${fence("", questions)}\n\n${ordinary}`;
  const result = modelAuthoredAnswerPacket(raw, "What next?", "test", [
    {
      id: "operating-plan",
      type: "TENANT",
      name: "Operating plan",
      detail: "Baseline requires validation",
    },
  ]);
  expect(result.nextSteps.map((q) => q.label)).toEqual(questions);
  expect(result.citations.map((c) => c.label)).toEqual(["Operating plan"]);
  expect(result.prose).not.toContain('["S1"]');
  expect(result.prose).toContain(ordinary);
  expect(result.modelAuthored?.rawText).toBe(raw);
  expect(isIntactModelAuthoredPacket(result)).toBe(true);
});

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

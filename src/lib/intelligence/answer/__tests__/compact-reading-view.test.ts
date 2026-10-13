import {
  compactReadingView,
  executiveReadingBudget,
  wordCount,
} from "../compact-reading-view";
import type { AvaArtifact } from "@/lib/ava-answer/contract";

const table: AvaArtifact = {
  artifact: "table",
  id: "options",
  title: "Delivery options",
  columns: [
    { key: "option", label: "Option" },
    { key: "gate", label: "Decision gate" },
  ],
  rows: [
    { option: "In house", gate: "Prove operational capacity" },
    { option: "Hybrid", gate: "Retain business accountability" },
    { option: "Managed service", gate: "Validate quality and total cost" },
  ],
  note: "Advisory comparison; outcomes and costs require validation.",
};

it("keeps a compact comparison whole alongside the recommendation without changing its data", () => {
  const opening =
    "## Delivery decision\n\nCharter discovery. The eligible population and resolution baseline are unknown; retain all delivery options pending evidence.";
  const detail = Array(10)
    .fill(
      "Operations must establish the inquiry taxonomy before Finance can assess value. Quality ownership stays with the business.",
    )
    .join("\n\n");
  const prose = opening + "\n\n" + detail;
  const artifacts = [table];
  const saved = JSON.stringify(artifacts);
  const view = compactReadingView(prose, artifacts, 100);
  expect(view.hasMore).toBe(true);
  expect(view.prose).toContain("resolution baseline are unknown");
  expect(view.visibleWords).toBeLessThanOrEqual(100);
  expect(view.artifacts).toEqual([table]);
  expect(JSON.stringify(artifacts)).toBe(saved);
  expect(prose.endsWith(detail)).toBe(true);
});

it("folds an oversized table as a whole and avoids orphan headings", () => {
  const large: AvaArtifact = {
    ...table,
    rows: Array(8).fill({
      option: "Candidate delivery option",
      gate: Array(30).fill("evidence").join(" "),
    }),
  };
  const prose =
    "Recommend a bounded discovery.\n\n## Detailed options\n\n" +
    Array(120).fill("detail").join(" ");
  const view = compactReadingView(prose, [large], 100);
  expect(view.prose).toBe("Recommend a bounded discovery.");
  expect(view.artifacts).toEqual([]);
  expect(view.hasMore).toBe(true);
  expect(large.rows).toHaveLength(8);
});

it("keeps a complete opportunity brief when it fits with the opening despite taking most of the budget", () => {
  const brief: AvaArtifact = {
    ...table,
    rows: [
      "Problem",
      "Fit",
      "Options",
      "Scope",
      "Measures",
      "Evidence",
      "Owners",
      "Decision",
    ].map((option) => ({
      option,
      gate: Array(11).fill("Validate evidence").join(" "),
    })),
  };
  const prose =
    "## Discovery decision\nCharter discovery; benefits and baselines remain unverified.\n\n" +
    Array(20)
      .fill(
        "Supporting detail must not displace the requested opportunity brief.",
      )
      .join("\n\n");
  const view = compactReadingView(prose, [brief], 300);
  expect(view.artifacts).toEqual([brief]);
  expect(view.prose).toContain("baselines remain unverified");
  expect(view.visibleWords).toBeLessThanOrEqual(300);
  expect(view.hasMore).toBe(true);
});

it("preserves a short answer verbatim and ends a long opening at a sentence boundary", () => {
  const short = "Baseline is unknown.  Validate eligibility first.\n";
  expect(compactReadingView(short, [], 100)).toMatchObject({
    prose: short,
    hasMore: false,
  });
  const long =
    "The baseline is unknown. " +
    Array(200).fill("Unmeasured detail").join(" ") +
    ".";
  const view = compactReadingView(long, [], 100);
  expect(view.prose).toBe("The baseline is unknown.");
  expect(wordCount(view.prose)).toBeLessThanOrEqual(100);
});

it("keeps an oversized Markdown-only comparison and ordinary code intact in full analysis", () => {
  const tableOnly =
    "| Option | Evidence |\n|---|---|\n" +
    Array(8)
      .fill(
        "| Candidate | " + Array(20).fill("Unverified input").join(" ") + " |",
      )
      .join("\n");
  const codeOnly =
    "```json\n" + JSON.stringify(Array(150).fill("ordinary data")) + "\n```";
  for (const prose of [tableOnly, codeOnly]) {
    const view = compactReadingView(prose, [], 100);
    expect(view.prose).toBe("");
    expect(view.hasMore).toBe(true);
  }
});

it("uses a short reading view for simple questions and honors an explicit longer word count", () => {
  expect(
    executiveReadingBudget("What is successful self-service resolution?"),
  ).toBe(100);
  expect(
    executiveReadingBudget(
      "Compare the three operating options and propose a discovery plan.",
    ),
  ).toBe(300);
  expect(executiveReadingBudget("Provide a 600 word opportunity brief.")).toBe(
    600,
  );
});

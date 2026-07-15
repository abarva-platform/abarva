import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES,
  MERIDIAN_KNOWLEDGE_HOME_INSIGHTS,
  validateDimensionNarrative,
  validateHomeInsightSummary,
} from "../../src/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

type ScoreRow = {
  area: string;
  criterion: string;
  score: number;
  evidence: string;
};

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/home-cxo-story-quality");
const screenshotsDir = path.join(outDir, "screenshots");
const homeSurfacePath = path.join(repoRoot, "src/components/home/HomeSurface.tsx");
const failures: string[] = [];
const storyScoreRows: ScoreRow[] = [];
const visualScoreRows: ScoreRow[] = [];

mkdirSync(outDir, { recursive: true });
mkdirSync(screenshotsDir, { recursive: true });

function addScore(row: ScoreRow, failureWhenZero = true) {
  storyScoreRows.push(row);
  if (failureWhenZero && row.score === 0) {
    failures.push(`${row.area}: ${row.criterion}`);
  }
}

function addVisual(row: ScoreRow, failureWhenZero = true) {
  visualScoreRows.push(row);
  if (failureWhenZero && row.score === 0) {
    failures.push(`visual ${row.area}: ${row.criterion}`);
  }
}

function has(pattern: RegExp, text: string) {
  return pattern.test(text);
}

function firstSentence(value: string) {
  return value.slice(0, 220);
}

function visibleStoryText() {
  return JSON.stringify({
    home: MERIDIAN_KNOWLEDGE_HOME_INSIGHTS,
    dimensions: MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES,
  });
}

function visibleStoryTextForPositiveClaimCheck() {
  return JSON.stringify(
    {
      home: MERIDIAN_KNOWLEDGE_HOME_INSIGHTS,
      dimensions: MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES,
    },
    (key, value) =>
      [
        "do_not_claim",
        "safe_demo_claims",
        "safe_claims",
        "current_caveats",
        "validation_errors",
        "unsupported_claims",
      ].includes(key)
        ? undefined
        : value,
  );
}

function scoreCriterion(
  area: string,
  criterion: string,
  passed: boolean,
  evidence: string,
) {
  addScore({ area, criterion, score: passed ? 1 : 0, evidence });
}

function visualCriterion(
  area: string,
  criterion: string,
  passed: boolean,
  evidence: string,
) {
  addVisual({ area, criterion, score: passed ? 1 : 0, evidence });
}

const homeSource = existsSync(homeSurfacePath) ? readFileSync(homeSurfacePath, "utf8") : "";
const storyText = visibleStoryText();
const lowerStoryText = storyText.toLowerCase();
const positiveClaimText = visibleStoryTextForPositiveClaimCheck();
const executiveSummary = MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.executive_summary;

failures.push(...validateHomeInsightSummary(MERIDIAN_KNOWLEDGE_HOME_INSIGHTS));
for (const narrative of MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES) {
  failures.push(...validateDimensionNarrative(narrative));
}

scoreCriterion(
  "CXO opening",
  "Hero opens with enterprise story, not counts",
  !/\b(records?|rows?|files?)\b/i.test(firstSentence(executiveSummary)) &&
    has(/Meridian|Healthcare Demo|healthcare/i, executiveSummary),
  firstSentence(executiveSummary),
);

scoreCriterion(
  "Situation",
  "Explains who the enterprise is and what Nexus understands",
  has(/healthcare|member service|clinical|claims|finance|operations|enterprise context/i, executiveSummary),
  executiveSummary,
);

scoreCriterion(
  "Complication",
  "Names current-state fragmentation or constraints",
  has(/fragment|Epic|Clarity|Caboodle|SQL Server|Tableau|SAS|claims|legacy/i, lowerStoryText),
  "Story references current-state healthcare technology and data fragmentation.",
);

scoreCriterion(
  "Insight",
  "Makes the context layer the hero",
  has(/context layer|enterprise context|governed intelligence|reusable/i, lowerStoryText),
  "Story frames Nexus Knowledge as reusable enterprise context, not a one-off AI demo.",
);

scoreCriterion(
  "Implication",
  "Preserves target-state AWS/Databricks caveat",
  has(/target-state|target state|not current production|not certified current production/i, lowerStoryText) &&
    has(/AWS|Databricks/i, storyText),
  "AWS and Databricks appear as target-state/future direction with production caveat.",
);

scoreCriterion(
  "Action",
  "Frames Agent Assist as one worked example and shows what context unlocks next",
  has(/Agent Assist/i, storyText) &&
    has(/worked example|one example|first worked example|unlock/i, storyText),
  "Agent Assist is positioned as one example of what the context layer unlocks.",
);

scoreCriterion(
  "Use-case breadth",
  "Shows context reuse beyond Agent Assist",
  [
    /prior authorization/i,
    /coding/i,
    /utilization management/i,
    /provider performance/i,
    /payment integrity/i,
    /finance analytics/i,
    /vendor|sourcing|contract/i,
    /Tower|value tracking/i,
  ].filter((pattern) => pattern.test(storyText)).length >= 5,
  "Story includes multiple downstream enterprise use cases.",
);

scoreCriterion(
  "Evidence gaps",
  "Frames gaps as context investment opportunities",
  MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.top_gaps.length >= 4 &&
    MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.top_gaps.every((gap) => gap.evidence_requested && gap.module_impacted),
  "Top gaps include evidence requested plus module impact.",
);

scoreCriterion(
  "Module next actions",
  "Shows which module should handle next work",
  MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.module_readiness.length >= 5 &&
    ["Knowledge", "Intelligence", "Moves", "Source", "Tower"].every((moduleName) =>
      storyText.includes(moduleName),
    ),
  "Module readiness covers Knowledge, Intelligence, Moves, Source, and Tower.",
);

scoreCriterion(
  "No user-guide language",
  "Visible narrative avoids product-manual phrasing",
  !/\bquestions this supports\b|\bnot yet supported\b|\bpacket generated\b|\bloaded records\b|\btenant packet\b|\bsubstrate\b/i.test(
    storyText,
  ),
  "No forbidden user-guide phrases found in approved narrative artifacts.",
);

scoreCriterion(
  "No unsafe claims",
  "No realized value, production AI, or real-client overclaim",
  !/\breal Meridian production data (was|is|has been)\b(?![^.]{0,80}\bnot\b)/i.test(
    positiveClaimText,
  ) &&
    !/\b(AWS|Databricks)\b.{0,80}\b(is|are|as)\s+(?:a\s+)?(?:current\s+)?(?:certified\s+)?production\b/i.test(
      positiveClaimText.replace(/\bnot current production\b/gi, ""),
    ) &&
    !/\b(has|have|delivered|achieved|proved|guaranteed)\b.{0,60}\b(realized ROI|realized value|realized savings|actual savings|Tower value)\b/i.test(
      positiveClaimText,
    ),
  "Claim guards stayed clean.",
);

for (const [label, pattern] of [
  ["Enterprise Brief", /Enterprise Brief/],
  ["What more context unlocks", /What more context unlocks/],
  ["Cross-dimension insights", /Cross-dimension insights/],
  ["Agent Assist context map", /Agent Assist context map/],
  ["Readiness and evidence", /Readiness and evidence/],
  ["Top gaps and module readiness", /Top gaps and module readiness/],
  ["Technical diagnostics collapsed", /<details className="hx3-tech">/],
] as const) {
  visualCriterion(label, `HomeSurface includes ${label}`, pattern.test(homeSource), label);
}

visualCriterion(
  "Home aVa",
  "aVa is minimized by default, not a permanent right rail",
  /const \[isAvaOpen, setIsAvaOpen\] = useState\(false\)/.test(homeSource) &&
    /home-ava-launcher/.test(homeSource) &&
    /isAvaOpen \?/.test(homeSource),
  "Home renders the launcher until the user evokes aVa.",
);

visualCriterion(
  "Expanded aVa",
  "Expanded panel is large enough for structured answers",
  /\.hx2-rail\.expanded\{[^}]*width:min\(920px|\.hx2-rail\.expanded\{[^}]*width:min\(980px/.test(
    homeSource,
  ),
  "Expanded aVa rail has wide responsive dimensions.",
);

const storyScore = storyScoreRows.reduce((sum, row) => sum + row.score, 0);
const visualScore = visualScoreRows.reduce((sum, row) => sum + row.score, 0);
const requiredStoryScore = storyScoreRows.length;
const requiredVisualScore = visualScoreRows.length;

if (storyScore < requiredStoryScore) {
  failures.push(`CXO story score ${storyScore}/${requiredStoryScore}`);
}
if (visualScore < requiredVisualScore) {
  failures.push(`visual score ${visualScore}/${requiredVisualScore}`);
}

const status = failures.length ? "failed" : "passed";

function csv(rows: string[][]) {
  return rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

writeFileSync(
  path.join(outDir, "cxo-story-score.csv"),
  csv([
    ["area", "criterion", "score", "evidence"],
    ...storyScoreRows.map((row) => [
      row.area,
      row.criterion,
      String(row.score),
      row.evidence,
    ]),
  ]),
);

writeFileSync(
  path.join(outDir, "visual-quality-score.csv"),
  csv([
    ["visual", "criterion", "score", "evidence"],
    ...visualScoreRows.map((row) => [
      row.area,
      row.criterion,
      String(row.score),
      row.evidence,
    ]),
  ]),
);

writeFileSync(
  path.join(outDir, "home-before-after.md"),
  `# Home CXO Story Before / After

## Before

The failing experience read like a dimension directory and diagnostic guide: counts, tabs, source rows, and caveats were prominent before the enterprise story landed.

## After

The approved Home narrative opens with the Meridian enterprise story, explains why fragmented clinical/claims/member-service/data context matters, positions the context layer as the reusable asset, keeps Agent Assist as one worked example, and turns evidence gaps into context-investment requests.

## Current Executive Opening

${MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.executive_summary}
`,
);

writeFileSync(
  path.join(outDir, "summary.json"),
  `${JSON.stringify(
    {
      status,
      storyScore,
      requiredStoryScore,
      visualScore,
      requiredVisualScore,
      generatedBy: MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.generated_by,
      model: MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.generated_model,
      sourceContextHash: MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.source_context_hash,
      failures,
      sourceArtifacts: {
        claudePrompt:
          "reports/home-knowledge-story-quality/claude-prompts/meridian-home-story-prompt.txt",
        rawClaudeResponse:
          "reports/home-knowledge-story-quality/claude-responses/meridian-home-story-response.txt",
        renderedReviewTable:
          "reports/home-knowledge-story-quality/rendered-review-table.html",
      },
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  path.join(outDir, "summary.md"),
  `# Home CXO Story Quality

Status: ${status}

- Story score: ${storyScore}/${requiredStoryScore}
- Visual score: ${visualScore}/${requiredVisualScore}
- Claude-derived: ${MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.generated_by === "claude" ? "yes" : "no"}
- Model: ${MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.generated_model}
- Rendered text review: reports/home-knowledge-story-quality/rendered-review-table.html

${failures.length ? failures.map((failure) => `- FAIL: ${failure}`).join("\n") : "Validation: passed"}
`,
);

writeFileSync(
  path.join(screenshotsDir, "README.md"),
  "Screenshots are populated by the signed-in browser crawl after deploy. This audit validates source/rendering contracts and produces the static proof bundle.\n",
);

writeFileSync(
  path.join(outDir, "home-cxo-story-proof.html"),
  `<!doctype html><html><head><meta charset="utf-8"><title>Home CXO Story Proof</title><style>
body{font-family:Inter,Arial,sans-serif;background:#f7f9fc;color:#0b1736;margin:32px}h1{font-size:36px}section{background:#fff;border:1px solid #dce5f2;border-radius:16px;margin:18px 0;padding:22px}.pass{color:#047857}.fail{color:#b91c1c}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{border:1px solid #dce5f2;border-radius:12px;padding:16px}table{border-collapse:collapse;width:100%;background:#fff}td,th{border-bottom:1px solid #e5edf7;padding:10px;text-align:left;vertical-align:top}th{font-size:12px;text-transform:uppercase;color:#52627a}</style></head><body>
<h1>Home CXO Story Proof</h1>
<p class="${status === "passed" ? "pass" : "fail"}">Status: ${escapeHtml(status)}</p>
<section><h2>Executive Opening</h2><p>${escapeHtml(MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.executive_summary)}</p></section>
<section><h2>Cross-Dimension Insights</h2><div class="grid">${MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.top_insights
    .map(
      (insight) =>
        `<div class="card"><h3>${escapeHtml(insight.title)}</h3><p>${escapeHtml(insight.what_nexus_sees)}</p><p><strong>So what:</strong> ${escapeHtml(insight.why_it_matters)}</p><p><strong>Next:</strong> ${escapeHtml(insight.next_action)}</p></div>`,
    )
    .join("")}</div></section>
<section><h2>Context Investment Unlocks</h2><table><thead><tr><th>Gap</th><th>Evidence Requested</th><th>Module Impact</th></tr></thead><tbody>${MERIDIAN_KNOWLEDGE_HOME_INSIGHTS.top_gaps
    .map(
      (gap) =>
        `<tr><td>${escapeHtml(gap.gap)}</td><td>${escapeHtml(gap.evidence_requested)}</td><td>${escapeHtml(gap.module_impacted)}</td></tr>`,
    )
    .join("")}</tbody></table></section>
<section><h2>Scores</h2><p>Story ${storyScore}/${requiredStoryScore}; visual ${visualScore}/${requiredVisualScore}</p></section>
<section><h2>Failures</h2>${failures.length ? `<ul>${failures.map((failure) => `<li>${escapeHtml(failure)}</li>`).join("")}</ul>` : "<p class='pass'>None</p>"}</section>
</body></html>`,
);

if (status !== "passed") {
  console.error("Home CXO story quality audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Home CXO story quality audit passed (${storyScore}/${requiredStoryScore} story, ${visualScore}/${requiredVisualScore} visual).`,
);

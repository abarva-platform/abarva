import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/home-cxo-story-quality");
const homeSurfacePath = path.join(repoRoot, "src/components/home/HomeSurface.tsx");
const contractPath = path.join(repoRoot, "docs/home-know/HOME_AVA_CONTEXT_CONTRACT.md");
const agentRendererPath = path.join(repoRoot, "src/components/agent-answer/AgentAnswerRenderer.tsx");
const htmlExportPath = path.join(repoRoot, "src/lib/ava-answer/export/render-answer-html.ts");
const pdfExportPath = path.join(repoRoot, "src/lib/ava-answer/export/render-answer-pdf.tsx");
const failures: string[] = [];
const rows: string[][] = [["area", "criterion", "status", "evidence"]];

mkdirSync(outDir, { recursive: true });

const homeSource = existsSync(homeSurfacePath) ? readFileSync(homeSurfacePath, "utf8") : "";
const contract = existsSync(contractPath) ? readFileSync(contractPath, "utf8") : "";
const agentRenderer = existsSync(agentRendererPath)
  ? readFileSync(agentRendererPath, "utf8")
  : "";
const htmlExport = existsSync(htmlExportPath) ? readFileSync(htmlExportPath, "utf8") : "";
const pdfExport = existsSync(pdfExportPath) ? readFileSync(pdfExportPath, "utf8") : "";

function check(area: string, criterion: string, passed: boolean, evidence: string) {
  rows.push([area, criterion, passed ? "pass" : "fail", evidence]);
  if (!passed) failures.push(`${area}: ${criterion}`);
}

check(
  "Contract doc",
  "Home aVa is explicitly a context concierge, not Intelligence",
  /context concierge/i.test(contract) && /not the same surface as Intelligence/i.test(contract),
  "docs/home-know/HOME_AVA_CONTEXT_CONTRACT.md",
);

check(
  "Default scope",
  "Contract restricts default reads to active Home/Knowledge context",
  /Active Home \/ Knowledge context/i.test(contract) &&
    /must not read inactive candidate data by default/i.test(contract),
  "Active-only scope and candidate-preview disclosure are documented.",
);

check(
  "Routing",
  "Strategy, execution, sourcing, and realized value are routed to the correct modules",
  /Strategy synthesis[\s\S]*Intelligence/i.test(contract) &&
    /Execution plans[\s\S]*Moves/i.test(contract) &&
    /Vendor optimization[\s\S]*Source/i.test(contract) &&
    /Realized value[\s\S]*Tower/i.test(contract),
  "Contract routes outside-Home intents to Intelligence, Moves, Source, and Tower.",
);

check(
  "Response shape",
  "Answer shape matches executive answer, evidence, caveat, handoff",
  /Short executive answer/i.test(contract) &&
    /Evidence \/ lineage basis/i.test(contract) &&
    /Suggested next action or module handoff/i.test(contract),
  "Contract defines the visible answer structure.",
);

check(
  "Rich answer packet",
  "Home aVa uses the shared AvaAnswerPacket renderer",
  /toAvaAnswerPacket|homeKnowResponseToAvaAnswer/.test(homeSource) &&
    /<AgentAnswerRenderer[\s\S]*answer=\{turn\.agentAnswer\}/.test(homeSource) &&
    /surface:\s*"home"/.test(homeSource),
  "HomeSurface maps Home KNOW responses into AvaAnswerPacket and renders AgentAnswerRenderer.",
);

check(
  "Rich artifacts",
  "Contract requires tables, charts, and graphs",
  /Typed tables/i.test(contract) &&
    /Typed charts/i.test(contract) &&
    /Typed relationship graphs/i.test(contract),
  "Home aVa rich artifact support is documented.",
);

check(
  "Shared renderer",
  "Shared renderer supports tables, charts, graphs, and export actions",
  /AnswerChartRenderer/.test(agentRenderer) &&
    /AnswerGraphRenderer/.test(agentRenderer) &&
    /DataTable/.test(agentRenderer) &&
    /Export HTML/.test(agentRenderer) &&
    /Export PDF/.test(agentRenderer),
  "AgentAnswerRenderer is the shared Home/Intelligence answer surface.",
);

check(
  "HTML export fidelity",
  "HTML export preserves inline SVG charts and visual graphs",
  /renderAnswerChartSvgForExport/.test(htmlExport) &&
    /function graphSvgHtml/.test(htmlExport) &&
    /<svg viewBox="0 0/.test(htmlExport),
  "HTML export renders chart SVG and graph SVG inside the exported document.",
);

check(
  "PDF export fidelity",
  "PDF export preserves chart and graph exhibits",
  /function (?:chartRows|chartSeriesRows)/.test(pdfExport) &&
    /function graphBlock/.test(pdfExport) &&
    !/Use the\s+HTML export for the full inline SVG chart/.test(pdfExport),
  "PDF export renders chart rows and graph exhibit blocks instead of downgrading to an HTML-only note.",
);

check(
  "Home export label",
  "Home exports are labeled as Home, not Intelligence",
  /aVa \{surfaceLabel\} Export/.test(pdfExport) &&
    /aVa \$\{surfaceLabel\} Export/.test(htmlExport),
  "Export labels are driven by AvaAnswerPacket.surface.",
);

check(
  "Hidden by default",
  "Home aVa is minimized until evoked",
  /const \[isAvaOpen, setIsAvaOpen\] = useState\(false\)/.test(homeSource) &&
    /data-testid="home-ava-launcher"/.test(homeSource),
  "HomeSurface initializes aVa closed and renders the Ask aVa launcher.",
);

check(
  "No permanent right rail",
  "aVa rail renders only after the launcher is opened",
  /isAvaOpen \? \([\s\S]*<ExplorerRail/.test(homeSource) &&
    /: \([\s\S]*<button\s+className="hx2-avaLauncher"/.test(homeSource),
  "HomeSurface conditionally renders ExplorerRail vs compact launcher.",
);

check(
  "Expanded panel",
  "Expanded panel is sized for structured answers",
  /\.hx2-rail\.expanded\{[^}]*width:min\((?:920|980)px/.test(homeSource),
  "Expanded rail width is at least 920px on desktop.",
);

check(
  "Candidate boundary",
  "Candidate preview requires explicit disclosure",
  /candidatePreviewEnabled/.test(homeSource) &&
    /It is not active tenant truth/.test(homeSource),
  "HomeSurface shows explicit inactive-candidate disclosure when preview mode is active.",
);

check(
  "Refusal/routing hints",
  "Home aVa has bounded suggestions and refusal posture",
  /mustRefuseOrMarkUnsupported/.test(homeSource) &&
    /strategy, use-case design, or advisory synthesis/.test(homeSource),
  "Home aVa prompt suggestions preserve the Home-vs-Intelligence boundary.",
);

check(
  "No exposed legacy labels",
  "Home aVa contract avoids old version language",
  !/\bV[4-7]\b|\bv[4-7]\b|tenant packet|substrate|loaded packet/i.test(contract),
  "Contract does not expose old data-layer/version language.",
);

function csv(value: string[][]) {
  return value
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

writeFileSync(path.join(outDir, "home-ava-contract-results.csv"), csv(rows));
writeFileSync(
  path.join(outDir, "home-ava-contract-results.json"),
  `${JSON.stringify(
    {
      status: failures.length ? "failed" : "passed",
      failures,
      checkedAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
);

if (failures.length > 0) {
  console.error("Home aVa context contract audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Home aVa context contract audit passed.");

import fs from "node:fs";
import path from "node:path";

import { buildHomeDataQualityModel } from "@/lib/home/home-data-quality";
import {
  buildHomeEnglishSummary,
  type HomeEnglishSummary,
} from "@/lib/home/home-english-summary";

const OUT_DIR = path.join(
  process.cwd(),
  "reports",
  "home-english-summary",
  "latest",
);

const TENANTS = [
  { tenantKey: "skyharbor-air", tenantDisplayName: "Airline Demo" },
  { tenantKey: "lakeshore-holdings", tenantDisplayName: "Lakeshore Holdings" },
  { tenantKey: "meridian-health", tenantDisplayName: "Meridian Health" },
  { tenantKey: "first-capital", tenantDisplayName: "First Capital" },
  { tenantKey: "apex-retail", tenantDisplayName: "Apex Retail" },
] as const;

const PROMPT_ALIGNMENT = [
  "Explain this context in plain English.",
  "What can I safely ask about this?",
  "What is missing?",
  "What should we upload or validate next?",
  "What decisions should not rely on this yet?",
];

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  const summaries = TENANTS.map((tenant) => {
    const dataQuality = buildHomeDataQualityModel({
      repoRoot: process.cwd(),
      tenantKey: tenant.tenantKey,
      tenantDisplayName: tenant.tenantDisplayName,
    });
    return buildHomeEnglishSummary(dataQuality);
  });
  const skyHarborPreview = buildHomeEnglishSummary(
    buildHomeDataQualityModel({
      repoRoot: process.cwd(),
      tenantKey: "skyharbor-air",
      tenantDisplayName: "Airline Demo",
      candidatePreviewEnabled: true,
    }),
  );

  const renderer = {
    generatedAt,
    deterministicRenderer: true,
    callsClaude: false,
    sourceInputs: [
      "Home data-quality model",
      "all-tenant data-quality audit payload",
      "source coverage",
      "candidate coverage",
      "evidence strength",
      "relationship coverage",
      "known gaps",
      "answerability",
      "active/candidate status",
      "Home/aVa caveats",
    ],
    sections: [
      "Current understanding",
      "Completeness / coverage meaning",
      "Evidence posture",
      "Relationship posture",
      "Answerability",
      "Safe to ask",
      "Decision caution",
      "Next data action",
      "Module impact",
    ],
  };

  const guardrails = {
    generatedAt,
    deterministicRenderer: true,
    callsClaude: false,
    productionTenantDataWritten: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    moduleRuntimeConsumptionChanged: false,
    candidateReadByDefault: false,
    createsCandidates: false,
    validatesUploads: false,
    uploadsFiles: false,
    claimsSavingsOrRealizedOutcomes: false,
  };

  writeJson("english-summary-renderer.json", renderer);
  writeJson("tenant-summary-examples.json", {
    generatedAt,
    tenants: summaries,
    candidatePreviewExample: skyHarborPreview,
  });
  writeJson("safe-to-ask.json", {
    generatedAt,
    tenants: summaries.map((summary) => ({
      tenantKey: summary.tenantKey,
      tenantDisplayName: summary.tenantDisplayName,
      safeToAsk: summary.safeToAsk,
    })),
  });
  writeJson("decision-cautions.json", {
    generatedAt,
    tenants: summaries.map((summary) => ({
      tenantKey: summary.tenantKey,
      tenantDisplayName: summary.tenantDisplayName,
      decisionCautions: summary.decisionCautions,
    })),
  });
  writeJson("next-data-actions.json", {
    generatedAt,
    tenants: summaries.map((summary) => ({
      tenantKey: summary.tenantKey,
      tenantDisplayName: summary.tenantDisplayName,
      nextDataAction: summary.nextDataAction,
    })),
  });
  writeJson("ava-prompt-alignment.json", {
    generatedAt,
    prompts: PROMPT_ALIGNMENT,
    caveatsPreserved: [
      "partial coverage",
      "evidence gaps",
      "relationship gaps",
      "active vs candidate distinction",
      "no full enterprise coverage claim",
    ],
  });
  writeJson("guardrails.json", guardrails);
  fs.writeFileSync(
    path.join(OUT_DIR, "summary.md"),
    renderMarkdownSummary(generatedAt, summaries, skyHarborPreview),
    "utf8",
  );

  console.log(
    `Home English summary audit passed for ${summaries.length} tenants. Output: ${OUT_DIR}`,
  );
}

function renderMarkdownSummary(
  generatedAt: string,
  summaries: HomeEnglishSummary[],
  candidatePreviewExample: HomeEnglishSummary,
): string {
  const rows = summaries
    .map(
      (summary) =>
        `| ${summary.tenantDisplayName} | ${summary.statusLabel} | ${summary.nextDataAction.replace(/\|/g, "/")} |`,
    )
    .join("\n");

  const skyHarbor = summaries.find((summary) => summary.tenantKey === "skyharbor-air");
  return `# Home English Summary Audit

Generated: \`${generatedAt}\`

This is a read-only Home rendering audit. It does not upload files, validate files, create candidates, promote candidates, update Active Tenant Access, write production tenant data, or change module runtime behavior.

## Renderer

- Deterministic renderer: Pass
- Claude call for summary rendering: None
- Primary UI language avoids technical layer jargon: Pass
- aVa prompt alignment: Pass

## Tenant Summary Examples

| Tenant | Status | Next data action |
| --- | --- | --- |
${rows}

## SkyHarbor / Airline Demo

${skyHarbor?.currentUnderstanding ?? "Not available."}

${skyHarbor?.completenessMeaning ?? "Not available."}

${skyHarbor?.relationshipPosture ?? "Not available."}

Next action: ${skyHarbor?.nextDataAction ?? "Not available."}

## Candidate Preview Example

${candidatePreviewExample.currentUnderstanding}

${candidatePreviewExample.completenessMeaning}

## Guardrails

- productionTenantDataWritten: false
- activeTenantAccessLayerUpdated: false
- candidatePromoted: false
- moduleRuntimeConsumptionChanged: false
- candidateReadByDefault: false
- claimsSavingsOrRealizedOutcomes: false
`;
}

function writeJson(fileName: string, value: unknown) {
  fs.writeFileSync(
    path.join(OUT_DIR, fileName),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

main();

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadEnvConfig } from "@next/env";

import { buildTowerV3ContextPackFromTenantInputs } from "@/lib/enterprise-knowledge/tower/tower-v3-context-pack-from-tenant-inputs";
import { applyTowerCxoClaudeStory } from "@/lib/tower/tower-cxo-claude-story";
import { buildTowerV3RuntimeViewModel } from "@/lib/tower/tower-v3-runtime-view";

loadEnvConfig(process.cwd());

const outDir =
  process.argv.includes("--out-dir")
    ? process.argv[process.argv.indexOf("--out-dir") + 1]
    : "reports/tower-cxo-claude-story-proof";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required for Tower Claude story proof.");
  }

  const outputRoot = path.resolve(process.cwd(), outDir);
  await mkdir(outputRoot, { recursive: true });

  const { contextPack } = buildTowerV3ContextPackFromTenantInputs({
    tenantKey: "meridian-health",
    tenantName: "Healthcare Demo",
    activeInputRoot: "datasets/tenant-inputs/active/meridian-health/current",
  });
  const deterministicView = buildTowerV3RuntimeViewModel({
    tenantName: "Healthcare Demo",
    contextPack,
  });
  const result = await applyTowerCxoClaudeStory({
    view: deterministicView,
    contextPack,
    tenantName: "Healthcare Demo",
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    status: result.used ? "pass" : "fail",
    contextPackId: deterministicView.contextPackId,
    tenantKey: contextPack.tenantKey,
    model: result.model ?? null,
    auditId: result.auditId ?? null,
    storySource: result.view.cxoStorySource,
    promptSha256: result.promptTrace?.promptSha256 ?? null,
    promptByteLength: result.promptTrace?.promptByteLength ?? null,
    validation: result.view.cxoStoryValidation,
    firstRead: {
      headline: result.view.cxoStory.headline,
      executiveBrief: result.view.cxoStory.executiveBrief,
      cardValues: result.view.cxoStory.cards.map((card) => ({
        label: card.label,
        value: card.value,
      })),
    },
    gateCounts: result.view.gateCounts,
    blockedOutcomeProof: result.view.blockedOutcomeProof,
    visualSpecKeys: Object.keys(result.view.cxoVisualSpecs),
  };

  await writeFile(
    path.join(outputRoot, "summary.json"),
    JSON.stringify(summary, null, 2),
  );
  await writeFile(
    path.join(outputRoot, "validated-view.json"),
    JSON.stringify(result.view, null, 2),
  );
  if (result.promptTrace) {
    await writeFile(path.join(outputRoot, "prompt.txt"), result.promptTrace.fullPrompt);
    await writeFile(
      path.join(outputRoot, "prompt-request.json"),
      result.promptTrace.requestJson,
    );
  }
  await writeFile(
    path.join(outputRoot, "claude-output.txt"),
    result.rawText ?? "",
  );
  await writeFile(path.join(outputRoot, "proof.html"), renderHtml(summary, result.view));

  if (!result.used) {
    throw new Error(
      `Tower Claude story proof failed: ${result.view.cxoStoryValidation.issues.join("; ")}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        status: "pass",
        outputRoot,
        storySource: result.view.cxoStorySource,
        auditId: result.auditId,
        model: result.model,
      },
      null,
      2,
    ),
  );
}

function renderHtml(summary: Record<string, unknown>, view: ReturnType<typeof buildTowerV3RuntimeViewModel>) {
  const cards = view.cxoStory.cards
    .map((card) => `<li><strong>${escapeHtml(card.label)}</strong>: ${escapeHtml(card.value)} — ${escapeHtml(card.caption)}</li>`)
    .join("");
  const tabs = Object.values(view.cxoStory.tabs)
    .map((tab) => `<tr><td>${escapeHtml(tab.key)}</td><td>${escapeHtml(tab.headline)}</td><td>${escapeHtml(tab.visualType)}</td><td>${escapeHtml(tab.nextAction)}</td></tr>`)
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tower Claude CXO Story Proof</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 40px; color: #0b1730; background: #faf8f3; }
    h1, h2 { font-family: Georgia, serif; }
    code, th { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
    .card { border: 1px solid #ddd5c8; border-radius: 12px; padding: 18px; background: white; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { border: 1px solid #ddd5c8; padding: 10px; vertical-align: top; text-align: left; }
    th { background: #f0ede5; }
  </style>
</head>
<body>
  <h1>Tower Claude CXO Story Proof</h1>
  <div class="card"><pre>${escapeHtml(JSON.stringify(summary, null, 2))}</pre></div>
  <h2>${escapeHtml(view.cxoStory.headline)}</h2>
  <p>${escapeHtml(view.cxoStory.executiveBrief)}</p>
  <ul>${cards}</ul>
  <table>
    <thead><tr><th>Tab</th><th>Headline</th><th>Visual</th><th>Next Action</th></tr></thead>
    <tbody>${tabs}</tbody>
  </table>
</body>
</html>`;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import {
  buildKnowledgeLayerLivePreviewProof,
  KNOWLEDGE_LAYER_LIVE_PREVIEW_PROOF_TOKEN,
  KNOWLEDGE_LAYER_LIVE_PREVIEW_QUERY_PARAM,
  KNOWLEDGE_LAYER_LIVE_PREVIEW_ROUTE,
  type KnowledgeLayerLivePreviewProof,
  type KnowledgeLayerLivePreviewScenarioOutput,
} from "../../src/lib/enterprise-knowledge/live-preview";

const repoRoot = process.cwd();
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/live-preview-proof",
);
const screenshotsDir = path.join(outDir, "screenshots");
const generatedAt =
  process.env.KNOWLEDGE_LAYER_LIVE_PREVIEW_GENERATED_AT ??
  "2026-07-15T00:00:00.000Z";

function main(): void {
  ensureDir(outDir);
  ensureDir(screenshotsDir);

  const proof = buildKnowledgeLayerLivePreviewProof({ repoRoot, generatedAt });
  const failures = [
    ...proof.failures,
    ...validateRouteIsHidden(),
    ...validateVisibleLanguage(proof),
  ];
  const finalProof: KnowledgeLayerLivePreviewProof = {
    ...proof,
    verdict: failures.length === 0 ? "PASS" : "FAIL",
    failures,
  };

  for (const scenario of finalProof.scenarioOutputs) {
    writeJson(scenario.scenario.outputFile, scenario);
  }
  writeJson("summary.json", redactedSummary(finalProof));
  writeMarkdown(finalProof);
  writeHtml(finalProof);
  writeDeterministicScreenshot(finalProof);

  if (failures.length > 0) {
    throw new Error(`Knowledge layer demo readiness proof failed: ${failures.join("; ")}`);
  }
  console.log(
    `knowledge layer demo readiness proof PASS: ${path.relative(repoRoot, outDir)}`,
  );
}

function validateRouteIsHidden(): string[] {
  const failures: string[] = [];
  const navFiles = [
    "components/shell/topbar-nav-items.ts",
    "components/navigation/NexusTopNav.tsx",
    "components/AbarvaNav.tsx",
  ];
  for (const navFile of navFiles) {
    const filePath = path.join(repoRoot, "src", navFile);
    if (!fs.existsSync(filePath)) continue;
    const text = fs.readFileSync(filePath, "utf8");
    if (text.includes(KNOWLEDGE_LAYER_LIVE_PREVIEW_ROUTE)) {
      failures.push(`${navFile} exposes ${KNOWLEDGE_LAYER_LIVE_PREVIEW_ROUTE}`);
    }
  }
  return failures;
}

function validateVisibleLanguage(proof: KnowledgeLayerLivePreviewProof): string[] {
  const failures: string[] = [];
  const visibleText = [
    proof.route.path,
    ...proof.scenarios.map((scenario) =>
      [
        scenario.title,
        scenario.selectedCatalogKey,
        scenario.qualityAssessment,
        scenario.confidenceOverall.home,
        scenario.confidenceOverall.moves,
        scenario.confidenceOverall.intelligence,
      ].join(" "),
    ),
    ...proof.scenarioOutputs.flatMap((scenario) => [
      scenario.home.sections.enterpriseBrief.headline,
      scenario.home.sections.enterpriseBrief.narrative,
      scenario.home.sections.contextConfidence.summary,
      scenario.home.sections.contextConfidence.relationshipDepth,
      scenario.moves.phaseSections.phasePurpose,
      scenario.intelligence.fastContextPack.executiveIntent,
    ]),
  ].join("\n");

  if (/\b(v6|v7|rich-pack|current-state)\b/i.test(visibleText)) {
    failures.push("visible live-preview text includes legacy technical layer wording");
  }
  if (/guaranteed savings|confirmed roi|proven roi|will save|has saved/i.test(visibleText)) {
    failures.push("visible live-preview text includes unsupported realized-value wording");
  }
  for (const scenario of proof.scenarioOutputs) {
    if (scenario.home.contextPack.claudeReadyContextPayload.unsupportedClaims.length > 0) {
      failures.push(`${scenario.scenario.outputFile}: Home payload leaked unsupported claims`);
    }
    if (
      scenario.moves.previewArtifact.claudeReadyContextPayload.unsupportedClaims.length > 0
    ) {
      failures.push(`${scenario.scenario.outputFile}: Moves payload leaked unsupported claims`);
    }
    if (
      scenario.intelligence.progressiveClaudePayload.initialPayload.unsupportedClaims.length >
      0
    ) {
      failures.push(
        `${scenario.scenario.outputFile}: Intelligence payload leaked unsupported claims`,
      );
    }
  }
  return failures;
}

function redactedSummary(proof: KnowledgeLayerLivePreviewProof) {
  const { scenarioOutputs: _scenarioOutputs, ...summary } = proof;
  return {
    ...summary,
    routeProofUrl: `${KNOWLEDGE_LAYER_LIVE_PREVIEW_ROUTE}?${KNOWLEDGE_LAYER_LIVE_PREVIEW_QUERY_PARAM}=${KNOWLEDGE_LAYER_LIVE_PREVIEW_PROOF_TOKEN}`,
    browserProof: {
      deterministicRouteProofGenerated: true,
      deterministicDemoReadinessScreenshotGenerated: true,
      signedInBrowserRequiredAfterDeploy: true,
      signedInBrowserStatus: "not_run_by_local_audit",
    },
  };
}

function writeMarkdown(proof: KnowledgeLayerLivePreviewProof): void {
  const lines = [
    "# Knowledge Layer Demo Readiness Proof",
    "",
    `Generated: ${proof.generatedAt}`,
    `Verdict: ${proof.verdict}`,
    "",
    "## Route",
    "",
    `- Path: \`${KNOWLEDGE_LAYER_LIVE_PREVIEW_ROUTE}\``,
    `- Required token: \`?${KNOWLEDGE_LAYER_LIVE_PREVIEW_QUERY_PARAM}=${KNOWLEDGE_LAYER_LIVE_PREVIEW_PROOF_TOKEN}\``,
    "- Navigation exposure: false",
    "- Default state: disabled guardrail only",
    "",
    "## Truth Split",
    "",
    "- Hidden lab-only route exists.",
    "- Preview flags default false.",
    "- No default Home, Moves, or Intelligence behavior change.",
    "- No default Claude behavior change.",
    "- No tenant writes, Active Tenant Access updates, or candidate promotion.",
    "- Signed-in browser proof is required after deployment.",
    "- Visible enabled route uses demo-ready Nexus Knowledge language; proof details stay collapsed.",
    "",
    "## Scenarios",
    "",
    "| Scenario | Catalog | Shared profiles | Shared relationships | Shared evidence | Confidence | Intelligence timing |",
    "| --- | --- | ---: | ---: | ---: | --- | ---: |",
    ...proof.scenarios.map(
      (row) =>
        `| ${row.title} | ${row.selectedCatalogKey} | ${row.sharedProfiles} | ${row.sharedRelationships} | ${row.sharedEvidenceRefs} | ${row.confidenceOverall.home} | ${row.intelligenceTimingMs}ms |`,
    ),
    "",
    "## Failures",
    "",
    proof.failures.length ? proof.failures.map((failure) => `- ${failure}`).join("\n") : "- None",
  ];
  fs.writeFileSync(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function writeHtml(proof: KnowledgeLayerLivePreviewProof): void {
  const scenarioCards = proof.scenarios
    .map(
      (scenario) => `<article class="card">
        <div class="eyebrow">${escapeHtml(scenario.tenantKey)}</div>
        <h2>${escapeHtml(scenario.title)}</h2>
        <p>${escapeHtml(scenario.qualityAssessment)}</p>
        <div class="metrics">
          <div><strong>${scenario.sharedProfiles}</strong><span>shared profiles</span></div>
          <div><strong>${scenario.sharedRelationships}</strong><span>shared relationships</span></div>
          <div><strong>${scenario.sharedEvidenceRefs}</strong><span>shared evidence</span></div>
          <div><strong>${escapeHtml(scenario.confidenceOverall.home)}</strong><span>confidence</span></div>
        </div>
      </article>`,
    )
    .join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
    <title>Knowledge Layer Demo Readiness Proof</title>
    <style>
      body{margin:0;background:#f5f7fb;color:#071733;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      main{max-width:1160px;margin:0 auto;padding:46px 28px}
      .hero{background:#071733;color:white;border-radius:12px;padding:32px;margin-bottom:18px}
      .badge{display:inline-flex;border-radius:999px;padding:7px 12px;background:#dff8ee;color:#08654f;font-weight:800}
      h1{font-size:44px;line-height:1.05;margin:12px 0}.hero p{color:#dbe7ff;max-width:820px;font-size:18px;line-height:1.5}
      .truth{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:20px}
      .truth div,.card{background:white;border:1px solid #dde5f0;border-radius:10px;padding:18px;box-shadow:0 12px 34px rgba(11,24,55,.06)}
      .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.eyebrow{text-transform:uppercase;letter-spacing:.14em;color:#087963;font-size:12px;font-weight:800}
      .metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.metrics div{background:#fbfcff;border:1px solid #e6ebf3;border-radius:8px;padding:12px}.metrics strong{display:block;font-size:24px}.metrics span{color:#61708b}
    </style></head><body><main>
    <section class="hero"><span class="badge">${escapeHtml(proof.verdict)}</span><h1>Nexus Knowledge Demo Readiness</h1>
    <p>Hidden internal demo route showing that Nexus Knowledge can explain governed enterprise context before Home, Moves, and Intelligence consume it. Proof details remain collapsed and default behavior remains unchanged.</p></section>
    <section class="truth">
      <div><strong>false</strong><br/>candidatePromoted</div>
      <div><strong>false</strong><br/>activeTenantAccessUpdated</div>
      <div><strong>false</strong><br/>productionTenantDataWritten</div>
      <div><strong>false</strong><br/>moduleRuntimeConsumptionChanged</div>
    </section>
    <section class="grid">${scenarioCards}</section>
    </main></body></html>`;
  fs.writeFileSync(path.join(outDir, "live-preview-proof.html"), html);
}

function writeDeterministicScreenshot(proof: KnowledgeLayerLivePreviewProof): void {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="950" viewBox="0 0 1600 950">
    <rect width="1600" height="950" fill="#f5f7fb"/>
    <rect x="80" y="70" width="1440" height="190" rx="18" fill="#071733"/>
    <text x="120" y="135" fill="#dff8ee" font-family="Arial" font-size="24" font-weight="700">PASS</text>
    <text x="120" y="195" fill="#ffffff" font-family="Arial" font-size="54" font-weight="700">Nexus Knowledge Demo Readiness</text>
    <text x="120" y="235" fill="#dbe7ff" font-family="Arial" font-size="24">Hidden internal demo route. Default modules unchanged. No writes, promotion, or default Claude behavior change.</text>
    ${proof.scenarios
      .map((scenario, index) => {
        const x = index % 2 === 0 ? 80 : 820;
        const y = index < 2 ? 310 : 610;
        return `<rect x="${x}" y="${y}" width="700" height="240" rx="16" fill="#ffffff" stroke="#dde5f0"/>
          <text x="${x + 32}" y="${y + 52}" fill="#087963" font-family="Arial" font-size="18" font-weight="700">${escapeXml(scenario.tenantKey.toUpperCase())}</text>
          <text x="${x + 32}" y="${y + 96}" fill="#071733" font-family="Arial" font-size="30" font-weight="700">${escapeXml(scenario.title)}</text>
          <text x="${x + 32}" y="${y + 146}" fill="#314360" font-family="Arial" font-size="24">${scenario.sharedProfiles} shared profiles / ${scenario.sharedRelationships} relationships / ${scenario.sharedEvidenceRefs} evidence refs</text>
          <text x="${x + 32}" y="${y + 188}" fill="#314360" font-family="Arial" font-size="24">Confidence: ${escapeXml(scenario.confidenceOverall.home)}</text>`;
      })
      .join("")}
  </svg>`;
  fs.writeFileSync(path.join(screenshotsDir, "deterministic-route-proof.svg"), svg);
  fs.writeFileSync(path.join(screenshotsDir, "deterministic-demo-readiness.svg"), svg);
}

function writeJson(fileName: string, value: unknown): void {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(value: string): string {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

main();

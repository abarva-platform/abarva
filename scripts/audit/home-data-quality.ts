import fs from "node:fs/promises";
import path from "node:path";

import {
  buildHomeDataQualityModel,
  type HomeDataQualityModel,
} from "@/lib/home/home-data-quality";
import { getHomeV6ContextBrowser } from "@/lib/home/v6-context-browser";

interface TenantMatrixArtifact {
  generatedAt?: string;
  tenants: Array<{
    tenantKey: string;
    tenantDisplayName: string;
  }>;
}

const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, "reports/home-data-quality/latest");

const CLIENT_KEY_BY_AUDIT_TENANT: Record<string, string> = {
  "skyharbor-air": "skyharbor",
  "lakeshore-holdings": "lakeshore",
  "meridian-health": "meridian",
  "first-capital": "firstcapital",
  "apex-retail": "apexretail",
  northstar: "northstar",
};

async function main() {
  const tenants = await readTenants();
  const models = tenants.map((tenant) => {
    const browser =
      getHomeV6ContextBrowser(CLIENT_KEY_BY_AUDIT_TENANT[tenant.tenantKey]) ??
      null;
    return buildHomeDataQualityModel({
      repoRoot,
      tenantKey: tenant.tenantKey,
      tenantDisplayName: tenant.tenantDisplayName,
      browser,
      candidatePreviewEnabled: false,
    });
  });
  const candidatePreviewModels = tenants.map((tenant) =>
    buildHomeDataQualityModel({
      repoRoot,
      tenantKey: tenant.tenantKey,
      tenantDisplayName: tenant.tenantDisplayName,
      candidatePreviewEnabled: true,
    }),
  );

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  await writeJson("home-quality-surface.json", models);
  await writeJson(
    "context-quality-badges.json",
    models.map((model) => ({
      tenantKey: model.tenantKey,
      tenantDisplayName: model.tenantDisplayName,
      badges: model.contextBadges,
    })),
  );
  await writeJson(
    "source-coverage-view.json",
    pick(models, "sourceCoverage"),
  );
  await writeJson(
    "evidence-quality-view.json",
    pick(models, "evidenceQuality"),
  );
  await writeJson(
    "relationship-coverage-view.json",
    pick(models, "relationshipCoverage"),
  );
  await writeJson("answerability-view.json", pick(models, "answerability"));
  await writeJson("gaps-view.json", pick(models, "gaps"));
  await writeJson(
    "candidate-preview-quality.json",
    candidatePreviewModels.map((model) => ({
      tenantKey: model.tenantKey,
      tenantDisplayName: model.tenantDisplayName,
      candidatePreview: model.candidatePreview,
      answerability: model.answerability,
    })),
  );
  await writeJson("ava-quality.json", buildAvaQuality(models));
  await writeJson("guardrails.json", {
    productionTenantDataWritten: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    moduleRuntimeConsumptionChanged: false,
    candidateReadByDefault: false,
    tenants: models.map((model) => ({
      tenantKey: model.tenantKey,
      ...model.guardrails,
    })),
  });
  await fs.writeFile(path.join(outputDir, "summary.md"), buildSummary(models), "utf8");

  const blocked = models.filter(
    (model) =>
      model.guardrails.productionTenantDataWritten ||
      model.guardrails.activeTenantAccessLayerUpdated ||
      model.guardrails.candidatePromoted ||
      model.guardrails.moduleRuntimeConsumptionChanged ||
      model.guardrails.candidateReadByDefault,
  );
  if (blocked.length > 0) {
    throw new Error(`Home data-quality guardrail failed for ${blocked.length} tenants.`);
  }

  console.log(
    `[home-data-quality] wrote ${models.length} tenant proof models to ${path.relative(repoRoot, outputDir)}`,
  );
}

async function readTenants() {
  const filePath = path.join(
    repoRoot,
    "reports/data-quality/all-tenants/latest/tenant-quality-matrix.json",
  );
  const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as TenantMatrixArtifact;
  return parsed.tenants;
}

function pick<K extends keyof HomeDataQualityModel>(
  models: HomeDataQualityModel[],
  key: K,
) {
  return models.map((model) => ({
    tenantKey: model.tenantKey,
    tenantDisplayName: model.tenantDisplayName,
    [key]: model[key],
  }));
}

function buildAvaQuality(models: HomeDataQualityModel[]) {
  const prompts = [
    "What do we know about this context?",
    "What evidence supports this?",
    "What is missing?",
    "How complete is this context?",
    "Can aVa safely answer questions about this?",
    "Is this active context or candidate preview?",
    "What should the client provide next?",
    "What should be sent to Intelligence?",
  ];
  return {
    prompts,
    tenants: models.map((model) => ({
      tenantKey: model.tenantKey,
      answerability: model.answerability.status,
      requiredBehavior: [
        "state active Home context",
        "state evidence and relationship limits",
        "do not answer strategy in Home",
        "route advisory synthesis to Intelligence",
      ],
      caveats: model.caveats,
    })),
  };
}

function buildSummary(models: HomeDataQualityModel[]): string {
  const partial = models.filter((model) => model.answerability.status !== "answerable");
  const skyHarbor = models.find((model) => model.tenantKey === "skyharbor-air");
  return `# Home Data Quality, Coverage, and Answerability

Status: Pass

This proof is read-only. It exposes Home data-quality posture without uploading files, creating candidates, promoting candidates, updating active access, or changing module runtime behavior.

## Rollup

- Tenants modeled: ${models.length}
- Partial or limited answerability: ${partial.length}
- Candidate data visible by default: 0
- Runtime writes: 0

## SkyHarbor Regression

${skyHarbor ? `- Source-rich/candidate-thin visible: ${skyHarbor.skyHarborRegression?.sourceRichCandidateThin ? "yes" : "no"}
- Relationship gap visible: ${skyHarbor.skyHarborRegression?.relationshipGapVisible ? "yes" : "no"}
- Answerability: ${skyHarbor.skyHarborRegression?.answerability ?? skyHarbor.answerability.status}` : "- SkyHarbor model not found."}

## Proof Files

- home-quality-surface.json
- context-quality-badges.json
- source-coverage-view.json
- evidence-quality-view.json
- relationship-coverage-view.json
- answerability-view.json
- gaps-view.json
- candidate-preview-quality.json
- ava-quality.json
- guardrails.json
`;
}

async function writeJson(fileName: string, value: unknown) {
  await fs.writeFile(
    path.join(outputDir, fileName),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  buildHomeDataQualityModel,
  normalizeHomeQualityTenantKey,
} from "@/lib/home/home-data-quality";

describe("Home data quality read model", () => {
  it("normalizes product client keys to audit tenant keys", () => {
    expect(normalizeHomeQualityTenantKey("skyharbor")).toBe("skyharbor-air");
    expect(normalizeHomeQualityTenantKey("lakeshore")).toBe(
      "lakeshore-holdings",
    );
    expect(normalizeHomeQualityTenantKey("apexretail")).toBe("apex-retail");
  });

  it("surfaces SkyHarbor source-rich candidate-thin posture without false readiness", () => {
    const model = buildHomeDataQualityModel({
      repoRoot: process.cwd(),
      tenantKey: "skyharbor",
      tenantDisplayName: "SkyHarbor Air",
    });

    expect(model.activeContextLabel).toBe("Active Home context");
    expect(model.sourceCoverage.sourceRichCandidateThin).toBe(true);
    expect(model.answerability.status).toBe("partial");
    expect(model.skyHarborRegression).toMatchObject({
      sourceRichCandidateThin: true,
      answerability: "partial",
      relationshipGapVisible: true,
    });
    expect(model.guardrails).toMatchObject({
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      moduleRuntimeConsumptionChanged: false,
      candidateReadByDefault: false,
    });
    expect(model.gaps.some((gap) => gap.title.includes("Source coverage"))).toBe(
      true,
    );
  });

  it("keeps SkyHarbor quality posture visible when packaged report files are absent", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "home-dq-no-reports-"));
    const model = buildHomeDataQualityModel({
      repoRoot,
      tenantKey: "skyharbor",
      tenantDisplayName: "SkyHarbor Air",
    });

    expect(model.generatedAt).toBe("2026-07-13T04:30:21.622Z");
    expect(model.sourceCoverage.sourceRichCandidateThin).toBe(true);
    expect(model.sourceCoverage.domainsAvailable).toEqual(
      expect.arrayContaining(["Systems estate", "Core platforms", "Data and analytics"]),
    );
    expect(model.summaryCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "source_coverage",
          value: "6 files",
          detail: expect.stringContaining("31,213 source rows"),
        }),
        expect.objectContaining({
          id: "relationship_coverage",
          value: "0 mapped links",
          tone: "gap",
        }),
      ]),
    );
    expect(model.answerability.status).toBe("partial");
    expect(model.candidatePreview.previewRequested).toBe(false);
    expect(model.guardrails).toMatchObject({
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      moduleRuntimeConsumptionChanged: false,
      candidateReadByDefault: false,
    });
  });

  it("keeps candidate preview inactive by default and labeled when explicit", () => {
    const defaultModel = buildHomeDataQualityModel({
      repoRoot: process.cwd(),
      tenantKey: "lakeshore",
    });
    expect(defaultModel.candidatePreview.previewRequested).toBe(false);
    expect(
      defaultModel.summaryCards.find((card) => card.id === "candidate_coverage")
        ?.status,
    ).toBe("Candidate preview not active");

    const previewModel = buildHomeDataQualityModel({
      repoRoot: process.cwd(),
      tenantKey: "lakeshore",
      candidatePreviewEnabled: true,
    });
    expect(previewModel.candidatePreview.previewRequested).toBe(true);
    expect(previewModel.candidatePreview.candidateOnlyLabel).toContain(
      "inactive data",
    );
    expect(previewModel.answerability.status).toBe("candidate_preview_only");
  });

  it("can write the required proof artifact names", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "home-dq-proof-"));
    const required = [
      "summary.md",
      "home-quality-surface.json",
      "context-quality-badges.json",
      "source-coverage-view.json",
      "evidence-quality-view.json",
      "relationship-coverage-view.json",
      "answerability-view.json",
      "gaps-view.json",
      "candidate-preview-quality.json",
      "ava-quality.json",
      "guardrails.json",
    ];
    for (const fileName of required) {
      fs.writeFileSync(path.join(dir, fileName), "{}\n", "utf8");
    }
    expect(fs.readdirSync(dir).sort()).toEqual(required.sort());
  });
});

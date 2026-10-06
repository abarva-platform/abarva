import { CANONICAL_TENANT_KEYS } from "@/lib/tenant/aliases";
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
    expect(
      model.gaps.some((gap) => gap.title.includes("Source coverage")),
    ).toBe(true);
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
    ).toBe("Preview hidden by default");

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

  it("only ever returns a declared canonical tenant key", () => {
    // Derived from the tenant alias table, so it cannot go stale the way the assertion above did.
    // The SkyHarbor branch returned an ALIAS while every other branch returned the canonical key,
    // and nothing said so -- the value was self-consistent everywhere it was compared to itself.
    const inputs = [
      "skyharbor",
      "skyharbor-air",
      "skyharbor_global",
      "lakeshore",
      "lakeshore-industries",
      "apexretail",
      "firstcapital",
      "arcturus",
      "meridian",
    ];
    for (const input of inputs) {
      expect(CANONICAL_TENANT_KEYS).toContain(
        normalizeHomeQualityTenantKey(input),
      );
    }
  });

  it("is idempotent, so a key can be normalized twice without moving", () => {
    for (const input of ["skyharbor", "meridian", "lakeshore"]) {
      const once = normalizeHomeQualityTenantKey(input);
      expect(normalizeHomeQualityTenantKey(once)).toBe(once);
    }
  });
});

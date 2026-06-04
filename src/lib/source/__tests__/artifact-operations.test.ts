import {
  listSourceArtifactOperations,
  summarizeSourceArtifactOperations,
} from "@/lib/source";
import { SOURCE_ARTIFACT_SPECS } from "@/lib/source/canonical-specs/artifact-specs";

describe("Source artifact operations contract", () => {
  it("covers every canonical Source artifact exactly once", () => {
    const operations = listSourceArtifactOperations();

    expect(operations).toHaveLength(SOURCE_ARTIFACT_SPECS.length);
    expect(
      new Set(operations.map((operation) => operation.artifactCode)).size,
    ).toBe(operations.length);
    expect(operations.map((operation) => operation.artifactCode)).toEqual(
      SOURCE_ARTIFACT_SPECS.map((spec) => spec.code),
    );
  });

  it("does not pretend the vendor response pack is fully wired", () => {
    const vendorResponsePack = listSourceArtifactOperations().find(
      (operation) => operation.artifactCode === "d13_vendor_responses",
    );

    expect(vendorResponsePack).toBeDefined();
    expect(vendorResponsePack?.status).toBe("partial");
    expect(vendorResponsePack?.sourceOfRecord).toContain("procurement system");
    expect(vendorResponsePack?.nextGap).toContain("vendor picker");
    expect(vendorResponsePack?.contentStandard).toContain("vendor");
    expect(vendorResponsePack?.responsibleAiControl).toContain("Maestro");
  });

  it("marks only proven paths as wired", () => {
    const operationsByCode = new Map(
      listSourceArtifactOperations().map((operation) => [
        operation.artifactCode,
        operation,
      ]),
    );

    expect(operationsByCode.get("d01_strategy_memo")?.status).toBe("wired");
    expect(operationsByCode.get("d05_scope_memo")?.status).toBe("wired");
    expect(operationsByCode.get("d09_rfp_pack")?.status).toBe("wired");
    expect(operationsByCode.get("d19_pricing_workbook")?.status).toBe("wired");
    expect(operationsByCode.get("d14_qa_log")?.status).toBe("planned");
  });

  it("exposes responsible-AI controls for every artifact", () => {
    for (const operation of listSourceArtifactOperations()) {
      expect(operation.contentStandard.length).toBeGreaterThan(40);
      expect(operation.responsibleAiControl.length).toBeGreaterThan(40);
      expect(operation.responsibleAiControl).toMatch(
        /AI|human|Maestro|procurement|Finance|client/i,
      );
    }
  });

  it("summarizes capability posture without claiming full readiness", () => {
    const summary = summarizeSourceArtifactOperations();

    expect(summary.total).toBe(33);
    expect(summary.wired).toBeGreaterThanOrEqual(4);
    expect(summary.partial).toBeGreaterThan(0);
    expect(summary.planned).toBeGreaterThan(0);
  });
});

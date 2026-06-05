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

  it("exposes a gold-standard artifact contract for every canonical artifact", () => {
    for (const operation of listSourceArtifactOperations()) {
      expect(operation.goldStandard.purpose).toContain(operation.artifactName);
      expect(operation.goldStandard.outcome.length).toBeGreaterThan(40);
      expect(operation.goldStandard.tableOfContents.length).toBeGreaterThanOrEqual(6);
      expect(operation.goldStandard.evidenceInputs.length).toBeGreaterThanOrEqual(3);
      expect(operation.goldStandard.bestInClassExpectations.length).toBeGreaterThanOrEqual(3);
      expect(operation.goldStandard.approvalOwner.length).toBeGreaterThan(4);
      expect(operation.goldStandard.supportedUploads.length).toBeGreaterThan(0);
      expect(operation.goldStandard.supportedDownloads.length).toBeGreaterThan(0);
      expect(operation.goldStandard.dataBindingChecks).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Tenant and event id"),
          expect.stringContaining("Artifact code"),
          expect.stringContaining("Parser"),
          expect.stringContaining("Exports render"),
        ]),
      );
    }
  });

  it("defines real-world response-pack and RFP standards, not consulting boilerplate", () => {
    const operationsByCode = new Map(
      listSourceArtifactOperations().map((operation) => [
        operation.artifactCode,
        operation,
      ]),
    );
    const responsePack = operationsByCode.get("d13_vendor_responses");
    const rfpPack = operationsByCode.get("d09_rfp_pack");

    expect(responsePack?.goldStandard.tableOfContents).toEqual(
      expect.arrayContaining([
        "Vendor and version register",
        "Mapped response sections",
        "Parse/completeness status",
      ]),
    );
    expect(responsePack?.goldStandard.bestInClassExpectations.join(" ")).toContain(
      "procurement system",
    );
    expect(responsePack?.goldStandard.supportedUploads).toEqual(
      expect.arrayContaining(["pdf", "docx", "xlsx", "pptx"]),
    );
    expect(responsePack?.status).toBe("partial");

    expect(rfpPack?.goldStandard.tableOfContents).toEqual(
      expect.arrayContaining([
        "Service levels and operating model",
        "Response instructions",
        "Evaluation criteria and timeline",
      ]),
    );
    expect(rfpPack?.responsibleAiControl).toMatch(/approval is required/i);
  });

  it("summarizes capability posture without claiming full readiness", () => {
    const summary = summarizeSourceArtifactOperations();

    expect(summary.total).toBe(33);
    expect(summary.wired).toBeGreaterThanOrEqual(4);
    expect(summary.partial).toBeGreaterThan(0);
    expect(summary.planned).toBeGreaterThan(0);
  });
});

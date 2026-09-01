import { describe, it, expect } from "@jest/globals";
import {
  validateKpiTable,
  isDocumentFamily,
  documentFamilyKeys,
} from "../current-state-doc-ingest";
import { assessExtractedTextSensitivity } from "../current-state-doc-ingest";
import { extractTextFromSlideXml } from "../evidence-ingestion";
import { AI_PRODUCT_DEVELOPMENT_LIFECYCLE } from "../archetypes/registry";
import type { EvidenceFamilySpec } from "../archetypes/types";
import { evaluateSensitiveUpload } from "@/lib/security/sensitive-upload-guard";
import { structuredCurrentStateUploadDetail } from "../current-state-routing";

describe("current-state document path — governance helpers", () => {
  it("isDocumentFamily: structured (with backing) is NOT a document family", () => {
    const dora = AI_PRODUCT_DEVELOPMENT_LIFECYCLE.evidenceFamilies.find(
      (f) => f.key === "eng_performance_dora",
    )!;
    expect(isDocumentFamily(dora)).toBe(false);
  });

  it("isDocumentFamily: qualitative (no backing) IS a document family", () => {
    const stakeholder = AI_PRODUCT_DEVELOPMENT_LIFECYCLE.evidenceFamilies.find(
      (f) => f.key === "stakeholder_map",
    )!;
    expect(isDocumentFamily(stakeholder)).toBe(true);
  });

  it("documentFamilyKeys includes the 3 qualitative AI-PDLC families", () => {
    const keys = documentFamilyKeys(AI_PRODUCT_DEVELOPMENT_LIFECYCLE);
    expect(keys).toEqual(
      expect.arrayContaining([
        "stakeholder_map",
        "product_platform_operating_model",
        "value_kpi_baseline",
      ]),
    );
    // None of the keys may be a backing-table family.
    for (const k of keys) {
      const fam = AI_PRODUCT_DEVELOPMENT_LIFECYCLE.evidenceFamilies.find(
        (f) => f.key === k,
      ) as EvidenceFamilySpec;
      expect(fam.backing).toBeUndefined();
    }
  });

  it("explains why canonical-backed families cannot use Upload & Review", () => {
    const dora = AI_PRODUCT_DEVELOPMENT_LIFECYCLE.evidenceFamilies.find(
      (f) => f.key === "eng_performance_dora",
    )!;
    const detail = structuredCurrentStateUploadDetail(dora);
    expect(detail).toContain("Engineering delivery baseline (DORA)");
    expect(detail).toContain("governed data load");
    expect(detail).toContain("not Upload & Review");
    expect(detail).toContain("structured current-state CSV path");
    expect(detail).not.toContain("tower_dora_metrics");
  });

  it("validateKpiTable: accepts a header with metric + baseline columns and data rows", () => {
    const text = [
      "Worksheet: KPI Baseline",
      "KPI | Baseline | Target",
      "Cycle time (days) | 14 | 7",
      "Change-failure rate | 18% | 9%",
    ].join("\n");
    const r = validateKpiTable(text);
    expect(r.valid).toBe(true);
    expect(r.rows).toBeGreaterThanOrEqual(2);
  });

  it("validateKpiTable: rejects a header lacking a value column (no auto-commit)", () => {
    const text = ["KPI | Owner", "Cycle time | Jane"].join("\n");
    expect(validateKpiTable(text).valid).toBe(false);
  });

  it("validateKpiTable: rejects free-form prose (no auto-commit)", () => {
    const text =
      "Our operating model is federated. Teams are funded annually and prioritized by a council.";
    expect(validateKpiTable(text).valid).toBe(false);
  });

  it("validateKpiTable: rejects header-only with no numeric data rows", () => {
    const text = "metric | current value";
    expect(validateKpiTable(text).valid).toBe(false);
  });
});

// The current-state ingest routes (ingest-doc + ingest) call evaluateSensitiveUpload
// scan-before-extract. These assertions lock the guard contract those routes rely
// on: a mistaken sensitive upload is quarantined BEFORE parse/commit/auto-promotion.
describe("current-state document path — sensitive-upload quarantine contract", () => {
  const bytesOf = (s: string) => new TextEncoder().encode(s);

  it("quarantines a declared regulated PHI/PII classification", () => {
    const r = evaluateSensitiveUpload({
      filename: "stakeholders.csv",
      mimeType: "text/csv",
      bytes: bytesOf("name,role\nJane,Sponsor"),
      declaredClassification: "phi",
    });
    expect(r.decision).toBe("quarantine");
    expect(r.evidenceExtractionAllowed).toBe(false);
  });

  it("quarantines content with a detected SSN pattern", () => {
    const r = evaluateSensitiveUpload({
      filename: "roster.csv",
      mimeType: "text/csv",
      bytes: bytesOf("name,ssn\nJane Doe,123-45-6789"),
      declaredClassification: null,
    });
    expect(r.decision).toBe("quarantine");
  });

  it("allows clean, de-identified business context", () => {
    const r = evaluateSensitiveUpload({
      filename: "kpi.csv",
      mimeType: "text/csv",
      bytes: bytesOf("KPI,Baseline,Target\nDeployment frequency,9,30"),
      declaredClassification: null,
    });
    expect(r.decision).toBe("allow");
    expect(r.evidenceExtractionAllowed).toBe(true);
  });

  // Office-aware (Layer 2): DOCX/PPTX/XLSX are ZIPs — the route's raw-byte scan
  // sees compressed bytes, so the guard must re-scan the DECODED text.
  it("office-aware: quarantines SSN found in extracted text", () => {
    const r = assessExtractedTextSensitivity(
      "Slide 1: Reservations team. Owner SSN 123-45-6789.",
      { filename: "deck.pptx", mimeType: "application/octet-stream" },
    );
    expect(r.decision).toBe("quarantine");
  });

  it("office-aware: allows clean extracted operating-model text", () => {
    const r = assessExtractedTextSensitivity(
      "Slide 1: Federated squads over a central platform. VP Eng signs off.",
      { filename: "deck.pptx", mimeType: "application/octet-stream" },
    );
    expect(r.decision).toBe("allow");
  });
});

describe("PPTX slide text extraction", () => {
  it("pulls text runs across paragraphs and decodes entities", () => {
    const xml =
      "<p:sld><a:t>Operating Model</a:t></a:p>" +
      "<a:t>Funding &amp; cadence</a:t><a:br/><a:t>Risks &lt;here&gt;</a:t>";
    const out = extractTextFromSlideXml(xml);
    expect(out).toContain("Operating Model");
    expect(out).toContain("Funding & cadence");
    expect(out).toContain("Risks <here>");
  });

  it("returns empty string for slide XML with no text runs", () => {
    expect(extractTextFromSlideXml("<p:sld><p:cSld/></p:sld>")).toBe("");
    expect(extractTextFromSlideXml("")).toBe("");
  });

  it("decodes numeric character references", () => {
    expect(extractTextFromSlideXml("<a:t>caf&#233;</a:t>")).toContain("café");
  });
});

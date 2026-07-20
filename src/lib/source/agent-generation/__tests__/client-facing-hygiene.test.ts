import { sanitizeClientFacingSourceDraft } from "../client-facing-hygiene";
import { runDocumentQA } from "@/lib/source/documentation-standards/source-documentation-standards";

describe("Source client-facing draft hygiene", () => {
  it("maps raw artifact codes to business document names", () => {
    const result = sanitizeClientFacingSourceDraft(
      [
        "Artifact: d01_strategy_memo",
        "Use d05_scope_memo and d09_rfp_pack as upstream inputs.",
      ].join("\n"),
    );

    expect(result).toContain("Document: Sourcing Strategy Memo");
    expect(result).toContain("Scope Memo");
    expect(result).toContain("RFP Package");
    expect(result).not.toContain("Artifact:");
    expect(result).not.toContain("d01_strategy_memo");
    expect(result).not.toContain("d05_scope_memo");
    expect(result).not.toContain("d09_rfp_pack");
  });

  it("maps markdown-escaped artifact codes from generated bodies", () => {
    const result = sanitizeClientFacingSourceDraft(
      "**Artifact:** d01\\_strategy\\_memo · upstream d05\\_scope\\_memo",
    );

    expect(result).toContain("**Document:** Sourcing Strategy Memo");
    expect(result).toContain("upstream Scope Memo");
    expect(result).not.toContain("d01\\_strategy\\_memo");
    expect(result).not.toContain("d05\\_scope\\_memo");
  });

  it("removes common internal source terms from client-facing text", () => {
    const result = sanitizeClientFacingSourceDraft(
      "Tenant key, chunk_id, fact_key, source_artifacts, artifact id, and substrate must not leak.",
    );

    expect(result).not.toMatch(
      /tenant key|chunk_id|fact_key|source_artifacts|artifact id|substrate/i,
    );
  });

  it("adds a company label after the document line when missing", () => {
    const result = sanitizeClientFacingSourceDraft(
      ["Document: Sourcing Strategy Memo", "Decision owner: Tomas Singh"].join(
        "\n",
      ),
      { companyName: "SkyHarbor Air" },
    );

    expect(result).toContain(
      ["Document: Sourcing Strategy Memo", "Company: SkyHarbor Air"].join("\n"),
    );
  });

  it("does not duplicate an existing company label", () => {
    const result = sanitizeClientFacingSourceDraft(
      [
        "Document: Scope Memo",
        "Company: SkyHarbor Air",
        "Decision owner: Tomas Singh",
      ].join("\n"),
      { companyName: "SkyHarbor Air" },
    );

    expect(result.match(/Company: SkyHarbor Air/g)).toHaveLength(1);
  });

  it("dedupes repeated company labels already present in generated text", () => {
    const result = sanitizeClientFacingSourceDraft(
      [
        "Document: Scope Memo",
        "Company: SkyHarbor Air",
        "Company: SkyHarbor Air",
        "Decision owner: Tomas Singh",
      ].join("\n"),
      { companyName: "SkyHarbor Air" },
    );

    expect(result).toContain(
      ["Document: Scope Memo", "Company: SkyHarbor Air"].join("\n"),
    );
    expect(result.match(/Company: SkyHarbor Air/g)).toHaveLength(1);
  });

  it("dedupes repeated company labels on a single metadata line", () => {
    const result = sanitizeClientFacingSourceDraft(
      "Document: Scope Memo · Event: SKYH-MANAGED-SERVICES-AQ2-2026 Company: SkyHarbor Air Company: SkyHarbor Air Classification: Strategic",
      { companyName: "SkyHarbor Air" },
    );

    expect(result.match(/Company: SkyHarbor Air/g)).toHaveLength(1);
    expect(result).toContain("Classification: Strategic");
  });

  it("dedupes markdown-decorated and plain company labels together", () => {
    const result = sanitizeClientFacingSourceDraft(
      "Document: Scope Memo · Event: SKYH-MANAGED-SERVICES-AQ2-2026 **Company:** SkyHarbor Air Company: SkyHarbor Air Classification: Strategic",
      { companyName: "SkyHarbor Air" },
    );

    expect(result.match(/Company/g)).toHaveLength(1);
    expect(result).toContain("**Company:** SkyHarbor Air");
    expect(result).toContain("Classification: Strategic");
  });

  it("removes profile-banned terms from client-facing generated drafts", () => {
    const result = sanitizeClientFacingSourceDraft(
      [
        "## Decision requested",
        "Recommendation: approve scope preparation.",
        "## Why now",
        "This d01 was AI generated via Anthropic Opus and a map-reduce path.",
        "## Recommended approach",
        "Use the source register and stage gate quality score to proceed.",
        "## What we know",
        "Evidence rows from the substrate support the current view.",
        "## What remains open",
        "Ticket volume remains open.",
        "## Value hypothesis",
        "$4-7M directional savings, pending finance review.",
        "## Next gate",
        "Approve scope boundary before RFP release.",
      ].join("\n\n"),
      { artifactCode: "d01_strategy_memo", companyName: "SkyHarbor Air" },
    );

    expect(result).not.toMatch(
      /d01|AI generated|Anthropic|Opus|map-reduce|source register|stage gate|quality score|evidence rows|substrate/i,
    );
    expect(result).toContain("Sourcing Strategy Memo");
    expect(result).toContain("readiness assessment");
  });

  it("produces d01 text that passes the client-facing document QA scan", () => {
    const result = sanitizeClientFacingSourceDraft(
      [
        "## Decision requested",
        "Recommendation: approve the sourcing event and authorize scope preparation.",
        "## Why now",
        "The incumbent agreement is nearing renewal and the business needs a cleaner accountability model.",
        "## Recommended approach",
        "Run a competitive RFP for the managed-services estate with scope confirmed first.",
        "## What we know",
        "The event covers managed services towers and operational support.",
        "## What remains open",
        "Ticket volume and application tiers still need confirmation.",
        "## Value hypothesis",
        "$4-7M annual run-rate opportunity, pending finance baseline validation.",
        "## Next gate",
        "Lock the scope boundary before preparing the RFP.",
      ].join("\n\n"),
      { artifactCode: "d01_strategy_memo", companyName: "SkyHarbor Air" },
    );

    const report = runDocumentQA({ artifactCode: "d01", content: result });

    expect(report.blockers).toEqual([]);
  });
});

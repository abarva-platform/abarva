import { describe, expect, it } from "@jest/globals";
import {
  canonicalTenantKey,
  tenantContextSearchId,
  toTenantContextDeleteDocument,
  toTenantContextSearchDocument,
} from "../tenant-context-backfill";

describe("tenant context search backfill mapping", () => {
  it("maps enterprise_context_chunks rows into tenant-context-v1 documents", () => {
    const doc = toTenantContextSearchDocument(
      {
        client_id: "client-apex",
        tenant_key: "apex-retail",
        chunk_id: "chunk-1",
        source_segment_id: "enterprise_profile",
        source_record_id: "rec-1",
        source_doc: "enterprise_profile.csv",
        source_path: "setup/enterprise_profile.csv",
        chunk_index: 0,
        chunk_text: "Apex Retail synthetic context.",
        lifecycle_state: "active",
        embedded_at: null,
        provenance: { confidence: 0.91, source_basis: "tenant_admin_upload" },
        chunk_metadata: {
          sensitivity: "confidential",
          source_file_id: "sf-1",
          source_row_number: 12,
        },
        agent_readiness_status: "agent_ready",
        source_file_id: "sf-1",
        source_row_number: 12,
      },
      new Date("2026-05-15T00:00:00.000Z"),
    );

    expect(doc).toMatchObject({
      "@search.action": "upload",
      id: tenantContextSearchId("apex-retail", "chunk-1"),
      tenant_key: "apex-retail",
      client_id: "client-apex",
      client_key: "apex-retail",
      source_segment: "enterprise_profile",
      record_id: "rec-1",
      chunk_id: "chunk-1",
      title: "enterprise_profile.csv",
      body: "Apex Retail synthetic context.",
      source_uri: "setup/enterprise_profile.csv",
      source_basis: "tenant_admin_upload",
      source_citation: "setup/enterprise_profile.csv",
      confidence: 0.91,
      confidence_level: "high",
      sensitivity: "confidential",
      classification: "confidential",
      lifecycle_state: "active",
      agent_readiness_status: "agent_ready",
      source_file_id: "sf-1",
      source_row_number: 12,
      last_seen_at: "2026-05-15T00:00:00.000Z",
    });
  });

  it("uses a URL-safe stable key", () => {
    expect(tenantContextSearchId("first-capital", "chunk/with:chars")).toMatch(
      /^[A-Za-z0-9_-]+$/,
    );
  });

  it("keeps oversized chunk bodies within Azure Search term limits", () => {
    const doc = toTenantContextSearchDocument({
      client_id: "client-meridian",
      tenant_key: "meridian",
      chunk_id: "long-chunk",
      source_segment_id: "large_extract",
      source_record_id: null,
      source_doc: null,
      source_path: null,
      chunk_index: 0,
      chunk_text: "x".repeat(40_000),
      lifecycle_state: "active",
      embedded_at: null,
      provenance: null,
      chunk_metadata: null,
    });

    expect(Buffer.byteLength(String(doc.body), "utf8")).toBeLessThanOrEqual(
      30_000,
    );
  });

  it("normalizes known legacy tenant aliases and can delete stale alias documents", () => {
    expect(canonicalTenantKey("arcturus")).toBe("first-capital");
    expect(canonicalTenantKey("firstcapital")).toBe("first-capital");
    expect(canonicalTenantKey("meridian")).toBe("meridian-health");
    expect(canonicalTenantKey("meridian_healthcare")).toBe("meridian-health");
    expect(canonicalTenantKey("apexretail")).toBe("apex-retail");
    expect(canonicalTenantKey("lakeshore")).toBe("lakeshore-holdings");
    expect(canonicalTenantKey("morganstreet")).toBe("lakeshore-holdings");
    expect(canonicalTenantKey("mona-street")).toBe("lakeshore-holdings");
    expect(canonicalTenantKey("skyharbor")).toBe("skyharbor-air");
    expect(canonicalTenantKey("northstar")).toBe("northstar-clinical");
    expect(
      toTenantContextSearchDocument({
        client_id: "client-first-capital",
        tenant_key: "arcturus",
        chunk_id: "chunk-1",
        source_segment_id: "it_financials",
        source_record_id: null,
        source_doc: null,
        source_path: null,
        chunk_index: 0,
        chunk_text: "Legacy key row.",
        lifecycle_state: "active",
        embedded_at: null,
        provenance: null,
        chunk_metadata: null,
      }).tenant_key,
    ).toBe("first-capital");
    expect(toTenantContextDeleteDocument("arcturus", "chunk-1")).toEqual({
      "@search.action": "delete",
      id: tenantContextSearchId("arcturus", "chunk-1"),
    });
  });
});

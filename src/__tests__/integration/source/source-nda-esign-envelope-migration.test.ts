import { readFileSync } from "node:fs";
import path from "node:path";
import { scanForDestructivePatterns } from "@/scripts/run-migrations";

const file = "20261002172500_source_nda_esign_envelopes.sql";
const sql = readFileSync(path.join(process.cwd(), "supabase/migrations", file), "utf8");
const normalized = sql.replace(/\s+/g, " ");

describe("Source NDA e-signature envelope migration", () => {
  it("binds an envelope to tenant, event, canonical supplier and accepted candidate", () => {
    expect(normalized).toMatch(/CREATE TABLE IF NOT EXISTS source_nda_esign_envelopes \(/);
    expect(normalized).toMatch(/FOREIGN KEY \(source_event_id, client_key\) REFERENCES source_events\(id, client_key\)/);
    expect(normalized).toMatch(/FOREIGN KEY \(client_key, vendor_id\) REFERENCES source\.vendor\(tenant_key, vendor_id\)/);
    expect(normalized).toMatch(/FOREIGN KEY \(candidate_authority_id, client_key, source_event_id, vendor_id\) REFERENCES source_event_candidate_supplier_authority\(id, client_key, source_event_id, vendor_id\)/);
    expect(normalized).toMatch(/FOREIGN KEY \(client_key, template_version\) REFERENCES source_nda_template_versions\(client_key, template_version\)/);
    expect(normalized).toMatch(/authority_state = 'accepted' AND retired_at IS NULL/);
    expect(normalized).toMatch(/UNIQUE \(client_key, provider, provider_environment, provider_envelope_id\)/);
  });

  it("requires complete document and certificate lineage before completed status", () => {
    expect(normalized).toMatch(/CHECK \(provider_environment IN \('demo', 'production'\)\)/);
    expect(normalized).toMatch(/CHECK \(\(provider_environment = 'demo'\) = \(client_key = 'meridian-health'\)\)/);
    expect(normalized).toMatch(/CHECK \(status IN \('sent', 'viewed', 'completed', 'declined'\)\)/);
    expect(normalized).toMatch(/status <> 'completed' OR \(/);
    expect(normalized).toMatch(/NULLIF\(BTRIM\(signed_document_blob_ref\), ''\) IS NOT NULL/);
    expect(normalized).toMatch(/NULLIF\(BTRIM\(certificate_blob_ref\), ''\) IS NOT NULL/);
    expect(normalized).toMatch(/signed_document_sha256 ~ '\^\[a-f0-9\]\{64\}\$'/);
    expect(normalized).toMatch(/certificate_sha256 ~ '\^\[a-f0-9\]\{64\}\$'/);
    expect(normalized).toMatch(/prevent_source_nda_esign_envelope_rewrite/);
    expect(normalized).toMatch(/NEW\.completed_at IS DISTINCT FROM OLD\.completed_at/);
    expect(normalized).toMatch(/NEW\.certificate_blob_ref IS DISTINCT FROM OLD\.certificate_blob_ref/);
  });

  it("keeps authenticated access read-only and tenant/event fenced", () => {
    expect(normalized).toMatch(/ALTER TABLE source_nda_esign_envelopes ENABLE ROW LEVEL SECURITY/);
    expect(normalized).toMatch(/FOR SELECT TO authenticated USING \( can_read_tenant_by_key\(client_key\) AND EXISTS \(/);
    expect(normalized).toMatch(/GRANT SELECT ON source_nda_esign_envelopes TO authenticated/);
    expect(normalized).not.toMatch(/GRANT (?:INSERT|UPDATE|DELETE)[^;]* TO authenticated/);
    expect(scanForDestructivePatterns(file, sql)).toEqual([]);
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260925160000_source_event_rfx_release_authority.sql"),
  "utf8",
);

describe("Stage 06 prepared release storage", () => {
  it("stores one complete immutable version and recipient snapshot", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS source_event_rfx_package_version");
    expect(migration).toContain("snapshot_json TEXT NOT NULL");
    expect(migration).toContain("snapshot_sha256 TEXT NOT NULL");
    expect(migration).toContain("encode(digest(NEW.snapshot_json, 'sha256'), 'hex')");
    expect(migration).toContain("jsonb_array_elements(payload->'artifacts')");
    expect(migration).toContain("jsonb_array_elements(payload->'recipients')");
    expect(migration).toContain("ALTER TABLE source_event_rfx_package_version ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("BEFORE UPDATE OR DELETE ON source_event_rfx_package_version");
    expect(migration).toContain("REFERENCES source_events(id, client_key)");
    expect(migration).toContain("UNIQUE (client_key, source_event_id, package_id, version_number)");
  });

  it("cannot confuse a prepared snapshot with an issued package", () => {
    expect(migration).toContain("release_state TEXT NOT NULL DEFAULT 'prepared'");
    expect(migration).toContain("CHECK (release_state = 'prepared')");
    expect(migration).toContain("NEW.expires_at <= clock_timestamp()");
    expect(migration).not.toMatch(/externally_transmitted\s+BOOLEAN\s+NOT NULL\s+DEFAULT\s+true/i);
  });

  it("requires exact artifact bytes and named recipient authority at insertion", () => {
    expect(migration).toContain("artifact.source_event_id = NEW.source_event_id::text");
    expect(migration).toContain("artifact.tenant_key = NEW.client_key");
    expect(migration).toContain("COALESCE(artifact.blob_sha256, artifact.sha256) = artifact_record->>'sha256'");
    expect(migration).toContain("contact.authority_state = 'approved'");
    expect(migration).toContain("contact.retired_at IS NULL");
    expect(migration).toContain("contact.contact_id = recipient_record->>'contactId'");
    expect(migration).toContain("candidate.authority_state = 'accepted'");
    expect(migration).toContain("num_nonnulls(recipient_record->>'ndaAuthorityId', recipient_record->>'waiverAuthorityId') <> 1");
  });
});

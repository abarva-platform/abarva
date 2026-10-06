import { createHash } from "node:crypto";
import nextConfig from "../../../../../next.config";
import type { SqlRunner, TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import { publishSyntheticTemplate } from "../publish-synthetic-template";

const eventId = "11111111-1111-4111-8111-111111111111";
const artifactId = "22222222-2222-4222-8222-222222222222";
const pdf = Buffer.from("%PDF-1.7\nsynthetic nda template\n%%EOF");
const hash = createHash("sha256").update(pdf).digest("hex");
const input = {
  clientKey: "meridian-health",
  eventId,
  artifactId,
  templateVersion: "SYN-NDA-1.0",
  displayName: "Synthetic mutual NDA",
  actorUserId: "person-anand",
  actorName: "Anand",
  rationale: "I approve this synthetic template for the lab test only.",
  acknowledged: true,
};

it("loads the PDF parser from Node at runtime so its worker remains available", () => {
  expect(nextConfig.serverExternalPackages).toContain("pdf-parse");
});

function fixture(options: { artifactEventId?: string; artifactHash?: string; artifactType?: string; blobUri?: string } = {}) {
  const statements: string[] = [];
  const inserted: unknown[][] = [];
  const run: SqlRunner = async <R>(sql: string, params: unknown[]): Promise<R[]> => {
    statements.push(sql);
    if (sql.includes("FROM source_artifacts")) {
      if (options.artifactEventId && options.artifactEventId !== params[1]) return [];
      return [{
        id: artifactId,
        blob_uri: options.blobUri ?? `meridian-health/${eventId}/${artifactId}/synthetic.pdf`,
        blob_container: "source-artifacts",
        document_sha256: options.artifactHash ?? hash,
        mime_type: "application/pdf",
        artifact_type: options.artifactType ?? "nda_template",
        uploader_user_id: "uploader-anand",
      }] as R[];
    }
    if (sql.includes("INSERT INTO source_nda_template_versions")) {
      inserted.push(params);
      return [{ id: "33333333-3333-4333-8333-333333333333" }] as R[];
    }
    return [];
  };
  const tx: TxSessionRunner = async (body) => body(run);
  const download = jest.fn(async () => pdf);
  const extractText = jest.fn(async (): Promise<string | null> => "SYNTHETIC TEST FIXTURE\nMutual NDA template");
  return { tx, download, extractText, statements, inserted };
}

it("publishes only a hash-verified private synthetic PDF under the named admin actor", async () => {
  const f = fixture();
  expect(await publishSyntheticTemplate(input, { tx: f.tx, download: f.download, extractText: f.extractText })).toEqual({
    ok: true, id: "33333333-3333-4333-8333-333333333333",
  });
  expect(f.download).toHaveBeenCalledWith("source-artifacts", `meridian-health/${eventId}/${artifactId}/synthetic.pdf`);
  expect(f.statements.some((sql) => sql.includes("tenant_key = $1") && sql.includes("source_event_row_id = $2::uuid"))).toBe(true);
  expect(f.inserted).toHaveLength(1);
  expect(f.inserted[0]).toEqual(expect.arrayContaining([eventId, hash, "person-anand", "Anand"]));
  expect(f.statements.some((sql) => sql.includes("'synthetic_admin'") && sql.includes("source_event_id"))).toBe(true);
});

it("refuses other tenants, missing acknowledgement and anonymous actors before database access", async () => {
  for (const change of [
    { clientKey: "real-client" },
    { acknowledged: false },
    { actorUserId: "" },
  ]) {
    const f = fixture();
    expect(await publishSyntheticTemplate({ ...input, ...change }, { tx: f.tx, download: f.download, extractText: f.extractText })).toEqual({
      ok: false, code: "invalid_publication",
    });
    expect(f.statements).toEqual([]);
    expect(f.download).not.toHaveBeenCalled();
  }
});

it("refuses a file from another event or wrong artifact kind", async () => {
  for (const options of [
    { artifactEventId: "44444444-4444-4444-8444-444444444444" },
    { artifactType: "nda_executed" },
    { blobUri: "meridian-health/other-event/synthetic.pdf" },
  ]) {
    const f = fixture(options);
    expect(await publishSyntheticTemplate(input, { tx: f.tx, download: f.download, extractText: f.extractText })).toEqual({
      ok: false, code: "template_artifact_unavailable",
    });
    expect(f.inserted).toHaveLength(0);
  }
});

it("refuses bytes that do not match the registered PDF hash", async () => {
  const f = fixture({ artifactHash: "a".repeat(64) });
  expect(await publishSyntheticTemplate(input, { tx: f.tx, download: f.download, extractText: f.extractText })).toEqual({
    ok: false, code: "template_bytes_mismatch",
  });
  expect(f.inserted).toHaveLength(0);
});

it("refuses a readable PDF without the synthetic-fixture marker", async () => {
  const f = fixture();
  f.extractText.mockResolvedValue("Ordinary mutual NDA");
  expect(await publishSyntheticTemplate(input, { tx: f.tx, download: f.download, extractText: f.extractText })).toEqual({
    ok: false, code: "template_not_synthetic",
  });
  expect(f.inserted).toHaveLength(0);
});

it("distinguishes a failed PDF extraction from a missing synthetic marker", async () => {
  const f = fixture();
  f.extractText.mockResolvedValue(null);
  expect(await publishSyntheticTemplate(input, { tx: f.tx, download: f.download, extractText: f.extractText })).toEqual({
    ok: false, code: "template_text_unavailable",
  });
  expect(f.inserted).toHaveLength(0);
});

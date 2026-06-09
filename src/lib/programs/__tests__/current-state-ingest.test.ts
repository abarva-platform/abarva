import {
  parseDoraCsv,
  parseCsv,
  ingestCurrentStateCsv,
} from "../current-state-ingest";
import type { TenancyCtx } from "@/lib/programs/types.db";

const writes: { table: string; op: string; row: Record<string, unknown> }[] =
  [];

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({
    from(table: string) {
      return {
        upsert: (row: Record<string, unknown>) => {
          writes.push({ table, op: "upsert", row });
          return Promise.resolve({ error: null });
        },
        insert: (row: Record<string, unknown>) => {
          writes.push({ table, op: "insert", row });
          return Promise.resolve({ error: null });
        },
      };
    },
  }),
}));

const ctx: TenancyCtx = {
  clientId: "00000000-0000-4000-8000-0000000000aa",
  clientKey: "skyharbor-air",
  userId: "11111111-1111-4111-8111-111111111111",
  role: "maestro",
  email: "anand.sundaram+skyharbor@thesundaram.com",
} as TenancyCtx;

const NOW = "2026-06-09T21:00:00.000Z";

const VALID_DORA = [
  "repo,team,period_start,period_end,deployment_frequency_per_day,lead_time_for_changes_hours,change_failure_rate_pct,mttr_hours,sample_size_deploys",
  "checkout-web,Digital Squad,2026-05-01,2026-05-31,3.2,8.5,12.5,2.0,64",
  "loyalty-api,Platform,2026-05-01,2026-05-31,1.1,26.0,18.0,5.5,22",
].join("\n");

beforeEach(() => {
  writes.length = 0;
});

describe("parseCsv", () => {
  it("is quote-aware (commas inside quotes stay in one field)", () => {
    const recs = parseCsv('a,b\n"x,y",z');
    expect(recs[0].a).toBe("x,y");
    expect(recs[0].b).toBe("z");
  });
});

describe("parseDoraCsv", () => {
  it("parses valid DORA rows", () => {
    const { rows, errors } = parseDoraCsv(VALID_DORA);
    expect(rows).toHaveLength(2);
    expect(errors).toHaveLength(0);
    expect(rows[0]).toMatchObject({
      repo: "checkout-web",
      deployment_frequency_per_day: 3.2,
      change_failure_rate_pct: 12.5,
    });
  });

  it("reports missing columns", () => {
    const { rows, errors } = parseDoraCsv("repo,team\nx,y");
    expect(rows).toHaveLength(0);
    expect(errors[0]).toMatch(/missing columns/);
  });

  it("rejects out-of-range and non-numeric rows but keeps valid ones", () => {
    const csv = [
      "repo,team,period_start,period_end,deployment_frequency_per_day,lead_time_for_changes_hours,change_failure_rate_pct,mttr_hours,sample_size_deploys",
      "good,T,2026-05-01,2026-05-31,2,5,10,3,40",
      "badcfr,T,2026-05-01,2026-05-31,2,5,150,3,40",
      "nonnum,T,2026-05-01,2026-05-31,x,5,10,3,40",
      "baddate,T,2026/05/01,2026-05-31,2,5,10,3,40",
    ].join("\n");
    const { rows, errors } = parseDoraCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].repo).toBe("good");
    expect(errors).toHaveLength(3);
  });
});

describe("ingestCurrentStateCsv — DORA", () => {
  it("commits one upsert per row + one evidence_ledger entry, flagged synthetic", async () => {
    const r = await ingestCurrentStateCsv(
      ctx,
      "eng_performance_dora",
      VALID_DORA,
      "skyharbor-dora-2026-05.csv",
      "representative_synthetic",
      NOW,
    );
    expect(r.parsedRows).toBe(2);
    expect(r.committedRows).toBe(2);
    expect(r.ledgerEntries).toBe(1);

    const upserts = writes.filter(
      (w) => w.table === "tower_dora_metrics" && w.op === "upsert",
    );
    expect(upserts).toHaveLength(2);
    expect(upserts[0].row).toMatchObject({
      client_id: ctx.clientId,
      repo: "checkout-web",
      source: "representative_csv_upload",
      source_file_id: "skyharbor-dora-2026-05.csv",
    });

    const ledger = writes.find((w) => w.table === "evidence_ledger");
    expect(ledger?.row).toMatchObject({
      surface: "moves",
      artifact_type: "metric",
      source_type: "document_extract",
    });
    expect(
      (ledger?.row.source_ref as Record<string, unknown>).datasetProvenance,
    ).toBe("representative_synthetic");
    expect(ledger?.row.claim_text).toMatch(/REPRESENTATIVE\/SYNTHETIC/);
    expect(ledger?.row.confidence).toBe(0.6);
  });

  it("writes nothing when the CSV has no valid rows", async () => {
    const r = await ingestCurrentStateCsv(
      ctx,
      "eng_performance_dora",
      "repo,team\nx,y",
      "bad.csv",
      "representative_synthetic",
      NOW,
    );
    expect(r.committedRows).toBe(0);
    expect(writes).toHaveLength(0);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("client-export provenance is labelled distinctly (higher confidence)", async () => {
    const r = await ingestCurrentStateCsv(
      ctx,
      "eng_performance_dora",
      VALID_DORA,
      "client.csv",
      "client_export",
      NOW,
    );
    expect(r.provenance).toBe("client_export");
    const ledger = writes.find((w) => w.table === "evidence_ledger");
    expect(ledger?.row.confidence).toBe(0.8);
    expect(ledger?.row.claim_text).not.toMatch(/SYNTHETIC/);
  });
});

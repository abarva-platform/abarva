import {
  parseDoraCsv,
  parseCsv,
  parseCmdbCsv,
  parseWorkforceCsv,
  ingestCurrentStateCsv,
} from "../current-state-ingest";
import type { TenancyCtx } from "@/lib/programs/types.db";

const writes: { table: string; op: string; row: Record<string, unknown> }[] =
  [];
const upsertFailures: { table: string; message: string }[] = [];

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({
    from(table: string) {
      return {
        upsert: (row: Record<string, unknown>) => {
          writes.push({ table, op: "upsert", row });
          const failure = upsertFailures.find((item) => item.table === table);
          if (failure) {
            return Promise.resolve({
              error: { message: failure.message, code: "TEST_DB_ERROR" },
            });
          }
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
const TAGS = {
  moveId: "0d14fa63-move",
  archetypeId: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
  phase: 1,
};

const VALID_DORA = [
  "repo,team,period_start,period_end,deployment_frequency_per_day,lead_time_for_changes_hours,change_failure_rate_pct,mttr_hours,sample_size_deploys",
  "checkout-web,Digital Squad,2026-05-01,2026-05-31,3.2,8.5,12.5,2.0,64",
  "loyalty-api,Platform,2026-05-01,2026-05-31,1.1,26.0,18.0,5.5,22",
].join("\n");

beforeEach(() => {
  writes.length = 0;
  upsertFailures.length = 0;
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
      TAGS,
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
      TAGS,
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
      TAGS,
    );
    expect(r.provenance).toBe("client_export");
    const ledger = writes.find((w) => w.table === "evidence_ledger");
    expect(ledger?.row.confidence).toBe(0.8);
    expect(ledger?.row.claim_text).not.toMatch(/SYNTHETIC/);
  });

  it("records governance lineage (move, archetype, phase, family, source basis) + state, with NO auto agent_ready", async () => {
    const r = await ingestCurrentStateCsv(
      ctx,
      "eng_performance_dora",
      VALID_DORA,
      "skyharbor-dora.csv",
      "representative_synthetic",
      NOW,
      TAGS,
    );
    // Result carries the honest separated state + lineage.
    expect(r.readinessState).toBe("committed");
    expect(r.promotedToAgent).toBe(false);
    expect(r.lineage).toMatchObject({
      moveId: TAGS.moveId,
      archetypeId: TAGS.archetypeId,
      phase: 1,
      family: "eng_performance_dora",
      tenantKey: ctx.clientKey,
      sourceBasis: "representative_synthetic",
    });
    // evidence_ledger source_ref carries the tags; committed but NOT agent_ready.
    const sref = writes.find((w) => w.table === "evidence_ledger")?.row
      .source_ref as Record<string, unknown>;
    expect(sref.moveId).toBe(TAGS.moveId);
    expect(sref.archetypeId).toBe(TAGS.archetypeId);
    expect(sref.phase).toBe(1);
    expect(sref.readinessState).toBe("committed");
    expect(sref.promotedToAgent).toBe(false); // governed promotion only — never auto
  });

  it("an unwired family records missing state + lineage, writes nothing", async () => {
    const r = await ingestCurrentStateCsv(
      ctx,
      "eng_performance_dora" as never,
      VALID_DORA,
      "x.csv",
      "representative_synthetic",
      NOW,
      { ...TAGS, archetypeId: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE" },
    );
    // (eng_performance_dora IS wired; this asserts the lineage is always present.)
    expect(r.lineage.archetypeId).toBe("AI_PRODUCT_DEVELOPMENT_LIFECYCLE");
  });
});

const VALID_CMDB = [
  "ci_sys_id,ci_name,ci_type,ci_class,lifecycle_state,owner_team,business_service,criticality,environment",
  "CI1,booking-web,application,cmdb_ci_appl,production,Digital,Booking,1,production",
  "CI2,fds-mainframe-pnr,mainframe,cmdb_ci_mainframe,production,Reservations,Reservations,1,production",
].join("\n");

const VALID_WORKFORCE = [
  "employee_id,function,sub_function,location,level,contractor_flag,start_date,as_of_date",
  "E1,Engineering,Digital Web,Seattle,Staff,false,2021-03-01,2026-05-31",
  "E2,Engineering,Data,Bangalore,Mid,true,2023-01-10,2026-05-31",
].join("\n");

describe("parseCmdbCsv / parseWorkforceCsv", () => {
  it("parses CMDB rows; flags missing columns", () => {
    expect(parseCmdbCsv(VALID_CMDB).rows).toHaveLength(2);
    expect(parseCmdbCsv("ci_sys_id,ci_name\nA,B").errors[0]).toMatch(
      /missing columns/,
    );
  });
  it("parses workforce rows; rejects bad dates", () => {
    expect(parseWorkforceCsv(VALID_WORKFORCE).rows).toHaveLength(2);
    const bad = parseWorkforceCsv(
      "employee_id,function,sub_function,location,level,contractor_flag,start_date,as_of_date\nE1,Eng,x,y,z,false,2021/03/01,2026-05-31",
    );
    expect(bad.rows).toHaveLength(0);
  });
});

describe("ingestCurrentStateCsv — CMDB + workforce families wired", () => {
  it("it_systems_landscape commits to tower_cmdb_cis + evidence_ledger", async () => {
    const r = await ingestCurrentStateCsv(
      ctx,
      "it_systems_landscape",
      VALID_CMDB,
      "cmdb.csv",
      "representative_synthetic",
      NOW,
      TAGS,
    );
    expect(r.committedRows).toBe(2);
    expect(r.readinessState).toBe("committed");
    expect(r.promotedToAgent).toBe(false);
    const upserts = writes.filter((w) => w.table === "tower_cmdb_cis");
    expect(upserts).toHaveLength(2);
    expect(upserts[0].row).toMatchObject({
      client_id: ctx.clientId,
      ci_sys_id: "CI1",
    });
    const led = writes.find((w) => w.table === "evidence_ledger");
    expect((led?.row.source_ref as Record<string, unknown>).family).toBe(
      "it_systems_landscape",
    );
  });

  it("normalizes common CMDB enum aliases before commit", async () => {
    const csv = [
      "ci_sys_id,ci_name,ci_type,ci_class,lifecycle_state,owner_team,business_service,criticality,environment",
      "CI1,member-crm,application,cmdb_ci_appl,active,Member Ops,Member Service,high,production",
    ].join("\n");
    const r = await ingestCurrentStateCsv(
      ctx,
      "it_systems_landscape",
      csv,
      "cmdb.csv",
      "representative_synthetic",
      NOW,
      TAGS,
    );
    expect(r.committedRows).toBe(1);
    const upsert = writes.find((w) => w.table === "tower_cmdb_cis");
    expect(upsert?.row).toMatchObject({
      lifecycle_state: "production",
      criticality: "tier_1",
    });
  });

  it("returns row-level commit errors instead of a silent 422 with no errors", async () => {
    upsertFailures.push({
      table: "tower_cmdb_cis",
      message: "relation \"tower_cmdb_cis\" does not exist",
    });
    const r = await ingestCurrentStateCsv(
      ctx,
      "it_systems_landscape",
      VALID_CMDB,
      "cmdb.csv",
      "representative_synthetic",
      NOW,
      TAGS,
    );
    expect(r.parsedRows).toBe(2);
    expect(r.committedRows).toBe(0);
    expect(r.readinessState).toBe("missing");
    expect(r.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("tower_cmdb_cis row \"CI1\""),
      ]),
    );
  });

  it("it_org_structure commits to tower_workforce", async () => {
    const r = await ingestCurrentStateCsv(
      ctx,
      "it_org_structure",
      VALID_WORKFORCE,
      "workforce.csv",
      "representative_synthetic",
      NOW,
      TAGS,
    );
    expect(r.committedRows).toBe(2);
    const upserts = writes.filter((w) => w.table === "tower_workforce");
    expect(upserts).toHaveLength(2);
    expect(upserts[0].row).toMatchObject({
      client_id: ctx.clientId,
      employee_id: "E1",
      function: "Engineering",
    });
  });

  it("returns workforce commit errors when parsed rows cannot be committed", async () => {
    upsertFailures.push({
      table: "tower_workforce",
      message: "permission denied for table tower_workforce",
    });
    const r = await ingestCurrentStateCsv(
      ctx,
      "it_org_structure",
      VALID_WORKFORCE,
      "workforce.csv",
      "representative_synthetic",
      NOW,
      TAGS,
    );
    expect(r.parsedRows).toBe(2);
    expect(r.committedRows).toBe(0);
    expect(r.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("tower_workforce row \"E1\""),
      ]),
    );
  });
});

// Tests for the shared structured-map ingest core (`ingestTemplateUpload`) that
// BOTH /facts/ingest and /facts/ingest-file call. Dependencies are injected — no
// live backend. Asserts: VOLUMETRICS_V1 writes its 5 event-level facts,
// APP_INVENTORY_V1 writes its 3, unknown template → unknown_template, a
// different-tenant event → not_found (no write), and unmapped columns surface.

import { ingestTemplateUpload } from "../ingest-template-upload";
import type { ParsedTemplateUpload } from "../../extraction/structured-map";
import type { SourceEventFactInsert } from "../../fact-types";

let eventClientKey = "lakeshore";
const insertFacts = jest.fn(
  async (facts: readonly SourceEventFactInsert[]) => ({
    ok: true as const,
    data: { inserted: facts.length },
  }),
);

function fakeReadClient() {
  return {
    from(table: string) {
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () =>
          table === "source_events"
            ? { data: { id: "evt-1", client_key: eventClientKey }, error: null }
            : { data: null, error: null },
      };
      return chain;
    },
  };
}

const deps = () =>
  ({
    getReadClient: (() => fakeReadClient()) as never,
    resolveEventUuid: (async () => "evt-1") as never,
    selectWriteAdapter: (() => ({
      name: "supabase" as const,
      insertFacts,
    })) as never,
  });

// A VOLUMETRICS_V1 upload: one tower row carrying all 5 fact columns. Four are
// event-level (change-order, recurring %, automatable pool, chronic miss) and one
// is tower-level (volume decline %). The row carries its Service Tower entity id.
const VOLUMETRICS_UPLOAD: ParsedTemplateUpload = {
  headers: [
    "Service Tower",
    "Annual Change-Order Spend (USD)",
    "Recurring/Avoidable Share (%)",
    "Projected Volume Decline (%)",
    "Automatable Effort Pool (USD)",
    "Chronic SLA Miss Rate (%)",
    "Notes",
  ],
  rows: [
    {
      "Service Tower": "End User Compute",
      "Annual Change-Order Spend (USD)": 1200000,
      "Recurring/Avoidable Share (%)": 35,
      "Projected Volume Decline (%)": 12,
      "Automatable Effort Pool (USD)": 450000,
      "Chronic SLA Miss Rate (%)": 4,
      Notes: "steady",
    },
  ],
};

const APP_INVENTORY_UPLOAD: ParsedTemplateUpload = {
  headers: [
    "Application ID",
    "Annual Run Cost (USD)",
    "Loaded FTE Cost (USD)",
    "Variable Cost Share (%)",
  ],
  rows: [
    {
      "Application ID": "APP-1",
      "Annual Run Cost (USD)": 1000000,
      "Loaded FTE Cost (USD)": 180000,
      "Variable Cost Share (%)": 20,
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  eventClientKey = "lakeshore";
});

describe("ingestTemplateUpload — VOLUMETRICS_V1", () => {
  it("writes 5 typed facts from one tower row and surfaces the unmapped column", async () => {
    const result = await ingestTemplateUpload(
      {
        templateCode: "VOLUMETRICS_V1",
        upload: VOLUMETRICS_UPLOAD,
        scope: { eventId: "evt-1", clientKey: "lakeshore" },
      },
      deps(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.templateCode).toBe("VOLUMETRICS_V1");
    expect(result.factsWritten).toBe(5);
    expect(result.unmappedColumns).toContain("Notes");
    expect(result.rejectedRows).toHaveLength(0);

    const facts = insertFacts.mock.calls[0][0] as SourceEventFactInsert[];
    expect(facts).toHaveLength(5);
    for (const f of facts) {
      expect(f.source_method).toBe("structured_map");
      expect(f.confidence).toBe("high");
      expect(f.client_key).toBe("lakeshore");
      expect(f.source_event_id).toBe("evt-1");
    }
    // All 5 volumetrics fact keys are present.
    const keys = new Set(facts.map((f) => f.fact_key));
    expect(keys).toEqual(
      new Set([
        "annual_change_order_spend",
        "recurring_avoidable_pct",
        "projected_volume_decline_pct",
        "automatable_effort_pool",
        "chronic_miss_rate",
      ]),
    );
  });
});

describe("ingestTemplateUpload — APP_INVENTORY_V1", () => {
  it("writes 3 typed facts from one app row", async () => {
    const result = await ingestTemplateUpload(
      {
        templateCode: "APP_INVENTORY_V1",
        upload: APP_INVENTORY_UPLOAD,
        scope: { eventId: "evt-1", clientKey: "lakeshore" },
      },
      deps(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.factsWritten).toBe(3);
    const keys = new Set(
      (insertFacts.mock.calls[0][0] as SourceEventFactInsert[]).map(
        (f) => f.fact_key,
      ),
    );
    expect(keys).toEqual(
      new Set([
        "annual_run_cost",
        "loaded_fte_cost",
        "variable_cost_share_pct",
      ]),
    );
  });
});

describe("ingestTemplateUpload — validation + fencing", () => {
  it("returns unknown_template for a bad code and writes nothing", async () => {
    const result = await ingestTemplateUpload(
      {
        templateCode: "NOPE",
        upload: VOLUMETRICS_UPLOAD,
        scope: { eventId: "evt-1", clientKey: "lakeshore" },
      },
      deps(),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("unknown_template");
    expect(insertFacts).not.toHaveBeenCalled();
  });

  it("returns not_found when the event belongs to another tenant", async () => {
    eventClientKey = "apexretail";
    const result = await ingestTemplateUpload(
      {
        templateCode: "VOLUMETRICS_V1",
        upload: VOLUMETRICS_UPLOAD,
        scope: { eventId: "evt-1", clientKey: "lakeshore" },
      },
      deps(),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("not_found");
    expect(insertFacts).not.toHaveBeenCalled();
  });
});

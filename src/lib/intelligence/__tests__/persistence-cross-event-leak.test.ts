/**
 * `buildTenantContextBlock` / `queryEnterpriseContextChunks` · cross-Source-event
 * leak regression (3rd attempt after #4602 and #4605).
 *
 * Both #4602 and #4605 correctly gated two OTHER generic-context injection
 * paths in `src/app/api/chat/agent/route.ts` behind
 * `shouldSuppressGenericContextBundleForSourceMode(sourceAvaAnswerMode)`:
 *   - `contextBundlePromptBlockForPrompt` (getContextBroker().assemble)
 *   - `agentTenantContextBlockForPrompt` (buildProgramsContextBundle(Async))
 *
 * Live re-testing after BOTH were deployed still reproduced the symptom:
 * asking "What evidence is missing?" on the RFP stage of a real Lakeshore
 * Source event (adcb1cd0-c586-4622-bd29-574cc5a10862, AMS Sourcing Event)
 * answered by naming a DIFFERENT, real Lakeshore Source event — "Kyriba
 * Treasury Rollout Commercial Readiness" (LSH-KYRIBA-TREASURY-2026) — a
 * cross-event leak, not the cross-module leak either prior fix targeted.
 *
 * This test proves the THIRD, still-live path: `tenantSystemBlock` in
 * route.ts (line ~1074) is built from
 * `buildTenantContextBlock(tenantInventoryKey)` (this file,
 * `src/lib/intelligence/persistence.ts`), which queries
 * `enterprise_context_chunks` filtered ONLY by `tenant_key` +
 * `source_segment_id` (`program_inventory`, `it_landscape`,
 * `cross_program_signals`, ...) — with NO event/program id filter at all.
 * `tenantSystemBlock` is injected into the system prompt array (route.ts
 * line ~1899) completely unconditionally — it is never derived through
 * `shouldSuppressGenericContextBundleForSourceMode`, unlike the two paths
 * #4602/#4605 fixed. So when a tenant has more than one Source event's data
 * ingested into `enterprise_context_chunks` under the same tenant-wide
 * segments, EVERY event's chunk is fetched and concatenated into the SAME
 * prompt block, regardless of which event the user is actually viewing.
 *
 * This test constructs a realistic two-event Lakeshore fixture (the current
 * AMS event's chunk + a second "Kyriba Treasury Rollout" chunk under the
 * SAME tenant + segment) and proves `buildTenantContextBlock` returns BOTH —
 * i.e. the cross-event leak is real and reproducible without any live DB.
 */

const fromMock = jest.fn();

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({
    from: (...args: unknown[]) => fromMock(...args),
  }),
}));

import {
  buildTenantContextBlock,
  queryEnterpriseContextChunks,
  filterChunksToActiveSourceEvent,
} from "../persistence";

interface FixtureChunk {
  chunk_text: string;
  source_segment_id: string;
  chunk_metadata: Record<string, unknown>;
}

/**
 * Builds a chainable query-builder stub matching the exact call sequence
 * `queryEnterpriseContextChunks` makes:
 *   .from(table).select(cols).eq(col,val).eq(col,val).order(col,opts).limit(n)
 * `rowsBySegment` maps `source_segment_id` -> the rows to resolve with, so
 * the mock can return DIFFERENT rows for `program_inventory` vs
 * `it_landscape` vs `cross_program_signals`, matching a real per-segment
 * query.
 */
function makeFromMock(rowsBySegment: Record<string, FixtureChunk[]>) {
  return (table: string) => {
    let filters: Record<string, unknown> = {};
    const builder = {
      select: () => builder,
      eq: (col: string, val: unknown) => {
        filters = { ...filters, [col]: val };
        return builder;
      },
      order: () => builder,
      limit: () => {
        if (table !== "enterprise_context_chunks") {
          return Promise.resolve({ data: [], error: null });
        }
        const segment = filters.source_segment_id as string | undefined;
        const rows = segment ? (rowsBySegment[segment] ?? []) : [];
        return Promise.resolve({ data: rows, error: null });
      },
    };
    return builder;
  };
}

describe("buildTenantContextBlock · cross-Source-event leak (3rd attempt)", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("REPRODUCES THE BUG: returns the OTHER Source event's chunk alongside the current event's chunk, with no event-id filter applied anywhere in the query", async () => {
    // Two Lakeshore Source events' facts land in the SAME tenant-wide
    // `program_inventory` segment — exactly what real ingestion of two
    // separate Source events for the same tenant would produce, since
    // nothing in the ingestion or read path partitions by source_event_id.
    fromMock.mockImplementation(
      makeFromMock({
        program_inventory: [
          {
            chunk_text:
              "Lakeshore Holdings AMS Sourcing Event (LAKE-AMS-2026-46EADB28): business context status review required; measured value of $18.9M is on record but the business context backing that figure is incomplete.",
            source_segment_id: "program_inventory",
            chunk_metadata: { source_event_id: "adcb1cd0-c586-4622-bd29-574cc5a10862" },
          },
          {
            chunk_text:
              "Kyriba Treasury Rollout Commercial Readiness (LSH-KYRIBA-TREASURY-2026): $42.0M event; business context status review required.",
            source_segment_id: "program_inventory",
            chunk_metadata: { source_event_id: "OTHER-EVENT-KYRIBA-0001" },
          },
        ],
      }),
    );

    const chunks = await queryEnterpriseContextChunks("lakeshore", [
      "program_inventory",
    ]);

    // THE BUG: both events' chunks come back for a query scoped only by
    // tenant_key — nothing here says "eventId = adcb1cd0-...".
    expect(chunks).toHaveLength(2);
    expect(fromMock).toHaveBeenCalledWith("enterprise_context_chunks");

    const block = await buildTenantContextBlock("lakeshore");
    expect(block).not.toBeNull();
    // The current event's content is present (expected)...
    expect(block).toContain("LAKE-AMS-2026-46EADB28");
    // ...but so is the OTHER Lakeshore Source event's content — the
    // cross-event leak. This assertion is what proves the live symptom:
    // asking about the AMS event's evidence pulls in Kyriba's data too.
    expect(block).toContain("Kyriba Treasury Rollout");
    expect(block).toContain("LSH-KYRIBA-TREASURY-2026");
  });

  it("confirms the query never sends an event/program-scoping filter (only tenant_key + source_segment_id)", async () => {
    const eqCalls: Array<[string, unknown]> = [];
    fromMock.mockImplementation(() => {
      const builder = {
        select: () => builder,
        eq: (col: string, val: unknown) => {
          eqCalls.push([col, val]);
          return builder;
        },
        order: () => builder,
        limit: () => Promise.resolve({ data: [], error: null }),
      };
      return builder;
    });

    await queryEnterpriseContextChunks("lakeshore", ["program_inventory"]);

    const filteredColumns = eqCalls.map(([col]) => col);
    expect(filteredColumns).toEqual(
      expect.arrayContaining(["tenant_key", "source_segment_id"]),
    );
    // The actual regression: no source_event_id / event_id / program_id
    // filter is ever applied by this query.
    expect(filteredColumns).not.toContain("source_event_id");
    expect(filteredColumns).not.toContain("event_id");
    expect(filteredColumns).not.toContain("program_id");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Coordinator-reframed reproduction: seed TWO Lakeshore Source events
// carrying the EXACT distinctive terms that leaked live ("Kyriba",
// "treasury rollout", "$18.9M", "220 active users"), ask an evidence-
// readiness question scoped to Event A (AMS), and prove:
//   RED  — with NO event-scope guard applied (the pre-fix call shape),
//          all four Kyriba-only terms leak into the block.
//   GREEN — with the guard applied (the fix), none of them do, and
//          Event A's own real content is still present.
// ─────────────────────────────────────────────────────────────────────────────
describe("cross-event leak — exact live reproduction terms (Event A vs Event B)", () => {
  const EVENT_A_CODE = "LAKE-AMS-2026-46EADB28";
  const EVENT_B_CODE = "LSH-KYRIBA-TREASURY-2026";

  const eventARow = {
    chunk_text:
      `Lakeshore Holdings AMS Sourcing Event (${EVENT_A_CODE}): business context status review required; the sourcing lead has not yet uploaded the vendor SOW backing the recommended AMS scope.`,
    source_segment_id: "program_inventory",
    chunk_metadata: {},
  };
  const eventBRow = {
    chunk_text:
      `Kyriba Treasury Rollout Commercial Readiness (${EVENT_B_CODE}): treasury rollout measured value of $18.9M is on record across 220 active users; business context status review required.`,
    source_segment_id: "program_inventory",
    chunk_metadata: {},
  };

  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockImplementation(
      makeFromMock({ program_inventory: [eventARow, eventBRow] }),
    );
  });

  it("RED — before the fix (no guard passed), the AMS-scoped block leaks all 4 Kyriba-only terms", async () => {
    // This is the exact call shape route.ts used PRIOR to this fix:
    // `buildTenantContextBlock(tenantInventoryKey)` with no event scope.
    const block = await buildTenantContextBlock("lakeshore");
    expect(block).not.toBeNull();
    const text = block as string;

    // Event A's own content is present (expected either way).
    expect(text).toContain(EVENT_A_CODE);

    // THE BUG: every distinctive Event-B-only term the live symptom
    // actually produced is present in what would become the AMS event's
    // system-prompt block.
    expect(text).toContain("Kyriba");
    expect(text).toContain("treasury rollout");
    expect(text).toContain("$18.9M");
    expect(text).toContain("220 active users");
  });

  it("GREEN — after the fix (guard passed with Event A active + Event B in otherEventCodes), none of the 4 Kyriba-only terms appear, and Event A's real content still does", async () => {
    const block = await buildTenantContextBlock("lakeshore", {
      activeEventCode: EVENT_A_CODE,
      otherEventCodes: [EVENT_B_CODE],
    });
    expect(block).not.toBeNull();
    const text = block as string;

    // Event A's own evidence-readiness content is still surfaced — the fix
    // must not blank out the block, only the cross-event content.
    expect(text).toContain(EVENT_A_CODE);
    expect(text).toContain("vendor SOW");

    // None of the Kyriba-only terms leak through anymore.
    expect(text).not.toContain("Kyriba");
    expect(text).not.toContain("treasury rollout");
    expect(text).not.toContain("$18.9M");
    expect(text).not.toContain("220 active users");
  });

  it("filterChunksToActiveSourceEvent reports the exact drop count + dropped event code (diagnostic log payload)", () => {
    const result = filterChunksToActiveSourceEvent([eventARow, eventBRow], {
      activeEventCode: EVENT_A_CODE,
      otherEventCodes: [EVENT_B_CODE],
    });
    expect(result.kept).toHaveLength(1);
    expect(result.kept[0]).toBe(eventARow);
    expect(result.droppedCount).toBe(1);
    expect(result.droppedEventCodes).toEqual([EVENT_B_CODE]);
  });
});

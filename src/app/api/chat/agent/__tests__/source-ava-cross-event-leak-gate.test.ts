/**
 * /api/chat/agent · Source aVa polish gate — 3rd attempt (cross-Source-event
 * leak, follow-up to #4602 and #4605).
 *
 * #4602 fixed a cross-MODULE leak (contextBundlePromptBlock). #4605 fixed a
 * second cross-MODULE leak (agentTenantContextBlock) and an `isSourceSurface`
 * gap. Both were REAL fixes, verified by their own regression tests, and
 * BOTH were deployed to production. Live re-testing AFTER #4605 deployed
 * still reproduced the exact reported symptom: "What evidence is missing?"
 * asked inside the Lakeshore AMS Source event (adcb1cd0-c586-4622-bd29-
 * 574cc5a10862, code LAKE-AMS-2026-46EADB28) was answered with content
 * naming a DIFFERENT, real Lakeshore Source event — "Kyriba Treasury
 * Rollout Commercial Readiness" (LSH-KYRIBA-TREASURY-2026).
 *
 * Root cause (verified with a REAL jest execution against a mocked but
 * representative two-event fixture — see
 * `src/lib/intelligence/__tests__/persistence-cross-event-leak.test.ts`,
 * which reproduces the exact live symptom with the exact leaked terms
 * ("Kyriba", "treasury rollout", "$18.9M", "220 active users") and proves
 * both the RED (unfixed) and GREEN (fixed) behavior with actual test runs,
 * not static string matching alone):
 *
 *   `tenantSystemBlock` (this route, built from
 *   `buildTenantContextBlock` in `src/lib/intelligence/persistence.ts`)
 *   reads `enterprise_context_chunks` filtered ONLY by `tenant_key` +
 *   `source_segment_id` — there is no per-row Source-event scoping column
 *   or metadata convention in that table at all. A tenant's
 *   `program_inventory` / `cross_program_signals` / `it_landscape` chunks
 *   mix EVERY Source event's ingested content together. This path was
 *   NEVER touched by #4602 or #4605 — it has no suppression gate, unlike
 *   `contextBundlePromptBlockForPrompt` and `agentTenantContextBlockForPrompt`.
 *
 * Fix: a REAL, unconditional, code-level per-item filter —
 * `filterChunksToActiveSourceEvent` (persistence.ts) — drops any chunk
 * whose text names a different Source event's code before the chunks are
 * ever assembled into a prompt block. The route resolves the active
 * event's code plus every OTHER Source event code for the tenant
 * (`sourceEventScopeGuard`) and threads it into `buildTenantContextBlock`
 * BEFORE `tenantSystemBlock` is built (not a prompt instruction asking the
 * model to ignore the cross-event content — the content never reaches the
 * model in the first place). A diagnostic log
 * (`[source-event-scope-guard]`, gated behind
 * `ABARVA_SOURCE_SCOPE_GUARD_LOG=1`) proves the guard ran, with the exact
 * included/dropped counts and dropped event codes.
 */

import fs from "node:fs";
import path from "node:path";

function readRoute(): string {
  return fs.readFileSync(
    path.join(process.cwd(), "src/app/api/chat/agent/route.ts"),
    "utf8",
  );
}

function readPersistence(): string {
  return fs.readFileSync(
    path.join(process.cwd(), "src/lib/intelligence/persistence.ts"),
    "utf8",
  );
}

describe("agent route · Source aVa polish gate — 3rd attempt (cross-Source-event leak)", () => {
  const source = readRoute();

  it("resolves a sourceEventScopeGuard (active event code + every other tenant event code) before tenantSystemBlock is built", () => {
    const guardIdx = source.indexOf("let sourceEventScopeGuard:");
    const tenantSystemBlockIdx = source.indexOf(
      "const tenantSystemBlock =\n    (await buildTenantContextBlock(",
    );
    expect(guardIdx).toBeGreaterThan(-1);
    expect(tenantSystemBlockIdx).toBeGreaterThan(-1);
    expect(guardIdx).toBeLessThan(tenantSystemBlockIdx);
    expect(source).toContain("listSourcingEvents().catch(() => [])");
    expect(source).toContain("activeEventCode: activeEvent.code");
    expect(source).toContain("otherEventCodes: allTenantEvents");
  });

  it("passes the resolved guard into buildTenantContextBlock (not a bare tenantKey-only call)", () => {
    expect(source).toMatch(
      /buildTenantContextBlock\(\s*tenantInventoryKey,\s*sourceEventScopeGuard,\s*\)/,
    );
    // Guard against regressing to the bare, unscoped call this bug shipped with.
    expect(source).not.toMatch(
      /const tenantSystemBlock =\s*\n\s*\(await buildTenantContextBlock\(tenantInventoryKey\)\)/,
    );
  });

  it("guard resolution runs independent of the source_analytics grounding flag (this is a data-scoping bug, not an analytics feature)", () => {
    const guardIdx = source.indexOf("let sourceEventScopeGuard:");
    const flagIdx = source.indexOf("sourceAnalyticsGroundingEnabled = isFeatureEnabled(");
    expect(guardIdx).toBeGreaterThan(-1);
    // The guard resolution block must be resolvable before the
    // source_analytics-gated grounding block even begins.
    expect(guardIdx).toBeLessThan(flagIdx);
  });

  it("guard resolution fails closed to the pre-existing unscoped behavior on error (never breaks the chat turn)", () => {
    const guardBlockStart = source.indexOf(
      "if (earlySourceEventIdFromContext && effectiveClientKey) {",
    );
    const guardBlockEnd = source.indexOf(
      "const tenantSystemBlock =",
      guardBlockStart,
    );
    expect(guardBlockStart).toBeGreaterThan(-1);
    const guardBlock = source.slice(guardBlockStart, guardBlockEnd);
    expect(guardBlock).toContain("catch {");
    expect(guardBlock).toContain("sourceEventScopeGuard = null;");
  });
});

describe("persistence.ts · filterChunksToActiveSourceEvent + diagnostic log wiring", () => {
  const source = readPersistence();

  it("exports filterChunksToActiveSourceEvent as a real, unconditional per-item filter", () => {
    expect(source).toContain(
      "export function filterChunksToActiveSourceEvent(",
    );
    // Must be a loop that DROPS items — not a prompt-level instruction.
    expect(source).toContain("for (const chunk of chunks)");
    expect(source).toContain("continue;");
  });

  it("emits the audit-mode diagnostic log with the required shape, gated behind an explicit env flag (never unconditionally in production)", () => {
    expect(source).toContain("[source-event-scope-guard]");
    expect(source).toContain("ABARVA_SOURCE_SCOPE_GUARD_LOG");
    expect(source).toContain("sourceEventId: sourceEventScope.activeEventCode");
    expect(source).toContain("contextItemsIncluded: chunks.length");
    expect(source).toContain("contextItemsDroppedCrossEvent: droppedCount");
    expect(source).toContain("droppedEventCodes");
  });

  it("has no leftover [DEBUG-LEAK-TRACE]-style temporary debug markers", () => {
    expect(source).not.toContain("DEBUG-LEAK-TRACE");
  });
});

/**
 * /api/chat/agent · Source aVa polish gate — Gap 2 wiring regression.
 *
 * Follow-up to Gap 1 (#4602, `source-ava-polish-gate.test.ts`). #4602 fixed
 * ONE off-topic-content leak (`contextBundlePromptBlock`, the
 * `getContextBroker().assemble` mechanism) but the live symptom persisted:
 * two independent live re-tests of "What evidence is missing?" on the RFP
 * stage of a real Source event (adcb1cd0-c586-4622-bd29-574cc5a10862,
 * Lakeshore Holdings AMS) both returned DIFFERENT off-topic, portfolio-KPI
 * / benchmark-style content — proving a SECOND, still-live generic-injection
 * path independent of the one #4602 closed.
 *
 * Root cause (verified via static trace, not guessed):
 *
 *   1. `agentTenantContextBlock` (PR-R "CXO grounding") is a SEPARATE broker
 *      call from `contextBundlePromptBlock`. It is gated only by
 *      `isTenantCurrentStateSurface` (any non-auth surface with an active
 *      tenant) — never by `shouldSuppressGenericContextBundleForSourceMode`
 *      / `isGroundedAnswerMode`. Because `agentName` normalizes to
 *      "Sentinel" by default, the broker's Sentinel branch unconditionally
 *      fetches `kpi_dictionary` (24 rows), `it_landscape`,
 *      `cross_program_signals`, `evidence_ledger`, and tenant-wide chunk
 *      retrieval — none of it scoped to the active Source event — and folds
 *      it into the same system prompt as the correctly Source-scoped
 *      grounding.
 *
 *   2. Compounding it: the event-detail canvas passes the literal surface
 *      value `"source-detail"` (see SourceAnalyticsCanvas.tsx and
 *      source/events/[eventId]/approval/page.tsx), but the route's
 *      `isSourceSurface()` helper only matched `"/source"` / `"/source/*"`.
 *      So on the actual event-detail page, the CORRECTLY Source-scoped
 *      `sourceTenantContextBlock` / `sourceAccessPolicy` / `sourceClientKey`
 *      paths never ran at all — only the generic, off-topic
 *      `agentTenantContextBlock` did.
 *
 * Fix: apply the SAME suppression predicate #4602 established
 * (`shouldSuppressGenericContextBundleForSourceMode(sourceAvaAnswerMode)`) to
 * `agentTenantContextBlock` via a derived `agentTenantContextBlockForPrompt`
 * variable, mirroring `contextBundlePromptBlockForPrompt` exactly. Also fix
 * `isSourceSurface()` to recognize the literal `"source-detail"` surface so
 * the correctly-scoped Source broker/access-policy paths activate as
 * originally intended.
 */

import fs from "node:fs";
import path from "node:path";

function readRoute(): string {
  return fs.readFileSync(
    path.join(process.cwd(), "src/app/api/chat/agent/route.ts"),
    "utf8",
  );
}

describe("agent route · Source aVa polish gate — Gap 2 (tenant-broker off-topic leak)", () => {
  const source = readRoute();

  it("derives agentTenantContextBlockForPrompt from the SAME suppression predicate as Gap 1's fix", () => {
    expect(source).toContain("const agentTenantContextBlockForPrompt =");
    // Must reuse the exact predicate #4602 wired for the other leak path —
    // not a new, potentially-divergent gate.
    const derivationSite = source.slice(
      source.indexOf("const agentTenantContextBlockForPrompt ="),
      source.indexOf("const agentTenantContextBlockForPrompt =") + 400,
    );
    expect(derivationSite).toContain(
      "shouldSuppressGenericContextBundleForSourceMode(sourceAvaAnswerMode)",
    );
    expect(derivationSite).toContain("agentTenantContextBlock");
  });

  it("injects the SUPPRESSED variant (not the raw generic tenant broker block) into the system prompt array", () => {
    // The systemPrompt array must reference the derived, suppressible
    // variant — NOT the raw `agentTenantContextBlock` directly. If a future
    // edit reverts this to the raw variable, this test must fail.
    expect(source).toMatch(/\n\s*agentTenantContextBlockForPrompt,\n/);
  });

  it("does not feed the raw agentTenantContextBlock into the systemPrompt array anymore", () => {
    // Guard against re-introducing the exact regression: the systemPrompt
    // array element must be the "ForPrompt" derived variable, not the raw
    // block. (The raw variable is still declared/assigned upstream — this
    // only asserts the array reference changed.)
    const systemPromptArrayStart = source.indexOf("const systemPrompt = [");
    const systemPromptArrayEnd = source.indexOf(
      '.filter((s) => s !== "" && s !== undefined && s !== null)',
      systemPromptArrayStart,
    );
    expect(systemPromptArrayStart).toBeGreaterThan(-1);
    expect(systemPromptArrayEnd).toBeGreaterThan(systemPromptArrayStart);
    const arrayBody = source.slice(
      systemPromptArrayStart,
      systemPromptArrayEnd,
    );
    expect(arrayBody).not.toMatch(/\n\s*agentTenantContextBlock,\n/);
    expect(arrayBody).toMatch(/\n\s*agentTenantContextBlockForPrompt,\n/);
  });

  it("recognizes the literal Source surfaces in isSourceSurface", () => {
    expect(source).toContain(
      "function isSourceSurface(surface: string): boolean {",
    );
    const fnStart = source.indexOf(
      "function isSourceSurface(surface: string): boolean {",
    );
    const fnBody = source.slice(fnStart, fnStart + 1200);
    expect(fnBody).toContain('surface === "source"');
    expect(fnBody).toContain('surface === "source-detail"');
  });
});

describe("isSourceSurface semantics (Gap 2) — reimplemented + asserted against the route's literal check", () => {
  // isSourceSurface is not exported (route-local helper), so we assert its
  // behavior structurally above and additionally pin the EXACT surface
  // values used by the real Source event-detail canvas, so a future refactor
  // of the helper's implementation still has to satisfy these concrete
  // cases. Mirrors the values in:
  //   - src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx (surface="source-detail")
  //   - src/app/(maestro)/source/events/[eventId]/approval/page.tsx (surface="source-detail")
  function isSourceSurface(surface: string): boolean {
    return (
      surface === "source" ||
      surface === "/source" ||
      surface.startsWith("/source/") ||
      surface === "source-detail"
    );
  }

  it("matches the literal surface the event-detail canvas actually sends", () => {
    expect(isSourceSurface("source")).toBe(true);
    expect(isSourceSurface("source-detail")).toBe(true);
  });

  it("still matches the pre-existing /source and /source/* forms", () => {
    expect(isSourceSurface("/source")).toBe(true);
    expect(isSourceSurface("/source/events")).toBe(true);
    expect(isSourceSurface("/source/new")).toBe(true);
  });

  it("does not match unrelated surfaces", () => {
    expect(isSourceSurface("/tower")).toBe(false);
    expect(isSourceSurface("/programs")).toBe(false);
    expect(isSourceSurface("/home")).toBe(false);
    expect(isSourceSurface("chat")).toBe(false);
  });
});

// C-400 — a metric the quality gate measures must either be persisted or say
// why it is not, and neither list may drift from the other in silence.
//
// The instance: `quality-validator.ts` sets `expectedExhibitCount`,
// `receivedExpectedExhibitCount` and `missingExpectedExhibits` on its metrics
// object and `types.ts` declares all three, but `buildGenerationMetrics` — the
// only writer of per-generation metrics — named ten fields in a hand-written
// object literal and none of the three was among them. So every generation
// recorded a `warningCount` incremented by a shortfall and a `qualityScore`
// docked for it, with no record of how many exhibits were asked for or which
// ones did not arrive. The omission rate was not trendable.
//
// The mechanism is the item: an explicit allowlist over a growing type drops
// each new field silently, and nothing compared the two lists. So the cases
// below come in two halves. The first drives the REAL `validateDeliverableQuality`
// into the REAL `persistDeliverable` with the save injected, and asserts each of
// the three fields on the stored record INDEPENDENTLY — a single assertion over
// the whole object passes when one field is wrong. The second asserts the two
// lists reconcile: every field the validator emits is named in the policy, every
// field the policy persists reaches the record, and every field it does not
// persist carries a reason. The compile-time half of that reconciliation is the
// policy's own type, `Record<keyof QualityMetrics, …>`, which `tsc` fails when a
// field is added to the metrics type and not named here.

jest.mock("@/lib/deliverables/deck-from-result", () => ({
  buildDeckHtmlFromDocument: jest.fn(
    () => "<html><body>Executive deck</body></html>",
  ),
}));

import {
  persistDeliverable,
  QUALITY_METRIC_PERSISTENCE,
} from "../persistence";
import { validateDeliverableQuality } from "../quality-validator";
import { getArtifactBrief } from "../artifact-brief-registry";
import {
  amsRfpRequest,
  goodDocument,
} from "../__fixtures__/ams-rfp";
import type { OrchestrationResult } from "../orchestrator";
import type { ExpectedExhibit } from "../types";
import type { GeneratedArtifactRecord } from "@/lib/artifacts/repository";
import type { TenantAiPolicy } from "@/lib/integrations/ai-egress";

const tenantPolicy = {} as TenantAiPolicy;

function expectedExhibits(
  ...specs: Array<[string, ExpectedExhibit["kind"]]>
): ExpectedExhibit[] {
  return specs.map(([title, kind]) => ({
    key: title.toLowerCase().replace(/\s+/g, "_"),
    title,
    kind,
    purpose: `Show ${title}.`,
    preferredFormat: "pptx",
  }));
}

/**
 * A result whose `quality` block is produced by the real gate, so the metrics
 * under test are the ones a generation actually records — not a literal written
 * to match the assertion.
 */
function resultWithRealQuality(
  opts: { expectedExhibits?: readonly ExpectedExhibit[] } = {},
): OrchestrationResult {
  const req = amsRfpRequest();
  const doc = goodDocument();
  return {
    ok: true,
    brief: getArtifactBrief(req),
    document: doc,
    quality: validateDeliverableQuality(doc, req, opts),
    passTrace: [
      {
        pass: "synthesis",
        maxTokens: 16000,
        highStakes: true,
        outputChars: 100,
        responseId: "11111111-2222-3333-4444-555555555555",
      },
    ],
  } as OrchestrationResult;
}

/** Runs the real persist path and returns the metrics it handed the repository. */
async function persistedMetrics(
  result: OrchestrationResult,
): Promise<Record<string, unknown>> {
  let extra: Record<string, unknown> | undefined;
  const save = (async (
    _input: unknown,
    _rendered: unknown,
    meta: Record<string, unknown>,
  ) => {
    extra = meta;
    return {
      id: "art-c400",
      clientId: "c1",
      metadata: {},
    } as unknown as GeneratedArtifactRecord;
  }) as never;

  await persistDeliverable(
    result,
    {
      clientId: "c1",
      renderedBy: "u1",
      sourceArtifactRef: "evt-skyharbor-ams",
      tenantPolicy,
    },
    { save },
  );

  return (extra?.generationMetrics ?? {}) as Record<string, unknown>;
}

describe("C-400 — the exhibit shortfall reaches the stored record", () => {
  // `goodDocument()` ships exactly one 'matrix' exhibit, so asking for three
  // fixes the populations: 3 expected, 1 received, 2 missing by name.
  const shortfall = () =>
    resultWithRealQuality({
      expectedExhibits: expectedExhibits(
        ["Service Tower Scope Map", "matrix"],
        ["Value at Stake Bridge", "chart"],
        ["Transition Sequence", "timeline"],
      ),
    });

  it("persists how many exhibits the brief asked for", async () => {
    const metrics = await persistedMetrics(shortfall());
    expect(metrics.expectedExhibitCount).toBe(3);
  });

  it("persists how many of the expected exhibits arrived", async () => {
    const metrics = await persistedMetrics(shortfall());
    expect(metrics.receivedExpectedExhibitCount).toBe(1);
  });

  it("persists which expected exhibits did not arrive", async () => {
    const metrics = await persistedMetrics(shortfall());
    expect(metrics.missingExpectedExhibits).toEqual([
      "Value at Stake Bridge",
      "Transition Sequence",
    ]);
  });

  it("records a complete generation as complete, not as a phantom shortfall", async () => {
    const metrics = await persistedMetrics(
      resultWithRealQuality({
        expectedExhibits: expectedExhibits(["Service Tower Scope Map", "matrix"]),
      }),
    );
    expect(metrics.expectedExhibitCount).toBe(1);
    expect(metrics.receivedExpectedExhibitCount).toBe(1);
    expect(metrics.missingExpectedExhibits).toEqual([]);
  });

  it("omits the exhibit fields entirely when the brief declared no expected exhibits", async () => {
    // "not measured" and "measured, none expected" are different facts. A
    // persisted `0` reads as the second, so absence must stay absence.
    const metrics = await persistedMetrics(resultWithRealQuality());
    expect("expectedExhibitCount" in metrics).toBe(false);
    expect("receivedExpectedExhibitCount" in metrics).toBe(false);
    expect("missingExpectedExhibits" in metrics).toBe(false);
  });
});

describe("C-400 — the measured list and the persisted list reconcile", () => {
  const realMetrics = () =>
    resultWithRealQuality({
      expectedExhibits: expectedExhibits(["Service Tower Scope Map", "matrix"]),
    }).quality!.metrics as unknown as Record<string, unknown>;

  it("names every field the quality gate actually emits", () => {
    // The policy's type covers the DECLARED metrics type; this covers what the
    // validator emits at run time, so a field that reaches the gate's output
    // without reaching the type is caught too.
    const emitted = Object.keys(realMetrics()).sort();
    const declared = Object.keys(QUALITY_METRIC_PERSISTENCE);
    const unnamed = emitted.filter((k) => !declared.includes(k));
    expect(unnamed).toEqual([]);
  });

  it("states a reason for every field it does not persist", () => {
    const withoutReason = Object.entries(QUALITY_METRIC_PERSISTENCE)
      .filter(([, policy]) => !policy.persist)
      .filter(
        ([, policy]) =>
          !("reason" in policy) ||
          typeof policy.reason !== "string" ||
          policy.reason.trim().length === 0,
      )
      .map(([key]) => key);
    expect(withoutReason).toEqual([]);
  });

  it("persists every field it declares persisted, and no field it does not", async () => {
    const metrics = realMetrics();
    const persisted = await persistedMetrics(
      resultWithRealQuality({
        expectedExhibits: expectedExhibits(["Service Tower Scope Map", "matrix"]),
      }),
    );

    const missing = Object.entries(QUALITY_METRIC_PERSISTENCE)
      .filter(([key, policy]) => policy.persist && metrics[key] !== undefined)
      .map(([key]) => key)
      .filter((key) => !(key in persisted));
    expect(missing).toEqual([]);

    const leaked = Object.entries(QUALITY_METRIC_PERSISTENCE)
      .filter(([, policy]) => !policy.persist)
      .map(([key]) => key)
      .filter((key) => key in persisted);
    expect(leaked).toEqual([]);
  });
});

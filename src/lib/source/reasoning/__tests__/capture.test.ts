import { captureReasoningEnvelope } from "@/lib/source/reasoning/capture";
import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";

function ctxFixture(): SourceGenerationContext {
  return {
    tenantKey: "arcturus",
    tenantName: "First Capital Financial",
    event: {
      id: "evt_1",
      code: "ARCT-AMS-SOURCING-EVENT-2026",
      name: "Core Banking Application Management Services",
      archetype: "managed_service",
      rigor: "strategic",
      currentStageKey: "strategy",
      statusLabel: "Waiting on client",
      owner: "CIO",
      triggerDescription: "Incumbent core-banking AMS contract approaches renewal.",
      scopeDescription: "Run/maintain and enhancement for the FIS Profile AMS towers.",
      estimatedValueUsd: 14_000_000,
    },
    artifactStates: [],
    gateCriteria: [],
    evidence: [],
  } as unknown as SourceGenerationContext;
}

const opts = (enabled: boolean) => ({
  enabled,
  envelopeId: "env_1",
  now: "2026-06-19T12:00:00.000Z",
});

describe("captureReasoningEnvelope (Slice 1.6)", () => {
  it("is a no-op when the flag is disabled (legacy path)", () => {
    const r = captureReasoningEnvelope(ctxFixture(), opts(false));
    expect(r.status).toBe("disabled");
    expect(r.envelope).toBeNull();
  });

  it("captures a VALIDATED envelope when enabled", () => {
    const r = captureReasoningEnvelope(ctxFixture(), opts(true));
    // With no usable evidence yet, the spine honestly produces a refusal envelope,
    // which is itself gate-valid — so capture returns it as "ok".
    expect(r.status).toBe("ok");
    expect(r.envelope).not.toBeNull();
    expect(r.envelope!.envelopeId).toBe("env_1");
    expect(r.envelope!.refusal).toBeDefined();
  });

  it("never throws — a malformed context degrades to a status, not an exception", () => {
    const broken = { event: {} } as unknown as SourceGenerationContext;
    const r = captureReasoningEnvelope(broken, opts(true));
    expect(["error", "gate_failed", "ok"]).toContain(r.status);
    // On any non-ok, the envelope is null so the route generates as today.
    if (r.status !== "ok") expect(r.envelope).toBeNull();
  });
});

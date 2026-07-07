import { captureReasoningEnvelope } from "@/lib/source/reasoning/capture";
import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";

function ctxFixture(overrides?: Partial<SourceGenerationContext["event"]>): SourceGenerationContext {
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
      ...overrides,
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

describe("captureReasoningEnvelope (Slices 1.6 + 1.7)", () => {
  it("is a no-op when the flag is disabled (legacy path)", () => {
    const r = captureReasoningEnvelope(ctxFixture(), opts(false));
    expect(r.status).toBe("disabled");
    expect(r.envelope).toBeNull();
  });

  it("returns status=refusal with a non-null envelope when no usable evidence exists (Slice 1.7)", () => {
    const r = captureReasoningEnvelope(ctxFixture(), opts(true));
    // No evidence loaded → recommendation stage fires grounded refusal path.
    // Slice 1.7: status is "refusal" (not "ok") so callers can distinguish.
    expect(r.status).toBe("refusal");
    expect(r.envelope).not.toBeNull();
    expect(r.envelope!.envelopeId).toBe("env_1");
    // Refusal branch is set; claims are empty.
    expect(r.envelope!.refusal).toBeDefined();
    expect(r.envelope!.claims).toHaveLength(0);
  });

  it("refusal envelope carries archetype and confidence (spine ran successfully)", () => {
    const r = captureReasoningEnvelope(ctxFixture(), opts(true));
    expect(r.status).toBe("refusal");
    const env = r.envelope!;
    // Archetype resolved from event attributes.
    expect(typeof env.archetype).toBe("string");
    expect(env.archetype).not.toBe("");
    // Confidence band is always present.
    expect(env.confidence).toBeDefined();
    expect(["low", "moderate", "high"]).toContain(env.confidence.label);
  });

  it("refusal.missingEvidence is an array (may be empty when evidenceGaps not set)", () => {
    const r = captureReasoningEnvelope(ctxFixture(), opts(true));
    expect(r.status).toBe("refusal");
    expect(Array.isArray(r.envelope!.refusal!.missingEvidence)).toBe(true);
  });

  it("never throws — a malformed context degrades to a status, not an exception", () => {
    const broken = { event: {} } as unknown as SourceGenerationContext;
    const r = captureReasoningEnvelope(broken, opts(true));
    // Any of these statuses is acceptable from a broken context.
    expect(["error", "gate_failed", "ok", "refusal"]).toContain(r.status);
    // Envelope is null for gate_failed/error; non-null for ok/refusal.
    if (r.status === "gate_failed" || r.status === "error") {
      expect(r.envelope).toBeNull();
    }
    if (r.status === "ok" || r.status === "refusal") {
      expect(r.envelope).not.toBeNull();
    }
  });

  it("status=ok only fires when claims are grounded (no refusal in envelope)", () => {
    // With no evidence loaded, the spine always returns refusal, not ok.
    // This test verifies the invariant: ok ↔ envelope.refusal is undefined.
    const r = captureReasoningEnvelope(ctxFixture(), opts(true));
    if (r.status === "ok") {
      expect(r.envelope!.refusal).toBeUndefined();
      expect(r.envelope!.claims.length).toBeGreaterThan(0);
    }
    if (r.status === "refusal") {
      expect(r.envelope!.refusal).toBeDefined();
    }
  });

  describe("Slice 1.8 — envelope shape satisfies source_reasoning_envelopes insert contract", () => {
    it("envelope has all fields required for the persistence insert", () => {
      const r = captureReasoningEnvelope(ctxFixture(), opts(true));
      // Only ok/refusal produce non-null envelopes that get persisted.
      if (r.status !== "ok" && r.status !== "refusal") return;
      const env = r.envelope!;

      // Primary key fields.
      expect(typeof env.envelopeId).toBe("string");
      expect(env.envelopeId.length).toBeGreaterThan(0);
      expect(typeof env.eventId).toBe("string");
      expect(typeof env.tenantKey).toBe("string");
      expect(typeof env.stage).toBe("string");

      // Extracted columns.
      expect(typeof env.archetype).toBe("string");
      expect(typeof env.rigor).toBe("string");
      expect(env.confidence).toBeDefined();
      expect(["low", "moderate", "high"]).toContain(env.confidence.label);
      expect(typeof env.confidence.score).toBe("number");

      // Refusal branch fields (present when status = "refusal").
      if (r.status === "refusal") {
        expect(typeof env.refusal!.reason).toBe("string");
        expect(Array.isArray(env.refusal!.missingEvidence)).toBe(true);
        // Each missingEvidence entry has a requirement field (used as the DB column).
        if (env.refusal!.missingEvidence!.length > 0) {
          expect(typeof env.refusal!.missingEvidence![0].requirement).toBe("string");
        }
      }

      // Claims array is always present (empty for refusal, non-empty for ok).
      expect(Array.isArray(env.claims)).toBe(true);
      if (r.status === "ok") {
        expect(env.claims.length).toBeGreaterThan(0);
      } else {
        expect(env.claims).toHaveLength(0);
      }
    });

    it("CaptureStatus 'disabled' never produces an envelope (never inserted)", () => {
      const r = captureReasoningEnvelope(ctxFixture(), opts(false));
      expect(r.status).toBe("disabled");
      expect(r.envelope).toBeNull();
    });
  });

  describe("Slice 1.1 — pre-classified archetype from intake flows into envelope", () => {
    it("envelope.archetype uses classifiedCategory when set (preferred over live classifier)", () => {
      // Simulate an event that was classified at intake as 'erp_si'.
      const ctxWithPreClassified = ctxFixture({
        archetype: "managed_service",   // coarse legacy label
        classifiedCategory: "erp_si",  // precise category stored at intake
      } as unknown as Partial<Parameters<typeof ctxFixture>[0]>);
      const r = captureReasoningEnvelope(ctxWithPreClassified, opts(true));
      if (r.status !== "ok" && r.status !== "refusal") return;
      // recommendation-stage.ts prefers classifiedCategory → envelope.archetype = "erp_si"
      expect(r.envelope!.archetype).toBe("erp_si");
    });

    it("falls back to live classifier when classifiedCategory is null", () => {
      // No pre-classified category; the live classifier runs and produces a categoryId.
      const r = captureReasoningEnvelope(ctxFixture(), opts(true));
      if (r.status !== "ok" && r.status !== "refusal") return;
      // archetype is whatever the live classifier resolved (not null/unknown from the fallback).
      expect(r.envelope!.archetype).toBeTruthy();
      expect(r.envelope!.archetype).not.toBe("unknown");
    });
  });
});

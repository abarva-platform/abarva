import { validateEnvelope } from "@/lib/source/reasoning/envelope-gate";
import type {
  ConfidenceBand,
  EvidenceRef,
  ReasoningEnvelope,
} from "@/lib/source/reasoning/reasoning-envelope";

const band = (label: ConfidenceBand["label"] = "moderate"): ConfidenceBand => ({
  label,
  score: 0.6,
  interval: [0.5, 0.7],
  factors: {
    evidenceSufficiency: 0.6,
    evidenceRecency: 0.7,
    corroboration: 0.5,
    modelUncertainty: 0.4,
  },
});

const usableEvidence: EvidenceRef = {
  id: "ev1",
  sourceArtifactCode: "d05_scope_memo",
  citation: "FY-Contract.pdf · §3 SLA schedule",
  readinessState: "Usable Evidence",
};

function baseEnvelope(
  overrides: Partial<ReasoningEnvelope> = {},
): ReasoningEnvelope {
  return {
    envelopeId: "env_1",
    eventId: "evt_1",
    tenantKey: "arcturus",
    stage: "strategy",
    archetype: "managed_service",
    rigor: "strategic",
    evidence: [usableEvidence],
    claims: [
      {
        id: "c1",
        text: "The incumbent AMS contract auto-renews Aug 31, 2026.",
        supportedBy: ["ev1"],
        confidence: band(),
        challenged: true,
        gateDefining: true,
      },
    ],
    assumptions: [],
    confidence: band("high"),
    caveats: [],
    decisionTrace: [],
    ...overrides,
  };
}

describe("validateEnvelope", () => {
  it("passes a well-formed envelope (every claim supported)", () => {
    const result = validateEnvelope(baseEnvelope());
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("KEYSTONE: a claim with empty supportedBy is a FAILURE, not a warning", () => {
    const env = baseEnvelope({
      claims: [
        {
          id: "c1",
          text: "We can hit a 29% savings target.",
          supportedBy: [],
          confidence: band(),
          challenged: false,
        },
      ],
    });
    const result = validateEnvelope(env);
    expect(result.ok).toBe(false);
    expect(result.failures.map((f) => f.kind)).toContain("unsupported_claim");
    expect(result.failures[0]!.claimId).toBe("c1");
  });

  it("flags a claim that cites an evidence ref not in the envelope", () => {
    const env = baseEnvelope({
      claims: [
        {
          id: "c1",
          text: "Run-rate is ~$14M/yr.",
          supportedBy: ["ev_missing"],
          confidence: band(),
          challenged: false,
        },
      ],
    });
    const result = validateEnvelope(env);
    expect(result.ok).toBe(false);
    expect(result.failures.map((f) => f.kind)).toContain(
      "dangling_evidence_ref",
    );
  });

  it("requires a gate-defining claim to rest on Usable Evidence", () => {
    const env = baseEnvelope({
      evidence: [{ ...usableEvidence, readinessState: "Loaded" }],
      claims: [
        {
          id: "c1",
          text: "Sponsor has committed to the event.",
          supportedBy: ["ev1"],
          confidence: band(),
          challenged: true,
          gateDefining: true,
        },
      ],
    });
    const result = validateEnvelope(env);
    expect(result.ok).toBe(false);
    expect(result.failures.map((f) => f.kind)).toContain(
      "gate_claim_below_usable",
    );
  });

  it("a non-gate-defining claim on non-usable evidence still passes if supported", () => {
    const env = baseEnvelope({
      evidence: [{ ...usableEvidence, readinessState: "Parsed" }],
      claims: [
        {
          id: "c1",
          text: "Ticket volume trends upward in Q3.",
          supportedBy: ["ev1"],
          confidence: band(),
          challenged: false,
          gateDefining: false,
        },
      ],
    });
    expect(validateEnvelope(env).ok).toBe(true);
  });

  it("catches an internal term leaking into reasoning text", () => {
    const env = baseEnvelope({
      caveats: [
        { id: "cv1", text: "Bounded by tenantKey arcturus substrate coverage." },
      ],
    });
    const result = validateEnvelope(env);
    expect(result.ok).toBe(false);
    expect(result.failures.map((f) => f.kind)).toContain(
      "leaked_internal_term",
    );
  });

  it("accepts a refusal envelope with a reason + minimum-data request", () => {
    const env = baseEnvelope({
      claims: [],
      refusal: {
        reason:
          "Vendor contracts and IT financials are not loaded to usable evidence.",
        missingEvidence: [
          { requirement: "vendor_contracts", currentState: "Requested" },
        ],
        minimumDataRequest:
          "Upload the incumbent AMS contract and the FY IT financials.",
      },
    });
    expect(validateEnvelope(env).ok).toBe(true);
  });

  it("rejects a refusal envelope missing its minimum-data request", () => {
    const env = baseEnvelope({
      claims: [],
      refusal: {
        reason: "Insufficient evidence.",
        missingEvidence: [],
        minimumDataRequest: "",
      },
    });
    const result = validateEnvelope(env);
    expect(result.ok).toBe(false);
    expect(result.failures.map((f) => f.kind)).toContain("refusal_incomplete");
  });
});

// Airline IROPS-recovery Function Pack — resolution, depth, and the end-to-end
// identity path (industry code → key → classify → bind) that unblocks a freshly
// originated SkyHarbor airline Move.

import { resolveFunctionPack } from "../function-pack-registry";
import {
  FUNCTION_PACK_DEPTH_MINIMUMS,
  REQUIRED_DELIVERABLE_ARTIFACTS,
} from "../function-pack-types";
import {
  classifyFunctionKey,
  industryKeyForCode,
  resolveMoveFunctionIdentity,
} from "../../../function-identity";

const IROPS_BRIEF =
  "Proactive IROPS passenger recovery for a global network airline: when irregular " +
  "operations (weather, ATC, crew, mechanical) cause cancellations and misconnects, " +
  "re-accommodate disrupted passengers proactively with self-service rebooking, " +
  "value and vulnerability triage, and policy-governed compensation.";

describe("airline IROPS-recovery function pack", () => {
  it("resolves from the catalog with the right keys", () => {
    const pack = resolveFunctionPack("airline", "irops_recovery");
    expect(pack).not.toBeNull();
    expect(pack!.industryKey).toBe("airline");
    expect(pack!.functionKey).toBe("irops_recovery");
    expect(pack!.functionLabel).toMatch(/IROPS/i);
  });

  it("meets the reference depth minimums", () => {
    const p = resolveFunctionPack("airline", "irops_recovery")!;
    const m = FUNCTION_PACK_DEPTH_MINIMUMS;
    expect(p.operatingMetrics.length).toBeGreaterThanOrEqual(
      m.operatingMetrics,
    );
    expect(p.painThemes.length).toBeGreaterThanOrEqual(m.painThemes);
    expect(p.aiUseCaseArchetypes.length).toBeGreaterThanOrEqual(
      m.aiUseCaseArchetypes,
    );
    expect(p.referenceSolutionPatterns.length).toBeGreaterThanOrEqual(
      m.referenceSolutionPatterns,
    );
    expect(p.evidenceAnchors.length).toBeGreaterThanOrEqual(m.evidenceAnchors);
    // all four phase artifacts are outlined
    const artifacts = new Set(p.deliverableOutlines.map((o) => o.artifact));
    for (const a of REQUIRED_DELIVERABLE_ARTIFACTS)
      expect(artifacts.has(a)).toBe(true);
  });

  it("every archetype moves only real operating metrics", () => {
    const p = resolveFunctionPack("airline", "irops_recovery")!;
    const metricKeys = new Set(p.operatingMetrics.map((om) => om.key));
    for (const arch of p.aiUseCaseArchetypes) {
      for (const k of arch.metricsMoved) expect(metricKeys.has(k)).toBe(true);
    }
  });

  it("benchmarks are labelled planning ranges (never asserted facts)", () => {
    const p = resolveFunctionPack("airline", "irops_recovery")!;
    for (const om of p.operatingMetrics) {
      expect(om.benchmarkRange.label).toBe("planning-range");
      expect(om.benchmarkRange.basis.length).toBeGreaterThan(3);
    }
  });

  it("maps the airline industry codes to the airline key", () => {
    for (const code of [
      "global_network_airline",
      "GLOBAL_NETWORK_AIRLINE",
      "airline",
      "air_transport",
      "aviation",
    ]) {
      expect(industryKeyForCode(code)).toBe("airline");
    }
    expect(industryKeyForCode("space_tourism")).toBeNull();
  });

  it("classifies an IROPS brief to irops_recovery", () => {
    const classified = classifyFunctionKey("airline", IROPS_BRIEF);
    expect(classified).not.toBeNull();
    expect(classified!.functionKey).toBe("irops_recovery");
  });

  it("resolves a fresh airline Move identity end-to-end (industry + persisted key → bind)", () => {
    // Mirrors what origination persists: industry code + charter.functionPackKey.
    const identity = resolveMoveFunctionIdentity({
      industry_code: "GLOBAL_NETWORK_AIRLINE",
      function_pack_key: null,
      charter: { functionPackKey: "irops_recovery" },
    });
    expect(identity).toEqual({
      industryKey: "airline",
      functionKey: "irops_recovery",
    });
  });

  it("an unbound airline Move (no persisted key) honestly resolves to null", () => {
    const identity = resolveMoveFunctionIdentity({
      industry_code: "GLOBAL_NETWORK_AIRLINE",
      function_pack_key: null,
      charter: {},
    });
    expect(identity).toBeNull();
  });
});

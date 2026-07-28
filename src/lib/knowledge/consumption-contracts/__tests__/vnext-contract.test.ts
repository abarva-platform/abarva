/**
 * Contract tests for the Knowledge vNext consumption layer.
 * - fixtures validate against the shared contract;
 * - unknown availability states fail;
 * - missing baseline/version fields fail;
 * - candidate data cannot be labeled as published;
 * - withheld evidence content cannot leak.
 */

import {
  AVAILABILITY_STATES,
  envelopeMetaSchema,
  findContentSafetyViolations,
  PROJECTION_CONTRACT_VERSION,
} from "..";

const VALID_META = {
  tenantKey: "fixture-airline-demo-new",
  knowledgeBaselineRef: "kb-x",
  domainPublicationVersions: { enterprise: "pub-1" },
  projectionName: "consumption.enterprise_brief_v1",
  projectionContractVersion: PROJECTION_CONTRACT_VERSION,
  asOf: "2026-07-27T00:00:00.000Z",
  contentHash: "sha-fx-0001",
  authorityState: "published",
  availabilityState: "available",
  freshnessState: "fresh",
  evidenceRefs: [],
  knownGapRefs: [],
  warnings: [],
} as const;

describe("envelope contract", () => {
  it("accepts a valid envelope meta", () => {
    expect(envelopeMetaSchema.safeParse(VALID_META).success).toBe(true);
  });

  it("rejects an unknown availability state", () => {
    const bad = { ...VALID_META, availabilityState: "totally_made_up" };
    expect(envelopeMetaSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a missing knowledgeBaselineRef", () => {
    const rest: Record<string, unknown> = { ...VALID_META };
    delete rest.knowledgeBaselineRef;
    expect(envelopeMetaSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects a missing projectionContractVersion", () => {
    const rest: Record<string, unknown> = { ...VALID_META };
    delete rest.projectionContractVersion;
    expect(envelopeMetaSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an unknown extra top-level field (strict)", () => {
    const bad = { ...VALID_META, rawColumnLeak: "secret" };
    expect(envelopeMetaSchema.safeParse(bad).success).toBe(false);
  });

  it("enumerates exactly the ten contract availability states", () => {
    expect([...AVAILABILITY_STATES].sort()).toEqual(
      [
        "accepted", "available", "candidate", "conflicting", "not_applicable",
        "not_loaded", "not_measured", "stale", "superseded", "withheld",
      ].sort(),
    );
  });
});

describe("content-safety", () => {
  it("flags candidate availability carrying published authority", () => {
    const v = findContentSafetyViolations({
      authorityState: "published",
      availabilityState: "candidate",
      data: {},
    });
    expect(v.length).toBeGreaterThan(0);
  });

  it("flags withheld envelope that leaks a quote", () => {
    const v = findContentSafetyViolations({
      authorityState: "accepted",
      availabilityState: "withheld",
      data: { quote: "this should never appear" },
    });
    expect(v.some((m) => m.includes("withheld"))).toBe(true);
  });

  it("does not flag a properly emptied withheld envelope", () => {
    const v = findContentSafetyViolations({
      authorityState: "accepted",
      availabilityState: "withheld",
      data: { perspectives: [], headlineMetrics: [] },
    });
    expect(v).toEqual([]);
  });
});

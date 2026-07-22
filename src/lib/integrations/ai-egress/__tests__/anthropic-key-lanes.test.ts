import {
  DEFAULT_KEY_LANE,
  describeKeyLaneCoverage,
  keyLaneAuditMetadata,
  laneForWorkloadOrDefault,
  resolveAnthropicKeyForLane,
} from "../anthropic-key-lanes";

const LANE_VARS = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_API_KEY_PROD_REALTIME",
  "ANTHROPIC_API_KEY_OFFLINE_GENERATION",
  "ANTHROPIC_API_KEY_QA_EVALUATION",
  "ANTHROPIC_API_KEY_ENGINEERING_SCRIPTS",
] as const;

describe("anthropic key lanes", () => {
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const name of LANE_VARS) {
      original[name] = process.env[name];
      delete process.env[name];
    }
  });

  afterEach(() => {
    for (const name of LANE_VARS) {
      if (original[name] === undefined) delete process.env[name];
      else process.env[name] = original[name];
    }
  });

  describe("workload to lane mapping", () => {
    it("routes interactive product workloads to prod-realtime", () => {
      expect(laneForWorkloadOrDefault("tower_answer")).toBe("prod-realtime");
      expect(laneForWorkloadOrDefault("intelligence_answer")).toBe(
        "prod-realtime",
      );
    });

    it("routes long-output generation to offline-generation", () => {
      expect(laneForWorkloadOrDefault("home_pack_narrative")).toBe(
        "offline-generation",
      );
      expect(laneForWorkloadOrDefault("moves_business_case")).toBe(
        "offline-generation",
      );
      expect(laneForWorkloadOrDefault("source_rfp")).toBe("offline-generation");
    });

    it("routes graders and pressure tests to qa-evaluation", () => {
      expect(laneForWorkloadOrDefault("eval_grading")).toBe("qa-evaluation");
      expect(laneForWorkloadOrDefault("qa_pressure_test")).toBe(
        "qa-evaluation",
      );
    });

    it("falls back to the default lane for unknown or absent workloads", () => {
      // An unlabelled call from the running product is far more likely to be
      // product traffic than a script; mislabelling it would understate the
      // number that actually matters.
      expect(laneForWorkloadOrDefault(undefined)).toBe(DEFAULT_KEY_LANE);
      expect(laneForWorkloadOrDefault(null)).toBe(DEFAULT_KEY_LANE);
      expect(laneForWorkloadOrDefault("not_a_real_workload")).toBe(
        DEFAULT_KEY_LANE,
      );
      expect(DEFAULT_KEY_LANE).toBe("prod-realtime");
    });
  });

  describe("key resolution", () => {
    it("falls back to the shared key so an unprovisioned rollout still works", () => {
      process.env.ANTHROPIC_API_KEY = "sk-shared";

      const resolved = resolveAnthropicKeyForLane("offline-generation");

      expect(resolved.apiKey).toBe("sk-shared");
      expect(resolved.lane).toBe("offline-generation");
      expect(resolved.envVar).toBe("ANTHROPIC_API_KEY");
      expect(resolved.usedSharedFallback).toBe(true);
    });

    it("prefers the lane key when provisioned", () => {
      process.env.ANTHROPIC_API_KEY = "sk-shared";
      process.env.ANTHROPIC_API_KEY_OFFLINE_GENERATION = "sk-offline";

      const resolved = resolveAnthropicKeyForLane("offline-generation");

      expect(resolved.apiKey).toBe("sk-offline");
      expect(resolved.envVar).toBe("ANTHROPIC_API_KEY_OFFLINE_GENERATION");
      expect(resolved.usedSharedFallback).toBe(false);
    });

    it("supports a partially provisioned rollout, lane by lane", () => {
      process.env.ANTHROPIC_API_KEY = "sk-shared";
      process.env.ANTHROPIC_API_KEY_QA_EVALUATION = "sk-qa";

      expect(resolveAnthropicKeyForLane("qa-evaluation").apiKey).toBe("sk-qa");
      expect(resolveAnthropicKeyForLane("prod-realtime").apiKey).toBe(
        "sk-shared",
      );
    });

    it("throws naming both variables when neither is set", () => {
      expect(() => resolveAnthropicKeyForLane("prod-realtime")).toThrow(
        /ANTHROPIC_API_KEY_PROD_REALTIME.*ANTHROPIC_API_KEY/s,
      );
    });
  });

  describe("audit metadata", () => {
    it("never carries the key value", () => {
      process.env.ANTHROPIC_API_KEY_PROD_REALTIME = "sk-super-secret-value";

      const metadata = keyLaneAuditMetadata(
        resolveAnthropicKeyForLane("prod-realtime"),
      );

      expect(JSON.stringify(metadata)).not.toContain("sk-super-secret-value");
      expect(metadata).toEqual({
        keyLane: "prod-realtime",
        keyEnvVar: "ANTHROPIC_API_KEY_PROD_REALTIME",
        keyLaneSeparated: true,
      });
    });

    it("marks the lane unseparated when it fell back to the shared key", () => {
      process.env.ANTHROPIC_API_KEY = "sk-shared";

      expect(
        keyLaneAuditMetadata(resolveAnthropicKeyForLane("qa-evaluation"))
          .keyLaneSeparated,
      ).toBe(false);
    });
  });

  describe("coverage reporting", () => {
    it("reports nothing separated when only the shared key exists", () => {
      process.env.ANTHROPIC_API_KEY = "sk-shared";

      const coverage = describeKeyLaneCoverage();

      expect(coverage.separatedCount).toBe(0);
      expect(coverage.totalCount).toBe(4);
      expect(coverage.fullySeparated).toBe(false);
    });

    it("reports partial coverage so a digest can state its attribution quality", () => {
      process.env.ANTHROPIC_API_KEY = "sk-shared";
      process.env.ANTHROPIC_API_KEY_PROD_REALTIME = "sk-a";
      process.env.ANTHROPIC_API_KEY_OFFLINE_GENERATION = "sk-b";

      const coverage = describeKeyLaneCoverage();

      expect(coverage.separatedCount).toBe(2);
      expect(coverage.fullySeparated).toBe(false);
      expect(
        coverage.lanes.find((l) => l.lane === "qa-evaluation")?.separated,
      ).toBe(false);
    });

    it("reports full coverage only when every lane has its own key", () => {
      process.env.ANTHROPIC_API_KEY_PROD_REALTIME = "sk-a";
      process.env.ANTHROPIC_API_KEY_OFFLINE_GENERATION = "sk-b";
      process.env.ANTHROPIC_API_KEY_QA_EVALUATION = "sk-c";
      process.env.ANTHROPIC_API_KEY_ENGINEERING_SCRIPTS = "sk-d";

      expect(describeKeyLaneCoverage().fullySeparated).toBe(true);
    });
  });
});

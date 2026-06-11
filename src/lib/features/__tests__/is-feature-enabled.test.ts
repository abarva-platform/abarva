import { afterEach, describe, it, expect } from "@jest/globals";
import { isFeatureEnabled } from "../is-feature-enabled";

describe("isFeatureEnabled · A3 feature-flag contract", () => {
  const originalEnv = process.env.ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS;
    } else {
      process.env.ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS = originalEnv;
    }
  });

  describe("platform-default flags", () => {
    it("is on for every tenant by default", () => {
      expect(
        isFeatureEnabled({ clientKey: "apexretail" }, "intelligence_brief_v4"),
      ).toBe(true);
      expect(
        isFeatureEnabled({ clientKey: "meridian" }, "intelligence_brief_v4"),
      ).toBe(true);
      expect(
        isFeatureEnabled({ clientKey: "arcturus" }, "intelligence_brief_v4"),
      ).toBe(true);
    });

    it("is on when the context is missing a tenant key", () => {
      // Platform-default flags don't require a tenant; they're for everyone.
      expect(isFeatureEnabled(null, "intelligence_brief_v4")).toBe(true);
      expect(isFeatureEnabled({}, "intelligence_brief_v4")).toBe(true);
    });
  });

  describe("tenant-default flags", () => {
    it("is off for tenants not in includeTenants", () => {
      expect(
        isFeatureEnabled(
          { clientKey: "apexretail" },
          "first_capital_substrate_overlay",
        ),
      ).toBe(false);
      expect(
        isFeatureEnabled(
          { clientKey: "meridian" },
          "first_capital_substrate_overlay",
        ),
      ).toBe(false);
    });

    it("is on for tenants in includeTenants", () => {
      expect(
        isFeatureEnabled(
          { clientKey: "arcturus" },
          "first_capital_substrate_overlay",
        ),
      ).toBe(true);
    });

    it("is off when the context is missing a tenant key", () => {
      // Tenant-default flags fail closed without a resolved tenant.
      expect(isFeatureEnabled(null, "first_capital_substrate_overlay")).toBe(
        false,
      );
      expect(isFeatureEnabled({}, "first_capital_substrate_overlay")).toBe(
        false,
      );
    });

    it("can be enabled per tenant through a lab env override", () => {
      process.env.ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS = "apexretail";

      expect(
        isFeatureEnabled({ clientKey: "apexretail" }, "retrieval_azure_search"),
      ).toBe(true);
      expect(
        isFeatureEnabled({ clientKey: "meridian" }, "retrieval_azure_search"),
      ).toBe(false);
      expect(
        isFeatureEnabled({ clientKey: "arcturus" }, "retrieval_azure_search"),
      ).toBe(false);
    });

    it("accepts Azure canonical tenant keys in the lab env override", () => {
      process.env.ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS =
        "apex-retail, meridian-health, first-capital";

      expect(
        isFeatureEnabled({ clientKey: "apexretail" }, "retrieval_azure_search"),
      ).toBe(true);
      expect(
        isFeatureEnabled({ clientKey: "meridian" }, "retrieval_azure_search"),
      ).toBe(true);
      expect(
        isFeatureEnabled({ clientKey: "arcturus" }, "retrieval_azure_search"),
      ).toBe(true);
    });

    it("accepts Azure canonical tenant keys in the caller context", () => {
      process.env.ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS = "apexretail";

      expect(
        isFeatureEnabled(
          { clientKey: "apex-retail" },
          "retrieval_azure_search",
        ),
      ).toBe(true);
      expect(
        isFeatureEnabled({ clientId: "apex-retail" }, "retrieval_azure_search"),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "meridian-health" },
          "retrieval_azure_search",
        ),
      ).toBe(false);
    });
  });

  describe("skyharbor-air alias · moves_orchestrated_deliverables", () => {
    const ENV = "ABARVA_FEATURE_MOVES_ORCHESTRATED_DELIVERABLES_TENANTS";
    afterEach(() => {
      delete process.env[ENV];
    });

    it("is off for SkyHarbor by default (tenant flag, empty includeTenants)", () => {
      expect(
        isFeatureEnabled(
          { clientKey: "skyharbor" },
          "moves_orchestrated_deliverables",
        ),
      ).toBe(false);
      expect(
        isFeatureEnabled(
          { clientKey: "skyharbor-air" },
          "moves_orchestrated_deliverables",
        ),
      ).toBe(false);
    });

    it("resolves the dashed skyharbor-air data-plane key to the skyharbor ClientKey via env override", () => {
      process.env[ENV] = "skyharbor";
      // A Move whose tenant_key is the dashed data-plane form still resolves.
      expect(
        isFeatureEnabled(
          { clientKey: "skyharbor-air" },
          "moves_orchestrated_deliverables",
        ),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientId: "skyharbor-air" },
          "moves_orchestrated_deliverables",
        ),
      ).toBe(true);
      // The canonical key resolves too; an unrelated tenant does not.
      expect(
        isFeatureEnabled(
          { clientKey: "skyharbor" },
          "moves_orchestrated_deliverables",
        ),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "apexretail" },
          "moves_orchestrated_deliverables",
        ),
      ).toBe(false);
    });
  });

  describe("unknown keys", () => {
    it("returns false rather than throwing", () => {
      // Casting to bypass the literal-union check — simulates a typo at a
      // call site that the type checker would normally catch.
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isFeatureEnabled({ clientKey: "apexretail" }, "made_up_flag" as any),
      ).toBe(false);
    });
  });
});

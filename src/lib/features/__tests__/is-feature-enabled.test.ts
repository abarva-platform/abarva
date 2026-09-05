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
      expect(
        isFeatureEnabled({ clientKey: "apexretail" }, "moves_phase_workspace_v2"),
      ).toBe(true);
      expect(
        isFeatureEnabled({ clientKey: "meridian" }, "moves_phase_workspace_v2"),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "apexretail" },
          "moves_ava_chat_hardening",
        ),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "meridian-health" },
          "moves_ava_chat_hardening",
        ),
      ).toBe(true);
    });

    it("is on when the context is missing a tenant key", () => {
      // Platform-default flags don't require a tenant; they're for everyone.
      expect(isFeatureEnabled(null, "intelligence_brief_v4")).toBe(true);
      expect(isFeatureEnabled({}, "intelligence_brief_v4")).toBe(true);
      expect(isFeatureEnabled(null, "moves_ava_chat_hardening")).toBe(true);
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
      expect(
        isFeatureEnabled(
          { clientKey: "meridian-health" },
          "tower_cxo_claude_story_blocks",
        ),
      ).toBe(true);
    });

    it("keeps the Tower Command Center on as the platform Tower surface", () => {
      expect(
        isFeatureEnabled({ clientKey: "meridian" }, "tower_command_center_v2"),
      ).toBe(true);
      expect(
        isFeatureEnabled({ clientKey: "skyharbor" }, "tower_command_center_v2"),
      ).toBe(true);
      expect(
        isFeatureEnabled({ clientKey: "arcturus" }, "tower_command_center_v2"),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "skyharbor-air" },
          "tower_command_center_v2",
        ),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "first-capital" },
          "tower_command_center_v2",
        ),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "apexretail" },
          "tower_command_center_v2",
        ),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "lakeshore" },
          "tower_command_center_v2",
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

    it("is on for SkyHarbor by default so board-grade Move validation hits the orchestrator", () => {
      expect(
        isFeatureEnabled(
          { clientKey: "skyharbor" },
          "moves_orchestrated_deliverables",
        ),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "skyharbor-air" },
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

  describe("Home KNOW LLM synthesis flag", () => {
    it("is enabled only for SkyHarbor, including the dashed data-plane tenant key", () => {
      expect(
        isFeatureEnabled({ clientKey: "skyharbor" }, "home_know_llm_synthesis"),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "skyharbor-air" },
          "home_know_llm_synthesis",
        ),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "apexretail" },
          "home_know_llm_synthesis",
        ),
      ).toBe(false);
    });
  });

  describe("Home KNOW consultant Claude synthesis flag", () => {
    it("is enabled for SkyHarbor and Lakeshore, including the dashed SkyHarbor data-plane tenant key", () => {
      expect(
        isFeatureEnabled({ clientKey: "skyharbor" }, "home_know_claude_synthesis"),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "skyharbor-air" },
          "home_know_claude_synthesis",
        ),
      ).toBe(true);
      expect(
        isFeatureEnabled({ clientKey: "lakeshore" }, "home_know_claude_synthesis"),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "apexretail" },
          "home_know_claude_synthesis",
        ),
      ).toBe(false);
    });
  });

  describe("Workspace Explorer flags", () => {
    const SOURCE_ENV = "ABARVA_FEATURE_WORKSPACE_EXPLORER_SOURCE_TENANTS";
    const MOVES_ENV = "ABARVA_FEATURE_WORKSPACE_EXPLORER_MOVES_TENANTS";

    afterEach(() => {
      delete process.env[SOURCE_ENV];
      delete process.env[MOVES_ENV];
    });

    it("keeps Source explorer tenant-gated while Moves explorer is platform default", () => {
      expect(
        isFeatureEnabled(
          { clientKey: "apexretail" },
          "workspace_explorer_source",
        ),
      ).toBe(false);
      expect(
        isFeatureEnabled(
          { clientKey: "arcturus" },
          "workspace_explorer_source",
        ),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "apexretail" },
          "workspace_explorer_moves",
        ),
      ).toBe(true);
    });

    it("enables Source through tenant env overrides without being needed for Moves", () => {
      process.env[SOURCE_ENV] = "apexretail";
      process.env[MOVES_ENV] = "skyharbor-air";

      expect(
        isFeatureEnabled(
          { clientKey: "apexretail" },
          "workspace_explorer_source",
        ),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "apexretail" },
          "workspace_explorer_moves",
        ),
      ).toBe(true);
      expect(
        isFeatureEnabled(
          { clientKey: "skyharbor-air" },
          "workspace_explorer_moves",
        ),
      ).toBe(true);
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

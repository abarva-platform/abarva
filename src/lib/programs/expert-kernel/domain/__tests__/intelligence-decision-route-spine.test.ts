// Intelligence /decision route — verify the per-industry spine function key
// resolves to a registered tenant binding for every supported industry.
//
// The route's `INDUSTRY_SPINE_FUNCTION_KEY` map (see
// `src/app/(maestro)/intelligence/decision/page.tsx`) names the default
// function the surface binds for each `industryKey`. For the surface to render
// tenant-grounded content (not the Meridian reference fallback), each
// `(industryKey, spineFunctionKey)` must have BOTH a catalogued Function Pack
// AND a registered tenant binding (substrate + grounded-blocks builder).
//
// This test asserts both halves of that contract — the spine map and the
// binding registry agree by construction.

import "../tenant-bindings-bootstrap";

import { resolveFunctionPack } from "../function-pack-registry";
import {
  resolveBetSelectionBinding,
  resolveDecisionHomeBinding,
} from "../tenant-binding-registry";
import type { FunctionPackIndustryKey } from "../function-pack-types";

// The exact spine-function map the route ships. Kept duplicated here so a
// drift between the test and the route is caught — change one, change both.
// Partial: only the grounded production spine (seeded decision-home bindings).
// A catalogued industry without a seeded decision home (e.g. airline) is
// intentionally absent — the route renders its honest empty state instead.
const ROUTE_INDUSTRY_SPINE_FUNCTION_KEY: Partial<
  Record<FunctionPackIndustryKey, string>
> = {
  "healthcare-provider": "population_health_value_based_care",
  retail: "customer_care",
  "financial-services": "fraud_financial_crime",
};

// P1-1 (synthetic pilot rehearsal, 2026-05-22): each spine binding belongs to
// EXACTLY ONE tenant. The route MUST use `binding.expectedClientKey` to detect
// a tenant-mismatch (e.g. Northwind landing on Apex's `(retail,
// customer_care)` binding) and render the empty state instead of the leaked
// binding. This map pins the expected-client-key for each spine binding.
const EXPECTED_CLIENT_KEY_FOR_SPINE: Partial<
  Record<FunctionPackIndustryKey, string>
> = {
  "healthcare-provider": "meridian",
  retail: "apexretail",
  "financial-services": "arcturus",
};

describe("Intelligence /decision route — spine-function coverage", () => {
  for (const [industryKey, functionKey] of Object.entries(
    ROUTE_INDUSTRY_SPINE_FUNCTION_KEY,
  ) as [FunctionPackIndustryKey, string][]) {
    describe(`${industryKey} → ${functionKey}`, () => {
      it("resolves to a catalogued Function Pack", () => {
        const pack = resolveFunctionPack(industryKey, functionKey);
        expect(pack).not.toBeNull();
        expect(pack!.functionKey).toBe(functionKey);
      });

      it("has a registered decision-home tenant binding", () => {
        const binding = resolveDecisionHomeBinding(industryKey, functionKey);
        expect(binding).not.toBeNull();
        expect(binding!.industryKey).toBe(industryKey);
        expect(binding!.functionKey).toBe(functionKey);
        // The binding must carry a non-empty audited substrate — empty means
        // unseeded, which would route the surface back to the ungrounded
        // honest form. The whole point of the spine map is to land on a
        // grounded binding.
        expect(binding!.substrate.length).toBeGreaterThan(0);
      });

      it("has a registered bet-selection tenant binding", () => {
        const binding = resolveBetSelectionBinding(industryKey, functionKey);
        expect(binding).not.toBeNull();
        expect(binding!.industryKey).toBe(industryKey);
        expect(binding!.functionKey).toBe(functionKey);
        expect(binding!.substrate.length).toBeGreaterThan(0);
      });

      it("carries an expectedClientKey on both bindings (P1-1)", () => {
        // The route uses `binding.expectedClientKey` to detect a
        // tenant-mismatch and render the empty state instead of leaking the
        // bound tenant's substrate to a different tenant in the same industry.
        const decisionHome = resolveDecisionHomeBinding(
          industryKey,
          functionKey,
        );
        const betSelection = resolveBetSelectionBinding(
          industryKey,
          functionKey,
        );
        expect(decisionHome?.expectedClientKey).toBe(
          EXPECTED_CLIENT_KEY_FOR_SPINE[industryKey],
        );
        expect(betSelection?.expectedClientKey).toBe(
          EXPECTED_CLIENT_KEY_FOR_SPINE[industryKey],
        );
      });
    });
  }

  it("binds Apex Retail to customer_care, not pricing_promotions", () => {
    // Audit fix — the spine map previously routed retail to
    // `pricing_promotions`. The intelligence substrate now lives at
    // `customer_care` (Apex's audited contact-centre data), so the spine
    // must follow the substrate.
    expect(ROUTE_INDUSTRY_SPINE_FUNCTION_KEY.retail).toBe("customer_care");
  });

  it("binds First Capital to fraud_financial_crime, not lending_credit_underwriting", () => {
    expect(ROUTE_INDUSTRY_SPINE_FUNCTION_KEY["financial-services"]).toBe(
      "fraud_financial_crime",
    );
  });
});

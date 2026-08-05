/**
 * Nexus Pricing Engine — PR4 effort/cost engine barrel.
 *
 * See each module's header comment for design rationale. This directory
 * does NOT import `expert-kernel/rate-card/`, `expert-kernel/effort-estimator.ts`,
 * `expert-kernel/business-case-compiler.ts`, or `workforce-economics/` — see
 * `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` §14.
 */
export * from "./types";
export * from "./money";
export * from "./rule-interpreter";
export * from "./model-registry";
export * from "./pack-loader";
export * from "./archetypes";
export * from "./activity-packs";
export * from "./rate-card-resolver";
export * from "./moves-rate-selection";
export * from "./moves-pricing-reference-pack";
export * from "./range-policy";
export * from "./scenarios";
export * from "./cost-engine";
export * from "./effort-engine";
export * from "./validation";
export * from "./snapshot-service";

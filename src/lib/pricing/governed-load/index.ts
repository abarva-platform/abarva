/**
 * Nexus Pricing Engine — PR3 governed-load pipeline barrel.
 *
 * See `types.ts` and each module's header comment for the design rationale.
 * This directory is an independent pipeline under `src/lib/pricing/` — it
 * does NOT import `template-registry.ts`, `buildValidatedAgentContextBundle`,
 * `expert-kernel/rate-card/`, or `workforce-economics/` (see
 * `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` §14).
 */
export * from "./types";
export * from "./constants";
export * from "./identity-keys";
export * from "./csv-parse";
export * from "./semantic-validation";
export * from "./reference-lookup";
export * from "./rate-card-diff";
export * from "./rate-card-import";
export * from "./coverage-report";
export * from "./governed-projection";
export * from "./client-profile-repository";
export * from "./client-profile-import";
export * from "./role-alias-import";
export * from "./technology-cost-import";

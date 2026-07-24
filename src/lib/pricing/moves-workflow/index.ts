/**
 * Nexus Pricing Engine — PR5 Moves Cost & Effort workflow barrel.
 *
 * Server-side services wiring PR4's effort/cost engine to a persisted,
 * per-Move draft workflow. See each module's header for design rationale.
 * This directory does not import `expert-kernel/rate-card/`,
 * `expert-kernel/effort-estimator.ts`,
 * `expert-kernel/business-case-compiler.ts`, or `workforce-economics/` — see
 * `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` §14.
 */
export * from "./types";
export * from "./estimate-repository";
export * from "./move-context-suggestions";
export * from "./validation-gate";
export * from "./config-service";
export * from "./execution-service";

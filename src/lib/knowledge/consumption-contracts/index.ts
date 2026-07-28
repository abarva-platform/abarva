/**
 * Home / Knowledge vNext consumption contracts — barrel export.
 *
 * Generated/authored to match the merged Phase 3C-2D contract package:
 *   clients/shared/20-phase3c2d-consumption-contracts/
 *
 * These are the ONLY types the Knowledge vNext UI may consume. Components must
 * not import raw source rows, legacy Home packs, V6/V7 demo packs, SkyHarbor
 * fixtures, or current Source/Moves/Tower operational tables.
 */

export * from "./states";
export * from "./core";
export * from "./metrics";
export * from "./queries";
export * from "./projections";
export * from "./relationships";
export * from "./ava";
export * from "./handoff";
export * from "./provider";
export * from "./schemas";
export * from "./review-package";

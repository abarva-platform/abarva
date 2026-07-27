/**
 * Consumption client — barrel. The provider boundary the Knowledge vNext UI
 * consumes. Components import from here (or the React context), never from
 * fixtures or raw data sources.
 */

export * from "./content-hash";
export * from "./envelope-factory";
export * from "./contract-fixture-provider";
export * from "./http-consumption-provider";
export * from "./ava-provider";
export * from "./factory";
export { ConsumptionRuntimeProvider, useConsumption } from "./context";
export type { ConsumptionSource } from "./context";
